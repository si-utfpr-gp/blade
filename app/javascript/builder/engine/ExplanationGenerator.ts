import type { IExplanationContext } from "../interfaces/execution";

interface ExplanationResult {
    log: string;
    explanation: string;
    changes: string[];
    nextHint: string;
}

export class ExplanationGenerator {
    public generate(ctx: IExplanationContext): ExplanationResult {
        switch (ctx.nodeType) {
            case "startEnd":
                return this.startEnd(ctx);
            case "input":
                return this.input(ctx);
            case "output":
                return this.output(ctx);
            case "process":
                return this.process(ctx);
            case "decision":
                return this.decision(ctx);
            case "subroutine":
                return this.subroutine(ctx);
            default:
                return { log: "", explanation: "", changes: [], nextHint: "" };
        }
    }

    private startEnd(ctx: IExplanationContext): ExplanationResult {
        if (ctx.variant === "start") {
            return { log: "Iniciando o algoritmo.", explanation: "Iniciando o algoritmo.", changes: [], nextHint: "Avançar." };
        }
        return { log: "Algoritmo finalizado.", explanation: "Algoritmo finalizado.", changes: [], nextHint: "Concluído." };
    }

    private input(ctx: IExplanationContext): ExplanationResult {
        if (ctx.inputValue === undefined) {
            return { log: `Solicitando ${ctx.nodeLabel}.`, explanation: `Aguardando valor para '${ctx.nodeLabel}'.`, changes: [], nextHint: "Informe o valor." };
        }
        return { log: `Lendo ${ctx.nodeLabel}.`, explanation: `Armazenando '${ctx.inputValue}' em '${ctx.nodeLabel}'.`, changes: [`${ctx.nodeLabel} = ${ctx.inputValue}`], nextHint: "Avançar." };
    }

    private output(ctx: IExplanationContext): ExplanationResult {
        const value = ctx.expressionResult ?? "";
        return { log: `Exibindo ${ctx.nodeLabel}.`, explanation: `Resultado: ${value}.`, changes: [`Saída: ${value}`], nextHint: "Avançar." };
    }

    private process(ctx: IExplanationContext): ExplanationResult {
        const changes = ctx.changes ?? [];
        const explanation = changes.length === 1
            ? `${changes[0]}.`
            : `Múltiplos: ${changes.join("; ")}.`;
        return { log: ctx.nodeLabel, changes, explanation, nextHint: "Avançar." };
    }

    private decision(ctx: IExplanationContext): ExplanationResult {
        const ok = ctx.conditionResult ?? false;
        return {
            log: `${ctx.nodeLabel} → ${ok ? "V" : "F"}`,
            changes: [`Decisão: ${ok ? "VERDADEIRO" : "FALSO"}`],
            explanation: `'${ctx.nodeLabel}' é ${ok ? "verdadeiro" : "falso"}.`,
            nextHint: `Seguindo ${ok ? "VERDADEIRO" : "FALSO"}.`,
        };
    }

    private subroutine(ctx: IExplanationContext): ExplanationResult {
        const name = ctx.subroutineName ?? ctx.nodeLabel;
        return { log: `Chamando ${name}.`, explanation: `Chamando '${name}'.`, changes: [`Chamada: ${name}`], nextHint: "Retornando." };
    }
}
