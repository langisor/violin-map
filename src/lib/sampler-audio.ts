import * as Tone from "tone";
import { Note } from "tonal";

export type SamplerStatus = "loading" | "ready" | "error" | "empty";

/** Anything that can report a load status, for the toggle UI (useSamplerStatus, SoundSourceToggle). */
export interface StatusReportingSampler {
 readonly status: SamplerStatus;
 onStatusChange(fn: (status: SamplerStatus) => void): () => void;
}

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
export class SamplerEngine implements StatusReportingSampler {
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

// --- Multi-region sampler -------------------------------------------------
//
// Real strings/courses each have their own recorded timbre, so instead of
// one Tone.Sampler pitch-shifted across an instrument's entire range, each
// string/course gets its own small Tone.Sampler loaded from its own folder
// (see public/samples/violin/string-*/README.txt and
// public/samples/oud/course-*/README.txt). MultiSamplerEngine wraps one
// SamplerEngine per region and routes noteOn/noteOff to the right one.

export interface SamplerRegion {
 /** Must match the voiceId the fingerboard/tuner uses for this string/course, e.g. "str0" or "oud_str2". */
 id: string;
 /** Folder this region's samples live in, e.g. "/samples/violin/string-1/". Must end with "/". */
 baseUrl: string;
 /** Maps a note name (e.g. "G3", "Bb3") to a filename relative to baseUrl. */
 urls: Record<string, string>;
}

export interface MultiSamplerConfig {
 regions: SamplerRegion[];
 /** Release time in seconds applied when a note is let go. */
 release?: number;
}

interface LoadedRegion {
 engine: SamplerEngine;
 minFreq: number;
 maxFreq: number;
}

/**
 * Composes several SamplerEngines — one per string/course — behind the same
 * noteOn(voiceId, frequency, mode) / noteOff(voiceId, mode) shape a single
 * SamplerEngine exposes, so it's a drop-in for ViolinFingerboard/OudFingerboard/
 * tuners/Play-Maqam exactly like SamplerEngine was.
 *
 * - When voiceId matches a region's id exactly (the normal case — fingerboard
 *   presses and tuners pass the string/course id), that region's sampler plays.
 * - Otherwise (the Play Maqam sequencer's voice isn't tied to any one string)
 *   the region whose recorded note range is closest to the requested frequency
 *   is used instead, so the sequence still sounds like real recorded notes.
 *
 * Overall status is "ready" only once every region has loaded; "error" if any
 * region failed; "loading" while any region is still fetching; "empty" if no
 * regions were configured at all.
 */
export class MultiSamplerEngine implements StatusReportingSampler {
 status: SamplerStatus;
 private regions: Map<string, LoadedRegion> = new Map();
 private heldRegions: Map<string, string> = new Map(); // voiceId -> regionId
 private listeners: Set<(status: SamplerStatus) => void> = new Set();

 constructor(config: MultiSamplerConfig) {
  if (config.regions.length === 0) {
   this.status = "empty";
   return;
  }

  this.status = "loading";
  config.regions.forEach((region) => {
   const engine = new SamplerEngine({
    urls: region.urls,
    baseUrl: region.baseUrl,
    release: config.release,
   });
   const freqs = Object.keys(region.urls)
    .map((name) => Note.freq(name))
    .filter((f): f is number => typeof f === "number");
   const minFreq = freqs.length ? Math.min(...freqs) : 0;
   const maxFreq = freqs.length ? Math.max(...freqs) : 0;
   this.regions.set(region.id, { engine, minFreq, maxFreq });
   engine.onStatusChange(() => this.recomputeStatus());
  });
  this.recomputeStatus();
 }

 private recomputeStatus() {
  const statuses = Array.from(this.regions.values()).map((r) => r.engine.status);
  let next: SamplerStatus;
  if (statuses.every((s) => s === "ready")) next = "ready";
  else if (statuses.some((s) => s === "error")) next = "error";
  else if (statuses.some((s) => s === "loading")) next = "loading";
  else next = "empty";

  if (next !== this.status) {
   this.status = next;
   this.listeners.forEach((fn) => fn(next));
  }
 }

 /** Subscribe to load-status changes. Returns an unsubscribe function. */
 onStatusChange(fn: (status: SamplerStatus) => void): () => void {
  this.listeners.add(fn);
  return () => this.listeners.delete(fn);
 }

 /** Finds the region to use for a voiceId: exact id match, else nearest by recorded frequency range. */
 private pickRegionId(voiceId: string, frequency: number): string | null {
  if (this.regions.has(voiceId)) return voiceId;

  let closestId: string | null = null;
  let closestDistance = Infinity;
  for (const [id, region] of this.regions) {
   const distance =
    frequency < region.minFreq
     ? region.minFreq - frequency
     : frequency > region.maxFreq
      ? frequency - region.maxFreq
      : 0;
   if (distance < closestDistance) {
    closestDistance = distance;
    closestId = id;
   }
  }
  return closestId;
 }

 async noteOn(voiceId: string, frequency: number, mode?: string) {
  if (this.status !== "ready") return;
  const regionId = this.pickRegionId(voiceId, frequency);
  if (!regionId) return;
  const region = this.regions.get(regionId);
  if (!region) return;
  this.heldRegions.set(voiceId, regionId);
  await region.engine.noteOn(voiceId, frequency, mode);
 }

 noteOff(voiceId: string, mode?: string) {
  const regionId = this.heldRegions.get(voiceId);
  if (!regionId) return;
  this.regions.get(regionId)?.engine.noteOff(voiceId, mode);
  this.heldRegions.delete(voiceId);
 }

 dispose() {
  this.regions.forEach((r) => r.engine.dispose());
  this.regions.clear();
  this.heldRegions.clear();
  this.listeners.clear();
 }
}
