// =============================================================================
// GAME 11: MOLE MASH — Whack-a-mole with combos, golden moles & bombs
// components/(gamification)/(games)/mole-mash-game.tsx
//
// Mechanic: Moles pop up from holes in a 3×3 grid. Click/tap them before
// they duck back down. Golden moles = 3× points but appear briefly.
// Bomb moles = clicking them loses a life. Speed and concurrency increase.
// Chaining consecutive hits builds a combo multiplier.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, Trophy, Heart, Star } from "lucide-react";
import type { GameProps } from "./game-types";

type MoleType = "normal" | "gold" | "bomb";

interface Mole {
  id:        string;
  hole:      number;    // 0-8
  type:      MoleType;
  value:     number;
  lifespan:  number;    // ms before duck
  spawnedAt: number;
}

const HOLE_COUNT = 9;

const MOLE_CFG: Record<MoleType, {
  bg: string; border: string; glow: string; label: string;
  value: number; weight: number; lifeMin: number; lifeMax: number;
}> = {
  normal: {
    bg: "radial-gradient(circle at 40% 30%, #86efac, #22c55e)",
    border: "#22c55e", glow: "#22c55e70",
    label: "😤", value: 10, weight: 65, lifeMin: 900, lifeMax: 1800,
  },
  gold: {
    bg: "radial-gradient(circle at 40% 30%, #fde68a, #f59e0b)",
    border: "#f59e0b", glow: "#f59e0b90",
    label: "🌟", value: 30, weight: 15, lifeMin: 600, lifeMax: 1100,
  },
  bomb: {
    bg: "radial-gradient(circle at 40% 30%, #374151, #111827)",
    border: "#ef4444", glow: "#ef444460",
    label: "💣", value: -1, weight: 20, lifeMin: 1200, lifeMax: 2200,
  },
};

function pickType(): MoleType {
  const total = Object.values(MOLE_CFG).reduce((a, c) => a + c.weight, 0);
  let r = Math.random() * total;
  for (const [type, cfg] of Object.entries(MOLE_CFG) as [MoleType, typeof MOLE_CFG[MoleType]][]) {
    r -= cfg.weight;
    if (r <= 0) return type;
  }
  return "normal";
}

export function MoleMashGame({
  gameId, rewardTokens, duration = 20, onComplete, isFlash = false,
}: GameProps) {
  const [moles,    setMoles]    = useState<Mole[]>([]);
  const [score,    setScore]    = useState(0);
  const [combo,    setCombo]    = useState(0);
  const [lives,    setLives]    = useState(3);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [done,     setDone]     = useState(false);
  const [pops,     setPops]     = useState<{ id: string; hole: number; text: string; color: string }[]>([]);
  const [missed,   setMissed]   = useState(0);

  const livesRef    = useRef(3);
  const comboRef    = useRef(0);
  const scoreRef    = useRef(0);
  const doneRef     = useRef(false);
  const spawnRef    = useRef<NodeJS.Timeout | null>(null);
  const comboTimer  = useRef<NodeJS.Timeout | null>(null);
  const activeHoles = useRef<Set<number>>(new Set());
  const moleTimers  = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showPop = useCallback((hole: number, text: string, color: string) => {
    const id = `pop-${Date.now()}-${Math.random()}`;
    setPops(prev => [...prev, { id, hole, text, color }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 750);
  }, []);

  // ── Spawn mole ───────────────────────────────────────────────────────────────
  const spawnMole = useCallback(() => {
    if (doneRef.current) return;

    // Find an empty hole
    const emptyHoles = Array.from({ length: HOLE_COUNT }, (_, i) => i)
      .filter(h => !activeHoles.current.has(h));
    if (emptyHoles.length === 0) return;

    const hole    = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
    const type    = pickType();
    const cfg     = MOLE_CFG[type];
    const lifespan = cfg.lifeMin + Math.random() * (cfg.lifeMax - cfg.lifeMin);
    const id      = `mole-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    activeHoles.current.add(hole);
    const newMole: Mole = { id, hole, type, value: cfg.value, lifespan, spawnedAt: Date.now() };

    setMoles(prev => [...prev, newMole]);

    // Auto-duck
    const t = setTimeout(() => {
      activeHoles.current.delete(hole);
      setMoles(prev => prev.filter(m => m.id !== id));
      moleTimers.current.delete(id);
      if (type === "normal" || type === "gold") {
        setMissed(m => m + 1);
        comboRef.current = 0;
        setCombo(0);
      }
    }, lifespan);
    moleTimers.current.set(id, t);
  }, []);

  const scheduleSpawn = useCallback(() => {
    if (doneRef.current) return;
    const elapsed  = duration - timeLeft;
    const interval = Math.max(280, 900 - elapsed * 24);
    // Spawn 1 or 2 moles depending on difficulty
    const count = elapsed > 10 ? (Math.random() < 0.4 ? 2 : 1) : 1;
    spawnRef.current = setTimeout(() => {
      for (let i = 0; i < count; i++) setTimeout(spawnMole, i * 120);
      scheduleSpawn();
    }, interval);
  }, [spawnMole, duration, timeLeft]);

  // ── Timers ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      if (doneRef.current) { clearInterval(t); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    scheduleSpawn();
    return () => {
      clearInterval(t);
      if (spawnRef.current) clearTimeout(spawnRef.current);
      moleTimers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // ── Game over ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!done) return;
    moleTimers.current.forEach(t => clearTimeout(t));
    setMoles([]);
    const hitCount  = Math.floor(scoreRef.current / 10);
    const accuracy  = hitCount / Math.max(1, hitCount + missed);
    const final     = Math.max(1, Math.round(rewardTokens * (0.4 + accuracy * 1.6)));
    setTimeout(() => onComplete(final, scoreRef.current), 1400);
  }, [done]);

  // ── Hit handler ──────────────────────────────────────────────────────────────
  const handleWhack = useCallback((mole: Mole, e: React.MouseEvent) => {
    e.stopPropagation();
    if (doneRef.current) return;

    const t = moleTimers.current.get(mole.id);
    if (t) { clearTimeout(t); moleTimers.current.delete(mole.id); }
    activeHoles.current.delete(mole.hole);
    setMoles(prev => prev.filter(m => m.id !== mole.id));

    if (mole.type === "bomb") {
      livesRef.current -= 1;
      setLives(livesRef.current);
      comboRef.current = 0;
      setCombo(0);
      showPop(mole.hole, "💥 -1 life", "#ef4444");
      if (livesRef.current <= 0) { doneRef.current = true; setDone(true); }
      return;
    }

    // Normal or gold
    comboRef.current += 1;
    setCombo(comboRef.current);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => { comboRef.current = 0; setCombo(0); }, 1500);

    const comboBonus = comboRef.current >= 3 ? Math.floor(mole.value * 0.5) : 0;
    const pts = mole.value + comboBonus;
    scoreRef.current += pts;
    setScore(scoreRef.current);

    const color = mole.type === "gold" ? "#f59e0b" : "#10b981";
    showPop(mole.hole, `+${pts}${comboRef.current >= 3 ? ` 🔥` : ""}`, color);
  }, [showPop]);

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#1a0a0a 0%,#0d1a0d 50%,#0a0a1a 100%)", minHeight: 280 }}>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Hammer className="w-3.5 h-3.5 text-amber-400" />{score}
          </div>
          {combo >= 2 && (
            <div className="text-xs font-black" style={{ color: "#f59e0b" }}>{combo}× combo!</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full transition-all"
                style={{ background: i < lives ? "#ef4444" : "rgba(255,255,255,0.12)", boxShadow: i < lives ? "0 0 6px #ef4444" : "none" }} />
            ))}
          </div>
          <div className="font-black text-lg tabular-nums"
            style={{ color: timeLeft <= 5 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Holes grid */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {Array.from({ length: HOLE_COUNT }).map((_, holeIdx) => {
          const mole    = moles.find(m => m.hole === holeIdx);
          const cfg     = mole ? MOLE_CFG[mole.type] : null;
          const popList = pops.filter(p => p.hole === holeIdx);

          return (
            <div key={holeIdx} className="relative flex flex-col items-center" style={{ minHeight: 70 }}>
              {/* Hole */}
              <div className="w-full rounded-full flex items-center justify-center"
                style={{
                  height: 14,
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)",
                  position: "absolute",
                  bottom: 0,
                  zIndex: 1,
                }} />

              {/* Mole */}
              <AnimatePresence>
                {mole && cfg && (
                  <motion.button
                    key={mole.id}
                    initial={{ y: 40, scaleY: 0.2, opacity: 0 }}
                    animate={{ y: 0, scaleY: 1, opacity: 1 }}
                    exit={{ y: 35, scaleY: 0.3, opacity: 0 }}
                    transition={{ type: "spring", damping: 16, stiffness: 350 }}
                    onClick={e => handleWhack(mole, e)}
                    className="relative z-10 flex items-center justify-center rounded-full font-black text-2xl"
                    style={{
                      width: 52, height: 52,
                      background: cfg.bg,
                      border: `2px solid ${cfg.border}`,
                      boxShadow: `0 0 20px ${cfg.glow}, 0 4px 12px rgba(0,0,0,0.5)`,
                      cursor: "pointer",
                      transformOrigin: "bottom center",
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.85, y: 8 }}
                  >
                    {cfg.label}
                    {/* Lifespan shrinking ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="23" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                      <motion.circle
                        cx="26" cy="26" r="23"
                        fill="none"
                        stroke={cfg.border}
                        strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 23}`}
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 23 }}
                        transition={{ duration: mole.lifespan / 1000, ease: "linear" }}
                      />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Score pops per hole */}
              {popList.map(p => (
                <motion.div key={p.id}
                  initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -38 }}
                  transition={{ duration: 0.7 }}
                  className="absolute pointer-events-none font-black text-xs z-30 whitespace-nowrap"
                  style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", color: p.color, textShadow: "0 1px 6px #000" }}>
                  {p.text}
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pb-3 text-[10px]"
        style={{ color: "rgba(255,255,255,0.3)" }}>
        <span>😤 Normal +10</span>
        <span style={{ color: "#f59e0b" }}>🌟 Gold +30</span>
        <span style={{ color: "#ef4444" }}>💣 Bomb -1 life</span>
      </div>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {missed} escaped · {3 - lives} bomb{3 - lives !== 1 ? "s" : ""} hit
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