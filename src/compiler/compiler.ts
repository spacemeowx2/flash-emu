// https://www.free-decompiler.com/flash/docs/as3_pcode_instructions.en.html

import * as ABC from '@/abc'
import {Scope} from '@/runtime'
import {BufferReader} from '@/utils'
import {AVM2} from './avm2'
import {Instruction, Block, BlockMap, Arch} from './arch'

class Expr {
  //
}

class ASTBuilder {
  constructor () {
    //
  }
  buildIR (block: Block) {
    let stack = []
    let locals = []
    for (let ins of block.ins) {

    }
  }
}

export class Compiler {
  private arch: Arch
  constructor (
    archConstruct: {new (): Arch}
  ) {
    this.arch = new archConstruct()
  }
  compile (methodInfo: ABC.MethodInfo) {
    const abc = methodInfo.abc
    const methodBody = methodInfo.getBody()
    return this.arch.getBlocks(methodBody.code)
  }
}
