# Interactive String Lab

A browser-based violin and oud built with React, TypeScript, Tone.js, and tonal — interactive fingerboards with bowed and pizzicato playback, swappable tunings, a live microphone pitch detector, maqam theory support, and a full-featured metronome with Arabic iqa'at.

## Features

- **Interactive fingerboard** — four strings, with a **Semitone** mode (13 tempered positions, open string through an octave) and a **Quarter-tone** mode (25 positions at 24-EDO / 50-cent steps, common in Arabic/Turkish/Persian maqam practice). Hold a cell to sustain a bowed note, or tap to pluck pizzicato. Quarter-tone cells are shown with a dashed border and labeled as the note below raised a quarter tone (e.g. `F4+`).
- **Two playback modes**
  - **Bow** — a sustained `Tone.Synth` voice with a slow attack, held for as long as you press.
  - **Pizzicato** — a `Tone.PluckSynth` (Karplus-Strong string synthesis) triggered on tap.
- **Maqam scale-degree highlighting** — pick from 9 common maqamat (Bayati, Rast, Hijaz, Nahawand, Kurd, Sikah, Saba, Ajam, Nikriz) and every fingerboard cell whose pitch belongs to that maqam is highlighted with a golden ring and dot, on **both** the Violin and Oud fingerboards. Definitions live in `src/lib/maqam-theory.ts` (shared, instrument-agnostic). Picking a maqam with quarter-tone degrees (e.g. Bayati's half-flat 2nd) auto-switches the fingerboard to Quarter-tone resolution so those notes actually render.
- **Ajnas (tetrachord) breakdown** — each maqam links to the 1–2 *ajnas* (sing. jins) it's built from, e.g. Bayati = Jins Bayati (lower, on the tonic) + Jins Nahawand (upper, on the 5th). A common-ajnas library (Rast, Bayati, Hijaz, Kurd, Nahawand, Nikriz, Ajam, Saba, Sikah) lives alongside the maqamat in `src/lib/maqam-theory.ts`; the note names for each jins are derived on the fly for whichever maqam is selected, shown in the Maqam panel under the fingerboard.
- **Play Maqam button** — plays the selected maqam's scale degrees in ascending order through the current instrument's own audio engine (bow/pluck for Violin, risha/tremolo for Oud), on a dedicated voice independent of any string. Implemented generically in `src/lib/maqam-playback.ts` so it works with any instrument's audio engine.
- **Mobile-first responsive layout** — instrument and view switching use a real `Tabs` component (full-width, stacked on narrow screens), controls wrap into stacked groups instead of a single overflowing row, the maqam selector becomes a horizontally scrollable chip row on small screens, and fingerboards keep their natural horizontal scroll with a "scroll to see more" hint on mobile.
- **Real recorded samples (optional)** — a **Sound** toggle (Synth / Sampled) next to the mode controls lets you switch each instrument from its synthesized voice to your own recorded notes. Samples are organized one small folder per string (Violin) or course (Oud), each with its own `README.txt` listing the five note files to drop in — see [Adding your own samples](#adding-your-own-samples). The "Sampled" button is disabled until every folder's files have loaded.
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
- **Full-featured metronome** — a dedicated metronome view with:
  - **Western time signatures** — common meters (2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, 12/8) with adjustable subdivisions (quarter, eighth, triplet, sixteenth notes)
  - **Arabic iqa'at (rhythmic cycles)** — 10 traditional Middle Eastern rhythms (Maqsum, Baladi, Saidi, Malfuf, Ayyub, Wahda, Masmoudi Kebir, Chiftetelli, Karsilama, Samai Thaqil) with authentic Dum (low) and Tak (high) sounds
  - **Custom pattern editor** — create your own rhythms with a clickable beat grid, supporting both Western clicks and Arabic percussion voices
  - **Pattern library** — save, load, rename, and delete custom patterns to localStorage
  - **Transport controls** — BPM slider (30-260), tap tempo, fine adjustment buttons (±5, ±10), and volume control
  - **Practice timer** — set session goals with preset durations (5-60 minutes) or custom values, track elapsed time, auto-log completed sessions, and view practice history with daily/weekly totals
  - **Live beat visualization** — real-time highlighting of the current step in the pattern grid

## Tech stack

| Purpose | Library |
| --- | --- |
| UI framework | React + TypeScript |
| Build tool | Vite |
| Package manager | pnpm |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Component primitives | shadcn/ui-style `Button`, `Card`, `Tabs` (`@radix-ui/react-tabs`), `Tooltip` (`@radix-ui/react-tooltip`), `Dialog` (`@base-ui/react/dialog`), `Slider`, `Switch`, `Progress`, `Badge`, `Label`, `Input`, `Separator` — hand-written, styled to the app's design tokens |
| Music theory (note names, transposition, frequency ↔ note conversion) | [tonal](https://github.com/tonaljs/tonal) |
| Audio synthesis | [Tone.js](https://tonejs.github.io/) |
| Pitch detection | Custom autocorrelation (ACF2+) over the Web Audio API |
| Metronome audio | Web Audio API (sample-accurate scheduling with look-ahead) |

## Getting started

```bash
pnpm install
pnpm run dev
```

Then open the printed local URL in a browser. For **pitch detection**, the browser will prompt for microphone access — this requires a secure context (`localhost` works; a deployed build needs `https`).

```bash
pnpm run build   # type-checks and produces a production build in dist/
```

## Project structure

```bash
src/
├── App.tsx                        # Top-level layout: Play/Pitch-detect/Metronome tabs, mode + tuning controls
├── index.css                      # Tailwind entry + violin color tokens (--color-violin-*)
├── components/
│   ├── violin_fingerboard.tsx     # The interactive string/position grid
│   ├── violin_tuner.tsx           # Open-string playback buttons
│   ├── pitch_tuner.tsx            # Mic-based pitch detection readout
│   ├── oud-page.tsx               # Oud tab: tuning/resolution controls + fingerboard
│   ├── oud-fingerboard.tsx        # Oud course/position grid, maqam-aware
│   ├── maqam-panel.tsx            # Shared: maqam selector, ajnas breakdown, Play Maqam button
│   ├── metronome/                 # Metronome components
│   │   ├── metronome.tsx          # Main metronome component with state management
│   │   ├── beat-grid.tsx          # Visual grid showing pattern steps with current step highlight
│   │   ├── transport-controls.tsx # BPM slider, tap tempo, play/pause, volume
│   │   ├── pattern-library.tsx    # Tabbed interface for Western/Arabic/Custom patterns
│   │   ├── custom-pattern-editor.tsx # Pattern editor with beat count, subdivision, voice mode
│   │   ├── practice-timer.tsx     # Session timer with goals, logging, and history
│   │   ├── save_pattern_dialog.tsx # Dialog for saving custom patterns
│   │   └── saved_patterns_list.tsx # List of saved patterns with load/rename/delete
│   └── ui/
│       ├── button.tsx             # shadcn-style Button primitive
│       ├── card.tsx               # shadcn-style Card/CardHeader/CardContent primitives
│       ├── tabs.tsx                # shadcn-style Tabs, wrapping @radix-ui/react-tabs
│       ├── tooltip.tsx            # shadcn-style Tooltip, wrapping @radix-ui/react-tooltip
│       ├── dialog.tsx             # Dialog component for modals
│       ├── slider.tsx             # Slider component for BPM/volume controls
│       ├── switch.tsx             # Toggle switch component
│       ├── progress.tsx           # Progress bar component
│       ├── badge.tsx              # Badge component for labels
│       ├── label.tsx              # Label component for form fields
│       ├── input.tsx              # Input component for text fields
│       └── separator.tsx         # Separator component
├── hooks/
│   ├── use_pitch_detector.ts      # Mic capture + detection loop (getUserMedia, AnalyserNode, rAF)
│   ├── use_sampler_status.ts      # Tracks sampler loading state
│   └── metronome/                 # Metronome hooks
│       ├── use-metronome.ts       # Web Audio scheduler for beat playback
│       ├── use-practice-timer.ts  # Wall-clock practice timer with goal tracking
│       ├── use-practice-sessions.ts # localStorage persistence for practice sessions
│       └── use_saved_patterns.ts  # localStorage persistence for custom patterns
└── lib/
    ├── violin_theory.ts           # Tunings, note/frequency helpers, frequency → note analysis
    ├── violin_audio.ts            # Tone.js synths (bow + pluck) per string
    ├── maqam_theory.ts            # Maqamat + ajnas presets, isNoteInMaqam(), shared by Violin and Oud
    ├── maqam_playback.ts          # playMaqamSequence() — sequences a maqam through any instrument's audio engine
    ├── pitch_detection.ts         # Autocorrelation fundamental-frequency estimator
    ├── metronome/                 # Metronome library (framework-free)
    │   ├── metronome-patterns.ts  # Pattern data structures, Western/Arabic presets, voice types
    │   ├── saved_patterns.ts      # localStorage persistence for custom patterns
    │   └── practice-sessions.ts   # localStorage persistence for practice sessions
    ├── instrument-samplers.ts     # Sampler configuration per string/course
    └── sampler-audio.ts           # Multi-sampler engine routing and loading
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

### Metronome

The metronome provides three pattern libraries:

**Western time signatures** — Build patterns from meter presets (2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, 12/8) with:

- Adjustable subdivisions (quarter notes, eighth notes, triplets, sixteenth notes)
- Optional accent on the first beat
- Click sounds with pitch differentiation (accent > beat > sub)

**Arabic iqa'at** — Traditional Middle Eastern rhythmic cycles with authentic percussion:

- 10 patterns: Maqsum, Baladi, Saidi, Malfuf, Ayyub, Wahda, Masmoudi Kebir, Chiftetelli, Karsilama, Samai Thaqil
- Dum (low resonant) and Tak (high sharp) voices synthesized with Web Audio
- Visual grouping and meter display (e.g., 4/4, 9/8, 10/8)
- Arabic script labels (e.g., مقسوم for Maqsum)

**Custom patterns** — Create your own rhythms:

- Adjustable beat count (1-16 beats) and subdivision
- Two voice modes: Western clicks (rest/beat/accent/sub) or Arabic percussion (rest/dum/tak)
- Clickable beat grid to toggle steps through voice cycles
- Save/load custom patterns to localStorage with BPM
- Pattern library with rename and delete functionality

**Practice features**:

- Session timer with preset goals (5-60 minutes) or custom duration
- Auto-log completed sessions with pattern name and BPM
- Practice history showing recent sessions with daily/weekly totals
- Auto-stop option when goal is reached
- Completion chime using Web Audio synthesis

**Transport controls**:

- BPM slider (30-260) with tap tempo
- Fine adjustment buttons (±5, ±10 BPM)
- Play/pause with animated pulse indicator
- Volume control (0-100%)
- Tempo name display (Largo, Adagio, Andante, Moderato, Allegro, Presto, Prestissimo)

### Metronome implementation

The metronome uses a sample-accurate Web Audio scheduler with the classic look-ahead technique:

- **Scheduling** — `useMetronome` schedules audio events 120ms ahead of the current time using `AudioContext.currentTime`, ensuring precise timing even if the main thread is busy
- **Voice synthesis** — Each voice (accent, beat, sub, dum, tak) is synthesized in real-time using Web Audio oscillators and filters:
  - Western clicks use square wave oscillators at different frequencies (1600 Hz for accent, 1000 Hz for beat, 760 Hz for sub)
  - Arabic Dum uses a sine wave with frequency drop from 170 Hz to 90 Hz for a resonant low hit
  - Arabic Tak combines filtered noise burst (bandpass at 2600 Hz) with a high triangle wave (880 Hz) for a sharp bright hit
- **Step tracking** — A `requestAnimationFrame` loop updates the UI to highlight the current step based on scheduled event times
- **Practice timer** — Uses `performance.now()` deltas for wall-clock timing that survives pause/resume cycles without drift
- **Persistence** — Custom patterns and practice sessions are saved to localStorage using framework-free library functions in `src/lib/metronome/`

- **Scheduling** — `useMetronome` schedules audio events 120ms ahead of the current time using `AudioContext.currentTime`, ensuring precise timing even if the main thread is busy
- **Voice synthesis** — Each voice (accent, beat, sub, dum, tak) is synthesized in real-time using Web Audio oscillators and filters:
  - Western clicks use square wave oscillators at different frequencies (1600 Hz for accent, 1000 Hz for beat, 760 Hz for sub)
  - Arabic Dum uses a sine wave with frequency drop from 170 Hz to 90 Hz for a resonant low hit
  - Arabic Tak combines filtered noise burst (bandpass at 2600 Hz) with a high triangle wave (880 Hz) for a sharp bright hit
- **Step tracking** — A `requestAnimationFrame` loop updates the UI to highlight the current step based on scheduled event times
- **Practice timer** — Uses `performance.now()` deltas for wall-clock timing that survives pause/resume cycles without drift
- **Persistence** — Custom patterns and practice sessions are saved to localStorage using framework-free library functions in `src/lib/metronome/`

### Adding your own samples

Each string (Violin) or course (Oud) gets its own small `Tone.Sampler`, loaded from its own folder, instead of one sampler pitch-shifted across the whole instrument — a real string's recorded timbre only sounds right pitch-shifted a few semitones in either direction, not across the whole fingerboard. Folders live under `public/samples/`:

```bash
public/samples/
├── violin/
│   ├── string-1/   # G string  — README.txt lists: G3, Bb3, Db4, E4, G4
│   ├── string-2/   # D string  — D4, F4, Ab4, B4, D5
│   ├── string-3/   # A string  — A4, C5, Eb5, Gb5, A5
│   └── string-4/   # E string  — E5, G5, Bb5, Db6, E6
└── oud/
    ├── course-1/   # lowest  — C2, Eb2, Gb2, A2, C3
    ├── course-2/   # F2, Ab2, B2, D3, F3
    ├── course-3/   # A2, C3, Eb3, Gb3, A3
    ├── course-4/   # D3, F3, Ab3, B3, D4
    ├── course-5/   # G3, Bb3, Db4, E4, G4
    └── course-6/   # highest — C4, Eb4, Gb4, A4, C5
```

Record (or export from Audacity) each note as an mp3 named exactly as listed in that folder's `README.txt`, and drop it in — no code changes needed. The five notes per folder are a minor third apart and cover that string/course's practical range; `Tone.Sampler` pitch-shifts smoothly for anything in between. The mapping from folder to string/course id lives in `src/lib/instrument-samplers.ts`, and the routing (matching a fingerboard press to the right folder's sampler, or the nearest one by pitch for the Play Maqam sequencer) lives in `MultiSamplerEngine` in `src/lib/sampler-audio.ts`.

## Browser requirements

- Web Audio API (all modern browsers) — required for audio synthesis, metronome, and pitch detection
- Microphone access for pitch detection (requires `localhost` or `https`)
- LocalStorage for saving custom metronome patterns and practice sessions
- No IE11 support
