import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import SimulatorExplain from "../../components/simulator/SimulatorExplain"

describe("SimulatorExplain", () => {
  it('shows prompt when not started', () => {
    render(
      <SimulatorProvider>
        <SimulatorExplain />
      </SimulatorProvider>
    )
    expect(screen.getByText(/inicie a execução/i)).toBeInTheDocument()
  })
})
