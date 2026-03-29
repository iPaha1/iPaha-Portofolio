// =============================================================================
// GAME 23: PLASMA SNAKE — Grow your plasma snake. Don't cross yourself.
// components/(gamification)/(games)/plasma-snake-game.tsx
//
// Concept: Classic snake reimagined with stunning plasma visuals on canvas.
// The snake is a gradient of shifting neon colours — each segment glows.
// Energy orbs pulse and attract the snake. Move with WASD / arrow keys OR
// swipe/tap directional zones on mobile. No grid — smooth continuous movement.
// The snake leaves a luminous trail. Crossing yourself creates a spectacular
// plasma implosion. Orbs give different scores based on rarity.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 256;
const SEG_SIZE = 12;
const MOVE_SPEED = 2.8;
const SNAKE_START_LEN = 6;

type Dir = "U" | "D" | "L" | "R";

interface Segment { x: number; y: number; }
interface Orb { id: number; x: number; y: number; r: number; value: number; hue: number; pulse: number; }
interface Explosion { x: number; y: number; t: number; }

let _oid = 0;
function mkOrb(level: number): Orb {
  const isRare = Math.random() < 0.2;
  return {
    id: ++_oid,
    x: 20 + Math.random() * (W - 40),
    y: 20 + Math.random() * (H - 40),
    r: isRare ? 10 : 7,
    value: isRare ? 25 : 10,
    hue: Math.random() * 360,
    pulse: Math.random() * Math.PI * 2,
  };
}

function initSnake(): Segment[] {
  return Array.from({ length: SNAKE_START_LEN }, (_, i) => ({
    x: W / 2 - i * SEG_SIZE,
    y: H / 2,
  }));
}

export function PlasmaSnakeGame({
  gameId, rewardTokens, duration = 25,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    snake:      initSnake(),
    dir:        "R" as Dir,
    nextDir:    "R" as Dir,
    orbs:       [mkOrb(0), mkOrb(0), mkOrb(0)],
    score:      0,
    frame:      0,
    alive:      true,
    level:      0,
    explosions: [] as Explosion[],
    hueShift:   0,
  });
  const rafRef    = useRef<number>(0);
  const [score, setScore]     = useState(0);
  const [length, setLength]   = useState(SNAKE_START_LEN);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]     = useState<"playing" | "done">("playing");
  const phaseRef  = useRef<"playing" | "done">("playing");

  const playSound = useCallback((t: "eat" | "eatRare" | "die" | "end") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const map: Record<string, [number, OscillatorType, number, number]> = {
        eat:     [660,  "sine",     0.12, 0.1 ],
        eatRare: [1046, "sine",     0.25, 0.14],
        die:     [80,   "sawtooth", 0.5,  0.18],
        end:     [440,  "sine",     0.5,  0.14],
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
    const reward = Math.min(Math.floor(rewardTokens * (finalScore / 80 + 0.35)), rewardTokens * 2);
    setTimeout(() => onComplete(reward, finalScore), 1800);
  }, [rewardTokens, onComplete, playSound]);

  const setDir = useCallback((d: Dir) => {
    const s = stateRef.current;
    const opposite: Record<Dir, Dir> = { U: "D", D: "U", L: "R", R: "L" };
    if (d !== opposite[s.dir]) s.nextDir = d;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s   = stateRef.current;
    s.frame++;
    s.hueShift = (s.hueShift + 0.8) % 360;

    ctx.clearRect(0, 0, W, H);

    // Deep BG
    ctx.fillStyle = "#050008";
    ctx.fillRect(0, 0, W, H);

    // Grid shimmer
    ctx.strokeStyle = "rgba(139,92,246,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (!s.alive) {
      // Draw explosions
      s.explosions = s.explosions.filter(e => e.t < 1);
      s.explosions.forEach(e => {
        e.t += 0.05;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const r = e.t * 50;
          ctx.save();
          ctx.globalAlpha = (1 - e.t) * 0.8;
          ctx.strokeStyle = `hsl(${280 + e.t * 60},100%,65%)`;
          ctx.lineWidth = 3 - e.t * 2;
          ctx.shadowBlur = 12; ctx.shadowColor = "#8b5cf6";
          ctx.beginPath();
          ctx.moveTo(e.x + Math.cos(a) * r * 0.2, e.y + Math.sin(a) * r * 0.2);
          ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
          ctx.stroke();
          ctx.restore();
        }
      });
      if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // Move snake
    s.dir = s.nextDir;
    const head = s.snake[0];
    const dx = s.dir === "R" ? MOVE_SPEED : s.dir === "L" ? -MOVE_SPEED : 0;
    const dy = s.dir === "D" ? MOVE_SPEED : s.dir === "U" ? -MOVE_SPEED : 0;
    const newHead = { x: head.x + dx, y: head.y + dy };

    // Wall wrap
    if (newHead.x < 0)  newHead.x = W;
    if (newHead.x > W)  newHead.x = 0;
    if (newHead.y < 0)  newHead.y = H;
    if (newHead.y > H)  newHead.y = 0;

    // Self-collision (skip first 8 segments — too close to head)
    for (let i = 8; i < s.snake.length; i++) {
      const seg = s.snake[i];
      const dx2 = newHead.x - seg.x, dy2 = newHead.y - seg.y;
      if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < SEG_SIZE * 0.8) {
        s.alive = false;
        playSound("die");
        s.explosions = s.snake.slice(0, 12).map((sg, i) => ({
          x: sg.x, y: sg.y, t: i * 0.06,
        }));
        endGame(s.score);
        break;
      }
    }
    if (!s.alive) {
      if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
      return;
    }

    s.snake.unshift(newHead);

    // Check orb collision
    let ate = false;
    s.orbs = s.orbs.filter(orb => {
      const odx = newHead.x - orb.x, ody = newHead.y - orb.y;
      if (Math.sqrt(odx * odx + ody * ody) < orb.r + SEG_SIZE / 2) {
        s.score += orb.value;
        setScore(s.score);
        setLength(s.snake.length);
        playSound(orb.value > 10 ? "eatRare" : "eat");
        // Grow by value/5 segments — don't trim
        ate = true;
        s.orbs.push(mkOrb(s.level));
        // Add glow explosion at orb
        s.explosions.push({ x: orb.x, y: orb.y, t: 0 });
        return false;
      }
      return true;
    });
    if (!ate) s.snake.pop();

    // Update orb pulses
    s.orbs.forEach(o => { o.pulse += 0.08; });

    // Draw orbs
    s.orbs.forEach(orb => {
      const pulseR = orb.r + Math.sin(orb.pulse) * 3;
      ctx.save();
      ctx.shadowBlur = 20 + Math.sin(orb.pulse) * 8;
      ctx.shadowColor = `hsla(${orb.hue},100%,65%,0.9)`;
      ctx.fillStyle = `hsla(${orb.hue},100%,70%,0.9)`;
      ctx.beginPath(); ctx.arc(orb.x, orb.y, pulseR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Inner bright core
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 10; ctx.shadowColor = "white";
      ctx.beginPath(); ctx.arc(orb.x, orb.y, pulseR * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Plasma explosions
    s.explosions = s.explosions.filter(e => e.t < 1);
    s.explosions.forEach(e => {
      if (e.t < 0) { e.t += 0.05; return; }
      e.t += 0.08;
      ctx.save();
      ctx.globalAlpha = (1 - e.t) * 0.7;
      ctx.strokeStyle = `hsl(${60 + e.t * 100},100%,70%)`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 16; ctx.shadowColor = "#f59e0b";
      ctx.beginPath(); ctx.arc(e.x, e.y, e.t * 20, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    // Draw snake with plasma gradient
    for (let i = s.snake.length - 1; i >= 0; i--) {
      const seg  = s.snake[i];
      const t    = i / s.snake.length;
      const hue  = (s.hueShift + i * 4) % 360;
      const size = SEG_SIZE * (i === 0 ? 1.2 : 1 - t * 0.3);
      ctx.save();
      const alpha = Math.max(0.2, 1 - t * 0.6);
      ctx.globalAlpha = alpha;
      ctx.shadowBlur  = i === 0 ? 22 : 10;
      ctx.shadowColor = `hsla(${hue},100%,65%,0.8)`;
      ctx.fillStyle   = `hsla(${hue},100%,${65 - t * 15}%,1)`;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Eyes on head
    const h  = s.snake[0];
    const ex1 = h.x + (s.dir === "U" || s.dir === "D" ? -3 : 0) + (s.dir === "R" ? 2 : -2);
    const ey1 = h.y + (s.dir === "U" ? -2 : s.dir === "D" ? 2 : -3);
    ctx.save();
    ctx.fillStyle = "white"; ctx.shadowBlur = 4; ctx.shadowColor = "white";
    ctx.beginPath(); ctx.arc(ex1, ey1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(ex1, ey1, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
  }, [playSound, endGame]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "U", w: "U", W: "U",
        ArrowDown: "D", s: "D", S: "D",
        ArrowLeft: "L", a: "L", A: "L",
        ArrowRight: "R", d: "R", D: "R",
      };
      if (map[e.key]) { e.preventDefault(); setDir(map[e.key]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDir]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); if (phaseRef.current === "playing") endGame(stateRef.current.score); return 0; }
      return p - 1;
    }), 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(t); };
  }, [draw, endGame]);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none" style={{ background: "#050008" }}>
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <span className="text-[10px] font-black tracking-widest text-white/25">length {length}</span>
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
      {/* Mobile swipe zones */}
      <div className="absolute inset-0 top-11 grid grid-cols-3 grid-rows-3 z-20 pointer-events-none md:hidden">
        {[["U"], ["U"], ["U"], ["L"], [], ["R"], ["D"], ["D"], ["D"]].map((dirs, i) =>
          dirs.length > 0 ? (
            <div key={i} className="pointer-events-auto opacity-0" onClick={() => setDir(dirs[0] as Dir)} />
          ) : <div key={i} />
        )}
      </div>
      <AnimatePresence>
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-violet-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">length {length} · plasma absorbed</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
          WASD / Arrow keys · Absorb orbs · Don't cross yourself
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