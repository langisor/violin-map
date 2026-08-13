import { MAQAMAT } from "@/lib/maqam-theory";
import { WESTERN_KEYS, westernScale } from "@/lib/western-scale-theory";

export interface RecordedNote {
  id: string;
  label: string;
  frequency: number;
  stringId: string;
  step: number;
}

export interface AnalysisMatch {
  id: string;
  family: "Scale" | "Maqam";
  name: string;
  tonic: string;
  intervals: number[];
  matched: number;
  total: number;
  distance: number;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function recordedNotePitchClass(note: RecordedNote): number {
  return ((Math.round((69 + 12 * Math.log2(note.frequency / 440)) * 2) % 24) + 24) % 24;
}

function tonicLabel(quarterPitchClass: number): string {
  const pitchClass = Math.floor(quarterPitchClass / 2);
  return `${NOTE_NAMES[pitchClass]}${quarterPitchClass % 2 ? "+" : ""}`;
}

function makeMatch(
  family: AnalysisMatch["family"],
  name: string,
  tonicQuarterPitchClass: number,
  intervals: number[],
  selectedPitchClasses: Set<number>,
): AnalysisMatch {
  const available = new Set(intervals.map((interval) => (tonicQuarterPitchClass + interval * 2) % 24));
  const matched = [...selectedPitchClasses].filter((pitchClass) => available.has(pitchClass)).length;
  const missing = [...available].filter((pitchClass) => !selectedPitchClasses.has(pitchClass)).length;

  return {
    id: `${family}-${name}-${tonicQuarterPitchClass}`,
    family,
    name,
    tonic: tonicLabel(tonicQuarterPitchClass),
    intervals,
    matched,
    total: selectedPitchClasses.size,
    // Prioritize containing the selected notes; then prefer the closest, least-extra set.
    distance: (selectedPitchClasses.size - matched) * 10 + missing,
  };
}

/** Finds the closest scale and maqam interval sets after trying every possible tonic. */
export function analyzeRecordedNotes(notes: RecordedNote[]): AnalysisMatch[] {
  const selectedPitchClasses = new Set(notes.map(recordedNotePitchClass));
  if (!selectedPitchClasses.size) return [];

  const matches: AnalysisMatch[] = [];
  for (const key of WESTERN_KEYS) {
    for (const kind of ["major", "minor"] as const) {
      const scale = westernScale(key, kind);
      const tonicQuarterPitchClass = NOTE_NAMES.indexOf(key.replace("b", "#")) * 2;
      // Flats that aren't in NOTE_NAMES need their enharmonic pitch class.
      const tonic = key === "Eb" ? 6 : key === "Ab" ? 16 : key === "Bb" ? 20 : tonicQuarterPitchClass;
      matches.push(makeMatch("Scale", `${key} ${kind}`, tonic, scale.intervals, selectedPitchClasses));
    }
  }

  for (const maqam of MAQAMAT) {
    for (let tonic = 0; tonic < 24; tonic += 1) {
      matches.push(makeMatch("Maqam", maqam.nameEn, tonic, maqam.intervals, selectedPitchClasses));
    }
  }

  return matches
    .sort((a, b) => b.matched - a.matched || a.distance - b.distance || a.name.localeCompare(b.name))
    .slice(0, 8);
}

export function formatIntervals(intervals: number[]): string {
  return intervals.map((interval) => (Number.isInteger(interval) ? interval.toString() : interval.toFixed(1))).join(" · ");
}
