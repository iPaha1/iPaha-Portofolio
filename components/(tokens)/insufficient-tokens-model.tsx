"use client";

// =============================================================================
// isaacpaha.com — Insufficient Tokens Modal
// components/(tokens)/insufficient-tokens-modal.tsx
//
// Props:
//   open         — boolean: show/hide
//   onClose      — () => void
//   required     — number: tokens the tool needs
//   balance      — number: current balance
//   toolName?    — string: e.g. "Chemistry Engine"
//   onPlayGame?  — () => void: open the game overlay
//
// Usage in any tool page:
//   const [tokenModal, setTokenModal] = useState<{
//     required: number; balance: number; toolName: string
//   } | null>(null);
//
//   // After fetch call:
//   if (res.status === 402) {
//     const data = await res.json();
//     setTokenModal({ required: data.required, balance: data.balance, toolName: data.toolName });
//     return;
//   }
//
//   // In JSX:
//   <InsufficientTokensModal
//     open={!!tokenModal}
//     onClose={() => setTokenModal(null)}
//     required={tokenModal?.required ?? 0}
//     balance={tokenModal?.balance ?? 0}
//     toolName={tokenModal?.toolName}
//     onPlayGame={() => { setTokenModal(null); triggerGame(true); }}
//   />
// =============================================================================

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence }             from "framer-motion";
import { TOKEN_PACKAGES }                      from "@/app/api/tokens/checkout/route";

// ─── Icons (inline SVG to avoid import issues) ───────────────────────────────

const CoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <circle cx="12" cy="12" r="10" fill="#f59e0b" opacity="0.2" />
    <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1.5" />
    <text x="12" y="16.5" textAnchor="middle" fontSize="11" fill="#f59e0b" fontWeight="900" fontFamily="Sora, sans-serif">🪙</text>
  </svg>
);

// ─── Package Card ─────────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg:      (typeof TOKEN_PACKAGES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full text-left rounded-sm border-2 transition-all duration-150 overflow-hidden"
      style={{
        borderColor:     selected ? "#f59e0b" : "rgba(255,255,255,0.08)",
        backgroundColor: selected ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
      }}
    >
      {/* Popular / Best Value badge */}
      {pkg.badge && (
        <div
          className="absolute top-0 right-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-sm"
          style={{
            backgroundColor: pkg.popular ? "#f59e0b" : "#6366f1",
            color:           "#0a0a0c",
          }}
        >
          {pkg.badge}
        </div>
      )}

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-black text-white">{pkg.label}</p>
          <p className="text-lg font-black text-amber-400">
            ${(pkg.price / 100).toFixed(0)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xl font-black text-white">
            {pkg.tokens.toLocaleString()} <span className="text-amber-400 text-base">🪙</span>
          </p>
          <p className="text-[10px] text-white/30 font-mono">{pkg.per1k}</p>
        </div>
      </div>

      {/* Selected indicator bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-amber-400"
        animate={{ width: selected ? "100%" : "0%" }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}

// ─── Animated coin counter ────────────────────────────────────────────────────

function CoinCounter({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start   = display;
    const end     = value;
    const diff    = end - start;
    if (diff === 0) return;
    const steps   = 20;
    const stepVal = diff / steps;
    let step      = 0;
    const timer   = setInterval(() => {
      step++;
      setDisplay(Math.round(start + stepVal * step));
      if (step >= steps) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span style={{ color }} className="font-black tabular-nums">
      {display.toLocaleString()}
    </span>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export interface InsufficientTokensModalProps {
  open:        boolean;
  onClose:     () => void;
  required:    number;
  balance:     number;
  toolName?:   string;
  onPlayGame?: () => void;
}

export function InsufficientTokensModal({
  open,
  onClose,
  required,
  balance,
  toolName,
  onPlayGame,
}: InsufficientTokensModalProps) {
  const [tab,             setTab]             = useState<"game" | "buy">("game");
  const [selectedPkg,     setSelectedPkg]     = useState<string>("explorer");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError,   setCheckoutError]   = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  const shortage = required - balance;

  // Reset to game tab on open
  useEffect(() => {
    if (open) { setTab("game"); setCheckoutError(""); }
  }, [open]);

  const handleCheckout = async () => {
    setLoadingCheckout(true);
    setCheckoutError("");
    try {
      const res  = await fetch("/api/tokens/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ packageId: selectedPkg }),
      });
      const data = await res.json();
      if (!res.ok) { setCheckoutError(data.error ?? "Checkout failed"); return; }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Network error — please try again.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const selectedPackage = TOKEN_PACKAGES.find((p) => p.id === selectedPkg)!;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={backdropRef}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === backdropRef.current && onClose()}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md rounded-sm overflow-hidden shadow-2xl"
              style={{
                backgroundColor: "#0e0e12",
                border:          "1px solid rgba(255,255,255,0.08)",
                fontFamily:      "Sora, sans-serif",
              }}
            >
              {/* ── Header ── */}
              <div
                className="relative px-6 pt-8 pb-6"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.15) 0%, transparent 70%)",
                }}
              >
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-sm text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                >
                  ✕
                </button>

                {/* Coin stack animation */}
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    {/* Stacked coin shadows */}
                    {[3, 2, 1].map((n) => (
                      <motion.div
                        key={n}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: n * 0.08 }}
                        className="absolute w-16 h-16 rounded-full"
                        style={{
                          top:             `${n * 3}px`,
                          left:            0,
                          backgroundColor: `rgba(245,158,11,${0.06 * n})`,
                          border:          `1px solid rgba(245,158,11,${0.15 * n})`,
                        }}
                      />
                    ))}
                    {/* Main coin */}
                    <motion.div
                      initial={{ scale: 0.5, rotate: -20 }}
                      animate={{ scale: 1,   rotate: 0   }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="relative w-16 h-16 flex items-center justify-center"
                    >
                      <span className="text-4xl">🪙</span>
                    </motion.div>
                    {/* Pulse ring */}
                    <motion.div
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border border-amber-400/30"
                    />
                  </div>
                </div>

                <h2 className="text-xl font-black text-white text-center mb-2">
                  Not enough tokens
                </h2>

                {/* Balance status */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">You have</p>
                    <CoinCounter value={balance} color="#f59e0b" />
                    <span className="text-amber-400 text-lg ml-1">🪙</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">
                      {toolName ? `${toolName} needs` : "Tool needs"}
                    </p>
                    <CoinCounter value={required} color="rgb(248,113,113)" />
                    <span className="text-red-400 text-lg ml-1">🪙</span>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center text-sm text-white/50 leading-snug"
                >
                  You need{" "}
                  <span className="text-amber-400 font-bold">
                    {shortage.toLocaleString()} more tokens
                  </span>
                  . Earn them by playing a game, or buy a top-up.
                </motion.div>
              </div>

              {/* ── Tabs ── */}
              <div className="flex border-b border-white/8 mx-6">
                {([
                  { id: "game", label: "🎮 Earn Free Tokens",  sub: "Play a game"    },
                  { id: "buy",  label: "⚡ Buy Tokens",        sub: "Instant top-up" },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="flex-1 py-3 text-center transition-colors relative"
                  >
                    <p className={`text-xs font-bold transition-colors ${tab === t.id ? "text-white" : "text-white/40 hover:text-white/60"}`}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">{t.sub}</p>
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      animate={{ backgroundColor: tab === t.id ? "#f59e0b" : "transparent" }}
                    />
                  </button>
                ))}
              </div>

              {/* ── Tab content ── */}
              <div className="px-6 py-5">
                <AnimatePresence mode="wait">

                  {/* ── EARN FREE TAB ── */}
                  {tab === "game" && (
                    <motion.div
                      key="game"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0   }}
                      exit={{    opacity: 0, x:  12 }}
                      className="space-y-4"
                    >
                      <div
                        className="rounded-sm p-4"
                        style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
                      >
                        <p className="text-sm font-bold text-amber-300 mb-1">How it works</p>
                        <p className="text-xs text-white/50 leading-relaxed">
                          Play any mini-game to earn free tokens. Each win awards between 5–12 tokens. Chain wins for combos. Build a streak for daily bonuses.
                        </p>
                      </div>

                      {/* Game options */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { emoji: "🎯", name: "Click Hunt",   reward: "6–10 🪙", time: "15s",  desc: "Click targets fast" },
                          { emoji: "🌧️", name: "Token Rain",   reward: "5–8 🪙",  time: "12s",  desc: "Catch falling coins" },
                          { emoji: "🃏", name: "Mystery Box",  reward: "5–50 🪙", time: "8s",   desc: "Lucky draw" },
                          { emoji: "⚡", name: "Reaction",    reward: "6–9 🪙",  time: "30s",  desc: "Test your reflexes" },
                        ].map((g) => (
                          <div
                            key={g.name}
                            className="rounded-sm p-3 transition-colors"
                            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                          >
                            <div className="text-2xl mb-1">{g.emoji}</div>
                            <p className="text-xs font-bold text-white">{g.name}</p>
                            <p className="text-[10px] text-white/40">{g.desc}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] font-bold text-amber-400">{g.reward}</span>
                              <span className="text-[9px] text-white/25">·</span>
                              <span className="text-[10px] text-white/30">{g.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <motion.button
                        onClick={() => { onPlayGame?.(); }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-sm font-black text-sm transition-colors"
                        style={{ backgroundColor: "#f59e0b", color: "#0a0a0c" }}
                      >
                        Open Game Hub → Earn Tokens Free
                      </motion.button>
                      <p className="text-center text-[10px] text-white/25">
                        New games every few minutes — no purchase needed
                      </p>
                    </motion.div>
                  )}

                  {/* ── BUY TAB ── */}
                  {tab === "buy" && (
                    <motion.div
                      key="buy"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0  }}
                      exit={{    opacity: 0, x: -12 }}
                      className="space-y-4"
                    >
                      {/* Packages */}
                      <div className="space-y-2">
                        {TOKEN_PACKAGES.map((pkg) => (
                          <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            selected={selectedPkg === pkg.id}
                            onSelect={() => setSelectedPkg(pkg.id)}
                          />
                        ))}
                      </div>

                      {/* Summary */}
                      <div
                        className="flex items-center justify-between px-4 py-3 rounded-sm"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <div>
                          <p className="text-xs text-white/40">You're buying</p>
                          <p className="text-sm font-black text-amber-400">
                            {selectedPackage.tokens.toLocaleString()} tokens
                          </p>
                          <p className="text-[10px] text-white/25 mt-0.5">
                            New balance: {(balance + selectedPackage.tokens).toLocaleString()} 🪙
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-white">
                            ${(selectedPackage.price / 100).toFixed(0)}
                          </p>
                          <p className="text-[10px] text-white/30">{selectedPackage.per1k}</p>
                        </div>
                      </div>

                      {checkoutError && (
                        <p className="text-xs text-red-400 text-center">{checkoutError}</p>
                      )}

                      <motion.button
                        onClick={handleCheckout}
                        disabled={loadingCheckout}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-sm font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                        style={{ backgroundColor: "#f59e0b", color: "#0a0a0c" }}
                      >
                        {loadingCheckout ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                            </svg>
                            Redirecting to Stripe…
                          </>
                        ) : (
                          <>
                            ⚡ Buy {selectedPackage.tokens.toLocaleString()} Tokens — ${(selectedPackage.price / 100).toFixed(0)}
                          </>
                        )}
                      </motion.button>

                      {/* Trust signals */}
                      <div className="flex items-center justify-center gap-4">
                        {[
                          { icon: "🔒", label: "Stripe secure" },
                          { icon: "⚡", label: "Instant credit" },
                          { icon: "♾️", label: "Never expire"  },
                        ].map((s) => (
                          <div key={s.label} className="flex items-center gap-1.5">
                            <span className="text-sm">{s.icon}</span>
                            <span className="text-[10px] text-white/30 font-semibold">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Footer ── */}
              <div
                className="px-6 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-[10px] text-white/20">
                  Tokens power AI generation on isaacpaha.com
                </p>
                <button
                  onClick={onClose}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}