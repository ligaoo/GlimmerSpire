/* 微光尖塔 - WebAudio 合成音效 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};

  const MUTE_KEY = 'glimmerSpireMute';

  const AudioFX = {
    ctx: null,
    muted: false,
    init() {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { this.ctx = null; }
    },
    setMuted(m) {
      this.muted = m;
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { }
    },
    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone(freq, dur, type, vol, delay) {
      if (!this.ctx || this.muted) return;
      try {
        const t0 = this.ctx.currentTime + (delay || 0);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t0); osc.stop(t0 + dur + 0.02);
      } catch (e) { }
    },
    noise(dur, vol, freq) {
      if (!this.ctx || this.muted) return;
      try {
        const t0 = this.ctx.currentTime;
        const len = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = freq || 900;
        const gain = this.ctx.createGain();
        gain.gain.value = vol || 0.2;
        src.connect(filt); filt.connect(gain); gain.connect(this.ctx.destination);
        src.start(t0);
      } catch (e) { }
    },
    play(name) {
      if (!this.ctx) return;
      switch (name) {
        case 'click': this.tone(660, 0.06, 'square', 0.05); break;
        case 'hover': this.tone(880, 0.03, 'sine', 0.02); break;
        case 'playCard': this.tone(520, 0.08, 'triangle', 0.12); this.tone(700, 0.1, 'triangle', 0.08, 0.05); break;
        case 'attack': this.noise(0.16, 0.3, 1400); this.tone(180, 0.12, 'sawtooth', 0.1); break;
        case 'bigattack': this.noise(0.28, 0.4, 900); this.tone(110, 0.25, 'sawtooth', 0.16); break;
        case 'enemyHit': this.noise(0.14, 0.25, 700); this.tone(140, 0.1, 'square', 0.08); break;
        case 'hurt': this.tone(140, 0.2, 'sawtooth', 0.18); this.noise(0.15, 0.18, 500); break;
        case 'block': this.tone(240, 0.12, 'square', 0.1); this.tone(320, 0.14, 'square', 0.07, 0.04); break;
        case 'heal': this.tone(520, 0.12, 'sine', 0.1); this.tone(660, 0.14, 'sine', 0.1, 0.08); this.tone(880, 0.18, 'sine', 0.08, 0.16); break;
        case 'coin': this.tone(1200, 0.06, 'square', 0.07); this.tone(1600, 0.09, 'square', 0.06, 0.05); break;
        case 'potion': this.tone(400, 0.1, 'sine', 0.1); this.tone(800, 0.12, 'sine', 0.08, 0.07); break;
        case 'relic': this.tone(600, 0.1, 'triangle', 0.1); this.tone(900, 0.12, 'triangle', 0.1, 0.08); this.tone(1200, 0.16, 'triangle', 0.08, 0.16); break;
        case 'draw': this.tone(740, 0.04, 'sine', 0.04); break;
        case 'shuffle': this.noise(0.12, 0.12, 2000); break;
        case 'death': this.tone(300, 0.3, 'sawtooth', 0.12); this.tone(150, 0.4, 'sawtooth', 0.12, 0.1); break;
        case 'victory': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.12, i * 0.13)); break;
        case 'defeat': [400, 340, 280, 200].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.1, i * 0.15)); break;
        case 'turn': this.tone(440, 0.08, 'square', 0.06); this.tone(560, 0.08, 'square', 0.05, 0.06); break;
        case 'intent': this.tone(220, 0.1, 'sine', 0.06); break;
        case 'upgrade': this.tone(700, 0.1, 'triangle', 0.1); this.tone(1050, 0.15, 'triangle', 0.1, 0.08); break;
      }
    }
  };

  global.GS.AudioFX = AudioFX;
})(typeof window !== 'undefined' ? window : globalThis);
