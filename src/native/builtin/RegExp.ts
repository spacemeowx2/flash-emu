import {NativeClass, INativeClass, ApplicationDomain, AXObject, AXClass, AXNativeClass} from '@/native'
class RegExpObj extends RegExp {
  constructor (pattern?: string, options?: string) {
    super(pattern, options)
  }
}
@NativeClass('RegExpClass')
export class RegExpClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    return new RegExpObj(...args)
  }
}
