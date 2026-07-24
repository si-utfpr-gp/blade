# Memory Manager: Variable Declaration and Manipulation

**Issue:** [#54](https://github.com/si-utfpr-gp/blade/issues/54)
**Data:** 2026-07-24
**Status:** Draft

---

## 1. Contexto

O Execution Engine precisa de um gerenciador de memória para manter o estado das
variáveis durante a execução do algoritmo. Atualmente existe uma classe
`MemoryManager` privada dentro de `ExecutionEngine.ts` com funcionalidade
básica, mas sem suporte a tipos, arrays, validações, e sem testes isolados.

Este spec descreve a extração e evolução do `MemoryManager` seguindo o mesmo
padrão usado no `ExprEvaluator` (arquivo próprio, interface, testes).

---

## 2. Estado Atual

### 2.1 MemoryManager (dentro de ExecutionEngine.ts)

```typescript
class MemoryManager {
    private vars = new Map<string, { type: string; value: string | null }>()

    declare(name: string, type: string): void
    set(name: string, value: string): void
    get(name: string): string | null
    has(name: string): boolean
    isInitialized(name: string): boolean
    snapshot(): IVariable[]
    reset(): void
}
```

Problemas:
- Classe privada, não exportada, não testável isoladamente
- `has()` serve como `isDeclared()` mas não implementa o método nomeado
- Tipos são string livre — sem validação
- Arrays são chave única (`notas[5]` vira `notas` no Map), sem armazenamento
  por índice
- Sem validação de índice fora dos limites
- `snapshot()` retorna `type: string` sem tipagem restrita
- `declare()` dentro de `processMemory()` usa `r.type` direto do parser sem
  validar o tipo

### 2.2 IMemory (interfaces/memory.ts)

```typescript
export interface IMemory {
  has(name: string): boolean
  get(name: string): string | null
  set(name: string, value: string): void
  declare(name: string, type: string): void
}
```

Problemas:
- Interface minimalista, sem `isDeclared()`, `isInitialized()`, `snapshot()`,
  `reset()`
- MemoryManager tem métodos a mais que a interface — perde o benefício do
  contrato explícito

### 2.3 Consumidores

- `ExprEvaluator.ts`: recebe `IMemory` no construtor, usa `has()`, `get()`,
  `set()`, `declare()`
- `ExecutionEngine.ts`: instancia `MemoryManager` diretamente, usa
  `processMemory()`, `exec()`, `reset()`
- `SimulatorTrace.tsx`: consome `IVariable[]` via snapshot (não o MemoryManager
  diretamente)

---

## 3. Design Proposto

### 3.1 IMemory — Interface Estendida

```typescript
// app/javascript/builder/interfaces/memory.ts

export interface IMemory {
  /** Verifica se a variável foi declarada */
  has(name: string): boolean

  /** Retorna o valor atual (null se não inicializada) */
  get(name: string): string | null

  /** Atribui valor a uma variável já declarada */
  set(name: string, value: string): void

  /** Declara uma nova variável com nome e tipo */
  declare(name: string, type: string): void

  /** Retorna true se a variável foi declarada */
  isDeclared(name: string): boolean

  /** Retorna true se a variável foi inicializada (valor !== null) */
  isInitialized(name: string): boolean

  /** Retorna o tipo da variável ou null se não declarada */
  getType(name: string): string | null

  /** Atribui valor a um índice específico de um array */
  setIndex(arrayName: string, index: number, value: string): void

  /** Retorna o valor de um índice específico de um array */
  getIndex(arrayName: string, index: number): string | null

  /** Retorna o tamanho do array (0 se não for array) */
  getLength(arrayName: string): number

  /** Retorna snapshot de todas as variáveis para o execution step */
  snapshot(): IVariable[]

  /** Limpa todas as variáveis */
  reset(): void
}
```

### 3.2 Tipos Válidos

```typescript
// app/javascript/builder/engine/types.ts

export const VALID_TYPES = ["inteiro", "real", "caractere", "logico"] as const
export type VarType = typeof VALID_TYPES[number]

export function isValidType(type: string): type is VarType {
  return VALID_TYPES.includes(type as VarType)
}
```

### 3.3 MemoryManager

```typescript
// app/javascript/builder/engine/MemoryManager.ts

interface VarEntry {
  type: VarType
  value: string | null
  isArray: boolean
  arraySize: number
  elements: (string | null)[]
}

export class MemoryManager implements IMemory {
  private vars = new Map<string, VarEntry>()

  // --- Declaração ---

  declare(name: string, type: string): void {
    // 1. Valida tipo
    if (!isValidType(type)) {
      throw new Error(`Tipo inválido: '${type}'. Tipos válidos: ${VALID_TYPES.join(", ")}`)
    }
    // 2. Detecta array: "notas[5]" → name="notas", size=5
    const arrayMatch = name.match(/^(\w+)\[(\d+)\]$/)
    if (arrayMatch) {
      const varName = arrayMatch[1]
      const size = parseInt(arrayMatch[2], 10)
      if (size <= 0) throw new Error(`Tamanho de array inválido: ${size}`)
      this.vars.set(varName, {
        type: type as VarType,
        value: null,
        isArray: true,
        arraySize: size,
        elements: new Array(size).fill(null),
      })
    } else {
      // 3. Variável simples
      this.vars.set(name, {
        type: type as VarType,
        value: null,
        isArray: false,
        arraySize: 0,
        elements: [],
      })
    }
  }

  isDeclared(name: string): boolean {
    return this.vars.has(name)
  }

  has(name: string): boolean {
    return this.isDeclared(name)
  }

  // --- Leitura/Escrita ---

  get(name: string): string | null {
    const entry = this.vars.get(name)
    if (!entry) throw new Error(`Variável '${name}' não declarada`)
    if (entry.isArray) {
      throw new Error(`Variável '${name}' é um array. Use índice para acessar.`)
    }
    return entry.value
  }

  set(name: string, value: string): void {
    const entry = this.vars.get(name)
    if (!entry) throw new Error(`Variável '${name}' não declarada`)
    if (entry.isArray) {
      throw new Error(`Variável '${name}' é um array. Use índice para atribuir.`)
    }
    entry.value = value
  }

  getIndex(arrayName: string, index: number): string | null {
    const entry = this.vars.get(arrayName)
    if (!entry) throw new Error(`Array '${arrayName}' não declarado`)
    if (!entry.isArray) throw new Error(`'${arrayName}' não é um array`)
    if (index < 0 || index >= entry.arraySize) {
      throw new Error(`Índice ${index} fora dos limites. ${arrayName} tem ${entry.arraySize} elementos.`)
    }
    return entry.elements[index]
  }

  setIndex(arrayName: string, index: number, value: string): void {
    const entry = this.vars.get(arrayName)
    if (!entry) throw new Error(`Array '${arrayName}' não declarado`)
    if (!entry.isArray) throw new Error(`'${arrayName}' não é um array`)
    if (index < 0 || index >= entry.arraySize) {
      throw new Error(`Índice ${index} fora dos limites. ${arrayName} tem ${entry.arraySize} elementos.`)
    }
    entry.elements[index] = value
  }

  getLength(arrayName: string): number {
    const entry = this.vars.get(arrayName)
    if (!entry) throw new Error(`Array '${arrayName}' não declarado`)
    if (!entry.isArray) return 0
    return entry.arraySize
  }

  // --- Estado ---

  isInitialized(name: string): boolean {
    const entry = this.vars.get(name)
    if (!entry) return false
    if (entry.isArray) {
      return entry.elements.some(e => e !== null)
    }
    return entry.value !== null
  }

  getType(name: string): string | null {
    return this.vars.get(name)?.type ?? null
  }

  // --- Snapshot ---

  snapshot(): IVariable[] {
    const result: IVariable[] = []
    for (const [name, entry] of this.vars) {
      if (entry.isArray) {
        entry.elements.forEach((val, idx) => {
          result.push({
            name: `${name}[${idx}]`,
            value: val,
            type: entry.type,
            scope: "global",
          })
        })
      } else {
        result.push({
          name,
          value: entry.value,
          type: entry.type,
          scope: "global",
        })
      }
    }
    return result
  }

  // --- Reset ---

  reset(): void {
    this.vars.clear()
  }
}
```

### 3.4 Mudanças na IVariable

O snapshot atual usa `IVariable` com `type: string`. Com a validação de tipos,
`type` continua sendo string na interface (para compatibilidade com o frontend),
mas o MemoryManager garante que só valores válidos sejam armazenados.

**Nenhuma mudança necessária em `interfaces/execution.ts`.**

### 3.5 Integração com ExecutionEngine

Substituir a classe privada `MemoryManager` pelo import do novo arquivo:

```typescript
// engine/ExecutionEngine.ts — antes
class MemoryManager { ... }  // removido

export class ExecutionEngine {
    private memory = new MemoryManager();  // continua igual
    ...
}
```

```typescript
// engine/ExecutionEngine.ts — depois
import { MemoryManager } from "./MemoryManager";

export class ExecutionEngine {
    private memory = new MemoryManager();
    ...
}
```

O `processMemory()` precisa ser atualizado para usar a declaração com tipo
válido (já que `declare()` agora valida o tipo):

```typescript
private processMemory(node: IParserNode): void {
    node.rows?.forEach(r =>
        r.variables.split(",").map(v => v.trim()).forEach(v => {
            // Parser já fornece o tipo: "inteiro", "real", etc.
            this.memory.declare(v, r.type)
        })
    )
}
```

Isso já funciona porque o parser gera `r.type` com os valores do SSD
("inteiro", "real", "caractere", "logico"). A validação agora rejeitará
tipos inválidos.

### 3.6 Atualização do ExprEvaluator

O `ExprEvaluator` atualmente acessa arrays via regex `^[a-zA-Z_]\w*(\[\d+\])?`.
Isso captura `notas[0]` e chama `memory.get("notas[0]")`, que falha no novo
MemoryManager (que espera `getIndex("notas", 0)`).

**Mudança necessária no `resolve()` do ExprEvaluator:**

```typescript
const varMatch = expr.slice(i).match(/^[a-zA-Z_]\w*(\[\d+\])?/)
if (varMatch) {
    const full = varMatch[0]  // ex: "notas[0]"
    const arrayAccess = full.match(/^(\w+)\[(\d+)\]$/)
    let val: string | null
    if (arrayAccess) {
        const arrName = arrayAccess[1]
        const idx = parseInt(arrayAccess[2], 10)
        if (!this.memory.has(arrName)) throw new Error(`Array '${arrName}' não declarado`)
        val = this.memory.getIndex(arrName, idx)
    } else {
        if (!this.memory.has(full)) throw new Error(`Variável '${full}' não declarada`)
        val = this.memory.get(full)
    }
    if (val === null) throw new Error(`Variável '${varName(varMatch[0])}' não inicializada`)
    // ... continua igual (escape de string, etc.)
}
```

---

## 4. Plano de Implementação

### Fase 1: Interface e Tipos

1. Estender `IMemory` em `interfaces/memory.ts` com:
   - `isDeclared()`, `isInitialized()`, `getType()`
   - `setIndex()`, `getIndex()`, `getLength()`
   - `snapshot()`, `reset()`

2. Criar `engine/types.ts` com constantes e validação de tipos

### Fase 2: MemoryManager

3. Criar `engine/MemoryManager.ts` com implementação completa
4. Suporte a variáveis simples (declare, set, get, isDeclared, isInitialized)
5. Suporte a arrays (declare com `nome[tamanho]`, setIndex, getIndex, getLength)
6. Validação de tipos na declaração
7. Snapshot que expande arrays em múltiplas IVariable entries (`notas[0]`, `notas[1]`, etc.)
8. Reset

### Fase 3: Integração

9. Remover classe privada `MemoryManager` de `ExecutionEngine.ts`
10. Adicionar `import { MemoryManager } from "./MemoryManager"`
11. Atualizar `ExprEvaluator.resolve()` para usar `getIndex()` em vez de `get()`
    para acesso a arrays
12. Atualizar barrel export em `engine/index.ts`

### Fase 4: Testes

13. Criar `__tests__/engine/MemoryManager.test.ts` com testes para:
    - Declaração de variável simples
    - Declaração de array
    - Tipo inválido rejeitado
    - set/get de variável simples
    - setIndex/getIndex de array
    - getLength de array
    - Índice fora dos limites
    - Acesso a array sem índice (erro)
    - Acesso a variável simples com índice (erro)
    - Uso de variável não declarada
    - isDeclared / isInitialized
    - getType
    - Snapshot (simples e array)
    - Reset
    - Múltiplas declarações
    - Edge cases: array size 0, negative index, etc.
14. Verificar que todos os 92+ testes existentes continuam passando

---

## 5. Casos de Erro

| Situação | Comportamento |
|----------|---------------|
| Declarar com tipo inválido | `throw Error("Tipo inválido: 'x'")` |
| Usar variável não declarada | `throw Error("Variável 'x' não declarada")` |
| Acessar array sem índice (`get("notas")`) | `throw Error("'notas' é um array")` |
| Acessar simples com índice (`getIndex("x", 0)`) | `throw Error("'x' não é um array")` |
| Índice negativo ou >= size | `throw Error("Índice N fora dos limites")` |
| Array size <= 0 | `throw Error("Tamanho de array inválido")` |

---

## 6. Observações

- `IMemory` estendida MAS `snapshot()` e `reset()` ficam na interface para
  permitir que o ExecutionEngine use o MemoryManager polimorficamente
- `IVariable` não precisa de mudanças — o tipo continua como string na
  interface, o MemoryManager garante a validade internamente
- O `ExprEvaluator` continua recebendo `IMemory`, não `MemoryManager`
  diretamente — o acoplamento fica baixo
- Os snapshots de arrays expandem cada índice como uma `IVariable` separada
  (`notas[0]`, `notas[1]`) para compatibilidade com a tabela de teste de mesa
  existente
