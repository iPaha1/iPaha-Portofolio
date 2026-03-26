// =============================================================================
// GAME 29: AUCTION BLITZ — Bid on items to maximise value; beat the AI
// components/(gamification)/(games)/auction-blitz-game.tsx
//
// Mechanic: 5 items appear in sequence. Each has a hidden VALUE (shown
// briefly) and a starting BID. You have a fixed TOKEN BUDGET. The AI
// also bids — it's unpredictable. Bid higher than the AI to win the item.
// Your score = total VALUE of items won. Spend too much early and you'll
// miss the valuable items. Spend too little and the AI grabs everything.
// Economic decision-making under uncertainty — completely alien to all 29 others.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, Trophy, Coins, TrendingUp } from "lucide-react";
import type { GameProps } from "./game-types";

const NUM_ITEMS  = 6;
const BUDGET     = 120;

interface AuctionItem {
  id:       number;
  emoji:    string;
  name:     string;
  value:    number;   // token reward if won
  minBid:   number;   // starting bid
  revealed: boolean;  // whether value was shown
}

const ITEM_POOL: Omit<AuctionItem, "id" | "minBid" | "revealed">[] = [
  { emoji: "💎", name: "Diamond",    value: 50 },
  { emoji: "🏆", name: "Trophy",     value: 40 },
  { emoji: "🚀", name: "Rocket",     value: 35 },
  { emoji: "👑", name: "Crown",      value: 45 },
  { emoji: "⚡", name: "Power Cell", value: 30 },
  { emoji: "🌟", name: "Star Gem",   value: 38 },
  { emoji: "🎯", name: "Gold Target",value: 28 },
  { emoji: "🔮", name: "Orb",        value: 42 },
  { emoji: "🎪", name: "Mystery",    value: 15 },  // low value trap
  { emoji: "📦", name: "Crate",      value: 12 },  // low value trap
];

function buildAuction(round: number): AuctionItem[] {
  const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5).slice(0, NUM_ITEMS);
  return shuffled.map((item, i) => ({
    ...item,
    id:       i,
    minBid:   8 + Math.floor(Math.random() * 12),
    revealed: false,
  }));
}

function aiDecision(item: AuctionItem, aiBudget: number, itemsLeft: number, difficulty: number): number {
  // AI strategy: value-aware with some randomness
  const maxPay    = Math.min(aiBudget, item.value * (0.7 + Math.random() * 0.5));
  const aggression = 0.6 + difficulty * 0.08;
  const bid       = Math.round(item.minBid + (maxPay - item.minBid) * aggression * Math.random());
  return Math.max(item.minBid, Math.min(aiBudget, bid));
}

type Phase = "reveal" | "bidding" | "result" | "summary";

export function AuctionBlitzGame({
  gameId, rewardTokens, duration = 60, onComplete, isFlash = false,
}: GameProps) {
  const [items,       setItems]       = useState<AuctionItem[]>([]);
  const [round,       setRound]       = useState(1);
  const [itemIdx,     setItemIdx]     = useState(0);
  const [phase,       setPhase]       = useState<Phase>("reveal");
  const [budget,      setBudget]      = useState(BUDGET);
  const [aiBudget,    setAiBudget]    = useState(BUDGET);
  const [myBid,       setMyBid]       = useState(0);
  const [aiBid,       setAiBid]       = useState<number | null>(null);
  const [won,         setWon]         = useState<boolean | null>(null);
  const [score,       setScore]       = useState(0);
  const [wonItems,    setWonItems]    = useState<AuctionItem[]>([]);
  const [lostItems,   setLostItems]   = useState<AuctionItem[]>([]);
  const [timeLeft,    setTimeLeft]    = useState(duration);
  const [done,        setDone]        = useState(false);
  const [bidHistory,  setBidHistory]  = useState<{ item: AuctionItem; won: boolean; myBid: number; aiBid: number }[]>([]);

  const scoreRef    = useRef(0);
  const budgetRef   = useRef(BUDGET);
  const aiBudgetRef = useRef(BUDGET);
  const doneRef     = useRef(false);
  const roundRef    = useRef(1);

  const startAuction = useCallback((r: number) => {
    const newItems = buildAuction(r);
    setItems(newItems);
    setItemIdx(0);
    setBudget(BUDGET);
    budgetRef.current   = BUDGET;
    aiBudgetRef.current = BUDGET;
    setAiBudget(BUDGET);
    setWonItems([]);
    setLostItems([]);
    setBidHistory([]);
    setMyBid(0);
    setAiBid(null);
    setWon(null);
    setPhase("reveal");
  }, []);

  useEffect(() => { startAuction(1); }, [startAuction]);

  useEffect(() => {
    const t = setInterval(() => {
      if (doneRef.current) { clearInterval(t); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!done) return;
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + Math.min(1, scoreRef.current / (NUM_ITEMS * 35)) * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  // Reveal phase → bidding phase
  useEffect(() => {
    if (phase !== "reveal" || items.length === 0) return;
    const t = setTimeout(() => setPhase("bidding"), 2200);
    return () => clearTimeout(t);
  }, [phase, items, itemIdx]);

  const currentItem = items[itemIdx];

  const submitBid = useCallback(() => {
    if (phase !== "bidding" || !currentItem || doneRef.current) return;
    if (myBid < currentItem.minBid) return;
    if (myBid > budgetRef.current) return;

    const difficulty = Math.min(4, roundRef.current);
    const itemsLeft  = NUM_ITEMS - itemIdx - 1;
    const ai         = aiDecision(currentItem, aiBudgetRef.current, itemsLeft, difficulty);
    setAiBid(ai);

    const playerWon = myBid >= ai;
    setWon(playerWon);
    setPhase("result");

    if (playerWon) {
      budgetRef.current  -= myBid;
      setBudget(budgetRef.current);
      scoreRef.current   += currentItem.value;
      setScore(scoreRef.current);
      setWonItems(prev => [...prev, currentItem]);
    } else {
      aiBudgetRef.current -= ai;
      setAiBudget(aiBudgetRef.current);
      setLostItems(prev => [...prev, currentItem]);
    }

    setBidHistory(prev => [...prev, { item: currentItem, won: playerWon, myBid, aiBid: ai }]);

    setTimeout(() => {
      if (doneRef.current) return;
      const next = itemIdx + 1;
      if (next >= NUM_ITEMS) {
        // Round over
        if (!doneRef.current) {
          roundRef.current++;
          setRound(roundRef.current);
          setTimeout(() => {
            if (!doneRef.current) startAuction(roundRef.current);
          }, 1000);
        }
        return;
      }
      setItemIdx(next);
      setMyBid(0);
      setAiBid(null);
      setWon(null);
      setPhase("reveal");
    }, 1400);
  }, [phase, currentItem, myBid, itemIdx, startAuction]);

  const passItem = () => {
    if (phase !== "bidding" || !currentItem) return;
    // Pass = bid 0 (effectively let AI have it free)
    setAiBid(currentItem.minBid);
    setWon(false);
    setLostItems(prev => [...prev, currentItem]);
    setBidHistory(prev => [...prev, { item: currentItem, won: false, myBid: 0, aiBid: currentItem.minBid }]);
    setPhase("result");
    setTimeout(() => {
      if (doneRef.current) return;
      const next = itemIdx + 1;
      if (next >= NUM_ITEMS) {
        roundRef.current++;
        setRound(roundRef.current);
        setTimeout(() => { if (!doneRef.current) startAuction(roundRef.current); }, 800);
        return;
      }
      setItemIdx(next);
      setMyBid(0);
      setAiBid(null);
      setWon(null);
      setPhase("reveal");
    }, 900);
  };

  const maxBid = Math.min(budgetRef.current, currentItem ? currentItem.value * 1.2 : 0);

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1a1028 100%)", minHeight: 310 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Gavel className="w-3.5 h-3.5 text-amber-400" />{score}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-xs"
            style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }}>
            <Coins className="w-3 h-3" /> {budget} left
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            Item {itemIdx + 1}/{NUM_ITEMS}
          </div>
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Auction stage */}
      <div className="px-4 pt-3 pb-2">
        <AnimatePresence mode="wait">
          {currentItem && phase !== "summary" && (
            <motion.div key={`item-${itemIdx}-${phase}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3">

              {/* Item card */}
              <div className="w-full flex items-center gap-4 px-4 py-3 rounded-xs"
                style={{
                  background: phase === "result"
                    ? won ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: phase === "result"
                    ? won ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.2)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}>
                <div className="text-4xl">{currentItem.emoji}</div>
                <div className="flex-1">
                  <p className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{currentItem.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Min bid: {currentItem.minBid}
                    </span>
                    {phase === "reveal" && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-[10px] font-black" style={{ color: "#f59e0b" }}>
                        Value: {currentItem.value} tokens
                      </motion.span>
                    )}
                  </div>
                </div>
                {phase === "result" && (
                  <div className="text-right">
                    <p className="text-xs font-black" style={{ color: won ? "#10b981" : "#ef4444" }}>
                      {won ? "YOU WON!" : "AI WON"}
                    </p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      You: {myBid} · AI: {aiBid}
                    </p>
                  </div>
                )}
              </div>

              {/* Bidding controls */}
              {phase === "bidding" && (
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/40 w-14">Bid:</span>
                    <input
                      type="range"
                      min={currentItem.minBid}
                      max={Math.min(budget, Math.ceil(currentItem.value * 1.3))}
                      value={myBid || currentItem.minBid}
                      onChange={e => setMyBid(parseInt(e.target.value))}
                      className="flex-1"
                      style={{ accentColor: "#f59e0b" }}
                    />
                    <span className="text-base font-black w-10 text-right"
                      style={{ color: "#f59e0b", letterSpacing: "-0.02em" }}>
                      {myBid || currentItem.minBid}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={passItem}
                      className="flex-1 py-2 rounded-xs text-xs font-black"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                      Pass
                    </button>
                    <button onClick={submitBid}
                      className="flex-[2] py-2 rounded-xs text-sm font-black"
                      style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b" }}>
                      <Gavel className="w-4 h-4 inline mr-1" />Bid {myBid || currentItem.minBid}
                    </button>
                  </div>
                </div>
              )}

              {phase === "reveal" && (
                <p className="text-[10px] animate-pulse" style={{ color: "#f59e0b" }}>
                  Memorise the value — bidding opens soon!
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History bar */}
        {bidHistory.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {bidHistory.map((h, i) => (
              <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[9px] font-bold"
                style={{
                  background: h.won ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${h.won ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)"}`,
                  color: h.won ? "#6ee7b7" : "rgba(255,255,255,0.3)",
                }}>
                {h.item.emoji} {h.won ? `+${h.item.value}` : "lost"}
              </div>
            ))}
          </div>
        )}
      </div>

      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {wonItems.length} items won · {budget} tokens left
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