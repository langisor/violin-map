# Interactive Violin

A browser-based violin built with React, TypeScript, Tone.js, and tonal — an interactive fingerboard with bowed and pizzicato playback, swappable tunings, and a live microphone pitch detector.

## Features

- **Interactive fingerboard** — four strings, 13 chromatic positions each (open string through a full octave). Hold a cell to sustain a bowed note, or tap to pluck pizzicato.
- **Two playback modes**
  - **Bow** — a sustained `Tone.Synth` voice with a slow attack, held for as long as you press.
  - **Pizzicato** — a `Tone.PluckSynth` (Karplus-Strong string synthesis) triggered on tap.
- **Swappable tunings**
  - **Standard** — G3 · D4 · A4 · E5
  - **Eastern (G-D-G-D)** — G3 · D4 · G4 · D5
  - Adding another tuning is a one-line addition to the `TUNINGS` array (see [Adding a tuning](#adding-a-tuning)).
- **Open-string tuner** — one-tap playback of each open string in the current tuning.
- **Pitch detection mode** — uses the microphone and an autocorrelation algorithm (no external pitch library) to detect the fundamental frequency of whatever note is played, then reports:
  - Note name (e.g. `A4`)
  - MIDI number
  - Frequency in Hz
  - Cents deviation from the nearest tempered pitch, plus a simple in-tune gauge

## Tech stack

| Purpose | Library |
|---|---|
| UI framework | React + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Component primitives | shadcn/ui-style `Button` (hand-written, `cva`-based) |
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
│   └── ui/
│       └── button.tsx             # shadcn-style Button primitive
├── hooks/
│   └── use_pitch_detector.ts      # Mic capture + detection loop (getUserMedia, AnalyserNode, rAF)
└── lib/
    ├── violin_theory.ts           # Tunings, note/frequency helpers, frequency → note analysis
    ├── violin_audio.ts            # Tone.js synths (bow + pluck) per string
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

### Pitch detection

`usePitchDetector` requests microphone access, feeds the raw time-domain samples from an `AnalyserNode` into `detectPitch` (autocorrelation with parabolic interpolation for sub-sample accuracy) on every animation frame, and returns the estimated frequency. `analyzeFrequency` then converts that frequency to a MIDI number (`69 + 12·log2(f / 440)`), a note name (`Note.fromMidi`), and a cents offset from the nearest tempered pitch.

**Limitations:** this is a single-voice pitch tracker — it estimates one fundamental frequency per frame, so it isn't reliable on double-stops or chords, and very quiet or noisy input is discarded rather than guessed at.

## Browser requirements

- Web Audio API (all modern browsers)
- Microphone access for pitch detection (requires `localhost` or `https`)
- No IE11 support