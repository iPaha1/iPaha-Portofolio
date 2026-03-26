// =============================================================================
// FLOATING GAME — Premium Redesign
// components/(gamification)/floating-game.tsx
// =============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Zap } from "lucide-react";
import { GameFactory, GameType } from "./game-factory";
import { useGame } from "./game-provider";

interface FloatingGameProps {
  game: {
    id: string;
    type: GameType;
    rewardTokens: number;
    bonusTokens?: number;
    title: string;
    description?: string;
    duration: number;
    isFlash?: boolean;
  };
  onClose: () => void;
  onComplete: (reward: number, score?: number) => void;
}

// Ambient background fade overlay
function PageDimmer({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onClick={onClick}
      className="fixed inset-0 z-[98]"
      style={{
        background: "radial-gradient(ellipse at bottom right, rgba(10,10,12,0.72) 0%, rgba(10,10,12,0.55) 100%)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}
    />
  );
}

const GAME_ACCENT: Record<GameType, string> = {
  CLICK_HUNT: "#ef4444",
  TOKEN_RAIN:  "#f59e0b",
  MYSTERY_BOX: "#8b5cf6",
  REACTION:    "#10b981",
  MEMORY_MATCH:"#3b82f6",
  BUBBLE_BURST:"#ec4899",
  SPEED_TYPER: "#14b8a6",
  DODGE_RUSH:  "#f97316",
  NUMBER_PULSE:"#6366f1",
  COLOUR_TAP:  "#e879f9",
  MOLE_MASH:   "#22c55e",
  GRAVITY_FLIP:"#8b5cf6",
  MATH_BLITZ:  "#3b82f6",
  SHADOW_TRACE:"#ef4444",
  TILE_FLIP:   "#f59e0b",
  PIXEL_PAINT: "#ec4899",
  SIGNAL_CHAIN:"#14b8a6",
  RHYTHM_PULSE:"#f97316",
  STAR_CONNECT:"#e879f9",
  PRECISION_STOP:"#22c55e",
  CHAIN_REACTION:"#8b5cf6",
  MIRROR_PAINTER:"#3b82f6",
  WORD_HUNT:   "#ef4444",
  NEON_TRAIL:  "#f59e0b",
  FREQUENCY_MATCH:"#ec4899",
  ICE_SLIDE:   "#14b8a6",
  SONAR_SWEEP: "#f97316",
  AUCTION_BLITZ: "#e879f9",
};

const GAME_TIPS: Record<GameType, string> = {
  CLICK_HUNT:  "Smaller targets = more points. Chain clicks for combo bonus.",
  TOKEN_RAIN:  "Gold tokens are rarest. Watch for 3× multiplier power-ups.",
  MYSTERY_BOX: "One click. Pure luck. May your odds be legendary.",
  REACTION:    "Wait for green. Click early = reset. Under 200ms = insane.",
  MEMORY_MATCH:"Focus on pairs. Try to remember hidden cards for big combos.",
  BUBBLE_BURST: "Burst clusters for higher scores. Watch out for bombs!",
  SPEED_TYPER: "Type the word before time runs out. Longer words = more points.",
  DODGE_RUSH:  "Dodge incoming obstacles. The longer you survive, the more points you earn.",
  NUMBER_PULSE: "Hit the numbers in sequence. Speed and accuracy matter!",
  COLOUR_TAP:   "Tap the correct color as it appears. Get them all to score big!",
  MOLE_MASH:    "Smash the moles as they pop up. Quick reflexes win!",
  GRAVITY_FLIP: "Flip gravity to navigate the maze. Time your flips for max points!",
  MATH_BLITZ:   "Solve math problems quickly. Each correct answer boosts your score multiplier!",
  SHADOW_TRACE: "Trace the shape accurately. The closer to the original, the higher your score!",
  TILE_FLIP:    "Flip the tiles to match the pattern. Plan ahead for combos!",
  PIXEL_PAINT:  "Fill in the pixels to complete the picture. Speed and accuracy earn more points!",
  SIGNAL_CHAIN: "Connect the signals in the correct order. Longer chains yield higher rewards!",
  RHYTHM_PULSE: "Tap to the rhythm. The better your timing, the higher your score!",
  STAR_CONNECT: "Connect the stars in the right sequence. The more stars you connect, the more points you earn!",
  PRECISION_STOP: "Stop the moving bar as close to the target as possible. Precision is key!",
  CHAIN_REACTION: "Trigger chain reactions for massive points. Plan your moves carefully!",
  MIRROR_PAINTER: "Paint the mirror image accurately. The closer you get, the higher your score!",
  WORD_HUNT:    "Find the hidden words in the jumble. Longer words = more points!",
  NEON_TRAIL:   "Follow the neon trail without breaking it. The longer you go, the more points you earn!",
  FREQUENCY_MATCH: "Match the frequency patterns. The more you match, the higher your score!",
  ICE_SLIDE:    "Slide on the ice without crashing. The longer you slide, the more points you earn!",
  SONAR_SWEEP:  "Navigate the maze using sonar. The faster you find the exit, the higher your score!",
  AUCTION_BLITZ: "Bid on items quickly. The more you win, the higher your score!",
};

export function FloatingGame({ game, onClose, onComplete }: FloatingGameProps) {
  const { settings } = useGame();
  const [rewardEarned, setRewardEarned] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const accent = GAME_ACCENT[game.type];

  // 3-2-1 countdown before game begins
  useEffect(() => {
    if (countdown === 0) {
      setGameStarted(true);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleComplete = (reward: number, score?: number) => {
    setRewardEarned(reward);
    setFinalScore(score ?? null);
    setTimeout(() => onComplete(reward, score), 2200);
  };

  return (
    <AnimatePresence>
      {/* Dimmer */}
      <PageDimmer onClick={onClose} />

      {/* Floating Panel */}
      <motion.div
        key="game-panel"
        initial={{ opacity: 0, y: 60, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.8 }}
        className="fixed z-[99] bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[460px] max-h-[100dvh] sm:max-h-[none] overflow-y-auto"
        style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
      >
        {/* Glass shell */}
        <div
          className="relative overflow-hidden sm:rounded-xs"
          style={{
            background: "rgba(10,10,14,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 60px -20px ${accent}30`,
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${accent} 40%, ${accent}60 100%)` }}
          />

          {/* Ambient glow blob */}
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
              filter: "blur(30px)",
            }}
          />

          {/* Header */}
          <div className="relative px-5 pt-5 pb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Live dot */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: accent }}
                />
                <div
                  className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                  style={{ background: `${accent}60` }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {game.isFlash && (
                    <span
                      className="text-[9px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded-xs"
                      style={{ background: `${accent}25`, color: accent }}
                    >
                      Flash
                    </span>
                  )}
                  <h2
                    className="text-white font-black text-base tracking-tight"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {game.title}
                  </h2>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {game.duration}s · Up to{" "}
                  <span style={{ color: "#f59e0b" }}>
                    {game.bonusTokens || game.rewardTokens * 2} tokens
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <div style={{ color: "rgba(255,255,255,0.25)" }}>
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </div>
              <button
                onClick={onClose}
                className="transition-all w-7 h-7 rounded-xs flex items-center justify-center"
                style={{
                  color: "rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.05)",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div className="px-4 pb-4">
            {rewardEarned !== null ? (
              /* — Win Screen — */
              <RewardScreen
                reward={rewardEarned}
                score={finalScore}
                accent={accent}
                gameType={game.type}
              />
            ) : !gameStarted ? (
              /* — Countdown — */
              <CountdownScreen count={countdown} accent={accent} gameTitle={game.title} />
            ) : (
              /* — Active Game — */
              <div className="rounded-xs overflow-hidden">
                <GameFactory
                  gameId={game.id}
                  gameType={game.type}
                  rewardTokens={game.rewardTokens}
                  bonusTokens={game.bonusTokens}
                  duration={game.duration}
                  onComplete={handleComplete}
                  soundEnabled={settings.soundEnabled}
                  isFlash={game.isFlash}
                />
              </div>
            )}
          </div>

          {/* Footer tip */}
          {gameStarted && rewardEarned === null && (
            <div
              className="px-5 pb-4 text-[11px] text-center"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              {GAME_TIPS[game.type]}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Countdown Screen ────────────────────────────────────────────────────────
function CountdownScreen({
  count,
  accent,
  gameTitle,
}: {
  count: number;
  accent: string;
  gameTitle: string;
}) {
  return (
    <div
      className="h-72 flex flex-col items-center justify-center rounded-xs gap-4"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
        {gameTitle} — Starting in
      </p>
      <motion.div
        key={count}
        initial={{ scale: 1.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 300 }}
        className="text-8xl font-black"
        style={{
          color: accent,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.05em",
          textShadow: `0 0 40px ${accent}60`,
        }}
      >
        {count === 0 ? "GO" : count}
      </motion.div>
      <div className="flex gap-2 mt-2">
        {[3, 2, 1].map(n => (
          <div
            key={n}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{ background: count <= n ? accent : "rgba(255,255,255,0.15)" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Reward Screen ────────────────────────────────────────────────────────────
function RewardScreen({
  reward,
  score,
  accent,
  gameType,
}: {
  reward: number;
  score: number | null;
  accent: string;
  gameType: GameType;
}) {
  const phrases =
    reward >= 30
      ? ["Legendary haul.", "Absolutely elite.", "Token royalty."]
      : reward >= 15
      ? ["Solid run.", "Clean performance.", "Nicely done."]
      : ["Not bad.", "Keep playing.", "Next time."];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 20 }}
      className="h-72 flex flex-col items-center justify-center rounded-xs gap-3"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      {/* Token badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 14, delay: 0.15 }}
        className="w-16 h-16 rounded-xs flex items-center justify-center mb-1"
        style={{
          background: `${accent}20`,
          border: `1px solid ${accent}40`,
        }}
      >
        <Zap className="w-8 h-8" style={{ color: accent }} />
      </motion.div>

      <div className="text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-5xl font-black text-white"
          style={{ letterSpacing: "-0.04em" }}
        >
          +{reward}
        </motion.p>
        <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          tokens earned
        </p>
      </div>

      {score !== null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-semibold"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {score} points
        </motion.p>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs italic mt-1"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        {phrase}
      </motion.p>
    </motion.div>
  );
}




// // =============================================================================
// // UPDATED FLOATING GAME COMPONENT - Using Game Factory
// // components/game/FloatingGame.tsx
// // =============================================================================

// "use client";

// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, Zap, Trophy, Volume2, VolumeX, Star } from "lucide-react";
// import { GameFactory, GameType } from "./game-factory";
// import { useGame } from "./game-provider";
// // import { useGame } from "./GameProvider";
// // import { GameFactory } from "./GameFactory";
// // import type { GameType } from "./GameFactory";

// interface FloatingGameProps {
//   game: {
//     id: string;
//     type: GameType;
//     subType?: string;
//     rewardTokens: number;
//     bonusTokens?: number;
//     title: string;
//     description?: string;
//     duration: number;
//     isFlash?: boolean;
//   };
//   onClose: () => void;
//   onComplete: (reward: number, score?: number) => void;
// }

// export function FloatingGame({ game, onClose, onComplete }: FloatingGameProps) {
//   console.log("🎮 FloatingGame rendered with game:", game);

//   const { settings } = useGame();
//   const [rewardEarned, setRewardEarned] = useState<number | null>(null);
//   const [score, setScore] = useState<number | null>(null);

//   const handleComplete = (reward: number, gameScore?: number) => {
//     console.log("🎮 Game completed with reward:", reward, "score:", gameScore);
//     setRewardEarned(reward);
//     setScore(gameScore || null);
//     setTimeout(() => onComplete(reward, gameScore), 2000);
//   };

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0, scale: 0.9, y: 50 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: 0.9, y: 50 }}
//         className="fixed bottom-6 right-6 z-[100] w-[450px] max-w-[calc(100vw-2rem)]"
//       >
//         {/* Liquid Glass Effect */}
//         <div className="relative rounded-2xl overflow-hidden shadow-2xl">
//           {/* Glass Background */}
//           <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl" />
//           <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
          
//           {/* Content */}
//           <div className="relative p-5">
//             {/* Header */}
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex items-center gap-2">
//                 <Zap className="w-5 h-5 text-yellow-400" />
//                 <h3 className="text-white font-bold text-lg">{game.title}</h3>
//                 {game.isFlash && (
//                   <span className="px-2 py-0.5 bg-yellow-500/30 text-yellow-300 text-xs rounded-full animate-pulse">
//                     FLASH
//                   </span>
//                 )}
//               </div>
//               <div className="flex items-center gap-2">
//                 {settings.soundEnabled ? (
//                   <Volume2 className="w-4 h-4 text-white/60" />
//                 ) : (
//                   <VolumeX className="w-4 h-4 text-white/60" />
//                 )}
//                 <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>

//             {/* Description */}
//             <p className="text-white/80 text-sm mb-3">{game.description}</p>
            
//             {/* Prize Info */}
//             <div className="flex items-center gap-2 mb-4">
//               <Trophy className="w-4 h-4 text-yellow-400" />
//               <span className="text-white text-sm font-semibold">
//                 Win up to {game.bonusTokens || game.rewardTokens * 2} tokens!
//               </span>
//               <span className="text-white/40 text-xs ml-auto">
//                 {game.duration}s
//               </span>
//             </div>

//             {/* Game Area */}
//             <div className="mb-4">
//               {rewardEarned === null ? (
//                 <GameFactory
//                   gameId={game.id}
//                   gameType={game.type}
//                   rewardTokens={game.rewardTokens}
//                   bonusTokens={game.bonusTokens}
//                   duration={game.duration}
//                   onComplete={handleComplete}
//                   soundEnabled={settings.soundEnabled}
//                   isFlash={game.isFlash}
//                 />
//               ) : (
//                 <div className="flex flex-col items-center justify-center h-96 rounded-xl bg-black/30">
//                   <motion.div
//                     initial={{ scale: 0 }}
//                     animate={{ scale: 1 }}
//                     className="text-center"
//                   >
//                     <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
//                     <p className="text-3xl font-bold text-white mb-2">+{rewardEarned} tokens!</p>
//                     {score !== null && (
//                       <p className="text-white/80">Score: {score} points</p>
//                     )}
//                   </motion.div>
//                 </div>
//               )}
//             </div>

//             {/* Game Tip */}
//             <p className="text-white/40 text-xs text-center">
//               {game.type === "CLICK_HUNT" && "🎯 Click targets before they disappear! Bigger combos = more points"}
//               {game.type === "TOKEN_RAIN" && "💰 Click falling tokens! Catch gold for bonus points"}
//               {game.type === "MYSTERY_BOX" && "🎁 Click to open! What multiplier will you get?"}
//               {game.type === "REACTION" && "⚡ Click the moment it turns green! Faster = higher score"}
//             </p>
//           </div>
//         </div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }