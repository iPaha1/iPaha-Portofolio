// =============================================================================
// GAME 1: CLICK HUNT — Fully Playable
// components/(gamification)/(games)/click-hunt-game.tsx
// =============================================================================
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, Trophy, Sparkles } from "lucide-react";
import type { GameProps } from "./game-types";

interface TargetItem {
  id: string;
  x: number; // percent
  y: number; // percent
  size: "small" | "medium" | "large";
  value: number;
  spawnedAt: number;
}

const SIZE_CFG = {
  small:  { px: 38,  value: 15, color: "#ef4444", label: "S" },
  medium: { px: 52,  value: 10, color: "#f97316", label: "M" },
  large:  { px: 68,  value:  5, color: "#eab308", label: "L" },
};

const POP_DURATION = 2200; // ms before a target auto-disappears

export function ClickHuntGame({
  gameId, rewardTokens, duration = 15, onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const [targets,   setTargets]   = useState<TargetItem[]>([]);
  const [score,     setScore]     = useState(0);
  const [combo,     setCombo]     = useState(0);
  const [misses,    setMisses]    = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(duration);
  const [pops,      setPops]      = useState<{ id: string; x: number; y: number; text: string }[]>([]);
  const [done,      setDone]      = useState(false);

  const comboRef    = useRef(0);
  const comboTimer  = useRef<NodeJS.Timeout | null>(null);
  const spawnTimer  = useRef<NodeJS.Timeout | null>(null);
  const popTimers   = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // ── spawn logic ─────────────────────────────────────────────────────────────
  const spawnTarget = useCallback(() => {
    const rand = Math.random();
    const size: TargetItem["size"] = rand < 0.25 ? "small" : rand < 0.6 ? "medium" : "large";
    const cfg  = SIZE_CFG[size];
    const id   = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const newTarget: TargetItem = {
      id, size,
      value: cfg.value,
      x: 8 + Math.random() * 82,
      y: 16 + Math.random() * 68,
      spawnedAt: Date.now(),
    };

    setTargets(prev => [...prev.slice(-9), newTarget]); // max 10 on screen

    // auto-remove if not clicked
    const t = setTimeout(() => {
      setTargets(prev => {
        const still = prev.find(p => p.id === id);
        if (still) setMisses(m => m + 1);
        return prev.filter(p => p.id !== id);
      });
      if (comboRef.current > 0) {
        comboRef.current = 0;
        setCombo(0);
      }
    }, POP_DURATION);
    popTimers.current.set(id, t);
  }, []);

  const scheduleSpawn = useCallback(() => {
    const elapsed  = duration - timeLeft;
    const interval = Math.max(350, 900 - elapsed * 28); // speed up over time
    spawnTimer.current = setTimeout(() => {
      spawnTarget();
      scheduleSpawn();
    }, interval);
  }, [duration, timeLeft, spawnTarget]);

  // ── timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // ── spawn scheduler ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (done) return;
    scheduleSpawn();
    return () => { if (spawnTimer.current) clearTimeout(spawnTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // ── game over ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!done) return;
    popTimers.current.forEach(t => clearTimeout(t));
    popTimers.current.clear();
    setTargets([]);

    const accuracy  = score > 0 ? Math.min(100, (score / (score + misses * 5)) * 100) : 0;
    const base      = rewardTokens;
    const multiplier = Math.min(2, 0.5 + score / 60 + accuracy / 200);
    const bonus     = comboRef.current >= 10 ? 5 : comboRef.current >= 5 ? 2 : 0;
    const final     = Math.max(1, Math.round(base * multiplier) + bonus);

    setTimeout(() => onComplete(final, score), 1400);
  }, [done]);

  // ── click handler ────────────────────────────────────────────────────────────
  const handleClick = (target: TargetItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (done) return;

    const t = popTimers.current.get(target.id);
    if (t) { clearTimeout(t); popTimers.current.delete(target.id); }
    setTargets(prev => prev.filter(p => p.id !== target.id));

    comboRef.current += 1;
    setCombo(comboRef.current);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => { comboRef.current = 0; setCombo(0); }, 1500);

    const comboBonus = comboRef.current >= 3 ? Math.floor(target.value * 0.5 * (comboRef.current - 2)) : 0;
    const pts = target.value + comboBonus;
    setScore(prev => prev + pts);

    // pop text
    const popId = `pop-${Date.now()}`;
    const rect  = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const areaRect = gameAreaRef.current?.getBoundingClientRect();
    if (areaRect) {
      const px = ((rect.left + rect.width / 2 - areaRect.left) / areaRect.width)  * 100;
      const py = ((rect.top  + rect.height / 2 - areaRect.top)  / areaRect.height) * 100;
      setPops(prev => [...prev, { id: popId, x: px, y: py, text: `+${pts}${comboRef.current >= 3 ? ` 🔥${comboRef.current}x` : ""}` }]);
      setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 700);
    }
  };

  const urgentColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f97316" : "#60a5fa";

  return (
    <div
      ref={gameAreaRef}
      className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ height: 260, background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f2d4a 100%)", cursor: "crosshair" }}
    >
      {/* Stats bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>
            <Target className="w-3.5 h-3.5 text-red-400" />{score}
          </div>
          {combo >= 2 && (
            <div className="flex items-center gap-1 text-xs font-black" style={{ color: "#f59e0b" }}>
              <Zap className="w-3 h-3" />{combo}x
            </div>
          )}
        </div>
        <div className="text-white font-black text-lg tabular-nums" style={{ color: urgentColor, letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Targets */}
      <AnimatePresence>
        {targets.map(t => {
          const cfg = SIZE_CFG[t.size];
          return (
            <motion.button
              key={t.id}
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0,   opacity: 1 }}
              exit={{   scale: 0, rotate:  90,   opacity: 0 }}
              transition={{ type: "spring", damping: 14, stiffness: 280 }}
              onClick={e => handleClick(t, e)}
              className="absolute flex items-center justify-center rounded-full"
              style={{
                left: `${t.x}%`, top: `${t.y}%`,
                width: cfg.px, height: cfg.px,
                transform: "translate(-50%,-50%)",
                background: `radial-gradient(circle at 35% 35%, ${cfg.color}dd, ${cfg.color}88)`,
                boxShadow: `0 0 18px ${cfg.color}60, 0 4px 12px rgba(0,0,0,0.4)`,
                border: `1.5px solid ${cfg.color}aa`,
              }}
            >
              {/* Inner rings */}
              <div className="absolute rounded-full" style={{ width: cfg.px * 0.65, height: cfg.px * 0.65, border: `1.5px solid rgba(255,255,255,0.25)` }} />
              <div className="absolute rounded-full" style={{ width: cfg.px * 0.3,  height: cfg.px * 0.3,  background: "rgba(255,255,255,0.35)" }} />
              {/* Value label */}
              <span className="absolute font-black text-white pointer-events-none"
                style={{ bottom: "calc(100% + 3px)", left: "50%", transform: "translateX(-50%)", fontSize: 10, textShadow: "0 1px 4px #000" }}>
                +{t.value}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Score pops */}
      {pops.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -40, scale: 1.1 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="absolute pointer-events-none font-black text-xs"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", color: "#fbbf24", textShadow: "0 2px 8px #000", zIndex: 20, whiteSpace: "nowrap" }}
        >
          {p.text}
        </motion.div>
      ))}

      {/* Game over overlay */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {misses} missed · best combo {comboRef.current}x
          </p>
        </motion.div>
      )}

      {/* Flash badge */}
      {isFlash && (
        <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
          style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
          2× Flash
        </div>
      )}
    </div>
  );
}




// // =============================================================================
// // GAME 1: CLICK HUNT — Fully Playable
// // components/(gamification)/(games)/click-hunt-game.tsx
// // =============================================================================
// "use client";

// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import type { GameProps } from "./game-types";
// import { Target, Trophy, Zap } from "lucide-react";

// interface TargetItem {
//   id: string;
//   x: number; // percent
//   y: number; // percent
//   size: "small" | "medium" | "large";
//   value: number;
//   spawnedAt: number;
// }

// const SIZE_CFG = {
//   small:  { px: 38,  value: 15, color: "#ef4444", label: "S" },
//   medium: { px: 52,  value: 10, color: "#f97316", label: "M" },
//   large:  { px: 68,  value:  5, color: "#eab308", label: "L" },
// };

// const POP_DURATION = 2200; // ms before a target auto-disappears

// export function ClickHuntGame({
//   gameId, rewardTokens, duration = 15, onComplete, soundEnabled = true, isFlash = false,
// }: GameProps) {
//   const [targets,   setTargets]   = useState<TargetItem[]>([]);
//   const [score,     setScore]     = useState(0);
//   const [combo,     setCombo]     = useState(0);
//   const [misses,    setMisses]    = useState(0);
//   const [timeLeft,  setTimeLeft]  = useState(duration);
//   const [pops,      setPops]      = useState<{ id: string; x: number; y: number; text: string }[]>([]);
//   const [done,      setDone]      = useState(false);

//   const comboRef    = useRef(0);
//   const comboTimer  = useRef<NodeJS.Timeout | null>(null);
//   const spawnTimer  = useRef<NodeJS.Timeout | null>(null);
//   const popTimers   = useRef<Map<string, NodeJS.Timeout>>(new Map());
//   const gameAreaRef = useRef<HTMLDivElement>(null);

//   // ── spawn logic ─────────────────────────────────────────────────────────────
//   const spawnTarget = useCallback(() => {
//     const rand = Math.random();
//     const size: TargetItem["size"] = rand < 0.25 ? "small" : rand < 0.6 ? "medium" : "large";
//     const cfg  = SIZE_CFG[size];
//     const id   = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;

//     const newTarget: TargetItem = {
//       id, size,
//       value: cfg.value,
//       x: 8 + Math.random() * 82,
//       y: 16 + Math.random() * 68,
//       spawnedAt: Date.now(),
//     };

//     setTargets(prev => [...prev.slice(-9), newTarget]); // max 10 on screen

//     // auto-remove if not clicked
//     const t = setTimeout(() => {
//       setTargets(prev => {
//         const still = prev.find(p => p.id === id);
//         if (still) setMisses(m => m + 1);
//         return prev.filter(p => p.id !== id);
//       });
//       if (comboRef.current > 0) {
//         comboRef.current = 0;
//         setCombo(0);
//       }
//     }, POP_DURATION);
//     popTimers.current.set(id, t);
//   }, []);

//   const scheduleSpawn = useCallback(() => {
//     const elapsed  = duration - timeLeft;
//     const interval = Math.max(350, 900 - elapsed * 28); // speed up over time
//     spawnTimer.current = setTimeout(() => {
//       spawnTarget();
//       scheduleSpawn();
//     }, interval);
//   }, [duration, timeLeft, spawnTarget]);

//   // ── timer ───────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const t = setInterval(() => {
//       setTimeLeft(prev => {
//         if (prev <= 1) { clearInterval(t); setDone(true); return 0; }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(t);
//   }, []);

//   // ── spawn scheduler ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (done) return;
//     scheduleSpawn();
//     return () => { if (spawnTimer.current) clearTimeout(spawnTimer.current); };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [done]);

//   // ── game over ────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!done) return;
//     popTimers.current.forEach(t => clearTimeout(t));
//     popTimers.current.clear();
//     setTargets([]);

//     const accuracy  = score > 0 ? Math.min(100, (score / (score + misses * 5)) * 100) : 0;
//     const base      = rewardTokens;
//     const multiplier = Math.min(2, 0.5 + score / 60 + accuracy / 200);
//     const bonus     = comboRef.current >= 10 ? 5 : comboRef.current >= 5 ? 2 : 0;
//     const final     = Math.max(1, Math.round(base * multiplier) + bonus);

//     setTimeout(() => onComplete(final, score), 1400);
//   }, [done]);

//   // ── click handler ────────────────────────────────────────────────────────────
//   const handleClick = (target: TargetItem, e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (done) return;

//     const t = popTimers.current.get(target.id);
//     if (t) { clearTimeout(t); popTimers.current.delete(target.id); }
//     setTargets(prev => prev.filter(p => p.id !== target.id));

//     comboRef.current += 1;
//     setCombo(comboRef.current);
//     if (comboTimer.current) clearTimeout(comboTimer.current);
//     comboTimer.current = setTimeout(() => { comboRef.current = 0; setCombo(0); }, 1500);

//     const comboBonus = comboRef.current >= 3 ? Math.floor(target.value * 0.5 * (comboRef.current - 2)) : 0;
//     const pts = target.value + comboBonus;
//     setScore(prev => prev + pts);

//     // pop text
//     const popId = `pop-${Date.now()}`;
//     const rect  = (e.currentTarget as HTMLElement).getBoundingClientRect();
//     const areaRect = gameAreaRef.current?.getBoundingClientRect();
//     if (areaRect) {
//       const px = ((rect.left + rect.width / 2 - areaRect.left) / areaRect.width)  * 100;
//       const py = ((rect.top  + rect.height / 2 - areaRect.top)  / areaRect.height) * 100;
//       setPops(prev => [...prev, { id: popId, x: px, y: py, text: `+${pts}${comboRef.current >= 3 ? ` 🔥${comboRef.current}x` : ""}` }]);
//       setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 700);
//     }
//   };

//   const urgentColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f97316" : "#60a5fa";

//   return (
//     <div
//       ref={gameAreaRef}
//       className="relative w-full rounded-xs overflow-hidden select-none"
//       style={{ height: 260, background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f2d4a 100%)", cursor: "crosshair" }}
//     >
//       {/* Stats bar */}
//       <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10"
//         style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
//         <div className="flex items-center gap-3">
//           <div className="flex items-center gap-1 text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>
//             <Target className="w-3.5 h-3.5 text-red-400" />{score}
//           </div>
//           {combo >= 2 && (
//             <div className="flex items-center gap-1 text-xs font-black" style={{ color: "#f59e0b" }}>
//               <Zap className="w-3 h-3" />{combo}x
//             </div>
//           )}
//         </div>
//         <div className="text-white font-black text-lg tabular-nums" style={{ color: urgentColor, letterSpacing: "-0.03em" }}>
//           {timeLeft}s
//         </div>
//       </div>

//       {/* Targets */}
//       <AnimatePresence>
//         {targets.map(t => {
//           const cfg = SIZE_CFG[t.size];
//           return (
//             <motion.button
//               key={t.id}
//               initial={{ scale: 0, rotate: -90, opacity: 0 }}
//               animate={{ scale: 1, rotate: 0,   opacity: 1 }}
//               exit={{   scale: 0, rotate:  90,   opacity: 0 }}
//               transition={{ type: "spring", damping: 14, stiffness: 280 }}
//               onClick={e => handleClick(t, e)}
//               className="absolute flex items-center justify-center rounded-full"
//               style={{
//                 left: `${t.x}%`, top: `${t.y}%`,
//                 width: cfg.px, height: cfg.px,
//                 transform: "translate(-50%,-50%)",
//                 background: `radial-gradient(circle at 35% 35%, ${cfg.color}dd, ${cfg.color}88)`,
//                 boxShadow: `0 0 18px ${cfg.color}60, 0 4px 12px rgba(0,0,0,0.4)`,
//                 border: `1.5px solid ${cfg.color}aa`,
//               }}
//             >
//               {/* Inner rings */}
//               <div className="absolute rounded-full" style={{ width: cfg.px * 0.65, height: cfg.px * 0.65, border: `1.5px solid rgba(255,255,255,0.25)` }} />
//               <div className="absolute rounded-full" style={{ width: cfg.px * 0.3,  height: cfg.px * 0.3,  background: "rgba(255,255,255,0.35)" }} />
//               {/* Value label */}
//               <span className="absolute font-black text-white pointer-events-none"
//                 style={{ bottom: "calc(100% + 3px)", left: "50%", transform: "translateX(-50%)", fontSize: 10, textShadow: "0 1px 4px #000" }}>
//                 +{t.value}
//               </span>
//             </motion.button>
//           );
//         })}
//       </AnimatePresence>

//       {/* Score pops */}
//       {pops.map(p => (
//         <motion.div
//           key={p.id}
//           initial={{ opacity: 1, y: 0, scale: 1 }}
//           animate={{ opacity: 0, y: -40, scale: 1.1 }}
//           transition={{ duration: 0.65, ease: "easeOut" }}
//           className="absolute pointer-events-none font-black text-xs"
//           style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", color: "#fbbf24", textShadow: "0 2px 8px #000", zIndex: 20, whiteSpace: "nowrap" }}
//         >
//           {p.text}
//         </motion.div>
//       ))}

//       {/* Game over overlay */}
//       {done && (
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//           className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
//           style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
//           <Trophy className="w-10 h-10 text-amber-400" />
//           <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
//           <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
//             {misses} missed · best combo {comboRef.current}x
//           </p>
//         </motion.div>
//       )}

//       {/* Flash badge */}
//       {isFlash && (
//         <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
//           style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
//           2× Flash
//         </div>
//       )}
//     </div>
//   );
// }