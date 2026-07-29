import type { IVariable, IExecutionStep, IExplanationContext } from "../interfaces/execution";
import type { IParserData, IParserNode } from "../parser/types";
import { ExprEvaluator } from "./ExprEvaluator";
import { MemoryManager } from "./MemoryManager";
import { SnapshotManager } from "./SnapshotManager";
import { ExplanationGenerator } from "./ExplanationGenerator";
import { classifyError } from "./errors";

export class ExecutionEngine {
    private memory = new MemoryManager();
    private expr = new ExprEvaluator(this.memory);
    private snapshots = new SnapshotManager();
    private explanations = new ExplanationGenerator();
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
        } catch (e) {
          const structured = classifyError(e, this.current)
          this._err = structured.message
          throw e
        }
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
        } catch (e) {
          const structured = classifyError(e, this.current)
          this._err = structured.message
          throw e
        }
        }
        return null
    }


    private exec(node: IParserNode, input?: string): IExecutionStep | null {
        const base = (): IExecutionStep => ({
            nodeId: node.id, nodeLabel: node.label ?? "", nodeType: node.type,
            variables: this.memory.snapshot(), log: "", output: undefined,
            waitingForInput: false, inputPrompt: undefined, inputType: undefined,
            explanation: "", changes: [], nextHint: "",
        });

        switch (node.type) {
            case "startEnd": {
                if (node.variant !== "start" && node.variant !== "end") return null;
                const text = this.explanations.generate({
                    nodeType: node.type,
                    variant: node.variant,
                    nodeLabel: node.label ?? "",
                });
                return { ...base(), ...text };
            }

            case "memory": return null;

            case "input": {
                const ctx: IExplanationContext = {
                    nodeType: node.type,
                    nodeLabel: node.label ?? "",
                    inputValue: input,
                };
                if (input === undefined) {
                    const text = this.explanations.generate(ctx);
                    return { ...base(), waitingForInput: true, inputPrompt: `Valor para '${node.label}':`, ...text };
                }
                if (!this.memory.has(node.label ?? "")) this.memory.declare(node.label ?? "", "caractere");
                this.memory.set(node.label ?? "", input);
                const text = this.explanations.generate(ctx);
                return { ...base(), ...text };
            }

            case "output": {
                const v = this.expr.output(node.label ?? "", node.id);
                this.outputs.push(v);
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: node.label ?? "",
                    expressionResult: v,
                });
                return { ...base(), output: v, ...text };
            }

            case "process": {
                const changes = this.expr.assign(node.label ?? "", node.id);
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: node.label ?? "",
                    changes,
                });
                return { ...base(), variables: this.memory.snapshot(), ...text };
            }

            case "decision": {
                const cond = node.label ?? "";
                const ok = this.expr.condition(cond, node.id);
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: cond,
                    conditionResult: ok,
                });
                return { ...base(), ...text };
            }

            case "connector": return null;

            case "subroutine": {
                const sub = node.label ?? "sub-rotina";
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: sub,
                    subroutineName: sub,
                });
                return { ...base(), ...text };
            }

            default: throw new Error(`Bloco desconhecido: '${node.type}'`);
        }
    }

    private processMemory(node: IParserNode): void {
        node.rows?.forEach(r => r.variables.split(",").map(v => v.trim()).forEach(v => this.memory.declare(v, r.type)))
    }

    private next(node: IParserNode): string | null {
        if (node.type === "decision") return this.graph.getNextNode(node.id, this.expr.condition(node.label ?? "", node.id) ? "yes" : "no")
        return this.graph.getNextNode(node.id)
    }

}
