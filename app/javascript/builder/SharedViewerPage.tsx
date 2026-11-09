import { useEffect, useMemo, useState } from "react"

import { WorkspaceLayout } from "./components/layout"
import SimulatorPanel from "./components/simulator"
import { SimulatorProvider } from "./components/simulator/SimulatorContext"
import ConstructorCanvas from "./components/constructor/ConstructorCanvas"
import { ConstructorProvider, useConstructor } from "./components/constructor/ConstructorProvider"
import { DiagramOriginProvider, useDiagramOrigin } from "./components/constructor/DiagramOrigin"
import { BlockPlacementProvider } from "./components/constructor/BlockPlacement"
import { parseImportedDiagram, type ImportedDiagram } from "./components/constructor/importDiagram"
import { layoutExampleDiagram } from "./components/constructor/layoutExampleDiagram"
import { ToastProvider } from "./components/ui/Toast"

export type ViewerMode = "shared" | "embed"

/**
 * The page behind a public link: /s/:token on its own, /embed/:token inside
 * someone else's page, such as the course book. The diagram can be run and
 * stepped through with the debugger, but nothing can be added or saved.
 *
 * The diagram comes in the page itself, so it is checked like an imported
 * file before it reaches the canvas.
 */
export default function SharedViewerPage({
  mode,
  name,
  diagramJson,
}: {
  mode: ViewerMode
  name: string
  diagramJson: string
}) {
  const diagram = useMemo(() => {
    try {
      const result = parseImportedDiagram(JSON.parse(diagramJson))
      return result.ok ? result : null
    } catch {
      return null
    }
  }, [diagramJson])
  const [debuggerCollapsed, setDebuggerCollapsed] = useState(true)

  if (!diagram) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p role="alert" className="text-sm text-muted-foreground">
          Não foi possível abrir este algoritmo.
        </p>
      </div>
    )
  }

  return (
    <ToastProvider>
      <SimulatorProvider>
        <DiagramOriginProvider>
          <BlockPlacementProvider>
            <ConstructorProvider>
              <LoadShared diagram={diagram.diagram} positioned={diagram.positioned} />
              <WorkspaceLayout
                header={mode === "shared" ? <ViewerHeader name={name} /> : null}
                canvas={
                  <>
                    <ConstructorCanvas viewer onDiagramLoaded={() => setDebuggerCollapsed(false)} />
                    {mode === "embed" && <EmbedMark />}
                  </>
                }
                inspector={
                  <SimulatorPanel
                    collapsed={debuggerCollapsed}
                    onToggleCollapsed={() => setDebuggerCollapsed((value) => !value)}
                  />
                }
                inspectorCollapsed={debuggerCollapsed}
                onToggleInspector={() => setDebuggerCollapsed((value) => !value)}
              />
            </ConstructorProvider>
          </BlockPlacementProvider>
        </DiagramOriginProvider>
      </SimulatorProvider>
    </ToastProvider>
  )
}

/** Puts the shared diagram on the canvas once, read only. */
function LoadShared({ diagram, positioned }: { diagram: ImportedDiagram; positioned: boolean }) {
  const { loadCanvasNodes } = useConstructor()
  const { markShared } = useDiagramOrigin()

  useEffect(() => {
    if (positioned) {
      loadCanvasNodes(diagram.nodes, diagram.edges)
    } else {
      const laidOut = layoutExampleDiagram({ id: "shared", title: "", description: "", category: "", diagram })
      loadCanvasNodes(laidOut.nodes, laidOut.edges, { centers: laidOut.centers })
    }
    markShared()
  }, [diagram, positioned, loadCanvasNodes, markShared])

  return null
}

function ViewerHeader({ name }: { name: string }) {
  return (
    <header className="flex h-12 items-center justify-between gap-3 border-b bg-white px-4">
      <div className="flex min-w-0 items-center gap-2">
        <a href="/" className="flex shrink-0 items-center gap-2" aria-label="Blade, página inicial">
          <BladeIcon className="h-5 w-5 text-blue-600" />
          <span className="hidden text-xl font-bold sm:inline">Blade</span>
        </a>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <h1 className="truncate text-sm font-medium text-foreground">{name}</h1>
      </div>
      <a
        href="/builder"
        className="shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
      >
        Criar no Blade
      </a>
    </header>
  )
}

/**
 * In someone else's page the viewer has no header; a small mark says where it
 * comes from and opens the full page in a new tab.
 */
function EmbedMark() {
  const href = window.location.pathname.replace(/^\/embed\//, "/s/")
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Feito no Blade: abrir em outra aba"
      className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-border bg-card/95 px-2 py-1 text-xs font-semibold text-foreground shadow-md backdrop-blur hover:text-blue-600"
    >
      <BladeIcon className="h-4 w-4 text-blue-600" />
      Blade
    </a>
  )
}

function BladeIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  )
}
