export class NeuralNetwork {
    constructor(weights) {
        this.W1 = weights.W1;
        this.b1 = weights.b1;
        this.W2 = weights.W2;
        this.b2 = weights.b2;
    }

    relu(arr) {
        return arr.map(x => Math.max(0, x));
    }

    dense(input, weights, bias) {
        const output = new Float32Array(bias.length);
        for (let i = 0; i < bias.length; i++) {
            let sum = 0;
            const wRow = weights[i];
            const len = wRow.length; 
            for (let j = 0; j < len; j++) {
                sum += wRow[j] * input[j];
            }
            output[i] = sum + bias[i];
        }
        return output;
    }

    predict(inputMatrix) {
        // Flatten
        // 假设 inputMatrix 已经是 2D array 或 Float32Array[]
        // 需要展平为一维
        let flattened = [];
        if(Array.isArray(inputMatrix)) {
             inputMatrix.forEach(row => {
                 if(row.forEach) row.forEach(v => flattened.push(v));
                 else flattened.push(row); // fallback
             });
        }
        const inputVec = new Float32Array(flattened);

        // Forward Pass
        const z1 = this.dense(inputVec, this.W1, this.b1);
        const a1 = this.relu(z1);
        const z2 = this.dense(a1, this.W2, this.b2);
        
        // ArgMax
        let maxIdx = 0;
        let maxVal = z2[0];
        for (let i = 1; i < z2.length; i++) {
            if (z2[i] > maxVal) {
                maxVal = z2[i];
                maxIdx = i;
            }
        }
        return maxIdx;
    }
}