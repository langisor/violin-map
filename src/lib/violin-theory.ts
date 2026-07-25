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

// Chromatic steps shown on the fingerboard (0 = open string).
export const POSITIONS = 12;

export function noteAtPosition(openNote: string, semitones: number): string {
  const interval = Interval.fromSemitones(semitones);
  return Note.transpose(openNote, interval);
}

export function noteFrequency(noteName: string): number {
  return Note.freq(noteName) ?? 440;
}

// --- Pitch detection helpers -------------------------------------------

export interface PitchResult {
  noteName: string;
  midi: number;
  frequency: number;
  cents: number; // deviation from the nearest tempered note, -50..50
}

/** Converts a detected frequency (Hz) into note name / MIDI / cents-off. */
export function analyzeFrequency(frequency: number): PitchResult {
  const midiFloat = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(midiFloat);
  const noteName = Note.fromMidi(midi);
  const cents = Math.round((midiFloat - midi) * 100);
  return { noteName, midi, frequency, cents };
}
