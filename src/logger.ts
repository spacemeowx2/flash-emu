export interface ILoggerFlags {
  enableLog: boolean
  enableDebug: boolean
  enableWarn: boolean
  enableError: boolean
}
let globalFlags: ILoggerFlags = {
  enableDebug: false,
  enableLog: false,
  enableWarn: true,
  enableError: true
}
export type LogFilter = (tag: string) => boolean
export function setGlobalFlags (flags: ILoggerFlags) {
  globalFlags = flags
}
export class Logger implements ILoggerFlags {
  enableDebug: boolean = null
  enableLog: boolean = null
  enableWarn: boolean = null
  enableError: boolean = null
  constructor (private _tag: string) {
    this._tag = `[${_tag}]`
  }
  static logFilter: LogFilter = (tag) => true
  get tag () {
    return this._tag
  }
  get _enableDebug () {
    return Logger.logFilter(this._tag) && (this.enableDebug === null) ? globalFlags.enableDebug : this.enableDebug
  }
  get _enableLog () {
    return Logger.logFilter(this._tag) && (this.enableLog === null) ? globalFlags.enableLog : this.enableLog
  }
  get _enableWarn () {
    return Logger.logFilter(this._tag) && (this.enableWarn === null) ? globalFlags.enableWarn : this.enableWarn
  }
  get _enableError () {
    return Logger.logFilter(this._tag) && (this.enableError === null) ? globalFlags.enableError : this.enableError
  }
  debug (...args: any[]) {
    if (this._enableDebug) {
      console.log(this.tag, ...args)
    }
  }
  log (...args: any[]) {
    if (this._enableLog) {
      console.log(this.tag, ...args)
    }
  }
  warn (...args: any[]) {
    if (this._enableWarn) {
      console.log(this.tag, ...args)
    }
  }
  error (...args: any[]) {
    if (this._enableError) {
      console.error(this.tag, ...args)
    }
  }
}
