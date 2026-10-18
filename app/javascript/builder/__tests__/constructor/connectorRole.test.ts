import { describe, it, expect } from "vitest"
import type { Edge } from "@xyflow/react"
import { getConnectorRole } from "../../components/constructor/nodes/connectorRole"

function makeEdge(id: string, target: string, targetHandle: string): Edge {
  return { id, source: `src-${id}`, target, targetHandle }
}

describe("getConnectorRole", () => {
  it("returns 'empty' when the connector has no incoming edges", () => {
    const role = getConnectorRole("c1", [])

    expect(role).toBe("empty")
  })

  it("returns 'empty' when incoming edges target a different node", () => {
    const edges: Edge[] = [makeEdge("e1", "other-node", "top-in")]

    expect(getConnectorRole("c1", edges)).toBe("empty")
  })

  it("returns 'passThrough' for a single top entry (simple link between distant parts)", () => {
    const edges: Edge[] = [makeEdge("e1", "c1", "top-in")]

    expect(getConnectorRole("c1", edges)).toBe("passThrough")
  })

  it("returns 'loopStart' for top + one lateral entry (sequential flow + loop-back)", () => {
    const withRight: Edge[] = [
      makeEdge("e1", "c1", "top-in"),
      makeEdge("e2", "c1", "right-in"),
    ]
    const withLeft: Edge[] = [
      makeEdge("e1", "c1", "top-in"),
      makeEdge("e2", "c1", "left-in"),
    ]

    expect(getConnectorRole("c1", withRight)).toBe("loopStart")
    expect(getConnectorRole("c1", withLeft)).toBe("loopStart")
  })

  it("returns 'loopEnd' for a single lateral entry (the False branch of the stop condition)", () => {
    const fromLeft: Edge[] = [makeEdge("e1", "c1", "left-in")]
    const fromRight: Edge[] = [makeEdge("e1", "c1", "right-in")]

    expect(getConnectorRole("c1", fromLeft)).toBe("loopEnd")
    expect(getConnectorRole("c1", fromRight)).toBe("loopEnd")
  })

  it("returns 'decisionJoin' for two lateral entries (joining both branches of a decision)", () => {
    const edges: Edge[] = [
      makeEdge("e1", "c1", "left-in"),
      makeEdge("e2", "c1", "right-in"),
    ]

    expect(getConnectorRole("c1", edges)).toBe("decisionJoin")
  })

  it("returns 'invalid' for top + both laterals at once (not covered by the notation)", () => {
    const edges: Edge[] = [
      makeEdge("e1", "c1", "top-in"),
      makeEdge("e2", "c1", "left-in"),
      makeEdge("e3", "c1", "right-in"),
    ]

    expect(getConnectorRole("c1", edges)).toBe("invalid")
  })

  it("ignores duplicate edges on the same handle when classifying the role", () => {
    const edges: Edge[] = [
      makeEdge("e1", "c1", "top-in"),
      makeEdge("e2", "c1", "top-in"),
    ]

    expect(getConnectorRole("c1", edges)).toBe("passThrough")
  })
})

describe("getConnectorRole — junção de escolha", () => {
  const nodes = [
    { id: "s", type: "selection" },
    { id: "a", type: "output" },
    { id: "b", type: "output" },
    { id: "f", type: "output" },
    { id: "x", type: "process" },
  ]
  const branches: Edge[] = [
    { id: "s-a", source: "s", target: "a", sourceHandle: "case-0" },
    { id: "s-b", source: "s", target: "b", sourceHandle: "case-1" },
    { id: "s-f", source: "s", target: "f", sourceHandle: "default" },
  ]

  it("reconhece N entradas vindas dos ramos da mesma escolha", () => {
    const edges: Edge[] = [
      ...branches,
      { id: "a-c", source: "a", target: "c1", targetHandle: "left-in" },
      { id: "b-c", source: "b", target: "c1", targetHandle: "top-in" },
      { id: "f-c", source: "f", target: "c1", targetHandle: "left-in" },
    ]

    expect(getConnectorRole("c1", edges, nodes)).toBe("selectionJoin")
  })

  it("aceita um caso ligado direto ao conector", () => {
    const edges: Edge[] = [
      ...branches,
      { id: "s-c", source: "s", target: "c1", sourceHandle: "case-1", targetHandle: "left-in" },
      { id: "a-c", source: "a", target: "c1", targetHandle: "left-in" },
      { id: "f-c", source: "f", target: "c1", targetHandle: "right-in" },
    ]

    expect(getConnectorRole("c1", edges, nodes)).toBe("selectionJoin")
  })

  it("é inválida quando uma das entradas não vem da escolha", () => {
    const edges: Edge[] = [
      ...branches,
      { id: "a-c", source: "a", target: "c1", targetHandle: "left-in" },
      { id: "b-c", source: "b", target: "c1", targetHandle: "right-in" },
      { id: "x-c", source: "x", target: "c1", targetHandle: "top-in" },
    ]

    expect(getConnectorRole("c1", edges, nodes)).toBe("invalid")
  })

  it("sem os blocos, mantém a classificação pelos pontos de entrada", () => {
    const edges: Edge[] = [
      ...branches,
      { id: "a-c", source: "a", target: "c1", targetHandle: "left-in" },
      { id: "b-c", source: "b", target: "c1", targetHandle: "right-in" },
    ]

    expect(getConnectorRole("c1", edges)).toBe("decisionJoin")
  })
})
