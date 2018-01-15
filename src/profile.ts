interface FunctionInfo {
  [key: string]: number | string
  name: string
  runTime: number
  times: number
}
let funcTable = new Map<string, FunctionInfo>()
let startStack = new Map<string, number[]>()
let now: () => number
if (typeof performance !== 'undefined') {
  now = () => performance.now()
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
      times: 1,
      name
    })
  } else {
    const info = funcTable.get(name)
    info.runTime += time
    info.times += 1
  }
}
export function topFunctions (count = 20, key: keyof FunctionInfo = 'runTime'): string {
  let ret: {
    [key: string]: FunctionInfo
  } = {}
  // let out: any = {}
  const header = ['name', 'runTime', 'times']
  let out: string[] = [header.join('\t')]
  for (let [k, v] of funcTable) {
    ret[k] = v
  }
  const keys = Array.from(funcTable.keys())
    .sort((a, b) => (funcTable.get(b)[key] as any) - (funcTable.get(a)[key] as any))
    .slice(0, count)
  keys.forEach((e: string) => {
    // out[e] = ret[e]
    out.push(header.map(h => ret[e][h].toString()).join('\t'))
  })
  return out.join('\n')
}
