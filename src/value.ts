import {Multiname} from './abc'
import {AutoMap} from './utils'
import {SecurityDomain} from './runtime'
type Value = object
type Primitive =
  | boolean
  | number
  | string
  | symbol
  | null
  | undefined
enum ESType {
  string,
  number,
  object,
  boolean,
  undefined
}
class PropertyDescriptor {
  configurable?: boolean
  enumerable?: boolean
  value?: any
  writable?: boolean
  native?: boolean
  get?: () => any
  set?: (v: any) => void
}
interface MetaAccessor {

}
interface IValueManager {
  initProperty (self: Value, mn: Multiname, value: Value): void
  setProperty (self: Value, mn: Multiname, value: Value): void
  getProperty (self: Value, mn: Multiname): Value
  hasProperty (self: Value, mn: Multiname): boolean
  deleteProperty (self: Value, mn: Multiname): boolean
  newValue (): Value
  registerObject (obj: Value): void
  box (x: Primitive): Value
  unbox (x: Value): Primitive
  getUndefined (): Value
  createClass (): Value
}
class ClassManager {
  constructor (public sec: SecurityDomain) {
    //
  }
}
class ValueAccessor {

}
type PropertyMap = Map<string, PropertyDescriptor>
type ValueWeakMap<T> = WeakMap<Value, T>
class ValueManager implements IValueManager {
  private publicProps: ValueWeakMap<PropertyMap> = new WeakMap()
  private namespaceProps: ValueWeakMap<AutoMap<string, PropertyMap>> = new WeakMap()
  private vPrototype: ValueWeakMap<Value> = new WeakMap()
  private vType: ValueWeakMap<ESType> = new WeakMap()
  private vValue: ValueWeakMap<Primitive> = new WeakMap()
  constructor (public sec: SecurityDomain) {
    //
  }
  newValue (type: ESType = ESType.undefined) {
    const obj = Object.create(null)
    this.vType.set(obj, type)
    return obj
  }
  getProperty (self: Value, mn: Multiname, that: Value = self): Value {
    const ns = mn.nsSet[0]
    let props: PropertyMap
    if (ns.isPublic()) {
      props = this.publicProps.get(self)
    } else {
      props = this.namespaceProps.get(self).get(ns.mangledName)
    }
    if (props.has(mn.name)) {
      const desc = props.get(mn.name)
      if (desc.get) {
        return desc.get.call(that)
      }
      return desc.value
    } else {
      const proto = this.vPrototype.get(self)
      if (proto) {
        return this.getProperty(proto, mn, that)
      }
      return undefined
    }
  }
  getUndefined () {
    return this.newValue(ESType.undefined)
  }
}
