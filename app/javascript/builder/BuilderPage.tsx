import { useState } from "react"

import { Header, WorkspaceLayout } from "./components/layout"

import BlocksPanel from "./components/blocks/BlocksPanel"

import SimulatorPanel from "./components/simulator"
import { SimulatorProvider } from "./components/simulator/SimulatorContext"

import ConstructorCanvas from "./components/constructor/ConstructorCanvas"
import { ConstructorProvider } from "./components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "./components/constructor/AlgorithmsProvider"

export default function BuilderPage() {
  const [debuggerCollapsed, setDebuggerCollapsed] = useState(true)

  return (
    <SimulatorProvider>
      <AlgorithmsProvider>
        <ConstructorProvider>
          <WorkspaceLayout
            header={<Header title="Construa seu algoritmo" />}
            sidebar={<BlocksPanel errors={[]} />}
            canvas={
              <ConstructorCanvas onDiagramLoaded={() => setDebuggerCollapsed(false)} />
            }
            inspector={
              <SimulatorPanel
                collapsed={debuggerCollapsed}
                onToggleCollapsed={() => setDebuggerCollapsed((value) => !value)}
              />
            }
            inspectorCollapsed={debuggerCollapsed}
          />
        </ConstructorProvider>
      </AlgorithmsProvider>
    </SimulatorProvider>
  )
}
