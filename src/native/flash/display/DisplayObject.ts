import {NativeClass, AXNativeClass} from '@/native'
import {EventDispatcher} from '@/native/flash/events/EventDispatcher'
class DisplayObject extends EventDispatcher {

}
@NativeClass('DisplayObjectClass')
export class DisplayObjectClass extends AXNativeClass {
  axNewNative () {
    return new DisplayObject()
  }
  axConstruct (self: RefValue): any {
    //
  }
}
