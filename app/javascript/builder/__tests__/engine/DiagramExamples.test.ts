import { describe, it, expect } from "vitest"
import type { Edge, Node } from "@xyflow/react"
import { DIAGRAM_EXAMPLES, type IDiagramExample } from "../../interfaces/diagramExamples"
import { parse } from "../../parser/parser"
import { ExecutionEngine } from "../../engine/ExecutionEngine"

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
}

describe("exemplos de diagramas", () => {
  it("todo exemplo tem um resultado esperado neste teste", () => {
    expect(DIAGRAM_EXAMPLES.map((example) => example.title).sort()).toEqual(Object.keys(EXPECTED).sort())
  })

  it.each(DIAGRAM_EXAMPLES)("executa '$title' até o fim", (example) => {
    expect(runToEnd(engineFor(example), ["2"])).toEqual(EXPECTED[example.title])
  })
})
