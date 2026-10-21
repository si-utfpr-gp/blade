import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import BuilderPage from "../../BuilderPage"

// Mobile browsers show and hide their own bars over the page, and a fixed bar
// of ours kept ending up under them. The tools now sit behind one floating
// button the student drags wherever it is out of the way, and a tap opens
// them over everything else.
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

function ball() {
  return screen.getByRole("button", { name: /^ferramentas$/i })
}

describe("botão flutuante de ferramentas no celular", () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    phone()
    try {
      window.localStorage.clear()
    } catch {
      // Storage can be unavailable; the button then starts at its default spot.
    }
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it("começa fechado, com as ferramentas fora do alcance do toque", () => {
    render(<BuilderPage />)

    expect(ball()).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("button", { name: /desfazer/i })).not.toBeInTheDocument()
  })

  it("abre as ferramentas com um toque e fecha com outro", () => {
    render(<BuilderPage />)

    fireEvent.click(ball())
    expect(ball()).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("button", { name: /desfazer/i })).toBeInTheDocument()

    fireEvent.click(ball())
    expect(ball()).toHaveAttribute("aria-expanded", "false")
  })

  it("fica por cima do depurador e da gaveta de blocos", () => {
    render(<BuilderPage />)

    expect(ball().closest("[data-testid='floating-tools']")).toHaveClass("fixed", "z-[60]")
  })

  it("muda de lugar quando é arrastado, sem abrir o menu", () => {
    render(<BuilderPage />)
    const wrapper = ball().closest("[data-testid='floating-tools']") as HTMLElement
    const before = wrapper.style.top

    fireEvent.pointerDown(ball(), { pointerId: 1, clientX: 1000, clientY: 300, button: 0 })
    fireEvent.pointerMove(ball(), { pointerId: 1, clientX: 400, clientY: 120 })
    fireEvent.pointerUp(ball(), { pointerId: 1, clientX: 400, clientY: 120 })
    fireEvent.click(ball())

    expect(wrapper.style.top).not.toBe(before)
    expect(ball()).toHaveAttribute("aria-expanded", "false")
  })

  it("encosta na borda mais próxima ao ser solto", () => {
    render(<BuilderPage />)
    const wrapper = ball().closest("[data-testid='floating-tools']") as HTMLElement

    fireEvent.pointerDown(ball(), { pointerId: 1, clientX: 1000, clientY: 300, button: 0 })
    fireEvent.pointerMove(ball(), { pointerId: 1, clientX: 100, clientY: 300 })
    fireEvent.pointerUp(ball(), { pointerId: 1, clientX: 100, clientY: 300 })

    expect(parseFloat(wrapper.style.left)).toBeLessThan(20)
  })

  it("fecha ao tocar fora do menu", () => {
    const { container } = render(<BuilderPage />)
    fireEvent.click(ball())

    fireEvent.pointerDown(container.querySelector(".react-flow__pane") as Element)

    expect(ball()).toHaveAttribute("aria-expanded", "false")
  })

  it("não aparece no computador, que tem as ferramentas nos cantos do canvas", () => {
    window.matchMedia = originalMatchMedia
    render(<BuilderPage />)

    expect(screen.queryByRole("button", { name: /^ferramentas$/i })).not.toBeInTheDocument()
  })

  // The ball sat on top of the blocks menu, over the very lists the student
  // was reading.
  it("sai da frente enquanto o menu de blocos está aberto", () => {
    render(<BuilderPage />)
    fireEvent.click(screen.getByRole("button", { name: /abrir menu de blocos/i }))

    expect(screen.queryByRole("button", { name: /^ferramentas$/i })).not.toBeInTheDocument()
  })
})
