import { Note, Interval } from "tonal";

export interface DoubleStopPreset {
  id: string;
  name: string;
  description: string;
  intervals: number[]; // intervals between the two notes in semitones
  stringPairs: [number, number][]; // string indices (0-3) that work well for this interval
  difficulty: "beginner" | "intermediate" | "advanced";
  handPosition: "first" | "second" | "third" | "higher";
}

export const DOUBLE_STOPS: DoubleStopPreset[] = [
  {
    id: "octaves",
    name: "Octaves",
    description: "Same note on different strings - pure and powerful",
    intervals: [12],
    stringPairs: [[0, 2], [1, 3]], // G-D, A-E string pairs
    difficulty: "intermediate",
    handPosition: "higher",
  },
  {
    id: "fifths",
    name: "Perfect Fifths",
    description: "Open string fifths - most natural double-stop",
    intervals: [7],
    stringPairs: [[0, 1], [1, 2], [2, 3]], // Adjacent strings
    difficulty: "beginner",
    handPosition: "first",
  },
  {
    id: "fourths",
    name: "Perfect Fourths",
    description: "Fourth interval - clean and resonant",
    intervals: [5],
    stringPairs: [[0, 2], [1, 3]], // Skip one string
    difficulty: "beginner",
    handPosition: "first",
  },
  {
    id: "thirds-major",
    name: "Major Thirds",
    description: "Bright and harmonious - requires careful intonation",
    intervals: [4],
    stringPairs: [[0, 1], [1, 2], [2, 3]],
    difficulty: "intermediate",
    handPosition: "second",
  },
  {
    id: "thirds-minor",
    name: "Minor Thirds",
    description: "Darker and more emotional",
    intervals: [3],
    stringPairs: [[0, 1], [1, 2], [2, 3]],
    difficulty: "intermediate",
    handPosition: "second",
  },
  {
    id: "sixths-major",
    name: "Major Sixths",
    description: "Open and beautiful - common in Baroque music",
    intervals: [9],
    stringPairs: [[0, 2], [1, 3]],
    difficulty: "intermediate",
    handPosition: "third",
  },
  {
    id: "sixths-minor",
    name: "Minor Sixths",
    description: "More complex and expressive",
    intervals: [8],
    stringPairs: [[0, 2], [1, 3]],
    difficulty: "advanced",
    handPosition: "third",
  },
  {
    id: "seconds-major",
    name: "Major Seconds",
    description: "Dissonant and tense - creates resolution needs",
    intervals: [2],
    stringPairs: [[0, 1], [1, 2], [2, 3]],
    difficulty: "advanced",
    handPosition: "first",
  },
  {
    id: "seconds-minor",
    name: "Minor Seconds",
    description: "Very dissonant - creates strong tension",
    intervals: [1],
    stringPairs: [[0, 1], [1, 2], [2, 3]],
    difficulty: "advanced",
    handPosition: "first",
  },
  {
    id: "sevenths-major",
    name: "Major Sevenths",
    description: "Highly dissonant - dramatic and expressive",
    intervals: [11],
    stringPairs: [[0, 2], [1, 3]],
    difficulty: "advanced",
    handPosition: "higher",
  },
  {
    id: "sevenths-minor",
    name: "Minor Sevenths",
    description: "Bluesy and tense",
    intervals: [10],
    stringPairs: [[0, 2], [1, 3]],
    difficulty: "advanced",
    handPosition: "higher",
  },
];

export interface DoubleStopPosition {
  lowerString: number;
  lowerStep: number;
  lowerNote: string;
  upperString: number;
  upperStep: number;
  upperNote: string;
  interval: number;
  fingerSpacing: number; // difference in finger positions
}

export function generateDoubleStopPositions(
  doubleStop: DoubleStopPreset,
  startNote: string,
  strings: { openNote: string }[]
): DoubleStopPosition[] {
  const positions: DoubleStopPosition[] = [];
  
  doubleStop.stringPairs.forEach(([lowerStringIdx, upperStringIdx]) => {
    const lowerString = strings[lowerStringIdx];
    const upperString = strings[upperStringIdx];
    
    if (!lowerString || !upperString) return;
    
    // Generate positions for this string pair
    for (let step = 0; step <= 12; step++) {
      const lowerNote = Note.transpose(lowerString.openNote, Interval.fromSemitones(step));
      const targetInterval = doubleStop.intervals[0];
      const upperStep = step + targetInterval;
      
      // Check if upper position is reasonable
      if (upperStep >= 0 && upperStep <= 12) {
        const upperNote = Note.transpose(upperString.openNote, Interval.fromSemitones(upperStep));
        
        positions.push({
          lowerString: lowerStringIdx,
          lowerStep: step,
          lowerNote,
          upperString: upperStringIdx,
          upperStep,
          upperNote,
          interval: targetInterval,
          fingerSpacing: Math.abs(upperStep - step),
        });
      }
    }
  });
  
  return positions;
}

export interface DoubleStopExercise {
  doubleStop: DoubleStopPreset;
  positions: DoubleStopPosition[];
  mode: "practice" | "identify" | "intonation";
  startNote: string;
}

export function generateDoubleStopExercise(
  doubleStop: DoubleStopPreset,
  mode: "practice" | "identify" | "intonation" = "practice",
  _startNote: string = "G3",
  strings: { openNote: string }[]
): DoubleStopExercise {
  const positions = generateDoubleStopPositions(doubleStop, startNote, strings);
  
  // Filter for playable positions
  const playablePositions = positions.filter(pos => 
    pos.fingerSpacing <= 4 && // Reasonable finger spacing
    pos.lowerStep >= 0 && pos.upperStep >= 0
  );
  
  return {
    doubleStop,
    positions: playablePositions.slice(0, 8), // Limit to 8 positions
    mode,
    startNote: _startNote,
  };
}

export function getDoubleStopIntonationFeedback(
  playedNotes: [string, string],
  targetNotes: [string, string]
): {
  isIntune: boolean;
  centsOff: [number, number];
  feedback: string;
} {
  const getMidi = (note: string) => Note.midi(note);
  
  const playedMidi = playedNotes.map(getMidi) as [number | null, number | null];
  const targetMidi = targetNotes.map(getMidi) as [number | null, number | null];
  
  if (playedMidi.some(m => m === null) || targetMidi.some(m => m === null)) {
    return {
      isIntune: false,
      centsOff: [0, 0],
      feedback: "Could not analyze notes",
    };
  }
  
  const centsOff = playedMidi.map((played, i) => {
    const target = targetMidi[i]!;
    const diff = (played! - target) * 100;
    return Math.round(diff);
  }) as [number, number];
  
  const maxCentsOff = Math.max(...centsOff.map(Math.abs));
  const isIntune = maxCentsOff < 15; // Within 15 cents
  
  let feedback = "";
  if (isIntune) {
    feedback = "Excellent intonation!";
  } else if (maxCentsOff < 30) {
    feedback = "Close - fine-tune your fingers";
  } else {
    feedback = "Adjust your finger positions";
  }
  
  return {
    isIntune,
    centsOff,
    feedback,
  };
}

export type DoubleStopPattern = "parallel" | "contrary" | "oblique" | "broken";

export interface DoubleStopPatternExercise {
  pattern: DoubleStopPattern;
  positions: DoubleStopPosition[];
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export function generatePatternExercise(
  pattern: DoubleStopPattern,
  doubleStop: DoubleStopPreset,
  startNote: string,
  strings: { openNote: string }[]
): DoubleStopPatternExercise {
  const basePositions = generateDoubleStopPositions(doubleStop, startNote, strings);
  
  let patternPositions: DoubleStopPosition[] = [];
  let description = "";
  let difficulty: "beginner" | "intermediate" | "advanced" = "beginner";
  
  switch (pattern) {
    case "parallel":
      // Both notes move in same direction
      patternPositions = basePositions.slice(0, 6);
      description = "Both notes move in the same direction, maintaining the interval";
      difficulty = "beginner";
      break;
    case "contrary":
      // Notes move in opposite directions
      patternPositions = basePositions.slice(0, 4).reverse();
      description = "Notes move in opposite directions, creating counterpoint";
      difficulty = "advanced";
      break;
    case "oblique":
      // One note stays while other moves
      patternPositions = basePositions.filter(p => p.lowerStep === 0).slice(0, 4);
      description = "One note remains stationary while the other moves";
      difficulty = "intermediate";
      break;
    case "broken":
      // Arpeggiated double-stops
      patternPositions = basePositions.filter((_, i) => i % 2 === 0).slice(0, 4);
      description = "Play the notes of the double-stop separately, then together";
      difficulty = "intermediate";
      break;
  }
  
  return {
    pattern,
    positions: patternPositions,
    description,
    difficulty,
  };
}