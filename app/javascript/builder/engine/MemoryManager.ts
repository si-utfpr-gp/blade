import type { IMemory } from "../interfaces/memory"
import type { IVariable } from "../interfaces/execution"
import { isValidType, type VarType, VALID_TYPES } from "./types"

interface VarEntry {
  type: VarType
  value: string | null
  isArray: boolean
  arraySize: number
  elements: (string | null)[]
}

export class MemoryManager implements IMemory {
  private vars = new Map<string, VarEntry>()

  declare(name: string, type: string): void {
    if (!isValidType(type)) {
      throw new Error(
        `Tipo inválido: '${type}'. Tipos válidos: ${VALID_TYPES.join(", ")}`
      )
    }
    const arrayMatch = name.match(/^(\w+)\[(-?\d+)\]$/)
    if (arrayMatch) {
      const varName = arrayMatch[1]
      const size = parseInt(arrayMatch[2], 10)
      if (size <= 0) {
        throw new Error(`Tamanho de array inválido: ${size}`)
      }
      if (this.vars.has(varName)) return
      this.vars.set(varName, {
        type: type as VarType,
        value: null,
        isArray: true,
        arraySize: size,
        elements: new Array<string | null>(size).fill(null),
      })
    } else {
      if (this.vars.has(name)) return
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
      throw new Error(
        `Índice ${index} fora dos limites. ${arrayName} tem ${entry.arraySize} elementos.`
      )
    }
    return entry.elements[index]
  }

  setIndex(arrayName: string, index: number, value: string): void {
    const entry = this.vars.get(arrayName)
    if (!entry) throw new Error(`Array '${arrayName}' não declarado`)
    if (!entry.isArray) throw new Error(`'${arrayName}' não é um array`)
    if (index < 0 || index >= entry.arraySize) {
      throw new Error(
        `Índice ${index} fora dos limites. ${arrayName} tem ${entry.arraySize} elementos.`
      )
    }
    entry.elements[index] = value
  }

  getLength(arrayName: string): number {
    const entry = this.vars.get(arrayName)
    if (!entry) throw new Error(`Array '${arrayName}' não declarado`)
    if (!entry.isArray) return 0
    return entry.arraySize
  }

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

  snapshot(): IVariable[] {
    const result: IVariable[] = []
    for (const [name, entry] of this.vars) {
      if (entry.isArray) {
        for (let i = 0; i < entry.arraySize; i++) {
          result.push({
            name: `${name}[${i}]`,
            value: entry.elements[i],
            type: entry.type,
            scope: "global",
          })
        }
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

  reset(): void {
    this.vars.clear()
  }
}
