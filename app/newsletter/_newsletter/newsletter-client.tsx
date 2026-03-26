"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Mail, ArrowRight, Check, ChevronDown, ChevronUp,
  Users, TrendingUp, Clock, Zap, Send, Star,
  Loader2, X, ChevronRight,
} from "lucide-react";
import {
  NEWSLETTER_META,
  TOPIC_PILLARS,
  PAST_EDITIONS,
  EMAIL_PREVIEW,
  TESTIMONIALS,
  FAQS,
  ANTI_PITCH,
} from "@/lib/data/newsletter-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENT = NEWSLETTER_META.accentColor; // #e8ff47

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Animated number counter ─────────────────────────────────────────────────

function Counter({
  target,
  duration = 1800,
}: {
  target: number;
  duration?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return <span ref={ref}>{val.toLocaleString()}</span>;
}

// ─── Subscribe form ───────────────────────────────────────────────────────────

type FormStatus = "idle" | "loading" | "success" | "error";

function SubscribeForm({ size = "lg", source = "newsletter" }: {
  size?:   "lg" | "sm";
  source?: string;
}) {
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      const res  = await fetch("/api/newsletter/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), source }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "You're subscribed!");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 py-4"
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${ACCENT}18`,
            border: `1px solid ${ACCENT}40`,
          }}
        >
          <Check className="w-4 h-4" style={{ color: ACCENT }} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">You&apos;re in. Welcome.</p>
          <p className="text-xs text-white/35 mt-0.5">
            {message.includes("re-subscribed")
              ? "Welcome back — you've been re-subscribed."
              : "First issue arrives next Tuesday. Check your spam just in case."}
          </p>
        </div>
      </motion.div>
    );
  }

  const inputPy = size === "lg" ? "py-3.5" : "py-2.5";
  const btnPx   = size === "lg" ? "px-7"   : "px-5";

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className={`flex flex-col ${size === "lg" ? "sm:flex-row" : ""} gap-2`}>
        <div className="relative flex-1">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") { setStatus("idle"); setMessage(""); }
            }}
            placeholder="your@email.com"
            required
            className={`w-full bg-white/[0.06] border ${
              status === "error" ? "border-red-500/50" : "border-white/[0.1]"
            } rounded-sm pl-10 pr-4 ${inputPy} text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-all`}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className={`flex items-center justify-center gap-2 font-bold text-sm rounded-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 flex-shrink-0 ${btnPx} ${inputPy}`}
          style={{ backgroundColor: ACCENT, color: "#000" }}
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <><Send className="w-3.5 h-3.5" />Subscribe free</>
          )}
        </button>
      </div>

      {status === "error" && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <X className="w-3 h-3 flex-shrink-0" />
          {message || "Something went wrong. Please try again."}
        </p>
      )}

      <p className="text-[11px] text-white/20">
        Free forever · Unsubscribe anytime · Zero spam
      </p>
    </form>
  );
}

// ─── Email client mockup ──────────────────────────────────────────────────────

function EmailMockup() {
  const e = EMAIL_PREVIEW;

  return (
    <div className="rounded-lg overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-white/10">
      {/* Title bar */}
      <div className="bg-zinc-800/90 backdrop-blur-sm px-4 py-3 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          {["#ff5f57", "#ffbd2e", "#28c840"].map((c) => (
            <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-zinc-700/70 rounded text-[11px] text-white/25 px-3 py-1.5 truncate text-center">
            ✉ {e.subject} — {NEWSLETTER_META.senderEmail}
          </div>
        </div>
      </div>

      {/* Email header pane */}
      <div className="bg-zinc-900/80 px-5 py-4 border-b border-white/[0.05]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] text-white/25">
              From:{" "}
              <span className="text-white/50 font-medium">Isaac Paha</span>{" "}
              &lt;{NEWSLETTER_META.senderEmail}&gt;
            </p>
            <p className="text-[11px] text-white/25">
              Subject:{" "}
              <span className="text-white/70 font-semibold">{e.subject}</span>
            </p>
            <p className="text-[11px] text-white/15 italic">{e.preheader}</p>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded flex-shrink-0 mt-0.5"
            style={{
              backgroundColor: `${ACCENT}18`,
              color: ACCENT,
              border: `1px solid ${ACCENT}30`,
            }}
          >
            Issue #{e.number}
          </span>
        </div>
        <p className="text-[10px] text-white/15 mt-2">{e.date}</p>
      </div>

      {/* Email body */}
      <div className="bg-[#0c0c10] px-5 py-5 overflow-y-auto max-h-[400px] scrollbar-none">
        {/* Newsletter masthead */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/[0.05]">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ backgroundColor: ACCENT, color: "#000" }}
          >
            S
          </div>
          <div>
            <p className="text-sm font-black text-white">{NEWSLETTER_META.name}</p>
            <p className="text-[10px] text-white/30">by Isaac Paha · Issue #{e.number}</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3.5 text-sm">
          {e.sections.map((section, i) => {
            if (section.type === "heading") {
              return (
                <h3 key={i} className="text-[15px] font-black text-white pt-2 pb-1">
                  {section.content}
                </h3>
              );
            }
            if (section.type === "callout") {
              return (
                <div
                  key={i}
                  className="px-4 py-3 my-4 rounded-sm"
                  style={{
                    borderLeft: `3px solid ${ACCENT}`,
                    backgroundColor: `${ACCENT}07`,
                  }}
                >
                  <p className="text-white/75 italic leading-relaxed text-sm">
                    &#34;{section.content}&#34;
                  </p>
                </div>
              );
            }
            if (section.type === "reading") {
              return (
                <div
                  key={i}
                  className="rounded-sm px-4 py-3 my-3"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-[12px] text-white/45 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              );
            }
            if (section.type === "footer") {
              return (
                <p
                  key={i}
                  className="text-[11px] text-white/25 italic pt-4 mt-4 border-t border-white/[0.05]"
                >
                  {section.content}
                </p>
              );
            }
            return (
              <p key={i} className="text-white/50 leading-relaxed">
                {section.content}
              </p>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-white/[0.05] text-center">
          <p className="text-[10px] text-white/12">
            You&apos;re receiving this because you subscribed at isaacpaha.com ·{" "}
            <button className="underline hover:text-white/25 transition-colors">
              Unsubscribe
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────

function FaqItem({ faq, index }: { faq: (typeof FAQS)[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="border-b border-white/[0.07] last:border-0"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm font-semibold text-white/55 group-hover:text-white/90 transition-colors leading-snug">
          {faq.q}
        </span>
        <div
          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border transition-all duration-200 ${
            open ? "border-white/20 bg-white/8" : "border-white/[0.08]"
          }`}
        >
          {open ? (
            <ChevronUp className="w-3.5 h-3.5 text-white/50" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-white/25" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-white/35 leading-relaxed pb-5">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-black tracking-[0.3em] uppercase mb-3"
      style={{ color: `${ACCENT}70` }}
    >
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function NewsletterClient() {
  const [archiveExpanded, setArchiveExpanded] = useState(false);
  const visibleEditions = archiveExpanded ? PAST_EDITIONS : PAST_EDITIONS.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#070709] text-white overflow-x-hidden">

      {/* ── AMBIENT BACKGROUND ───────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top centre glow — the "beacon" */}
        <motion.div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[180px]"
          style={{ backgroundColor: ACCENT, opacity: 0.12 }}
          animate={{ opacity: [0.10, 0.16, 0.10] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(7,7,9,0.8)_100%)]" />
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pt-24 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-24 items-start">

            {/* LEFT — pitch */}
            <div className="lg:pt-14 lg:pb-24">

              {/* Live badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2 mb-8"
              >
                <motion.div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ACCENT }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 2.2 }}
                />
                <span className="text-xs text-white/40 font-semibold">
                  <Counter target={NEWSLETTER_META.subscriberCount} /> readers ·{" "}
                  {NEWSLETTER_META.issueCount} issues published
                </span>
              </motion.div>

              {/* Masthead */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6"
              >
                <span
                  className="block text-[11px] font-black tracking-[0.4em] uppercase mb-2"
                  style={{ color: `${ACCENT}60` }}
                >
                  The Newsletter
                </span>
                <h1 className="leading-[0.86] tracking-tighter">
                  <span
                    className="block font-black italic"
                    style={{
                      fontSize: "clamp(60px, 9vw, 112px)",
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      color: ACCENT,
                    }}
                  >
                    The
                  </span>
                  <span
                    className="block font-black text-white"
                    style={{ fontSize: "clamp(60px, 9vw, 112px)" }}
                  >
                    Signal.
                  </span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className="text-[17px] text-white/40 leading-relaxed max-w-[440px] mb-10"
              >
                {NEWSLETTER_META.description}
              </motion.p>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap gap-6 mb-10"
              >
                {[
                  { icon: Users,      value: "4.8k",                       label: "subscribers" },
                  { icon: TrendingUp, value: NEWSLETTER_META.openRate,     label: "open rate" },
                  { icon: Clock,      value: NEWSLETTER_META.readTime,     label: "read time" },
                  { icon: Zap,        value: "Fortnightly",                label: "cadence" },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-white/18 flex-shrink-0" />
                    <span className="text-sm font-black text-white">{value}</span>
                    <span className="text-xs text-white/25">{label}</span>
                  </div>
                ))}
              </motion.div>

              {/* Form */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.28 }}
                className="max-w-[440px] mb-8"
              >
                <SubscribeForm size="lg" />
              </motion.div>

              {/* Anti-pitch pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42 }}
                className="flex flex-wrap gap-2"
              >
                {ANTI_PITCH.map((item, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 text-[11px] text-white/20 border border-white/[0.06] px-2.5 py-1.5 rounded-sm"
                  >
                    <X className="w-2.5 h-2.5 text-red-400/50 flex-shrink-0" />
                    {item.replace(/^A /, "").replace(/^An /, "")}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* RIGHT — email preview */}
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="relative lg:sticky lg:top-24 lg:-mt-4"
            >
              {/* Glow halo behind the email */}
              <div
                className="absolute -inset-12 rounded-full blur-[80px] pointer-events-none"
                style={{ backgroundColor: ACCENT, opacity: 0.12 }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ACCENT }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  <span className="text-[11px] font-semibold text-white/25 tracking-widest uppercase">
                    Latest issue — #{EMAIL_PREVIEW.number}
                  </span>
                </div>
                <EmailMockup />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INSIDE ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-5 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <SectionEyebrow>What&apos;s inside</SectionEyebrow>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              What I write about.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {TOPIC_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group relative bg-white/[0.025] border border-white/[0.06] rounded-sm p-6 overflow-hidden hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-300"
              >
                {/* Hover color wash */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 20% 20%, ${pillar.color}0A, transparent 70%)`,
                  }}
                />
                {/* Top accent line on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, ${pillar.color}70, transparent 60%)`,
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div
                      className="w-11 h-11 rounded text-2xl flex items-center justify-center border"
                      style={{
                        backgroundColor: `${pillar.color}10`,
                        borderColor: `${pillar.color}20`,
                      }}
                    >
                      {pillar.emoji}
                    </div>
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-sm flex-shrink-0"
                      style={{
                        color: pillar.color,
                        backgroundColor: `${pillar.color}10`,
                        border: `1px solid ${pillar.color}22`,
                      }}
                    >
                      {pillar.frequency}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-black text-white mb-2">
                    {pillar.label}
                  </h3>
                  <p className="text-sm text-white/38 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAST EDITIONS ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-5 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between flex-wrap gap-4 mb-14"
          >
            <div>
              <SectionEyebrow>Archive</SectionEyebrow>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Past editions.
              </h2>
            </div>
            <span className="text-sm text-white/18 hidden md:block mb-1">
              {NEWSLETTER_META.issueCount} issues published since 2022
            </span>
          </motion.div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {visibleEditions.map((ed, i) => (
                <motion.div
                  key={ed.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  transition={{ delay: (i % 3) * 0.07, duration: 0.4 }}
                  className="group flex items-start gap-5 bg-white/[0.025] border border-white/[0.06] rounded-sm p-5 hover:border-white/[0.13] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
                >
                  {/* Emoji + number */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className="w-11 h-11 bg-white/[0.04] border border-white/[0.07] rounded flex items-center justify-center text-2xl">
                      {ed.emoji}
                    </div>
                    <span className="text-[10px] font-mono text-white/18">
                      #{ed.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1.5">
                      <h3 className="text-[15px] font-black text-white/85 group-hover:text-white leading-tight transition-colors">
                        {ed.title}
                      </h3>
                      <div className="flex items-center gap-3 flex-shrink-0 text-[11px] text-white/20">
                        <span className="hidden sm:flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {ed.openRate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ed.readTime}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-white/35 leading-snug mb-3">
                      {ed.subtitle}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex gap-1.5">
                        {ed.topics.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-medium text-white/28 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-sm"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] text-white/15 ml-auto hidden sm:block">
                        {formatDate(ed.date)}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-white/12 group-hover:text-white/35 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-all" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setArchiveExpanded((a) => !a)}
            className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-white/25 hover:text-white/70 border border-white/[0.06] hover:border-white/[0.18] py-4 rounded-sm transition-all duration-200"
          >
            {archiveExpanded ? (
              <><ChevronUp className="w-4 h-4" /> Show fewer</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Show all {NEWSLETTER_META.issueCount} editions</>
            )}
          </button>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-5 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <SectionEyebrow>Readers</SectionEyebrow>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              What subscribers say.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.1, duration: 0.48 }}
                className="relative bg-white/[0.025] border border-white/[0.07] rounded-sm p-6 overflow-hidden"
              >
                {/* Oversized quote mark */}
                <span
                  className="absolute top-3 right-5 text-7xl font-black leading-none pointer-events-none select-none"
                  style={{ color: t.accentColor, opacity: 0.07 }}
                >
                  &apos;
                </span>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-white/55 leading-relaxed mb-5 relative z-10">
                  &apos;{t.quote}&apos;
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{
                      backgroundColor: `${t.accentColor}18`,
                      color: t.accentColor,
                      border: `1px solid ${t.accentColor}28`,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/75">{t.name}</p>
                    <p className="text-xs text-white/28">
                      {t.role} · {t.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE HONEST PITCH ─────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-5 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <SectionEyebrow>The honest pitch</SectionEyebrow>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
                What you{" "}
                <span
                  className="italic"
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  won&apos;t
                </span>{" "}
                get.
              </h2>
              <p className="text-base text-white/35 leading-relaxed max-w-md">
                The newsletter space is full of content dressed up as thinking.
                Here&apos;s what{" "}
                <span className="text-white/65 font-semibold">The Signal</span>{" "}
                isn&apos;t.
              </p>
            </motion.div>

            <div className="space-y-2">
              {ANTI_PITCH.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 + i * 0.08, duration: 0.45 }}
                  className="flex items-center gap-4 bg-white/[0.025] border border-white/[0.06] rounded-sm px-5 py-4"
                >
                  <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <X className="w-2.5 h-2.5 text-red-400/70" />
                  </div>
                  <span className="text-sm text-white/45">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-5 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <SectionEyebrow>Questions</SectionEyebrow>
            <h2 className="text-4xl md:text-5xl font-black text-white">FAQ.</h2>
          </motion.div>

          <div className="bg-white/[0.025] border border-white/[0.07] rounded-sm px-6">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Envelope icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-8"
              style={{
                backgroundColor: `${ACCENT}12`,
                border: `1px solid ${ACCENT}28`,
              }}
            >
              ✉️
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-white leading-tight mb-3">
              Join{" "}
              <span style={{ color: ACCENT }}>
                <Counter target={NEWSLETTER_META.subscriberCount} />
              </span>
            </h2>
            <p className="text-xl text-white/30 font-semibold mb-3">readers.</p>

            <p className="text-base text-white/30 mb-12 leading-relaxed max-w-sm mx-auto">
              Free. Fortnightly. Written by someone who actually builds things,
              for people who do the same.
            </p>

            <div className="max-w-[440px] mx-auto">
              <SubscribeForm size="lg" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SITE NAV FOOTER ──────────────────────────────────────────────── */}
      <div className="relative z-10 border-t border-white/[0.05] px-5 py-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6">
            {[
              { href: "/blog",      label: "Blog" },
              { href: "/apps",      label: "Apps" },
              { href: "/ideas",     label: "Ideas Lab" },
              { href: "/tools",     label: "Tools" },
              { href: "/ask-isaac", label: "Ask Isaac" },
              { href: "/now",       label: "Now" },
              { href: "/about",     label: "About" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-1 text-sm text-white/22 hover:text-white/70 transition-colors duration-200"
              >
                {label}
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
          <p className="text-xs text-white/12">
            © {new Date().getFullYear()} Isaac Paha
          </p>
        </div>
      </div>
    </div>
  );
}