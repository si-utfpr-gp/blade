import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { TooltipProvider } from "../../components/ui/tooltip"
import SimulatorTrace from "../../components/simulator/SimulatorTrace"
import SimulatorControl from "../../components/simulator/SimulatorControl"

function renderTrace() {
  return render(
    <SimulatorProvider>
      <TooltipProvider>
        <SimulatorTrace />
      </TooltipProvider>
    </SimulatorProvider>
  )
}

describe("SimulatorTrace", () => {
  it('shows prompt when not started', () => {
    renderTrace()
    expect(screen.getByText(/iniciar execução/i)).toBeInTheDocument()
  })

  it("shows output section after starting", () => {
    render(
      <SimulatorProvider>
        <TooltipProvider>
          <SimulatorControl />
          <SimulatorTrace />
        </TooltipProvider>
      </SimulatorProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: /iniciar execução/i }))
    expect(screen.getByText("Saída do Algoritmo")).toBeInTheDocument()
  })
})
