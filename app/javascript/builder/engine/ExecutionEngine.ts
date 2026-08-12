import type { IExecutionStep } from "../interfaces/execution";
import type { IParserData, IParserNode } from "../parser/types";
import { ExprEvaluator } from "./ExprEvaluator";
import { MemoryManager } from "./MemoryManager";
import { SnapshotManager } from "./SnapshotManager";
import { ExplanationGenerator } from "./ExplanationGenerator";
import { classifyError } from "./errors";

/**
 * Stateful interpreter for a parsed diagram.
 *
 * It walks the graph one executable block at a time, skips declarative/routing
 * blocks (`memory` and `connector`), updates memory, stores snapshots, and
 * pauses when an `input` block needs a value from the UI.
 */
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
    private pendingInput: { nodeId: string; names: string[]; index: number } | null = null;

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
        if (this.snapshots.size >= this.max) {
            this._err = "Limite de passos excedido"
            return null
        }

        this.skipNonExecutableBlocks()
        if (!this.current) return null

        const node = this.graph.nodes.get(this.current)
        if (!node) {
            this._err = `Bloco '${this.current}' não encontrado`
            return null
        }

        try {
            const step = this.exec(node, input)
            const isOnlyAskingForInput = step?.waitingForInput && step.inputEntered === false
            if (step && !isOnlyAskingForInput) this.snapshots.store(step)
            if (step?.waitingForInput) return step

            this.current = this.next(node)
            if (this.current === null && node.type === "startEnd" && node.variant === "end") {
                this._done = true
            }
            return step
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
        this.pendingInput = null;
    }

    public getSteps(): IExecutionStep[] { return this.snapshots.allSteps as IExecutionStep[]; }

    public get currentStepIndex(): number { return this.snapshots.currentIndex; }

    public getCurrentOutputs(): string[] { return this.outputs; }

    /** @deprecated Use getCurrentOutputs(). Kept to avoid breaking older callers. */
    public getCurretnOutputs(): string[] { return this.getCurrentOutputs(); }

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
        this.skipNonExecutableBlocks()
        if (!this.current) return null

        const node = this.graph.nodes.get(this.current)
        if (!node) return null

        try {
            const step = this.exec(node)
            if (step) this.snapshots.store(step)
            this.current = this.next(node)
            return step
        } catch (e) {
          const structured = classifyError(e, this.current)
          this._err = structured.message
          throw e
        }
    }


    /** Validates raw user input according to the type declared in a memory block. */
    private validateInput(value: string, type: string): string | null {
      switch (type) {
        case "inteiro": {
          if (!/^-?\d+$/.test(value.trim())) return `Valor inválido para inteiro: '${value}'`
          return null
        }
        case "real": {
          if (!/^-?\d+(\.\d+)?$/.test(value.trim())) return `Valor inválido para real: '${value}'`
          return null
        }
        case "logico": {
          const v = value.trim().toLowerCase()
          if (!["verdadeiro", "verdadeiro.", "v", "falso", "falso.", "f"].includes(v))
            return `Valor inválido para lógico: '${value}' (esperado: verdadeiro/falso)`
          return null
        }
        case "caractere":
          return null
        default:
          return null
      }
    }

    /** Executes one block and returns the UI-facing step/snapshot data for it. */
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
                const varNames = (node.label ?? "").split(",").map(s => s.trim()).filter(Boolean)
                if (!this.pendingInput || this.pendingInput.nodeId !== node.id) {
                    this.pendingInput = { nodeId: node.id, names: varNames, index: 0 }
                }
                const pi = this.pendingInput
                const name = pi.names[pi.index]

                if (input === undefined) {
                    const type = this.memory.getType(name) ?? "caractere"
                    const text = this.explanations.generate({
                        nodeType: node.type,
                        nodeLabel: name,
                        inputValue: undefined,
                    });
                    return {
                        ...base(),
                        waitingForInput: true,
                        inputEntered: false,
                        inputPrompt: `Valor para '${name}':`,
                        inputVariable: name,
                        inputType: type,
                        ...text,
                    };
                }

                const declaredType = this.memory.getType(name) ?? "caractere"
                if (!this.memory.has(name)) this.memory.declare(name, "caractere")
                const validationError = this.validateInput(input, declaredType)
                if (validationError) throw new Error(validationError)
                this.memory.set(name, input)

                const remaining = pi.index + 1 < pi.names.length
                pi.index += 1
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: name,
                    inputValue: input,
                });

                if (remaining) {
                    const nextName = pi.names[pi.index]
                    return {
                        ...base(),
                        waitingForInput: true,
                        inputEntered: true,
                        inputPrompt: `Valor para '${nextName}':`,
                        inputVariable: nextName,
                        inputType: this.memory.getType(nextName) ?? "caractere",
                        ...text,
                    };
                }

                this.pendingInput = null
                return {
                    ...base(),
                    waitingForInput: false,
                    inputEntered: true,
                    inputType: declaredType,
                    ...text,
                };
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

    private skipNonExecutableBlocks(): void {
        while (this.current) {
            const node = this.graph.nodes.get(this.current)
            if (!node) {
                this._err = `Bloco '${this.current}' não encontrado`
                return
            }
            if (node.type === "memory") {
                this.processMemory(node)
                this.current = this.graph.getNextNode(this.current)
                continue
            }
            if (node.type === "connector") {
                this.current = this.graph.getNextNode(this.current)
                continue
            }
            return
        }
    }

    private processMemory(node: IParserNode): void {
        node.rows?.forEach(row => {
            row.variables
                .split(",")
                .map(variable => variable.trim())
                .filter(Boolean)
                .forEach(variable => this.memory.declare(variable, row.type))
        })
    }

    private next(node: IParserNode): string | null {
        if (node.type === "decision") return this.graph.getNextNode(node.id, this.expr.condition(node.label ?? "", node.id) ? "yes" : "no")
        return this.graph.getNextNode(node.id)
    }

}
