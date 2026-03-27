// =============================================================================
// GAME 6: SEQUENCE MEMORY — Watch the pattern, repeat it perfectly
// components/(gamification)/(games)/sequence-memory-game.tsx
//
// Concept: 6 coloured orbs. A sequence lights up. Repeat it in order.
// Each correct round adds one more step. Longer streak = exponential reward.
// Beautiful glow flashes per orb. Wrong tap = immediate game over.
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const ORBS = [
  { id: 0, color: "#ef4444", glow: "rgba(239,68,68,0.8)",  label: "R" },
  { id: 1, color: "#f59e0b", glow: "rgba(245,158,11,0.8)", label: "Y" },
  { id: 2, color: "#10b981", glow: "rgba(16,185,129,0.8)", label: "G" },
  { id: 3, color: "#3b82f6", glow: "rgba(59,130,246,0.8)", label: "B" },
  { id: 4, color: "#8b5cf6", glow: "rgba(139,92,246,0.8)", label: "P" },
  { id: 5, color: "#ec4899", glow: "rgba(236,72,153,0.8)", label: "K" },
];

type Phase = "showing" | "input" | "correct" | "wrong" | "gameover" | "win";

export function SequenceMemoryGame({
  gameId,
  rewardTokens,
  duration = 30,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const [sequence, setSequence]       = useState<number[]>([]);
  const [userInput, setUserInput]     = useState<number[]>([]);
  const [phase, setPhase]             = useState<Phase>("showing");
  const [litOrb, setLitOrb]           = useState<number | null>(null);
  const [round, setRound]             = useState(1);
  const [score, setScore]             = useState(0);
  const [timeLeft, setTimeLeft]       = useState(duration);
  const [wrongOrb, setWrongOrb]       = useState<number | null>(null);
  const [message, setMessage]         = useState("Watch carefully...");

  const scoreRef  = useRef(0);
  const timerRef  = useRef<NodeJS.Timeout | null>(null);

  const playTone = useCallback((orbId: number | null, wrong = false) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const freqs = [261, 329, 392, 523, 659, 784];
      osc.frequency.value = wrong ? 110 : (orbId !== null ? freqs[orbId] : 440);
      osc.type = wrong ? "sawtooth" : "sine";
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (wrong ? 0.5 : 0.22));
      osc.start(); osc.stop(ctx.currentTime + (wrong ? 0.5 : 0.22));
    } catch {}
  }, [soundEnabled]);

  const endGame = useCallback((won: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase(won ? "win" : "gameover");
    const base = Math.floor(rewardTokens * (scoreRef.current / 50 + 0.4));
    const bonus = won ? Math.floor(rewardTokens * 0.5) : 0;
    setTimeout(() => onComplete(Math.min(base + bonus, rewardTokens * 2), scoreRef.current), 1800);
  }, [rewardTokens, onComplete]);

  // Show the sequence with delays
  const showSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    setMessage("Watch carefully...");
    setUserInput([]);
    let delay = 600;
    seq.forEach((orbId, i) => {
      setTimeout(() => {
        setLitOrb(orbId);
        playTone(orbId);
      }, delay + i * 700);
      setTimeout(() => {
        setLitOrb(null);
      }, delay + i * 700 + 400);
    });
    setTimeout(() => {
      setPhase("input");
      setMessage("Your turn!");
    }, delay + seq.length * 700 + 200);
  }, [playTone]);

  // Start first round
  useEffect(() => {
    const first = [Math.floor(Math.random() * ORBS.length)];
    setSequence(first);
    showSequence(first);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { endGame(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleOrbClick = (orbId: number) => {
    if (phase !== "input") return;
    playTone(orbId);
    const newInput = [...userInput, orbId];
    const step = newInput.length - 1;

    if (newInput[step] !== sequence[step]) {
      // Wrong!
      setWrongOrb(orbId);
      playTone(orbId, true);
      setTimeout(() => setWrongOrb(null), 600);
      setMessage("Wrong! Game over.");
      endGame(false);
      return;
    }

    setUserInput(newInput);
    setLitOrb(orbId);
    setTimeout(() => setLitOrb(null), 200);

    if (newInput.length === sequence.length) {
      // Correct full sequence
      const pts = sequence.length * 10;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setPhase("correct");
      setMessage(`+${pts} — Round ${round + 1}!`);

      if (round >= 10) { endGame(true); return; }

      setTimeout(() => {
        const next = [...sequence, Math.floor(Math.random() * ORBS.length)];
        setSequence(next);
        setRound(r => r + 1);
        showSequence(next);
      }, 900);
    }
  };

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0a0a14 0%,#12082a 60%,#080a18 100%)" }}
    >
      {/* Stats */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-white/40">Round</span>
            <span className="text-white font-black text-sm">{round}/10</span>
          </div>
        </div>
        <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
      </div>

      {/* Sequence length indicator */}
      <div className="absolute top-11 left-0 right-0 flex justify-center gap-1 py-1 z-10">
        {sequence.map((_, i) => (
          <div key={i} className="w-2 h-1 rounded-full transition-all duration-200"
            style={{ background: i < userInput.length ? "#10b981" : "rgba(255,255,255,0.15)" }}
          />
        ))}
      </div>

      {/* Message */}
      <div className="absolute top-16 left-0 right-0 text-center z-10">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-black"
          style={{ color: phase === "input" ? "#10b981" : phase === "correct" ? "#f59e0b" : "rgba(255,255,255,0.45)" }}
        >
          {message}
        </motion.p>
      </div>

      {/* Orb grid — 2 rows of 3 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-4 px-8">
          {ORBS.map(orb => {
            const isLit  = litOrb === orb.id;
            const isWrong = wrongOrb === orb.id;
            return (
              <motion.button
                key={orb.id}
                onClick={() => handleOrbClick(orb.id)}
                whileTap={phase === "input" ? { scale: 0.88 } : {}}
                animate={isWrong ? { x: [0, -8, 8, -6, 6, 0] } : {}}
                transition={isWrong ? { duration: 0.3 } : {}}
                className="rounded-full flex items-center justify-center font-black text-sm cursor-pointer"
                style={{
                  width: "72px",
                  height: "72px",
                  background: isLit || isWrong
                    ? orb.color
                    : `${orb.color}22`,
                  border: `2px solid ${isLit ? orb.color : `${orb.color}50`}`,
                  boxShadow: isLit
                    ? `0 0 28px ${orb.glow}, 0 0 60px ${orb.glow}50`
                    : "none",
                  color: isLit ? "rgba(0,0,0,0.8)" : `${orb.color}90`,
                  transition: "all 0.1s",
                  opacity: phase === "showing" ? 0.85 : 1,
                  cursor: phase === "input" ? "pointer" : "default",
                }}
              >
                {orb.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Game over overlay */}
      <AnimatePresence>
        {(phase === "gameover" || phase === "win") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className={`w-14 h-14 mx-auto mb-3 ${phase === "win" ? "text-amber-400" : "text-purple-400"}`} />
              <p className="text-3xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">{round - 1} rounds completed</p>
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