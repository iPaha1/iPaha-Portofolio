// =============================================================================
// GAME 24: WORD HUNT — Drag across letters to find hidden words in the grid
// components/(gamification)/(games)/word-hunt-game.tsx
//
// Mechanic: A 7×7 grid of letters has words hidden in every direction —
// horizontal, vertical, diagonal, and backwards. Drag (or swipe on mobile)
// across adjacent letters to highlight a word. Release to submit. Correct
// words lock in and light up. Bonus points for longer words and combo chains.
// Each round uses a fresh grid with more words at harder difficulty.
// Letter-scanning + spatial pattern recognition — completely unique in the set.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, Zap, CheckCircle } from "lucide-react";
import type { GameProps } from "./game-types";

const GRID_SIZE = 7;

// Word banks by difficulty
const WORDS_EASY   = ["CAT","DOG","RUN","FLY","TOP","WIN","SUN","KEY","MAP","ACE","GEM","LOG"];
const WORDS_MEDIUM = ["TOKEN","SCORE","BONUS","CHAIN","QUEST","FLASH","PIXEL","SWIFT","BLAZE","GLIDE"];
const WORDS_HARD   = ["STREAK","MASTER","TURBO","LEGEND","IMPACT","ROCKET","CRYSTAL","PHANTOM"];
const WORDS_EPIC   = ["VELOCITY","CHAMPION","SEQUENCE","ABSOLUTE","MOMENTUM"];

type Direction = [number, number]; // [dr, dc]
const DIRECTIONS: Direction[] = [
  [0,1],[0,-1],[1,0],[-1,0],
  [1,1],[1,-1],[-1,1],[-1,-1],
];

interface PlacedWord {
  word:   string;
  cells:  number[];  // flat indices
  color:  string;
}

const WORD_COLORS = [
  "#ef4444","#f59e0b","#10b981","#3b82f6",
  "#8b5cf6","#ec4899","#06b6d4","#84cc16",
];

// ── Grid builder ─────────────────────────────────────────────────────────────
function buildGrid(round: number): { letters: string[]; placed: PlacedWord[] } {
  const difficulty = Math.min(4, Math.ceil(round / 2));
  const wordPool = [
    ...WORDS_EASY,
    ...(difficulty >= 2 ? WORDS_MEDIUM : []),
    ...(difficulty >= 3 ? WORDS_HARD   : []),
    ...(difficulty >= 4 ? WORDS_EPIC   : []),
  ];

  // Shuffle pool
  const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
  const targetCount = 3 + Math.min(5, Math.floor(round / 2));
  const words = shuffled.slice(0, targetCount);

  const letters = Array(GRID_SIZE * GRID_SIZE).fill("");
  const placed: PlacedWord[] = [];

  for (let wi = 0; wi < words.length; wi++) {
    const word  = words[wi];
    let placed_ = false;
    for (let attempt = 0; attempt < 120 && !placed_; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const r0 = Math.floor(Math.random() * GRID_SIZE);
      const c0 = Math.floor(Math.random() * GRID_SIZE);
      const cells: number[] = [];
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i, c = c0 + dc * i;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) { ok = false; break; }
        const idx = r * GRID_SIZE + c;
        if (letters[idx] !== "" && letters[idx] !== word[i]) { ok = false; break; }
        cells.push(idx);
      }
      if (ok) {
        cells.forEach((idx, i) => { letters[idx] = word[i]; });
        placed.push({ word, cells, color: WORD_COLORS[wi % WORD_COLORS.length] });
        placed_ = true;
      }
    }
  }

  // Fill blanks with random uppercase letters
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < letters.length; i++) {
    if (!letters[i]) letters[i] = alpha[Math.floor(Math.random() * alpha.length)];
  }

  return { letters, placed };
}

// Are two grid indices adjacent (including diagonals)?
function adjacent(a: number, b: number): boolean {
  const ar = Math.floor(a / GRID_SIZE), ac = a % GRID_SIZE;
  const br = Math.floor(b / GRID_SIZE), bc = b % GRID_SIZE;
  return Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1 && a !== b;
}

export function WordHuntGame({
  gameId, rewardTokens, duration = 60, onComplete, isFlash = false,
}: GameProps) {
  const [round,       setRound]       = useState(1);
  const [letters,     setLetters]     = useState<string[]>([]);
  const [placed,      setPlaced]      = useState<PlacedWord[]>([]);
  const [found,       setFound]       = useState<Set<string>>(new Set());
  const [selecting,   setSelecting]   = useState<number[]>([]);
  const [isDown,      setIsDown]      = useState(false);
  const [wrongFlash,  setWrongFlash]  = useState(false);
  const [score,       setScore]       = useState(0);
  const [combo,       setCombo]       = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(duration);
  const [done,        setDone]        = useState(false);
  const [lastFound,   setLastFound]   = useState<string | null>(null);

  const scoreRef  = useRef(0);
  const comboRef  = useRef(0);
  const roundRef  = useRef(1);
  const foundRef  = useRef<Set<string>>(new Set());
  const placedRef = useRef<PlacedWord[]>([]);
  const doneRef   = useRef(false);
  const gridRef   = useRef<HTMLDivElement>(null);

  const initRound = useCallback((r: number) => {
    const { letters: l, placed: p } = buildGrid(r);
    setLetters(l);
    setPlaced(p);
    placedRef.current = p;
    setFound(new Set());
    foundRef.current = new Set();
    setSelecting([]);
    setIsDown(false);
    setLastFound(null);
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
    const wordsFound = foundRef.current.size;
    const totalWords = placedRef.current.length;
    const ratio  = totalWords > 0 ? wordsFound / totalWords : 0;
    const final  = Math.max(1, Math.round(rewardTokens * (0.3 + ratio * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  // Check if current selection matches any word
  const trySubmit = useCallback((sel: number[]) => {
    if (sel.length < 2) return;
    const str = sel.map(i => letters[i]).join("");
    const rev = str.split("").reverse().join("");

    for (const pw of placedRef.current) {
      if (foundRef.current.has(pw.word)) continue;
      const match = pw.cells.length === sel.length &&
        pw.cells.every((c, i) => c === sel[i]);
      const revMatch = pw.cells.length === sel.length &&
        [...pw.cells].reverse().every((c, i) => c === sel[i]);

      if (match || revMatch) {
        const newFound = new Set(foundRef.current);
        newFound.add(pw.word);
        foundRef.current = newFound;
        setFound(new Set(newFound));
        comboRef.current++;
        setCombo(comboRef.current);
        setLastFound(pw.word);
        setTimeout(() => setLastFound(null), 900);

        const lenBonus   = pw.word.length * 10;
        const comboBonus = comboRef.current >= 3 ? 20 : comboRef.current >= 2 ? 10 : 0;
        const pts        = lenBonus + comboBonus;
        scoreRef.current += pts;
        setScore(scoreRef.current);

        // All found → next round
        if (newFound.size === placedRef.current.length) {
          const bonus = roundRef.current * 15;
          scoreRef.current += bonus;
          setScore(scoreRef.current);
          setTimeout(() => {
            if (!doneRef.current) {
              roundRef.current++;
              setRound(roundRef.current);
              initRound(roundRef.current);
            }
          }, 900);
        }
        return;
      }
    }
    // No match
    comboRef.current = 0;
    setCombo(0);
    setWrongFlash(true);
    setTimeout(() => setWrongFlash(false), 280);
  }, [letters, initRound]);

  // ── Pointer / touch handling ─────────────────────────────────────────────────
  const getIdxFromPoint = useCallback((clientX: number, clientY: number): number | null => {
    if (!gridRef.current) return null;
    const cells = gridRef.current.querySelectorAll("[data-idx]");
    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return parseInt((cell as HTMLElement).dataset.idx!);
      }
    }
    return null;
  }, []);

  const enterCell = useCallback((idx: number) => {
    setSelecting(prev => {
      if (prev.length === 0) return [idx];
      if (prev[prev.length - 1] === idx) return prev;
      // Only allow if adjacent to last
      if (!adjacent(prev[prev.length - 1], idx)) return prev;
      // Don't revisit (unless backtracking to second-to-last = undo)
      if (prev.length >= 2 && prev[prev.length - 2] === idx) return prev.slice(0, -1);
      if (prev.includes(idx)) return prev;
      return [...prev, idx];
    });
  }, []);

  const onPointerDown = (e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDown(true);
    setSelecting([idx]);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDown) return;
    const idx = getIdxFromPoint(e.clientX, e.clientY);
    if (idx !== null) enterCell(idx);
  };

  const onPointerUp = () => {
    if (!isDown) return;
    setIsDown(false);
    trySubmit(selecting);
    setSelecting([]);
  };

  // Cell state
  const getFoundColor = (idx: number): string | null => {
    for (const pw of placed) {
      if (found.has(pw.word) && pw.cells.includes(idx)) return pw.color;
    }
    return null;
  };

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#0c1f3c 100%)", minHeight: 320 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Search className="w-3.5 h-3.5 text-cyan-400" />{score}
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: "rgba(6,182,212,0.15)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.3)" }}>
            Round {round} · {found.size}/{placed.length} words
          </div>
          {combo >= 2 && (
            <div className="text-xs font-black" style={{ color: "#f59e0b" }}>{combo}× combo!</div>
          )}
        </div>
        <div className="font-black text-base tabular-nums"
          style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Last found toast */}
      <AnimatePresence>
        {lastFound && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-xs font-black text-sm"
            style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", color: "#6ee7b7", whiteSpace: "nowrap" }}>
            ✓ {lastFound}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter grid */}
      <div ref={gridRef} className="px-3 pt-3 pb-2 touch-none"
        onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 3 }}>
          {letters.map((letter, idx) => {
            const foundColor = getFoundColor(idx);
            const isSelecting = selecting.includes(idx);
            const isWrong     = wrongFlash && isSelecting;

            return (
              <motion.div
                key={idx}
                data-idx={idx}
                onPointerDown={e => onPointerDown(e, idx)}
                animate={isSelecting && !isWrong
                  ? { scale: 1.12 }
                  : { scale: 1 }
                }
                transition={{ type: "spring", damping: 18, stiffness: 400 }}
                className="aspect-square flex items-center justify-center rounded-xs font-black text-sm cursor-pointer"
                style={{
                  background: isWrong
                    ? "rgba(239,68,68,0.35)"
                    : foundColor
                    ? `${foundColor}25`
                    : isSelecting
                    ? "rgba(6,182,212,0.25)"
                    : "rgba(255,255,255,0.05)",
                  border: isWrong
                    ? "1.5px solid rgba(239,68,68,0.7)"
                    : foundColor
                    ? `1.5px solid ${foundColor}60`
                    : isSelecting
                    ? "1.5px solid rgba(6,182,212,0.7)"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: isWrong
                    ? "#fca5a5"
                    : foundColor || (isSelecting ? "#67e8f9" : "rgba(255,255,255,0.75)"),
                  boxShadow: isSelecting && !isWrong ? "0 0 8px rgba(6,182,212,0.4)" : "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  touchAction: "none",
                  letterSpacing: "0.02em",
                }}>
                {letter}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Word list */}
      <div className="px-3 pb-3 flex flex-wrap gap-1.5">
        {placed.map(pw => (
          <div key={pw.word}
            className="px-2 py-0.5 rounded-xs text-[10px] font-black transition-all"
            style={{
              background: found.has(pw.word) ? `${pw.color}20` : "rgba(255,255,255,0.05)",
              border: `1px solid ${found.has(pw.word) ? `${pw.color}50` : "rgba(255,255,255,0.1)"}`,
              color: found.has(pw.word) ? pw.color : "rgba(255,255,255,0.3)",
              textDecoration: found.has(pw.word) ? "line-through" : "none",
            }}>
            {found.has(pw.word) ? `✓ ${pw.word}` : pw.word}
          </div>
        ))}
      </div>

      <p className="text-center pb-2 text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
        Drag across adjacent letters to form words — any direction
      </p>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {foundRef.current.size} words found · {round - 1} full round{round - 1 !== 1 ? "s" : ""}
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