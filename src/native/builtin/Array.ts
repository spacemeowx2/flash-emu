import {vm, NativeAccessor, AXClass, NativeClass, AXNativeClass, ApplicationDomain} from '@/native'

class ArrayObj extends Array {
  toString () {
    return super.toString()
  }
}
@NativeClass('ArrayClass')
export class ArrayClass extends AXNativeClass {
  constructor (app: ApplicationDomain, public name: string, superCls?: AXClass) {
    super(app, name, superCls)
    this.accessor = new NativeAccessor<ArrayObj>({
      shouldHandle (k: any): boolean {
        return typeof k === 'number'
      },
      set (self: ArrayObj, key: any, value: Value) {
        self[key] = value
      },
      get (self: ArrayObj, key: any): Value {
        return self[key]
      },
      has (self: ArrayObj, key: any): boolean {
        return self[key] !== undefined
      },
      delete (self: ArrayObj, key: any): boolean {
        return delete self[key]
      }
    })
  }
  axBox (v: any) {
    return this.axNew(...v)
  }
  axConstruct (self: ArrayObj, arrayLength?: number) {
    let ret = new ArrayObj()
    if (arrayLength) {
      ret.length = arrayLength
    }
    return ret
  }
}
