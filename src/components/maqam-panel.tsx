import { useEffect, useRef, useState } from "react";
import { Play, Square, ExternalLink } from "lucide-react";
import {
  MAQAMAT,
  getJins,
  type MaqamPreset,
  type JinsPlacement,
} from "@/lib/maqam-theory";
import { labelAtStep } from "@/lib/violin-theory";
import {
  playMaqamSequence,
  type SequencableAudioEngine,
} from "@/lib/maqam-playback";
import { Button } from "@/components/ui/button";

interface MaqamPanelProps<Mode extends string> {
  selectedMaqamId: string;
  onSelect: (maqam: MaqamPreset) => void;
  onClear: () => void;
  engine: SequencableAudioEngine<Mode>;
  mode: Mode;
  /** Octave the tonic is played at when sequencing, e.g. 3 for Oud, 4 for Violin. */
  playbackOctave?: number;
  helperText?: string;
}

function JinsRow({
  label,
  placement,
  tonic,
  octave,
}: {
  label: string;
  placement: JinsPlacement;
  tonic: string;
  octave: number;
}) {
  const jins = getJins(placement.jinsId);
  if (!jins) return null;
  const rootNote = `${tonic}${octave}`;
  const noteNames = jins.intervals.map((i) =>
    labelAtStep(rootNote, placement.rootOffset + i),
  );

  return (
    <div className="rounded-lg border border-amber-900/40 bg-amber-950/30 p-3">
      <span className="font-semibold text-amber-200">
        {label}: {jins.nameEn} ({jins.nameAr})
      </span>
      <p className="mt-1 text-[11px] text-violin-muted">
        Notes: {noteNames.join(" · ")}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed">{jins.description}</p>
    </div>
  );
}

export function MaqamPanel<Mode extends string>({
  selectedMaqamId,
  onSelect,
  onClear,
  engine,
  mode,
  playbackOctave = 4,
  helperText,
}: MaqamPanelProps<Mode>) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingStep, setPlayingStep] = useState<number | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const activeMaqam = MAQAMAT.find((m) => m.id === selectedMaqamId) ?? null;

  // Stop any in-flight sequence if the maqam changes or the component unmounts.
  useEffect(() => {
    return () => stopRef.current?.();
  }, []);

  useEffect(() => {
    stopRef.current?.();
    setIsPlaying(false);
    setPlayingStep(null);
  }, [selectedMaqamId, mode]);

  const handlePlay = () => {
    if (!activeMaqam) return;
    setIsPlaying(true);
    stopRef.current = playMaqamSequence(
      activeMaqam,
      engine,
      mode,
      playbackOctave,
      (i) => setPlayingStep(i),
      () => {
        setIsPlaying(false);
        setPlayingStep(null);
      },
    );
  };

  const handleStop = () => {
    stopRef.current?.();
    setIsPlaying(false);
    setPlayingStep(null);
  };

  return (
    <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-amber-200">
            Maqam Scale Degree Highlighting
          </h3>
          <p className="text-xs text-violin-muted">
            {helperText ??
              "Select a maqam to highlight its scale degrees across the fingerboard."}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MAQAMAT.map((m) => (
            <Button
              key={m.id}
              size="sm"
              variant={m.id === selectedMaqamId ? "default" : "outline"}
              onClick={() => onSelect(m)}
              className={
                m.id === selectedMaqamId
                  ? "bg-amber-600 text-amber-950 hover:bg-amber-500 font-semibold"
                  : "border-amber-900/50 text-amber-200/80 hover:bg-amber-900/40"
              }
              title={m.description}
            >
              {m.nameEn} ({m.nameAr})
            </Button>
          ))}
          {selectedMaqamId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                handleStop();
                onClear();
              }}
              className="text-xs text-violin-muted hover:text-violin-text"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {activeMaqam && (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-800/40 bg-amber-900/10 p-3 text-xs text-amber-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-amber-300">
                {activeMaqam.nameEn} ({activeMaqam.nameAr}):
              </span>{" "}
              {activeMaqam.description}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant={isPlaying ? "default" : "outline"}
                onClick={isPlaying ? handleStop : handlePlay}
                className={
                  isPlaying
                    ? "bg-amber-600 text-amber-950 hover:bg-amber-500 font-semibold"
                    : "border-amber-600/60 text-amber-300 hover:bg-amber-900/40"
                }
              >
                {isPlaying ? (
                  <>
                    <Square className="h-3.5 w-3.5" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" /> Play Maqam
                  </>
                )}
              </Button>
              <a
                href={activeMaqam.maqamWorldUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
              >
                MaqamWorld <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <JinsRow
              label="Lower Jins"
              placement={activeMaqam.lowerJins}
              tonic={activeMaqam.tonic}
              octave={playbackOctave}
            />
            {activeMaqam.upperJins && (
              <JinsRow
                label="Upper Jins"
                placement={activeMaqam.upperJins}
                tonic={activeMaqam.tonic}
                octave={playbackOctave}
              />
            )}
          </div>

          {isPlaying && playingStep !== null && (
            <p className="text-[11px] text-amber-400/80">
              Playing degree {playingStep + 1} of{" "}
              {activeMaqam.intervals.length}…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
