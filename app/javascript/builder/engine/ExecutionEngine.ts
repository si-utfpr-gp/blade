import type { IVariable, IExecutionStep } from "../interfaces/execution";
import type { IParserData, IParserNode } from "../parser/types";

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

    public snapshot(): IVariable[] {
        return Array.from(this.vars.entries()).map(([k, v]) => ({
            name: k,
            value: v.value,
            type: v.type,
            scope: "global",
        }));
    }

    reset(): void { this.vars.clear() }
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
            if (!this.memory.has(target.trim())) this.memory.declare(target.trim(), "desconhecido");
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
    private expr = new ExprEvaluator(this.memory);
    private steps: IExecutionStep[] = [];
    private _idx = -1;
    private outputs: string[] = [];
    private _err: string | null = null;
    private _done = false;
    private current: string | null = null;
    private max = 10000;

    public constructor(private graph: IParserData) { }

    public start(): IExecutionStep | null {
        this.reset();
        this.current = this.graph.startNodeId;
        if (!this.current) {
            this._err = "Nenhum bloco de início"; return null;
        }
        return this.advance();
    }

    public step(input?: string): IExecutionStep | null {
        if (this._done || !this.current) return null
        if (this.steps.length >= this.max) { this._err = "Limite de passos excedido"; return null }
        while (this.current) {
            const node = this.graph.nodes.get(this.current)
            if (!node) { this._err = `Bloco '${this.current}' não encontrado`; return null }
            if (node.type === "memory") { this.processMemory(node); this.current = this.graph.getNextNode(this.current); continue }
            if (node.type === "connector") { this.current = this.graph.getNextNode(this.current); continue }
            break
        }
        if (!this.current) return null
        const node = this.graph.nodes.get(this.current)
        if (!node) { this._err = `Bloco '${this.current}' não encontrado`; return null }
        try {
            const s = this.exec(node, input)
            if (s) { this.steps.push(s); this._idx = this.steps.length - 1 }
            this.current = this.next(node)
            if (this.current === null && node.type === "startEnd" && node.variant === "end") this._done = true
            return s
        } catch (e) { this._err = e instanceof Error ? e.message : "Erro"; throw e }
    }

    public goToStep(i: number): void {
        if (i < 0 || i >= this.steps.length) return
        this._idx = i;
        this.current = this.steps[i].nodeId;
        this._err = null;
        this._done = false;
    }

    public reset(): void {
        this.memory.reset();
        this.steps = [];
        this._idx = -1;
        this.outputs = [];
        this._err = null;
        this._done = false;
        this.current = null;
    }

    public getSteps(): IExecutionStep[] { return this.steps; }

    public get currentStepIndex(): number { return this._idx; }

    public getCurretnOutputs(): string[] { return this.outputs; }

    public getCurrentState() {
        return {
            currentNodeId: this.current,
            variables: new Map(this.memory.snapshot().map(v => [v.name, v])),
            steps: this.steps, logs: this.steps.map(s => s.log), outputs: this.outputs,
            finished: this._done, error: this._err,
            inputQueue: [], inputIndex: 0, stepCount: this.steps.length,
        }
    }

    private advance(): IExecutionStep | null {
        while (this.current) {
            const node = this.graph.nodes.get(this.current)
            if (!node) break
            if (node.type === "memory") { this.processMemory(node); this.current = this.graph.getNextNode(this.current); continue }
            if (node.type === "connector") { this.current = this.graph.getNextNode(this.current); continue }
            try {
                const s = this.exec(node)
                if (s) { this.steps.push(s); this._idx = this.steps.length - 1 }
                this.current = this.next(node); return s
        } catch (e) { this._err = e instanceof Error ? e.message : "Erro"; throw e }
        }
        return null
    }


    private exec(node: IParserNode, input?: string): IExecutionStep | null {
        const base = (): IExecutionStep => ({
            nodeId: node.id, nodeLabel: node.label ?? "", nodeType: node.type,
            variables: this.memory.snapshot(), log: "", output: undefined,
            waitingForInput: false, inputPrompt: undefined, inputType: undefined,
            explanation: "", changes: [], nextHint: "",
        })

        switch (node.type) {
            case "startEnd":
                if (node.variant === "start") return { ...base(), log: "Iniciando o algoritmo.", explanation: "Iniciando o algoritmo.", nextHint: "Avançar." }
                if (node.variant === "end") return { ...base(), log: "Algoritmo finalizado.", explanation: "Algoritmo finalizado.", nextHint: "Concluído." }
                return null

            case "memory": return null

            case "input":
                if (input === undefined) return { ...base(), waitingForInput: true, inputPrompt: `Valor para '${node.label}':`, log: `Solicitando ${node.label}.`, explanation: `Aguardando valor para '${node.label}'.`, nextHint: `Informe o valor.` }
                if (!this.memory.has(node.label ?? "")) this.memory.declare(node.label ?? "", "desconhecido")
                this.memory.set(node.label ?? "", input)
                return { ...base(), log: `Lendo ${node.label}.`, explanation: `Armazenando '${input}' em '${node.label}'.`, changes: [`${node.label} = ${input}`], nextHint: "Avançar." }

            case "output": {
                const v = this.expr.output(node.label ?? "")
                this.outputs.push(v)
                return { ...base(), output: v, log: `Exibindo ${node.label}.`, explanation: `Resultado: ${v}.`, changes: [`Saída: ${v}`], nextHint: "Avançar." }
            }

            case "process": {
                const changes = this.expr.assign(node.label ?? "")
                return { ...base(), variables: this.memory.snapshot(), log: node.label ?? "", changes, explanation: changes.length === 1 ? `${changes[0]}.` : `Múltiplos: ${changes.join("; ")}.`, nextHint: "Avançar." }
            }

            case "decision": {
                const cond = node.label ?? ""
                const ok = this.expr.condition(cond)
                return { ...base(), log: `${cond} → ${ok ? "V" : "F"}`, changes: [`Decisão: ${ok ? "VERDADEIRO" : "FALSO"}`], explanation: `'${cond}' é ${ok ? "verdadeiro" : "falso"}.`, nextHint: `Seguindo ${ok ? "VERDADEIRO" : "FALSO"}.` }
            }

            case "connector": return null

            case "subroutine": {
                const sub = node.label ?? "sub-rotina"
                return { ...base(), log: `Chamando ${sub}.`, explanation: `Chamando '${sub}'.`, changes: [`Chamada: ${sub}`], nextHint: "Retornando." }
            }

            default: throw new Error(`Bloco desconhecido: '${node.type}'`)
        }
    }

    private processMemory(node: IParserNode): void {
        node.rows?.forEach(r => r.variables.split(",").map(v => v.trim()).forEach(v => this.memory.declare(v, r.type)))
    }

    private next(node: IParserNode): string | null {
        if (node.type === "decision") return this.graph.getNextNode(node.id, this.expr.condition(node.label ?? "") ? "yes" : "no")
        return this.graph.getNextNode(node.id)
    }

}
