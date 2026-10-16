import { describe, it, expect } from "vitest"
import { parseImportedDiagram } from "../../components/constructor/importDiagram"

const node = (overrides: object = {}) => ({
  id: "n1",
  type: "process",
  position: { x: 10, y: 20 },
  data: { label: "x = 1" },
  ...overrides,
})

const valid = {
  nodes: [node(), node({ id: "n2", data: { label: "x = 2" } })],
  edges: [{ id: "e1", source: "n1", target: "n2" }],
}

describe("parseImportedDiagram", () => {
  it("aceita um arquivo exportado pelo próprio botão", () => {
    const result = parseImportedDiagram(valid)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.diagram.nodes).toHaveLength(2)
    expect(result.diagram.edges).toHaveLength(1)
  })

  it("preserva as posições, que é o que faz o layout voltar igual", () => {
    const result = parseImportedDiagram(valid)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.diagram.nodes[0].position).toEqual({ x: 10, y: 20 })
  })

  it("recusa o que não é um objeto", () => {
    for (const input of [null, 42, "texto", []]) {
      const result = parseImportedDiagram(input)
      expect(result.ok).toBe(false)
    }
  })

  it("recusa quando faltam nós ou arestas", () => {
    expect(parseImportedDiagram({}).ok).toBe(false)
    expect(parseImportedDiagram({ nodes: [] }).ok).toBe(false)
    expect(parseImportedDiagram({ edges: [] }).ok).toBe(false)
  })

  it("descarta blocos de tipo desconhecido em vez de quebrar a tela", () => {
    const result = parseImportedDiagram({
      nodes: [node(), node({ id: "n2", type: "frobnicator" })],
      edges: [],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.diagram.nodes.map((n) => n.id)).toEqual(["n1"])
  })

  it("recusa quando não sobra nenhum bloco conhecido", () => {
    const result = parseImportedDiagram({
      nodes: [node({ type: "frobnicator" })],
      edges: [],
    })

    expect(result.ok).toBe(false)
  })

  it("descarta arestas que apontam para blocos inexistentes", () => {
    const result = parseImportedDiagram({
      nodes: [node()],
      edges: [
        { id: "e1", source: "n1", target: "fantasma" },
        { id: "e2", source: "n1", target: "n1" },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.diagram.edges.map((e) => e.id)).toEqual(["e2"])
  })

  it("descarta arestas sem origem e destino válidos", () => {
    const result = parseImportedDiagram({
      nodes: [node()],
      edges: [{ id: "e1" }, { id: "e2", source: 1, target: "n1" }],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.diagram.edges).toHaveLength(0)
  })

  it("preenche a posição que falta com a origem, como o canvas faz", () => {
    const result = parseImportedDiagram({
      nodes: [node({ position: undefined })],
      edges: [],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.diagram.nodes[0].position).toEqual({ x: 0, y: 0 })
  })

  it("garante o rótulo mesmo quando o arquivo não traz", () => {
    const result = parseImportedDiagram({
      nodes: [node({ data: {} })],
      edges: [],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.diagram.nodes[0].data.label).toBe("")
  })

  it("mantém os dados extras do bloco, como as linhas da memória", () => {
    const result = parseImportedDiagram({
      nodes: [node({ data: { label: "m", rows: [{ type: "var", variables: ["x"] }] } })],
      edges: [],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.diagram.nodes[0].data.rows).toEqual([
      { type: "var", variables: ["x"] },
    ])
  })
})
