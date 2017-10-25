import {AXClass, AXNativeClass} from '@/base'
import {TraitAccessor} from '@/value'
import {ApplicationDomain, SecurityDomain} from '@/runtime'
import {Multiname} from '@/abc'
import {vm} from '@/value'
export * from './decorator'

import './functions'
import './builtin'
import './flash'
interface IDynamicNative<T> {
  shouldHandle (k: any): boolean
  set (self: T, key: any, value: Value): void
  get (self: T, key: any): Value
  has (self: T, key: any): boolean
  delete (self: T, key: any): boolean
  keys? (self: T): string[]
}
class NativeAccessor<T> extends TraitAccessor {
  constructor (private handler: IDynamicNative<T>) {
    super(vm)
  }
  get (self: RefValue, mn: Multiname, that: RefValue = self): Value {
    if (mn.nsSet[0].isPublic && this.handler.shouldHandle(mn.name)) {
      return this.handler.get(self as any, mn.name)
    }
    return super.get(self, mn, that)
  }
  set (self: RefValue, mn: Multiname, val: Value, that: RefValue = self): void {
    if (mn.nsSet[0].isPublic && this.handler.shouldHandle(mn.name)) {
      return this.handler.set(self as any, mn.name, val)
    }
    return super.set(self, mn, val, that)
  }
  has (self: RefValue, mn: Multiname): boolean {
    if (mn.nsSet[0].isPublic && this.handler.shouldHandle(mn.name)) {
      return this.handler.has(self as any, mn.name)
    }
    return super.has(self, mn)
  }
  delete (self: RefValue, mn: Multiname) {
    if (mn.nsSet[0].isPublic && this.handler.shouldHandle(mn.name)) {
      return this.handler.delete(self as any, mn.name)
    }
    return super.delete(self, mn)
  }
  keys (self: RefValue) {
    if (this.handler.keys) {
      return this.handler.keys(self as any)
    }
    return super.keys(self)
  }
}
export {
  vm,
  AXClass,
  AXNativeClass,
  Multiname,
  SecurityDomain,
  ApplicationDomain,
  TraitAccessor,
  NativeAccessor,
  IDynamicNative
}
