// =============================================================================
// MULTIPLAYER PAGE — app/games/multiplayer/page.tsx
// Dedicated arena for real-time multiplayer gaming.
// Aesthetic: Deep space dark · electric indigo/cyan accents · war-room energy
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
  Swords, Users, Trophy, Coins, Zap, Crown, Timer,
  Copy, Check, RefreshCw, ArrowLeft, Play, Lock,
  Eye, Target, Star, Gamepad2, ChevronRight, Shield,
  Radio, Wifi, Circle, TrendingUp, Medal,
} from "lucide-react";
import Link from "next/link";
import { buildRound, ColourDuel } from "./_multiplayer-games/color-duel-game";
import { BlitzClickWar } from "./_multiplayer-games/blitz-click";
import { NumberBlitz } from "./_multiplayer-games/number-blitz";
import { GhostWriter } from "./_multiplayer-games/ghost-winter";
import { SpeedScramble } from "./_multiplayer-games/speed-scramble";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
 
interface Room {
  id: string; code: string; gameType: string; status: string;
  hostId: string; maxPlayers: number; entryFee: number; prizePool: number;
  config: Record<string, unknown> | null;
  roundData: unknown | null;
  startedAt: string | null; endedAt: string | null;
}
 
interface RoomPlayer {
  userId: string; displayName: string; avatarUrl: string | null;
  score: number; isReady: boolean; isAlive: boolean;
}
 
interface RoomListItem {
  id: string; code: string; gameType: string;
  playerCount: number; maxPlayers: number;
  entryFee: number; prizePool: number;
  players: { displayName: string }[];
}
 
interface MultiplayerResult {
  userId: string; displayName: string; finalScore: number; rank: number; tokensEarned: number;
}
 
type PageView = "lobby" | "room" | "playing" | "results";
 
// ─────────────────────────────────────────────────────────────────────────────
// GAME CATALOGUE  (5 games)
// ─────────────────────────────────────────────────────────────────────────────
 
const MP_GAMES = [
  {
    type:        "BLITZ_CLICK_WAR",
    name:        "Blitz Click War",
    emoji:       "⚔️",
    accent:      "#ef4444",
    description: "Race to the highest click score. Bombs sabotage, shields protect. 30s of chaos.",
    players:     "2–6",
    duration:    "30s",
    rules:       ["Click targets to score pts", "Gold = 25pts · Normal = 10pts", "Bombs = −15pts", "Shield blocks next bomb", "Highest score wins"],
    prize:       "1st: 60% · 2nd: 25% · 3rd: 15%",
  },
  {
    type:        "COLOUR_DUEL",
    name:        "Colour Duel",
    emoji:       "🎨",
    accent:      "#ec4899",
    description: "Tap the ink colour before anyone else. The Stroop effect makes it brutally hard.",
    players:     "2–6",
    duration:    "8 rounds",
    rules:       ["Same word shown to all players", "Tap the INK colour, not the word", "Fastest correct = more points", "Wrong = −5pts", "8 rounds total"],
    prize:       "1st: 60% · 2nd: 25% · 3rd: 15%",
  },
  {
    type:        "NUMBER_BLITZ",
    name:        "Number Blitz",
    emoji:       "🔢",
    accent:      "#f59e0b",
    description: "A number appears. Find two tiles in the grid that add up to it. First wins.",
    players:     "2–6",
    duration:    "10 rounds",
    rules:       ["Pick TWO tiles that sum to the target", "First correct pair wins the round", "Wrong pair = −5pts (you can retry)", "Speed bonus on top of base pts", "10 rounds, targets get harder"],
    prize:       "1st: 60% · 2nd: 25% · 3rd: 15%",
  },
  {
    type:        "GHOST_WRITER",
    name:        "Ghost Writer",
    emoji:       "👻",
    accent:      "#6366f1",
    description: "Guess the hidden word from its category and letter count. Type it first to win.",
    players:     "2–6",
    duration:    "8 rounds",
    rules:       ["Category + letter count shown", "First letter hint reveals after 3s", "Type your guess and press Go / Enter", "First correct guess wins the round", "Wrong guess = −3pts, 8 rounds"],
    prize:       "1st: 60% · 2nd: 25% · 3rd: 15%",
  },
  {
    type:        "SPEED_SCRAMBLE",
    name:        "Speed Scramble",
    emoji:       "🔀",
    accent:      "#10b981",
    description: "Unscramble the same word as everyone else. Solve first for maximum points.",
    players:     "2–6",
    duration:    "10 rounds",
    rules:       ["Same scrambled word shown to all", "Type the unscrambled word", "1st: 50pts · 2nd: 35pts · 3rd: 20pts", "Wrong guess = −5pts + 2s lockout", "Words get longer each round"],
    prize:       "1st: 60% · 2nd: 25% · 3rd: 15%",
  },
];
 
const PLAYER_COLORS = ["#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899"];
 
// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
 
function Hairline({ accent = "#6366f1" }: { accent?: string }) {
  return <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}50 60%, transparent)` }} />;
}
 
function PlayerDot({ displayName, color, isReady, isMe }: {
  displayName: string; color: string; isReady?: boolean; isMe?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center rounded-full font-black"
        style={{ width: 36, height: 36, background: `${color}25`, border: `2px solid ${color}`, fontSize: 14, color, boxShadow: `0 0 12px ${color}40` }}>
        {displayName.charAt(0).toUpperCase()}
        {isReady !== undefined && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 flex items-center justify-center"
            style={{ background: isReady ? "#10b981" : "#374151", borderColor: "#0a0a14" }}>
            {isReady && <Check className="w-1.5 h-1.5 text-white" />}
          </div>
        )}
      </div>
      <p className="text-[11px] font-bold" style={{ color: isMe ? color : "rgba(255,255,255,0.7)", lineHeight: 1 }}>
        {isMe ? "You" : displayName.split(" ")[0]}
      </p>
    </div>
  );
}
 
// ─────────────────────────────────────────────────────────────────────────────
// RESULTS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
 
function ResultsScreen({ results, myUserId, gameType, onPlayAgain, onBackToLobby }: {
  results: MultiplayerResult[]; myUserId: string; gameType: string;
  onPlayAgain: () => void; onBackToLobby: () => void;
}) {
  const me   = results.find(r => r.userId === myUserId);
  const game = MP_GAMES.find(g => g.type === gameType);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8 px-4 max-w-lg mx-auto w-full">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14, delay: 0.1 }}
        className="flex flex-col items-center gap-2">
        <div className="text-6xl">{game?.emoji}</div>
        <h2 className="text-2xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>
          {results[0]?.userId === myUserId ? "Victory!" : "Match Over"}
        </h2>
        {me && <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          You finished #{me.rank} · {me.finalScore} pts
        </p>}
      </motion.div>
      {me && me.tokensEarned > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex items-center gap-3 px-6 py-3 rounded-xs"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <Coins className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-2xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>+{me.tokensEarned}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>tokens earned</p>
          </div>
        </motion.div>
      )}
      <div className="w-full space-y-2">
        {results.map((r, i) => (
          <motion.div key={r.userId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xs"
            style={{ background: r.userId === myUserId ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)", border: r.userId === myUserId ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-xl w-8 text-center flex-shrink-0">{["🥇","🥈","🥉"][i] ?? `#${i+1}`}</span>
            <div className="flex-1">
              <p className="text-sm font-black text-white">{r.userId === myUserId ? "You" : r.displayName}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{r.finalScore} pts</p>
            </div>
            {r.tokensEarned > 0 && (
              <div className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-black" style={{ color: "#f59e0b" }}>+{r.tokensEarned}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex gap-3 w-full">
        <button onClick={onBackToLobby} className="flex-1 py-3 rounded-xs text-sm font-bold"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          Back to Lobby
        </button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onPlayAgain}
          className="flex-1 py-3 rounded-xs text-sm font-black text-white"
          style={{ background: "#6366f1", boxShadow: "0 0 24px rgba(99,102,241,0.4)" }}>
          Play Again
        </motion.button>
      </div>
    </motion.div>
  );
}
 
// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
 
export default function MultiplayerPage() {
  const { user, isSignedIn, isLoaded } = useUser();
 
  const [view,         setView]        = useState<PageView>("lobby");
  const [rooms,        setRooms]       = useState<RoomListItem[]>([]);
  const [currentRoom,  setCurrentRoom] = useState<Room | null>(null);
  const [roomPlayers,  setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [results,      setResults]     = useState<MultiplayerResult[]>([]);
  const [joinCode,     setJoinCode]    = useState("");
  const [creating,     setCreating]    = useState(false);
  const [joining,      setJoining]     = useState(false);
  const [codeCopied,   setCodeCopied]  = useState(false);
  const [selectedGame, setSelectedGame]= useState(MP_GAMES[0]);
  const [entryFee,     setEntryFee]    = useState(0);
  const [myScore,      setMyScore]     = useState(0);
  const [starting,     setStarting]    = useState(false);
 
  const pollRef       = useRef<NodeJS.Timeout | null>(null);
  const pingRef       = useRef<NodeJS.Timeout | null>(null);
  const hostRef       = useRef(false);
  const viewRef       = useRef<PageView>("lobby");
  const myDbUserIdRef = useRef<string>("");
 
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { if (user?.id) {} }, [user?.id]); // Clerk ID — DB ID resolved on join/create
 
  const loadRooms = useCallback(async () => {
    try {
      const r = await fetch("/api/multiplayer/rooms");
      if (r.ok) { const d = await r.json(); setRooms(d.rooms ?? []); }
    } catch { /* silent */ }
  }, []);
 
  useEffect(() => {
    if (view === "lobby") { loadRooms(); const t = setInterval(loadRooms, 5000); return () => clearInterval(t); }
  }, [view, loadRooms]);
 
  const pollRoom = useCallback(async () => {
    if (!currentRoom?.code) return;
    try {
      const r = await fetch(`/api/multiplayer/rooms/${currentRoom.code}`);
      if (!r.ok) return;
      const d = await r.json();
      setCurrentRoom(d.room);
      setRoomPlayers(d.players ?? []);
      const cv = viewRef.current;
      if ((d.room.status === "COUNTDOWN" || d.room.status === "PLAYING") && cv === "room") { setView("playing"); }
      if (d.room.status === "RESULTS" && cv === "playing") { setView("results"); setResults(d.results ?? []); stopPoll(); }
    } catch { /* silent */ }
  }, [currentRoom?.code]);
 
  const startPoll = useCallback(() => { if (pollRef.current) clearInterval(pollRef.current); pollRef.current = setInterval(pollRoom, 800); }, [pollRoom]);
  const stopPoll  = useCallback(() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }, []);
 
  useEffect(() => { if ((view === "room" || view === "playing") && currentRoom) startPoll(); return stopPoll; }, [view, currentRoom?.code]);
 
  useEffect(() => {
    if (!currentRoom?.code || view === "lobby" || view === "results") return;
    const ping = () => fetch(`/api/multiplayer/rooms/${currentRoom.code}/ping`, { method: "POST" }).catch(() => {});
    ping();
    pingRef.current = setInterval(ping, 5000);
    return () => { if (pingRef.current) clearInterval(pingRef.current); };
  }, [currentRoom?.code, view]);
 
  const handleCreate = async () => {
    if (!isSignedIn) return;
    setCreating(true);
    try {
      const r = await fetch("/api/multiplayer/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameType: selectedGame.type, maxPlayers: 6, entryFee }) });
      if (r.ok) {
        const d = await r.json();
        if (d.dbUserId) myDbUserIdRef.current = d.dbUserId;
        setCurrentRoom({ ...d.room, status: "WAITING", hostId: d.room.hostId ?? d.dbUserId, maxPlayers: 6, entryFee, prizePool: entryFee, config: null, roundData: null, startedAt: null, endedAt: null });
        hostRef.current = true;
        setView("room");
      }
    } catch { /* silent */ } finally { setCreating(false); }
  };
 
  const handleJoin = async (code: string) => {
    if (!isSignedIn) return;
    setJoining(true);
    try {
      const r = await fetch(`/api/multiplayer/rooms/${code}/join`, { method: "POST" });
      if (r.ok) {
        const jd = await r.json();
        if (jd.dbUserId) myDbUserIdRef.current = jd.dbUserId;
        const roomRes = await fetch(`/api/multiplayer/rooms/${code}`);
        if (roomRes.ok) { const d = await roomRes.json(); setCurrentRoom(d.room); setRoomPlayers(d.players ?? []); hostRef.current = false; setView("room"); }
      }
    } catch { /* silent */ } finally { setJoining(false); setJoinCode(""); }
  };
 
  const handleReady = async () => {
    if (!currentRoom) return;
    await fetch(`/api/multiplayer/rooms/${currentRoom.code}/ready`, { method: "POST" });
    await pollRoom();
  };
 
  const handleStart = async () => {
    if (!currentRoom || starting) return;
    setStarting(true);
    try {
      const r = await fetch(`/api/multiplayer/rooms/${currentRoom.code}/start`, { method: "POST" });
      if (r.ok) await pollRoom();
    } catch { /* silent */ } finally { setStarting(false); }
  };
 
  const handleScoreUpdate = useCallback(async (score: number, isFinal = false) => {
    if (!currentRoom) return;
    await fetch(`/api/multiplayer/rooms/${currentRoom.code}/score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score, isFinal }) }).catch(() => {});
  }, [currentRoom]);
 
  const handleGameComplete = useCallback((finalScore: number) => { setMyScore(finalScore); handleScoreUpdate(finalScore, true); }, [handleScoreUpdate]);
  const handleRoundAnswer  = useCallback(async () => { /* component handles internally */ }, []);
  const copyCode = () => { if (currentRoom) { navigator.clipboard.writeText(currentRoom.code); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); } };
 
  const myDbUserId   = myDbUserIdRef.current;
  const me           = roomPlayers.find(p => p.userId === myDbUserId);
  const isHostNow    = !!currentRoom && currentRoom.hostId === myDbUserId;
  const myPlayerData = roomPlayers.map((p, i) => ({ ...p, isMe: p.userId === myDbUserId, color: PLAYER_COLORS[i % PLAYER_COLORS.length] }));
 
  // ── RENDER ──────────────────────────────────────────────────────────────────
 
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#03030a", fontFamily: "'Sora', system-ui, sans-serif" }}>
 
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.022) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <motion.div animate={{ opacity: [0.5,0.8,0.5], scale: [1,1.06,1] }} transition={{ repeat: Infinity, duration: 12 }}
          className="absolute -top-40 -right-20 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 60%)", filter: "blur(50px)" }} />
      </div>
      <div className="absolute top-0 left-0 right-0 h-[2px] z-10" style={{ background: "linear-gradient(90deg, transparent, #6366f1 40%, #6366f150 100%)" }} />
 
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(3,3,10,0.85)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <Link href="/games" className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e=>(e.currentTarget.style.color="white")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.35)")}>
            <ArrowLeft className="w-3.5 h-3.5" /> Games
          </Link>
          <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.1)" }} />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xs flex items-center justify-center" style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.3)" }}>
              <Swords className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white" style={{ letterSpacing: "-0.03em" }}>Multiplayer Arena</h1>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>5 games · Real-time · Token prizes</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px #10b981" }} />
          <span className="text-[10px] font-bold text-emerald-400">{rooms.length} open rooms</span>
        </div>
      </header>
 
      {/* Main */}
      <main className="relative z-10 overflow-y-auto" style={{ height: "calc(100vh - 57px)" }}>
        <AnimatePresence mode="wait">
 
          {/* ══ LOBBY ══════════════════════════════════════════════════════ */}
          {view === "lobby" && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="max-w-5xl mx-auto px-6 py-6 space-y-6">
 
              {!isSignedIn && isLoaded && (
                <div className="rounded-xs p-6 text-center" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Lock className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
                  <p className="font-black text-white mb-1">Sign in to play multiplayer</p>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Your wins, tokens, and rank are saved to your account.</p>
                  <a href="/sign-in" className="inline-block px-6 py-2.5 rounded-xs text-sm font-black text-white" style={{ background: "#6366f1", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>Sign In</a>
                </div>
              )}
 
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CREATE */}
                <div className="rounded-xs overflow-hidden" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}>
                  <Hairline accent="#6366f1" />
                  <div className="px-5 pt-4 pb-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xs flex items-center justify-center" style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
                        <Play className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <h2 className="text-base font-black text-white" style={{ letterSpacing: "-0.03em" }}>Create Room</h2>
                    </div>
 
                    {/* Game picker — 5 games in 2-col grid */}
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Choose Game</p>
                      <div className="grid grid-cols-1 gap-2">
                        {MP_GAMES.map(g => (
                          <button key={g.type} onClick={() => setSelectedGame(g)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xs transition-all text-left"
                            style={{ background: selectedGame.type === g.type ? `${g.accent}15` : "rgba(255,255,255,0.03)", border: `1px solid ${selectedGame.type === g.type ? `${g.accent}40` : "rgba(255,255,255,0.07)"}` }}>
                            <span className="text-xl flex-shrink-0">{g.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-white" style={{ letterSpacing: "-0.02em" }}>{g.name}</p>
                              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{g.description}</p>
                            </div>
                            <div className="flex gap-2 text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                              <span>{g.players}</span>
                              <span>{g.duration}</span>
                            </div>
                            {selectedGame.type === g.type && <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: g.accent }}><Check className="w-2.5 h-2.5 text-black" /></div>}
                          </button>
                        ))}
                      </div>
                    </div>
 
                    {/* Entry fee */}
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Entry Fee</p>
                      <div className="flex gap-2">
                        {[0, 5, 10, 25].map(fee => (
                          <button key={fee} onClick={() => setEntryFee(fee)} className="flex-1 py-2 rounded-xs text-xs font-bold"
                            style={{ background: entryFee === fee ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)", border: `1px solid ${entryFee === fee ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`, color: entryFee === fee ? "#818cf8" : "rgba(255,255,255,0.4)" }}>
                            {fee === 0 ? "Free" : `${fee}🪙`}
                          </button>
                        ))}
                      </div>
                    </div>
 
                    {/* Rules preview */}
                    <div className="px-3 py-2.5 rounded-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Rules</p>
                      <ul className="space-y-1">
                        {selectedGame.rules.map(r => (
                          <li key={r} className="flex items-start gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                            <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedGame.accent }} />{r}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] mt-2 font-bold" style={{ color: selectedGame.accent }}>{selectedGame.prize}</p>
                    </div>
 
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={creating || !isSignedIn}
                      className="w-full py-3 rounded-xs text-sm font-black text-white disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: "#6366f1", boxShadow: "0 0 24px rgba(99,102,241,0.35)" }}>
                      {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</> : <><Swords className="w-4 h-4" />Create Room</>}
                    </motion.button>
                  </div>
                </div>
 
                {/* JOIN */}
                <div className="space-y-4">
                  <div className="rounded-xs overflow-hidden" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.18)" }}>
                    <Hairline accent="#10b981" />
                    <div className="px-5 pt-4 pb-4">
                      <h3 className="text-sm font-black text-white mb-3" style={{ letterSpacing: "-0.02em" }}>Join with Code</h3>
                      <div className="flex gap-2">
                        <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().slice(0,4))} placeholder="XXXX" maxLength={4}
                          className="flex-1 px-3 py-2.5 rounded-xs text-base font-black text-white text-center tracking-[0.3em] outline-none uppercase"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(16,185,129,0.3)" }}
                          onKeyDown={e=>e.key==="Enter"&&joinCode.length===4&&handleJoin(joinCode)} />
                        <motion.button whileTap={{ scale: 0.97 }} onClick={()=>joinCode.length===4&&handleJoin(joinCode)} disabled={joinCode.length<4||joining||!isSignedIn}
                          className="px-5 py-2.5 rounded-xs text-sm font-black text-white disabled:opacity-40"
                          style={{ background: "#10b981", boxShadow: "0 0 16px rgba(16,185,129,0.3)" }}>
                          {joining ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Join"}
                        </motion.button>
                      </div>
                    </div>
                  </div>
 
                  <div className="rounded-xs overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                      <h3 className="text-sm font-black text-white" style={{ letterSpacing: "-0.02em" }}>Open Rooms</h3>
                      <button onClick={loadRooms} className="text-xs font-bold flex items-center gap-1" style={{ color: "rgba(255,255,255,0.3)" }}
                        onMouseEnter={e=>(e.currentTarget.style.color="white")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.3)")}>
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                    </div>
                    <div className="px-3 pb-4 space-y-2 max-h-80 overflow-y-auto">
                      {rooms.length === 0 ? (
                        <div className="py-8 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>No open rooms. Create the first one!</div>
                      ) : rooms.map(r => {
                        const game = MP_GAMES.find(g => g.type === r.gameType);
                        return (
                          <motion.div key={r.id} whileHover={{ x: 2 }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xs cursor-pointer"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                            onClick={() => handleJoin(r.code)}>
                            <span className="text-xl flex-shrink-0">{game?.emoji ?? "🎮"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-white">{game?.name ?? r.gameType}</p>
                              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                {r.playerCount}/{r.maxPlayers} players{r.entryFee > 0 && ` · ${r.entryFee}🪙`}{r.prizePool > 0 && ` · ${r.prizePool}🪙 pool`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs font-black tracking-widest px-2 py-0.5 rounded-xs"
                                style={{ background: `${game?.accent ?? "#6366f1"}20`, color: game?.accent ?? "#818cf8" }}>{r.code}</code>
                              <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
 
          {/* ══ ROOM LOBBY ══════════════════════════════════════════════════ */}
          {view === "room" && currentRoom && (
            <motion.div key="room" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto px-6 py-8 space-y-5">
              {(() => {
                const g          = MP_GAMES.find(x => x.type === currentRoom.gameType);
                const readyCount = roomPlayers.filter(p => p.isReady).length;
                const total      = roomPlayers.length;
                const canStart   = isHostNow && total >= 2;
                const allReady   = total >= 2 && readyCount === total;
                const subtitle   = total < 2 ? "Waiting for another player…" : allReady ? "Everyone ready! Host can start." : isHostNow ? `${readyCount}/${total} ready — you can start anytime.` : `${readyCount}/${total} players ready…`;
                return (
                  <>
                    <div className="text-center space-y-2">
                      <div className="text-5xl mb-2">{g?.emoji}</div>
                      <h2 className="text-2xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{g?.name}</h2>
                      <motion.p key={subtitle} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-sm" style={{ color: allReady ? "#10b981" : "rgba(255,255,255,0.4)" }}>{subtitle}</motion.p>
                    </div>
 
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-3 px-6 py-3 rounded-xs" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>Room Code — Share this</p>
                          <p className="text-3xl font-black text-white" style={{ letterSpacing: "0.25em" }}>{currentRoom.code}</p>
                        </div>
                        <button onClick={copyCode} className="w-9 h-9 rounded-xs flex items-center justify-center"
                          style={{ background: codeCopied ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)", border: `1px solid ${codeCopied ? "rgba(16,185,129,0.4)" : "rgba(99,102,241,0.3)"}`, color: codeCopied ? "#10b981" : "#818cf8" }}>
                          {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
 
                    <div className="rounded-xs p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-4 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>{total}/{currentRoom.maxPlayers} Players</p>
                      <div className="flex flex-wrap justify-center gap-5">
                        {roomPlayers.map((p,i) => <PlayerDot key={p.userId} displayName={p.displayName} color={PLAYER_COLORS[i%PLAYER_COLORS.length]} isReady={p.isReady} isMe={p.userId===myDbUserId} />)}
                        {Array.from({ length: Math.max(0, currentRoom.maxPlayers - total) }).map((_,i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: "2px dashed rgba(255,255,255,0.12)" }}>
                              <Users className="w-4 h-4" style={{ color: "rgba(255,255,255,0.12)" }} />
                            </div>
                            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>Empty</p>
                          </div>
                        ))}
                      </div>
                    </div>
 
                    <div className="space-y-2">
                      {isHostNow && (
                        <motion.button whileHover={{ scale: canStart ? 1.02 : 1 }} whileTap={{ scale: canStart ? 0.98 : 1 }} onClick={handleStart} disabled={!canStart || starting}
                          className="w-full py-3.5 rounded-xs text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{ background: canStart ? (allReady ? "#10b981" : "#6366f1") : "rgba(255,255,255,0.06)", color: canStart ? "white" : "rgba(255,255,255,0.3)", boxShadow: canStart ? `0 0 28px ${allReady ? "rgba(16,185,129,0.4)" : "rgba(99,102,241,0.4)"}` : "none" }}>
                          {starting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Starting…</> : canStart ? <><Play className="w-4 h-4" />Start Game Now</> : <><Users className="w-4 h-4" />Need 2+ players</>}
                        </motion.button>
                      )}
                      {!isHostNow && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReady}
                          className="w-full py-3.5 rounded-xs text-sm font-black flex items-center justify-center gap-2"
                          style={{ background: me?.isReady ? "rgba(16,185,129,0.12)" : "#6366f1", border: me?.isReady ? "1px solid rgba(16,185,129,0.3)" : "none", color: me?.isReady ? "#10b981" : "white", boxShadow: me?.isReady ? "none" : "0 0 24px rgba(99,102,241,0.4)" }}>
                          {me?.isReady ? <><Check className="w-4 h-4" />Ready! Waiting for host…</> : <><Shield className="w-4 h-4" />Mark as Ready</>}
                        </motion.button>
                      )}
                      {isHostNow && (
                        <button onClick={handleReady} className="w-full py-2 text-xs font-bold text-center rounded-xs"
                          style={{ background: me?.isReady ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)", border: me?.isReady ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.07)", color: me?.isReady ? "#10b981" : "rgba(255,255,255,0.35)" }}>
                          {me?.isReady ? "✓ You are ready" : "Mark yourself ready (optional)"}
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
              <button onClick={() => { stopPoll(); setView("lobby"); setCurrentRoom(null); }} className="w-full py-2 text-xs font-bold text-center"
                style={{ color: "rgba(255,255,255,0.22)" }}
                onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.55)")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.22)")}>
                ← Leave room
              </button>
            </motion.div>
          )}
 
          {/* ══ PLAYING ═════════════════════════════════════════════════════ */}
          {view === "playing" && currentRoom && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.5)" }}>
                <div className="flex items-center gap-2">
                  {(() => { const g = MP_GAMES.find(x => x.type === currentRoom.gameType); return <><span className="text-base">{g?.emoji}</span><span className="text-xs font-black text-white">{g?.name}</span></>; })()}
                </div>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Live · {roomPlayers.length} players
                </div>
              </div>
              <div className="flex-1 p-4 overflow-hidden" style={{ minHeight: 0 }}>
                {currentRoom.gameType === "BLITZ_CLICK_WAR" && (
                  <BlitzClickWar roomCode={currentRoom.code} myUserId={myDbUserId} players={myPlayerData} duration={30} onComplete={handleGameComplete} onScoreUpdate={handleScoreUpdate} />
                )}
                {currentRoom.gameType === "COLOUR_DUEL" && (
                  <ColourDuel roomCode={currentRoom.code} myUserId={myDbUserId} isHost={hostRef.current} players={myPlayerData} roundData={currentRoom.roundData as never} totalRounds={8} onRoundAnswer={handleRoundAnswer} onComplete={handleGameComplete} onScoreUpdate={handleScoreUpdate} />
                )}
                {currentRoom.gameType === "NUMBER_BLITZ" && (
                  <NumberBlitz roomCode={currentRoom.code} myUserId={myDbUserId} isHost={hostRef.current} players={myPlayerData} roundData={currentRoom.roundData as never} totalRounds={10} onComplete={handleGameComplete} onScoreUpdate={handleScoreUpdate} />
                )}
                {currentRoom.gameType === "GHOST_WRITER" && (
                  <GhostWriter roomCode={currentRoom.code} myUserId={myDbUserId} isHost={hostRef.current} players={myPlayerData} roundData={currentRoom.roundData as never} totalRounds={8} onComplete={handleGameComplete} onScoreUpdate={handleScoreUpdate} />
                )}
                {currentRoom.gameType === "SPEED_SCRAMBLE" && (
                  <SpeedScramble roomCode={currentRoom.code} myUserId={myDbUserId} isHost={hostRef.current} players={myPlayerData} roundData={currentRoom.roundData as never} totalRounds={10} onComplete={handleGameComplete} onScoreUpdate={handleScoreUpdate} />
                )}
              </div>
            </motion.div>
          )}
 
          {/* ══ RESULTS ══════════════════════════════════════════════════════ */}
          {view === "results" && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-y-auto h-full">
              <ResultsScreen results={results} myUserId={myDbUserId} gameType={currentRoom?.gameType ?? "BLITZ_CLICK_WAR"}
                onPlayAgain={() => { setView("lobby"); setCurrentRoom(null); setResults([]); }}
                onBackToLobby={() => { setView("lobby"); setCurrentRoom(null); setResults([]); }} />
            </motion.div>
          )}
 
        </AnimatePresence>
      </main>
    </div>
  );
}