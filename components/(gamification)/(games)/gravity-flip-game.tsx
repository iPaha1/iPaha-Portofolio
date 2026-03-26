// =============================================================================
// GAME 12: GRAVITY FLIP — Tap to flip gravity, navigate the ball through gaps
// components/(gamification)/(games)/gravity-flip-game.tsx
//
// Mechanic: A ball constantly moves right across the screen. It falls under
// gravity by default. Tap/click ANYWHERE to flip gravity — the ball then
// rises. Walls with gaps scroll in from the right; guide the ball through
// each gap. Stars float in gaps for bonus points. Miss a gap = game over.
// Speed ramps every 3 walls cleared. One hit = done.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, Star } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 100; // % width (logical units)
const H = 100; // % height

const BALL_R    = 3.5;   // % radius
const BALL_X    = 22;    // % fixed horizontal position
const GRAVITY   = 0.28;  // %/frame²
const WALL_W    = 4;     // % wall width
const GAP_H     = 26;    // % gap height
const MIN_GAP_Y = 10;
const MAX_GAP_Y = H - GAP_H - 10;

interface Wall {
  id:    string;
  x:     number;  // % from left
  gapY:  number;  // % top of gap
  speed: number;  // %/frame
  passed: boolean;
}

interface StarObj {
  id:  string;
  x:   number;
  y:   number;
  collected: boolean;
}

let animId = 0;

export function GravityFlipGame({
  gameId, rewardTokens, duration = 25, onComplete, isFlash = false,
}: GameProps) {
  const [ballY,    setBallY]    = useState(50);
  const [score,    setScore]    = useState(0);
  const [walls,    setWalls]    = useState(0);   // cleared count
  const [timeLeft, setTimeLeft] = useState(duration);
  const [done,     setDone]     = useState(false);
  const [gravDir,  setGravDir]  = useState(1);   // 1 = down, -1 = up
  const [flashing, setFlashing] = useState(false);
  const [pops,     setPops]     = useState<{ id: string; y: number; text: string }[]>([]);

  const ballYRef   = useRef(50);
  const velYRef    = useRef(0);
  const gravRef    = useRef(1);
  const wallsRef   = useRef<Wall[]>([]);
  const starsRef   = useRef<StarObj[]>([]);
  const scoreRef   = useRef(0);
  const wallsCleared = useRef(0);
  const doneRef    = useRef(false);
  const speedRef   = useRef(1);
  const frameRef   = useRef(0);
  const [wallData, setWallData] = useState<Wall[]>([]);
  const [starData, setStarData] = useState<StarObj[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const spawnWall = useCallback(() => {
    const gapY = MIN_GAP_Y + Math.random() * (MAX_GAP_Y - MIN_GAP_Y);
    const id   = `w-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const wall: Wall = { id, x: 105, gapY, speed: 1.4 * speedRef.current, passed: false };
    wallsRef.current = [...wallsRef.current, wall];

    // Star in centre of gap
    const starId = `s-${Date.now()}`;
    starsRef.current = [...starsRef.current, {
      id: starId, x: 107, y: gapY + GAP_H / 2, collected: false,
    }];
  }, []);

  const showPop = (text: string, y: number) => {
    const id = `pop-${Date.now()}`;
    setPops(prev => [...prev, { id, y, text }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 700);
  };

  // ── Game loop ────────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    if (doneRef.current) return;

    // Physics
    velYRef.current += GRAVITY * gravRef.current;
    velYRef.current  = Math.max(-4.5, Math.min(4.5, velYRef.current));
    ballYRef.current += velYRef.current;

    // Ceiling / floor kill
    if (ballYRef.current - BALL_R < 0 || ballYRef.current + BALL_R > H) {
      doneRef.current = true;
      setDone(true);
      return;
    }

    // Move walls & stars
    wallsRef.current = wallsRef.current.map(w => ({ ...w, x: w.x - w.speed }));
    starsRef.current = starsRef.current.map(s => ({ ...s, x: s.x - 1.4 * speedRef.current }));

    // Wall collision
    for (const wall of wallsRef.current) {
      const inXRange = Math.abs(wall.x - BALL_X) < WALL_W / 2 + BALL_R;
      if (inXRange) {
        const inGap = ballYRef.current > wall.gapY && ballYRef.current < wall.gapY + GAP_H;
        if (!inGap) {
          doneRef.current = true;
          setDone(true);
          return;
        }
      }
      // Passed wall
      if (!wall.passed && wall.x + WALL_W < BALL_X - BALL_R) {
        wall.passed = true;
        wallsCleared.current += 1;
        scoreRef.current += 20;
        if (wallsCleared.current % 3 === 0) {
          speedRef.current = Math.min(2.6, speedRef.current + 0.15);
        }
        showPop("+20", ballYRef.current);
      }
    }

    // Star collection
    for (const star of starsRef.current) {
      if (!star.collected) {
        const dist = Math.hypot(star.x - BALL_X, star.y - ballYRef.current);
        if (dist < BALL_R + 3.5) {
          star.collected = true;
          scoreRef.current += 10;
          showPop("+10 ⭐", ballYRef.current);
        }
      }
    }

    // Remove off-screen
    wallsRef.current  = wallsRef.current.filter(w => w.x > -10);
    starsRef.current  = starsRef.current.filter(s => !s.collected && s.x > -5);

    setBallY(ballYRef.current);
    setWalls(wallsCleared.current);
    setScore(scoreRef.current);
    setWallData([...wallsRef.current]);
    setStarData([...starsRef.current]);

    frameRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Timers & init ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Spawn first wall after 1.5s
    const first = setTimeout(spawnWall, 1500);

    // Recurring wall spawn
    let spawnMs = 2200;
    const scheduleSpawn = () => {
      if (doneRef.current) return;
      const t = setTimeout(() => {
        spawnWall();
        spawnMs = Math.max(1100, spawnMs - 60);
        scheduleSpawn();
      }, spawnMs);
      return t;
    };
    const spawnHandle = setTimeout(() => scheduleSpawn(), 3500);

    // Game timer
    const timerHandle = setInterval(() => {
      if (doneRef.current) { clearInterval(timerHandle); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerHandle); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(first);
      clearTimeout(spawnHandle);
      clearInterval(timerHandle);
    };
  }, [loop, spawnWall]);

  // ── Game over ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!done) return;
    cancelAnimationFrame(frameRef.current);
    const survival  = wallsCleared.current / Math.max(1, (duration / 2));
    const final     = Math.max(1, Math.round(rewardTokens * (0.4 + survival * 2)));
    setTimeout(() => onComplete(final, scoreRef.current), 1400);
  }, [done]);

  // ── Tap handler ──────────────────────────────────────────────────────────────
  const handleTap = () => {
    if (doneRef.current) return;
    gravRef.current *= -1;
    velYRef.current  = gravRef.current * -1.8; // small impulse on flip
    setGravDir(gravRef.current);
    setFlashing(true);
    setTimeout(() => setFlashing(false), 80);
  };

  return (
    <div
      ref={gameAreaRef}
      onClick={handleTap}
      className="relative w-full rounded-xs overflow-hidden select-none cursor-pointer"
      style={{
        height: 240,
        background: flashing
          ? "linear-gradient(180deg,#1e3a5f 0%,#0c2340 100%)"
          : "linear-gradient(180deg,#050d1a 0%,#091425 60%,#0c1f3c 100%)",
        transition: "background 0.06s",
      }}
    >
      {/* Grid lines */}
      {[20,40,60,80].map(y => (
        <div key={y} className="absolute left-0 right-0 h-px"
          style={{ top: `${y}%`, background: "rgba(255,255,255,0.04)" }} />
      ))}

      {/* Stats bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 z-10"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />{score}
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{walls} walls</div>
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 5 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Walls */}
      {wallData.map(wall => (
        <React.Fragment key={wall.id}>
          {/* Top wall */}
          <div className="absolute"
            style={{
              left: `${wall.x - WALL_W / 2}%`,
              top: 0,
              width: `${WALL_W}%`,
              height: `${wall.gapY}%`,
              background: "linear-gradient(180deg,#3b82f680,#1d4ed880)",
              borderRight: "1px solid rgba(59,130,246,0.6)",
              borderLeft:  "1px solid rgba(59,130,246,0.4)",
            }} />
          {/* Bottom wall */}
          <div className="absolute"
            style={{
              left:   `${wall.x - WALL_W / 2}%`,
              top:    `${wall.gapY + GAP_H}%`,
              width:  `${WALL_W}%`,
              height: `${H - wall.gapY - GAP_H}%`,
              background: "linear-gradient(180deg,#1d4ed880,#3b82f680)",
              borderRight: "1px solid rgba(59,130,246,0.6)",
              borderLeft:  "1px solid rgba(59,130,246,0.4)",
            }} />
          {/* Gap glow */}
          <div className="absolute pointer-events-none"
            style={{
              left:   `${wall.x - WALL_W / 2}%`,
              top:    `${wall.gapY}%`,
              width:  `${WALL_W}%`,
              height: `${GAP_H}%`,
              background: "rgba(59,130,246,0.06)",
              boxShadow: "inset 0 0 8px rgba(59,130,246,0.15)",
            }} />
        </React.Fragment>
      ))}

      {/* Stars */}
      {starData.map(star => (
        <div key={star.id} className="absolute pointer-events-none text-base"
          style={{
            left: `${star.x}%`, top: `${star.y}%`,
            transform: "translate(-50%,-50%)",
            fontSize: 16,
            filter: "drop-shadow(0 0 6px #f59e0b)",
            animation: "starPulse 1s ease-in-out infinite",
          }}>⭐</div>
      ))}

      {/* Ball */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        animate={{ top: `${ballY}%`, rotate: gravDir === 1 ? 0 : 180 }}
        transition={{ duration: 0, rotate: { duration: 0.15 } }}
        style={{
          left:      `${BALL_X}%`,
          width:     `${BALL_R * 2}%`,
          height:    `${BALL_R * 2}%`,
          transform: "translate(-50%,-50%)",
          background: gravDir === 1
            ? "radial-gradient(circle at 35% 30%, #7dd3fc, #2563eb)"
            : "radial-gradient(circle at 35% 30%, #fca5a5, #dc2626)",
          boxShadow: gravDir === 1
            ? "0 0 18px rgba(37,99,235,0.8), 0 0 40px rgba(37,99,235,0.4)"
            : "0 0 18px rgba(220,38,38,0.8), 0 0 40px rgba(220,38,38,0.4)",
          border: "1.5px solid rgba(255,255,255,0.6)",
          zIndex: 10,
        }}
      >
        <Zap className="w-full h-full p-0.5 text-white opacity-80" />
      </motion.div>

      {/* Score pops */}
      {pops.map(p => (
        <motion.div key={p.id}
          initial={{ opacity: 1, x: 0 }} animate={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.6 }}
          className="absolute pointer-events-none font-black text-xs z-20 whitespace-nowrap"
          style={{ left: `${BALL_X + 6}%`, top: `${p.y}%`, transform: "translateY(-50%)", color: "#fbbf24", textShadow: "0 1px 6px #000" }}>
          {p.text}
        </motion.div>
      ))}

      {/* Tap hint */}
      {!done && walls === 0 && (
        <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] animate-pulse"
          style={{ color: "rgba(255,255,255,0.3)" }}>
          Tap anywhere to flip gravity
        </div>
      )}

      {/* Gravity indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: gravDir === -1 ? "#ef4444" : "rgba(255,255,255,0.15)" }} />
        <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: gravDir === 1 ? "#3b82f6" : "rgba(255,255,255,0.15)" }} />
      </div>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{walls} walls</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{score} pts</p>
        </motion.div>
      )}

      {isFlash && (
        <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
          style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
          2× Flash
        </div>
      )}

      <style>{`
        @keyframes starPulse {
          0%,100% { transform: translate(-50%,-50%) scale(1); }
          50% { transform: translate(-50%,-50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}