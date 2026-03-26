// =============================================================================
// GAME 18: RHYTHM PULSE — Tap in perfect time as pulses reach the beat ring
// components/(gamification)/(games)/rhythm-pulse-game.tsx
//
// Mechanic: Pulses travel inward along 4 lanes toward a central beat ring.
// Tap the lane (or anywhere for single-lane mode) exactly when the pulse
// hits the ring. PERFECT (<40ms off) = 100pts. GOOD (<100ms) = 60pts.
// OKAY (<160ms) = 30pts. Miss = 0. Chain PERFECTS for a multiplier.
// Tempo gradually increases. Visual-only rhythm — no audio required.
// Completely different from every other game in the set.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Trophy, Zap, Star } from "lucide-react";
import type { GameProps } from "./game-types";

type Grade = "PERFECT" | "GOOD" | "OKAY" | "MISS";

interface Pulse {
  id:      string;
  lane:    0 | 1 | 2 | 3;
  spawnedAt: number;  // ms timestamp
  travelMs:  number;  // ms to reach ring
  hit:     boolean;
  missed:  boolean;
}

interface HitResult {
  id:      string;
  grade:   Grade;
  lane:    0 | 1 | 2 | 3;
}

const GRADE_CFG: Record<Grade, { pts: number; color: string; label: string }> = {
  PERFECT: { pts: 100, color: "#f59e0b", label: "PERFECT!" },
  GOOD:    { pts:  60, color: "#10b981", label: "GOOD!"    },
  OKAY:    { pts:  30, color: "#3b82f6", label: "OKAY"     },
  MISS:    { pts:   0, color: "#ef4444", label: "MISS"     },
};

const LANE_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#8b5cf6"];
const LANE_KEYS   = ["a", "s", "d", "f"];     // keyboard shortcuts
const LANE_LABELS = ["A", "S", "D", "F"];

const BEAT_WINDOW  = 160;   // ms total window either side of perfect
const PERFECT_WIN  =  40;
const GOOD_WIN     = 100;

const CANVAS_SIZE  = 260;   // px square
const RING_R       = 44;    // % of half-canvas
const SPAWN_R      = 46;    // % — just outside ring

export function RhythmPulseGame({
  gameId, rewardTokens, duration = 30, onComplete, isFlash = false,
}: GameProps) {
  const [pulses,    setPulses]    = useState<Pulse[]>([]);
  const [results,   setResults]   = useState<HitResult[]>([]);
  const [combo,     setCombo]     = useState(0);
  const [score,     setScore]     = useState(0);
  const [total,     setTotal]     = useState(0);
  const [hits,      setHits]      = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(duration);
  const [done,      setDone]      = useState(false);
  const [laneLit,   setLaneLit]   = useState<Set<number>>(new Set());

  const scoreRef   = useRef(0);
  const comboRef   = useRef(0);
  const totalRef   = useRef(0);
  const hitsRef    = useRef(0);
  const doneRef    = useRef(false);
  const pulsesRef  = useRef<Pulse[]>([]);
  const tempoRef   = useRef(1200);   // ms between beats (BPM ~50 → ~80)
  const spawnTimer = useRef<NodeJS.Timeout | null>(null);
  const frameRef   = useRef<number>(0);

  const flashLane = useCallback((lane: number) => {
    setLaneLit(prev => new Set([...prev, lane]));
    setTimeout(() => setLaneLit(prev => { const n = new Set(prev); n.delete(lane); return n; }), 120);
  }, []);

  const showResult = useCallback((grade: Grade, lane: 0|1|2|3) => {
    const id = `r-${Date.now()}-${Math.random()}`;
    const r: HitResult = { id, grade, lane };
    setResults(prev => [...prev.slice(-5), r]);
    setTimeout(() => setResults(prev => prev.filter(x => x.id !== id)), 700);
  }, []);

  // ── Spawn pulses ──────────────────────────────────────────────────────────────
  const spawnPulse = useCallback(() => {
    if (doneRef.current) return;
    const lane = Math.floor(Math.random() * 4) as 0|1|2|3;
    const id   = `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const travelMs = tempoRef.current * 1.5;  // travel time slightly longer than interval

    const pulse: Pulse = { id, lane, spawnedAt: Date.now(), travelMs, hit: false, missed: false };
    pulsesRef.current = [...pulsesRef.current, pulse];
    setPulses([...pulsesRef.current]);

    // Schedule next
    tempoRef.current = Math.max(650, tempoRef.current - 12);
    spawnTimer.current = setTimeout(spawnPulse, tempoRef.current);
  }, []);

  // ── RAF loop — mark missed pulses ────────────────────────────────────────────
  const loop = useCallback(() => {
    if (doneRef.current) return;
    const now = Date.now();
    let changed = false;
    for (const p of pulsesRef.current) {
      if (p.hit || p.missed) continue;
      const age  = now - p.spawnedAt;
      const late = age - p.travelMs;
      if (late > BEAT_WINDOW) {
        p.missed = true;
        changed  = true;
        comboRef.current = 0;
        setCombo(0);
        totalRef.current++;
        setTotal(totalRef.current);
        showResult("MISS", p.lane);
      }
    }
    pulsesRef.current = pulsesRef.current.filter(p => !p.missed || (Date.now() - p.spawnedAt) < p.travelMs + 500);
    if (changed) setPulses([...pulsesRef.current]);
    frameRef.current = requestAnimationFrame(loop);
  }, [showResult]);

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    spawnTimer.current = setTimeout(spawnPulse, 800);
    frameRef.current   = requestAnimationFrame(loop);

    const timer = setInterval(() => {
      if (doneRef.current) { clearInterval(timer); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (spawnTimer.current) clearTimeout(spawnTimer.current);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // ── Game over ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!done) return;
    if (spawnTimer.current) clearTimeout(spawnTimer.current);
    cancelAnimationFrame(frameRef.current);
    const accuracy = totalRef.current > 0 ? hitsRef.current / totalRef.current : 0;
    const final    = Math.max(1, Math.round(rewardTokens * (0.3 + accuracy * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1400);
  }, [done]);

  // ── Tap handler ───────────────────────────────────────────────────────────────
  const handleTap = useCallback((lane: 0|1|2|3) => {
    if (doneRef.current) return;
    flashLane(lane);
    const now = Date.now();

    // Find the closest un-hit pulse in this lane
    let best: Pulse | null = null;
    let bestDelta = Infinity;

    for (const p of pulsesRef.current) {
      if (p.hit || p.missed || p.lane !== lane) continue;
      const beatTime = p.spawnedAt + p.travelMs;
      const delta    = Math.abs(now - beatTime);
      if (delta < bestDelta) { bestDelta = delta; best = p; }
    }

    if (!best || bestDelta > BEAT_WINDOW) {
      // Empty tap
      comboRef.current = 0;
      setCombo(0);
      return;
    }

    best.hit = true;
    pulsesRef.current = pulsesRef.current.map(p => p.id === best!.id ? { ...p, hit: true } : p);
    setPulses([...pulsesRef.current]);

    const grade: Grade = bestDelta <= PERFECT_WIN ? "PERFECT" : bestDelta <= GOOD_WIN ? "GOOD" : "OKAY";
    const cfg   = GRADE_CFG[grade];

    if (grade !== "OKAY") { comboRef.current++; } else { comboRef.current = Math.max(0, comboRef.current - 1); }
    setCombo(comboRef.current);

    const comboBonus = comboRef.current >= 5 ? 20 : comboRef.current >= 3 ? 10 : 0;
    const pts        = cfg.pts + comboBonus;
    scoreRef.current += pts;
    setScore(scoreRef.current);
    totalRef.current++;
    setTotal(totalRef.current);
    hitsRef.current++;
    setHits(hitsRef.current);
    showResult(grade, lane);
  }, [flashLane, showResult]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = LANE_KEYS.indexOf(e.key.toLowerCase());
      if (idx !== -1) handleTap(idx as 0|1|2|3);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleTap]);

  const accuracy = total > 0 ? Math.round((hits / total) * 100) : 100;
  const half     = CANVAS_SIZE / 2;

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(180deg,#050d1a 0%,#0a0a1a 100%)", minHeight: 300 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Music className="w-3.5 h-3.5 text-purple-400" />{score}
          </div>
          {combo >= 3 && (
            <div className="text-xs font-black" style={{ color: "#f59e0b" }}>{combo}× combo!</div>
          )}
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {accuracy}% acc
          </div>
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 8 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Stage */}
      <div className="flex flex-col items-center pt-3 pb-2">
        <div className="relative" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
          <svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ position: "absolute", inset: 0 }}>
            {/* Background rings */}
            {[10, 20, 30, 40].map(r => (
              <circle key={r} cx={half} cy={half} r={`${r}%`}
                fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}

            {/* Beat ring */}
            <circle cx={half} cy={half} r={`${RING_R}%`}
              fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />

            {/* Lane tick marks on beat ring */}
            {[0,1,2,3].map(lane => {
              const angle = (lane * 90 - 90) * Math.PI / 180;
              const ringPx = (RING_R / 100) * half;
              const x = half + Math.cos(angle) * ringPx;
              const y = half + Math.sin(angle) * ringPx;
              const lit = laneLit.has(lane);
              return (
                <circle key={lane} cx={x} cy={y} r="7"
                  fill={lit ? LANE_COLORS[lane] : "rgba(255,255,255,0.08)"}
                  stroke={LANE_COLORS[lane]}
                  strokeWidth="1.5"
                  style={{ transition: "fill 0.08s" }} />
              );
            })}

            {/* Pulse circles */}
            {pulses.filter(p => !p.hit && !p.missed).map(p => {
              const now      = Date.now();
              const progress = Math.min(1, (now - p.spawnedAt) / p.travelMs);
              const angle    = (p.lane * 90 - 90) * Math.PI / 180;
              const maxR     = (SPAWN_R / 100) * half;
              const ringR    = (RING_R  / 100) * half;
              const dist     = maxR - (maxR - ringR) * progress;
              const px       = half + Math.cos(angle) * dist;
              const py       = half + Math.sin(angle) * dist;
              const lateMs   = now - p.spawnedAt - p.travelMs;
              const opacity  = lateMs > 0 ? Math.max(0, 1 - lateMs / BEAT_WINDOW) : 1;

              return (
                <g key={p.id} opacity={opacity}>
                  <circle cx={px} cy={py} r="10"
                    fill={`${LANE_COLORS[p.lane]}30`}
                    stroke={LANE_COLORS[p.lane]} strokeWidth="2" />
                  <circle cx={px} cy={py} r="4" fill={LANE_COLORS[p.lane]} />
                </g>
              );
            })}

            {/* Centre dot */}
            <circle cx={half} cy={half} r="6"
              fill={combo >= 5 ? "#f59e0b" : "rgba(255,255,255,0.15)"}
              style={{ transition: "fill 0.3s" }} />
          </svg>

          {/* Hit result popups */}
          {results.map(r => {
            const angle = (r.lane * 90 - 90) * Math.PI / 180;
            const ringPx = (RING_R / 100) * half;
            const px = half + Math.cos(angle) * ringPx;
            const py = half + Math.sin(angle) * ringPx;
            const cfg = GRADE_CFG[r.grade];
            return (
              <motion.div key={r.id}
                initial={{ opacity: 1, scale: 0.8, x: px - 30, y: py - 12 }}
                animate={{ opacity: 0, scale: 1.1, y: py - 36 }}
                transition={{ duration: 0.65 }}
                className="absolute pointer-events-none font-black text-xs whitespace-nowrap z-10"
                style={{ color: cfg.color, textShadow: "0 1px 6px #000", left: 0, top: 0 }}>
                {cfg.label}
              </motion.div>
            );
          })}
        </div>

        {/* Lane buttons */}
        <div className="flex gap-2 mt-1">
          {[0,1,2,3].map(lane => (
            <motion.button
              key={lane}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleTap(lane as 0|1|2|3)}
              className="flex flex-col items-center justify-center rounded-xs font-black text-xs"
              style={{
                width: 52, height: 40,
                background: laneLit.has(lane)
                  ? `${LANE_COLORS[lane]}30`
                  : "rgba(255,255,255,0.05)",
                border: laneLit.has(lane)
                  ? `2px solid ${LANE_COLORS[lane]}`
                  : `1px solid rgba(255,255,255,0.1)`,
                color: LANE_COLORS[lane],
                boxShadow: laneLit.has(lane) ? `0 0 16px ${LANE_COLORS[lane]}50` : "none",
                transition: "all 0.08s",
              }}>
              <div className="w-2 h-2 rounded-full mb-0.5" style={{ background: LANE_COLORS[lane] }} />
              {LANE_LABELS[lane]}
            </motion.button>
          ))}
        </div>

        <p className="text-[9px] mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
          Tap buttons or press A S D F when pulses hit the ring
        </p>
      </div>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {accuracy}% accuracy · {hits}/{total} hits
          </p>
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