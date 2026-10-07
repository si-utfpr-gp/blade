import { describe, it, expect } from "vitest"
import { layoutExampleDiagram } from "../../components/constructor/layoutExampleDiagram"
import { DIAGRAM_EXAMPLES } from "../../interfaces/diagramExamples"

function getExample(id: string) {
  const example = DIAGRAM_EXAMPLES.find((item) => item.id === id)
  if (!example) throw new Error(`example not found: ${id}`)
  return example
}

describe("layoutExampleDiagram", () => {
  it("empilha os nós verticalmente em ordem BFS a partir do início", () => {
    const { nodes } = layoutExampleDiagram(getExample("soma-dois-valores"))
    expect(nodes.map((node) => node.id)).toEqual(["n1", "n2", "n3", "n4", "n5", "n6"])
    nodes.forEach((node, index) => {
      expect(node.position).toEqual({ x: 300, y: index * 120 })
    })
  })

  it("visita os dois ramos da decisão antes da junção", () => {
    const { nodes } = layoutExampleDiagram(getExample("par-ou-impar"))
    const ids = nodes.map((node) => node.id)
    expect(ids[0]).toBe("n1")
    expect(ids).toContain("n5")
    expect(ids).toContain("n6")
    expect(ids.indexOf("n7")).toBeGreaterThan(ids.indexOf("n5"))
    expect(ids.indexOf("n7")).toBeGreaterThan(ids.indexOf("n6"))
  })

  it("preserva id, type, data e arestas do exemplo", () => {
    const { nodes, edges } = layoutExampleDiagram(getExample("soma-dois-valores"))
    expect(nodes[1]).toMatchObject({
      id: "n2",
      type: "memory",
      data: { label: "Memória", rows: [{ type: "inteiro", variables: "num1, num2, soma" }] },
    })
    expect(edges).toHaveLength(5)
    expect(edges[0]).toMatchObject({ id: "e1", source: "n1", target: "n2" })
  })

  it("ordena pela entrada quando não há bloco de início", () => {
    const { nodes } = layoutExampleDiagram({
      id: "x",
      title: "x",
      description: "x",
      category: "x",
      diagram: {
        nodes: [
          { id: "a", type: "process", data: { label: "a" } },
          { id: "b", type: "process", data: { label: "b" } },
        ],
        edges: [{ id: "e1", source: "a", target: "b" }],
      },
    })
    expect(nodes.map((node) => node.id)).toEqual(["a", "b"])
  })
})
