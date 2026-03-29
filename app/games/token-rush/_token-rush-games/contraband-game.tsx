// =============================================================================
// TOKEN RUSH — Game 17: Contraband
// app/token-rush/_games/contraband.tsx
//
// A real-time deception game with alternating roles each round.
// SMUGGLER: Has 5 suitcases. Secretly marks 2 as containing contraband.
//           Earns points each turn contraband goes uninspected.
//           Has ONE bluff-switch per round: swap two suitcase labels.
// INSPECTOR: Selects 2 suitcases to open each turn (3 turns per round).
//            Earns big points for each contraband found.
//            Also has a one-time "double-open" — inspect 3 suitcases in one turn.
// Roles swap every round. 6 rounds total.
//
// ANTI-CHEAT: Contraband positions committed server-side before any inspection.
// Inspector never receives the layout — only the results of opened suitcases.
//
// DEMO MODE: Contraband positions managed locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, AlertTriangle, Shield, Eye, Shuffle } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface ContrabandProps {
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

const TOTAL_ROUNDS       = 6;
const SUITCASES          = 5;
const CONTRABAND_COUNT   = 2;
const TURNS_PER_ROUND    = 3;
const INSPECT_PER_TURN   = 2;
const PTS_FOUND          = 20;   // inspector finds contraband
const PTS_SAFE_PASS      = 6;    // smuggler evades one turn
const PTS_DOUBLE_OPEN    = 0;    // no extra cost — it's inspector's power
const BLUFF_SWITCH_LIMIT = 1;    // smuggler can switch once

const SUITCASE_EMOJIS    = ["🧳", "💼", "🎒", "📦", "🪣"];
const SUITCASE_LABELS    = ["A", "B", "C", "D", "E"];

// ── Opponent AI ───────────────────────────────────────────────────────────────
function aiPlaceContraband(): number[] {
  const positions: number[] = [];
  while (positions.length < CONTRABAND_COUNT) {
    const r = Math.floor(Math.random() * SUITCASES);
    if (!positions.includes(r)) positions.push(r);
  }
  return positions;
}

function aiInspect(
  opened: number[],
  remainingTurns: number,
  prevFound: number[],
): number[] {
  // AI inspector: avoid already opened, bias toward un-inspected
  const available = Array.from({ length: SUITCASES }, (_, i) => i)
    .filter(i => !opened.includes(i));
  if (available.length <= INSPECT_PER_TURN) return available;
  // Shuffle and pick
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, INSPECT_PER_TURN);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function ContrabandGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: ContrabandProps) {
  const { play } = useGameSound(soundEnabled);

  type Role  = "smuggler" | "inspector";
  type Phase = "placement" | "playing" | "turn_reveal" | "round_end" | "done";

  const [round,          setRound]          = useState(1);
  const [phase,          setPhase]          = useState<Phase>("placement");
  const [myRole,         setMyRole]         = useState<Role>("smuggler");
  const [contraband,     setContraband]     = useState<number[]>([]);     // smuggler: which suitcases
  const [opened,         setOpened]         = useState<number[]>([]);     // which have been opened
  const [found,          setFound]          = useState<number[]>([]);     // contraband found
  const [turn,           setTurn]           = useState(1);
  const [selected,       setSelected]       = useState<number[]>([]);     // inspector's picks
  const [myScore,        setMyScore]        = useState(0);
  const [oppScore,       setOppScore]       = useState(0);
  const [myRoundPts,     setMyRoundPts]     = useState(0);
  const [oppRoundPts,    setOppRoundPts]    = useState(0);
  const [bluffUsed,      setBluffUsed]      = useState(false);
  const [doubleUsed,     setDoubleUsed]     = useState(false);
  const [bluffAnim,      setBluffAnim]      = useState(false);
  const [turnResult,     setTurnResult]     = useState<{ openedList: number[]; foundList: number[] } | null>(null);
  const [roundSummary,   setRoundSummary]   = useState<{ myPts: number; oppPts: number; headline: string } | null>(null);

  const myScoreRef   = useRef(0);
  const oppScoreRef  = useRef(0);
  const myRndRef     = useRef(0);
  const oppRndRef    = useRef(0);
  const contrabandRef= useRef<number[]>([]);

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number, role: Role) => {
    setMyRole(role);
    setContraband([]);
    contrabandRef.current = [];
    setOpened([]);
    setFound([]);
    setTurn(1);
    setSelected([]);
    myRndRef.current = 0;
    oppRndRef.current = 0;
    setMyRoundPts(0);
    setOppRoundPts(0);
    setBluffUsed(false);
    setDoubleUsed(false);
    setTurnResult(null);
    setRoundSummary(null);

    if (role === "smuggler") {
      setPhase("placement");
    } else {
      // AI places contraband (DEMO)
      const cb = aiPlaceContraband();
      contrabandRef.current = cb;
      setContraband(cb);
      setPhase("playing");
    }
    play("roundStart");
  }, [play]);

  // ── Smuggler places contraband ────────────────────────────────────────────
  const handleSuitcaseClick = useCallback((idx: number) => {
    if (phase === "placement" && myRole === "smuggler") {
      setContraband(prev => {
        if (prev.includes(idx)) return prev.filter(i => i !== idx);
        if (prev.length >= CONTRABAND_COUNT) return prev;
        return [...prev, idx];
      });
    } else if (phase === "playing" && myRole === "inspector") {
      const maxPicks = doubleUsed ? INSPECT_PER_TURN : INSPECT_PER_TURN;
      if (opened.includes(idx)) return;
      setSelected(prev => {
        if (prev.includes(idx)) return prev.filter(i => i !== idx);
        if (prev.length >= maxPicks) return prev;
        return [...prev, idx];
      });
    }
  }, [phase, myRole, doubleUsed, opened]);

  // ── Smuggler confirms placement ───────────────────────────────────────────
  const confirmPlacement = useCallback(() => {
    if (contraband.length < CONTRABAND_COUNT) return;
    contrabandRef.current = contraband;
    // POST to server in production
    setPhase("playing");
    play("moveLock");
  }, [contraband, play]);

  // ── Smuggler: bluff switch ────────────────────────────────────────────────
  const doBluff = useCallback(() => {
    if (bluffUsed || myRole !== "smuggler") return;
    // Randomly swap two of the visible suitcase label indices
    // (In reality, nothing moves — it's a psychological misdirection signal)
    setBluffUsed(true);
    setBluffAnim(true);
    setTimeout(() => setBluffAnim(false), 800);
    play("challengePost");
    // POST bluff event to server in production (server swaps two positions)
  }, [bluffUsed, myRole, play]);

  // ── Inspector submits picks ───────────────────────────────────────────────
  const submitInspect = useCallback(() => {
    if (selected.length === 0 || phase !== "playing" || myRole !== "inspector") return;
    const openList  = selected;
    const foundList = openList.filter(i => contrabandRef.current.includes(i));

    setOpened(prev => [...prev, ...openList]);
    setFound(prev  => [...prev, ...foundList]);
    setSelected([]);

    // Score
    const myPts  = foundList.length * PTS_FOUND;
    const oppPts = (openList.length - foundList.length) * PTS_SAFE_PASS; // smuggler evaded

    myRndRef.current  += myPts;
    oppRndRef.current += oppPts;
    setMyRoundPts(myRndRef.current);
    setOppRoundPts(oppRndRef.current);

    setTurnResult({ openedList: openList, foundList });
    setPhase("turn_reveal");
    play(foundList.length > 0 ? "probeHit" : "probeMiss");

    setTimeout(() => {
      setTurnResult(null);
      const nextTurn = turn + 1;
      if (nextTurn > TURNS_PER_ROUND) {
        finishRound();
      } else {
        setTurn(nextTurn);
        setPhase("playing");
      }
    }, 1800);
  }, [selected, phase, myRole, turn, play]); // eslint-disable-line

  // ── AI inspector turn (when I am smuggler) ─────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || myRole !== "smuggler") return;
    const delay = 1500 + Math.random() * 2000;
    const t = setTimeout(() => {
      const picks      = aiInspect(opened, TURNS_PER_ROUND - turn + 1, found);
      const foundList  = picks.filter(i => contrabandRef.current.includes(i));
      const newOpened  = [...opened, ...picks];
      const newFound   = [...found, ...foundList];

      setOpened(newOpened);
      setFound(newFound);

      // Score: inspector (opp) earns for finds; I (smuggler) earn for safe passes
      const oppPts = foundList.length * PTS_FOUND;
      const myPts  = (picks.length - foundList.length) * PTS_SAFE_PASS;

      myRndRef.current  += myPts;
      oppRndRef.current += oppPts;
      setMyRoundPts(myRndRef.current);
      setOppRoundPts(oppRndRef.current);

      setTurnResult({ openedList: picks, foundList });
      setPhase("turn_reveal");
      play(foundList.length > 0 ? "predWrong" : "predCorrect");

      setTimeout(() => {
        setTurnResult(null);
        const nextTurn = turn + 1;
        if (nextTurn > TURNS_PER_ROUND) {
          finishRound();
        } else {
          setTurn(nextTurn);
          setPhase("playing");
        }
      }, 1800);
    }, delay);
    return () => clearTimeout(t);
  }, [phase, myRole, turn]); // eslint-disable-line

  // ── Finish round ──────────────────────────────────────────────────────────
  const finishRound = useCallback(() => {
    const myPts  = myRndRef.current;
    const oppPts = oppRndRef.current;

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline = myRole === "inspector"
      ? myPts > oppPts ? `🔍 Great detective work! +${myPts} pts` : `🎭 Smuggler slipped through! +${myPts} pts`
      : myPts > oppPts ? `🧳 Contraband evaded! +${myPts} pts` : `💀 Inspector caught your goods! +${myPts} pts`;

    play(myPts > oppPts ? "predCorrect" : "predWrong");
    setRoundSummary({ myPts, oppPts, headline });
    setPhase("round_end");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        const nextRole: Role = myRole === "smuggler" ? "inspector" : "smuggler";
        setRound(r => r + 1);
        setupRound(round + 1, nextRole);
      }
    }, 3500);
  }, [myRole, round, onComplete, onScoreUpdate, play, setupRound]);

  useEffect(() => { setupRound(1, "smuggler"); }, []); // eslint-disable-line

  const openedAll = opened.length >= SUITCASES - found.length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <motion.div key={myScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: myRole === "smuggler" ? "#f59e0b" : "#10b981", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
          <div className="text-[9px] font-black" style={{ color: "rgba(255,255,255,0.35)" }}>+{myRoundPts} this round</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
          <div className="text-[9px] font-black"
            style={{ color: myRole === "smuggler" ? "#f59e0b" : "#10b981" }}>
            {myRole === "smuggler" ? "🧳 SMUGGLER" : "🔍 INSPECTOR"}
          </div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
          <div className="text-[9px] text-white/25">+{oppRoundPts} this round</div>
        </div>
      </div>

      {/* ── Role instruction ── */}
      <div className="rounded-xs p-3"
        style={{
          background: myRole === "smuggler" ? "rgba(245,158,11,0.07)" : "rgba(16,185,129,0.07)",
          border: `1px solid ${myRole === "smuggler" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
        }}>
        {myRole === "smuggler" && phase === "placement" && (
          <>
            <p className="text-xs font-black text-white mb-0.5">🧳 Place your contraband ({contraband.length}/{CONTRABAND_COUNT})</p>
            <p className="text-[10px] text-white/40">{opponentName} will inspect 2 suitcases per turn for 3 turns. Earn +{PTS_SAFE_PASS} pts for each uninspected suitcase per turn.</p>
          </>
        )}
        {myRole === "smuggler" && phase === "playing" && (
          <>
            <p className="text-xs font-black text-white mb-0.5">🧳 {opponentName} is inspecting — turn {turn}/{TURNS_PER_ROUND}</p>
            <p className="text-[10px] text-white/40">Contraband safe so far: +{myRoundPts} pts</p>
          </>
        )}
        {myRole === "inspector" && (
          <>
            <p className="text-xs font-black text-white mb-0.5">🔍 Open {INSPECT_PER_TURN} suitcases — turn {turn}/{TURNS_PER_ROUND}</p>
            <p className="text-[10px] text-white/40">Find contraband for +{PTS_FOUND} pts each. Contraband found: {found.length}/{CONTRABAND_COUNT}</p>
          </>
        )}
      </div>

      {/* ── Suitcases ── */}
      <div className={`grid grid-cols-5 gap-2 ${bluffAnim ? "animate-pulse" : ""}`}>
        {Array.from({ length: SUITCASES }).map((_, idx) => {
          const isContraband = contraband.includes(idx);
          const isOpened     = opened.includes(idx);
          const isFound      = found.includes(idx);
          const isSelected   = selected.includes(idx);
          const wasJustOpen  = turnResult?.openedList.includes(idx);
          const wasJustFound = turnResult?.foundList.includes(idx);

          let bg     = "rgba(255,255,255,0.04)";
          let border = "rgba(255,255,255,0.1)";
          let glow   = "none";
          let icon   = SUITCASE_EMOJIS[idx];

          if (myRole === "smuggler" && isContraband && !isOpened) {
            bg     = "rgba(245,158,11,0.15)";
            border = "rgba(245,158,11,0.4)";
          }
          if (isSelected && !isOpened) {
            bg     = "rgba(16,185,129,0.15)";
            border = "#10b981";
            glow   = "0 0 14px rgba(16,185,129,0.5)";
          }
          if (isOpened && !isFound) {
            bg     = "rgba(255,255,255,0.02)";
            border = "rgba(255,255,255,0.05)";
          }
          if (isFound) {
            bg     = "rgba(239,68,68,0.2)";
            border = "#ef4444";
            glow   = "0 0 14px rgba(239,68,68,0.5)";
            icon   = "🚨";
          }
          if (wasJustOpen && !wasJustFound) icon = "✅";
          if (wasJustFound) icon = "🚨";

          return (
            <motion.button key={idx}
              whileTap={!isOpened ? { scale: 0.88 } : {}}
              onClick={() => !isOpened && handleSuitcaseClick(idx)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xs relative overflow-hidden"
              style={{ background: bg, border: `2px solid ${border}`, boxShadow: glow, transition: "all 0.2s", cursor: isOpened ? "default" : "pointer" }}>

              <motion.span
                animate={wasJustFound ? { scale: [1, 1.5, 1], rotate: [0, -10, 10, 0] } : {}}
                className="text-2xl">{icon}</motion.span>
              <span className="text-[9px] font-black" style={{ color: isFound ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
                {SUITCASE_LABELS[idx]}
              </span>

              {/* Contraband indicator (smuggler only, unopened) */}
              {myRole === "smuggler" && isContraband && !isOpened && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"
                  style={{ boxShadow: "0 0 6px #f59e0b" }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Turn result flash ── */}
      <AnimatePresence>
        {turnResult && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-center text-sm font-black rounded-xs py-2.5"
            style={{
              background: turnResult.foundList.length > 0 ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.08)",
              border: `1px solid ${turnResult.foundList.length > 0 ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.2)"}`,
              color:  turnResult.foundList.length > 0 ? "#f87171" : "#6ee7b7",
            }}>
            {turnResult.foundList.length > 0
              ? `🚨 Contraband found in suitcase${turnResult.foundList.length > 1 ? "s" : ""} ${turnResult.foundList.map(i => SUITCASE_LABELS[i]).join(" & ")}!`
              : `✅ Suitcases ${turnResult.openedList.map(i => SUITCASE_LABELS[i]).join(" & ")} — clear`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Actions ── */}
      {phase === "placement" && myRole === "smuggler" && (
        <div className="flex gap-2">
          {!bluffUsed && (
            <button onClick={() => {}}
              disabled
              className="flex-1 py-2.5 rounded-xs text-xs font-black text-white/30 flex items-center justify-center gap-1.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)" }}
              title="Bluff switch available after placement — confuse the inspector">
              <Shuffle className="w-3.5 h-3.5" />Bluff (save for game)
            </button>
          )}
          <motion.button whileHover={{ scale: contraband.length >= CONTRABAND_COUNT ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
            onClick={confirmPlacement}
            disabled={contraband.length < CONTRABAND_COUNT}
            className="flex-[2] py-2.5 rounded-xs text-sm font-black text-white disabled:opacity-30 flex items-center justify-center gap-2"
            style={{ background: contraband.length >= CONTRABAND_COUNT ? "#f59e0b" : "rgba(255,255,255,0.05)", boxShadow: contraband.length >= CONTRABAND_COUNT ? "0 0 24px rgba(245,158,11,0.5)" : "none" }}>
            <Package className="w-4 h-4" />Seal Suitcases
          </motion.button>
        </div>
      )}

      {phase === "playing" && myRole === "smuggler" && !bluffUsed && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={doBluff}
          className="w-full py-2.5 rounded-xs text-xs font-black flex items-center justify-center gap-2"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.28)", color: "#f59e0b" }}>
          <Shuffle className="w-3.5 h-3.5" />Bluff Switch — confuse the inspector (once only)
        </motion.button>
      )}

      {phase === "playing" && myRole === "inspector" && (
        <motion.button whileHover={{ scale: selected.length > 0 ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
          onClick={submitInspect}
          disabled={selected.length === 0}
          className="w-full py-3.5 rounded-xs text-sm font-black text-white disabled:opacity-30 flex items-center justify-center gap-2"
          style={{ background: selected.length > 0 ? "#10b981" : "rgba(255,255,255,0.05)", boxShadow: selected.length > 0 ? "0 0 28px rgba(16,185,129,0.5)" : "none" }}>
          <Eye className="w-4 h-4" />Open {selected.length > 0 ? selected.map(i => SUITCASE_LABELS[i]).join(" & ") : `${INSPECT_PER_TURN} suitcases`}
        </motion.button>
      )}

      {/* ── Round summary ── */}
      <AnimatePresence>
        {phase === "round_end" && roundSummary && (
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xs p-4 space-y-3"
            style={{ background: "rgba(6,6,18,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-base font-black text-white text-center">{roundSummary.headline}</p>
            {/* Reveal contraband positions */}
            <div className="flex items-center gap-2 text-[10px] text-white/30 justify-center">
              <span>Contraband was in:</span>
              {contrabandRef.current.map(i => (
                <span key={i} className="font-black" style={{ color: "#f59e0b" }}>
                  {SUITCASE_EMOJIS[i]} {SUITCASE_LABELS[i]}
                </span>
              ))}
            </div>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: myRole === "smuggler" ? "#f59e0b" : "#10b981" }}>+{roundSummary.myPts}</div>
                <div className="text-[9px] text-white/30">You ({myRole})</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>+{roundSummary.oppPts}</div>
                <div className="text-[9px] text-white/30">{opponentName}</div>
              </div>
            </div>
            <p className="text-center text-[10px] text-white/22">
              Next: you become the {myRole === "smuggler" ? "Inspector 🔍" : "Smuggler 🧳"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}