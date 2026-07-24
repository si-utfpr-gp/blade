import type { ReactNode } from "react"

export interface IWorkspaceLayoutProps {
  header: ReactNode
  sidebar: ReactNode
  canvas: ReactNode
  inspector: ReactNode
}

export default function WorkspaceLayout({ header, sidebar, canvas, inspector }: IWorkspaceLayoutProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0">{header}</div>

      <div className="flex flex-1 min-h-0">
        <aside className="w-[15%] min-w-[140px] max-w-[250px] border-r overflow-auto shrink-0">
          {sidebar}
        </aside>

        <div className="flex-1 min-w-0 min-h-0 relative">
          {canvas}
        </div>

        <aside className="w-[40%] min-w-[240px] max-w-[900px] border-l overflow-auto shrink-0">
          {inspector}
        </aside>
      </div>
    </div>
  )
}
