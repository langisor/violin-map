

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useMetronome } from "../../hooks/metronome/use-metronome"
import { useSavedPatterns } from "../../hooks/metronome/use_saved_patterns"
import { BeatGrid } from "@/components/metronome/beat-grid"
import { TransportControls } from "@/components/metronome/transport-controls"
import { PatternLibrary, type LibraryTab } from "@/components/metronome/pattern-library"
import { PracticeTimer } from "@/components/metronome/practice-timer"
import type { SavedPattern } from "../../lib/metronome/saved_patterns"
import {
  ARABIC_PATTERNS,
  buildWesternPattern,
  WESTERN_PRESETS,
  type MetronomePattern,
  type Subdivision,
  type WesternPreset,
} from "../../lib/metronome/metronome-patterns"

interface MetronomeProps {
  defaultBpm?: number
  defaultTab?: LibraryTab
  className?: string
}

const DEFAULT_CUSTOM: MetronomePattern = {
  id: "custom",
  name: "Custom",
  group: "custom",
  stepsPerBeat: 2,
  grouping: [2, 2, 2, 2],
  steps: ["accent", "rest", "beat", "rest", "beat", "rest", "beat", "rest"],
}

export function Metronome({ defaultBpm = 100, defaultTab = "western", className }: MetronomeProps) {
  const [bpm, setBpm] = useState(defaultBpm)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.9)

  const [tab, setTab] = useState<LibraryTab>(defaultTab)

  // Western state
  const [westernPresetId, setWesternPresetId] = useState("4-4")
  const [subdivision, setSubdivision] = useState<Subdivision>(1)
  const [accentFirst, setAccentFirst] = useState(true)

  // Arabic state
  const [arabicId, setArabicId] = useState("maqsum")

  // Custom state
  const [customPattern, setCustomPattern] = useState<MetronomePattern>(DEFAULT_CUSTOM)
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null)
  const [activeSavedName, setActiveSavedName] = useState<string | undefined>(undefined)

  const { patterns: savedPatterns, savePattern, removePattern, renamePattern, findExistingByName } =
    useSavedPatterns()

  // Editing the grid manually detaches it from whichever saved pattern was loaded.
  const handleCustomPatternEdit = (pattern: MetronomePattern) => {
    setCustomPattern(pattern)
    setActiveSavedId(null)
    setActiveSavedName(undefined)
  }

  const handleSavePattern = (name: string) => {
    const overwriteId = activeSavedId ?? findExistingByName(name)?.id
    const record = savePattern(name, customPattern, bpm, overwriteId)
    setActiveSavedId(record.id)
    setActiveSavedName(record.name)
  }

  const handleLoadPattern = (saved: SavedPattern) => {
    setCustomPattern({
      id: "custom",
      name: saved.name,
      group: "custom",
      stepsPerBeat: saved.pattern.stepsPerBeat,
      grouping: saved.pattern.grouping,
      steps: saved.pattern.steps,
    })
    setBpm(saved.bpm)
    setActiveSavedId(saved.id)
    setActiveSavedName(saved.name)
  }

  const handleDeletePattern = (id: string) => {
    removePattern(id)
    if (activeSavedId === id) {
      setActiveSavedId(null)
      setActiveSavedName(undefined)
    }
  }

  const handleRenamePattern = (id: string, name: string) => {
    renamePattern(id, name)
    if (activeSavedId === id) setActiveSavedName(name)
  }

  const checkExistingPatternName = (name: string) => Boolean(findExistingByName(name))

  const activePattern = useMemo<MetronomePattern>(() => {
    if (tab === "arabic") {
      return ARABIC_PATTERNS.find((p) => p.id === arabicId) ?? ARABIC_PATTERNS[0]
    }
    if (tab === "custom") {
      return customPattern
    }
    const preset = WESTERN_PRESETS.find((p) => p.id === westernPresetId) ?? WESTERN_PRESETS[2]
    return buildWesternPattern(preset, subdivision, accentFirst)
  }, [tab, arabicId, customPattern, westernPresetId, subdivision, accentFirst])

  const { currentStep } = useMetronome({
    bpm,
    steps: activePattern.steps,
    stepsPerBeat: activePattern.stepsPerBeat,
    isPlaying,
    volume,
  })

  const handleWesternPreset = (preset: WesternPreset) => setWesternPresetId(preset.id)
  const handleArabicSelect = (pattern: MetronomePattern) => setArabicId(pattern.id)

  return (
    <Card className={cn("w-full gap-0 overflow-hidden bg-card/80 py-0 shadow-2xl backdrop-blur", className)}>
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        {/* Active pattern header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Now playing</span>
            <span className="text-lg font-semibold text-foreground">
              {activePattern.name}
              {activePattern.altName ? (
                <span className="ml-2 text-base font-normal text-muted-foreground" dir="rtl">
                  {activePattern.altName}
                </span>
              ) : null}
            </span>
          </div>
          {activePattern.meter ? (
            <span className="rounded-lg border border-border bg-background/50 px-3 py-1.5 font-mono text-lg font-bold text-primary">
              {activePattern.meter}
            </span>
          ) : null}
        </div>

        {/* Live beat visualization */}
        <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
          <BeatGrid steps={activePattern.steps} grouping={activePattern.grouping} currentStep={currentStep} />
        </div>

        <TransportControls
          bpm={bpm}
          onBpmChange={setBpm}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          volume={volume}
          onVolumeChange={setVolume}
        />

        <PracticeTimer
          isPlaying={isPlaying}
          onStopPlaying={() => setIsPlaying(false)}
          patternName={activePattern.name}
          bpm={bpm}
        />

        <Separator />

        <PatternLibrary
          tab={tab}
          onTabChange={setTab}
          westernPresetId={westernPresetId}
          onWesternPreset={handleWesternPreset}
          subdivision={subdivision}
          onSubdivision={setSubdivision}
          accentFirst={accentFirst}
          onAccentFirst={setAccentFirst}
          arabicId={arabicId}
          onArabicSelect={handleArabicSelect}
          customPattern={customPattern}
          onCustomChange={handleCustomPatternEdit}
          currentStep={currentStep}
          savedPatterns={savedPatterns}
          activeSavedId={activeSavedId}
          activeSavedName={activeSavedName}
          onSavePattern={handleSavePattern}
          onLoadPattern={handleLoadPattern}
          onDeletePattern={handleDeletePattern}
          onRenamePattern={handleRenamePattern}
          checkExistingPatternName={checkExistingPatternName}
        />
      </div>
    </Card>
  )
}
