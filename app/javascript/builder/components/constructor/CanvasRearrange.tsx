import { ControlButton, useReactFlow } from "@xyflow/react"
import { Workflow } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"

const LABEL = "Reorganizar fluxograma"

function useRearrange(locked: boolean) {
  const { rearrange, nodes } = useConstructor()
  const { fitView } = useReactFlow()
  const disabled = locked || nodes.length === 0
  return {
    disabled,
    run: () => {
      if (disabled) return
      rearrange()
      // The layout can land far from where the student was looking; framing
      // it waits a frame for React Flow to take the new positions.
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300, maxZoom: 1.5 }))
    },
  }
}

/** Reorganizar, next to the zoom controls on a computer. */
export function RearrangeControlButton({ locked }: { locked: boolean }) {
  const { disabled, run } = useRearrange(locked)
  return (
    <ControlButton onClick={run} disabled={disabled} aria-label={LABEL} title={LABEL}>
      {/* React Flow fills its control icons; Lucide draws with strokes. */}
      <Workflow aria-hidden="true" strokeWidth={2.25} style={{ fill: "none", maxWidth: 14, maxHeight: 14 }} />
    </ControlButton>
  )
}

/** The same in the phone's floating tools menu. */
export function RearrangeMenuButton({ locked }: { locked: boolean }) {
  const { disabled, run } = useRearrange(locked)
  return (
    <button
      type="button"
      onClick={run}
      disabled={disabled}
      aria-label={LABEL}
      title={LABEL}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Workflow className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
