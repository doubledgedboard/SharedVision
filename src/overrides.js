import { isSharedVision } from "./misc.js";

let old_isVisionSource = Token.prototype._isVisionSource;

export function isVisionSourceOverride(wrapped) {
    let result = old_isVisionSource.call(this);
    if (result) return true;
    const shared = isSharedVision(this);
    console.log(`SharedVision | _isVisionSource | token="${this.name}" native=${result} shared=${shared} controlled=${canvas.tokens.controlled.length}`);
    return shared;
}
