import type { IExplanationContext } from "../interfaces/execution";

interface ExplanationResult {
    log: string;
    explanation: string;
    changes: string[];
    nextHint: string;
}

export class ExplanationGenerator {
    public generate(context: IExplanationContext): ExplanationResult {
        switch (context.nodeType) {
            case "startEnd":
                return this.startEnd(context);
            case "input":
                return this.input(context);
            case "output":
                return this.output(context);
            case "process":
                return this.process(context);
            case "decision":
                return this.decision(context);
            case "selection":
                return this.selection(context);
            case "subroutine":
                return this.subroutine(context);
            default:
                return { log: "", explanation: "", changes: [], nextHint: "" };
        }
    }

    private startEnd(context: IExplanationContext): ExplanationResult {
        if (context.variant === "start") {
            return { log: "Iniciando o algoritmo.", explanation: "Iniciando o algoritmo.", changes: [], nextHint: "Avançar." };
        }
        return { log: "Algoritmo finalizado.", explanation: "Algoritmo finalizado.", changes: [], nextHint: "Concluído." };
    }

    private input(context: IExplanationContext): ExplanationResult {
        if (context.inputValue === undefined) {
            return { log: `Solicitando ${context.nodeLabel}.`, explanation: `Aguardando valor para '${context.nodeLabel}'.`, changes: [], nextHint: "Informe o valor." };
        }
        return { log: `Lendo ${context.nodeLabel}.`, explanation: `Armazenando '${context.inputValue}' em '${context.nodeLabel}'.`, changes: [`${context.nodeLabel} = ${context.inputValue}`], nextHint: "Avançar." };
    }

    private output(context: IExplanationContext): ExplanationResult {
        const value = context.expressionResult ?? "";
        return { log: `Exibindo ${context.nodeLabel}.`, explanation: `Resultado: ${value}.`, changes: [`Saída: ${value}`], nextHint: "Avançar." };
    }

    private process(context: IExplanationContext): ExplanationResult {
        const changes = context.changes ?? [];
        const explanation = changes.length === 1
            ? `${changes[0]}.`
            : `Múltiplos: ${changes.join("; ")}.`;
        return { log: context.nodeLabel, changes, explanation, nextHint: "Avançar." };
    }

    private decision(context: IExplanationContext): ExplanationResult {
        const ok = context.conditionResult ?? false;
        return {
            log: `${context.nodeLabel} → ${ok ? "V" : "F"}`,
            changes: [`Decisão: ${ok ? "VERDADEIRO" : "FALSO"}`],
            explanation: `'${context.nodeLabel}' é ${ok ? "verdadeiro" : "falso"}.`,
            nextHint: `Seguindo ${ok ? "VERDADEIRO" : "FALSO"}.`,
        };
    }

    private selection(context: IExplanationContext): ExplanationResult {
        const value = context.expressionResult ?? "";
        const branch = context.selectedCase === undefined ? "Falso" : `Caso ${context.selectedCase}`;
        const explanation = context.selectedCase === undefined
            ? `'${context.nodeLabel}' vale ${value}, que não coincide com nenhum caso.`
            : `'${context.nodeLabel}' vale ${value}, que coincide com o caso ${context.selectedCase}.`;
        return {
            log: `${context.nodeLabel} = ${value} → ${branch}`,
            changes: [`Escolha: ${context.selectedCase ?? "FALSO"}`],
            explanation,
            nextHint: `Seguindo ${context.selectedCase ?? "FALSO"}.`,
        };
    }

    private subroutine(context: IExplanationContext): ExplanationResult {
        const name = context.subroutineName ?? context.nodeLabel;
        return { log: `Chamando ${name}.`, explanation: `Chamando '${name}'.`, changes: [`Chamada: ${name}`], nextHint: "Retornando." };
    }
}
