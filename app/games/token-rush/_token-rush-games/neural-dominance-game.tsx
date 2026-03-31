// =============================================================================
// TOKEN RUSH — Game 1: Neural Dominance
// app/token-rush/_token-rush-games/neural-dominance-game.tsx
//
// 12-round psychological prediction war.
//
// ANTI-CHEAT: Moves are committed server-side as SHA-256 hashes before either
// player sees the reveal. The client polls /round until the server confirms
// both players have committed, then the server returns both moves.
//
// DEMO MODE: Opponent is simulated locally. Remove the DEMO blocks and rely
// on pollForReveal() exclusively when connecting real server-side matchmaking.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types & constants ─────────────────────────────────────────────────────────
export type NeuralMove = "ALPHA" | "BETA" | "GAMMA";

const TOTAL_ROUNDS   = 12;
const ROUND_SECONDS  = 8;
const PTS_CORRECT    = 15;  // predicted their move correctly
const PTS_EVADED     = 10;  // they failed to predict your move

const MOVE_CFG = {
  ALPHA: { label: "Alpha", sym: "α", color: "#ef4444", glow: "rgba(239,68,68,0.5)", hint: "Aggressive. Most players switch away from this after using it twice." },
  BETA:  { label: "Beta",  sym: "β", color: "#f59e0b", glow: "rgba(245,158,11,0.5)", hint: "Balanced. The most common human choice — exploit this." },
  GAMMA: { label: "Gamma", sym: "γ", color: "#10b981", glow: "rgba(16,185,129,0.5)", hint: "Subtle. Lowest base rate. Hardest to predict." },
} as const;

const MOVES: NeuralMove[] = ["ALPHA", "BETA", "GAMMA"];

export interface NeuralDominanceProps {
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

// ── Scoring helper ────────────────────────────────────────────────────────────
function calcRoundScore(
  myMove: NeuralMove, myPred: NeuralMove,
  oppMove: NeuralMove, oppPred: NeuralMove,
) {
  const myPts  = (myPred  === oppMove ? PTS_CORRECT : 0) + (oppPred !== myMove  ? PTS_EVADED : 0);
  const oppPts = (oppPred === myMove  ? PTS_CORRECT : 0) + (myPred  !== oppMove ? PTS_EVADED : 0);
  return { myPts, oppPts };
}

// ── Simulated opponent AI (DEMO — remove in production) ──────────────────────
function aiMove(history: NeuralMove[]): NeuralMove {
  if (history.length < 2) return MOVES[Math.floor(Math.random() * 3)];
  // Simple counter-strategy: if player repeated last two moves, counter it
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  if (last === prev) {
    const counters: Record<NeuralMove, NeuralMove> = { ALPHA: "BETA", BETA: "GAMMA", GAMMA: "ALPHA" };
    return counters[last];
  }
  return MOVES[Math.floor(Math.random() * 3)];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function NeuralDominanceGame({
  challengeId, myUserId, opponentName,
  netPrize, soundEnabled = true,
  onComplete, onScoreUpdate,
}: NeuralDominanceProps) {
  const { play } = useGameSound(soundEnabled);

  const [round,        setRound]        = useState(1);
  const [phase,        setPhase]        = useState<"choose" | "locked" | "reveal" | "done">("choose");
  const [myMove,       setMyMove]       = useState<NeuralMove | null>(null);
  const [myPred,       setMyPred]       = useState<NeuralMove | null>(null);
  const [timeLeft,     setTimeLeft]     = useState(ROUND_SECONDS);
  const [myTotal,      setMyTotal]      = useState(0);
  const [oppTotal,     setOppTotal]     = useState(0);
  const [history,      setHistory]      = useState<{ move: NeuralMove; outcome: "win"|"lose"|"draw" }[]>([]);
  const [reveal,       setReveal]       = useState<{ oppMove: NeuralMove; oppPred: NeuralMove; myPts: number; oppPts: number; headline: string } | null>(null);
  const [oppLocked,    setOppLocked]    = useState(false);
  const [tensionFired, setTensionFired] = useState(false);

  const myTotalRef  = useRef(0);
  const oppTotalRef = useRef(0);
  const myMoveRef   = useRef<NeuralMove | null>(null);
  const myPredRef   = useRef<NeuralMove | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef   = useRef(false);
  const oppMoveHist = useRef<NeuralMove[]>([]);

  const clearTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
  };

  // ── Commit move to server ───────────────────────────────────────────────
  const commitMove = useCallback(async (move: NeuralMove, pred: NeuralMove) => {
    try {
      await fetch(`/api/token-rush/challenges/${challengeId}/move`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ round, move, prediction: pred }),
      });
    } catch { /* non-fatal — server still validates */ }
  }, [challengeId, round]);

  // ── Poll server for round reveal ────────────────────────────────────────
  const pollReveal = useCallback(async () => {
    try {
      const res = await fetch(`/api/token-rush/challenges/${challengeId}/round?round=${round}`);
      if (!res.ok) return;
      const data = await res.json() as { opponentLocked: boolean; bothCommitted: boolean; oppMove?: NeuralMove; oppPred?: NeuralMove };

      if (data.opponentLocked && !oppLocked) { setOppLocked(true); play("oppLocked"); }
      if (data.bothCommitted && data.oppMove && data.oppPred) {
        clearTimers();
        doReveal(data.oppMove, data.oppPred);
      }
    } catch { /* silent */ }
  }, [challengeId, round, oppLocked, play]); // eslint-disable-line

  // ── Process reveal ──────────────────────────────────────────────────────
  const doReveal = useCallback((oppMv: NeuralMove, oppPred: NeuralMove) => {
    const mv  = myMoveRef.current  ?? "BETA";
    const pd  = myPredRef.current  ?? "BETA";
    const { myPts, oppPts } = calcRoundScore(mv, pd, oppMv, oppPred);

    myTotalRef.current  += myPts;
    oppTotalRef.current += oppPts;
    setMyTotal(myTotalRef.current);
    setOppTotal(oppTotalRef.current);
    onScoreUpdate(myTotalRef.current);

    const outcome: "win"|"lose"|"draw" = myPts > oppPts ? "win" : myPts < oppPts ? "lose" : "draw";
    const headline =
      myPts >= 25 ? "🎯 Perfect — maximum score!" :
      myPts >= 15 ? "✅ Prediction correct!" :
      outcome === "draw" ? "⚔️ Even exchange" :
      outcome === "win"  ? "💨 They missed you!" : "💀 Outsmarted";

    play(outcome === "win" || myPts >= 15 ? "predCorrect" : "predWrong");

    oppMoveHist.current.push(oppMv);
    setHistory(h => [...h, { move: mv, outcome }]);
    setReveal({ oppMove: oppMv, oppPred, myPts, oppPts, headline });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myTotalRef.current > oppTotalRef.current ? "gameWin" : "gameLose");
        onComplete(myTotalRef.current, oppTotalRef.current);
      } else {
        setRound(r => r + 1);
        setMyMove(null); setMyPred(null);
        myMoveRef.current  = null;
        myPredRef.current  = null;
        lockedRef.current  = false;
        setOppLocked(false);
        setReveal(null);
        setTimeLeft(ROUND_SECONDS);
        setTensionFired(false);
        setPhase("choose");
        play("roundStart");
      }
    }, 2600);
  }, [round, onComplete, onScoreUpdate, play]);

  // ── Lock in move ────────────────────────────────────────────────────────
  const lockIn = useCallback(async () => {
    if (lockedRef.current) return;
    const mv = myMove  ?? MOVES[Math.floor(Math.random() * 3)];
    const pd = myPred  ?? MOVES[Math.floor(Math.random() * 3)];
    lockedRef.current  = true;
    myMoveRef.current  = mv;
    myPredRef.current  = pd;
    setMyMove(mv); setMyPred(pd);
    setPhase("locked");
    play("moveLock");
    clearTimers();
    await commitMove(mv, pd);

    // Start polling for server reveal
    pollRef.current = setInterval(pollReveal, 800);

    // ── DEMO: simulate opponent after delay ───────────────────────────────
    // Remove this block in production; server will trigger reveal instead.
    const delay = 600 + Math.random() * 2800;
    setTimeout(() => {
      setOppLocked(true); play("oppLocked");
      const oppMv   = aiMove(oppMoveHist.current);
      const oppPred = MOVES[Math.floor(Math.random() * 3)];
      clearTimers();
      doReveal(oppMv, oppPred);
    }, delay);
    // ── END DEMO ──────────────────────────────────────────────────────────
  }, [myMove, myPred, commitMove, pollReveal, doReveal, play]);

  // ── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "choose") return;
    setTimeLeft(ROUND_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        if (t <= 4 && !tensionFired) { play("timerUrgent"); setTensionFired(true); }
        else if (t > 1)              { play("countdown"); }
        if (next <= 0) { clearTimers(); lockIn(); return 0; }
        return next;
      });
    }, 1000);
    return clearTimers;
  }, [phase, round]); // eslint-disable-line

  useEffect(() => { play("roundStart"); }, [round]); // eslint-disable-line
  useEffect(() => () => clearTimers(), []);

  // ── Derived ─────────────────────────────────────────────────────────────
  const timerPct = (timeLeft / ROUND_SECONDS) * 100;
  const timerCol = timeLeft <= 2 ? "#ef4444" : timeLeft <= 4 ? "#f59e0b" : "#a855f7";
  const lead     = myTotal - oppTotal;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <motion.div key={myTotal} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#a855f7", letterSpacing: "-0.05em" }}>
            {myTotal}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          <div className="flex items-center gap-0.5 text-[10px] font-black"
            style={{ color: lead > 0 ? "#10b981" : lead < 0 ? "#ef4444" : "rgba(255,255,255,0.3)" }}>
            {lead > 0 ? <TrendingUp className="w-3 h-3" /> : lead < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {lead !== 0 ? Math.abs(lead) : "Tied"}
          </div>
        </div>

        <div className="text-center">
          <motion.div key={oppTotal} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>
            {oppTotal}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      {/* ── Score bar ── */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" style={{ background: "#a855f7" }}
          animate={{ width: `${myTotal + oppTotal === 0 ? 50 : (myTotal / (myTotal + oppTotal)) * 100}%` }}
          transition={{ duration: 0.4 }} />
      </div>

      {/* ── Timer + opponent status ── */}
      <div className="flex items-center gap-3">
        {/* Timer ring */}
        <div className="relative flex-shrink-0 w-14 h-14">
          <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
            <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
            <motion.circle cx="28" cy="28" r="23" fill="none" stroke={timerCol} strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 23}`}
              animate={{ strokeDashoffset: `${2 * Math.PI * 23 * (1 - timerPct / 100)}` }}
              transition={{ duration: 0.35 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-black text-base"
            style={{ color: phase === "choose" ? timerCol : "rgba(255,255,255,0.35)" }}>
            {phase === "choose" ? timeLeft : phase === "locked" ? "⏳" : "—"}
          </div>
        </div>

        {/* Opponent status */}
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xs"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <motion.div
            animate={oppLocked
              ? { scale: 1, backgroundColor: "#10b981" }
              : { scale: [1, 1.3, 1] }}
            transition={{ repeat: oppLocked ? 0 : Infinity, duration: 1.4 }}
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: oppLocked ? "#10b981" : "rgba(255,255,255,0.2)" }} />
          <span className="text-[11px] font-bold"
            style={{ color: oppLocked ? "#10b981" : "rgba(255,255,255,0.38)" }}>
            {oppLocked
              ? `${opponentName} locked in ✓`
              : phase === "locked"
                ? `Waiting for ${opponentName}…`
                : `${opponentName} is thinking…`}
          </span>
        </div>

        {/* Prize */}
        <div className="flex-shrink-0 text-center">
          <div className="text-[11px] font-black" style={{ color: "#f59e0b" }}>
            🏆 {(netPrize / 1000).toFixed(0)}K
          </div>
          <div className="text-[9px] text-white/22">prize</div>
        </div>
      </div>

      {/* ── Main interaction area ── */}
      <AnimatePresence mode="wait">

        {/* Choose phase */}
        {(phase === "choose" || phase === "locked") && (
          <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">

            {/* Move picker */}
            <div>
              <p className="text-[9px] uppercase tracking-widest font-black mb-2.5 text-center text-white/25">
                Your Move
              </p>
              <div className="grid grid-cols-3 gap-3">
                {MOVES.map(m => {
                  const c   = MOVE_CFG[m];
                  const sel = myMove === m;
                  const dis = phase === "locked";
                  return (
                    <motion.button key={m}
                      whileTap={!dis ? { scale: 0.88 } : {}}
                      onClick={() => { if (!dis) { setMyMove(m); play("uiClick"); } }}
                      className="py-4 rounded-xs flex flex-col items-center gap-1.5 relative overflow-hidden transition-all"
                      style={{
                        background:  sel ? `${c.color}22` : "rgba(255,255,255,0.03)",
                        border:      `2px solid ${sel ? c.color : "rgba(255,255,255,0.08)"}`,
                        boxShadow:   sel ? `0 0 28px ${c.glow}` : "none",
                        cursor:      dis ? "not-allowed" : "pointer",
                        opacity:     dis && !sel ? 0.35 : 1,
                      }}>
                      {sel && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 20 }}
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{ background: c.color, opacity: 0.06 }} />
                      )}
                      <span className="text-4xl font-black relative z-10"
                        style={{ color: c.color, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        {c.sym}
                      </span>
                      <span className="text-xs font-black text-white relative z-10">{c.label}</span>
                      <span className="text-[9px] text-center px-1 leading-tight relative z-10"
                        style={{ color: "rgba(255,255,255,0.28)" }}>
                        {c.hint}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Prediction picker */}
            <div>
              <p className="text-[9px] uppercase tracking-widest font-black mb-2.5 text-center text-white/25">
                Predict Their Move <span style={{ color: "#a855f7" }}>(+{PTS_CORRECT} pts if correct)</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {MOVES.map(m => {
                  const c   = MOVE_CFG[m];
                  const sel = myPred === m;
                  const dis = phase === "locked";
                  return (
                    <button key={m}
                      onClick={() => { if (!dis) { setMyPred(m); play("uiClick"); } }}
                      className="py-2.5 rounded-xs flex items-center justify-center gap-1.5 transition-all"
                      style={{
                        background: sel ? `${c.color}18` : "rgba(255,255,255,0.03)",
                        border:     `1px solid ${sel ? c.color : "rgba(255,255,255,0.07)"}`,
                        opacity:    dis && !sel ? 0.35 : 1,
                        cursor:     dis ? "not-allowed" : "pointer",
                      }}>
                      <span className="font-black text-lg"
                        style={{ color: c.color, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        {c.sym}
                      </span>
                      <span className="text-xs font-bold text-white">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lock button */}
            <motion.button
              whileHover={!lockedRef.current && myMove && myPred ? { scale: 1.02 } : {}}
              whileTap={!lockedRef.current ? { scale: 0.97 } : {}}
              onClick={lockIn}
              disabled={!!lockedRef.current || !myMove || !myPred}
              className="py-4 rounded-xs text-sm font-black text-white disabled:opacity-30 flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: lockedRef.current ? "rgba(168,85,247,0.12)" : "#a855f7",
                border:     lockedRef.current ? "1px solid rgba(168,85,247,0.3)" : "none",
                boxShadow:  lockedRef.current ? "none" : "0 0 32px rgba(168,85,247,0.5)",
              }}>
              {lockedRef.current
                ? <><div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />Waiting for opponent…</>
                : <><Lock className="w-4 h-4" />Lock In — Move &amp; Prediction</>}
            </motion.button>
          </motion.div>
        )}

        {/* Reveal */}
        {phase === "reveal" && reveal && (
          <motion.div key="reveal"
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="rounded-xs overflow-hidden"
            style={{ background: "rgba(6,6,18,0.85)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
            <div className="p-6 space-y-4 text-center">
              <p className="text-base font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                {reveal.headline}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "You played",              move: myMove!,      pts: reveal.myPts,  col: "#a855f7" },
                  { label: `${opponentName} played`,  move: reveal.oppMove, pts: reveal.oppPts, col: "#06b6d4" },
                ].map(({ label, move, pts, col }) => {
                  const c = MOVE_CFG[move];
                  return (
                    <div key={label} className="rounded-xs py-3 px-2"
                      style={{ background: `${col}10`, border: `1px solid ${col}28` }}>
                      <div className="text-[9px] uppercase tracking-widest font-black mb-1.5"
                        style={{ color: "rgba(255,255,255,0.28)" }}>{label}</div>
                      <div className="text-3xl font-black mb-0.5"
                        style={{ color: col, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        {c.sym}
                      </div>
                      <div className="text-xs font-bold text-white">{c.label}</div>
                      <div className="text-xl font-black mt-1" style={{ color: pts > 0 ? col : "rgba(255,255,255,0.25)" }}>
                        +{pts}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prediction result */}
              <div className="text-[10px] text-white/40 flex items-center justify-center gap-2">
                <span>Your prediction: <strong style={{ color: MOVE_CFG[myPred!].color }}>{MOVE_CFG[myPred!].sym} {MOVE_CFG[myPred!].label}</strong></span>
                <span>·</span>
                <span style={{ color: myPred === reveal.oppMove ? "#10b981" : "#ef4444" }}>
                  {myPred === reveal.oppMove ? "✓ Correct!" : "✗ Wrong"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Round history strip ── */}
      {history.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {history.map((h, i) => {
            const col = h.outcome === "win" ? "#a855f7" : h.outcome === "lose" ? "#ef4444" : "#f59e0b";
            return (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="flex-shrink-0 w-7 h-7 rounded-xs flex items-center justify-center text-sm font-black"
                style={{ background: `${col}18`, border: `1px solid ${col}38`, color: col, fontFamily: "Georgia, serif" }}
                title={`R${i+1}: ${MOVE_CFG[h.move].label}`}>
                {MOVE_CFG[h.move].sym}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}