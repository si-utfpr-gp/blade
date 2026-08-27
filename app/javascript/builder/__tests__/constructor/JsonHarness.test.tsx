import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider, useSimulator } from "../../components/simulator/SimulatorContext"
import JsonHarness from "../../components/constructor/JsonHarness"
import SimulatorTabs from "../../components/simulator/SimulatorTabs"
import SimulatorCode from "../../components/simulator/SimulatorCode"

function renderHarness() {
  return render(
    <SimulatorProvider>
      <JsonHarness />
    </SimulatorProvider>
  )
}

function PanelContent() {
  const { activeTab } = useSimulator()
  return (
    <div>
      <SimulatorTabs />
      {activeTab === "code" && <SimulatorCode />}
    </div>
  )
}

function renderApp() {
  return render(
    <SimulatorProvider>
      <JsonHarness />
      <PanelContent />
    </SimulatorProvider>
  )
}


const subroutineJson = {
  nodes: [
    { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
    { id: "memory", type: "memory", position: { x: 0, y: 80 }, data: { rows: [{ type: "inteiro", variables: "n, resultado" }] } },
    { id: "set-n", type: "process", position: { x: 0, y: 160 }, data: { label: "n = 7" } },
    { id: "call", type: "subroutine", position: { x: 0, y: 240 }, data: { label: "resultado = dobro(n)" } },
    { id: "end", type: "startEnd", position: { x: 0, y: 320 }, data: { variant: "end" } },
  ],
  edges: [
    { id: "e1", source: "start", target: "memory" },
    { id: "e2", source: "memory", target: "set-n" },
    { id: "e3", source: "set-n", target: "call" },
    { id: "e4", source: "call", target: "end" },
  ],
  subroutines: [
    {
      id: "routine-dobro",
      name: "dobro",
      parameters: ["valor"],
      returnVariable: "retorno",
      nodes: [
        { id: "r-start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
        { id: "r-memory", type: "memory", position: { x: 0, y: 80 }, data: { rows: [{ type: "inteiro", variables: "retorno" }] } },
        { id: "r-process", type: "process", position: { x: 0, y: 160 }, data: { label: "retorno = valor * 2" } },
        { id: "r-end", type: "startEnd", position: { x: 0, y: 240 }, data: { variant: "end" } },
      ],
      edges: [
        { id: "re1", source: "r-start", target: "r-memory" },
        { id: "re2", source: "r-memory", target: "r-process" },
        { id: "re3", source: "r-process", target: "r-end" },
      ],
    },
  ],
}

describe("JsonHarness", () => {
  it("renders textarea and action buttons", () => {
    renderHarness()
    expect(screen.getByLabelText(/json do diagrama/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /carregar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /limpar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /exemplo/i })).toBeInTheDocument()
  })

  it("preenches textarea with example JSON on Exemplo", () => {
    renderHarness()
    fireEvent.click(screen.getByRole("button", { name: /exemplo/i }))
    const textarea = screen.getByLabelText(/json do diagrama/i) as HTMLTextAreaElement
    expect(textarea.value).toContain('"nodes"')
    expect(textarea.value).toContain("startEnd")
  })

  it("loads valid JSON and shows success status", () => {
    renderHarness()
    fireEvent.click(screen.getByRole("button", { name: /exemplo/i }))
    fireEvent.click(screen.getByRole("button", { name: /carregar/i }))
    expect(screen.getByText(/código js\/ts gerado/i)).toBeInTheDocument()
  })

  it("gera JS/TS na aba Código após carregar o exemplo (soma)", () => {
    renderApp()
    fireEvent.click(screen.getByRole("button", { name: /exemplo/i }))
    fireEvent.click(screen.getByRole("button", { name: /carregar/i }))
    fireEvent.click(screen.getByText("Código"))
    const code = screen.getByText("JavaScript").closest("div")?.parentElement?.querySelector("code")
    expect(code?.textContent).toContain("let num1;")
    expect(code?.textContent).toContain('console.log("A soma');
  })

  it("loads visual subroutine definitions from JSON", () => {
    renderApp()
    fireEvent.change(screen.getByLabelText(/json do diagrama/i), {
      target: { value: JSON.stringify(subroutineJson) },
    })
    fireEvent.click(screen.getByRole("button", { name: /carregar/i }))
    fireEvent.click(screen.getByText("Código"))

    const code = screen.getByText("JavaScript").closest("div")?.parentElement?.querySelector("code")
    expect(code?.textContent).toContain("function dobro(valor)")
    expect(code?.textContent).toContain("resultado = dobro(n);")
  })

  it("shows error for invalid JSON", () => {
    renderHarness()
    fireEvent.change(screen.getByLabelText(/json do diagrama/i), { target: { value: "{invalid" } })
    fireEvent.click(screen.getByRole("button", { name: /carregar/i }))
    expect(screen.getByText(/json inválido/i)).toBeInTheDocument()
  })

  it("shows error when loadDiagram fails (no start node)", () => {
    renderHarness()
    const noStart = JSON.stringify({ nodes: [{ id: "n4", type: "process", position: { x: 0, y: 0 }, data: { label: "soma = 1" } }], edges: [] })
    fireEvent.change(screen.getByLabelText(/json do diagrama/i), { target: { value: noStart } })
    fireEvent.click(screen.getByRole("button", { name: /carregar/i }))
    expect(screen.getByText(/início/i)).toBeInTheDocument()
  })

  it("clears textarea and status on Limpar", () => {
    renderHarness()
    fireEvent.click(screen.getByRole("button", { name: /exemplo/i }))
    fireEvent.click(screen.getByRole("button", { name: /limpar/i }))
    const textarea = screen.getByLabelText(/json do diagrama/i) as HTMLTextAreaElement
    expect(textarea.value).toBe("")
  })
})
