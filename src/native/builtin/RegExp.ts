import {NativeClass, ApplicationDomain, AXClass, AXNativeClass} from '@/native'
class RegExpObj extends RegExp {
  constructor (pattern?: string, options?: string) {
    super(pattern, options)
  }
}
@NativeClass('RegExpClass')
export class RegExpClass extends AXNativeClass {
  axConstruct (self: RefValue, ...args: any[]) {
    return new RegExpObj(...args)
  }
}
