// =============================================================================
// TOKEN RUSH — Game Sound System
// app/token-rush/_games/use-game-sound.ts
//
// Pure Web Audio API synthesis. Zero external assets.
// All sounds are generated procedurally — works offline, no CDN dependency.
// =============================================================================
"use client";

import { useCallback, useRef } from "react";

// ── All named sounds ──────────────────────────────────────────────────────────
export type SoundName =
  | "uiClick"       // generic button press
  | "uiHover"       // light hover tick
  | "moveLock"      // player commits a move
  | "predCorrect"   // prediction was right
  | "predWrong"     // prediction was wrong
  | "roundStart"    // round begins
  | "roundEnd"      // round result shown
  | "countdown"     // one tick of the timer
  | "timerUrgent"   // last 3 seconds pulse
  | "phantomPlace"  // placing a ghost piece
  | "probeHit"      // probe found a phantom
  | "probeMiss"     // probe missed
  | "oppLocked"     // opponent committed their move
  | "gameWin"       // player won the match
  | "gameLose"      // player lost the match
  | "challengePost" // challenge broadcast
  | "challengeAccept" // challenge accepted
  | "tokensCredit"; // tokens added to wallet

// ── AudioContext singleton ────────────────────────────────────────────────────

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const W = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? W.webkitAudioContext;
    if (!Ctor) return null;
    return new Ctor();
  } catch { return null; }
}

// ── Low-level tone helper ─────────────────────────────────────────────────────

type ToneOpts = {
  type?:     OscillatorType;
  freq:      number;
  freqEnd?:  number;
  vol?:      number;
  dur?:      number;   // seconds
  delay?:    number;   // seconds
  attack?:   number;   // seconds
};

function tone(ctx: AudioContext, o: ToneOpts) {
  const {
    type = "sine", freq, freqEnd, vol = 0.18,
    dur = 0.12, delay = 0, attack = 0.004,
  } = o;
  const now   = ctx.currentTime + delay;
  const osc   = ctx.createOscillator();
  const gain  = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 10), now + dur);
  }

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.start(now);
  osc.stop(now + dur + 0.04);
}

// ── Helper: layered noise burst (hit effect) ──────────────────────────────────
function noise(ctx: AudioContext, vol: number, dur: number, delay = 0) {
  const buf    = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src    = ctx.createBufferSource();
  const gain   = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  src.buffer  = buf;
  filter.type = "bandpass";
  filter.frequency.value = 300;
  filter.Q.value = 0.5;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
  src.start(ctx.currentTime + delay);
}

// ── Sound recipes ─────────────────────────────────────────────────────────────

const SOUNDS: Record<SoundName, (ctx: AudioContext, vol: number) => void> = {

  uiClick(ctx, v) {
    tone(ctx, { type: "triangle", freq: 900, freqEnd: 650, vol: v * 0.45, dur: 0.06 });
  },

  uiHover(ctx, v) {
    tone(ctx, { type: "sine", freq: 700, vol: v * 0.18, dur: 0.04 });
  },

  moveLock(ctx, v) {
    tone(ctx, { type: "square", freq: 280, freqEnd: 560, vol: v * 0.35, dur: 0.07 });
    tone(ctx, { type: "sine",   freq: 920, freqEnd: 700, vol: v * 0.28, dur: 0.15, delay: 0.06 });
  },

  predCorrect(ctx, v) {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(ctx, { freq: f, vol: v * 0.65, dur: 0.14, delay: i * 0.08 })
    );
  },

  predWrong(ctx, v) {
    tone(ctx, { type: "sawtooth", freq: 220, freqEnd: 90, vol: v * 0.55, dur: 0.38 });
    noise(ctx, v * 0.12, 0.25, 0.05);
  },

  roundStart(ctx, v) {
    [349, 440, 523].forEach((f, i) =>
      tone(ctx, { type: "sine", freq: f, vol: v * 0.5, dur: 0.13, delay: i * 0.09 })
    );
  },

  roundEnd(ctx, v) {
    tone(ctx, { freq: 660, freqEnd: 520, vol: v * 0.45, dur: 0.28 });
    tone(ctx, { freq: 440, freqEnd: 380, vol: v * 0.3,  dur: 0.2, delay: 0.1 });
  },

  countdown(ctx, v) {
    tone(ctx, { type: "square", freq: 440, vol: v * 0.3, dur: 0.055 });
  },

  timerUrgent(ctx, v) {
    tone(ctx, { type: "square", freq: 600, freqEnd: 800, vol: v * 0.5, dur: 0.09 });
    noise(ctx, v * 0.08, 0.08);
  },

  phantomPlace(ctx, v) {
    tone(ctx, { type: "triangle", freq: 480, freqEnd: 340, vol: v * 0.38, dur: 0.13 });
  },

  probeHit(ctx, v) {
    tone(ctx, { type: "square",   freq: 180, freqEnd: 60,  vol: v * 0.55, dur: 0.22 });
    tone(ctx, { type: "triangle", freq: 580, freqEnd: 280, vol: v * 0.42, dur: 0.18, delay: 0.04 });
    noise(ctx, v * 0.2, 0.18);
  },

  probeMiss(ctx, v) {
    tone(ctx, { type: "sine", freq: 1200, freqEnd: 800, vol: v * 0.28, dur: 0.1 });
  },

  oppLocked(ctx, v) {
    tone(ctx, { type: "sine", freq: 360, vol: v * 0.3, dur: 0.09 });
    tone(ctx, { type: "sine", freq: 480, vol: v * 0.3, dur: 0.09, delay: 0.09 });
  },

  gameWin(ctx, v) {
    const melody = [523, 659, 784, 1046, 1318];
    melody.forEach((f, i) =>
      tone(ctx, { freq: f, vol: v * 0.7, dur: 0.18, delay: i * 0.1 })
    );
    tone(ctx, { type: "triangle", freq: 1046, vol: v * 0.55, dur: 0.55, delay: 0.55 });
  },

  gameLose(ctx, v) {
    const melody = [392, 349, 294, 220];
    melody.forEach((f, i) =>
      tone(ctx, { type: "sawtooth", freq: f, vol: v * 0.5, dur: 0.24, delay: i * 0.13 })
    );
  },

  challengePost(ctx, v) {
    [330, 415, 523, 659].forEach((f, i) =>
      tone(ctx, { type: "sine", freq: f, vol: v * 0.45, dur: 0.12, delay: i * 0.08 })
    );
  },

  challengeAccept(ctx, v) {
    tone(ctx, { freq: 523, vol: v * 0.5, dur: 0.1 });
    tone(ctx, { freq: 784, vol: v * 0.6, dur: 0.18, delay: 0.09 });
  },

  tokensCredit(ctx, v) {
    [523, 659, 784, 1046, 1318].forEach((f, i) =>
      tone(ctx, { type: "sine", freq: f, vol: v * 0.55, dur: 0.15, delay: i * 0.07 })
    );
    tone(ctx, { type: "triangle", freq: 1318, vol: v * 0.5, dur: 0.4, delay: 0.4 });
  },
};

// ── The hook ──────────────────────────────────────────────────────────────────

export interface UseSoundReturn {
  play: (name: SoundName, volumeOverride?: number) => void;
}

export function useGameSound(enabled = true): UseSoundReturn {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback((name: SoundName, volumeOverride?: number) => {
    if (!enabled) return;
    if (!ctxRef.current) ctxRef.current = getCtx();
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Browsers suspend AudioContext until a user gesture. Resume silently.
    if (ctx.state === "suspended") { ctx.resume().catch(() => {}); return; }

    try {
      const recipe = SOUNDS[name];
      if (recipe) recipe(ctx, volumeOverride ?? 0.25);
    } catch { /* non-fatal */ }
  }, [enabled]);

  return { play };
}