constants----------------------------------------------------
      ConstantUtf8Info trace -> 1
      ConstantUtf8Info  -> 2
      ConstantNamespace 2 -> 1
      ConstantUtf8Info algo.as$0 -> 3
      ConstantPrivateNamespace 3 -> 2
      ConstantNamespaceSet 2 { 1 2 } -> 1
      ConstantMultiname 1 1 -> 1
      ConstantUtf8Info trace
      ConstantUtf8Info 
      ConstantNamespace 2
      ConstantUtf8Info algo.as$0
      ConstantPrivateNamespace 3
      ConstantNamespaceSet 2 { 1 2 }
      ConstantMultiname 1 1
      ConstantUtf8Info trace
      ConstantUtf8Info 
      ConstantNamespace 2
      ConstantUtf8Info algo.as$0
      ConstantPrivateNamespace 3
      ConstantNamespaceSet 2 { 1 2 }
      ConstantMultiname 1 1
      ConstantUtf8Info done -> 4
      ConstantUtf8Info trace
      ConstantUtf8Info 
      ConstantNamespace 2
      ConstantUtf8Info algo.as$0
      ConstantPrivateNamespace 3
      ConstantNamespaceSet 2 { 1 2 }
      ConstantMultiname 1 1
      ConstantUtf8Info 
      ConstantUtf8Info 
      ConstantUtf8Info algo.as$0
      ConstantPrivateNamespace 3
      ConstantUtf8Info main -> 5
      ConstantQualifiedName 5 2 -> 2
definitions--------------------------------------------------
      MethodInfo  param_count=0 return_type=0 param_types={ } debug_name_index=2 needs_arguments=false need_rest=false needs_activation=false has_optional=false ignore_rest=false native=false has_param_names =false -> 0
      MethodBody max_stack=4 max_locals=6 scope_depth=1 max_scope=1 code_length=126 traits_count=0 -> 0
      MethodInfo  param_count=0 return_type=0 param_types={ } debug_name_index=2 needs_arguments=false need_rest=false needs_activation=false has_optional=false ignore_rest=false native=false has_param_names =false -> 1
      MethodBody max_stack=2 max_locals=1 scope_depth=1 max_scope=2 code_length=9 traits_count=0 -> 1
      *Trait name_index=2 tag=var slot_id=1 type_index=0 value=0 value_kind=0
      ScriptInfo init_index=1 traits_count=1 -> 0
code---------------------------------------------------------
// ++StartProgram 
// ++StartMethod main$0
PushUndefined
      0:Pushundefined [1]
CheckType *
      1:Coerce.o [1]
StoreRegister 1, *
      2:Setlocal1 [0]
PushUndefined
      3:Pushundefined [1]
CheckType *
      4:Coerce.o [1]
StoreRegister 2, *
      5:Setlocal2 [0]
PushUndefined
      6:Pushundefined [1]
CheckType *
      7:Coerce.o [1]
StoreRegister 3, *
      8:Setlocal3 [0]
PushNumber 100, int
      9:Pushbyte 100 [1]
CheckType *
      11:Coerce.o [1]
StoreRegister 4, *
      12:Setlocal 4 [0]
LoopBegin
      14:Jump
      18:Label [0]
LoadRegister 4, *
      19:Getlocal 4 [1]
PushNumber 10, int
      21:Pushbyte 10 [2]
InvokeBinary ModulusOp
      23:Modulo [1]
Dup
      24:Dup [2]
AllocTemp 5
StoreRegister 5, *
      25:Setlocal 5 [1]
CheckType *
      27:Coerce.o [1]
StoreRegister 1, *
      28:Setlocal1 [0]
LoadRegister 5, *
      29:Getlocal 5 [1]
FreeTemp 5
      31:Kill 5
Pop
      33:Pop [0]
LoadRegister 4, *
      34:Getlocal 4 [1]
PushNumber 10, int
      36:Pushbyte 10 [2]
InvokeBinary DivideOp
      38:Divide [1]
PushNumber 10, int
      39:Pushbyte 10 [2]
InvokeBinary ModulusOp
      41:Modulo [1]
InvokeUnary LogicalNotOp 0
      42:Not [1]
InvokeUnary LogicalNotOp_B 0
      43:Not [1]
Dup
      44:Dup [2]
AllocTemp 5
StoreRegister 5, *
      45:Setlocal 5 [1]
CheckType *
      47:Coerce.o [1]
StoreRegister 2, *
      48:Setlocal2 [0]
LoadRegister 5, *
      49:Getlocal 5 [1]
FreeTemp 5
      51:Kill 5
Pop
      53:Pop [0]
LoadRegister 4, *
      54:Getlocal 4 [1]
PushNumber 100, int
      56:Pushbyte 100 [2]
InvokeBinary DivideOp
      58:Divide [1]
InvokeUnary LogicalNotOp 0
      59:Not [1]
InvokeUnary LogicalNotOp_B 0
      60:Not [1]
Dup
      61:Dup [2]
AllocTemp 5
StoreRegister 5, *
      62:Setlocal 5 [1]
CheckType *
      64:Coerce.o [1]
StoreRegister 3, *
      65:Setlocal3 [0]
LoadRegister 5, *
      66:Getlocal 5 [1]
FreeTemp 5
      68:Kill 5
Pop
      70:Pop [0]
LoadRegister 4, *
      71:Getlocal 4 [1]
LoadRegister 1, *
      73:Getlocal1 [2]
LoadRegister 1, *
      74:Getlocal1 [3]
InvokeBinary MultiplyOp
      75:Multiply [2]
LoadRegister 1, *
      76:Getlocal1 [3]
InvokeBinary MultiplyOp
      77:Multiply [2]
LoadRegister 2, *
      78:Getlocal2 [3]
LoadRegister 2, *
      79:Getlocal2 [4]
InvokeBinary MultiplyOp
      80:Multiply [3]
LoadRegister 2, *
      81:Getlocal2 [4]
InvokeBinary MultiplyOp
      82:Multiply [3]
InvokeBinary BinaryPlusOp
      83:Add [2]
LoadRegister 3, *
      84:Getlocal3 [3]
LoadRegister 3, *
      85:Getlocal3 [4]
InvokeBinary MultiplyOp
      86:Multiply [3]
LoadRegister 3, *
      87:Getlocal3 [4]
InvokeBinary MultiplyOp
      88:Multiply [3]
InvokeBinary BinaryPlusOp
      89:Add [2]
If strictne
      90:Ifstrictne [0]
FindProperty trace 2 { algo.as$0(private) public } is_strict=true is_qualified=false is_attr=false
      94:Findpropstrict 1 [1]
LoadRegister 4, *
      96:Getlocal 4 [2]
CallProperty trace 2 { algo.as$0(private) public } 1 is_qualified=false is_super=false is_attr=false
      98:Callproperty 1 1 [1]
Pop
      101:Pop [0]
PatchIf 91
      If@90 <- 8 [0]
PatchContinue 0 [0]
LoadRegister 4, *
      102:Getlocal 4 [1]
InvokeUnary IncrementOp 0 4
      104:Increment [1]
CheckType *
      105:Coerce.o [1]
StoreRegister 4, *
      106:Setlocal 4 [0]
PatchLoopBegin 108
      Jump@14 <- 90 [0]
LoadRegister 4, *
      108:Getlocal 4 [1]
PushNumber 1000, int
      110:Pushshort 1000 [2]
LoopEnd lt
      113:Iflt [0]
PatchBreak 0 [0]
FindProperty trace 2 { algo.as$0(private) public } is_strict=true is_qualified=false is_attr=false
      117:Findpropstrict 1 [1]
PushString done
      119:Pushstring 4 [2]
CallProperty trace 2 { algo.as$0(private) public } 1 is_qualified=false is_super=false is_attr=false
      121:Callproperty 1 1 [1]
Pop
      124:Pop [0]
Return
      125:Returnvoid [0]
// --FinishMethod main$0 algo.as$0:main
// ++StartMethod $init
LoadThis
      0:Getlocal0 [1]
PushScope
      1:Pushscope [0]
NewFunctionObject main$0
      2:Newfunction 0 [1]
StoreGlobal 0, *
      4:Getglobalscope
      5:Swap
      6:Setslot 1 [0]
Return
      8:Returnvoid [0]
// --FinishMethod $init 
// --FinishProgram 