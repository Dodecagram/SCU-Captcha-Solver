export class Utils {
    // 将一维数组 reshape 为二维
    static reshape(flatArr, rows, cols) {
        const res = [];
        for (let r = 0; r < rows; r++) {
            res.push(flatArr.subarray(r * cols, (r + 1) * cols));
        }
        return res;
    }

    // ImageData -> 二维矩阵 [y][x] = [r,g,b]
    static imageDataToMatrix(imgData) {
        const { width, height, data } = imgData;
        const matrix = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const i = 4 * (y * width + x);
                const a = data[i + 3] / 255;
                const r = data[i] * a; 
                const g = data[i + 1] * a;
                const b = data[i + 2] * a;
                row.push([r, g, b]);
            }
            matrix.push(row);
        }
        return matrix;
    }

    // 矩阵转 ImageData (用于 Canvas 操作)，输入是单通道灰度值
    static matrixToImageData(matrix) {
        const h = matrix.length;
        const w = matrix[0].length;
        const data = new Uint8ClampedArray(w * h * 4);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = 4 * (y * w + x);
                const val = matrix[y][x]; 
                const pixel = Array.isArray(val) ? val[0] : val;
                data[i] = pixel;
                data[i+1] = pixel;
                data[i+2] = pixel;
                data[i+3] = 255;
            }
        }
        return new ImageData(data, w, h);
    }

    // Canvas 缩放
    static resizeImage(imgData, targetW, targetH) {
        const canvas = document.createElement('canvas');
        canvas.width = imgData.width;
        canvas.height = imgData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imgData, 0, 0);

        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = targetW;
        targetCanvas.height = targetH;
        const tCtx = targetCanvas.getContext('2d');
        tCtx.drawImage(canvas, 0, 0, targetW, targetH);
        
        return tCtx.getImageData(0, 0, targetW, targetH);
    }

    // 居中补齐 (Padding)
    static padToCenter(matrix, targetH, targetW) {
        const h = matrix.length;
        const w = matrix[0].length;
        const padY = Math.floor((targetH - h) / 2);
        const padX = Math.floor((targetW - w) / 2);
        
        const res = Array.from({ length: targetH }, () => new Float32Array(targetW).fill(0));
        for(let y=0; y<h; y++){
            for(let x=0; x<w; x++){
                if(res[y+padY] && res[y+padY][x+padX] !== undefined) {
                    res[y+padY][x+padX] = matrix[y][x];
                }
            }
        }
        return res;
    }
}