# Interactive Violin

A browser-based violin built with React, TypeScript, Tone.js, and tonal — an interactive fingerboard with bowed and pizzicato playback, swappable tunings, and a live microphone pitch detector.

## Features

- **Interactive fingerboard** — four strings, with a **Semitone** mode (13 tempered positions, open string through an octave) and a **Quarter-tone** mode (25 positions at 24-EDO / 50-cent steps, common in Arabic/Turkish/Persian maqam practice). Hold a cell to sustain a bowed note, or tap to pluck pizzicato. Quarter-tone cells are shown with a dashed border and labeled as the note below raised a quarter tone (e.g. `F4+`).
- **Two playback modes**
  - **Bow** — a sustained `Tone.Synth` voice with a slow attack, held for as long as you press.
  - **Pizzicato** — a `Tone.PluckSynth` (Karplus-Strong string synthesis) triggered on tap.
- **Maqam scale-degree highlighting** — pick from 9 common maqamat (Bayati, Rast, Hijaz, Nahawand, Kurd, Sikah, Saba, Ajam, Nikriz) and every fingerboard cell whose pitch belongs to that maqam is highlighted with a golden ring and dot, on **both** the Violin and Oud fingerboards. Definitions live in `src/lib/maqam-theory.ts` (shared, instrument-agnostic). Picking a maqam with quarter-tone degrees (e.g. Bayati's half-flat 2nd) auto-switches the fingerboard to Quarter-tone resolution so those notes actually render.
- **Ajnas (tetrachord) breakdown** — each maqam links to the 1–2 *ajnas* (sing. jins) it's built from, e.g. Bayati = Jins Bayati (lower, on the tonic) + Jins Nahawand (upper, on the 5th). A common-ajnas library (Rast, Bayati, Hijaz, Kurd, Nahawand, Nikriz, Ajam, Saba, Sikah) lives alongside the maqamat in `src/lib/maqam-theory.ts`; the note names for each jins are derived on the fly for whichever maqam is selected, shown in the Maqam panel under the fingerboard.
- **Play Maqam button** — plays the selected maqam's scale degrees in ascending order through the current instrument's own audio engine (bow/pluck for Violin, risha/tremolo for Oud), on a dedicated voice independent of any string. Implemented generically in `src/lib/maqam-playback.ts` so it works with any instrument's audio engine.
- **Mobile-first responsive layout** — instrument and view switching use a real `Tabs` component (full-width, stacked on narrow screens), controls wrap into stacked groups instead of a single overflowing row, the maqam selector becomes a horizontally scrollable chip row on small screens, and fingerboards keep their natural horizontal scroll with a "scroll to see more" hint on mobile.
- **Swappable tunings**
  - **Standard** — G3 · D4 · A4 · E5
  - **Eastern (G-D-G-D)** — G3 · D4 · G4 · D5
  - Adding another tuning is a one-line addition to the `TUNINGS` array (see [Adding a tuning](#adding-a-tuning)).
- **Open-string tuner** — one-tap playback of each open string in the current tuning.
- **Pitch detection mode** — uses the microphone and an autocorrelation algorithm (no external pitch library) to detect the fundamental frequency of whatever note is played, then reports:
  - Note name (e.g. `A4`, or `F4+` for a quarter tone in Quarter-tone resolution)
  - MIDI number
  - Frequency in Hz
  - Cents deviation from the nearest resolved pitch (±50¢ window in Semitone mode, ±25¢ in Quarter-tone mode), plus a simple in-tune gauge

## Tech stack

| Purpose | Library |
|---|---|
| UI framework | React + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Component primitives | shadcn/ui-style `Button`, `Card`, `Tabs` (`@radix-ui/react-tabs`), `Tooltip` (`@radix-ui/react-tooltip`) — hand-written, styled to the app's design tokens |
| Music theory (note names, transposition, frequency ↔ note conversion) | [tonal](https://github.com/tonaljs/tonal) |
| Audio synthesis | [Tone.js](https://tonejs.github.io/) |
| Pitch detection | Custom autocorrelation (ACF2+) over the Web Audio API |

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in a browser. For **pitch detection**, the browser will prompt for microphone access — this requires a secure context (`localhost` works; a deployed build needs `https`).

```bash
npm run build   # type-checks and produces a production build in dist/
```

## Project structure

```
src/
├── App.tsx                        # Top-level layout: Play/Pitch-detect tabs, mode + tuning controls
├── index.css                      # Tailwind entry + violin color tokens (--color-violin-*)
├── components/
│   ├── violin_fingerboard.tsx     # The interactive string/position grid
│   ├── violin_tuner.tsx           # Open-string playback buttons
│   ├── pitch_tuner.tsx            # Mic-based pitch detection readout
│   ├── oud-page.tsx               # Oud tab: tuning/resolution controls + fingerboard
│   ├── oud-fingerboard.tsx        # Oud course/position grid, maqam-aware
│   ├── maqam-panel.tsx            # Shared: maqam selector, ajnas breakdown, Play Maqam button
│   └── ui/
│       ├── button.tsx             # shadcn-style Button primitive
│       ├── card.tsx               # shadcn-style Card/CardHeader/CardContent primitives
│       ├── tabs.tsx                # shadcn-style Tabs, wrapping @radix-ui/react-tabs
│       └── tooltip.tsx            # shadcn-style Tooltip, wrapping @radix-ui/react-tooltip
├── hooks/
│   └── use_pitch_detector.ts      # Mic capture + detection loop (getUserMedia, AnalyserNode, rAF)
└── lib/
    ├── violin_theory.ts           # Tunings, note/frequency helpers, frequency → note analysis
    ├── violin_audio.ts            # Tone.js synths (bow + pluck) per string
    ├── maqam_theory.ts            # Maqamat + ajnas presets, isNoteInMaqam(), shared by Violin and Oud
    ├── maqam_playback.ts          # playMaqamSequence() — sequences a maqam through any instrument's audio engine
    └── pitch_detection.ts         # Autocorrelation fundamental-frequency estimator
```

## How it works

### Fingerboard and audio

Each string keeps one persistent `Tone.Synth` (bow) and one `Tone.PluckSynth` (pizzicato) in a singleton `ViolinAudioEngine`, so retriggering a string doesn't recreate synths. `tonal`'s `Note.transpose` computes the note name at each semitone position from the string's open note, and `Note.freq` converts that name to a frequency for playback.

### Tunings

A tuning is just four open-string notes, low to high:

```ts
{ id: "eastern", label: "Eastern (G-D-G-D)", description: "G3 · D4 · G4 · D5", notes: ["G3", "D4", "G4", "D5"] }
```

`buildStrings(tuning)` turns that into the `ViolinString[]` the fingerboard and tuner render, deriving each string's display label (`G`, `D`, …) from its open note via `Note.get(openNote).pc`. String position keeps a fixed accent color regardless of tuning.

#### Adding a tuning

Add an entry to `TUNINGS` in `src/lib/violin_theory.ts`:

```ts
export const TUNINGS: TuningPreset[] = [
  // ...existing tunings
  { id: "my-tuning", label: "My Tuning", description: "…", notes: ["G3", "D4", "A4", "D5"] },
];
```

It will automatically appear as a button in the tuning selector.

### Quarter tones

The fingerboard's **Resolution** toggle switches between:

- **Semitone** — 12-EDO, one cell per half step (`stepsFor` yields whole-number steps `0, 1, 2, …`).
- **Quarter-tone** — 24-EDO, one cell per 50-cent step (`stepsFor` yields half-integer steps `0, 0.5, 1, 1.5, …`).

`frequencyAtStep(openNote, step)` computes pitch directly from cents (`freq × 2^(step/12)`), so quarter-tone frequencies fall exactly halfway between their semitone neighbors. `labelAtStep` names whole steps with `tonal`'s standard note names, and half-integer steps as the note below with a trailing `+` (half-sharp) — e.g. the quarter tone between F4 and F#4 is labeled `F4+`.

The pitch detector has the same toggle: in Quarter-tone mode, `analyzeFrequency` snaps the detected pitch to the nearest 24-EDO step instead of the nearest semitone, and narrows the in-tune window and cents display to match (±25¢ instead of ±50¢).

### Pitch detection

`usePitchDetector` requests microphone access, feeds the raw time-domain samples from an `AnalyserNode` into `detectPitch` (autocorrelation with parabolic interpolation for sub-sample accuracy) on every animation frame, and returns the estimated frequency. `analyzeFrequency` then converts that frequency to a MIDI number (`69 + 12·log2(f / 440)`), a note name (`Note.fromMidi`), and a cents offset from the nearest tempered pitch.

**Limitations:** this is a single-voice pitch tracker — it estimates one fundamental frequency per frame, so it isn't reliable on double-stops or chords, and very quiet or noisy input is discarded rather than guessed at.

## Browser requirements

- Web Audio API (all modern browsers)
- Microphone access for pitch detection (requires `localhost` or `https`)
- No IE11 support