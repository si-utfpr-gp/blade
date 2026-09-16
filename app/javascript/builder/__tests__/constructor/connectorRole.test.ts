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
