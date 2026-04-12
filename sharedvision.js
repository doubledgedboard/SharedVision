import { pushControlButtons } from "./src/controlButtons.js";
import { initializeSources, onSetShareVision } from "./src/misc.js";
import { visionConfig } from "./src/visionConfig.js";
import { registerSettings, migrateSettings } from "./src/settings.js";
import { socketInit, emitSharedVision, updateSight } from "./src/socket.js";
import { isVisionSourceOverride } from "./src/overrides.js";
import { updateToken } from "./src/tokenLayer.js";

export const moduleName = "SharedVision";

//CONFIG.debug.hooks = true;

Hooks.once("init", function () {
    onInit();
});
Hooks.once("ready", function () {
    onReady();
});
Hooks.on("getSceneControlButtons", (controls) => {
    pushControlButtons(controls);
}); //Register control button
Hooks.on("setSharedVision", (data) => {
    onSetShareVision(data);
});
Hooks.on("canvasReady", () => {
    onCanvasReady();
});
Hooks.on("updateToken", (data) => {
    onUpdateToken(data);
});
Hooks.on("sightRefresh", (data) => {
    onSightRefresh(data);
});
Hooks.on("visibilityRefresh", (data) => {
    onSightRefresh(data);
});
Hooks.on("getActorContextOptions", (_application, menuItems) => {
    menuItems.push({
        name: "Shared Vision",
        icon: '<i class="fas fa-eye"></i>',
        condition: () => game.user.isGM,
        callback: (li) => {
            const element = li instanceof HTMLElement ? li : li[0];
            const actorId = element?.dataset.documentId ?? element?.dataset.entryId;
            const actor = actorId ? game.actors.get(actorId) : null;
            if (!actorId) {
                console.error("SharedVision | getActorContextOptions: could not find document ID on element", element);
                return;
            }
            if (!actor) {
                console.error("SharedVision | getActorContextOptions: no actor found for id", actorId);
                return;
            }
            let dialog = new visionConfig();
            dialog.setActor(actor);
            dialog.render({ force: true });
        },
    });
});
Hooks.on("combatStart", () => {
    onCombat("start");
});
Hooks.on("deleteCombat", () => {
    onCombat("end");
});
Hooks.on("updateCombat", (a, b) => {
    onUpdateCombat(a, b);
});

function onInit() {
    registerSettings();
    socketInit();
}

function onReady() {
    if (game.user.isGM) migrateSettings();

    libWrapper.register(
        "SharedVision",
        "Token.prototype._isVisionSource",
        isVisionSourceOverride,
        "OVERRIDE",
    );

    if (!game.user.isGM) initializeSources();
}

let currentlyUpdatingToken;
let currentlyUpdatingTokenVisible = false;
let currentlyUpdatingTokenTimer;

function onUpdateToken(data) {
    emitSharedVision(game.settings.get(moduleName, "enable"), false);
    const token = canvas.tokens.placeables.find((t) => t.id == data.id);

    currentlyUpdatingToken = data.id;
    currentlyUpdatingTokenVisible = token?.visible;
    currentlyUpdatingTokenTimer = setTimeout(function () {
        updateToken(token);
        updateSight(currentlyUpdatingToken);
        currentlyUpdatingToken = undefined;
    }, 250);
}

function onSightRefresh(data) {
    clearTimeout(currentlyUpdatingTokenTimer);
    if (currentlyUpdatingToken != undefined && currentlyUpdatingTokenVisible)
        updateSight(currentlyUpdatingToken);
}

async function onCanvasReady() {
    const enable = game.settings.get(moduleName, "enable");
    if (game.user.isGM) emitSharedVision(enable);
    initializeSources();
}

function onCombat(mode) {
    if (game.user.isGM == false) return;
    const combatConfig = game.settings.get(moduleName, "combatConfig");
    if (Object.keys(combatConfig).length === 0) return;
    let data = {};
    let global = combatConfig[mode].global;
    if (global == "enable") data.globalSharedVision = true;
    else if (global == "disable") data.globalSharedVision = false;
    let disableAll = combatConfig[mode].disableAll;
    if (disableAll == "enable") data.disableAll = true;
    else if (disableAll == "disable") data.disableAll = false;

    onSetShareVision(data);
}

function onUpdateCombat(a, b) {
    if (a.previous.round == 0 && a.previous.turn == 0) onCombat("start");
}
