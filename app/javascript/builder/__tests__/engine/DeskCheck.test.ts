import { describe, it, expect } from "vitest"
import { engineFor, runDiagram, runToEnd, type DiagramRun, type RawDiagram } from "./runDiagram"
import {
  call,
  choose,
  doWhile,
  expectError,
  ifElse,
  input,
  out,
  proc,
  program,
  routine,
  whileLoop,
} from "./diagramBuilder"
import { traceCellDisplay } from "../../components/simulator/SimulatorTrace"
import { displayStepNumber } from "../../components/simulator/tracePresentation"
import type { ExecutionEngine } from "../../engine/ExecutionEngine"
import type { IExecutionStep } from "../../interfaces/execution"

/*
 * Use cases of the desk check (teste de mesa): what each step shows for
 * logical values, texts, factor problems, loops, stepping back and errors.
 */

/** The values a variable's column shows, in order, skipping the steps that leave it blank. */
function column(run: Pick<DiagramRun, "steps">, name: string): string[] {
  return run.steps.flatMap((step) => {
    const cell = traceCellDisplay(step, name)
    return cell === null ? [] : [cell]
  })
}

/** Steps the engine forward, feeding inputs, until it finishes or stops. */
function drive(engine: ExecutionEngine, inputs: string[] = [], last: IExecutionStep | null = null): void {
  const queue = [...inputs]
  for (let guard = 0; guard < 5000 && !engine.getCurrentState().finished; guard++) {
    last = last?.waitingForInput ? engine.step(queue.shift()) : engine.step()
    if (!last) break
  }
}

/** Index of the n-th step (1-based) taken on a given block. */
function stepIndexOf(engine: ExecutionEngine, predicate: (step: IExecutionStep) => boolean, occurrence = 1): number {
  let seen = 0
  return engine.getSteps().findIndex((step) => predicate(step) && ++seen === occurrence)
}

function withoutEdges(diagram: RawDiagram, drop: (source: string, handle?: string) => boolean): RawDiagram {
  return { ...diagram, edges: diagram.edges.filter((edge) => !drop(edge.source, edge.sourceHandle)) }
}

const nodeId = (diagram: RawDiagram, type: string, label?: string) =>
  diagram.nodes.find((node) => node.type === type && (label === undefined || node.data?.label === label))!.id

describe("teste de mesa — lógicos", () => {
  it.each([["v", "verdadeiro"], ["verdadeiro", "verdadeiro"], ["F", "falso"], ["falso.", "falso"]])("entrada lógica '%s' fica %s na coluna", (typed, shown) => {
    const run = runToEnd(program([["logico", "ok"]], [input("ok"), out("ok")]), [typed])
    expect(column(run, "ok")).toEqual(["null", shown])
    expect(run.outputs).toEqual([shown])
  })

  it("entrada lógica inválida", () => {
    expectError(program([["logico", "ok"]], [input("ok")]), ["talvez"], "TYPE_MISMATCH", "Valor inválido para lógico: 'talvez' (esperado: verdadeiro/falso)")
  })

  it("guarda o resultado de uma comparação e usa a variável como condição", () => {
    const diagram = program([["real", "media"], ["logico", "aprovado"]], [
      input("media"),
      proc("aprovado = media >= 7"),
      ifElse("aprovado", [out("'Aprovado'")], [out("'Reprovado'")]),
    ])
    const run = runToEnd(diagram, ["8.5"])
    expect(column(run, "aprovado")).toEqual(["null", "verdadeiro"])
    expect(run.outputs).toEqual(["Aprovado"])
    expect(runToEnd(diagram, ["6.5"]).variables.aprovado).toBe("falso")
  })

  it.each([
    ["verdadeiro", "verdadeiro", ["verdadeiro", "verdadeiro", "falso"]],
    ["verdadeiro", "falso", ["falso", "verdadeiro", "falso"]],
    ["falso", "verdadeiro", ["falso", "verdadeiro", "verdadeiro"]],
    ["falso", "falso", ["falso", "falso", "verdadeiro"]],
  ])("tabela-verdade com a = %s e b = %s", (a, b, expected) => {
    const diagram = program([["logico", "a, b, x, y, z"]], [input("a, b"), proc("x = a e b; y = a ou b; z = nao a"), out("x"), out("y"), out("z")])
    expect(runToEnd(diagram, [a, b]).outputs).toEqual(expected)
  })

  it("o e para na primeira parte falsa e evita a divisão por zero", () => {
    const diagram = program([["inteiro", "x"]], [input("x"), ifElse("x != 0 e 10 / x > 1", [out("'grande'")], [out("'não'")])])
    expect(runToEnd(diagram, ["0"]).outputs).toEqual(["não"])
    expect(runToEnd(diagram, ["2"]).outputs).toEqual(["grande"])
  })

  it("lógico não aceita número", () => {
    expectError(program([["logico", "ok"]], [proc("ok = 1")]), [], "TYPE_MISMATCH", "Tipo incompatível: 'ok' é lógico e não aceita o valor 1")
  })

  it("conta com lógico não é permitida", () => {
    expectError(program([["logico", "ok", "verdadeiro"], ["inteiro", "x"]], [proc("x = ok + 1")]), [], "TYPE_MISMATCH", "Tipo incompatível: valor numérico esperado, recebido 'verdadeiro'")
  })

  it("e com operando que não é lógico", () => {
    expectError(program([["inteiro", "x", "1"]], [ifElse("x e verdadeiro", [out("'?'")])]), [], "TYPE_MISMATCH", "Tipo incompatível: valor lógico esperado, recebido '1'")
  })
})

describe("teste de mesa — textos (caractere)", () => {
  it("concatena número real e lógico em texto", () => {
    const diagram = program([["real", "nota", "7.5"], ["logico", "ok", "verdadeiro"]], [out("'Nota: ' + nota + ' aprovado: ' + ok")])
    expect(runToEnd(diagram).outputs).toEqual(["Nota: 7.5 aprovado: verdadeiro"])
  })

  it("a ordem da soma decide entre conta e texto", () => {
    const diagram = program([["inteiro", "x", "1"]], [out("1 + 2 + 'x'"), out("'x' + 1 + 2"), out("'x' + (1 + 2)")])
    expect(runToEnd(diagram).outputs).toEqual(["3x", "x12", "x3"])
  })

  it("texto digitado com zeros à esquerda continua texto", () => {
    const run = runToEnd(program([["caractere", "codigo"]], [input("codigo"), out("codigo + '-A'")]), ["007"])
    expect(column(run, "codigo")).toEqual(["null", "007"])
    expect(run.outputs).toEqual(["007-A"])
  })

  it("número guardado em caractere vira texto e a soma concatena", () => {
    const run = runToEnd(program([["caractere", "t"]], [proc("t = 12"), out("t + 1")]))
    expect(run.variables.t).toBe("12")
    expect(run.outputs).toEqual(["121"])
  })

  it("texto vazio é aceito na entrada", () => {
    expect(runToEnd(program([["caractere", "nome"]], [input("nome"), out("'[' + nome + ']'")]), [""]).outputs).toEqual(["[]"])
  })

  it("aspas duplas dentro de texto com aspas simples", () => {
    expect(runToEnd(program([["caractere", "t"]], [proc("t = 'ele disse \"oi\"'"), out("t")])).outputs).toEqual(['ele disse "oi"'])
  })

  it.each([["ana", "bia", "antes"], ["bia", "ana", "depois"], ["Zé", "ana", "antes"]])("ordem alfabética: %s com %s", (a, b, expected) => {
    const diagram = program([["caractere", "a, b"]], [input("a, b"), ifElse("a < b", [out("'antes'")], [out("'depois'")])])
    expect(runToEnd(diagram, [a, b]).outputs).toEqual([expected])
  })

  it("texto igual só com as mesmas letras e maiúsculas", () => {
    const diagram = program([["caractere", "senha"]], [input("senha"), ifElse("senha == 'Blade'", [out("'ok'")], [out("'negado'")])])
    expect(runToEnd(diagram, ["Blade"]).outputs).toEqual(["ok"])
    expect(runToEnd(diagram, ["blade"]).outputs).toEqual(["negado"])
  })

  it("multiplicar texto não é permitido", () => {
    expectError(program([["caractere", "t", "'ab'"], ["inteiro", "x"]], [proc("x = t * 2")]), [], "TYPE_MISMATCH", "Tipo incompatível: valor numérico esperado, recebido 'ab'")
  })

  it("inteiro não aceita texto", () => {
    expectError(program([["inteiro", "x"]], [proc("x = 'abc'")]), [], "TYPE_MISMATCH", "Tipo incompatível: 'x' é inteiro e não aceita o texto 'abc'")
  })

  it("texto não terminado", () => {
    expectError(program([["caractere", "t"]], [proc("t = 'abc")]), [], "INVALID_EXPRESSION", /texto não terminado|Expressão inválida/)
  })

  it("comparar texto com número é erro de tipo, não um falso silencioso", () => {
    const diagram = program([["caractere", "t", "'12'"]], [ifElse("t == 12", [out("'igual'")], [out("'diferente'")])])
    expectError(diagram, [], "TYPE_MISMATCH", "Tipo incompatível: não é possível comparar o texto '12' com o valor 12")
  })

  it("texto menor que número também é erro de tipo", () => {
    const diagram = program([["caractere", "t", "'12'"]], [ifElse("t < 13", [out("'menor'")])])
    expectError(diagram, [], "TYPE_MISMATCH", "Tipo incompatível: não é possível comparar o texto '12' com o valor 13")
  })

  it("lógico comparado com número é erro de tipo", () => {
    const diagram = program([["logico", "ok", "verdadeiro"]], [ifElse("ok == 1", [out("'?'")])])
    expectError(diagram, [], "TYPE_MISMATCH", "Tipo incompatível: não é possível comparar o valor lógico verdadeiro com o valor 1")
  })
})

describe("teste de mesa — fatores e fatorial", () => {
  const fatorial = () => program([["inteiro", "n, f, i"]], [
    input("n"),
    proc("f = 1; i = 1"),
    whileLoop("i <= n", [proc("f = f * i; i = i + 1")]),
    out("f"),
  ])

  it("a coluna do fatorial mostra cada produto parcial", () => {
    const run = runToEnd(fatorial(), ["5"])
    expect(column(run, "f")).toEqual(["null", "1", "1", "2", "6", "24", "120"])
    expect(column(run, "i")).toEqual(["null", "1", "2", "3", "4", "5", "6"])
  })

  it.each([["0", "1"], ["1", "1"], ["10", "3628800"], ["20", "2432902008176640000"]])("fatorial de %s", (n, expected) => {
    expect(runToEnd(fatorial(), [n]).outputs).toEqual([expected])
  })

  it("lista os divisores", () => {
    const diagram = program([["inteiro", "n, d"]], [input("n"), proc("d = 1"), whileLoop("d <= n", [ifElse("n % d == 0", [out("d")]), proc("d = d + 1")])])
    expect(runToEnd(diagram, ["12"]).outputs).toEqual(["1", "2", "3", "4", "6", "12"])
    expect(runToEnd(diagram, ["7"]).outputs).toEqual(["1", "7"])
  })

  it.each([["2", "primo"], ["7", "primo"], ["97", "primo"], ["1", "não primo"], ["9", "não primo"], ["91", "não primo"]])("%s é %s", (n, expected) => {
    const diagram = program([["inteiro", "n, d"], ["logico", "primo"]], [
      input("n"),
      proc("primo = n > 1; d = 2"),
      whileLoop("d * d <= n e primo", [ifElse("n % d == 0", [proc("primo = falso")]), proc("d = d + 1")]),
      ifElse("primo", [out("'primo'")], [out("'não primo'")]),
    ])
    expect(runToEnd(diagram, [n]).outputs).toEqual([expected])
  })

  it("fatora em primos", () => {
    const diagram = program([["inteiro", "n, d"]], [
      input("n"),
      proc("d = 2"),
      whileLoop("n > 1", [ifElse("n % d == 0", [out("d"), proc("n = n / d")], [proc("d = d + 1")])]),
    ])
    expect(runToEnd(diagram, ["60"]).outputs).toEqual(["2", "2", "3", "5"])
    expect(runToEnd(diagram, ["97"]).outputs).toEqual(["97"])
  })

  it("MDC pelo algoritmo de Euclides, com a coluna de cada troca", () => {
    const diagram = program([["inteiro", "a, b, r"]], [input("a, b"), whileLoop("b != 0", [proc("r = a % b; a = b; b = r")]), out("a")])
    const run = runToEnd(diagram, ["48", "18"])
    expect(run.outputs).toEqual(["6"])
    expect(column(run, "b")).toEqual(["null", "18", "12", "6", "0"])
  })

  it("fatorial em sub-rotina devolve o mesmo valor", () => {
    const sub = routine("fat", ["n"], "f", [["inteiro", "f, i"]], [proc("f = 1; i = 2"), whileLoop("i <= n", [proc("f = f * i; i = i + 1")])])
    expect(runToEnd(program([["inteiro", "n, r"]], [input("n"), call("r = fat(n)"), out("r")], [sub]), ["6"]).outputs).toEqual(["720"])
  })
})

describe("teste de mesa — laços", () => {
  it("passa pela decisão uma vez a mais que o número de voltas", () => {
    const run = runToEnd(program([["inteiro", "i", "0"]], [whileLoop("i < 3", [proc("i = i + 1")])]))
    expect(run.steps.filter((step) => step.nodeType === "decision")).toHaveLength(4)
    expect(run.steps.filter((step) => step.nodeType === "branch").map((step) => step.log)).toEqual([
      "Caso Verdadeiro.", "Caso Verdadeiro.", "Caso Verdadeiro.", "Caso Falso.",
    ])
  })

  it("enquanto e faça-enquanto divergem quando a condição começa falsa", () => {
    const enquanto = program([["inteiro", "x", "10"]], [whileLoop("x < 5", [proc("x = x + 1")]), out("x")])
    const faca = program([["inteiro", "x", "10"]], [doWhile([proc("x = x + 1")], "x < 5"), out("x")])
    expect(runToEnd(enquanto).outputs).toEqual(["10"])
    expect(runToEnd(faca).outputs).toEqual(["11"])
  })

  it("contador real com passo 0.5", () => {
    const diagram = program([["real", "i", "0"]], [whileLoop("i <= 2", [out("i"), proc("i = i + 0.5")])])
    expect(runToEnd(diagram).outputs).toEqual(["0", "0.5", "1", "1.5", "2"])
  })

  it("contador real com passo 0.1 não perde a última volta", () => {
    const diagram = program([["real", "i", "0"], ["inteiro", "voltas", "0"]], [whileLoop("i <= 1", [proc("i = i + 0.1; voltas = voltas + 1")]), out("voltas")])
    expect(runToEnd(diagram).outputs).toEqual(["11"])
  })

  it("laço decrescente com negativos", () => {
    const diagram = program([["real", "t", "1"]], [whileLoop("t > -1", [out("t"), proc("t = t - 0.75")])])
    expect(runToEnd(diagram).outputs).toEqual(["1", "0.25", "-0.5"])
  })

  it("lê até o sentinela e a coluna mostra cada leitura", () => {
    const diagram = program([["inteiro", "v"], ["inteiro", "s", "0"]], [input("v"), whileLoop("v != -1", [proc("s = s + v"), input("v")]), out("s")])
    const run = runToEnd(diagram, ["4", "5", "6", "-1"])
    expect(run.outputs).toEqual(["15"])
    expect(column(run, "v")).toEqual(["null", "4", "5", "6", "-1"])
    expect(column(run, "s")).toEqual(["0", "4", "9", "15"])
  })

  it("laços aninhados montam a tabuada com a coluna do contador interno", () => {
    const diagram = program([["inteiro", "i, j"]], [
      proc("i = 1"),
      whileLoop("i <= 2", [proc("j = 1"), whileLoop("j <= 3", [out("i + ' x ' + j + ' = ' + i * j"), proc("j = j + 1")]), proc("i = i + 1")]),
    ])
    const run = runToEnd(diagram)
    expect(run.outputs).toEqual(["1 x 1 = 1", "1 x 2 = 2", "1 x 3 = 3", "2 x 1 = 2", "2 x 2 = 4", "2 x 3 = 6"])
    expect(column(run, "j")).toEqual(["null", "1", "2", "3", "4", "1", "2", "3", "4"])
  })

  it("numera os ramos como subpassos da decisão", () => {
    const run = runToEnd(program([["inteiro", "i", "0"]], [whileLoop("i < 1", [proc("i = i + 1")])]))
    const numbers = run.steps.map((_, index) => displayStepNumber(run.steps, index))
    const decisions = run.steps.flatMap((step, index) => (step.nodeType === "branch" ? [numbers[index]] : []))
    // 1 início, 2 memória, 3 conector, 4 decisão, 5 processo, 6 conector, 7 decisão
    expect(decisions).toEqual(["4.1", "7.1"])
  })
})

describe("teste de mesa — retrocesso", () => {
  const somaAte = () => program([["inteiro", "n, i, s"]], [input("n"), proc("s = 0; i = 1"), whileLoop("i <= n", [proc("s = s + i; i = i + 1")]), out("s")])
  const parOuImpar = () => program([["inteiro", "n"]], [input("n"), ifElse("n % 2 == 0", [out("'par'")], [out("'ímpar'")])])

  it("voltar no meio do laço restaura as variáveis e repete os mesmos passos", () => {
    const engine = engineFor(somaAte())
    drive(engine, ["4"], engine.start())
    const original = engine.getSteps().map((step) => step.log)
    const secondTurn = stepIndexOf(engine, (step) => step.nodeType === "process" && step.log.startsWith("s = s + i"), 2)

    expect(engine.goToStep(secondTurn)).toBe(true)
    const variables = Object.fromEntries(engine.getCurrentState().variables)
    expect(variables.s.value).toBe("3")
    expect(variables.i.value).toBe("3")
    expect(engine.getCurrentState().finished).toBe(false)

    drive(engine)
    expect(engine.getSteps().map((step) => step.log)).toEqual(original)
    expect(engine.getCurrentOutputs()).toEqual(["10"])
  })

  it("voltar depois do fim retoma a execução", () => {
    const engine = engineFor(somaAte())
    drive(engine, ["3"], engine.start())
    expect(engine.getCurrentState().finished).toBe(true)

    expect(engine.goToStep(2)).toBe(true)
    expect(engine.getCurrentState().finished).toBe(false)
    drive(engine)
    expect(engine.getCurrentState().finished).toBe(true)
    expect(engine.getCurrentOutputs()).toEqual(["6"])
  })

  it("voltar para a entrada e digitar outro valor troca o caminho e descarta os passos antigos", () => {
    const engine = engineFor(parOuImpar())
    drive(engine, ["4"], engine.start())
    expect(engine.getCurrentOutputs()).toEqual(["par"])
    const before = engine.getSteps().length

    const memory = stepIndexOf(engine, (step) => step.nodeType === "memory")
    expect(engine.goToStep(memory)).toBe(true)
    const prompt = engine.step()
    expect(prompt?.waitingForInput).toBe(true)
    drive(engine, ["7"], prompt)

    expect(engine.getCurrentOutputs()).toEqual(["ímpar"])
    expect(engine.getSteps()).toHaveLength(before)
    expect(engine.getSteps().filter((step) => step.output !== undefined).map((step) => step.output)).toEqual(["ímpar"])
  })

  it("as saídas voltam junto com o passo", () => {
    const engine = engineFor(program([["inteiro", "i", "1"]], [whileLoop("i <= 3", [out("i"), proc("i = i + 1")])]))
    drive(engine, [], engine.start())
    expect(engine.getCurrentOutputs()).toEqual(["1", "2", "3"])

    engine.goToStep(stepIndexOf(engine, (step) => step.output === "2"))
    expect(engine.getCurrentOutputs()).toEqual(["1", "2"])
  })

  it("voltar para dentro da sub-rotina restaura a pilha de chamadas e a memória local", () => {
    const dobro = routine("dobro", ["v"], "r", [["real", "r"]], [proc("r = v * 2")])
    const engine = engineFor(program([["inteiro", "n, x"]], [input("n"), call("x = dobro(n)"), out("x")], [dobro]))
    drive(engine, ["5"], engine.start())

    const inside = stepIndexOf(engine, (step) => step.log === "r = v * 2")
    expect(engine.goToStep(inside)).toBe(true)
    expect(engine.getCurrentState().callStack?.map((frame) => frame.routineName)).toEqual(["Principal", "dobro"])
    expect(engine.getSteps()[inside].variables.find((variable) => variable.name === "r")?.value).toBe("10")

    drive(engine)
    expect(engine.getCurrentOutputs()).toEqual(["10"])
    expect(engine.getCurrentState().callStack?.map((frame) => frame.routineName)).toEqual(["Principal"])
  })

  it("voltar para a escolha mostra de novo o ramo escolhido", () => {
    const engine = engineFor(program([["inteiro", "op"]], [input("op"), choose("op", [["1", [out("'um'")]], ["2", [out("'dois'")]]])]))
    drive(engine, ["2"], engine.start())

    engine.goToStep(stepIndexOf(engine, (step) => step.nodeType === "selection"))
    expect(engine.step()?.log).toBe("Caso 2.")
    drive(engine)
    expect(engine.getCurrentOutputs()).toEqual(["dois"])
  })

  it("passo que não existe não muda nada", () => {
    const engine = engineFor(parOuImpar())
    drive(engine, ["4"], engine.start())
    expect(engine.goToStep(999)).toBe(false)
    expect(engine.getCurrentState().finished).toBe(true)
  })
})

describe("teste de mesa — processo de erros", () => {
  it("o erro aponta o bloco, guarda os passos anteriores e não finaliza", () => {
    const diagram = program([["real", "a, b, q"]], [input("a, b"), proc("q = a / b"), out("q")])
    const run = runDiagram(diagram, ["5", "0"])
    expect(run.error).toMatchObject({ type: "DIVISION_BY_ZERO", blockId: nodeId(diagram, "process") })
    expect(run.finished).toBe(false)
    expect(run.steps.map((step) => step.nodeType)).toEqual(["startEnd", "memory", "input", "input"])
    expect(column(run, "b")).toEqual(["null", "0"])
  })

  it("avançar de novo repete o erro em vez de pular o bloco", () => {
    const engine = engineFor(program([["inteiro", "a"]], [proc("a = a + 1"), out("'depois'")]))
    engine.start()
    engine.step()
    expect(() => engine.step()).toThrow("Variável 'a' não inicializada")
    expect(() => engine.step()).toThrow("Variável 'a' não inicializada")
    expect(engine.getCurrentOutputs()).toEqual([])
  })

  it("voltar antes da entrada errada e digitar um valor válido conclui", () => {
    const engine = engineFor(program([["real", "a, b, q"]], [input("a, b"), proc("q = a / b"), out("q")]))
    engine.start()
    expect(() => drive(engine, ["5", "0"], engine.step())).toThrow("Divisão por zero detectada")
    expect(engine.getCurrentState().error).toBe("Divisão por zero detectada")

    expect(engine.goToStep(stepIndexOf(engine, (step) => step.nodeType === "memory"))).toBe(true)
    expect(engine.getCurrentState().error).toBeNull()
    drive(engine, ["5", "2"], engine.step())
    expect(engine.getCurrentOutputs()).toEqual(["2.5"])
  })

  it("atribuir a algo que não é variável aponta o destino, não o valor", () => {
    expectError(program([["inteiro", "x"]], [proc("1 = x")]), [], "INVALID_EXPRESSION", "Expressão inválida: destino de atribuição inválido: 1")
  })

  it.each([
    ["x = = 1", "INVALID_EXPRESSION"],
    ["x = 2 +", "INVALID_EXPRESSION"],
    ["x = (1 + 2", "INVALID_EXPRESSION"],
    ["x = y", "UNDECLARED_VARIABLE"],
  ])("processo '%s' gera %s", (label, type) => {
    expectError(program([["inteiro", "x"]], [proc(label)]), [], type, /./)
  })

  it("saída vazia é expressão inválida", () => {
    expectError(program([["inteiro", "x"]], [out("")]), [], "INVALID_EXPRESSION", /Expressão inválida/)
  })

  it("um bloco sem seta de saída para com erro em vez de travar", () => {
    const diagram = program([["inteiro", "x"]], [proc("x = 1"), out("x")])
    const broken = withoutEdges(diagram, (source) => source === nodeId(diagram, "process"))
    const run = expectError(broken, [], "MISSING_CONNECTION", "O bloco 'x = 1' não tem ligação de saída")
    expect(run.error?.blockId).toBe(nodeId(diagram, "process"))
  })

  it("decisão sem o ramo que a condição escolheu para com erro", () => {
    const diagram = program([["inteiro", "x", "1"]], [ifElse("x > 5", [out("'grande'")], [out("'pequeno'")])])
    const decision = nodeId(diagram, "decision")
    const broken = withoutEdges(diagram, (source, handle) => source === decision && handle === "no")
    const run = expectError(broken, [], "MISSING_CONNECTION", "Decisão 'x > 5': caso Falso sem ligação")
    expect(run.error?.blockId).toBe(decision)
    expect(runToEnd({ ...broken, nodes: broken.nodes.map((node) => node.id === nodeId(diagram, "memory") ? { ...node, data: { ...node.data, rows: [{ type: "inteiro", variables: "x", initialValue: "9" }] } } : node) }).outputs).toEqual(["grande"])
  })

  it("conector sem saída para com erro", () => {
    const diagram = program([["inteiro", "x", "1"]], [ifElse("x > 0", [out("'a'")], [out("'b'")]), out("'fim'")])
    const broken = withoutEdges(diagram, (source) => source === nodeId(diagram, "connector"))
    expectError(broken, [], "MISSING_CONNECTION", "O bloco 'Fim do se' não tem ligação de saída")
  })

  it("escolha com caso sem seta usa o mesmo erro de ligação", () => {
    const diagram = program([["inteiro", "x", "2"]], [choose("x", [["1", [out("'um'")]], ["2", [out("'dois'")]]])])
    const selection = nodeId(diagram, "selection")
    const broken = withoutEdges(diagram, (source, handle) => source === selection && handle === "case-1")
    expectError(broken, [], "MISSING_CONNECTION", "Escolha: caso '2' sem ligação")
  })

  it("sub-rotina sem seta de saída também para com erro", () => {
    const sub = routine("s", ["v"], "r", [["inteiro", "r"]], [proc("r = v")])
    const broken = { ...sub, edges: sub.edges.filter((edge) => edge.source !== sub.nodes.find((node) => node.type === "process")!.id) }
    const diagram = program([["inteiro", "x"]], [call("x = s(1)")], [broken])
    expectError(diagram, [], "MISSING_CONNECTION", "O bloco 'r = v' não tem ligação de saída")
  })

  it("chamada de sub-rotina sem seta de saída para com erro antes de entrar nela", () => {
    const sub = routine("s", ["v"], "r", [["inteiro", "r"]], [proc("r = v")])
    const diagram = program([["inteiro", "x"]], [call("x = s(1)"), out("x")], [sub])
    const caller = nodeId(diagram, "subroutine")
    const run = expectError(withoutEdges(diagram, (source) => source === caller), [], "MISSING_CONNECTION", "O bloco 'x = s(1)' não tem ligação de saída")
    expect(run.error?.blockId).toBe(caller)
  })
})
