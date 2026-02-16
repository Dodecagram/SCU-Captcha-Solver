const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 示例数据 (请替换为你真实的权重数据！)
const W1 = new Array(100 * 400).fill(0).map(() => Math.random() * 2 - 1);
const b1 = new Array(100).fill(0).map(() => Math.random() * 0.1);
const W2 = new Array(20 * 100).fill(0).map(() => Math.random() * 2 - 1);
const b2 = new Array(20).fill(0).map(() => Math.random() * 0.1);

// 定义模型结构
const modelConfig = {
    W1: { data: W1, shape: [100, 400] },
    b1: { data: b1, shape: [100] },
    W2: { data: W2, shape: [20, 100] },
    b2: { data: b2, shape: [20] }
};

function quantize(floatArr) {
    let min = Infinity, max = -Infinity;
    for (let n of floatArr) {
        if (n < min) min = n;
        if (n > max) max = n;
    }
    const range = max - min;
    const scale = range / 255;
    const uint8 = new Uint8Array(floatArr.length);
    for (let i = 0; i < floatArr.length; i++) {
        uint8[i] = Math.round((floatArr[i] - min) / (scale || 1));
    }
    return { uint8, min, max };
}

console.log("正在处理权重...");

const meta = {};
const chunks = [];
let offset = 0;

for (const [key, info] of Object.entries(modelConfig)) {
    const q = quantize(info.data);
    chunks.push(q.uint8);
    
    meta[key] = {
        shape: info.shape,
        offset: offset,
        length: q.uint8.length,
        min: q.min,
        max: q.max
    };
    offset += q.uint8.length;
}

const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
const mergedBuffer = new Uint8Array(totalLength);
let currentOffset = 0;
for (const chunk of chunks) {
    mergedBuffer.set(chunk, currentOffset);
    currentOffset += chunk.length;
}

const gzipped = zlib.gzipSync(mergedBuffer, { level: 9 });

const base64Str = gzipped.toString('base64');

const fileContent = `/**
 * 自动生成的权重文件 - 请勿手动修改
 * Generated at: ${new Date().toISOString()}
 */
export const MODEL_META = ${JSON.stringify(meta, null, 2)};

export const MODEL_BIN = "${base64Str}";
`;

const outPath = path.join(__dirname, '../src/model/weights.js');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, fileContent);

console.log(`✅ 构建成功！`);
console.log(`原始大小: ${(totalLength * 4 / 1024).toFixed(2)} KB (Float32)`);
console.log(`压缩后大小: ${(base64Str.length / 1024).toFixed(2)} KB (Gzip+Base64)`);
console.log(`文件已生成: src/model/weights.js`);