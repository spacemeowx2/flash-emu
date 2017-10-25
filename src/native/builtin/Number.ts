import {NativeClass, INativeClass, ApplicationDomain, AXObject} from '@/native'
@NativeClass('NumberClass')
export class NumberClass implements INativeClass {
  self: AXObject
  static get_MAX_VALUE () {
    return Number.MAX_VALUE
  }
  static get_MIN_VALUE () {
    return Number.MIN_VALUE
  }
  static get_NaN () {
    return Number.NaN
  }
  static get_NEGATIVE_INFINITY () {
    return Number.NEGATIVE_INFINITY
  }
  static get_POSITIVE_INFINITY () {
    return Number.POSITIVE_INFINITY
  }
}
