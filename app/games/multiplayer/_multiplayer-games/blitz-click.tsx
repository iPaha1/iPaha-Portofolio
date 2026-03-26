// =============================================================================
// MULTIPLAYER GAME 1: BLITZ CLICK WAR
// components/(gamification)/(games)/multiplayer/blitz-click-war.tsx
//
// Everyone plays their own Click Hunt instance simultaneously.
// Live scores stream via polling. First to X points wins, or highest score
// when timer ends. Sabotage tiles appear — clicking opponent's name steals pts.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Target, Trophy, Coins, Shield, Swords } from "lucide-react";

interface Player { userId: string; displayName: string; score: number; isMe: boolean }

interface BlitzClickWarProps {
  roomCode:     string;
  myUserId:     string;
  players:      Player[];
  duration?:    number;
  targetScore?: number;           // first to this wins (0 = timer-based)
  onComplete:   (myScore: number) => void;
  onScoreUpdate: (score: number, isFinal?: boolean) => void;
}

// ─── Target types ────────────────────────────────────────────────────────────
type TType = "normal" | "gold" | "bomb" | "shield";
interface ClickTarget {
  id:       string;
  x:        number;  // %
  y:        number;  // %
  size:     number;  // px
  value:    number;
  type:     TType;
  lifespan: number;  // ms
}

const T_CFG: Record<TType, { bg: string; border: string; glow: string; pts: number; weight: number }> = {
  normal: { bg: "radial-gradient(circle at 35% 30%,#fca5a5,#ef4444)", border: "#ef4444", glow: "#ef444460", pts: 10,  weight: 55 },
  gold:   { bg: "radial-gradient(circle at 35% 30%,#fde68a,#f59e0b)", border: "#f59e0b", glow: "#f59e0b80", pts: 25,  weight: 15 },
  bomb:   { bg: "radial-gradient(circle at 35% 30%,#374151,#111827)", border: "#6b7280", glow: "#6b728040", pts: -15, weight: 18 },
  shield: { bg: "radial-gradient(circle at 35% 30%,#a5f3fc,#06b6d4)", border: "#06b6d4", glow: "#06b6d460", pts: 0,   weight: 12 },
};

function pickType(): TType {
  const total = Object.values(T_CFG).reduce((a, c) => a + c.weight, 0);
  let r = Math.random() * total;
  for (const [t, c] of Object.entries(T_CFG) as [TType, typeof T_CFG[TType]][]) {
    r -= c.weight;
    if (r <= 0) return t;
  }
  return "normal";
}

const PLAYER_COLORS = ["#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899"];

export function BlitzClickWar({
  roomCode, myUserId, players: initialPlayers, duration = 30,
  targetScore = 0, onComplete, onScoreUpdate,
}: BlitzClickWarProps) {
  const [targets,   setTargets]   = useState<ClickTarget[]>([]);
  const [myScore,   setMyScore]   = useState(0);
  const [liveBoard, setLiveBoard] = useState<Player[]>(initialPlayers);
  const [timeLeft,  setTimeLeft]  = useState(duration);
  const [shielded,  setShielded]  = useState(false);
  const [combo,     setCombo]     = useState(0);
  const [pops,      setPops]      = useState<{ id: string; x: number; y: number; text: string; color: string }[]>([]);
  const [done,      setDone]      = useState(false);
  const [winner,    setWinner]    = useState<string | null>(null);

  const myScoreRef   = useRef(0);
  const shieldRef    = useRef(false);
  const comboRef     = useRef(0);
  const comboTimer   = useRef<NodeJS.Timeout | null>(null);
  const spawnTimer   = useRef<NodeJS.Timeout | null>(null);
  const targetTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const doneRef      = useRef(false);
  const gameAreaRef  = useRef<HTMLDivElement>(null);

  // Scoreboard colour map
  const colorMap = useRef<Map<string, string>>(new Map());
  initialPlayers.forEach((p, i) => colorMap.current.set(p.userId, PLAYER_COLORS[i % PLAYER_COLORS.length]));

  const showPop = useCallback((x: number, y: number, text: string, color: string) => {
    const id = `pop-${Date.now()}-${Math.random()}`;
    setPops(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 700);
  }, []);

  const spawnTarget = useCallback(() => {
    if (doneRef.current) return;
    const type = pickType();
    const cfg  = T_CFG[type];
    const size = type === "gold" ? 44 : type === "shield" ? 46 : type === "bomb" ? 50 : 38 + Math.random() * 16;
    const id   = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const lifespan = 1600 + Math.random() * 1000;

    setTargets(prev => [...prev.slice(-11), { id, type, size, value: cfg.pts, lifespan, x: 8 + Math.random() * 82, y: 16 + Math.random() * 72 }]);

    const t = setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== id));
      targetTimers.current.delete(id);
      if (type === "normal") { comboRef.current = 0; setCombo(0); }
    }, lifespan);
    targetTimers.current.set(id, t);
  }, []);

  const scheduleSpawn = useCallback(() => {
    if (doneRef.current) return;
    const elapsed  = duration - timeLeft;
    const interval = Math.max(280, 700 - elapsed * 18);
    spawnTimer.current = setTimeout(() => { spawnTarget(); scheduleSpawn(); }, interval);
  }, [duration, timeLeft, spawnTarget]);

  // Timers
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    scheduleSpawn();
    return () => { clearInterval(t); if (spawnTimer.current) clearTimeout(spawnTimer.current); };
  }, []);

  // Sync live board from prop updates
  useEffect(() => { setLiveBoard(initialPlayers.map(p => p.userId === myUserId ? { ...p, score: myScoreRef.current } : p)); }, [initialPlayers]);

  // Target win condition
  useEffect(() => {
    if (targetScore > 0 && myScoreRef.current >= targetScore && !doneRef.current) {
      doneRef.current = true; setDone(true); setWinner(myUserId);
    }
  }, [myScore]);

  // Game over
  useEffect(() => {
    if (!done) return;
    targetTimers.current.forEach(t => clearTimeout(t));
    setTargets([]);
    onScoreUpdate(myScoreRef.current, true);
    setTimeout(() => onComplete(myScoreRef.current), 1500);
  }, [done]);

  const handleClick = (target: ClickTarget, e: React.MouseEvent) => {
    e.stopPropagation();
    if (doneRef.current) return;

    const t = targetTimers.current.get(target.id);
    if (t) { clearTimeout(t); targetTimers.current.delete(target.id); }
    setTargets(prev => prev.filter(t => t.id !== target.id));

    const rect    = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const area    = gameAreaRef.current?.getBoundingClientRect();
    const popX    = area ? ((rect.left + rect.width / 2 - area.left) / area.width) * 100 : 50;
    const popY    = area ? ((rect.top  + rect.height / 2 - area.top) / area.height) * 100 : 50;

    if (target.type === "bomb") {
      if (shieldRef.current) { shieldRef.current = false; setShielded(false); showPop(popX, popY, "🛡 Blocked!", "#06b6d4"); return; }
      const dmg = target.value; // negative
      myScoreRef.current = Math.max(0, myScoreRef.current + dmg);
      setMyScore(myScoreRef.current);
      comboRef.current = 0; setCombo(0);
      showPop(popX, popY, `${dmg} 💥`, "#ef4444");
      onScoreUpdate(myScoreRef.current);
      return;
    }

    if (target.type === "shield") {
      shieldRef.current = true; setShielded(true);
      setTimeout(() => { shieldRef.current = false; setShielded(false); }, 4000);
      showPop(popX, popY, "🛡 Shield!", "#06b6d4");
      return;
    }

    // Normal / gold
    comboRef.current += 1; setCombo(comboRef.current);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => { comboRef.current = 0; setCombo(0); }, 1400);

    const comboBonus = comboRef.current >= 4 ? Math.floor(target.value * 0.5) : 0;
    const pts        = target.value + comboBonus;
    myScoreRef.current += pts;
    setMyScore(myScoreRef.current);
    showPop(popX, popY, `+${pts}${comboRef.current >= 4 ? ` 🔥` : ""}`, target.type === "gold" ? "#f59e0b" : "#10b981");

    // Report live
    onScoreUpdate(myScoreRef.current);

    // Check target score
    if (targetScore > 0 && myScoreRef.current >= targetScore) {
      doneRef.current = true; setDone(true); setWinner(myUserId);
    }
  };

  const myColor = colorMap.current.get(myUserId) ?? "#f59e0b";

  return (
    <div className="flex gap-3 h-full">
      {/* ── Play area ── */}
      <div ref={gameAreaRef} className="flex-1 relative rounded-xs overflow-hidden cursor-crosshair"
        style={{
          background: "linear-gradient(135deg,#0a0a1a 0%,#0d1530 50%,#0a1a0a 100%)",
          boxShadow: `inset 0 0 40px ${myColor}18`,
        }}>

        {/* Player identity strip */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${myColor}30` }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: myColor, boxShadow: `0 0 8px ${myColor}` }} />
            <span className="text-xs font-bold text-white">You</span>
            {shielded && <Shield className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
            {combo >= 3 && <span className="text-[10px] font-black" style={{ color: "#f59e0b" }}>{combo}× combo</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-black" style={{ color: myColor, letterSpacing: "-0.04em" }}>{myScore}</div>
            <div className="text-base font-black tabular-nums" style={{ color: timeLeft <= 5 ? "#ef4444" : "rgba(255,255,255,0.7)", letterSpacing: "-0.03em" }}>{timeLeft}s</div>
          </div>
        </div>

        {/* Targets */}
        <AnimatePresence>
          {targets.map(target => {
            const cfg = T_CFG[target.type];
            return (
              <motion.button key={target.id}
                initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 300 }}
                onClick={e => handleClick(target, e)}
                className="absolute rounded-full flex items-center justify-center font-black text-sm"
                style={{
                  left: `${target.x}%`, top: `${target.y}%`,
                  width: target.size, height: target.size,
                  transform: "translate(-50%,-50%)",
                  background: cfg.bg, border: `2px solid ${cfg.border}`,
                  boxShadow: `0 0 18px ${cfg.glow}, 0 4px 12px rgba(0,0,0,0.5)`,
                  zIndex: 5,
                }}>
                {target.type === "bomb"   ? "💣" :
                 target.type === "gold"   ? "⭐" :
                 target.type === "shield" ? "🛡" : ""}
                {target.type === "normal" && (
                  <>
                    <div className="absolute rounded-full" style={{ width: target.size * 0.65, height: target.size * 0.65, border: "1.5px solid rgba(255,255,255,0.25)" }} />
                    <div className="absolute rounded-full bg-white/30" style={{ width: target.size * 0.28, height: target.size * 0.28 }} />
                  </>
                )}
                <span className="absolute font-black text-white" style={{ bottom: "calc(100% + 2px)", left: "50%", transform: "translateX(-50%)", fontSize: 10, textShadow: "0 1px 4px #000", whiteSpace: "nowrap" }}>
                  {target.value > 0 ? `+${target.value}` : target.value}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Score pops */}
        {pops.map(p => (
          <motion.div key={p.id} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -42 }} transition={{ duration: 0.65 }}
            className="absolute pointer-events-none font-black text-xs z-20 whitespace-nowrap"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", color: p.color, textShadow: "0 2px 6px #000" }}>
            {p.text}
          </motion.div>
        ))}

        {/* Target score progress */}
        {targetScore > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div className="h-full" style={{ background: myColor }}
              animate={{ width: `${Math.min(100, (myScore / targetScore) * 100)}%` }} />
          </div>
        )}

        {/* Done overlay */}
        {done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
            <Trophy className="w-10 h-10 text-amber-400 mb-2" />
            <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{myScore}</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Your final score</p>
          </motion.div>
        )}
      </div>

      {/* ── Live scoreboard sidebar ── */}
      <div className="w-40 flex flex-col gap-2 flex-shrink-0">
        <div className="text-[10px] font-black tracking-widest uppercase text-center py-1.5 rounded-xs"
          style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          Live Scores
        </div>
        {[...liveBoard].sort((a, b) => b.score - a.score).map((p, i) => {
          const col = colorMap.current.get(p.userId) ?? "#94a3b8";
          return (
            <motion.div key={p.userId}
              layout
              className="flex items-center gap-2 px-2.5 py-2 rounded-xs"
              style={{
                background: p.isMe ? `${col}18` : "rgba(255,255,255,0.03)",
                border: `1px solid ${p.isMe ? `${col}35` : "rgba(255,255,255,0.06)"}`,
              }}>
              <span className="text-[10px] font-black tabular-nums w-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>#{i+1}</span>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate" style={{ color: p.isMe ? col : "white" }}>{p.isMe ? "You" : p.displayName}</p>
                <p className="text-sm font-black" style={{ color: col, letterSpacing: "-0.03em" }}>{p.score}</p>
              </div>
            </motion.div>
          );
        })}

        {/* Legend */}
        <div className="mt-auto pt-2 space-y-1 text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          <div className="flex items-center gap-1.5"><span>⭐</span> Gold +25</div>
          <div className="flex items-center gap-1.5"><span>💣</span> Bomb -15</div>
          <div className="flex items-center gap-1.5"><span>🛡</span> Shield 4s</div>
        </div>
      </div>
    </div>
  );
}