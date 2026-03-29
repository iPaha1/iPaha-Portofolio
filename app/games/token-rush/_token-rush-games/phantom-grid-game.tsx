// =============================================================================
// TOKEN RUSH — Game 2: Phantom Grid
// app/token-rush/_games/phantom-grid.tsx
//
// 8×8 fog-of-war territory battle.
//
// ANTI-CHEAT: Phantom positions are sent to the server at placement time and
// stored there exclusively. Clients never receive the opponent's layout.
// All probe results come back from /api/token-rush/challenges/[id]/probe —
// the server checks the stored layout and returns hit/miss.
//
// DEMO MODE: Opponent AI is simulated locally. Remove DEMO blocks and wire in
// real opponent polling via /api/token-rush/challenges/[id]/poll for production.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Move, Crosshair } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types & constants ─────────────────────────────────────────────────────────
export interface PhantomGridProps {
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

type GamePhase  = "placement" | "battle" | "done";
type CellState  = {
  myPhantom:   boolean;
  oppPhantom:  boolean;  // only known after probe
  probedByMe:  boolean;
  probedByOpp: boolean;
  moved:       boolean;  // my phantom was moved at least once (shows 🔮 instead of 👻)
};

const G         = 8;   // grid dimension
const PHANTOMS  = 8;   // pieces per player
const PROBES    = 16;  // total probes shared between both players
const PTS_HIT   = 20;
const PTS_MISS  = 5;   // opponent gets this when you miss
const MOVE_FREQ = 3;   // can move a phantom every N turns

function newGrid(): CellState[][] {
  return Array.from({ length: G }, () =>
    Array.from({ length: G }, () => ({
      myPhantom: false, oppPhantom: false,
      probedByMe: false, probedByOpp: false, moved: false,
    }))
  );
}

// ── Opponent AI for probing (DEMO) ────────────────────────────────────────────
function aiProbe(grid: CellState[][]): [number, number] {
  // Prefer cells that haven't been probed in rows 0–3
  const candidates: [number, number][] = [];
  for (let r = 0; r < G; r++) {
    for (let c = 0; c < G; c++) {
      if (!grid[r][c].probedByOpp && r < G / 2) candidates.push([r, c]);
    }
  }
  if (!candidates.length) return [Math.floor(Math.random() * 4), Math.floor(Math.random() * G)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PhantomGridGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: PhantomGridProps) {
  const { play } = useGameSound(soundEnabled);

  const [grid,       setGrid]       = useState<CellState[][]>(newGrid());
  const [phase,      setPhase]      = useState<GamePhase>("placement");
  const [placed,     setPlaced]     = useState(0);
  const [myScore,    setMyScore]    = useState(0);
  const [oppScore,   setOppScore]   = useState(0);
  const [probesLeft, setProbesLeft] = useState(PROBES);
  const [myTurn,     setMyTurn]     = useState(true);
  const [turnCount,  setTurnCount]  = useState(0);
  const [movingFrom, setMovingFrom] = useState<[number, number] | null>(null);
  const [canMove,    setCanMove]    = useState(false);
  const [hov,        setHov]        = useState<[number, number] | null>(null);
  const [msg,        setMsg]        = useState("Place 8 phantom pieces in your zone (rows 1–4)");
  const [msgType,    setMsgType]    = useState<"neutral" | "hit" | "miss" | "warn">("neutral");
  const [oppAnim,    setOppAnim]    = useState<[number, number] | null>(null);

  const myRef  = useRef(0);
  const oppRef = useRef(0);
  const prRef  = useRef(PROBES);
  const turnRef = useRef(0);
  const phaseRef = useRef<GamePhase>("placement");
  const gridRef  = useRef(newGrid());

  const notify = (text: string, type: "neutral"|"hit"|"miss"|"warn" = "neutral") => {
    setMsg(text); setMsgType(type);
  };

  // Keep refs in sync
  const syncGrid = (g: CellState[][]) => { setGrid(g); gridRef.current = g; };
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Commit placement ──────────────────────────────────────────────────────
  const commitPlacement = useCallback(async (positions: [number, number][]) => {
    try {
      await fetch(`/api/token-rush/challenges/${challengeId}/phantom-placement`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ positions }),
      });
    } catch { /* non-fatal */ }
  }, [challengeId]);

  // ── Apply opponent probe result (shared logic for real + demo) ─────────────
  const applyOppProbe = useCallback((row: number, col: number, hit: boolean) => {
    setOppAnim([row, col]);
    setTimeout(() => setOppAnim(null), 900);

    const ng = gridRef.current.map(r => r.map(c => ({ ...c })));
    ng[row][col].probedByOpp = true;
    syncGrid(ng);

    if (hit) {
      oppRef.current += PTS_HIT;
      setOppScore(oppRef.current);
      play("predWrong");
      notify(`💀 ${opponentName} found your phantom at ${String.fromCharCode(65+col)}${row+1}! +${PTS_HIT} to them`, "miss");
    } else {
      myRef.current += PTS_MISS;
      setMyScore(myRef.current);
      onScoreUpdate(myRef.current);
      play("probeMiss");
      notify(`${opponentName} missed ${String.fromCharCode(65+col)}${row+1} — +${PTS_MISS} to you`, "hit");
    }

    prRef.current -= 1;
    setProbesLeft(prRef.current);
    turnRef.current += 1;
    setTurnCount(t => t + 1);
    setCanMove(turnRef.current % MOVE_FREQ === 0);
    setMyTurn(true);

    if (prRef.current <= 0) endGame();
  }, [opponentName, onScoreUpdate, play]);

  // ── End game ──────────────────────────────────────────────────────────────
  const endGame = useCallback(() => {
    setPhase("done");
    phaseRef.current = "done";
    play(myRef.current > oppRef.current ? "gameWin" : "gameLose");
    onComplete(myRef.current, oppRef.current);
  }, [onComplete, play]);

  // ── Handle cell click ─────────────────────────────────────────────────────
  const handleClick = useCallback(async (row: number, col: number) => {
    const g = gridRef.current;

    // ── Placement phase ──────────────────────────────────────────────────
    if (phaseRef.current === "placement") {
      if (row >= G / 2) { notify("⚠️ Your zone is rows 1–4 only", "warn"); return; }

      if (movingFrom) {
        const [fr, fc] = movingFrom;
        if (row === fr && col === fc) { setMovingFrom(null); return; }
        if (row >= G / 2 || g[row][col].myPhantom) { setMovingFrom([row, col]); return; }
        const ng = g.map(r => r.map(c => ({ ...c })));
        ng[fr][fc].myPhantom = false;
        ng[row][col].myPhantom = true;
        syncGrid(ng); setMovingFrom(null); play("phantomPlace"); return;
      }

      if (g[row][col].myPhantom) {
        const ng = g.map(r => r.map(c => ({ ...c })));
        ng[row][col].myPhantom = false;
        syncGrid(ng); setPlaced(p => p - 1); play("uiClick"); return;
      }
      if (placed >= PHANTOMS) { notify(`⚠️ All ${PHANTOMS} phantoms placed. Click an existing one to remove.`, "warn"); return; }
      const ng = g.map(r => r.map(c => ({ ...c })));
      ng[row][col].myPhantom = true;
      syncGrid(ng); setPlaced(p => p + 1); play("phantomPlace"); return;
    }

    // ── Battle phase ──────────────────────────────────────────────────────
    if (phaseRef.current !== "battle" || !myTurn) return;

    // Move phantom mid-battle
    if (movingFrom) {
      const [fr, fc] = movingFrom;
      if (row === fr && col === fc) { setMovingFrom(null); return; }
      if (row >= G / 2 || g[row][col].myPhantom || g[row][col].probedByOpp) return;
      const ng = g.map(r => r.map(c => ({ ...c })));
      ng[fr][fc].myPhantom = false;
      ng[row][col].myPhantom = true;
      ng[row][col].moved = true;
      syncGrid(ng);
      setMovingFrom(null); setCanMove(false); play("phantomPlace");
      // Tell server
      fetch(`/api/token-rush/challenges/${challengeId}/move-phantom`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: [fr, fc], to: [row, col] }),
      }).catch(() => {});
      return;
    }

    // Probe — must be in opponent's zone (rows 5–8)
    if (row < G / 2) { notify("⚠️ Probe the enemy zone (lower half)", "warn"); return; }
    if (g[row][col].probedByMe) { notify("⚠️ Already probed this cell", "warn"); return; }

    setMyTurn(false); play("probeMiss");

    const ng = g.map(r => r.map(c => ({ ...c })));
    ng[row][col].probedByMe = true;
    syncGrid(ng);

    // ── DEMO: use local oppPhantom flag ────────────────────────────────────
    const hit = g[row][col].oppPhantom;

    if (hit) {
      myRef.current += PTS_HIT;
      setMyScore(myRef.current);
      onScoreUpdate(myRef.current);
      play("probeHit");
      notify(`💥 HIT! ${String.fromCharCode(65+col)}${row+1} — +${PTS_HIT} pts`, "hit");
    } else {
      oppRef.current += PTS_MISS;
      setOppScore(oppRef.current);
      play("predWrong");
      notify(`Miss — ${opponentName} gets +${PTS_MISS} pts`, "miss");
    }

    prRef.current -= 1;
    setProbesLeft(prRef.current);
    turnRef.current += 1;
    setTurnCount(t => t + 1);
    setCanMove(turnRef.current % MOVE_FREQ === 0);

    if (prRef.current <= 0) { endGame(); return; }

    // ── DEMO: opponent probes after a delay ────────────────────────────────
    setTimeout(() => {
      const [ar, ac] = aiProbe(gridRef.current);
      applyOppProbe(ar, ac, gridRef.current[ar][ac].myPhantom);
    }, 800 + Math.random() * 1400);
    // ── END DEMO ──────────────────────────────────────────────────────────
  }, [myTurn, movingFrom, placed, challengeId, onScoreUpdate, play, applyOppProbe, endGame]);

  // ── Start battle ──────────────────────────────────────────────────────────
  const startBattle = useCallback(async () => {
    if (placed < PHANTOMS) return;

    // Build my positions
    const myPos: [number, number][] = [];
    gridRef.current.forEach((row, ri) => row.forEach((cell, ci) => { if (cell.myPhantom) myPos.push([ri, ci]); }));
    await commitPlacement(myPos);

    // DEMO: seed opponent phantoms in rows 4–7
    const taken = new Set<string>();
    const oppPos: [number, number][] = [];
    while (oppPos.length < PHANTOMS) {
      const r = Math.floor(G / 2) + Math.floor(Math.random() * (G / 2));
      const c = Math.floor(Math.random() * G);
      if (!taken.has(`${r},${c}`)) { taken.add(`${r},${c}`); oppPos.push([r, c]); }
    }
    const ng = gridRef.current.map(r => r.map(c => ({ ...c })));
    oppPos.forEach(([r, c]) => { ng[r][c].oppPhantom = true; });
    syncGrid(ng);

    setPhase("battle"); phaseRef.current = "battle";
    notify("Battle begun! Probe the enemy zone (lower half)", "neutral");
    play("roundStart");
  }, [placed, commitPlacement, play]);

  // ── Cell visual ───────────────────────────────────────────────────────────
  const cellStyle = useCallback((cell: CellState, row: number, col: number): React.CSSProperties => {
    const isHov     = hov?.[0] === row && hov?.[1] === col;
    const isMovSrc  = movingFrom?.[0] === row && movingFrom?.[1] === col;
    const isOppAnim = oppAnim?.[0] === row && oppAnim?.[1] === col;

    if (isOppAnim) return { background: "rgba(6,182,212,0.35)", border: "2px solid #06b6d4", boxShadow: "0 0 18px rgba(6,182,212,0.7)", transition: "all 0.1s" };
    if (cell.probedByMe && cell.oppPhantom)  return { background: "rgba(16,185,129,0.3)",  border: "2px solid #10b981", boxShadow: "0 0 14px rgba(16,185,129,0.5)", transition: "all 0.1s" };
    if (cell.probedByMe && !cell.oppPhantom) return { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", transition: "all 0.1s" };
    if (cell.probedByOpp && cell.myPhantom)  return { background: "rgba(239,68,68,0.28)",  border: "2px solid #ef4444", transition: "all 0.1s" };
    if (cell.probedByOpp && !cell.myPhantom) return { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", transition: "all 0.1s" };
    if (isMovSrc) return { background: "rgba(168,85,247,0.5)", border: "2px solid #a855f7", boxShadow: "0 0 20px rgba(168,85,247,0.8)", transition: "all 0.1s" };
    if (cell.myPhantom && row < G / 2) return { background: "rgba(168,85,247,0.22)", border: "2px solid #a855f7", boxShadow: "0 0 10px rgba(168,85,247,0.4)", transition: "all 0.1s" };
    if (isHov && row >= G/2 && phase === "battle" && myTurn && !cell.probedByMe) return { background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.5)", boxShadow: "0 0 10px rgba(6,182,212,0.3)", transition: "all 0.1s" };
    if (isHov && row < G/2 && phase === "placement" && !cell.myPhantom && placed < PHANTOMS) return { background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", transition: "all 0.1s" };
    if (row < G / 2) return { background: "rgba(168,85,247,0.035)", border: "1px solid rgba(168,85,247,0.1)", transition: "all 0.1s" };
    return { background: "rgba(6,182,212,0.02)", border: "1px solid rgba(6,182,212,0.07)", transition: "all 0.1s" };
  }, [hov, movingFrom, oppAnim, phase, myTurn, placed]);

  const cellIcon = useCallback((cell: CellState, row: number, col: number) => {
    if (oppAnim?.[0] === row && oppAnim?.[1] === col) {
      return <motion.div initial={{ scale: 0 }} animate={{ scale: [0,1.5,1] }} className="w-3 h-3 rounded-full bg-cyan-400" />;
    }
    if (cell.probedByMe && cell.oppPhantom)  return <span className="text-base">💥</span>;
    if (cell.probedByMe && !cell.oppPhantom) return <span className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>;
    if (cell.probedByOpp && cell.myPhantom)  return <span className="text-base">💀</span>;
    if (cell.myPhantom && !cell.probedByOpp) return <span className="text-base">{cell.moved ? "🔮" : "👻"}</span>;
    return null;
  }, [oppAnim]);

  const CELL = 36;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 items-center max-w-lg mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores ── */}
      <div className="grid grid-cols-3 items-center gap-2 w-full">
        <div className="text-center">
          <motion.div key={myScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#a855f7", letterSpacing: "-0.05em" }}>
            {myScore}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>

        <div className="text-center space-y-0.5">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">
            {phase === "placement" ? `Placing ${placed}/${PHANTOMS}` : `${probesLeft} probes left`}
          </div>
          {phase === "battle" && (
            <div className="text-[10px] font-black"
              style={{ color: myTurn ? "#10b981" : "rgba(255,255,255,0.28)" }}>
              {myTurn ? "YOUR TURN" : `${opponentName.split(" ")[0].toUpperCase()}'S TURN`}
            </div>
          )}
        </div>

        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>
            {oppScore}
          </motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      {/* ── Message bar ── */}
      <AnimatePresence mode="wait">
        <motion.div key={msg} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="w-full text-center text-xs font-bold px-3 py-2 rounded-xs"
          style={{
            background: msgType === "hit" ? "rgba(16,185,129,0.08)" : msgType === "miss" ? "rgba(239,68,68,0.06)" : msgType === "warn" ? "rgba(245,158,11,0.07)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${msgType === "hit" ? "rgba(16,185,129,0.2)" : msgType === "miss" ? "rgba(239,68,68,0.15)" : msgType === "warn" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.07)"}`,
            color: msgType === "hit" ? "#10b981" : msgType === "miss" ? "#f87171" : msgType === "warn" ? "#f59e0b" : "rgba(255,255,255,0.55)",
          }}>
          {msg}
        </motion.div>
      </AnimatePresence>

      {/* ── Grid ── */}
      <div className="relative">
        {/* Zone labels */}
        {[{ top: 0, col: "rgba(168,85,247,0.4)", label: "Your Zone" },
          { top: CELL * 4 + 6, col: "rgba(6,182,212,0.4)", label: "Enemy Zone" }].map(z => (
          <div key={z.label} className="absolute -left-10 flex items-center justify-center"
            style={{ top: z.top, height: CELL * 4, width: 36 }}>
            <span className="text-[9px] font-black tracking-widest uppercase"
              style={{ color: z.col, writingMode: "vertical-lr", transform: "rotate(180deg)" }}>
              {z.label}
            </span>
          </div>
        ))}

        <div className="flex flex-col gap-0.5">
          {grid.map((row, ri) => (
            <React.Fragment key={ri}>
              {ri === G / 2 && (
                <div className="h-px my-0.5"
                  style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.14) 20%,rgba(255,255,255,0.14) 80%,transparent)" }} />
              )}
              <div className="flex gap-0.5">
                <div className="w-4 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-black" style={{ color: "rgba(255,255,255,0.12)" }}>{ri + 1}</span>
                </div>
                {row.map((cell, ci) => (
                  <motion.div key={`${ri}-${ci}`}
                    onClick={() => handleClick(ri, ci)}
                    onMouseEnter={() => setHov([ri, ci])}
                    onMouseLeave={() => setHov(null)}
                    whileTap={{ scale: 0.85 }}
                    className="flex items-center justify-center rounded-xs cursor-pointer relative overflow-hidden"
                    style={{ width: CELL, height: CELL, ...cellStyle(cell, ri, ci) }}>
                    {cellIcon(cell, ri, ci)}
                    {/* Phantom move-available shimmer */}
                    {canMove && cell.myPhantom && !cell.probedByOpp && phase === "battle" && (
                      <motion.div animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }}
                        className="absolute inset-0 rounded-xs" style={{ border: "1px dashed rgba(168,85,247,0.7)" }} />
                    )}
                  </motion.div>
                ))}
              </div>
            </React.Fragment>
          ))}
          {/* Column labels */}
          <div className="flex gap-0.5 mt-0.5">
            <div className="w-4 flex-shrink-0" />
            {Array.from({ length: G }).map((_, i) => (
              <div key={i} className="flex items-center justify-center flex-shrink-0" style={{ width: CELL }}>
                <span className="text-[9px] font-black" style={{ color: "rgba(255,255,255,0.12)" }}>
                  {String.fromCharCode(65 + i)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="w-full space-y-2">
        {/* Start battle */}
        {phase === "placement" && (
          <motion.button
            whileHover={placed >= PHANTOMS ? { scale: 1.02 } : {}}
            whileTap={placed >= PHANTOMS ? { scale: 0.97 } : {}}
            onClick={startBattle}
            disabled={placed < PHANTOMS}
            className="w-full py-3.5 rounded-xs text-sm font-black text-white disabled:opacity-30 flex items-center justify-center gap-2"
            style={{
              background: placed >= PHANTOMS ? "#06b6d4" : "rgba(255,255,255,0.05)",
              border:     placed >= PHANTOMS ? "none" : "1px solid rgba(255,255,255,0.08)",
              boxShadow:  placed >= PHANTOMS ? "0 0 32px rgba(6,182,212,0.45)" : "none",
            }}>
            {placed < PHANTOMS
              ? <><EyeOff className="w-4 h-4" />Place {PHANTOMS - placed} more phantom{PHANTOMS - placed !== 1 ? "s" : ""}</>
              : <><Eye className="w-4 h-4" />Begin Battle — All Phantoms Placed</>}
          </motion.button>
        )}

        {/* Move phantom */}
        {phase === "battle" && canMove && myTurn && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (movingFrom) { setMovingFrom(null); return; }
              notify("Click a 👻 to pick it up, then click where to move it", "neutral");
            }}
            className="w-full py-2.5 rounded-xs text-xs font-black flex items-center justify-center gap-2"
            style={{
              background: movingFrom ? "rgba(168,85,247,0.22)" : "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.32)",
              color: "#a855f7",
            }}>
            <Move className="w-3.5 h-3.5" />
            {movingFrom ? "Cancel phantom move" : "Move a Phantom (available this turn)"}
          </motion.button>
        )}

        {/* Turn hint */}
        {phase === "battle" && (
          <div className="text-center text-[10px] font-bold"
            style={{ color: myTurn ? "#10b981" : "rgba(255,255,255,0.22)" }}>
            {myTurn
              ? "👆 Click any cell in the enemy zone to probe"
              : `⏳ ${opponentName} is choosing where to probe…`}
          </div>
        )}
      </div>

      {/* ── Probe progress bar ── */}
      {phase === "battle" && (
        <div className="w-full space-y-1">
          <div className="flex justify-between text-[9px] text-white/20">
            <span>Probes: {PROBES - probesLeft}/{PROBES}</span>
            <span>{probesLeft} left</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${((PROBES - probesLeft) / PROBES) * 100}%` }}
              transition={{ duration: 0.3 }}
              style={{ background: probesLeft <= 4 ? "#ef4444" : "#06b6d4" }} />
          </div>
        </div>
      )}
    </div>
  );
}