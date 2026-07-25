import * as Tone from "tone";

export type PlayMode = "bow" | "pluck";

type Voice = {
  bowSynth: Tone.Synth;
  pluckSynth: Tone.PluckSynth;
};

class ViolinAudioEngine {
  private voices: Map<string, Voice> = new Map();
  private started = false;

  private getVoice(stringId: string): Voice {
    let voice = this.voices.get(stringId);
    if (!voice) {
      // Slow attack + sustained body approximates a drawn bow stroke.
      const bowSynth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.25, decay: 0.1, sustain: 0.8, release: 0.4 },
      }).toDestination();
      bowSynth.volume.value = -8;

      // Karplus-Strong style pluck approximates pizzicato.
      const pluckSynth = new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 3000,
        resonance: 0.9,
      }).toDestination();
      pluckSynth.volume.value = -4;

      voice = { bowSynth, pluckSynth };
      this.voices.set(stringId, voice);
    }
    return voice;
  }

  async ensureStarted() {
    if (!this.started) {
      await Tone.start();
      this.started = true;
    }
  }

  async noteOn(stringId: string, frequency: number, mode: PlayMode) {
    await this.ensureStarted();
    const voice = this.getVoice(stringId);
    if (mode === "bow") {
      voice.bowSynth.triggerAttack(frequency);
    } else {
      voice.pluckSynth.triggerAttack(frequency);
    }
  }

  noteOff(stringId: string, mode: PlayMode) {
    if (mode !== "bow") return; // plucks decay on their own
    this.voices.get(stringId)?.bowSynth.triggerRelease();
  }

  dispose() {
    this.voices.forEach(({ bowSynth, pluckSynth }) => {
      bowSynth.dispose();
      pluckSynth.dispose();
    });
    this.voices.clear();
  }
}

// Singleton so all components share the same live synths.
export const violinAudioEngine = new ViolinAudioEngine();
