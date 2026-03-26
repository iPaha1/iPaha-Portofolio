// =============================================================================
// GAME 26: FREQUENCY MATCH — Drag EQ bars to recreate the target waveform
// components/(gamification)/(games)/frequency-match-game.tsx
//
// Mechanic: A "target" equaliser waveform is shown briefly then hidden. You
// have 8 frequency bars you can drag up/down to match it from memory. Submit
// when you think it matches — score is % closeness across all bars. Target
// waveform grows more complex each round. Combines visual memory with fine
// vertical drag control. Nothing like any other game in the set.
// On mobile: tap a bar to select it, then drag anywhere up/down to adjust.
// On desktop: drag bars directly with mouse.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, Trophy, Eye, EyeOff, Check } from "lucide-react";
import type { GameProps } from "./game-types";

const NUM_BARS   = 8;
const BAR_MIN    = 0;
const BAR_MAX    = 100;
const SHOW_MS_BASE = 3000;

// EQ bar colour gradient low→high frequency
const BAR_COLORS = [
  "#ef4444","#f97316","#f59e0b","#eab308",
  "#10b981","#06b6d4","#3b82f6","#8b5cf6",
];

type Phase = "memorise" | "adjust" | "result";

function randomWave(complexity: number): number[] {
  // Generate a smooth waveform using sin/cos harmonics
  const harmonics = Math.min(4, 1 + Math.floor(complexity / 2));
  return Array.from({ length: NUM_BARS }, (_, i) => {
    let v = 50;
    for (let h = 1; h <= harmonics; h++) {
      const amp   = (30 / h) * (0.6 + Math.random() * 0.8);
      const phase = Math.random() * Math.PI * 2;
      v += amp * Math.sin((i / NUM_BARS) * Math.PI * 2 * h + phase);
    }
    return Math.max(8, Math.min(92, Math.round(v)));
  });
}

function calcAccuracy(user: number[], target: number[]): number {
  const totalError = user.reduce((sum, v, i) => sum + Math.abs(v - target[i]), 0);
  const maxError   = NUM_BARS * BAR_MAX;
  return Math.round((1 - totalError / maxError) * 100);
}

export function FrequencyMatchGame({
  gameId, rewardTokens, duration = 75, onComplete, isFlash = false,
}: GameProps) {
  const [phase,      setPhase]      = useState<Phase>("memorise");
  const [target,     setTarget]     = useState<number[]>(() => randomWave(1));
  const [bars,       setBars]       = useState<number[]>(Array(NUM_BARS).fill(50));
  const [round,      setRound]      = useState(1);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(duration);
  const [done,       setDone]       = useState(false);
  const [accuracy,   setAccuracy]   = useState<number | null>(null);
  const [dragging,   setDragging]   = useState<number | null>(null);   // bar index
  const [selected,   setSelected]   = useState<number | null>(null);   // mobile selected bar

  const scoreRef    = useRef(0);
  const roundRef    = useRef(1);
  const doneRef     = useRef(false);
  const barsRef     = useRef(bars);
  const dragStartY  = useRef<number>(0);
  const dragStartVal= useRef<number>(50);
  const areaRef     = useRef<HTMLDivElement>(null);

  const getShowMs = (r: number) => Math.max(1000, SHOW_MS_BASE - r * 250);

  const initRound = useCallback((r: number) => {
    const t = randomWave(r);
    setTarget(t);
    const reset = Array(NUM_BARS).fill(50);
    setBars(reset);
    barsRef.current = reset;
    setAccuracy(null);
    setDragging(null);
    setSelected(null);
    setPhase("memorise");
    setTimeout(() => { if (!doneRef.current) setPhase("adjust"); }, getShowMs(r));
  }, []);

  useEffect(() => { initRound(1); }, [initRound]);

  useEffect(() => {
    const t = setInterval(() => {
      if (doneRef.current) { clearInterval(t); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!done) return;
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + (scoreRef.current / Math.max(1, roundRef.current * 80)) * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  const handleSubmit = useCallback(() => {
    if (phase !== "adjust" || doneRef.current) return;
    const acc = calcAccuracy(barsRef.current, target);
    setAccuracy(acc);
    setPhase("result");
    const pts = Math.round(acc * 1.5) + (acc >= 85 ? 30 : acc >= 70 ? 15 : 0);
    scoreRef.current += pts;
    setScore(scoreRef.current);
    setTimeout(() => {
      if (doneRef.current) return;
      roundRef.current++;
      setRound(roundRef.current);
      initRound(roundRef.current);
    }, 1400);
  }, [phase, target, initRound]);

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const updateBar = useCallback((idx: number, clientY: number) => {
    if (!areaRef.current) return;
    const rect   = areaRef.current.getBoundingClientRect();
    const relY   = (clientY - rect.top) / rect.height;
    const val    = Math.max(BAR_MIN, Math.min(BAR_MAX, Math.round((1 - relY) * BAR_MAX)));
    barsRef.current = barsRef.current.map((b, i) => i === idx ? val : b);
    setBars([...barsRef.current]);
  }, []);

  const onMouseDown = (idx: number, e: React.MouseEvent) => {
    if (phase !== "adjust") return;
    e.preventDefault();
    setDragging(idx);
    dragStartY.current   = e.clientY;
    dragStartVal.current = barsRef.current[idx];
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (dragging === null) return;
    updateBar(dragging, e.clientY);
  }, [dragging, updateBar]);
  const onMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Mobile: tap to select, then drag anywhere
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (selected === null || phase !== "adjust") return;
    e.preventDefault();
    updateBar(selected, e.touches[0].clientY);
  }, [selected, phase, updateBar]);

  const accColor = accuracy === null ? "#fff" : accuracy >= 85 ? "#10b981" : accuracy >= 65 ? "#f59e0b" : "#ef4444";
  const barHeight = 140; // px for the bar area

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0a0a1a 0%,#0f0f2e 100%)", minHeight: 300 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Music2 className="w-3.5 h-3.5 text-violet-400" />{score}
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>
            Round {round}
          </div>
          <div className="text-[10px] font-bold flex items-center gap-1"
            style={{ color: phase === "memorise" ? "#f59e0b" : phase === "adjust" ? "#10b981" : "#c4b5fd" }}>
            {phase === "memorise" ? <><Eye className="w-3 h-3" /> Memorise</> : phase === "adjust" ? <><Music2 className="w-3 h-3" /> Adjust</> : <><Check className="w-3 h-3" /> Result</>}
          </div>
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* EQ Area */}
      <div ref={areaRef} className="px-4 pt-3 pb-2"
        onTouchMove={onTouchMove} onTouchEnd={() => setSelected(null)}
        style={{ touchAction: "none" }}>

        {/* Labels */}
        <div className="flex justify-between text-[8px] mb-1 px-1"
          style={{ color: "rgba(255,255,255,0.2)" }}>
          {["63","125","250","500","1k","2k","4k","8k"].map(f => (
            <span key={f} style={{ width: "12.5%", textAlign: "center" }}>{f}Hz</span>
          ))}
        </div>

        <div className="relative flex gap-1.5 items-end justify-center"
          style={{ height: barHeight, padding: "0 4px" }}>

          {/* Target overlay (only visible during memorise + result) */}
          {(phase === "memorise" || phase === "result") && (
            <div className="absolute inset-0 flex gap-1.5 items-end justify-center px-1 pointer-events-none z-10">
              {target.map((val, i) => (
                <div key={i} className="flex-1 rounded-t-xs"
                  style={{
                    height: `${val}%`,
                    background: phase === "memorise"
                      ? `${BAR_COLORS[i]}80`
                      : `${BAR_COLORS[i]}40`,
                    border: `1px solid ${BAR_COLORS[i]}`,
                    boxShadow: phase === "memorise" ? `0 0 10px ${BAR_COLORS[i]}60` : "none",
                    transition: "height 0.1s",
                  }} />
              ))}
            </div>
          )}

          {/* User bars */}
          {bars.map((val, i) => {
            const isSel   = selected === i;
            const isDrag  = dragging === i;
            const color   = BAR_COLORS[i];
            return (
              <motion.div
                key={i}
                onMouseDown={e => onMouseDown(i, e)}
                onTouchStart={e => { e.preventDefault(); setSelected(i); updateBar(i, e.touches[0].clientY); }}
                className="flex-1 rounded-t-xs relative cursor-ns-resize"
                style={{
                  height: `${val}%`,
                  background: phase === "result"
                    ? `${color}35`
                    : `linear-gradient(180deg, ${color}cc 0%, ${color}66 100%)`,
                  border: `1px solid ${isSel || isDrag ? color : `${color}60`}`,
                  boxShadow: isSel || isDrag ? `0 0 14px ${color}80` : `0 0 4px ${color}30`,
                  transition: dragging === i ? "none" : "height 0.05s",
                  minHeight: 6,
                  userSelect: "none",
                }}>
                {/* Top handle */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-1.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              </motion.div>
            );
          })}

          {/* Floor line */}
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: "rgba(255,255,255,0.12)" }} />

          {/* y-axis labels */}
          {[0,25,50,75,100].map(v => (
            <div key={v} className="absolute right-full mr-1 text-[8px] pr-0.5"
              style={{ bottom: `${v}%`, color: "rgba(255,255,255,0.2)", transform: "translateY(50%)" }}>
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* Accuracy + Submit */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <AnimatePresence>
          {accuracy !== null && (
            <motion.p key="acc" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-xl font-black" style={{ color: accColor, letterSpacing: "-0.03em" }}>
              {accuracy}% match
            </motion.p>
          )}
        </AnimatePresence>
        {phase === "adjust" && (
          <button onClick={handleSubmit}
            className="ml-auto px-4 py-1.5 rounded-xs text-xs font-black flex items-center gap-1.5"
            style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
            <Check className="w-3 h-3" /> Submit
          </button>
        )}
      </div>

      <p className="text-center pb-2 text-[9px]" style={{ color: "rgba(255,255,255,0.18)" }}>
        {phase === "memorise" ? "Memorise the waveform shape" : phase === "adjust" ? "Drag bars to recreate it from memory" : "Next round coming…"}
      </p>

      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{round - 1} rounds · EQ master</p>
        </motion.div>
      )}

      {isFlash && (
        <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
          style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
          2× Flash
        </div>
      )}
    </div>
  );
}