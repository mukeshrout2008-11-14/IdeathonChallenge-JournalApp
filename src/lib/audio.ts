/**
 * Ambient Audio Synthesizer utilizing Web Audio API
 * Generates organic, non-looping ambient noise (gentle rain, river flow, cafe warmth, binaural alpha tone).
 */
class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private currentType: string | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.3;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getStatus(): { isPlaying: boolean; type: string | null; volume: number } {
    return {
      isPlaying: this.isPlaying,
      type: this.currentType,
      volume: this.volume,
    };
  }

  public play(type: 'rain' | 'binaural' | 'stream' | 'whitenoise') {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentType = type;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    if (type === 'binaural') {
      // 216Hz and 226Hz generates an optimal 10Hz Alpha brainwave binaural beat for deep calm reflection
      this.osc1 = this.ctx.createOscillator();
      this.osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();

      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(216, this.ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, this.ctx.currentTime);

      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(226, this.ctx.currentTime);
      gain2.gain.setValueAtTime(0.15, this.ctx.currentTime);

      this.osc1.connect(gain1);
      this.osc2.connect(gain2);
      gain1.connect(this.masterGain);
      gain2.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();
    } else {
      // Generate Brownian / Pink noise buffer for rain & stream
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain' || type === 'stream') {
          // Pink/Brownian filter approximation
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        } else {
          output[i] = white * 0.15;
        }
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      this.filter = this.ctx.createBiquadFilter();
      if (type === 'rain') {
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(1, this.ctx.currentTime);
      } else if (type === 'stream') {
        this.filter.type = 'bandpass';
        this.filter.frequency.setValueAtTime(600, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(2, this.ctx.currentTime);
      } else {
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(1500, this.ctx.currentTime);
      }

      whiteNoise.connect(this.filter);
      this.filter.connect(this.masterGain);
      whiteNoise.start();
      this.noiseNode = whiteNoise;
    }
  }

  public stop() {
    if (this.osc1) {
      try { this.osc1.stop(); this.osc1.disconnect(); } catch {}
      this.osc1 = null;
    }
    if (this.osc2) {
      try { this.osc2.stop(); this.osc2.disconnect(); } catch {}
      this.osc2 = null;
    }
    if (this.noiseNode) {
      try { (this.noiseNode as any).stop(); this.noiseNode.disconnect(); } catch {}
      this.noiseNode = null;
    }
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch {}
      this.masterGain = null;
    }
    this.isPlaying = false;
    this.currentType = null;
  }
}

export const soundscape = new AmbientSoundscapeEngine();

/**
 * Text to Speech Narrator using browser SpeechSynthesis
 */
export function speakText(text: string, onEnd?: () => void, onError?: (err: any) => void): boolean {
  if (!('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();

  // Strip markdown styling for clean spoken audio
  const cleanText = text
    .replace(/[#*`_~\[\]]/g, '')
    .replace(/```[\s\S]*?```/g, 'code snippet omitted')
    .replace(/\n+/g, '. ')
    .trim();

  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 0.95; // Contemplative, measured pace
  utterance.pitch = 1.0;

  // Prefer warm natural voices if available
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(v => 
    (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
  ) || voices.find(v => v.lang.startsWith('en'));

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
