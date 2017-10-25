import {NativeClass, AXClass, ApplicationDomain, AXNativeClass} from '@/native'
import {ClassInfo, Multiname} from '@/abc'
import {Scope} from '@/runtime'
import {vm} from '@/value'
@NativeClass('ObjectClass')
export class ObjectClass extends AXNativeClass {
  constructor (app: ApplicationDomain, public name: string, superCls?: AXClass) {
    super(app, name, superCls)
  }
  applyClass (classInfo: ClassInfo, scope: Scope) {
    super.applyClass(classInfo, scope)
    const prototype = this.prototype
    vm.setProperty(prototype, Multiname.Public('toString'), () => {
      return '[object Object]'
    })
    vm.setProperty(prototype, Multiname.Public('hasOwnProperty'), (key: string) => {
      return '[object Object]'
    })
  }
  ['_init'] () {
    //
  }
  axConstruct (self: RefValue) {
    return {}
  }
}
