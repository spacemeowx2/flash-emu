import {Program, AST2Code, StatementType, BlockStatement, VariableDeclaration} from './ast'

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
  stmt (n: StatementType, indent: string): Lines {
    const stmt = (n: StatementType, indent: string) => this.stmt(n, indent)
    let ret = new Lines(indent)
    switch (n.type) {
      case 'BlockStatement':
        return ret.add(0, '{')
                  .add(1, n.body.map(i => this.stmt(i, indent)))
                  .add(0, '}')
      case 'VariableDeclaration':
        return ret.add(0, `let `)
    }
    return ret
  }
  toCode () {
    const program = this.program
    if (program.type !== 'Program') {
      throw new TypeError('argument must be a Program parse node')
    }
    return program.body.map(x => this.stmt(x, '  ')).join('')
  }
}
