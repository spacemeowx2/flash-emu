import {NativeClass, INativeClass, ApplicationDomain, AXObject, AXNativeClass} from '@/native'
class NativeObject {

}
@NativeClass('ObjectClass')
export class ObjectClass implements INativeClass {
  constructor (public self: AXNativeClass) {

  }
  axNewNative (self: AXObject, app: ApplicationDomain): any {
    return new NativeObject()
  }
  _onPrototype (prototype: AXObject, self: AXNativeClass) {
    self.prototype.setProperty('toString', function () {
      return '[object Object]'
    })
  }
  ['_init'] () {
    //
  }
}
