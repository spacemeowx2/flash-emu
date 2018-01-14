// https://www.free-decompiler.com/flash/docs/as3_pcode_instructions.en.html

import {Scope} from '@/runtime'
import {BufferReader} from '@/utils'
import {Logger} from '@/logger'
import {AVM2} from './avm2'
import {Instruction, Block, BlockMap, Arch} from './arch'
import * as AST from './ast'
import {AST2JS} from 'compiler/ast2js'
import {findLoop} from './loopFinder'
const logger = new Logger('Compiler')

export interface Context {
  stack: AST.ExpressionType[]
  local: ObservableArray<any>
  pushNode (stmt: AST.StatementType): void
}
interface KVListener<K, T> {
  onSet? (key: K, value: T): void
  onGet? (key: K, value: T): void
}

export class Compiler<T> {
  private arch: Arch<T>
  constructor (
    archConstruct: {new (): Arch<T>}
  ) {
    this.arch = new archConstruct()
  }
  compile (programInfo: T) {
    const blocks = this.arch.getBlocks(programInfo)
    logger.error(JSON.stringify(blocks, null, 2))
    const block = blocks.get(18)
    const ast = this.buildAST(block)
    const ast2js = new AST2JS(ast)
    logger.error(ast2js.toCode())

    let loops = findLoop(blocks.getList(), blocks.get(0))
    for (let loop of loops) {
      console.log(loop)
    }
  }
  buildAST (block: Block) {
    const builder = AST.builder
    let locals: AST.Identifier[] = []
    for (let i = 0; i < 10; i++) {
      locals.push(builder.identifier(`loc${i}`))
    }
    let stmts: AST.StatementType[] = []
    /**
     * TODO: 因为 DUP 会复制一部分树所以在赋值的时候检查之前是否
     * 赋值给了别的 loc, 是的话从那个 loc 取出来. 但是这里有个问
     * 题如果这个 loc 在 dup 之后被赋值了的话值是不对的.
     * 可能还需要一个反向表.
     * (我为什么不直接查一遍local呢)
     */
    let locMap = new WeakMap<any, number>()
    let context: Context = {
      stack: [],
      local: new ObservableArray(locals, {
        onSet (index, value) {
          if (locMap.has(value)) {
            const i = locMap.get(value)
            value = builder.identifier(`loc${i}`)
          }
          locMap.set(value, index)
          const stmt = builder.expressionStatement(
            builder.assignmentExpression(
              '=',
              builder.identifier(`loc${index}`),
              value
            )
          )
          stmts.push(stmt)
          locals[index] = builder.identifier(`loc${index}`)
        }
      }),
      pushNode (node) {
        stmts.push(node)
      }
    }

    try {
      for (let ins of block.ins) {
        logger.error(ins.toJSON())
        ins.execute(context)
        // logger.error(context)
      }
    } catch (e) {
      logger.error(e)
    }
    return builder.program(stmts)
    // logger.error(JSON.stringify(stmts, undefined, 2))
  }
}

class ObservableArray<T> {
  list: T[]
  constructor (list: T[], private listener?: KVListener<number, T>) {
    this.list = list
  }
  set (index: number, value: T): void {
    this.list[index] = value
    this.onSet(index, value)
  }
  get (index: number): T {
    let v = this.list[index]
    this.onGet(index, v)
    return v
  }
  private onSet (index: number, value: T) {
    if (this.listener && this.listener.onSet) {
      this.listener.onSet(index, value)
    }
  }
  private onGet (index: number, value: T) {
    if (this.listener && this.listener.onGet) {
      this.listener.onGet(index, value)
    }
  }
}
