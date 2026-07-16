import { useState } from "react"
import type { ExecutionStep } from "../../interfaces"
import SimulatorHeader from "./SimulatorHeader"
import SimulatorControl from "./SimulatorControl"
import SimulatorTabs from "./SimulatorTabs"
import SimulatorTrace from "./SimulatorTrace"
import SimulatorExplain from "./SimulatorExplain"
import SimulatorCode from "./SimulatorCode"
import SimulatorStatusBar from "./SimulatorStatusBar"

export interface SimulatorPanelProps {
  steps: ExecutionStep[]
  currentStepIndex: number
  outputs: string[]
  isRunning: boolean
  isFinished: boolean
  isStarted: boolean
  error: string | null
  onStart: () => void
  onStepForward: () => void
  onStepBack: () => void
  onRunAll: () => void
  onStop: () => void
  onReset: () => void
  speed: number
  onSpeedChange: (speed: number) => void
  onVariableEdit?: (stepIndex: number, varName: string, newValue: string) => void
  jsCode: string
  tsCode: string
}

type Tab = "trace" | "explain" | "code"

export default function SimulatorPanel({
  steps,
  currentStepIndex,
  outputs,
  isRunning,
  isFinished,
  isStarted,
  error,
  onStart,
  onStepForward,
  onStepBack,
  onRunAll,
  onStop,
  onReset,
  speed,
  onSpeedChange,
  onVariableEdit,
  jsCode,
  tsCode,
}: SimulatorPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("trace")

  const canStepBack = isStarted && currentStepIndex > 0 && !isRunning
  const canStepForward = isStarted && !isFinished && !isRunning

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <SimulatorHeader isRunning={isRunning} isFinished={isFinished} isStarted={isStarted} />

      <SimulatorControl
        isStarted={isStarted}
        isRunning={isRunning}
        isFinished={isFinished}
        canStepBack={canStepBack}
        canStepForward={canStepForward}
        speed={speed}
        onStart={onStart}
        onReset={onReset}
        onStepBack={onStepBack}
        onStepForward={onStepForward}
        onRunAll={onRunAll}
        onStop={onStop}
        onSpeedChange={onSpeedChange}
      />

      <SimulatorTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        {activeTab === "trace" && (
          <SimulatorTrace
            steps={steps}
            currentStepIndex={currentStepIndex}
            outputs={outputs}
            isStarted={isStarted}
            isRunning={isRunning}
            isFinished={isFinished}
            error={error}
            onVariableEdit={onVariableEdit}
          />
        )}
        {activeTab === "explain" && (
          <SimulatorExplain
            steps={steps}
            currentStepIndex={currentStepIndex}
            isStarted={isStarted}
            isFinished={isFinished}
          />
        )}
        {activeTab === "code" && (
          <SimulatorCode jsCode={jsCode} tsCode={tsCode} />
        )}
      </div>

      <SimulatorStatusBar
        steps={steps}
        currentStepIndex={currentStepIndex}
        isStarted={isStarted}
        outputs={outputs}
      />
    </div>
  )
}
