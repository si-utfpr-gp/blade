import { describe, it, expect } from "vitest"
import { diagramSignature } from "../../components/constructor/diagramSignature"

const node = (id: string, x = 0, y = 0, extra: object = {}) => ({
  id,
  type: "process",
  position: { x, y },
  data: { label: "x = 1", ...extra },
  selected: true,
  dragging: true,
  measured: { width: 100, height: 40 },
})

describe("diagramSignature", () => {
  it("ignora o estado que só o React Flow usa", () => {
    const a = diagramSignature([ node("a") ], [])
    const b = diagramSignature(
      [ { ...node("a"), selected: false, dragging: false } ],
      [],
    )

    expect(a).toBe(b)
  })

  it("muda quando um nó se move", () => {
    expect(diagramSignature([ node("a", 0) ], [])).not.toBe(
      diagramSignature([ node("a", 1) ], []),
    )
  })

  it("muda quando um rótulo é editado", () => {
    expect(diagramSignature([ node("a", 0, 0, { label: "x = 1" }) ], [])).not.toBe(
      diagramSignature([ node("a", 0, 0, { label: "x = 2" }) ], []),
    )
  })

  it("muda quando um bloco é adicionado ou removido", () => {
    expect(diagramSignature([ node("a") ], [])).not.toBe(
      diagramSignature([ node("a"), node("b") ], []),
    )
    expect(diagramSignature([], [])).not.toBe(
      diagramSignature([ node("a") ], []),
    )
  })

  it("muda quando uma conexão é criada ou removida", () => {
    const edge = { id: "e1", source: "a", target: "b" }
    expect(diagramSignature([], [])).not.toBe(
      diagramSignature([], [ edge ]),
    )
    expect(diagramSignature([], [ edge ])).not.toBe(
      diagramSignature([], [ { ...edge, target: "c" } ]),
    )
  })

  it("não depende da ordem das chaves de um mesmo nó", () => {
    const a = diagramSignature(
      [ { id: "a", type: "p", position: { x: 0, y: 0 }, data: { x: 1, y: 2 } } ],
      [],
    )
    const b = diagramSignature(
      [ { id: "a", type: "p", position: { x: 0, y: 0 }, data: { y: 2, x: 1 } } ],
      [],
    )

    expect(a).toBe(b)
  })

  it("trata um canvas vazio como um estado estável", () => {
    expect(diagramSignature([], [])).toBe(diagramSignature([], []))
  })
})