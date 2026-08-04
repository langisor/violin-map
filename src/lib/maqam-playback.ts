import { Note } from "tonal";
import type { MaqamPreset } from "@/lib/maqam-theory";

// A generic shape any instrument's audio engine satisfies (ViolinAudioEngine,
// OudAudioEngine, ...), so "Play Maqam" works on whichever fingerboard is active
// without depending on a specific instrument.
export interface SequencableAudioEngine<Mode extends string> {
  noteOn(voiceId: string, frequency: number, mode: Mode): Promise<void> | void;
  noteOff(voiceId: string, mode: Mode): void;
}

const MAQAM_VOICE_ID = "maqam-sequence";
const NOTE_MS = 1000;
const GAP_MS = 70;

/**
 * Plays a maqam's scale degrees (tonic to octave) in ascending order on a
 * dedicated voice, independent of any specific string. Returns a stop()
 * function that cancels any notes still queued and releases the current one.
 */
export function playMaqamSequence<Mode extends string>(
  maqam: MaqamPreset,
  engine: SequencableAudioEngine<Mode>,
  mode: Mode,
  octave = 4,
  onStep?: (index: number) => void,
  onDone?: () => void,
): () => void {
  const tonicFreq = Note.freq(`${maqam.tonic}${octave}`) ?? 440;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let stopped = false;

  maqam.intervals.forEach((interval, i) => {
    const attackAt = i * (NOTE_MS + GAP_MS);
    timers.push(
      setTimeout(() => {
        if (stopped) return;
        const frequency = tonicFreq * 2 ** (interval / 12);
        void engine.noteOn(MAQAM_VOICE_ID, frequency, mode);
        onStep?.(i);
        timers.push(
          setTimeout(() => {
            if (!stopped) engine.noteOff(MAQAM_VOICE_ID, mode);
          }, NOTE_MS),
        );
      }, attackAt),
    );
  });

  const totalMs = maqam.intervals.length * (NOTE_MS + GAP_MS);
  timers.push(
    setTimeout(() => {
      if (!stopped) onDone?.();
    }, totalMs),
  );

  return () => {
    if (stopped) return;
    stopped = true;
    timers.forEach(clearTimeout);
    engine.noteOff(MAQAM_VOICE_ID, mode);
  };
}
