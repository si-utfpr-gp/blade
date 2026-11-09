import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import type { Node, Edge } from "@xyflow/react"
import { SimulatorProvider, useSimulator } from "../../components/simulator/SimulatorContext"

// A process with no arrow out: the flow can never reach the end block.
const nodes: Node[] = [
  { id: "n1", type: "startEnd", position: { x: 0, y: 0 }, data: { label: "Início", variant: "start" } },
  { id: "n2", type: "memory", position: { x: 0, y: 80 }, data: { label: "Memória", rows: [{ type: "inteiro", variables: "x" }] } },
  { id: "n3", type: "process", position: { x: 0, y: 160 }, data: { label: "x = 1" } },
  { id: "n4", type: "startEnd", position: { x: 0, y: 240 }, data: { label: "Fim", variant: "end" } },
]
const edges: Edge[] = [
  { id: "e1", source: "n1", target: "n2" },
  { id: "e2", source: "n2", target: "n3" },
]

function Probe() {
  const { loadDiagram, start, stepForward, state } = useSimulator()
  return (
    <div>
      <button onClick={() => { loadDiagram(nodes, edges); start() }}>executar</button>
      <button onClick={() => stepForward()}>avançar</button>
      <span data-testid="finished">{String(state.isFinished)}</span>
      <span data-testid="error">{state.error ?? ""}</span>
      <span data-testid="steps">{state.steps.map((step) => step.nodeType).join(",")}</span>
    </div>
  )
}

describe("fluxo sem ligação de saída", () => {
  it("mostra erro e os passos que rodaram, em vez de dar o algoritmo como finalizado", () => {
    render(<SimulatorProvider><Probe /></SimulatorProvider>)
    fireEvent.click(screen.getByText("executar"))
    fireEvent.click(screen.getByText("avançar"))
    fireEvent.click(screen.getByText("avançar"))

    expect(screen.getByTestId("finished")).toHaveTextContent("false")
    expect(screen.getByTestId("error").textContent).not.toBe("")
    expect(screen.getByTestId("steps")).toHaveTextContent("startEnd,memory,process")
  })
})
