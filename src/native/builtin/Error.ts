import {NativeClass, INativeClass, ApplicationDomain, AXObject, AXNativeClass} from '@/native'
class ReferenceError extends Error {
  self: AXObject
  constructor (...args: any[]) {
    super(...args)
    // console.error('ReferenceError', ...args)
  }
}
@NativeClass('ReferenceErrorClass')
export class ReferenceErrorClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    return new ReferenceError(...args)
  }
}
