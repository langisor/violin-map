import * as Tone from "tone";

export type SamplerStatus = "loading" | "ready" | "error" | "empty";

export interface SamplerConfig {
  /** Maps a note name (e.g. "D3", "A4") to a filename relative to baseUrl. */
  urls: Record<string, string>;
  /** Folder the sample files live in, e.g. "/samples/violin/". Must end with "/". */
  baseUrl: string;
  /** Release time in seconds applied when a note is let go. */
  release?: number;
}

/**
 * Wraps a Tone.Sampler behind the same noteOn(voiceId, frequency, mode) /
 * noteOff(voiceId, mode) shape the hand-written synth engines
 * (ViolinAudioEngine, OudAudioEngine) use, so it's a drop-in alternative
 * anywhere an instrument's engine is expected: fingerboard presses, tuners,
 * and the Play Maqam sequencer. `mode` is accepted but ignored — the
 * character of a sampled instrument comes from the recording itself, not a
 * synthesis parameter.
 *
 * If `urls` is empty, the engine reports status "empty" immediately and
 * every noteOn/noteOff is a no-op, so callers can safely fall back to a
 * synth engine without special-casing "no samples yet".
 */
export class SamplerEngine {
  status: SamplerStatus;
  private sampler: Tone.Sampler | null = null;
  private started = false;
  private heldNotes: Map<string, number> = new Map(); // voiceId -> frequency
  private listeners: Set<(status: SamplerStatus) => void> = new Set();

  constructor(config: SamplerConfig) {
    if (Object.keys(config.urls).length === 0) {
      console.log("SamplerEngine-Constructor: Empty config:SamplerConfig...")
      this.status = "empty";
      return;
    }

    this.status = "loading";
    this.sampler = new Tone.Sampler({
      urls: config.urls,
      baseUrl: config.baseUrl,
      release: config.release ?? 0.6,
      onload: () => this.setStatus("ready"),
      onerror: (err) => {
        console.warn("[SamplerEngine] failed to load samples:", err);
        this.setStatus("error");
      },
    }).toDestination();
  }

  private setStatus(status: SamplerStatus) {
    this.status = status;
    this.listeners.forEach((fn) => fn(status));
  }

  /** Subscribe to load-status changes (loading -> ready | error). Returns an unsubscribe function. */
  onStatusChange(fn: (status: SamplerStatus) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async ensureStarted() {
    if (!this.started) {
      console.log("ensureStarted: Tone.start()....")
      await Tone.start();
      this.started = true;
    }
  }

  async noteOn(voiceId: string, frequency: number, _mode?: string) {
    if (this.status !== "ready" || !this.sampler) return;
    await this.ensureStarted();
    this.heldNotes.set(voiceId, frequency);
    this.sampler.triggerAttack(frequency);
  }

  noteOff(voiceId: string, _mode?: string) {
    if (this.status !== "ready" || !this.sampler) return;
    const frequency = this.heldNotes.get(voiceId);
    if (frequency === undefined) return;
    this.sampler.triggerRelease(frequency);
    this.heldNotes.delete(voiceId);
  }

  dispose() {
    this.sampler?.dispose();
    this.heldNotes.clear();
    this.listeners.clear();
  }
}
