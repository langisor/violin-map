import { Note } from "tonal";

// --- Arabic Maqamat — shared across instruments (Oud, Violin, ...) ---
// Maqamat are not instrument-specific, so this lives independently of
// oud-theory.ts / violin-theory.ts and can be highlighted on either
// fingerboard.

export interface MaqamPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  tonic: string; // e.g. "D"
  description: string;
  maqamWorldUrl: string;
  intervals: number[]; // steps in semitones (or half-integer quarter tones) from tonic
}

export const MAQAMAT: MaqamPreset[] = [
  {
    id: "bayati",
    nameEn: "Maqam Bayati",
    nameAr: "مقام بياتي",
    tonic: "D",
    description:
      "The defining maqam of Arabic music. Built on Jins Bayati on D (D, E½♭, F, G) and Jins Nahawand on A.",
    maqamWorldUrl: "https://www.maqamworld.com/ar/maqam/bayati.php",
    // D(0), E½♭(1.5), F(3), G(5), A(7), Bb(8), C(10), D(12)
    intervals: [0, 1.5, 3, 5, 7, 8, 10, 12],
  },
  {
    id: "rast",
    nameEn: "Maqam Rast",
    nameAr: "مقام راست",
    tonic: "C",
    description:
      "The foundational maqam in Eastern music theory. Uses C, D, E½♭, F, G, A, B½♭, C.",
    maqamWorldUrl: "https://www.maqamworld.com/ar/maqam/rast.php",
    // C(0), D(2), E½♭(3.5), F(5), G(7), A(9), B½♭(10.5), C(12)
    intervals: [0, 2, 3.5, 5, 7, 9, 10.5, 12],
  },
  {
    id: "hijaz",
    nameEn: "Maqam Hijaz",
    nameAr: "مقام حجاز",
    tonic: "D",
    description:
      "Features a characteristic augmented second interval (E♭ to F#). Expressive, passionate, and deeply resonant.",
    maqamWorldUrl: "https://www.maqamworld.com/ar/maqam/hijaz.php",
    // D(0), Eb(1), F#(4), G(5), A(7), Bb(8), C(10), D(12)
    intervals: [0, 1, 4, 5, 7, 8, 10, 12],
  },
  {
    id: "nahawand",
    nameEn: "Maqam Nahawand",
    nameAr: "مقام نهاوند",
    tonic: "C",
    description:
      "Resembles the Western natural minor scale. Uses C, D, E♭, F, G, A♭, B (or B♭), C.",
    maqamWorldUrl: "https://www.maqamworld.com/ar/maqam/nahawand.php",
    // C(0), D(2), Eb(3), F(5), G(7), Ab(8), B(11), C(12)
    intervals: [0, 2, 3, 5, 7, 8, 11, 12],
  },
  {
    id: "kurd",
    nameEn: "Maqam Kurd",
    nameAr: "مقام كرد",
    tonic: "D",
    description:
      "Starts with Jins Kurd on D (D, E♭, F, G). Modern, widely used in folk and contemporary Arabic songs.",
    maqamWorldUrl: "https://www.maqamworld.com/ar/maqam/kurd.php",
    // D(0), Eb(1), F(3), G(5), A(7), Bb(8), C(10), D(12)
    intervals: [0, 1, 3, 5, 7, 8, 10, 12],
  },
  {
    id: "sikah",
    nameEn: "Maqam Sikah",
    nameAr: "مقام سيكاه",
    tonic: "E",
    description:
      "Rooted on E half-flat (Sikah). Deeply rooted in traditional Arabic singing and Quranic recitation.",
    maqamWorldUrl: "https://www.maqamworld.com/ar/maqam/sikah.php",
    // E½♭(1.5 above D), F(3), G(5), A(7), B½♭(10.5), C(12), D(14), E½♭(15.5)
    intervals: [1.5, 3, 5, 7, 10.5, 12, 14, 15.5],
  },
];

/** True if a maqam includes any quarter-tone (half-integer) scale degree. */
export function maqamNeedsQuarterTones(maqam: MaqamPreset): boolean {
  return maqam.intervals.some((i) => !Number.isInteger(i));
}

/**
 * Checks if a note pitch at a specific step on an open string matches any note in the selected Maqam.
 */
export function isNoteInMaqam(
  openNote: string,
  step: number,
  maqam: MaqamPreset,
): boolean {
  const openMidi = Note.midi(openNote);
  if (openMidi === null) return false;

  const currentPitchInSemitones = openMidi + step;
  const tonicMidi = Note.midi(`${maqam.tonic}3`) ?? 60;

  for (const interval of maqam.intervals) {
    const maqamPitch = tonicMidi + interval;
    const diff = Math.abs(
      (((currentPitchInSemitones - maqamPitch) % 12) + 12) % 12,
    );
    if (diff < 0.1 || Math.abs(diff - 12) < 0.1) {
      return true;
    }
  }

  return false;
}
