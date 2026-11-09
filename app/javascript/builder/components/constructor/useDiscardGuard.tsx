import { useCallback, useState, type ReactNode } from "react"
import { useConstructor } from "./ConstructorProvider"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { ConfirmDialog } from "../ui/ConfirmDialog"

/**
 * Wraps an action that throws the current diagram away, so it asks first
 * whenever there is unsaved work to lose.
 *
 * An action that finds nothing to discard runs straight through: a student who
 * clicks "Limpar" on an empty canvas should not be made to confirm that
 * nothing happened.
 */
export function useDiscardGuard() {
  const { isDirty } = useConstructor()
  const { algorithmName } = useAlgorithmNameField()
  // Wrapped so React stores the action itself instead of calling it.
  const [pending, setPending] = useState<(() => void) | null>(null)

  const guard = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setPending(() => action)
        return
      }
      action()
    },
    [isDirty],
  )

  const confirm = useCallback(() => {
    pending?.()
    setPending(null)
  }, [pending])

  const cancel = useCallback(() => setPending(null), [])

  const dialog: ReactNode = (
    <ConfirmDialog
      open={pending !== null}
      title="Descartar as alterações?"
      description={
        algorithmName.trim()
          ? `"${algorithmName.trim()}" tem alterações que você ainda não salvou. Descartar não pode ser desfeito.`
          : "Este algoritmo tem alterações que você ainda não salvou. Descartar não pode ser desfeito."
      }
      confirmLabel="Descartar"
      destructive
      onConfirm={confirm}
      onCancel={cancel}
    />
  )

  return { guard, dialog }
}