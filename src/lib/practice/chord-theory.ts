import { Note, Interval } from "tonal";

export interface ChordPreset {
  id: string;
  name: string;
  symbol: string;
  intervals: number[]; // semitones from root
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export const CHORDS: ChordPreset[] = [
  {
    id: "major",
    name: "Major Triad",
    symbol: "",
    intervals: [0, 4, 7],
    description: "Root, major third, perfect fifth - bright and happy",
    difficulty: "beginner",
  },
  {
    id: "minor",
    name: "Minor Triad",
    symbol: "m",
    intervals: [0, 3, 7],
    description: "Root, minor third, perfect fifth - melancholic",
    difficulty: "beginner",
  },
  {
    id: "diminished",
    name: "Diminished Triad",
    symbol: "dim",
    intervals: [0, 3, 6],
    description: "Root, minor third, diminished fifth - tense",
    difficulty: "intermediate",
  },
  {
    id: "augmented",
    name: "Augmented Triad",
    symbol: "aug",
    intervals: [0, 4, 8],
    description: "Root, major third, augmented fifth - dreamy",
    difficulty: "intermediate",
  },
  {
    id: "major7",
    name: "Major 7th",
    symbol: "maj7",
    intervals: [0, 4, 7, 11],
    description: "Major triad with major seventh - jazzy",
    difficulty: "intermediate",
  },
  {
    id: "dominant7",
    name: "Dominant 7th",
    symbol: "7",
    intervals: [0, 4, 7, 10],
    description: "Major triad with minor seventh - bluesy",
    difficulty: "intermediate",
  },
  {
    id: "minor7",
    name: "Minor 7th",
    symbol: "m7",
    intervals: [0, 3, 7, 10],
    description: "Minor triad with minor seventh - smooth",
    difficulty: "intermediate",
  },
  {
    id: "half-diminished",
    name: "Half-Diminished 7th",
    symbol: "m7b5",
    intervals: [0, 3, 6, 10],
    description: "Diminished triad with minor seventh - tense",
    difficulty: "advanced",
  },
  {
    id: "fully-diminished",
    name: "Fully Diminished 7th",
    symbol: "dim7",
    intervals: [0, 3, 6, 9],
    description: "Diminished triad with diminished seventh - very tense",
    difficulty: "advanced",
  },
];

export interface ChordPosition {
  stringId: string;
  note: string;
  step: number;
  finger: number; // 1-4 for finger number
}

export interface ChordOnFingerboard {
  chord: ChordPreset;
  root: string;
  positions: ChordPosition[];
  playability: "easy" | "moderate" | "difficult" | "impossible";
}

export function generateChordOnFingerboard(
  chord: ChordPreset,
  root: string,
  strings: { id: string; openNote: string }[]
): ChordOnFingerboard {
  const positions: ChordPosition[] = [];
  const rootMidi = Note.midi(root);
  
  if (rootMidi === null) {
    return {
      chord,
      root,
      positions: [],
      playability: "impossible",
    };
  }

  // For each chord tone, find the best position on each string
  chord.intervals.forEach((interval) => {
    const targetMidi = rootMidi + interval;
    
    strings.forEach((string) => {
      const stringMidi = Note.midi(string.openNote);
      if (stringMidi === null) return;
      
      // Calculate the step needed on this string
      const step = targetMidi - stringMidi;
      
      // Check if this is within reasonable range (0-12 semitones for first position)
      if (step >= 0 && step <= 12) {
        const note = Note.transpose(string.openNote, Interval.fromSemitones(step));
        const finger = calculateFingerNumber(step);
        
        positions.push({
          stringId: string.id,
          note,
          step,
          finger,
        });
      }
    });
  });

  // Evaluate playability
  const playability = evaluatePlayability(positions);

  return {
    chord,
    root,
    positions,
    playability,
  };
}

function calculateFingerNumber(step: number): number {
  if (step === 0) return 0; // open string
  if (step <= 2) return 1; // first finger
  if (step <= 4) return 2; // second finger
  if (step <= 6) return 3; // third finger
  return 4; // fourth finger
}

function evaluatePlayability(positions: ChordPosition[]): ChordOnFingerboard["playability"] {
  if (positions.length === 0) return "impossible";
  
  // Group by string to avoid multiple notes on same string
  const stringCounts = positions.reduce((acc, pos) => {
    acc[pos.stringId] = (acc[pos.stringId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const hasMultipleOnString = Object.values(stringCounts).some(count => count > 1);
  if (hasMultipleOnString) return "impossible";
  
  // Check if all chord tones are present
  if (positions.length < 3) return "difficult";
  
  // Check finger spacing
  const fingers = positions.map(p => p.finger).filter(f => f > 0);
  const fingerSpread = Math.max(...fingers) - Math.min(...fingers);
  
  if (fingerSpread <= 2) return "easy";
  if (fingerSpread <= 3) return "moderate";
  return "difficult";
}

export function getChordTones(chord: ChordPreset, root: string): string[] {
  const rootMidi = Note.midi(root);
  if (rootMidi === null) return [];
  
  return chord.intervals.map(interval => {
    const midi = rootMidi + interval;
    return Note.fromMidi(midi) || "";
  }).filter(Boolean);
}

export function identifyChordFromNotes(notes: string[]): ChordPreset | null {
  if (notes.length < 3) return null;
  
  // Convert notes to MIDI numbers relative to the lowest note
  const midis = notes.map(note => Note.midi(note)).filter(Boolean) as number[];
  if (midis.length < 3) return null;
  
  const sortedMidis = [...midis].sort((a, b) => a - b);
  const root = sortedMidis[0];
  const intervals = sortedMidis.map(midi => midi - root);
  
  // Try to match with known chords
  for (const chord of CHORDS) {
    if (arraysEqual(intervals, chord.intervals)) {
      return chord;
    }
  }
  
  return null;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => Math.abs(val - b[index]) < 0.1);
}

export type ChordExerciseMode = "identify" | "practice" | "construct";

export interface ChordExercise {
  chord: ChordPreset;
  root: string;
  mode: ChordExerciseMode;
  answerOptions: string[];
  correctAnswer: string;
  fingerboardPositions: ChordPosition[];
}

export function generateChordExercise(
  mode: ChordExerciseMode,
  availableChords: ChordPreset[] = CHORDS
): ChordExercise {
  // Filter chords based on mode
  let chords = availableChords;
  if (mode === "identify") {
    chords = CHORDS.filter(c => c.difficulty === "beginner");
  }
  
  const chord = chords[Math.floor(Math.random() * chords.length)];
  
  // Generate a random root note within comfortable range
  const roots = ["G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4"];
  const root = roots[Math.floor(Math.random() * roots.length)];
  
  // Generate answer options
  let answerOptions: string[] = [];
  if (mode === "identify") {
    answerOptions = generateChordNames(chord, chords);
  } else {
    answerOptions = [chord.name];
  }
  
  // Generate fingerboard positions (simplified)
  const fingerboardPositions: ChordPosition[] = chord.intervals.map((interval, index) => ({
    stringId: `str${index % 4}`,
    note: Note.transpose(root, Interval.fromSemitones(interval)),
    step: interval,
    finger: calculateFingerNumber(interval),
  }));
  
  return {
    chord,
    root,
    mode,
    answerOptions,
    correctAnswer: chord.name,
    fingerboardPositions,
  };
}

function generateChordNames(correctChord: ChordPreset, availableChords: ChordPreset[]): string[] {
  const options = [correctChord.name];
  
  const distractors = availableChords
    .filter(c => c.id !== correctChord.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => c.name);
  
  options.push(...distractors);
  return options.sort(() => Math.random() - 0.5);
}