// =============================================================================
// isaacpaha.com — Hero Section (with Orbital Orrery)
// components/_home/hero/hero-section.tsx
//
// Change: The main content area becomes a two-column layout on lg+.
// Left column: all existing copy, eyebrow, headline, bio, CTAs.
// Right column: the three-ring orbital orrery from loading.tsx, scaled up,
//               living and breathing alongside the headline.
// The orrery column collapses and hides on mobile (< lg) so nothing breaks.
// Signal cards still span full width at the bottom.
// =============================================================================

"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, ChevronDown,
  Zap, Lightbulb, Globe,
} from "lucide-react";
import { PERSONAL, COMPANIES, STATS } from "@/lib/data/site-data";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROTATING_WORDS = [
  "for Africa.",
  "for builders.",
  "that matter.",
  "at scale.",
  "with intention.",
];

const SIGNALS = [
  {
    icon:    Zap,
    label:   "Building",
    headline: "3 companies. 10+ products. 2 countries.",
    detail:  "From London to Accra — software that solves real problems for real people.",
    accent:  "#f59e0b",
    href:    "/apps",
    cta:     "View the apps",
  },
  {
    icon:    Lightbulb,
    label:   "Thinking",
    headline: "AI, Africa, and what comes next.",
    detail:  "A living collection of ideas that refuse to leave me alone. Some become products. All become questions.",
    accent:  "#6366f1",
    href:    "/ideas",
    cta:     "Explore ideas",
  },
  {
    icon:    Globe,
    label:   "Writing",
    headline: "Honest essays on technology and society.",
    detail:  "Direct, specific, no filler. Thinking out loud on the things that matter most.",
    accent:  "#10b981",
    href:    "/blog",
    cta:     "Read the blog",
  },
];

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref   = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fired.current) {
        fired.current = true;
        let start = 0;
        const tick = (ts: number) => {
          if (!start) start = ts;
          const p     = Math.min((ts - start) / 1500, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.floor(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref} className="tabular-nums">{val}{suffix}</span>;
}

// ─── Rotating word ────────────────────────────────────────────────────────────
function RotatingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ROTATING_WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block overflow-hidden" style={{ minWidth: "12ch" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0,   filter: "blur(0px)" }}
          exit={{   opacity: 0, y: -20,  filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
          style={{
            background:           "linear-gradient(135deg, #f59e0b 0%, #fcd34d 60%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            backgroundClip:       "text",
          }}
        >
          {ROTATING_WORDS[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ─── Signal card ──────────────────────────────────────────────────────────────
function SignalCard({
  icon: Icon, label, headline, detail, accent, href, cta, index,
}: typeof SIGNALS[0] & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 + index * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="group relative border border-white/[0.07] rounded-xs bg-white/[0.025] hover:bg-white/[0.045] hover:border-white/[0.14] transition-all duration-300 overflow-hidden p-6 flex flex-col gap-4"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div
        className="absolute top-3 right-3 w-4 h-4 border-t border-r opacity-20 group-hover:opacity-60 transition-opacity duration-300"
        style={{ borderColor: accent }}
      />
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xs flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <span
          className="text-[10px] font-black tracking-[0.28em] uppercase"
          style={{ color: `${accent}90` }}
        >
          {label}
        </span>
      </div>
      <p className="text-sm font-black text-white/80 leading-snug group-hover:text-white transition-colors duration-200">
        {headline}
      </p>
      <p className="text-[13px] text-white/28 leading-relaxed flex-1 group-hover:text-white/40 transition-colors duration-200">
        {detail}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold transition-all duration-200 w-fit"
        style={{ color: `${accent}70` }}
      >
        <span className="group-hover:underline underline-offset-2">{cta}</span>
        <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
      </Link>
    </motion.div>
  );
}

// ─── Orbital Orrery ───────────────────────────────────────────────────────────
// Direct port of the loading.tsx orrery, scaled up for hero placement.
// Uses pure CSS animations via an injected <style> block — no runtime JS,
// no Framer Motion dependency, sub-pixel smooth at any framerate.
function OrbitalOrrery() {
  return (
    <>
      <style>{`
        @keyframes _orbitEq {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes _orbitTilt1 {
          from { transform: rotateX(55deg) rotate(0deg); }
          to   { transform: rotateX(55deg) rotate(360deg); }
        }
        @keyframes _orbitTilt2 {
          from { transform: rotateY(60deg) rotateX(-20deg) rotate(0deg); }
          to   { transform: rotateY(60deg) rotateX(-20deg) rotate(360deg); }
        }
        @keyframes _corePulse {
          0%,100% { transform: scale(1);    box-shadow: 0 0 28px rgba(245,158,11,.65), 0 0 60px rgba(245,158,11,.28), inset 0 0 12px rgba(255,255,255,.15); }
          50%     { transform: scale(1.10); box-shadow: 0 0 44px rgba(245,158,11,.85), 0 0 88px rgba(245,158,11,.38), inset 0 0 12px rgba(255,255,255,.2); }
        }
        @keyframes _haloA {
          0%,100% { opacity: .22; transform: scale(1); }
          50%     { opacity: .45; transform: scale(1.07); }
        }
        @keyframes _haloB {
          0%,100% { opacity: .12; transform: scale(1); }
          50%     { opacity: .28; transform: scale(1.09); }
        }
        @keyframes _coronaBreathe {
          0%,100% { opacity: .55; transform: scale(1); }
          50%     { opacity: .9;  transform: scale(1.05); }
        }
        @keyframes _orreryFloat {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-12px); }
        }
      `}</style>

      {/* Floating wrapper — gentle vertical drift */}
      <div
        style={{
          position: "relative",
          display:  "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          animation: "_orreryFloat 6s ease-in-out infinite",
        }}
      >
        {/* Outer corona glow */}
        <div
          style={{
            position: "absolute",
            width: 500, height: 500,
            background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 62%)",
            filter: "blur(48px)",
            animation: "_coronaBreathe 4s ease-in-out infinite",
          }}
        />

        {/* ── Ring system ── */}
        <div
          style={{
            position: "relative",
            width:  320,
            height: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Ring 1 — equatorial (amber) */}
          <div
            style={{
              position:     "absolute",
              width:  300,
              height: 300,
              border: "1.5px solid rgba(245,158,11,0.22)",
              borderRadius: "50%",
              animation:    "_orbitEq 3.4s linear infinite",
            }}
          >
            {/* Traveller dot */}
            <div
              style={{
                position: "absolute",
                width: 11, height: 11,
                background: "#f59e0b",
                borderRadius: "50%",
                top: -5.5, left: "50%", marginLeft: -5.5,
                boxShadow: "0 0 18px #f59e0b, 0 0 36px rgba(245,158,11,0.45)",
              }}
            />
            {/* Trailing comet tail */}
            <div
              style={{
                position: "absolute",
                width: 32, height: 4,
                borderRadius: "50%",
                background: "linear-gradient(90deg, rgba(245,158,11,0.5), transparent)",
                top: -2, left: "50%", marginLeft: -38,
                filter: "blur(2px)",
              }}
            />
          </div>

          {/* Ring 2 — tilted 55° (indigo) */}
          <div
            style={{
              position:     "absolute",
              width:  216,
              height: 216,
              border: "1.5px solid rgba(99,102,241,0.25)",
              borderRadius: "50%",
              transform:    "rotateX(55deg)",
              animation:    "_orbitTilt1 2.2s linear infinite reverse",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 8, height: 8,
                background: "#818cf8",
                borderRadius: "50%",
                top: -4, left: "50%", marginLeft: -4,
                boxShadow: "0 0 12px #818cf8, 0 0 24px rgba(129,140,248,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 24, height: 3,
                borderRadius: "50%",
                background: "linear-gradient(90deg, rgba(129,140,248,0.45), transparent)",
                top: -1.5, left: "50%", marginLeft: -28,
                filter: "blur(1.5px)",
              }}
            />
          </div>

          {/* Ring 3 — tilted -40° other axis (emerald) */}
          <div
            style={{
              position:     "absolute",
              width:  152,
              height: 152,
              border: "1.5px solid rgba(16,185,129,0.22)",
              borderRadius: "50%",
              transform:    "rotateY(60deg) rotateX(-20deg)",
              animation:    "_orbitTilt2 1.6s linear infinite",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 7, height: 7,
                background: "#10b981",
                borderRadius: "50%",
                top: -3.5, left: "50%", marginLeft: -3.5,
                boxShadow: "0 0 10px #10b981, 0 0 20px rgba(16,185,129,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 20, height: 3,
                borderRadius: "50%",
                background: "linear-gradient(90deg, rgba(16,185,129,0.4), transparent)",
                top: -1.5, left: "50%", marginLeft: -24,
                filter: "blur(1.5px)",
              }}
            />
          </div>

          {/* ── Core amber sphere ── */}
          <div
            style={{
              position: "absolute",
              width: 40, height: 40,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #fde68a, #f59e0b, #d97706)",
              animation: "_corePulse 2.6s ease-in-out infinite",
              zIndex: 2,
            }}
          />

          {/* Halo rings around core */}
          <div
            style={{
              position: "absolute",
              width: 62, height: 62,
              border: "1px solid rgba(245,158,11,0.28)",
              borderRadius: "50%",
              animation: "_haloA 2.6s ease-in-out infinite",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 86, height: 86,
              border: "0.5px solid rgba(245,158,11,0.12)",
              borderRadius: "50%",
              animation: "_haloB 2.6s ease-in-out infinite 0.35s",
              zIndex: 1,
            }}
          />
        </div>

        {/* ── Label beneath ── */}
        <div
          style={{
            position: "absolute",
            bottom: -8,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#f59e0b",
              boxShadow: "0 0 6px #f59e0b",
              animation: "_haloA 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            Active · London & Accra
          </span>
        </div>
      </div>
    </>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
export const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-[#0a0a0c] text-white overflow-hidden flex flex-col">

      {/* ── Ambient layers (unchanged) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <motion.div
        className="absolute -top-32 right-0 w-[900px] h-[900px] pointer-events-none"
        style={{
          background: "radial-gradient(circle at 70% 30%, rgba(245,158,11,0.09) 0%, rgba(245,158,11,0.02) 45%, transparent 70%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
      />
      <div className="absolute bottom-0 -left-20 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.04] blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 right-[15%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[90px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_50%,_transparent_30%,_rgba(10,10,12,0.7)_100%)] pointer-events-none" />

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col max-w-[1400px] mx-auto w-full px-6 sm:px-10 lg:px-16 pt-28 lg:pt-32 pb-8">

        {/* ══════════════════════════════════════════════════════
            TWO-COLUMN LAYOUT: left = copy, right = orrery
            On mobile (< lg): orrery column hidden entirely.
            The left column is 60% / right is 40%.
        ══════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-0 lg:-ml-16 flex-1 min-h-0">

          {/* ── LEFT column — all the copy ── */}
          <div className="flex flex-col flex-1 lg:max-w-[55%] lg:pr-8">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 mb-10"
            >
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xs px-4 py-2">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                />
                <span className="text-[10px] font-bold tracking-[0.28em] uppercase text-white/35">
                  Active · London &amp; Accra
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/18 font-medium">
                <span>🇬🇧</span>
                <span className="text-white/10 mx-0.5">·</span>
                <span>🇬🇭</span>
              </div>
            </motion.div>

            {/* Big headline */}
            <div className="mb-10">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="leading-[0.9] tracking-tight font-black"
                style={{ fontSize: "clamp(44px, 7vw, 112px)" }}
              >
                <span className="text-white">Building technology</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="leading-[0.9] tracking-tight font-black"
                style={{ fontSize: "clamp(44px, 7vw, 112px)" }}
              >
                <RotatingWord />
              </motion.div>
            </div>

            {/* Role + bio */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10 mb-12 max-w-2xl"
            >
              <div className="flex-shrink-0">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-amber-500/50 mb-2">
                  {PERSONAL.title}
                </p>
                <div className="w-10 h-[2px] bg-amber-500/40" />
              </div>
              <p className="text-[15px] text-white/30 leading-relaxed border-l border-white/[0.06] pl-6 sm:pl-8">
                {PERSONAL.bio}
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.66, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-3 mb-8 lg:mb-0"
            >
              <Link href="/games">
                <motion.span
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-[#0a0a0c] font-black text-sm px-7 py-3.5 rounded-xs transition-all duration-200 shadow-[0_0_32px_rgba(245,158,11,0.28)] hover:shadow-[0_0_52px_rgba(245,158,11,0.5)] cursor-pointer"
                >
                  Love Games?
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </motion.span>
              </Link>
              <Link href="/tools">
                <motion.span
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 border border-white/[0.1] hover:border-amber-400/40 bg-white/[0.03] hover:bg-amber-500/[0.05] text-white/50 hover:text-white/80 font-semibold text-sm px-7 py-3.5 rounded-xs transition-all duration-200 cursor-pointer"
                >
                  Tools that get things done
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* ── RIGHT column — Orbital orrery ── */}
          {/* Hidden on mobile (< lg). On desktop takes 40% width. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex items-center justify-center flex-shrink-0"
            style={{
              width: "40%",
              // Enough vertical space to breathe within the col
              minHeight: 420,
              // Slight upward offset so orrery visually centres with headline
              marginTop: "-40px",
              marginLeft: "-60px",  // ← ADD THIS - pulls it left
            }}
          >
            <OrbitalOrrery />
          </motion.div>
        </div>

        {/* ── Signal cards — full width, below both columns ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-16 lg:mt-12">
          {SIGNALS.map((s, i) => (
            <SignalCard key={s.label} {...s} index={i} />
          ))}
        </div>
      </div>

      {/* ── Stats bar (unchanged) ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 border-t border-white/[0.06] bg-white/[0.01]"
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.05]">
            {STATS.map(({ value, suffix, label }) => (
              <div key={label} className="flex flex-col items-center py-5 px-4 group">
                <span className="text-2xl md:text-3xl font-black text-white mb-0.5 leading-none group-hover:text-amber-400 transition-colors duration-300">
                  <Counter target={Number(value)} suffix={suffix} />
                </span>
                <span className="text-[10px] text-white/22 font-semibold uppercase tracking-widest text-center group-hover:text-white/40 transition-colors duration-300">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Company ticker (unchanged) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="relative z-10 border-t border-white/[0.04] bg-white/[0.012] overflow-hidden py-2.5"
      >
        <motion.div
          className="flex items-center gap-8 whitespace-nowrap w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          {[...COMPANIES, ...COMPANIES, ...COMPANIES, ...COMPANIES].map((co, i) => (
            <span key={i} className="flex items-center gap-3 flex-shrink-0">
              <a
                href={co.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-semibold text-white/15 hover:text-white/45 transition-colors duration-200"
              >
                <span className="text-sm">{co.flag}</span>
                <span className="tracking-wide">{co.name}</span>
                <span className="text-white/8 font-normal">{co.website}</span>
              </a>
              <span className="text-white/[0.06] text-base">·</span>
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll cue ── */}
      <motion.div
        className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-20 hidden lg:flex flex-col items-center gap-2"
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      >
        <ChevronDown className="w-4 h-4 text-white/15" />
      </motion.div>
    </section>
  );
};






// "use client";

// // =============================================================================
// // isaacpaha.com — Hero Section (Premium Redesign · No photo/name)
// // components/home/hero/hero-section.tsx
// //
// // Concept: "The Work Speaks First"
// // A dark, editorial full-viewport opener that leads with what matters —
// // ideas, companies, products — not identity. The name is everywhere else.
// // Here we open with atmosphere, momentum, and a single arresting question.
// //
// // Architecture:
// //   • Full-viewport dark canvas (#0a0a0c) with layered ambient depth
// //   • Enormous kinetic headline built from two contrasting lines
// //   • A live "marquee" of company/product signals running horizontally
// //   • Three "signal cards" — one each for building / thinking / exploring
// //   • Stats bar at the bottom with animated counters
// //   • Infinite scroll cue
// // =============================================================================

// import React, { useEffect, useState, useRef } from "react";
// import Link from "next/link";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   ArrowRight, ArrowUpRight, ChevronDown,
//   Zap, Lightbulb, Globe,
// } from "lucide-react";
// import { PERSONAL, COMPANIES, STATS } from "@/lib/data/site-data";

// // ─────────────────────────────────────────────────────────────────────────────
// // CONSTANTS
// // ─────────────────────────────────────────────────────────────────────────────

// // Rotating phrases — what Isaac builds / thinks about / explores
// const ROTATING_WORDS = [
//   "for Africa.",
//   "for builders.",
//   "that matter.",
//   "at scale.",
//   "with intention.",
// ];

// // Signal cards — three dominant themes
// const SIGNALS = [
//   {
//     icon:     Zap,
//     label:    "Building",
//     headline: "3 companies. 7 products. 2 countries.",
//     detail:   "From London to Accra — software that solves real problems for real people.",
//     accent:   "#f59e0b",
//     href:     "/apps",
//     cta:      "View the apps",
//   },
//   {
//     icon:     Lightbulb,
//     label:    "Thinking",
//     headline: "AI, Africa, and what comes next.",
//     detail:   "A living collection of ideas that refuse to leave me alone. Some become products. All become questions.",
//     accent:   "#6366f1",
//     href:     "/ideas",
//     cta:      "Explore ideas",
//   },
//   {
//     icon:     Globe,
//     label:    "Writing",
//     headline: "Honest essays on technology and society.",
//     detail:   "Direct, specific, no filler. Thinking out loud on the things that matter most.",
//     accent:   "#10b981",
//     href:     "/blog",
//     cta:      "Read the blog",
//   },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // SUB-COMPONENTS
// // ─────────────────────────────────────────────────────────────────────────────

// // Animated counter (eased cubic-out)
// function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
//   const [val, setVal] = useState(0);
//   const ref    = useRef<HTMLSpanElement>(null);
//   const fired  = useRef(false);

//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     const obs = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting && !fired.current) {
//           fired.current = true;
//           let start = 0;
//           const tick = (ts: number) => {
//             if (!start) start = ts;
//             const p     = Math.min((ts - start) / 1500, 1);
//             const eased = 1 - Math.pow(1 - p, 3);
//             setVal(Math.floor(eased * target));
//             if (p < 1) requestAnimationFrame(tick);
//           };
//           requestAnimationFrame(tick);
//         }
//       },
//       { threshold: 0.6 }
//     );
//     obs.observe(el);
//     return () => obs.disconnect();
//   }, [target]);

//   return <span ref={ref} className="tabular-nums">{val}{suffix}</span>;
// }

// // Rotating word cycle — crossfades between phrases
// function RotatingWord() {
//   const [idx, setIdx] = useState(0);

//   useEffect(() => {
//     const t = setInterval(() => setIdx((i) => (i + 1) % ROTATING_WORDS.length), 2800);
//     return () => clearInterval(t);
//   }, []);

//   return (
//     <span className="relative inline-block overflow-hidden" style={{ minWidth: "12ch" }}>
//       <AnimatePresence mode="wait">
//         <motion.span
//           key={idx}
//           initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
//           animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
//           exit={{    opacity: 0, y: -20, filter: "blur(4px)" }}
//           transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
//           className="inline-block"
//           style={{
//             background:       "linear-gradient(135deg, #f59e0b 0%, #fcd34d 60%, #fbbf24 100%)",
//             WebkitBackgroundClip: "text",
//             WebkitTextFillColor: "transparent",
//             backgroundClip:   "text",
//           }}
//         >
//           {ROTATING_WORDS[idx]}
//         </motion.span>
//       </AnimatePresence>
//     </span>
//   );
// }

// // Signal card
// function SignalCard({
//   icon: Icon, label, headline, detail, accent, href, cta, index,
// }: typeof SIGNALS[0] & { index: number }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 32 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay: 0.9 + index * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
//       className="group relative border border-white/[0.07] rounded-sm bg-white/[0.025] hover:bg-white/[0.045] hover:border-white/[0.14] transition-all duration-400 overflow-hidden p-6 flex flex-col gap-4"
//     >
//       {/* Top accent bar */}
//       <div
//         className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
//         style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
//       />

//       {/* Corner mark */}
//       <div
//         className="absolute top-3 right-3 w-4 h-4 border-t border-r opacity-20 group-hover:opacity-60 transition-opacity duration-300"
//         style={{ borderColor: accent }}
//       />

//       {/* Icon + label */}
//       <div className="flex items-center gap-3">
//         <div
//           className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
//           style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}30` }}
//         >
//           <Icon className="w-4 h-4" style={{ color: accent }} />
//         </div>
//         <span
//           className="text-[10px] font-black tracking-[0.28em] uppercase"
//           style={{ color: `${accent}90` }}
//         >
//           {label}
//         </span>
//       </div>

//       {/* Headline */}
//       <p className="text-sm font-black text-white/80 leading-snug group-hover:text-white transition-colors duration-200">
//         {headline}
//       </p>

//       {/* Detail */}
//       <p className="text-[13px] text-white/28 leading-relaxed flex-1 group-hover:text-white/40 transition-colors duration-200">
//         {detail}
//       </p>

//       {/* CTA */}
//       <Link
//         href={href}
//         className="inline-flex items-center gap-1.5 text-[11px] font-bold transition-all duration-200 w-fit"
//         style={{ color: `${accent}70` }}
//       >
//         <span className="group-hover:underline underline-offset-2">{cta}</span>
//         <ArrowUpRight className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
//       </Link>
//     </motion.div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // HERO SECTION
// // ─────────────────────────────────────────────────────────────────────────────

// export const HeroSection = () => {
//   return (
//     <section className="relative min-h-screen bg-[#0a0a0c] text-white overflow-hidden flex flex-col">

//       {/* ═══════════════════════════════════════════════════════════════════
//           AMBIENT LAYERS
//       ═══════════════════════════════════════════════════════════════════ */}

//       {/* Grid */}
//       <div
//         className="absolute inset-0 pointer-events-none"
//         style={{
//           backgroundImage:
//             "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)," +
//             "linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
//           backgroundSize: "64px 64px",
//         }}
//       />

//       {/* Animated amber orb — upper right */}
//       <motion.div
//         className="absolute -top-32 right-0 w-[900px] h-[900px] pointer-events-none"
//         style={{
//           background: "radial-gradient(circle at 70% 30%, rgba(245,158,11,0.09) 0%, rgba(245,158,11,0.02) 45%, transparent 70%)",
//         }}
//         animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
//         transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
//       />

//       {/* Indigo counter-orb — lower left */}
//       <div className="absolute bottom-0 -left-20 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.04] blur-[110px] pointer-events-none" />

//       {/* Emerald whisper — center-right */}
//       <div className="absolute top-1/2 right-[15%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[90px] pointer-events-none" />

//       {/* Noise grain */}
//       <div
//         className="absolute inset-0 pointer-events-none opacity-[0.028]"
//         style={{
//           backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
//         }}
//       />

//       {/* Top amber hairline */}
//       <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent z-20" />

//       {/* Radial vignette */}
//       <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_50%,_transparent_30%,_rgba(10,10,12,0.7)_100%)] pointer-events-none" />

//       {/* ═══════════════════════════════════════════════════════════════════
//           MAIN CONTENT
//       ═══════════════════════════════════════════════════════════════════ */}

//       <div className="relative z-10 flex-1 flex flex-col max-w-[1400px] mx-auto w-full px-6 sm:px-10 lg:px-16 pt-28 lg:pt-32 pb-8">

//         {/* ── Eyebrow ───────────────────────────────────────────────────── */}
//         <motion.div
//           initial={{ opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
//           className="flex items-center gap-3 mb-10"
//         >
//           <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2">
//             <motion.span
//               className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
//               animate={{ opacity: [1, 0.3, 1] }}
//               transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
//             />
//             <span className="text-[10px] font-bold tracking-[0.28em] uppercase text-white/35">
//               Active · London &amp; Accra
//             </span>
//           </div>
//           <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/18 font-medium">
//             <span>🇬🇧</span>
//             <span className="text-white/10 mx-0.5">·</span>
//             <span>🇬🇭</span>
//           </div>
//         </motion.div>

//         {/* ── THE BIG HEADLINE ──────────────────────────────────────────── */}
//         <div className="mb-10 max-w-5xl">

//           {/* Line 1 — plain white, enormous */}
//           <motion.div
//             initial={{ opacity: 0, x: -24 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
//             className="leading-[0.9] tracking-tight font-black"
//             style={{ fontSize: "clamp(52px, 8.5vw, 128px)" }}
//           >
//             <span className="text-white">Building technology</span>
//           </motion.div>

//           {/* Line 2 — rotating amber word */}
//           <motion.div
//             initial={{ opacity: 0, x: -24 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.7, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
//             className="leading-[0.9] tracking-tight font-black"
//             style={{ fontSize: "clamp(52px, 8.5vw, 128px)" }}
//           >
//             <RotatingWord />
//           </motion.div>
//         </div>

//         {/* ── Role line + Bio ───────────────────────────────────────────── */}
//         <motion.div
//           initial={{ opacity: 0, y: 14 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.55, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
//           className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10 mb-12 max-w-3xl"
//         >
//           {/* Eyebrow role label */}
//           <div className="flex-shrink-0">
//             <p className="text-[10px] font-black tracking-[0.3em] uppercase text-amber-500/50 mb-2">
//               {PERSONAL.title}
//             </p>
//             {/* Divider line that echoes the amber hairline */}
//             <div className="w-10 h-[2px] bg-amber-500/40" />
//           </div>

//           {/* Bio */}
//           <p className="text-[15px] text-white/30 leading-relaxed border-l border-white/[0.06] pl-6 sm:pl-8">
//             {PERSONAL.bio}
//           </p>
//         </motion.div>

//         {/* ── CTA buttons ───────────────────────────────────────────────── */}
//         <motion.div
//           initial={{ opacity: 0, y: 12 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.66, ease: [0.22, 1, 0.36, 1] }}
//           className="flex flex-wrap gap-3 mb-16"
//         >
//           <Link href="/games">
//             <motion.span
//               whileHover={{ scale: 1.02, y: -1 }}
//               whileTap={{ scale: 0.97 }}
//               className="group inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-[#0a0a0c] font-black text-sm px-7 py-3.5 rounded-xs transition-all duration-200 shadow-[0_0_32px_rgba(245,158,11,0.28)] hover:shadow-[0_0_52px_rgba(245,158,11,0.5)] cursor-pointer"
//             >
//               Love games? Play here
//               <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
//             </motion.span>
//           </Link>
//           <Link href="/tools">
//             <motion.span
//               whileHover={{ scale: 1.02, y: -1 }}
//               whileTap={{ scale: 0.97 }}
//               className="inline-flex items-center gap-2 border border-white/[0.1] hover:border-amber-400/40 bg-white/[0.03] hover:bg-amber-500/[0.05] text-white/50 hover:text-white/80 font-semibold text-sm px-7 py-3.5 rounded-xs transition-all duration-200 cursor-pointer"
//             >
//               Tools that gets things done
//               <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
//             </motion.span>
//           </Link>
//         </motion.div>

//         {/* ── THREE SIGNAL CARDS ────────────────────────────────────────── */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-auto">
//           {SIGNALS.map((s, i) => (
//             <SignalCard key={s.label} {...s} index={i} />
//           ))}
//         </div>
//       </div>

//       {/* ═══════════════════════════════════════════════════════════════════
//           STATS BAR
//       ═══════════════════════════════════════════════════════════════════ */}
//       <motion.div
//         initial={{ opacity: 0, y: 14 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 1.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
//         className="relative z-10 border-t border-white/[0.06] bg-white/[0.01]"
//       >
//         <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
//           <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.05]">
//             {STATS.map(({ value, suffix, label }) => (
//               <div key={label} className="flex flex-col items-center py-5 px-4 group">
//                 <span className="text-2xl md:text-3xl font-black text-white mb-0.5 leading-none group-hover:text-amber-400 transition-colors duration-300">
//                   <Counter target={Number(value)} suffix={suffix} />
//                 </span>
//                 <span className="text-[10px] text-white/22 font-semibold uppercase tracking-widest text-center group-hover:text-white/40 transition-colors duration-300">
//                   {label}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </motion.div>

//       {/* ═══════════════════════════════════════════════════════════════════
//           COMPANY TICKER
//       ═══════════════════════════════════════════════════════════════════ */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 1.3, duration: 0.5 }}
//         className="relative z-10 border-t border-white/[0.04] bg-white/[0.012] overflow-hidden py-2.5"
//       >
//         <motion.div
//           className="flex items-center gap-8 whitespace-nowrap w-max"
//           animate={{ x: ["0%", "-50%"] }}
//           transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
//         >
//           {[...COMPANIES, ...COMPANIES, ...COMPANIES, ...COMPANIES].map((co, i) => (
//             <span key={i} className="flex items-center gap-3 flex-shrink-0">
//               <a
//                 href={co.href}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center gap-2 text-[10px] font-semibold text-white/15 hover:text-white/45 transition-colors duration-200"
//               >
//                 <span className="text-sm">{co.flag}</span>
//                 <span className="tracking-wide">{co.name}</span>
//                 <span className="text-white/8 font-normal">{co.website}</span>
//               </a>
//               <span className="text-white/[0.06] text-base">·</span>
//             </span>
//           ))}
//         </motion.div>
//       </motion.div>

//       {/* ── Scroll cue ───────────────────────────────────────────────────── */}
//       <motion.div
//         className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-20 hidden lg:flex flex-col items-center gap-2"
//         animate={{ y: [0, 6, 0] }}
//         transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
//       >
//         <ChevronDown className="w-4 h-4 text-white/15" />
//       </motion.div>

//     </section>
//   );
// };



