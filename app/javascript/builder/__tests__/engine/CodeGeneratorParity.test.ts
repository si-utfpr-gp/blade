import { describe, it, expect } from "vitest"
import type { Edge, Node } from "@xyflow/react"
import { parse } from "../../parser/parser"
import { CodeGenerator } from "../../engine/CodeGenerator"
import { parseLogical } from "../../engine/values"
import { runToEnd, type RawDiagram } from "./runDiagram"
import {
  call,
  doWhile,
  ifElse,
  input,
  out,
  proc,
  program,
  routine,
  whileLoop,
} from "./diagramBuilder"

/*
 * The Código tab shows the diagram as JavaScript. Running that code must
 * print what the debugger prints for the same inputs, or the student sees
 * two programs that disagree.
 */

function generatedCode(diagram: RawDiagram): string {
  const position = (nodes: RawDiagram["nodes"]) => nodes.map((node) => ({ data: {}, ...node, position: { x: 0, y: 0 } }) as Node)
  const routines = diagram.subroutines?.map((routine) => ({ ...routine, nodes: position(routine.nodes), edges: routine.edges as Edge[] }))
  return new CodeGenerator(parse(position(diagram.nodes), diagram.edges as Edge[], routines ? { subroutines: routines } : undefined)).generate()
}

/** Runs the generated JavaScript with the dialogs answered from `inputs`. */
function runGenerated(diagram: RawDiagram, inputs: string[]): string[] {
  const queue = [...inputs]
  const printed: string[] = []
  const prompt = () => queue.shift() ?? ""
  const confirm = () => parseLogical(queue.shift() ?? "") ?? false
  const console = { log: (...values: unknown[]) => printed.push(values.map(String).join(" ")) }
  // Every loop condition goes through a counter, so wrongly generated code
  // that never stops fails the test instead of hanging it.
  let turns = 0
  const tick = () => {
    if (++turns > 10000) throw new Error("O código gerado não termina")
    return true
  }
  const guarded = generatedCode(diagram)
    .replace(/\bwhile \((.*)\) \{$/gm, "while (tick() && ($1)) {")
    .replace(/^(\s*)\} while \((.*)\);$/gm, "$1} while (tick() && ($2));")
  new Function("prompt", "confirm", "console", "tick", guarded)(prompt, confirm, console, tick)
  return printed
}

const CASES: Array<[string, () => RawDiagram, string[][]]> = [
  ["soma de inteiros", () => program([["inteiro", "a, b, s"]], [input("a, b"), proc("s = a + b"), out("'Soma: ' + s")]), [["2", "3"], ["-4", "10"]]],
  ["par ou ímpar", () => program([["inteiro", "n"]], [input("n"), ifElse("n % 2 == 0", [out("'par'")], [out("'ímpar'")])]), [["4"], ["7"]]],
  ["maior de três", () => program([["inteiro", "a, b, c, m"]], [input("a, b, c"), proc("m = a"), ifElse("b > m", [proc("m = b")]), ifElse("c > m", [proc("m = c")]), out("m")]), [["3", "7", "5"], ["9", "1", "2"], ["1", "2", "8"]]],
  ["fatorial com enquanto", () => program([["inteiro", "n, f, i"]], [input("n"), proc("f = 1; i = 1"), whileLoop("i <= n", [proc("f = f * i; i = i + 1")]), out("f")]), [["5"], ["0"]]],
  ["soma até zero com faça-enquanto", () => program([["inteiro", "v"], ["inteiro", "s", "0"]], [doWhile([input("v"), proc("s = s + v")], "v != 0"), out("s")]), [["5", "3", "0"], ["0"]]],
  ["divisores", () => program([["inteiro", "n, d"]], [input("n"), proc("d = 1"), whileLoop("d <= n", [ifElse("n % d == 0", [out("d")]), proc("d = d + 1")])]), [["12"]]],
  ["MDC", () => program([["inteiro", "a, b, r"]], [input("a, b"), whileLoop("b != 0", [proc("r = a % b; a = b; b = r")]), out("a")]), [["48", "18"]]],
  ["laços aninhados", () => program([["inteiro", "i, j"]], [proc("i = 1"), whileLoop("i <= 2", [proc("j = 1"), whileLoop("j <= 2", [out("i * 10 + j"), proc("j = j + 1")]), proc("i = i + 1")])]), [[]]],
  ["textos", () => program([["caractere", "nome"]], [input("nome"), ifElse("nome == 'Ana'", [out("'Oi, ' + nome + '!'")], [out("'Quem é ' + nome + '?'")])]), [["Ana"], ["Bia"]]],
  ["média real exata", () => program([["real", "a, b, m"]], [input("a, b"), proc("m = (a + b) / 2"), out("m")]), [["7.5", "8"], ["8", "6"]]],
  ["sub-rotina", () => program([["inteiro", "n, r"]], [input("n"), call("r = dobro(n)"), out("r")], [routine("dobro", ["v"], "x", [["inteiro", "x"]], [proc("x = v * 2")])]), [["21"]]],
  ["vetor", () => program([["inteiro", "v[3], i, s"]], [proc("i = 0; s = 0"), whileLoop("i < 3", [input("v[i]"), proc("s = s + v[i]; i = i + 1")]), out("s")]), [["1", "2", "3"]]],
]

// Known differences in how values are printed: JavaScript shows true/false
// and full float digits, the desk check shows verdadeiro/falso and 15 digits.
// Closing them means the generated code carries a formatting helper; until
// that is decided these stay red on purpose (it.fails), and the day they
// pass, the test fails to say they can move up to CASES.
const KNOWN_DIFFERENCES: typeof CASES = [
  ["lógico exibido", () => program([["inteiro", "n"], ["logico", "par"]], [input("n"), proc("par = n % 2 == 0"), out("par")]), [["4"], ["7"]]],
  ["lógico em texto", () => program([["logico", "ok"]], [input("ok"), out("'ok: ' + ok")]), [["v"], ["f"]]],
  ["conta com reais exibida", () => program([["real", "x"]], [proc("x = 0.1 + 0.2"), out("x")]), [[]]],
  ["dízima exibida", () => program([["real", "x"]], [proc("x = 1 / 3"), out("x")]), [[]]],
]

function expectSameOutputs(build: () => RawDiagram, scenarios: string[][]) {
  const diagram = build()
  for (const inputs of scenarios) {
    expect(runGenerated(diagram, inputs), `entradas: ${inputs.join(", ")}`).toEqual(runToEnd(diagram, inputs).outputs)
  }
}

describe("código gerado × depurador", () => {
  it.each(CASES)("%s imprime o mesmo nos dois", (_name, build, scenarios) => {
    expectSameOutputs(build, scenarios)
  })

  it.fails.each(KNOWN_DIFFERENCES)("%s ainda imprime diferente (divergência conhecida)", (_name, build, scenarios) => {
    expectSameOutputs(build, scenarios)
  })
})
