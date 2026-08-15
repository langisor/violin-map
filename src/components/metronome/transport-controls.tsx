

import { useRef } from "react"
import { Minus, Pause, Play, Plus, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export const MIN_BPM = 30
export const MAX_BPM = 260

interface TransportControlsProps {
  bpm: number
  onBpmChange: (bpm: number) => void
  isPlaying: boolean
  onTogglePlay: () => void
  volume: number
  onVolumeChange: (v: number) => void
}

function tempoName(bpm: number) {
  if (bpm < 60) return "Largo"
  if (bpm < 76) return "Adagio"
  if (bpm < 108) return "Andante"
  if (bpm < 120) return "Moderato"
  if (bpm < 168) return "Allegro"
  if (bpm < 200) return "Presto"
  return "Prestissimo"
}

const clampBpm = (v: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(v)))

export function TransportControls({
  bpm,
  onBpmChange,
  isPlaying,
  onTogglePlay,
  volume,
  onVolumeChange,
}: TransportControlsProps) {
  const tapTimes = useRef<number[]>([])

  const handleTap = () => {
    const now = performance.now()
    const taps = tapTimes.current
    // Reset if the last tap was long ago.
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0
    taps.push(now)
    if (taps.length > 5) taps.shift()
    if (taps.length >= 2) {
      const intervals = taps.slice(1).map((t, i) => t - taps[i])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      onBpmChange(clampBpm(60000 / avg))
    }
  }

  const nudge = (delta: number) => onBpmChange(clampBpm(bpm + delta))

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Tempo readout */}
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium uppercase tracking-widest text-primary">{tempoName(bpm)}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-7xl font-bold tabular-nums text-foreground">{bpm}</span>
          <span className="text-lg font-medium text-muted-foreground">BPM</span>
        </div>
      </div>

      {/* BPM slider with nudge buttons */} 
      <div className="flex w-full items-center gap-3 border border-amber-400 rounded-lg">
        <Button
          className="bg-muted text-muted-foreground hover:bg-muted/90 shrink-0 rounded-full"
          size="sm"
          aria-label="Decrease tempo"
          onClick={() => nudge(-1)}
        >
          <Minus className="size-4" />
        </Button>
        <Slider
          value={[bpm]}
          min={MIN_BPM}
          max={MAX_BPM}
          step={1}
          onValueChange={(value) => onBpmChange(Array.isArray(value) ? value[0] : value)}
          aria-label="Tempo in beats per minute"
          className="flex-1 border-2"
        />
        <Button
          className="bg-muted text-muted-foreground hover:bg-muted/90 shrink-0 rounded-full"
          size="sm"
          aria-label="Increase tempo"
          onClick={() => nudge(1)}
           
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Fine adjust */}
      <div className="flex items-center gap-2">
        {[-10, -5, 5, 10].map((d) => (
          <Button key={d} className="text-muted-foreground text-white hover:bg-muted/90" size="sm" onClick={() => nudge(d)}>
            {d > 0 ? `+${d}` : d}
          </Button>
        ))}
      </div>

      {/* Play + Tap */}
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Stop metronome" : "Start metronome"}
          className={cn(
            "h-16 w-16 rounded-full text-primary-foreground shadow-lg transition-transform active:scale-95",
            isPlaying && "animate-pulse",
          )}
        >
          {isPlaying ? <Pause className="size-7" /> : <Play className="size-7 translate-x-0.5" />}
        </Button>
        <Button variant="outline" size="lg" onClick={handleTap} className="h-16 rounded-full px-8 text-base font-semibold">
          Tap
        </Button>
      </div>

      {/* Volume */}
      <div className="flex w-full max-w-xs items-center gap-3">
        <Volume2 className="size-4 shrink-0 text-muted-foreground" />
        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(value) => onVolumeChange(Array.isArray(value) ? value[0] : value)}
          aria-label="Volume"
          className="flex-1"
        />
      </div>
    </div>
  )
}
