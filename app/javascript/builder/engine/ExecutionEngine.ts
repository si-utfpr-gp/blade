import type { IVariable, IExecutionStep } from "../interfaces/execution";
import type { IParserData, IParserNode } from "../parser/types";
import { ExprEvaluator } from "./ExprEvaluator";
import { MemoryManager } from "./MemoryManager";
import { SnapshotManager } from "./SnapshotManager";

export class ExecutionEngine {
    private memory = new MemoryManager();
    private expr = new ExprEvaluator(this.memory);
    private snapshots = new SnapshotManager();
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
        if (this.snapshots.size >= this.max) { this._err = "Limite de passos excedido"; return null }
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
            if (s) { this.snapshots.store(s); }
            this.current = this.next(node)
            if (this.current === null && node.type === "startEnd" && node.variant === "end") this._done = true
            return s
        } catch (e) { this._err = e instanceof Error ? e.message : "Erro"; throw e }
    }

    public goToStep(i: number): void {
        const step = this.snapshots.getStep(i);
        if (!step) return;
        this.snapshots.goTo(i);
        this.current = step.nodeId;
        this._err = null;
        this._done = false;
    }

    public reset(): void {
        this.memory.reset();
        this.snapshots.reset();
        this.outputs = [];
        this._err = null;
        this._done = false;
        this.current = null;
    }

    public getSteps(): IExecutionStep[] { return this.snapshots.allSteps as IExecutionStep[]; }

    public get currentStepIndex(): number { return this.snapshots.currentIndex; }

    public getCurretnOutputs(): string[] { return this.outputs; }

    public getCurrentState() {
        return {
            currentNodeId: this.current,
            variables: new Map(this.memory.snapshot().map(v => [v.name, v])),
            steps: this.snapshots.allSteps as IExecutionStep[], logs: this.snapshots.allSteps.map(s => s.log), outputs: this.outputs,
            finished: this._done, error: this._err,
            inputQueue: [], inputIndex: 0, stepCount: this.snapshots.size,
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
                if (s) { this.snapshots.store(s); }
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
                if (!this.memory.has(node.label ?? "")) this.memory.declare(node.label ?? "", "caractere")
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
