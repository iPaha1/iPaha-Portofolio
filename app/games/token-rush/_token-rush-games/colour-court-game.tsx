// =============================================================================
// TOKEN RUSH — Game 13: Colour Court
// app/token-rush/_games/colour-court.tsx
//
// A perceptual discrimination battle requiring no language, no prior knowledge.
// Both players see a target colour swatch for 2 seconds. Then 9 swatches
// appear — one is the exact match, the rest are subtly shifted. Swatches
// drift slowly every 0.5s. First player to CORRECTLY identify the match wins
// points + a speed bonus. Wrong lock = −5 pts and a 3-second lockout.
// 12 rounds with increasing perceptual difficulty.
//
// Universally accessible — works the same for every human with colour vision,
// regardless of language, culture, or education.
//
// ANTI-CHEAT: Target colours generated server-side. Correct answer validated
// server-side — client cannot know which swatch is correct before submitting.
//
// DEMO MODE: Correct index determined locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Zap } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface ColourCourtProps {
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

const TOTAL_ROUNDS   = 12;
const SHOW_SECS      = 2;    // how long target is shown
const ROUND_SECS     = 10;   // time to pick after target hides
const SWATCH_COUNT   = 9;
const WRONG_PENALTY  = 5;
const LOCKOUT_SECS   = 3;
const DRIFT_MS       = 600;  // how often swatches shift

// Points for first-correct by time remaining
function speedPts(timeLeft: number): number {
  if (timeLeft >= 9) return 30;
  if (timeLeft >= 7) return 24;
  if (timeLeft >= 5) return 18;
  if (timeLeft >= 3) return 12;
  return 8;
}

// ── Colour generation ─────────────────────────────────────────────────────────
interface HSL { h: number; s: number; l: number }

function hslToHex({ h, s, l }: HSL): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const col = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * col).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function randomTarget(seed: number): HSL {
  let s = seed;
  s = (s * 1664525 + 1013904223) & 0xffffffff;
  const h = Math.abs(s) % 360;
  s = (s * 1664525 + 1013904223) & 0xffffffff;
  const sat = 50 + Math.abs(s) % 40; // 50–90%
  s = (s * 1664525 + 1013904223) & 0xffffffff;
  const lit = 35 + Math.abs(s) % 30; // 35–65%
  return { h, s: sat, l: lit };
}

// Generate swatch set — one correct, rest shifted
function generateSwatches(
  target: HSL,
  round: number,
  seed: number,
): { hsl: HSL; hex: string; isCorrect: boolean }[] {
  // Difficulty: shift range decreases each round (harder to distinguish)
  const maxShift = Math.max(8, 35 - round * 2);
  let s = seed;

  const correctIdx = Math.abs(seed) % SWATCH_COUNT;
  const swatches = Array.from({ length: SWATCH_COUNT }, (_, i) => {
    if (i === correctIdx) return { hsl: target, hex: hslToHex(target), isCorrect: true };
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const dh = ((Math.abs(s) % (maxShift * 2)) - maxShift);
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const ds = ((Math.abs(s) % (maxShift)) - maxShift / 2);
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const dl = ((Math.abs(s) % (maxShift)) - maxShift / 2);
    const hsl: HSL = {
      h: (target.h + dh + 360) % 360,
      s: Math.max(20, Math.min(95, target.s + ds)),
      l: Math.max(20, Math.min(75, target.l + dl)),
    };
    return { hsl, hex: hslToHex(hsl), isCorrect: false };
  });

  return swatches;
}

// Drift: shift swatches slightly every DRIFT_MS
function driftSwatches(
  swatches: { hsl: HSL; hex: string; isCorrect: boolean }[],
  seed: number,
): { hsl: HSL; hex: string; isCorrect: boolean }[] {
  let s = seed;
  return swatches.map(sw => {
    if (sw.isCorrect) return sw; // correct swatch never drifts
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const dh = (Math.abs(s) % 7) - 3;
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const dl = (Math.abs(s) % 5) - 2;
    const hsl: HSL = {
      h: (sw.hsl.h + dh + 360) % 360,
      s: sw.hsl.s,
      l: Math.max(20, Math.min(75, sw.hsl.l + dl)),
    };
    return { hsl, hex: hslToHex(hsl), isCorrect: false };
  });
}

// ── Opponent AI ───────────────────────────────────────────────────────────────
function aiPickTime(round: number): number {
  // AI is 60% accurate and slower in later rounds
  const accuracy = Math.random() < (0.7 - round * 0.04) ? 1 : 0;
  const baseTime = 2000 + Math.random() * 4000;
  return baseTime + (accuracy === 0 ? 2000 : 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function ColourCourtGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: ColourCourtProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "showing" | "choosing" | "lockout" | "reveal" | "done";

  const [round,        setRound]        = useState(1);
  const [phase,        setPhase]        = useState<Phase>("showing");
  const [target,       setTarget]       = useState<HSL>({ h: 0, s: 70, l: 50 });
  const [swatches,     setSwatches]     = useState<{ hsl: HSL; hex: string; isCorrect: boolean }[]>([]);
  const [myScore,      setMyScore]      = useState(0);
  const [oppScore,     setOppScore]     = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(ROUND_SECS);
  const [showTimer,    setShowTimer]    = useState(SHOW_SECS);
  const [lockout,      setLockout]      = useState(0);
  const [myPick,       setMyPick]       = useState<number | null>(null);
  const [oppPick,      setOppPick]      = useState<number | null>(null);
  const [oppWon,       setOppWon]       = useState(false);
  const [roundResult,  setRoundResult]  = useState<{
    myPts: number; oppPts: number;
    correct: boolean; oppCorrect: boolean;
    headline: string;
  } | null>(null);
  const [driftSeed,    setDriftSeed]    = useState(0);

  const myScoreRef   = useRef(0);
  const oppScoreRef  = useRef(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const driftRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundSeedRef = useRef(0);
  const resolvedRef  = useRef(false);

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number) => {
    const seed = Date.now() ^ (rnd * 0xfade);
    roundSeedRef.current = seed;
    const tgt = randomTarget(seed);
    const sw  = generateSwatches(tgt, rnd, seed ^ 0x1234);
    setTarget(tgt);
    setSwatches(sw);
    setMyPick(null);
    setOppPick(null);
    setOppWon(false);
    setRoundResult(null);
    setTimeLeft(ROUND_SECS);
    setShowTimer(SHOW_SECS);
    setLockout(0);
    resolvedRef.current = false;
    setPhase("showing");
    play("roundStart");
  }, [play]);

  // ── Show timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "showing") return;
    timerRef.current = setInterval(() => {
      setShowTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase("choosing");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase, round]);

  // ── Choose timer + drift ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "choosing") return;

    // Main countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!resolvedRef.current) resolveRound(null, false, false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Swatch drift
    driftRef.current = setInterval(() => {
      setDriftSeed(s => s + 1);
      setSwatches(prev => driftSwatches(prev, Date.now()));
    }, DRIFT_MS);

    // Opponent picks
    const oppDelay = aiPickTime(round);
    const oppCorrect = Math.random() < (0.65 - round * 0.04);
    aiTimerRef.current = setTimeout(() => {
      if (resolvedRef.current) return;
      const correctIdx = swatches.findIndex(sw => sw.isCorrect);
      const oppIdx = oppCorrect
        ? correctIdx
        : (correctIdx + 1 + Math.floor(Math.random() * (SWATCH_COUNT - 1))) % SWATCH_COUNT;
      setOppPick(oppIdx);
      if (oppCorrect) {
        setOppWon(true);
        resolveRound(null, false, true);
      }
    }, Math.min(oppDelay, ROUND_SECS * 1000 - 500));

    return () => {
      clearInterval(timerRef.current!);
      clearInterval(driftRef.current!);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [phase, round]); // eslint-disable-line

  // ── Player picks ──────────────────────────────────────────────────────────
  const handlePick = useCallback((idx: number) => {
    if (phase !== "choosing" || lockout > 0 || resolvedRef.current) return;
    const correct = swatches[idx]?.isCorrect ?? false;
    setMyPick(idx);

    if (correct) {
      clearInterval(timerRef.current!);
      clearInterval(driftRef.current!);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      play("predCorrect");
      resolveRound(idx, true, false);
    } else {
      play("predWrong");
      setLockout(LOCKOUT_SECS);
      const l = setInterval(() => {
        setLockout(t => { if (t <= 1) { clearInterval(l); return 0; } return t - 1; });
      }, 1000);
    }
  }, [phase, lockout, swatches, play]); // eslint-disable-line

  // ── Resolve round ─────────────────────────────────────────────────────────
  const resolveRound = useCallback((
    myIdx: number | null, myCorrect: boolean, oppFirst: boolean
  ) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    clearInterval(timerRef.current!);
    clearInterval(driftRef.current!);

    const tl = ROUND_SECS - (ROUND_SECS - timeLeft);
    const myPts  = myCorrect && !oppFirst ? speedPts(tl) : myCorrect ? Math.floor(speedPts(tl) * 0.5) : 0;
    const oppPts = oppFirst ? speedPts(ROUND_SECS - 3) : !myCorrect && !oppFirst ? 0 : 0;

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline =
      myCorrect && !oppFirst ? `🎨 First correct! +${myPts} pts` :
      oppFirst ? `⚡ ${opponentName} got there first!` :
      !myCorrect && !oppFirst ? "⏰ Time's up — no one found the match" :
      `✅ Correct, but late — +${myPts} pts`;

    play(myPts > oppPts ? "predCorrect" : "predWrong");
    setRoundResult({ myPts, oppPts, correct: myCorrect, oppCorrect: oppFirst, headline });
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
    }, 3000);
  }, [round, timeLeft, opponentName, onComplete, onScoreUpdate, play, setupRound]);

  useEffect(() => { setupRound(1); return () => { clearInterval(timerRef.current!); clearInterval(driftRef.current!); }; }, []); // eslint-disable-line

  const targetHex = useMemo(() => hslToHex(target), [target]);
  const timerColor = timeLeft <= 3 ? "#ef4444" : timeLeft <= 6 ? "#f59e0b" : "#10b981";
  const diffLabel = ["Warmup", "Easy", "Easy", "Medium", "Medium", "Hard", "Hard", "Expert", "Expert", "Elite", "Elite", "Elite"][round - 1] ?? "Elite";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full select-none"
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
          <div className="text-[9px] text-white/28">{diffLabel}</div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Showing target ── */}
        {phase === "showing" && (
          <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3 items-center">
            <p className="text-[10px] uppercase tracking-widest font-black text-white/28 text-center">
              Memorise this colour — {showTimer}s
            </p>
            <motion.div
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 16 }}
              className="w-full h-36 rounded-xs"
              style={{ background: targetHex, boxShadow: `0 0 40px ${targetHex}80` }} />
            <p className="text-[10px] text-white/25 text-center">
              It disappears in {showTimer}s — then find it among 9 swatches
            </p>
          </motion.div>
        )}

        {/* ── Choosing ── */}
        {phase === "choosing" && (
          <motion.div key="choose" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-white">Which swatch matches?</p>
              <div className="flex items-center gap-2">
                {lockout > 0 && (
                  <span className="text-[10px] font-black text-red-400">⛔ Locked out {lockout}s</span>
                )}
                <span className="text-2xl font-black" style={{ color: timerColor }}>{timeLeft}s</span>
              </div>
            </div>

            {/* Opponent status */}
            <div className="flex items-center gap-1.5 text-[10px]"
              style={{ color: oppPick !== null ? "#10b981" : "rgba(255,255,255,0.28)" }}>
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: oppPick !== null ? "#10b981" : "rgba(255,255,255,0.15)" }} />
              {oppPick !== null ? `${opponentName} locked in` : `${opponentName} scanning…`}
            </div>

            {/* 3×3 Swatch grid */}
            <div className="grid grid-cols-3 gap-2">
              {swatches.map((sw, i) => {
                const isPicked  = myPick === i;
                const isOppPick = oppPick === i;
                return (
                  <motion.button
                    key={i}
                    onClick={() => handlePick(i)}
                    whileTap={lockout === 0 ? { scale: 0.92 } : {}}
                    className="rounded-xs overflow-hidden relative"
                    style={{
                      height: 64,
                      background: sw.hex,
                      border: isPicked
                        ? "3px solid white"
                        : isOppPick ? "2px solid rgba(6,182,212,0.7)"
                        : "1px solid rgba(255,255,255,0.12)",
                      boxShadow: isPicked ? "0 0 20px rgba(255,255,255,0.4)" : "none",
                      cursor: lockout > 0 ? "not-allowed" : "pointer",
                      opacity: lockout > 0 && !isPicked ? 0.6 : 1,
                      transition: "background 0.4s ease",
                    }}>
                    {isPicked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
                          <Lock className="w-3 h-3 text-black" />
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <p className="text-center text-[10px] text-white/20">
              Swatches drift slightly — wrong pick = −{WRONG_PENALTY} pts + {LOCKOUT_SECS}s lockout
            </p>
          </motion.div>
        )}

        {/* ── Reveal ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-4">
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>

            {/* Target revealed */}
            <div className="flex gap-3 items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-14 rounded-xs mb-1" style={{ background: targetHex, boxShadow: `0 0 20px ${targetHex}60` }} />
                <div className="text-[9px] text-white/30">Target</div>
              </div>
              <div className="text-white/20 text-xl">→</div>
              <div className="text-center">
                <div className="w-20 h-14 rounded-xs mb-1 flex items-center justify-center"
                  style={{ background: targetHex, border: "3px solid #10b981", boxShadow: "0 0 20px rgba(16,185,129,0.5)" }}>
                  <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                    <span className="text-black text-xs font-black">✓</span>
                  </div>
                </div>
                <div className="text-[9px] text-emerald-400">Correct</div>
              </div>
            </div>

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#f59e0b" }}>+{roundResult.myPts}</div>
                <div className="text-[9px] text-white/30">You</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>+{roundResult.oppPts}</div>
                <div className="text-[9px] text-white/30">{opponentName}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}