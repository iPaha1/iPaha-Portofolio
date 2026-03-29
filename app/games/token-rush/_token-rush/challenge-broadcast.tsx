// =============================================================================
// TOKEN RUSH — Challenge Broadcast Toast
// components/token-rush/challenge-broadcast.tsx
//
// Non-blocking bottom-left corner notification.
// The page stays 100% interactive — no backdrop, no blur, no overlay.
// Queues multiple challenges and shows them sequentially.
//
// Drop into app/layout.tsx:
//   import { ChallengeBroadcast } from "@/components/token-rush/challenge-broadcast";
//   // Inside <body>, after {children}:
//   <ChallengeBroadcast />
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Swords, X, Coins, ChevronRight, Radio, Zap } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface LiveChallenge {
  id:          string;
  creatorId:   string;
  creatorName: string;
  gameId:      string;
  wagerAmount: number;
  netPrize:    number;
  createdAt:   string;
}

interface GameMeta {
  name:   string;
  emoji:  string;
  accent: string;
  dark:   string;
  glow:   string;
  tag:    string;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME META
// ─────────────────────────────────────────────────────────────────────────────

const GAME_META: Record<string, GameMeta> = {
  NEURAL_DOMINANCE: { name: "Neural Dominance", emoji: "🧠", accent: "#a855f7", dark: "#7c3aed", glow: "rgba(168,85,247,0.5)",  tag: "Psych War"    },
  PHANTOM_GRID:     { name: "Phantom Grid",     emoji: "👻", accent: "#06b6d4", dark: "#0891b2", glow: "rgba(6,182,212,0.5)",    tag: "Fog of War"   },
  ECHO_CHAMBER:     { name: "Echo Chamber",     emoji: "🎵", accent: "#f59e0b", dark: "#d97706", glow: "rgba(245,158,11,0.5)",   tag: "Audio Memory" },
  CIPHER_DUEL:      { name: "Cipher Duel",      emoji: "🔐", accent: "#10b981", dark: "#059669", glow: "rgba(16,185,129,0.5)",   tag: "Cryptography" },
  GRAVITY_MIND:     { name: "Gravity Mind",     emoji: "🌌", accent: "#6366f1", dark: "#4f46e5", glow: "rgba(99,102,241,0.5)",   tag: "Physics"      },
};
const FALLBACK: GameMeta = {
  name: "Token Rush", emoji: "⚔️", accent: "#a855f7",
  dark: "#7c3aed", glow: "rgba(168,85,247,0.5)", tag: "Duel",
};
const getMeta = (id: string): GameMeta => GAME_META[id] ?? FALLBACK;

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUND — compact chime, not overwhelming
// ─────────────────────────────────────────────────────────────────────────────

function playToastSound() {
  try {
    const W   = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext ?? W.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const tone = (
      freq: number, type: OscillatorType,
      start: number, dur: number, vol: number, freqEnd?: number,
    ) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      if (freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(freqEnd, 10), ctx.currentTime + start + dur,
        );
      }
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.04);
    };

    // Rising 3-note chime + sparkle — punchy but non-intrusive
    tone(120,  "sine",     0,    0.12, 0.22, 40);
    tone(440,  "sine",     0.07, 0.1,  0.28);
    tone(554,  "sine",     0.15, 0.11, 0.32);
    tone(659,  "sine",     0.23, 0.15, 0.34);
    tone(880,  "triangle", 0.32, 0.22, 0.25);
    tone(1318, "sine",     0.42, 0.18, 0.14);
    tone(110,  "sawtooth", 0.03, 0.55, 0.05, 80);

    setTimeout(() => { try { ctx.close(); } catch { /**/ } }, 2500);
  } catch { /**/ }
}

// ─────────────────────────────────────────────────────────────────────────────
// MICRO-PARTICLES — burst contained entirely within card bounds
// ─────────────────────────────────────────────────────────────────────────────

interface MP { id: number; x: number; y: number; tx: number; ty: number; color: string; size: number; delay: number }

function MicroBurst({ accent }: { accent: string }) {
  const particles: MP[] = useMemo(() => {
    const cols = [accent, "#f59e0b", "rgba(255,255,255,0.85)"];
    return Array.from({ length: 16 }, (_, i) => ({
      id:    i,
      x:     10 + Math.random() * 35,        // origin near emoji area
      y:     15 + Math.random() * 55,
      tx:    (Math.random() - 0.5) * 55,     // travel distance %
      ty:    -(15 + Math.random() * 45),
      color: cols[i % cols.length],
      size:  i < 5 ? 3 + Math.random() * 3 : 1.5 + Math.random() * 2.5,
      delay: Math.random() * 0.25,
    }));
  }, [accent]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 4 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, left: `${p.x}%`, top: `${p.y}%`, scale: 0 }}
          animate={{
            opacity: [0, 1, 0.8, 0],
            left:    `${p.x + p.tx}%`,
            top:     `${p.y + p.ty}%`,
            scale:   [0, 1, 0.6],
          }}
          transition={{
            duration: 0.75 + Math.random() * 0.35,
            delay:    p.delay,
            ease:     "easeOut",
            times:    [0, 0.18, 0.65, 1],
          }}
          style={{
            position:     "absolute",
            width:        p.size,
            height:       p.size,
            borderRadius: 2,
            background:   p.color,
            boxShadow:    `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN BAR — along the card bottom edge
// ─────────────────────────────────────────────────────────────────────────────

function CountdownBar({
  pct, accent, urgent,
}: { pct: number; accent: string; urgent: boolean }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden" style={{ borderRadius: "0 0 4px 4px" }}>
      <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.05)" }} />
      <motion.div
        className="absolute top-0 left-0 h-full"
        animate={{ width: `${pct * 100}%` }}
        transition={{ duration: 0.45, ease: "linear" }}
        style={{
          background: urgent
            ? "linear-gradient(90deg,#ef4444,#f97316)"
            : `linear-gradient(90deg,${accent},#f59e0b)`,
          boxShadow: urgent
            ? "0 0 8px rgba(239,68,68,0.9)"
            : `0 0 8px ${accent}`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED PRIZE — counts up from 0 on mount
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedPrize({ value }: { value: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let frame = 0;
    const FRAMES = 38;
    const id = setInterval(() => {
      frame++;
      const t = frame / FRAMES;
      const ease = 1 - Math.pow(1 - t, 3);
      setN(Math.floor(value * ease));
      if (frame >= FRAMES) { clearInterval(id); setN(value); }
    }, 18);
    return () => clearInterval(id);
  }, [value]);

  return (
    <span className="font-black tabular-nums"
      style={{
        fontSize:      "1.45rem",
        letterSpacing: "-0.04em",
        color:         "#f59e0b",
        textShadow:    "0 0 14px rgba(245,158,11,0.65)",
        lineHeight:    1,
      }}>
      {fmtTokens(n)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST TOAST CARD
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_SECS = 18;

interface ToastProps {
  challenge:  LiveChallenge;
  canAccept:  boolean;
  onAccept:   () => void;
  onDismiss:  () => void;
}

function BroadcastToast({ challenge, canAccept, onAccept, onDismiss }: ToastProps) {
  const meta                        = getMeta(challenge.gameId);
  const [timeLeft,   setTimeLeft]   = useState(AUTO_DISMISS_SECS);
  const [expanded,   setExpanded]   = useState(false);
  const [accepting,  setAccepting]  = useState(false);
  const pct    = timeLeft / AUTO_DISMISS_SECS;
  const urgent = timeLeft <= 5;

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); onDismiss(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 72, x: -10, scale: 0.9 }}
      animate={{ opacity: 1,  y: 0,  x: 0,  scale: 1   }}
      exit={{
        opacity: 0, y: 28, x: -6, scale: 0.93,
        transition: { duration: 0.22, ease: "easeIn" },
      }}
      transition={{ type: "spring", damping: 24, stiffness: 280, delay: 0.04 }}
      style={{
        width:       340,
        borderRadius: 4,
        background: "linear-gradient(148deg,rgba(9,9,21,0.97) 0%,rgba(15,7,30,0.97) 100%)",
        border:     `1px solid ${meta.accent}32`,
        boxShadow:  `0 0 0 1px ${meta.accent}10, 0 10px 40px rgba(0,0,0,0.75), 0 0 60px ${meta.glow}`,
        fontFamily: "'Sora', system-ui, sans-serif",
        position:   "relative",
        overflow:   "hidden",
      }}>

      {/* ── Left colour bar ── */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${meta.accent} 0%, #f59e0b 55%, ${meta.accent}55 100%)`,
      }} />

      {/* ── Top hairline sweep ── */}
      <motion.div
        initial={{ scaleX: 0, originX: "0%" }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.48, delay: 0.12, ease: "easeOut" }}
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1.5,
          background: `linear-gradient(90deg, ${meta.accent}, #f59e0b 50%, transparent)`,
        }} />

      {/* ── Scanline texture ── */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 4,
        opacity: 0.03, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)",
        backgroundSize: "100% 3px",
      }} />

      {/* ── Micro-particle burst ── */}
      <MicroBurst accent={meta.accent} />

      {/* ── Corner bracket — top right ── */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 14, height: 14,
        borderTop: `2px solid ${meta.accent}55`,
        borderRight: `2px solid ${meta.accent}55`,
        borderRadius: "0 4px 0 0",
        pointerEvents: "none",
      }} />

      {/* ── CONTENT ── */}
      <div style={{ paddingLeft: 14, paddingRight: 12, paddingTop: 12, paddingBottom: 14 }}>

        {/* Row 1 — live badge + tag + dismiss */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {/* Pulsing red live dot */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <motion.div
                animate={{ scale: [1, 1.9, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{
                  position: "absolute", width: 12, height: 12, borderRadius: 2,
                  background: "#ef4444",
                }} />
              <div style={{
                width: 6, height: 6, borderRadius: 2,
                background: "#f87171",
                boxShadow: "0 0 5px #ef4444",
                position: "relative", zIndex: 1,
              }} />
            </div>
            <span style={{
              fontSize: 9, fontWeight: 900, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "#f87171",
            }}>Live</span>
            {/* Game tag pill */}
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "2px 6px", borderRadius: 4,
              background: `${meta.accent}1a`,
              color: meta.accent,
              border: `1px solid ${meta.accent}2e`,
            }}>{meta.tag}</span>
          </div>

          <button
            onClick={onDismiss}
            style={{
              width: 20, height: 20, borderRadius: 4, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.05)", border: "none",
              cursor: "pointer", flexShrink: 0,
            }}>
            <X style={{ width: 11, height: 11, color: "rgba(255,255,255,0.38)" }} />
          </button>
        </div>

        {/* Row 2 — emoji + name + creator */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
          {/* Game emoji with spin ring */}
          <motion.div
            initial={{ scale: 0, rotate: -18 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
            style={{
              flexShrink: 0, width: 44, height: 44, borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `radial-gradient(circle at 38% 38%, ${meta.accent}2a, ${meta.accent}08)`,
              border: `1px solid ${meta.accent}2e`,
              boxShadow: `0 0 20px ${meta.glow}`,
              fontSize: "1.55rem",
              position: "relative",
            }}>
            {meta.emoji}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
              style={{
                position: "absolute", inset: 0, borderRadius: 4,
                border: `1px dashed ${meta.accent}1e`,
              }} />
          </motion.div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <motion.p
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.16, duration: 0.28 }}
              style={{
                fontWeight: 900, color: "#fff", fontSize: "0.92rem",
                letterSpacing: "-0.03em", lineHeight: 1.15,
                textShadow: `0 0 16px ${meta.accent}55`,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                margin: 0,
              }}>
              {meta.name}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 }}
              style={{
                fontSize: 10, marginTop: 2,
                color: "rgba(255,255,255,0.38)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                margin: "3px 0 0 0",
              }}>
              <span style={{ color: meta.accent }}>{challenge.creatorName}</span>
              {" is challenging everyone"}
            </motion.p>
          </div>
        </div>

        {/* Row 3 — Prize panel */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderRadius: 4, padding: "8px 12px", marginBottom: 10,
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.18)",
            position: "relative", overflow: "hidden",
          }}>
          {/* Shimmer */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", repeatDelay: 2.5 }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.07) 50%,transparent)",
            }} />

          {/* Left — net prize */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{
              fontSize: 8, fontWeight: 900, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
              margin: "0 0 3px 0",
            }}>Net Prize</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Coins style={{ width: 14, height: 14, color: "#f59e0b", flexShrink: 0 }} />
              <AnimatedPrize value={challenge.netPrize} />
            </div>
          </div>

          {/* Right — wager */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "right" }}>
            <p style={{
              fontSize: 8, fontWeight: 900, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
              margin: "0 0 3px 0",
            }}>Wager Each</p>
            <p style={{
              fontSize: 13, fontWeight: 900, letterSpacing: "-0.03em",
              color: "rgba(255,255,255,0.72)", margin: 0,
            }}>
              {fmtTokens(challenge.wagerAmount)}
            </p>
          </div>
        </motion.div>

        {/* Row 4 — CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          style={{ display: "flex", gap: 8 }}>

          {/* Accept button */}
          <motion.button
            whileHover={canAccept ? { scale: 1.03 } : {}}
            whileTap={canAccept ? { scale: 0.96 } : {}}
            onClick={canAccept && !accepting ? () => { setAccepting(true); onAccept(); } : undefined}
            style={{
              flex: 1, position: "relative", overflow: "hidden",
              borderRadius: 4, padding: "9px 12px",
              fontSize: 11, fontWeight: 900, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background:  canAccept ? `linear-gradient(135deg,${meta.accent},${meta.dark})` : "rgba(255,255,255,0.07)",
              boxShadow:   canAccept ? `0 0 22px ${meta.glow}` : "none",
              border:      canAccept ? "none" : "1px solid rgba(255,255,255,0.1)",
              cursor:      canAccept ? "pointer" : "not-allowed",
              opacity:     canAccept ? 1 : 0.42,
            }}>
            {/* Shimmer sweep loop */}
            {canAccept && (
              <motion.div
                animate={{ x: ["-110%", "210%"] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.8, ease: "easeInOut", repeatDelay: 2.8 }}
                style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)",
                }} />
            )}
            {accepting
              ? <div style={{ width: 13, height: 13, borderRadius: 2, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
              : <>
                  <Swords style={{ width: 11, height: 11, flexShrink: 0, position: "relative", zIndex: 1 }} />
                  <span style={{ position: "relative", zIndex: 1 }}>
                    {canAccept ? "Accept Challenge" : "Need tokens"}
                  </span>
                  {canAccept && <ChevronRight style={{ width: 11, height: 11, marginLeft: "auto", position: "relative", zIndex: 1 }} />}
                </>
            }
          </motion.button>

          {/* Dismiss button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDismiss}
            style={{
              padding: "9px 12px", borderRadius: 4,
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.32)",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer", flexShrink: 0,
            }}>
            Dismiss
          </motion.button>
        </motion.div>

        {/* Expand on hover — extra details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden" }}>
              <div style={{
                paddingTop: 10, marginTop: 10,
                borderTop: `1px solid ${meta.accent}18`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
                  <Radio style={{ width: 9, height: 9, color: "#10b981" }} />
                  Broadcast live
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
                  <Zap style={{ width: 9, height: 9, color: "#f59e0b" }} />
                  5% platform fee
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: urgent ? "#f87171" : "rgba(255,255,255,0.28)",
                }}>
                  {timeLeft}s left
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Countdown bar ── */}
      <CountdownBar pct={pct} accent={meta.accent} urgent={urgent} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE BADGE — "+N more" above card when challenges pile up
// ─────────────────────────────────────────────────────────────────────────────

function QueueBadge({ count, accent }: { count: number; accent: string }) {
  if (count <= 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.9 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 20,
        background: `${accent}1a`,
        border: `1px solid ${accent}30`,
        fontFamily: "'Sora', system-ui, sans-serif",
      }}>
      <div style={{ width: 5, height: 5, borderRadius: 1, background: accent }} />
      <span style={{ fontSize: 9, fontWeight: 800, color: accent }}>
        +{count} more challenge{count !== 1 ? "s" : ""} waiting
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS  = 5000;
const SEEN_KEY = "tr_seen_v2";

export function ChallengeBroadcast() {
  const router             = useRouter();
  const { user, isSignedIn } = useUser();

  const [queue,    setQueue]   = useState<LiveChallenge[]>([]);
  const [current,  setCurrent] = useState<LiveChallenge | null>(null);
  const [visible,  setVisible] = useState(false);
  const [tokenBal, setTokenBal] = useState(0);

  const seenRef    = useRef<Set<string>>(new Set());
  const acceptRef  = useRef(false);
  const showingRef = useRef(false);

  // Load seen IDs
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw) seenRef.current = new Set(JSON.parse(raw));
    } catch { /**/ }
  }, []);

  const markSeen = useCallback((id: string) => {
    seenRef.current.add(id);
    try {
      const arr = Array.from(seenRef.current).slice(-60);
      localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
    } catch { /**/ }
  }, []);

  // Show next from queue
  const showNext = useCallback((q: LiveChallenge[]) => {
    if (showingRef.current || q.length === 0) return;
    const [next, ...rest] = q;
    showingRef.current = true;
    setQueue(rest);
    setCurrent(next);
    setVisible(true);
    playToastSound();
  }, []);

  const dismiss = useCallback(() => {
    if (current) markSeen(current.id);
    setVisible(false);
    showingRef.current = false;
    setTimeout(() => {
      setCurrent(null);
      setQueue(prev => {
        if (prev.length > 0) setTimeout(() => showNext(prev), 700);
        return prev;
      });
    }, 300);
  }, [current, markSeen, showNext]);

  const handleAccept = useCallback(async () => {
    if (!current || acceptRef.current) return;
    acceptRef.current = true;
    markSeen(current.id);
    const id = current.id;
    setVisible(false);
    showingRef.current = false;
    setTimeout(() => setCurrent(null), 280);
    try {
      const res = await fetch(`/api/token-rush/challenges/${id}/accept`, { method: "POST" });
      router.push(res.ok ? `/token-rush?challenge=${id}` : "/token-rush");
    } catch {
      router.push("/token-rush");
    }
    acceptRef.current = false;
  }, [current, markSeen, router]);

  // Poll for new challenges
  useEffect(() => {
    const poll = async () => {
      try {
        const [challRes, statsRes] = await Promise.all([
          fetch("/api/token-rush/challenges"),
          isSignedIn ? fetch("/api/game/stats") : Promise.resolve(null),
        ]);

        if (statsRes?.ok) {
          const d = await statsRes.json();
          setTokenBal(d.wallet?.balance ?? 0);
        }
        if (!challRes.ok) return;

        const data = await challRes.json();
        const myId = user?.id ?? "";

        const fresh: LiveChallenge[] = (data.challenges ?? []).filter(
          (c: { status: string; creatorId: string; id: string }) =>
            c.status === "open" &&
            c.creatorId !== myId &&
            !seenRef.current.has(c.id),
        );

        if (fresh.length === 0) return;

        setQueue(prev => {
          const knownIds = new Set([...prev.map(c => c.id), ...(current ? [current.id] : [])]);
          const added    = fresh.filter(c => !knownIds.has(c.id));
          const merged   = [...prev, ...added];
          if (!showingRef.current && merged.length > 0) {
            setTimeout(() => showNext(merged), 120);
          }
          return merged;
        });
      } catch { /**/ }
    };

    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [isSignedIn, user?.id, current, showNext]);

  const canAccept = isSignedIn && current != null && tokenBal >= current.wagerAmount ? true : false;
  const meta      = current ? getMeta(current.gameId) : FALLBACK;
  const queueLen  = queue.length;

  return (
    <>
      {/* Inject spin keyframe once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/*
        Fixed bottom-left.
        pointer-events: none on the wrapper so the rest of the page
        is completely unaffected. Individual interactive elements
        set pointer-events: auto via inline styles / buttons.
      */}
      <div
        aria-live="polite"
        aria-label="Challenge broadcast"
        style={{
          position:      "fixed",
          bottom:        20,
          left:          20,
          zIndex:        500,
          display:       "flex",
          flexDirection: "column",
          alignItems:    "flex-start",
          gap:           8,
          pointerEvents: "none",
        }}>

        <AnimatePresence>
          {visible && queueLen > 0 && (
            <div key="badge" style={{ pointerEvents: "auto" }}>
              <QueueBadge count={queueLen} accent={meta.accent} />
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {visible && current && (
            <div key={current.id} style={{ pointerEvents: "auto" }}>
              <BroadcastToast
                challenge={current}
                canAccept={canAccept ?? false}
                onAccept={handleAccept}
                onDismiss={dismiss}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}





// // =============================================================================
// // TOKEN RUSH — Challenge Broadcast Toast
// // components/token-rush/challenge-broadcast.tsx
// //
// // Non-blocking bottom-left corner notification.
// // The page stays 100% interactive — no backdrop, no blur, no overlay.
// // Queues multiple challenges and shows them sequentially.
// //
// // Drop into app/layout.tsx:
// //   import { ChallengeBroadcast } from "@/components/token-rush/challenge-broadcast";
// //   // Inside <body>, after {children}:
// //   <ChallengeBroadcast />
// // =============================================================================
// "use client";

// import React, {
//   useState, useEffect, useRef, useCallback, useMemo,
// } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useRouter } from "next/navigation";
// import { useUser } from "@clerk/nextjs";
// import { Swords, X, Coins, ChevronRight, Radio, Zap } from "lucide-react";

// // ─────────────────────────────────────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────────────────────────────────────

// interface LiveChallenge {
//   id:          string;
//   creatorId:   string;
//   creatorName: string;
//   gameId:      string;
//   wagerAmount: number;
//   netPrize:    number;
//   createdAt:   string;
// }

// interface GameMeta {
//   name:   string;
//   emoji:  string;
//   accent: string;
//   dark:   string;
//   glow:   string;
//   tag:    string;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // GAME META
// // ─────────────────────────────────────────────────────────────────────────────

// const GAME_META: Record<string, GameMeta> = {
//   NEURAL_DOMINANCE: { name: "Neural Dominance", emoji: "🧠", accent: "#a855f7", dark: "#7c3aed", glow: "rgba(168,85,247,0.5)",  tag: "Psych War"    },
//   PHANTOM_GRID:     { name: "Phantom Grid",     emoji: "👻", accent: "#06b6d4", dark: "#0891b2", glow: "rgba(6,182,212,0.5)",    tag: "Fog of War"   },
//   ECHO_CHAMBER:     { name: "Echo Chamber",     emoji: "🎵", accent: "#f59e0b", dark: "#d97706", glow: "rgba(245,158,11,0.5)",   tag: "Audio Memory" },
//   CIPHER_DUEL:      { name: "Cipher Duel",      emoji: "🔐", accent: "#10b981", dark: "#059669", glow: "rgba(16,185,129,0.5)",   tag: "Cryptography" },
//   GRAVITY_MIND:     { name: "Gravity Mind",     emoji: "🌌", accent: "#6366f1", dark: "#4f46e5", glow: "rgba(99,102,241,0.5)",   tag: "Physics"      },
// };
// const FALLBACK: GameMeta = {
//   name: "Token Rush", emoji: "⚔️", accent: "#a855f7",
//   dark: "#7c3aed", glow: "rgba(168,85,247,0.5)", tag: "Duel",
// };
// const getMeta = (id: string): GameMeta => GAME_META[id] ?? FALLBACK;

// function fmtTokens(n: number) {
//   if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
//   if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
//   return n.toLocaleString();
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // SOUND — compact chime, not overwhelming
// // ─────────────────────────────────────────────────────────────────────────────

// function playToastSound() {
//   try {
//     const W   = window as unknown as { webkitAudioContext?: typeof AudioContext };
//     const Ctx = window.AudioContext ?? W.webkitAudioContext;
//     if (!Ctx) return;
//     const ctx = new Ctx();

//     const tone = (
//       freq: number, type: OscillatorType,
//       start: number, dur: number, vol: number, freqEnd?: number,
//     ) => {
//       const osc  = ctx.createOscillator();
//       const gain = ctx.createGain();
//       osc.connect(gain);
//       gain.connect(ctx.destination);
//       osc.type = type;
//       osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
//       if (freqEnd !== undefined) {
//         osc.frequency.exponentialRampToValueAtTime(
//           Math.max(freqEnd, 10), ctx.currentTime + start + dur,
//         );
//       }
//       gain.gain.setValueAtTime(0, ctx.currentTime + start);
//       gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.008);
//       gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
//       osc.start(ctx.currentTime + start);
//       osc.stop(ctx.currentTime + start + dur + 0.04);
//     };

//     // Rising 3-note chime + sparkle — punchy but non-intrusive
//     tone(120,  "sine",     0,    0.12, 0.22, 40);
//     tone(440,  "sine",     0.07, 0.1,  0.28);
//     tone(554,  "sine",     0.15, 0.11, 0.32);
//     tone(659,  "sine",     0.23, 0.15, 0.34);
//     tone(880,  "triangle", 0.32, 0.22, 0.25);
//     tone(1318, "sine",     0.42, 0.18, 0.14);
//     tone(110,  "sawtooth", 0.03, 0.55, 0.05, 80);

//     setTimeout(() => { try { ctx.close(); } catch { /**/ } }, 2500);
//   } catch { /**/ }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MICRO-PARTICLES — burst contained entirely within card bounds
// // ─────────────────────────────────────────────────────────────────────────────

// interface MP { id: number; x: number; y: number; tx: number; ty: number; color: string; size: number; delay: number }

// function MicroBurst({ accent }: { accent: string }) {
//   const particles: MP[] = useMemo(() => {
//     const cols = [accent, "#f59e0b", "rgba(255,255,255,0.85)"];
//     return Array.from({ length: 16 }, (_, i) => ({
//       id:    i,
//       x:     10 + Math.random() * 35,        // origin near emoji area
//       y:     15 + Math.random() * 55,
//       tx:    (Math.random() - 0.5) * 55,     // travel distance %
//       ty:    -(15 + Math.random() * 45),
//       color: cols[i % cols.length],
//       size:  i < 5 ? 3 + Math.random() * 3 : 1.5 + Math.random() * 2.5,
//       delay: Math.random() * 0.25,
//     }));
//   }, [accent]);

//   return (
//     <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 10 }}>
//       {particles.map(p => (
//         <motion.div
//           key={p.id}
//           initial={{ opacity: 0, left: `${p.x}%`, top: `${p.y}%`, scale: 0 }}
//           animate={{
//             opacity: [0, 1, 0.8, 0],
//             left:    `${p.x + p.tx}%`,
//             top:     `${p.y + p.ty}%`,
//             scale:   [0, 1, 0.6],
//           }}
//           transition={{
//             duration: 0.75 + Math.random() * 0.35,
//             delay:    p.delay,
//             ease:     "easeOut",
//             times:    [0, 0.18, 0.65, 1],
//           }}
//           style={{
//             position:     "absolute",
//             width:        p.size,
//             height:       p.size,
//             borderRadius: "0%",
//             background:   p.color,
//             boxShadow:    `0 0 ${p.size * 2}px ${p.color}`,
//           }}
//         />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // COUNTDOWN BAR — along the card bottom edge
// // ─────────────────────────────────────────────────────────────────────────────

// function CountdownBar({
//   pct, accent, urgent,
// }: { pct: number; accent: string; urgent: boolean }) {
//   return (
//     <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden" style={{ borderRadius: "0 0 10px 10px" }}>
//       <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.05)" }} />
//       <motion.div
//         className="absolute top-0 left-0 h-full"
//         animate={{ width: `${pct * 100}%` }}
//         transition={{ duration: 0.45, ease: "linear" }}
//         style={{
//           background: urgent
//             ? "linear-gradient(90deg,#ef4444,#f97316)"
//             : `linear-gradient(90deg,${accent},#f59e0b)`,
//           boxShadow: urgent
//             ? "0 0 8px rgba(239,68,68,0.9)"
//             : `0 0 8px ${accent}`,
//         }}
//       />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // ANIMATED PRIZE — counts up from 0 on mount
// // ─────────────────────────────────────────────────────────────────────────────

// function AnimatedPrize({ value }: { value: number }) {
//   const [n, setN] = useState(0);

//   useEffect(() => {
//     let frame = 0;
//     const FRAMES = 38;
//     const id = setInterval(() => {
//       frame++;
//       const t = frame / FRAMES;
//       const ease = 1 - Math.pow(1 - t, 3);
//       setN(Math.floor(value * ease));
//       if (frame >= FRAMES) { clearInterval(id); setN(value); }
//     }, 18);
//     return () => clearInterval(id);
//   }, [value]);

//   return (
//     <span className="font-black tabular-nums"
//       style={{
//         fontSize:      "1.45rem",
//         letterSpacing: "-0.04em",
//         color:         "#f59e0b",
//         textShadow:    "0 0 14px rgba(245,158,11,0.65)",
//         lineHeight:    1,
//       }}>
//       {fmtTokens(n)}
//     </span>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // BROADCAST TOAST CARD
// // ─────────────────────────────────────────────────────────────────────────────

// const AUTO_DISMISS_SECS = 18;

// interface ToastProps {
//   challenge:  LiveChallenge;
//   canAccept:  boolean;
//   onAccept:   () => void;
//   onDismiss:  () => void;
// }

// function BroadcastToast({ challenge, canAccept, onAccept, onDismiss }: ToastProps) {
//   const meta                        = getMeta(challenge.gameId);
//   const [timeLeft,   setTimeLeft]   = useState(AUTO_DISMISS_SECS);
//   const [expanded,   setExpanded]   = useState(false);
//   const [accepting,  setAccepting]  = useState(false);
//   const pct    = timeLeft / AUTO_DISMISS_SECS;
//   const urgent = timeLeft <= 5;

//   // Countdown timer
//   useEffect(() => {
//     const t = setInterval(() => {
//       setTimeLeft(s => {
//         if (s <= 1) { clearInterval(t); onDismiss(); return 0; }
//         return s - 1;
//       });
//     }, 1000);
//     return () => clearInterval(t);
//   }, [onDismiss]);

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 72, x: -10, scale: 0.9 }}
//       animate={{ opacity: 1,  y: 0,  x: 0,  scale: 1   }}
//       exit={{
//         opacity: 0, y: 28, x: -6, scale: 0.93,
//         transition: { duration: 0.22, ease: "easeIn" },
//       }}
//       transition={{ type: "spring", damping: 24, stiffness: 280, delay: 0.04 }}
//       onHoverStart={() => setExpanded(true)}
//       onHoverEnd={() => setExpanded(false)}
//       style={{
//         width:      340,
//         borderRadius: 10,
//         background: "linear-gradient(148deg,rgba(9,9,21,0.97) 0%,rgba(15,7,30,0.97) 100%)",
//         border:     `1px solid ${meta.accent}32`,
//         boxShadow:  `0 0 0 1px ${meta.accent}10, 0 10px 40px rgba(0,0,0,0.75), 0 0 60px ${meta.glow}`,
//         fontFamily: "'Sora', system-ui, sans-serif",
//         position:   "relative",
//         overflow:   "hidden",
//       }}>

//       {/* ── Left colour bar ── */}
//       <div style={{
//         position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
//         background: `linear-gradient(180deg, ${meta.accent} 0%, #f59e0b 55%, ${meta.accent}55 100%)`,
//       }} />

//       {/* ── Top hairline sweep ── */}
//       <motion.div
//         initial={{ scaleX: 0, originX: "0%" }}
//         animate={{ scaleX: 1 }}
//         transition={{ duration: 0.48, delay: 0.12, ease: "easeOut" }}
//         style={{
//           position: "absolute", top: 0, left: 0, right: 0, height: 1.5,
//           background: `linear-gradient(90deg, ${meta.accent}, #f59e0b 50%, transparent)`,
//         }} />

//       {/* ── Scanline texture ── */}
//       <div style={{
//         position: "absolute", inset: 0, borderRadius: 10,
//         opacity: 0.03, pointerEvents: "none",
//         backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)",
//         backgroundSize: "100% 3px",
//       }} />

//       {/* ── Micro-particle burst ── */}
//       <MicroBurst accent={meta.accent} />

//       {/* ── Corner bracket — top right ── */}
//       <div style={{
//         position: "absolute", top: 0, right: 0,
//         width: 14, height: 14,
//         borderTop: `2px solid ${meta.accent}55`,
//         borderRight: `2px solid ${meta.accent}55`,
//         borderRadius: "0 10px 0 0",
//         pointerEvents: "none",
//       }} />

//       {/* ── CONTENT ── */}
//       <div style={{ paddingLeft: 14, paddingRight: 12, paddingTop: 12, paddingBottom: 14 }}>

//         {/* Row 1 — live badge + tag + dismiss */}
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
//             {/* Pulsing red live dot */}
//             <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
//               <motion.div
//                 animate={{ scale: [1, 1.9, 1], opacity: [0.5, 0, 0.5] }}
//                 transition={{ repeat: Infinity, duration: 1.5 }}
//                 style={{
//                   position: "absolute", width: 12, height: 12, borderRadius: "0%",
//                   background: "#ef4444",
//                 }} />
//               <div style={{
//                 width: 6, height: 6, borderRadius: "0%",
//                 background: "#f87171",
//                 boxShadow: "0 0 5px #ef4444",
//                 position: "relative", zIndex: 1,
//               }} />
//             </div>
//             <span style={{
//               fontSize: 9, fontWeight: 900, letterSpacing: "0.18em",
//               textTransform: "uppercase", color: "#f87171",
//             }}>Live</span>
//             {/* Game tag pill */}
//             <span style={{
//               fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
//               textTransform: "uppercase",
//               padding: "2px 6px", borderRadius: 4,
//               background: `${meta.accent}1a`,
//               color: meta.accent,
//               border: `1px solid ${meta.accent}2e`,
//             }}>{meta.tag}</span>
//           </div>

//           <button
//             onClick={onDismiss}
//             style={{
//               width: 20, height: 20, borderRadius: 5, display: "flex",
//               alignItems: "center", justifyContent: "center",
//               background: "rgba(255,255,255,0.05)", border: "none",
//               cursor: "pointer", flexShrink: 0,
//             }}>
//             <X style={{ width: 11, height: 11, color: "rgba(255,255,255,0.38)" }} />
//           </button>
//         </div>

//         {/* Row 2 — emoji + name + creator */}
//         <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
//           {/* Game emoji with spin ring */}
//           <motion.div
//             initial={{ scale: 0, rotate: -18 }}
//             animate={{ scale: 1, rotate: 0 }}
//             transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
//             style={{
//               flexShrink: 0, width: 44, height: 44, borderRadius: 10,
//               display: "flex", alignItems: "center", justifyContent: "center",
//               background: `radial-gradient(circle at 38% 38%, ${meta.accent}2a, ${meta.accent}08)`,
//               border: `1px solid ${meta.accent}2e`,
//               boxShadow: `0 0 20px ${meta.glow}`,
//               fontSize: "1.55rem",
//               position: "relative",
//             }}>
//             {meta.emoji}
//             <motion.div
//               animate={{ rotate: 360 }}
//               transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
//               style={{
//                 position: "absolute", inset: 0, borderRadius: 10,
//                 border: `1px dashed ${meta.accent}1e`,
//               }} />
//           </motion.div>

//           <div style={{ flex: 1, minWidth: 0 }}>
//             <motion.p
//               initial={{ opacity: 0, x: -6 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.16, duration: 0.28 }}
//               style={{
//                 fontWeight: 900, color: "#fff", fontSize: "0.92rem",
//                 letterSpacing: "-0.03em", lineHeight: 1.15,
//                 textShadow: `0 0 16px ${meta.accent}55`,
//                 overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
//                 margin: 0,
//               }}>
//               {meta.name}
//             </motion.p>
//             <motion.p
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ delay: 0.22 }}
//               style={{
//                 fontSize: 10, marginTop: 2,
//                 color: "rgba(255,255,255,0.38)",
//                 overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
//                 margin: "3px 0 0 0",
//               }}>
//               <span style={{ color: meta.accent }}>{challenge.creatorName}</span>
//               {" is challenging everyone"}
//             </motion.p>
//           </div>
//         </div>

//         {/* Row 3 — Prize panel */}
//         <motion.div
//           initial={{ opacity: 0, y: 5 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.26 }}
//           style={{
//             display: "flex", alignItems: "center", justifyContent: "space-between",
//             borderRadius: 8, padding: "8px 12px", marginBottom: 10,
//             background: "rgba(245,158,11,0.07)",
//             border: "1px solid rgba(245,158,11,0.18)",
//             position: "relative", overflow: "hidden",
//           }}>
//           {/* Shimmer */}
//           <motion.div
//             animate={{ x: ["-100%", "200%"] }}
//             transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", repeatDelay: 2.5 }}
//             style={{
//               position: "absolute", inset: 0, pointerEvents: "none",
//               background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.07) 50%,transparent)",
//             }} />

//           {/* Left — net prize */}
//           <div style={{ position: "relative", zIndex: 1 }}>
//             <p style={{
//               fontSize: 8, fontWeight: 900, letterSpacing: "0.18em",
//               textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
//               margin: "0 0 3px 0",
//             }}>Net Prize</p>
//             <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
//               <Coins style={{ width: 14, height: 14, color: "#f59e0b", flexShrink: 0 }} />
//               <AnimatedPrize value={challenge.netPrize} />
//             </div>
//           </div>

//           {/* Right — wager */}
//           <div style={{ position: "relative", zIndex: 1, textAlign: "right" }}>
//             <p style={{
//               fontSize: 8, fontWeight: 900, letterSpacing: "0.18em",
//               textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
//               margin: "0 0 3px 0",
//             }}>Wager Each</p>
//             <p style={{
//               fontSize: 13, fontWeight: 900, letterSpacing: "-0.03em",
//               color: "rgba(255,255,255,0.72)", margin: 0,
//             }}>
//               {fmtTokens(challenge.wagerAmount)}
//             </p>
//           </div>
//         </motion.div>

//         {/* Row 4 — CTAs */}
//         <motion.div
//           initial={{ opacity: 0, y: 5 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.32 }}
//           style={{ display: "flex", gap: 8 }}>

//           {/* Accept button */}
//           <motion.button
//             whileHover={canAccept ? { scale: 1.03 } : {}}
//             whileTap={canAccept ? { scale: 0.96 } : {}}
//             onClick={canAccept && !accepting ? () => { setAccepting(true); onAccept(); } : undefined}
//             style={{
//               flex: 1, position: "relative", overflow: "hidden",
//               borderRadius: 8, padding: "9px 12px",
//               fontSize: 11, fontWeight: 900, color: "#fff",
//               display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
//               background:  canAccept ? `linear-gradient(135deg,${meta.accent},${meta.dark})` : "rgba(255,255,255,0.07)",
//               boxShadow:   canAccept ? `0 0 22px ${meta.glow}` : "none",
//               border:      canAccept ? "none" : "1px solid rgba(255,255,255,0.1)",
//               cursor:      canAccept ? "pointer" : "not-allowed",
//               opacity:     canAccept ? 1 : 0.42,
//             }}>
//             {/* Shimmer sweep loop */}
//             {canAccept && (
//               <motion.div
//                 animate={{ x: ["-110%", "210%"] }}
//                 transition={{ repeat: Infinity, duration: 1.5, delay: 0.8, ease: "easeInOut", repeatDelay: 2.8 }}
//                 style={{
//                   position: "absolute", inset: 0, pointerEvents: "none",
//                   background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)",
//                 }} />
//             )}
//             {accepting
//               ? <div style={{ width: 13, height: 13, borderRadius: "0%", border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
//               : <>
//                   <Swords style={{ width: 11, height: 11, flexShrink: 0, position: "relative", zIndex: 1 }} />
//                   <span style={{ position: "relative", zIndex: 1 }}>
//                     {canAccept ? "Accept Challenge" : "Need tokens"}
//                   </span>
//                   {canAccept && <ChevronRight style={{ width: 11, height: 11, marginLeft: "auto", position: "relative", zIndex: 1 }} />}
//                 </>
//             }
//           </motion.button>

//           {/* Dismiss button */}
//           <motion.button
//             whileHover={{ scale: 1.04 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={onDismiss}
//             style={{
//               padding: "9px 12px", borderRadius: 8,
//               fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.32)",
//               background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
//               cursor: "pointer", flexShrink: 0,
//             }}>
//             Dismiss
//           </motion.button>
//         </motion.div>

//         {/* Expand on hover — extra details */}
//         <AnimatePresence>
//           {expanded && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               transition={{ duration: 0.18 }}
//               style={{ overflow: "hidden" }}>
//               <div style={{
//                 paddingTop: 10, marginTop: 10,
//                 borderTop: `1px solid ${meta.accent}18`,
//                 display: "flex", alignItems: "center", justifyContent: "space-between",
//               }}>
//                 <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
//                   <Radio style={{ width: 9, height: 9, color: "#10b981" }} />
//                   Broadcast live
//                 </span>
//                 <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
//                   <Zap style={{ width: 9, height: 9, color: "#f59e0b" }} />
//                   5% platform fee
//                 </span>
//                 <span style={{
//                   fontSize: 9, fontWeight: 700,
//                   color: urgent ? "#f87171" : "rgba(255,255,255,0.28)",
//                 }}>
//                   {timeLeft}s left
//                 </span>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* ── Countdown bar ── */}
//       <CountdownBar pct={pct} accent={meta.accent} urgent={urgent} />
//     </motion.div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // QUEUE BADGE — "+N more" above card when challenges pile up
// // ─────────────────────────────────────────────────────────────────────────────

// function QueueBadge({ count, accent }: { count: number; accent: string }) {
//   if (count <= 0) return null;
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 8, scale: 0.85 }}
//       animate={{ opacity: 1, y: 0, scale: 1 }}
//       exit={{ opacity: 0, y: 4, scale: 0.9 }}
//       style={{
//         display: "inline-flex", alignItems: "center", gap: 5,
//         padding: "4px 10px", borderRadius: 20,
//         background: `${accent}1a`,
//         border: `1px solid ${accent}30`,
//         fontFamily: "'Sora', system-ui, sans-serif",
//       }}>
//       <div style={{ width: 5, height: 5, borderRadius: "0%", background: accent }} />
//       <span style={{ fontSize: 9, fontWeight: 800, color: accent }}>
//         +{count} more challenge{count !== 1 ? "s" : ""} waiting
//       </span>
//     </motion.div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN EXPORT
// // ─────────────────────────────────────────────────────────────────────────────

// const POLL_MS  = 5000;
// const SEEN_KEY = "tr_seen_v2";

// export function ChallengeBroadcast() {
//   const router             = useRouter();
//   const { user, isSignedIn } = useUser();

//   const [queue,    setQueue]   = useState<LiveChallenge[]>([]);
//   const [current,  setCurrent] = useState<LiveChallenge | null>(null);
//   const [visible,  setVisible] = useState(false);
//   const [tokenBal, setTokenBal] = useState(0);

//   const seenRef    = useRef<Set<string>>(new Set());
//   const acceptRef  = useRef(false);
//   const showingRef = useRef(false);

//   // Load seen IDs
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem(SEEN_KEY);
//       if (raw) seenRef.current = new Set(JSON.parse(raw));
//     } catch { /**/ }
//   }, []);

//   const markSeen = useCallback((id: string) => {
//     seenRef.current.add(id);
//     try {
//       const arr = Array.from(seenRef.current).slice(-60);
//       localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
//     } catch { /**/ }
//   }, []);

//   // Show next from queue
//   const showNext = useCallback((q: LiveChallenge[]) => {
//     if (showingRef.current || q.length === 0) return;
//     const [next, ...rest] = q;
//     showingRef.current = true;
//     setQueue(rest);
//     setCurrent(next);
//     setVisible(true);
//     playToastSound();
//   }, []);

//   const dismiss = useCallback(() => {
//     if (current) markSeen(current.id);
//     setVisible(false);
//     showingRef.current = false;
//     setTimeout(() => {
//       setCurrent(null);
//       setQueue(prev => {
//         if (prev.length > 0) setTimeout(() => showNext(prev), 700);
//         return prev;
//       });
//     }, 300);
//   }, [current, markSeen, showNext]);

//   const handleAccept = useCallback(async () => {
//     if (!current || acceptRef.current) return;
//     acceptRef.current = true;
//     markSeen(current.id);
//     const id = current.id;
//     setVisible(false);
//     showingRef.current = false;
//     setTimeout(() => setCurrent(null), 280);
//     try {
//       const res = await fetch(`/api/token-rush/challenges/${id}/accept`, { method: "POST" });
//       router.push(res.ok ? `/token-rush?challenge=${id}` : "/token-rush");
//     } catch {
//       router.push("/token-rush");
//     }
//     acceptRef.current = false;
//   }, [current, markSeen, router]);

//   // Poll for new challenges
//   useEffect(() => {
//     const poll = async () => {
//       try {
//         const [challRes, statsRes] = await Promise.all([
//           fetch("/api/token-rush/challenges"),
//           isSignedIn ? fetch("/api/game/stats") : Promise.resolve(null),
//         ]);

//         if (statsRes?.ok) {
//           const d = await statsRes.json();
//           setTokenBal(d.wallet?.balance ?? 0);
//         }
//         if (!challRes.ok) return;

//         const data = await challRes.json();
//         const myId = user?.id ?? "";

//         const fresh: LiveChallenge[] = (data.challenges ?? []).filter(
//           (c: { status: string; creatorId: string; id: string }) =>
//             c.status === "open" &&
//             c.creatorId !== myId &&
//             !seenRef.current.has(c.id),
//         );

//         if (fresh.length === 0) return;

//         setQueue(prev => {
//           const knownIds = new Set([...prev.map(c => c.id), ...(current ? [current.id] : [])]);
//           const added    = fresh.filter(c => !knownIds.has(c.id));
//           const merged   = [...prev, ...added];
//           if (!showingRef.current && merged.length > 0) {
//             setTimeout(() => showNext(merged), 120);
//           }
//           return merged;
//         });
//       } catch { /**/ }
//     };

//     poll();
//     const t = setInterval(poll, POLL_MS);
//     return () => clearInterval(t);
//   }, [isSignedIn, user?.id, current, showNext]);

//   const canAccept = isSignedIn && current != null && tokenBal >= current.wagerAmount ? true : false;
//   const meta      = current ? getMeta(current.gameId) : FALLBACK;
//   const queueLen  = queue.length;

//   return (
//     <>
//       {/* Inject spin keyframe once */}
//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

//       {/*
//         Fixed bottom-left.
//         pointer-events: none on the wrapper so the rest of the page
//         is completely unaffected. Individual interactive elements
//         set pointer-events: auto via inline styles / buttons.
//       */}
//       <div
//         aria-live="polite"
//         aria-label="Challenge broadcast"
//         style={{
//           position:      "fixed",
//           bottom:        20,
//           left:          20,
//           zIndex:        500,
//           display:       "flex",
//           flexDirection: "column",
//           alignItems:    "flex-start",
//           gap:           8,
//           pointerEvents: "none",
//         }}>

//         <AnimatePresence>
//           {visible && queueLen > 0 && (
//             <div key="badge" style={{ pointerEvents: "auto" }}>
//               <QueueBadge count={queueLen} accent={meta.accent} />
//             </div>
//           )}
//         </AnimatePresence>

//         <AnimatePresence>
//           {visible && current && (
//             <div key={current.id} style={{ pointerEvents: "auto" }}>
//               <BroadcastToast
//                 challenge={current}
//                 canAccept={canAccept ?? false}
//                 onAccept={handleAccept}
//                 onDismiss={dismiss}
//               />
//             </div>
//           )}
//         </AnimatePresence>
//       </div>
//     </>
//   );
// }