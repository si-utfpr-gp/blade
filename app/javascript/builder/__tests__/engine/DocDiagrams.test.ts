import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { DIAGRAM_EXAMPLES } from "../../interfaces/diagramExamples"
import { constructorIssues, runToEnd, type RawDiagram } from "./runDiagram"

// docs/diagramas-json.md is what students and testers copy into the JSON
// harness, so each of its diagrams has to be the same one the constructor
// offers as an example, buildable by hand and producing what the text promises.
const DOC = readFileSync(resolve(process.cwd(), "docs/diagramas-json.md"), "utf8")

interface DocSection {
  number: number
  title: string
  diagram: RawDiagram
}

function docSections(): DocSection[] {
  const heads = [...DOC.matchAll(/^# (\d+)\. (.+)$/gm)]
  return heads.map((head, index) => {
    const end = heads[index + 1]?.index ?? DOC.indexOf("# Checklist")
    const body = DOC.slice(head.index, end)
    const json = body.match(/```json\n([\s\S]*?)\n```/)
    if (!json) throw new Error(`Seção ${head[1]} sem bloco json`)
    return { number: Number(head[1]), title: head[2], diagram: JSON.parse(json[1]) as RawDiagram }
  })
}

// Scenarios per section: inputs typed in the dialog → outputs expected.
const SCENARIOS: Record<number, Array<[string[], string[]]>> = {
  1: [[["10", "20"], ["A soma é: 30"]], [["-4", "4"], ["A soma é: 0"]]],
  2: [[["8", "6"], ["7"]], [["7.5", "8"], ["7.75"]], [["9.9", "0.1"], ["5"]]],
  3: [[["4"], ["O número é PAR"]], [["7"], ["O número é ÍMPAR"]], [["0"], ["O número é PAR"]], [["-3"], ["O número é ÍMPAR"]]],
  4: [[["7.5"], ["NOTA VÁLIDA"]], [["10"], ["NOTA VÁLIDA"]], [["0"], ["NOTA VÁLIDA"]], [["10.5"], ["NOTA INVÁLIDA"]], [["-0.5"], ["NOTA INVÁLIDA"]]],
  5: [[["3", "7", "5"], ["O maior é: 7"]], [["9", "2", "4"], ["O maior é: 9"]], [["1", "2", "8"], ["O maior é: 8"]], [["5", "5", "5"], ["O maior é: 5"]]],
  6: [[["1"], ["Novo jogo"]], [["2"], ["Carregar jogo"]], [["3"], ["Sair"]], [["7"], ["Opção inválida"]]],
  7: [[["A"], ["Acima de 9"]], [["B"], ["Entre 7 e 9"]], [["C"], ["Entre 5 e 7"]], [["Z"], ["Conceito inválido"]], [["a"], ["Conceito inválido"]]],
  8: [[["0"], ["Zero"]], [["6"], ["Seis"]], [["10"], ["Número inválido!"]]],
  9: [[["*", "5", "3"], ["Escolha a operação: + para somar, - para subtrair, * para multiplicar, / para dividir. Depois digite dois valores.", "5 * 3 = 15"]], [["/", "7", "0"], ["Escolha a operação: + para somar, - para subtrair, * para multiplicar, / para dividir. Depois digite dois valores.", "Divisão por zero!"]], [["%", "1", "1"], ["Escolha a operação: + para somar, - para subtrair, * para multiplicar, / para dividir. Depois digite dois valores.", "Operador inválido!"]]],
  10: [[["5"], ["O fatorial de 5 é 120"]], [["0"], ["O fatorial de 0 é 1"]], [["1"], ["O fatorial de 1 é 1"]]],
  11: [[["5", "3", "0"], ["A soma é: 8"]], [["2", "7", "14", "0"], ["A soma é: 23"]], [["0"], ["A soma é: 0"]]],
  12: [[["3", "10", "20", "30"], ["A média é: 20"]], [["4", "7.5", "8", "6.5", "9"], ["A média é: 7.75"]], [["3", "1", "1", "2"], ["A média é: 1.33333333333333"]]],
  13: [[["3", "10", "20", "30"], ["A média das notas é: 20"]], [["2", "8.5", "7"], ["A média das notas é: 7.75"]]],
  14: [[["5"], ["Fatorial: 120"]], [["0"], ["Fatorial: 1"]]],
}

const sections = docSections()

describe("docs/diagramas-json.md", () => {
  it("tem um diagrama para cada exemplo do construtor, na mesma ordem", () => {
    expect(sections.map((section) => section.number)).toEqual(DIAGRAM_EXAMPLES.map((_, index) => index + 1))
  })

  it.each(sections)("seção $number ($title) é o mesmo JSON do exemplo do construtor", (section) => {
    expect(section.diagram).toEqual(DIAGRAM_EXAMPLES[section.number - 1].diagram)
  })

  it.each(sections)("seção $number ($title) pode ser desenhada no construtor", (section) => {
    expect(constructorIssues(section.diagram)).toEqual([])
  })

  it.each(sections)("seção $number ($title) dá as saídas esperadas", (section) => {
    const scenarios = SCENARIOS[section.number]
    expect(scenarios, `faltam cenários para a seção ${section.number}`).toBeDefined()
    for (const [inputs, outputs] of scenarios) {
      expect(runToEnd(section.diagram, inputs).outputs, `entradas ${inputs.join(", ")}`).toEqual(outputs)
    }
  })
})
