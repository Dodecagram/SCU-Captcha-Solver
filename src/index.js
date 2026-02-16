import { CONFIG } from './config.js';
import { ModelLoader } from './model/loader.js';
import { MODEL_META, MODEL_BIN } from './model/weights.js';
import { ImageProcessor } from './core/processor.js';
import { NeuralNetwork } from './core/network.js';

export class CaptchaSolver {
    constructor() {
        this.net = null;
        this.isReady = false;
    }

    async init() {
        if (this.isReady) return;
        try {
            console.time("ModelLoad");
            const weights = await ModelLoader.load(MODEL_BIN, MODEL_META);
            this.net = new NeuralNetwork(weights);
            this.isReady = true;
            console.timeEnd("ModelLoad");
            console.log("验证码模型加载完毕");
        } catch (e) {
            console.error("模型加载失败", e);
        }
    }

    async _loadImage(src) {
        return new Promise((resolve, reject) => {
            if (src instanceof HTMLImageElement) {
                if(src.complete) {
                    if(!src.crossOrigin) src.crossOrigin = "Anonymous";
                    resolve(src);
                } else {
                    src.onload = () => resolve(src);
                    src.onerror = reject;
                }
            } else {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = src;
                img.onload = () => resolve(img);
                img.onerror = reject;
            }
        });
    }

    async solve(imgSource = '/img/captcha.jpg') {
        if (!this.isReady) await this.init();

        const imgEle = await this._loadImage(imgSource);
        
        // 1. 创建 Canvas 提取像素
        const canvas = document.createElement('canvas');
        canvas.width = CONFIG.IMG_WIDTH;
        canvas.height = CONFIG.IMG_HEIGHT;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgEle, 0, 0);
        const imgData = ctx.getImageData(0, 0, CONFIG.IMG_WIDTH, CONFIG.IMG_HEIGHT);

        // 2. 图像处理与切割
        const charSegments = ImageProcessor.process(imgData);

        // 3. 识别
        let result = "";
        for (const seg of charSegments) {
            const idx = this.net.predict(seg);
            result += CONFIG.LABELS[idx];
        }
        
        return result;
    }
}

window.CaptchaSolver = CaptchaSolver;