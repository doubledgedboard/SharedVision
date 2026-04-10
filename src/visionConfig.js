import { moduleName } from "../sharedvision.js";
import { initializeSources } from "./misc.js";
import { emitSharedVision } from "./socket.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class visionConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "sharedVision_visionConfig",
        tag: "form",
        form: {
            handler: visionConfig.onSubmit,
            closeOnSubmit: true,
        },
        window: {
            title: "Shared Vision: Vision Config",
        },
        classes: ["sheet"],
    };

    static PARTS = {
        form: { template: "modules/SharedVision/templates/visionConfig.hbs" },
    };

    constructor(options = {}) {
        super(options);
        this.actor = null;
        this.userSettings = [];
    }

    setActor(actor) {
        this.actor = actor;
    }

    async _prepareContext(options) {
        this.userSettings = [];

        let btnEnable = this.actor.getFlag("SharedVision", "enable");
        if (btnEnable == undefined) btnEnable = false;
        let hidden = this.actor.getFlag("SharedVision", "hidden");
        let settings = this.actor.getFlag("SharedVision", "userSetting");

        if (typeof settings === "object") {
            settings = Object.values(settings);
        }

        const users = game.users.contents;
        let iteration = 0;
        for (let user of users) {
            if (user.isGM) continue;
            let token = false;
            let vision = false;
            let fog = false;
            if (settings != undefined && settings.length != undefined)
                for (let setting of settings)
                    if (user.id == setting.id) {
                        token = setting.token;
                        vision = setting.vision;
                        fog = setting.fog;
                        break;
                    }
            this.userSettings.push({
                name: user.name,
                id: user.id,
                token,
                vision,
                fog,
                iteration,
            });
            iteration++;
        }

        return {
            btnEnable,
            hidden,
            users: this.userSettings,
        };
    }

    static async onSubmit(event, form, formData) {
        const app = this;
        const data = formData.object;
        await app.actor.setFlag("SharedVision", "enable", data.sharedVisionButton);
        await app.actor.setFlag("SharedVision", "hidden", data.sharedVisionHiddenButton);

        let newSettings = [];
        for (let user of app.userSettings) {
            newSettings.push({
                id: user.id,
                token: data[`token-${user.id}`] === true,
                vision: data[`vision-${user.id}`] === true,
                fog: data[`fog-${user.id}`] === true,
            });
        }

        await app.actor.setFlag("SharedVision", "userSetting", newSettings);
        initializeSources();
        emitSharedVision(game.settings.get(moduleName, "enable"));
    }
}
