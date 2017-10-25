import {NativeClass, INativeClass, ApplicationDomain, AXObject, AXNativeClass} from '@/native'
class StringObj {
  constructor (public str: string) {

  }
  replace (pattern: any, repl: any) {
    if (pattern && pattern.native) {
      pattern = pattern.native
    }
    if (repl && repl.native) {
      repl = repl.native
    }
    return this.str.replace(pattern, repl)
  }
  split (s: any) {
    if (s && s.native) {
      s = s.native
    }
    return this.str.split(s)
  }
  substr (from: number = 0, length?: number) {
    return this.str.substr(from, length)
  }
  get length () {
    return this.str.length
  }
  set length (v: number) {
    return
  }
}
@NativeClass('StringClass')
export class StringClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, str: string): any {
    return new StringObj(str)
  }
  axCoerce (v: any, self: AXNativeClass) {
    if (v && v.native) {
      return v.native.toString()
    }
    return v
  }
  axBox (v: any, self: AXNativeClass) {
    return self.axNew(v)
  }
}
