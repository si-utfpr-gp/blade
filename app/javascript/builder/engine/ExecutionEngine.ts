import type { Variable } from "../interfaces/execution";

class MemoryManager {
    private vars = new Map<string, { type: string; value: string | null }>()


    public declare(name: string, type: string): void {
        const match = name.match(/^(\w+)\[(\d+)\]$/);
        this.vars.set(match?.[1] ?? name, { type, value: null })
    }

    public set(name: string, value: string): void {
        const key = name.replace(/\[\d+\]$/, "");
        const entry = this.vars.get(key);
        if (!entry) throw new Error(`Variável '${key}' não declara!`);
        entry.value = value
    }

    public get(name: string): string | null {
        return this.vars.get(name.replace(/\[\d+\]$/, ""))?.value ?? null;
    }

    public has(name: string): boolean {
        return this.vars.has(name.replace(/\[\d+\]$/, ""));
    }

    public isInitialized(name: string): boolean {
        return this.vars.get(name.replace(/\[\d+\]$/, ""))?.value !== null;
    }

    public snapshot(): Variable[] {
        return Array.from(this.vars.entries()).map(([k, v]) => ({
            name: k,
            value: v.value,
            type: v.type,
            scope: "global",
        }));
    }
}


export class ExecutionEngine {
    private memory = new MemoryManager();
}