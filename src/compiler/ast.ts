// http://esprima.org/demo/parse.html#
// https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API

export type BinOp = '+' | '-' | '*' | '/' | '%' | '^' | '==' | '===' | '!=' | '!==' | '<' | '>' | '<=' | '>='
export type UnaryOp = '+' | '-' | '!' | '~'
export type AssignmentOp = '='
export interface AstNode {
  readonly type: string
}
export const InvertOp = new Map<UnaryOp, Map<BinOp, BinOp>>([
  ['!', new Map<BinOp, BinOp>([
    ['==', '!='],
    ['===', '!=='],
    ['<', '>='],
    ['>', '<=']
  ])]
])

for (let [_, d] of InvertOp) {
  for (let [k, v] of d) {
    d.set(v, k)
  }
}

export type StatementType = SwitchStatement | BreakStatement | IfJumpStatement | ReturnStatement | WhileStatement | IfStatement | JumpStatement | BlockStatement | VariableDeclaration | ExpressionStatement
export type ExpressionType = CallExpression | UnresolvedExpression<any> | ArrayExpression | RuntimeExpression | BinaryExpression | UnaryExpression | AssignmentExpression | Identifier | Literal

class Folder {
  fold (expr: StatementType | ExpressionType) {
    if (expr.type === 'UnaryExpression') {
      return this.foldUnary(expr)
    } else if (expr.type === 'WhileStatement') {
      
    }
  }
  foldUnary (expr: UnaryExpression): ExpressionType {
    const arg = expr.arg
    if (InvertOp.has(expr.operator)) {
      const d = InvertOp.get(expr.operator)
      if (arg.type === 'BinaryExpression') {
        return builder.binaryExpression(
          arg.left,
          arg.right,
          d.get(arg.operator)
        )
      }
    }
  }
}
export function isExpression (node: AstNode): node is ExpressionType {
  const e = 'Expression'
  return node.type.substring(node.type.length - e.length) === e
}
export abstract class AST2Code {
  constructor (protected program: Program) {
    //
  }
  simplify () {
    const folder = new Folder()
    for (let node of walkNode(this.program.body, true)) {
      Object.assign(node, folder.fold(node))
    }
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
      test, consequent, alternate
    }
  }
  ifJumpStatement (test: ExpressionType, consequent: number, alternate: number): IfJumpStatement {
    return {
      type: 'IfJumpStatement',
      test, consequent, alternate
    }
  }
  whileStatement (test: ExpressionType, body: StatementType): WhileStatement {
    return {
      type: 'WhileStatement',
      test,
      body
    }
  }
  breakStatement (label?: string): BreakStatement {
    return {
      type: 'BreakStatement',
      label
    }
  }
  jumpStatement<T = number> (target: T): JumpStatement<T> {
    return {
      type: 'JumpStatement', target
    }
  }
  variableDeclaration (id: Identifier[]): VariableDeclaration {
    return {
      type: 'VariableDeclaration',
      id
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
  callExpression (callee: ExpressionType, args: ExpressionType[]): CallExpression {
    return {
      type: 'CallExpression',
      callee,
      arguments: args
    }
  }
  expressionStatement (expression: ExpressionType): ExpressionStatement {
    return {
      type: 'ExpressionStatement',
      expression
    }
  }
  returnStatement (argument?: ExpressionType): ReturnStatement {
    return {
      type: 'ReturnStatement',
      argument
    }
  }
  runtimeExpression<T extends RuntimeMethod = RuntimeMethod>
      (method: T['name'], args: T['args']): RuntimeExpression<T> {
    return {
      type: 'RuntimeExpression',
      method,
      args
    }
  }
  unresolvedExpression<T extends UnresolvedItem> (item: T): UnresolvedExpression<T> {
    return {
      type: 'UnresolvedExpression',
      item
    }
  }
  arrayExpression (elements: ExpressionType[]): ArrayExpression {
    return {
      type: 'ArrayExpression',
      elements
    }
  }
  switchStatement (discriminant: ExpressionType, cases: SwitchCase[]): SwitchStatement {
    return {
      type: 'SwitchStatement',
      discriminant, cases
    }
  }
  switchCase (test: ExpressionType | null, consequent: StatementType[]): SwitchCase {
    return {
      type: 'SwitchCase',
      test, consequent
    }
  }
}
export const builder = ASTBuilder.instance
// TODO: compare type with all types
function isAstNode (node: any): node is AstNode {
  return node && node.type && typeof node.type === 'string'
}
export function* walkNode (root: any, postOrder = false): IterableIterator<AstNode> {
  const r: any = root
  if (Array.isArray(r)) {
    for (let n of r) {
      for (let i of walkNode(n)) {
        yield i
      }
    }
  } else {
    if (!isAstNode(root)) {
      return
    }
    if (!postOrder) {
      yield r
    }
    for (let key of Object.keys(r)) {
      let v = r[key]
      for (let i of walkNode(v)) {
        yield i
      }
    }
    if (postOrder) {
      yield r
    }
  }
}
export function replaceNode (root: any, callback: (n: AstNode) => AstNode): void {
  for (let node of walkNode(root)) {
    for (let key of Object.keys(root)) {
      let v = root[key]
      if (isAstNode(v)) {
        root[key] = callback(v)
      }
    }
  }
}
export function* getAllNode<T extends AstNode> (root: any, type: T['type'] | T['type'][]): IterableIterator<T> {
  if (typeof type === 'string') {
    type = [type]
  }
  for (let i of walkNode(root)) {
    if (type.includes(i.type)) {
      yield i as any
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
export interface IfJumpStatement extends Statement {
  readonly type: 'IfJumpStatement'
  test: ExpressionType
  consequent: number
  alternate: number
}
export interface LabeledStatement extends Statement {}
export interface BreakStatement extends Statement {
  readonly type: 'BreakStatement'
  label: string
}
export interface ContinueStatement extends Statement {}
export interface JumpStatement<T = number> extends Statement {
  readonly type: 'JumpStatement'
  target: T
}
export interface WithStatement extends Statement {}
export interface SwitchStatement extends Statement {
  readonly type: 'SwitchStatement'
  discriminant: ExpressionType
  cases: SwitchCase[]
}
export interface ReturnStatement extends Statement {
  readonly type: 'ReturnStatement'
  argument?: ExpressionType
}
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
  id: Identifier[]
}
export interface Expression extends AstNode {}
export interface RuntimeMethod {
  readonly name: string
  args: ExpressionType[]
}
export interface UnresolvedItem {
  readonly type: string
}
export interface UnresolvedExpression<T extends UnresolvedItem> extends Expression {
  readonly type: 'UnresolvedExpression'
  item: T
}
export interface RuntimeExpression<T extends RuntimeMethod = RuntimeMethod> extends Expression {
  readonly type: 'RuntimeExpression'
  method: T['name']
  args: T['args']
}
export interface ThisExpression extends Expression {}
export interface ArrayExpression extends Expression {
  readonly type: 'ArrayExpression'
  elements: ExpressionType[]
}
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
export interface CallExpression extends Expression {
  readonly type: 'CallExpression'
  callee: ExpressionType
  arguments: ExpressionType[]
}
export interface MemberExpression extends Expression {}
export interface ComprehensionExpression extends Expression {}
export interface GeneratorExpression extends Expression {}
export interface GraphExpression extends Expression {}
export interface GraphIndexExpression extends Expression {}
export interface Pattern extends AstNode {}
export interface ObjectPattern extends Pattern {}
export interface ArrayPattern extends Pattern {}
export interface SwitchCase extends AstNode {
  readonly type: 'SwitchCase'
  test: ExpressionType | null
  consequent: StatementType[]
}
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
