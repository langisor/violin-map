import { Note } from "tonal";

export type WesternScaleKind = 
  | "major" 
  | "minor" 
  | "pentatonic-major" 
  | "pentatonic-minor" 
  | "blues" 
  | "dorian" 
  | "phrygian" 
  | "lydian" 
  | "mixolydian" 
  | "locrian"
  | "harmonic-minor"
  | "melodic-minor";

export interface WesternScalePreset {
  id: string;
  tonic: string;
  kind: WesternScaleKind;
  intervals: number[];
  displayName: string;
  description: string;
}

export const WESTERN_KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

const SCALE_INTERVALS: Record<WesternScaleKind, { intervals: number[]; displayName: string; description: string }> = {
  major: {
    intervals: [0, 2, 4, 5, 7, 9, 11, 12],
    displayName: "Major",
    description: "The standard major scale - bright and happy"
  },
  minor: {
    intervals: [0, 2, 3, 5, 7, 8, 10, 12],
    displayName: "Natural Minor",
    description: "The natural minor scale - melancholic and dark"
  },
  "pentatonic-major": {
    intervals: [0, 2, 4, 7, 9, 12],
    displayName: "Pentatonic Major",
    description: "Five-note major scale - versatile and universally pleasant"
  },
  "pentatonic-minor": {
    intervals: [0, 3, 5, 7, 10, 12],
    displayName: "Pentatonic Minor",
    description: "Five-note minor scale - bluesy and emotional"
  },
  blues: {
    intervals: [0, 3, 5, 6, 7, 10, 12],
    displayName: "Blues",
    description: "Six-note blues scale with characteristic blue note"
  },
  dorian: {
    intervals: [0, 2, 3, 5, 7, 9, 10, 12],
    displayName: "Dorian",
    description: "Mode II - minor with a raised 6th, jazzy and hopeful"
  },
  phrygian: {
    intervals: [0, 1, 3, 5, 7, 8, 10, 12],
    displayName: "Phrygian",
    description: "Mode III - minor with a lowered 2nd, exotic and Spanish"
  },
  lydian: {
    intervals: [0, 2, 4, 6, 7, 9, 11, 12],
    displayName: "Lydian",
    description: "Mode IV - major with a raised 4th, dreamy and spacious"
  },
  mixolydian: {
    intervals: [0, 2, 4, 5, 7, 9, 10, 12],
    displayName: "Mixolydian",
    description: "Mode V - major with a lowered 7th, rock and folk"
  },
  locrian: {
    intervals: [0, 1, 3, 5, 6, 8, 10, 12],
    displayName: "Locrian",
    description: "Mode VII - diminished character, unstable and tense"
  },
  "harmonic-minor": {
    intervals: [0, 2, 3, 5, 7, 8, 11, 12],
    displayName: "Harmonic Minor",
    description: "Minor with raised 7th - dramatic and classical"
  },
  "melodic-minor": {
    intervals: [0, 2, 3, 5, 7, 9, 11, 12],
    displayName: "Melodic Minor",
    description: "Minor with raised 6th and 7th ascending - jazz and modern"
  },
};

export function westernScale(tonic: string, kind: WesternScaleKind): WesternScalePreset {
  const scaleData = SCALE_INTERVALS[kind];
  return {
    id: `${tonic.toLowerCase().replace("#", "sharp").replace("b", "flat")}-${kind}`,
    tonic,
    kind,
    intervals: scaleData.intervals,
    displayName: scaleData.displayName,
    description: scaleData.description,
  };
}

export function isNoteInWesternScale(
  openNote: string,
  step: number,
  scale: WesternScalePreset,
): boolean {
  const openMidi = Note.midi(openNote);
  const tonicMidi = Note.midi(`${scale.tonic}3`);
  if (openMidi === null || tonicMidi === null) return false;
  const pitchClassOffset = ((openMidi + step - tonicMidi) % 12 + 12) % 12;
  return scale.intervals.some((interval) => Math.abs(pitchClassOffset - (interval % 12)) < 0.1);
}

export function getScaleDegree(
  openNote: string,
  step: number,
  scale: WesternScalePreset
): number | null {
  const openMidi = Note.midi(openNote);
  const tonicMidi = Note.midi(`${scale.tonic}3`);
  if (openMidi === null || tonicMidi === null) return null;
  
  const pitchClassOffset = ((openMidi + step - tonicMidi) % 12 + 12) % 12;
  
  for (let i = 0; i < scale.intervals.length; i++) {
    if (Math.abs(pitchClassOffset - (scale.intervals[i] % 12)) < 0.1) {
      return i + 1; // Return scale degree (1-based)
    }
  }
  
  return null;
}

export function getAllWesternScales(tonic: string): WesternScalePreset[] {
  return Object.keys(SCALE_INTERVALS).map(kind => 
    westernScale(tonic, kind as WesternScaleKind)
  );
}

export interface KeySignature {
  sharps: string[];
  flats: string[];
  symbol: string;
}

export function getKeySignature(tonic: string, kind: WesternScaleKind): KeySignature {
  // Circle of fifths order for sharps and flats
  const sharpOrder = ["F", "C", "G", "D", "A", "E", "B"];
  const flatOrder = ["B", "E", "A", "D", "G", "C", "F"];
  
  // Determine key signature based on tonic and scale type
  const tonicPC = Note.get(tonic).pc || tonic;
  
  // Major key signatures
  const majorSharps: Record<string, number> = {
    "C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5, "F#": 6, "C#": 7,
    "F": -1, "Bb": -2, "Eb": -3, "Ab": -4, "Db": -5, "Gb": -6, "Cb": -7
  };
  
  // Adjust for different scale types
  let numSharps = majorSharps[tonicPC] || 0;
  
  if (kind === "minor") {
    // Relative minor has same key signature as major
    // Find relative major (minor tonic + 3 semitones)
    const relativeMajor = Note.transpose(tonic, "3M");
    const relativeMajorPC = Note.get(relativeMajor).pc || relativeMajor;
    numSharps = majorSharps[relativeMajorPC] || 0;
  } else if (kind === "harmonic-minor" || kind === "melodic-minor") {
    // These use natural minor key signature
    const relativeMajor = Note.transpose(tonic, "3M");
    const relativeMajorPC = Note.get(relativeMajor).pc || relativeMajor;
    numSharps = majorSharps[relativeMajorPC] || 0;
  } else if (kind === "dorian") {
    // Dorian uses major key signature of tonic + 1 semitone
    const dorianMajor = Note.transpose(tonic, "1m");
    const dorianMajorPC = Note.get(dorianMajor).pc || dorianMajor;
    numSharps = majorSharps[dorianMajorPC] || 0;
  } else if (kind === "mixolydian") {
    // Mixolydian uses major key signature of tonic
    numSharps = majorSharps[tonicPC] || 0;
  } else if (kind === "lydian") {
    // Lydian uses major key signature of tonic - 1 semitone
    const lydianMajor = Note.transpose(tonic, "-1m");
    const lydianMajorPC = Note.get(lydianMajor).pc || lydianMajor;
    numSharps = majorSharps[lydianMajorPC] || 0;
  } else if (kind === "phrygian") {
    // Phrygian uses major key signature of tonic - 2 semitones
    const phrygianMajor = Note.transpose(tonic, "-2M");
    const phrygianMajorPC = Note.get(phrygianMajor).pc || phrygianMajor;
    numSharps = majorSharps[phrygianMajorPC] || 0;
  } else if (kind === "locrian") {
    // Locrian uses major key signature of tonic - 2 semitones
    const locrianMajor = Note.transpose(tonic, "-2M");
    const locrianMajorPC = Note.get(locrianMajor).pc || locrianMajor;
    numSharps = majorSharps[locrianMajorPC] || 0;
  } else if (kind === "pentatonic-major" || kind === "pentatonic-minor" || kind === "blues") {
    // Pentatonic scales use major key signature
    numSharps = majorSharps[tonicPC] || 0;
  }
  
  if (numSharps > 0) {
    return {
      sharps: sharpOrder.slice(0, numSharps),
      flats: [],
      symbol: "♯".repeat(numSharps)
    };
  } else if (numSharps < 0) {
    return {
      sharps: [],
      flats: flatOrder.slice(0, Math.abs(numSharps)),
      symbol: "♭".repeat(Math.abs(numSharps))
    };
  } else {
    return {
      sharps: [],
      flats: [],
      symbol: ""
    };
  }
}
