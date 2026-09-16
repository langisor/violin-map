import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Check, X, RotateCcw, Target } from "lucide-react";
import {
  generateIntervalExercise,
  type IntervalExercise,
  type IntervalExerciseMode,
  type IntervalPracticeStats,
  updateIntervalStats,
  INTERVALS,
} from "@/lib/practice/interval-theory";
import { Note } from "tonal";
import { violinAudioEngine } from "@/lib/violin-audio";

export function IntervalTraining() {
  const [mode, setMode] = useState<IntervalExerciseMode>("identify");
  const [exercise, setExercise] = useState<IntervalExercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState<IntervalPracticeStats>({
    totalAttempts: 0,
    correctAnswers: 0,
    intervalsAttempted: {},
    intervalsCorrect: {},
    streak: 0,
    bestStreak: 0,
  });
  const [previousIntervals, setPreviousIntervals] = useState<any[]>([]);

  const generateNewExercise = useCallback(() => {
    const newExercise = generateIntervalExercise(mode, previousIntervals);
    setExercise(newExercise);
    setSelectedAnswer(null);
    setShowResult(false);
    setPreviousIntervals(prev => [...prev.slice(-2), newExercise.interval]);
  }, [mode, previousIntervals]);

  useEffect(() => {
    generateNewExercise();
  // }, [generateNewExercise]);
  }, [mode]); // Regenerate exercise when mode changes

  const playInterval = useCallback(async () => {
    if (!exercise) {
      console.log("No exercise available to play.");
      return;
    }
    
    setIsPlaying(true);
    
    // Play root note
    await violinAudioEngine.noteOn("str0", Note.freq(exercise.rootNote) || 440, "pluck");
    await new Promise(resolve => setTimeout(resolve, 500));
    violinAudioEngine.noteOff("str0", "pluck");
    
    // Small pause
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Play target note
    await violinAudioEngine.noteOn("str0", Note.freq(exercise.targetNote) || 440, "pluck");
    await new Promise(resolve => setTimeout(resolve, 500));
    violinAudioEngine.noteOff("str0", "pluck");
    
    setIsPlaying(false);
  }, [exercise]);

  const handleAnswer = useCallback((answer: string) => {
    if (!exercise || showResult) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === exercise.correctAnswer;
    setShowResult(true);
    
    setStats(prev => updateIntervalStats(prev, exercise.interval.id, isCorrect));
  }, [exercise, showResult]);

  const handleNext = useCallback(() => {
    generateNewExercise();
  }, [generateNewExercise]);

  const resetStats = useCallback(() => {
    setStats({
      totalAttempts: 0,
      correctAnswers: 0,
      intervalsAttempted: {},
      intervalsCorrect: {},
      streak: 0,
      bestStreak: 0,
    });
  }, []);

  const accuracy = stats.totalAttempts > 0 
    ? Math.round((stats.correctAnswers / stats.totalAttempts) * 100) 
    : 0;

  if (!exercise) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Selection */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text">Interval Training</CardTitle>
          <CardDescription className="text-violin-muted">
            Train your ear to identify and play musical intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={mode === "identify" ? "default" : "outline"}
              onClick={() => setMode("identify")}
            >
              Identify (Beginner)
            </Button>
            <Button
              size="sm"
              variant={mode === "practice" ? "default" : "outline"}
              onClick={() => setMode("practice")}
            >
              Practice (Intermediate)
            </Button>
            <Button
              size="sm"
              variant={mode === "challenge" ? "default" : "outline"}
              onClick={() => setMode("challenge")}
            >
              Challenge (Advanced)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <Card className="border-violin-border bg-violin-panel">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violin-text">{accuracy}%</div>
                <div className="text-xs text-violin-muted">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violin-text">{stats.streak}</div>
                <div className="text-xs text-violin-muted">Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violin-text">{stats.bestStreak}</div>
                <div className="text-xs text-violin-muted">Best Streak</div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={resetStats}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Stats
            </Button>
          </div>
          <Progress value={accuracy} className="mt-4" />
        </CardContent>
      </Card>

      {/* Exercise Card */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-violin-text">
                {mode === "identify" ? "Identify the Interval" : 
                 mode === "practice" ? "Practice the Interval" : 
                 "Challenge Mode"}
              </CardTitle>
              <CardDescription className="text-violin-muted">
                {mode === "identify" ? "Listen to the interval and identify it by name" :
                 mode === "practice" ? "Practice playing the displayed interval" :
                 "Test your skills with mixed intervals"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-violin-text">
              {exercise.interval.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interval Display */}
          <div className="rounded-lg border border-cyan-400/30 bg-[#0b1020] p-6 text-center">
            <div className="mb-4 text-sm text-violin-muted">
              {mode === "identify" ? "Press Play to hear the interval" : "Play this interval on your instrument"}
            </div>
            
            {mode === "identify" ? (
              <div className="mb-4">
                <Button
                  size="lg"
                  onClick={playInterval}
                  disabled={isPlaying}
                  className="bg-primary hover:bg-primary-hover"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {isPlaying ? "Playing..." : "Play Interval"}
                </Button>
              </div>
            ) : (
              <div className="mb-4 space-y-2">
                <div className="text-3xl font-bold text-violin-text">
                  {exercise.rootNote} → {exercise.targetNote}
                </div>
                <div className="text-lg text-cyan-300">
                  {exercise.interval.name} ({exercise.interval.symbol})
                </div>
                <div className="text-sm text-violin-muted">
                  {exercise.interval.description}
                </div>
              </div>
            )}

            {showResult && (
              <div className={`mt-4 flex items-center justify-center gap-2 ${
                selectedAnswer === exercise.correctAnswer ? "text-emerald-400" : "text-red-400"
              }`}>
                {selectedAnswer === exercise.correctAnswer ? (
                  <>
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">Correct!</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5" />
                    <span className="font-semibold">
                      Incorrect. The answer was {exercise.correctAnswer}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-3">
            {exercise.answerOptions.map((option) => (
              <Button
                key={option}
                size="lg"
                variant={
                  showResult
                    ? option === exercise.correctAnswer
                      ? "default"
                      : option === selectedAnswer
                      ? "outline"
                      : "outline"
                    : selectedAnswer === option
                    ? "default"
                    : "outline"
                }
                onClick={() => handleAnswer(option)}
                disabled={showResult}
                className="h-16 text-lg"
              >
                {option}
              </Button>
            ))}
          </div>

          {/* Next Button */}
          {showResult && (
            <Button
              size="lg"
              onClick={handleNext}
              className="w-full bg-primary hover:bg-primary-hover"
            >
              Next Interval
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Interval Reference */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text flex items-center gap-2">
            <Target className="h-5 w-5" />
            Interval Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {INTERVALS.map((interval) => (
              <div
                key={interval.id}
                className="flex items-center justify-between rounded border border-cyan-400/20 bg-[#0b1020] px-3 py-2"
              >
                <span className="font-medium text-violin-text">{interval.name}</span>
                <span className="text-cyan-300">{interval.symbol}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}