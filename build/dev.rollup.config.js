// import path from 'path'
// import rootImport from 'rollup-plugin-root-import'
import rollupTypescript from 'rollup-plugin-typescript'
import typescript from 'typescript'
import atRoot from './rollup-plugin-at-root'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import manifest from './manifest'

export default {
  entry: 'src/flashemu.ts',
  plugins: [
    replace({
      DEBUG: JSON.stringify(true)
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
    })
  ],
  intro: `const MANIFEST = ${JSON.stringify(manifest)}`,
  format: 'umd',
  moduleName: 'FlashEmu',
  sourceMap: true
}
