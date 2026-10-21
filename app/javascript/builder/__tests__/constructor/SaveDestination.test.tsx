import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ToastProvider } from "../../components/ui/Toast"
import { ConstructorProvider, useConstructor } from "../../components/constructor/ConstructorProvider"
import { LocalAlgorithmsProvider, useLocalAlgorithms } from "../../components/constructor/LocalAlgorithmsProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { AlgorithmNameProvider, useAlgorithmNameField } from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider, useDiagramOrigin } from "../../components/constructor/DiagramOrigin"
import { CanvasSaveButton, SaveLocalButton } from "../../components/constructor/CanvasSaveButton"

// Without an account the diagram is kept on this machine. With one, saving
// goes to the account, while a button of its own keeps a copy on this
// machine, and a file from this machine can be updated or sent to the account.
function Probe() {
  const { algorithmName, onAlgorithmNameChange } = useAlgorithmNameField()
  const { origin, markLocal } = useDiagramOrigin()
  const { algorithms, saveDiagram } = useLocalAlgorithms()
  const { addNode } = useConstructor()
  return (
    <div>
      <input
        aria-label="Nome do algoritmo"
        value={algorithmName}
        onChange={(event) => onAlgorithmNameChange(event.target.value)}
      />
      <span data-testid="origin">{origin.kind}</span>
      <span data-testid="local">{algorithms.map((item) => `${item.name}:${item.diagram.nodes.length}`).join(",")}</span>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>
        bloco
      </button>
      <button
        type="button"
        onClick={() => {
          const kept = saveDiagram("Contador", { nodes: [], edges: [] }, { quiet: true })
          if (kept) markLocal(kept.id)
        }}
      >
        abrir-local
      </button>
    </div>
  )
}

function renderSave(signedIn: boolean) {
  return render(
    <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn={signedIn}>
          <LocalAlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <Probe />
                  <CanvasSaveButton />
                  <SaveLocalButton />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </LocalAlgorithmsProvider>
        </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function name(value: string) {
  fireEvent.change(screen.getByLabelText("Nome do algoritmo"), { target: { value } })
}

function save() {
  fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo|atualizar algoritmo/i }))
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  let value: string | null = null
  vi.stubGlobal("localStorage", {
    getItem: () => value,
    setItem: (_: string, next: string) => {
      value = next
    },
    removeItem: () => {},
  })
  fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function posts() {
  return fetchMock.mock.calls.filter(([, options]) => options?.method === "POST")
}

describe("salvar sem conta", () => {
  it("guarda um diagrama novo nesta máquina, sem perguntar", async () => {
    renderSave(false)
    fireEvent.click(screen.getByRole("button", { name: "bloco" }))
    name("Soma")

    save()

    await waitFor(() => expect(screen.getByTestId("local")).toHaveTextContent("Soma:1"))
    expect(screen.getByTestId("origin")).toHaveTextContent("local")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(posts()).toHaveLength(0)
  })

  it("atualiza o arquivo desta máquina em vez de criar outro", async () => {
    renderSave(false)
    fireEvent.click(screen.getByRole("button", { name: "abrir-local" }))
    fireEvent.click(screen.getByRole("button", { name: "bloco" }))
    name("Contador")

    save()

    await waitFor(() => expect(screen.getByTestId("local")).toHaveTextContent("Contador:1"))
    expect(screen.getByTestId("local").textContent?.split(",")).toHaveLength(1)
  })
})

describe("salvar com conta", () => {
  it("salva um diagrama novo direto na conta, sem perguntar", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 9, name: "Soma", diagram: { nodes: [], edges: [] }, created_at: "2026-10-20" }, 201))
    renderSave(true)
    fireEvent.click(screen.getByRole("button", { name: "bloco" }))
    name("Soma")

    save()

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await waitFor(() => expect(posts()).toHaveLength(1))
    await waitFor(() => expect(screen.getByTestId("origin")).toHaveTextContent("saved"))
  })

  it("guarda nesta máquina pelo botão próprio", async () => {
    renderSave(true)
    fireEvent.click(screen.getByRole("button", { name: "bloco" }))
    name("Soma")

    fireEvent.click(screen.getByRole("button", { name: /salvar nesta máquina/i }))

    await waitFor(() => expect(screen.getByTestId("local")).toHaveTextContent("Soma:1"))
    expect(screen.getByTestId("origin")).toHaveTextContent("local")
    expect(posts()).toHaveLength(0)
  })

  it("oferece atualizar o arquivo desta máquina ou enviá-lo para a conta", () => {
    renderSave(true)
    fireEvent.click(screen.getByRole("button", { name: "abrir-local" }))
    fireEvent.click(screen.getByRole("button", { name: "bloco" }))
    name("Contador")

    save()

    expect(screen.getByRole("button", { name: /atualizar nesta máquina/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /enviar para minha conta/i })).toBeInTheDocument()
  })

  it("não grava nada quando o aluno desiste da escolha", () => {
    renderSave(true)
    fireEvent.click(screen.getByRole("button", { name: "abrir-local" }))
    fireEvent.click(screen.getByRole("button", { name: "bloco" }))
    name("Contador")
    save()

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

    expect(screen.getByTestId("local")).toHaveTextContent("Contador:0")
    expect(posts()).toHaveLength(0)
  })
})

describe("botão Salvar nesta máquina", () => {
  it("não aparece para quem não entrou, porque o Salvar já guarda aqui", () => {
    renderSave(false)

    expect(screen.queryByRole("button", { name: /salvar nesta máquina/i })).not.toBeInTheDocument()
  })
})
