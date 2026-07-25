import { noteFrequency, type ViolinString } from "@/lib/violin-theory";
import { violinAudioEngine, type PlayMode } from "@/lib/violin-audio";
import { Button } from "@/components/ui/button";

interface ViolinTunerProps {
  mode: PlayMode;
  strings: ViolinString[];
}

export function ViolinTuner({ mode, strings }: ViolinTunerProps) {
  const playOpenString = async (stringId: string, openNote: string) => {
    await violinAudioEngine.noteOn(stringId, noteFrequency(openNote), mode);
    setTimeout(
      () => violinAudioEngine.noteOff(stringId, mode),
      mode === "bow" ? 1500 : 50
    );
  };

  return (
    <div className="flex gap-2">
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
