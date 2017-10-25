import {NativeClass, INativeClass, ApplicationDomain, AXNativeClass, AXObject, AXNativeObject, Dynamic} from '@/native'
import {Multiname} from '@/abc'
export class FunctionObj {
  func: Function
  call (self: AXObject, ...args: any[]) {
    // console.error('Function.call')
    return this.func.call(self, ...args)
  }
  apply (self: AXObject, args: any[] | AXNativeObject) {
    // console.error('Function.apply')
    if (args instanceof AXNativeObject) {
      args = args.native as any as any[]
    }
    return this.call(self, ...args)
  }
}
@NativeClass('FunctionClass')
export class FunctionClass implements INativeClass {
  constructor (public self: AXNativeClass) {

  }
  axNewNative (self: AXObject, ...args: any[]): any {
    return new FunctionObj(...args)
  }
  _onPrototype (prototype: AXObject, self: AXNativeClass) {
    const set = (name: string, val: Function) => {
      prototype.axSetProperty(
        Multiname.Public(name),
        function (this: AXNativeObject, ...args: any[]) {
          return val.call(this.native, ...args)
        },
        false)
    }
    const p = FunctionObj.prototype
    set('call', p.call)
    set('apply', p.apply)
  }
}
