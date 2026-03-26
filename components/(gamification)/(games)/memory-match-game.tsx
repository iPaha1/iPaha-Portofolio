// =============================================================================
// GAME 5: MEMORY MATCH — Flip cards, find pairs before time runs out
// components/(gamification)/(games)/memory-match-game.tsx
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, Zap, Star } from "lucide-react";
import type { GameProps } from "./game-types";

// ── Card symbols ─────────────────────────────────────────────────────────────
const SYMBOLS = [
  { id: "a", emoji: "🎯", color: "#ef4444", glow: "#ef444460" },
  { id: "b", emoji: "⚡", color: "#f59e0b", glow: "#f59e0b60" },
  { id: "c", emoji: "💎", color: "#3b82f6", glow: "#3b82f660" },
  { id: "d", emoji: "🔥", color: "#f97316", glow: "#f9731660" },
  { id: "e", emoji: "🌟", color: "#eab308", glow: "#eab30860" },
  { id: "f", emoji: "🎁", color: "#8b5cf6", glow: "#8b5cf660" },
  { id: "g", emoji: "💜", color: "#a855f7", glow: "#a855f760" },
  { id: "h", emoji: "🍀", color: "#10b981", glow: "#10b98160" },
];

interface Card {
  id: number;
  symbolId: string;
  emoji: string;
  color: string;
  glow: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function buildDeck(pairs: number): Card[] {
  const pool = SYMBOLS.slice(0, pairs);
  const doubled = [...pool, ...pool];
  // Fisher-Yates shuffle
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled.map((s, idx) => ({
    id: idx,
    symbolId: s.id,
    emoji: s.emoji,
    color: s.color,
    glow: s.glow,
    isFlipped: false,
    isMatched: false,
  }));
}

const DIFFICULTY = [
  { pairs: 6, label: "Easy",   cols: 4, time: 40 },
  { pairs: 8, label: "Normal", cols: 4, time: 50 },
];

export function MemoryMatchGame({
  gameId, rewardTokens, duration = 45, onComplete, isFlash = false,
}: GameProps) {
  const [diff]          = useState(() => duration >= 50 ? DIFFICULTY[1] : DIFFICULTY[0]);
  const [cards, setCards]       = useState<Card[]>(() => buildDeck(diff.pairs));
  const [flipped, setFlipped]   = useState<number[]>([]);   // indices of face-up unmatched
  const [matched, setMatched]   = useState<Set<string>>(new Set());
  const [moves,   setMoves]     = useState(0);
  const [combo,   setCombo]     = useState(0);
  const [score,   setScore]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [done,    setDone]      = useState(false);
  const [lockBoard, setLock]    = useState(false);
  const [pops, setPops]         = useState<{ id: string; text: string; col: number; row: number }[]>([]);

  const comboRef  = useRef(0);
  const timerRef  = useRef<NodeJS.Timeout | null>(null);

  // Game timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Check win condition
  useEffect(() => {
    if (matched.size === diff.pairs && !done) {
      if (timerRef.current) clearInterval(timerRef.current);
      setDone(true);
    }
  }, [matched, diff.pairs, done]);

  // Game over — calculate reward
  useEffect(() => {
    if (!done) return;
    const pairsFound   = matched.size;
    const perfect      = pairsFound === diff.pairs;
    const efficiency   = moves > 0 ? (pairsFound / moves) * 2 : 0;
    const timeBonus    = perfect ? Math.max(0, timeLeft / duration) : 0;
    const multiplier   = Math.min(2.5, 0.4 + efficiency + timeBonus + comboRef.current * 0.05);
    const final        = Math.max(1, Math.round(rewardTokens * multiplier));
    setTimeout(() => onComplete(final, score), 1400);
  }, [done]);

  const showPop = (text: string, cardIdx: number) => {
    const col = cardIdx % diff.cols;
    const row = Math.floor(cardIdx / diff.cols);
    const id  = `pop-${Date.now()}-${Math.random()}`;
    setPops(prev => [...prev, { id, text, col, row }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 750);
  };

  const handleFlip = useCallback((idx: number) => {
    if (lockBoard || done) return;
    const card = cards[idx];
    if (card.isFlipped || card.isMatched) return;
    if (flipped.length === 1 && flipped[0] === idx) return;

    const newFlipped = [...flipped, idx];
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, isFlipped: true } : c));
    setFlipped(newFlipped);
    setMoves(m => m + 1);

    if (newFlipped.length === 2) {
      setLock(true);
      const [a, b] = newFlipped;
      const cardA  = cards[a];
      const cardB  = cards[b];

      if (cardA.symbolId === cardB.symbolId) {
        // Match!
        comboRef.current += 1;
        setCombo(comboRef.current);
        const pts = 100 + comboRef.current * 25;
        setScore(prev => prev + pts);
        showPop(`+${pts}${comboRef.current >= 2 ? ` 🔥${comboRef.current}x` : ""}`, b);

        setMatched(prev => new Set([...prev, cardA.symbolId]));
        setCards(prev => prev.map((c, i) =>
          i === a || i === b ? { ...c, isFlipped: true, isMatched: true } : c
        ));
        setFlipped([]);
        setLock(false);
      } else {
        // No match
        comboRef.current = 0;
        setCombo(0);
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            i === a || i === b ? { ...c, isFlipped: false } : c
          ));
          setFlipped([]);
          setLock(false);
        }, 900);
      }
    }
  }, [lockBoard, done, cards, flipped]);

  const allMatched = matched.size === diff.pairs;

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", minHeight: 260 }}>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            {score}
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {matched.size}/{diff.pairs} pairs
          </div>
          {combo >= 2 && (
            <div className="text-xs font-black" style={{ color: "#f59e0b" }}>
              {combo}× combo!
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {moves} moves
          </div>
          <div className="font-black text-lg tabular-nums"
            style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="relative p-3">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${diff.cols}, 1fr)` }}
        >
          {cards.map((card, idx) => (
            <motion.button
              key={card.id}
              onClick={() => handleFlip(idx)}
              className="relative aspect-square rounded-xs flex items-center justify-center"
              whileHover={!card.isFlipped && !card.isMatched && !lockBoard ? { scale: 1.04 } : {}}
              whileTap={!card.isFlipped && !card.isMatched && !lockBoard ? { scale: 0.96 } : {}}
              style={{ minHeight: 52 }}
            >
              {/* Back face */}
              <motion.div
                className="absolute inset-0 rounded-xs flex items-center justify-center"
                style={{
                  background: card.isFlipped || card.isMatched
                    ? "transparent"
                    : "rgba(255,255,255,0.06)",
                  border: card.isFlipped || card.isMatched
                    ? "none"
                    : "1px solid rgba(255,255,255,0.1)",
                  backfaceVisibility: "hidden",
                }}
                animate={{ rotateY: card.isFlipped || card.isMatched ? 90 : 0 }}
                transition={{ duration: 0.18 }}
              >
                {!card.isFlipped && !card.isMatched && (
                  <div className="w-4 h-4 rounded-full" style={{ background: "rgba(139,92,246,0.4)", border: "1px solid rgba(139,92,246,0.6)" }} />
                )}
              </motion.div>

              {/* Front face */}
              <motion.div
                className="absolute inset-0 rounded-xs flex items-center justify-center text-2xl"
                style={{
                  background: card.isMatched
                    ? `${card.color}20`
                    : card.isFlipped
                    ? `rgba(255,255,255,0.08)`
                    : "transparent",
                  border: card.isMatched
                    ? `1px solid ${card.color}50`
                    : card.isFlipped
                    ? `1px solid rgba(255,255,255,0.15)`
                    : "none",
                  boxShadow: card.isMatched ? `0 0 16px ${card.glow}` : "none",
                }}
                initial={{ rotateY: -90 }}
                animate={{ rotateY: card.isFlipped || card.isMatched ? 0 : -90 }}
                transition={{ duration: 0.18, delay: 0.15 }}
              >
                {(card.isFlipped || card.isMatched) && (
                  <span style={{ filter: card.isMatched ? `drop-shadow(0 0 6px ${card.color})` : "none" }}>
                    {card.emoji}
                  </span>
                )}
              </motion.div>
            </motion.button>
          ))}
        </div>

        {/* Score pops — positioned relative to card grid */}
        {pops.map(p => (
          <motion.div key={p.id}
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute pointer-events-none font-black text-xs z-20 whitespace-nowrap"
            style={{
              left: `calc(${(p.col / diff.cols) * 100}% + ${100 / diff.cols / 2}%)`,
              top: `calc(${p.row * (100 / Math.ceil(cards.length / diff.cols))}% + 20px)`,
              transform: "translateX(-50%)",
              color: "#fbbf24",
              textShadow: "0 1px 6px #000",
            }}>
            {p.text}
          </motion.div>
        ))}
      </div>

      {/* Game over overlay */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 rounded-xs"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 14 }}>
            {allMatched
              ? <Star className="w-12 h-12 text-amber-400 mx-auto" />
              : <Trophy className="w-10 h-10 text-amber-400 mx-auto" />}
          </motion.div>
          <p className="text-2xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
            {allMatched ? "Perfect!" : `${matched.size}/${diff.pairs} pairs`}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {score} pts · {moves} moves
          </p>
        </motion.div>
      )}

      {isFlash && (
        <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
          style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
          2× Flash
        </div>
      )}
    </div>
  );
}