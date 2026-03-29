// =============================================================================
// TOKEN RUSH — Game 3: Echo Chamber
// app/token-rush/_games/echo-chamber.tsx
//
// Audio memory war. Server generates a tone sequence; both players hear it
// simultaneously, then must tap the frequencies back in exact order.
//
// ANTI-CHEAT: Sequences generated server-side. Submissions are timestamped
// and validated server-side — replay attacks and pre-submissions are rejected.
//
// DEMO MODE: Sequence generated locally. Remove DEMO block and replace with
// server fetch to /api/token-rush/challenges/[id]/echo-sequence in production.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Check, X } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface EchoChamberProps {
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

// ── Frequency nodes — the 6 "keys" players tap ───────────────────────────────
const FREQ_NODES = [
  { id: 0, label: "C",  freq: 261.6, color: "#ef4444", glow: "rgba(239,68,68,0.6)"   },
  { id: 1, label: "E",  freq: 329.6, color: "#f97316", glow: "rgba(249,115,22,0.6)"  },
  { id: 2, label: "G",  freq: 392.0, color: "#f59e0b", glow: "rgba(245,158,11,0.6)"  },
  { id: 3, label: "A",  freq: 440.0, color: "#10b981", glow: "rgba(16,185,129,0.6)"  },
  { id: 4, label: "C'", freq: 523.3, color: "#06b6d4", glow: "rgba(6,182,212,0.6)"   },
  { id: 5, label: "E'", freq: 659.3, color: "#a855f7", glow: "rgba(168,85,247,0.6)"  },
] as const;

const TOTAL_ROUNDS  = 10;
const BASE_SEQ_LEN  = 3;   // Round 1 starts with 3 tones
const TONE_DURATION = 0.45; // seconds per tone during playback
const TONE_GAP      = 0.12; // gap between tones

// ── Web Audio tone player ─────────────────────────────────────────────────────
function playFreq(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  vol = 0.35,
) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
  gain.gain.setValueAtTime(vol, startTime + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// ── Sequence generator (DEMO — replace with server fetch in production) ───────
function generateSequence(round: number, seed: number): number[] {
  const len = BASE_SEQ_LEN + (round - 1);
  const seq: number[] = [];
  let s = seed;
  for (let i = 0; i < len; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    seq.push(Math.abs(s) % FREQ_NODES.length);
  }
  return seq;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function EchoChamberGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: EchoChamberProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "countdown" | "playing" | "input" | "reveal" | "done";

  const [round,        setRound]        = useState(1);
  const [phase,        setPhase]        = useState<Phase>("countdown");
  const [sequence,     setSequence]     = useState<number[]>([]);
  const [playerInput,  setPlayerInput]  = useState<number[]>([]);
  const [myScore,      setMyScore]      = useState(0);
  const [oppScore,     setOppScore]     = useState(0);
  const [countdown,    setCountdown]    = useState(3);
  const [activeNode,   setActiveNode]   = useState<number | null>(null);
  const [inputFeedback,setFeedback]     = useState<"correct" | "wrong" | null>(null);
  const [roundResult,  setRoundResult]  = useState<{
    myPts: number; oppPts: number; correctUpto: number; headline: string;
  } | null>(null);
  const [oppDone,      setOppDone]      = useState(false);
  const [timeLeft,     setTimeLeft]     = useState(0);
  const [flashNode,    setFlashNode]    = useState<number | null>(null); // which node is playing

  const ctxRef      = useRef<AudioContext | null>(null);
  const myScoreRef  = useRef(0);
  const oppScoreRef = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const seedRef     = useRef(Date.now());

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  };

  // ── Play the sequence aloud ───────────────────────────────────────────────
  const playSequence = useCallback(async (seq: number[]) => {
    const ctx  = getCtx();
    const step = TONE_DURATION + TONE_GAP;
    let t = ctx.currentTime + 0.1;

    seq.forEach((nodeId, i) => {
      const node = FREQ_NODES[nodeId];
      playFreq(ctx, node.freq, t + i * step, TONE_DURATION);
      // Flash the node visually in sync
      setTimeout(() => setFlashNode(nodeId), (t + i * step - ctx.currentTime) * 1000);
      setTimeout(() => setFlashNode(null), (t + i * step + TONE_DURATION - ctx.currentTime) * 1000);
    });

    const totalTime = seq.length * step * 1000 + 200;
    await new Promise(r => setTimeout(r, totalTime));
  }, []);

  // ── Start a round ─────────────────────────────────────────────────────────
  const startRound = useCallback(async (rnd: number) => {
    setPhase("countdown");
    setPlayerInput([]);
    setFeedback(null);
    setOppDone(false);
    setRoundResult(null);

    // Countdown 3-2-1
    for (let c = 3; c >= 1; c--) {
      setCountdown(c);
      play("countdown");
      await new Promise(r => setTimeout(r, 900));
    }

    // Generate sequence (DEMO: local; production: fetch from server)
    const seq = generateSequence(rnd, seedRef.current + rnd);
    setSequence(seq);

    // Play the sequence
    setPhase("playing");
    play("roundStart");
    await playSequence(seq);

    // Now player must input
    const inputTime = Math.max(6, seq.length * 2) * 1000;
    setTimeLeft(Math.ceil(inputTime / 1000));
    setPhase("input");

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Auto-submit on timeout
    setTimeout(() => {
      clearInterval(timerRef.current!);
      submitInput(seq, []);
    }, inputTime);

    // Simulate opponent finishing after random delay (DEMO)
    setTimeout(() => setOppDone(true), 1500 + Math.random() * (inputTime - 2000));
  }, [play, playSequence]);

  // ── Handle node tap ───────────────────────────────────────────────────────
  const handleTap = useCallback((nodeId: number) => {
    if (phase !== "input") return;
    play("uiClick");

    // Play the tapped tone
    const ctx  = getCtx();
    playFreq(ctx, FREQ_NODES[nodeId].freq, ctx.currentTime, 0.3, 0.3);
    setActiveNode(nodeId);
    setTimeout(() => setActiveNode(null), 300);

    const newInput = [...playerInput, nodeId];
    setPlayerInput(newInput);

    // Check if this tap is correct so far
    const expected = sequence[newInput.length - 1];
    if (nodeId !== expected) {
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 500);
    } else {
      setFeedback("correct");
      setTimeout(() => setFeedback(null), 300);
    }

    // Auto-submit when input length matches sequence
    if (newInput.length >= sequence.length) {
      clearInterval(timerRef.current!);
      setTimeout(() => submitInput(sequence, newInput), 200);
    }
  }, [phase, playerInput, sequence, play]);

  // ── Submit & score ────────────────────────────────────────────────────────
  const submitInput = useCallback((seq: number[], input: number[]) => {
    // Count correct consecutive tones from start
    let correctUpto = 0;
    for (let i = 0; i < seq.length; i++) {
      if (input[i] === seq[i]) correctUpto++;
      else break;
    }

    const perfectMatch = correctUpto === seq.length;
    const myPts  = perfectMatch ? 20 : correctUpto * 2;
    const oppPts = perfectMatch ? 0  : (seq.length - correctUpto) > 0 ? 5 : 0;

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline =
      perfectMatch         ? "🎯 Perfect! Full sequence recalled!" :
      correctUpto === 0    ? "😵 Nothing matched — opponent steals 5 pts" :
      correctUpto >= seq.length * 0.7 ? "✅ Great recall!" : "⚡ Partial recall";

    play(perfectMatch ? "predCorrect" : correctUpto > 0 ? "roundEnd" : "predWrong");

    setRoundResult({ myPts, oppPts, correctUpto, headline });
    setPhase("reveal");

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
    }, 2800);
  }, [round, onComplete, onScoreUpdate, play, startRound]);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    startRound(1);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []); // eslint-disable-line

  const seqLen = BASE_SEQ_LEN + (round - 1);

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
            className="text-3xl font-black" style={{ color: "#f59e0b", letterSpacing: "-0.05em" }}>
            {myScore}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          <div className="text-[9px] text-white/28">{seqLen} tones</div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>
            {oppScore}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      {/* ── Score bar ── */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" style={{ background: "#f59e0b" }}
          animate={{ width: `${myScore + oppScore === 0 ? 50 : (myScore / (myScore + oppScore)) * 100}%` }}
          transition={{ duration: 0.4 }} />
      </div>

      {/* ── Countdown ── */}
      <AnimatePresence mode="wait">
        {phase === "countdown" && (
          <motion.div key="cd" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }}
            className="flex items-center justify-center py-8">
            <div className="text-8xl font-black text-white" style={{ letterSpacing: "-0.05em" }}>{countdown}</div>
          </motion.div>
        )}

        {/* ── Playing (sequence playing) ── */}
        {phase === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm font-black text-white/60 tracking-widest uppercase">🎵 Listen carefully…</p>
            {/* Visual equaliser bars */}
            <div className="flex items-end gap-2 h-16">
              {FREQ_NODES.map(node => (
                <motion.div key={node.id}
                  animate={{ height: flashNode === node.id ? "100%" : "20%", opacity: flashNode === node.id ? 1 : 0.25 }}
                  transition={{ duration: 0.08 }}
                  className="w-8 rounded-t-xs"
                  style={{ background: node.color, boxShadow: flashNode === node.id ? `0 0 20px ${node.glow}` : "none" }} />
              ))}
            </div>
            <p className="text-xs text-white/30">Sequence length: {seqLen}</p>
          </motion.div>
        )}

        {/* ── Input phase ── */}
        {phase === "input" && (
          <motion.div key="input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">

            {/* Timer + opponent status */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-black" style={{ color: timeLeft <= 3 ? "#ef4444" : "#f59e0b" }}>{timeLeft}s</div>
                <div className="text-xs text-white/30">to respond</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: oppDone ? "#10b981" : "rgba(255,255,255,0.35)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: oppDone ? "#10b981" : "rgba(255,255,255,0.2)" }} />
                {oppDone ? `${opponentName} submitted` : `${opponentName} responding…`}
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 py-1">
              {sequence.map((nodeId, i) => {
                const tapped  = playerInput[i] !== undefined;
                const correct = tapped && playerInput[i] === nodeId;
                const wrong   = tapped && playerInput[i] !== nodeId;
                return (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.03 }}
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: !tapped ? "rgba(255,255,255,0.12)" : correct ? "#10b981" : "#ef4444",
                      boxShadow:  correct ? "0 0 8px #10b981" : wrong ? "0 0 8px #ef4444" : "none",
                    }} />
                );
              })}
            </div>

            {/* Feedback flash */}
            <AnimatePresence>
              {inputFeedback && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="text-center text-sm font-black"
                  style={{ color: inputFeedback === "correct" ? "#10b981" : "#ef4444" }}>
                  {inputFeedback === "correct" ? "✓" : "✗ Wrong — keep going"}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Frequency nodes */}
            <div className="grid grid-cols-3 gap-3">
              {FREQ_NODES.map(node => {
                const isActive = activeNode === node.id || flashNode === node.id;
                return (
                  <motion.button key={node.id}
                    whileTap={{ scale: 0.88 }}
                    onPointerDown={() => handleTap(node.id)}
                    className="py-5 rounded-xs flex flex-col items-center gap-2 relative overflow-hidden"
                    style={{
                      background:  isActive ? `${node.color}30` : "rgba(255,255,255,0.04)",
                      border:      `2px solid ${isActive ? node.color : "rgba(255,255,255,0.1)"}`,
                      boxShadow:   isActive ? `0 0 28px ${node.glow}` : "none",
                      transition:  "all 0.08s",
                    }}>
                    {isActive && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 15 }} className="absolute inset-0 rounded-full"
                        style={{ background: node.color, opacity: 0.1 }} />
                    )}
                    <span className="text-2xl font-black relative z-10" style={{ color: node.color }}>{node.label}</span>
                    <div className="flex gap-0.5 relative z-10">
                      {[1,2,3].map(b => (
                        <motion.div key={b} animate={isActive ? { height: [4, 12, 4] } : { height: 4 }}
                          transition={{ duration: 0.3, delay: b * 0.05, repeat: isActive ? Infinity : 0 }}
                          className="w-1 rounded-full" style={{ background: node.color, opacity: 0.7 }} />
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <p className="text-center text-[10px] text-white/25">
              Tap the {seqLen} tones in the order you heard them
            </p>
          </motion.div>
        )}

        {/* ── Reveal ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal"
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="rounded-xs p-6 text-center space-y-4"
            style={{ background: "rgba(6,6,18,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-base font-black text-white" style={{ letterSpacing: "-0.02em" }}>
              {roundResult.headline}
            </p>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-black" style={{ color: "#f59e0b" }}>+{roundResult.myPts}</div>
                <div className="text-[10px] text-white/30">You</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black" style={{ color: "#06b6d4" }}>+{roundResult.oppPts}</div>
                <div className="text-[10px] text-white/30">{opponentName}</div>
              </div>
            </div>
            {/* Show the correct sequence */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {sequence.map((nodeId, i) => {
                const correct = playerInput[i] === nodeId;
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className="w-7 h-7 rounded-xs flex items-center justify-center text-xs font-black"
                      style={{
                        background: correct ? `${FREQ_NODES[nodeId].color}25` : "rgba(239,68,68,0.15)",
                        border: `1px solid ${correct ? FREQ_NODES[nodeId].color : "#ef4444"}`,
                        color: correct ? FREQ_NODES[nodeId].color : "#ef4444",
                      }}>
                      {FREQ_NODES[nodeId].label}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-white/30">
              {roundResult.correctUpto}/{seqLen} correct
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}