import { moduleName } from "../sharedvision.js";
import { getOverride } from "./misc.js";

export let tokenStorage = [];

export class displayedTokenLayer extends CanvasLayer {
    constructor(token) {
        super();
        this.zIndex = 2000;
        this.init(token);
    }

    async draw() {
        super.draw();
    }

    init(token) {
        this.container = new PIXI.Container();
        this.addChild(this.container);
        let tokenIcon = PIXI.Sprite.from(token.document.texture.src);
        const gridSize = canvas.grid.size;
        const tokenWidth = token.document.width;
        const tokenHeight = token.document.height;
        const tokenScale = token.document.texture.scaleX;
        const hidden = token.document.hidden;
        const rotation = token.document.rotation;

        const size = tokenWidth;
        if (tokenHeight > size) size = tokenHeight;
        tokenIcon.width = size * tokenScale * gridSize;
        tokenIcon.height = size * tokenScale * gridSize;
        if (hidden) tokenIcon.alpha = 0.5;
        tokenIcon.angle = rotation;
        tokenIcon.anchor.set(0.5);
        this.container.addChild(tokenIcon);

        let x = token.document.x;
        let y = token.document.y;
        x += (tokenWidth * gridSize) / 2;
        y += (tokenHeight * gridSize) / 2;

        this.container.setTransform(x, y);
        this.container.visible = true;
        canvas.stage.addChild(this);
    }

    updatePosition(token) {
        const tokenWidth = token.document.width;
        const tokenHeight = token.document.height;
        const gridSize = canvas.grid.size;
        let x = token.document.x;
        let y = token.document.y;
        x += (tokenWidth * gridSize) / 2;
        y += (tokenHeight * gridSize) / 2;

        this.container.setTransform(x, y);
    }

    remove() {
        canvas.stage.removeChild(this);
    }
}

export function drawNewToken(token) {
    tokenStorage.push({
        tokenId: token.document._id,
        icon: new displayedTokenLayer(token),
    });
}

export function moveToken(token) {
    if (token == undefined || game.user.isGM) return;
    const actor = game.actors.get(token.actor.id);
    const userSetting = actor
        .getFlag("SharedVision", "userSetting")
        ?.find((u) => u.id == game.userId);
    const shareHidden = actor.getFlag("SharedVision", "hidden");
    const tokenId = token.document._id;
    if (
        userSetting?.vision ||
        getOverride("vision", token) ||
        (userSetting?.token != true && !getOverride("token", token))
    )
        return;

    const storage = tokenStorage.find((s) => s.tokenId == tokenId);

    if (
        game.settings.get(moduleName, "disableAll") ||
        token.visible ||
        (token.document.hidden && !shareHidden)
    ) {
        if (storage != undefined) {
            storage.icon.remove();
            tokenStorage.splice(
                tokenStorage.findIndex((s) => s.tokenId == tokenId),
                1,
            );
        }
        return;
    }

    if (storage == undefined) drawNewToken(token);
    else storage.icon.updatePosition(token);
}

export function updateToken(token) {
    if (token == undefined || game.user.isGM) return;
    const actor = game.actors.get(token.actor?.id);
    if (actor == undefined) return;

    const userSetting = actor
        .getFlag("SharedVision", "userSetting")
        ?.find((u) => u.id == game.userId);
    const shareHidden = actor.getFlag("SharedVision", "hidden");
    const tokenId = token.document._id;

    //console.log('token',token, actor, userSetting)

    const storage = tokenStorage.find((s) => s.tokenId == tokenId);
    if (
        userSetting?.vision ||
        getOverride("vision", token) ||
        (!getOverride("token", token) && userSetting?.token != true) ||
        game.settings.get(moduleName, "disableAll") ||
        token.visible ||
        (token.document.hidden && !shareHidden)
    ) {
        if (storage != undefined) {
            storage.icon.remove();
            tokenStorage.splice(
                tokenStorage.findIndex((s) => s.tokenId == tokenId),
                1,
            );
        }
        return;
    }
    if (storage == undefined) drawNewToken(token);
    else {
        storage.icon.remove();
        tokenStorage.splice(
            tokenStorage.findIndex((s) => s.tokenId == tokenId),
            1,
        );
        drawNewToken(token);
    }
}

export function updateAllTokens() {
    const tokens = canvas.tokens.placeables;
    for (let token of tokens) {
        updateToken(token);
    }
}
