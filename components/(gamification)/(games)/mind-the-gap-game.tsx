// =============================================================================
// GAME 15: MIND THE GAP — Tap to jump, survive the infinite runner
// components/(gamification)/(games)/mind-the-gap-game.tsx
//
// Concept: An infinite side-scrolling runner on a neon platform.
// The platform has random gaps. Tap to jump. Double-tap = double jump.
// Land the timing perfectly. Score every gap survived. Speed increases.
// Canvas-based runner with satisfying physics — coyote time included.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 252;
const GROUND_Y = H - 50;
const RUNNER_X = 70;
const RUNNER_W = 16;
const RUNNER_H = 22;
const GRAVITY   = 0.55;
const JUMP_VEL  = -11;
const PLAT_H    = 8;

interface Platform {
  x: number;
  w: number;
}

// Build a series of platforms with random gaps
function buildPlatforms(): Platform[] {
  const plats: Platform[] = [];
  let x = 0;
  while (x < W + 400) {
    const w = 80 + Math.random() * 120;
    plats.push({ x, w });
    x += w + 30 + Math.random() * 60;
  }
  return plats;
}

export function MindTheGapGame({
  gameId,
  rewardTokens,
  duration = 25,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    vy:          0,
    y:           GROUND_Y - RUNNER_H,
    onGround:    true,
    jumpsLeft:   2,
    coyoteTime:  0,
    plats:       buildPlatforms(),
    speed:       3.0,
    score:       0,
    alive:       true,
    frame:       0,
    particles:   [] as { x: number; y: number; vx: number; vy: number; a: number; hue: number }[],
    dustFrames:  0,
  });
  const rafRef    = useRef<number>(0);
  const [score, setScore]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]     = useState<"playing" | "done">("playing");
  const phaseRef  = useRef<"playing" | "done">("playing");

  const playSound = useCallback((t: "jump" | "land" | "gap" | "end") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const map: Record<string, [number, OscillatorType, number, number]> = {
        jump: [440, "sine",     0.1, 0.12],
        land: [220, "sine",     0.08, 0.08],
        gap:  [110, "sawtooth", 0.4, 0.18],
        end:  [660, "sine",     0.5, 0.16],
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

  const endGame = useCallback((finalScore: number) => {
    cancelAnimationFrame(rafRef.current);
    phaseRef.current = "done";
    setPhase("done");
    playSound("end");
    const reward = Math.min(Math.floor(rewardTokens * (finalScore / 20 + 0.3)), rewardTokens * 2);
    setTimeout(() => onComplete(reward, finalScore), 1800);
  }, [rewardTokens, onComplete, playSound]);

  const jump = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const s = stateRef.current;
    if (s.jumpsLeft > 0 || s.coyoteTime > 0) {
      s.vy = JUMP_VEL;
      s.jumpsLeft = Math.max(0, s.jumpsLeft - 1);
      s.coyoteTime = 0;
      s.onGround = false;
      playSound("jump");
      // Spawn jump particles
      for (let i = 0; i < 8; i++) {
        s.particles.push({
          x: RUNNER_X, y: s.y + RUNNER_H,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * -2,
          a: 1,
          hue: 220 + Math.random() * 80,
        });
      }
    }
  }, [playSound]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    s.frame++;
    s.speed = 3.0 + s.score * 0.08;

    ctx.clearRect(0, 0, W, H);

    // BG gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#080d18"); bg.addColorStop(1, "#04080f");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Parallax bg lines (city silhouette)
    ctx.save();
    ctx.strokeStyle = "rgba(99,102,241,0.07)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const bx = ((s.frame * 0.5 + i * 55) % (W + 50)) - 50;
      const bh = 30 + Math.sin(i * 2.3) * 20;
      ctx.beginPath(); ctx.moveTo(bx, GROUND_Y - bh); ctx.lineTo(bx, GROUND_Y); ctx.stroke();
      ctx.strokeRect(bx - 8, GROUND_Y - bh, 16, bh);
    }
    ctx.restore();

    // Move & draw platforms
    s.plats.forEach(p => { p.x -= s.speed; });
    // Remove off-screen left, add new on right
    s.plats = s.plats.filter(p => p.x + p.w > -20);
    const lastX = s.plats.length > 0 ? Math.max(...s.plats.map(p => p.x + p.w)) : W;
    while (lastX < W + 400) {
      const w = 80 + Math.random() * 100;
      const gap = 30 + Math.random() * 50;
      const newX = s.plats.length > 0
        ? Math.max(...s.plats.map(p => p.x + p.w)) + gap
        : W + gap;
      s.plats.push({ x: newX, w });
    }

    s.plats.forEach(p => {
      const grad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + PLAT_H);
      grad.addColorStop(0, "#6366f1");
      grad.addColorStop(1, "rgba(99,102,241,0.3)");
      ctx.save();
      ctx.shadowBlur = 10; ctx.shadowColor = "rgba(99,102,241,0.6)";
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, GROUND_Y, p.w, PLAT_H);
      // Top glow line
      ctx.strokeStyle = "rgba(165,180,252,0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, GROUND_Y); ctx.lineTo(p.x + p.w, GROUND_Y); ctx.stroke();
      ctx.restore();
    });

    // Check if runner is above a platform
    let onPlat = false;
    let platTop = GROUND_Y;
    for (const p of s.plats) {
      if (RUNNER_X + RUNNER_W / 2 > p.x && RUNNER_X - RUNNER_W / 2 < p.x + p.w) {
        onPlat = true; platTop = GROUND_Y; break;
      }
    }

    // Runner is mid-gap — falling
    const isOverGap = !onPlat;

    // Physics
    s.vy += GRAVITY;
    s.y  += s.vy;

    if (isOverGap) {
      s.coyoteTime = Math.max(0, s.coyoteTime - 1);
    } else {
      // Landing
      if (s.y + RUNNER_H >= platTop && s.vy >= 0) {
        s.y = platTop - RUNNER_H;
        if (!s.onGround) {
          playSound("land");
          // Land particles
          for (let i = 0; i < 5; i++) {
            s.particles.push({ x: RUNNER_X, y: platTop, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2, a: 0.8, hue: 240 });
          }
          s.score++; setScore(s.score);
        }
        s.vy = 0; s.onGround = true; s.jumpsLeft = 2;
        s.coyoteTime = 8;
      }
    }

    // Fell into gap
    if (s.y > H + 30) {
      playSound("gap");
      s.alive = false;
      endGame(s.score);
      return;
    }

    // Particles
    s.particles = s.particles.filter(p => p.a > 0.05);
    s.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.a *= 0.88;
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.fillStyle = `hsla(${p.hue},80%,70%,1)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Runner
    ctx.save();
    ctx.shadowBlur = 18; ctx.shadowColor = "rgba(129,140,248,0.8)";
    // Body
    ctx.fillStyle = "#818cf8";
    ctx.beginPath();
    ctx.roundRect(RUNNER_X - RUNNER_W / 2, s.y, RUNNER_W, RUNNER_H, 3);
    ctx.fill();
    // Visor
    ctx.fillStyle = "#06b6d4";
    ctx.beginPath();
    ctx.roundRect(RUNNER_X - 5, s.y + 3, 10, 6, 2);
    ctx.fill();
    // Legs (animated)
    const legOff = Math.sin(s.frame * 0.35) * 5;
    ctx.fillStyle = "#4f46e5";
    ctx.fillRect(RUNNER_X - 6, s.y + RUNNER_H, 5, s.onGround ? (4 + legOff) : 8);
    ctx.fillRect(RUNNER_X + 1, s.y + RUNNER_H, 5, s.onGround ? (4 - legOff) : 8);
    ctx.restore();

    // Gap warning flash on left edge of upcoming gap
    if (isOverGap) {
      ctx.save();
      ctx.globalAlpha = 0.15 + Math.sin(s.frame * 0.4) * 0.1;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
  }, [playSound, endGame]);

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
      style={{ background: "#04080f" }}
      onClick={jump}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <span className="text-[10px] font-black tracking-widest text-white/25">gaps cleared</span>
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
        style={{ width: "100%", height: "calc(100% - 44px)", cursor: "pointer" }}
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
              <p className="text-white/40 text-sm">gaps cleared</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          Tap to jump · Double-tap for double jump
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