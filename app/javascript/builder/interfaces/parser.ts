export interface IParserNode {
    id: string;
    type: string;
    variant?: "start" | "end"
    label?: string
    rows?: Array<{ type: string; variables: string}>
}

export interface IParserEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface IParserData {
    nodes: Map<string, IParserNode>
    startNodeId: string | null
    endNodeId: string | null
    getNextNode(currentId: string, handle?: string): string | null
}