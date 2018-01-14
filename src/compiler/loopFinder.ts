export interface IGraphNode {
  id: number
  succ: IGraphNode[]
}
export function findLoop (graph: IGraphNode[], begin: IGraphNode) {
  return new LoopFinder(graph, begin).find()
}
function min<T> (a: T, b: T) {
  return a > b ? b : a
}
function* dfsIterator (begin: IGraphNode): IterableIterator<IGraphNode> {
  let visited = new WeakMap<IGraphNode, boolean>()
  let stack: IGraphNode[] = [begin]
  while (stack.length > 0) {
    let cur = stack.pop()
    yield cur
    visited.set(cur, true)
    let toPush = cur.succ.filter(i => !visited.get(i))
    stack.push(...toPush)
  }
}
export class LoopFinder {
  nodeDistance: WeakMap<IGraphNode, number>
  constructor (private graph: IGraphNode[], private begin: IGraphNode) {
    //
  }
  find () {
    const begin = this.begin
    let ssc = this.ssc()
    this.nodeDistance = this.calcDistance()
    ssc = ssc.map(i => i.sort((a, b) => this.nodeDistance.get(a) - this.nodeDistance.get(b)))
    return ssc.map(i => ({
      test: i[0],
      body: i.slice(1)
    }))
  }
  private ssc () {
    let DFN = new WeakMap<IGraphNode, number>()
    let Low = new WeakMap<IGraphNode, number>()
    let index = 0
    let stack: IGraphNode[] = []
    let ret: IGraphNode[][] = []
    const tarjan = (u: IGraphNode) => {
      index++
      DFN.set(u, index)
      Low.set(u, index)
      stack.push(u)
      for (let v of u.succ) {
        if (!DFN.has(v)) {
          tarjan(v)
          Low.set(u, min(Low.get(u), Low.get(v)))
        } else if (stack.includes(v)) {
          Low.set(u, min(Low.get(u), DFN.get(v)))
        }
      }
      if (DFN.get(u) === Low.get(u)) {
        let v: IGraphNode
        let ssc: IGraphNode[] = []
        do {
          v = stack.pop()
          ssc.push(v)
        } while (u !== v)
        ret.push(ssc)
      }
    }
    tarjan(this.begin)
    return ret.filter(i => i.length > 1)
  }
  /**
   * 可能有用吧, 就是个 bfs
   */
  private calcDistance () {
    type NodeDistance = [IGraphNode, number]
    const MAX_LEN = 0xFFFF
    let shortest = new WeakMap<IGraphNode, number>()
    let queue: NodeDistance[] = [[this.begin, 0]]
    while (queue.length > 0) {
      let [cur, distance] = queue.shift()
      if (!shortest.has(cur)) {
        shortest.set(cur, distance)
        let toPush = cur.succ.map((n): NodeDistance => [n, distance + 1])
        queue.push(...toPush)
      }
    }
    return shortest
  }
}
