// =============================================================================
// GAME 3: MYSTERY BOX — Pick a box, reveal your multiplier
// components/(gamification)/(games)/mystery-box-game.tsx
// =============================================================================
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Star, Diamond, Gem, Sparkles, Trophy } from "lucide-react";
import type { GameProps } from "./game-types";

interface Box {
  id: number;
  multiplier: number;
  label: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  color: string;
  glow: string;
  icon: React.ReactNode;
}

const BOXES: Box[] = [
  { id: 1, multiplier: 0.5,  label: "Better luck next time", rarity: "common",   color: "#64748b", glow: "#64748b", icon: <Gift     className="w-8 h-8" /> },
  { id: 2, multiplier: 1,    label: "Good!",                  rarity: "common",   color: "#22c55e", glow: "#22c55e", icon: <Star     className="w-8 h-8" /> },
  { id: 3, multiplier: 1.5,  label: "Nice!",                  rarity: "rare",     color: "#3b82f6", glow: "#3b82f6", icon: <Gem      className="w-8 h-8" /> },
  { id: 4, multiplier: 2.5,  label: "Excellent!",             rarity: "epic",     color: "#8b5cf6", glow: "#8b5cf6", icon: <Diamond  className="w-8 h-8" /> },
  { id: 5, multiplier: 5,    label: "LEGENDARY!",             rarity: "legendary",color: "#f59e0b", glow: "#f59e0b", icon: <Sparkles className="w-8 h-8" /> },
];

// Weighted random — mythic jackpot chance is 3%, legendary 10%, etc.
const WEIGHTS = [30, 30, 22, 15, 3]; // indexes map to BOXES

function pickBox(): Box {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return BOXES[i];
  }
  return BOXES[1];
}

const RARITY_LABEL = {
  common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", mythic: "Mythic",
};

export function MysteryBoxGame({
  gameId, rewardTokens, onComplete, soundEnabled = true, isFlash = false,
}: GameProps) {
  const [phase, setPhase]         = useState<"pick" | "shaking" | "reveal">("pick");
  const [chosen, setChosen]       = useState<number | null>(null);
  const [result, setResult]       = useState<Box | null>(null);
  const [hoveredBox, setHovered]  = useState<number | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);

  const handlePick = (boxId: number) => {
    if (phase !== "pick") return;
    setChosen(boxId);
    setPhase("shaking");

    setTimeout(() => {
      const box = pickBox();
      setResult(box);
      setPhase("reveal");

      // burst particles for epic+
      if (box.rarity === "epic" || box.rarity === "legendary" || box.rarity === "mythic") {
        const pts = Array.from({ length: 20 }, (_, i) => ({
          id: i, x: 50, y: 50, angle: (i / 20) * 360,
        }));
        setParticles(pts);
        setTimeout(() => setParticles([]), 1000);
      }

      const reward = Math.max(1, Math.round(rewardTokens * box.multiplier));
      setTimeout(() => onComplete(reward, Math.round(box.multiplier * 100)), 2200);
    }, 900);
  };

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ height: 260, background: "linear-gradient(135deg,#1e1b4b 0%,#2d1b69 50%,#1a1040 100%)" }}>

      {/* Stars bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: 0.15 + Math.random() * 0.3 }} />
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-2 z-10"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
        {phase === "pick" && (
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
            Choose a box
          </p>
        )}
        {phase === "shaking" && (
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase animate-pulse" style={{ color: "#f59e0b" }}>
            Opening...
          </p>
        )}
        {phase === "reveal" && result && (
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: result.color }}>
            {RARITY_LABEL[result.rarity]}
          </p>
        )}
      </div>

      {/* Boxes */}
      <div className="absolute inset-0 flex items-center justify-center pt-6">
        <AnimatePresence mode="wait">
          {phase !== "reveal" ? (
            <motion.div key="boxes" className="flex items-center gap-3 px-4">
              {BOXES.map((box, i) => {
                const isChosen = chosen === box.id;
                const isHov    = hoveredBox === box.id;
                return (
                  <motion.button
                    key={box.id}
                    animate={isChosen && phase === "shaking"
                      ? { rotate: [-4, 4, -4, 4, -3, 3, 0], scale: [1, 1.08, 1.08, 1.08, 1.08, 1.08, 1] }
                      : { rotate: 0, scale: isHov ? 1.08 : 1 }
                    }
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    onClick={() => handlePick(box.id)}
                    onMouseEnter={() => setHovered(box.id)}
                    onMouseLeave={() => setHovered(null)}
                    disabled={phase !== "pick"}
                    className="flex flex-col items-center gap-1.5"
                    style={{ opacity: phase === "shaking" && !isChosen ? 0.3 : 1, transition: "opacity 0.3s" }}
                  >
                    <div className="flex items-center justify-center rounded-xs"
                      style={{
                        width: 54, height: 54,
                        background: isHov || isChosen
                          ? `radial-gradient(circle at 35% 30%, ${box.color}40, ${box.color}18)`
                          : "rgba(255,255,255,0.06)",
                        border: `1.5px solid ${isHov || isChosen ? box.color : "rgba(255,255,255,0.1)"}`,
                        boxShadow: isHov || isChosen ? `0 0 20px ${box.glow}50` : "none",
                        transition: "all 0.2s",
                        color: isHov || isChosen ? box.color : "rgba(255,255,255,0.35)",
                      }}>
                      {box.icon}
                    </div>
                    <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Box {i + 1}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : result ? (
            <motion.div key="reveal"
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 16, stiffness: 260 }}
              className="flex flex-col items-center gap-3 text-center px-4">

              {/* Particle burst */}
              {particles.map(p => (
                <motion.div key={p.id}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(p.angle * Math.PI / 180) * 80, y: Math.sin(p.angle * Math.PI / 180) * 60, opacity: 0, scale: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute w-2 h-2 rounded-full pointer-events-none"
                  style={{ background: result.color, left: "50%", top: "50%", zIndex: 30 }} />
              ))}

              <motion.div className="flex items-center justify-center rounded-xs"
                animate={{ boxShadow: [`0 0 30px ${result.glow}60`, `0 0 60px ${result.glow}80`, `0 0 30px ${result.glow}60`] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ width: 72, height: 72, background: `radial-gradient(circle at 35% 30%, ${result.color}40, ${result.color}18)`, border: `2px solid ${result.color}80`, color: result.color }}>
                {result.icon}
              </motion.div>

              <div>
                <p className="text-2xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
                  {result.multiplier}× Multiplier
                </p>
                <p className="text-sm mt-0.5 font-bold" style={{ color: result.color }}>{result.label}</p>
              </div>

              <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                +{Math.max(1, Math.round(rewardTokens * result.multiplier))} tokens
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

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
// // GAME 3: MYSTERY BOX — Pick a box, reveal your multiplier
// // components/(gamification)/(games)/mystery-box-game.tsx
// // =============================================================================
// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Gift, Star, Diamond, Gem, Sparkles, Trophy } from "lucide-react";
// import type { GameProps } from "./game-types";

// interface Box {
//   id: number;
//   multiplier: number;
//   label: string;
//   rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
//   color: string;
//   glow: string;
//   icon: React.ReactNode;
// }

// const BOXES: Box[] = [
//   { id: 1, multiplier: 0.5,  label: "Better luck next time", rarity: "common",   color: "#64748b", glow: "#64748b", icon: <Gift     className="w-8 h-8" /> },
//   { id: 2, multiplier: 1,    label: "Good!",                  rarity: "common",   color: "#22c55e", glow: "#22c55e", icon: <Star     className="w-8 h-8" /> },
//   { id: 3, multiplier: 1.5,  label: "Nice!",                  rarity: "rare",     color: "#3b82f6", glow: "#3b82f6", icon: <Gem      className="w-8 h-8" /> },
//   { id: 4, multiplier: 2.5,  label: "Excellent!",             rarity: "epic",     color: "#8b5cf6", glow: "#8b5cf6", icon: <Diamond  className="w-8 h-8" /> },
//   { id: 5, multiplier: 5,    label: "LEGENDARY!",             rarity: "legendary",color: "#f59e0b", glow: "#f59e0b", icon: <Sparkles className="w-8 h-8" /> },
// ];

// // Weighted random — mythic jackpot chance is 3%, legendary 10%, etc.
// const WEIGHTS = [30, 30, 22, 15, 3]; // indexes map to BOXES

// function pickBox(): Box {
//   const total = WEIGHTS.reduce((a, b) => a + b, 0);
//   let r = Math.random() * total;
//   for (let i = 0; i < WEIGHTS.length; i++) {
//     r -= WEIGHTS[i];
//     if (r <= 0) return BOXES[i];
//   }
//   return BOXES[1];
// }

// const RARITY_LABEL = {
//   common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", mythic: "Mythic",
// };

// export function MysteryBoxGame({
//   gameId, rewardTokens, onComplete, soundEnabled = true, isFlash = false,
// }: GameProps) {
//   const [phase, setPhase]         = useState<"pick" | "shaking" | "reveal">("pick");
//   const [chosen, setChosen]       = useState<number | null>(null);
//   const [result, setResult]       = useState<Box | null>(null);
//   const [hoveredBox, setHovered]  = useState<number | null>(null);
//   const [particles, setParticles] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);

//   const handlePick = (boxId: number) => {
//     if (phase !== "pick") return;
//     setChosen(boxId);
//     setPhase("shaking");

//     setTimeout(() => {
//       const box = pickBox();
//       setResult(box);
//       setPhase("reveal");

//       // burst particles for epic+
//       if (box.rarity === "epic" || box.rarity === "legendary" || box.rarity === "mythic") {
//         const pts = Array.from({ length: 20 }, (_, i) => ({
//           id: i, x: 50, y: 50, angle: (i / 20) * 360,
//         }));
//         setParticles(pts);
//         setTimeout(() => setParticles([]), 1000);
//       }

//       const reward = Math.max(1, Math.round(rewardTokens * box.multiplier));
//       setTimeout(() => onComplete(reward, Math.round(box.multiplier * 100)), 2200);
//     }, 900);
//   };

//   return (
//     <div className="relative w-full rounded-xs overflow-hidden select-none"
//       style={{ height: 260, background: "linear-gradient(135deg,#1e1b4b 0%,#2d1b69 50%,#1a1040 100%)" }}>

//       {/* Stars bg */}
//       <div className="absolute inset-0 pointer-events-none overflow-hidden">
//         {[...Array(30)].map((_, i) => (
//           <div key={i} className="absolute rounded-full bg-white"
//             style={{ width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: 0.15 + Math.random() * 0.3 }} />
//         ))}
//       </div>

//       {/* Header */}
//       <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-2 z-10"
//         style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
//         {phase === "pick" && (
//           <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
//             Choose a box
//           </p>
//         )}
//         {phase === "shaking" && (
//           <p className="text-[11px] font-bold tracking-[0.18em] uppercase animate-pulse" style={{ color: "#f59e0b" }}>
//             Opening...
//           </p>
//         )}
//         {phase === "reveal" && result && (
//           <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: result.color }}>
//             {RARITY_LABEL[result.rarity]}
//           </p>
//         )}
//       </div>

//       {/* Boxes */}
//       <div className="absolute inset-0 flex items-center justify-center pt-6">
//         <AnimatePresence mode="wait">
//           {phase !== "reveal" ? (
//             <motion.div key="boxes" className="flex items-center gap-3 px-4">
//               {BOXES.map((box, i) => {
//                 const isChosen = chosen === box.id;
//                 const isHov    = hoveredBox === box.id;
//                 return (
//                   <motion.button
//                     key={box.id}
//                     animate={isChosen && phase === "shaking"
//                       ? { rotate: [-4, 4, -4, 4, -3, 3, 0], scale: [1, 1.08, 1.08, 1.08, 1.08, 1.08, 1] }
//                       : { rotate: 0, scale: isHov ? 1.08 : 1 }
//                     }
//                     transition={{ duration: 0.7, ease: "easeInOut" }}
//                     onClick={() => handlePick(box.id)}
//                     onMouseEnter={() => setHovered(box.id)}
//                     onMouseLeave={() => setHovered(null)}
//                     disabled={phase !== "pick"}
//                     className="flex flex-col items-center gap-1.5"
//                     style={{ opacity: phase === "shaking" && !isChosen ? 0.3 : 1, transition: "opacity 0.3s" }}
//                   >
//                     <div className="flex items-center justify-center rounded-xs"
//                       style={{
//                         width: 54, height: 54,
//                         background: isHov || isChosen
//                           ? `radial-gradient(circle at 35% 30%, ${box.color}40, ${box.color}18)`
//                           : "rgba(255,255,255,0.06)",
//                         border: `1.5px solid ${isHov || isChosen ? box.color : "rgba(255,255,255,0.1)"}`,
//                         boxShadow: isHov || isChosen ? `0 0 20px ${box.glow}50` : "none",
//                         transition: "all 0.2s",
//                         color: isHov || isChosen ? box.color : "rgba(255,255,255,0.35)",
//                       }}>
//                       {box.icon}
//                     </div>
//                     <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
//                       Box {i + 1}
//                     </span>
//                   </motion.button>
//                 );
//               })}
//             </motion.div>
//           ) : result ? (
//             <motion.div key="reveal"
//               initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//               transition={{ type: "spring", damping: 16, stiffness: 260 }}
//               className="flex flex-col items-center gap-3 text-center px-4">

//               {/* Particle burst */}
//               {particles.map(p => (
//                 <motion.div key={p.id}
//                   initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
//                   animate={{ x: Math.cos(p.angle * Math.PI / 180) * 80, y: Math.sin(p.angle * Math.PI / 180) * 60, opacity: 0, scale: 0 }}
//                   transition={{ duration: 0.8, ease: "easeOut" }}
//                   className="absolute w-2 h-2 rounded-full pointer-events-none"
//                   style={{ background: result.color, left: "50%", top: "50%", zIndex: 30 }} />
//               ))}

//               <motion.div className="flex items-center justify-center rounded-xs"
//                 animate={{ boxShadow: [`0 0 30px ${result.glow}60`, `0 0 60px ${result.glow}80`, `0 0 30px ${result.glow}60`] }}
//                 transition={{ repeat: Infinity, duration: 1.5 }}
//                 style={{ width: 72, height: 72, background: `radial-gradient(circle at 35% 30%, ${result.color}40, ${result.color}18)`, border: `2px solid ${result.color}80`, color: result.color }}>
//                 {result.icon}
//               </motion.div>

//               <div>
//                 <p className="text-2xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
//                   {result.multiplier}× Multiplier
//                 </p>
//                 <p className="text-sm mt-0.5 font-bold" style={{ color: result.color }}>{result.label}</p>
//               </div>

//               <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
//                 +{Math.max(1, Math.round(rewardTokens * result.multiplier))} tokens
//               </div>
//             </motion.div>
//           ) : null}
//         </AnimatePresence>
//       </div>

//       {isFlash && (
//         <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
//           style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
//           2× Flash
//         </div>
//       )}
//     </div>
//   );
// }