import { describe, it, expect } from "vitest"
import type { Node, Edge } from "@xyflow/react"
import { normalizeDiagram } from "../../components/constructor/normalizeDiagram"

describe("normalizeDiagram", () => {
  it("remove metadados visuais (position, width, height, selected) dos nós", () => {
    const nodes: Node[] = [
      {
        id: "n1",
        type: "startEnd",
        position: { x: 250, y: 0 },
        width: 120,
        height: 40,
        selected: true,
        dragging: true,
        data: { label: "Início", variant: "start" },
      },
    ]

    const { nodes: normalized } = normalizeDiagram(nodes, [])

    expect(normalized[0]).toEqual({
      id: "n1",
      type: "startEnd",
      data: { label: "Início", variant: "start" },
    })
    expect(normalized[0]).not.toHaveProperty("position")
    expect(normalized[0]).not.toHaveProperty("width")
    expect(normalized[0]).not.toHaveProperty("height")
    expect(normalized[0]).not.toHaveProperty("selected")
  })

  it("preserva label, variant e rows no data dos nós", () => {
    const nodes: Node[] = [
      {
        id: "n2",
        type: "memory",
        position: { x: 220, y: 80 },
        data: {
          label: "Memória",
          rows: [{ type: "inteiro", variables: "num1, num2, soma" }],
        },
      },
    ]

    const { nodes: normalized } = normalizeDiagram(nodes, [])
    expect(normalized[0].data).toEqual({
      label: "Memória",
      rows: [{ type: "inteiro", variables: "num1, num2, soma" }],
    })
  })

  it("preserva id, source, target e handles das arestas", () => {
    const edges: Edge[] = [
      {
        id: "e1",
        source: "n3",
        target: "n4",
        sourceHandle: "yes",
        targetHandle: "top-in",
        type: "step",
        markerEnd: { type: "arrowclosed" },
        selected: false,
      },
    ]

    const { edges: normalized } = normalizeDiagram([], edges)

    expect(normalized[0]).toEqual({
      id: "e1",
      source: "n3",
      target: "n4",
      sourceHandle: "yes",
      targetHandle: "top-in",
    })
    expect(normalized[0]).not.toHaveProperty("type")
    expect(normalized[0]).not.toHaveProperty("markerEnd")
    expect(normalized[0]).not.toHaveProperty("selected")
  })

  it("preserva label da aresta quando definido", () => {
    const edges: Edge[] = [
      { id: "e2", source: "n4", target: "n5", sourceHandle: "yes", label: "VERDADEIRO" },
    ]

    const { edges: normalized } = normalizeDiagram([], edges)
    expect(normalized[0].label).toBe("VERDADEIRO")
  })

  it("retorna arrays vazios quando não há nós nem arestas", () => {
    const { nodes, edges } = normalizeDiagram([], [])
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })
})