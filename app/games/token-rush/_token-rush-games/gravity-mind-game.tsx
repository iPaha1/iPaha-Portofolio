// =============================================================================
// TOKEN RUSH — Game 5: Gravity Mind
// app/token-rush/_games/gravity-mind.tsx
//
// Physics-based spatial reasoning duel on a shared 10×10 grid.
// Players alternate placing gravity wells, then secretly predict where a
// launched projectile will land after 5 bounces. Closest prediction wins.
//
// ANTI-CHEAT: Predictions committed server-side before simulation runs.
// Physics computed server-side using deterministic engine — no client spoofing.
//
// DEMO MODE: Physics run locally. In production, POST predictions to
// /api/token-rush/challenges/[challengeId]/gravity-predict and GET the result.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Crosshair, Zap } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GravityMindProps {
  challengeId:   string;
  myUserId:      string;
  opponentName:  string;
  opponentId:    string;
  wagerAmount:   number;
  netPrize:      number;
  isHost:        boolean;
  soundEnabled?: boolean;
  onComplete:    (myScore: number, oppScore: number) => void;
  onScoreUpdate: (myScore: number) => void;
}

const GRID        = 10;
const TOTAL_ROUNDS = 7;
const WELLS_EACH  = 3;    // gravity wells per player per round
const BOUNCES     = 5;
const PTS_PERFECT = 30;   // exact cell
const PTS_NEAR    = 15;   // adjacent (distance ≤ 1 cell)
const PTS_CLOSE   = 8;    // distance ≤ 2 cells
const PRED_SECS   = 12;   // seconds to submit prediction

type Cell  = { row: number; col: number };
type Well  = Cell & { strength: number; owner: "me" | "opp" };
type Phase = "placing" | "predicting" | "simulating" | "reveal" | "done";

// ── Deterministic physics engine ─────────────────────────────────────────────
interface Vec2 { x: number; y: number }

function applyGravity(pos: Vec2, vel: Vec2, wells: Well[], dt = 0.05): { pos: Vec2; vel: Vec2 } {
  let ax = 0, ay = 0;
  for (const w of wells) {
    const dx = w.col + 0.5 - pos.x;
    const dy = w.row + 0.5 - pos.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < 0.01) continue;
    const force = w.strength / d2;
    ax += dx * force;
    ay += dy * force;
  }
  const nvx = vel.x + ax * dt;
  const nvy = vel.y + ay * dt;
  return { pos: { x: pos.x + nvx * dt, y: pos.y + nvy * dt }, vel: { x: nvx, y: nvy } };
}

function simulate(wells: Well[], startPos: Cell, bounces = BOUNCES): { path: Vec2[]; landing: Cell } {
  let pos: Vec2 = { x: startPos.col + 0.5, y: startPos.row + 0.5 };
  let vel: Vec2 = { x: 0.8, y: 0.3 };   // deterministic starting velocity
  const path: Vec2[] = [{ ...pos }];
  let bounceCount = 0;

  for (let step = 0; step < 2000 && bounceCount < bounces; step++) {
    const next = applyGravity(pos, vel, wells);
    pos = next.pos; vel = next.vel;

    // Bounce off walls
    if (pos.x < 0)      { pos.x = 0;    vel.x =  Math.abs(vel.x); bounceCount++; }
    if (pos.x >= GRID)  { pos.x = GRID - 0.01; vel.x = -Math.abs(vel.x); bounceCount++; }
    if (pos.y < 0)      { pos.y = 0;    vel.y =  Math.abs(vel.y); bounceCount++; }
    if (pos.y >= GRID)  { pos.y = GRID - 0.01; vel.y = -Math.abs(vel.y); bounceCount++; }

    if (step % 3 === 0) path.push({ ...pos });
  }

  const landing: Cell = {
    row: Math.min(GRID - 1, Math.max(0, Math.floor(pos.y))),
    col: Math.min(GRID - 1, Math.max(0, Math.floor(pos.x))),
  };
  return { path, landing };
}

function cellDist(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}

// ── Opponent AI prediction ────────────────────────────────────────────────────
function aiPredict(landing: Cell): Cell {
  // AI is ~60% accurate: sometimes near, sometimes way off
  const accuracy = Math.random();
  if (accuracy < 0.25) return landing; // perfect
  if (accuracy < 0.55) return { row: landing.row + Math.round(Math.random() * 2 - 1), col: landing.col + Math.round(Math.random() * 2 - 1) };
  return { row: Math.floor(Math.random() * GRID), col: Math.floor(Math.random() * GRID) };
}

// ── Canvas renderer ───────────────────────────────────────────────────────────
function GridCanvas({
  wells, path, landing, myPred, oppPred,
  hovCell, onCellClick, phase, startCell,
}: {
  wells: Well[];
  path: Vec2[];
  landing: Cell | null;
  myPred: Cell | null;
  oppPred: Cell | null;
  hovCell: Cell | null;
  onCellClick: (r: number, c: number) => void;
  phase: Phase;
  startCell: Cell;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const SIZE      = 300;
  const CELL_PX   = SIZE / GRID;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Background
    ctx.fillStyle = "rgba(6,6,18,1)";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth   = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL_PX, 0); ctx.lineTo(i * CELL_PX, SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL_PX); ctx.lineTo(SIZE, i * CELL_PX); ctx.stroke();
    }

    // Hover highlight
    if (hovCell && (phase === "placing" || phase === "predicting")) {
      ctx.fillStyle = phase === "placing" ? "rgba(99,102,241,0.18)" : "rgba(245,158,11,0.18)";
      ctx.fillRect(hovCell.col * CELL_PX, hovCell.row * CELL_PX, CELL_PX, CELL_PX);
    }

    // My prediction
    if (myPred) {
      ctx.fillStyle = "rgba(245,158,11,0.25)";
      ctx.fillRect(myPred.col * CELL_PX, myPred.row * CELL_PX, CELL_PX, CELL_PX);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.strokeRect(myPred.col * CELL_PX + 1, myPred.row * CELL_PX + 1, CELL_PX - 2, CELL_PX - 2);
    }

    // Opponent prediction (shown only after reveal)
    if (oppPred && phase === "reveal") {
      ctx.fillStyle = "rgba(6,182,212,0.2)";
      ctx.fillRect(oppPred.col * CELL_PX, oppPred.row * CELL_PX, CELL_PX, CELL_PX);
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.strokeRect(oppPred.col * CELL_PX + 1, oppPred.row * CELL_PX + 1, CELL_PX - 2, CELL_PX - 2);
    }

    // Gravity wells
    for (const w of wells) {
      const cx = (w.col + 0.5) * CELL_PX;
      const cy = (w.row + 0.5) * CELL_PX;
      const r  = CELL_PX * 0.38;
      const color = w.owner === "me" ? "#6366f1" : "#ec4899";
      const glow  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
      glow.addColorStop(0, `${color}55`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, r * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      // Orbit rings
      ctx.strokeStyle = `${color}60`;
      ctx.lineWidth = 0.8;
      for (const rr of [r * 1.6, r * 2.4]) {
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // Flight path
    if (path.length > 1 && (phase === "simulating" || phase === "reveal")) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245,158,11,0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(path[0].x * CELL_PX, path[0].y * CELL_PX);
      for (const p of path.slice(1)) ctx.lineTo(p.x * CELL_PX, p.y * CELL_PX);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Landing cell highlight
    if (landing && (phase === "simulating" || phase === "reveal")) {
      ctx.fillStyle = "rgba(16,185,129,0.35)";
      ctx.fillRect(landing.col * CELL_PX, landing.row * CELL_PX, CELL_PX, CELL_PX);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.strokeRect(landing.col * CELL_PX + 1, landing.row * CELL_PX + 1, CELL_PX - 2, CELL_PX - 2);
    }

    // Start cell
    const sc = startCell;
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc((sc.col + 0.5) * CELL_PX, (sc.row + 0.5) * CELL_PX, CELL_PX * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Projectile (animated — only in simulating phase; just show landing in reveal)
    if (landing && phase === "reveal") {
      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur  = 12;
      ctx.beginPath();
      ctx.arc((landing.col + 0.5) * CELL_PX, (landing.row + 0.5) * CELL_PX, CELL_PX * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

  }, [wells, path, landing, myPred, oppPred, hovCell, phase]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const col  = Math.floor(x / (SIZE / GRID));
    const row  = Math.floor(y / (SIZE / GRID));
    if (row >= 0 && row < GRID && col >= 0 && col < GRID) onCellClick(row, col);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const col  = Math.floor((e.clientX - rect.left) / (SIZE / GRID));
    const row  = Math.floor((e.clientY - rect.top)  / (SIZE / GRID));
    if (row >= 0 && row < GRID && col >= 0 && col < GRID) {
      // Bubble up via callback instead of separate prop
      (e.target as HTMLCanvasElement).dataset.hov = `${row},${col}`;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={SIZE} height={SIZE}
      onClick={handleClick}
      onMouseMove={handleMove}
      className="rounded-xs cursor-crosshair"
      style={{ display: "block", maxWidth: "100%", border: "1px solid rgba(255,255,255,0.1)" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function GravityMindGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: GravityMindProps) {
  const { play } = useGameSound(soundEnabled);

  const [round,        setRound]        = useState(1);
  const [phase,        setPhase]        = useState<Phase>("placing");
  const [myWells,      setMyWells]      = useState<Well[]>([]);
  const [oppWells,     setOppWells]     = useState<Well[]>([]);
  const [myPred,       setMyPred]       = useState<Cell | null>(null);
  const [oppPred,      setOppPred]      = useState<Cell | null>(null);
  const [path,         setPath]         = useState<Vec2[]>([]);
  const [landing,      setLanding]      = useState<Cell | null>(null);
  const [hovCell,      setHovCell]      = useState<Cell | null>(null);
  const [myScore,      setMyScore]      = useState(0);
  const [oppScore,     setOppScore]     = useState(0);
  const [predTimeLeft, setPredTime]     = useState(PRED_SECS);
  const [oppPredDone,  setOppPredDone]  = useState(false);
  const [roundResult,  setRoundResult]  = useState<{
    myPts: number; oppPts: number; myDist: number; oppDist: number; headline: string;
  } | null>(null);
  const [animStep,     setAnimStep]     = useState(0); // for path animation

  const myScoreRef   = useRef(0);
  const oppScoreRef  = useRef(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const predLocked   = useRef(false);

  // Fixed start position per round
  const startCell: Cell = useMemo(() => ({ row: 0, col: 0 }), []);

  // ── Place a well ──────────────────────────────────────────────────────────
  const handleCellClick = useCallback((row: number, col: number) => {
    if (phase === "placing") {
      const allWells = [...myWells, ...oppWells];
      if (allWells.some(w => w.row === row && w.col === col)) return;
      if (row === startCell.row && col === startCell.col) return;

      if (myWells.length < WELLS_EACH) {
        setMyWells(w => [...w, { row, col, strength: 0.4, owner: "me" }]);
        play("phantomPlace");
      }
    } else if (phase === "predicting" && !predLocked.current) {
      setMyPred({ row, col });
      play("uiClick");
    }
  }, [phase, myWells, oppWells, startCell, play]);

  // ── Start predicting phase ────────────────────────────────────────────────
  const startPredicting = useCallback(() => {
    predLocked.current = false;
    setMyPred(null);
    setOppPredDone(false);
    setPredTime(PRED_SECS);
    setPhase("predicting");
    play("roundStart");

    timerRef.current = setInterval(() => {
      setPredTime(t => {
        if (t <= 1) { clearInterval(timerRef.current!); lockPrediction(); return 0; }
        return t - 1;
      });
    }, 1000);

    // Simulate opponent predicting (DEMO)
    setTimeout(() => setOppPredDone(true), 2000 + Math.random() * 7000);
  }, [play]); // eslint-disable-line

  // ── Lock in prediction and simulate ──────────────────────────────────────
  const lockPrediction = useCallback(() => {
    if (predLocked.current) return;
    predLocked.current = true;
    clearInterval(timerRef.current!);

    const allWells = [...myWells, ...oppWells];
    const { path: simPath, landing: simLanding } = simulate(allWells, startCell);

    // AI prediction (DEMO)
    const oPred = aiPredict(simLanding);
    setOppPred(oPred);

    setPath(simPath);
    setLanding(simLanding);
    setPhase("simulating");
    play("challengePost");

    // Animate path reveal then show result
    let step = 0;
    const anim = setInterval(() => {
      step++;
      setAnimStep(step);
      if (step >= simPath.length) {
        clearInterval(anim);
        setTimeout(() => scoreRound(simLanding, myPred ?? { row: -1, col: -1 }, oPred), 600);
      }
    }, 20);
  }, [myWells, oppWells, startCell, myPred, play]); // eslint-disable-line

  // ── Score the round ───────────────────────────────────────────────────────
  const scoreRound = useCallback((actual: Cell, mp: Cell, op: Cell) => {
    const myDist  = cellDist(mp, actual);
    const oppDist = cellDist(op, actual);

    const pts = (dist: number) =>
      dist === 0 ? PTS_PERFECT : dist === 1 ? PTS_NEAR : dist <= 2 ? PTS_CLOSE : 0;

    let myPts  = pts(myDist);
    let oppPts = pts(oppDist);

    // Tie-break: closer gets +5
    if (myPts > 0 && oppPts > 0 && myPts === oppPts) {
      if (myDist < oppDist) myPts  += 5;
      else                  oppPts += 5;
    }

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline =
      myDist === 0 ? "🎯 PERFECT prediction! +30 pts!" :
      myDist === 1 ? "✅ Adjacent — great spatial sense!" :
      myDist <= 2  ? "👍 Close call!" :
      myPts === 0  ? "💀 Missed it completely" : "✅ You scored!";

    play(myPts >= PTS_NEAR ? "predCorrect" : myPts > 0 ? "roundEnd" : "predWrong");
    setRoundResult({ myPts, oppPts, myDist, oppDist, headline });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        setRound(r => r + 1);
        setMyWells([]); setOppWells([]);
        setMyPred(null); setOppPred(null);
        setPath([]); setLanding(null);
        setRoundResult(null); setAnimStep(0);
        predLocked.current = false;
        setPhase("placing");
        play("roundStart");

        // Place opponent wells for new round (DEMO)
        const ow: Well[] = [];
        while (ow.length < WELLS_EACH) {
          const r = Math.floor(Math.random() * GRID);
          const c = Math.floor(Math.random() * GRID);
          if (!ow.some(w => w.row === r && w.col === c) && !(r === 0 && c === 0)) {
            ow.push({ row: r, col: c, strength: 0.35, owner: "opp" });
          }
        }
        setOppWells(ow);
      }
    }, 3500);
  }, [round, onComplete, onScoreUpdate, play]);

  // ── Bootstrap: place initial opponent wells ───────────────────────────────
  useEffect(() => {
    const ow: Well[] = [];
    while (ow.length < WELLS_EACH) {
      const r = Math.floor(Math.random() * GRID);
      const c = Math.floor(Math.random() * GRID);
      if (!ow.some(w => w.row === r && w.col === c) && !(r === 0 && c === 0)) {
        ow.push({ row: r, col: c, strength: 0.35, owner: "opp" });
      }
    }
    setOppWells(ow);
    play("roundStart");
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []); // eslint-disable-line

  const allWells   = [...myWells, ...oppWells];
  const visiblePath = phase === "simulating" ? path.slice(0, animStep) : phase === "reveal" ? path : [];
  const myWellsLeft = WELLS_EACH - myWells.length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <motion.div key={myScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#6366f1", letterSpacing: "-0.05em" }}>
            {myScore}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>
            {oppScore}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      {/* ── Phase label ── */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-black px-3 py-1.5 rounded-xs"
          style={{
            background:
              phase === "placing"    ? "rgba(99,102,241,0.15)"  :
              phase === "predicting" ? "rgba(245,158,11,0.15)"  :
              phase === "simulating" ? "rgba(16,185,129,0.15)"  :
              "rgba(255,255,255,0.06)",
            color:
              phase === "placing"    ? "#6366f1" :
              phase === "predicting" ? "#f59e0b" :
              phase === "simulating" ? "#10b981" : "rgba(255,255,255,0.4)",
            border: `1px solid ${phase === "placing" ? "rgba(99,102,241,0.3)" : phase === "predicting" ? "rgba(245,158,11,0.3)" : phase === "simulating" ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
          }}>
          {phase === "placing"    && `Place ${myWellsLeft > 0 ? myWellsLeft : "0"} more gravity well${myWellsLeft !== 1 ? "s" : ""}`}
          {phase === "predicting" && `Predict landing — ${predTimeLeft}s`}
          {phase === "simulating" && "Simulating trajectory…"}
          {phase === "reveal"     && "Round complete"}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[9px] text-white/30">
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> You</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-pink-400" /> Them</span>
        </div>
      </div>

      {/* ── Grid canvas ── */}
      <div className="flex justify-center">
        <GridCanvas
          wells={allWells}
          path={visiblePath}
          landing={phase === "reveal" || phase === "simulating" ? landing : null}
          myPred={phase === "predicting" || phase === "reveal" ? myPred : null}
          oppPred={oppPred}
          hovCell={hovCell}
          onCellClick={handleCellClick}
          phase={phase}
          startCell={startCell}
        />
      </div>

      {/* ── Actions ── */}
      <div className="space-y-2">
        {/* Go to predict phase */}
        {phase === "placing" && myWells.length >= WELLS_EACH && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={startPredicting}
            className="w-full py-3.5 rounded-xs text-sm font-black text-white flex items-center justify-center gap-2"
            style={{ background: "#6366f1", boxShadow: "0 0 28px rgba(99,102,241,0.5)" }}>
            <Target className="w-4 h-4" />Confirm Wells — Move to Prediction
          </motion.button>
        )}

        {/* Lock prediction */}
        {phase === "predicting" && (
          <motion.button whileHover={{ scale: myPred ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
            onClick={lockPrediction} disabled={!myPred}
            className="w-full py-3.5 rounded-xs text-sm font-black text-white disabled:opacity-30 flex items-center justify-center gap-2"
            style={{ background: myPred ? "#f59e0b" : "rgba(255,255,255,0.05)", border: myPred ? "none" : "1px solid rgba(255,255,255,0.1)", boxShadow: myPred ? "0 0 28px rgba(245,158,11,0.5)" : "none" }}>
            <Crosshair className="w-4 h-4" />{myPred ? "Lock Prediction & Launch!" : "Click the grid to place your prediction"}
          </motion.button>
        )}

        {phase === "predicting" && (
          <div className="text-center text-[10px] font-bold" style={{ color: oppPredDone ? "#10b981" : "rgba(255,255,255,0.25)" }}>
            {oppPredDone ? `${opponentName} has locked their prediction` : `${opponentName} is still deciding…`}
          </div>
        )}
      </div>

      {/* ── Round result ── */}
      <AnimatePresence>
        {phase === "reveal" && roundResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xs p-5 space-y-3"
            style={{ background: "rgba(6,6,18,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "You", pts: roundResult.myPts, dist: roundResult.myDist, col: "#6366f1" },
                { label: opponentName, pts: roundResult.oppPts, dist: roundResult.oppDist, col: "#06b6d4" },
              ].map(p => (
                <div key={p.label} className="rounded-xs py-3 px-2 text-center"
                  style={{ background: `${p.col}12`, border: `1px solid ${p.col}28` }}>
                  <div className="text-[9px] uppercase tracking-widest font-black mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>{p.label}</div>
                  <div className="text-2xl font-black" style={{ color: p.col }}>+{p.pts}</div>
                  <div className="text-[10px] text-white/30">{p.dist === 0 ? "Perfect!" : `${p.dist} cells off`}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 text-[10px] text-white/35">
              <span>🟡 Your prediction</span>
              <span>🔵 Opponent's prediction</span>
              <span>🟢 Actual landing</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}