import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import SimulatorErrorToast from "../../components/simulator/SimulatorErrorToast"

describe("SimulatorErrorToast", () => {
  it("shows the public execution message as an alert", () => {
    render(<SimulatorErrorToast message="O motor de execução identificou um problema no seu diagrama. Revise o fluxo e tente novamente." />)

    expect(screen.getByRole("alert")).toHaveTextContent("O motor de execução identificou um problema no seu diagrama")
  })

  it("renders nothing without an error", () => {
    render(<SimulatorErrorToast message={null} />)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  // It stayed on screen until someone closed it.
  describe("some sozinho", () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it("fecha depois de 5 segundos", () => {
      vi.useFakeTimers()
      const onDismiss = vi.fn()
      render(<SimulatorErrorToast message="Erro" onDismiss={onDismiss} />)

      act(() => vi.advanceTimersByTime(4900))
      expect(onDismiss).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(200))
      expect(onDismiss).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it("pode ser fechado na hora", () => {
      render(<SimulatorErrorToast message="Erro" />)

      act(() => screen.getByRole("button", { name: /fechar mensagem de erro/i }).click())

      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it("conta de novo quando chega outro erro", () => {
      vi.useFakeTimers()
      const onDismiss = vi.fn()
      const { rerender } = render(<SimulatorErrorToast message="Primeiro" onDismiss={onDismiss} />)

      act(() => vi.advanceTimersByTime(4000))
      rerender(<SimulatorErrorToast message="Segundo" onDismiss={onDismiss} />)
      act(() => vi.advanceTimersByTime(4000))

      expect(onDismiss).not.toHaveBeenCalled()
    })
  })
})
