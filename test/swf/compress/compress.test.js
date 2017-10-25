const assert = require('assert')
const FlashEmu = require('../../../dist/flashemu')
const fs = require('fs')
const util = require('util')
const path = require('path')
const readFile = util.promisify(fs.readFile)

describe('SWFFile', () => {
  let emu
  beforeEach(() => {
    emu = new FlashEmu({
      async readFile (filename) {
        const buf = await readFile(filename)
        return new Uint8Array(buf).buffer
      }
    })
  })
  it('should read none.swf correctly', async () => {
    await emu.loadSWF(path.join(__dirname, './none.swf'))
    assert(emu.swf.tags.length === 1015)
    assert(emu.swf.tags[emu.swf.tags.length - 1].type === 0)
    assert(emu.swf.fileLength === 4659998)
    assert(emu.swf.version === 22)
    assert(emu.swf.compressType === 0x46)
  })
  it('should read zlib.swf correctly', async () => {
    await emu.loadSWF(path.join(__dirname, './zlib.swf'))
    assert(emu.swf.tags.length === 1015)
    assert(emu.swf.tags[emu.swf.tags.length - 1].type === 0)
    assert(emu.swf.fileLength === 4659998)
    assert(emu.swf.version === 22)
    assert(emu.swf.compressType === 0x43)
  })
  it('should read lzma.swf correctly', async () => {
    await emu.loadSWF(path.join(__dirname, './lzma.swf'))
    assert(emu.swf.tags.length === 1015)
    assert(emu.swf.tags[emu.swf.tags.length - 1].type === 0)
    assert(emu.swf.fileLength === 4659998)
    assert(emu.swf.version === 22)
    assert(emu.swf.compressType === 0x5a)
  })
  it('should read abc from swf', async () => {
    await emu.loadSWF(path.join(__dirname, './none.swf'))
    
  })
})
