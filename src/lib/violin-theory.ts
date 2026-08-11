import { Note, Interval } from "tonal";

export interface ViolinString {
  id: string; // positional id, e.g. "str0" (lowest) .. "str3" (highest)
  label: string; // pitch class shown on the fingerboard, e.g. "G"
  openNote: string; // scientific pitch notation, e.g. "G3"
  varnish: string; // CSS color token for this string's accent
}

export interface TuningPreset {
  id: string;
  label: string;
  description: string;
  notes: [string, string, string, string]; // low to high, scientific pitch notation
}

// Fixed accent per string position (low to high), independent of tuning.
const STRING_COLORS = [
  "var(--color-violin-g)",
  "var(--color-violin-d)",
  "var(--color-violin-a)",
  "var(--color-violin-e)",
];

export const TUNINGS: TuningPreset[] = [
  {
    id: "standard",
    label: "Standard",
    description: "G3 · D4 · A4 · E5",
    notes: ["G3", "D4", "A4", "E5"],
  },
  {
    id: "eastern",
    label: "Eastern (G-D-G-D)",
    description: "G3 · D4 · G4 · D5",
    notes: ["G3", "D4", "G4", "D5"],
  },
];

export function buildStrings(tuning: TuningPreset): ViolinString[] {
  return tuning.notes.map((openNote, index) => ({
    id: `str${index}`,
    label: Note.get(openNote).pc ?? openNote,
    openNote,
    varnish: STRING_COLORS[index],
  }));
}

// --- Fingerboard resolution ---------------------------------------------
//
// "semitone"    - standard 12-EDO fingerboard, one cell per half step.
// "quarter-tone" - 24-EDO fingerboard (common in Arabic/Turkish/Persian maqam
//                  practice), one cell per quarter step. Quarter-tone cells
//                  that fall between two tempered semitones are labeled as
//                  the lower note raised a quarter tone, e.g. "F4+".

export type Resolution = "semitone" | "quarter-tone";
export type NoteNotation = "sharps" | "flats";

export type ViolinPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Start offsets model the chart's first through eighth position windows. */
export const VIOLIN_POSITIONS: { id: ViolinPosition; label: string; start: number }[] = [
  { id: 1, label: "1st", start: 0 },
  { id: 2, label: "2nd", start: 3 },
  { id: 3, label: "3rd", start: 5 },
  { id: 4, label: "4th", start: 7 },
  { id: 5, label: "5th", start: 8 },
  { id: 6, label: "6th", start: 10 },
  { id: 7, label: "7th", start: 12 },
  { id: 8, label: "8th", start: 14 },
];

export const SEMITONE_POSITIONS = 12; // steps shown per octave, semitone mode
export const QUARTER_TONE_POSITIONS = 24; // steps shown per octave, quarter-tone mode

export function positionsFor(resolution: Resolution): number {
  return resolution === "quarter-tone" ? QUARTER_TONE_POSITIONS : SEMITONE_POSITIONS;
}

export function noteAtPosition(openNote: string, semitones: number): string {
  const interval = Interval.fromSemitones(semitones);
  return Note.transpose(openNote, interval);
}

export function noteFrequency(noteName: string): number {
  return Note.freq(noteName) ?? 440;
}

/** Frequency at a given step, where step is in semitones (quarter-tone mode: half-steps of 0.5). */
export function frequencyAtStep(openNote: string, step: number): number {
  const base = Note.freq(openNote) ?? 440;
  return base * 2 ** (step / 12);
}

/**
 * Label at a given step. Whole steps resolve to a normal tonal note name.
 * Half-integer steps (quarter tones) are labeled as the note below, raised
 * a quarter tone, using a trailing "+" (half-sharp).
 */
export function formatNoteName(
  noteName: string,
  notation: NoteNotation = "sharps",
): string {
  const note = Note.get(noteName);
  if (note.chroma === undefined || note.oct === undefined) return noteName;

  const names =
    notation === "flats"
      ? ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
      : ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  return `${names[note.chroma]}${note.oct}`;
}

export function labelAtStep(
  openNote: string,
  step: number,
  notation: NoteNotation = "sharps",
): string {
  if (Number.isInteger(step)) {
    return formatNoteName(noteAtPosition(openNote, step), notation);
  }
  const lowerNote = noteAtPosition(openNote, Math.floor(step));
  return `${formatNoteName(lowerNote, notation)}+`;
}

/** Generates the sequence of fingerboard steps for a resolution: whole steps for
 * "semitone", half-steps (0, 0.5, 1, 1.5, ...) for "quarter-tone". */
export function stepsFor(resolution: Resolution): number[] {
  const count = positionsFor(resolution);
  const increment = resolution === "quarter-tone" ? 0.5 : 1;
  return Array.from({ length: count + 1 }, (_, i) => i * increment);
}

// --- Pitch detection helpers -------------------------------------------

export interface PitchResult {
  noteName: string;
  midi: number; // nearest semitone MIDI number (rounded down for quarter tones)
  frequency: number;
  cents: number; // deviation from the nearest resolved pitch
}

/**
 * Converts a detected frequency (Hz) into note name / MIDI / cents-off.
 * In "semitone" mode this snaps to the nearest of the 12 tempered pitch
 * classes (cents range -50..50). In "quarter-tone" mode it snaps to the
 * nearest of 24 quarter-tone steps (cents range -25..25), labeling
 * in-between pitches with a trailing "+" (half-sharp).
 */
export function analyzeFrequency(
  frequency: number,
  resolution: Resolution = "semitone"
): PitchResult {
  const midiFloat = 69 + 12 * Math.log2(frequency / 440);

  if (resolution === "semitone") {
    const midi = Math.round(midiFloat);
    const noteName = Note.fromMidi(midi);
    const cents = Math.round((midiFloat - midi) * 100);
    return { noteName, midi, frequency, cents };
  }

  // Quarter-tone (24-EDO): snap to the nearest 50-cent step.
  const quarterStepFloat = midiFloat * 2;
  const quarterStep = Math.round(quarterStepFloat);
  const cents = Math.round((quarterStepFloat - quarterStep) * 50);
  const baseMidi = Math.floor(quarterStep / 2);
  const isHalfSharp = quarterStep % 2 !== 0;
  const noteName = isHalfSharp ? `${Note.fromMidi(baseMidi)}+` : Note.fromMidi(quarterStep / 2);
  return { noteName, midi: baseMidi, frequency, cents };
}
