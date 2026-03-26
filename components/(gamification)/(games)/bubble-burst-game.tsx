// =============================================================================
// GAME 6: BUBBLE BURST — Pop rising bubbles in colour-chain combos
// components/(gamification)/(games)/bubble-burst-game.tsx
//
// Mechanic: Coloured bubbles float upward. Pop 3+ of the SAME colour in quick
// succession for a chain bonus. A "poison" bubble (black/dark) deducts points.
// Speed and spawn rate increase over time.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

interface Bubble {
  id: string;
  x: number;        // % from left
  size: number;     // px diameter
  color: BubbleColor;
  value: number;
  speed: number;    // seconds to cross the arena (lower = faster)
  spawnTime: number;
}

type BubbleColor = "red" | "blue" | "green" | "gold" | "purple" | "poison";

const BUBBLE_CFG: Record<BubbleColor, { bg: string; border: string; glow: string; value: number; weight: number }> = {
  red:    { bg: "radial-gradient(circle at 35% 30%, #fca5a5, #ef4444)", border: "#ef4444", glow: "#ef444470", value:  5, weight: 22 },
  blue:   { bg: "radial-gradient(circle at 35% 30%, #93c5fd, #3b82f6)", border: "#3b82f6", glow: "#3b82f670", value:  5, weight: 22 },
  green:  { bg: "radial-gradient(circle at 35% 30%, #6ee7b7, #10b981)", border: "#10b981", glow: "#10b98170", value:  5, weight: 20 },
  gold:   { bg: "radial-gradient(circle at 35% 30%, #fde68a, #f59e0b)", border: "#f59e0b", glow: "#f59e0b70", value: 12, weight:  8 },
  purple: { bg: "radial-gradient(circle at 35% 30%, #c4b5fd, #8b5cf6)", border: "#8b5cf6", glow: "#8b5cf670", value:  8, weight: 14 },
  poison: { bg: "radial-gradient(circle at 35% 30%, #374151, #111827)", border: "#6b7280", glow: "#6b728050", value: -8, weight: 14 },
};

function pickColor(): BubbleColor {
  const total  = Object.values(BUBBLE_CFG).reduce((a, c) => a + c.weight, 0);
  let rand     = Math.random() * total;
  for (const [color, cfg] of Object.entries(BUBBLE_CFG)) {
    rand -= cfg.weight;
    if (rand <= 0) return color as BubbleColor;
  }
  return "blue";
}

const CHAIN_WINDOW_MS = 1800; // ms between pops of same colour to count as chain

export function BubbleBurstGame({
  gameId, rewardTokens, duration = 20, onComplete, isFlash = false,
}: GameProps) {
  const [bubbles,   setBubbles]   = useState<Bubble[]>([]);
  const [score,     setScore]     = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(duration);
  const [done,      setDone]      = useState(false);
  const [chains,    setChains]    = useState<Record<BubbleColor, { count: number; lastTime: number }>>({} as any);
  const [pops,      setPops]      = useState<{ id: string; x: number; y: number; text: string; color: string }[]>([]);
  const [chainAnim, setChainAnim] = useState<{ color: string; count: number; key: number } | null>(null);
  const [totalPopped, setPopped]  = useState(0);

  const scoreRef     = useRef(0);
  const chainsRef    = useRef<Record<BubbleColor, { count: number; lastTime: number }>>({} as any);
  const spawnRef     = useRef<NodeJS.Timeout | null>(null);
  const gameAreaRef  = useRef<HTMLDivElement>(null);

  // Game timer
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Spawn bubbles
  const spawnBubble = useCallback(() => {
    if (done) return;
    const elapsed   = duration - timeLeft;
    const interval  = Math.max(280, 700 - elapsed * 18);
    const speed     = Math.max(1.4, 3.2 - elapsed * 0.06); // faster over time
    const color     = pickColor();
    const size      = color === "gold" ? 42 : color === "poison" ? 36 : 32 + Math.random() * 14;
    const id        = `b-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setBubbles(prev => [...prev.slice(-18), {
      id, color, size,
      value:     BUBBLE_CFG[color].value,
      x:         5 + Math.random() * 88,
      speed,
      spawnTime: Date.now(),
    }]);

    // auto-remove when floated off screen
    setTimeout(() => setBubbles(prev => prev.filter(b => b.id !== id)), speed * 1000 + 300);

    spawnRef.current = setTimeout(spawnBubble, interval);
  }, [done, timeLeft, duration]);

  useEffect(() => {
    if (!done) spawnBubble();
    return () => { if (spawnRef.current) clearTimeout(spawnRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Game over
  useEffect(() => {
    if (!done) return;
    setBubbles([]);
    const efficiency = totalPopped > 0 ? Math.min(1, scoreRef.current / (totalPopped * 8)) : 0;
    const final      = Math.max(1, Math.round(rewardTokens * (0.5 + efficiency * 2)));
    setTimeout(() => onComplete(final, scoreRef.current), 1400);
  }, [done]);

  const handlePop = (bubble: Bubble, e: React.MouseEvent) => {
    e.stopPropagation();
    if (done) return;

    setBubbles(prev => prev.filter(b => b.id !== bubble.id));

    // Chain logic
    const now   = Date.now();
    const prev  = chainsRef.current[bubble.color];
    let chain   = 1;

    if (bubble.color !== "poison" && prev && (now - prev.lastTime) < CHAIN_WINDOW_MS) {
      chain = prev.count + 1;
    }

    if (bubble.color !== "poison") {
      chainsRef.current[bubble.color] = { count: chain, lastTime: now };
    }

    const chainBonus = chain >= 3 ? (chain - 2) * 8 : 0;
    const pts        = bubble.value + chainBonus;
    scoreRef.current += pts;
    setScore(scoreRef.current);
    setPopped(prev => prev + 1);

    if (chain >= 3) {
      setChainAnim({ color: BUBBLE_CFG[bubble.color].border, count: chain, key: now });
      setTimeout(() => setChainAnim(null), 800);
    }

    // Position pop text
    const rect     = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const areaRect = gameAreaRef.current?.getBoundingClientRect();
    if (areaRect) {
      const px   = ((rect.left + rect.width / 2  - areaRect.left) / areaRect.width)  * 100;
      const py   = ((rect.top  + rect.height / 2 - areaRect.top)  / areaRect.height) * 100;
      const cfg  = BUBBLE_CFG[bubble.color];
      const text = bubble.color === "poison"
        ? `${pts}`
        : chain >= 3
        ? `+${pts} 🔗${chain}×`
        : `+${pts}`;
      const popId = `pop-${now}`;
      setPops(prev => [...prev, { id: popId, x: px, y: py, text, color: bubble.color === "poison" ? "#ef4444" : cfg.border }]);
      setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 700);
    }
  };

  return (
    <div ref={gameAreaRef}
      className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ height: 260, background: "linear-gradient(180deg,#0c1a2e 0%,#0f2847 50%,#0c1a2e 100%)", cursor: "pointer" }}>

      {/* Subtle water caustic ripples */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute rounded-full border border-blue-400/30"
            style={{ width: 80 + i * 40, height: 80 + i * 40, left: `${10 + i * 18}%`, top: `${20 + i * 8}%`, animation: `ripple ${3 + i * 0.7}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
        ))}
      </div>

      {/* Stats bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />{score}
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {totalPopped} popped
          </div>
        </div>
        <div className="font-black text-lg tabular-nums"
          style={{ color: timeLeft <= 5 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Chain flash */}
      <AnimatePresence>
        {chainAnim && (
          <motion.div key={chainAnim.key}
            initial={{ opacity: 0, scale: 0.6, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: -10 }}
            exit={{ opacity: 0, scale: 1.2, y: -30 }}
            transition={{ duration: 0.5 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 font-black text-sm whitespace-nowrap px-3 py-1 rounded-xs"
            style={{ background: `${chainAnim.color}30`, border: `1px solid ${chainAnim.color}70`, color: chainAnim.color, textShadow: `0 0 12px ${chainAnim.color}` }}>
            {chainAnim.count}× CHAIN! 🔗
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubbles */}
      <AnimatePresence>
        {bubbles.map(bubble => {
          const cfg = BUBBLE_CFG[bubble.color];
          return (
            <motion.button
              key={bubble.id}
              onClick={e => handlePop(bubble, e)}
              initial={{ y: "110%", x: "-50%", scale: 0.3, opacity: 0 }}
              animate={{ y: "-110%", x: "-50%", scale: 1, opacity: 1 }}
              transition={{ duration: bubble.speed, ease: "easeOut" }}
              className="absolute rounded-full flex items-center justify-center"
              style={{
                left: `${bubble.x}%`,
                bottom: 0,
                width: bubble.size,
                height: bubble.size,
                background: cfg.bg,
                boxShadow: `0 0 14px ${cfg.glow}, inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.25)`,
                border: `1.5px solid ${cfg.border}80`,
                zIndex: 5,
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
            >
              {/* Shine */}
              <div className="absolute rounded-full bg-white/30"
                style={{ width: bubble.size * 0.28, height: bubble.size * 0.22, top: "18%", left: "22%" }} />
              {/* Skull on poison */}
              {bubble.color === "poison" && (
                <span style={{ fontSize: bubble.size * 0.42, lineHeight: 1, filter: "grayscale(1)" }}>💀</span>
              )}
              {/* Sparkle on gold */}
              {bubble.color === "gold" && (
                <span style={{ fontSize: bubble.size * 0.42, lineHeight: 1 }}>✨</span>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Pop text */}
      {pops.map(p => (
        <motion.div key={p.id}
          initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: -40, scale: 1.05 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="absolute pointer-events-none font-black text-xs z-20 whitespace-nowrap"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", color: p.color, textShadow: "0 1px 6px #000" }}>
          {p.text}
        </motion.div>
      ))}

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{totalPopped} bubbles popped</p>
        </motion.div>
      )}

      {isFlash && (
        <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
          style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
          2× Flash
        </div>
      )}

      <style>{`
        @keyframes ripple {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50%       { transform: scale(1.15); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}