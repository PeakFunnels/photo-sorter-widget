// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
// Use default import here
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/widget.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    resolve(),
    commonjs(),
    terser()
  ]
};
