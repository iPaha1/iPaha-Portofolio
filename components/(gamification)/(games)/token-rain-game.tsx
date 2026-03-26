// =============================================================================
// GAME 2: TOKEN RAIN — Fixed falling physics
// components/(gamification)/(games)/token-rain-game.tsx
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Zap, Timer, Trophy, Gift } from "lucide-react";
import type { GameProps, GameResult } from "./game-types";

interface Token {
  id: string;
  x: number;        // % from left
  value: number;
  type: "gold" | "silver" | "bronze";
  speed: number;    // px per frame
  rotation: number;
  // y is tracked in a ref — NOT in state — so we don't re-render the whole
  // token list every frame. Each token DOM node is moved via direct style mutation.
  yRef: React.MutableRefObject<number>;
  el: HTMLDivElement | null;
}

const TOKEN_CONFIG = {
  gold:   { value: 5, bg: "#f59e0b", border: "#fbbf24", icon: "★", size: 36 },
  silver: { value: 3, bg: "#94a3b8", border: "#cbd5e1", icon: "◆", size: 30 },
  bronze: { value: 1, bg: "#b45309", border: "#d97706", icon: "●", size: 26 },
};

// Base fall speed in px/frame @ 60fps — plenty fast, noticeable
const BASE_SPEED = 3.2;

export function TokenRainGame({
  gameId,
  rewardTokens,
  duration = 10,
  onComplete,
  soundEnabled = true,
  isFlash = false,
}: GameProps) {
  const [score, setScore]               = useState(0);
  const [timeLeft, setTimeLeft]         = useState(duration);
  const [collected, setCollected]       = useState(0);
  const [multiplier, setMultiplier]     = useState(1);
  const [multiplierLeft, setMultiplierLeft] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(true);
  const [combo, setCombo]               = useState(0);

  const fieldRef      = useRef<HTMLDivElement>(null);
  const tokensRef     = useRef<Map<string, { el: HTMLDivElement; y: number; value: number; speed: number }>>(new Map());
  const rafRef        = useRef<number>(0);
  const spawnRef      = useRef<NodeJS.Timeout | null>(null);
  const timerRef      = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef  = useRef(true);
  const scoreRef      = useRef(0);
  const collectedRef  = useRef(0);
  const comboRef      = useRef(0);
  const multiplierRef = useRef(1);
  const fieldHeight   = useRef(384); // h-96

  // Sync refs with state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);

  const playSound = useCallback((type: "collect" | "powerup" | "end") => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio({ collect: "/sounds/coin.mp3", powerup: "/sounds/powerup.mp3", end: "/sounds/gameover.mp3" }[type]);
      audio.volume = type === "powerup" ? 0.7 : 0.4;
      audio.play().catch(() => {});
    } catch {}
  }, [soundEnabled]);

  // ── RAF animation loop — moves tokens by mutating DOM directly ──────────
  const animate = useCallback(() => {
    if (!fieldRef.current) return;
    const fh = fieldRef.current.offsetHeight || 384;
    fieldHeight.current = fh;

    const toRemove: string[] = [];
    tokensRef.current.forEach((token, id) => {
      token.y += token.speed;
      if (token.el) {
        token.el.style.top = token.y + "px";
      }
      // Token fell off bottom — missed
      if (token.y > fh + 10) {
        toRemove.push(id);
        comboRef.current = 0;
        setCombo(0);
      }
    });
    toRemove.forEach(id => {
      const t = tokensRef.current.get(id);
      if (t?.el?.parentNode) t.el.parentNode.removeChild(t.el);
      tokensRef.current.delete(id);
    });

    if (isPlayingRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // ── Spawn a token by creating a real DOM node ───────────────────────────
  const spawnToken = useCallback(() => {
    if (!isPlayingRef.current || !fieldRef.current) return;

    const rand = Math.random();
    const type: "gold" | "silver" | "bronze" = rand < 0.1 ? "gold" : rand < 0.35 ? "silver" : "bronze";
    const cfg  = TOKEN_CONFIG[type];
    const id   = Math.random().toString(36).slice(2);
    const x    = 4 + Math.random() * 88; // %

    // Speed: base + slight random variance + accelerates near end
    const elapsed = duration - (timerRef.current ? (timerRef.current as any)._remaining : duration);
    const speed = BASE_SPEED + Math.random() * 1.2 + (isFlash ? 0.8 : 0);

    const el = document.createElement("div");
    el.style.cssText = `
      position:absolute;
      left:${x}%;
      top:-40px;
      width:${cfg.size}px;
      height:${cfg.size}px;
      border-radius:50%;
      background:${cfg.bg};
      border:2px solid ${cfg.border};
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
      user-select:none;
      font-size:${cfg.size * 0.42}px;
      color:rgba(0,0,0,0.7);
      font-weight:900;
      box-shadow:0 2px 12px rgba(0,0,0,0.4);
      transform:translateX(-50%);
      transition:transform 0.08s;
      z-index:10;
    `;
    el.textContent = cfg.icon;

    // Value label above
    const label = document.createElement("div");
    label.style.cssText = `
      position:absolute;top:-18px;left:50%;transform:translateX(-50%);
      font-size:10px;font-weight:900;color:${cfg.border};
      white-space:nowrap;pointer-events:none;
      text-shadow:0 1px 4px rgba(0,0,0,0.8);
    `;
    label.textContent = `+${cfg.value}`;
    el.appendChild(label);

    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      if (!isPlayingRef.current) return;

      const pts = cfg.value * multiplierRef.current;
      scoreRef.current += pts;
      collectedRef.current += 1;
      comboRef.current += 1;

      setScore(scoreRef.current);
      setCollected(collectedRef.current);
      setCombo(comboRef.current);
      playSound("collect");

      // Random 3× multiplier (8% chance)
      if (Math.random() < 0.08 && multiplierRef.current === 1) {
        multiplierRef.current = 3;
        setMultiplier(3);
        setMultiplierLeft(5);
        playSound("powerup");
      }

      // Pop animation then remove
      el.style.transform = "translateX(-50%) scale(1.4)";
      el.style.opacity = "0";
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 120);
      tokensRef.current.delete(id);
    });

    fieldRef.current.appendChild(el);
    tokensRef.current.set(id, { el, y: -40, value: cfg.value, speed });
  }, [duration, isFlash, playSound]);

  // ── Multiplier countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (multiplierLeft <= 0) return;
    const t = setTimeout(() => {
      setMultiplierLeft(m => {
        const next = m - 1;
        if (next <= 0) { setMultiplier(1); multiplierRef.current = 1; }
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [multiplierLeft]);

  // ── Game timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    let remaining = duration;
    const tick = () => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        cancelAnimationFrame(rafRef.current);
        if (spawnRef.current) clearInterval(spawnRef.current);
        playSound("end");
        setTimeout(() => {
          const finalReward = Math.min(
            Math.floor(rewardTokens * (scoreRef.current / 60 + 0.5)),
            rewardTokens * 2
          );
          onComplete(finalReward, scoreRef.current);
        }, 1600);
      }
    };
    const id = setInterval(tick, 1000);
    (timerRef as any)._remaining = duration;
    return () => clearInterval(id);
  }, [duration, rewardTokens, onComplete, playSound]);

  // ── Start RAF + spawner ──────────────────────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    // Spawn every 320ms — denser rain
    spawnRef.current = setInterval(spawnToken, 320);
    // Spawn a few immediately so the field isn't empty at start
    for (let i = 0; i < 3; i++) setTimeout(spawnToken, i * 80);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      // Clean up orphaned DOM nodes
      tokensRef.current.forEach(t => {
        if (t.el?.parentNode) t.el.parentNode.removeChild(t.el);
      });
      tokensRef.current.clear();
    };
  }, [animate, spawnToken]);

  return (
    <div className="relative w-full h-96 rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(160deg,#0f172a 0%,#1e3a5f 60%,#0f2040 100%)" }}
    >
      {/* Stats */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>{score}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-white/70 text-sm font-bold">{collected}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {multiplier > 1 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-xs animate-pulse"
              style={{ background: "rgba(139,92,246,0.3)", border: "1px solid rgba(139,92,246,0.5)" }}
            >
              <Zap className="w-3 h-3 text-purple-400" />
              <span className="text-purple-300 font-black text-xs">{multiplier}× · {multiplierLeft}s</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white font-mono font-black text-lg" style={{ letterSpacing: "-0.03em" }}>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Token field — tokens are appended here via DOM directly */}
      <div ref={fieldRef} className="absolute inset-0 top-12" />

      {/* Combo flash */}
      {combo >= 4 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <motion.div
            key={combo}
            initial={{ scale: 0.7, opacity: 0, y: 4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-3 py-1 rounded-xs text-xs font-black"
            style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fbbf24" }}
          >
            {combo}× COMBO
          </motion.div>
        </div>
      )}

      {/* Game Over overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          >
            <div className="text-center">
              <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-3" />
              <p className="text-4xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>{score}</p>
              <p className="text-white/50 text-sm">{collected} tokens collected</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isFlash && (
        <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse"
          style={{ background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)", color: "#fbbf24" }}
        >
          ⚡ DOUBLE REWARDS
        </div>
      )}
    </div>
  );
}





// // =============================================================================
// // GAME 2: TOKEN RAIN — Real falling tokens to catch
// // components/(gamification)/(games)/token-rain-game.tsx
// // =============================================================================
// "use client";

// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Coins, Zap, Trophy } from "lucide-react";
// import type { GameProps } from "./game-types";

// interface FallingToken {
//   id: string;
//   x: number;       // % from left
//   startY: number;  // % start (slightly above top)
//   duration: number; // animation duration in seconds
//   type: "gold" | "silver" | "bronze" | "power";
//   value: number;
//   size: number;     // px
// }

// const TOKEN_CFG = {
//   gold:   { value: 8,  color: "#f59e0b", bg: "radial-gradient(circle at 35% 30%, #fde68a, #f59e0b)", size: 40, shadow: "#f59e0b" },
//   silver: { value: 4,  color: "#94a3b8", bg: "radial-gradient(circle at 35% 30%, #e2e8f0, #94a3b8)", size: 34, shadow: "#94a3b8" },
//   bronze: { value: 2,  color: "#c27803", bg: "radial-gradient(circle at 35% 30%, #fcd34d, #c27803)", size: 28, shadow: "#c27803" },
//   power:  { value: 0,  color: "#8b5cf6", bg: "radial-gradient(circle at 35% 30%, #c4b5fd, #8b5cf6)", size: 38, shadow: "#8b5cf6" },
// };

// const SYMBOLS = { gold: "⭐", silver: "💎", bronze: "🪙", power: "⚡" };

// export function TokenRainGame({
//   gameId, rewardTokens, duration = 12, onComplete, soundEnabled = true, isFlash = false,
// }: GameProps) {
//   const [tokens,     setTokens]     = useState<FallingToken[]>([]);
//   const [score,      setScore]      = useState(0);
//   const [caught,     setCaught]     = useState(0);
//   const [multiplier, setMultiplier] = useState(1);
//   const [multTimer,  setMultTimer]  = useState<NodeJS.Timeout | null>(null);
//   const [multLeft,   setMultLeft]   = useState(0);
//   const [timeLeft,   setTimeLeft]   = useState(duration);
//   const [done,       setDone]       = useState(false);
//   const [pops,       setPops]       = useState<{ id: string; x: number; y: number; text: string }[]>([]);
//   const [combo,      setCombo]      = useState(0);

//   const multiplierRef = useRef(1);
//   const comboRef      = useRef(0);
//   const comboTimer    = useRef<NodeJS.Timeout | null>(null);
//   const spawnRef      = useRef<NodeJS.Timeout | null>(null);
//   const gameAreaRef   = useRef<HTMLDivElement>(null);

//   const spawnToken = useCallback(() => {
//     const rand = Math.random();
//     const type: FallingToken["type"] =
//       rand < 0.06 ? "power" :
//       rand < 0.18 ? "gold"  :
//       rand < 0.45 ? "silver" : "bronze";

//     const cfg = TOKEN_CFG[type];
//     const id  = `tok-${Date.now()}-${Math.random().toString(36).slice(2)}`;
//     const fallDuration = 1.8 + Math.random() * 1.4; // 1.8–3.2s fall

//     setTokens(prev => [...prev.slice(-14), {
//       id, type, value: cfg.value, size: cfg.size,
//       x: 5 + Math.random() * 90,
//       startY: -8,
//       duration: fallDuration,
//     }]);

//     // auto-remove after animation ends
//     setTimeout(() => setTokens(prev => prev.filter(t => t.id !== id)), fallDuration * 1000 + 200);
//   }, []);

//   // spawn scheduler
//   useEffect(() => {
//     if (done) return;
//     const interval = Math.max(220, 600 - (duration - timeLeft) * 22);
//     spawnRef.current = setTimeout(() => spawnToken(), interval);
//     return () => { if (spawnRef.current) clearTimeout(spawnRef.current); };
//   }, [done, timeLeft, spawnToken, duration]);

//   // game timer
//   useEffect(() => {
//     const t = setInterval(() => {
//       setTimeLeft(prev => {
//         if (prev <= 1) { clearInterval(t); setDone(true); return 0; }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(t);
//   }, []);

//   // multiplier countdown display
//   useEffect(() => {
//     if (multiplierRef.current <= 1) return;
//     const t = setInterval(() => setMultLeft(prev => {
//       if (prev <= 1) { clearInterval(t); return 0; }
//       return prev - 0.1;
//     }), 100);
//     return () => clearInterval(t);
//   }, [multiplier]);

//   // game over
//   useEffect(() => {
//     if (!done) return;
//     setTokens([]);
//     const base     = rewardTokens;
//     const rate     = Math.min(1, caught / (duration * 0.8));
//     const final    = Math.max(1, Math.round(base * (0.5 + rate * 1.5)));
//     setTimeout(() => onComplete(final, score), 1400);
//   }, [done]);

//   const handleCatch = (token: FallingToken, e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (done) return;
//     setTokens(prev => prev.filter(t => t.id !== token.id));

//     if (token.type === "power") {
//       // 3× multiplier for 5 seconds
//       const newMult = 3;
//       multiplierRef.current = newMult;
//       setMultiplier(newMult);
//       setMultLeft(5);
//       if (multTimer) clearTimeout(multTimer);
//       const mt = setTimeout(() => { multiplierRef.current = 1; setMultiplier(1); setMultLeft(0); }, 5000);
//       setMultTimer(mt);
//       const popId = `pop-${Date.now()}`;
//       setPops(prev => [...prev, { id: popId, x: token.x, y: 50, text: "3× MULTIPLIER!" }]);
//       setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 900);
//       return;
//     }

//     comboRef.current += 1;
//     setCombo(comboRef.current);
//     if (comboTimer.current) clearTimeout(comboTimer.current);
//     comboTimer.current = setTimeout(() => { comboRef.current = 0; setCombo(0); }, 1200);

//     const pts = token.value * multiplierRef.current + (comboRef.current >= 4 ? 2 : 0);
//     setScore(prev => prev + pts);
//     setCaught(prev => prev + 1);

//     const popId = `pop-${Date.now()}`;
//     setPops(prev => [...prev, { id: popId, x: token.x, y: 50, text: `+${pts}${multiplierRef.current > 1 ? ` ×${multiplierRef.current}` : ""}` }]);
//     setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 600);
//   };

//   return (
//     <div ref={gameAreaRef}
//       className="relative w-full rounded-xs overflow-hidden select-none"
//       style={{ height: 260, background: "linear-gradient(180deg,#0c1445 0%,#1e3a5f 60%,#0f2d4a 100%)", cursor: "pointer" }}
//     >
//       {/* Rain streaks background */}
//       <div className="absolute inset-0 pointer-events-none overflow-hidden">
//         {[...Array(8)].map((_, i) => (
//           <div key={i} className="absolute top-0 w-px opacity-10"
//             style={{ left: `${10 + i * 12}%`, height: "100%", background: "linear-gradient(180deg, transparent, #60a5fa, transparent)", animation: `rainStreak ${1.5 + i * 0.3}s linear infinite`, animationDelay: `${i * 0.2}s` }} />
//         ))}
//       </div>

//       {/* Stats bar */}
//       <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10"
//         style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
//         <div className="flex items-center gap-3">
//           <div className="flex items-center gap-1 text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>
//             <Coins className="w-3.5 h-3.5 text-amber-400" />{score}
//           </div>
//           {multiplier > 1 && (
//             <div className="flex items-center gap-1 text-xs font-black px-1.5 py-0.5 rounded-xs"
//               style={{ background: "rgba(139,92,246,0.3)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.4)" }}>
//               <Zap className="w-3 h-3" />{multiplier}×
//             </div>
//           )}
//           {combo >= 3 && (
//             <div className="text-xs font-black" style={{ color: "#f59e0b" }}>{combo}× combo</div>
//           )}
//         </div>
//         <div className="text-white font-black text-lg tabular-nums" style={{ letterSpacing: "-0.03em", color: timeLeft <= 5 ? "#ef4444" : "#fff" }}>
//           {timeLeft}s
//         </div>
//       </div>

//       {/* Falling tokens */}
//       {tokens.map(token => {
//         const cfg = TOKEN_CFG[token.type];
//         return (
//           <motion.button
//             key={token.id}
//             initial={{ y: "-10%", x: "-50%", scale: 0.6, opacity: 0 }}
//             animate={{ y: "120%", x: "-50%", scale: 1, opacity: 1 }}
//             transition={{ duration: token.duration, ease: "linear" }}
//             onClick={e => handleCatch(token, e)}
//             className="absolute flex items-center justify-center rounded-full font-black text-lg"
//             style={{
//               left: `${token.x}%`,
//               top: 0,
//               width: cfg.size, height: cfg.size,
//               background: cfg.bg,
//               boxShadow: `0 0 16px ${cfg.shadow}70, 0 4px 10px rgba(0,0,0,0.5)`,
//               border: `1.5px solid ${cfg.color}80`,
//               zIndex: 5,
//             }}
//           >
//             {SYMBOLS[token.type]}
//           </motion.button>
//         );
//       })}

//       {/* Score pops */}
//       {pops.map(p => (
//         <motion.div key={p.id}
//           initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -45 }}
//           transition={{ duration: 0.7, ease: "easeOut" }}
//           className="absolute pointer-events-none font-black text-xs z-20 whitespace-nowrap"
//           style={{ left: `${p.x}%`, top: "50%", transform: "translateX(-50%)", color: "#fbbf24", textShadow: "0 2px 6px #000" }}>
//           {p.text}
//         </motion.div>
//       ))}

//       {/* Game over */}
//       {done && (
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//           className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
//           style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}>
//           <Trophy className="w-10 h-10 text-amber-400" />
//           <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{caught} caught</p>
//           <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{score} points total</p>
//         </motion.div>
//       )}

//       {isFlash && (
//         <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
//           style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
//           2× Flash
//         </div>
//       )}

//       <style>{`
//         @keyframes rainStreak {
//           0%   { transform: translateY(-100%); opacity: 0; }
//           20%  { opacity: 0.12; }
//           80%  { opacity: 0.12; }
//           100% { transform: translateY(500%); opacity: 0; }
//         }
//       `}</style>
//     </div>
//   );
// }