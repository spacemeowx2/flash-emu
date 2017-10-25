import {NativeClass, INativeClass, AXNativeClass, SecurityDomain, ApplicationDomain, AXObject, AXNativeObject, AXClass} from '@/native'
import {Multiname} from '@/abc'
class AXApplicationDomain {
  constructor (public app: ApplicationDomain) {

  }
  get domainMemory () {
    const domainMemory = this.app.domainMemory
    return domainMemory && domainMemory.self
  }
  set domainMemory (v: AXObject) {
    this.app.domainMemory = (v as any).native
  }
}
@NativeClass('ApplicationDomainClass')
export class ApplicationDomainClass implements INativeClass {
  constructor (public self: AXNativeClass) {

  }
  axNewNative (self: AXObject, app: ApplicationDomain): any {
    return new AXApplicationDomain(app)
  }
  get currentDomain () {
    let self = this.self.axNew(this.self.app.sec.flashEmu.interpreter.getCurrentAPP())
    return self
  }
  get MIN_DOMAIN_MEMORY_LENGTH () {
    return 1024
  }
}
