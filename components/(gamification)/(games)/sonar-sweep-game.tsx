// =============================================================================
// GAME 28: SONAR SWEEP — Ping the ocean to find hidden fish by inference
// components/(gamification)/(games)/sonar-sweep-game.tsx
//
// Mechanic: A dark 10×10 ocean grid hides a number of "fish schools". Click
// any cell to send a sonar ping — a circle radiates outward showing density
// rings: the closer you are to fish, the brighter/larger the ring. Triangulate
// from multiple pings, then click to "catch" where you think fish are hiding.
// Each ping costs 1 of your limited ping budget. Catches score points but
// wrong catches lose a life. Difficulty grows — more fish, smaller schools,
// more noise. Pure spatial deduction — nothing like Minesweeper; it's dynamic.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Trophy, Fish } from "lucide-react";
import type { GameProps } from "./game-types";

const GRID = 10;
const TOTAL = GRID * GRID;

interface FishSchool {
  cells: number[];  // flat indices
}

interface Ping {
  id:     string;
  idx:    number;
  radius: number;    // animation max radius in cells
  // density 0-1 at each grid cell based on closest fish distance
}

interface PingResult {
  idx:      number;
  minDist:  number;  // distance to nearest fish cell (in cells, Euclidean)
  caught:   boolean; // if this was a catch attempt that hit
}

function cellDist(a: number, b: number): number {
  const ar = Math.floor(a / GRID), ac = a % GRID;
  const br = Math.floor(b / GRID), bc = b % GRID;
  return Math.hypot(ar - br, ac - bc);
}

function placeSchools(count: number, schoolSize: number): FishSchool[] {
  const schools: FishSchool[] = [];
  const occupied = new Set<number>();

  for (let s = 0; s < count; s++) {
    const cells: number[] = [];
    let anchor: number;
    let tries = 0;
    do { anchor = Math.floor(Math.random() * TOTAL); tries++; } while (occupied.has(anchor) && tries < 50);

    cells.push(anchor);
    occupied.add(anchor);

    // Grow school by adjacent cells
    for (let i = 1; i < schoolSize; i++) {
      const neighbors = [anchor - 1, anchor + 1, anchor - GRID, anchor + GRID]
        .filter(n => n >= 0 && n < TOTAL && !occupied.has(n));
      if (neighbors.length === 0) break;
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      cells.push(next);
      occupied.add(next);
    }
    schools.push({ cells });
  }
  return schools;
}

export function SonarSweepGame({
  gameId, rewardTokens, duration = 60, onComplete, isFlash = false,
}: GameProps) {
  const [schools,    setSchools]    = useState<FishSchool[]>([]);
  const [pingBudget, setPingBudget] = useState(12);
  const [pingResults,setPingResults]= useState<PingResult[]>([]);
  const [catches,    setCatches]    = useState<number[]>([]);   // cells user caught
  const [misses,     setMisses]     = useState(0);
  const [lives,      setLives]      = useState(3);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(duration);
  const [done,       setDone]       = useState(false);
  const [mode,       setMode]       = useState<"ping" | "catch">("ping");
  const [pings,      setPings]      = useState<Ping[]>([]);  // animating rings
  const [round,      setRound]      = useState(1);
  const [caught,     setCaught]     = useState(0);           // total fish cells found

  const schoolsRef   = useRef<FishSchool[]>([]);
  const pingBudRef   = useRef(12);
  const livesRef     = useRef(3);
  const scoreRef     = useRef(0);
  const doneRef      = useRef(false);
  const roundRef     = useRef(1);
  const caughtRef    = useRef(0);
  const catchesRef   = useRef<number[]>([]);
  const totalFishCells = useRef(0);

  const getSchoolCount = (r: number) => Math.min(5, 2 + Math.floor(r / 2));
  const getSchoolSize  = (r: number) => Math.max(1, 4 - Math.floor(r / 3));
  const getPingBudget  = (r: number) => Math.max(6, 14 - r);

  const initRound = useCallback((r: number) => {
    const sc = placeSchools(getSchoolCount(r), getSchoolSize(r));
    schoolsRef.current = sc;
    totalFishCells.current = sc.reduce((a, s) => a + s.cells.length, 0);
    const bud = getPingBudget(r);
    pingBudRef.current = bud;
    livesRef.current   = 3;
    catchesRef.current = [];
    caughtRef.current  = 0;
    setSchools(sc);
    setPingBudget(bud);
    setLives(3);
    setPingResults([]);
    setCatches([]);
    setCaught(0);
    setMisses(0);
    setPings([]);
    setMode("ping");
  }, []);

  useEffect(() => { initRound(1); }, [initRound]);

  useEffect(() => {
    const t = setInterval(() => {
      if (doneRef.current) { clearInterval(t); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!done) return;
    const catchRate = totalFishCells.current > 0 ? caughtRef.current / totalFishCells.current : 0;
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + catchRate * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  const handleCellClick = useCallback((idx: number) => {
    if (doneRef.current) return;
    if (catchesRef.current.includes(idx)) return;

    if (mode === "ping") {
      if (pingBudRef.current <= 0) return;
      pingBudRef.current--;
      setPingBudget(pingBudRef.current);

      // Find min distance to any fish cell
      let minDist = Infinity;
      for (const school of schoolsRef.current) {
        for (const cell of school.cells) {
          minDist = Math.min(minDist, cellDist(idx, cell));
        }
      }
      const result: PingResult = { idx, minDist, caught: false };
      setPingResults(prev => [...prev, result]);

      // Animate ring
      const pingId = `ping-${Date.now()}`;
      setPings(prev => [...prev, { id: pingId, idx, radius: 5 }]);
      setTimeout(() => setPings(prev => prev.filter(p => p.id !== pingId)), 1200);

      if (pingBudRef.current === 0) setMode("catch");

    } else {
      // Catch attempt
      catchesRef.current = [...catchesRef.current, idx];
      setCatches([...catchesRef.current]);

      const isFish = schoolsRef.current.some(s => s.cells.includes(idx));
      if (isFish) {
        caughtRef.current++;
        setCaught(caughtRef.current);
        const pts = 40 + roundRef.current * 5;
        scoreRef.current += pts;
        setScore(scoreRef.current);

        // All caught → next round
        if (caughtRef.current >= totalFishCells.current) {
          scoreRef.current += 20 * roundRef.current;
          setScore(scoreRef.current);
          setTimeout(() => {
            if (doneRef.current) return;
            roundRef.current++;
            setRound(roundRef.current);
            initRound(roundRef.current);
          }, 800);
        }
      } else {
        livesRef.current--;
        setLives(livesRef.current);
        setMisses(m => m + 1);
        if (livesRef.current <= 0) { doneRef.current = true; setDone(true); }
      }
    }
  }, [mode, initRound]);

  // Get ping density for a cell (0-1, based on closest ping result)
  const getCellHeat = (idx: number): number => {
    if (pingResults.length === 0) return 0;
    let maxHeat = 0;
    for (const pr of pingResults) {
      const distToCell = cellDist(pr.idx, idx);
      const heat       = Math.max(0, 1 - (distToCell / Math.max(1, pr.minDist + 1)));
      maxHeat          = Math.max(maxHeat, heat);
    }
    return maxHeat;
  };

  // Reveal fish for done state
  const allFishCells = schools.flatMap(s => s.cells);

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(180deg,#020c18 0%,#040f22 100%)", minHeight: 310 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Radio className="w-3.5 h-3.5 text-cyan-400" />{score}
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: mode === "ping" ? "rgba(6,182,212,0.15)" : "rgba(16,185,129,0.15)", color: mode === "ping" ? "#67e8f9" : "#6ee7b7", border: `1px solid ${mode === "ping" ? "rgba(6,182,212,0.3)" : "rgba(16,185,129,0.3)"}` }}>
            {mode === "ping" ? `📡 ${pingBudget} pings left` : `🎣 Catch mode!`}
          </div>
          <div className="flex gap-0.5">
            {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: i < lives ? "#ef4444" : "rgba(255,255,255,0.1)", boxShadow: i < lives ? "0 0 5px #ef4444" : "none" }} />)}
          </div>
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-col items-center pt-2 pb-1 px-3">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 2, width: "100%" }}>
          {Array.from({ length: TOTAL }).map((_, idx) => {
            const heat    = getCellHeat(idx);
            const isCatch = catches.includes(idx);
            const isFish  = done && allFishCells.includes(idx);
            const caught_ = isCatch && allFishCells.includes(idx);
            const missed_ = isCatch && !allFishCells.includes(idx);
            const isPinged = pingResults.some(p => p.idx === idx);

            return (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleCellClick(idx)}
                className="aspect-square rounded-xs cursor-pointer relative overflow-hidden flex items-center justify-center"
                style={{
                  background: caught_ ? "rgba(16,185,129,0.3)"
                    : missed_ ? "rgba(239,68,68,0.3)"
                    : isPinged ? "rgba(6,182,212,0.25)"
                    : heat > 0.1 ? `rgba(16,185,129,${heat * 0.35})`
                    : "rgba(255,255,255,0.03)",
                  border: caught_ ? "1.5px solid rgba(16,185,129,0.6)"
                    : missed_ ? "1.5px solid rgba(239,68,68,0.5)"
                    : isPinged ? "1.5px solid rgba(6,182,212,0.5)"
                    : heat > 0.5 ? `1px solid rgba(16,185,129,${heat * 0.4})`
                    : "1px solid rgba(255,255,255,0.04)",
                }}>
                {isFish && !caught_ && <span style={{ fontSize: 10 }}>🐟</span>}
                {caught_ && <span style={{ fontSize: 10 }}>✓</span>}
                {missed_ && <span style={{ fontSize: 9, color: "#fca5a5" }}>✗</span>}
                {isPinged && !isCatch && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full" style={{ background: "#06b6d4" }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Ping animations */}
        {pings.map(ping => {
          const r_ = Math.floor(ping.idx / GRID), c_ = ping.idx % GRID;
          return (
            <motion.div key={ping.id}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute rounded-full pointer-events-none z-10"
              style={{
                width: 20, height: 20, border: "2px solid rgba(6,182,212,0.7)",
                top: `calc(${(r_ / GRID) * 100}% + 40px)`,
                left: `calc(${(c_ / GRID) * 100}% + 6%)`,
                transform: "translate(-50%,-50%)",
              }} />
          );
        })}
      </div>

      <div className="flex items-center justify-between px-3 pb-2">
        {mode === "catch" && (
          <button onClick={() => setMode("ping")} disabled={pingBudRef.current <= 0}
            className="text-[9px] font-black px-2 py-1 rounded-xs"
            style={{ background: pingBudRef.current > 0 ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.05)", color: pingBudRef.current > 0 ? "#67e8f9" : "rgba(255,255,255,0.2)", border: "1px solid rgba(6,182,212,0.2)" }}>
            📡 Back to ping
          </button>
        )}
        {mode === "ping" && pingBudget > 0 && (
          <button onClick={() => setMode("catch")}
            className="text-[9px] font-black px-2 py-1 rounded-xs"
            style={{ background: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.25)" }}>
            🎣 Switch to catch
          </button>
        )}
        <p className="ml-auto text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {caught}/{totalFishCells.current} fish · {misses} wrong
        </p>
      </div>

      <p className="text-center pb-2 text-[9px]" style={{ color: "rgba(255,255,255,0.18)" }}>
        Ping to find fish density · brighter = closer · then switch to catch
      </p>

      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {caught} fish caught · {misses} missed · round {round}
          </p>
        </motion.div>
      )}

      {isFlash && (
        <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
          style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
          2× Flash
        </div>
      )}
    </div>
  );
}