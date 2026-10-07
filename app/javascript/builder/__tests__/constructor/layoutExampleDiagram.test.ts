import { describe, it, expect } from "vitest"
import { layoutExampleDiagram } from "../../components/constructor/layoutExampleDiagram"
import { DIAGRAM_EXAMPLES } from "../../interfaces/diagramExamples"

function getExample(id: string) {
  const example = DIAGRAM_EXAMPLES.find((item) => item.id === id)
  if (!example) throw new Error(`example not found: ${id}`)
  return example
}

function positionOf(nodes: { id: string; position: { x: number; y: number } }[], id: string) {
  const node = nodes.find((item) => item.id === id)
  if (!node) throw new Error(`node not found: ${id}`)
  return node.position
}

describe("layoutExampleDiagram", () => {
  it("empilha os nós de um fluxo linear ao redor da coluna central", () => {
    const { nodes } = layoutExampleDiagram(getExample("soma-dois-valores"))
    expect(nodes.map((node) => node.id)).toEqual(["n1", "n2", "n3", "n4", "n5", "n6"])
    nodes.forEach((node, index) => {
      expect(node.position).toEqual({ x: 300, y: index * 170 })
    })
  })

  it("abre os dois ramos da decisão em colunas laterais e alinha na mesma altura", () => {
    const { nodes } = layoutExampleDiagram(getExample("par-ou-impar"))
    const yes = positionOf(nodes, "n5")
    const no = positionOf(nodes, "n6")

    expect(yes.x).toBe(470)
    expect(no.x).toBe(130)
    expect(yes.y).toBe(no.y)
    expect(yes.y).toBe(4 * 170)
  })

  it("centraliza de novo o nó de junção dos dois ramos", () => {
    const { nodes } = layoutExampleDiagram(getExample("par-ou-impar"))
    expect(positionOf(nodes, "n7")).toEqual({ x: 300, y: 5 * 170 })
  })

  it("separa corpo do laço e saída do laço nas colunas laterais", () => {
    const { nodes } = layoutExampleDiagram(getExample("fatorial"))

    // entrada até a decisão permanece centralizada
    expect(positionOf(nodes, "n1").x).toBe(300)
    expect(positionOf(nodes, "n5").x).toBe(300)

    // corpo do laço (yes) à direita, saída (no) à esquerda, na mesma altura
    const loopBody = positionOf(nodes, "n6")
    const exit = positionOf(nodes, "n7")
    expect(loopBody.x).toBe(470)
    expect(exit.x).toBe(130)
    expect(loopBody.y).toBe(exit.y)
    expect(exit.y).toBe(5 * 170)

    nodes.forEach((node) => {
      expect(node.position.y % 170).toBe(0)
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