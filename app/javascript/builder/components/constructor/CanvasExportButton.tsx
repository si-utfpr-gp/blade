import { useCallback, useState } from "react"
import { Download } from "lucide-react"
import { useToast } from "../ui/Toast"
import { ConfirmDialog } from "../ui/ConfirmDialog"
import { useConstructor } from "./ConstructorProvider"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { serializeDiagramForSave } from "./serializeDiagram"

// Exports the diagram as a file the student can keep, move to another
// computer or hand in. It works without an account, since that is exactly the
// case where there is nowhere to save it on the server.
export function CanvasExportButton() {
  const { nodes, edges } = useConstructor()
  const { algorithmName } = useAlgorithmNameField()
  const { notify } = useToast()
  const [asking, setAsking] = useState(false)

  const file = fileName(algorithmName)

  const download = useCallback(() => {
    const diagram = serializeDiagramForSave(nodes, edges)
    const blob = new Blob([ JSON.stringify(diagram, null, 2 ) ], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = file
    link.click()
    // Once the download has started nothing reads the URL again, and holding it
    // would keep the whole diagram in memory for the life of the tab.
    URL.revokeObjectURL(url)
    notify("Algoritmo exportado.", "success")
  }, [nodes, edges, file, notify])

  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        aria-label="Exportar algoritmo"
        title="Exportar algoritmo"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 sm:h-8 sm:w-8"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* A download is easy to trigger by accident next to the zoom controls,
          and the browser saves it under the same name every time, so the
          student is told which file is about to land before it does. */}
      <ConfirmDialog
        open={asking}
        title="Baixar o algoritmo?"
        description={`O arquivo "${file}" vai para os downloads do navegador.`}
        confirmLabel="Baixar"
        onConfirm={() => {
          setAsking(false)
          download()
        }}
        onCancel={() => setAsking(false)}
      />
    </>
  )
}

function fileName(algorithmName: string): string {
  const trimmed = algorithmName.trim()
  if (!trimmed) return "blade-algoritmo.json"

  // The name comes from a text field, so it can hold anything the keyboard and
  // an import allow. Stripping the characters a file system or a browser
  // rejects keeps the download from landing as "download" with no extension.
  const safe = trimmed.replace(/[\\/:*?"<>|]/g, "").trim()
  return `${safe || "blade-algoritmo"}.json`
}