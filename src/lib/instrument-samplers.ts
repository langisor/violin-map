import { SamplerEngine } from "@/lib/sampler-audio";

/**
 * Which note names the Violin sampler expects, and the filename for each
 * inside public/samples/violin/. Tone.Sampler pitch-shifts everything
 * in between, so this doesn't need to be a fully chromatic set — every
 * major third (4 semitones) across the fingerboard's range (G3-E6) gives
 * good quality without asking for a huge recording session.
 *
 * Drop matching mp3 files into public/samples/violin/ (no code changes
 * needed) and the app will pick them up automatically. See
 * public/samples/violin/README.md and the "Finding real samples" section
 * of the project README for where to source or record them.
 */
export const VIOLIN_SAMPLE_URLS: Record<string, string> = {
  G3: "G3.mp3",
  B3: "B3.mp3",
  B5: "B5.mp3",
  B4: "B4.mp3",
  // "D#4": "D#4.mp3",
  // "D5": "D5.mp3",
  G4: "G4.mp3",
  G5: "G5.mp3",
};

/**
 * Same idea for the Oud, spanning its lowest course up through the
 * highest fretted positions (C2-C5). See public/samples/oud/README.md.
 */
export const OUD_SAMPLE_URLS: Record<string, string> = {
  A2: "A2.mp3",
  B2: "B2.mp3",
  // Cs4: "Cs4.mp3",
  D3: "D3.mp3",
  E3: "E3.mp3",
  G3: "G3.mp3",
  // Fs2: "Fs2.mp3",
};

export const violinSamplerEngine = new SamplerEngine({
  urls: VIOLIN_SAMPLE_URLS,
  baseUrl: "/samples/violin/",
});

export const oudSamplerEngine = new SamplerEngine({
  urls: OUD_SAMPLE_URLS,
  baseUrl: "/samples/oud/",
});
