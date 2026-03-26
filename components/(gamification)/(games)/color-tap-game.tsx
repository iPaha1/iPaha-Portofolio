// =============================================================================
// GAME 10: COLOUR TAP — Stroop-effect colour matching challenge
// components/(gamification)/(games)/colour-tap-game.tsx
//
// Mechanic: A word (e.g. "RED") appears printed in a DIFFERENT colour ink
// (e.g. blue). Tap the swatch that matches the INK COLOUR, not the word.
// Classic Stroop effect — your brain wants to read the word, not see the ink.
// Wrong taps or timeouts cost a life. Speed bonus for fast correct answers.
// Difficulty increases every 4 correct: more colour choices, faster timer.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Trophy, Heart, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

interface Colour {
  name: string;
  hex:  string;
}

const COLOURS: Colour[] = [
  { name: "RED",    hex: "#ef4444" },
  { name: "BLUE",   hex: "#3b82f6" },
  { name: "GREEN",  hex: "#10b981" },
  { name: "YELLOW", hex: "#eab308" },
  { name: "PURPLE", hex: "#8b5cf6" },
  { name: "ORANGE", hex: "#f97316" },
  { name: "PINK",   hex: "#ec4899" },
  { name: "CYAN",   hex: "#06b6d4" },
];

function pickDistinct<T>(pool: T[], n: number, exclude?: T): T[] {
  const filtered = pool.filter(x => x !== exclude);
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

interface Round {
  word:     Colour;  // the text displayed
  inkColor: Colour;  // the actual ink/correct answer
  options:  Colour[];
}

function buildRound(numOptions: number, prev?: Colour): Round {
  const inkColor = prev
    ? COLOURS.filter(c => c !== prev)[Math.floor(Math.random() * (COLOURS.length - 1))]
    : COLOURS[Math.floor(Math.random() * COLOURS.length)];

  // word is a DIFFERENT colour name than the ink
  const word = COLOURS.filter(c => c !== inkColor)[Math.floor(Math.random() * (COLOURS.length - 1))];

  const distractors = pickDistinct(COLOURS, numOptions - 1, inkColor);
  const options = [...distractors, inkColor].sort(() => Math.random() - 0.5);

  return { word, inkColor, options };
}

export function ColourTapGame({
  gameId, rewardTokens, duration = 30, onComplete, isFlash = false,
}: GameProps) {
  const [round,      setRound]      = useState<Round>(() => buildRound(4));
  const [score,      setScore]      = useState(0);
  const [streak,     setStreak]     = useState(0);
  const [lives,      setLives]      = useState(3);
  const [correct,    setCorrect]    = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(duration);
  const [roundTimer, setRoundTimer] = useState(3.5);   // seconds per round
  const [flash,      setFlash]      = useState<"correct" | "wrong" | null>(null);
  const [done,       setDone]       = useState(false);
  const [level,      setLevel]      = useState(1);     // increases difficulty

  const livesRef   = useRef(3);
  const streakRef  = useRef(0);
  const scoreRef   = useRef(0);
  const correctRef = useRef(0);
  const doneRef    = useRef(false);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastInkRef = useRef<Colour | undefined>(undefined);

  const numOptions = Math.min(COLOURS.length, 4 + Math.floor((level - 1) / 2));
  const roundTime  = Math.max(1.5, 3.5 - (level - 1) * 0.25);

  const nextRound = useCallback((won: boolean) => {
    if (doneRef.current) return;
    if (roundIntervalRef.current) clearInterval(roundIntervalRef.current);
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);

    const newRound = buildRound(numOptions, lastInkRef.current);
    lastInkRef.current = newRound.inkColor;
    setRound(newRound);
    setRoundTimer(roundTime);

    // Start per-round countdown
    let t = roundTime;
    roundIntervalRef.current = setInterval(() => {
      t -= 0.1;
      setRoundTimer(Math.max(0, t));
      if (t <= 0) {
        clearInterval(roundIntervalRef.current!);
        if (!doneRef.current) handleTimeout();
      }
    }, 100);
  }, [numOptions, roundTime]);

  const handleTimeout = useCallback(() => {
    if (doneRef.current) return;
    streakRef.current = 0;
    setStreak(0);
    setFlash("wrong");
    livesRef.current -= 1;
    setLives(livesRef.current);
    setTimeout(() => {
      setFlash(null);
      if (livesRef.current <= 0) { doneRef.current = true; setDone(true); }
      else nextRound(false);
    }, 400);
  }, [nextRound]);

  // ── Game timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      if (doneRef.current) { clearInterval(t); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    // kick off first round timer
    lastInkRef.current = round.inkColor;
    nextRound(true);
    return () => {
      clearInterval(t);
      if (roundIntervalRef.current) clearInterval(roundIntervalRef.current);
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  // ── Level up every 4 correct ─────────────────────────────────────────────────
  useEffect(() => {
    if (correct > 0 && correct % 4 === 0) setLevel(l => Math.min(8, l + 1));
  }, [correct]);

  // ── Game over ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!done) return;
    if (roundIntervalRef.current) clearInterval(roundIntervalRef.current);
    const accuracy = correct / Math.max(1, correct + (3 - livesRef.current));
    const final    = Math.max(1, Math.round(rewardTokens * (0.3 + accuracy * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1400);
  }, [done]);

  const handlePick = (colour: Colour) => {
    if (done || flash !== null) return;
    if (roundIntervalRef.current) clearInterval(roundIntervalRef.current);

    if (colour.hex === round.inkColor.hex) {
      // Correct!
      streakRef.current += 1;
      setStreak(streakRef.current);
      const speedBonus  = Math.floor((roundTimer / roundTime) * 20);
      const streakBonus = streakRef.current >= 3 ? 10 : 0;
      const pts         = 30 + speedBonus + streakBonus;
      scoreRef.current  += pts;
      setScore(scoreRef.current);
      correctRef.current += 1;
      setCorrect(correctRef.current);
      setFlash("correct");
      setTimeout(() => { setFlash(null); nextRound(true); }, 300);
    } else {
      // Wrong
      streakRef.current = 0;
      setStreak(0);
      livesRef.current -= 1;
      setLives(livesRef.current);
      setFlash("wrong");
      setTimeout(() => {
        setFlash(null);
        if (livesRef.current <= 0) { doneRef.current = true; setDone(true); }
        else nextRound(false);
      }, 450);
    }
  };

  const bgColor =
    flash === "correct" ? "#052e16" :
    flash === "wrong"   ? "#3f0a0a" : "#0f172a";

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: bgColor, minHeight: 280, transition: "background 0.15s" }}>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Eye className="w-3.5 h-3.5 text-cyan-400" />{score}
          </div>
          {streak >= 2 && (
            <div className="text-xs font-black" style={{ color: "#f59e0b" }}>
              {streak}× streak!
            </div>
          )}
          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs"
            style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
            Lv.{level}
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
            style={{ color: timeLeft <= 8 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Round timer bar */}
      <div className="h-1 mx-0" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div
          className="h-full"
          animate={{ width: `${(roundTimer / roundTime) * 100}%` }}
          transition={{ duration: 0.1 }}
          style={{ background: roundTimer < 1 ? "#ef4444" : "#f59e0b", transition: "background 0.2s" }}
        />
      </div>

      {/* Instruction */}
      <div className="px-4 pt-5 pb-2 text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase mb-3"
          style={{ color: "rgba(255,255,255,0.28)" }}>
          Tap the ink colour, not the word
        </p>

        {/* The Stroop word */}
        <AnimatePresence mode="wait">
          <motion.div key={round.word.name + round.inkColor.hex}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "spring", damping: 18, stiffness: 300 }}
            className="font-black text-5xl tracking-tight select-none mb-6"
            style={{
              color: round.inkColor.hex,
              letterSpacing: "-0.04em",
              textShadow: `0 0 30px ${round.inkColor.hex}70`,
            }}>
            {round.word.name}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Colour swatches */}
      <div className="grid px-4 pb-4 gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(4, numOptions)}, 1fr)` }}>
        {round.options.map((c, i) => (
          <motion.button
            key={c.hex + i}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => handlePick(c)}
            className="rounded-xs py-3 font-black text-xs transition-all"
            style={{
              background: c.hex,
              border: "2px solid rgba(255,255,255,0.15)",
              boxShadow: `0 4px 16px ${c.hex}50`,
              color: "rgba(255,255,255,0.9)",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              letterSpacing: "0.05em",
            }}>
            {c.name}
          </motion.button>
        ))}
      </div>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {correct} correct · reached level {level}
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