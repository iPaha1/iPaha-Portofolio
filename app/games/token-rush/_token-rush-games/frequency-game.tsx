// =============================================================================
// TOKEN RUSH — Game 15: Frequency
// app/token-rush/_games/frequency.tsx
//
// A theory-of-mind clue-giving duel on a spectrum dial.
// Each round both players see the same two polar opposites (e.g. HOT ↔ COLD).
// A secret dial position (0–100) is set server-side. The Clue-Giver provides
// ONE word that they believe maps to that dial position. The Receiver must
// place a guess on the dial. Closer = more points. Roles swap each round.
// Requires deep theory of mind: "what word will make them think of this
// exact position between two concepts?" No language advantage — the
// spectrum categories are universal human experiences.
//
// ANTI-CHEAT: Dial position generated server-side before any clue is given.
// Clue committed to server. Receiver's guess validated against stored position.
//
// DEMO MODE: Dial position generated locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Send, Check } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface FrequencyProps {
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

// ── Spectrum pairs — universal human concepts ─────────────────────────────────
const SPECTRUM_PAIRS = [
  ["🔥 HOT",      "❄️ COLD"      ],
  ["🌙 DARK",     "☀️ BRIGHT"    ],
  ["🐢 SLOW",     "⚡ FAST"      ],
  ["🎓 SERIOUS",  "🎉 PLAYFUL"   ],
  ["🌊 NATURAL",  "🤖 ARTIFICIAL"],
  ["😨 SCARY",    "🥰 COMFORTING"],
  ["🗿 ANCIENT",  "🚀 FUTURISTIC"],
  ["🤫 QUIET",    "📣 LOUD"      ],
  ["💔 SAD",      "😂 FUNNY"     ],
  ["🌱 SMALL",    "🌍 HUGE"      ],
  ["🏔️ HARD",     "🍮 SOFT"      ],
  ["🎭 FAKE",     "💎 GENUINE"   ],
  ["🐑 BORING",   "✨ EXCITING"  ],
  ["🔒 PRIVATE",  "📢 PUBLIC"    ],
  ["👶 YOUNG",    "👴 OLD"       ],
  ["🌸 DELICATE", "⚒️ TOUGH"     ],
  ["💤 LAZY",     "🏋️ ENERGETIC" ],
  ["🤓 NERDY",    "😎 COOL"      ],
];

const TOTAL_ROUNDS  = 8;
const CLUE_SECS     = 15;
const GUESS_SECS    = 12;

// Scoring: based on how close the guess is (0–50 = max distance either side)
function dialScore(guess: number, target: number): number {
  const dist = Math.abs(guess - target);
  if (dist <= 5)  return 30; // perfect zone
  if (dist <= 12) return 22;
  if (dist <= 20) return 14;
  if (dist <= 30) return 7;
  return 0;
}

// ── Opponent AI clue giver ────────────────────────────────────────────────────
// Returns a fake word as clue (demo — replaced by real user input in production)
const AI_CLUES = [
  "shadow","glacier","thunder","whisper","blazing","ancient","gentle",
  "roaring","crystal","phantom","velvet","electric","cosmic","tender",
  "savage","tranquil","colossal","fragile","vivid","neon","murky",
];

function aiGuess(target: number): number {
  // AI guesses within ±25 of target
  return Math.max(0, Math.min(100, target + (Math.random() * 50) - 25));
}

// ── Dial component ────────────────────────────────────────────────────────────
function DialBar({
  leftLabel, rightLabel, value, onChange, disabled, targetValue, showTarget,
  guessValue, showGuess,
}: {
  leftLabel: string; rightLabel: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  targetValue?: number; showTarget?: boolean;
  guessValue?: number;  showGuess?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointer = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    const rect = trackRef.current!.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onChange(Math.round(pct * 100));
  }, [disabled, onChange]);

  return (
    <div className="space-y-3">
      {/* Labels */}
      <div className="flex items-center justify-between text-xs font-black">
        <span className="text-white/70">{leftLabel}</span>
        <span className="text-white/70">{rightLabel}</span>
      </div>

      {/* Track */}
      <div className="relative"
        ref={trackRef}
        onPointerDown={handlePointer}
        onPointerMove={e => { if (e.buttons > 0) handlePointer(e); }}
        style={{ cursor: disabled ? "default" : "ew-resize" }}>

        {/* Background track */}
        <div className="h-10 rounded-xs overflow-hidden relative"
          style={{ background: `linear-gradient(90deg, rgba(99,102,241,0.3), rgba(6,182,212,0.15) 50%, rgba(239,68,68,0.3))` }}>

          {/* Zone bands */}
          {showTarget && targetValue !== undefined && (
            <>
              {/* Perfect zone (±5) */}
              <div className="absolute inset-y-0"
                style={{
                  left:  `${Math.max(0, targetValue - 5)}%`,
                  width: `${Math.min(100 - Math.max(0, targetValue - 5), 10)}%`,
                  background: "rgba(16,185,129,0.35)",
                }} />
              {/* Good zone (±12) */}
              <div className="absolute inset-y-0 opacity-50"
                style={{
                  left:  `${Math.max(0, targetValue - 12)}%`,
                  width: `${Math.min(100 - Math.max(0, targetValue - 12), 24)}%`,
                  background: "rgba(245,158,11,0.3)",
                }} />
            </>
          )}

          {/* Target marker */}
          {showTarget && targetValue !== undefined && (
            <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              className="absolute inset-y-0 w-1 rounded-full"
              style={{ left: `${targetValue}%`, transform: "translateX(-50%)", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
          )}

          {/* Opponent guess marker */}
          {showGuess && guessValue !== undefined && (
            <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              className="absolute inset-y-0 w-1"
              style={{ left: `${guessValue}%`, transform: "translateX(-50%)", background: "#06b6d4", boxShadow: "0 0 8px #06b6d4" }} />
          )}

          {/* My marker */}
          {!disabled && (
            <motion.div
              className="absolute inset-y-0 w-1.5 rounded-full"
              animate={{ left: `${value}%` }}
              transition={{ duration: 0.05 }}
              style={{ transform: "translateX(-50%)", background: "#a855f7", boxShadow: "0 0 12px rgba(168,85,247,0.8)" }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
            </motion.div>
          )}
        </div>

        {/* Value label */}
        {!disabled && (
          <div className="absolute -bottom-5 font-black text-[10px] text-purple-400"
            style={{ left: `${value}%`, transform: "translateX(-50%)" }}>
            {value}
          </div>
        )}
      </div>

      {/* Legend */}
      {showTarget && (
        <div className="flex items-center gap-4 text-[9px] mt-6">
          <span className="flex items-center gap-1 text-white/30">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Your guess
          </span>
          <span className="flex items-center gap-1 text-white/30">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Target
          </span>
          {showGuess && (
            <span className="flex items-center gap-1 text-white/30">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> {`Opp guess`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function FrequencyGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: FrequencyProps) {
  const { play } = useGameSound(soundEnabled);

  type Role  = "giver" | "receiver";
  type Phase = "clue_writing" | "clue_waiting" | "guessing" | "reveal" | "done";

  const [round,       setRound]       = useState(1);
  const [phase,       setPhase]       = useState<Phase>("clue_writing");
  const [myRole,      setMyRole]      = useState<Role>("giver");
  const [spectrum,    setSpectrum]    = useState(SPECTRUM_PAIRS[0]);
  const [dialTarget,  setDialTarget]  = useState(50); // secret position
  const [clueInput,   setClueInput]   = useState("");
  const [clueGiven,   setClueGiven]   = useState("");  // the clue shown to receiver
  const [myDial,      setMyDial]      = useState(50);
  const [myScore,     setMyScore]     = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(CLUE_SECS);
  const [oppDial,     setOppDial]     = useState<number | null>(null);
  const [locked,      setLocked]      = useState(false);
  const [roundResult, setRoundResult] = useState<{
    myPts: number; oppPts: number;
    headline: string;
    target: number; myGuess?: number; oppGuess?: number;
    clue: string;
  } | null>(null);

  const myScoreRef  = useRef(0);
  const oppScoreRef = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef   = useRef(false);

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number, role: Role) => {
    const seed     = Date.now() ^ (rnd * 0x1a2b3c);
    const pairIdx  = Math.abs(seed) % SPECTRUM_PAIRS.length;
    const target   = 10 + (Math.abs(seed >> 8) % 80); // 10–90 to avoid extremes
    setSpectrum(SPECTRUM_PAIRS[pairIdx]);
    setDialTarget(target);
    setMyRole(role);
    setClueInput("");
    setClueGiven("");
    setMyDial(50);
    setOppDial(null);
    lockedRef.current = false;
    setLocked(false);
    setRoundResult(null);
    setTimeLeft(role === "giver" ? CLUE_SECS : GUESS_SECS);
    setPhase(role === "giver" ? "clue_writing" : "clue_waiting");
    play("roundStart");
  }, [play]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "reveal" || phase === "done") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        if (t <= 4) play("timerUrgent");
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase, round, play]);

  // Auto-submit on timeout
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (phase === "clue_writing" && !lockedRef.current) submitClue();
    if (phase === "guessing"     && !lockedRef.current) lockGuess();
  }, [timeLeft]); // eslint-disable-line

  // ── Submit clue (giver) ───────────────────────────────────────────────────
  const submitClue = useCallback(() => {
    if (lockedRef.current) return;
    const clue = clueInput.trim() || "mystery";
    lockedRef.current = true;
    setLocked(true);
    setClueGiven(clue);
    clearInterval(timerRef.current!);
    play("moveLock");

    // Simulate opponent (receiver) guessing (DEMO)
    const oppGuessVal = aiGuess(dialTarget);
    setTimeout(() => {
      setOppDial(oppGuessVal);
    }, 1500 + Math.random() * 3000);

    // Move to waiting — opponent is receiving the clue
    setPhase("clue_waiting");
    // After brief pause, show that both can now guess (in prod: opponent would see clue)
    setTimeout(() => {
      setTimeLeft(GUESS_SECS);
      setPhase("guessing");
    }, 1200);
  }, [clueInput, dialTarget, play]);

  // ── Lock guess (receiver) ─────────────────────────────────────────────────
  const lockGuess = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    clearInterval(timerRef.current!);
    play("moveLock");

    // Simulate AI giving a clue and the "target"
    const oppClue = AI_CLUES[Math.floor(Math.random() * AI_CLUES.length)];
    setClueGiven(oppClue);

    // Resolve after brief pause
    setTimeout(() => resolveRound(myDial, dialTarget, oppClue), 600);
  }, [myDial, dialTarget, play]); // eslint-disable-line

  // ── Resolve round ─────────────────────────────────────────────────────────
  const resolveRound = useCallback((
    guess: number, target: number, clue: string
  ) => {
    const isGiver    = myRole === "giver";
    const oppGuessV  = oppDial ?? aiGuess(target);

    let myPts  = 0;
    let oppPts = 0;

    if (isGiver) {
      // I gave the clue — opponent guesses — I score based on their accuracy
      // (the better they guessed my clue, the more I demonstrated good clue-giving)
      myPts  = dialScore(oppGuessV, target);
      // My own guess was on the clue side — I also get pts for accuracy
      oppPts = dialScore(guess, target); // opponent's perspective (they were receiver)
    } else {
      // I received the clue — I guess
      myPts  = dialScore(guess,     target);
      oppPts = dialScore(oppGuessV, target);
    }

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const dist      = Math.abs(guess - target);
    const headline  =
      dist <= 5  ? "🎯 Perfect reading — you're on the same wavelength!" :
      dist <= 12 ? "✅ Great alignment!" :
      dist <= 20 ? "👍 Close enough" :
      myPts > 0  ? "🌊 In range" : "📡 Signal lost — too far off";

    play(myPts >= 22 ? "predCorrect" : myPts >= 7 ? "roundEnd" : "predWrong");
    setRoundResult({
      myPts, oppPts, headline, target,
      myGuess: isGiver ? undefined : guess,
      oppGuess: oppGuessV,
      clue,
    });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        const nextRole: Role = myRole === "giver" ? "receiver" : "giver";
        setRound(r => r + 1);
        setupRound(round + 1, nextRole);
      }
    }, 3500);
  }, [myRole, oppDial, round, onComplete, onScoreUpdate, play, setupRound]);

  useEffect(() => { setupRound(1, "giver"); return () => clearInterval(timerRef.current!); }, []); // eslint-disable-line

  const timerColor = timeLeft <= 4 ? "#ef4444" : timeLeft <= 8 ? "#f59e0b" : "#6366f1";

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
            className="text-3xl font-black" style={{ color: "#6366f1", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          <div className="text-[9px] font-black" style={{ color: myRole === "giver" ? "#f59e0b" : "#06b6d4" }}>
            {myRole === "giver" ? "📡 TRANSMITTING" : "📻 RECEIVING"}
          </div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      {/* ── Spectrum display ── */}
      <div className="rounded-xs py-3 px-4 text-center"
        style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <p className="text-[9px] uppercase tracking-widest font-black text-white/25 mb-1">This Round's Spectrum</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-black text-white">{spectrum[0]}</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.4), rgba(6,182,212,0.4))" }} />
          <span className="text-base font-black text-white">{spectrum[1]}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── GIVER: Write clue ── */}
        {phase === "clue_writing" && (
          <motion.div key="write" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <div className="rounded-xs p-3 text-center"
              style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-black text-white mb-1">📡 You are the Transmitter</p>
              <p className="text-[10px] text-white/40">
                The secret dial is at position <strong className="text-amber-400">{dialTarget}</strong> on the spectrum above.
                Give {opponentName} ONE word that maps to that position. Too obvious or too vague — they'll miss it.
              </p>
            </div>

            {/* Show the secret target position */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-black text-white/25">Secret Position</p>
              <DialBar
                leftLabel={spectrum[0]} rightLabel={spectrum[1]}
                value={dialTarget} onChange={() => {}} disabled
                targetValue={dialTarget} showTarget
              />
            </div>

            {/* Clue input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest font-black text-white/25">Your One-Word Clue</p>
                <span className="font-black text-sm" style={{ color: timerColor }}>{timeLeft}s</span>
              </div>
              <div className="flex gap-2">
                <input autoFocus value={clueInput}
                  onChange={e => setClueInput(e.target.value.replace(/\s/g, "").slice(0, 20))}
                  onKeyDown={e => e.key === "Enter" && submitClue()}
                  placeholder="One word only…"
                  className="flex-1 px-4 py-3 text-base font-black text-white outline-none rounded-xs"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }} />
                <motion.button whileTap={{ scale: 0.95 }} onClick={submitClue}
                  disabled={!clueInput.trim() || locked}
                  className="px-4 rounded-xs font-black text-white disabled:opacity-30"
                  style={{ background: clueInput.trim() ? "#6366f1" : "rgba(255,255,255,0.05)" }}>
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
              <p className="text-[9px] text-white/20 mt-1.5">
                Single word — no numbers, no gestures toward the spectrum labels
              </p>
            </div>
          </motion.div>
        )}

        {/* ── GIVER waiting / RECEIVER guessing ── */}
        {(phase === "clue_waiting" || phase === "guessing") && (
          <motion.div key="guess" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">

            {/* Show the clue */}
            {clueGiven && (
              <div className="rounded-xs py-4 text-center"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)" }}>
                <p className="text-[9px] uppercase tracking-widest font-black text-white/25 mb-1">
                  {myRole === "giver" ? "Your clue" : `${opponentName}'s clue`}
                </p>
                <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>
                  {clueGiven.toUpperCase()}
                </p>
              </div>
            )}

            {phase === "clue_waiting" && !clueGiven && (
              <div className="py-6 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-white/35">Waiting for clue…</p>
              </div>
            )}

            {/* Dial */}
            {phase === "guessing" && clueGiven && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-white">Where does that clue sit?</p>
                  <span className="font-black text-lg" style={{ color: timerColor }}>{timeLeft}s</span>
                </div>

                <DialBar
                  leftLabel={spectrum[0]} rightLabel={spectrum[1]}
                  value={myDial} onChange={setMyDial}
                  disabled={locked}
                />

                {/* Opponent status */}
                <div className="flex items-center gap-1.5 text-[10px]"
                  style={{ color: oppDial !== null ? "#10b981" : "rgba(255,255,255,0.3)" }}>
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{ background: oppDial !== null ? "#10b981" : "rgba(255,255,255,0.15)" }} />
                  {oppDial !== null ? `${opponentName} locked in` : `${opponentName} adjusting dial…`}
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={lockGuess} disabled={locked}
                  className="w-full py-3.5 rounded-xs text-sm font-black text-white disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: locked ? "rgba(99,102,241,0.15)" : "#6366f1", boxShadow: locked ? "none" : "0 0 28px rgba(99,102,241,0.5)", border: locked ? "1px solid rgba(99,102,241,0.3)" : "none" }}>
                  {locked
                    ? <><div className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />Revealing…</>
                    : <><Check className="w-4 h-4" />Lock Position: {myDial}</>}
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {/* ── Reveal ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-4">
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>

            {/* Dial with all markers shown */}
            <DialBar
              leftLabel={spectrum[0]} rightLabel={spectrum[1]}
              value={roundResult.myGuess ?? roundResult.target}
              onChange={() => {}} disabled
              targetValue={roundResult.target} showTarget
              guessValue={roundResult.oppGuess} showGuess
            />

            <div className="text-center text-[10px] text-white/30 space-y-0.5">
              <div>Clue: <strong className="text-white text-sm">{roundResult.clue.toUpperCase()}</strong></div>
              <div>Target: <strong className="text-amber-400">{roundResult.target}</strong>
                {roundResult.myGuess !== undefined && (
                  <> · Your guess: <strong className="text-purple-400">{roundResult.myGuess}</strong></>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#6366f1" }}>+{roundResult.myPts}</div>
                <div className="text-[9px] text-white/30">You</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>+{roundResult.oppPts}</div>
                <div className="text-[9px] text-white/30">{opponentName}</div>
              </div>
            </div>
            <p className="text-center text-[10px] text-white/22">
              Next round: you become the {myRole === "giver" ? "Receiver 📻" : "Transmitter 📡"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}