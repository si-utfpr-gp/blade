import { useCallback, useState, type KeyboardEvent } from "react"
import { useConstructor } from "../ConstructorProvider"

/**
 * With `multiline`, Enter breaks the line and Ctrl+Enter (or Cmd+Enter)
 * confirms, as does leaving the field; on a phone, tapping outside it.
 */
export function useEditableLabel(
  id: string,
  currentLabel: string,
  { multiline = false }: { multiline?: boolean } = {},
) {
  const { updateNodeData } = useConstructor()
  const [editing, setEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(currentLabel)

  const startEditing = useCallback(() => {
    setDraftLabel(currentLabel)
    setEditing(true)
  }, [currentLabel])

  const commit = useCallback(() => {
    setEditing(false)
    updateNodeData(id, { label: draftLabel })
  }, [draftLabel, id, updateNodeData])

  const cancel = useCallback(() => {
    setEditing(false)
  }, [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && (!multiline || e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        commit()
      }
      if (e.key === "Escape") cancel()
    },
    [commit, cancel, multiline],
  )

  return {
    editing,
    label: editing ? draftLabel : currentLabel,
    setLabel: setDraftLabel,
    startEditing,
    commit,
    onKeyDown,
  }
}
