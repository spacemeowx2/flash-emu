import {LZMA} from './LZMA'
export class LZMAWorker {
  static ENCODE: number = 1
  static DECODE: number = 2
  private decoder: LZMA
  private command: any = null
  private time: number

  constructor () {
    this.decoder = new LZMA()

    addEventListener(
      'message', (e) => {
        if (this.command == null) {
          this.command = e.data
        } else if (this.command['job'] === 1) {
          this.command = null
        } else if (this.command['job'] === 2) {
          this.decode(e.data)
        }
      },
      false)
  }
  private decode(data: ArrayBuffer): void {
    this.time = Date.now()
    let result = this.decoder.decode(new Uint8Array(data))
    this.command['time'] = Date.now() - this.time;
    (postMessage as any)(this.command);
    (postMessage as any)(result.buffer, [result.buffer])
  }
}

new LZMAWorker()
