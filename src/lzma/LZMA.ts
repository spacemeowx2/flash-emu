/**
 * LZMA Decoder
 * @author Nidin Vinayakan | nidinthb@gmail.com
 */
import {LzmaDecoder} from './LzmaDecoder'
import {RangeDecoder} from './RangeDecoder'
export class LZMA {
  static LZMA_DIC_MIN: number = (1 << 12)
  static LZMA_RES_ERROR: number = 0
  static LZMA_RES_FINISHED_WITH_MARKER: number = 1
  static LZMA_RES_FINISHED_WITHOUT_MARKER: number = 2
  static kNumBitModelTotalBits: number = 11
  static kNumMoveBits: number = 5
  static PROB_INIT_VAL = ((1 << LZMA.kNumBitModelTotalBits) / 2) // 1024
  static kNumPosBitsMax: number = 4

  static kNumStates: number = 12
  static kNumLenToPosStates: number = 4
  static kNumAlignBits: number = 4
  static kStartPosModelIndex: number = 4
  static kEndPosModelIndex: number = 14
  static kNumFullDistances: number = (1 << (LZMA.kEndPosModelIndex >>> 1))
  static kMatchMinLen: number = 2

  public decoder: LzmaDecoder

  constructor() {
    this.decoder = new LzmaDecoder()
  }
  static INIT_PROBS(p: Uint16Array): void {
    for (let i: number = 0; i < p.length; i++) {
      p[i] = this.PROB_INIT_VAL
    }
  }
  static BitTreeReverseDecode(probs: any,numBits: number, rc: RangeDecoder,offset: number= 0): number {
    let m: number = 1
    let symbol: number = 0
    for (let i: number = 0; i < numBits; i++) {
      let bit: number = rc.decodeBit(probs,offset + m)
      m <<= 1
      m += bit
      symbol |= (bit << i)
    }
    return symbol
  }
  public decodeSWF (data: Uint8Array, unpackLength: number): Uint8Array {
    let header: Uint8Array = new Uint8Array(5)
    let i: number// int
    for (i = 0; i < 5; i++) {
      header[i] = data[i]
    }

    this.decoder.decodeProperties(header)

    let unpackSize: number = unpackLength // UInt64
    let unpackSizeDefined: boolean = true
    // for (i = 0; i < 8; i++) {
    //   let b: number = header[5 + i]
    //   if (b !== 0xFF) {
    //     unpackSizeDefined = true
    //   }
    //   unpackSize |= b << (8 * i)
    // }

    this.decoder.markerIsMandatory = !unpackSizeDefined

    /*if (unpackSizeDefined){
      console.log("Uncompressed Size : "+ unpackSize +" bytes");
    }else{
      console.log("End marker is expected");
    }*/
    this.decoder.rangeDec.inStream = data
    this.decoder.rangeDec.idPos = 5
    this.decoder.create()
    // we support the streams that have uncompressed size and marker.
    let res: number = this.decoder.decode(unpackSizeDefined, unpackSize) // int

    // console.log("Read    ", this.decoder.rangeDec.in_pos);
    // console.log("Written ", this.decoder.outWindow.out_pos);

    if (res === LZMA.LZMA_RES_ERROR) {
      throw 'LZMA decoding error'
    } else if (res === LZMA.LZMA_RES_FINISHED_WITHOUT_MARKER) {
      // console.log("Finished without end marker");
    } else if (res === LZMA.LZMA_RES_FINISHED_WITH_MARKER) {
      if (unpackSizeDefined) {
        if (this.decoder.outWindow.outPos !== unpackSize) {
          throw 'Finished with end marker before than specified size'
        }
      }
    } else {
      throw 'Internal Error'
    }

    if (this.decoder.rangeDec.corrupted) {
      console.log('Warning: LZMA stream is corrupted')
    }
    return this.decoder.outWindow.outStream
  }
  public decode(data: Uint8Array): Uint8Array {
    // var header:Uint8Array = data.readUint8Array(13);
    let header: Uint8Array = new Uint8Array(13)
    let i: number// int
    for (i = 0; i < 13; i++) {
      header[i] = data[i]
    }

    this.decoder.decodeProperties(header)

    // console.log("lc="+this.decoder.lc+", lp="+this.decoder.lp+", pb="+this.decoder.pb);
    // console.log("Dictionary Size in properties = "+this.decoder.dictSizeInProperties);
    // console.log("Dictionary Size for decoding  = "+this.decoder.dictSize);
    // return this.ucdata;
    let unpackSize: number = 0// UInt64
    let unpackSizeDefined: boolean = false
    for (i = 0; i < 8; i++) {
      let b: number = header[5 + i]
      if (b !== 0xFF) {
        unpackSizeDefined = true
      }
      unpackSize |= b << (8 * i)
    }

    this.decoder.markerIsMandatory = !unpackSizeDefined

    /*if (unpackSizeDefined){
      console.log("Uncompressed Size : "+ unpackSize +" bytes");
    }else{
      console.log("End marker is expected");
    }*/
    this.decoder.rangeDec.inStream = data
    this.decoder.create()
    // we support the streams that have uncompressed size and marker.
    let res: number = this.decoder.decode(unpackSizeDefined, unpackSize) // int

    // console.log("Read    ", this.decoder.rangeDec.in_pos);
    // console.log("Written ", this.decoder.outWindow.out_pos);

    if (res === LZMA.LZMA_RES_ERROR) {
      throw 'LZMA decoding error'
    } else if (res === LZMA.LZMA_RES_FINISHED_WITHOUT_MARKER) {
      // console.log("Finished without end marker");
    } else if (res === LZMA.LZMA_RES_FINISHED_WITH_MARKER) {
      if (unpackSizeDefined) {
        if (this.decoder.outWindow.outPos !== unpackSize) {
          throw 'Finished with end marker before than specified size'
        }
      }
    } else {
      throw 'Internal Error'
    }

    if (this.decoder.rangeDec.corrupted) {
      console.log('Warning: LZMA stream is corrupted')
    }
    return this.decoder.outWindow.outStream
  }
}
