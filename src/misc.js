import { moduleName } from "../sharedvision.js";
import { emitSharedVision } from "./socket.js";
import { updateAllTokens } from "./tokenLayer.js";
import { getOverridePermissions, getOverrideDispositions } from "./settings.js";

export async function onSetShareVision(data) {
    if (game.user.isGM == false) return;
    if (data.globalSharedVision != undefined) {
        let globalSharedVision;
        if (data.globalSharedVision == true) globalSharedVision = true;
        else if (data.globalSharedVision == false) globalSharedVision = false;
        else if (data.globalSharedVision == "toggle")
            globalSharedVision = !game.settings.get(moduleName, "enable");
        if (globalSharedVision != game.settings.get(moduleName, "enable")) {
            await game.settings.set(moduleName, "enable", globalSharedVision);
            shareVision(globalSharedVision);
            ui.controls.controls
                .find((controls) => controls.name == "token")
                .tools.find(
                    (tools) => tools.name == "enableSharedVision",
                ).active = globalSharedVision;
            ui.controls.render();
        }
    }
    if (data.disableAll != undefined) {
        let disableAll;
        if (data.disableAll == true) disableAll = true;
        else if (data.disableAll == false) disableAll = false;
        else if (data.disableAll == "toggle")
            disableAll = !game.settings.get(moduleName, "disableAll");

        if (disableAll != game.settings.get(moduleName, "disableAll")) {
            await game.settings.set(moduleName, "disableAll", disableAll);
            emitSharedVision(disableAll);
            ui.controls.controls
                .find((controls) => controls.name == "token")
                .tools.find(
                    (tools) => tools.name == "disableAllSharedVision",
                ).active = disableAll;
            ui.controls.render();
            updateAllTokens();
        }
    }
}

export async function shareVision(en) {
    await game.settings.set(moduleName, "enable", en);
    emitSharedVision(en);
    Hooks.call("ShareVision", { enable: en });
}

export async function disableAll(en) {
    await game.settings.set(moduleName, "disableAll", en);
    emitSharedVision(en);
    Hooks.call("ShareVision", { disableAll: en });
    updateAllTokens();
}

export async function initializeSources(updateSource = false) {
    canvas.perception.initialize({
        sight: { initialize: true, refresh: true },
        lighting: { refresh: true },
        sounds: { refresh: true },
        foreground: { refresh: true },
    });

    updateAllTokens();
}

export function getPermission(entity, permissionLevel) {
    return entity?.testUserPermission(game.user, permissionLevel);
}

export function isSharedVision(token) {
    if (game.user.isGM && canvas.tokens.controlled.length == 0) return false;
    if (game.settings.get(moduleName, "disableAll")) return false;
    let sharedVision = false;
    if (game.user.isGM == false && token.actor != null) {
        if (token.document.hidden) {
            if (token.actor.getFlag("SharedVision", "hidden") == false)
                return false;
        }

        if (game.settings.get(moduleName, "enable")) {
            sharedVision =
                token.actor.getFlag("SharedVision", "enable") != undefined
                    ? token.actor.getFlag("SharedVision", "enable")
                    : false;
        }

        if (sharedVision == false) {
            let userSetting = token.actor.getFlag(
                "SharedVision",
                "userSetting",
            );
            if (typeof userSetting === "object") {
                userSetting = Object.values(userSetting);
            }
            if (userSetting != undefined) {
                for (let setting of userSetting)
                    if (setting.id == game.userId) {
                        sharedVision = setting.vision;
                        break;
                    }
            }
        }

        if (sharedVision == false) {
            sharedVision = getOverride("vision", token);
        }
        return sharedVision;
    }
}

const permissionLevels = ["none", "limited", "observer", "owner"];
const dispositionTypes = ["hostile", "neutral", "friendly", "secret"];

export function getOverride(type, token) {
    const p = token.actor.permission;
    const d = token.document.disposition;
    let permission = permissionLevels[p];
    let disposition = dispositionTypes[d + 1];

    if (getOverridePermissions(permission, type)) return true;
    if (getOverrideDispositions(disposition, type)) return true;
    return false;
}
