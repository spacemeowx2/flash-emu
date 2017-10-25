import {Logger} from './logger'
const logger = new Logger('Utils')

function checkContinuation (uint8array: Uint8Array, start: number, checkLength: number) {
  let array = uint8array
  if (start + checkLength < array.length) {
    while (checkLength--) {
      if ((array[++start] & 0xC0) !== 0x80) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}
export function encodeUTF8 (str: string) {
  // return unescape(encodeURIComponent(str))
  const char2bytes = (unicodeCode: number) => {
    let utf8Bytes: number[] = []
    if (unicodeCode < 0x80) {  // 1-byte
      utf8Bytes.push(unicodeCode)
    } else if (unicodeCode < (1 << 11)) {  // 2-byte
      utf8Bytes.push((unicodeCode >>> 6) | 0xC0)
      utf8Bytes.push((unicodeCode & 0x3F) | 0x80)
    } else if (unicodeCode < (1 << 16)) {  // 3-byte
      utf8Bytes.push((unicodeCode >>> 12) | 0xE0)
      utf8Bytes.push(((unicodeCode >> 6) & 0x3f) | 0x80)
      utf8Bytes.push((unicodeCode & 0x3F) | 0x80)
    } else if (unicodeCode < (1 << 21)) {  // 4-byte
      utf8Bytes.push((unicodeCode >>> 18) | 0xF0)
      utf8Bytes.push(((unicodeCode >> 12) & 0x3F) | 0x80)
      utf8Bytes.push(((unicodeCode >> 6) & 0x3F) | 0x80)
      utf8Bytes.push((unicodeCode & 0x3F) | 0x80)
    }
    return utf8Bytes
  }
  let o: number[] = []
  for (let i = 0; i < str.length; i++) {
    o = o.concat(char2bytes(str.charCodeAt(i)))
  }
  return new Uint8Array(o)
}
export function decodeUTF8 (uint8array: Uint8Array) {
  let out = []
  let input = uint8array
  let i = 0
  let length = uint8array.length

  while (i < length) {
    if (input[i] < 0x80) {
      out.push(String.fromCharCode(input[i]))
      ++i
      continue
    } else if (input[i] < 0xC0) {
      // fallthrough
    } else if (input[i] < 0xE0) {
      if (checkContinuation(input, i, 1)) {
        let ucs4 = (input[i] & 0x1F) << 6 | (input[i + 1] & 0x3F)
        if (ucs4 >= 0x80) {
          out.push(String.fromCharCode(ucs4 & 0xFFFF))
          i += 2
          continue
        }
      }
    } else if (input[i] < 0xF0) {
      if (checkContinuation(input, i, 2)) {
        let ucs4 = (input[i] & 0xF) << 12 | (input[i + 1] & 0x3F) << 6 | input[i + 2] & 0x3F
        if (ucs4 >= 0x800 && (ucs4 & 0xF800) !== 0xD800) {
          out.push(String.fromCharCode(ucs4 & 0xFFFF))
          i += 3
          continue
        }
      }
    } else if (input[i] < 0xF8) {
      if (checkContinuation(input, i, 3)) {
        let ucs4 = (input[i] & 0x7) << 18 | (input[i + 1] & 0x3F) << 12
             | (input[i + 2] & 0x3F) << 6 | (input[i + 3] & 0x3F)
        if (ucs4 > 0x10000 && ucs4 < 0x110000) {
          ucs4 -= 0x10000
          out.push(String.fromCharCode((ucs4 >>> 10) | 0xD800))
          out.push(String.fromCharCode((ucs4 & 0x3FF) | 0xDC00))
          i += 4
          continue
        }
      }
    }
    out.push(String.fromCharCode(0xFFFD))
    ++i
  }

  return out.join('')
}
// declare function escape(s: string): string
// export function decodeUTF8 (bytes: number[]) {
//   return decodeURIComponent(escape(String.fromCharCode.apply(String, bytes)))
// }
const HexString = '0123456789abcdef'
export function hex (bytes: any[]) {
  return bytes.map(i => HexString[i >> 4] + HexString[i & 0xf]).join('')
}

export class BufferReaderError extends Error {

}

export class BufferReader {
  dataView: DataView
  ptr: number
  constructor (private buffer: ArrayBuffer) {
    this.dataView = new DataView(buffer, 0)
    this.ptr = 0
  }
  isEOF () {
    return this.ptr >= this.buffer.byteLength
  }
  throwEOF () {
    throw new BufferReaderError('Read EOF')
  }
  movePtr (len: number): number {
    const t = this.ptr
    this.ptr += len
    if (this.ptr > this.buffer.byteLength) {
      this.throwEOF()
    }
    return t
  }
  readU8 () {
    const t = this.ptr
    this.ptr = t + 1
    return this.dataView.getUint8(t)
  }
  readU16 () {
    return this.dataView.getUint16(this.movePtr(2), true)
  }
  readUI16 () {
    return this.dataView.getUint16(this.movePtr(2), true)
  }
  readUI32 () {
    return this.dataView.getUint32(this.movePtr(4), true)
  }
  readS8 () {
    return this.dataView.getInt8(this.movePtr(1))
  }
  readS24 () {
    let right = this.readU8()
    let left = this.readU16()
    let result = (left << 8) | right
    result = (result << 8) >> 8
    // logger.debug('readS24', left, right, result)
    return result
  }
  readU30 () {
    const view = this.dataView
    let p = this.ptr
    let c = view.getUint8(p)
    let ret = c & 0x7f
    let i
    for (i = 1; (c & 0x80) && (i < 5); i++) {
      c = view.getUint8(p + i)
      ret |= (c & 0x7f) << (i * 7)
    }
    this.ptr += i
    return ret >>> 0
  }
  readU32 () {
    return this.readU30()
  }
  readS32 () {
    return this.readU32() | 0
  }
  readD64 () {
    return this.dataView.getFloat64(this.movePtr(8), true)
  }
  readString (size: number) {
    // TODO utf-8
    // let ret: number[] = []
    // for (let i = 0; i < size; i++) {
    //   ret.push(this.readU8())
    // }
    let array = new Uint8Array(this.readArray(size))
    return decodeUTF8(array)
  }
  readCStyleString () {
    let c: number
    let ptr: number
    for (ptr = this.ptr; c !== 0; ptr++) {
      c = this.dataView.getUint8(ptr)
    }
    // 01 00
    let array = new Uint8Array(this.readArray(ptr - this.ptr - 1))
    this.readU8()
    return decodeUTF8(array)
  }
  readArray (size: number) {
    // let array = new ArrayBuffer(size)
    // let view = new Uint8Array(array)
    // for (let i = 0; i < size; i++) {
    //   view[i] = this.readU8()
    // }
    if (size < 0) {
      const remain = this.buffer.byteLength - this.ptr
      size += remain + 1
    }
    if (this.ptr + size > this.buffer.byteLength) {
      console.error('EOF', this.ptr, size, this.buffer.byteLength)
      this.throwEOF()
    }
    let array = this.buffer.slice(this.ptr, this.ptr + size)
    this.ptr += size
    return array
  }
  getPosition () {
    return this.ptr
  }
}
export function popManyInto (src: any[], count: number, dst: any[]) {
  let i = count
  while (i--) {
    dst[i] = src.pop()
  }
  dst.length = count
}
export function chr (code: number) {
  return String.fromCharCode(code)
}
export function ord (str: string) {
  return str.charCodeAt(0)
}
type Constructor<T> = () => T
export class AutoMap<K, V> extends Map<K, V> {
  constructor (private vCtor: Constructor<V>) {
    super()
  }
  get (key: K) {
    let ret = super.get(key)
    if (ret === undefined) {
      super.set(key, ret = this.vCtor())
    }
    return ret
  }
}
export class AutoWeakMap<K extends object, V> extends WeakMap<K, V> {
  constructor (private vCtor: Constructor<V>) {
    super()
  }
  get (key: K) {
    let ret = super.get(key)
    if (ret === undefined) {
      super.set(key, ret = this.vCtor())
    }
    return ret
  }
}
export class DefaultWeakMap<K extends object, V> extends WeakMap<K, V> {
  constructor (private def: V) {
    super()
  }
  get (key: K) {
    let ret = super.get(key)
    if (ret === undefined) {
      ret = this.def
    }
    return ret
  }
}
