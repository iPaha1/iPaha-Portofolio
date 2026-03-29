// =============================================================================
// GAME 20: HEIST LASER — Rotate mirrors to guide the laser beam to the vault
// components/(gamification)/(games)/heist-laser-game.tsx
//
// Concept: A grid with a laser emitter, a vault target, and several mirrors.
// Click mirrors to rotate them 45°. The laser bounces off mirrors and walls.
// Guide it to hit the vault. Fewer rotations = bigger reward.
// The beam is drawn with a glowing neon green ray-cast effect in real time.
// 5 increasingly complex puzzle layouts.
// =============================================================================

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Zap, RotateCw } from "lucide-react";
import type { GameProps } from "./game-types";

const GRID = 7; // 7×7
type Dir = "R" | "L" | "U" | "D";

interface Cell {
  type: "empty" | "mirror" | "emitter" | "vault" | "wall";
  mirror?: "/" | "\\"; // mirror orientation
  emitterDir?: Dir;    // emitter direction
}

type Board = Cell[][];

// Puzzle layouts — [row, col, type, extra]
interface Puzzle {
  emitter: [number, number, Dir];
  vault:   [number, number];
  mirrors: [number, number, "/" | "\\"][];
  walls:   [number, number][];
}

const PUZZLES: Puzzle[] = [
  {
    emitter: [3, 0, "R"],
    vault:   [0, 6],
    mirrors: [[3, 3, "/"], [0, 3, "\\"]],
    walls:   [],
  },
  {
    emitter: [0, 3, "D"],
    vault:   [6, 3],
    mirrors: [[2, 3, "\\"], [4, 5, "/"], [4, 3, "\\"]],
    walls:   [[3, 3]],
  },
  {
    emitter: [6, 0, "R"],
    vault:   [0, 6],
    mirrors: [[6, 3, "/"], [3, 3, "/"], [0, 3, "\\"]],
    walls:   [[4, 3], [2, 3]],
  },
  {
    emitter: [3, 6, "L"],
    vault:   [0, 0],
    mirrors: [[3, 3, "\\"], [0, 3, "/"], [0, 0, "\\"]],
    walls:   [[3, 4], [1, 3]],
  },
  {
    emitter: [0, 0, "D"],
    vault:   [6, 6],
    mirrors: [[2, 0, "\\"], [2, 4, "/"], [6, 4, "\\"]],
    walls:   [[2, 2], [4, 2]],
  },
];

function buildBoard(puzzle: Puzzle): Board {
  const board: Board = Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => ({ type: "empty" as const }))
  );
  const [er, ec, edir] = puzzle.emitter;
  board[er][ec] = { type: "emitter", emitterDir: edir };
  const [vr, vc] = puzzle.vault;
  board[vr][vc] = { type: "vault" };
  puzzle.mirrors.forEach(([r, c, m]) => { board[r][c] = { type: "mirror", mirror: m }; });
  puzzle.walls.forEach(([r, c])      => { board[r][c] = { type: "wall" }; });
  return board;
}

function traceLaser(board: Board): { path: [number, number][]; hit: boolean } {
  // Find emitter
  let r = 0, c = 0, dir: Dir = "R";
  outer: for (let rr = 0; rr < GRID; rr++) for (let cc = 0; cc < GRID; cc++) {
    if (board[rr][cc].type === "emitter") { r = rr; c = cc; dir = board[rr][cc].emitterDir!; break outer; }
  }

  const path: [number, number][] = [[r, c]];
  const visited = new Set<string>();

  for (let step = 0; step < 200; step++) {
    const key = `${r},${c},${dir}`;
    if (visited.has(key)) break;
    visited.add(key);

    const [dr, dc]: [number, number] = dir === "R" ? [0,1] : dir === "L" ? [0,-1] : dir === "U" ? [-1,0] : [1,0];
    r += dr; c += dc;

    if (r < 0 || r >= GRID || c < 0 || c >= GRID) break; // out of bounds
    path.push([r, c]);

    const cell = board[r][c];
    if (cell.type === "vault")  return { path, hit: true };
    if (cell.type === "wall")   break;
    if (cell.type === "emitter") break;

    if (cell.type === "mirror") {
      // Reflect direction
      const m = cell.mirror!;
      if (m === "/") {
        dir = dir === "R" ? "U" : dir === "L" ? "D" : dir === "U" ? "R" : "L";
      } else { // "\"
        dir = dir === "R" ? "D" : dir === "L" ? "U" : dir === "U" ? "L" : "R";
      }
    }
  }
  return { path, hit: false };
}

export function HeistLaserGame({
  gameId, rewardTokens, duration = 50,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [board, setBoard]         = useState<Board>(() => buildBoard(PUZZLES[0]));
  const [rotations, setRotations] = useState(0);
  const [score, setScore]         = useState(0);
  const [timeLeft, setTimeLeft]   = useState(duration);
  const [phase, setPhase]         = useState<"playing" | "done">("playing");
  const [laserPath, setLaserPath] = useState<[number, number][]>([]);
  const [laserHit, setLaserHit]   = useState(false);
  const [flash, setFlash]         = useState(false);

  const scoreRef   = useRef(0);
  const rotRef     = useRef(0);
  const puzzleRef  = useRef(0);
  const boardRef   = useRef(board);
  useEffect(() => { boardRef.current = board; }, [board]);

  const playSound = useCallback((t: "rotate" | "win" | "lose") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const map: Record<string, [number, OscillatorType, number]> = {
        rotate: [440, "sine",     0.08],
        win:    [880, "sine",     0.5 ],
        lose:   [220, "sawtooth", 0.3 ],
      };
      const [freq, type, dur] = map[t];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  }, [soundEnabled]);

  // Re-trace laser whenever board changes
  useEffect(() => {
    const { path, hit } = traceLaser(board);
    setLaserPath(path);
    setLaserHit(hit);
    if (hit) {
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      playSound("win");
      const pts = Math.max(10, 60 - rotRef.current * 8);
      scoreRef.current += pts;
      setScore(scoreRef.current);
      const next = puzzleRef.current + 1;
      puzzleRef.current = next;
      if (next >= PUZZLES.length) {
        setPhase("done");
        const reward = Math.min(Math.floor(rewardTokens * (scoreRef.current / 200 + 0.5)), rewardTokens * 2);
        setTimeout(() => onComplete(reward, scoreRef.current), 1600);
      } else {
        setTimeout(() => {
          setPuzzleIdx(next);
          rotRef.current = 0;
          setRotations(0);
          setBoard(buildBoard(PUZZLES[next]));
        }, 700);
      }
    }
  }, [board, playSound, rewardTokens, onComplete]);

  const rotateMirror = useCallback((r: number, c: number) => {
    if (phase !== "playing" || board[r][c].type !== "mirror") return;
    playSound("rotate");
    rotRef.current++;
    setRotations(rotRef.current);
    setBoard(prev => prev.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri === r && ci === c && cell.type === "mirror") {
          return { ...cell, mirror: cell.mirror === "/" ? "\\" : "/" };
        }
        return cell;
      })
    ));
  }, [phase, board, playSound]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) {
        clearInterval(t);
        setPhase("done");
        const reward = Math.floor(rewardTokens * Math.max(0.15, scoreRef.current / 200));
        onComplete(Math.min(reward, rewardTokens * 2), scoreRef.current);
        return 0;
      }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [rewardTokens, onComplete]);

  const CELL_SIZE = 44;

  const CELL_COLORS: Record<string, { bg: string; border: string; text?: string }> = {
    empty:   { bg: "rgba(255,255,255,0.02)",  border: "rgba(255,255,255,0.06)" },
    mirror:  { bg: "rgba(6,182,212,0.08)",     border: "rgba(6,182,212,0.3)",   text: "#06b6d4" },
    emitter: { bg: "rgba(245,158,11,0.15)",    border: "rgba(245,158,11,0.5)",  text: "#f59e0b" },
    vault:   { bg: "rgba(16,185,129,0.15)",    border: "rgba(16,185,129,0.5)",  text: "#10b981" },
    wall:    { bg: "rgba(255,255,255,0.08)",   border: "rgba(255,255,255,0.15)" },
  };

  const isOnLaser = (r: number, c: number) => laserPath.some(([lr, lc]) => lr === r && lc === c);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#040c08 0%,#06100c 100%)" }}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RotateCw className="w-3 h-3 text-white/30" />
            <span className="text-[10px] font-black text-white/30">{rotations} rotations</span>
          </div>
          <span className="text-[10px] font-black tracking-[0.15em] text-white/25">
            Puzzle {puzzleIdx + 1}/{PUZZLES.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 flex items-center justify-center pt-12 pb-4"
        style={{ background: flash ? "rgba(16,185,129,0.06)" : "transparent", transition: "background 0.2s" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID}, ${CELL_SIZE}px)`, gap: "3px" }}>
          {board.map((row, ri) =>
            row.map((cell, ci) => {
              const onLaser = isOnLaser(ri, ci);
              const cfg = CELL_COLORS[cell.type];
              return (
                <motion.div
                  key={`${ri}-${ci}`}
                  onClick={() => rotateMirror(ri, ci)}
                  whileHover={cell.type === "mirror" ? { scale: 1.08 } : {}}
                  whileTap={cell.type === "mirror" ? { scale: 0.92 } : {}}
                  className="rounded-xs flex items-center justify-center relative"
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    background: onLaser
                      ? (laserHit && (ri + ci) % 2 === 0 ? "rgba(16,185,129,0.25)" : "rgba(74,222,128,0.12)")
                      : cfg.bg,
                    border: `1px solid ${onLaser ? "rgba(74,222,128,0.5)" : cfg.border}`,
                    cursor: cell.type === "mirror" ? "pointer" : "default",
                    boxShadow: onLaser ? "0 0 8px rgba(74,222,128,0.3)" : "none",
                    transition: "all 0.1s",
                  }}
                >
                  {cell.type === "mirror" && (
                    <span className="text-xl font-black select-none" style={{ color: cfg.text }}>
                      {cell.mirror}
                    </span>
                  )}
                  {cell.type === "emitter" && (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full animate-pulse"
                        style={{ background: "#f59e0b", boxShadow: "0 0 10px #f59e0b" }}
                      />
                    </div>
                  )}
                  {cell.type === "vault" && (
                    <div className="flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-xs ${laserHit ? "animate-bounce" : ""}`}
                        style={{ background: "#10b981", boxShadow: laserHit ? "0 0 14px #10b981" : "0 0 4px #10b98160" }}
                      />
                    </div>
                  )}
                  {cell.type === "wall" && (
                    <div className="w-full h-full rounded-xs" style={{ background: "rgba(255,255,255,0.1)" }} />
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">{rotations} total rotations</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          Click mirrors (/ \\) to rotate · Guide laser to vault
        </span>
      </div>

      {isFlash && (
        <div className="absolute top-11 right-3 z-20 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse"
          style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fcd34d" }}
        >⚡ FLASH</div>
      )}
    </div>
  );
}