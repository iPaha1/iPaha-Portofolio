// =============================================================================
// GAME TEASER SECTION — Homepage Component
// components/_home/game-teaser-section.tsx
//
// A dark, editorial homepage section that:
//  • Teases the gamification system with a live playable mini-game
//  • Shows token balance, recent game types as animated cards
//  • Drives visitors to /games page
//  • Matches the hero's #0a0a0c dark canvas + amber accent system
//  • Fully responsive — single column on mobile, asymmetric on desktop
// =============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ArrowRight, Coins, Gamepad2, Target,
  Star, Gift, Brain, Rocket, CircleDot, Flame,
} from "lucide-react";

// ─── Mini Teaser Game: Reaction Dots ─────────────────────────────────────────
// A simplified pulse-catcher. A ring expands from centre. Tap at the right
// moment. No import dependencies — self-contained canvas game.

const CANVAS_W = 340;
const CANVAS_H = 200;
const SWEET_R  = 68;
const ZONE_W   = 16;

function useTeaserGame(canvasRef: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  const stateRef = useRef({
    ring: 0, speed: 1.4, phase: 0, score: 0,
    hits: [] as { r: number; acc: number; t: number }[],
    frame: 0, combo: 0,
  });
  const rafRef   = useRef<number>(0);
  const [score, setScore]   = useState(0);
  const [combo, setCombo]   = useState(0);
  const [flash, setFlash]   = useState<"perfect" | "good" | "miss" | null>(null);

  const tap = useCallback(() => {
    const s = stateRef.current;
    const dist = Math.abs(s.ring - SWEET_R);
    const acc  = Math.max(0, 1 - dist / (ZONE_W * 3));
    if (acc > 0.1) {
      const pts = Math.round(acc * 30 * (1 + s.combo * 0.15));
      s.score += pts; s.combo++;
      setScore(s.score); setCombo(s.combo);
      s.hits.push({ r: s.ring, acc, t: 0 });
      setFlash(acc > 0.75 ? "perfect" : "good");
    } else {
      s.combo = 0; setCombo(0);
      setFlash("miss");
    }
    s.ring = 0;
    setTimeout(() => setFlash(null), 600);
  }, []);

  useEffect(() => {
    if (!active) return;
    const draw = () => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const s   = stateRef.current;
      s.frame++; s.phase += 0.03;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // BG
      ctx.fillStyle = "#06060e";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid
      ctx.strokeStyle = "rgba(139,92,246,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 34) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); ctx.stroke(); }
      for (let y = 0; y < CANVAS_H; y += 34) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_W,y); ctx.stroke(); }

      const cx = CANVAS_W / 2, cy = CANVAS_H / 2;

      // Guide rings
      [30, 50, 68, 90, 115].forEach(r => {
        ctx.save();
        ctx.strokeStyle = r === SWEET_R ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.04)";
        ctx.lineWidth   = r === SWEET_R ? 1.5 : 1;
        if (r === SWEET_R) ctx.setLineDash([5, 7]);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // Sweet zone glow band
      ctx.save();
      ctx.strokeStyle = "rgba(245,158,11,0.12)";
      ctx.lineWidth = ZONE_W;
      ctx.shadowBlur = 10; ctx.shadowColor = "rgba(245,158,11,0.15)";
      ctx.beginPath(); ctx.arc(cx, cy, SWEET_R, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // Advance ring
      s.ring += s.speed;
      if (s.ring > SWEET_R + ZONE_W * 3 + 20) {
        s.ring = 0; s.combo = 0; setCombo(0);
      }
      s.speed = 1.4 + Math.floor(s.score / 60) * 0.15;

      // Draw expanding ring
      const dist = Math.abs(s.ring - SWEET_R);
      const near = dist < ZONE_W;
      const cols = ["#f43f5e","#8b5cf6","#06b6d4","#10b981","#f59e0b"];
      const col  = cols[Math.floor(s.frame / 40) % cols.length];
      ctx.save();
      ctx.strokeStyle = near ? col : `${col}88`;
      ctx.lineWidth   = near ? 3.5 : 2;
      ctx.shadowBlur  = near ? 24 : 8;
      ctx.shadowColor = col;
      ctx.globalAlpha = Math.max(0, 1 - s.ring / (SWEET_R + ZONE_W * 3 + 20));
      ctx.beginPath(); ctx.arc(cx, cy, s.ring, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // Hit feedback
      s.hits = s.hits.filter(h => h.t < 1);
      s.hits.forEach(h => {
        h.t += 0.07;
        ctx.save();
        ctx.globalAlpha = (1 - h.t) * 0.9;
        ctx.strokeStyle = h.acc > 0.75 ? "#f59e0b" : "#06b6d4";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 16; ctx.shadowColor = h.acc > 0.75 ? "#f59e0b" : "#06b6d4";
        ctx.beginPath(); ctx.arc(cx, cy, h.r + h.t * 20, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      });

      // Centre dot
      ctx.save();
      ctx.shadowBlur = 14; ctx.shadowColor = "rgba(245,158,11,0.9)";
      ctx.fillStyle  = "#f59e0b";
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, canvasRef]);

  return { score, combo, tap, flash };
}

// ─── Game type cards data ─────────────────────────────────────────────────────
const GAME_CARDS = [
  { icon: Target,    name: "Click Hunt",       color: "#ef4444", tokens: "5–10" },
  { icon: Brain,     name: "Sequence Memory",  color: "#8b5cf6", tokens: "8–20" },
  { icon: Rocket,    name: "Warp Speed",       color: "#3b82f6", tokens: "6–14" },
  { icon: CircleDot, name: "Pulse Catcher",    color: "#f43f5e", tokens: "5–15" },
  { icon: Gift,      name: "Mystery Box",      color: "#f59e0b", tokens: "2–50" },
  { icon: Star,      name: "Orbit Slingshot",  color: "#06b6d4", tokens: "7–18" },
];

// ─── Animated token counter ───────────────────────────────────────────────────
function TokenCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const step = () => {
      start += Math.ceil((end - start) / 8);
      setDisplay(start);
      if (start < end) setTimeout(step, 40);
    };
    step();
  }, [value]);
  return <>{display}</>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function GameTeaserSection() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [inView, setInView]   = useState(false);
  const [tapped, setTapped]   = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection observer — activate game when visible
  useEffect(() => {
    const el = sectionRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const { score, combo, tap, flash } = useTeaserGame(canvasRef, inView);

  const handleTap = () => { setTapped(true); tap(); };

  // Cycle through game cards
  const [activeCard, setActiveCard] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveCard(c => (c + 1) % GAME_CARDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        background: "#0a0a0c",
        fontFamily: "'Sora', system-ui, sans-serif",
      }}
    >
      {/* Top amber hairline */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.4) 40%, rgba(245,158,11,0.2) 70%, transparent)" }}
      />

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-[10%] w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <div className="absolute bottom-0 left-[5%] w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <div className="absolute top-1/2 right-[30%] w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)", filter: "blur(30px)" }}
        />
        {/* Grid texture */}
        <div className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-24 lg:py-32">

        {/* ── Section header ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 mb-12"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xs"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-black tracking-[0.28em] uppercase text-white/35">
              Game Center
            </span>
          </div>
          <div className="h-[1px] w-12 bg-white/[0.06]" />
        </motion.div>

        {/* ── Main grid: left headline + right game ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT — Editorial copy + game type cards */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Headline */}
            <div className="mb-8">
              <h2
                className="font-black text-white leading-[0.92] tracking-tight mb-4"
                style={{ fontSize: "clamp(36px, 5.5vw, 72px)", letterSpacing: "-0.035em" }}
              >
                Play games.
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #f59e0b 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Earn tokens.
                </span>
                <br />
                <span className="text-white/35">Unlock tools.</span>
              </h2>
              <p className="text-[15px] text-white/35 leading-relaxed max-w-md"
                style={{ borderLeft: "2px solid rgba(245,158,11,0.3)", paddingLeft: "16px" }}
              >
                100+ original mini-games drop randomly as you browse. Each one takes under 60 seconds.
                Earn tokens to unlock premium tools, features, and exclusive content — forever.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: "Games",   value: "100+",  accent: "#f59e0b", icon: Gamepad2 },
                { label: "Max reward", value: "50×", accent: "#8b5cf6", icon: Zap },
                { label: "Tokens",  value: "∞",     accent: "#10b981", icon: Coins },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                  className="rounded-xs px-3 py-3"
                  style={{
                    background: `${stat.accent}08`,
                    border: `1px solid ${stat.accent}20`,
                  }}
                >
                  <stat.icon className="w-3.5 h-3.5 mb-2" style={{ color: stat.accent }} />
                  <p className="text-xl font-black text-white leading-none mb-1" style={{ letterSpacing: "-0.03em" }}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Cycling game cards */}
            <div className="mb-8">
              <p className="text-[9px] font-black tracking-[0.22em] uppercase text-white/20 mb-3">
                Games include
              </p>
              <div className="flex flex-wrap gap-2">
                {GAME_CARDS.map((g, i) => (
                  <motion.div
                    key={g.name}
                    animate={{
                      background: i === activeCard ? `${g.color}18` : "rgba(255,255,255,0.03)",
                      borderColor: i === activeCard ? `${g.color}45` : "rgba(255,255,255,0.07)",
                      scale: i === activeCard ? 1.04 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs"
                    style={{ border: "1px solid", cursor: "default" }}
                  >
                    <g.icon
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: i === activeCard ? g.color : "rgba(255,255,255,0.25)" }}
                    />
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: i === activeCard ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }}
                    >
                      {g.name}
                    </span>
                    {i === activeCard && (
                      <span className="text-[9px] font-black ml-0.5" style={{ color: `${g.color}90` }}>
                        +{g.tokens}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link href="/games">
              <motion.span
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xs font-black text-sm text-black cursor-pointer"
                style={{
                  background: "#f59e0b",
                  boxShadow: "0 0 32px rgba(245,158,11,0.3)",
                }}
              >
                <Gamepad2 className="w-4 h-4" />
                Explore all 24 games
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </motion.span>
            </Link>
          </motion.div>

          {/* RIGHT — Live teaser game + token widget */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Game shell */}
            <div
              className="relative rounded-xs overflow-hidden"
              style={{
                background: "rgba(6,6,14,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px -20px rgba(245,158,11,0.08)",
              }}
            >
              {/* Top accent line */}
              <div className="h-[2px]"
                style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.8) 0%, rgba(139,92,246,0.5) 50%, transparent 100%)" }}
              />

              {/* Game header */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-60" />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.18em] uppercase text-white/50">
                    Pulse Catcher · Live Preview
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Score */}
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <motion.span
                      key={score}
                      initial={{ scale: 1.3, color: "#f59e0b" }}
                      animate={{ scale: 1, color: "rgba(255,255,255,0.9)" }}
                      transition={{ duration: 0.3 }}
                      className="text-xs font-black"
                    >
                      {score}
                    </motion.span>
                  </div>
                  {/* Combo */}
                  <AnimatePresence>
                    {combo >= 2 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-xs"
                        style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)" }}
                      >
                        <Flame className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-amber-400 font-black text-[10px]">{combo}×</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Canvas */}
              <div className="relative cursor-crosshair" onClick={handleTap}>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />

                {/* Flash overlay feedback */}
                <AnimatePresence>
                  {flash && (
                    <motion.div
                      key={flash + Date.now()}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <span
                        className="font-black text-xl"
                        style={{
                          color: flash === "perfect" ? "#f59e0b" : flash === "good" ? "#06b6d4" : "#ef4444",
                          textShadow: `0 0 20px ${flash === "perfect" ? "#f59e0b" : flash === "good" ? "#06b6d4" : "#ef4444"}`,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {flash === "perfect" ? "PERFECT" : flash === "good" ? "GOOD" : "MISS"}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* First-tap prompt */}
                {!tapped && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    style={{ background: "rgba(6,6,14,0.5)", backdropFilter: "blur(2px)" }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.4)" }}
                      >
                        <Zap className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
                          Tap to play
                        </p>
                        <p className="text-white/30 text-[11px] mt-0.5">
                          Hit the ring at the sweet spot
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Game footer */}
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-[10px] font-black tracking-[0.15em] uppercase text-white/20">
                  Tap when ring hits the circle
                </p>
                <Link href="/games">
                  <motion.span
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 cursor-pointer"
                    style={{ letterSpacing: "0.05em" }}
                  >
                    All 24 games
                    <ArrowRight className="w-3 h-3" />
                  </motion.span>
                </Link>
              </div>
            </div>

            {/* Floating token display — positioned overlapping top-right */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -top-5 -right-4 sm:-right-6 rounded-xs px-3 py-2.5 flex items-center gap-2"
              style={{
                background: "rgba(10,10,14,0.95)",
                border: "1px solid rgba(245,158,11,0.25)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(245,158,11,0.1)",
              }}
            >
              <div className="w-7 h-7 rounded-xs flex items-center justify-center"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[9px] text-white/30 font-bold leading-none mb-0.5">Your tokens</p>
                <p className="text-base font-black text-white leading-none" style={{ letterSpacing: "-0.03em" }}>
                  <TokenCounter value={247} />
                </p>
              </div>
            </motion.div>

            {/* Floating "streak" badge — bottom left overlap */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="absolute -bottom-4 -left-4 sm:-left-6 rounded-xs px-3 py-2 flex items-center gap-2"
              style={{
                background: "rgba(10,10,14,0.95)",
                border: "1px solid rgba(249,115,22,0.25)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-[9px] text-white/30 font-bold leading-none mb-0.5">Daily streak</p>
                <p className="text-sm font-black text-white leading-none">7 days</p>
              </div>
            </motion.div>

            {/* Glow behind the game card */}
            <div className="absolute inset-0 -z-10 rounded-xs"
              style={{
                background: "radial-gradient(ellipse at 50% 60%, rgba(139,92,246,0.08) 0%, transparent 70%)",
                filter: "blur(20px)",
                transform: "scale(1.1)",
              }}
            />
          </motion.div>
        </div>

        {/* ── Bottom strip: social proof ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-20 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Games drop randomly", detail: "While you browse — no schedule, just surprises" },
              { label: "Tokens never expire", detail: "Earn once, redeem whenever you're ready" },
              { label: "Sign in to keep score", detail: "Anonymous play works — login locks in your progress" },
              { label: "Flash events 2× tokens", detail: "Rare flash rounds double every reward" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-xs font-black text-white/70">{item.label}</p>
                </div>
                <p className="text-[11px] text-white/25 leading-relaxed pl-3">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(10,10,12,0.6))" }}
      />
    </section>
  );
}