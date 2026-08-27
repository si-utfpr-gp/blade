import { parseExpression, type ExpressionNode } from "./ExpressionParser"

export const ERROR_TYPES = {
  UNDECLARED_VARIABLE: "UNDECLARED_VARIABLE",
  UNINITIALIZED_VARIABLE: "UNINITIALIZED_VARIABLE",
  OUT_OF_BOUNDS: "OUT_OF_BOUNDS",
  DIVISION_BY_ZERO: "DIVISION_BY_ZERO",
  INVALID_EXPRESSION: "INVALID_EXPRESSION",
  INVALID_TYPE: "INVALID_TYPE",
  MAX_STEPS_EXCEEDED: "MAX_STEPS_EXCEEDED",
  UNKNOWN_BLOCK: "UNKNOWN_BLOCK",
  SUBROUTINE_CONTRACT: "SUBROUTINE_CONTRACT",
} as const

export type ExecutionErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES]

export interface IExecutionError {
  type: ExecutionErrorType
  message: string
  blockId: string | null
}

export class ExecutionError extends Error implements IExecutionError {
  constructor(
    public readonly type: ExecutionErrorType,
    message: string,
    public readonly blockId: string | null,
  ) {
    super(message)
    this.name = "ExecutionError"
  }
}

/**
 * Checks constant divisions with the same restricted grammar used by the
 * evaluator. Variables intentionally return false here because their values
 * are only available at execution time.
 */
export function detectDivisionByZero(expression: string): boolean {
  try {
    return containsDivisionByZero(parseExpression(expression))
  } catch {
    return false
  }
}

export function checkValidExpression(expr: string, blockId: string | null): IExecutionError | null {
  try {
    parseExpression(expr)
    return null
  } catch {
    return {
      type: ERROR_TYPES.INVALID_EXPRESSION,
      message: `Expressão inválida: ${expr}`,
      blockId,
    }
  }
}

function errorTypeFor(message: string): ExecutionErrorType {
  const map: Record<string, ExecutionErrorType> = {
    "não declarada": ERROR_TYPES.UNDECLARED_VARIABLE,
    "não inicializada": ERROR_TYPES.UNINITIALIZED_VARIABLE,
    "fora dos limites": ERROR_TYPES.OUT_OF_BOUNDS,
    "Limite de passos": ERROR_TYPES.MAX_STEPS_EXCEEDED,
    "Bloco desconhecido": ERROR_TYPES.UNKNOWN_BLOCK,
    "Sub-rotina": ERROR_TYPES.SUBROUTINE_CONTRACT,
    "Chamada de sub-rotina": ERROR_TYPES.SUBROUTINE_CONTRACT,
    "Retorno da sub-rotina": ERROR_TYPES.SUBROUTINE_CONTRACT,
    "Tipo inválido": ERROR_TYPES.INVALID_TYPE,
    "Divisão por zero": ERROR_TYPES.DIVISION_BY_ZERO,
    "Expressão inválida": ERROR_TYPES.INVALID_EXPRESSION,
  }

  const matched = Object.entries(map).find(([key]) => message.includes(key))
  return matched ? matched[1] : ERROR_TYPES.INVALID_EXPRESSION
}

export function buildDivByZeroError(blockId: string | null): IExecutionError {
  return { type: ERROR_TYPES.DIVISION_BY_ZERO, message: "Divisão por zero detectada", blockId }
}

export function classifyError(e: unknown, blockId: string | null): IExecutionError {
  if (e instanceof ExecutionError) return e

  const message = e instanceof Error ? e.message : "Erro desconhecido"
  return { type: errorTypeFor(message), message, blockId }
}

function containsDivisionByZero(node: ExpressionNode): boolean {
  if (node.kind === "unary") return containsDivisionByZero(node.operand)
  if (node.kind !== "binary") return false
  if (node.operator === "/" && constantNumber(node.right) === 0) return true
  return containsDivisionByZero(node.left) || containsDivisionByZero(node.right)
}

function constantNumber(node: ExpressionNode): number | null {
  if (node.kind === "literal") return typeof node.value === "number" ? node.value : null
  if (node.kind === "unary") {
    const operand = constantNumber(node.operand)
    return operand === null || node.operator !== "-" ? null : -operand
  }
  if (node.kind !== "binary") return null

  const left = constantNumber(node.left)
  const right = constantNumber(node.right)
  if (left === null || right === null) return null
  switch (node.operator) {
    case "+": return left + right
    case "-": return left - right
    case "*": return left * right
    case "/": return right === 0 ? null : left / right
    case "%": return right === 0 ? null : left % right
    default: return null
  }
}
