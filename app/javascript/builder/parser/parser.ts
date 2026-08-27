import type { Node, Edge } from "@xyflow/react";
import type { IParserNode, IParserEdge, IParserData, IParserRoutineDefinition, IRawSubroutineDefinition } from "./types";

interface ParseOptions {
    subroutines?: IRawSubroutineDefinition[]
}

export function parse(nodes: Node[], edges: Edge[], options?: ParseOptions): IParserData {
    const nodeMap = new Map<string, IParserNode>();
    let startNodeId: string | null = null;
    let endNodeId: string | null = null;

    for (const node of nodes) {
        const data = node.data as Record<string, unknown> | undefined
        const parserNode: IParserNode = {
            id: node.id,
            type: node.type ?? "",
            variant: data?.variant as "start" | "end" | undefined,
            label: data?.label as string | undefined,
            rows: data?.rows as Array<{ type: string; variables: string; initialValue?: string }> | undefined,
        }
        nodeMap.set(node.id, parserNode);

        if (node.type === "startEnd" && data?.variant === "start") {
            startNodeId = node.id;
        }
        if (node.type === "startEnd" && data?.variant === "end") {
            endNodeId = node.id;
        }
    }

    const adjacency = new Map<string, IParserEdge[]>();

    for (const edge of edges) {
        const parserEdge: IParserEdge = {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle ?? undefined,
            targetHandle: edge.targetHandle ?? undefined,
        }
        const existing = adjacency.get(edge.source) ?? [];
        existing.push(parserEdge);
        adjacency.set(edge.source, existing);
    }

    const subroutines = parseSubroutines(options?.subroutines)

    return {
        nodes: nodeMap,
        startNodeId,
        endNodeId,
        subroutines,
        getNextNode(currentId: string, handle?: string): string | null {
          const outgoing = adjacency.get(currentId)
          if (!outgoing || outgoing.length === 0) return null
          if (handle) {
            return outgoing.find(e => e.sourceHandle === handle)?.target ?? null
          }
          return outgoing[0].target
        },
        getOutgoing(currentId: string): IParserEdge[] {
          return [...(adjacency.get(currentId) ?? [])]
        },
    }
}

function parseSubroutines(raw?: IRawSubroutineDefinition[]): Map<string, IParserRoutineDefinition> | undefined {
    if (!raw?.length) return undefined

    return new Map(raw.map((routine) => [
        routine.name,
        {
            id: routine.id,
            name: routine.name,
            parameters: [...routine.parameters],
            returnVariable: routine.returnVariable,
            graph: parse(routine.nodes, routine.edges),
        },
    ]))
}
