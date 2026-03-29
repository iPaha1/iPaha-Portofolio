// =============================================================================
// TOKEN RUSH — Game 19: Cartographer
// app/token-rush/_games/cartographer.tsx
//
// A sequential map-building deduction challenge on a hidden 5×5 grid.
// Both players receive the SAME grid but their own set of 8 "survey probes"
// which they use to reveal terrain tiles (mountain, water, forest, desert,
// plain). After probing, 10 mystery cells are shown — players must identify
// their terrain from memory. Closest combined accuracy wins.
// 
// The twist: both players probe DIFFERENT cells, so comparing revealed
// information is strategically valuable — but you must prioritise which
// cells matter most to your final quiz answers.
//
// ANTI-CHEAT: Grid generated server-side. Player probes validated server-side.
// Quiz questions generated server-side after probing — cannot be pre-computed.
//
// DEMO MODE: Grid generated and quiz resolved locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Search, Check, X } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CartographerProps {
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

const TOTAL_ROUNDS  = 6;
const GRID_SIZE     = 5;
const PROBES        = 8;
const QUIZ_COUNT    = 10;
const QUIZ_SECS     = 15;

// ── Terrain types ─────────────────────────────────────────────────────────────
const TERRAINS = [
  { id: 0, label: "Mountain", emoji: "⛰️",  color: "#94a3b8" },
  { id: 1, label: "Water",    emoji: "🌊",  color: "#38bdf8" },
  { id: 2, label: "Forest",   emoji: "🌲",  color: "#4ade80" },
  { id: 3, label: "Desert",   emoji: "🏜️",  color: "#fbbf24" },
  { id: 4, label: "Plain",    emoji: "🌾",  color: "#a3e635" },
] as const;

type TerrainId = 0 | 1 | 2 | 3 | 4;

// ── Grid generation ───────────────────────────────────────────────────────────
function generateGrid(seed: number): TerrainId[][] {
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) % TERRAINS.length as TerrainId; };
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => rng())
  );
}

// ── Quiz question generation ──────────────────────────────────────────────────
interface QuizQ { row: number; col: number; answer: TerrainId }

function generateQuiz(grid: TerrainId[][], probed: number[], seed: number): QuizQ[] {
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s); };
  // All cells
  const all = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
  // Shuffle
  const shuffled = [...all].sort(() => (rng() % 3) - 1);
  return shuffled.slice(0, QUIZ_COUNT).map(idx => ({
    row:    Math.floor(idx / GRID_SIZE),
    col:    idx % GRID_SIZE,
    answer: grid[Math.floor(idx / GRID_SIZE)][idx % GRID_SIZE],
  }));
}

// ── AI prober ─────────────────────────────────────────────────────────────────
function aiProbe(remaining: number[]): number[] {
  const shuffled = [...remaining].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, PROBES);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function CartographerGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: CartographerProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "probing" | "quiz" | "reveal" | "done";

  const [round,       setRound]       = useState(1);
  const [phase,       setPhase]       = useState<Phase>("probing");
  const [grid,        setGrid]        = useState<TerrainId[][]>([]);
  const [myProbed,    setMyProbed]    = useState<number[]>([]);   // cell indices
  const [oppProbed,   setOppProbed]   = useState<number[]>([]);
  const [quizQs,      setQuizQs]      = useState<QuizQ[]>([]);
  const [quizIdx,     setQuizIdx]     = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(TerrainId | null)[]>([]);
  const [quizTimeLeft,setQuizTimeLeft]= useState(QUIZ_SECS);
  const [myScore,     setMyScore]     = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [roundResult, setRoundResult] = useState<{
    myPts: number; oppPts: number; myCorrect: number; oppCorrect: number; headline: string;
  } | null>(null);
  const [hovCell,     setHovCell]     = useState<number | null>(null);

  const myScoreRef  = useRef(0);
  const oppScoreRef = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const gridRef     = useRef<TerrainId[][]>([]);

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number) => {
    const seed = Date.now() ^ (rnd * 0xfeedface);
    const g    = generateGrid(seed);
    gridRef.current = g;
    setGrid(g);
    setMyProbed([]);
    setOppProbed([]);
    setQuizQs([]);
    setQuizIdx(0);
    setQuizAnswers([]);
    setRoundResult(null);
    setQuizTimeLeft(QUIZ_SECS);
    setPhase("probing");
    play("roundStart");

    // AI probes random cells
    const all  = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
    const aiPr = aiProbe(all);
    setOppProbed(aiPr);
  }, [play]);

  // ── Probe a cell ──────────────────────────────────────────────────────────
  const handleProbe = useCallback((row: number, col: number) => {
    if (phase !== "probing") return;
    const idx = row * GRID_SIZE + col;
    if (myProbed.includes(idx)) return;
    if (myProbed.length >= PROBES) return;
    setMyProbed(prev => [...prev, idx]);
    play("probeHit");
  }, [phase, myProbed, play]);

  // ── Start quiz ────────────────────────────────────────────────────────────
  const startQuiz = useCallback(() => {
    if (myProbed.length < PROBES) return;
    const seed = Date.now() ^ 0xabcdef;
    const qs   = generateQuiz(gridRef.current, myProbed, seed);
    setQuizQs(qs);
    setQuizAnswers(new Array(qs.length).fill(null));
    setPhase("quiz");
    play("roundStart");

    timerRef.current = setInterval(() => {
      setQuizTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [myProbed, play]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (phase !== "quiz" || quizTimeLeft !== 0) return;
    resolveRound();
  }, [quizTimeLeft, phase]); // eslint-disable-line

  // ── Answer a quiz question ────────────────────────────────────────────────
  const handleAnswer = useCallback((terrainId: TerrainId) => {
    if (phase !== "quiz") return;
    setQuizAnswers(prev => {
      const next = [...prev];
      next[quizIdx] = terrainId;
      return next;
    });
    play("uiClick");
    if (quizIdx < QUIZ_COUNT - 1) {
      setQuizIdx(q => q + 1);
    } else {
      clearInterval(timerRef.current!);
      setTimeout(resolveRound, 400);
    }
  }, [phase, quizIdx, play]); // eslint-disable-line

  // ── Resolve round ─────────────────────────────────────────────────────────
  const resolveRound = useCallback(() => {
    clearInterval(timerRef.current!);
    const answers = [...quizAnswers]; // capture current
    const qs      = quizQs;

    let myCorrect  = 0;
    let oppCorrect = 0;

    qs.forEach((q, i) => {
      if (answers[i] === q.answer) myCorrect++;
      // AI: 55% accuracy on probed cells, 35% on unprobed
      const wasProbed = oppProbed.includes(q.row * GRID_SIZE + q.col);
      if (Math.random() < (wasProbed ? 0.75 : 0.35)) oppCorrect++;
    });

    const myPts  = myCorrect  * 3;
    const oppPts = oppCorrect * 3;

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline =
      myCorrect >= 9 ? "🗺️ Master cartographer! Near-perfect map!" :
      myCorrect >= 7 ? "✅ Excellent recall!" :
      myCorrect >= 5 ? "👍 Good mapping" :
      myCorrect >= 3 ? "🌊 Partial coverage" : "💀 The map failed you";

    play(myPts > oppPts ? "predCorrect" : myPts > 10 ? "roundEnd" : "predWrong");
    setRoundResult({ myPts, oppPts, myCorrect, oppCorrect, headline });
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
    }, 3500);
  }, [quizAnswers, quizQs, oppProbed, round, onComplete, onScoreUpdate, play, setupRound]);

  useEffect(() => {
    setupRound(1);
    return () => clearInterval(timerRef.current!);
  }, []); // eslint-disable-line

  const currentQ     = quizQs[quizIdx];
  const probesLeft   = PROBES - myProbed.length;
  const timerColor   = quizTimeLeft <= 4 ? "#ef4444" : quizTimeLeft <= 8 ? "#f59e0b" : "#06b6d4";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <motion.div key={myScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#4ade80", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          <div className="text-[9px] text-white/28">
            {phase === "probing" ? `${probesLeft} probes left` : phase === "quiz" ? `Q${quizIdx + 1}/${QUIZ_COUNT}` : ""}
          </div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── PROBING PHASE ── */}
        {phase === "probing" && (
          <motion.div key="probe" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <div className="rounded-xs p-3"
              style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <p className="text-xs font-black text-white mb-0.5">
                🗺️ Survey the terrain — {PROBES} probes total
              </p>
              <p className="text-[10px] text-white/40">
                Click cells to reveal terrain. After all probes are used, you'll be quizzed on {QUIZ_COUNT} mystery cells. Probe wisely — quiz cells are selected randomly.
              </p>
            </div>

            {/* 5×5 grid */}
            <div className="grid grid-cols-5 gap-1" style={{ aspectRatio: "1/1" }}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                const row     = Math.floor(idx / GRID_SIZE);
                const col     = idx % GRID_SIZE;
                const probed  = myProbed.includes(idx);
                const oppProb = oppProbed.includes(idx);
                const terrain = probed ? TERRAINS[grid[row]?.[col] ?? 0] : null;
                const isHov   = hovCell === idx;

                return (
                  <motion.div key={idx}
                    whileTap={!probed && probesLeft > 0 ? { scale: 0.88 } : {}}
                    onClick={() => handleProbe(row, col)}
                    onMouseEnter={() => setHovCell(idx)}
                    onMouseLeave={() => setHovCell(null)}
                    className="relative rounded-xs flex items-center justify-center aspect-square cursor-pointer transition-all"
                    style={{
                      background: probed
                        ? `${terrain!.color}22`
                        : isHov && probesLeft > 0
                          ? "rgba(74,222,128,0.15)"
                          : "rgba(255,255,255,0.04)",
                      border: probed
                        ? `2px solid ${terrain!.color}60`
                        : isHov && probesLeft > 0
                          ? "1px solid rgba(74,222,128,0.5)"
                          : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: probed ? `0 0 8px ${terrain!.color}30` : "none",
                    }}>
                    {probed && <span className="text-lg">{terrain!.emoji}</span>}
                    {!probed && oppProb && (
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
                    )}
                    {!probed && !oppProb && (
                      <span className="text-[9px] font-black text-white/10">
                        {String.fromCharCode(65 + col)}{row + 1}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center">
              {TERRAINS.map(t => (
                <div key={t.id} className="flex items-center gap-1 text-[9px] text-white/40">
                  <span>{t.emoji}</span><span>{t.label}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={myProbed.length >= PROBES ? { scale: 1.02 } : {}}
              whileTap={{ scale: 0.97 }}
              onClick={startQuiz}
              disabled={myProbed.length < PROBES}
              className="w-full py-3.5 rounded-xs text-sm font-black text-white disabled:opacity-30 flex items-center justify-center gap-2"
              style={{
                background: myProbed.length >= PROBES ? "#4ade80" : "rgba(255,255,255,0.05)",
                color:      myProbed.length >= PROBES ? "black"   : "rgba(255,255,255,0.4)",
                border:     myProbed.length >= PROBES ? "none"    : "1px solid rgba(255,255,255,0.09)",
                boxShadow:  myProbed.length >= PROBES ? "0 0 28px rgba(74,222,128,0.5)" : "none",
              }}>
              <Map className="w-4 h-4" />
              {myProbed.length >= PROBES ? "Survey Complete — Start Quiz" : `Probe ${probesLeft} more cells`}
            </motion.button>
          </motion.div>
        )}

        {/* ── QUIZ PHASE ── */}
        {phase === "quiz" && currentQ && (
          <motion.div key="quiz" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-white">
                What terrain is at {String.fromCharCode(65 + currentQ.col)}{currentQ.row + 1}?
              </p>
              <span className="text-xl font-black" style={{ color: timerColor }}>{quizTimeLeft}s</span>
            </div>

            {/* Mini map showing context */}
            <div className="grid grid-cols-5 gap-0.5 mx-auto" style={{ width: 160 }}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                const row     = Math.floor(idx / GRID_SIZE);
                const col     = idx % GRID_SIZE;
                const probed  = myProbed.includes(idx);
                const isTarget = row === currentQ.row && col === currentQ.col;
                const terrain  = probed ? TERRAINS[grid[row]?.[col] ?? 0] : null;
                return (
                  <div key={idx} className="w-7 h-7 rounded-xs flex items-center justify-center text-xs"
                    style={{
                      background: isTarget ? "rgba(255,255,0,0.3)" : probed ? `${terrain!.color}20` : "rgba(255,255,255,0.04)",
                      border:     isTarget ? "2px solid yellow" : probed ? `1px solid ${terrain!.color}40` : "1px solid rgba(255,255,255,0.06)",
                    }}>
                    {isTarget ? "?" : probed ? <span className="text-xs">{terrain!.emoji}</span> : ""}
                  </div>
                );
              })}
            </div>

            {/* Was this cell probed? */}
            {myProbed.includes(currentQ.row * GRID_SIZE + currentQ.col) ? (
              <p className="text-center text-[10px] text-emerald-400">✓ You probed this cell</p>
            ) : (
              <p className="text-center text-[10px] text-white/25">⚠️ You didn't probe this — use your map knowledge</p>
            )}

            {/* Answer buttons */}
            <div className="grid grid-cols-5 gap-2">
              {TERRAINS.map(t => (
                <motion.button key={t.id}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleAnswer(t.id as TerrainId)}
                  className="py-3 rounded-xs flex flex-col items-center gap-1.5"
                  style={{ background: `${t.color}15`, border: `1px solid ${t.color}35`, transition: "all 0.1s" }}>
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-[8px] font-black text-white/50">{t.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Progress */}
            <div className="flex gap-0.5">
              {Array.from({ length: QUIZ_COUNT }).map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full"
                  style={{ background: i < quizIdx ? "#4ade80" : i === quizIdx ? "#f59e0b" : "rgba(255,255,255,0.08)" }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── REVEAL ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xs p-5 space-y-4"
            style={{ background: "rgba(6,6,18,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>

            {/* Full grid reveal */}
            <div className="grid grid-cols-5 gap-0.5 mx-auto" style={{ width: 160 }}>
              {grid.map((row, ri) => row.map((tid, ci) => {
                const t = TERRAINS[tid];
                return (
                  <div key={`${ri}-${ci}`} className="w-7 h-7 rounded-xs flex items-center justify-center text-xs"
                    style={{ background: `${t.color}20`, border: `1px solid ${t.color}35` }}>
                    <span className="text-xs">{t.emoji}</span>
                  </div>
                );
              }))}
            </div>

            <div className="flex justify-center gap-8">
              {[
                { label: "You",         correct: roundResult.myCorrect,  pts: roundResult.myPts,  col: "#4ade80" },
                { label: opponentName,  correct: roundResult.oppCorrect, pts: roundResult.oppPts, col: "#06b6d4" },
              ].map(p => (
                <div key={p.label} className="text-center">
                  <div className="text-2xl font-black" style={{ color: p.col }}>+{p.pts}</div>
                  <div className="text-[10px] text-white/30">{p.label}</div>
                  <div className="text-[9px] text-white/20">{p.correct}/{QUIZ_COUNT} correct</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}