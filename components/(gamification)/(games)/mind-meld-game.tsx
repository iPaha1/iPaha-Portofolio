// =============================================================================
// GAME 24: MIND MELD — Two patterns flash. Spot what changed. Lightning fast.
// components/(gamification)/(games)/mind-meld-game.tsx
//
// Concept: Two grids flash SIMULTANEOUSLY for 600ms. Then they're hidden.
// One cell changed between them. Tap the grid that shows the CHANGED cell.
// Sounds simple — it's absolutely brutal. 10 rounds. Each round flashes
// faster. Wrong tap loses a life. Perfect score = legendary multiplier.
// The reveal animation when you're right is deeply satisfying.
// Visual style: pure geometric shapes, neon, dark — like a brain scanner.
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Brain, Eye, EyeOff } from "lucide-react";
import type { GameProps } from "./game-types";

const GRID_SIZE = 4; // 4×4
const CELLS     = GRID_SIZE * GRID_SIZE;
const TOTAL_ROUNDS = 10;

const COLORS = ["#ef4444","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899"];

function randomGrid(): string[] {
  return Array.from({ length: CELLS }, () => COLORS[Math.floor(Math.random() * COLORS.length)]);
}

function makeVariant(base: string[], changedIdx: number): string[] {
  const next = [...base];
  const others = COLORS.filter(c => c !== next[changedIdx]);
  next[changedIdx] = others[Math.floor(Math.random() * others.length)];
  return next;
}

type Phase = "showing" | "hidden" | "answering" | "reveal" | "done";

export function MindMeldGame({
  gameId, rewardTokens, duration = 35,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const [round, setRound]         = useState(1);
  const [score, setScore]         = useState(0);
  const [lives, setLives]         = useState(3);
  const [timeLeft, setTimeLeft]   = useState(duration);
  const [phase, setPhase]         = useState<Phase>("showing");
  const [gridA, setGridA]         = useState<string[]>([]);
  const [gridB, setGridB]         = useState<string[]>([]);
  const [changedGrid, setChangedGrid] = useState<"A" | "B">("B");
  const [changedIdx, setChangedIdx] = useState(0);
  const [guess, setGuess]         = useState<"A" | "B" | null>(null);
  const [correct, setCorrect]     = useState<boolean | null>(null);
  const [streak, setStreak]       = useState(0);
  const [flashTime, setFlashTime] = useState(600); // ms — decreases per round

  const scoreRef  = useRef(0);
  const livesRef  = useRef(3);
  const roundRef  = useRef(1);
  const streakRef = useRef(0);
  const phaseRef  = useRef<Phase>("showing");
  const timeRef   = useRef(duration);

  const playSound = useCallback((t: "show" | "right" | "wrong" | "lose" | "win") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const map: Record<string, [number, OscillatorType, number, number]> = {
        show:  [440,  "sine",     0.1,  0.1],
        right: [880,  "sine",     0.2,  0.12],
        wrong: [180,  "sawtooth", 0.25, 0.1],
        lose:  [110,  "sawtooth", 0.5,  0.16],
        win:   [1046, "sine",     0.6,  0.16],
      };
      const [freq, type, dur, vol] = map[t];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  }, [soundEnabled]);

  const startRound = useCallback((rnd: number) => {
    const base    = randomGrid();
    const changed = Math.floor(Math.random() * CELLS);
    const variant = makeVariant(base, changed);
    const aIsChanged = Math.random() > 0.5;

    setGridA(aIsChanged ? variant : base);
    setGridB(aIsChanged ? base : variant);
    setChangedGrid(aIsChanged ? "A" : "B");
    setChangedIdx(changed);
    setGuess(null);
    setCorrect(null);

    const ft = Math.max(280, 600 - (rnd - 1) * 30);
    setFlashTime(ft);

    phaseRef.current = "showing";
    setPhase("showing");
    playSound("show");

    setTimeout(() => {
      phaseRef.current = "hidden";
      setPhase("hidden");
      setTimeout(() => {
        phaseRef.current = "answering";
        setPhase("answering");
      }, 150);
    }, ft);
  }, [playSound]);

  const handleGuess = useCallback((which: "A" | "B") => {
    if (phaseRef.current !== "answering") return;
    phaseRef.current = "reveal";
    setPhase("reveal");
    setGuess(which);

    const isRight = which === changedGrid;
    setCorrect(isRight);

    if (isRight) {
      streakRef.current++;
      setStreak(streakRef.current);
      const mult = streakRef.current >= 5 ? 3 : streakRef.current >= 3 ? 2 : 1;
      const pts  = 100 * mult;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      playSound("right");
    } else {
      streakRef.current = 0;
      setStreak(0);
      livesRef.current--;
      setLives(livesRef.current);
      playSound("wrong");
      if (livesRef.current <= 0) {
        phaseRef.current = "done";
        setPhase("done");
        playSound("lose");
        const reward = Math.floor(rewardTokens * Math.max(0.15, scoreRef.current / 700));
        setTimeout(() => onComplete(Math.min(reward, rewardTokens * 2), scoreRef.current), 1800);
        return;
      }
    }

    setTimeout(() => {
      const nr = roundRef.current + 1;
      roundRef.current = nr;
      if (nr > TOTAL_ROUNDS) {
        phaseRef.current = "done";
        setPhase("done");
        playSound("win");
        const reward = Math.min(Math.floor(rewardTokens * (scoreRef.current / 600 + 0.5)), rewardTokens * 2);
        setTimeout(() => onComplete(reward, scoreRef.current), 1800);
        return;
      }
      setRound(nr);
      startRound(nr);
    }, 900);
  }, [changedGrid, playSound, rewardTokens, onComplete, startRound]);

  useEffect(() => { startRound(1); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      timeRef.current--;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        clearInterval(t);
        phaseRef.current = "done";
        setPhase("done");
        const reward = Math.floor(rewardTokens * Math.max(0.15, scoreRef.current / 700));
        onComplete(Math.min(reward, rewardTokens * 2), scoreRef.current);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [rewardTokens, onComplete]);

  const GridDisplay = ({
    grid, side, showHighlight,
  }: { grid: string[]; side: "A" | "B"; showHighlight: boolean }) => (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[9px] font-black tracking-[0.2em] uppercase"
        style={{ color: guess === side ? (correct ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.25)" }}
      >Grid {side}</p>
      <motion.div
        whileHover={phase === "answering" ? { scale: 1.03 } : {}}
        whileTap={phase === "answering" ? { scale: 0.97 } : {}}
        onClick={() => phase === "answering" && handleGuess(side)}
        className="rounded-xs overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: "3px",
          padding: "6px",
          background: phase === "answering" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.3)",
          border: guess === side
            ? `2px solid ${correct ? "#10b981" : "#ef4444"}`
            : phase === "answering"
            ? "1px solid rgba(255,255,255,0.15)"
            : "1px solid rgba(255,255,255,0.06)",
          cursor: phase === "answering" ? "pointer" : "default",
          boxShadow: guess === side && correct ? "0 0 20px rgba(16,185,129,0.4)" : "none",
        }}
      >
        {grid.map((color, i) => (
          <div key={i} className="rounded-xs"
            style={{
              width: "32px", height: "32px",
              background: (phase === "showing" || phase === "reveal") ? color : "rgba(255,255,255,0.08)",
              boxShadow: showHighlight && i === changedIdx && phase === "reveal"
                ? `0 0 12px ${color}, inset 0 0 6px rgba(255,255,255,0.3)`
                : "none",
              outline: showHighlight && i === changedIdx && phase === "reveal"
                ? `2px solid white`
                : "none",
              transition: "background 0.1s",
            }}
          />
        ))}
      </motion.div>
    </div>
  );

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#06080f 0%,#080612 100%)" }}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-violet-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <span className="text-[10px] font-black text-white/30">Rd {round}/{TOTAL_ROUNDS}</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all"
                style={{ background: i < lives ? "#ef4444" : "rgba(255,255,255,0.1)", boxShadow: i < lives ? "0 0 5px #ef4444" : "none" }}
              />
            ))}
          </div>
          {streak >= 2 && (
            <span className="text-[10px] font-black text-amber-400 px-1.5 py-0.5 rounded-xs"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}
            >{streak}× streak</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-10 pb-8 gap-4">
        {/* Phase indicator */}
        <div className="flex items-center gap-2 h-6">
          <AnimatePresence mode="wait">
            {phase === "showing" && (
              <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xs"
                style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)" }}
              >
                <Eye className="w-3 h-3 text-indigo-400" />
                <span className="text-indigo-400 text-xs font-black">Look carefully...</span>
              </motion.div>
            )}
            {(phase === "hidden") && (
              <motion.div key="h" initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xs"
                style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}
              >
                <EyeOff className="w-3 h-3 text-red-400" />
                <span className="text-red-400 text-xs font-black">Hidden!</span>
              </motion.div>
            )}
            {phase === "answering" && (
              <motion.div key="a" initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xs animate-pulse"
                style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)" }}
              >
                <span className="text-amber-400 text-xs font-black">Which grid changed?</span>
              </motion.div>
            )}
            {phase === "reveal" && (
              <motion.div key="r" initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xs"
                style={{ background: correct ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", border: `1px solid ${correct ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}` }}
              >
                <span className="text-xs font-black" style={{ color: correct ? "#10b981" : "#ef4444" }}>
                  {correct ? `Correct! +${streak >= 5 ? 300 : streak >= 3 ? 200 : 100}` : "Wrong!"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-6 items-start">
          <GridDisplay grid={gridA} side="A" showHighlight={changedGrid === "A"} />
          <GridDisplay grid={gridB} side="B" showHighlight={changedGrid === "B"} />
        </div>

        {/* Flash time indicator */}
        <div className="flex items-center gap-2">
          {[...Array(TOTAL_ROUNDS)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i < round - 1 ? "#10b981" : i === round - 1 ? "white" : "rgba(255,255,255,0.15)" }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-violet-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">best streak: {streak}×</p>
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