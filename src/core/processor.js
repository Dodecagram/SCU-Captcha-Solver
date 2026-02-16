import { CONFIG } from '../config.js';
import { Utils } from '../utils.js';

export class ImageProcessor {
    static process(imgData) {
        const matrix = Utils.imageDataToMatrix(imgData);
        
        // 1. 灰度与去噪 (融合了你原来的逻辑)
        const grayMatrix = this.preprocess(matrix);
        
        // 2. 高斯模糊
        const blurredMatrix = this.gaussianBlur(grayMatrix);
        
        // 3. 垂直投影切割
        const segments = this.segmentCharacters(blurredMatrix);
        
        // 4. 对每个切片进行归一化处理
        return segments.map(seg => {
            let resizedMat = seg;
            if(seg.length !== CONFIG.CHAR_HEIGHT) {
                // 临时转回 ImageData 进行 resize
                const tempImgData = Utils.matrixToImageData(seg);
                // 缩放字符到 20x20 接近的比例
                const width = Math.ceil(CONFIG.CHAR_HEIGHT/seg.length * seg[0].length)
                const resizedImg = Utils.resizeImage(tempImgData, width, CONFIG.CHAR_HEIGHT);
                resizedMat = Utils.imageDataToMatrix(resizedImg).map(row => row.map(p => p[0])); // 取单通道
            }
             // 归一化数值 0-1
             return Utils.padToCenter(resizedMat, CONFIG.CHAR_HEIGHT, CONFIG.CHAR_WIDTH).map(row => row.map(v => v/255));
        });
    }

    static preprocess(matrix) {
        return matrix.map(row => row.map(pixel => {
            // 通过红色部分的 r 通道和 g, b 通道的区别
            if((pixel[0] - (pixel[1] + pixel[2]) / 2) < CONFIG.THRESHOLD.NOISE) return 0;
            return 255;
        }));
    }

    static gaussianBlur(matrix) {
        const kernel = CONFIG.GAUSSIAN_KERNEL;
        const h = matrix.length;
        const w = matrix[0].length;
        const res = Array.from({length: h-4}, () => new Float32Array(w-4));
        
        for(let y=0; y<h-4; y++){
            for(let x=0; x<w-4; x++){
                let sum = 0;
                for(let ky=0; ky<5; ky++){
                    for(let kx=0; kx<5; kx++){
                        sum += kernel[ky][kx] * matrix[y+ky][x+kx];
                    }
                }
                res[y][x] = sum;
            }
        }
        return res;
    }

    static segmentCharacters(matrix) {
        const h = matrix.length;
        const w = matrix[0].length;
        
        // 1. 垂直投影
        const colSums = new Float32Array(w);
        for(let x=0; x<w; x++){
            for(let y=0; y<h; y++) colSums[x] += matrix[y][x];
        }

        // 2. 找左右边界
        let minX = 0, maxX = w-1;
        for(let i=0; i<w; i++) { if(colSums[i]>255) { minX = i; break; } }
        for(let i=w-1; i>=0; i--) { if(colSums[i]>255) { maxX = i; break; } }
        
        // 3. 找切割点
        const step = (maxX - minX) / 4;
        const cuts = [minX];
        for(let i=0; i<3; i++){
            const center = minX + step * (i+1);
            const searchRange = Math.floor(step/2);
            
            let bestScore = -1;
            let bestIdx = center;
            for(let j = -searchRange; j < searchRange; j++){
                const idx = Math.floor(center + j);
                if(idx <= 0 || idx >= w-1) continue;
                
                const prev = colSums[idx-1];
                const curr = colSums[idx];
                const ratio = prev > curr ? (prev/(curr+0.1)) : (curr/(prev+0.1));
                
                // 随意调整了一下
                if(!(ratio > 5 && (prev > 100 || curr > 100))) continue
                if(Math.abs(idx - center) <= 3) continue
                if(ratio > bestScore) {
                    bestScore = ratio;
                    bestIdx = idx;
                }
            }
            cuts.push(bestIdx);
        }
        cuts.push(maxX);
        
        // 4. 切割矩阵
        const segs = [];
        for(let i=0; i<4; i++){
            const s = Math.floor(cuts[i]);
            const e = Math.floor(cuts[i+1]);
            segs.push(matrix.map(row => row.slice(s, e)));
        }
        return segs;
    }
}