import {BufferReader} from '@/utils'
import {Context} from './compiler'
export type InsOperation = (context: Context, operand: any[]) => void
export interface Arch {
  getIns (reader: BufferReader): IterableIterator<Instruction>
  getBlocks (code: ArrayBuffer): BlockMap
}

export interface Instruction {
  offset: number
  length: number
  operand: any[]
  execute: InsOperation
  toJSON (): any
}
export class Block {
  id: number
  ins: Instruction[] = []
  succ: Block[] = []
  constructor (
    public startOffset: number
  ) {}
}
export class BlockMap extends Map<number, Block> {
  private nextID: number = 1
  get (key: number) {
    if (Number.isNaN(key)) {
      debugger
    }
    if (super.has(key)) {
      return super.get(key)
    } else {
      const block = new Block(key)
      block.id = this.nextID++
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
export {
  Context
}
