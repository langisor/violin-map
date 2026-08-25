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
import type { RecordedNote } from "@/lib/note-recording";

/**
 * In a position, the four fingers fall 2, 4, 5, and 7 semitones above the
 * open string. These coloured guides emulate the tapes commonly placed on a
 * beginner's violin fingerboard.
 */
const FINGER_TAPES = [
  { offset: 2, color: "#342ed6", label: "First finger" },
  { offset: 4, color: "#342ed6", label: "Second finger" },
  { offset: 5, color: "#342ed6", label: "Third finger" },
  { offset: 7, color: "#342ed6", label: "Fourth finger (pinky)" },
] as const;

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
  recordNotes?: boolean;
  recordedNotes?: RecordedNote[];
  onRecordedNotesChange?: (notes: RecordedNote[]) => void;
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
  recordNotes = false,
  recordedNotes = [],
  onRecordedNotesChange,
}: ViolinFingerboardProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [leftHanded, setLeftHanded] = useState(false);
  const positionStart = useMemo(() => ({ 1: 0, 2: 3, 3: 5, 4: 7, 5: 8, 6: 10, 7: 12, 8: 14 })[position], [position]);
  const steps = useMemo(() => stepsFor(resolution).map((step) => step + positionStart), [resolution, positionStart]);
  const displayStrings = useMemo(
    () => (leftHanded ? strings : [...strings].reverse()),
    [leftHanded, strings],
  );
  const scaleSummary = useMemo(() => {
    const source = activeScale ?? activeMaqam;
    if (!source) return null;

    const noteNames = source.intervals.slice(0, -1).map((offset) => labelAtStep(`${source.tonic}3`, offset, notation));
    const intervalValues = source.intervals.slice(1).map((offset, index) => Number((offset - source.intervals[index]).toFixed(2)));
    const title = activeScale
      ? `${source.tonic} ${activeScale.kind === "major" ? "Major" : "Natural minor"}`
      : activeMaqam
        ? activeMaqam.nameEn
        : "";

    return { title, noteNames, intervalValues };
  }, [activeMaqam, activeScale, notation]);

  const handlePress = useCallback(
    (stringId: string, step: number, frequency: number, label: string) => {
      if (recordNotes) {
        const id = `${stringId}-${step}`;
        const exists = recordedNotes.some((note) => note.id === id);
        onRecordedNotesChange?.(exists ? recordedNotes.filter((note) => note.id !== id) : [...recordedNotes, { id, label, stringId, step, frequency }]);
        return;
      }
      setActiveCell(`${stringId}-${step}`);
      void engine.noteOn(stringId, frequency, mode);
    },
    [mode, engine, onRecordedNotesChange, recordNotes, recordedNotes]
  );

  const handleRelease = useCallback(
    (stringId: string) => {
      setActiveCell(null);
      engine.noteOff(stringId, mode);
    },
    [mode, engine]
  );

  return (
   <div className="w-full overflow-hidden rounded-[30px] border border-cyan-400/70 bg-[#05070b] p-3 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.25),0_24px_60px_-28px_rgba(34,211,238,0.65)] sm:p-4">
     <div className="mb-3 flex items-start justify-between gap-3">
       {scaleSummary ? (
         <div className="min-w-0 flex-1 rounded-full border border-cyan-400/40 bg-cyan-500/5 px-3 py-2 text-left">
           <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">{scaleSummary.title}</div>
           <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-100">
             <span>{scaleSummary.noteNames.join(" ")}</span>
           </div>
           <div className="mt-1 text-[10px] text-slate-300">
             Intervals: {scaleSummary.intervalValues.map((value) => `${value}`).join(" - ")}
           </div>
         </div>
       ) : (
         <div className="flex-1" />
       )}
       <button
         type="button"
         aria-pressed={leftHanded}
         onClick={() => setLeftHanded((value) => !value)}
         className={cn(
           "shrink-0 rounded-full border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors",
           leftHanded
             ? "border-emerald-400/80 bg-emerald-400/15 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.2)]"
             : "border-cyan-400/60 bg-cyan-500/10 text-cyan-100"
         )}
       >
         Left Hand
       </button>
     </div>

     {orientation === "horizontal" && <p className="mb-2 text-center text-[10px] text-violin-muted sm:hidden">← Scroll to see the full fingerboard →</p>}
     <div
       className={cn(
         orientation === "horizontal" &&
           (resolution === "quarter-tone" ? "min-w-340" : "min-w-190"),
         orientation === "vertical" && "mx-auto flex w-fit items-start justify-center gap-2 sm:gap-3",
       )}
     >
       {displayStrings.map((str, rowIndex) => (
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
               const tape = FINGER_TAPES.find(({ offset }) => step === positionStart + offset);
               const inMaqam = activeMaqam
                 ? isNoteInMaqam(str.openNote, step, activeMaqam)
                 : false;
               const inScale = activeScale ? isNoteInWesternScale(str.openNote, step, activeScale) : false;
               const isPlaying = playingFrequency !== null && Math.abs(1200 * Math.log2(frequency / playingFrequency)) < 20;
               const isRecorded = recordedNotes.some((note) => note.id === cellKey);
               return (
                 <button
                   key={cellKey}
                   aria-label={`${str.label} string, position ${step}, note ${noteName}`}
                   onMouseDown={() => handlePress(str.id, step, frequency, noteName)}
                   onMouseUp={() => handleRelease(str.id)}
                   onMouseLeave={() => isActive && handleRelease(str.id)}
                   onTouchStart={(e) => {
                     e.preventDefault();
                     handlePress(str.id, step, frequency, noteName);
                   }}
                   onTouchEnd={() => handleRelease(str.id)}
                   className={cn(
                     "relative flex h-12 flex-1 flex-col items-center justify-center rounded-full border text-[10px] text-slate-100 transition-all select-none focus-visible:outline focus-visible:outline-offset-2",
                     orientation === "vertical" && "h-12 w-full shrink-0",
                     isOpen
                       ? "border-cyan-400/50 bg-[#111827]"
                       : "border-cyan-400/30 bg-[#0b1020]",
                     isQuarterTone && "border-dashed border-cyan-300/60 bg-slate-950/70",
                     (inMaqam || inScale) &&
                       "border-amber-400/80 bg-amber-500/10 font-semibold ring-1 ring-amber-400/50",
                     isActive && "border-cyan-200 bg-cyan-500/20 shadow-[0_0_0_2px_rgba(103,232,249,0.2)]",
                     isRecorded && "border-emerald-300 bg-emerald-500/15 text-emerald-50 ring-2 ring-emerald-300",
                     isPlaying && "z-10 border-cyan-300 bg-cyan-400/20 text-cyan-50 ring-2 ring-cyan-300 shadow-lg shadow-cyan-400/30"
                   )}
                   style={{ outlineColor: str.varnish }}
                 >
                   {tape && (
                     <span
                       aria-hidden="true"
                       className={cn(
                         "pointer-events-none absolute z-0 opacity-85",
                         orientation === "horizontal"
                           ? "inset-y-1 left-1/2 w-3/5 -translate-x-1/2 rounded-full"
                           : "inset-x-1 top-1/2 h-3/5 -translate-y-1/2 rounded-full",
                       )}
                       style={{ backgroundColor: tape.color }}
                     />
                   )}
                   <span
                     className={cn(
                       "relative z-10 font-medium",
                       inMaqam || inScale ? "text-amber-200" : "text-slate-100"
                     )}
                   >
                     {noteName}
                   </span>
                   <span className="relative z-10 text-[9px] text-cyan-100/80">{step}</span>
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
       {recordNotes ? "Tap notes to add or remove them from the recording." : "Hold a cell to sustain in bow mode, or tap to pluck in pizzicato mode."}
       {resolution === "quarter-tone"
         ? " Dashed cells are quarter tones — the note name below with a trailing \"+\" means raised a quarter tone."
         : " The small number is the semitone position above the open string."}
       {activeMaqam && (
         <span className="ml-1 text-amber-400 font-medium">
           Cells with golden dots belong to {activeMaqam.nameEn} ({activeMaqam.nameAr}).
         </span>
       )}
       {activeScale && <span className="ml-1 font-medium text-sky-300">Golden cells belong to {activeScale.tonic} {activeScale.kind}; cyan marks the note currently playing.</span>}
     </p>
   </div>
 );
}
