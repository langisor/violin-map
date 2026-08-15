

import { cn } from "@/lib/utils"
import { isPercussionVoice, type Voice } from "../../lib/metronome/metronome-patterns"

interface BeatGridProps {
  steps: Voice[]
  grouping?: number[]
  currentStep: number
  editable?: boolean
  onToggleStep?: (index: number) => void
  className?: string
}

const VOICE_STYLES: Record<Voice, string> = {
  rest: "bg-muted/40 border-border text-muted-foreground",
  accent: "bg-primary border-primary text-primary-foreground",
  beat: "bg-secondary border-border text-secondary-foreground",
  sub: "bg-muted border-border text-muted-foreground",
  dum: "bg-primary border-primary text-primary-foreground",
  tak: "bg-accent border-tak text-accent-foreground",
}

const VOICE_GLYPH: Record<Voice, string> = {
  rest: "",
  accent: "»",
  beat: "•",
  sub: "·",
  dum: "D",
  tak: "T",
}

function splitIntoGroups(length: number, grouping?: number[]): number[] {
  if (grouping && grouping.reduce((a, b) => a + b, 0) === length) return grouping
  return [length]
}

export function BeatGrid({
  steps,
  grouping,
  currentStep,
  editable = false,
  onToggleStep,
  className,
}: BeatGridProps) {
  const groups = splitIntoGroups(steps.length, grouping)

  let offset = 0
  return (
    <div className={cn("flex flex-wrap items-stretch justify-center gap-3", className)}>
      {groups.map((groupSize, groupIdx) => {
        const start = offset
        offset += groupSize
        return (
          <div
            key={groupIdx}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/40 p-2"
          >
            {Array.from({ length: groupSize }, (_, i) => {
              const index = start + i
              const voice = steps[index]
              const isActive = index === currentStep
              const isSounding = voice !== "rest"
              const Tag = editable ? "button" : "div"
              return (
                <Tag
                  key={index}
                  type={editable ? "button" : undefined}
                  onClick={editable ? () => onToggleStep?.(index) : undefined}
                  aria-label={
                    editable ? `Step ${index + 1}: ${voice}. Click to change.` : `Step ${index + 1}: ${voice}`
                  }
                  className={cn(
                    "relative flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-100",
                    // Percussion cells are wider to fit D/T; others square.
                    isPercussionVoice(voice) || voice === "accent" ? "h-11 w-11" : "h-11 w-10",
                    VOICE_STYLES[voice],
                    editable && "cursor-pointer hover:brightness-110 active:scale-95",
                    isActive && isSounding && "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background",
                    isActive && !isSounding && "ring-2 ring-muted-foreground/50 ring-offset-2 ring-offset-background",
                  )}
                >
                  {VOICE_GLYPH[voice]}
                  {isActive && (
                    <span className="pointer-events-none absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Tag>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
