import { describe, it, expect } from "vitest"
import type { Edge, Node } from "@xyflow/react"
import { DIAGRAM_EXAMPLES, type IDiagramExample } from "../../interfaces/diagramExamples"
import { parse } from "../../parser/parser"
import { ExecutionEngine } from "../../engine/ExecutionEngine"
import { constructorIssues, type RawDiagram } from "./runDiagram"
import { getConnectorRole } from "../../components/constructor/nodes/connectorRole"

type RawRoutine = { nodes: Omit<Node, "position">[]; edges: Edge[] } & Record<string, unknown>

const withPosition = (nodes: Omit<Node, "position">[]): Node[] =>
  nodes.map((node) => ({ ...node, position: { x: 0, y: 0 } }) as Node)

function engineFor(example: IDiagramExample): ExecutionEngine {
  const { nodes, edges, subroutines } = example.diagram
  const routines = (subroutines as RawRoutine[] | undefined)?.map((routine) => ({
    ...routine,
    nodes: withPosition(routine.nodes),
  }))
  return new ExecutionEngine(parse(
    withPosition(nodes as Omit<Node, "position">[]),
    edges as Edge[],
    routines ? { subroutines: routines as never } : undefined,
  ))
}

function runToEnd(engine: ExecutionEngine, inputs: string[]): string[] {
  let last = engine.start()
  for (let guard = 0; guard < 1000 && !engine.getCurrentState().finished; guard++) {
    last = last?.waitingForInput ? engine.step(inputs.shift() ?? "0") : engine.step()
    if (!last) break
  }
  expect(engine.getCurrentState().finished).toBe(true)
  return engine.getCurrentOutputs()
}

// Every example the student can open must run to the end. Inputs: 2, then 0
// for anything else, which also ends the sentinel loops.
const EXPECTED: Record<string, string[]> = {
  "Soma de dois valores": ["A soma é: 2"],
  "Par ou Ímpar": ["O número é PAR"],
  "Maior de Três": ["O maior é: 2"],
  "Fatorial": ["O fatorial de 2 é 2"],
  "Soma até Zero": ["A soma é: 2"],
  "Validação de Nota": ["NOTA VÁLIDA"],
  "Média de Valores": ["A média é: 0"],
  "Média de Notas com Vetor": ["A média das notas é: 0"],
  "Sub-rotina Visual — Fatorial": ["Fatorial: 2"],
  "Média de Duas Notas": ["1"],
  "Menu de opções": ["Carregar jogo"],
  "Conceito da Nota": ["Conceito inválido"],
}

describe("exemplos de diagramas", () => {
  it("todo exemplo tem um resultado esperado neste teste", () => {
    expect(DIAGRAM_EXAMPLES.map((example) => example.title).sort()).toEqual(Object.keys(EXPECTED).sort())
  })

  // The list is a path through the course: input and output first, then
  // conditions, selection, loops, vectors and finally sub-routines.
  it("vão do mais simples ao mais difícil", () => {
    expect(DIAGRAM_EXAMPLES.map((example) => example.id)).toEqual([
      "soma-dois-valores",
      "media-de-duas-notas",
      "par-ou-impar",
      "validacao-de-nota",
      "maior-de-tres",
      "menu-de-opcoes",
      "conceito-da-nota",
      "fatorial",
      "soma-ate-zero",
      "media-de-valores",
      "media-de-notas-com-vetor",
      "subrotina-visual-fatorial",
    ])
  })

  it.each(DIAGRAM_EXAMPLES)("executa '$title' até o fim", (example) => {
    expect(runToEnd(engineFor(example), ["2"])).toEqual(EXPECTED[example.title])
  })

  it.each(DIAGRAM_EXAMPLES)("'$title' pode ser desenhado no construtor, conectores incluídos", (example) => {
    expect(constructorIssues(example.diagram as RawDiagram)).toEqual([])
  })

  // The examples are what a student copies, so they follow the classroom rules.
  it.each(DIAGRAM_EXAMPLES)("'$title' tem uma única instrução por bloco de processo", (example) => {
    const processes = flowsOf(example)
      .flatMap((flow) => flow.nodes)
      .filter((node) => node.type === "process")
      .map((node) => String(node.data.label))
    expect(processes.filter((label) => label.includes(";"))).toEqual([])
  })

  // An initial value set in the memory block does not show on the canvas, so a
  // student reading the diagram would not know where the value came from.
  it.each(DIAGRAM_EXAMPLES)("'$title' inicializa as variáveis em blocos de processo, não na memória", (example) => {
    const rows = flowsOf(example)
      .flatMap((flow) => flow.nodes)
      .filter((node) => node.type === "memory")
      .flatMap((node) => (node.data.rows as Array<Record<string, unknown>> | undefined) ?? [])
    expect(rows.filter((row) => row.initialValue !== undefined)).toEqual([])
  })

  // A connector exists to bring paths together; one with a single way in is
  // just an extra circle on the arrow.
  it.each(DIAGRAM_EXAMPLES)("'$title' só usa conectores que juntam caminhos", (example) => {
    for (const flow of flowsOf(example)) {
      const roles = flow.nodes
        .filter((node) => node.type === "connector")
        .map((node) => `${node.data.label}: ${getConnectorRole(node.id, flow.edges as Edge[], flow.nodes as Node[])}`)
      expect(roles.filter((role) => !/: (loopStart|decisionJoin|selectionJoin)$/.test(role))).toEqual([])
    }
  })
})

/** The main flow and the flow of each subroutine. */
function flowsOf(example: IDiagramExample): Array<{ nodes: Array<{ id: string; type: string; data: Record<string, unknown> }>; edges: unknown[] }> {
  const routines = (example.diagram.subroutines as RawRoutine[] | undefined) ?? []
  return [
    example.diagram,
    ...routines.map((routine) => ({ nodes: routine.nodes as never, edges: routine.edges })),
  ]
}
