import { ReactFlowProvider } from "@xyflow/react"
import BuilderPage from "./BuilderPage"

export default function App() {
  const userName = document.getElementById("builder")?.dataset.userName || null

  return (
    <ReactFlowProvider>
      <BuilderPage userName={userName} />
    </ReactFlowProvider>
  )
}