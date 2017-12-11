// https://www.free-decompiler.com/flash/docs/as3_pcode_instructions.en.html

import * as ABC from '@/abc'
import {Scope} from '@/runtime'
import {BufferReader} from '@/utils'
import {AVM2} from './avm2'
import {Instruction, Block, BlockMap, Arch} from './arch'

export interface Context {
  stack: any[]
  regs: any[]
}

class ASTBuilder {
  constructor () {
    //
  }
  buildIR (block: Block, {regsCount}: {regsCount: number}) {
    let context: Context = {
      stack: [],
      regs: []
    }
    for (let ins of block.ins) {
      ins.execute(context)
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
    // return this.arch.getBlocks(methodBody.code)
    
  }
}
