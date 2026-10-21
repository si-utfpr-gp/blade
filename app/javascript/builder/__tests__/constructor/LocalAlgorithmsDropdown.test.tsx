import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ToastProvider } from "../../components/ui/Toast"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import {
  LocalAlgorithmsProvider,
  useLocalAlgorithms,
} from "../../components/constructor/LocalAlgorithmsProvider"
import {
  AlgorithmNameProvider,
  useAlgorithmNameField,
} from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider, useDiagramOrigin } from "../../components/constructor/DiagramOrigin"
import { ExamplesSection } from "../../components/constructor/ExamplesSection"

const diagram = {
  nodes: [
    {
      id: "n1",
      type: "startEnd",
      position: { x: 10, y: 20 },
      data: { label: "Início", variant: "start" },
    },
  ],
  edges: [],
}

function Probe() {
  const { nodes } = useConstructor()
  const { algorithmName } = useAlgorithmNameField()
  const { origin } = useDiagramOrigin()
  const { saveDiagram } = useLocalAlgorithms()
  return (
    <div>
      <span data-testid="canvas-nodes">{nodes.length}</span>
      <span data-testid="name">{algorithmName}</span>
      <span data-testid="origin-kind">{origin.kind}</span>
      <button type="button" onClick={() => saveDiagram("Contador", diagram)}>
        guardar-local
      </button>
    </div>
  )
}

function renderSection(signedIn = false) {
  return render(
    <SimulatorProvider>
      <ToastProvider>
      <AlgorithmsProvider signedIn={signedIn}>
        <LocalAlgorithmsProvider>
          <DiagramOriginProvider>
            <AlgorithmNameProvider>
              <ConstructorProvider>
                <ExamplesSection />
                <Probe />
              </ConstructorProvider>
            </AlgorithmNameProvider>
          </DiagramOriginProvider>
        </LocalAlgorithmsProvider>
      </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

function useMemoryStorage(initial: string | null = null) {
  let value = initial
  vi.stubGlobal("localStorage", {
    getItem: () => value,
    setItem: (_: string, next: string) => {
      value = next
    },
    removeItem: vi.fn(),
  })
}

describe("ExamplesSection — Meus arquivos", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("aparece mesmo sem conta, porque é onde o trabalho de quem não entrou fica", () => {
    useMemoryStorage()

    renderSection(false)

    expect(
      screen.getByRole("button", { name: /meus arquivos/i }),
    ).toBeInTheDocument()
  })

  it("aparece para quem entrou também", () => {
    useMemoryStorage()

    renderSection(true)

    expect(
      screen.getByRole("button", { name: /meus arquivos/i }),
    ).toBeInTheDocument()
  })

  it("é uma seção separada da conta, não a mesma lista", () => {
    useMemoryStorage()

    renderSection(true)

    expect(
      screen.getByRole("button", { name: /meus algoritmos/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /meus arquivos/i }),
    ).toBeInTheDocument()
  })

  it("diz que o conteúdo fica só nesta máquina", () => {
    useMemoryStorage(
      JSON.stringify([
        { id: "a", name: "Contador", diagram, created_at: "2026-10-14" },
      ]),
    )

    renderSection(false)
    fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))

    expect(screen.getByText(/nesta máquina/i)).toBeInTheDocument()
  })

  it("lista o que está guardado", () => {
    useMemoryStorage(
      JSON.stringify([
        { id: "a", name: "Contador", diagram, created_at: "2026-10-14" },
      ]),
    )

    renderSection(false)
    fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))

    expect(screen.getByRole("button", { name: "Contador, Nesta máquina" })).toBeInTheDocument()
  })

  it("abre o diagrama com as posições preservadas", () => {
    useMemoryStorage(
      JSON.stringify([
        { id: "a", name: "Contador", diagram, created_at: "2026-10-14" },
      ]),
    )

    renderSection(false)
    fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))
    fireEvent.click(screen.getByRole("button", { name: "Contador, Nesta máquina" }))

    expect(screen.getByTestId("canvas-nodes").textContent).toBe("1")
    expect(screen.getByTestId("name").textContent).toBe("Contador")
  })

  it("marca a origem como local, para o salvamento saber mover em vez de criar", () => {
    useMemoryStorage(
      JSON.stringify([
        { id: "a", name: "Contador", diagram, created_at: "2026-10-14" },
      ]),
    )

    renderSection(false)
    fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))
    fireEvent.click(screen.getByRole("button", { name: "Contador, Nesta máquina" }))

    expect(screen.getByTestId("origin-kind").textContent).toBe("local")
  })

  it("aceita guardar um algoritmo novo sem conta", async () => {
    useMemoryStorage()

    renderSection(false)
    fireEvent.click(screen.getByRole("button", { name: "guardar-local" }))

    fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Contador, Nesta máquina" }),
      ).toBeInTheDocument(),
    )
  })

  // Every row repeated a bold "Nesta máquina" badge; the list says it once and
  // each file shows when it was kept instead.
  it("diz uma vez só onde os arquivos ficam e mostra a data de cada um", () => {
    useMemoryStorage(
      JSON.stringify([
        { id: "a", name: "Contador", diagram, created_at: "2026-10-14" },
        { id: "b", name: "Soma", diagram, created_at: "2026-10-15" },
      ]),
    )

    renderSection(false)
    fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))

    expect(screen.getAllByText(/nesta máquina/i)).toHaveLength(1)
    expect(screen.getByText("2026-10-15")).toBeInTheDocument()
  })
})
