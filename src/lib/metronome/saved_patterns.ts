// Persistence layer for user-authored custom patterns.
//
// Deliberately framework-free (no React) so it can be unit tested or swapped
// for a remote backend later without touching component code. The hook in
// `hooks/use_saved_patterns.ts` is the only consumer that should import this.

import type { MetronomePattern } from "./metronome-patterns"

const STORAGE_KEY = "metronome:saved-patterns:v1"
const MAX_SAVED_PATTERNS = 50

export interface SavedPattern {
  id: string
  name: string
  bpm: number
  createdAt: number
  updatedAt: number
  pattern: Pick<MetronomePattern, "stepsPerBeat" | "grouping" | "steps">
}

function isBrowser() {
  return typeof window !== "undefined"
}

function generateId(): string {
  if (isBrowser() && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID()
  }
  return `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function safeParse(raw: string | null): SavedPattern[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is SavedPattern =>
        item && typeof item.id === "string" && typeof item.name === "string" && Array.isArray(item.pattern?.steps),
    )
  } catch {
    return []
  }
}

/** Read all saved patterns, newest first. Returns [] on the server or on any storage error. */
export function loadSavedPatterns(): SavedPattern[] {
  if (!isBrowser()) return []
  try {
    const patterns = safeParse(window.localStorage.getItem(STORAGE_KEY))
    return patterns.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

function persist(patterns: SavedPattern[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns))
}

/** Create a new saved pattern (or overwrite the one matching `overwriteId`). */
export function saveNewPattern(
  name: string,
  pattern: MetronomePattern,
  bpm: number,
  overwriteId?: string,
): SavedPattern {
  const existing = loadSavedPatterns()
  const now = Date.now()
  const record: SavedPattern = {
    id: overwriteId ?? generateId(),
    name: name.trim(),
    bpm,
    createdAt: overwriteId ? (existing.find((p) => p.id === overwriteId)?.createdAt ?? now) : now,
    updatedAt: now,
    pattern: {
      stepsPerBeat: pattern.stepsPerBeat,
      grouping: pattern.grouping,
      steps: pattern.steps,
    },
  }

  const withoutTarget = existing.filter((p) => p.id !== record.id)
  const next = [record, ...withoutTarget].slice(0, MAX_SAVED_PATTERNS)
  persist(next)
  return record
}

export function renameSavedPattern(id: string, name: string): void {
  const existing = loadSavedPatterns()
  const next = existing.map((p) => (p.id === id ? { ...p, name: name.trim(), updatedAt: Date.now() } : p))
  persist(next)
}

export function deleteSavedPattern(id: string): void {
  const existing = loadSavedPatterns()
  persist(existing.filter((p) => p.id !== id))
}

export function findByName(name: string): SavedPattern | undefined {
  const normalized = name.trim().toLowerCase()
  return loadSavedPatterns().find((p) => p.name.trim().toLowerCase() === normalized)
}

export { MAX_SAVED_PATTERNS }
