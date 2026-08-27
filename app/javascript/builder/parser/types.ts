import type { Node, Edge } from "@xyflow/react"

export interface IParserNode {
    id: string;
    type: string;
    variant?: "start" | "end"
    label?: string
    rows?: Array<{ type: string; variables: string; initialValue?: string }>
}

export interface IParserEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface IRawSubroutineDefinition {
    id: string
    name: string
    parameters: string[]
    returnVariable?: string
    nodes: Node[]
    edges: Edge[]
}

export interface IParserRoutineDefinition {
    id: string
    name: string
    parameters: string[]
    returnVariable?: string
    graph: IParserData
}

export interface IParserData {
    nodes: Map<string, IParserNode>
    startNodeId: string | null
    endNodeId: string | null
    subroutines?: Map<string, IParserRoutineDefinition>
    getNextNode(currentId: string, handle?: string): string | null
    getOutgoing(currentId: string): IParserEdge[]
}
