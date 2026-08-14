import { describe, it, expect } from "vitest"
import {
  ERROR_TYPES,
  detectDivisionByZero,
  checkValidExpression,
  classifyError,
  buildDivByZeroError,
} from "../../engine/errors"
import { ExecutionEngine } from "../../engine/ExecutionEngine"
import { parse } from "../../parser/parser"
import type { Node, Edge } from "@xyflow/react"

function makeGraph(nodes: Node[], edges: Edge[]) {
  return parse(nodes, edges)
}

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

describe("ExprEvaluator error integration", () => {
  it("assign throws on division by zero", () => {
    const g = makeGraph(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"process",position:{x:0,y:100},data:{label:"x = 10 / 0"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    )
    const engine = new ExecutionEngine(g)
    engine.start()
    expect(() => engine.step()).toThrow("Divisão por zero")
  })

  it("assign throws on invalid expression", () => {
    const g = makeGraph(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"process",position:{x:0,y:100},data:{label:"x = 10 +"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    )
    const engine = new ExecutionEngine(g)
    engine.start()
    expect(() => engine.step()).toThrow("Expressão inválida")
  })

  it("condition throws on division by zero", () => {
    const g = makeGraph(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"decision",position:{x:0,y:100},data:{label:"1 / 0 > 0"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    )
    const engine = new ExecutionEngine(g)
    engine.start()
    expect(() => engine.step()).toThrow("Divisão por zero")
  })

  it("output throws on invalid expression", () => {
    const g = makeGraph(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"output",position:{x:0,y:100},data:{label:"10 +"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    )
    const engine = new ExecutionEngine(g)
    engine.start()
    expect(() => engine.step()).toThrow("Expressão inválida")
  })
})

describe("ExecutionEngine error classification", () => {
  it("stores classified error in getCurrentState on undeclared variable", () => {
    const g = makeGraph(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"process",position:{x:0,y:100},data:{label:"x = y + 1"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    )
    const engine = new ExecutionEngine(g)
    engine.start()
    expect(() => engine.step()).toThrow()
    const state = engine.getCurrentState()
    expect(state.error).not.toBeNull()
    expect(state.error).toContain("não declarada")
  })

  it("engine error is null on successful execution", () => {
    const g = makeGraph(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n3",type:"startEnd",position:{x:0,y:100},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n3"}]
    )
    const engine = new ExecutionEngine(g)
    const step = engine.start()
    expect(step).not.toBeNull()
    const state = engine.getCurrentState()
    expect(state.error).toBeNull()
  })

  it("engine error is null after reset", () => {
    const g = makeGraph(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"process",position:{x:0,y:100},data:{label:"x = y + 1"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    )
    const engine = new ExecutionEngine(g)
    engine.start()
    expect(() => engine.step()).toThrow()
    engine.reset()
    const state = engine.getCurrentState()
    expect(state.error).toBeNull()
  })
})
