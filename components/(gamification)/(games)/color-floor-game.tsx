// =============================================================================
// GAME 11: COLOR FLOOD — Flood-fill the board from the corner
// components/(gamification)/(games)/color-flood-game.tsx
//
// Concept: A 10×10 grid of coloured cells. You control the top-left region.
// Pick a colour from the palette — your region expands to absorb all adjacent
// cells of that colour. Flood the entire board in ≤ 22 moves to win.
// Fewer moves = bigger reward. Satisfying cascade animations per flood.
// =============================================================================

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Trophy, Timer, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const COLS = 10;
const ROWS = 10;
const MAX_MOVES = 22;

const PALETTE = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

function randomGrid(): number[] {
  return Array.from({ length: COLS * ROWS }, () => Math.floor(Math.random() * PALETTE.length));
}

// BFS flood-fill — returns set of indices owned after picking newColor
function flood(grid: number[], newColor: number): Set<number> {
  const owned = getOwned(grid);
  const toAdd = new Set<number>(owned);
  const queue = [...owned].filter(i => grid[i] !== newColor ? false : !owned.has(i));
  // Actually: expand owned region to absorb adjacent cells of newColor
  const frontier = new Set<number>();
  owned.forEach(i => {
    neighbors(i).forEach(n => { if (!owned.has(n) && grid[n] === newColor) frontier.add(n); });
  });
  const visited = new Set<number>(owned);
  const q = [...frontier];
  while (q.length) {
    const cur = q.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    toAdd.add(cur);
    if (grid[cur] === newColor) {
      neighbors(cur).forEach(n => { if (!visited.has(n) && grid[n] === newColor) q.push(n); });
    }
  }
  return toAdd;
}

function getOwned(grid: number[]): Set<number> {
  const startColor = grid[0];
  const owned = new Set<number>();
  const q = [0];
  while (q.length) {
    const cur = q.shift()!;
    if (owned.has(cur)) continue;
    owned.add(cur);
    neighbors(cur).forEach(n => { if (!owned.has(n) && grid[n] === startColor) q.push(n); });
  }
  return owned;
}

function neighbors(i: number): number[] {
  const r = Math.floor(i / COLS), c = i % COLS, ns = [];
  if (r > 0)        ns.push(i - COLS);
  if (r < ROWS - 1) ns.push(i + COLS);
  if (c > 0)        ns.push(i - 1);
  if (c < COLS - 1) ns.push(i + 1);
  return ns;
}

function applyFlood(grid: number[], newColor: number): number[] {
  const newOwned = flood(grid, newColor);
  const next = [...grid];
  newOwned.forEach(i => { next[i] = newColor; });
  return next;
}

function isComplete(grid: number[]): boolean {
  return grid.every(c => c === grid[0]);
}

export function ColorFloodGame({
  gameId,
  rewardTokens,
  duration = 60,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const [grid, setGrid]         = useState<number[]>(randomGrid);
  const [moves, setMoves]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]       = useState<"playing" | "won" | "lost">("playing");
  const [newCells, setNewCells] = useState<Set<number>>(new Set());
  const [owned, setOwned]       = useState<Set<number>>(() => new Set([0]));

  const gridRef  = useRef(grid);
  const ownedRef = useRef(owned);
  useEffect(() => { gridRef.current  = grid;  }, [grid]);
  useEffect(() => { ownedRef.current = owned; }, [owned]);

  const playSound = useCallback((t: "pick" | "flood" | "win" | "lose") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const freqs: Record<string, [number, OscillatorType, number]> = {
        pick:  [440,  "sine",     0.08],
        flood: [660,  "sine",     0.15],
        win:   [880,  "sine",     0.6 ],
        lose:  [220,  "sawtooth", 0.4 ],
      };
      const [freq, type, dur] = freqs[t];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    // Recompute owned on grid change
    setOwned(getOwned(grid));
  }, [grid]);

  const pickColor = useCallback((colorIdx: number) => {
    if (phase !== "playing") return;
    const current = gridRef.current;
    if (current[0] === colorIdx) return; // same color, skip

    playSound("pick");
    const prevOwned = ownedRef.current;
    const nextGrid  = applyFlood(current, colorIdx);
    const nextOwned = getOwned(nextGrid);

    // Animate newly claimed cells
    const fresh = new Set<number>();
    nextOwned.forEach(i => { if (!prevOwned.has(i)) fresh.add(i); });
    setNewCells(fresh);
    setTimeout(() => setNewCells(new Set()), 400);

    if (fresh.size > 0) playSound("flood");

    const newMoves = moves + 1;
    setGrid(nextGrid);
    setMoves(newMoves);

    if (isComplete(nextGrid)) {
      playSound("win");
      setPhase("won");
      const efficiency = Math.max(0, (MAX_MOVES - newMoves) / MAX_MOVES);
      const reward = Math.min(Math.floor(rewardTokens * (0.5 + efficiency * 1.5)), rewardTokens * 2);
      setTimeout(() => onComplete(reward, MAX_MOVES - newMoves), 1800);
    } else if (newMoves >= MAX_MOVES) {
      playSound("lose");
      setPhase("lost");
      setTimeout(() => onComplete(Math.floor(rewardTokens * 0.2), 0), 1800);
    }
  }, [phase, moves, rewardTokens, onComplete, playSound]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); if (phase === "playing") { setPhase("lost"); onComplete(Math.floor(rewardTokens * 0.15), 0); } return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const ownedCount = owned.size;
  const totalCells = COLS * ROWS;
  const progress   = ownedCount / totalCells;

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#080c10 0%,#0c1018 100%)" }}
    >
      {/* Stats */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-pink-400" />
            <span className="text-white font-black text-sm">{moves}/{MAX_MOVES} moves</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black tracking-widest text-white/30">
              {Math.round(progress * 100)}% flooded
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-11 left-0 right-0 h-0.5 z-10" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ background: PALETTE[grid[0]] }}
        />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 flex items-center justify-center pt-10 pb-14">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: "2px", width: "min(260px, 70vw)", aspectRatio: "1" }}>
          {grid.map((colorIdx, i) => {
            const isOwn   = owned.has(i);
            const isNew   = newCells.has(i);
            return (
              <motion.div
                key={i}
                animate={isNew ? { scale: [1, 1.25, 1] } : {}}
                transition={{ duration: 0.25 }}
                className="rounded-xs"
                style={{
                  background: PALETTE[colorIdx],
                  opacity:    isOwn ? 1 : 0.55,
                  boxShadow:  isOwn ? `0 0 4px ${PALETTE[colorIdx]}80` : "none",
                  transition: "background 0.18s, opacity 0.18s",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Colour palette */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex justify-center gap-3"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {PALETTE.map((col, i) => {
          const isCurrent = grid[0] === i;
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => pickColor(i)}
              className="rounded-xs transition-all"
              style={{
                width:     isCurrent ? "36px" : "30px",
                height:    isCurrent ? "36px" : "30px",
                background: col,
                border:     isCurrent ? `2px solid white` : "2px solid transparent",
                boxShadow:  isCurrent ? `0 0 12px ${col}` : `0 0 6px ${col}60`,
                opacity:    isCurrent ? 1 : 0.75,
              }}
            />
          );
        })}
      </div>

      {/* End overlay */}
      <AnimatePresence>
        {phase !== "playing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className={`w-14 h-14 mx-auto mb-3 ${phase === "won" ? "text-amber-400" : "text-gray-500"}`} />
              <p className="text-3xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>
                {phase === "won" ? `${MAX_MOVES - moves} moves saved!` : "Board not flooded"}
              </p>
              <p className="text-white/40 text-sm">{moves} moves used of {MAX_MOVES}</p>
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