import fs from 'fs'
import path from 'path'

const pkg = fs.readFileSync(path.resolve(__dirname, '..', 'package.json'))
const manifest = JSON.parse(pkg)
const now = new Date()
export default {
  VERSION: manifest.version,
  BUILD_TIME: now.toGMTString(),
  BUILD_DATE: now.toLocaleDateString(),
  BUILD_YEAR: now.getFullYear()
}
