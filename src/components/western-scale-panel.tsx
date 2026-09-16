import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Note } from "tonal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  WESTERN_KEYS,
  westernScale,
  getKeySignature,
  scaleNotesForInstrument,
  scaleStartNote,
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
  instrumentOpenNotes?: string[];
}

export function WesternScalePanel<Mode extends string>({
  selectedScale,
  onSelect,
  onClear,
  onPlayingFrequency,
  engine,
  mode,
  playbackOctave = 4,
  instrumentOpenNotes = [],
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
      nameEn: `${selectedScale.tonic} ${selectedScale.displayName}`,
      nameAr: "",
      description: selectedScale.description,
      maqamWorldUrl: "",
      lowerJins: { jinsId: "", rootOffset: 0 },
    } satisfies MaqamPreset;
    const tonicFrequency = Note.freq(`${selectedScale.tonic}${playbackOctave}`) ?? 440;
    const startNote = scaleStartNote(selectedScale, instrumentOpenNotes);
    const startOctave = startNote ? Note.get(startNote).oct ?? playbackOctave : playbackOctave;
    setIsPlaying(true);
    const startFrequency = startNote ? Note.freq(startNote) ?? tonicFrequency : tonicFrequency;
    stopRef.current = playMaqamSequence(sequence, engine, mode, startOctave, (index) => {
      onPlayingFrequency?.(startFrequency * 2 ** (selectedScale.intervals[index] / 12));
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
          {(["major", "minor", "pentatonic-major", "pentatonic-minor", "blues", "dorian", "phrygian", "lydian", "mixolydian", "locrian", "harmonic-minor", "melodic-minor"] as const).map((option) => (
            <Button key={option} size="sm" variant={kind === option ? "default" : "outline"} onClick={() => setKind(option)} className="text-[10px]">
              {option.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
          <div className="flex flex-col gap-1">
            <span><strong>{selectedScale.tonic} {selectedScale.displayName}</strong>: {selectedScale.description}</span>
            {instrumentOpenNotes.length > 0 && <span className="text-[10px] text-sky-200/80">
              Instrument start: {scaleStartNote(selectedScale, instrumentOpenNotes) ?? "No matching playable tonic"} · {scaleNotesForInstrument(selectedScale, instrumentOpenNotes).map((note) => Note.get(note).name).join(" ")}
            </span>}
            <span className="text-[10px] text-sky-200/70">
              Key Signature: {(() => {
                const keySig = getKeySignature(selectedScale.tonic, selectedScale.kind);
                if (keySig.sharps.length > 0) {
                  return `${keySig.sharps.join(", ")} (${keySig.symbol})`;
                } else if (keySig.flats.length > 0) {
                  return `${keySig.flats.join(", ")} (${keySig.symbol})`;
                } else {
                  return "No sharps or flats";
                }
              })()}
            </span>
          </div>
          <Button size="sm" variant={isPlaying ? "default" : "outline"} onClick={isPlaying ? stop : play} className={isPlaying ? "bg-sky-500 text-slate-950 hover:bg-sky-400" : "border-sky-500/60 text-sky-200 hover:bg-sky-950/50"}>
            {isPlaying ? <><Square className="h-3.5 w-3.5" /> Stop</> : <><Play className="h-3.5 w-3.5" /> Play scale</>}
          </Button>
        </div>}
      </CardContent>
    </Card>
  );
}
