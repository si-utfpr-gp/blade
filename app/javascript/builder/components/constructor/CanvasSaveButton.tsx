import { useState } from "react"
import { Cloud, HardDrive, Save } from "lucide-react"
import { useToast } from "../ui/Toast"
import { useConstructor } from "./ConstructorProvider"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { serializeDiagramForSave } from "./serializeDiagram"
import { ChoiceDialog, ConfirmDialog, type IDialogChoice } from "../ui/ConfirmDialog"
import { useLocalAlgorithms } from "./LocalAlgorithmsProvider"

export function CanvasSaveButton() {
  const { nodes, edges, markClean } = useConstructor()
  const { saveAlgorithm, updateAlgorithm, status, error, signedIn } = useAlgorithms()
  const { origin, isReadOnly, markSaved, markLocal } = useDiagramOrigin()
  const { algorithmName, flagMissingName } = useAlgorithmNameField()
  const {
    saveDiagram: saveLocalDiagram,
    updateAlgorithm: updateLocalAlgorithm,
    deleteAlgorithm: deleteLocalAlgorithm,
  } = useLocalAlgorithms()
  const { notify } = useToast()
  const [emptyWarning, setEmptyWarning] = useState(false)
  const [choosing, setChoosing] = useState(false)

  // Kept on this machine: the browser's own store, the only one without an
  // account. A file from this machine is updated in place.
  const saveHere = () => {
    const trimmed = algorithmName.trim()
    const diagram = serializeDiagramForSave(nodes, edges)

    if (origin.kind === "local") {
      if (updateLocalAlgorithm(origin.id, trimmed, diagram)) markClean()
      return
    }

    const kept = saveLocalDiagram(trimmed, diagram)
    if (!kept) return
    markLocal(kept.id)
    markClean()
  }

  // Saving an empty canvas is almost never the intent: on a saved algorithm it
  // would overwrite good work with nothing, and a new one would store an
  // algorithm that cannot do anything. Still allowed, but only on purpose.
  const saveToAccount = async () => {
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

    if (!result.ok) {
      notify(result.message, "error")
      return
    }

    // A diagram that came from this browser now lives on an account. Leaving
    // the local copy behind would put the same algorithm in two lists and let
    // the student edit one and lose the other, so the move is the point.
    if (origin.kind === "local") deleteLocalAlgorithm(origin.id)

    markSaved(result.algorithm.id)
    markClean()
    notify(`Algoritmo "${result.algorithm.name}" salvo.`, "success")
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
    proceed()
  }

  // An algorithm on the account is updated there. Without an account the
  // only place is this machine. Otherwise the student picks.
  const proceed = () => {
    if (origin.kind === "saved") {
      void saveToAccount()
    } else if (!signedIn) {
      saveHere()
    } else {
      setChoosing(true)
    }
  }

  const choose = (destination: () => void | Promise<void>) => () => {
    setChoosing(false)
    void destination()
  }

  const choices: IDialogChoice[] =
    origin.kind === "local"
      ? [
          {
            label: "Atualizar nesta máquina",
            description: "Guarda as mudanças no arquivo deste navegador.",
            icon: <HardDrive className="h-4 w-4" aria-hidden="true" />,
            onSelect: choose(saveHere),
          },
          {
            label: "Enviar para minha conta",
            description: "Leva o algoritmo para a sua conta, onde você o abre em qualquer computador. Ele sai desta máquina.",
            icon: <Cloud className="h-4 w-4" aria-hidden="true" />,
            onSelect: choose(saveToAccount),
          },
        ]
      : [
          {
            label: "Nesta máquina",
            description: "Fica só neste navegador, em Meus arquivos.",
            icon: <HardDrive className="h-4 w-4" aria-hidden="true" />,
            onSelect: choose(saveHere),
          },
          {
            label: "Na minha conta",
            description: "Fica em Meus algoritmos, e você o abre em qualquer computador.",
            icon: <Cloud className="h-4 w-4" aria-hidden="true" />,
            onSelect: choose(saveToAccount),
          },
        ]

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
      : signedIn
        ? "Salvar nesta máquina ou na sua conta"
        : "Salvar nesta máquina"

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
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8"
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
          proceed()
        }}
        onCancel={() => setEmptyWarning(false)}
      />
      <ChoiceDialog
        open={choosing}
        title="Onde salvar?"
        choices={choices}
        onCancel={() => setChoosing(false)}
      />
    </div>
  )
}
