// =============================================================================
// TOKEN RUSH — Game 18: Pulse
// app/token-rush/_games/pulse.tsx
//
// A rhythm synchronisation duel. The server generates a beat pattern using
// Web Audio. Both players hear it for 4 seconds. Then silence — players must
// tap the button to recreate the exact rhythm from memory. The server scores
// both players' tap sequences against the original using a timing-match
// algorithm. Closest recreation wins. Pure rhythm intelligence — works for
// every human who has ever heard music, zero language advantage, zero
// cultural barrier. 8 rounds, patterns grow in complexity.
//
// ANTI-CHEAT: Beat patterns generated server-side. Tap timestamps recorded
// server-side with millisecond precision. Scores computed server-side.
//
// DEMO MODE: Patterns generated and scored locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Headphones } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface PulseProps {
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

const TOTAL_ROUNDS  = 8;
const LISTEN_MS     = 4500;
const REPLAY_SECS   = 7;     // time to tap after listening

// ── Beat pattern generator ────────────────────────────────────────────────────
interface Beat { time: number; strength: "heavy" | "medium" | "light" }

function generatePattern(round: number, seed: number): Beat[] {
  // Rounds 1–3: simple (4–6 beats), 4–6: medium (6–8), 7–8: complex (8–10)
  const count = round <= 3 ? 4 + (round - 1) : round <= 6 ? 6 + (round - 4) : 8 + (round - 7);
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (Math.abs(s) % 1000) / 1000; };

  // Generate beat times within LISTEN_MS window, spaced at least 200ms apart
  const beats: Beat[] = [];
  let cursor = 300; // start 300ms in
  for (let i = 0; i < count; i++) {
    cursor += 200 + Math.floor(rng() * 350);
    if (cursor > LISTEN_MS - 200) break;
    const r = rng();
    beats.push({
      time:     cursor,
      strength: r < 0.25 ? "heavy" : r < 0.6 ? "medium" : "light",
    });
  }
  return beats;
}

// ── Scoring algorithm ─────────────────────────────────────────────────────────
// Compare two sequences of tap times against the original pattern.
// For each original beat, find the closest tap within a tolerance window.
function scoreSequence(taps: number[], pattern: Beat[]): number {
  if (taps.length === 0) return 0;

  // The player's first tap sets their "time origin"
  // We need to find the best alignment offset between taps and pattern
  let bestScore = 0;

  // Try aligning with each tap as the potential match for each beat
  for (let alignBeat = 0; alignBeat < pattern.length; alignBeat++) {
    for (let alignTap = 0; alignTap < taps.length; alignTap++) {
      const offset = pattern[alignBeat].time - taps[alignTap];
      // Apply this offset to all taps and score
      let score = 0;
      const usedTaps = new Set<number>();
      for (const beat of pattern) {
        let closestDist = Infinity;
        let closestTap  = -1;
        for (let ti = 0; ti < taps.length; ti++) {
          if (usedTaps.has(ti)) continue;
          const dist = Math.abs((taps[ti] + offset) - beat.time);
          if (dist < closestDist) { closestDist = dist; closestTap = ti; }
        }
        // Tolerance: heavy=80ms, medium=120ms, light=160ms
        const tol = beat.strength === "heavy" ? 80 : beat.strength === "medium" ? 120 : 160;
        if (closestDist <= tol && closestTap >= 0) {
          usedTaps.add(closestTap);
          const accuracy = 1 - (closestDist / tol);
          const weight   = beat.strength === "heavy" ? 1.5 : beat.strength === "medium" ? 1.0 : 0.7;
          score += accuracy * weight;
        }
      }
      if (score > bestScore) bestScore = score;
    }
  }

  // Normalise to 0–30 pts
  const maxPossible = pattern.reduce((a, b) => a + (b.strength === "heavy" ? 1.5 : b.strength === "medium" ? 1.0 : 0.7), 0);
  return Math.round((bestScore / maxPossible) * 30);
}

// ── AI tap generator ──────────────────────────────────────────────────────────
function aiTaps(pattern: Beat[], accuracy: number): number[] {
  return pattern.map(b => {
    const err = (1 - accuracy) * 200 * (Math.random() * 2 - 1);
    return b.time + err;
  });
}

// ── Beat visualiser component ─────────────────────────────────────────────────
function BeatViz({
  pattern, tapTimes, phase, progress,
}: {
  pattern: Beat[];
  tapTimes: number[];
  phase: string;
  progress: number; // 0–1 during listen
}) {
  return (
    <div className="relative h-14 w-full rounded-xs overflow-hidden"
      style={{ background: "rgba(6,6,18,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>

      {/* Timeline progress during listen */}
      {phase === "listening" && (
        <motion.div className="absolute top-0 left-0 h-full"
          animate={{ width: `${progress * 100}%` }}
          style={{ background: "rgba(245,158,11,0.08)", transition: "width 0.05s linear" }} />
      )}

      {/* Beat markers */}
      {(phase === "listening" || phase === "reveal") && pattern.map((b, i) => {
        const pct   = b.time / LISTEN_MS * 100;
        const h     = b.strength === "heavy" ? 40 : b.strength === "medium" ? 28 : 18;
        const col   = b.strength === "heavy" ? "#f59e0b" : b.strength === "medium" ? "#a855f7" : "#06b6d4";
        return (
          <motion.div key={i}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: b.time / 1000 * (phase === "listening" ? 1 : 0) }}
            className="absolute bottom-0 w-1.5 rounded-t-xs"
            style={{ left: `calc(${pct}% - 3px)`, height: h, background: col, opacity: phase === "reveal" ? 0.7 : 0.9 }} />
        );
      })}

      {/* Player tap markers (reveal phase) */}
      {phase === "reveal" && tapTimes.map((t, i) => {
        const pct = Math.min(100, (t / LISTEN_MS) * 100);
        return (
          <div key={i} className="absolute top-0 w-0.5 h-full"
            style={{ left: `${pct}%`, background: "rgba(168,85,247,0.7)" }} />
        );
      })}

      {/* Playhead */}
      {phase === "listening" && (
        <div className="absolute top-0 w-0.5 h-full bg-amber-400"
          style={{ left: `${progress * 100}%`, boxShadow: "0 0 8px #f59e0b" }} />
      )}

      {/* Label */}
      <div className="absolute top-1 left-2 text-[8px] font-black text-white/20 uppercase tracking-widest">
        {phase === "listening" ? "Listen" : phase === "tapping" ? "Tap now" : "Pattern"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function PulseGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: PulseProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "countdown" | "listening" | "gap" | "tapping" | "reveal" | "done";

  const [round,       setRound]       = useState(1);
  const [phase,       setPhase]       = useState<Phase>("countdown");
  const [pattern,     setPattern]     = useState<Beat[]>([]);
  const [tapTimes,    setTapTimes]    = useState<number[]>([]);
  const [myScore,     setMyScore]     = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [progress,    setProgress]    = useState(0);
  const [countdown,   setCountdown]   = useState(3);
  const [tapTimeLeft, setTapTimeLeft] = useState(REPLAY_SECS);
  const [tapLocked,   setTapLocked]   = useState(false);
  const [btnPulse,    setBtnPulse]    = useState(false);
  const [oppLocked,   setOppLocked]   = useState(false);
  const [roundResult, setRoundResult] = useState<{
    myPts: number; oppPts: number; headline: string; myTaps: number[]; oppAccuracy: number;
  } | null>(null);

  const myScoreRef   = useRef(0);
  const oppScoreRef  = useRef(0);
  const tapStartRef  = useRef(0); // absolute timestamp when tapping began
  const tapTimesRef  = useRef<number[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const lockedRef    = useRef(false);

  const getACtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  // ── Play a single beat through Web Audio ─────────────────────────────────
  const playBeat = useCallback((strength: Beat["strength"], atTime: number) => {
    if (!soundEnabled) return;
    const ctx  = getACtx();
    const freq = strength === "heavy" ? 120 : strength === "medium" ? 220 : 440;
    const vol  = strength === "heavy" ? 0.6  : strength === "medium" ? 0.4  : 0.25;
    const dur  = strength === "heavy" ? 0.12 : 0.07;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = strength === "heavy" ? "square" : "triangle";
    osc.frequency.setValueAtTime(freq, atTime);
    gain.gain.setValueAtTime(0, atTime);
    gain.gain.linearRampToValueAtTime(vol, atTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, atTime + dur);
    osc.start(atTime); osc.stop(atTime + dur + 0.02);
  }, [soundEnabled]);

  // ── Setup and play a round ────────────────────────────────────────────────
  const startRound = useCallback((rnd: number) => {
    const seed = Date.now() ^ (rnd * 0xc0de);
    const pat  = generatePattern(rnd, seed);
    setPattern(pat);
    setTapTimes([]);
    tapTimesRef.current = [];
    lockedRef.current   = false;
    setTapLocked(false);
    setOppLocked(false);
    setRoundResult(null);
    setProgress(0);
    setCountdown(3);
    setTapTimeLeft(REPLAY_SECS);
    setPhase("countdown");

    // Countdown then play
    let c = 3;
    const cdInterval = setInterval(() => {
      c--;
      setCountdown(c);
      play("countdown");
      if (c <= 0) {
        clearInterval(cdInterval);
        setPhase("listening");
        // Schedule beats through Web Audio
        const ctx   = getACtx();
        const start = ctx.currentTime + 0.1;
        pat.forEach(b => playBeat(b.strength, start + b.time / 1000));

        // Progress animation
        const step   = 50;
        let elapsed  = 0;
        const prog   = setInterval(() => {
          elapsed += step;
          setProgress(elapsed / LISTEN_MS);
          if (elapsed >= LISTEN_MS) {
            clearInterval(prog);
            setProgress(1);
            setTimeout(() => {
              setPhase("gap");
              setTimeout(() => {
                tapStartRef.current = Date.now();
                setPhase("tapping");
                // Start replay timer
                let tl = REPLAY_SECS;
                timerRef.current = setInterval(() => {
                  tl--;
                  setTapTimeLeft(tl);
                  if (tl <= 0) { clearInterval(timerRef.current!); lockTaps(pat); }
                }, 1000);
                // AI opponent taps
                const aiAccuracy = 0.5 + Math.random() * 0.4;
                const aiT = aiTaps(pat, aiAccuracy).map(t => Math.max(0, t));
                setTimeout(() => setOppLocked(true), 1000 + Math.random() * 3000);
                setTimeout(() => resolveRound(pat, aiT), 5000 + Math.random() * 1000);
              }, 600);
            }, 400);
          }
        }, step);
      }
    }, 900);
  }, [play, playBeat]); // eslint-disable-line

  // ── Record a tap ──────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (phase !== "tapping" || lockedRef.current) return;
    const elapsed = Date.now() - tapStartRef.current;
    tapTimesRef.current = [...tapTimesRef.current, elapsed];
    setTapTimes([...tapTimesRef.current]);
    setBtnPulse(true);
    setTimeout(() => setBtnPulse(false), 120);
    // Play a soft click sound
    if (soundEnabled) {
      const ctx = getACtx();
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start(); osc.stop(ctx.currentTime + 0.07);
    }
  }, [phase, soundEnabled]);

  // ── Lock taps and resolve ────────────────────────────────────────────────
  const lockTaps = useCallback((pat: Beat[]) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setTapLocked(true);
    clearInterval(timerRef.current!);
    play("moveLock");
  }, [play]);

  const resolveRound = useCallback((pat: Beat[], aiTapTimes: number[]) => {
    const myTaps  = tapTimesRef.current;
    const myPts   = scoreSequence(myTaps, pat);
    const oppPts  = scoreSequence(aiTapTimes, pat);
    const oppAcc  = Math.round((oppPts / 30) * 100);

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline =
      myPts >= 27 ? "🎵 Flawless rhythm — perfect sync!" :
      myPts >= 20 ? "✅ Great recall!" :
      myPts >= 12 ? "👍 Decent timing" :
      myPts >= 5  ? "🌊 Partial match" :
                    "💀 Lost the beat";

    play(myPts > oppPts ? "predCorrect" : myPts > 10 ? "roundEnd" : "predWrong");
    setRoundResult({ myPts, oppPts, headline, myTaps, oppAccuracy: oppAcc });
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
    }, 3500);
  }, [round, onComplete, onScoreUpdate, play, startRound]);

  useEffect(() => {
    startRound(1);
    return () => { clearInterval(timerRef.current!); };
  }, []); // eslint-disable-line

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && phase === "tapping") { e.preventDefault(); handleTap(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleTap]);

  const timerColor = tapTimeLeft <= 2 ? "#ef4444" : tapTimeLeft <= 4 ? "#f59e0b" : "#a855f7";
  const beatCount  = pattern.length;
  const tapCount   = tapTimes.length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <motion.div key={myScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#a855f7", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          <div className="text-[9px] text-white/28">{beatCount} beats</div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Countdown ── */}
        {phase === "countdown" && (
          <motion.div key="cd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-8 space-y-3">
            <p className="text-xs font-black text-white/35 uppercase tracking-widest">Get ready to listen</p>
            <motion.div key={countdown} initial={{ scale: 1.6 }} animate={{ scale: 1 }}
              className="text-7xl font-black text-white" style={{ letterSpacing: "-0.05em" }}>
              {countdown}
            </motion.div>
            <p className="text-[10px] text-white/25">Listen to the beat — then recreate it</p>
          </motion.div>
        )}

        {/* ── Listening ── */}
        {(phase === "listening" || phase === "gap") && (
          <motion.div key="listen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            <div className="flex items-center gap-2 justify-center">
              <Headphones className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-black text-white">
                {phase === "gap" ? "Memorising…" : "Listen carefully"}
              </p>
            </div>
            <BeatViz pattern={pattern} tapTimes={[]} phase="listening" progress={progress} />
            <div className="flex justify-center gap-1">
              {pattern.map((b, i) => (
                <motion.div key={i}
                  animate={progress * LISTEN_MS >= b.time
                    ? { scale: [1.5, 1], opacity: [1, 0.7] }
                    : { scale: 1, opacity: 0.2 }}
                  transition={{ duration: 0.15 }}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: b.strength === "heavy" ? "#f59e0b" : b.strength === "medium" ? "#a855f7" : "#06b6d4" }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Tapping ── */}
        {phase === "tapping" && (
          <motion.div key="tap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white">Recreate the rhythm</p>
                <p className="text-[10px] text-white/35">{tapCount} of {beatCount} taps · Space bar or tap button</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xl font-black" style={{ color: timerColor }}>{tapTimeLeft}s</span>
                <div className="flex items-center gap-1.5 text-[9px]"
                  style={{ color: oppLocked ? "#10b981" : "rgba(255,255,255,0.25)" }}>
                  <div className="w-1 h-1 rounded-full" style={{ background: oppLocked ? "#10b981" : "rgba(255,255,255,0.15)" }} />
                  {oppLocked ? `${opponentName} done` : "tapping…"}
                </div>
              </div>
            </div>

            {/* Tap progress dots */}
            <div className="flex items-center gap-1.5 justify-center">
              {Array.from({ length: beatCount }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full transition-all"
                  style={{ background: i < tapCount ? "#a855f7" : "rgba(255,255,255,0.1)", boxShadow: i < tapCount ? "0 0 8px rgba(168,85,247,0.6)" : "none" }} />
              ))}
            </div>

            {/* BIG TAP BUTTON */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              animate={btnPulse ? { scale: [1, 1.08, 1], backgroundColor: ["#7c3aed", "#a855f7", "#7c3aed"] } : {}}
              transition={{ duration: 0.12 }}
              onPointerDown={handleTap}
              disabled={tapLocked}
              className="w-full py-12 rounded-xs text-2xl font-black text-white disabled:opacity-40 relative overflow-hidden flex items-center justify-center gap-3"
              style={{
                background: tapLocked ? "rgba(168,85,247,0.12)" : "#7c3aed",
                boxShadow:  tapLocked ? "none" : "0 0 40px rgba(168,85,247,0.6)",
                border:     tapLocked ? "1px solid rgba(168,85,247,0.3)" : "none",
              }}>
              <Music className="w-8 h-8" />
              TAP
            </motion.button>

            {tapLocked && (
              <p className="text-center text-xs text-white/30">Taps locked — waiting for result…</p>
            )}
          </motion.div>
        )}

        {/* ── Reveal ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-4">
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>

            <BeatViz pattern={pattern} tapTimes={roundResult.myTaps} phase="reveal" progress={1} />
            <p className="text-center text-[9px] text-white/25">
              Purple lines = your taps · Coloured bars = original beats
            </p>

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#a855f7" }}>+{roundResult.myPts}</div>
                <div className="text-[9px] text-white/30">You</div>
                <div className="text-[9px] text-white/20">{tapCount} taps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>+{roundResult.oppPts}</div>
                <div className="text-[9px] text-white/30">{opponentName}</div>
                <div className="text-[9px] text-white/20">{roundResult.oppAccuracy}% accuracy</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}