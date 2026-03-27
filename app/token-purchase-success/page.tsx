"use client";

// =============================================================================
// isaacpaha.com — Token Purchase Result Page
// app/token-purchase-success/page.tsx
//
// Handles both outcomes from Stripe:
//   /token-purchase-success?token_success=1&tokens=12000  → success state
//   /token-purchase-success?token_cancelled=1             → cancelled state
// =============================================================================

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter }          from "next/navigation";
import { motion, AnimatePresence }             from "framer-motion";
import Link                                    from "next/link";

// ─── Floating particle ────────────────────────────────────────────────────────

function Particle({ i }: { i: number }) {
  const colors = ["#f59e0b", "#fbbf24", "#6366f1", "#a78bfa", "#10b981", "#34d399"];
  const color  = colors[i % colors.length];
  const size   = 4 + (i % 5) * 2;
  const left   = `${(i * 7.3) % 95}%`;
  const delay  = `${(i * 0.18) % 2}s`;
  const dur    = `${1.4 + (i * 0.11) % 1.2}s`;
  const shape  = i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0%";

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left, top: "-10px",
        width: size, height: size,
        backgroundColor: color,
        borderRadius: shape,
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: 340, opacity: 0, rotate: 540 }}
      transition={{ duration: parseFloat(dur), delay: parseFloat(delay), ease: "easeIn" }}
    />
  );
}

// ─── Animated number counter ──────────────────────────────────────────────────

function Counter({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const steps   = 60;
    const stepMs  = duration / steps;
    const stepVal = target / steps;
    let   step    = 0;
    const t = setInterval(() => {
      step++;
      setVal(Math.min(Math.round(stepVal * step), target));
      if (step >= steps) clearInterval(t);
    }, stepMs);
    return () => clearInterval(t);
  }, [target, duration]);

  return <>{val.toLocaleString()}</>;
}

// ─── Orbit ring ───────────────────────────────────────────────────────────────

function OrbitRing({ radius, duration, delay, color }: {
  radius: number; duration: number; delay: number; color: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full border pointer-events-none"
      style={{
        width:       radius * 2,
        height:      radius * 2,
        borderColor: color,
        top:         "50%",
        left:        "50%",
        marginLeft:  -radius,
        marginTop:   -radius,
      }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: [0, 0.6, 0.3], scale: [0.4, 1, 1] }}
      transition={{ duration: 0.8, delay }}
    >
      {/* Orbiting dot */}
      <motion.div
        className="absolute w-2 h-2 rounded-full"
        style={{ backgroundColor: color, top: -4, left: "50%", marginLeft: -4, transformOrigin: `4px ${radius + 4}px` }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear", delay }}
      />
    </motion.div>
  );
}

// ─── SUCCESS STATE ────────────────────────────────────────────────────────────

function SuccessState({ tokens }: { tokens: number }) {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#060608", fontFamily: "Sora, sans-serif" }}>

      {/* Background mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 60%)" }} />
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 40% 40% at 80% 80%, rgba(99,102,241,0.07) 0%, transparent 60%)" }} />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Confetti burst */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none overflow-visible">
        {Array.from({ length: 24 }).map((_, i) => <Particle key={i} i={i} />)}
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ type: "spring", damping: 22, stiffness: 260, delay: 0.1 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="rounded-sm overflow-hidden"
          style={{ backgroundColor: "#0e0e13", border: "1px solid rgba(245,158,11,0.2)", boxShadow: "0 0 80px rgba(245,158,11,0.08)" }}
        >
          {/* Amber top bar */}
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #f59e0b 40%, #fbbf24 60%, transparent)" }} />

          {/* Coin hero */}
          <div className="pt-10 pb-6 flex flex-col items-center relative">
            {/* Orbit rings */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <OrbitRing radius={52} duration={4}   delay={0.4} color="rgba(245,158,11,0.35)" />
              <OrbitRing radius={68} duration={6.5} delay={0.7} color="rgba(99,102,241,0.25)" />
              <OrbitRing radius={84} duration={9}   delay={1.0} color="rgba(245,158,11,0.12)" />

              {/* Central coin */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 220, delay: 0.3 }}
                className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{
                  backgroundColor: "rgba(245,158,11,0.12)",
                  border:          "2px solid rgba(245,158,11,0.4)",
                  boxShadow:       "0 0 40px rgba(245,158,11,0.2), inset 0 0 20px rgba(245,158,11,0.05)",
                }}
              >
                🪙
              </motion.div>
            </div>

            {/* Token count */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.55 }}
              className="mt-6 text-center"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/70 mb-1">
                Tokens added to your wallet
              </p>
              <p className="text-6xl font-black text-white tabular-nums leading-none">
                <Counter target={tokens} />
              </p>
              <p className="text-amber-400 font-black text-xl mt-1">🪙</p>
            </motion.div>
          </div>

          {/* Details strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="mx-6 mb-6 rounded-sm px-5 py-4 space-y-2"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {[
              { label: "Status",       value: "Payment confirmed",         dot: "#10b981" },
              { label: "Tokens added", value: `${tokens.toLocaleString()} 🪙 instantly`, dot: "#f59e0b" },
              { label: "Expires",      value: "Never",                     dot: "#6366f1" },
            ].map(({ label, value, dot }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
                  <span className="text-[11px] text-white/40">{label}</span>
                </div>
                <span className="text-[11px] font-bold text-white/80">{value}</span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.9 }}
            className="px-6 pb-8 space-y-3"
          >
            <Link href="/tools"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-sm font-black text-sm transition-all"
              style={{ backgroundColor: "#f59e0b", color: "#0a0a0c" }}>
              ⚡ Start Using Your Tokens
            </Link>
            <Link href="/games"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-sm font-bold text-sm transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              🎮 Earn More via Games
            </Link>
          </motion.div>

          {/* Bottom bar */}
          <div className="px-6 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-[10px] text-white/20">isaacpaha.com · Powered by Stripe</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400/70 font-bold">Payment secure</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subtle bottom text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 mt-6 text-[11px] text-white/20 text-center"
      >
        Tokens are available in your wallet immediately. Check your email for a receipt.
      </motion.p>
    </div>
  );
}

// ─── CANCELLED STATE ──────────────────────────────────────────────────────────

function CancelledState() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#060608", fontFamily: "Sora, sans-serif" }}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(239,68,68,0.06) 0%, transparent 60%)" }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid2" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid2)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="rounded-sm overflow-hidden"
          style={{ backgroundColor: "#0e0e13", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="h-0.5 w-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 50%, transparent)" }} />

          <div className="pt-10 pb-6 flex flex-col items-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.15 }}
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              ↩️
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center px-6"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">
                Payment cancelled
              </p>
              <h1 className="text-2xl font-black text-white mb-3 leading-snug">
                No charge was made
              </h1>
              <p className="text-sm text-white/40 leading-relaxed">
                You cancelled before completing the payment. Your wallet balance is unchanged — come back any time to top up.
              </p>
            </motion.div>
          </div>

          {/* Earn instead */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-6 mb-6 rounded-sm px-4 py-4"
            style={{ backgroundColor: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}
          >
            <p className="text-xs font-bold text-amber-400 mb-1">💡 Earn tokens for free</p>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Play any mini-game in the Game Hub to earn 5–50 tokens per round. No purchase needed.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="px-6 pb-8 space-y-3"
          >
            <Link href="/tools"
              className="flex items-center justify-center w-full py-4 rounded-sm font-black text-sm transition-all"
              style={{ backgroundColor: "#f59e0b", color: "#0a0a0c" }}>
              ← Back to Tools
            </Link>
            <Link href="/game"
              className="flex items-center justify-center w-full py-3.5 rounded-sm font-bold text-sm transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              🎮 Earn Tokens Free Instead
            </Link>
          </motion.div>

          <div className="px-6 py-3 flex items-center justify-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-[10px] text-white/20">No payment was processed · isaacpaha.com</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function TokenPurchaseResultPage() {
  const searchParams = useSearchParams();

  const success   = searchParams.get("token_success") === "1";
  const cancelled = searchParams.get("token_cancelled") === "1";
  const tokens    = parseInt(searchParams.get("tokens") ?? "0", 10);

  // Neither param — probably a direct navigation — redirect to tools
  if (!success && !cancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#060608", fontFamily: "Sora, sans-serif" }}>
        <Link href="/tools"
          className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors">
          ← Back to Tools
        </Link>
      </div>
    );
  }

  if (cancelled) return <CancelledState />;
  return <SuccessState tokens={tokens} />;
}