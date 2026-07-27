import type { VarType } from "../engine/MemoryManager";
import type { IVariable } from "./execution";

export interface VarEntry {
  type: VarType;
  value: string | null;
  isArray: boolean;
  arraySize: number;
  elements: (string | null)[];
}

export interface IMemory {
  has(name: string): boolean;
  get(name: string): string | null;
  set(name: string, value: string): void;
  declare(name: string, type: string): void;
  isDeclared(name: string): boolean;
  isInitialized(name: string): boolean;
  getType(name: string): string | null;
  setIndex(arrayName: string, index: number, value: string): void;
  getIndex(arrayName: string, index: number): string | null;
  getLength(arrayName: string): number;
  snapshot(): IVariable[];
  reset(): void;
}
