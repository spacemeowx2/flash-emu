import {MethodInfo} from 'abc'
import {Scope} from 'runtime'
import {ApplicationDomain} from 'native'
import {Interpreter} from 'interpreter'
import {Compiler} from 'compiler'
import {AVM2} from 'compiler/avm2'
export class Executor {
  globalStacks: MethodInfo[] = []
  interpreter = new Interpreter()
  compiler = new Compiler(AVM2)
  selector (methodInfo: MethodInfo) {
  }
  executeMethod (self: any, methodInfo: MethodInfo, savedScope: Scope, callArgs: any[], callee: any): any {
    return this.interpreter.interpret(self, methodInfo, savedScope, callArgs, callee)
  }
  getCurrentAPP (): ApplicationDomain {
    return this.interpreter.getCurrentAPP()
  }
}
