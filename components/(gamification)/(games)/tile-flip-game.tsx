// =============================================================================
// GAME 15: TILE FLIP — Flip tiles to match the target pattern
// components/(gamification)/(games)/tile-flip-game.tsx
//
// Mechanic: A 5×5 grid of tiles is shown. Each tile is ON or OFF. Clicking a
// tile flips it AND all orthogonal (cross) neighbours — a classic "Lights Out"
// puzzle. Goal: get ALL tiles to the same state (all ON = gold, or all OFF = dark).
// The board is generated with a solvable solution. Fewest moves = bigger reward.
// New boards get harder (more pre-flipped tiles) each round.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3x3, Trophy, Zap, Lightbulb } from "lucide-react";
import type { GameProps } from "./game-types";

const SIZE = 5;
type Grid = boolean[][];

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
}

// Flip a tile and its orthogonal neighbours
function applyFlip(grid: Grid, row: number, col: number): Grid {
  const next = grid.map(r => [...r]);
  const deltas = [[0,0],[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of deltas) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
      next[r][c] = !next[r][c];
    }
  }
  return next;
}

// Generate a solvable board by starting from solved state and applying N random flips
function generateBoard(difficulty: number): { board: Grid; minMoves: number } {
  const clicks = Math.min(15, 3 + difficulty * 2);
  let board    = emptyGrid();
  const moves: Array<[number, number]> = [];

  for (let i = 0; i < clicks; i++) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    board = applyFlip(board, r, c);
    moves.push([r, c]);
  }

  // If already solved (all same), flip one more
  const allOn  = board.flat().every(Boolean);
  const allOff = board.flat().every(b => !b);
  if (allOn || allOff) {
    board = applyFlip(board, 2, 2);
  }

  return { board, minMoves: clicks };
}

function isSolved(grid: Grid): boolean {
  const flat = grid.flat();
  return flat.every(Boolean) || flat.every(b => !b);
}

export function TileFlipGame({
  gameId, rewardTokens, duration = 60, onComplete, isFlash = false,
}: GameProps) {
  const [difficulty, setDifficulty] = useState(1);
  const [board,      setBoard]      = useState<Grid>(() => generateBoard(1).board);
  const [minMoves,   setMinMoves]   = useState(5);
  const [moves,      setMoves]      = useState(0);
  const [round,      setRound]      = useState(1);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(duration);
  const [done,       setDone]       = useState(false);
  const [solving,    setSolving]    = useState(false);   // brief win flash
  const [hint,       setHint]       = useState<[number,number]|null>(null); // highlight a tile
  const [hintsUsed,  setHintsUsed]  = useState(0);

  const scoreRef  = useRef(0);
  const movesRef  = useRef(0);
  const roundRef  = useRef(1);
  const doneRef   = useRef(false);
  const boardRef  = useRef(board);

  // Keep boardRef synced
  useEffect(() => { boardRef.current = board; }, [board]);

  // Game timer
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
    const rounds     = roundRef.current - 1;
    const efficiency = rounds > 0 ? rounds / Math.max(1, rounds + hintsUsed * 0.5) : 0;
    const final      = Math.max(1, Math.round(rewardTokens * (0.3 + efficiency * 1.7 + rounds * 0.1)));
    setTimeout(() => onComplete(final, scoreRef.current), 1600);
  }, [done]);

  const startNewBoard = useCallback((diff: number) => {
    const { board: newBoard, minMoves: mm } = generateBoard(diff);
    setBoard(newBoard);
    setMinMoves(mm);
    setMoves(0);
    movesRef.current = 0;
    setHint(null);
  }, []);

  const handleTile = useCallback((row: number, col: number) => {
    if (doneRef.current || solving) return;
    const next = applyFlip(boardRef.current, row, col);
    movesRef.current += 1;
    setMoves(movesRef.current);
    setBoard(next);
    setHint(null);

    if (isSolved(next)) {
      const efficiency   = Math.max(0, 1 - (movesRef.current - minMoves) / (minMoves * 2));
      const roundBonus   = roundRef.current * 15;
      const speedBonus   = Math.floor(efficiency * 40);
      const hintPenalty  = hintsUsed * 5;
      const pts          = Math.max(10, 50 + roundBonus + speedBonus - hintPenalty);
      scoreRef.current  += pts;
      setScore(scoreRef.current);
      setSolving(true);

      setTimeout(() => {
        setSolving(false);
        if (!doneRef.current) {
          roundRef.current += 1;
          setRound(roundRef.current);
          const nextDiff = Math.min(8, difficulty + 1);
          setDifficulty(nextDiff);
          startNewBoard(nextDiff);
        }
      }, 900);
    }
  }, [solving, minMoves, hintsUsed, difficulty, startNewBoard]);

  // Hint: find a tile that makes progress (brute-force 1-move lookahead)
  const showHint = () => {
    if (hintsUsed >= 3 || doneRef.current) return;
    // Try each tile, pick the one that gets closest to solved
    let bestR = 0, bestC = 0, bestCount = -1;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const test = applyFlip(board, r, c);
        const onCount = test.flat().filter(Boolean).length;
        const offCount = SIZE * SIZE - onCount;
        const extremity = Math.max(onCount, offCount);
        if (extremity > bestCount) { bestCount = extremity; bestR = r; bestC = c; }
      }
    }
    setHint([bestR, bestC]);
    setHintsUsed(h => h + 1);
    setTimeout(() => setHint(null), 1800);
  };

  const allOn  = board.flat().every(Boolean);
  const allOff = board.flat().every(b => !b);
  const onCount = board.flat().filter(Boolean).length;

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#0a1628 100%)", minHeight: 300 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Grid3x3 className="w-3.5 h-3.5 text-amber-400" />{score}
          </div>
          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs"
            style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>
            Rd {round} · {moves} moves
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {onCount}/{SIZE*SIZE} lit
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={showHint}
            disabled={hintsUsed >= 3}
            className="text-[9px] font-bold px-2 py-0.5 rounded-xs transition-all"
            style={{
              background: hintsUsed >= 3 ? "rgba(255,255,255,0.05)" : "rgba(250,204,21,0.15)",
              color: hintsUsed >= 3 ? "rgba(255,255,255,0.2)" : "#fbbf24",
              border: hintsUsed >= 3 ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(250,204,21,0.3)",
            }}>
            Hint {3 - hintsUsed}
          </button>
          <div className="font-black text-base tabular-nums"
            style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Progress bar — ON tile count */}
      <div className="h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full" style={{ background: "#f59e0b" }}
          animate={{ width: `${(onCount / (SIZE * SIZE)) * 100}%` }}
          transition={{ duration: 0.15 }} />
      </div>

      {/* Board */}
      <div className="flex flex-col items-center py-4 gap-1.5">
        {board.map((row, r) => (
          <div key={r} className="flex gap-1.5">
            {row.map((on, c) => {
              const isHint = hint && hint[0] === r && hint[1] === c;
              return (
                <motion.button
                  key={c}
                  onClick={() => handleTile(r, c)}
                  whileTap={{ scale: 0.88 }}
                  animate={
                    solving && on
                      ? { scale: [1, 1.1, 1], backgroundColor: "#f59e0b" }
                      : isHint
                      ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px #fbbf24", "0 0 20px #fbbf24", "0 0 8px #fbbf24"] }
                      : { scale: 1 }
                  }
                  transition={isHint ? { repeat: 2, duration: 0.4 } : { duration: 0.25 }}
                  className="rounded-xs flex items-center justify-center transition-colors"
                  style={{
                    width: 46, height: 46,
                    background: on
                      ? solving
                        ? "radial-gradient(circle at 35% 30%, #fde68a, #f59e0b)"
                        : "radial-gradient(circle at 35% 30%, #fde68a, #f59e0b)"
                      : isHint
                      ? "rgba(250,204,21,0.12)"
                      : "rgba(255,255,255,0.05)",
                    border: on
                      ? "1.5px solid rgba(245,158,11,0.8)"
                      : isHint
                      ? "1.5px solid rgba(250,204,21,0.6)"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: on
                      ? "0 0 14px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.3)"
                      : "inset 0 1px 0 rgba(255,255,255,0.04)",
                    cursor: "pointer",
                  }}>
                  {on && <div className="w-2.5 h-2.5 rounded-full bg-white opacity-50" />}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Goal hint */}
      <div className="text-center pb-3 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
        Make all tiles the same colour — clicking flips a tile + its neighbours
      </div>

      {/* Win flash */}
      <AnimatePresence>
        {solving && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.12)" }}>
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-black text-amber-400" style={{ letterSpacing: "-0.04em", textShadow: "0 0 30px #f59e0b" }}>
              Solved! ✨
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {round - 1} solved · {hintsUsed} hint{hintsUsed !== 1 ? "s" : ""} used
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