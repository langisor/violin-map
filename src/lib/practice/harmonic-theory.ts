import { Note, Interval } from "tonal";

export interface HarmonicPreset {
  id: string;
  name: string;
  description: string;
  harmonic: number; // harmonic number (1 = fundamental, 2 = octave, 3 = fifth, etc.)
  position: string; // fingerboard position description
  difficulty: "beginner" | "intermediate" | "advanced";
}

export const HARMONICS: HarmonicPreset[] = [
  {
    id: "octave",
    name: "Octave Harmonic",
    description: "The most common harmonic, exactly halfway between the string",
    harmonic: 2,
    position: "1/2 of string length",
    difficulty: "beginner",
  },
  {
    id: "fifth",
    name: "Fifth Harmonic",
    description: "Produces a perfect fifth above the fundamental",
    harmonic: 3,
    position: "1/3 of string length",
    difficulty: "beginner",
  },
  {
    id: "double-octave",
    name: "Double Octave Harmonic",
    description: "Two octaves above the fundamental",
    harmonic: 4,
    position: "1/4 of string length",
    difficulty: "intermediate",
  },
  {
    id: "major-third",
    name: "Major Third Harmonic",
    description: "Produces a major third above the double octave",
    harmonic: 5,
    position: "1/5 of string length",
    difficulty: "intermediate",
  },
  {
    id: "augmented-fifth",
    name: "Augmented Fifth Harmonic",
    description: "Produces an augmented fifth above the double octave",
    harmonic: 6,
    position: "1/6 of string length",
    difficulty: "advanced",
  },
  {
    id: "minor-seventh",
    name: "Minor Seventh Harmonic",
    description: "Produces a minor seventh above the triple octave",
    harmonic: 7,
    position: "1/7 of string length",
    difficulty: "advanced",
  },
];

export interface HarmonicExercise {
  harmonic: HarmonicPreset;
  stringNote: string;
  targetNote: string;
  fingerPosition: number; // approximate position in semitones from nut
  technique: string;
}

export function generateHarmonicExercise(
  harmonic: HarmonicPreset,
  stringNote: string
): HarmonicExercise {
  // Calculate the target note based on the harmonic series
  const openMidi = Note.midi(stringNote);
  if (openMidi === null) {
    return {
      harmonic,
      stringNote,
      targetNote: stringNote,
      fingerPosition: 0,
      technique: "Basic harmonic touch",
    };
  }

  // Harmonic series: frequency = fundamental * harmonic number
  // In MIDI: note = fundamental + 12 * log2(harmonic)
  const harmonicMidi = openMidi + 12 * Math.log2(harmonic.harmonic);
  const targetNote = Note.fromMidi(Math.round(harmonicMidi)) || stringNote;

  // Calculate approximate finger position
  // For harmonic 2 (octave): 12 semitones (but played at halfway point)
  // For harmonic 3 (fifth): 7 semitones (but played at 1/3 point)
  // For harmonic 4 (double octave): 12 semitones (but played at 1/4 point)
  const fingerPosition = Math.round(12 * (1 - 1 / harmonic.harmonic));

  let technique = "";
  switch (harmonic.harmonic) {
    case 2:
      technique = "Lightly touch string exactly halfway, bow normally";
      break;
    case 3:
      technique = "Touch string at 1/3 point from nut, bow near bridge";
      break;
    case 4:
      technique = "Touch string at 1/4 point, use very light bow pressure";
      break;
    case 5:
      technique = "Touch string at 1/5 point, precise finger placement needed";
      break;
    default:
      technique = "Precise finger placement required, experiment with bow placement";
  }

  return {
    harmonic,
    stringNote,
    targetNote,
    fingerPosition,
    technique,
  };
}

export function getHarmonicSeries(fundamental: string, count: number = 8): string[] {
  const fundamentalMidi = Note.midi(fundamental);
  if (fundamentalMidi === null) return [];

  const series: string[] = [];
  for (let i = 1; i <= count; i++) {
    const harmonicMidi = fundamentalMidi + 12 * Math.log2(i);
    const note = Note.fromMidi(Math.round(harmonicMidi));
    if (note) series.push(note);
  }

  return series;
}

export interface HarmonicPracticeStats {
  totalAttempts: number;
  successfulHarmonics: number;
  harmonicsPracticed: Record<string, number>;
  preferredStrings: Record<string, number>;
  averageQuality: number; // 1-10 scale
}

export function updateHarmonicStats(
  stats: HarmonicPracticeStats,
  harmonicId: string,
  stringNote: string,
  quality: number
): HarmonicPracticeStats {
  const newStats = { ...stats };
  
  newStats.totalAttempts++;
  if (quality >= 5) {
    newStats.successfulHarmonics++;
  }
  
  newStats.harmonicsPracticed[harmonicId] = (newStats.harmonicsPracticed[harmonicId] || 0) + 1;
  newStats.preferredStrings[stringNote] = (newStats.preferredStrings[stringNote] || 0) + 1;
  
  // Update average quality
  const totalQuality = newStats.averageQuality * (newStats.totalAttempts - 1) + quality;
  newStats.averageQuality = totalQuality / newStats.totalAttempts;
  
  return newStats;
}

export function getHarmonicIntervals(fundamental: string): Array<{harmonic: number, note: string, interval: string}> {
  const fundamentalMidi = Note.midi(fundamental);
  if (fundamentalMidi === null) return [];

  return HARMONICS.map(h => {
    const harmonicMidi = fundamentalMidi + 12 * Math.log2(h.harmonic);
    const note = Note.fromMidi(Math.round(harmonicMidi)) || fundamental;
    const interval = Interval.fromSemitones(Math.round(12 * Math.log2(h.harmonic)));
    
    return {
      harmonic: h.harmonic,
      note,
      interval: interval.toString() || "unknown",
    };
  });
}

export function getBeginnerHarmonics(): HarmonicPreset[] {
  return HARMONICS.filter(h => h.difficulty === "beginner");
}

export function getIntermediateHarmonics(): HarmonicPreset[] {
  return HARMONICS.filter(h => h.difficulty === "intermediate");
}

export function getAdvancedHarmonics(): HarmonicPreset[] {
  return HARMONICS.filter(h => h.difficulty === "advanced");
}