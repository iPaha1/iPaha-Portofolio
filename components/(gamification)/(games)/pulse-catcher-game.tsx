// =============================================================================
// GAME 12: PULSE CATCHER — Tap the ring at the perfect moment
// components/(gamification)/(games)/pulse-catcher-game.tsx
//
// Concept: A glowing ring expands from the centre. A thin "sweet zone" ring
// sits at a fixed radius. Tap when the expanding ring passes THROUGH the
// sweet zone — the closer to dead-centre, the more points.
// Multiple simultaneous pulses at different speeds. Score multiplier for
// consecutive perfect hits. Pure canvas, micro-second precision.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Zap, CircleDot } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 252;
const CX = W / 2;
const CY = H / 2;
const SWEET_R  = 80;   // radius of sweet zone ring
const ZONE_W   = 14;   // half-width of perfect zone

interface Pulse {
  id: number;
  r: number;        // current radius
  speed: number;    // px/frame
  maxR: number;
  color: string;
  glow: string;
  born: number;
}

let pId = 0;

function mkPulse(level: number): Pulse {
  const colors = [
    { c: "#f43f5e", g: "rgba(244,63,94,0.7)"  },
    { c: "#8b5cf6", g: "rgba(139,92,246,0.7)" },
    { c: "#06b6d4", g: "rgba(6,182,212,0.7)"  },
    { c: "#10b981", g: "rgba(16,185,129,0.7)" },
    { c: "#f59e0b", g: "rgba(245,158,11,0.7)" },
  ];
  const col = colors[Math.floor(Math.random() * colors.length)];
  return {
    id:    ++pId,
    r:     0,
    speed: 1.6 + level * 0.18 + Math.random() * 0.6,
    maxR:  SWEET_R + ZONE_W + 40,
    color: col.c,
    glow:  col.g,
    born:  Date.now(),
  };
}

export function PulseCatcherGame({
  gameId,
  rewardTokens,
  duration = 20,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef({
    pulses:   [] as Pulse[],
    score:    0,
    combo:    0,
    frame:    0,
    level:    0,
    alive:    true,
    hits:     [] as { r: number; acc: number; color: string; t: number }[],
  });
  const rafRef     = useRef<number>(0);
  const [score, setScore]     = useState(0);
  const [combo, setCombo]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]     = useState<"playing" | "done">("playing");
  const phaseRef = useRef<"playing" | "done">("playing");
  const levelRef = useRef(0);

  const playSound = useCallback((accuracy: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const freq = accuracy > 0.8 ? 1046 : accuracy > 0.5 ? 784 : accuracy > 0.2 ? 523 : 330;
      const type: OscillatorType = accuracy > 0.5 ? "sine" : "triangle";
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.16, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch {}
  }, [soundEnabled]);

  const handleTap = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const s = stateRef.current;

    // Find the pulse closest to SWEET_R
    let best: Pulse | null = null;
    let bestDist = Infinity;
    for (const p of s.pulses) {
      const dist = Math.abs(p.r - SWEET_R);
      if (dist < bestDist && p.r < SWEET_R + ZONE_W * 3) {
        bestDist = dist; best = p;
      }
    }

    if (!best || bestDist > ZONE_W * 3) {
      // Miss — tap with no ring nearby
      s.combo = 0; setCombo(0);
      return;
    }

    const accuracy = Math.max(0, 1 - bestDist / (ZONE_W * 3));
    const pts = Math.round(accuracy * 50 * (1 + s.combo * 0.2));
    s.score += pts; setScore(s.score);
    s.combo += 1;   setCombo(s.combo);

    // Visual hit feedback
    s.hits.push({ r: best.r, acc: accuracy, color: best.color, t: 0 });
    playSound(accuracy);

    // Remove tapped pulse
    s.pulses = s.pulses.filter(p => p.id !== best!.id);
  }, [playSound]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    s.frame++;
    s.level = Math.floor(s.score / 80);
    levelRef.current = s.level;

    ctx.clearRect(0, 0, W, H);

    // BG
    const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, H);
    bg.addColorStop(0, "#0d0820"); bg.addColorStop(1, "#050410");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Subtle concentric guide rings
    [40, 80, 120, 160].forEach(r => {
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${r === SWEET_R ? 0.18 : 0.04})`;
      ctx.lineWidth = r === SWEET_R ? 2 : 1;
      if (r === SWEET_R) { ctx.setLineDash([6, 6]); }
      ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // Sweet zone glow
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = ZONE_W * 0.6;
    ctx.shadowBlur = 14; ctx.shadowColor = "rgba(255,255,255,0.15)";
    ctx.beginPath(); ctx.arc(CX, CY, SWEET_R, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // "PERFECT" label
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = "bold 8px 'Sora', system-ui";
    ctx.textAlign = "center";
    ctx.fillText("PERFECT", CX + SWEET_R + 4, CY - 5);
    ctx.restore();

    // Spawn pulses — maintain 1-3 active
    const maxPulses = Math.min(1 + Math.floor(s.level / 2), 3);
    if (s.pulses.length < maxPulses && s.frame % Math.max(25, 50 - s.level * 3) === 0) {
      s.pulses.push(mkPulse(s.level));
    }

    // Update & draw pulses
    s.pulses = s.pulses.filter(p => p.r < p.maxR);
    s.pulses.forEach(p => {
      p.r += p.speed;
      const distToSweet = Math.abs(p.r - SWEET_R);
      const isNear = distToSweet < ZONE_W;
      ctx.save();
      ctx.shadowBlur   = isNear ? 28 : 12;
      ctx.shadowColor  = p.glow;
      ctx.strokeStyle  = p.color;
      ctx.lineWidth    = isNear ? 3.5 : 2;
      ctx.globalAlpha  = Math.max(0, 1 - p.r / p.maxR);
      ctx.beginPath(); ctx.arc(CX, CY, p.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    // Hit feedback bursts
    s.hits = s.hits.filter(h => h.t < 1);
    s.hits.forEach(h => {
      h.t += 0.08;
      const r = h.r + h.t * 20;
      ctx.save();
      ctx.globalAlpha = (1 - h.t) * 0.9;
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 4 * h.acc;
      ctx.shadowBlur = 20; ctx.shadowColor = h.color;
      ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke();
      // Score text
      const pts = Math.round(h.acc * 50);
      ctx.fillStyle = h.color;
      ctx.font = `bold ${10 + h.acc * 8}px 'Sora', system-ui`;
      ctx.textAlign = "center";
      ctx.fillText(`+${pts}`, CX, CY - h.r - 8 - h.t * 24);
      ctx.restore();
    });

    // Centre dot
    ctx.save();
    ctx.shadowBlur = 16; ctx.shadowColor = "rgba(255,255,255,0.8)";
    ctx.fillStyle  = "white";
    ctx.beginPath(); ctx.arc(CX, CY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          cancelAnimationFrame(rafRef.current);
          phaseRef.current = "done";
          setPhase("done");
          const reward = Math.min(Math.floor(rewardTokens * (stateRef.current.score / 200 + 0.4)), rewardTokens * 2);
          setTimeout(() => onComplete(reward, stateRef.current.score), 1800);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(t); };
  }, [draw, rewardTokens, onComplete]);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "#050410" }}
      onClick={handleTap}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CircleDot className="w-4 h-4 text-pink-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          {combo >= 2 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xs"
              style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)" }}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 font-black text-xs">{combo}× combo</span>
            </div>
          )}
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
        style={{ width: "100%", height: "calc(100% - 44px)", cursor: "crosshair" }}
      />

      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-pink-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">best combo: {combo}×</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          Tap when ring hits the dashed circle
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