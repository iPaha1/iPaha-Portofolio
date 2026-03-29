// =============================================================================
// GAME 25: NEON PINBALL — Full physics pinball with glowing flippers
// components/(gamification)/(games)/neon-pinball-game.tsx
//
// Concept: A full pinball machine in a canvas. Two glowing flippers at the
// bottom controlled by left/right click or A/D keys. Bumpers in the middle
// that explode with neon light on contact. The ball has real physics —
// gravity, bouncing, flipper launch velocity. Score bumpers, keep the ball
// alive. The visual: deep purple space, neon cyan ball, electric flippers.
// Every bumper hit sends out a shockwave ring. The sound design is arcade-perfect.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const W  = 300;
const H  = 380;
const BALL_R   = 8;
const GRAVITY  = 0.28;
const FLIPPER_W = 55;
const FLIPPER_H = 7;
const FLIPPER_Y = H - 38;
const L_PIVOT_X = 52;
const R_PIVOT_X = W - 52;
const FLIPPER_REST = 28;  // deg down from horizontal
const FLIPPER_UP   = -28; // deg up

interface Bumper { x: number; y: number; r: number; hue: number; lit: number; }
interface Ring   { x: number; y: number; r: number; a: number; hue: number; }

function mkBumpers(): Bumper[] {
  return [
    { x: 100, y: 120, r: 18, hue: 280, lit: 0 },
    { x: 200, y: 140, r: 18, hue: 160, lit: 0 },
    { x: 150, y: 200, r: 18, hue: 40,  lit: 0 },
    { x:  80, y: 230, r: 14, hue: 340, lit: 0 },
    { x: 220, y: 210, r: 14, hue: 200, lit: 0 },
  ];
}

export function NeonPinballGame({
  gameId, rewardTokens, duration = 35,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    bx: W / 2, by: 80,
    vx: (Math.random() - 0.5) * 3, vy: 1,
    lFlipperAngle: FLIPPER_REST,
    rFlipperAngle: -FLIPPER_REST,
    lDown: false, rDown: false,
    bumpers: mkBumpers(),
    rings: [] as Ring[],
    score: 0,
    balls: 3,
    alive: true,
    frame: 0,
    launching: true,
  });
  const rafRef    = useRef<number>(0);
  const [score, setScore]     = useState(0);
  const [balls, setBalls]     = useState(3);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]     = useState<"playing" | "done">("playing");
  const phaseRef  = useRef<"playing" | "done">("playing");

  const playSound = useCallback((t: "bump" | "flip" | "lose" | "launch" | "end") => {
    if (!soundEnabled) return;
    try {
      const c = new (window.AudioContext || (window as any).webkitAudioContext)();
      const configs: Record<string, [number, OscillatorType, number, number]> = {
        bump:   [660, "sine",     0.15, 0.12],
        flip:   [330, "triangle", 0.08, 0.07],
        lose:   [110, "sawtooth", 0.5,  0.16],
        launch: [220, "sine",     0.2,  0.1],
        end:    [440, "sine",     0.6,  0.14],
      };
      const [freq, type, dur, vol] = configs[t];
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(); o.stop(c.currentTime + dur);
    } catch {}
  }, [soundEnabled]);

  const resetBall = useCallback(() => {
    const s = stateRef.current;
    s.bx = W / 2; s.by = 60;
    s.vx = (Math.random() - 0.5) * 2; s.vy = 1;
    s.launching = true;
    playSound("launch");
  }, [playSound]);

  const endGame = useCallback((finalScore: number) => {
    cancelAnimationFrame(rafRef.current);
    phaseRef.current = "done"; setPhase("done");
    playSound("end");
    const reward = Math.min(Math.floor(rewardTokens * (finalScore / 300 + 0.3)), rewardTokens * 2);
    setTimeout(() => onComplete(reward, finalScore), 1800);
  }, [rewardTokens, onComplete, playSound]);

  // Rotate a point around pivot
  const rotatePt = (px: number, py: number, cx: number, cy: number, angleDeg: number) => {
    const a = angleDeg * Math.PI / 180;
    const dx = px - cx, dy = py - cy;
    return {
      x: cx + dx * Math.cos(a) - dy * Math.sin(a),
      y: cy + dx * Math.sin(a) + dy * Math.cos(a),
    };
  };

  // Check circle-vs-line-segment collision
  const circleVsLine = (
    bx: number, by: number, r: number,
    x1: number, y1: number, x2: number, y2: number
  ) => {
    const dx = x2 - x1, dy = y2 - y1;
    const t  = Math.max(0, Math.min(1, ((bx - x1) * dx + (by - y1) * dy) / (dx * dx + dy * dy)));
    const cx = x1 + t * dx, cy = y1 + t * dy;
    const dist = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2);
    return { hit: dist < r, cx, cy, dist };
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s   = stateRef.current;
    s.frame++;

    ctx.clearRect(0, 0, W, H);

    // BG
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#06020e"); bg.addColorStop(1, "#0a0418");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Walls glow
    ctx.save();
    ctx.strokeStyle = "rgba(139,92,246,0.3)"; ctx.lineWidth = 3;
    ctx.shadowBlur = 12; ctx.shadowColor = "rgba(139,92,246,0.5)";
    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.restore();

    // Lane guides
    ctx.save();
    ctx.strokeStyle = "rgba(139,92,246,0.06)"; ctx.lineWidth = 1;
    [60, 90, W - 60, W - 90].forEach(x => {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.4); ctx.stroke();
    });
    ctx.restore();

    // Target lines top
    for (let i = 0; i < 5; i++) {
      const lx = 40 + i * 50;
      ctx.save();
      ctx.strokeStyle = `rgba(6,182,212,0.4)`; ctx.lineWidth = 4;
      ctx.shadowBlur = 8; ctx.shadowColor = "#06b6d4";
      ctx.beginPath(); ctx.moveTo(lx, 30); ctx.lineTo(lx + 22, 30); ctx.stroke();
      ctx.restore();
    }

    // Flipper logic
    const targetL = s.lDown ? FLIPPER_UP : FLIPPER_REST;
    const targetR = s.rDown ? -FLIPPER_UP : -FLIPPER_REST;
    const speed = 12;
    s.lFlipperAngle += (targetL - s.lFlipperAngle) * 0.35;
    s.rFlipperAngle += (targetR - s.rFlipperAngle) * 0.35;

    // Draw flippers
    const drawFlipper = (pivotX: number, angle: number, dir: 1 | -1) => {
      const tipX = pivotX + dir * FLIPPER_W;
      const tipY = FLIPPER_Y;
      const rPivot = { x: pivotX, y: FLIPPER_Y };
      const rTip   = rotatePt(tipX, tipY, pivotX, FLIPPER_Y, angle);

      ctx.save();
      ctx.shadowBlur = 20; ctx.shadowColor = "rgba(6,182,212,0.9)";
      ctx.strokeStyle = "#06b6d4"; ctx.lineWidth = FLIPPER_H;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(rPivot.x, rPivot.y);
      ctx.lineTo(rTip.x, rTip.y);
      ctx.stroke();
      // Bright tip
      ctx.fillStyle = "#e0f2fe";
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(rTip.x, rTip.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    drawFlipper(L_PIVOT_X, s.lFlipperAngle, 1);
    drawFlipper(R_PIVOT_X, s.rFlipperAngle, -1);

    // Physics
    s.vy += GRAVITY;
    s.bx += s.vx; s.by += s.vy;

    // Wall bounce
    if (s.bx - BALL_R < 2)  { s.bx = BALL_R + 2;    s.vx = Math.abs(s.vx) * 0.85; }
    if (s.bx + BALL_R > W - 2) { s.bx = W - BALL_R - 2; s.vx = -Math.abs(s.vx) * 0.85; }
    if (s.by - BALL_R < 2)  { s.by = BALL_R + 2;    s.vy = Math.abs(s.vy) * 0.7; }

    // Top sensor (score)
    if (s.by < 35 && s.by > 25) {
      s.score += 5; setScore(s.score);
    }

    // Flipper collision
    const checkFlipper = (pivotX: number, angle: number, dir: 1 | -1) => {
      const tipX = pivotX + dir * FLIPPER_W;
      const rTip = rotatePt(tipX, FLIPPER_Y, pivotX, FLIPPER_Y, angle);
      const { hit, cx, cy } = circleVsLine(s.bx, s.by, BALL_R + FLIPPER_H / 2, pivotX, FLIPPER_Y, rTip.x, rTip.y);
      if (hit) {
        const nx = s.bx - cx, ny = s.by - cy;
        const len = Math.sqrt(nx * nx + ny * ny) || 1;
        const flipSpeed = s.lDown || s.rDown ? 8 : 2;
        s.vx = (nx / len) * flipSpeed;
        s.vy = (ny / len) * flipSpeed - (s.lDown || s.rDown ? 4 : 0);
        s.by = cy + (ny / len) * (BALL_R + FLIPPER_H / 2 + 1);
        playSound("flip");
      }
    };
    checkFlipper(L_PIVOT_X, s.lFlipperAngle, 1);
    checkFlipper(R_PIVOT_X, s.rFlipperAngle, -1);

    // Bumper collision
    s.bumpers.forEach(b => {
      const dx = s.bx - b.x, dy = s.by - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.r + BALL_R) {
        const nx = dx / dist, ny = dy / dist;
        const spd = Math.sqrt(s.vx ** 2 + s.vy ** 2);
        s.vx = nx * Math.max(spd, 5) * 1.1;
        s.vy = ny * Math.max(spd, 5) * 1.1;
        s.bx = b.x + nx * (b.r + BALL_R + 1);
        s.by = b.y + ny * (b.r + BALL_R + 1);
        b.lit = 1;
        s.score += 25; setScore(s.score);
        s.rings.push({ x: b.x, y: b.y, r: b.r, a: 1, hue: b.hue });
        playSound("bump");
      }
      if (b.lit > 0) b.lit -= 0.08;
    });

    // Draw bumpers
    s.bumpers.forEach(b => {
      ctx.save();
      const glow = Math.max(0.2, b.lit);
      ctx.shadowBlur = 16 + b.lit * 20; ctx.shadowColor = `hsla(${b.hue},100%,65%,0.9)`;
      ctx.fillStyle = `hsla(${b.hue},100%,${40 + b.lit * 30}%,1)`;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `hsla(${b.hue},100%,75%,0.9)`; ctx.lineWidth = 2;
      ctx.stroke();
      // Inner dot
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Shockwave rings
    s.rings = s.rings.filter(r => r.a > 0.05);
    s.rings.forEach(r => {
      r.r += 3; r.a *= 0.88;
      ctx.save();
      ctx.globalAlpha = r.a;
      ctx.strokeStyle = `hsla(${r.hue},100%,70%,1)`;
      ctx.shadowBlur  = 12; ctx.shadowColor = `hsla(${r.hue},100%,70%,0.7)`;
      ctx.lineWidth   = 2;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    // Ball trail
    for (let i = 0; i < 5; i++) {
      const tx = s.bx - s.vx * i * 0.7;
      const ty = s.by - s.vy * i * 0.7;
      ctx.save();
      ctx.globalAlpha = 0.15 - i * 0.025;
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath(); ctx.arc(tx, ty, BALL_R * (1 - i * 0.12), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Ball
    ctx.save();
    ctx.shadowBlur = 20; ctx.shadowColor = "rgba(224,242,254,0.9)";
    const ballGrad = ctx.createRadialGradient(s.bx - 2, s.by - 2, 1, s.bx, s.by, BALL_R);
    ballGrad.addColorStop(0, "#e0f2fe"); ballGrad.addColorStop(1, "#0284c7");
    ctx.fillStyle = ballGrad;
    ctx.beginPath(); ctx.arc(s.bx, s.by, BALL_R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Ball lost
    if (s.by > H + 20) {
      s.balls--;
      setBalls(s.balls);
      playSound("lose");
      if (s.balls <= 0) { endGame(s.score); return; }
      resetBall();
    }

    if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
  }, [playSound, endGame, resetBall]);

  // Controls
  const setFlip = useCallback((side: "L" | "R", down: boolean) => {
    if (side === "L") stateRef.current.lDown = down;
    else              stateRef.current.rDown = down;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft")  setFlip("L", down);
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") setFlip("R", down);
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [setFlip]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); if (phaseRef.current === "playing") endGame(stateRef.current.score); return 0; }
      return p - 1;
    }), 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(t); };
  }, [draw, endGame]);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none flex"
      style={{ background: "#06020e" }}
    >
      {/* Score panel left */}
      <div className="flex flex-col items-center justify-start pt-12 px-3 gap-3 z-10"
        style={{ minWidth: "70px", background: "rgba(0,0,0,0.4)", borderRight: "1px solid rgba(139,92,246,0.15)" }}
      >
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>{score}</span>
        </div>
        <div className="flex flex-col gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: i < balls ? "#06b6d4" : "rgba(255,255,255,0.1)", boxShadow: i < balls ? "0 0 6px #06b6d4" : "none" }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Timer className="w-3 h-3 text-blue-400" />
          <span className="text-white font-mono font-black text-xs">{timeLeft}s</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 flex flex-col">
        <canvas ref={canvasRef} width={W} height={H}
          style={{ width: "100%", height: "100%" }}
        />
        {/* Mobile flipper buttons */}
        <div className="absolute bottom-0 left-0 right-0 flex z-10" style={{ height: "60px" }}>
          <button
            className="flex-1 flex items-end justify-start pb-2 pl-3 text-cyan-400/40 font-black text-xs tracking-widest uppercase"
            style={{ background: "transparent" }}
            onPointerDown={() => setFlip("L", true)}
            onPointerUp={() => setFlip("L", false)}
            onPointerLeave={() => setFlip("L", false)}
          >← Left</button>
          <button
            className="flex-1 flex items-end justify-end pb-2 pr-3 text-cyan-400/40 font-black text-xs tracking-widest uppercase"
            style={{ background: "transparent" }}
            onPointerDown={() => setFlip("R", true)}
            onPointerUp={() => setFlip("R", false)}
            onPointerLeave={() => setFlip("R", false)}
          >Right →</button>
        </div>
      </div>

      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-cyan-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">neon pinball</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isFlash && (
        <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse"
          style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fcd34d" }}
        >⚡ FLASH</div>
      )}
    </div>
  );
}