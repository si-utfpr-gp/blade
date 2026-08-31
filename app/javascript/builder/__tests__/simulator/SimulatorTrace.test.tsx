import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { TooltipProvider } from "../../components/ui/tooltip"
import SimulatorTrace, { finishedSummaryClassName, traceCellDisplay, traceInstruction } from "../../components/simulator/SimulatorTrace"
import { displayStepNumber, mainStepCount } from "../../components/simulator/tracePresentation"
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
    { nodeId: "n1", nodeType: "startEnd" },
    { nodeId: "n2", nodeType: "decision" },
    { nodeId: "n2", nodeType: "branch" },
    { nodeId: "n3", nodeType: "process" },
    { nodeId: "n4", nodeType: "decision" },
    { nodeId: "n4", nodeType: "branch" },
  ]

  it("numbers decision cases as substeps without advancing the main step", () => {
    expect(displayStepNumber(steps, 1)).toBe("2")
    expect(displayStepNumber(steps, 2)).toBe("2.1")
    expect(displayStepNumber(steps, 3)).toBe("3")
    expect(displayStepNumber(steps, 5)).toBe("4.1")
  })

  it("counts decision cases as substeps", () => {
    expect(mainStepCount(steps)).toBe(4)
  })

  it("numbers additional values from the same input block as substeps", () => {
    const inputSteps = [
      { nodeId: "n1", nodeType: "startEnd" },
      { nodeId: "n2", nodeType: "memory" },
      { nodeId: "n3", nodeType: "input" },
      { nodeId: "n3", nodeType: "input" },
      { nodeId: "n4", nodeType: "process" },
    ]

    expect(displayStepNumber(inputSteps, 2)).toBe("3")
    expect(displayStepNumber(inputSteps, 3)).toBe("3.1")
    expect(displayStepNumber(inputSteps, 4)).toBe("4")
    expect(mainStepCount(inputSteps)).toBe(4)
  })
})

describe("traceInstruction", () => {
  it("identifies decision rows as conditions without repeating the result", () => {
    expect(traceInstruction({
      nodeId: "n6",
      nodeLabel: "num != 0",
      nodeType: "decision",
      variables: [],
      log: "num != 0 → V.",
      explanation: "",
      changes: [],
      nextHint: "",
    })).toBe("Condição (num != 0)")
  })

  it("identifies self-addition processes with compound assignment", () => {
    expect(traceInstruction({
      nodeId: "n5",
      nodeLabel: "soma = soma + num",
      nodeType: "process",
      variables: [],
      log: "soma = soma + num",
      explanation: "",
      changes: [],
      nextHint: "",
    })).toBe("Processo (soma += num)")
  })

  it("uses the generic input label because its value is shown in the table", () => {
    expect(traceInstruction({
      nodeId: "n4",
      nodeLabel: "num",
      nodeType: "input",
      variables: [],
      log: "Lendo num.",
      explanation: "",
      changes: [],
      nextHint: "",
    })).toBe("Entrada")
  })
})

describe("finishedSummaryClassName", () => {
  it("uses the success color for the completed algorithm summary", () => {
    expect(finishedSummaryClassName()).toContain("text-emerald-700")
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
