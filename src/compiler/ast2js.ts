import {Program, AST2Code, StatementType, BlockStatement, VariableDeclaration, ExpressionType, SwitchCase} from './ast'
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
  cases (cases: SwitchCase[], indent: string): Lines {
    let ret = new Lines(indent)
    for (let c of cases) {
      ret.add(0, `case ${this.expr(c.test)}:`)
      for (let s of c.consequent) {
        ret.add(0, this.stmt(s, indent))
      }
    }
    return ret
  }
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
      case 'CallExpression':
        return `${expr(e.callee)}(${e.arguments.map(expr).join(', ')})`
      default:
        logger.error(`Empty expr return ${e.type}`)
    }
  }
  stmt (n: StatementType, indent: string): Lines {
    const blockStmt = (lines: Lines, s: StatementType): void => {
      lines.add(s.type === 'BlockStatement' ? 0 : 1, stmt(s, indent))
    }
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
      case 'IfJumpStatement':
        return ret.add(0, `if (${expr(n.test)})`)
                  .add(1, `goto ${n.consequent}`)
                  .add(0, `else`)
                  .add(1, `goto ${n.alternate}`)
      case 'IfStatement':
        ret.add(0, `if (${expr(n.test)})`)
        blockStmt(ret, n.consequent)
        if (n.alternate) {
          ret.add(0, `else`)
          blockStmt(ret, n.alternate)
        }
        return ret
      case 'JumpStatement':
        return ret.add(0, `goto ${n.target}`)
      case 'WhileStatement':
        ret.add(0, `while (${expr(n.test)})`)
        blockStmt(ret, n.body)
        return ret
      case 'BreakStatement':
        return ret.add(0, `break`)
      case 'ReturnStatement':
        return ret.add(0, `return${n.argument ? ` ${expr(n.argument)}` : ''}`)
      case 'SwitchStatement':
        return ret.add(0, `switch (${expr(n.discriminant)}) {`)
                  .add(1, this.cases(n.cases, indent))
                  .add(0, `}`)
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
