import {NativeClass, ApplicationDomain} from '@/native'
import {EventDispatcherClass} from '../events/EventDispatcher'
@NativeClass()
export class DisplayObjectClass extends EventDispatcherClass implements INativeClass {
  self: AXObject
}
