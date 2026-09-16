import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Check, RotateCcw, Music, HelpCircle, X } from "lucide-react";
import {
  generateChordOnFingerboard,
  getChordTones,
  generateChordExercise,
  type ChordExercise,
  type ChordExerciseMode,
  type ChordOnFingerboard,
  CHORDS,
  CHORD_PROGRESSIONS,
  transposeProgression,
  type ChordProgressionPreset,
} from "@/lib/practice/chord-theory";
import { Note } from "tonal";
import { violinAudioEngine } from "@/lib/violin-audio";
import { buildStrings, TUNINGS } from "@/lib/violin-theory";

export function ChordPractice() {
  const [mode, setMode] = useState<ChordExerciseMode>("identify");
  const [exercise, setExercise] = useState<ChordExercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [chordDisplay, setChordDisplay] = useState<ChordOnFingerboard | null>(null);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    correctAnswers: 0,
    chordsAttempted: {} as Record<string, number>,
    chordsCorrect: {} as Record<string, number>,
  });
  const [progressionMode, setProgressionMode] = useState(false);
  const [selectedProgression, setSelectedProgression] = useState<ChordProgressionPreset | null>(null);
  const [progressionKey, setProgressionKey] = useState("C");
  const [currentChordIndex, setCurrentChordIndex] = useState(0);

  const strings = buildStrings(TUNINGS[0]);

  const generateNewExercise = useCallback(() => {
    const newExercise = generateChordExercise(mode);
    setExercise(newExercise);
    setSelectedAnswer(null);
    setShowResult(false);

    // Generate fingerboard display
    const fingerboardChord = generateChordOnFingerboard(
      newExercise.chord,
      newExercise.root,
      strings
    );
    setChordDisplay(fingerboardChord);
  }, [mode, strings]);

  useEffect(() => {
    generateNewExercise();
  }, [generateNewExercise]);

  const playChord = useCallback(async () => {
    if (!exercise || isPlaying) return;

    setIsPlaying(true);

    // Play chord tones simultaneously (arpeggiated for clarity)
    const chordTones = getChordTones(exercise.chord, exercise.root);

    for (const note of chordTones) {
      const frequency = Note.freq(note) || 440;
      await violinAudioEngine.noteOn("str0", frequency, "pluck");
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Let ring briefly
    await new Promise(resolve => setTimeout(resolve, 500));

    // Stop all notes
    chordTones.forEach(() => {
      violinAudioEngine.noteOff("str0", "pluck");
    });

    setIsPlaying(false);
  }, [exercise, isPlaying]);

  const playProgression = useCallback(async () => {
    if (!selectedProgression || isPlaying) return;

    setIsPlaying(true);
    const progression = transposeProgression(selectedProgression, progressionKey);

    for (let i = 0; i < progression.chords.length; i++) {
      setCurrentChordIndex(i);
      const chordInKey = progression.chords[i];
      const chordTones = getChordTones(chordInKey.chordType, chordInKey.root);

      // Play chord tones
      for (const note of chordTones) {
        const frequency = Note.freq(note) || 440;
        await violinAudioEngine.noteOn("str0", frequency, "pluck");
      }

      // Let chord ring
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stop all notes
      chordTones.forEach(() => {
        violinAudioEngine.noteOff("str0", "pluck");
      });

      // Brief pause between chords
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setCurrentChordIndex(0);
    setIsPlaying(false);
  }, [selectedProgression, isPlaying, progressionKey]);

  const handleAnswer = useCallback((answer: string) => {
    if (!exercise || showResult) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === exercise.correctAnswer;
    setShowResult(true);

    setStats(prev => {
      const newStats = { ...prev };
      newStats.totalAttempts++;
      newStats.chordsAttempted[exercise.chord.id] = (newStats.chordsAttempted[exercise.chord.id] || 0) + 1;

      if (isCorrect) {
        newStats.correctAnswers++;
        newStats.chordsCorrect[exercise.chord.id] = (newStats.chordsCorrect[exercise.chord.id] || 0) + 1;
      }

      return newStats;
    });
  }, [exercise, showResult]);

  const handleNext = useCallback(() => {
    generateNewExercise();
  }, [generateNewExercise]);

  const resetStats = useCallback(() => {
    setStats({
      totalAttempts: 0,
      correctAnswers: 0,
      chordsAttempted: {},
      chordsCorrect: {},
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
          <CardTitle className="text-violin-text">Chord Practice</CardTitle>
          <CardDescription className="text-violin-muted">
            Learn to identify and play chords on the fingerboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={mode === "identify" ? "default" : "outline"}
              onClick={() => setMode("identify")}
            >
              Identify Chords
            </Button>
            <Button
              size="sm"
              variant={mode === "practice" ? "default" : "outline"}
              onClick={() => setMode("practice")}
            >
              Practice Chords
            </Button>
            <Button
              size="sm"
              variant={mode === "construct" ? "default" : "outline"}
              onClick={() => setMode("construct")}
            >
              Construct Chords
            </Button>
            <Button
              size="sm"
              variant={progressionMode ? "default" : "outline"}
              onClick={() => setProgressionMode(!progressionMode)}
            >
              Progressions
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
                <div className="text-2xl font-bold text-violin-text">{stats.correctAnswers}</div>
                <div className="text-xs text-violin-muted">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violin-text">{stats.totalAttempts}</div>
                <div className="text-xs text-violin-muted">Total</div>
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
                {mode === "identify" ? "Identify the Chord" :
                  mode === "practice" ? "Practice the Chord" :
                    "Construct the Chord"}
              </CardTitle>
              <CardDescription className="text-violin-muted">
                {mode === "identify" ? "Listen to the chord and identify it by name" :
                  mode === "practice" ? "Practice playing the displayed chord" :
                    "Construct the chord on the fingerboard"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-violin-text">
              {exercise.chord.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chord Display */}
          <div className="rounded-lg border border-cyan-400/30 bg-[#0b1020] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-violin-muted">
                <Music className="h-4 w-4" />
                <span>{mode === "identify" ? "Chord Playback" : "Chord Information"}</span>
              </div>
              {mode === "identify" && (
                <Button
                  size="sm"
                  onClick={playChord}
                  disabled={isPlaying}
                  variant="outline"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isPlaying ? "Playing..." : "Play Chord"}
                </Button>
              )}
            </div>

            {mode !== "identify" && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-violin-text">
                    {exercise.root} {exercise.chord.symbol}
                  </div>
                  <div className="text-lg text-cyan-300">
                    {exercise.chord.name}
                  </div>
                </div>

                <div className="rounded border border-cyan-400/20 bg-[#05070b] p-4">
                  <div className="mb-2 text-sm font-medium text-violin-text">Chord Tones</div>
                  <div className="flex flex-wrap gap-2">
                    {getChordTones(exercise.chord, exercise.root).map((note, index) => (
                      <Badge key={index} variant="outline" className="text-cyan-300">
                        {note}
                      </Badge>
                    ))}
                  </div>
                </div>

                {chordDisplay && (
                  <div className="rounded border border-amber-400/20 bg-amber-500/5 p-4">
                    <div className="mb-2 text-sm font-medium text-amber-200">Fingerboard Positions</div>
                    <div className="space-y-2 text-sm">
                      {chordDisplay.positions.map((pos, index) => (
                        <div key={index} className="flex items-center justify-between text-slate-300">
                          <span>String {pos.stringId}: {pos.note}</span>
                          <span className="text-cyan-300">Finger {pos.finger}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-amber-200">
                      Playability: <span className="font-semibold">{chordDisplay.playability}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {showResult && (
              <div className={`mt-4 flex items-center justify-center gap-2 ${selectedAnswer === exercise.correctAnswer ? "text-emerald-400" : "text-red-400"
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
              Next Chord
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Chord Progression Player */}
      {progressionMode && (
        <Card className="border-violin-border bg-violin-panel">
          <CardHeader>
            <CardTitle className="text-violin-text">Chord Progression Player</CardTitle>
            <CardDescription className="text-violin-muted">
              Practice common chord progressions in any key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-violin-muted">Key:</span>
              {["C", "G", "D", "A", "E", "F", "Bb", "Eb"].map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={progressionKey === key ? "default" : "outline"}
                  onClick={() => setProgressionKey(key)}
                >
                  {key}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {CHORD_PROGRESSIONS.map((progression) => (
                <div
                  key={progression.id}
                  className={`rounded-lg border p-4 cursor-pointer transition-colors ${selectedProgression?.id === progression.id
                      ? "border-amber-400/50 bg-amber-500/10"
                      : "border-cyan-400/30 bg-[#0b1020] hover:border-cyan-400/50"
                    }`}
                  onClick={() => setSelectedProgression(progression)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-violin-text">{progression.name}</div>
                      <div className="text-xs text-violin-muted">{progression.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {progression.style}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {progression.difficulty}
                      </Badge>
                    </div>
                  </div>

                  {selectedProgression?.id === progression.id && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {transposeProgression(progression, progressionKey).chords.map((chord, index) => (
                          <div
                            key={index}
                            className={`px-2 py-1 rounded text-xs ${currentChordIndex === index && isPlaying
                                ? "bg-amber-400 text-slate-950 font-semibold"
                                : "bg-cyan-400/20 text-cyan-300"
                              }`}
                          >
                            {chord.root}{chord.chordType.symbol}
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          playProgression();
                        }}
                        disabled={isPlaying}
                        className="w-full"
                      >
                        {isPlaying ? (
                          <>
                            <Music className="mr-2 h-4 w-4" />
                            Playing...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Play Progression
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chord Reference */}
      <Card className="border-violin-border bg-violin-panel">
        <CardHeader>
          <CardTitle className="text-violin-text flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Chord Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {CHORDS.map((chord) => (
              <div
                key={chord.id}
                className="flex items-center justify-between rounded border border-cyan-400/20 bg-[#0b1020] px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-violin-text">{chord.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {chord.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-300">{chord.symbol}</span>
                  <span className="text-xs text-slate-400">{chord.intervals.join("-")}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}