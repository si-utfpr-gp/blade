import { ToastProvider } from "../../components/ui/Toast"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider, useSimulator } from "../../components/simulator/SimulatorContext"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { RunDiagramButton } from "../../components/constructor/RunDiagramButton"
import type { ReactNode } from "react"

function TestHarness({ onDiagramLoaded }: { onDiagramLoaded?: () => void }) {
  const { state, start } = useSimulator()
  const { addNode } = useConstructor()

  return (
    <div>
      <RunDiagramButton onDiagramLoaded={onDiagramLoaded} />
      {/* The canvas opens empty, so a step needs a block to step through. */}
      <button type="button" onClick={() => addNode("startEnd", { x: 0, y: 0 }, "start")}>
        add-start
      </button>
      <button type="button" onClick={start}>
        start-exec
      </button>
      <span data-testid="sim-steps">{state.steps.length}</span>
    </div>
  )
}

function renderIntegration(ui: ReactNode) {
  return render(
    <SimulatorProvider>
      <ToastProvider>
      <AlgorithmsProvider signedIn>
        <ConstructorProvider>{ui}</ConstructorProvider>
      </AlgorithmsProvider>
    </ToastProvider>
    </SimulatorProvider>,
  )
}

describe("RunDiagramButton", () => {
  it("renderiza botão Executar", () => {
    renderIntegration(<TestHarness />)
    expect(screen.getByRole("button", { name: /executar/i })).toBeInTheDocument()
  })

  it("carrega o diagrama e abre o painel do simulador ao clicar em Executar", () => {
    const onDiagramLoaded = vi.fn()
    renderIntegration(<TestHarness onDiagramLoaded={onDiagramLoaded} />)
    fireEvent.click(screen.getByRole("button", { name: /add-start/i }))
    fireEvent.click(screen.getByRole("button", { name: /executar/i }))
    // The status message is no longer rendered on the button; loading the
    // diagram is observed through the callback it triggers.
    expect(onDiagramLoaded).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("sim-steps").textContent).toBe("1")
  })

  it("limpa a execução anterior ao executar novamente", () => {
    renderIntegration(<TestHarness />)
    fireEvent.click(screen.getByRole("button", { name: /add-start/i }))
    fireEvent.click(screen.getByRole("button", { name: /executar/i }))
    expect(screen.getByTestId("sim-steps").textContent).toBe("1")
    fireEvent.click(screen.getByRole("button", { name: /executar/i }))
    expect(screen.getByTestId("sim-steps").textContent).toBe("1")
  })
})
