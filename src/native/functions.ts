import {NativeFuncClass, NativeFunction, Multiname} from '@/native'
import {Logger} from '@/logger'
const trace = new Logger('Trace')
const logger = new Logger('Functions')

export class GlobalFunctions extends NativeFuncClass {
  @NativeFunction()
  print (...args: any[]) {
    args = args.map(i => {
      return i && i.toString()
    })
    trace.log(...args)
  }
  @NativeFunction()
  casi32 (addr: number, expectedVal: number, newVal: number) {
    const app = this.app.sec.flashEmu.interpreter.getCurrentAPP()
    const view = app.domainMemory.view
    const old = view.getInt32(addr, true)
    if (old === expectedVal) {
      view.setInt32(addr, newVal, true)
    }
    return old
  }
  @NativeFunction()
  describeType (): any {
    return null
  }
}
