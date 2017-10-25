import {ApplicationDomain, SecurityDomain} from '@/runtime'
import {vm, RuntimeTraits} from '@/value'
import {AXClass, AXNativeClass} from '@/base'
import {TraitInfo, ClassInfo, InstanceInfo} from '@/abc'
import * as ABC from '@/abc'
import {Logger} from '@/logger'
const logger = new Logger('Native')
interface SecNative {
  AXClass: Map<string, AXNativeClass>
  FunctionClass: WeakMap<typeof NativeFuncClass, NativeFuncClass>
}
let nativeFunctions = new Map<string, typeof NativeFuncClass>()
let nativeClasses: Map<string, INativeClassCtor> = new Map()
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
export interface INativeClassCtor {
  new (app: ApplicationDomain, name: string, superCls?: AXClass): AXNativeClass
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
export class NativeFuncClass {
  [k: string]: any
  constructor (public app: ApplicationDomain) {
  }
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
type ReturnType = (ret: RefValue) => RefValue
function returnWrap (app: ApplicationDomain, returnType: ABC.Multiname): ReturnType {
  let type: AXClass
  return (ret: RefValue) => {
    if (!type && returnType) {
      type = app.getClass(returnType)
    }
    if (type && !vm.isPrimitive(ret)) {
      vm.registerObject(ret, app)
      if (vm.getTrait(ret) === undefined) {
        vm.vPrototype.set(ret, type.prototype)
        vm.bindTrait(ret, type.instTrait)
        if (type.accessor) {
          vm.vAccesser.set(ret, type.accessor)
        }
      }
    }
    return ret
  }
}
function simpleNativeGetter (key: string, wrapper: ReturnType) {
  return function (this: RefValue) {
    return wrapper((this as any)[key])
  }
}
function simpleNativeSetter (key: string) {
  return function (this: RefValue, v: any) {
    return (this as any)[key] = v
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
      return null
    }
    const isGetter = trait.isGetter()
    const isSetter = trait.isSetter()
    const returnType = (trait.data as ABC.TraitMethod).method.returnType
    const returnWrapper = returnWrap(app, returnType)
    let propertyKey = trait.name.name
    let target: {
      [key: string]: any
    }
    if (isGetter) {
      return simpleNativeGetter(propertyKey, returnWrapper)
    }
    if (isSetter) {
      return simpleNativeSetter(propertyKey)
    }
    func = function (this: RefValue, ...args: any[]) {
      const target = this as any
      if (!target[propertyKey]) {
        logger.error('propertyKey', propertyKey, 'not found')
      }

      let ret = target[propertyKey].call(this, ...args)
      return returnWrapper(ret)
    }
    return func
  } else {
    throw new Error('No native metadata')
  }
}
export function getNativeAXClass (app: ApplicationDomain, name: string, superCls: AXClass) {
  if (!name) {
    return null
  }
  const cls = nativeClasses.get(name)

  let set = getAppNative(app).AXClass
  let axCls = set.get(name)
  if (!axCls) {
    if (cls) {
      axCls = new cls(app, name, superCls)
    } else {
      logger.warn('Class', name, 'not found')
      axCls = new AXNativeClass(app, name)
    }
    set.set(name, axCls)
    vm.registerObject(axCls, app)
  }
  return axCls
}
