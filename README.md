<div align="center">
  <a href="https://github.com/Dodecagram/SCU-Captcha-Solver" title="SCU-Captcha-Solver's Github repository.">
    <img src="https://github.com/user-attachments/assets/9875241f-749e-4463-86f3-85e8680b347c" height="200" width="auto"/>
  </a>
  <p align="center">
    <a href="https://github.com/Dodecagram/SCU-Captcha-Solver/releases">
      <img src="https://img.shields.io/github/v/release/Dodecagram/SCU-Captcha-Solver" alt="release">
    </a>
    <a href="https://github.com/Dodecagram/SCU-Captcha-Solver/blob/master/LICENSE">
      <img src="https://img.shields.io/github/license/Dodecagram/SCU-Captcha-Solver?color=blue" alt="license">
    </a>
     <img src="https://img.shields.io/badge/size-%3C100KB-green.svg" alt="size < 100KB">  
    <img src="https://img.shields.io/badge/tech-VanillaJS-orange.svg" alt="tech VanillaJS">  
  </p>
</div>

# SCU Captcha Solver

> **四川大学本科教务系统（JWC）验证码识别。重构项目。**

识别形似 <img src="https://github.com/user-attachments/assets/58c1960e-d117-41c4-b867-222de1e0783e" height="20px" />  的验证码。

原本的代码（[scu_captcha_recognition](https://github.com/Dodecagram/scu_captcha_recognition)）貌似是学校当年刚从旧的教务系统迁移到 URP 教务系统的时候写的。

本次重构将原本零散的脚本工程化，引入了**量化**和**压缩**，在保留核心逻辑的同时，将代码体积缩减至原本的 **10%**。

不过我早就用不上这份代码了，留给大家参考用。

> **⚠️ 关于性能的说明**: 
> 由于引入了 8-bit 量化，模型原本就不高的准确率雪上加霜。
> 但是由于目标网站输错验证码**不会锁定账号**且**无惩罚机制**，脚本可以采用“失败即重试”的暴力策略，实际使用体验几乎不受影响。

## ✨ 特性 (Features)

* **轻量级 (Lightweight)**: 没有任何外部运行时依赖 (No PyTorch/TensorFlow.js)，纯手写推理逻辑。
* **工程化 (Modernized)**: 使用 ES Modules + Rollup 打包。
* **极高压缩比**: 通过 8-bit 量化 + Gzip + Base64 编码，将模型权重和逻辑打包在一个仅约 **100KB** 的单文件中。
* **浏览器原生**: 利用 `DecompressionStream` API 进行原生解压，性能极佳。

## 🛠 技术原理 (How it works)

整个流水线分为 **CV 预处理** 和 **神经网络分类** 两部分：

### 1. 图像预处理 (CV Pipeline)
1.  **颜色过滤**: 提取红色通道 (R) 分量显著高于 G/B 分量的像素，去除背景噪点。
2.  **高斯模糊 (Gaussian Blur)**: 简单的颜色过滤会导致字符笔画断裂，用高斯模糊将断裂的笔画重新粘连，便于后续处理。（之前还尝试了形态学开运算，但测试发现性能提升不明显，遂弃用）。
3.  **垂直投影切割**: 计算像素列的累加和，利用类似波谷导数的方法加一点启发式算法自动分割出 4 个字符。（效果其实不是特别好）
4.  **归一化**: 将切割后的字符缩放并 Padding 到 `20x20` 像素。

### 2. 神经网络 (Neural Network)
* **架构**: 一个简单的多层感知机 (MLP / Fully Connected)。
* **输入**: 400 (20x20像素)。
* **结构**: `Input(400) -> Dense -> ReLU -> Dense -> Output(Labels)`。

### 3. 模型压缩 (Optimization)
为了适合在油猴脚本中运行，对模型进行了激进的压缩：
* **量化**: 将 Float32 权重量化为 Uint8 (8-bit)。
* **压缩**: 使用 Gzip 对二进制流进行二次压缩。
* **编码**: 最终转为 Base64 字符串内嵌于 JS 文件中。




## 🚀 快速开始 (Quick Start)

### 安装依赖

```bash
npm install
```

### 构建项目
生成 IIFE 格式的单文件脚本 (位于 dist/ 目录)：

```Bash
npm run build
```

### 开发环境调试
如果你想自己训练或修改权重，请参考 tools/quantize.js 和 src/config.js。

## 📖 使用示例 (Usage)

### 1. 基本示例 (Vanilla JS)

```HTML
<script src="https://Dodecagram.github.io/SCU-Captcha-Solver/scu-captcha-solver.min.js"></script>
<script>
    (async () => {
        // 初始化识别器
        const solver = new CaptchaSolver();
        await solver.init();

        // 识别图片（支持多种方式）
        // 1. 默认自动填入 '/img/captcha.jpg'
        const code = await solver.solve()
        // 2. 传入图片地址
        // const code = await solver.solve('/img/captcha.jpg');
        // 3. 传入 img 元素
        //const img = document.getElementById('captcha-img');
        //const code = await solver.solve(img);
        
        console.log("识别结果:", code);
    })();
</script>
```

### 2. 书签
这里的功能是隐藏验证码框登录时自动输入验证码，其他功能请自行修改使用。
```JavaScript
javascript:(function(){
    let script = document.createElement('script');
    script.src = 'https://Dodecagram.github.io/SCU-Captcha-Solver/scu-captcha-solver.min.js';
    script.onload = async function(){
        const solver = new CaptchaSolver();
        await solver.init();
        
        window.login_without_captcha = async function(retryCount = 0) {
            const MAX_RETRIES = 50;
            if (retryCount >= MAX_RETRIES) {
                alert(`尝试了 ${MAX_RETRIES} 次仍无法通过验证码，脚本停止。`);
                document.getElementById('loginButton').innerText = '登录';
                document.getElementById('loginButton').disabled = false;
                return;
            }

            let btn = document.getElementById('loginButton');
            btn.innerText = `正在登录... (${retryCount + 1}/${MAX_RETRIES})`;
            btn.disabled = true;

            try {
                let usr = document.getElementById('input_username').value;
                let pwd = document.getElementById('input_password').value;
                
                let code = await solver.solve('/img/captcha.jpg?t=' + Math.random());
                console.log(`第 ${retryCount + 1} 次尝试，识别结果: ${code}`);

                let formData = new URLSearchParams();
                formData.append('j_username', usr);
                formData.append('j_password', pwd);
                formData.append('j_captcha', code);

                let response = await fetch('/j_spring_security_check', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: formData
                });
                
                if (response.url.includes('badCaptcha')) {
                    await new Promise(r => setTimeout(r, 500));
                    return login_without_captcha(retryCount + 1); 
                } else {
                    window.location.href = response.url;
                }
            } catch (e) {
                console.error("网络请求失败", e);
                btn.innerText = '登录';
                btn.disabled = false;
            }
        };

        document.getElementById('input_checkcode').style.display = 'none';
        document.getElementById('captchaImg').style.display = 'none';
        let btn = document.getElementById('loginButton');
        let newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = function(e){
            e.preventDefault();
            window.login_without_captcha();
        };
        console.log("SCU Auto Login Loaded.");
    };
    document.body.appendChild(script);
})();
void 0;
```

### 3. 油猴脚本示例 (Tampermonkey)
这里的功能是隐藏验证码框登录时自动输入验证码，其他功能请自行修改使用。

```JavaScript
// ==UserScript==
// @name         SCU Auto Login
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动识别验证码并登录，基于神经网络
// @author       Dodecagram
// @match        http://zhjw.scu.edu.cn/login*
// @icon         http://zhjw.scu.edu.cn/img/icon/favicon.ico
// @grant        none
// @require      https://github.com/Dodecagram/SCU-Captcha-Solver/releases/latest/download/scu-captcha-solver.min.js
// ==/UserScript==

(async function() {
    'use strict';
    
    const solver = new CaptchaSolver();
    await solver.init();

    async function login_without_captcha(retryCount = 0) {
        const MAX_RETRIES = 50;
        if (retryCount >= MAX_RETRIES) {
            alert(`尝试了 ${MAX_RETRIES} 次仍无法通过验证码，脚本停止。`);
            document.getElementById('loginButton').innerText = '登录';
            document.getElementById('loginButton').disabled = false;
            return;
        }

        let btn = document.getElementById('loginButton');
        btn.innerText = `正在登录... (${retryCount + 1}/${MAX_RETRIES})`;
        btn.disabled = true;

        try {
            let usr = document.getElementById('input_username').value;
            let pwd = document.getElementById('input_password').value;

            let code = await solver.solve('/img/captcha.jpg?t=' + Math.random());
            console.log(`第 ${retryCount + 1} 次尝试，识别结果: ${code}`);

            let formData = new URLSearchParams();
            formData.append('j_username', usr);
            formData.append('j_password', pwd);
            formData.append('j_captcha', code);

            let response = await fetch('/j_spring_security_check', {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: formData
            });

            if (response.url.includes('badCaptcha')) {
                 await new Promise(r => setTimeout(r, 500)); 
                 return login_without_captcha(retryCount + 1); 
            } else {
                window.location.href = response.url;
            }

        } catch (e) {
            console.error(`网络请求失败: ${e}`);
            btn.innerText = '登录 (重试)';
            btn.disabled = false;
        }
    };

    const checkcode = document.getElementById('input_checkcode');
    const captchaImg = document.getElementById('captchaImg');
    if(checkcode) checkcode.style.display = 'none';
    if(captchaImg) captchaImg.style.display = 'none';

    let btn = document.getElementById('loginButton');
    if(btn) {
        let newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = function(e){
            e.preventDefault();
            login_without_captcha();
        };
    }
    console.log("自动登录脚本已加载。点击登录按钮开始破解。");
})();

```

## 📄 License
MIT License.

本项目仅供学习和交流使用，请勿用于非法用途。使用本工具产生的任何后果由使用者自行承担。