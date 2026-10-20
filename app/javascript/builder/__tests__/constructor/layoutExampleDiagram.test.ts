import { describe, it, expect } from "vitest"
import {
  layoutExampleDiagram,
  type PositionedExampleNode,
} from "../../components/constructor/layoutExampleDiagram"
import { DIAGRAM_EXAMPLES, type IDiagramExample } from "../../interfaces/diagramExamples"

function getExample(id: string) {
  const example = DIAGRAM_EXAMPLES.find((item) => item.id === id)
  if (!example) throw new Error(`example not found: ${id}`)
  return example
}

/*
 * Sizes as the canvas renders each block, measured in the browser. They are
 * kept here on purpose instead of reusing the layout's own estimates, so the
 * overlap check does not just agree with itself.
 */
function renderedSize(node: PositionedExampleNode): { w: number; h: number } {
  const label = String(node.data.label ?? "")
  switch (node.type) {
    case "startEnd": return { w: 140, h: 50 }
    case "memory": return { w: 330, h: 60 + 35 * ((node.data.rows as unknown[] | undefined)?.length ?? 1) }
    case "decision": return { w: 140, h: 100 }
    case "connector": return { w: 48, h: 48 }
    case "selection": return { w: Math.max(160, (((node.data.cases as unknown[]) ?? []).length + 1) * 64), h: 130 }
    default: return { w: Math.max(160, 40 + 8.5 * label.length), h: 50 }
  }
}

const box = (node: PositionedExampleNode) => {
  const { w, h } = renderedSize(node)
  return { left: node.position.x, top: node.position.y, right: node.position.x + w, bottom: node.position.y + h }
}
const centerX = (node: PositionedExampleNode) => node.position.x + renderedSize(node).w / 2
const centerY = (node: PositionedExampleNode) => node.position.y + renderedSize(node).h / 2

// Positions are whole pixels, so a centre can land half a pixel off.
const expectAligned = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(1)

function layout(id: string) {
  const { nodes, edges } = layoutExampleDiagram(getExample(id))
  const byId = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId)
    if (!node) throw new Error(`node not found: ${nodeId}`)
    return node
  }
  return { nodes, edges, byId }
}

const examplesOnCanvas = DIAGRAM_EXAMPLES.filter((example) => !example.diagram.subroutines?.length)

describe("layoutExampleDiagram", () => {
  // The point of the layout: opening an example never shows one block on top
  // of another, with room left for the arrows between them.
  it.each(examplesOnCanvas)("'$title' abre sem blocos encostados", (example: IDiagramExample) => {
    const { nodes } = layoutExampleDiagram(example)
    const margin = 24
    const touching: string[] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = box(nodes[i])
        const b = box(nodes[j])
        const apart = a.right + margin <= b.left || b.right + margin <= a.left ||
          a.bottom + margin <= b.top || b.bottom + margin <= a.top
        if (!apart) touching.push(`${nodes[i].id}×${nodes[j].id}`)
      }
    }
    expect(touching).toEqual([])
  })

  it("empilha um fluxo linear numa coluna reta, centralizada", () => {
    const { nodes } = layout("soma-dois-valores")
    expect(nodes.map((node) => node.id)).toEqual(["n1", "n2", "n3", "n4", "n5", "n6"])
    const centers = nodes.map(centerX)
    centers.forEach((center) => expectAligned(center, centers[0]))
    for (let i = 1; i < nodes.length; i++) expect(nodes[i].position.y).toBeGreaterThan(nodes[i - 1].position.y)
  })

  it("abre o se com Verdadeiro à direita, Falso à esquerda e a junção no meio", () => {
    const { byId } = layout("par-ou-impar")
    const decision = byId("n4")
    const yes = byId("n5")
    const no = byId("n6")
    const join = byId("n7")

    expect(centerX(yes)).toBeGreaterThan(centerX(decision))
    expect(centerX(no)).toBeLessThan(centerX(decision))
    expectAligned(centerY(yes), centerY(no))
    expectAligned(centerX(join), centerX(decision))
    expect(join.position.y).toBeGreaterThan(yes.position.y)
  })

  it("põe o corpo do laço ao lado e a saída abaixo do corpo inteiro", () => {
    const { byId } = layout("media-de-valores")
    const decision = byId("n7")
    const body = [byId("n8"), byId("n9"), byId("n10")]
    const exit = byId("n11")

    body.forEach((node) => expect(centerX(node)).toBeGreaterThan(centerX(decision)))
    body.forEach((node) => expect(exit.position.y).toBeGreaterThan(box(node).bottom))
    expectAligned(centerX(exit), centerX(decision))
  })

  it("espalha os ramos da escolha com o Falso à esquerda e junta no meio", () => {
    const { byId } = layout("menu-de-opcoes")
    const selection = byId("n4")
    const branches = [byId("n8"), byId("n5"), byId("n6"), byId("n7")] // Falso, 1, 2, 3
    const xs = branches.map(centerX)

    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    expectAligned(centerX(byId("n9")), centerX(selection))
    branches.forEach((node) => expect(node.position.y).toBeGreaterThan(box(selection).bottom))
  })

  it("visita os dois ramos da decisão antes da junção", () => {
    const { nodes } = layout("par-ou-impar")
    const ids = nodes.map((node) => node.id)
    expect(ids[0]).toBe("n1")
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
