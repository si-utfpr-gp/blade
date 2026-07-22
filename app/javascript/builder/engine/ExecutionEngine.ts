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

class ExprEvaluator {
    public constructor(private memory: MemoryManager) { }

    private resolve(expr: string): string {
        let out = "";
        let i = 0;

        while (i < expr.length) {
            if (expr[i] === '"' || expr[i] === "'") {
                const q = expr[i];
                let j = i + 1;
                while (j < expr.length && expr[j] !== q) j++
                out += expr.slice(i, j + 1); i = j + 1; continue;
            }
            const m = expr.slice(i).match(/^[a-zA-Z_]\w*(\[\d+\])?/);

            if (m) {
                const base = m[0].replace(/\[\d+\]$/, "");
                const full = m[0];
                if (!this.memory.has(base)) throw new Error(`Variável '${base}' não declarada`);
                const val = this.memory.get(full);
                if (val === null) throw new Error(`Variável '${base}' não inicializada`);
                out += val; i += m[0].length; continue;
            }
            if (/^[eE](?!\w)/.test(expr.slice(i))) { out += "&&"; i += 1; continue; };
            if (/^[oO][uU](?!\w)/.test(expr.slice(i))) { out += "||"; i += 2; continue; };
            if (/^[nN][aA][oO](?!\w)/.test(expr.slice(i))) { out += "!"; i += 3; continue; };
            if (/⁼=/.test(expr.slice(i))) { out += "==="; i += 2; continue; };
            if (/⁼=/.test(expr.slice(i))) { out += "!=="; i += 2; continue; };
            if (/⁼(?!\w)/.test(expr.slice(i))) { out += "==="; i += 1; continue; };
            out += expr[i]; i += 1;
        }
        return out;
    }

    public assign(expr: string): string[] {
        return expr.split(";").filter(Boolean).map(s => {
            const [target, ...rest] = s.trim().split("=");
            const src = rest.join("=").trim();
            const res = String(new Function(`return ${this.resolve(src)}`)());
            this.memory.set(target.trim(), res);
            return `${target.trim()} = ${res}`;
        });
    }

    public condition(expr: string): boolean {
        return Boolean(new Function(`return (${this.resolve(expr)
            .replace(/\bnao\s+/g, "!").replace(/\be\s+/g, "&&").replace(/\bou\s+/g, "||")
            .replace(/\bverdadeiro\b/g, "true").replace(/\bfalso\b/g, "false")})`)());
    }

    public output(expr: string): string {
        return String(new Function(`return ${this.resolve(expr)}`)());
    }
}


export class ExecutionEngine {
    private memory = new MemoryManager();
}
