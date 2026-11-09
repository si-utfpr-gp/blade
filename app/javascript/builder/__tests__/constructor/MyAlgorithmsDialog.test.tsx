import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ConstructorProvider, useConstructor } from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { LocalAlgorithmsProvider } from "../../components/constructor/LocalAlgorithmsProvider"
import { AlgorithmNameProvider, useAlgorithmNameField } from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "../../components/constructor/DiagramOrigin"
import { ToastProvider } from "../../components/ui/Toast"
import MyAlgorithmsDialog from "../../components/constructor/MyAlgorithmsDialog"

const saved = {
  id: 3,
  name: "Média da turma",
  diagram: {
    nodes: [
      { id: "s1", type: "startEnd", position: { x: 0, y: 0 }, data: { label: "Início", variant: "start" } },
      { id: "p1", type: "process", position: { x: 0, y: 120 }, data: { label: "x = 1" } },
    ],
    edges: [{ id: "e1", source: "s1", target: "p1" }],
  },
  created_at: "2026-10-07",
}

function Probe() {
  const { nodes } = useConstructor()
  const { algorithmName } = useAlgorithmNameField()
  return (
    <div>
      <span data-testid="canvas-nodes">{nodes.length}</span>
      <span data-testid="name">{algorithmName}</span>
    </div>
  )
}

function renderDialog(onOpenChange = vi.fn()) {
  render(
    <ToastProvider>
      <SimulatorProvider>
        <AlgorithmsProvider signedIn>
          <LocalAlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <MyAlgorithmsDialog open onOpenChange={onOpenChange} />
                  <Probe />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </LocalAlgorithmsProvider>
        </AlgorithmsProvider>
      </SimulatorProvider>
    </ToastProvider>,
  )
  return onOpenChange
}

const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body })

describe("modal Meus algoritmos", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn((url: string) => Promise.resolve(json(url === "/algorithms" ? [saved] : saved)))
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it("lista os algoritmos salvos", async () => {
    renderDialog()

    expect(screen.getByRole("dialog", { name: /meus algoritmos/i })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: /média da turma/i })).toBeInTheDocument()
    expect(screen.getByText(/salvo em 2026-10-07/i)).toBeInTheDocument()
  })

  it("abre o algoritmo escolhido no canvas e fecha", async () => {
    const onOpenChange = renderDialog()

    fireEvent.click(await screen.findByRole("button", { name: /média da turma/i }))

    await waitFor(() => expect(screen.getByTestId("canvas-nodes")).toHaveTextContent("2"))
    expect(screen.getByTestId("name")).toHaveTextContent("Média da turma")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("mostra quando ainda não há algoritmo salvo", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json([])))
    renderDialog()

    expect(await screen.findByText(/nenhum algoritmo salvo ainda/i)).toBeInTheDocument()
  })
})
