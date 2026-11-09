// Synthesized Web Audio Engine: SFX + Upbeat Cheerful Background Music (Zero external files needed, 100% offline & GitHub Pages compatible!)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.currentStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.enabled;
  }

  // 🎵 UPBEAT CHEERFUL RACING BGM (Mario Kart / Fall Guys Inspired 130 BPM Synthesizer Groove!)
  startBGM() {
    if (!this.enabled || this.isBgmPlaying) return;
    this.init();
    this.isBgmPlaying = true;
    this.currentStep = 0;

    // Upbeat C Major Pentatonic / Mixolydian Chords & Melodies
    // Chord progression: C -> G -> Am -> F (Classic uplifting progression)
    const melodyNotes = [
      // Bar 1 (C)
      523.25, 659.25, 783.99, 1046.50,  659.25, 783.99, 880.00, 783.99,
      // Bar 2 (G)
      392.00, 493.88, 587.33, 783.99,   493.88, 587.33, 659.25, 587.33,
      // Bar 3 (Am)
      440.00, 523.25, 659.25, 880.00,   523.25, 659.25, 783.99, 659.25,
      // Bar 4 (F)
      349.23, 440.00, 523.25, 698.46,   440.00, 523.25, 659.25, 783.99
    ];

    const bassNotes = [
      // C, G, Am, F root notes
      130.81, 130.81, 130.81, 130.81,
      98.00, 98.00, 98.00, 98.00,
      110.00, 110.00, 110.00, 110.00,
      87.31, 87.31, 87.31, 87.31
    ];

    const stepIntervalMs = 115; // 130 BPM eighth notes

    const tick = () => {
      if (!this.isBgmPlaying || !this.enabled || !this.ctx) return;
      
      const now = this.ctx.currentTime;
      const step = this.currentStep % melodyNotes.length;
      const bassStep = Math.floor(step / 2) % bassNotes.length;

      // 1. Marimba / Pluck Lead
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(melodyNotes[step], now);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);

      // 2. Bouncy Bassline (every 2 steps)
      if (step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNotes[bassStep], now);

        bassGain.gain.setValueAtTime(0.07, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        // Lowpass filter for warm bass
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.22);
      }

      // 3. Hi-Hat Shaker Click (crisp beat)
      if (step % 2 === 1) {
        const noiseBuffer = this.createNoiseBuffer();
        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.025, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          noise.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          noise.start(now);
        }
      }

      this.currentStep++;
      this.bgmTimer = setTimeout(tick, stepIntervalMs);
    };

    tick();
  }

  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // SFX: Eat Banana Chime
  playBanana() {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      [587.33, 880.00, 1174.66].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch (e) {}
  }

  // SFX: Spring Boing
  playBounce() {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.2);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // SFX: Boulder Bonk
  playHit() {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  // SFX: Wind Whoosh
  playWind() {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.35);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // SFX: Countdown Beeps
  playBeep(isHigh = false) {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHigh ? 880 : 440, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (isHigh ? 0.35 : 0.15));
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (isHigh ? 0.35 : 0.15));
    } catch (e) {}
  }

  // SFX: Victory Royal Fanfare
  playVictory() {
    this.stopBGM(); // Pause normal BGM for victory fanfare!
    if (!this.enabled) return;
    this.init();
    try {
      const fanfare = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.50];
      const start = this.ctx.currentTime;
      fanfare.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = start + idx * 0.13;
        const dur = idx === fanfare.length - 1 ? 0.8 : 0.18;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.35, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.01, noteStart + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + dur);
      });
    } catch (e) {}
  }
}

export const soundManager = new SoundManager();
