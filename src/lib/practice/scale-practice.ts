import { Note, Interval } from "tonal";
import type { WesternScalePreset } from "@/lib/western-scale-theory";
import type { MaqamPreset } from "@/lib/maqam-theory";

export type ScalePattern = "ascending" | "descending" | "both" | "thirds" | "arpeggio" | "sevenths";

export interface ScalePatternPreset {
  id: ScalePattern;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export const SCALE_PATTERNS: ScalePatternPreset[] = [
  {
    id: "ascending",
    name: "Ascending",
    description: "Play scale from bottom to top",
    difficulty: "beginner",
  },
  {
    id: "descending",
    name: "Descending",
    description: "Play scale from top to bottom",
    difficulty: "beginner",
  },
  {
    id: "both",
    name: "Both Directions",
    description: "Play scale up and down",
    difficulty: "beginner",
  },
  {
    id: "thirds",
    name: "In Thirds",
    description: "Play scale in thirds (skip one note)",
    difficulty: "intermediate",
  },
  {
    id: "arpeggio",
    name: "Arpeggio",
    description: "Play chord tones (1, 3, 5, 7)",
    difficulty: "intermediate",
  },
  {
    id: "sevenths",
    name: "In Sevenths",
    description: "Play scale in sevenths (skip two notes)",
    difficulty: "advanced",
  },
];

export interface ScaleNote {
  note: string;
  octave: number;
  step: number;
  isTarget: boolean;
}

export interface ScaleExercise {
  scaleType: "western" | "maqam";
  scale: WesternScalePreset | MaqamPreset;
  pattern: ScalePattern;
  notes: ScaleNote[];
  tempo: number;
}

export function generateScaleExercise(
  scale: WesternScalePreset | MaqamPreset,
  pattern: ScalePattern,
  scaleType: "western" | "maqam",
  startOctave: number = 3
): ScaleExercise {
  const intervals = scale.intervals;
  const notes: ScaleNote[] = [];
  
  const baseNote = scaleType === "western" 
    ? `${scale.tonic}${startOctave}`
    : `${scale.tonic}${startOctave}`;
  
  // Generate base scale notes
  const baseNotes: ScaleNote[] = intervals.map((interval, index) => {
    const note = Note.transpose(baseNote, Interval.fromSemitones(interval));
    const noteObj = Note.get(note);
    return {
      note: noteObj.pc || note,
      octave: noteObj.oct || startOctave,
      step: index,
      isTarget: false,
    };
  });

  // Apply pattern
  switch (pattern) {
    case "ascending":
      notes.push(...baseNotes);
      break;
    case "descending":
      notes.push(...[...baseNotes].reverse());
      break;
    case "both":
      notes.push(...baseNotes);
      notes.push(...[...baseNotes.slice(1, -1)].reverse());
      break;
    case "thirds":
      for (let i = 0; i < baseNotes.length - 2; i++) {
        notes.push(baseNotes[i]);
        notes.push(baseNotes[i + 2]);
      }
      break;
    case "arpeggio":
      // 1, 3, 5, 7 pattern
      const arpeggioIndices = [0, 2, 4, 6];
      arpeggioIndices.forEach(i => {
        if (baseNotes[i]) notes.push(baseNotes[i]);
      });
      break;
    case "sevenths":
      for (let i = 0; i < baseNotes.length - 3; i++) {
        notes.push(baseNotes[i]);
        notes.push(baseNotes[i + 3]);
      }
      break;
  }

  // Mark target notes (every other note for practice)
  notes.forEach((note, index) => {
    note.isTarget = index % 2 === 0;
  });

  return {
    scaleType,
    scale,
    pattern,
    notes,
    tempo: 60, // Default tempo
  };
}

export interface ScalePracticeStats {
  totalExercises: number;
  completedExercises: number;
  patternsPracticed: Record<string, number>;
  scalesPracticed: Record<string, number>;
  averageTempo: number;
  practiceTime: number; // in minutes
}

export function updateScaleStats(
  stats: ScalePracticeStats,
  scaleId: string,
  pattern: ScalePattern,
  tempo: number,
  completed: boolean
): ScalePracticeStats {
  const newStats = { ...stats };
  
  newStats.totalExercises++;
  if (completed) {
    newStats.completedExercises++;
  }
  
  newStats.patternsPracticed[pattern] = (newStats.patternsPracticed[pattern] || 0) + 1;
  newStats.scalesPracticed[scaleId] = (newStats.scalesPracticed[scaleId] || 0) + 1;
  
  // Update average tempo
  const totalTempo = newStats.averageTempo * (newStats.totalExercises - 1) + tempo;
  newStats.averageTempo = totalTempo / newStats.totalExercises;
  
  return newStats;
}

export function getScaleNotesString(exercise: ScaleExercise): string {
  return exercise.notes.map(n => `${n.note}${n.octave}`).join(" → ");
}

export function calculateScaleDuration(exercise: ScaleExercise): number {
  // Estimate duration based on tempo and note count
  const beatsPerNote = 0.5; // eighth notes
  const totalBeats = exercise.notes.length * beatsPerNote;
  return (totalBeats / exercise.tempo) * 60; // in seconds
}