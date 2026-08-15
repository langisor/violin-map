

import { Eraser, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BeatGrid } from "@/components/metronome/beat-grid"
import { SavePatternDialog } from "@/components/metronome/save_pattern_dialog"
import { SavedPatternsList } from "@/components/metronome/saved_patterns_list"
import type { SavedPattern } from "../../lib/metronome/saved_patterns"
import {
  SUBDIVISION_LABELS,
  VOICE_CYCLE_PERCUSSION,
  VOICE_CYCLE_WESTERN,
  type MetronomePattern,
  type Subdivision,
  type Voice,
} from "../../lib/metronome/metronome-patterns"

interface CustomPatternEditorProps {
  pattern: MetronomePattern
  onChange: (pattern: MetronomePattern) => void
  currentStep: number
  // Saved-pattern library
  savedPatterns: SavedPattern[]
  activeSavedId: string | null
  activeSavedName?: string
  onSave: (name: string) => void
  onLoad: (saved: SavedPattern) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  checkExistingName: (name: string) => boolean
}

type EditorMode = "clicks" | "percussion"

function detectMode(steps: Voice[]): EditorMode {
  return steps.some((s) => s === "dum" || s === "tak") ? "percussion" : "clicks"
}

export function CustomPatternEditor({
  pattern,
  onChange,
  currentStep,
  savedPatterns,
  activeSavedId,
  activeSavedName,
  onSave,
  onLoad,
  onDelete,
  onRename,
  checkExistingName,
}: CustomPatternEditorProps) {
  const mode = detectMode(pattern.steps)
  const beats = pattern.grouping?.length ?? pattern.steps.length
  const subdivision = pattern.stepsPerBeat as Subdivision

  const rebuild = (nextBeats: number, nextSub: Subdivision, nextMode: EditorMode) => {
    const total = nextBeats * nextSub
    const steps: Voice[] = []
    for (let i = 0; i < total; i++) {
      const existing = pattern.steps[i]
      if (existing !== undefined) {
        steps.push(existing)
      } else if (nextMode === "clicks" && i % nextSub === 0) {
        steps.push(i === 0 ? "accent" : "beat")
      } else {
        steps.push("rest")
      }
    }
    onChange({
      ...pattern,
      stepsPerBeat: nextSub,
      grouping: Array.from({ length: nextBeats }, () => nextSub),
      steps,
    })
  }

  const setMode = (nextMode: EditorMode) => {
    // Reset the grid to a sensible default for the chosen voice set.
    const total = beats * subdivision
    const steps: Voice[] = Array.from({ length: total }, (_, i) => {
      if (nextMode === "clicks") return i % subdivision === 0 ? (i === 0 ? "accent" : "beat") : "rest"
      return i === 0 ? "dum" : "rest"
    })
    onChange({ ...pattern, steps })
  }

  const toggleStep = (index: number) => {
    const cycle = mode === "percussion" ? VOICE_CYCLE_PERCUSSION : VOICE_CYCLE_WESTERN
    const current = pattern.steps[index]
    const pos = cycle.indexOf(current)
    const next = cycle[(pos + 1) % cycle.length]
    const steps = [...pattern.steps]
    steps[index] = next
    onChange({ ...pattern, steps })
  }

  const clear = () => {
    onChange({ ...pattern, steps: pattern.steps.map(() => "rest") })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {/* Beats */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Beats</Label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="size-8 rounded-md"
              aria-label="Fewer beats"
              disabled={beats <= 1}
              onClick={() => rebuild(beats - 1, subdivision, mode)}
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="w-8 text-center font-mono text-lg font-semibold tabular-nums">{beats}</span>
            <Button
              variant="outline"
              size="sm"
              className="size-8 rounded-md"
              aria-label="More beats"
              disabled={beats >= 16}
              onClick={() => rebuild(beats + 1, subdivision, mode)}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Subdivision */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Subdivision</Label>
          <Select
            value={String(subdivision)}
            onValueChange={(v) => rebuild(beats, Number(v) as Subdivision, mode)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {([1, 2, 3, 4] as Subdivision[]).map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {SUBDIVISION_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice mode */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Sound</Label>
          <div className="flex rounded-md border border-border p-0.5">
            {(["clicks", "percussion"] as EditorMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  "flex-1 rounded-[5px] px-2 py-1 text-xs font-medium capitalize transition-colors " +
                  (mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Clear */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Reset</Label>
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={clear}>
            <Eraser className="size-3.5" />
            Clear
          </Button>
        </div>

        {/* Save */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Library</Label>
          <SavePatternDialog defaultName={activeSavedName} checkExisting={checkExistingName} onSave={onSave} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <BeatGrid
          steps={pattern.steps}
          grouping={pattern.grouping}
          currentStep={currentStep}
          editable
          onToggleStep={toggleStep}
        />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Tap a cell to cycle through{" "}
          {mode === "percussion" ? "rest → tak → dum" : "rest → beat → accent → sub"}.
        </p>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <Label className="text-xs text-muted-foreground">Saved patterns</Label>
        <SavedPatternsList
          patterns={savedPatterns}
          activeId={activeSavedId}
          onLoad={onLoad}
          onDelete={onDelete}
          onRename={onRename}
        />
      </div>
    </div>
  )
}
