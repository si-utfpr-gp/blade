import { describe, it, expect } from "vitest"
import type { Edge, Node } from "@xyflow/react"
import { parse } from "../../parser/parser"
import { CodeGenerator } from "../../engine/CodeGenerator"
import { runToEnd, type RawDiagram } from "./runDiagram"
import { input, out, program } from "./diagramBuilder"

// Enter in an input or output block only lays the text out on more lines, so
// a long message fits the block. The algorithm reads each break as a space,
// even inside a string, and the generated code stays valid.
function generatedCode(diagram: RawDiagram): string {
  const nodes = diagram.nodes.map((node) => ({ data: {}, ...node, position: { x: 0, y: 0 } }) as Node)
  return new CodeGenerator(parse(nodes, diagram.edges as Edge[])).generate()
}

describe("quebras de linha nos blocos de entrada e saída", () => {
  const diagram = program(
    [["inteiro", "a, b"]],
    [input("a,\n  b"), out("'Escolha a operação:\n  depois digite' + \n a")],
  )

  it("lê a quebra como espaço ao executar", () => {
    const run = runToEnd(diagram, ["2", "3"])

    expect(run.outputs).toEqual(["Escolha a operação: depois digite2"])
  })

  it("gera código sem quebra dentro da string", () => {
    const code = generatedCode(diagram)

    expect(code).toContain("console.log('Escolha a operação: depois digite' + a);")
    expect(code).not.toMatch(/operação:\n/)
  })
})
