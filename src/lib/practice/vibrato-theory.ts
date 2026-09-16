export interface VibratoExercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  speed: "slow" | "medium" | "fast";
  amplitude: "narrow" | "medium" | "wide";
  instructions: string[];
  focusAreas: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

export const VIBRATO_EXERCISES: VibratoExercise[] = [
  {
    id: "basic-pulse",
    name: "Basic Pulse",
    description: "Foundation exercise for developing vibrato pulse",
    duration: 60,
    speed: "slow",
    amplitude: "narrow",
    instructions: [
      "Place finger on the string without pressing too hard",
      "Create a slow, rhythmic pulse using wrist motion",
      "Keep the motion small and controlled",
      "Focus on even timing between pulses",
      "Maintain relaxed hand and arm",
    ],
    focusAreas: ["Wrist flexibility", "Relaxation", "Timing"],
    difficulty: "beginner",
  },
  {
    id: "hand-rotation",
    name: "Hand Rotation",
    description: "Develop hand rotation for smooth vibrato",
    duration: 90,
    speed: "slow",
    amplitude: "medium",
    instructions: [
      "Practice rotating hand back and forth",
      "Keep finger contact point stable",
      "Use forearm to drive the motion",
      "Focus on smooth, continuous movement",
      "Avoid tension in the wrist",
    ],
    focusAreas: ["Hand rotation", "Smooth motion", "Arm relaxation"],
    difficulty: "beginner",
  },
  {
    id: "speed-building",
    name: "Speed Building",
    description: "Gradually increase vibrato speed",
    duration: 120,
    speed: "medium",
    amplitude: "medium",
    instructions: [
      "Start with slow pulses as established in basic exercise",
      "Gradually increase speed while maintaining control",
      "Use a metronome to track your progress",
      "Focus on even spacing between oscillations",
      "Return to slow speed if tension develops",
    ],
    focusAreas: ["Speed control", "Even oscillations", "Metronome work"],
    difficulty: "intermediate",
  },
  {
    id: "amplitude-control",
    name: "Amplitude Control",
    description: "Practice varying vibrato width",
    duration: 120,
    speed: "medium",
    amplitude: "wide",
    instructions: [
      "Start with narrow vibrato (small pitch variation)",
      "Gradually increase amplitude while maintaining control",
      "Practice wide vibrato for expressive passages",
      "Return to narrow vibrato for precision",
      "Focus on smooth transitions between widths",
    ],
    focusAreas: ["Amplitude control", "Expressive range", "Control"],
    difficulty: "intermediate",
  },
  {
    id: "finger-independence",
    name: "Finger Independence",
    description: "Practice vibrato with different fingers",
    duration: 180,
    speed: "medium",
    amplitude: "medium",
    instructions: [
      "Practice vibrato on each finger (1-4)",
      "Start with 2nd finger (usually easiest)",
      "Focus on consistent quality across all fingers",
      "Pay special attention to 4th finger (pinky)",
      "Practice on different strings and positions",
    ],
    focusAreas: ["Finger strength", "Consistency", "All fingers"],
    difficulty: "intermediate",
  },
  {
    id: "expressive-vibrato",
    name: "Expressive Vibrato",
    description: "Apply vibrato musically in different contexts",
    duration: 180,
    speed: "fast",
    amplitude: "wide",
    instructions: [
      "Practice starting vibrato after note attack",
      "Experiment with delayed vibrato for expression",
      "Practice varying speed within a single note",
      "Apply vibrato to musical phrases",
      "Focus on musical phrasing and timing",
    ],
    focusAreas: ["Musical expression", "Phrasing", "Timing"],
    difficulty: "advanced",
  },
  {
    id: "high-position",
    name: "High Position Vibrato",
    description: "Vibrato technique in higher positions",
    duration: 150,
    speed: "medium",
    amplitude: "medium",
    instructions: [
      "Practice vibrato in 3rd position and higher",
      "Adjust hand posture for higher positions",
      "Focus on maintaining relaxed arm",
      "Practice on different strings in high positions",
      "Pay attention to thumb placement",
    ],
    focusAreas: ["High position technique", "Arm relaxation", "Thumb placement"],
    difficulty: "advanced",
  },
];

export interface VibratoSession {
  exerciseId: string;
  startTime: number;
  completed: boolean;
  notes: string[];
}

export interface VibratoStats {
  totalSessions: number;
  completedExercises: Record<string, number>;
  totalPracticeTime: number; // in minutes
  averageSessionDuration: number;
  preferredSpeed: Record<string, number>;
  preferredAmplitude: Record<string, number>;
}

export function getExerciseById(id: string): VibratoExercise | undefined {
  return VIBRATO_EXERCISES.find(e => e.id === id);
}

export function getExercisesByDifficulty(difficulty: VibratoExercise["difficulty"]): VibratoExercise[] {
  return VIBRATO_EXERCISES.filter(e => e.difficulty === difficulty);
}

export function getBeginnerExercises(): VibratoExercise[] {
  return getExercisesByDifficulty("beginner");
}

export function getIntermediateExercises(): VibratoExercise[] {
  return getExercisesByDifficulty("intermediate");
}

export function getAdvancedExercises(): VibratoExercise[] {
  return getExercisesByDifficulty("advanced");
}

export function startVibratoSession(exerciseId: string): VibratoSession {
  return {
    exerciseId,
    startTime: Date.now(),
    completed: false,
    notes: [],
  };
}

export function completeVibratoSession(session: VibratoSession, notes: string[]): VibratoSession {
  return {
    ...session,
    completed: true,
    notes,
  };
}

export function updateVibratoStats(
  stats: VibratoStats,
  session: VibratoSession,
  exercise: VibratoExercise
): VibratoStats {
  const newStats = { ...stats };
  
  newStats.totalSessions++;
  newStats.completedExercises[exercise.id] = (newStats.completedExercises[exercise.id] || 0) + 1;
  
  const sessionDuration = (Date.now() - session.startTime) / 1000 / 60; // in minutes
  newStats.totalPracticeTime += sessionDuration;
  newStats.averageSessionDuration = newStats.totalPracticeTime / newStats.totalSessions;
  
  newStats.preferredSpeed[exercise.speed] = (newStats.preferredSpeed[exercise.speed] || 0) + 1;
  newStats.preferredAmplitude[exercise.amplitude] = (newStats.preferredAmplitude[exercise.amplitude] || 0) + 1;
  
  return newStats;
}

export function getVibratoProgression(): VibratoExercise[] {
  // Suggested progression from beginner to advanced
  return [
    getExerciseById("basic-pulse")!,
    getExerciseById("hand-rotation")!,
    getExerciseById("speed-building")!,
    getExerciseById("amplitude-control")!,
    getExerciseById("finger-independence")!,
    getExerciseById("expressive-vibrato")!,
    getExerciseById("high-position")!,
  ].filter(Boolean);
}

export function getNextRecommendedExercise(
  completedExercises: Record<string, number>
): VibratoExercise | null {
  const progression = getVibratoProgression();
  
  for (const exercise of progression) {
    const completions = completedExercises[exercise.id] || 0;
    if (completions < 3) { // Recommend each exercise at least 3 times
      return exercise;
    }
  }
  
  // If all exercises completed sufficiently, return a random advanced exercise
  const advancedExercises = getAdvancedExercises();
  return advancedExercises[Math.floor(Math.random() * advancedExercises.length)] || null;
}