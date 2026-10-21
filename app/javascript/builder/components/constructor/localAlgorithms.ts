import type { SerializedDiagram } from "./serializeDiagram"

export interface LocalAlgorithm {
  id: string
  name: string
  diagram: SerializedDiagram
  created_at: string
}

// Bumped when the stored shape changes, so an old list is set aside instead of
// being read into something it no longer matches.
export const LOCAL_ALGORITHMS_KEY = "blade.local-algorithms.v1"

/**
 * Why a local write did not happen.
 *
 * "quota" and "unavailable" are kept apart because the student can act on them
 * differently: a full store is fixed by deleting something, while a blocked
 * one only disappears by allowing storage in the browser. "missing" is a file
 * deleted in another tab while this one still showed it.
 */
export type LocalStorageFailure = "quota" | "unavailable" | "missing"

export type LocalResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: LocalStorageFailure }

export function readLocalAlgorithms(): LocalResult<LocalAlgorithm[]> {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(LOCAL_ALGORITHMS_KEY)
  } catch {
    return { ok: false, reason: "unavailable" }
  }

  if (!raw) return { ok: true, value: [] }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Corrupted content is treated as nothing stored. Losing a local list the
    // student cannot reach anyway beats keeping every action on this screen
    // failing.
    return { ok: true, value: [] }
  }

  return { ok: true, value: toAlgorithms(parsed) }
}

export function writeLocalAlgorithms(
  items: LocalAlgorithm[],
): LocalResult<null> {
  try {
    window.localStorage.setItem(LOCAL_ALGORITHMS_KEY, JSON.stringify(items))
    return { ok: true, value: null }
  } catch (cause) {
    return { ok: false, reason: failureReason(cause) }
  }
}

export function removeLocalAlgorithm(id: string): LocalResult<null> {
  const current = readLocalAlgorithms()
  // Without a readable list there is nothing to remove, and rewriting a list
  // that was never loaded would only drop whatever else is stored.
  if (!current.ok) return current
  return writeLocalAlgorithms(current.value.filter((item) => item.id !== id))
}

export function saveLocalAlgorithm(
  name: string,
  diagram: SerializedDiagram,
): LocalResult<LocalAlgorithm> {
  const algorithm: LocalAlgorithm = {
    id: crypto.randomUUID(),
    name,
    diagram,
    created_at: new Date().toISOString(),
  }

  const current = readLocalAlgorithms()
  if (!current.ok) return current

  const written = writeLocalAlgorithms([ algorithm, ...current.value ])
  if (!written.ok) return written

  return { ok: true, value: algorithm }
}

/**
 * Rewrites a stored file in place, keeping its id and its place in the list,
 * so renaming it or saving over it leaves the canvas pointing at it.
 */
export function updateLocalAlgorithm(
  id: string,
  changes: { name: string; diagram?: SerializedDiagram },
): LocalResult<LocalAlgorithm> {
  const current = readLocalAlgorithms()
  if (!current.ok) return current

  const existing = current.value.find((item) => item.id === id)
  if (!existing) return { ok: false, reason: "missing" }

  const updated: LocalAlgorithm = { ...existing, ...changes }
  const written = writeLocalAlgorithms(
    current.value.map((item) => (item.id === id ? updated : item)),
  )
  if (!written.ok) return written

  return { ok: true, value: updated }
}

function toAlgorithms(parsed: unknown): LocalAlgorithm[] {
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isLocalAlgorithm)
}

function isLocalAlgorithm(value: unknown): value is LocalAlgorithm {
  if (value === null || typeof value !== "object") return false
  const candidate = value as Partial<LocalAlgorithm>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.created_at === "string" &&
    candidate.diagram !== null &&
    typeof candidate.diagram === "object" &&
    Array.isArray((candidate.diagram as SerializedDiagram).nodes) &&
    Array.isArray((candidate.diagram as SerializedDiagram).edges)
  )
}

function failureReason(cause: unknown): LocalStorageFailure {
  // A full store and a blocked one both throw from setItem, and the student
  // needs to be told which happened.
  if (
    cause instanceof DOMException &&
    (cause.name === "QuotaExceededError" ||
      cause.name === "NS_ERROR_DOM_QUOTA_REACHED")
  ) {
    return "quota"
  }
  return "unavailable"
}