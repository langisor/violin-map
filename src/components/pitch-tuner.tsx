import { useState } from "react";
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
  const { frequency, isListening, error, start, stop } = usePitchDetector();
  const [resolution, setResolution] = useState<Resolution>("semitone");
  const result = frequency ? analyzeFrequency(frequency, resolution) : null;

  // Each resolution's cent window is half its step size: +/-50c for semitones, +/-25c for quarter tones.
  const centsWindow = resolution === "quarter-tone" ? 25 : 50;
  const inTuneThreshold = resolution === "quarter-tone" ? 3 : 5;

  const centsColor =
    result === null
      ? "text-violin-muted"
      : Math.abs(result.cents) <= inTuneThreshold
        ? "text-emerald-400"
        : "text-amber-400";

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

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <div className="text-5xl font-bold tracking-tight text-violin-text sm:text-6xl">
            {result ? result.noteName : "—"}
          </div>

          <div className={cn("text-sm font-medium", centsColor)}>
            {result ? `${result.cents > 0 ? "+" : ""}${result.cents} cents` : "no signal"}
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
                opacity: result ? 1 : 0.3,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
