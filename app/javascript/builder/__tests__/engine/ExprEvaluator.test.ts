import { describe, it, expect } from "vitest"
import { ExprEvaluator } from "../../engine/ExprEvaluator"
import type { IMemory } from "../../interfaces/memory"

class TestMemory implements IMemory {
  private data = new Map<string, { type: string; value: string | null }>()

  private stripIndex(k: string): string {
    return k.replace(/\[\d+\]$/, "")
  }

  has(name: string): boolean { return this.data.has(this.stripIndex(name)) }
  get(name: string): string | null {
    return this.data.get(this.stripIndex(name))?.value ?? null
  }
  set(name: string, value: string): void {
    const key = this.stripIndex(name)
    const entry = this.data.get(key)
    if (entry) entry.value = value
  }
  declare(name: string, type: string): void {
    this.data.set(this.stripIndex(name), { type, value: null })
  }
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
      mem.set("notas[0]", "10")
      const ev = new ExprEvaluator(mem)
      expect(ev.output("notas[0]")).toBe("10")
    })
  })
})
