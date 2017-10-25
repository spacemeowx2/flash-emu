/* tslint:disable */
export const QName                = 0x7
export const QNameA               = 0x0D
export const RTQName              = 0x0F
export const RTQNameA             = 0x10
export const RTQNameL             = 0x11
export const RTQNameLA            = 0x12
export const Multiname            = 0x09
export const MultinameA           = 0x0E
export const MultinameL           = 0x1B
export const MultinameLA          = 0x1C
export const MTypename            = 0x1D

export const enum MethodFlags {
  NEED_ARGUMENTS       = 0x01,    /* Suggests to the run-time that an “arguments” object (as specified by the ActionScript 3.0 Language Reference) be created. Must not be used together with NEED_REST. See Chapter 3. */
  NEED_ACTIVATION      = 0x02,    /* Must be set if this method uses the newactivation opcode. */
  NEED_REST            = 0x04,    /* This flag creates an ActionScript 3.0 rest arguments array. Must not be used with NEED_ARGUMENTS. See Chapter 3. */
  HAS_OPTIONAL         = 0x08,    /* Must be set if this method has optional parameters and the options field is present in this method_info structure. */
  Native               = 0x20,
  SET_DXNS             = 0x40,    /* Must be set if this method uses the dxns or dxnslate opcodes. */
  HAS_PARAM_NAMES      = 0x80     /* Must be set when the param_names field is present in this method_info structure.  */
}

export const enum ConstantKind {
  Int                  = 0x03,    /* integer */
  UInt                 = 0x04,    /* uinteger */
  Double               = 0x06,    /* double */
  Utf8                 = 0x01,    /* string */
  True                 = 0x0B,
  False                = 0x0A,
  Null                 = 0x0C,
  Undefined            = 0x00,
  Namespace            = 0x08,    /* namespace */
  PackageNamespace     = 0x16,    /* namespace */
  PackageInternalNs    = 0x17,    /* Namespace */
  ProtectedNamespace   = 0x18,    /* Namespace */
  ExplicitNamespace    = 0x19,    /* Namespace */
  StaticProtectedNs    = 0x1A,    /* Namespace */
  PrivateNs            = 0x05     /* namespace */
}

export const Namespace            = 0x08    /* namespace */
export const PackageNamespace     = 0x16    /* namespace */
export const PackageInternalNs    = 0x17    /* Namespace */
export const ProtectedNamespace   = 0x18    /* Namespace */
export const ExplicitNamespace    = 0x19    /* Namespace */
export const StaticProtectedNs    = 0x1A    /* Namespace */
export const PrivateNs            = 0x05    /* namespace */

export const NamespaceKinds = [
  Namespace         ,
  PackageNamespace  ,
  PackageInternalNs ,
  ProtectedNamespace,
  ExplicitNamespace ,
  StaticProtectedNs ,
  PrivateNs         ,
]

export const enum NamespaceType {
  Public          = 0,
  Protected       = 1,
  PackageInternal = 2,
  Private         = 3,
  Explicit        = 4,
  StaticProtected = 5
}

export const enum TRAIT {
  Slot               = 0,
  Method             = 1,
  Getter             = 2,
  Setter             = 3,
  Class              = 4,
  Function           = 5,
  Const              = 6,
  GetterSetter       = 7 // This is a runtime addition, not a valid ABC Trait type.
}

export const enum ATTR {
  Final           = 0x1,     /* Is used with Trait_Method, Trait_Getter and Trait_Setter. It marks a method that cannot be overridden by a sub-class */
  Override        = 0x2,     /* Is used with Trait_Method, Trait_Getter and Trait_Setter. It marks amethod that has been overridden in this class */
  Metadata        = 0x4      /* Is used to signal that the fields metadata_count and metadata follow the data field in the traits_info entry */
}
export const enum InstanceFlags {
  ClassSealed          = 0x01,    /* The class is sealed: properties can not be dynamically added to instances of the class. */
  ClassFinal           = 0x02,    /* The class is final: it cannot be a base class for any other class. */
  ClassInterface       = 0x04,    /* The class is an interface. */
  ClassProtectedNs     = 0x08     /* The class uses its protected namespace and the protectedNs field is present in the interface_info structure.  */
}
/* tslint:enable */
