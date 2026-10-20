import { describe, it, expect } from "vitest"
import { ERROR_TYPES } from "../../engine/errors"
import { runToEnd, type RawDiagram } from "./runDiagram"
import { block, choose, expectError, input, out, proc, program } from "./diagramBuilder"

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

  // The escolha/caso compares a value against a finite list of options, so it
  // only takes integers and characters: not reals, and not logical tests.
  it("a escolha aceita uma variável inteira", () => {
    const diagram = program([["inteiro", "n"]], [input("n"), choose("n", [["0", [out("'zero'")]], ["1", [out("'um'")]]], [out("'inválido'")])])
    expect(runToEnd(diagram, ["1"]).outputs).toEqual(["um"])
  })

  it("a escolha aceita uma variável caractere", () => {
    const diagram = program([["caractere", "op"]], [input("op"), choose("op", [["'+'", [out("'soma'")]]], [out("'outro'")])])
    expect(runToEnd(diagram, ["+"]).outputs).toEqual(["soma"])
  })

  it("a escolha recusa uma variável real", () => {
    expectError(
      program([["real", "x"]], [input("x"), choose("x", [["1", [out("'um'")]]])]),
      ["1"],
      ERROR_TYPES.INVALID_SELECTION,
      "A escolha só compara valores inteiros ou caracteres, e 'x' é real.",
    )
  })

  it("a escolha recusa uma expressão lógica", () => {
    expectError(
      program([["inteiro", "x"]], [input("x"), choose("x > 1", [["verdadeiro", [out("'sim'")]]])]),
      ["2"],
      ERROR_TYPES.INVALID_SELECTION,
      "A escolha só compara valores inteiros ou caracteres, e 'x > 1' é lógico.",
    )
  })

  it("a escolha recusa uma conta que dá um número com casas decimais", () => {
    expectError(
      program([["inteiro", "x"]], [input("x"), choose("x / 2", [["1", [out("'um'")]]])]),
      ["3"],
      ERROR_TYPES.INVALID_SELECTION,
      "A escolha só compara valores inteiros ou caracteres, e 'x / 2' é real.",
    )
  })
})
