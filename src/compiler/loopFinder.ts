export interface IGraphNode {
  id: number
  succs: IGraphNode[]
}
interface GNode {
  preds: GNode[]
  succs: GNode[]
  post: number | null
  node: IGraphNode
}
export function findLoop (graph: IGraphNode[], begin: IGraphNode) {
  return new StructureAnalysis(graph, begin).findLoop()
}
function min<T> (a: T, b: T) {
  return a > b ? b : a
}
export class StructureAnalysis {
  begin: GNode
  nodes: GNode[] = []
  nodeDistance: WeakMap<GNode, number>
  idoms = new WeakMap<GNode, GNode>()
  constructor (iGraph: IGraphNode[], iBegin: IGraphNode) {
    let map = new WeakMap<IGraphNode, GNode>()
    let nodes: GNode[] = []
    let changed = true

    for (let i of iGraph) {
      const n: GNode = {
        preds: [],
        succs: [],
        post: null,
        node: i
      }
      map.set(i, n)
      nodes.push(n)
    }
    for (let n of nodes) {
      n.succs = n.node.succs.map(i => map.get(i))
      for (let i of n.succs) {
        i.preds.push(n)
      }
    }
    this.nodes = nodes
    this.begin = map.get(iBegin)
  }
  findLoop () {
    this.iterative()
    const begin = this.begin
    this.nodeDistance = this.calcDistance()
    // let ssc = this.ssc()
    // ssc = ssc.map(i => i.sort((a, b) => this.nodeDistance.get(a) - this.nodeDistance.get(b)))
    // return ssc.map(i => ({
    //   test: i[0],
    //   body: i.slice(1)
    // }))
    for (let n of dfsPostOrder(this.nodes, this.begin)) {
      for (let p of n.preds) {
        if (this.dominates(n, p)) {
          // n should be a header of loop
        }
      }
    }
  }
  private dominates (dominator: GNode, n: GNode): boolean {
    const idoms = this.idoms
    let cur = n
    while (idoms.has(cur)) {
      const idom = idoms.get(cur)
      if (idom === dominator) {
        return true
      }
      cur = idom
    }
    return false
  }
  private ssc () {
    let DFN = new WeakMap<GNode, number>()
    let Low = new WeakMap<GNode, number>()
    let index = 0
    let stack: GNode[] = []
    let ret: GNode[][] = []
    const tarjan = (u: GNode) => {
      index++
      DFN.set(u, index)
      Low.set(u, index)
      stack.push(u)
      for (let v of u.succs) {
        if (!DFN.has(v)) {
          tarjan(v)
          Low.set(u, min(Low.get(u), Low.get(v)))
        } else if (stack.includes(v)) {
          Low.set(u, min(Low.get(u), DFN.get(v)))
        }
      }
      if (DFN.get(u) === Low.get(u)) {
        let v: GNode
        let ssc: GNode[] = []
        do {
          v = stack.pop()
          ssc.push(v)
        } while (u !== v)
        ret.push(ssc)
      }
    }
    tarjan(this.begin)
    console.log(ret.map(n => n.map((i: any) => i.id)))
    return ret.filter(i => i.length > 1)
  }
  /**
   * 可能有用吧, 就是个 bfs
   */
  private calcDistance () {
    type NodeDistance = [GNode, number]
    const MAX_LEN = 0xFFFF
    let shortest = new WeakMap<GNode, number>()
    let queue: NodeDistance[] = [[this.begin, 0]]
    while (queue.length > 0) {
      let [cur, distance] = queue.shift()
      if (!shortest.has(cur)) {
        shortest.set(cur, distance)
        let toPush = cur.succs.map((n): NodeDistance => [n, distance + 1])
        queue.push(...toPush)
      }
    }
    return shortest
  }
  /**
   * https://github.com/julianjensen/dominators/blob/master/src/fast-iterative.js
   * Implements a near-linear time iterative dominator generator based on this
   * paper: (A Simple, Fast Dominance Algorithm)[https://www.cs.rice.edu/~keith/Embed/dom.pdf]
   * Citation:
   * Cooper, Keith & Harvey, Timothy & Kennedy, Ken. (2006). A Simple, Fast Dominance Algorithm. Rice University, CS Technical Report 06-33870
   */
  private iterative (): void {
    let nodes: GNode[] = this.nodes
    let changed = true

    const idoms = this.idoms
    const begin = this.begin
    idoms.set(begin, begin)

    const findIdoms = (b: GNode) => {
      if ( b === begin ) {
        return
      }

      let idom: GNode = undefined

      b.preds.forEach(p => {
        if (idoms.get(p) === undefined) {
          return
        }
        if (idom === undefined) {
          idom = p
        } else {
          let finger1 = p
          let finger2 = idom

          while ( finger1.post !== finger2.post ) {
            while ( finger1.post < finger2.post ) {
              finger1 = idoms.get(finger1)
            }
            while ( finger2.post < finger1.post ) {
              finger2 = idoms.get(finger2)
            }
          }

          idom = finger1
        }
      })

      if (idoms.get(b) !== idom ) {
        idoms.set(b, idom)
        changed = true
      }
    }

    const postOrder = dfsPostOrderArray(nodes, begin)
    const rpost = postOrder.slice().reverse()
    postOrder.forEach((node, postNum) => {
      node.post = postNum
    })

    while ( changed ) {
      changed = false
      rpost.forEach(findIdoms)
    }

    idoms.delete(begin)
    console.log(nodes.map((n, i) => `${n.node.id} ${idoms.has(n) && idoms.get(n).node.id}`))
    // return
  }
}
function* dfsPostOrder (nodes: GNode[], begin = nodes[0]) {
  let visited = new WeakMap<GNode, boolean>()
  let stack: GNode[] = [begin]
  while (stack.length > 0) {
    let cur = stack[stack.length - 1]
    visited.set(cur, true)
    let toPush = cur.succs.filter(i => !visited.get(i))
    if (toPush.length > 0) {
      stack.push(...toPush)
    } else {
      yield stack.pop()
    }
  }
}
function dfsPostOrderArray (nodes: GNode[], begin = nodes[0]) {
  let ret = []
  for (let i of dfsPostOrder(nodes, begin)) {
    ret.push(i)
  }
  return ret
}
/**
 * 1 -> 3
 * 2 -> 5
 * 3 -> 7, 2
 * 4 -> 5
 * 5 -> 6, 4
 * 6 -> 3
 * 7 -> END
 *    1
 *    |
 *    3
 *   / \
 *   7 2
 *     |
 *     5
 *    / \
 *    4 6
 * Backward:
 * 6 -> 3
 * 4 -> 5
 */
