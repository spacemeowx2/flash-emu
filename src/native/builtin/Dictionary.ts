import {vm, NativeClass, AXNativeClass, NativeAccessor, ApplicationDomain, AXClass} from '@/native'
class Dictionary {
  dict: Map<any, any> | WeakMap<any, any>
  constructor (weakKeys = false) {
    this.dict = new Map()
  }
}
@NativeClass('DictionaryClass')
export class DictionaryClass extends AXNativeClass {
  constructor (app: ApplicationDomain, public name: string, superCls?: AXClass) {
    super(app, name, superCls)
    this.accessor = new NativeAccessor<Dictionary>({
      shouldHandle (k: any): boolean {
        return true
      },
      set (self: Dictionary, key: any, value: Value) {
        self.dict.set(key, value)
      },
      get (self: Dictionary, key: any): Value {
        return self.dict.get(key)
      },
      has (self: Dictionary, key: any): boolean {
        return self.dict.has(key)
      },
      delete (self: Dictionary, key: any): boolean {
        return self.dict.delete(key)
      }
    })
  }
  axConstruct (self: Dictionary, weakKeys = false) {
    return new Dictionary(weakKeys)
  }
}
