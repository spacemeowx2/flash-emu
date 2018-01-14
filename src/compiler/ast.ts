// http://esprima.org/demo/parse.html#
// https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API

export type BinOp = '+' | '-' | '*' | '/' | '%' | '^' | '==' | '===' | '!=' | '!=='
export type UnaryOp = '+' | '-' | '!'
export type AssignmentOp = '='
export interface AstNode {
  readonly type: string
}

export type StatementType = WhileStatement | IfStatement | JumpStatement | BlockStatement | VariableDeclaration | JumpStatement | ExpressionStatement
export type ExpressionType = BinaryExpression | UnaryExpression | AssignmentExpression | Identifier | Literal

export class RefNode<T> {
  constructor (public value: T) {}
}

export abstract class AST2Code {
  constructor (protected program: Program) {
    //
  }
  unexpected (n: AstNode) {
    const s = `Unexpected parse node type: ${n.type} (${Object.getOwnPropertyNames(n).toString()})`
    throw new TypeError(s)
  }
  assertEq<T> (val: T, expected: T) {
    if (val !== expected) {
      throw new Error(`${val} not equeal to ${expected}`)
    }
  }
  abstract toCode (): string
}
function stringify (value: any) {
  return JSON.stringify(value)
}
export class ASTBuilder {
  static instance: ASTBuilder = new ASTBuilder()
  program (body: StatementType[]): Program {
    return {
      type: 'Program',
      body
    }
  }
  literal (value: any, str?: string): Literal {
    if (undefined === str) {
      str = stringify(value)
    }
    return {
      type: 'Literal',
      value, str
    }
  }
  identifier (name: string): Identifier {
    return {
      type: 'Identifier', name
    }
  }
  binaryExpression (left: ExpressionType, right: ExpressionType, operator: BinOp): BinaryExpression {
    return {
      type: 'BinaryExpression',
      left, right, operator
    }
  }
  blockStatement (body: StatementType[]): BlockStatement {
    return {
      type: 'BlockStatement',
      body
    }
  }
  ifStatement (test: ExpressionType, consequent: StatementType, alternate?: StatementType): IfStatement {
    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate
    }
  }
  whileStatement (test: ExpressionType, body: StatementType): WhileStatement {
    return {
      type: 'WhileStatement',
      test,
      body
    }
  }
  jumpStatement (target: number): JumpStatement {
    return {
      type: 'JumpStatement', target
    }
  }
  unaryExpression (operator: UnaryOp, arg: ExpressionType, isPrefix: boolean): UnaryExpression {
    return {
      type: 'UnaryExpression',
      operator, arg, isPrefix
    }
  }
  assignmentExpression (operator: AssignmentOp, left: ExpressionType, right: ExpressionType): AssignmentExpression {
    return {
      type: 'AssignmentExpression',
      operator, left, right
    }
  }
  expressionStatement (expression: ExpressionType): ExpressionStatement {
    return {
      type: 'ExpressionStatement',
      expression
    }
  }
}
export const builder = ASTBuilder.instance

export interface Program extends AstNode {
  readonly type: 'Program'
  body: StatementType[]
}
export interface Function extends AstNode {}
export interface Statement extends AstNode {}
export interface BlockStatement extends Statement {
  readonly type: 'BlockStatement'
  body: StatementType[]
}
export interface ExpressionStatement extends Statement {
  readonly type: 'ExpressionStatement'
  expression: ExpressionType
}
export interface IfStatement extends Statement {
  readonly type: 'IfStatement'
  test: ExpressionType
  consequent: StatementType
  alternate?: StatementType
}
export interface LabeledStatement extends Statement {}
export interface BreakStatement extends Statement {}
export interface ContinueStatement extends Statement {}
export interface JumpStatement extends Statement {
  readonly type: 'JumpStatement'
  target: number
}
export interface WithStatement extends Statement {}
export interface SwitchStatement extends Statement {}
export interface ReturnStatement extends Statement {}
export interface ThrowStatement extends Statement {}
export interface TryStatement extends Statement {}
export interface WhileStatement extends Statement {
  readonly type: 'WhileStatement'
  test: ExpressionType
  body: StatementType
}
export interface DoWhileStatement extends Statement {}
export interface ForStatement extends Statement {}
export interface Declaration extends Statement {}
export interface VariableDeclaration extends Declaration {
  readonly type: 'VariableDeclaration'
  id: Identifier
  init: ExpressionType
}
export interface Expression extends AstNode {}
export interface ThisExpression extends Expression {}
export interface ArrayExpression extends Expression {}
export interface ObjectExpression extends Expression {}
export interface FunctionExpression extends Function {}
export interface UnaryExpression extends Expression {
  readonly type: 'UnaryExpression'
  operator: UnaryOp, arg: ExpressionType, isPrefix: boolean
}
export interface BinaryExpression extends Expression {
  readonly type: 'BinaryExpression'
  operator: BinOp, left: ExpressionType, right: ExpressionType
}
export interface AssignmentExpression extends Expression {
  readonly type: 'AssignmentExpression'
  operator: AssignmentOp, left: ExpressionType, right: ExpressionType
}
export interface LogicalExpression extends Expression {}
export interface ConditionalExpression extends Expression {}
export interface NewExpression extends Expression {}
export interface CallExpression extends Expression {}
export interface MemberExpression extends Expression {}
export interface ComprehensionExpression extends Expression {}
export interface GeneratorExpression extends Expression {}
export interface GraphExpression extends Expression {}
export interface GraphIndexExpression extends Expression {}
export interface Pattern extends AstNode {}
export interface ObjectPattern extends Pattern {}
export interface ArrayPattern extends Pattern {}
export interface SwitchCase extends AstNode {}
export interface CatchClause extends AstNode {}
export interface ComprehensionBlock extends AstNode {}
export interface ComprehensionIf extends AstNode {}
export interface Identifier extends AstNode {
  readonly type: 'Identifier'
  name: string
}
export interface Literal extends AstNode {
  readonly type: 'Literal'
  value: any
  str: string
}
