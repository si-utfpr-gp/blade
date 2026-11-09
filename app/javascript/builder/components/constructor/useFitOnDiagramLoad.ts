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
  // React Flow reports each block's size once it has drawn it, and a freshly
  // loaded block arrives without one, so this only turns true for the new
  // diagram. React Flow's own "initialized" flag still reads the previous
  // diagram in the render right after a load.
  const nodesMeasured =
    nodes.length > 0 &&
    nodes.every((node) => Boolean(node.measured?.width && node.measured?.height))
  const firstRun = useRef(true)
  // A load asks for a fit; the fit waits until React Flow has measured the new
  // blocks. Fitting earlier frames only the few already measured, and the
  // camera zoomed all the way in on them.
  const fitPending = useRef(false)

  useEffect(() => {
    if (firstRun.current) {
      // The canvas already fits on mount through the fitView prop.
      firstRun.current = false
      return
    }

    if (nodes.length === 0) {
      fitPending.current = false
      setViewport(DEFAULT_VIEWPORT)
      return
    }

    fitPending.current = true
  }, [loadCount, nodes.length, setViewport])

  useEffect(() => {
    if (!fitPending.current || !nodesMeasured) return
    fitPending.current = false
    fitView({ padding: 0.2, duration: 300, maxZoom: 1.5 })
  }, [loadCount, nodesMeasured, fitView])
}
