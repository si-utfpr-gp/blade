import type { Node, Edge } from "@xyflow/react"

export interface IAlgorithmExample {
  id: string
  title: string
  description: string
  category: string
  nodes: Node[]
  edges: Edge[]
  sampleInputs?: string[]
}
