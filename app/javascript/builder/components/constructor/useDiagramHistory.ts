import { useCallback, useRef, useState } from "react"
import type { Edge, Node } from "@xyflow/react"
import type { SerializedDiagram } from "./serializeDiagram"

// Enough to walk back through a long editing session without the canvas
// carrying more copies of the diagram than it needs to.
const MAX_HISTORY = 100

/**
 * Undo and redo for the canvas, as snapshots rather than inverse operations.
 *
 * Each step stores what the diagram looked like before the change, so undo is
 * a matter of putting that back. Deriving the inverse of every edit instead
 * would mean tracking a different code path per action, and any action without
 * one would silently be unundoable.
 *
 * Only the diagram is covered. The name lives in its own field and is not part
 * of the canvas, so Ctrl+Z in the field is left to the browser.
 */
export function useDiagramHistory(
  current: () => SerializedDiagram,
  restore: (diagram: SerializedDiagram) => void,
) {
  const past = useRef<SerializedDiagram[]>([])
  const future = useRef<SerializedDiagram[]>([])
  // A ref, not state: recording must not schedule a render of its own, or every
  // edit would re-render the canvas one extra time.
  const [cursor, setCursor] = useState({ canUndo: false, canRedo: false })

  const publish = useCallback(() => {
    setCursor({
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
    })
  }, [])

  const record = useCallback(() => {
    const snapshot = current()

    // Two identical steps in a row would cost the student one undo to step
    // over nothing, which is how undo starts feeling broken.
    const last = past.current.at(-1)
    if (last && JSON.stringify(last) === JSON.stringify(snapshot)) return

    past.current.push(snapshot)
    if (past.current.length > MAX_HISTORY) past.current.shift()

    // Any new edit makes the abandoned future unreachable.
    future.current = []
    publish()
  }, [current, publish])

  const undo = useCallback(() => {
    const previous = past.current.pop()
    if (!previous) return

    future.current.push(current())
    restore(previous)
    publish()
  }, [current, restore, publish])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return

    past.current.push(current())
    restore(next)
    publish()
  }, [current, restore, publish])

  // Loading, clearing or starting over is a new starting point: walking back
  // from there would bring back a diagram the student deliberately left.
  const reset = useCallback(() => {
    past.current = []
    future.current = []
    publish()
  }, [publish])

  return {
    record,
    undo,
    redo,
    reset,
    canUndo: cursor.canUndo,
    canRedo: cursor.canRedo,
  }
}

/**
 * Whether a batch of React Flow changes is worth a history entry.
 *
 * A drag arrives as a change per frame, so recording each one would fill the
 * history with a single gesture. Only the frame that ends the drag counts,
 * which makes one drag one step. Selecting is not an edit at all, so it never
 * counts: otherwise merely clicking a block would light up the undo button
 * for an undo that changes nothing.
 */
export function isHistoryWorthy(
  changes: Array<{ type?: string; dragging?: boolean }>,
): boolean {
  return changes.some((change) => {
    if (change.type === "select") return false
    // Blocks are not resizable, so a new size is the canvas measuring them.
    if (change.type === "dimensions") return false
    if (change.type === "position") return !change.dragging
    return true
  })
}

export function nodesFromDiagram(diagram: SerializedDiagram): Node[] {
  return diagram.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  })) as Node[]
}

export function edgesFromDiagram(diagram: SerializedDiagram): Edge[] {
  return diagram.edges.map((edge) => ({ ...edge })) as Edge[]
}