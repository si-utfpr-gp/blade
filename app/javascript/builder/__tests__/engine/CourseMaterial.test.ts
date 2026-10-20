import { describe, it, expect } from "vitest"
import { DIAGRAM_EXAMPLES } from "../../interfaces/diagramExamples"
import { runToEnd, type RawDiagram } from "./runDiagram"

/*
 * The escolha/caso examples from the course material, checked against the
 * desk checks printed in it: the same rows, in the same order, and the same
 * output.
 */

const example = (id: string) => DIAGRAM_EXAMPLES.find((item) => item.id === id)!.diagram as RawDiagram
const rows = (run: ReturnType<typeof runToEnd>) =>
  run.steps.map((step) => (step.nodeType === "branch" ? step.log : step.nodeType))

describe("material — números por extenso", () => {
  it("teste de mesa para o número 0", () => {
    const run = runToEnd(example("numeros-por-extenso"), ["0"])

    expect(rows(run)).toEqual(["startEnd", "memory", "input", "selection", "Caso 0.", "output", "connector", "startEnd"])
    expect(run.outputs).toEqual(["Zero"])
  })

  it.each([["1", "Um"], ["2", "Dois"], ["3", "Três"], ["4", "Quatro"], ["5", "Cinco"], ["6", "Seis"]])(
    "%s por extenso é %s",
    (numero, extenso) => {
      expect(runToEnd(example("numeros-por-extenso"), [numero]).outputs).toEqual([extenso])
    },
  )

  it("teste de mesa para o número 10 segue o caso Falso", () => {
    const run = runToEnd(example("numeros-por-extenso"), ["10"])

    expect(rows(run)).toContain("Caso Falso.")
    expect(run.outputs).toEqual(["Número inválido!"])
  })
})

describe("material — calculadora", () => {
  const menu = "Escolha a operação: + para somar, - para subtrair, * para multiplicar, / para dividir. Depois digite dois valores."

  it("teste de mesa para *, 5 e 3", () => {
    const run = runToEnd(example("calculadora"), ["*", "5", "3"])

    expect(run.outputs).toEqual([menu, "5 * 3 = 15"])
    expect(run.variables).toMatchObject({ op: "*", a: "5", b: "3", r: "15" })
  })

  it.each([["+", "7 + 2 = 9"], ["-", "7 - 2 = 5"], ["/", "7 / 2 = 3.5"]])("operador %s", (op, result) => {
    expect(runToEnd(example("calculadora"), [op, "7", "2"]).outputs).toEqual([menu, result])
  })

  it("não divide por zero", () => {
    expect(runToEnd(example("calculadora"), ["/", "7", "0"]).outputs).toEqual([menu, "Divisão por zero!"])
  })

  it("qualquer outro caractere é um operador inválido", () => {
    expect(runToEnd(example("calculadora"), ["%", "7", "2"]).outputs).toEqual([menu, "Operador inválido!"])
  })
})
