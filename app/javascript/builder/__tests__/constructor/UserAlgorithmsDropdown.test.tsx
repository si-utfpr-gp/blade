import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { SimulatorProvider, useSimulator } from "../../components/simulator/SimulatorContext"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"
import { ExamplesSection } from "../../components/constructor/ExamplesSection"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { AlgorithmNameProvider } from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "../../components/constructor/DiagramOrigin"

function Probe() {
  const { nodes } = useConstructor()
  const { state } = useSimulator()
  return (
    <div>
      <span data-testid="canvas-nodes">{nodes.length}</span>
      <span data-testid="sim-steps">{state.steps.length}</span>
    </div>
  )
}

function renderSection(signedIn = true) {
  return render(
    <SimulatorProvider>
      <AlgorithmsProvider signedIn={signedIn}>
        <DiagramOriginProvider><AlgorithmNameProvider>
          <ConstructorProvider>
          <ExamplesSection />
          <Probe />
          </ConstructorProvider>
        </AlgorithmNameProvider></DiagramOriginProvider>
      </AlgorithmsProvider>
    </SimulatorProvider>,
  )
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const savedAlgorithm = {
  id: 3,
  name: "Meu algoritmo",
  diagram: {
    nodes: [
      { id: "s1", type: "startEnd", position: { x: 10, y: 20 }, data: { label: "Início", variant: "start" } },
      { id: "p1", type: "process", position: { x: 10, y: 200 }, data: { label: "x = 1" } },
    ],
    edges: [{ id: "e1", source: "s1", target: "p1" }],
  },
  created_at: "2026-10-07",
}

describe("ExamplesSection — Meus algoritmos", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function openUserDropdown() {
    fireEvent.click(screen.getByRole("button", { name: /^Meus algoritmos:/ }))
  }

  it("keeps the empty state when the student has no saved algorithm", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]))

    renderSection()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    openUserDropdown()

    expect(
      screen.getByText(/nenhum algoritmo salvo ainda/i),
    ).toBeInTheDocument()
  })

  it("lists the saved algorithms coming from the API", async () => {
    fetchMock.mockResolvedValue(jsonResponse([ savedAlgorithm ]))

    renderSection()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(
      screen.getByRole("button", { name: /^Meus algoritmos: nenhum selecionado/i }),
    ).toBeInTheDocument()

    openUserDropdown()
    expect(
      screen.getByRole("button", { name: /meu algoritmo/i }),
    ).toBeInTheDocument()
  })

  it("loads the saved diagram on the canvas, keeping its positions", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([ savedAlgorithm ]))
      .mockResolvedValueOnce(jsonResponse(savedAlgorithm))

    renderSection()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    await act(async () => {
      openUserDropdown()
    })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /meu algoritmo/i }))
    })

    await waitFor(() => {
      expect(screen.getByTestId("canvas-nodes").textContent).toBe("2")
    })
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/algorithms/3",
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("resets the simulator when a saved algorithm is loaded", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([ savedAlgorithm ]))
      .mockResolvedValueOnce(jsonResponse(savedAlgorithm))

    renderSection()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    await act(async () => {
      openUserDropdown()
    })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /meu algoritmo/i }))
    })

    await waitFor(() => {
      expect(screen.getByTestId("sim-steps").textContent).toBe("0")
    })
  })

  describe("sem sessão", () => {
    it("esconde a seção, em vez de mostrar uma lista vazia", () => {
      renderSection(false)

      expect(
        screen.queryByRole("button", { name: /meus algoritmos/i }),
      ).not.toBeInTheDocument()
    })

    it("mantém os exemplos disponíveis para quem não entrou", () => {
      renderSection(false)

      expect(
        screen.getByRole("button", { name: /exemplos/i }),
      ).toBeInTheDocument()
    })
  })
})