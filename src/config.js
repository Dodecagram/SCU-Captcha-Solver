export const CONFIG = {
    // 图片尺寸
    IMG_WIDTH: 180,
    IMG_HEIGHT: 60,
    // 归一化后的字符尺寸
    CHAR_WIDTH: 20,
    CHAR_HEIGHT: 20,
    // 标签集
    LABELS: ['2', '3', '4', '5', '6', '7', '8', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'm', 'n', 'p', 'w', 'x', 'y'],
    // 预处理参数
    THRESHOLD: {
        NOISE: 21,
        BINARY: 200
    },
    // 高斯核
    GAUSSIAN_KERNEL: [
        [1, 4,  7,  4,  1],
        [4, 16, 26, 16, 4],
        [7, 26, 41, 26, 7],
        [4, 16, 26, 16, 4],
        [1, 4,  7,  4,  1]
    ].map(row => row.map(v => v / 256))
};