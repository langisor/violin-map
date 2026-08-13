import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Save, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeRecordedNotes, formatIntervals, type RecordedNote } from "@/lib/note-recording";
import type { SequencableAudioEngine } from "@/lib/maqam-playback";
import type { PlayMode } from "@/lib/violin-audio";

interface SavedRecording {
  id: string;
  name: string;
  notes: RecordedNote[];
  savedAt: string;
}

interface RecordNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: RecordedNote[];
  onLoad: (notes: RecordedNote[]) => void;
  engine: SequencableAudioEngine<PlayMode>;
  mode: PlayMode;
}

const STORAGE_KEY = "violin-map:recorded-notes:v1";
const RECORDING_VOICE_ID = "recording-arpeggio";
const NOTE_DURATION_MS = 460;

function readRecordings(): SavedRecording[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value as SavedRecording[] : [];
  } catch {
    return [];
  }
}

export function RecordNotesDialog({ open, onOpenChange, notes, onLoad, engine, mode }: RecordNotesDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [name, setName] = useState("Untitled notes");
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([]);
  const [playing, setPlaying] = useState(false);
  const matches = useMemo(() => analyzeRecordedNotes(notes), [notes]);

  const stopPlayback = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    engine.noteOff(RECORDING_VOICE_ID, mode);
    setPlaying(false);
  }, [engine, mode]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSavedRecordings(readRecordings());
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const playArpeggio = () => {
    stopPlayback();
    if (!notes.length) return;
    setPlaying(true);
    notes.forEach((note, index) => {
      timersRef.current.push(setTimeout(() => {
        void engine.noteOn(RECORDING_VOICE_ID, note.frequency, "pluck");
      }, index * NOTE_DURATION_MS));
    });
    timersRef.current.push(setTimeout(() => setPlaying(false), notes.length * NOTE_DURATION_MS + 120));
  };

  const saveRecording = () => {
    if (!notes.length) return;
    const next = [{ id: crypto.randomUUID(), name: name.trim() || "Untitled notes", notes, savedAt: new Date().toISOString() }, ...savedRecordings].slice(0, 30);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedRecordings(next);
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); stopPlayback(); onOpenChange(false); }}
      onClose={() => onOpenChange(false)}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl border border-violin-border bg-violin-panel p-0 text-violin-text shadow-2xl backdrop:bg-black/70"
    >
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Recorded-note analysis</h2>
            <p className="text-sm text-violin-muted">Closest matches are ranked by the notes you selected; intervals are measured from the proposed tonic.</p>
          </div>
          <Button variant="ghost" size="sm" aria-label="Close analysis" onClick={() => { stopPlayback(); onOpenChange(false); }}><X /></Button>
        </div>

        <section className="flex flex-col gap-2" aria-labelledby="recorded-notes-heading">
          <h3 id="recorded-notes-heading" className="text-sm font-semibold">Selected notes ({notes.length})</h3>
          <div className="flex flex-wrap gap-2">
            {notes.map((note) => <span key={note.id} className="rounded-md border border-violin-border bg-violin-cell px-2 py-1 text-sm">{note.label}</span>)}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={playArpeggio} disabled={!notes.length || playing}><Play data-icon="inline-start" />Play arpeggio</Button>
            <Button size="sm" variant="outline" onClick={stopPlayback} disabled={!playing}><Square data-icon="inline-start" />Stop</Button>
          </div>
        </section>

        <section className="flex flex-col gap-2" aria-labelledby="matches-heading">
          <h3 id="matches-heading" className="text-sm font-semibold">Nearest scales and maqams</h3>
          <div className="flex flex-col gap-2">
            {matches.map((match) => (
              <div key={match.id} className="rounded-lg border border-violin-border bg-violin-cell p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-medium">{match.name} on {match.tonic}</span><span className="text-xs text-violin-muted">{match.matched}/{match.total} selected notes match</span></div>
                <p className="mt-1 text-xs text-violin-muted">{match.family} intervals: {formatIntervals(match.intervals)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2 border-t border-violin-border pt-4" aria-labelledby="save-heading">
          <h3 id="save-heading" className="text-sm font-semibold">Save locally</h3>
          <div className="flex flex-wrap gap-2">
            <input aria-label="Recording name" value={name} onChange={(event) => setName(event.target.value)} className="h-8 min-w-44 flex-1 rounded-md border border-violin-border bg-violin-bg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violin-a" />
            <Button size="sm" variant="outline" onClick={saveRecording} disabled={!notes.length}><Save data-icon="inline-start" />Save</Button>
          </div>
          {savedRecordings.length > 0 && <div className="flex flex-col gap-1 text-sm">{savedRecordings.slice(0, 5).map((recording) => <button key={recording.id} onClick={() => onLoad(recording.notes)} className="rounded-md px-2 py-1 text-left hover:bg-violin-cell-open"><span className="font-medium">{recording.name}</span><span className="ml-2 text-xs text-violin-muted">{recording.notes.map((note) => note.label).join(", ")}</span></button>)}</div>}
        </section>
      </div>
    </dialog>
  );
}
