// =============================================================================
// GAME 9: NUMBER PULSE — Simon-style number sequence memory game
// components/(gamification)/(games)/number-pulse-game.tsx
//
// Mechanic: A grid of numbered tiles lights up in a sequence. Watch the pattern,
// then click the tiles in the SAME order. Each correct round adds one more step.
// Get it wrong = lose a life. Longer sequences = massive score multiplier.
// Works equally well on touch and mouse.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, Heart, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const GRID = 9; // 3×3
const TILE_COLORS = [
  "#ef4444", "#f97316", "#eab308",
  "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f59e0b",
];

type Phase = "watching" | "input" | "wrong" | "correct" | "done";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function NumberPulseGame({
  gameId, rewardTokens, duration = 45, onComplete, isFlash = false,
}: GameProps) {
  const [sequence,   setSequence]   = useState<number[]>([]);
  const [input,      setInput]      = useState<number[]>([]);
  const [phase,      setPhase]      = useState<Phase>("watching");
  const [activeIdx,  setActiveIdx]  = useState<number | null>(null);  // tile being shown
  const [litTiles,   setLitTiles]   = useState<Set<number>>(new Set());
  const [wrongTile,  setWrongTile]  = useState<number | null>(null);
  const [lives,      setLives]      = useState(3);
  const [round,      setRound]      = useState(1);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(duration);
  const [done,       setDone]       = useState(false);
  const [message,    setMessage]    = useState("Watch the sequence…");

  const livesRef   = useRef(3);
  const roundRef   = useRef(1);
  const scoreRef   = useRef(0);
  const seqRef     = useRef<number[]>([]);
  const inputRef   = useRef<number[]>([]);
  const doneRef    = useRef(false);
  const showTimer  = useRef<NodeJS.Timeout | null>(null);

  // ── Build and replay sequence ─────────────────────────────────────────────────
  const playSequence = useCallback((seq: number[]) => {
    setPhase("watching");
    setMessage("Watch the sequence…");
    setInput([]);
    inputRef.current = [];

    let i = 0;
    const step = () => {
      if (doneRef.current) return;
      if (i >= seq.length) {
        // Finished playing — switch to input phase
        setTimeout(() => {
          if (!doneRef.current) {
            setActiveIdx(null);
            setPhase("input");
            setMessage(`Your turn! ${seq.length} tap${seq.length > 1 ? "s" : ""}`);
          }
        }, 400);
        return;
      }
      setActiveIdx(seq[i]);
      setTimeout(() => {
        setActiveIdx(null);
        i++;
        const gap = Math.max(150, 500 - roundRef.current * 20);
        showTimer.current = setTimeout(step, gap);
      }, Math.max(300, 600 - roundRef.current * 15));
    };
    showTimer.current = setTimeout(step, 700);
  }, []);

  const startRound = useCallback((seq: number[]) => {
    seqRef.current = seq;
    setSequence(seq);
    playSequence(seq);
  }, [playSequence]);

  // ── Init first round ─────────────────────────────────────────────────────────
  useEffect(() => {
    const initialSeq = [Math.floor(Math.random() * GRID)];
    startRound(initialSeq);
  }, []);

  // ── Game timer ───────────────────────────────────────────────────────────────
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

  // ── Game over ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!done) return;
    if (showTimer.current) clearTimeout(showTimer.current);
    const perfect    = livesRef.current === 3;
    const efficiency = Math.min(1, roundRef.current / 10);
    const final      = Math.max(1, Math.round(rewardTokens * (0.4 + efficiency * 2 + (perfect ? 0.5 : 0))));
    setTimeout(() => onComplete(final, scoreRef.current), 1400);
  }, [done]);

  // ── Handle tile tap ───────────────────────────────────────────────────────────
  const handleTile = useCallback((idx: number) => {
    if (phase !== "input" || doneRef.current) return;

    const newInput = [...inputRef.current, idx];
    inputRef.current = newInput;
    setInput(newInput);

    const pos     = newInput.length - 1;
    const correct = seqRef.current[pos];

    if (idx !== correct) {
      // Wrong
      setWrongTile(idx);
      setPhase("wrong");
      setMessage("Wrong! -1 life");
      livesRef.current -= 1;
      setLives(livesRef.current);

      setTimeout(() => {
        setWrongTile(null);
        if (livesRef.current <= 0) { doneRef.current = true; setDone(true); return; }
        // Replay same sequence
        inputRef.current = [];
        startRound(seqRef.current);
      }, 900);
      return;
    }

    // Correct so far
    setLitTiles(prev => new Set([...prev, idx]));
    setTimeout(() => setLitTiles(prev => { const n = new Set(prev); n.delete(idx); return n; }), 250);

    if (newInput.length === seqRef.current.length) {
      // Completed round!
      const pts = seqRef.current.length * 50 + roundRef.current * 10;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      roundRef.current += 1;
      setRound(roundRef.current);
      setPhase("correct");
      setMessage(`+${pts} pts! Round ${roundRef.current}`);

      setTimeout(() => {
        if (doneRef.current) return;
        const next = [...seqRef.current, Math.floor(Math.random() * GRID)];
        inputRef.current = [];
        startRound(next);
      }, 900);
    }
  }, [phase, startRound]);

  const phaseColor =
    phase === "wrong"   ? "#ef4444" :
    phase === "correct" ? "#10b981" :
    phase === "input"   ? "#f59e0b" : "#8b5cf6";

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)", minHeight: 280 }}>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Brain className="w-3.5 h-3.5 text-violet-400" />{score}
          </div>
          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs"
            style={{ background: `${phaseColor}20`, color: phaseColor, border: `1px solid ${phaseColor}40` }}>
            Round {round} · {seqRef.current.length || 1} tiles
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full transition-all"
                style={{ background: i < lives ? "#ef4444" : "rgba(255,255,255,0.12)", boxShadow: i < lives ? "0 0 6px #ef4444" : "none" }} />
            ))}
          </div>
          <div className="font-black text-lg tabular-nums"
            style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="px-3 py-2 text-center">
        <motion.p key={message} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs font-bold" style={{ color: phaseColor }}>
          {message}
        </motion.p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {Array.from({ length: GRID }).map((_, idx) => {
          const color    = TILE_COLORS[idx];
          const isActive = activeIdx === idx;
          const isLit    = litTiles.has(idx);
          const isWrong  = wrongTile === idx;
          const isInInput = input.includes(idx) && phase === "input";

          return (
            <motion.button
              key={idx}
              onClick={() => handleTile(idx)}
              animate={isActive
                ? { scale: 1.1, boxShadow: `0 0 30px ${color}` }
                : isWrong
                ? { scale: 0.92, x: [-3, 3, -3, 3, 0] }
                : { scale: isLit ? 1.05 : 1 }
              }
              transition={isWrong ? { duration: 0.35 } : { type: "spring", damping: 16, stiffness: 300 }}
              disabled={phase !== "input"}
              className="relative aspect-square rounded-xs flex items-center justify-center"
              style={{
                background: isActive
                  ? `radial-gradient(circle at 35% 30%, ${color}cc, ${color}88)`
                  : isWrong
                  ? "rgba(239,68,68,0.4)"
                  : isLit
                  ? `${color}30`
                  : "rgba(255,255,255,0.06)",
                border: isActive
                  ? `2px solid ${color}`
                  : isWrong
                  ? "2px solid #ef4444"
                  : `1px solid ${phase === "input" ? `${color}40` : "rgba(255,255,255,0.08)"}`,
                boxShadow: isActive ? `0 0 24px ${color}80` : "none",
                cursor: phase === "input" ? "pointer" : "default",
                transition: "background 0.15s, border 0.15s",
              }}
            >
              <span className="text-xl font-black tabular-nums"
                style={{ color: isActive ? "white" : isWrong ? "#ef4444" : `${color}80` }}>
                {idx + 1}
              </span>
              {/* Sequence position indicator */}
              {phase === "input" && seqRef.current.includes(idx) && !input.includes(idx) && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: `${color}60` }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Progress bar — shows how far through input */}
      {phase === "input" && seqRef.current.length > 0 && (
        <div className="mx-4 mb-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${(input.length / seqRef.current.length) * 100}%` }}
            style={{ background: phaseColor }}
          />
        </div>
      )}

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>
            {round - 1} round{round - 1 !== 1 ? "s" : ""}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {score} pts · best sequence: {seqRef.current.length} tiles
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