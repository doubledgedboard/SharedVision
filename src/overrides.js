import { isSharedVision } from "./misc.js";

let old_isVisionSource = Token.prototype._isVisionSource;

export function isVisionSourceOverride(wrapped) {
    let result = old_isVisionSource.call(this);
    if (result) return true;
    return isSharedVision(this);
}
