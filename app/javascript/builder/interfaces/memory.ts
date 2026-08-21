import type { IVariable } from "./execution"

export interface IMemoryCheckpointEntry {
  name: string
  type: string
  value: string | null
  isArray: boolean
  arraySize: number
  elements: Array<string | null>
}

export interface IMemoryCheckpoint {
  entries: IMemoryCheckpointEntry[]
}

export interface IMemory {
  has(name: string): boolean
  get(name: string): string | null
  set(name: string, value: string): void
  declare(name: string, type: string): void
  isDeclared(name: string): boolean
  isInitialized(name: string): boolean
  getType(name: string): string | null
  setIndex(arrayName: string, index: number, value: string): void
  getIndex(arrayName: string, index: number): string | null
  getLength(arrayName: string): number
  snapshot(): IVariable[]
  createCheckpoint(): IMemoryCheckpoint
  restore(checkpoint: IMemoryCheckpoint): void
  reset(): void
}
