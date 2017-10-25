export class MEMORY {
  static u8Index: number = 0
  static u16Index: number = 0
  static u32Index: number = 0
  static u8: Uint8Array
  static u16: Uint16Array
  static u32: Uint32Array

  static allocateUint8(len: number): void {
    MEMORY.u8 = new Uint8Array(len)
  }
  static allocateUint16(len: number): void {
    MEMORY.u16 = new Uint16Array(len)
  }
  static allocateUint32(len: number): void {
    MEMORY.u32 = new Uint32Array(len)
  }
  static getUint8(): number {
    if (!MEMORY.u8) {
      MEMORY.allocateUint8(10)
    }
    return MEMORY.u8Index++
  }
  static getUint16(): number {
    if (!MEMORY.u16) {
      MEMORY.allocateUint16(24)
    }
    return MEMORY.u16Index++
  }
  static getUint32(): number {
    if (!MEMORY.u32) {
      MEMORY.allocateUint32(10)
    }
    return MEMORY.u32Index++
  }
}
