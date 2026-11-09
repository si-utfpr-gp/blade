import { useEffect, useMemo, useState, type ReactNode } from "react"

import { useIsDesktop } from "./useMediaQuery"
import { DrawerProvider } from "./DrawerContext"
import { InspectorProvider } from "./InspectorContext"

export interface IWorkspaceLayoutProps {
  header: ReactNode
  // Left out by the read-only viewer, which has no blocks to offer.
  sidebar?: ReactNode
  canvas: ReactNode
  inspector: ReactNode
  inspectorCollapsed?: boolean
  onToggleInspector?: () => void
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
  onToggleInspector,
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

  const drawer = useMemo(
    () => ({
      isOpen: drawerVisible,
      toggle: () => setDrawerOpen((open) => !open),
      close: () => setDrawerOpen(false),
    }),
    [drawerVisible],
  )

  const inspectorControl = useMemo(
    () => ({ collapsed: inspectorCollapsed, toggle: onToggleInspector ?? (() => undefined) }),
    [inspectorCollapsed, onToggleInspector],
  )

  // Below md the canvas keeps the whole width: collapsed, the debugger leaves
  // no rail (the canvas toolbar has its button); open, it rises as a sheet
  // over the lower part of the screen, leaving the diagram visible above so
  // the highlighted block can be followed while stepping.
  const inspectorClassName = inspectorCollapsed
    ? "w-14 min-w-14 max-w-14 max-md:hidden"
    : "w-[40%] min-w-[240px] max-w-[900px] max-md:fixed max-md:bottom-0 max-md:inset-x-0 max-md:z-40 max-md:h-[55dvh] max-md:w-full max-md:min-w-0 max-md:max-w-none max-md:rounded-t-2xl max-md:border-t max-md:shadow-2xl"

  return (
    // Without a sidebar there is no drawer, so the header shows no menu button.
    <DrawerProvider value={sidebar !== undefined ? drawer : null}>
      <InspectorProvider value={inspectorControl}>
      <div className="h-full flex flex-col">
        <div className="shrink-0">{header}</div>

        <div className="flex flex-1 min-h-0">
          {sidebar !== undefined && (
            <>
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
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
              />
            )}
            </>
          )}

          <div className="flex-1 min-w-0 min-h-0 relative">{canvas}</div>

          <aside
            // Hidden on a phone while collapsed; the toolbar button replaces it.
            aria-hidden={!isDesktop && inspectorCollapsed ? true : undefined}
            inert={!isDesktop && inspectorCollapsed ? true : undefined}
            className={`${inspectorClassName} border-l overflow-hidden shrink-0 transition-[width,min-width,max-width] duration-200`}
          >
            {inspector}
          </aside>
        </div>
      </div>
      </InspectorProvider>
    </DrawerProvider>
  )
}
