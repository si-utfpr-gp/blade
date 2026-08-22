import { describe, expect, it } from "vitest"
import { parseExpression } from "../../engine/ExpressionParser"

describe("parseExpression", () => {
  it("respects arithmetic and logical precedence", () => {
    expect(parseExpression("a + b * 2 e nao falso")).toMatchObject({
      kind: "binary",
      operator: "e",
      left: { kind: "binary", operator: "+" },
      right: { kind: "unary", operator: "nao" },
    })
  })

  it("parses literal and variable array indexes", () => {
    expect(parseExpression("notas[i] + notas[0]")).toMatchObject({
      kind: "binary",
      operator: "+",
      left: {
        kind: "arrayAccess",
        name: "notas",
        index: { kind: "variable", name: "i" },
      },
      right: {
        kind: "arrayAccess",
        name: "notas",
        index: { kind: "literal", value: 0 },
      },
    })
  })

  it("rejects calls and property access", () => {
    expect(() => parseExpression("fetch('x')")).toThrow("Expressão inválida")
    expect(() => parseExpression("obj.valor")).toThrow("Expressão inválida")
  })
})
