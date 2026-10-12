import { useCallback, useEffect } from "react"

import { useConstructor } from "./ConstructorProvider"
import { useBlockPlacement } from "./BlockPlacement"
import { centerDropPosition } from "./canvasSync"
import { isCanvasLocked } from "./canvasSync"
import { useSimulator } from "../simulator/SimulatorContext"

/**
 * Handles a tap on empty canvas: if a block is armed it lands there, otherwise
 * the tap is ignored. The canvas passes the result of screenToFlowPosition, so
 * this stays independent of ReactFlow and testable on its own.
 */
export function usePanePlacement(): (flowPoint: { x: number; y: number }) => void {
  const { addNode } = useConstructor()
  const { pendingBlock, cancel } = useBlockPlacement()
  const { state: simulatorState } = useSimulator()

  const locked = isCanvasLocked(
    simulatorState.isStarted,
    simulatorState.isFinished,
  )

  // Escape gives up on the armed block, so a mis-tap is recoverable.
  useEffect(() => {
    if (!pendingBlock) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [pendingBlock, cancel])

  return useCallback(
    (flowPoint: { x: number; y: number }) => {
      if (!pendingBlock || locked) return

      addNode(
        pendingBlock.type,
        centerDropPosition(flowPoint, pendingBlock.type),
        pendingBlock.variant,
      )
      cancel()
    },
    [pendingBlock, addNode, cancel, locked],
  )
}