


"use client";

// =============================================================================
// isaacpaha.com — Hero Section (Premium Redesign · No photo/name)
// components/home/hero/hero-section.tsx
//
// Concept: "The Work Speaks First"
// A dark, editorial full-viewport opener that leads with what matters —
// ideas, companies, products — not identity. The name is everywhere else.
// Here we open with atmosphere, momentum, and a single arresting question.
//
// Architecture:
//   • Full-viewport dark canvas (#0a0a0c) with layered ambient depth
//   • Enormous kinetic headline built from two contrasting lines
//   • A live "marquee" of company/product signals running horizontally
//   • Three "signal cards" — one each for building / thinking / exploring
//   • Stats bar at the bottom with animated counters
//   • Infinite scroll cue
// =============================================================================

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, ChevronDown,
  Zap, Lightbulb, Globe,
} from "lucide-react";
import { PERSONAL, COMPANIES, STATS } from "@/lib/data/site-data";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Rotating phrases — what Isaac builds / thinks about / explores
const ROTATING_WORDS = [
  "for Africa.",
  "for builders.",
  "that matter.",
  "at scale.",
  "with intention.",
];

// Signal cards — three dominant themes
const SIGNALS = [
  {
    icon:     Zap,
    label:    "Building",
    headline: "3 companies. 7 products. 2 countries.",
    detail:   "From London to Accra — software that solves real problems for real people.",
    accent:   "#f59e0b",
    href:     "/apps",
    cta:      "View the apps",
  },
  {
    icon:     Lightbulb,
    label:    "Thinking",
    headline: "AI, Africa, and what comes next.",
    detail:   "A living collection of ideas that refuse to leave me alone. Some become products. All become questions.",
    accent:   "#6366f1",
    href:     "/ideas",
    cta:      "Explore ideas",
  },
  {
    icon:     Globe,
    label:    "Writing",
    headline: "Honest essays on technology and society.",
    detail:   "Direct, specific, no filler. Thinking out loud on the things that matter most.",
    accent:   "#10b981",
    href:     "/blog",
    cta:      "Read the blog",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Animated counter (eased cubic-out)
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref    = useRef<HTMLSpanElement>(null);
  const fired  = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
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
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref} className="tabular-nums">{val}{suffix}</span>;
}

// Rotating word cycle — crossfades between phrases
function RotatingWord() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ROTATING_WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="relative inline-block overflow-hidden" style={{ minWidth: "12ch" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
          exit={{    opacity: 0, y: -20, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
          style={{
            background:       "linear-gradient(135deg, #f59e0b 0%, #fcd34d 60%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip:   "text",
          }}
        >
          {ROTATING_WORDS[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Signal card
function SignalCard({
  icon: Icon, label, headline, detail, accent, href, cta, index,
}: typeof SIGNALS[0] & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 + index * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="group relative border border-white/[0.07] rounded-sm bg-white/[0.025] hover:bg-white/[0.045] hover:border-white/[0.14] transition-all duration-400 overflow-hidden p-6 flex flex-col gap-4"
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      {/* Corner mark */}
      <div
        className="absolute top-3 right-3 w-4 h-4 border-t border-r opacity-20 group-hover:opacity-60 transition-opacity duration-300"
        style={{ borderColor: accent }}
      />

      {/* Icon + label */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
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

      {/* Headline */}
      <p className="text-sm font-black text-white/80 leading-snug group-hover:text-white transition-colors duration-200">
        {headline}
      </p>

      {/* Detail */}
      <p className="text-[13px] text-white/28 leading-relaxed flex-1 group-hover:text-white/40 transition-colors duration-200">
        {detail}
      </p>

      {/* CTA */}
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold transition-all duration-200 w-fit"
        style={{ color: `${accent}70` }}
      >
        <span className="group-hover:underline underline-offset-2">{cta}</span>
        <ArrowUpRight className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-[#0a0a0c] text-white overflow-hidden flex flex-col">

      {/* ═══════════════════════════════════════════════════════════════════
          AMBIENT LAYERS
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Animated amber orb — upper right */}
      <motion.div
        className="absolute -top-32 right-0 w-[900px] h-[900px] pointer-events-none"
        style={{
          background: "radial-gradient(circle at 70% 30%, rgba(245,158,11,0.09) 0%, rgba(245,158,11,0.02) 45%, transparent 70%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
      />

      {/* Indigo counter-orb — lower left */}
      <div className="absolute bottom-0 -left-20 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.04] blur-[110px] pointer-events-none" />

      {/* Emerald whisper — center-right */}
      <div className="absolute top-1/2 right-[15%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[90px] pointer-events-none" />

      {/* Noise grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top amber hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent z-20" />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_50%,_transparent_30%,_rgba(10,10,12,0.7)_100%)] pointer-events-none" />

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}

      <div className="relative z-10 flex-1 flex flex-col max-w-[1400px] mx-auto w-full px-6 sm:px-10 lg:px-16 pt-28 lg:pt-32 pb-8">

        {/* ── Eyebrow ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2">
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

        {/* ── THE BIG HEADLINE ──────────────────────────────────────────── */}
        <div className="mb-10 max-w-5xl">

          {/* Line 1 — plain white, enormous */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="leading-[0.9] tracking-tight font-black"
            style={{ fontSize: "clamp(52px, 8.5vw, 128px)" }}
          >
            <span className="text-white">Building technology</span>
          </motion.div>

          {/* Line 2 — rotating amber word */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="leading-[0.9] tracking-tight font-black"
            style={{ fontSize: "clamp(52px, 8.5vw, 128px)" }}
          >
            <RotatingWord />
          </motion.div>
        </div>

        {/* ── Role line + Bio ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10 mb-12 max-w-3xl"
        >
          {/* Eyebrow role label */}
          <div className="flex-shrink-0">
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-amber-500/50 mb-2">
              {PERSONAL.title}
            </p>
            {/* Divider line that echoes the amber hairline */}
            <div className="w-10 h-[2px] bg-amber-500/40" />
          </div>

          {/* Bio */}
          <p className="text-[15px] text-white/30 leading-relaxed border-l border-white/[0.06] pl-6 sm:pl-8">
            {PERSONAL.bio}
          </p>
        </motion.div>

        {/* ── CTA buttons ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.66, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap gap-3 mb-16"
        >
          <Link href="/apps">
            <motion.span
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-[#0a0a0c] font-black text-sm px-7 py-3.5 rounded-xs transition-all duration-200 shadow-[0_0_32px_rgba(245,158,11,0.28)] hover:shadow-[0_0_52px_rgba(245,158,11,0.5)] cursor-pointer"
            >
              See what I&apos;ve built
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </motion.span>
          </Link>
          <Link href="/about">
            <motion.span
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 border border-white/[0.1] hover:border-amber-400/40 bg-white/[0.03] hover:bg-amber-500/[0.05] text-white/50 hover:text-white/80 font-semibold text-sm px-7 py-3.5 rounded-xs transition-all duration-200 cursor-pointer"
            >
              Who I am
            </motion.span>
          </Link>
        </motion.div>

        {/* ── THREE SIGNAL CARDS ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-auto">
          {SIGNALS.map((s, i) => (
            <SignalCard key={s.label} {...s} index={i} />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          COMPANY TICKER
      ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ── Scroll cue ───────────────────────────────────────────────────── */}
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
// // isaacpaha.com — Hero Section (Premium Redesign)
// // components/home/hero/hero-section.tsx
// // =============================================================================

// import React, { useEffect, useState, useRef } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { motion, useInView, useAnimationControls } from "framer-motion";
// import {
//   ArrowRight, Github, Linkedin, Mail, Twitter,
//   ChevronDown, MapPin,
// } from "lucide-react";
// import { PERSONAL, COMPANIES } from "@/lib/data/site-data";

// // ─── Animated counter ─────────────────────────────────────────────────────────

// function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
//   const [val, setVal] = useState(0);
//   const ref           = useRef<HTMLSpanElement>(null);
//   const inView        = useInView(ref, { once: true });

//   useEffect(() => {
//     if (!inView) return;
//     let start = 0;
//     const tick = (ts: number) => {
//       if (!start) start = ts;
//       const p    = Math.min((ts - start) / 1400, 1);
//       const eased = 1 - Math.pow(1 - p, 3);
//       setVal(Math.floor(eased * target));
//       if (p < 1) requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
//   }, [inView, target]);

//   return (
//     <span ref={ref} className="tabular-nums">
//       {val}{suffix}
//     </span>
//   );
// }

// // ─── Rubber-band letter ───────────────────────────────────────────────────────

// function RubberLetter({
//   children,
//   delay,
//   amber,
//   serif,
// }: {
//   children: React.ReactNode;
//   delay:    number;
//   amber?:   boolean;
//   serif?:   boolean;
// }) {
//   const ctrl = useAnimationControls();

//   const bounce = () =>
//     ctrl.start({
//       transform: [
//         "scale3d(1,1,1)",
//         "scale3d(1.3,0.7,1)",
//         "scale3d(0.88,1.15,1)",
//         "scale3d(1.06,0.94,1)",
//         "scale3d(1,1,1)",
//       ],
//       transition: { duration: 0.65, ease: "easeInOut" },
//     });

//   return (
//     <motion.span
//       animate={ctrl}
//       onMouseOver={bounce}
//       initial={{ opacity: 0, y: 36 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true }}
//       transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
//       className="inline-block cursor-default select-none"
//       style={{
//         color:      amber ? "#f59e0b" : "inherit",
//         fontFamily: serif ? "Georgia, 'Times New Roman', serif" : undefined,
//         fontStyle:  serif ? "italic" : undefined,
//       }}
//     >
//       {children}
//     </motion.span>
//   );
// }

// // ─── Social icon ──────────────────────────────────────────────────────────────

// function SocialIcon({
//   href,
//   icon: Icon,
//   label,
// }: {
//   href:  string;
//   icon:  React.ElementType;
//   label: string;
// }) {
//   return (
//     <motion.a
//       href={href}
//       target={href.startsWith("mailto") ? undefined : "_blank"}
//       rel="noopener noreferrer"
//       aria-label={label}
//       whileHover={{ scale: 1.14, y: -2 }}
//       whileTap={{ scale: 0.93 }}
//       className="w-9 h-9 flex items-center justify-center border border-white/[0.1] hover:border-amber-400/60 text-white/35 hover:text-amber-400 rounded-sm transition-all duration-200"
//     >
//       <Icon className="w-4 h-4" />
//     </motion.a>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // HERO SECTION
// // ─────────────────────────────────────────────────────────────────────────────

// export const HeroSection = () => {
//   const [first, ...rest] = PERSONAL.name.split(" ");
//   const last = rest.join(" "); // "Paha"

//   const STATS = [
//     { value: 3,  suffix: "",  label: "Companies" },
//     { value: 7,  suffix: "+", label: "Products shipped" },
//     { value: 5,  suffix: "+", label: "Years building" },
//     { value: 2,  suffix: "",  label: "Countries" },
//   ];

//   const LINKS = [
//     { href: PERSONAL.social.github,     icon: Github,   label: "GitHub"   },
//     { href: PERSONAL.social.linkedin,   icon: Linkedin, label: "LinkedIn" },
//     { href: PERSONAL.social.twitter,    icon: Twitter,  label: "Twitter"  },
//     { href: `mailto:${PERSONAL.email}`, icon: Mail,     label: "Email"    },
//   ];

//   return (
//     <section className="relative min-h-screen bg-[#0a0a0c] text-white overflow-hidden flex flex-col">

//       {/* ── Ambient layer 1: grid ─────────────────────────────────────────── */}
//       <div
//         className="absolute inset-0 pointer-events-none"
//         style={{
//           backgroundImage:
//             "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
//             "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
//           backgroundSize: "64px 64px",
//         }}
//       />

//       {/* ── Ambient layer 2: radial orbs ──────────────────────────────────── */}
//       {/* Main amber pulse — upper right */}
//       <motion.div
//         className="absolute -top-40 right-1/4 w-[700px] h-[700px] rounded-full pointer-events-none"
//         style={{
//           background: "radial-gradient(circle, rgba(245,158,11,0.11) 0%, transparent 70%)",
//         }}
//         animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.05, 1] }}
//         transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
//       />
//       {/* Cool accent — bottom left */}
//       <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.04] blur-[100px] pointer-events-none" />
//       {/* Portrait warm wash — right side only */}
//       <div className="absolute top-0 right-0 w-[45%] h-full bg-gradient-to-l from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" />

//       {/* ── Ambient layer 3: noise ────────────────────────────────────────── */}
//       <div
//         className="absolute inset-0 pointer-events-none opacity-[0.03]"
//         style={{
//           backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
//         }}
//       />

//       {/* ── Top amber hairline ────────────────────────────────────────────── */}
//       <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent z-20" />

//       {/* ── Radial vignette ───────────────────────────────────────────────── */}
//       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(10,10,12,0.65)_100%)] pointer-events-none" />

//       {/* ════════════════════════════════════════════════════════════════════
//           MAIN CONTENT — flex row on lg, column on mobile
//       ════════════════════════════════════════════════════════════════════ */}
//       <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center max-w-[1380px] mx-auto w-full px-6 sm:px-10 lg:px-16 pt-28 lg:pt-0">

//         {/* ── LEFT column: all text ────────────────────────────────────── */}
//         <div className="flex flex-col justify-center lg:py-24 flex-1 lg:pr-20 order-2 lg:order-1 pb-10 lg:pb-0">

//           {/* Live status eyebrow */}
//           <motion.div
//             initial={{ opacity: 0, y: 18 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
//             className="inline-flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2 mb-10 w-fit"
//           >
//             <motion.span
//               className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"
//               animate={{ opacity: [1, 0.35, 1] }}
//               transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
//             />
//             <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-white/40">
//               London · Ghana · Building
//             </span>
//           </motion.div>

//           {/* ── DISPLAY NAME ─────────────────────────────────────────────── */}
//           <div className="mb-7">
//             <h1 className="font-black leading-[0.88] tracking-tight">
//               {/* "Isaac" — white, enormous */}
//               <div
//                 className="text-white"
//                 style={{ fontSize: "clamp(70px, 10.5vw, 144px)" }}
//               >
//                 {first.split("").map((l, i) => (
//                   <RubberLetter key={i} delay={0.18 + i * 0.048}>
//                     {l}
//                   </RubberLetter>
//                 ))}
//               </div>

//               {/* "Paha." — amber, italic serif, almost same size */}
//               <div
//                 style={{
//                   fontSize:   "clamp(66px, 10vw, 136px)",
//                   lineHeight: "0.9",
//                 }}
//               >
//                 {last.split("").map((l, i) => (
//                   <RubberLetter
//                     key={i}
//                     delay={0.34 + i * 0.06}
//                     amber
//                     serif
//                   >
//                     {l}
//                   </RubberLetter>
//                 ))}
//                 <RubberLetter delay={0.56} amber serif>.</RubberLetter>
//               </div>
//             </h1>
//           </div>

//           {/* Role subtitle */}
//           <motion.p
//             initial={{ opacity: 0, y: 14 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.64, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
//             className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-500/60 mb-5"
//           >
//             {PERSONAL.title}
//           </motion.p>

//           {/* Bio */}
//           <motion.p
//             initial={{ opacity: 0, y: 12 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.74, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
//             className="text-[15px] text-white/38 leading-relaxed max-w-[420px] mb-10"
//           >
//             {PERSONAL.bio}
//           </motion.p>

//           {/* CTAs */}
//           <motion.div
//             initial={{ opacity: 0, y: 12 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.84, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
//             className="flex flex-wrap gap-3 mb-10"
//           >
//             <Link href="/blog">
//               <motion.span
//                 whileHover={{ scale: 1.02, y: -1 }}
//                 whileTap={{ scale: 0.97 }}
//                 className="group inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-[#0a0a0c] font-black text-sm px-6 py-3.5 rounded-xs transition-all duration-200 shadow-[0_0_28px_rgba(245,158,11,0.3)] hover:shadow-[0_0_48px_rgba(245,158,11,0.55)] cursor-pointer"
//               >
//                 Read the blog
//                 <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
//               </motion.span>
//             </Link>
//             <Link href="/apps">
//               <motion.span
//                 whileHover={{ scale: 1.02, y: -1 }}
//                 whileTap={{ scale: 0.97 }}
//                 className="inline-flex items-center gap-2 border border-white/[0.12] hover:border-amber-400/40 bg-white/[0.03] hover:bg-amber-500/[0.05] text-white/65 hover:text-white font-semibold text-sm px-6 py-3.5 rounded-xs transition-all duration-200 cursor-pointer"
//               >
//                 View my apps
//               </motion.span>
//             </Link>
//           </motion.div>

//           {/* Social + location */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.96, duration: 0.5 }}
//             className="flex items-center gap-5"
//           >
//             <div className="flex items-center gap-2">
//               {LINKS.map(({ href, icon, label }) => (
//                 <SocialIcon key={label} href={href} icon={icon} label={label} />
//               ))}
//             </div>
//             <div className="flex items-center gap-1.5 text-[11px] text-white/20 font-medium">
//               <MapPin className="w-3 h-3 flex-shrink-0 text-white/15" />
//               <span>🇬🇧 London</span>
//               <span className="text-white/10 mx-1">·</span>
//               <span>🇬🇭 Accra</span>
//             </div>
//           </motion.div>
//         </div>

//         {/* ── RIGHT column: Portrait ───────────────────────────────────── */}
//         <div className="relative order-1 lg:order-2 flex-shrink-0 flex flex-col items-center lg:items-end lg:w-[36%] pt-8 lg:pt-16 pb-6 lg:pb-0">

//           <motion.div
//             initial={{ opacity: 0, scale: 0.95, y: 28 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             transition={{ delay: 0.22, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
//             className="relative"
//           >
//             {/* Amber glow behind portrait */}
//             <div
//               className="absolute -inset-8 pointer-events-none rounded-full"
//               style={{
//                 background:
//                   "radial-gradient(ellipse at 50% 80%, rgba(245,158,11,0.14) 0%, transparent 65%)",
//               }}
//             />

//             {/* Photo — tall portrait frame */}
//             <div className="
//   relative 
//   w-56 h-[280px] 
//   sm:w-72 sm:h-[360px] 
//   lg:w-[340px] lg:h-[480px] 
//   overflow-hidden rounded-sm 
//   border border-white/[0.08]
// ">
//   <Image
//     src={PERSONAL.photo}
//     alt={`${PERSONAL.name} — ${PERSONAL.title}`}
//     fill
//     className="
//       object-cover 
//       object-left        {/* or object-[15%] – tweak as needed */}
//       grayscale 
//       hover:grayscale-0 
//       transition-all 
//       duration-700
//     "
//     priority
//     sizes="(max-width: 640px) 224px, (max-width: 1024px) 288px, 340px"
//   />
//   {/* Bottom fade */}
//   <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/55 via-[#0a0a0c]/05 to-transparent pointer-events-none" />
//   {/* Left amber bar */}
//   <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-400/70 via-amber-400/20 to-transparent" />
//   {/* Corner marks */}
//   <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-amber-400/30" />
//   <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-amber-400/20" />
// </div>

//             {/* Identity card beneath photo */}
//             <motion.div
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
//               className="mt-3 flex items-center justify-between px-4 py-3 bg-white/[0.04] border border-white/[0.07] rounded-sm w-full"
//             >
//               <div>
//                 <p className="text-xs font-black text-white leading-tight">{PERSONAL.name}</p>
//                 <p className="text-[10px] text-amber-400/60 mt-0.5">Founder · Builder · Thinker</p>
//               </div>
//               <div className="flex items-center gap-1.5">
//                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
//                 <span className="text-[10px] text-emerald-400/80 font-bold">Available</span>
//               </div>
//             </motion.div>
//           </motion.div>
//         </div>
//       </div>

//       {/* ── STATS BAR ────────────────────────────────────────────────────── */}
//       <motion.div
//         initial={{ opacity: 0, y: 16 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 1.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
//         className="relative z-10 border-t border-white/[0.06] mt-auto"
//       >
//         <div className="max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-16">
//           <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
//             {STATS.map(({ value, suffix, label }) => (
//               <div key={label} className="flex flex-col items-center py-6 px-4">
//                 <span className="text-3xl font-black text-white mb-1 leading-none">
//                   <Counter target={value} suffix={suffix} />
//                 </span>
//                 <span className="text-[11px] text-white/28 font-medium uppercase tracking-widest text-center">
//                   {label}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </motion.div>

//       {/* ── COMPANY TICKER ───────────────────────────────────────────────── */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 1.22, duration: 0.5 }}
//         className="relative z-10 border-t border-white/[0.04] bg-white/[0.015] overflow-hidden py-3"
//       >
//         <motion.div
//           className="flex items-center gap-10 whitespace-nowrap w-max"
//           animate={{ x: ["0%", "-50%"] }}
//           transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
//         >
//           {[...COMPANIES, ...COMPANIES, ...COMPANIES, ...COMPANIES].map((co, i) => (
//             <span key={i} className="flex items-center gap-2 flex-shrink-0">
//               <a
//                 href={co.href}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center gap-2 text-[11px] font-semibold text-white/18 hover:text-white/50 transition-colors duration-200"
//               >
//                 <span className="text-sm">{co.flag}</span>
//                 <span>{co.name}</span>
//                 <span className="text-white/10 font-normal">{co.website}</span>
//               </a>
//               <span className="text-white/[0.08] mx-4">·</span>
//             </span>
//           ))}
//         </motion.div>
//       </motion.div>

//       {/* ── Scroll chevron ───────────────────────────────────────────────── */}
//       <motion.div
//         className="absolute bottom-[108px] left-1/2 -translate-x-1/2 z-20 hidden lg:block"
//         animate={{ y: [0, 7, 0] }}
//         transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
//       >
//         <ChevronDown className="w-4 h-4 text-white/18" />
//       </motion.div>

//     </section>
//   );
// };


