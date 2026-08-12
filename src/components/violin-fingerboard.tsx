import { useCallback, useMemo, useState, type CSSProperties } from "react";
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

/**
 * In a position, the four fingers fall 2, 4, 5, and 7 semitones above the
 * open string. These coloured guides emulate the tapes commonly placed on a
 * beginner's violin fingerboard.
 */
const FINGER_TAPES = [
  { offset: 2, color: "#38bdf8", label: "First finger" },
  { offset: 4, color: "#facc15", label: "Second finger" },
  { offset: 5, color: "#fb7185", label: "Third finger" },
  { offset: 7, color: "#a78bfa", label: "Fourth finger (pinky)" },
] as const;

function tapeAtStep(step: number, positionStart: number) {
  return FINGER_TAPES.find(({ offset }) => step === positionStart + offset);
}

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
          orientation === "vertical" && "mx-auto w-fit",
        )}
      >
        <div
          className={cn(
            "relative grid gap-x-1 gap-y-2 sm:gap-x-1.5 sm:gap-y-3",
            orientation === "horizontal" ? "grid-cols-[2rem_repeat(var(--step-count),minmax(0,1fr))] sm:grid-cols-[2.5rem_repeat(var(--step-count),minmax(0,1fr))]" : "grid-cols-[repeat(var(--string-count),3.5rem)] grid-rows-[2.5rem_repeat(var(--step-count),3rem)] sm:grid-cols-[repeat(var(--string-count),4rem)]",
          )}
          style={{
            "--step-count": steps.length,
            "--string-count": strings.length,
          } as CSSProperties}
        >
          {FINGER_TAPES.map((tape) => {
            const tapeStepIndex = steps.findIndex((step) => step === positionStart + tape.offset);
            if (tapeStepIndex < 0) return null;

            return (
              <span
                key={tape.label}
                aria-label={`${tape.label} tape`}
                className={cn(
                  "pointer-events-none z-10 self-stretch justify-self-center rounded-sm opacity-80 shadow-sm",
                  orientation === "horizontal" ? "my-0.5 w-3/5" : "mx-0.5 h-3/5 self-center justify-self-stretch",
                )}
                style={{
                  backgroundColor: tape.color,
                  gridColumn: orientation === "horizontal" ? tapeStepIndex + 2 : "1 / -1",
                  gridRow: orientation === "horizontal" ? "1 / -1" : tapeStepIndex + 2,
                }}
              />
            );
          })}
          {strings
            .slice()
            .reverse()
            .map((str, rowIndex) => (
              <div
                key={str.id}
                className="z-20 flex shrink-0 flex-col items-center justify-center text-sm font-semibold"
                style={{
                  color: str.varnish,
                  gridColumn: orientation === "horizontal" ? 1 : rowIndex + 1,
                  gridRow: orientation === "horizontal" ? rowIndex + 1 : 1,
                }}
              >
                <span>{str.label}</span>
                <span
                  className="mt-1 w-6 rounded-full"
                  style={{
                    backgroundColor: str.varnish,
                    // Thicker line for lower strings, like real string gauge.
                    height: 2 + rowIndex * 0.8,
                  }}
                />
              </div>
            ))}
          {strings
            .slice()
            .reverse()
            .flatMap((str, rowIndex) =>
              steps.map((step, stepIndex) => {
                  const noteName = labelAtStep(str.openNote, step, notation);
                  const frequency = frequencyAtStep(str.openNote, step);
                  const cellKey = `${str.id}-${step}`;
                  const isActive = activeCell === cellKey;
                  const isOpen = step === 0;
                  const isQuarterTone = !Number.isInteger(step);
                  const tape = tapeAtStep(step, positionStart);
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
                        "relative z-20 flex h-14 min-w-0 flex-col items-center justify-center rounded-md border text-xs transition-colors select-none focus-visible:outline focus-visible:outline-offset-2",
                        orientation === "vertical" && "h-12",
                        isOpen
                          ? "border-violin-border bg-violin-cell-open"
                          : "border-violin-border bg-violin-cell",
                        isQuarterTone && "border-dashed bg-violin-bg/60",
                        (inMaqam || inScale) &&
                          "border-amber-500/80 bg-amber-950/40 font-semibold ring-1 ring-amber-500/50",
                        isActive && "border-violin-e bg-violin-cell-active",
                        isPlaying && "z-10 border-cyan-300 bg-cyan-400/30 text-cyan-50 ring-2 ring-cyan-300 shadow-lg shadow-cyan-400/30",
                        tape && !isActive && !isPlaying && "bg-transparent",
                      )}
                      style={{
                        outlineColor: str.varnish,
                        gridColumn: orientation === "horizontal" ? stepIndex + 2 : rowIndex + 1,
                        gridRow: orientation === "horizontal" ? rowIndex + 1 : stepIndex + 2,
                      }}
                    >
                      {tape && <span className="sr-only">{tape.label} tape</span>}
                      <span
                        className={cn(
                          "relative z-10 font-medium",
                          inMaqam || inScale ? "text-amber-300" : "text-violin-text"
                        )}
                      >
                        {noteName}
                      </span>
                      <span className="relative z-10 text-[10px] text-violin-muted">{step}</span>
                      {(inMaqam || inScale) && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-300" />
                      )}
                    </button>
                  );
                }),
            )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-violin-muted">
        {FINGER_TAPES.map((tape) => (
          <span key={tape.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ backgroundColor: tape.color }} />
            {tape.label}
          </span>
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
