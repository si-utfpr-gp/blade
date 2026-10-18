import { describe, it, expect } from "vitest"
import { runToEnd } from "./runDiagram"
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

/*
 * A battery of diagrams covering every structure the debugger runs —
 * sequence, decision, while, do-while, subroutine, selection and vectors —
 * checking integer and real data the way the desk check shows them.
 */

describe("bateria — sequência e tipos (inteiro × real)", () => {
  it("soma de inteiros", () => {
    const run = runToEnd(program([["inteiro", "a, b, s"]], [input("a, b"), proc("s = a + b"), out("s")]), ["2", "3"])
    expect(run.outputs).toEqual(["5"])
    expect(run.variables).toEqual({ a: "2", b: "3", s: "5" })
  })

  it("soma de reais mantém as casas decimais", () => {
    const run = runToEnd(program([["real", "a, b, s"]], [input("a, b"), proc("s = a + b"), out("s")]), ["1.5", "2.25"])
    expect(run.outputs).toEqual(["3.75"])
    expect(run.variables.s).toBe("3.75")
  })

  it("0.1 + 0.2 aparece como 0.3, sem ruído de ponto flutuante", () => {
    const run = runToEnd(program([["real", "x"]], [proc("x = 0.1 + 0.2"), out("x")]))
    expect(run.outputs).toEqual(["0.3"])
    expect(run.variables.x).toBe("0.3")
  })

  it("1.1 * 3 aparece como 3.3", () => {
    expect(runToEnd(program([["real", "x"]], [proc("x = 1.1 * 3"), out("x")])).outputs).toEqual(["3.3"])
  })

  it("dízima é exibida com 15 algarismos significativos", () => {
    expect(runToEnd(program([["real", "x"]], [proc("x = 1 / 3"), out("x")])).outputs).toEqual(["0.333333333333333"])
  })

  it("divisão exata cabe em inteiro", () => {
    const run = runToEnd(program([["inteiro", "a, b, q"]], [input("a, b"), proc("q = a / b"), out("q")]), ["6", "2"])
    expect(run.outputs).toEqual(["3"])
  })

  it("divisão não exata não cabe em inteiro", () => {
    const diagram = program([["inteiro", "a, b, q"]], [input("a, b"), proc("q = a / b"), out("q")])
    expectError(diagram, ["7", "2"], "TYPE_MISMATCH", "Tipo incompatível: 'q' é inteiro e não aceita o valor 3.5")
  })

  it("divisão de inteiros guardada em real", () => {
    const run = runToEnd(program([["inteiro", "a, b"], ["real", "q"]], [input("a, b"), proc("q = a / b"), out("q")]), ["7", "2"])
    expect(run.outputs).toEqual(["3.5"])
  })

  it("divisão com negativo", () => {
    expect(runToEnd(program([["real", "q"]], [proc("q = -7 / 2"), out("q")])).outputs).toEqual(["-3.5"])
  })

  it("resto da divisão com inteiro e com real", () => {
    const run = runToEnd(program([["inteiro", "r"], ["real", "x"]], [proc("r = 17 % 5; x = 7.5 % 2"), out("r"), out("x")]))
    expect(run.outputs).toEqual(["2", "1.5"])
  })

  it("precedência de operadores e parênteses", () => {
    const run = runToEnd(program([["inteiro", "r, s"]], [proc("r = 2 + 3 * 4; s = (2 + 3) * 4"), out("r"), out("s")]))
    expect(run.outputs).toEqual(["14", "20"])
  })

  it("valor inicial real declarado na memória", () => {
    const run = runToEnd(program([["real", "taxa", "0.25"], ["real", "total"]], [proc("total = 80 * taxa"), out("total")]))
    expect(run.outputs).toEqual(["20"])
  })

  it("concatena número real em texto", () => {
    const run = runToEnd(program([["real", "x"]], [proc("x = 5 / 2"), out("'Total: ' + x")]))
    expect(run.outputs).toEqual(["Total: 2.5"])
  })

  it("o teste de mesa registra o valor real no passo do processo", () => {
    const run = runToEnd(program([["inteiro", "a, b"], ["real", "q"]], [input("a, b"), proc("q = a / b")]), ["7", "2"])
    const step = run.steps.find((item) => item.nodeType === "process")
    expect(step?.changes).toEqual(["q = 3.5"])
    expect(step?.variables.find((variable) => variable.name === "q")?.value).toBe("3.5")
  })

  it("entrada real aceita número sem casas e negativo com casas", () => {
    const diagram = program([["real", "x, y"]], [input("x, y"), out("x"), out("y")])
    expect(runToEnd(diagram, ["3", "-2.5"]).outputs).toEqual(["3", "-2.5"])
  })

  it("entrada inteira recusa número com casas", () => {
    const diagram = program([["inteiro", "x"]], [input("x"), out("x")])
    expectError(diagram, ["2.5"], "TYPE_MISMATCH", "Valor inválido para inteiro: '2.5'")
  })

  it("entrada real recusa vírgula decimal", () => {
    const diagram = program([["real", "x"]], [input("x"), out("x")])
    expectError(diagram, ["2,5"], "TYPE_MISMATCH", "Valor inválido para real: '2,5'")
  })

  it("divisão por zero vinda da entrada", () => {
    const diagram = program([["real", "a, b, q"]], [input("a, b"), proc("q = a / b"), out("q")])
    expectError(diagram, ["5", "0"], "DIVISION_BY_ZERO", "Divisão por zero detectada")
  })

  it("variável usada antes de receber valor", () => {
    expectError(program([["inteiro", "a, b"]], [proc("b = a + 1")]), [], "UNINITIALIZED_VARIABLE", /'a'/)
  })

  it("variável que a memória não declarou", () => {
    expectError(program([["inteiro", "a"]], [proc("c = 1")]), [], "UNDECLARED_VARIABLE", /'c'/)
  })
})

describe("bateria — decisão (se/senão)", () => {
  const parOuImpar = () =>
    program([["inteiro", "n"]], [input("n"), ifElse("n % 2 == 0", [out("'PAR'")], [out("'ÍMPAR'")])])

  it.each([["4", "PAR"], ["7", "ÍMPAR"], ["0", "PAR"], ["-3", "ÍMPAR"]])("par ou ímpar com %s", (n, expected) => {
    expect(runToEnd(parOuImpar(), [n]).outputs).toEqual([expected])
  })

  const aprovacao = () =>
    program([["real", "media"]], [input("media"), ifElse("media >= 7", [out("'Aprovado'")], [out("'Reprovado'")])])

  it.each([["6.99", "Reprovado"], ["7", "Aprovado"], ["7.0", "Aprovado"], ["9.5", "Aprovado"]])("aprovação com média real %s", (media, expected) => {
    expect(runToEnd(aprovacao(), [media]).outputs).toEqual([expected])
  })

  it("se sem senão: o ramo falso vai direto à junção", () => {
    const diagram = program([["inteiro", "x"]], [input("x"), ifElse("x > 0", [proc("x = x * 2")]), out("x")])
    expect(runToEnd(diagram, ["3"]).outputs).toEqual(["6"])
    expect(runToEnd(diagram, ["-3"]).outputs).toEqual(["-3"])
  })

  it.each([["5", "criança"], ["12", "adolescente"], ["17", "adolescente"], ["18", "adulto"]])("decisões aninhadas com idade %s", (idade, expected) => {
    const diagram = program([["inteiro", "idade"]], [
      input("idade"),
      ifElse("idade < 12", [out("'criança'")], [ifElse("idade < 18", [out("'adolescente'")], [out("'adulto'")])]),
    ])
    expect(runToEnd(diagram, [idade]).outputs).toEqual([expected])
  })

  it.each([["-1", "fora"], ["0", "dentro"], ["10", "dentro"], ["10.5", "fora"]])("condição composta com e: %s", (x, expected) => {
    const diagram = program([["real", "x"]], [input("x"), ifElse("x >= 0 e x <= 10", [out("'dentro'")], [out("'fora'")])])
    expect(runToEnd(diagram, [x]).outputs).toEqual([expected])
  })

  it("condição com ou e nao", () => {
    const diagram = program([["inteiro", "x"]], [input("x"), ifElse("nao (x > 5) ou x == 10", [out("'sim'")], [out("'não'")])])
    expect(runToEnd(diagram, ["3"]).outputs).toEqual(["sim"])
    expect(runToEnd(diagram, ["10"]).outputs).toEqual(["sim"])
    expect(runToEnd(diagram, ["7"]).outputs).toEqual(["não"])
  })

  it("real guardado na memória compara igual ao valor exibido", () => {
    const diagram = program([["real", "x"]], [proc("x = 0.1 + 0.2"), ifElse("x == 0.3", [out("'igual'")], [out("'diferente'")])])
    expect(runToEnd(diagram).outputs).toEqual(["igual"])
  })

  it("real calculado direto na condição compara igual ao guardado na memória", () => {
    const diagram = program([["real", "x"]], [ifElse("0.1 + 0.2 == 0.3", [out("'igual'")], [out("'diferente'")])])
    expect(runToEnd(diagram).outputs).toEqual(["igual"])
  })

  it.each([
    ["0.1 * 3 == 0.3", "igual"],
    ["1.1 + 2.2 == 3.3", "igual"],
    ["0.3 - 0.1 == 0.2", "igual"],
    ["0.1 + 0.2 > 0.3", "diferente"],
    ["1 / 3 * 3 == 1", "igual"],
  ])("conta com reais na condição: %s", (condition, expected) => {
    const diagram = program([["real", "x"]], [ifElse(condition, [out("'igual'")], [out("'diferente'")])])
    expect(runToEnd(diagram).outputs).toEqual([expected])
  })

  it("condição que não resulta em lógico", () => {
    const diagram = program([["inteiro", "x"]], [proc("x = 1"), ifElse("x + 1", [out("'?'")])])
    expectError(diagram, [], "TYPE_MISMATCH", "A condição 'x + 1' deve resultar em verdadeiro ou falso, mas resultou em 2")
  })
})

describe("bateria — enquanto (while)", () => {
  const somaAteN = () =>
    program([["inteiro", "n, i, s"]], [input("n"), proc("s = 0; i = 1"), whileLoop("i <= n", [proc("s = s + i; i = i + 1")]), out("s")])

  it.each([["5", "15"], ["1", "1"], ["0", "0"], ["100", "5050"]])("soma de 1 até %s", (n, expected) => {
    expect(runToEnd(somaAteN(), [n]).outputs).toEqual([expected])
  })

  it("não executa o corpo quando a condição já começa falsa", () => {
    const run = runToEnd(somaAteN(), ["0"])
    expect(run.steps.filter((step) => step.nodeType === "process")).toHaveLength(1)
  })

  it("contagem regressiva exibe cada volta", () => {
    const diagram = program([["inteiro", "i", "3"]], [whileLoop("i > 0", [out("i"), proc("i = i - 1")])])
    expect(runToEnd(diagram).outputs).toEqual(["3", "2", "1"])
  })

  it("somar 0.1 dez vezes chega a 1 em exatamente 10 voltas", () => {
    const diagram = program([["real", "x", "0"], ["inteiro", "c", "0"]], [whileLoop("x < 1", [proc("x = x + 0.1; c = c + 1")]), out("c"), out("x")])
    expect(runToEnd(diagram).outputs).toEqual(["10", "1"])
  })

  it("média de valores reais lidos no laço", () => {
    const diagram = program([["inteiro", "n, i"], ["real", "v, s, m"]], [
      input("n"),
      proc("s = 0; i = 0"),
      whileLoop("i < n", [input("v"), proc("s = s + v; i = i + 1")]),
      proc("m = s / n"),
      out("m"),
    ])
    expect(runToEnd(diagram, ["4", "7.5", "8", "6.5", "9"]).outputs).toEqual(["7.75"])
    expect(runToEnd(diagram, ["3", "1", "1", "2"]).outputs).toEqual(["1.33333333333333"])
  })

  it("variável chamada e é recusada já na memória", () => {
    const diagram = program([["inteiro", "base, e"]], [proc("base = 2")])
    expectError(diagram, [], "INVALID_VARIABLE_NAME", "Nome de variável inválido: 'e' é uma palavra reservada")
  })

  it("potência com base real", () => {
    const diagram = program([["real", "base, p"], ["inteiro", "expoente, i"]], [
      input("base, expoente"),
      proc("p = 1; i = 0"),
      whileLoop("i < expoente", [proc("p = p * base; i = i + 1")]),
      out("p"),
    ])
    expect(runToEnd(diagram, ["1.5", "3"]).outputs).toEqual(["3.375"])
    expect(runToEnd(diagram, ["2", "10"]).outputs).toEqual(["1024"])
  })

  it("laços aninhados", () => {
    const diagram = program([["inteiro", "i, j, s"]], [
      proc("s = 0; i = 1"),
      whileLoop("i <= 3", [proc("j = 1"), whileLoop("j <= 3", [proc("s = s + i * j; j = j + 1")]), proc("i = i + 1")]),
      out("s"),
    ])
    expect(runToEnd(diagram).outputs).toEqual(["36"])
  })

  it("decisão dentro do laço conta pares", () => {
    const diagram = program([["inteiro", "i, pares"]], [
      proc("i = 1; pares = 0"),
      whileLoop("i <= 10", [ifElse("i % 2 == 0", [proc("pares = pares + 1")]), proc("i = i + 1")]),
      out("pares"),
    ])
    expect(runToEnd(diagram).outputs).toEqual(["5"])
  })

  it("laço sem fim para no limite de passos", () => {
    const diagram = program([["inteiro", "i", "0"]], [whileLoop("i >= 0", [proc("i = i + 1")])])
    expectError(diagram, [], "MAX_STEPS_EXCEEDED", "Limite de passos excedido", { maxSteps: 500 })
  })
})

describe("bateria — faça-enquanto (do-while)", () => {
  it("executa o corpo uma vez mesmo com a condição falsa", () => {
    const diagram = program([["inteiro", "x", "10"]], [doWhile([proc("x = x + 1")], "x < 5"), out("x")])
    expect(runToEnd(diagram).outputs).toEqual(["11"])
  })

  it("lê até receber zero", () => {
    const diagram = program([["inteiro", "num"], ["inteiro", "s", "0"]], [doWhile([input("num"), proc("s = s + num")], "num != 0"), out("s")])
    expect(runToEnd(diagram, ["5", "3", "0"]).outputs).toEqual(["8"])
    expect(runToEnd(diagram, ["0"]).outputs).toEqual(["0"])
  })

  it("soma reais até receber um negativo", () => {
    const diagram = program([["real", "v"], ["real", "s", "0"]], [doWhile([input("v"), ifElse("v >= 0", [proc("s = s + v")])], "v >= 0"), out("s")])
    expect(runToEnd(diagram, ["2.5", "1.25", "-1"]).outputs).toEqual(["3.75"])
  })

  it("dobra até passar de 100", () => {
    const diagram = program([["inteiro", "x", "3"], ["inteiro", "voltas", "0"]], [doWhile([proc("x = x * 2; voltas = voltas + 1")], "x <= 100"), out("x"), out("voltas")])
    expect(runToEnd(diagram).outputs).toEqual(["192", "6"])
  })
})

describe("bateria — sub-rotina", () => {
  const dobro = routine("dobro", ["valor"], "retorno", [["real", "retorno"]], [proc("retorno = valor * 2")])
  const metadeReal = routine("metade", ["valor"], "retorno", [["real", "retorno"]], [proc("retorno = valor / 2")])

  it("devolve um inteiro", () => {
    const diagram = program([["inteiro", "n, r"]], [input("n"), call("r = dobro(n)"), out("r")], [dobro])
    expect(runToEnd(diagram, ["7"]).outputs).toEqual(["14"])
  })

  it("devolve um real", () => {
    const diagram = program([["inteiro", "n"], ["real", "m"]], [input("n"), call("m = metade(n)"), out("m")], [metadeReal])
    expect(runToEnd(diagram, ["7"]).outputs).toEqual(["3.5"])
  })

  it("retorno real não cabe na variável inteira de quem chamou", () => {
    const diagram = program([["inteiro", "n, m"]], [input("n"), call("m = metade(n)"), out("m")], [metadeReal])
    expectError(diagram, ["7"], "TYPE_MISMATCH", "Tipo incompatível: 'm' é inteiro e não aceita o valor 3.5")
  })

  it("retorno declarado inteiro não aceita conta com casas dentro da sub-rotina", () => {
    const metadeInteira = routine("metade", ["valor"], "retorno", [["inteiro", "retorno"]], [proc("retorno = valor / 2")])
    const diagram = program([["inteiro", "n, m"]], [input("n"), call("m = metade(n)")], [metadeInteira])
    expectError(diagram, ["7"], "TYPE_MISMATCH", "Tipo incompatível: 'retorno' é inteiro e não aceita o valor 3.5")
    expect(runToEnd(diagram, ["8"]).variables.m).toBe("4")
  })

  it("dois parâmetros reais", () => {
    const media = routine("media", ["a", "b"], "r", [["real", "r"]], [proc("r = (a + b) / 2")])
    const diagram = program([["real", "x, y, m"]], [input("x, y"), call("m = media(x, y)"), out("m")], [media])
    expect(runToEnd(diagram, ["8", "7"]).outputs).toEqual(["7.5"])
    expect(runToEnd(diagram, ["9.5", "6.25"]).outputs).toEqual(["7.875"])
  })

  it("sub-rotina com laço e decisão", () => {
    const fatorial = routine("fatorial", ["valor"], "f", [["inteiro", "f, i"]], [
      proc("f = 1; i = 2"),
      whileLoop("i <= valor", [proc("f = f * i; i = i + 1")]),
    ])
    const sinal = routine("sinal", ["valor"], "s", [["caractere", "s"]], [ifElse("valor >= 0", [proc("s = 'positivo'")], [proc("s = 'negativo'")])])
    const diagram = program([["inteiro", "n, r"], ["caractere", "t"]], [input("n"), call("r = fatorial(n)"), call("t = sinal(n)"), out("r"), out("t")], [fatorial, sinal])
    expect(runToEnd(diagram, ["5"]).outputs).toEqual(["120", "positivo"])
    expect(runToEnd(diagram, ["0"]).outputs).toEqual(["1", "positivo"])
  })

  it("variáveis locais não aparecem na memória principal", () => {
    const comLocal = routine("triplo", ["valor"], "r", [["real", "r, auxiliar"]], [proc("auxiliar = valor * 3; r = auxiliar")])
    const run = runToEnd(program([["inteiro", "n, r"]], [input("n"), call("r = triplo(n)")], [comLocal]), ["4"])
    expect(run.variables).toEqual({ n: "4", r: "12" })
  })

  it("número errado de argumentos", () => {
    const diagram = program([["inteiro", "r"]], [call("r = dobro(1, 2)")], [dobro])
    expectError(diagram, [], "SUBROUTINE_CONTRACT", "Sub-rotina 'dobro' esperava 1 argumento(s), recebeu 2")
  })

  it("sub-rotina que não existe", () => {
    const diagram = program([["inteiro", "r"]], [call("r = triplo(1)")], [dobro])
    expectError(diagram, [], "SUBROUTINE_CONTRACT", "Sub-rotina 'triplo' não encontrada")
  })

  it("retorno que a sub-rotina nunca preencheu", () => {
    const vazia = routine("vazia", ["valor"], "r", [["inteiro", "r"]], [])
    const diagram = program([["inteiro", "x"]], [call("x = vazia(1)")], [vazia])
    expectError(diagram, [], "SUBROUTINE_CONTRACT", "Retorno da sub-rotina 'vazia' não inicializado")
  })
})

describe("bateria — escolha/caso", () => {
  const menu = () =>
    program([["inteiro", "op"]], [input("op"), choose("op", [["1", [out("'um'")]], ["2", [out("'dois'")]], ["3", [out("'três'")]]], [out("'outro'")])])

  it.each([["1", "um"], ["2", "dois"], ["3", "três"], ["0", "outro"], ["-1", "outro"]])("menu com opção %s", (op, expected) => {
    expect(runToEnd(menu(), [op]).outputs).toEqual([expected])
  })

  it("casos com valores reais", () => {
    const diagram = program([["real", "x"]], [input("x"), choose("x", [["1.5", [out("'um e meio'")]], ["2.5", [out("'dois e meio'")]]], [out("'outro'")])])
    expect(runToEnd(diagram, ["2.5"]).outputs).toEqual(["dois e meio"])
    expect(runToEnd(diagram, ["2"]).outputs).toEqual(["outro"])
  })

  it("conta com reais coincide com o caso que mostra o mesmo valor", () => {
    const diagram = program([["real", "x"]], [choose("0.1 + 0.2", [["0.3", [out("'0.3'")]]], [out("'outro'")])])
    expect(runToEnd(diagram).outputs).toEqual(["0.3"])
  })

  it("casos que só diferem no ruído de ponto flutuante são repetidos", () => {
    const diagram = program([["real", "x", "1"]], [choose("x", [["0.3", [out("'a'")]], ["0.1 + 0.2", [out("'b'")]]], [out("'outro'")])])
    expectError(diagram, [], "INVALID_SELECTION", "Escolha: valor '0.1 + 0.2' repetido")
  })

  it("inteiro 2 coincide com o caso 2.0", () => {
    const diagram = program([["inteiro", "x"]], [input("x"), choose("x", [["2.0", [out("'dois'")]]], [out("'outro'")])])
    expect(runToEnd(diagram, ["2"]).outputs).toEqual(["dois"])
  })

  it("escolha sobre uma expressão", () => {
    const diagram = program([["inteiro", "n"]], [input("n"), choose("n % 3", [["0", [out("'resto 0'")]], ["1", [out("'resto 1'")]], ["2", [out("'resto 2'")]]])])
    expect(runToEnd(diagram, ["7"]).outputs).toEqual(["resto 1"])
    expect(runToEnd(diagram, ["9"]).outputs).toEqual(["resto 0"])
  })

  it("texto diferencia maiúsculas de minúsculas", () => {
    const diagram = program([["caractere", "c"]], [input("c"), choose("c", [["'A'", [out("'maiúsculo'")]]], [out("'outro'")])])
    expect(runToEnd(diagram, ["A"]).outputs).toEqual(["maiúsculo"])
    expect(runToEnd(diagram, ["a"]).outputs).toEqual(["outro"])
  })

  it("caso vazio vai direto à junção", () => {
    const diagram = program([["inteiro", "x"]], [input("x"), choose("x", [["1", []], ["2", [out("'dois'")]]], [out("'outro'")]), out("'fim'")])
    expect(runToEnd(diagram, ["1"]).outputs).toEqual(["fim"])
    expect(runToEnd(diagram, ["2"]).outputs).toEqual(["dois", "fim"])
  })

  it("escolha dentro de um laço", () => {
    const diagram = program([["inteiro", "n, i, op, saldo"]], [
      input("n"),
      proc("i = 0; saldo = 0"),
      whileLoop("i < n", [
        input("op"),
        choose("op", [["1", [proc("saldo = saldo + 10")]], ["2", [proc("saldo = saldo - 5")]]]),
        proc("i = i + 1"),
      ]),
      out("saldo"),
    ])
    expect(runToEnd(diagram, ["4", "1", "1", "2", "9"]).outputs).toEqual(["15"])
  })

  it("escolha dentro de uma sub-rotina", () => {
    const nomeDoMes = routine("mes", ["n"], "r", [["caractere", "r"]], [
      choose("n", [["1", [proc("r = 'janeiro'")]], ["2", [proc("r = 'fevereiro'")]]], [proc("r = '?'")]),
    ])
    const diagram = program([["inteiro", "n"], ["caractere", "nome"]], [input("n"), call("nome = mes(n)"), out("nome")], [nomeDoMes])
    expect(runToEnd(diagram, ["2"]).outputs).toEqual(["fevereiro"])
    expect(runToEnd(diagram, ["13"]).outputs).toEqual(["?"])
  })
})

describe("bateria — vetores", () => {
  it("preenche e soma um vetor de reais", () => {
    const diagram = program([["real", "notas[3], s"], ["inteiro", "i"]], [
      proc("s = 0; i = 0"),
      whileLoop("i < 3", [input("notas[i]"), proc("s = s + notas[i]; i = i + 1")]),
      out("s"),
      out("notas[1]"),
    ])
    expect(runToEnd(diagram, ["7.5", "8.25", "6"]).outputs).toEqual(["21.75", "8.25"])
  })

  it("índice fora do vetor", () => {
    const diagram = program([["inteiro", "v[3]"]], [proc("v[3] = 1")])
    expectError(diagram, [], "OUT_OF_BOUNDS", /fora dos limites/)
  })
})
