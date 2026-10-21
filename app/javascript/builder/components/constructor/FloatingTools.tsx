import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { useReactFlow } from "@xyflow/react"
import { Focus, X } from "lucide-react"

const BALL_SIZE = 56
// Keeps the ball off the very edge, where the phone's own back gesture lives.
const EDGE_GAP = 8
// Below this the pointer is still a tap: fingers wobble a few pixels.
const DRAG_THRESHOLD = 6
const STORAGE_KEY = "blade:floating-tools-position"

type Point = { x: number; y: number }

function viewportSize() {
  const viewport = window.visualViewport
  return {
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  }
}

function clamp(point: Point): Point {
  const { width, height } = viewportSize()
  return {
    x: Math.min(Math.max(point.x, EDGE_GAP), Math.max(EDGE_GAP, width - BALL_SIZE - EDGE_GAP)),
    y: Math.min(Math.max(point.y, EDGE_GAP), Math.max(EDGE_GAP, height - BALL_SIZE - EDGE_GAP)),
  }
}

/** Like the phone's own assistive button, a released ball rests on the nearer side. */
function snapToSide(point: Point): Point {
  const { width } = viewportSize()
  const left = point.x + BALL_SIZE / 2 < width / 2
  return clamp({ x: left ? EDGE_GAP : width - BALL_SIZE - EDGE_GAP, y: point.y })
}

function initialPosition(): Point {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null")
    if (saved && typeof saved.x === "number" && typeof saved.y === "number") return snapToSide(saved)
  } catch {
    // Storage can be blocked or hold junk; the default spot is fine.
  }
  const { height } = viewportSize()
  return snapToSide({ x: Number.MAX_SAFE_INTEGER, y: height * 0.35 })
}

/** Lucide's wrench, in two tones of the project's blue. */
function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        fill="hsl(var(--primary) / 0.18)"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="5.6" cy="18.4" r="1" fill="currentColor" />
    </svg>
  )
}

/**
 * Fits the whole diagram back on screen, for the student who panned or zoomed
 * until they lost it.
 */
export function CenterDiagramButton() {
  const { fitView } = useReactFlow()

  return (
    <button
      type="button"
      onClick={() => fitView({ padding: 0.2, duration: 300, maxZoom: 1.5 })}
      aria-label="Centralizar diagrama"
      title="Centralizar diagrama"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50"
    >
      <Focus className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}

/**
 * The phone's canvas tools behind one floating ball. Mobile browsers show and
 * hide their own bars over the page, so no fixed bar of ours stayed visible;
 * the ball goes wherever the student drags it, and a tap opens the tools over
 * everything else.
 *
 * `children` gets a close function, for tools whose result the menu would
 * cover. The menu stays mounted while closed. Save and share open dialogs from
 * inside it, and unmounting the menu would close them halfway.
 */
export function FloatingTools({ children }: { children: (close: () => void) => ReactNode }) {
  const [position, setPosition] = useState<Point>(initialPosition)
  const [open, setOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointerId: number; start: Point; origin: Point; moved: boolean } | null>(null)
  // A drag ends with a click on the ball; this swallows that one click.
  const suppressClick = useRef(false)

  useEffect(() => {
    const keepInside = () => setPosition((current) => snapToSide(current))
    window.addEventListener("resize", keepInside)
    window.visualViewport?.addEventListener("resize", keepInside)
    return () => {
      window.removeEventListener("resize", keepInside)
      window.visualViewport?.removeEventListener("resize", keepInside)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (!target || rootRef.current?.contains(target)) return
      // A dialog opened from the menu is portaled out of it; touching it must
      // not count as touching the canvas.
      if (target.closest("[role='dialog'], [role='alertdialog']")) return
      setOpen(false)
    }
    document.addEventListener("pointerdown", closeOutside)
    return () => document.removeEventListener("pointerdown", closeOutside)
  }, [open])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return
      drag.current = {
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        origin: position,
        moved: false,
      }
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    [position],
  )

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const dx = event.clientX - current.start.x
    const dy = event.clientY - current.start.y
    if (!current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return

    if (!current.moved) {
      current.moved = true
      setDragging(true)
      setOpen(false)
    }
    setPosition(clamp({ x: current.origin.x + dx, y: current.origin.y + dy }))
  }, [])

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    drag.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    if (!current.moved) return

    suppressClick.current = true
    setDragging(false)
    const dx = event.clientX - current.start.x
    const dy = event.clientY - current.start.y
    const resting = snapToSide({ x: current.origin.x + dx, y: current.origin.y + dy })
    setPosition(resting)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resting))
    } catch {
      // Not remembering the spot only costs dragging it again next time.
    }
  }, [])

  const handleClick = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    setOpen((value) => !value)
  }, [])

  const { width, height } = viewportSize()
  const onLeft = position.x + BALL_SIZE / 2 < width / 2
  const nearBottom = position.y + BALL_SIZE / 2 > height / 2

  return (
    <div
      ref={rootRef}
      data-testid="floating-tools"
      className="fixed z-[60]"
      style={{
        left: position.x,
        top: position.y,
        transition: dragging ? "none" : "left 200ms ease-out, top 200ms ease-out",
      }}
    >
      <button
        type="button"
        aria-label="Ferramentas"
        aria-expanded={open}
        aria-controls="floating-tools-menu"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        // touch-none hands every finger movement to us, so the page does not
        // scroll or zoom while the ball is dragged.
        className={`flex touch-none select-none items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.45)] transition-[opacity,transform,box-shadow] duration-200 ${
          open || dragging ? "opacity-100" : "opacity-90"
        } ${dragging ? "scale-110 shadow-[0_10px_28px_-4px_hsl(var(--primary)/0.55)]" : ""}`}
        style={{ width: BALL_SIZE, height: BALL_SIZE }}
      >
        {/* The icon turns as the menu opens, so the change reads as one motion. */}
        <span
          className={`flex transition-transform duration-200 ${open ? "rotate-90" : "rotate-0"}`}
        >
          {open ? <X className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" /> : <WrenchIcon className="h-6 w-6" />}
        </span>
      </button>

      <div
        id="floating-tools-menu"
        role="group"
        aria-label="Ferramentas do canvas"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        className={`absolute grid w-max grid-cols-4 gap-1.5 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur transition-[opacity,transform] duration-150 ${
          onLeft ? "left-0" : "right-0"
        } ${nearBottom ? "bottom-full mb-2" : "top-full mt-2"} ${
          open ? "visible scale-100 opacity-100" : "invisible pointer-events-none scale-95 opacity-0"
        }`}
        style={{ maxWidth: `calc(100vw - ${EDGE_GAP * 2}px)` }}
      >
        {children(() => setOpen(false))}
      </div>
    </div>
  )
}
