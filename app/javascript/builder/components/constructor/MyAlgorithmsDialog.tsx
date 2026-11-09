import * as DialogPrimitive from "@radix-ui/react-dialog"
import { FolderOpen, X } from "lucide-react"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useOpenSavedAlgorithm } from "./useOpenSavedAlgorithm"
import { useToast } from "../ui/Toast"

interface IMyAlgorithmsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The student's saved algorithms, opened from the account menu. Picking one
 * loads it onto the canvas, like the sidebar list does; a page per algorithm
 * (/builder/:id) is meant to replace this later.
 */
export default function MyAlgorithmsDialog({ open, onOpenChange }: IMyAlgorithmsDialogProps) {
  const { algorithms, status, error } = useAlgorithms()
  const openSaved = useOpenSavedAlgorithm()
  const { notify } = useToast()

  const handleOpen = async (id: number) => {
    const saved = await openSaved(id)
    if (!saved) {
      notify("Não foi possível abrir o algoritmo.", "error")
      return
    }
    onOpenChange(false)
    notify(`Algoritmo "${saved.name}" aberto.`, "success")
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-semibold">
              <FolderOpen className="h-5 w-5 text-primary" />
              Meus algoritmos
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            Escolha um algoritmo salvo para abrir no canvas.
          </DialogPrimitive.Description>

          <div className="overflow-y-auto p-3">
            {status === "loading" && algorithms.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Carregando…</p>
            ) : error && algorithms.length === 0 ? (
              <p role="alert" className="px-2 py-6 text-center text-sm text-destructive">{error}</p>
            ) : algorithms.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Nenhum algoritmo salvo ainda. Monte um diagrama, dê um nome e use o botão de salvar.
              </p>
            ) : (
              <ul className="space-y-1">
                {algorithms.map((algorithm) => (
                  <li key={algorithm.id}>
                    <button
                      type="button"
                      onClick={() => void handleOpen(algorithm.id)}
                      className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left hover:bg-muted/60 focus:bg-muted/60 focus:outline-none"
                    >
                      <span className="break-words text-sm font-medium text-foreground">{algorithm.name}</span>
                      <span className="text-xs text-muted-foreground">Salvo em {algorithm.created_at}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
