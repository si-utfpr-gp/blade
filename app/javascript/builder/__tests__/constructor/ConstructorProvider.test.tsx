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


function DirtyProbe() {
  const { nodes, edges, isDirty, markClean, addNode, removeNode, updateNodeData, loadCanvasNodes, clearCanvas, resetCanvas } =
    useConstructor()
  return (
    <div>
      <span data-testid="dirty">{String(isDirty)}</span>
      <span data-testid="node-count">{nodes.length}</span>
      <span data-testid="edge-count">{edges.length}</span>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>
        add
      </button>
      <button
        type="button"
        onClick={() => nodes[0] && removeNode(nodes[0].id)}
      >
        remove-first
      </button>
      <button type="button" onClick={markClean}>
        mark-clean
      </button>
      <button
        type="button"
        onClick={() =>
          loadCanvasNodes(
            [ { id: "l1", type: "startEnd", position: { x: 5, y: 6 }, data: { label: "x = 1", variant: "start" } } ],
            [],
          )
        }
      >
        load
      </button>
      <button type="button" onClick={clearCanvas}>
        clear
      </button>
      <button type="button" onClick={resetCanvas}>
        reset
      </button>
      <button
        type="button"
        onClick={() => {
          const first = nodes[0]
          if (!first) return
          const label = String(first.data.label ?? "")
          updateNodeData(first.id, { label: label === "x = 2" ? "x = 1" : "x = 2" })
        }}
      >
        rename
      </button>
      <span data-testid="edges">{edges.length}</span>
    </div>
  )
}

function renderDirty() {
  return render(
    <SimulatorProvider>
      <ConstructorProvider>
        <DirtyProbe />
      </ConstructorProvider>
    </SimulatorProvider>,
  )
}

describe("ConstructorProvider estado sujo", () => {
  it("começa limpo, com o canvas vazio", () => {
    renderDirty()

    expect(screen.getByTestId("dirty").textContent).toBe("false")
  })

  it("fica sujo ao adicionar um bloco", () => {
    renderDirty()

    fireEvent.click(screen.getByRole("button", { name: "add" }))

    expect(screen.getByTestId("dirty").textContent).toBe("true")
  })

  it("fica sujo ao remover um bloco", () => {
    renderDirty()

    fireEvent.click(screen.getByRole("button", { name: "add" }))
    fireEvent.click(screen.getByRole("button", { name: "mark-clean" }))
    fireEvent.click(screen.getByRole("button", { name: "remove-first" }))

    expect(screen.getByTestId("dirty").textContent).toBe("true")
  })

  it("volta a ficar limpo quando o save confirma", () => {
    renderDirty()

    fireEvent.click(screen.getByRole("button", { name: "add" }))
    fireEvent.click(screen.getByRole("button", { name: "mark-clean" }))

    expect(screen.getByTestId("dirty").textContent).toBe("false")
  })

  it("voltar ao estado salvo deixa de contar como alteração", () => {
    renderDirty()

    fireEvent.click(screen.getByRole("button", { name: "load" }))
    fireEvent.click(screen.getByRole("button", { name: "rename" }))
    expect(screen.getByTestId("dirty").textContent).toBe("true")

    // The comparison is against the saved state, not a record of events, so
    // undoing an edit is enough to look clean again.
    fireEvent.click(screen.getByRole("button", { name: "rename" }))
    expect(screen.getByTestId("dirty").textContent).toBe("false")
  })

  it("carregar um diagrama limpa a referência", () => {
    renderDirty()

    fireEvent.click(screen.getByRole("button", { name: "add" }))
    fireEvent.click(screen.getByRole("button", { name: "load" }))

    expect(screen.getByTestId("dirty").textContent).toBe("false")
  })

  it("limpar o canvas não marca o diagrama como alterado", () => {
    renderDirty()

    fireEvent.click(screen.getByRole("button", { name: "load" }))
    fireEvent.click(screen.getByRole("button", { name: "clear" }))

    expect(screen.getByTestId("node-count").textContent).toBe("0")
    expect(screen.getByTestId("dirty").textContent).toBe("false")
  })

  it("resetar o canvas não marca o diagrama como alterado", () => {
    renderDirty()

    fireEvent.click(screen.getByRole("button", { name: "add" }))
    fireEvent.click(screen.getByRole("button", { name: "reset" }))

    expect(screen.getByTestId("dirty").textContent).toBe("false")
  })
})

function SelectionProbe() {
  const { nodes, edges, addNode, onConnect, updateSelectionCases } =
    useConstructor()
  const selection = nodes.find((node) => node.data.blockType === "selection")
  const outputs = nodes.filter((node) => node.data.blockType === "output")
  return (
    <div>
      <button type="button" onClick={() => addNode("selection", { x: 0, y: 0 })}>
        add-selection
      </button>
      <button type="button" onClick={() => addNode("output", { x: 0, y: 100 })}>
        add-output
      </button>
      <button
        type="button"
        onClick={() =>
          outputs.forEach((output, index) =>
            onConnect({
              source: selection!.id,
              target: output.id,
              sourceHandle: `case-${index}`,
              targetHandle: null,
            }),
          )
        }
      >
        connect-cases
      </button>
      <button
        type="button"
        onClick={() => updateSelectionCases(selection!.id, ["20"], [1])}
      >
        remove-first-and-edit
      </button>
      <span data-testid="cases">{selection?.data.cases?.join(",")}</span>
      <span data-testid="label">{selection?.data.label}</span>
      <span data-testid="edges">
        {edges.map((edge) => `${edge.sourceHandle}:${edge.label}`).join(",")}
      </span>
    </div>
  )
}

describe("ConstructorProvider escolha", () => {
  function renderSelection() {
    return render(
      <SimulatorProvider>
        <ConstructorProvider>
          <SelectionProbe />
        </ConstructorProvider>
      </SimulatorProvider>,
    )
  }

  it("cria a escolha com dois casos", () => {
    renderSelection()
    fireEvent.click(screen.getByText("add-selection"))

    expect(screen.getByTestId("label")).toHaveTextContent("variável")
    expect(screen.getByTestId("cases")).toHaveTextContent("1,2")
  })

  it("rotula as setas pelo valor do caso e as acompanha quando os casos mudam", () => {
    renderSelection()
    fireEvent.click(screen.getByText("add-selection"))
    fireEvent.click(screen.getByText("add-output"))
    fireEvent.click(screen.getByText("add-output"))
    fireEvent.click(screen.getByText("connect-cases"))

    expect(screen.getByTestId("edges")).toHaveTextContent("case-0:1,case-1:2")

    fireEvent.click(screen.getByText("remove-first-and-edit"))

    expect(screen.getByTestId("cases")).toHaveTextContent("20")
    expect(screen.getByTestId("edges")).toHaveTextContent(/^case-0:20$/)
  })
})
