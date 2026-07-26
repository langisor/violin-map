import { useMemo, useState } from "react";
import { ViolinFingerboard } from "@/components/violin-fingerboard";
import { ViolinTuner } from "@/components/violin-tuner";
import { PitchTuner } from "@/components/pitch-tuner";
import { OudPage } from "@/components/oud-page";
import { TUNINGS, buildStrings, type Resolution } from "@/lib/violin-theory";
import type { PlayMode } from "@/lib/violin-audio";
import {
  MAQAMAT,
  maqamNeedsQuarterTones,
  type MaqamPreset,
} from "@/lib/maqam-theory";
import { Button } from "@/components/ui/button";

type Instrument = "violin" | "oud";
type View = "play" | "pitch";

export default function App() {
  const [instrument, setInstrument] = useState<Instrument>("violin");
  const [view, setView] = useState<View>("play");

  // Violin controls state
  const [mode, setMode] = useState<PlayMode>("bow");
  const [tuningId, setTuningId] = useState(TUNINGS[0].id);
  const [resolution, setResolution] = useState<Resolution>("semitone");
  const [selectedMaqamId, setSelectedMaqamId] = useState<string>("");

  const tuning = useMemo(
    () => TUNINGS.find((t) => t.id === tuningId) ?? TUNINGS[0],
    [tuningId],
  );
  const strings = useMemo(() => buildStrings(tuning), [tuning]);

  const activeMaqam: MaqamPreset | null = useMemo(
    () => MAQAMAT.find((m) => m.id === selectedMaqamId) ?? null,
    [selectedMaqamId],
  );

  const handleSelectMaqam = (maqam: MaqamPreset) => {
    const nextId = selectedMaqamId === maqam.id ? "" : maqam.id;
    setSelectedMaqamId(nextId);
    // Most maqamat need quarter tones (e.g. Bayati's half-flat 2nd degree) —
    // switch resolution up automatically so the highlighted notes actually exist.
    if (nextId && maqamNeedsQuarterTones(maqam)) {
      setResolution("quarter-tone");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-violin-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-violin-text">
            Interactive String Lab
          </h1>
          <p className="text-sm text-violin-muted">
            Interactive fingerboards for Violin and Oud with audio synthesis,
            maqam theory, and live pitch detection.
          </p>
        </div>

        {/* Instrument Selector */}
        <div className="flex items-center rounded-xl bg-violin-panel p-1.5 border border-violin-border shadow-inner">
          <Button
            size="sm"
            variant={instrument === "violin" ? "default" : "ghost"}
            onClick={() => setInstrument("violin")}
            className={instrument === "violin" ? "shadow-md" : ""}
          >
            🎻 Violin
          </Button>
          <Button
            size="sm"
            variant={instrument === "oud" ? "default" : "ghost"}
            onClick={() => setInstrument("oud")}
            className={
              instrument === "oud"
                ? "bg-amber-600 text-amber-950 font-semibold shadow-md hover:bg-amber-500"
                : "text-amber-200/90 hover:text-amber-100"
            }
          >
            🪕 Oud (العود)
          </Button>
        </div>
      </div>

      {/* Mode / View Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-violin-border pb-4">
        <Button
          size="sm"
          variant={view === "play" ? "default" : "outline"}
          onClick={() => setView("play")}
        >
          {instrument === "violin" ? "Violin Fingerboard" : "Oud Fingerboard"}
        </Button>
        <Button
          size="sm"
          variant={view === "pitch" ? "default" : "outline"}
          onClick={() => setView("pitch")}
        >
          Pitch Detection
        </Button>
      </div>

      {view === "pitch" ? (
        <PitchTuner />
      ) : instrument === "oud" ? (
        <OudPage />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-2">
              <span className="text-sm text-violin-muted">Tuning</span>
              {TUNINGS.map((t) => (
                <Button
                  key={t.id}
                  size="sm"
                  variant={t.id === tuningId ? "default" : "outline"}
                  onClick={() => setTuningId(t.id)}
                  title={t.description}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-violin-muted">Resolution</span>
              <Button
                size="sm"
                variant={resolution === "semitone" ? "default" : "outline"}
                onClick={() => setResolution("semitone")}
              >
                Semitone
              </Button>
              <Button
                size="sm"
                variant={resolution === "quarter-tone" ? "default" : "outline"}
                onClick={() => setResolution("quarter-tone")}
                title="24-EDO fingerboard, common in Arabic/Turkish/Persian maqam practice"
              >
                Quarter-tone
              </Button>
            </div>
          </div>

          {/* Maqam Scale Degree Highlighting */}
          <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-amber-200">
                  Maqam Scale Degree Highlighting
                </h3>
                <p className="text-xs text-violin-muted">
                  Select a maqam to highlight its scale degrees across the
                  fingerboard. Selecting one with quarter-tone degrees
                  switches Resolution to Quarter-tone automatically.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MAQAMAT.map((m) => (
                  <Button
                    key={m.id}
                    size="sm"
                    variant={m.id === selectedMaqamId ? "default" : "outline"}
                    onClick={() => handleSelectMaqam(m)}
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
                    onClick={() => setSelectedMaqamId("")}
                    className="text-xs text-violin-muted hover:text-violin-text"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {activeMaqam && (
              <div className="mt-2 rounded-lg border border-amber-800/40 bg-amber-900/10 p-3 text-xs text-amber-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-amber-300">
                    {activeMaqam.nameEn} ({activeMaqam.nameAr}):
                  </span>{" "}
                  {activeMaqam.description}
                </div>
                <a
                  href={activeMaqam.maqamWorldUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-amber-400 hover:underline font-semibold flex items-center gap-1"
                >
                  Learn more on MaqamWorld
                </a>
              </div>
            )}
          </div>

          <ViolinFingerboard
            mode={mode}
            strings={strings}
            resolution={resolution}
            activeMaqam={activeMaqam}
          />

          <div>
            <h2 className="mb-2 text-sm font-semibold text-violin-text">
              Tune open strings
            </h2>
            <ViolinTuner mode={mode} strings={strings} />
          </div>
        </>
      )}
    </main>
  );
}
