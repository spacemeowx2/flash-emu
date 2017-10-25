import {dynamicPassError, AXClass, NativeClass, AXNativeClass, INativeClass, ApplicationDomain, AXObject, Dynamic} from '@/native'
class ArrayObj extends Array {
  toString () {
    return super.toString()
  }
  dynamic_shouldHandle (k: any) {
    return typeof k === 'number'
  }
  dynamic_set (k: any, v: any) {
    this[k] = v
  }
  dynamic_get (k: any) {
    return this[k]
  }
  dynamic_has (k: any) {
    return this[k] !== undefined
  }
}
@NativeClass('ArrayClass')
@Dynamic()
export class ArrayClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axBox (v: any, self: AXClass) {
    return self.axNew(...v)
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    return new ArrayObj(...args)
  }
}
