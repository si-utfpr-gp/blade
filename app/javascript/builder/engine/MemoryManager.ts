import type { IMemory, VarEntry } from "../interfaces/memory";
import type { IVariable } from "../interfaces/execution";

export const VALID_TYPES = ["inteiro", "real", "caractere", "logico"] as const;
export type VarType = typeof VALID_TYPES[number];

function isValidType(type: string): type is VarType {
  return VALID_TYPES.includes(type as VarType);
}

export class MemoryManager implements IMemory {
  private vars = new Map<string, VarEntry>();

  public declare(name: string, type: string): void {
    if (!isValidType(type)) {
      throw new Error(
        `Tipo inválido: '${type}'. Tipos válidos: ${VALID_TYPES.join(", ")}`,
      );
    }
    const arrayMatch = name.match(/^(\w+)\[(-?\d+)\]$/);
    if (arrayMatch) {
      const varName = arrayMatch[1];
      const size = parseInt(arrayMatch[2], 10);
      if (size <= 0) {
        throw new Error(`Tamanho de array inválido: ${size}`);
      }
      if (this.vars.has(varName)) return;
      this.vars.set(varName, {
        type: type as VarType,
        value: null,
        isArray: true,
        arraySize: size,
        elements: new Array<string | null>(size).fill(null),
      });
    } else {
      if (this.vars.has(name)) return;
      this.vars.set(name, {
        type: type as VarType,
        value: null,
        isArray: false,
        arraySize: 0,
        elements: [],
      });
    }
  }

  public isDeclared(name: string): boolean {
    return this.vars.has(name);
  }

  public has(name: string): boolean {
    return this.isDeclared(name);
  }

  public get(name: string): string | null {
    const entry = this.vars.get(name);
    if (!entry) throw new Error(`Variável '${name}' não declarada`);
    if (entry.isArray) {
      throw new Error(`Variável '${name}' é um array. Use índice para acessar.`);
    }
    return entry.value;
  }

  public set(name: string, value: string): void {
    const entry = this.vars.get(name);
    if (!entry) throw new Error(`Variável '${name}' não declarada`);
    if (entry.isArray) {
      throw new Error(`Variável '${name}' é um array. Use índice para atribuir.`);
    }
    entry.value = value;
  }

  public getIndex(arrayName: string, index: number): string | null {
    const entry = this.vars.get(arrayName);
    if (!entry) throw new Error(`Array '${arrayName}' não declarado`);
    if (!entry.isArray) throw new Error(`'${arrayName}' não é um array`);
    if (index < 0 || index >= entry.arraySize) {
      throw new Error(
        `Índice ${index} fora dos limites. ${arrayName} tem ${entry.arraySize} elementos.`,
      );
    }
    return entry.elements[index];
  }

  public setIndex(arrayName: string, index: number, value: string): void {
    const entry = this.vars.get(arrayName);
    if (!entry) throw new Error(`Array '${arrayName}' não declarado`);
    if (!entry.isArray) throw new Error(`'${arrayName}' não é um array`);
    if (index < 0 || index >= entry.arraySize) {
      throw new Error(
        `Índice ${index} fora dos limites. ${arrayName} tem ${entry.arraySize} elementos.`,
      );
    }
    entry.elements[index] = value;
  }

  public getLength(arrayName: string): number {
    const entry = this.vars.get(arrayName);
    if (!entry) throw new Error(`Array '${arrayName}' não declarado`);
    if (!entry.isArray) return 0;
    return entry.arraySize;
  }

  public isInitialized(name: string): boolean {
    const entry = this.vars.get(name);
    if (!entry) return false;
    if (entry.isArray) {
      return entry.elements.some(e => e !== null);
    }
    return entry.value !== null;
  }

  public getType(name: string): string | null {
    return this.vars.get(name)?.type ?? null;
  }

  public snapshot(): IVariable[] {
    const result: IVariable[] = [];
    for (const [name, entry] of this.vars) {
      if (entry.isArray) {
        for (let i = 0; i < entry.arraySize; i++) {
          result.push({
            name: `${name}[${i}]`,
            value: entry.elements[i],
            type: entry.type,
            scope: "global",
          });
        }
      } else {
        result.push({
          name,
          value: entry.value,
          type: entry.type,
          scope: "global",
        });
      }
    }
    return result;
  }

  public reset(): void {
    this.vars.clear();
  }
}
