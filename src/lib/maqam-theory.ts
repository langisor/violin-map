import { Note } from "tonal";

// --- Ajnas (sing. Jins) — the trichord/tetrachord/pentachord building blocks
// that maqamat are constructed from. A jins is defined relative to its own
// root (0); a maqam anchors one jins at its tonic (rootOffset 0) and
// typically a second jins higher up (e.g. at the 5th, rootOffset 7). ---

export interface JinsPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  description: string;
  intervals: number[]; // steps in semitones (or quarter tones) from the jins root
}

export const AJNAS: JinsPreset[] = [
  {
    id: "rast",
    nameEn: "Jins Rast",
    nameAr: "جنس راست",
    description:
      "Root, whole tone, three-quarter tone, whole tone. The building block of Maqam Rast — neither major nor minor to Western ears.",
    intervals: [0, 2, 3.5, 5],
  },
  {
    id: "bayati",
    nameEn: "Jins Bayati",
    nameAr: "جنس بياتي",
    description:
      "Root, three-quarter tone, three-quarter tone, whole tone. The most common jins in Arabic music, opening on a half-flat 2nd.",
    intervals: [0, 1.5, 3, 5],
  },
  {
    id: "hijaz",
    nameEn: "Jins Hijaz",
    nameAr: "جنس حجاز",
    description:
      "Root, half tone, augmented 2nd, half tone. Gives maqamat their distinctive Middle-Eastern augmented-second color.",
    intervals: [0, 1, 4, 5],
  },
  {
    id: "kurd",
    nameEn: "Jins Kurd",
    nameAr: "جنس كرد",
    description:
      "Root, half tone, whole tone, whole tone. Equivalent to a Phrygian tetrachord.",
    intervals: [0, 1, 3, 5],
  },
  {
    id: "nahawand",
    nameEn: "Jins Nahawand",
    nameAr: "جنس نهاوند",
    description:
      "Root, whole tone, half tone, whole tone. A minor-sounding tetrachord, the basis of Maqam Nahawand.",
    intervals: [0, 2, 3, 5],
  },
  {
    id: "nikriz",
    nameEn: "Jins Nikriz",
    nameAr: "جنس نكريز",
    description:
      "Root, whole tone, half tone, augmented 2nd. A brighter, more dramatic cousin of Nahawand.",
    intervals: [0, 2, 3, 6],
  },
  {
    id: "ajam",
    nameEn: "Jins Ajam",
    nameAr: "جنس عجم",
    description:
      "Root, whole tone, whole tone, half tone. Sounds like a Western major tetrachord.",
    intervals: [0, 2, 4, 5],
  },
  {
    id: "saba",
    nameEn: "Jins Saba",
    nameAr: "جنس صبا",
    description:
      "Root, three-quarter tone, three-quarter tone, half tone. Instantly recognizable — the only jins with a diminished 4th.",
    intervals: [0, 1.5, 3, 4],
  },
  {
    id: "sikah",
    nameEn: "Jins Sikah",
    nameAr: "جنس سيكاه",
    description:
      "Root (half-flat), three-quarter tone, whole tone. A three-note trichord rooted on a quarter-tone degree.",
    intervals: [0, 1.5, 3.5],
  },
];

export function getJins(id: string): JinsPreset | undefined {
  return AJNAS.find((j) => j.id === id);
}

/** Where a jins sits within a maqam: which jins, and how many semitones
 * above the maqam's tonic its own root falls. */
export interface JinsPlacement {
  jinsId: string;
  rootOffset: number;
}

export interface MaqamPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  tonic: string; // e.g. "D"
  description: string;
  maqamWorldUrl: string;
  intervals: number[]; // steps in semitones (or half-integer quarter tones) from tonic
  lowerJins: JinsPlacement; // the jins anchoring the tonic
  upperJins?: JinsPlacement; // the jins higher up (often at the 5th) that completes the maqam
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
    lowerJins: { jinsId: "bayati", rootOffset: 0 },
    upperJins: { jinsId: "nahawand", rootOffset: 7 },
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
    lowerJins: { jinsId: "rast", rootOffset: 0 },
    upperJins: { jinsId: "rast", rootOffset: 7 },
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
    lowerJins: { jinsId: "hijaz", rootOffset: 0 },
    upperJins: { jinsId: "kurd", rootOffset: 7 },
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
    lowerJins: { jinsId: "nahawand", rootOffset: 0 },
    upperJins: { jinsId: "hijaz", rootOffset: 7 },
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
    lowerJins: { jinsId: "kurd", rootOffset: 0 },
    upperJins: { jinsId: "kurd", rootOffset: 7 },
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
    lowerJins: { jinsId: "sikah", rootOffset: 1.5 },
  },
  {
    id: "saba",
    nameEn: "Maqam Saba",
    nameAr: "مقام صبا",
    tonic: "D",
    description:
      "One of the most distinctive maqamat — its diminished-4th lower jins gives it an unmistakably melancholic, unresolved character.",
    maqamWorldUrl: "https://www.maqamworld.com/ar/maqam/saba.php",
    // D(0), E½♭(1.5), F(3), Gb(4), A(7), Bb(8), C(10), D(12)
    intervals: [0, 1.5, 3, 4, 7, 8, 10, 12],
    lowerJins: { jinsId: "saba", rootOffset: 0 },
    upperJins: { jinsId: "kurd", rootOffset: 7 },
  },
  {
    id: "ajam",
    nameEn: "Maqam Ajam",
    nameAr: "مقام عجم",
    tonic: "Bb",
    description:
      "The closest Arabic maqam to a Western major scale — bright, resolved, and commonly used for uplifting or triumphant passages.",
    maqamWorldUrl: "https://www.maqamworld.com/ar/maqam/ajam.php",
    // Bb(0), C(2), D(4), Eb(5), F(7), G(9), A(11), Bb(12)
    intervals: [0, 2, 4, 5, 7, 9, 11, 12],
    lowerJins: { jinsId: "ajam", rootOffset: 0 },
    upperJins: { jinsId: "ajam", rootOffset: 7 },
  },
  {
    id: "nikriz",
    nameEn: "Maqam Nikriz",
    nameAr: "مقام نكريز",
    tonic: "G",
    description:
      "A bright, festive maqam built on Jins Nikriz — its augmented 2nd between the 3rd and 4th degrees gives it a sparkling, ornamented quality.",
    maqamWorldUrl: "https://www.maqamworld.com/ar/maqam/nikriz.php",
    // G(0), A(2), Bb(3), C#(6), D(7), E(9), F(10), G(12)
    intervals: [0, 2, 3, 6, 7, 9, 10, 12],
    lowerJins: { jinsId: "nikriz", rootOffset: 0 },
    upperJins: { jinsId: "nahawand", rootOffset: 7 },
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
