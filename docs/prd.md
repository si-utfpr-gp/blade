# 📄 Product Requirements Document (PRD)

**Projeto:** Blade – Plataforma de Ensino de Algoritmos por Diagramas de Blocos

**Autores:**
- Lucas Gontarz Fajardo
- Emanuel Oliveira Andrade

**Versão:** 1.0.0

**Status:** 🟡 Em Desenvolvimento

---

# 🎯 1. Visão Geral e Objetivo

O Blade é uma plataforma educacional desenvolvida para apoiar o ensino e a aprendizagem de algoritmos por meio de Diagramas de Blocos.

A plataforma permite que estudantes construam algoritmos utilizando uma interface visual, executem sua simulação passo a passo, acompanhem a evolução das variáveis por meio do teste de mesa, recebam explicações detalhadas sobre a execução e visualizem automaticamente o código equivalente ao algoritmo construído.

O sistema busca reduzir a dificuldade encontrada por estudantes nas disciplinas introdutórias de programação, oferecendo um ambiente visual, interativo e didático para compreensão da lógica computacional.

O Blade é composto por dois módulos principais:

- **Módulo de Construção de Diagramas**
- **Módulo de Execução e Teste de Mesa**

Embora desenvolvidos separadamente durante o Trabalho de Conclusão de Curso, ambos os módulos compõem uma única plataforma.

---

# 🎯 2. Objetivos

## Objetivo Geral

Desenvolver uma plataforma integrada para construção, interpretação e simulação de algoritmos representados por Diagramas de Blocos.

## Objetivos Específicos

- Facilitar o aprendizado de lógica de programação;
- Permitir a criação visual de algoritmos;
- Simular a execução passo a passo;
- Demonstrar a evolução das variáveis;
- Gerar automaticamente o teste de mesa;
- Explicar cada etapa da execução;
- Converter diagramas para código-fonte;
- Servir como ferramenta de apoio ao ensino.

---

# 📖 3. Glossário Ubíquo

| Termo | Definição |
|--------|-----------|
| Diagrama | Representação gráfica de um algoritmo. |
| Bloco | Elemento que representa uma instrução do algoritmo. |
| Fluxo | Conexão entre blocos. |
| Parser | Componente responsável por interpretar o diagrama. |
| Contexto de Execução | Estado atual do algoritmo durante a execução. |
| Memória | Estrutura que armazena todas as variáveis. |
| Snapshot | Registro completo da memória em determinado instante. |
| Teste de Mesa | Simulação passo a passo do algoritmo. |
| Passo | Execução individual de um bloco. |
| Explicação | Descrição textual da ação realizada em um passo. |
| Conversão | Transformação do diagrama para código-fonte. |

---

# 👤 4. Atores

## Aluno

Responsável pela construção e execução dos algoritmos.

Permissões:

- Criar diagramas;
- Editar diagramas;
- Executar algoritmos;
- Navegar entre os passos da execução;
- Visualizar teste de mesa;
- Visualizar explicações;
- Visualizar código gerado.

---

## Professor

Utiliza a plataforma como ferramenta didática.

Permissões:

- Demonstrar algoritmos;
- Executar passo a passo;
- Explicar o funcionamento dos algoritmos;
- Utilizar o teste de mesa em aula.

---

## Sistema

Responsável por validar, interpretar, executar e converter os algoritmos construídos.

---

# 📝 5. Escopo Funcional (User Stories)

| ID | Ator | Descrição | Prioridade |
|----|-------|-----------|------------|
| US01 | Aluno | Criar um novo diagrama. | 🔥 Crítica |
| US02 | Aluno | Inserir blocos no diagrama. | 🔥 Crítica |
| US03 | Aluno | Conectar blocos. | 🔥 Crítica |
| US04 | Aluno | Editar propriedades dos blocos. | 🔥 Alta |
| US05 | Sistema | Validar a estrutura do diagrama. | 🔥 Crítica |
| US06 | Sistema | Interpretar o diagrama. | 🔥 Crítica |
| US07 | Aluno | Executar o algoritmo passo a passo. | 🔥 Crítica |
| US08 | Aluno | Avançar para o próximo passo. | 🔥 Alta |
| US09 | Aluno | Retroceder para um passo anterior. | 🔥 Alta |
| US10 | Aluno | Reiniciar a execução. | 🔥 Alta |
| US11 | Sistema | Atualizar automaticamente a memória. | 🔥 Crítica |
| US12 | Sistema | Registrar snapshots da execução. | 🔥 Crítica |
| US13 | Sistema | Destacar visualmente o bloco em execução. | 🔥 Alta |
| US14 | Sistema | Gerar automaticamente o teste de mesa. | 🔥 Crítica |
| US15 | Sistema | Gerar explicações da execução. | 🔥 Alta |
| US16 | Sistema | Converter o diagrama para código JavaScript. | 🔥 Alta |
| US17 | Sistema | Detectar erros estruturais do algoritmo. | ⚡ Média |
| US18 | Sistema | Detectar erros durante a execução. | ⚡ Média |

---

# 🛡️ 6. Regras de Negócio

### RN01

Todo algoritmo deve possuir exatamente um bloco de início.

### RN02

Todo algoritmo deve possuir exatamente um bloco de término.

### RN03

Todo bloco deve estar conectado ao fluxo principal.

### RN04

A execução inicia obrigatoriamente no bloco inicial.

### RN05

A execução segue exclusivamente as conexões existentes.

### RN06

Blocos de decisão devem possuir exatamente dois caminhos de saída.

### RN07

Cada passo executado gera um snapshot da memória.

### RN08

A memória deve representar fielmente o estado do algoritmo.

### RN09

Variáveis somente podem ser utilizadas após sua inicialização.

### RN10

O teste de mesa deve refletir exatamente a execução realizada.

### RN11

O código gerado deve ser semanticamente equivalente ao algoritmo representado no diagrama.

### RN12

A execução deve ser interrompida caso sejam encontrados erros estruturais.

### RN13

O motor de execução não poderá modificar o diagrama original.

---

# 🚫 7. Fora de Escopo

Nesta versão da plataforma não serão implementados:

- Execução de código compilado;
- Integração com IDEs externas;
- Colaboração em tempo real;
- Versionamento de diagramas;
- Suporte a múltiplas linguagens além das previstas;
- Inteligência Artificial para geração automática de algoritmos.

---

# ⚙️ 8. Requisitos Não Funcionais

## Desempenho

- Execução rápida e responsiva.
- Atualização instantânea da interface.

## Confiabilidade

- Execução determinística.
- Snapshots imutáveis.

## Arquitetura

- Componentes desacoplados.
- Arquitetura modular.
- Fácil manutenção.

## Escalabilidade

- Permitir novos tipos de blocos.
- Permitir novos geradores de código.
- Permitir expansão do interpretador.

## Testabilidade

- Parser testável.
- Motor de execução testável.
- Conversor testável.

---

# 🛠️ 9. Diretrizes Tecnológicas

| Camada | Tecnologia |
|----------|------------|
| Frontend | React |
| Linguagem | TypeScript |
| Editor Visual | React Flow |
| Backend | Ruby on Rails |
| Banco de Dados | PostgreSQL |
| Versionamento | Git + GitHub |

---

# 👨‍💻 10. Divisão de Responsabilidades

O desenvolvimento da plataforma foi dividido em dois módulos para fins acadêmicos.

## Módulo de Construção de Diagramas

**Responsável:** Emanuel Oliveira Andrade

Responsabilidades:

- Editor visual;
- Inserção de blocos;
- Conexões;
- Manipulação do diagrama;
- Interface de modelagem.

---

## Módulo de Execução e Teste de Mesa

**Responsável:** Lucas Gontarz Fajardo

Responsabilidades:

- Interpretação do diagrama;
- Parser;
- Validação estrutural;
- Motor de execução;
- Teste de mesa;
- Gerenciamento da memória;
- Explicação da execução;
- Conversão para código.

---

# ✅ 11. Critérios de Aceitação

O Blade será considerado funcional quando for capaz de:

- Permitir a construção de diagramas de blocos;
- Validar automaticamente a estrutura do algoritmo;
- Interpretar corretamente diagramas válidos;
- Executar algoritmos passo a passo;
- Atualizar corretamente a memória durante a execução;
- Gerar automaticamente o teste de mesa;
- Explicar cada etapa da execução;
- Converter o algoritmo para código JavaScript equivalente;
- Apresentar uma interface intuitiva para apoio ao ensino de algoritmos.