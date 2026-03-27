// =============================================================================
// GAME 7: VAULT CRACKER — Crack the code before time runs out
// components/(gamification)/(games)/vault-cracker-game.tsx
//
// Concept: A 3-digit vault code is hidden. You have 4 guesses.
// Each guess shows HOT / WARM / COLD per digit (like Mastermind).
// Crack it = full reward. Each wasted guess = smaller reward.
// Fast crack = bonus multiplier.
// =============================================================================

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Timer, ChevronUp, ChevronDown } from "lucide-react";
import type { GameProps } from "./game-types";

const DIGITS = 3;
const MAX_GUESSES = 5;

type Hint = "exact" | "close" | "wrong"; // green / amber / gray

function generateCode(): number[] {
  return Array.from({ length: DIGITS }, () => Math.floor(Math.random() * 10));
}

function getHints(guess: number[], code: number[]): Hint[] {
  return guess.map((g, i) => {
    if (g === code[i]) return "exact";
    if (Math.abs(g - code[i]) <= 1) return "close";
    return "wrong";
  });
}

const HINT_COLORS: Record<Hint, { bg: string; border: string; label: string; text: string }> = {
  exact: { bg: "rgba(16,185,129,0.25)",  border: "#10b981", label: "✓",    text: "#6ee7b7" },
  close: { bg: "rgba(245,158,11,0.25)",  border: "#f59e0b", label: "~",    text: "#fcd34d" },
  wrong: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)", label: "✗", text: "rgba(255,255,255,0.3)" },
};

export function VaultCrackerGame({
  gameId,
  rewardTokens,
  duration = 25,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const [code]             = useState<number[]>(generateCode);
  const [currentGuess, setCurrentGuess] = useState<number[]>(Array(DIGITS).fill(0));
  const [guesses, setGuesses]           = useState<{ digits: number[]; hints: Hint[] }[]>([]);
  const [phase, setPhase]               = useState<"playing" | "cracked" | "failed">("playing");
  const [timeLeft, setTimeLeft]         = useState(duration);
  const [shake, setShake]               = useState(false);
  const startTime = useRef(Date.now());

  const playSound = useCallback((t: "click" | "win" | "wrong" | "lose") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const map = { click: [440, 0.08], win: [880, 0.4], wrong: [180, 0.3], lose: [110, 0.5] };
      osc.frequency.value = (map[t] as number[])[0];
      osc.type = t === "win" ? "sine" : t === "click" ? "triangle" : "sawtooth";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (map[t] as number[])[1]);
      osc.start(); osc.stop(ctx.currentTime + (map[t] as number[])[1]);
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) {
        clearInterval(t);
        if (phase === "playing") {
          setPhase("failed");
          const base = Math.floor(rewardTokens * 0.2);
          setTimeout(() => onComplete(base, 0), 1500);
        }
        return 0;
      }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const adjustDigit = (idx: number, delta: number) => {
    if (phase !== "playing") return;
    playSound("click");
    setCurrentGuess(g => g.map((d, i) => i === idx ? (d + delta + 10) % 10 : d));
  };

  const submitGuess = () => {
    if (phase !== "playing") return;
    const hints = getHints(currentGuess, code);
    const newGuesses = [...guesses, { digits: [...currentGuess], hints }];
    setGuesses(newGuesses);

    const cracked = hints.every(h => h === "exact");
    if (cracked) {
      playSound("win");
      setPhase("cracked");
      const elapsed = (Date.now() - startTime.current) / 1000;
      const speedBonus = elapsed < 8 ? 1.5 : elapsed < 14 ? 1.2 : 1;
      const guessBonus = (MAX_GUESSES - newGuesses.length + 1) / MAX_GUESSES;
      const reward = Math.min(Math.floor(rewardTokens * speedBonus * (0.6 + guessBonus * 0.8)), rewardTokens * 2);
      setTimeout(() => onComplete(reward, Math.floor(guessBonus * 100)), 1800);
    } else if (newGuesses.length >= MAX_GUESSES) {
      playSound("lose");
      setPhase("failed");
      setTimeout(() => onComplete(Math.floor(rewardTokens * 0.1), 0), 1800);
    } else {
      const allWrong = hints.every(h => h === "wrong");
      if (allWrong) { playSound("wrong"); setShake(true); setTimeout(() => setShake(false), 500); }
      else playSound("click");
    }
  };

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0a0f0a 0%,#0f1a0f 60%,#080f14 100%)" }}
    >
      {/* Stats */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-3">
          {phase === "cracked"
            ? <Unlock className="w-4 h-4 text-emerald-400" />
            : <Lock className="w-4 h-4 text-amber-400" />
          }
          <span className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: phase === "cracked" ? "#10b981" : "rgba(255,255,255,0.4)" }}
          >
            {phase === "cracked" ? "Vault open" : `${MAX_GUESSES - guesses.length} guesses left`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      <div className="absolute inset-0 pt-12 flex flex-col items-center justify-center gap-3 px-6">

        {/* Past guesses */}
        <div className="w-full space-y-1.5 mb-2 max-h-32 overflow-hidden">
          {guesses.map((g, gi) => (
            <motion.div
              key={gi}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-center gap-3"
            >
              {g.digits.map((d, di) => (
                <div key={di} className="w-11 h-10 rounded-xs flex flex-col items-center justify-center"
                  style={{
                    background: HINT_COLORS[g.hints[di]].bg,
                    border: `1px solid ${HINT_COLORS[g.hints[di]].border}`,
                  }}
                >
                  <span className="text-white font-black text-base leading-none">{d}</span>
                  <span className="text-[9px] font-black leading-none mt-0.5" style={{ color: HINT_COLORS[g.hints[di]].text }}>
                    {HINT_COLORS[g.hints[di]].label}
                  </span>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Current input */}
        {phase === "playing" && (
          <motion.div
            animate={shake ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex gap-3"
          >
            {currentGuess.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <button onClick={() => adjustDigit(i, 1)}
                  className="w-11 h-7 rounded-xs flex items-center justify-center transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <ChevronUp className="w-4 h-4 text-white/50" />
                </button>
                <div className="w-11 h-12 rounded-xs flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.12)", border: "2px solid rgba(245,158,11,0.5)" }}
                >
                  <span className="text-white font-black text-2xl" style={{ letterSpacing: "-0.03em" }}>{d}</span>
                </div>
                <button onClick={() => adjustDigit(i, -1)}
                  className="w-11 h-7 rounded-xs flex items-center justify-center transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <ChevronDown className="w-4 h-4 text-white/50" />
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Submit */}
        {phase === "playing" && (
          <motion.button
            onClick={submitGuess}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-2.5 rounded-xs text-sm font-black text-black mt-1"
            style={{ background: "#f59e0b", boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}
          >
            Submit Guess
          </motion.button>
        )}

        {/* Legend */}
        <div className="flex gap-4 text-[10px] font-bold mt-1">
          {(["exact", "close", "wrong"] as Hint[]).map(h => (
            <div key={h} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-xs" style={{ background: HINT_COLORS[h].bg, border: `1px solid ${HINT_COLORS[h].border}` }} />
              <span style={{ color: "rgba(255,255,255,0.35)" }}>
                {h === "exact" ? "Correct" : h === "close" ? "±1 off" : "Far off"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* End overlay */}
      <AnimatePresence>
        {(phase === "cracked" || phase === "failed") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              {phase === "cracked"
                ? <Unlock className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
                : <Lock className="w-14 h-14 text-red-400 mx-auto mb-3" />
              }
              <p className="text-3xl font-black text-white mb-2" style={{ letterSpacing: "-0.04em" }}>
                {phase === "cracked" ? "Vault open!" : `Code: ${code.join("")}`}
              </p>
              <p className="text-white/40 text-sm">
                {phase === "cracked" ? `Cracked in ${guesses.length} guess${guesses.length !== 1 ? "es" : ""}` : "Better luck next time"}
              </p>
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