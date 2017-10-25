import * as ABC from './abc'
import {Scope} from './runtime'

class Relooper {

}

export class Compiler {
  abc: ABC.AbcFile
  methodBody: ABC.MethodBodyInfo
  constructor (
    public methodInfo: ABC.MethodInfo,
    private scope: Scope,
    private hasDynamicScope: boolean,
    private globalMiName: string
  ) {
    this.abc = this.methodInfo.abc
    this.methodBody = this.methodInfo.getBody()
  }
  compile () {
    
  }
  analyzedControlFlow () {
    
  }
}
