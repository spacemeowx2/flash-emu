declare let DEBUG: boolean
declare type Value = RefValue | Primitive
declare type RefValue = object
declare type Primitive =
  | boolean
  | number
  | string
  | symbol
  | null
  | undefined