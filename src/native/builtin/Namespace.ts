import {NativeClass, INativeClass, ApplicationDomain, AXObject, AXNativeClass} from '@/native'
import {Namespace, NamespaceType} from '@/abc'
class NamespaceObj extends Namespace {
  constructor (prefixValue?: string, uriValue?: string) {
    if (uriValue === undefined) {
      uriValue = prefixValue
      prefixValue = '' // TODO: '' or undefined
    }
    super(NamespaceType.Public, uriValue, prefixValue)
  }
  toString () {
    return this.uri
  }
  valueOf () {
    console.error('Namespace.valueOf not impl')
  }
}
@NativeClass('NamespaceClass')
export class NamespaceClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    return new NamespaceObj(...args)
  }
}
