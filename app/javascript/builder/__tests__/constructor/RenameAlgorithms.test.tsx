import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ToastProvider } from "../../components/ui/Toast"
import { ConstructorProvider } from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { LocalAlgorithmsProvider } from "../../components/constructor/LocalAlgorithmsProvider"
import { AlgorithmNameProvider, useAlgorithmNameField } from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "../../components/constructor/DiagramOrigin"
import { ExamplesSection } from "../../components/constructor/ExamplesSection"

// Files and algorithms could be deleted from the lists but not renamed. Each
// row now has a pencil: the name turns into a field, Enter keeps the new one
// and Escape gives up.
const diagram = { nodes: [], edges: [] }

function NameProbe() {
  const { algorithmName } = useAlgorithmNameField()
  return <span data-testid="name">{algorithmName}</span>
}

function renderLists(signedIn: boolean) {
  return render(
    <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn={signedIn}>
          <LocalAlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <ExamplesSection />
                  <NameProbe />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </LocalAlgorithmsProvider>
        </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

let stored: string | null

beforeEach(() => {
  stored = JSON.stringify([{ id: "a", name: "Contador", diagram, created_at: "2026-10-14T12:00:00.000Z" }])
  vi.stubGlobal("localStorage", {
    getItem: () => stored,
    setItem: (_: string, next: string) => {
      stored = next
    },
    removeItem: () => {},
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function openFiles() {
  fireEvent.click(screen.getByRole("button", { name: /^meus arquivos/i }))
}

describe("renomear em Meus arquivos", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }))
  })

  it("troca o nome com Enter e guarda no navegador", () => {
    renderLists(false)
    openFiles()

    fireEvent.click(screen.getByRole("button", { name: 'Renomear "Contador"' }))
    const field = screen.getByRole("textbox", { name: /novo nome/i })
    expect(field).toHaveValue("Contador")
    fireEvent.change(field, { target: { value: "Contador até dez" } })
    fireEvent.keyDown(field, { key: "Enter" })

    expect(screen.getByRole("button", { name: /^Contador até dez/ })).toBeInTheDocument()
    expect(JSON.parse(stored ?? "[]")[0].name).toBe("Contador até dez")
  })

  it("desiste com Escape, sem mudar nada", () => {
    renderLists(false)
    openFiles()

    fireEvent.click(screen.getByRole("button", { name: 'Renomear "Contador"' }))
    const field = screen.getByRole("textbox", { name: /novo nome/i })
    fireEvent.change(field, { target: { value: "Outro" } })
    fireEvent.keyDown(field, { key: "Escape" })

    expect(screen.queryByRole("textbox", { name: /novo nome/i })).not.toBeInTheDocument()
    expect(JSON.parse(stored ?? "[]")[0].name).toBe("Contador")
  })

  it("não aceita um nome vazio", () => {
    renderLists(false)
    openFiles()

    fireEvent.click(screen.getByRole("button", { name: 'Renomear "Contador"' }))
    const field = screen.getByRole("textbox", { name: /novo nome/i })
    fireEvent.change(field, { target: { value: "   " } })
    fireEvent.keyDown(field, { key: "Enter" })

    expect(JSON.parse(stored ?? "[]")[0].name).toBe("Contador")
  })

  it("limita o nome ao mesmo tamanho do campo do algoritmo", () => {
    renderLists(false)
    openFiles()

    fireEvent.click(screen.getByRole("button", { name: 'Renomear "Contador"' }))

    expect(screen.getByRole("textbox", { name: /novo nome/i })).toHaveAttribute("maxLength", "50")
  })

  it("atualiza o nome no topo quando o arquivo renomeado é o que está aberto", () => {
    renderLists(false)
    openFiles()
    fireEvent.click(screen.getByRole("button", { name: /^Contador,/ }))
    openFiles()

    fireEvent.click(screen.getByRole("button", { name: 'Renomear "Contador"' }))
    const field = screen.getByRole("textbox", { name: /novo nome/i })
    fireEvent.change(field, { target: { value: "Contador novo" } })
    fireEvent.keyDown(field, { key: "Enter" })

    expect(screen.getByTestId("name")).toHaveTextContent("Contador novo")
  })
})

describe("renomear em Meus algoritmos", () => {
  it("manda o nome novo para a conta, com o mesmo diagrama", async () => {
    const saved = { id: 7, name: "Fatorial", diagram, created_at: "2026-10-14" }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [saved] })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...saved, name: "Fatorial de n" }) })
    vi.stubGlobal("fetch", fetchMock)
    renderLists(true)
    fireEvent.click(screen.getByRole("button", { name: /^meus algoritmos/i }))

    fireEvent.click(await screen.findByRole("button", { name: 'Renomear "Fatorial"' }))
    const field = screen.getByRole("textbox", { name: /novo nome/i })
    fireEvent.change(field, { target: { value: "Fatorial de n" } })
    fireEvent.keyDown(field, { key: "Enter" })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe("/algorithms/7")
    expect(options.method).toBe("PATCH")
    expect(JSON.parse(options.body)).toEqual({ name: "Fatorial de n", diagram })
    expect(await screen.findByRole("button", { name: /^Fatorial de n/ })).toBeInTheDocument()
  })

  it("mostra o motivo quando a conta recusa o nome", async () => {
    const saved = { id: 7, name: "Fatorial", diagram, created_at: "2026-10-14" }
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [saved] })
        .mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({ errors: ["Já existe um algoritmo com esse nome"] }) }),
    )
    renderLists(true)
    fireEvent.click(screen.getByRole("button", { name: /^meus algoritmos/i }))

    fireEvent.click(await screen.findByRole("button", { name: 'Renomear "Fatorial"' }))
    const field = screen.getByRole("textbox", { name: /novo nome/i })
    fireEvent.change(field, { target: { value: "Soma" } })
    fireEvent.keyDown(field, { key: "Enter" })

    expect(await screen.findByText(/já existe um algoritmo com esse nome/i)).toBeInTheDocument()
  })
})
