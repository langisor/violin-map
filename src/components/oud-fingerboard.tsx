import { useCallback, useState } from "react";
import {
  stepsFor,
  labelAtStep,
  frequencyAtStep,
  type Resolution,
} from "@/lib/violin-theory";
import type { OudString } from "@/lib/oud-theory";
import { isNoteInMaqam, type MaqamPreset } from "@/lib/maqam-theory";
import { oudAudioEngine, type OudPlayMode } from "@/lib/oud-audio";
import { cn } from "@/lib/utils";

interface OudFingerboardProps {
  mode: OudPlayMode;
  strings: OudString[];
  resolution: Resolution;
  activeMaqam: MaqamPreset | null;
}

export function OudFingerboard({
  mode,
  strings,
  resolution,
  activeMaqam,
}: OudFingerboardProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const steps = stepsFor(resolution);

  const handlePress = useCallback(
    (stringId: string, step: number, frequency: number) => {
      setActiveCell(`${stringId}-${step}`);
      oudAudioEngine.noteOn(stringId, frequency, mode);
    },
    [mode],
  );

  const handleRelease = useCallback(
    (stringId: string) => {
      setActiveCell(null);
      oudAudioEngine.noteOff(stringId, mode);
    },
    [mode],
  );

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#251910] to-[#140c07] p-5 shadow-2xl">
      <div
        className={
          resolution === "quarter-tone" ? "min-w-[1360px]" : "min-w-[760px]"
        }
      >
        {strings
          .slice()
          .reverse()
          .map((str, rowIndex) => {
            const isSingleBass = rowIndex === strings.length - 1;
            return (
              <div key={str.id} className="mb-3 flex items-center gap-3">
                {/* String Course Header */}
                <div
                  className="flex w-28 shrink-0 flex-col items-start text-xs font-medium"
                  style={{ color: str.varnish }}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-violin-text">
                    <span>{str.label}</span>
                    <span className="text-[10px] text-amber-500/80">
                      ({str.traditionalName})
                    </span>
                  </div>
                  {/* String Gauge Visual (Double line for courses, single line for bass) */}
                  <div className="mt-1.5 flex flex-col gap-0.5 w-full">
                    <span
                      className="w-full rounded-full"
                      style={{
                        backgroundColor: str.varnish,
                        height: 2 + (strings.length - rowIndex) * 0.35,
                      }}
                    />
                    {!isSingleBass && (
                      <span
                        className="w-full rounded-full opacity-80"
                        style={{
                          backgroundColor: str.varnish,
                          height: 2 + (strings.length - rowIndex) * 0.35,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Fingerboard Grid */}
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
                        aria-label={`${str.label} course, position ${step}, note ${noteName}`}
                        onMouseDown={() => handlePress(str.id, step, frequency)}
                        onMouseUp={() => handleRelease(str.id)}
                        onMouseLeave={() => isActive && handleRelease(str.id)}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          handlePress(str.id, step, frequency);
                        }}
                        onTouchEnd={() => handleRelease(str.id)}
                        className={cn(
                          "relative flex h-14 flex-1 flex-col items-center justify-center rounded-md border text-xs transition-all select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                          isOpen
                            ? "border-amber-900/60 bg-amber-950/40"
                            : "border-amber-950/80 bg-[#1e130b]",
                          isQuarterTone && "border-dashed bg-[#170e08]",
                          inMaqam &&
                            "border-amber-500/80 bg-amber-950/70 font-semibold ring-1 ring-amber-500/50 shadow-sm shadow-amber-900/40",
                          isActive &&
                            "border-amber-400 bg-amber-600/30 scale-[0.98] shadow-inner",
                        )}
                        style={{ outlineColor: str.varnish }}
                      >
                        <span
                          className={cn(
                            "font-medium",
                            inMaqam ? "text-amber-200" : "text-violin-text",
                          )}
                        >
                          {noteName}
                        </span>
                        <span className="text-[10px] text-amber-600/70">
                          {step}
                        </span>

                        {/* Maqam Note Indicator */}
                        {inMaqam && (
                          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
      <p className="mt-3 text-center text-xs text-violin-muted">
        Tap or hold a cell to strike with the Risha (plectrum).
        {activeMaqam && (
          <span className="ml-1 text-amber-400 font-medium">
            Highlighted cells with golden dots belong to {activeMaqam.nameEn} (
            {activeMaqam.nameAr}).
          </span>
        )}
      </p>
    </div>
  );
}
