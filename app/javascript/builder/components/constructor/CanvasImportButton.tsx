import { useCallback, useRef } from "react"
import { Upload } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useToast } from "../ui/Toast"
import { useDiscardGuard } from "./useDiscardGuard"
import { readImportedFile } from "./importDiagram"
import { layoutExampleDiagram } from "./layoutExampleDiagram"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"

/**
 * Opens a diagram from a JSON file, the counterpart of the export button. It
 * lives in the sidebar next to the lists, since that is where the student
 * looks for "my algorithms" in any form.
 *
 * Replacing the canvas throws the current diagram away, so a canvas with
 * unsaved edits asks first. An imported diagram belongs to no record: it is
 * named after its file, and saving afterwards creates a new algorithm. A file
 * without positions, like the diagrams in the docs, is laid out like the
 * bundled examples.
 */
export function CanvasImportButton() {
  const { loadCanvasNodes } = useConstructor()
  const { reset } = useSimulator()
  const { markBlank } = useDiagramOrigin()
  const { notify } = useToast()
  const { onAlgorithmNameChange } = useAlgorithmNameField()
  const { guard, dialog } = useDiscardGuard()
  const inputRef = useRef<HTMLInputElement>(null)

  const importFile = useCallback(
    async (file: File) => {
      const result = await readImportedFile(file)
      if (!result.ok) {
        notify(result.reason, "error")
        return
      }
      if (result.positioned) {
        loadCanvasNodes(result.diagram.nodes, result.diagram.edges)
      } else {
        const laidOut = layoutExampleDiagram({
          id: "import", title: "", description: "", category: "",
          diagram: result.diagram,
        })
        loadCanvasNodes(laidOut.nodes, laidOut.edges, { centers: laidOut.centers })
      }
      reset()
      markBlank()
      // A new algorithm, so it is named after the file it came from.
      onAlgorithmNameChange(file.name.replace(/\.json$/i, ""))
      notify("Algoritmo importado.", "success")
    },
    [loadCanvasNodes, reset, markBlank, onAlgorithmNameChange, notify],
  )

  const handleFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Cleared so picking the same file twice still fires the change.
      event.target.value = ""
      if (file) void importFile(file)
    },
    [importFile],
  )

  const openPicker = useCallback(() => inputRef.current?.click(), [])

  return (
    <>
      <button
        type="button"
        onClick={() => guard(openPicker)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-muted/50"
      >
        <Upload className="h-3 w-3" aria-hidden="true" /> Importar JSON
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        data-testid="import-file-input"
        className="hidden"
        tabIndex={-1}
        onChange={handleFile}
      />
      {dialog}
    </>
  )
}
