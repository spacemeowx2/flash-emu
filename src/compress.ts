import {inflate} from 'pako'
import {LZMA} from './lzma/LZMA'

export async function decompressZlib (input: ArrayBuffer) {
  return inflate(new Uint8Array(input)).buffer as ArrayBuffer
}
export async function decompressLZMA (input: ArrayBuffer, unpackLength: number) {
  const lzma = new LZMA()
  return lzma.decodeSWF(new Uint8Array(input), unpackLength).buffer as ArrayBuffer
}
