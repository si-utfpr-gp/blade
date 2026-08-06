import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import JsonHarness from "../../components/constructor/JsonHarness"

function renderHarness() {
  return render(
    <SimulatorProvider>
      <JsonHarness />
    </SimulatorProvider>
  )
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
    expect(screen.getByText(/motor carregado/i)).toBeInTheDocument()
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
