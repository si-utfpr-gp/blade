import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ToastProvider } from "../../components/ui/Toast"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import {
  AlgorithmNameProvider,
  useAlgorithmNameField,
} from "../../components/constructor/AlgorithmNameProvider"
import {
  DiagramOriginProvider,
  useDiagramOrigin,
} from "../../components/constructor/DiagramOrigin"
import { CanvasActions } from "../../components/constructor/CanvasActions"

function HeaderNameInput() {
  const { algorithmName, onAlgorithmNameChange } = useAlgorithmNameField()
  return (
    <input
      aria-label="Nome do algoritmo"
      value={algorithmName}
      onChange={(event) => onAlgorithmNameChange(event.target.value)}
    />
  )
}

// Stands in for a saved algorithm being opened: blocks on the canvas, a name
// in the field and an identity that later saves would update in place.
function Probe() {
  const { nodes, loadCanvasNodes } = useConstructor()
  const { origin, markSaved, markExample } = useDiagramOrigin()
  return (
    <div>
      <span data-testid="node-count">{nodes.length}</span>
      <span data-testid="origin-kind">{origin.kind}</span>
      <button
        type="button"
        onClick={() =>
          loadCanvasNodes(
            [
              {
                id: "s1",
                type: "startEnd",
                position: { x: 10, y: 20 },
                data: { label: "Início", variant: "start" },
              },
            ],
            [],
          )
        }
      >
        abrir-salvo
      </button>
      <button type="button" onClick={() => markSaved(7)}>
        marcar-salvo
      </button>
      <button type="button" onClick={() => markExample("contador")}>
        marcar-exemplo
      </button>
    </div>
  )
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function renderActions() {
  return render(
    <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn>
          <DiagramOriginProvider>
            <AlgorithmNameProvider>
              <ConstructorProvider>
                <HeaderNameInput />
                <CanvasActions />
                <Probe />
              </ConstructorProvider>
            </AlgorithmNameProvider>
          </DiagramOriginProvider>
        </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

async function setupSavedAlgorithm() {
  renderActions()
  fireEvent.click(screen.getByRole("button", { name: "abrir-salvo" }))
  fireEvent.click(screen.getByRole("button", { name: "marcar-salvo" }))
  fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
    target: { value: "Contador" },
  })
}

describe("CanvasActions — Limpar × Novo Algoritmo", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(jsonResponse([]))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("Limpar esvazia o canvas", async () => {
    await setupSavedAlgorithm()

    fireEvent.click(screen.getByRole("button", { name: /^limpar$/i }))

    expect(screen.getByTestId("node-count").textContent).toBe("0")
  })

  it("Limpar mantém o nome, porque o algoritmo continua sendo o mesmo", async () => {
    await setupSavedAlgorithm()

    fireEvent.click(screen.getByRole("button", { name: /^limpar$/i }))

    expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue("Contador")
  })

  it("Limpar mantém o vínculo com o algoritmo salvo", async () => {
    await setupSavedAlgorithm()

    fireEvent.click(screen.getByRole("button", { name: /^limpar$/i }))

    expect(screen.getByTestId("origin-kind").textContent).toBe("saved")
  })

  it("Novo Algoritmo esvazia o canvas", async () => {
    await setupSavedAlgorithm()

    fireEvent.click(screen.getByRole("button", { name: /novo algoritmo/i }))

    expect(screen.getByTestId("node-count").textContent).toBe("0")
  })

  it("Novo Algoritmo limpa o nome, porque é outra coisa a ser criada", async () => {
    await setupSavedAlgorithm()

    fireEvent.click(screen.getByRole("button", { name: /novo algoritmo/i }))

    expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue("")
  })

  it("Novo Algoritmo solta o vínculo com o algoritmo salvo", async () => {
    await setupSavedAlgorithm()

    fireEvent.click(screen.getByRole("button", { name: /novo algoritmo/i }))

    expect(screen.getByTestId("origin-kind").textContent).toBe("blank")
  })

  it("os dois não são a mesma ação", async () => {
    await setupSavedAlgorithm()

    fireEvent.click(screen.getByRole("button", { name: /^limpar$/i }))
    const afterClear = screen.getByTestId("origin-kind").textContent

    fireEvent.click(screen.getByRole("button", { name: /novo algoritmo/i }))

    expect(screen.getByTestId("origin-kind").textContent).not.toBe(afterClear)
  })
})
describe("CanvasActions — Limpar sobre um exemplo", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([])))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("deixa uma tela editável, já que o exemplo é somente leitura", () => {
    renderActions()
    fireEvent.click(screen.getByRole("button", { name: "abrir-salvo" }))
    fireEvent.click(screen.getByRole("button", { name: "marcar-exemplo" }))

    fireEvent.click(screen.getByRole("button", { name: /^limpar$/i }))

    expect(screen.getByTestId("origin-kind").textContent).toBe("blank")
  })
})
