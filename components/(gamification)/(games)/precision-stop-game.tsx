// =============================================================================
// GAME 20: PRECISION STOP — Stop the needle exactly on the target
// components/(gamification)/(games)/precision-stop-game.tsx
//
// Mechanic: A needle oscillates back and forth across a gauge at increasing
// speed. Click/tap to freeze it. Score is based on how precisely it lands
// within the glowing target zone. Zones shrink each round. Perfect hits in
// a row trigger a "streak freeze" — the needle pauses for a split second
// as a reward. Five rounds total; final score = sum of precision scores.
// Pure reflex calibration — completely unlike every other game here.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Trophy, Zap } from "lucide-react";
import type { GameProps } from "./game-types";

interface Zone {
  center: number;  // 0-100
  width:  number;  // degrees of arc
}

type RoundPhase = "go" | "stopped" | "between";

function gradeHit(dist: number, zoneWidth: number): { label: string; pts: number; color: string } {
  const perfect = zoneWidth * 0.15;
  const great   = zoneWidth * 0.35;
  const good    = zoneWidth * 0.5;
  if (dist <= perfect) return { label: "PERFECT",  pts: 100, color: "#f59e0b" };
  if (dist <= great)   return { label: "GREAT",    pts:  70, color: "#10b981" };
  if (dist <= good)    return { label: "GOOD",     pts:  40, color: "#3b82f6" };
  if (dist <= zoneWidth / 2) return { label: "OKAY",pts: 15, color: "#8b5cf6" };
  return                       { label: "MISS",    pts:  0,  color: "#ef4444" };
}

const TOTAL_ROUNDS = 6;

export function PrecisionStopGame({
  gameId, rewardTokens, duration = 45, onComplete, isFlash = false,
}: GameProps) {
  const [needlePos,  setNeedlePos]   = useState(0);      // 0-100
  const [zone,       setZone]        = useState<Zone>({ center: 50, width: 22 });
  const [phase,      setPhase]       = useState<RoundPhase>("go");
  const [round,      setRound]       = useState(1);
  const [score,      setScore]       = useState(0);
  const [streak,     setStreak]      = useState(0);
  const [lastGrade,  setLastGrade]   = useState<{ label: string; pts: number; color: string } | null>(null);
  const [timeLeft,   setTimeLeft]    = useState(duration);
  const [done,       setDone]        = useState(false);
  const [allGrades,  setAllGrades]   = useState<string[]>([]);

  const needleRef   = useRef(0);
  const velRef      = useRef(1.1);      // speed %/frame
  const dirRef      = useRef(1);
  const frameRef    = useRef(0);
  const scoreRef    = useRef(0);
  const streakRef   = useRef(0);
  const roundRef    = useRef(1);
  const doneRef     = useRef(false);
  const phaseRef    = useRef<RoundPhase>("go");

  const getZone = (r: number): Zone => ({
    center: 20 + Math.random() * 60,
    width:  Math.max(8, 28 - r * 2.5),
  });

  const getSpeed = (r: number) => 0.9 + r * 0.28;

  // ── Needle loop ───────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    if (doneRef.current || phaseRef.current !== "go") return;
    needleRef.current += velRef.current * dirRef.current;
    if (needleRef.current >= 100) { needleRef.current = 100; dirRef.current = -1; }
    if (needleRef.current <= 0)   { needleRef.current = 0;   dirRef.current =  1; }
    setNeedlePos(needleRef.current);
    frameRef.current = requestAnimationFrame(loop);
  }, []);

  // Init
  useEffect(() => {
    velRef.current = getSpeed(1);
    frameRef.current = requestAnimationFrame(loop);
    const t = setInterval(() => {
      if (doneRef.current) { clearInterval(t); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { cancelAnimationFrame(frameRef.current); clearInterval(t); };
  }, [loop]);

  // Game over
  useEffect(() => {
    if (!done) return;
    cancelAnimationFrame(frameRef.current);
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + scoreRef.current / (TOTAL_ROUNDS * 100) * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  const advanceRound = useCallback(() => {
    const next = roundRef.current + 1;
    if (next > TOTAL_ROUNDS) { doneRef.current = true; setDone(true); return; }
    roundRef.current = next;
    setRound(next);
    const newZone = getZone(next);
    setZone(newZone);
    velRef.current = getSpeed(next);
    phaseRef.current = "go";
    setPhase("go");
    setLastGrade(null);
    frameRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const handleStop = useCallback(() => {
    if (phaseRef.current !== "go" || doneRef.current) return;
    cancelAnimationFrame(frameRef.current);
    phaseRef.current = "stopped";
    setPhase("stopped");

    const dist  = Math.abs(needleRef.current - zone.center);
    const grade = gradeHit(dist, zone.width);

    // Streak
    if (grade.pts >= 70) {
      streakRef.current++;
      setStreak(streakRef.current);
    } else {
      streakRef.current = 0;
      setStreak(0);
    }
    const streakBonus = streakRef.current >= 3 ? 20 : streakRef.current >= 2 ? 10 : 0;
    const pts = grade.pts + streakBonus;
    scoreRef.current += pts;
    setScore(scoreRef.current);
    setLastGrade({ ...grade, pts });
    setAllGrades(prev => [...prev, grade.label]);

    setTimeout(() => {
      if (doneRef.current) return;
      phaseRef.current = "between";
      setPhase("between");
      setTimeout(advanceRound, 600);
    }, 900);
  }, [zone, advanceRound]);

  // Tap/click/space
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); handleStop(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleStop]);

  const zoneLeft  = zone.center - zone.width / 2;
  const zoneRight = zone.center + zone.width / 2;
  const inZone    = phase === "stopped" && needleRef.current >= zoneLeft && needleRef.current <= zoneRight;

  // Gauge arc helpers — a 180° semicircle gauge
  const R     = 90;  // radius in SVG units
  const CX    = 110, CY = 110;
  const toRad = (pct: number) => ((pct / 100) * 180 - 180) * (Math.PI / 180);
  const pt    = (pct: number) => ({
    x: CX + R * Math.cos(toRad(pct)),
    y: CY + R * Math.sin(toRad(pct)),
  });

  const arcPath = (from: number, to: number, r: number) => {
    const s = pt(from), e = pt(to);  // reuse pt with different r by scaling
    const sf = { x: CX + r * Math.cos(toRad(from)), y: CY + r * Math.sin(toRad(from)) };
    const ef = { x: CX + r * Math.cos(toRad(to)),   y: CY + r * Math.sin(toRad(to))   };
    return `M${sf.x},${sf.y} A${r},${r} 0 0,1 ${ef.x},${ef.y}`;
  };

  const needle = pt(needlePos);

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      onClick={handleStop}
      style={{ background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)", minHeight: 290, cursor: phase === "go" ? "pointer" : "default" }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Target className="w-3.5 h-3.5 text-red-400" />{score}
          </div>
          {streak >= 2 && (
            <div className="text-xs font-black" style={{ color: "#f59e0b" }}>{streak}× streak!</div>
          )}
          {/* Round pips */}
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
              const g = allGrades[i];
              const color = g === "PERFECT" ? "#f59e0b" : g === "GREAT" ? "#10b981" : g === "GOOD" ? "#3b82f6" : g === "OKAY" ? "#8b5cf6" : g === "MISS" ? "#ef4444" : "rgba(255,255,255,0.15)";
              return <div key={i} className="w-2.5 h-2.5 rounded-full transition-all" style={{ background: color }} />;
            })}
          </div>
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center pt-2 pb-4">
        <svg width="220" height="130" viewBox="0 0 220 120">
          {/* Gauge track */}
          <path d={arcPath(0, 100, R)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="18" />

          {/* Target zone */}
          <path d={arcPath(zoneLeft, zoneRight, R)} fill="none"
            stroke="rgba(245,158,11,0.35)" strokeWidth="18" strokeLinecap="butt" />
          <path d={arcPath(zoneLeft, zoneRight, R)} fill="none"
            stroke={inZone ? "#10b981" : "#f59e0b"} strokeWidth="3" strokeLinecap="butt"
            style={{ filter: `drop-shadow(0 0 6px ${inZone ? "#10b981" : "#f59e0b"})`, transition: "stroke 0.2s" }} />

          {/* Perfect centre tick */}
          {(() => {
            const c = pt(zone.center);
            const inner = { x: CX + (R - 12) * Math.cos(toRad(zone.center)), y: CY + (R - 12) * Math.sin(toRad(zone.center)) };
            const outer = { x: CX + (R + 12) * Math.cos(toRad(zone.center)), y: CY + (R + 12) * Math.sin(toRad(zone.center)) };
            return <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px #f59e0b)" }} />;
          })()}

          {/* Needle */}
          <line x1={CX} y1={CY} x2={needle.x} y2={needle.y}
            stroke={phase === "stopped" ? (inZone ? "#10b981" : "#ef4444") : "#e2e8f0"}
            strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: phase !== "go" ? "stroke 0.15s" : "none",
              filter: `drop-shadow(0 0 4px ${phase === "stopped" ? (inZone ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.5)"})` }} />

          {/* Needle pivot */}
          <circle cx={CX} cy={CY} r="5" fill="#e2e8f0"
            style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.6))" }} />

          {/* Scale ticks */}
          {[0, 25, 50, 75, 100].map(pct => {
            const inner = { x: CX + (R - 8) * Math.cos(toRad(pct)), y: CY + (R - 8) * Math.sin(toRad(pct)) };
            const outer = { x: CX + (R + 8) * Math.cos(toRad(pct)), y: CY + (R + 8) * Math.sin(toRad(pct)) };
            return <line key={pct} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />;
          })}
        </svg>

        {/* Grade display */}
        <AnimatePresence mode="wait">
          {lastGrade ? (
            <motion.div key="grade"
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mt-1">
              <p className="text-2xl font-black" style={{ color: lastGrade.color, letterSpacing: "-0.03em", textShadow: `0 0 20px ${lastGrade.color}` }}>
                {lastGrade.label}
              </p>
              <p className="text-sm font-bold mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                +{lastGrade.pts} pts
              </p>
            </motion.div>
          ) : (
            <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-2">
              <p className="text-xs font-bold animate-pulse" style={{ color: "rgba(255,255,255,0.3)" }}>
                {phase === "go" ? "Tap or press SPACE to stop the needle" : "Get ready…"}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className="w-3 h-3 rounded-full" style={{ background: "rgba(245,158,11,0.4)", border: "1px solid #f59e0b" }} />
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Hit the gold zone</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone width indicator */}
        <p className="text-[9px] mt-2" style={{ color: "rgba(255,255,255,0.18)" }}>
          Round {round}/{TOTAL_ROUNDS} · Zone: {zone.width.toFixed(0)}° wide
        </p>
      </div>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <div className="flex gap-1.5 mt-1">
            {allGrades.map((g, i) => {
              const color = g === "PERFECT" ? "#f59e0b" : g === "GREAT" ? "#10b981" : g === "GOOD" ? "#3b82f6" : g === "OKAY" ? "#8b5cf6" : "#ef4444";
              return <div key={i} className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: `${color}25`, color }}>{g}</div>;
            })}
          </div>
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