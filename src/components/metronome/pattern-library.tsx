

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CustomPatternEditor } from "@/components/metronome/custom-pattern-editor"
import {
  ARABIC_PATTERNS,
  SUBDIVISION_LABELS,
  WESTERN_PRESETS,
  type MetronomePattern,
  type Subdivision,
  type WesternPreset,
} from "../../lib/metronome/metronome-patterns"
import type { SavedPattern } from "../../lib/metronome/saved_patterns"

export type LibraryTab = "western" | "arabic" | "custom"

interface PatternLibraryProps {
  tab: LibraryTab
  onTabChange: (tab: LibraryTab) => void
  // Western
  westernPresetId: string
  onWesternPreset: (preset: WesternPreset) => void
  subdivision: Subdivision
  onSubdivision: (s: Subdivision) => void
  accentFirst: boolean
  onAccentFirst: (v: boolean) => void
  // Arabic
  arabicId: string
  onArabicSelect: (pattern: MetronomePattern) => void
  // Custom
  customPattern: MetronomePattern
  onCustomChange: (pattern: MetronomePattern) => void
  currentStep: number
  // Saved custom-pattern library
  savedPatterns: SavedPattern[]
  activeSavedId: string | null
  activeSavedName?: string
  onSavePattern: (name: string) => void
  onLoadPattern: (saved: SavedPattern) => void
  onDeletePattern: (id: string) => void
  onRenamePattern: (id: string, name: string) => void
  checkExistingPatternName: (name: string) => boolean
}

export function PatternLibrary(props: PatternLibraryProps) {
  return (
    <Tabs value={props.tab} onValueChange={(v) => props.onTabChange(v as LibraryTab)} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="western">Western</TabsTrigger>
        <TabsTrigger value="arabic">Arabic</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
      </TabsList>

      {/* Western */}
      <TabsContent value="western" className="mt-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Time signature</Label>
          <div className="grid grid-cols-4 gap-2">
            {WESTERN_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => props.onWesternPreset(preset)}
                title={preset.name}
                className={cn(
                  "flex flex-col items-center rounded-lg border py-2.5 transition-colors",
                  props.westernPresetId === preset.id
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                <span className="font-mono text-base font-bold">{preset.meter}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Note subdivision</Label>
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 3, 4] as Subdivision[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => props.onSubdivision(s)}
                className={cn(
                  "rounded-lg border py-2 text-sm font-medium transition-colors",
                  props.subdivision === s
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {SUBDIVISION_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <Label htmlFor="accent-first" className="cursor-pointer text-sm">
            Accent first beat
          </Label>
          <Switch id="accent-first" checked={props.accentFirst} onCheckedChange={props.onAccentFirst} />
        </div>
      </TabsContent>

      {/* Arabic */}
      <TabsContent value="arabic" className="mt-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {ARABIC_PATTERNS.map((pattern) => {
            const active = props.arabicId === pattern.id
            return (
              <button
                key={pattern.id}
                type="button"
                onClick={() => props.onArabicSelect(pattern)}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/15"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{pattern.name}</span>
                  <span className="font-[system-ui] text-sm text-muted-foreground" dir="rtl">
                    {pattern.altName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {pattern.meter}
                  </Badge>
                  <span className="line-clamp-1 text-xs text-muted-foreground">{pattern.description}</span>
                </div>
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded bg-primary font-mono text-[9px] font-bold text-primary-foreground">
              D
            </span>
            Dum — low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded bg-accent font-mono text-[9px] font-bold text-accent-foreground">
              T
            </span>
            Tak — high
          </span>
        </div>
      </TabsContent>

      {/* Custom */}
      <TabsContent value="custom" className="mt-5">
        <CustomPatternEditor
          pattern={props.customPattern}
          onChange={props.onCustomChange}
          currentStep={props.currentStep}
          savedPatterns={props.savedPatterns}
          activeSavedId={props.activeSavedId}
          activeSavedName={props.activeSavedName}
          onSave={props.onSavePattern}
          onLoad={props.onLoadPattern}
          onDelete={props.onDeletePattern}
          onRename={props.onRenamePattern}
          checkExistingName={props.checkExistingPatternName}
        />
      </TabsContent>
    </Tabs>
  )
}
