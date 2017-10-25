import * as CONSTANT from './CONSTANT'
import {NamespaceType, TRAIT, ConstantKind, MethodFlags} from './CONSTANT'
import {hex} from './utils'
import {BufferReader} from './utils'
import {Scope, ApplicationDomain} from './runtime'
import {AXClass} from './base'
export {NamespaceType, TRAIT}

import {Logger} from './logger'
const logger = new Logger('Abc')

export class Namespace {
  static PublicMangledName = '_public'
  private static _public: Namespace
  private _mangledName: string = null
  constructor (private _type: NamespaceType, private _uri: string, private _prefix: string = '') {
    if (this._uri === null) {
      // console.error('null namespace name')
      this._uri = ''
    }
    if (this._prefix === null) {
      this._prefix = ''
    }
  }
  static Package (name: string) {
    return new Namespace(NamespaceType.Public, name)
  }
  static PackageInternal (name: string) {
    return new Namespace(NamespaceType.PackageInternal, name)
  }
  static get Public () {
    if (!Namespace._public) {
      Namespace._public = new Namespace(NamespaceType.Public, '')
    }
    return Namespace._public
  }
  static Private (uri: string = '') {
    return new Namespace(NamespaceType.Private, uri)
  }
  static MangledName (type: NamespaceType, uri: string, prefix: string) {
    if (type === NamespaceType.Public && uri === '') {
      return Namespace.PublicMangledName
    } else {
      return '_' + type.toString(16) + '_' + prefix + '_' + uri
    }
  }
  static read (reader: BufferReader, abc: AbcFile) {
    let kind = reader.readU8()
    let type: NamespaceType
    switch (kind) {
      case ConstantKind.Namespace:
      case ConstantKind.PackageNamespace:
        type = NamespaceType.Public
        break
      case ConstantKind.PackageInternalNs:
        type = NamespaceType.PackageInternal
        break
      case ConstantKind.ProtectedNamespace:
        type = NamespaceType.Protected
        break
      case ConstantKind.ExplicitNamespace:
        type = NamespaceType.Explicit
        break
      case ConstantKind.StaticProtectedNs:
        type = NamespaceType.StaticProtected
        break
      case ConstantKind.PrivateNs:
        type = NamespaceType.Private
        break
      default:
        throw new Error('Namespace type error.')
    }
    let name = null
    if (CONSTANT.NamespaceKinds.includes(kind)) {
      name = abc.getString(reader.readU30())
    } else {
      console.error('kind not includes', kind)
    }
    return new Namespace(type, name)
  }
  get type () {
    return this._type
  }
  get uri () {
    return this._uri
  }
  // set uri (value: string) {
  //   this._uri = value
  //   this._mangledName = null
  // }
  get prefix () {
    return this._prefix
  }
  // set prefix (value: string) {
  //   this._prefix = value
  //   this._mangledName = null
  // }
  get mangledName () {
    if (!this._mangledName) {
      this._mangledName = Namespace.MangledName(this._type, this._uri, this._prefix)
    }
    return this._mangledName
  }
  isPublic () {
    return this._type === NamespaceType.Public
  }
  Multiname (name: string) {
    return Multiname.QName(this, name)
  }
  toString () {
    return this._uri
  }
}
export class ExceptionInfo {
  start: number
  end: number
  target: number
  excType: Multiname
  varName: Multiname
  traits: Traits
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new ExceptionInfo()
    self.start = reader.readU30()
    self.end = reader.readU30()
    self.target = reader.readU30()
    self.excType = abc.getMultiname(reader.readU30())
    self.varName = abc.getMultiname(reader.readU30())
    if (self.varName) {
      let trait = new TraitInfo(abc)
      trait.holder = self
      trait.name = self.varName
      trait.kindType = TRAIT.Slot
      trait.data = new TraitSlot(abc)
      trait.data.typeName = self.excType

      self.traits = new Traits(trait)
    }
    return self
  }
  getTrait(): Traits {
    return this.traits
  }
}
export class MethodBodyInfo {
  method: MethodInfo
  maxStack: number
  localCount: number
  initScopeDepth: number
  maxScopeDepth: number
  code: ArrayBuffer
  exception: ExceptionInfo[]
  trait: Traits
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new MethodBodyInfo()
    self.method = abc.getMethod(reader.readU30())
    self.maxStack = reader.readU30()
    self.localCount = reader.readU30()
    self.initScopeDepth = reader.readU30()
    self.maxScopeDepth = reader.readU30()
    const codeLength = reader.readU30()
    self.code = reader.readArray(codeLength)

    const exceptionCount = reader.readU30()
    self.exception = []
    for (let i = 0; i < exceptionCount; i++) {
      self.exception.push(ExceptionInfo.read(reader, abc))
    }
    const traitCount = reader.readU30()
    self.trait = new Traits()
    for (let i = 0; i < traitCount; i++) {
      self.trait.push(TraitInfo.read(reader, abc, self))
    }
    return self
  }
}
export class ScriptInfo {
  init: MethodInfo
  trait: Traits
  abc: AbcFile
  constructor (abc: AbcFile) {
    this.abc = abc
  }
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new ScriptInfo(abc)
    self.init = abc.getMethod(reader.readU30())
    const traitCount = reader.readU30()
    self.trait = new Traits()
    for (let i = 0; i < traitCount; i++) {
      self.trait.push(TraitInfo.read(reader, abc, self))
    }
    return self
  }
  getID () {
    return this.abc.script.indexOf(this)
  }
}
export class ClassInfo {
  cinit: MethodInfo
  trait: Traits = new Traits()
  holderMeta: MetadataInfo[] = []
  holderTraitName: Multiname
  constructor (public abc: AbcFile) {

  }
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new ClassInfo(abc)
    self.cinit = abc.getMethod(reader.readU30())
    const traitCount = reader.readU30()
    for (let i = 0; i < traitCount; i++) {
      self.trait.push(TraitInfo.read(reader, abc, self))
    }
    return self
  }
  getInstance () {
    if (this.abc) {
      return this.abc.getInstanceByClass(this)
    } else {
      return null
    }
  }
}
export class TraitSlot {
  slotId: number
  typeName: Multiname
  vkind: number // defaultValueKind
  vindex: number // defaultValueIndex
  constructor (private abc: AbcFile) {
    this.vkind = -1
  }
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new TraitSlot(abc)
    self.slotId = reader.readU30()
    self.typeName = abc.getMultiname(reader.readU30())
    self.vindex = reader.readU30()
    if (self.vindex !== 0) {
      self.vkind = reader.readU8()
    }
    return self
  }
  getDefaultValue () {
    if (this.vkind === -1) {
      if (this.typeName === null) {
        return undefined
      }
      let value = typeDefaultValues[this.typeName.mangledName]
      return value === undefined ? null : value
    }
    return this.abc.getConstant(this.vkind, this.vindex)
  }
}
export class TraitClass extends TraitSlot {
  slotId: number
  classi: ClassInfo
  constructor (abc: AbcFile) {
    super(abc)
    this.vkind = 0
    this.vindex = -1
    this.typeName = null
  }
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new TraitClass(abc)
    self.slotId = reader.readU30()
    self.classi = abc.getClass(reader.readU30())
    return self
  }
}
export class TraitMethod {
  dispId: number
  method: MethodInfo
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new TraitMethod()
    self.dispId = reader.readU30()
    self.method = abc.getMethod(reader.readU30())
    return self
  }
}
export class TraitFunction {
  slotId: number
  function: MethodInfo
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new TraitFunction()
    self.slotId = reader.readU30()
    self.function = abc.getMethod(reader.readU30())
    return self
  }
}
type TraitBelongs = MethodBodyInfo | ScriptInfo | ClassInfo | InstanceInfo | ExceptionInfo
export class TraitInfo {
  name: Multiname
  kindType: TRAIT
  kindFlags: CONSTANT.ATTR
  data: TraitSlot | TraitMethod | TraitClass | TraitFunction
  metadata: MetadataInfo[]
  holder: TraitBelongs
  constructor (public abc: AbcFile) {
    //
  }
  static read (reader: BufferReader, abc: AbcFile, belongsTo: TraitBelongs) {
    let self = new TraitInfo(abc)
    self.holder = belongsTo
    self.name = abc.getMultiname(reader.readU30())
    const kind = reader.readU8()
    self.kindType = kind & 0xf
    self.kindFlags = kind >> 4
    self.data = null
    switch (self.kindType) {
      case TRAIT.Slot:
      case TRAIT.Const:
        self.data = TraitSlot.read(reader, abc)
        break
      case TRAIT.Method:
      case TRAIT.Getter:
      case TRAIT.Setter:
        self.data = TraitMethod.read(reader, abc)
        break
      case TRAIT.Class:
        self.data = TraitClass.read(reader, abc)
        break
      case TRAIT.Function:
        self.data = TraitFunction.read(reader, abc)
        break
    }
    if ((self.kindFlags & CONSTANT.ATTR.Metadata) !== 0) {
      const metadataCount = reader.readU30()
      self.metadata = []
      for (let i = 0; i < metadataCount; i++) {
        self.metadata.push(abc.getMetadata(reader.readU30()))
      }
    }
    if (self.data instanceof TraitClass) {
      const cls = self.data.classi
      if (self.metadata) {
        cls.holderMeta = cls.holderMeta.concat(self.metadata)
      }
      cls.holderTraitName = self.name
    }
    return self
  }
  isSetter () {
    return this.kindType === TRAIT.Setter
  }
  isGetter () {
    return this.kindType === TRAIT.Getter
  }
  isMethod () {
    return this.kindType === TRAIT.Method
  }
}
export class Traits extends Array<TraitInfo> {
  getTrait (mn: Multiname): TraitInfo {
    let mnName = mn.name
    let nss = mn.nsSet
    let traits = this
    for (let trait of traits) {
      let traitMn = trait.name
      if (traitMn.name === mnName) {
        let ns = traitMn.nsSet[0]
        for (let j = 0; j < nss.length; j++) {
          if (ns.mangledName === nss[j].mangledName) { // TODO: 是否应该判断 Mangled Name
            return trait
          }
        }
      }
    }
    return null
  }
}
export class InstanceInfo {
  name: Multiname
  superName: Multiname
  flags: CONSTANT.InstanceFlags
  protectedNs: Namespace
  interface: Multiname[]
  iinit: MethodInfo
  trait: Traits
  constructor (public abc: AbcFile) {

  }
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new InstanceInfo(abc)
    self.name = abc.getMultiname(reader.readU30())
    self.superName = abc.getMultiname(reader.readU30())
    self.flags = reader.readU8()

    // this.protectedNs = 0 // undefined
    if ((self.flags & CONSTANT.InstanceFlags.ClassProtectedNs) !== 0) {
      self.protectedNs = abc.getNamespace(reader.readU30())
    }

    const intrfCount = reader.readU30()
    self.interface = []
    for (let i = 0; i < intrfCount; i++) {
      self.interface.push(abc.getMultiname(reader.readU30()))
    }
    self.iinit = abc.getMethod(reader.readU30())
    const traitCount = reader.readU30()
    self.trait = new Traits()
    for (let i = 0; i < traitCount; i++) {
      self.trait.push(TraitInfo.read(reader, abc, self))
    }
    return self
  }
  getClass () {
    return this.abc.getClassByInstance(this)
  }
}
export class ItemInfo extends Map<string, string> {
  key: string
  value: string
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new ItemInfo()
    self.key = abc.getString(reader.readU30())
    self.value = abc.getString(reader.readU30())
    return self
  }
}
export class MetadataInfo extends Map<string, string> {
  name: string
  value: string
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new MetadataInfo()
    self.name = abc.getString(reader.readU30())
    const itemCount = reader.readU30()
    let keys = []
    for (let i = 0; i < itemCount; i++) {
      keys.push(abc.getString(reader.readU30()))
    }
    for (let i = 0; i < itemCount; i++) {
      const val = abc.getString(reader.readU30())
      if (keys[i] === null) {
        self.value = val
      } else {
        self.set(keys[i], val)
      }
    }
    return self
  }
  toJSON () {
    let obj: any = {}
    for (let i of this.entries()) {
      obj[i[0]] = i[1]
    }
    obj['__name__'] = this.name
    return obj
  }
}
// TODO: p25
export class OptionDetail {
  val: any
  kind: ConstantKind
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new OptionDetail()
    let index = reader.readU30()
    self.kind = reader.readU8()
    self.val = abc.getConstant(self.kind, index)
    return self
  }
}

export class MethodInfo {
  returnType: Multiname
  paramType: Multiname[]
  name: string
  flags: MethodFlags
  options: OptionDetail[]
  paramNames: string[]
  id: number
  constructor (public abc: AbcFile) {
    //
  }
  static read (reader: BufferReader, abc: AbcFile) {
    let self = new MethodInfo(abc)
    const paramCount = reader.readU30()
    self.returnType = abc.getMultiname(reader.readU30())

    self.paramType = []
    for (let i = 0; i < paramCount; i++) {
      self.paramType.push(abc.getMultiname(reader.readU30()))
    }
    self.name = abc.getString(reader.readU30())
    self.flags = reader.readU8()

    self.options = []
    if ((self.flags & MethodFlags.HAS_OPTIONAL) !== 0) {
      const optionCount = reader.readU30()
      for (let i = 0; i < optionCount; i++) {
        self.options.push(OptionDetail.read(reader, abc))
      }
    }

    self.paramNames = []
    if ((self.flags & MethodFlags.HAS_PARAM_NAMES) !== 0) {
      for (let i = 0; i < paramCount; i++) {
        self.paramNames.push(abc.getString(reader.readU30()))
      }
    }

    if ((self.flags & MethodFlags.Native) !== 0) {
      // logger.error('native method')
      // TODO: 绑定 native 方法
    }
    return self
  }
  getBody () {
    return this.abc.getMethodBodyByMethod(this)
  }
  needsRest () {
    return (this.flags & MethodFlags.NEED_REST) !== 0
  }
  isNative () {
    return (this.flags & MethodFlags.Native) !== 0
  }
}
export class Multiname {
  kind: number
  name: string
  nsSet: Namespace[]
  factory: Multiname
  params: Multiname[]
  _mangledName: string = null
  static Public (name: string) {
    let self = new Multiname()
    self.kind = CONSTANT.QName
    self.nsSet = [new Namespace(NamespaceType.Public, '')]
    self.name = name
    return self
  }
  static Package (pkg: string, name: string) {
    let self = new Multiname()
    self.kind = CONSTANT.QName
    self.nsSet = [Namespace.Package(pkg)]
    self.name = name
    return self
  }
  static PackageInternal (pkg: string, name: string) {
    let self = new Multiname()
    self.kind = CONSTANT.QName
    self.nsSet = [Namespace.PackageInternal(pkg)]
    self.name = name
    return self
  }
  static QName (ns: Namespace, name: string) {
    let self = new Multiname()
    self.kind = CONSTANT.QName
    self.nsSet = [ns]
    self.name = name
    return self
  }
  static PublicMangledName (name: string) {
    return Multiname.MangledName(Namespace.Public, name)
  }
  static MangledName (namespace: Namespace, name: string) {
    return '$' + namespace.mangledName + '-' + name
  }
  static stripPublicMangledName (name: string) {
    const prefix = Multiname.PublicMangledName('')
    if (name.startsWith(prefix)) {
      return name.substr(prefix.length)
    }
    return null
  }
  static read (reader: BufferReader, abc: AbcFile) {
    // let self = new Multiname()
    let kind = reader.readU8()
    let nsSet: Namespace[] = []
    let name: string
    let qname: number
    let params: number[]
    let lazy = false
    switch (kind) {
      case CONSTANT.QName:
      case CONSTANT.QNameA:
        nsSet = [abc.getNamespace(reader.readU30())]
        name = abc.getString(reader.readU30())
        break
      case CONSTANT.RTQName:
      case CONSTANT.RTQNameA:
        name = abc.getString(reader.readU30())
        break
      case CONSTANT.RTQNameL:
      case CONSTANT.RTQNameLA:
        break
      case CONSTANT.Multiname:
      case CONSTANT.MultinameA:
        name = abc.getString(reader.readU30())
        nsSet = abc.getNsSet(reader.readU30())
        break
      case CONSTANT.MultinameL:
      case CONSTANT.MultinameLA:
        nsSet = abc.getNsSet(reader.readU30())
        break
      case CONSTANT.MTypename:
        lazy = true
        qname = reader.readU30()
        const paramLength = reader.readU30()
        params = []
        for (let i = 0; i < paramLength; i++) {
          params.push(reader.readU30())
        }
        break
      default:
        console.error('Unknown kind of Multiname:' + kind)
    }
    const resolve = (getMultiname: (index: number) => Multiname) => {
      let self = new Multiname()
      self.kind = kind
      self.name = name
      self.nsSet = nsSet
      if (self.kind === CONSTANT.MTypename) {
        self.factory = getMultiname(qname)
        self.params = params.map(i => getMultiname(i))
        self.nsSet = self.factory.nsSet
        self.name = self.factory.name
      }
      return self
    }
    return resolve
  }
  get mangledName () {
    let mangledName = this._mangledName
    if (!mangledName) {
      mangledName = this._mangledName = Multiname.MangledName(this.nsSet[0], this.name)
    }
    return mangledName
  }
  toString () {
    let ns = this.nsSet[0]
    if (ns) {
      return ns.toString() + ':' + this.name
    } else {
      return this.name
    }
  }
  toJSON () {
    if (this.kind === CONSTANT.QName) {
      if (this.nsSet.length === 1) {
        if (this.nsSet[0].isPublic()) {
          return this.name
        } else {
          return `${this.nsSet[0].uri}::${this.name}`
        }
      }
    }
    return this
  }
  isRuntimeName () {
    switch (this.kind) {
      case CONSTANT.RTQNameL:
      case CONSTANT.RTQNameLA:
      case CONSTANT.MultinameL:
      case CONSTANT.MultinameLA:
        return true
    }
    return false
  }
  isRuntime () {
    switch (this.kind) {
      case CONSTANT.QName:
      case CONSTANT.QNameA:
      case CONSTANT.Multiname:
      case CONSTANT.MultinameA:
        return false
    }
    return true
  }
  isRuntimeNamespace () {
    switch (this.kind) {
      case CONSTANT.RTQName:
      case CONSTANT.RTQNameA:
      case CONSTANT.RTQNameL:
      case CONSTANT.RTQNameLA:
        return true
    }
    return false
  }
  isAttribute () {
    switch (this.kind) {
      case CONSTANT.QNameA:
      case CONSTANT.RTQNameA:
      case CONSTANT.RTQNameLA:
      case CONSTANT.MultinameA:
      case CONSTANT.MultinameLA:
        return true
    }
    return false
  }
  isAnyName () {
    return this.name === null
  }
}

let typeDefaultValues = {
  [Multiname.PublicMangledName('Number')]: NaN,
  [Multiname.PublicMangledName('int')]: 0,
  [Multiname.PublicMangledName('uint')]: 0,
  [Multiname.PublicMangledName('Boolean')]: false
}

export function getNamespaceTypeName(namespaceType: NamespaceType): string {
  const namespaceTypeNames = ['Public', 'Protected', 'PackageInternal', 'Private', 'Explicit', 'StaticProtected']
  return namespaceTypeNames[namespaceType]
}

export class CPoolInfo {
  integer: number[]
  uinteger: number[]
  double: number[]
  string: string[]
  namespace: Namespace[]
  nsSet: Namespace[][]
  multiname: Multiname[]
  static read (self: CPoolInfo, reader: BufferReader, abc: AbcFile) {
    const intCount = reader.readU30() - 1
    self.integer = [null]
    for (let i = 0; i < intCount; i++) {
      self.integer.push(reader.readS32())
    }

    const uintCount = reader.readU30() - 1
    self.uinteger = [null]
    for (let i = 0; i < uintCount; i++) {
      self.uinteger.push(reader.readU32())
    }

    const doubleCount = reader.readU30() - 1
    self.double = [null]
    for (let i = 0; i < doubleCount; i++) {
      self.double.push(reader.readD64())
    }

    const stringCount = reader.readU30() - 1
    self.string = [null]
    for (let i = 0; i < stringCount; i++) {
      const size = reader.readU30()
      self.string.push(reader.readString(size))
    }

    const namespaceCount = reader.readU30() - 1
    self.namespace = [null]
    for (let i = 0; i < namespaceCount; i++) {
      self.namespace.push(Namespace.read(reader, abc))
    }

    const nsSetCount = reader.readU30() - 1
    self.nsSet = [null]
    for (let i = 0; i < nsSetCount; i++) {
      let nsSet = []
      const count = reader.readU30()
      for (let i = 0; i < count; i++) {
        nsSet.push(abc.getNamespace(reader.readU30()))
      }
      self.nsSet.push(nsSet)
    }

    const multinameCount = reader.readU30() - 1
    let multiname: (Function | Multiname)[] = [null]
    for (let i = 0; i < multinameCount; i++) {
      multiname.push(Multiname.read(reader, abc))
    }
    const getMultiname = (index: number): Multiname => {
      let mn = multiname[index]
      if (mn instanceof Multiname) {
        return mn
      } else {
        return mn(getMultiname)
      }
    }
    for (let i = 1; i <= multinameCount; i++) {
      multiname[i] = getMultiname(i)
    }
    self.multiname = multiname as Multiname[]
    return self
  }
}
export class AbcMap {
  public methodBody: WeakMap<MethodInfo, MethodBodyInfo>
  public instance: WeakMap<ClassInfo, InstanceInfo>
  public cls: WeakMap<InstanceInfo, ClassInfo>
  constructor () {
    this.methodBody = this.instance = this.cls = new WeakMap()
  }
}
export class AbcFile {
  minorVersion: number
  majorVersion: number
  method: MethodInfo[]
  metadata: MetadataInfo[]
  instance: InstanceInfo[]
  classes: ClassInfo[]
  script: ScriptInfo[]
  methodBody: MethodBodyInfo[]
  map: AbcMap
  constantPool: CPoolInfo
  app: ApplicationDomain
  constructor (reader: BufferReader, app: ApplicationDomain) {
    this.app = app

    this.minorVersion = reader.readU16()
    this.majorVersion = reader.readU16()
    this.constantPool = new CPoolInfo()
    CPoolInfo.read(this.constantPool, reader, this)

    const methodCount = reader.readU30()
    this.method = []
    for (let i = 0; i < methodCount; i++) {
      this.method.push(MethodInfo.read(reader, this))
    }
    for (let i = 0; i < methodCount; i++) {
      this.method[i].id = i
    }

    const metadataCount = reader.readU30()
    this.metadata = []
    for (let i = 0; i < metadataCount; i++) {
      this.metadata.push(MetadataInfo.read(reader, this))
    }

    const classCount = reader.readU30()
    this.instance = []
    for (let i = 0; i < classCount; i++) {
      this.instance.push(InstanceInfo.read(reader, this))
    }

    this.classes = []
    for (let i = 0; i < classCount; i++) {
      this.classes.push(ClassInfo.read(reader, this))
    }

    const scriptCount = reader.readU30()
    this.script = []
    for (let i = 0; i < scriptCount; i++) {
      this.script.push(ScriptInfo.read(reader, this))
    }

    const methodBodyCount = reader.readU30()
    this.methodBody = []
    for (let i = 0; i < methodBodyCount; i++) {
      this.methodBody.push(MethodBodyInfo.read(reader, this))
    }

    this.map = new AbcMap()
    for (let methodBody of this.methodBody) {
      this.map.methodBody.set(methodBody.method, methodBody)
    }
    for (let i = 0; i < classCount; i++) {
      this.map.instance.set(this.classes[i], this.instance[i])
      this.map.cls.set(this.instance[i], this.classes[i])
    }
  }
  getMetadata (index: number) {
    return this.metadata[index]
  }
  getMethodBodyByMethod (method: MethodInfo) {
    return this.map.methodBody.get(method)
  }
  getInstanceByClass (cls: ClassInfo) {
    return this.map.instance.get(cls)
  }
  getClassByInstance (inst: InstanceInfo) {
    return this.map.cls.get(inst)
  }
  getMethod (index: number) {
    return this.method[index]
  }
  getString (index: number) {
    return this.constantPool.string[index]
  }
  getMultiname (index: number) {
    return this.constantPool.multiname[index]
  }
  getNamespace (index: number) {
    return this.constantPool.namespace[index]
  }
  getClass (index: number) {
    return this.classes[index]
  }
  getNsSet (index: number) {
    return this.constantPool.nsSet[index]
  }
  getScript (index: number) {
    return this.script[index]
  }
  getUInt (index: number) {
    return this.constantPool.uinteger[index]
  }
  getInt (index: number) {
    return this.constantPool.integer[index]
  }
  getDouble (index: number) {
    return this.constantPool.double[index]
  }
  getConstant (kind: ConstantKind, idx: number) {
    switch (kind) {
      case ConstantKind.Int:
        return this.getInt(idx)
      case ConstantKind.UInt:
        return this.getUInt(idx)
      case ConstantKind.Double:
        return this.getDouble(idx)
      case ConstantKind.Utf8:
        return this.getString(idx)
      case ConstantKind.True:
      case ConstantKind.False:
        return ConstantKind.True === kind
      case ConstantKind.Null:
        return null
      case ConstantKind.Undefined:
        return undefined
      default:
        if (CONSTANT.NamespaceKinds.includes(kind)) {
          return this.getNamespace(idx)
        } else {
          throw new Error ('Unknown constant kind' + kind)
        }
    }
  }
  toJSON () {
    let stack = new Error().stack
    const len = stack.length
    if (len - stack.replace(/AbcFile\.toJSON/g, 'AbcFiletoJSON').length > 1) {
      return null
    }
    return JSON.parse(JSON.stringify(
      {
        minorVersion: this.minorVersion,
        majorVersion: this.majorVersion,
        script: this.script,
        classes: this.classes,
        instance: this.instance,
        method: this.method,
        methodBody: this.methodBody
      },
      (k, v) => {
        if (k === 'abc' || k === 'app' || k === 'holder') {
          return undefined
        }
        if (k === 'kind' || k === '_kind') {
          return `0x${v.toString(16)}`
        }
        if (v instanceof ArrayBuffer) {
          return hex(Array.from(new Uint8Array(v)))
        }
        if (v instanceof Object && v.constructor && v.constructor.name) {
          v.cType = v.constructor.name
        }
        return v
      }))
  }
}
