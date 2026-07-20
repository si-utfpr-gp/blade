export interface ParserNode {
    id: string;
    type: string;
    variant?: "start" | "end"
    label?: string
    rows?: Array<{ type: string; variables: string}>
}

export interface ParserEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface ParserData {
    nodes: Map<string, ParserNode>
    startNodeId: string | null
    endNodeId: string | null
    getNextNode(currentId: string, handle?: string): string | null
}