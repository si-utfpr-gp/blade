import { useCallback, useState, type KeyboardEvent } from "react"
import { useConstructor } from "../ConstructorProvider"

export function useEditableLabel(id: string, currentLabel: string) {
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
      if (e.key === "Enter") commit()
      if (e.key === "Escape") cancel()
    },
    [commit, cancel],
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
