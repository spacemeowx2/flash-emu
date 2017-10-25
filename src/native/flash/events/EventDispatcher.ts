import {NativeClass, vm, ApplicationDomain, AXNativeClass} from '@/native'
interface IEventDispatcher {
  addEventListener (type: string, listener: Function, useCapture: boolean,
                            priority: number, useWeakReference: boolean): void
  removeEventListener(type: string, listener: Function, useCapture: boolean): void
  hasEventListener(type: string): boolean
  willTrigger(type: string): boolean
  dispatchEvent(event: Event): boolean
}
class EventDispatcher {
  addEventListener (
      type: string, listener: Function, useCapture: boolean,
      priority: number, useWeakReference: boolean) {
    // console.error('addEventListener', type, listener, useCapture, priority, useWeakReference)
    if (type === 'addedToStage') {
      listener.call(this)
    }
  }
  removeEventListener (type: string, listener: Function, useCapture: boolean) {
    // console.error('removeEventListener', type, listener, useCapture)
  }
}
@NativeClass('EventDispatcherClass')
export class EventDispatcherClass extends AXNativeClass {
  axConstruct (self: RefValue, ...args: any[]): any {
    return new EventDispatcher(...args)
  }
}
