import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import SimulatorHeader from "../../components/simulator/SimulatorHeader"

function renderWithState(_overrides?: Partial<import("../../interfaces/simulator").ISimulatorState>) {
  return render(
    <SimulatorProvider>
      <SimulatorHeader />
    </SimulatorProvider>
  )
}

describe("SimulatorHeader", () => {
  it('shows "Pronto" when not started', () => {
    renderWithState()
    expect(screen.getByText("Pronto")).toBeInTheDocument()
  })

  it("shows the Terminal icon", () => {
    renderWithState()
    expect(screen.getByText("Depurador")).toBeInTheDocument()
  })
})
