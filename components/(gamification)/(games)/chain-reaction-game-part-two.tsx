// =============================================================================
// GAME 17: CHAIN REACTION — Place atoms, trigger a nuclear cascade
// components/(gamification)/(games)/chain-reaction-game.tsx
//
// Concept: A 7×5 grid. Each cell has a charge (0-3). Click a cell to add
// one charge. When a cell hits its critical mass (4), it EXPLODES —
// shooting charge into all 4 neighbours, which may also explode in a chain.
// Wipe out all enemy atoms (red) from the board with one well-placed click.
// Score = size of chain reaction triggered. Bigger chains = more tokens.
// The cascade animation is genuinely mesmerising.
// =============================================================================

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Atom, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const COLS = 7;
const ROWS = 5;
const CRIT = 4; // critical mass

interface Cell {
  charge: number;
  owner: "player" | "enemy" | "empty";
  exploding: boolean;
}

function critMass(col: number, row: number): number {
  const isEdge = col === 0 || col === COLS - 1 || row === 0 || row === ROWS - 1;
  const isCorner = (col === 0 || col === COLS - 1) && (row === 0 || row === ROWS - 1);
  return isCorner ? 2 : isEdge ? 3 : 4;
}

function neighbours(idx: number): number[] {
  const r = Math.floor(idx / COLS), c = idx % COLS, ns = [];
  if (r > 0)         ns.push(idx - COLS);
  if (r < ROWS - 1)  ns.push(idx + COLS);
  if (c > 0)         ns.push(idx - 1);
  if (c < COLS - 1)  ns.push(idx + 1);
  return ns;
}

function makeBoard(): Cell[] {
  const board: Cell[] = Array.from({ length: COLS * ROWS }, () => ({
    charge: 0, owner: "empty", exploding: false,
  }));
  // Place 8 random enemy atoms
  const positions = new Set<number>();
  while (positions.size < 8) {
    positions.add(Math.floor(Math.random() * COLS * ROWS));
  }
  positions.forEach(i => {
    board[i] = { charge: 1 + Math.floor(Math.random() * 2), owner: "enemy", exploding: false };
  });
  return board;
}

async function explodeAll(
  board: Cell[],
  onStep: (b: Cell[], chain: number) => void,
): Promise<{ board: Cell[]; chain: number }> {
  let current = [...board];
  let chain = 0;
  let hadExplosion = true;

  while (hadExplosion) {
    hadExplosion = false;
    const exploding: number[] = [];
    current.forEach((cell, i) => {
      const cm = critMass(i % COLS, Math.floor(i / COLS));
      if (cell.charge >= cm) exploding.push(i);
    });
    if (exploding.length === 0) break;
    hadExplosion = true;
    chain += exploding.length;

    const next = current.map(c => ({ ...c, exploding: false }));
    exploding.forEach(i => {
      const cm = critMass(i % COLS, Math.floor(i / COLS));
      next[i] = { charge: next[i].charge - cm, owner: next[i].charge - cm <= 0 ? "empty" : next[i].owner, exploding: true };
      neighbours(i).forEach(n => {
        next[n] = {
          charge: next[n].charge + 1,
          owner: current[i].owner, // spread owner
          exploding: false,
        };
      });
      // Remove empty cells
      if (next[i].charge <= 0) next[i] = { charge: 0, owner: "empty", exploding: false };
    });
    current = next;
    onStep(current, chain);
    await new Promise(r => setTimeout(r, 120));
  }

  return { board: current, chain };
}

export function ChainReactionGamePartTwo({
  gameId, rewardTokens, duration = 45,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const [board, setBoard]       = useState<Cell[]>(makeBoard);
  const [score, setScore]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]       = useState<"playing" | "reacting" | "done">("playing");
  const [chainSize, setChainSize] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const boardRef   = useRef(board);
  const scoreRef   = useRef(0);
  const phaseRef   = useRef<"playing" | "reacting" | "done">("playing");
  useEffect(() => { boardRef.current = board; }, [board]);

  const playSound = useCallback((t: "place" | "explode" | "chain" | "win" | "lose") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const map: Record<string, [number, OscillatorType, number]> = {
        place:   [440, "sine",     0.07],
        explode: [220, "sawtooth", 0.15],
        chain:   [880, "sine",     0.25],
        win:     [1046,"sine",     0.6 ],
        lose:    [110, "sawtooth", 0.4 ],
      };
      const [freq, type, dur] = map[t];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  }, [soundEnabled]);

  const handleClick = useCallback(async (idx: number) => {
    if (phaseRef.current !== "playing") return;
    const current = boardRef.current;
    if (current[idx].owner === "enemy") return; // can't click enemy

    playSound("place");
    phaseRef.current = "reacting";
    setPhase("reacting");

    // Add charge
    const next = current.map((c, i) =>
      i === idx ? { ...c, charge: c.charge + 1, owner: "player" as const } : c
    );

    const result = await explodeAll(next, (b, chain) => {
      setBoard([...b]);
      if (chain > 0) playSound(chain > 3 ? "chain" : "explode");
    });

    setChainSize(result.chain);
    const pts = result.chain * 10;
    scoreRef.current += pts;
    setScore(scoreRef.current);
    setMoveCount(m => m + 1);
    setTimeout(() => setChainSize(null), 800);

    // Check win: no enemy atoms left
    const enemyLeft = result.board.filter(c => c.owner === "enemy").length;
    if (enemyLeft === 0) {
      playSound("win");
      phaseRef.current = "done";
      setPhase("done");
      const reward = Math.min(Math.floor(rewardTokens * (scoreRef.current / 100 + 0.5)), rewardTokens * 2);
      setTimeout(() => onComplete(reward, scoreRef.current), 1800);
    } else {
      phaseRef.current = "playing";
      setPhase("playing");
    }

    boardRef.current = result.board;
    setBoard(result.board);
  }, [playSound, rewardTokens, onComplete]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) {
        clearInterval(t);
        if (phaseRef.current !== "done") {
          phaseRef.current = "done";
          setPhase("done");
          const reward = Math.floor(rewardTokens * Math.max(0.15, scoreRef.current / 150));
          onComplete(Math.min(reward, rewardTokens * 2), scoreRef.current);
        }
        return 0;
      }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [rewardTokens, onComplete]);

  const enemyCount = board.filter(c => c.owner === "enemy").length;

  const CELL_COLORS = {
    empty:  { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)", dot: "#444" },
    player: { bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.4)",  dot: "#818cf8" },
    enemy:  { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.4)",   dot: "#f87171" },
  };

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#07080f 0%,#0c0818 100%)" }}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Atom className="w-4 h-4 text-indigo-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <span className="text-red-400 text-xs font-black">{enemyCount} enemy</span>
          </div>
          {chainSize !== null && chainSize > 0 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-xs"
              style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)" }}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 font-black text-xs">{chainSize} chain!</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Grid */}
      <div className="absolute inset-0 flex items-center justify-center pt-12 pb-8">
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: "5px",
          width: "min(360px, 90vw)",
        }}>
          {board.map((cell, i) => {
            const cm = critMass(i % COLS, Math.floor(i / COLS));
            const cfg = CELL_COLORS[cell.owner];
            return (
              <motion.button
                key={i}
                onClick={() => handleClick(i)}
                animate={cell.exploding ? {
                  scale: [1, 1.5, 1],
                  backgroundColor: ["rgba(245,158,11,0.4)", "rgba(245,158,11,0.1)"],
                } : {}}
                transition={{ duration: 0.2 }}
                whileHover={phase === "playing" && cell.owner !== "enemy" ? { scale: 1.06 } : {}}
                className="rounded-xs flex items-center justify-center relative"
                style={{
                  height: "44px",
                  background: cfg.bg,
                  border: `1px solid ${cell.exploding ? "#f59e0b" : cfg.border}`,
                  cursor: cell.owner === "enemy" ? "not-allowed" : "pointer",
                  boxShadow: cell.exploding ? "0 0 16px rgba(245,158,11,0.6)" : cell.charge > 0 ? `0 0 8px ${cfg.dot}40` : "none",
                }}
              >
                {/* Charge dots */}
                <div className="flex flex-wrap gap-0.5 items-center justify-center" style={{ maxWidth: "28px" }}>
                  {[...Array(cell.charge)].map((_, di) => (
                    <motion.div
                      key={di}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full"
                      style={{
                        width: "7px", height: "7px",
                        background: cfg.dot,
                        boxShadow: `0 0 4px ${cfg.dot}`,
                      }}
                    />
                  ))}
                </div>
                {/* Critical mass indicator */}
                {cell.charge >= cm - 1 && cell.charge > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#f59e0b", boxShadow: "0 0 4px #f59e0b" }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className={`w-14 h-14 mx-auto mb-3 ${enemyCount === 0 ? "text-amber-400" : "text-indigo-400"}`} />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">
                {enemyCount === 0 ? "Board cleared!" : `${enemyCount} enemy atoms left`} · {moveCount} moves
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          Click cells to add charge · Cascade to wipe enemy atoms
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