import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import BuilderPage from "../../BuilderPage"

// Touch screens never fire HTML5 drag events, so on a phone a block could
// only be tapped and then placed. Dragging it with a finger now works too: a
// sideways pull lifts the block, a preview follows the finger and letting go
// over the canvas drops it there. Pulling up or down still scrolls the menu.
function phone() {
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
}

const touch = { pointerId: 7, pointerType: "touch", isPrimary: true, button: 0 }

function renderOnPhone() {
  const result = render(<BuilderPage />)
  // jsdom lays nothing out; the canvas claims the whole screen.
  const dropZone = screen.getByTestId("canvas-drop-zone")
  vi.spyOn(dropZone, "getBoundingClientRect").mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, right: 1024, bottom: 768, width: 1024, height: 768, toJSON: () => ({}),
  } as DOMRect)
  fireEvent.click(screen.getByRole("button", { name: /abrir menu de blocos/i }))
  return result
}

function tile() {
  return screen.getByTestId("block-tile-process")
}

describe("arrastar blocos com o dedo", () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(phone)
  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  it("deixa o menu rolar na vertical e puxar o bloco para o lado", () => {
    renderOnPhone()

    expect(tile()).toHaveStyle({ touchAction: "pan-y" })
  })

  it("mostra uma prévia do bloco que segue o dedo", () => {
    renderOnPhone()

    fireEvent.pointerDown(tile(), { ...touch, clientX: 60, clientY: 200 })
    fireEvent.pointerMove(window, { ...touch, clientX: 160, clientY: 210 })

    const ghost = screen.getByTestId("block-drag-ghost")
    expect(ghost).toHaveStyle({ left: "160px" })
  })

  it("fecha o menu para mostrar o canvas assim que o bloco sai do lugar", () => {
    renderOnPhone()

    fireEvent.pointerDown(tile(), { ...touch, clientX: 60, clientY: 200 })
    fireEvent.pointerMove(window, { ...touch, clientX: 160, clientY: 210 })

    expect(screen.queryByTestId("sidebar-backdrop")).not.toBeInTheDocument()
  })

  it("solta o bloco no canvas onde o dedo saiu", () => {
    const { container } = renderOnPhone()

    fireEvent.pointerDown(tile(), { ...touch, clientX: 60, clientY: 200 })
    fireEvent.pointerMove(window, { ...touch, clientX: 300, clientY: 400 })
    fireEvent.pointerUp(window, { ...touch, clientX: 300, clientY: 400 })
    fireEvent.click(tile())

    expect(container.querySelectorAll(".react-flow__node")).toHaveLength(1)
    expect(screen.queryByTestId("block-drag-ghost")).not.toBeInTheDocument()
    // The click that ends the drag must not also arm the block.
    expect(tile()).toHaveAttribute("aria-pressed", "false")
  })

  it("um puxão na vertical não arrasta, para o menu poder rolar", () => {
    renderOnPhone()

    fireEvent.pointerDown(tile(), { ...touch, clientX: 60, clientY: 200 })
    fireEvent.pointerMove(window, { ...touch, clientX: 64, clientY: 300 })

    expect(screen.queryByTestId("block-drag-ghost")).not.toBeInTheDocument()
  })

  it("desiste quando o navegador assume o gesto para rolar", () => {
    const { container } = renderOnPhone()

    fireEvent.pointerDown(tile(), { ...touch, clientX: 60, clientY: 200 })
    fireEvent.pointerMove(window, { ...touch, clientX: 160, clientY: 210 })
    fireEvent.pointerCancel(window, { ...touch })

    expect(screen.queryByTestId("block-drag-ghost")).not.toBeInTheDocument()
    expect(container.querySelectorAll(".react-flow__node")).toHaveLength(0)
  })

  it("continua armando o bloco com um toque simples", () => {
    renderOnPhone()

    fireEvent.pointerDown(tile(), { ...touch, clientX: 60, clientY: 200 })
    fireEvent.pointerUp(window, { ...touch, clientX: 60, clientY: 200 })
    fireEvent.click(tile())

    expect(tile()).toHaveAttribute("aria-pressed", "true")
  })
})
