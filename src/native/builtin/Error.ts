import {NativeClass, ApplicationDomain, AXNativeClass} from '@/native'
import {vm} from '@/value'
class ReferenceError extends Error {
  constructor (...args: any[]) {
    super(...args)
    // console.error('ReferenceError', ...args)
  }
}
@NativeClass('ReferenceErrorClass')
export class ReferenceErrorClass extends AXNativeClass {
  axConstruct (self: RefValue, ...args: any[]): any {
    return new ReferenceError(...args)
  }
  axIsType (v: RefValue) {
    return v instanceof ReferenceError
  }
}

@NativeClass('TypeErrorClass')
export class TypeErrorClass extends AXNativeClass {
  axConstruct (self: RefValue, ...args: any[]): any {
    return new TypeError(...args)
  }
  axIsType (v: RefValue) {
    return v instanceof TypeError
  }
}
