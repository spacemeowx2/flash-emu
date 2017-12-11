type BinOp = '+' | '-' | '*' | '/' | '%' | '^'
type UnaryOp = '+' | '-' | '!'
type AssignmentOp = '='
export class AstNode {
  parent: Node = null

}

export class CustomExpr extends AstNode {
  constructor () {
    super()
  }
}

export class BinaryExpr extends CustomExpr {
  constructor (public left: CustomExpr, public right: CustomExpr, public operator: BinOp) {
    super()
  }
}

export class UnaryExpr extends CustomExpr {
  constructor (public op: UnaryOp, public arg: CustomExpr, public isPrefix: boolean) {
    super()
  }
}

export class AssignmentExpr extends CustomExpr {
  constructor (public op: AssignmentOp, public left: CustomExpr, public right: CustomExpr) {
    super()
  }
}

export class AST2Code {
  
}
