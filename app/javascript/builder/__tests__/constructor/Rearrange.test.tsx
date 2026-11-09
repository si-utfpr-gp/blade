import { describe, it, expect } from "vitest"
import { render, screen, act, fireEvent } from "@testing-library/react"
import { useEffect } from "react"
import BuilderPage from "../../BuilderPage"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ConstructorProvider, useConstructor } from "../../components/constructor/ConstructorProvider"

// Blocks dropped wherever there was room end up as a tangle. Reorganizar lays
// the flowchart out the way the examples are drawn: the main flow in one
// column, branches beside their decision. It is one step back with Desfazer.
let api: ReturnType<typeof useConstructor>

function Probe() {
  const value = useConstructor()
  useEffect(() => {
    api = value
  })
  return null
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

function messyChain() {
  act(() => {
    api.loadCanvasNodes(
      [
        { id: "s", type: "startEnd", position: { x: 500, y: 400 }, data: { label: "Início", variant: "start" } },
        { id: "p", type: "process", position: { x: -200, y: 30 }, data: { label: "x = 1" } },
        { id: "e", type: "startEnd", position: { x: 90, y: -300 }, data: { label: "Fim", variant: "end" } },
      ],
      [
        { id: "e1", source: "s", target: "p" },
        { id: "e2", source: "p", target: "e" },
      ],
    )
  })
}

function positionOf(id: string) {
  return api.nodes.find((node) => node.id === id)!.position
}

describe("reorganizar o fluxograma", () => {
  it("põe o fluxo principal numa coluna, de cima para baixo", () => {
    renderProvider()
    messyChain()

    act(() => api.rearrange())

    expect(positionOf("s").y).toBeLessThan(positionOf("p").y)
    expect(positionOf("p").y).toBeLessThan(positionOf("e").y)
    expect(new Set(["s", "p", "e"].map((id) => positionOf(id).x)).size).toBeLessThanOrEqual(2)
  })

  it("volta ao desenho anterior com Desfazer", () => {
    renderProvider()
    messyChain()

    act(() => api.rearrange())
    act(() => api.undo())

    expect(positionOf("s")).toEqual({ x: 500, y: 400 })
  })

  it("não mexe em nada com a edição travada", () => {
    renderProvider()
    messyChain()

    act(() => api.setEditLocked(true))
    act(() => api.rearrange())

    expect(positionOf("e")).toEqual({ x: 90, y: -300 })
  })

  it("aparece no canvas do computador e no menu do celular", () => {
    const { unmount } = render(<BuilderPage />)
    expect(screen.getByRole("button", { name: /reorganizar fluxograma/i })).toBeInTheDocument()
    unmount()

    const original = window.matchMedia
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
    expect(screen.getByRole("button", { name: /reorganizar fluxograma/i })).toBeInTheDocument()
    window.matchMedia = original
  })
})
