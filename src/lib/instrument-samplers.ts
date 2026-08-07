import { MultiSamplerEngine, type SamplerRegion } from "@/lib/sampler-audio";

/**
 * Real recorded samples, one small folder per string/course, matching the
 * README.txt dropped in each `public/samples/<instrument>/<region>/` folder.
 * Each region gets its own Tone.Sampler (see MultiSamplerEngine) rather than
 * one sampler pitch-shifted across the whole instrument, since a violin's G
 * string and E string (or an oud's bass and top course) don't sound like each
 * other — only like themselves at other pitches. Five notes per region, a
 * minor third apart, covers the practical range of that string/course with
 * Tone.Sampler's built-in pitch-shifting for anything in between.
 *
 * region id must match the voiceId ViolinFingerboard/ViolinTuner (str0..str3)
 * and OudFingerboard/OudTuner (oud_str0..oud_str5) already use — see
 * buildStrings() in violin-theory.ts and buildOudStrings() in oud-theory.ts.
 *
 * Drop the mp3 files named in each folder's README.txt into that folder (no
 * code changes needed) and the app will pick them up automatically.
 */
const VIOLIN_STRING_REGIONS: SamplerRegion[] = [
 {
  // G string — public/samples/violin/string-1/README.txt
  id: "str0",
  baseUrl: "/samples/violin/string-1/",
  urls: { G3: "G3.mp3", Bb3: "Bb3.mp3", Db4: "Db4.mp3", E4: "E4.mp3", G4: "G4.mp3" },
 },
 {
  // D string — public/samples/violin/string-2/README.txt
  id: "str1",
  baseUrl: "/samples/violin/string-2/",
  urls: { D4: "D4.mp3", F4: "F4.mp3", Ab4: "Ab4.mp3", B4: "B4.mp3", D5: "D5.mp3" },
 },
 {
  // A string — public/samples/violin/string-3/README.txt
  id: "str2",
  baseUrl: "/samples/violin/string-3/",
  urls: { A4: "A4.mp3", C5: "C5.mp3", Eb5: "Eb5.mp3", Gb5: "Gb5.mp3", A5: "A5.mp3" },
 },
 {
  // E string — public/samples/violin/string-4/README.txt
  id: "str3",
  baseUrl: "/samples/violin/string-4/",
  urls: { E5: "E5.mp3", G5: "G5.mp3", Bb5: "Bb5.mp3", Db6: "Db6.mp3", E6: "E6.mp3" },
 },
];

const OUD_COURSE_REGIONS: SamplerRegion[] = [
 {
  // Course 1, lowest — public/samples/oud/course-1/README.txt
  id: "oud_str0",
  baseUrl: "/samples/oud/course-1/",
  urls: { C2: "C2.mp3", Eb2: "Eb2.mp3", Gb2: "Gb2.mp3", A2: "A2.mp3", C3: "C3.mp3" },
 },
 {
  // Course 2 — public/samples/oud/course-2/README.txt
  id: "oud_str1",
  baseUrl: "/samples/oud/course-2/",
  urls: { F2: "F2.mp3", Ab2: "Ab2.mp3", B2: "B2.mp3", D3: "D3.mp3", F3: "F3.mp3" },
 },
 {
  // Course 3 — public/samples/oud/course-3/README.txt
  id: "oud_str2",
  baseUrl: "/samples/oud/course-3/",
  urls: { A2: "A2.mp3", C3: "C3.mp3", Eb3: "Eb3.mp3", Gb3: "Gb3.mp3", A3: "A3.mp3" },
 },
 {
  // Course 4 — public/samples/oud/course-4/README.txt
  id: "oud_str3",
  baseUrl: "/samples/oud/course-4/",
  urls: { D3: "D3.mp3", F3: "F3.mp3", Ab3: "Ab3.mp3", B3: "B3.mp3", D4: "D4.mp3" },
 },
 {
  // Course 5 — public/samples/oud/course-5/README.txt
  id: "oud_str4",
  baseUrl: "/samples/oud/course-5/",
  urls: { G3: "G3.mp3", Bb3: "Bb3.mp3", Db4: "Db4.mp3", E4: "E4.mp3", G4: "G4.mp3" },
 },
 {
  // Course 6, highest — public/samples/oud/course-6/README.txt
  id: "oud_str5",
  baseUrl: "/samples/oud/course-6/",
  urls: { C4: "C4.mp3", Eb4: "Eb4.mp3", Gb4: "Gb4.mp3", A4: "A4.mp3", C5: "C5.mp3" },
 },
];

export const violinSamplerEngine = new MultiSamplerEngine({
 regions: VIOLIN_STRING_REGIONS,
});

export const oudSamplerEngine = new MultiSamplerEngine({
 regions: OUD_COURSE_REGIONS,
});
