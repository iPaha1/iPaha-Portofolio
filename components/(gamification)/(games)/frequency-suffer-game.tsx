// =============================================================================
// GAME 18: FREQUENCY SURFER — Tune your wave to match the target frequency
// components/(gamification)/(games)/frequency-surfer-game.tsx
//
// Concept: A beautiful oscilloscope canvas shows TWO waves — a target (white)
// and yours (neon cyan). Use left/right drag or buttons to tune your frequency.
// When your wave syncs with the target, they merge into resonance — a
// satisfying interference pattern pulses and you score. 
// 6 rounds, each with a harder target. The visual when they align is stunning.
// Actual Web Audio API plays the sine wave tones for real audio feedback.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Radio, Minus, Plus } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 200;
const TOTAL_ROUNDS = 6;
const TOLERANCE = 0.04; // how close is "matched" (fraction of target freq)

interface Round {
  targetFreq: number;  // Hz, 1-8 cycles across canvas
  label: string;
}

const ROUNDS: Round[] = [
  { targetFreq: 2,   label: "2 Hz"  },
  { targetFreq: 3.5, label: "3.5 Hz"},
  { targetFreq: 5,   label: "5 Hz"  },
  { targetFreq: 1.5, label: "1.5 Hz"},
  { targetFreq: 4,   label: "4 Hz"  },
  { targetFreq: 6.5, label: "6.5 Hz"},
];

export function FrequencySurferGame({
  gameId, rewardTokens, duration = 35,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef({
    userFreq: 1.0,
    phase:    0,
    frame:    0,
  });
  const rafRef     = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef      = useRef<OscillatorNode | null>(null);

  const [round, setRound]       = useState(0);
  const [score, setScore]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]       = useState<"tuning" | "locked" | "done">("tuning");
  const [resonance, setResonance] = useState(0); // 0-1
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; freq: number } | null>(null);

  const scoreRef = useRef(0);
  const roundRef = useRef(0);
  const phaseRef = useRef<"tuning" | "locked" | "done">("tuning");

  const target = ROUNDS[round] ?? ROUNDS[0];

  const playToneAt = useCallback((freq: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (oscRef.current) { try { oscRef.current.stop(); } catch {} }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 110 + freq * 40; // audible range
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      oscRef.current = osc;
      // Auto-stop after 0.3s
      setTimeout(() => { try { osc.stop(); } catch {} }, 300);
    } catch {}
  }, [soundEnabled]);

  const playChime = useCallback((accuracy: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      [1, 1.26, 1.5].forEach((r, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = 440 * r * (accuracy > 0.8 ? 1.2 : 1);
        g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5 + i * 0.06);
        o.start(ctx.currentTime + i * 0.06);
        o.stop(ctx.currentTime + 0.5 + i * 0.06);
      });
    } catch {}
  }, [soundEnabled]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    s.frame++;
    s.phase += 0.04;

    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#030a10"); bg.addColorStop(1, "#040c18");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(6,182,212,0.06)"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 42) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // Centre line
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();

    const tFreq = ROUNDS[roundRef.current]?.targetFreq ?? 2;
    const uFreq = s.userFreq;
    const diff  = Math.abs(uFreq - tFreq) / tFreq;
    const res   = Math.max(0, 1 - diff / TOLERANCE);
    setResonance(res);

    const amp = H * 0.36;

    // TARGET wave (white / grey)
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let px = 0; px <= W; px++) {
      const t = (px / W) * Math.PI * 2 * tFreq + s.phase * 0.6;
      const y = H / 2 + Math.sin(t) * amp * 0.7;
      px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.restore();

    // USER wave (neon cyan, with glow)
    ctx.save();
    const waveColor = res > 0.8
      ? `rgba(16,185,129,${0.7 + res * 0.3})`
      : `rgba(6,182,212,${0.6 + res * 0.4})`;
    ctx.strokeStyle = waveColor;
    ctx.lineWidth   = res > 0.7 ? 3 : 2;
    ctx.shadowBlur  = res > 0.5 ? 18 + res * 20 : 8;
    ctx.shadowColor = res > 0.8 ? "rgba(16,185,129,0.8)" : "rgba(6,182,212,0.6)";
    ctx.beginPath();
    for (let px = 0; px <= W; px++) {
      const t = (px / W) * Math.PI * 2 * uFreq + s.phase;
      const y = H / 2 + Math.sin(t) * amp;
      px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.restore();

    // RESONANCE interference overlay
    if (res > 0.4) {
      ctx.save();
      ctx.globalAlpha = res * 0.18;
      ctx.fillStyle   = res > 0.8 ? "#10b981" : "#06b6d4";
      for (let px = 0; px <= W; px += 3) {
        const t1 = (px / W) * Math.PI * 2 * tFreq + s.phase * 0.6;
        const t2 = (px / W) * Math.PI * 2 * uFreq + s.phase;
        const y1 = H / 2 + Math.sin(t1) * amp * 0.7;
        const y2 = H / 2 + Math.sin(t2) * amp;
        const mid = (y1 + y2) / 2;
        ctx.fillRect(px, Math.min(y1, y2), 2, Math.abs(y2 - y1));
      }
      ctx.restore();
    }

    // Freq labels
    ctx.save();
    ctx.font = "bold 10px 'Sora',system-ui"; ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(`Target: ${ROUNDS[roundRef.current]?.label}`, 12, 18);
    ctx.fillStyle = res > 0.8 ? "#10b981" : "rgba(6,182,212,0.8)";
    ctx.fillText(`Yours: ${s.userFreq.toFixed(1)} Hz`, 12, 32);
    ctx.restore();

    if (phaseRef.current === "tuning") rafRef.current = requestAnimationFrame(draw);
  }, []);

  const lockIn = useCallback(() => {
    if (phaseRef.current !== "tuning") return;
    const s = stateRef.current;
    const tFreq = ROUNDS[roundRef.current]?.targetFreq ?? 2;
    const diff  = Math.abs(s.userFreq - tFreq) / tFreq;
    const acc   = Math.max(0, 1 - diff / TOLERANCE);
    const pts   = Math.round(acc * 100);
    scoreRef.current += pts;
    setScore(scoreRef.current);
    setLastResult(acc > 0.85 ? "RESONANCE!" : acc > 0.5 ? "Close" : "Off frequency");
    playChime(acc);
    phaseRef.current = "locked";
    setPhase("locked");

    setTimeout(() => {
      setLastResult(null);
      const nr = roundRef.current + 1;
      roundRef.current = nr;
      if (nr >= TOTAL_ROUNDS) {
        phaseRef.current = "done";
        setPhase("done");
        cancelAnimationFrame(rafRef.current);
        const reward = Math.min(Math.floor(rewardTokens * (scoreRef.current / 400 + 0.4)), rewardTokens * 2);
        onComplete(reward, scoreRef.current);
        return;
      }
      setRound(nr);
      stateRef.current.userFreq = 1.0;
      phaseRef.current = "tuning";
      setPhase("tuning");
      rafRef.current = requestAnimationFrame(draw);
    }, 800);
  }, [playChime, rewardTokens, onComplete, draw]);

  const adjustFreq = useCallback((delta: number) => {
    if (phaseRef.current !== "tuning") return;
    stateRef.current.userFreq = Math.max(0.5, Math.min(9, stateRef.current.userFreq + delta));
    playToneAt(stateRef.current.userFreq);
  }, [playToneAt]);

  // Drag to tune
  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== "tuning") return;
    setDragStart({ x: e.clientX, freq: stateRef.current.userFreq });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart || phaseRef.current !== "tuning") return;
    const dx = e.clientX - dragStart.x;
    const newFreq = Math.max(0.5, Math.min(9, dragStart.freq + dx * 0.04));
    stateRef.current.userFreq = Math.round(newFreq * 10) / 10;
  };
  const onPointerUp = () => setDragStart(null);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) {
        clearInterval(t);
        if (phaseRef.current === "tuning") lockIn();
        return 0;
      }
      return p - 1;
    }), 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(t); try { oscRef.current?.stop(); } catch {} };
  }, [draw, lockIn]);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "#030a10" }}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <span className="text-[10px] font-black tracking-[0.15em] text-white/30">
            Round {round + 1}/{TOTAL_ROUNDS}
          </span>
          {resonance > 0.5 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xs animate-pulse"
              style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)" }}
            >
              <span className="text-emerald-400 font-black text-xs">{Math.round(resonance * 100)}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      <canvas ref={canvasRef} width={W} height={H}
        className="absolute cursor-ew-resize"
        style={{ top: "44px", left: 0, right: 0, width: "100%", height: `${H}px` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 gap-4"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button onClick={() => adjustFreq(-0.1)} className="w-9 h-9 rounded-xs flex items-center justify-center transition-all"
          style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: "#06b6d4" }}
        ><Minus className="w-4 h-4" /></button>

        {/* Resonance meter */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${resonance * 100}%` }}
              style={{ background: resonance > 0.8 ? "#10b981" : resonance > 0.5 ? "#06b6d4" : "#f59e0b" }}
            />
          </div>
          <AnimatePresence mode="wait">
            {lastResult ? (
              <motion.p key="res" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                className="text-[11px] font-black"
                style={{ color: lastResult.includes("RESO") ? "#10b981" : "#f59e0b" }}
              >{lastResult}</motion.p>
            ) : (
              <motion.button key="lock" onClick={lockIn}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-6 py-1.5 rounded-xs text-xs font-black"
                style={{
                  background: resonance > 0.8 ? "#10b981" : "rgba(6,182,212,0.15)",
                  border: `1px solid ${resonance > 0.8 ? "#10b981" : "rgba(6,182,212,0.3)"}`,
                  color: resonance > 0.8 ? "black" : "#06b6d4",
                  boxShadow: resonance > 0.8 ? "0 0 16px rgba(16,185,129,0.5)" : "none",
                }}
              >Lock In</motion.button>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => adjustFreq(0.1)} className="w-9 h-9 rounded-xs flex items-center justify-center transition-all"
          style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: "#06b6d4" }}
        ><Plus className="w-4 h-4" /></button>
      </div>

      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-cyan-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">{TOTAL_ROUNDS} frequencies tuned</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isFlash && (
        <div className="absolute top-11 right-3 z-20 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse"
          style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fcd34d" }}
        >⚡ FLASH</div>
      )}
    </div>
  );
}