import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import prettier from 'rollup-plugin-prettier';
import pkg from './package.json';

export default {
  input: {
    index: 'src/index.ts',
  },
  output: [
    {
      dir: 'lib/',
      entryFileNames: '[name].js',
      chunkFileNames: 'chunk-[hash].js',
      format: 'es',
    },
  ],
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
    terser({
      format: {
        ecma: '2020',
      },
      compress: {
        ecma: '2020',
        hoist_funs: true,
        passes: 10,
        pure_getters: true,
        unsafe_arrows: true,
        unsafe_methods: true,
      },
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    }),
    prettier({
      tabWidth: 2,
      singleQuote: false,
      parser: 'babel',
    }),
  ],
};
