/**
 * LZMA Decoder
 * @author Nidin Vinayakan | nidinthb@gmail.com
 */

export class OutWindow {
  public totalPos: number
  public outStream: Uint8Array
  public outPos: number

  private buf: Uint8Array
  private pos: number
  private size: number
  private isFull: boolean

  constructor() {
    this.outPos = 0
  }
  public create(dictSize: number) { // UInt32
    this.buf = new Uint8Array(dictSize)
    this.pos = 0
    this.size = dictSize
    this.isFull = false
    this.totalPos = 0
  }

  public putByte(b: number) {
    this.totalPos++
    this.buf[this.pos++] = b
    if (this.pos === this.size) {
      this.pos = 0
      this.isFull = true
    }
    this.outStream[this.outPos++] = b
  }

  public getByte(dist: number) { // UInt32
    return this.buf[dist <= this.pos ? this.pos - dist : this.size - dist + this.pos]
  }

  public copyMatch(dist: number, len: number) { // UInt32 ,unsigned byte
    for (; len > 0; len--) {
      this.putByte(this.getByte(dist))
    }
  }

  public checkDistance(dist: number): boolean { // UInt32
    return dist <= this.pos || this.isFull
  }

  public isEmpty(): boolean {
    return this.pos === 0 && !this.isFull
  }
}
