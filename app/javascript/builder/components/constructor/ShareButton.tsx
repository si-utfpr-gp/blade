import { useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Copy, Link2, Lock, Share2, X } from "lucide-react"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useConstructor } from "./ConstructorProvider"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useToast } from "../ui/Toast"
import { ConfirmDialog } from "../ui/ConfirmDialog"
import { csrfToken } from "../../lib/csrf"

interface ShareLinks {
  shareUrl: string
  embedUrl: string
}

const linksFor = (token: string): ShareLinks => ({
  shareUrl: `${window.location.origin}/s/${token}`,
  embedUrl: `${window.location.origin}/embed/${token}`,
})

/** The snippet a page (the course book, a class site) pastes to embed it. */
export function embedCode(embedUrl: string, name: string): string {
  const title = name.replace(/"/g, "&quot;")
  return `<iframe src="${embedUrl}" title="${title} no Blade" width="100%" height="560" style="border:1px solid #e2e8f0;border-radius:12px" loading="lazy"></iframe>`
}

/**
 * The owner's control over the public link of the saved algorithm on the
 * canvas. Every algorithm starts private; creating the link gives the address
 * and the code to embed it, and turning it off breaks the link for everyone,
 * including the pages that embed it.
 */
export function ShareButton() {
  const { algorithms, signedIn, loadAlgorithms } = useAlgorithms()
  const { origin } = useDiagramOrigin()
  const { isDirty } = useConstructor()
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmOff, setConfirmOff] = useState(false)
  // What the last request answered; until then, what the list says.
  const [override, setOverride] = useState<{ id: number; links: ShareLinks | null } | null>(null)

  if (!signedIn || origin.kind !== "saved") return null

  const algorithm = algorithms.find((item) => item.id === origin.id)
  const links =
    override?.id === origin.id
      ? override.links
      : algorithm?.share_token
        ? linksFor(algorithm.share_token)
        : null

  const request = async (method: "POST" | "DELETE") => {
    setBusy(true)
    try {
      const response = await fetch(`/algorithms/${origin.id}/share`, {
        method,
        headers: { Accept: "application/json", "X-CSRF-Token": csrfToken() },
      })
      if (!response.ok) throw new Error()
      if (method === "POST") {
        const body = (await response.json()) as { share_url: string; embed_url: string }
        setOverride({ id: origin.id, links: { shareUrl: body.share_url, embedUrl: body.embed_url } })
      } else {
        setOverride({ id: origin.id, links: null })
      }
      void loadAlgorithms()
    } catch {
      notify("Não foi possível atualizar o link. Tente novamente.", "error")
    } finally {
      setBusy(false)
    }
  }

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notify(`${what} copiado.`, "success")
    } catch {
      notify("Não foi possível copiar. Selecione o texto e copie.", "error")
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Compartilhar algoritmo"
        title="Compartilhar"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 sm:h-8 sm:w-8"
      >
        <Share2 className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-semibold">
                <Share2 className="h-5 w-5 text-primary" aria-hidden="true" />
                Compartilhar
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Fechar"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">
              Crie ou desative o link público deste algoritmo.
            </DialogPrimitive.Description>

            <div className="space-y-4 overflow-y-auto p-5 text-sm">
              {links ? (
                <>
                  <p className="text-muted-foreground">
                    Qualquer pessoa com o link vê e executa o algoritmo, sem poder alterá-lo. Ele mostra
                    sempre a versão salva mais recente.
                  </p>
                  {isDirty && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-200">
                      Há alterações ainda não salvas: elas só aparecem no link depois de salvar.
                    </p>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="share-link" className="font-medium text-foreground">Link público</label>
                    <div className="flex gap-2">
                      <input
                        id="share-link"
                        readOnly
                        value={links.shareUrl}
                        onFocus={(event) => event.currentTarget.select()}
                        className="min-w-0 flex-1 rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => void copy(links.shareUrl, "Link")}
                        className="flex items-center gap-1.5 rounded-lg border px-3 text-xs font-medium hover:bg-muted/50"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="share-embed" className="font-medium text-foreground">Código para incorporar</label>
                    <textarea
                      id="share-embed"
                      readOnly
                      rows={4}
                      value={embedCode(links.embedUrl, algorithm?.name ?? "Algoritmo")}
                      onFocus={(event) => event.currentTarget.select()}
                      className="w-full resize-none rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">Cole numa página, como o livro da disciplina.</p>
                      <button
                        type="button"
                        onClick={() => void copy(embedCode(links.embedUrl, algorithm?.name ?? "Algoritmo"), "Código")}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar código
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-border pt-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmOff(true)}
                      className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                    >
                      Desativar link
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      Só você vê este algoritmo. Crie um link público para mostrá-lo a outras pessoas ou
                      incorporá-lo numa página; dá para desativar quando quiser.
                    </span>
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void request("POST")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    <Link2 className="h-4 w-4" aria-hidden="true" /> Criar link público
                  </button>
                </>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <ConfirmDialog
        open={confirmOff}
        title="Desativar o link público?"
        description="O link e as páginas que incorporam este algoritmo deixam de mostrá-lo. Um novo link terá outro endereço."
        confirmLabel="Desativar"
        destructive
        onConfirm={() => {
          setConfirmOff(false)
          void request("DELETE")
        }}
        onCancel={() => setConfirmOff(false)}
      />
    </>
  )
}
