import { describe, it, expect } from "vitest"
import { parse } from "../../parser/parser"
import type { Node, Edge } from "@xyflow/react"

describe("parse", () => {
  it("builds a linear graph successfully", () => {
    const nodes: Node[] = [
      { id: "n1", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start", label: "Início" } },
      { id: "n2", type: "memory", position: { x: 0, y: 80 }, data: { label: "Memória", rows: [{ type: "inteiro", variables: "num1, num2, soma" }] } },
      { id: "n3", type: "process", position: { x: 0, y: 200 }, data: { label: "soma = num1 + num2" } },
      { id: "n4", type: "startEnd", position: { x: 0, y: 320 }, data: { variant: "end", label: "Fim" } },
    ]
    const edges: Edge[] = [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
    ]

    const graph = parse(nodes, edges)

    expect(graph.startNodeId).toBe("n1")
    expect(graph.endNodeId).toBe("n4")
    expect(graph.nodes.size).toBe(4)
    expect(graph.getNextNode("n1")).toBe("n2")
    expect(graph.getNextNode("n2")).toBe("n3")
    expect(graph.getNextNode("n3")).toBe("n4")
    expect(graph.getNextNode("n4")).toBeNull()
  })

  it("handles decision nodes with yes/no handles", () => {
    const nodes: Node[] = [
      { id: "n1", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
      { id: "n2", type: "decision", position: { x: 0, y: 100 }, data: { label: "n > 0" } },
      { id: "n3", type: "process", position: { x: 150, y: 200 }, data: { label: "positivo" } },
      { id: "n4", type: "process", position: { x: -150, y: 200 }, data: { label: "negativo" } },
    ]
    const edges: Edge[] = [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3", sourceHandle: "yes" },
      { id: "e3", source: "n2", target: "n4", sourceHandle: "no" },
    ]

    const graph = parse(nodes, edges)

    expect(graph.getNextNode("n2", "yes")).toBe("n3")
    expect(graph.getNextNode("n2", "no")).toBe("n4")
  })

  it("returns null when no start or end node exists", () => {
    const nodes: Node[] = [
      { id: "n1", type: "process", position: { x: 0, y: 0 }, data: { label: "x = 1" } },
    ]
    const graph = parse(nodes, [])

    expect(graph.startNodeId).toBeNull()
    expect(graph.endNodeId).toBeNull()
  })
})
