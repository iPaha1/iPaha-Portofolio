// =============================================================================
// GAME WIDGET — Premium Redesign (Hover-stable fix)
// components/(gamification)/game-widget.tsx
// =============================================================================
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins, Flame, Settings, Gamepad2, Zap, Gift, Star,
  ChevronLeft, Loader2, Lock,
} from "lucide-react";
import { useGame } from "./game-provider";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

const QUICK_GAMES = [
  { icon: TargetIcon, name: "Click Hunt",  accent: "#ef4444" },
  { icon: Gift,       name: "Token Rain",  accent: "#f59e0b" },
  { icon: Star,       name: "Mystery Box", accent: "#8b5cf6" },
];

export function GameWidget() {
  const { tokenBalance, streak, settings, isGameActive, triggerGame, setShowSettings } = useGame();
  const { isSignedIn, isLoaded } = useUser();

  const [isOpen, setIsOpen]       = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [ready, setReady]         = useState(false);
  const router = useRouter();

  // Single timeout ref used for both open-delay and close-delay
  const timerRef  = useRef<NodeJS.Timeout | null>(null);
  // Tracks whether the pointer is inside ANY zone (tab + bridge + panel)
  const insideRef = useRef(false);

  useEffect(() => {
    if (isLoaded) {
      const t = setTimeout(() => setReady(true), 300);
      return () => clearTimeout(t);
    }
  }, [isLoaded]);

  const cancelTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  // Pointer entered any zone — cancel any pending close, schedule open
  const handleEnter = useCallback(() => {
    cancelTimer();
    insideRef.current = true;
    setIsHovered(true);
    timerRef.current = setTimeout(() => setIsOpen(true), 120);
  }, []);

  // Pointer left a zone — wait 120 ms; if still outside all zones, close
  const handleLeave = useCallback(() => {
    cancelTimer();
    insideRef.current = false;
    timerRef.current = setTimeout(() => {
      if (!insideRef.current) {
        setIsOpen(false);
        setIsHovered(false);
      }
    }, 120);
  }, []);

  const handlePlay = () => {
    if (!isSignedIn || isGameActive) return;
    triggerGame();
    setIsOpen(false);
  };

  if (!ready) return null;

  return (
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[97]"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
    >
      {/* Outer row: [panel] [bridge] [tab] — all siblings, all wired to the same enter/leave */}
      <div className="relative flex items-stretch">

        {/* ── PANEL ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, x: 12, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
              className="w-72 rounded-xs overflow-hidden self-start"
              style={{
                background: "rgba(10,10,14,0.97)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
              }}
            >
              {/* Amber hairline */}
              <div className="h-[2px] w-full bg-gradient-to-r from-amber-500/80 via-amber-400 to-transparent" />

              {/* Header */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/60">
                    Game Center
                  </span>
                </div>
                {isSignedIn && (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-white/25 hover:text-white/70 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="mx-4 border-t border-white/[0.06]" />

              <div className="p-4 space-y-4">
                {!isSignedIn ? (
                  <div className="py-4 text-center space-y-3">
                    <div
                      className="w-12 h-12 rounded-xs mx-auto flex items-center justify-center"
                      style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}
                    >
                      <Lock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Sign in to play</p>
                      <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Earn tokens, unlock tools, and compete on leaderboards.
                      </p>
                    </div>
                    <a
                      href="/sign-in"
                      className="inline-block px-5 py-2 rounded-xs text-xs font-black text-black bg-amber-400 hover:bg-amber-300 transition-colors"
                    >
                      Sign In
                    </a>
                  </div>
                ) : (
                  <>
                    {/* Token balance */}
                    <div
                      className="flex items-center justify-between px-3 py-2.5 rounded-xs"
                      style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Coins className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-white/30">Balance</p>
                          <p className="text-lg font-black text-white leading-none" style={{ letterSpacing: "-0.03em" }}>
                            {tokenBalance}
                          </p>
                        </div>
                      </div>
                      {streak > 0 && (
                        <div
                          className="flex items-center gap-1 px-2 py-1 rounded-xs"
                          style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.25)" }}
                        >
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span className="text-[10px] font-bold text-orange-400">{streak}d</span>
                        </div>
                      )}
                    </div>

                    {/* Play button */}
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.975 }}
                      onClick={handlePlay}
                      disabled={isGameActive}
                      className="w-full py-3 rounded-xs flex items-center justify-center gap-2 text-sm font-black text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: isGameActive ? "#888" : "#f59e0b",
                        boxShadow: isGameActive ? "none" : "0 0 28px rgba(245,158,11,0.35)",
                      }}
                    >
                      {isGameActive ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Game in progress</>
                      ) : (
                        <><Zap className="w-4 h-4" /> Play a random game</>
                      )}
                    </motion.button>

                    {/* Quick games */}
                    <div>
                      <p className="text-[9px] font-black tracking-[0.22em] uppercase text-white/20 mb-2">
                        Quick Pick
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {QUICK_GAMES.map(g => (
                          <motion.button
                            key={g.name}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => { triggerGame(); setIsOpen(false); }}
                            disabled={isGameActive}
                            className="flex flex-col items-center gap-1.5 py-2.5 rounded-xs text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                              background: `${g.accent}12`,
                              border: `1px solid ${g.accent}25`,
                              color: g.accent,
                            }}
                          >
                            <g.icon className="w-4 h-4" />
                            <span className="leading-tight text-center">{g.name}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: settings.gameEnabled ? "#10b981" : "#ef4444",
                            boxShadow: settings.gameEnabled ? "0 0 6px #10b981" : "none",
                          }}
                        />
                        {settings.gameEnabled ? "Games active" : "Games paused"}
                      </div>
                      {/* Add a button to open games page /games */}
                      <button
                        onClick={() => router.push("/games")}
                        className="hover:text-white/60 transition-colors"
                      >
                        Games
                      </button>
                      <button
                        onClick={() => setShowSettings(true)}
                        className="hover:text-white/60 transition-colors"
                      >
                        Settings
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── INVISIBLE BRIDGE ──────────────────────────────────────────────
            Fills the visual gap between the panel's right edge and the tab's
            left edge. The pointer never leaves the component while crossing it,
            so handleLeave never fires mid-transition.
            Width matches the `mr-2` / visual gap (8 px → w-3 gives a little
            extra safety margin). It stretches full height so it works
            regardless of panel vs. tab height.
        ─────────────────────────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="w-3 self-stretch"
        />

        {/* ── TAB ── */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (isOpen) { setIsOpen(false); setIsHovered(false); }
            else setIsOpen(true);
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="relative flex items-center gap-2.5 rounded-l-xs px-3 py-3.5 text-white select-none flex-shrink-0"
          style={{
            background: isOpen || isHovered ? "rgba(245,158,11,0.15)" : "rgba(10,10,14,0.92)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRight: "none",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.4)",
            transition: "background 0.2s",
          }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 0 : [0, 8, -8, 0] }}
            transition={{ repeat: isOpen ? 0 : Infinity, duration: 3, repeatDelay: 4 }}
          >
            <Gamepad2 className="w-5 h-5 text-amber-400" />
          </motion.div>

          {!isOpen && isSignedIn && tokenBalance > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center px-1"
            >
              {tokenBalance > 99 ? "99+" : tokenBalance}
            </motion.div>
          )}

          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft className="w-3.5 h-3.5 text-white/30" />
          </motion.div>
        </motion.button>
      </div>

      {/* ── Tooltip (only when collapsed + hovered) ── */}
      <AnimatePresence>
        {!isOpen && isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap px-2.5 py-1.5 rounded-xs text-[11px] font-semibold pointer-events-none"
            style={{
              background: "rgba(10,10,14,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {isSignedIn ? `Game Center · ${tokenBalance} tokens` : "Sign in to play games"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



// // components/game/game-widget.tsx
// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Coins, Flame, Settings, Gamepad2, Zap, Gift, Star, ChevronLeft, Loader2 } from "lucide-react";
// import { useGame } from "./game-provider";
// import { useUser } from "@clerk/nextjs";

// export function GameWidget() {
//   const { tokenBalance, streak, canPlay, setShowSettings, triggerGame, settings, isGameActive } = useGame();
//   const { isSignedIn, isLoaded } = useUser(); // Get sign-in status directly from Clerk
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [isHovering, setIsHovering] = useState(false);
//   const [showTooltip, setShowTooltip] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

//   // Show loading state while auth is being determined
//   useEffect(() => {
//     if (isLoaded && canPlay !== undefined) {
//       setIsLoading(false);
//     }
//   }, [isLoaded, canPlay]);

//   // Debug logs
//   useEffect(() => {
//     console.log("🎮 GameWidget render:", {
//       isSignedIn,
//       isLoaded,
//       canPlay,
//       tokenBalance,
//       streak,
//       settings
//     });
//   }, [isSignedIn, isLoaded, canPlay, tokenBalance, streak, settings]);

//   const createParticles = () => {
//     const newParticles = [];
//     for (let i = 0; i < 8; i++) {
//       newParticles.push({
//         id: Date.now() + i,
//         x: Math.random() * 100 - 50,
//         y: Math.random() * 100 - 50,
//       });
//     }
//     setParticles(newParticles);
//     setTimeout(() => setParticles([]), 1000);
//   };

//   // Handle hover with delay
//   const handleMouseEnter = () => {
//     if (isLoading) return;
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     setIsHovering(true);
//     timeoutRef.current = setTimeout(() => {
//       setIsExpanded(true);
//     }, 300);
//   };

//   const handleMouseLeave = () => {
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     setIsHovering(false);
//     setIsExpanded(false);
//     setShowTooltip(false);
//   };

//   const handleClick = () => {
//     if (isLoading) return;
//     setIsExpanded(!isExpanded);
//     if (!isExpanded) {
//       setShowTooltip(false);
//     }
//   };

//   const handlePlayGame = () => {
//     if (!canPlay || !isSignedIn) return;
//     triggerGame();
//     setIsExpanded(false);
//   };

//   // Don't render anything while loading
//   if (isLoading) {
//     return null;
//   }

//   return (
//     <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100]">
//       {/* Main Widget Button */}
//       <motion.div
//         animate={{
//           x: isExpanded ? 0 : "calc(100% - 48px)",
//         }}
//         transition={{ type: "spring", damping: 20, stiffness: 300 }}
//         className="relative"
//         onMouseEnter={handleMouseEnter}
//         onMouseLeave={handleMouseLeave}
//       >
//         {/* Glow Effect */}
//         <motion.div
//           animate={{
//             opacity: (isHovering || isExpanded) && !isLoading ? 1 : 0,
//             scale: (isHovering || isExpanded) && !isLoading ? 1 : 0.8,
//           }}
//           className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl"
//           style={{ opacity: 0 }}
//         />

//         {/* Main Button */}
//         <motion.button
//           onClick={handleClick}
//           whileHover={!isLoading ? { scale: 1.05 } : {}}
//           whileTap={!isLoading ? { scale: 0.95 } : {}}
//           className={`relative flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-l-2xl py-3 pl-3 pr-4 shadow-2xl group transition-opacity ${
//             !isSignedIn ? "opacity-80" : ""
//           }`}
//           style={{
//             boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
//           }}
//         >
//           {/* Animated Icon */}
//           <div className="relative">
//             <motion.div
//               animate={{
//                 rotate: isExpanded ? 0 : [0, 10, -10, 0],
//               }}
//               transition={{ repeat: isExpanded ? 0 : Infinity, duration: 2, repeatDelay: 3 }}
//               className="relative"
//             >
//               <Gamepad2 className="w-6 h-6" />
//             </motion.div>
//             {!isExpanded && tokenBalance > 0 && isSignedIn && (
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 className="absolute -top-1 -right-2 bg-yellow-400 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
//               >
//                 {tokenBalance > 99 ? "99+" : tokenBalance}
//               </motion.div>
//             )}
//           </div>

//           {/* Text - only visible when expanded */}
//           <AnimatePresence>
//             {isExpanded && (
//               <motion.div
//                 initial={{ width: 0, opacity: 0 }}
//                 animate={{ width: "auto", opacity: 1 }}
//                 exit={{ width: 0, opacity: 0 }}
//                 className="overflow-hidden whitespace-nowrap"
//               >
//                 <span className="font-semibold text-sm">Game Center</span>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Expand/Collapse Icon */}
//           <motion.div
//             animate={{ rotate: isExpanded ? 180 : 0 }}
//             transition={{ duration: 0.3 }}
//             className="ml-1"
//           >
//             <ChevronLeft className="w-4 h-4" />
//           </motion.div>
//         </motion.button>

//         {/* Expanded Panel */}
//         <AnimatePresence>
//           {isExpanded && !isLoading && (
//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               exit={{ opacity: 0, x: 20 }}
//               transition={{ duration: 0.2 }}
//               className="absolute right-full top-0 mr-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-72 overflow-hidden"
//               style={{
//                 boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.2)",
//               }}
//             >
//               {/* Header with Glass Effect */}
//               <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
//                 <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
//                 <div className="relative flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Gamepad2 className="w-5 h-5 text-white" />
//                     <span className="text-white font-bold text-sm">Game Center</span>
//                   </div>
//                   {isSignedIn && (
//                     <motion.button
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                       onClick={() => setShowSettings(true)}
//                       className="text-white/80 hover:text-white transition-colors"
//                     >
//                       <Settings className="w-4 h-4" />
//                     </motion.button>
//                   )}
//                 </div>
//               </div>

//               {/* Stats Section */}
//               <div className="p-4 space-y-3">
//                 {/* Sign-in Prompt if not signed in */}
//                 {!isSignedIn && (
//                   <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl text-center">
//                     <Gamepad2 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
//                     <p className="text-sm font-semibold text-purple-900">Sign in to play!</p>
//                     <p className="text-xs text-purple-600 mt-1 mb-3">Earn tokens, unlock achievements, and compete on leaderboards</p>
//                     <a
//                       href="/sign-in"
//                       className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all"
//                     >
//                       Sign In
//                     </a>
//                   </div>
//                 )}

//                 {/* Token Balance - only show if signed in */}
//                 {isSignedIn && (
//                   <>
//                     <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
//                       <div className="flex items-center gap-2">
//                         <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
//                           <Coins className="w-4 h-4 text-white" />
//                         </div>
//                         <div>
//                           <p className="text-xs text-gray-500">Token Balance</p>
//                           <p className="text-lg font-bold text-gray-900">{tokenBalance}</p>
//                         </div>
//                       </div>
//                       {streak > 0 && (
//                         <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
//                           <Flame className="w-3 h-3 text-orange-500" />
//                           <span className="text-xs font-bold text-orange-600">{streak} day streak</span>
//                         </div>
//                       )}
//                     </div>

//                     {/* Play Game Button */}
//                     <motion.button
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => {
//                         createParticles();
//                         handlePlayGame();
//                       }}
//                       disabled={isGameActive}
//                       className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       {isGameActive ? (
//                         <Loader2 className="w-4 h-4 animate-spin" />
//                       ) : (
//                         <Zap className="w-4 h-4" />
//                       )}
//                       {isGameActive ? "Game in Progress..." : "Play Random Game"}
//                     </motion.button>

//                     {/* Game Stats Preview */}
//                     <div className="grid grid-cols-2 gap-2 pt-1">
//                       <div className="text-center p-2 bg-gray-50 rounded-lg">
//                         <p className="text-[10px] text-gray-400">Games Today</p>
//                         <p className="text-sm font-bold text-gray-700">0</p>
//                       </div>
//                       <div className="text-center p-2 bg-gray-50 rounded-lg">
//                         <p className="text-[10px] text-gray-400">This Week</p>
//                         <p className="text-sm font-bold text-gray-700">0</p>
//                       </div>
//                     </div>

//                     {/* Mini Games Quick Access */}
//                     <div className="pt-2">
//                       <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Games</p>
//                       <div className="flex gap-2">
//                         {[
//                           { icon: Target, name: "Click Hunt", color: "from-red-500 to-orange-500" },
//                           { icon: Gift, name: "Token Rain", color: "from-yellow-500 to-amber-500" },
//                           { icon: Star, name: "Mystery Box", color: "from-purple-500 to-pink-500" },
//                         ].map((game) => (
//                           <motion.button
//                             key={game.name}
//                             whileHover={{ scale: 1.05 }}
//                             whileTap={{ scale: 0.95 }}
//                             onClick={() => {
//                               triggerGame();
//                               setIsExpanded(false);
//                             }}
//                             disabled={isGameActive}
//                             className={`flex-1 py-2 rounded-lg bg-gradient-to-r ${game.color} text-white text-[10px] font-medium flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed`}
//                           >
//                             <game.icon className="w-3 h-3" />
//                             <span>{game.name}</span>
//                           </motion.button>
//                         ))}
//                       </div>
//                     </div>

//                     {/* Status Indicator */}
//                     <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
//                       <span className="flex items-center gap-1">
//                         <div className={`w-1.5 h-1.5 rounded-full ${settings?.gameEnabled ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
//                         {settings?.gameEnabled ? "Games Active" : "Games Disabled"}
//                       </span>
//                       <button
//                         onClick={() => setShowSettings(true)}
//                         className="hover:text-purple-600 transition-colors"
//                       >
//                         Settings
//                       </button>
//                     </div>
//                   </>
//                 )}
//               </div>

//               {/* Particles Effect */}
//               {particles.map((particle) => (
//                 <motion.div
//                   key={particle.id}
//                   initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
//                   animate={{ scale: 1, x: particle.x, y: particle.y, opacity: 0 }}
//                   transition={{ duration: 0.8 }}
//                   className="absolute pointer-events-none"
//                   style={{ left: "50%", top: "50%" }}
//                 >
//                   <Star className="w-2 h-2 text-yellow-400" />
//                 </motion.div>
//               ))}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>

//       {/* Tooltip for collapsed state */}
//       <AnimatePresence>
//         {!isExpanded && isHovering && !showTooltip && !isLoading && (
//           <motion.div
//             initial={{ opacity: 0, x: -10 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -10 }}
//             className="absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-black/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded whitespace-nowrap"
//           >
//             {isSignedIn ? `🎮 Game Center • ${tokenBalance} tokens` : "🔓 Sign in to play games!"}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // Helper icon for Target
// function Target(props: any) {
//   return (
//     <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <circle cx="12" cy="12" r="10" />
//       <circle cx="12" cy="12" r="6" />
//       <circle cx="12" cy="12" r="2" />
//     </svg>
//   );
// }



// // components/game/game-widget.tsx
// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Coins, Flame, Settings, Gamepad2, Zap, Gift, Star, ChevronLeft, ChevronRight } from "lucide-react";
// import { useGame } from "./game-provider";

// export function GameWidget() {
//   const { tokenBalance, streak, canPlay, setShowSettings, triggerGame, settings } = useGame();
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [isHovering, setIsHovering] = useState(false);
//   const [showTooltip, setShowTooltip] = useState(false);
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

//   const createParticles = () => {
//   const newParticles = [];
//   for (let i = 0; i < 8; i++) {
//     newParticles.push({
//       id: Date.now() + i,
//       x: Math.random() * 100 - 50,
//       y: Math.random() * 100 - 50,
//     });
//   }
//   setParticles(newParticles);
//   setTimeout(() => setParticles([]), 1000);
// };

// // Add this useEffect for hover sound
// useEffect(() => {
//   if (isHovering && !isExpanded && settings.soundEnabled) {
//     const audio = new Audio("/sounds/hover.mp3");
//     audio.volume = 0.2;
//     audio.play().catch(() => {});
//   }
// }, [isHovering, isExpanded, settings.soundEnabled]);

//   if (!canPlay) return null;
//   console.log("Rendering GameWidget with tokenBalance:", tokenBalance, "streak:", streak);
//   console.log("User can Play:", canPlay, "Game Enabled:", settings?.gameEnabled);

//   // Handle hover with delay
//   const handleMouseEnter = () => {
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     setIsHovering(true);
//     timeoutRef.current = setTimeout(() => {
//       setIsExpanded(true);
//     }, 300);
//   };

//   const handleMouseLeave = () => {
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     setIsHovering(false);
//     setIsExpanded(false);
//     setShowTooltip(false);
//   };

//   const handleClick = () => {
//     setIsExpanded(!isExpanded);
//     if (!isExpanded) {
//       setShowTooltip(false);
//     }
//   };

//   const handlePlayGame = () => {
//     triggerGame();
//     setIsExpanded(false);
//   };

//   return (
//     <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100]">
//       {/* Main Widget Button */}
//       <motion.div
//         animate={{
//           x: isExpanded ? 0 : "calc(100% - 48px)",
//         }}
//         transition={{ type: "spring", damping: 20, stiffness: 300 }}
//         className="relative"
//         onMouseEnter={handleMouseEnter}
//         onMouseLeave={handleMouseLeave}
//       >
//         {/* Glow Effect */}
//         <motion.div
//           animate={{
//             opacity: isHovering || isExpanded ? 1 : 0,
//             scale: isHovering || isExpanded ? 1 : 0.8,
//           }}
//           className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl"
//           style={{ opacity: 0 }}
//         />

//         {/* Main Button */}
//         <motion.button
//           onClick={handleClick}
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           className="relative flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-l-2xl py-3 pl-3 pr-4 shadow-2xl group"
//           style={{
//             boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
//           }}
//         >
//           {/* Animated Icon */}
//           <div className="relative">
//             <motion.div
//               animate={{
//                 rotate: isExpanded ? 0 : [0, 10, -10, 0],
//               }}
//               transition={{ repeat: isExpanded ? 0 : Infinity, duration: 2, repeatDelay: 3 }}
//               className="relative"
//             >
//               <Gamepad2 className="w-6 h-6" />
//             </motion.div>
//             {!isExpanded && tokenBalance > 0 && (
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 className="absolute -top-1 -right-2 bg-yellow-400 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
//               >
//                 {tokenBalance > 99 ? "99+" : tokenBalance}
//               </motion.div>
//             )}
//           </div>

//           {/* Text - only visible when expanded */}
//           <AnimatePresence>
//             {isExpanded && (
//               <motion.div
//                 initial={{ width: 0, opacity: 0 }}
//                 animate={{ width: "auto", opacity: 1 }}
//                 exit={{ width: 0, opacity: 0 }}
//                 className="overflow-hidden whitespace-nowrap"
//               >
//                 <span className="font-semibold text-sm">Game Center</span>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Expand/Collapse Icon */}
//           <motion.div
//             animate={{ rotate: isExpanded ? 180 : 0 }}
//             transition={{ duration: 0.3 }}
//             className="ml-1"
//           >
//             <ChevronLeft className="w-4 h-4" />
//           </motion.div>
//         </motion.button>

//         {/* Expanded Panel */}
//         <AnimatePresence>
//           {isExpanded && (
//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               exit={{ opacity: 0, x: 20 }}
//               transition={{ duration: 0.2 }}
//               className="absolute right-full top-0 mr-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-72 overflow-hidden"
//               style={{
//                 boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.2)",
//               }}
//             >
//               {/* Header with Glass Effect */}
//               <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
//                 <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
//                 <div className="relative flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Gamepad2 className="w-5 h-5 text-white" />
//                     <span className="text-white font-bold text-sm">Game Center</span>
//                   </div>
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     onClick={() => setShowSettings(true)}
//                     className="text-white/80 hover:text-white transition-colors"
//                   >
//                     <Settings className="w-4 h-4" />
//                   </motion.button>
//                 </div>
//               </div>

//               {/* Stats Section */}
//               <div className="p-4 space-y-3">
//                 {/* Token Balance */}
//                 <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
//                   <div className="flex items-center gap-2">
//                     <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
//                       <Coins className="w-4 h-4 text-white" />
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">Token Balance</p>
//                       <p className="text-lg font-bold text-gray-900">{tokenBalance}</p>
//                     </div>
//                   </div>
//                   {streak > 0 && (
//                     <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
//                       <Flame className="w-3 h-3 text-orange-500" />
//                       <span className="text-xs font-bold text-orange-600">{streak} day streak</span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Play Game Button */}
//                 <motion.button
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   onClick={() => {
//                     createParticles();
//                     handlePlayGame();
//                   }}
//                   className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
//                 >
//                   <Zap className="w-4 h-4" />
//                   Play Random Game
//                 </motion.button>

//                 {/* Game Stats Preview */}
//                 <div className="grid grid-cols-2 gap-2 pt-1">
//                   <div className="text-center p-2 bg-gray-50 rounded-lg">
//                     <p className="text-[10px] text-gray-400">Games Today</p>
//                     <p className="text-sm font-bold text-gray-700">0</p>
//                   </div>
//                   <div className="text-center p-2 bg-gray-50 rounded-lg">
//                     <p className="text-[10px] text-gray-400">This Week</p>
//                     <p className="text-sm font-bold text-gray-700">0</p>
//                   </div>
//                 </div>

//                 {/* Mini Games Quick Access */}
//                 <div className="pt-2">
//                   <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Games</p>
//                   <div className="flex gap-2">
//                     {[
//                       { icon: Target, name: "Click Hunt", color: "from-red-500 to-orange-500" },
//                       { icon: Gift, name: "Token Rain", color: "from-yellow-500 to-amber-500" },
//                       { icon: Star, name: "Mystery Box", color: "from-purple-500 to-pink-500" },
//                     ].map((game, i) => (
//                       <motion.button
//                         key={game.name}
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={{ scale: 0.95 }}
//                         onClick={() => {
//                           // Trigger specific game type
//                           triggerGame();
//                           setIsExpanded(false);
//                         }}
//                         className={`flex-1 py-2 rounded-lg bg-gradient-to-r ${game.color} text-white text-[10px] font-medium flex flex-col items-center gap-1`}
//                       >
//                         <game.icon className="w-3 h-3" />
//                         <span>{game.name}</span>
//                       </motion.button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Status Indicator */}
//                 <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
//                   <span className="flex items-center gap-1">
//                     <div className={`w-1.5 h-1.5 rounded-full ${settings?.gameEnabled ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
//                     {settings?.gameEnabled ? "Games Active" : "Games Disabled"}
//                   </span>
//                   <button
//                     onClick={() => setShowSettings(true)}
//                     className="hover:text-purple-600 transition-colors"
//                   >
//                     Settings
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>

//       {/* Tooltip for collapsed state */}
//       <AnimatePresence>
//         {!isExpanded && isHovering && !showTooltip && (
//           <motion.div
//             initial={{ opacity: 0, x: -10 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -10 }}
//             className="absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-black/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded whitespace-nowrap"
//           >
//             Game Center • {tokenBalance} tokens
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // Helper icon for Target (if not imported)
// function Target(props: any) {
//   return (
//     <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <circle cx="12" cy="12" r="10" />
//       <circle cx="12" cy="12" r="6" />
//       <circle cx="12" cy="12" r="2" />
//     </svg>
//   );
// }