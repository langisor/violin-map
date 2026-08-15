// Persistence layer for logged practice sessions.
//
// Deliberately framework-free (no React), matching the pattern used by
// `lib/saved_patterns.ts`. The hook in `hooks/use-practice-sessions.ts` is
// the only consumer that should import this directly.

const STORAGE_KEY = "metronome:practice-sessions:v1"
const MAX_SESSIONS = 200

export interface PracticeSession {
  id: string
  /** Timestamp (ms) when the session was logged. */
  endedAt: number
  /** Actual time spent practicing, in seconds. */
  durationSeconds: number
  /** The goal that was active for this session, in seconds (0 = no goal). */
  goalSeconds: number
  /** Whether the goal was reached during this session. */
  goalMet: boolean
  /** Rhythm pattern that was active, for context in the history list. */
  patternName?: string
  bpm?: number
}

function isBrowser() {
  return typeof window !== "undefined"
}

function generateId(): string {
  if (isBrowser() && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function safeParse(raw: string | null): PracticeSession[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is PracticeSession =>
        item &&
        typeof item.id === "string" &&
        typeof item.endedAt === "number" &&
        typeof item.durationSeconds === "number",
    )
  } catch {
    return []
  }
}

/** Read all logged sessions, newest first. Returns [] on the server or on any storage error. */
export function loadPracticeSessions(): PracticeSession[] {
  if (!isBrowser()) return []
  try {
    const sessions = safeParse(window.localStorage.getItem(STORAGE_KEY))
    return sessions.sort((a, b) => b.endedAt - a.endedAt)
  } catch {
    return []
  }
}

function persist(sessions: PracticeSession[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

/** Log a completed practice session. Sessions under 5 seconds are ignored as noise. */
export function logPracticeSession(input: Omit<PracticeSession, "id" | "endedAt">): PracticeSession | null {
  if (input.durationSeconds < 5) return null
  const existing = loadPracticeSessions()
  const record: PracticeSession = {
    id: generateId(),
    endedAt: Date.now(),
    ...input,
  }
  const next = [record, ...existing].slice(0, MAX_SESSIONS)
  persist(next)
  return record
}

export function deletePracticeSession(id: string): void {
  const existing = loadPracticeSessions()
  persist(existing.filter((s) => s.id !== id))
}

export function clearPracticeSessions(): void {
  persist([])
}

function isSameDay(a: number, b: number) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

/** Total seconds practiced "today" (local time) across all logged sessions. */
export function getTodayTotalSeconds(sessions: PracticeSession[]): number {
  const now = Date.now()
  return sessions.filter((s) => isSameDay(s.endedAt, now)).reduce((sum, s) => sum + s.durationSeconds, 0)
}

/** Total seconds practiced in the last 7 days, including today. */
export function getWeekTotalSeconds(sessions: PracticeSession[]): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  return sessions.filter((s) => s.endedAt >= cutoff).reduce((sum, s) => sum + s.durationSeconds, 0)
}

export { MAX_SESSIONS }
