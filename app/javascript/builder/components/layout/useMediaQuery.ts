import { useSyncExternalStore } from "react"

// Tailwind's md breakpoint, kept in sync with --breakpoint-md in the CSS.
const MD_QUERY = "(min-width: 48rem)"

function subscribe(query: string) {
  return (onChange: () => void) => {
    if (!window.matchMedia) return () => undefined
    const list = window.matchMedia(query)
    list.addEventListener("change", onChange)
    return () => list.removeEventListener("change", onChange)
  }
}

export function useMediaQuery(query: string): boolean {
  // useSyncExternalStore keeps the media query as an external store, so no
  // effect is needed to mirror it into state on every render.
  return useSyncExternalStore(
    subscribe(query),
    () =>
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia(query).matches
        : // Environments without matchMedia (some test runners) get the wide
          // layout, which is the non-destructive default.
          true,
    () => true,
  )
}

export function useIsDesktop(): boolean {
  return useMediaQuery(MD_QUERY)
}