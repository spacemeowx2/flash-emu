import {NativeClass, INativeClass, ApplicationDomain, AXObject, AXNativeClass} from '@/native'
@NativeClass('XMLListClass')
export class XMLListClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    return {}
  }
}
