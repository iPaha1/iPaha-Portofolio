// =============================================================================
// GAME 28: QUANTUM COLLAPSE — Click particles to collapse their wave functions
// components/(gamification)/(games)/quantum-collapse-game.tsx
//
// Concept: The canvas is filled with quantum particles — each one is a
// PROBABILITY CLOUD (a glowing haze spread over a region). Click inside a
// cloud to COLLAPSE it to a single point, scoring based on how centred your
// click is. But clouds drift, overlap, and interact — click two overlapping
// clouds simultaneously and trigger ENTANGLEMENT: both collapse at once for
// bonus points. Clouds fade over time. The visual is genuinely otherworldly —
// like watching physics happen in real time. Pure canvas 60fps.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Atom, Sparkles } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 252;

interface Cloud {
  id: number;
  cx: number; cy: number;   // centre of probability cloud
  vx: number; vy: number;   // drift velocity
  radius: number;           // cloud spread radius
  hue: number;
  age: number;              // 0=fresh, 1=expired
  decayRate: number;
  collapsed: boolean;
  collapseX: number; collapseY: number;
  collapseT: number;        // 0..1 collapse animation
}

interface Ripple { x: number; y: number; r: number; a: number; hue: number; }
interface EntangleFlash { x1: number; y1: number; x2: number; y2: number; a: number; }

let _cid = 0;
function mkCloud(level: number): Cloud {
  return {
    id: ++_cid,
    cx: 40 + Math.random() * (W - 80),
    cy: 30 + Math.random() * (H - 60),
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.4,
    radius: 28 + Math.random() * 20,
    hue: Math.random() * 360,
    age: 0,
    decayRate: 0.0015 + level * 0.0003 + Math.random() * 0.001,
    collapsed: false,
    collapseX: 0, collapseY: 0,
    collapseT: 0,
  };
}

export function QuantumCollapseGame({
  gameId, rewardTokens, duration = 25,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef({
    clouds:    [] as Cloud[],
    ripples:   [] as Ripple[],
    entangles: [] as EntangleFlash[],
    score:     0,
    frame:     0,
    level:     0,
    alive:     true,
    collapsed: 0,
  });
  const rafRef     = useRef<number>(0);
  const [score, setScore]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]     = useState<"playing" | "done">("playing");
  const phaseRef  = useRef<"playing" | "done">("playing");

  const playSound = useCallback((t: "collapse" | "entangle" | "fade" | "end") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (t === "entangle") {
        // Magical shimmer chord
        [523, 659, 784, 1046].forEach((f, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine"; o.frequency.value = f;
          g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5 + i * 0.04);
          o.start(ctx.currentTime + i * 0.04);
          o.stop(ctx.currentTime + 0.5 + i * 0.04);
        });
        return;
      }
      const map: Record<string, [number, OscillatorType, number, number]> = {
        collapse: [660, "sine",     0.15, 0.12],
        fade:     [200, "sine",     0.3,  0.08],
        end:      [440, "sine",     0.6,  0.14],
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

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phaseRef.current !== "playing") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top - 44) * (H / rect.height);
    const s  = stateRef.current;

    // Find all clouds clicked
    const hits = s.clouds.filter(c => {
      if (c.collapsed || c.age >= 1) return false;
      const dx = mx - c.cx, dy = my - c.cy;
      return Math.sqrt(dx * dx + dy * dy) < c.radius;
    });

    if (hits.length === 0) return;

    // Collapse all hit clouds
    hits.forEach(c => {
      const dx = mx - c.cx, dy = my - c.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const accuracy = Math.max(0, 1 - dist / c.radius);
      const pts = Math.round(accuracy * 60 + 10);

      c.collapsed = true;
      c.collapseX = mx; c.collapseY = my;
      c.collapseT = 0;
      s.score += pts;
      s.collapsed++;
      setScore(s.score);

      s.ripples.push({ x: mx, y: my, r: 0, a: 1, hue: c.hue });
      playSound("collapse");
    });

    // Entanglement bonus: 2+ clouds hit simultaneously
    if (hits.length >= 2) {
      const bonus = hits.length * 50;
      s.score += bonus; setScore(s.score);
      playSound("entangle");
      // Flash line between clouds
      for (let i = 0; i < hits.length - 1; i++) {
        s.entangles.push({
          x1: hits[i].cx, y1: hits[i].cy,
          x2: hits[i + 1].cx, y2: hits[i + 1].cy,
          a: 1,
        });
      }
    }
  }, [playSound]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s   = stateRef.current;
    s.frame++;
    s.level = Math.floor(s.collapsed / 5);

    ctx.clearRect(0, 0, W, H);

    // Deep void background
    ctx.fillStyle = "#02010a";
    ctx.fillRect(0, 0, W, H);

    // Subtle quantum field grid
    ctx.save();
    ctx.strokeStyle = "rgba(139,92,246,0.04)"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();

    // Spawn clouds
    const maxClouds = Math.min(3 + s.level, 8);
    const activeClouds = s.clouds.filter(c => !c.collapsed && c.age < 1).length;
    if (activeClouds < maxClouds && s.frame % 40 === 0) {
      s.clouds.push(mkCloud(s.level));
    }

    // Update clouds
    s.clouds.forEach(c => {
      if (c.collapsed) {
        c.collapseT = Math.min(1, c.collapseT + 0.07);
        return;
      }
      c.cx += c.vx; c.cy += c.vy;
      // Bounce off walls
      if (c.cx - c.radius < 0 || c.cx + c.radius > W) c.vx *= -1;
      if (c.cy - c.radius < 0 || c.cy + c.radius > H) c.vy *= -1;
      c.age += c.decayRate;
      if (c.age >= 1 && !c.collapsed) playSound("fade");
    });
    s.clouds = s.clouds.filter(c => c.collapsed ? c.collapseT < 1 : c.age < 1);

    // Draw probability clouds
    s.clouds.forEach(c => {
      if (c.collapsed) {
        // Collapse animation — cloud shrinks to point then expands as ring
        const t = c.collapseT;
        const r = c.radius * (1 - t);
        if (r > 1) {
          ctx.save();
          ctx.globalAlpha = (1 - t) * 0.7;
          const cg = ctx.createRadialGradient(c.collapseX, c.collapseY, 0, c.collapseX, c.collapseY, r);
          cg.addColorStop(0, `hsla(${c.hue},100%,80%,0.9)`);
          cg.addColorStop(1, `hsla(${c.hue},100%,50%,0)`);
          ctx.fillStyle = cg;
          ctx.beginPath(); ctx.arc(c.collapseX, c.collapseY, r, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        return;
      }

      const opacity = Math.max(0, 1 - c.age);

      // Multi-layer probability haze
      for (let layer = 3; layer >= 0; layer--) {
        const lr = c.radius * (1 + layer * 0.3);
        const la = opacity * (0.2 - layer * 0.04);
        ctx.save();
        const cg = ctx.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, lr);
        cg.addColorStop(0, `hsla(${c.hue},100%,70%,${la * 1.5})`);
        cg.addColorStop(0.4, `hsla(${c.hue},100%,60%,${la})`);
        cg.addColorStop(1, `hsla(${c.hue},100%,50%,0)`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(c.cx, c.cy, lr, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Shimmering inner probability nodes
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + s.frame * 0.02;
        const nr = c.radius * 0.5 * (0.5 + 0.5 * Math.sin(s.frame * 0.03 + i));
        const nx = c.cx + Math.cos(a) * nr;
        const ny = c.cy + Math.sin(a) * nr;
        ctx.save();
        ctx.globalAlpha = opacity * 0.4;
        ctx.fillStyle = `hsl(${c.hue},100%,75%)`;
        ctx.shadowBlur = 6; ctx.shadowColor = `hsl(${c.hue},100%,60%)`;
        ctx.beginPath(); ctx.arc(nx, ny, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Centre bright node
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.shadowBlur = 16; ctx.shadowColor = `hsl(${c.hue},100%,70%)`;
      ctx.fillStyle = `hsl(${c.hue},100%,80%)`;
      ctx.beginPath(); ctx.arc(c.cx, c.cy, 4 + Math.sin(s.frame * 0.06) * 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Decay warning — flicker when nearly expired
      if (c.age > 0.7) {
        ctx.save();
        ctx.globalAlpha = (Math.sin(s.frame * 0.4) * 0.5 + 0.5) * (c.age - 0.7) * 3;
        ctx.strokeStyle = `hsl(${c.hue},100%,60%)`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.cx, c.cy, c.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    });

    // Entanglement lines
    s.entangles = s.entangles.filter(e => e.a > 0.02);
    s.entangles.forEach(e => {
      e.a *= 0.88;
      ctx.save();
      ctx.globalAlpha = e.a;
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 16; ctx.shadowColor = "#7c3aed";
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // Ripples
    s.ripples = s.ripples.filter(r => r.a > 0.02);
    s.ripples.forEach(r => {
      r.r += 3; r.a *= 0.87;
      ctx.save();
      ctx.globalAlpha = r.a;
      ctx.strokeStyle = `hsl(${r.hue},100%,70%)`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10; ctx.shadowColor = `hsl(${r.hue},100%,60%)`;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
  }, [playSound]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) {
        clearInterval(t); cancelAnimationFrame(rafRef.current);
        phaseRef.current = "done"; setPhase("done");
        playSound("end");
        const reward = Math.min(Math.floor(rewardTokens * (stateRef.current.score / 200 + 0.4)), rewardTokens * 2);
        setTimeout(() => onComplete(reward, stateRef.current.score), 1800);
        return 0;
      }
      return p - 1;
    }), 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(t); };
  }, [draw, playSound, rewardTokens, onComplete]);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "#02010a", cursor: "crosshair" }}
      onClick={handleClick}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Atom className="w-4 h-4 text-violet-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <span className="text-[10px] font-black tracking-widest text-white/25">{stateRef.current.collapsed} collapsed</span>
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
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-violet-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">{stateRef.current.collapsed} particles collapsed</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          Click clouds to collapse them · Hit 2 at once for entanglement bonus
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