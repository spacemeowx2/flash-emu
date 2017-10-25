import {NativeClass, vm, ApplicationDomain, AXNativeClass} from '@/native'
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
    return this.uri
  }
}
@NativeClass('NamespaceClass')
export class NamespaceClass extends AXNativeClass {
  axConstruct (self: RefValue, prefixValue?: string, uriValue?: string): any {
    return new NamespaceObj(prefixValue, uriValue)
  }
}
