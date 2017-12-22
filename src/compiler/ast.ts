// http://esprima.org/demo/parse.html#
// https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API

type BinOp = '+' | '-' | '*' | '/' | '%' | '^'
type UnaryOp = '+' | '-' | '!'
type AssignmentOp = '='
export interface AstNode {
  readonly type: string
}

export type StatementType = JumpStatement | BlockStatement | VariableDeclaration | JumpStatement
export type ExpressionType = BinaryExpression | UnaryExpression | AssignmentExpression

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

export class ASTBuilder {
  binaryExpress (left: any, right: any, operator: BinOp): BinaryExpression {
    return {
      type: 'BinaryExpression',
      left, right, operator
    }
  }
  jumpStatement (target: number): JumpStatement {
    return {
      type: 'JumpStatement',
      target
    }
  }
  unaryExpression (op: UnaryOp, arg: Expression, isPrefix: boolean): UnaryExpression {
    return {
      type: 'UnaryExpression',
      op, arg, isPrefix
    }
  }
  assignmentStatement (op: AssignmentOp, left: Expression, right: Expression): AssignmentExpression {
    return {
      type: 'AssignmentExpression',
      op, left, right
    }
  }
}

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
export interface ExpressionStatement extends Statement {}
export interface IfStatement extends Statement {}
export interface LabeledStatement extends Statement {}
export interface BreakStatement extends Statement {}
export interface ContinueStatement extends Statement {}
export interface JumpStatement extends Statement {
  type: 'JumpStatement'
  target: number
}
export interface WithStatement extends Statement {}
export interface SwitchStatement extends Statement {}
export interface ReturnStatement extends Statement {}
export interface ThrowStatement extends Statement {}
export interface TryStatement extends Statement {}
export interface WhileStatement extends Statement {}
export interface DoWhileStatement extends Statement {}
export interface ForStatement extends Statement {}
export interface Declaration extends Statement {}
export interface VariableDeclaration extends Declaration {
  readonly type: 'VariableDeclaration'
}
export interface Expression extends AstNode {}
export interface ThisExpression extends Expression {}
export interface ArrayExpression extends Expression {}
export interface ObjectExpression extends Expression {}
export interface FunctionExpression extends Function {}
export interface UnaryExpression extends Expression {
  readonly type: 'UnaryExpression'
  op: UnaryOp, arg: Expression, isPrefix: boolean
}
export interface BinaryExpression extends Expression {
  readonly type: 'BinaryExpression'
  operator: BinOp, left: Expression, right: Expression
}
export interface AssignmentExpression extends Expression {
  op: AssignmentOp, left: Expression, right: Expression
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
export interface Identifier extends AstNode {}
export interface Literal extends AstNode {}
