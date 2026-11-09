import { describe, it, expect } from "vitest"
import { act, render, screen, fireEvent } from "@testing-library/react"
import type { NodeChange } from "@xyflow/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import {
  ConstructorProvider,
  useConstructor,
  type AlgorithmNode,
} from "../../components/constructor/ConstructorProvider"
import { recenterOnMeasuredSize } from "../../components/constructor/recenterOnMeasuredSize"

// The example layout only estimates how wide a block will render. Arrows run
// straight when blocks in one column share a centre, so once the canvas has
// measured them each block is moved to keep the centre the layout planned.

const measured = (id: string, x: number, y: number, width?: number, height?: number) =>
  ({
    id,
    type: "process",
    position: { x, y },
    data: { blockType: "process", label: "" },
    ...(width !== undefined && height !== undefined ? { measured: { width, height } } : {}),
  }) as AlgorithmNode

describe("recenterOnMeasuredSize", () => {
  it("põe o centro do bloco medido no centro planejado", () => {
    const [node] = recenterOnMeasuredSize(
      [measured("a", 0, 0, 120, 40)],
      new Map([["a", { x: 400, y: 100 }]]),
    )
    expect(node.position).toEqual({ x: 340, y: 80 })
  })

  it("arredonda para pixels inteiros", () => {
    const [node] = recenterOnMeasuredSize(
      [measured("a", 0, 0, 121, 41)],
      new Map([["a", { x: 400, y: 100 }]]),
    )
    expect(node.position).toEqual({ x: 340, y: 80 })
  })

  it("deixa como está o bloco sem centro planejado ou ainda sem medida", () => {
    const nodes = [measured("a", 7, 8, 100, 40), measured("b", 9, 10)]
    const result = recenterOnMeasuredSize(nodes, new Map([["b", { x: 400, y: 100 }]]))
    expect(result.map((node) => node.position)).toEqual([{ x: 7, y: 8 }, { x: 9, y: 10 }])
  })
})

function Probe() {
  const { nodes, isDirty, canUndo, loadCanvasNodes, onNodesChange } = useConstructor()
  return (
    <div>
      <span data-testid="positions">{JSON.stringify(nodes.map((node) => node.position))}</span>
      <span data-testid="dirty">{String(isDirty)}</span>
      <span data-testid="can-undo">{String(canUndo)}</span>
      <button
        type="button"
        onClick={() =>
          loadCanvasNodes(
            [
              { id: "a", type: "process", position: { x: 0, y: 0 }, data: { label: "x = 1" } },
              { id: "b", type: "process", position: { x: 0, y: 100 }, data: { label: "y = 2" } },
            ],
            [],
            { centers: new Map([["a", { x: 400, y: 25 }], ["b", { x: 400, y: 125 }]]) },
          )
        }
      >
        load
      </button>
      <button
        type="button"
        onClick={() =>
          onNodesChange([
            { type: "dimensions", id: "a", dimensions: { width: 100, height: 50 } },
            { type: "dimensions", id: "b", dimensions: { width: 180, height: 50 } },
          ] as NodeChange<AlgorithmNode>[])
        }
      >
        measure
      </button>
      <button
        type="button"
        onClick={() =>
          onNodesChange([
            { type: "dimensions", id: "a", dimensions: { width: 300, height: 50 } },
          ] as NodeChange<AlgorithmNode>[])
        }
      >
        remeasure
      </button>
    </div>
  )
}

function renderProbe() {
  render(
    <SimulatorProvider>
      <ConstructorProvider>
        <Probe />
      </ConstructorProvider>
    </SimulatorProvider>,
  )
}

const positions = () => JSON.parse(screen.getByTestId("positions").textContent ?? "[]")

describe("ConstructorProvider centraliza o diagrama carregado pela medida real", () => {
  it("alinha os centros quando os blocos são medidos", () => {
    renderProbe()
    fireEvent.click(screen.getByText("load"))
    act(() => fireEvent.click(screen.getByText("measure")))

    expect(positions()).toEqual([{ x: 350, y: 0 }, { x: 310, y: 100 }])
  })

  it("não conta o ajuste como alteração nem como passo de desfazer", () => {
    renderProbe()
    fireEvent.click(screen.getByText("load"))
    act(() => fireEvent.click(screen.getByText("measure")))

    expect(screen.getByTestId("dirty").textContent).toBe("false")
    expect(screen.getByTestId("can-undo").textContent).toBe("false")
  })

  it("ajusta uma vez só: medidas seguintes não movem mais os blocos", () => {
    renderProbe()
    fireEvent.click(screen.getByText("load"))
    act(() => fireEvent.click(screen.getByText("measure")))
    act(() => fireEvent.click(screen.getByText("remeasure")))

    expect(positions()[0]).toEqual({ x: 350, y: 0 })
  })
})
