import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorCode from "./SimulatorCode"

describe("SimulatorCode", () => {
  it("renders JS and TS toggle buttons", () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    expect(screen.getByText("JavaScript")).toBeInTheDocument()
    expect(screen.getByText("TypeScript")).toBeInTheDocument()
  })

  it("shows JavaScript by default", () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    expect(screen.getByText("JavaScript").className).toContain("border-primary")
  })

  it("switches to TypeScript on click", () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    fireEvent.click(screen.getByText("TypeScript"))
    expect(screen.getByText("TypeScript").className).toContain("border-primary")
  })

  it('shows "Copiar" button', () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    expect(screen.getByText("Copiar")).toBeInTheDocument()
  })
})
