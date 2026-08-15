// Core data model for the reusable metronome system.
//
// A pattern is described purely as a flat list of "steps". Each step occupies
// one cell of a rhythmic grid and plays a single "voice" (or a rest). The
// engine only needs `steps` + `stepsPerBeat` to play anything, which keeps it
// fully reusable across Western time signatures, Arabic iqa'at, and custom
// user-authored grooves.

export type Voice =
  | "rest" // silence
  | "accent" // strong downbeat (Western)
  | "beat" // normal beat (Western)
  | "sub" // subdivision / ghost note (Western)
  | "dum" // low resonant hit (Arabic)
  | "tak" // high sharp hit (Arabic)

export type PatternGroup = "western" | "arabic" | "custom"

export interface MetronomePattern {
  id: string
  name: string
  /** Optional native-script name, e.g. Arabic label. */
  altName?: string
  group: PatternGroup
  description?: string
  /** How many grid steps make up one quarter-note pulse (the BPM unit). */
  stepsPerBeat: number
  /** Visual grouping of steps into cells; each number is a cell width. Sums to steps.length. */
  grouping?: number[]
  /** Human readable meter label, e.g. "4/4" or "9/8". */
  meter?: string
  steps: Voice[]
}

// Shorthand builders keep the pattern tables readable.
const D: Voice = "dum"
const T: Voice = "tak"
const _: Voice = "rest"

// ---------------------------------------------------------------------------
// Arabic iqa'at (rhythmic cycles). Notated in eighth notes (stepsPerBeat = 2),
// using Dum (low) and Tak (high) with rests.
// ---------------------------------------------------------------------------

export const ARABIC_PATTERNS: MetronomePattern[] = [
  {
    id: "maqsum",
    name: "Maqsum",
    altName: "مقسوم",
    group: "arabic",
    meter: "4/4",
    description: "The most common Egyptian rhythm — foundation of countless songs.",
    stepsPerBeat: 2,
    grouping: [4, 4],
    steps: [D, T, _, T, D, _, T, _],
  },
  {
    id: "baladi",
    name: "Baladi",
    altName: "بلدي",
    group: "arabic",
    meter: "4/4",
    description: "Earthy folk rhythm; two dums up front give it a heavy feel.",
    stepsPerBeat: 2,
    grouping: [4, 4],
    steps: [D, D, _, T, D, _, T, _],
  },
  {
    id: "saidi",
    name: "Saidi",
    altName: "صعيدي",
    group: "arabic",
    meter: "4/4",
    description: "Upper-Egyptian cane-dance rhythm with a dum in the middle.",
    stepsPerBeat: 2,
    grouping: [4, 4],
    steps: [D, _, T, _, D, D, T, _],
  },
  {
    id: "malfuf",
    name: "Malfuf",
    altName: "ملفوف",
    group: "arabic",
    meter: "2/4",
    description: "Fast, driving entrance rhythm.",
    stepsPerBeat: 2,
    grouping: [4],
    steps: [D, _, T, T],
  },
  {
    id: "ayyub",
    name: "Ayyub",
    altName: "أيوب",
    group: "arabic",
    meter: "2/4",
    description: "Hypnotic zaar / trance rhythm.",
    stepsPerBeat: 2,
    grouping: [4],
    steps: [D, _, T, D],
  },
  {
    id: "wahda",
    name: "Wahda",
    altName: "وحدة",
    group: "arabic",
    meter: "4/4",
    description: "Slow, spacious rhythm — one dum, one tak per bar.",
    stepsPerBeat: 2,
    grouping: [4, 4],
    steps: [D, _, _, _, T, _, _, _],
  },
  {
    id: "masmoudi",
    name: "Masmoudi Kebir",
    altName: "مصمودي كبير",
    group: "arabic",
    meter: "8/4",
    description: "Grand, heavy rhythm; the slow parent of Baladi.",
    stepsPerBeat: 2,
    grouping: [4, 4, 4, 4],
    steps: [D, D, _, _, T, _, _, _, D, _, _, _, T, _, T, _],
  },
  {
    id: "chiftetelli",
    name: "Chiftetelli",
    altName: "شفتتلي",
    group: "arabic",
    meter: "8/4",
    description: "Slow, expressive rhythm used for taqsim improvisation.",
    stepsPerBeat: 2,
    grouping: [4, 4, 4, 4],
    steps: [D, _, _, T, _, T, D, _, _, _, D, _, T, _, _, _],
  },
  {
    id: "karsilama",
    name: "Karsilama",
    altName: "كارشلمة",
    group: "arabic",
    meter: "9/8",
    description: "Turkish 9/8 grouped 2+2+2+3.",
    stepsPerBeat: 2,
    grouping: [2, 2, 2, 3],
    steps: [D, _, T, _, D, _, T, T, _],
  },
  {
    id: "samai",
    name: "Samai Thaqil",
    altName: "سماعي ثقيل",
    group: "arabic",
    meter: "10/8",
    description: "Classical Ottoman 10/8 grouped 3+2+2+3.",
    stepsPerBeat: 2,
    grouping: [3, 2, 2, 3],
    steps: [D, _, _, T, _, D, _, T, _, _],
  },
]

// ---------------------------------------------------------------------------
// Western presets + builder. Western meters are generated from a beat count,
// a subdivision, and an accent map, so the UI can build them on the fly.
// ---------------------------------------------------------------------------

export type Subdivision = 1 | 2 | 3 | 4

export const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  1: "Quarter",
  2: "Eighth",
  3: "Triplet",
  4: "Sixteenth",
}

export interface WesternPreset {
  id: string
  name: string
  meter: string
  beats: number
  /** Indices (0-based) of beats that should be accented. Beat 0 is always strong. */
  accents?: number[]
}

export const WESTERN_PRESETS: WesternPreset[] = [
  { id: "2-4", name: "Simple duple", meter: "2/4", beats: 2 },
  { id: "3-4", name: "Waltz", meter: "3/4", beats: 3 },
  { id: "4-4", name: "Common time", meter: "4/4", beats: 4 },
  { id: "5-4", name: "Quintuple", meter: "5/4", beats: 5, accents: [3] },
  { id: "6-8", name: "Compound duple", meter: "6/8", beats: 6, accents: [3] },
  { id: "7-8", name: "Septuple", meter: "7/8", beats: 7, accents: [4] },
  { id: "9-8", name: "Compound triple", meter: "9/8", beats: 9, accents: [3, 6] },
  { id: "12-8", name: "Compound quad", meter: "12/8", beats: 12, accents: [3, 6, 9] },
]

/**
 * Build a step-based pattern for a Western meter.
 */
export function buildWesternPattern(
  preset: WesternPreset,
  subdivision: Subdivision,
  accentFirst: boolean,
): MetronomePattern {
  const steps: Voice[] = []
  for (let beat = 0; beat < preset.beats; beat++) {
    const isDownbeat = beat === 0
    const isAccented = preset.accents?.includes(beat)
    for (let s = 0; s < subdivision; s++) {
      if (s === 0) {
        if (isDownbeat && accentFirst) steps.push("accent")
        else if (isAccented) steps.push("accent")
        else steps.push("beat")
      } else {
        steps.push("sub")
      }
    }
  }
  return {
    id: `${preset.id}-${subdivision}`,
    name: preset.name,
    group: "western",
    meter: preset.meter,
    stepsPerBeat: subdivision,
    grouping: Array.from({ length: preset.beats }, () => subdivision),
    steps,
  }
}

// Cycle order used by the custom editor when clicking a cell.
export const VOICE_CYCLE_WESTERN: Voice[] = ["rest", "beat", "accent", "sub"]
export const VOICE_CYCLE_PERCUSSION: Voice[] = ["rest", "tak", "dum"]

export const VOICE_LABELS: Record<Voice, string> = {
  rest: "Rest",
  accent: "Accent",
  beat: "Beat",
  sub: "Sub",
  dum: "Dum",
  tak: "Tak",
}

export function isPercussionVoice(v: Voice) {
  return v === "dum" || v === "tak"
}
