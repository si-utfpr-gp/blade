import type { IDiagramExample } from "../../interfaces/diagramExamples"

export interface PositionedExampleNode {
  id: string
  type: string
  data: Record<string, unknown>
  position: { x: number; y: number }
}

export interface PositionedExampleEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export interface LaidOutExample {
  nodes: PositionedExampleNode[]
  edges: PositionedExampleEdge[]
}

const COLUMN_X = 300
const ROW_HEIGHT = 120

export function layoutExampleDiagram(example: IDiagramExample): LaidOutExample {
  const { nodes: rawNodes, edges: rawEdges } = example.diagram

  const adjacency = new Map<string, string[]>()
  for (const edge of rawEdges) {
    const targets = adjacency.get(edge.source) ?? []
    targets.push(edge.target)
    adjacency.set(edge.source, targets)
  }

  const startNode =
    rawNodes.find(
      (node) =>
        node.type === "startEnd" &&
        (node.data as Record<string, unknown> | undefined)?.variant === "start",
    ) ?? rawNodes[0]

  const order: string[] = []
  const visited = new Set<string>()
  if (startNode) {
    const queue: string[] = [startNode.id]
    visited.add(startNode.id)
    while (queue.length > 0) {
      const current = queue.shift() as string
      order.push(current)
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next)
          queue.push(next)
        }
      }
    }
  }
  for (const node of rawNodes) {
    if (!visited.has(node.id)) order.push(node.id)
  }

  const nodes: PositionedExampleNode[] = order.map((id, index) => {
    const raw = rawNodes.find((node) => node.id === id) as (typeof rawNodes)[number]
    return {
      id: raw.id,
      type: raw.type,
      data: raw.data,
      position: { x: COLUMN_X, y: index * ROW_HEIGHT },
    }
  })

  const edges: PositionedExampleEdge[] = rawEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.sourceHandle !== undefined ? { sourceHandle: edge.sourceHandle } : {}),
    ...(edge.label !== undefined ? { label: edge.label } : {}),
  }))

  return { nodes, edges }
}
