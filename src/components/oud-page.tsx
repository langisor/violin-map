import { useMemo, useState } from "react";
import { OUD_TUNINGS, buildOudStrings } from "@/lib/oud-theory";
import { MAQAMAT, type MaqamPreset } from "@/lib/maqam-theory";
import type { OudPlayMode } from "@/lib/oud-audio";
import type { Resolution } from "@/lib/violin-theory";
import { OudFingerboard } from "@/components/oud-fingerboard";
import { OudTuner } from "@/components/oud-tuner";
import { Button } from "@/components/ui/button";

export function OudPage() {
  const [mode, setMode] = useState<OudPlayMode>("risha");
  const [tuningId, setTuningId] = useState(OUD_TUNINGS[0].id);
  const [resolution, setResolution] = useState<Resolution>("quarter-tone");
  const [selectedMaqamId, setSelectedMaqamId] = useState<string>("bayati");

  const tuning = useMemo(
    () => OUD_TUNINGS.find((t) => t.id === tuningId) ?? OUD_TUNINGS[0],
    [tuningId],
  );
  const strings = useMemo(() => buildOudStrings(tuning), [tuning]);

  const activeMaqam: MaqamPreset | null = useMemo(
    () => MAQAMAT.find((m) => m.id === selectedMaqamId) ?? null,
    [selectedMaqamId],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-r from-[#24160c] via-[#1a1008] to-[#120a05] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-amber-200">
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
            className="inline-flex items-center gap-2 shrink-0 rounded-lg border border-amber-600/50 bg-amber-950/40 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 hover:border-amber-500 transition-all shadow-md"
          >
            <span>📖 Reference: MaqamWorld Bayati</span>
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
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-violin-border bg-violin-panel p-4">
        {/* Stroke Mode */}
        <div className="flex items-center gap-2">
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
          <Button
            size="sm"
            variant={mode === "tremolo" ? "default" : "outline"}
            onClick={() => setMode("tremolo")}
          >
            Tremolo (رشّة)
          </Button>
        </div>

        {/* Tuning Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-violin-muted">Tuning</span>
          <div className="flex flex-wrap gap-1">
            {OUD_TUNINGS.map((t) => (
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
        </div>

        {/* Resolution */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-violin-muted">
            Resolution
          </span>
          <Button
            size="sm"
            variant={resolution === "quarter-tone" ? "default" : "outline"}
            onClick={() => setResolution("quarter-tone")}
            title="24-EDO fingerboard for Arabic quarter-tones"
          >
            Quarter-tone (24-EDO)
          </Button>
          <Button
            size="sm"
            variant={resolution === "semitone" ? "default" : "outline"}
            onClick={() => setResolution("semitone")}
          >
            Semitone (12-EDO)
          </Button>
        </div>
      </div>

      {/* Maqam Scale Highlighting Control */}
      <div className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-amber-200">
              Maqam Scale Degree Highlighting
            </h3>
            <p className="text-xs text-violin-muted">
              Select a maqam to highlight its scale degrees across the
              fingerboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MAQAMAT.map((m) => (
              <Button
                key={m.id}
                size="sm"
                variant={m.id === selectedMaqamId ? "default" : "outline"}
                onClick={() =>
                  setSelectedMaqamId(selectedMaqamId === m.id ? "" : m.id)
                }
                className={
                  m.id === selectedMaqamId
                    ? "bg-amber-600 text-amber-950 hover:bg-amber-500 font-semibold"
                    : "border-amber-900/50 text-amber-200/80 hover:bg-amber-900/40"
                }
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

        {/* Selected Maqam Info */}
        {activeMaqam && (
          <div className="mt-2 rounded-lg border border-amber-800/40 bg-amber-900/20 p-3 text-xs text-amber-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              <span>Learn more on MaqamWorld</span>
              <svg
                className="h-3 w-3"
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
        )}
      </div>

      {/* Oud Fingerboard */}
      <OudFingerboard
        mode={mode}
        strings={strings}
        resolution={resolution}
        activeMaqam={activeMaqam}
      />

      {/* Course Tuner */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-violin-text">
          Tune Open String Courses ({tuning.label})
        </h3>
        <OudTuner mode={mode} strings={strings} />
      </div>

      {/* Educational Deep Dive */}
      <div className="rounded-2xl border border-amber-900/30 bg-gradient-to-b from-[#1c1109] to-violin-bg p-6 text-xs text-violin-muted space-y-3">
        <h3 className="text-sm font-semibold text-amber-300">
          Understanding Maqam Bayati (مقام بياتي) & The Oud
        </h3>
        <p className="leading-relaxed">
          As documented on{" "}
          <a
            href="https://www.maqamworld.com/ar/maqam/bayati.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 underline font-medium"
          >
            MaqamWorld
          </a>
          , <strong>Maqam Bayati</strong> is by far the most widely performed
          mode in Arabic music. It is rooted on <em>Jins Bayati</em> starting on{" "}
          <strong>Dugah (D4)</strong>, with its second scale degree lowered by a
          quarter-tone to <strong>Sikah (E4½♭)</strong>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/30 p-3">
            <span className="font-semibold text-amber-200">
              Lower Jins: Jins Bayati on D
            </span>
            <p className="mt-1 text-[11px]">
              Notes: D4 · E4½♭ (Sikah) · F4 · G4
            </p>
          </div>
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/30 p-3">
            <span className="font-semibold text-amber-200">
              Upper Jins: Jins Nahawand / Ajam on A
            </span>
            <p className="mt-1 text-[11px]">Notes: A4 · B4♭ · C5 · D5</p>
          </div>
        </div>
      </div>
    </div>
  );
}
