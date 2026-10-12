import { useState } from "react"

import { Header, WorkspaceLayout } from "./components/layout"

import BlocksPanel from "./components/blocks/BlocksPanel"

import SimulatorPanel from "./components/simulator"
import { SimulatorProvider } from "./components/simulator/SimulatorContext"

import ConstructorCanvas from "./components/constructor/ConstructorCanvas"
import { ConstructorProvider } from "./components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "./components/constructor/AlgorithmsProvider"
import {
  AlgorithmNameProvider,
  useAlgorithmNameField,
} from "./components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "./components/constructor/DiagramOrigin"
import { BlockPlacementProvider } from "./components/constructor/BlockPlacement"
import { ToastProvider } from "./components/ui/Toast"

function BuilderHeader({ userName }: { userName: string | null }) {
  const { algorithmName, onAlgorithmNameChange, isNameLocked } =
    useAlgorithmNameField()
  return (
    <Header
      title="Construa seu algoritmo"
      userName={userName}
      algorithmName={algorithmName}
      onAlgorithmNameChange={onAlgorithmNameChange}
      isNameLocked={isNameLocked}
    />
  )
}

export default function BuilderPage({
  userName = null,
}: {
  userName?: string | null
}) {
  const [debuggerCollapsed, setDebuggerCollapsed] = useState(true)

  return (
    <ToastProvider>
      <SimulatorProvider>
      <AlgorithmsProvider>
        <AlgorithmNameProvider>
<DiagramOriginProvider>
              <BlockPlacementProvider>
                <ConstructorProvider>
            <WorkspaceLayout
              header={<BuilderHeader userName={userName} />}
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
              </BlockPlacementProvider>
            </DiagramOriginProvider>
        </AlgorithmNameProvider>
      </AlgorithmsProvider>
      </SimulatorProvider>
    </ToastProvider>
  )
}