import { Note, Interval } from "tonal";

export interface IntervalPreset {
  id: string;
  name: string;
  semitones: number;
  symbol: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export const INTERVALS: IntervalPreset[] = [
  {
    id: "unison",
    name: "Unison",
    semitones: 0,
    symbol: "P1",
    description: "The same note played together",
    difficulty: "beginner",
  },
  {
    id: "minor2",
    name: "Minor Second",
    semitones: 1,
    symbol: "m2",
    description: "One semitone, creates tension",
    difficulty: "beginner",
  },
  {
    id: "major2",
    name: "Major Second",
    semitones: 2,
    symbol: "M2",
    description: "Two semitones, a whole step",
    difficulty: "beginner",
  },
  {
    id: "minor3",
    name: "Minor Third",
    semitones: 3,
    symbol: "m3",
    description: "Three semitones, melancholic",
    difficulty: "beginner",
  },
  {
    id: "major3",
    name: "Major Third",
    semitones: 4,
    symbol: "M3",
    description: "Four semitones, bright and happy",
    difficulty: "beginner",
  },
  {
    id: "perfect4",
    name: "Perfect Fourth",
    semitones: 5,
    symbol: "P4",
    description: "Five semitones, stable",
    difficulty: "beginner",
  },
  {
    id: "tritone",
    name: "Tritone",
    semitones: 6,
    symbol: "TT",
    description: "Six semitones, very tense",
    difficulty: "intermediate",
  },
  {
    id: "perfect5",
    name: "Perfect Fifth",
    semitones: 7,
    symbol: "P5",
    description: "Seven semitones, very stable",
    difficulty: "beginner",
  },
  {
    id: "minor6",
    name: "Minor Sixth",
    semitones: 8,
    symbol: "m6",
    description: "Eight semitones, dark",
    difficulty: "intermediate",
  },
  {
    id: "major6",
    name: "Major Sixth",
    semitones: 9,
    symbol: "M6",
    description: "Nine semitones, warm",
    difficulty: "intermediate",
  },
  {
    id: "minor7",
    name: "Minor Seventh",
    semitones: 10,
    symbol: "m7",
    description: "Ten semitones, bluesy",
    difficulty: "intermediate",
  },
  {
    id: "major7",
    name: "Major Seventh",
    semitones: 11,
    symbol: "M7",
    description: "Eleven semitones, jazzy",
    difficulty: "advanced",
  },
  {
    id: "octave",
    name: "Octave",
    semitones: 12,
    symbol: "P8",
    description: "Twelve semitones, same note higher",
    difficulty: "beginner",
  },
];

export type IntervalExerciseMode = "identify" | "practice" | "challenge";

export interface IntervalExercise {
  interval: IntervalPreset;
  rootNote: string;
  targetNote: string;
  answerOptions: string[];
  correctAnswer: string;
}

export function generateIntervalExercise(
  mode: IntervalExerciseMode,
  previousIntervals?: IntervalPreset[]
): IntervalExercise {
  // Filter intervals based on mode difficulty
  let availableIntervals = INTERVALS;
  if (mode === "identify") {
    availableIntervals = INTERVALS.filter((i) => i.difficulty === "beginner");
  } else if (mode === "practice") {
    availableIntervals = INTERVALS.filter((i) => 
      i.difficulty === "beginner" || i.difficulty === "intermediate"
    );
  }

  // Avoid repeating the same interval
  let interval = availableIntervals[Math.floor(Math.random() * availableIntervals.length)];
  if (previousIntervals && previousIntervals.length > 0) {
    const attempts = 5;
    for (let i = 0; i < attempts; i++) {
      const candidate = availableIntervals[Math.floor(Math.random() * availableIntervals.length)];
      if (!previousIntervals.some(p => p.id === candidate.id)) {
        interval = candidate;
        break;
      }
    }
  }

  // Generate a random root note within a comfortable range
  const rootNotes = ["G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4"];
  const rootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];

  // Calculate the target note
  const targetNote = Note.transpose(rootNote, Interval.fromSemitones(interval.semitones));

  // Generate answer options based on mode
  let answerOptions: string[] = [];
  if (mode === "identify") {
    // User hears interval and must identify it by name
    answerOptions = generateIntervalNames(interval, availableIntervals);
  } else if (mode === "practice") {
    // User sees interval and must play it correctly
    answerOptions = [interval.name];
  } else {
    // Challenge mode: mixed
    answerOptions = generateIntervalNames(interval, availableIntervals);
  }

  return {
    interval,
    rootNote,
    targetNote,
    answerOptions,
    correctAnswer: interval.name,
  };
}

function generateIntervalNames(
  correctInterval: IntervalPreset,
  availableIntervals: IntervalPreset[]
): string[] {
  const options = [correctInterval.name];
  
  // Add 3-4 distractors
  const distractors = availableIntervals
    .filter(i => i.id !== correctInterval.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(i => i.name);
  
  options.push(...distractors);
  
  // Shuffle
  return options.sort(() => Math.random() - 0.5);
}

export function getIntervalBetweenNotes(note1: string, note2: string): IntervalPreset | null {
  const midi1 = Note.midi(note1);
  const midi2 = Note.midi(note2);
  
  if (midi1 === null || midi2 === null) return null;
  
  const semitones = Math.abs(midi2 - midi1);
  return INTERVALS.find(i => i.semitones === semitones) || null;
}

export interface IntervalPracticeStats {
  totalAttempts: number;
  correctAnswers: number;
  intervalsAttempted: Record<string, number>;
  intervalsCorrect: Record<string, number>;
  streak: number;
  bestStreak: number;
}

export function updateIntervalStats(
  stats: IntervalPracticeStats,
  intervalId: string,
  isCorrect: boolean
): IntervalPracticeStats {
  const newStats = { ...stats };
  
  newStats.totalAttempts++;
  newStats.intervalsAttempted[intervalId] = (newStats.intervalsAttempted[intervalId] || 0) + 1;
  
  if (isCorrect) {
    newStats.correctAnswers++;
    newStats.intervalsCorrect[intervalId] = (newStats.intervalsCorrect[intervalId] || 0) + 1;
    newStats.streak++;
    newStats.bestStreak = Math.max(newStats.bestStreak, newStats.streak);
  } else {
    newStats.streak = 0;
  }
  
  return newStats;
}