import { VIOLIN_STRINGS, noteFrequency } from "@/lib/violin_theory";
import { violinAudioEngine, type PlayMode } from "@/lib/violin_audio";
import { Button } from "@/components/ui/button";

interface ViolinTunerProps {
  mode: PlayMode;
}

export function ViolinTuner({ mode }: ViolinTunerProps) {
  const playOpenString = async (stringId: string, openNote: string) => {
    await violinAudioEngine.noteOn(stringId, noteFrequency(openNote), mode);
    setTimeout(
      () => violinAudioEngine.noteOff(stringId, mode),
      mode === "bow" ? 1500 : 50
    );
  };

  return (
    <div className="flex gap-2">
      {VIOLIN_STRINGS.map((str) => (
        <Button
          key={str.id}
          variant="outline"
          className="flex-1"
          style={{ borderColor: str.varnish }}
          onClick={() => playOpenString(str.id, str.openNote)}
        >
          {str.id}
          <span className="ml-1 text-xs text-violin-muted">{str.openNote}</span>
        </Button>
      ))}
    </div>
  );
}
