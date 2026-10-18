import type { IMemory } from "../interfaces/memory"
import {
  ExpressionSyntaxError,
  parseExpression,
  type ExpressionNode,
  type ExpressionValue,
} from "./ExpressionParser"
import { ERROR_TYPES, ExecutionError, classifyError } from "./errors"
import { isValidType, type VarType } from "./types"
import { TypeMismatch, comparisonMismatch, formatValue, fromStored, normalizeNumber, toStored } from "./values"

const COMPARISONS = new Set(["<", "<=", ">", ">=", "=", "==", "!="])

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
      // The target is checked first: in "1 = x" the problem is the 1, not x.
      this.checkTarget(target.trim(), blockId)
      const stored = this.store(target, this.evaluateSource(src, blockId), blockId)
      return `${target.trim()} = ${stored}`
    })
  }

  /**
   * Writes a value into a declared variable or vector element, checked
   * against its declared type. Using a variable that the memory block never
   * declared is an error (RN09), so a typo cannot create a new one silently.
   */
  store(target: string, value: ExpressionValue, blockId: string | null): string {
    const trimmed = target.trim()
    this.checkTarget(trimmed, blockId)
    const indexTarget = trimmed.match(/^([a-zA-Z_]\w*)\[(.+)\]$/)
    const name = indexTarget ? indexTarget[1] : trimmed

    const type = this.declaredType(name, blockId)
    const stored = this.checkType(() => toStored(value, type, trimmed), blockId)

    if (indexTarget) {
      const index = this.indexValue(this.evaluateSource(indexTarget[2], blockId), blockId)
      this.runWithExecutionError(blockId, () => this.memory.setIndex(name, index, stored))
    } else {
      this.runWithExecutionError(blockId, () => this.memory.set(name, stored))
    }
    return stored
  }

  private checkTarget(target: string, blockId: string | null): void {
    if (!/^[a-zA-Z_]\w*(\[.+\])?$/.test(target)) {
      throw this.invalidExpression(`destino de atribuição inválido: ${target}`, blockId)
    }
  }

  /** Declared type of a variable or of the vector a target such as `notas[i]` points into. */
  typeOf(target: string): VarType | null {
    const name = target.trim().replace(/\[.*\]$/, "")
    const type = this.memory.getType(name)
    return type !== null && isValidType(type) ? type : null
  }

  condition(expr: string, blockId: string | null): boolean {
    const value = this.evaluateSource(expr, blockId)
    if (typeof value !== "boolean") {
      throw new ExecutionError(
        ERROR_TYPES.TYPE_MISMATCH,
        `A condição '${expr}' deve resultar em verdadeiro ou falso, mas resultou em ${formatValue(value)}`,
        blockId,
      )
    }
    return value
  }

  output(expr: string, blockId: string | null): string {
    return formatValue(this.evaluateSource(expr, blockId))
  }

  /** Evaluates an expression keeping its type, for callers that store the result elsewhere. */
  value(expr: string, blockId: string | null): ExpressionValue {
    return this.evaluateSource(expr, blockId)
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
        return node.operator === "nao" ? !this.toBoolean(value, blockId) : this.toNumber(value, blockId) * -1
      }
      case "binary":
        return this.evaluateBinary(node, blockId)
    }
  }

  private evaluateBinary(node: Extract<ExpressionNode, { kind: "binary" }>, blockId: string | null): ExpressionValue {
    const left = this.evaluate(node.left, blockId)
    if (node.operator === "e" && !this.toBoolean(left, blockId)) return false
    if (node.operator === "ou" && this.toBoolean(left, blockId)) return true

    const right = this.evaluate(node.right, blockId)
    if (COMPARISONS.has(node.operator)) return this.compare(node.operator, left, right, blockId)
    switch (node.operator) {
      case "e": return this.toBoolean(right, blockId)
      case "ou": return this.toBoolean(right, blockId)
      case "+":
        if (typeof left === "string" || typeof right === "string") return `${formatValue(left)}${formatValue(right)}`
        return this.toNumber(left, blockId) + this.toNumber(right, blockId)
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
      default: throw this.invalidExpression(`operador '${node.operator}' não permitido`, blockId)
    }
  }

  /**
   * Numbers are compared at the 15 significant digits a real keeps in
   * memory, so 0.1 + 0.2 == 0.3 holds on the spot just as it does once
   * stored. The arithmetic before the comparison keeps full precision.
   */
  private compare(operator: string, left: ExpressionValue, right: ExpressionValue, blockId: string | null): boolean {
    const mismatch = comparisonMismatch(left, right)
    if (mismatch) throw new ExecutionError(ERROR_TYPES.TYPE_MISMATCH, `Tipo incompatível: ${mismatch}`, blockId)
    const a = typeof left === "number" ? normalizeNumber(left) : left
    const b = typeof right === "number" ? normalizeNumber(right) : right
    switch (operator) {
      case "<": return a < b
      case "<=": return a <= b
      case ">": return a > b
      case ">=": return a >= b
      case "!=": return a !== b
      case "=":
      case "==": return a === b
      default: throw this.invalidExpression(`operador '${operator}' não permitido`, blockId)
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

  /** Reads stored text as its declared type, so a caractere "12" stays text. */
  private valueFromMemory(name: string, value: string, blockId: string | null): ExpressionValue {
    const type = this.declaredType(name, blockId)
    return this.checkType(() => fromStored(value, type), blockId)
  }

  private declaredType(name: string, blockId: string | null): VarType {
    if (!this.memory.has(name)) {
      throw new ExecutionError(ERROR_TYPES.UNDECLARED_VARIABLE, `Variável '${name}' não declarada`, blockId)
    }
    const type = this.memory.getType(name)
    if (type === null || !isValidType(type)) {
      throw new ExecutionError(ERROR_TYPES.INVALID_TYPE, `Tipo inválido: '${type}'`, blockId)
    }
    return type
  }

  private checkType<T>(action: () => T, blockId: string | null): T {
    try {
      return action()
    } catch (error) {
      if (error instanceof TypeMismatch) {
        throw new ExecutionError(ERROR_TYPES.TYPE_MISMATCH, `Tipo incompatível: ${error.message}`, blockId)
      }
      throw error
    }
  }

  private indexValue(value: ExpressionValue, blockId: string | null): number {
    const index = this.toNumber(value, blockId)
    if (!Number.isInteger(index)) {
      throw this.invalidExpression("índice de vetor deve ser um inteiro", blockId)
    }
    return index
  }

  private toBoolean(value: ExpressionValue, blockId: string | null): boolean {
    if (typeof value !== "boolean") {
      throw new ExecutionError(
        ERROR_TYPES.TYPE_MISMATCH,
        `Tipo incompatível: valor lógico esperado, recebido '${formatValue(value)}'`,
        blockId,
      )
    }
    return value
  }

  /** Arithmetic only takes numbers: a caractere "12" or a logical value is not silently converted. */
  private toNumber(value: ExpressionValue, blockId: string | null): number {
    if (typeof value !== "number") {
      throw new ExecutionError(
        ERROR_TYPES.TYPE_MISMATCH,
        `Tipo incompatível: valor numérico esperado, recebido '${formatValue(value)}'`,
        blockId,
      )
    }
    return value
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
