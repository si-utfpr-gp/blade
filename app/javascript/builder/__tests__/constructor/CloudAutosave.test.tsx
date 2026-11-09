import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BuilderProviders } from "../test-utils"
import { useConstructor } from "../../components/constructor/ConstructorProvider"
import { useAlgorithmNameField } from "../../components/constructor/AlgorithmNameProvider"
import { useDiagramOrigin } from "../../components/constructor/DiagramOrigin"
import { CloudAutosave, AUTOSAVE_DELAY_MS } from "../../components/constructor/CloudAutosave"

// Signed in, a new algorithm reaches the account on its own once it has a
// name, and every later change follows, so closing the tab never loses work
// that only lived on screen. A visitor keeps saving by hand, on this machine.
function Probe() {
  const { algorithmName, onAlgorithmNameChange } = useAlgorithmNameField()
  const { origin, markExample, markLocal } = useDiagramOrigin()
  const { addNode } = useConstructor()
  return (
    <div>
      <input aria-label="Nome do algoritmo" value={algorithmName} onChange={(event) => onAlgorithmNameChange(event.target.value)} />
      <span data-testid="origin">{origin.kind === "saved" ? `saved:${origin.id}` : origin.kind}</span>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>bloco</button>
      <button type="button" onClick={() => markExample("soma")}>exemplo</button>
      <button type="button" onClick={() => markLocal("l1")}>local</button>
    </div>
  )
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

let fetchMock: ReturnType<typeof vi.fn>

function writes(method: string) {
  return fetchMock.mock.calls.filter(([, options]) => options?.method === method)
}

function renderAutosave(signedIn = true) {
  return render(
    <BuilderProviders signedIn={signedIn}>
      <Probe />
      <CloudAutosave />
    </BuilderProviders>,
  )
}

function typeName(value: string) {
  fireEvent.change(screen.getByLabelText("Nome do algoritmo"), { target: { value } })
}

const wait = { timeout: AUTOSAVE_DELAY_MS + 1500 }

beforeEach(() => {
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} })
  fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
    if (options?.method === "POST") {
      const body = JSON.parse(String(options.body))
      return jsonResponse({ id: 31, name: body.name, diagram: body.diagram, created_at: "2026-10-20" }, 201)
    }
    if (options?.method === "PATCH") {
      const body = JSON.parse(String(options.body))
      return jsonResponse({ id: 31, name: body.name, diagram: body.diagram, created_at: "2026-10-20" })
    }
    return jsonResponse([])
  })
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("salvar sozinho na conta", () => {
  it("cria o algoritmo na conta assim que ele ganha um nome", async () => {
    renderAutosave()

    typeName("Contador")

    await waitFor(() => expect(writes("POST")).toHaveLength(1), wait)
    expect(JSON.parse(String(writes("POST")[0][1].body)).name).toBe("Contador")
    await waitFor(() => expect(screen.getByTestId("origin")).toHaveTextContent("saved:31"))
  })

  it("espera a pessoa parar de digitar, em vez de salvar a cada letra", async () => {
    renderAutosave()

    typeName("C")
    typeName("Co")
    typeName("Contador")

    await waitFor(() => expect(writes("POST")).toHaveLength(1), wait)
    expect(JSON.parse(String(writes("POST")[0][1].body)).name).toBe("Contador")
  })

  it("segue salvando as mudanças depois de criado", async () => {
    renderAutosave()
    typeName("Contador")
    await waitFor(() => expect(screen.getByTestId("origin")).toHaveTextContent("saved:31"), wait)

    fireEvent.click(screen.getByRole("button", { name: "bloco" }))

    await waitFor(() => expect(writes("PATCH")).toHaveLength(1), wait)
    expect(JSON.parse(String(writes("PATCH")[0][1].body)).diagram.nodes).toHaveLength(1)
  })

  it("leva a troca de nome para a conta", async () => {
    renderAutosave()
    typeName("Contador")
    await waitFor(() => expect(screen.getByTestId("origin")).toHaveTextContent("saved:31"), wait)

    typeName("Contador até dez")

    await waitFor(() => expect(writes("PATCH")).toHaveLength(1), wait)
    expect(JSON.parse(String(writes("PATCH")[0][1].body)).name).toBe("Contador até dez")
  })

  it("mostra que está salvando e quando terminou", async () => {
    renderAutosave()
    typeName("Contador")

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/salvo na nuvem/i), wait)
  })

  it("não salva nada para quem não entrou", async () => {
    renderAutosave(false)
    typeName("Contador")

    await new Promise((resolve) => setTimeout(resolve, AUTOSAVE_DELAY_MS + 300))
    expect(writes("POST")).toHaveLength(0)
  })

  it("não salva um exemplo nem um arquivo desta máquina", async () => {
    renderAutosave()
    fireEvent.click(screen.getByRole("button", { name: "exemplo" }))
    typeName("Soma")
    fireEvent.click(screen.getByRole("button", { name: "local" }))
    typeName("Soma local")

    await new Promise((resolve) => setTimeout(resolve, AUTOSAVE_DELAY_MS + 300))
    expect(writes("POST")).toHaveLength(0)
    expect(writes("PATCH")).toHaveLength(0)
  })

  it("avisa uma vez quando a conta recusa, sem tentar de novo sozinho", async () => {
    fetchMock.mockImplementation(async (_url: string, options?: RequestInit) =>
      options?.method === "POST"
        ? jsonResponse({ errors: ["Já existe um algoritmo com esse nome"] }, 422)
        : jsonResponse([]),
    )
    renderAutosave()
    typeName("Contador")

    expect(await screen.findByText(/já existe um algoritmo com esse nome/i, {}, wait)).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, AUTOSAVE_DELAY_MS + 300))
    expect(writes("POST")).toHaveLength(1)
  })
})
