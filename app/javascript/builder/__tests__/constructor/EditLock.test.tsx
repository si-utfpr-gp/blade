import { describe, it, expect, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { useEffect } from "react"
import BuilderPage from "../../BuilderPage"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"

// The lock used to stop only dragging and connecting: a block could still be
// dropped or tapped onto the canvas, renamed or deleted. Locked now means the
// diagram does not change at all, whichever way the change comes in.
let api: ReturnType<typeof useConstructor>

function Probe() {
  const value = useConstructor()
  useEffect(() => {
    api = value
  })
  return (
    <ul data-testid="nodes">
      {value.nodes.map((node) => (
        <li key={node.id}>
          {node.data.label}@{node.position.x},{node.position.y}
        </li>
      ))}
      <li data-testid="edges">{value.edges.length}</li>
    </ul>
  )
}

function renderProvider() {
  render(
    <SimulatorProvider>
      <ConstructorProvider>
        <Probe />
      </ConstructorProvider>
    </SimulatorProvider>,
  )
}

function listed() {
  return screen.getAllByRole("listitem").filter((item) => !item.dataset.testid)
}

describe("trava de edição no diagrama", () => {
  it("recusa blocos novos, textos, exclusões e a limpeza", () => {
    renderProvider()
    act(() => api.addNode("process", { x: 0, y: 0 }))
    const id = api.nodes[0].id

    act(() => api.setEditLocked(true))
    act(() => api.addNode("process", { x: 50, y: 50 }))
    act(() => api.updateNodeData(id, { label: "mudou" }))
    act(() => api.duplicateNode(id))
    act(() => api.removeNode(id))
    act(() => api.clearCanvas())

    expect(listed()).toHaveLength(1)
    expect(listed()[0]).not.toHaveTextContent("mudou")
  })

  it("recusa mover e apagar pelo React Flow, mas deixa medir e selecionar", () => {
    renderProvider()
    act(() => api.addNode("process", { x: 0, y: 0 }))
    const id = api.nodes[0].id

    act(() => api.setEditLocked(true))
    act(() =>
      api.onNodesChange([
        { type: "position", id, position: { x: 300, y: 300 } },
        { type: "remove", id },
        { type: "select", id, selected: true },
        { type: "dimensions", id, dimensions: { width: 170, height: 56 } },
      ]),
    )

    expect(listed()).toHaveLength(1)
    expect(listed()[0]).toHaveTextContent("@0,0")
    expect(api.nodes[0].selected).toBe(true)
    expect(api.nodes[0].measured).toEqual({ width: 170, height: 56 })
  })

  it("não desfaz nem refaz enquanto travado", () => {
    renderProvider()
    act(() => api.addNode("process", { x: 0, y: 0 }))

    act(() => api.setEditLocked(true))
    act(() => api.undo())

    expect(listed()).toHaveLength(1)
  })

  it("volta a aceitar alterações ao destravar", () => {
    renderProvider()
    act(() => api.setEditLocked(true))
    act(() => api.setEditLocked(false))
    act(() => api.addNode("process", { x: 0, y: 0 }))

    expect(listed()).toHaveLength(1)
  })
})

describe("botão de travar a edição", () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it("trava pelo cadeado do canvas, e um toque no bloco não o coloca mais", () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole("button", { name: /travar edição/i }))
    expect(screen.getByRole("button", { name: /destravar edição/i })).toHaveAttribute("aria-pressed", "true")

    fireEvent.click(screen.getByTestId("block-tile-process"))
    fireEvent.click(container.querySelector(".react-flow__pane") as Element, { clientX: 200, clientY: 200 })

    expect(container.querySelectorAll(".react-flow__node")).toHaveLength(0)
  })

  it("desliga Limpar enquanto travado", () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole("button", { name: /travar edição/i }))

    expect(screen.getByRole("button", { name: /limpar/i })).toBeDisabled()
  })

  it("também trava pelo menu do botão flutuante no celular", () => {
    window.matchMedia = ((query: string) => ({
      matches: !query.includes("min-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    })) as unknown as typeof window.matchMedia
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole("button", { name: /^ferramentas$/i }))
    fireEvent.click(screen.getByRole("button", { name: /travar edição/i }))

    // The menu stays open, so the student sees the lock change.
    expect(screen.getByRole("button", { name: /destravar edição/i })).toHaveAttribute("aria-pressed", "true")
  })
})
