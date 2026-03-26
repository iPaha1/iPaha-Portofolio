// =============================================================================
// GAME 13: MATH BLITZ — Lightning-fast mental arithmetic under pressure
// components/(gamification)/(games)/math-blitz-game.tsx
//
// Mechanic: An equation appears (e.g. "7 × 8 = ?"). Four answer tiles shown.
// Pick the right one before the circular timer expires. Correct = +pts & speed
// bonus. Wrong or timeout = -1 life. Difficulty escalates: starts with easy
// addition/subtraction, progresses to multiplication, division, and two-step
// expressions. Chain of correct answers awards combo multiplier.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Trophy, Heart, Zap, Brain } from "lucide-react";
import type { GameProps } from "./game-types";

type Op = "+" | "-" | "×" | "÷";

interface Question {
  display: string;
  answer:  number;
  options: number[];
  difficulty: number;  // 1-5
  timeLimit:  number;  // seconds
}

// ── Question generator ────────────────────────────────────────────────────────
function generateQuestion(level: number): Question {
  const difficulty = Math.min(5, Math.ceil(level / 3));
  let a: number, b: number, op: Op, answer: number, display: string, timeLimit: number;

  if (difficulty <= 1) {
    // Easy: add/sub within 20
    op  = Math.random() < 0.5 ? "+" : "-";
    a   = Math.floor(Math.random() * 15) + 2;
    b   = op === "-" ? Math.floor(Math.random() * a) + 1 : Math.floor(Math.random() * 15) + 1;
    answer   = op === "+" ? a + b : a - b;
    display  = `${a} ${op} ${b}`;
    timeLimit = 4;
  } else if (difficulty === 2) {
    // Medium: add/sub within 50 + easy ×
    const ops: Op[] = ["+", "-", "×"];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (op === "×") {
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 8) + 2;
      answer = a * b;
    } else {
      a = Math.floor(Math.random() * 40) + 5;
      b = op === "-" ? Math.floor(Math.random() * a) + 1 : Math.floor(Math.random() * 40) + 1;
      answer = op === "+" ? a + b : a - b;
    }
    display   = `${a} ${op} ${b}`;
    timeLimit  = 3.5;
  } else if (difficulty === 3) {
    // Harder: bigger ×, simple ÷
    op  = Math.random() < 0.5 ? "×" : "÷";
    if (op === "×") {
      a = Math.floor(Math.random() * 10) + 3;
      b = Math.floor(Math.random() * 10) + 3;
      answer = a * b;
    } else {
      b = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 10) + 2;
      a = b * answer;
    }
    display   = `${a} ${op} ${b}`;
    timeLimit  = 3;
  } else if (difficulty === 4) {
    // Two-step: (a + b) × c
    a = Math.floor(Math.random() * 8) + 1;
    b = Math.floor(Math.random() * 8) + 1;
    const c = Math.floor(Math.random() * 6) + 2;
    answer   = (a + b) * c;
    display  = `(${a} + ${b}) × ${c}`;
    timeLimit = 4;
  } else {
    // Hard: square, bigger products
    if (Math.random() < 0.4) {
      a       = Math.floor(Math.random() * 12) + 3;
      answer  = a * a;
      display = `${a}²`;
    } else {
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * 12) + 3;
      answer  = a * b;
      display = `${a} × ${b}`;
    }
    timeLimit = 3.5;
  }

  // Generate 3 wrong options close to answer
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const delta = Math.floor(Math.random() * 8) + 1;
    const wrong = Math.random() < 0.5 ? answer + delta : answer - delta;
    if (wrong !== answer && wrong >= 0) wrongs.add(wrong);
  }
  const options = [...wrongs, answer].sort(() => Math.random() - 0.5);

  return { display, answer, options, difficulty, timeLimit };
}

// ── Difficulty colours ────────────────────────────────────────────────────────
const DIFF_COLOR = ["#10b981","#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6"];
const DIFF_LABEL = ["","Easy","Medium","Hard","Expert","Master"];

export function MathBlitzGame({
  gameId, rewardTokens, duration = 35, onComplete, isFlash = false,
}: GameProps) {
  const [question,   setQuestion]   = useState<Question>(() => generateQuestion(1));
  const [selected,   setSelected]   = useState<number | null>(null);
  const [flash,      setFlash]      = useState<"correct"|"wrong"|null>(null);
  const [lives,      setLives]      = useState(3);
  const [streak,     setStreak]     = useState(0);
  const [score,      setScore]      = useState(0);
  const [correct,    setCorrect]    = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(duration);
  const [roundTime,  setRoundTime]  = useState(4);
  const [done,       setDone]       = useState(false);
  const [level,      setLevel]      = useState(1);

  const livesRef   = useRef(3);
  const streakRef  = useRef(0);
  const scoreRef   = useRef(0);
  const correctRef = useRef(0);
  const levelRef   = useRef(1);
  const doneRef    = useRef(false);
  const roundInterval = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const locked     = useRef(false);

  const nextQuestion = useCallback(() => {
    if (doneRef.current) return;
    locked.current = false;
    setSelected(null);
    setFlash(null);
    levelRef.current += 1;
    setLevel(levelRef.current);
    const q = generateQuestion(levelRef.current);
    setQuestion(q);
    setRoundTime(q.timeLimit);
    startRoundTimer(q.timeLimit);
  }, []);

  const handleTimeout = useCallback(() => {
    if (doneRef.current || locked.current) return;
    locked.current = true;
    streakRef.current = 0;
    setStreak(0);
    livesRef.current -= 1;
    setLives(livesRef.current);
    setFlash("wrong");
    if (livesRef.current <= 0) { doneRef.current = true; setTimeout(() => setDone(true), 400); return; }
    setTimeout(nextQuestion, 600);
  }, [nextQuestion]);

  const startRoundTimer = (limit: number) => {
    if (roundInterval.current) clearInterval(roundInterval.current);
    let t = limit;
    setRoundTime(limit);
    roundInterval.current = setInterval(() => {
      t -= 0.05;
      setRoundTime(Math.max(0, t));
      if (t <= 0) {
        clearInterval(roundInterval.current!);
        handleTimeout();
      }
    }, 50);
  };

  // Game timer
  useEffect(() => {
    const t = setInterval(() => {
      if (doneRef.current) { clearInterval(t); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    startRoundTimer(question.timeLimit);
    return () => {
      clearInterval(t);
      if (roundInterval.current) clearInterval(roundInterval.current);
    };
  }, []);

  // Game over
  useEffect(() => {
    if (!done) return;
    if (roundInterval.current) clearInterval(roundInterval.current);
    const acc   = correctRef.current / Math.max(1, correctRef.current + (3 - livesRef.current));
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + acc * 1.7 + Math.min(1, levelRef.current / 15) * 0.5)));
    setTimeout(() => onComplete(final, scoreRef.current), 1400);
  }, [done]);

  const handleAnswer = (val: number) => {
    if (done || locked.current || flash !== null) return;
    locked.current = true;
    if (roundInterval.current) clearInterval(roundInterval.current);
    setSelected(val);

    if (val === question.answer) {
      streakRef.current += 1;
      setStreak(streakRef.current);
      const speedBonus  = Math.floor((roundTime / question.timeLimit) * 30);
      const comboBonus  = streakRef.current >= 3 ? streakRef.current * 5 : 0;
      const diffBonus   = question.difficulty * 10;
      const pts         = 20 + diffBonus + speedBonus + comboBonus;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      correctRef.current += 1;
      setCorrect(correctRef.current);
      setFlash("correct");
      setTimeout(nextQuestion, 400);
    } else {
      streakRef.current = 0;
      setStreak(0);
      livesRef.current -= 1;
      setLives(livesRef.current);
      setFlash("wrong");
      if (livesRef.current <= 0) { doneRef.current = true; setTimeout(() => setDone(true), 500); return; }
      setTimeout(nextQuestion, 600);
    }
  };

  const diffColor = DIFF_COLOR[question.difficulty] || "#10b981";
  const progress  = roundTime / question.timeLimit;
  const timerColor = progress > 0.5 ? "#10b981" : progress > 0.25 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 22;

  const bgColor =
    flash === "correct" ? "#052e16" :
    flash === "wrong"   ? "#3f0a0a" : "#0f172a";

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: bgColor, minHeight: 290, transition: "background 0.12s" }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Calculator className="w-3.5 h-3.5 text-indigo-400" />{score}
          </div>
          {streak >= 2 && (
            <div className="text-xs font-black" style={{ color: "#f59e0b" }}>{streak}× streak!</div>
          )}
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: `${diffColor}20`, color: diffColor, border: `1px solid ${diffColor}40` }}>
            {DIFF_LABEL[question.difficulty]}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full transition-all"
                style={{ background: i < lives ? "#ef4444" : "rgba(255,255,255,0.12)", boxShadow: i < lives ? "0 0 6px #ef4444" : "none" }} />
            ))}
          </div>
          <div className="font-black text-base tabular-nums"
            style={{ color: timeLeft <= 8 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Equation + circular timer */}
      <div className="flex flex-col items-center pt-4 pb-2 gap-3 px-4">
        <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
          <svg className="absolute inset-0 -rotate-90" width="64" height="64" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <motion.circle
              cx="24" cy="24" r="22"
              fill="none"
              stroke={timerColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 0.05 }}
            />
          </svg>
          <Brain className="w-6 h-6" style={{ color: timerColor }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={question.display}
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="text-center">
            <p className="text-4xl font-black text-white" style={{ letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
              {question.display} = <span style={{ color: diffColor }}>?</span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Answer grid */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
        {question.options.map((opt, i) => {
          const isSelected = selected === opt;
          const isCorrect  = opt === question.answer;
          const showResult = flash !== null && isSelected;

          return (
            <motion.button
              key={`${question.display}-${i}`}
              whileHover={!locked.current ? { scale: 1.03 } : {}}
              whileTap={!locked.current ? { scale: 0.96 } : {}}
              onClick={() => handleAnswer(opt)}
              disabled={!!flash || done}
              className="py-4 rounded-xs font-black text-xl tabular-nums transition-all"
              style={{
                background: showResult
                  ? flash === "correct" && isCorrect ? "rgba(16,185,129,0.3)"
                  : flash === "wrong" && isSelected ? "rgba(239,68,68,0.3)"
                  : "rgba(255,255,255,0.06)"
                  : flash !== null && isCorrect ? "rgba(16,185,129,0.2)"
                  : "rgba(255,255,255,0.06)",
                border: showResult
                  ? flash === "correct" ? "2px solid #10b981"
                  : "2px solid #ef4444"
                  : flash !== null && isCorrect ? "1px solid rgba(16,185,129,0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
                color: showResult
                  ? flash === "correct" ? "#6ee7b7" : "#fca5a5"
                  : "#fff",
                boxShadow: showResult && flash === "correct" ? "0 0 20px rgba(16,185,129,0.3)" : "none",
                letterSpacing: "-0.03em",
              }}>
              {opt}
            </motion.button>
          );
        })}
      </div>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)" }}>
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