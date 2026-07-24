import { describe, it, expect } from "vitest"
import { MemoryManager } from "../../engine/MemoryManager"

describe("MemoryManager", () => {
  // --- declare ---

  it("declares a simple variable", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    expect(mm.isDeclared("x")).toBe(true)
    expect(mm.getType("x")).toBe("inteiro")
    expect(mm.get("x")).toBeNull()
  })

  it("rejects invalid type", () => {
    const mm = new MemoryManager()
    expect(() => mm.declare("x", "invalido")).toThrow("Tipo inválido")
  })

  it("declares array variable", () => {
    const mm = new MemoryManager()
    mm.declare("notas[5]", "real")
    expect(mm.isDeclared("notas")).toBe(true)
    expect(mm.getType("notas")).toBe("real")
    expect(mm.getLength("notas")).toBe(5)
  })

  it("declares array and rejects invalid size", () => {
    const mm = new MemoryManager()
    expect(() => mm.declare("x[0]", "inteiro")).toThrow("Tamanho de array inválido")
    expect(() => mm.declare("x[-1]", "inteiro")).toThrow("Tamanho de array inválido")
  })

  it("does not redeclare existing variable", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    mm.declare("x", "real")
    expect(mm.getType("x")).toBe("inteiro")
  })

  // --- set / get ---

  it("sets and gets a simple variable", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    mm.set("x", "10")
    expect(mm.get("x")).toBe("10")
  })

  it("throws on set for undeclared variable", () => {
    const mm = new MemoryManager()
    expect(() => mm.set("x", "10")).toThrow("não declarada")
  })

  it("throws on get for undeclared variable", () => {
    const mm = new MemoryManager()
    expect(() => mm.get("x")).toThrow("não declarada")
  })

  it("throws on get for array variable (must use index)", () => {
    const mm = new MemoryManager()
    mm.declare("notas[3]", "inteiro")
    expect(() => mm.get("notas")).toThrow("é um array")
  })

  it("throws on set for array variable (must use index)", () => {
    const mm = new MemoryManager()
    mm.declare("notas[3]", "inteiro")
    expect(() => mm.set("notas", "10")).toThrow("é um array")
  })

  // --- array index access ---

  it("sets and gets array element by index", () => {
    const mm = new MemoryManager()
    mm.declare("notas[3]", "inteiro")
    mm.setIndex("notas", 0, "10")
    mm.setIndex("notas", 2, "8")
    expect(mm.getIndex("notas", 0)).toBe("10")
    expect(mm.getIndex("notas", 1)).toBeNull()
    expect(mm.getIndex("notas", 2)).toBe("8")
  })

  it("throws on array index out of bounds (negative)", () => {
    const mm = new MemoryManager()
    mm.declare("notas[3]", "inteiro")
    expect(() => mm.getIndex("notas", -1)).toThrow("fora dos limites")
    expect(() => mm.setIndex("notas", -1, "10")).toThrow("fora dos limites")
  })

  it("throws on array index out of bounds (>= size)", () => {
    const mm = new MemoryManager()
    mm.declare("notas[3]", "inteiro")
    expect(() => mm.getIndex("notas", 3)).toThrow("fora dos limites")
    expect(() => mm.setIndex("notas", 3, "10")).toThrow("fora dos limites")
  })

  it("throws on getIndex for non-array variable", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    expect(() => mm.getIndex("x", 0)).toThrow("não é um array")
  })

  it("throws on setIndex for non-array variable", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    expect(() => mm.setIndex("x", 0, "10")).toThrow("não é um array")
  })

  it("throws on getIndex for undeclared array", () => {
    const mm = new MemoryManager()
    expect(() => mm.getIndex("notas", 0)).toThrow("não declarado")
  })

  it("throws on setIndex for undeclared array", () => {
    const mm = new MemoryManager()
    expect(() => mm.setIndex("notas", 0, "10")).toThrow("não declarado")
  })

  // --- getLength ---

  it("returns array length", () => {
    const mm = new MemoryManager()
    mm.declare("notas[5]", "inteiro")
    expect(mm.getLength("notas")).toBe(5)
  })

  it("returns 0 for non-array variable length", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    expect(mm.getLength("x")).toBe(0)
  })

  it("throws on getLength for undeclared variable", () => {
    const mm = new MemoryManager()
    expect(() => mm.getLength("notas")).toThrow("não declarado")
  })

  // --- isDeclared / has ---

  it("returns isDeclared correctly", () => {
    const mm = new MemoryManager()
    expect(mm.isDeclared("x")).toBe(false)
    mm.declare("x", "inteiro")
    expect(mm.isDeclared("x")).toBe(true)
  })

  it("has() mirrors isDeclared()", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    expect(mm.has("x")).toBe(true)
    expect(mm.has("y")).toBe(false)
  })

  // --- isInitialized ---

  it("returns isInitialized correctly for simple variable", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    expect(mm.isInitialized("x")).toBe(false)
    mm.set("x", "10")
    expect(mm.isInitialized("x")).toBe(true)
  })

  it("returns isInitialized correctly for array", () => {
    const mm = new MemoryManager()
    mm.declare("notas[3]", "inteiro")
    expect(mm.isInitialized("notas")).toBe(false)
    mm.setIndex("notas", 1, "10")
    expect(mm.isInitialized("notas")).toBe(true)
  })

  it("returns false for undeclared variable isInitialized", () => {
    const mm = new MemoryManager()
    expect(mm.isInitialized("x")).toBe(false)
  })

  // --- getType ---

  it("returns type of declared variable", () => {
    const mm = new MemoryManager()
    mm.declare("x", "caractere")
    expect(mm.getType("x")).toBe("caractere")
  })

  it("returns null for undeclared variable type", () => {
    const mm = new MemoryManager()
    expect(mm.getType("x")).toBeNull()
  })

  // --- snapshot ---

  it("returns empty snapshot after reset", () => {
    const mm = new MemoryManager()
    expect(mm.snapshot()).toEqual([])
  })

  it("snapshot includes simple variables", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    mm.set("x", "10")
    mm.declare("nome", "caractere")
    mm.set("nome", "João")
    const snap = mm.snapshot()
    expect(snap).toHaveLength(2)
    expect(snap).toContainEqual({ name: "x", value: "10", type: "inteiro", scope: "global" })
    expect(snap).toContainEqual({ name: "nome", value: "João", type: "caractere", scope: "global" })
  })

  it("snapshot expands array elements", () => {
    const mm = new MemoryManager()
    mm.declare("notas[3]", "real")
    mm.setIndex("notas", 0, "7.5")
    mm.setIndex("notas", 2, "9.0")
    const snap = mm.snapshot()
    expect(snap).toHaveLength(3)
    expect(snap).toContainEqual({ name: "notas[0]", value: "7.5", type: "real", scope: "global" })
    expect(snap).toContainEqual({ name: "notas[1]", value: null, type: "real", scope: "global" })
    expect(snap).toContainEqual({ name: "notas[2]", value: "9.0", type: "real", scope: "global" })
  })

  // --- reset ---

  it("clears all variables on reset", () => {
    const mm = new MemoryManager()
    mm.declare("x", "inteiro")
    mm.set("x", "10")
    mm.reset()
    expect(mm.isDeclared("x")).toBe(false)
    expect(mm.snapshot()).toEqual([])
  })
})
