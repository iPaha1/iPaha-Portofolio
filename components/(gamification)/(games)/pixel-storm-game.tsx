// =============================================================================
// GAME 22: PIXEL STORM — The image is scrambling. Catch and lock pixels.
// components/(gamification)/(games)/pixel-storm-game.tsx
//
// Concept: A 12×8 grid of colour pixels forms a hidden image (abstract art).
// The pixels are wildly scrambling — each one rapidly cycling through random
// colours. Click a pixel at the EXACT moment it shows its correct colour
// to "lock" it in place. Locked pixels glow and stabilise. Clear the whole
// image before time runs out. Like watching chaos freeze into order.
// The "target image" is a procedurally generated neon geometric pattern.
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Grid3X3, Lock } from "lucide-react";
import type { GameProps } from "./game-types";

const COLS = 12;
const ROWS = 8;
const TOTAL = COLS * ROWS;

// Generate a beautiful target image — neon geometric pattern
function generateTarget(): string[] {
  const colors = ["#ef4444","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#84cc16"];
  return Array.from({ length: TOTAL }, (_, i) => {
    const row = Math.floor(i / COLS), col = i % COLS;
    // Geometric pattern: rings + diagonal stripes
    const dx = col - COLS / 2, dy = row - ROWS / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const stripe = (col + row) % 4;
    const ring   = Math.floor(dist) % 3;
    const idx    = (stripe + ring * 2) % colors.length;
    return colors[idx];
  });
}

// A "close enough" match for the scrambled colour to register as correct
function isMatch(current: string, target: string): boolean {
  // Parse hex to RGB and check if within tolerance
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  try {
    const [r1, g1, b1] = parse(current);
    const [r2, g2, b2] = parse(target);
    const dist = Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
    return dist < 30; // within 30 colour units
  } catch { return false; }
}

// Random hex colour
function randHex(): string {
  const pool = ["#ef4444","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316","#a855f7"];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function PixelStormGame({
  gameId, rewardTokens, duration = 30,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const [target]                = useState<string[]>(generateTarget);
  const [current, setCurrent]   = useState<string[]>(() => Array.from({ length: TOTAL }, randHex));
  const [locked, setLocked]     = useState<boolean[]>(() => Array(TOTAL).fill(false));
  const [score, setScore]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]       = useState<"playing" | "done">("playing");
  const [justLocked, setJustLocked] = useState<number | null>(null);

  const lockedRef  = useRef<boolean[]>(Array(TOTAL).fill(false));
  const scoreRef   = useRef(0);
  const phaseRef   = useRef<"playing" | "done">("playing");
  const currentRef = useRef<string[]>(Array.from({ length: TOTAL }, randHex));
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { lockedRef.current = locked; }, [locked]);

  const playSound = useCallback((t: "lock" | "miss" | "win" | "tick") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const map: Record<string, [number, OscillatorType, number, number]> = {
        lock: [880, "sine",     0.15, 0.12],
        miss: [180, "sawtooth", 0.1,  0.08],
        win:  [1046,"sine",     0.6,  0.16],
        tick: [440, "sine",     0.05, 0.06],
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

  // Scramble unlocked pixels rapidly
  useEffect(() => {
    if (phaseRef.current !== "playing") return;
    const id = setInterval(() => {
      setCurrent(prev => prev.map((c, i) => {
        if (lockedRef.current[i]) return c;
        // 70% chance to scramble each frame
        return Math.random() < 0.7 ? randHex() : c;
      }));
    }, 80);
    return () => clearInterval(id);
  }, [phase]);

  // Occasionally flash the correct colour on unlocked pixels (to be catchable)
  useEffect(() => {
    if (phaseRef.current !== "playing") return;
    const id = setInterval(() => {
      const unlockedIndices = Array.from({ length: TOTAL }, (_, i) => i)
        .filter(i => !lockedRef.current[i]);
      if (unlockedIndices.length === 0) return;
      // Flash correct colour on 2-4 random unlocked pixels briefly
      const flashCount = 2 + Math.floor(Math.random() * 3);
      const toFlash = unlockedIndices
        .sort(() => Math.random() - 0.5)
        .slice(0, flashCount);
      setCurrent(prev => {
        const next = [...prev];
        toFlash.forEach(i => { next[i] = target[i]; });
        return next;
      });
    }, 200);
    return () => clearInterval(id);
  }, [target, phase]);

  const handleClick = useCallback((idx: number) => {
    if (phaseRef.current !== "playing" || lockedRef.current[idx]) return;

    const cur = currentRef.current[idx];
    if (isMatch(cur, target[idx])) {
      // Lock it!
      const newLocked = [...lockedRef.current];
      newLocked[idx] = true;
      lockedRef.current = newLocked;
      setLocked(newLocked);

      const newScore = scoreRef.current + 10;
      scoreRef.current = newScore;
      setScore(newScore);
      setJustLocked(idx);
      setTimeout(() => setJustLocked(null), 300);
      playSound("lock");

      // Check win
      if (newLocked.every(Boolean)) {
        phaseRef.current = "done";
        setPhase("done");
        playSound("win");
        const reward = Math.min(Math.floor(rewardTokens * (newScore / TOTAL / 10 + 0.6)), rewardTokens * 2);
        setTimeout(() => onComplete(reward, newScore), 1800);
      }
    } else {
      playSound("miss");
    }
  }, [target, playSound, rewardTokens, onComplete]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) {
        clearInterval(t);
        phaseRef.current = "done";
        setPhase("done");
        const lockedCount = lockedRef.current.filter(Boolean).length;
        const reward = Math.floor(rewardTokens * Math.max(0.15, lockedCount / TOTAL));
        onComplete(Math.min(reward, rewardTokens * 2), scoreRef.current);
        return 0;
      }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [rewardTokens, onComplete]);

  const lockedCount = locked.filter(Boolean).length;
  const progress    = lockedCount / TOTAL;

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "#07080f" }}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{lockedCount}</span>
            <span className="text-white/25 text-[10px]">/ {TOTAL}</span>
          </div>
          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${progress * 100}%` }}
              style={{ background: "#10b981" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Pixel grid */}
      <div className="absolute inset-0 flex items-center justify-center pt-12 pb-6">
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: "2px",
          width: "min(380px,92vw)",
        }}>
          {current.map((color, i) => {
            const isLocked   = locked[i];
            const isFlashing = justLocked === i;
            return (
              <motion.div
                key={i}
                onClick={() => handleClick(i)}
                animate={isFlashing ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.25 }}
                className="cursor-pointer rounded-xs"
                style={{
                  aspectRatio: "1",
                  background:  isLocked ? target[i] : color,
                  boxShadow:   isLocked
                    ? `0 0 6px ${target[i]}80, inset 0 0 3px rgba(255,255,255,0.3)`
                    : "none",
                  opacity:    isLocked ? 1 : 0.85,
                  transform:  isLocked ? "none" : undefined,
                  transition: isLocked ? "none" : "background 0.04s",
                  outline:    isLocked ? `1px solid ${target[i]}` : "none",
                }}
              />
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
          >
            <div className="text-center">
              <Trophy className={`w-14 h-14 mx-auto mb-3 ${lockedCount === TOTAL ? "text-amber-400" : "text-emerald-400"}`} />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">{lockedCount}/{TOTAL} pixels locked</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          Tap a pixel when it flashes its correct colour
        </span>
      </div>
      {isFlash && (
        <div className="absolute top-11 right-3 z-20 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse"
          style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fcd34d" }}
        >⚡ FLASH</div>
      )}
    </div>
  );
}