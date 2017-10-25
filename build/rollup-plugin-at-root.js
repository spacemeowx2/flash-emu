import path from 'path'
import fs from 'fs'

const prefix = './src/'
const suffix = ['.ts', '/index.ts', '.js', '/index.js']
export default function atRoot () {
  return {
    resolveId (id, origin) {
      if (id.startsWith('@')) {
        const p = id.substr(1)
        let paths = suffix.map(s => prefix + p + s)
        for (let p of paths) {
          let r = path.resolve(p)
          if (fs.existsSync(r)) {
            return r
          }
        }
      } else {
        if (origin) {
          const dir = path.dirname(origin)
          const abs = path.resolve(path.join(dir, id))
          let paths = suffix.map(s => abs + s)
          for (let p of paths) {
            let r = path.resolve(p)
            if (fs.existsSync(r)) {
              return r
            }
          }
        }
      }
    }
  }
}
