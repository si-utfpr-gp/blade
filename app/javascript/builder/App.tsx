import { ReactFlowProvider } from "@xyflow/react"
import BuilderPage from "./BuilderPage"

export default function App() {
  const root = document.getElementById("builder")
  const userName = root?.dataset.userName || null
  const signedIn = root?.dataset.signedIn === "true"

  return (
    <ReactFlowProvider>
      <BuilderPage userName={userName} signedIn={signedIn} />
    </ReactFlowProvider>
  )
}