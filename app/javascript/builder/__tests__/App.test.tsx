import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

const builderPageMock = vi.fn(() => <div data-testid="builder-page" />)

vi.mock("../BuilderPage", () => ({
  default: (props: { userName: string | null; signedIn: boolean }) =>
    builderPageMock(props),
}))

import App from "../App"

function renderWithDataset(dataset: Record<string, string>) {
  const root = document.createElement("div")
  root.id = "builder"
  for (const [key, value] of Object.entries(dataset)) {
    root.dataset[key] = value
  }
  document.body.appendChild(root)
  const result = render(<App />)
  document.body.removeChild(root)
  return result
}

describe("App", () => {
  beforeEach(() => {
    builderPageMock.mockClear()
  })

  it("passes the user name read from the root element", () => {
    renderWithDataset({ userName: "Ana", signedIn: "true" })

    expect(builderPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ userName: "Ana" }),
    )
  })

  it("passes the signed in flag so the builder can hide account only features", () => {
    renderWithDataset({ userName: "Ana", signedIn: "true" })

    expect(builderPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ signedIn: true }),
    )
  })

  it("reports a visitor without a session as signed out", () => {
    renderWithDataset({ userName: "", signedIn: "false" })

    expect(builderPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ signedIn: false }),
    )
  })

  it("treats a missing signed in attribute as signed out", () => {
    renderWithDataset({ userName: "Ana" })

    expect(builderPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ signedIn: false }),
    )
  })

  it("still renders when the root element is missing", () => {
    render(<App />)

    expect(screen.getByTestId("builder-page")).toBeInTheDocument()
    expect(builderPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ userName: null, signedIn: false }),
    )
  })
})