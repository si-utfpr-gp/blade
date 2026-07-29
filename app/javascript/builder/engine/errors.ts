export const ERROR_TYPES = {
  UNDECLARED_VARIABLE: "UNDECLARED_VARIABLE",
  UNINITIALIZED_VARIABLE: "UNINITIALIZED_VARIABLE",
  OUT_OF_BOUNDS: "OUT_OF_BOUNDS",
  DIVISION_BY_ZERO: "DIVISION_BY_ZERO",
  INVALID_EXPRESSION: "INVALID_EXPRESSION",
  INVALID_TYPE: "INVALID_TYPE",
  MAX_STEPS_EXCEEDED: "MAX_STEPS_EXCEEDED",
  UNKNOWN_BLOCK: "UNKNOWN_BLOCK",
} as const

export type ExecutionErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES]

export interface IExecutionError {
  type: ExecutionErrorType
  message: string
  blockId: string | null
}

export function detectDivisionByZero(resolvedExpr: string): boolean {
  const cleaned = resolvedExpr.replace(/\s+/g, "")
  if (/\/0(?:\.0+)?(?![.\d])/.test(cleaned)) return true
  try {
    const result = new Function(`return (${resolvedExpr})`)()
    return typeof result === "number" && !Number.isFinite(result)
  } catch {
    return false
  }
}

export function checkValidExpression(expr: string, blockId: string | null): IExecutionError | null {
  try {
    new Function(`return (${expr})`)
    return null
  } catch {
    return { type: ERROR_TYPES.INVALID_EXPRESSION, message: `Expressão inválida: ${expr}`, blockId }
  }
}

export function buildDivByZeroError(blockId: string | null): IExecutionError {
  return { type: ERROR_TYPES.DIVISION_BY_ZERO, message: "Divisão por zero detectada", blockId }
}

export function classifyError(e: unknown, blockId: string | null): IExecutionError {
  const message = e instanceof Error ? e.message : "Erro desconhecido"

  const map: Record<string, ExecutionErrorType> = {
    "não declarada": ERROR_TYPES.UNDECLARED_VARIABLE,
    "não inicializada": ERROR_TYPES.UNINITIALIZED_VARIABLE,
    "fora dos limites": ERROR_TYPES.OUT_OF_BOUNDS,
    "Limite de passos": ERROR_TYPES.MAX_STEPS_EXCEEDED,
    "Bloco desconhecido": ERROR_TYPES.UNKNOWN_BLOCK,
    "Tipo inválido": ERROR_TYPES.INVALID_TYPE,
    "Divisão por zero": ERROR_TYPES.DIVISION_BY_ZERO,
    "Expressão inválida": ERROR_TYPES.INVALID_EXPRESSION,
  }

  const matched = Object.entries(map).find(([key]) => message.includes(key))
  const type = matched ? matched[1] : ERROR_TYPES.INVALID_EXPRESSION

  return { type, message, blockId }
}
