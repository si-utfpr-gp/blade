import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"
import { CanvasHistoryControls } from "../../components/constructor/CanvasHistoryControls"

function Probe() {
  const { addNode } = useConstructor()
  return (
    <div>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>
        add
      </button>
      <input aria-label="Nome do campo" defaultValue="" />
    </div>
  )
}

function renderControls(locked = false) {
  return render(
    <SimulatorProvider>
      <ConstructorProvider>
        <Probe />
        <CanvasHistoryControls locked={locked} />
      </ConstructorProvider>
    </SimulatorProvider>,
  )
}

function press(key: string, options: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {}) {
  fireEvent.keyDown(document, {
    key,
    ctrlKey: options.ctrlKey ?? true,
    metaKey: options.metaKey ?? false,
    shiftKey: options.shiftKey ?? false,
  })
}

describe("CanvasHistoryControls", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("começa com os dois botões desabilitados, porque não há o que desfazer", () => {
    renderControls()

    expect(screen.getByRole("button", { name: /desfazer/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /refazer/i })).toBeDisabled()
  })

  it("habilita o desfazer depois de uma mudança e o refazer depois de desfazer", () => {
    renderControls()
    fireEvent.click(screen.getByRole("button", { name: "add" }))

    expect(screen.getByRole("button", { name: /desfazer/i })).toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: /desfazer/i }))
    expect(screen.getByRole("button", { name: /refazer/i })).toBeEnabled()
  })

  it("o botão desfaz a mudança", () => {
    render(
      <SimulatorProvider>
        <ConstructorProvider>
          <CountProbe />
          <CanvasHistoryControls locked={false} />
        </ConstructorProvider>
      </SimulatorProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    expect(screen.getByTestId("count").textContent).toBe("1")

    fireEvent.click(screen.getByRole("button", { name: /desfazer/i }))

    expect(screen.getByTestId("count").textContent).toBe("0")
  })

  it("desfaz pelo teclado com Ctrl+Z", () => {
    render(
      <SimulatorProvider>
        <ConstructorProvider>
          <CountProbe />
          <CanvasHistoryControls locked={false} />
        </ConstructorProvider>
      </SimulatorProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "add" }))

    press("z")

    expect(screen.getByTestId("count").textContent).toBe("0")
  })

  it("refaz pelo teclado com Ctrl+Y", () => {
    render(
      <SimulatorProvider>
        <ConstructorProvider>
          <CountProbe />
          <CanvasHistoryControls locked={false} />
        </ConstructorProvider>
      </SimulatorProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    press("z")

    press("y")

    expect(screen.getByTestId("count").textContent).toBe("1")
  })

  it("refaz pelo teclado com Ctrl+Shift+Z", () => {
    render(
      <SimulatorProvider>
        <ConstructorProvider>
          <CountProbe />
          <CanvasHistoryControls locked={false} />
        </ConstructorProvider>
      </SimulatorProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    press("z")

    press("Z", { shiftKey: true })

    expect(screen.getByTestId("count").textContent).toBe("1")
  })

  it("aceita Cmd no lugar de Ctrl", () => {
    render(
      <SimulatorProvider>
        <ConstructorProvider>
          <CountProbe />
          <CanvasHistoryControls locked={false} />
        </ConstructorProvider>
      </SimulatorProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "add" }))

    press("z", { ctrlKey: false, metaKey: true })

    expect(screen.getByTestId("count").textContent).toBe("0")
  })

  it("não rouba o Ctrl+Z de dentro de um campo de texto", () => {
    renderControls()
    fireEvent.click(screen.getByRole("button", { name: "add" }))

    const field = screen.getByLabelText("Nome do campo")
    fireEvent.keyDown(field, { key: "z", ctrlKey: true })

    // The key went to the field, so the canvas keeps its block.
    expect(screen.getByRole("button", { name: /desfazer/i })).toBeEnabled()
  })

  it("não desfaz quando está bloqueado, porque nada ali pode mudar", () => {
    renderControls(true)
    // Locked from the start, so no edit could have happened either.
    expect(screen.getByRole("button", { name: /desfazer/i })).toBeDisabled()

    press("z")

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })
})

function CountProbe() {
  const { nodes, addNode } = useConstructor()
  return (
    <div>
      <span data-testid="count">{nodes.length}</span>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>
        add
      </button>
    </div>
  )
}
