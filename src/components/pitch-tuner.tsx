import { useEffect, useState } from "react";
import { usePitchDetector } from "@/hooks/use-pitch-detector";
import { analyzeFrequency, type Resolution } from "@/lib/violin-theory";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function PitchTuner() {
  const { frequency, isListening, error, confidence, quality, frequencyHistory, start, stop } = usePitchDetector();
  const [resolution, setResolution] = useState<Resolution>("semitone");
  const [referenceFrequency, setReferenceFrequency] = useState(440);
  const [referenceInput, setReferenceInput] = useState("440");
  const result = frequency ? analyzeFrequency(frequency, resolution, referenceFrequency) : null;

  // Each resolution's cent window is half its step size: +/-50c for semitones, +/-25c for quarter tones.
  const centsWindow = resolution === "quarter-tone" ? 25 : 50;
  const inTuneThreshold = resolution === "quarter-tone" ? 3 : 5;

  const centsColor =
    result === null
      ? "text-violin-muted"
      : Math.abs(result.cents) <= inTuneThreshold
        ? "text-emerald-400"
        : "text-amber-400";

  useEffect(() => {
    setReferenceInput(referenceFrequency.toString());
  }, [referenceFrequency]);

  const applyReference = (value: string) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      setReferenceFrequency(Math.min(460, Math.max(420, parsed)));
    }
  };

  return (
    <Card className="border-violin-border bg-violin-panel">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-0 sm:pb-0">
        <div>
          <h2 className="text-sm font-semibold text-violin-text">Pitch Detection</h2>
          <p className="text-xs text-violin-muted">
            Play a note near the microphone to see its name, MIDI number, and frequency.
          </p>
        </div>
        <Button
          variant={isListening ? "outline" : "default"}
          onClick={isListening ? stop : start}
          className={isListening ? "" : "bg-primary hover:bg-primary-hover"}
        >
          {isListening ? "Stop" : "Start listening"}
        </Button>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-violin-muted">Resolution</span>
          <Button
            size="sm"
            variant={resolution === "semitone" ? "default" : "outline"}
            onClick={() => setResolution("semitone")}
          >
            Semitone
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={resolution === "quarter-tone" ? "default" : "outline"}
                onClick={() => setResolution("quarter-tone")}
              >
                Quarter-tone
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Snaps to the nearest 24-EDO quarter-tone step instead of the
              nearest semitone.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-violin-muted">Reference</span>
          {[440, 442].map((value) => (
            <Button key={value} size="sm" variant={referenceFrequency === value ? "default" : "outline"} onClick={() => setReferenceFrequency(value)}>
              A = {value}
            </Button>
          ))}
          <input
            aria-label="Reference pitch in hertz"
            type="number"
            min="420"
            max="460"
            step="0.1"
            value={referenceInput}
            onChange={(event) => setReferenceInput(event.target.value)}
            onBlur={() => applyReference(referenceInput)}
            onKeyDown={(event) => { if (event.key === "Enter") applyReference(referenceInput); }}
            className="h-8 w-20 rounded-md border border-violin-border bg-violin-cell px-2 text-sm text-violin-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <span className="text-xs text-violin-muted">Hz</span>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <div className="text-5xl font-bold tracking-tight text-violin-text sm:text-6xl">
            {result ? result.noteName : "—"}
          </div>

          <div className={cn("text-sm font-medium", centsColor)}>
            {quality === "none" ? "no signal" : quality === "unstable" ? `uncertain signal (${confidence}%)` : `${result?.cents && result.cents > 0 ? "+" : ""}${result?.cents ?? 0} cents`}
          </div>

          <div className="mt-2 flex h-6 items-end gap-0.5" aria-label="Recent pitch stability">
            {frequencyHistory.map((reading, index) => {
              const readingResult = analyzeFrequency(reading, resolution, referenceFrequency);
              const height = Math.max(4, Math.min(24, 24 - Math.abs(readingResult.cents) / centsWindow * 20));
              return <span key={`${reading}-${index}`} className={cn("w-1 rounded-sm", Math.abs(readingResult.cents) <= inTuneThreshold ? "bg-emerald-400" : "bg-amber-400")} style={{ height }} />;
            })}
          </div>

          <div className="mt-2 flex gap-6 text-xs text-violin-muted">
            <div>
              <div className="text-[10px] uppercase tracking-wide">MIDI</div>
              <div className="text-sm text-violin-text">{result ? result.midi : "–"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide">Frequency</div>
              <div className="text-sm text-violin-text">
                {result ? `${result.frequency.toFixed(1)} Hz` : "–"}
              </div>
            </div>
          </div>

          {/* In-tune gauge, scaled to the active resolution's cent window. */}
          <div className="relative mt-4 h-1.5 w-full max-w-64 rounded-full bg-violin-cell">
            <div className="absolute left-1/2 h-1.5 w-px -translate-x-1/2 bg-violin-border" />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-all"
              style={{
                left: `${Math.min(
                  100,
                  Math.max(0, ((result?.cents ?? 0) + centsWindow) / (centsWindow * 2) * 100)
                )}%`,
                opacity: quality === "stable" ? 1 : 0.3,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
