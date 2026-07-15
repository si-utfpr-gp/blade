# Contribuindo com o Blade

## Estratégia de Branches

```
main
  └── develop
        ├── @lucasgfaj/fix/builder-tests
        ├── @emanuelodev/feat/builder-construct
        └── ...
```

- **`main`** — branch de produção. Apenas código validado e testado.
- **`develop`** — branch de integração. Toda feature/fix passa por ela antes de ir para `main`.
- **`@{username}/{type}/{scope-description}`** — branches de trabalho individuais.

## Fluxo de Trabalho

```
cria branch  →  desenvolve  →  PR para develop  →  code review + testes  →  merge em develop
                                                                                    ↓
                                                                         PR para main  →  merge em main
```

1. Crie uma branch a partir de `develop` com o padrão `@{username}/{type}/{scope-description}`.
2. Desenvolva e faça commits atômicos (um commit por mudança lógica).
3. Abra um **Pull Request** para a branch `develop`.
4. Após aprovação e testes, faça merge em `develop`.
5. Periodicamente, um PR de `develop` para `main` é aberto e mergeado.

## Nomenclatura de Branches

```
@{username}/{type}/{scope-description}
```

### Tipos

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adição ou correção de testes |
| `docs` | Documentação |
| `style` | Formatação, organização de imports |
| `perf` | Melhoria de performance |
| `ci` | Mudança em CI/CD |
| `chore` | Tarefas auxiliares (build, dependências) |

### Exemplos

- `@lucasgfaj/fix/parser-expression`
- `@lucasgfaj/feat/engine-desk-check`
- `@emanuelodev/feat/builder-construct`
- `@emanuelodev/fix/builder-connection`

## Commits

### Formato

```
{tipo}({escopo}): {descricao}
```

### Exemplos

```
feat(parser): adiciona suporte a expressões aritméticas
fix(executor): corrige avaliação de condição em bloco decisão
docs(prd): atualiza versões da stack tecnológica
test(memoria): adiciona testes para gerenciador de snapshots
```

### Boas Práticas

- Commits **atômicos**: cada commit representa uma única mudança lógica.
- Use o **imperativo** no título ("adiciona", "corrige", "remove").
- Corpo do commit (opcional) pode explicar o **porquê** da mudança.

## Pull Requests

### Abrindo um PR

- O PR deve sempre targetar `develop` (nunca `main`).
- Preencha o template com:
  - Descrição clara da mudança
  - Tipo de mudança
  - Nome da branch de origem no padrão definido
  - Checklist de validação
- Atribua um revisor.

### Requisitos para Merge

- ✅ Código compila sem erros
- ✅ Testes React passam (`yarn test`)
- ✅ RuboCop passa (`bin/rubocop`)
- ✅ Brakeman passa (`bin/brakeman`)
- ✅ Bundler-audit passa (`bin/bundler-audit`)
- ✅ Pelo menos 1 approval de revisor
- ✅ Sem conflitos com a branch de destino

## Deploy para Produção (`main`)

- Apenas a branch `develop` faz merge em `main`.
- O merge de `develop` para `main` deve ser feito via PR com todos os checks do CI verdes.
- Commits diretos em `main` são **proibidos**.

## CI Pipeline

O CI executa automaticamente em todo PR e push para `main`:

### Ruby
1. **scan_ruby** — Brakeman + Bundler Audit
2. **lint** — RuboCop
3. **test** — Testes do Rails
4. **system-test** — Testes de sistema (quando implementados)

### Frontend (React)
1. **lint** — `yarn lint` (ESLint + TypeScript)
2. **test** — `yarn test` (Vitest + Testing Library)
