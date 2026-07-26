import { Note } from "tonal";

export interface OudString {
  id: string; // "oud_str0" .. "oud_str5"
  label: string; // e.g. "C2"
  openNote: string; // e.g. "C2"
  traditionalName: string; // Arabic traditional pitch name, e.g. "Kaba Do", "Yegah"
  varnish: string; // Accent color token
}

export interface OudTuningPreset {
  id: string;
  label: string;
  description: string;
  notes: [string, string, string, string, string, string]; // low to high (6 courses)
  traditionalNames: [string, string, string, string, string, string];
}

// Warm wood & bone accent palette for Oud string courses
const OUD_STRING_COLORS = [
  "#a855f7", // Bass string accent
  "#8b5cf6", // 5th course
  "#8a4a2b", // 4th course (mahogany)
  "#b06a35", // 3rd course
  "#c9812f", // 2nd course
  "#e8b84b", // 1st course
];

export const OUD_TUNINGS: OudTuningPreset[] = [
  {
    id: "arabic-standard",
    label: "Standard Arabic (C-C)",
    description: "C2 · F2 · A2 · D3 · G3 · C4 — most common Arabic low tuning",
    notes: ["C2", "F2", "A2", "D3", "G3", "C4"],
    traditionalNames: [
      "Kaba Do",
      "Yegah",
      "Husayni Anik",
      "Dugah",
      "Nawa",
      "Kordan",
    ],
  },
  {
    id: "arabic-classical",
    label: "Classical Arabic (D-C)",
    description:
      "D2 · G2 · A2 · D3 · G3 · C4 — traditional Iraqi / Egyptian variant",
    notes: ["D2", "G2", "A2", "D3", "G3", "C4"],
    traditionalNames: [
      "Kaba Re",
      "Kaba Sol",
      "Husayni Anik",
      "Dugah",
      "Nawa",
      "Kordan",
    ],
  },
  {
    id: "arabic-high",
    label: "Arabic High (F-F)",
    description: "F2 · C3 · D3 · G3 · C4 · F4 — bright high solo tuning",
    notes: ["F2", "C3", "D3", "G3", "C4", "F4"],
    traditionalNames: ["Yegah", "Jaharkah", "Dugah", "Nawa", "Kordan", "Ramal"],
  },
  {
    id: "turkish-standard",
    label: "Turkish Standard (E-D)",
    description: "E2 · A2 · B2 · E3 · A3 · D4 — classical Turkish tuning",
    notes: ["E2", "A2", "B2", "E3", "A3", "D4"],
    traditionalNames: [
      "Kaba Mi",
      "Kaba La",
      "Kaba Si",
      "Dügah",
      "Neva",
      "Gerdaniye",
    ],
  },
];

export function buildOudStrings(tuning: OudTuningPreset): OudString[] {
  return tuning.notes.map((openNote, index) => ({
    id: `oud_str${index}`,
    label: Note.get(openNote).pc ?? openNote,
    openNote,
    traditionalName: tuning.traditionalNames[index],
    varnish: OUD_STRING_COLORS[index],
  }));
}

// Maqamat are shared across instruments — see src/lib/maqam-theory.ts.
// Re-exported here so existing imports from "@/lib/oud-theory" keep working.
export {
  MAQAMAT,
  isNoteInMaqam,
  maqamNeedsQuarterTones,
  type MaqamPreset,
} from "@/lib/maqam-theory";
