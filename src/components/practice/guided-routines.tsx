import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, RotateCcw, Clock, CheckCircle, Circle } from "lucide-react";
import {
  PRACTICE_ROUTINES,
  getRoutinesByCategory,
  type PracticeRoutine,
  type RoutineProgress,
  advanceStep,
  completeRoutine,
} from "@/lib/practice/guided-routines";

export function GuidedRoutines() {
  const [selectedRoutine, setSelectedRoutine] = useState<PracticeRoutine | null>(null);
  const [progress, setProgress] = useState<RoutineProgress | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<PracticeRoutine["category"] | "all">("all");

  // Timer for current step
  useEffect(() => {
    let interval: number;
    
    if (isPlaying && progress && selectedRoutine && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Step completed
            handleStepComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, progress, selectedRoutine, timeRemaining]);

  const beginRoutine = useCallback((routine: PracticeRoutine) => {
    setSelectedRoutine(routine);
    const newProgress = {
      routineId: routine.id,
      completedSteps: [],
      currentStepIndex: 0,
      startTime: Date.now(),
      completedRoutines: 0,
      totalPracticeTime: 0,
    };
    setProgress(newProgress);
    setTimeRemaining(routine.steps[0].duration);
    setIsPlaying(true);
  }, []);

  const handleStepComplete = useCallback(() => {
    if (!progress || !selectedRoutine) return;
    
    const currentStep = selectedRoutine.steps[progress.currentStepIndex];
    const newProgress = advanceStep(progress, currentStep.id);
    
    if (newProgress.currentStepIndex >= selectedRoutine.steps.length) {
      // Routine completed
      const completedProgress = completeRoutine(newProgress);
      setProgress(completedProgress);
      setIsPlaying(false);
      setTimeRemaining(0);
    } else {
      setProgress(newProgress);
      setTimeRemaining(selectedRoutine.steps[newProgress.currentStepIndex].duration);
    }
  }, [progress, selectedRoutine]);

  const skipStep = useCallback(() => {
    if (!progress || !selectedRoutine) return;
    handleStepComplete();
  }, [progress, selectedRoutine, handleStepComplete]);

  const pauseResume = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const resetRoutine = useCallback(() => {
    setProgress(null);
    setIsPlaying(false);
    setTimeRemaining(0);
  }, []);

  const filterRoutines = useCallback(() => {
    if (selectedCategory === "all") return PRACTICE_ROUTINES;
    return getRoutinesByCategory(selectedCategory);
  }, [selectedCategory]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStep = selectedRoutine && progress 
    ? selectedRoutine.steps[progress.currentStepIndex] 
    : null;

  const overallProgress = progress && selectedRoutine
    ? (progress.completedSteps.length / selectedRoutine.steps.length) * 100
    : 0;

  if (selectedRoutine && progress) {
    return (
      <div className="flex flex-col gap-6">
        {/* Routine Progress Header */}
        <Card className="border-violin-border bg-violin-panel">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-violin-text">{selectedRoutine.name}</CardTitle>
                <CardDescription className="text-violin-muted">
                  {selectedRoutine.description}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-violin-text">
                {selectedRoutine.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Overall Progress */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-violin-muted">Overall Progress</span>
                  <span className="text-cyan-300">
                    {progress.completedSteps.length} / {selectedRoutine.steps.length} steps
                  </span>
                </div>
                <Progress value={overallProgress} />
              </div>

              {/* Time Information */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-violin-muted">
                  <Clock className="h-4 w-4" />
                  <span>Step Time</span>
                </div>
                <span className="text-2xl font-bold text-cyan-300">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Step */}
        {currentStep && (
          <Card className="border-violin-border bg-violin-panel">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-violin-text">
                    Step {progress.currentStepIndex + 1}: {currentStep.title}
                  </CardTitle>
                  <CardDescription className="text-violin-muted">
                    {currentStep.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-violin-text">
                  {currentStep.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step-specific instructions */}
              <div className="rounded-lg border border-cyan-400/30 bg-[#0b1020] p-6">
                <div className="mb-4 text-sm font-medium text-violin-text">Instructions</div>
                <div className="space-y-2 text-sm text-slate-300">
                  {currentStep.type === "scale" && (
                    <>
                      <p>• Focus on even tone and rhythm</p>
                      <p>• Use proper bow/plucking technique</p>
                      <p>• Maintain relaxed posture</p>
                    </>
                  )}
                  {currentStep.type === "interval" && (
                    <>
                      <p>• Listen carefully to each interval</p>
                      <p>• Try to sing or hum the interval</p>
                      <p>• Focus on the quality of the sound</p>
                    </>
                  )}
                  {currentStep.type === "rest" && (
                    <>
                      <p>• Shake out your hands and arms</p>
                      <p>• Relax your shoulders and neck</p>
                      <p>• Take deep breaths</p>
                      <p>• Stay hydrated</p>
                    </>
                  )}
                </div>
              </div>

              {/* Step Progress */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-violin-muted">Step Progress</span>
                  <span className="text-cyan-300">
                    {formatTime(currentStep.duration - timeRemaining)} / {formatTime(currentStep.duration)}
                  </span>
                </div>
                <Progress 
                  value={((currentStep.duration - timeRemaining) / currentStep.duration) * 100}
                  className="h-2"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {!isPlaying ? (
                  <Button
                    size="lg"
                    onClick={pauseResume}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Resume
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
                  onClick={skipStep}
                  variant="outline"
                >
                  <SkipForward className="mr-2 h-5 w-5" />
                  Skip Step
                </Button>
                
                <Button
                  size="lg"
                  onClick={resetRoutine}
                  variant="ghost"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step List */}
        <Card className="border-violin-border bg-violin-panel">
          <CardHeader>
            <CardTitle className="text-violin-text">Routine Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedRoutine.steps.map((step, index) => {
                const isCompleted = progress.completedSteps.includes(step.id);
                const isCurrent = index === progress.currentStepIndex;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      isCurrent
                        ? "border-cyan-400/50 bg-cyan-500/10"
                        : isCompleted
                        ? "border-emerald-400/30 bg-emerald-500/5"
                        : "border-cyan-400/20 bg-[#0b1020]"
                    }`}
                  >
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : isCurrent ? (
                        <Circle className="h-5 w-5 text-cyan-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-violin-text">{step.title}</div>
                      <div className="text-xs text-violin-muted">{step.description}</div>
                    </div>
                    <div className="text-sm text-cyan-300">{formatTime(step.duration)}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Completion Message */}
        {progress.currentStepIndex >= selectedRoutine.steps.length && (
          <Card className="border-emerald-400/50 bg-emerald-500/10">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-400" />
              <h3 className="mb-2 text-2xl font-bold text-emerald-300">Routine Complete!</h3>
              <p className="mb-4 text-emerald-200">
                Great job! You've completed the {selectedRoutine.name} routine.
              </p>
              <Button
                onClick={resetRoutine}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Choose Another Routine
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Routine Selection View
  return (
    <div className="flex flex-col gap-6">
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text">Guided Practice Routines</CardTitle>
          <CardDescription className="text-violin-muted">
            Structured practice sessions with step-by-step guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
            >
              All Routines
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "warmup" ? "default" : "outline"}
              onClick={() => setSelectedCategory("warmup")}
            >
              Warm-up
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "beginner" ? "default" : "outline"}
              onClick={() => setSelectedCategory("beginner")}
            >
              Beginner
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "intermediate" ? "default" : "outline"}
              onClick={() => setSelectedCategory("intermediate")}
            >
              Intermediate
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "advanced" ? "default" : "outline"}
              onClick={() => setSelectedCategory("advanced")}
            >
              Advanced
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Routine Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {filterRoutines().map((routine) => (
          <Card
            key={routine.id}
            className="border-violin-border bg-violin-panel transition-colors hover:border-cyan-400/50"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-violin-text">{routine.name}</CardTitle>
                  <CardDescription className="text-violin-muted">
                    {routine.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-violin-text">
                  {routine.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-violin-muted">
                  <Clock className="h-4 w-4" />
                  <span>{routine.duration} minutes</span>
                </div>
                <div className="text-cyan-300">{routine.steps.length} steps</div>
              </div>
              
              <div className="mb-4 space-y-1">
                {routine.steps.slice(0, 3).map((step) => (
                  <div key={step.id} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span>{step.title}</span>
                  </div>
                ))}
                {routine.steps.length > 3 && (
                  <div className="text-xs text-slate-500">
                    +{routine.steps.length - 3} more steps
                  </div>
                )}
              </div>

              <Button
                onClick={() => beginRoutine(routine)}
                className="w-full bg-primary hover:bg-primary-hover"
              >
                Start Routine
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}