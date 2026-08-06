# Design — JSON Debug Harness para o Módulo de Execução

**Data:** 2026-08-05
**Status:** Aprovado

## Contexto

O Blade é dividido em dois módulos: Construção de Diagramas (Emanuel) e Execução e Teste de Mesa (Lucas). O Módulo de Construção ainda não está finalizado, então o Módulo de Execução precisa de um **harness** para validar sua parte colando o JSON bruto do diagrama (`{ nodes, edges }`, formato React Flow — seção 9.1 do SSD).

## Objetivo

Permitir que Lucas cole o JSON do diagrama e valide seu pipeline completo: parser → motor de execução → código gerado → UI (teste de mesa, explicação, código transpilado) e entradas via `InputDialog`.

## Arquitetura

Elevar `SimulatorProvider` para `BuilderPage`, envolvendo canvas e inspector, e adicionar `loadDiagram(nodes, edges)` ao contexto.

```
BuilderPage
 ├─ SimulatorProvider (encapsula canvas + inspector)
 │   ├─ canvas:  <JsonHarness />
 │   └─ inspector: <SimulatorPanel />   (sem provider interno)
```

## Mudanças

1. **`SimulatorPanel.tsx`**: remover `<SimulatorProvider>` interno; manter `TooltipProvider`, filhos e `InputDialog`. Painel consume o contexto herdado.
2. **`BuilderPage.tsx`**: envolver `sidebar`/`canvas`/`inspector` com `SimulatorProvider`; `canvas={<JsonHarness />}`.
3. **`SimulatorContext.tsx`**: novo `loadDiagram(nodes, edges): { ok: true } | { ok: false; error: string }`.
4. **Novo `JsonHarness.tsx`** (canvas): textarea de JSON, botões Carregar/Limpar/Exemplo, status/erro inline.

## `loadDiagram` (passo a passo)

1. `parse(nodes, edges)` → `IParserData`
2. `new ExecutionEngine(graph)` → `setEngine`
3. `new CodeGenerator(graph).generate({lang})` para `js` e `ts` → `setCode`
4. `dispatch({ type: "RESET" })`
5. Retorna erro se `graph.startNodeId` for nulo (RN01)

## Erros

- JSON malformado → `SyntaxError` capturado no harness → mensagem inline.
- Sem `nodes`/`edges` ou tipo errado → mensagem descritiva.
- Diagrama sem `start` → error via `loadDiagram`.

## Compatibilidade

- Testes `__tests__/simulator/*.test.tsx` que renderizam `SimulatorProvider` localmente continuam válidos; `SimulatorPanel` precisa de provider envolvente (já é o caso nesses testes).

## Testes

- `loadDiagram`: diagrama válido → ok; sem `start` → erro.
- `JsonHarness`: renderiza, cola JSON válido/inválido, chama `loadDiagram`.
- Rodar `npm test`, `npm run lint`, `npm run build`.