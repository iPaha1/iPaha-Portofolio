// =============================================================================
// GAME 28: ECHO CHAMBER — Pure audio memory. Hear tones. Reproduce them.
// components/(gamification)/(games)/echo-chamber-game.tsx
//
// Concept: NO visual colours to memorise — just SOUND. 6 glowing pads play
// unique musical tones. A sequence plays as audio only. You reproduce it by
// tapping the pads. The visual design is a stunning dark radial layout of
// glowing hexagonal pads that pulse when tones play. Each pad has a unique
// waveform-shaped glow pattern. Starts at 3 tones, reaches 10.
// The twist: after round 5, the pads SHUFFLE positions between rounds.
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Headphones, Music } from "lucide-react";
import type { GameProps } from "./game-types";

const TOTAL_ROUNDS = 10;
const PADS = [
  { id: 0, freq: 261.63, note: "C",  hue: 0   },  // C4  - red
  { id: 1, freq: 329.63, note: "E",  hue: 45  },  // E4  - amber
  { id: 2, freq: 392.00, note: "G",  hue: 120 },  // G4  - green
  { id: 3, freq: 523.25, note: "C5", hue: 200 },  // C5  - cyan
  { id: 4, freq: 659.25, note: "E5", hue: 260 },  // E5  - blue
  { id: 5, freq: 783.99, note: "G5", hue: 300 },  // G5  - violet
];

type GamePhase = "playing_seq" | "input" | "correct" | "wrong" | "gameover" | "done";

function playPadTone(padId: number, duration = 0.35) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const pad = PADS[padId];
    // Rich tone: fundamental + harmonics
    [1, 2, 3].forEach((harmonic, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = pad.freq * harmonic * 2;
      o.connect(filter); filter.connect(g); g.connect(ctx.destination);
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = pad.freq * harmonic;
      const vol = [0.22, 0.08, 0.04][i];
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      o.start(); o.stop(ctx.currentTime + duration + 0.02);
    });
  } catch {}
}

function playChord(padIds: number[], type: "correct" | "wrong") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === "correct") {
      [440, 550, 660].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4 + i * 0.04);
        o.start(ctx.currentTime + i * 0.04); o.stop(ctx.currentTime + 0.4 + i * 0.04);
      });
    } else {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sawtooth"; o.frequency.value = 100;
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      o.start(); o.stop(ctx.currentTime + 0.5);
    }
  } catch {}
}

export function EchoChamberGame({
  gameId, rewardTokens, duration = 45,
  onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const [sequence, setSequence]   = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [phase, setPhase]         = useState<GamePhase>("playing_seq");
  const [round, setRound]         = useState(1);
  const [score, setScore]         = useState(0);
  const [timeLeft, setTimeLeft]   = useState(duration);
  const [litPad, setLitPad]       = useState<number | null>(null);
  const [padOrder, setPadOrder]   = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [message, setMessage]     = useState("Listen...");
  const [wrongPad, setWrongPad]   = useState<number | null>(null);

  const scoreRef  = useRef(0);
  const roundRef  = useRef(1);
  const phaseRef  = useRef<GamePhase>("playing_seq");

  const endGame = useCallback((won: boolean) => {
    phaseRef.current = won ? "done" : "gameover";
    setPhase(won ? "done" : "gameover");
    const reward = Math.min(
      Math.floor(rewardTokens * (scoreRef.current / (TOTAL_ROUNDS * 80) + 0.35)),
      rewardTokens * 2
    );
    setTimeout(() => onComplete(reward, scoreRef.current), 1800);
  }, [rewardTokens, onComplete]);

  const playSequence = useCallback((seq: number[], onDone: () => void) => {
    setPhase("playing_seq");
    phaseRef.current = "playing_seq";
    setMessage("Listen...");
    let i = 0;
    const playNext = () => {
      if (i >= seq.length) { setTimeout(onDone, 300); return; }
      setLitPad(seq[i]);
      if (soundEnabled) playPadTone(seq[i]);
      setTimeout(() => {
        setLitPad(null);
        i++;
        setTimeout(playNext, 200);
      }, 450);
    };
    setTimeout(playNext, 500);
  }, [soundEnabled]);

  const startRound = useCallback((rnd: number, prevSeq: number[]) => {
    // Shuffle pads after round 5
    if (rnd === 6) {
      setPadOrder(prev => [...prev].sort(() => Math.random() - 0.5));
    }
    const newSeq = [...prevSeq, Math.floor(Math.random() * 6)];
    setSequence(newSeq);
    setUserInput([]);
    setRound(rnd);
    roundRef.current = rnd;
    playSequence(newSeq, () => {
      phaseRef.current = "input";
      setPhase("input");
      setMessage("Your turn");
    });
  }, [playSequence]);

  useEffect(() => {
    const initial = [Math.floor(Math.random() * 6)];
    setSequence(initial);
    playSequence(initial, () => {
      phaseRef.current = "input";
      setPhase("input");
      setMessage("Your turn");
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); endGame(false); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [endGame]);

  const handlePadTap = useCallback((padId: number) => {
    if (phaseRef.current !== "input") return;
    if (soundEnabled) playPadTone(padId);
    setLitPad(padId);
    setTimeout(() => setLitPad(null), 250);

    const newInput = [...userInput, padId];
    const step = newInput.length - 1;

    if (newInput[step] !== sequence[step]) {
      setWrongPad(padId);
      setTimeout(() => setWrongPad(null), 500);
      if (soundEnabled) playChord([], "wrong");
      setMessage("Wrong! Game over.");
      endGame(false);
      return;
    }

    setUserInput(newInput);

    if (newInput.length === sequence.length) {
      // Complete round
      if (soundEnabled) playChord([], "correct");
      const pts = sequence.length * 20;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setMessage(`+${pts}!`);
      phaseRef.current = "correct";
      setPhase("correct");

      const nr = roundRef.current + 1;
      if (nr > TOTAL_ROUNDS) {
        setTimeout(() => endGame(true), 900);
      } else {
        setTimeout(() => startRound(nr, sequence), 900);
      }
    }
  }, [userInput, sequence, soundEnabled, startRound, endGame]);

  // Hexagonal pad positions (radial layout)
  const padPositions = [
    { x: "50%",  y: "10%" },
    { x: "78%",  y: "28%" },
    { x: "78%",  y: "62%" },
    { x: "50%",  y: "80%" },
    { x: "22%",  y: "62%" },
    { x: "22%",  y: "28%" },
  ];

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at center, #080412 0%, #04020c 100%)" }}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Headphones className="w-4 h-4 text-violet-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <span className="text-[10px] font-black tracking-[0.15em] text-white/30">Rd {round}/{TOTAL_ROUNDS}</span>
          {round >= 6 && (
            <span className="text-[10px] font-black text-amber-400/70 px-1.5 py-0.5 rounded-xs"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}
            >SHUFFLED</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Sequence progress */}
      <div className="absolute top-11 left-0 right-0 flex justify-center gap-1 py-1.5 z-10">
        {sequence.map((_, i) => (
          <div key={i} className="w-2 h-1.5 rounded-full transition-all duration-200"
            style={{ background: i < userInput.length ? "#10b981" : phase === "playing_seq" && i === userInput.length ? "#f59e0b" : "rgba(255,255,255,0.12)" }}
          />
        ))}
      </div>

      {/* Message */}
      <div className="absolute top-16 left-0 right-0 text-center z-10">
        <motion.p key={message} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-sm font-black"
          style={{ color: phase === "input" ? "#10b981" : phase === "correct" ? "#f59e0b" : "rgba(255,255,255,0.4)" }}
        >{message}</motion.p>
      </div>

      {/* Radial pad layout */}
      <div className="absolute inset-0" style={{ top: "44px" }}>
        {padOrder.map((originalId, displayIdx) => {
          const pos = padPositions[displayIdx];
          const pad = PADS[originalId];
          const isLit   = litPad === originalId;
          const isWrong = wrongPad === originalId;
          const canTap  = phase === "input";

          return (
            <motion.button
              key={`${originalId}-${displayIdx}`}
              onClick={() => canTap && handlePadTap(originalId)}
              animate={isWrong ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={isWrong ? { duration: 0.3 } : {}}
              whileHover={canTap ? { scale: 1.1 } : {}}
              whileTap={canTap ? { scale: 0.88 } : {}}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xs"
              style={{
                left: pos.x, top: pos.y,
                width: "62px", height: "54px",
                background: isLit
                  ? `hsl(${pad.hue},100%,45%)`
                  : `hsla(${pad.hue},80%,18%,0.8)`,
                border: `2px solid hsla(${pad.hue},100%,${isLit ? 70 : 35}%,0.8)`,
                boxShadow: isLit
                  ? `0 0 24px hsl(${pad.hue},100%,60%), 0 0 50px hsl(${pad.hue},100%,40%)`
                  : `0 0 8px hsla(${pad.hue},80%,30%,0.4)`,
                cursor: canTap ? "pointer" : "default",
                transition: "all 0.1s",
              }}
            >
              <div className="flex flex-col items-center justify-center h-full gap-0.5">
                <Music className="w-4 h-4" style={{ color: isLit ? "rgba(0,0,0,0.7)" : `hsl(${pad.hue},80%,60%)` }} />
                <span className="text-[10px] font-black"
                  style={{ color: isLit ? "rgba(0,0,0,0.6)" : `hsl(${pad.hue},80%,55%)` }}
                >{pad.note}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Centre display */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "44px" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto"
            style={{
              background: phase === "playing_seq" ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
              borderColor: phase === "playing_seq" ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)",
              boxShadow: phase === "playing_seq" ? "0 0 20px rgba(139,92,246,0.3)" : "none",
            }}
          >
            <span className="text-xl font-black" style={{ color: phase === "playing_seq" ? "#a78bfa" : "rgba(255,255,255,0.15)" }}>
              {sequence.length}
            </span>
          </div>
          <p className="text-[9px] font-black tracking-widest uppercase mt-1"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >tones</p>
        </div>
      </div>

      <AnimatePresence>
        {(phase === "done" || phase === "gameover") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className={`w-14 h-14 mx-auto mb-3 ${phase === "done" ? "text-amber-400" : "text-violet-400"}`} />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/40 text-sm">round {round - 1} · {sequence.length} tone sequence</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isFlash && (
        <div className="absolute top-11 right-3 z-20 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse"
          style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fcd34d" }}
        >⚡ FLASH</div>
      )}
    </div>
  );
}