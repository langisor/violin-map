import { useCallback, useState } from "react";
import {
  stepsFor,
  labelAtStep,
  frequencyAtStep,
  type ViolinString,
  type Resolution,
} from "@/lib/violin-theory";
import { violinAudioEngine, type PlayMode } from "@/lib/violin-audio";
import { isNoteInMaqam, type MaqamPreset } from "@/lib/maqam-theory";
import { cn } from "@/lib/utils";

interface ViolinFingerboardProps {
  mode: PlayMode;
  strings: ViolinString[];
  resolution: Resolution;
  activeMaqam?: MaqamPreset | null;
}

export function ViolinFingerboard({
  mode,
  strings,
  resolution,
  activeMaqam = null,
}: ViolinFingerboardProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const steps = stepsFor(resolution);

  const handlePress = useCallback(
    (stringId: string, step: number, frequency: number) => {
      setActiveCell(`${stringId}-${step}`);
      violinAudioEngine.noteOn(stringId, frequency, mode);
    },
    [mode]
  );

  const handleRelease = useCallback(
    (stringId: string) => {
      setActiveCell(null);
      violinAudioEngine.noteOff(stringId, mode);
    },
    [mode]
  );

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-violin-border bg-gradient-to-b from-violin-panel-2 to-violin-bg p-3 shadow-inner sm:p-5">
      <p className="mb-2 text-center text-[10px] text-violin-muted sm:hidden">
        ← Scroll to see the full fingerboard →
      </p>
      <div className={resolution === "quarter-tone" ? "min-w-[1360px]" : "min-w-[760px]"}>
        {strings
          .slice()
          .reverse()
          .map((str, rowIndex) => (
            <div key={str.id} className="mb-2 flex items-center gap-2 sm:gap-3">
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
              <div className="flex flex-1 gap-1">
                {steps.map((step) => {
                  const noteName = labelAtStep(str.openNote, step);
                  const frequency = frequencyAtStep(str.openNote, step);
                  const cellKey = `${str.id}-${step}`;
                  const isActive = activeCell === cellKey;
                  const isOpen = step === 0;
                  const isQuarterTone = !Number.isInteger(step);
                  const inMaqam = activeMaqam
                    ? isNoteInMaqam(str.openNote, step, activeMaqam)
                    : false;
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
                        "relative flex h-14 flex-1 flex-col items-center justify-center rounded-md border text-xs transition-colors select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                        isOpen
                          ? "border-violin-border bg-violin-cell-open"
                          : "border-violin-border bg-violin-cell",
                        isQuarterTone && "border-dashed bg-violin-bg/60",
                        inMaqam &&
                          "border-amber-500/80 bg-amber-950/40 font-semibold ring-1 ring-amber-500/50",
                        isActive && "border-violin-e bg-violin-cell-active"
                      )}
                      style={{ outlineColor: str.varnish }}
                    >
                      <span
                        className={cn(
                          "font-medium",
                          inMaqam ? "text-amber-300" : "text-violin-text"
                        )}
                      >
                        {noteName}
                      </span>
                      <span className="text-[10px] text-violin-muted">{step}</span>
                      {inMaqam && (
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
      </p>
    </div>
  );
}