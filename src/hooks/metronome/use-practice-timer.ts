

import { useCallback, useEffect, useRef, useState } from "react"

interface UsePracticeTimerOptions {
  /** Timer accrues elapsed time only while this is true (typically the metronome's isPlaying state). */
  isRunning: boolean
  /** Target duration in seconds. 0 or less means "no goal". */
  goalSeconds: number
  /** Fires once, the moment elapsed time crosses the goal. */
  onGoalReached?: () => void
}

/**
 * Wall-clock practice timer. Tracks elapsed time across pause/resume cycles
 * (e.g. the metronome being stopped and started again) without drifting,
 * using `performance.now()` deltas rather than a naive tick counter.
 */
export function usePracticeTimer({ isRunning, goalSeconds, onGoalReached }: UsePracticeTimerOptions) {
  const [elapsedMs, setElapsedMs] = useState(0)

  const baseRef = useRef(0)
  const startRef = useRef<number | null>(null)
  const prevGoalReachedRef = useRef(false)
  const onGoalReachedRef = useRef(onGoalReached)
  onGoalReachedRef.current = onGoalReached

  useEffect(() => {
    if (!isRunning) {
      if (startRef.current !== null) {
        baseRef.current += performance.now() - startRef.current
        startRef.current = null
      }
      return
    }

    startRef.current = performance.now()
    const TICK_MS = 200
    const id = window.setInterval(() => {
      const now = performance.now()
      const total = baseRef.current + (now - (startRef.current ?? now))
      setElapsedMs(total)
    }, TICK_MS)

    return () => {
      window.clearInterval(id)
      if (startRef.current !== null) {
        baseRef.current += performance.now() - startRef.current
        startRef.current = null
      }
    }
  }, [isRunning])

  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const goalReached = goalSeconds > 0 && elapsedSeconds >= goalSeconds

  // Fire the callback exactly once per crossing, not on every tick past the goal.
  useEffect(() => {
    if (goalReached && !prevGoalReachedRef.current) {
      onGoalReachedRef.current?.()
    }
    prevGoalReachedRef.current = goalReached
  }, [goalReached])

  const reset = useCallback(() => {
    baseRef.current = 0
    startRef.current = isRunning ? performance.now() : null
    prevGoalReachedRef.current = false
    setElapsedMs(0)
  }, [isRunning])

  return { elapsedMs, elapsedSeconds, goalReached, reset }
}
