import {NativeClass, ApplicationDomain, AXNativeClass} from '@/native'
@NativeClass('XMLListClass')
export class XMLListClass extends AXNativeClass {
  axConstruct (self: any) {
    return self
  }
}
