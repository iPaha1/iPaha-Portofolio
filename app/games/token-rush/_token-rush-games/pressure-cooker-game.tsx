// =============================================================================
// TOKEN RUSH — Game 9: Pressure Cooker
// app/token-rush/_games/pressure-cooker.tsx
//
// A live ultimatum game theory duel. Each round, a pot of points is
// available to split. Both players simultaneously name the share they
// demand. If both demands together ≤ 100, each gets what they asked for.
// If they total > 100 (greedy clash), NOBODY gets anything that round.
// 10 rounds — pure psychology, negotiation theory, and bluffing.
//
// ANTI-CHEAT: Demands committed to server simultaneously. Neither player
// sees the other's demand until both have submitted. Server resolves outcomes.
//
// DEMO MODE: Opponent simulated locally. Wire in server endpoints in production.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Lock, TrendingUp, AlertTriangle } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface PressureCookerProps {
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

const TOTAL_ROUNDS  = 10;
const POT           = 100;
const ROUND_SECONDS = 12;

// Round modifiers keep every round fresh
const ROUND_RULES = [
  { label: "Standard Split",    desc: "Both get what they demand if combined ≤ 100",              modifier: 1.0 },
  { label: "Double Pressure",   desc: "Both demands must total ≤ 80 or nobody scores",            modifier: 0.8 },
  { label: "Generosity Bonus",  desc: "If you demand ≤ 40, you earn a +15 bonus on top",         modifier: 1.0, bonus: 15, bonusThreshold: 40 },
  { label: "Winner Take All",   desc: "Higher demand wins the full pot — loser gets zero",        modifier: 1.0, winnerTakeAll: true },
  { label: "Standard Split",    desc: "Both get what they demand if combined ≤ 100",              modifier: 1.0 },
  { label: "Pressure Pot",      desc: "Pot is 120 this round — but combined limit stays at 100", modifier: 1.2 },
  { label: "Penalty Round",     desc: "Greedy clash? Both lose 10 pts (not just zero)",          modifier: 1.0, clashPenalty: 10 },
  { label: "Mirror Round",      desc: "If both demand the same number exactly, both get +40",    modifier: 1.0, mirrorBonus: 40 },
  { label: "Standard Split",    desc: "Both get what they demand if combined ≤ 100",              modifier: 1.0 },
  { label: "Final Standoff",    desc: "Combined limit: 100. Stakes doubled.",                    modifier: 2.0 },
] as const;

type RoundRule = typeof ROUND_RULES[number];

// ── Opponent AI ───────────────────────────────────────────────────────────────
function aiDemand(round: number, myHistory: number[], oppHistory: number[], rule: RoundRule): number {
  const avgOpp = myHistory.length > 0 ? myHistory.reduce((a, b) => a + b, 0) / myHistory.length : 50;
  const safeMax = "modifier" in rule ? Math.floor(POT * (rule.modifier < 1 ? 0.8 : 1) - avgOpp - 5) : 50;

  if ("winnerTakeAll" in rule && rule.winnerTakeAll) {
    // Try to win by going high
    return Math.min(95, Math.floor(avgOpp + 5 + Math.random() * 15));
  }
  if ("mirrorBonus" in rule && rule.mirrorBonus) {
    // Maybe try to mirror last demand
    const lastMyDemand = myHistory[myHistory.length - 1] ?? 50;
    return Math.random() < 0.4 ? lastMyDemand : Math.floor(40 + Math.random() * 30);
  }

  const base = Math.max(20, Math.min(safeMax, Math.floor(45 + (Math.random() - 0.3) * 30)));
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function PressureCookerGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: PressureCookerProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "choosing" | "locked" | "reveal" | "done";

  const [round,       setRound]       = useState(1);
  const [phase,       setPhase]       = useState<Phase>("choosing");
  const [demand,      setDemand]      = useState(50);
  const [myScore,     setMyScore]     = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(ROUND_SECONDS);
  const [locked,      setLocked]      = useState(false);
  const [oppLocked,   setOppLocked]   = useState(false);
  const [roundResult, setRoundResult] = useState<{
    myDemand: number; oppDemand: number;
    myPts: number; oppPts: number;
    combined: number; clash: boolean;
    headline: string; special?: string;
  } | null>(null);
  const [myHistory,   setMyHistory]   = useState<number[]>([]);
  const [oppHistory,  setOppHistory]  = useState<number[]>([]);

  const myScoreRef  = useRef(0);
  const oppScoreRef = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef   = useRef(false);

  const rule = ROUND_RULES[(round - 1) % ROUND_RULES.length];
  const effectivePot = Math.floor(POT * (rule.modifier ?? 1));
  const limit = "modifier" in rule && rule.modifier < 1 ? Math.floor(POT * rule.modifier) : POT;

  // ── Lock demand ───────────────────────────────────────────────────────────
  const lockDemand = useCallback((d: number) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    clearInterval(timerRef.current!);
    play("moveLock");

    // DEMO: generate opponent demand
    const oppD = aiDemand(round, myHistory, oppHistory, rule);
    setTimeout(() => {
      setOppLocked(true);
      play("oppLocked");
      setTimeout(() => resolveRound(d, oppD), 600);
    }, 600 + Math.random() * 1000);
  }, [round, myHistory, oppHistory, rule, play]); // eslint-disable-line

  // ── Resolve round ─────────────────────────────────────────────────────────
  const resolveRound = useCallback((md: number, od: number) => {
    const combined = md + od;
    const clash    = combined > limit;
    let myPts  = 0;
    let oppPts = 0;
    let special: string | undefined;

    if ("winnerTakeAll" in rule && rule.winnerTakeAll) {
      if (md > od)       { myPts = effectivePot; }
      else if (od > md)  { oppPts = effectivePot; }
      else               { myPts = Math.floor(effectivePot / 2); oppPts = myPts; }
      special = "🏆 Winner takes the whole pot!";
    } else if ("mirrorBonus" in rule && rule.mirrorBonus && md === od) {
      myPts = oppPts = rule.mirrorBonus;
      special = `🪞 Perfect mirror! Both earn +${rule.mirrorBonus}!`;
    } else if (clash) {
      if ("clashPenalty" in rule && rule.clashPenalty) {
        myPts = oppPts = -(rule.clashPenalty);
        special = `💀 Greedy clash! Both lose ${rule.clashPenalty} pts`;
      } else {
        special = "💥 Greedy clash — nobody scores!";
      }
    } else {
      myPts  = md;
      oppPts = od;
      if ("bonusThreshold" in rule && rule.bonusThreshold && "bonus" in rule && rule.bonus) {
        if (md <= rule.bonusThreshold) { myPts  += rule.bonus; special = `🎁 Generosity bonus! +${rule.bonus} for you`; }
        if (od <= rule.bonusThreshold) { oppPts += rule.bonus; }
      }
      myPts  = Math.round(myPts  * (rule.modifier ?? 1));
      oppPts = Math.round(oppPts * (rule.modifier ?? 1));
    }

    myScoreRef.current  += Math.max(myPts,  -999);
    oppScoreRef.current += Math.max(oppPts, -999);
    setMyScore(Math.max(0, myScoreRef.current));
    setOppScore(Math.max(0, oppScoreRef.current));
    onScoreUpdate(Math.max(0, myScoreRef.current));

    const headline = clash && !("winnerTakeAll" in rule)
      ? `${md} + ${od} = ${combined} — over the limit!`
      : !clash && myPts > oppPts ? `You earned ${myPts} vs their ${oppPts}`
      : !clash && oppPts > myPts ? `They earned ${oppPts} vs your ${myPts}`
      : `Even split — ${myPts} each`;

    play(myPts > oppPts ? "predCorrect" : clash ? "predWrong" : "roundEnd");
    setMyHistory(h => [...h, md]);
    setOppHistory(h => [...h, od]);
    setRoundResult({ myDemand: md, oppDemand: od, myPts, oppPts, combined, clash, headline, special });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(Math.max(0, myScoreRef.current), Math.max(0, oppScoreRef.current));
      } else {
        setRound(r => r + 1);
        setDemand(50);
        lockedRef.current = false;
        setLocked(false);
        setOppLocked(false);
        setRoundResult(null);
        setTimeLeft(ROUND_SECONDS);
        setPhase("choosing");
        play("roundStart");
      }
    }, 3000);
  }, [round, limit, effectivePot, rule, onComplete, onScoreUpdate, play]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "choosing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); lockDemand(demand); return 0; }
        if (t <= 4) play("timerUrgent");
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase, round]); // eslint-disable-line

  useEffect(() => { play("roundStart"); }, []); // eslint-disable-line
  useEffect(() => () => clearInterval(timerRef.current!), []);

  const timerColor  = timeLeft <= 4 ? "#ef4444" : timeLeft <= 7 ? "#f59e0b" : "#ef4444";
  const dangerLevel = (demand + 50) > limit; // rough "risky" indicator assuming opp ~50

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
            className="text-3xl font-black" style={{ color: "#ef4444", letterSpacing: "-0.05em" }}>
            {myScore}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>
            {oppScore}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      {/* ── Round rule card ── */}
      <div className="rounded-xs p-3"
        style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black text-white">{rule.label}</span>
          <span className="font-black text-lg" style={{ color: timerColor }}>{phase === "choosing" ? `${timeLeft}s` : "—"}</span>
        </div>
        <p className="text-[10px] text-white/40">{rule.desc}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px]">
          <span style={{ color: "rgba(255,255,255,0.3)" }}>Pot: <strong className="text-white">{effectivePot}</strong></span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>Limit: <strong className="text-white">{limit}</strong></span>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Choosing phase ── */}
        {phase === "choosing" && (
          <motion.div key="choose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">

            {/* Demand slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40">Your demand</span>
                <motion.span key={demand}
                  initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  className="text-4xl font-black" style={{ color: dangerLevel ? "#ef4444" : "#f59e0b", letterSpacing: "-0.05em" }}>
                  {demand}
                </motion.span>
              </div>

              {/* Visual slider */}
              <div className="relative">
                <input type="range" min={0} max={effectivePot} step={5} value={demand}
                  onChange={e => setDemand(Number(e.target.value))}
                  disabled={locked}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: dangerLevel ? "#ef4444" : "#f59e0b" }} />
                {/* Danger zone indicator */}
                <div className="flex justify-between text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                  <span>0 (generous)</span>
                  <span style={{ color: "#f59e0b" }}>50 (fair)</span>
                  <span style={{ color: "#ef4444" }}>{effectivePot} (greedy)</span>
                </div>
              </div>

              {/* Quick picks */}
              <div className="grid grid-cols-5 gap-1.5">
                {[20, 35, 50, 65, 80].map(v => (
                  <button key={v} onClick={() => !locked && setDemand(v)}
                    disabled={locked}
                    className="py-2 rounded-xs text-xs font-black transition-all"
                    style={{
                      background: demand === v ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${demand === v ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                      color: demand === v ? "#ef4444" : "rgba(255,255,255,0.45)",
                    }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xs"
              style={{
                background: dangerLevel ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.06)",
                border: `1px solid ${dangerLevel ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.18)"}`,
              }}>
              {dangerLevel
                ? <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                : <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
              <span className="text-[10px]" style={{ color: dangerLevel ? "#f87171" : "#6ee7b7" }}>
                {dangerLevel
                  ? `If opponent demands ≥ ${limit - demand}, you both score zero`
                  : `Safe if opponent demands ≤ ${limit - demand}`}
              </span>
            </div>

            {/* Opponent status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xs"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <motion.div animate={oppLocked ? { scale: 1 } : { scale: [1,1.3,1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: oppLocked ? "#10b981" : "rgba(255,255,255,0.2)" }} />
              <span className="text-[11px]" style={{ color: oppLocked ? "#10b981" : "rgba(255,255,255,0.35)" }}>
                {oppLocked ? `${opponentName} has locked in` : `${opponentName} is deciding…`}
              </span>
            </div>

            {/* Lock button */}
            <motion.button
              whileHover={!locked ? { scale: 1.02 } : {}}
              whileTap={!locked ? { scale: 0.97 } : {}}
              onClick={() => lockDemand(demand)}
              disabled={locked}
              className="w-full py-4 rounded-xs text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: locked ? "rgba(239,68,68,0.12)" : "linear-gradient(135deg,#ef4444,#dc2626)",
                boxShadow:  locked ? "none" : "0 0 32px rgba(239,68,68,0.5)",
                border:     locked ? "1px solid rgba(239,68,68,0.3)" : "none",
              }}>
              {locked
                ? <><div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />Waiting for result…</>
                : <><Lock className="w-4 h-4" />Lock Demand: {demand}</>}
            </motion.button>

            {/* History strip */}
            {myHistory.length > 0 && (
              <div className="flex gap-1 overflow-x-auto pb-0.5">
                {myHistory.map((d, i) => {
                  const r = oppHistory[i] ?? 0;
                  const clash = d + r > limit;
                  return (
                    <div key={i} className="flex-shrink-0 flex flex-col items-center gap-0.5">
                      <div className="w-8 h-6 rounded-xs flex items-center justify-center text-[10px] font-black"
                        style={{
                          background: clash ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.12)",
                          color:      clash ? "#ef4444" : "#10b981",
                        }}>{d}</div>
                      <div className="text-[8px] text-white/20">{r}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Reveal ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xs p-5 space-y-4"
            style={{ background: "rgba(6,6,18,0.9)", border: `1px solid ${roundResult.clash ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.2)"}` }}>
            {roundResult.special && (
              <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                className="text-sm font-black text-white text-center">{roundResult.special}</motion.p>
            )}
            <p className="text-xs font-bold text-center text-white/50">{roundResult.headline}</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "You demanded",          val: roundResult.myDemand,  pts: roundResult.myPts,  col: "#ef4444" },
                { label: `${opponentName} demanded`, val: roundResult.oppDemand, pts: roundResult.oppPts, col: "#06b6d4" },
              ].map(p => (
                <div key={p.label} className="rounded-xs py-3 text-center"
                  style={{ background: `${p.col}10`, border: `1px solid ${p.col}25` }}>
                  <div className="text-[9px] uppercase tracking-widest font-black mb-1 text-white/28">{p.label}</div>
                  <div className="text-3xl font-black mb-1 text-white">{p.val}</div>
                  <div className="text-lg font-black" style={{ color: p.pts > 0 ? p.col : "#ef4444" }}>
                    {p.pts >= 0 ? `+${p.pts}` : p.pts}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px]"
              style={{ color: roundResult.clash ? "#ef4444" : "#10b981" }}>
              <span>{roundResult.myDemand} + {roundResult.oppDemand} = {roundResult.combined}</span>
              <span>·</span>
              <span>{roundResult.clash ? `Over limit (${limit})` : `Within limit ✓`}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}