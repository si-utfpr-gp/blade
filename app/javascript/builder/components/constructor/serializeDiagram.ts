import type { Edge, Node } from "@xyflow/react"

export interface SerializedNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface SerializedEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export interface SerializedDiagram {
  nodes: SerializedNode[]
  edges: SerializedEdge[]
}

// Runtime-only state that must not reach the database: it is either derived on
// load (hasError) or owned by React Flow (selected, dragging, measured).
const DROPPED_NODE_DATA_KEYS = [ "hasError" ]

/**
 * Converts the live canvas into the payload persisted for an algorithm.
 *
 * Unlike normalizeDiagram (which strips geometry because the simulator only
 * needs the graph), this keeps `position` so reopening a saved algorithm
 * restores the exact layout the student arranged.
 */
export function serializeDiagramForSave(
  nodes: Node[],
  edges: Edge[],
): SerializedDiagram {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type ?? "",
      position: { x: node.position.x, y: node.position.y },
      data: stripRuntimeData(node.data),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(edge.sourceHandle !== undefined
        ? { sourceHandle: edge.sourceHandle }
        : {}),
      ...(edge.targetHandle !== undefined
        ? { targetHandle: edge.targetHandle }
        : {}),
      ...(typeof edge.label === "string" ? { label: edge.label } : {}),
    })),
  }
}

function stripRuntimeData(
  data: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const source = data ?? {}
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if (DROPPED_NODE_DATA_KEYS.includes(key)) continue
    cleaned[key] = value
  }
  return cleaned
}