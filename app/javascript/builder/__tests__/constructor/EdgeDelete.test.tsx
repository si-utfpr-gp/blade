import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Position, ReactFlowProvider, type EdgeProps } from "@xyflow/react"
import { FlowStepEdge } from "../../components/constructor/edges/FlowStepEdge"

// Deleting an arrow took selecting it and pressing Delete, a key a phone does
// not have. A selected arrow now shows a delete button at its middle, big
// enough for a finger.
const deleteElements = vi.fn()
vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>()
  return { ...actual, useReactFlow: () => ({ ...actual.useReactFlow, deleteElements }) }
})

function renderEdge(props: Partial<EdgeProps> = {}) {
  const edge = {
    id: "e1",
    source: "a",
    target: "b",
    sourceX: 100,
    sourceY: 100,
    targetX: 100,
    targetY: 300,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    selected: false,
    deletable: true,
    ...props,
  } as EdgeProps
  return render(
    <ReactFlowProvider>
      <svg>
        <FlowStepEdge {...edge} />
      </svg>
    </ReactFlowProvider>,
  )
}

describe("apagar seta", () => {
  it("não mostra o botão numa seta que não está selecionada", () => {
    renderEdge()

    expect(screen.queryByRole("button", { name: /apagar seta/i })).not.toBeInTheDocument()
  })

  it("mostra o botão no meio da seta selecionada", () => {
    renderEdge({ selected: true })

    expect(screen.getByRole("button", { name: /apagar seta/i })).toHaveAttribute("transform", "translate(100 200)")
  })

  it("apaga a seta ao tocar no botão", () => {
    renderEdge({ selected: true })

    fireEvent.click(screen.getByRole("button", { name: /apagar seta/i }))

    expect(deleteElements).toHaveBeenCalledWith({ edges: [{ id: "e1" }] })
  })

  it("não oferece apagar quando a seta não pode ser apagada", () => {
    renderEdge({ selected: true, deletable: false })

    expect(screen.queryByRole("button", { name: /apagar seta/i })).not.toBeInTheDocument()
  })
})

// A finger is wider than a mouse pointer: on a touch screen an arrow takes
// taps well around its line.
describe("área de toque da seta", () => {
  const originalMatchMedia = window.matchMedia

  it("é mais larga numa tela de toque", () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("pointer: coarse"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    const { container } = renderEdge()
    window.matchMedia = originalMatchMedia

    expect(container.querySelector(".react-flow__edge-interaction")).toHaveAttribute("stroke-width", "32")
  })
})
