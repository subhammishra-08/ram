// ============================================================================
// STICKTUBER WEB AUDIO SYNTHESIS & SFX ENGINE
// High-performance, zero-latency procedural EDM music & combat sound synthesizer
// ============================================================================

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.filterNode = null;
    this.analyser = null;
    this.isMuted = false;
    this.initialized = false;

    // Music state
    this.isPlaying = false;
    this.currentTrack = null;
    this.bpm = 128;
    this.secondsPerBeat = 60 / 128;
    this.step = 0;
    this.nextNoteTime = 0;
    this.scheduleAheadTime = 0.2; // 200ms lookahead
    this.timerID = null;

    // Volume settings (0.0 to 1.0)
    this.masterVolume = 0.8;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.9;

    // Rhythm beat callbacks
    this.onBeat = null; // callback(beatNumber, time)

    // Tracks definitions
    this.tracks = this.initTracks();

    // Frequency data buffer for visualizer
    this.frequencyData = null;
  }

  init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }

    this.ctx = new AudioContext();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

    // Dynamic compressor to prevent clipping and give professional punch
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

    // Master filter (for Fever mode low-pass sweeps & effects)
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(20000, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // Analyser node for audio visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    // Sub-busses
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);

    // Wiring
    this.musicGain.connect(this.filterNode);
    this.sfxGain.connect(this.masterGain);
    this.filterNode.connect(this.masterGain);
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.initialized = true;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  ensureContext() {
    if (!this.initialized || !this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // Visualizer spectrum data getter
  getAudioData() {
    if (!this.analyser || !this.frequencyData) {
      return { bass: 0, mid: 0, high: 0, raw: [] };
    }
    this.analyser.getByteFrequencyData(this.frequencyData);

    let bassSum = 0;
    for (let i = 0; i < 4; i++) bassSum += this.frequencyData[i];
    const bass = (bassSum / (4 * 255));

    let midSum = 0;
    for (let i = 4; i < 16; i++) midSum += this.frequencyData[i];
    const mid = (midSum / (12 * 255));

    let highSum = 0;
    for (let i = 16; i < 32; i++) highSum += this.frequencyData[i];
    const high = (highSum / (16 * 255));

    return { bass, mid, high, raw: Array.from(this.frequencyData) };
  }

  // =========================================================================
  // MUSIC SEQUENCER
  // =========================================================================

  initTracks() {
    return [
      {
        id: 'track1',
        title: 'NEON NIGHTLIFE',
        artist: 'StickTuber EDM',
        bpm: 128,
        difficulty: 'NORMAL',
        difficultyColor: '#00ffcc',
        description: 'Bouncy electro synthwave with infectious rhythm & punchy bass.',
        kickPattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        snarePattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihatPattern: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
        bassNotes: [110, 0, 110, 130.81, 110, 0, 98, 0, 110, 0, 110, 146.83, 130.81, 0, 98, 110], // A2, C3, A2, G2...
        leadNotes: [440, 523.25, 659.25, 523.25, 783.99, 659.25, 523.25, 440, 880, 783.99, 659.25, 523.25, 587.33, 659.25, 523.25, 440],
      },
      {
        id: 'track2',
        title: 'CYBER BRAWLER',
        artist: 'Glitch Samurai',
        bpm: 140,
        difficulty: 'HARD',
        difficultyColor: '#ff0077',
        description: 'Aggressive midtempo darksynth with crushing saw waves.',
        kickPattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
        snarePattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        hihatPattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        bassNotes: [73.42, 73.42, 0, 73.42, 87.31, 73.42, 0, 65.41, 73.42, 73.42, 98, 87.31, 73.42, 0, 110, 98], // D2, F2, C2
        leadNotes: [293.66, 0, 349.23, 0, 440, 0, 523.25, 587.33, 440, 0, 349.23, 0, 293.66, 349.23, 440, 587.33],
      },
      {
        id: 'track3',
        title: 'DRAGON DRIFT',
        artist: 'Tokyo Bassline',
        bpm: 154,
        difficulty: 'EXPERT',
        difficultyColor: '#ffaa00',
        description: 'Fast trapstyle rhythm with pentatonic Asian leads and rapid fire.',
        kickPattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        snarePattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihatPattern: [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
        bassNotes: [82.41, 0, 0, 82.41, 0, 98, 0, 0, 82.41, 0, 123.47, 0, 110, 0, 98, 0], // E2
        leadNotes: [329.63, 392, 440, 493.88, 587.33, 493.88, 440, 392, 659.25, 587.33, 493.88, 440, 392, 440, 493.88, 659.25],
      },
      {
        id: 'track4',
        title: 'OVERDRIVE APEX',
        artist: 'Multiverse King',
        bpm: 168,
        difficulty: 'MASTER',
        difficultyColor: '#a855f7',
        description: 'Blistering speed darksynth for ultimate reflexes and peak stream hype.',
        kickPattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        snarePattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihatPattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        bassNotes: [65.41, 65.41, 77.78, 65.41, 87.31, 65.41, 98, 87.31, 65.41, 65.41, 116.54, 98, 87.31, 77.78, 65.41, 58.27],
        leadNotes: [523.25, 622.25, 698.46, 783.99, 932.33, 783.99, 698.46, 622.25, 1046.5, 932.33, 783.99, 698.46, 783.99, 932.33, 622.25, 523.25],
      }
    ];
  }

  playTrack(trackIndex = 0) {
    this.ensureContext();
    this.stopTrack();

    const track = this.tracks[trackIndex] || this.tracks[0];
    this.currentTrack = track;
    this.bpm = track.bpm;
    this.secondsPerBeat = 60 / this.bpm;
    this.step = 0;
    this.isPlaying = true;

    // Reset filter
    if (this.filterNode && this.ctx) {
      this.filterNode.frequency.setValueAtTime(20000, this.ctx.currentTime);
    }

    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }

  stopTrack() {
    this.isPlaying = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  scheduler() {
    if (!this.isPlaying || !this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.advanceStep();
    }

    this.timerID = setTimeout(() => this.scheduler(), 35);
  }

  advanceStep() {
    // 16th note steps: 4 steps per beat
    const secondsPer16th = this.secondsPerBeat / 4;
    this.nextNoteTime += secondsPer16th;
    this.step = (this.step + 1) % 16;
  }

  scheduleStep(stepIndex, time) {
    if (!this.currentTrack) return;
    const track = this.currentTrack;

    // Trigger onBeat callback on quarter notes (steps 0, 4, 8, 12)
    if (stepIndex % 4 === 0) {
      const beatNum = Math.floor(stepIndex / 4);
      if (this.onBeat) {
        // Schedule callback close to actual time
        const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
        setTimeout(() => {
          if (this.isPlaying && this.onBeat) {
            this.onBeat(beatNum, time);
          }
        }, delayMs);
      }
    }

    // 1. Kick
    if (track.kickPattern[stepIndex]) {
      this.synthKick(time);
    }

    // 2. Snare / Clap
    if (track.snarePattern[stepIndex]) {
      this.synthSnare(time);
    }

    // 3. Hi-Hat
    if (track.hihatPattern[stepIndex]) {
      this.synthHiHat(time, stepIndex % 2 === 0);
    }

    // 4. Bass synth
    const bassFreq = track.bassNotes[stepIndex];
    if (bassFreq > 0) {
      this.synthBass(bassFreq, time, this.secondsPerBeat / 3.8);
    }

    // 5. Lead synth
    const leadFreq = track.leadNotes[stepIndex];
    if (leadFreq > 0) {
      this.synthLead(leadFreq, time, this.secondsPerBeat / 3.5);
    }
  }

  // =========================================================================
  // INSTRUMENT SYNTHESISERS
  // =========================================================================

  synthKick(time) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Punchy pitch drop: 150Hz -> 35Hz
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    // Envelope
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.23);
  }

  synthSnare(time) {
    if (!this.ctx) return;
    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(1.8, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    // Body tone
    const osc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

    toneGain.gain.setValueAtTime(0.4, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(toneGain);
    toneGain.connect(this.musicGain);

    noise.start(time);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  synthHiHat(time, isOpen = false) {
    if (!this.ctx) return;
    const dur = isOpen ? 0.08 : 0.035;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.28 : 0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + dur);
  }

  synthBass(freq, time, duration = 0.2) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq / 2, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(250, time + duration);
    filter.Q.setValueAtTime(4.0, time);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.setTargetAtTime(0.001, time + duration * 0.8, 0.04);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + duration + 0.05);
    subOsc.stop(time + duration + 0.05);
  }

  synthLead(freq, time, duration = 0.2) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    // Slight detune for fat EDM lead
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.006, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, time);
    filter.frequency.exponentialRampToValueAtTime(1200, time + duration);
    filter.Q.setValueAtTime(2.0, time);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.setTargetAtTime(0.001, time + duration * 0.85, 0.03);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.04);
    osc2.stop(time + duration + 0.04);
  }

  // =========================================================================
  // COMBAT & GAMEPLAY SOUND EFFECTS
  // =========================================================================

  playPunch(isHeavy = false, isCrit = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Sub thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startFreq = isHeavy ? 180 : 220;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.1);

    gain.gain.setValueAtTime(isCrit ? 0.9 : 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);

    // Impact crack noise
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isCrit ? 2200 : 1600, t);
    noiseFilter.Q.setValueAtTime(2.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isCrit ? 0.8 : 0.55, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
  }

  playSlash() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Katana/saber sharp metallic sweep
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4500, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + 0.1);
    filter.Q.setValueAtTime(6.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // Resonant ring
    const ring = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(1480, t);
    ringGain.gain.setValueAtTime(0.3, t);
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    ring.connect(ringGain);
    ringGain.connect(this.sfxGain);
    ring.start(t);
    ring.stop(t + 0.19);
  }

  playStaffHit() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Resonant woody thwack
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.12);

    gain.gain.setValueAtTime(0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playNunchakuSpin() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(700, t + 0.05);
    osc.frequency.linearRampToValueAtTime(250, t + 0.09);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  playPerfectChime() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Sparkling bell chime
    [880, 1320, 1760].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.02);

      gain.gain.setValueAtTime(0.2, t + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.02 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.02);
      osc.stop(t + idx * 0.02 + 0.22);
    });
  }

  playComboChime(combo) {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Ascending pentatonic melody according to combo
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
    const note = scale[Math.min(scale.length - 1, Math.floor(combo / 5)) % scale.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note, t);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playMiss() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Whiff whoosh
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.12);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // Discordant whiff tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);

    oscGain.gain.setValueAtTime(0.25, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  playHurt() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Heavy thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playFeverActivate() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Riser sweep + explosive sub drop
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(150, t);
    sweep.frequency.exponentialRampToValueAtTime(900, t + 0.25);

    sweepGain.gain.setValueAtTime(0.5, t);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    sweep.connect(sweepGain);
    sweepGain.connect(this.sfxGain);
    sweep.start(t);
    sweep.stop(t + 0.3);

    // Sub boom
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(180, t + 0.2);
    boom.frequency.exponentialRampToValueAtTime(25, t + 0.8);

    boomGain.gain.setValueAtTime(0.9, t + 0.2);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boom.start(t + 0.2);
    boom.stop(t + 0.9);
  }

  playSuperChat() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // "Cha-ching" arcade cash register bell
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.35, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.38);
    });
  }

  playVictory() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Victory fanfare chords
    const chord = [440, 554.37, 659.25, 880];
    chord.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.95);
    });
  }

  playClick() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.035);
  }
}
