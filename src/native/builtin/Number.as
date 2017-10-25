package
{
// No instancegc, value is primitive.

[native(cls="NumberClass", classgc="exact", instance="double", methods="auto", construct="override")]
public final class Number
{
  public static native function get MAX_VALUE():Number;
  public static native function get MIN_VALUE():Number;
  public static native function get NaN():Number;
  public static native function get NEGATIVE_INFINITY():Number;
  public static native function get POSITIVE_INFINITY():Number;

  AS3 native function toString(radix=10):String;
  AS3 native function valueOf():Number;

  AS3 native function toExponential(p=0):String;
  AS3 native function toPrecision(p=0):String;
  AS3 native function toFixed(p=0):String;

  public native function Number(value = 0);
}

// No instancegc, value is primitive.

[native(cls="IntClass", classgc="exact", instance="int32_t", methods="auto", construct="override")]
public final class int
{
  AS3 native function toString(radix=10):String;
  AS3 native function valueOf():int;

  AS3 native function toExponential(p=0):String;
  AS3 native function toPrecision(p=0):String;
  AS3 native function toFixed(p=0):String;

  public native function int(value = 0);
}

// No instancegc, value is primitive.

[native(cls="UIntClass", classgc="exact", instance="uint32_t", methods="auto", construct="override")]
public final class uint
{
  AS3 native function toString(radix=10):String;
  AS3 native function valueOf():int;

  AS3 native function toExponential(p=0):String;
  AS3 native function toPrecision(p=0):String;
  AS3 native function toFixed(p=0):String;

  public native function uint(value = 0);
}
}
