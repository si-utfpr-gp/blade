import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"

function Probe() {
  const {
    nodes,
    edges,
    addNode,
    removeNode,
    updateNodeData,
    onConnect,
    onNodesChange,
    setSelectedNodeId,
    selectedNodeId,
    undo,
    redo,
    canUndo,
    canRedo,
    loadCanvasNodes,
    clearCanvas,
  } = useConstructor()
  return (
    <div>
      <span data-testid="count">{nodes.length}</span>
      <span data-testid="selected">{selectedNodeId ?? "nenhum"}</span>
      <span data-testid="labels">{nodes.map((n) => String(n.data.label)).join("|")}</span>
      <span data-testid="edges">{edges.length}</span>
      <span data-testid="can-undo">{String(canUndo)}</span>
      <span data-testid="can-redo">{String(canRedo)}</span>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>
        add
      </button>
      <button type="button" onClick={() => addNode("decision", { x: 0, y: 80 })}>
        add-decision
      </button>
      <button type="button" onClick={() => nodes[0] && removeNode(nodes[0].id)}>
        remove
      </button>
      <button
        type="button"
        onClick={() => nodes[0] && setSelectedNodeId(nodes[0].id)}
      >
        sel
      </button>
      <button
        type="button"
        onClick={() =>
          nodes.length > 0 && setSelectedNodeId(nodes[nodes.length - 1].id)
        }
      >
        sel-last
      </button>
      <button
        type="button"
        onClick={() =>
          nodes[0] &&
          onNodesChange([{ type: "select", id: nodes[0].id, selected: true }])
        }
      >
        select-via-flow
      </button>
      <button
        type="button"
        onClick={() =>
          nodes[0] && onNodesChange([{ type: "remove", id: nodes[0].id }])
        }
      >
        remove-via-flow
      </button>
      <button
        type="button"
        onClick={() => nodes[0] && updateNodeData(nodes[0].id, { label: "editado" })}
      >
        rename
      </button>
      <button
        type="button"
        onClick={() => {
          const from = nodes.find((n) => n.data.blockType === "decision")
          const to = nodes.find((n) => n.data.blockType === "process")
          if (from && to) {
            onConnect({ source: from.id, target: to.id, sourceHandle: "yes", targetHandle: null })
          }
        }}
      >
        connect
      </button>
      <button type="button" onClick={undo}>
        undo
      </button>
      <button type="button" onClick={redo}>
        redo
      </button>
      <button
        type="button"
        onClick={() =>
          loadCanvasNodes(
            [
              { id: "d1", type: "process", position: { x: 5, y: 5 }, data: { label: "carregado" } },
              { id: "d2", type: "process", position: { x: 5, y: 90 }, data: { label: "segundo" } },
            ],
            [],
          )
        }
      >
        load
      </button>
      <button type="button" onClick={clearCanvas}>
        clear
      </button>
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

function add() {
  fireEvent.click(screen.getByRole("button", { name: "add" }))
}

describe("histórico do canvas", () => {
  it("começa sem nada para desfazer", () => {
    renderProvider()

    expect(screen.getByTestId("can-undo").textContent).toBe("false")
    expect(screen.getByTestId("can-redo").textContent).toBe("false")
  })

  it("desfaz a adição de um bloco", () => {
    renderProvider()
    add()
    expect(screen.getByTestId("count").textContent).toBe("1")

    fireEvent.click(screen.getByRole("button", { name: "undo" }))

    expect(screen.getByTestId("count").textContent).toBe("0")
  })

  it("refaz o que foi desfeito", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "undo" }))

    fireEvent.click(screen.getByRole("button", { name: "redo" }))

    expect(screen.getByTestId("count").textContent).toBe("1")
  })

  it("desfaz a remoção de um bloco", () => {
    renderProvider()
    add()
    add()
    fireEvent.click(screen.getByRole("button", { name: "remove" }))
    expect(screen.getByTestId("count").textContent).toBe("1")

    fireEvent.click(screen.getByRole("button", { name: "undo" }))

    expect(screen.getByTestId("count").textContent).toBe("2")
  })

  it("desfaz a edição de um rótulo", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "rename" }))
    expect(screen.getByTestId("labels").textContent).toBe("editado")

    fireEvent.click(screen.getByRole("button", { name: "undo" }))

    expect(screen.getByTestId("labels").textContent).not.toBe("editado")
  })

  it("desfaz uma conexão criada", () => {
    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "add-decision" }))
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    fireEvent.click(screen.getByRole("button", { name: "connect" }))
    expect(screen.getByTestId("edges").textContent).toBe("1")

    fireEvent.click(screen.getByRole("button", { name: "undo" }))

    expect(screen.getByTestId("edges").textContent).toBe("0")
  })

  it("não guarda a mesma situação duas vezes", () => {
    renderProvider()
    add()

    fireEvent.click(screen.getByRole("button", { name: "undo" }))
    fireEvent.click(screen.getByRole("button", { name: "undo" }))

    // One add is one step, not two.
    expect(screen.getByTestId("count").textContent).toBe("0")
  })

  it("editar de novo depois de desfazer descarta o refazer", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "undo" }))
    add()

    expect(screen.getByTestId("can-redo").textContent).toBe("false")
  })

  it("carregar um diagrama zera o histórico", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "load" }))

    expect(screen.getByTestId("can-undo").textContent).toBe("false")
  })

  it("limpar o canvas zera o histórico", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "clear" }))

    expect(screen.getByTestId("can-undo").textContent).toBe("false")
  })

  it("desfazer depois de carregar não traz o diagrama anterior de volta", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "load" }))

    fireEvent.click(screen.getByRole("button", { name: "undo" }))

    expect(screen.getByTestId("labels").textContent).toBe("carregado|segundo")
  })

  it("marca que dá para desfazer assim que há uma mudança", () => {
    renderProvider()
    expect(screen.getByTestId("can-undo").textContent).toBe("false")

    add()

    expect(screen.getByTestId("can-undo").textContent).toBe("true")
  })

  it("marca que dá para refazer depois de desfazer", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "undo" }))

    expect(screen.getByTestId("can-redo").textContent).toBe("true")
  })

  it("volta o estado alterado ao canvas", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "load" }))
    fireEvent.click(screen.getByRole("button", { name: "remove" }))
    expect(screen.getByTestId("count").textContent).toBe("1")

    fireEvent.click(screen.getByRole("button", { name: "undo" }))

    expect(screen.getByTestId("count").textContent).toBe("2")
  })

  it("selecionar não conta como alteração", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "select-via-flow" }))

    // Selecting is not an edit: a single undo walks straight back past the
    // add instead of stopping on the selection first.
    fireEvent.click(screen.getByRole("button", { name: "undo" }))
    expect(screen.getByTestId("count").textContent).toBe("0")
    expect(screen.getByTestId("can-undo").textContent).toBe("false")
  })

  it("remover pelo teclado conta como alteração", () => {
    renderProvider()
    add()

    fireEvent.click(screen.getByRole("button", { name: "remove-via-flow" }))

    expect(screen.getByTestId("count").textContent).toBe("0")
    expect(screen.getByTestId("can-undo").textContent).toBe("true")
  })

  it("remover solta a seleção, em vez de apontar para um bloco que sumiu", () => {
    renderProvider()
    add()
    fireEvent.click(screen.getByRole("button", { name: "sel" }))
    expect(screen.getByTestId("selected").textContent).not.toBe("nenhum")

    fireEvent.click(screen.getByRole("button", { name: "remove-via-flow" }))

    expect(screen.getByTestId("selected").textContent).toBe("nenhum")
  })

  it("remover outro bloco não solta a seleção atual", () => {
    renderProvider()
    add()
    add()
    // Selects the second block, then removes the first through the flow.
    fireEvent.click(screen.getByRole("button", { name: "sel-last" }))
    const selected = screen.getByTestId("selected").textContent
    fireEvent.click(screen.getByRole("button", { name: "remove" }))

    expect(screen.getByTestId("selected").textContent).toBe(selected)
  })
})