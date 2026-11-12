"use strict";
/**
 * VTU Provider Registry
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigiSubProvider = exports.BigiSubProvider = void 0;
exports.getVtuProvider = getVtuProvider;
const bigisub_1 = require("./bigisub");
Object.defineProperty(exports, "BigiSubProvider", { enumerable: true, get: function () { return bigisub_1.BigiSubProvider; } });
Object.defineProperty(exports, "bigiSubProvider", { enumerable: true, get: function () { return bigisub_1.bigiSubProvider; } });
const providers = {
    bigisub: bigisub_1.bigiSubProvider,
};
function getVtuProvider(code = 'bigisub') {
    return providers[code] || bigisub_1.bigiSubProvider;
}
//# sourceMappingURL=index.js.map