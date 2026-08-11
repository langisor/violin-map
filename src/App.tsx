import { useMemo, useState } from "react";
import { ViolinFingerboard } from "@/components/violin-fingerboard";
import { ViolinTuner } from "@/components/violin-tuner";
import { PitchTuner } from "@/components/pitch-tuner";
import { OudPage } from "@/components/oud-page";
import { MaqamPanel } from "@/components/maqam-panel";
import { WesternScalePanel } from "@/components/western-scale-panel";
import {
  SoundSourceToggle,
  type SoundSource,
} from "@/components/sound-source-toggle";
import { TUNINGS, buildStrings, type Resolution } from "@/lib/violin-theory";
import { violinAudioEngine, type PlayMode } from "@/lib/violin-audio";
import { violinSamplerEngine } from "@/lib/instrument-samplers";
import { useSamplerStatus } from "@/hooks/use-sampler-status";
import {
  MAQAMAT,
  maqamNeedsQuarterTones,
  type MaqamPreset,
} from "@/lib/maqam-theory";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VIOLIN_POSITIONS, type ViolinPosition } from "@/lib/violin-theory";
import { type WesternScalePreset } from "@/lib/western-scale-theory";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Instrument = "violin" | "oud";
type View = "play" | "pitch";
type ScaleSystem = "eastern" | "western";

export default function App() {
  const [instrument, setInstrument] = useState<Instrument>("violin");
  const [view, setView] = useState<View>("play");

  // Violin controls state
  const [mode, setMode] = useState<PlayMode>("bow");
  const [tuningId, setTuningId] = useState(TUNINGS[0].id);
  const [resolution, setResolution] = useState<Resolution>("semitone");
  const [selectedMaqamId, setSelectedMaqamId] = useState<string>("");
  const [soundSource, setSoundSource] = useState<SoundSource>("synth");
  const [scaleSystem, setScaleSystem] = useState<ScaleSystem>("eastern");
  const [selectedScale, setSelectedScale] = useState<WesternScalePreset | null>(null);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [position, setPosition] = useState<ViolinPosition>(1);
  const [playingFrequency, setPlayingFrequency] = useState<number | null>(null);

  const tuning = useMemo(
    () => TUNINGS.find((t) => t.id === tuningId) ?? TUNINGS[0],
    [tuningId],
  );
  const strings = useMemo(() => buildStrings(tuning), [tuning]);

  const violinSamplerStatus = useSamplerStatus(violinSamplerEngine);
  const activeEngine =
    soundSource === "sampled" && violinSamplerStatus === "ready"
      ? violinSamplerEngine
      : violinAudioEngine;

  const activeMaqam: MaqamPreset | null = useMemo(
    () => MAQAMAT.find((m) => m.id === selectedMaqamId) ?? null,
    [selectedMaqamId],
  );

  const handleSelectMaqam = (maqam: MaqamPreset) => {
    const nextId = selectedMaqamId === maqam.id ? "" : maqam.id;
    setSelectedMaqamId(nextId);
    setSelectedScale(null);
    // Most maqamat need quarter tones (e.g. Bayati's half-flat 2nd degree) —
    // switch resolution up automatically so the highlighted notes actually exist.
    if (nextId && maqamNeedsQuarterTones(maqam)) {
      setResolution("quarter-tone");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 p-4 sm:gap-6 sm:p-6">
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 border-b border-violin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-violin-text sm:text-2xl">
            Interactive String Lab
          </h1>
          <p className="text-xs text-violin-muted sm:text-sm">
            Interactive fingerboards for Violin and Oud with audio synthesis,
            maqam theory, and live pitch detection.
          </p>
        </div>

        {/* Instrument Selector */}
        <Tabs
          value={instrument}
          onValueChange={(v) => setInstrument(v as Instrument)}
        >
          <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
            <TabsTrigger value="violin">🎻 Violin</TabsTrigger>
            <TabsTrigger
              value="oud"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-amber-950"
            >
              🪕 Oud (العود)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* View Selector */}
      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
          <TabsTrigger value="play">
            {instrument === "violin" ? "Violin Fingerboard" : "Oud Fingerboard"}
          </TabsTrigger>
          <TabsTrigger value="pitch">Pitch Detection</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "pitch" ? (
        <PitchTuner />
      ) : instrument === "oud" ? (
        <OudPage />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-violin-muted">Mode</span>
                <Button
                  size="sm"
                  variant={mode === "bow" ? "default" : "outline"}
                  onClick={() => setMode("bow")}
                >
                  Bow
                </Button>
                <Button
                  size="sm"
                  variant={mode === "pluck" ? "default" : "outline"}
                  onClick={() => setMode("pluck")}
                >
                  Pizzicato
                </Button>
              </div>

              <SoundSourceToggle
                value={soundSource}
                onChange={setSoundSource}
                samplerEngine={violinSamplerEngine}
                sampleFolderHint="public/samples/violin/"
              />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-violin-muted">Tuning</span>
                {TUNINGS.map((t) => (
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

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-violin-muted">Resolution</span>
                <Button
                  size="sm"
                  variant={resolution === "semitone" ? "default" : "outline"}
                  onClick={() => setResolution("semitone")}
                >
                  Semitone
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={
                        resolution === "quarter-tone" ? "default" : "outline"
                      }
                      onClick={() => setResolution("quarter-tone")}
                    >
                      Quarter-tone
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    24-EDO fingerboard, common in Arabic/Turkish/Persian maqam
                    practice
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-violin-muted">View</span>
                <Button size="sm" variant={orientation === "horizontal" ? "default" : "outline"} onClick={() => setOrientation("horizontal")}>Horizontal</Button>
                <Button size="sm" variant={orientation === "vertical" ? "default" : "outline"} onClick={() => setOrientation("vertical")}>Vertical</Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-violin-muted">Position</span>
                {VIOLIN_POSITIONS.map((item) => <Button key={item.id} size="sm" variant={position === item.id ? "default" : "outline"} onClick={() => setPosition(item.id)}>{item.label}</Button>)}
              </div>
            </CardContent>
          </Card>

          <Tabs value={scaleSystem} onValueChange={(value) => { setScaleSystem(value as ScaleSystem); setPlayingFrequency(null); }}>
            <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
              <TabsTrigger value="eastern">Eastern (Maqamat)</TabsTrigger>
              <TabsTrigger value="western">Western (Scales)</TabsTrigger>
            </TabsList>
          </Tabs>

          {scaleSystem === "eastern" ? <MaqamPanel
            selectedMaqamId={selectedMaqamId}
            onSelect={handleSelectMaqam}
            onClear={() => setSelectedMaqamId("")}
            engine={activeEngine}
            mode={mode}
            playbackOctave={4}
            helperText="Select a maqam to highlight its scale degrees, see the ajnas (tetrachords) it's built from, and play it back. Selecting one with quarter-tone degrees switches Resolution to Quarter-tone automatically."
            onPlayingFrequency={setPlayingFrequency}
          /> : <WesternScalePanel
            selectedScale={selectedScale}
            onSelect={(scale) => { setSelectedScale(scale); setSelectedMaqamId(""); }}
            onClear={() => setSelectedScale(null)}
            onPlayingFrequency={setPlayingFrequency}
            engine={activeEngine}
            mode={mode}
            playbackOctave={4}
          />}

          <ViolinFingerboard
            mode={mode}
            strings={strings}
            resolution={resolution}
            activeMaqam={activeMaqam}
            activeScale={selectedScale}
            orientation={orientation}
            position={position}
            playingFrequency={playingFrequency}
            engine={activeEngine}
          />

          <div>
            <h2 className="mb-2 text-sm font-semibold text-violin-text">
              Tune open strings
            </h2>
            <ViolinTuner mode={mode} strings={strings} engine={activeEngine} />
          </div>
        </>
      )}
    </main>
  );
}
