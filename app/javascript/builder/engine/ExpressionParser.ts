export type ExpressionValue = number | string | boolean

export type ExpressionNode =
  | { kind: "literal"; value: ExpressionValue }
  | { kind: "variable"; name: string }
  | { kind: "arrayAccess"; name: string; index: ExpressionNode }
  | { kind: "unary"; operator: "-" | "nao"; operand: ExpressionNode }
  | { kind: "binary"; operator: string; left: ExpressionNode; right: ExpressionNode }

type TokenKind = "number" | "string" | "boolean" | "identifier" | "operator" | "punctuation" | "eof"

interface Token {
  kind: TokenKind
  value: string
  position: number
}

export class ExpressionSyntaxError extends Error {
  constructor(message: string) {
    super(`Expressão inválida: ${message}`)
    this.name = "ExpressionSyntaxError"
  }
}

export function parseExpression(source: string): ExpressionNode {
  return new Parser(tokenize(source)).parse()
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let position = 0

  while (position < source.length) {
    const char = source[position]
    if (/\s/.test(char)) {
      position++
      continue
    }

    if (char === "'" || char === '"') {
      const start = position
      const quote = char
      let value = ""
      position++
      let closed = false

      while (position < source.length) {
        const current = source[position++]
        if (current === quote) {
          closed = true
          break
        }
        if (current === "\\") {
          if (position >= source.length) break
          const escaped = source[position++]
          value += escaped === "n" ? "\n" : escaped
        } else {
          value += current
        }
      }

      if (!closed) throw new ExpressionSyntaxError(`texto não terminado na posição ${start}`)
      tokens.push({ kind: "string", value, position: start })
      continue
    }

    const number = source.slice(position).match(/^(?:\d+\.\d*|\.\d+|\d+)/)
    if (number) {
      tokens.push({ kind: "number", value: number[0], position })
      position += number[0].length
      continue
    }

    const identifier = source.slice(position).match(/^[a-zA-Z_]\w*/)
    if (identifier) {
      const value = identifier[0]
      const normalized = value.toLowerCase()
      const kind: TokenKind = normalized === "verdadeiro" || normalized === "falso"
        ? "boolean"
        : normalized === "e" || normalized === "ou" || normalized === "nao"
          ? "operator"
          : "identifier"
      tokens.push({ kind, value: kind === "operator" || kind === "boolean" ? normalized : value, position })
      position += value.length
      continue
    }

    const operator = source.slice(position).match(/^(<=|>=|==|!=|[+\-*/%<>=])/)
    if (operator) {
      tokens.push({ kind: "operator", value: operator[0], position })
      position += operator[0].length
      continue
    }

    if (char === "(" || char === ")" || char === "[" || char === "]") {
      tokens.push({ kind: "punctuation", value: char, position })
      position++
      continue
    }

    throw new ExpressionSyntaxError(`token '${char}' não permitido na posição ${position}`)
  }

  tokens.push({ kind: "eof", value: "", position })
  return tokens
}

class Parser {
  private position = 0

  constructor(private readonly tokens: Token[]) {}

  parse(): ExpressionNode {
    const expression = this.parseOr()
    this.expect("eof")
    return expression
  }

  private parseOr(): ExpressionNode {
    return this.parseBinary(() => this.matchesOperator("ou"), () => this.parseAnd())
  }

  private parseAnd(): ExpressionNode {
    return this.parseBinary(() => this.matchesOperator("e"), () => this.parseComparison())
  }

  private parseComparison(): ExpressionNode {
    return this.parseBinary(
      () => this.matchesOperator("<", "<=", ">", ">=", "=", "==", "!="),
      () => this.parseAdditive(),
    )
  }

  private parseAdditive(): ExpressionNode {
    return this.parseBinary(() => this.matchesOperator("+", "-"), () => this.parseMultiplicative())
  }

  private parseMultiplicative(): ExpressionNode {
    return this.parseBinary(() => this.matchesOperator("*", "/", "%"), () => this.parseUnary())
  }

  private parseBinary(matches: () => boolean, parseOperand: () => ExpressionNode): ExpressionNode {
    let node = parseOperand()
    while (matches()) {
      const operator = this.previous().value
      node = { kind: "binary", operator, left: node, right: parseOperand() }
    }
    return node
  }

  private parseUnary(): ExpressionNode {
    if (this.matchesOperator("-", "nao")) {
      const operator = this.previous().value as "-" | "nao"
      return { kind: "unary", operator, operand: this.parseUnary() }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): ExpressionNode {
    const token = this.current()
    if (this.matches("number")) return { kind: "literal", value: Number(token.value) }
    if (this.matches("string")) return { kind: "literal", value: token.value }
    if (this.matches("boolean")) return { kind: "literal", value: token.value === "verdadeiro" }

    if (this.matches("identifier")) {
      const name = token.value
      if (!this.matchesPunctuation("[")) return { kind: "variable", name }
      const index = this.parseOr()
      this.expectPunctuation("]")
      return { kind: "arrayAccess", name, index }
    }

    if (this.matchesPunctuation("(")) {
      const expression = this.parseOr()
      this.expectPunctuation(")")
      return expression
    }

    throw this.unexpected(token)
  }

  private matches(kind: TokenKind): boolean {
    if (this.current().kind !== kind) return false
    this.position++
    return true
  }

  private matchesOperator(...operators: string[]): boolean {
    const token = this.current()
    if (token.kind !== "operator" || !operators.includes(token.value)) return false
    this.position++
    return true
  }

  private matchesPunctuation(value: string): boolean {
    const token = this.current()
    if (token.kind !== "punctuation" || token.value !== value) return false
    this.position++
    return true
  }

  private expect(kind: TokenKind): void {
    if (!this.matches(kind)) throw this.unexpected(this.current())
  }

  private expectPunctuation(value: string): void {
    if (!this.matchesPunctuation(value)) throw this.unexpected(this.current())
  }

  private current(): Token {
    return this.tokens[this.position]
  }

  private previous(): Token {
    return this.tokens[this.position - 1]
  }

  private unexpected(token: Token): ExpressionSyntaxError {
    const found = token.kind === "eof" ? "fim da expressão" : `'${token.value}'`
    return new ExpressionSyntaxError(`token inesperado ${found} na posição ${token.position}`)
  }
}
