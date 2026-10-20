import { describe, it, expect } from "vitest"
import { isHistoryWorthy } from "../../components/constructor/useDiagramHistory"

// Blocks cannot be resized by hand, so a size change is the canvas measuring
// what it drew. Recording it left Undo enabled right after opening a diagram.
describe("isHistoryWorthy", () => {
  it("não registra a medição de tamanho dos blocos", () => {
    expect(isHistoryWorthy([{ type: "dimensions" }])).toBe(false)
  })

  it("continua registrando remoções e o fim de um arraste", () => {
    expect(isHistoryWorthy([{ type: "remove" }])).toBe(true)
    expect(isHistoryWorthy([{ type: "position", dragging: false }])).toBe(true)
  })
})
