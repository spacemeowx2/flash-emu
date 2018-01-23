import {Region, RegionType} from './arch'
import {Logger} from '@/logger'
import {IfJumpStatement, IfStatement, builder, StatementType} from 'compiler/ast'
const logger = new Logger('Structure')
export interface IGraphNode {
  id: number
  succs: IGraphNode[]
}
interface GNode {
  preds: GNode[]
  succs: GNode[]
  post: number | null
  node: Region
}
function min<T> (a: T, b: T) {
  return a > b ? b : a
}
export class StructureAnalysis {
  begin: GNode
  nodes: GNode[] = []
  nodeDistance: WeakMap<GNode, number>
  idoms = new WeakMap<GNode, GNode>()
  startMap = new Map<number, Region>()
  map = new WeakMap<Region, GNode>()
  constructor (iGraph: Region[], iBegin: Region) {
    const map = this.map
    let nodes: GNode[] = []
    let changed = true

    for (let i of iGraph) {
      const n: GNode = {
        preds: [] as GNode[],
        succs: [] as GNode[],
        post: null,
        node: i
      }
      map.set(i, n)
      nodes.push(n)
      this.startMap.set(i.startOffset, i)
    }
    for (let n of nodes) {
      n.succs = n.node.succs.map(i => map.get(i))
      for (let i of n.succs) {
        i.preds.push(n)
      }
    }
    this.nodes = nodes
    this.begin = map.get(iBegin)

    this.iterative()
  }
  removeNode (n: GNode) {
    logger.debug(`remove region ${n.node.id}`)
    const idx = this.nodes.indexOf(n)
    if (idx === -1) {
      throw new Error(`Can not remove node ${n.node.id}`)
    }
    this.nodes.splice(idx, 1)
  }
  replaceSuccs (n: GNode, s: GNode) {
    const si = n.succs.indexOf(s)
    if (si === -1) {
      throw new Error('s is not succ of n')
    }
    n.succs.splice(si, 1)
    n.succs.push(...s.succs.filter(i => i !== n && !n.succs.includes(i)))
  }
  replacePreds (n: GNode, s: GNode) {
    for (let ss of s.succs) {
      let pi = ss.preds.indexOf(s)
      ss.preds.splice(pi, 1)
      if (ss !== n && !ss.preds.includes(n)) {
        ss.preds.push(n)
      }
    }
  }
  /**
   * merge the succ of n into n
   */
  reduceSeqRegion (n: GNode) {
    let node = n.node
    let stmts = node.stmts
    let s = n.succs[0]
    if (s.preds.length === 1) {
      const sn = s.node
      node.type = sn.type
      let sLast = stmts[stmts.length - 1]
      if (sLast.type === 'JumpStatement') {
        stmts.pop()
      }
      node.stmts = stmts.concat(sn.stmts)
      // remove s
      this.collapse(n, s)
      console.log('reduce seq', n.node.id, s.node.id)
      return true
    } else {
      return false
    }
  }
  /**
   * collapse s into n, remove s from graph
   */
  collapse (n: GNode, s: GNode): void {
    this.replaceSuccs(n, s)
    this.replacePreds(n, s)
    this.removeNode(s)
  }
  reduceIfRegion (n: GNode) {
    console.log('reduce if')
    const remove = (t: GNode) => this.collapse(n, t)
    const linearSucc = (n: GNode) => {
      const node = n.node
      if (node.type === RegionType.Linear) {
        return n.succs[0]
      } else {
        return null
      }
    }
    const map = this.map
    const startMap = this.startMap
    const node = n.node
    const nLast: IfJumpStatement = node.stmts[node.stmts.length - 1] as any
    let th = map.get(startMap.get(nLast.consequent))
    let el = map.get(startMap.get(nLast.alternate))
    let thS = linearSucc(th)
    let elS = linearSucc(el)
    if (elS === th) {
      node.stmts[node.stmts.length - 1] = builder.ifStatement(
        builder.unaryExpression('!', nLast.test, true),
        builder.blockStatement(el.node.stmts)
      )
      node.type = RegionType.Linear
      remove(el)
      return true
    } else if (thS === el) {
      console.log(2)
      // th should be in n
      node.stmts[node.stmts.length - 1] = builder.ifStatement(
        nLast.test,
        builder.blockStatement(th.node.stmts)
      )
      node.type = RegionType.Linear
      remove(th)
      return true
    } else if (elS !== null && elS === thS) {
      console.log(3)
      node.stmts[node.stmts.length - 1] = builder.ifStatement(
        nLast.test,
        builder.blockStatement(th.node.stmts),
        builder.blockStatement(el.node.stmts)
      )
      node.type = RegionType.Linear
      remove(th)
      remove(el)
      return true
    }
    return false
  }
  reduceAcyclic (n: GNode): boolean {
    switch (n.node.type) {
      case RegionType.Linear:
        return this.reduceSeqRegion(n)
      case RegionType.Branch:
        return this.reduceIfRegion(n)
      case RegionType.Switch:
        throw new Error('not impl')
      case RegionType.End:
        return false
    }
  }
  isCyclic (n: GNode): boolean {
    const ret = n.preds.some(p => p === n || this.dominates(n, p))
    return ret
  }
  printGraph () {
    for (let n of this.nodes) {
      const i = n.node
      logger.error(`${i.id} -> ${n.succs.map(b => b.node.id).join(', ')}`)
    }
  }
  reduce () {
    logger.debug(`reduce start`)
    for (let n of dfsPostOrder(this.nodes, this.begin)) {
      let didReduce = false
      do {
        logger.debug(`reduce ${n.node.id}`)
        didReduce = this.reduceAcyclic(n)
        if (!didReduce && this.isCyclic(n)) {
          didReduce = this.reduceCyclic(n)
        }
        logger.debug(`reduce ${n.node.id} end`)
        logger.error('---')
        this.printGraph()
        logger.error('---')
      } while (didReduce)
    }
  }
  reduceCyclic (n: GNode): boolean {
    const getLastIf = (stmts: StatementType[]): [IfJumpStatement, GNode, GNode] => {
      const nLast: IfJumpStatement = stmts[stmts.length - 1] as any
      if (nLast.type !== 'IfJumpStatement') {
        throw new Error('expecting IfJumpStatement')
      }
      let th = map.get(startMap.get(nLast.consequent))
      let el = map.get(startMap.get(nLast.alternate))
      return [nLast, th, el]
    }
    const remove = (t: GNode) => this.collapse(n, t)
    console.log('reduceCyclic')
    const node = n.node
    const map = this.map
    const startMap = this.startMap
    if (node.type === RegionType.Branch) {
      let [nLast, th, el] = getLastIf(node.stmts)
      let body: GNode
      let tail: GNode
      if (this.dominates(n, th)) {
        body = th
        tail = el
      } else {
        body = el
        tail = th
      }
      if (node.stmts.length === 1) {
        while (this.reduceSeqRegion(body)) {
          //
          console.log('merged')
        }
        node.stmts[0] = builder.whileStatement(
          nLast.test,
          builder.blockStatement(body.node.stmts)
        )
        remove(body)
        node.type = RegionType.Linear
        return true
      } else {
        for (let p of tail.preds) {
          const stmts = p.node.stmts
          if (stmts[stmts.length - 1].type === 'IfJumpStatement') {
            let [nLast, th, el] = getLastIf(p.node.stmts)
            let exp = nLast.test
            if (th === tail) {
              // Do nothing
            } else if (el === tail) {
              const t = th
              el = th
              th = t
              exp = builder.unaryExpression('!', exp, true)
            } else {
              throw new Error('impossible')
            }
            let elS: StatementType
            if (el !== tail) {
              if (el.node.stmts.length > 0) {
                elS = builder.blockStatement(el.node.stmts)
              }
              this.collapse(n, el)
            }
            // th should be break, el to be collpse
            stmts[stmts.length - 1] = builder.ifStatement(
              exp,
              builder.breakStatement(),
              elS
            )
          } else {
            console.log('just go tail')
          }
        }
        node.stmts = [builder.whileStatement(
          builder.identifier('true'),
          builder.blockStatement(node.stmts)
        )]
        node.type = RegionType.Linear
        return true
      }
    }
    return false
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
function* dfsPostOrder<T extends IGraphNode> (nodes: GNode[], begin = nodes[0]) {
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
function dfsPostOrderArray<T extends IGraphNode> (nodes: GNode[], begin = nodes[0]) {
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
