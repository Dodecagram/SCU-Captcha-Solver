import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/scu-captcha-solver.min.js',
    format: 'iife', 
    name: 'ScuCaptchaSolver',
    sourcemap: false
  },
  plugins: [
    terser()
  ]
};