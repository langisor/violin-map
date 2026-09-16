import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Clock, Target, Zap, Music, CheckCircle } from "lucide-react";
import {
  VIBRATO_EXERCISES,
  getBeginnerExercises,
  getIntermediateExercises,
  getAdvancedExercises,
  startVibratoSession,
  completeVibratoSession,
  updateVibratoStats,
  getNextRecommendedExercise,
  type VibratoExercise,
  type VibratoSession,
  type VibratoStats,
} from "@/lib/practice/vibrato-theory";

export function VibratoPractice() {
  const [selectedExercise, setSelectedExercise] = useState<VibratoExercise | null>(null);
  const [session, setSession] = useState<VibratoSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"beginner" | "intermediate" | "advanced" | "all">("all");
  const [showCompletion, setShowCompletion] = useState(false);
  const [stats, setStats] = useState<VibratoStats>({
    totalSessions: 0,
    completedExercises: {},
    totalPracticeTime: 0,
    averageSessionDuration: 0,
    preferredSpeed: {},
    preferredAmplitude: {},
  });

  // Timer for exercise
  useEffect(() => {
    let interval: number;
    
    if (isPlaying && session && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, session, timeRemaining]);

  const startExercise = useCallback((exercise: VibratoExercise) => {
    setSelectedExercise(exercise);
    const newSession = startVibratoSession(exercise.id);
    setSession(newSession);
    setTimeRemaining(exercise.duration);
    setIsPlaying(true);
    setShowCompletion(false);
  }, []);

  const completeSession = useCallback(() => {
    if (!session || !selectedExercise) return;
    
    const completedSession = completeVibratoSession(session, []);
    setSession(completedSession);
    setIsPlaying(false);
    setShowCompletion(true);
    
    setStats(prev => updateVibratoStats(prev, completedSession, selectedExercise));
  }, [session, selectedExercise]);

  const pauseResume = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const resetExercise = useCallback(() => {
    setSession(null);
    setIsPlaying(false);
    setTimeRemaining(0);
    setShowCompletion(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getExercises = useCallback(() => {
    switch (selectedDifficulty) {
      case "beginner":
        return getBeginnerExercises();
      case "intermediate":
        return getIntermediateExercises();
      case "advanced":
        return getAdvancedExercises();
      default:
        return VIBRATO_EXERCISES;
    }
  }, [selectedDifficulty]);

  const recommendedExercise = getNextRecommendedExercise(stats.completedExercises);

  if (selectedExercise && session) {
    return (
      <div className="flex flex-col gap-6">
        {/* Exercise Progress Header */}
        <Card className="border-violin-border bg-violin-panel">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-violin-text">{selectedExercise.name}</CardTitle>
                <CardDescription className="text-violin-muted">
                  {selectedExercise.description}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-violin-text">
                {selectedExercise.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Timer Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-violin-muted">
                  <Clock className="h-4 w-4" />
                  <span>Time Remaining</span>
                </div>
                <span className="text-4xl font-bold text-cyan-300">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <Progress 
                  value={((selectedExercise.duration - timeRemaining) / selectedExercise.duration) * 100}
                  className="h-3"
                />
                <div className="mt-1 text-xs text-violin-muted">
                  {Math.round(((selectedExercise.duration - timeRemaining) / selectedExercise.duration) * 100)}% complete
                </div>
              </div>

              {/* Speed and Amplitude Indicators */}
              <div className="flex items-center justify-around rounded-lg border border-cyan-400/20 bg-[#0b1020] p-4">
                <div className="text-center">
                  <div className="mb-1 text-xs text-violin-muted">Speed</div>
                  <Badge variant="outline" className="text-cyan-300">
                    {selectedExercise.speed}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-xs text-violin-muted">Amplitude</div>
                  <Badge variant="outline" className="text-cyan-300">
                    {selectedExercise.amplitude}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Instructions */}
        <Card className="border-violin-border bg-violin-panel">
          <CardHeader>
            <CardTitle className="text-violin-text flex items-center gap-2">
              <Target className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedExercise.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-medium text-cyan-300">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-300">{instruction}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Focus Areas */}
        <Card className="border-amber-400/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-amber-200 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedExercise.focusAreas.map((area, index) => (
                <Badge key={index} variant="outline" className="text-amber-300">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isPlaying ? (
            <Button
              size="lg"
              onClick={pauseResume}
              disabled={showCompletion}
              className="bg-primary hover:bg-primary-hover"
            >
              <Play className="mr-2 h-5 w-5" />
              {showCompletion ? "Completed" : "Resume"}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={pauseResume}
              variant="outline"
            >
              <Pause className="mr-2 h-5 w-5" />
              Pause
            </Button>
          )}
          
          <Button
            size="lg"
            onClick={resetExercise}
            variant="ghost"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset
          </Button>
        </div>

        {/* Completion Message */}
        {showCompletion && (
          <Card className="border-emerald-400/50 bg-emerald-500/10">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-400" />
              <h3 className="mb-2 text-2xl font-bold text-emerald-300">Exercise Complete!</h3>
              <p className="mb-4 text-emerald-200">
                Great job! You've completed the {selectedExercise.name} exercise.
              </p>
              <Button
                onClick={resetExercise}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Choose Another Exercise
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Exercise Selection View
  return (
    <div className="flex flex-col gap-6">
      {/* Stats Overview */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-violin-text">{stats.totalSessions}</div>
              <div className="text-xs text-violin-muted">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-violin-text">{Math.round(stats.totalPracticeTime)}m</div>
              <div className="text-xs text-violin-muted">Practice Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Exercise */}
      {recommendedExercise && (
        <Card className="border-emerald-400/50 bg-emerald-500/10">
          <CardHeader>
            <CardTitle className="text-emerald-300 flex items-center gap-2">
              <Music className="h-5 w-5" />
              Recommended Exercise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-lg font-semibold text-emerald-200">{recommendedExercise.name}</div>
              <div className="text-sm text-emerald-300">{recommendedExercise.description}</div>
            </div>
            <Button
              onClick={() => startExercise(recommendedExercise)}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
            >
              Start Recommended Exercise
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Difficulty Filter */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text">Vibrato Exercises</CardTitle>
          <CardDescription className="text-violin-muted">
            Progressive exercises to develop your vibrato technique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedDifficulty === "all" ? "default" : "outline"}
              onClick={() => setSelectedDifficulty("all")}
            >
              All Exercises
            </Button>
            <Button
              size="sm"
              variant={selectedDifficulty === "beginner" ? "default" : "outline"}
              onClick={() => setSelectedDifficulty("beginner")}
            >
              Beginner
            </Button>
            <Button
              size="sm"
              variant={selectedDifficulty === "intermediate" ? "default" : "outline"}
              onClick={() => setSelectedDifficulty("intermediate")}
            >
              Intermediate
            </Button>
            <Button
              size="sm"
              variant={selectedDifficulty === "advanced" ? "default" : "outline"}
              onClick={() => setSelectedDifficulty("advanced")}
            >
              Advanced
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {getExercises().map((exercise) => (
          <Card
            key={exercise.id}
            className="border-violin-border bg-violin-panel transition-colors hover:border-cyan-400/50"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-violin-text">{exercise.name}</CardTitle>
                  <CardDescription className="text-violin-muted">
                    {exercise.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-violin-text">
                  {exercise.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-violin-muted">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(exercise.duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-cyan-300">
                    {exercise.speed}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-cyan-300">
                    {exercise.amplitude}
                  </Badge>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="mb-2 text-xs font-medium text-violin-text">Focus Areas</div>
                <div className="flex flex-wrap gap-1">
                  {exercise.focusAreas.slice(0, 2).map((area, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                  {exercise.focusAreas.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{exercise.focusAreas.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                onClick={() => startExercise(exercise)}
                className="w-full bg-primary hover:bg-primary-hover"
              >
                Start Exercise
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}