// import path from 'path'
// import rootImport from 'rollup-plugin-root-import'
import rollupTypescript from 'rollup-plugin-typescript'
import typescript from 'typescript'
import atRoot from './rollup-plugin-at-root'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'
import manifest from './manifest'

export default {
  entry: 'src/flashemu.ts',
  plugins: [
    replace({
      DEBUG: JSON.stringify(false)
    }),
    atRoot(),
    resolve({ jsnext: true, main: true }),
    commonjs({
      namedExports: {
        'node_modules/pako/index.js': ['inflate']
      }
    }),
    rollupTypescript({
      typescript
    }),
    uglify({
      warnings: true,
      output: {
        comments: /^!/
      }
    }, minify)
  ],
  banner:
`/*!
 * FlashEmu v${manifest.VERSION} (${manifest.BUILD_DATE})
 * (c) 2017-${manifest.BUILD_YEAR} spacemeowx2
 * Released under the MIT License.
 */`,
  format: 'umd',
  moduleName: 'FlashEmu',
  sourceMap: true
}
