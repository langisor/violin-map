import { noteFrequency, type ViolinString } from "@/lib/violin-theory";
import { violinAudioEngine, type PlayMode } from "@/lib/violin-audio";
import type { SequencableAudioEngine } from "@/lib/maqam-playback";
import { Button } from "@/components/ui/button";

interface ViolinTunerProps {
  mode: PlayMode;
  strings: ViolinString[];
  /** Defaults to the built-in synth engine; pass the sampler engine to play recorded samples instead. */
  engine?: SequencableAudioEngine<PlayMode>;
}

export function ViolinTuner({ mode, strings, engine = violinAudioEngine }: ViolinTunerProps) {
  const playOpenString = async (stringId: string, openNote: string) => {
    await engine.noteOn(stringId, noteFrequency(openNote), mode);
    setTimeout(
      () => engine.noteOff(stringId, mode),
      mode === "bow" ? 1500 : 50
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex">
      {strings.map((str) => (
        <Button
          key={str.id}
          variant="outline"
          className="flex-1"
          style={{ borderColor: str.varnish }}
          onClick={() => playOpenString(str.id, str.openNote)}
        >
          {str.label}
          <span className="ml-1 text-xs text-violin-muted">{str.openNote}</span>
        </Button>
      ))}
    </div>
  );
}
