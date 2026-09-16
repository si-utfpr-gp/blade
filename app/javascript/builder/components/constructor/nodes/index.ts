import type { NodeTypes } from "@xyflow/react"

import StartEndNode from "./StartEndNode"
import MemoryNode from "./MemoryNode"
import InputNode from "./InputNode"
import OutputNode from "./OutputNode"
import ProcessNode from "./ProcessNode"
import DecisionNode from "./DecisionNode"
import SubroutineNode from "./SubroutineNode"
import ConnectorNode from "./ConnectorNode"

export const nodeTypes: NodeTypes = {
  startEnd: StartEndNode,
  connector: ConnectorNode,
  memory: MemoryNode,
  input: InputNode,
  output: OutputNode,
  process: ProcessNode,
  decision: DecisionNode,
  subroutine: SubroutineNode,
}
