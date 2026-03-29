// =============================================================================
// TOKEN RUSH — Game 10: Phantom Word
// app/token-rush/_games/phantom-word.tsx
//
// A linguistic deduction duel. One player thinks of a secret 5-letter word.
// The other probes with guesses — but instead of colour/position feedback
// they only receive a "heat score": how many letters overlap in ANY position
// (a raw letter intersection count, 0–5). Pure information theory.
//
// Roles swap every round. Keeper scores when Seeker fails to crack the word
// within their guess budget. Seeker scores when they crack it with guesses
// to spare — fewer guesses used = more points.
//
// ANTI-CHEAT: Keeper's word committed to server as a hash before any guesses.
// Heat scores computed server-side — Seeker never sees the word.
//
// DEMO MODE: Word validation and heat scores computed locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, Send, Eye, EyeOff, Check, X } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface PhantomWordProps {
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

const TOTAL_ROUNDS   = 6;
const MAX_GUESSES    = 7;   // seeker has 7 attempts
const WORD_LENGTH    = 5;

// Points for seeker: more guesses left = more points
const SEEKER_PTS  = [30, 25, 20, 15, 10, 7, 4]; // indexed by guesses remaining
const KEEPER_PTS  = 20; // keeper earns if seeker fails all 7

// ── Word banks by difficulty ───────────────────────────────────────────────────
const EASY_WORDS = [
  "BRAIN", "CLOUD", "LIGHT", "OCEAN", "PLANT",
  "SOLAR", "RIVER", "FLAME", "STORM", "FRESH",
  "GRACE", "SWIFT", "NOBLE", "BRAVE", "QUIET",
];

const HARD_WORDS = [
  "CRYPT", "NEXUS", "PRISM", "QUILT", "VENOM",
  "FJORD", "GLYPH", "KNACK", "PYGMY", "ZEBRA",
  "WHIRL", "FLUFF", "CRIMP", "BLOTCH", "ZYNTH",
];

const WORD_POOL = [...EASY_WORDS, ...HARD_WORDS];

// ── Heat score — letter intersection, any position ────────────────────────────
function heatScore(guess: string, secret: string): number {
  const gSet = new Set(guess.toUpperCase().split(""));
  const sSet = new Set(secret.toUpperCase().split(""));
  let count = 0;
  for (const ch of gSet) { if (sSet.has(ch)) count++; }
  return count;
}

// ── Heat colour ───────────────────────────────────────────────────────────────
function heatColor(score: number): string {
  if (score >= 5) return "#10b981";
  if (score >= 4) return "#22c55e";
  if (score >= 3) return "#f59e0b";
  if (score >= 2) return "#f97316";
  if (score >= 1) return "#ef4444";
  return "rgba(255,255,255,0.2)";
}

function heatLabel(score: number): string {
  if (score >= 5) return "🔥 Burning";
  if (score >= 4) return "♨️  Very hot";
  if (score >= 3) return "🌡️  Warm";
  if (score >= 2) return "❄️  Cool";
  if (score >= 1) return "🧊 Cold";
  return "🌑 Ice cold";
}

// ── AI guesser ────────────────────────────────────────────────────────────────
function aiNextGuess(
  previous: { word: string; score: number }[],
  pool: string[],
): string {
  if (previous.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  // Filter candidates whose heat score vs previous guesses is plausible
  const last = previous[previous.length - 1];
  const candidates = pool.filter(w => {
    if (previous.some(p => p.word === w)) return false;
    const hs = heatScore(last.word, w);
    return Math.abs(hs - last.score) <= 1;
  });
  if (candidates.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function PhantomWordGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: PhantomWordProps) {
  const { play } = useGameSound(soundEnabled);

  type Role  = "keeper" | "seeker";
  type Phase = "picking" | "seeking" | "reveal" | "done";

  const [round,        setRound]        = useState(1);
  const [phase,        setPhase]        = useState<Phase>("picking");
  const [myRole,       setMyRole]       = useState<Role>("keeper");
  const [secretWord,   setSecretWord]   = useState("");    // keeper's word
  const [wordInput,    setWordInput]    = useState("");
  const [guessInput,   setGuessInput]   = useState("");
  const [guesses,      setGuesses]      = useState<{ word: string; score: number }[]>([]);
  const [myScore,      setMyScore]      = useState(0);
  const [oppScore,     setOppScore]     = useState(0);
  const [revealed,     setRevealed]     = useState(false);
  const [roundResult,  setRoundResult]  = useState<{
    myPts: number; oppPts: number;
    headline: string;
    secret: string; solved: boolean;
  } | null>(null);
  const [wrongMsg,     setWrongMsg]     = useState<string | null>(null);
  const [oppGuessing,  setOppGuessing]  = useState(false);

  const myScoreRef  = useRef(0);
  const oppScoreRef = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number, role: Role) => {
    setMyRole(role);
    setSecretWord("");
    setWordInput("");
    setGuessInput("");
    setGuesses([]);
    setRevealed(false);
    setRoundResult(null);
    setWrongMsg(null);
    setOppGuessing(false);

    if (role === "seeker") {
      // Opponent picks a word (DEMO: pick randomly)
      const secret = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
      setSecretWord(secret);
      setPhase("seeking");
    } else {
      setPhase("picking");
    }
    play("roundStart");
  }, [play]);

  // ── Keeper submits word ───────────────────────────────────────────────────
  const submitWord = useCallback(() => {
    const w = wordInput.trim().toUpperCase();
    if (w.length !== WORD_LENGTH || !/^[A-Z]+$/.test(w)) {
      setWrongMsg("Must be exactly 5 letters A–Z"); return;
    }
    setSecretWord(w);
    setWordInput("");
    setWrongMsg(null);
    // In production: POST hash to server
    setPhase("seeking");
    setOppGuessing(true);
    play("moveLock");

    // Simulate opponent (seeker) guessing (DEMO)
    const oppGuesses: { word: string; score: number }[] = [];
    let found = false;
    const tryOpp = () => {
      if (found || oppGuesses.length >= MAX_GUESSES) {
        if (!found) resolveRound(w, false, oppGuesses.length);
        return;
      }
      const g = aiNextGuess(oppGuesses, WORD_POOL);
      const hs = heatScore(g, w);
      oppGuesses.push({ word: g, score: hs });
      if (g === w) { found = true; resolveRound(w, true, MAX_GUESSES - oppGuesses.length); return; }
      setTimeout(tryOpp, 1200 + Math.random() * 1000);
    };
    setTimeout(tryOpp, 1500);
  }, [wordInput, play]); // eslint-disable-line

  // ── Seeker submits guess ──────────────────────────────────────────────────
  const submitGuess = useCallback(() => {
    const g = guessInput.trim().toUpperCase();
    if (g.length !== WORD_LENGTH || !/^[A-Z]+$/.test(g)) {
      setWrongMsg("Must be 5 letters"); return;
    }
    if (guesses.some(x => x.word === g)) {
      setWrongMsg("Already guessed that"); return;
    }
    setWrongMsg(null);
    setGuessInput("");

    const hs = heatScore(g, secretWord);
    const newGuesses = [...guesses, { word: g, score: hs }];
    setGuesses(newGuesses);
    play(hs >= 4 ? "probeHit" : "probeMiss");

    if (g === secretWord) {
      // Cracked it!
      const guessesLeft = MAX_GUESSES - newGuesses.length;
      play("predCorrect");
      resolveRound(secretWord, true, guessesLeft);
    } else if (newGuesses.length >= MAX_GUESSES) {
      // Used all guesses
      play("predWrong");
      resolveRound(secretWord, false, 0);
    }
  }, [guessInput, guesses, secretWord, play]); // eslint-disable-line

  // ── Resolve ───────────────────────────────────────────────────────────────
  const resolveRound = useCallback((secret: string, solved: boolean, guessesLeft: number) => {
    const iAmSeeker = myRole === "seeker";
    let myPts  = 0;
    let oppPts = 0;

    if (iAmSeeker) {
      myPts  = solved ? (SEEKER_PTS[MAX_GUESSES - 1 - guessesLeft] ?? 4) : 0;
      oppPts = solved ? 0 : KEEPER_PTS;
    } else {
      // I was keeper — opponent was seeker
      oppPts = solved ? (SEEKER_PTS[MAX_GUESSES - 1 - guessesLeft] ?? 4) : 0;
      myPts  = solved ? 0 : KEEPER_PTS;
    }

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline = iAmSeeker
      ? solved ? `🔓 Cracked it! ${guessesLeft > 0 ? guessesLeft + " guesses to spare" : "Last guess!"}` : `💀 Word not found — ${opponentName} earns ${KEEPER_PTS} pts`
      : solved ? `👁️ ${opponentName} cracked your word!` : `🛡️ Your word held! +${KEEPER_PTS} pts`;

    play(myPts > oppPts ? "predCorrect" : myPts > 0 ? "roundEnd" : "predWrong");
    setRevealed(true);
    setRoundResult({ myPts, oppPts, headline, secret, solved });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        const nextRole: Role = myRole === "keeper" ? "seeker" : "keeper";
        setRound(r => r + 1);
        setupRound(round + 1, nextRole);
      }
    }, 3500);
  }, [myRole, round, opponentName, onComplete, onScoreUpdate, play, setupRound]);

  useEffect(() => { setupRound(1, "keeper"); return () => clearInterval(timerRef.current!); }, []); // eslint-disable-line

  const guessesLeft = MAX_GUESSES - guesses.length;

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
            className="text-3xl font-black" style={{ color: "#10b981", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          <div className="text-[9px] font-black" style={{ color: myRole === "keeper" ? "#f59e0b" : "#06b6d4" }}>
            {myRole === "keeper" ? "🔐 KEEPER" : "🔍 SEEKER"}
          </div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── KEEPER: pick a word ── */}
        {phase === "picking" && (
          <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <div className="rounded-xs p-3 text-center"
              style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-black text-white mb-0.5">🔐 You are the Keeper</p>
              <p className="text-[10px] text-white/40">
                Choose a secret 5-letter word. {opponentName} will guess it using only heat scores —
                how many letters match in any position. Earn <strong className="text-amber-400">+{KEEPER_PTS} pts</strong> if they fail all {MAX_GUESSES} guesses.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-white/28">Your Secret Word (5 letters)</label>
              <div className="flex gap-2">
                <input
                  autoFocus value={wordInput}
                  onChange={e => setWordInput(e.target.value.toUpperCase().replace(/[^A-Z]/g,"").slice(0, 5))}
                  onKeyDown={e => e.key === "Enter" && submitWord()}
                  placeholder="E.G. STORM"
                  maxLength={5}
                  className="flex-1 px-4 py-3 text-xl font-black text-white tracking-widest outline-none rounded-xs"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", letterSpacing: "0.3em" }} />
                <motion.button whileTap={{ scale: 0.95 }} onClick={submitWord}
                  disabled={wordInput.length !== 5}
                  className="px-4 rounded-xs font-black text-white disabled:opacity-30"
                  style={{ background: wordInput.length === 5 ? "#f59e0b" : "rgba(255,255,255,0.05)" }}>
                  <EyeOff className="w-5 h-5" />
                </motion.button>
              </div>
              {wrongMsg && <p className="text-xs text-red-400">{wrongMsg}</p>}
            </div>

            {/* Word display preview */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-11 h-12 rounded-xs flex items-center justify-center text-xl font-black"
                  style={{
                    background: wordInput[i] ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                    border: wordInput[i] ? "2px solid rgba(245,158,11,0.5)" : "1px dashed rgba(255,255,255,0.15)",
                    color: "#f59e0b",
                  }}>
                  {wordInput[i] ?? ""}
                </div>
              ))}
            </div>

            {/* Quick pick */}
            <div className="space-y-1.5">
              <p className="text-[9px] uppercase tracking-widest font-black text-white/22">Or pick a word</p>
              <div className="flex flex-wrap gap-1.5">
                {EASY_WORDS.slice(0, 8).map(w => (
                  <button key={w} onClick={() => setWordInput(w)}
                    className="px-2.5 py-1 rounded-xs text-xs font-black"
                    style={{ background: wordInput === w ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${wordInput === w ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`, color: wordInput === w ? "#f59e0b" : "rgba(255,255,255,0.4)" }}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SEEKER / KEEPER watching ── */}
        {phase === "seeking" && (
          <motion.div key="seek" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">

            {myRole === "seeker" && (
              <div className="rounded-xs p-3 text-center"
                style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <p className="text-xs font-black text-white mb-0.5">🔍 You are the Seeker</p>
                <p className="text-[10px] text-white/40">
                  Guess {opponentName}'s 5-letter word. Each guess gives you a heat score (0–5): how many letters exist in the word regardless of position. {guessesLeft} guesses remaining.
                </p>
              </div>
            )}

            {myRole === "keeper" && (
              <div className="rounded-xs p-3 text-center"
                style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p className="text-xs font-black text-white mb-0.5">🔐 {opponentName} is seeking your word</p>
                <p className="text-[10px] text-white/40">
                  Your word: <strong className="tracking-widest font-black text-white">{secretWord}</strong> — will they crack it in {MAX_GUESSES} guesses?
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] text-white/40">{opponentName} is guessing…</span>
                </div>
              </div>
            )}

            {/* Guess history */}
            {guesses.length > 0 && (
              <div className="space-y-1.5">
                {guesses.map((g, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xs"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-[10px] font-black text-white/25">{i + 1}</span>
                    <span className="text-base font-black tracking-widest text-white" style={{ letterSpacing: "0.2em" }}>{g.word}</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Thermometer className="w-3.5 h-3.5 flex-shrink-0" style={{ color: heatColor(g.score) }} />
                      <span className="text-sm font-black" style={{ color: heatColor(g.score) }}>{g.score}/5</span>
                      <span className="text-[10px]" style={{ color: heatColor(g.score) }}>{heatLabel(g.score)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Guess input (only for seeker) */}
            {myRole === "seeker" && guessesLeft > 0 && (
              <>
                <div className="flex gap-2">
                  <input autoFocus value={guessInput}
                    onChange={e => setGuessInput(e.target.value.toUpperCase().replace(/[^A-Z]/g,"").slice(0, 5))}
                    onKeyDown={e => e.key === "Enter" && submitGuess()}
                    placeholder="Your guess…"
                    maxLength={5}
                    className="flex-1 px-4 py-3 text-lg font-black text-white tracking-widest outline-none rounded-xs"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", letterSpacing: "0.2em" }} />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={submitGuess}
                    disabled={guessInput.length !== 5}
                    className="px-4 rounded-xs font-black text-white disabled:opacity-30"
                    style={{ background: guessInput.length === 5 ? "#06b6d4" : "rgba(255,255,255,0.05)" }}>
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
                {wrongMsg && <p className="text-xs text-red-400">{wrongMsg}</p>}
                <div className="flex justify-between text-[10px] text-white/25">
                  <span>{guessesLeft}/{MAX_GUESSES} guesses remaining</span>
                  <span>Score if cracked now: <strong className="text-white">{SEEKER_PTS[MAX_GUESSES - guessesLeft]}</strong> pts</span>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Reveal ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xs p-5 space-y-4"
            style={{ background: "rgba(6,6,18,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>
            <div className="text-center py-3 rounded-xs"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1">The Word Was</p>
              <p className="text-3xl font-black text-white tracking-widest">{roundResult.secret}</p>
            </div>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#10b981" }}>+{roundResult.myPts}</div>
                <div className="text-[9px] text-white/30">You</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>+{roundResult.oppPts}</div>
                <div className="text-[9px] text-white/30">{opponentName}</div>
              </div>
            </div>
            <p className="text-center text-[10px] text-white/25">
              Next: you become the {myRole === "keeper" ? "Seeker 🔍" : "Keeper 🔐"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}