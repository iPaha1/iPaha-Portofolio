// =============================================================================
// MULTIPLAYER GAME 3: NUMBER BLITZ
// components/(gamification)/(games)/multiplayer/number-blitz.tsx
//
// Mechanic: A target number (e.g. 13) appears on screen. A 4×4 grid of random
// numbers (1-9) is shown — everyone sees the SAME grid. Race to click any two
// tiles that ADD UP to the target. First correct pair each round = big points.
// Wrong pair = -5pts. 10 rounds, target changes every round. Grid reshuffles
// between rounds. Speed + mental arithmetic = addictive combo.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Trophy, Zap } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Player { userId: string; displayName: string; score: number; isMe: boolean }

export interface NumberBlitzRound {
  roundNumber: number;
  target:      number;
  grid:        number[];  // 16 numbers, indexes 0-15
  timeLimit:   number;
  startedAt:   number;
}

interface NumberBlitzProps {
  roomCode:   string;
  myUserId:   string;
  isHost:     boolean;
  players:    Player[];
  roundData:  NumberBlitzRound | null;
  totalRounds?: number;
  onComplete:   (score: number) => void;
  onScoreUpdate:(score: number, isFinal?: boolean) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAYER_COLORS = ["#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899"];

// ─── Round builder ────────────────────────────────────────────────────────────

export function buildNumberBlitzRound(roundNumber: number): NumberBlitzRound {
  // Target between 6 and 16
  const target = 6 + Math.floor(Math.random() * 11);

  // Build a grid that guarantees at least 2 valid pairs
  const grid: number[] = [];
  const needed: number[] = [];

  // Plant 2 guaranteed pairs
  for (let i = 0; i < 2; i++) {
    const a = 1 + Math.floor(Math.random() * Math.min(target - 1, 9));
    const b = target - a;
    if (b >= 1 && b <= 9) { needed.push(a, b); }
  }

  // Fill remaining 12 slots with random numbers
  while (grid.length < 16) {
    if (needed.length > 0) {
      grid.push(needed.shift()!);
    } else {
      grid.push(1 + Math.floor(Math.random() * 9));
    }
  }

  // Shuffle
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }

  const timeLimit = Math.max(4000, 8000 - roundNumber * 250);
  return { roundNumber, target, grid, timeLimit, startedAt: Date.now() };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NumberBlitz({
  roomCode, myUserId, isHost,
  players: initialPlayers,
  roundData, totalRounds = 10,
  onComplete, onScoreUpdate,
}: NumberBlitzProps) {

  const [myScore,     setMyScore]    = useState(0);
  const [liveBoard,   setLiveBoard]  = useState<Player[]>(initialPlayers);
  const [selected,    setSelected]   = useState<number[]>([]);   // tile indexes picked
  const [answered,    setAnswered]   = useState(false);
  const [flash,       setFlash]      = useState<"correct"|"wrong"|null>(null);
  const [timerRatio,  setTimerRatio] = useState(1);
  const [roundsDone,  setRoundsDone] = useState(0);
  const [done,        setDone]       = useState(false);
  const [pops,        setPops]       = useState<{ id: string; text: string; color: string }[]>([]);
  const [activeRound, setActiveRound]= useState<NumberBlitzRound | null>(null);
  const [wrongIdxs,   setWrongIdxs]  = useState<number[]>([]);

  const myScoreRef   = useRef(0);
  const answeredRef  = useRef(false);
  const lastRoundRef = useRef(-1);
  const rafRef       = useRef(0);
  const colorMap     = useRef(new Map<string, string>());
  initialPlayers.forEach((p, i) => { if (!colorMap.current.has(p.userId)) colorMap.current.set(p.userId, PLAYER_COLORS[i % PLAYER_COLORS.length]); });

  const showPop = useCallback((text: string, color: string) => {
    const id = `pop-${Date.now()}`;
    setPops(p => [...p, { id, text, color }]);
    setTimeout(() => setPops(p => p.filter(x => x.id !== id)), 900);
  }, []);

  const broadcastRound = useCallback(async (round: NumberBlitzRound) => {
    try {
      await fetch(`/api/multiplayer/rooms/${roomCode}/round`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundData: round }),
      });
    } catch { /* silent */ }
  }, [roomCode]);

  // Host kicks off round 0 on mount
  useEffect(() => {
    if (!isHost || roundData !== null) return;
    const t = setTimeout(() => broadcastRound(buildNumberBlitzRound(0)), 800);
    return () => clearTimeout(t);
  }, []);

  // Activate round when roundData changes
  useEffect(() => {
    if (!roundData || roundData.roundNumber === lastRoundRef.current) return;
    lastRoundRef.current = roundData.roundNumber;
    answeredRef.current  = false;
    setAnswered(false);
    setFlash(null);
    setSelected([]);
    setWrongIdxs([]);
    setActiveRound(roundData);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const remaining = roundData.timeLimit - (Date.now() - roundData.startedAt);
    if (remaining <= 0) { handleTimeout(roundData); return; }

    const start = performance.now();
    const tick  = (now: number) => {
      const ratio = Math.max(0, 1 - (now - start) / remaining);
      setTimerRatio(ratio);
      if (ratio > 0 && !answeredRef.current) rafRef.current = requestAnimationFrame(tick);
      else if (ratio <= 0 && !answeredRef.current) handleTimeout(roundData);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [roundData?.roundNumber, roundData?.startedAt]);

  useEffect(() => {
    setLiveBoard(initialPlayers.map(p => p.userId === myUserId ? { ...p, score: myScoreRef.current } : p));
  }, [initialPlayers, myUserId]);

  useEffect(() => {
    if (roundsDone >= totalRounds && !done) {
      setDone(true);
      onScoreUpdate(myScoreRef.current, true);
      setTimeout(() => onComplete(myScoreRef.current), 2000);
    }
  }, [roundsDone, done, totalRounds]);

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

  const handleTimeout = useCallback((rd: NumberBlitzRound) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setAnswered(true); setFlash("wrong"); setTimerRatio(0);
    showPop("Timeout — 0 pts", "#ef4444");
    setRoundsDone(r => r + 1);
    if (isHost) {
      const next = rd.roundNumber + 1;
      if (next < totalRounds) setTimeout(() => broadcastRound(buildNumberBlitzRound(next)), 1800);
    }
  }, [isHost, totalRounds, broadcastRound, showPop]);

  const handleTilePick = useCallback((idx: number) => {
    if (answeredRef.current || !activeRound || done) return;

    setSelected(prev => {
      // Can't pick same tile twice
      if (prev.includes(idx)) return prev;
      const next = [...prev, idx];

      if (next.length === 2) {
        const [a, b] = next;
        const sum    = activeRound.grid[a] + activeRound.grid[b];
        cancelAnimationFrame(rafRef.current);
        answeredRef.current = true;
        setAnswered(true);

        if (sum === activeRound.target) {
          const speedBonus  = Math.round(timerRatio * 30);
          const pts         = 20 + speedBonus;
          myScoreRef.current += pts;
          setFlash("correct");
          showPop(`+${pts} ⚡`, "#10b981");
        } else {
          myScoreRef.current = Math.max(0, myScoreRef.current - 5);
          setFlash("wrong");
          setWrongIdxs([a, b]);
          showPop("−5 ✗", "#ef4444");
          // Brief flash then let them try again within the same round if time remains
          setTimeout(() => {
            if (!done) {
              setFlash(null);
              setSelected([]);
              setWrongIdxs([]);
              answeredRef.current = false;
              setAnswered(false);
              // Restart timer rAF from remaining time
              const rd = activeRound;
              const remaining = rd.timeLimit - (Date.now() - rd.startedAt);
              if (remaining > 0) {
                const start2 = performance.now();
                const tick2 = (now: number) => {
                  const ratio = Math.max(0, 1 - (now - start2) / remaining);
                  setTimerRatio(ratio);
                  if (ratio > 0 && !answeredRef.current) rafRef.current = requestAnimationFrame(tick2);
                  else if (ratio <= 0 && !answeredRef.current) handleTimeout(rd);
                };
                rafRef.current = requestAnimationFrame(tick2);
              } else { handleTimeout(rd); }
            }
          }, 600);
          setMyScore(myScoreRef.current);
          onScoreUpdate(myScoreRef.current);
          return [];
        }

        setMyScore(myScoreRef.current);
        onScoreUpdate(myScoreRef.current);
        setRoundsDone(r => r + 1);
        if (isHost) {
          const nextNum = activeRound.roundNumber + 1;
          if (nextNum < totalRounds) setTimeout(() => broadcastRound(buildNumberBlitzRound(nextNum)), 1800);
        }
      }
      return next;
    });
  }, [activeRound, answered, done, isHost, totalRounds, timerRatio, broadcastRound, handleTimeout, onScoreUpdate, showPop]);

  const myColor = colorMap.current.get(myUserId) ?? "#f59e0b";
  const bgColor = flash === "correct" ? "#052e16" : flash === "wrong" ? "#3f0a0a" : "#08081a";

  return (
    <div className="flex gap-3 h-full">
      <div className="flex-1 relative rounded-xs overflow-hidden flex flex-col"
        style={{ background: bgColor, transition: "background 0.18s", border: `1px solid ${myColor}25` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: myColor, boxShadow: `0 0 8px ${myColor}` }} />
            <span className="text-xs font-black text-white">You · {myScore}pts</span>
          </div>
          <div className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
            Round {(activeRound?.roundNumber ?? 0) + 1}/{totalRounds}
          </div>
        </div>

        {/* Timer */}
        <div className="h-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full" style={{ width: `${timerRatio * 100}%`, background: timerRatio < 0.25 ? "#ef4444" : myColor, transition: "background 0.2s" }} />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-3">
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
            Pick two tiles that add up to
          </p>

          {/* Target number */}
          {activeRound ? (
            <AnimatePresence mode="wait">
              <motion.div key={`target-${activeRound.roundNumber}`}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 14, stiffness: 300 }}>
                <div className="flex items-center justify-center w-20 h-20 rounded-xs font-black text-5xl"
                  style={{
                    background: `${myColor}18`, border: `3px solid ${myColor}`,
                    color: myColor, letterSpacing: "-0.04em",
                    boxShadow: `0 0 40px ${myColor}50`,
                  }}>
                  {activeRound.target}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="w-20 h-20 rounded-xs flex items-center justify-center"
              style={{ border: "2px dashed rgba(255,255,255,0.15)" }}>
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Grid */}
          {activeRound && (
            <AnimatePresence mode="wait">
              <motion.div key={`grid-${activeRound.roundNumber}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-4 gap-2">
                {activeRound.grid.map((n, idx) => {
                  const isSel   = selected.includes(idx);
                  const isWrong = wrongIdxs.includes(idx);
                  const isMatch = flash === "correct" && selected.includes(idx);

                  return (
                    <motion.button key={`${activeRound.roundNumber}-${idx}`}
                      whileHover={!answered ? { scale: 1.1 } : {}}
                      whileTap={!answered ? { scale: 0.9 } : {}}
                      onClick={() => handleTilePick(idx)}
                      disabled={answered && flash === "correct"}
                      className="w-12 h-12 rounded-xs font-black text-xl flex items-center justify-center transition-all"
                      style={{
                        background: isMatch  ? "rgba(16,185,129,0.35)" :
                                    isWrong  ? "rgba(239,68,68,0.35)"  :
                                    isSel    ? `${myColor}30`           :
                                               "rgba(255,255,255,0.07)",
                        border: isMatch ? "2px solid #10b981" :
                                isWrong ? "2px solid #ef4444" :
                                isSel   ? `2px solid ${myColor}` :
                                          "1px solid rgba(255,255,255,0.12)",
                        color: isSel || isMatch || isWrong ? "white" : "rgba(255,255,255,0.7)",
                        boxShadow: isSel ? `0 0 16px ${myColor}60` : "none",
                        letterSpacing: "-0.03em",
                      }}>
                      {n}
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Hint */}
          {selected.length === 1 && activeRound && !answered && (
            <p className="text-xs font-bold" style={{ color: myColor }}>
              {activeRound.grid[selected[0]]} + ? = {activeRound.target} — pick the second tile
            </p>
          )}

          {answered && flash === "correct" && (
            <p className="text-xs font-bold" style={{ color: "#10b981" }}>
              ✓ {activeRound!.grid[selected[0]]} + {activeRound!.grid[selected[1]]} = {activeRound!.target}
            </p>
          )}
        </div>

        {/* Pops */}
        {pops.map(p => (
          <motion.div key={p.id} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -44 }} transition={{ duration: 0.7 }}
            className="absolute pointer-events-none font-black text-base z-20"
            style={{ left: "50%", top: "40%", transform: "translateX(-50%)", color: p.color, textShadow: "0 2px 8px #000" }}>
            {p.text}
          </motion.div>
        ))}

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

      {/* Scoreboard */}
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
              style={{ background: p.isMe ? `${col}18` : "rgba(255,255,255,0.03)", border: `1px solid ${p.isMe ? `${col}35` : "rgba(255,255,255,0.06)"}` }}>
              <span className="text-[10px] font-black w-3" style={{ color: "rgba(255,255,255,0.3)" }}>#{i+1}</span>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate" style={{ color: p.isMe ? col : "white" }}>{p.isMe ? "You" : p.displayName}</p>
                <p className="text-sm font-black" style={{ color: col, letterSpacing: "-0.03em" }}>{p.score}</p>
              </div>
            </motion.div>
          );
        })}
        <div className="mt-auto pt-2 text-[9px] space-y-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>
          <div>Correct: <span style={{ color: "#10b981" }}>+20–50pts</span></div>
          <div>Wrong pair: <span style={{ color: "#ef4444" }}>−5pts</span></div>
          <div>Speed bonus applies</div>
        </div>
      </div>
    </div>
  );
}