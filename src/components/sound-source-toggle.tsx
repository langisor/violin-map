import { useSamplerStatus } from "@/hooks/use-sampler-status";
import type { StatusReportingSampler } from "@/lib/sampler-audio";
import { Button } from "@/components/ui/button";
import {
 Tooltip,
 TooltipContent,
 TooltipTrigger,
} from "@/components/ui/tooltip";

export type SoundSource = "synth" | "sampled";

interface SoundSourceToggleProps {
 value: SoundSource;
 onChange: (value: SoundSource) => void;
 samplerEngine: StatusReportingSampler;
 sampleFolderHint: string; // e.g. "public/samples/violin/"
 /** className applied to the "Sampled" button only while it's the active source (for instrument-specific accent colors). */
 activeClassName?: string;
}

export function SoundSourceToggle({
 value,
 onChange,
 samplerEngine,
 sampleFolderHint,
 activeClassName,
}: SoundSourceToggleProps) {
 const status = useSamplerStatus(samplerEngine);
 const disabled = status !== "ready";

 const statusLabel =
  status === "loading"
   ? "Loading sample files…"
   : status === "ready"
    ? "Real recorded note samples loaded ✓"
    : status === "error"
     ? `No valid samples found in ${sampleFolderHint} — check filenames match the manifest`
     : `No sample files added yet — drop mp3s into ${sampleFolderHint} to enable this`;

 return (
  <div className="flex flex-wrap items-center gap-2">
   <span className="text-xs font-medium text-violin-muted sm:text-sm">
    Sound
   </span>
   <Button
    size="sm"
    variant={value === "synth" ? "default" : "outline"}
    onClick={() => onChange("synth")}
   >
    Synth
   </Button>
   <Tooltip>
    <TooltipTrigger asChild>
     {/* Tooltip triggers on this wrapper, not the (possibly disabled) button,
              since disabled elements don't reliably fire pointer/focus events. */}
     <span tabIndex={0} className="inline-block rounded-md">
      <Button
       size="sm"
       variant={value === "sampled" ? "default" : "outline"}
       onClick={() => onChange("sampled")}
       disabled={disabled}
       className={value === "sampled" ? activeClassName : undefined}
      >
       Sampled{status === "loading" ? "…" : ""}
      </Button>
     </span>
    </TooltipTrigger>
    <TooltipContent>{statusLabel}</TooltipContent>
   </Tooltip>
  </div>
 );
}
