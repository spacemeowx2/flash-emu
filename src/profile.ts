interface FunctionInfo {
  runTime: number
  times: number
}
let funcTable = new Map<string, FunctionInfo>()
let startStack = new Map<string, number[]>()
let now: () => number
if (typeof performance !== 'undefined') {
  now = () => performance.now() / 1000
} else if (typeof process !== 'undefined') {
  now = () => {
    const r = process.hrtime()
    return r[0] * 1000 + r[1] / 1000000
  }
} else {
  now = () => (new Date()).getTime()
}
function getStartStack (name: string) {
  let ary = startStack.get(name)
  if (!ary) {
    startStack.set(name, ary = [])
  }
  return ary
}
export function clear () {
  funcTable.clear()
  startStack.clear()
}
export function functionStart (name: string) {
  getStartStack(name).push(now())
}
export function functionEnd (name: string) {
  const startTime = getStartStack(name).pop()
  let time = now() - startTime
  if (!funcTable.has(name)) {
    funcTable.set(name, {
      runTime: time,
      times: 1
    })
  } else {
    const info = funcTable.get(name)
    info.runTime += time
    info.times += 1
  }
}
export function topFunctions (count = 20, key: keyof FunctionInfo = 'runTime') {
  let ret: any = {}
  let out: any = {}
  for (let [k, v] of funcTable) {
    ret[k] = v
  }
  const keys = Array.from(funcTable.keys())
    .sort((a, b) => funcTable.get(b)[key] - funcTable.get(a)[key])
    .slice(0, count)
  keys.forEach((e: string) => {
    out[e] = ret[e]
  })
  return out
}
