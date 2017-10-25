/**
 * LZMA Decoder
 * @author Nidin Vinayakan | nidinthb@gmail.com
 */
import {MEMORY} from './MEMORY'

export class RangeDecoder {
  static kTopValue: number = (1 << 24)

  public inStream: Uint8Array
  public corrupted: boolean

  public idPos: number
  private range: number // UInt32
  private code: number // UInt32
  private rangeI: number = 0
  private codeI: number = 1
  private loc1: number = 2
  private loc2: number = 3
  private U32: Uint32Array
  private U16: Uint16Array

  constructor() {
    this.idPos = 13
  }
  public isFinishedOK(): boolean {
    return this.U32[this.codeI] === 0
  }
  public init(): void {
    this.U32 = new Uint32Array(4)
    this.U16 = new Uint16Array(4)
    this.corrupted = false

    if (this.inStream[this.idPos++] !== 0) {
      this.corrupted = true
    }

    this.U32[this.rangeI] = 0xFFFFFFFF
    this.U32[this.codeI] = 0

    for (let i: number = 0; i < 4; i++) {
      this.U32[this.codeI] = (this.U32[this.codeI] << 8) | this.inStream[this.idPos++]
    }

    if (this.U32[this.codeI] === this.U32[this.rangeI]) {
      this.corrupted = true
    }
  }

  public normalize() {
    if (this.U32[this.rangeI] < RangeDecoder.kTopValue) {
      this.U32[this.rangeI] <<= 8
      this.U32[this.codeI] = (this.U32[this.codeI] << 8) | this.inStream[this.idPos++]
    }
  }

  public decodeDirectBits(numBits: number): number {
    this.U32[this.loc1] = 0  // UInt32
    do {
      this.U32[this.rangeI] >>>= 1
      this.U32[this.codeI] -= this.U32[this.rangeI]
      this.U32[this.loc2] = 0 - (this.U32[this.codeI] >>> 31)
      this.U32[this.codeI] += this.U32[this.rangeI] & this.U32[this.loc2]

      if (this.U32[this.codeI] === this.U32[this.rangeI]){
        this.corrupted = true
      }

      this.normalize()
      this.U32[this.loc1] <<= 1
      this.U32[this.loc1] += this.U32[this.loc2] + 1
    }
    while (--numBits)
    return this.U32[this.loc1]
  }

  public decodeBit(prob: Uint16Array, index: number): number {
    this.U16[0] = prob[index]
    // bound
    this.U32[2] = (this.U32[0] >>> 11) * this.U16[0]
    // var symbol: number
    if (this.U32[1] < this.U32[2]) {
      this.U16[0] += ((1 << 11) - this.U16[0]) >>> 5
      this.U32[0] = this.U32[2]
      this.U16[1] = 0
    } else {
      // v -= v >>> LZMA.kNumMoveBits
      this.U16[0] -= this.U16[0] >>> 5
      this.U32[1] -= this.U32[2]
      this.U32[0] -= this.U32[2]
      this.U16[1] = 1
    }
    prob[index] = this.U16[0]
    // this.normalize()
    if (this.U32[0] < 16777216) {
      this.U32[0] <<= 8
      this.U32[1] = (this.U32[1] << 8) | this.inStream[this.idPos++]
    }
    return this.U16[1]
  }
}
