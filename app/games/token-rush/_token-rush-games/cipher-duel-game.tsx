// =============================================================================
// TOKEN RUSH — Game 4: Cipher Duel
// app/token-rush/_games/cipher-duel.tsx
//
// Real-time encryption/decryption war.
// Each round: decode a scrambled word using your cipher key.
// Race to decode it — fastest correct answer wins points + speed bonus.
// Wrong submissions cost you points.
//
// ANTI-CHEAT: Cipher keys and encoded words are generated server-side.
// Submissions validated against stored answer — no client-side logic is trusted.
//
// DEMO MODE: Cipher keys and words generated locally. Remove DEMO block and
// wire in /api/token-rush/challenges/[id]/cipher-round in production.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, AlertTriangle, Zap, Clock } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CipherDuelProps {
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

// ── Word bank ─────────────────────────────────────────────────────────────────
const WORDS = [
  "BRAIN", "CIPHER", "SPEED", "TOKEN", "LOGIC", "SHARP",
  "FOCUS", "POWER", "STORM", "BLAZE", "FROST", "CRYPT",
  "NEXUS", "AXIOM", "FORGE", "DELTA", "OMEGA", "PRISM",
  "QUARK", "VENOM", "ZEAL",  "EPOCH", "FLARE", "GLINT",
];

const TOTAL_ROUNDS   = 8;
const ROUND_SECONDS  = 20;
const PTS_CORRECT    = 15;
const PTS_SPEED_MAX  = 10;   // bonus for solving quickly
const PTS_WRONG_COST = 5;

// ── Cipher helpers ────────────────────────────────────────────────────────────
// Simple substitution cipher: each letter shifted by a different amount

type CipherKey = number[]; // 26 offsets, one per letter

function generateCipherKey(seed: number): CipherKey {
  const key: number[] = [];
  let s = seed;
  for (let i = 0; i < 26; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    key.push((Math.abs(s) % 25) + 1); // 1–25 offset
  }
  return key;
}

function encode(word: string, key: CipherKey): string {
  return word
    .toUpperCase()
    .split("")
    .map(ch => {
      const idx = ch.charCodeAt(0) - 65;
      if (idx < 0 || idx > 25) return ch;
      return String.fromCharCode(((idx + key[idx]) % 26) + 65);
    })
    .join("");
}

function decode(encoded: string, key: CipherKey): string {
  return encoded
    .toUpperCase()
    .split("")
    .map(ch => {
      const idx = ch.charCodeAt(0) - 65;
      if (idx < 0 || idx > 25) return ch;
      // Find original index: (orig + key[orig]) % 26 = idx
      for (let o = 0; o < 26; o++) {
        if ((o + key[o]) % 26 === idx) return String.fromCharCode(o + 65);
      }
      return ch;
    })
    .join("");
}

// ── Difficulty progression: word length increases ─────────────────────────────
function getWordsForRound(round: number): string[] {
  const minLen = Math.min(4 + Math.floor(round / 3), 6);
  return WORDS.filter(w => w.length >= minLen);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function CipherDuelGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: CipherDuelProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "intro" | "racing" | "reveal" | "done";

  const [round,        setRound]        = useState(1);
  const [phase,        setPhase]        = useState<Phase>("intro");
  const [cipherKey,    setCipherKey]    = useState<CipherKey>([]);
  const [encodedWord,  setEncodedWord]  = useState("");
  const [answer,       setAnswer]       = useState("");  // correct decoded word
  const [userInput,    setUserInput]    = useState("");
  const [myScore,      setMyScore]      = useState(0);
  const [oppScore,     setOppScore]     = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(ROUND_SECONDS);
  const [submitCount,  setSubmitCount]  = useState(0);   // wrong guesses this round
  const [oppSolved,    setOppSolved]    = useState(false);
  const [roundResult,  setRoundResult]  = useState<{
    myPts: number; oppPts: number; correct: boolean; headline: string; answer: string;
  } | null>(null);
  const [wrongFlash,   setWrongFlash]   = useState(false);
  const [roundStart,   setRoundStart]   = useState(0);   // timestamp for speed bonus

  const myScoreRef  = useRef(0);
  const oppScoreRef = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const solvedRef   = useRef(false);

  // ── Setup a round ─────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number) => {
    const seed  = Date.now() ^ (rnd * 0xdeadbeef);
    const key   = generateCipherKey(seed);
    const pool  = getWordsForRound(rnd);
    const word  = pool[Math.abs(seed) % pool.length];
    const enc   = encode(word, key);

    setCipherKey(key);
    setEncodedWord(enc);
    setAnswer(word);
    setUserInput("");
    setSubmitCount(0);
    setOppSolved(false);
    solvedRef.current = false;
    setTimeLeft(ROUND_SECONDS);
    setRoundStart(Date.now());
    setPhase("racing");
    play("roundStart");

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!solvedRef.current) finalise(word, false, ROUND_SECONDS);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Simulate opponent solving (DEMO)
    const oppTime = (8 + Math.random() * 10) * 1000;
    setTimeout(() => {
      if (!solvedRef.current) setOppSolved(true);
    }, oppTime);
  }, [play]); // eslint-disable-line

  // ── Submit answer ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (phase !== "racing" || solvedRef.current) return;
    const guess = userInput.trim().toUpperCase();
    if (guess === answer) {
      clearInterval(timerRef.current!);
      finalise(answer, true, (Date.now() - roundStart) / 1000);
    } else {
      // Wrong answer
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
      setSubmitCount(c => c + 1);
      setUserInput("");
      play("predWrong");
      // Opponent gets distraction bonus
      oppScoreRef.current += 3;
      setOppScore(oppScoreRef.current);
    }
  }, [phase, userInput, answer, roundStart, play]);

  const finalise = useCallback((correctAnswer: string, solved: boolean, elapsed: number) => {
    solvedRef.current = true;

    const speedBonus  = solved
      ? Math.round(PTS_SPEED_MAX * Math.max(0, 1 - elapsed / ROUND_SECONDS))
      : 0;
    const myPts  = solved ? PTS_CORRECT + speedBonus : -(submitCount * PTS_WRONG_COST);
    const oppPts = solved ? 0 : 10; // opponent gets points if you fail

    myScoreRef.current  += Math.max(0, myPts);
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline = solved
      ? speedBonus >= 8 ? `⚡ Lightning decode! +${myPts} pts` : `✅ Decoded! +${myPts} pts`
      : "💀 Time's up — opponent takes the round";

    play(solved ? "predCorrect" : "predWrong");
    setRoundResult({ myPts: Math.max(0, myPts), oppPts, correct: solved, headline, answer: correctAnswer });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        setRound(r => r + 1);
        setRoundResult(null);
        setupRound(round + 1);
      }
    }, 3000);
  }, [round, submitCount, onComplete, onScoreUpdate, play, setupRound]);

  useEffect(() => { setupRound(1); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []); // eslint-disable-line

  // ── Cipher key display — 26-letter mapping ────────────────────────────────
  const alphabetRows = [
    "ABCDEFGHIJ".split(""),
    "KLMNOPQRST".split(""),
    "UVWXYZ".split(""),
  ];

  const timerColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : "#10b981";

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
            className="text-3xl font-black" style={{ color: "#10b981", letterSpacing: "-0.05em" }}>
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

      <AnimatePresence mode="wait">

        {/* ── Racing phase ── */}
        {phase === "racing" && (
          <motion.div key="racing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">

            {/* Timer + opponent status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: timerColor }} />
                <span className="text-2xl font-black" style={{ color: timerColor }}>{timeLeft}s</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: oppSolved ? "#10b981" : "rgba(255,255,255,0.3)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: oppSolved ? "#10b981" : "rgba(255,255,255,0.2)" }} />
                {oppSolved ? `${opponentName} solved it!` : `${opponentName} decoding…`}
              </div>
            </div>

            {/* Encoded word */}
            <div className="rounded-xs py-5 text-center"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <p className="text-[9px] uppercase tracking-widest font-black text-white/30 mb-2">Encoded Message</p>
              <div className="flex items-center justify-center gap-2">
                {encodedWord.split("").map((ch, i) => (
                  <div key={i} className="w-10 h-12 rounded-xs flex items-center justify-center text-xl font-black"
                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
                    {ch}
                  </div>
                ))}
              </div>
            </div>

            {/* Cipher key reference */}
            <div className="rounded-xs p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[9px] uppercase tracking-widest font-black text-white/25 mb-2.5">Your Cipher Key</p>
              <div className="space-y-1.5">
                {alphabetRows.map((row, ri) => (
                  <div key={ri} className="flex gap-1 justify-center">
                    {row.map(ch => {
                      const idx      = ch.charCodeAt(0) - 65;
                      const encChar  = String.fromCharCode(((idx + (cipherKey[idx] ?? 0)) % 26) + 65);
                      const isInWord = encodedWord.includes(encChar);
                      return (
                        <div key={ch} className="flex flex-col items-center gap-0.5">
                          <div className="w-6 h-5 rounded-xs flex items-center justify-center text-[9px] font-black"
                            style={{ background: isInWord ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", color: isInWord ? "#10b981" : "rgba(255,255,255,0.3)" }}>
                            {ch}
                          </div>
                          <div className="w-px h-2" style={{ background: "rgba(255,255,255,0.1)" }} />
                          <div className="w-6 h-5 rounded-xs flex items-center justify-center text-[9px] font-black"
                            style={{ background: isInWord ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)", color: isInWord ? "#10b981" : "rgba(255,255,255,0.4)", border: isInWord ? "1px solid rgba(16,185,129,0.4)" : "none" }}>
                            {encChar}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <p className="text-center text-[9px] text-white/20 mt-1">Plain → Encoded (highlighted = in message)</p>
              </div>
            </div>

            {/* Input */}
            <motion.div animate={{ borderColor: wrongFlash ? "#ef4444" : "rgba(255,255,255,0.14)" }}
              className="flex gap-2 rounded-xs overflow-hidden"
              style={{ border: `2px solid ${wrongFlash ? "#ef4444" : "rgba(255,255,255,0.14)"}` }}>
              <input
                autoFocus
                value={userInput}
                onChange={e => setUserInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Type decoded word…"
                maxLength={10}
                className="flex-1 px-4 py-3 text-base font-black text-white outline-none bg-transparent tracking-widest"
              />
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit}
                className="px-4 flex items-center justify-center"
                style={{ background: userInput.length >= 3 ? "#10b981" : "rgba(255,255,255,0.05)" }}>
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </motion.div>

            {submitCount > 0 && (
              <p className="text-center text-[10px]" style={{ color: "#ef4444" }}>
                {submitCount} wrong {submitCount === 1 ? "guess" : "guesses"} — each costs {PTS_WRONG_COST} pts
              </p>
            )}
          </motion.div>
        )}

        {/* ── Reveal ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal"
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="rounded-xs p-6 text-center space-y-4"
            style={{ background: "rgba(6,6,18,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-base font-black text-white">{roundResult.headline}</p>
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <div className="text-3xl font-black" style={{ color: "#10b981" }}>+{roundResult.myPts}</div>
                <div className="text-[10px] text-white/30">You</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black" style={{ color: "#06b6d4" }}>+{roundResult.oppPts}</div>
                <div className="text-[10px] text-white/30">{opponentName}</div>
              </div>
            </div>
            <div className="rounded-xs py-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1">Answer</p>
              <p className="text-2xl font-black text-white tracking-widest">{roundResult.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}