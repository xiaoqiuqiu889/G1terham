type Cue = "choice" | "transition" | "save" | "ending";

const chapterSound: Record<string, { cutoff: number; volume: number; tone: number }> = {
  prologue: { cutoff: 720, volume: 0.018, tone: 110 },
  chapter1: { cutoff: 1050, volume: 0.024, tone: 146.8 },
  chapter2: { cutoff: 520, volume: 0.022, tone: 73.4 },
  chapter3: { cutoff: 430, volume: 0.025, tone: 55 },
  chapter4: { cutoff: 820, volume: 0.018, tone: 98 },
  chapter5: { cutoff: 680, volume: 0.016, tone: 123.5 },
  ending: { cutoff: 560, volume: 0.015, tone: 82.4 },
};

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: AudioNode[] = [];
  private currentChapter = "";

  async start(chapter: string) {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") await this.context.resume();
    this.setChapter(chapter);
  }

  setChapter(chapter: string) {
    if (!this.context || !this.master || chapter === this.currentChapter) return;
    this.stopAmbience();
    this.currentChapter = chapter;
    const preset = chapterSound[chapter] ?? chapterSound.prologue;

    const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      data[i] = brown * 2.8;
    }
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = preset.cutoff;
    const noiseGain = this.context.createGain();
    noiseGain.gain.value = preset.volume;
    noise.connect(filter).connect(noiseGain).connect(this.master);
    noise.start();

    const tone = this.context.createOscillator();
    const toneGain = this.context.createGain();
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    tone.type = chapter === "chapter2" ? "triangle" : "sine";
    tone.frequency.value = preset.tone;
    toneGain.gain.value = 0.0025;
    lfo.frequency.value = chapter === "chapter3" ? 0.055 : 0.085;
    lfoGain.gain.value = 0.0018;
    lfo.connect(lfoGain).connect(toneGain.gain);
    tone.connect(toneGain).connect(this.master);
    tone.start();
    lfo.start();
    this.ambience = [noise, filter, noiseGain, tone, toneGain, lfo, lfoGain];
  }

  cue(type: Cue) {
    if (!this.context || !this.master || this.context.state !== "running") return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const frequencies: Record<Cue, [number, number]> = {
      choice: [392, 523.25],
      transition: [146.8, 196],
      save: [659.25, 783.99],
      ending: [220, 329.63],
    };
    oscillator.type = type === "transition" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequencies[type][0], now);
    oscillator.frequency.exponentialRampToValueAtTime(frequencies[type][1], now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.028, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  private stopAmbience() {
    for (const node of this.ambience) {
      if ("stop" in node) {
        try { (node as AudioScheduledSourceNode).stop(); } catch {}
      }
      try { node.disconnect(); } catch {}
    }
    this.ambience = [];
  }

  stop() {
    this.stopAmbience();
    if (this.context) void this.context.close();
    this.context = null;
    this.master = null;
    this.currentChapter = "";
  }
}
