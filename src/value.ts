// http://help.adobe.com/en_US/ActionScript/3.0_ProgrammingAS3/WS5b3ccc516d4fbf351e63e3d118a9b90204-7f3f.html#WS5b3ccc516d4fbf351e63e3d118a9b90204-7f19
import {Multiname, Namespace, Traits, ClassInfo} from './abc'
import * as ABC from './abc'
import {AXClass} from './base'
import {AutoMap, AutoWeakMap, DefaultWeakMap} from './utils'
import {SecurityDomain, ApplicationDomain, Scope} from './runtime'
import {TRAIT, NamespaceType} from './CONSTANT'
import {Logger} from './logger'
import {functionEnd, functionStart} from './profile'
const logger = new Logger('Value')

export class PropertyDescriptor {
  configurable?: boolean = true
  enumerable?: boolean = true
  value?: Value
  writable?: boolean = true
  native?: boolean = false
  get?: () => Value
  set?: (v: Value) => void
  constructor (desc?: PropertyDescriptor) {
    if (desc) {
      this.configurable = desc.configurable
      this.enumerable = desc.enumerable
      this.value = desc.value
      this.writable = desc.writable
      this.native = desc.native
      this.get = desc.get
      this.set = desc.set
    }
  }
}
interface IProxy {
  callProperty (name: string, ...args: Value[]): Value
}
interface IValueManager {
  initProperty (self: RefValue, mn: Multiname, value: Value): void
  setProperty (self: RefValue, mn: Multiname, value: Value): void
  setDescriptor (self: RefValue, mn: Multiname, value: Value): void
  getProperty (self: RefValue, mn: Multiname): Value
  hasProperty (self: RefValue, mn: Multiname): boolean
  deleteProperty (self: RefValue, mn: Multiname): boolean
  getEnumerableKeys (self: RefValue): string[]
  hasPropertyInternal (self: RefValue, mn: Multiname): boolean
  setSlot (self: RefValue, index: number, value: Value): void
  getSlot (self: RefValue, index: number): Value
  newObject (app: ApplicationDomain): RefValue
  registerObject (obj: RefValue, app: ApplicationDomain): boolean
  replaceObject (oldObj: RefValue, newObj: RefValue): RefValue
  getUndefined (): RefValue

  createClass (app: ApplicationDomain, newCls: ClassInfo, superCls: AXClass, scope: Scope): AXClass
  constructProperty (self: RefValue, mn: Multiname, args: Value[]): RefValue
  callProperty (self: RefValue, mn: Multiname, args: Value[]): Value
  callSuper (self: RefValue, mn: Multiname, scope: Scope, args: Value []): Value
  isPrototypeOf (self: RefValue, target: RefValue): boolean

  bindTrait (target: RefValue, traits: RuntimeTraits): void
  getTrait (self: RefValue): RuntimeTraits
  applyTrait (app: ApplicationDomain, target: RefValue, newTraits: Traits, scope: Scope): void
  setClass (self: RefValue, cls: AXClass): void
  getClass (self: RefValue): AXClass

  getProxy (self: RefValue): IProxy
}
class ValueAccessor {
  property: ValueWeakMap<Map<MangledName, PropertyDescriptor>>
  constructor (protected vm: ValueManager) {
    this.property = vm.vProperty
  }
  resolveName (self: RefValue, mn: Multiname, isSet = false, target: RefValue = self): string {
    let result: string = undefined
    const prop = this.property.get(target)
    if (mn.nsSet.length === 1) {
      const mangled = mn.mangledName
      if (isSet || prop.has(mangled)) {
        result = mangled
      }
    } else {
      const name = mn.name
      for (let ns of mn.nsSet) {
        const mangled = Multiname.MangledName(ns, name)
        if (prop.has(mangled)) {
          result = mangled
          break
        }
      }
    }
    if (result === undefined) {
      const proto = this.vm.vPrototype.get(target)
      if (proto) {
        result = this.resolveName(self, mn, isSet, proto)
      }
    }
    if (isSet && result === undefined) {
      result = mn.mangledName
      if (mn.nsSet.length > 1) {
        logger.warn('More then one namespace found')
      }
    }
    return result
  }
  get (self: RefValue, mn: Multiname): Value {
    const desc = this.getDescriptor(self, mn)
    if (desc) {
      if (desc.get) {
        return desc.get.call(self)
      }
      return desc.value
    }
    return undefined
  }
  init (self: RefValue, mn: Multiname, value: Value) {
    // const props: PropertyMap = this.getProps(self, mn)
    // const pdesc = props.get(mn.name)
    // if (pdesc && pdesc.value !== undefined) {
      // TODO: Do some check like scope check
      // logger.warn('Attempt to init a exist property', mn.name)
      // throw new Error('Attempt to init a exist property')
    // }
    this.set(self, mn, value)
  }
  setDescriptor (self: RefValue, mn: Multiname, desc: PropertyDescriptor) {
    const mangled = this.resolveName(self, mn, true)
    this._setDescriptor(self, mangled, desc)
  }
  getDescriptor (self: RefValue, mn: Multiname): PropertyDescriptor {
    const mangled = this.resolveName(self, mn)
    return this._getDescriptor(self, mangled, self)
  }
  set (self: RefValue, mn: Multiname, val: Value): void {
    const mangled = this.resolveName(self, mn, true)
    this._set(self, mangled, val, self)
  }
  has (self: RefValue, mn: Multiname): boolean {
    return this.resolveName(self, mn) !== undefined // TODO: should we lookup prototype
  }
  delete (self: RefValue, mn: Multiname) {
    const mangled = this.resolveName(self, mn, true)
    const props = this.property.get(self)
    return props.delete(mangled)
  }
  keys (self: RefValue) {
    const props = this.property.get(self)
    let keys: string[] = []
    for (let key of props.keys()) {
      if (typeof key as any === 'number') {
        keys.push(key.toString())
        continue
      }
      let name = Multiname.stripPublicMangledName(key)
      if (name) {
        keys.push(name)
      }
    }
    return keys
  }
  protected _set (self: RefValue, mangled: string, val: Value, target: RefValue): void {
    const props = this.property.get(target)
    if (props.has(mangled)) {
      const desc = props.get(mangled)
      if (desc.set) {
        return desc.set.call(self, val)
      }
      if (target === self) {
        desc.value = val
      } else {
        let nd = new PropertyDescriptor(desc)
        nd.value = val
        this._setDescriptor(self, mangled, nd)
      }
    } else {
      const proto = this.vm.vPrototype.get(target)
      if (proto) {
        return this._set(self, mangled, val, proto)
      }
      this._setDescriptor(self, mangled, new PropertyDescriptor({
        value: val
      }))
    }
  }
  protected _setDescriptor (self: RefValue, mangled: string, desc: PropertyDescriptor) {
    const props = this.property.get(self)
    props.set(mangled, desc)
  }
  protected _getDescriptor (self: RefValue, mangled: string, target: RefValue): PropertyDescriptor {
    const props = this.property.get(target)
    if (props.has(mangled)) {
      const desc = props.get(mangled)
      return desc
    } else {
      const proto = this.vm.vPrototype.get(target)
      if (proto) {
        return this._getDescriptor(self, mangled, proto)
      }
      return undefined
    }
  }
}
export class TraitAccessor extends ValueAccessor {
  private traits: ValueWeakMap<RuntimeTraits>
  private slotProps: ValueWeakMap<Array<PropertyDescriptor>>
  private vClass: ValueWeakMap<AXClass>
  constructor (vm: ValueManager) {
    super(vm)
    this.traits = vm.vTraits
    this.slotProps = vm.vSlotProps
    this.vClass = vm.vClass
  }
  resolveName (self: RefValue, mn: Multiname, isSet = false, target: RefValue = self): string {
    let name = mn.name
    let t = this.traits.get(self).getTrait(mn.nsSet, name)
    // TODO: 可能不应该用 Public ?
    return t ? t.name.mangledName : Multiname.PublicMangledName(name)
  }
  bindTrait (target: RefValue, traits: RuntimeTraits) {
    if (this.traits.has(target)) {
      throw new Error(`Don't bind Traits twice`)
    }
    this.traits.set(target, traits)
    this._syncSlot(target)
  }
  setSlot (self: RefValue, index: number, val: Value): void {
    let desc = this.slotProps.get(self)[index]
    if (desc.set) {
      return desc.set.call(self, val)
    }
    desc.value = val
  }
  getSlot (self: RefValue, index: number): Value {
    let desc = this.slotProps.get(self)[index]
    if (desc.get) {
      return desc.get.call(self)
    }
    return desc.value
  }
  get (self: RefValue, mn: Multiname) {
    let result = super.get(self, mn)
    if (result instanceof Function) {
      result = this.vm.vApp.get(self).boxFunction(result.bind(self))
    }
    return result
  }
  setClass (self: RefValue, cls: AXClass) {
    if (this.vClass.has(self)) {
      throw new Error('Can not set class twice')
    }
    this.vClass.set(self, cls)
  }
  getClass (self: RefValue) {
    return this.vClass.get(self)
  }
  hasPropertyInternal (self: RefValue, mn: Multiname): boolean {
    if (this.traits.get(self).getTrait(mn.nsSet, mn.name)) {
      return true
    }
    return this.property.get(self).get(mn.mangledName) !== undefined
  }
  applyTrait (target: RefValue, app: ApplicationDomain, newTraits: Traits, scope: Scope) {
    const sec = app.sec
    let traits = this.traits.get(target)
    if (!traits) {
      throw new Error('bind traits first')
    }
    let toAppendTrait: RuntimeTraitInfo[] = []
    for (let trait of newTraits) {
      let runtimeTrait = new RuntimeTraitInfo(trait.name, trait.kindType)

      let method
      switch (trait.kindType) {
        case TRAIT.Method:
          method = app.createMethodForTrait(trait, scope)
          runtimeTrait.value = method
          break
        case TRAIT.Getter:
          runtimeTrait.get = app.createMethodForTrait(trait, scope) as any
          break
        case TRAIT.Setter:
          runtimeTrait.set = app.createMethodForTrait(trait, scope) as any
          break
        case TRAIT.Slot:
        case TRAIT.Const:
        case TRAIT.Class:
          const slotTrait = trait.data as ABC.TraitSlot
          runtimeTrait.writable = true
          runtimeTrait.value = slotTrait.getDefaultValue()
          runtimeTrait.typeName = slotTrait.typeName
          runtimeTrait.slot = slotTrait.slotId
          traits.addSlotTrait(runtimeTrait)
          break
        default:
          throw new Error('TRAIT type unexcept ' + trait.kindType)
      }
      let currentTrait = traits.addTrait(runtimeTrait)
      toAppendTrait.push(runtimeTrait)
      if (currentTrait) {
        if (trait.kindType === TRAIT.Getter || trait.kindType === TRAIT.Setter) {
          const index = toAppendTrait.indexOf(currentTrait)
          if (index !== -1) {
            toAppendTrait.splice(index, 1)
          }
        }
      }
    }
    for (let runtimeTrait of toAppendTrait) {
      this.vm.setDescriptor(target, runtimeTrait.name, new PropertyDescriptor(runtimeTrait))
    }
    this._syncSlot(target)
  }
  protected _setDescriptor (self: RefValue, mangled: string, desc: PropertyDescriptor) {
    const slots = this.slotProps.get(self)
    const oldDesc = this._getDescriptor(self, mangled, self)
    if (slots) {
      const index = slots.indexOf(oldDesc)
      super._setDescriptor(self, mangled, desc)
      slots[index] = desc
    } else {
      super._setDescriptor(self, mangled, desc)
    }
  }
  private _syncSlot (self: RefValue) {
    const traits = this.traits.get(self)
    let slots = []
    for (let trait of traits.slots) {
      if (trait) {
        slots[trait.slot] = this.getDescriptor(self, trait.name)
      }
    }
    this.slotProps.set(self, slots)
  }
}
type MangledName = string
type ValueWeakMap<T> = WeakMap<RefValue, T>

export class ValueManager implements IValueManager {
  private static _instance: ValueManager = new ValueManager()
  vProperty: ValueWeakMap<Map<MangledName, PropertyDescriptor>> = new WeakMap()
  vPrototype: ValueWeakMap<RefValue> = new WeakMap()
  vClass: ValueWeakMap<AXClass> = new WeakMap()
  vTraits: ValueWeakMap<RuntimeTraits> = new WeakMap()
  vSlotProps: ValueWeakMap<Array<PropertyDescriptor>> = new WeakMap()
  vApp: ValueWeakMap<ApplicationDomain> = new WeakMap()
  vAccesser: ValueWeakMap<ValueAccessor>
  private maps: ValueWeakMap<any>[]
  private defAccesser: ValueAccessor
  private traitAccessor: TraitAccessor
  private constructor () {
    this.defAccesser = new ValueAccessor(this)
    this.traitAccessor = new TraitAccessor(this)
    this.vAccesser = new DefaultWeakMap(this.defAccesser)
    this.maps = [
      this.vProperty,
      this.vPrototype,
      this.vClass,
      this.vTraits,
      this.vSlotProps,
      this.vApp,
      this.vAccesser
    ]
  }
  static get instance () {
    return ValueManager._instance
  }
  isPrimitive (value: Value) {
    return value === null ||
      value === undefined ||
      typeof value === 'number' ||
      typeof value === 'string' ||
      typeof value === 'boolean'
  }
  newObject (app: ApplicationDomain) {
    const obj = Object.create(null)
    this.registerObject(obj, app)
    return obj
  }
  registerObject (obj: RefValue, app: ApplicationDomain): boolean {
    if (this.vApp.has(obj)) {
      return false
    }
    this.vProperty.set(obj, new Map())
    this.vApp.set(obj, app)
    return true
  }
  replaceObject (oldObj: RefValue, newObj: RefValue): RefValue {
    // logger.error('replace', oldObj, 'with', newObj)
    for (let weakMap of this.maps) {
      weakMap.set(newObj, weakMap.get(oldObj))
      weakMap.delete(oldObj)
    }
    return newObj
  }
  hasPropertyInternal (self: RefValue, mn: Multiname) {
    const accessor = this.vAccesser.get(self)
    if (accessor instanceof TraitAccessor) {
      return accessor.hasPropertyInternal(self, mn)
    } else {
      throw new Error('Can not hasPropertyInternal')
    }
  }
  setSlot (self: RefValue, index: number, value: Value) {
    const accessor = this.vAccesser.get(self)
    if (accessor instanceof TraitAccessor) {
      return accessor.setSlot(self, index, value)
    } else {
      throw new Error('Can not set slot')
    }
  }
  getSlot (self: RefValue, index: number) {
    const accessor = this.vAccesser.get(self)
    if (accessor instanceof TraitAccessor) {
      return accessor.getSlot(self, index)
    } else {
      throw new Error('Can not get slot')
    }
  }
  getProperty (self: RefValue, mn: Multiname) {
    let result = this.vAccesser.get(self).get(self, mn)
    return result
  }
  setProperty (self: RefValue, mn: Multiname, value: Value) {
    return this.vAccesser.get(self).set(self, mn, value)
  }
  setDescriptor (self: RefValue, mn: Multiname, desc: PropertyDescriptor) {
    return this.vAccesser.get(self).setDescriptor(self, mn, desc)
  }
  initProperty (self: RefValue, mn: Multiname, value: Value) {
    return this.vAccesser.get(self).init(self, mn, value)
  }
  hasProperty (self: RefValue, mn: Multiname): boolean {
    return this.vAccesser.get(self).has(self, mn)
  }
  deleteProperty (self: RefValue, mn: Multiname): boolean {
    return this.vAccesser.get(self).delete(self, mn)
  }
  getEnumerableKeys (self: RefValue): string[] {
    return this.vAccesser.get(self).keys(self)
  }
  getUndefined (): undefined {
    return undefined
  }
  createClass (app: ApplicationDomain, newCls: ClassInfo, superCls: AXClass, scope: Scope): AXClass {
    //
    return null
  }
  constructProperty (self: RefValue, mn: Multiname, args: Value[]) {
    const prop = this.getProperty(self, mn) as AXClass
    return prop.axNew(...args)
  }
  callProperty (self: RefValue, mn: Multiname, args: Value[]): Value {
    let func = this.getProperty(self, mn) as Function
    if (!func) {
      let func = this.getProperty(self, mn) as Function
      throw new Error(`Can't call property ${mn.name}`)
    }
    const hookFunc = this.vApp.get(self).sec.flashEmu.hooks.get(mn.name)
    if (hookFunc) {
      func = hookFunc.callback
    }
    if (DEBUG) {
      functionStart(mn.name)
    }
    let ret = func.call(self, ...args)
    if (DEBUG) {
      functionEnd(mn.name)
    }
    return ret
  }
  callSuper (self: RefValue, mn: Multiname, scope: Scope, args: Value []): Value {
    // let func = (scope.parent.object as AXClass).ctor.prototype[name]
    const superCls = (scope.parent.object as AXClass)
    const trait = superCls.instTrait.getTrait(mn.nsSet, mn.name)
    let func = trait.value as Function
    if (func) {
      return func.call(self, ...args)
    } else {
      throw new Error('axCallProperty: could not found Method: ' + name)
    }
  }
  isPrototypeOf (prototype: RefValue, target: RefValue): boolean {
    const vp = this.vPrototype
    for (let cur = vp.get(target); cur; cur = vp.get(cur)) {
      if (cur === prototype) {
        return true
      }
    }
    return false
  }
  bindTrait (self: RefValue, traits: RuntimeTraits): void {
    const accessor = this.vAccesser.get(self)
    if (accessor instanceof TraitAccessor) {
      return accessor.bindTrait(self, traits)
    } else {
      this.vAccesser.set(self, this.traitAccessor)
      return this.bindTrait(self, traits)
    }
  }
  getTrait (self: RefValue): RuntimeTraits {
    return this.vTraits.get(self)
  }
  applyTrait (self: RefValue, app: ApplicationDomain, newTraits: Traits, scope: Scope): void {
    const accessor = this.vAccesser.get(self)
    if (accessor instanceof TraitAccessor) {
      return accessor.applyTrait(self, app, newTraits, scope)
    } else {
      this.vAccesser.set(self, this.traitAccessor)
      return this.applyTrait(self, app, newTraits, scope)
    }
  }
  setClass (self: RefValue, cls: AXClass): void {
    const accessor = this.vAccesser.get(self)
    if (accessor instanceof TraitAccessor) {
      return accessor.setClass(self, cls)
    } else {
      this.vAccesser.set(self, this.traitAccessor)
      return this.setClass(self, cls)
    }
  }
  getClass (self: RefValue): AXClass {
    const accessor = this.vAccesser.get(self)
    if (accessor instanceof TraitAccessor) {
      return accessor.getClass(self)
    } else {
      throw new Error('Can not applyTrait')
    }
  }
  getProxy (self: RefValue) {
    const vm = this
    return {
      callProperty (name: string, ...args: Value[]): Value {
        return vm.callProperty(self, Multiname.Public(name), args)
      }
    }
  }
}
const valueManager = ValueManager.instance
export {
  valueManager as vm
}
export class RuntimeTraitInfo implements PropertyDescriptor {
  configurable: boolean = true
  enumerable: boolean = false
  writable: boolean = true
  set: (v: Value) => void
  get: () => Value
  value: Value
  slot: number
  typeName: Multiname
  constructor (public name: Multiname, public kind: TRAIT) {
  }
}
export class RuntimeTraits {
  slots: RuntimeTraitInfo[]
  map: Map<string, Map<string, RuntimeTraitInfo>>
  private _nextSlotID: number = 1
  constructor (
      public superTraits: RuntimeTraits,
      public protectedNs?: Namespace,
      public protectedNsMappings?: any) {
    this.slots = []
    let map = this.map = new Map()
    if (superTraits) {
      let superMap = superTraits.map
      for (let [key, val] of superMap) {
        map.set(key, new Map(val))
      }
    }
  }
  /**
   * if the trait to add has a getter or setter and previews same name trait has the other one,
   * traits will be merged.
   */
  addTrait (trait: RuntimeTraitInfo): RuntimeTraitInfo {
    let mn = trait.name
    let mappings = this.map.get(mn.name)
    if (!mappings) { // undefined
      mappings = new Map()
      this.map.set(mn.name, mappings)
    }
    const nsName = mn.nsSet[0].mangledName
    const current = mappings.get(nsName)
    mappings.set(nsName, trait)
    if (current) {
      if (trait.kind === TRAIT.Setter && current.get) {
        trait.get = current.get
        trait.kind = TRAIT.GetterSetter
      }
      if (trait.kind === TRAIT.Getter && current.set) {
        trait.set = current.set
        trait.kind = TRAIT.GetterSetter
      }
    }
    return current
  }
  addSlotTrait (trait: RuntimeTraitInfo) {
    let slot = trait.slot
    if (!slot) {
      slot = trait.slot = this._nextSlotID++
    } else {
      this._nextSlotID = slot + 1
    }
    this.slots[slot] = trait
  }
  getTraitNamespace (nsSet: Namespace[], name: string) {
    let mappings = this.map.get(name)
    if (!mappings) {
      return null
    }
    let trait: RuntimeTraitInfo
    for (let i = 0; i < nsSet.length; i++) {
      let ns = nsSet[i]
      trait = mappings.get(ns.mangledName)
      if (trait) {
        return ns
      }if (ns.type === NamespaceType.Protected) {
        let protectedScope: RuntimeTraits = this
        while (protectedScope) {
          if (protectedScope.protectedNs === ns) {
            trait = protectedScope.protectedNsMappings[name]
            if (trait) {
              return ns
            }
          }
          protectedScope = protectedScope.superTraits
        }
      }
    }
    return null
  }
  getTrait (nsSet: Namespace[], name: string) {
    const ns = this.getTraitNamespace(nsSet, name)
    if (ns) {
      return this.map.get(name).get(ns.mangledName)
    }
    return null
  }
}
