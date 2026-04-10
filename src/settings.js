import { moduleName } from "../sharedvision.js";
import { initializeSources } from "./misc.js";
import { emitSharedVision } from "./socket.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/*
 * Initialize all settings
 */
export const registerSettings = function () {
    //Create the Help button
    game.settings.registerMenu(moduleName, "helpMenu", {
        name: "SharedVision.Sett.Help",
        label: "SharedVision.Sett.Help",
        type: helpMenu,
        restricted: true,
    });

    game.settings.registerMenu(moduleName, "config", {
        name: "SharedVision.Conf.Title",
        label: "SharedVision.Conf.Title",
        type: configMenu,
        restricted: true,
    });

    game.settings.register(moduleName, "combatConfig", {
        scope: "world",
        config: false,
        default: {},
        type: Object,
    });

    game.settings.register(moduleName, "overrideConfig", {
        scope: "world",
        config: false,
        default: {},
        type: Object,
    });

    game.settings.register(moduleName, "enable", {
        scope: "world",
        config: false,
        default: false,
        type: Boolean,
    });

    game.settings.register(moduleName, "disableAll", {
        scope: "world",
        config: false,
        default: false,
        type: Boolean,
    });

    game.settings.register(moduleName, "migration_v1.0.10", {
        scope: "world",
        config: false,
        default: false,
        type: Boolean,
    });

};

export function migrateSettings() {
    if (!game.settings.get(moduleName, "migration_v1.0.10")) {
        console.log(
            "Shared Vision - Migrating Shared Vision settings to v1.0.10",
        );
        const actors = game.actors;
        for (let actor of actors) {
            console.log(`Shared Vision - Migrating actor: '${actor.name}'`);
            let settings = actor.getFlag("SharedVision", "userSetting");
            if (settings == undefined) continue;

            for (let setting of settings) {
                if (setting.enable) {
                    setting.token = true;
                    setting.vision = true;
                    setting.fog = true;
                    delete setting.enable;
                } else if (!setting.enable) {
                    delete setting.enable;
                }
            }
            actor.setFlag("SharedVision", "userSetting", settings);
        }
        console.log(`Shared Vision - Migrating settings`);
        const overrideConfig = {
            permission: {
                none: { vision: game.settings.get(moduleName, "none") },
                limited: { vision: game.settings.get(moduleName, "limited") },
                observer: { vision: game.settings.get(moduleName, "observer") },
                owner: { vision: game.settings.get(moduleName, "owner") },
            },
            disposition: {
                friendly: { vision: game.settings.get(moduleName, "friendly") },
                neutral: { vision: game.settings.get(moduleName, "neutral") },
                hostile: { vision: game.settings.get(moduleName, "hostile") },
                secret: { vision: game.settings.get(moduleName, "secret") },
            },
        };
        game.settings.set(moduleName, "overrideConfig", overrideConfig);
        game.settings.set(moduleName, "migration_v1.0.10", true);
        console.log("Shared Vision - Migration done");
    }
}

export class helpMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "sharedVision_helpMenu",
        position: { width: 500 },
        window: {
            title: "SharedVision.Sett.Help",
            icon: "fas fa-question-circle",
        },
    };

    static PARTS = {
        content: { template: "modules/SharedVision/templates/helpMenu.hbs" },
    };

    async _prepareContext(options) {
        return {};
    }

    _onRender(context, options) {
        super._onRender(context, options);
        for (let element of this.element.querySelectorAll(".sharedVision_expandable")) {
            element.addEventListener("click", (event) => {
                let thisElement = event.target;
                if (event.target.className === "sharedVision_expandableIcon")
                    thisElement = event.target.parentElement;
                let nextElement = thisElement.nextElementSibling;
                const collapse = nextElement.className !== "sharedVision_collapsed";
                nextElement.className = collapse ? "sharedVision_collapsed" : "";
                thisElement.children[0].src = collapse
                    ? "modules/SharedVision/img/icons/right.png"
                    : "modules/SharedVision/img/icons/down.png";
            });
        }
    }
}

export function getOverridePermissions(level, type) {
    const overrideConfig = game.settings.get(moduleName, "overrideConfig");
    if (overrideConfig.permission == undefined) return false;
    let perm = overrideConfig?.permission[level];
    if (perm == undefined) perm = { vision: false, token: false, fog: false };
    if (type == undefined) return perm;
    return perm[type];
}

export function getOverrideDispositions(disposition, type) {
    const overrideConfig = game.settings.get(moduleName, "overrideConfig");
    if (overrideConfig.disposition == undefined) return false;
    let perm = overrideConfig?.disposition[disposition];
    if (perm == undefined) perm = { vision: false, token: false, fog: false };
    if (type == undefined) return perm;
    return perm[type];
}

export class configMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "sharedVision_config",
        tag: "form",
        form: {
            handler: configMenu.onSubmit,
            closeOnSubmit: true,
        },
        position: { width: 500 },
        window: {
            title: "SharedVision.Conf.Title",
            icon: "fas fa-gear",
        },
    };

    static PARTS = {
        form: { template: "modules/SharedVision/templates/config.hbs" },
    };

    async _prepareContext(options) {
        let combatConfig = game.settings.get(moduleName, "combatConfig");
        if (combatConfig.start == undefined)
            combatConfig.start = { global: false, disableAll: false };
        if (combatConfig.end == undefined)
            combatConfig.end = { global: false, disableAll: false };

        let combat = {
            global: {
                name: game.i18n.localize("SharedVision.VisionConf.Global.Label"),
                id: "global",
                start: combatConfig.start.global,
                end: combatConfig.end.global,
            },
            disableAll: {
                name: game.i18n.localize("SharedVision.CtrlBtn.DisableAll"),
                id: "disableAll",
                start: combatConfig.start.disableAll,
                end: combatConfig.end.disableAll,
            },
        };

        const permissions = [
            {
                id: "none",
                name: game.i18n.localize("OWNERSHIP.NONE"),
                permissions: getOverridePermissions("none"),
            },
            {
                id: "limited",
                name: game.i18n.localize("OWNERSHIP.LIMITED"),
                permissions: getOverridePermissions("limited"),
            },
            {
                id: "observer",
                name: game.i18n.localize("OWNERSHIP.OBSERVER"),
                permissions: getOverridePermissions("observer"),
            },
            {
                id: "owner",
                name: game.i18n.localize("OWNERSHIP.OWNER"),
                permissions: getOverridePermissions("owner"),
            },
        ];

        const dispositions = [
            {
                id: "friendly",
                name: game.i18n.localize("TOKEN.DISPOSITION.FRIENDLY"),
                permissions: getOverrideDispositions("friendly"),
            },
            {
                id: "neutral",
                name: game.i18n.localize("TOKEN.DISPOSITION.NEUTRAL"),
                permissions: getOverrideDispositions("neutral"),
            },
            {
                id: "hostile",
                name: game.i18n.localize("TOKEN.DISPOSITION.HOSTILE"),
                permissions: getOverrideDispositions("hostile"),
            },
            {
                id: "secret",
                name: game.i18n.localize("TOKEN.DISPOSITION.SECRET"),
                permissions: getOverrideDispositions("secret"),
            },
        ];

        return { permissions, dispositions, combat };
    }

    static async onSubmit(event, form, formData) {
        let config = {
            permission: {
                none: { vision: false, token: false, fog: false },
                limited: { vision: false, token: false, fog: false },
                observer: { vision: false, token: false, fog: false },
                owner: { vision: false, token: false, fog: false },
            },
            disposition: {
                friendly: { vision: false, token: false, fog: false },
                neutral: { vision: false, token: false, fog: false },
                hostile: { vision: false, token: false, fog: false },
                secret: { vision: false, token: false, fog: false },
            },
        };
        let combatConfig = {
            start: { global: false, disableAll: false },
            end: { global: false, disableAll: false },
        };
        for (const [key, value] of Object.entries(formData.object)) {
            const split = key.split("-");
            if (split[0] == "combatSelect") {
                combatConfig[split[1]][split[2]] = value;
            } else config[split[0]][split[2]][split[1]] = value;
        }
        await game.settings.set(moduleName, "overrideConfig", config);
        await game.settings.set(moduleName, "combatConfig", combatConfig);
        initializeSources();
        emitSharedVision(game.settings.get(moduleName, "enable"));
    }
}
