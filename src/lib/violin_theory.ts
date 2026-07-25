import { Note, Interval } from "tonal";

export interface ViolinString {
  id: "G" | "D" | "A" | "E";
  openNote: string; // scientific pitch notation, e.g. "G3"
  varnish: string; // Tailwind color token name for this string's accent
}

// Standard violin tuning, low to high.
export const VIOLIN_STRINGS: ViolinString[] = [
  { id: "G", openNote: "G3", varnish: "var(--color-violin-g)" },
  { id: "D", openNote: "D4", varnish: "var(--color-violin-d)" },
  { id: "A", openNote: "A4", varnish: "var(--color-violin-a)" },
  { id: "E", openNote: "E5", varnish: "var(--color-violin-e)" },
];

// Chromatic steps shown on the fingerboard (0 = open string).
export const POSITIONS = 12;

export function noteAtPosition(openNote: string, semitones: number): string {
  const interval = Interval.fromSemitones(semitones);
  return Note.transpose(openNote, interval);
}

export function noteFrequency(noteName: string): number {
  return Note.freq(noteName) ?? 440;
}
