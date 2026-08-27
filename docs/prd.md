# 📄 Product Requirements Document (PRD)

**Projeto:** Blade – Plataforma de Ensino de Algoritmos por Diagramas de Blocos

**Autores:**
- Lucas Gontarz Fajardo
- Emanuel Oliveira Andrade

**Versão:** 2.0.0

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
| startEnd | Bloco que representa início ou término, diferenciado pela propriedade `variant` (`'start'` ou `'end'`). |
| memory | Bloco de declaração de variáveis com tipo e nome. Gera um passo didático no teste de mesa. |
| input | Bloco de entrada de dados pelo usuário. |
| output | Bloco de saída/exibição de dados. |
| process | Bloco de atribuição ou processamento. |
| decision | Bloco de desvio condicional. |
| connector | Bloco de roteamento de fluxo. Gera um passo didático no teste de mesa. |
| subroutine | Bloco de chamada de uma função visual definida pelo usuário em seu próprio diagrama. |
| variant | Propriedade do bloco `startEnd` que indica início (`'start'`) ou término (`'end'`). |
| Fluxo | Conexão entre blocos. |
| Parser | Componente responsável por interpretar o diagrama. |
| Contexto de Execução | Estado atual do algoritmo durante a execução. |
| Memória | Estrutura que armazena todas as variáveis. |
| Snapshot | Registro completo da memória em determinado instante. |
| Teste de Mesa | Simulação passo a passo do algoritmo. |
| Passo | Registro didático de cada bloco visitado e de cada ramo selecionado em uma decisão. |
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
| US05 | Sistema | Validar a estrutura do diagrama (pré-execução). | 🔥 Crítica |
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

# 🧩 6. Sistema para Simulação de Teste de Mesa em Diagrama de Blocos

O **Sistema para Simulação de Teste de Mesa em Diagrama de Blocos** é o componente central do Blade. Ele é responsável por interpretar, executar e simular algoritmos representados visualmente, permitindo que o usuário acompanhe cada etapa da execução e compreenda o comportamento do algoritmo.

## Funcionamento Geral

O sistema opera em ciclos de execução controlados pelo usuário. A cada ciclo, o motor de execução:

1. Identifica o bloco atual a ser processado com base no fluxo do diagrama;
2. Registra no teste de mesa cada bloco visitado, inclusive `connector` e `memory`, e o ramo selecionado em decisões;
3. Interpreta o tipo de bloco e sua operação específica;
4. Executa a operação, atualizando o estado da memória;
5. Registra um snapshot completo do estado após a execução;
6. Gera uma explicação textual da operação realizada;
7. Aguarda a solicitação do usuário para avançar ao próximo passo.

Esse ciclo se repete até que o bloco `startEnd` com `variant = 'end'` seja alcançado ou um erro seja detectado.

## Motor de Execução

O motor de execução é o núcleo do sistema. Ele recebe como entrada a estrutura do diagrama parseada e percorre os blocos respeitando as conexões definidas.

Suas principais responsabilidades são:

- **Navegação entre blocos**: segue as arestas do grafo para determinar o próximo bloco, respeitando desvios condicionais;
- **Interpretação de operações**: executa atribuições, expressões aritméticas, decisões lógicas, laços de repetição, entrada e saída de dados;
- **Gerenciamento de estado**: mantém e atualiza a memória com todas as variáveis do algoritmo;
- **Controle de fluxo**: avalia condições em blocos de decisão para determinar o caminho a seguir;
- **Detecção de erros**: identifica erros estruturais e de execução, interrompendo a simulação quando necessário.

## Sub-rotinas Visuais Definidas pelo Usuário

O Blade representa programação de alto nível de forma visual. Além do algoritmo **Principal**, o usuário poderá criar sub-rotinas como algoritmos separados, cada uma desenhada em seu próprio canvas interno do construtor. Esses canvases não são abas do navegador: são áreas do próprio editor, por exemplo **Principal** e **fatorial**.

Uma chamada no algoritmo principal poderá ser representada por um bloco `subroutine`, como:

```text
resultado = fatorial(m)
```

Nesse caso, o motor deve localizar a sub-rotina `fatorial`, avaliar o argumento `m`, executar o diagrama da função e atribuir seu valor de retorno à variável `resultado`. A sub-rotina possui parâmetros e memória local; suas variáveis internas não devem vazar para o escopo de quem a chamou. Ao terminar, o motor retorna ao próximo bloco do algoritmo chamador.

Esse fluxo também deve aparecer no teste de mesa e nas explicações, identificando a chamada, os passos internos da função e o retorno. A navegação por snapshots deve restaurar a execução completa, inclusive a rotina ativa, a memória local e o ponto de retorno de cada chamada.

> **Status atual:** o módulo de execução interpreta chamadas `subroutine`, avalia argumentos, cria memória local, controla pilha de chamadas, restaura snapshots com frames de sub-rotina e gera funções JavaScript/TypeScript. A criação visual dos canvases e a exportação pelo construtor ainda pertencem ao módulo de construção.

## Gerenciamento de Memória

A memória do sistema é uma estrutura que armazena todas as variáveis criadas durante a execução. Ela funciona como um dicionário mutável que é atualizado a cada operação.

Características da memória:

- **Declaração explícita**: as variáveis são declaradas no bloco `memory` com nome e tipo (`inteiro`, `real`, `caractere`, `logico`);
- **Inicialização tardia**: variáveis só recebem valor após sua primeira atribuição (bloco `input` ou `process`);
- **Tipagem declarativa com execução dinâmica**: o tipo declarado no bloco `memory` serve como documentação e validação, mas o valor é tratado dinamicamente durante a execução;
- **Suporte a vetores**: variáveis indexadas são declaradas como `nome[tamanho]` (ex: `notas[5]`);
- **Imutabilidade de snapshots**: uma vez registrado, um snapshot não pode ser alterado;
- **Escopo do algoritmo principal**: as variáveis declaradas no diagrama principal compartilham o escopo global desse algoritmo;
- **Escopo local de sub-rotina**: cada função visual terá sua própria memória local e receberá valores pelos parâmetros, sem expor suas variáveis internas ao chamador.

## Sistema de Snapshots

A cada passo da execução, o sistema captura o estado completo da memória e armazena como um snapshot imutável.

Cada snapshot contém:

- Identificador único do passo;
- Bloco executado;
- Estado completo das variáveis no momento;
- Operação realizada;
- Resultado da operação.
- Quando houver sub-rotinas visuais: pilha de chamadas, rotina ativa, memórias locais e ponto de retorno.

Os snapshots permitem que o usuário navegue livremente entre os passos da execução. Essa navegação apenas restaura um estado já registrado: não executa blocos, não solicita novas entradas e não acrescenta linhas ao teste de mesa.

Quando o usuário escolhe executar um novo **Próximo passo** a partir de um snapshot anterior, o futuro ativo é substituído pelo resultado da nova execução. Dessa forma, o teste de mesa continua representando uma única linha do tempo, sem passos ou variáveis duplicados.

## Geração do Teste de Mesa

O teste de mesa é construído automaticamente a partir da sequência de snapshots registrados. Ele é apresentado como uma tabela onde cada linha representa um passo da execução.

A tabela do teste de mesa exibe:

- Número do passo;
- Bloco executado (tipo e identificador);
- Operação realizada (descrição textual);
- Valores de todas as variáveis após a execução;
- Resultado ou saída produzida (se aplicável).

## Interação com o Usuário

Quando a execução encontra um bloco do tipo **Entrada**, o sistema interrompe a execução e solicita que o usuário informe um valor. Após o usuário fornecer o dado, a execução prossegue normalmente.

O sistema oferece as seguintes ações de controle ao usuário:

- **Próximo no histórico**: restaura o snapshot seguinte já registrado, sem executar o algoritmo;
- **Próximo passo**: executa o próximo bloco e registra um novo snapshot; se partir de um snapshot anterior, substitui o futuro ativo;
- **Retroceder passo**: restaura o estado do snapshot anterior, sem executar o algoritmo;
- **Reiniciar**: reinicializa a execução desde o primeiro bloco;
- **Ir para passo específico**: restaura o estado de qualquer snapshot anterior.

## Geração de Explicações

Para cada passo executado, o sistema gera automaticamente uma explicação textual didática, descrevendo:

- O que o bloco faz;
- Qual operação está sendo realizada;
- Qual o impacto nas variáveis;
- Qual o próximo passo esperado.

As explicações são dinâmicas e dependem do tipo de bloco e dos valores correntes das variáveis, permitindo que o aluno compreenda o raciocínio por trás de cada operação.

---

# 🛡️ 7. Regras de Negócio

### RN01

Todo algoritmo deve possuir exatamente um bloco `startEnd` com `variant = 'start'`.

### RN02

Todo algoritmo deve possuir exatamente um bloco `startEnd` com `variant = 'end'`.

### RN03

Todo bloco deve estar conectado ao fluxo principal, exceto `connector` que pode ser ponto de convergência intermediário.

### RN04

A execução inicia obrigatoriamente no bloco `startEnd` com `variant = 'start'`.

### RN05

A execução segue exclusivamente as conexões existentes.

### RN06

Blocos de decisão devem possuir exatamente dois caminhos de saída, identificados pelos handles `'yes'` (VERDADEIRO) e `'no'` (FALSO).

### RN07

Cada bloco visitado e cada ramo selecionado em uma decisão gera um snapshot imutável. Os passos de `memory` e `connector` preservam a memória sem alterar seus valores.

### RN08

A memória deve representar fielmente o estado do algoritmo.

### RN09

Variáveis somente podem ser utilizadas após sua declaração no bloco `memory` e inicialização via `input` ou `process`.

### RN10

O teste de mesa deve refletir exatamente a execução realizada.

### RN11

O código gerado deve ser semanticamente equivalente ao algoritmo representado no diagrama.

### RN12

Erros estruturais devem ser detectados pelo módulo de construção antes do envio ao módulo de execução.

### RN13

O motor de execução não poderá modificar o diagrama original.

### RN14

Blocos `connector` devem possuir exatamente uma aresta de entrada e uma aresta de saída.

### RN15

Blocos `startEnd` com `variant = 'start'` possuem apenas aresta de saída. Blocos `startEnd` com `variant = 'end'` possuem apenas aresta de entrada.

### RN16

A expressão em blocos `process` pode conter múltiplos statements separados por `;` (ex: `soma = 0; i = 0`), que são executados sequencialmente em um único passo.

---

# 🚫 8. Fora de Escopo

Nesta versão da plataforma não serão implementados:

- Execução de código compilado;
- Integração com IDEs externas;
- Colaboração em tempo real;
- Versionamento de diagramas;
- Suporte a múltiplas linguagens além das previstas;
- Inteligência Artificial para geração automática de algoritmos.

---

# ⚙️ 9. Requisitos Não Funcionais

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

# 🛠️ 10. Diretrizes Tecnológicas

| Camada | Tecnologia | Versão |
|----------|------------|--------|
| Runtime | Ruby | 3.4.10 |
| Framework Web | Ruby on Rails | 8.1.3 |
| Servidor Web | Puma | >= 5.0 |
| Frontend | React | 19.2.7 |
| Linguagem Frontend | TypeScript | 6.0.3 |
| Editor Visual | @xyflow/react (React Flow) | 12.11.1 |
| Bundler JS | esbuild | 0.28.1 |
| Testes Frontend | Vitest | 4.1.10 |
| Estilização | Tailwind CSS | 4.3.2 |
| Hotwire (Turbo) | @hotwired/turbo-rails | 8.0.23 |
| Hotwire (Stimulus) | @hotwired/stimulus | 3.2.2 |
| Banco de Dados | PostgreSQL | 16 |
| Driver BD | pg gem | ~> 1.1 |
| Cache | solid_cache | - |
| Fila | solid_queue | - |
| WebSocket | solid_cable | - |
| Processamento Imagens | image_processing | ~> 1.2 |
| Deploy | Kamal | - |
| Versionamento | Git + GitHub | - |
| Containerização | Docker + Docker Compose | - |

---

# 👨‍💻 11. Divisão de Responsabilidades

O desenvolvimento da plataforma foi dividido em dois módulos para fins acadêmicos.

## Módulo de Construção de Diagramas

**Responsável:** Emanuel Oliveira Andrade

Responsabilidades:

- Editor visual;
- Inserção de blocos;
- Conexões;
- Manipulação do diagrama;
- Validação estrutural (pré-execução);
- Interface de modelagem.

---

## Módulo de Execução e Teste de Mesa

**Responsável:** Lucas Gontarz Fajardo

Responsabilidades:

- Interpretação do diagrama;
- Parser;
- Motor de execução;
- Teste de mesa;
- Gerenciamento da memória;
- Explicação da execução;
- Conversão para código.

---

# ✅ 12. Critérios de Aceitação

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
