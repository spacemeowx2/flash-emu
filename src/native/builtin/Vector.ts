import {NativeClass, NativeAccessor, AXNativeClass, ApplicationDomain, AXClass} from '@/native'

@NativeClass('VectorClass')
export class VectorClass extends AXNativeClass {
  axNewNative (): RefValue {
    throw new Error('not imp')
  }
}
class ObjectVector extends Array {
  fuckyou = 1
  toString () {
    return super.toString()
  }
}
@NativeClass('ObjectVectorClass')
export class ObjectVectorClass extends AXNativeClass {
  constructor (app: ApplicationDomain, public name: string, superCls?: AXClass) {
    super(app, name, superCls)
    this.accessor = new NativeAccessor<ObjectVector>({
      shouldHandle (k: any): boolean {
        return typeof k === 'number'
      },
      set (self: ObjectVector, key: any, value: Value) {
        self[key] = value
      },
      get (self: ObjectVector, key: any): Value {
        return self[key]
      },
      has (self: ObjectVector, key: any): boolean {
        return self[key] !== undefined
      },
      delete (self: ObjectVector, key: any): boolean {
        return delete self[key]
      },
      keys (self: ObjectVector) {
        let out: any[] = []
        for (let i = 0; i < self.length; i++) {
          out.push(i)
        }
        return out
      }
    })
  }
  axNewNative () {
    return new ObjectVector()
  }
  axConstruct (self: ObjectVector, arrayLength?: number) {
    if (arrayLength) {
      self.length = arrayLength
    }
    return self
  }
}
