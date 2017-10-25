import {AbcFile, Namespace, Multiname} from './abc'
import * as ABC from './abc'
import {BufferReader} from './utils'
import {Interpreter} from './interpreter'
import {Runtime, Scope, ApplicationDomain} from './runtime'
import {setGlobalFlags, ILoggerFlags} from './logger'
import {SWFFile, TagType} from './swf'
const ABCTags = [TagType.DoABC, TagType.DefineBinaryData, TagType.SymbolClass]
interface FileInterface {
  readFile (filename: string): ArrayBuffer
}
class AVM2 {
  abc: AbcFile
  interpreter: Interpreter
  runtime: Runtime
  app: ApplicationDomain
  fi: FileInterface
  constructor (fi: FileInterface) {
    this.runtime = new Runtime()
    this.app = new ApplicationDomain(this.runtime, null)

    this.interpreter = new Interpreter(this.runtime)
    this.runtime.interpreter = this.interpreter
    this.fi = fi

    this.loadABCFile('./lib/builtin.abc')
  }
  loadABC (stream: ArrayBuffer) {
    const reader = new BufferReader(stream)
    const abc = new AbcFile(reader, this.app)
    this.app.loadABC(abc)
    this.abc = abc
  }
  loadABCFile (fileName: string) {
    this.loadABC(this.fi.readFile(fileName))
  }
  executeScript (id: number = -1) {
    if (id < 0) {
      id += this.abc.script.length
    }
    let script = this.abc.getScript(id)
    return this.app.executeScript(script)
  }
  getClass (mn: Multiname) {
    return this.app.getClass(mn)
  }
  toJson (...args: any[]) {
    return this.abc.toJson.apply(this.abc, args)
  }
  test () {
    // this.executeScript()
    // const xx = this.getClass(Multiname.Public('xx'))
    // const CModule = this.getClass(Multiname.Package('sample.xx', 'CModule'))
    // // console.log(CModule.axGetProperty(Multiname.Public('modThunks')))
    // let wtf = CModule.axCallProperty(Multiname.Public('malloc'), [4], true)
    // console.log(wtf)
  }
  test2 () {
    const CModule = this.getClass(Multiname.Package('com.adobe.flascc', 'CModule'))
    console.log(CModule)
  }
  testswf (fileName: string) {
    const stream = this.fi.readFile(fileName)
    const reader = new BufferReader(stream)
    let swf = new SWFFile(reader, this.app, ABCTags)
    console.error(JSON.stringify(swf, null, 2))
  }
}
export default {
  newAVM2 (fi: FileInterface) {
    return new AVM2(fi)
  },
  setGlobalFlags (flags: ILoggerFlags) {
    setGlobalFlags(flags)
  }
}
