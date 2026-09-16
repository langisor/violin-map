import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Check, RotateCcw, Music, HelpCircle } from "lucide-react";
import {
  DOUBLE_STOPS,
  generateDoubleStopExercise,
  generatePatternExercise,
  getDoubleStopIntonationFeedback,
  type DoubleStopExercise,
  type DoubleStopPattern,
  type DoubleStopPatternExercise,
} from "@/lib/practice/double-stop-theory";
import { Note } from "tonal";
import { violinAudioEngine } from "@/lib/violin-audio";
import { buildStrings, TUNINGS } from "@/lib/violin-theory";

export function DoubleStopPractice() {
  const [selectedDoubleStop, setSelectedDoubleStop] = useState(DOUBLE_STOPS[0]);
  const [exercise, setExercise] = useState<DoubleStopExercise | null>(null);
  const [patternExercise, setPatternExercise] = useState<DoubleStopPatternExercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [patternMode, setPatternMode] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<DoubleStopPattern>("parallel");
  const [stats, setStats] = useState({
    totalAttempts: 0,
    successfulIntonations: 0,
    doubleStopsPracticed: {} as Record<string, number>,
    successfulDoubleStops: {} as Record<string, number>,
  });

  const strings = buildStrings(TUNINGS[0]);

  const generateNewExercise = useCallback(() => {
    if (patternMode) {
      const newPatternExercise = generatePatternExercise(
        selectedPattern,
        selectedDoubleStop,
        "G3",
        strings
      );
      setPatternExercise(newPatternExercise);
      setExercise(null);
    } else {
      const newExercise = generateDoubleStopExercise(
        selectedDoubleStop,
        "practice",
        "G3",
        strings
      );
      setExercise(newExercise);
      setPatternExercise(null);
    }
    setCurrentPositionIndex(0);
    setShowResult(false);
  }, [selectedDoubleStop, patternMode, selectedPattern, strings]);

  useEffect(() => {
    generateNewExercise();
  }, [generateNewExercise]);

  const playDoubleStop = useCallback(async () => {
    if (isPlaying) return;
    
    const positions = patternMode ? patternExercise?.positions : exercise?.positions;
    if (!positions || positions.length === 0) return;

    setIsPlaying(true);
    
    for (let i = 0; i < positions.length; i++) {
      setCurrentPositionIndex(i);
      const position = positions[i];
      
      // Play both notes simultaneously
      const lowerFreq = Note.freq(position.lowerNote) || 440;
      const upperFreq = Note.freq(position.upperNote) || 440;
      
      await violinAudioEngine.noteOn(`str${position.lowerString}`, lowerFreq, "pluck");
      await violinAudioEngine.noteOn(`str${position.upperString}`, upperFreq, "pluck");
      
      // Let ring
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Stop both notes
      violinAudioEngine.noteOff(`str${position.lowerString}`, "pluck");
      violinAudioEngine.noteOff(`str${position.upperString}`, "pluck");
      
      // Brief pause between positions
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setCurrentPositionIndex(0);
    setIsPlaying(false);
  }, [isPlaying, patternMode, patternExercise, exercise]);

  const handleIntonationCheck = useCallback(() => {
    if (!exercise || currentPositionIndex >= exercise.positions.length) return;
    
    const currentPosition = exercise.positions[currentPositionIndex];
    // In a real implementation, this would compare with actual audio input
    // For now, we'll simulate the check
    const mockPlayedNotes: [string, string] = [currentPosition.lowerNote, currentPosition.upperNote];
    const targetNotes: [string, string] = [currentPosition.lowerNote, currentPosition.upperNote];
    
    const feedback = getDoubleStopIntonationFeedback(mockPlayedNotes, targetNotes);
    
    setStats(prev => {
      const newStats = { ...prev };
      newStats.totalAttempts++;
      newStats.doubleStopsPracticed[exercise.doubleStop.id] = 
        (newStats.doubleStopsPracticed[exercise.doubleStop.id] || 0) + 1;
      
      if (feedback.isIntune) {
        newStats.successfulIntonations++;
        newStats.successfulDoubleStops[exercise.doubleStop.id] = 
          (newStats.successfulDoubleStops[exercise.doubleStop.id] || 0) + 1;
      }
      
      return newStats;
    });
    
    setShowResult(true);
  }, [exercise, currentPositionIndex]);

  const handleNext = useCallback(() => {
    if (currentPositionIndex < (exercise?.positions.length || 0) - 1) {
      setCurrentPositionIndex(prev => prev + 1);
      setShowResult(false);
    } else {
      generateNewExercise();
    }
  }, [currentPositionIndex, exercise, generateNewExercise]);

  const resetStats = useCallback(() => {
    setStats({
      totalAttempts: 0,
      successfulIntonations: 0,
      doubleStopsPracticed: {},
      successfulDoubleStops: {},
    });
  }, []);

  const accuracy = stats.totalAttempts > 0 
    ? Math.round((stats.successfulIntonations / stats.totalAttempts) * 100) 
    : 0;

  const currentPositions = patternMode ? patternExercise?.positions : exercise?.positions;
  const currentPosition = currentPositions?.[currentPositionIndex];

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Selection */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text">Double-Stop Practice</CardTitle>
          <CardDescription className="text-violin-muted">
            Practice playing two notes simultaneously on different strings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={!patternMode ? "default" : "outline"}
              onClick={() => setPatternMode(false)}
            >
              Basic Practice
            </Button>
            <Button
              size="sm"
              variant={patternMode ? "default" : "outline"}
              onClick={() => setPatternMode(true)}
            >
              Pattern Exercises
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
                <div className="text-xs text-violin-muted">Intonation Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violin-text">{stats.successfulIntonations}</div>
                <div className="text-xs text-violin-muted">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violin-text">{stats.totalAttempts}</div>
                <div className="text-xs text-violin-muted">Total Attempts</div>
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

      {/* Double-Stop Selection */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text">Select Interval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {DOUBLE_STOPS.map((doubleStop) => (
              <Button
                key={doubleStop.id}
                size="sm"
                variant={selectedDoubleStop.id === doubleStop.id ? "default" : "outline"}
                onClick={() => setSelectedDoubleStop(doubleStop)}
                className="justify-start"
              >
                <span className="font-medium">{doubleStop.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {doubleStop.difficulty}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pattern Selection */}
      {patternMode && (
        <Card className="border-violin-border bg-violin-panel">
          <CardHeader>
            <CardTitle className="text-violin-text">Select Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(["parallel", "contrary", "oblique", "broken"] as DoubleStopPattern[]).map((pattern) => (
                <Button
                  key={pattern}
                  size="sm"
                  variant={selectedPattern === pattern ? "default" : "outline"}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Card */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-violin-text">
                {patternMode ? patternExercise?.description : selectedDoubleStop.name}
              </CardTitle>
              <CardDescription className="text-violin-muted">
                {selectedDoubleStop.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-violin-text">
              {selectedDoubleStop.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Position Display */}
          {currentPosition && (
            <div className="rounded-lg border border-cyan-400/30 bg-[#0b1020] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-violin-muted">
                  <Music className="h-4 w-4" />
                  <span>Position {currentPositionIndex + 1} of {currentPositions?.length}</span>
                </div>
                <Button
                  size="sm"
                  onClick={playDoubleStop}
                  disabled={isPlaying}
                  variant="outline"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isPlaying ? "Playing..." : "Play Double-Stop"}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded border border-cyan-400/20 bg-[#05070b] p-4">
                  <div className="mb-2 text-sm font-medium text-cyan-300">Lower Note</div>
                  <div className="text-2xl font-bold text-violin-text">{currentPosition.lowerNote}</div>
                  <div className="text-xs text-slate-400">
                    String {currentPosition.lowerString + 1}, Position {currentPosition.lowerStep}
                  </div>
                </div>
                <div className="rounded border border-amber-400/20 bg-amber-500/5 p-4">
                  <div className="mb-2 text-sm font-medium text-amber-300">Upper Note</div>
                  <div className="text-2xl font-bold text-violin-text">{currentPosition.upperNote}</div>
                  <div className="text-xs text-slate-400">
                    String {currentPosition.upperString + 1}, Position {currentPosition.upperStep}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded border border-purple-400/20 bg-purple-500/5 p-4">
                <div className="mb-2 text-sm font-medium text-purple-300">Interval Analysis</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Interval: {currentPosition.interval} semitones</span>
                  <span className="text-purple-300">Finger spacing: {currentPosition.fingerSpacing}</span>
                </div>
              </div>

              {!patternMode && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleIntonationCheck}
                    disabled={showResult}
                    className="flex-1"
                  >
                    Check Intonation
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={!showResult}
                    variant="outline"
                    className="flex-1"
                  >
                    {currentPositionIndex < (currentPositions?.length || 0) - 1 ? "Next Position" : "New Exercise"}
                  </Button>
                </div>
              )}

              {showResult && (
                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Good intonation! Continue to next position.</span>
                </div>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-violin-muted">Progress:</span>
            <div className="flex-1 h-2 rounded-full bg-cyan-900/30">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all"
                style={{
                  width: `${((currentPositionIndex + 1) / (currentPositions?.length || 1)) * 100}%`
                }}
              />
            </div>
            <span className="text-sm text-violin-muted">
              {currentPositionIndex + 1}/{currentPositions?.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Double-Stop Reference */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Double-Stop Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {DOUBLE_STOPS.map((doubleStop) => (
              <div
                key={doubleStop.id}
                className="flex items-center justify-between rounded border border-cyan-400/20 bg-[#0b1020] px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-violin-text">{doubleStop.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {doubleStop.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-300">{doubleStop.intervals.join("-")} semitones</span>
                  <span className="text-xs text-slate-400">{doubleStop.handPosition} position</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}