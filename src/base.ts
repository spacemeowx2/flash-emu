import {RuntimeTraits, TraitAccessor, vm} from './value'
import {ApplicationDomain, Scope} from './runtime'
import {ClassInfo, Multiname, Traits} from './abc'

let replacing: WeakMap<RefValue, RefValue> = new WeakMap()
export class AXClass {
  instTrait: RuntimeTraits
  prototype: RefValue
  accessor: TraitAccessor
  classInfo: ClassInfo
  bin: ArrayBuffer
  name: string = null
  dynamic = false
  instInit: (self: RefValue, ...args: Value[]) => void
  constructor (public app: ApplicationDomain, public superCls?: AXClass, inheritNewNative = true) {
    vm.registerObject(this, this.app)
    if (inheritNewNative && superCls && superCls.axNewNative) {
      this.axNewNative = superCls.axNewNative
    }
    if (superCls) {
      this.accessor = superCls.accessor
    }
  }
  setName (mn: Multiname) {
    const name = mn.nsSet[0].uri + '.' + mn.name
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
    this.classInfo = classInfo
    const sec = this.app.sec
    let prototype = vm.newObject(this.app)

    const clsTrait = new RuntimeTraits(null)
    const instTrait = new RuntimeTraits(this.superCls && this.superCls.instTrait)
    this.instTrait = instTrait
    this.prototype = prototype

    vm.bindTrait(this, clsTrait)
    vm.bindTrait(prototype, instTrait)

    const app = this.app
    if (classInfo) {
      const instInfo = classInfo.getInstance()
      vm.applyTrait(this, app, classInfo.trait, scope)
      vm.applyTrait(prototype, app, instInfo.trait, scope)
    } else {
      vm.applyTrait(prototype, app, this.superCls.classInfo.getInstance().trait, scope)
    }
  }
  setPrototypeTrait (trait: Traits, scope: Scope) {
    const app = this.app
    const sec = this.app.sec
    this.instTrait = new RuntimeTraits(null)
    let prototype = vm.newObject(app)
    this.prototype = prototype
    vm.bindTrait(prototype, this.instTrait)
    vm.applyTrait(prototype, app, trait, scope)
  }
  axNewNative (): RefValue {
    return Object.create(null)
  }
  axNew (...args: Value[]): RefValue {
    let self = this.axNewNative()
    vm.registerObject(self, this.app)
    vm.vPrototype.set(self, this.prototype)
    vm.bindTrait(self, this.instTrait)
    if (this.accessor) {
      vm.vAccesser.set(self, this.accessor)
    }
    this.saveReplace(self, this.axConstruct(self, ...args))
    const result: RefValue = replacing.get(self) || self
    if (result !== undefined && result !== self) {
      vm.replaceObject(self, result)
    }
    return result
  }
  axConstruct (self: RefValue, ...args: Value[]): RefValue {
    if (this.instInit) {
      this.instInit.call(self, ...args)
    }
    return self
  }
  axSuperConstruct (self: RefValue, ...args: Value[]): void {
    if (this.superCls) {
      this.saveReplace(self, this.superCls.axConstruct(self, ...args))
    }
  }
  axCoerce (v: Value): Value {
    if (!v) {
      return v
    }
    if (vm.isPrimitive(v)) {
      return v
    }
    if (this.name.indexOf('Vector') !== -1) {
      return v
    }
    return v
  }
  axIsType (x: Value) {
    if (!x || typeof x !== 'object') {
      return false
    }
    // return this.axImplementsInterface(x) // for interface
    return vm.isPrototypeOf(this.prototype, x)
  }
  private saveReplace (self: RefValue, newObj: RefValue) {
    if (self === newObj || newObj === undefined) {
      return
    }
    if (replacing.has(self)) {
      throw new Error('Do not replace object twice in a axNew')
    }
    replacing.set(self, newObj)
  }
}
export class AXNativeClass extends AXClass {
  constructor (app: ApplicationDomain, public name: string, superCls?: AXClass) {
    super(app, superCls, false)
  }
  axNewNative (): RefValue {
    return Object.create(null) // throw new Error('Abstract method')
  }
  axConstruct (self: RefValue, ...args: Value[]): RefValue {
    throw new Error('Abstract method ' + this.name)
  }
  axBox (v: Value): RefValue {
    throw new Error('Abstract method')
  }
}
export class AXGlobal {
  app: ApplicationDomain
  name: string
  scope: Scope
}
export class AXGlobalClass extends AXClass {
  scope: Scope
  constructor (public app: ApplicationDomain, public name: string) {
    super(app, null)
  }
  axNewNative (): RefValue {
    return new AXGlobal()
  }
  axConstruct (self: AXGlobal, app: ApplicationDomain, name: string, scope: Scope) {
    self.app = app
    self.name = name
    self.scope = scope
    return self
  }
}
