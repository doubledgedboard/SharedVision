import { moduleName } from "../sharedvision.js";
import { emitSharedVision } from "./socket.js";
import { updateAllTokens } from "./tokenLayer.js";
import { getOverridePermissions, getOverrideDispositions } from "./settings.js";

export function compareVersions(checkedVersion, requiredVersion) {
    requiredVersion = requiredVersion.split(".");
    checkedVersion = checkedVersion.split(".");

    for (let i = 0; i < 3; i++) {
        requiredVersion[i] = isNaN(parseInt(requiredVersion[i]))
            ? 0
            : parseInt(requiredVersion[i]);
        checkedVersion[i] = isNaN(parseInt(checkedVersion[i]))
            ? 0
            : parseInt(checkedVersion[i]);
    }

    if (checkedVersion[0] > requiredVersion[0]) return false;
    if (checkedVersion[0] < requiredVersion[0]) return true;
    if (checkedVersion[1] > requiredVersion[1]) return false;
    if (checkedVersion[1] < requiredVersion[1]) return true;
    if (checkedVersion[2] > requiredVersion[2]) return false;
    return true;
}

export function compatibleCore(compatibleVersion) {
    const split = compatibleVersion.split(".");
    if (split.length == 2) compatibleVersion = `0.${compatibleVersion}`;
    let coreVersion =
        game.version == undefined ? game.data.version : `0.${game.version}`;
    return compareVersions(compatibleVersion, coreVersion);
}

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
    if (compatibleCore("10.0")) {
    } else {
        const tokens = canvas.tokens.placeables;
        let sightLayer = canvas.layers.find((l) => l.options.name === "sight");
        for (let token of tokens) {
            const actor = game.actors.get(
                compatibleCore("10.0") ? token.actor.id : token.data.actorId,
            );
            const userSetting = actor
                .getFlag("SharedVision", "userSetting")
                ?.find((u) => u.id == game.userId);
            if (
                actor.getFlag("SharedVision", "enable") ||
                userSetting?.vision ||
                getOverride("vision", token)
            ) {
                let origin = token.getSightOrigin();
                sightLayer.updateFog(origin, true);
            }
        }
    }
}

export function getPermission(entity, permissionLevel) {
    return entity?.testUserPermission(game.user, permissionLevel);
}

export function isSharedVision(token) {
    if (compatibleCore("12.0") && game.user.isGM && canvas.tokens.controlled.length == 0) return false;
    if (game.settings.get(moduleName, "disableAll")) return false;
    let sharedVision = false;
    if (game.user.isGM == false && token.actor != null) {
        if (
            compatibleCore("10.0") ? token.document.hidden : token.data.hidden
        ) {
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
            let permission;
            if (compatibleCore('10.0')) permission = token.document.permission;
            else permission = token.actor.data.permission?.[game.userId] ? token.actor.data.permission?.[game.userId] : token.actor.data.permission.default;
            const disposition = compatibleCore('10.0') ? token.document.disposition : token.data.disposition;
            sharedVision = getOverride("vision", token);
        }
        return sharedVision;
    }
}

const permissionLevels = ["none", "limited", "observer", "owner"];
const dispositionTypes = ["hostile", "neutral", "friendly", "secret"];

export function getOverride(type, token) {
    const p = token.actor.permission;
    const d = compatibleCore("10.0")
        ? token.document.disposition
        : token.data.disposition;
    let permission = permissionLevels[p];
    let disposition = dispositionTypes[d + 1];

    if (getOverridePermissions(permission, type)) return true;
    if (getOverrideDispositions(disposition, type)) return true;
    return false;
}

