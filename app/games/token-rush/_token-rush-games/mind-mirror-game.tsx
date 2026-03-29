// =============================================================================
// TOKEN RUSH — Game 8: Mind Mirror
// app/token-rush/_games/mind-mirror.tsx
//
// A pattern-completion war with alternating roles every round.
// BUILDER: Creates a 4-step symbol sequence in secret. Wants to be
//          unpredictable — scores when the Guesser gets it wrong.
// GUESSER: Sees the first 2 steps revealed, must complete steps 3 & 4.
//          Scores when correct. Roles swap each round.
//
// ANTI-CHEAT: Builder's full sequence is committed to the server before
// any reveal. Guesser never receives steps 3 & 4 until after submission.
//
// DEMO MODE: Opponent logic simulated locally. Wire in the server move
// endpoints for production.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Shuffle, Check, X } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MindMirrorProps {
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

// ── Symbol set ────────────────────────────────────────────────────────────────
const SYMBOLS = [
  { id: 0,  glyph: "◆", label: "Diamond",  color: "#ef4444" },
  { id: 1,  glyph: "●", label: "Circle",   color: "#f59e0b" },
  { id: 2,  glyph: "▲", label: "Triangle", color: "#10b981" },
  { id: 3,  glyph: "★", label: "Star",     color: "#06b6d4" },
  { id: 4,  glyph: "■", label: "Square",   color: "#a855f7" },
  { id: 5,  glyph: "✦", label: "Cross",    color: "#f97316" },
  { id: 6,  glyph: "⬡", label: "Hex",      color: "#ec4899" },
  { id: 7,  glyph: "⊕", label: "Target",   color: "#14b8a6" },
] as const;

const SEQ_LEN     = 4;
const REVEAL_LEN  = 2;  // first 2 steps are shown to guesser
const TOTAL_ROUNDS = 8;

const PTS_BUILDER_WRONG = 12; // builder earns when guesser misses
const PTS_BUILDER_RIGHT = 0;  // builder earns nothing if guesser correct
const PTS_GUESSER_RIGHT = 20; // guesser earns for each correct step
const PTS_GUESSER_WRONG = 0;

// ── Opponent AI ───────────────────────────────────────────────────────────────
function aiGuess(revealed: number[]): number[] {
  // AI tries to follow a pattern but with randomness
  const last = revealed[revealed.length - 1];
  const g3   = Math.random() < 0.45 ? last : Math.floor(Math.random() * SYMBOLS.length);
  const g4   = Math.random() < 0.35 ? g3   : Math.floor(Math.random() * SYMBOLS.length);
  return [g3, g4];
}

function aiSequence(): number[] {
  // AI builds with slight patterns to seem human
  const seq = [Math.floor(Math.random() * SYMBOLS.length)];
  for (let i = 1; i < SEQ_LEN; i++) {
    const prev = seq[i - 1];
    const r    = Math.random();
    // 30% repeat, 30% adjacent, 40% random
    if (r < 0.3)      seq.push(prev);
    else if (r < 0.6) seq.push((prev + 1) % SYMBOLS.length);
    else              seq.push(Math.floor(Math.random() * SYMBOLS.length));
  }
  return seq;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function MindMirrorGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: MindMirrorProps) {
  const { play } = useGameSound(soundEnabled);

  // Host = builder first, rounds alternate
  type Role  = "builder" | "guesser";
  type Phase = "building" | "guessing" | "reveal" | "done";

  const [round,      setRound]      = useState(1);
  const [phase,      setPhase]      = useState<Phase>("building");
  const [myRole,     setMyRole]     = useState<Role>("builder");
  const [sequence,   setSequence]   = useState<number[]>([]);      // builder's full sequence
  const [myGuess,    setMyGuess]    = useState<number[]>([]);      // guesser's picks for steps 3+4
  const [revealed,   setRevealed]   = useState<number[]>([]);      // first REVEAL_LEN steps shown
  const [myScore,    setMyScore]    = useState(0);
  const [oppScore,   setOppScore]   = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(15);
  const [locked,     setLocked]     = useState(false);
  const [roundResult,setResult]     = useState<{
    myPts: number; oppPts: number;
    headline: string;
    correct: boolean[];
    fullSeq: number[];
    guess: number[];
  } | null>(null);

  const myScoreRef  = useRef(0);
  const oppScoreRef = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number, role: Role) => {
    setMyRole(role);
    setSequence([]);
    setMyGuess([]);
    setRevealed([]);
    setLocked(false);
    setResult(null);
    setTimeLeft(15);

    if (role === "builder") {
      setPhase("building");
    } else {
      // Opponent is builder — get their sequence (DEMO: generate locally)
      const oppSeq = aiSequence();
      setSequence(oppSeq);
      setRevealed(oppSeq.slice(0, REVEAL_LEN));
      setPhase("guessing");
    }

    play("roundStart");

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [play]);

  // ── Builder selects a symbol ──────────────────────────────────────────────
  const handleBuilderPick = (symbolId: number) => {
    if (sequence.length >= SEQ_LEN || locked) return;
    setSequence(s => [...s, symbolId]);
    play("uiClick");
  };

  const handleBuilderUndo = () => {
    if (locked) return;
    setSequence(s => s.slice(0, -1));
    play("uiClick");
  };

  // ── Builder locks sequence ────────────────────────────────────────────────
  const lockBuilderSequence = useCallback(() => {
    if (sequence.length < SEQ_LEN || locked) return;
    setLocked(true);
    clearInterval(timerRef.current!);
    play("moveLock");
    // Commit to server in production
    // await fetch(`/api/token-rush/challenges/${challengeId}/mind-sequence`, { method: "POST", body: JSON.stringify({ sequence }) })

    // Reveal first 2 to simulate opponent guessing (DEMO)
    const oppGuess = aiGuess(sequence.slice(0, REVEAL_LEN));
    setTimeout(() => {
      resolveRound(sequence, oppGuess, "guesser");
    }, 1500);
  }, [sequence, locked, play]); // eslint-disable-line

  // ── Guesser picks steps 3 & 4 ────────────────────────────────────────────
  const handleGuesserPick = (symbolId: number) => {
    if (myGuess.length >= SEQ_LEN - REVEAL_LEN || locked) return;
    setMyGuess(g => [...g, symbolId]);
    play("uiClick");
  };

  const lockGuesserGuess = useCallback(() => {
    if (myGuess.length < SEQ_LEN - REVEAL_LEN || locked) return;
    setLocked(true);
    clearInterval(timerRef.current!);
    play("moveLock");
    resolveRound(sequence, myGuess, "builder");
  }, [myGuess, sequence, locked, play]); // eslint-disable-line

  // ── Auto-submit on timeout ────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (phase === "building" && !locked) {
      // Fill remaining with random
      const fill = [...sequence];
      while (fill.length < SEQ_LEN) fill.push(Math.floor(Math.random() * SYMBOLS.length));
      setSequence(fill);
      setTimeout(() => lockBuilderSequence(), 100);
    } else if (phase === "guessing" && !locked) {
      const fill = [...myGuess];
      while (fill.length < SEQ_LEN - REVEAL_LEN) fill.push(Math.floor(Math.random() * SYMBOLS.length));
      setMyGuess(fill);
      setTimeout(() => lockGuesserGuess(), 100);
    }
  }, [timeLeft]); // eslint-disable-line

  // ── Resolve ───────────────────────────────────────────────────────────────
  const resolveRound = useCallback((
    seq: number[], guess: number[], myRoleAtResolve: "builder" | "guesser"
  ) => {
    const hidden  = seq.slice(REVEAL_LEN);
    const correct = hidden.map((s, i) => guess[i] === s);
    const matches = correct.filter(Boolean).length;

    let myPts  = 0;
    let oppPts = 0;

    if (myRoleAtResolve === "guesser") {
      // I was guesser — I score for matches, opponent (builder) scores for misses
      myPts  = matches * PTS_GUESSER_RIGHT;
      oppPts = (correct.length - matches) * PTS_BUILDER_WRONG;
    } else {
      // I was builder — opponent was guesser
      // oppGuess = guess
      const oppMatches = correct.filter(Boolean).length;
      oppPts = oppMatches * PTS_GUESSER_RIGHT;
      myPts  = (correct.length - oppMatches) * PTS_BUILDER_WRONG;
    }

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline =
      myRoleAtResolve === "guesser"
        ? matches === 2 ? "🔮 Perfect read — both steps correct!" :
          matches === 1 ? "✅ One correct" : "💀 Both wrong — opponent earns big"
        : matches === 0 ? "🎭 They couldn't read you! +24 pts" :
          matches === 1 ? "👁️ They guessed one…" : "🤯 They read your mind perfectly";

    play(myPts >= 15 ? "predCorrect" : myPts > 0 ? "roundEnd" : "predWrong");
    setResult({ myPts, oppPts, headline, correct, fullSeq: seq, guess });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        const nextRound = round + 1;
        const nextRole: Role = myRole === "builder" ? "guesser" : "builder";
        setRound(nextRound);
        setupRound(nextRound, nextRole);
      }
    }, 3500);
  }, [round, myRole, onComplete, onScoreUpdate, play, setupRound]);

  useEffect(() => { setupRound(1, "builder"); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []); // eslint-disable-line

  const timerColor  = timeLeft <= 5 ? "#ef4444" : timeLeft <= 8 ? "#f59e0b" : "#10b981";
  const guessNeeded = SEQ_LEN - REVEAL_LEN; // 2

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
            className="text-3xl font-black" style={{ color: "#ec4899", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          <div className="text-[9px] font-black" style={{ color: myRole === "builder" ? "#f59e0b" : "#06b6d4" }}>
            {myRole === "builder" ? "🎭 BUILDER" : "👁️ GUESSER"}
          </div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── BUILDER PHASE ── */}
        {phase === "building" && (
          <motion.div key="build" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">

            {/* Role explanation */}
            <div className="rounded-xs p-3 text-center"
              style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-black text-white mb-0.5">🎭 You are the Builder</p>
              <p className="text-[10px] text-white/40">
                Create a 4-symbol sequence. {opponentName} will see steps 1–2 and must guess 3–4.
                You earn <strong className="text-amber-400">+12 pts</strong> for each step they get wrong.
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-white/30">Build your sequence ({sequence.length}/{SEQ_LEN})</span>
              <span className="font-black text-sm" style={{ color: timerColor }}>{timeLeft}s</span>
            </div>

            {/* Sequence preview */}
            <div className="flex items-center justify-center gap-3">
              {Array.from({ length: SEQ_LEN }).map((_, i) => {
                const symId = sequence[i];
                const sym   = symId !== undefined ? SYMBOLS[symId] : null;
                const isRev = i < REVEAL_LEN;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="text-[8px] font-black text-white/22">{i + 1}</div>
                    <motion.div
                      animate={{ scale: sym ? 1 : 1 }}
                      className="w-12 h-12 rounded-xs flex items-center justify-center text-2xl"
                      style={{
                        background: sym ? `${sym.color}20` : "rgba(255,255,255,0.04)",
                        border:     sym ? `2px solid ${sym.color}60` : "1px dashed rgba(255,255,255,0.15)",
                        boxShadow:  sym ? `0 0 12px ${sym.color}30` : "none",
                      }}>
                      {sym ? sym.glyph : "?"}
                    </motion.div>
                    {/* Visible / hidden tag */}
                    <div className="text-[8px] font-black"
                      style={{ color: isRev ? "rgba(6,182,212,0.6)" : "rgba(168,85,247,0.6)" }}>
                      {isRev ? <><Eye className="w-2.5 h-2.5 inline" /> Shown</> : <><EyeOff className="w-2.5 h-2.5 inline" /> Hidden</>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Symbol picker */}
            <div className="grid grid-cols-4 gap-2">
              {SYMBOLS.map(sym => (
                <motion.button key={sym.id}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleBuilderPick(sym.id)}
                  disabled={sequence.length >= SEQ_LEN || locked}
                  className="py-3 rounded-xs flex flex-col items-center gap-1 disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${sym.color}30` }}>
                  <span className="text-2xl" style={{ color: sym.color }}>{sym.glyph}</span>
                  <span className="text-[9px] font-bold text-white/40">{sym.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={handleBuilderUndo} disabled={sequence.length === 0 || locked}
                className="flex-1 py-2.5 rounded-xs text-xs font-bold text-white/40 disabled:opacity-25"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                ← Undo
              </button>
              <motion.button whileHover={{ scale: sequence.length === SEQ_LEN ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
                onClick={lockBuilderSequence}
                disabled={sequence.length < SEQ_LEN || locked}
                className="flex-[2] py-2.5 rounded-xs text-sm font-black text-white disabled:opacity-30 flex items-center justify-center gap-2"
                style={{ background: sequence.length === SEQ_LEN ? "#f59e0b" : "rgba(255,255,255,0.05)", boxShadow: sequence.length === SEQ_LEN ? "0 0 24px rgba(245,158,11,0.5)" : "none" }}>
                {locked
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Waiting…</>
                  : <><Check className="w-4 h-4" />Lock Sequence</>}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── GUESSER PHASE ── */}
        {phase === "guessing" && (
          <motion.div key="guess" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">

            <div className="rounded-xs p-3 text-center"
              style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <p className="text-xs font-black text-white mb-0.5">👁️ You are the Guesser</p>
              <p className="text-[10px] text-white/40">
                {opponentName} built a 4-symbol sequence. You can see steps 1–2. Guess steps 3–4 correctly for{" "}
                <strong className="text-cyan-400">+20 pts each</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-white/30">Complete the sequence</span>
              <span className="font-black text-sm" style={{ color: timerColor }}>{timeLeft}s</span>
            </div>

            {/* Sequence display */}
            <div className="flex items-center justify-center gap-3">
              {Array.from({ length: SEQ_LEN }).map((_, i) => {
                const isRevealed = i < REVEAL_LEN;
                const symId      = isRevealed ? revealed[i] : myGuess[i - REVEAL_LEN];
                const sym        = symId !== undefined ? SYMBOLS[symId] : null;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="text-[8px] font-black text-white/22">{i + 1}</div>
                    <div className="w-12 h-12 rounded-xs flex items-center justify-center text-2xl"
                      style={{
                        background: isRevealed
                          ? sym ? `${sym.color}25` : "rgba(255,255,255,0.04)"
                          : sym ? `${sym.color}15` : "rgba(255,255,255,0.04)",
                        border: isRevealed
                          ? sym ? `2px solid ${sym.color}70` : "1px solid rgba(255,255,255,0.2)"
                          : sym ? `1px dashed ${sym.color}60` : "1px dashed rgba(168,85,247,0.3)",
                        boxShadow: isRevealed && sym ? `0 0 14px ${sym.color}30` : "none",
                      }}>
                      {sym ? sym.glyph : isRevealed ? "" : "?"}
                    </div>
                    <div className="text-[8px] font-black"
                      style={{ color: isRevealed ? "rgba(6,182,212,0.6)" : "rgba(168,85,247,0.5)" }}>
                      {isRevealed ? "Given" : i < REVEAL_LEN + myGuess.length ? "Your pick" : "Pick this"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Symbol picker for hidden steps */}
            {myGuess.length < guessNeeded && (
              <>
                <p className="text-center text-[10px] text-white/30">
                  Pick step {REVEAL_LEN + myGuess.length + 1}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {SYMBOLS.map(sym => (
                    <motion.button key={sym.id} whileTap={{ scale: 0.88 }}
                      onClick={() => handleGuesserPick(sym.id)}
                      disabled={locked}
                      className="py-3 rounded-xs flex flex-col items-center gap-1 disabled:opacity-30"
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${sym.color}30` }}>
                      <span className="text-2xl" style={{ color: sym.color }}>{sym.glyph}</span>
                      <span className="text-[9px] font-bold text-white/40">{sym.label}</span>
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {myGuess.length >= guessNeeded && !locked && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={lockGuesserGuess}
                className="w-full py-3.5 rounded-xs text-sm font-black text-white flex items-center justify-center gap-2"
                style={{ background: "#06b6d4", boxShadow: "0 0 24px rgba(6,182,212,0.5)" }}>
                <Check className="w-4 h-4" />Lock Guess
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ── REVEAL ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xs p-5 space-y-4"
            style={{ background: "rgba(6,6,18,0.88)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>

            {/* Full sequence comparison */}
            <div className="flex items-start gap-3 justify-center">
              {/* Full sequence */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-[9px] uppercase tracking-widest font-black text-white/25">Sequence</p>
                <div className="flex gap-1.5">
                  {roundResult.fullSeq.map((symId, i) => {
                    const sym = SYMBOLS[symId];
                    return (
                      <div key={i} className="w-9 h-9 rounded-xs flex items-center justify-center text-lg"
                        style={{ background: `${sym.color}20`, border: `1px solid ${sym.color}50`, color: sym.color }}>
                        {sym.glyph}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guessed steps */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-[9px] uppercase tracking-widest font-black text-white/25">Guessed 3–4</p>
                <div className="flex gap-1.5">
                  {roundResult.guess.map((symId, i) => {
                    const sym     = SYMBOLS[symId];
                    const correct = roundResult.correct[i];
                    return (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <div className="w-9 h-9 rounded-xs flex items-center justify-center text-lg"
                          style={{
                            background: correct ? "rgba(16,185,129,0.2)"  : "rgba(239,68,68,0.15)",
                            border:     correct ? "2px solid #10b981"      : "2px solid #ef4444",
                            color: sym.color,
                          }}>
                          {sym.glyph}
                        </div>
                        <div className="text-sm">{correct ? "✅" : "❌"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#ec4899" }}>+{roundResult.myPts}</div>
                <div className="text-[9px] text-white/30">You</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>+{roundResult.oppPts}</div>
                <div className="text-[9px] text-white/30">{opponentName}</div>
              </div>
            </div>

            <p className="text-center text-[10px] text-white/25">
              Next round: you become the {myRole === "builder" ? "Guesser 👁️" : "Builder 🎭"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}