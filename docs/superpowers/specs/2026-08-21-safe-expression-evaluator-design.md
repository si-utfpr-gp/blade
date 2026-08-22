# Avaliador Seguro de Expressões — Design

## Objetivo

Substituir toda execução por `new Function` no módulo de execução por um parser e avaliador interno, determinístico e restrito à linguagem de expressões do Blade. O construtor continua enviando o texto dos blocos no JSON; a AST existe apenas dentro do motor de execução.

## Escopo

O avaliador deve preservar a sintaxe já aceita pelo Blade:

- números inteiros e decimais;
- textos entre aspas simples ou duplas;
- booleanos `verdadeiro` e `falso`;
- variáveis declaradas e vetores com índice literal ou variável, como `notas[0]` e `notas[i]`;
- parênteses;
- operadores `+`, `-`, `*`, `/`, `%`, `<`, `<=`, `>`, `>=`, `=`, `==`, `!=`, `e`, `ou` e `nao`;
- múltiplas atribuições em um bloco `process`, separadas por `;`.

Chamadas de função, acesso a propriedades, construções JavaScript e qualquer token fora dessa gramática devem ser rejeitados.

## Arquitetura

### Parser de expressão

Um novo componente interno recebe uma expressão e produz uma AST. Ele tokeniza somente os elementos da gramática permitida e usa precedência de operadores:

1. `ou`;
2. `e`;
3. comparações;
4. soma e subtração;
5. multiplicação, divisão e módulo;
6. negação unária (`nao` e `-`);
7. literais, variáveis, acesso a vetor e parênteses.

A AST não é serializada nem exposta para o construtor. O JSON permanece com `label` textual, como `soma = a + b`.

### Avaliação

O `ExprEvaluator` mantém sua API pública atual:

- `assign(expr, blockId)`;
- `condition(expr, blockId)`;
- `output(expr, blockId)`.

Internamente, ele avalia a AST usando apenas a interface `IMemory`. Valores de memória continuam armazenados como texto; durante a avaliação são convertidos de forma controlada para número, booleano ou texto e são convertidos novamente para texto ao gravar resultados.

Divisão por zero é detectada pelo avaliador ao executar o operador `/`. A validação sintática deixa de compilar JavaScript e passa a ocorrer naturalmente durante o parsing.

### Atribuições

O processamento de um bloco `process` identifica declarações separadas por `;` fora de literais de texto. Cada declaração deve conter uma atribuição de topo para uma variável simples ou posição de vetor. O lado direito é avaliado pelo parser seguro.

Exemplos válidos:

```text
soma = a + b
notas[i] = nota
i = i + 1; soma = soma + nota
```

## Erros

O avaliador deve propagar erros estruturados com `type`, `message` e `blockId`. Isso elimina a reconstrução parcial de contexto na `ExecutionEngine`.

Erros esperados incluem:

- expressão ou token inválido;
- variável não declarada ou não inicializada;
- vetor inexistente ou índice fora dos limites;
- divisão por zero.

## Segurança

Nenhum trecho da expressão será enviado a `eval`, `new Function` ou APIs equivalentes. A gramática não admite chamadas, propriedades ou membros JavaScript; portanto, estruturas como `[]['constructor']...`, `globalThis`, `window` e `fetch(...)` não conseguem ser avaliadas.

## Testes

Os testes atuais de aritmética, lógica, texto, vetores e `ExecutionEngine` permanecem como regressão. Serão incluídos testes para:

- precedência e parênteses;
- índice de vetor literal e variável;
- atribuições múltiplas;
- erro com `blockId` preservado;
- rejeição de chamada, acesso por ponto e payload com `constructor`;
- ausência de `new Function` no caminho de execução e validação.

## Não escopo

Esta alteração não modifica o JSON do construtor, o canvas, a geração de código JavaScript/TypeScript ou o modelo futuro de sub-rotinas visuais. Ela substitui apenas a execução e validação de expressões do motor atual.
