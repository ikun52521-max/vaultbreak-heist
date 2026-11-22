// Vaultbreak — sound: tiny WebAudio synth, no audio files.
// Every sound is an oscillator (or a short noise burst) built in code, so
// the game loads nothing over the network. Sound starts muted until the
// player presses a key or clicks (browsers require a gesture), and M toggles
// it. Nothing here is needed for play: the game is fully silent-safe.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  /** Unlock audio on a user gesture; call from keydown/click handlers. */
  function unlock() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }

  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol = 0.1, when = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(gain).connect(c.destination);
    src.start(t0);
  }

  return {
    unlock,
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopAlarm();
      return muted;
    },
    pickup() {
      tone(660, 0.09, 'sine', 0.12);
      tone(990, 0.14, 'sine', 0.12, 0.08);
    },
    vaultCrack() {
      tone(440, 0.06, 'square', 0.05);
    },
    vaultOpen() {
      tone(523, 0.12, 'sine', 0.12);
      tone(659, 0.12, 'sine', 0.12, 0.1);
      tone(784, 0.2, 'sine', 0.12, 0.2);
    },
    smoke() {
      noise(0.35, 0.12);
    },
    emp() {
      tone(1200, 0.18, 'sawtooth', 0.06);
      tone(300, 0.25, 'sawtooth', 0.06, 0.05);
    },
    dash() {
      noise(0.12, 0.06);
    },
    caught() {
      tone(220, 0.25, 'sawtooth', 0.14);
      tone(165, 0.4, 'sawtooth', 0.14, 0.2);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.12, i * 0.13));
    },
    spotted() {
      tone(880, 0.08, 'square', 0.06);
    },
    /** A soft pulsing alarm while the meter is hot; call every frame. */
    alarmPulse(hot) {
      const c = ensure();
      if (!c || muted) {
        this.stopAlarm();
        return;
      }
      if (!hot) {
        this.stopAlarm();
        return;
      }
      if (!alarmOsc) {
        alarmOsc = c.createOscillator();
        alarmGain = c.createGain();
        alarmOsc.type = 'sine';
        alarmOsc.frequency.value = 520;
        alarmGain.gain.value = 0.0;
        alarmOsc.connect(alarmGain).connect(c.destination);
        alarmOsc.start();
      }
      const target = 0.035 + 0.02 * Math.sin(c.currentTime * 6);
      alarmGain.gain.setTargetAtTime(Math.max(0, target), c.currentTime, 0.05);
    },
    stopAlarm() {
      if (alarmOsc) {
        try {
          alarmOsc.stop();
        } catch {
          /* already stopped */
        }
        alarmOsc = null;
        alarmGain = null;
      }
    },
  };
}
