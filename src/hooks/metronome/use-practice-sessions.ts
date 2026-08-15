

import { useCallback, useEffect, useState } from "react"
import {
  clearPracticeSessions,
  deletePracticeSession,
  getTodayTotalSeconds,
  getWeekTotalSeconds,
  loadPracticeSessions,
  logPracticeSession,
  type PracticeSession,
} from "../../lib/metronome/practice-sessions"

/**
 * Loads/persists the practice session log to localStorage.
 *
 * `isLoaded` flips to true once the initial read has happened, so callers
 * can avoid flashing an empty state during hydration.
 */
export function usePracticeSessions() {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setSessions(loadPracticeSessions())
    setIsLoaded(true)
  }, [])

  const logSession = useCallback((input: Omit<PracticeSession, "id" | "endedAt">) => {
    const record = logPracticeSession(input)
    setSessions(loadPracticeSessions())
    return record
  }, [])

  const removeSession = useCallback((id: string) => {
    deletePracticeSession(id)
    setSessions(loadPracticeSessions())
  }, [])

  const clearAll = useCallback(() => {
    clearPracticeSessions()
    setSessions([])
  }, [])

  const todaySeconds = getTodayTotalSeconds(sessions)
  const weekSeconds = getWeekTotalSeconds(sessions)

  return { sessions, isLoaded, logSession, removeSession, clearAll, todaySeconds, weekSeconds }
}
