// =============================================================================
// GAME 26: TIME FREEZE — Bullets fly. Tap to freeze time. Collect them all.
// components/(gamification)/(games)/time-freeze-game.tsx
//
// Concept: Glowing energy bullets stream across the canvas at high speed,
// each one a different colour and trajectory. You have a FREEZE ability —
// tap to stop ALL bullets for 2 seconds (everything freezes, particles hang
// mid-air). While frozen, tap each bullet to collect it. Missed bullets
// disappear. More bullets = harder. Freeze has a cooldown shown as a ring.
// The freeze moment is a jaw-dropping visual — the entire canvas crystallises.
// =============================================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Snowflake, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

const W = 420;
const H = 252;
const FREEZE_DURATION = 2200; // ms
const FREEZE_COOLDOWN = 5000; // ms

interface Bullet {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  hue: number;
  value: number;
  trail: { x: number; y: number }[];
  collected: boolean;
}

interface Shard { x: number; y: number; vx: number; vy: number; a: number; hue: number; }

let _bid = 0;
function mkBullet(level: number): Bullet {
  const fromLeft = Math.random() > 0.5;
  const isRare   = Math.random() < 0.15;
  const spd      = 3 + level * 0.4 + Math.random() * 2;
  const angle    = (Math.random() - 0.5) * 0.6;
  return {
    id: ++_bid,
    x:  fromLeft ? -12 : W + 12,
    y:  20 + Math.random() * (H - 40),
    vx: fromLeft ? spd * Math.cos(angle) : -spd * Math.cos(angle),
    vy: (Math.random() - 0.5) * 2,
    r:  isRare ? 10 : 6,
    hue: Math.random() * 360,
    value: isRare ? 30 : 10,
    trail: [],
    collected: false,
  };
}

export function TimeFreezeGame({
  gameId, rewardTokens, duration = 22,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const stateRef      = useRef({
    bullets:    [] as Bullet[],
    shards:     [] as Shard[],
    frozen:     false,
    freezeEnd:  0,
    cooldownEnd:0,
    score:      0,
    frame:      0,
    level:      0,
    alive:      true,
    freezeRing: 1, // 0-1 cooldown progress
    crystals:   [] as { x: number; y: number; a: number }[],
  });
  const rafRef        = useRef<number>(0);
  const [score, setScore]       = useState(0);
  const [frozen, setFrozen]     = useState(false);
  const [cooldown, setCooldown] = useState(0); // 0=ready, 1=full cooldown
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase]       = useState<"playing" | "done">("playing");
  const phaseRef  = useRef<"playing" | "done">("playing");

  const playSound = useCallback((t: "freeze" | "collect" | "thaw" | "end" | "cooldown") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const map: Record<string, [number, OscillatorType, number, number]> = {
        freeze:   [220, "sine",     0.3,  0.15],
        collect:  [880, "sine",     0.12, 0.1],
        thaw:     [440, "sawtooth", 0.2,  0.1],
        end:      [660, "sine",     0.5,  0.14],
        cooldown: [300, "triangle", 0.1,  0.06],
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

  const triggerFreeze = useCallback(() => {
    const s = stateRef.current;
    const now = Date.now();
    if (s.frozen || now < s.cooldownEnd || phaseRef.current !== "playing") return;
    s.frozen = true;
    s.freezeEnd  = now + FREEZE_DURATION;
    s.cooldownEnd = now + FREEZE_DURATION + FREEZE_COOLDOWN;
    setFrozen(true);
    playSound("freeze");

    // Spawn crystal effects
    for (let i = 0; i < 20; i++) {
      s.crystals.push({ x: Math.random() * W, y: Math.random() * H, a: 1 });
    }

    setTimeout(() => {
      s.frozen = false;
      setFrozen(false);
      playSound("thaw");
    }, FREEZE_DURATION);
  }, [playSound]);

  const collectBullet = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    if (!s.frozen) {
      triggerFreeze();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top - 44) * (H / rect.height);

    let hit = false;
    s.bullets.forEach(b => {
      if (b.collected) return;
      const dx = mx - b.x, dy = my - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < b.r + 12) {
        b.collected = true;
        s.score += b.value; setScore(s.score);
        playSound("collect");
        // Shards
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          s.shards.push({ x: b.x, y: b.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, a: 1, hue: b.hue });
        }
        hit = true;
      }
    });
  }, [triggerFreeze, playSound]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s   = stateRef.current;
    const now = Date.now();
    s.frame++;
    s.level = Math.floor(s.score / 100);

    ctx.clearRect(0, 0, W, H);

    // BG — shifts to icy blue when frozen
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    if (s.frozen) {
      bg.addColorStop(0, "#020a14"); bg.addColorStop(1, "#030e1c");
    } else {
      bg.addColorStop(0, "#08020e"); bg.addColorStop(1, "#0e0418");
    }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Frozen overlay
    if (s.frozen) {
      ctx.save();
      ctx.fillStyle = "rgba(6,182,212,0.07)";
      ctx.fillRect(0, 0, W, H);
      // Crystal grid shimmer
      ctx.strokeStyle = "rgba(6,182,212,0.06)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 18) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();
    }

    // Spawn bullets
    const maxBullets = Math.min(6 + s.level * 2, 18);
    if (!s.frozen && s.bullets.filter(b => !b.collected).length < maxBullets && s.frame % 18 === 0) {
      s.bullets.push(mkBullet(s.level));
    }

    // Update bullets
    if (!s.frozen) {
      s.bullets.forEach(b => {
        if (b.collected) return;
        b.trail.unshift({ x: b.x, y: b.y });
        if (b.trail.length > 10) b.trail.pop();
        b.x += b.vx; b.y += b.vy;
      });
      // Remove off-screen
      s.bullets = s.bullets.filter(b => b.collected || (b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30));
    }

    // Draw bullets
    s.bullets.forEach(b => {
      if (b.collected) return;
      // Trail
      if (!s.frozen) {
        b.trail.forEach((t, i) => {
          ctx.save();
          ctx.globalAlpha = (1 - i / b.trail.length) * 0.4;
          ctx.fillStyle = `hsl(${b.hue},100%,65%)`;
          ctx.beginPath(); ctx.arc(t.x, t.y, b.r * (1 - i / b.trail.length * 0.8), 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        });
      }
      // Bullet body
      ctx.save();
      ctx.shadowBlur = s.frozen ? 22 : 14;
      ctx.shadowColor = `hsl(${b.hue},100%,65%)`;
      ctx.fillStyle = `hsl(${b.hue},100%,70%)`;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      // Frozen crystal effect
      if (s.frozen) {
        ctx.strokeStyle = "rgba(6,182,212,0.8)"; ctx.lineWidth = 2;
        ctx.shadowColor = "#06b6d4"; ctx.shadowBlur = 10;
        ctx.stroke();
        // Six-pointed ice spike
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * b.r, b.y + Math.sin(a) * b.r);
          ctx.lineTo(b.x + Math.cos(a) * (b.r + 6), b.y + Math.sin(a) * (b.r + 6));
          ctx.stroke();
        }
      }
      ctx.restore();
      // Value label
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `bold ${b.value > 10 ? 10 : 8}px Sora,system-ui`;
      ctx.textAlign = "center";
      ctx.fillText(`+${b.value}`, b.x, b.y - b.r - 4);
      ctx.restore();
    });

    // Shards
    s.shards = s.shards.filter(sh => sh.a > 0.05);
    s.shards.forEach(sh => {
      sh.x += sh.vx; sh.y += sh.vy; sh.vx *= 0.9; sh.vy *= 0.9; sh.a *= 0.85;
      ctx.save();
      ctx.globalAlpha = sh.a;
      ctx.fillStyle = `hsl(${sh.hue},100%,70%)`;
      ctx.shadowBlur = 8; ctx.shadowColor = `hsl(${sh.hue},100%,65%)`;
      ctx.beginPath(); ctx.arc(sh.x, sh.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Crystal sparkles
    s.crystals = s.crystals.filter(c => c.a > 0.05);
    s.crystals.forEach(c => {
      c.a -= 0.04;
      ctx.save();
      ctx.globalAlpha = c.a * 0.6;
      ctx.strokeStyle = "#06b6d4"; ctx.lineWidth = 1;
      const sz = 5;
      ctx.beginPath();
      ctx.moveTo(c.x - sz, c.y); ctx.lineTo(c.x + sz, c.y);
      ctx.moveTo(c.x, c.y - sz); ctx.lineTo(c.x, c.y + sz);
      ctx.moveTo(c.x - sz * 0.7, c.y - sz * 0.7); ctx.lineTo(c.x + sz * 0.7, c.y + sz * 0.7);
      ctx.moveTo(c.x + sz * 0.7, c.y - sz * 0.7); ctx.lineTo(c.x - sz * 0.7, c.y + sz * 0.7);
      ctx.stroke();
      ctx.restore();
    });

    // Cooldown ring (bottom right)
    const cdProgress = s.frozen
      ? 0
      : now > s.cooldownEnd
      ? 1
      : Math.max(0, 1 - (s.cooldownEnd - now) / FREEZE_COOLDOWN);
    setCooldown(1 - cdProgress);

    ctx.save();
    const rx = W - 24, ry = H - 24;
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(rx, ry, 16, 0, Math.PI * 2); ctx.stroke();
    if (cdProgress > 0) {
      ctx.strokeStyle = s.frozen ? "#06b6d4" : "rgba(6,182,212,0.8)";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 8; ctx.shadowColor = "#06b6d4";
      ctx.beginPath();
      ctx.arc(rx, ry, 16, -Math.PI / 2, -Math.PI / 2 + cdProgress * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) {
        clearInterval(t);
        phaseRef.current = "done"; setPhase("done");
        cancelAnimationFrame(rafRef.current);
        playSound("end");
        const reward = Math.min(Math.floor(rewardTokens * (stateRef.current.score / 150 + 0.4)), rewardTokens * 2);
        setTimeout(() => onComplete(reward, stateRef.current.score), 1800);
        return 0;
      }
      return p - 1;
    }), 1000);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(t); };
  }, [draw, playSound, rewardTokens, onComplete]);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "#08020e", cursor: frozen ? "crosshair" : "pointer" }}
      onClick={collectBullet}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Snowflake className={`w-4 h-4 ${frozen ? "text-cyan-400 animate-spin" : "text-white/30"}`} />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          {frozen && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="px-2 py-0.5 rounded-xs text-xs font-black text-cyan-300 animate-pulse"
              style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.4)" }}
            >TIME FROZEN</motion.div>
          )}
          {!frozen && cooldown > 0 && (
            <span className="text-[10px] font-black text-white/20">Cooldown...</span>
          )}
          {!frozen && cooldown === 0 && (
            <span className="text-[10px] font-black text-cyan-400/60">Tap to FREEZE</span>
          )}
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
              <Trophy className="w-14 h-14 text-cyan-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">bullets collected</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isFlash && (
        <div className="absolute top-11 right-3 z-20 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse"
          style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fcd34d" }}
        >⚡ FLASH</div>
      )}
    </div>
  );
}