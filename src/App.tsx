import { useState } from "react";
import { ViolinFingerboard } from "@/components/violin_fingerboard";
import { ViolinTuner } from "@/components/violin_tuner";
import type { PlayMode } from "@/lib/violin_audio";
import { Button } from "@/components/ui/button";

export default function App() {
  const [mode, setMode] = useState<PlayMode>("bow");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-violin-text">Interactive Violin</h1>
        <p className="text-sm text-violin-muted">
          A four-string fingerboard with bowed and pizzicato playback, built with Tone.js and
          tonal.
        </p>
      </div>

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

      <ViolinFingerboard mode={mode} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-violin-text">Tune open strings</h2>
        <ViolinTuner mode={mode} />
      </div>
    </main>
  );
}
