

// =============================================================================
// TOKEN RUSH — Main Arena Client
// app/token-rush/_client/token-rush-client.tsx
// =============================================================================
"use client";

import React, {
  useState, useEffect, useCallback, lazy, Suspense,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
  Swords, Coins, Trophy, Zap, Lock, Home,
  DollarSign, AlertTriangle, Clock, Users, Radio,
  ArrowLeft, Check, Eye, X, Volume2, VolumeX,
} from "lucide-react";
import Link from "next/link";
import {
  TOKEN_RUSH_GAMES, GAME_LIST,
  PLATFORM_FEE_PCT, CASHOUT_MINIMUM, CASHOUT_RATE_GBP,
  WAGER_PRESETS, calcPrize, fmtTokens,
  type TokenRushGameId, type TokenRushGameDef,
} from  "./game-registry";
import { useGameSound } from "./use-game-sound";



// ── Lazy-load game components ─────────────────────────────────────────────────
// Adding a new game: add its ID to game-registry.ts then add a lazy import here.
// ── Lazy-load game components ─────────────────────────────────────────────────
const GAME_COMPONENTS: Record<
  TokenRushGameId,
  React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>
> = {
  NEURAL_DOMINANCE: lazy(() =>
    import("../_token-rush-games/neural-dominance-game").then(m => ({
      default: m.NeuralDominanceGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
  PHANTOM_GRID: lazy(() =>
    import("../_token-rush-games/phantom-grid-game").then(m => ({
      default: m.PhantomGridGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
    ECHO_CHAMBER: lazy(() =>
    import("../_token-rush-games/echo-chamber-game").then(m => ({
      default: m.EchoChamberGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
  CIPHER_DUEL: lazy(() =>
    import("../_token-rush-games/cipher-duel-game").then(m => ({
      default: m.CipherDuelGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
  GRAVITY_MIND: lazy(() =>
    import("../_token-rush-games/gravity-mind-game").then(m => ({
      default: m.GravityMindGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
    MIRAGE_AUCTION: lazy(() =>
    import("../_token-rush-games/mirage-auction-game").then(m => ({
      default: m.MirageAuctionGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
  TEMPORAL_DUEL: lazy(() =>
    import("../_token-rush-games/temporal-duel-game").then(m => ({
      default: m.TemporalDuelGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
  MIND_MIRROR: lazy(() =>
    import("../_token-rush-games/mind-mirror-game").then(m => ({
      default: m.MindMirrorGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
  PRESSURE_COOKER: lazy(() =>
    import("../_token-rush-games/pressure-cooker-game").then(m => ({
      default: m.PressureCookerGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
  PHANTOM_WORD: lazy(() =>
    import("../_token-rush-games/phantom-word-game").then(m => ({
      default: m.PhantomWordGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
  RORSCHACH_DUEL: lazy(() =>
    import("../_token-rush-games/rorschach-duel-game").then(m => ({
      default: m.RorschachDuelGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
    SIGNAL_THIEF: lazy(() =>
    import("../_token-rush-games/signal-thief-game").then(m => ({
      default: m.SignalThiefGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
    COLOUR_COURT: lazy(() =>
    import("../_token-rush-games/colour-court-game").then(m => ({
        default: m.ColourCourtGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
    ),
    LAST_WORD: lazy(() =>
    import("../_token-rush-games/last-word-game").then(m => ({
        default: m.LastWordGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
    ),
    FREQUENCY: lazy(() =>
    import("../_token-rush-games/frequency-game").then(m => ({
      default: m.FrequencyGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
    DEAD_RECKONING: lazy(() =>
    import("../_token-rush-games/dead-reckoning-game").then(m => ({
        default: m.DeadReckoningGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
    ),
    CONTRABAND: lazy(() =>
    import("../_token-rush-games/contraband-game").then(m => ({
        default: m.ContrabandGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
    ),
    PULSE: lazy(() =>
    import("../_token-rush-games/pulse-game").then(m => ({
      default: m.PulseGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
    CARTOGRAPHER: lazy(() =>
    import("../_token-rush-games/cartographer-game").then(m => ({
      default: m.CartographerGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
    VOLTAGE: lazy(() =>
    import("../_token-rush-games/voltage-game").then(m => ({
      default: m.VoltageGame as unknown as React.ComponentType<Record<string, unknown>>,
    }))
  ),
    
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type View = "arena" | "create" | "waiting" | "playing" | "result";
 
interface Challenge {
  id:            string;
  creatorId:     string;
  creatorName:   string;
  gameId:        TokenRushGameId;
  wagerAmount:   number;
  prizePool:     number;
  platformFee:   number;
  netPrize:      number;
  status:        "open" | "accepted" | "playing" | "completed";
  createdAt:     string;
  acceptorId?:   string;
  acceptorName?: string;
}
 
interface OnlineUser {
  id:           string;
  displayName:  string;
  tokenBalance: number;
  gamesPlayed:  number;
  winRate:      number;
}
 
interface GameResult {
  iWon:        boolean;
  winnerName:  string;
  myScore:     number;
  oppScore:    number;
  prizePool:   number;
  platformFee: number;
  netPrize:    number;
}
 
// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
 
function Hairline({ accent = "#a855f7" }: { accent?: string }) {
  return (
    <div className="h-[2px] w-full flex-shrink-0"
      style={{ background: `linear-gradient(90deg,${accent},${accent}55 55%,transparent)` }} />
  );
}
 
function AmbientBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
      <motion.div animate={{ opacity: [0.35,0.65,0.35], scale:[1,1.08,1] }} transition={{ repeat: Infinity, duration: 15 }}
        className="absolute -top-52 -right-32 w-[900px] h-[900px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(168,85,247,0.07) 0%,rgba(99,102,241,0.03) 40%,transparent 70%)", filter:"blur(70px)" }} />
      <motion.div animate={{ opacity: [0.25,0.5,0.25], scale:[1,1.06,1] }} transition={{ repeat: Infinity, duration:20, delay:5 }}
        className="absolute -bottom-52 -left-32 w-[700px] h-[700px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(6,182,212,0.06) 0%,transparent 65%)", filter:"blur(60px)" }} />
      <motion.div animate={{ opacity:[0,0.1,0] }} transition={{ repeat: Infinity, duration:9, delay:3 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{ background:"radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)", filter:"blur(50px)" }} />
    </div>
  );
}
 
function GameCardUI({
  game, selected, onClick,
}: { game: TokenRushGameDef; selected: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const on = selected || hov;
  return (
    <motion.div whileHover={{ y: -3 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      onClick={onClick} id={game.name.toLowerCase().replace(/\s+/g,"-")}
      className="rounded-xs overflow-hidden cursor-pointer"
      style={{
        background: on ? `linear-gradient(135deg,rgba(255,255,255,0.055) 0%,${game.accent}10 100%)` : "rgba(255,255,255,0.03)",
        border: `1px solid ${on ? `${game.accent}45` : "rgba(255,255,255,0.07)"}`,
        boxShadow: on ? `0 10px 40px ${game.glow}` : "none",
        transition: "all 0.22s",
      }}>
      <Hairline accent={on ? game.accent : "transparent"} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.span animate={{ scale: on ? 1.12:1, rotate: on ? 6:0 }} className="text-3xl">{game.emoji}</motion.span>
            <div>
              <h3 className="text-base font-black text-white" style={{ letterSpacing: "-0.03em" }}>{game.name}</h3>
              <p className="text-[10px]" style={{ color: game.accent }}>{game.tagline}</p>
            </div>
          </div>
          {selected && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: game.accent }}>
              <Check className="w-3 h-3 text-black" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {game.tags.map(t => (
            <span key={t} className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
              style={{ background: `${game.accent}12`, color: game.accent, border: `1px solid ${game.accent}28` }}>{t}</span>
          ))}
          <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.09)" }}>
            {game.difficulty}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>{game.description}</p>
        <div className="flex items-center gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{game.minPlayers}–{game.maxPlayers}p</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{game.durationLabel}</span>
          <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{game.rounds} rounds</span>
        </div>
        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity: on?1:0, height: on?"auto":0 }} className="overflow-hidden">
          <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: `1px solid ${game.accent}18` }}>
            <p className="text-[9px] uppercase tracking-widest font-black mb-2" style={{ color:"rgba(255,255,255,0.22)" }}>Rules</p>
            {game.rules.map((r,i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px]" style={{ color:"rgba(255,255,255,0.45)" }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: game.accent }} />{r}
              </div>
            ))}
            <p className="text-[9px] mt-2 pt-2" style={{ color:"rgba(255,255,255,0.2)", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              🔒 {game.anticheat}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
 
function ChallengeRow({
  c, myId, balance, accepting, onAccept,
}: { c: Challenge; myId: string; balance: number; accepting: string|null; onAccept: (c: Challenge) => void }) {
  const g   = TOKEN_RUSH_GAMES[c.gameId];
  const me  = c.creatorId === myId;
  const ok  = balance >= c.wagerAmount;
  const age = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 1000);
  const ageStr = age < 60 ? `${age}s` : `${Math.floor(age/60)}m`;
  return (
    <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
      className="rounded-xs overflow-hidden relative"
      style={{ background:`linear-gradient(135deg,rgba(255,255,255,0.035) 0%,${g.accent}07 100%)`, border:`1px solid ${c.status==="open"?`${g.accent}28`:"rgba(255,255,255,0.06)"}` }}>
      {c.status==="open" && <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background:`linear-gradient(90deg,${g.accent},transparent)` }} />}
      {c.status==="open" && !me && (
        <motion.div animate={{ scale:[1,1.6,1], opacity:[1,0.4,1] }} transition={{ repeat:Infinity, duration:2 }}
          className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ background:g.accent, boxShadow:`0 0 8px ${g.accent}` }} />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{g.emoji}</span>
            <div>
              <p className="text-xs font-black text-white">{g.name}</p>
              <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>
                <span style={{ color:g.accent }}>{me?"You":c.creatorName}</span> · {ageStr} ago
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black" style={{ color:"#f59e0b", letterSpacing:"-0.03em" }}>{fmtTokens(c.netPrize)}</div>
            <div className="text-[9px] text-white/25">net prize</div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3 text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>
          <span><Coins className="w-3 h-3 inline mr-1 text-amber-400" /><strong className="text-white">{c.wagerAmount.toLocaleString()}</strong> ea</span>
          <span className="w-px h-3 bg-white/10" /><span>Pool: <strong className="text-white">{c.prizePool.toLocaleString()}</strong></span>
          <span className="w-px h-3 bg-white/10" /><span style={{ color:"#f97316" }}>Fee: {c.platformFee.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          {c.status==="open" && !me && (
            <motion.button whileHover={{ scale: ok?1.02:1 }} whileTap={{ scale:0.97 }}
              onClick={() => onAccept(c)} disabled={!ok||!!accepting}
              className="flex-1 py-2 rounded-xs text-xs font-black text-white disabled:opacity-35 flex items-center justify-center gap-1.5"
              style={{ background: ok?g.accent:"rgba(255,255,255,0.05)", boxShadow: ok?`0 0 18px ${g.glow}`:"none" }}>
              {accepting===c.id
                ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Swords className="w-3.5 h-3.5" />{ok?"Accept Challenge":`Need ${c.wagerAmount.toLocaleString()}`}</>}
            </motion.button>
          )}
          {me && (
            <div className="flex-1 py-2 rounded-xs text-xs font-bold text-center"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.38)" }}>
              <Radio className="w-3 h-3 inline mr-1 animate-pulse text-emerald-400" />Broadcast — awaiting opponent
            </div>
          )}
          {c.status==="playing" && !me && (
            <div className="flex-1 py-2 rounded-xs text-xs font-bold text-center flex items-center justify-center gap-1.5"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.38)" }}>
              <Eye className="w-3 h-3" />In progress
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
 
// ─────────────────────────────────────────────────────────────────────────────
// CASHOUT OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function CashoutOverlay({ balance, onClose }: { balance: number; onClose: () => void }) {
  const [email, setEmail]       = useState("");
  const [busy,  setBusy]        = useState(false);
  const [done,  setDone]        = useState(false);
  const [err,   setErr]         = useState<string|null>(null);
  const eligible = balance >= CASHOUT_MINIMUM;
  const gbp = (balance * CASHOUT_RATE_GBP).toFixed(2);
 
  const submit = async () => {
    if (!email||!eligible) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/token-rush/cashout", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email, tokenAmount: balance }),
      });
      if (!res.ok) { const d = await res.json(); setErr(d.error??"Failed"); return; }
      setDone(true);
    } catch { setErr("Network error. Please try again."); }
    finally { setBusy(false); }
  };
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)" }}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-md rounded-xs overflow-hidden"
        style={{ background:"#08080f", border:"1px solid rgba(255,255,255,0.1)" }}>
        <Hairline accent="#f59e0b" />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white" style={{ letterSpacing:"-0.03em" }}>Cash Out</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-white/40" /></button>
          </div>
 
          <div className="rounded-xs p-4" style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)" }}>
            <div className="flex items-center gap-3 mb-1">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-2xl font-black text-white" style={{ letterSpacing:"-0.05em" }}>{balance.toLocaleString()}</span>
              <span className="text-sm text-white/30">tokens</span>
            </div>
            <p className="text-sm" style={{ color: eligible?"#f59e0b":"#f87171" }}>
              {eligible ? `≈ £${gbp} GBP via PayPal` : `${(CASHOUT_MINIMUM-balance).toLocaleString()} more tokens needed`}
            </p>
            {!eligible && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] mb-1 text-white/30">
                  <span>{balance.toLocaleString()}</span><span>{CASHOUT_MINIMUM.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width:`${Math.min(100,(balance/CASHOUT_MINIMUM)*100)}%`, background:"#f59e0b" }} />
                </div>
              </div>
            )}
          </div>
 
          <div className="flex gap-3 px-4 py-3 rounded-xs" style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)" }}>
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/45">Processed within 5 business days. Rate: 1,000,000 tokens = £100 GBP. 5% platform fee is deducted at game time.</p>
          </div>
 
          {eligible && !done && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-white/28 mb-2">PayPal Email</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="your@paypal.com"
                  className="w-full px-4 py-3 rounded-xs text-sm text-white outline-none"
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.14)" }} />
              </div>
              {err && <p className="text-xs text-red-400">{err}</p>}
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                onClick={submit} disabled={!email||busy}
                className="w-full py-3.5 rounded-xs text-sm font-black text-white disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background:"linear-gradient(135deg,#10b981,#06b6d4)", boxShadow:"0 0 28px rgba(16,185,129,0.35)" }}>
                {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><DollarSign className="w-4 h-4" />Request Cashout · £{gbp}</>}
              </motion.button>
            </>
          )}
 
          {done && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background:"rgba(16,185,129,0.2)", border:"2px solid #10b981" }}>
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-lg font-black text-white">Request submitted!</p>
              <p className="text-sm text-white/40">PayPal payment of <strong className="text-white">£{gbp}</strong> to {email} within 5 business days.</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
 
// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT
// ─────────────────────────────────────────────────────────────────────────────
export function TokenRushClient() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { play } = useGameSound(true);
 
  const [view,       setView]       = useState<View>("arena");
  const [challenges, setChalls]     = useState<Challenge[]>([]);
  const [users,      setUsers]      = useState<OnlineUser[]>([]);
  const [balance,    setBalance]    = useState(0);
  const [gameId,     setGameId]     = useState<TokenRushGameId>("NEURAL_DOMINANCE");
  const [wager,      setWager]      = useState<typeof WAGER_PRESETS[number]>(WAGER_PRESETS[2]);
  const [custom,     setCustom]     = useState("");
  const [activeCh,   setActiveCh]   = useState<Challenge|null>(null);
  const [result,     setResult]     = useState<GameResult|null>(null);
  const [creating,   setCreating]   = useState(false);
  const [accepting,  setAccepting]  = useState<string|null>(null);
  const [cashout,    setCashout]    = useState(false);
  const [sound,      setSound]      = useState(true);
  const [toast,      setToast]      = useState<{ text:string; ok:boolean }|null>(null);
 
  // Tracks the challenge the current user CREATED and is waiting for an opponent.
  // The polling loop watches this and auto-navigates the creator into the game
  // the moment their challenge flips from "open" → "playing".
  const pendingChallengeIdRef = useRef<string | null>(null);
  // Keep a ref to the current view so the polling callback always sees the latest value
  // without needing it as a dependency (which would restart the interval).
  const viewRef = useRef<View>("arena");
  useEffect(() => { viewRef.current = view; }, [view]);
 
  const myId   = user?.id ?? "";
  const myName = (user?.firstName ?? user?.username ?? "Player").slice(0,20);
 
  const toast$ = (text: string, ok = true) => {
    setToast({ text, ok }); setTimeout(() => setToast(null), 4000);
  };
 
  // ── Fetch ───────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const [s, c] = await Promise.all([
        fetch("/api/game/stats"),
        fetch("/api/token-rush/challenges"),
      ]);
      if (s.ok) { const d = await s.json(); setBalance(d.wallet?.balance ?? 0); }
      if (c.ok) {
        const d = await c.json();
        const incoming: Challenge[] = d.challenges ?? [];
        setChalls(incoming);
        setUsers(d.onlineUsers ?? []);
 
        // ── Creator watch: did someone accept my pending challenge? ───────
        // Only triggers when the creator is on the arena/create view,
        // not already mid-game.
        const pendingId = pendingChallengeIdRef.current;
        if (pendingId && (viewRef.current === "waiting" || viewRef.current === "arena" || viewRef.current === "create")) {
          const matched = incoming.find(ch => ch.id === pendingId);
          if (matched && matched.status === "playing" && matched.acceptorId) {
            // An opponent accepted — send the creator straight into the game
            pendingChallengeIdRef.current = null;
            setActiveCh(matched);
            play("challengeAccept");
            setToast({ text: `${matched.acceptorName ?? "Someone"} accepted your challenge! Good luck! 🎮`, ok: true });
            setTimeout(() => setToast(null), 4000);
            setView("playing");
          }
        }
      }
    } catch { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, play]);
 
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!isSignedIn) return;
    const t = setInterval(load, 5000); return () => clearInterval(t);
  }, [isSignedIn, load]);
 
  // ── Create ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!isSignedIn) return;
    const w = custom ? (parseInt(custom)||0) : wager;
    if (w<=0||w>balance) { toast$("Insufficient tokens", false); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/token-rush/challenges", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ gameId, wagerAmount: w }),
      });
      if (!res.ok) { const d = await res.json(); toast$(d.error??"Failed",false); return; }
      const data = await res.json();
      setBalance(b => b-w);
      setChalls(prev => [data.challenge,...prev]);
      // Store the new challenge ID so the polling loop can detect when
      // an opponent accepts it and automatically bring the creator into the game.
      pendingChallengeIdRef.current = data.challenge.id;
      // Take the creator to a dedicated waiting room so they know
      // their challenge is live and will auto-start when accepted.
      setActiveCh(data.challenge);
      play("challengePost"); toast$("Challenge broadcast! Waiting for an opponent…");
      setView("waiting");
    } catch { toast$("Network error",false); }
    finally { setCreating(false); }
  };
 
  // ── Accept ──────────────────────────────────────────────────────────────
  const handleAccept = async (c: Challenge) => {
    if (!isSignedIn||balance<c.wagerAmount) return;
    setAccepting(c.id);
    try {
      const res = await fetch(`/api/token-rush/challenges/${c.id}/accept`, { method:"POST" });
      if (!res.ok) { const d = await res.json(); toast$(d.error??"Failed",false); return; }
      setBalance(b => b-c.wagerAmount);
      setChalls(prev => prev.map(x => x.id===c.id ? {...x, status:"playing", acceptorId:myId, acceptorName:myName} : x));
      setActiveCh({...c, status:"playing", acceptorId:myId, acceptorName:myName});
      play("challengeAccept"); setView("playing");
    } catch { toast$("Network error",false); }
    finally { setAccepting(null); }
  };
 
  // ── Game done ───────────────────────────────────────────────────────────
  const handleDone = useCallback(async (myScore: number, oppScore: number) => {
    if (!activeCh) return;
    try {
      await fetch(`/api/token-rush/challenges/${activeCh.id}/complete`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ myScore, oppScore }),
      });
    } catch { /* non-fatal */ }
    const iWon = myScore > oppScore;
    const oppName = activeCh.creatorId===myId ? (activeCh.acceptorName??"Opponent") : activeCh.creatorName;
    setResult({
      iWon, winnerName: iWon ? myName : oppName,
      myScore, oppScore,
      prizePool: activeCh.prizePool, platformFee: activeCh.platformFee, netPrize: activeCh.netPrize,
    });
    if (iWon) { setBalance(b => b+activeCh.netPrize); play("tokensCredit"); }
    else       { play("gameLose"); }
    setView("result");
  }, [activeCh, myId, myName, play]);
 
  // ── Cancel pending challenge ────────────────────────────────────────────
  const handleCancel = async () => {
    const ch = activeCh;
    if (!ch) return;
    pendingChallengeIdRef.current = null;
    setActiveCh(null);
    setView("arena");
    // Refund wager and cancel on server
    try {
      await fetch(`/api/token-rush/challenges/${ch.id}/cancel`, { method: "POST" });
      // Optimistically remove from local list
      setChalls(prev => prev.filter(x => x.id !== ch.id));
      // Refund the wager in the UI immediately (server also does this atomically)
      setBalance(b => b + ch.wagerAmount);
      toast$("Challenge cancelled — tokens refunded.");
    } catch {
      toast$("Could not cancel on server — please refresh.", false);
    }
  };
 
  // ── Derived ─────────────────────────────────────────────────────────────
  const ew  = custom ? (parseInt(custom)||0) : wager;
  const { pool:pP, fee:pF, net:pN } = calcPrize(ew);
  const gDef = TOKEN_RUSH_GAMES[gameId];
  const openChs = challenges.filter(c => c.status==="open");
  const liveCt  = challenges.filter(c => c.status==="playing").length;
  const oppName = activeCh
    ? (activeCh.creatorId===myId ? (activeCh.acceptorName??"Opponent") : activeCh.creatorName) : "";
  const oppId = activeCh
    ? (activeCh.creatorId===myId ? (activeCh.acceptorId??"") : activeCh.creatorId) : "";
 
  return (
    <>
      {cashout && <CashoutOverlay balance={balance} onClose={() => setCashout(false)} />}
 
      <div className="fixed inset-0 overflow-hidden" style={{ background:"#04040c", fontFamily:"'Sora',system-ui,sans-serif" }}>
        <AmbientBg />
        <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{ background:"linear-gradient(90deg,transparent,#a855f7 30%,#06b6d4 70%,transparent)" }} />
 
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 flex-shrink-0"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(4,4,12,0.92)", backdropFilter:"blur(16px)" }}>
          <div className="flex items-center gap-3">
            <Link href="/"><Home className="w-5 h-5 text-white/35 hover:text-white transition-colors" /></Link>
            <div className="w-px h-4 bg-white/10" />
            <Link href="/games" className="flex items-center gap-1 text-xs font-bold text-white/35 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />Games
            </Link>
            <div className="w-px h-4 bg-white/10 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xs flex items-center justify-center"
                style={{ background:"linear-gradient(135deg,rgba(168,85,247,0.25),rgba(6,182,212,0.12))", border:"1px solid rgba(168,85,247,0.3)" }}>
                <Swords className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white" style={{ letterSpacing:"-0.03em" }}>Token Rush</h1>
                <p className="text-[9px] text-white/28">Bet · Battle · Win · Cash Out</p>
              </div>
            </div>
          </div>
 
          <div className="flex items-center gap-2">
            <button onClick={() => setSound(s=>!s)}
              className="w-8 h-8 rounded-xs flex items-center justify-center"
              style={{ background: sound?"rgba(168,85,247,0.12)":"rgba(255,255,255,0.04)", border:`1px solid ${sound?"rgba(168,85,247,0.3)":"rgba(255,255,255,0.08)"}` }}>
              {sound ? <Volume2 className="w-3.5 h-3.5 text-purple-400" /> : <VolumeX className="w-3.5 h-3.5 text-white/30" />}
            </button>
 
            {isSignedIn && (
              <button onClick={() => setCashout(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs"
                style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.22)" }}>
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-black text-amber-400" style={{ letterSpacing:"-0.02em" }}>{fmtTokens(balance)}</span>
                {balance>=CASHOUT_MINIMUM && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-xs animate-pulse"
                    style={{ background:"rgba(16,185,129,0.2)", color:"#10b981", border:"1px solid rgba(16,185,129,0.3)" }}>CASH OUT</span>
                )}
              </button>
            )}
 
            {isSignedIn && view==="arena" && (
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => { setView("create"); play("uiClick"); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-black text-white"
                style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow:"0 0 18px rgba(168,85,247,0.4)" }}>
                <Swords className="w-3.5 h-3.5" /><span className="hidden sm:inline">New Challenge</span><span className="sm:hidden">+</span>
              </motion.button>
            )}
 
            {(view==="create"||view==="result"||view==="waiting") && (
              <button onClick={() => {
                // If leaving the waiting room manually, cancel the pending challenge
                if (view === "waiting") { handleCancel(); return; }
                setView("arena"); setResult(null); setActiveCh(null);
              }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xs text-xs font-bold text-white/45"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }}>
                <ArrowLeft className="w-3.5 h-3.5" />{view === "waiting" ? "Cancel" : "Arena"}
              </button>
            )}
          </div>
        </header>
 
        {/* Main */}
        <main className="relative z-10 overflow-y-auto" style={{ height:"calc(100vh - 57px)" }}>
          <AnimatePresence mode="wait">
 
            {/* ── ARENA ──────────────────────────────────────────────────── */}
            {view==="arena" && (
              <motion.div key="arena" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
 
                {/* Hero */}
                <div className="relative rounded-xs overflow-hidden"
                  style={{ background:"linear-gradient(135deg,rgba(168,85,247,0.1),rgba(6,182,212,0.05),rgba(245,158,11,0.03))", border:"1px solid rgba(168,85,247,0.2)" }}>
                  <Hairline accent="#a855f7" />
                  <div className="px-6 sm:px-10 py-8 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow:"0 0 8px #10b981" }} />
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
                          Live Arena · {openChs.length} open · {liveCt} in progress
                        </span>
                      </div>
                      <h2 className="text-3xl sm:text-5xl font-black text-white mb-3" style={{ letterSpacing:"-0.05em", lineHeight:1.1 }}>
                        Bet Your Tokens.<br />
                        <span style={{ background:"linear-gradient(90deg,#a855f7,#06b6d4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                          Battle Human Minds.
                        </span>
                      </h2>
                      <p className="text-sm max-w-lg text-white/40">
                        {GAME_LIST.length} world-first skill games. Challenge any player, stake tokens — winner takes all minus {(PLATFORM_FEE_PCT*100).toFixed(0)}% fee. Reach {(CASHOUT_MINIMUM/1_000_000).toFixed(0)}M tokens to cash out via PayPal.
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-center">
                      <div className="text-7xl mb-2">⚔️</div>
                      <div className="text-[9px] font-black tracking-widest uppercase text-white/22">{(PLATFORM_FEE_PCT*100).toFixed(0)}% platform fee</div>
                    </div>
                  </div>
                </div>
 
                {/* Auth gate */}
                {!isSignedIn && isLoaded && (
                  <div className="rounded-xs p-8 text-center" style={{ background:"rgba(168,85,247,0.05)", border:"1px solid rgba(168,85,247,0.18)" }}>
                    <Lock className="w-10 h-10 mx-auto mb-4 text-purple-400/50" />
                    <p className="text-lg font-black text-white mb-1">Sign in to enter the arena</p>
                    <p className="text-sm mb-5 text-white/35">Wallet, wins, and cashout are tied to your account.</p>
                    <a href="/sign-in" className="inline-block px-8 py-3 rounded-xs text-sm font-black text-white"
                      style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow:"0 0 24px rgba(168,85,247,0.4)" }}>
                      Sign In to Play
                    </a>
                  </div>
                )}
 
                {/* Games */}
                <div>
                  <h3 className="text-[10px] font-black tracking-widest uppercase mb-4 text-white/25">
                    The Games ({GAME_LIST.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {GAME_LIST.map(g => (
                      <GameCardUI key={g.id} game={g} selected={false}
                        onClick={() => { if (isSignedIn) { setGameId(g.id); setView("create"); play("uiClick"); } }} />
                    ))}
                  </div>
                </div>
 
                {/* Live board */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Challenges */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black tracking-widest uppercase text-white/25">Open Challenges</h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/25">
                        <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />Live
                      </div>
                    </div>
                    <AnimatePresence>
                      {openChs.length===0
                        ? <div className="py-10 text-center rounded-xs" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                            <Swords className="w-8 h-8 mx-auto mb-2 text-white/10" />
                            <p className="text-sm text-white/25">No open challenges — be the first!</p>
                          </div>
                        : openChs.map(c => <ChallengeRow key={c.id} c={c} myId={myId} balance={balance} accepting={accepting} onAccept={handleAccept} />)
                      }
                    </AnimatePresence>
                  </div>
 
                  {/* Sidebar */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black tracking-widest uppercase text-white/25">Online Players</h3>
                    <div className="space-y-1.5">
                      {users.slice(0,8).map(u => (
                        <div key={u.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xs"
                          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                            style={{ background:"rgba(168,85,247,0.2)", color:"#a855f7" }}>
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{u.displayName}</p>
                            <p className="text-[9px] text-white/30">{u.winRate}% win · {u.gamesPlayed} games</p>
                          </div>
                          <div className="text-xs font-black text-amber-400">{fmtTokens(u.tokenBalance)}</div>
                        </div>
                      ))}
                      {users.length===0 && <p className="text-xs text-center text-white/20 py-4">Loading…</p>}
                    </div>
 
                    {/* Cashout card */}
                    <div className="rounded-xs overflow-hidden" style={{ border:"1px solid rgba(245,158,11,0.18)" }}>
                      <Hairline accent="#f59e0b" />
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-400" /><span className="text-xs font-black text-white">PayPal Cash Out</span></div>
                        <p className="text-[10px] text-white/35">Earn {(CASHOUT_MINIMUM/1_000_000).toFixed(0)}M tokens → £{(CASHOUT_MINIMUM*CASHOUT_RATE_GBP).toFixed(0)} GBP</p>
                        <div className="flex justify-between text-[10px] text-white/30">
                          <span>Balance: <strong className="text-amber-400">{fmtTokens(balance)}</strong></span>
                          <span>Goal: {fmtTokens(CASHOUT_MINIMUM)}</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background:"rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width:`${Math.min(100,(balance/CASHOUT_MINIMUM)*100)}%`, background: balance>=CASHOUT_MINIMUM?"#10b981":"#f59e0b" }} />
                        </div>
                        {balance>=CASHOUT_MINIMUM && (
                          <button onClick={() => setCashout(true)} className="w-full py-2 rounded-xs text-xs font-black text-white"
                            style={{ background:"linear-gradient(135deg,#10b981,#06b6d4)" }}>
                            💰 Cash Out Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
 
            {/* ── CREATE ─────────────────────────────────────────────────── */}
            {view==="create" && (
              <motion.div key="create" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1" style={{ letterSpacing:"-0.04em" }}>Create Challenge</h2>
                  <p className="text-sm text-white/35">Broadcast instantly to all online players.</p>
                </div>
 
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black mb-3 text-white/28">Choose Game</p>
                  <div className="grid grid-cols-1 gap-3">
                    {GAME_LIST.map(g => <GameCardUI key={g.id} game={g} selected={gameId===g.id} onClick={() => { setGameId(g.id); play("uiClick"); }} />)}
                  </div>
                </div>
 
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black mb-3 text-white/28">Wager Amount (tokens)</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {WAGER_PRESETS.map(w => (
                      <button key={w} onClick={() => { setWager(w); setCustom(""); play("uiClick"); }}
                        className="py-2.5 rounded-xs text-xs font-black transition-all"
                        style={{ background: wager===w&&!custom?`${gDef.accent}18`:"rgba(255,255,255,0.04)", border:`1px solid ${wager===w&&!custom?`${gDef.accent}45`:"rgba(255,255,255,0.08)"}`, color: wager===w&&!custom?gDef.accent:"rgba(255,255,255,0.45)" }}>
                        {w.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input value={custom} onChange={e=>setCustom(e.target.value.replace(/\D/g,""))} placeholder="Custom amount…"
                    className="w-full px-4 py-3 rounded-xs text-sm text-white outline-none"
                    style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)" }} />
                </div>
 
                <div className="rounded-xs p-5 space-y-2.5" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-[9px] uppercase tracking-widest font-black text-white/22">Prize Breakdown</p>
                  {[
                    { l:"Your wager",       v:ew.toLocaleString(),  c:"white" },
                    { l:"Opponent wager",   v:ew.toLocaleString(),  c:"white" },
                    { l:"Total prize pool", v:pP.toLocaleString(),  c:"#f59e0b" },
                    { l:`Platform fee (${(PLATFORM_FEE_PCT*100).toFixed(0)}%)`, v:pF.toLocaleString(), c:"#f97316" },
                    { l:"Winner receives",  v:pN.toLocaleString(),  c:"#10b981" },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between text-xs">
                      <span className="text-white/40">{r.l}</span>
                      <span className="font-black" style={{ color:r.c }}>{r.v}</span>
                    </div>
                  ))}
                </div>
 
                {ew>balance && (
                  <div className="flex gap-2 px-4 py-2.5 rounded-xs" style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.18)" }}>
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-white/45">Insufficient tokens. Balance: {balance.toLocaleString()}</p>
                  </div>
                )}
 
                <div className="flex gap-3">
                  <button onClick={() => setView("arena")} className="flex-1 py-3 rounded-xs text-sm font-bold text-white/40"
                    style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }}>Cancel</button>
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={handleCreate}
                    disabled={creating||ew>balance||ew<=0||!isSignedIn}
                    className="flex-[2] py-3 rounded-xs text-sm font-black text-white disabled:opacity-35 flex items-center justify-center gap-2"
                    style={{ background:`linear-gradient(135deg,${gDef.accent},${gDef.accentDark})`, boxShadow:`0 0 28px ${gDef.glow}` }}>
                    {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Broadcasting…</> : <><Radio className="w-4 h-4" />Broadcast Challenge</>}
                  </motion.button>
                </div>
              </motion.div>
            )}
 
            {/* ── WAITING (creator waiting for opponent) ──────────────── */}
            {view==="waiting" && activeCh && (
              <motion.div key="waiting" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="h-full flex items-center justify-center p-6">
                <div className="max-w-md w-full space-y-6">
 
                  {/* Game banner */}
                  <div className="rounded-xs overflow-hidden"
                    style={{ background:`linear-gradient(135deg,${TOKEN_RUSH_GAMES[activeCh.gameId].accent}18,rgba(255,255,255,0.03))`, border:`1px solid ${TOKEN_RUSH_GAMES[activeCh.gameId].accent}35` }}>
                    <div className="h-[2px]" style={{ background:`linear-gradient(90deg,${TOKEN_RUSH_GAMES[activeCh.gameId].accent},transparent)` }} />
                    <div className="p-5 flex items-center gap-4">
                      <span className="text-5xl">{TOKEN_RUSH_GAMES[activeCh.gameId].emoji}</span>
                      <div>
                        <p className="text-lg font-black text-white" style={{ letterSpacing:"-0.03em" }}>{TOKEN_RUSH_GAMES[activeCh.gameId].name}</p>
                        <p className="text-xs" style={{ color: TOKEN_RUSH_GAMES[activeCh.gameId].accent }}>{TOKEN_RUSH_GAMES[activeCh.gameId].tagline}</p>
                      </div>
                    </div>
                  </div>
 
                  {/* Wager display */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label:"Your wager", val:activeCh.wagerAmount.toLocaleString(), col:"white" },
                      { label:"Prize pool",  val:activeCh.prizePool.toLocaleString(),  col:"#f59e0b" },
                      { label:"Net prize",   val:activeCh.netPrize.toLocaleString(),   col:"#10b981" },
                    ].map(r => (
                      <div key={r.label} className="rounded-xs py-3 px-2"
                        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
                        <div className="text-base font-black" style={{ color:r.col, letterSpacing:"-0.03em" }}>{r.val}</div>
                        <div className="text-[9px] font-bold text-white/30 mt-0.5">{r.label}</div>
                      </div>
                    ))}
                  </div>
 
                  {/* Pulsing waiting indicator */}
                  <div className="rounded-xs p-6 text-center space-y-4"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center justify-center gap-3">
                      {/* Three animated dots */}
                      {[0,1,2].map(i => (
                        <motion.div key={i}
                          animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
                          transition={{ repeat:Infinity, duration:1.2, delay:i*0.2 }}
                          className="w-3 h-3 rounded-full"
                          style={{ background: TOKEN_RUSH_GAMES[activeCh.gameId].accent }} />
                      ))}
                    </div>
                    <div>
                      <p className="text-base font-black text-white mb-1" style={{ letterSpacing:"-0.02em" }}>
                        Challenge is live!
                      </p>
                      <p className="text-xs text-white/40">
                        Broadcast to all online players. The game will start automatically the moment someone accepts.
                      </p>
                    </div>
                    {/* Live pulse badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs"
                      style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)" }}>
                      <motion.div animate={{ opacity:[1,0.3,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                        className="w-2 h-2 rounded-full" style={{ background:"#10b981", boxShadow:"0 0 6px #10b981" }} />
                      <span className="text-[11px] font-black text-emerald-400">LIVE — visible to all online players</span>
                    </div>
                  </div>
 
                  {/* Online players count */}
                  {users.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-white/30 justify-center">
                      <Users className="w-3.5 h-3.5" />
                      <span><strong className="text-white/60">{users.length}</strong> player{users.length !== 1 ? "s" : ""} online who could accept</span>
                    </div>
                  )}
 
                  {/* Cancel */}
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    onClick={handleCancel}
                    className="w-full py-3 rounded-xs text-sm font-bold text-white/50 flex items-center justify-center gap-2"
                    style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)" }}>
                    <X className="w-4 h-4 text-red-400" /> Cancel Challenge &amp; Reclaim Tokens
                  </motion.button>
                </div>
              </motion.div>
            )}
 
            {/* ── PLAYING ────────────────────────────────────────────────── */}
            {view==="playing" && activeCh && (
              <motion.div key="playing" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0"
                  style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.65)" }}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{TOKEN_RUSH_GAMES[activeCh.gameId].emoji}</span>
                    <div>
                      <p className="text-sm font-black text-white" style={{ letterSpacing:"-0.02em" }}>{TOKEN_RUSH_GAMES[activeCh.gameId].name}</p>
                      <p className="text-[9px] text-white/30">vs {oppName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-black text-amber-400">{activeCh.netPrize.toLocaleString()}</span> prize
                  </div>
                </div>
 
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-40">
                      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  }>
                    {(() => {
                      const Comp = GAME_COMPONENTS[activeCh.gameId];
                      return (
                        <Comp
                          challengeId={activeCh.id}
                          myUserId={myId}
                          opponentName={oppName}
                          opponentId={oppId}
                          wagerAmount={activeCh.wagerAmount}
                          netPrize={activeCh.netPrize}
                          isHost={activeCh.creatorId===myId}
                          soundEnabled={sound}
                          onComplete={handleDone as unknown as (a:unknown,b:unknown)=>void}
                          onScoreUpdate={(score: unknown) => {
                            fetch(`/api/token-rush/challenges/${activeCh.id}/score`, {
                              method:"POST", headers:{"Content-Type":"application/json"},
                              body: JSON.stringify({ score }),
                            }).catch(()=>{});
                          }}
                        />
                      );
                    })()}
                  </Suspense>
                </div>
              </motion.div>
            )}
 
            {/* ── RESULT ─────────────────────────────────────────────────── */}
            {view==="result" && result && (
              <motion.div key="result" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="h-full flex items-center justify-center p-6 overflow-y-auto">
                <div className="max-w-md w-full space-y-6 text-center">
                  <motion.div initial={{ scale:0, rotate:-20 }} animate={{ scale:1, rotate:0 }} transition={{ type:"spring", damping:12 }}>
                    <div className="text-8xl mb-2">{result.iWon?"🏆":"💀"}</div>
                  </motion.div>
                  <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
                    <h2 className="text-4xl font-black mb-2" style={{ letterSpacing:"-0.05em", background: result.iWon?"linear-gradient(90deg,#f59e0b,#10b981)":"linear-gradient(90deg,#ef4444,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                      {result.iWon?"Victory!":"Defeated"}
                    </h2>
                    <p className="text-sm text-white/40">{result.iWon?`You outplayed ${oppName}`:`${result.winnerName} dominated this match`}</p>
                  </motion.div>
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.25 }} className="flex justify-center gap-8">
                    <div className="text-center"><div className="text-3xl font-black text-white" style={{ letterSpacing:"-0.04em" }}>{result.myScore}</div><div className="text-[10px] text-white/30">You</div></div>
                    <div className="text-center"><div className="text-3xl font-black text-white/35" style={{ letterSpacing:"-0.04em" }}>{result.oppScore}</div><div className="text-[10px] text-white/30">Opponent</div></div>
                  </motion.div>
                  {result.iWon && (
                    <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.35, type:"spring" }}
                      className="rounded-xs p-5" style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)" }}>
                      <div className="flex items-center justify-center gap-3">
                        <Coins className="w-6 h-6 text-amber-400" />
                        <div>
                          <div className="text-3xl font-black text-amber-400" style={{ letterSpacing:"-0.05em" }}>+{result.netPrize.toLocaleString()}</div>
                          <div className="text-[10px] text-white/30">tokens credited to wallet</div>
                        </div>
                      </div>
                      <p className="text-[10px] mt-2 text-white/22">Pool {result.prizePool.toLocaleString()} − fee {result.platformFee.toLocaleString()} = net {result.netPrize.toLocaleString()}</p>
                      {balance>=CASHOUT_MINIMUM && (
                        <button onClick={() => setCashout(true)} className="mt-3 w-full py-2 rounded-xs text-xs font-black text-white" style={{ background:"linear-gradient(135deg,#10b981,#06b6d4)" }}>
                          💰 Cash Out Now!
                        </button>
                      )}
                    </motion.div>
                  )}
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45 }} className="flex gap-3">
                    <button onClick={() => { setView("arena"); setResult(null); setActiveCh(null); }} className="flex-1 py-3 rounded-xs text-sm font-bold text-white/45" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }}>Back to Arena</button>
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={() => { setResult(null); setActiveCh(null); setView("create"); play("uiClick"); }} className="flex-1 py-3 rounded-xs text-sm font-black text-white" style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow:"0 0 24px rgba(168,85,247,0.4)" }}>Rematch</motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
 
          </AnimatePresence>
        </main>
 
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
              className="fixed bottom-6 left-6 z-[400] flex items-center gap-3 px-4 py-3 rounded-xs"
              style={{ background:"rgba(6,6,16,0.98)", border:`1px solid ${toast.ok?"rgba(16,185,129,0.35)":"rgba(239,68,68,0.35)"}`, boxShadow:"0 16px 50px rgba(0,0,0,0.6)" }}>
              <div className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-xs" style={{ background: toast.ok?"#10b981":"#ef4444" }} />
              <Zap className="w-4 h-4 flex-shrink-0" style={{ color: toast.ok?"#10b981":"#ef4444" }} />
              <span className="text-sm font-bold text-white">{toast.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
 





// // =============================================================================
// // TOKEN RUSH — app/token-rush/_client/token-rush-client.tsx
// //
// // The world's most intense token-wagering arena.
// // Two world-first games:
// //   1. NEURAL DOMINANCE — Psychological prediction war (12 rounds)
// //   2. PHANTOM GRID      — Fog-of-war territory battle (8×8 board)
// //
// // Features:
// //   • Live challenge broadcast to all active users
// //   • Anti-cheat server-validated moves
// //   • Winner-takes-all minus 5% platform fee
// //   • PayPal cash-out at 1,000,000 tokens
// // =============================================================================
// "use client";

// import React, {
//   useState, useEffect, useRef, useCallback, useMemo,
// } from "react";
// import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
// import { useUser } from "@clerk/nextjs";
// import {
//   Swords, Coins, Trophy, Zap, Brain, Eye, EyeOff,
//   ChevronRight, X, Check, Copy, ArrowLeft, Home,
//   TrendingUp, Shield, Target, Flame, Star, Lock,
//   DollarSign, AlertTriangle, Clock, Users, Radio,
//   Sparkles, Crown, Skull, Heart, BarChart3, RefreshCw,
// } from "lucide-react";
// import Link from "next/link";

// // ─────────────────────────────────────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────────────────────────────────────

// type GameId = "NEURAL_DOMINANCE" | "PHANTOM_GRID";
// type View = "arena" | "challenge_create" | "challenge_accept" | "pregame" | "playing" | "result" | "cashout";

// interface Challenge {
//   id: string;
//   creatorId: string;
//   creatorName: string;
//   creatorAvatar?: string;
//   gameId: GameId;
//   wagerAmount: number;
//   prizePool: number;
//   platformFee: number;
//   netPrize: number;
//   status: "open" | "accepted" | "playing" | "completed";
//   createdAt: string;
//   acceptorId?: string;
//   acceptorName?: string;
//   canPlay: boolean;
// }

// interface LivePlayer {
//   userId: string;
//   displayName: string;
//   tokenBalance: number;
//   isOnline: boolean;
//   gamesPlayed: number;
//   winRate: number;
// }

// interface NeuralMove {
//   move: "ALPHA" | "BETA" | "GAMMA";
//   prediction: "ALPHA" | "BETA" | "GAMMA";
// }

// interface PhantomCell {
//   row: number; col: number;
//   owner: "me" | "opponent" | "neutral";
//   revealed: boolean;
//   isPhantom: boolean;
// }

// interface GameResult {
//   winnerId: string;
//   winnerName: string;
//   myScore: number;
//   opponentScore: number;
//   prizePool: number;
//   platformFee: number;
//   netPrize: number;
//   iWon: boolean;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CONSTANTS
// // ─────────────────────────────────────────────────────────────────────────────

// const PLATFORM_FEE_PCT = 0.05; // 5%
// const CASHOUT_MINIMUM  = 1_000_000;
// const PAYPAL_EMAIL     = "paypal@ipahait.com";

// const GAME_DEFS = {
//   NEURAL_DOMINANCE: {
//     id:          "NEURAL_DOMINANCE" as GameId,
//     name:        "Neural Dominance",
//     emoji:       "🧠",
//     tagline:     "Out-think the human across the table",
//     accent:      "#a855f7",
//     accentDark:  "#7c3aed",
//     glow:        "rgba(168,85,247,0.4)",
//     description: "A 12-round psychological prediction war. Each round you choose a move (Alpha/Beta/Gamma) AND predict your opponent's move. Correct prediction = +15 pts. Correct move that opponent fails to predict = +10 pts. Bluff. Adapt. Dominate.",
//     minPlayers:  2,
//     maxPlayers:  2,
//     rounds:      12,
//     duration:    "~4 min",
//     difficulty:  "Extreme",
//     tags:        ["Psychology", "Prediction", "Deception", "Speed"],
//     rules: [
//       "Each round: pick your move (Alpha / Beta / Gamma)",
//       "Also predict what move your opponent will play",
//       "Correct prediction of their move: +15 pts",
//       "Playing a move they failed to predict: +10 pts",
//       "Same move as opponent with no correct prediction: +0",
//       "12 rounds — highest score wins the prize pool",
//       "Moves lock after 8 seconds — hesitation costs nothing but reveals pattern",
//     ],
//   },
//   PHANTOM_GRID: {
//     id:          "PHANTOM_GRID" as GameId,
//     name:        "Phantom Grid",
//     emoji:       "👻",
//     tagline:     "Claim territory in the fog of war",
//     accent:      "#06b6d4",
//     accentDark:  "#0891b2",
//     glow:        "rgba(6,182,212,0.4)",
//     description: "An 8×8 fog-of-war territory battle. Place phantom pieces across the board — your opponent can't see them until they probe. Probe cells to reveal opponent phantoms. Most territory revealed wins. Pure spatial deduction meets psychological bluffing.",
//     minPlayers:  2,
//     maxPlayers:  2,
//     rounds:      16,
//     duration:    "~6 min",
//     difficulty:  "Legendary",
//     tags:        ["Strategy", "Deduction", "Bluff", "Spatial"],
//     rules: [
//       "Each player places 8 phantom pieces on their half of the grid",
//       "Turns alternate: probe any cell to reveal if a phantom is there",
//       "Hit a phantom: it's destroyed, +20 pts to you",
//       "Miss a probe: opponent gets +5 pts (distraction bonus)",
//       "You can move an unrevealed phantom once every 3 turns",
//       "All phantoms revealed after 16 probe rounds",
//       "Most phantom captures wins the prize pool",
//     ],
//   },
// } as const;

// const WAGER_PRESETS = [100, 500, 1_000, 5_000, 10_000, 50_000];

// const NEURAL_MOVES = ["ALPHA", "BETA", "GAMMA"] as const;
// const NEURAL_MOVE_CFG = {
//   ALPHA: { label: "Alpha", symbol: "α", color: "#ef4444", desc: "Aggressive — high risk, high reward if mispredicted" },
//   BETA:  { label: "Beta",  symbol: "β", color: "#f59e0b", desc: "Balanced — the safest psychological choice" },
//   GAMMA: { label: "Gamma", symbol: "γ", color: "#10b981", desc: "Subtle — hardest to predict, lowest base value" },
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // UTILS
// // ─────────────────────────────────────────────────────────────────────────────

// function fmt(n: number) { return n.toLocaleString(); }
// function fmtShort(n: number) {
//   if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
//   if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
//   return `${n}`;
// }
// function calcFee(wager: number, players = 2) {
//   const pool = wager * players;
//   const fee  = Math.ceil(pool * PLATFORM_FEE_PCT);
//   return { pool, fee, net: pool - fee };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // AMBIENT BACKGROUND
// // ─────────────────────────────────────────────────────────────────────────────

// function AmbientBg() {
//   return (
//     <div className="absolute inset-0 pointer-events-none overflow-hidden">
//       {/* Grid */}
//       <div className="absolute inset-0" style={{
//         backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
//         backgroundSize: "48px 48px",
//       }} />
//       {/* Purple nebula top-right */}
//       <motion.div animate={{ opacity: [0.4,0.7,0.4], scale: [1,1.1,1] }} transition={{ repeat: Infinity, duration: 14 }}
//         className="absolute -top-60 -right-40 w-[900px] h-[900px] rounded-full"
//         style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)", filter: "blur(60px)" }} />
//       {/* Cyan nebula bottom-left */}
//       <motion.div animate={{ opacity: [0.3,0.6,0.3], scale: [1,1.08,1] }} transition={{ repeat: Infinity, duration: 18, delay: 4 }}
//         className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full"
//         style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 65%)", filter: "blur(50px)" }} />
//       {/* Centre pulse */}
//       <motion.div animate={{ opacity: [0,0.15,0] }} transition={{ repeat: Infinity, duration: 6, delay: 2 }}
//         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
//         style={{ background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // HAIRLINE
// // ─────────────────────────────────────────────────────────────────────────────

// function Hairline({ accent = "#a855f7", dir = "h" }: { accent?: string; dir?: "h" | "v" }) {
//   return dir === "h"
//     ? <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}60 50%, transparent)` }} />
//     : <div className="w-[2px] h-full" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}60 50%, transparent)` }} />;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // TOKEN BADGE
// // ─────────────────────────────────────────────────────────────────────────────

// function TokenBadge({ amount, size = "md" }: { amount: number; size?: "sm" | "md" | "lg" }) {
//   const sz = { sm: "text-xs px-2 py-0.5", md: "text-sm px-3 py-1", lg: "text-lg px-4 py-1.5" }[size];
//   return (
//     <span className={`inline-flex items-center gap-1.5 font-black rounded-xs ${sz}`}
//       style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
//       <Coins className={size === "lg" ? "w-5 h-5" : size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
//       {fmtShort(amount)}
//     </span>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // GAME CARD
// // ─────────────────────────────────────────────────────────────────────────────

// function GameCard({ game, selected, onClick }: {
//   game: typeof GAME_DEFS[GameId];
//   selected: boolean;
//   onClick: () => void;
// }) {
//   const [hov, setHov] = useState(false);
//   const active = selected || hov;
//   return (
//     <motion.div
//       whileHover={{ y: -4 }}
//       onHoverStart={() => setHov(true)}
//       onHoverEnd={() => setHov(false)}
//       onClick={onClick}
//       id={game.name.toLowerCase().replace(/\s+/g, "-")}
//       className="relative rounded-xs overflow-hidden cursor-pointer"
//       style={{
//         background: active
//           ? `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, ${game.accent}12 100%)`
//           : "rgba(255,255,255,0.03)",
//         border: `1px solid ${active ? `${game.accent}50` : "rgba(255,255,255,0.08)"}`,
//         boxShadow: active ? `0 12px 48px ${game.glow}, 0 0 0 1px ${game.accent}20` : "none",
//         transition: "all 0.25s",
//       }}
//     >
//       <Hairline accent={active ? game.accent : "transparent"} />
//       <div className="p-6">
//         {/* Header */}
//         <div className="flex items-start justify-between mb-4">
//           <div>
//             <div className="flex items-center gap-3 mb-1">
//               <motion.span animate={{ scale: active ? 1.15 : 1, rotate: active ? 8 : 0 }} className="text-4xl">{game.emoji}</motion.span>
//               <div>
//                 <h3 className="text-lg font-black text-white" style={{ letterSpacing: "-0.03em" }}>{game.name}</h3>
//                 <p className="text-[11px]" style={{ color: game.accent }}>{game.tagline}</p>
//               </div>
//             </div>
//           </div>
//           {selected && (
//             <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
//               style={{ background: game.accent }}>
//               <Check className="w-3.5 h-3.5 text-black" />
//             </div>
//           )}
//         </div>

//         {/* Tags */}
//         <div className="flex flex-wrap gap-1.5 mb-4">
//           {game.tags.map(t => (
//             <span key={t} className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs"
//               style={{ background: `${game.accent}15`, color: game.accent, border: `1px solid ${game.accent}30` }}>
//               {t}
//             </span>
//           ))}
//           <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs"
//             style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
//             {game.difficulty}
//           </span>
//         </div>

//         <p className="text-[12px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
//           {game.description}
//         </p>

//         {/* Meta */}
//         <div className="flex items-center gap-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
//           <div className="flex items-center gap-1"><Users className="w-3 h-3" />{game.minPlayers}–{game.maxPlayers} players</div>
//           <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{game.duration}</div>
//           <div className="flex items-center gap-1"><Target className="w-3 h-3" />{game.rounds} rounds</div>
//         </div>

//         {/* Rules hover reveal */}
//         <motion.div
//           initial={{ opacity: 0, height: 0 }}
//           animate={{ opacity: active ? 1 : 0, height: active ? "auto" : 0 }}
//           className="overflow-hidden"
//         >
//           <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${game.accent}20` }}>
//             <p className="text-[9px] uppercase tracking-widest font-black mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Rules</p>
//             <ul className="space-y-1.5">
//               {game.rules.map((r, i) => (
//                 <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
//                   <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: game.accent }} />
//                   {r}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // LIVE CHALLENGE CARD
// // ─────────────────────────────────────────────────────────────────────────────

// function ChallengeCard({ challenge, myUserId, tokenBalance, onAccept, onSpectate }: {
//   challenge: Challenge;
//   myUserId: string;
//   tokenBalance: number;
//   onAccept: (c: Challenge) => void;
//   onSpectate: (c: Challenge) => void;
// }) {
//   const game      = GAME_DEFS[challenge.gameId];
//   const isCreator = challenge.creatorId === myUserId;
//   const canAfford = tokenBalance >= challenge.wagerAmount;
//   const isOpen    = challenge.status === "open";
//   const age       = Math.floor((Date.now() - new Date(challenge.createdAt).getTime()) / 1000);
//   const ageStr    = age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`;

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, y: 12, scale: 0.98 }}
//       animate={{ opacity: 1, y: 0, scale: 1 }}
//       exit={{ opacity: 0, y: -8, scale: 0.96 }}
//       className="relative rounded-xs overflow-hidden"
//       style={{
//         background: isOpen ? `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, ${game.accent}08 100%)` : "rgba(255,255,255,0.02)",
//         border: `1px solid ${isOpen ? `${game.accent}30` : "rgba(255,255,255,0.06)"}`,
//       }}
//     >
//       {isOpen && <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, ${game.accent}, transparent)` }} />}

//       {/* Live pulse for open challenges */}
//       {isOpen && !isCreator && (
//         <div className="absolute top-3 right-3">
//           <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 2 }}
//             className="w-2 h-2 rounded-full" style={{ background: game.accent, boxShadow: `0 0 8px ${game.accent}` }} />
//         </div>
//       )}

//       <div className="p-4">
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center gap-2.5">
//             <span className="text-2xl">{game.emoji}</span>
//             <div>
//               <p className="text-xs font-black text-white" style={{ letterSpacing: "-0.02em" }}>{game.name}</p>
//               <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
//                 by <span style={{ color: game.accent }}>{isCreator ? "You" : challenge.creatorName}</span> · {ageStr}
//               </p>
//             </div>
//           </div>
//           <div className="text-right">
//             <div className="text-lg font-black" style={{ color: "#f59e0b", letterSpacing: "-0.03em" }}>
//               {fmtShort(challenge.netPrize)}
//             </div>
//             <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>net prize</div>
//           </div>
//         </div>

//         {/* Wager breakdown */}
//         <div className="flex items-center gap-3 mb-3 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
//           <div className="flex items-center gap-1">
//             <Coins className="w-3 h-3 text-amber-400" />
//             <span className="text-white font-bold">{fmt(challenge.wagerAmount)}</span> wager each
//           </div>
//           <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
//           <div>Pool: <span className="text-white font-bold">{fmt(challenge.prizePool)}</span></div>
//           <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
//           <div>Fee: <span style={{ color: "#f97316" }}>{fmt(challenge.platformFee)}</span></div>
//         </div>

//         {/* Actions */}
//         <div className="flex items-center gap-2">
//           {isOpen && !isCreator && (
//             <motion.button
//               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
//               onClick={() => onAccept(challenge)}
//               disabled={!canAfford}
//               className="flex-1 py-2 rounded-xs text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
//               style={{
//                 background: canAfford ? game.accent : "rgba(255,255,255,0.06)",
//                 color: canAfford ? "white" : "rgba(255,255,255,0.4)",
//                 boxShadow: canAfford ? `0 0 20px ${game.glow}` : "none",
//               }}
//             >
//               <Swords className="w-3.5 h-3.5" />
//               {canAfford ? "Accept Challenge" : `Need ${fmt(challenge.wagerAmount)} tokens`}
//             </motion.button>
//           )}
//           {isCreator && (
//             <div className="flex-1 py-2 rounded-xs text-xs font-bold text-center"
//               style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
//               <Radio className="w-3 h-3 inline mr-1.5 animate-pulse text-emerald-400" />
//               Waiting for opponent…
//             </div>
//           )}
//           {!isOpen && (
//             <button onClick={() => onSpectate(challenge)}
//               className="flex-1 py-2 rounded-xs text-xs font-bold flex items-center justify-center gap-1.5"
//               style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
//               <Eye className="w-3 h-3" /> Watch Live
//             </button>
//           )}
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // NEURAL DOMINANCE GAME
// // ─────────────────────────────────────────────────────────────────────────────

// function NeuralDominanceGame({
//   challengeId, myUserId, opponentName, wager, onComplete,
// }: {
//   challengeId: string; myUserId: string; opponentName: string;
//   wager: number; onComplete: (myScore: number, opponentScore: number) => void;
// }) {
//   const totalRounds = 12;
//   const timePerRound = 8;

//   const [round,        setRound]        = useState(1);
//   const [myScore,      setMyScore]       = useState(0);
//   const [oppScore,     setOppScore]      = useState(0);
//   const [myMove,       setMyMove]        = useState<typeof NEURAL_MOVES[number] | null>(null);
//   const [myPred,       setMyPred]        = useState<typeof NEURAL_MOVES[number] | null>(null);
//   const [timeLeft,     setTimeLeft]      = useState(timePerRound);
//   const [phase,        setPhase]         = useState<"choose" | "reveal" | "complete">("choose");
//   const [roundResult,  setRoundResult]   = useState<{ myPts: number; oppPts: number; oppMove: string; label: string } | null>(null);
//   const [history,      setHistory]       = useState<{ move: string; pred: string; oppMove: string; myPts: number }[]>([]);
//   const [opponentReady,setOppReady]      = useState(false);
//   const [locked,       setLocked]        = useState(false);

//   const myScoreRef  = useRef(0);
//   const oppScoreRef = useRef(0);
//   const timerRef    = useRef<NodeJS.Timeout | null>(null);

//   // Simulate opponent AI for demo (in production: server-mediated)
//   const simulateOpponent = useCallback((): typeof NEURAL_MOVES[number] => {
//     // Opponent uses a weighted random + some pattern analysis
//     const weights = { ALPHA: 0.35, BETA: 0.4, GAMMA: 0.25 };
//     const r = Math.random();
//     if (r < weights.ALPHA) return "ALPHA";
//     if (r < weights.ALPHA + weights.BETA) return "BETA";
//     return "GAMMA";
//   }, []);

//   const resolveRound = useCallback((move: typeof NEURAL_MOVES[number], pred: typeof NEURAL_MOVES[number]) => {
//     const oppMove = simulateOpponent();
//     const oppPred = simulateOpponent(); // opponent's prediction of my move

//     let myPts  = 0;
//     let oppPts = 0;

//     // My correct prediction
//     if (pred === oppMove) myPts  += 15;
//     // Opponent correct prediction of me
//     if (oppPred === move) oppPts += 15;

//     // I played move that opponent failed to predict
//     if (oppPred !== move)  myPts  += 10;
//     // Opponent played move I failed to predict
//     if (pred !== oppMove)  oppPts += 10;

//     const label =
//       pred === oppMove && oppPred !== move ? "🎯 Perfect round — you dominated!" :
//       pred === oppMove ? "✅ Correct prediction!" :
//       oppPred !== move ? "💨 They missed you!" : "⚔️ Even exchange";

//     myScoreRef.current  += myPts;
//     oppScoreRef.current += oppPts;
//     setMyScore(myScoreRef.current);
//     setOppScore(oppScoreRef.current);
//     setRoundResult({ myPts, oppPts, oppMove, label });
//     setHistory(h => [...h, { move, pred, oppMove, myPts }]);
//     setPhase("reveal");

//     setTimeout(() => {
//       if (round >= totalRounds) {
//         setPhase("complete");
//         onComplete(myScoreRef.current, oppScoreRef.current);
//       } else {
//         setRound(r => r + 1);
//         setMyMove(null);
//         setMyPred(null);
//         setLocked(false);
//         setOppReady(false);
//         setRoundResult(null);
//         setTimeLeft(timePerRound);
//         setPhase("choose");
//       }
//     }, 2200);
//   }, [round, simulateOpponent, onComplete, totalRounds]);

//   // Timer
//   useEffect(() => {
//     if (phase !== "choose" || locked) return;
//     timerRef.current = setInterval(() => {
//       setTimeLeft(t => {
//         if (t <= 1) {
//           clearInterval(timerRef.current!);
//           // Auto-resolve with random if not chosen
//           const m = myMove ?? NEURAL_MOVES[Math.floor(Math.random() * 3)];
//           const p = myPred ?? NEURAL_MOVES[Math.floor(Math.random() * 3)];
//           setLocked(true);
//           resolveRound(m, p);
//           return 0;
//         }
//         return t - 1;
//       });
//     }, 1000);
//     // Simulate opponent "thinking"
//     const oppDelay = 1500 + Math.random() * 4000;
//     const t2 = setTimeout(() => setOppReady(true), oppDelay);
//     return () => { clearInterval(timerRef.current!); clearTimeout(t2); };
//   }, [phase, round]);

//   const handleLock = () => {
//     if (!myMove || !myPred || locked) return;
//     clearInterval(timerRef.current!);
//     setLocked(true);
//     resolveRound(myMove, myPred);
//   };

//   const timerPct = (timeLeft / timePerRound) * 100;
//   const timerCol = timeLeft <= 3 ? "#ef4444" : timeLeft <= 5 ? "#f59e0b" : "#a855f7";

//   return (
//     <div className="flex flex-col gap-4 h-full max-w-2xl mx-auto">
//       {/* Score bar */}
//       <div className="flex items-center gap-3">
//         <div className="flex-1 text-right">
//           <div className="text-2xl font-black" style={{ color: "#a855f7", letterSpacing: "-0.04em" }}>{myScore}</div>
//           <div className="text-[10px] text-white/30">You</div>
//         </div>
//         <div className="flex flex-col items-center gap-1 px-4">
//           <div className="text-[10px] font-black tracking-widest uppercase text-white/30">Round</div>
//           <div className="text-lg font-black text-white">{round}/{totalRounds}</div>
//         </div>
//         <div className="flex-1">
//           <div className="text-2xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.04em" }}>{oppScore}</div>
//           <div className="text-[10px] text-white/30">{opponentName}</div>
//         </div>
//       </div>

//       {/* Timer ring */}
//       <div className="relative flex items-center justify-center">
//         <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
//           <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
//           <motion.circle
//             cx="32" cy="32" r="28" fill="none"
//             stroke={timerCol} strokeWidth="4"
//             strokeLinecap="round"
//             strokeDasharray={`${2 * Math.PI * 28}`}
//             animate={{ strokeDashoffset: `${2 * Math.PI * 28 * (1 - timerPct / 100)}` }}
//             transition={{ duration: 0.3 }}
//           />
//         </svg>
//         <div className="absolute font-black text-xl" style={{ color: timerCol }}>{timeLeft}</div>
//       </div>

//       {/* Opponent status */}
//       <div className="flex items-center justify-center gap-2 text-[11px]">
//         <div className={`w-2 h-2 rounded-full ${opponentReady ? "bg-emerald-400" : "bg-white/20"}`}
//           style={{ boxShadow: opponentReady ? "0 0 8px #10b981" : "none" }} />
//         <span style={{ color: opponentReady ? "#10b981" : "rgba(255,255,255,0.3)" }}>
//           {opponentReady ? `${opponentName} is ready` : `${opponentName} is thinking…`}
//         </span>
//       </div>

//       {/* Move selection */}
//       <div className={`transition-opacity duration-300 ${phase === "choose" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
//         <p className="text-[10px] uppercase tracking-widest font-black text-white/30 text-center mb-3">Your Move</p>
//         <div className="grid grid-cols-3 gap-3">
//           {NEURAL_MOVES.map(m => {
//             const cfg = NEURAL_MOVE_CFG[m];
//             const sel = myMove === m;
//             return (
//               <motion.button key={m} whileTap={{ scale: 0.93 }} onClick={() => !locked && setMyMove(m)}
//                 className="py-4 rounded-xs flex flex-col items-center gap-2 transition-all"
//                 style={{
//                   background: sel ? `${cfg.color}25` : "rgba(255,255,255,0.04)",
//                   border: `2px solid ${sel ? cfg.color : "rgba(255,255,255,0.1)"}`,
//                   boxShadow: sel ? `0 0 24px ${cfg.color}40` : "none",
//                 }}>
//                 <span className="text-3xl font-black" style={{ color: cfg.color, fontFamily: "serif", letterSpacing: "-0.05em" }}>{cfg.symbol}</span>
//                 <span className="text-xs font-black text-white">{cfg.label}</span>
//                 <span className="text-[9px] text-center leading-tight px-1" style={{ color: "rgba(255,255,255,0.3)" }}>{cfg.desc}</span>
//               </motion.button>
//             );
//           })}
//         </div>

//         <p className="text-[10px] uppercase tracking-widest font-black text-white/30 text-center mt-4 mb-3">Predict Their Move</p>
//         <div className="flex gap-3">
//           {NEURAL_MOVES.map(m => {
//             const cfg = NEURAL_MOVE_CFG[m];
//             const sel = myPred === m;
//             return (
//               <motion.button key={m} whileTap={{ scale: 0.93 }} onClick={() => !locked && setMyPred(m)}
//                 className="flex-1 py-3 rounded-xs flex items-center justify-center gap-2 transition-all"
//                 style={{
//                   background: sel ? `${cfg.color}20` : "rgba(255,255,255,0.03)",
//                   border: `1px solid ${sel ? cfg.color : "rgba(255,255,255,0.08)"}`,
//                 }}>
//                 <span className="font-black" style={{ color: cfg.color, fontFamily: "serif" }}>{cfg.symbol}</span>
//                 <span className="text-xs font-bold text-white">{cfg.label}</span>
//               </motion.button>
//             );
//           })}
//         </div>

//         <motion.button
//           whileHover={{ scale: myMove && myPred ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
//           onClick={handleLock}
//           disabled={!myMove || !myPred || locked}
//           className="w-full mt-4 py-3.5 rounded-xs text-sm font-black disabled:opacity-30 disabled:cursor-not-allowed"
//           style={{ background: "#a855f7", boxShadow: "0 0 28px rgba(168,85,247,0.4)", color: "white" }}
//         >
//           🔒 Lock In
//         </motion.button>
//       </div>

//       {/* Reveal */}
//       <AnimatePresence>
//         {phase === "reveal" && roundResult && (
//           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
//             className="absolute inset-0 flex items-center justify-center z-30"
//             style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
//             <div className="text-center space-y-4">
//               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
//                 className="text-5xl">{roundResult.label.split(" ")[0]}</motion.div>
//               <p className="text-base font-black text-white" style={{ letterSpacing: "-0.02em" }}>{roundResult.label.slice(2)}</p>
//               <div className="flex gap-6 justify-center">
//                 <div className="text-center">
//                   <div className="text-3xl font-black" style={{ color: "#a855f7", letterSpacing: "-0.04em" }}>+{roundResult.myPts}</div>
//                   <div className="text-[10px] text-white/30">Your pts</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.04em" }}>+{roundResult.oppPts}</div>
//                   <div className="text-[10px] text-white/30">Their pts</div>
//                 </div>
//               </div>
//               <p className="text-xs text-white/40">
//                 They played: <span className="font-black text-white">{NEURAL_MOVE_CFG[roundResult.oppMove as keyof typeof NEURAL_MOVE_CFG].symbol}</span>
//               </p>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* History mini */}
//       {history.length > 0 && (
//         <div className="flex gap-1 overflow-x-auto pb-1">
//           {history.map((h, i) => (
//             <div key={i} className="flex-shrink-0 w-8 h-8 rounded-xs flex items-center justify-center text-sm font-black"
//               style={{
//                 background: h.myPts >= 20 ? "rgba(168,85,247,0.3)" : h.myPts >= 10 ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
//                 border: `1px solid ${h.myPts >= 20 ? "rgba(168,85,247,0.5)" : h.myPts >= 10 ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
//                 color: h.myPts >= 20 ? "#a855f7" : h.myPts >= 10 ? "#f59e0b" : "rgba(255,255,255,0.3)",
//                 fontFamily: "serif",
//               }}>
//               {NEURAL_MOVE_CFG[h.move as keyof typeof NEURAL_MOVE_CFG].symbol}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // PHANTOM GRID GAME
// // ─────────────────────────────────────────────────────────────────────────────

// function PhantomGridGame({
//   challengeId, myUserId, opponentName, wager, onComplete,
// }: {
//   challengeId: string; myUserId: string; opponentName: string;
//   wager: number; onComplete: (myScore: number, opponentScore: number) => void;
// }) {
//   const GRID = 8;
//   const PHANTOMS = 8;
//   const TOTAL_PROBES = 16;

//   type PlacementPhase = "placement" | "battle" | "complete";
//   type Cell = { hasMyPhantom: boolean; hasOppPhantom: boolean; probedByMe: boolean; probedByOpp: boolean };

//   const initGrid = (): Cell[][] =>
//     Array.from({ length: GRID }, () =>
//       Array.from({ length: GRID }, () => ({ hasMyPhantom: false, hasOppPhantom: false, probedByMe: false, probedByOpp: false }))
//     );

//   const [gamePhase,    setGamePhase]    = useState<PlacementPhase>("placement");
//   const [grid,         setGrid]         = useState<Cell[][]>(initGrid());
//   const [myPlaced,     setMyPlaced]     = useState(0);
//   const [myScore,      setMyScore]      = useState(0);
//   const [oppScore,     setOppScore]     = useState(0);
//   const [probesLeft,   setProbesLeft]   = useState(TOTAL_PROBES);
//   const [isMyTurn,     setIsMyTurn]     = useState(true);
//   const [lastProbe,    setLastProbe]    = useState<{ row: number; col: number; hit: boolean } | null>(null);
//   const [message,      setMessage]      = useState("Place your 8 phantom pieces");
//   const [hovCell,      setHovCell]      = useState<[number, number] | null>(null);

//   const myScoreRef  = useRef(0);
//   const oppScoreRef = useRef(0);

//   // Place phantoms (top half for me: rows 0-3)
//   const handleCellClick = (row: number, col: number) => {
//     if (gamePhase === "placement") {
//       if (row > 3) return; // can only place in top half
//       if (grid[row][col].hasMyPhantom) {
//         // Toggle off
//         setGrid(g => { const ng = g.map(r => r.map(c => ({ ...c }))); ng[row][col].hasMyPhantom = false; return ng; });
//         setMyPlaced(p => p - 1);
//         return;
//       }
//       if (myPlaced >= PHANTOMS) return;
//       setGrid(g => { const ng = g.map(r => r.map(c => ({ ...c }))); ng[row][col].hasMyPhantom = true; return ng; });
//       setMyPlaced(p => p + 1);
//     } else if (gamePhase === "battle" && isMyTurn) {
//       if (grid[row][col].probedByMe) return;
//       // Probe this cell
//       const hit = grid[row][col].hasOppPhantom;
//       myScoreRef.current += hit ? 20 : 0;
//       setMyScore(myScoreRef.current);
//       setGrid(g => { const ng = g.map(r => r.map(c => ({ ...c }))); ng[row][col].probedByMe = true; return ng; });
//       setLastProbe({ row, col, hit });
//       setMessage(hit ? `💥 HIT! +20 pts — phantom destroyed!` : `Miss. +5 pts to ${opponentName}`);
//       if (!hit) { oppScoreRef.current += 5; setOppScore(oppScoreRef.current); }

//       const newProbes = probesLeft - 1;
//       setProbesLeft(newProbes);
//       setIsMyTurn(false);

//       if (newProbes <= 0) {
//         setGamePhase("complete");
//         onComplete(myScoreRef.current, oppScoreRef.current);
//         return;
//       }

//       // Simulate opponent probe after delay
//       setTimeout(() => {
//         let oppR: number, oppC: number;
//         do { oppR = Math.floor(Math.random() * GRID); oppC = Math.floor(Math.random() * GRID); }
//         while (grid[oppR][oppC].probedByOpp);

//         const oppHit = grid[oppR][oppC].hasMyPhantom;
//         oppScoreRef.current += oppHit ? 20 : 0;
//         setOppScore(oppScoreRef.current);
//         if (!oppHit) { myScoreRef.current += 5; setMyScore(myScoreRef.current); }

//         setGrid(g => { const ng = g.map(r => r.map(c => ({ ...c }))); ng[oppR][oppC].probedByOpp = true; return ng; });
//         setMessage(oppHit ? `${opponentName} hit one of your phantoms! 💀` : `${opponentName} missed. +5 to you.`);
//         setIsMyTurn(true);
//       }, 1200 + Math.random() * 800);
//     }
//   };

//   const startBattle = () => {
//     if (myPlaced < PHANTOMS) return;
//     // Place opponent phantoms in bottom half randomly
//     const oppPositions: [number, number][] = [];
//     while (oppPositions.length < PHANTOMS) {
//       const r = 4 + Math.floor(Math.random() * 4);
//       const c = Math.floor(Math.random() * GRID);
//       if (!oppPositions.some(([pr, pc]) => pr === r && pc === c)) oppPositions.push([r, c]);
//     }
//     setGrid(g => {
//       const ng = g.map(r => r.map(c => ({ ...c })));
//       oppPositions.forEach(([r, c]) => { ng[r][c].hasOppPhantom = true; });
//       return ng;
//     });
//     setGamePhase("battle");
//     setMessage("Battle begun! Probe any cell to find opponent phantoms.");
//   };

//   const cellSize = 36;
//   const colors = { me: "#a855f7", opp: "#06b6d4", hit: "#10b981", miss: "#ef4444" };

//   return (
//     <div className="flex flex-col gap-4 items-center max-w-lg mx-auto w-full">
//       {/* Score */}
//       <div className="flex items-center gap-6 w-full">
//         <div className="flex-1 text-center">
//           <div className="text-2xl font-black" style={{ color: colors.me, letterSpacing: "-0.04em" }}>{myScore}</div>
//           <div className="text-[10px] text-white/30">You</div>
//         </div>
//         <div className="text-center">
//           <div className="text-[10px] font-black tracking-widest uppercase text-white/30">{gamePhase === "placement" ? "Place Phantoms" : `${probesLeft} probes left`}</div>
//           {gamePhase === "placement" && <div className="text-sm font-black text-white">{myPlaced}/{PHANTOMS}</div>}
//         </div>
//         <div className="flex-1 text-center">
//           <div className="text-2xl font-black" style={{ color: colors.opp, letterSpacing: "-0.04em" }}>{oppScore}</div>
//           <div className="text-[10px] text-white/30">{opponentName}</div>
//         </div>
//       </div>

//       {/* Message */}
//       <AnimatePresence mode="wait">
//         <motion.div key={message} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//           className="text-xs font-bold text-center px-3 py-2 rounded-xs w-full"
//           style={{
//             background: message.includes("HIT") || message.includes("hit") ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
//             border: message.includes("HIT") || message.includes("hit") ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.08)",
//             color: message.includes("HIT") ? "#10b981" : message.includes("Miss") || message.includes("miss") ? "#ef4444" : "rgba(255,255,255,0.6)",
//           }}>
//           {message}
//         </motion.div>
//       </AnimatePresence>

//       {/* Grid */}
//       <div className="relative" style={{ touchAction: "none" }}>
//         {/* Turn indicator */}
//         {gamePhase === "battle" && (
//           <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
//             <motion.div animate={{ opacity: isMyTurn ? [0.5, 1, 0.5] : 0.2 }} transition={{ repeat: Infinity, duration: 1.5 }}
//               className="w-2 h-8 rounded-full" style={{ background: colors.me }} />
//           </div>
//         )}

//         <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID}, ${cellSize}px)` }}>
//           {grid.map((row, ri) =>
//             row.map((cell, ci) => {
//               const isTop     = ri < 4;
//               const isHov     = hovCell?.[0] === ri && hovCell?.[1] === ci;
//               const myZone    = gamePhase === "placement" && isTop;
//               const showPhantom = cell.hasMyPhantom;
//               const probed    = cell.probedByMe;
//               const oppProbed = cell.probedByOpp;
//               const oppHit    = oppProbed && cell.hasMyPhantom;
//               const myHit     = probed && cell.hasOppPhantom;

//               let bg = "rgba(255,255,255,0.03)";
//               let border = "rgba(255,255,255,0.07)";
//               let glow = "none";

//               if (myZone && !showPhantom) { bg = "rgba(168,85,247,0.05)"; border = "rgba(168,85,247,0.15)"; }
//               if (showPhantom) { bg = "rgba(168,85,247,0.25)"; border = "#a855f7"; glow = `0 0 12px rgba(168,85,247,0.5)`; }
//               if (probed && !myHit) { bg = "rgba(255,255,255,0.02)"; border = "rgba(255,255,255,0.04)"; }
//               if (myHit) { bg = "rgba(16,185,129,0.3)"; border = "#10b981"; glow = `0 0 16px rgba(16,185,129,0.6)`; }
//               if (oppProbed && !oppHit) { bg = "rgba(239,68,68,0.05)"; border = "rgba(239,68,68,0.1)"; }
//               if (oppHit) { bg = "rgba(239,68,68,0.25)"; border = "#ef4444"; }
//               if (isHov && gamePhase === "battle" && isMyTurn && !probed) { bg = "rgba(6,182,212,0.15)"; border = "#06b6d4"; glow = `0 0 12px rgba(6,182,212,0.4)`; }

//               return (
//                 <motion.div key={`${ri}-${ci}`}
//                   layout
//                   onClick={() => handleCellClick(ri, ci)}
//                   onMouseEnter={() => setHovCell([ri, ci])}
//                   onMouseLeave={() => setHovCell(null)}
//                   whileTap={{ scale: 0.88 }}
//                   className="flex items-center justify-center rounded-xs cursor-pointer select-none"
//                   style={{
//                     width: cellSize, height: cellSize,
//                     background: bg,
//                     border: `1px solid ${border}`,
//                     boxShadow: glow,
//                     transition: "all 0.15s",
//                     fontSize: 14,
//                   }}>
//                   {showPhantom && !probed && "👻"}
//                   {myHit && "💥"}
//                   {probed && !myHit && "·"}
//                   {oppHit && "💀"}
//                   {gamePhase === "battle" && !probed && ri === lastProbe?.row && ci === lastProbe?.col && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full" style={{ background: lastProbe.hit ? "#10b981" : "#ef4444" }} />}
//                 </motion.div>
//               );
//             })
//           )}
//         </div>

//         {/* Zone labels */}
//         <div className="absolute -right-12 top-0 h-1/2 flex items-center">
//           <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: "rgba(168,85,247,0.5)", writingMode: "vertical-lr", transform: "rotate(180deg)" }}>Your zone</span>
//         </div>
//         <div className="absolute -right-16 top-1/2 h-1/2 flex items-center">
//           <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.5)", writingMode: "vertical-lr", transform: "rotate(180deg)" }}>Enemy</span>
//         </div>

//         {/* Centre divider */}
//         <div className="absolute left-0 right-0 h-px" style={{ top: "50%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.15) 70%, transparent)" }} />
//       </div>

//       {/* Start battle button */}
//       {gamePhase === "placement" && (
//         <motion.button
//           whileHover={{ scale: myPlaced >= PHANTOMS ? 1.03 : 1 }}
//           whileTap={{ scale: 0.97 }}
//           onClick={startBattle}
//           disabled={myPlaced < PHANTOMS}
//           className="w-full py-3.5 rounded-xs text-sm font-black disabled:opacity-30"
//           style={{ background: "#06b6d4", boxShadow: "0 0 28px rgba(6,182,212,0.4)", color: "white" }}
//         >
//           {myPlaced < PHANTOMS ? `Place ${PHANTOMS - myPlaced} more phantoms` : "⚔️ Begin Battle!"}
//         </motion.button>
//       )}

//       {gamePhase === "battle" && (
//         <div className="text-[10px] text-center" style={{ color: isMyTurn ? "#06b6d4" : "rgba(255,255,255,0.25)" }}>
//           {isMyTurn ? "👆 Your turn — click any enemy cell to probe" : `${opponentName} is probing…`}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CASHOUT PANEL
// // ─────────────────────────────────────────────────────────────────────────────

// function CashoutPanel({ balance, onClose }: { balance: number; onClose: () => void }) {
//   const [email, setEmail] = useState("");
//   const [submitted, setSubmitted] = useState(false);
//   const eligible = balance >= CASHOUT_MINIMUM;
//   const rate = 0.0001; // 1M tokens = £100 (example)
//   const gbpValue = (balance * rate).toFixed(2);

//   return (
//     <div className="max-w-lg mx-auto w-full space-y-5">
//       <div className="flex items-center justify-between">
//         <h2 className="text-xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>Cash Out</h2>
//         <button onClick={onClose}><X className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} /></button>
//       </div>

//       {/* Balance */}
//       <div className="rounded-xs p-5" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
//         <div className="flex items-center gap-3 mb-2">
//           <Coins className="w-6 h-6 text-amber-400" />
//           <span className="text-3xl font-black text-white" style={{ letterSpacing: "-0.05em" }}>{fmt(balance)}</span>
//           <span className="text-sm text-white/30">tokens</span>
//         </div>
//         <p className="text-sm" style={{ color: eligible ? "#f59e0b" : "#ef4444" }}>
//           {eligible ? `≈ £${gbpValue} GBP via PayPal` : `Minimum ${fmt(CASHOUT_MINIMUM)} tokens required to cash out`}
//         </p>
//         {!eligible && (
//           <div className="mt-3">
//             <div className="flex justify-between text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
//               <span>{fmt(balance)}</span><span>{fmt(CASHOUT_MINIMUM)}</span>
//             </div>
//             <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
//               <div className="h-full rounded-full" style={{ width: `${Math.min(100, (balance / CASHOUT_MINIMUM) * 100)}%`, background: "#f59e0b" }} />
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Warning */}
//       <div className="flex gap-3 px-4 py-3 rounded-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
//         <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
//         <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
//           Cashouts are processed manually within 5 business days. Platform fee of 5% is deducted from winnings at game time — cashout value is what you see here. Rate: 1,000,000 tokens = £100 GBP.
//         </p>
//       </div>

//       {eligible && !submitted && (
//         <>
//           <div>
//             <label className="text-[10px] uppercase tracking-widest font-black text-white/30 block mb-2">PayPal Email</label>
//             <input
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               placeholder="your@paypal.com"
//               type="email"
//               className="w-full px-4 py-3 rounded-xs text-sm text-white outline-none"
//               style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}
//             />
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
//             onClick={() => { if (email) setSubmitted(true); }}
//             disabled={!email}
//             className="w-full py-3.5 rounded-xs text-sm font-black disabled:opacity-40 flex items-center justify-center gap-2"
//             style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", boxShadow: "0 0 28px rgba(16,185,129,0.35)", color: "white" }}
//           >
//             <DollarSign className="w-4 h-4" /> Request Cashout — £{gbpValue}
//           </motion.button>
//         </>
//       )}

//       {submitted && (
//         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
//           className="text-center py-8 space-y-3">
//           <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
//             className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
//             style={{ background: "rgba(16,185,129,0.2)", border: "2px solid #10b981" }}>
//             <Check className="w-8 h-8 text-emerald-400" />
//           </motion.div>
//           <p className="text-lg font-black text-white">Request Submitted!</p>
//           <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
//             We'll process your PayPal payment of <strong className="text-white">£{gbpValue}</strong> within 5 business days to {email}.
//           </p>
//         </motion.div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN CLIENT COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────

// export function TokenRushClient() {
//   const { user, isSignedIn, isLoaded } = useUser();

//   const [view,           setView]           = useState<View>("arena");
//   const [challenges,     setChallenges]     = useState<Challenge[]>([]);
//   const [livePlayers,    setLivePlayers]    = useState<LivePlayer[]>([]);
//   const [tokenBalance,   setTokenBal]       = useState(0);
//   const [selectedGame,   setSelectedGame]   = useState<GameId>("NEURAL_DOMINANCE");
//   const [wager,          setWager]          = useState(WAGER_PRESETS[2]);
//   const [customWager,    setCustomWager]    = useState("");
//   const [activeChallenge,setActiveChallenge]= useState<Challenge | null>(null);
//   const [gameResult,     setGameResult]     = useState<GameResult | null>(null);
//   const [creating,       setCreating]       = useState(false);
//   const [showCashout,    setShowCashout]    = useState(false);
//   const [notification,   setNotif]          = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

//   const myId   = user?.id ?? "";
//   const myName = user?.firstName ?? user?.username ?? "Player";

//   // ── Load stats & live challenges ──────────────────────────────────────────
//   const loadData = useCallback(async () => {
//     if (!isSignedIn) return;
//     try {
//       const [statsRes, challengesRes] = await Promise.all([
//         fetch("/api/game/stats"),
//         fetch("/api/token-rush/challenges"),
//       ]);
//       if (statsRes.ok) { const d = await statsRes.json(); setTokenBal(d.wallet?.balance ?? 0); }
//       if (challengesRes.ok) { const d = await challengesRes.json(); setChallenges(d.challenges ?? []); setLivePlayers(d.livePlayers ?? []); }
//     } catch { /* silent */ }
//   }, [isSignedIn]);

//   useEffect(() => { loadData(); }, [loadData]);
//   useEffect(() => {
//     if (!isSignedIn) return;
//     const t = setInterval(loadData, 4000);
//     return () => clearInterval(t);
//   }, [isSignedIn, loadData]);

//   // ── Seed mock challenges for demo ─────────────────────────────────────────
//   useEffect(() => {
//     if (!isLoaded) return;
//     const mockGames: GameId[] = ["NEURAL_DOMINANCE", "PHANTOM_GRID", "NEURAL_DOMINANCE"];
//     const mockNames = ["NeuroKing_42", "PhantomX", "MindBender99"];
//     const mockWagers = [1000, 5000, 500];
//     const mock: Challenge[] = mockGames.map((g, i) => {
//       const { pool, fee, net } = calcFee(mockWagers[i]);
//       return {
//         id: `mock-${i}`, creatorId: `mock-user-${i}`, creatorName: mockNames[i],
//         gameId: g, wagerAmount: mockWagers[i], prizePool: pool, platformFee: fee, netPrize: net,
//         status: "open", createdAt: new Date(Date.now() - i * 45000).toISOString(), canPlay: true,
//       };
//     });
//     setChallenges(c => [...c.filter(x => !x.id.startsWith("mock-")), ...mock]);
//     setLivePlayers([
//       { userId: "mock-1", displayName: "NeuroKing_42", tokenBalance: 45200, isOnline: true, gamesPlayed: 87, winRate: 62 },
//       { userId: "mock-2", displayName: "PhantomX",     tokenBalance: 12800, isOnline: true, gamesPlayed: 34, winRate: 55 },
//       { userId: "mock-3", displayName: "MindBender99", tokenBalance: 230000, isOnline: true, gamesPlayed: 156, winRate: 71 },
//     ]);
//   }, [isLoaded]);

//   // ── Create challenge ──────────────────────────────────────────────────────
//   const handleCreate = async () => {
//     if (!isSignedIn) return;
//     const w = customWager ? parseInt(customWager) : wager;
//     if (w > tokenBalance) { setNotif({ text: "Insufficient tokens", type: "error" }); setTimeout(() => setNotif(null), 3000); return; }
//     setCreating(true);
//     const { pool, fee, net } = calcFee(w);
//     // In production: POST /api/token-rush/challenges
//     const newChallenge: Challenge = {
//       id: `ch-${Date.now()}`, creatorId: myId, creatorName: myName,
//       gameId: selectedGame, wagerAmount: w, prizePool: pool, platformFee: fee, netPrize: net,
//       status: "open", createdAt: new Date().toISOString(), canPlay: true,
//     };
//     setChallenges(c => [newChallenge, ...c]);
//     setTokenBal(b => b - w);
//     setCreating(false);
//     setView("arena");
//     setNotif({ text: `Challenge broadcast! Waiting for opponent…`, type: "success" });
//     setTimeout(() => setNotif(null), 4000);
//   };

//   // ── Accept challenge ──────────────────────────────────────────────────────
//   const handleAccept = (c: Challenge) => {
//     setActiveChallenge(c);
//     setTokenBal(b => b - c.wagerAmount);
//     setChallenges(prev => prev.map(x => x.id === c.id ? { ...x, status: "playing" } : x));
//     setView("playing");
//   };

//   // ── Game complete ─────────────────────────────────────────────────────────
//   const handleGameComplete = (myScore: number, oppScore: number) => {
//     if (!activeChallenge) return;
//     const iWon = myScore > oppScore;
//     const result: GameResult = {
//       winnerId:    iWon ? myId : (activeChallenge.acceptorId ?? "opp"),
//       winnerName:  iWon ? myName : (activeChallenge.creatorName),
//       myScore,
//       opponentScore: oppScore,
//       prizePool:   activeChallenge.prizePool,
//       platformFee: activeChallenge.platformFee,
//       netPrize:    activeChallenge.netPrize,
//       iWon,
//     };
//     setGameResult(result);
//     if (iWon) setTokenBal(b => b + activeChallenge.netPrize);
//     setView("result");
//   };

//   const game        = GAME_DEFS[selectedGame];
//   const effectiveWager = customWager ? parseInt(customWager) || 0 : wager;
//   const { pool: previewPool, fee: previewFee, net: previewNet } = calcFee(effectiveWager);
//   const openChallenges = challenges.filter(c => c.status === "open");
//   const liveChallenges = challenges.filter(c => c.status === "playing");

//   if (showCashout) {
//     return (
//       <div className="fixed inset-0 overflow-hidden" style={{ background: "#04040c", fontFamily: "'Sora', system-ui, sans-serif" }}>
//         <AmbientBg />
//         <div className="absolute top-0 left-0 right-0 h-[2px] z-10" style={{ background: "linear-gradient(90deg, transparent, #f59e0b 40%, #f59e0b50 100%)" }} />
//         <div className="relative z-10 overflow-y-auto h-full flex items-center justify-center p-6">
//           <CashoutPanel balance={tokenBalance} onClose={() => setShowCashout(false)} />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 overflow-hidden" style={{ background: "#04040c", fontFamily: "'Sora', system-ui, sans-serif" }}>
//       <AmbientBg />

//       {/* Top accent line */}
//       <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
//         style={{ background: "linear-gradient(90deg, transparent, #a855f7 30%, #06b6d4 70%, transparent)" }} />

//       {/* ── Header ── */}
//       <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5"
//         style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(4,4,12,0.9)", backdropFilter: "blur(16px)" }}>
//         <div className="flex items-center gap-3 sm:gap-4">
//           <Link href="/" aria-label="Home">
//             <Home className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
//           </Link>
//           <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.1)" }} />
//           <Link href="/games" className="text-xs font-bold flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}>
//             <ArrowLeft className="w-3.5 h-3.5" /> Games
//           </Link>
//           <div className="w-px h-4 hidden sm:block" style={{ background: "rgba(255,255,255,0.1)" }} />
//           <div className="hidden sm:flex items-center gap-2.5">
//             <div className="w-8 h-8 rounded-xs flex items-center justify-center"
//               style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(6,182,212,0.15))", border: "1px solid rgba(168,85,247,0.3)" }}>
//               <Swords className="w-4 h-4" style={{ color: "#a855f7" }} />
//             </div>
//             <div>
//               <h1 className="text-sm font-black text-white" style={{ letterSpacing: "-0.03em" }}>Token Rush</h1>
//               <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.28)" }}>Bet · Battle · Win</p>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2 sm:gap-3">
//           {/* Balance */}
//           {isSignedIn && (
//             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xs cursor-pointer"
//               style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
//               onClick={() => setShowCashout(true)}>
//               <Coins className="w-3.5 h-3.5 text-amber-400" />
//               <span className="text-sm font-black" style={{ color: "#f59e0b", letterSpacing: "-0.02em" }}>{fmtShort(tokenBalance)}</span>
//               {tokenBalance >= CASHOUT_MINIMUM && (
//                 <span className="text-[9px] font-black px-1.5 py-0.5 rounded-xs animate-pulse"
//                   style={{ background: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
//                   CASH OUT
//                 </span>
//               )}
//             </div>
//           )}

//           {/* Create challenge CTA */}
//           {isSignedIn && view === "arena" && (
//             <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
//               onClick={() => setView("challenge_create")}
//               className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xs text-xs font-black text-white"
//               style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 0 20px rgba(168,85,247,0.4)" }}>
//               <Swords className="w-3.5 h-3.5" />
//               <span className="hidden sm:inline">Create Challenge</span>
//               <span className="sm:hidden">+</span>
//             </motion.button>
//           )}

//           {view !== "arena" && (
//             <button onClick={() => setView("arena")}
//               className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-bold"
//               style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
//               <ArrowLeft className="w-3.5 h-3.5" /> Arena
//             </button>
//           )}
//         </div>
//       </header>

//       {/* ── Main ── */}
//       <main className="relative z-10 overflow-y-auto" style={{ height: "calc(100vh - 57px)" }}>
//         <AnimatePresence mode="wait">

//           {/* ══ ARENA ══════════════════════════════════════════════════════ */}
//           {view === "arena" && (
//             <motion.div key="arena" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">

//               {/* Hero */}
//               <div className="relative rounded-xs overflow-hidden"
//                 style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(6,182,212,0.06) 50%, rgba(245,158,11,0.04) 100%)", border: "1px solid rgba(168,85,247,0.2)" }}>
//                 <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #a855f7, #06b6d4 50%, transparent)" }} />
//                 <div className="px-6 sm:px-10 py-8 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
//                   <div>
//                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
//                       className="flex items-center gap-2 mb-3">
//                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 8px #10b981" }} />
//                       <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
//                         Live Arena · {openChallenges.length} open challenges
//                       </span>
//                     </motion.div>
//                     <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
//                       className="text-3xl sm:text-5xl font-black text-white mb-3" style={{ letterSpacing: "-0.05em", lineHeight: 1.1 }}>
//                       Bet Your Tokens.<br />
//                       <span style={{ background: "linear-gradient(90deg, #a855f7, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
//                         Battle Human Minds.
//                       </span>
//                     </motion.h2>
//                     <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
//                       className="text-sm max-w-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
//                       Two world-first skill games where intelligence wins. Challenge any online player, stake your tokens — winner takes all minus a 5% platform fee. Cash out at 1M tokens via PayPal.
//                     </motion.p>
//                   </div>
//                   <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
//                     className="flex-shrink-0 text-center">
//                     <div className="text-7xl mb-2">⚔️</div>
//                     <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
//                       5% platform fee
//                     </div>
//                   </motion.div>
//                 </div>
//               </div>

//               {/* Auth gate */}
//               {!isSignedIn && isLoaded && (
//                 <div className="rounded-xs p-8 text-center"
//                   style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
//                   <Lock className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(168,85,247,0.5)" }} />
//                   <p className="text-lg font-black text-white mb-1">Sign in to enter the arena</p>
//                   <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
//                     Your token wallet, wins, and cashout requests are tied to your account.
//                   </p>
//                   <a href="/sign-in" className="inline-block px-8 py-3 rounded-xs text-sm font-black text-white"
//                     style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 0 24px rgba(168,85,247,0.4)" }}>
//                     Sign In to Play
//                   </a>
//                 </div>
//               )}

//               {/* Games showcase */}
//               <div>
//                 <h3 className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
//                   The Games
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {(Object.values(GAME_DEFS) as typeof GAME_DEFS[GameId][]).map(g => (
//                     <GameCard key={g.id} game={g} selected={false} onClick={() => { setSelectedGame(g.id); setView("challenge_create"); }} />
//                   ))}
//                 </div>
//               </div>

//               {/* Live board */}
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Open challenges */}
//                 <div className="lg:col-span-2 space-y-3">
//                   <div className="flex items-center justify-between">
//                     <h3 className="text-xs font-black tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
//                       Open Challenges
//                     </h3>
//                     <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
//                       <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Live
//                     </div>
//                   </div>
//                   <AnimatePresence>
//                     {openChallenges.length === 0 ? (
//                       <div className="py-10 text-center rounded-xs"
//                         style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
//                         <Swords className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.1)" }} />
//                         <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>No open challenges — be the first!</p>
//                       </div>
//                     ) : (
//                       openChallenges.map(c => (
//                         <ChallengeCard key={c.id} challenge={c} myUserId={myId} tokenBalance={tokenBalance}
//                           onAccept={handleAccept} onSpectate={() => {}} />
//                       ))
//                     )}
//                   </AnimatePresence>

//                   {liveChallenges.length > 0 && (
//                     <>
//                       <h4 className="text-[10px] font-black tracking-widest uppercase pt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
//                         In Progress
//                       </h4>
//                       {liveChallenges.map(c => (
//                         <ChallengeCard key={c.id} challenge={c} myUserId={myId} tokenBalance={tokenBalance}
//                           onAccept={() => {}} onSpectate={() => {}} />
//                       ))}
//                     </>
//                   )}
//                 </div>

//                 {/* Live players sidebar */}
//                 <div className="space-y-3">
//                   <h3 className="text-xs font-black tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
//                     Online Players
//                   </h3>
//                   <div className="space-y-2">
//                     {livePlayers.map((p, i) => (
//                       <motion.div key={p.userId}
//                         initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
//                         className="flex items-center gap-3 px-3 py-2.5 rounded-xs"
//                         style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
//                         <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
//                           style={{ background: `rgba(168,85,247,0.2)`, color: "#a855f7" }}>
//                           {p.displayName.charAt(0)}
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <p className="text-xs font-bold text-white truncate">{p.displayName}</p>
//                           <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
//                             {p.winRate}% win · {p.gamesPlayed} games
//                           </p>
//                         </div>
//                         <div className="flex-shrink-0">
//                           <TokenBadge amount={p.tokenBalance} size="sm" />
//                         </div>
//                       </motion.div>
//                     ))}
//                     {livePlayers.length === 0 && (
//                       <div className="py-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
//                         No players online yet
//                       </div>
//                     )}
//                   </div>

//                   {/* Cashout CTA */}
//                   <div className="rounded-xs overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
//                     <Hairline accent="#f59e0b" />
//                     <div className="px-4 py-4 space-y-2">
//                       <div className="flex items-center gap-2">
//                         <DollarSign className="w-4 h-4 text-amber-400" />
//                         <span className="text-xs font-black text-white">Cash Out</span>
//                       </div>
//                       <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
//                         Reach 1,000,000 tokens to cash out via PayPal. Rate: 1M tokens = £100 GBP.
//                       </p>
//                       <div className="flex items-center justify-between text-[10px]">
//                         <span style={{ color: "rgba(255,255,255,0.3)" }}>Your balance</span>
//                         <span className="font-black" style={{ color: "#f59e0b" }}>{fmt(tokenBalance)}</span>
//                       </div>
//                       <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
//                         <div className="h-full rounded-full" style={{
//                           width: `${Math.min(100, (tokenBalance / CASHOUT_MINIMUM) * 100)}%`,
//                           background: tokenBalance >= CASHOUT_MINIMUM ? "#10b981" : "#f59e0b",
//                         }} />
//                       </div>
//                       {tokenBalance >= CASHOUT_MINIMUM ? (
//                         <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
//                           onClick={() => setShowCashout(true)}
//                           className="w-full py-2 rounded-xs text-xs font-black"
//                           style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", color: "white" }}>
//                           💰 Cash Out Now
//                         </motion.button>
//                       ) : (
//                         <p className="text-[9px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
//                           {fmt(CASHOUT_MINIMUM - tokenBalance)} more tokens needed
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {/* ══ CREATE CHALLENGE ═══════════════════════════════════════════ */}
//           {view === "challenge_create" && (
//             <motion.div key="create" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//               className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

//               <div>
//                 <h2 className="text-2xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>Create Challenge</h2>
//                 <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
//                   Set your wager — it will be broadcast to all online players instantly.
//                 </p>
//               </div>

//               {/* Game selection */}
//               <div>
//                 <p className="text-[10px] uppercase tracking-widest font-black mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Choose Game</p>
//                 <div className="grid grid-cols-1 gap-3">
//                   {(Object.values(GAME_DEFS) as typeof GAME_DEFS[GameId][]).map(g => (
//                     <GameCard key={g.id} game={g} selected={selectedGame === g.id} onClick={() => setSelectedGame(g.id)} />
//                   ))}
//                 </div>
//               </div>

//               {/* Wager */}
//               <div>
//                 <p className="text-[10px] uppercase tracking-widest font-black mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Wager Amount</p>
//                 <div className="grid grid-cols-3 gap-2 mb-3">
//                   {WAGER_PRESETS.map(w => (
//                     <button key={w} onClick={() => { setWager(w); setCustomWager(""); }}
//                       className="py-2.5 rounded-xs text-xs font-black transition-all"
//                       style={{
//                         background: wager === w && !customWager ? `${game.accent}20` : "rgba(255,255,255,0.04)",
//                         border: `1px solid ${wager === w && !customWager ? `${game.accent}50` : "rgba(255,255,255,0.08)"}`,
//                         color: wager === w && !customWager ? game.accent : "rgba(255,255,255,0.5)",
//                       }}>
//                       {fmt(w)}
//                     </button>
//                   ))}
//                 </div>
//                 <input
//                   value={customWager}
//                   onChange={e => setCustomWager(e.target.value.replace(/\D/g, ""))}
//                   placeholder="Custom amount…"
//                   className="w-full px-4 py-3 rounded-xs text-sm text-white outline-none"
//                   style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
//                 />
//               </div>

//               {/* Prize breakdown */}
//               <div className="rounded-xs p-5 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
//                 <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: "rgba(255,255,255,0.25)" }}>Prize Breakdown</p>
//                 {[
//                   { label: "Your wager",      val: fmt(effectiveWager),  col: "white" },
//                   { label: "Opponent wager",  val: fmt(effectiveWager),  col: "white" },
//                   { label: "Total prize pool",val: fmt(previewPool),     col: "#f59e0b" },
//                   { label: "Platform fee (5%)",val: fmt(previewFee),     col: "#f97316" },
//                   { label: "Winner receives", val: fmt(previewNet),      col: "#10b981" },
//                 ].map(r => (
//                   <div key={r.label} className="flex items-center justify-between text-xs">
//                     <span style={{ color: "rgba(255,255,255,0.4)" }}>{r.label}</span>
//                     <span className="font-black" style={{ color: r.col }}>{r.val}</span>
//                   </div>
//                 ))}
//               </div>

//               {/* Warnings */}
//               {effectiveWager > tokenBalance && (
//                 <div className="flex gap-2 px-4 py-2.5 rounded-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
//                   <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
//                   <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Insufficient tokens. You have {fmt(tokenBalance)}.</p>
//                 </div>
//               )}

//               <div className="flex gap-3">
//                 <button onClick={() => setView("arena")}
//                   className="flex-1 py-3 rounded-xs text-sm font-bold"
//                   style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
//                   Cancel
//                 </button>
//                 <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
//                   onClick={handleCreate}
//                   disabled={creating || effectiveWager > tokenBalance || effectiveWager <= 0 || !isSignedIn}
//                   className="flex-[2] py-3 rounded-xs text-sm font-black disabled:opacity-40 flex items-center justify-center gap-2 text-white"
//                   style={{ background: `linear-gradient(135deg, ${game.accent}, ${game.accentDark})`, boxShadow: `0 0 28px ${game.glow}` }}>
//                   {creating
//                     ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Broadcasting…</>
//                     : <><Radio className="w-4 h-4" />Broadcast Challenge</>}
//                 </motion.button>
//               </div>
//             </motion.div>
//           )}

//           {/* ══ PLAYING ════════════════════════════════════════════════════ */}
//           {view === "playing" && activeChallenge && (
//             <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               className="h-full flex flex-col">
//               {/* In-game header */}
//               <div className="flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0"
//                 style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.6)" }}>
//                 <div className="flex items-center gap-2.5">
//                   <span className="text-xl">{GAME_DEFS[activeChallenge.gameId].emoji}</span>
//                   <div>
//                     <p className="text-sm font-black text-white" style={{ letterSpacing: "-0.02em" }}>{GAME_DEFS[activeChallenge.gameId].name}</p>
//                     <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
//                       vs {activeChallenge.creatorId === myId ? (activeChallenge.acceptorName ?? "Opponent") : activeChallenge.creatorName}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
//                     <Coins className="w-3.5 h-3.5 text-amber-400" />
//                     <span className="font-black" style={{ color: "#f59e0b" }}>{fmt(activeChallenge.netPrize)}</span>
//                     <span>prize</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Game area */}
//               <div className="flex-1 overflow-y-auto p-4 sm:p-6">
//                 {activeChallenge.gameId === "NEURAL_DOMINANCE" && (
//                   <NeuralDominanceGame
//                     challengeId={activeChallenge.id}
//                     myUserId={myId}
//                     opponentName={activeChallenge.creatorId === myId ? (activeChallenge.acceptorName ?? "Opponent") : activeChallenge.creatorName}
//                     wager={activeChallenge.wagerAmount}
//                     onComplete={handleGameComplete}
//                   />
//                 )}
//                 {activeChallenge.gameId === "PHANTOM_GRID" && (
//                   <PhantomGridGame
//                     challengeId={activeChallenge.id}
//                     myUserId={myId}
//                     opponentName={activeChallenge.creatorId === myId ? (activeChallenge.acceptorName ?? "Opponent") : activeChallenge.creatorName}
//                     wager={activeChallenge.wagerAmount}
//                     onComplete={handleGameComplete}
//                   />
//                 )}
//               </div>
//             </motion.div>
//           )}

//           {/* ══ RESULT ═════════════════════════════════════════════════════ */}
//           {view === "result" && gameResult && (
//             <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               className="h-full flex items-center justify-center p-6">
//               <div className="max-w-md w-full space-y-6 text-center">
//                 {/* Trophy or skull */}
//                 <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12 }}>
//                   {gameResult.iWon
//                     ? <div className="text-8xl mb-2">🏆</div>
//                     : <div className="text-8xl mb-2">💀</div>}
//                 </motion.div>

//                 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
//                   <h2 className="text-4xl font-black mb-2" style={{
//                     letterSpacing: "-0.05em",
//                     background: gameResult.iWon ? "linear-gradient(90deg, #f59e0b, #10b981)" : "linear-gradient(90deg, #ef4444, #a855f7)",
//                     WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
//                   }}>
//                     {gameResult.iWon ? "Victory!" : "Defeated"}
//                   </h2>
//                   <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
//                     {gameResult.iWon ? `You dominated ${activeChallenge?.creatorName ?? "your opponent"}` : `${gameResult.winnerName} outplayed you this time`}
//                   </p>
//                 </motion.div>

//                 {/* Score */}
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
//                   className="flex justify-center gap-8">
//                   <div className="text-center">
//                     <div className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{gameResult.myScore}</div>
//                     <div className="text-[10px] text-white/30">Your score</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-3xl font-black text-white/40" style={{ letterSpacing: "-0.04em" }}>{gameResult.opponentScore}</div>
//                     <div className="text-[10px] text-white/30">Their score</div>
//                   </div>
//                 </motion.div>

//                 {/* Prize */}
//                 {gameResult.iWon && (
//                   <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, type: "spring" }}
//                     className="rounded-xs p-5"
//                     style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
//                     <div className="flex items-center justify-center gap-3">
//                       <Coins className="w-6 h-6 text-amber-400" />
//                       <div>
//                         <div className="text-3xl font-black" style={{ color: "#f59e0b", letterSpacing: "-0.05em" }}>+{fmt(gameResult.netPrize)}</div>
//                         <div className="text-[10px] text-white/30">tokens added to your wallet</div>
//                       </div>
//                     </div>
//                     <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
//                       Pool {fmt(gameResult.prizePool)} − fee {fmt(gameResult.platformFee)} = net {fmt(gameResult.netPrize)}
//                     </p>
//                   </motion.div>
//                 )}

//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
//                   className="flex gap-3">
//                   <button onClick={() => { setView("arena"); setGameResult(null); setActiveChallenge(null); }}
//                     className="flex-1 py-3 rounded-xs text-sm font-bold"
//                     style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
//                     Back to Arena
//                   </button>
//                   <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
//                     onClick={() => { setView("challenge_create"); setGameResult(null); setActiveChallenge(null); }}
//                     className="flex-1 py-3 rounded-xs text-sm font-black text-white"
//                     style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 0 24px rgba(168,85,247,0.4)" }}>
//                     Rematch
//                   </motion.button>
//                 </motion.div>
//               </div>
//             </motion.div>
//           )}

//         </AnimatePresence>
//       </main>

//       {/* ── Notification toast ── */}
//       <AnimatePresence>
//         {notification && (
//           <motion.div
//             initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
//             className="fixed bottom-6 left-6 z-[400] flex items-center gap-3 px-4 py-3 rounded-xs"
//             style={{
//               background: "rgba(8,8,18,0.98)",
//               border: `1px solid ${notification.type === "success" ? "rgba(16,185,129,0.35)" : notification.type === "error" ? "rgba(239,68,68,0.35)" : "rgba(99,102,241,0.35)"}`,
//               boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
//             }}>
//             <div className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-xs"
//               style={{ background: notification.type === "success" ? "#10b981" : notification.type === "error" ? "#ef4444" : "#6366f1" }} />
//             <Zap className="w-4 h-4 flex-shrink-0"
//               style={{ color: notification.type === "success" ? "#10b981" : notification.type === "error" ? "#ef4444" : "#818cf8" }} />
//             <span className="text-sm font-bold text-white">{notification.text}</span>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }




