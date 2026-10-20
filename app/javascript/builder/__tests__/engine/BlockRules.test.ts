import { describe, it, expect } from "vitest"
import { ERROR_TYPES } from "../../engine/errors"
import { runToEnd, type RawDiagram } from "./runDiagram"
import { block, expectError, out, proc, program } from "./diagramBuilder"

/*
 * Classroom rules for what goes inside a block: the memory block only
 * declares variables with their types, and a process block holds a single
 * instruction. Values are given in process blocks, one per block, so every
 * change shows as its own row in the desk check.
 */

describe("regras dos blocos", () => {
  it("um processo com uma instrução executa normalmente", () => {
    const run = runToEnd(program([["inteiro", "a"]], [proc("a = 1"), out("a")]))
    expect(run.outputs).toEqual(["1"])
  })

  it("um processo com duas instruções é recusado e diz como separar", () => {
    expectError(
      program([["inteiro", "a, b"]], [block("process", "a = 1; b = 2")]),
      [],
      ERROR_TYPES.INVALID_EXPRESSION,
      "Um bloco de processo aceita uma única instrução. Separe 'a = 1; b = 2' em um bloco para cada instrução.",
    )
  })

  it("um ';' no fim da única instrução não conta como segunda instrução", () => {
    const run = runToEnd(program([["inteiro", "a"]], [proc("a = 1;"), out("a")]))
    expect(run.outputs).toEqual(["1"])
  })

  it("um ';' dentro de um texto não separa instruções", () => {
    const run = runToEnd(program([["caractere", "t"]], [proc("t = 'a; b'"), out("t")]))
    expect(run.outputs).toEqual(["a; b"])
  })

  it("a memória só declara: valor inicial é recusado e indica o bloco de processo", () => {
    // Built by hand: the shared builder turns initial values into process blocks.
    const diagram: RawDiagram = {
      nodes: [
        { id: "n1", type: "startEnd", data: { label: "Início", variant: "start" } },
        { id: "n2", type: "memory", data: { label: "Memória", rows: [{ type: "inteiro", variables: "soma", initialValue: "0" }] } },
        { id: "n3", type: "startEnd", data: { label: "Fim", variant: "end" } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n3" },
      ],
    }
    expectError(
      diagram,
      [],
      ERROR_TYPES.INVALID_EXPRESSION,
      "A memória só declara variáveis. Inicialize 'soma' em um bloco de processo, como 'soma = 0'.",
    )
  })
})
