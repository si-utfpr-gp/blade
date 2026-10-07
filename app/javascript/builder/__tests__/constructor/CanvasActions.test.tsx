import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider, useSimulator } from "../../components/simulator/SimulatorContext"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"
import { CanvasActions } from "../../components/constructor/CanvasActions"

function Probe() {
  const { nodes, addNode } = useConstructor()
  const { state, start, loadDiagram } = useSimulator()
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          addNode("process", { x: 0, y: 0 })
          loadDiagram(
            [{ id: "s", type: "startEnd", data: { variant: "start" } }],
            [],
          )
          start()
        }}
      >
        setup-run
      </button>
      <span data-testid="canvas-nodes">{nodes.length}</span>
      <span data-testid="sim-steps">{state.steps.length}</span>
    </div>
  )
}

function renderActions() {
  return render(
    <SimulatorProvider>
      <ConstructorProvider>
        <CanvasActions />
        <Probe />
      </ConstructorProvider>
    </SimulatorProvider>,
  )
}

describe("CanvasActions", () => {
  it("Novo Algoritmo volta ao bloco inicial e limpa a execução", () => {
    renderActions()
    fireEvent.click(screen.getByRole("button", { name: /setup-run/i }))
    expect(screen.getByTestId("canvas-nodes").textContent).toBe("2")
    expect(screen.getByTestId("sim-steps").textContent).toBe("1")
    fireEvent.click(screen.getByRole("button", { name: /novo algoritmo/i }))
    expect(screen.getByTestId("canvas-nodes").textContent).toBe("1")
    expect(screen.getByTestId("sim-steps").textContent).toBe("0")
  })

  it("Limpar esvazia o canvas e limpa a execução", () => {
    renderActions()
    fireEvent.click(screen.getByRole("button", { name: /setup-run/i }))
    fireEvent.click(screen.getByRole("button", { name: /^limpar/i }))
    expect(screen.getByTestId("canvas-nodes").textContent).toBe("0")
    expect(screen.getByTestId("sim-steps").textContent).toBe("0")
  })
})
