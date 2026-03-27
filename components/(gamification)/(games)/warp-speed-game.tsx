// =============================================================================
// GAME 14: WARP SPEED — Steer through hyperspace, survive the asteroid field
// components/(gamification)/(games)/warp-speed-game.tsx
//
// Concept: Pure canvas warp-speed starfield effect. Your ship is a triangle
// locked horizontally to your mouse/tap X position. Asteroids (rings) spawn
// at horizon and rush toward you. Dodge them. Survive = more tokens.
// Stars streak past at warp. Speed ramps every 5 seconds. Lives = 3.
// Mobile: tap left/right of screen to move ship. Utterly hypnotic visuals.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Rocket, Heart } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 252;
const SHIP_Y = H - 38;
const SHIP_W = 16;
const SHIP_H = 22;
const ASTEROID_SPAWN_Z = 0.01;
const MAX_LIVES = 3;

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
}

interface Asteroid {
  id: number;
  x: number; // 0..1 normalised
  y: number;
  z: number;
  r: number; // radius at z=1
  hue: number;
  hit: boolean;
}

interface Explosion { id: number; x: number; y: number; t: number; }

let _eid = 0;

function mkStars(n: number): Star[] {
  return Array.from({ length: n }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    z: Math.random(),
    pz: Math.random(),
  }));
}

export function WarpSpeedGame({
  gameId,
  rewardTokens,
  duration = 25,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    stars:       mkStars(180),
    asteroids:   [] as Asteroid[],
    explosions:  [] as Explosion[],
    shipX:       W / 2,
    score:       0,
    lives:       MAX_LIVES,
    speed:       0.012,
    frame:       0,
    alive:       true,
    invincible:  0, // frames of invincibility after hit
  });
  const rafRef    = useRef<number>(0);
  const [score, setScore]     = useState(0);
  const [lives, setLives]     = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]     = useState<"playing" | "done">("playing");
  const phaseRef  = useRef<"playing" | "done">("playing");

  const playSound = useCallback((t: "dodge" | "hit" | "end") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const map: Record<string, [number, OscillatorType, number]> = {
        dodge: [880, "sine",     0.07],
        hit:   [120, "sawtooth", 0.4 ],
        end:   [660, "sine",     0.5 ],
      };
      const [freq, type, dur] = map[t];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  }, [soundEnabled]);

  const endGame = useCallback((finalScore: number) => {
    cancelAnimationFrame(rafRef.current);
    phaseRef.current = "done";
    setPhase("done");
    playSound("end");
    const reward = Math.min(Math.floor(rewardTokens * (finalScore / 50 + 0.3)), rewardTokens * 2);
    setTimeout(() => onComplete(reward, finalScore), 1800);
  }, [rewardTokens, onComplete, playSound]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    s.frame++;

    // Speed ramp
    s.speed = 0.012 + Math.floor(s.frame / 300) * 0.004;

    // BG
    ctx.fillStyle = "#02010a";
    ctx.fillRect(0, 0, W, H);

    // ── Stars (warp streaks) ──
    s.stars.forEach(star => {
      star.pz = star.z;
      star.z -= s.speed * 2;
      if (star.z <= 0) {
        star.z = 1; star.pz = 1;
        star.x = Math.random() * W;
        star.y = Math.random() * H;
      }
      const sx  = (star.x - W / 2) / star.z + W / 2;
      const sy  = (star.y - H / 2) / star.z + H / 2;
      const psx = (star.x - W / 2) / star.pz + W / 2;
      const psy = (star.y - H / 2) / star.pz + H / 2;
      const bright = Math.min(1, (1 - star.z) * 1.8);
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${bright * 0.85})`;
      ctx.lineWidth = Math.max(0.5, (1 - star.z) * 2);
      ctx.beginPath(); ctx.moveTo(psx, psy); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.restore();
    });

    // ── Asteroids ──
    if (s.frame % Math.max(18, 50 - s.frame / 60) === 0) {
      s.asteroids.push({
        id: ++_eid,
        x: 0.1 + Math.random() * 0.8,
        y: 0.1 + Math.random() * 0.8,
        z: ASTEROID_SPAWN_Z,
        r: 18 + Math.random() * 22,
        hue: Math.random() * 360,
        hit: false,
      });
    }

    s.asteroids = s.asteroids.filter(a => {
      if (a.hit && a.z > 0.9) return false;
      a.z += s.speed * 1.8;
      if (a.z >= 1.1) {
        // Missed — score a dodge
        s.score++; setScore(s.score);
        playSound("dodge");
        return false;
      }

      const ax = (a.x - 0.5) / a.z + W / 2;
      const ay = (a.y - 0.5) / a.z + H / 2;
      const ar = a.r * (1 - a.z * 0.3) / a.z * 0.4;

      // Draw asteroid
      ctx.save();
      ctx.shadowBlur = 12; ctx.shadowColor = `hsla(${a.hue},80%,70%,0.7)`;
      ctx.strokeStyle = `hsla(${a.hue},80%,65%,${Math.min(1, a.z * 2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ax, ay, Math.max(1, ar), 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(ax, ay, Math.max(0.5, ar * 0.4), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // Collision with ship (only near bottom)
      if (!a.hit && s.invincible <= 0 && a.z > 0.7) {
        const dx = ax - s.shipX, dy = ay - SHIP_Y;
        if (Math.sqrt(dx * dx + dy * dy) < ar + SHIP_W) {
          a.hit = true;
          s.lives -= 1; setLives(s.lives);
          s.invincible = 90;
          s.explosions.push({ id: ++_eid, x: s.shipX, y: SHIP_Y, t: 0 });
          playSound("hit");
          if (s.lives <= 0) { endGame(s.score); return false; }
        }
      }
      return true;
    });

    if (s.invincible > 0) s.invincible--;

    // ── Explosions ──
    s.explosions = s.explosions.filter(e => e.t < 1);
    s.explosions.forEach(e => {
      e.t += 0.06;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const r = e.t * 32;
        ctx.save();
        ctx.globalAlpha = (1 - e.t) * 0.9;
        ctx.strokeStyle = `hsl(${15 + e.t * 30},100%,65%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(a) * r * 0.3, e.y + Math.sin(a) * r * 0.3);
        ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
        ctx.stroke();
        ctx.restore();
      }
    });

    // ── Ship ──
    const inv = s.invincible > 0 && Math.floor(s.invincible / 6) % 2 === 0;
    if (!inv) {
      ctx.save();
      ctx.shadowBlur = 20; ctx.shadowColor = "rgba(99,102,241,0.9)";
      ctx.fillStyle = "#818cf8";
      ctx.beginPath();
      ctx.moveTo(s.shipX, SHIP_Y - SHIP_H);
      ctx.lineTo(s.shipX + SHIP_W, SHIP_Y + SHIP_H / 2);
      ctx.lineTo(s.shipX, SHIP_Y + SHIP_H / 3);
      ctx.lineTo(s.shipX - SHIP_W, SHIP_Y + SHIP_H / 2);
      ctx.closePath(); ctx.fill();
      // Engine glow
      ctx.shadowBlur = 14; ctx.shadowColor = "#f59e0b";
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(s.shipX - 5, SHIP_Y + SHIP_H / 2);
      ctx.lineTo(s.shipX + 5, SHIP_Y + SHIP_H / 2);
      ctx.lineTo(s.shipX, SHIP_Y + SHIP_H + 6 + Math.random() * 6);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
  }, [playSound, endGame]);

  // Mouse / touch tracking
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const scaleX = W / rect.width;
    stateRef.current.shipX = Math.max(SHIP_W, Math.min(W - SHIP_W, rawX * scaleX));
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const midX = rect.width / 2;
    stateRef.current.shipX = rawX < midX
      ? Math.max(SHIP_W, stateRef.current.shipX - 40)
      : Math.min(W - SHIP_W, stateRef.current.shipX + 40);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          if (phaseRef.current === "playing") endGame(stateRef.current.score);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(t); };
  }, [draw, endGame]);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "#02010a" }}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Rocket className="w-4 h-4 text-indigo-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(MAX_LIVES)].map((_, i) => (
              <div key={i} className="transition-all duration-200"
                style={{ color: i < lives ? "#ef4444" : "rgba(255,255,255,0.15)", fontSize: "12px" }}
              >
                ♥
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="absolute bottom-0 left-0 right-0"
        style={{ width: "100%", height: "calc(100% - 44px)", cursor: "none" }}
      />

      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-indigo-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">asteroids dodged</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          Move mouse to steer · Dodge the rings
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