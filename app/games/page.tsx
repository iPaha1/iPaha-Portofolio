// =============================================================================
// isaacpaha.com — Game Center Page
// app/game/page.tsx
//
// Server component: exports full Metadata (title, description, OG, Twitter,
// JSON-LD structured data, canonical, keywords) so search engines can index
// every one of the 30 games and understand the page's purpose.
// The interactive client logic lives in ./_game/game-client.tsx.
// =============================================================================

import type { Metadata } from "next";
import { GameClient } from "./_games/game-client";

const dynamic = 'force-dynamic'; // Ensure this page is always server-rendered for SEO and structured data purposes.
// ── All 50+ games listed for keyword + structured-data coverage ──────────────
const GAME_NAMES = [
  "Click Hunt", "Token Rain", "Mystery Box", "Reaction Test", "Memory Match",
  "Bubble Burst", "Speed Typer", "Dodge Rush", "Number Pulse", "Colour Tap",
  "Mole Mash", "Gravity Flip", "Math Blitz", "Shadow Trace", "Tile Flip",
  "Pixel Paint", "Signal Chain", "Rhythm Pulse", "Star Connect", "Precision Stop",
  "Chain Reaction", "Mirror Painter", "Word Hunt", "Neon Trail", "Frequency Match",
  "Ice Slide", "Sonar Sweep", "Auction Blitz", "Laser Grid", "Sequence Memory", 
  "Vault Cracker", "Neon Typerace",
];

const GAME_DESCRIPTIONS: Record<string, string> = {
  "Click Hunt":      "Click targets before they vanish. Build combos for bonus points.",
  "Token Rain":      "Catch falling tokens. Gold tokens are rarest and worth the most.",
  "Mystery Box":     "Pick one of five boxes and discover your token multiplier.",
  "Reaction Test":   "Click the moment it turns green. Five timed rounds of pure reflex.",
  "Memory Match":    "Flip cards and find all matching pairs before the clock runs out.",
  "Bubble Burst":    "Pop same-colour chains before bubbles float away. Avoid poison.",
  "Speed Typer":     "Type each glowing word before it expires. Three lives. Ten levels.",
  "Dodge Rush":      "Navigate six lanes, dodge falling obstacles, collect gold coins.",
  "Number Pulse":    "Watch a number sequence light up, then tap it back from memory.",
  "Colour Tap":      "Tap the ink colour — ignore the word the brain wants to read.",
  "Mole Mash":       "Whack green moles, dodge bombs. Golden moles score triple points.",
  "Gravity Flip":    "Tap to flip gravity and thread a glowing ball through wall gaps.",
  "Math Blitz":      "Solve arithmetic equations fast under a circular countdown timer.",
  "Shadow Trace":    "Memorise a dot-to-dot path then draw it from memory.",
  "Tile Flip":       "Flip 5×5 tiles in a Lights Out puzzle until the board is one colour.",
  "Pixel Paint":     "Memorise a pixel-art image then recreate it with flood-fill colour.",
  "Signal Chain":    "Rotate circuit tiles until a complete electrical path is formed.",
  "Rhythm Pulse":    "Tap coloured lanes as pulses hit the beat ring — no audio needed.",
  "Star Connect":    "Memorise a constellation then draw the connecting lines from memory.",
  "Precision Stop":  "Stop an oscillating needle precisely inside a shrinking target zone.",
  "Chain Reaction":  "Click cells to trigger orb explosions that cascade across the grid.",
  "Mirror Painter":  "Draw on one half of the canvas and watch it mirror live. Fill the target.",
  "Word Hunt":       "Drag across a 7×7 letter grid to find hidden words in every direction.",
  "Neon Trail":      "Grow your glowing snake trail by collecting orbs. Never cross yourself.",
  "Frequency Match": "Memorise an EQ waveform then recreate it by dragging frequency bars.",
  "Ice Slide":       "Slide a puck across ice — it glides until hitting a wall. Reach the star.",
  "Sonar Sweep":     "Ping the ocean grid to triangulate hidden fish schools, then catch them.",
  "Auction Blitz":   "Bid on items with a limited token budget. Outsmart the AI auctioneer.",
  "laser Grid":       "Navigate a laser through a shifting grid of mirrors and blockers to reach the goal.",
  "Sequence Memory":  "Memorise and repeat an increasingly long sequence of flashing colours and sounds.",
  "Vault Cracker":    "Crack the 3-digit code by testing combinations and using clues before time runs out.",
  "Neon Typerace":    "Type the scrolling words to speed up your neon car and outrun your rivals!",
  "Orbit Slingshot":  "Slingshot the spaceship around planets to reach the target orbit. Time your moves!",
  "Color Flood":      "Fill the board with one colour by spreading from the top-left! Plan your moves to flood the board in limited turns.",
  "Pulse Catcher":    "Catch the pulses as they hit the ring — feel the rhythm and score big!",
  "Shadow Match":     "Match the shadows to the objects — test your memory and attention to detail!",
  "Warp Speed":       "Navigate through warp zones at high speed — test your reflexes and timing!",
  "Mind The Gap":     "Jump through gaps in the neon platform — test your timing and precision!",
};

// ── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Game Center — 30 Browser Games · Earn Tokens | Isaac Paha",
  description:
    "Play 30 unique browser mini-games on isaacpaha.com — reaction tests, memory challenges, logic puzzles, rhythm games, word hunts, physics games and more. Earn tokens, climb the leaderboard, and unlock rewards. No download required.",

  openGraph: {
    title: "Game Center — 50+ Browser Games | Isaac Paha",
    description:
      "50+ addictive mini-games in one place. Reflex, memory, logic, rhythm, drawing, physics and more. Earn tokens and compete on the leaderboard.",
    url: "https://www.isaacpaha.com/games",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/dprxr852x/image/upload/v1774612989/isaacpaha/image/isaacpahaplatformog-1774612988459.png",
        width: 1200,
        height: 630,
        alt: "Game Center — Isaac Paha",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@iPaha3",
    creator: "@iPaha3",
    title: "Game Center — 50+ Browser Games | Isaac Paha",
    description:
      "50+ addictive mini-games. Earn tokens, climb the leaderboard, unlock rewards. Reaction, memory, logic, rhythm and more.",
    images: [
      "https://res.cloudinary.com/dprxr852x/image/upload/v1774612989/isaacpaha/image/isaacpahaplatformog-1774612988459.png",
    ],
  },

  alternates: {
    canonical: "https://www.isaacpaha.com/games",
  },

  keywords: [
    // Page-level
    "Isaac Paha games",
    "browser mini games",
    "earn tokens playing games",
    "free online games",
    "mini game collection",
    "gamification platform",
    "token rewards games",
    "leaderboard games",
    // Category keywords
    "reflex games online",
    "memory games browser",
    "logic puzzle games",
    "rhythm tap game",
    "word search game online",
    "snake game browser",
    "mole mash game",
    "reaction time game",
    "math quiz game",
    "pixel art game",
    // Individual game titles — every game gets a keyword slot
    ...GAME_NAMES.map(n => `${n} game`),
  ],

  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// ── Structured Data ───────────────────────────────────────────────────────────
// WebApplication + ItemList of all 50+ games so Google can show rich results.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id":   "https://www.isaacpaha.com/game#webapp",
      name:    "Isaac Paha Game Center",
      url:     "https://www.isaacpaha.com/game",
      description:
        "A collection of 50+ unique browser mini-games. Earn tokens, compete on leaderboards, and unlock rewards.",
      applicationCategory: "GameApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type":      "Offer",
        price:        "0",
        priceCurrency:"GBP",
        availability: "https://schema.org/InStock",
      },
      author: {
        "@type": "Person",
        name:    "Isaac Paha",
        url:     "https://www.isaacpaha.com",
      },
      publisher: {
        "@type": "Organization",
        name:    "iPaha Ltd",
        url:     "https://ipahait.com",
      },
      featureList: [
        "50+ unique mini-games",
        "Token reward system",
        "Global leaderboard",
        "Daily streak bonuses",
        "Flash events with double rewards",
        "Mobile and desktop compatible",
        "No download required",
      ],
    },

    // ItemList — one ListItem per game so Google can display each individually
    {
      "@type": "ItemList",
      "@id":   "https://www.isaacpaha.com/game#gamelist",
      name:    "50+ Mini-Games — Isaac Paha Game Center",
      url:     "https://www.isaacpaha.com/game",
      numberOfItems: GAME_NAMES.length,
      itemListElement: GAME_NAMES.map((name, i) => ({
        "@type":    "ListItem",
        position:   i + 1,
        name,
        description: GAME_DESCRIPTIONS[name] ?? `Play ${name} in the Isaac Paha Game Center.`,
        url:        `https://www.isaacpaha.com/game#${name.toLowerCase().replace(/\s+/g, "-")}`,
      })),
    },

    // BreadcrumbList
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",        item: "https://www.isaacpaha.com" },
        { "@type": "ListItem", position: 2, name: "Game Center", item: "https://www.isaacpaha.com/game" },
      ],
    },
  ],
};

// ── Page component ────────────────────────────────────────────────────────────
export default function GamePage() {
  return (
    <>
      {/* JSON-LD structured data injected into <head> */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* All interactive logic lives in the client component */}
      <GameClient />
    </>
  );
}





// // =============================================================================
// // GAME PAGE — app/game/page.tsx  (complete file)
// // =============================================================================
// "use client";

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useUser } from "@clerk/nextjs";
// import {
//   Gamepad2, Trophy, BarChart3, Users, Zap, Coins,
//   Flame, Star, ChevronRight, ChevronLeft, Play, Shuffle,
//   Clock, Target, Settings2, Crown, Medal, X, ArrowLeft,
//   TrendingUp, Calendar, Shield, Lock, RefreshCw, Sparkles,
//   CheckCircle, Timer, Layers, Swords,
//   Home,
// } from "lucide-react";
// import { GameFactory, type GameType } from "@/components/(gamification)/game-factory";
// import Link from "next/link";


// // ─────────────────────────────────────────────────────────────────────────────
// // CONSTANTS & TYPES
// // ─────────────────────────────────────────────────────────────────────────────
 
// interface GameDef {
//   type:        GameType;
//   title:       string;
//   emoji:       string;
//   description: string;
//   category:    "reflex" | "memory" | "skill" | "luck" | "brain";
//   difficulty:  1 | 2 | 3;
//   duration:    number;
//   baseReward:  number;
//   accent:      string;
//   tip:         string;
// }
 
// const GAMES: GameDef[] = [
//   { type: "CLICK_HUNT",   title: "Click Hunt",    emoji: "🎯", description: "Click targets before they vanish. Combos = big points.",  category: "reflex", difficulty: 1, duration: 15, baseReward: 8,  accent: "#ef4444", tip: "Smaller targets score more. Chain for combo bonus." },
//   { type: "TOKEN_RAIN",   title: "Token Rain",    emoji: "💰", description: "Catch falling tokens. Gold is rarest, worth most.",       category: "reflex", difficulty: 1, duration: 12, baseReward: 6,  accent: "#f59e0b", tip: "⚡ power token gives 3× multiplier for 5 seconds." },
//   { type: "MYSTERY_BOX",  title: "Mystery Box",   emoji: "🎁", description: "Pick one of five boxes. Discover your multiplier.",       category: "luck",   difficulty: 1, duration: 8,  baseReward: 5,  accent: "#8b5cf6", tip: "3% mythic jackpot = 10× tokens. Pure luck." },
//   { type: "REACTION",     title: "Reaction Test", emoji: "⚡", description: "Click exactly when it turns green. 5 timed rounds.",     category: "reflex", difficulty: 2, duration: 30, baseReward: 7,  accent: "#10b981", tip: "< 180ms = GODLIKE. Early clicks reset the round." },
//   { type: "MEMORY_MATCH", title: "Memory Match",  emoji: "🧠", description: "Flip cards to find all pairs before time runs out.",     category: "memory", difficulty: 2, duration: 45, baseReward: 9,  accent: "#6366f1", tip: "Consecutive matches build a huge combo multiplier." },
//   { type: "BUBBLE_BURST", title: "Bubble Burst",  emoji: "🫧", description: "Pop same-colour chains. Black poison bubbles = penalty.", category: "reflex", difficulty: 2, duration: 18, baseReward: 7,  accent: "#06b6d4", tip: "Chain 3+ same colour. Gold bubbles are 2× points." },
//   { type: "SPEED_TYPER",  title: "Speed Typer",   emoji: "⌨️", description: "Type each glowing word before it expires. 3 lives.",    category: "skill",  difficulty: 2, duration: 30, baseReward: 8,  accent: "#3b82f6", tip: "Epic words = 80pts. Perfect accuracy doubles reward." },
//   { type: "DODGE_RUSH",   title: "Dodge Rush",    emoji: "🚀", description: "Dodge obstacles across 6 lanes. Collect gold coins.",   category: "reflex", difficulty: 3, duration: 20, baseReward: 9,  accent: "#f97316", tip: "← → keys or tap left/right half. Coins = +15 pts." },
//   { type: "NUMBER_PULSE", title: "Number Pulse",  emoji: "🔢", description: "Watch a sequence light up, then tap it back perfectly.", category: "memory", difficulty: 3, duration: 45, baseReward: 8,  accent: "#a855f7", tip: "Each round adds one step. 3 lives to use wisely." },
//   { type: "COLOUR_TAP",   title: "Colour Tap",    emoji: "🎨", description: "Tap the ink colour — ignore what the word says.",        category: "brain",  difficulty: 3, duration: 30, baseReward: 7,  accent: "#ec4899", tip: "Classic Stroop effect. Streak bonus at 3+ correct." },
//   { type: "MOLE_MASH",    title: "Mole Mash",     emoji: "🔨", description: "Whack moles, skip bombs. Golden moles = 3× points.",    category: "reflex", difficulty: 2, duration: 20, baseReward: 8,  accent: "#22c55e", tip: "💣 bombs cost 1 life. 🌟 gold moles vanish fastest." },
//   { type: "GRAVITY_FLIP",  title: "Gravity Flip",  emoji: "🌀", description: "Flip gravity to navigate the ball through gaps.",         category: "skill",  difficulty: 3, duration: 25, baseReward: 9,  accent: "#8b5cf6", tip: "Time your flips to avoid obstacles. Collect coins for bonus points." },
//   { type: "MATH_BLITZ",    title: "Math Blitz",    emoji: "🧮", description: "Solve equations fast before the timer runs out!",    category: "skill",  difficulty: 3, duration: 35, baseReward: 8,  accent: "#3b82f6", tip: "Each correct answer boosts your score multiplier!" },
//   { type: "SHADOW_TRACE",  title: "Shadow Trace",  emoji: "✏️", description: "Memorise the path, then draw it from memory!",       category: "memory", difficulty: 3, duration: 60, baseReward: 9,  accent: "#ef4444", tip: "The closer to the original, the higher your score!" },
//   { type: "TILE_FLIP",     title: "Tile Flip",     emoji: "💡", description: "Flip tiles to make the board all one colour!",       category: "memory", difficulty: 3, duration: 60, baseReward: 9,  accent: "#f59e0b", tip: "Plan ahead for combos!" },
//   { type: "PIXEL_PAINT",   title: "Pixel Paint",   emoji: "🎨", description: "Memorise the pixel art, then recreate it from memory!", category: "memory", difficulty: 3, duration: 90, baseReward: 10, accent: "#10b981", tip: "Focus on one section at a time. Every pixel counts!" },
//   { type: "SIGNAL_CHAIN",  title: "Signal Chain",  emoji: "⚡", description: "Rotate circuit tiles to complete the electric path!",   category: "memory", difficulty: 3, duration: 60, baseReward: 10, accent: "#8b5cf6", tip: "Connect the dots to complete the circuit!" },
//   { type: "RHYTHM_PULSE",  title: "Rhythm Pulse",  emoji: "🎵", description: "Tap the beat as pulses hit the ring — feel the tempo!", category: "memory", difficulty: 3, duration: 30, baseReward: 9,  accent: "#f59e0b", tip: "Hit the rhythm to score big!" },
// ];
 
// const CATEGORY_CFG = {
//   reflex: { label: "Reflex",  color: "#ef4444" },
//   memory: { label: "Memory",  color: "#6366f1" },
//   skill:  { label: "Skill",   color: "#3b82f6" },
//   luck:   { label: "Luck",    color: "#8b5cf6" },
//   brain:  { label: "Brain",   color: "#ec4899" },
// };
 
// type Panel = "none" | "stats" | "leaderboard" | "multiplayer";
 
// interface UserStats {
//   wallet:   { balance: number; totalEarned: number; totalSpent: number };
//   streak:   { current: number; longest: number };
//   stats:    { totalGames: number; totalEarned: number; avgScore: number; winRate: number };
//   gameBreakdown: Record<string, { played: number; bestScore: number; totalEarned: number }>;
//   recent:   { id: string; gameType: string; gameTitle: string; score: number; reward: number; completedAt: string }[];
//   achievements: { id: string; name: string; icon: string; rarity: string }[];
// }
 
// interface LeaderboardEntry {
//   rank: number; displayName: string; avatarUrl: string | null;
//   totalTokens: number; gamesPlayed: number; avgScore: number; isMe: boolean;
// }
 
// interface ActiveGame {
//   id: string; type: GameType; title: string; description: string;
//   rewardTokens: number; bonusTokens?: number; duration: number; isFlash?: boolean;
// }
 
// // ─────────────────────────────────────────────────────────────────────────────
// // HELPER COMPONENTS
// // ─────────────────────────────────────────────────────────────────────────────
 
// function Hairline({ accent = "#f59e0b" }: { accent?: string }) {
//   return <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}60 50%, transparent)` }} />;
// }
 
// function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
//   if (url) return <img src={url} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} alt={name} />;
//   const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
//   return (
//     <div className="rounded-full flex-shrink-0 flex items-center justify-center font-black"
//       style={{ width: size, height: size, background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)", fontSize: size * 0.34, color: "#f59e0b" }}>
//       {initials}
//     </div>
//   );
// }
 
// function RankMedal({ rank }: { rank: number }) {
//   if (rank === 1) return <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />;
//   if (rank === 2) return <Medal className="w-4 h-4 flex-shrink-0" style={{ color: "#94a3b8" }} />;
//   if (rank === 3) return <Medal className="w-4 h-4 flex-shrink-0" style={{ color: "#c27803" }} />;
//   return <span className="text-xs font-black tabular-nums w-4 text-center flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>#{rank}</span>;
// }
 
// // ─────────────────────────────────────────────────────────────────────────────
// // SLIDE-IN PANEL WRAPPER
// // ─────────────────────────────────────────────────────────────────────────────
 
// function SlidePanel({
//   open, onClose, title, accent = "#f59e0b", width = 360, side = "right", children,
// }: {
//   open: boolean; onClose: () => void; title: React.ReactNode;
//   accent?: string; width?: number; side?: "left" | "right"; children: React.ReactNode;
// }) {
//   return (
//     <AnimatePresence>
//       {open && (
//         <>
//           <motion.div
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             onClick={onClose}
//             className="fixed inset-0 z-[200]"
//             style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
//           />
//           <motion.div
//             initial={{ x: side === "right" ? width : -width, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             exit={{   x: side === "right" ? width : -width, opacity: 0 }}
//             transition={{ type: "spring", damping: 28, stiffness: 300 }}
//             className="fixed top-0 bottom-0 z-[201] flex flex-col overflow-hidden"
//             style={{
//               [side]: 0, width,
//               background: "rgba(8,8,12,0.98)",
//               border: `1px solid rgba(255,255,255,0.08)`,
//               borderLeft:  side === "right" ? "1px solid rgba(255,255,255,0.08)" : "none",
//               borderRight: side === "left"  ? "1px solid rgba(255,255,255,0.08)" : "none",
//               fontFamily: "'Sora', system-ui, sans-serif",
//             }}
//           >
//             <Hairline accent={accent} />
//             <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
//               style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
//               <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>{title}</div>
//               <button onClick={onClose} className="w-7 h-7 rounded-xs flex items-center justify-center transition-colors"
//                 style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
//                 onMouseEnter={e => (e.currentTarget.style.color = "white")}
//                 onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
//                 <X className="w-3.5 h-3.5" />
//               </button>
//             </div>
//             <div className="flex-1 overflow-y-auto">{children}</div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }
 
// // ─────────────────────────────────────────────────────────────────────────────
// // STATS PANEL CONTENT
// // ─────────────────────────────────────────────────────────────────────────────
 
// function StatsPanel({ stats, loading }: { stats: UserStats | null; loading: boolean }) {
//   if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;
//   if (!stats) return <div className="p-6 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No stats yet. Play a game!</div>;
 
//   const { wallet, streak, stats: s, recent, achievements, gameBreakdown } = stats;
 
//   return (
//     <div className="p-5 space-y-6">
//       {/* Wallet */}
//       <div className="rounded-xs p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
//         <p className="text-[10px] tracking-widest uppercase font-bold mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Token Wallet</p>
//         <div className="flex items-end gap-2">
//           <Coins className="w-5 h-5 text-amber-400 mb-0.5" />
//           <span className="text-4xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{wallet.balance.toLocaleString()}</span>
//           <span className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>tokens</span>
//         </div>
//         <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
//           <div style={{ color: "rgba(255,255,255,0.4)" }}>Total earned <span className="text-amber-400 font-bold">{wallet.totalEarned.toLocaleString()}</span></div>
//           <div style={{ color: "rgba(255,255,255,0.4)" }}>Total spent <span className="font-bold text-white">{wallet.totalSpent.toLocaleString()}</span></div>
//         </div>
//       </div>
 
//       {/* Streak */}
//       <div className="grid grid-cols-2 gap-2">
//         <div className="rounded-xs p-3 flex flex-col gap-1" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
//           <div className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-400" /><span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>Streak</span></div>
//           <span className="text-2xl font-black" style={{ color: "#fb923c", letterSpacing: "-0.03em" }}>{streak.current}d</span>
//         </div>
//         <div className="rounded-xs p-3 flex flex-col gap-1" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
//           <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-indigo-400" /><span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>Best</span></div>
//           <span className="text-2xl font-black" style={{ color: "#818cf8", letterSpacing: "-0.03em" }}>{streak.longest}d</span>
//         </div>
//       </div>
 
//       {/* Quick stats */}
//       <div className="grid grid-cols-2 gap-2 text-center">
//         {[
//           { label: "Games",    value: s.totalGames,           color: "#f59e0b" },
//           { label: "Avg Score", value: s.avgScore,             color: "#10b981" },
//           { label: "Tokens Won", value: s.totalEarned,         color: "#f59e0b" },
//           { label: "Win Rate",  value: `${s.winRate}%`,        color: "#6366f1" },
//         ].map(st => (
//           <div key={st.label} className="rounded-xs py-3 px-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
//             <p className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{st.label}</p>
//             <p className="text-lg font-black" style={{ color: st.color, letterSpacing: "-0.03em" }}>{typeof st.value === "number" ? st.value.toLocaleString() : st.value}</p>
//           </div>
//         ))}
//       </div>
 
//       {/* Per-game breakdown */}
//       {Object.keys(gameBreakdown).length > 0 && (
//         <div>
//           <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Per Game</p>
//           <div className="space-y-2">
//             {Object.entries(gameBreakdown).map(([type, data]) => {
//               const game = GAMES.find(g => g.type === type);
//               return (
//                 <div key={type} className="flex items-center gap-3 py-2 px-3 rounded-xs"
//                   style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
//                   <span className="text-lg flex-shrink-0">{game?.emoji ?? "🎮"}</span>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-xs font-bold text-white truncate">{game?.title ?? type}</p>
//                     <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{data.played} played · best {data.bestScore}pts</p>
//                   </div>
//                   <div className="text-xs font-black" style={{ color: game?.accent ?? "#f59e0b" }}>+{data.totalEarned}</div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}
 
//       {/* Achievements */}
//       {achievements.length > 0 && (
//         <div>
//           <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Achievements</p>
//           <div className="grid grid-cols-4 gap-2">
//             {achievements.slice(0, 8).map(a => (
//               <div key={a.id} className="flex flex-col items-center gap-1 p-2 rounded-xs"
//                 style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
//                 <span className="text-xl">{a.icon || "🏆"}</span>
//                 <span className="text-[8px] text-center leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>{a.name}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
 
//       {/* Recent history */}
//       {recent.length > 0 && (
//         <div>
//           <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Recent Plays</p>
//           <div className="space-y-1.5">
//             {recent.slice(0, 8).map(r => {
//               const game = GAMES.find(g => g.type === r.gameType);
//               return (
//                 <div key={r.id} className="flex items-center gap-3 py-2 px-3 rounded-xs"
//                   style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
//                   <span className="text-base flex-shrink-0">{game?.emoji ?? "🎮"}</span>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-xs font-bold text-white truncate">{r.gameTitle}</p>
//                     <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{r.score} pts</p>
//                   </div>
//                   <div className="text-xs font-black" style={{ color: "#f59e0b" }}>+{r.reward}</div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
 
// // ─────────────────────────────────────────────────────────────────────────────
// // LEADERBOARD PANEL CONTENT
// // ─────────────────────────────────────────────────────────────────────────────
 
// function LeaderboardPanel() {
//   const [period, setPeriod]   = useState<"all" | "week" | "month">("all");
//   const [game,   setGame]     = useState("ALL");
//   const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
//   const [myRank,  setMyRank]  = useState<number | null>(null);
//   const [total,   setTotal]   = useState(0);
//   const [loading, setLoading] = useState(true);
 
//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const r = await fetch(`/api/game/leaderboard?period=${period}&game=${game}&limit=20`);
//       const d = await r.json();
//       setEntries(d.entries ?? []);
//       setMyRank(d.myRank);
//       setTotal(d.total ?? 0);
//     } catch { /* silent */ }
//     finally { setLoading(false); }
//   }, [period, game]);
 
//   useEffect(() => { load(); }, [load]);
 
//   const periods = [{ v: "all", l: "All Time" }, { v: "week", l: "This Week" }, { v: "month", l: "This Month" }] as const;
//   const gameOptions = [{ v: "ALL", l: "All Games" }, ...GAMES.map(g => ({ v: g.type, l: g.title }))];
 
//   return (
//     <div className="p-5 space-y-4">
//       {/* Period tabs */}
//       <div className="flex gap-1 p-1 rounded-xs" style={{ background: "rgba(255,255,255,0.04)" }}>
//         {periods.map(p => (
//           <button key={p.v} onClick={() => setPeriod(p.v)}
//             className="flex-1 py-1.5 text-[11px] font-bold rounded-xs transition-all"
//             style={{
//               background: period === p.v ? "rgba(245,158,11,0.2)" : "transparent",
//               color: period === p.v ? "#f59e0b" : "rgba(255,255,255,0.35)",
//               border: period === p.v ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent",
//             }}>
//             {p.l}
//           </button>
//         ))}
//       </div>
 
//       {/* Game filter */}
//       <select value={game} onChange={e => setGame(e.target.value)}
//         className="w-full px-3 py-2 text-xs rounded-xs outline-none"
//         style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
//         {gameOptions.map(o => <option key={o.v} value={o.v} className="bg-gray-900">{o.l}</option>)}
//       </select>
 
//       {/* My rank callout */}
//       {myRank && (
//         <div className="px-3 py-2 rounded-xs text-xs font-bold"
//           style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
//           You are ranked #{myRank} of {total} players
//         </div>
//       )}
 
//       {/* Entries */}
//       {loading ? (
//         <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
//       ) : entries.length === 0 ? (
//         <div className="py-12 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No data yet</div>
//       ) : (
//         <div className="space-y-1.5">
//           {entries.map(e => (
//             <motion.div key={e.rank + e.displayName}
//               initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: e.rank * 0.03 }}
//               className="flex items-center gap-3 px-3 py-2.5 rounded-xs transition-all"
//               style={{
//                 background: e.isMe ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
//                 border: e.isMe ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.05)",
//               }}>
//               {/* Rank */}
//               <div className="w-6 flex items-center justify-center flex-shrink-0">
//                 {e.rank <= 3
//                   ? <span className="text-base">{["🥇","🥈","🥉"][e.rank - 1]}</span>
//                   : <span className="text-[11px] font-black tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>#{e.rank}</span>
//                 }
//               </div>
 
//               {/* Avatar */}
//               <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs"
//                 style={{ background: e.isMe ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.1)", color: e.isMe ? "#f59e0b" : "rgba(255,255,255,0.5)" }}>
//                 {e.displayName.charAt(0).toUpperCase()}
//               </div>
 
//               {/* Name */}
//               <div className="flex-1 min-w-0">
//                 <p className="text-xs font-bold truncate" style={{ color: e.isMe ? "#f59e0b" : "white" }}>
//                   {e.displayName} {e.isMe && "(you)"}
//                 </p>
//                 <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
//                   {e.gamesPlayed} games · avg {e.avgScore}pts
//                 </p>
//               </div>
 
//               {/* Tokens */}
//               <div className="flex items-center gap-1 flex-shrink-0">
//                 <Coins className="w-3 h-3 text-amber-400" />
//                 <span className="text-xs font-black" style={{ color: "#f59e0b" }}>{e.totalTokens.toLocaleString()}</span>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       )}
 
//       <button onClick={load} className="w-full py-2.5 rounded-xs text-xs font-bold transition-all flex items-center justify-center gap-2"
//         style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
//         onMouseEnter={e => (e.currentTarget.style.color = "white")}
//         onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
//         <RefreshCw className="w-3 h-3" /> Refresh
//       </button>
//     </div>
//   );
// }
 
// // ─────────────────────────────────────────────────────────────────────────────
// // MULTIPLAYER PANEL — all 5 games live
// // ─────────────────────────────────────────────────────────────────────────────
 
// function MultiplayerPanel() {
//   const games = [
//     { emoji: "⚔️", name: "Blitz Click War", accent: "#ef4444", desc: "Click war — bombs, shields, 30s chaos",     duration: "30s"       },
//     { emoji: "🎨", name: "Colour Duel",      accent: "#ec4899", desc: "Stroop speed — tap ink colour first",       duration: "8 rounds"  },
//     { emoji: "🔢", name: "Number Blitz",     accent: "#f59e0b", desc: "Find two tiles that sum to the target",     duration: "10 rounds" },
//     { emoji: "👻", name: "Ghost Writer",     accent: "#6366f1", desc: "Guess the hidden word from hints",          duration: "8 rounds"  },
//     { emoji: "🔀", name: "Speed Scramble",   accent: "#10b981", desc: "Unscramble the word before everyone else",  duration: "10 rounds" },
//   ];
 
//   return (
//     <div className="p-5 space-y-4">
//       {/* Live status */}
//       <div className="rounded-xs px-4 py-3 flex items-start gap-3"
//         style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
//         <div className="flex-shrink-0 mt-0.5">
//           <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 8px #10b981" }} />
//         </div>
//         <div>
//           <p className="text-xs font-black text-white mb-0.5">5 games live — all free to play</p>
//           <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
//             Create a room, share the code, battle real players. Win tokens every match.
//           </p>
//         </div>
//       </div>
 
//       {/* Game list */}
//       <div className="space-y-1.5">
//         {games.map(g => (
//           <div key={g.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xs"
//             style={{ background: `${g.accent}0d`, border: `1px solid ${g.accent}25` }}>
//             <span className="text-lg flex-shrink-0">{g.emoji}</span>
//             <div className="flex-1 min-w-0">
//               <p className="text-xs font-black text-white truncate" style={{ letterSpacing: "-0.01em" }}>{g.name}</p>
//               <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{g.desc}</p>
//             </div>
//             <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
//               <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
//                 style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
//                 Live
//               </span>
//               <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{g.duration}</span>
//             </div>
//           </div>
//         ))}
//       </div>
 
//       {/* Prize info */}
//       <div className="flex items-center gap-2 px-3 py-2 rounded-xs"
//         style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
//         <Coins className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
//         <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
//           Winner: 60% · 2nd: 25% · 3rd: 15% of prize pool
//         </p>
//       </div>
 
//       <a href="/games/multiplayer"
//         className="flex items-center justify-center gap-2 w-full py-3 rounded-xs text-sm font-black text-white"
//         style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 24px rgba(99,102,241,0.35)" }}>
//         <Swords className="w-4 h-4" /> Enter Arena
//       </a>
//     </div>
//   );
// }
 
// // ─────────────────────────────────────────────────────────────────────────────
// // GAME CARD
// // ─────────────────────────────────────────────────────────────────────────────
 
// function GameCard({ game, onPlay, stats }: {
//   game: GameDef;
//   onPlay: (g: GameDef) => void;
//   stats?: { played: number; bestScore: number; totalEarned: number };
// }) {
//   const [hovered, setHovered] = useState(false);
//   const catCfg = CATEGORY_CFG[game.category];
//   const diffLabel = ["", "Easy", "Medium", "Hard"][game.difficulty];
//   const diffColor = ["", "#10b981", "#f59e0b", "#ef4444"][game.difficulty];
 
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 16 }}
//       animate={{ opacity: 1, y: 0 }}
//       whileHover={{ y: -3 }}
//       onHoverStart={() => setHovered(true)}
//       onHoverEnd={() => setHovered(false)}
//       className="relative rounded-xs overflow-hidden cursor-pointer group"
//       onClick={() => onPlay(game)}
//       style={{
//         background: hovered
//           ? `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, ${game.accent}10 100%)`
//           : "rgba(255,255,255,0.03)",
//         border: `1px solid ${hovered ? `${game.accent}40` : "rgba(255,255,255,0.07)"}`,
//         boxShadow: hovered ? `0 8px 32px ${game.accent}20, 0 0 0 1px ${game.accent}20` : "none",
//         transition: "all 0.2s",
//       }}
//     >
//       {/* Accent top line */}
//       <div className="h-[2px]"
//         style={{ background: hovered ? `linear-gradient(90deg, ${game.accent}, transparent)` : "transparent", transition: "all 0.2s" }} />
 
//       <div className="p-4">
//         {/* Header */}
//         <div className="flex items-start justify-between mb-3">
//           <div className="flex items-center gap-3">
//             <motion.div
//               animate={{ scale: hovered ? 1.1 : 1, rotate: hovered ? 5 : 0 }}
//               className="text-3xl flex-shrink-0">{game.emoji}
//             </motion.div>
//             <div>
//               <h3 className="font-black text-white text-sm" style={{ letterSpacing: "-0.02em" }}>{game.title}</h3>
//               <div className="flex items-center gap-2 mt-0.5">
//                 <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs"
//                   style={{ background: `${catCfg.color}18`, color: catCfg.color, border: `1px solid ${catCfg.color}30` }}>
//                   {catCfg.label}
//                 </span>
//                 <span className="text-[9px] font-bold" style={{ color: diffColor }}>{diffLabel}</span>
//               </div>
//             </div>
//           </div>
//           <div className="flex items-center gap-1 flex-shrink-0">
//             <Coins className="w-3 h-3 text-amber-400" />
//             <span className="text-xs font-black" style={{ color: "#f59e0b" }}>+{game.baseReward}</span>
//           </div>
//         </div>
 
//         {/* Description */}
//         <p className="text-[11px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.38)" }}>
//           {game.description}
//         </p>
 
//         {/* Meta row */}
//         <div className="flex items-center gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
//           <div className="flex items-center gap-1">
//             <Timer className="w-3 h-3" />{game.duration}s
//           </div>
//           {stats && (
//             <>
//               <div className="flex items-center gap-1">
//                 <Target className="w-3 h-3" />{stats.played} played
//               </div>
//               {stats.bestScore > 0 && (
//                 <div className="flex items-center gap-1">
//                   <Star className="w-3 h-3 text-amber-400" />
//                   <span style={{ color: "#f59e0b" }}>Best {stats.bestScore}</span>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
 
//         {/* Play CTA — appears on hover */}
//         <motion.div
//           initial={{ opacity: 0, height: 0 }}
//           animate={{ opacity: hovered ? 1 : 0, height: hovered ? "auto" : 0 }}
//           className="overflow-hidden"
//         >
//           <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${game.accent}25` }}>
//             <div className="flex items-center justify-between">
//               <p className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.25)" }}>{game.tip}</p>
//               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs ml-3 flex-shrink-0"
//                 style={{ background: game.accent, boxShadow: `0 0 16px ${game.accent}50` }}>
//                 <Play className="w-3 h-3 text-black" />
//                 <span className="text-xs font-black text-black">Play</span>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// }
 
// // ─────────────────────────────────────────────────────────────────────────────
// // FULLSCREEN GAME OVERLAY
// // ─────────────────────────────────────────────────────────────────────────────
 
// function FullscreenGame({
//   game, onClose, onComplete,
// }: {
//   game: ActiveGame;
//   onClose: () => void;
//   onComplete: (reward: number, score: number) => void;
// }) {
//   const [phase,       setPhase]       = useState<"countdown" | "playing" | "result">("countdown");
//   const [count,       setCount]       = useState(3);
//   const [reward,      setReward]      = useState(0);
//   const [score,       setScore]       = useState(0);
//   const accent = GAMES.find(g => g.type === game.type)?.accent ?? "#f59e0b";
//   const startTime = useRef<number>(0);
 
//   // Countdown 3-2-1-GO
//   useEffect(() => {
//     if (count === 0) { setPhase("playing"); startTime.current = Date.now(); return; }
//     const t = setTimeout(() => setCount(c => c - 1), 750);
//     return () => clearTimeout(t);
//   }, [count]);
 
//   const handleComplete = useCallback((r: number, s?: number) => {
//     setReward(r); setScore(s ?? 0); setPhase("result");
//     const timeTaken = Date.now() - startTime.current;
//     setTimeout(() => onComplete(r, s ?? 0), 2000);
//     // Record to API
//     fetch("/api/game/complete", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ gameEventId: game.id, rewardEarned: r, score: s ?? 0, timeTaken, isWinner: r > 0 }),
//     }).catch(console.error);
//   }, [game.id, onComplete]);
 
//   return (
//     <motion.div
//       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//       className="fixed inset-0 z-[300] flex flex-col"
//       style={{ background: "rgba(5,5,10,0.98)", fontFamily: "'Sora', system-ui, sans-serif" }}
//     >
//       {/* Top bar */}
//       <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
//         style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.4)" }}>
//         <div className="flex items-center gap-3">
//           <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
//           <span className="font-black text-white text-sm" style={{ letterSpacing: "-0.02em" }}>{game.title}</span>
//           {game.isFlash && (
//             <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse"
//               style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>⚡ Flash</span>
//           )}
//         </div>
//         <div className="flex items-center gap-3">
//           <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
//             Up to <span style={{ color: "#f59e0b", fontWeight: 900 }}>{game.bonusTokens ?? game.rewardTokens * 2}</span> tokens
//           </div>
//           <button onClick={onClose} className="w-7 h-7 rounded-xs flex items-center justify-center transition-colors"
//             style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
//             onMouseEnter={e => (e.currentTarget.style.color = "white")}
//             onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
//             <X className="w-3.5 h-3.5" />
//           </button>
//         </div>
//       </div>
 
//       {/* Game area */}
//       <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
//         <AnimatePresence mode="wait">
//           {phase === "countdown" && (
//             <motion.div key="countdown" initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}
//               className="flex flex-col items-center gap-4">
//               <p className="text-[11px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
//                 {game.title} — Starting in
//               </p>
//               <AnimatePresence mode="wait">
//                 <motion.div key={count}
//                   initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
//                   transition={{ type: "spring", damping: 16 }}
//                   className="text-[120px] font-black tabular-nums leading-none"
//                   style={{ color: accent, textShadow: `0 0 60px ${accent}80`, letterSpacing: "-0.06em" }}>
//                   {count === 0 ? "GO!" : count}
//                 </motion.div>
//               </AnimatePresence>
//               <div className="flex gap-2">
//                 {[3,2,1].map(n => (
//                   <div key={n} className="w-2 h-2 rounded-full transition-all duration-300"
//                     style={{ background: count <= n ? accent : "rgba(255,255,255,0.15)", boxShadow: count <= n ? `0 0 8px ${accent}` : "none" }} />
//                 ))}
//               </div>
//             </motion.div>
//           )}
 
//           {phase === "playing" && (
//             <motion.div key="game" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
//               className="w-full max-w-2xl">
//               <GameFactory
//                 gameId={game.id} gameType={game.type as GameType}
//                 rewardTokens={game.rewardTokens} bonusTokens={game.bonusTokens}
//                 duration={game.duration} onComplete={handleComplete}
//                 soundEnabled={true} isFlash={game.isFlash}
//               />
//             </motion.div>
//           )}
 
//           {phase === "result" && (
//             <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//               transition={{ type: "spring", damping: 18 }}
//               className="flex flex-col items-center gap-4 text-center">
//               <motion.div
//                 animate={{ boxShadow: [`0 0 40px ${accent}60`, `0 0 80px ${accent}80`, `0 0 40px ${accent}60`] }}
//                 transition={{ repeat: Infinity, duration: 1.6 }}
//                 className="w-24 h-24 rounded-xs flex items-center justify-center"
//                 style={{ background: `${accent}20`, border: `2px solid ${accent}60` }}>
//                 <Zap className="w-12 h-12" style={{ color: accent }} />
//               </motion.div>
//               <div>
//                 <motion.p
//                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
//                   className="text-7xl font-black text-white" style={{ letterSpacing: "-0.06em" }}>
//                   +{reward}
//                 </motion.p>
//                 <p className="text-base mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>tokens earned</p>
//                 {score > 0 && <p className="text-sm mt-2 font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>{score} points</p>}
//               </div>
//               <p className="text-xs italic" style={{ color: "rgba(255,255,255,0.2)" }}>
//                 {reward >= 20 ? "Exceptional run." : reward >= 10 ? "Solid performance." : "Keep playing to improve."}
//               </p>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
 
//       {/* Bottom tip */}
//       {phase === "playing" && (
//         <div className="px-6 pb-4 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>
//           {GAMES.find(g => g.type === game.type)?.tip}
//         </div>
//       )}
//     </motion.div>
//   );
// }
 
// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN PAGE
// // ─────────────────────────────────────────────────────────────────────────────
 
// export default function GamePage() {
//   const { user, isSignedIn, isLoaded } = useUser();
 
//   const [panel,        setPanel]       = useState<Panel>("none");
//   const [activeGame,   setActiveGame]  = useState<ActiveGame | null>(null);
//   const [userStats,    setUserStats]   = useState<UserStats | null>(null);
//   const [statsLoading, setStatsLoad]   = useState(false);
//   const [filter,       setFilter]      = useState<string>("ALL");
//   const [launching,    setLaunching]   = useState<string | null>(null);
//   const [tokenBalance, setTokenBal]    = useState(0);
//   const [notification, setNotif]       = useState<{ text: string; accent: string } | null>(null);
 
//   // Load user stats
//   const loadStats = useCallback(async () => {
//     if (!isSignedIn) return;
//     setStatsLoad(true);
//     try {
//       const r = await fetch("/api/game/stats");
//       if (r.ok) {
//         const d = await r.json();
//         setUserStats(d);
//         setTokenBal(d.wallet?.balance ?? 0);
//       }
//     } catch { /* silent */ }
//     finally { setStatsLoad(false); }
//   }, [isSignedIn]);
 
//   useEffect(() => { loadStats(); }, [loadStats]);
 
//   // Launch a specific game
//   const launchGame = useCallback(async (game: GameDef) => {
//     if (!isSignedIn) return;
//     setLaunching(game.type);
//     try {
//       const r = await fetch("/api/game/play", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ gameType: game.type }),
//       });
//       if (r.ok) {
//         const d = await r.json();
//         setActiveGame(d.game);
//       }
//     } catch { /* silent */ }
//     finally { setLaunching(null); }
//   }, [isSignedIn]);
 
//   // Launch random game
//   const launchRandom = useCallback(async () => {
//     const filtered = filter === "ALL" ? GAMES : GAMES.filter(g => g.category === filter);
//     const random   = filtered[Math.floor(Math.random() * filtered.length)];
//     await launchGame(random);
//   }, [filter, launchGame]);
 
//   // Game completion
//   const handleComplete = useCallback((reward: number, score: number) => {
//     setActiveGame(null);
//     setTokenBal(prev => prev + reward);
//     setNotif({ text: `+${reward} tokens earned!`, accent: "#f59e0b" });
//     setTimeout(() => setNotif(null), 3000);
//     loadStats();
//   }, [loadStats]);
 
//   const panelToggle = (p: Panel) => setPanel(prev => prev === p ? "none" : p);
 
//   const filteredGames = filter === "ALL"
//     ? GAMES
//     : GAMES.filter(g => g.category === filter);
 
//   const categories = [
//     { v: "ALL",    l: "All Games" },
//     { v: "reflex", l: "Reflex"   },
//     { v: "memory", l: "Memory"   },
//     { v: "skill",  l: "Skill"    },
//     { v: "brain",  l: "Brain"    },
//     { v: "luck",   l: "Luck"     },
//   ];
 
//   // ── Render ─────────────────────────────────────────────────────────────────
 
//   return (
//     <div className="fixed inset-0 overflow-hidden"
//       style={{ background: "#050508", fontFamily: "'Sora', system-ui, sans-serif" }}>
 
//       {/* ── Ambient background ── */}
//       <div className="absolute inset-0 pointer-events-none overflow-hidden">
//         {/* Grid */}
//         <div className="absolute inset-0" style={{
//           backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
//           backgroundSize: "64px 64px",
//         }} />
//         {/* Orbs */}
//         <motion.div animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
//           className="absolute -top-40 right-0 w-[700px] h-[700px] rounded-full"
//           style={{ background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)", filter: "blur(40px)" }} />
//         <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full"
//           style={{ background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)", filter: "blur(50px)" }} />
//       </div>
 
//       {/* ── Top amber hairline ── */}
//       <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
//         style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.7) 40%, rgba(245,158,11,0.3) 100%)" }} />
 
//       {/* ── Header ── */}
//       <header className="relative z-10 flex items-center justify-between px-6 py-4"
//         style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.8)", backdropFilter: "blur(12px)" }}>
 
//         <div className="flex items-center gap-4">
//           <Link href="/">
//             <Home className="w-5 h-5 text-amber-400" />
//           </Link>
//           <div className="flex items-center gap-2.5">
//             <div className="w-8 h-8 rounded-xs flex items-center justify-center"
//               style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}>
//               <Gamepad2 className="w-4 h-4 text-amber-400" />
//             </div>
//             <div>
//               <h1 className="text-base font-black text-white" style={{ letterSpacing: "-0.03em" }}>Game Center</h1>
//               <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>18 games · earn tokens · climb ranks</p>
//             </div>
//           </div>
//         </div>
 
//         <div className="flex items-center gap-3">
//           {/* Token balance pill */}
//           {isSignedIn && (
//             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xs"
//               style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
//               <Coins className="w-3.5 h-3.5 text-amber-400" />
//               <span className="text-sm font-black" style={{ color: "#f59e0b", letterSpacing: "-0.02em" }}>
//                 {tokenBalance.toLocaleString()}
//               </span>
//             </div>
//           )}
 
//           {/* Panel toggles */}
//           {[
//             { id: "stats"       as Panel, icon: BarChart3, label: "Stats",  accent: "#f59e0b" },
//             { id: "leaderboard" as Panel, icon: Trophy,    label: "Ranks",  accent: "#f59e0b" },
//             { id: "multiplayer" as Panel, icon: Users,     label: "Multi",  accent: "#6366f1" },
//           ].map(({ id, icon: Icon, label, accent }) => (
//             <button key={id} onClick={() => panelToggle(id)}
//               className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-bold transition-all"
//               style={{
//                 background: panel === id ? `${accent}20` : "rgba(255,255,255,0.04)",
//                 border: `1px solid ${panel === id ? `${accent}35` : "rgba(255,255,255,0.08)"}`,
//                 color: panel === id ? accent : "rgba(255,255,255,0.45)",
//               }}>
//               <Icon className="w-3.5 h-3.5" />{label}
//             </button>
//           ))}
//         </div>
//       </header>
 
//       {/* ── Main content ── */}
//       <main className="relative z-10 flex-1 overflow-y-auto" style={{ height: "calc(100vh - 65px)" }}>
//         <div className="max-w-6xl mx-auto px-6 py-6">
 
//           {/* Hero banner */}
//           <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
//             className="relative rounded-xs overflow-hidden mb-6 p-6"
//             style={{
//               background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(99,102,241,0.06) 100%)",
//               border: "1px solid rgba(245,158,11,0.18)",
//             }}>
//             <div className="h-[2px] absolute top-0 left-0 right-0" style={{ background: "linear-gradient(90deg, #f59e0b, #f59e0b80 50%, transparent)" }} />
 
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//               <div>
//                 <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
//                   {isSignedIn ? `Welcome back, ${user?.firstName ?? "Player"}` : "Play · Earn · Compete"}
//                 </p>
//                 <h2 className="text-2xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>
//                   {isSignedIn
//                     ? userStats ? `${userStats.stats.totalGames} games played · ${userStats.streak.current}d streak` : "Loading your stats…"
//                     : "11 games. Infinite tokens. One leaderboard."}
//                 </h2>
//                 {!isSignedIn && (
//                   <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
//                     Sign in to save your progress and earn tokens.
//                   </p>
//                 )}
//               </div>
 
//               <div className="flex gap-2 flex-shrink-0">
//                 <motion.button
//                   whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
//                   onClick={launchRandom}
//                   disabled={!isSignedIn}
//                   className="flex items-center gap-2 px-5 py-2.5 rounded-xs text-sm font-black text-black transition-all disabled:opacity-40"
//                   style={{ background: "#f59e0b", boxShadow: "0 0 24px rgba(245,158,11,0.4)" }}>
//                   <Shuffle className="w-4 h-4" /> Random Game
//                 </motion.button>
//               </div>
//             </div>
 
//             {/* Stat chips */}
//             {isSignedIn && userStats && (
//               <div className="flex flex-wrap gap-2 mt-4">
//                 {[
//                   { icon: Coins,   val: `${userStats.wallet.balance.toLocaleString()}`,   label: "tokens",   col: "#f59e0b" },
//                   { icon: Flame,   val: `${userStats.streak.current}d`,                   label: "streak",   col: "#f97316" },
//                   { icon: Trophy,  val: `${userStats.stats.totalGames}`,                  label: "games",    col: "#6366f1" },
//                   { icon: TrendingUp, val: `${userStats.stats.avgScore}`,                 label: "avg score",col: "#10b981" },
//                 ].map(s => (
//                   <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-[11px]"
//                     style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
//                     <s.icon className="w-3 h-3" style={{ color: s.col }} />
//                     <span className="font-black" style={{ color: s.col }}>{s.val}</span>
//                     <span style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </motion.div>
 
//           {/* Auth gate */}
//           {!isSignedIn && isLoaded && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//               className="rounded-xs p-6 mb-6 text-center"
//               style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
//               <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
//               <p className="text-white font-bold mb-1">Sign in to play and save your progress</p>
//               <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Your tokens, streak, and leaderboard rank are tied to your account.</p>
//               <a href="/sign-in" className="inline-block px-6 py-2.5 rounded-xs text-sm font-black text-black"
//                 style={{ background: "#f59e0b", boxShadow: "0 0 20px rgba(245,158,11,0.35)" }}>
//                 Sign In to Play
//               </a>
//             </motion.div>
//           )}
 
//           {/* Category filter */}
//           <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
//             {categories.map(c => {
//               const catCfg = c.v !== "ALL" ? CATEGORY_CFG[c.v as keyof typeof CATEGORY_CFG] : null;
//               const active = filter === c.v;
//               return (
//                 <button key={c.v} onClick={() => setFilter(c.v)}
//                   className="flex-shrink-0 px-4 py-1.5 rounded-xs text-xs font-bold transition-all"
//                   style={{
//                     background: active ? `${catCfg?.color ?? "#f59e0b"}20` : "rgba(255,255,255,0.04)",
//                     border: `1px solid ${active ? `${catCfg?.color ?? "#f59e0b"}40` : "rgba(255,255,255,0.08)"}`,
//                     color: active ? (catCfg?.color ?? "#f59e0b") : "rgba(255,255,255,0.4)",
//                   }}>
//                   {c.l}
//                 </button>
//               );
//             })}
//           </div>
 
//           {/* Game grid */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//             {filteredGames.map((game, i) => (
//               <motion.div key={game.type}
//                 initial={{ opacity: 0, y: 16 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: i * 0.04 }}>
//                 <GameCard
//                   game={game}
//                   onPlay={isSignedIn ? launchGame : () => {}}
//                   stats={userStats?.gameBreakdown[game.type]}
//                 />
//                 {launching === game.type && (
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
//                   </div>
//                 )}
//               </motion.div>
//             ))}
//           </div>
 
//           {/* Multiplayer banner — 5 games live */}
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
//             className="mt-6 rounded-xs overflow-hidden"
//             style={{ border: "1px solid rgba(99,102,241,0.25)" }}>
//             <div className="h-[2px]" style={{ background: "linear-gradient(90deg, #6366f1, #ec4899 50%, #10b981 100%)" }} />
//             <div className="px-5 py-4"
//               style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(236,72,153,0.04) 50%, rgba(16,185,129,0.04) 100%)" }}>
//               {/* Top row: title + CTA */}
//               <div className="flex items-center justify-between gap-4 mb-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-xs flex items-center justify-center flex-shrink-0"
//                     style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
//                     <Swords className="w-5 h-5 text-indigo-400" />
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <p className="font-black text-white text-sm" style={{ letterSpacing: "-0.02em" }}>Multiplayer Arena</p>
//                       <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
//                         style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
//                         5 Games Live
//                       </span>
//                     </div>
//                     <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
//                       Real-time · Token prizes · Up to 6 players per room
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex gap-2 flex-shrink-0">
//                   <button onClick={() => panelToggle("multiplayer")}
//                     className="flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-bold"
//                     style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
//                     <ChevronRight className="w-3 h-3" /> Details
//                   </button>
//                   <a href="/games/multiplayer"
//                     className="flex items-center gap-1.5 px-4 py-2 rounded-xs text-xs font-black text-white"
//                     style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
//                     <Swords className="w-3.5 h-3.5" /> Play Now
//                   </a>
//                 </div>
//               </div>
//               {/* Game pill row */}
//               <div className="flex flex-wrap gap-2">
//                 {([
//                   { emoji: "⚔️", name: "Blitz Click War", accent: "#ef4444" },
//                   { emoji: "🎨", name: "Colour Duel",      accent: "#ec4899" },
//                   { emoji: "🔢", name: "Number Blitz",     accent: "#f59e0b" },
//                   { emoji: "👻", name: "Ghost Writer",     accent: "#6366f1" },
//                   { emoji: "🔀", name: "Speed Scramble",   accent: "#10b981" },
//                 ] as const).map(g => (
//                   <a key={g.name} href="/games/multiplayer"
//                     className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs text-[11px] font-bold transition-all"
//                     style={{ background: `${g.accent}12`, border: `1px solid ${g.accent}30`, color: "rgba(255,255,255,0.7)" }}
//                     onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${g.accent}22`; }}
//                     onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${g.accent}12`; }}>
//                     <span>{g.emoji}</span>{g.name}
//                   </a>
//                 ))}
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </main>
 
//       {/* ── Slide panels ── */}
//       <SlidePanel open={panel === "stats"} onClose={() => setPanel("none")}
//         title={<div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-400" /> Your Stats</div>}
//         accent="#f59e0b">
//         <StatsPanel stats={userStats} loading={statsLoading} />
//       </SlidePanel>
 
//       <SlidePanel open={panel === "leaderboard"} onClose={() => setPanel("none")}
//         title={<div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Leaderboard</div>}
//         accent="#f59e0b" width={380}>
//         <LeaderboardPanel />
//       </SlidePanel>
 
//       <SlidePanel open={panel === "multiplayer"} onClose={() => setPanel("none")}
//         title={<div className="flex items-center gap-2"><Swords className="w-4 h-4 text-indigo-400" /> Multiplayer</div>}
//         accent="#6366f1">
//         <MultiplayerPanel />
//       </SlidePanel>
 
//       {/* ── Fullscreen game overlay ── */}
//       <AnimatePresence>
//         {activeGame && (
//           <FullscreenGame
//             game={activeGame}
//             onClose={() => setActiveGame(null)}
//             onComplete={handleComplete}
//           />
//         )}
//       </AnimatePresence>
 
//       {/* ── Token notification ── */}
//       <AnimatePresence>
//         {notification && (
//           <motion.div
//             initial={{ opacity: 0, y: 12, x: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
//             className="fixed bottom-6 left-6 z-[400] flex items-center gap-3 px-4 py-3 rounded-xs"
//             style={{
//               background: "rgba(10,10,14,0.97)",
//               border: `1px solid ${notification.accent}35`,
//               boxShadow: `0 0 32px ${notification.accent}20, 0 16px 40px rgba(0,0,0,0.5)`,
//             }}>
//             <div className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-xs"
//               style={{ background: `linear-gradient(90deg, ${notification.accent}, transparent)` }} />
//             <Zap className="w-4 h-4 flex-shrink-0" style={{ color: notification.accent }} />
//             <span className="text-sm font-black text-white" style={{ letterSpacing: "-0.02em" }}>{notification.text}</span>
//             <motion.div className="absolute bottom-0 left-0 h-[2px] rounded-b-xs"
//               style={{ background: notification.accent }}
//               initial={{ width: "100%" }} animate={{ width: "0%" }}
//               transition={{ duration: 3, ease: "linear" }} />
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
 