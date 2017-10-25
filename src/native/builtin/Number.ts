import {NativeClass, AXNativeClass, ApplicationDomain} from '@/native'
@NativeClass('NumberClass')
export class NumberClass extends AXNativeClass {
  get MAX_VALUE () {
    return Number.MAX_VALUE
  }
  get MIN_VALUE () {
    return Number.MIN_VALUE
  }
  get NaN () {
    return Number.NaN
  }
  get NEGATIVE_INFINITY () {
    return Number.NEGATIVE_INFINITY
  }
  get POSITIVE_INFINITY () {
    return Number.POSITIVE_INFINITY
  }
}
