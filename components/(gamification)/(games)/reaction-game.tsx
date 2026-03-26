// =============================================================================
// GAME 4: REACTION TEST — Multi-round reaction time challenge
// components/(gamification)/(games)/reaction-game.tsx
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, AlertCircle, Timer } from "lucide-react";
import type { GameProps } from "./game-types";

type Phase = "idle" | "waiting" | "ready" | "tooEarly" | "result" | "done";

const MAX_ROUNDS = 5;

function gradeTime(ms: number): { label: string; color: string; pts: number } {
  if (ms < 180) return { label: "GODLIKE ⚡",  color: "#f59e0b", pts: 50 };
  if (ms < 250) return { label: "INSANE 🔥",   color: "#ef4444", pts: 40 };
  if (ms < 350) return { label: "FAST 💨",      color: "#10b981", pts: 30 };
  if (ms < 500) return { label: "GOOD 👍",      color: "#3b82f6", pts: 20 };
  if (ms < 750) return { label: "OKAY 😊",      color: "#94a3b8", pts: 12 };
  return              { label: "SLOW 🐢",        color: "#64748b", pts: 5  };
}

export function ReactionGame({
  gameId, rewardTokens, duration = 5, onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const [phase,        setPhase]        = useState<Phase>("idle");
  const [round,        setRound]        = useState(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [best,         setBest]         = useState<number | null>(null);
  const [totalScore,   setTotalScore]   = useState(0);
  const [roundResults, setRoundResults] = useState<number[]>([]);
  const [timeLeft,     setTimeLeft]     = useState(duration);

  const startRef  = useRef<number | null>(null);
  const delayRef  = useRef<NodeJS.Timeout | null>(null);
  const timerRef  = useRef<NodeJS.Timeout | null>(null);

  // Overall game timer
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); setPhase("done"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Kick off first round
  useEffect(() => {
    if (phase === "idle") startRound();
  }, []);

  // Game over
  useEffect(() => {
    if (phase !== "done") return;
    if (delayRef.current)  clearTimeout(delayRef.current);
    if (timerRef.current)  clearTimeout(timerRef.current);

    const accuracy  = roundResults.length > 0 ? totalScore / (roundResults.length * 50) : 0;
    const base      = rewardTokens;
    const bonus     = best && best < 200 ? 15 : best && best < 350 ? 8 : 0;
    const final     = Math.max(1, Math.round(base * (0.4 + accuracy * 1.6)) + bonus);
    setTimeout(() => onComplete(final, totalScore), 1400);
  }, [phase]);

  const startRound = useCallback(() => {
    setPhase("waiting");
    setReactionTime(null);
    const delay = 1200 + Math.random() * 3000; // 1.2–4.2s
    delayRef.current = setTimeout(() => {
      setPhase("ready");
      startRef.current = Date.now();
    }, delay);
  }, []);

  const handleClick = () => {
    if (phase === "waiting") {
      // Too early
      if (delayRef.current) clearTimeout(delayRef.current);
      setPhase("tooEarly");
      setTimeout(() => {
        if (round < MAX_ROUNDS - 1) { setRound(r => r + 1); startRound(); }
        else setPhase("done");
      }, 1000);
      return;
    }

    if (phase === "ready" && startRef.current) {
      const ms = Date.now() - startRef.current;
      setReactionTime(ms);
      setPhase("result");
      setRoundResults(prev => [...prev, ms]);
      setBest(prev => prev === null ? ms : Math.min(prev, ms));

      const { pts } = gradeTime(ms);
      setTotalScore(prev => prev + pts);

      timerRef.current = setTimeout(() => {
        if (round < MAX_ROUNDS - 1) { setRound(r => r + 1); startRound(); }
        else setPhase("done");
      }, 1400);
    }
  };

  const grade = reactionTime !== null ? gradeTime(reactionTime) : null;

  const bgColor =
    phase === "ready"    ? "#15803d" :
    phase === "waiting"  ? "#7f1d1d" :
    phase === "tooEarly" ? "#1d1d7f" : "#111827";

  return (
    <div
      onClick={handleClick}
      className="relative w-full rounded-xs overflow-hidden select-none cursor-pointer"
      style={{ height: 260, background: bgColor, transition: "background 0.15s" }}
    >
      {/* Stats bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />{totalScore}
          </div>
          {best && (
            <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
              best {best}ms
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Round pips */}
          <div className="flex gap-1">
            {Array.from({ length: MAX_ROUNDS }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i < round ? "#10b981" : i === round ? "#f59e0b" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
          <div className="text-white font-black text-lg tabular-nums" style={{ letterSpacing: "-0.03em", color: timeLeft <= 3 ? "#ef4444" : "#fff" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <AnimatePresence mode="wait">
          {phase === "waiting" && (
            <motion.div key="wait" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.2)", border: "2px solid rgba(239,68,68,0.4)" }}>
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <p className="text-white font-black text-xl" style={{ letterSpacing: "-0.02em" }}>WAIT...</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Click when it turns green</p>
            </motion.div>
          )}

          {phase === "ready" && (
            <motion.div key="go"
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 400 }}
              className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.3)", border: "3px solid #10b981", boxShadow: "0 0 40px rgba(16,185,129,0.5)" }}>
                <Zap className="w-12 h-12 text-emerald-400" />
              </motion.div>
              <p className="text-white font-black text-2xl" style={{ letterSpacing: "-0.03em", textShadow: "0 0 20px rgba(16,185,129,0.6)" }}>
                CLICK NOW!
              </p>
            </motion.div>
          )}

          {phase === "tooEarly" && (
            <motion.div key="early" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2">
              <p className="text-4xl font-black" style={{ color: "#60a5fa" }}>Too early!</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Wait for green next time</p>
            </motion.div>
          )}

          {phase === "result" && grade && reactionTime !== null && (
            <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 16 }}
              className="flex flex-col items-center gap-2 text-center">
              <p className="text-5xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{reactionTime}<span className="text-2xl">ms</span></p>
              <p className="text-xl font-black" style={{ color: grade.color }}>{grade.label}</p>
              <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>+{grade.pts} pts</p>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2">
              <Trophy className="w-10 h-10 text-amber-400" />
              <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{totalScore} pts</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Best: {best}ms · {roundResults.length} rounds</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click anywhere hint */}
      {(phase === "waiting" || phase === "ready") && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-medium"
          style={{ color: "rgba(255,255,255,0.2)" }}>
          Click anywhere on this area
        </div>
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





// // =============================================================================
// // GAME 4: REACTION TEST — Multi-round reaction time challenge
// // components/(gamification)/(games)/reaction-game.tsx
// // =============================================================================
// "use client";

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Zap, Trophy, AlertCircle, Timer } from "lucide-react";
// import type { GameProps } from "./game-types";

// type Phase = "idle" | "waiting" | "ready" | "tooEarly" | "result" | "done";

// const MAX_ROUNDS = 5;

// function gradeTime(ms: number): { label: string; color: string; pts: number } {
//   if (ms < 180) return { label: "GODLIKE ⚡",  color: "#f59e0b", pts: 50 };
//   if (ms < 250) return { label: "INSANE 🔥",   color: "#ef4444", pts: 40 };
//   if (ms < 350) return { label: "FAST 💨",      color: "#10b981", pts: 30 };
//   if (ms < 500) return { label: "GOOD 👍",      color: "#3b82f6", pts: 20 };
//   if (ms < 750) return { label: "OKAY 😊",      color: "#94a3b8", pts: 12 };
//   return              { label: "SLOW 🐢",        color: "#64748b", pts: 5  };
// }

// export function ReactionGame({
//   gameId, rewardTokens, duration = 5, onComplete, soundEnabled = true, isFlash = false,
// }: GameProps) {
//   const [phase,        setPhase]        = useState<Phase>("idle");
//   const [round,        setRound]        = useState(0);
//   const [reactionTime, setReactionTime] = useState<number | null>(null);
//   const [best,         setBest]         = useState<number | null>(null);
//   const [totalScore,   setTotalScore]   = useState(0);
//   const [roundResults, setRoundResults] = useState<number[]>([]);
//   const [timeLeft,     setTimeLeft]     = useState(duration);

//   const startRef  = useRef<number | null>(null);
//   const delayRef  = useRef<NodeJS.Timeout | null>(null);
//   const timerRef  = useRef<NodeJS.Timeout | null>(null);

//   // Overall game timer
//   useEffect(() => {
//     const t = setInterval(() => {
//       setTimeLeft(prev => {
//         if (prev <= 1) { clearInterval(t); setPhase("done"); return 0; }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(t);
//   }, []);

//   // Kick off first round
//   useEffect(() => {
//     if (phase === "idle") startRound();
//   }, []);

//   // Game over
//   useEffect(() => {
//     if (phase !== "done") return;
//     if (delayRef.current)  clearTimeout(delayRef.current);
//     if (timerRef.current)  clearTimeout(timerRef.current);

//     const accuracy  = roundResults.length > 0 ? totalScore / (roundResults.length * 50) : 0;
//     const base      = rewardTokens;
//     const bonus     = best && best < 200 ? 15 : best && best < 350 ? 8 : 0;
//     const final     = Math.max(1, Math.round(base * (0.4 + accuracy * 1.6)) + bonus);
//     setTimeout(() => onComplete(final, totalScore), 1400);
//   }, [phase]);

//   const startRound = useCallback(() => {
//     setPhase("waiting");
//     setReactionTime(null);
//     const delay = 1200 + Math.random() * 3000; // 1.2–4.2s
//     delayRef.current = setTimeout(() => {
//       setPhase("ready");
//       startRef.current = Date.now();
//     }, delay);
//   }, []);

//   const handleClick = () => {
//     if (phase === "waiting") {
//       // Too early
//       if (delayRef.current) clearTimeout(delayRef.current);
//       setPhase("tooEarly");
//       setTimeout(() => {
//         if (round < MAX_ROUNDS - 1) { setRound(r => r + 1); startRound(); }
//         else setPhase("done");
//       }, 1000);
//       return;
//     }

//     if (phase === "ready" && startRef.current) {
//       const ms = Date.now() - startRef.current;
//       setReactionTime(ms);
//       setPhase("result");
//       setRoundResults(prev => [...prev, ms]);
//       setBest(prev => prev === null ? ms : Math.min(prev, ms));

//       const { pts } = gradeTime(ms);
//       setTotalScore(prev => prev + pts);

//       timerRef.current = setTimeout(() => {
//         if (round < MAX_ROUNDS - 1) { setRound(r => r + 1); startRound(); }
//         else setPhase("done");
//       }, 1400);
//     }
//   };

//   const grade = reactionTime !== null ? gradeTime(reactionTime) : null;

//   const bgColor =
//     phase === "ready"    ? "#15803d" :
//     phase === "waiting"  ? "#7f1d1d" :
//     phase === "tooEarly" ? "#1d1d7f" : "#111827";

//   return (
//     <div
//       onClick={handleClick}
//       className="relative w-full rounded-xs overflow-hidden select-none cursor-pointer"
//       style={{ height: 260, background: bgColor, transition: "background 0.15s" }}
//     >
//       {/* Stats bar */}
//       <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10"
//         style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
//         <div className="flex items-center gap-3">
//           <div className="flex items-center gap-1 text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>
//             <Trophy className="w-3.5 h-3.5 text-amber-400" />{totalScore}
//           </div>
//           {best && (
//             <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
//               best {best}ms
//             </div>
//           )}
//         </div>
//         <div className="flex items-center gap-2">
//           {/* Round pips */}
//           <div className="flex gap-1">
//             {Array.from({ length: MAX_ROUNDS }).map((_, i) => (
//               <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
//                 style={{ background: i < round ? "#10b981" : i === round ? "#f59e0b" : "rgba(255,255,255,0.2)" }} />
//             ))}
//           </div>
//           <div className="text-white font-black text-lg tabular-nums" style={{ letterSpacing: "-0.03em", color: timeLeft <= 3 ? "#ef4444" : "#fff" }}>
//             {timeLeft}s
//           </div>
//         </div>
//       </div>

//       {/* Main content */}
//       <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
//         <AnimatePresence mode="wait">
//           {phase === "waiting" && (
//             <motion.div key="wait" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
//               className="flex flex-col items-center gap-3 text-center">
//               <div className="w-20 h-20 rounded-full flex items-center justify-center"
//                 style={{ background: "rgba(239,68,68,0.2)", border: "2px solid rgba(239,68,68,0.4)" }}>
//                 <AlertCircle className="w-10 h-10 text-red-400" />
//               </div>
//               <p className="text-white font-black text-xl" style={{ letterSpacing: "-0.02em" }}>WAIT...</p>
//               <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Click when it turns green</p>
//             </motion.div>
//           )}

//           {phase === "ready" && (
//             <motion.div key="go"
//               initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//               transition={{ type: "spring", damping: 10, stiffness: 400 }}
//               className="flex flex-col items-center gap-3">
//               <motion.div
//                 animate={{ scale: [1, 1.08, 1] }}
//                 transition={{ repeat: Infinity, duration: 0.6 }}
//                 className="w-24 h-24 rounded-full flex items-center justify-center"
//                 style={{ background: "rgba(16,185,129,0.3)", border: "3px solid #10b981", boxShadow: "0 0 40px rgba(16,185,129,0.5)" }}>
//                 <Zap className="w-12 h-12 text-emerald-400" />
//               </motion.div>
//               <p className="text-white font-black text-2xl" style={{ letterSpacing: "-0.03em", textShadow: "0 0 20px rgba(16,185,129,0.6)" }}>
//                 CLICK NOW!
//               </p>
//             </motion.div>
//           )}

//           {phase === "tooEarly" && (
//             <motion.div key="early" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//               className="flex flex-col items-center gap-2">
//               <p className="text-4xl font-black" style={{ color: "#60a5fa" }}>Too early!</p>
//               <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Wait for green next time</p>
//             </motion.div>
//           )}

//           {phase === "result" && grade && reactionTime !== null && (
//             <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//               transition={{ type: "spring", damping: 16 }}
//               className="flex flex-col items-center gap-2 text-center">
//               <p className="text-5xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{reactionTime}<span className="text-2xl">ms</span></p>
//               <p className="text-xl font-black" style={{ color: grade.color }}>{grade.label}</p>
//               <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>+{grade.pts} pts</p>
//             </motion.div>
//           )}

//           {phase === "done" && (
//             <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//               className="flex flex-col items-center gap-2">
//               <Trophy className="w-10 h-10 text-amber-400" />
//               <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{totalScore} pts</p>
//               <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Best: {best}ms · {roundResults.length} rounds</p>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* Click anywhere hint */}
//       {(phase === "waiting" || phase === "ready") && (
//         <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-medium"
//           style={{ color: "rgba(255,255,255,0.2)" }}>
//           Click anywhere on this area
//         </div>
//       )}

//       {isFlash && (
//         <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
//           style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
//           2× Flash
//         </div>
//       )}
//     </div>
//   );
// }