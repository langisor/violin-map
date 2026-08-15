

import { useMemo, useRef, useState } from "react"
import { CheckCircle2, Flame, History, RotateCcw, Timer, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePracticeTimer } from "../../hooks/metronome/use-practice-timer"
import { usePracticeSessions } from "../../hooks/metronome/use-practice-sessions"

const GOAL_PRESETS_MIN = [5, 10, 15, 20, 30, 45, 60]

interface PracticeTimerProps {
  isPlaying: boolean
  onStopPlaying: () => void
  patternName: string
  bpm: number
  className?: string
}

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m)
  const ss = String(sec).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function formatShort(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

/** Short ascending two-tone chime played on goal completion. */
function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
    const notes = [660, 880]
    notes.forEach((freq, i) => {
      const time = ctx.currentTime + i * 0.16
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, time)
      gain.gain.setValueAtTime(0.0001, time)
      gain.gain.exponentialRampToValueAtTime(0.9, time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5)
      osc.connect(gain).connect(master)
      osc.start(time)
      osc.stop(time + 0.55)
    })
    window.setTimeout(() => void ctx.close(), 900)
  } catch {
    // Ignore — audio is a nice-to-have, never block on it.
  }
}

export function PracticeTimer({ isPlaying, onStopPlaying, patternName, bpm, className }: PracticeTimerProps) {
  const [goalMinutes, setGoalMinutes] = useState(15)
  const [customMinutes, setCustomMinutes] = useState("")
  const [autoLog, setAutoLog] = useState(true)
  const [autoStop, setAutoStop] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const goalSeconds = goalMinutes * 60
  const { sessions, logSession, removeSession, todaySeconds } = usePracticeSessions()

  // Tracks how much of the current run has already been written to history,
  // so "End & log session" only logs the remaining, un-logged portion.
  const loggedSecondsRef = useRef(0)

  const { elapsedSeconds, goalReached, reset } = usePracticeTimer({
    isRunning: isPlaying,
    goalSeconds,
    onGoalReached: () => {
      playChime()
      if (autoLog) {
        logSession({
          durationSeconds: goalSeconds,
          goalSeconds,
          goalMet: true,
          patternName,
          bpm,
        })
        loggedSecondsRef.current = goalSeconds
      }
      if (autoStop) onStopPlaying()
    },
  })

  const progressPct = goalSeconds > 0 ? Math.min(100, (elapsedSeconds / goalSeconds) * 100) : 0
  const remainingSeconds = Math.max(0, goalSeconds - elapsedSeconds)

  const handleSelectPreset = (min: number) => {
    setGoalMinutes(min)
    setCustomMinutes("")
  }

  const handleCustomSubmit = () => {
    const value = Math.round(Number(customMinutes))
    if (Number.isFinite(value) && value > 0) {
      setGoalMinutes(Math.min(180, value))
    }
  }

  const handleEndSession = () => {
    const unlogged = elapsedSeconds - loggedSecondsRef.current
    if (unlogged >= 5) {
      logSession({
        durationSeconds: unlogged,
        goalSeconds,
        goalMet: goalReached,
        patternName,
        bpm,
      })
    }
    loggedSecondsRef.current = 0
    reset()
  }

  const handleResetOnly = () => {
    loggedSecondsRef.current = 0
    reset()
  }

  const recentSessions = useMemo(() => sessions.slice(0, showHistory ? 10 : 3), [sessions, showHistory])

  return (
    <div className={cn("flex flex-col gap-5 rounded-2xl border border-border/60 bg-background/50 p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Practice timer</span>
        </div>
        {todaySeconds > 0 ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="size-3.5 text-primary" />
            {formatShort(todaySeconds)} today
          </span>
        ) : null}
      </div>

      {/* Readout */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-bold tabular-nums text-foreground">
            {formatClock(elapsedSeconds)}
          </span>
          <span className="text-sm text-muted-foreground">/ {formatClock(goalSeconds)}</span>
        </div>
        <Progress value={progressPct} className="w-full" indicatorClassName={cn(goalReached && "bg-accent")} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {goalReached ? (
            <span className="flex items-center gap-1 font-medium text-accent">
              <CheckCircle2 className="size-3.5" />
              Goal reached
              {elapsedSeconds > goalSeconds ? ` — +${formatClock(elapsedSeconds - goalSeconds)} extra` : ""}
            </span>
          ) : (
            <span>{formatClock(remainingSeconds)} remaining</span>
          )}
          {!isPlaying && elapsedSeconds > 0 ? <span>· paused</span> : null}
        </div>
      </div>

      {/* Goal selection */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">Session goal</Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_PRESETS_MIN.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => handleSelectPreset(min)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                goalMinutes === min
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {min}m
            </button>
          ))}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={180}
              placeholder="Custom"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
              className="w-20"
            />
            <Button variant="default" size="sm" onClick={handleCustomSubmit}>
              Set
            </Button>
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
          <Label htmlFor="auto-log" className="cursor-pointer text-xs">
            Auto-log on goal
          </Label>
          <Switch id="auto-log" size="sm" checked={autoLog} onCheckedChange={setAutoLog} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
          <Label htmlFor="auto-stop" className="cursor-pointer text-xs">
            Auto-stop on goal
          </Label>
          <Switch id="auto-stop" size="sm" checked={autoStop} onCheckedChange={setAutoStop} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleEndSession}
          disabled={elapsedSeconds < 5}
          className="flex-1"
        >
          End &amp; log session
        </Button>
        <Button variant="outline" size="sm" aria-label="Reset timer" onClick={handleResetOnly}>
          <RotateCcw className="size-3.5" />
        </Button>
      </div>

      {/* History */}
      {sessions.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-3.5" />
            {showHistory ? "Recent sessions" : `Recent sessions (${sessions.length} logged)`}
          </button>
          <ul className="flex flex-col gap-1.5">
            {recentSessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {formatShort(session.durationSeconds)}
                    {session.goalMet ? (
                      <Badge variant="secondary" className="ml-2 align-middle text-[10px]">
                        goal met
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(session.endedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {session.patternName ? ` · ${session.patternName}` : ""}
                    {session.bpm ? ` · ${session.bpm} BPM` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Delete session"
                  onClick={() => removeSession(session.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
