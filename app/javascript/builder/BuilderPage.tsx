import { useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"

import { Header, WorkspaceLayout } from "./components/layout"

import BlocksPanel from "./components/blocks/BlocksPanel"

import SimulatorPanel from "./components/simulator"
import { SimulatorProvider } from "./components/simulator/SimulatorContext"

import ConstructorCanvas from "./components/constructor/ConstructorCanvas"
import { ConstructorProvider } from "./components/constructor/ConstructorProvider"

export default function BuilderPage() {
  const [debuggerCollapsed, setDebuggerCollapsed] = useState(false)

  return (
    <SimulatorProvider>
      <ConstructorProvider>
        <ReactFlowProvider>
          <WorkspaceLayout
            header={<Header title="Construa seu algoritmo" />}
            sidebar={<BlocksPanel errors={[]} />}
            canvas={<ConstructorCanvas />}
            inspector={
              <SimulatorPanel
                collapsed={debuggerCollapsed}
                onToggleCollapsed={() =>
                  setDebuggerCollapsed((value) => !value)
                }
              />
            }
            inspectorCollapsed={debuggerCollapsed}
          />
        </ReactFlowProvider>
      </ConstructorProvider>
    </SimulatorProvider>
  )
}
