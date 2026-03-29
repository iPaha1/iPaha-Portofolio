// =============================================================================
// TOKEN RUSH — Game 6: Mirage Auction
// app/token-rush/_games/mirage-auction.tsx
//
// A psychological bidding war. Each round both players receive 100 bid-coins
// to spread across 5 items. Items have hidden true values (revealed after
// bidding). Win an item by outbidding your opponent. Your profit = true value
// minus what you paid. Most profit after 6 rounds wins.
//
// ANTI-CHEAT: True values are generated server-side per round. Bids are
// submitted simultaneously — neither player sees the other's bids until
// both have locked in. Server resolves all auction outcomes.
//
// DEMO MODE: True values generated locally. Remove DEMO blocks and wire in
// /api/token-rush/challenges/[id]/auction-round for production.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Lock, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface MirageAuctionProps {
  challengeId:   string;
  myUserId:      string;
  opponentName:  string;
  opponentId:    string;
  wagerAmount:   number;
  netPrize:      number;
  isHost:        boolean;
  soundEnabled?: boolean;
  onComplete:    (myScore: number, oppScore: number) => void;
  onScoreUpdate: (myScore: number) => void;
}

interface AuctionItem {
  id:        number;
  emoji:     string;
  label:     string;
  trueValue: number; // hidden until reveal
  hint:      string; // vague hint shown to players
}

interface BidResult {
  itemId:    number;
  myBid:     number;
  oppBid:    number;
  myWon:     boolean;
  myProfit:  number;
  oppProfit: number;
}

const TOTAL_ROUNDS  = 6;
const BUDGET        = 100; // bid-coins per round
const ITEMS_PER_RND = 5;
const BID_STEP      = 5;

// ── Item pool ─────────────────────────────────────────────────────────────────
const ITEM_POOL: Omit<AuctionItem, "trueValue">[] = [
  { id: 0, emoji: "💎", label: "Diamond",    hint: "High prestige. True value: 60–90" },
  { id: 1, emoji: "🗝️",  label: "Old Key",    hint: "Could be useless. True value: 10–40" },
  { id: 2, emoji: "🧪", label: "Vial",       hint: "Mysterious contents. True value: 20–70" },
  { id: 3, emoji: "📜", label: "Scroll",     hint: "Ancient script. True value: 30–80" },
  { id: 4, emoji: "🔮", label: "Orb",        hint: "Shimmers oddly. True value: 40–90" },
  { id: 5, emoji: "🪙", label: "Gold Coin",  hint: "Face value: 50. True value: 1–99" },
  { id: 6, emoji: "🎭", label: "Mask",       hint: "Ornate. True value: 25–65" },
  { id: 7, emoji: "⚗️", label: "Flask",      hint: "Half full. True value: 15–55" },
  { id: 8, emoji: "🦷", label: "Relic",      hint: "Possibly priceless. True value: 5–95" },
  { id: 9, emoji: "🌡️", label: "Instrument", hint: "Precise. True value: 35–75" },
];

// ── Generate items for a round (DEMO) ────────────────────────────────────────
function generateRoundItems(round: number): AuctionItem[] {
  const seed   = Date.now() ^ (round * 0xc0ffee);
  const pool   = [...ITEM_POOL].sort(() => (seed % 3) - 1).slice(0, ITEMS_PER_RND);
  let   s      = seed;
  return pool.map(item => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const trueValue = 10 + (Math.abs(s) % 81); // 10–90
    return { ...item, trueValue };
  });
}

// ── Opponent AI bidding ───────────────────────────────────────────────────────
function aiBids(items: AuctionItem[], budget: number): number[] {
  // AI spreads bids roughly proportional to item index (varying "desirability")
  const weights = items.map((_, i) => 0.5 + Math.random() * 1.5);
  const total   = weights.reduce((a, b) => a + b, 0);
  let remaining = budget;
  return weights.map((w, i) => {
    if (i === weights.length - 1) return Math.max(0, remaining);
    const raw = Math.round((w / total) * budget / BID_STEP) * BID_STEP;
    const bid = Math.min(raw, remaining);
    remaining -= bid;
    return Math.max(0, bid);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function MirageAuctionGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: MirageAuctionProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "bidding" | "reveal" | "done";

  const [round,       setRound]       = useState(1);
  const [phase,       setPhase]       = useState<Phase>("bidding");
  const [items,       setItems]       = useState<AuctionItem[]>([]);
  const [myBids,      setMyBids]      = useState<number[]>([]);
  const [myScore,     setMyScore]     = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [results,     setResults]     = useState<BidResult[]>([]);
  const [locked,      setLocked]      = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(45);
  const [hovered,     setHovered]     = useState<number | null>(null);

  const myScoreRef  = useRef(0);
  const oppScoreRef = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const budgetUsed = myBids.reduce((a, b) => a + b, 0);
  const budgetLeft = BUDGET - budgetUsed;

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number) => {
    const it = generateRoundItems(rnd);
    setItems(it);
    setMyBids(new Array(it.length).fill(0));
    setLocked(false);
    setResults([]);
    setTimeLeft(45);
    setPhase("bidding");
    play("roundStart");

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [play]);

  // ── Adjust a bid ──────────────────────────────────────────────────────────
  const adjustBid = (idx: number, delta: number) => {
    if (locked) return;
    setMyBids(prev => {
      const next = [...prev];
      const raw  = next[idx] + delta;
      const used = prev.reduce((a, b) => a + b, 0) - prev[idx];
      next[idx]  = Math.max(0, Math.min(raw, BUDGET - used));
      return next;
    });
    play("uiClick");
  };

  // ── Lock bids and resolve ─────────────────────────────────────────────────
  const lockAndResolve = useCallback(() => {
    if (locked) return;
    setLocked(true);
    clearInterval(timerRef.current!);
    play("moveLock");

    const oppBidList = aiBids(items, BUDGET);
    const roundResults: BidResult[] = items.map((item, i) => {
      const mb    = myBids[i];
      const ob    = oppBidList[i];
      const myWon = mb >= ob; // ties go to current player
      return {
        itemId:    item.id,
        myBid:     mb,
        oppBid:    ob,
        myWon,
        myProfit:  myWon  ? Math.max(0, item.trueValue - mb) : 0,
        oppProfit: !myWon ? Math.max(0, item.trueValue - ob) : 0,
      };
    });

    const myRndPts  = roundResults.reduce((a, r) => a + r.myProfit,  0);
    const oppRndPts = roundResults.reduce((a, r) => a + r.oppProfit, 0);

    myScoreRef.current  += myRndPts;
    oppScoreRef.current += oppRndPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    setResults(roundResults);
    play(myRndPts > oppRndPts ? "predCorrect" : "predWrong");
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        setRound(r => r + 1);
        setupRound(round + 1);
      }
    }, 4000);
  }, [locked, items, myBids, round, onComplete, onScoreUpdate, play, setupRound]);

  // Auto-lock on timer expiry
  useEffect(() => {
    if (timeLeft === 0 && phase === "bidding" && !locked) lockAndResolve();
  }, [timeLeft, phase, locked, lockAndResolve]);

  useEffect(() => { setupRound(1); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []); // eslint-disable-line

  const timerColor = timeLeft <= 8 ? "#ef4444" : timeLeft <= 15 ? "#f59e0b" : "#a855f7";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <motion.div key={myScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#a855f7", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      {/* ── Budget bar ── */}
      {phase === "bidding" && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Budget used: <strong className="text-white">{budgetUsed}</strong></span>
            <span style={{ color: budgetLeft === 0 ? "#ef4444" : "#a855f7" }}>Remaining: <strong>{budgetLeft}</strong></span>
            <span style={{ color: timerColor }}>{timeLeft}s</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: budgetLeft === 0 ? "#ef4444" : "#a855f7" }}
              animate={{ width: `${(budgetUsed / BUDGET) * 100}%` }} transition={{ duration: 0.2 }} />
          </div>
        </div>
      )}

      {/* ── Items ── */}
      <div className="space-y-2">
        {items.map((item, i) => {
          const res      = results.find(r => r.itemId === item.id);
          const isHov    = hovered === i;
          const bid      = myBids[i] ?? 0;
          const showTrue = phase === "reveal" && res !== undefined;

          return (
            <motion.div key={item.id} layout
              onHoverStart={() => setHovered(i)} onHoverEnd={() => setHovered(null)}
              className="rounded-xs overflow-hidden transition-all"
              style={{
                background: showTrue
                  ? res!.myWon ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)"
                  : isHov ? "rgba(168,85,247,0.07)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${showTrue
                  ? res!.myWon ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"
                  : isHov ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.08)"}`,
              }}>
              <div className="flex items-center gap-3 p-3">
                {/* Emoji + label */}
                <div className="text-2xl flex-shrink-0">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{item.label}</span>
                    {showTrue && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-xs"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                        True value: {item.trueValue}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-[9px] text-white/30 mt-0.5">{item.hint}</p>
                </div>

                {/* Bidding controls or reveal */}
                {phase === "bidding" && !locked ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => adjustBid(i, -BID_STEP)}
                      className="w-7 h-7 rounded-xs flex items-center justify-center font-black text-base"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                      −
                    </button>
                    <div className="w-10 text-center font-black text-sm text-white">{bid}</div>
                    <button onClick={() => adjustBid(i, +BID_STEP)}
                      className="w-7 h-7 rounded-xs flex items-center justify-center font-black text-base"
                      style={{
                        background: budgetLeft >= BID_STEP ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                        border: budgetLeft >= BID_STEP ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.06)",
                        color: budgetLeft >= BID_STEP ? "#a855f7" : "rgba(255,255,255,0.2)",
                      }}>
                      +
                    </button>
                  </div>
                ) : showTrue ? (
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 text-[10px]">
                    <div style={{ color: res!.myWon ? "#10b981" : "#ef4444" }}>
                      {res!.myWon ? "WON" : "LOST"} · bid {res!.myBid}
                    </div>
                    <div className="font-black" style={{ color: res!.myWon ? "#10b981" : "rgba(255,255,255,0.3)" }}>
                      {res!.myWon ? `+${res!.myProfit} profit` : `opp bid ${res!.oppBid}`}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] font-black text-white/40">{bid} bid</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Lock button ── */}
      {phase === "bidding" && (
        <motion.button
          whileHover={!locked ? { scale: 1.02 } : {}}
          whileTap={!locked ? { scale: 0.97 } : {}}
          onClick={lockAndResolve}
          disabled={locked}
          className="w-full py-3.5 rounded-xs text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: locked ? "rgba(168,85,247,0.15)" : "#a855f7",
            boxShadow:  locked ? "none" : "0 0 28px rgba(168,85,247,0.5)",
            border:     locked ? "1px solid rgba(168,85,247,0.3)" : "none",
          }}>
          {locked
            ? <><div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />Waiting for result…</>
            : <><Lock className="w-4 h-4" />Lock Bids — Total: {budgetUsed}/{BUDGET}</>}
        </motion.button>
      )}

      {/* ── Round summary ── */}
      {phase === "reveal" && results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xs p-4 space-y-2"
          style={{ background: "rgba(6,6,18,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: "#a855f7" }}>
                +{results.reduce((a, r) => a + r.myProfit, 0)}
              </div>
              <div className="text-[9px] text-white/30">Your profit</div>
            </div>
            <div className="text-xs font-black text-white/25">vs</div>
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>
                +{results.reduce((a, r) => a + r.oppProfit, 0)}
              </div>
              <div className="text-[9px] text-white/30">{opponentName}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}