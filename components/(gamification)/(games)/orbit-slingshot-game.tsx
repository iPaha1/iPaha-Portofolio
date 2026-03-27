// =============================================================================
// GAME 10: ORBIT SLINGSHOT — Release orbiting comets to destroy targets
// components/(gamification)/(games)/orbit-slingshot-game.tsx
//
// Concept: A comet orbits your cursor (or a fixed point). Targets drift
// across the canvas. Click to RELEASE the comet — it flies in a straight
// line at the angle it was at when you clicked. Hit targets = points.
// After release, a new comet spawns and starts orbiting. Miss = comet lost.
// You have 5 comets per round. Orbit speed increases. Stunning canvas FX.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Timer, Trophy, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 240;
const ORBIT_R = 42;
const COMET_R  = 9;
const TARGET_R = 18;
const COMET_SPEED = 9;
const ORBIT_CENTER = { x: W / 2, y: H / 2 };

interface Target {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  size: number;
  hue: number;
  hit: boolean;
  hitAt?: number;
}

interface FiredComet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
}

interface Explosion {
  id: string;
  x: number;
  y: number;
  t: number; // 0..1
  hue: number;
}

let _id = 0;
function uid() { return `${++_id}`; }

function mkTarget(level: number): Target {
  const edge = Math.floor(Math.random() * 4);
  let x = 0, y = 0, vx = 0, vy = 0;
  const spd = 0.8 + level * 0.15 + Math.random() * 0.5;
  if (edge === 0)      { x = Math.random() * W; y = -TARGET_R;       vy =  spd; vx = (Math.random()-0.5)*spd; }
  else if (edge === 1) { x = W + TARGET_R;       y = Math.random()*H; vx = -spd; vy = (Math.random()-0.5)*spd; }
  else if (edge === 2) { x = Math.random() * W; y = H + TARGET_R;    vy = -spd; vx = (Math.random()-0.5)*spd; }
  else                 { x = -TARGET_R;           y = Math.random()*H; vx =  spd; vy = (Math.random()-0.5)*spd; }
  return { id: uid(), x, y, vx, vy, value: 10 + level * 2, size: TARGET_R - Math.random() * 6, hue: Math.random() * 360, hit: false };
}

export function OrbitSlingshotGame({
  gameId,
  rewardTokens,
  duration = 20,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const stateRef     = useRef({
    orbitAngle: 0,
    orbitSpeed: 2.4, // deg/frame
    comets: [] as FiredComet[],
    targets: [] as Target[],
    explosions: [] as Explosion[],
    score: 0,
    shots: 5,
    alive: true,
    frame: 0,
    level: 0,
  });
  const rafRef       = useRef<number>(0);
  const [score, setScore]     = useState(0);
  const [shots, setShots]     = useState(5);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]     = useState<"playing" | "done">("playing");
  const phaseRef = useRef<"playing" | "done">("playing");

  const playSound = useCallback((type: "fire" | "hit" | "miss" | "end") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const map: Record<string, [number, OscillatorType, number, number]> = {
        fire: [440, "sine",     0.12, 0.12],
        hit:  [880, "sine",     0.25, 0.15],
        miss: [180, "sawtooth", 0.2,  0.08],
        end:  [660, "sine",     0.5,  0.18],
      };
      const [freq, type2, dur, vol] = map[type];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type2 as OscillatorType; o.frequency.value = freq;
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
    const reward = Math.min(Math.floor(rewardTokens * (finalScore / 100 + 0.4)), rewardTokens * 2);
    setTimeout(() => onComplete(reward, finalScore), 1800);
  }, [rewardTokens, onComplete, playSound]);

  const fire = useCallback(() => {
    const s = stateRef.current;
    if (phaseRef.current !== "playing" || s.shots <= 0 || !s.alive) return;
    const rad = (s.orbitAngle * Math.PI) / 180;
    const cx  = ORBIT_CENTER.x + Math.cos(rad) * ORBIT_R;
    const cy  = ORBIT_CENTER.y + Math.sin(rad) * ORBIT_R;
    const vx  = Math.cos(rad) * COMET_SPEED;
    const vy  = Math.sin(rad) * COMET_SPEED;
    s.comets.push({ id: uid(), x: cx, y: cy, vx, vy, trail: [] });
    s.shots -= 1;
    setShots(s.shots);
    playSound("fire");
    if (s.shots <= 0) {
      // 1.5s grace for last comet to hit
      setTimeout(() => {
        if (phaseRef.current === "playing") endGame(stateRef.current.score);
      }, 1500);
    }
  }, [playSound, endGame]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#050510");
    bg.addColorStop(1, "#0a0520");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Stars
    if (s.frame % 2 === 0) {
      for (let i = 0; i < 3; i++) {
        const sx = Math.random() * W, sy = Math.random() * H;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
    s.frame++;

    // Orbit speed ramp
    s.orbitSpeed = 2.4 + s.level * 0.3;
    s.orbitAngle = (s.orbitAngle + s.orbitSpeed) % 360;
    s.level = Math.floor(s.score / 40);

    // Spawn targets (keep 3-5 active)
    if (s.targets.filter(t => !t.hit).length < 4 + s.level) {
      s.targets.push(mkTarget(s.level));
    }

    // Move targets
    s.targets = s.targets.map(t => ({
      ...t,
      x: t.x + t.vx,
      y: t.y + t.vy,
    })).filter(t => {
      if (t.hit && t.hitAt && Date.now() - t.hitAt > 500) return false;
      return t.x > -60 && t.x < W + 60 && t.y > -60 && t.y < H + 60 || t.hit;
    });

    // Move comets + check collisions
    s.comets = s.comets.filter(c => {
      c.trail.unshift({ x: c.x, y: c.y });
      if (c.trail.length > 18) c.trail.pop();
      c.x += c.vx; c.y += c.vy;

      // Check hits
      for (const t of s.targets) {
        if (t.hit) continue;
        const dx = c.x - t.x, dy = c.y - t.y;
        if (Math.sqrt(dx*dx + dy*dy) < COMET_R + t.size) {
          t.hit = true; t.hitAt = Date.now();
          s.score += t.value; setScore(s.score);
          s.explosions.push({ id: uid(), x: t.x, y: t.y, t: 0, hue: t.hue });
          playSound("hit");
          return false;
        }
      }
      // Off screen
      if (c.x < -30 || c.x > W + 30 || c.y < -30 || c.y > H + 30) {
        playSound("miss");
        return false;
      }
      return true;
    });

    // Update explosions
    s.explosions = s.explosions.filter(e => e.t < 1);
    s.explosions.forEach(e => { e.t += 0.07; });

    // Draw targets
    s.targets.forEach(t => {
      if (t.hit) {
        ctx.globalAlpha = Math.max(0, 1 - (Date.now() - (t.hitAt ?? 0)) / 400);
      } else {
        ctx.globalAlpha = 1;
      }
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = `hsla(${t.hue},100%,65%,0.8)`;
      ctx.strokeStyle = `hsla(${t.hue},100%,70%,0.9)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      ctx.stroke();
      // Inner dot
      ctx.fillStyle = `hsla(${t.hue},100%,80%,0.3)`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    });

    // Draw explosions
    s.explosions.forEach(e => {
      const r = e.t * 40;
      const alpha = 1 - e.t;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = `hsla(${e.hue},100%,70%,1)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(a) * r * 0.3, e.y + Math.sin(a) * r * 0.3);
        ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Draw fired comets + trails
    s.comets.forEach(c => {
      c.trail.forEach((t, i) => {
        const alpha = (1 - i / c.trail.length) * 0.5;
        const r = COMET_R * (1 - i / c.trail.length * 0.8);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#60a5fa";
        ctx.shadowBlur = 8; ctx.shadowColor = "rgba(96,165,250,0.8)";
        ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      ctx.save();
      ctx.shadowBlur = 20; ctx.shadowColor = "rgba(96,165,250,0.9)";
      const cg = ctx.createRadialGradient(c.x - 2, c.y - 2, 1, c.x, c.y, COMET_R);
      cg.addColorStop(0, "#e0f2fe"); cg.addColorStop(1, "#2563eb");
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(c.x, c.y, COMET_R, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Draw orbit ring (dashed)
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.arc(ORBIT_CENTER.x, ORBIT_CENTER.y, ORBIT_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Draw center
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#8b5cf6";
    ctx.beginPath(); ctx.arc(ORBIT_CENTER.x, ORBIT_CENTER.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Draw orbiting comet
    if (s.shots > 0 && phaseRef.current === "playing") {
      const rad = (s.orbitAngle * Math.PI) / 180;
      const ox = ORBIT_CENTER.x + Math.cos(rad) * ORBIT_R;
      const oy = ORBIT_CENTER.y + Math.sin(rad) * ORBIT_R;
      ctx.save();
      ctx.shadowBlur = 24; ctx.shadowColor = "rgba(167,139,250,0.9)";
      const og = ctx.createRadialGradient(ox - 2, oy - 2, 1, ox, oy, COMET_R - 2);
      og.addColorStop(0, "#ddd6fe"); og.addColorStop(1, "#7c3aed");
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.arc(ox, oy, COMET_R - 2, 0, Math.PI * 2); ctx.fill();
      // Direction line
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(rad) * 60, oy + Math.sin(rad) * 60);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (phaseRef.current === "playing") {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [playSound]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          if (phaseRef.current === "playing") endGame(stateRef.current.score);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(timer); };
  }, [draw, endGame]);

  return (
    <div
      className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "#050510" }}
      onClick={fire}
    >
      {/* Stats */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-violet-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  background: i < shots ? "#8b5cf6" : "rgba(255,255,255,0.1)",
                  boxShadow: i < shots ? "0 0 6px rgba(139,92,246,0.8)" : "none",
                }}
              />
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
        style={{ width: "100%", height: "calc(100% - 44px)" }}
      />

      <AnimatePresence>
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-violet-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">targets destroyed</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          Tap to launch comet · {shots} shots remaining
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