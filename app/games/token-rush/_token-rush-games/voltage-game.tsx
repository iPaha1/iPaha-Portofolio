// =============================================================================
// TOKEN RUSH — Game 20: Voltage
// app/token-rush/_games/voltage.tsx
//
// An energy management auction with compounding consequences.
// Both players start with 30 energy. Each round, 5 circuits appear — each
// with a point value. Players simultaneously bid energy on each circuit.
// Highest bid wins the circuit and earns its points. Spent energy does NOT
// regenerate — only 3 energy returns per round. Run dry and you're helpless.
// 8 rounds. The player with the most points wins — but energy starvation
// means over-spending early destroys your late-game.
//
// ANTI-CHEAT: Bids submitted simultaneously. Server validates energy limits.
// Neither player sees the other's allocation until both lock in.
//
// DEMO MODE: Opponent bids generated locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Lock, TrendingDown, AlertTriangle } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VoltageProps {
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

const TOTAL_ROUNDS   = 8;
const START_ENERGY   = 30;
const REGEN_PER_RND  = 3;
const CIRCUITS       = 5;
const ROUND_SECS     = 20;

// Circuit definitions — value and type add strategic variety
const CIRCUIT_POOL = [
  { emoji: "⚡", label: "Power Node",   baseValue: 8  },
  { emoji: "🔋", label: "Battery",      baseValue: 6  },
  { emoji: "💡", label: "Light Grid",   baseValue: 4  },
  { emoji: "🔌", label: "Main Circuit", baseValue: 10 },
  { emoji: "📡", label: "Relay",        baseValue: 5  },
  { emoji: "⚙️",  label: "Amplifier",   baseValue: 7  },
  { emoji: "🌐", label: "Network Hub",  baseValue: 9  },
  { emoji: "🔦", label: "Spotlight",    baseValue: 3  },
  { emoji: "🖥️",  label: "Terminal",    baseValue: 6  },
  { emoji: "🔧", label: "Capacitor",    baseValue: 4  },
];

interface Circuit {
  emoji: string;
  label: string;
  value: number;  // actual value this round (base ± variance)
}

function generateCircuits(round: number, seed: number): Circuit[] {
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s); };
  const pool = [...CIRCUIT_POOL].sort(() => (rng() % 3) - 1).slice(0, CIRCUITS);
  return pool.map(p => ({
    ...p,
    value: p.baseValue + (rng() % 5) - 2, // ±2 variance
  }));
}

// ── AI bidder ─────────────────────────────────────────────────────────────────
function aiBids(circuits: Circuit[], oppEnergy: number, round: number): number[] {
  if (oppEnergy === 0) return new Array(CIRCUITS).fill(0);
  // AI allocates proportional to circuit value, with some randomness
  const weights   = circuits.map(c => c.value * (0.7 + Math.random() * 0.6));
  const total     = weights.reduce((a, b) => a + b, 0);
  const available = Math.min(oppEnergy, Math.ceil(oppEnergy * (0.6 + Math.random() * 0.3)));
  let remaining   = available;
  return weights.map((w, i) => {
    if (i === CIRCUITS - 1) return Math.max(0, remaining);
    const bid = Math.max(0, Math.min(remaining, Math.round((w / total) * available)));
    remaining -= bid;
    return bid;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function VoltageGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: VoltageProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "bidding" | "reveal" | "done";

  const [round,       setRound]       = useState(1);
  const [phase,       setPhase]       = useState<Phase>("bidding");
  const [circuits,    setCircuits]    = useState<Circuit[]>([]);
  const [myBids,      setMyBids]      = useState<number[]>([]);
  const [myEnergy,    setMyEnergy]    = useState(START_ENERGY);
  const [oppEnergy,   setOppEnergy]   = useState(START_ENERGY);
  const [myScore,     setMyScore]     = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(ROUND_SECS);
  const [locked,      setLocked]      = useState(false);
  const [roundResult, setRoundResult] = useState<{
    myBids: number[]; oppBids: number[];
    myWon:  boolean[]; oppWon: boolean[];
    myPts:  number;    oppPts: number;
    headline: string;
  } | null>(null);
  const [roundHistory, setHistory]   = useState<{ myPts: number; oppPts: number; myNrg: number }[]>([]);

  const myScoreRef   = useRef(0);
  const oppScoreRef  = useRef(0);
  const myEnergyRef  = useRef(START_ENERGY);
  const oppEnergyRef = useRef(START_ENERGY);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef    = useRef(false);

  const energyUsed = myBids.reduce((a, b) => a + b, 0);
  const energyLeft = myEnergy - energyUsed;

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number, myNrg: number, oppNrg: number) => {
    const seed = Date.now() ^ (rnd * 0x1b2c3d);
    const circ = generateCircuits(rnd, seed);
    setCircuits(circ);
    setMyBids(new Array(CIRCUITS).fill(0));
    lockedRef.current = false;
    setLocked(false);
    setRoundResult(null);
    setTimeLeft(ROUND_SECS);
    setPhase("bidding");
    play("roundStart");

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        if (t <= 5) play("timerUrgent");
        return t - 1;
      });
    }, 1000);
  }, [play]);

  // Auto-lock on timeout
  useEffect(() => {
    if (timeLeft !== 0 || phase !== "bidding" || lockedRef.current) return;
    lockBids();
  }, [timeLeft]); // eslint-disable-line

  // ── Adjust a bid ──────────────────────────────────────────────────────────
  const adjustBid = useCallback((idx: number, delta: number) => {
    if (locked) return;
    setMyBids(prev => {
      const next = [...prev];
      const used = prev.reduce((a, b) => a + b, 0) - prev[idx];
      const raw  = prev[idx] + delta;
      next[idx]  = Math.max(0, Math.min(raw, myEnergy - used));
      return next;
    });
    play("uiClick");
  }, [locked, myEnergy, play]);

  // ── Lock bids ─────────────────────────────────────────────────────────────
  const lockBids = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    clearInterval(timerRef.current!);
    play("moveLock");

    // AI bids
    const ob = aiBids(circuits, oppEnergyRef.current, round);

    setTimeout(() => resolveRound(myBids, ob), 800);
  }, [myBids, circuits, round, play]); // eslint-disable-line

  // ── Resolve round ─────────────────────────────────────────────────────────
  const resolveRound = useCallback((mb: number[], ob: number[]) => {
    const myWon  = circuits.map((_, i) => mb[i] >= ob[i]); // ties go to bidder (host)
    const oppWon = circuits.map((_, i) => !myWon[i]);

    const myRndPts  = circuits.reduce((a, c, i) => a + (myWon[i]  ? c.value : 0), 0);
    const oppRndPts = circuits.reduce((a, c, i) => a + (oppWon[i] ? c.value : 0), 0);

    // Energy: deduct spent, regen REGEN_PER_RND
    const mySpent   = mb.reduce((a, b) => a + b, 0);
    const oppSpent  = ob.reduce((a, b) => a + b, 0);
    const newMyNrg  = Math.min(30, Math.max(0, myEnergyRef.current  - mySpent  + REGEN_PER_RND));
    const newOppNrg = Math.min(30, Math.max(0, oppEnergyRef.current - oppSpent + REGEN_PER_RND));
    myEnergyRef.current  = newMyNrg;
    oppEnergyRef.current = newOppNrg;
    setMyEnergy(newMyNrg);
    setOppEnergy(newOppNrg);

    myScoreRef.current  += myRndPts;
    oppScoreRef.current += oppRndPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline =
      myRndPts > oppRndPts ? `⚡ You won ${myWon.filter(Boolean).length} circuits this round!` :
      myRndPts < oppRndPts ? `💀 ${opponentName} dominated the circuits` :
      `⚖️ Dead heat — ${myRndPts} pts each`;

    play(myRndPts > oppRndPts ? "predCorrect" : myRndPts < oppRndPts ? "predWrong" : "roundEnd");
    setHistory(h => [...h, { myPts: myRndPts, oppPts: oppRndPts, myNrg: newMyNrg }]);
    setRoundResult({ myBids: mb, oppBids: ob, myWon, oppWon, myPts: myRndPts, oppPts: oppRndPts, headline });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        setRound(r => r + 1);
        setupRound(round + 1, newMyNrg, newOppNrg);
      }
    }, 4000);
  }, [circuits, round, onComplete, onScoreUpdate, play, setupRound, opponentName]);

  useEffect(() => {
    setupRound(1, START_ENERGY, START_ENERGY);
    return () => clearInterval(timerRef.current!);
  }, []); // eslint-disable-line

  const timerColor  = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : "#6366f1";
  const energyPct   = (myEnergy / START_ENERGY) * 100;
  const energyColor = myEnergy <= 6 ? "#ef4444" : myEnergy <= 12 ? "#f59e0b" : "#6366f1";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores + energy ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        {/* My energy + score */}
        <div className="space-y-1">
          <motion.div key={myScore} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
            className="text-2xl font-black" style={{ color: "#6366f1", letterSpacing: "-0.04em" }}>{myScore}</motion.div>
          <div className="text-[9px] text-white/30 font-bold">You</div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${energyPct}%`, background: energyColor }} />
          </div>
          <div className="text-[9px] font-black" style={{ color: energyColor }}>
            <Zap className="w-2.5 h-2.5 inline mr-0.5" />{myEnergy} energy
          </div>
        </div>

        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          {phase === "bidding" && (
            <div className="text-xl font-black" style={{ color: timerColor }}>{timeLeft}s</div>
          )}
        </div>

        <div className="space-y-1 text-right">
          <motion.div key={oppScore} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
            className="text-2xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.04em" }}>{oppScore}</motion.div>
          <div className="text-[9px] text-white/30 font-bold truncate">{opponentName}</div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(oppEnergy / START_ENERGY) * 100}%`, background: "#06b6d4" }} />
          </div>
          <div className="text-[9px] font-black text-cyan-400">
            <Zap className="w-2.5 h-2.5 inline mr-0.5" />{oppEnergy}
          </div>
        </div>
      </div>

      {/* Budget bar */}
      {phase === "bidding" && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/30">Bid budget used: <strong className="text-white">{energyUsed}</strong></span>
            <span style={{ color: energyLeft === 0 ? "#ef4444" : energyLeft <= 5 ? "#f59e0b" : "#6366f1" }}>
              Remaining: <strong>{energyLeft}</strong> ⚡
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${(energyUsed / myEnergy) * 100}%` }}
              style={{ background: energyUsed >= myEnergy * 0.8 ? "#ef4444" : "#6366f1" }}
              transition={{ duration: 0.2 }} />
          </div>
        </div>
      )}

      {/* Low energy warning */}
      {myEnergy <= 6 && phase === "bidding" && (
        <div className="flex gap-2 px-3 py-2 rounded-xs"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-300">Critical energy! +{REGEN_PER_RND} regen per round — spend wisely.</p>
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── BIDDING ── */}
        {phase === "bidding" && (
          <motion.div key="bid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            {circuits.map((c, i) => {
              const bid = myBids[i] ?? 0;
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xs"
                  style={{ background: bid > 0 ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${bid > 0 ? "rgba(99,102,241,0.28)" : "rgba(255,255,255,0.08)"}` }}>
                  <span className="text-xl flex-shrink-0">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{c.label}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-xs"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
                        +{c.value} pts
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => adjustBid(i, -1)}
                      className="w-7 h-7 rounded-xs flex items-center justify-center font-black text-sm"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                      −
                    </button>
                    <div className="w-8 text-center font-black text-sm" style={{ color: bid > 0 ? "#6366f1" : "rgba(255,255,255,0.3)" }}>
                      {bid}
                    </div>
                    <button onClick={() => adjustBid(i, 1)}
                      disabled={energyLeft <= 0}
                      className="w-7 h-7 rounded-xs flex items-center justify-center font-black text-sm disabled:opacity-25"
                      style={{ background: energyLeft > 0 ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)", border: energyLeft > 0 ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)", color: energyLeft > 0 ? "#818cf8" : "rgba(255,255,255,0.2)" }}>
                      +
                    </button>
                  </div>
                </div>
              );
            })}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={lockBids} disabled={locked}
              className="w-full py-3.5 rounded-xs text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: locked ? "rgba(99,102,241,0.12)" : "#6366f1", boxShadow: locked ? "none" : "0 0 28px rgba(99,102,241,0.5)", border: locked ? "1px solid rgba(99,102,241,0.3)" : "none" }}>
              {locked
                ? <><div className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />Waiting for result…</>
                : <><Lock className="w-4 h-4" />Lock Bids · {energyUsed} ⚡ spent</>}
            </motion.button>
          </motion.div>
        )}

        {/* ── REVEAL ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-3">
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>

            {/* Circuit results */}
            <div className="space-y-1.5">
              {circuits.map((c, i) => {
                const mw = roundResult.myWon[i];
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xs"
                    style={{ background: mw ? "rgba(99,102,241,0.1)" : "rgba(239,68,68,0.06)", border: `1px solid ${mw ? "rgba(99,102,241,0.25)" : "rgba(239,68,68,0.15)"}` }}>
                    <span className="text-lg">{c.emoji}</span>
                    <span className="flex-1 text-xs font-bold text-white">{c.label}</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="font-black" style={{ color: "#818cf8" }}>{roundResult.myBids[i]} ⚡</span>
                      <span className="text-white/25">vs</span>
                      <span className="font-black" style={{ color: "#06b6d4" }}>{roundResult.oppBids[i]} ⚡</span>
                      <span className="font-black" style={{ color: mw ? "#818cf8" : "#06b6d4" }}>
                        {mw ? "You" : opponentName.split(" ")[0]} +{c.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#6366f1" }}>+{roundResult.myPts}</div>
                <div className="text-[9px] text-white/30">You · {myEnergy} ⚡ left</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>+{roundResult.oppPts}</div>
                <div className="text-[9px] text-white/30">{opponentName} · {oppEnergy} ⚡ left</div>
              </div>
            </div>

            {/* History strip */}
            {roundHistory.length > 0 && (
              <div className="flex gap-1 pt-1">
                {roundHistory.map((h, i) => (
                  <div key={i} className="flex-1 h-6 rounded-xs flex items-center justify-center text-[9px] font-black"
                    style={{
                      background: h.myPts > h.oppPts ? "rgba(99,102,241,0.2)" : h.myPts < h.oppPts ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
                      color: h.myPts > h.oppPts ? "#818cf8" : h.myPts < h.oppPts ? "#f87171" : "rgba(255,255,255,0.3)",
                    }}>
                    {h.myPts > h.oppPts ? "W" : h.myPts < h.oppPts ? "L" : "T"}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}