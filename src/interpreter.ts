import {Bytecode, OpcodeParam, getBytecodeName} from './ops'
import {NativeClass, AXClass} from './native'
import {Scope, ApplicationDomain, SecurityDomain, ErrorWrapper, axEquals, axTypeOf, axCoerceString, axConvertString} from './runtime'
import {Multiname, AbcFile} from './abc'
import {popManyInto as popMany, BufferReader} from './utils'
import {Errors} from './error'
import {Logger} from './logger'
import {ByteArray} from '@/native/builtin/ByteArray'
import {vm as valueManager, ValueManager} from './value'
import {AXGlobalClass} from './base'
import * as ABC from './abc'
import * as CONSTANT from './constant'
const logger = new Logger('Interpreter')
type Stack = any[]
type Locals = any[]
interface IntParam {
  locals: Locals
  stack: Stack
  bc: Bytecode
  value: Value
  object: Value
  a: Value
  b: Value
  args: Value[]
  index: Value
  receiver: RefValue
  result: Value
  context: Context
  savedScope: Scope
  scopes: ScopeStack
  rn: Multiname
  abc: AbcFile
  sec: SecurityDomain
  app: ApplicationDomain
  methodInfo: ABC.MethodInfo
  methodBody: ABC.MethodBodyInfo
  argCount: number
  offset: number
  domainMemory: ByteArray
  pc: (offset: number) => void
  u30: () => number
  s8: () => number
  s24: () => number
  returnValue: (x: any) => void
}
export class Interpreter {
  psc: WeakMap<ArrayBuffer, number[][]> = new WeakMap()
  callTable: Function[]
  globalStacks: Context[] = []
  vm: ValueManager
  Errors = Errors;
  [key: number]: any
  constructor () {
    this.vm = valueManager
    this.callTable = []
    let bcs = []
    for (let bc = 0; bc < 0x100; bc++) {
      if (this[bc]) {
        bcs.push(bc)
      }
    }
    for (let bc of bcs) {
      this.callTable[bc] = this[bc]
    }
  }
  [Bytecode.SETLOCAL0] ({locals, stack, bc}: IntParam) {
    locals[0] = stack.pop()
  }
  [Bytecode.SETLOCAL1] ({locals, stack, bc}: IntParam) {
    locals[1] = stack.pop()
  }
  [Bytecode.SETLOCAL2] ({locals, stack, bc}: IntParam) {
    locals[2] = stack.pop()
  }
  [Bytecode.SETLOCAL3] ({locals, stack, bc}: IntParam) {
    locals[3] = stack.pop()
  }
  [Bytecode.GETLOCAL0] ({locals, stack, bc}: IntParam) {
    stack.push(locals[0])
  }
  [Bytecode.GETLOCAL1] ({locals, stack, bc}: IntParam) {
    stack.push(locals[1])
  }
  [Bytecode.GETLOCAL2] ({locals, stack, bc}: IntParam) {
    stack.push(locals[2])
  }
  [Bytecode.GETLOCAL3] ({locals, stack, bc}: IntParam) {
    stack.push(locals[3])
  }
  [Bytecode.GETLOCAL] ({locals, stack, bc, u30}: IntParam) {
    stack.push(locals[u30()])
  }
  [Bytecode.SETLOCAL] ({locals, stack, u30}: IntParam) {
    locals[u30()] = stack.pop()
  }
  [Bytecode.PUSHSCOPE] ({value, scopes, stack, bc, u30}: IntParam) {
    value = stack.pop()
    scopes.push(value, false)
  }
  [Bytecode.FINDPROPERTY] (intParam: IntParam) {
    return this[Bytecode.FINDPROPSTRICT](intParam)
  }
  [Bytecode.FINDPROPSTRICT] ({scopes, value, rn, stack, bc, u30, abc}: IntParam) {
    this.popNameInto(stack, abc.getMultiname(u30()), rn)
    value = scopes.topScope().findScopeProperty(rn, bc === Bytecode.FINDPROPSTRICT, false)
    stack.push(value)
  }
  [Bytecode.CONSTRUCT] ({app, receiver, locals, stack, bc, u30, args}: IntParam) {
    this.popManyInto(stack, u30(), args)
    receiver = stack.pop()
    if (!receiver) {
      app.throwError('ReferenceError', this.Errors.ConstructOfNonFunctionError)
    }
    stack.push((receiver as AXClass).axNew(...args))
  }
  [Bytecode.CONSTRUCTPROP] ({app, value, receiver, abc, index, rn, args, stack, u30}: IntParam) {
    index = u30()
    this.popManyInto(stack, u30(), args)
    this.popNameInto(stack, abc.getMultiname(index), rn)
    receiver = stack.pop()
    value = this.vm.getProperty(receiver, rn)
    if (!value) {
      app.throwError('ReferenceError', this.Errors.ConstructOfNonFunctionError)
    }
    stack.push((value as AXClass).axNew(...args))
  }
  [Bytecode.CONSTRUCTSUPER] ({savedScope, receiver, args, locals, stack, bc, u30}: IntParam) {
    this.popManyInto(stack, u30(), args)
    receiver = stack.pop();
    (savedScope.object as AXClass).axSuperConstruct(receiver, ...args)
  }
  [Bytecode.CALL] ({object, value, args, locals, stack, bc, u30}: IntParam) {
    this.popManyInto(stack, u30(), args)
    object = stack.pop()
    value = stack[stack.length - 1]
    // stack[stack.length - 1] = (value as AXObject).axCallProperty(this.getPublicMultiname('call'), [object, ...args])
    stack[stack.length - 1] = (value as Function).call(object, ...args)
  }
  [Bytecode.CALLSUPER] (intParam: IntParam) {
    return this[Bytecode.CALLSUPERVOID](intParam)
  }
  [Bytecode.CALLSUPERVOID] ({receiver, result, rn, abc, args, argCount, savedScope, index, locals, stack, bc, u30}: IntParam) {
    index = u30()
    argCount = u30()
    this.popManyInto(stack, argCount, args)
    this.popNameInto(stack, abc.getMultiname(index), rn)
    receiver = stack.pop()
    result = this.vm.callSuper(receiver, rn, savedScope, args)
    if (bc !== Bytecode.CALLSUPERVOID) {
      stack.push(result)
    }
  }
  [Bytecode.NEWFUNCTION] ({value, sec, scopes, abc, locals, stack, bc, u30}: IntParam) {
    value = sec.createFunction(abc.getMethod(u30()), scopes.topScope(), true)
    stack.push(value)
  }
  [Bytecode.FINDDEF] ({app, value, rn, abc, index, locals, stack, bc, u30}: IntParam) {
    index = u30()
    this.popNameInto(stack, abc.getMultiname(index), rn)
    value = app.findProperty(rn, true, true)
    // logger.debug('finddef', rn, value)
    stack.push(value)
  }
  [Bytecode.CALLPROPLEX] (intParam: IntParam) {
    return this[Bytecode.CALLPROPVOID](intParam)
  }
  [Bytecode.CALLPROPERTY] (intParam: IntParam) {
    return this[Bytecode.CALLPROPVOID](intParam)
  }
  [Bytecode.CALLPROPVOID] ({result, rn, abc, receiver, sec, app, args, argCount, index, locals, stack, bc, u30}: IntParam) {
    index = u30()
    argCount = u30()
    this.popManyInto(stack, argCount, args)
    this.popNameInto(stack, abc.getMultiname(index), rn)
    receiver = stack[stack.length - 1]
    if (this.vm.isPrimitive(receiver)) {
      receiver = sec.box(receiver)
      if (!receiver) {
        app.throwError('ReferenceError', this.Errors.NotImplementedError, 1, 2)
      }
    }
    // result = receiver.axCallProperty(rn, args, bc === Bytecode.CALLPROPLEX)
    result = this.vm.callProperty(receiver, rn, args)
    if (bc === Bytecode.CALLPROPVOID) {
      stack.length--
    } else {
      stack[stack.length - 1] = result
    }
  }
  [Bytecode.NOP] (intParam: IntParam) {
    // nop
  }
  [Bytecode.COERCE_A] (intParam: IntParam) {
    // nop
  }
  [Bytecode.RETURNVOID] ({returnValue}: IntParam) {
    this.globalStacks.pop()
    return returnValue(undefined)
  }
  [Bytecode.RETURNVALUE] ({value, stack, returnValue}: IntParam) {
    value = stack.pop()
    this.globalStacks.pop()
    return returnValue(value)
  }
  [Bytecode.PUSHSTRING] ({abc, stack, u30}: IntParam) {
    stack.push(abc.getString(u30()))
  }
  [Bytecode.PUSHTRUE] ({stack}: IntParam) {
    stack.push(true)
  }
  [Bytecode.PUSHFALSE] ({stack}: IntParam) {
    stack.push(false)
  }
  [Bytecode.PUSHSHORT] ({stack, u30}: IntParam) {
    stack.push(u30() << 16 >> 16)
  }
  [Bytecode.PUSHUNDEFINED] ({locals, stack, bc, u30}: IntParam) {
    stack.push(undefined)
  }
  [Bytecode.GETGLOBALSCOPE] ({savedScope, stack}: IntParam) {
    stack.push(savedScope.global.object)
  }
  [Bytecode.SWAP] ({value, locals, stack, bc, u30}: IntParam) {
    value = stack[stack.length - 1]
    stack[stack.length - 1] = stack[stack.length - 2]
    stack[stack.length - 2] = value
  }
  [Bytecode.SETSLOT] ({value, stack, receiver, u30}: IntParam) {
    value = stack.pop()
    receiver = stack.pop()
    this.vm.setSlot(receiver, u30(), value)
  }
  [Bytecode.PUSHBYTE] ({stack, s8}: IntParam) {
    stack.push(s8())
  }
  [Bytecode.ADD] ({a, b, value, locals, stack, bc, u30}: IntParam) {
    b = stack.pop() as number
    a = stack.pop() as number
    value = a + b
    stack.push(value)
  }
  [Bytecode.MULTIPLY] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 2] *= stack.pop()
  }
  [Bytecode.DIVIDE] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 2] /= stack.pop()
  }
  [Bytecode.MODULO] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 2] %= stack.pop()
  }
  [Bytecode.SUBTRACT] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 2] -= stack.pop()
  }
  [Bytecode.JUMP] ({pc, s24}: IntParam) {
    pc(s24())
  }
  [Bytecode.LESSTHAN] ({stack}: IntParam) {
    stack[stack.length - 2] = stack[stack.length - 2] < stack.pop()
  }
  [Bytecode.LESSEQUALS] ({stack}: IntParam) {
    stack[stack.length - 2] = stack[stack.length - 2] <= stack.pop()
  }
  [Bytecode.GREATERTHAN] ({stack}: IntParam) {
    stack[stack.length - 2] = stack[stack.length - 2] > stack.pop()
  }
  [Bytecode.GREATEREQUALS] ({stack}: IntParam) {
    stack[stack.length - 2] = stack[stack.length - 2] >= stack.pop()
  }
  [Bytecode.IFLE] ({stack, a, b, s24, pc, offset}: IntParam) {
    b = stack.pop() as number
    a = stack.pop() as number
    offset = s24()
    if (a <= b) {
      pc(offset)
    }
  }
  [Bytecode.IFNLT] ({a, b, stack, s24, offset, pc}: IntParam) {
    b = stack.pop() as number
    a = stack.pop() as number
    offset = s24()
    if (!(a < b)) {
      pc(offset)
    }
  }
  [Bytecode.IFGE] ({a, b, stack, s24, offset, pc}: IntParam) {
    b = stack.pop() as number
    a = stack.pop() as number
    offset = s24()
    if (a >= b) {
      pc(offset)
    }
  }
  [Bytecode.IFGT] ({offset, stack, a, b, s24, pc}: IntParam) {
    b = stack.pop() as number
    a = stack.pop() as number
    offset = s24()
    if (a > b) {
      pc(offset)
    }
  }
  [Bytecode.IFNGT] ({offset, stack, a, b, s24, pc}: IntParam) {
    b = stack.pop() as number
    a = stack.pop() as number
    offset = s24()
    if (!(a > b)) {
      pc(offset)
    }
  }
  [Bytecode.IFNGE] ({offset, stack, a, b, s24, pc}: IntParam) {
    b = stack.pop() as number
    a = stack.pop() as number
    offset = s24()
    if (!(a >= b)) {
      pc(offset)
    }
  }
  [Bytecode.IFLT] ({offset, stack, a, b, s24, pc}: IntParam) {
    b = stack.pop() as number
    a = stack.pop() as number
    offset = s24()
    if (a < b) {
      pc(offset)
    }
  }
  [Bytecode.IFNE] ({offset, stack, a, b, s24, pc}: IntParam) {
    b = stack.pop() as number
    a = stack.pop() as number
    offset = s24()
    if (!this.axEquals(a, b)) {
      pc(offset)
    }
  }
  [Bytecode.THROW] ({value, stack}: IntParam) {
    value = stack.pop()
    this.throwWrapper(value)
  }
  [Bytecode.GETSLOT] ({receiver, stack, result, u30}: IntParam) {
    receiver = stack.pop()
    result = this.vm.getSlot(receiver, u30())
    stack.push(result)
  }
  [Bytecode.LABEL] ({locals, stack, bc, u30}: IntParam) {
    //
  }
  [Bytecode.INCLOCAL_I] ({locals, index, u30}: IntParam) {
    index = u30()
    locals[index] = (locals[index] | 0) + 1
  }
  [Bytecode.DECLOCAL_I] ({locals, index, u30}: IntParam) {
    index = u30()
    locals[index] = (locals[index] | 0) - 1
  }
  [Bytecode.INCREMENT] ({locals, stack}: IntParam) {
    ++stack[stack.length - 1]
  }
  [Bytecode.DECREMENT] ({locals, stack}: IntParam) {
    --stack[stack.length - 1]
  }
  [Bytecode.INCREMENT_I] ({locals, stack}: IntParam) {
    stack[stack.length - 1] = (stack[stack.length - 1] | 0) + 1
  }
  [Bytecode.DECREMENT_I] ({locals, stack}: IntParam) {
    stack[stack.length - 1] = (stack[stack.length - 1] | 0) - 1
  }
  [Bytecode.KILL] ({locals, stack, u30}: IntParam) {
    locals[u30()] = undefined
  }
  [Bytecode.POP] ({locals, stack, bc, u30}: IntParam) {
    stack.pop()
  }
  [Bytecode.GETSCOPEOBJECT] ({scopes, stack, value, u30}: IntParam) {
    value = scopes.get(u30())
    stack.push(value)
  }
  [Bytecode.GETPROPERTY] ({receiver, sec, app, result, abc, stack, rn, u30}: IntParam) {
    this.popNameInto(stack, abc.getMultiname(u30()), rn)
    receiver = stack.pop()
    if (this.vm.isPrimitive(receiver)) {
      receiver = sec.box(receiver)
    }
    if (!receiver) {
      // logger.error('GETPROPERTY receiver undefined', rn.name)
      app.throwError('ReferenceError', this.Errors.UndefinedVarError, rn.name)
    }
    result = this.vm.getProperty(receiver, rn)
    if (result === undefined || result === null) {
      // logger.error('GET "undefined"', receiver.axClass.name, rn.name, result)
    }
    stack.push(result)
  }
  [Bytecode.DELETEPROPERTY] ({locals, stack, abc, u30, rn, receiver}: IntParam) {
    this.popNameInto(stack, abc.getMultiname(u30()), rn)
    receiver = stack.pop()
    stack.push(this.vm.deleteProperty(receiver, rn))
  }
  [Bytecode.NEWCLASS] ({locals, stack, value, app, abc, scopes, u30}: IntParam) {
    value = stack.pop()
    value = app.createClass(
      abc.getClass(u30()),
      value as AXClass,
      scopes.topScope()
    )
    stack.push(value)
  }
  [Bytecode.GETLEX] ({locals, stack, rn, object, result, scopes, u30, abc}: IntParam) {
    this.popNameInto(stack, abc.getMultiname(u30()), rn)
    object = scopes.topScope().findScopeProperty(rn, true, false) as RefValue
    result = this.vm.getProperty(object, rn)
    stack.push(result)
  }
  [Bytecode.POPSCOPE] ({scopes}: IntParam) {
    scopes.pop()
  }
  [Bytecode.INITPROPERTY] ({locals, stack, rn, abc, value, receiver, bc, u30}: IntParam) {
    value = stack.pop()
    this.popNameInto(stack, abc.getMultiname(u30()), rn)
    receiver = stack.pop()
    this.vm.initProperty(receiver, rn, value)
    if (this.instanceofAXClass(value)) {
      // logger.error('new class:', value.classInfo.holderTraitName.name, rn.name)
      (value as AXClass).setName(rn)
    }
  }
  [Bytecode.SETPROPERTY] ({locals, stack, rn, abc, value, receiver, bc, u30}: IntParam) {
    value = stack.pop()
    this.popNameInto(stack, abc.getMultiname(u30()), rn)
    receiver = stack.pop()
    this.vm.setProperty(receiver, rn, value)
    // if (value === undefined || value === null) {
    //   logger.error('SET "undefined"', receiver.axClass.name, rn.name)
    // }
  }
  [Bytecode.NEWACTIVATION] ({scopes, methodInfo, stack, app, u30}: IntParam) {
    stack.push(app.createActivation(methodInfo, scopes.topScope()))
  }
  [Bytecode.DUP] ({locals, stack, bc, u30}: IntParam) {
    stack.push(stack[stack.length - 1])
  }
  [Bytecode.PUSHNULL] ({locals, stack, bc, u30}: IntParam) {
    stack.push(null)
  }
  [Bytecode.NEWARRAY] ({locals, stack, app, object, u30, argCount}: IntParam) {
    object = this.getPublicClass(app, 'Array').axNew()
    argCount = u30()
    for (let i = stack.length - argCount; i < stack.length; i++) {
      (object as any).push(stack[i])
    }
    stack.length -= argCount
    stack.push(object)
  }
  [Bytecode.NOT] ({stack}: IntParam) {
    stack[stack.length - 1] = !stack[stack.length - 1]
  }
  [Bytecode.IFTRUE] ({pc, s24, offset, stack}: IntParam) {
    offset = s24()
    // tslint:disable-next-line
    if (!!stack.pop()) {
      pc(offset)
    }
  }
  [Bytecode.IFFALSE] ({pc, s24, offset, stack}: IntParam) {
    offset = s24()
    if (!stack.pop()) {
      pc(offset)
    }
  }
  [Bytecode.NEGATE] ({stack}: IntParam) {
    stack[stack.length - 1] = -stack[stack.length - 1]
  }
  [Bytecode.COERCE_S] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 1] = this.axCoerceString(stack[stack.length - 1])
  }
  [Bytecode.CONVERT_S] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 1] = this.axConvertString(stack[stack.length - 1])
  }
  [Bytecode.COERCE_I] (intParam: IntParam) {
    return this[Bytecode.CONVERT_I](intParam)
  }
  [Bytecode.CONVERT_I] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 1] |= 0
  }
  [Bytecode.COERCE_B] (intParam: IntParam) {
    return this[Bytecode.CONVERT_B](intParam)
  }
  [Bytecode.CONVERT_B] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 1] = !!stack[stack.length - 1]
  }
  [Bytecode.COERCE_U] (intParam: IntParam) {
    return this[Bytecode.CONVERT_U](intParam)
  }
  [Bytecode.CONVERT_U] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 1] >>>= 0
  }
  [Bytecode.COERCE_D] (intParam: IntParam) {
    return this[Bytecode.CONVERT_D](intParam)
  }
  [Bytecode.CONVERT_D] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 1] = +stack[stack.length - 1]
  }
  [Bytecode.COERCE] ({locals, stack, abc, rn, scopes, receiver, u30}: IntParam) {
    this.popNameInto(stack, abc.getMultiname(u30()), rn)
    receiver = scopes.topScope().getScopeProperty(rn, true, false)
    stack[stack.length - 1] = (receiver as AXClass).axCoerce(stack[stack.length - 1])
  }
  [Bytecode.COERCE_S] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 1] = this.axCoerceString(stack[stack.length - 1])
  }
  [Bytecode.APPLYTYPE] ({locals, stack, args, app, u30}: IntParam) {
    this.popManyInto(stack, u30(), args)
    stack[stack.length - 1] = app.applyType(stack[stack.length - 1], args as AXClass[])
  }
  [Bytecode.ISTYPELATE] ({stack, receiver}: IntParam) {
    receiver = stack.pop()
    stack[stack.length - 1] = (receiver as AXClass).axIsType(stack[stack.length - 1])
  }
  [Bytecode.ASTYPELATE] ({value, stack, receiver, u30}: IntParam) {
    receiver = stack.pop()
    value = stack.pop()
    if (!(receiver as AXClass).axIsType(value)) {
      value = null
    }
    stack.push(value)
  }
  [Bytecode.NEWCATCH] ({locals, stack, app, u30, methodBody, scopes}: IntParam) {
    stack.push(app.createCatch(methodBody.exception[u30()], scopes.topScope()))
  }
  [Bytecode.NEWOBJECT] ({locals, stack, object, value, app, argCount, u30}: IntParam) {
    object = this.getPublicClass(app, 'Object').axNew() as RefValue
    argCount = u30()
    // For LIFO-order iteration to be correct, we have to add items highest on the stack
    // first.
    for (let i = stack.length - argCount * 2; i < stack.length; i += 2) {
      value = stack[i + 1]
      // object.axSetProperty(this.getPublicMultiname(stack[i]), value, true)
      this.vm.setProperty(object, this.getPublicMultiname(stack[i]), value)
    }
    stack.length -= argCount * 2
    stack.push(object)
  }
  [Bytecode.DEBUGLINE] ({u30}: IntParam) {
    u30()
  }
  [Bytecode.DEBUGFILE] ({u30}: IntParam) {
    u30()
  }
  [Bytecode.DEBUG] ({pc, u30}: IntParam) {
    pc(1)
    u30()
    pc(1)
    u30()
  }
  [Bytecode.PUSHNAN] ({locals, stack, bc, u30}: IntParam) {
    stack.push(Number.NaN)
  }
  [Bytecode.PUSHINT] ({stack, abc, u30}: IntParam) {
    stack.push(abc.getInt(u30()))
  }
  [Bytecode.PUSHUINT] ({stack, abc, u30}: IntParam) {
    stack.push(abc.getUInt(u30()))
  }
  [Bytecode.PUSHNAMESPACE] ({locals, stack, app, abc, u30}: IntParam) {
    let ns = abc.getNamespace(u30())
    let cls = this.getPublicClass(app, 'Namespace')
    stack.push(cls.axNew(ns.uri))
  }
  [Bytecode.IFEQ] ({a, b, offset, stack, pc, s24}: IntParam) {
    b = stack.pop()
    a = stack.pop()
    offset = s24()
    if (this.axEquals(a, b)) {
      pc(offset)
    }
  }
  [Bytecode.EQUALS] ({a, b, stack}: IntParam) {
    a = stack[stack.length - 2]
    b = stack.pop()
    stack[stack.length - 1] = this.axEquals(a, b)
  }
  lookupSwitch (context: Context) {
    const basePC = context.pc - 1
    let offset = context.s24()
    const caseCount = context.u30()
    const index = context.stack.pop()
    if (index <= caseCount) {
      context.pc += 3 * index
      offset = context.s24()
    }
    context.pc = basePC + offset
  }
  [Bytecode.LOOKUPSWITCH] ({context}: IntParam) {
    this.lookupSwitch(context)
  }
  [Bytecode.TYPEOF] ({locals, stack, bc, u30}: IntParam) {
    stack[stack.length - 1] = this.axTypeOf(stack[stack.length - 1])
  }
  [Bytecode.HASNEXT2] ({a, b, result, value, locals, stack, object, index, u30}: IntParam) {
    a = u30() // objectIndex
    b = u30() // indebxIndex
    object = locals[a] as RefValue
    index = locals[b] as number
    result = this.vm.getEnumerableKeys(object)
    value = index < (result as string[]).length
    locals[b] = index + 1
    stack.push(value)
  }
  [Bytecode.NEXTNAME] ({receiver, stack, index}: IntParam) {
    index = stack.pop() as number
    receiver = stack.pop()
    stack.push(this.vm.getEnumerableKeys(receiver)[index - 1])
  }
  [Bytecode.NEXTVALUE] ({receiver, stack, index}: IntParam) {
    index = stack.pop() as number
    receiver = stack.pop()
    index = this.vm.getEnumerableKeys(receiver)[index - 1]
    stack.push(this.vm.getProperty(receiver, this.getPublicMultiname(index)))
  }
  [Bytecode.CHECKFILTER] ({locals, stack, bc, u30}: IntParam) {
    //
  }
  [Bytecode.GETDESCENDANTS] ({app, stack, abc, rn, result, u30}: IntParam) {
    this.popNameInto(stack, abc.getMultiname(u30()), rn)
    if (rn.name === undefined) {
      rn.name = '*'
    }
    result = this.getPublicClass(app, 'Array').axNew()
    // result = axGetDescendants(stack[stack.length - 1], rn)
    stack[stack.length - 1] = result
  }
  [Bytecode.LSHIFT] ({stack}: IntParam) {
    stack[stack.length - 2] <<= stack.pop()
  }
  [Bytecode.RSHIFT] ({stack}: IntParam) {
    stack[stack.length - 2] >>= stack.pop()
  }
  [Bytecode.URSHIFT] ({stack}: IntParam) {
    stack[stack.length - 2] >>>= stack.pop()
  }
  [Bytecode.BITAND] ({stack}: IntParam) {
    stack[stack.length - 2] &= stack.pop()
  }
  [Bytecode.BITXOR] ({stack}: IntParam) {
    stack[stack.length - 2] ^= stack.pop()
  }
  [Bytecode.BITOR] ({stack}: IntParam) {
    stack[stack.length - 2] |= stack.pop()
  }
  [Bytecode.SI8] ({stack, a, domainMemory}: IntParam) {
    a = stack.pop()
    domainMemory.u8view[a as number] = stack.pop()
  }
  [Bytecode.SI16] ({stack, a, value, domainMemory}: IntParam) {
    a = stack.pop()
    value = stack.pop()
    domainMemory.view.setUint16(a as number, value as number, true)
  }
  [Bytecode.SI32] ({stack, a, value, domainMemory}: IntParam) {
    a = stack.pop()
    value = stack.pop()
    domainMemory.view.setInt32(a as number, value as number, true)
  }
  [Bytecode.SF64] ({stack, a, value, domainMemory}: IntParam) {
    a = stack.pop()
    value = stack.pop()
    domainMemory.view.setFloat64(a as number, value as number, true)
  }
  [Bytecode.LI8] ({stack, a, value, domainMemory}: IntParam) {
    stack[stack.length - 1] = domainMemory.u8view[stack[stack.length - 1]]
  }
  [Bytecode.LI16] ({stack, a, value, domainMemory}: IntParam) {
    a = stack.pop()
    value = domainMemory.view.getUint16(a as number, true)
    stack.push(value)
  }
  [Bytecode.LI32] ({stack, a, value, domainMemory}: IntParam) {
    a = stack.pop()
    value = domainMemory.view.getInt32(a as number, true)
    stack.push(value)
  }
  [Bytecode.LF32] ({stack, a, value, domainMemory}: IntParam) {
    a = stack.pop()
    value = domainMemory.view.getFloat32(a as number, true)
    stack.push(value)
  }
  [Bytecode.LF64] ({stack, a, value, domainMemory}: IntParam) {
    a = stack.pop()
    value = domainMemory.view.getFloat64(a as number, true)
    stack.push(value)
  }
  [Bytecode.SXI8] ({stack, value}: IntParam) {
    value = stack.pop() as number
    value = value << 24 >> 24
    stack.push(value)
  }
  [Bytecode.SXI16] ({stack, value}: IntParam) {
    value = stack.pop() as number
    value = value << 16 >> 16
    stack.push(value)
  }
  getPublicMultiname (name: string) {
    return ABC.Multiname.Public(name)
  }
  getPublicClass (app: ApplicationDomain, name: string) {
    return app.getClass(ABC.Multiname.Public(name))
  }
  popNameInto (stack: any[], mn: ABC.Multiname, rn: ABC.Multiname) {
    rn._mangledName = null
    rn.kind = mn.kind
    if (rn.kind === CONSTANT.MTypename) {
      rn.params = mn.params
    }
    if (mn.isRuntimeName()) {
      let name = stack.pop()
      // Unwrap content script-created QName instances.
      if (name && name.axClass) {
        name = name.name
        rn.kind = mn.isAttribute() ? CONSTANT.RTQNameLA : CONSTANT.RTQNameL
        rn.name = name.name
        rn.nsSet = name.nsSet
        return
      }
      rn.name = name
    } else {
      rn.name = mn.name
    }
    if (mn.isRuntimeNamespace()) {
      let ns: ABC.Namespace = stack.pop()
      rn.nsSet = [ns]
    } else {
      rn.nsSet = mn.nsSet
    }
  }
  popManyInto (src: any[], count: number, dst: any[]) {
    popMany(src, count, dst)
  }
  throwWrapper (value: any) {
    // logger.error('Throw')
    // if (AXObject.axClass().axIsType(value)) {
    //   logger.error(value.getAXClass().name)
    // }
    throw new ErrorWrapper(value)
  }
  axEquals (left: any, right: any) {
    return axEquals(left, right)
  }
  axTypeOf (x: any) {
    return axTypeOf(x)
  }
  axCoerceString (x: any) {
    return axCoerceString(x)
  }
  axConvertString (x: any) {
    return axConvertString(x)
  }
  newMultiname () {
    return new Multiname()
  }
  newScopeStack (parentScope: Scope) {
    return new ScopeStack(parentScope)
  }
  newContext (self: any, methodBody: ABC.MethodBodyInfo, savedScope: Scope, callArgs: any[], callee: any) {
    return new Context(self, methodBody, savedScope, callArgs, callee)
  }
  instanceofAXClass (v: any) {
    return v instanceof AXClass
  }
  procCatch (context: Context, e: any) {
    if (e instanceof ErrorWrapper) {
      const methodBody = context.methodBody
      const stack = context.stack
      const scopes = context.scopes
      const sec = context.app.sec
      const pc = context.pc
      const err = e.error
      for (let exception of methodBody.exception) {
        if (pc >= exception.start && pc <= exception.end) {
          const type = context.app.getClass(exception.excType)
          if (!type || type.axIsType(err)) {
            if (type) {
              // logger.error('Catch', type.name)
            } else {
              let display = err
              if (sec.AXObject.axIsType(err)) {
                display = err.axClass.name
              }
              // logger.error('Catch', display)
            }
            stack.length = 0
            stack.push(err)
            scopes.clear()
            context.pc = exception.target
            return false
          }
        }
      }
    } // 其他错误, 以及上层捕获
    this.globalStacks.pop()
    throw e
  }
  interpret (self: any, methodInfo: ABC.MethodInfo, savedScope: Scope, callArgs: any[], callee: any) {
    let app = methodInfo.abc.app
    let sec = app.sec
    let abc = methodInfo.abc
    let methodBody = abc.getMethodBodyByMethod(methodInfo)

    let context = this.newContext(self, methodBody, savedScope, callArgs, callee)
    let locals = context.locals
    let stack = context.stack
    let scopes = context.scopes

    let rn = this.newMultiname()
    let domainMemory = app.domainMemory
    let args: Value[] = []
    let bc: number
    // tslint:disable-next-line
    let value, object, a, b, index, result, argCount, offset, receiver
    let pc = (offset: number) => {
      context.pc += offset
    }
    this.globalStacks.push(context)
    let u30
    let s8
    let s24
    let stop = false
    let returnValue = (x: any) => {
      stop = true
      value = x
    }
    u30 = () => {
      return context.u30()
    }
    s8 = () => {
      return context.s8()
    }
    s24 = () => {
      return context.s24()
    }
    let intParam = {
      locals,
      stack,
      bc,
      value,
      object,
      a,
      b,
      args,
      index,
      receiver,
      result,
      context,
      savedScope,
      scopes,
      rn,
      abc,
      sec,
      app,
      methodInfo,
      methodBody,
      argCount,
      offset,
      domainMemory,
      pc,
      u30,
      s8,
      s24,
      returnValue
    }
    while (!stop) {
      bc = context.bc()
      intParam.bc = bc
      try {
        this.callTable[bc].call(this, intParam)
      } catch (e) {
        this.procCatch(context, e)
      }
    }
    if (stop) {
      return value
    }
  }
  prepare (code: ArrayBuffer) {
    const reader = new BufferReader(code)
    let out: number[][] = []
    for (;!reader.isEOF();) {
      const pc = reader.ptr
      const bc = reader.readU8()
      // logger.error(Bytecode[bc])
      const ps = OpcodeParam[bc]
      out[pc] = [bc]
      if (ps !== undefined) {
        if (ps === 'LOOKUPSWITCH') {
          out[pc].push(reader.ptr)
          const offset = reader.readS24()
          reader.ptr = pc + offset
          continue
        } else if (ps.length > 0) {
          for (let p of ps) {
            if (p === '2') {
              out[pc].push(reader.readS24())
            } else if (p === '3') {
              out[pc].push(reader.readU30())
            } else if (p === '8') {
              out[pc].push(reader.readS8())
            }
          }
        }
      }
      out[pc].push(reader.ptr)
    }
    return out
  }
  getCurrentAPP () {
    if (this.globalStacks.length === 0) {
      return null
    }
    let globalObject = this.globalStacks[this.globalStacks.length - 1].scopes.topScope().global.object as AXGlobalClass
    return globalObject.app
  }
}
class ScopeStack {
  parent: Scope
  stack: any[]
  isWith: boolean[]
  scopes: Scope[]
  constructor (parentScope: Scope = null) {
    this.parent = parentScope
    this.stack = []
    this.isWith = []
    this.scopes = null
  }
  get (index: number) {
    return this.stack[index]
  }
  clear () {
    this.stack.length = 0
    this.isWith.length = 0
  }
  push (val: any, isWith = false) {
    this.stack.push(val)
    this.isWith.push(isWith)
  }
  pop () {
    this.isWith.pop()
    return this.stack.pop()
  }
  topScope () {
    if (!this.scopes) {
      if (this.stack.length === 0) {
        return this.parent
      }
      this.scopes = []
    }
    let parent = this.parent
    for (let i = 0; i < this.stack.length; i++) {
      const object = this.stack[i]
      const isWith = this.isWith[i]
      let scope = this.scopes[i]
      if (!scope || scope.parent !== parent || scope.object !== object || scope.isWith !== isWith) {
        scope = this.scopes[i] = new Scope(parent, object, isWith)
      }
      parent = scope
    }
    return parent
  }
}

interface IHasNext2Info {
  next: () => boolean,
  names: string[]
}
class Context {
  methodBody: ABC.MethodBodyInfo
  methodInfo: ABC.MethodInfo
  codeView: Uint8Array
  stack: any[]
  locals: any[]
  scopes: ScopeStack
  reader: BufferReader
  app: ApplicationDomain
  hasNext2Infos: WeakMap<any, IHasNext2Info>
  constructor (
      receiver: any,
      methodBody: ABC.MethodBodyInfo,
      parentScope: Scope,
      callArgs: any[],
      callee: Function) {
    let methodInfo = methodBody.method
    this.methodBody = methodBody
    this.methodInfo = methodInfo
    this.app = methodInfo.abc.app
    // local
    this.stack = []
    this.locals = [receiver]
    this.scopes = new ScopeStack(parentScope)
    // end local

    this.reader = new BufferReader(methodBody.code)
    this.codeView = new Uint8Array(methodBody.code)

    const optLen = methodInfo.options.length
    const argCount = callArgs.length
    const paramType = methodInfo.paramType
    let arg: any
    for (let i = 0; i < paramType.length; i++) {
      if (i < argCount) {
        arg = callArgs[i]
      } else if (i < optLen) {
        // TO test
        arg = methodInfo.options[i].val
      } else {
        arg = undefined
      }
      let rn = paramType[i]
      if (rn && !rn.isAnyName()) {
        let type = parentScope.getScopeProperty(rn, true, false)
        if (type) {
          if (type instanceof AXClass) {
            arg = type.axCoerce(arg)
          } else {
            arg = type(arg)
          }
          // logger.debug('Coercing argument to type ' + (type instanceof AXClass ? type.name : type))
        }
      }
      this.locals.push(arg)
    }
    if (methodInfo.needsRest()) {
      this.locals.push(callArgs.slice(paramType.length, callArgs.length)) // TODO: wrap ?
    }
  }
  bc () {
    // return this.reader.readU8()
    return this.codeView[this.reader.ptr++]
  }
  u30 () {
    return this.reader.readU30()
  }
  u8 () {
    return this.reader.readU8()
  }
  s8 () {
    return this.reader.readS8()
  }
  s24 () {
    return this.reader.readS24()
  }
  set pc (value: number) {
    this.reader.ptr = value
  }
  get pc () {
    return this.reader.ptr
  }
}
