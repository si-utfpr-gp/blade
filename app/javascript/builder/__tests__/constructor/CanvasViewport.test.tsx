import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { ConstructorProvider, useConstructor } from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { AlgorithmNameProvider } from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "../../components/constructor/DiagramOrigin"
import { BlockPlacementProvider } from "../../components/constructor/BlockPlacement"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ToastProvider } from "../../components/ui/Toast"
import { useFitOnDiagramLoad } from "../../components/constructor/useFitOnDiagramLoad"

const fitView = vi.fn()
const setViewport = vi.fn()

// Only the camera is faked; the node and edge state hooks stay real so the
// provider under test behaves normally.
vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>()
  return { ...actual, useReactFlow: () => ({ fitView, setViewport }) }
})


function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function LoadButton() {
  const { loadCanvasNodes, clearCanvas, diagramLoadCount, onNodesChange } = useConstructor()
  const { nodes } = useConstructor()

  useFitOnDiagramLoad(diagramLoadCount)

  return (
    <div>
      <span data-testid="load-count">{diagramLoadCount}</span>
      <span data-testid="node-count">{nodes.length}</span>
      <button
        type="button"
        onClick={() =>
          loadCanvasNodes(
            [
              {
                id: "s1",
                type: "startEnd",
                position: { x: 0, y: 0 },
                data: { variant: "start" },
              },
              {
                id: "e1",
                type: "startEnd",
                position: { x: 0, y: 400 },
                data: { variant: "end" },
              },
            ],
            [],
          )
        }
      >
        carregar
      </button>
      <button type="button" onClick={() => clearCanvas()}>
        limpar
      </button>
      {/* What React Flow does once it has drawn the blocks: it reports their
          size. jsdom never draws, so the tests press this instead. */}
      <button
        type="button"
        onClick={() =>
          onNodesChange(
            nodes.map((node) => ({
              type: "dimensions" as const,
              id: node.id,
              dimensions: { width: 140, height: 50 },
            })),
          )
        }
      >
        medir
      </button>
    </div>
  )
}

function renderCanvas() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([])))
  return render(
    <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn>
          <AlgorithmNameProvider>
            <DiagramOriginProvider>
              <BlockPlacementProvider>
                <ConstructorProvider>
                  <LoadButton />
                </ConstructorProvider>
              </BlockPlacementProvider>
            </DiagramOriginProvider>
          </AlgorithmNameProvider>
        </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

/**
 * Switching algorithms used to leave the viewport where the previous diagram
 * was, so the student landed looking at empty space. Loading a diagram has to
 * bring it back into view.
 */
describe("viewport ao trocar de algoritmo", () => {
  beforeEach(() => {
    fitView.mockClear()
    setViewport.mockClear()
  })

  // Fitting before the new blocks are measured frames only the few already
  // known, and the camera zoomed all the way in on them.
  it("espera os blocos novos serem medidos antes de enquadrar", () => {
    renderCanvas()

    fireEvent.click(screen.getByRole("button", { name: "carregar" }))
    expect(fitView).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "medir" }))
    expect(fitView).toHaveBeenCalledTimes(1)
  })

  it("conta as cargas de diagrama", () => {
    renderCanvas()

    expect(screen.getByTestId("load-count")).toHaveTextContent("0")

    fireEvent.click(screen.getByRole("button", { name: "carregar" }))

    expect(screen.getByTestId("load-count")).toHaveTextContent("1")
  })

  it("enquadra o diagrama inteiro ao carregar", () => {
    renderCanvas()

    fireEvent.click(screen.getByRole("button", { name: "carregar" }))
    fireEvent.click(screen.getByRole("button", { name: "medir" }))

    expect(fitView).toHaveBeenCalledTimes(1)
  })

  it("não reenquadra ao arrastar ou editar blocos", () => {
    renderCanvas()

    fireEvent.click(screen.getByRole("button", { name: "carregar" }))
    fireEvent.click(screen.getByRole("button", { name: "medir" }))
    fitView.mockClear()

    // Measuring again is what dragging or editing a block triggers; the view
    // must stay where the student left it, or every drag would yank the camera.
    fireEvent.click(screen.getByRole("button", { name: "medir" }))
    expect(fitView).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "limpar" }))
    fireEvent.click(screen.getByRole("button", { name: "carregar" }))
    fireEvent.click(screen.getByRole("button", { name: "medir" }))

    expect(fitView).toHaveBeenCalledTimes(1)
  })

  it("volta ao ponto de origem quando o diagrama esvazia", () => {
    renderCanvas()

    fireEvent.click(screen.getByRole("button", { name: "carregar" }))
    fitView.mockClear()

    fireEvent.click(screen.getByRole("button", { name: "limpar" }))

    // fitView on an empty canvas leaves the zoom in an undefined state, so the
    // viewport is reset explicitly instead.
    expect(setViewport).toHaveBeenCalledTimes(1)
    expect(setViewport).toHaveBeenCalledWith(
      expect.objectContaining({ x: 0, y: 0, zoom: 1 }),
    )
    expect(fitView).not.toHaveBeenCalled()
  })
})