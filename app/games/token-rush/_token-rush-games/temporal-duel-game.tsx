// =============================================================================
// TOKEN RUSH — Game 7: Temporal Duel
// app/token-rush/_games/temporal-duel.tsx
//
// A time-estimation battle with no visible timer. Both players watch the
// same morphing visual event and must press STOP at the exact moment they
// believe a target duration has elapsed. The closest estimate wins each
// round. Pure internal clock calibration — nothing to copy or game.
//
// ANTI-CHEAT: Target durations are generated server-side. Stop-times are
// recorded server-side with millisecond precision. Client timestamps are
// validated against server receive time to prevent spoofing.
//
// DEMO MODE: Targets generated locally. In production, fetch the round
// target from /api/token-rush/challenges/[id]/temporal-round before each round.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TemporalDuelProps {
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

const TOTAL_ROUNDS = 9;
const PTS_PERFECT  = 25;   // within 50ms
const PTS_GREAT    = 18;   // within 150ms
const PTS_GOOD     = 10;   // within 350ms
const PTS_OK       = 4;    // within 700ms

// ── Target durations per round (ms) — varying difficulty ─────────────────────
// Round 1 starts easy (1 full second), gets harder with irregular intervals
const TARGET_DURATIONS = [
  1000, 1500, 2000, 750, 2500, 1250, 3000, 875, 1750,
];

// ── Visual event generators ───────────────────────────────────────────────────
// These are the "events" players watch while estimating time — each one
// is deliberately designed to NOT give away the duration visually.

type EventType = "morphBlob" | "risingOrbs" | "glitchGrid" | "breathCircle" | "starfield";

const EVENT_TYPES: EventType[] = [
  "breathCircle", "morphBlob", "risingOrbs", "glitchGrid", "starfield",
  "breathCircle", "morphBlob", "risingOrbs", "glitchGrid", "starfield",
];

// ── Score from error ──────────────────────────────────────────────────────────
function scoreError(errorMs: number): number {
  const abs = Math.abs(errorMs);
  if (abs <= 50)  return PTS_PERFECT;
  if (abs <= 150) return PTS_GREAT;
  if (abs <= 350) return PTS_GOOD;
  if (abs <= 700) return PTS_OK;
  return 0;
}

function accuracy(errorMs: number): string {
  const abs = Math.abs(errorMs);
  if (abs <= 50)  return "🎯 Perfect timing!";
  if (abs <= 150) return "⚡ Excellent!";
  if (abs <= 350) return "✅ Good";
  if (abs <= 700) return "👍 Decent";
  return "💀 Way off";
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL EVENTS
// ─────────────────────────────────────────────────────────────────────────────

function BreathCircle({ running }: { running: boolean }) {
  return (
    <div className="flex items-center justify-center w-full h-48">
      <motion.div
        animate={running ? {
          scale: [1, 1.4, 0.9, 1.3, 1, 1.2, 0.85, 1],
          opacity: [0.6, 1, 0.7, 0.9, 0.6, 0.95, 0.7, 0.6],
        } : { scale: 1, opacity: 0.3 }}
        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
        className="w-28 h-28 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.8) 0%, rgba(99,102,241,0.2) 60%, transparent 100%)" }}
      />
    </div>
  );
}

function MorphBlob({ running }: { running: boolean }) {
  const variants = {
    a: { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%", scale: 1 },
    b: { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%", scale: 1.1 },
    c: { borderRadius: "40% 60% 60% 40% / 70% 30% 50% 40%", scale: 0.95 },
  };
  return (
    <div className="flex items-center justify-center w-full h-48">
      <motion.div
        animate={running ? { ...variants.a, transition: { duration: 1.3, repeat: Infinity, repeatType: "mirror" as const } } : variants.a}
        className="w-32 h-32"
        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.7), rgba(6,182,212,0.5))" }}
      />
    </div>
  );
}

function RisingOrbs({ running }: { running: boolean }) {
  const orbs = [0,1,2,3,4,5];
  return (
    <div className="relative w-full h-48 overflow-hidden">
      {orbs.map(i => (
        <motion.div key={i}
          className="absolute w-6 h-6 rounded-full"
          style={{
            left: `${10 + i * 15}%`,
            background: `hsl(${200 + i * 25}, 70%, 60%)`,
            opacity: running ? 0.8 : 0.15,
          }}
          animate={running ? {
            y: ["100%", "-120%"],
            opacity: [0, 0.9, 0],
          } : { y: "100%" }}
          transition={running ? {
            duration: 1.5 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          } : { duration: 0 }}
        />
      ))}
    </div>
  );
}

function GlitchGrid({ running }: { running: boolean }) {
  const cells = Array.from({ length: 25 });
  return (
    <div className="flex items-center justify-center w-full h-48">
      <div className="grid grid-cols-5 gap-1">
        {cells.map((_, i) => (
          <motion.div key={i}
            className="w-7 h-7 rounded-xs"
            style={{ background: `rgba(245,158,11,${running ? 0.15 : 0.05})`, border: "1px solid rgba(245,158,11,0.12)" }}
            animate={running ? {
              opacity: [0.2, Math.random() > 0.5 ? 1 : 0.3, 0.2],
              scale: [1, Math.random() > 0.7 ? 1.1 : 0.95, 1],
            } : { opacity: 0.2 }}
            transition={running ? {
              duration: 0.4 + Math.random() * 0.8,
              repeat: Infinity,
              delay: Math.random() * 0.5,
            } : {}}
          />
        ))}
      </div>
    </div>
  );
}

function Starfield({ running }: { running: boolean }) {
  const stars = Array.from({ length: 30 });
  return (
    <div className="relative w-full h-48 overflow-hidden rounded-xs"
      style={{ background: "rgba(0,0,0,0.4)" }}>
      {stars.map((_, i) => {
        const x = (i * 37 + 13) % 100;
        const y = (i * 53 + 7)  % 100;
        return (
          <motion.div key={i}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{ left: `${x}%`, top: `${y}%` }}
            animate={running ? { opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] } : { opacity: 0.1 }}
            transition={running ? {
              duration: 0.8 + (i % 5) * 0.3,
              repeat: Infinity,
              delay: (i * 0.11) % 1.5,
            } : {}}
          />
        );
      })}
    </div>
  );
}

const EVENT_COMPONENTS: Record<EventType, React.ComponentType<{ running: boolean }>> = {
  breathCircle: BreathCircle,
  morphBlob:    MorphBlob,
  risingOrbs:   RisingOrbs,
  glitchGrid:   GlitchGrid,
  starfield:    Starfield,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function TemporalDuelGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: TemporalDuelProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "ready" | "running" | "stopped" | "reveal" | "done";

  const [round,      setRound]      = useState(1);
  const [phase,      setPhase]      = useState<Phase>("ready");
  const [target,     setTarget]     = useState(0);
  const [elapsed,    setElapsed]    = useState(0);   // ms when player stopped
  const [myScore,    setMyScore]    = useState(0);
  const [oppScore,   setOppScore]   = useState(0);
  const [roundResult,setResult]     = useState<{
    target: number; myElapsed: number; oppElapsed: number;
    myError: number; oppError: number;
    myPts: number; oppPts: number; headline: string;
  } | null>(null);
  const [oppStopped, setOppStopped] = useState(false);

  const myScoreRef  = useRef(0);
  const oppScoreRef = useRef(0);
  const startRef    = useRef(0);
  const stoppedRef  = useRef(false);

  const eventType = EVENT_TYPES[(round - 1) % EVENT_TYPES.length];
  const EventComp = EVENT_COMPONENTS[eventType];

  // ── Start round ───────────────────────────────────────────────────────────
  const startRound = useCallback((rnd: number) => {
    const tgt = TARGET_DURATIONS[(rnd - 1) % TARGET_DURATIONS.length];
    setTarget(tgt);
    setElapsed(0);
    stoppedRef.current = false;
    setOppStopped(false);
    setResult(null);
    setPhase("ready");
  }, []);

  // ── Begin event ───────────────────────────────────────────────────────────
  const handleBegin = () => {
    startRef.current = Date.now();
    setPhase("running");
    play("roundStart");

    // Simulate opponent stopping (DEMO)
    const oppTarget   = TARGET_DURATIONS[(round - 1) % TARGET_DURATIONS.length];
    const oppError    = (Math.random() * 600 - 300); // ±300ms
    const oppStopTime = Math.max(100, oppTarget + oppError);
    setTimeout(() => setOppStopped(true), oppStopTime);
    // If player doesn't stop within 5s of target, auto-stop
    setTimeout(() => {
      if (!stoppedRef.current) handleStop();
    }, oppTarget + 3000);
  };

  // ── Stop clock ────────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    if (stoppedRef.current || phase !== "running") return;
    stoppedRef.current = true;
    const el = Date.now() - startRef.current;
    setElapsed(el);
    setPhase("stopped");
    play("moveLock");

    // In production: POST el to server and GET opponent's el
    // DEMO: compute opponent error locally
    const tgt       = TARGET_DURATIONS[(round - 1) % TARGET_DURATIONS.length];
    const oppErr    = Math.random() * 600 - 300;
    const oppEl     = Math.max(50, tgt + oppErr);

    const myError   = el - tgt;
    const oppError  = oppEl - tgt;
    const myPts     = scoreError(myError);
    const oppPts    = scoreError(oppError);

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline = accuracy(myError);
    setResult({ target: tgt, myElapsed: el, oppElapsed: oppEl, myError, oppError, myPts, oppPts, headline });

    setTimeout(() => {
      setPhase("reveal");
      play(myPts >= PTS_GREAT ? "predCorrect" : myPts > 0 ? "roundEnd" : "predWrong");
    }, 300);

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        setRound(r => r + 1);
        startRound(round + 1);
      }
    }, 3500);
  }, [phase, round, onComplete, onScoreUpdate, play, startRound]);

  useEffect(() => { startRound(1); }, []); // eslint-disable-line

  // Format ms
  const fmtMs = (ms: number) => `${(ms / 1000).toFixed(3)}s`;
  const fmtErr = (ms: number) => `${ms > 0 ? "+" : ""}${ms.toFixed(0)}ms`;

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
            className="text-3xl font-black" style={{ color: "#f59e0b", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
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

      {/* ── Target display (hidden during running) ── */}
      <AnimatePresence mode="wait">
        {phase === "ready" && (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xs p-5 text-center space-y-2"
            style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-[10px] uppercase tracking-widest font-black text-white/30">Target Duration</p>
            <p className="text-4xl font-black text-white" style={{ letterSpacing: "-0.05em" }}>{fmtMs(target)}</p>
            <p className="text-xs text-white/35">Watch the animation. Press STOP when you think exactly {fmtMs(target)} has passed.</p>
            <p className="text-[10px] text-white/22">⚠️ No timer will be visible once the event begins</p>
          </motion.div>
        )}

        {/* The visual event */}
        {(phase === "running" || phase === "stopped") && (
          <motion.div key="event" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xs overflow-hidden"
            style={{ background: "rgba(6,6,18,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-3 pt-3 pb-1 flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-widest font-black text-white/22">Event Running…</p>
              <div className="flex items-center gap-1.5 text-[10px]"
                style={{ color: oppStopped ? "#10b981" : "rgba(255,255,255,0.25)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: oppStopped ? "#10b981" : "rgba(255,255,255,0.15)" }} />
                {oppStopped ? `${opponentName} stopped` : `${opponentName} watching…`}
              </div>
            </div>
            <EventComp running={phase === "running"} />
          </motion.div>
        )}

        {/* Reveal */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xs p-5 space-y-4"
            style={{ background: "rgba(6,6,18,0.88)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>

            {/* Target */}
            <div className="text-center py-2 rounded-xs"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Target</p>
              <p className="text-2xl font-black text-white">{fmtMs(roundResult.target)}</p>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "You",          el: roundResult.myElapsed,  err: roundResult.myError,  pts: roundResult.myPts,  col: "#f59e0b" },
                { label: opponentName,   el: roundResult.oppElapsed, err: roundResult.oppError, pts: roundResult.oppPts, col: "#06b6d4" },
              ].map(p => (
                <div key={p.label} className="rounded-xs py-3 px-2 text-center"
                  style={{ background: `${p.col}10`, border: `1px solid ${p.col}28` }}>
                  <div className="text-[9px] uppercase tracking-widest font-black mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>{p.label}</div>
                  <div className="text-base font-black text-white">{fmtMs(p.el)}</div>
                  <div className="text-[10px]" style={{ color: Math.abs(p.err) <= 150 ? "#10b981" : "#f87171" }}>
                    {fmtErr(p.err)}
                  </div>
                  <div className="text-xl font-black mt-1" style={{ color: p.col }}>+{p.pts}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA ── */}
      {phase === "ready" && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleBegin}
          className="w-full py-4 rounded-xs text-sm font-black text-white flex items-center justify-center gap-2"
          style={{ background: "#f59e0b", boxShadow: "0 0 28px rgba(245,158,11,0.5)" }}>
          ▶ Begin — hide the timer
        </motion.button>
      )}

      {phase === "running" && (
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.9 }}
          onClick={handleStop}
          className="w-full py-5 rounded-xs text-lg font-black text-white flex items-center justify-center gap-3"
          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 0 36px rgba(239,68,68,0.6)" }}>
          <Hand className="w-6 h-6" />STOP
        </motion.button>
      )}

      {phase === "stopped" && (
        <div className="w-full py-4 rounded-xs text-sm font-black text-center text-white/50"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          Stopped at {fmtMs(elapsed)} — calculating result…
        </div>
      )}
    </div>
  );
}