import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ConstructorProvider, useConstructor } from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { DiagramOriginProvider, useDiagramOrigin } from "../../components/constructor/DiagramOrigin"
import { ToastProvider } from "../../components/ui/Toast"
import { ShareButton } from "../../components/constructor/ShareButton"

/*
 * The owner's control over the public link of a saved algorithm: it starts
 * private, the owner creates the link and gets the code to embed it, and can
 * turn it off again.
 */

type Algorithm = { id: number; name: string; diagram: object; created_at: string; share_token: string | null }

let algorithms: Algorithm[]
let fetchMock: ReturnType<typeof vi.fn>

function Probe() {
  const { markSaved } = useDiagramOrigin()
  const { addNode } = useConstructor()
  return (
    <div>
      <button type="button" onClick={() => markSaved(5)}>abrir salvo</button>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>editar</button>
    </div>
  )
}

function renderShare() {
  return render(
    <ToastProvider>
      <SimulatorProvider>
        <AlgorithmsProvider signedIn>
          <DiagramOriginProvider>
            <ConstructorProvider>
              <Probe />
              <ShareButton />
            </ConstructorProvider>
          </DiagramOriginProvider>
        </AlgorithmsProvider>
      </SimulatorProvider>
    </ToastProvider>,
  )
}

async function openDialog() {
  fireEvent.click(screen.getByText("abrir salvo"))
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/algorithms", expect.anything()))
  fireEvent.click(await screen.findByRole("button", { name: /compartilhar/i }))
  return screen.findByRole("dialog", { name: /compartilhar/i })
}

describe("ShareButton", () => {
  beforeEach(() => {
    algorithms = [{ id: 5, name: "Soma", diagram: { nodes: [], edges: [] }, created_at: "", share_token: null }]
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/algorithms") return { ok: true, status: 200, json: async () => algorithms }
      if (url === "/algorithms/5/share" && init?.method === "POST") {
        algorithms[0].share_token = "tok123"
        return {
          ok: true,
          status: 200,
          json: async () => ({ share_url: "http://blade.test/s/tok123", embed_url: "http://blade.test/embed/tok123" }),
        }
      }
      if (url === "/algorithms/5/share" && init?.method === "DELETE") {
        algorithms[0].share_token = null
        return { ok: true, status: 204, json: async () => ({}) }
      }
      return { ok: false, status: 404, json: async () => ({}) }
    })
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("só aparece com um algoritmo salvo aberto", () => {
    renderShare()

    expect(screen.queryByRole("button", { name: /compartilhar/i })).toBeNull()
  })

  it("começa privado e cria o link público com o código para incorporar", async () => {
    renderShare()
    const dialog = await openDialog()

    expect(within(dialog).getByText(/só você vê este algoritmo/i)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: /criar link público/i }))

    expect(await within(dialog).findByDisplayValue("http://blade.test/s/tok123")).toBeInTheDocument()
    const code = within(dialog).getByLabelText(/código para incorporar/i) as HTMLTextAreaElement
    expect(code.value).toContain('src="http://blade.test/embed/tok123"')
    expect(code.value).toContain("<iframe")
    const post = fetchMock.mock.calls.find(([url, init]) => url === "/algorithms/5/share" && init?.method === "POST")
    expect(post?.[1]?.headers).toMatchObject({ "X-CSRF-Token": expect.any(String) })
  })

  it("mostra o link que já existe sem criar outro", async () => {
    algorithms[0].share_token = "existente"
    renderShare()
    const dialog = await openDialog()

    expect(await within(dialog).findByDisplayValue(`${window.location.origin}/s/existente`)).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false)
  })

  it("desativa o link depois de confirmar", async () => {
    algorithms[0].share_token = "existente"
    renderShare()
    const dialog = await openDialog()

    fireEvent.click(await within(dialog).findByRole("button", { name: /desativar link/i }))
    fireEvent.click(await screen.findByRole("button", { name: /^desativar$/i }))

    expect(await within(dialog).findByText(/só você vê este algoritmo/i)).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url, init]) => url === "/algorithms/5/share" && init?.method === "DELETE")).toBe(true)
  })

  it("avisa que alterações não salvas não aparecem no link", async () => {
    algorithms[0].share_token = "existente"
    renderShare()
    fireEvent.click(screen.getByText("editar"))
    const dialog = await openDialog()

    expect(within(dialog).getByText(/alterações ainda não salvas/i)).toBeInTheDocument()
  })
})
