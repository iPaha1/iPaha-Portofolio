// =============================================================================
// COLOUR DUEL — Fixed & Self-Managing
// components/(gamification)/(games)/multiplayer/colour-duel.tsx
//
// Key fixes:
//   1. isHost prop added — host broadcasts rounds internally, no page involvement
//   2. On mount: if roundData is null AND isHost → immediately broadcast round 0
//   3. After each answered round: host auto-broadcasts next round after 1.8s
//   4. Round effect also triggers on mount if roundData already exists (roundNumber
//      comparison uses a ref that starts at -1 so round 0 always fires)
//   5. Timeout handled inside component with rAF cancel on cleanup
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Trophy } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Player { userId: string; displayName: string; score: number; isMe: boolean }

interface RoundData {
  roundNumber: number;
  word:        { name: string; hex: string };
  inkColor:    { name: string; hex: string };
  options:     { name: string; hex: string }[];
  timeLimit:   number;   // ms
  startedAt:   number;   // server timestamp (Date.now())
}

interface ColourDuelProps {
  roomCode:      string;
  myUserId:      string;
  isHost:        boolean;           // ← NEW: host broadcasts rounds
  players:       Player[];
  roundData:     RoundData | null;  // polled from server
  totalRounds?:  number;
  onRoundAnswer: (correct: boolean, reactionMs: number, round: number) => void;
  onComplete:    (myScore: number) => void;
  onScoreUpdate: (score: number, isFinal?: boolean) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOURS = [
  { name: "RED",    hex: "#ef4444" },
  { name: "BLUE",   hex: "#3b82f6" },
  { name: "GREEN",  hex: "#10b981" },
  { name: "YELLOW", hex: "#eab308" },
  { name: "PURPLE", hex: "#8b5cf6" },
  { name: "ORANGE", hex: "#f97316" },
  { name: "PINK",   hex: "#ec4899" },
  { name: "CYAN",   hex: "#06b6d4" },
];

const PLAYER_COLORS = ["#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899"];

// ─── Round builder (exported so /start route can also use it) ─────────────────

export function buildRound(roundNumber: number, prevInkName?: string): RoundData {
  const available = COLOURS.filter(c => c.name !== prevInkName);
  const ink       = available[Math.floor(Math.random() * available.length)];
  const wordPool  = COLOURS.filter(c => c.hex !== ink.hex);
  const word      = wordPool[Math.floor(Math.random() * wordPool.length)];
  const distractors = COLOURS
    .filter(c => c.hex !== ink.hex)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options   = [...distractors, ink].sort(() => Math.random() - 0.5);
  const timeLimit = Math.max(1600, 3200 - roundNumber * 120); // gets faster each round
  return { roundNumber, word, inkColor: ink, options, timeLimit, startedAt: Date.now() };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ColourDuel({
  roomCode, myUserId, isHost,
  players: initialPlayers,
  roundData, totalRounds = 8,
  onRoundAnswer, onComplete, onScoreUpdate,
}: ColourDuelProps) {

  const [myScore,    setMyScore]   = useState(0);
  const [liveBoard,  setLiveBoard] = useState<Player[]>(initialPlayers);
  const [answered,   setAnswered]  = useState(false);
  const [flash,      setFlash]     = useState<"correct"|"wrong"|null>(null);
  const [timerRatio, setTimerRatio]= useState(1);
  const [lastResult, setLastResult]= useState<{ correct: boolean; ms: number; pts: number } | null>(null);
  const [roundsDone, setRoundsDone]= useState(0);
  const [done,       setDone]      = useState(false);
  const [pops,       setPops]      = useState<{ id: string; text: string; color: string }[]>([]);
  const [activeRound, setActiveRound] = useState<RoundData | null>(null); // locally confirmed round

  const myScoreRef    = useRef(0);
  const answeredRef   = useRef(false);
  // Starts at -1 so round 0 always triggers the effect
  const lastRoundRef  = useRef(-1);
  const rafRef        = useRef<number>(0);
  const colorMap      = useRef(new Map<string, string>());

  // Seed color map from initial players
  initialPlayers.forEach((p, i) => {
    if (!colorMap.current.has(p.userId)) {
      colorMap.current.set(p.userId, PLAYER_COLORS[i % PLAYER_COLORS.length]);
    }
  });

  // ── Pop helper ──────────────────────────────────────────────────────────────
  const showPop = useCallback((text: string, color: string) => {
    const id = `pop-${Date.now()}-${Math.random()}`;
    setPops(prev => [...prev, { id, text, color }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 900);
  }, []);

  // ── Broadcast a round (host only) ──────────────────────────────────────────
  const broadcastRound = useCallback(async (round: RoundData) => {
    try {
      await fetch(`/api/multiplayer/rooms/${roomCode}/round`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ roundData: round }),
      });
    } catch { /* silent */ }
  }, [roomCode]);

  // ── Host: kick off round 0 on mount if roundData is null ───────────────────
  useEffect(() => {
    if (!isHost) return;
    if (roundData !== null) return; // server already has a round
    // Small delay so both players are in the playing view
    const t = setTimeout(() => {
      const r0 = buildRound(0);
      broadcastRound(r0);
    }, 800);
    return () => clearTimeout(t);
  }, []); // only on mount

  // ── Activate round when roundData changes or arrives ───────────────────────
  useEffect(() => {
    if (!roundData) return;
    if (roundData.roundNumber === lastRoundRef.current) return; // same round, ignore

    lastRoundRef.current   = roundData.roundNumber;
    answeredRef.current    = false;
    setAnswered(false);
    setFlash(null);
    setLastResult(null);
    setActiveRound(roundData);

    // Cancel any running rAF
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Calculate remaining time (server stamped startedAt)
    const remaining = roundData.timeLimit - (Date.now() - roundData.startedAt);
    if (remaining <= 0) {
      // Already expired on arrival — auto-timeout
      handleTimeout(roundData);
      return;
    }

    // Animate timer bar
    const start = performance.now();
    const tick  = (now: number) => {
      const elapsed = now - start;
      const ratio   = Math.max(0, 1 - elapsed / remaining);
      setTimerRatio(ratio);
      if (ratio > 0 && !answeredRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (ratio <= 0 && !answeredRef.current) {
        handleTimeout(roundData);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundData?.roundNumber, roundData?.startedAt]);

  // ── Sync live board ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLiveBoard(
      initialPlayers.map(p =>
        p.userId === myUserId ? { ...p, score: myScoreRef.current } : p,
      ),
    );
  }, [initialPlayers, myUserId]);

  // ── Game completion ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (roundsDone >= totalRounds && !done) {
      setDone(true);
      onScoreUpdate(myScoreRef.current, true);
      setTimeout(() => onComplete(myScoreRef.current), 2000);
    }
  }, [roundsDone, done, totalRounds, onComplete, onScoreUpdate]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Timeout handler ─────────────────────────────────────────────────────────
  const handleTimeout = useCallback((rd: RoundData) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setAnswered(true);
    setFlash("wrong");
    setTimerRatio(0);
    showPop("Timeout — 0 pts", "#ef4444");
    setRoundsDone(r => r + 1);
    onRoundAnswer(false, rd.timeLimit, rd.roundNumber);

    // Host advances after 1.8s
    if (isHost) {
      const nextNum = rd.roundNumber + 1;
      if (nextNum < totalRounds) {
        setTimeout(() => broadcastRound(buildRound(nextNum, rd.inkColor.name)), 1800);
      }
    }
  }, [isHost, totalRounds, broadcastRound, onRoundAnswer, showPop]);

  // ── Answer handler ──────────────────────────────────────────────────────────
  const handlePick = useCallback((colour: { name: string; hex: string }) => {
    if (answeredRef.current || !activeRound || done) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    answeredRef.current = true;
    setAnswered(true);

    const reactionMs = Date.now() - activeRound.startedAt;
    const correct    = colour.hex === activeRound.inkColor.hex;
    let   pts        = 0;

    if (correct) {
      const speedFactor = Math.max(0, 1 - reactionMs / activeRound.timeLimit);
      pts = Math.round(10 + speedFactor * 20); // 10–30 pts
      myScoreRef.current += pts;
      setFlash("correct");
      showPop(`+${pts} ⚡ ${reactionMs}ms`, "#10b981");
    } else {
      pts = -5;
      myScoreRef.current = Math.max(0, myScoreRef.current + pts);
      setFlash("wrong");
      showPop(`−5 ✗`, "#ef4444");
    }

    setMyScore(myScoreRef.current);
    setLastResult({ correct, ms: reactionMs, pts });
    setRoundsDone(r => r + 1);
    onScoreUpdate(myScoreRef.current);
    onRoundAnswer(correct, reactionMs, activeRound.roundNumber);

    // Host advances to next round after 1.8s
    if (isHost) {
      const nextNum = activeRound.roundNumber + 1;
      if (nextNum < totalRounds) {
        setTimeout(
          () => broadcastRound(buildRound(nextNum, activeRound.inkColor.name)),
          1800,
        );
      }
    }
  }, [activeRound, done, isHost, totalRounds, broadcastRound, onRoundAnswer, onScoreUpdate, showPop]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const myColor = colorMap.current.get(myUserId) ?? "#f59e0b";
  const bgColor =
    flash === "correct" ? "#052e16" :
    flash === "wrong"   ? "#3f0a0a" : "#08081a";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-3 h-full">

      {/* Play area */}
      <div className="flex-1 relative rounded-xs overflow-hidden flex flex-col"
        style={{ background: bgColor, transition: "background 0.18s", border: `1px solid ${myColor}25` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: myColor, boxShadow: `0 0 8px ${myColor}` }} />
            <span className="text-xs font-black text-white">You · {myScore}pts</span>
            {isHost && (
              <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                Host
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Eye className="w-3.5 h-3.5" />
            Round {(activeRound?.roundNumber ?? 0) + 1}/{totalRounds}
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-1.5 flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full transition-none"
            style={{
              width: `${timerRatio * 100}%`,
              background: timerRatio < 0.25 ? "#ef4444" : myColor,
              transition: "background 0.2s",
            }}
          />
        </div>

        {/* Game content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-3">
          <p className="text-[10px] tracking-[0.22em] uppercase font-bold"
            style={{ color: "rgba(255,255,255,0.28)" }}>
            Tap the ink colour — not the word
          </p>

          {/* Stroop word */}
          <AnimatePresence mode="wait">
            {activeRound ? (
              <motion.div key={`word-${activeRound.roundNumber}`}
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1,   y: 0  }}
                exit={{   opacity: 0, scale: 0.7,  y: -10 }}
                transition={{ type: "spring", damping: 16, stiffness: 280 }}
                className="font-black select-none text-center"
                style={{
                  fontSize: "clamp(42px, 9vw, 72px)",
                  letterSpacing: "-0.05em",
                  color: activeRound.inkColor.hex,
                  textShadow: `0 0 40px ${activeRound.inkColor.hex}70`,
                }}>
                {activeRound.word.name}
              </motion.div>
            ) : (
              <motion.div key="waiting"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {isHost ? "Preparing round…" : "Waiting for host…"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Last result feedback */}
          {lastResult && (
            <motion.p
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold"
              style={{ color: lastResult.correct ? "#10b981" : "#ef4444" }}>
              {lastResult.correct
                ? `✓ Correct — ${lastResult.ms}ms · +${lastResult.pts}pts`
                : "✗ Wrong answer — −5pts"}
            </motion.p>
          )}

          {/* Colour swatches */}
          {activeRound && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`options-${activeRound.roundNumber}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
                {activeRound.options.map((c, i) => (
                  <motion.button
                    key={`${c.hex}-${i}`}
                    whileHover={!answered ? { scale: 1.06 } : {}}
                    whileTap={!answered  ? { scale: 0.92 } : {}}
                    onClick={() => handlePick(c)}
                    disabled={answered}
                    className="py-3.5 rounded-xs font-black text-xs text-white"
                    style={{
                      background:  c.hex,
                      border:      "2px solid rgba(255,255,255,0.18)",
                      boxShadow:   `0 4px 20px ${c.hex}55`,
                      opacity:     answered ? (c.hex === activeRound.inkColor.hex ? 1 : 0.3) : 1,
                      textShadow:  "0 1px 4px rgba(0,0,0,0.6)",
                      letterSpacing: "0.08em",
                      transition:  "opacity 0.2s",
                      cursor:      answered ? "default" : "pointer",
                    }}>
                    {c.name}
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Answered state — waiting for next round */}
          {answered && !done && (
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>
              {isHost ? "Next round in a moment…" : "Waiting for next round…"}
            </p>
          )}
        </div>

        {/* Score pops */}
        {pops.map(p => (
          <motion.div key={p.id}
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -44 }}
            transition={{ duration: 0.75 }}
            className="absolute pointer-events-none font-black text-base z-20"
            style={{
              left: "50%", top: "42%",
              transform: "translateX(-50%)",
              color: p.color,
              textShadow: "0 2px 8px #000",
            }}>
            {p.text}
          </motion.div>
        ))}

        {/* Done overlay */}
        {done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-3"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}>
            <Trophy className="w-12 h-12 text-amber-400" />
            <p className="text-4xl font-black text-white" style={{ letterSpacing: "-0.05em" }}>{myScore}</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Final score</p>
          </motion.div>
        )}
      </div>

      {/* Live scoreboard */}
      <div className="w-40 flex flex-col gap-2 flex-shrink-0">
        <div className="text-[10px] font-black tracking-widest uppercase text-center py-1.5 rounded-xs"
          style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          Live Scores
        </div>

        {[...liveBoard].sort((a, b) => b.score - a.score).map((p, i) => {
          const col = colorMap.current.get(p.userId) ?? "#94a3b8";
          return (
            <motion.div key={p.userId} layout
              className="flex items-center gap-2 px-2.5 py-2 rounded-xs"
              style={{
                background: p.isMe ? `${col}18` : "rgba(255,255,255,0.03)",
                border: `1px solid ${p.isMe ? `${col}35` : "rgba(255,255,255,0.06)"}`,
              }}>
              <span className="text-[10px] font-black w-3 flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.3)" }}>#{i+1}</span>
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate"
                  style={{ color: p.isMe ? col : "white" }}>
                  {p.isMe ? "You" : p.displayName}
                </p>
                <p className="text-sm font-black"
                  style={{ color: col, letterSpacing: "-0.03em" }}>
                  {p.score}
                </p>
              </div>
            </motion.div>
          );
        })}

        <div className="mt-auto pt-2 text-[9px] space-y-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>
          <div>Correct: <span style={{ color: "#10b981" }}>+10–30pts</span></div>
          <div>Wrong: <span style={{ color: "#ef4444" }}>−5pts</span></div>
          <div>Faster = more pts</div>
        </div>
      </div>
    </div>
  );
}