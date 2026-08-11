import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Note } from "tonal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  WESTERN_KEYS,
  westernScale,
  type WesternScaleKind,
  type WesternScalePreset,
} from "@/lib/western-scale-theory";
import { playMaqamSequence, type SequencableAudioEngine } from "@/lib/maqam-playback";
import type { MaqamPreset } from "@/lib/maqam-theory";

interface WesternScalePanelProps<Mode extends string> {
  selectedScale: WesternScalePreset | null;
  onSelect: (scale: WesternScalePreset) => void;
  onClear: () => void;
  onPlayingFrequency?: (frequency: number | null) => void;
  engine: SequencableAudioEngine<Mode>;
  mode: Mode;
  playbackOctave?: number;
}

export function WesternScalePanel<Mode extends string>({
  selectedScale,
  onSelect,
  onClear,
  onPlayingFrequency,
  engine,
  mode,
  playbackOctave = 4,
}: WesternScalePanelProps<Mode>) {
  const [kind, setKind] = useState<WesternScaleKind>("major");
  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);
  useEffect(() => {
    stopRef.current?.();
    setIsPlaying(false);
    onPlayingFrequency?.(null);
  }, [selectedScale, mode, onPlayingFrequency]);

  const stop = () => {
    stopRef.current?.();
    setIsPlaying(false);
    onPlayingFrequency?.(null);
  };

  const play = () => {
    if (!selectedScale) return;
    const sequence = {
      ...selectedScale,
      nameEn: `${selectedScale.tonic} ${selectedScale.kind}`,
      nameAr: "",
      description: "",
      maqamWorldUrl: "",
      lowerJins: { jinsId: "", rootOffset: 0 },
    } satisfies MaqamPreset;
    const tonicFrequency = Note.freq(`${selectedScale.tonic}${playbackOctave}`) ?? 440;
    setIsPlaying(true);
    stopRef.current = playMaqamSequence(sequence, engine, mode, playbackOctave, (index) => {
      onPlayingFrequency?.(tonicFrequency * 2 ** (selectedScale.intervals[index] / 12));
    }, () => {
      setIsPlaying(false);
      onPlayingFrequency?.(null);
    });
  };

  return (
    <Card className="border-sky-900/30 bg-sky-950/10">
      <CardHeader className="pb-0">
        <h3 className="text-sm font-semibold text-sky-200">Western Scale Degree Highlighting</h3>
        <p className="text-xs text-violin-muted">Choose a scale type, then a key to highlight and play its notes.</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-violin-muted">Scale</span>
          {(["major", "minor"] as const).map((option) => (
            <Button key={option} size="sm" variant={kind === option ? "default" : "outline"} onClick={() => setKind(option)}>
              {option === "major" ? "Major" : "Natural minor"}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {WESTERN_KEYS.map((key) => {
            const scale = westernScale(key, kind);
            const isSelected = selectedScale?.id === scale.id;
            return <Button key={key} size="sm" variant={isSelected ? "default" : "outline"} onClick={() => onSelect(scale)} className={isSelected ? "bg-sky-500 text-slate-950 hover:bg-sky-400" : "border-sky-900/50 text-sky-100 hover:bg-sky-950/50"}>{key}</Button>;
          })}
          {selectedScale && <Button size="sm" variant="ghost" onClick={() => { stop(); onClear(); }} className="text-violin-muted">Clear</Button>}
        </div>
        {selectedScale && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-900/40 bg-sky-950/20 p-3 text-xs text-sky-100">
          <span><strong>{selectedScale.tonic} {selectedScale.kind === "major" ? "Major" : "Natural Minor"}</strong>: degrees 1–7, plus octave.</span>
          <Button size="sm" variant={isPlaying ? "default" : "outline"} onClick={isPlaying ? stop : play} className={isPlaying ? "bg-sky-500 text-slate-950 hover:bg-sky-400" : "border-sky-500/60 text-sky-200 hover:bg-sky-950/50"}>
            {isPlaying ? <><Square className="h-3.5 w-3.5" /> Stop</> : <><Play className="h-3.5 w-3.5" /> Play scale</>}
          </Button>
        </div>}
      </CardContent>
    </Card>
  );
}
