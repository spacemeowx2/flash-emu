import {Program, AST2Code, StatementType, BlockStatement, VariableDeclaration, ExpressionType} from './ast'
import { Logger } from 'logger'
const logger = new Logger('ast2js')

type Line = [number, string]

class Lines {
  private l: Line[] = []
  constructor (private indentStr: string = '  ') {
  }
  add (indent: number, content: string | Lines | Lines[]) {
    if (typeof content === 'string') {
      this.l.push([indent, content])
    } else if (content instanceof Lines) {
      this.l = this.l.concat(content.l)
    } else {
      for (let l of content) {
        this.l = this.l.concat(l.l)
      }
    }
    return this
  }
  toString () {
    return this.l.map(line => this.indentStr.repeat(line[0]) + line[1]).join('\n')
  }
}

export class AST2JS extends AST2Code {
  expr (e: ExpressionType): string {
    const expr = (e: ExpressionType) => this.expr(e)
    switch (e.type) {
      case 'UnaryExpression':
        return e.isPrefix ? `${e.op}(${expr(e.arg)})` : `(${expr(e.arg)})${e.op}`
      case 'BinaryExpression':
        return `(${expr(e.left)}) ${e.operator} (${expr(e.right)})`
      case 'AssignmentExpression':
        return `${expr(e.left)} ${e.op} ${expr(e.right)}`
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
