import { useState, useCallback } from "react"
import { Header, WorkspaceLayout } from "./components/layout"
import BlocksPanel from "./components/blocks"
import ConstructorCanvas from "./components/constructor"
import SimulatorPanel from "./components/simulator"
import type { ExecutionStep } from "./interfaces"

export default function BuilderPage() {
  const [steps] = useState<ExecutionStep[]>([])
  const [currentStepIndex] = useState(0)
  const [outputs] = useState<string[]>([])
  const [isRunning] = useState(false)
  const [isFinished] = useState(false)
  const [isStarted] = useState(false)
  const [error] = useState<string | null>(null)
  const [speed, setSpeed] = useState(1000)

  const noop = useCallback(() => {}, [])

  return (
    <WorkspaceLayout
      header={<Header title="Construa seu algoritmo" />}
      sidebar={<BlocksPanel errors={[]} />}
      canvas={<ConstructorCanvas />}
      inspector={
        <SimulatorPanel
          steps={steps}
          currentStepIndex={currentStepIndex}
          outputs={outputs}
          isRunning={isRunning}
          isFinished={isFinished}
          isStarted={isStarted}
          error={error}
          onStart={noop}
          onStepForward={noop}
          onStepBack={noop}
          onRunAll={noop}
          onStop={noop}
          onReset={noop}
          speed={speed}
          onSpeedChange={setSpeed}
          jsCode=""
          tsCode=""
        />
      }
    />
  )
}
