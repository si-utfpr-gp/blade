import { ControlButton } from "@xyflow/react"
import { Lock, LockOpen } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"

function useEditLockToggle() {
  const { editLocked, setEditLocked } = useConstructor()
  return {
    editLocked,
    label: editLocked ? "Destravar edição" : "Travar edição",
    toggle: () => setEditLocked(!editLocked),
    Icon: editLocked ? Lock : LockOpen,
  }
}

/**
 * Takes the place of React Flow's own padlock, which only stopped dragging
 * and connecting: a block could still be dropped or tapped in, renamed or
 * deleted. This one locks the whole diagram through the constructor.
 */
export function EditLockControlButton() {
  const { editLocked, label, toggle, Icon } = useEditLockToggle()
  return (
    <ControlButton
      onClick={toggle}
      aria-label={label}
      aria-pressed={editLocked}
      title={label}
      style={editLocked ? { color: "hsl(var(--primary))" } : undefined}
    >
      {/* React Flow fills its control icons; Lucide draws with strokes. */}
      <Icon aria-hidden="true" strokeWidth={2.5} style={{ fill: "none", maxWidth: 14, maxHeight: 14 }} />
    </ControlButton>
  )
}

/** The same lock in the phone's floating tools menu. */
export function EditLockMenuButton() {
  const { editLocked, label, toggle, Icon } = useEditLockToggle()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={editLocked}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
        editLocked
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card/95 text-foreground hover:border-primary/40 hover:bg-muted/50"
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
