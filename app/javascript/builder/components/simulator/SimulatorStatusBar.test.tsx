import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorStatusBar from "./SimulatorStatusBar"

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
