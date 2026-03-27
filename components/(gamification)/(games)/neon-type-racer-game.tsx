// =============================================================================
// GAME 9: NEON TYPERACER — Type the glowing words before they vanish
// components/(gamification)/(games)/neon-typeracer-game.tsx
//
// Concept: Words appear at random positions, glowing in neon colours.
// They slowly fade out. Type the exact word before it disappears.
// Multi-word active at once. Speed and word length ramp up.
// WPM counter. Perfect accuracy streak = multiplier.
// Uses Web Audio for satisfying per-keystroke clicks + success chimes.
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Zap, Keyboard } from "lucide-react";
import type { GameProps } from "./game-types";

const WORD_BANKS = [
  // Short (easy)
  ["code","ship","fast","earn","win","flow","next","zap","glow","flex","nova","arc","byte","pulse","void"],
  // Medium
  ["deploy","tokens","streak","launch","grind","hustle","neon","quantum","cipher","fractal","vertex","cosmic"],
  // Long (hard)
  ["velocity","breakout","lightning","blueprint","algorithm","interface","discovery","momentum"],
];

const NEON_COLORS = [
  { text: "#f43f5e", glow: "rgba(244,63,94,0.6)"  },
  { text: "#8b5cf6", glow: "rgba(139,92,246,0.6)" },
  { text: "#06b6d4", glow: "rgba(6,182,212,0.6)"  },
  { text: "#10b981", glow: "rgba(16,185,129,0.6)" },
  { text: "#f59e0b", glow: "rgba(245,158,11,0.6)" },
];

interface ActiveWord {
  id: string;
  word: string;
  x: number;  // % left
  y: number;  // % top
  color: typeof NEON_COLORS[0];
  lifetime: number;  // ms total
  born: number;      // Date.now()
  typed: string;     // progress so far
  done: boolean;
}

let idCounter = 0;

function mkWord(level: number): ActiveWord {
  const bank = level < 3 ? WORD_BANKS[0] : level < 7 ? WORD_BANKS[1] : WORD_BANKS[2];
  const word = bank[Math.floor(Math.random() * bank.length)];
  return {
    id: `w${++idCounter}`,
    word,
    x: 5 + Math.random() * 72,
    y: 15 + Math.random() * 60,
    color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
    lifetime: Math.max(2800, 5000 - level * 180),
    born: Date.now(),
    typed: "",
    done: false,
  };
}

function useTypingAudio(enabled: boolean) {
  const mk = useCallback((freq: number, type: OscillatorType, dur: number, vol = 0.1) => {
    if (!enabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  }, [enabled]);

  return {
    key:     () => mk(600 + Math.random() * 200, "square", 0.04, 0.06),
    correct: () => { mk(880, "sine", 0.15, 0.12); mk(1100, "sine", 0.12, 0.1); },
    miss:    () => mk(150, "sawtooth", 0.18, 0.08),
    end:     () => { mk(440, "sine", 0.3); mk(550, "sine", 0.4); mk(660, "sine", 0.5); },
  };
}

export function NeonTyperaceGame({
  gameId,
  rewardTokens,
  duration = 25,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const [words, setWords]       = useState<ActiveWord[]>([]);
  const [input, setInput]       = useState("");
  const [score, setScore]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [wpm, setWpm]           = useState(0);
  const [streak, setStreak]     = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [phase, setPhase]       = useState<"playing" | "done">("playing");
  const [flashWord, setFlashWord] = useState<string | null>(null);

  const scoreRef   = useRef(0);
  const streakRef  = useRef(0);
  const wordsRef   = useRef<ActiveWord[]>([]);
  const levelRef   = useRef(0);
  const charsTyped = useRef(0);
  const startTime  = useRef(Date.now());
  const inputRef   = useRef<HTMLInputElement>(null);
  const audio      = useTypingAudio(soundEnabled);

  // Keep wordsRef in sync
  useEffect(() => { wordsRef.current = words; }, [words]);

  // Spawn words over time
  useEffect(() => {
    const spawnWord = () => {
      if (phase !== "playing") return;
      const active = wordsRef.current.filter(w => !w.done).length;
      const maxActive = Math.min(2 + Math.floor(levelRef.current / 3), 5);
      if (active < maxActive) {
        setWords(prev => [...prev.filter(w => !w.done || Date.now() - w.born < w.lifetime + 400), mkWord(levelRef.current)]);
      }
    };
    spawnWord();
    const interval = setInterval(spawnWord, Math.max(800, 1800 - levelRef.current * 60));
    return () => clearInterval(interval);
  }, [phase]);

  // Fade-out janitor — remove expired words
  useEffect(() => {
    const id = setInterval(() => {
      setWords(prev => {
        const now = Date.now();
        return prev.filter(w => w.done || now - w.born < w.lifetime + 500);
      });
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Game timer
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          setPhase("done");
          audio.end();
          const elapsed = (Date.now() - startTime.current) / 60000;
          const finalWpm = Math.round(charsTyped.current / 5 / Math.max(elapsed, 0.1));
          setWpm(finalWpm);
          const reward = Math.min(
            Math.floor(rewardTokens * (scoreRef.current / 80 + 0.4)),
            rewardTokens * 2
          );
          setTimeout(() => onComplete(reward, scoreRef.current), 1800);
          return 0;
        }
        levelRef.current = Math.floor((duration - p) / 4);
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [duration, rewardTokens, onComplete, audio]);

  // Update WPM live
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 60000;
      setWpm(Math.round(charsTyped.current / 5 / Math.max(elapsed, 0.01)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase !== "playing") return;
    const val = e.target.value;
    audio.key();

    // Check if val matches the start of any word
    const currentWords = wordsRef.current;
    let matched = false;

    for (const w of currentWords) {
      if (w.done) continue;
      if (w.word.startsWith(val)) {
        // Update typed progress on this word
        setWords(prev => prev.map(pw =>
          pw.id === w.id ? { ...pw, typed: val } : pw
        ));

        if (val === w.word) {
          // COMPLETE!
          matched = true;
          charsTyped.current += val.length;
          streakRef.current += 1;
          setStreak(streakRef.current);

          const newMult = streakRef.current >= 6 ? 3 : streakRef.current >= 3 ? 2 : 1;
          setMultiplier(newMult);

          const pts = w.word.length * 5 * newMult;
          scoreRef.current += pts;
          setScore(scoreRef.current);

          setFlashWord(w.word);
          setTimeout(() => setFlashWord(null), 600);

          setWords(prev => prev.map(pw => pw.id === w.id ? { ...pw, done: true } : pw));
          setInput("");
          audio.correct();
          return;
        }
        setInput(val);
        return;
      }
    }

    // Val doesn't match any word start
    if (val.length > 0 && !matched) {
      // Check if it's a fresh start that could match
      const anyStart = currentWords.some(w => !w.done && w.word.startsWith(val));
      if (!anyStart) {
        audio.miss();
        streakRef.current = 0;
        setStreak(0);
        setMultiplier(1);
        setInput("");
        return;
      }
    }
    setInput(val);
  }, [phase, audio]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div
      className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#080810 0%,#0c0820 60%,#08100c 100%)" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        }}
      />

      {/* Stats */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black tracking-[0.1em] text-white/30">{wpm} WPM</span>
          </div>
          {multiplier > 1 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xs animate-pulse"
              style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)" }}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 font-black text-xs">{multiplier}×</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Word field */}
      <div className="absolute inset-0 top-11 bottom-14">
        <AnimatePresence>
          {words.map(w => {
            const age = Date.now() - w.born;
            const opacity = w.done ? 0 : Math.max(0, 1 - age / w.lifetime);
            if (w.done && age > 400) return null;

            const typedPart  = w.word.slice(0, w.typed.length);
            const remaining  = w.word.slice(w.typed.length);
            const isActive   = w.typed.length > 0;

            return (
              <motion.div
                key={w.id}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: w.done ? 0 : opacity }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: w.done ? 0.2 : 0.3, ease: "backOut" }}
                className="absolute pointer-events-none"
                style={{
                  left: `${w.x}%`,
                  top: `${w.y}%`,
                  fontFamily: "'Sora', system-ui, monospace",
                  fontSize: isActive ? "17px" : "15px",
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  textShadow: `0 0 14px ${w.color.glow}, 0 0 30px ${w.color.glow}`,
                  transition: "text-shadow 0.15s, font-size 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: w.color.text, opacity: 0.35 }}>{typedPart}</span>
                <span style={{ color: w.color.text }}>{remaining}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Flash word complete */}
        <AnimatePresence>
          {flashWord && (
            <motion.div
              key={flashWord + Date.now()}
              initial={{ scale: 0.8, opacity: 1, y: 0 }}
              animate={{ scale: 1.1, opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-xl font-black text-white"
              style={{ textShadow: "0 0 20px white", letterSpacing: "-0.02em" }}
            >
              {flashWord}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="relative flex items-center">
          <span className="text-[10px] font-black tracking-[0.2em] uppercase mr-2"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >TYPE:</span>
          <input
            ref={inputRef}
            value={input}
            onChange={handleInput}
            disabled={phase !== "playing"}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 bg-transparent outline-none font-black text-base"
            style={{
              color: input ? "#f0f0f0" : "rgba(255,255,255,0.25)",
              caretColor: "#8b5cf6",
              letterSpacing: "0.04em",
            }}
            placeholder="start typing..."
          />
          {streak >= 3 && (
            <span className="text-[10px] font-black text-amber-400" style={{ letterSpacing: "0.1em" }}>
              {streak} streak
            </span>
          )}
        </div>
      </div>

      {/* End overlay */}
      <AnimatePresence>
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-cyan-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">{wpm} WPM · {streak} streak</p>
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