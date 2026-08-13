import type { ReactNode } from "react"

export interface IWorkspaceLayoutProps {
  header: ReactNode
  sidebar: ReactNode
  canvas: ReactNode
  inspector: ReactNode
  inspectorCollapsed?: boolean
}

export default function WorkspaceLayout({
  header,
  sidebar,
  canvas,
  inspector,
  inspectorCollapsed = false,
}: IWorkspaceLayoutProps) {
  const inspectorClassName = inspectorCollapsed
    ? "w-14 min-w-14 max-w-14"
    : "w-[40%] min-w-[240px] max-w-[900px] max-md:w-[min(90vw,420px)] max-md:min-w-[280px]"

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0">{header}</div>

      <div className="flex flex-1 min-h-0">
        <aside className="w-[15%] min-w-[140px] max-w-[250px] border-r overflow-auto shrink-0 max-md:hidden">
          {sidebar}
        </aside>

        <div className="flex-1 min-w-0 min-h-0 relative">
          {canvas}
        </div>

        <aside className={`${inspectorClassName} border-l overflow-hidden shrink-0 transition-[width,min-width,max-width] duration-200`}>
          {inspector}
        </aside>
      </div>
    </div>
  )
}
