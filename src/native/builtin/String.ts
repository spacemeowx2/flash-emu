import {NativeClass, ApplicationDomain, AXNativeClass} from '@/native'
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
export class StringClass extends AXNativeClass {
  axConstruct (self: RefValue, str: string): any {
    return new StringObj(str)
  }
  axCoerce (v: any) {
    if (v) {
      return v.toString()
    }
    return v
  }
  axBox (v: any) {
    return this.axNew(v)
  }
}
