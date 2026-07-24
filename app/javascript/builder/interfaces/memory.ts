export interface IMemory {
  has(name: string): boolean
  get(name: string): string | null
  set(name: string, value: string): void
  declare(name: string, type: string): void
}
