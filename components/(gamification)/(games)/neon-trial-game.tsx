// =============================================================================
// GAME 25: NEON TRAIL — Grow your trail collecting orbs, never cross yourself
// components/(gamification)/(games)/neon-trail-game.tsx
//
// Mechanic: You control a glowing neon snake on a grid. Use arrow keys (or
// swipe / tap quadrant buttons on mobile). Collect glowing orbs to grow and
// score. Touch your own trail = game over. Speed increases every 5 orbs.
// Gold orbs give a short-lived speed boost + triple points. The trail glows
// with a fading gradient from head to tail — pure neon beauty on dark canvas.
// Classic Snake reimagined: no walls, wraps around edges, gradient trail,
// multiplier orbs, and a "ghost" mode power-up that lets you pass through
// yourself once. Completely different from all 23 games before it.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy } from "lucide-react";
import type { GameProps } from "./game-types";

const COLS  = 18;
const ROWS  = 14;
const TOTAL = COLS * ROWS;

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface Orb {
  idx:   number;
  type:  "normal" | "gold" | "ghost";
  value: number;
}

const ORB_CFG = {
  normal: { color: "#10b981", glow: "#10b98190", value: 10,  weight: 70 },
  gold:   { color: "#f59e0b", glow: "#f59e0b90", value: 30,  weight: 20 },
  ghost:  { color: "#8b5cf6", glow: "#8b5cf690", value: 15,  weight: 10 },
};

function weightedOrb(): Orb["type"] {
  const r = Math.random() * 100;
  if (r < 10) return "ghost";
  if (r < 30) return "gold";
  return "normal";
}

function randomEmptyCell(snake: number[], orbs: Orb[]): number {
  const occupied = new Set([...snake, ...orbs.map(o => o.idx)]);
  const empty    = Array.from({ length: TOTAL }, (_, i) => i).filter(i => !occupied.has(i));
  return empty.length > 0 ? empty[Math.floor(Math.random() * empty.length)] : 0;
}

function move(idx: number, dir: Dir): number {
  const r = Math.floor(idx / COLS), c = idx % COLS;
  let nr = r, nc = c;
  if (dir === "UP")    nr = (r - 1 + ROWS) % ROWS;
  if (dir === "DOWN")  nr = (r + 1)        % ROWS;
  if (dir === "LEFT")  nc = (c - 1 + COLS) % COLS;
  if (dir === "RIGHT") nc = (c + 1)        % COLS;
  return nr * COLS + nc;
}

const INITIAL_SPEED = 160; // ms per step

export function NeonTrailGame({
  gameId, rewardTokens, duration = 40, onComplete, isFlash = false,
}: GameProps) {
  const [snake,     setSnake]     = useState<number[]>([Math.floor(ROWS/2)*COLS + Math.floor(COLS/2)]);
  const [orbs,      setOrbs]      = useState<Orb[]>([]);
  const [dir,       setDir]       = useState<Dir>("RIGHT");
  const [score,     setScore]     = useState(0);
  const [orbCount,  setOrbCount]  = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(duration);
  const [done,      setDone]      = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [speedBoost,setSpeedBoost]= useState(false);
  const [pops,      setPops]      = useState<{ id: string; idx: number; text: string; color: string }[]>([]);

  const snakeRef    = useRef<number[]>([Math.floor(ROWS/2)*COLS + Math.floor(COLS/2)]);
  const dirRef      = useRef<Dir>("RIGHT");
  const pendingDir  = useRef<Dir>("RIGHT");
  const orbsRef     = useRef<Orb[]>([]);
  const scoreRef    = useRef(0);
  const orbCountRef = useRef(0);
  const ghostRef    = useRef(false);
  const doneRef     = useRef(false);
  const speedRef    = useRef(INITIAL_SPEED);
  const stepTimer   = useRef<NodeJS.Timeout | null>(null);

  const showPop = (text: string, idx: number, color: string) => {
    const id = `pop-${Date.now()}-${Math.random()}`;
    setPops(prev => [...prev, { id, idx, text, color }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 700);
  };

  // ── Spawn initial orbs ────────────────────────────────────────────────────────
  const spawnOrb = useCallback((currentSnake: number[], currentOrbs: Orb[]) => {
    const type = weightedOrb();
    const idx  = randomEmptyCell(currentSnake, currentOrbs);
    return { idx, type, value: ORB_CFG[type].value };
  }, []);

  useEffect(() => {
    const head  = snakeRef.current[0];
    const initOrbs: Orb[] = [
      spawnOrb([head], []),
      spawnOrb([head], [spawnOrb([head], [])]),
    ];
    orbsRef.current = initOrbs;
    setOrbs(initOrbs);
  }, [spawnOrb]);

  // ── Step function ────────────────────────────────────────────────────────────
  const step = useCallback(() => {
    if (doneRef.current) return;

    // Commit pending direction (prevent 180° reversal)
    const pd = pendingDir.current;
    const cd = dirRef.current;
    const isReverse = (pd==="UP"&&cd==="DOWN")||(pd==="DOWN"&&cd==="UP")||(pd==="LEFT"&&cd==="RIGHT")||(pd==="RIGHT"&&cd==="LEFT");
    if (!isReverse) dirRef.current = pd;

    const newHead = move(snakeRef.current[0], dirRef.current);

    // Self-collision check
    if (!ghostRef.current && snakeRef.current.slice(1).includes(newHead)) {
      doneRef.current = true;
      setDone(true);
      return;
    }

    let newSnake = [newHead, ...snakeRef.current];
    let grew     = false;
    let newOrbs  = [...orbsRef.current];

    // Orb collection
    const orbIdx = newOrbs.findIndex(o => o.idx === newHead);
    if (orbIdx !== -1) {
      const orb = newOrbs[orbIdx];
      grew = true;
      newOrbs.splice(orbIdx, 1);

      const pts = orb.value * (speedBoost ? 2 : 1);
      scoreRef.current += pts;
      setScore(scoreRef.current);
      orbCountRef.current++;
      setOrbCount(orbCountRef.current);
      showPop(`+${pts}`, newHead, ORB_CFG[orb.type].color);

      // Power-ups
      if (orb.type === "gold") {
        setSpeedBoost(true);
        speedRef.current = Math.max(60, speedRef.current - 50);
        setTimeout(() => { setSpeedBoost(false); speedRef.current = Math.max(80, INITIAL_SPEED - orbCountRef.current * 4); }, 4000);
      }
      if (orb.type === "ghost") {
        ghostRef.current = true;
        setGhostMode(true);
        setTimeout(() => { ghostRef.current = false; setGhostMode(false); }, 3500);
      }

      // Spawn replacement
      const newOrb = spawnOrb(newSnake, newOrbs);
      newOrbs.push(newOrb);
      // Sometimes spawn a bonus second orb
      if (Math.random() < 0.3) newOrbs.push(spawnOrb(newSnake, newOrbs));

      // Speed ramp every 5 orbs
      if (orbCountRef.current % 5 === 0) {
        speedRef.current = Math.max(70, speedRef.current - 8);
      }
    }

    if (!grew) newSnake = newSnake.slice(0, -1); // no growth → remove tail

    snakeRef.current = newSnake;
    orbsRef.current  = newOrbs;
    setSnake([...newSnake]);
    setOrbs([...newOrbs]);

    // Schedule next step
    stepTimer.current = setTimeout(step, speedRef.current);
  }, [spawnOrb, speedBoost]);

  useEffect(() => {
    stepTimer.current = setTimeout(step, speedRef.current);
    const timer = setInterval(() => {
      if (doneRef.current) { clearInterval(timer); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (stepTimer.current) clearTimeout(stepTimer.current); clearInterval(timer); };
  }, [step]);

  // Game over
  useEffect(() => {
    if (!done) return;
    if (stepTimer.current) clearTimeout(stepTimer.current);
    const lengthBonus = snakeRef.current.length * 5;
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + Math.min(1, scoreRef.current / 200) * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  // Controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp:"UP", ArrowDown:"DOWN", ArrowLeft:"LEFT", ArrowRight:"RIGHT", w:"UP", s:"DOWN", a:"LEFT", d:"RIGHT", W:"UP", S:"DOWN", A:"LEFT", D:"RIGHT" };
      if (map[e.key]) { e.preventDefault(); pendingDir.current = map[e.key]; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Touch swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) pendingDir.current = dx > 0 ? "RIGHT" : "LEFT";
    else                             pendingDir.current = dy > 0 ? "DOWN" : "UP";
    touchStart.current = null;
  };

  // Render helpers
  const snakeSet = new Set(snake);
  const CELL_W   = 100 / COLS;
  const CELL_H   = 100 / ROWS;
  const headIdx  = snake[0];

  const trailColor = (pos: number) => {
    const frac = 1 - pos / Math.max(1, snake.length - 1);
    if (ghostMode) return `rgba(139,92,246,${0.2 + frac * 0.6})`;
    if (speedBoost) return `rgba(245,158,11,${0.2 + frac * 0.7})`;
    return `rgba(16,185,129,${0.15 + frac * 0.75})`;
  };
  const headColor = ghostMode ? "#a78bfa" : speedBoost ? "#f59e0b" : "#10b981";

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ background: "linear-gradient(180deg,#020c14 0%,#050d1a 100%)", minHeight: 290 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />{score}
          </div>
          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs"
            style={{ background: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.25)" }}>
            len {snake.length} · {orbCount} orbs
          </div>
          {ghostMode  && <div className="text-xs font-black animate-pulse" style={{ color: "#a78bfa" }}>👻 Ghost!</div>}
          {speedBoost && <div className="text-xs font-black animate-pulse" style={{ color: "#f59e0b" }}>⚡ Boost!</div>}
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 8 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Grid */}
      <div className="relative mx-3 mt-2 mb-1 rounded-xs overflow-hidden"
        style={{ paddingBottom: `${(ROWS / COLS) * 100}%`, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent calc(${CELL_H}% - 1px), rgba(255,255,255,0.03) calc(${CELL_H}% - 1px), rgba(255,255,255,0.03) ${CELL_H}%), repeating-linear-gradient(90deg, transparent, transparent calc(${CELL_W}% - 1px), rgba(255,255,255,0.03) calc(${CELL_W}% - 1px), rgba(255,255,255,0.03) ${CELL_W}%)`,
        }} />

        {/* Snake body */}
        {snake.map((cellIdx, pos) => {
          const r = Math.floor(cellIdx / COLS), c = cellIdx % COLS;
          const isHead = pos === 0;
          return (
            <motion.div key={`s-${cellIdx}-${pos}`}
              initial={isHead ? { scale: 0.6 } : undefined}
              animate={isHead ? { scale: 1 } : undefined}
              transition={{ duration: 0.08 }}
              className="absolute rounded-xs"
              style={{
                left:   `${c * CELL_W}%`,
                top:    `${r * CELL_H}%`,
                width:  `${CELL_W}%`,
                height: `${CELL_H}%`,
                background: isHead
                  ? `radial-gradient(circle at 40% 35%, ${headColor}ff, ${headColor}aa)`
                  : trailColor(pos),
                boxShadow: isHead
                  ? `0 0 10px ${headColor}90, 0 0 20px ${headColor}40`
                  : `0 0 4px ${headColor}30`,
                borderRadius: isHead ? "30%" : "20%",
                zIndex: isHead ? 3 : 2,
              }} />
          );
        })}

        {/* Orbs */}
        {orbs.map(orb => {
          const r   = Math.floor(orb.idx / COLS), c = orb.idx % COLS;
          const cfg = ORB_CFG[orb.type];
          return (
            <motion.div key={`o-${orb.idx}`}
              initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.25 }}
              className="absolute flex items-center justify-center rounded-full"
              style={{
                left:    `${c * CELL_W + CELL_W * 0.15}%`,
                top:     `${r * CELL_H + CELL_H * 0.15}%`,
                width:   `${CELL_W * 0.7}%`,
                height:  `${CELL_H * 0.7}%`,
                background: `radial-gradient(circle at 35% 30%, ${cfg.color}ff, ${cfg.color}88)`,
                boxShadow: `0 0 8px ${cfg.glow}, 0 0 16px ${cfg.glow}`,
                zIndex: 4,
                animation: orb.type !== "normal" ? "orbPulse 0.8s ease-in-out infinite" : "none",
              }} />
          );
        })}

        {/* Score pops */}
        {pops.map(p => {
          const r = Math.floor(p.idx / COLS), c = p.idx % COLS;
          return (
            <motion.div key={p.id}
              initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.65 }}
              className="absolute pointer-events-none font-black text-[10px] z-20 whitespace-nowrap"
              style={{ left: `${c * CELL_W}%`, top: `${r * CELL_H}%`, color: p.color, textShadow: "0 1px 4px #000" }}>
              {p.text}
            </motion.div>
          );
        })}
      </div>

      {/* Mobile d-pad */}
      <div className="flex justify-center pb-2 gap-1">
        {(["LEFT","UP","DOWN","RIGHT"] as Dir[]).map(d => {
          const symbols: Record<Dir,string> = { UP:"↑", DOWN:"↓", LEFT:"←", RIGHT:"→" };
          return (
            <button key={d}
              onPointerDown={() => { pendingDir.current = d; }}
              className="w-8 h-8 rounded-xs flex items-center justify-center text-base font-black"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {symbols[d]}
            </button>
          );
        })}
      </div>

      <p className="text-center pb-1 text-[9px]" style={{ color: "rgba(255,255,255,0.18)" }}>
        Arrow keys · WASD · Swipe · or tap buttons
      </p>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Length {snake.length} · {orbCount} orbs collected
          </p>
        </motion.div>
      )}

      {isFlash && (
        <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
          style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
          2× Flash
        </div>
      )}

      <style>{`
        @keyframes orbPulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}