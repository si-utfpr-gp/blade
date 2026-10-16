import { useCallback, useEffect } from "react"
import { Redo2, Undo2 } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"

/**
 * Undo and redo for the canvas, as icon buttons next to the zoom controls and
 * as keyboard shortcuts. The touch target is bigger on small screens, where
 * there is no Ctrl+Z to fall back to.
 *
 * Locked means nothing on the canvas can change, which covers the read-only
 * example and a running simulation alike: the buttons go quiet and the
 * shortcuts pass the keys through instead of swallowing them.
 */
export function CanvasHistoryControls({ locked }: { locked: boolean }) {
  const { undo, redo, canUndo, canRedo } = useConstructor()
  const { reset } = useSimulator()

  const handleUndo = useCallback(() => {
    if (locked || !canUndo) return
    undo()
    // The run pointed at blocks that are no longer there, so it cannot continue.
    reset()
  }, [locked, canUndo, undo, reset])

  const handleRedo = useCallback(() => {
    if (locked || !canRedo) return
    redo()
    reset()
  }, [locked, canRedo, redo, reset])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (locked) return
      if (!event.ctrlKey && !event.metaKey) return

      // Inside a field Ctrl+Z belongs to the browser, which undoes the typing.
      // Stealing it would make editing the algorithm name undo a block instead.
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === "z" && !event.shiftKey) {
        event.preventDefault()
        handleUndo()
      } else if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [locked, handleUndo, handleRedo])

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleUndo}
        disabled={locked || !canUndo}
        aria-label="Desfazer"
        title="Desfazer (Ctrl+Z)"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-[26px] sm:w-[26px]"
      >
        <Undo2 className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={handleRedo}
        disabled={locked || !canRedo}
        aria-label="Refazer"
        title="Refazer (Ctrl+Y)"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-[26px] sm:w-[26px]"
      >
        <Redo2 className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
