import { ReactFlowProvider } from "@xyflow/react"
import BuilderPage from "./BuilderPage"
import SharedViewerPage, { type ViewerMode } from "./SharedViewerPage"

export default function App() {
  const root = document.getElementById("builder")
  const userName = root?.dataset.userName || null
  const signedIn = root?.dataset.signedIn === "true"
  // /s/:token and /embed/:token render this root in a read-only mode.
  const mode = root?.dataset.mode

  return (
    <ReactFlowProvider>
      {mode === "shared" || mode === "embed" ? (
        <SharedViewerPage
          mode={mode as ViewerMode}
          name={root?.dataset.algorithmName ?? ""}
          diagramJson={root?.dataset.diagram ?? ""}
        />
      ) : (
        <BuilderPage userName={userName} signedIn={signedIn} />
      )}
    </ReactFlowProvider>
  )
}
