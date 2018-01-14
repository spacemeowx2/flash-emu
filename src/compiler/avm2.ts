// 
import {Arch, Instruction, BlockMap, InsOperation} from './arch'
import {Context} from './compiler'
import {OpcodeParam, Bytecode, getBytecodeName} from '@/ops'
import {BufferReader} from '@/utils'
import {AbcFile, MethodInfo} from '@/abc'
import * as AST from './ast'
import { Logger } from 'logger'
const builder = new AST.ASTBuilder()
const logger = new Logger('avm2')

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

export class AVM2 implements Arch<MethodInfo> {
  *getIns (reader: BufferReader, abc: AbcFile): IterableIterator<AVM2Instruction> {
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
      ins.resolveOperand(abc)
      yield ins
    }
  }
  getBlocks (methodInfo: MethodInfo) {
    const abc = methodInfo.abc
    const methodBody = methodInfo.getBody()
    const code: ArrayBuffer = methodBody.code
    let ins = []
    let blocks: BlockMap = new BlockMap()
    const reader = new BufferReader(code)

    let curBlock = blocks.get(0)
    for (let i of this.getIns(reader, abc)) {
      const offset = i.offset
      if (blocks.has(offset)) {
        const newBlock = blocks.get(offset)
        if (newBlock !== curBlock) {
          curBlock.succ.push(newBlock)
        }
        curBlock = newBlock
      }
      curBlock.ins.push(i)
      if (branchCode.includes(i.bytecode)) {
        const insEnd = offset + i.length
        let targetOffset: number = i.operand[0]
        const lastBlock = curBlock
        curBlock = blocks.get(insEnd)
        const targetBlock = blocks.get(targetOffset) // new a block
        if (i.bytecode === Bytecode.JUMP) {
          lastBlock.succ = [targetBlock]
        } else {
          lastBlock.succ.push(curBlock, targetBlock)
        }
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
  resolveOperand (abc: AbcFile) {
    if (branchCode.includes(this.bytecode)) {
      this.operand[0] = this.offset + this.length + this.operand[0]
    } else {
      switch (this.bytecode) {
        case Bytecode.FINDPROPERTY:
        case Bytecode.FINDPROPSTRICT:
        case Bytecode.CALLPROPERTY:
          this.operand[0] = abc.getMultiname(this.operand[0])
          break
      }
    }
  }
  unaryExp (c: Context, op: AST.UnaryOp, isPrefix: boolean) {
    c.stack.push(builder.unaryExpression(op, c.stack.pop(), isPrefix))
  }
  binaryExp (c: Context, op: AST.BinOp) {
    const b = c.stack.pop()
    const a = c.stack.pop()
    c.stack.push(builder.binaryExpression(a, b, op))
  }
  assignLocal (i: number, {pushNode, stack, local}: Context) {
    pushNode(builder.expressionStatement(builder.assignmentExpression(
      '=',
      local.get(i),
      stack.pop()
    )))
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
  [Bytecode.INCREMENT] (c: Context) {
    const e = c.stack.pop()
    c.stack.push(builder.binaryExpression(e, builder.literal(1), '+'))
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
  [Bytecode.IFSTRICTNE] ({pushNode, stack}: Context) {
    const b = stack.pop()
    const a = stack.pop()
    const test = builder.binaryExpression(a, b, '!==')
    pushNode(builder.ifStatement(
      test, builder.jumpStatement(this.operand[0])
    ))
  }
}
