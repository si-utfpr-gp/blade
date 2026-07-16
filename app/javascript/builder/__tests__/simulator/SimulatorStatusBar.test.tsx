import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import SimulatorStatusBar from "../../components/simulator/SimulatorStatusBar"

function renderStatusBar() {
  return render(
    <SimulatorProvider>
      <SimulatorStatusBar />
    </SimulatorProvider>
  )
}

describe("SimulatorStatusBar", () => {
  it('shows "Aguardando início" when not started', () => {
    renderStatusBar()
    expect(screen.getByText("Aguardando início")).toBeInTheDocument()
  })
})
