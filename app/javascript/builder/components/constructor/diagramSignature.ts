import type { Edge, Node } from "@xyflow/react"
import { serializeDiagramForSave } from "./serializeDiagram"

/**
 * A stable fingerprint of what would be persisted for the current diagram.
 *
 * The dirty check compares this against the fingerprint taken when the diagram
 * was last saved or loaded. Deriving it from the same payload the save uses
 * means the two can never disagree, and because the fingerprint is computed
 * rather than tracked with a flag, undoing back to the saved state correctly
 * reads as clean again.
 *
 * Keys are sorted at every level: two nodes holding the same values in a
 * different insertion order describe the same diagram and must not read as an
 * edit.
 */
export function diagramSignature(nodes: Node[], edges: Edge[]): string {
  return JSON.stringify(stable(serializeDiagramForSave(nodes, edges)))
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stable)
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
    )
    const sorted: Record<string, unknown> = {}
    for (const [key, item] of entries) {
      sorted[key] = stable(item)
    }
    return sorted
  }
  return value
}