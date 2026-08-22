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
    expect(screen.getByText("Próximo passo")).toBeInTheDocument()
    expect(screen.getByTitle("Próximo no histórico")).toBeInTheDocument()
    expect(screen.getByTitle("Executar tudo")).toBeInTheDocument()
  })

  it("does not show speed selector before starting", () => {
    renderControl()
    expect(screen.queryByRole("combobox", { name: /velocidade/i })).not.toBeInTheDocument()
  })

  it("shows speed selector after starting, next to auto execution", () => {
    renderControl()
    fireEvent.click(screen.getByText("Iniciar Execução"))
    expect(screen.getByRole("combobox", { name: /velocidade/i })).toBeInTheDocument()
    expect(screen.getByTitle("Executar tudo")).toBeInTheDocument()
  })
})
