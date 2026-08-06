import { describe, it, expect } from "vitest"
import { ExprEvaluator } from "../../engine/ExprEvaluator"
import type { IMemory } from "../../interfaces/memory"
import type { IVariable } from "../../interfaces/execution"

class TestMemory implements IMemory {
  private data = new Map<string, { type: string; value: string | null }>()
  private arrays = new Map<string, (string | null)[]>()

  has(name: string): boolean { return this.data.has(name) || this.arrays.has(name) }
  get(name: string): string | null {
    return this.data.get(name)?.value ?? null
  }
  set(name: string, value: string): void {
    const entry = this.data.get(name)
    if (entry) entry.value = value
  }
  declare(name: string, type: string): void {
    const arrayMatch = name.match(/^(\w+)\[(\d+)\]$/)
    if (arrayMatch) {
      const varName = arrayMatch[1]
      const size = parseInt(arrayMatch[2], 10)
      this.data.set(varName, { type, value: null })
      this.arrays.set(varName, new Array<string | null>(size).fill(null))
    } else {
      this.data.set(name, { type, value: null })
    }
  }
  isDeclared(name: string): boolean { return this.data.has(name) }
  isInitialized(name: string): boolean {
    return this.data.get(name)?.value !== null
  }
  getType(name: string): string | null {
    return this.data.get(name)?.type ?? null
  }
  setIndex(arrayName: string, index: number, value: string): void {
    const arr = this.arrays.get(arrayName)
    if (arr && index >= 0 && index < arr.length) arr[index] = value
  }
  getIndex(arrayName: string, index: number): string | null {
    return this.arrays.get(arrayName)?.[index] ?? null
  }
  getLength(arrayName: string): number {
    return this.arrays.get(arrayName)?.length ?? 0
  }
  snapshot(): IVariable[] {
    return Array.from(this.data.entries()).map(([k, v]) => ({
      name: k, value: v.value, type: v.type, scope: "global",
    }))
  }
  reset(): void { this.data.clear(); this.arrays.clear() }
}

function setup(vars: Record<string, string>): ExprEvaluator {
  const mem = new TestMemory()
  for (const [k, v] of Object.entries(vars)) {
    mem.declare(k, "desconhecido")
    mem.set(k, v)
  }
  return new ExprEvaluator(mem)
}

describe("ExprEvaluator", () => {
  describe("arithmetic", () => {
    it("a + b", () => {
      const e = setup({ a: "10", b: "20" })
      expect(e.output("a + b")).toBe("30")
    })

    it("a - b", () => {
      const e = setup({ a: "50", b: "3" })
      expect(e.output("a - b")).toBe("47")
    })

    it("a * b", () => {
      const e = setup({ a: "6", b: "7" })
      expect(e.output("a * b")).toBe("42")
    })

    it("a / b", () => {
      const e = setup({ a: "10", b: "3" })
      expect(Number(e.output("a / b")).toFixed(2)).toBe("3.33")
    })

    it("floats", () => {
      const e = setup({ a: "3.5", b: "2.1" })
      expect(Number(e.output("a + b"))).toBeCloseTo(5.6, 1)
    })

    it("integers and floats mixed", () => {
      const e = setup({ a: "10", b: "2.5" })
      expect(e.output("a * b")).toBe("25")
    })
  })

  describe("parentheses", () => {
    it("(a + b) * c", () => {
      const e = setup({ a: "2", b: "3", c: "4" })
      expect(e.output("(a + b) * c")).toBe("20")
    })

    it("nested parentheses", () => {
      const e = setup({ a: "2", b: "3", c: "4" })
      expect(e.output("((a + b) * c)")).toBe("20")
    })
  })

  describe("relational", () => {
    it("> true", () => {
      const e = setup({ a: "10", b: "5" })
      expect(e.condition("a > b")).toBe(true)
    })

    it("> false", () => {
      const e = setup({ a: "3", b: "5" })
      expect(e.condition("a > b")).toBe(false)
    })

    it(">= true (equal)", () => {
      const e = setup({ a: "5", b: "5" })
      expect(e.condition("a >= b")).toBe(true)
    })

    it(">= true (greater)", () => {
      const e = setup({ a: "10", b: "5" })
      expect(e.condition("a >= b")).toBe(true)
    })

    it(">= false", () => {
      const e = setup({ a: "3", b: "5" })
      expect(e.condition("a >= b")).toBe(false)
    })

    it("< true", () => {
      const e = setup({ a: "3", b: "5" })
      expect(e.condition("a < b")).toBe(true)
    })

    it("<= true (equal)", () => {
      const e = setup({ a: "5", b: "5" })
      expect(e.condition("a <= b")).toBe(true)
    })

    it("= (comparison) true", () => {
      const e = setup({ a: "5", b: "5" })
      expect(e.condition("a = b")).toBe(true)
    })

    it("= (comparison) false", () => {
      const e = setup({ a: "5", b: "3" })
      expect(e.condition("a = b")).toBe(false)
    })

    it("== (comparison) true", () => {
      const e = setup({ a: "5", b: "5" })
      expect(e.condition("a == b")).toBe(true)
    })

    it("!= true", () => {
      const e = setup({ a: "5", b: "3" })
      expect(e.condition("a != b")).toBe(true)
    })

    it("!= false", () => {
      const e = setup({ a: "5", b: "5" })
      expect(e.condition("a != b")).toBe(false)
    })
  })

  describe("logical Portugol", () => {
    it("'e' (and) true", () => {
      const e = setup({ a: "5", b: "3" })
      expect(e.condition("a > 0 e b > 0")).toBe(true)
    })

    it("'e' (and) false", () => {
      const e = setup({ a: "5", b: "0" })
      expect(e.condition("a > 0 e b > 0")).toBe(false)
    })

    it("'ou' (or) true", () => {
      const e = setup({ a: "5", b: "0" })
      expect(e.condition("a > 0 ou b > 0")).toBe(true)
    })

    it("'ou' (or) false", () => {
      const e = setup({ a: "0", b: "0" })
      expect(e.condition("a > 0 ou b > 0")).toBe(false)
    })

    it("'nao' with parentheses", () => {
      const e = setup({ a: "0" })
      expect(e.condition("nao (a > 0)")).toBe(true)
    })

    it("'nao' + 'e' mixed", () => {
      const e = setup({ a: "0", b: "5" })
      expect(e.condition("nao (a > 0) e b > 0")).toBe(true)
    })
  })

  describe("boolean literals", () => {
    it("verdadeiro in condition", () => {
      const e = setup({})
      expect(e.condition("verdadeiro")).toBe(true)
    })

    it("falso in condition", () => {
      const e = setup({})
      expect(e.condition("falso")).toBe(false)
    })

    it("verdadeiro in output", () => {
      const e = setup({})
      expect(e.output("verdadeiro")).toBe("true")
    })

    it("falso in output", () => {
      const e = setup({})
      expect(e.output("falso")).toBe("false")
    })
  })

  describe("strings", () => {
    it("concat with double-quoted literal", () => {
      const e = setup({ nome: "João" })
      expect(e.output('"Olá, " + nome')).toBe("Olá, João")
    })

    it("concat with single-quoted literal", () => {
      const e = setup({ nome: "Maria" })
      expect(e.output("'Olá, ' + nome")).toBe("Olá, Maria")
    })
  })

  describe("assignment", () => {
    it("simple", () => {
      const e = setup({ x: "0" })
      const changes = e.assign("x = 10")
      expect(e.output("x")).toBe("10")
      expect(changes).toEqual(["x = 10"])
    })

    it("with expression", () => {
      const e = setup({ x: "0", y: "5" })
      e.assign("x = y + 10")
      expect(e.output("x")).toBe("15")
    })

    it("multiple statements", () => {
      const e = setup({ a: "0", b: "0" })
      e.assign("a = 1; b = 2")
      expect(e.output("a")).toBe("1")
      expect(e.output("b")).toBe("2")
    })

    it("auto-declares undeclared variable", () => {
      const e = setup({})
      e.assign("x = 42")
      expect(e.output("x")).toBe("42")
    })

    it("assigns to array index", () => {
      const mem = new TestMemory()
      mem.declare("notas[5]", "inteiro")
      const ev = new ExprEvaluator(mem)
      ev.assign("notas[0] = 10")
      expect(ev.output("notas[0]")).toBe("10")
    })

    it("assigns to array index with index variable", () => {
      const mem = new TestMemory()
      mem.declare("notas[5]", "inteiro")
      mem.declare("i", "inteiro")
      mem.set("i", "0")
      const ev = new ExprEvaluator(mem)
      ev.assign("notas[i] = 7")
      expect(ev.output("notas[0]")).toBe("7")
    })
  })

  describe("errors", () => {
    it("undeclared variable", () => {
      const e = setup({})
      expect(() => e.output("x + 1")).toThrow("não declarada")
    })

    it("uninitialized variable", () => {
      const mem = new TestMemory()
      mem.declare("x", "inteiro")
      const ev = new ExprEvaluator(mem)
      expect(() => ev.output("x + 1")).toThrow("não inicializada")
    })
  })

  describe("mixed expressions", () => {
    it("(a + b) * c - a / b", () => {
      const e = setup({ a: "10", b: "5", c: "2" })
      expect(e.output("(a + b) * c - a / b")).toBe("28")
    })
  })

  describe("array access", () => {
    it("literal index", () => {
      const mem = new TestMemory()
      mem.declare("notas[5]", "inteiro")
      mem.setIndex("notas", 0, "10")
      const ev = new ExprEvaluator(mem)
      expect(ev.output("notas[0]")).toBe("10")
    })
  })
})
