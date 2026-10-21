import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import SimulatorCode, { HighlightedCode } from "../../components/simulator/SimulatorCode"

describe("SimulatorCode", () => {
  it("renders JS and TS toggle buttons", () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    expect(screen.getByText("JavaScript")).toBeInTheDocument()
    expect(screen.getByText("TypeScript")).toBeInTheDocument()
  })

  it("shows JavaScript by default", () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    expect(screen.getByText("JavaScript").className).toContain("border-primary")
  })

  it("switches to TypeScript on click", () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    fireEvent.click(screen.getByText("TypeScript"))
    expect(screen.getByText("TypeScript").className).toContain("border-primary")
  })

  it('shows "Copiar" button', () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    expect(screen.getByText("Copiar")).toBeInTheDocument()
  })
})

describe("HighlightedCode", () => {
  it("colore cada parte do código e mantém o texto para copiar", () => {
    const { container } = render(<HighlightedCode code={'let a = 1;\nconsole.log("oi");'} />)

    expect(container.textContent).toBe('let a = 1;\nconsole.log("oi");')
    expect(container.querySelector("[data-token='keyword']")).toHaveTextContent("let")
    expect(container.querySelector("[data-token='string']")).toHaveTextContent('"oi"')
    expect(container.querySelector("[data-token='number']")).toHaveTextContent("1")
  })
})

// Copying gave no sign it worked, so students pressed it again and again.
describe("botão Copiar", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function renderWithClipboard(writeText: () => Promise<void>) {
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } })
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
  }

  it("mostra Copiado! depois de copiar e volta ao normal em seguida", async () => {
    vi.useFakeTimers()
    renderWithClipboard(() => Promise.resolve())

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copiar código/i }))
    })

    expect(screen.getByRole("button", { name: /código copiado/i })).toHaveTextContent("Copiado!")
    expect(screen.getByRole("status")).toHaveTextContent(/código copiado/i)

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByRole("button", { name: /copiar código/i })).toHaveTextContent("Copiar")
  })

  it("avisa quando o navegador não deixa copiar", async () => {
    renderWithClipboard(() => Promise.reject(new Error("negado")))

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copiar código/i }))
    })

    expect(screen.getByRole("button", { name: /copiar código/i })).toHaveTextContent(/não deu/i)
  })
})
