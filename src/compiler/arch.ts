import {BufferReader} from '@/utils'
import {AbcFile} from '@/abc'
import {Context} from './compiler'
import {IGraphNode} from './loopFinder'
export type InsOperation = (context: Context) => void
export interface Arch<T> {
  getBlocks (programInfo: T): BlockMap
}

export interface Instruction {
  offset: number
  length: number
  operand: any[]
  execute: InsOperation
  toJSON (): any
}
export class Region {
  id: number
  blocks: Block[] = []
  children: Region[] = []
}
export class Block implements IGraphNode {
  id: number
  ins: Instruction[] = []
  succs: Block[] = []
  constructor (
    public startOffset: number
  ) {}
  toJSON () {
    return {
      id: this.id,
      ins: this.ins,
      succ: this.succs.map(i => i.id)
    }
  }
}
export class BlockMap extends Map<number, Block> {
  private list: Block[] = []
  private nextID: number = 1
  get (key: number) {
    if (Number.isNaN(key)) {
      debugger
    }
    if (super.has(key)) {
      return super.get(key)
    } else {
      const block = new Block(key)
      this.list.push(block)
      block.id = this.nextID++
      super.set(key, block)
      return block
    }
  }
  getList () {
    return this.list
  }
  toJSON () {
    let out: any = {}
    for (let k of this.keys()) {
      out[k] = this.get(k)
    }
    return out
  }
}
