import {moduleName} from "../sharedvision.js";
import {shareVision, disableAll} from "./misc.js";

export function pushControlButtons(controls) {
    if (!game.user.isGM) {
        return;
    }

    controls.tokens.tools.enableSharedVision = {
        name: "enableSharedVision",
        title: game.i18n.localize("SharedVision.CtrlBtn.Enable"),
        icon: "fas fa-globe",
        toggle: true,
        active: game.settings.get(moduleName, "enable"),
        visible: game.user.isGM,
        onClick: (value) => {
            shareVision(value);
        },
    };
    controls.tokens.tools.disableAllSharedVision = {
        name: "disableAllSharedVision",
        title: game.i18n.localize(
            "SharedVision.CtrlBtn.DisableAll",
        ),
        icon: "fas fa-eye-slash",
        toggle: true,
        active: game.settings.get(moduleName, "disableAll"),
        visible: game.user.isGM,
        onClick: (value) => {
            disableAll(value);
        },
    };
}
