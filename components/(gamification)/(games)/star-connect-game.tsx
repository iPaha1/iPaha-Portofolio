// =============================================================================
// GAME 19: STAR CONNECT — Draw the constellation from memory
// components/(gamification)/(games)/star-connect-game.tsx
//
// Mechanic: A constellation (connected stars) flashes briefly on screen.
// It then goes dark, leaving only the stars (dots) visible. Draw the
// connecting lines from memory by clicking stars in sequence. Each correct
// edge scores points. Wrong connections cost a life. Stars wobble to tease
// you — spatial memory meets pattern recognition. Constellations grow more
// complex each round, shown for shorter windows.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Eye } from "lucide-react";
import type { GameProps } from "./game-types";

interface StarNode {
  id:   number;
  x:    number;  // % 0-100
  y:    number;
}

interface Edge {
  a: number;  // star ids
  b: number;
}

type Phase = "reveal" | "draw" | "result";

// ── Constellation generator ───────────────────────────────────────────────────
function generateConstellation(nodes: number): { stars: StarNode[]; edges: Edge[] } {
  const stars: StarNode[] = [];
  const margin = 14;

  for (let i = 0; i < nodes; i++) {
    let s: StarNode, attempts = 0;
    do {
      s = { id: i, x: margin + Math.random() * (100 - margin * 2), y: margin + Math.random() * (100 - margin * 2) };
      attempts++;
    } while (attempts < 40 && stars.some(t => Math.hypot(t.x - s.x, t.y - s.y) < 18));
    stars.push(s);
  }

  // Build spanning tree + 1–2 extra edges for interesting shape
  const edges: Edge[] = [];
  const connected = new Set([0]);
  while (connected.size < nodes) {
    let best: Edge | null = null, bestDist = Infinity;
    for (const a of connected) {
      for (let b = 0; b < nodes; b++) {
        if (connected.has(b)) continue;
        const d = Math.hypot(stars[a].x - stars[b].x, stars[a].y - stars[b].y);
        if (d < bestDist) { bestDist = d; best = { a, b }; }
      }
    }
    if (best) { edges.push(best); connected.add(best.b); }
  }
  const extras = Math.min(2, Math.floor(nodes / 3));
  for (let e = 0; e < extras; e++) {
    const a = Math.floor(Math.random() * nodes);
    const b = Math.floor(Math.random() * nodes);
    if (a !== b && !edges.some(ed => (ed.a === a && ed.b === b) || (ed.a === b && ed.b === a))) {
      edges.push({ a, b });
    }
  }
  return { stars, edges };
}

export function StarConnectGame({
  gameId, rewardTokens, duration = 60, onComplete, isFlash = false,
}: GameProps) {
  const [round,        setRound]        = useState(1);
  const [phase,        setPhase]        = useState<Phase>("reveal");
  const [stars,        setStars]        = useState<StarNode[]>([]);
  const [targetEdges,  setTargetEdges]  = useState<Edge[]>([]);
  const [drawn,        setDrawn]        = useState<Edge[]>([]);
  const [selected,     setSelected]     = useState<number | null>(null);
  const [lives,        setLives]        = useState(3);
  const [score,        setScore]        = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(duration);
  const [done,         setDone]         = useState(false);
  const [wrongFlash,   setWrongFlash]   = useState<Edge | null>(null);
  const [correctFlash, setCorrectFlash] = useState<Edge | null>(null);

  const scoreRef  = useRef(0);
  const livesRef  = useRef(3);
  const roundRef  = useRef(1);
  const doneRef   = useRef(false);
  const drawnRef  = useRef<Edge[]>([]);
  const svgRef    = useRef<SVGSVGElement>(null);

  const getNodes    = (r: number) => Math.min(9, 4 + Math.floor(r / 2));
  const getRevealMs = (r: number) => Math.max(1000, 3200 - r * 250);

  const startRound = useCallback((r: number) => {
    const n    = getNodes(r);
    const revMs = getRevealMs(r);
    const { stars: s, edges: e } = generateConstellation(n);
    setStars(s);
    setTargetEdges(e);
    setDrawn([]);
    drawnRef.current = [];
    setSelected(null);
    setPhase("reveal");
    setTimeout(() => { if (!doneRef.current) setPhase("draw"); }, revMs);
  }, []);

  // Init
  useEffect(() => { startRound(1); }, []);

  // Timer
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

  // Game over
  useEffect(() => {
    if (!done) return;
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + (scoreRef.current / Math.max(1, roundRef.current * 50)) * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  const edgeKey = (e: Edge) => `${Math.min(e.a,e.b)}-${Math.max(e.a,e.b)}`;
  const isDrawn = (e: Edge) => drawn.some(d => edgeKey(d) === edgeKey(e));
  const isTarget = (e: Edge) => targetEdges.some(t => edgeKey(t) === edgeKey(e));

  const handleStarClick = (id: number) => {
    if (phase !== "draw" || doneRef.current) return;

    if (selected === null) {
      setSelected(id);
      return;
    }
    if (selected === id) { setSelected(null); return; }

    const edge: Edge = { a: selected, b: id };
    setSelected(null);

    if (isDrawn(edge)) return; // already drawn

    if (isTarget(edge)) {
      const newDrawn = [...drawnRef.current, edge];
      drawnRef.current = newDrawn;
      setDrawn(newDrawn);
      setCorrectFlash(edge);
      setTimeout(() => setCorrectFlash(null), 500);

      const pts = 30 + roundRef.current * 5;
      scoreRef.current += pts;
      setScore(scoreRef.current);

      // Check if all edges found
      if (newDrawn.length === targetEdges.length) {
        const bonus = 20 * roundRef.current;
        scoreRef.current += bonus;
        setScore(scoreRef.current);
        setPhase("result");
        setTimeout(() => {
          if (doneRef.current) return;
          roundRef.current++;
          setRound(roundRef.current);
          startRound(roundRef.current);
        }, 1200);
      }
    } else {
      setWrongFlash(edge);
      setTimeout(() => setWrongFlash(null), 500);
      livesRef.current--;
      setLives(livesRef.current);
      if (livesRef.current <= 0) { doneRef.current = true; setDone(true); }
    }
  };

  // SVG mouse pos helper
  const getSvgPos = (e: React.MouseEvent): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    };
  };

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const onSvgMove = (e: React.MouseEvent) => { if (selected !== null) setMousePos(getSvgPos(e)); };
  const onSvgLeave = () => setMousePos(null);

  const W = 320, H = 220;
  const px = (pct: number, dim: number) => (pct / 100) * dim;

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(180deg,#020818 0%,#050d1a 60%,#020818 100%)", minHeight: 290 }}>

      {/* Nebula bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(139,92,246,0.05) 0%, transparent 50%)" }} />

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Star className="w-3.5 h-3.5 text-yellow-400" />{score}
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
            Round {round} · {getNodes(round)} stars
          </div>
          <div className="flex gap-0.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full transition-all"
                style={{ background: i < lives ? "#ef4444" : "rgba(255,255,255,0.1)", boxShadow: i < lives ? "0 0 5px #ef4444" : "none" }} />
            ))}
          </div>
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Phase label */}
      <div className="text-center py-1.5">
        <AnimatePresence mode="wait">
          <motion.p key={phase}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[10px] font-black tracking-[0.2em] uppercase"
            style={{ color: phase === "reveal" ? "#fbbf24" : phase === "draw" ? "#a5b4fc" : "#10b981" }}>
            {phase === "reveal" ? "Memorise the constellation" : phase === "draw" ? "Connect the stars from memory" : "Well done!"}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* SVG canvas */}
      <div className="flex justify-center px-3 pb-3">
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`}
          onMouseMove={onSvgMove} onMouseLeave={onSvgLeave}
          style={{ maxWidth: W, borderRadius: 4, border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.01)", cursor: phase === "draw" ? "crosshair" : "default" }}>

          {/* Background stars */}
          {[...Array(40)].map((_, i) => (
            <circle key={i} cx={Math.sin(i * 137.5) * W / 2 + W / 2}
              cy={Math.cos(i * 97.3) * H / 2 + H / 2}
              r="0.8" fill="rgba(255,255,255,0.18)" />
          ))}

          {/* Target edges (only shown during reveal + result) */}
          {(phase === "reveal" || phase === "result") && targetEdges.map(e => {
            const a = stars[e.a], b = stars[e.b];
            if (!a || !b) return null;
            return (
              <line key={edgeKey(e)}
                x1={px(a.x,W)} y1={px(a.y,H)} x2={px(b.x,W)} y2={px(b.y,H)}
                stroke={phase === "result" ? "rgba(16,185,129,0.6)" : "rgba(253,224,71,0.7)"}
                strokeWidth="2" strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${phase === "result" ? "#10b981" : "#fde047"})` }} />
            );
          })}

          {/* Drawn edges */}
          {drawn.map(e => {
            const a = stars[e.a], b = stars[e.b];
            if (!a || !b) return null;
            const isCorrect = isTarget(e);
            return (
              <line key={`drawn-${edgeKey(e)}`}
                x1={px(a.x,W)} y1={px(a.y,H)} x2={px(b.x,W)} y2={px(b.y,H)}
                stroke={isCorrect ? "rgba(99,102,241,0.8)" : "rgba(239,68,68,0.6)"}
                strokeWidth="2.5" strokeLinecap="round" />
            );
          })}

          {/* Wrong flash edge */}
          {wrongFlash && (() => {
            const a = stars[wrongFlash.a], b = stars[wrongFlash.b];
            if (!a || !b) return null;
            return (
              <line x1={px(a.x,W)} y1={px(a.y,H)} x2={px(b.x,W)} y2={px(b.y,H)}
                stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0.8"
                style={{ animation: "fadeOut 0.5s forwards" }} />
            );
          })()}

          {/* Rubber-band line from selected star to cursor */}
          {selected !== null && mousePos && (() => {
            const s = stars[selected];
            if (!s) return null;
            return <line x1={px(s.x,W)} y1={px(s.y,H)} x2={px(mousePos.x,W)} y2={px(mousePos.y,H)}
              stroke="rgba(165,180,252,0.5)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />;
          })()}

          {/* Stars */}
          {stars.map(s => {
            const isSelected = selected === s.id;
            const hasDrawn   = drawn.some(e => e.a === s.id || e.b === s.id);
            return (
              <g key={s.id} onClick={() => handleStarClick(s.id)} style={{ cursor: phase === "draw" ? "pointer" : "default" }}>
                <circle cx={px(s.x,W)} cy={px(s.y,H)} r="14" fill="transparent" />
                {/* Glow */}
                <circle cx={px(s.x,W)} cy={px(s.y,H)} r={isSelected ? "10" : "6"}
                  fill={isSelected ? "rgba(165,180,252,0.25)" : hasDrawn ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)"}
                  style={{ transition: "all 0.15s" }} />
                {/* Star body */}
                <circle cx={px(s.x,W)} cy={px(s.y,H)} r={isSelected ? "5.5" : "4"}
                  fill={isSelected ? "#a5b4fc" : phase === "reveal" ? "#fde047" : "#e2e8f0"}
                  stroke={isSelected ? "#6366f1" : "rgba(255,255,255,0.3)"} strokeWidth="1"
                  style={{ filter: isSelected ? "drop-shadow(0 0 8px #a5b4fc)" : "drop-shadow(0 0 4px rgba(255,255,255,0.5))", transition: "all 0.15s" }} />
                {/* Star number — only during reveal */}
                {phase === "reveal" && (
                  <text x={px(s.x,W)} y={px(s.y,H) - 9} textAnchor="middle"
                    fontSize="8" fill="rgba(253,224,71,0.6)" fontWeight="bold">{s.id + 1}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Progress */}
      {phase === "draw" && (
        <div className="px-3 pb-2">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <motion.div className="h-full rounded-full" style={{ background: "#6366f1" }}
              animate={{ width: `${targetEdges.length > 0 ? (drawn.length / targetEdges.length) * 100 : 0}%` }}
              transition={{ duration: 0.2 }} />
          </div>
          <p className="text-[9px] text-center mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
            {drawn.length}/{targetEdges.length} connections · click two stars to connect them
          </p>
        </div>
      )}

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{round - 1} constellations mapped</p>
        </motion.div>
      )}

      {isFlash && (
        <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
          style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
          2× Flash
        </div>
      )}

      <style>{`@keyframes fadeOut { to { opacity: 0; } }`}</style>
    </div>
  );
}