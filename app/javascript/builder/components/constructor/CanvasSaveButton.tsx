import { Save } from "lucide-react"
import { useToast } from "../ui/Toast"
import { useConstructor } from "./ConstructorProvider"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { serializeDiagramForSave } from "./serializeDiagram"

export function CanvasSaveButton() {
  const { nodes, edges } = useConstructor()
  const { saveAlgorithm, updateAlgorithm, status, error } = useAlgorithms()
  const { origin, isReadOnly, markSaved } = useDiagramOrigin()
  const { algorithmName, flagMissingName } = useAlgorithmNameField()
  const { notify } = useToast()

  const handleSave = async () => {
    if (isReadOnly) return

    const trimmed = algorithmName.trim()

    if (!trimmed) {
      // The button stays enabled on purpose: a disabled one only shows a grey
      // square with no explanation. Pointing at the field is what explains it.
      notify("Informe um nome para o algoritmo antes de salvar.", "error")
      flagMissingName()
      return
    }

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
      return
    }

    const result = await saveAlgorithm(trimmed, diagram)

    if (result.ok) {
      markSaved(result.algorithm.id)
      notify(`Algoritmo "${result.algorithm.name}" salvo.`, "success")
    } else {
      notify(result.message, "error")
    }
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
    </div>
  )
}
