import { useState } from "react"
import { Save } from "lucide-react"
import { useToast } from "../ui/Toast"
import { useConstructor } from "./ConstructorProvider"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { serializeDiagramForSave } from "./serializeDiagram"
import { ConfirmDialog } from "../ui/ConfirmDialog"

export function CanvasSaveButton() {
  const { nodes, edges, markClean } = useConstructor()
  const { saveAlgorithm, updateAlgorithm, status, error } = useAlgorithms()
  const { origin, isReadOnly, markSaved } = useDiagramOrigin()
  const { algorithmName, flagMissingName } = useAlgorithmNameField()
  const { notify } = useToast()
  const [emptyWarning, setEmptyWarning] = useState(false)

  // Saving an empty canvas is almost never the intent: on a saved algorithm it
  // would overwrite good work with nothing, and a new one would store an
  // algorithm that cannot do anything. Still allowed, but only on purpose.
  const save = async () => {
    const trimmed = algorithmName.trim()
    const diagram = serializeDiagramForSave(nodes, edges)

    // A selected saved algorithm is updated in place; anything else is a new
    // record, so repeated saves never pile up duplicates.
    // The name stays in the field after saving: emptying it made the save look
    // like it had failed, and the diagram on screen is still that algorithm.
    if (origin.kind === "saved") {
      const result = await updateAlgorithm(origin.id, trimmed, diagram)

      // The API says why, for instance that the name is taken. A generic
      // message left the student with nothing to act on.
      notify(
        result.ok
          ? `Algoritmo "${result.algorithm.name}" atualizado.`
          : result.message,
        result.ok ? "success" : "error",
      )
      // Only a confirmed save becomes the new baseline: a rejection leaves the
      // edits counted as unsaved, which is what they still are.
      if (result.ok) markClean()
      return
    }

    const result = await saveAlgorithm(trimmed, diagram)

    if (result.ok) {
      markSaved(result.algorithm.id)
      markClean()
      notify(`Algoritmo "${result.algorithm.name}" salvo.`, "success")
    } else {
      notify(result.message, "error")
    }
  }

  const handleSave = () => {
    if (isReadOnly) return

    if (!algorithmName.trim()) {
      // The button stays enabled on purpose: a disabled one only shows a grey
      // square with no explanation. Pointing at the field is what explains it.
      // Checked before the empty canvas, since a name is the part the student
      // can act on right now.
      notify("Informe um nome para o algoritmo antes de salvar.", "error")
      flagMissingName()
      return
    }

    if (nodes.length === 0 && !emptyWarning) {
      setEmptyWarning(true)
      return
    }
    void save()
  }

  const saving = status === "saving"

  const label = isReadOnly
    ? "Exemplo não pode ser salvo"
    : origin.kind === "saved"
      ? "Atualizar algoritmo"
      : "Salvar algoritmo"

  const hint = isReadOnly
    ? "Exemplos não podem ser alterados"
    : origin.kind === "saved"
      ? "Atualizar o algoritmo atual"
      : "Salvar o algoritmo na sua conta"

  // Icon only, to leave room on small screens. With no visible text the
  // accessible name and the title carry the whole meaning: screen readers get
  // aria-label, and the desktop tooltip gets title. Touch has no hover, so
  // the label is also what explains a disabled button.
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || isReadOnly}
        aria-label={saving ? "Salvando..." : label}
        title={hint}
        className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-card/95 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8"
      >
        <Save className="h-5 w-5" aria-hidden="true" />
      </button>
      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
      <ConfirmDialog
        open={emptyWarning}
        title="Salvar sem nenhum bloco?"
        description={
          origin.kind === "saved"
            ? `O diagrama guardado em "${algorithmName.trim()}" será substituído por um vazio.`
            : "O algoritmo não terá nenhum bloco e não poderá ser executado."
        }
        confirmLabel="Salvar mesmo assim"
        destructive={origin.kind === "saved"}
        onConfirm={() => {
          setEmptyWarning(false)
          void save()
        }}
        onCancel={() => setEmptyWarning(false)}
      />
    </div>
  )
}
