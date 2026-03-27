// =============================================================================
// GAME 13: SHADOW MATCH — Rotate the shape to match the silhouette exactly
// components/(gamification)/(games)/shadow-match-game.tsx
//
// Concept: A target silhouette is shown. A glowing shape of the same type
// starts at a random rotation. Drag left/right to rotate it. Hit "Lock In"
// when you think it matches. Accuracy is scored by angle delta.
// 8 rounds, each with a different shape and faster required precision.
// The "snap" audio + flash when you nail it is deeply satisfying.
// =============================================================================

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, RotateCw, CheckCircle } from "lucide-react";
import type { GameProps } from "./game-types";

const TOTAL_ROUNDS = 8;

// SVG path data for each shape (normalised around 0,0, unit ~60px)
interface Shape {
  name: string;
  path: string;
  viewBox: string;
}

const SHAPES: Shape[] = [
  {
    name: "Arrow",
    path: "M0,-55 L18,-20 L8,-20 L8,55 L-8,55 L-8,-20 L-18,-20 Z",
    viewBox: "-60 -60 120 120",
  },
  {
    name: "Star",
    path: "M0,-50 L12,-18 L47,-18 L19,4 L29,38 L0,18 L-29,38 L-19,4 L-47,-18 L-12,-18 Z",
    viewBox: "-55 -55 110 110",
  },
  {
    name: "Cross",
    path: "M-15,-55 L15,-55 L15,-15 L55,-15 L55,15 L15,15 L15,55 L-15,55 L-15,15 L-55,15 L-55,-15 L-15,-15 Z",
    viewBox: "-60 -60 120 120",
  },
  {
    name: "Pentagon",
    path: "M0,-52 L49,-17 L30,44 L-30,44 L-49,-17 Z",
    viewBox: "-55 -55 110 110",
  },
  {
    name: "Lightning",
    path: "M10,-60 L-15,0 L8,0 L-10,60 L35,-10 L12,-10 L38,-60 Z",
    viewBox: "-45 -65 90 130",
  },
  {
    name: "Diamond",
    path: "M0,-60 L40,0 L0,60 L-40,0 Z",
    viewBox: "-50 -65 100 130",
  },
];

function randomAngle() { return Math.round(Math.random() * 355 / 5) * 5; }
function angleDiff(a: number, b: number) {
  const d = Math.abs((a - b + 360) % 360);
  return Math.min(d, 360 - d);
}

export function ShadowMatchGame({
  gameId,
  rewardTokens,
  duration = 40,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const [round, setRound]         = useState(1);
  const [shape, setShape]         = useState<Shape>(() => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
  const [targetAngle, setTargetAngle] = useState(randomAngle);
  const [currentAngle, setCurrentAngle] = useState(randomAngle);
  const [score, setScore]         = useState(0);
  const [timeLeft, setTimeLeft]   = useState(duration);
  const [phase, setPhase]         = useState<"playing" | "locked" | "done">("playing");
  const [lastAcc, setLastAcc]     = useState<number | null>(null);
  const [flash, setFlash]         = useState(false);

  const dragStart  = useRef<{ x: number; angle: number } | null>(null);
  const scoreRef   = useRef(0);
  const roundRef   = useRef(1);

  const playSound = useCallback((accuracy: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const freq = accuracy > 0.85 ? 1046 : accuracy > 0.6 ? 784 : accuracy > 0.35 ? 523 : 330;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      o.start(); o.stop(ctx.currentTime + 0.25);
    } catch {}
  }, [soundEnabled]);

  const nextRound = useCallback((currentScore: number) => {
    const nr = roundRef.current + 1;
    roundRef.current = nr;
    if (nr > TOTAL_ROUNDS) {
      setPhase("done");
      const reward = Math.min(Math.floor(rewardTokens * (currentScore / 400 + 0.4)), rewardTokens * 2);
      setTimeout(() => onComplete(reward, currentScore), 1800);
      return;
    }
    setRound(nr);
    setShape(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    setTargetAngle(randomAngle());
    setCurrentAngle(randomAngle());
    setPhase("playing");
    setLastAcc(null);
  }, [rewardTokens, onComplete]);

  const lockIn = useCallback(() => {
    if (phase !== "playing") return;
    const diff = angleDiff(currentAngle, targetAngle);
    const tolerance = Math.max(6, 20 - roundRef.current * 1.5);
    const accuracy = Math.max(0, 1 - diff / 45);
    const pts = Math.round(accuracy * 100);
    const newScore = scoreRef.current + pts;
    scoreRef.current = newScore;
    setScore(newScore);
    setLastAcc(accuracy);
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
    playSound(accuracy);
    setPhase("locked");
    setTimeout(() => nextRound(newScore), 900);
  }, [phase, currentAngle, targetAngle, playSound, nextRound]);

  // Drag to rotate
  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "playing") return;
    dragStart.current = { x: e.clientX, angle: currentAngle };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current || phase !== "playing") return;
    const dx = e.clientX - dragStart.current.x;
    setCurrentAngle(a => (dragStart.current!.angle + dx * 1.4 + 360) % 360);
  };
  const onPointerUp = () => { dragStart.current = null; };

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); if (phase === "playing") lockIn(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [phase, lockIn]);

  const diff = angleDiff(currentAngle, targetAngle);
  const warmth = Math.max(0, 1 - diff / 30);

  const getAccLabel = (acc: number) => {
    if (acc > 0.9) return { text: "PERFECT", color: "#10b981" };
    if (acc > 0.65) return { text: "GREAT",  color: "#f59e0b" };
    if (acc > 0.35) return { text: "GOOD",   color: "#3b82f6" };
    return { text: "MISS",  color: "#ef4444" };
  };

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#080c18 0%,#0c0820 100%)" }}
    >
      {/* Stats */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <RotateCw className="w-4 h-4 text-blue-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <span className="text-[10px] font-black tracking-[0.15em] text-white/30">
            Round {round}/{TOTAL_ROUNDS}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Round progress dots */}
      <div className="absolute top-11 left-0 right-0 flex justify-center gap-1.5 py-1.5 z-10">
        {[...Array(TOTAL_ROUNDS)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-200"
            style={{ background: i < round - 1 ? "#10b981" : i === round - 1 ? "white" : "rgba(255,255,255,0.15)" }}
          />
        ))}
      </div>

      {/* Main game area */}
      <div className="absolute inset-0 flex items-center justify-center pt-12 pb-12 gap-8">

        {/* Target silhouette */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[9px] font-black tracking-[0.22em] uppercase text-white/30">Target</p>
          <div className="relative">
            <div className="w-28 h-28 rounded-xs flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg viewBox={shape.viewBox} width="90" height="90">
                <path d={shape.path}
                  fill="rgba(255,255,255,0.15)"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1.5"
                  transform={`rotate(${targetAngle})`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Accuracy temperature indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-1.5 h-20 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="w-full rounded-full"
              animate={{ height: `${warmth * 100}%` }}
              style={{
                background: warmth > 0.7 ? "#10b981" : warmth > 0.4 ? "#f59e0b" : "#ef4444",
                marginTop: `${(1 - warmth) * 100}%`,
              }}
            />
          </div>
          <p className="text-[8px] font-black tracking-widest uppercase"
            style={{ color: warmth > 0.7 ? "#10b981" : warmth > 0.4 ? "#f59e0b" : "#ef4444" }}
          >
            {diff < 5 ? "🔥" : diff < 15 ? "hot" : diff < 30 ? "warm" : "cold"}
          </p>
        </div>

        {/* Rotatable shape */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[9px] font-black tracking-[0.22em] uppercase text-white/30">Yours</p>
          <div
            className="w-28 h-28 rounded-xs flex items-center justify-center cursor-grab active:cursor-grabbing relative"
            style={{
              background: flash
                ? "rgba(16,185,129,0.15)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${flash ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.08)"}`,
              transition: "background 0.15s, border 0.15s",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <svg viewBox={shape.viewBox} width="90" height="90">
              <path d={shape.path}
                fill={`rgba(99,102,241,${0.3 + warmth * 0.4})`}
                stroke={warmth > 0.7 ? "#10b981" : warmth > 0.4 ? "#f59e0b" : "#6366f1"}
                strokeWidth="2"
                transform={`rotate(${currentAngle})`}
                style={{ filter: `drop-shadow(0 0 ${6 + warmth * 12}px ${warmth > 0.7 ? "#10b981" : "#6366f1"})` }}
              />
            </svg>
            <p className="absolute bottom-1 right-1.5 text-[9px] font-black text-white/25">
              {Math.round(currentAngle)}°
            </p>
          </div>
        </div>
      </div>

      {/* Lock in button + accuracy label */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-1 pb-3"
        style={{ background: "rgba(0,0,0,0.5)", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <AnimatePresence mode="wait">
          {lastAcc !== null ? (
            <motion.p key="acc" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="font-black text-sm tracking-widest uppercase"
              style={{ color: getAccLabel(lastAcc).color }}
            >
              {getAccLabel(lastAcc).text} — {Math.round(lastAcc * 100)}%
            </motion.p>
          ) : (
            <motion.button key="btn"
              onClick={lockIn}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-8 py-2 rounded-xs text-xs font-black text-black flex items-center gap-2"
              style={{ background: "#6366f1", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}
            >
              <CheckCircle className="w-4 h-4" />
              Lock In
            </motion.button>
          )}
        </AnimatePresence>
        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-white/20">
          Drag to rotate · {shape.name}
        </p>
      </div>

      {/* Done overlay */}
      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-blue-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">{TOTAL_ROUNDS} shapes matched</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isFlash && (
        <div className="absolute top-11 right-3 z-20 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse"
          style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fcd34d" }}
        >⚡ FLASH</div>
      )}
    </div>
  );
}