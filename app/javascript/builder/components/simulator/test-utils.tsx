import { type ReactNode } from "react"
import { SimulatorProvider } from "./SimulatorContext"
import type { SimulatorCallbacks } from "../../interfaces/simulator"

export function renderWithSimulator(ui: ReactNode, callbacks?: SimulatorCallbacks) {
  return (
    <SimulatorProvider callbacks={callbacks}>
      {ui}
    </SimulatorProvider>
  )
}
