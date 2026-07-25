import { usePitchDetector } from "@/hooks/use-pitch-detection";
import { analyzeFrequency } from "@/lib/violin-theory";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PitchTuner() {
  const { frequency, isListening, error, start, stop } = usePitchDetector();
  const result = frequency ? analyzeFrequency(frequency) : null;

  // Green near the target, amber toward the edges of the +/-50 cent window.
  const centsColor =
    result === null
      ? "text-violin-muted"
      : Math.abs(result.cents) <= 5
        ? "text-emerald-400"
        : "text-amber-400";

  return (
    <div className="rounded-2xl border border-violin-border bg-gradient-to-b from-violin-panel-2 to-violin-bg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-violin-text">Pitch detection</h2>
          <p className="text-xs text-violin-muted">
            Play a note near the microphone to see its name, MIDI number, and frequency.
          </p>
        </div>
        <Button variant={isListening ? "outline" : "default"} onClick={isListening ? stop : start}>
          {isListening ? "Stop" : "Start listening"}
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <div className="text-6xl font-bold tracking-tight text-violin-text">
          {result ? result.noteName : "—"}
        </div>

        <div
          className={cn(
            "text-sm font-medium",
            centsColor
          )}
        >
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

        {/* Simple in-tune gauge across the +/-50 cent window. */}
        <div className="relative mt-4 h-1.5 w-64 rounded-full bg-violin-cell">
          <div className="absolute left-1/2 h-1.5 w-px -translate-x-1/2 bg-violin-border" />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violin-e transition-all"
            style={{
              left: `${Math.min(100, Math.max(0, ((result?.cents ?? 0) + 50) / 100 * 100))}%`,
              opacity: result ? 1 : 0.3,
            }}
          />
        </div>
      </div>
    </div>
  );
}
