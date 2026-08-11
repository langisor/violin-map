/**
 * Western scale presets for highlighting on the fingerboard.
 * Each scale is defined by its intervals (in semitones) from the root.
 */

export interface WesternScalePreset {
  id: string;
  nameEn: string;
  description: string;
  intervals: number[]; // steps in semitones from root
  rootNotes: string[]; // e.g. ["C", "D", "E", "F", "G", "A", "B"]
}

export const WESTERN_SCALES: WesternScalePreset[] = [
  {
    id: "major",
    nameEn: "Major",
    description:
      "The brightest diatonic scale. Intervals: W-W-H-W-W-W-H (whole-half step pattern).",
    intervals: [0, 2, 4, 5, 7, 9, 11, 12],
    rootNotes: ["C", "D", "E", "F", "G", "A", "B"],
  },
  {
    id: "natural-minor",
    nameEn: "Natural Minor",
    description:
      "Also called Aeolian mode. Darker than major with relative pitch relationships. Same notes as major but starting from the 6th degree.",
    intervals: [0, 2, 3, 5, 7, 8, 10, 12],
    rootNotes: ["A", "B", "C", "D", "E", "F", "G"],
  },
  {
    id: "harmonic-minor",
    nameEn: "Harmonic Minor",
    description:
      "Natural minor with a raised 7th scale degree, creating an augmented 2nd between the 6th and 7th degrees for a more dramatic sound.",
    intervals: [0, 2, 3, 5, 7, 8, 11, 12],
    rootNotes: ["A", "B", "C", "D", "E", "F", "G#"],
  },
  {
    id: "melodic-minor",
    nameEn: "Melodic Minor",
    description:
      "Natural minor ascending with raised 6th and 7th degrees for smoother melodies. Descends as natural minor in traditional usage.",
    intervals: [0, 2, 3, 5, 7, 9, 11, 12],
    rootNotes: ["A", "B", "C", "D", "E", "F#", "G#"],
  },
  {
    id: "major-pentatonic",
    nameEn: "Major Pentatonic",
    description:
      "Five-note scale derived from major by removing the 4th and 7th degrees. Bright and open, no half steps.",
    intervals: [0, 2, 4, 7, 9, 12],
    rootNotes: ["C", "D", "E", "G", "A"],
  },
  {
    id: "minor-pentatonic",
    nameEn: "Minor Pentatonic",
    description:
      "Five-note scale derived from natural minor. Essential in blues, rock, and many world music traditions. Very versatile and approachable.",
    intervals: [0, 3, 5, 7, 10, 12],
    rootNotes: ["A", "C", "D", "E", "G"],
  },
  {
    id: "blues",
    nameEn: "Blues",
    description:
      "Minor pentatonic with an added flatted 5th (tritone). The characteristic 'bent' sound of blues and rock music.",
    intervals: [0, 3, 5, 6, 7, 10, 12],
    rootNotes: ["A", "C", "D", "D#/Eb", "E", "G"],
  },
  {
    id: "dorian",
    nameEn: "Dorian",
    description:
      "The 2nd mode of major. Minor-sounding with a raised 6th degree, giving it a jazzy, cool character.",
    intervals: [0, 2, 3, 5, 7, 9, 10, 12],
    rootNotes: ["D", "E", "F", "G", "A", "B", "C"],
  },
  {
    id: "phrygian",
    nameEn: "Phrygian",
    description:
      "The 3rd mode of major. Exotic and dark with a half step as the first interval, giving it a Spanish/flamenco flavor.",
    intervals: [0, 1, 3, 5, 7, 8, 10, 12],
    rootNotes: ["E", "F", "G", "A", "B", "C", "D"],
  },
];

/**
 * Checks if a note pitch at a specific step on an open string matches any note in the selected scale.
 */
export function isNoteInWesternScale(
  openNote: string,
  step: number,
  scale: WesternScalePreset
): boolean {
  // Get the pitch class (C, D, E, etc.) of the open note
  const openNoteName = openNote.replace(/[0-9]/g, ""); // Remove octave
  const openNoteIndex = scale.rootNotes.indexOf(openNoteName);

  if (openNoteIndex === -1) {
    // If the open note is not in the scale's root notes, we need to handle accidentals
    // For simplicity, we can check if the note at this step matches any scale degree
    const currentMidi = 60 + (openNote.charCodeAt(0) % 12) + step; // Simplified MIDI calculation
    for (const interval of scale.intervals) {
      if (Math.abs((currentMidi - (60 + interval)) % 12) < 0.5) {
        return true;
      }
    }
    return false;
  }

  // Calculate the effective step in terms of the scale
  const stepInScale = step % 12;
  return scale.intervals.includes(stepInScale) || stepInScale === 0;
}
