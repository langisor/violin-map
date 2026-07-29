import { useMemo, useState } from "react";
import { OUD_TUNINGS, buildOudStrings } from "@/lib/oud-theory";
import { oudAudioEngine, type OudPlayMode } from "@/lib/oud-audio";
import { oudSamplerEngine } from "@/lib/instrument-samplers";
import { useSamplerStatus } from "@/hooks/use-sampler-status";
import type { Resolution } from "@/lib/violin-theory";
import { MAQAMAT, type MaqamPreset } from "@/lib/maqam-theory";
import { OudFingerboard } from "@/components/oud-fingerboard";
import { OudTuner } from "@/components/oud-tuner";
import { MaqamPanel } from "@/components/maqam-panel";
import {
  SoundSourceToggle,
  type SoundSource,
} from "@/components/sound-source-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function OudPage() {
  const [mode, setMode] = useState<OudPlayMode>("risha");
  const [tuningId, setTuningId] = useState(OUD_TUNINGS[0].id);
  const [resolution, setResolution] = useState<Resolution>("quarter-tone");
  const [selectedMaqamId, setSelectedMaqamId] = useState<string>("bayati");
  const [soundSource, setSoundSource] = useState<SoundSource>("synth");

  const tuning = useMemo(
    () => OUD_TUNINGS.find((t) => t.id === tuningId) ?? OUD_TUNINGS[0],
    [tuningId],
  );
  const strings = useMemo(() => buildOudStrings(tuning), [tuning]);

  const activeMaqam: MaqamPreset | null = useMemo(
    () => MAQAMAT.find((m) => m.id === selectedMaqamId) ?? null,
    [selectedMaqamId],
  );

  const oudSamplerStatus = useSamplerStatus(oudSamplerEngine);
  const activeEngine =
    soundSource === "sampled" && oudSamplerStatus === "ready"
      ? oudSamplerEngine
      : oudAudioEngine;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-r from-[#24160c] via-[#1a1008] to-[#120a05] p-4 shadow-xl sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-amber-200 sm:text-2xl">
                The Oud (العود)
              </h2>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
                King of Instruments
              </span>
            </div>
            <p className="mt-2 text-sm text-violin-muted max-w-2xl leading-relaxed">
              The Oud is the principal fretless short-neck lute of Arabic,
              Turkish, and Middle Eastern music. Its fretless neck provides
              complete intonational freedom, making it the ideal instrument for
              performing microtonal Arabic <em>maqamat</em> (such as Maqam
              Bayati).
            </p>
          </div>

          <a
            href="https://www.maqamworld.com/ar/maqam/bayati.php"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 shrink-0 rounded-lg border border-amber-600/50 bg-amber-950/40 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 hover:border-amber-500 transition-all shadow-md self-start"
          >
            <span>📖 Reference: MaqamWorld</span>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Controls Bar */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
          {/* Stroke Mode */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-violin-muted">
              Risha Stroke
            </span>
            <Button
              size="sm"
              variant={mode === "risha" ? "default" : "outline"}
              onClick={() => setMode("risha")}
            >
              Single Pluck
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={mode === "tremolo" ? "default" : "outline"}
                  onClick={() => setMode("tremolo")}
                >
                  Tremolo (رشّة)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Rasha tremolo: a rapid triple-pluck stroke used for sustained
                or dramatic passages.
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Tuning Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-violin-muted">
              Tuning
            </span>
            <div className="flex flex-wrap gap-1">
              {OUD_TUNINGS.map((t) => (
                <Tooltip key={t.id}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={t.id === tuningId ? "default" : "outline"}
                      onClick={() => setTuningId(t.id)}
                    >
                      {t.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t.description}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-violin-muted">
              Resolution
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={resolution === "quarter-tone" ? "default" : "outline"}
                  onClick={() => setResolution("quarter-tone")}
                >
                  Quarter-tone (24-EDO)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                24-EDO fingerboard for Arabic quarter-tones
              </TooltipContent>
            </Tooltip>
            <Button
              size="sm"
              variant={resolution === "semitone" ? "default" : "outline"}
              onClick={() => setResolution("semitone")}
            >
              Semitone (12-EDO)
            </Button>
          </div>

          <SoundSourceToggle
            value={soundSource}
            onChange={setSoundSource}
            samplerEngine={oudSamplerEngine}
            sampleFolderHint="public/samples/oud/"
            activeClassName="bg-amber-600 text-amber-950 hover:bg-amber-500 font-semibold"
          />
        </CardContent>
      </Card>

      {/* Maqam Scale Highlighting + Ajnas breakdown + Play */}
      <MaqamPanel
        selectedMaqamId={selectedMaqamId}
        onSelect={(m) =>
          setSelectedMaqamId(selectedMaqamId === m.id ? "" : m.id)
        }
        onClear={() => setSelectedMaqamId("")}
        engine={activeEngine}
        mode={mode}
        playbackOctave={3}
        helperText="Select a maqam to highlight its scale degrees on the fingerboard, see the ajnas (tetrachords) it's built from, and play it back."
      />

      {/* Oud Fingerboard */}
      <OudFingerboard
        mode={mode}
        strings={strings}
        resolution={resolution}
        activeMaqam={activeMaqam}
        engine={activeEngine}
      />

      {/* Course Tuner */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-violin-text">
          Tune Open String Courses ({tuning.label})
        </h3>
        <OudTuner mode={mode} strings={strings} engine={activeEngine} />
      </div>
    </div>
  );
}
