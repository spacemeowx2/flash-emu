import {wrapFunction, Scope, axCoerceName, SecurityDomain, ApplicationDomain} from './runtime'
import {Multiname, ClassInfo, MethodInfo, RuntimeTraits, RuntimeTraitInfo, TraitInfo} from './abc'
// import {NativeClass} from './native'
import {Errors} from './error'
import {TRAIT} from './CONSTANT'
import {Logger} from './logger'
import {functionStart, functionEnd} from './profile'
import {INativeClass, INativeClassCtor, IDynamicNativeClass, dynamicPassError} from './native'
import * as ABC from './abc'
const logger = new Logger('Base')

export type ValueIndex = string | number
export interface ITraits {
  traits: RuntimeTraits
  val: Map<ValueIndex, PropertyDescriptor>
  app: ApplicationDomain
}
export interface IMetaobjectProtocol {
  axResolveMultiname (mn: Multiname): string | number
  axCallProperty (mn: Multiname, args: any[], isLex: boolean): any
  axSetSlot (index: number, value: any): void
  axGetSlot (index: number): any
  axHasPropertyInternal (mn: Multiname): boolean
  axGetProperty (mn: Multiname): any
  axDeleteProperty(mn: Multiname): boolean
  axSetProperty (mn: Multiname, value: any, init: boolean): void
  axNew (superMethod: Function, ...args: any[]): any

  axConstructProperty (mn: Multiname, args: any []): any
  axCallSuper (mn: Multiname, scope: Scope, ...args: any []): any
  axGetEnumerableKeys (): any[]
}
export class AXObject implements ITraits {
  superObject: AXObject
  dynamic: boolean = false
  val: Map<ValueIndex, PropertyDescriptor> = new Map()
  app: ApplicationDomain
  _proto: AXObject
  traits: RuntimeTraits
  // get traits (): RuntimeTraits {
  //   return this._traits
  // }
  // set traits (v: RuntimeTraits) {
  //   this._traits = v
  // }
  protected constructor (public axClass: AXClass) {
    if (!axClass) { // it's Class object
      return
    }
    this.app = axClass.app
    this._proto = axClass.prototype
    this.traits = new RuntimeTraits(this._proto && this._proto.traits)
  }
  static __axNew (axClass: AXClass) {
    let obj = new AXObject(axClass)
    return obj
  }
  get (key: ValueIndex, self: AXObject = this): any {
    if (!this.val.has(key)) {
      if (this._proto) {
        return this._proto.get(key, self)
      }
    }
    if (this.val.has(key)) {
      let desc = this.val.get(key)
      if (desc.get) {
        return desc.get.call(self)
      }
      return desc.value
    }
    // logger.error('wtwtwtf', key)
    const desc = this.val.get(key)
    return desc && desc.value
  }
  setDescriptor (key: ValueIndex, descriptor: PropertyDescriptor): void {
    let desc = this.get(key)
    if (desc) {
      desc = Object.assign(desc, descriptor)
      this.val.set(key, desc)
    } else {
      throw new Error('not found')
    }
  }
  set (key: ValueIndex, val: any, self: AXObject = this): void {
    if (!this.val.has(key)) {
      if (this._proto) {
        return this._proto.set(key, val, self)
      }
    }
    if (this.val.has(key)) {
      let desc = this.val.get(key)
      if (desc.set) {
        return desc.set.call(self, val)
      }
      let nd: PropertyDescriptor = {
        configurable: desc.configurable,
        enumerable: desc.enumerable,
        value: val,
        writable: desc.writable,
        get: desc.get,
        set: desc.set
      }
      // desc = Object.assign({}, desc)
      // desc.value = val
      self.val.set(key, nd)
      return
    }
    this.val.set(key, {
      value: val
    })
  }
  has (key: ValueIndex): boolean {
    if (!this.val.has(key)) {
      if (this._proto) {
        return this._proto.has(key)
      }
    }
    return this.val.has(key)
  }
  axIsPrototypeOf (v: AXObject) {
    for (let cur = v._proto; cur; cur = cur._proto) {
      if (cur === this) {
        return true
      }
    }
    return false
  }
  axResolveMultiname (mn: Multiname): ValueIndex {
    let name = mn.name
    if (typeof name === 'number') {
      return +name
    }
    let t = this.traits.getTrait(mn.nsSet, name)
    // TODO: 可能不应该用 Public ?
    return t ? t.name.mangledName : Multiname.PublicMangledName(name)
  }
  axCallProperty (mn: Multiname, args: any[], isLex?: boolean): any {
    const name = this.axResolveMultiname(mn)
    let func = this.get(name) // TODO should we look up super class
    if (func instanceof AXNativeObject) {
      func = func.native
    }
    const hookFunc = this.app.sec.flashEmu.hooks.get(mn.name)
    if (hookFunc) {
      func = hookFunc.callback
    }
    if (func) {
      if (DEBUG) {
        functionStart(mn.name)
      }
      let ret = func.call(this, ...args)
      if (DEBUG) {
        functionEnd(mn.name)
      }
      return ret
    } else {
      throw new Error('axCallProperty: could not found Method: ' + name)
    }
  }
  callProperty (publicName: string, ...args: any[]) {
    return this.axCallProperty(Multiname.Public(publicName), args, true)
  }
  axSetSlot (index: number, value: any): void {
    let trait = this.traits.slots[index]
    this.set(trait.name.mangledName, value)
  }
  axGetSlot (index: number): any {
    let t = this.traits.slots[index]
    let value = this.get(t.name.mangledName)
    return value
  }
  axHasPropertyInternal (mn: Multiname): boolean {
    if (this.traits.getTrait(mn.nsSet, mn.name)) {
      return true
    }
    return this.get(mn.mangledName) !== undefined
  }
  axGetProperty (mn: Multiname): any {
    let name = this.axResolveMultiname(mn)
    let value = this.get(name)
    if (value instanceof Function) {
      value = wrapFunction(this.app.sec, value.bind(this))
    }
    // should be wraped on init
    // if (value instanceof Function && !(value instanceof AXFunction)) {
    //   let axFun = this.functionWraps.get(value)
    //   if (axFun) {
    //     return axFun
    //   }
    //   axFun = AXFunction.axNew(value.bind(this))
    //   this.functionWraps.set(value, axFun)
    //   return axFun
    // }
    // TODO: getter
    // logger.debug('axGetProperty', name, value)
    return value
  }
  axDeleteProperty(mn: Multiname): boolean {
    // Cannot delete traits.
    let name = axCoerceName(mn.name)
    if (this.traits.getTrait(mn.nsSet, name)) {
      return false
    }
    return this.val.delete(Multiname.PublicMangledName(mn.name))
  }
  axSetProperty (mn: Multiname, value: any, isInit: boolean): void {
    let name = mn.name
    let freeze = false
    let t = this.traits.getTrait(mn.nsSet, name)
    let mangledName
    const app = this.axClass.app
    if (t) {
      mangledName = t.name.mangledName
      switch (t.kind) {
        case TRAIT.Method:
          app.throwError(
            'ReferenceError',
            Errors.CannotAssignToMethodError, name,
            this.axClass.name)
          break
        case TRAIT.Getter:
          app.throwError(
            'ReferenceError',
            Errors.ConstWriteError, name,
            this.axClass.name)
          break
        case TRAIT.Class:
        case TRAIT.Const:
          // Technically, we need to check if the currently running function is the
          // initializer of whatever class/package the property is initialized on.
          // In practice, we freeze the property after first assignment, causing
          // an internal error to be thrown if it's being initialized a second time.
          // Invalid bytecode could leave out the assignent during first initialization,
          // but it's hard to see how that could convert into real-world problems.
          if (!isInit) {
            app.throwError(
              'ReferenceError',
              Errors.ConstWriteError, name,
              this.axClass.name)
          }
          freeze = true
          break
      }
      // TODO: 完成一下
      let type = this.app.getClass(t.typeName)
      if (type) {
        value = type.axCoerce(value)
        // logger.debug('Coercing property to type ' + (type instanceof AXClass ? type.name : type))
      }
    } else {
      if (typeof name === 'number') {
        mangledName = name
      } else {
        mangledName = Multiname.PublicMangledName(name)
      }
    }
    this.set(mangledName, value)
    if (freeze) {
      // this.setDescriptor(mangledName, {writable: false})
      // TODO 先不管了.
    }
  }
  setProperty (publicName: string, value: any) {
    return this.axSetProperty(Multiname.Public(publicName), value, false)
  }
  axConstructProperty (mn: Multiname, args: any []): any {
    let name = this.axResolveMultiname(mn)
    let ctor = this.get(name)
    return ctor.axNew(...args)
  }
  axCallSuper (mn: Multiname, scope: Scope, ...args: any []): any {
    let name = this.axResolveMultiname(mn)
    // let func = (scope.parent.object as AXClass).ctor.prototype[name]
    let func = this.superObject.get(name)
    if (func) {
      return func.call(this, ...args)
    } else {
      throw new Error('axCallProperty: could not found Method: ' + name)
    }
  }
  axGetEnumerableKeys (): any[] {
    let keys: string[] = []
    for (let key of this.val.keys()) {
      if (typeof key === 'number') {
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
}
export class AXNativeObject extends AXObject implements ITraits {
  native: INativeClass
  static __axNew (axClass: AXClass) {
    let obj = new AXNativeObject(axClass)
    return obj
  }
}
export class AXDynamicNativeObject extends AXNativeObject implements ITraits {
  native: IDynamicNativeClass
  static __axNew (axClass: AXClass) {
    let obj = new AXDynamicNativeObject(axClass)
    return obj
  }
  get (key: ValueIndex, self?: AXObject): any {
    if (this.native.dynamic_shouldHandle(key)) {
      return this.native.dynamic_get(key)
    }
    return super.get(key, self)
  }
  set (key: ValueIndex, val: any) {
    if (this.native.dynamic_shouldHandle(key)) {
      this.native.dynamic_set(key, val)
    }
    super.set(key, val)
  }
  has (key: ValueIndex) {
    if (this.native.dynamic_shouldHandle(key)) {
      return this.native.dynamic_has(key)
    }
    return super.has(key)
  }
  axGetEnumerableKeys () {
    if (this.native.dynamic_keys) {
      return this.native.dynamic_keys()
    }
    return super.axGetEnumerableKeys()
  }
}
export class AXClass extends AXObject {
  name: string = null
  bin: ArrayBuffer
  iinit: () => void
  appliedInterface: Multiname[]
  classInfo: ClassInfo
  prototype: AXObject
  axObjectCtor: typeof AXObject
  private interfaces: Set<AXClass>
  constructor (
    public app: ApplicationDomain,
    public superCls?: AXClass) {
    super(app.sec.AXClass)
    this.axObjectCtor = superCls ? superCls.axObjectCtor : AXObject
  }
  setName (n: Multiname) {
    const name = n.nsSet[0].uri + '.' + n.name
    if (this.name !== null) {
      return
    }
    const bin = this.app.sec.flashEmu.binaryData.get(name)
    if (bin) {
      this.bin = bin
    }
    this.name = name
  }
  applyClass (classInfo: ClassInfo, scope: Scope) {
    const sec = this.app.sec
    let prototype = sec.AXObject.axNew()

    this.traits = new RuntimeTraits(null)
    prototype.traits = new RuntimeTraits(this.superCls && this.superCls.prototype.traits)
    prototype._proto = this.superCls && this.superCls.prototype

    this.prototype = prototype
    if (classInfo) {
      const instInfo = classInfo.getInstance()
      applyTraits(this, classInfo.trait, scope)
      applyTraits(prototype, instInfo.trait, scope)
    }
  }
  axCoerce (v: any): any {
    // logger.debug('coerce native type') TODO
    return v
  }
  axNew (...args: any[]): AXObject {
    let self = this.axObjectCtor.__axNew(this)
    this._axNew(self, ...args)
    return self
  }
  axSuperNew (self: AXObject, ...args: any[]) {
    const superClass = this.superCls
    if (superClass) {
      superClass._axNew(self, ...args)
    }
  }
  axIsType (x: any) {
    if (!x || typeof x !== 'object') {
      return false
    }
    // return this.axImplementsInterface(x) // for interface
    return this.prototype.axIsPrototypeOf(x)
  }
  protected _axNew (self: any, ...args: any[]): any {
    if (this.iinit) {
      this.iinit.call(self, ...args)
    } else {
      // logger.warn('no iinit, call super in default')
      this.axSuperNew(self, ...args)
    }
    return self
  }
}
export class AXNativeClass extends AXClass {
  native: INativeClass
  constructor (app: ApplicationDomain, nativeCls: INativeClassCtor, public nativeName: string, superCls?: AXClass) {
    super(app, superCls)
    if (nativeCls) {
      this.native = new nativeCls(this)
    } else {
      logger.warn('Native class ctor error ' + nativeName)
    }
    this.axObjectCtor = AXNativeObject
  }
  axCoerce (v: any) {
    if (this.native && this.native.axCoerce) {
      return this.native.axCoerce(v, this)
    }
    return super.axCoerce(v)
  }
  axBox (v: any) {
    if (this.native && this.native.axBox) {
      return this.native.axBox(v, this)
    }
    throw new Error('Can not box' + v)
  }
}
export class AXDynamicNativeClass extends AXNativeClass {
  constructor (app: ApplicationDomain, nativeCls: INativeClassCtor, nativeName: string, superCls?: AXClass) {
    super(app, nativeCls, nativeName, superCls)
    this.axObjectCtor = AXDynamicNativeObject
  }
}
export class AXGlobalBase extends AXObject {
  scope: Scope
  constructor (
      axClass: AXClass,
      app: ApplicationDomain) {
    super(axClass)
    this.scope = new Scope(null, this)
  }
}
export function applyTraits (target: ITraits, newTraits: ABC.Traits, scope: Scope) {
  const app = target.app
  const sec = app.sec
  let traits = target.traits
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
    }
    let currentTrait = traits.addTrait(runtimeTrait)
    toAppendTrait.push(runtimeTrait)
    if (currentTrait) {
      if (trait.kindType === TRAIT.Getter || trait.kindType === TRAIT.Setter) {
        toAppendTrait.splice(toAppendTrait.indexOf(currentTrait), 1)
      }
    }
  }
  for (let runtimeTrait of toAppendTrait) {
    target.val.set(runtimeTrait.name.mangledName, runtimeTrait)
  }
}
function initRuntimeTraits (target: ITraits, rtTrait: RuntimeTraits) {
  for (let mapping of rtTrait.map.values()) {
    for (let runtimeTrait of mapping.values()) {
      target.val.set(runtimeTrait.name.mangledName, runtimeTrait)
    }
  }
}
