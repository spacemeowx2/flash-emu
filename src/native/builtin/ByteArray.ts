import {NativeClass, INativeClass, AXNativeClass, ApplicationDomain, AXObject} from '@/native'
import {encodeUTF8, decodeUTF8} from '@/utils'
export class ByteArray {
  view: DataView
  u8view: Uint8Array
  position: number = 0
  private _buf: ArrayBuffer
  private _length = 0
  private littleEndian: boolean = false
  constructor () {
    if (!this.buf) {
      this.buf = new ArrayBuffer(0)
    }
  }
  get bytesAvailable () {
    throw 1
  }
  set endian (v: string) {
    this.littleEndian = v === 'littleEndian'
  }
  get endian () {
    return this.littleEndian ? 'littleEndian' : 'bigEndian'
  }
  get buf () {
    return this._buf
  }
  set buf (v: ArrayBuffer) {
    this._buf = v
    this.reset()
    this._length = v.byteLength
  }
  get length () {
    return this._length
  }
  set length (v: number) {
    this.ensureCapacity(v)
    this._length = v
  }
  movePos (len: number) {
    let p = this.position
    this.position += len
    if (this.position > this.length) {
      this.length = this.position
    }
    return p
  }
  readByte () {
    const p = this.movePos(1)
    return this.view.getInt8(p)
  }
  readUnsignedByte () {
    const p = this.movePos(1)
    return this.view.getUint8(p)
  }
  readInt () {
    const p = this.movePos(4)
    return this.view.getInt32(p, this.littleEndian)
  }
  readUnsignedInt () {
    const p = this.movePos(4)
    return this.view.getUint32(p, this.littleEndian)
  }
  readUTFBytes (length: number): string {
    const p = this.movePos(length)
    const buf = this.u8view.slice(p, p + length)
    const str = decodeUTF8(buf)
    return str
  }
  readCStyleString (position: number): string {
    let out = ''
    for (let i = 0; true; i++) {
      const c = this.u8view[position + i]
      if (c === 0) {
        return out
      }
      out += String.fromCharCode(c)
    }
  }
  writeByte (val: number): void {
    const p = this.movePos(1)
    this.view.setInt8(p, val)
  }
  writeBytes ({native: bytes}: {native: ByteArray}, offset = 0, length = 0) {
    if (!(bytes instanceof ByteArray)) {
      throw new TypeError('writeBytes(bytes)')
    }
    if (length === 0) {
      length = bytes.length
    }
    this._writeBytes(bytes.buf, offset, length)
  }
  _writeBytes (buf: ArrayBuffer, offset = 0, length = 0) {
    let src = new Uint8Array(buf.slice(offset, offset + length))
    const p = this.movePos(src.byteLength)
    this.u8view.set(src, p)
  }
  writeUnsignedInt (value: number) {
    const p = this.movePos(4)
    this.view.setUint32(p, value, this.littleEndian)
  }
  writeInt (value: number) {
    const p = this.movePos(4)
    this.view.setInt32(p, value, this.littleEndian)
  }
  writeUTFBytes (value: string): void {
    // console.error('writeUTFBytes', value)
    const src = encodeUTF8(value)
    const p = this.movePos(src.byteLength)
    this.u8view.set(src, p)
  }
  private ensureCapacity (length: number) {
    const curBufrer = this.buf
    if (curBufrer.byteLength < length) {
      let newLength = Math.max(curBufrer.byteLength, 1)
      while (newLength < length) {
        newLength *= 2
      }
      if (newLength > 0xFFFFFFFF) {
        throw new RangeError('RangeError')
      }
      const newBuffer = new ArrayBuffer(newLength)
      new Uint8Array(newBuffer).set(new Uint8Array(curBufrer))
      this.buf = newBuffer
    }
  }
  private reset() {
    this.view = new DataView(this.buf)
    this.u8view = new Uint8Array(this.buf)
  }
}
@NativeClass('ByteArrayClass')
export class ByteArrayClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    return new ByteArray(...args)
  }
}
