import type { Node, Edge } from "@xyflow/react"
import type { IParserInputNode, IParserInputEdge } from "../../parser/types"

export interface NormalizedNode extends IParserInputNode {
  type: string
}

export interface NormalizedEdge extends IParserInputEdge {
  label?: string
}

export interface NormalizedDiagram {
  nodes: NormalizedNode[]
  edges: NormalizedEdge[]
}

export function normalizeDiagram(
  nodes: Node[],
  edges: Edge[],
): NormalizedDiagram {
  const normalizedNodes: NormalizedNode[] = nodes.map((node) => {
    const { id, type, data } = node
    return {
      id,
      type: type ?? "",
      ...(data !== undefined ? { data: data as Record<string, unknown> } : {}),
    }
  })

  const normalizedEdges: NormalizedEdge[] = edges.map((edge) => {
    const { id, source, target, sourceHandle, targetHandle, label } = edge
    return {
      id,
      source,
      target,
      ...(sourceHandle !== undefined ? { sourceHandle } : {}),
      ...(targetHandle !== undefined ? { targetHandle } : {}),
      ...(typeof label === "string" ? { label } : {}),
    }
  })

  return { nodes: normalizedNodes, edges: normalizedEdges }
}
