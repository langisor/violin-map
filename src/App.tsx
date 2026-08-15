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
import {
  TUNINGS,
  buildStrings,
  type NoteNotation,
  type Resolution,
} from "@/lib/violin-theory";
import { violinAudioEngine, type PlayMode } from "@/lib/violin-audio";
import { violinSamplerEngine } from "@/lib/instrument-samplers";
import { useSamplerStatus } from "@/hooks/use-sampler-status";
import {
  MAQAMAT,
  maqamNeedsQuarterTones,
  type MaqamPreset,
} from "@/lib/maqam-theory";
import { Button } from "@/components/ui/button";
import { RecordNotesDialog } from "@/components/record-notes-dialog";
import type { RecordedNote } from "@/lib/note-recording";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VIOLIN_POSITIONS, type ViolinPosition } from "@/lib/violin-theory";
import { type WesternScalePreset } from "@/lib/western-scale-theory";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { BookOpen, ListMusic, Settings2 } from "lucide-react";
import { Metronome } from "@/components/metronome/metronome";

type Instrument = "violin" | "oud";
type View = "play" | "pitch" | "metronome";
type ScaleSystem = "eastern" | "western";

export default function App() {
  const [instrument, setInstrument] = useState<Instrument>("violin");
  const [view, setView] = useState<View>("play");

  // Violin controls state
  const [mode, setMode] = useState<PlayMode>("bow");
  const [tuningId, setTuningId] = useState(TUNINGS[0].id);
  const [resolution, setResolution] = useState<Resolution>("semitone");
  const [notation, setNotation] = useState<NoteNotation>("sharps");
  const [selectedMaqamId, setSelectedMaqamId] = useState<string>("");
  const [soundSource, setSoundSource] = useState<SoundSource>("synth");
  const [scaleSystem, setScaleSystem] = useState<ScaleSystem>("eastern");
  const [selectedScale, setSelectedScale] = useState<WesternScalePreset | null>(null);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [position, setPosition] = useState<ViolinPosition>(1);
  const [playingFrequency, setPlayingFrequency] = useState<number | null>(null);
  const [recordNotes, setRecordNotes] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);

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
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-4 sm:gap-8 sm:p-6">
      {/* Navigation Header */}
      <nav className="flex flex-col gap-4 border-b border-violin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl">🎻</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-violin-text sm:text-2xl">
              String Lab
            </h1>
            <p className="text-xs text-violin-muted sm:text-sm">
              Interactive fingerboards for Violin and Oud
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="sm" className="text-violin-muted hover:text-violin-text">
                  <BookOpen data-icon="inline-start" className="mr-2 h-4 w-4" />
                  Guide
                </Button>
              }
            />
            <PopoverContent align="end" className="w-80 p-4 bg-violin-bg text-violin-text">
              <PopoverHeader>
                <PopoverTitle>Start playing</PopoverTitle>
                <PopoverDescription>
                  Choose an instrument and a view, then open Settings to tune
                  the fingerboard to your practice.
                </PopoverDescription>
              </PopoverHeader>
              <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4 text-xs ">
                <li>Select a maqam or western scale to highlight its notes.</li>
                <li>Tap a note on the fingerboard to hear it.</li>
                <li>Use Practice notes to record and review a phrase.</li>
              </ol>
            </PopoverContent>
          </Popover>

          {/* Instrument Selector */}
          <Tabs
            value={instrument}
            onValueChange={(v) => setInstrument(v as Instrument)}
          >
            <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
              <TabsTrigger value="violin">Violin</TabsTrigger>
              <TabsTrigger
                value="oud"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Oud
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </nav>

      {/* View Selector */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-violin-text">Browse Tools</h2>
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
            <TabsTrigger value="play">
              {instrument === "violin" ? "Fingerboard" : "Fingerboard"}
            </TabsTrigger>
            <TabsTrigger value="pitch">Pitch Detection</TabsTrigger>
            <TabsTrigger value="metronome">Metronome</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "metronome" ? (
        <Metronome />
      ) : view === "pitch" ? (
        <PitchTuner />
      ) : instrument === "oud" ? (
        <OudPage />
      ) : (
        <>
          <Card className="border-violin-border bg-violin-panel">
            <CardHeader className="gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-violin-text">Fingerboard workspace</CardTitle>
                <CardDescription className="text-violin-muted">
                  Adjust your setup, choose a scale, then play directly on the board.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Sheet>
                  <SheetTrigger
                    render={
                      <Button size="sm" className="bg-primary hover:bg-primary-hover">
                        <Settings2 data-icon="inline-start" />
                        Settings
                      </Button>
                    }
                  />
                  <SheetContent side="right" className="overflow-y-auto bg-violin-panel">
                    <SheetHeader>
                      <SheetTitle className="text-violin-text">Fingerboard settings</SheetTitle>
                      <SheetDescription className="text-violin-muted">
                        Shape the instrument, sound, and notation for this session.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-5 px-4 pb-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-violin-text">Mode</span>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant={mode === "bow" ? "default" : "outline"} onClick={() => setMode("bow")}>Bow</Button>
                          <Button size="sm" variant={mode === "pluck" ? "default" : "outline"} onClick={() => setMode("pluck")}>Pizzicato</Button>
                        </div>
                      </div>

                      <SoundSourceToggle
                        value={soundSource}
                        onChange={setSoundSource}
                        samplerEngine={violinSamplerEngine}
                        sampleFolderHint="public/samples/violin/"
                      />

                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-violin-text">Tuning</span>
                        <div className="flex flex-wrap gap-2">
                          {TUNINGS.map((t) => (
                            <Tooltip key={t.id}>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant={t.id === tuningId ? "default" : "outline"} onClick={() => setTuningId(t.id)}>{t.label}</Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.description}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-violin-text">Resolution</span>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant={resolution === "semitone" ? "default" : "outline"} onClick={() => setResolution("semitone")}>Semitone</Button>
                          <Button size="sm" variant={resolution === "quarter-tone" ? "default" : "outline"} onClick={() => setResolution("quarter-tone")}>Quarter-tone</Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-violin-text">Note marks</span>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant={notation === "sharps" ? "default" : "outline"} onClick={() => setNotation("sharps")}>Sharps (#)</Button>
                          <Button size="sm" variant={notation === "flats" ? "default" : "outline"} onClick={() => setNotation("flats")}>Flats (b)</Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-violin-text">Orientation</span>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant={orientation === "horizontal" ? "default" : "outline"} onClick={() => setOrientation("horizontal")}>Horizontal</Button>
                          <Button size="sm" variant={orientation === "vertical" ? "default" : "outline"} onClick={() => setOrientation("vertical")}>Vertical</Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Drawer showSwipeHandle>
                  <DrawerTrigger
                    render={
                      <Button size="sm" variant={recordNotes ? "default" : "outline"}>
                        <ListMusic data-icon="inline-start" />
                        Practice notes{recordedNotes.length ? ` (${recordedNotes.length})` : ""}
                      </Button>
                    }
                  />
                  <DrawerContent className="bg-violin-panel">
                    <DrawerHeader>
                      <DrawerTitle className="text-violin-text">Practice notes</DrawerTitle>
                      <DrawerDescription className="text-violin-muted">
                        Record each note you play, then analyze the phrase when you are ready.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex flex-col gap-3 p-4 pt-3">
                      <Button variant={recordNotes ? "default" : "outline"} onClick={() => setRecordNotes((value) => !value)}>
                        {recordNotes ? "Stop recording" : "Start recording"}
                      </Button>
                      <Button variant="outline" disabled={!recordedNotes.length} onClick={() => setRecordingDialogOpen(true)}>
                        Analyze {recordedNotes.length ? `${recordedNotes.length} notes` : "notes"}
                      </Button>
                      {recordedNotes.length > 0 && <Button variant="ghost" onClick={() => setRecordedNotes([])}>Clear recorded notes</Button>}
                    </div>
                    <DrawerFooter>
                      <DrawerClose render={<Button variant="outline">Done</Button>} />
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-xs text-violin-muted">
                {tuning.label} tuning · {resolution === "quarter-tone" ? "24-EDO" : "12-EDO"} · {orientation} view
              </p>
            </CardContent>
          </Card>
          {/* Legacy inline controls are intentionally moved into the settings sheet. */}
          {/*
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
                <Button size="sm" variant={recordNotes ? "default" : "outline"} onClick={() => setRecordNotes((value) => !value)}>Record notes</Button>
                {recordNotes && <Button size="sm" onClick={() => setRecordingDialogOpen(true)} disabled={!recordedNotes.length}>Analyze ({recordedNotes.length})</Button>}
                {recordNotes && recordedNotes.length > 0 && <Button size="sm" variant="ghost" onClick={() => setRecordedNotes([])}>Clear</Button>}
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
                <span className="text-sm text-violin-muted">Note marks</span>
                <Button
                  size="sm"
                  variant={notation === "sharps" ? "default" : "outline"}
                  onClick={() => setNotation("sharps")}
                >
                  Sharps (#)
                </Button>
                <Button
                  size="sm"
                  variant={notation === "flats" ? "default" : "outline"}
                  onClick={() => setNotation("flats")}
                >
                  Flats (b)
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-violin-muted">View</span>
                <Button size="sm" variant={orientation === "horizontal" ? "default" : "outline"} onClick={() => setOrientation("horizontal")}>Horizontal</Button>
                <Button size="sm" variant={orientation === "vertical" ? "default" : "outline"} onClick={() => setOrientation("vertical")}>Vertical</Button>
              </div>

            </CardContent>
          */}

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
            notation={notation}
            playingFrequency={playingFrequency}
            engine={activeEngine}
            recordNotes={recordNotes}
            recordedNotes={recordedNotes}
            onRecordedNotesChange={setRecordedNotes}
          />

          <RecordNotesDialog
            open={recordingDialogOpen}
            onOpenChange={setRecordingDialogOpen}
            notes={recordedNotes}
            onLoad={(notes) => { setRecordedNotes(notes); setRecordNotes(true); }}
            engine={activeEngine}
            mode={mode}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-violin-muted">Position</span>
            {VIOLIN_POSITIONS.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={position === item.id ? "default" : "outline"}
                onClick={() => setPosition(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>

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
