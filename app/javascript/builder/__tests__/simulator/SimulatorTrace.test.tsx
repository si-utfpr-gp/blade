import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { TooltipProvider } from "../../components/ui/tooltip"
import SimulatorTrace, { displayStepNumber, traceCellDisplay } from "../../components/simulator/SimulatorTrace"
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

describe("traceCellDisplay", () => {
  it("hides variable values when the step does not change them", () => {
    const value = traceCellDisplay({
      nodeId: "r4",
      nodeLabel: "i <= valor",
      nodeType: "decision",
      variables: [
        { name: "valor", value: "20", type: "caractere", scope: "global" },
        { name: "retorno", value: "1", type: "inteiro", scope: "global" },
        { name: "i", value: "1", type: "inteiro", scope: "global" },
      ],
      log: "i <= valor → V",
      explanation: "",
      changes: ["Decisão: VERDADEIRO"],
      nextHint: "",
    }, "retorno")

    expect(value).toBeNull()
  })

  it("shows a variable value when the step changes it", () => {
    const value = traceCellDisplay({
      nodeId: "n5",
      nodeLabel: "soma = soma + n",
      nodeType: "process",
      variables: [
        { name: "n", value: "2", type: "inteiro", scope: "global" },
        { name: "soma", value: "2", type: "inteiro", scope: "global" },
      ],
      log: "soma = soma + n",
      explanation: "",
      changes: ["soma = 2"],
      nextHint: "",
    }, "soma")

    expect(value).toBe("2")
  })

  it("does not confuse a variable name with part of another change", () => {
    const value = traceCellDisplay({
      nodeId: "n5",
      nodeLabel: "soma = soma + a",
      nodeType: "process",
      variables: [
        { name: "a", value: "2", type: "inteiro", scope: "global" },
        { name: "soma", value: "2", type: "inteiro", scope: "global" },
      ],
      log: "soma = soma + a",
      explanation: "",
      changes: ["soma = 2"],
      nextHint: "",
    }, "a")

    expect(value).toBeNull()
  })

  it("returns null when the variable is not in that step scope", () => {
    const value = traceCellDisplay({
      nodeId: "r4",
      nodeLabel: "i <= valor",
      nodeType: "decision",
      variables: [{ name: "i", value: "1", type: "inteiro", scope: "global" }],
      log: "i <= valor → V",
      explanation: "",
      changes: ["Decisão: VERDADEIRO"],
      nextHint: "",
    }, "retorno")

    expect(value).toBeNull()
  })
})

describe("displayStepNumber", () => {
  const steps = [
    { nodeType: "startEnd" },
    { nodeType: "decision" },
    { nodeType: "branch" },
    { nodeType: "process" },
    { nodeType: "decision" },
    { nodeType: "branch" },
  ]

  it("numbers decision cases as substeps without advancing the main step", () => {
    expect(displayStepNumber(steps, 1)).toBe("2")
    expect(displayStepNumber(steps, 2)).toBe("2.1")
    expect(displayStepNumber(steps, 3)).toBe("3")
    expect(displayStepNumber(steps, 5)).toBe("4.1")
  })
})

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
