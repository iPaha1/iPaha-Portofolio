// =============================================================================
// TOKEN RUSH — Game 11: Rorschach Duel
// app/token-rush/_games/rorschach-duel.tsx
//
// A shared cognition game. Both players see the same abstract ink-blot shape
// rendered via SVG procedural generation for exactly 3 seconds, then it
// disappears. Each player independently picks ONE word from a palette of 12
// that best describes what they saw. Points only awarded when BOTH players
// choose the same word — zero if you diverge. You're trying to think like the
// same human brain as a stranger. Culture, language intuition, and empathy
// all matter. 10 rounds.
//
// ANTI-CHEAT: Both selections committed server-side before reveal. Neither
// player sees the other's choice until both have submitted.
//
// DEMO MODE: Opponent choice simulated locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface RorschachDuelProps {
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

const TOTAL_ROUNDS   = 10;
const SHOW_SECS      = 3;     // how long the shape is visible
const CHOOSE_SECS    = 10;    // how long to pick a word
const PTS_MATCH      = 25;    // both pick the same word
const PTS_NEAR_MATCH = 10;    // words are in the same category (below)
const WORDS_PER_ROUND = 12;

// ── Word palette pool ─────────────────────────────────────────────────────────
// Grouped by semantic category for near-match scoring
const WORD_CATEGORIES = {
  nature:    ["WAVE",   "CLOUD",  "FOREST", "STORM",  "BLOOM",  "RIVER"],
  body:      ["WING",   "CLAW",   "SPINE",  "SKULL",  "FLAME",  "SHADOW"],
  emotion:   ["RAGE",   "GRIEF",  "WONDER", "DREAD",  "JOY",    "VOID"],
  abstract:  ["CHAOS",  "MIRROR", "ECHO",   "SPIRAL", "FRACTURE","VEIL"],
  creature:  ["BEAST",  "DRAGON", "MOTH",   "SPIDER", "SERPENT","PHANTOM"],
  cosmic:    ["NEBULA", "ABYSS",  "PORTAL", "ORBIT",  "PULSE",  "RIFT"],
};

type Category = keyof typeof WORD_CATEGORIES;
const ALL_WORDS = Object.values(WORD_CATEGORIES).flat();

function wordCategory(word: string): Category | null {
  for (const [cat, words] of Object.entries(WORD_CATEGORIES)) {
    if ((words as string[]).includes(word)) return cat as Category;
  }
  return null;
}

// ── Generate word palette for round (varied, always 12 unique) ─────────────────
function roundPalette(seed: number): string[] {
  let s = seed;
  const all = [...ALL_WORDS];
  // Fisher-Yates shuffle with seed
  for (let i = all.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, WORDS_PER_ROUND);
}

// ── Opponent AI word picker ───────────────────────────────────────────────────
// AI has a slight bias toward "popular" words — mimics average human behaviour
const WORD_WEIGHTS: Record<string, number> = {
  WAVE: 3, CLOUD: 4, SHADOW: 5, FLAME: 4, SPIRAL: 3, CHAOS: 3,
  MIRROR: 4, ECHO: 3, VOID: 3, BEAST: 4, DRAGON: 5, NEBULA: 3,
  WING: 4, STORM: 4, BLOOM: 3, SPIDER: 3, ABYSS: 4, PULSE: 3,
};

function aiPick(palette: string[], shapeSeed: number): string {
  const weights = palette.map(w => WORD_WEIGHTS[w] ?? 1);
  // Adjust slightly toward words that "sound like" the shape seed
  const shapeBias = (shapeSeed & 0xff) % palette.length;
  weights[shapeBias] = (weights[shapeBias] ?? 1) * 2.5;
  const total = weights.reduce((a, b) => a + b, 0);
  let r = (Math.random() * total);
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return palette[i];
  }
  return palette[0];
}

// ── Procedural ink-blot SVG ───────────────────────────────────────────────────
function inkBlotPath(seed: number, cx: number, cy: number, r: number): string {
  let s = seed;
  const n = 12; // control points
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const angle   = (i / n) * Math.PI * 2;
    const radius  = r * (0.6 + 0.4 * ((Math.abs(s) % 100) / 100));
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const jitterR = r * 0.15 * ((Math.abs(s) % 100) / 100 - 0.5);
    const finalR  = radius + jitterR;
    pts.push([cx + Math.cos(angle) * finalR, cy + Math.sin(angle) * finalR]);
  }
  // Build smooth cubic bezier path
  let path = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p1    = pts[i];
    const p2    = pts[(i + 1) % n];
    const p3    = pts[(i + 2) % n];
    const cp1x  = p1[0] + (p2[0] - pts[(i - 1 + n) % n][0]) / 5;
    const cp1y  = p1[1] + (p2[1] - pts[(i - 1 + n) % n][1]) / 5;
    const cp2x  = p2[0] - (p3[0] - p1[0]) / 5;
    const cp2y  = p2[1] - (p3[1] - p1[1]) / 5;
    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return path + " Z";
}

function InkBlot({ seed, size = 220 }: { seed: number; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const path1 = inkBlotPath(seed,         cx, cy, r);
  const path2 = inkBlotPath(seed ^ 0xAAAA, cx, cy, r * 0.7);
  // Mirror for classic Rorschach symmetry
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block mx-auto">
      <defs>
        <filter id="ink-blur">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Left half */}
      <g filter="url(#ink-blur)">
        <path d={path1} fill="rgba(30,20,60,0.92)" />
        <path d={path2} fill="rgba(60,40,100,0.7)" />
      </g>
      {/* Mirror right half */}
      <g transform={`scale(-1,1) translate(${-size},0)`} filter="url(#ink-blur)">
        <path d={path1} fill="rgba(30,20,60,0.92)" />
        <path d={path2} fill="rgba(60,40,100,0.7)" />
      </g>
      {/* Centre overlap blend */}
      <g filter="url(#ink-blur)" opacity={0.35}>
        <path d={inkBlotPath(seed ^ 0x1234, cx, cy, r * 0.3)} fill="rgba(100,60,160,0.8)" />
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function RorschachDuelGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: RorschachDuelProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "showing" | "choosing" | "locked" | "reveal" | "done";

  const [round,       setRound]       = useState(1);
  const [phase,       setPhase]       = useState<Phase>("showing");
  const [shapeSeed,   setShapeSeed]   = useState(0);
  const [palette,     setPalette]     = useState<string[]>([]);
  const [myChoice,    setMyChoice]    = useState<string | null>(null);
  const [myScore,     setMyScore]     = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [showTimer,   setShowTimer]   = useState(SHOW_SECS);
  const [chooseTimer, setChooseTimer] = useState(CHOOSE_SECS);
  const [locked,      setLocked]      = useState(false);
  const [oppLocked,   setOppLocked]   = useState(false);
  const [roundResult, setRoundResult] = useState<{
    myWord: string; oppWord: string; matched: boolean; nearMatch: boolean;
    myPts: number; oppPts: number; headline: string;
  } | null>(null);
  const [streak,      setStreak]      = useState(0); // consecutive matches

  const myScoreRef   = useRef(0);
  const oppScoreRef  = useRef(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef    = useRef(false);

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number) => {
    const seed = Date.now() ^ (rnd * 0xbeef);
    setShapeSeed(seed);
    setPalette(roundPalette(seed));
    setMyChoice(null);
    lockedRef.current = false;
    setLocked(false);
    setOppLocked(false);
    setRoundResult(null);
    setShowTimer(SHOW_SECS);
    setChooseTimer(CHOOSE_SECS);
    setPhase("showing");
    play("roundStart");
  }, [play]);

  // ── Showing phase timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "showing") return;
    timerRef.current = setInterval(() => {
      setShowTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase("choosing"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase, round]);

  // ── Choosing phase timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "choosing") return;
    timerRef.current = setInterval(() => {
      setChooseTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current!); if (!lockedRef.current) lockChoice(palette[0]); return 0; }
        return t - 1;
      });
    }, 1000);
    // Simulate opponent locking after random delay (DEMO)
    const oppDelay = 1200 + Math.random() * 5000;
    setTimeout(() => { if (!oppLocked) setOppLocked(true); }, oppDelay);
    return () => clearInterval(timerRef.current!);
  }, [phase, round]); // eslint-disable-line

  // ── Lock a choice ─────────────────────────────────────────────────────────
  const lockChoice = useCallback((word: string) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setMyChoice(word);
    setLocked(true);
    clearInterval(timerRef.current!);
    play("moveLock");

    // Opponent picks (DEMO)
    const oppChoice = aiPick(palette, shapeSeed);
    setTimeout(() => {
      setOppLocked(true);
      setTimeout(() => resolveRound(word, oppChoice), 500);
    }, 400 + Math.random() * 800);
  }, [palette, shapeSeed, play]); // eslint-disable-line

  // ── Resolve ───────────────────────────────────────────────────────────────
  const resolveRound = useCallback((myWord: string, oppWord: string) => {
    const matched   = myWord === oppWord;
    const myCat     = wordCategory(myWord);
    const oppCat    = wordCategory(oppWord);
    const nearMatch = !matched && myCat !== null && myCat === oppCat;

    const baseMyPts  = matched ? PTS_MATCH : nearMatch ? PTS_NEAR_MATCH : 0;
    const baseOppPts = matched ? PTS_MATCH : nearMatch ? PTS_NEAR_MATCH : 0;

    // Streak bonus — 3+ consecutive matches
    const newStreak = matched ? streak + 1 : 0;
    setStreak(newStreak);
    const streakBonus = newStreak >= 3 ? 15 : newStreak >= 2 ? 5 : 0;
    const myPts  = baseMyPts  + (matched ? streakBonus : 0);
    const oppPts = baseOppPts + (matched ? streakBonus : 0);

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline =
      matched && streakBonus > 0 ? `🔥 Mind meld x${newStreak}! Streak bonus +${streakBonus}` :
      matched   ? "🪞 Perfect match — same mind!" :
      nearMatch ? "✨ Near match — same category" :
      "⚡ Different paths this round";

    play(matched ? "predCorrect" : nearMatch ? "roundEnd" : "predWrong");
    setRoundResult({ myWord, oppWord, matched, nearMatch, myPts, oppPts, headline });
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
    }, 3200);
  }, [round, streak, onComplete, onScoreUpdate, play, setupRound]);

  useEffect(() => { setupRound(1); return () => clearInterval(timerRef.current!); }, []); // eslint-disable-line

  const chooseTimerColor = chooseTimer <= 3 ? "#ef4444" : chooseTimer <= 6 ? "#f59e0b" : "#6366f1";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores + streak ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <motion.div key={myScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#6366f1", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          {streak >= 2 && (
            <div className="text-[10px] font-black" style={{ color: "#f59e0b" }}>🔥 ×{streak} streak</div>
          )}
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Showing phase ── */}
        {phase === "showing" && (
          <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-3 items-center">
            <div className="flex items-center justify-between w-full">
              <p className="text-[10px] uppercase tracking-widest font-black text-white/28">What do you see?</p>
              <motion.div
                key={showTimer}
                initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                className="text-2xl font-black"
                style={{ color: "#6366f1" }}>
                {showTimer}
              </motion.div>
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 16 }}
              className="rounded-xs overflow-hidden p-4"
              style={{ background: "rgba(255,255,255,0.96)" }}>
              <InkBlot seed={shapeSeed} size={220} />
            </motion.div>
            <p className="text-[10px] text-white/30 text-center">
              Study the shape — it disappears in {showTimer}s. Then you'll pick one word.
            </p>
          </motion.div>
        )}

        {/* ── Choosing phase ── */}
        {phase === "choosing" && (
          <motion.div key="choose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white">What did it look like?</p>
                <p className="text-[10px] text-white/35">Pick one word that best matches what you saw</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black" style={{ color: chooseTimerColor }}>{chooseTimer}</span>
                <span className="text-[9px] text-white/25">secs</span>
              </div>
            </div>

            {/* Opponent status */}
            <div className="flex items-center gap-2 text-[10px]"
              style={{ color: oppLocked ? "#10b981" : "rgba(255,255,255,0.28)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: oppLocked ? "#10b981" : "rgba(255,255,255,0.15)" }} />
              {oppLocked ? `${opponentName} chose a word` : `${opponentName} is deciding…`}
            </div>

            {/* Word grid */}
            <div className="grid grid-cols-3 gap-2">
              {palette.map(word => {
                const sel = myChoice === word;
                return (
                  <motion.button key={word}
                    whileTap={!locked ? { scale: 0.92 } : {}}
                    onClick={() => !locked && lockChoice(word)}
                    className="py-3 rounded-xs text-sm font-black transition-all relative overflow-hidden"
                    style={{
                      background: sel ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                      border:     `1px solid ${sel ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
                      boxShadow:  sel ? "0 0 20px rgba(99,102,241,0.5)" : "none",
                      color:      sel ? "#818cf8" : "rgba(255,255,255,0.6)",
                      cursor:     locked ? "not-allowed" : "pointer",
                      opacity:    locked && !sel ? 0.35 : 1,
                    }}>
                    {sel && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 10 }}
                        className="absolute inset-0 rounded-full"
                        style={{ background: "#6366f1", opacity: 0.08 }} />
                    )}
                    <span className="relative z-10">{word}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Locked / waiting ── */}
        {phase === "locked" && (
          <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-8 text-center space-y-2">
            <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-white/40">Waiting for {opponentName}…</p>
          </motion.div>
        )}

        {/* ── Reveal ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xs p-5 space-y-4"
            style={{ background: "rgba(6,6,18,0.9)", border: `1px solid ${roundResult.matched ? "rgba(99,102,241,0.35)" : roundResult.nearMatch ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.1)"}` }}>
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>

            {/* Word comparison */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "You picked",                word: roundResult.myWord,  pts: roundResult.myPts,  col: "#6366f1" },
                { label: `${opponentName} picked`,    word: roundResult.oppWord, pts: roundResult.oppPts, col: "#06b6d4" },
              ].map(p => (
                <div key={p.label} className="rounded-xs py-3 text-center"
                  style={{ background: `${p.col}10`, border: `1px solid ${p.col}28` }}>
                  <div className="text-[9px] uppercase tracking-widest font-black mb-1.5" style={{ color: "rgba(255,255,255,0.28)" }}>{p.label}</div>
                  <div className="text-lg font-black text-white">{p.word}</div>
                  <div className="text-xl font-black mt-1" style={{ color: p.col }}>+{p.pts}</div>
                </div>
              ))}
            </div>

            {/* Match indicator */}
            <div className="flex items-center justify-center gap-3">
              {roundResult.matched ? (
                <div className="flex items-center gap-2 text-indigo-400">
                  <div className="w-6 h-px bg-indigo-400" />
                  <span className="text-sm font-black">Perfect match 🪞</span>
                  <div className="w-6 h-px bg-indigo-400" />
                </div>
              ) : roundResult.nearMatch ? (
                <span className="text-sm font-black text-amber-400">Same category — near match ✨</span>
              ) : (
                <span className="text-sm font-black text-white/30">Different words — no points</span>
              )}
            </div>

            {/* Mini ink blot reminder */}
            <div className="flex justify-center opacity-25">
              <InkBlot seed={shapeSeed} size={80} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}