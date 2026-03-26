// =============================================================================
// GAME 7: SPEED TYPER — Type the glowing word before it expires
// components/(gamification)/(games)/speed-typer-game.tsx
//
// Mechanic: A word appears on screen. Type it correctly to score. The faster
// you type and the rarer the word, the more points. Miss or let it expire and
// you lose a life (3 lives total). Difficulty ramps every 3 correct words.
// Works on desktop with physical keyboard and on mobile with a large input.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, Trophy, Heart, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

// ── Word banks by difficulty ──────────────────────────────────────────────────
const WORDS_EASY   = ["code", "fast", "earn", "play", "jump", "zap", "win", "hit", "run", "ace", "top", "go", "max", "fly", "log"];
const WORDS_MEDIUM = ["token", "crypto", "build", "stack", "score", "combo", "swift", "sharp", "quest", "bonus", "glitch", "pixel", "forge", "turbo", "spark"];
const WORDS_HARD   = ["velocity", "sequence", "momentum", "algorithm", "legendary", "precision", "shortcut", "blazing", "infinite", "unstoppable"];
const WORDS_EPIC   = ["ultraspeed", "powerhouse", "multiplier", "hyperfocus", "chromatic"];

type Difficulty = "easy" | "medium" | "hard" | "epic";

const WORD_CFG: Record<Difficulty, { words: string[]; timePerChar: number; pts: number; color: string; glow: string; label: string }> = {
  easy:   { words: WORDS_EASY,   timePerChar: 600,  pts: 10,  color: "#10b981", glow: "#10b98170", label: "Easy"   },
  medium: { words: WORDS_MEDIUM, timePerChar: 480,  pts: 20,  color: "#3b82f6", glow: "#3b82f670", label: "Medium" },
  hard:   { words: WORDS_HARD,   timePerChar: 380,  pts: 40,  color: "#f59e0b", glow: "#f59e0b70", label: "Hard"   },
  epic:   { words: WORDS_EPIC,   timePerChar: 300,  pts: 80,  color: "#ef4444", glow: "#ef444470", label: "EPIC!"  },
};

function getDifficulty(streak: number): Difficulty {
  if (streak >= 9)  return "epic";
  if (streak >= 6)  return "hard";
  if (streak >= 3)  return "medium";
  return "easy";
}

function pickWord(diff: Difficulty, used: Set<string>): string {
  const pool    = WORD_CFG[diff].words.filter(w => !used.has(w));
  const source  = pool.length > 0 ? pool : WORD_CFG[diff].words;
  return source[Math.floor(Math.random() * source.length)];
}

const MAX_LIVES = 3;

export function SpeedTyperGame({
  gameId, rewardTokens, duration = 35, onComplete, isFlash = false,
}: GameProps) {
  const [currentWord, setCurrentWord] = useState("");
  const [difficulty,  setDifficulty]  = useState<Difficulty>("easy");
  const [typed,       setTyped]       = useState("");
  const [score,       setScore]       = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [lives,       setLives]       = useState(MAX_LIVES);
  const [timeLeft,    setTimeLeft]    = useState(duration);
  const [wordTimer,   setWordTimer]   = useState(0);
  const [wordMax,     setWordMax]     = useState(0);
  const [done,        setDone]        = useState(false);
  const [flash,       setFlash]       = useState<"correct" | "wrong" | null>(null);
  const [wordsTyped,  setWordsTyped]  = useState(0);
  const [usedWords,   setUsedWords]   = useState(new Set<string>());

  const inputRef      = useRef<HTMLInputElement>(null);
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef  = useRef<NodeJS.Timeout | null>(null);
  const livesRef      = useRef(MAX_LIVES);
  const streakRef     = useRef(0);
  const scoreRef      = useRef(0);

  const startNewWord = useCallback((currentStreak: number, used: Set<string>) => {
    const diff     = getDifficulty(currentStreak);
    const cfg      = WORD_CFG[diff];
    const word     = pickWord(diff, used);
    const timeAllowed = Math.max(2000, word.length * cfg.timePerChar);

    setCurrentWord(word);
    setDifficulty(diff);
    setTyped("");
    setWordMax(timeAllowed);
    setWordTimer(timeAllowed);

    if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
    wordIntervalRef.current = setInterval(() => {
      setWordTimer(prev => {
        if (prev <= 100) {
          clearInterval(wordIntervalRef.current!);
          // Word expired — lose a life
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            setDone(true);
            return 0;
          }
          streakRef.current = 0;
          setStreak(0);
          setFlash("wrong");
          setTimeout(() => {
            setFlash(null);
            startNewWord(0, used);
          }, 500);
          return 0;
        }
        return prev - 100;
      });
    }, 100);
  }, []);

  // Main game timer
  useEffect(() => {
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current!);
          if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (gameTimerRef.current)  clearInterval(gameTimerRef.current);
      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
    };
  }, []);

  // Start first word
  useEffect(() => {
    startNewWord(0, new Set());
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Game over
  useEffect(() => {
    if (!done) return;
    if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
    const wpm   = wordsTyped > 0 ? Math.round((wordsTyped / (duration - timeLeft)) * 60) : 0;
    const bonus = wpm >= 80 ? 15 : wpm >= 60 ? 8 : 0;
    const final = Math.max(1, Math.round(rewardTokens * (0.4 + scoreRef.current / 200)) + bonus);
    setTimeout(() => onComplete(final, scoreRef.current), 1400);
  }, [done]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (done) return;
    const value = e.target.value.toLowerCase().trim();
    setTyped(value);

    if (value === currentWord) {
      // Correct!
      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);

      streakRef.current += 1;
      setStreak(streakRef.current);
      const diff    = getDifficulty(streakRef.current - 1);
      const cfg     = WORD_CFG[diff];
      const timeBonus   = Math.floor((wordTimer / wordMax) * cfg.pts);
      const streakBonus = streakRef.current >= 3 ? (streakRef.current - 2) * 5 : 0;
      const pts         = cfg.pts + timeBonus + streakBonus;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setWordsTyped(prev => prev + 1);
      setFlash("correct");

      const newUsed = new Set([...usedWords, currentWord]);
      setUsedWords(newUsed);

      setTimeout(() => {
        setFlash(null);
        startNewWord(streakRef.current, newUsed);
      }, 300);
    }
  };

  const diff       = WORD_CFG[difficulty];
  const progress   = wordMax > 0 ? wordTimer / wordMax : 1;
  const progressColor = progress > 0.5 ? diff.color : progress > 0.25 ? "#f97316" : "#ef4444";

  // Highlight typed chars
  const renderWord = () => {
    return currentWord.split("").map((char, i) => {
      const typedChar = typed[i];
      const color =
        typedChar === undefined ? "rgba(255,255,255,0.6)" :
        typedChar === char      ? diff.color              : "#ef4444";
      return (
        <span key={i} style={{ color, transition: "color 0.1s",
          textShadow: typedChar === char ? `0 0 12px ${diff.glow}` : "none" }}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0f1e35 100%)", minHeight: 260 }}>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>
            <Keyboard className="w-3.5 h-3.5 text-blue-400" />{score}
          </div>
          {streak >= 2 && (
            <div className="text-xs font-black" style={{ color: diff.color }}>{streak}× streak!</div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Lives */}
          <div className="flex gap-1">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart key={i} className="w-3.5 h-3.5"
                style={{ color: i < lives ? "#ef4444" : "rgba(255,255,255,0.15)", fill: i < lives ? "#ef4444" : "none" }} />
            ))}
          </div>
          <div className="font-black text-lg tabular-nums"
            style={{ color: timeLeft <= 8 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Game body */}
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-6">
        {/* Difficulty badge */}
        <div className="text-[10px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded-xs"
          style={{ background: `${diff.color}18`, border: `1px solid ${diff.color}35`, color: diff.color }}>
          {diff.label}
        </div>

        {/* Word display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="font-black text-3xl tracking-tight text-center"
            style={{
              letterSpacing: "-0.02em",
              filter: flash === "correct" ? "brightness(1.8)" : flash === "wrong" ? "hue-rotate(120deg)" : "none",
              transition: "filter 0.1s",
            }}
          >
            {renderWord()}
          </motion.div>
        </AnimatePresence>

        {/* Word timer bar */}
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
            style={{ background: progressColor, boxShadow: `0 0 8px ${progressColor}80` }}
          />
        </div>

        {/* Input */}
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={handleInput}
            disabled={done}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Type here…"
            className="w-full px-4 py-3 rounded-xs text-white font-bold text-base outline-none text-center"
            style={{
              background: flash === "correct" ? `${diff.color}18` : flash === "wrong" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
              border: flash === "correct" ? `1px solid ${diff.color}60` : flash === "wrong" ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.1)",
              caretColor: diff.color,
              transition: "all 0.15s",
            }}
          />
          {typed.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
              style={{ color: typed === currentWord.slice(0, typed.length) ? diff.color : "#ef4444" }}>
              {typed === currentWord.slice(0, typed.length) ? "✓" : "✗"}
            </div>
          )}
        </div>

        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {wordsTyped} word{wordsTyped !== 1 ? "s" : ""} · type fast for bonus points
        </p>
      </div>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 rounded-xs"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {wordsTyped} words · best streak {streakRef.current}×
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