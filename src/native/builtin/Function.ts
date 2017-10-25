import {NativeClass, AXNativeClass, NativeAccessor, ApplicationDomain, AXClass} from '@/native'
import {ClassInfo, Multiname} from '@/abc'
import {Scope} from '@/runtime'
import {vm} from '@/value'
export class FunctionObj {
  func: Function
  call (self: RefValue, ...args: Value[]) {
    // console.error('Function.call')
    return this.func.call(self, ...args)
  }
  apply (self: RefValue, args: Value[]) {
    // console.error('Function.apply')
    return this.call(self, ...args)
  }
}
@NativeClass('FunctionClass')
export class FunctionClass extends AXNativeClass {
  axNewNative (): any {
    return new FunctionObj()
  }
  axConstruct (self: FunctionObj) {
    return self
  }
  applyClass (classInfo: ClassInfo, scope: Scope) {
    super.applyClass(classInfo, scope)
    const prototype = this.prototype
    const set = (name: string, val: Function) => {
      vm.setProperty(
        prototype,
        Multiname.Public(name),
        val)
    }
    const p = FunctionObj.prototype
    set('call', function (self: RefValue, ...args: Value[]) {
      this.call(self, ...args)
    })
    set('apply', function (self: RefValue, args: Value[]) {
      this.call(self, ...args)
    })
  }
}
