import { type ReactNode } from "react"
import { SimulatorProvider } from "../components/simulator/SimulatorContext"
import type { ISimulatorCallbacks } from "../interfaces/simulator"

export function renderWithSimulator(ui: ReactNode, callbacks?: ISimulatorCallbacks) {
  return (
    <SimulatorProvider callbacks={callbacks}>
      {ui}
    </SimulatorProvider>
  )
}
