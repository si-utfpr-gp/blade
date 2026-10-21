import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

if (typeof window.ResizeObserver === "undefined") {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// The builder keeps a draft and files in the browser; each test starts with
// an empty store, so one test's draft never comes back in the next.
afterEach(() => {
  try {
    window.localStorage.clear()
  } catch {
    // A test may stub storage with one that refuses; it cleans up itself.
  }
})
