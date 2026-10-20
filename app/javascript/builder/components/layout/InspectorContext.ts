import { createContext, useContext } from "react"

/**
 * Lets the canvas toolbar open and close the debugger. On a phone the
 * debugger has no rail of its own, so its button lives with the canvas
 * actions; the state still belongs to the page that lays out the panels.
 */
export interface IInspectorContextValue {
  collapsed: boolean
  toggle: () => void
}

const InspectorContext = createContext<IInspectorContextValue | null>(null)

export const InspectorProvider = InspectorContext.Provider

export function useInspector(): IInspectorContextValue | null {
  return useContext(InspectorContext)
}
