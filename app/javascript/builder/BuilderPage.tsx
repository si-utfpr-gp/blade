import { useState } from "react"
import { Header, WorkspaceLayout } from "./components/layout"
import BlocksPanel from "./components/blocks"
import JsonHarness from "./components/constructor/JsonHarness"
import SimulatorPanel from "./components/simulator"
import { SimulatorProvider } from "./components/simulator/SimulatorContext"

export default function BuilderPage() {
  const [debuggerCollapsed, setDebuggerCollapsed] = useState(false)

  return (
    <SimulatorProvider>
      <WorkspaceLayout
        header={<Header title="Construa seu algoritmo" />}
        sidebar={<BlocksPanel errors={[]} />}
        canvas={<JsonHarness />}
        inspector={
          <SimulatorPanel
            collapsed={debuggerCollapsed}
            onToggleCollapsed={() => setDebuggerCollapsed((value) => !value)}
          />
        }
        inspectorCollapsed={debuggerCollapsed}
      />
    </SimulatorProvider>
  )
}
