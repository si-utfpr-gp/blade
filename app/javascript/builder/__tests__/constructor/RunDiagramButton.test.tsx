import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider, useSimulator } from "../../components/simulator/SimulatorContext"
import { ConstructorProvider } from "../../components/constructor/ConstructorProvider"
import { RunDiagramButton } from "../../components/constructor/RunDiagramButton"
import type { ReactNode } from "react"

function TestHarness({ onDiagramLoaded }: { onDiagramLoaded?: () => void }) {
  const { state, start } = useSimulator()

  return (
    <div>
      <RunDiagramButton onDiagramLoaded={onDiagramLoaded} />
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
      <ConstructorProvider>{ui}</ConstructorProvider>
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
    fireEvent.click(screen.getByRole("button", { name: /executar/i }))
    expect(screen.getByText(/carregado/i)).toBeInTheDocument()
    expect(onDiagramLoaded).toHaveBeenCalledTimes(1)
  })

  it("limpa a execução anterior ao executar novamente", () => {
    renderIntegration(<TestHarness />)
    fireEvent.click(screen.getByRole("button", { name: /executar/i }))
    fireEvent.click(screen.getByRole("button", { name: /start-exec/i }))
    expect(screen.getByTestId("sim-steps").textContent).toBe("1")
    fireEvent.click(screen.getByRole("button", { name: /executar/i }))
    expect(screen.getByTestId("sim-steps").textContent).toBe("0")
    expect(screen.getByText(/carregado/i)).toBeInTheDocument()
  })
})
