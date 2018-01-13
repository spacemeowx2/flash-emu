import {Arch, Instruction, BlockMap, InsOperation} from './arch'
import {Context} from './compiler'
import {OpcodeParam, Bytecode, getBytecodeName} from '@/ops'
import {BufferReader} from '@/utils'
import * as AST from './ast'
import { Logger } from 'logger'
const builder = new AST.ASTBuilder()
const logger = new Logger('avm2')

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
  [key: number]: InsOperation
  offset: number = -1
  length: number = -1
  operand: any[] = []
  bytecode: Bytecode = Bytecode.UNKNOWN
  toJSON (): any {
    return `${this.offset} ${this.length} ${getBytecodeName(this.bytecode)}${this.operand.map(i => ` ${i.toString()}`).join('')}`
  }
  execute (context: Context): void {
    this[this.bytecode](context)
  }
  unaryExp (c: Context, op: AST.UnaryOp, isPrefix: boolean) {
    c.stack.push(builder.unaryExpression(op, c.stack.pop(), isPrefix))
  }
  binaryExp (c: Context, op: AST.BinOp) {
    const b = c.stack.pop()
    const a = c.stack.pop()
    c.stack.push(builder.BinaryExpression(a, b, op))
  }
  [Bytecode.NOT] (c: Context) {
    this.unaryExp(c, '!', true)
  }
  [Bytecode.ADD] (c: Context) {
    this.binaryExp(c, '+')
  }
  [Bytecode.MODULO] (c: Context) {
    this.binaryExp(c, '%')
  }
  [Bytecode.MULTIPLY] (c: Context) {
    this.binaryExp(c, '*')
  }
  [Bytecode.DIVIDE] (c: Context) {
    this.binaryExp(c, '/')
  }
  [Bytecode.POP] (c: Context) {
    c.stack.pop()
  }
  [Bytecode.DUP] (c: Context) {
    const t = c.stack[c.stack.length - 1]
    c.stack.push(t)
  }
  [Bytecode.PUSHUNDEFINED] (c: Context) {
    c.stack.push(AST.builder.literal(undefined))
  }
  [Bytecode.PUSHBYTE] (c: Context) {
    c.stack.push(AST.builder.literal(this.operand[0]))
  }
  [Bytecode.KILL] () {
    //
  }
  [Bytecode.LABEL] () {
    //
  }
  [Bytecode.COERCE_A] () {
    //
  }
  [Bytecode.SETLOCAL0] (c: Context) {
    c.local.set(0, c.stack.pop())
  }
  [Bytecode.SETLOCAL1] (c: Context) {
    c.local.set(1, c.stack.pop())
  }
  [Bytecode.SETLOCAL2] (c: Context) {
    c.local.set(2, c.stack.pop())
  }
  [Bytecode.SETLOCAL3] (c: Context) {
    c.local.set(3, c.stack.pop())
  }
  [Bytecode.SETLOCAL] (c: Context) {
    c.local.set(this.operand[0], c.stack.pop())
  }
  [Bytecode.GETLOCAL0] (c: Context) {
    c.stack.push(c.local.get(0))
  }
  [Bytecode.GETLOCAL1] (c: Context) {
    c.stack.push(c.local.get(1))
  }
  [Bytecode.GETLOCAL2] (c: Context) {
    c.stack.push(c.local.get(2))
  }
  [Bytecode.GETLOCAL3] (c: Context) {
    c.stack.push(c.local.get(3))
  }
  [Bytecode.GETLOCAL] (c: Context) {
    c.stack.push(c.local.get(this.operand[0]))
  }
  [Bytecode.JUMP] (c: Context) {
    //
  }
}
