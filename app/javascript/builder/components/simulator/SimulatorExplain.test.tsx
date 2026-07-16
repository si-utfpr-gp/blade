import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorExplain from "./SimulatorExplain"

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
