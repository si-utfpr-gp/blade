import { describe, it, expect } from "vitest"
import { serializeDiagramForSave } from "../../components/constructor/serializeDiagram"

describe("serializeDiagramForSave", () => {
  it("keeps the node position so the layout survives a restore", () => {
    const result = serializeDiagramForSave(
      [
        {
          id: "n1",
          type: "start",
          position: { x: 300, y: 80 },
          data: { label: "Início", blockType: "start" },
          selected: true,
          dragging: false,
          measured: { width: 100, height: 40 },
        },
      ] as never,
      [],
    )

    expect(result.nodes[0].position).toEqual({ x: 300, y: 80 })
  })

  it("keeps only the domain fields of a node", () => {
    const result = serializeDiagramForSave(
      [
        {
          id: "n2",
          type: "memory",
          position: { x: 10, y: 20 },
          data: {
            label: "Memória",
            blockType: "memory",
            rows: [{ type: "inteiro", variables: "n" }],
            hasError: true,
          },
          selected: false,
        },
      ] as never,
      [],
    )

    expect(result.nodes[0]).toEqual({
      id: "n2",
      type: "memory",
      position: { x: 10, y: 20 },
      data: {
        label: "Memória",
        blockType: "memory",
        rows: [{ type: "inteiro", variables: "n" }],
      },
    })
  })

  it("keeps the decision variant used to rebuild memory rows", () => {
    const result = serializeDiagramForSave(
      [
        {
          id: "n3",
          type: "startEnd",
          position: { x: 0, y: 0 },
          data: { label: "Início", variant: "start" },
        },
      ] as never,
      [],
    )

    expect(result.nodes[0].data.variant).toBe("start")
  })

  it("keeps edge wiring and labels", () => {
    const result = serializeDiagramForSave(
      [],
      [
        {
          id: "e1",
          source: "n4",
          target: "n5",
          sourceHandle: "yes",
          type: "step",
          selected: true,
        },
      ] as never,
    )

    expect(result.edges).toEqual([
      { id: "e1", source: "n4", target: "n5", sourceHandle: "yes" },
    ])
  })

  it("returns an empty diagram when there is nothing to save", () => {
    expect(serializeDiagramForSave([], [])).toEqual({ nodes: [], edges: [] })
  })
})