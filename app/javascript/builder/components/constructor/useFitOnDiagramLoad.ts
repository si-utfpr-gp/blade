import { useEffect, useRef } from "react"
import { useReactFlow } from "@xyflow/react"
import { useConstructor } from "./ConstructorProvider"

// Where the camera sits when the student is editing an empty canvas. Restoring
// it matters because a zoomed-in leftover from another algorithm makes the
// dropped blocks land far off screen.
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 } as const

/**
 * Brings a newly loaded diagram into view. The viewport used to stay wherever
 * the previous algorithm was, so switching left the student looking at empty
 * space.
 *
 * Editing a block does not retrigger this: the counter only moves when a whole
 * diagram is loaded, cleared or reset.
 */
export function useFitOnDiagramLoad(loadCount: number): void {
  const { fitView, setViewport } = useReactFlow()
  const { nodes } = useConstructor()
  // fitView reads the nodes React Flow has measured, so it has to run after the
  // diagram is committed, not in the same render.
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current) {
      // The canvas already fits on mount through the fitView prop.
      firstRun.current = false
      return
    }

    if (nodes.length === 0) {
      setViewport(DEFAULT_VIEWPORT)
      return
    }

    fitView({ padding: 0.2, duration: 300, maxZoom: 1.5 })
  }, [loadCount, nodes.length, fitView, setViewport])
}
