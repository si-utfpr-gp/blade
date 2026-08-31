import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import type { Node, Edge } from "@xyflow/react"
import { SimulatorProvider, useSimulator } from "../../components/simulator/SimulatorContext"
import SimulatorControl from "../../components/simulator/SimulatorControl"
import SimulatorTrace from "../../components/simulator/SimulatorTrace"
import SimulatorCode from "../../components/simulator/SimulatorCode"

const sumNodes: Node[] = [
  { id: "n1", type: "startEnd", position: { x: 250, y: 0 }, data: { label: "Início", variant: "start" } },
  { id: "n2", type: "memory", position: { x: 220, y: 80 }, data: { label: "Memória", rows: [{ type: "inteiro", variables: "num1, num2, soma" }] } },
  { id: "n3", type: "input", position: { x: 240, y: 200 }, data: { label: "num1, num2" } },
  { id: "n4", type: "process", position: { x: 230, y: 310 }, data: { label: "soma = num1 + num2" } },
  { id: "n5", type: "output", position: { x: 240, y: 420 }, data: { label: '"A soma é: " + soma' } },
  { id: "n6", type: "startEnd", position: { x: 250, y: 530 }, data: { label: "Fim", variant: "end" } },
]

const sumEdges: Edge[] = [
  { id: "e1", source: "n1", target: "n2" },
  { id: "e2", source: "n2", target: "n3" },
  { id: "e3", source: "n3", target: "n4" },
  { id: "e4", source: "n4", target: "n5" },
  { id: "e5", source: "n5", target: "n6" },
]

function Probe({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const { loadDiagram } = useSimulator()
  const [result, setResult] = useState<string>("")
  return (
    <div>
      <button
        onClick={() => {
          const r = loadDiagram(nodes, edges)
          setResult(r.ok ? "ok" : r.error)
        }}
      >
        carregar
      </button>
      <span data-testid="result">{result}</span>
    </div>
  )
}

import { TooltipProvider } from "../../components/ui/tooltip"
import InputDialog from "../../components/simulator/InputDialog"

function renderHarness(nodes: Node[], edges: Edge[]) {
  return render(
    <SimulatorProvider>
      <TooltipProvider>
        <Probe nodes={nodes} edges={edges} />
        <SimulatorControl />
        <SimulatorTrace />
        <SimulatorCode />
        <InputDialog />
      </TooltipProvider>
    </SimulatorProvider>
  )
}

function renderInteractive(nodes: Node[], edges: Edge[]) {
  return render(
    <SimulatorProvider>
      <TooltipProvider>
        <Probe nodes={nodes} edges={edges} />
        <SimulatorControl />
        <SimulatorTrace />
        <InputDialog />
        <SimulatorCode />
      </TooltipProvider>
    </SimulatorProvider>
  )
}

describe("loadDiagram", () => {
  it("loads a valid diagram: engine set and code generated", () => {
    renderHarness(sumNodes, sumEdges)

    fireEvent.click(screen.getByRole("button", { name: "carregar" }))
    expect(screen.getByTestId("result")).toHaveTextContent("ok")

    const code = screen.getByText("JavaScript").closest("div")?.parentElement?.querySelector("code")
    expect(code?.textContent).toContain("let num1;")
    expect(code?.textContent).toContain("console.log")

    fireEvent.click(screen.getByRole("button", { name: /iniciar execução/i }))
    expect(screen.getByText(/Histórico — Passo 1/)).toBeInTheDocument()
  })

  it("returns error for diagram without start node", () => {
    const noStartNodes: Node[] = [
      { id: "n4", type: "process", position: { x: 230, y: 310 }, data: { label: "soma = num1 + num2" } },
    ]
    renderHarness(noStartNodes, [])

    fireEvent.click(screen.getByRole("button", { name: "carregar" }))
    expect(screen.getByTestId("result")).toHaveTextContent(/não|início/i)
  })
})

describe("input multi-valor (teste de mesa real)", () => {
  function submitValue(value: string) {
    const field = screen.getByPlaceholderText(/número inteiro/i)
    fireEvent.change(field, { target: { value } })
    fireEvent.click(screen.getByRole("button", { name: "OK" }))
  }

  it("pede um valor por vez e não traça linha fantasma", () => {
    renderInteractive(sumNodes, sumEdges)
    fireEvent.click(screen.getByRole("button", { name: "carregar" }))
    fireEvent.click(screen.getByRole("button", { name: /iniciar execução/i }))
    expect(screen.getByText(/Histórico — Passo 1/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Próximo passo" }))
    expect(screen.getByText(/Histórico — Passo 2/)).toBeInTheDocument()
    expect(screen.queryByText("Entrada de Dados")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Próximo passo" }))
    expect(screen.getByText(/Valor para 'num1':/)).toBeInTheDocument()
    expect(screen.getByText(/Histórico — Passo 2/)).toBeInTheDocument()

    submitValue("10")
    expect(screen.getByText(/Valor para 'num2':/)).toBeInTheDocument()
    expect(screen.getByText(/Histórico — Passo 3/)).toBeInTheDocument()

    submitValue("20")
    expect(screen.queryByText("Entrada de Dados")).not.toBeInTheDocument()
    expect(screen.getByText(/Histórico — Passo 3\.1/)).toBeInTheDocument()
  })

  it("navega pelo histórico sem executar e substitui o futuro ao informar novo valor", () => {
    renderInteractive(sumNodes, sumEdges)
    fireEvent.click(screen.getByRole("button", { name: "carregar" }))
    fireEvent.click(screen.getByRole("button", { name: /iniciar execução/i }))

    fireEvent.click(screen.getByRole("button", { name: "Próximo passo" }))
    fireEvent.click(screen.getByRole("button", { name: "Próximo passo" }))
    submitValue("10")
    submitValue("20")
    expect(screen.getByText("Histórico — Passo 3.1/3")).toBeInTheDocument()

    fireEvent.click(screen.getByTitle("Passo anterior"))
    expect(screen.getByText("Histórico — Passo 3/3")).toBeInTheDocument()

    fireEvent.click(screen.getByTitle("Próximo no histórico"))
    expect(screen.getByText("Histórico — Passo 3.1/3")).toBeInTheDocument()
    expect(screen.queryByText("Entrada de Dados")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTitle("Passo anterior"))
    fireEvent.click(screen.getByRole("button", { name: "Próximo passo" }))
    expect(screen.getByText(/Valor para 'num2':/)).toBeInTheDocument()
    submitValue("30")

    expect(screen.getByText("Histórico — Passo 3.1/3")).toBeInTheDocument()
    expect(screen.getAllByText("30")).toHaveLength(2)
    expect(screen.queryByText("20")).not.toBeInTheDocument()
  })


  it("executa automaticamente até input, retoma após submit e respeita timer", async () => {
    vi.useFakeTimers()
    try {
      renderInteractive(sumNodes, sumEdges)
      fireEvent.click(screen.getByRole("button", { name: "carregar" }))
      fireEvent.click(screen.getByRole("button", { name: /iniciar execução/i }))

      fireEvent.click(screen.getByTitle("Executar tudo"))

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
      expect(screen.getByText(/Valor para 'num1':/)).toBeInTheDocument()

      submitValue("10")
      expect(screen.getByText(/Valor para 'num2':/)).toBeInTheDocument()

      submitValue("20")
      expect(screen.queryByText("Entrada de Dados")).not.toBeInTheDocument()

      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1000)
        })
      }
      expect(screen.getByText(/A soma é: 30/)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
