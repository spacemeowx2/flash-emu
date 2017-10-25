import {AbcFile, Namespace, Multiname} from './abc'
import * as ABC from './abc'
import {BufferReader} from './utils'
import {Interpreter} from './interpreter'
import {Scope, ApplicationDomain, SecurityDomain} from './runtime'
import {Logger, LogFilter, setGlobalFlags, ILoggerFlags} from './logger'
import {SWFFile, TagType, TagDefineBinaryData, TagDoABC} from './swf'
import {topFunctions, clear} from './profile'
import {AXObject} from './base'
const logger = new Logger('FlashEmu')

interface FileInterface {
  readFile (filename: string): Promise<ArrayBuffer>
  writeFile? (filename: string, buffer: ArrayBuffer): Promise<void>
}
interface IHookFunction {
  name: string
  callback: Function
}

export default class FlashEmu {
  static BUILTIN = './lib/builtin.abc'
  static PLAYERGLOBAL = './lib/playerglobal.abc'
  interpreter: Interpreter
  fi: FileInterface
  sec: SecurityDomain
  app: ApplicationDomain
  swf: SWFFile
  binaryData: Map<string, ArrayBuffer> = new Map()
  hooks: Map<string, IHookFunction> = new Map()
  private _inited = false
  constructor (fi: FileInterface) {
    this.sec = new SecurityDomain(this)
    this.app = this.sec.createApplicationDomain(null)

    this.interpreter = new Interpreter()
    // this.interpreter = new Interpreter()
    this.fi = fi
  }
  static setLogFilter (f: LogFilter) {
    Logger.logFilter = f
  }
  static setGlobalFlags (flags: ILoggerFlags) {
    setGlobalFlags(flags)
  }
  static async swfBuffer2str (buffer: ArrayBuffer) {
    let flashEmu = new FlashEmu({
      async readFile (filename: string) {
        return null
      }
    })
    let sec = new SecurityDomain(flashEmu)
    let app = sec.createApplicationDomain(null)
    const swf = new SWFFile(app)
    await swf.read(new BufferReader(buffer))

    let abcs = swf.getTags(TagDoABC)
    let out = ''
    for (let abcTag of abcs) {
      const reader = new BufferReader(abcTag.data)
      let abc = new AbcFile(reader, app)
      out += JSON.stringify(abc, null, 2)
    }
    return out
  }
  static abcBuffer2str (buffer: ArrayBuffer) {
    let flashEmu = new FlashEmu({
      async readFile (filename: string) {
        return null
      }
    })
    let sec = new SecurityDomain(flashEmu)
    let app = sec.createApplicationDomain(null)
    let reader = new BufferReader(buffer)
    let abc = new AbcFile(reader, app)
    return JSON.stringify(abc, null, 2)
  }
  async init () {
    if (!this._inited) {
      this._inited = true
      const systemDomain = this.sec.system
      await this.loadABCFile(FlashEmu.BUILTIN, systemDomain)
      await this.loadABCFile(FlashEmu.PLAYERGLOBAL, systemDomain)
      this.sec.onBuiltinLoaded()
    }
  }
  loadABC (stream: ArrayBuffer, app: ApplicationDomain) {
    const reader = new BufferReader(stream)
    const abc = new AbcFile(reader, this.app)
    app.loadABC(abc)
  }
  async loadABCFile (fileName: string, app: ApplicationDomain) {
    if (!this._inited) {
      await this.init()
    }
    this.loadABC(await this.fi.readFile(fileName), app)
  }
  getClass (mn: Multiname) {
    return this.app.getClass(mn)
  }
  getPublicClass (name: string) {
    return this.app.getClass(Multiname.Public(name))
  }
  getProperty (pkg: string, name: string) {
    return this.app.getProperty(Multiname.Package(pkg, name), true, true)
  }
  setProperty (pkg: string, name: string, value: any) {
    const mn = Multiname.Package(pkg, name)
    let obj = this.app.findProperty(mn, true, true)
    obj.axSetProperty(mn, value, false)
  }
  executeScript (abcid: number = -1, id: number = -1) {
    if (abcid < 0) {
      abcid += this.app.abcs.length
    }
    const abc = this.app.abcs[abcid]
    if (id < 0) {
      id += abc.script.length
    }
    let script = abc.getScript(id)
    return this.app.executeScript(script)
  }
  hookFlascc (name: string, espPkg: string, argCount: number, func: (...args: number[]) => any) {
    const self = this
    const callback = function (this: AXObject) {
      const esp = self.getProperty(espPkg, 'ESP')
      const view = this.app.domainMemory.view
      let ps: number[] = []
      for (let i = 0; i < argCount; i++) {
        ps.push(view.getUint32(esp + i * 4, true))
      }
      return func.call(this, ...ps)
    }
    this.hooks.set(name, {
      name: name,
      callback: callback
    })
  }
  async loadSWF (fileName: string) {
    await this.init()
    const stream = await this.fi.readFile(fileName)
    const reader = new BufferReader(stream)
    const swf = new SWFFile(this.app)
    await swf.read(reader)
    this.swf = swf

    let bins = swf.getTags(TagDefineBinaryData)
    for (let b of bins) {
      this.binaryData.set(b.symbolName, b.data)
    }
  }
  async runSWF (fileName: string, executeScript: boolean = true) {
    await this.loadSWF(fileName)
    this.swf.dropUnusedTags()
    const doAbc = this.swf.getTags(TagDoABC)
    for (let abc of doAbc) {
      this.loadABC(abc.data, this.app)
    }
    if (executeScript) {
      this.executeScript()
    }
  }
  async testswf2 (fileName: string) {
    await this.loadSWF(fileName)
    // this.swf.tags = this.swf.tags.filter(t => t.data || t.constructor.name !== 'Tag')
    this.swf.dropUnusedTags()
    const doAbc = this.swf.getTags(TagDoABC)
    for (let abc of doAbc) {
      this.loadABC(abc.data, this.app)
    }

    let CModule = this.app.getClass(Multiname.Package('com.adobe.flascc', 'CModule'))
    CModule.callProperty('startAsync')
    let check = this.getProperty('MyCPP', 'check')
    let ret = check.call(check, '123')
    logger.error(ret)
  }
  async testswf (fileName: string) {
    this.hookFlascc('F__ZN11CCommonFunc6RSHashEj', 'sample.xx', 1, (pVal) => {
      // const u8 = this.app.domainMemory.u8view
      // let a = u8[pVal + 1]
      // let b = u8[pVal]
      // b = (b * 0x9D0A4DAF) | 0
      // a = (a + b) | 0
      // a = (a * 0xBEDDE219) | 0
      // b = u8[pVal + 2]
      // a = (a + b) | 0
      // a = (a * 0x77F8F5DF) | 0
      // const ret = (u8[pVal + 3] + a) | 0
      this.setProperty('sample.xx', 'eax', 0)
    })
    let cur = 0
    this.hookFlascc('F__Znwj', 'sample.xx', 1, (len) => {
      this.app.domainMemory.length = 0x800000
      this.setProperty('sample.xx', 'eax', 0x600000 + cur)
      cur += len
    })
    let time = (new Date()).getTime()
    await this.loadSWF(fileName)
    this.swf.dropUnusedTags()
    const doAbc = this.swf.getTags(TagDoABC)
    for (let abc of doAbc) {
      this.loadABC(abc.data, this.app)
    }

    let CModule = this.app.getClass(Multiname.Package('sample.xx', 'CModule'))
    let xx = this.app.getClass(Multiname.Public('xx'))
    logger.error('CModule get')
    CModule.callProperty('startAsync')
    logger.error('CModule loaded')
    const sign = () => {
      let time = (new Date()).getTime()
      let StreamSignDataPtr = CModule.callProperty('malloc', 4)
      let outptr1 = CModule.callProperty('malloc', 4)

      let datalen = xx.callProperty('sub_13', 687423, 25020488, 'D2C2C9675D34594BCD066616B5C9AE44', outptr1, StreamSignDataPtr)
      // logger.error(StreamSignDataPtr, outptr1, datalen)
      let pSign = CModule.callProperty('read32', StreamSignDataPtr)
      let sign = CModule.callProperty('readString', pSign, datalen)
      logger.error(pSign, sign)
      CModule.callProperty('free', StreamSignDataPtr)
      CModule.callProperty('free', outptr1)
      logger.error('sign time:', (new Date()).getTime() - time)
    }
    clear()
    sign()
    sign()
    sign()

    logger.error('time:', (new Date()).getTime() - time)
    logger.error(topFunctions(50))
    logger.error(topFunctions(50, 'times'))
  }
}
