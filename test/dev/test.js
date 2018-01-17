require('source-map-support').install()

const path = require('path')
const rootDir = path.resolve(__dirname, '..', '..')
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const FlashEmu = require(path.join(rootDir, 'dist', 'flashemu'))

let filename = path.join(__dirname, './out.txt')
fs.createWriteStream(filename, {
  flags: 'w'
})
process.stderr.write = (data) => {
  fs.writeFileSync(filename, data, {
    flag: 'a'
  })
}
async function main () {
  FlashEmu.setGlobalFlags({
    enableDebug: true,
    enableLog: true,
    enableWarn: true,
    enableError: true
  })
  const emu = new FlashEmu({
    async readFile (filename) {
      const buf = await readFile(filename)
      return new Uint8Array(buf).buffer
    },
    async writeFile (filename, buffer) {
      await writeFile(filename, new Uint8Array(buffer))
    }
  })
  // let filename = './test/pjg.abc'
  // emu.loadABCFile(filename)
  // emu.test()
  // const swf = path.join(__dirname, './array&object.swf')
  const swf = path.join(__dirname, '../swf/compress/none.swf')
  // const swf = path.join(__dirname, './baby_flash.swf')
  // const abc = path.join(__dirname, '../compiler/nestedLoop.abc')
  // const abc = path.join(__dirname, '../compiler/algo.abc')
  // const abc = path.join(__dirname, '../compiler/doWhile.abc')
  const abc = path.join(__dirname, '../compiler/param.abc')
  await emu.testCompiler(abc)
  // console.error(avm.toJson(2))
  // console.log(globalObject)
}
main().catch(e => console.error(e))
