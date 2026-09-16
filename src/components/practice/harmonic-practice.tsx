import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Play, Music, Target, Zap, Radio, CheckCircle, XCircle } from "lucide-react";
import {
  HARMONICS,
  generateHarmonicExercise,
  getHarmonicSeries,
  getBeginnerHarmonics,
  getIntermediateHarmonics,
  getAdvancedHarmonics,
  updateHarmonicStats,
  type HarmonicExercise,
  type HarmonicPracticeStats,
} from "@/lib/practice/harmonic-theory";
import { Note } from "tonal";
import { violinAudioEngine } from "@/lib/violin-audio";
import { buildStrings, TUNINGS } from "@/lib/violin-theory";

export function HarmonicPractice() {
  const [selectedHarmonic, setSelectedHarmonic] = useState(HARMONICS[0]);
  const [selectedString, setSelectedString] = useState("G3");
  const [exercise, setExercise] = useState<HarmonicExercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quality, setQuality] = useState(5);
  const [showResult, setShowResult] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"beginner" | "intermediate" | "advanced" | "all">("all");
  const [stats, setStats] = useState<HarmonicPracticeStats>({
    totalAttempts: 0,
    successfulHarmonics: 0,
    harmonicsPracticed: {},
    preferredStrings: {},
    averageQuality: 0,
  });

  const strings = buildStrings(TUNINGS[0]);

  // Generate exercise when harmonic or string changes
  useEffect(() => {
    const newExercise = generateHarmonicExercise(selectedHarmonic, selectedString);
    setExercise(newExercise);
    setQuality(5);
    setShowResult(false);
  }, [selectedHarmonic, selectedString]);

  const playHarmonic = useCallback(async () => {
    if (!exercise || isPlaying) return;
    
    setIsPlaying(true);
    
    // Play the fundamental first for reference
    const fundamentalFreq = Note.freq(exercise.stringNote) || 440;
    await violinAudioEngine.noteOn("str0", fundamentalFreq, "pluck");
    await new Promise(resolve => setTimeout(resolve, 500));
    violinAudioEngine.noteOff("str0", "pluck");
    
    // Small pause
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Play the harmonic (simulated with regular note for now)
    const harmonicFreq = Note.freq(exercise.targetNote) || 440;
    await violinAudioEngine.noteOn("str0", harmonicFreq, "pluck");
    await new Promise(resolve => setTimeout(resolve, 800));
    violinAudioEngine.noteOff("str0", "pluck");
    
    setIsPlaying(false);
  }, [exercise, isPlaying]);

  const handleQualitySubmit = useCallback(() => {
    if (!exercise) return;
    
    setStats(prev => updateHarmonicStats(
      prev,
      exercise.harmonic.id,
      exercise.stringNote,
      quality
    ));
    
    setShowResult(true);
  }, [exercise, quality]);

  const resetExercise = useCallback(() => {
    setShowResult(false);
    setQuality(5);
  }, []);

  const getHarmonics = useCallback(() => {
    switch (selectedDifficulty) {
      case "beginner":
        return getBeginnerHarmonics();
      case "intermediate":
        return getIntermediateHarmonics();
      case "advanced":
        return getAdvancedHarmonics();
      default:
        return HARMONICS;
    }
  }, [selectedDifficulty]);

  const successRate = stats.totalAttempts > 0 
    ? Math.round((stats.successfulHarmonics / stats.totalAttempts) * 100) 
    : 0;

  const harmonicSeries = exercise ? getHarmonicSeries(exercise.stringNote, 8) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Overview */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-violin-text">{successRate}%</div>
              <div className="text-xs text-violin-muted">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-violin-text">{stats.successfulHarmonics}</div>
              <div className="text-xs text-violin-muted">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-violin-text">{stats.averageQuality.toFixed(1)}</div>
              <div className="text-xs text-violin-muted">Avg Quality</div>
            </div>
          </div>
          <Progress value={successRate} className="mt-4" />
        </CardContent>
      </Card>

      {/* Harmonic Selection */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text">Harmonic Practice</CardTitle>
          <CardDescription className="text-violin-muted">
            Learn to play natural harmonics on the fingerboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Difficulty Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedDifficulty === "all" ? "default" : "outline"}
              onClick={() => setSelectedDifficulty("all")}
            >
              All Harmonics
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

          {/* String Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-violin-text">Select String</label>
            <div className="flex flex-wrap gap-2">
              {strings.map((string) => (
                <Button
                  key={string.id}
                  size="sm"
                  variant={selectedString === string.openNote ? "default" : "outline"}
                  onClick={() => setSelectedString(string.openNote)}
                >
                  {string.label} ({string.openNote})
                </Button>
              ))}
            </div>
          </div>

          {/* Harmonic Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-violin-text">Select Harmonic</label>
            <div className="grid grid-cols-2 gap-2">
              {getHarmonics().map((harmonic) => (
                <Button
                  key={harmonic.id}
                  size="sm"
                  variant={selectedHarmonic.id === harmonic.id ? "default" : "outline"}
                  onClick={() => setSelectedHarmonic(harmonic)}
                  className="justify-start"
                >
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4" />
                    <span>{harmonic.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Display */}
      {exercise && (
        <Card className="border-violin-border bg-violin-panel">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-violin-text">{exercise.harmonic.name}</CardTitle>
                <CardDescription className="text-violin-muted">
                  {exercise.harmonic.description}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-violin-text">
                {exercise.harmonic.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Harmonic Information */}
            <div className="rounded-lg border border-cyan-400/30 bg-[#0b1020] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-violin-muted">
                  <Music className="h-4 w-4" />
                  <span>Harmonic Information</span>
                </div>
                <Button
                  size="sm"
                  onClick={playHarmonic}
                  disabled={isPlaying}
                  variant="outline"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isPlaying ? "Playing..." : "Play Reference"}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 text-xs text-violin-muted">Fundamental</div>
                  <div className="text-xl font-bold text-violin-text">{exercise.stringNote}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-violin-muted">Harmonic Note</div>
                  <div className="text-xl font-bold text-cyan-300">{exercise.targetNote}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-violin-muted">Position</div>
                  <div className="text-lg text-slate-300">{exercise.harmonic.position}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-violin-muted">Approx. Finger Position</div>
                  <div className="text-lg text-slate-300">{exercise.fingerPosition} semitones</div>
                </div>
              </div>
            </div>

            {/* Technique Instructions */}
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-200">
                <Target className="h-4 w-4" />
                <span>Technique</span>
              </div>
              <p className="text-sm text-amber-100">{exercise.technique}</p>
            </div>

            {/* Harmonic Series Visualization */}
            <div className="rounded-lg border border-cyan-400/20 bg-[#05070b] p-4">
              <div className="mb-3 text-sm font-medium text-violin-text">Harmonic Series</div>
              <div className="flex flex-wrap gap-2">
                {harmonicSeries.map((note, index) => {
                  const isCurrentHarmonic = index + 1 === exercise.harmonic.harmonic;
                  return (
                    <Badge
                      key={index}
                      variant={isCurrentHarmonic ? "default" : "outline"}
                      className={isCurrentHarmonic ? "text-cyan-300" : "text-slate-400"}
                    >
                      {index + 1}: {note}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Quality Rating */}
            {!showResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-violin-text">Rate Your Performance</label>
                  <span className="text-cyan-300">{quality}/10</span>
                </div>
                <Slider
                  value={[quality]}
                  onValueChange={(value) => setQuality(Array.isArray(value) ? value[0] : value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-violin-muted">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
                <Button
                  onClick={handleQualitySubmit}
                  className="w-full bg-primary hover:bg-primary-hover"
                >
                  Submit Rating
                </Button>
              </div>
            )}

            {/* Result Display */}
            {showResult && (
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  {quality >= 5 ? (
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-400" />
                  )}
                  <div>
                    <div className="font-semibold text-emerald-200">
                      {quality >= 5 ? "Great job!" : "Keep practicing!"}
                    </div>
                    <div className="text-sm text-emerald-100">
                      You rated this harmonic {quality}/10
                    </div>
                  </div>
                </div>
                <Button
                  onClick={resetExercise}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Harmonic Reference */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Harmonic Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-violin-muted">
            Natural harmonics occur at specific fractions of the string length. The harmonic series follows a mathematical pattern based on integer multiples of the fundamental frequency.
          </div>
          <div className="space-y-2">
            {HARMONICS.map((harmonic) => (
              <div
                key={harmonic.id}
                className="flex items-center justify-between rounded border border-cyan-400/20 bg-[#0b1020] px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {harmonic.harmonic}x
                  </Badge>
                  <span className="font-medium text-violin-text">{harmonic.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{harmonic.position}</span>
                  <Badge variant="outline" className="text-xs">
                    {harmonic.difficulty}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}