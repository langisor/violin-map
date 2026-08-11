export type WesternScaleKind = "major" | "minor";

export interface WesternScalePreset {
  id: string;
  tonic: string;
  kind: WesternScaleKind;
  intervals: number[];
}

export const WESTERN_KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

const SCALE_INTERVALS: Record<WesternScaleKind, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12],
};

export function westernScale(tonic: string, kind: WesternScaleKind): WesternScalePreset {
  return {
    id: `${tonic.toLowerCase().replace("#", "sharp").replace("b", "flat")}-${kind}`,
    tonic,
    kind,
    intervals: SCALE_INTERVALS[kind],
  };
}

export function isNoteInWesternScale(
  openNote: string,
  step: number,
  scale: WesternScalePreset,
): boolean {
  const openMidi = Note.midi(openNote);
  const tonicMidi = Note.midi(`${scale.tonic}3`);
  if (openMidi === null || tonicMidi === null) return false;
  const pitchClassOffset = ((openMidi + step - tonicMidi) % 12 + 12) % 12;
  return scale.intervals.some((interval) => Math.abs(pitchClassOffset - (interval % 12)) < 0.1);
}
import { Note } from "tonal";
