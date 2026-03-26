// =============================================================================
// GAME 21: CHAIN REACTION — Click to trigger cascading explosions
// components/(gamification)/(games)/chain-reaction-game.tsx
//
// Mechanic: A grid of cells each hold 1-3 coloured orbs. Clicking a cell
// adds an orb. When a cell reaches its CRITICAL MASS (= number of neighbours),
// it EXPLODES — sending one orb to each adjacent cell, which may then also
// reach critical mass and chain-explode. Click strategically to trigger the
// longest chain reaction for maximum points. Chain length × 10pts per cell.
// Each round the grid re-fills with a new random configuration. Rounds get
// denser (more starting orbs). Pure strategic prediction.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Atom, Trophy, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const COLS = 6;
const ROWS = 5;
const TOTAL = COLS * ROWS;

type OrbColor = "red" | "blue" | "green" | "gold";
const COLORS: OrbColor[] = ["red", "blue", "green", "gold"];
const COLOR_HEX: Record<OrbColor, string> = {
  red: "#ef4444", blue: "#3b82f6", green: "#10b981", gold: "#f59e0b",
};

interface Cell {
  orbs:  number;
  color: OrbColor;
  exploding: boolean;
}

function criticalMass(idx: number): number {
  const r = Math.floor(idx / COLS), c = idx % COLS;
  const top = r > 0, bot = r < ROWS - 1, left = c > 0, right = c < COLS - 1;
  return [top, bot, left, right].filter(Boolean).length;
}

function neighbours(idx: number): number[] {
  const r = Math.floor(idx / COLS), c = idx % COLS;
  const n: number[] = [];
  if (r > 0)        n.push(idx - COLS);
  if (r < ROWS - 1) n.push(idx + COLS);
  if (c > 0)        n.push(idx - 1);
  if (c < COLS - 1) n.push(idx + 1);
  return n;
}

function buildGrid(density: number): Cell[] {
  return Array.from({ length: TOTAL }, (_, i) => {
    const orbs  = Math.random() < density ? 1 + Math.floor(Math.random() * (criticalMass(i) - 1)) : 0;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return { orbs: Math.max(0, orbs), color, exploding: false };
  });
}

export function ChainReactionGame({
  gameId, rewardTokens, duration = 40, onComplete, isFlash = false,
}: GameProps) {
  const [grid,     setGrid]     = useState<Cell[]>(() => buildGrid(0.55));
  const [score,    setScore]    = useState(0);
  const [chain,    setChain]    = useState(0);
  const [maxChain, setMaxChain] = useState(0);
  const [round,    setRound]    = useState(1);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [done,     setDone]     = useState(false);
  const [explodingCells, setExplodingCells] = useState<Set<number>>(new Set());
  const [animating, setAnimating] = useState(false);

  const scoreRef    = useRef(0);
  const roundRef    = useRef(1);
  const doneRef     = useRef(false);
  const maxChainRef = useRef(0);

  // Timer
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

  // Game over
  useEffect(() => {
    if (!done) return;
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + Math.min(1, scoreRef.current / (roundRef.current * 60)) * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  // ── Chain reaction engine ────────────────────────────────────────────────────
  const runReaction = useCallback(async (startGrid: Cell[], clickIdx: number) => {
    setAnimating(true);
    let g = startGrid.map(c => ({ ...c }));
    let chainLen = 0;
    const queue: number[] = [clickIdx];
    const exploded = new Set<number>();

    // Add orb to clicked cell, same colour as cell (or random if empty)
    if (g[clickIdx].orbs === 0) g[clickIdx].color = COLORS[Math.floor(Math.random() * COLORS.length)];
    g[clickIdx].orbs++;

    const step = async () => {
      if (queue.length === 0 || doneRef.current) {
        setAnimating(false);
        const pts = chainLen * 10 + (chainLen >= 5 ? 30 : chainLen >= 10 ? 60 : 0);
        scoreRef.current += pts;
        setScore(scoreRef.current);
        setChain(chainLen);
        if (chainLen > maxChainRef.current) { maxChainRef.current = chainLen; setMaxChain(chainLen); }
        setExplodingCells(new Set());

        // Check if all cells are cleared → new round bonus
        const remaining = g.reduce((acc, c) => acc + c.orbs, 0);
        if (remaining === 0 || chainLen > TOTAL * 0.6) {
          roundRef.current++;
          setRound(roundRef.current);
          const density = Math.min(0.8, 0.55 + roundRef.current * 0.04);
          setTimeout(() => {
            if (!doneRef.current) setGrid(buildGrid(density));
          }, 400);
        } else {
          setGrid([...g]);
        }
        return;
      }

      const idx = queue.shift()!;
      const cm  = criticalMass(idx);
      if (g[idx].orbs < cm) { await step(); return; }

      // Explode
      chainLen++;
      exploded.add(idx);
      setExplodingCells(new Set(exploded));
      g[idx].orbs -= cm;

      for (const n of neighbours(idx)) {
        g[n].orbs++;
        if (g[n].orbs === 0) g[n].color = g[idx].color;
        if (g[n].orbs >= criticalMass(n) && !exploded.has(n)) {
          if (!queue.includes(n)) queue.push(n);
        }
      }

      setGrid([...g]);
      await new Promise(res => setTimeout(res, 120));
      await step();
    };

    await step();
  }, []);

  const handleClick = (idx: number) => {
    if (animating || doneRef.current) return;
    const g = grid.map(c => ({ ...c }));
    runReaction(g, idx);
  };

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1a0f2e 100%)", minHeight: 290 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Atom className="w-3.5 h-3.5 text-purple-400" />{score}
          </div>
          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs"
            style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>
            Round {round}
          </div>
          {chain > 0 && (
            <div className="text-xs font-black" style={{ color: chain >= 10 ? "#f59e0b" : chain >= 5 ? "#10b981" : "#a5b4fc" }}>
              Chain {chain}!
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {maxChain > 0 && (
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>best {maxChain}</div>
          )}
          <div className="font-black text-base tabular-nums"
            style={{ color: timeLeft <= 8 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-col items-center py-3 px-3 gap-1.5">
        {Array.from({ length: ROWS }).map((_, row) => (
          <div key={row} className="flex gap-1.5">
            {Array.from({ length: COLS }).map((_, col) => {
              const idx  = row * COLS + col;
              const cell = grid[idx];
              const cm   = criticalMass(idx);
              const isCrit = cell.orbs >= cm - 1 && cell.orbs > 0;
              const isExp  = explodingCells.has(idx);
              const hex    = cell.orbs > 0 ? COLOR_HEX[cell.color] : "transparent";

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleClick(idx)}
                  animate={isExp ? { scale: [1, 1.4, 0.8, 1], rotate: [0, 15, -15, 0] } : { scale: 1 }}
                  transition={isExp ? { duration: 0.25 } : { type: "spring", damping: 20 }}
                  whileHover={!animating ? { scale: 1.08 } : {}}
                  className="relative flex items-center justify-center rounded-xs"
                  style={{
                    width: 44, height: 44,
                    background: cell.orbs > 0
                      ? `${hex}22`
                      : "rgba(255,255,255,0.03)",
                    border: cell.orbs > 0
                      ? `1.5px solid ${hex}60`
                      : "1px solid rgba(255,255,255,0.07)",
                    boxShadow: isExp ? `0 0 20px ${hex}` : isCrit ? `0 0 8px ${hex}50` : "none",
                    cursor: animating ? "default" : "pointer",
                    transition: "background 0.15s, border 0.15s",
                  }}>
                  {/* Orb dots */}
                  <div className={`grid gap-0.5 ${cell.orbs <= 1 ? "" : cell.orbs === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                    {Array.from({ length: cell.orbs }).map((_, oi) => (
                      <motion.div key={oi}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="rounded-full"
                        style={{
                          width: cell.orbs >= 3 ? 8 : 10,
                          height: cell.orbs >= 3 ? 8 : 10,
                          background: `radial-gradient(circle at 35% 30%, ${hex}ff, ${hex}aa)`,
                          boxShadow: `0 0 6px ${hex}80`,
                        }} />
                    ))}
                  </div>
                  {/* Critical mass warning ring */}
                  {isCrit && !isExp && (
                    <div className="absolute inset-0 rounded-xs"
                      style={{ border: `2px solid ${hex}`, animation: "critPulse 0.6s ease-in-out infinite" }} />
                  )}
                  {/* cm indicator bottom-right */}
                  <div className="absolute bottom-0.5 right-0.5 text-[7px] font-black leading-none"
                    style={{ color: `${hex}60` }}>
                    {cm}
                  </div>
                </motion.button>
              );
            })}
          </div>
        ))}
        <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
          Click to add orbs — cells explode when full, chain for big points
        </p>
      </div>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Longest chain: {maxChain} · {round - 1} round{round - 1 !== 1 ? "s" : ""}
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
        @keyframes critPulse {
          0%,100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}