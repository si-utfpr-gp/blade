import type { Node, Edge } from "@xyflow/react";
import type { ParserNode, ParserEdge, ParserData } from "./types";

export function parse(nodes: Node[], edges: Edge[]): ParserData {
    const nodeMap = new Map<string, ParserNode>();
    let startNodeId: string | null = null;
    let endNodeId: string | null = null;

    for (const node of nodes) {
        const data = node.data as Record<string, unknown> | undefined
        const parserNode: ParserNode = {
            id: node.id,
            type: node.type ?? "",
            variant: data?.variant as "start" | "end" | undefined,
            label: data?.label as string | undefined,
            rows: data?.rows as Array<{ type: string; variables: string }> | undefined,
        }
        nodeMap.set(node.id, parserNode);

        if (node.type === "startEnd" && data?.variant === "start") {
            startNodeId = node.id;
        }
        if (node.type === "startEnd" && data?.variant === "end") {
            endNodeId = node.id;
        }
    }

    const adjacency = new Map<string, ParserEdge[]>();

    for (const edge of edges) {
        const parserEdge: ParserEdge = {
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

    return {
        nodes: nodeMap,
        startNodeId,
        endNodeId,
        getNextNode(currentId: string, handle?: string): string | null {
          const outgoing = adjacency.get(currentId)
          if (!outgoing || outgoing.length === 0) return null
          if (handle) {
            return outgoing.find(e => e.sourceHandle === handle)?.target ?? null
          }
          return outgoing[0].target
        },
    }
}