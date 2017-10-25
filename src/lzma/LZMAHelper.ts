import {LZMA} from './LZMA'

export class LZMAHelper {
  static decoder: LZMA = new LZMA()
  static decoderAsync: Worker = new Worker('LZMAWorker.min.js')
  static callback: Function
  static ENCODE: number = 1
  static DECODE: number = 2

  static init(): void {
    let command = 0
    LZMAHelper.decoderAsync.onmessage = function(e) {
      if (command === 0) {
        command = e.data
      } else if (command === LZMAHelper.ENCODE) {
        command = 0 // encode not implemented
      } else if (command === LZMAHelper.DECODE) {
        command = 0
        LZMAHelper.callback(e.data)
        LZMAHelper.callback = null
      }
    }
  }

  static encode(data: ArrayBuffer): ArrayBuffer {
    return null
  }
  static decode(data: ArrayBuffer): ArrayBuffer {
    return LZMAHelper.decoder.decode(new Uint8Array(data)).buffer as ArrayBuffer
  }
  // static encodeAsync(data: ArrayBuffer,_callback: Function): void {
  // }
  static decodeAsync(data: ArrayBuffer,_callback: Function): void {
    if (LZMAHelper.callback == null) {
      LZMAHelper.callback = _callback
      LZMAHelper.decoderAsync.postMessage(LZMAHelper.DECODE)
      LZMAHelper.decoderAsync.postMessage(data,[data])
    } else {
      console.log('Warning! Another LZMA decoding is running...')
    }
  }
}

LZMAHelper.init()
