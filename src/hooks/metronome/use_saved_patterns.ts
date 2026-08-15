

import { useCallback, useEffect, useState } from "react"
import {
  deleteSavedPattern,
  findByName,
  loadSavedPatterns,
  renameSavedPattern,
  saveNewPattern,
  type SavedPattern,
} from "../../lib/metronome/saved_patterns"
import type { MetronomePattern } from "../../lib/metronome/metronome-patterns"

/**
 * Loads/persists the user's custom pattern library to localStorage.
 *
 * `isLoaded` flips to true once the initial read has happened, so callers
 * can avoid flashing an empty state during hydration.
 */
export function useSavedPatterns() {
  const [patterns, setPatterns] = useState<SavedPattern[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setPatterns(loadSavedPatterns())
    setIsLoaded(true)
  }, [])

  const savePattern = useCallback((name: string, pattern: MetronomePattern, bpm: number, overwriteId?: string) => {
    const record = saveNewPattern(name, pattern, bpm, overwriteId)
    setPatterns(loadSavedPatterns())
    return record
  }, [])

  const removePattern = useCallback((id: string) => {
    deleteSavedPattern(id)
    setPatterns(loadSavedPatterns())
  }, [])

  const renamePattern = useCallback((id: string, name: string) => {
    renameSavedPattern(id, name)
    setPatterns(loadSavedPatterns())
  }, [])

  const findExistingByName = useCallback(
    (name: string) => patterns.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()) ?? findByName(name),
    [patterns],
  )

  return { patterns, isLoaded, savePattern, removePattern, renamePattern, findExistingByName }
}
