import {Program, AST2Code, StatementType, BlockStatement, VariableDeclaration, ExpressionType} from './ast'
import { Logger } from 'logger'
const logger = new Logger('ast2js')
const OpOrder: (string | string[])[] = [
  ['=', '+=', '-=', '*=', '/=', '&=', '|=', '^='],
  '||',
  '&&',
  '|',
  '^',
  '&',
  ['==', '!=', '===', '!=='],
  ['<', '<=', '>', '>='],
  ['<<', '>>', '>>>'],
  ['+', '-'],
  ['*', '/', '%']
]
let OpPriority = new Map<string, number>()
function initPriorityMap () {
  let priority = 1
  for (let i of OpOrder) {
    if (typeof i === 'string') {
      OpPriority.set(i, priority)
    } else {
      for (let j of i) {
        OpPriority.set(j, priority)
      }
    }
    priority++
  }
}
initPriorityMap()
type Line = [number, string]

class Lines {
  private l: Line[] = []
  constructor (private indentStr: string = '  ') {
  }
  add (indent: number, content: string | Lines | Lines[]) {
    if (typeof content === 'string') {
      this.l.push([indent, content])
    } else if (content instanceof Lines) {
      this.l = this.l.concat(content.lwithIndent(indent))
    } else {
      for (let l of content) {
        this.l = this.l.concat(l.lwithIndent(indent))
      }
    }
    return this
  }
  toString () {
    return this.l.map(line => this.indentStr.repeat(line[0]) + line[1]).join('\n')
  }
  private lwithIndent (indent: number) {
    return this.l.map(i => {
      const o: Line = [i[0] + indent, i[1]]
      return o
    })
  }
}

export class AST2JS extends AST2Code {
  expr (e: ExpressionType): string {
    const expr = (e: ExpressionType) => this.expr(e)
    switch (e.type) {
      case 'UnaryExpression': {
        let arg = expr(e.arg)
        if (e.arg.type === 'BinaryExpression') {
          arg = `(${arg})`
        }
        return e.isPrefix ? `${e.operator}${arg}` : `${arg}${e.operator}`
      }
      case 'BinaryExpression': {
        let left = expr(e.left)
        let right = expr(e.right)
        if (e.left.type === 'BinaryExpression') {
          if (OpPriority.get(e.operator) > OpPriority.get(e.left.operator)) {
            left = `(${left})`
          }
        }
        return `${left} ${e.operator} ${right}`
      }
      case 'AssignmentExpression':
        return `${expr(e.left)} ${e.operator} ${expr(e.right)}`
      case 'Identifier':
        return e.name
      case 'Literal':
        return e.str
      default:
        logger.error(`Empty expr return ${e.type}`)
    }
  }
  stmt (n: StatementType, indent: string): Lines {
    const expr = (e: ExpressionType) => this.expr(e)
    const stmt = (n: StatementType, indent: string) => this.stmt(n, indent)
    let ret = new Lines(indent)
    let exp: ExpressionType
    switch (n.type) {
      case 'BlockStatement':
        return ret.add(0, '{')
                  .add(1, n.body.map(i => this.stmt(i, indent)))
                  .add(0, '}')
      case 'VariableDeclaration':
        return ret.add(0, `let ${n.id.name};`)
      case 'ExpressionStatement':
        return ret.add(0, `${expr(n.expression)}`)
      case 'IfStatement':
        ret = ret.add(0, `if (${expr(n.test)})`)
                 .add(n.consequent.type === 'BlockStatement' ? 0 : 1, stmt(n.consequent, indent))
        if (n.alternate) {
          ret = ret.add(0, `else`)
                   .add(n.alternate.type === 'BlockStatement' ? 0 : 1, stmt(n.alternate, indent))
        }
        return ret
      case 'JumpStatement':
        return ret.add(0, `goto block${n.target}`)
      default:
        logger.error(`Empty stmt return ${n.type}`)
    }
    return ret
  }
  toCode () {
    const program = this.program
    if (program.type !== 'Program') {
      throw new TypeError('argument must be a Program parse node')
    }
    return program.body.map(x => this.stmt(x, '  ')).join('\n')
  }
}
