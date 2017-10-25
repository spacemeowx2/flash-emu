require('source-map-support').install()
const fs = require('fs')
const flashemu = require('./dist/flashemu')
async function main() {
  for (let filename of process.argv.slice(2)) {
    let buffer = new Uint8Array(fs.readFileSync(filename)).buffer
    if (filename.endsWith('.swf')) {
      const str = await flashemu.swfBuffer2str(buffer)
      console.log(str)
      continue
    }
    const str = flashemu.abcBuffer2str(buffer)
    console.log(str)
  }
}
main().catch(e => console.error(e))