import { useState } from "react"

import { WorkspaceLayout } from "./components/layout"
import { BuilderHeader } from "./components/layout/BuilderHeader"

import BlocksPanel from "./components/blocks/BlocksPanel"

import SimulatorPanel from "./components/simulator"
import { SimulatorProvider } from "./components/simulator/SimulatorContext"

import ConstructorCanvas from "./components/constructor/ConstructorCanvas"
import { ConstructorProvider } from "./components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "./components/constructor/AlgorithmsProvider"
import { LocalAlgorithmsProvider } from "./components/constructor/LocalAlgorithmsProvider"
import { AlgorithmNameProvider } from "./components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "./components/constructor/DiagramOrigin"
import { BlockPlacementProvider } from "./components/constructor/BlockPlacement"
import { ToastProvider } from "./components/ui/Toast"

export default function BuilderPage({
  userName = null,
  signedIn = false,
}: {
  userName?: string | null
  signedIn?: boolean
}) {
  const [debuggerCollapsed, setDebuggerCollapsed] = useState(true)

  return (
    <ToastProvider>
      <SimulatorProvider>
        <AlgorithmsProvider signedIn={signedIn}>
          <LocalAlgorithmsProvider>
          <AlgorithmNameProvider>
            <DiagramOriginProvider>
              <BlockPlacementProvider>
                <ConstructorProvider>
                  <WorkspaceLayout
                    header={<BuilderHeader userName={userName} signedIn={signedIn} />}
                    sidebar={<BlocksPanel errors={[]} />}
                    canvas={
                      <ConstructorCanvas
                        onDiagramLoaded={() => setDebuggerCollapsed(false)}
                      />
                    }
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
                </ConstructorProvider>
              </BlockPlacementProvider>
            </DiagramOriginProvider>
          </AlgorithmNameProvider>
          </LocalAlgorithmsProvider>
        </AlgorithmsProvider>
      </SimulatorProvider>
    </ToastProvider>
  )
}