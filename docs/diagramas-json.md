# Diagramas de Teste — JSON do Módulo de Construção

Documento com diagramas prontos para copiar e colar no **Harness JSON** (canvas do builder) e
validar o **Módulo de Execução e Teste de Mesa** (parser → motor → teste de mesa → explicação →
código transpilado).

Para teste de mesa, os exemplos podem ser escritos no formato lógico limpo, sem `position`. O campo
`position` pertence ao construtor visual/React Flow e só serve para layout no canvas; o parser e o
motor de execução ignoram esse campo.

## Como usar

1. Abra a página do builder (harness no canvas + simulador à direita).
2. Copie um dos JSONs abaixo e cole na textarea do harness.
3. Clique em **Carregar**. Se tudo ok, aparece *"Diagrama carregado. Código JS/TS gerado. Use o simulador ao lado para executar."*.
4. No simulador, clique **Iniciar Execução** e avance com **Próximo**.
5. Quando um bloco `input` aparecer, o diálogo solicita o(s) valor(es). Digite e confirme.
6. Veja na aba **Trace** o teste de mesa (passos + variáveis), na **Explain** a explicação e na
   **Code** o código JS/TS gerado.

## Formato do JSON (resumo)

```jsonc
{
  "nodes": [ // lista de blocos
    { "id": "n1", "type": "startEnd",
      "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "rows": [
        { "type": "inteiro", "variables": "n, i" },
        { "type": "inteiro", "variables": "contador", "initialValue": "0" },
        { "type": "real", "variables": "notas[5], soma" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "process","data": { "label": "soma = 0; i = 0" } },
    { "id": "n5", "type": "decision","data": { "label": "i < n" } },
    { "id": "n6", "type": "output", "data": { "label": "'Média: ' + media" } },
    { "id": "n7", "type": "subroutine", "data": { "label": "resultado = dobro(n)" } }
  ],
  "edges": [ // conexões
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n5", "target": "n6", "sourceHandle": "yes" } // decisão: "yes"/"no"
  ],
  "subroutines": [ // opcional: funções visuais chamadas por blocos subroutine
    {
      "id": "routine-dobro",
      "name": "dobro",
      "parameters": ["valor"],
      "returnVariable": "retorno",
      "nodes": [ /* diagrama interno da rotina */ ],
      "edges": [ /* conexões internas da rotina */ ]
    }
  ]
}
```

Em um bloco `memory`, `initialValue` é opcional. Quando informado, o motor inicializa cada variável
daquela linha na própria declaração; use linhas separadas quando as variáveis precisarem de valores
iniciais diferentes.

**Tipos de bloco:** `startEnd` (com `variant: "start"|"end"`), `memory`, `input`, `process`,
`output`, `decision`, `subroutine`, `connector`.

**Sub-rotinas:** o campo opcional `subroutines` define diagramas internos chamados por blocos `subroutine`. Cada item deve conter `id`, `name`, `parameters`, `returnVariable`, `nodes` e `edges`. A chamada no bloco usa o formato `resultado = nome(argumento)`, e `nome` precisa existir em `subroutines[].name`. O resumo acima é ilustrativo; para copiar e executar, use o exemplo completo de sub-rotina na seção 9.

**Campos de layout:** `position`, `width`, `height`, `selected` e outros metadados do React Flow são
opcionais para execução. Eles podem aparecer no JSON exportado pelo construtor, mas não devem ser
necessários nos JSONs de teste de mesa.

## Sintaxe de expressões suportada pelo motor

| Recurso | Sintaxe | Exemplo |
|---|---|---|
| Aritmética | `+ - * /` `%` `()` | `soma = n1 + n2` |
| Comparação | `= == != < > <= >=` | `i <= n` |
| Lógica (Portugol) | `e` `ou` `nao` | `nota >= 0 e nota <= 10` |
| Múltiplas atribuições | separar com `;` | `soma = 0; i = 0` |
| Texto (string) | aspas simples | `'A média é: ' + media` |
| Vetor | `nome[indice]` | `notas[i] = nota` |
| Tipos | `inteiro real caractere logico` | bloco `memory` |

> Em `decision`, as arestas de saída devem usar `sourceHandle: "yes"` (verdadeiro) e
> `sourceHandle: "no"` (falso).

---

# 1. Soma de dois valores — SEQUENCIAL

Soma dois inteiros e exibe o resultado. Fluxo linear, sem desvios.

**Entradas:** `num1` e `num2` (inteiros).
**Saída esperada:** `A soma é: <num1+num2>` (ex.: `num1=10, num2=20` → `A soma é: 30`).

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "num1, num2, soma" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "num1, num2" } },
    { "id": "n4", "type": "process", "data": { "label": "soma = num1 + num2" } },
    { "id": "n5", "type": "output", "data": { "label": "'A soma é: ' + soma" } },
    { "id": "n6", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6" }
  ]
}
```

---

# 2. Par ou Ímpar — SE COMPOSTA (if/else)

Testa se um número é par ou ímpar usando `n % 2 == 0` em um bloco `decision`, com dois ramos de saída.

**Entradas:** `n` (inteiro).
**Saída esperada:** `O número é PAR` (se par) ou `O número é ÍMPAR` (se ímpar).

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "decision", "data": { "label": "n % 2 == 0" } },
    { "id": "n5", "type": "output", "data": { "label": "'O número é PAR'" } },
    { "id": "n6", "type": "output", "data": { "label": "'O número é ÍMPAR'" } },
    { "id": "n7", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5", "sourceHandle": "yes", "label": "VERDADEIRO" },
    { "id": "e5", "source": "n4", "target": "n6", "sourceHandle": "no", "label": "FALSO" },
    { "id": "e6", "source": "n5", "target": "n7" },
    { "id": "e7", "source": "n6", "target": "n7" }
  ]
}
```

---

# 3. Maior de Três — SE ANINHADA

Encontra o maior entre três números usando decisões aninhadas (if dentro de if).

**Entradas:** `a`, `b`, `c` (inteiros).
**Saída esperada:** `O maior é: <maior>` (ex.: `a=3, b=7, c=5` → `O maior é: 7`).

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "a, b, c, maior" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "a, b, c" } },
    { "id": "n4", "type": "process", "data": { "label": "maior = a" } },
    { "id": "n5", "type": "decision", "data": { "label": "b > maior" } },
    { "id": "n6", "type": "process", "data": { "label": "maior = b" } },
    { "id": "n7", "type": "decision", "data": { "label": "c > maior" } },
    { "id": "n8", "type": "process", "data": { "label": "maior = c" } },
    { "id": "n9", "type": "output", "data": { "label": "'O maior é: ' + maior" } },
    { "id": "n10", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6", "sourceHandle": "yes" },
    { "id": "e6", "source": "n5", "target": "n7", "sourceHandle": "no" },
    { "id": "e7", "source": "n6", "target": "n7" },
    { "id": "e8", "source": "n7", "target": "n8", "sourceHandle": "yes" },
    { "id": "e9", "source": "n7", "target": "n9", "sourceHandle": "no" },
    { "id": "e10", "source": "n8", "target": "n9" },
    { "id": "e11", "source": "n9", "target": "n10" }
  ]
}
```

---

# 4. Fatorial — ENQUANTO (while)

Calcula o fatorial de `n` com laço `enquanto` (decisão + aresta de retorno).

**Entradas:** `n` (inteiro, `n >= 0`).
**Saída esperada:** `O fatorial de 5 é 120`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n, fatorial, i" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "process", "data": { "label": "fatorial = 1; i = 1" } },
    { "id": "n5", "type": "decision", "data": { "label": "i <= n" } },
    { "id": "n6", "type": "process", "data": { "label": "fatorial = fatorial * i; i = i + 1" } },
    { "id": "n7", "type": "output", "data": { "label": "'O fatorial de ' + n + ' é ' + fatorial" } },
    { "id": "n8", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6", "sourceHandle": "yes" },
    { "id": "e6", "source": "n6", "target": "n5" },
    { "id": "e7", "source": "n5", "target": "n7", "sourceHandle": "no" },
    { "id": "e8", "source": "n7", "target": "n8" }
  ]
}
```

---

# 5. Soma até Zero — FAÇA-ENQUANTO (do-while)

Soma números fornecidos até que o valor informado seja `0` (o `0` não altera a soma).

**Entradas:** sequência de inteiros terminada em `0` (ex.: `5`, `3`, `0`).
**Saída esperada:** `A soma é: 8`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [
      { "type": "inteiro", "variables": "num" },
      { "type": "inteiro", "variables": "soma", "initialValue": "0" }
    ] } },
    { "id": "n3", "type": "connector", "data": { "label": "Iniciar leitura" } },
    { "id": "n4", "type": "input", "data": { "label": "num" } },
    { "id": "n5", "type": "process", "data": { "label": "soma = soma + num" } },
    { "id": "n6", "type": "decision", "data": { "label": "num != 0" } },
    { "id": "n7", "type": "connector", "data": { "label": "Ler próximo número" } },
    { "id": "n8", "type": "connector", "data": { "label": "Exibir soma" } },
    { "id": "n9", "type": "output", "data": { "label": "'A soma é: ' + soma" } },
    { "id": "n10", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6" },
    { "id": "e6", "source": "n6", "target": "n7", "sourceHandle": "yes" },
    { "id": "e7", "source": "n7", "target": "n4" },
    { "id": "e8", "source": "n6", "target": "n8", "sourceHandle": "no" },
    { "id": "e9", "source": "n8", "target": "n9" },
    { "id": "e10", "source": "n9", "target": "n10" }
  ]
}
```

Com as entradas `2`, `7`, `14`, `0`, os passos principais são: conector `3`, entrada `4`,
processo `5`, condição `6`, caso `6.1`, conector `7` e entrada `8`. No fim, o caso falso
`18.1` segue pelo conector `19`, pela saída `20` e encerra no passo `21`.

---

# 6. Validação de Nota — SE COMPOSTA (condição composta)

Valida se a nota está no intervalo `[0, 10]` usando uma condição composta com `e`.

**Entradas:** `nota` (real).
**Saída esperada:** `NOTA VÁLIDA` (se `0 <= nota <= 10`) ou `NOTA INVÁLIDA`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "real", "variables": "nota" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "nota" } },
    { "id": "n4", "type": "decision", "data": { "label": "nota >= 0 e nota <= 10" } },
    { "id": "n5", "type": "output", "data": { "label": "'NOTA VÁLIDA'" } },
    { "id": "n6", "type": "output", "data": { "label": "'NOTA INVÁLIDA'" } },
    { "id": "n7", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5", "sourceHandle": "yes" },
    { "id": "e5", "source": "n4", "target": "n6", "sourceHandle": "no" },
    { "id": "e6", "source": "n5", "target": "n7" },
    { "id": "e7", "source": "n6", "target": "n7" }
  ]
}
```

---

# 7. Média de Valores — ENQUANTO (while)

Lê `n` valores e calcula a média. Laço com contador `i`.

**Entradas:** `n` (inteiro) seguido de `n` valores (ex.: `n=3` e valores `10, 20, 30`).
**Saída esperada:** `A média é: 20`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n, i" }, { "type": "real", "variables": "valor, soma, media" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "process", "data": { "label": "soma = 0; i = 0" } },
    { "id": "n5", "type": "decision", "data": { "label": "i < n" } },
    { "id": "n6", "type": "input", "data": { "label": "valor" } },
    { "id": "n7", "type": "process", "data": { "label": "soma = soma + valor; i = i + 1" } },
    { "id": "n8", "type": "process", "data": { "label": "media = soma / n" } },
    { "id": "n9", "type": "output", "data": { "label": "'A média é: ' + media" } },
    { "id": "n10", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6", "sourceHandle": "yes" },
    { "id": "e6", "source": "n6", "target": "n7" },
    { "id": "e7", "source": "n7", "target": "n5" },
    { "id": "e8", "source": "n5", "target": "n8", "sourceHandle": "no" },
    { "id": "e9", "source": "n8", "target": "n9" },
    { "id": "e10", "source": "n9", "target": "n10" }
  ]
}
```

---

# 8. Média de Notas com Vetor — VARIÁVEIS INDEXADAS

Armazena as notas em um vetor `notas[5]` e calcula a média. Usa atribuição indexada `notas[i] = nota`.

**Entradas:** `n` (inteiro, `1 <= n <= 5`) seguido de `n` notas (ex.: `n=3` e notas `10, 20, 30`).
**Saída esperada:** `A média das notas é: 20`.
**Observação:** o vetor tem tamanho `5`; se `n > 5`, o motor acusa índice fora dos limites (comportamento esperado).

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n, i" }, { "type": "real", "variables": "notas[5], soma, media" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "process", "data": { "label": "soma = 0; i = 0" } },
    { "id": "n5", "type": "decision", "data": { "label": "i < n" } },
    { "id": "n6", "type": "input", "data": { "label": "nota" } },
    { "id": "n7", "type": "process", "data": { "label": "notas[i] = nota; soma = soma + nota; i = i + 1" } },
    { "id": "n8", "type": "process", "data": { "label": "media = soma / n" } },
    { "id": "n9", "type": "output", "data": { "label": "'A média das notas é: ' + media" } },
    { "id": "n10", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6", "sourceHandle": "yes" },
    { "id": "e6", "source": "n6", "target": "n7" },
    { "id": "e7", "source": "n7", "target": "n5" },
    { "id": "e8", "source": "n5", "target": "n8", "sourceHandle": "no" },
    { "id": "e9", "source": "n8", "target": "n9" },
    { "id": "e10", "source": "n9", "target": "n10" }
  ]
}
```

---

# 9. Sub-rotina Visual — FATORIAL COM RETORNO

Exemplo completo de sub-rotina visual. O algoritmo principal lê `n`, chama `resultado = fatorial(n)` e recebe o retorno calculado no diagrama interno `fatorial`. As variáveis `retorno` e `i` pertencem à memória local da sub-rotina e não aparecem na memória global do algoritmo principal.

**Entradas:** `n` (inteiro, ex.: `5`).
**Saída esperada:** `Fatorial: 120`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n, resultado" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "subroutine", "data": { "label": "resultado = fatorial(n)" } },
    { "id": "n5", "type": "output", "data": { "label": "'Fatorial: ' + resultado" } },
    { "id": "n6", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6" }
  ],
  "subroutines": [
    {
      "id": "routine-fatorial",
      "name": "fatorial",
      "parameters": ["valor"],
      "returnVariable": "retorno",
      "nodes": [
        { "id": "r1", "type": "startEnd", "data": { "label": "Início fatorial", "variant": "start" } },
        { "id": "r2", "type": "memory", "data": { "label": "Memória local", "rows": [ { "type": "inteiro", "variables": "retorno, i" } ] } },
        { "id": "r3", "type": "process", "data": { "label": "retorno = 1; i = 1" } },
        { "id": "r4", "type": "decision", "data": { "label": "i <= valor" } },
        { "id": "r5", "type": "process", "data": { "label": "retorno = retorno * i; i = i + 1" } },
        { "id": "r6", "type": "startEnd", "data": { "label": "Fim fatorial", "variant": "end" } }
      ],
      "edges": [
        { "id": "re1", "source": "r1", "target": "r2" },
        { "id": "re2", "source": "r2", "target": "r3" },
        { "id": "re3", "source": "r3", "target": "r4" },
        { "id": "re4", "source": "r4", "target": "r5", "sourceHandle": "yes" },
        { "id": "re5", "source": "r5", "target": "r4" },
        { "id": "re6", "source": "r4", "target": "r6", "sourceHandle": "no" }
      ]
    }
  ]
}
```

---

# Checklist de validação

- [ ] O JSON carrega sem erro de sintaxe (botão **Carregar** retorna uma mensagem de diagrama carregado).
- [ ] O teste de mesa mostra cada bloco visitado, inclusive `memory` e `connector`, e o caso selecionado após cada decisão.
- [ ] As variáveis aparecem preenchidas no passo em que são alteradas.
- [ ] A explicação descreve a operação de cada passo.
- [ ] O código gerado é semanticamente equivalente ao diagrama.
- [ ] Blocos `input` solicitam valor pelo diálogo durante a execução.
- [ ] Decisões seguem pelos ramos `yes`/`no` conforme o resultado da condição.
- [ ] Laços (`enquanto`/`faça-enquanto`) repetem os passos e terminam quando a condição falha.
- [ ] Vetores (`notas[i]`) atualizam cada posição no teste de mesa.
