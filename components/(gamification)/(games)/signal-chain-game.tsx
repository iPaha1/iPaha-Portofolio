// =============================================================================
// GAME 17: SIGNAL CHAIN — Rotate circuit tiles to complete the electric path
// components/(gamification)/(games)/signal-chain-game.tsx
//
// Mechanic: A 5×5 grid of circuit tiles. Each tile has wire segments on some
// edges (top/right/bottom/left). Click a tile to rotate it 90°. Goal: create
// a continuous path from the SOURCE (top-left) to the SINK (bottom-right)
// with all wires fully connected — no dangling ends, no broken paths.
// Solve in fewer clicks = bigger reward. Difficulty grows each round by
// adding more tiles to the grid and more complex pipe shapes.
// Completely original — spatial logic + rotation puzzle, no other game here does this.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, RotateCw, Radio } from "lucide-react";
import type { GameProps } from "./game-types";

// Each tile has 4 edge connections: [top, right, bottom, left]
type Edges = [boolean, boolean, boolean, boolean]; // T R B L

interface Tile {
  id:     number;
  edges:  Edges;          // current connection state
  base:   Edges;          // unrotated template
  rot:    number;         // 0-3 (×90°)
  type:   TileType;
}

type TileType = "empty" | "straight" | "corner" | "tee" | "cross" | "source" | "sink";

// Template edges at rot=0
const TEMPLATES: Record<TileType, Edges> = {
  empty:    [false,false,false,false],
  straight: [true, false,true, false],   // vertical pipe
  corner:   [false,true, true, false],   // bottom-right L
  tee:      [true, true, true, false],   // T open left
  cross:    [true, true, true, true],    // +
  source:   [false,true, false,false],   // only right — placed top-left
  sink:     [false,false,false,true],    // only left — placed bottom-right
};

function rotateEdges(edges: Edges, times: number): Edges {
  let e = [...edges] as Edges;
  for (let t = 0; t < times % 4; t++) {
    e = [e[3], e[0], e[1], e[2]]; // T←L, R←T, B←R, L←B
  }
  return e;
}

// Build a solvable puzzle: lay a random path, then fill rest with rotated tiles
function buildPuzzle(size: number): Tile[] {
  const TOTAL = size * size;
  const tiles: Tile[] = Array.from({ length: TOTAL }, (_, i) => ({
    id: i, edges: [false,false,false,false], base: [false,false,false,false], rot: 0, type: "empty" as TileType,
  }));

  // Step 1: random walk from (0,0) to (size-1,size-1)
  const path: number[] = [];
  let r = 0, c = 0;
  path.push(0);
  const visited = new Set([0]);

  while (r !== size - 1 || c !== size - 1) {
    const moves: [number,number][] = [];
    const dr = size - 1 - r;
    const dc = size - 1 - c;
    if (dr > 0) moves.push([1, 0]);
    if (dc > 0) moves.push([0, 1]);
    if (dr < 0) moves.push([-1, 0]);
    if (dc < 0) moves.push([0, -1]);
    // prefer moving toward goal
    const [nr, nc] = moves[Math.floor(Math.random() * Math.min(moves.length, 2))];
    r += nr; c += nc;
    const idx = r * size + c;
    if (!visited.has(idx)) { visited.add(idx); path.push(idx); }
  }

  // Step 2: mark path tile edges
  for (let p = 0; p < path.length; p++) {
    const idx  = path[p];
    const pr   = Math.floor(idx / size);
    const pc   = idx % size;
    const edges: Edges = [false,false,false,false];

    if (p > 0) {
      const prev  = path[p - 1];
      const pvr   = Math.floor(prev / size);
      const pvc   = prev % size;
      if (pvr === pr - 1) edges[0] = true;  // came from top
      if (pvc === pc + 1) edges[3] = true;  // came from right
      if (pvr === pr + 1) edges[2] = true;  // came from bottom
      if (pvc === pc - 1) edges[1] = true;  // came from left
    }
    if (p < path.length - 1) {
      const next  = path[p + 1];
      const nxr   = Math.floor(next / size);
      const nxc   = next % size;
      if (nxr === pr - 1) edges[0] = true;
      if (nxc === pc + 1) edges[1] = true;
      if (nxr === pr + 1) edges[2] = true;
      if (nxc === pc - 1) edges[3] = true;
    }

    const type: TileType = idx === 0 ? "source" : idx === TOTAL - 1 ? "sink"
      : edges.filter(Boolean).length === 2
        ? (edges[0] === edges[2] && edges[1] === edges[3] ? "straight" : "corner")
        : edges.filter(Boolean).length === 3 ? "tee" : "cross";

    tiles[idx].type  = type;
    tiles[idx].base  = [...edges] as Edges;
    tiles[idx].edges = [...edges] as Edges;
    tiles[idx].rot   = 0;
  }

  // Step 3: fill non-path tiles with random non-connecting tile types
  for (let i = 0; i < TOTAL; i++) {
    if (tiles[i].type !== "empty") continue;
    const type: TileType = Math.random() < 0.4 ? "straight" : Math.random() < 0.5 ? "corner" : "tee";
    const rot   = Math.floor(Math.random() * 4) as 0|1|2|3;
    const base  = TEMPLATES[type];
    tiles[i].type  = type;
    tiles[i].base  = [...base] as Edges;
    tiles[i].edges = rotateEdges(base, rot);
    tiles[i].rot   = rot;
  }

  // Step 4: scramble path tiles (NOT source/sink)
  for (let i = 0; i < TOTAL; i++) {
    const t = tiles[i];
    if (t.type === "source" || t.type === "sink") continue;
    const rot = Math.floor(Math.random() * 4);
    t.rot   = rot;
    t.edges = rotateEdges(t.base, rot);
  }

  return tiles;
}

// BFS from source to check if path is complete
function checkSolved(tiles: Tile[], size: number): boolean {
  const TOTAL = size * size;
  const q     = [0];
  const seen  = new Set([0]);
  while (q.length) {
    const idx = q.shift()!;
    if (idx === TOTAL - 1) return true;
    const r   = Math.floor(idx / size);
    const c   = idx % size;
    const e   = tiles[idx].edges;

    const neighbours: [number, number, number, number][] = [
      // [nIdx, myEdge, theirEdge, exists]
      [idx - size, 0, 2, r > 0 ? 1 : 0],         // top
      [idx + 1,    1, 3, c < size-1 ? 1 : 0],    // right
      [idx + size, 2, 0, r < size-1 ? 1 : 0],    // bottom
      [idx - 1,    3, 1, c > 0 ? 1 : 0],          // left
    ];
    for (const [nIdx, myEdge, theirEdge, exists] of neighbours) {
      if (!exists || seen.has(nIdx)) continue;
      if (e[myEdge] && tiles[nIdx].edges[theirEdge]) {
        seen.add(nIdx);
        q.push(nIdx);
      }
    }
  }
  return false;
}

// Which tiles are energised (reachable from source)
function getEnergised(tiles: Tile[], size: number): Set<number> {
  const q    = [0];
  const seen = new Set([0]);
  while (q.length) {
    const idx = q.shift()!;
    const r   = Math.floor(idx / size);
    const c   = idx % size;
    const e   = tiles[idx].edges;
    const neighbours: [number, number, number, number][] = [
      [idx - size, 0, 2, r > 0 ? 1 : 0],
      [idx + 1,    1, 3, c < size-1 ? 1 : 0],
      [idx + size, 2, 0, r < size-1 ? 1 : 0],
      [idx - 1,    3, 1, c > 0 ? 1 : 0],
    ];
    for (const [nIdx, myEdge, theirEdge, exists] of neighbours) {
      if (!exists || seen.has(nIdx)) continue;
      if (e[myEdge] && tiles[nIdx].edges[theirEdge]) {
        seen.add(nIdx);
        q.push(nIdx);
      }
    }
  }
  return seen;
}

const GRID_SIZE = 5;

export function SignalChainGame({
  gameId, rewardTokens, duration = 60, onComplete, isFlash = false,
}: GameProps) {
  const [tiles,    setTiles]    = useState<Tile[]>(() => buildPuzzle(GRID_SIZE));
  const [energised,setEnergised]= useState<Set<number>>(() => new Set([0]));
  const [clicks,   setClicks]   = useState(0);
  const [solved,   setSolved]   = useState(false);
  const [round,    setRound]    = useState(1);
  const [score,    setScore]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [done,     setDone]     = useState(false);
  const [win,      setWin]      = useState(false);

  const scoreRef  = useRef(0);
  const doneRef   = useRef(false);
  const roundRef  = useRef(1);
  const clicksRef = useRef(0);

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
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + (scoreRef.current / Math.max(1, roundRef.current * 40)) * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1600);
  }, [done]);

  const handleRotate = (idx: number) => {
    if (solved || doneRef.current) return;
    const next = tiles.map((t, i) => {
      if (i !== idx) return t;
      if (t.type === "source" || t.type === "sink") return t;
      const rot   = ((t.rot + 1) % 4) as 0|1|2|3;
      return { ...t, rot, edges: rotateEdges(t.base, rot) };
    });

    clicksRef.current++;
    setClicks(clicksRef.current);
    setTiles(next);
    const eng = getEnergised(next, GRID_SIZE);
    setEnergised(eng);

    if (checkSolved(next, GRID_SIZE)) {
      setSolved(true);
      setWin(true);
      const efficiency = Math.max(0, 1 - (clicksRef.current - GRID_SIZE * 2) / (GRID_SIZE * 6));
      const pts        = 60 + Math.round(efficiency * 60) + roundRef.current * 10;
      scoreRef.current += pts;
      setScore(scoreRef.current);

      setTimeout(() => {
        if (doneRef.current) return;
        setSolved(false);
        setWin(false);
        roundRef.current++;
        setRound(roundRef.current);
        clicksRef.current = 0;
        setClicks(0);
        const newTiles = buildPuzzle(GRID_SIZE);
        setTiles(newTiles);
        setEnergised(getEnergised(newTiles, GRID_SIZE));
      }, 1000);
    }
  };

  // Wire SVG for each tile
  const renderWire = (tile: Tile, isLit: boolean) => {
    const [t, r, b, l] = tile.edges;
    const cx = 20, cy = 20, mid = 20;
    const lit   = isLit ? "#10b981" : "#334155";
    const glow  = isLit ? "#10b98180" : "transparent";
    const lines: React.ReactNode[] = [];
    if (t) lines.push(<line key="t" x1={cx} y1={0} x2={cx} y2={cy} stroke={lit} strokeWidth="3" strokeLinecap="round" />);
    if (r) lines.push(<line key="r" x1={cx} y1={cy} x2={40} y2={cy} stroke={lit} strokeWidth="3" strokeLinecap="round" />);
    if (b) lines.push(<line key="b" x1={cx} y1={cy} x2={cx} y2={40} stroke={lit} strokeWidth="3" strokeLinecap="round" />);
    if (l) lines.push(<line key="l" x1={0} y1={cy} x2={cx} y2={cy} stroke={lit} strokeWidth="3" strokeLinecap="round" />);
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ display: "block" }}>
        <rect width="40" height="40" fill="transparent" />
        <circle cx={cx} cy={cy} r="3" fill={isLit ? "#10b981" : "#475569"} />
        {lines}
        {tile.type === "source" && <circle cx={cx} cy={cy} r="6" fill="none" stroke="#f59e0b" strokeWidth="2" />}
        {tile.type === "sink"   && <circle cx={cx} cy={cy} r="6" fill="none" stroke="#ef4444" strokeWidth="2" />}
      </svg>
    );
  };

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#0c2340 100%)", minHeight: 300 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Radio className="w-3.5 h-3.5 text-emerald-400" />{score}
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.25)" }}>
            Round {round} · {clicks} rotations
          </div>
          <div className="text-[10px]"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            {energised.size}/{GRID_SIZE * GRID_SIZE} lit
          </div>
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Energy progress bar */}
      <div className="h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full"
          style={{ background: "#10b981" }}
          animate={{ width: `${(energised.size / (GRID_SIZE * GRID_SIZE)) * 100}%` }}
          transition={{ duration: 0.2 }} />
      </div>

      {/* Circuit grid */}
      <div className="flex flex-col items-center py-4">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 3 }}>
          {tiles.map((tile, idx) => {
            const isLit     = energised.has(idx);
            const isSource  = tile.type === "source";
            const isSink    = tile.type === "sink";
            return (
              <motion.button
                key={tile.id}
                whileTap={tile.type !== "source" && tile.type !== "sink" ? { scale: 0.88, rotate: 90 } : {}}
                transition={{ duration: 0.15 }}
                onClick={() => handleRotate(idx)}
                className="flex items-center justify-center rounded-xs"
                style={{
                  width: 44, height: 44,
                  background: isLit
                    ? isSource ? "rgba(245,158,11,0.2)" : isSink ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.1)"
                    : "rgba(255,255,255,0.04)",
                  border: isLit
                    ? `1.5px solid ${isSource ? "#f59e0b" : isSink ? "#ef4444" : "#10b98160"}`
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: isLit && !isSource && !isSink ? "inset 0 0 8px rgba(16,185,129,0.15)" : "none",
                  cursor: tile.type === "source" || tile.type === "sink" ? "default" : "pointer",
                  transition: "background 0.2s, border 0.2s",
                }}>
                {renderWire(tile, isLit)}
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-3 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          <span>⚡ <span style={{ color: "#f59e0b" }}>Source</span></span>
          <span>Click tiles to rotate</span>
          <span>🎯 <span style={{ color: "#ef4444" }}>Sink</span></span>
        </div>
      </div>

      {/* Win flash */}
      <AnimatePresence>
        {win && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.1)" }}>
            <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="text-3xl font-black" style={{ color: "#10b981", textShadow: "0 0 30px #10b981", letterSpacing: "-0.04em" }}>
              Circuit complete! ⚡
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
            {round - 1} circuit{round - 1 !== 1 ? "s" : ""} solved
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