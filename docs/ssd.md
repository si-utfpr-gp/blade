# 📄 Software Design Document (SSD)

**Projeto:** Blade – Plataforma de Ensino de Algoritmos por Diagramas de Blocos

**Autores:**
- Lucas Gontarz Fajardo
- Emanuel Oliveira Andrade

**Versão:** 1.0.0

**Status:** 🟡 Em Desenvolvimento

---

# 1. Introdução

Este documento apresenta a arquitetura de software do Blade, descrevendo a organização dos principais componentes do sistema e o fluxo de funcionamento da aplicação.

O objetivo deste documento é fornecer uma visão técnica da solução proposta, demonstrando como os módulos do sistema interagem para permitir a construção, interpretação e execução de algoritmos representados por Diagramas de Blocos.

Este documento não aborda detalhes de banco de dados, infraestrutura ou implementação específica de código, concentrando-se apenas na arquitetura lógica da aplicação.

---

# 2. Objetivos da Arquitetura

A arquitetura do Blade foi projetada visando:

- Separação clara de responsabilidades;
- Facilidade de manutenção;
- Modularização do sistema;
- Facilidade para futuras expansões;
- Reutilização de componentes;
- Independência entre construção e execução dos algoritmos.

---

# 3. Visão Geral do Sistema

O Blade é composto por dois módulos principais que trabalham de forma integrada.

- Módulo de Construção de Diagramas
- Módulo de Execução e Teste de Mesa

O primeiro é responsável pela criação e edição dos algoritmos.

O segundo interpreta o algoritmo criado, executa sua lógica e apresenta os resultados da simulação ao usuário.

---

# 4. Arquitetura Geral

```mermaid
graph TB
    subgraph UI["Interface do Usuário"]
        A[Aluno]
    end

    subgraph BUILDER["Módulo de Construção"]
        B[Editor Visual<br/>React Flow]
        C[Blocos<br/>Entrada, Processo, Saída,<br/>Decisão, Enquanto, Para]
    end

    subgraph EXECUTION["Módulo de Execução"]
        D[Parser]
        E[Motor de Execução]
        F[Memória]
        G[Teste de Mesa]
        H[Explicação]
        I[Código Gerado]
    end

    A --> B
    B -- "JSON\nDiagrama" --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I

    style BUILDER fill:#f9f,stroke:#333
    style EXECUTION fill:#bbf,stroke:#333
```

A arquitetura foi organizada em módulos independentes, permitindo que alterações em um módulo causem o mínimo impacto possível nos demais.

## Stack Tecnológica e Versões

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
| Deploy | Kamal | - |
| Versionamento | Git + GitHub | - |
| Containerização | Docker + Docker Compose | - |

---

# 5. Componentes do Sistema

## Interface do Usuário

Responsável pela interação entre o usuário e a plataforma.

Permite:

- construir diagramas;
- executar algoritmos;
- acompanhar a execução;
- visualizar os resultados.

---

## Módulo de Construção

Responsável pela modelagem visual dos algoritmos.

Principais responsabilidades:

- criação dos blocos;
- edição;
- conexões;
- organização do diagrama.

Ao final da modelagem, produz um diagrama estruturado que será enviado ao módulo de execução.

---

## Módulo de Execução

Responsável por interpretar o diagrama recebido.

Este módulo realiza:

- validação;
- interpretação;
- execução passo a passo;
- atualização da memória;
- geração do teste de mesa;
- geração das explicações;
- conversão para código.

---

# 6. Fluxo Geral de Funcionamento

O funcionamento do Blade ocorre conforme o fluxo abaixo.

```mermaid
flowchart TB
    subgraph Construção["Construção do Diagrama"]
        B[Editor Visual]
        C[Blocos Disponíveis]
        B --> C
    end

    subgraph Validação["Validação"]
        V[Validador Estrutural]
    end

    subgraph Interpretação["Interpretação"]
        P[Parser<br/>JSON → AST]
    end

    subgraph Execução["Execução"]
        M[Motor de Execução<br/>AST → Estado]
        MEM[Memória<br/>Variáveis + Snapshots]
        TM[Teste de Mesa<br/>Solicitando Dados → Executando]
        EXP[Explicação<br/>Texto Descritivo]
        CODE[Código<br/>JavaScript]
    end

    C --> V
    V --> P
    P --> M
    M <--> MEM
    M <--> TM
    TM <-.->|"Input do Usuário"| A[Aluno]
    M --> EXP
    M --> CODE

    style TM fill:#ffd,stroke:#333
```

Após a construção do algoritmo, o sistema realiza sua validação estrutural.

Caso o diagrama seja considerado válido, inicia-se a interpretação do algoritmo.

Durante a execução, o sistema atualiza continuamente a memória, gera o teste de mesa, produz explicações textuais e disponibiliza o código equivalente.

---

# 7. Módulo de Construção de Diagramas

Este módulo é responsável pela elaboração visual do algoritmo.

Suas principais funções são:

- disponibilizar os blocos da linguagem;
- permitir conexões entre blocos;
- editar propriedades dos elementos;
- validar regras básicas da construção;
- fornecer ao módulo de execução um diagrama consistente.

Este módulo não realiza qualquer processamento lógico do algoritmo.

---

# 8. Módulo de Execução e Teste de Mesa

O módulo de execução constitui o núcleo funcional da plataforma.

Seu objetivo é interpretar o algoritmo representado pelo diagrama e executar cada instrução de forma semelhante ao funcionamento de um interpretador.

Durante a execução o sistema:

- identifica o bloco atual;
- interpreta sua operação;
- atualiza as variáveis;
- registra o estado da memória;
- produz um novo passo do teste de mesa;
- gera uma explicação da operação executada.

---

# 9. Fluxo de Execução

```mermaid
flowchart TB
    subgraph Input["Fluxo de Entrada"]
        JSON[JSON do Diagrama]
        INPUT_BLOCK[Blocos de Entrada<br/>Detectados]
    end

    subgraph Processing["Processamento"]
        P[Parser<br/>Valida + Constrói Grafo]
        GRAPH[(Grafo de Execução)]
    end

    subgraph Execution["Execução Interativa"]
        EXE[Motor de Execução]
        MEM[(Memória<br/>Variáveis)]
        TM[Teste de Mesa<br/>Passo a Passo]
        EXP[Gerador de Explicação]
        CODE[Gerador de Código]
    end

    subgraph UI["Interface"]
        A[Aluno]
        INPUT_UI[Solicitação de Dados]
    end

    JSON --> P
    P --> GRAPH
    GRAPH --> EXE
    EXE <--> MEM
    MEM --> TM
    EXE --> TM
    EXE --> EXP
    EXE --> CODE
    EXE <-.->|"InputRequest"| A
    A --> INPUT_UI
    INPUT_UI -->|"Valor Inserido"| EXE

    style TM fill:#ffd,stroke:#333
    style INPUT_UI fill:#ffd,stroke:#333
```

O diagrama é inicialmente interpretado pelo Parser.

Em seguida, o Motor de Execução percorre os blocos seguindo o fluxo definido pelo algoritmo.

A cada instrução executada, a memória é atualizada e novos resultados são produzidos.

---

# 9.1. Formato JSON do Diagrama

O construtor envia o diagrama ao módulo de execução no seguinte formato:

```json
{
  "nodes": [
    { "id": "1", "type": "start", "position": { "x": 0, "y": 0 }, "data": {} },
    { "id": "2", "type": "input", "position": { "x": 100, "y": 100 }, "data": { "variable": "n" } },
    { "id": "3", "type": "process", "position": { "x": 200, "y": 200 }, "data": { "expression": "soma = n + 10" } },
    { "id": "4", "type": "output", "position": { "x": 300, "y": 300 }, "data": { "message": "soma" } },
    { "id": "5", "type": "end", "position": { "x": 400, "y": 400 }, "data": {} }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" },
    { "id": "e2-3", "source": "2", "target": "3" },
    { "id": "e3-4", "source": "3", "target": "4" },
    { "id": "e4-5", "source": "4", "target": "5" }
  ]
}
```

---

# 9.2. Fluxo de Solicitação de Dados

Quando o teste de mesa encontra um bloco de **Entrada**, o fluxo é:

```mermaid
sequenceDiagram
    participant A as Aluno
    participant E as Executor
    participant M as Memória
    participant TM as Teste de Mesa

    E->>TM: Executa passo
    TM->>E: Detecta bloco Input
    E->>A: Solicita valor (prompt)
    A->>E: Informar dado
    E->>M: Armazena variável
    M->>TM: Atualiza snapshot
```

# 10. Sistema para Simulação de Teste de Mesa em Diagrama de Blocos

O **Sistema para Simulação de Teste de Mesa em Diagrama de Blocos** é o motor central da plataforma Blade. Ele interpreta o diagrama construído pelo usuário, executa as instruções do algoritmo, gerencia o estado da memória e produz toda a saída didática da plataforma: teste de mesa, explicações e código-fonte.

## 10.1. Arquitetura do Motor de Execução

```mermaid
graph TB
    subgraph Input["Entrada"]
        DIAGRAM[JSON do Diagrama]
    end

    subgraph Parser["Camada de Parsing"]
        VAL[Validador Estrutural]
        AST[Gerador de AST<br/>Abstract Syntax Tree]
        GRAPH[Construtor de Grafo<br/>de Execução]
    end

    subgraph Engine["Motor de Execução"]
        CTL[Controlador de<br/>Fluxo]
        INTERP[Interpretador<br/>de Blocos]
        MEM[Gerenciador<br/>de Memória]
        SNAP[Gerador de<br/>Snapshots]
    end

    subgraph Output["Saída"]
        DT[Teste de Mesa<br/>Desk Check Table]
        EXP[Explicações<br/>Textuais]
        CODE[Código JavaScript]
        HIGHLIGHT[Bloco Destacado<br/>na Interface]
    end

    subgraph User["Interação"]
        USER[Usuário]
        CONTROLS[Controles<br/>Avançar / Retroceder /<br/>Reiniciar / Ir para]
        INPUT_VAL[Entrada de<br/>Valores]
    end

    DIAGRAM --> VAL
    VAL --> AST
    AST --> GRAPH
    GRAPH --> CTL

    CTL --> INTERP
    INTERP <--> MEM
    MEM --> SNAP
    SNAP --> DT

    INTERP --> EXP
    INTERP --> CODE
    CTL --> HIGHLIGHT

    USER --> CONTROLS
    CONTROLS --> CTL
    USER --> INPUT_VAL
    INPUT_VAL --> INTERP

    style Engine fill:#bbf,stroke:#333,stroke-width:2px
    style Parser fill:#dfd,stroke:#333
    style Output fill:#fdf,stroke:#333
```

O motor de execução é composto por quatro subsistemas que trabalham em conjunto:

### Controlador de Fluxo

Responsável por determinar qual bloco deve ser executado a cada passo. Ele percorre o grafo de execução seguindo as arestas, avaliando condições em blocos de decisão e gerenciando laços de repetição.

Funcionalidades:
- Navegação sequencial entre blocos;
- Avaliação de expressões condicionais para desvios;
- Gerenciamento de iteração em laços (Enquanto, Para);
- Detecção de término de execução.

### Interpretador de Blocos

Responsável por executar a operação específica de cada tipo de bloco. Cada tipo de bloco possui um handler especializado que sabe como interpretar sua operação.

Tipos de blocos interpretados:

| Tipo de Bloco | Operação |
|----------------|----------|
| Início | Marca o ponto de partida |
| Entrada | Solicita valor ao usuário e armazena em variável |
| Processo | Executa expressão de atribuição |
| Decisão | Avalia condição booleana |
| Enquanto | Avalia condição e controla loop |
| Para | Inicializa, testa e incrementa variável de controle |
| Saída | Exibe valor ou mensagem |
| Término | Finaliza a execução |

### Gerenciador de Memória

Mantém o estado atual de todas as variáveis do algoritmo durante a execução.

Estrutura:

```json
{
  "variables": {
    "n": 10,
    "soma": 15,
    "contador": 3
  },
  "initialized_at": ["n", "soma", "contador"],
  "types": {
    "n": "number",
    "soma": "number",
    "contador": "number"
  }
}
```

Operações:
- **Inicializar variável**: registra nova variável com seu valor inicial;
- **Atualizar variável**: modifica o valor de uma variável existente;
- **Consultar variável**: retorna o valor corrente de uma variável;
- **Verificar inicialização**: valida se a variável foi inicializada antes do uso.

### Gerador de Snapshots

A cada passo da execução, o sistema captura o estado completo e o armazena como um snapshot imutável.

Estrutura de um snapshot:

```json
{
  "step": 3,
  "block_id": "3",
  "block_type": "process",
  "operation": "soma = n + 10",
  "timestamp": 1710456789000,
  "variables": {
    "n": 10,
    "soma": 20
  },
  "output": null,
  "explanation": "Atribuindo à variável 'soma' o valor de 'n' (10) + 10, resultando em 20."
}
```

O conjunto de snapshots forma o histórico completo da execução, permitindo navegação bidirecional entre passos.

---

## 10.2. Fluxo de Execução Detalhado

```mermaid
sequenceDiagram
    participant User as Usuário
    participant UI as Interface
    participant Engine as Motor de Execução
    participant Memory as Memória
    participant Snapshots as Snapshots

    User->>UI: Clicar "Avançar"
    UI->>Engine: nextStep()
    Engine->>Engine: Identifica próximo bloco
    Engine->>Engine: Interpreta operação do bloco

    alt Bloco de Entrada
        Engine->>UI: Solicitar valor
        UI->>User: Exibir prompt
        User->>UI: Informar valor
        UI->>Engine: Fornecer valor
    end

    Engine->>Memory: Atualizar variáveis
    Memory->>Snapshots: Registrar snapshot
    Snapshots->>Engine: Snapshot registrado
    Engine->>UI: Retornar novo estado
    UI->>UI: Atualizar teste de mesa
    UI->>UI: Destacar bloco atual
    UI->>UI: Atualizar explicação
    UI->>User: Exibir resultado
```

Cada interação do usuário com os controles de execução dispara uma sequência de operações no motor.

---

## 10.3. Pipeline de Processamento

O pipeline completo de processamento de um diagrama até a geração dos resultados didáticos segue as etapas abaixo:

```mermaid
flowchart LR
    A[JSON do<br/>Diagrama] --> B[Parser<br/>Validação]
    B --> C{Caso Válido?}
    C -->|Sim| D[Construção<br/>do Grafo]
    C -->|Não| E[Erro<br/>Estrutural]
    D --> F[Execução<br/>Passo a Passo]
    F --> G[Snapshot<br/>da Memória]
    G --> H[Atualizar<br/>Teste de Mesa]
    G --> I[Gerar<br/>Explicação]
    H --> J{Avançar?}
    I --> J
    J -->|Sim| F
    J -->|Não| K[Aguardar<br/>Usuário]
    K --> J

    style C fill:#ffd,stroke:#333
    style J fill:#ffd,stroke:#333
```

---

## 10.4. Teste de Mesa (Desk Check Table)

O teste de mesa é a representação tabular da execução do algoritmo, construída automaticamente a partir da sequência de snapshots registrados.

Cada linha do teste de mesa registra:

- **Passo**: número sequencial da execução;
- **Bloco**: identificador e tipo do bloco executado;
- **Operação**: descrição textual da operação realizada pelo bloco;
- **Variáveis**: valores de **todas** as variáveis após a execução do passo (cada variável em sua coluna);
- **Saída**: resultado produzido (para blocos de saída de dados);

Exemplo de teste de mesa gerado:

| Passo | Bloco | Operação | n | soma | contador | Saída |
|-------|-------|----------|---|---|----------|-------|
| 1 | Início | Iniciar algoritmo | - | - | - | - |
| 2 | Entrada | Ler valor para n | 10 | - | - | - |
| 3 | Processo | soma = n + 10 | 10 | 20 | - | - |
| 4 | Saída | Exibir soma | 10 | 20 | - | 20 |
| 5 | Término | Finalizar execução | 10 | 20 | - | - |

As colunas de variáveis são dinâmicas: novas colunas aparecem conforme variáveis são criadas durante a execução.

---

## 10.5. Geração de Explicações

Cada snapshot inclui uma explicação textual gerada automaticamente. A explicação é contextual e depende do tipo de bloco executado:

- **Entrada**: "Solicitando ao usuário um valor para a variável 'n'.";
- **Processo**: "Calculando a expressão 'soma = n + 10': substituindo 'n' por 10, obtendo soma = 20.";
- **Decisão**: "Avaliando condição 'n > 5': como 10 > 5 é verdadeiro, seguindo pelo ramo SIM.";
- **Saída**: "Exibindo o valor da variável 'soma': 20.";
- **Enquanto**: "Iniciando iteração: condição 'contador < 5' é verdadeira (contador = 0), executando corpo do laço.";

---

## 10.6. Sistema de Navegação entre Passos

O sistema permite que o usuário navegue livremente pelo histórico da execução:

- **Avançar (next)**: executa o próximo bloco e adiciona um novo snapshot ao histórico;
- **Retroceder (prev)**: restaura o estado a partir do snapshot anterior (o snapshot atual não é descartado);
- **Reiniciar (reset)**: descarta todos os snapshots e reinicia a execução a partir do bloco inicial;
- **Ir para passo N**: restaura o estado exato do snapshot N, permitindo que o usuário "pule" para qualquer ponto da execução.

A navegação não altera os snapshots já registrados, garantindo a integridade do histórico de execução.

---

## 10.7. Detecção de Erros

O sistema detecta e reporta dois tipos de erros:

### Erros Estruturais (pré-execução)

- Ausência de bloco de início ou término;
- Blocos desconectados do fluxo principal;
- Blocos de decisão com número incorreto de arestas de saída;
- Laços sem bloco de término ou condição adequada.

### Erros de Execução (durante a simulação)

- Uso de variável não inicializada;
- Divisão por zero;
- Expressões inválidas ou malformadas;
- Tipo de dado incompatível com a operação;
- Limite máximo de passos excedido (proteção contra loop infinito).

Quando um erro é detectado, a execução é interrompida e uma mensagem descritiva é exibida ao usuário, indicando o bloco onde o erro ocorreu e a natureza do problema.

---

## 10.8. Conversão para Código

Além da execução visual, o Blade realiza a conversão do algoritmo para código-fonte.

Cada bloco do diagrama possui um equivalente na linguagem de programação.

Exemplos:

| Bloco | Código |
|--------|--------|
| Processo | Atribuição |
| Decisão | if |
| Enquanto | while |
| Para | for |
| Entrada | Entrada de dados |
| Saída | Impressão de dados |

O objetivo é facilitar a transição entre programação visual e programação textual.

# 11. Divisão dos Módulos

Para fins de desenvolvimento do Trabalho de Conclusão de Curso, a plataforma foi dividida em dois módulos.

## Módulo de Construção

Responsável:
**Emanuel Oliveira Andrade**

Escopo:

- Editor visual;
- Inserção de blocos;
- Conexões;
- Modelagem do algoritmo.

---

## Módulo de Execução

Responsável:
**Lucas Gontarz Fajardo**

Escopo:

- Interpretação;
- Execução passo a passo;
- Teste de mesa;
- Atualização da memória;
- Explicação da execução;
- Conversão para código.

Embora desenvolvidos separadamente, ambos os módulos compõem uma única aplicação.

---

# 12. Considerações Finais

A arquitetura proposta para o Blade foi organizada de forma modular, permitindo a separação entre a construção dos algoritmos e sua execução.

Essa divisão reduz o acoplamento entre os componentes, facilita futuras manutenções e possibilita a evolução independente de cada módulo.

Além disso, a arquitetura favorece a expansão da plataforma, permitindo a inclusão de novos blocos, novas linguagens de programação e novas funcionalidades sem alterações significativas na estrutura principal do sistema.