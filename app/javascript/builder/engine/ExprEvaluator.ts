import type { IMemory } from "../interfaces/memory"
import {
  ExpressionSyntaxError,
  parseExpression,
  type ExpressionNode,
  type ExpressionValue,
} from "./ExpressionParser"
import { ERROR_TYPES, ExecutionError, classifyError } from "./errors"

/**
 * Evaluates the expression subset used by diagram blocks.
 *
 * Expressions are parsed as a restricted Portugol grammar and evaluated from
 * that AST. JavaScript source is never generated or executed.
 */
export class ExprEvaluator {
  constructor(private memory: IMemory) {}

  /** Executes one or more assignments separated by ';' and returns a change log. */
  assign(expr: string, blockId: string | null): string[] {
    return this.splitStatements(expr, blockId).map(s => {
      const [target, ...rest] = s.trim().split("=")
      const src = rest.join("=").trim()
      const res = String(this.evaluateSource(src, blockId))
      const indexTarget = target.trim().match(/^([a-zA-Z_]\w*)\[(.+)\]$/)
      if (indexTarget) {
        const arrName = indexTarget[1]
        const idx = this.indexValue(this.evaluateSource(indexTarget[2], blockId), blockId)
        this.runWithExecutionError(blockId, () => this.memory.setIndex(arrName, idx, res))
        return `${target.trim()} = ${res}`
      }
      const variable = target.trim()
      if (!/^[a-zA-Z_]\w*$/.test(variable)) {
        throw this.invalidExpression(`destino de atribuição inválido: ${variable}`, blockId)
      }
      if (!this.memory.has(variable)) {
        this.runWithExecutionError(blockId, () => this.memory.declare(variable, "caractere"))
      }
      this.runWithExecutionError(blockId, () => this.memory.set(variable, res))
      return `${variable} = ${res}`
    })
  }

  condition(expr: string, blockId: string | null): boolean {
    return Boolean(this.evaluateSource(expr, blockId))
  }

  output(expr: string, blockId: string | null): string {
    return String(this.evaluateSource(expr, blockId))
  }

  private evaluateSource(source: string, blockId: string | null): ExpressionValue {
    try {
      return this.evaluate(parseExpression(source), blockId)
    } catch (error) {
      if (error instanceof ExecutionError) throw error
      if (error instanceof ExpressionSyntaxError) {
        throw this.invalidExpression(error.message.replace(/^Expressão inválida: /, ""), blockId)
      }
      throw this.toExecutionError(error, blockId)
    }
  }

  private splitStatements(source: string, blockId: string | null): string[] {
    const statements: string[] = []
    let start = 0
    let quote: "'" | '"' | null = null
    let escaped = false

    for (let index = 0; index < source.length; index++) {
      const char = source[index]
      if (quote) {
        if (escaped) {
          escaped = false
          continue
        }
        if (char === "\\") {
          escaped = true
          continue
        }
        if (char === quote) quote = null
        continue
      }

      if (char === "'" || char === '"') {
        quote = char
      } else if (char === ";") {
        const statement = source.slice(start, index).trim()
        if (statement) statements.push(statement)
        start = index + 1
      }
    }

    if (quote) throw this.invalidExpression("texto não terminado", blockId)

    const lastStatement = source.slice(start).trim()
    if (lastStatement) statements.push(lastStatement)
    return statements
  }

  private evaluate(node: ExpressionNode, blockId: string | null): ExpressionValue {
    switch (node.kind) {
      case "literal":
        return node.value
      case "variable":
        return this.valueFromMemory(node.name, this.readValue(node.name, blockId), blockId)
      case "arrayAccess": {
        const index = this.indexValue(this.evaluate(node.index, blockId), blockId)
        const value = this.runWithExecutionError(blockId, () => this.memory.getIndex(node.name, index))
        if (value === null) {
          throw new ExecutionError(ERROR_TYPES.UNINITIALIZED_VARIABLE, `Variável '${node.name}' não inicializada`, blockId)
        }
        return this.valueFromMemory(node.name, value, blockId)
      }
      case "unary": {
        const value = this.evaluate(node.operand, blockId)
        return node.operator === "nao" ? !value : this.toNumber(value, blockId) * -1
      }
      case "binary":
        return this.evaluateBinary(node, blockId)
    }
  }

  private evaluateBinary(node: Extract<ExpressionNode, { kind: "binary" }>, blockId: string | null): ExpressionValue {
    const left = this.evaluate(node.left, blockId)
    if (node.operator === "e" && !left) return false
    if (node.operator === "ou" && left) return true

    const right = this.evaluate(node.right, blockId)
    switch (node.operator) {
      case "e": return Boolean(right)
      case "ou": return Boolean(right)
      case "+": return typeof left === "string" || typeof right === "string" ? `${left}${right}` : left + right
      case "-": return this.toNumber(left, blockId) - this.toNumber(right, blockId)
      case "*": return this.toNumber(left, blockId) * this.toNumber(right, blockId)
      case "/": {
        const divisor = this.toNumber(right, blockId)
        if (divisor === 0) {
          throw new ExecutionError(ERROR_TYPES.DIVISION_BY_ZERO, "Divisão por zero detectada", blockId)
        }
        return this.toNumber(left, blockId) / divisor
      }
      case "%": return this.toNumber(left, blockId) % this.toNumber(right, blockId)
      case "<": return left < right
      case "<=": return left <= right
      case ">": return left > right
      case ">=": return left >= right
      case "=":
      case "==": return left === right
      case "!=": return left !== right
      default: throw this.invalidExpression(`operador '${node.operator}' não permitido`, blockId)
    }
  }

  private readValue(name: string, blockId: string | null): string {
    if (!this.memory.has(name)) {
      throw new ExecutionError(ERROR_TYPES.UNDECLARED_VARIABLE, `Variável '${name}' não declarada`, blockId)
    }
    const value = this.runWithExecutionError(blockId, () => this.memory.get(name))
    if (value === null) {
      throw new ExecutionError(ERROR_TYPES.UNINITIALIZED_VARIABLE, `Variável '${name}' não inicializada`, blockId)
    }
    return value
  }

  private valueFromMemory(name: string, value: string, blockId: string | null): ExpressionValue {
    if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) return Number(value)
    if (value === "true") return true
    if (value === "false") return false
    if (value === null) {
      throw new ExecutionError(ERROR_TYPES.UNINITIALIZED_VARIABLE, `Variável '${name}' não inicializada`, blockId)
    }
    return value
  }

  private indexValue(value: ExpressionValue, blockId: string | null): number {
    const index = this.toNumber(value, blockId)
    if (!Number.isInteger(index)) {
      throw this.invalidExpression("índice de vetor deve ser um inteiro", blockId)
    }
    return index
  }

  private toNumber(value: ExpressionValue, blockId: string | null): number {
    const number = Number(value)
    if (Number.isNaN(number)) {
      throw this.invalidExpression(`valor numérico esperado, recebido '${value}'`, blockId)
    }
    return number
  }

  private runWithExecutionError<T>(blockId: string | null, action: () => T): T {
    try {
      return action()
    } catch (error) {
      throw this.toExecutionError(error, blockId)
    }
  }

  private toExecutionError(error: unknown, blockId: string | null): ExecutionError {
    if (error instanceof ExecutionError) return error
    const classified = classifyError(error, blockId)
    return new ExecutionError(classified.type, classified.message, classified.blockId)
  }

  private invalidExpression(detail: string, blockId: string | null): ExecutionError {
    return new ExecutionError(ERROR_TYPES.INVALID_EXPRESSION, `Expressão inválida: ${detail}`, blockId)
  }
}
