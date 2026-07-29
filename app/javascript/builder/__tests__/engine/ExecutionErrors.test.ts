import { describe, it, expect } from "vitest"
import {
  ERROR_TYPES,
  detectDivisionByZero,
  checkValidExpression,
  classifyError,
  buildDivByZeroError,
  type IExecutionError,
  type ExecutionErrorType,
} from "../../engine/errors"

describe("detectDivisionByZero", () => {
  it("detects literal division by zero", () => {
    expect(detectDivisionByZero("10 / 0")).toBe(true)
  })

  it("detects division by zero with computed denominator", () => {
    expect(detectDivisionByZero("(10 + 5) / (3 - 3)")).toBe(true)
  })

  it("detects 0.0 as division by zero", () => {
    expect(detectDivisionByZero("5 / 0.0")).toBe(true)
  })

  it("does not flag division by non-zero", () => {
    expect(detectDivisionByZero("10 / 5")).toBe(false)
  })

  it("does not flag division by decimal", () => {
    expect(detectDivisionByZero("10 / 0.5")).toBe(false)
  })

  it("does not flag division by numbers ending in 0", () => {
    expect(detectDivisionByZero("10 / 20")).toBe(false)
  })

  it("returns false for expression without division", () => {
    expect(detectDivisionByZero("10 + 5")).toBe(false)
  })
})

describe("checkValidExpression", () => {
  it("returns null for valid expression", () => {
    expect(checkValidExpression("10 + 5", null)).toBeNull()
  })

  it("returns error for invalid expression", () => {
    const result = checkValidExpression("10 +", "n1")
    expect(result).not.toBeNull()
    expect(result!.type).toBe(ERROR_TYPES.INVALID_EXPRESSION)
    expect(result!.blockId).toBe("n1")
    expect(result!.message).toContain("Expressão inválida")
  })

  it("returns error for malformed parentheses", () => {
    const result = checkValidExpression("(10 + 5", null)
    expect(result).not.toBeNull()
    expect(result!.type).toBe(ERROR_TYPES.INVALID_EXPRESSION)
  })
})

describe("buildDivByZeroError", () => {
  it("returns structured error with blockId", () => {
    const err = buildDivByZeroError("n3")
    expect(err.type).toBe(ERROR_TYPES.DIVISION_BY_ZERO)
    expect(err.message).toBe("Divisão por zero detectada")
    expect(err.blockId).toBe("n3")
  })

  it("returns structured error with null blockId", () => {
    const err = buildDivByZeroError(null)
    expect(err.blockId).toBeNull()
  })
})

describe("classifyError", () => {
  it("classifies undeclared variable", () => {
    const err = classifyError(new Error("Variável 'x' não declarada"), "n1")
    expect(err.type).toBe(ERROR_TYPES.UNDECLARED_VARIABLE)
    expect(err.blockId).toBe("n1")
  })

  it("classifies uninitialized variable", () => {
    const err = classifyError(new Error("Variável 'x' não inicializada"), null)
    expect(err.type).toBe(ERROR_TYPES.UNINITIALIZED_VARIABLE)
  })

  it("classifies out of bounds", () => {
    const err = classifyError(new Error("Índice 10 fora dos limites"), null)
    expect(err.type).toBe(ERROR_TYPES.OUT_OF_BOUNDS)
  })

  it("classifies max steps exceeded", () => {
    const err = classifyError(new Error("Limite de passos excedido"), null)
    expect(err.type).toBe(ERROR_TYPES.MAX_STEPS_EXCEEDED)
  })

  it("classifies unknown block", () => {
    const err = classifyError(new Error("Bloco desconhecido: 'foo'"), null)
    expect(err.type).toBe(ERROR_TYPES.UNKNOWN_BLOCK)
  })

  it("classifies invalid type", () => {
    const err = classifyError(new Error("Tipo inválido: 'coisa'"), null)
    expect(err.type).toBe(ERROR_TYPES.INVALID_TYPE)
  })

  it("classifies division by zero", () => {
    const err = classifyError(new Error("Divisão por zero detectada"), null)
    expect(err.type).toBe(ERROR_TYPES.DIVISION_BY_ZERO)
  })

  it("classifies invalid expression", () => {
    const err = classifyError(new Error("Expressão inválida: 10 +"), null)
    expect(err.type).toBe(ERROR_TYPES.INVALID_EXPRESSION)
  })

  it("falls back to INVALID_EXPRESSION for unknown messages", () => {
    const err = classifyError(new Error("Erro misterioso"), null)
    expect(err.type).toBe(ERROR_TYPES.INVALID_EXPRESSION)
  })

  it("handles non-Error objects", () => {
    const err = classifyError("string error", null)
    expect(err.type).toBe(ERROR_TYPES.INVALID_EXPRESSION)
    expect(err.message).toBe("Erro desconhecido")
  })
})
