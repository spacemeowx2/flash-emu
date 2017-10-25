import {NativeClass, Dynamic, AXNativeClass, INativeClass, ApplicationDomain, AXObject} from '@/native'
class Dictionary {
  dict: Map<any, any> | WeakMap<any, any>
  constructor (weakKeys = false) {
    this.dict = new Map()
  }
  dynamic_shouldHandle (k: any) {
    return true
  }
  dynamic_set (k: any, v: any) {
    // console.error('Dictionary.set', k, v)
    return this.dict.set(k, v)
  }
  dynamic_get (k: any) {
    // console.error('Dictionary.get', k)
    return this.dict.get(k)
  }
  dynamic_has (k: any) {
    return this.dict.has(k)
  }
}
@NativeClass('DictionaryClass')
@Dynamic()
export class DictionaryClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    return new Dictionary(...args)
  }
}
