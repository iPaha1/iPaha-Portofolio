// =============================================================================
// GAME 16: PIXEL PAINT — Flood-fill a pixel grid to match a target image
// components/(gamification)/(games)/pixel-paint-game.tsx
//
// Mechanic: A 10×10 target image made of coloured pixels is shown briefly,
// then hidden. A blank grid is given to fill using flood-fill clicks — click
// a cell and ALL connected same-colour cells in your canvas change to the
// currently selected colour. Limited colour palette. Limited ink (moves).
// Score = % of cells matching the target when ink runs out or you submit.
// Each round shows the target for shorter time and gives fewer ink moves.
// Pure colour memory + spatial strategy — nothing like any existing game.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Trophy, Eye, EyeOff, Check } from "lucide-react";
import type { GameProps } from "./game-types";

const GRID  = 10;
const TOTAL = GRID * GRID;

// ── Palette ───────────────────────────────────────────────────────────────────
const COLOURS = [
  { id: 0, hex: "#0f172a", label: "Ink"    },
  { id: 1, hex: "#ef4444", label: "Red"    },
  { id: 2, hex: "#f97316", label: "Orange" },
  { id: 3, hex: "#eab308", label: "Yellow" },
  { id: 4, hex: "#10b981", label: "Green"  },
  { id: 5, hex: "#3b82f6", label: "Blue"   },
  { id: 6, hex: "#8b5cf6", label: "Purple" },
  { id: 7, hex: "#f9a8d4", label: "Pink"   },
];
type ColourId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type PixelGrid = ColourId[];

// ── Target generator — simple geometric shapes ────────────────────────────────
function generateTarget(difficulty: number): PixelGrid {
  const grid: ColourId[] = Array(TOTAL).fill(0);
  const numColours = Math.min(COLOURS.length, 3 + Math.floor(difficulty / 2));
  const palette    = [0, ...Array.from({ length: numColours - 1 }, (_, i) => (i + 1) as ColourId)];

  // Fill background
  grid.fill(palette[0] as ColourId);

  // Paint a few rectangular/circular blobs
  const numShapes = 3 + Math.floor(difficulty * 0.8);
  for (let s = 0; s < numShapes; s++) {
    const c  = palette[1 + Math.floor(Math.random() * (palette.length - 1))] as ColourId;
    const cx = 1 + Math.floor(Math.random() * (GRID - 2));
    const cy = 1 + Math.floor(Math.random() * (GRID - 2));
    const r  = 1 + Math.floor(Math.random() * 3);
    const isCircle = Math.random() < 0.5;

    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const inShape = isCircle
          ? Math.hypot(col - cx, row - cy) <= r
          : Math.abs(col - cx) <= r && Math.abs(row - cy) <= r;
        if (inShape) grid[row * GRID + col] = c;
      }
    }
  }
  return grid;
}

// ── Flood fill on the canvas grid ────────────────────────────────────────────
function floodFill(grid: PixelGrid, idx: number, newColour: ColourId): PixelGrid {
  const oldColour = grid[idx];
  if (oldColour === newColour) return grid;
  const next = [...grid];
  const stack = [idx];
  const visited = new Set<number>();
  while (stack.length) {
    const i = stack.pop()!;
    if (i < 0 || i >= TOTAL || visited.has(i)) continue;
    if (next[i] !== oldColour) continue;
    visited.add(i);
    next[i] = newColour;
    const row = Math.floor(i / GRID);
    const col = i % GRID;
    if (col > 0)        stack.push(i - 1);
    if (col < GRID - 1) stack.push(i + 1);
    if (row > 0)        stack.push(i - GRID);
    if (row < GRID - 1) stack.push(i + GRID);
  }
  return next as PixelGrid;
}

function calcScore(canvas: PixelGrid, target: PixelGrid): number {
  let matches = 0;
  for (let i = 0; i < TOTAL; i++) if (canvas[i] === target[i]) matches++;
  return Math.round((matches / TOTAL) * 100);
}

type Phase = "memorise" | "paint" | "result";

export function PixelPaintGame({
  gameId, rewardTokens, duration = 90, onComplete, isFlash = false,
}: GameProps) {
  const [difficulty,  setDifficulty]  = useState(1);
  const [target,      setTarget]      = useState<PixelGrid>(() => generateTarget(1));
  const [canvas,      setCanvas]      = useState<PixelGrid>(() => Array(TOTAL).fill(0));
  const [selected,    setSelected]    = useState<ColourId>(1);
  const [ink,         setInk]         = useState(12);
  const [phase,       setPhase]       = useState<Phase>("memorise");
  const [memoriseMs,  setMemoriseMs]  = useState(3500);
  const [score,       setScore]       = useState(0);
  const [round,       setRound]       = useState(1);
  const [timeLeft,    setTimeLeft]    = useState(duration);
  const [done,        setDone]        = useState(false);
  const [roundScore,  setRoundScore]  = useState<number|null>(null);
  const [showTarget,  setShowTarget]  = useState(false);

  const scoreRef    = useRef(0);
  const doneRef     = useRef(false);
  const roundRef    = useRef(1);
  const diffRef     = useRef(1);

  const getInk      = (d: number) => Math.max(6, 16 - d * 1.5 | 0);
  const getMemMs    = (d: number) => Math.max(1200, 3500 - d * 300);
  const getPalette  = (d: number) => COLOURS.slice(0, Math.min(COLOURS.length, 3 + (d / 2 | 0)));

  // Start memorise phase countdown
  useEffect(() => {
    const t = setTimeout(() => setPhase("paint"), memoriseMs);
    return () => clearTimeout(t);
  }, [memoriseMs, round]);

  // Main timer
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
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + (scoreRef.current / 100) * 0.014 * roundRef.current)));
    setTimeout(() => onComplete(final, scoreRef.current), 1600);
  }, [done]);

  const handleSubmit = () => {
    if (phase !== "paint" || doneRef.current) return;
    const pct = calcScore(canvas, target);
    setRoundScore(pct);
    const pts = Math.round(pct * (1 + diffRef.current * 0.2));
    scoreRef.current += pts;
    setScore(scoreRef.current);
    setPhase("result");
    setTimeout(() => {
      if (doneRef.current) return;
      roundRef.current++;
      diffRef.current = Math.min(10, diffRef.current + 1);
      const d = diffRef.current;
      const newTarget = generateTarget(d);
      setRound(roundRef.current);
      setDifficulty(d);
      setTarget(newTarget);
      setCanvas(Array(TOTAL).fill(0) as PixelGrid);
      setInk(getInk(d));
      setMemoriseMs(getMemMs(d));
      setRoundScore(null);
      setPhase("memorise");
    }, 1400);
  };

  const handleCellClick = (idx: number) => {
    if (phase !== "paint" || ink <= 0 || doneRef.current) return;
    const next = floodFill(canvas, idx, selected);
    if (next === canvas) return; // no change
    setCanvas(next as PixelGrid);
    setInk(i => i - 1);
  };

  const palette = getPalette(difficulty);
  const numColours = Math.min(COLOURS.length, 3 + (difficulty / 2 | 0));
  const inkPct     = ink / getInk(difficulty);
  const scoreColor = roundScore === null ? "#fff" : roundScore >= 80 ? "#10b981" : roundScore >= 55 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1a0f2e 100%)", minHeight: 320 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Palette className="w-3.5 h-3.5 text-pink-400" />{score}
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: "rgba(236,72,153,0.15)", color: "#f9a8d4", border: "1px solid rgba(236,72,153,0.3)" }}>
            Round {round} · {numColours} colours
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Ink counter */}
          {phase === "paint" && (
            <div className="flex items-center gap-1 text-[10px] font-bold"
              style={{ color: inkPct < 0.3 ? "#ef4444" : "#94a3b8" }}>
              🖌 {ink} ink
            </div>
          )}
          <div className="font-black text-base tabular-nums"
            style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Ink bar */}
      {phase === "paint" && (
        <div className="h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div className="h-full rounded-r-full"
            animate={{ width: `${inkPct * 100}%` }}
            style={{ background: inkPct < 0.3 ? "#ef4444" : "#ec4899" }}
            transition={{ duration: 0.15 }} />
        </div>
      )}

      <div className="flex gap-3 px-3 pt-3 pb-2">
        {/* Target (left — shown during memorise) */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[9px] font-black tracking-[0.18em] uppercase"
            style={{ color: phase === "memorise" ? "#f9a8d4" : "rgba(255,255,255,0.2)" }}>
            {phase === "memorise" ? "Memorise!" : "Target"}
          </p>
          <div className="rounded-xs overflow-hidden"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID}, 1fr)`,
              width: 140, height: 140,
              border: phase === "memorise" ? "2px solid rgba(236,72,153,0.6)" : "1px solid rgba(255,255,255,0.08)",
              boxShadow: phase === "memorise" ? "0 0 20px rgba(236,72,153,0.3)" : "none",
              filter: phase === "paint" ? "blur(4px) brightness(0.3)" : "none",
              transition: "filter 0.4s",
            }}>
            {target.map((cId, i) => (
              <div key={i} style={{ background: COLOURS[cId].hex }} />
            ))}
          </div>
          {phase === "memorise" && (
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div key={i} className="w-1 h-1 rounded-full"
                  style={{ background: "rgba(236,72,153,0.6)" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.25 }} />
              ))}
            </div>
          )}
        </div>

        {/* Canvas (right — always interactive) */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <p className="text-[9px] font-black tracking-[0.18em] uppercase"
            style={{ color: phase === "paint" ? "#fbbf24" : "rgba(255,255,255,0.2)" }}>
            {phase === "paint" ? "Paint it!" : phase === "memorise" ? "Your canvas" : "Result"}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID}, 1fr)`,
              width: 140, height: 140,
              border: phase === "paint" ? "2px solid rgba(251,191,36,0.5)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 3,
              overflow: "hidden",
            }}>
            {canvas.map((cId, i) => (
              <div key={i}
                onClick={() => handleCellClick(i)}
                style={{
                  background: COLOURS[cId].hex,
                  cursor: phase === "paint" && ink > 0 ? "crosshair" : "default",
                  outline: phase === "result" && canvas[i] === target[i]
                    ? "none"
                    : phase === "result"
                    ? "1px solid rgba(239,68,68,0.5)"
                    : "none",
                }}
              />
            ))}
          </div>

          {/* Accuracy badge */}
          <AnimatePresence>
            {roundScore !== null && (
              <motion.p key="acc"
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="font-black text-lg" style={{ color: scoreColor, letterSpacing: "-0.03em" }}>
                {roundScore}% match
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Colour palette + submit */}
      {phase === "paint" && (
        <div className="px-3 pb-3 flex items-center gap-2 flex-wrap">
          {palette.map(c => (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.88 }}
              onClick={() => setSelected(c.id as ColourId)}
              className="rounded-xs transition-all"
              style={{
                width: 28, height: 28,
                background: c.hex,
                border: selected === c.id
                  ? "2.5px solid white"
                  : "1.5px solid rgba(255,255,255,0.15)",
                boxShadow: selected === c.id ? `0 0 10px ${c.hex}` : "none",
                transform: selected === c.id ? "scale(1.18)" : "scale(1)",
              }} />
          ))}
          <button
            onClick={handleSubmit}
            className="ml-auto px-3 py-1.5 rounded-xs text-xs font-black transition-all flex items-center gap-1.5"
            style={{
              background: "rgba(251,191,36,0.2)",
              border: "1px solid rgba(251,191,36,0.4)",
              color: "#fbbf24",
            }}>
            <Check className="w-3.5 h-3.5" /> Submit
          </button>
        </div>
      )}

      {/* Memorise phase countdown hint */}
      {phase === "memorise" && (
        <div className="px-3 pb-3 text-center text-[10px] animate-pulse"
          style={{ color: "rgba(236,72,153,0.5)" }}>
          Study the pattern — it disappears soon!
        </div>
      )}

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {round - 1} rounds completed
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