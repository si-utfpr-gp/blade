import { describe, it, expect } from "vitest"
import { nodeTypeLabel } from "../../components/simulator/labels"

describe("nodeTypeLabel", () => {
  it("returns 'Início/Fim' for startEnd", () => {
    expect(nodeTypeLabel("startEnd")).toBe("Início/Fim")
  })

  it("returns 'Memória' for memory", () => {
    expect(nodeTypeLabel("memory")).toBe("Memória")
  })

  it("returns 'Entrada' for input", () => {
    expect(nodeTypeLabel("input")).toBe("Entrada")
  })

  it("returns 'Saída' for output", () => {
    expect(nodeTypeLabel("output")).toBe("Saída")
  })

  it("returns 'Processo' for process", () => {
    expect(nodeTypeLabel("process")).toBe("Processo")
  })

  it("returns 'Decisão' for decision", () => {
    expect(nodeTypeLabel("decision")).toBe("Decisão")
  })

  it("returns 'Conector' for connector", () => {
    expect(nodeTypeLabel("connector")).toBe("Conector")
  })

  it("returns 'Sub-rotina' for subroutine", () => {
    expect(nodeTypeLabel("subroutine")).toBe("Sub-rotina")
  })

  it("returns the input unchanged for unknown types", () => {
    expect(nodeTypeLabel("unknown_type")).toBe("unknown_type")
  })
})
