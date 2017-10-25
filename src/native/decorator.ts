import {ApplicationDomain, SecurityDomain} from '@/runtime'
import {AXClass, AXObject, AXNativeClass, AXNativeObject, AXDynamicNativeClass} from '@/base'
import {TraitInfo, ClassInfo, InstanceInfo} from '@/abc'
import * as ABC from '@/abc'
import {Logger} from '@/logger'
const logger = new Logger('Native')
interface SecNative {
  AXClass: Map<string, AXNativeClass>
  FunctionClass: WeakMap<typeof NativeFuncClass, NativeFuncClass>
}
let nativeIsDynamic = new WeakMap<INativeClassCtor, boolean>()
let nativeFunctions = new Map<string, typeof NativeFuncClass>()
let nativeClasses: Map<string, INativeClassCtor> = new Map()
// let appNativeAXClass: WeakMap<ApplicationDomain, Map<string, AXNativeClass>> = new WeakMap()
// let appNativeFuncClass: WeakMap<ApplicationDomain, WeakMap<typeof NativeFuncClass, NativeFuncClass>> = new WeakMap()
let secNative: WeakMap<SecurityDomain, SecNative> = new WeakMap()
let nativeFuncClsNameMap: WeakMap<typeof NativeFuncClass, Map<string, string>> = new WeakMap()
function getAppNative (app: ApplicationDomain) {
  let native = secNative.get(app.sec)
  if (!native) {
    secNative.set(app.sec, native = {
      AXClass: new Map(),
      FunctionClass: new WeakMap()
    })
  }
  return native
}
export interface INativeClass {
  _onPrototype?: (prototype: AXObject, self: AXNativeClass) => void
  axCoerce?: (v: any, self: AXNativeClass) => any
  axBox?: (v: any, self: AXNativeClass) => AXObject
  axNewNative: (self: AXObject, ...args: any[]) => any
  [key: string]: any
}
export interface INativeClassCtor {
  new (self: AXNativeClass): INativeClass
  // [key: string]: any
}
export class DynamicPassError extends Error {}
export const dynamicPassError = new DynamicPassError()
export interface IDynamicNativeClass extends INativeClass {
  dynamic_shouldHandle: (k: any) => boolean
  dynamic_set: (k: any, v: any) => void
  dynamic_get: (k: any) => any
  dynamic_has: (k: any) => boolean
  dynamic_keys?: () => string[]
}
export interface IDynamicNativeClassCtor extends INativeClassCtor {
  new (...args: any[]): IDynamicNativeClass
}
export function NativeClass (name?: string) {
  return (constructor: INativeClassCtor) => {
    if (!name) {
      name = constructor.name
      if (name.substr(0, 2) === 'AX') {
        name = name.substr(2)
      }
    }
    nativeClasses.set(name, constructor)
  }
}
export function Dynamic () {
  return (constructor: INativeClassCtor) => {
    nativeIsDynamic.set(constructor, true)
  }
}
export class NativeFuncClass {
  [k: string]: any
  constructor (public app: ApplicationDomain) {
  }
}
export {
  ApplicationDomain,
  AXObject
}
interface INativeFuncClassCtor {
  new (): NativeFuncClass
}
export function NativeFunction (name?: string) {
  return function (target: NativeFuncClass, propertyKey: string, descriptor: PropertyDescriptor) {
    const cls = target.constructor as typeof NativeFuncClass
    name = name || propertyKey
    if (nativeFunctions.has(name)) {
      throw new Error('duplication of native function name')
    }
    let map = nativeFuncClsNameMap.get(cls)
    if (!map) {
      nativeFuncClsNameMap.set(cls, map = new Map())
    }
    map.set(name, propertyKey)
    nativeFunctions.set(name, cls)
  }
}
export function getNativeFunction (app: ApplicationDomain, name: string) {
  let cls = nativeFunctions.get(name)
  if (!cls) {
    return null
  }
  let set = getAppNative(app).FunctionClass
  let inst = set.get(cls)
  if (!inst) {
    set.set(cls, inst = new cls(app))
  }
  // const func = inst[nativeFuncClsNameMap.get(cls).get(name)].bind(inst)
  return (...args: any[]) => {
    return inst[nativeFuncClsNameMap.get(cls).get(name)].call(inst, ...args)
  }
}
function simpleNativeGetter (key: string) {
  return function (this: AXNativeObject) {
    return (this.native as any)[key]
  }
}
function simpleNativeSetter (key: string) {
  return function (this: AXNativeObject, v: any) {
    if (!this.native) {
      logger.error('wtf!!')
    }
    return (this.native as any)[key] = v
  }
}
export function getMethodOrAccessorNative (app: ApplicationDomain, trait: TraitInfo) {
  const parent = trait.holder
  const appNative = getAppNative(app)
  let metas: ABC.MetadataInfo[]
  if (parent instanceof ClassInfo) {
    metas = parent.holderMeta && parent.holderMeta.filter(m => m.name === 'native')
    // logger.error(1, trait.name.toJSON(), metas[0].get('cls'))
  } else if (parent instanceof InstanceInfo) {
    const cls = parent.getClass()
    metas = cls.holderMeta && cls.holderMeta.filter(m => m.name === 'native')
    // logger.error(2, trait.name.toJSON(), metas[0].get('cls'))
  } else {
    throw new Error(`Unsupport trait type`)
  }
  let func: Function
  if (metas.length === 1) {
    const meta = metas[0]
    const cls = nativeClasses.get(meta.get('cls'))
    if (!cls) {
      logger.warn('Class', meta.get('cls'), 'not found')
      return null
    }
    const isGetter = trait.isGetter()
    const isSetter = trait.isSetter()
    let propertyKey = trait.name.name
    let target: {
      [key: string]: any
    }
    if (isGetter) {
      return simpleNativeGetter(propertyKey)
    }
    if (isSetter) {
      return simpleNativeSetter(propertyKey)
    }
    func = function (...args: any[]) {
      const target = this.native
      if (!target[propertyKey]) {
        logger.error('propertyKey', propertyKey, 'not found')
      }
      return target[propertyKey].call(this.native, ...args)
    }
    return func
  } else {
    throw new Error('No native metadata')
  }
}
export function newNativeInstance (self: AXObject, name: string, ...args: any[]) {
  const cls = getAppNative(self.app).AXClass.get(name)
  if (!cls) {
    throw new Error(`Native class ${name} not registered`)
  }
  if (!cls.native || !cls.native.axNewNative) {
    throw new Error('wrong axNativeClass ' + name)
  }
  let obj = cls.native.axNewNative(self, ...args)
  return obj
}
export function getNativeAXClass (app: ApplicationDomain, name: string, superCls: AXClass) {
  if (!name) {
    return null
  }
  const cls = nativeClasses.get(name)
  const isDynamic = nativeIsDynamic.get(cls)

  let set = getAppNative(app).AXClass
  let axCls = set.get(name)
  if (!axCls) {
    if (isDynamic) {
      axCls = new AXDynamicNativeClass(app, cls, name, superCls)
    } else {
      axCls = new AXNativeClass(app, cls, name, superCls)
    }
    set.set(name, axCls)
    if (cls) {
      // cls.self = axCls
    } else {
      logger.warn(`cls ${name} not found`)
    }
  }
  return axCls
}
