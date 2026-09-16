export interface PracticeStep {
  id: string;
  type: "interval" | "scale" | "chord" | "technique" | "rest";
  title: string;
  description: string;
  duration: number; // in seconds
  parameters?: Record<string, any>;
}

export interface PracticeRoutine {
  id: string;
  name: string;
  description: string;
  category: "beginner" | "intermediate" | "advanced" | "warmup" | "technique";
  duration: number; // total duration in minutes
  steps: PracticeStep[];
}

export const PRACTICE_ROUTINES: PracticeRoutine[] = [
  {
    id: "beginner-warmup",
    name: "Beginner Warm-up",
    description: "Gentle warm-up routine for beginners",
    category: "warmup",
    duration: 10,
    steps: [
      {
        id: "warmup-1",
        type: "scale",
        title: "Open String Warm-up",
        description: "Play each open string slowly, focusing on tone quality",
        duration: 120,
        parameters: { scale: "open-strings", tempo: 60 },
      },
      {
        id: "warmup-2",
        type: "scale",
        title: "Simple Scale Exercise",
        description: "Play C major scale ascending and descending",
        duration: 180,
        parameters: { scale: "C-major", pattern: "both", tempo: 60 },
      },
      {
        id: "warmup-3",
        type: "interval",
        title: "Basic Intervals",
        description: "Practice major and minor thirds",
        duration: 180,
        parameters: { intervals: ["major3", "minor3"] },
      },
      {
        id: "warmup-4",
        type: "rest",
        title: "Rest and Stretch",
        description: "Take a break and stretch your hands",
        duration: 60,
      },
      {
        id: "warmup-5",
        type: "scale",
        title: "G Major Scale",
        description: "Practice G major scale with good posture",
        duration: 180,
        parameters: { scale: "G-major", pattern: "ascending", tempo: 60 },
      },
    ],
  },
  {
    id: "intermediate-technique",
    name: "Intermediate Technique Builder",
    description: "Build technique with scales and intervals",
    category: "intermediate",
    duration: 20,
    steps: [
      {
        id: "tech-1",
        type: "scale",
        title: "Scale in Thirds",
        description: "Practice C major scale in thirds",
        duration: 240,
        parameters: { scale: "C-major", pattern: "thirds", tempo: 60 },
      },
      {
        id: "tech-2",
        type: "interval",
        title: "Interval Challenge",
        description: "Practice all intervals from unison to octave",
        duration: 300,
        parameters: { mode: "practice" },
      },
      {
        id: "tech-3",
        type: "scale",
        title: "Arpeggio Practice",
        description: "Practice major and minor arpeggios",
        duration: 240,
        parameters: { scale: "C-major", pattern: "arpeggio", tempo: 60 },
      },
      {
        id: "tech-4",
        type: "rest",
        title: "Rest Break",
        description: "Shake out your hands and relax shoulders",
        duration: 60,
      },
      {
        id: "tech-5",
        type: "scale",
        title: "Scale Speed Building",
        description: "Practice scales at increasing tempos",
        duration: 300,
        parameters: { scale: "G-major", pattern: "both", tempo: 80 },
      },
      {
        id: "tech-6",
        type: "interval",
        title: "Interval Identification",
        description: "Test your ear with interval identification",
        duration: 180,
        parameters: { mode: "identify" },
      },
    ],
  },
  {
    id: "advanced-maqam",
    name: "Advanced Maqam Practice",
    description: "Deep dive into Arabic maqam system",
    category: "advanced",
    duration: 30,
    steps: [
      {
        id: "maqam-1",
        type: "scale",
        title: "Maqam Bayati",
        description: "Practice Bayati scale ascending and descending",
        duration: 300,
        parameters: { maqam: "bayati", pattern: "both", tempo: 60 },
      },
      {
        id: "maqam-2",
        type: "scale",
        title: "Maqam Rast",
        description: "Practice Rast scale with quarter tones",
        duration: 300,
        parameters: { maqam: "rast", pattern: "both", tempo: 60 },
      },
      {
        id: "maqam-3",
        type: "interval",
        title: "Maqam Intervals",
        description: "Practice characteristic intervals of each maqam",
        duration: 300,
        parameters: { mode: "practice" },
      },
      {
        id: "maqam-4",
        type: "rest",
        title: "Rest and Listen",
        description: "Listen to recordings of the maqamat you're practicing",
        duration: 120,
      },
      {
        id: "maqam-5",
        type: "scale",
        title: "Maqam Hijaz",
        description: "Practice Hijaz scale and its augmented second",
        duration: 300,
        parameters: { maqam: "hijaz", pattern: "both", tempo: 60 },
      },
      {
        id: "maqam-6",
        type: "scale",
        title: "Maqam Sikah",
        description: "Practice Sikah, rooted on a quarter tone",
        duration: 300,
        parameters: { maqam: "sikah", pattern: "ascending", tempo: 60 },
      },
    ],
  },
  {
    id: "daily-quick",
    name: "Daily Quick Practice",
    description: "15-minute daily maintenance routine",
    category: "beginner",
    duration: 15,
    steps: [
      {
        id: "daily-1",
        type: "scale",
        title: "Open Strings",
        description: "Warm up with open strings",
        duration: 60,
        parameters: { scale: "open-strings", tempo: 60 },
      },
      {
        id: "daily-2",
        type: "scale",
        title: "One Scale",
        description: "Practice one scale of your choice",
        duration: 240,
        parameters: { pattern: "both", tempo: 60 },
      },
      {
        id: "daily-3",
        type: "interval",
        title: "Interval Review",
        description: "Quick interval practice",
        duration: 180,
        parameters: { mode: "practice" },
      },
      {
        id: "daily-4",
        type: "scale",
        title: "Arpeggios",
        description: "Practice basic arpeggios",
        duration: 180,
        parameters: { pattern: "arpeggio", tempo: 60 },
      },
      {
        id: "daily-5",
        type: "rest",
        title: "Finish",
        description: "Good job! Take a break.",
        duration: 60,
      },
    ],
  },
];

export interface RoutineProgress {
  routineId: string;
  completedSteps: string[];
  currentStepIndex: number;
  startTime: number;
  completedRoutines: number;
  totalPracticeTime: number; // in minutes
}

export function getRoutineById(id: string): PracticeRoutine | undefined {
  return PRACTICE_ROUTINES.find(r => r.id === id);
}

export function getRoutinesByCategory(category: PracticeRoutine["category"]): PracticeRoutine[] {
  return PRACTICE_ROUTINES.filter(r => r.category === category);
}

export function startRoutine(routineId: string): RoutineProgress {
  return {
    routineId,
    completedSteps: [],
    currentStepIndex: 0,
    startTime: Date.now(),
    completedRoutines: 0,
    totalPracticeTime: 0,
  };
}

export function advanceStep(progress: RoutineProgress, stepId: string): RoutineProgress {
  return {
    ...progress,
    completedSteps: [...progress.completedSteps, stepId],
    currentStepIndex: progress.currentStepIndex + 1,
  };
}

export function completeRoutine(progress: RoutineProgress): RoutineProgress {
  const duration = (Date.now() - progress.startTime) / 1000 / 60; // in minutes
  return {
    ...progress,
    completedRoutines: progress.completedRoutines + 1,
    totalPracticeTime: progress.totalPracticeTime + duration,
  };
}