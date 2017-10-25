import {NativeClass, AXNativeClass, SecurityDomain, ApplicationDomain, AXClass} from '@/native'
import {ByteArray} from '@/native/builtin/ByteArray'
import {Multiname} from '@/abc'
class AXApplicationDomain {
  constructor (public app: ApplicationDomain) {

  }
  get domainMemory () {
    const domainMemory = this.app.domainMemory
    return domainMemory
  }
  set domainMemory (v: ByteArray) {
    this.app.domainMemory = v
  }
}
@NativeClass('ApplicationDomainClass')
export class ApplicationDomainClass extends AXNativeClass {
  get currentDomain () {
    const app = this.app.sec.flashEmu.interpreter.getCurrentAPP()
    return new AXApplicationDomain(app)
  }
  get MIN_DOMAIN_MEMORY_LENGTH () {
    return 1024
  }
}
