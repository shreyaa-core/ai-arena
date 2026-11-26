import { useEffect, useState } from "react";

const SOUND_KEY = "ai-arena.sound.v1";
const SOUND_EVENT = "ai-arena:sound-changed";

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  if (sharedCtx.state === "suspended") {
    void sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function toggleSoundEnabled(): boolean {
  const next = !isSoundEnabled();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      window.dispatchEvent(new Event(SOUND_EVENT));
    } catch {
      // Ignore storage errors.
    }
  }
  return next;
}

export function useSoundEnabled(): boolean {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    setEnabled(isSoundEnabled());
    const sync = () => setEnabled(isSoundEnabled());
    window.addEventListener(SOUND_EVENT, sync);
    return () => window.removeEventListener(SOUND_EVENT, sync);
  }, []);
  return enabled;
}

function tone(freq: number, duration: number, type: OscillatorType = "triangle", gainVal = 0.04, delay = 0) {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
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
    // Ignore audio errors in restricted headless environments.
  }
}

export function playClick() {
  tone(520, 0.06, "triangle", 0.03);
}

export function playLock() {
  tone(660, 0.09, "sine", 0.035, 0);
  tone(880, 0.12, "sine", 0.035, 0.05);
}

export function playShuffle() {
  tone(420, 0.07, "sawtooth", 0.02, 0);
  tone(580, 0.07, "sawtooth", 0.02, 0.05);
  tone(780, 0.1, "triangle", 0.03, 0.1);
}

export function playResult(passed: boolean) {
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
