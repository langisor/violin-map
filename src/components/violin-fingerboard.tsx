import { useCallback, useMemo, useState } from "react";
import {
  stepsFor,
  labelAtStep,
  frequencyAtStep,
  type ViolinString,
  type Resolution,
  type ViolinPosition,
  type NoteNotation,
} from "@/lib/violin-theory";
import { violinAudioEngine, type PlayMode } from "@/lib/violin-audio";
import { isNoteInMaqam, type MaqamPreset } from "@/lib/maqam-theory";
import type { SequencableAudioEngine } from "@/lib/maqam-playback";
import { cn } from "@/lib/utils";
import { isNoteInWesternScale, type WesternScalePreset } from "@/lib/western-scale-theory";

interface ViolinFingerboardProps {
  mode: PlayMode;
  strings: ViolinString[];
  resolution: Resolution;
  activeMaqam?: MaqamPreset | null;
  activeScale?: WesternScalePreset | null;
  orientation?: "horizontal" | "vertical";
  position?: ViolinPosition;
  notation?: NoteNotation;
  playingFrequency?: number | null;
  /** Defaults to the built-in synth engine; pass the sampler engine to play recorded samples instead. */
  engine?: SequencableAudioEngine<PlayMode>;
}

export function ViolinFingerboard({
  mode,
  strings,
  resolution,
  activeMaqam = null,
  activeScale = null,
  orientation = "horizontal",
  position = 1,
  notation = "sharps",
  playingFrequency = null,
  engine = violinAudioEngine,
}: ViolinFingerboardProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const positionStart = useMemo(() => ({ 1: 0, 2: 3, 3: 5, 4: 7, 5: 8, 6: 10, 7: 12, 8: 14 })[position], [position]);
  const steps = useMemo(() => stepsFor(resolution).map((step) => step + positionStart), [resolution, positionStart]);

  const handlePress = useCallback(
    (stringId: string, step: number, frequency: number) => {
      setActiveCell(`${stringId}-${step}`);
      void engine.noteOn(stringId, frequency, mode);
    },
    [mode, engine]
  );

  const handleRelease = useCallback(
    (stringId: string) => {
      setActiveCell(null);
      engine.noteOff(stringId, mode);
    },
    [mode, engine]
  );

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-violin-border bg-linear-to-b from-violin-panel-2 to-violin-bg p-3 shadow-inner sm:p-5">
      {orientation === "horizontal" && <p className="mb-2 text-center text-[10px] text-violin-muted sm:hidden">← Scroll to see the full fingerboard →</p>}
      <div
        className={cn(
          orientation === "horizontal" &&
            (resolution === "quarter-tone" ? "min-w-340" : "min-w-190"),
          orientation === "vertical" && "mx-auto flex w-fit items-start justify-center gap-2 sm:gap-3",
        )}
      >
        {strings
          .slice()
          .reverse()
          .map((str, rowIndex) => (
            <div
              key={str.id}
              className={cn(
                "mb-2 flex gap-2 sm:gap-3",
                orientation === "vertical" ? "mb-0 w-14 flex-col items-center sm:w-16" : "items-center",
              )}
            >
              <div
                className="flex w-8 shrink-0 flex-col items-center text-sm font-semibold sm:w-10"
                style={{ color: str.varnish }}
              >
                <span>{str.label}</span>
                <span
                  className="mt-1 w-6 rounded-full"
                  style={{
                    backgroundColor: str.varnish,
                    // thicker line for lower strings, like real string gauge
                    height: 2 + rowIndex * 0.8,
                  }}
                />
              </div>
              <div
                className={cn(
                  "flex gap-1",
                  orientation === "horizontal" ? "flex-1" : "w-full flex-col",
                )}
              >
                {steps.map((step) => {
                  const noteName = labelAtStep(str.openNote, step, notation);
                  const frequency = frequencyAtStep(str.openNote, step);
                  const cellKey = `${str.id}-${step}`;
                  const isActive = activeCell === cellKey;
                  const isOpen = step === 0;
                  const isQuarterTone = !Number.isInteger(step);
                  const inMaqam = activeMaqam
                    ? isNoteInMaqam(str.openNote, step, activeMaqam)
                    : false;
                  const inScale = activeScale ? isNoteInWesternScale(str.openNote, step, activeScale) : false;
                  const isPlaying = playingFrequency !== null && Math.abs(1200 * Math.log2(frequency / playingFrequency)) < 20;
                  return (
                    <button
                      key={cellKey}
                      aria-label={`${str.label} string, position ${step}, note ${noteName}`}
                      onMouseDown={() => handlePress(str.id, step, frequency)}
                      onMouseUp={() => handleRelease(str.id)}
                      onMouseLeave={() => isActive && handleRelease(str.id)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handlePress(str.id, step, frequency);
                      }}
                      onTouchEnd={() => handleRelease(str.id)}
                      className={cn(
                        "relative flex h-14 flex-1 flex-col items-center justify-center rounded-md border text-xs transition-colors select-none focus-visible:outline focus-visible:outline-offset-2",
                        orientation === "vertical" && "h-12 w-full shrink-0",
                        isOpen
                          ? "border-violin-border bg-violin-cell-open"
                          : "border-violin-border bg-violin-cell",
                        isQuarterTone && "border-dashed bg-violin-bg/60",
                        (inMaqam || inScale) &&
                          "border-amber-500/80 bg-amber-950/40 font-semibold ring-1 ring-amber-500/50",
                        isActive && "border-violin-e bg-violin-cell-active",
                        isPlaying && "z-10 border-cyan-300 bg-cyan-400/30 text-cyan-50 ring-2 ring-cyan-300 shadow-lg shadow-cyan-400/30"
                      )}
                      style={{ outlineColor: str.varnish }}
                    >
                      <span
                        className={cn(
                          "font-medium",
                          inMaqam || inScale ? "text-amber-300" : "text-violin-text"
                        )}
                      >
                        {noteName}
                      </span>
                      <span className="text-[10px] text-violin-muted">{step}</span>
                      {(inMaqam || inScale) && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
      <p className="mt-3 text-center text-xs text-violin-muted">
        Hold a cell to sustain in bow mode, or tap to pluck in pizzicato mode.
        {resolution === "quarter-tone"
          ? " Dashed cells are quarter tones — the note name below with a trailing \"+\" means raised a quarter tone."
          : " The small number is the semitone position above the open string."}
        {activeMaqam && (
          <span className="ml-1 text-amber-400 font-medium">
            Cells with golden dots belong to {activeMaqam.nameEn} (
            {activeMaqam.nameAr}).
          </span>
        )}
        {activeScale && <span className="ml-1 font-medium text-sky-300">Golden cells belong to {activeScale.tonic} {activeScale.kind}; cyan marks the note currently playing.</span>}
      </p>
    </div>
  );
}
