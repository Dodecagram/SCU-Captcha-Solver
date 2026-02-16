import { Utils } from '../utils.js';

export class ModelLoader {
    static async load(base64String, meta) {
        // 1. Base64 -> Binary String
        const binStr = atob(base64String);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binStr.charCodeAt(i);
        }

        // 2. Native Decompression (Gzip)
        const ds = new DecompressionStream('gzip');
        const stream = new Blob([bytes]).stream().pipeThrough(ds);
        const buffer = await new Response(stream).arrayBuffer();
        const fullUint8 = new Uint8Array(buffer);

        // 3. Slice & Dequantize & Reshape
        const weights = {};
        for (const [key, info] of Object.entries(meta)) {
            const chunk = fullUint8.subarray(info.offset, info.offset + info.length);
            const floatData = this.dequantize(chunk, info.min, info.max);
            if (info.shape.length === 2) {
                weights[key] = Utils.reshape(floatData, info.shape[0], info.shape[1]);
            } else {
                weights[key] = floatData;
            }
        }
        return weights;
    }

    static dequantize(uint8Arr, min, max) {
        const range = max - min;
        const scale = range / 255;
        const float32 = new Float32Array(uint8Arr.length);
        for (let i = 0; i < uint8Arr.length; i++) {
            float32[i] = uint8Arr[i] * scale + min;
        }
        return float32;
    }
}