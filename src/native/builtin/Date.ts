import {NativeClass, INativeClass, ApplicationDomain, AXObject, AXNativeClass} from '@/native'
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
export class DateClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    return new DateObj(...args)
  }
}
