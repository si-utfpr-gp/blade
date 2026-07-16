import { type ReactNode } from "react"
import { SimulatorProvider } from "./SimulatorContext"

export function renderWithSimulator(ui: ReactNode, callbacks?: Record<string, unknown>) {
  return (
    <SimulatorProvider callbacks={callbacks as any}>
      {ui}
    </SimulatorProvider>
  )
}
