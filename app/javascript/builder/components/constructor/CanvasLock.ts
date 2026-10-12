import { useDiagramOrigin } from "./DiagramOrigin"

// Thin accessor so components that only need the flag (the canvas, the header
// name field) do not depend on the whole origin object.
export function useCanvasLock(): { isReadOnly: boolean } {
  return useDiagramOrigin()
}