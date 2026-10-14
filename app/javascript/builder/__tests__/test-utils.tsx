import { type ReactNode } from "react"
import { SimulatorProvider } from "../components/simulator/SimulatorContext"
import { ToastProvider } from "../components/ui/Toast"
import { AlgorithmsProvider } from "../components/constructor/AlgorithmsProvider"
import { AlgorithmNameProvider } from "../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "../components/constructor/DiagramOrigin"
import { BlockPlacementProvider } from "../components/constructor/BlockPlacement"
import { ConstructorProvider } from "../components/constructor/ConstructorProvider"
import type { ISimulatorCallbacks } from "../interfaces/simulator"

export function renderWithSimulator(ui: ReactNode, callbacks?: ISimulatorCallbacks) {
  return (
    <SimulatorProvider callbacks={callbacks}>
      <ToastProvider>{ui}</ToastProvider>
    </SimulatorProvider>
  )
}

/**
 * The provider stack the real builder mounts. Tests wrapping a component that
 * touches these contexts should use this instead of assembling the tree, so a
 * new provider does not break a dozen test files.
 */
export function BuilderProviders({
  children,
  callbacks,
  signedIn = true,
}: {
  children: ReactNode
  callbacks?: ISimulatorCallbacks
  signedIn?: boolean
}) {
  return (
    <SimulatorProvider callbacks={callbacks}>
      <ToastProvider>
        <AlgorithmsProvider signedIn={signedIn}>
          <AlgorithmNameProvider>
            <DiagramOriginProvider>
              <BlockPlacementProvider>
                <ConstructorProvider>{children}</ConstructorProvider>
              </BlockPlacementProvider>
            </DiagramOriginProvider>
          </AlgorithmNameProvider>
        </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>
  )
}