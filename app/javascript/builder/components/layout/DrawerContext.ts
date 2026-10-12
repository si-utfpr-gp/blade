import { createContext, useContext } from "react"

/**
 * Lets the drawer in WorkspaceLayout reach the menu button inside the header
 * without prop drilling.
 *
 * This is a context rather than cloneElement because the builder's header is a
 * wrapper component (BuilderHeader) that pulls the name state from context;
 * injecting props there meant they stopped at the wrapper and the mobile menu
 * button never rendered.
 */
export interface IDrawerContextValue {
  isOpen: boolean
  toggle: () => void
}

const DrawerContext = createContext<IDrawerContextValue | null>(null)

export const DrawerProvider = DrawerContext.Provider

export function useDrawer(): IDrawerContextValue | null {
  return useContext(DrawerContext)
}