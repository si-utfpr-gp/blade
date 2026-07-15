import { ReactFlowProvider } from "@xyflow/react"
import BuilderPage from "./BuilderPage"

export default function App() {
  return (
    <ReactFlowProvider>
      <BuilderPage />
    </ReactFlowProvider>
  )
}
