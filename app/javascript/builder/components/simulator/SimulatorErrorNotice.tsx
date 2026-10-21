import { useEffect } from "react"
import { useSimulator } from "./SimulatorContext"
import { useToast } from "../ui/Toast"

/**
 * Says the run's error as a notice, the one system every message goes
 * through, whether the diagram could not start or stopped midway. The
 * debugger keeps showing it; this is for whoever has the debugger closed,
 * which on a phone is always.
 */
export function SimulatorErrorNotice() {
  const { state } = useSimulator()
  const { notify } = useToast()

  useEffect(() => {
    if (state.error) notify(state.error, "error")
  }, [state.error, notify])

  return null
}
