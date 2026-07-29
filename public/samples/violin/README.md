# Violin samples

Drop real recorded violin note files here and the app's "Sound → Sampled"
toggle will light up automatically — no code changes needed. The manifest
lives in `src/lib/instrument-samplers.ts` if you ever want to add/rename
notes.

## Exact files expected

| Note | Filename |
|---|---|
| G3 | `G3.mp3` |
| B3 | `B3.mp3` |
| D#4 | `D#4.mp3` |
| G4 | `G4.mp3` |
| B4 | `B4.mp3` |
| D#5 | `D#5.mp3` |
| G5 | `G5.mp3` |
| B5 | `B5.mp3` |

These are spaced a major third (4 semitones) apart across the fingerboard's
full range (G3–E6, i.e. the four open strings G3/D4/A4/E5 each plus an
octave). Tone.Sampler pitch-shifts smoothly between them, so you do **not**
need a fully chromatic recording — this set is enough for convincing
quality without a huge session. If you only have a subset (e.g. just the
4 open strings), add those; the Sampler will only report "ready" once
every file in the manifest above loads successfully, so trim the manifest
in `instrument-samplers.ts` to match whatever you actually have.

Any recorded note works as long as the pitch is centered on the file
(no long lead-in) and it's a clean mono or stereo mp3 — bowed sustained
notes or plucked pizzicato both work fine; pick whichever matches how
you'll mostly use the "Sampled" mode (Bow vs Pizzicato in the app doesn't
switch samples, since it's the same recording either way once you're in
Sampled mode).

## Where to get real recordings

- **University of Iowa Electronic Music Studios — Musical Instrument
  Samples**: chromatic solo violin, multiple dynamics/articulations
  (arco + pizzicato), free for any use.
  http://theremin.music.uiowa.edu/MISviolin.html
- **Philharmonia Orchestra sound samples**: free violin samples across
  the full range, several articulations. License: free to use as-is or
  as part of a larger work (including commercial), the only restriction
  is you can't resell the raw samples or a sampler instrument built
  purely from them. https://philharmonia.co.uk/resources/sound-samples/
  (mirror if the main site is slow: https://github.com/skratchdot/philharmonia-samples)

Either source has far more notes than you need — just download the ones
matching the table above (or close to it; you can rename files) and drop
them in this folder.
