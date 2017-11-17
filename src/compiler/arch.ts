import {BufferReader} from '@/utils'
export interface Arch {
  getIns (reader: BufferReader): IterableIterator<Instruction>
  getBlocks (code: ArrayBuffer): BlockMap
}
export interface Instruction {
  offset: number
  length: number
  operand: any[]
  toJSON (): any
}
export class Block {
  ins: Instruction[] = []
  constructor (
    public startOffset: number
  ) {}
}
export class BlockMap extends Map<number, Block> {
  get (key: number) {
    if (Number.isNaN(key)) {
      debugger
    }
    if (super.has(key)) {
      return super.get(key)
    } else {
      const block = new Block(key)
      super.set(key, block)
      return block
    }
  }
  toJSON () {
    let out: any = {}
    for (let k of this.keys()) {
      out[k] = this.get(k)
    }
    return out
  }
}
