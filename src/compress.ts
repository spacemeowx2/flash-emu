import {inflate} from 'pako'
import {LZMA} from './lzma/LZMA'

const lzma = new LZMA()
export async function decompressZlib (input: ArrayBuffer) {
  return inflate(new Uint8Array(input)).buffer as ArrayBuffer
}
export async function decompressLZMA (input: ArrayBuffer, unpackLength: number) {
  return lzma.decodeSWF(new Uint8Array(input), unpackLength).buffer as ArrayBuffer
}
