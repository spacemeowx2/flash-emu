import {BufferReader, BufferReaderError, chr, ord, hex} from './utils'
import {ApplicationDomain} from './runtime'
import {Errors, IErrorMessage} from './error'
import {decompressZlib, decompressLZMA} from './compress'

let tagHandler: Map<TagType, typeof Tag> = new Map()
function TagHandler (type: TagType) {
  return function (target: typeof Tag) {
    target.type = type
    tagHandler.set(type, target)
  }
}
enum CompressType {
  uncompressed = 0x46,    // F
  zlibCompressed = 0x43,  // C
  lzmaCompressed = 0x5a   // Z
}

export enum TagType {
  End = 0,
  SymbolClass = 76,
  DoABC = 82,
  DefineBinaryData = 87
}

class Tag {
  static type: TagType
  type: TagType
  length: number
  data: ArrayBuffer
  constructor (reader: BufferReader, noMovePtr = false) {
    let typeAndLength = reader.readUI16()
    let type = typeAndLength >> 6
    let length = typeAndLength & 0b111111
    if (length === 0b111111) {
      length = reader.readUI32()
    }
    this.type = type
    this.length = length
    if (!noMovePtr) {
      reader.movePtr(length)
    }
  }
  toJSON () {
    let ret: any = {
      type: this.type,
      length: this.length
    }
    let name = this.constructor.name
    if (name !== 'Tag') {
      ret.className = name
    }
    if (this.data instanceof ArrayBuffer) {
      ret.data = hex(Array.from(new Uint8Array(this.data.slice(0, 20))))
    }
    return ret
  }
}

@TagHandler(TagType.DoABC)
export class TagDoABC extends Tag {
  flags: number
  name: string
  constructor (reader: BufferReader) {
    super(reader, true)
    let start = reader.getPosition()
    this.flags = reader.readUI32()
    this.name = reader.readCStyleString()
    const offset = reader.getPosition() - start
    this.data = reader.readArray(this.length - offset)
  }
  toJSON () {
    let ret = super.toJSON()
    ret.flags = this.flags
    ret.name = this.name
    return ret
  }
}

@TagHandler(TagType.DefineBinaryData)
export class TagDefineBinaryData extends Tag {
  tag: number
  symbolName: string
  constructor (reader: BufferReader) {
    super(reader, true)
    this.tag = reader.readUI16()
    reader.readUI32() // reserved
    this.data = reader.readArray(this.length - 6)
  }
  toJSON () {
    let ret = super.toJSON()
    ret.tag = this.tag
    ret.symbolName = this.symbolName
    return ret
  }
}

@TagHandler(TagType.SymbolClass)
export class TagSymbolClass extends Tag {
  symbols: Map<number, string> = new Map()
  constructor (reader: BufferReader) {
    super(reader, true)
    const count = reader.readUI16()
    const symbols = this.symbols
    for (let i = 0; i < count; i++) {
      const tag = reader.readUI16()
      const name = reader.readCStyleString()
      symbols.set(tag, name)
    }
  }
  toJSON () {
    let ret = super.toJSON()
    ret.symbols = this.symbols
    return ret
  }
}

export class SWFFile {
  compressType: CompressType
  version: number
  fileLength: number
  frameSize: Rect
  frameRate: number
  frameCount: number
  tags: Tag[] = []
  constructor (private app: ApplicationDomain) {
  }
  async read (reader: BufferReader) {
    this.compressType = reader.readU8()
    if (reader.readU8() !== ord('W') || reader.readU8() !== ord('S')) {
      this.app.throwError('VerifyError', Errors.FileVerificationError)
    }
    this.version = reader.readU8()
    this.fileLength = reader.readUI32()

    const body = await this.expandBody(reader)
    const bodyReader = new BufferReader(body)
    const swfReader = new SWFReader(bodyReader)

    this.frameSize = swfReader.readRect()
    this.frameRate = swfReader.readFixed8()
    this.frameCount = bodyReader.readU16()
    this.tags = []
    for (let tag of swfReader.readTags()) {
      this.tags.push(tag)
    }

    const binary: TagDefineBinaryData[] = this.getTags(TagDefineBinaryData)
    const symbol: TagSymbolClass = this.getTags(TagSymbolClass)[0]
    if (binary.length > 0 && !symbol) {
      throw new Error('SymbolClass not found')
    }
    for (let b of binary) {
      b.symbolName = symbol.symbols.get(b.tag)
    }
  }
  getTags<T extends Tag> (type: {
    type: TagType,
    new (...args: any[]): T
  }): T[] {
    return this.tags.filter(t => t.type === type.type) as any
  }
  dropUnusedTags () {
    this.tags = this.tags.filter(i => i.constructor !== Tag)
    let abc = this.tags.filter(i => i.constructor === TagDoABC)
  }
  async expandBody (reader: BufferReader) {
    const headerLen = reader.getPosition()
    if (this.compressType === CompressType.uncompressed) {
      return reader.readArray(this.fileLength - headerLen)
    } else if (this.compressType === CompressType.zlibCompressed) {
      let body = reader.readArray(-1)
      return await decompressZlib(body)
    } else if (this.compressType === CompressType.lzmaCompressed) {
      let LZMAsize = reader.readUI32()
      let body = reader.readArray(-1)
      return await decompressLZMA(body, this.fileLength - headerLen)
    }
    return null
  }
  toJSON () {
    return {
      compressType: CompressType[this.compressType],
      version: this.version,
      fileLength: this.fileLength,
      frameSize: this.frameSize,
      frameRate: this.frameRate,
      frameCount: this.frameCount,
      tags: this.tags
    }
  }
}

class Rect {
  Xmin: number
  Xmax: number
  Ymin: number
  Ymax: number
  nbits: number
}

class SWFReader {
  private bitPos: number = 0
  private tempByte: number = 0
  constructor (
    private reader: BufferReader
  ) {}
  readFixed () {
    let num = this.reader.readUI32()
    return (num & 0xFFFF) / 0x10000 + (num >> 16)
  }
  readFixed8 () {
    let num = this.reader.readUI16()
    return (num & 0xFF) / 0x100 + (num >> 8)
  }
  readUB (nBits: number): number {
    if (nBits === 0) {
      return 0
    }
    let ret = 0
    if (this.bitPos === 0) {
      this.tempByte = this.reader.readU8()
    }
    for (let bit = 0; bit < nBits; bit++) {
      let nb = (this.tempByte >> (7 - this.bitPos)) & 1
      ret += (nb << (nBits - 1 - bit))
      this.bitPos++
      if (this.bitPos === 8) {
        this.bitPos = 0
        if (bit !== nBits - 1) {
          this.tempByte = this.reader.readU8()
        }
      }
    }
    return ret
  }
  readSB (nBits: number): number {
    let uval = this.readUB(nBits)

    const shift = 32 - nBits
    uval = (uval << shift) >> shift
    return uval
  }
  alignByte () {
    this.bitPos = 0
  }
  readRect (): Rect {
    let ret = new Rect()
    const nbits = this.readUB(5)
    ret.Xmin = this.readSB(nbits)
    ret.Xmax = this.readSB(nbits)
    ret.Ymin = this.readSB(nbits)
    ret.Ymax = this.readSB(nbits)
    this.alignByte()
    return ret
  }
  *readTags () {
    for (let tag = this.readTag(); tag !== null; tag = this.readTag()) {
      yield tag
      if (tag.type === TagType.End) {
        break
      }
    }
  }
  private readTag () {
    try {
      let type = this.reader.readUI16() >> 6
      this.reader.movePtr(-2)

      let tagType = tagHandler.get(type)
      if (!tagType) {
        tagType = Tag
      }
      let tag = new tagType(this.reader)
      return tag
    } catch (e) {
      if (!(e instanceof BufferReaderError)) {
        console.error(e)
      }
      return null
    }
  }
}
