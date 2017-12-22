import {Arch, Instruction, BlockMap, InsOperation, Context} from './arch'
import {OpcodeParam, Bytecode, getBytecodeName} from '@/ops'
import {BufferReader} from '@/utils'
import * as AST from './ast'
const builder = new AST.ASTBuilder()
export class AVM2 implements Arch {
  *getIns (reader: BufferReader): IterableIterator<AVM2Instruction> {
    for (;!reader.isEOF();) {
      let ins = new AVM2Instruction()
      ins.offset = reader.ptr
      let bc = reader.readU8()
      ins.bytecode = bc
      const ps = OpcodeParam[bc]
      if (ps) {
        for (let p of ps) {
          if (p === '2') {
            ins.operand.push(reader.readS24())
          } else if (p === '3') {
            ins.operand.push(reader.readU30())
          } else if (p === '8') {
            ins.operand.push(reader.readS8())
          }
        }
      }
      ins.length = reader.ptr - ins.offset
      yield ins
    }
  }
  getBlocks (code: ArrayBuffer) {
    let ins = []
    let blocks: BlockMap = new BlockMap()
    const reader = new BufferReader(code)

    const branchCode = [
      Bytecode.IFEQ,
      Bytecode.IFFALSE,
      Bytecode.IFGE,
      Bytecode.IFGT,
      Bytecode.IFLE,
      Bytecode.IFLT,
      Bytecode.IFNE,
      Bytecode.IFNGE,
      Bytecode.IFNLE,
      Bytecode.IFNLT,
      Bytecode.IFSTRICTEQ,
      Bytecode.IFSTRICTNE,
      Bytecode.IFTRUE,
      Bytecode.JUMP
    ]
    let curBlock = blocks.get(0)
    for (let i of this.getIns(reader)) {
      const offset = i.offset
      if (blocks.has(offset)) {
        curBlock = blocks.get(offset)
      }
      curBlock.ins.push(i)
      if (branchCode.includes(i.bytecode)) {
        const insEnd = offset + i.length
        curBlock = blocks.get(insEnd)
        let targetOffset: number = insEnd + i.operand[0]
        blocks.get(targetOffset) // new a block
      }
    }
    return blocks
  }
}
export class AVM2Instruction implements Instruction {
  offset: number = -1
  length: number = -1
  operand: any[] = []
  bytecode: Bytecode = Bytecode.UNKNOWN
  execute: InsOperation
  toJSON (): any {
    return `${this.offset} ${this.length} ${getBytecodeName(this.bytecode)}${this.operand.map(i => ` ${i.toString()}`).join('')}`
  }
}
class InstructionExecute {
  [key: number]: InsOperation
  static [Bytecode.ADD] (c: Context) {
    c.stack.push(builder.binaryExpress(c.stack.pop(), c.stack.pop(), '+'))
  }
  static [Bytecode.PUSHUNDEFINED] (c: Context) {
    c.stack.push(new AST.RefNode(undefined))
  }
  static [Bytecode.PUSHBYTE] (c: Context, operand: any[]) {
    c.stack.push(new AST.RefNode(operand[0]))
  }
  static [Bytecode.COERCE_A] (c: Context) {
    //
  }
  static [Bytecode.SETLOCAL1] (c: Context) {
    c.local[1] = c.stack.pop()
  }
  static [Bytecode.SETLOCAL2] (c: Context) {
    c.local[2] = c.stack.pop()
  }
  static [Bytecode.SETLOCAL3] (c: Context) {
    c.local[3] = c.stack.pop()
  }
}
