import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import SimulatorControl from "../../components/simulator/SimulatorControl"

function renderControl() {
  return render(
    <SimulatorProvider>
      <SimulatorControl />
    </SimulatorProvider>
  )
}

describe("SimulatorControl", () => {
  it('shows "Iniciar Execução" button when not started', () => {
    renderControl()
    expect(screen.getByText("Iniciar Execução")).toBeInTheDocument()
  })

  it("dispatches START when clicking Iniciar Execução", () => {
    renderControl()
    fireEvent.click(screen.getByText("Iniciar Execução"))
    // After clicking, the Iniciar button should be gone
    expect(screen.queryByText("Iniciar Execução")).not.toBeInTheDocument()
  })

  it("shows step controls after starting", () => {
    renderControl()
    fireEvent.click(screen.getByText("Iniciar Execução"))
    expect(screen.getByTitle("Passo anterior")).toBeInTheDocument()
    expect(screen.getByText("Próximo")).toBeInTheDocument()
    expect(screen.getByTitle("Executar tudo")).toBeInTheDocument()
  })

  it("shows speed selector", () => {
    renderControl()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })
})
