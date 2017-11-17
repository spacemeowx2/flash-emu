const assert = require('assert')
const FlashEmu = require('../../dist/flashemu')
const fs = require('fs')
const util = require('util')
const path = require('path')
const readFile = util.promisify(fs.readFile)

describe('SWF Common', () => {
  FlashEmu.setLogFilter((tag) => tag === '[Trace]')
  let emu
  beforeEach(() => {
    emu = new FlashEmu({
      async readFile (filename) {
        const buf = await readFile(filename)
        return new Uint8Array(buf).buffer
      }
    })
  })
  it('should print blocks', async () => {
    await emu.runSWF(path.join(__dirname, './helloworld.swf'))
    const Main = emu.getPublicClass('Main')
    Main.axNew()
  })
  it('should print hello world', async () => {
    await emu.runSWF(path.join(__dirname, './dictionary.swf'))
    const Main = emu.getPublicClass('Main')
    Main.axNew()
  })
})
