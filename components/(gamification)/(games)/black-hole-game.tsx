// =============================================================================
// GAME 21: BLACK HOLE — Slingshot projectiles around a gravitational black hole
// components/(gamification)/(games)/black-hole-game.tsx
//
// Concept: A pulsing black hole sits at the centre. Targets orbit at different
// radii. You shoot projectiles from the edge — they curve around the black hole
// under gravity simulation. Aim the trajectory arc to slingshot into targets.
// The bending light-trail effect looks OTHERWORLDLY. Physics-based aiming.
// The closer your shot passes to the singularity, the more it curves.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, CircleDot } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 280;
const BH_X = W / 2;
const BH_Y = H / 2;
const BH_R  = 18;   // event horizon radius
const G_STRENGTH = 12000; // gravitational constant (tuned for fun)
const MAX_SHOTS  = 7;

interface Projectile {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  trail: { x: number; y: number; a: number }[];
  dead: boolean;
}

interface Target {
  id: number;
  angle: number;      // current orbit angle
  orbitR: number;     // orbit radius
  orbitSpeed: number; // radians/frame
  r: number;          // target radius
  hue: number;
  hit: boolean;
  hitAt: number;
}

interface AimLine { x: number; y: number; }

let _pid = 0, _tid = 0;

function mkTargets(level: number): Target[] {
  const count = 3 + Math.min(level, 4);
  return Array.from({ length: count }, (_, i) => ({
    id: ++_tid,
    angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
    orbitR: 60 + Math.floor(i / 2) * 30 + Math.random() * 15,
    orbitSpeed: (0.008 + Math.random() * 0.006) * (Math.random() > 0.5 ? 1 : -1),
    r: 14 - level,
    hue: (i * 60 + level * 30) % 360,
    hit: false,
    hitAt: 0,
  }));
}

export function BlackHoleGame({
  gameId, rewardTokens, duration = 25,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef({
    projectiles: [] as Projectile[],
    targets:     mkTargets(0),
    shots:       MAX_SHOTS,
    score:       0,
    frame:       0,
    level:       0,
    aimAngle:    0,
    mouseX:      20,
    mouseY:      H / 2,
    explosions:  [] as { x: number; y: number; t: number; hue: number }[],
    alive:       true,
  });
  const rafRef     = useRef<number>(0);
  const [score, setScore]     = useState(0);
  const [shots, setShots]     = useState(MAX_SHOTS);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]     = useState<"playing" | "done">("playing");
  const phaseRef  = useRef<"playing" | "done">("playing");

  const playSound = useCallback((t: "fire" | "hit" | "suck" | "end") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const configs: Record<string, [number, OscillatorType, number, number]> = {
        fire: [220, "sawtooth", 0.15, 0.1],
        hit:  [880, "sine",     0.25, 0.15],
        suck: [80,  "sawtooth", 0.4,  0.12],
        end:  [440, "sine",     0.6,  0.14],
      };
      const [freq, type, dur, vol] = configs[t];
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
    const reward = Math.min(Math.floor(rewardTokens * (finalScore / 60 + 0.35)), rewardTokens * 2);
    setTimeout(() => onComplete(reward, finalScore), 1800);
  }, [rewardTokens, onComplete, playSound]);

  const fireShot = useCallback((mx: number, my: number) => {
    const s = stateRef.current;
    if (phaseRef.current !== "playing" || s.shots <= 0) return;

    // Launch from left edge toward mouse direction
    const angle = Math.atan2(my - H / 2, mx - 20);
    const speed = 5.5;
    s.projectiles.push({
      id: ++_pid,
      x: 20, y: H / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      trail: [],
      dead: false,
    });
    s.shots--;
    setShots(s.shots);
    playSound("fire");

    if (s.shots <= 0) {
      setTimeout(() => {
        if (phaseRef.current === "playing") endGame(stateRef.current.score);
      }, 2000);
    }
  }, [playSound, endGame]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s   = stateRef.current;
    s.frame++;

    ctx.clearRect(0, 0, W, H);

    // Deep space BG
    const bg = ctx.createRadialGradient(BH_X, BH_Y, 10, BH_X, BH_Y, H);
    bg.addColorStop(0, "#000000");
    bg.addColorStop(0.3, "#02000a");
    bg.addColorStop(1, "#050010");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Starfield
    if (s.frame % 3 === 0) {
      for (let i = 0; i < 2; i++) {
        const sx = Math.random() * W, sy = Math.random() * H;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.4 + 0.1})`;
        ctx.fillRect(sx, sy, 1, 1);
      }
    }

    // Gravitational lensing rings
    [40, 70, 100, 140].forEach((r, i) => {
      ctx.save();
      ctx.strokeStyle = `rgba(139,92,246,${0.04 - i * 0.008})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(BH_X, BH_Y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    // Accretion disk glow
    const diskAngle = s.frame * 0.012;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2 + diskAngle;
      const r = BH_R + 6 + Math.sin(a * 3) * 4;
      const px = BH_X + Math.cos(a) * r;
      const py = BH_Y + Math.sin(a) * r * 0.35; // elliptical disk
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = `hsl(${20 + i * 3},100%,60%)`;
      ctx.shadowBlur = 6; ctx.shadowColor = "#f59e0b";
      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Black hole core
    ctx.save();
    const bhGrad = ctx.createRadialGradient(BH_X, BH_Y, 0, BH_X, BH_Y, BH_R * 2.5);
    bhGrad.addColorStop(0, "#000000");
    bhGrad.addColorStop(0.4, "#000000");
    bhGrad.addColorStop(1, "rgba(139,92,246,0)");
    ctx.fillStyle = bhGrad;
    ctx.shadowBlur = 40; ctx.shadowColor = "rgba(139,92,246,0.6)";
    ctx.beginPath(); ctx.arc(BH_X, BH_Y, BH_R * 2.5, 0, Math.PI * 2); ctx.fill();
    // Hard event horizon
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(BH_X, BH_Y, BH_R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Orbiting targets
    s.targets.forEach(t => {
      if (!t.hit) t.angle += t.orbitSpeed;
      const tx = BH_X + Math.cos(t.angle) * t.orbitR;
      const ty = BH_Y + Math.sin(t.angle) * t.orbitR * 0.75; // slight ellipse

      if (t.hit && Date.now() - t.hitAt > 500) return;

      ctx.save();
      if (t.hit) ctx.globalAlpha = Math.max(0, 1 - (Date.now() - t.hitAt) / 400);
      ctx.shadowBlur = 14; ctx.shadowColor = `hsla(${t.hue},100%,65%,0.8)`;
      ctx.strokeStyle = `hsla(${t.hue},100%,70%,0.9)`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tx, ty, t.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `hsla(${t.hue},80%,40%,0.4)`;
      ctx.beginPath(); ctx.arc(tx, ty, t.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Update + draw projectiles
    s.projectiles = s.projectiles.filter(p => {
      if (p.dead) return false;

      // Gravity toward black hole
      const dx = BH_X - p.x, dy = BH_Y - p.y;
      const dist2 = dx * dx + dy * dy;
      const dist  = Math.sqrt(dist2);
      const force = G_STRENGTH / dist2;
      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;

      // Clamp speed
      const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (spd > 14) { p.vx = (p.vx / spd) * 14; p.vy = (p.vy / spd) * 14; }

      p.trail.unshift({ x: p.x, y: p.y, a: 1 });
      if (p.trail.length > 30) p.trail.pop();

      p.x += p.vx; p.y += p.vy;

      // Swallowed by black hole
      if (dist < BH_R) { p.dead = true; playSound("suck"); return false; }

      // Off screen
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) { p.dead = true; return false; }

      // Target collision
      for (const t of s.targets) {
        if (t.hit) continue;
        const tx = BH_X + Math.cos(t.angle) * t.orbitR;
        const ty = BH_Y + Math.sin(t.angle) * t.orbitR * 0.75;
        const tdx = p.x - tx, tdy = p.y - ty;
        if (Math.sqrt(tdx * tdx + tdy * tdy) < t.r + 5) {
          t.hit = true; t.hitAt = Date.now();
          s.score += 15; setScore(s.score);
          s.explosions.push({ x: tx, y: ty, t: 0, hue: t.hue });
          playSound("hit");
          p.dead = true;

          // Level up if all targets hit
          if (s.targets.every(tt => tt.hit)) {
            s.level++;
            s.targets = mkTargets(s.level);
          }
          return false;
        }
      }

      // Draw trail
      p.trail.forEach((tr, i) => {
        const a = (1 - i / p.trail.length) * 0.7;
        const r = 3 * (1 - i / p.trail.length * 0.7);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle   = `hsla(${180 + i * 3},100%,70%,1)`;
        ctx.shadowBlur  = 6; ctx.shadowColor = "#06b6d4";
        ctx.beginPath(); ctx.arc(tr.x, tr.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Draw projectile
      ctx.save();
      ctx.shadowBlur = 16; ctx.shadowColor = "rgba(6,182,212,0.9)";
      ctx.fillStyle  = "#e0f2fe";
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      return true;
    });

    // Explosions
    s.explosions = s.explosions.filter(e => e.t < 1);
    s.explosions.forEach(e => {
      e.t += 0.07;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r = e.t * 30;
        ctx.save();
        ctx.globalAlpha = (1 - e.t) * 0.9;
        ctx.strokeStyle = `hsla(${e.hue},100%,70%,1)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(a) * r * 0.3, e.y + Math.sin(a) * r * 0.3);
        ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Aim line from launch point
    if (s.shots > 0 && phaseRef.current === "playing") {
      const mx = s.mouseX, my = s.mouseY;
      const angle = Math.atan2(my - H / 2, mx - 20);
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(20, H / 2);
      ctx.lineTo(20 + Math.cos(angle) * 60, H / 2 + Math.sin(angle) * 60);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Launch point indicator
      ctx.save();
      ctx.shadowBlur = 12; ctx.shadowColor = "#06b6d4";
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath(); ctx.arc(20, H / 2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Shot pips
    for (let i = 0; i < MAX_SHOTS; i++) {
      ctx.save();
      ctx.fillStyle = i < s.shots ? "rgba(6,182,212,0.8)" : "rgba(255,255,255,0.1)";
      if (i < s.shots) { ctx.shadowBlur = 6; ctx.shadowColor = "#06b6d4"; }
      ctx.beginPath(); ctx.arc(10, 20 + i * 14, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
  }, [playSound]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    stateRef.current.mouseX = (e.clientX - rect.left) * (W / rect.width);
    stateRef.current.mouseY = (e.clientY - rect.top - 44) * (H / rect.height);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top - 44) * (H / rect.height);
    fireShot(mx, my);
  }, [fireShot]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); if (phaseRef.current === "playing") endGame(stateRef.current.score); return 0; }
      return p - 1;
    }), 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(t); };
  }, [draw, endGame]);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "#000", cursor: "crosshair" }}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CircleDot className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <span className="text-[10px] font-black tracking-widest text-white/25">{shots} shots left</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        className="absolute bottom-0 left-0 right-0"
        style={{ width: "100%", height: "calc(100% - 44px)" }}
      />
      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(4px)" }}
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
          Click to fire · Gravity curves your shot
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