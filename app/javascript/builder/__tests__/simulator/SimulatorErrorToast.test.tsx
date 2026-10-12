import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import SimulatorErrorToast from "../../components/simulator/SimulatorErrorToast"

describe("SimulatorErrorToast", () => {
  it("shows the public execution message as an alert", () => {
    render(<SimulatorErrorToast message="O motor de execução identificou um problema no seu diagrama. Revise o fluxo e tente novamente." />)

    expect(screen.getByRole("alert")).toHaveTextContent("O motor de execução identificou um problema no seu diagrama")
  })

  it("renders nothing without an error", () => {
    render(<SimulatorErrorToast message={null} />)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
