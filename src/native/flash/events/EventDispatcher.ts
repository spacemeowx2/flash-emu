import {NativeClass, INativeClass, ApplicationDomain, AXObject, AXNativeClass} from '@/native'
interface IEventDispatcher {
  addEventListener (type: string, listener: Function, useCapture: boolean,
                            priority: number, useWeakReference: boolean): void
  removeEventListener(type: string, listener: Function, useCapture: boolean): void
  hasEventListener(type: string): boolean
  willTrigger(type: string): boolean
  dispatchEvent(event: Event): boolean
}
class EventDispatcher {
  self: AXObject
  addEventListener (
      type: string, listener: Function, useCapture: boolean,
      priority: number, useWeakReference: boolean) {
    // console.error('addEventListener', type, listener, useCapture, priority, useWeakReference)
    if (type === 'addedToStage') {
      listener.call(this.self)
    }
  }
  removeEventListener (type: string, listener: Function, useCapture: boolean) {
    // console.error('removeEventListener', type, listener, useCapture)
  }
}
@NativeClass('EventDispatcherClass')
export class EventDispatcherClass implements INativeClass {
  constructor (public self: AXNativeClass) {
  }
  axNewNative (self: AXObject, ...args: any[]): any {
    let ret = new EventDispatcher(...args)
    ret.self = self
    return ret
  }
}
