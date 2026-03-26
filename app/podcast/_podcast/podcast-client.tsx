"use client";

import React, { useState, useEffect} from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import {
  Mic, Play, ArrowRight, Check, 
  Radio, ChevronRight, Star,  Loader2,
  Calendar, Clock,  X, Bell, Headphones,
 
} from "lucide-react";
import {
  PODCAST_META, EPISODES, SHOW_FORMATS,
  SHOW_TOPICS, PLATFORMS, GUEST_QUOTES, GUEST_PITCH,
} from "@/lib/data/podcast-data";
import Image from "next/image";

// ─── Waveform SVG ornament ────────────────────────────────────────────────────
function WaveformBars({ bars = 32, height = 40, color = "#ff4d2e", animated = false }: {
  bars?: number; height?: number; color?: string; animated?: boolean;
}) {
  const heights = Array.from({ length: bars }, (_, i) => {
    const x = i / (bars - 1);
    const wave = Math.sin(x * Math.PI * 3 + 1) * 0.35 + 0.5;
    const noise = Math.sin(x * 47.3) * 0.15;
    return Math.max(0.08, Math.min(1, wave + noise));
  });

  return (
    <div className="flex items-center gap-[2px]" style={{ height }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="rounded-full flex-shrink-0"
          style={{
            width: 3,
            backgroundColor: color,
            height: h * height,
            opacity: 0.6 + h * 0.4,
          }}
          animate={animated ? {
            height: [h * height, h * height * (0.4 + Math.random() * 0.6), h * height],
          } : undefined}
          transition={animated ? {
            repeat: Infinity,
            duration: 0.6 + Math.random() * 0.8,
            delay: i * 0.03,
            ease: "easeInOut",
          } : undefined}
        />
      ))}
    </div>
  );
}

// ─── Circular progress ring ───────────────────────────────────────────────────
function CountdownRing({ value, max, label, color }: {
  value: number; max: number; label: string; color: string;
}) {
  const pct = value / max;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke={color} strokeWidth="4"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-white tabular-nums">{String(value).padStart(2, "0")}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return;
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

// ─── COMING SOON OVERLAY ──────────────────────────────────────────────────────
function ComingSoonOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "done">("idle");
  const countdown = useCountdown("2026-09-01T09:00:00Z");
  const ACCENT = PODCAST_META.accentColor;

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubStatus("loading");
    await new Promise(r => setTimeout(r, 1200));
    setSubStatus("done");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", backgroundColor: "rgba(8,8,17,0.82)" }}
    >
      {/* Dismiss backdrop */}
      <div className="absolute inset-0" onClick={onDismiss} />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.1 }}
        className="relative w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,77,46,0.25)", background: "linear-gradient(160deg, #0f0f1a 0%, #0a0a12 100%)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow behind card */}
        <div
          className="absolute -inset-20 rounded-full blur-[100px] pointer-events-none"
          style={{ backgroundColor: ACCENT, opacity: 0.12 }}
        />

        {/* Top bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${ACCENT}, #ff8c00, ${ACCENT})` }} />

        <div className="relative z-10 px-8 py-9">
          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-white/25 hover:text-white border border-white/10 hover:border-white/25 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mic icon with pulse rings */}
          <div className="flex justify-center mb-7">
            <div className="relative">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1px solid ${ACCENT}` }}
                  animate={{ scale: [1, 1 + i * 0.5], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.5, ease: "easeOut" }}
                />
              ))}
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}
              >
                <Mic className="w-7 h-7" style={{ color: ACCENT }} />
              </div>
            </div>
          </div>

          {/* Show name */}
          <div className="text-center mb-6">
            <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-2" style={{ color: `${ACCENT}90` }}>
              Coming Soon
            </p>
            <h2 className="text-4xl font-black text-white leading-tight mb-1">
              Signal &{" "}
              <span style={{ color: ACCENT, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                Noise
              </span>
            </h2>
            <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto">
              A podcast about building companies, African technology, AI, and ideas worth holding onto.
            </p>
          </div>

          {/* Animated waveform */}
          <div className="flex justify-center mb-7">
            <WaveformBars bars={40} height={32} color={ACCENT} animated />
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <CountdownRing value={countdown.days}    max={100} label="Days"    color={ACCENT} />
            <CountdownRing value={countdown.hours}   max={24}  label="Hours"   color="#f97316" />
            <CountdownRing value={countdown.minutes} max={60}  label="Minutes" color="#f59e0b" />
            <CountdownRing value={countdown.seconds} max={60}  label="Seconds" color="#10b981" />
          </div>

          {/* Launch info chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-7">
            {[
              { icon: "📅", text: `Launching ${PODCAST_META.launchQuarter}` },
              { icon: "🎙️", text: PODCAST_META.cadence },
              { icon: "⏱️",  text: PODCAST_META.episodeLength },
            ].map(item => (
              <span key={item.text} className="flex items-center gap-1.5 text-[11px] text-white/40 bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-sm">
                <span>{item.icon}</span>{item.text}
              </span>
            ))}
          </div>

          {/* Subscribe form */}
          {subStatus === "done" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 py-3"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${ACCENT}20`, border: `1px solid ${ACCENT}40` }}
              >
                <Check className="w-4 h-4" style={{ color: ACCENT }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">You&apos;re on the early list.</p>
                <p className="text-xs text-white/35">We&apos;ll tell you the moment we go live.</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={subscribe} className="flex gap-2">
              <div className="relative flex-1">
                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Notify me when it drops"
                  required
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-sm pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={subStatus === "loading"}
                className="flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-sm transition-all hover:brightness-110 disabled:opacity-60 flex-shrink-0"
                style={{ backgroundColor: ACCENT, color: "#fff" }}
              >
                {subStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bell className="w-3.5 h-3.5" />Notify me</>}
              </button>
            </form>
          )}

          {/* Dismiss link */}
          <div className="mt-4 text-center">
            <button
              onClick={onDismiss}
              className="text-[11px] text-white/20 hover:text-white/50 transition-colors"
            >
              I&apos;ll come back later →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Episode status badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = {
    upcoming:   { label: "Upcoming",  color: "#f59e0b" },
    recording:  { label: "Recording", color: "#10b981" },
    editing:    { label: "Editing",   color: "#8b5cf6" },
    released:   { label: "Released",  color: "#22c55e" },
  }[status] ?? { label: status, color: "#888" };

  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-sm"
      style={{ color: cfg.color, backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
    >
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function PodcastClient() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "loading" | "done">("idle");
  const ACCENT = PODCAST_META.accentColor;

  // Show overlay after 1.4s
  useEffect(() => {
    const t = setTimeout(() => setShowOverlay(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.includes("@")) return;
    setNotifyStatus("loading");
    await new Promise(r => setTimeout(r, 1200));
    setNotifyStatus("done");
  };

  return (
    <>
      {/* Reading progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-40 h-[3px] origin-left"
        style={{ scaleX, backgroundColor: ACCENT }}
      />

      {/* Coming soon overlay */}
      <AnimatePresence>
        {showOverlay && <ComingSoonOverlay onDismiss={() => setShowOverlay(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-[#080811] text-white overflow-x-hidden">

        {/* ── AMBIENT ─────────────────────────────────────────────────────── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div
            className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[160px]"
            style={{ backgroundColor: ACCENT, opacity: 0.08 }}
            animate={{ opacity: [0.06, 0.11, 0.06] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          />
          {/* Horizontal scan lines */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)",
              backgroundSize: "100% 3px",
            }}
          />
        </div>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative z-10 min-h-[92vh] flex flex-col justify-center px-5 pt-28 pb-20">
          <div className="max-w-5xl mx-auto w-full">

            {/* ON AIR badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 mb-10"
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: ACCENT }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              />
              <span
                className="text-[11px] font-black tracking-[0.4em] uppercase px-3 py-1.5 rounded-sm"
                style={{ color: ACCENT, backgroundColor: `${ACCENT}12`, border: `1px solid ${ACCENT}25` }}
              >
                Launching {PODCAST_META.launchQuarter}
              </span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
              className="mb-6"
            >
              <h1 className="leading-[0.86] tracking-tighter mb-3">
                <span
                  className="block font-black text-white"
                  style={{ fontSize: "clamp(56px, 10vw, 130px)" }}
                >
                  Signal
                </span>
                <span
                  className="block font-black"
                  style={{
                    fontSize: "clamp(56px, 10vw, 130px)",
                    color: ACCENT,
                    fontStyle: "italic",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}
                >
                  & Noise.
                </span>
              </h1>
            </motion.div>

            {/* Waveform + tagline row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.55 }}
              className="flex flex-col md:flex-row md:items-end gap-6 mb-10"
            >
              <div>
                <p className="text-lg md:text-xl text-white/45 leading-relaxed max-w-xl">
                  {PODCAST_META.description}
                </p>
              </div>
              <div className="md:ml-auto flex-shrink-0">
                <WaveformBars bars={48} height={48} color={ACCENT} animated />
              </div>
            </motion.div>

            {/* Meta chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap gap-3 mb-12"
            >
              {[
                { icon: Clock,    text: PODCAST_META.episodeLength },
                { icon: Radio,    text: PODCAST_META.cadence },
                { icon: Headphones, text: "On all major platforms" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-2 text-sm text-white/35 bg-white/[0.04] border border-white/[0.07] px-4 py-2 rounded-sm">
                  <Icon className="w-3.5 h-3.5 text-white/20" />{text}
                </span>
              ))}
            </motion.div>

            {/* CTA row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={() => setShowOverlay(true)}
                className="group flex items-center gap-2.5 font-bold text-sm px-7 py-4 rounded-sm transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ backgroundColor: ACCENT, color: "#fff" }}
              >
                <Bell className="w-4 h-4" />
                Get notified at launch
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#episodes"
                className="flex items-center gap-2 font-semibold text-sm px-6 py-4 rounded-sm border border-white/[0.1] hover:border-white/[0.25] text-white/50 hover:text-white transition-all"
              >
                <Play className="w-4 h-4" />Preview episodes
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── SHOW PITCH ──────────────────────────────────────────────────── */}
        <section className="relative z-10 py-24 px-5 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-4" style={{ color: `${ACCENT}80` }}>
                  The show
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
                  Conversations
                  <br />
                  <span style={{ color: ACCENT, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                    worth having.
                  </span>
                </h2>
                <p className="text-base text-white/45 leading-relaxed mb-6">
                  Most podcasts optimize for clips. This one optimizes for depth.
                  Every episode is a genuine exploration — of how companies get built,
                  where African technology is going, what AI actually changes, and
                  the ideas that don&apos;t fit anywhere else.
                </p>
                <p className="text-base text-white/45 leading-relaxed">
                  Hosted by Isaac Paha — founder of three companies, builder across
                  the UK and Ghana, and someone who has been asking these questions
                  professionally for six years.
                </p>
              </div>

              {/* Format grid */}
              <div className="grid grid-cols-2 gap-3">
                {SHOW_FORMATS.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.45 }}
                    className="group bg-white/[0.025] border border-white/[0.06] rounded-sm p-4 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all"
                  >
                    <span className="text-xl mb-3 block">{f.emoji}</span>
                    <p className="text-sm font-black text-white leading-tight mb-0.5">{f.title}</p>
                    <p className="text-[11px] text-white/30">{f.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── EPISODES ────────────────────────────────────────────────────── */}
        <section id="episodes" className="relative z-10 py-24 px-5 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between flex-wrap gap-4 mb-14"
            >
              <div>
                <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-3" style={{ color: `${ACCENT}80` }}>
                  Episodes
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                  Coming up.
                </h2>
              </div>
              <span className="text-sm text-white/18">
                {PODCAST_META.totalEpisodesPlanned} episodes planned for Season 1
              </span>
            </motion.div>

            <div className="space-y-4">
              {EPISODES.map((ep, i) => (
                <motion.div
                  key={ep.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.09, duration: 0.5 }}
                  className="group bg-white/[0.025] border border-white/[0.06] rounded-sm overflow-hidden hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-300"
                >
                  {/* Episode top accent bar */}
                  <div className="h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: ep.accentColor }} />

                  <div className="p-6">
                    <div className="flex items-start gap-5">
                      {/* Emoji + number */}
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <div
                          className="w-12 h-12 rounded flex items-center justify-center text-2xl border"
                          style={{ backgroundColor: `${ep.accentColor}10`, borderColor: `${ep.accentColor}20` }}
                        >
                          {ep.emoji}
                        </div>
                        <span className="text-[10px] font-mono text-white/20">EP{String(ep.number).padStart(3, "0")}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="text-base font-black text-white/85 group-hover:text-white leading-snug transition-colors">
                            {ep.title}
                          </h3>
                          <StatusBadge status={ep.status} />
                        </div>

                        {/* Guest */}
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                            style={{ backgroundColor: `${ep.accentColor}20`, color: ep.accentColor, border: `1px solid ${ep.accentColor}30` }}
                          >
                            {ep.guest.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white/70">{ep.guest}</span>
                            <span className="text-xs text-white/30 ml-2">{ep.guestRole}</span>
                          </div>
                          <span className="text-[11px] text-white/20 ml-1">📍 {ep.guestLocation}</span>
                        </div>

                        <p className="text-sm text-white/40 leading-relaxed mb-4">{ep.description}</p>

                        <div className="flex flex-wrap items-center gap-3">
                          {ep.topics.map(t => (
                            <span key={t} className="text-[10px] font-medium text-white/30 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-sm">
                              {t}
                            </span>
                          ))}
                          <div className="ml-auto flex items-center gap-3 text-[11px] text-white/20">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ep.duration}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                              {new Date(ep.recordDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOST ────────────────────────────────────────────────────────── */}
        <section className="relative z-10 py-24 px-5 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-14"
            >
              <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-3" style={{ color: `${ACCENT}80` }}>
                Your host
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white">The host.</h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
              {/* Photo card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-sm overflow-hidden">
                  {/* <div className="h-64 bg-gradient-to-br from-amber-500/15 to-stone-800/40 flex items-center justify-center">
                    <span className="text-7xl">👤</span>
                  </div> */}
                    <Image 
                        src="/images/isaac-paha-og-image.png" 
                        alt="Isaac Paha" 
                        width={160} 
                        height={160} 
                        className="object-cover w-full h-full" 
                    />
                  
                  <div className="p-5">
                    <h3 className="text-lg font-black text-white mb-0.5">Isaac Paha</h3>
                    <p className="text-xs text-white/35 mb-4">{PODCAST_META.hostTitle}</p>
                    <div className="flex items-center gap-2 text-[11px] text-white/25">
                      <span>🇬🇧</span><span>London</span>
                      <span className="text-white/10">·</span>
                      <span>🇬🇭</span><span>Accra</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Bio */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.55 }}
                className="space-y-4"
              >
                {[
                  "Isaac Paha is the founder of iPaha Ltd (UK IT consultancy), iPahaStores Ltd (SaaS & e-commerce), and Okpah Ltd (digital platforms for Ghana). He has built seven products from the ground up and has operated across the UK and West Africa since 2019.",
                  "The questions that drive Signal & Noise are the same ones he asks himself every day: how do you build companies that actually work, what does African technology look like in ten years, and what do the practitioners — not the pundits — actually think?",
                  "He also writes The Signal newsletter (4,800+ readers, 52% open rate), runs the Ideas Lab and Tools Lab on this site, and asks these questions publicly through the blog and the Ask Isaac AI interface.",
                ].map((para, i) => (
                  <p key={i} className="text-[15px] text-white/50 leading-relaxed font-serif">{para}</p>
                ))}

                <div className="flex flex-wrap gap-3 pt-4">
                  <Link href="/about" className="group flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white border border-white/[0.08] hover:border-white/25 px-4 py-2.5 rounded-sm transition-all">
                    Full bio <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/ask-isaac" className="group flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white border border-white/[0.08] hover:border-white/25 px-4 py-2.5 rounded-sm transition-all">
                    Ask Isaac anything <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── TOPICS ──────────────────────────────────────────────────────── */}
        <section className="relative z-10 py-24 px-5 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-3" style={{ color: `${ACCENT}80` }}>
                Themes
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white">What we cover.</h2>
            </motion.div>

            <div className="flex flex-wrap gap-2">
              {SHOW_TOPICS.map((t, i) => (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="group flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.16] px-4 py-3 rounded-sm transition-all cursor-default"
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span
                    className="text-sm font-bold transition-colors"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {t.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLATFORMS ───────────────────────────────────────────────────── */}
        <section className="relative z-10 py-24 px-5 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-3" style={{ color: `${ACCENT}80` }}>
                Distribution
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white">Listen everywhere.</h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PLATFORMS.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  className="relative bg-white/[0.025] border border-white/[0.06] rounded-sm p-5 overflow-hidden"
                >
                  {/* Coming soon scrim */}
                  {!p.available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#080811]/70 backdrop-blur-[2px] z-10">
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/25">
                        Coming {PODCAST_META.launchQuarter}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-white/70">{p.name}</p>
                      <p className="text-[10px] text-white/25">Soon</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GUEST TESTIMONIALS ──────────────────────────────────────────── */}
        <section className="relative z-10 py-24 px-5 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-3" style={{ color: `${ACCENT}80` }}>
                From confirmed guests
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white">What they say.</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GUEST_QUOTES.map((g, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  className="relative bg-white/[0.025] border border-white/[0.07] rounded-sm p-6 overflow-hidden"
                >
                  <span
                    className="absolute top-3 right-5 text-6xl font-black leading-none pointer-events-none select-none"
                    style={{ color: g.accentColor, opacity: 0.08 }}
                  >&#34;</span>
                  <div className="flex gap-0.5 mb-4">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed mb-5">&#34;{g.quote}&#34;</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ backgroundColor: `${g.accentColor}18`, color: g.accentColor, border: `1px solid ${g.accentColor}28` }}
                    >
                      {g.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/70">{g.name}</p>
                      <p className="text-xs text-white/28">{g.role} · {g.location}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GUEST PITCH ─────────────────────────────────────────────────── */}
        <section className="relative z-10 py-24 px-5 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-4" style={{ color: `${ACCENT}80` }}>
                  Be a guest
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
                  {GUEST_PITCH.headline}
                </h2>
                <p className="text-base text-white/40 leading-relaxed mb-7">{GUEST_PITCH.subtext}</p>
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-2.5 font-bold text-sm px-7 py-4 rounded-sm transition-all hover:brightness-110"
                  style={{ backgroundColor: ACCENT, color: "#fff" }}
                >
                  <Mic className="w-4 h-4" />Pitch yourself as a guest
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black tracking-widest uppercase text-white/25 mb-4">
                  We look for guests who...
                </p>
                {GUEST_PITCH.criteria.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.08 + i * 0.08, duration: 0.4 }}
                    className="flex items-start gap-3 bg-white/[0.025] border border-white/[0.06] rounded-sm px-4 py-4"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}30` }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: ACCENT }} />
                    </div>
                    <span className="text-sm text-white/45 leading-snug">{c}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL NOTIFY CTA ────────────────────────────────────────────── */}
        <section className="relative z-10 py-24 px-5">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
                style={{ backgroundColor: `${ACCENT}12`, border: `1px solid ${ACCENT}28` }}
              >
                <Mic className="w-8 h-8" style={{ color: ACCENT }} />
              </div>

              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
                Be the first
                <br />
                <span style={{ color: ACCENT, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                  to listen.
                </span>
              </h2>
              <p className="text-base text-white/30 mb-10 max-w-sm mx-auto leading-relaxed">
                Drop your email. We&apos;ll send you a single message the moment Episode 1 drops.
              </p>

              {notifyStatus === "done" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ACCENT}20`, border: `1px solid ${ACCENT}40` }}>
                    <Check className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">You&apos;re on the early list.</p>
                    <p className="text-xs text-white/35">First to know when Signal & Noise goes live.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleNotify} className="flex gap-2 max-w-sm mx-auto">
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={e => setNotifyEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-all min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={notifyStatus === "loading"}
                    className="flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-sm transition-all hover:brightness-110 disabled:opacity-60 flex-shrink-0"
                    style={{ backgroundColor: ACCENT, color: "#fff" }}
                  >
                    {notifyStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bell className="w-4 h-4" />Notify me</>}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER NAV ──────────────────────────────────────────────────── */}
        <div className="relative z-10 border-t border-white/[0.05] px-5 py-10">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6">
              {[
                ["/blog", "Blog"], ["/apps", "Apps"], ["/ideas", "Ideas Lab"],
                ["/tools", "Tools"], ["/ask-isaac", "Ask Isaac"],
                ["/newsletter", "Newsletter"], ["/now", "Now"], ["/contact", "Contact"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="group flex items-center gap-1 text-sm text-white/22 hover:text-white/70 transition-colors">
                  {label}<ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
            <p className="text-xs text-white/12">© {new Date().getFullYear()} Isaac Paha</p>
          </div>
        </div>
      </div>
    </>
  );
}