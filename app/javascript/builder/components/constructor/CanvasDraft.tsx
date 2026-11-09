import { useEffect, useRef } from "react"
import { useConstructor, type CanvasNodeInput, type CanvasEdgeInput } from "./ConstructorProvider"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { useDiagramOrigin, type DiagramOrigin } from "./DiagramOrigin"
import { serializeDiagramForSave, type SerializedDiagram } from "./serializeDiagram"
import { useToast } from "../ui/Toast"

export const CANVAS_DRAFT_KEY = "blade.canvas-draft.v1"
// Short, so little is lost to a closed tab, and still not a write per keystroke.
export const DRAFT_DELAY_MS = 500

interface ICanvasDraft {
  name: string
  origin: DiagramOrigin
  dirty: boolean
  diagram: SerializedDiagram
}

function readDraft(): ICanvasDraft | null {
  try {
    const raw = window.localStorage.getItem(CANVAS_DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as Partial<ICanvasDraft>
    if (
      typeof draft.name !== "string" ||
      !draft.origin ||
      !Array.isArray(draft.diagram?.nodes) ||
      !Array.isArray(draft.diagram?.edges)
    ) {
      return null
    }
    return draft as ICanvasDraft
  } catch {
    return null
  }
}

// A blocked or full store only costs the draft; the canvas keeps working.
function writeDraft(draft: ICanvasDraft | null) {
  try {
    if (draft) window.localStorage.setItem(CANVAS_DRAFT_KEY, JSON.stringify(draft))
    else window.localStorage.removeItem(CANVAS_DRAFT_KEY)
  } catch {
    // Nothing to tell the student: the diagram on screen is untouched.
  }
}

/**
 * Keeps what is on the canvas in this browser as the student works, so a tab
 * closed by mistake does not take the diagram with it: the next time the
 * builder opens on an empty canvas, the draft comes back with its name,
 * where it came from and whether it had unsaved edits. An empty, unnamed
 * canvas leaves no draft. Shared diagrams belong to someone else and are not
 * kept.
 */
export function CanvasDraft() {
  const { nodes, edges, isDirty, loadCanvasNodes } = useConstructor()
  const { algorithmName, onAlgorithmNameChange } = useAlgorithmNameField()
  const { origin, markBlank, markExample, markSaved, markLocal } = useDiagramOrigin()
  const { notify } = useToast()
  const restored = useRef(false)

  // Once, on opening: a draft only comes back onto an empty canvas.
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const draft = readDraft()
    if (!draft || nodes.length > 0) return

    loadCanvasNodes(
      draft.diagram.nodes as CanvasNodeInput[],
      draft.diagram.edges as CanvasEdgeInput[],
      { dirty: draft.dirty },
    )
    onAlgorithmNameChange(draft.name)
    if (draft.origin.kind === "saved") markSaved(draft.origin.id)
    else if (draft.origin.kind === "local") markLocal(draft.origin.id)
    else if (draft.origin.kind === "example") markExample(draft.origin.id)
    else markBlank()
    if (draft.diagram.nodes.length > 0 || draft.name) {
      notify("Rascunho recuperado: o diagrama voltou como você deixou.", "info")
    }
    // Only on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const diagram = serializeDiagramForSave(nodes, edges)
  const snapshot = JSON.stringify({ name: algorithmName, origin, dirty: isDirty, diagram })

  useEffect(() => {
    if (!restored.current || origin.kind === "shared") return
    const timer = setTimeout(() => {
      const empty = diagram.nodes.length === 0 && algorithmName.trim() === ""
      writeDraft(empty ? null : { name: algorithmName, origin, dirty: isDirty, diagram })
    }, DRAFT_DELAY_MS)
    return () => clearTimeout(timer)
    // `snapshot` stands for everything the draft holds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot])

  return null
}
