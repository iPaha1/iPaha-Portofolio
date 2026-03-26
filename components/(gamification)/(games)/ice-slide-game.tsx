// =============================================================================
// GAME 27: ICE SLIDE — Slide the puck to the exit; pieces glide until they hit walls
// components/(gamification)/(games)/ice-slide-game.tsx
//
// Mechanic: A 7×7 grid of ice. Your puck (blue) slides in any direction until
// hitting a wall or rock. Goal: reach the gold star exit. Rocks can be used as
// redirectors — plan multi-step slides. Fewer moves = bigger score bonus.
// Each round is a procedurally-generated solvable puzzle. Direction buttons +
// arrow keys. A ghost preview shows where the puck will land before you commit.
// Pure spatial trajectory reasoning — nothing like any other game in the set.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, Trophy, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import type { GameProps } from "./game-types";

const SIZE = 7;
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Cell = "empty" | "rock" | "exit";
type Grid = Cell[][];

interface PuzzleState {
  grid:   Grid;
  puck:   [number, number];  // [row, col]
  exit:   [number, number];
}

// ── Slide simulation ────────────────────────────────────────────────────────
function slide(grid: Grid, pos: [number, number], dir: Dir): [number, number] {
  let [r, c] = pos;
  const [dr, dc] = dir === "UP" ? [-1,0] : dir === "DOWN" ? [1,0] : dir === "LEFT" ? [0,-1] : [0,1];
  while (true) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
    if (grid[nr][nc] === "rock") break;
    r = nr; c = nc;
  }
  return [r, c];
}

function posEq(a: [number, number], b: [number, number]) { return a[0] === b[0] && a[1] === b[1]; }

// ── Puzzle generator — BFS-ensure solvable ──────────────────────────────────
function generatePuzzle(difficulty: number): PuzzleState {
  const maxRocks = 4 + difficulty * 2;

  for (let attempt = 0; attempt < 200; attempt++) {
    const grid: Grid = Array.from({ length: SIZE }, () => Array(SIZE).fill("empty") as Cell[]);

    const puck: [number, number] = [Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE)];
    let exit: [number, number];
    do { exit = [Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE)]; }
    while (posEq(puck, exit));

    grid[exit[0]][exit[1]] = "exit";

    // Place rocks
    const rockCount = 3 + Math.floor(Math.random() * (maxRocks - 2));
    for (let i = 0; i < rockCount; i++) {
      let r: number, c: number, tries = 0;
      do { r = Math.floor(Math.random() * SIZE); c = Math.floor(Math.random() * SIZE); tries++; }
      while ((posEq([r,c], puck) || posEq([r,c], exit) || grid[r][c] !== "empty") && tries < 30);
      if (tries < 30) grid[r][c] = "rock";
    }

    // BFS to check solvability (allow up to 8 moves)
    type State = { pos: [number,number]; moves: number };
    const queue: State[] = [{ pos: puck, moves: 0 }];
    const seen = new Set<string>();
    seen.add(`${puck[0]},${puck[1]}`);
    let solvable = false;

    while (queue.length > 0) {
      const { pos, moves } = queue.shift()!;
      if (posEq(pos, exit)) { solvable = true; break; }
      if (moves >= 8) continue;
      for (const d of ["UP","DOWN","LEFT","RIGHT"] as Dir[]) {
        const next = slide(grid, pos, d);
        const key  = `${next[0]},${next[1]}`;
        if (!posEq(next, pos) && !seen.has(key)) { seen.add(key); queue.push({ pos: next, moves: moves + 1 }); }
      }
    }

    if (solvable) return { grid, puck, exit };
  }

  // Fallback trivial puzzle
  const grid: Grid = Array.from({ length: SIZE }, () => Array(SIZE).fill("empty") as Cell[]);
  const exit: [number,number] = [0, SIZE - 1];
  grid[exit[0]][exit[1]] = "exit";
  return { grid, puck: [SIZE - 1, 0], exit };
}

export function IceSlideGame({
  gameId, rewardTokens, duration = 60, onComplete, isFlash = false,
}: GameProps) {
  const [puzzle,   setPuzzle]   = useState<PuzzleState>(() => generatePuzzle(1));
  const [puck,     setPuck]     = useState<[number,number]>(() => generatePuzzle(1).puck);
  const [moves,    setMoves]    = useState(0);
  const [round,    setRound]    = useState(1);
  const [score,    setScore]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [done,     setDone]     = useState(false);
  const [won,      setWon]      = useState(false);
  const [preview,  setPreview]  = useState<{ dir: Dir; land: [number,number] } | null>(null);
  const [sliding,  setSliding]  = useState(false);
  const [trail,    setTrail]    = useState<[number,number][]>([]);

  const scoreRef  = useRef(0);
  const roundRef  = useRef(1);
  const movesRef  = useRef(0);
  const doneRef   = useRef(false);
  const puckRef   = useRef(puck);
  const puzzleRef = useRef(puzzle);

  const startPuzzle = useCallback((r: number) => {
    const p = generatePuzzle(r);
    puzzleRef.current = p;
    puckRef.current   = p.puck;
    setPuzzle(p);
    setPuck(p.puck);
    setMoves(0);
    movesRef.current = 0;
    setWon(false);
    setPreview(null);
    setTrail([]);
    setSliding(false);
  }, []);

  useEffect(() => { startPuzzle(1); }, [startPuzzle]);

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
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + Math.min(1, scoreRef.current / (roundRef.current * 60)) * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  const doSlide = useCallback((dir: Dir) => {
    if (sliding || won || doneRef.current) return;
    const land = slide(puzzleRef.current.grid, puckRef.current, dir);
    if (posEq(land, puckRef.current)) return; // didn't move

    // Compute trail cells
    const [dr, dc] = dir === "UP" ? [-1,0] : dir === "DOWN" ? [1,0] : dir === "LEFT" ? [0,-1] : [0,1];
    const trailCells: [number,number][] = [];
    let r = puckRef.current[0], c = puckRef.current[1];
    while (r !== land[0] || c !== land[1]) { r += dr; c += dc; trailCells.push([r, c]); }

    setSliding(true);
    setTrail(trailCells);
    movesRef.current++;
    setMoves(movesRef.current);
    puckRef.current = land;
    setPuck(land);
    setPreview(null);

    setTimeout(() => {
      setSliding(false);
      setTrail([]);

      if (posEq(land, puzzleRef.current.exit)) {
        setWon(true);
        const efficiency = Math.max(0, 1 - (movesRef.current - 1) / 8);
        const pts        = 50 + Math.round(efficiency * 80) + roundRef.current * 10;
        scoreRef.current += pts;
        setScore(scoreRef.current);
        setTimeout(() => {
          if (doneRef.current) return;
          roundRef.current++;
          setRound(roundRef.current);
          startPuzzle(roundRef.current);
        }, 800);
      }
    }, 300);
  }, [sliding, won, startPuzzle]);

  const showPreview = useCallback((dir: Dir) => {
    if (sliding || won || doneRef.current) return;
    const land = slide(puzzleRef.current.grid, puckRef.current, dir);
    setPreview(posEq(land, puckRef.current) ? null : { dir, land });
  }, [sliding, won]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp:"UP", ArrowDown:"DOWN", ArrowLeft:"LEFT", ArrowRight:"RIGHT", w:"UP", s:"DOWN", a:"LEFT", d:"RIGHT" };
      if (map[e.key]) { e.preventDefault(); doSlide(map[e.key]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSlide]);

  const CELL = 38;
  const GAP  = 3;

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(180deg,#020c1a 0%,#051828 100%)", minHeight: 310 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />{score}
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: "rgba(6,182,212,0.12)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.25)" }}>
            Round {round} · {moves} slides
          </div>
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-col items-center pt-3 pb-2">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${SIZE}, ${CELL}px)`, gap: GAP }}>
          {Array.from({ length: SIZE * SIZE }).map((_, idx) => {
            const r = Math.floor(idx / SIZE), c = idx % SIZE;
            const cell       = puzzle.grid[r][c];
            const isPuck     = posEq([r, c], puck);
            const isExit     = cell === "exit";
            const isRock     = cell === "rock";
            const isTrail    = trail.some(t => t[0] === r && t[1] === c);
            const isPreview  = preview && posEq(preview.land, [r, c]);

            return (
              <motion.div
                key={idx}
                animate={isPuck && sliding ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-center rounded-xs relative"
                style={{
                  width: CELL, height: CELL,
                  background: isRock
                    ? "linear-gradient(135deg,#374151,#1f2937)"
                    : isExit
                    ? "rgba(245,158,11,0.12)"
                    : isTrail
                    ? "rgba(6,182,212,0.12)"
                    : "rgba(255,255,255,0.03)",
                  border: isRock
                    ? "1.5px solid #4b5563"
                    : isExit
                    ? "1.5px solid rgba(245,158,11,0.5)"
                    : isPreview
                    ? "1.5px dashed rgba(6,182,212,0.5)"
                    : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isExit ? "0 0 12px rgba(245,158,11,0.3)" : isTrail ? "0 0 4px rgba(6,182,212,0.2)" : "none",
                }}>

                {isRock && (
                  <div className="w-5 h-5 rounded-xs"
                    style={{ background: "radial-gradient(circle at 35% 30%,#6b7280,#374151)" }} />
                )}
                {isExit && !isPuck && (
                  <div className="text-base" style={{ filter: "drop-shadow(0 0 6px #f59e0b)", fontSize: 18 }}>⭐</div>
                )}
                {isPreview && !isPuck && (
                  <div className="w-5 h-5 rounded-full opacity-40"
                    style={{ background: "#06b6d4", boxShadow: "0 0 8px #06b6d4" }} />
                )}
                {isPuck && (
                  <motion.div
                    animate={{ boxShadow: ["0 0 10px #3b82f680","0 0 20px #3b82f6","0 0 10px #3b82f680"] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: "radial-gradient(circle at 35% 30%, #93c5fd, #2563eb)",
                      border: "1.5px solid rgba(255,255,255,0.5)",
                      zIndex: 5,
                    }} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Direction controls */}
        <div className="grid grid-cols-3 gap-1.5 mt-3" style={{ width: 108 }}>
          <div />
          <button className="w-8 h-8 rounded-xs flex items-center justify-center transition-all"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#67e8f9" }}
            onMouseEnter={() => showPreview("UP")} onMouseLeave={() => setPreview(null)}
            onClick={() => doSlide("UP")}>
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />
          <button className="w-8 h-8 rounded-xs flex items-center justify-center transition-all"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#67e8f9" }}
            onMouseEnter={() => showPreview("LEFT")} onMouseLeave={() => setPreview(null)}
            onClick={() => doSlide("LEFT")}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-xs flex items-center justify-center transition-all"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#67e8f9" }}
            onMouseEnter={() => showPreview("DOWN")} onMouseLeave={() => setPreview(null)}
            onClick={() => doSlide("DOWN")}>
            <ArrowDown className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-xs flex items-center justify-center transition-all"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#67e8f9" }}
            onMouseEnter={() => showPreview("RIGHT")} onMouseLeave={() => setPreview(null)}
            onClick={() => doSlide("RIGHT")}>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-center pb-2 text-[9px]" style={{ color: "rgba(255,255,255,0.18)" }}>
        Slide 🔵 to reach ⭐ — arrow keys or buttons · hover to preview
      </p>

      {/* Won flash */}
      <AnimatePresence>
        {won && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
            style={{ background: "rgba(6,182,212,0.08)" }}>
            <p className="text-2xl font-black" style={{ color: "#06b6d4", textShadow: "0 0 20px #06b6d4", letterSpacing: "-0.03em" }}>
              Solved in {moves}! ⭐
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{round - 1} puzzles solved</p>
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