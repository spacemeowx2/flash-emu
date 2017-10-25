import * as CONSTANT from './constant'
import * as ABC from './abc'
import {NamespaceType, TRAIT} from './constant'
import {Multiname, Namespace} from './abc'
import {Errors, IErrorMessage} from './error'
import {popManyInto} from './utils'
import {Interpreter} from './interpreter'
import FlashEmu from './flashemu'
import {AXClass, AXGlobal, AXGlobalClass, AXNativeClass} from './base'
import {getNativeFunction, getMethodOrAccessorNative, getNativeAXClass} from './native'
import {FunctionObj} from '@/native/builtin/Function'
import {ByteArray} from '@/native/builtin/ByteArray'
import {vm, RuntimeTraits, RuntimeTraitInfo} from './value'

import {Logger} from './logger'
const logger = new Logger('Runtime')

export const enum ScriptInfoState {
  None = 0,
  Executing = 1,
  Executed = 2
}
interface IScriptRuntime {
  state: ScriptInfoState
  global: AXGlobal
}
function isEmptyMethod (code: ArrayBuffer) {
  let view = new Uint8Array(code)
  return view[0] === 0xD0 && view[1] === 0x30 && view[2] === 0x47
}
type FunctionCall = (...args: any[]) => any & {
  methodInfo: ABC.MethodInfo
}

const scriptRuntime: WeakMap<ABC.ScriptInfo, IScriptRuntime> = new WeakMap()
const vectorTypes: WeakMap<AXClass, AXClass> = new WeakMap()
export class ApplicationDomain {
  system: ApplicationDomain
  abcs: ABC.AbcFile[]
  domainMemory: ByteArray
  private methodActivation: WeakMap<ABC.MethodInfo, AXClass>
  private catchScope: WeakMap<ABC.ExceptionInfo, AXClass>
  private triatMethod: WeakMap<ABC.TraitMethod, Function>
  private findPropertyCache: Map<string, ABC.ScriptInfo>
  private scriptNameMap: Map<string, ABC.ScriptInfo[]>
  constructor(public sec: SecurityDomain, public parent: ApplicationDomain) {
    this.system = parent ? parent.system : this
    this.abcs = []

    // 类型不同所以可以共用一个WeakMap
    this.triatMethod = this.methodActivation = this.catchScope = new WeakMap()
    this.findPropertyCache = new Map()
    this.scriptNameMap = new Map()
  }
  loadABC (abc: ABC.AbcFile) {
    if (this.abcs.indexOf(abc) !== -1) {
      return
    }
    abc.app = this
    for (let script of abc.script) {
      scriptRuntime.set(script, {
        state: ScriptInfoState.None,
        global: null
      })
      const map = this.scriptNameMap
      for (let trait of script.trait) {
        const name = trait.name.name
        if (!map.has(name)) {
          map.set(name, [])
        }
        map.get(name).push(script)
      }
    }
    this.abcs.push(abc)
  }
  findProperty (mn: Multiname, strict: boolean, execute: boolean): RefValue {
    const cache = this.findPropertyCache
    let script = cache.get(mn.mangledName)
    if (!script) {
      script = this.findDefiningScript(mn, execute)
      cache.set(mn.mangledName, script)
    }
    if (script) {
      return scriptRuntime.get(script).global
    }
    return null
  }
  getClass (mn: Multiname): AXClass {
    return this.getProperty(mn, true, true)
  }
  getProperty (mn: Multiname, strict: boolean, execute: boolean): any {
    if (!mn) {
      return null
    }
    let global = this.findProperty(mn, strict, execute)
    if (global) {
      return vm.getProperty(global, mn)
    }
    return null
  }
  findDefiningScript (mn: Multiname, execute: boolean): ABC.ScriptInfo {
    if (this.parent) {
      let script = this.parent.findDefiningScript(mn, execute)
      if (script) {
        return script
      }
    }
    const scripts = this.scriptNameMap.get(mn.name)
    if (!scripts) {
      return null
    }
    for (let script of scripts) {
      const runtimeScript = scriptRuntime.get(script)
      let traits = script.trait
      if (traits.getTrait(mn)) {
        this.prepareGlobal(script)
        // Ensure script is executed.
        if (execute && runtimeScript.state === ScriptInfoState.None) {
          this.executeScript(script)
        }
        return script
      }
    }
    return null
  }
  prepareGlobal (script: ABC.ScriptInfo): void {
    let runtimeScript = scriptRuntime.get(script)
    if (runtimeScript.global) {
      return
    }
    let global = this.createGlobal(script)
    runtimeScript.global = global
  }
  executeScript (script: ABC.ScriptInfo) {
    const app = script.abc.app
    // logger.debug('executeScript', app.sec.apps.indexOf(app), script.abc.script.indexOf(script), script.init.id)
    this.prepareGlobal(script)
    let methodInfo = script.init
    let runtimeScript = scriptRuntime.get(script)
    let global = runtimeScript.global
    runtimeScript.state = ScriptInfoState.Executing
    this.sec.flashEmu.interpreter.interpret(global, script.init, global.scope, [], null)
    runtimeScript.state = ScriptInfoState.Executed
    // logger.debug('end executeScript', app.sec.apps.indexOf(app), script.abc.script.indexOf(script), script.init.id)
    return global
  }
  createGlobal (script: ABC.ScriptInfo) {
    const name = `ScriptGlobal${script.getID()}`
    const scope = new Scope(null, null)
    const globalClass = new AXGlobalClass(this, name)
    globalClass.setPrototypeTrait(script.trait, scope)
    const global: AXGlobal = globalClass.axNew(this, name, scope) as any
    scope.object = global
    return global
  }
  throwError (type: string, error: IErrorMessage, ...args: any[]) {
    let message = error.message
    message = error.message.replace(/%(\d)/, (_: any, i) => args[i - 1])
    let errType = this.getClass(Multiname.Public(type))
    // logger.error('ThrowError', type, message)
    throw new ErrorWrapper(errType.axNew(message))
  }
  createClass (newCls: ABC.ClassInfo, superCls: AXClass, scope: Scope): AXClass {
    // logger.debug('createClass', newCls.holderTraitName.name)
    // if (superCls && superCls.classInfo) {
    //   logger.debug(1, superCls.classInfo.holderTraitName.name)
    // }
    const metas = newCls.holderMeta.filter(m => m.name === 'native')
    const meta = metas[0]
    const interpreter = this.sec.flashEmu.interpreter
    const instance = newCls.getInstance()
    let axClass: AXClass
    if (meta) {
      axClass = getNativeAXClass(this, meta.get('cls'), superCls)
    } else {
      axClass = new AXClass(this, superCls)
    }
    let classScope = new Scope(scope, axClass)

    axClass.applyClass(newCls, classScope)

    axClass.instInit = function (this: RefValue, ...args: any[]) {
      const bin = axClass.bin
      if (bin) {
        // logger.error('iinit', axClass.name)
        this.buf = bin.slice(0, bin.byteLength)
      }
      return interpreter.interpret(this, instance.iinit, classScope, args, null)
    }

    let initBody = newCls.cinit.getBody()
    if (!isEmptyMethod(initBody.code)) {
      interpreter.interpret(axClass, newCls.cinit, classScope, [axClass], null)
    }
    return axClass
  }
  createActivation (methodInfo: ABC.MethodInfo, scope: Scope): RefValue {
    const body = methodInfo.getBody()
    let actClass = this.methodActivation.get(methodInfo)
    if (!actClass) {
      actClass = new AXClass(this)
      actClass.setPrototypeTrait(body.trait, scope)
    }
    let act = actClass.axNew()
    return act
  }
  createCatch (exceptionInfo: ABC.ExceptionInfo, scope: Scope) {
    let catClass = this.catchScope.get(exceptionInfo)

    if (!catClass) {
      catClass = new AXClass(this)
      catClass.setPrototypeTrait(exceptionInfo.getTrait(), scope)
    }
    let cat = catClass.axNew()
    return cat
  }
  createMethodForTrait (trait: ABC.TraitInfo, scope: Scope) {
    let methodTraitInfo = trait.data as ABC.TraitMethod
    let method = this.triatMethod.get(methodTraitInfo)
    if (method) {
      return method
    }
    let methodInfo = methodTraitInfo.method
    if (methodInfo.isNative()) {
      const parent = trait.holder
      if (parent instanceof ABC.ClassInfo) {
        method = getMethodOrAccessorNative(this, trait)
      } else if (parent instanceof ABC.InstanceInfo) {
        method = getMethodOrAccessorNative(this, trait)
      } else if (parent instanceof ABC.ScriptInfo) {
        const meta = trait.metadata && trait.metadata.filter(m => m.name === 'native')
        if (meta.length !== 1) {
          throw new Error(`Native global function don't have metadata`)
        }
        method = getNativeFunction(this, meta[0].value)
        if (!method) {
          // throw new Error(`Native function ${meta[0].value} not found`)
          logger.error(`Native function ${meta[0].value} not found`)
        }
      } else {
        logger.error('Unknown type of trait holder')
      }
    } else {
      method = this.sec.createFunction(methodInfo, scope) as any
    }

    this.triatMethod.set(methodTraitInfo, method)
    return method
  }
  boxFunction (fun: Function) {
    const type = this.system.getClass(Multiname.Public('Function'))
    if (vm.registerObject(fun, this)) {
      vm.vPrototype.set(fun, type.prototype)
      vm.bindTrait(fun, type.instTrait)
    }
    return fun
  }
  applyType (axClass: AXClass, types: AXClass []) {
    // types = types.concat()
    // if (AXVector !== axClass.ctor) {
    //   this.throwError('TypeError', Errors.TypeAppOfNonParamType)
    // }
    if (types.length !== 1) {
      this.throwError('TypeError', Errors.WrongTypeArgCountError, '__AS3__.vec::Vector', 1,
                      types.length)
    }
    let vType = vectorTypes.get(types[0])
    if (!vType) {
      const VectorObject = this.getClass(Multiname.PackageInternal('__AS3__.vec', 'Vector$object'))
      vType = new AXClass(this, VectorObject)
      vType.name = `Vector.<${types.map(i => i.name).join(', ')}>`
      vType.applyClass(null, null)
      vectorTypes.set(types[0], vType)
    }
    return vType
    // throw new Error('applyType not imp')
  }
}

export class SecurityDomain {
  system: ApplicationDomain
  apps: ApplicationDomain[]
  vectorClasses: WeakMap<AXClass, AXClass>
  // AXNumber: AXClass
  AXArray: AXNativeClass
  AXString: AXNativeClass
  AXClass: AXNativeClass
  AXObject: AXNativeClass

  constructor (public flashEmu: FlashEmu) {
    this.system = new ApplicationDomain(this, null)
    this.apps = [this.system]

    this.vectorClasses = new WeakMap()
    this.AXClass = getNativeAXClass(this.system, 'Class', null)
    vm.setClass(this.AXClass, this.AXClass)
    this.AXObject = getNativeAXClass(this.system, 'ObjectClass', null)

    this.AXString = getNativeAXClass(this.system, 'StringClass', this.AXObject)
    this.AXArray = getNativeAXClass(this.system, 'ArrayClass', this.AXObject)
  }
  onBuiltinLoaded () {
    const system = this.system
  }
  createApplicationDomain (parent: ApplicationDomain) {
    parent = parent || this.system
    if (!this.apps.includes(parent)) {
      throw new Error('createApplicationDomain parent domain should be in sec domain')
    }
    let app = new ApplicationDomain(this, parent)
    this.apps.push(app)
    return app
  }
  createFunction (methodInfo: ABC.MethodInfo, scope: Scope, hasDynamicScope?: boolean) {
    const interpreter = this.flashEmu.interpreter
    let fun: FunctionCall = function (...args: any[]): any {
      return interpreter.interpret(this, methodInfo, scope, args, fun)
    }
    return fun
  }
  box (v: any) {
    // tslint:disable-next-line:triple-equals
    if (v == undefined) { // undefined or null
      return v
    }
    if (v instanceof Array) {
      return this.AXArray.axBox(v)
    }
    // if (typeof v === 'number') {
    //   return this.AXNumber.axBox(v)
    // }
    // if (typeof v === 'boolean') {
    //   return this.AXBoolean.axBox(v)
    // }
    if (typeof v === 'string') {
      return this.AXString.axBox(v)
    }
  }
}

export class Scope {
  parent: Scope
  object: RefValue
  isWith: boolean
  global: Scope
  cache: Map<string, any>
  constructor (parent: Scope, object: any, isWith = false) {
    this.parent = parent
    this.object = object
    this.isWith = isWith
    this.global = parent ? parent.global : this

    this.cache = new Map()
  }
  getScopeProperty(mn: Multiname, strict: boolean, scopeOnly: boolean): any {
    return vm.getProperty(this.findScopeProperty(mn, strict, scopeOnly), mn)
  }
  findScopeProperty (mn: Multiname, strict: boolean, scopeOnly: boolean): any {
    let object
    if (!scopeOnly && !mn.isRuntime()) {
      object = this.cache.get(mn.mangledName)
      if (object) {
        return object
      }
    }
    if (this.object) {
      if (vm.hasPropertyInternal(this.object, mn)) {
        // if (!(this.isWith || mn.isRuntime())) {
        //   this.cache.set(mn, this.object)
        // }
        return this.object
      }
    }
    if (this.parent) {
      object = this.parent.findScopeProperty(mn, strict, scopeOnly)
      if (mn.kind === CONSTANT.QName) {
        this.cache.set(mn.mangledName, object)
      }
      return object
    }
    if (scopeOnly) {
      return null
    }

    const globalObject = this.global.object as AXGlobalClass
    // Attributes can't be stored on globals or be directly defined in scripts.
    if (mn.isAttribute()) {
      globalObject.app.throwError('ReferenceError', Errors.UndefinedletError, mn.nsSet[0].uri + '.' + mn.name)
    }

    // If we can't find the property look in the domain.
    object = globalObject.app.findProperty(mn, strict, true)
    if (object) {
      return object
    }

    // If we still haven't found it, look for dynamic properties on the global.
    // No need to do this for non-strict lookups as we'll end up returning the
    // global anyways.
    if (strict) {
      if (!vm.hasProperty(globalObject, mn)) {
        // logger.error('multiname: ', mn)
        globalObject.app.throwError('ReferenceError', Errors.UndefinedVarError, mn.nsSet[0].uri + '.' + mn.name)
      }
    }

    // Can't find it still, return the global object.
    return globalObject
  }
}
export function axCoerceString (x: any): string {
  if (typeof x === 'string') {
    return x
  } else if (x === undefined) {
    return null
  }
  return x + ''
}
export function axConvertString (x: any): string {
  if (typeof x === 'string') {
    return x
  }
  return x + ''
}
export function axEquals (left: any, right: any) {
  // tslint:disable-next-line
  return left == right
}
export function axTypeOf (x: any) {
  return typeof x
}
/**
 * means this error is from avm2 inside
 */
export class ErrorWrapper {
  constructor (public error: any) {
    //
  }
}
export function axCoerceName (x: any): string {
  if (typeof x === 'string') {
    return x
  // tslint:disable-next-line
  } else if (x == undefined) {
    return 'null'
  }
  return x.toString()
}
