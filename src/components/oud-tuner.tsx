import { noteFrequency } from "@/lib/violin-theory";
import type { OudString } from "@/lib/oud-theory";
import { oudAudioEngine, type OudPlayMode } from "@/lib/oud-audio";
import { Button } from "@/components/ui/button";

interface OudTunerProps {
  mode: OudPlayMode;
  strings: OudString[];
}

export function OudTuner({ mode, strings }: OudTunerProps) {
  const playOpenString = async (stringId: string, openNote: string) => {
    await oudAudioEngine.noteOn(stringId, noteFrequency(openNote), mode);
    setTimeout(() => oudAudioEngine.noteOff(stringId, mode), 1500);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {strings.map((str) => (
        <Button
          key={str.id}
          variant="outline"
          className="flex flex-col items-center py-3 h-auto border-amber-900/60 bg-[#1e130b] hover:bg-amber-950/50"
          style={{ borderColor: str.varnish }}
          onClick={() => playOpenString(str.id, str.openNote)}
        >
          <span className="text-sm font-semibold text-violin-text">
            {str.label}
          </span>
          <span className="text-[11px] text-amber-500/80">
            {str.traditionalName}
          </span>
          <span className="text-[10px] text-violin-muted">{str.openNote}</span>
        </Button>
      ))}
    </div>
  );
}
