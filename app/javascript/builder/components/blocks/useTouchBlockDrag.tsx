import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { createPortal } from "react-dom"

import BlockShapePreview from "./BlockShapePreview"
import { useBlockPlacement, type IPendingBlock } from "../constructor/BlockPlacement"

// Below this a finger is still tapping: it wobbles a few pixels.
const LIFT_DISTANCE = 8
// The preview floats this far above the finger, so the finger never hides
// it, and the block lands where the preview is, not under the finger.
const GHOST_ABOVE_FINGER = 56

type Ghost = { block: IPendingBlock; x: number; y: number }

/**
 * Drags a block out of the menu with a finger, which HTML5 drag and drop
 * never does on a touch screen. A sideways pull lifts the block; an up or
 * down one is left to the browser, so the menu still scrolls (the tiles use
 * touch-action: pan-y). The mouse keeps the HTML5 drag.
 *
 * Listening on the window, not the tile, keeps the drag alive after the menu
 * slides away to show the canvas.
 */
export function useTouchBlockDrag({ onLift }: { onLift: () => void }) {
  const { dropAt } = useBlockPlacement()
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const cleanup = useRef<(() => void) | null>(null)
  // The tap that ends a drag must not also arm the block.
  const justDragged = useRef(false)

  useEffect(() => () => cleanup.current?.(), [])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent, block: IPendingBlock) => {
      if (event.pointerType === "mouse" || !event.isPrimary) return
      cleanup.current?.()

      const pointerId = event.pointerId
      const start = { x: event.clientX, y: event.clientY }
      let lifted = false

      const stop = () => {
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup", handleUp)
        window.removeEventListener("pointercancel", handleCancel)
        cleanup.current = null
      }

      const handleMove = (move: PointerEvent) => {
        if (move.pointerId !== pointerId) return
        const dx = move.clientX - start.x
        const dy = move.clientY - start.y

        if (!lifted) {
          if (Math.hypot(dx, dy) < LIFT_DISTANCE) return
          // Mostly vertical: the student is scrolling the menu, not dragging.
          if (Math.abs(dy) > Math.abs(dx)) {
            stop()
            return
          }
          lifted = true
          justDragged.current = true
          onLift()
        }
        setGhost({ block, x: move.clientX, y: move.clientY })
      }

      const handleUp = (up: PointerEvent) => {
        if (up.pointerId !== pointerId) return
        stop()
        if (!lifted) return
        setGhost(null)
        dropAt({ x: up.clientX, y: up.clientY - GHOST_ABOVE_FINGER }, block)
        // Long enough for the click a browser may still send after the touch.
        setTimeout(() => {
          justDragged.current = false
        }, 400)
      }

      const handleCancel = (cancel: PointerEvent) => {
        if (cancel.pointerId !== pointerId) return
        stop()
        setGhost(null)
        justDragged.current = false
      }

      window.addEventListener("pointermove", handleMove)
      window.addEventListener("pointerup", handleUp)
      window.addEventListener("pointercancel", handleCancel)
      cleanup.current = stop
    },
    [dropAt, onLift],
  )

  const preview = ghost
    ? createPortal(
        <div
          data-testid="block-drag-ghost"
          aria-hidden="true"
          className="pointer-events-none fixed z-[70] rounded-xl border border-primary/40 bg-card/90 p-2 shadow-2xl backdrop-blur"
          style={{ left: ghost.x, top: ghost.y - GHOST_ABOVE_FINGER, transform: "translate(-50%, -50%) scale(1.15)" }}
        >
          <BlockShapePreview type={ghost.block.type} variant={ghost.block.variant} compact />
        </div>,
        document.body,
      )
    : null

  return { onPointerDown, preview, justDragged }
}
