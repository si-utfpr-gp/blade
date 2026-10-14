import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"

function Probe() {
  const { nodes, edges, addNode, onConnect } = useConstructor()
  return (
    <div>
      <button
        type="button"
        onClick={() => addNode("startEnd", { x: 0, y: 0 }, "end")}
      >
        add-end
      </button>
      <button type="button" onClick={() => addNode("startEnd", { x: 0, y: 0 })}>
        add-auto
      </button>
      <button type="button" onClick={() => addNode("decision", { x: 0, y: 0 })}>
        add-decision
      </button>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 100 })}>
        add-process
      </button>
      <button
        type="button"
        onClick={() => {
          const from = nodes.find((node) => node.data.blockType === "decision")
          const to = nodes.find((node) => node.data.blockType === "process")
          if (!from || !to) return
          onConnect({ source: from.id, target: to.id, sourceHandle: "yes", targetHandle: null })
        }}
      >
        connect-yes
      </button>
      <span data-testid="variants">
        {nodes.map((node) => node.data.variant ?? node.data.blockType).join(",")}
      </span>
      <span data-testid="edge-labels">{edges.map((edge) => edge.label ?? "").join(",")}</span>
      <span data-testid="edge-count">{edges.length}</span>
    </div>
  )
}

function renderProvider() {
  return render(
    <SimulatorProvider>
      <ConstructorProvider>
        <Probe />
      </ConstructorProvider>
    </SimulatorProvider>,
  )
}

describe("ConstructorProvider addNode", () => {
  it("inicia sem nenhum bloco", () => {
    renderProvider()
    // A seeded start block made the first screen look like work in progress,
    // and a student cannot save an unnamed algorithm anyway.
    expect(screen.getByTestId("variants").textContent).toBe("")
  })

  it("aceita variante explícita ao adicionar startEnd", () => {
    renderProvider()
    // The harness only exposes the end variant explicitly, so this covers the
    // half that the auto-variant test cannot: an explicit choice is respected.
    fireEvent.click(screen.getByRole("button", { name: "add-end" }))
    expect(screen.getByTestId("variants").textContent).toBe("end")
  })

  it("mantém a variante automática quando não informada", () => {
    renderProvider()
    // Without an explicit variant the first startEnd is the start and the next
    // one becomes the end, chosen from what is already on the canvas.
    fireEvent.click(screen.getByRole("button", { name: "add-auto" }))
    expect(screen.getByTestId("variants").textContent).toBe("start")
    fireEvent.click(screen.getByRole("button", { name: "add-auto" }))
    expect(screen.getByTestId("variants").textContent).toBe("start,end")
  })
})

describe("ConstructorProvider onConnect", () => {
  it("rotula a aresta do ramo verdadeiro da decisão", () => {
    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "add-decision" }))
    fireEvent.click(screen.getByRole("button", { name: "add-process" }))
    fireEvent.click(screen.getByRole("button", { name: "connect-yes" }))
    expect(screen.getByTestId("edge-labels").textContent).toBe("VERDADEIRO")
  })
})

