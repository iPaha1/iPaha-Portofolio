// =============================================================================
// GAME 5: LASER GRID — Tap the safe cells before the laser fires
// components/(gamification)/(games)/laser-grid-game.tsx
//
// Concept: A 5×4 grid lights up with "safe" cells (green). A laser countdown
// sweeps each row. Click all safe cells before the laser hits that row.
// Difficulty ramps — later rows give less time. Flash of red = missed cell.
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Timer, Trophy, Shield } from "lucide-react";
import type { GameProps } from "./game-types";

const COLS = 5;
const ROWS = 4;
const TOTAL = COLS * ROWS;

type CellState = "idle" | "safe" | "clicked" | "missed" | "laser";

interface Row {
  cells: CellState[];
  safeCount: number;
  timeWindow: number; // ms to click all safe cells before laser
}

function buildRows(difficulty: number): Row[] {
  return Array.from({ length: ROWS }, (_, r) => {
    const safeCount = Math.max(1, 4 - r); // row 0=4 safe, row 3=1 safe
    const positions = new Set<number>();
    while (positions.size < safeCount) positions.add(Math.floor(Math.random() * COLS));
    const cells: CellState[] = Array(COLS).fill("idle");
    positions.forEach(i => { cells[i] = "safe"; });
    return {
      cells,
      safeCount,
      timeWindow: Math.max(800, 2200 - r * 350 - difficulty * 120),
    };
  });
}

export function LaserGridGame({
  gameId,
  rewardTokens,
  duration = 20,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const [rows, setRows]           = useState<Row[]>(() => buildRows(0));
  const [activeRow, setActiveRow] = useState(0);
  const [timeLeft, setTimeLeft]   = useState(duration);
  const [score, setScore]         = useState(0);
  const [lives, setLives]         = useState(3);
  const [phase, setPhase]         = useState<"playing" | "laser" | "gameover" | "win">("playing");
  const [rowProgress, setRowProgress] = useState(100); // % bar countdown per row

  const scoreRef   = useRef(0);
  const livesRef   = useRef(3);
  const clickedRef = useRef<Set<number>>(new Set());
  const rowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const playSound = useCallback((t: "safe" | "miss" | "laser" | "win" | "lose") => {
    if (!soundEnabled) return;
    try {
      new Audio(`/sounds/${t}.mp3`).play().catch(() => {});
    } catch {}
  }, [soundEnabled]);

  const endGame = useCallback((won: boolean) => {
    if (rowTimerRef.current) clearTimeout(rowTimerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setPhase(won ? "win" : "gameover");
    playSound(won ? "win" : "lose");
    const accuracy = Math.min(100, Math.round((scoreRef.current / (ROWS * 5)) * 100));
    const base = Math.floor(rewardTokens * (accuracy / 100 + 0.4));
    const bonus = won ? Math.floor(rewardTokens * 0.4) : 0;
    setTimeout(() => onComplete(Math.min(base + bonus, rewardTokens * 2), scoreRef.current), 1500);
  }, [rewardTokens, onComplete, playSound]);

  // Advance to next row or end game
  const advanceRow = useCallback((currentRow: number, win: boolean) => {
    if (!win) {
      livesRef.current -= 1;
      setLives(livesRef.current);
      playSound("laser");
      setPhase("laser");
      setTimeout(() => {
        if (livesRef.current <= 0) { endGame(false); return; }
        if (currentRow + 1 >= ROWS) { endGame(true); return; }
        setPhase("playing");
        setActiveRow(currentRow + 1);
        clickedRef.current.clear();
        startRowTimer(currentRow + 1);
      }, 600);
    } else {
      playSound("safe");
      if (currentRow + 1 >= ROWS) { endGame(true); return; }
      setTimeout(() => {
        setActiveRow(currentRow + 1);
        clickedRef.current.clear();
        startRowTimer(currentRow + 1);
      }, 300);
    }
  }, [endGame, playSound]);

  const startRowTimer = useCallback((rowIdx: number) => {
    setRows(prev => {
      const tw = prev[rowIdx]?.timeWindow ?? 2000;
      const step = 50;
      let elapsed = 0;
      if (progressRef.current) clearInterval(progressRef.current);
      progressRef.current = setInterval(() => {
        elapsed += step;
        setRowProgress(Math.max(0, 100 - (elapsed / tw) * 100));
        if (elapsed >= tw) {
          if (progressRef.current) clearInterval(progressRef.current);
        }
      }, step);

      if (rowTimerRef.current) clearTimeout(rowTimerRef.current);
      rowTimerRef.current = setTimeout(() => {
        // Check if all safe cells were clicked
        setRows(r => {
          const row = r[rowIdx];
          const allClicked = row.cells.every((c, i) =>
            c !== "safe" || clickedRef.current.has(i)
          );
          // Mark missed
          const updated = r.map((ro, ri) => {
            if (ri !== rowIdx) return ro;
            return {
              ...ro,
              cells: ro.cells.map((c, ci) =>
                c === "safe" && !clickedRef.current.has(ci) ? "missed" : c
              ),
            };
          });
          advanceRow(rowIdx, allClicked);
          return updated;
        });
      }, tw);
      return prev;
    });
  }, [advanceRow]);

  useEffect(() => {
    startRowTimer(0);
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); endGame(false); return 0; }
      return p - 1;
    }), 1000);
    return () => {
      clearInterval(t);
      if (rowTimerRef.current) clearTimeout(rowTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    if (rowIdx !== activeRow || phase !== "playing") return;
    const cell = rows[rowIdx].cells[colIdx];
    if (cell !== "safe") {
      // Clicked a non-safe cell = lose a life immediately
      livesRef.current -= 1;
      setLives(livesRef.current);
      playSound("miss");
      setRows(r => r.map((ro, ri) => ri !== rowIdx ? ro : {
        ...ro, cells: ro.cells.map((c, ci) => ci === colIdx ? "missed" : c)
      }));
      if (livesRef.current <= 0) endGame(false);
      return;
    }
    clickedRef.current.add(colIdx);
    scoreRef.current += 5;
    setScore(scoreRef.current);
    playSound("safe");
    setRows(r => r.map((ro, ri) => ri !== rowIdx ? ro : {
      ...ro, cells: ro.cells.map((c, ci) => ci === colIdx ? "clicked" : c)
    }));
    // Check if all safe cells for this row are done
    const allDone = rows[rowIdx].cells.every((c, ci) =>
      c !== "safe" || clickedRef.current.has(ci)
    );
    if (allDone) {
      if (rowTimerRef.current) clearTimeout(rowTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      advanceRow(rowIdx, true);
    }
  };

  const CELL_COLORS: Record<CellState, string> = {
    idle:    "rgba(255,255,255,0.04)",
    safe:    "rgba(16,185,129,0.25)",
    clicked: "rgba(16,185,129,0.6)",
    missed:  "rgba(239,68,68,0.6)",
    laser:   "rgba(239,68,68,0.8)",
  };
  const CELL_BORDERS: Record<CellState, string> = {
    idle:    "1px solid rgba(255,255,255,0.07)",
    safe:    "1px solid rgba(16,185,129,0.6)",
    clicked: "1px solid rgba(16,185,129,0.9)",
    missed:  "1px solid rgba(239,68,68,0.9)",
    laser:   "1px solid rgba(239,68,68,1)",
  };

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f0f1a 0%,#1a0a2e 50%,#0a1a2e 100%)" }}
    >
      {/* Stats bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{ background: i < lives ? "#ef4444" : "rgba(255,255,255,0.1)", boxShadow: i < lives ? "0 0 6px #ef4444" : "none" }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Row progress bar */}
      <div className="absolute top-11 left-0 right-0 h-0.5 z-10" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full"
          style={{
            width: `${rowProgress}%`,
            background: rowProgress > 50 ? "#10b981" : rowProgress > 25 ? "#f59e0b" : "#ef4444",
            transition: "background 0.3s",
          }}
        />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 pt-10 pb-4 gap-2">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-2 items-center">
            {/* Row indicator */}
            <div className="w-3 flex-shrink-0">
              {ri === activeRow && phase === "playing" && (
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                  className="w-1.5 h-1.5 rounded-full mx-auto"
                  style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }}
                />
              )}
            </div>
            {/* Cells */}
            <div className="flex gap-2 flex-1">
              {row.cells.map((cell, ci) => (
                <motion.button
                  key={ci}
                  onClick={() => handleCellClick(ri, ci)}
                  animate={cell === "missed" || (ri === activeRow && phase === "laser")
                    ? { x: [0, -3, 3, -2, 2, 0] }
                    : {}
                  }
                  transition={{ duration: 0.25 }}
                  className="flex-1 rounded-xs cursor-pointer transition-all duration-150"
                  style={{
                    height: "52px",
                    background: ri === activeRow && phase === "laser"
                      ? "rgba(239,68,68,0.4)"
                      : CELL_COLORS[cell],
                    border: CELL_BORDERS[cell],
                    boxShadow: cell === "safe" && ri === activeRow
                      ? "0 0 12px rgba(16,185,129,0.4)"
                      : cell === "clicked"
                      ? "0 0 16px rgba(16,185,129,0.6)"
                      : "none",
                    opacity: ri < activeRow ? 0.35 : ri > activeRow ? 0.55 : 1,
                  }}
                >
                  {cell === "clicked" && (
                    <Shield className="w-4 h-4 text-emerald-400 mx-auto" />
                  )}
                  {cell === "missed" && (
                    <Zap className="w-4 h-4 text-red-400 mx-auto" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Row label */}
      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
        <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>
          Row {activeRow + 1} of {ROWS} · Click all green cells
        </span>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {(phase === "gameover" || phase === "win") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className={`w-14 h-14 mx-auto mb-3 ${phase === "win" ? "text-amber-400" : "text-red-400"}`} />
              <p className="text-3xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
              <p className="text-white/40 text-sm">{phase === "win" ? "Perfect run!" : "Zapped!"}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isFlash && (
        <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse"
          style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fbbf24" }}
        >
          ⚡ FLASH
        </div>
      )}
    </div>
  );
}