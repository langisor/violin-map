import * as Tone from "tone";

export type OudPlayMode = "risha" | "tremolo";

type OudVoice = {
  pluckSynth: Tone.PluckSynth;
  filter: Tone.Filter;
};

class OudAudioEngine {
  private voices: Map<string, OudVoice> = new Map();
  private started = false;

  private getVoice(stringId: string): OudVoice {
    let voice = this.voices.get(stringId);
    if (!voice) {
      // Warm low-pass filter to model the wooden acoustic body of the Oud
      const filter = new Tone.Filter({
        frequency: 2800,
        type: "lowpass",
        rolloff: -12,
      }).toDestination();

      const pluckSynth = new Tone.PluckSynth({
        attackNoise: 1.2,
        dampening: 2200,
        resonance: 0.94,
      }).connect(filter);

      pluckSynth.volume.value = -3;

      voice = { pluckSynth, filter };
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

  async noteOn(stringId: string, frequency: number, mode: OudPlayMode) {
    await this.ensureStarted();
    const voice = this.getVoice(stringId);

    if (mode === "risha") {
      voice.pluckSynth.triggerAttack(frequency);
    } else if (mode === "tremolo") {
      // Rapid triple-pluck stroke (risha tremolo)
      voice.pluckSynth.triggerAttack(frequency);
      setTimeout(() => voice.pluckSynth.triggerAttack(frequency), 70);
      setTimeout(() => voice.pluckSynth.triggerAttack(frequency), 140);
      setTimeout(() => voice.pluckSynth.triggerAttack(frequency), 210);
    }
  }

  noteOff(_stringId: string, _mode: OudPlayMode) {
    // Oud plucks decay naturally
  }

  dispose() {
    this.voices.forEach(({ pluckSynth, filter }) => {
      pluckSynth.dispose();
      filter.dispose();
    });
    this.voices.clear();
  }
}

export const oudAudioEngine = new OudAudioEngine();
