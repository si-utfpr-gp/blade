import { cloneElement, isValidElement, useEffect, useState, type ReactNode } from "react"

import { useIsDesktop } from "./useMediaQuery"

export interface IWorkspaceLayoutProps {
  header: ReactNode
  sidebar: ReactNode
  canvas: ReactNode
  inspector: ReactNode
  inspectorCollapsed?: boolean
}

// Below this width the sidebar becomes an overlay drawer instead of a column,
// so the examples menu stops disappearing on narrow screens.
const SIDEBAR_ID = "workspace-sidebar"

export default function WorkspaceLayout({
  header,
  sidebar,
  canvas,
  inspector,
  inspectorCollapsed = false,
}: IWorkspaceLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isDesktop = useIsDesktop()

  // On wide screens the sidebar is a permanent column, so it is always open and
  // the drawer state becomes irrelevant. Deriving it avoids an effect that
  // would setState on every resize.
  const drawerVisible = isDesktop || drawerOpen

  // Escape closes the drawer, matching the dropdown menus in the sidebar.
  useEffect(() => {
    if (!drawerOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [drawerOpen])

  const closeDrawer = () => setDrawerOpen(false)

  const inspectorClassName = inspectorCollapsed
    ? "w-14 min-w-14 max-w-14"
    : "w-[40%] min-w-[240px] max-w-[900px] max-md:w-[min(90vw,420px)] max-md:min-w-[280px]"

  // The menu button belongs to the drawer, which lives here, so it is injected
  // into the header rather than duplicated by each header consumer.
  const headerWithMenu = isValidElement(header)
    ? cloneElement(header as React.ReactElement<Record<string, unknown>>, {
        onMenuClick: () => setDrawerOpen((open) => !open),
        drawerOpen: drawerVisible,
      })
    : header

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0">{headerWithMenu}</div>

      <div className="flex flex-1 min-h-0">
        <aside
          id={SIDEBAR_ID}
          aria-label="Blocos e exemplos"
          aria-hidden={isDesktop ? undefined : !drawerVisible ? true : undefined}
          inert={!isDesktop && !drawerVisible ? true : undefined}
          // Fixed width: a percentage of the viewport ranged from 154px to
          // 384px for the same app, which squeezed the dropdowns shut.
          className={`w-64 shrink-0 border-r overflow-auto bg-card transition-transform duration-200 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:shadow-xl md:relative md:translate-x-0 ${
            drawerVisible ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebar}
        </aside>

        {!isDesktop && drawerVisible && (
          <button
            type="button"
            data-testid="sidebar-backdrop"
            aria-label="Fechar menu"
            onClick={closeDrawer}
            className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
          />
        )}

        <div className="flex-1 min-w-0 min-h-0 relative">{canvas}</div>

        <aside
          className={`${inspectorClassName} border-l overflow-hidden shrink-0 transition-[width,min-width,max-width] duration-200`}
        >
          {inspector}
        </aside>
      </div>
    </div>
  )
}