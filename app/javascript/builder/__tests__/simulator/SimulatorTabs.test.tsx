import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import SimulatorTabs from "../../components/simulator/SimulatorTabs"

function renderTabs() {
  return render(
    <SimulatorProvider>
      <SimulatorTabs />
    </SimulatorProvider>
  )
}

describe("SimulatorTabs", () => {
  it("renders all three tabs", () => {
    renderTabs()
    expect(screen.getByText("Teste de Mesa")).toBeInTheDocument()
    expect(screen.getByText("Explicação")).toBeInTheDocument()
    expect(screen.getByText("Código")).toBeInTheDocument()
  })

  it("has Teste de Mesa active by default", () => {
    renderTabs()
    const traceTab = screen.getByText("Teste de Mesa")
    expect(traceTab.className).toContain("border-primary")
  })

  it("switches active tab on click", () => {
    renderTabs()
    fireEvent.click(screen.getByText("Explicação"))
    const explainTab = screen.getByText("Explicação")
    expect(explainTab.className).toContain("border-primary")
  })
})
