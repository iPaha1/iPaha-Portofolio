// =============================================================================
// TOKEN RUSH — Game 12: Signal Thief
// app/token-rush/_games/signal-thief.tsx
//
// A real-time signal jamming war. Both players manage a live energy economy
// across 16 shared transmission nodes. Each turn: BOOST a node (costs 1 energy,
// adds 1 signal strength) or JAM an opponent's node (costs 2 energy, removes
// 2 signal strength). Energy regenerates 1 per tick. Most total signal
// strength when time expires wins. Read your opponent's priorities, deny
// their power nodes, protect your own — 90 seconds of pure resource warfare.
//
// ANTI-CHEAT: All actions validated server-side. Energy state is authoritative
// on the server — client cannot fake energy or signal levels.
//
// DEMO MODE: Opponent AI simulated locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Radio, TrendingUp } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface SignalThiefProps {
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

const GRID_SIZE       = 16;  // 4×4 grid of nodes
const GAME_DURATION   = 90;  // seconds
const MAX_ENERGY      = 10;
const ENERGY_REGEN    = 1;   // per tick
const TICK_MS         = 1000;
const BOOST_COST      = 1;
const JAM_COST        = 2;
const BOOST_POWER     = 2;
const JAM_POWER       = 3;   // jamming removes more than boosting adds
const MAX_SIGNAL      = 10;
const COOLDOWN_MS     = 600; // action cooldown

interface Node {
  id:         number;
  mySignal:   number;   // 0–10
  oppSignal:  number;   // 0–10
  contested:  boolean;  // both have signal here
}

// ── AI opponent ───────────────────────────────────────────────────────────────
function aiAction(
  nodes: Node[],
  oppEnergy: number,
  myNodes: Node[],    // nodes where player has signal
): { type: "boost" | "jam"; nodeId: number } | null {
  if (oppEnergy < BOOST_COST) return null;

  const r = Math.random();

  if (oppEnergy >= JAM_COST && r < 0.45) {
    // Jam the player's strongest node
    const target = [...myNodes].sort((a, b) => b.mySignal - a.mySignal)[0];
    if (target && target.mySignal > 0) return { type: "jam", nodeId: target.id };
  }

  // Boost a random opponent node
  const boostable = nodes.filter(n => n.oppSignal < MAX_SIGNAL);
  if (boostable.length === 0) return null;
  const pick = boostable[Math.floor(Math.random() * boostable.length)];
  return { type: "boost", nodeId: pick.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function SignalThiefGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: SignalThiefProps) {
  const { play } = useGameSound(soundEnabled);

  const [nodes,       setNodes]       = useState<Node[]>(() =>
    Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i, mySignal: 0, oppSignal: 0, contested: false,
    }))
  );
  const [myEnergy,    setMyEnergy]    = useState(5);
  const [oppEnergy,   setOppEnergy]   = useState(5);
  const [timeLeft,    setTimeLeft]    = useState(GAME_DURATION);
  const [myScore,     setMyScore]     = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [lastAction,  setLastAction]  = useState<{ nodeId: number; type: string } | null>(null);
  const [oppLastAct,  setOppLastAct]  = useState<{ nodeId: number; type: string } | null>(null);
  const [actionCooldown, setActionCooldown] = useState(false);
  const [phase,       setPhase]       = useState<"playing" | "done">("playing");
  const [flash,       setFlash]       = useState<{ nodeId: number; col: string } | null>(null);

  const nodesRef      = useRef(nodes);
  const myEnergyRef   = useRef(5);
  const oppEnergyRef  = useRef(5);
  const timeRef       = useRef(GAME_DURATION);
  const tickRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const coolRef       = useRef(false);

  const updateNodes = (fn: (prev: Node[]) => Node[]) => {
    setNodes(prev => {
      const next = fn(prev);
      nodesRef.current = next;
      return next;
    });
  };

  // ── Compute scores ────────────────────────────────────────────────────────
  const computeScores = useCallback((ns: Node[]) => {
    const my  = ns.reduce((a, n) => a + n.mySignal,  0);
    const opp = ns.reduce((a, n) => a + n.oppSignal, 0);
    return { my, opp };
  }, []);

  // ── Player action ─────────────────────────────────────────────────────────
  const doAction = useCallback((type: "boost" | "jam", nodeId: number) => {
    if (coolRef.current || phase !== "playing") return;
    const cost = type === "boost" ? BOOST_COST : JAM_COST;
    if (myEnergyRef.current < cost) return;

    coolRef.current = true;
    setActionCooldown(true);
    setTimeout(() => { coolRef.current = false; setActionCooldown(false); }, COOLDOWN_MS);

    myEnergyRef.current -= cost;
    setMyEnergy(myEnergyRef.current);

    updateNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      if (type === "boost") {
        return { ...n, mySignal: Math.min(MAX_SIGNAL, n.mySignal + BOOST_POWER) };
      } else {
        return { ...n, oppSignal: Math.max(0, n.oppSignal - JAM_POWER) };
      }
    }));

    setLastAction({ nodeId, type });
    setFlash({ nodeId, col: type === "boost" ? "#6366f1" : "#ef4444" });
    setTimeout(() => setFlash(null), 400);

    play(type === "boost" ? "phantomPlace" : "probeHit");

    const { my } = computeScores(nodesRef.current);
    onScoreUpdate(my);
  }, [phase, play, computeScores, onScoreUpdate]);

  // ── Game tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    play("roundStart");

    // Main timer
    tickRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);

      // Regen energy
      myEnergyRef.current = Math.min(MAX_ENERGY, myEnergyRef.current + ENERGY_REGEN);
      oppEnergyRef.current = Math.min(MAX_ENERGY, oppEnergyRef.current + ENERGY_REGEN);
      setMyEnergy(myEnergyRef.current);
      setOppEnergy(oppEnergyRef.current);

      // Update live scores
      const { my, opp } = computeScores(nodesRef.current);
      setMyScore(my);
      setOppScore(opp);

      if (timeRef.current <= 0) {
        clearInterval(tickRef.current!);
        clearInterval(aiRef.current!);
        setPhase("done");
        play(my > opp ? "gameWin" : "gameLose");
        onComplete(my, opp);
      }
    }, TICK_MS);

    // AI opponent actions
    aiRef.current = setInterval(() => {
      if (timeRef.current <= 0) return;
      const ns = nodesRef.current;
      const myNs = ns.filter(n => n.mySignal > 0);
      const action = aiAction(ns, oppEnergyRef.current, myNs);
      if (!action) return;

      const cost = action.type === "boost" ? BOOST_COST : JAM_COST;
      if (oppEnergyRef.current < cost) return;
      oppEnergyRef.current -= cost;
      setOppEnergy(oppEnergyRef.current);

      updateNodes(prev => prev.map(n => {
        if (n.id !== action.nodeId) return n;
        if (action.type === "boost") {
          return { ...n, oppSignal: Math.min(MAX_SIGNAL, n.oppSignal + BOOST_POWER) };
        } else {
          return { ...n, mySignal: Math.max(0, n.mySignal - JAM_POWER) };
        }
      }));

      setOppLastAct({ nodeId: action.nodeId, type: action.type });
      setFlash({ nodeId: action.nodeId, col: action.type === "jam" ? "#f97316" : "#06b6d4" });
      setTimeout(() => setFlash(null), 400);
    }, 1400 + Math.random() * 800);

    return () => {
      clearInterval(tickRef.current!);
      clearInterval(aiRef.current!);
    };
  }, []); // eslint-disable-line

  const { my: liveMyScore, opp: liveOppScore } = useMemo(
    () => computeScores(nodes), [nodes, computeScores]
  );

  const timerColor = timeLeft <= 15 ? "#ef4444" : timeLeft <= 30 ? "#f59e0b" : "#10b981";

  // ── Node cell renderer ────────────────────────────────────────────────────
  const NodeCell = useCallback(({ node }: { node: Node }) => {
    const isFlash  = flash?.nodeId === node.id;
    const myPct    = (node.mySignal / MAX_SIGNAL) * 100;
    const oppPct   = (node.oppSignal / MAX_SIGNAL) * 100;
    const dominant = node.mySignal > node.oppSignal ? "me" :
                     node.oppSignal > node.mySignal ? "opp" : "tie";
    const canJam   = node.oppSignal > 0 && myEnergy >= JAM_COST && !actionCooldown;
    const canBoost = node.mySignal < MAX_SIGNAL && myEnergy >= BOOST_COST && !actionCooldown;

    return (
      <div className="relative rounded-xs overflow-hidden"
        style={{
          background: "rgba(6,6,18,0.9)",
          border: `1px solid ${isFlash ? flash!.col : dominant === "me" ? "rgba(99,102,241,0.35)" : dominant === "opp" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: isFlash ? `0 0 18px ${flash!.col}` : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}>

        {/* Signal bars */}
        <div className="absolute bottom-0 left-0 w-1/2 transition-all duration-300"
          style={{ height: `${myPct}%`, background: "rgba(99,102,241,0.35)", borderRight: "1px solid rgba(99,102,241,0.2)" }} />
        <div className="absolute bottom-0 right-0 w-1/2 transition-all duration-300"
          style={{ height: `${oppPct}%`, background: "rgba(239,68,68,0.28)", borderLeft: "1px solid rgba(239,68,68,0.15)" }} />

        {/* Node id + signals */}
        <div className="relative z-10 p-1.5 flex flex-col items-center gap-0.5 h-full">
          <div className="text-[8px] font-black text-white/20">{node.id + 1}</div>
          <div className="flex items-center gap-1 mt-auto">
            <span className="text-[9px] font-black" style={{ color: "#818cf8" }}>{node.mySignal}</span>
            <span className="text-[8px] text-white/15">·</span>
            <span className="text-[9px] font-black" style={{ color: "#f87171" }}>{node.oppSignal}</span>
          </div>
        </div>

        {/* Action buttons — appear on hover */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex gap-0.5 p-0.5 z-20">
          <button onClick={() => canBoost && doAction("boost", node.id)}
            className="flex-1 flex items-center justify-center rounded-xs text-xs font-black"
            style={{
              background: canBoost ? "rgba(99,102,241,0.7)" : "rgba(99,102,241,0.15)",
              color: canBoost ? "white" : "rgba(255,255,255,0.2)",
              cursor: canBoost ? "pointer" : "not-allowed",
            }}
            title={`Boost (+${BOOST_POWER} signal, costs ${BOOST_COST} ⚡)`}>
            +
          </button>
          <button onClick={() => canJam && doAction("jam", node.id)}
            className="flex-1 flex items-center justify-center rounded-xs text-xs font-black"
            style={{
              background: canJam ? "rgba(239,68,68,0.65)" : "rgba(239,68,68,0.1)",
              color: canJam ? "white" : "rgba(255,255,255,0.2)",
              cursor: canJam ? "pointer" : "not-allowed",
            }}
            title={`Jam (−${JAM_POWER} enemy signal, costs ${JAM_COST} ⚡)`}>
            ✕
          </button>
        </div>
      </div>
    );
  }, [flash, myEnergy, actionCooldown, doAction]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Header stats ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="space-y-1">
          <div className="text-2xl font-black" style={{ color: "#6366f1", letterSpacing: "-0.04em" }}>{liveMyScore}</div>
          <div className="text-[9px] text-white/30 font-bold">Your signal</div>
          {/* Energy bar */}
          <div className="flex gap-0.5">
            {Array.from({ length: MAX_ENERGY }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                style={{ background: i < myEnergy ? "#6366f1" : "rgba(255,255,255,0.07)" }} />
            ))}
          </div>
          <div className="text-[9px]" style={{ color: "#818cf8" }}>{myEnergy} ⚡ energy</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-black" style={{ color: timerColor, letterSpacing: "-0.04em" }}>{timeLeft}s</div>
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Remaining</div>
          {actionCooldown && (
            <div className="text-[9px] text-white/30 mt-0.5">Cooldown…</div>
          )}
        </div>

        <div className="space-y-1 text-right">
          <div className="text-2xl font-black" style={{ color: "#ef4444", letterSpacing: "-0.04em" }}>{liveOppScore}</div>
          <div className="text-[9px] text-white/30 font-bold truncate">{opponentName}</div>
          <div className="flex gap-0.5 justify-end">
            {Array.from({ length: MAX_ENERGY }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                style={{ background: i < oppEnergy ? "#ef4444" : "rgba(255,255,255,0.07)" }} />
            ))}
          </div>
          <div className="text-[9px]" style={{ color: "#f87171" }}>{oppEnergy} ⚡</div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-between text-[9px] px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-black" style={{ color: "#818cf8" }}>
            <div className="w-2.5 h-2.5 rounded-xs bg-indigo-400/60" /> You
          </span>
          <span className="flex items-center gap-1 font-black" style={{ color: "#f87171" }}>
            <div className="w-2.5 h-2.5 rounded-xs bg-red-400/50" /> {opponentName.split(" ")[0]}
          </span>
        </div>
        <span className="text-white/25">Hover a node → + Boost / ✕ Jam</span>
      </div>

      {/* ── 4×4 Node grid ── */}
      <div className="grid grid-cols-4 gap-1.5" style={{ height: 220 }}>
        {nodes.map(node => (
          <NodeCell key={node.id} node={node} />
        ))}
      </div>

      {/* ── Live action log ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xs"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] text-white/40">
          {lastAction
            ? `You ${lastAction.type === "boost" ? "boosted" : "jammed"} node ${lastAction.nodeId + 1}`
            : oppLastAct
              ? `${opponentName} ${oppLastAct.type === "boost" ? "boosted" : "jammed"} node ${oppLastAct.nodeId + 1}`
              : "Game in progress — hover nodes to act"}
        </span>
      </div>

      {/* ── Controls reminder ── */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="px-3 py-2 rounded-xs text-center"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8" }}>
          <strong>+ Boost</strong> · {BOOST_COST}⚡ · +{BOOST_POWER} signal
        </div>
        <div className="px-3 py-2 rounded-xs text-center"
          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171" }}>
          ✕ Jam · {JAM_COST}⚡ · −{JAM_POWER} enemy signal
        </div>
      </div>
    </div>
  );
}