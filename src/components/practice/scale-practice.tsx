import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Music, Clock, Target } from "lucide-react";
import {
  generateScaleExercise,
  type ScalePattern,
  type ScaleExercise,
  type ScalePracticeStats,
  updateScaleStats,
  SCALE_PATTERNS,
  getScaleNotesString,
  calculateScaleDuration,
} from "@/lib/practice/scale-practice";
import { westernScale, WESTERN_KEYS } from "@/lib/western-scale-theory";
import { MAQAMAT } from "@/lib/maqam-theory";
import { Note } from "tonal";
import { violinAudioEngine } from "@/lib/violin-audio";

export function ScalePractice() {
  const [scaleType, setScaleType] = useState<"western" | "maqam">("western");
  const [selectedScale, setSelectedScale] = useState<any>(westernScale("C", "major"));
  const [pattern, setPattern] = useState<ScalePattern>("ascending");
  const [tempo, setTempo] = useState(60);
  const [exercise, setExercise] = useState<ScaleExercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stats, setStats] = useState<ScalePracticeStats>({
    totalExercises: 0,
    completedExercises: 0,
    patternsPracticed: {},
    scalesPracticed: {},
    averageTempo: 0,
    practiceTime: 0,
  });

  // Generate exercise when scale, pattern, or tempo changes
  useEffect(() => {
    const newExercise = generateScaleExercise(
      selectedScale,
      pattern,
      scaleType,
      3 // start octave
    );
    newExercise.tempo = tempo;
    setExercise(newExercise);
    setCurrentNoteIndex(0);
    setIsCompleted(false);
  }, [selectedScale, pattern, scaleType, tempo]);

  const playScale = useCallback(async () => {
    if (!exercise || isPlaying) return;
    
    setIsPlaying(true);
    setCurrentNoteIndex(0);
    
    const noteDuration = (60 / tempo) * 1000 * 0.5; // eighth notes
    
    for (let i = 0; i < exercise.notes.length; i++) {
      if (!isPlaying) break;
      
      setCurrentNoteIndex(i);
      const note = exercise.notes[i];
      const frequency = Note.freq(`${note.note}${note.octave}`) || 440;
      
      await violinAudioEngine.noteOn("str0", frequency, "pluck");
      await new Promise(resolve => setTimeout(resolve, noteDuration));
      violinAudioEngine.noteOff("str0", "pluck");
      
      // Small pause between notes
      await new Promise(resolve => setTimeout(resolve, noteDuration * 0.2));
    }
    
    setIsPlaying(false);
    setIsCompleted(true);
    setStats(prev => updateScaleStats(
      prev,
      exercise.scale.id,
      pattern,
      tempo,
      true
    ));
  }, [exercise, isPlaying, tempo, pattern]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    violinAudioEngine.noteOff("str0", "pluck");
  }, []);

  const resetExercise = useCallback(() => {
    setCurrentNoteIndex(0);
    setIsCompleted(false);
  }, []);

  const completionRate = stats.totalExercises > 0 
    ? Math.round((stats.completedExercises / stats.totalExercises) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Scale Selection */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text">Scale Practice</CardTitle>
          <CardDescription className="text-violin-muted">
            Practice scales in various patterns to build fingerboard familiarity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scale Type Selection */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={scaleType === "western" ? "default" : "outline"}
              onClick={() => setScaleType("western")}
            >
              Western Scales
            </Button>
            <Button
              size="sm"
              variant={scaleType === "maqam" ? "default" : "outline"}
              onClick={() => setScaleType("maqam")}
            >
              Maqamat
            </Button>
          </div>

          {/* Scale Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-violin-text">Select Scale</label>
            <div className="flex flex-wrap gap-2">
              {scaleType === "western" ? (
                <>
                  {WESTERN_KEYS.map((key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={selectedScale.tonic === key ? "default" : "outline"}
                      onClick={() => setSelectedScale(westernScale(key, "major"))}
                    >
                      {key} Major
                    </Button>
                  ))}
                  {WESTERN_KEYS.map((key) => (
                    <Button
                      key={`${key}-minor`}
                      size="sm"
                      variant={selectedScale.tonic === key && selectedScale.kind === "minor" ? "default" : "outline"}
                      onClick={() => setSelectedScale(westernScale(key, "minor"))}
                    >
                      {key} Minor
                    </Button>
                  ))}
                </>
              ) : (
                MAQAMAT.map((maqam) => (
                  <Button
                    key={maqam.id}
                    size="sm"
                    variant={selectedScale.id === maqam.id ? "default" : "outline"}
                    onClick={() => setSelectedScale(maqam)}
                  >
                    {maqam.nameEn}
                  </Button>
                ))
              )}
            </div>
          </div>

          {/* Pattern Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-violin-text">Practice Pattern</label>
            <div className="flex flex-wrap gap-2">
              {SCALE_PATTERNS.map((patternPreset) => (
                <Button
                  key={patternPreset.id}
                  size="sm"
                  variant={pattern === patternPreset.id ? "default" : "outline"}
                  onClick={() => setPattern(patternPreset.id)}
                >
                  {patternPreset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Tempo Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-violin-text">Tempo</label>
              <span className="text-sm text-cyan-300">{tempo} BPM</span>
            </div>
            <Slider
              value={[tempo]}
              onValueChange={(value) => setTempo(Array.isArray(value) ? value[0] : value)}
              min={40}
              max={120}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <Card className="border-violin-border bg-violin-panel">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violin-text">{completionRate}%</div>
                <div className="text-xs text-violin-muted">Completion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violin-text">{stats.completedExercises}</div>
                <div className="text-xs text-violin-muted">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violin-text">{Math.round(stats.averageTempo)}</div>
                <div className="text-xs text-violin-muted">Avg Tempo</div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setStats({
              totalExercises: 0,
              completedExercises: 0,
              patternsPracticed: {},
              scalesPracticed: {},
              averageTempo: 0,
              practiceTime: 0,
            })}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Stats
            </Button>
          </div>
          <Progress value={completionRate} className="mt-4" />
        </CardContent>
      </Card>

      {/* Exercise Display */}
      {exercise && (
        <Card className="border-violin-border bg-violin-panel">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-violin-text">
                  {scaleType === "western" 
                    ? `${exercise.scale.tonic} ${(exercise.scale as any).kind === "major" ? "Major" : "Minor"}`
                    : (exercise.scale as any).nameEn}
                </CardTitle>
                <CardDescription className="text-violin-muted">
                  {SCALE_PATTERNS.find(p => p.id === pattern)?.description}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-violin-text">
                {SCALE_PATTERNS.find(p => p.id === pattern)?.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scale Notes Display */}
            <div className="rounded-lg border border-cyan-400/30 bg-[#0b1020] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-violin-muted">
                  <Music className="h-4 w-4" />
                  <span>Scale Notes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-violin-muted">
                  <Clock className="h-4 w-4" />
                  <span>~{Math.round(calculateScaleDuration(exercise))}s</span>
                </div>
              </div>
              
              <div className="mb-4 text-lg font-mono text-cyan-300">
                {getScaleNotesString(exercise)}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <Progress 
                  value={(currentNoteIndex / exercise.notes.length) * 100} 
                  className="h-2"
                />
                <div className="mt-1 text-xs text-violin-muted">
                  Note {currentNoteIndex + 1} of {exercise.notes.length}
                </div>
              </div>

              {/* Current Note Highlight */}
              {exercise.notes[currentNoteIndex] && (
                <div className="rounded-lg border border-cyan-400/50 bg-cyan-500/10 p-4 text-center">
                  <div className="text-sm text-violin-muted">Current Note</div>
                  <div className="text-4xl font-bold text-cyan-300">
                    {exercise.notes[currentNoteIndex].note}
                    <span className="text-2xl text-cyan-200">
                      {exercise.notes[currentNoteIndex].octave}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isPlaying ? (
                <Button
                  size="lg"
                  onClick={playScale}
                  disabled={isCompleted}
                  className="bg-primary hover:bg-primary-hover"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {isCompleted ? "Completed" : "Play Scale"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={stopPlayback}
                  variant="outline"
                >
                  <Pause className="mr-2 h-5 w-5" />
                  Stop
                </Button>
              )}
              
              <Button
                size="lg"
                onClick={resetExercise}
                variant="outline"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>

            {/* Practice Tips */}
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <Target className="mt-1 h-5 w-5 text-amber-400" />
                <div className="space-y-2 text-sm text-amber-200">
                  <div className="font-semibold">Practice Tips</div>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Start slow (40-60 BPM) and gradually increase tempo</li>
                    <li>Focus on even tone and rhythm between notes</li>
                    <li>Use a metronome once you're comfortable with the pattern</li>
                    <li>Practice each pattern until it feels automatic</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}