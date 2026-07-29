# Oud samples

Drop real recorded oud note files here and the app's "Sound → Sampled"
toggle will light up automatically — no code changes needed. The manifest
lives in `src/lib/instrument-samplers.ts` if you want to add/rename notes.

## Exact files expected

| Note | Filename |
|---|---|
| C2 | `C2.mp3` |
| E2 | `E2.mp3` |
| G#2 | `G#2.mp3` |
| C3 | `C3.mp3` |
| E3 | `E3.mp3` |
| G#3 | `G#3.mp3` |
| C4 | `C4.mp3` |
| E4 | `E4.mp3` |
| G#4 | `G#4.mp3` |
| C5 | `C5.mp3` |

Spaced a major third (4 semitones) apart, spanning the lowest course up
through the highest fretted positions (C2–C5) across the tunings in the
app. As with the violin, you don't need every note — trim the manifest
in `instrument-samplers.ts` to match whatever set you actually record or
find; the Sampler only reports "ready" once every listed file loads.

## Where to get real recordings — be aware this is harder than violin

Unlike the violin, there isn't a well-known, free, chromatically-sampled
oud library equivalent to the University of Iowa or Philharmonia sets.
Realistic options, roughly best-to-worst for this use case:

1. **Freesound.org** — search "oud note" or "oud single note". It's a
   community-contributed, Creative-Commons-licensed library, so check
   the license on each individual sound: CC0 and CC-BY are fine for any
   use (CC-BY needs attribution credited somewhere in your project);
   CC-BY-NC is not usable if you ever plan to charge for or monetize
   the app. https://freesound.org

2. **Versilian Community Sample Library (VCSL)** — a large, CC0
   (public-domain-equivalent), free "world instruments" library. I
   couldn't confirm from here whether their current build includes an
   oud specifically (their lute-family instruments are organized under
   "Chordophones" in the repo), so it's worth 5 minutes to check
   yourself: https://github.com/sgossner/VCSL — browse the
   `Chordophones` folder, or ask in their community if oud is planned.

3. **Paid, small-cost sample packs** — e.g. searching "oud" on
   Splice, LANDR Samples, or Sample Focus turns up individual note/loop
   packs from a few dollars up; check each pack specifically has
   *single sustained notes* (not just phrases/loops) if you want them
   pitch-mapped like a real instrument here.

4. **Record it yourself** — often the most reliable path for oud
   specifically, and not as hard as it sounds:
   - Quiet room, phone or any USB mic, free software like
     [Audacity](https://www.audacityteam.org/).
   - Play and record each note in the table above (or as many as you
     can reach), letting each ring for 2-3 seconds before muting the
     string.
   - Trim silence at the start/end, normalize volume across notes so
     none clip or sound much quieter than the others, export each as
     its own mp3 named exactly as in the table (e.g. `C3.mp3`).
   - Drop the files in this folder — done, no other steps.

Any of these gets you real, characterful oud tone instead of the
built-in Tone.js pluck synth, and the Sampler will pitch-shift smoothly
between whichever notes you provide.
