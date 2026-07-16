import { Header, WorkspaceLayout } from "./components/layout"
import BlocksPanel from "./components/blocks"
import ConstructorCanvas from "./components/constructor"
import SimulatorPanel from "./components/simulator"

export default function BuilderPage() {
  return (
    <WorkspaceLayout
      header={<Header title="Construa seu algoritmo" />}
      sidebar={<BlocksPanel errors={[]} />}
      canvas={<ConstructorCanvas />}
      inspector={<SimulatorPanel />}
    />
  )
}
