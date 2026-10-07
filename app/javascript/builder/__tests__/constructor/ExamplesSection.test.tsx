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

function openExamplesDropdown() {
  fireEvent.click(screen.getByRole("button", { name: /^Exemplos:/ }))
}

describe("ExamplesSection", () => {
  it("esconde os exemplos até o dropdown de Exemplos ser aberto", () => {
    renderSection()
    expect(
      screen.queryByRole("button", { name: /soma de dois valores/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Exemplos:/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("fecha o dropdown de Exemplos ao clicar fora dele", () => {
    renderSection()
    openExamplesDropdown()
    expect(
      screen.getByRole("button", { name: /soma de dois valores/i }),
    ).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(
      screen.queryByRole("button", { name: /soma de dois valores/i }),
    ).not.toBeInTheDocument()
  })

  it("fecha o dropdown de Exemplos ao pressionar Escape", () => {
    renderSection()
    openExamplesDropdown()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(
      screen.queryByRole("button", { name: /soma de dois valores/i }),
    ).not.toBeInTheDocument()
  })

  it("lista os exemplos com selo de categoria, sem o de sub-rotina", () => {
    renderSection()
    openExamplesDropdown()
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
    openExamplesDropdown()
    expect(screen.getByTestId("canvas-nodes").textContent).toBe("1")
    const button = screen.getByRole("button", { name: /soma de dois valores/i })
    expect(button).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(button)
    expect(screen.getByTestId("canvas-nodes").textContent).toBe("6")
    expect(
      screen.getByRole("button", { name: /^Exemplos:/ }),
    ).toHaveAttribute("aria-label", expect.stringContaining("Soma de dois valores"))
  })

  it("mostra o dropdown Meus algoritmos vazio acima do de Exemplos", () => {
    renderSection()
    const userAlgorithms = screen.getByRole("button", { name: /^Meus algoritmos:/ })
    expect(userAlgorithms).toHaveAttribute("aria-expanded", "false")
    expect(userAlgorithms).toBeInTheDocument()

    const headings = screen.getAllByRole("button", { name: /^(Exemplos|Meus algoritmos):/ })
    expect(headings[0]).toHaveAccessibleName(/^Meus algoritmos:/)
    expect(headings[1]).toHaveAccessibleName(/^Exemplos:/)

    fireEvent.click(userAlgorithms)
    expect(
      screen.getByText(/Nenhum algoritmo salvo ainda\./i),
    ).toBeInTheDocument()
  })
})