// =============================================================================
// GAME 14: SHADOW TRACE — Trace the glowing path before it vanishes
// components/(gamification)/(games)/shadow-trace-game.tsx
//
// Mechanic: A path of connected dots is revealed briefly, then goes dark.
// Draw over the path from memory using mouse drag or touch. Accuracy %
// determines your score. Each round shows the path for shorter duration and
// adds more nodes. A "ghost" trace helps you see how close you were after.
// Pure muscle memory + spatial recall. No reaction time, no luck — just skill.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trophy, Eye, EyeOff, Star } from "lucide-react";
import type { GameProps } from "./game-types";

interface Dot {
  x: number;  // % 0-100
  y: number;  // % 0-100
}

type Phase = "show" | "hide" | "draw" | "result";

const CANVAS_W = 380;
const CANVAS_H = 220;

function generatePath(nodes: number): Dot[] {
  // Create a path with reasonable spacing between nodes
  const dots: Dot[] = [];
  const margin = 12;
  for (let i = 0; i < nodes; i++) {
    let attempts = 0;
    let dot: Dot;
    do {
      dot = {
        x: margin + Math.random() * (100 - margin * 2),
        y: margin + Math.random() * (100 - margin * 2),
      };
      attempts++;
    } while (
      attempts < 30 &&
      dots.some(d => Math.hypot(d.x - dot.x, d.y - dot.y) < 20)
    );
    dots.push(dot);
  }
  return dots;
}

function pathToSvg(dots: Dot[], w: number, h: number): string {
  if (dots.length < 2) return "";
  return dots.map((d, i) =>
    `${i === 0 ? "M" : "L"} ${(d.x / 100) * w} ${(d.y / 100) * h}`
  ).join(" ");
}

function traceAccuracy(drawn: Dot[], path: Dot[], w: number, h: number): number {
  if (drawn.length < 2 || path.length < 2) return 0;
  // Sample points along the target path, check how close drawn points are
  let totalScore = 0;
  const samples = 40;
  for (let i = 0; i < samples; i++) {
    const t    = i / (samples - 1);
    const idx  = t * (path.length - 1);
    const lo   = Math.floor(idx);
    const hi   = Math.min(path.length - 1, Math.ceil(idx));
    const frac = idx - lo;
    const px   = (path[lo].x + (path[hi].x - path[lo].x) * frac) / 100 * w;
    const py   = (path[lo].y + (path[hi].y - path[lo].y) * frac) / 100 * h;

    // Find closest drawn point
    let minDist = Infinity;
    for (const dp of drawn) {
      const dx = dp.x / 100 * w - px;
      const dy = dp.y / 100 * h - py;
      minDist  = Math.min(minDist, Math.hypot(dx, dy));
    }
    const tolerance = 28; // px
    totalScore += Math.max(0, 1 - minDist / tolerance);
  }
  return Math.round((totalScore / samples) * 100);
}

export function ShadowTraceGame({
  gameId, rewardTokens, duration = 60, onComplete, isFlash = false,
}: GameProps) {
  const [phase,     setPhase]    = useState<Phase>("show");
  const [round,     setRound]    = useState(1);
  const [path,      setPath]     = useState<Dot[]>(() => generatePath(4));
  const [showTime,  setShowTime] = useState(2200);  // ms the path is visible
  const [drawn,     setDrawn]    = useState<Dot[]>([]);
  const [isDrawing, setIsDrawing]= useState(false);
  const [score,     setScore]    = useState(0);
  const [accuracy,  setAccuracy] = useState<number | null>(null);
  const [timeLeft,  setTimeLeft] = useState(duration);
  const [done,      setDone]     = useState(false);
  const [roundAcc,  setRoundAcc] = useState<number[]>([]);

  const scoreRef   = useRef(0);
  const doneRef    = useRef(false);
  const drawnRef   = useRef<Dot[]>([]);
  const svgRef     = useRef<SVGSVGElement>(null);
  const roundRef   = useRef(1);

  const getNodes = (r: number) => Math.min(8, 3 + Math.floor(r / 2));
  const getShowMs = (r: number) => Math.max(800, 2200 - r * 180);

  const startNextRound = useCallback(() => {
    if (doneRef.current) return;
    const nextRound = roundRef.current + 1;
    roundRef.current = nextRound;
    const nodes   = getNodes(nextRound);
    const showMs  = getShowMs(nextRound);
    setRound(nextRound);
    setPath(generatePath(nodes));
    setShowTime(showMs);
    setDrawn([]);
    drawnRef.current = [];
    setAccuracy(null);
    setPhase("show");
    setTimeout(() => { if (!doneRef.current) setPhase("draw"); }, showMs);
  }, []);

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => setPhase("draw"), showTime);
    const t = setInterval(() => {
      if (doneRef.current) { clearInterval(t); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // ── Game over ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!done) return;
    const avgAcc = roundAcc.length > 0 ? roundAcc.reduce((a, b) => a + b, 0) / roundAcc.length : 0;
    const final  = Math.max(1, Math.round(rewardTokens * (0.2 + (avgAcc / 100) * 1.8)));
    setTimeout(() => onComplete(final, scoreRef.current), 1600);
  }, [done]);

  // ── Draw handlers ─────────────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent): Dot | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    let cx: number, cy: number;
    if ("touches" in e) {
      cx = e.touches[0].clientX - rect.left;
      cy = e.touches[0].clientY - rect.top;
    } else {
      cx = (e as React.MouseEvent).clientX - rect.left;
      cy = (e as React.MouseEvent).clientY - rect.top;
    }
    return { x: (cx / rect.width) * 100, y: (cy / rect.height) * 100 };
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== "draw") return;
    e.preventDefault();
    setIsDrawing(true);
    drawnRef.current = [];
    const pos = getPos(e);
    if (pos) { drawnRef.current = [pos]; setDrawn([pos]); }
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || phase !== "draw") return;
    e.preventDefault();
    const pos = getPos(e);
    if (pos) {
      drawnRef.current = [...drawnRef.current, pos];
      setDrawn([...drawnRef.current]);
    }
  };

  const onUp = () => {
    if (!isDrawing || phase !== "draw") return;
    setIsDrawing(false);
    // Score this round
    const acc = traceAccuracy(drawnRef.current, path, CANVAS_W, CANVAS_H);
    setAccuracy(acc);
    setPhase("result");
    const pts = Math.round(acc * 1.5) + (acc >= 80 ? 20 : acc >= 60 ? 10 : 0);
    scoreRef.current += pts;
    setScore(scoreRef.current);
    setRoundAcc(prev => [...prev, acc]);
    // Show result briefly then next round
    setTimeout(() => {
      if (!doneRef.current) startNextRound();
    }, 1500);
  };

  const pathSvg   = pathToSvg(path, CANVAS_W, CANVAS_H);
  const drawnSvg  = pathToSvg(drawn, CANVAS_W, CANVAS_H);
  const accColor  = accuracy === null ? "#fff" : accuracy >= 80 ? "#10b981" : accuracy >= 55 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)", minHeight: 290 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Pencil className="w-3.5 h-3.5 text-pink-400" />{score}
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: "rgba(236,72,153,0.15)", color: "#f9a8d4", border: "1px solid rgba(236,72,153,0.3)" }}>
            Round {round} · {getNodes(round)} nodes
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {phase === "show" ? <Eye className="w-3 h-3" /> : phase === "draw" ? <Pencil className="w-3 h-3" /> : <Star className="w-3 h-3" />}
            {phase === "show" ? "Memorise" : phase === "draw" ? "Draw!" : "Result"}
          </div>
          <div className="font-black text-base tabular-nums"
            style={{ color: timeLeft <= 8 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="px-4 pt-3 pb-2 flex flex-col items-center">
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="rounded-xs touch-none"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            cursor: phase === "draw" ? "crosshair" : "default",
          }}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        >
          {/* Grid dots */}
          {[...Array(8)].map((_, xi) =>
            [...Array(5)].map((_, yi) => (
              <circle key={`${xi}-${yi}`}
                cx={(xi + 1) * (CANVAS_W / 9)}
                cy={(yi + 1) * (CANVAS_H / 6)}
                r="1.5" fill="rgba(255,255,255,0.08)" />
            ))
          )}

          {/* Target path (shown during "show" and "result") */}
          {(phase === "show" || phase === "result") && pathSvg && (
            <>
              <path d={pathSvg} fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
              <path d={pathSvg} fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="8 4" />
              {path.map((dot, i) => (
                <g key={i}>
                  <circle cx={(dot.x / 100) * CANVAS_W} cy={(dot.y / 100) * CANVAS_H}
                    r="8" fill="rgba(167,139,250,0.25)" stroke="#a78bfa" strokeWidth="1.5" />
                  <circle cx={(dot.x / 100) * CANVAS_W} cy={(dot.y / 100) * CANVAS_H}
                    r="4" fill="#c4b5fd" />
                  <text x={(dot.x / 100) * CANVAS_W} y={(dot.y / 100) * CANVAS_H - 12}
                    textAnchor="middle" fontSize="10" fill="rgba(196,181,253,0.8)" fontWeight="bold">
                    {i + 1}
                  </text>
                </g>
              ))}
            </>
          )}

          {/* Ghost path in result phase */}
          {phase === "result" && drawnSvg && (
            <path d={drawnSvg} fill="none" stroke="rgba(250,204,21,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Drawn trace */}
          {(phase === "draw" || phase === "result") && drawnSvg && (
            <path d={drawnSvg} fill="none"
              stroke={phase === "result" ? "#fbbf24" : "#f472b6"}
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          )}

          {/* Phase instruction overlay */}
          {phase === "hide" && (
            <text x={CANVAS_W / 2} y={CANVAS_H / 2} textAnchor="middle"
              fontSize="16" fill="rgba(255,255,255,0.5)" fontWeight="bold">
              Now draw it…
            </text>
          )}
          {phase === "draw" && drawn.length === 0 && (
            <text x={CANVAS_W / 2} y={CANVAS_H / 2} textAnchor="middle"
              fontSize="13" fill="rgba(255,255,255,0.25)">
              Drag to trace the path
            </text>
          )}
        </svg>

        {/* Accuracy badge */}
        <AnimatePresence>
          {phase === "result" && accuracy !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xs"
              style={{ background: `${accColor}18`, border: `1px solid ${accColor}40` }}>
              <p className="text-2xl font-black" style={{ color: accColor, letterSpacing: "-0.04em" }}>
                {accuracy}%
              </p>
              <p className="text-sm font-bold" style={{ color: accColor }}>
                {accuracy >= 85 ? "Perfect trace!" : accuracy >= 65 ? "Good trace" : accuracy >= 45 ? "Close enough" : "Keep practising"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {round} rounds · avg {roundAcc.length ? Math.round(roundAcc.reduce((a,b)=>a+b,0)/roundAcc.length) : 0}% accuracy
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