import {NativeClass, INativeClass, AXNativeClass, ApplicationDomain, AXObject, AXNativeObject, Dynamic, dynamicPassError} from '@/native'
@NativeClass('VectorClass')
export class VectorClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    throw new Error('not imp')
  }
}
class ObjectVector extends Array {
  self: AXObject
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
  dynamic_keys () {
    let out: any[] = []
    for (let i = 0; i < this.length; i++) {
      out.push(i)
    }
    return out
  }
  concat (...args: any[]) {
    let ret = super.concat(...args)
    let r: AXNativeObject = this.self.axClass.axNew() as any
    r.native = ret as any
    r.native.self = r as any
    return r as any
  }
  reverse () {
    let ret = super.reverse()
    let r: AXNativeObject = this.self.axClass.axNew() as any
    r.native = ret as any
    r.native.self = r as any
    return r as any
  }
}
@NativeClass('ObjectVectorClass')
@Dynamic()
export class ObjectVectorClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    const ret = new ObjectVector(...args)
    ret.self = self
    return ret
  }
}
