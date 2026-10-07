import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider, useSimulator } from "../../components/simulator/SimulatorContext"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"
import { ExamplesSection } from "../../components/constructor/ExamplesSection"
import { DIAGRAM_EXAMPLES } from "../../interfaces/diagramExamples"

function Probe() {
  const { nodes } = useConstructor()
  const { state } = useSimulator()
  return (
    <div>
      <span data-testid="canvas-nodes">{nodes.length}</span>
      <span data-testid="sim-steps">{state.steps.length}</span>
    </div>
  )
}

function renderSection() {
  return render(
    <SimulatorProvider>
      <ConstructorProvider>
        <ExamplesSection />
        <Probe />
      </ConstructorProvider>
    </SimulatorProvider>,
  )
}

describe("ExamplesSection", () => {
  it("lista os exemplos com selo de categoria, sem o de sub-rotina", () => {
    renderSection()
    expect(screen.getByText(/exemplos/i)).toBeInTheDocument()
    for (const example of DIAGRAM_EXAMPLES.filter(
      (item) => !item.diagram.subroutines?.length,
    )) {
      expect(
        screen.getByRole("button", { name: new RegExp(example.title, "i") }),
      ).toBeInTheDocument()
    }
    expect(
      screen.queryByRole("button", { name: /sub-rotina visual/i }),
    ).not.toBeInTheDocument()
  })

  it("carrega o exemplo no canvas e marca como selecionado", () => {
    renderSection()
    expect(screen.getByTestId("canvas-nodes").textContent).toBe("1")
    const button = screen.getByRole("button", { name: /soma de dois valores/i })
    expect(button).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(button)
    expect(screen.getByTestId("canvas-nodes").textContent).toBe("6")
    expect(button).toHaveAttribute("aria-pressed", "true")
  })
})
