import {NativeClass, INativeClass, ApplicationDomain, AXObject} from '@/native'
@NativeClass('Class')
export class ClassClass implements INativeClass {
  self: AXObject
  get_prototype(): any {
    return null
  }
}
