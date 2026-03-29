// =============================================================================
// GAME 16: PARTICLE PAINTER — Paint the canvas with explosive bursts of colour
// components/(gamification)/(games)/particle-painter-game.tsx
//
// Concept: A dark canvas. Click/tap anywhere to explode a burst of 30+ neon
// particles that fan out, slow down, and settle — permanently staining the
// canvas with colour. A coverage meter tracks how much of the canvas you've
// painted. Hit 65% coverage before time runs out = big reward.
// Each burst is a different hue cycling through the spectrum.
// The more you paint, the more the canvas comes alive with colour.
// STUNNING visual — looks like a living aurora.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Sparkles } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 252;
const TARGET_COVERAGE = 0.62;
const SAMPLE_GRID = 32; // grid for coverage sampling

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  hue: number; sat: number; lit: number;
  alpha: number;
  decay: number;
  settled: boolean;
}

export function ParticlePainterGame({
  gameId, rewardTokens, duration = 22,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const paintRef     = useRef<HTMLCanvasElement>(null); // off-screen paint layer
  const stateRef     = useRef({
    particles: [] as Particle[],
    hue: 0,
    bursts: 0,
    coverage: 0,
    frame: 0,
    alive: true,
  });
  const rafRef       = useRef<number>(0);
  const [coverage, setCoverage] = useState(0);
  const [bursts, setBursts]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]       = useState<"playing" | "done">("playing");
  const phaseRef     = useRef<"playing" | "done">("playing");

  const playBurst = useCallback((hue: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Chord: root + fifth
      [1, 1.5].forEach((ratio, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine";
        o.frequency.value = 220 + (hue / 360) * 440 * ratio;
        g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.start(ctx.currentTime + i * 0.02);
        o.stop(ctx.currentTime + 0.3);
      });
    } catch {}
  }, [soundEnabled]);

  const spawnBurst = useCallback((x: number, y: number) => {
    const s = stateRef.current;
    if (phaseRef.current !== "playing") return;
    const hue = (s.hue + 22) % 360;
    s.hue = hue;
    s.bursts++;
    setBursts(s.bursts);
    playBurst(hue);

    // 35 particles per burst
    for (let i = 0; i < 35; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const speed  = 2 + Math.random() * 6;
      const spread = Math.random();
      s.particles.push({
        x, y,
        vx: Math.cos(angle) * speed * (0.5 + spread),
        vy: Math.sin(angle) * speed * (0.5 + spread) - 1.5,
        r: 3 + Math.random() * 5,
        hue: hue + (Math.random() - 0.5) * 40,
        sat: 80 + Math.random() * 20,
        lit: 55 + Math.random() * 20,
        alpha: 0.9 + Math.random() * 0.1,
        decay: 0.012 + Math.random() * 0.01,
        settled: false,
      });
    }
  }, [playBurst]);

  const sampleCoverage = useCallback(() => {
    const paint = paintRef.current; if (!paint) return 0;
    const ctx = paint.getContext("2d")!;
    const data = ctx.getImageData(0, 0, W, H).data;
    let painted = 0;
    const step = Math.floor(W * 4 / SAMPLE_GRID);
    const rowStep = Math.floor(H / SAMPLE_GRID);
    let total = 0;
    for (let row = 0; row < SAMPLE_GRID; row++) {
      for (let col = 0; col < SAMPLE_GRID; col++) {
        const px = (row * rowStep * W + col * Math.floor(W / SAMPLE_GRID)) * 4;
        if (data[px + 3] > 30) painted++;
        total++;
      }
    }
    return painted / total;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const paint  = paintRef.current;
    if (!canvas || !paint) return;
    const ctx  = canvas.getContext("2d")!;
    const pCtx = paint.getContext("2d")!;
    const s    = stateRef.current;
    s.frame++;

    // Clear display canvas
    ctx.clearRect(0, 0, W, H);

    // Draw dark BG
    ctx.fillStyle = "#06060e";
    ctx.fillRect(0, 0, W, H);

    // Draw paint layer on top
    ctx.drawImage(paint, 0, 0);

    // Update + draw active particles
    const toSettle: Particle[] = [];
    s.particles = s.particles.filter(p => {
      if (p.settled) return false;
      p.vx *= 0.93;
      p.vy *= 0.93;
      p.vy += 0.12; // subtle gravity
      p.x  += p.vx;
      p.y  += p.vy;
      p.alpha -= p.decay;

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (p.alpha <= 0.08 || speed < 0.3) {
        // Settle onto paint layer permanently
        pCtx.save();
        pCtx.globalAlpha = 0.85;
        pCtx.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lit}%,1)`;
        pCtx.shadowBlur = p.r * 2;
        pCtx.shadowColor = `hsla(${p.hue},100%,70%,0.6)`;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.restore();
        p.settled = true;
        return false;
      }

      // Draw active particle on display canvas
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lit}%,1)`;
      ctx.shadowBlur = p.r * 3;
      ctx.shadowColor = `hsla(${p.hue},100%,70%,0.8)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    });

    // Sample coverage every 30 frames
    if (s.frame % 30 === 0) {
      const cov = sampleCoverage();
      s.coverage = cov;
      setCoverage(cov);

      if (cov >= TARGET_COVERAGE && phaseRef.current === "playing") {
        phaseRef.current = "done";
        setPhase("done");
        cancelAnimationFrame(rafRef.current);
        const timeBonus = Math.round((timeLeft / duration) * rewardTokens * 0.5);
        const reward = Math.min(rewardTokens + timeBonus, rewardTokens * 2);
        setTimeout(() => onComplete(reward, Math.round(cov * 100)), 1800);
        return;
      }
    }

    // Ambient glow overlay near edges
    const vignette = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.8);
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Coverage target ring hint
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.setLineDash([]);
    ctx.restore();

    if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
  }, [sampleCoverage, duration, rewardTokens, onComplete, timeLeft]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    spawnBurst(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top - 44) * scaleY,
    );
  }, [spawnBurst]);

  useEffect(() => {
    // Init paint canvas
    const paint = document.createElement("canvas");
    paint.width = W; paint.height = H;
    (paintRef as any).current = paint;

    rafRef.current = requestAnimationFrame(draw);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          if (phaseRef.current === "playing") {
            phaseRef.current = "done";
            setPhase("done");
            cancelAnimationFrame(rafRef.current);
            const cov = stateRef.current.coverage;
            const reward = Math.floor(rewardTokens * Math.max(0.2, cov / TARGET_COVERAGE * 0.9));
            setTimeout(() => onComplete(Math.min(reward, rewardTokens * 2), Math.round(cov * 100)), 1800);
          }
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(t); };
  }, [draw, rewardTokens, onComplete]);

  const coveragePct = Math.round(coverage * 100);
  const targetPct   = Math.round(TARGET_COVERAGE * 100);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "#06060e", cursor: "crosshair" }}
      onClick={handleClick}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-white font-black text-sm">{coveragePct}%</span>
            <span className="text-white/25 text-[10px] font-black">/ {targetPct}% target</span>
          </div>
          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${Math.min(100, (coverage / TARGET_COVERAGE) * 100)}%` }}
              style={{ background: coverage >= TARGET_COVERAGE ? "#10b981" : `hsl(${stateRef.current?.hue ?? 0},80%,60%)` }}
            />
          </div>
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
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className={`w-14 h-14 mx-auto mb-3 ${coverage >= TARGET_COVERAGE ? "text-amber-400" : "text-pink-400"}`} />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{coveragePct}%</p>
              <p className="text-white/40 text-sm">{bursts} bursts · {coverage >= TARGET_COVERAGE ? "Canvas alive!" : `needed ${targetPct}%`}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          Click anywhere to paint · Fill {targetPct}% of the canvas
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