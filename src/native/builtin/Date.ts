import {NativeClass, ApplicationDomain, AXNativeClass} from '@/native'
class DateObj extends Date {
  toString () {
    return super.toString()
  }
  get time () {
    return this.getTime()
  }
  set time (v: number) {
    this.setTime(v)
  }
}
@NativeClass('DateClass')
export class DateClass extends AXNativeClass {
  axConstruct (self: RefValue, ...args: any[]): any {
    return new DateObj(...args)
  }
}
