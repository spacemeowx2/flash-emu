import {NativeClass, INativeClass, ApplicationDomain, AXObject} from '@/native'
import {EventDispatcherClass} from '../events/EventDispatcher'
@NativeClass('DisplayObjectClass')
export class DisplayObjectClass extends EventDispatcherClass implements INativeClass {
  self: AXObject
  stage = true
  constructor () {
    super()
  }
}
