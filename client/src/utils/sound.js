import { useEffect, useState } from "react";

const SOUND_KEY = "ai-arena.sound.v1";
const VOLUME_KEY = "ai-arena.volume.v1";
const SOUND_EVENT = "ai-arena:sound-changed";

let sharedCtx = null;
let ambientTimer = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  if (sharedCtx.state === "suspended") {
    void sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function getVolumeSettings() {
  if (typeof window === "undefined") return { sfx: 0.65, music: 0.25, musicEnabled: false };
  try {
    const raw = window.localStorage.getItem(VOLUME_KEY);
    if (!raw) return { sfx: 0.65, music: 0.25, musicEnabled: false };
    const parsed = JSON.parse(raw);
    return {
      sfx: typeof parsed.sfx === "number" ? parsed.sfx : 0.65,
      music: typeof parsed.music === "number" ? parsed.music : 0.25,
      musicEnabled: Boolean(parsed.musicEnabled),
    };
  } catch {
    return { sfx: 0.65, music: 0.25, musicEnabled: false };
  }
}

export function saveVolumeSettings(patch) {
  const next = { ...getVolumeSettings(), ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(VOLUME_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(SOUND_EVENT));
    } catch {
      // Ignore storage errors.
    }
  }
  if (!next.musicEnabled) stopAmbientLoop();
  else startAmbientLoop();
  return next;
}

export function toggleSoundEnabled() {
  const next = !isSoundEnabled();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      window.dispatchEvent(new Event(SOUND_EVENT));
    } catch {
      // Ignore storage errors.
    }
  }
  if (!next) stopAmbientLoop();
  return next;
}

export function useSoundEnabled() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    setEnabled(isSoundEnabled());
    const sync = () => setEnabled(isSoundEnabled());
    window.addEventListener(SOUND_EVENT, sync);
    return () => window.removeEventListener(SOUND_EVENT, sync);
  }, []);
  return enabled;
}

function tone(freq, duration, type = "triangle", baseGain = 0.04, delay = 0) {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const { sfx } = getVolumeSettings();
  const gainVal = Math.max(0.0002, baseGain * (sfx / 0.65));
  try {
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch {
    // Ignore audio errors in restricted environments.
  }
}

export function playClick() {
  tone(520, 0.06, "triangle", 0.03);
}

export function playLock() {
  tone(660, 0.09, "sine", 0.035, 0);
  tone(880, 0.12, "sine", 0.035, 0.05);
}

export function playCoin() {
  tone(987.77, 0.07, "sine", 0.04, 0);
  tone(1318.51, 0.14, "sine", 0.04, 0.06);
}

export function playLevelUp() {
  tone(440, 0.09, "triangle", 0.045, 0);
  tone(554.37, 0.09, "triangle", 0.045, 0.08);
  tone(659.25, 0.09, "triangle", 0.045, 0.16);
  tone(880, 0.25, "sine", 0.05, 0.24);
}

export function playShuffle() {
  tone(420, 0.07, "sawtooth", 0.02, 0);
  tone(580, 0.07, "sawtooth", 0.02, 0.05);
  tone(780, 0.1, "triangle", 0.03, 0.1);
}

export function playResult(passed) {
  if (passed) {
    tone(523.25, 0.11, "triangle", 0.045, 0);
    tone(659.25, 0.11, "triangle", 0.045, 0.08);
    tone(783.99, 0.14, "triangle", 0.045, 0.16);
    tone(1046.5, 0.24, "sine", 0.05, 0.25);
  } else {
    tone(320, 0.14, "sawtooth", 0.03, 0);
    tone(240, 0.22, "sawtooth", 0.03, 0.12);
  }
}

export function startAmbientLoop() {
  if (typeof window === "undefined") return;
  if (ambientTimer) return;
  const notes = [220, 261.63, 293.66, 329.63];
  let step = 0;
  ambientTimer = window.setInterval(() => {
    const { musicEnabled, music } = getVolumeSettings();
    if (!isSoundEnabled() || !musicEnabled || music <= 0.01) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const freq = notes[step % notes.length];
      step += 1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.015 * music, start + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.7);
    } catch {
      // Ignore ambient audio failure.
    }
  }, 1900);
}

export function stopAmbientLoop() {
  if (ambientTimer && typeof window !== "undefined") {
    window.clearInterval(ambientTimer);
    ambientTimer = null;
  }
}
