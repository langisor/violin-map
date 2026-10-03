import {
  useCallback,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
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
import {
  isNoteInWesternScale,
  getScaleDegree,
  scaleNotesForInstrument,
  type WesternScalePreset,
} from "@/lib/western-scale-theory";
import type { RecordedNote } from "@/lib/note-recording";

/**
 * In a position, the four fingers fall 2, 4, 5, and 7 semitones above the
 * open string. These coloured guides emulate the tapes commonly placed on a
 * beginner's violin fingerboard.
 */
const FINGER_TAPES = [
  { offset: 2, color: "#342ed6", label: "1" },
  { offset: 4, color: "#342ed6", label: "2" },
  { offset: 5, color: "#342ed6", label: "3" },
  { offset: 7, color: "#342ed6", label: "4" },
] as const;

export type MicrotonalAccidental =
  | "𝄫" // double flat (-4 quarter tones / -200 cents)
  | "♭" // flat (-2 quarter tones / -100 cents)
  | "𝄳" // half-flat / quarter-tone flat (-1 quarter tone / -50 cents)
  | "♮" // natural (0)
  | "𝄵" // half-sharp / quarter-tone sharp (+1 quarter tone / +50 cents)
  | "♯" // sharp (+2 quarter tones / +100 cents)
  | "𝄪"; // double sharp (+4 quarter tones / +200 cents)

/** Accidental glyphs keyed by their offset in quarter tones (1 quarter tone = 50 cents). */
export const MICROTONAL_ACCIDENTALS: Record<number, MicrotonalAccidental> = {
  [-4]: "𝄫",
  [-2]: "♭",
  [-1]: "𝄳",
  0: "♮",
  1: "𝄵",
  2: "♯",
  4: "𝄪",
};

/** Font stack that carries the musical-symbol glyphs. */
const GLYPH_FONT =
  '"Noto Music", "Bravura Text", "Segoe UI Symbol", "Apple Symbols", sans-serif';

const ASCII_ACCIDENTAL_OFFSET: Record<string, number> = {
  bb: -4,
  b: -2,
  "": 0,
  "#": 2,
  "##": 4,
  x: 4,
  "♭": -2,
  "♯": 2,
};
const NEXT_LETTER: Record<string, string> = {
  C: "D",
  D: "E",
  E: "F",
  F: "G",
  G: "A",
  A: "B",
  B: "C",
};

/**
 * Renames a note with the microtonal accidentals above.
 * `baseLabel` is the label of the whole semitone at or below the note (e.g. "C#4", "Bb");
 * `quarterRaised` adds a quarter tone on top of it. Natural notes stay unmarked.
 */
export function formatMicrotonalLabel(
  baseLabel: string,
  quarterRaised: boolean,
): string {
  const match = /^([A-G])(bb|##|b|#|x|♭|♯)?(-?\d*)$/.exec(baseLabel);
  if (!match) {
    // Unrecognised notation (e.g. solfège): swap the sharp sign and mark the quarter tone.
    return `${baseLabel.replace(/#/g, "♯")}${quarterRaised ? MICROTONAL_ACCIDENTALS[1] : ""}`;
  }
  const [, letter, accidental = "", octave] = match;
  const offset = ASCII_ACCIDENTAL_OFFSET[accidental] ?? 0;
  const glyph = (quarterTones: number) =>
    quarterTones === 0 ? "" : MICROTONAL_ACCIDENTALS[quarterTones];

  if (!quarterRaised) return `${letter}${glyph(offset)}${octave}`;

  const total = offset + 1;
  if (total === -1 || total === 1) return `${letter}${glyph(total)}${octave}`; // Bb+¼ → B𝄳, C+¼ → C𝄵
  if (total === 3)
    return `${NEXT_LETTER[letter]}${MICROTONAL_ACCIDENTALS[-1]}${octave}`; // C#+¼ → D𝄳
  return `${letter}${glyph(offset)}${octave}${MICROTONAL_ACCIDENTALS[1]}`; // rare double-accidental cases
}

/* ------------------------------------------------------------------ */
/* Real-world violin dimensions (millimetres)                          */
/* ------------------------------------------------------------------ */

/** Nut to bridge: the vibrating string length of a full-size violin. */
const SCALE_LENGTH_MM = 328;
/** Physical length of the ebony fingerboard from the nut. */
const BOARD_LENGTH_MM = 270;
const NUT_HALF_WIDTH_MM = 12;
const END_HALF_WIDTH_MM = 21;
/** Strings occupy this share of the board width at any point. */
const STRING_SPAN = 0.76;

/* Pixel layout (SVG user units) */
const CROSS_PX_PER_MM = 4.6;
const PX_PER_STEP = 46;
const MIN_ALONG_PX = 720;
const MARGIN = { start: 52, end: 20, cross: 28 };
const MAX_MARKER_RADIUS = 17;

type Pt = [number, number]; // [distance along the string, distance across the board]

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Equal-tempered finger position: distance from the nut for a given semitone step. */
const distanceMm = (step: number) => SCALE_LENGTH_MM * (1 - 2 ** (-step / 12));
const halfWidthMm = (mm: number) =>
  lerp(
    NUT_HALF_WIDTH_MM,
    END_HALF_WIDTH_MM,
    clamp(mm / BOARD_LENGTH_MM, 0, 1.2),
  );

interface CellState {
  isOpen: boolean;
  isQuarterTone: boolean;
  highlighted: boolean;
  isActive: boolean;
  isRecorded: boolean;
  isPlaying: boolean;
}

function cellPalette({
  isOpen,
  isQuarterTone,
  highlighted,
  isActive,
  isRecorded,
  isPlaying,
}: CellState) {
  let fill = isOpen ? "rgba(17,24,39,0.86)" : "rgba(11,16,32,0.72)";
  let stroke = isOpen ? "rgba(34,211,238,0.5)" : "rgba(34,211,238,0.3)";
  let strokeWidth = 1;
  let dash: string | undefined;
  let text = "#f1f5f9";

  if (isQuarterTone) {
    fill = "rgba(2,6,23,0.72)";
    stroke = "rgba(103,232,249,0.6)";
    dash = "3 3";
  }
  if (highlighted) {
    fill = "rgba(245,158,11,0.16)";
    stroke = "rgba(251,191,36,0.88)";
    dash = undefined;
    strokeWidth = 1.5;
    text = "#fde68a";
  }
  if (isActive) {
    fill = "rgba(34,211,238,0.3)";
    stroke = "#a5f3fc";
    dash = undefined;
    strokeWidth = 2;
  }
  if (isRecorded) {
    fill = "rgba(16,185,129,0.22)";
    stroke = "#6ee7b7";
    dash = undefined;
    strokeWidth = 2.5;
    text = "#ecfdf5";
  }
  if (isPlaying) {
    fill = "rgba(34,211,238,0.3)";
    stroke = "#67e8f9";
    dash = undefined;
    strokeWidth = 2.5;
    text = "#ecfeff";
  }
  return { fill, stroke, strokeWidth, dash, text };
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
  recordNotes?: boolean;
  recordedNotes?: RecordedNote[];
  onRecordedNotesChange?: (notes: RecordedNote[]) => void;
  showScaleDegrees?: boolean;
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
  showScaleDegrees = false,
}: ViolinFingerboardProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [leftHanded, setLeftHanded] = useState(false);
  const [accidentalNaming, setAccidentalNaming] = useState(false);
  const uid = useId().replace(/:/g, "");
  const ids = {
    board: `${uid}-board`,
    fadeStart: `${uid}-fade-start`,
    fadeEnd: `${uid}-fade-end`,
    glow: `${uid}-glow`,
  };
  const isVertical = orientation === "vertical";

  const positionStart = useMemo(
    () => ({ 1: 0, 2: 3, 3: 5, 4: 7, 5: 8, 6: 10, 7: 12, 8: 14 })[position],
    [position],
  );
  const steps = useMemo(
    () => stepsFor(resolution).map((step) => step + positionStart),
    [resolution, positionStart],
  );
  const displayStrings = useMemo(
    () => (leftHanded ? [...strings].reverse() : strings),
    [leftHanded, strings],
  );
  const stringCount = displayStrings.length;

  /** Note name at a step: the default naming, or the global microtonal accidentals when enabled. */
  const nameAt = useCallback(
    (openNote: Parameters<typeof labelAtStep>[0], step: number) => {
      if (!accidentalNaming) return labelAtStep(openNote, step, notation);
      const whole = Math.floor(step);
      return formatMicrotonalLabel(
        labelAtStep(openNote, whole, notation),
        step - whole >= 0.25,
      );
    },
    [accidentalNaming, notation],
  );

  const scaleSummary = useMemo(() => {
    const source = activeScale ?? activeMaqam;
    if (!source) return null;

    const noteNames = activeScale
      ? scaleNotesForInstrument(
          activeScale,
          strings.map((string) => string.openNote),
        ).map((note) => nameAt(note, 0))
      : source.intervals
          .slice(0, -1)
          .map((offset) => nameAt(`${source.tonic}4`, offset));
    const intervalValues = source.intervals
      .slice(1)
      .map((offset, index) =>
        Number((offset - source.intervals[index]).toFixed(2)),
      );
    const title = activeScale
      ? `${source.tonic} ${activeScale.displayName}`
      : activeMaqam
        ? activeMaqam.nameEn
        : "";

    return { title, noteNames, intervalValues };
  }, [activeMaqam, activeScale, nameAt, strings]);

  /* -------------------------------------------------------------- */
  /* Geometry                                                       */
  /* -------------------------------------------------------------- */

  const geo = useMemo(() => {
    const sorted = [...steps].sort((a, b) => a - b);
    const showNut = sorted.length > 0 && sorted[0] <= 0;

    // Open strings sit just behind the nut, every other note at its true finger position.
    const nextMm = sorted.length > 1 ? distanceMm(sorted[1]) : 10;
    const openOffsetMm = Math.min(12, nextMm * 0.6);
    const centers = sorted.map((step) =>
      step === 0 && showNut ? -openOffsetMm : distanceMm(step),
    );

    const bounds = centers.map((center, index) => {
      if (index === 0) {
        const gap = centers[1] !== undefined ? centers[1] - center : 10;
        return center - gap / 2;
      }
      return (centers[index - 1] + center) / 2;
    });
    const lastGap =
      centers.length > 1
        ? centers[centers.length - 1] - centers[centers.length - 2]
        : 10;
    bounds.push((centers[centers.length - 1] ?? 0) + lastGap / 2);

    const startMm = bounds[0] ?? 0;
    const endMm = bounds[bounds.length - 1] ?? BOARD_LENGTH_MM;
    const innerLen = Math.max(MIN_ALONG_PX, sorted.length * PX_PER_STEP);
    const k = innerLen / Math.max(1, endMm - startMm);
    const maxHalfPx = halfWidthMm(endMm) * CROSS_PX_PER_MM;

    return {
      showNut,
      startMm,
      endMm,
      k,
      cells: sorted.map((step, index) => ({
        step,
        mm: centers[index],
        lo: bounds[index],
        hi: bounds[index + 1],
      })),
      alongLen: MARGIN.start + innerLen + MARGIN.end,
      crossLen: 2 * (maxHalfPx + MARGIN.cross),
      cy: maxHalfPx + MARGIN.cross,
      maxHalfPx,
    };
  }, [steps]);

  const width = isVertical ? geo.crossLen : geo.alongLen;
  const height = isVertical ? geo.alongLen : geo.crossLen;

  const along = (mm: number) => MARGIN.start + (mm - geo.startMm) * geo.k;
  const xy = ([a, c]: Pt) => (isVertical ? { x: c, y: a } : { x: a, y: c });
  const pt = (p: Pt) => {
    const { x, y } = xy(p);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  const poly = (pts: Pt[]) => `M${pts.map(pt).join(" L")} Z`;
  const line = (a: Pt, b: Pt) => `M${pt(a)} L${pt(b)}`;
  const gradient = (a1: number, c1: number, a2: number, c2: number) => {
    const p1 = xy([a1, c1]);
    const p2 = xy([a2, c2]);
    return {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      gradientUnits: "userSpaceOnUse" as const,
    };
  };

  const rowSpacingMm = (mm: number) =>
    stringCount > 1
      ? (2 * halfWidthMm(mm) * STRING_SPAN) / (stringCount - 1)
      : 0;
  const rowHalfMm = (mm: number) =>
    stringCount > 1 ? rowSpacingMm(mm) / 2 : halfWidthMm(mm) * 0.9;
  const stringCross = (row: number, mm: number) =>
    geo.cy + (row - (stringCount - 1) / 2) * rowSpacingMm(mm) * CROSS_PX_PER_MM;
  const boardHalf = (mm: number) => halfWidthMm(mm) * CROSS_PX_PER_MM;

  const boardStartMm = Math.max(0, geo.startMm);
  const grain = [-0.86, -0.58, -0.31, -0.08, 0.17, 0.42, 0.66, 0.88];

  /* -------------------------------------------------------------- */
  /* Interaction                                                    */
  /* -------------------------------------------------------------- */

  const handlePress = useCallback(
    (stringId: string, step: number, frequency: number, label: string) => {
      if (recordNotes) {
        const id = `${stringId}-${step}`;
        const exists = recordedNotes.some((note) => note.id === id);
        onRecordedNotesChange?.(
          exists
            ? recordedNotes.filter((note) => note.id !== id)
            : [...recordedNotes, { id, label, stringId, step, frequency }],
        );
        return;
      }
      setActiveCell(`${stringId}-${step}`);
      void engine.noteOn(stringId, frequency, mode);
    },
    [mode, engine, onRecordedNotesChange, recordNotes, recordedNotes],
  );

  const handleRelease = useCallback(
    (stringId: string) => {
      setActiveCell(null);
      engine.noteOff(stringId, mode);
    },
    [mode, engine],
  );

  return (
    <div className="w-full overflow-hidden rounded-[30px] border border-cyan-400/70 bg-[#05070b] p-3 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.25),0_24px_60px_-28px_rgba(34,211,238,0.65)] sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        {scaleSummary ? (
          <div
            className="min-w-0 flex-1 rounded-full border border-cyan-400/40 bg-cyan-500/5 px-3 py-2 text-left"
            style={accidentalNaming ? { fontFamily: GLYPH_FONT } : undefined}
          >
            <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
              {scaleSummary.title}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[14px] text-slate-100">
              <span>{scaleSummary.noteNames.join(" ")}</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              Intervals:{" "}
              {scaleSummary.intervalValues
                .map((value) => `${value}`)
                .join(" - ")}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <button
            type="button"
            aria-pressed={accidentalNaming}
            onClick={() => setAccidentalNaming((value) => !value)}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors",
              accidentalNaming
                ? "border-amber-400/80 bg-amber-400/15 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]"
                : "border-cyan-400/60 bg-cyan-500/10 text-cyan-100",
            )}
          >
            Global Accid. Naming
          </button>
          <button
            type="button"
            aria-pressed={leftHanded}
            onClick={() => setLeftHanded((value) => !value)}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors",
              leftHanded
                ? "border-emerald-400/80 bg-emerald-400/15 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.2)]"
                : "border-cyan-400/60 bg-cyan-500/10 text-cyan-100",
            )}
          >
            Left Hand
          </button>
        </div>
      </div>

      {!isVertical && (
        <p className="mb-2 text-center text-[10px] text-violin-muted sm:hidden">
          ← Scroll to see the full fingerboard →
        </p>
      )}

      <div className={cn(!isVertical && "overflow-x-auto")}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label="Violin fingerboard"
          className="mx-auto block h-auto w-full select-none"
          style={{
            ...(isVertical ? { maxWidth: width } : { minWidth: width }),
            ...(accidentalNaming ? { fontFamily: GLYPH_FONT } : null),
          }}
        >
          <defs>
            {/* Ebony: darker at the rounded edges, a soft sheen down the middle */}
            <linearGradient
              id={ids.board}
              {...gradient(
                0,
                geo.cy - geo.maxHalfPx,
                0,
                geo.cy + geo.maxHalfPx,
              )}
            >
              <stop offset="0" stopColor="#080605" />
              <stop offset="0.32" stopColor="#17120f" />
              <stop offset="0.5" stopColor="#211a15" />
              <stop offset="0.68" stopColor="#17120f" />
              <stop offset="1" stopColor="#080605" />
            </linearGradient>
            <linearGradient
              id={ids.fadeStart}
              {...gradient(along(geo.startMm), 0, along(geo.startMm) + 44, 0)}
            >
              <stop offset="0" stopColor="#05070b" stopOpacity="1" />
              <stop offset="1" stopColor="#05070b" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id={ids.fadeEnd}
              {...gradient(
                along(geo.endMm) + MARGIN.end,
                0,
                along(geo.endMm) + MARGIN.end - 56,
                0,
              )}
            >
              <stop offset="0" stopColor="#05070b" stopOpacity="1" />
              <stop offset="1" stopColor="#05070b" stopOpacity="0" />
            </linearGradient>
            <filter id={ids.glow} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Peg-box side of the nut (only visible in first position) */}
          {geo.showNut && (
            <path
              d={poly([
                [along(geo.startMm), geo.cy - boardHalf(0) * 0.92],
                [along(0), geo.cy - boardHalf(0)],
                [along(0), geo.cy + boardHalf(0)],
                [along(geo.startMm), geo.cy + boardHalf(0) * 0.92],
              ])}
              fill="#0e0a08"
            />
          )}

          {/* Fingerboard */}
          <path
            d={poly([
              [along(boardStartMm), geo.cy - boardHalf(boardStartMm)],
              [along(geo.endMm), geo.cy - boardHalf(geo.endMm)],
              [along(geo.endMm), geo.cy + boardHalf(geo.endMm)],
              [along(boardStartMm), geo.cy + boardHalf(boardStartMm)],
            ])}
            fill={`url(#${ids.board})`}
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {grain.map((f) => (
            <path
              key={f}
              d={line(
                [along(boardStartMm), geo.cy + f * boardHalf(boardStartMm)],
                [along(geo.endMm), geo.cy + f * boardHalf(geo.endMm)],
              )}
              stroke="#4a3b2e"
              strokeOpacity="0.28"
              strokeWidth="0.6"
              fill="none"
            />
          ))}

          {/* Finger tapes run the full width of the board, like the real stickers */}
          {FINGER_TAPES.map((tape) => {
            const mm = distanceMm(positionStart + tape.offset);
            if (mm < geo.startMm || mm > geo.endMm) return null;
            const a = along(mm);
            const half = boardHalf(mm) - 1.5;
            return (
              <g
                key={tape.label}
                aria-hidden="true"
                className="pointer-events-none"
              >
                <path
                  d={poly([
                    [a - 3, geo.cy - half],
                    [a + 3, geo.cy - half],
                    [a + 3, geo.cy + half],
                    [a - 3, geo.cy + half],
                  ])}
                  fill={tape.color}
                  opacity="0.88"
                />
                <text
                  x={xy([a, geo.cy - boardHalf(mm) - 9]).x}
                  y={xy([a, geo.cy - boardHalf(mm) - 9]).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="600"
                  fill="#a5b4fc"
                >
                  {tape.label}
                </text>
              </g>
            );
          })}

          {/* Nut */}
          {geo.showNut && (
            <path
              d={poly([
                [along(0) - 3.5, geo.cy - boardHalf(0) - 1],
                [along(0) + 3.5, geo.cy - boardHalf(0) - 1],
                [along(0) + 3.5, geo.cy + boardHalf(0) + 1],
                [along(0) - 3.5, geo.cy + boardHalf(0) + 1],
              ])}
              fill="#e6dccb"
              stroke="#8c7f69"
              strokeWidth="0.8"
            />
          )}

          {/* Strings */}
          {displayStrings.map((str, row) => {
            const baseIndex = Math.max(0, strings.indexOf(str));
            const weight = 1.1 + baseIndex * 0.55;
            const a0 = along(geo.startMm);
            const a1 = along(geo.endMm);
            return (
              <g
                key={`string-${str.id}`}
                aria-hidden="true"
                className="pointer-events-none"
              >
                <path
                  d={line(
                    [a0, stringCross(row, geo.startMm)],
                    [a1, stringCross(row, geo.endMm)],
                  )}
                  stroke="#000"
                  strokeOpacity="0.55"
                  strokeWidth={weight + 1.6}
                  fill="none"
                />
                <path
                  d={line(
                    [a0, stringCross(row, geo.startMm)],
                    [a1, stringCross(row, geo.endMm)],
                  )}
                  stroke={str.varnish}
                  strokeOpacity="0.9"
                  strokeWidth={weight}
                  fill="none"
                />
                <path
                  d={line(
                    [a0, stringCross(row, geo.startMm) - 0.4],
                    [a1, stringCross(row, geo.endMm) - 0.4],
                  )}
                  stroke="#fff"
                  strokeOpacity="0.38"
                  strokeWidth={Math.max(0.4, weight * 0.28)}
                  fill="none"
                />
              </g>
            );
          })}

          {/* Fade where the visible window cuts the board off */}
          {!geo.showNut && (
            <path
              d={poly([
                [along(geo.startMm), geo.cy - geo.maxHalfPx - 4],
                [along(geo.startMm) + 44, geo.cy - geo.maxHalfPx - 4],
                [along(geo.startMm) + 44, geo.cy + geo.maxHalfPx + 4],
                [along(geo.startMm), geo.cy + geo.maxHalfPx + 4],
              ])}
              fill={`url(#${ids.fadeStart})`}
              className="pointer-events-none"
            />
          )}
          <path
            d={poly([
              [along(geo.endMm) + MARGIN.end - 56, geo.cy - geo.maxHalfPx - 4],
              [along(geo.endMm) + MARGIN.end, geo.cy - geo.maxHalfPx - 4],
              [along(geo.endMm) + MARGIN.end, geo.cy + geo.maxHalfPx + 4],
              [along(geo.endMm) + MARGIN.end - 56, geo.cy + geo.maxHalfPx + 4],
            ])}
            fill={`url(#${ids.fadeEnd})`}
            className="pointer-events-none"
          />

          {/* String names */}
          {displayStrings.map((str, row) => {
            const p = xy([MARGIN.start * 0.38, stringCross(row, geo.startMm)]);
            return (
              <text
                key={`label-${str.id}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="15"
                fontWeight="700"
                fill={str.varnish}
                className="pointer-events-none"
              >
                {str.label}
              </text>
            );
          })}

          {/* Playable notes */}
          {displayStrings.map((str, row) =>
            geo.cells.map(({ step, mm, lo, hi }) => {
              const noteName = nameAt(str.openNote, step);
              const frequency = frequencyAtStep(str.openNote, step);
              const cellKey = `${str.id}-${step}`;
              const isActive = activeCell === cellKey;
              const isOpen = step === 0;
              const isQuarterTone = !Number.isInteger(step);
              const inMaqam = activeMaqam
                ? isNoteInMaqam(str.openNote, step, activeMaqam)
                : false;
              const inScale = activeScale
                ? isNoteInWesternScale(str.openNote, step, activeScale)
                : false;
              const highlighted = inMaqam || inScale;
              const scaleDegree =
                showScaleDegrees && activeScale
                  ? getScaleDegree(str.openNote, step, activeScale)
                  : null;
              const isPlaying =
                playingFrequency !== null &&
                Math.abs(1200 * Math.log2(frequency / playingFrequency)) < 20;
              const isRecorded = recordedNotes.some(
                (note) => note.id === cellKey,
              );

              const center = xy([along(mm), stringCross(row, mm)]);
              const halfAlong = ((hi - lo) * geo.k) / 2;
              const halfAcross = rowHalfMm(mm) * CROSS_PX_PER_MM;
              const r = clamp(
                Math.min(halfAlong * 0.9, halfAcross * 0.8, MAX_MARKER_RADIUS),
                4,
                MAX_MARKER_RADIUS,
              );
              const showName = r >= 8;
              const showStep = r >= 13;
              const palette = cellPalette({
                isOpen,
                isQuarterTone,
                highlighted,
                isActive,
                isRecorded,
                isPlaying,
              });

              const hit = poly([
                [
                  along(lo),
                  stringCross(row, lo) - rowHalfMm(lo) * CROSS_PX_PER_MM,
                ],
                [
                  along(hi),
                  stringCross(row, hi) - rowHalfMm(hi) * CROSS_PX_PER_MM,
                ],
                [
                  along(hi),
                  stringCross(row, hi) + rowHalfMm(hi) * CROSS_PX_PER_MM,
                ],
                [
                  along(lo),
                  stringCross(row, lo) + rowHalfMm(lo) * CROSS_PX_PER_MM,
                ],
              ]);

              const press = () =>
                handlePress(str.id, step, frequency, noteName);
              const release = () => handleRelease(str.id);

              return (
                <g
                  key={cellKey}
                  role="button"
                  tabIndex={0}
                  aria-label={`${str.label} string, position ${step}, note ${noteName}`}
                  aria-pressed={recordNotes ? isRecorded : undefined}
                  className="group cursor-pointer outline-none"
                  style={{ touchAction: isVertical ? "pan-y" : "pan-x" }}
                  onPointerDown={press}
                  onPointerUp={release}
                  onPointerCancel={release}
                  onPointerLeave={() => isActive && release()}
                  onKeyDown={(e: KeyboardEvent<SVGGElement>) => {
                    if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                      e.preventDefault();
                      press();
                    }
                  }}
                  onKeyUp={(e: KeyboardEvent<SVGGElement>) => {
                    if (e.key === "Enter" || e.key === " ") release();
                  }}
                  onBlur={() => isActive && release()}
                >
                  <path d={hit} fill="transparent" />

                  {isPlaying && (
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r={r + 4}
                      fill="none"
                      stroke="#22d3ee"
                      strokeOpacity="0.45"
                      strokeWidth="2"
                      className="pointer-events-none"
                    />
                  )}
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={r}
                    fill={palette.fill}
                    stroke={palette.stroke}
                    strokeWidth={palette.strokeWidth}
                    strokeDasharray={palette.dash}
                    filter={
                      isPlaying || isActive ? `url(#${ids.glow})` : undefined
                    }
                    className="pointer-events-none transition-colors"
                  />
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={r + 3.5}
                    fill="none"
                    stroke="#fff"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                    className="pointer-events-none opacity-0 group-focus-visible:opacity-100"
                  />

                  {showName && (
                    <text
                      x={center.x}
                      y={center.y + (showStep ? -3 : 0)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={r >= 13 ? 11 : 9}
                      fontWeight={highlighted ? 700 : 500}
                      fill={palette.text}
                      className="pointer-events-none"
                    >
                      {noteName}
                    </text>
                  )}
                  {showStep && (
                    <text
                      x={center.x}
                      y={center.y + 8}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8"
                      fill="rgba(207,250,254,0.75)"
                      className="pointer-events-none"
                    >
                      {step}
                    </text>
                  )}

                  {highlighted && (
                    <circle
                      cx={center.x + r * 0.72}
                      cy={center.y - r * 0.72}
                      r="2.4"
                      fill="#fbbf24"
                      className="pointer-events-none"
                    />
                  )}
                  {scaleDegree && (
                    <g className="pointer-events-none">
                      <rect
                        x={center.x + r * 0.15}
                        y={center.y + r * 0.35}
                        width={String(scaleDegree).length * 5.5 + 5}
                        height="11"
                        rx="3"
                        fill="rgba(12,74,110,0.85)"
                      />
                      <text
                        x={
                          center.x +
                          r * 0.15 +
                          (String(scaleDegree).length * 5.5 + 5) / 2
                        }
                        y={center.y + r * 0.35 + 5.8}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="8"
                        fontWeight="700"
                        fill="#7dd3fc"
                      >
                        {scaleDegree}
                      </text>
                    </g>
                  )}
                </g>
              );
            }),
          )}
        </svg>
      </div>

      <p className="mt-3 text-center text-xs text-violin-muted">
        {recordNotes
          ? "Tap notes to add or remove them from the recording."
          : "Hold a note to sustain in bow mode, or tap to pluck in pizzicato mode."}
        {resolution === "quarter-tone"
          ? accidentalNaming
            ? " Dashed circles are quarter tones — 𝄳 marks a half-flat and 𝄵 a half-sharp."
            : ' Dashed circles are quarter tones — a trailing "+" means raised a quarter tone.'
          : " The small number is the semitone position above the open string."}
        {activeMaqam && (
          <span className="ml-1 text-amber-400 font-medium">
            Notes with golden dots belong to {activeMaqam.nameEn} (
            {activeMaqam.nameAr}).
          </span>
        )}
        {activeScale && (
          <span className="ml-1 font-medium text-sky-300">
            Golden notes belong to {activeScale.tonic} {activeScale.kind}; cyan
            marks the note currently playing.
          </span>
        )}
      </p>
    </div>
  );
}
