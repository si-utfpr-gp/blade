# Blade

Plataforma educacional para ensino de algoritmos por Diagramas de Blocos.

Blade permite que estudantes construam algoritmos visualmente, executem simulação passo a passo com teste de mesa, acompanhem a evolução das variáveis e visualizem o código equivalente.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Ruby on Rails 8.1.3 |
| Frontend | React 19 + TypeScript 6 |
| Editor Visual | @xyflow/react (React Flow) |
| Bundler JS | esbuild |
| Estilização | Tailwind CSS 4 |
| Testes Frontend | Vitest + Testing Library |
| Lint Frontend | ESLint + TypeScript ESLint |
| Banco de Dados | PostgreSQL 16 |
| Deploy | Kamal + Docker |

## Requisitos

- Docker + Docker Compose
- Ruby 3.4.10 (via `.ruby-version`)
- Node.js (via `.node-version`)

## Setup

```bash
git clone https://github.com/si-utfpr-gp/blade.git
cd blade

docker compose up -d
```

O container já executa `bundle install`, `yarn install` e `db:prepare` automaticamente.

Acesse em [http://localhost:3000](http://localhost:3000)

## Comandos

```bash
# Rails
docker exec blade_app bin/rails test

# Frontend
docker exec blade_app yarn lint
docker exec blade_app yarn test
docker exec blade_app yarn test:watch
```

## Estrutura do Projeto

```
app/
  javascript/           # Código frontend (React + TypeScript)
    builder/            # Editor visual de diagramas
    controllers/        # Stimulus controllers
  controllers/          # Rails controllers
  models/               # Rails models
  views/                # Rails views
docs/
  prd.md                # Product Requirements Document
  ssd.md                # Software Design Document
  contributing.md       # Guia de contribuição
```

## Arquitetura

O sistema é dividido em dois módulos principais:

- **Módulo de Construção** — editor visual para criação dos diagramas
- **Módulo de Execução** — parser, interpretador, teste de mesa, geração de código

Detalhes completos em [docs/ssd.md](docs/ssd.md)

## Branches

```
@{username}/{type}/{scope-description}
```

Exemplos: `@lucasgfaj/fix/builder-tests`, `@emanuelodev/feat/builder-construct`

Veja [docs/contributing.md](docs/contributing.md)
