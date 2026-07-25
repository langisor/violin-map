import { useCallback, useState } from "react";
import {
  POSITIONS,
  noteAtPosition,
  noteFrequency,
  type ViolinString,
} from "@/lib/violin-theory";
import { violinAudioEngine, type PlayMode } from "@/lib/violin-audio";
import { cn } from "@/lib/utils";

interface ViolinFingerboardProps {
  mode: PlayMode;
  strings: ViolinString[];
}

export function ViolinFingerboard({ mode, strings }: ViolinFingerboardProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null);

  const handlePress = useCallback(
    (stringId: string, position: number, noteName: string) => {
      setActiveCell(`${stringId}-${position}`);
      violinAudioEngine.noteOn(stringId, noteFrequency(noteName), mode);
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
    <div className="w-full overflow-x-auto rounded-2xl border border-violin-border bg-gradient-to-b from-violin-panel-2 to-violin-bg p-5 shadow-inner">
      <div className="min-w-[760px]">
        {strings
          .slice()
          .reverse()
          .map((str, rowIndex) => (
            <div key={str.id} className="mb-2 flex items-center gap-3">
              <div
                className="flex w-10 shrink-0 flex-col items-center text-sm font-semibold"
                style={{ color: str.varnish }}
              >
                <span>{str.id}</span>
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
                {Array.from({ length: POSITIONS + 1 }, (_, position) => {
                  const noteName = noteAtPosition(str.openNote, position);
                  const cellKey = `${str.id}-${position}`;
                  const isActive = activeCell === cellKey;
                  const isOpen = position === 0;
                  return (
                    <button
                      key={cellKey}
                      aria-label={`${str.id} string, position ${position}, note ${noteName}`}
                      onMouseDown={() => handlePress(str.id, position, noteName)}
                      onMouseUp={() => handleRelease(str.id)}
                      onMouseLeave={() => isActive && handleRelease(str.id)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handlePress(str.id, position, noteName);
                      }}
                      onTouchEnd={() => handleRelease(str.id)}
                      className={cn(
                        "flex h-14 flex-1 flex-col items-center justify-center rounded-md border text-xs transition-colors select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                        isOpen
                          ? "border-violin-border bg-violin-cell-open"
                          : "border-violin-border bg-violin-cell",
                        isActive && "border-violin-e bg-violin-cell-active"
                      )}
                      style={{ outlineColor: str.varnish }}
                    >
                      <span className="font-medium text-violin-text">{noteName}</span>
                      <span className="text-[10px] text-violin-muted">{position}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
      <p className="mt-3 text-center text-xs text-violin-muted">
        Hold a cell to sustain in bow mode, or tap to pluck in pizzicato mode. The small number is
        the semitone position above the open string.
      </p>
    </div>
  );
}
