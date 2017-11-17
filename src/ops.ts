/* tslint:disable */
export enum Bytecode {
  UNKNOWN            = 0x00,
  BKPT               = 0x01,
  NOP                = 0x02,
  THROW              = 0x03,
  GETSUPER           = 0x04,
  SETSUPER           = 0x05,
  DXNS               = 0x06,
  DXNSLATE           = 0x07,
  KILL               = 0x08,
  LABEL              = 0x09,
  LF32X4             = 0x0A,
  SF32X4             = 0x0B,
  IFNLT              = 0x0C,
  IFNLE              = 0x0D,
  IFNGT              = 0x0E,
  IFNGE              = 0x0F,
  JUMP               = 0x10,
  IFTRUE             = 0x11,
  IFFALSE            = 0x12,
  IFEQ               = 0x13,
  IFNE               = 0x14,
  IFLT               = 0x15,
  IFLE               = 0x16,
  IFGT               = 0x17,
  IFGE               = 0x18,
  IFSTRICTEQ         = 0x19,
  IFSTRICTNE         = 0x1A,
  LOOKUPSWITCH       = 0x1B,
  PUSHWITH           = 0x1C,
  POPSCOPE           = 0x1D,
  NEXTNAME           = 0x1E,
  HASNEXT            = 0x1F,
  PUSHNULL           = 0x20,
  PUSHUNDEFINED      = 0x21,
  PUSHFLOAT          = 0x22,
  NEXTVALUE          = 0x23,
  PUSHBYTE           = 0x24,
  PUSHSHORT          = 0x25,
  PUSHTRUE           = 0x26,
  PUSHFALSE          = 0x27,
  PUSHNAN            = 0x28,
  POP                = 0x29,
  DUP                = 0x2A,
  SWAP               = 0x2B,
  PUSHSTRING         = 0x2C,
  PUSHINT            = 0x2D,
  PUSHUINT           = 0x2E,
  PUSHDOUBLE         = 0x2F,
  PUSHSCOPE          = 0x30,
  PUSHNAMESPACE      = 0x31,
  HASNEXT2           = 0x32,
  LI8                = 0x35,
  LI16               = 0x36,
  LI32               = 0x37,
  LF32               = 0x38,
  LF64               = 0x39,
  SI8                = 0x3A,
  SI16               = 0x3B,
  SI32               = 0x3C,
  SF32               = 0x3D,
  SF64               = 0x3E,
  NEWFUNCTION        = 0x40,
  CALL               = 0x41,
  CONSTRUCT          = 0x42,
  CALLMETHOD         = 0x43,
  CALLSTATIC         = 0x44,
  CALLSUPER          = 0x45,
  CALLPROPERTY       = 0x46,
  RETURNVOID         = 0x47,
  RETURNVALUE        = 0x48,
  CONSTRUCTSUPER     = 0x49,
  CONSTRUCTPROP      = 0x4A,
  CALLSUPERID        = 0x4B,
  CALLPROPLEX        = 0x4C,
  CALLINTERFACE      = 0x4D,
  CALLSUPERVOID      = 0x4E,
  CALLPROPVOID       = 0x4F,
  SXI1               = 0x50,
  SXI8               = 0x51,
  SXI16              = 0x52,
  APPLYTYPE          = 0x53,
  PUSHFLOAT4         = 0x54,
  NEWOBJECT          = 0x55,
  NEWARRAY           = 0x56,
  NEWACTIVATION      = 0x57,
  NEWCLASS           = 0x58,
  GETDESCENDANTS     = 0x59,
  NEWCATCH           = 0x5A,
  FINDPROPSTRICT     = 0x5D,
  FINDPROPERTY       = 0x5E,
  FINDDEF            = 0x5F,
  GETLEX             = 0x60,
  SETPROPERTY        = 0x61,
  GETLOCAL           = 0x62,
  SETLOCAL           = 0x63,
  GETGLOBALSCOPE     = 0x64,
  GETSCOPEOBJECT     = 0x65,
  GETPROPERTY        = 0x66,
  GETOUTERSCOPE      = 0x67,
  INITPROPERTY       = 0x68,
  UNUSED_69          = 0x69,
  DELETEPROPERTY     = 0x6A,
  UNUSED_6B          = 0x6B,
  GETSLOT            = 0x6C,
  SETSLOT            = 0x6D,
  GETGLOBALSLOT      = 0x6E,
  SETGLOBALSLOT      = 0x6F,
  CONVERT_S          = 0x70,
  ESC_XELEM          = 0x71,
  ESC_XATTR          = 0x72,
  CONVERT_I          = 0x73,
  CONVERT_U          = 0x74,
  CONVERT_D          = 0x75,
  CONVERT_B          = 0x76,
  CONVERT_O          = 0x77,
  CHECKFILTER        = 0x78,
  CONVERT_F          = 0x79,
  UNPLUS             = 0x7a,
  CONVERT_F4         = 0x7b,
  BC_7C              = 0x7c,
  BC_7D              = 0x7d,
  BC_7E              = 0x7e,
  BC_7F              = 0x7f,
  COERCE             = 0x80,
  COERCE_B           = 0x81,
  COERCE_A           = 0x82,
  COERCE_I           = 0x83,
  COERCE_D           = 0x84,
  COERCE_S           = 0x85,
  ASTYPE             = 0x86,
  ASTYPELATE         = 0x87,
  COERCE_U           = 0x88,
  COERCE_O           = 0x89,
  NEGATE             = 0x90,
  INCREMENT          = 0x91,
  INCLOCAL           = 0x92,
  DECREMENT          = 0x93,
  DECLOCAL           = 0x94,
  TYPEOF             = 0x95,
  NOT                = 0x96,
  BITNOT             = 0x97,
  UNUSED_98          = 0x98,
  UNUSED_99          = 0x99,
  UNUSED_9A          = 0x9A,
  UNUSED_9B          = 0x9B,
  UNUSED_9C          = 0x9C,
  UNUSED_9D          = 0x9D,
  UNUSED_9E          = 0x9E,
  UNUSED_9F          = 0x9F,
  ADD                = 0xA0,
  SUBTRACT           = 0xA1,
  MULTIPLY           = 0xA2,
  DIVIDE             = 0xA3,
  MODULO             = 0xA4,
  LSHIFT             = 0xA5,
  RSHIFT             = 0xA6,
  URSHIFT            = 0xA7,
  BITAND             = 0xA8,
  BITOR              = 0xA9,
  BITXOR             = 0xAA,
  EQUALS             = 0xAB,
  STRICTEQUALS       = 0xAC,
  LESSTHAN           = 0xAD,
  LESSEQUALS         = 0xAE,
  GREATERTHAN        = 0xAF,
  GREATEREQUALS      = 0xB0,
  INSTANCEOF         = 0xB1,
  ISTYPE             = 0xB2,
  ISTYPELATE         = 0xB3,
  IN                 = 0xB4,
  UNUSED_B5          = 0xB5,
  UNUSED_B6          = 0xB6,
  UNUSED_B7          = 0xB7,
  UNUSED_B8          = 0xB8,
  UNUSED_B9          = 0xB9,
  UNUSED_BA          = 0xBA,
  UNUSED_BB          = 0xBB,
  UNUSED_BC          = 0xBC,
  UNUSED_BD          = 0xBD,
  UNUSED_BE          = 0xBE,
  UNUSED_BF          = 0xBF,
  INCREMENT_I        = 0xC0,
  DECREMENT_I        = 0xC1,
  INCLOCAL_I         = 0xC2,
  DECLOCAL_I         = 0xC3,
  NEGATE_I           = 0xC4,
  ADD_I              = 0xC5,
  SUBTRACT_I         = 0xC6,
  MULTIPLY_I         = 0xC7,
  UNUSED_C8          = 0xC8,
  UNUSED_C9          = 0xC9,
  UNUSED_CA          = 0xCA,
  UNUSED_CB          = 0xCB,
  UNUSED_CC          = 0xCC,
  UNUSED_CD          = 0xCD,
  UNUSED_CE          = 0xCE,
  UNUSED_CF          = 0xCF,
  GETLOCAL0          = 0xD0,
  GETLOCAL1          = 0xD1,
  GETLOCAL2          = 0xD2,
  GETLOCAL3          = 0xD3,
  SETLOCAL0          = 0xD4,
  SETLOCAL1          = 0xD5,
  SETLOCAL2          = 0xD6,
  SETLOCAL3          = 0xD7,
  UNUSED_D8          = 0xD8,
  UNUSED_D9          = 0xD9,
  UNUSED_DA          = 0xDA,
  UNUSED_DB          = 0xDB,
  UNUSED_DC          = 0xDC,
  UNUSED_DD          = 0xDD,
  UNUSED_DE          = 0xDE,
  UNUSED_DF          = 0xDF,
  UNUSED_E0          = 0xE0,
  UNUSED_E1          = 0xE1,
  UNUSED_E2          = 0xE2,
  UNUSED_E3          = 0xE3,
  UNUSED_E4          = 0xE4,
  UNUSED_E5          = 0xE5,
  UNUSED_E6          = 0xE6,
  UNUSED_E7          = 0xE7,
  UNUSED_E8          = 0xE8,
  UNUSED_E9          = 0xE9,
  UNUSED_EA          = 0xEA,
  UNUSED_EB          = 0xEB,
  UNUSED_EC          = 0xEC,
  UNUSED_ED          = 0xED,
  UNUSED_EE          = 0xEE,
  INVALID            = 0xED,
  DEBUG              = 0xEF,

  DEBUGLINE          = 0xF0,
  DEBUGFILE          = 0xF1,
  BKPTLINE           = 0xF2,
  TIMESTAMP          = 0xF3,

  RESTARGC           = 0xF4,
  RESTARG            = 0xF5,

  UNUSED_F6          = 0xF6,
  UNUSED_F7          = 0xF7,
  UNUSED_F8          = 0xF8,
  UNUSED_F9          = 0xF9,
  UNUSED_FA          = 0xFA,
  UNUSED_FB          = 0xFB,
  UNUSED_FC          = 0xFC,
  UNUSED_FD          = 0xFD,
  UNUSED_FE          = 0xFE,

  END                = 0xFF
}
/* tslint:enable */
const bytecodeNames = ['', 'BKPT', 'NOP', 'THROW', 'GETSUPER', 'SETSUPER', 'DXNS', 'DXNSLATE', 'KILL', 'LABEL', 'LF32X4', 'SF32X4', 'IFNLT', 'IFNLE', 'IFNGT', 'IFNGE', 'JUMP', 'IFTRUE', 'IFFALSE', 'IFEQ', 'IFNE', 'IFLT', 'IFLE', 'IFGT', 'IFGE', 'IFSTRICTEQ', 'IFSTRICTNE', 'LOOKUPSWITCH', 'PUSHWITH', 'POPSCOPE', 'NEXTNAME', 'HASNEXT', 'PUSHNULL', 'PUSHUNDEFINED', 'PUSHFLOAT', 'NEXTVALUE', 'PUSHBYTE', 'PUSHSHORT', 'PUSHTRUE', 'PUSHFALSE', 'PUSHNAN', 'POP', 'DUP', 'SWAP', 'PUSHSTRING', 'PUSHINT', 'PUSHUINT', 'PUSHDOUBLE', 'PUSHSCOPE', 'PUSHNAMESPACE', 'HASNEXT2', '', '', 'LI8', 'LI16', 'LI32', 'LF32', 'LF64', 'SI8', 'SI16', 'SI32', 'SF32', 'SF64', '', 'NEWFUNCTION', 'CALL', 'CONSTRUCT', 'CALLMETHOD', 'CALLSTATIC', 'CALLSUPER', 'CALLPROPERTY', 'RETURNVOID', 'RETURNVALUE', 'CONSTRUCTSUPER', 'CONSTRUCTPROP', 'CALLSUPERID', 'CALLPROPLEX', 'CALLINTERFACE', 'CALLSUPERVOID', 'CALLPROPVOID', 'SXI1', 'SXI8', 'SXI16', 'APPLYTYPE', 'PUSHFLOAT4', 'NEWOBJECT', 'NEWARRAY', 'NEWACTIVATION', 'NEWCLASS', 'GETDESCENDANTS', 'NEWCATCH', '', '', 'FINDPROPSTRICT', 'FINDPROPERTY', 'FINDDEF', 'GETLEX', 'SETPROPERTY', 'GETLOCAL', 'SETLOCAL', 'GETGLOBALSCOPE', 'GETSCOPEOBJECT', 'GETPROPERTY', 'GETOUTERSCOPE', 'INITPROPERTY', 'UNUSED_69', 'DELETEPROPERTY', 'UNUSED_6B', 'GETSLOT', 'SETSLOT', 'GETGLOBALSLOT', 'SETGLOBALSLOT', 'CONVERT_S', 'ESC_XELEM', 'ESC_XATTR', 'CONVERT_I', 'CONVERT_U', 'CONVERT_D', 'CONVERT_B', 'CONVERT_O', 'CHECKFILTER', 'CONVERT_F', 'UNPLUS', 'CONVERT_F4', 'BC_7C', 'BC_7D', 'BC_7E', 'BC_7F', 'COERCE', 'COERCE_B', 'COERCE_A', 'COERCE_I', 'COERCE_D', 'COERCE_S', 'ASTYPE', 'ASTYPELATE', 'COERCE_U', 'COERCE_O', '', '', '', '', '', '', 'NEGATE', 'INCREMENT', 'INCLOCAL', 'DECREMENT', 'DECLOCAL', 'TYPEOF', 'NOT', 'BITNOT', 'UNUSED_98', 'UNUSED_99', 'UNUSED_9A', 'UNUSED_9B', 'UNUSED_9C', 'UNUSED_9D', 'UNUSED_9E', 'UNUSED_9F', 'ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE', 'MODULO', 'LSHIFT', 'RSHIFT', 'URSHIFT', 'BITAND', 'BITOR', 'BITXOR', 'EQUALS', 'STRICTEQUALS', 'LESSTHAN', 'LESSEQUALS', 'GREATERTHAN', 'GREATEREQUALS', 'INSTANCEOF', 'ISTYPE', 'ISTYPELATE', 'IN', 'UNUSED_B5', 'UNUSED_B6', 'UNUSED_B7', 'UNUSED_B8', 'UNUSED_B9', 'UNUSED_BA', 'UNUSED_BB', 'UNUSED_BC', 'UNUSED_BD', 'UNUSED_BE', 'UNUSED_BF', 'INCREMENT_I', 'DECREMENT_I', 'INCLOCAL_I', 'DECLOCAL_I', 'NEGATE_I', 'ADD_I', 'SUBTRACT_I', 'MULTIPLY_I', 'UNUSED_C8', 'UNUSED_C9', 'UNUSED_CA', 'UNUSED_CB', 'UNUSED_CC', 'UNUSED_CD', 'UNUSED_CE', 'UNUSED_CF', 'GETLOCAL0', 'GETLOCAL1', 'GETLOCAL2', 'GETLOCAL3', 'SETLOCAL0', 'SETLOCAL1', 'SETLOCAL2', 'SETLOCAL3', 'UNUSED_D8', 'UNUSED_D9', 'UNUSED_DA', 'UNUSED_DB', 'UNUSED_DC', 'UNUSED_DD', 'UNUSED_DE', 'UNUSED_DF', 'UNUSED_E0', 'UNUSED_E1', 'UNUSED_E2', 'UNUSED_E3', 'UNUSED_E4', 'UNUSED_E5', 'UNUSED_E6', 'UNUSED_E7', 'UNUSED_E8', 'UNUSED_E9', 'UNUSED_EA', 'UNUSED_EB', 'UNUSED_EC', 'INVALID', 'UNUSED_EE', 'DEBUG', 'DEBUGLINE', 'DEBUGFILE', 'BKPTLINE', 'TIMESTAMP', 'RESTARGC', 'RESTARG', 'UNUSED_F6', 'UNUSED_F7', 'UNUSED_F8', 'UNUSED_F9', 'UNUSED_FA', 'UNUSED_FB', 'UNUSED_FC', 'UNUSED_FD', 'UNUSED_FE', 'END']
export function getBytecodeName (bytecode: number) {
  return bytecodeNames[bytecode]
}
export const OpcodeParam = {
  [Bytecode.KILL]: '3',
  [Bytecode.IFNLT]: '2',
  [Bytecode.IFNGT]: '2',
  [Bytecode.IFNGE]: '2',
  [Bytecode.JUMP]: '2',
  [Bytecode.IFTRUE]: '2',
  [Bytecode.IFFALSE]: '2',
  [Bytecode.IFEQ]: '2',
  [Bytecode.IFNE]: '2',
  [Bytecode.IFLT]: '2',
  [Bytecode.IFLE]: '2',
  [Bytecode.IFGT]: '2',
  [Bytecode.IFGE]: '2',
  [Bytecode.IFSTRICTNE]: '2',
  [Bytecode.LOOKUPSWITCH]: 'LOOKUPSWITCH',
  [Bytecode.PUSHBYTE]: '8',
  [Bytecode.PUSHSHORT]: '3',
  [Bytecode.PUSHSTRING]: '3',
  [Bytecode.PUSHINT]: '3',
  [Bytecode.PUSHUINT]: '3',
  [Bytecode.PUSHNAMESPACE]: '3',
  [Bytecode.HASNEXT2]: '33',
  [Bytecode.NEWFUNCTION]: '3',
  [Bytecode.CALL]: '3',
  [Bytecode.CONSTRUCT]: '3',
  [Bytecode.CONSTRUCTSUPER]: '3',
  [Bytecode.CONSTRUCTPROP]: '33',
  [Bytecode.CALLSUPER]: '33',
  [Bytecode.CALLSUPERVOID]: '33',
  [Bytecode.CALLPROPLEX]: '33',
  [Bytecode.CALLPROPERTY]: '33',
  [Bytecode.CALLPROPVOID]: '33',
  [Bytecode.APPLYTYPE]: '3',
  [Bytecode.NEWOBJECT]: '3',
  [Bytecode.NEWARRAY]: '3',
  [Bytecode.NEWCLASS]: '3',
  [Bytecode.GETDESCENDANTS]: '3',
  [Bytecode.NEWCATCH]: '3',
  [Bytecode.FINDPROPERTY]: '3',
  [Bytecode.FINDPROPSTRICT]: '3',
  [Bytecode.FINDDEF]: '3',
  [Bytecode.GETLEX]: '3',
  [Bytecode.INITPROPERTY]: '3',
  [Bytecode.SETPROPERTY]: '3',
  [Bytecode.GETLOCAL]: '3',
  [Bytecode.SETLOCAL]: '3',
  [Bytecode.GETSCOPEOBJECT]: '3',
  [Bytecode.GETPROPERTY]: '3',
  [Bytecode.DELETEPROPERTY]: '3',
  [Bytecode.GETSLOT]: '3',
  [Bytecode.SETSLOT]: '3',
  [Bytecode.COERCE]: '3',
  [Bytecode.INCLOCAL_I]: '3',
  [Bytecode.DECLOCAL_I]: '3',
  [Bytecode.DEBUG]: '33',
  [Bytecode.DEBUGLINE]: '3',
  [Bytecode.DEBUGFILE]: '3'
}
