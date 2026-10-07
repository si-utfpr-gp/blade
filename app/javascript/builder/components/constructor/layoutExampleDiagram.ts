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
const ROW_HEIGHT = 170
const LANE_OFFSET = 170

export function layoutExampleDiagram(example: IDiagramExample): LaidOutExample {
  const { nodes: rawNodes, edges: rawEdges } = example.diagram

  const adjacency = new Map<string, string[]>()
  const incomingCount = new Map<string, number>()
  for (const edge of rawEdges) {
    const targets = adjacency.get(edge.source) ?? []
    targets.push(edge.target)
    adjacency.set(edge.source, targets)
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1)
  }

  const startNode =
    rawNodes.find(
      (node) =>
        node.type === "startEnd" &&
        (node.data as Record<string, unknown> | undefined)?.variant === "start",
    ) ?? rawNodes[0]

  const order: string[] = []
  const depth = new Map<string, number>()
  const visited = new Set<string>()
  if (startNode) {
    const queue: string[] = [startNode.id]
    visited.add(startNode.id)
    depth.set(startNode.id, 0)
    while (queue.length > 0) {
      const current = queue.shift() as string
      order.push(current)
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next)
          depth.set(next, (depth.get(current) ?? 0) + 1)
          queue.push(next)
        }
      }
    }
  }
  for (const node of rawNodes) {
    if (!visited.has(node.id)) {
      order.push(node.id)
      depth.set(node.id, 0)
    }
  }

  const laneByChild = new Map<string, number>()
  for (const edge of rawEdges) {
    const parent = rawNodes.find((node) => node.id === edge.source)
    if (!parent || parent.type !== "decision") continue
    if (edge.sourceHandle === "yes") laneByChild.set(edge.target, 1)
    if (edge.sourceHandle === "no") laneByChild.set(edge.target, -1)
  }

  const nodes: PositionedExampleNode[] = order.map((id) => {
    const raw = rawNodes.find((node) => node.id === id) as (typeof rawNodes)[number]
    const isJunction = (incomingCount.get(id) ?? 0) > 1
    const lane = isJunction ? 0 : (laneByChild.get(id) ?? 0)
    return {
      id: raw.id,
      type: raw.type,
      data: raw.data,
      position: {
        x: COLUMN_X + lane * LANE_OFFSET,
        y: (depth.get(id) ?? 0) * ROW_HEIGHT,
      },
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