"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, ChevronDown, ChevronUp,
  ExternalLink, Send, Loader2, Clock, MapPin,
  X, 
} from "lucide-react";
import {
  CONTACT_TYPES, CONTACT_CHANNELS, AVAILABILITY,
  CONTACT_FAQS, NO_GO_LIST,
} from "@/lib/data/contact-data";

// ─── Local time display ───────────────────────────────────────────────────────
function LocalTime() {
  const [time, setTime] = useState("");
  const [period, setPeriod] = useState<"morning" | "afternoon" | "evening" | "night">("morning");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const londonTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(now);
      setTime(londonTime);

      const hour = parseInt(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/London",
          hour: "numeric",
          hour12: false,
        }).format(now)
      );
      if (hour >= 5 && hour < 12) setPeriod("morning");
      else if (hour >= 12 && hour < 17) setPeriod("afternoon");
      else if (hour >= 17 && hour < 21) setPeriod("evening");
      else setPeriod("night");
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const periodMeta = {
    morning:   { emoji: "🌤", note: "probably caffeinated" },
    afternoon: { emoji: "☀️", note: "deep in work" },
    evening:   { emoji: "🌆", note: "winding down" },
    night:     { emoji: "🌙", note: "likely offline" },
  }[period];

  if (!time) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-stone-400">
      <span className="text-sm">{periodMeta.emoji}</span>
      <span className="font-mono font-semibold text-stone-600">{time}</span>
      <span className="text-stone-300">in London</span>
      <span className="text-stone-300">·</span>
      <span className="italic text-stone-400">{periodMeta.note}</span>
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────
function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-white border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all";

// ─── Contact type card ────────────────────────────────────────────────────────
function TypeCard({
  type,
  selected,
  onClick,
}: {
  type: (typeof CONTACT_TYPES)[0];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-sm border transition-all duration-200 p-4 group ${
        selected
          ? "border-stone-800 bg-stone-900 text-white shadow-lg"
          : "border-stone-200 bg-white hover:border-stone-400 hover:shadow-sm"
      }`}
    >
      {selected && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-sm"
          style={{ backgroundColor: type.color }}
        />
      )}
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{type.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-black ${selected ? "text-white" : "text-stone-800"}`}
            >
              {type.label}
            </span>
            {selected && (
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: type.color }}
              >
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <p
            className={`text-xs leading-snug mt-0.5 ${selected ? "text-white/50" : "text-stone-400"}`}
          >
            {type.description}
          </p>
          <div
            className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-2 ${
              selected ? "" : "opacity-0 group-hover:opacity-100"
            } transition-opacity`}
            style={{ color: selected ? type.color : type.color }}
          >
            <Clock className="w-2.5 h-2.5" />
            Response: {type.responseTime}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────
function FaqItem({ faq, i }: { faq: (typeof CONTACT_FAQS)[0]; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.06 }}
      className="border-b border-stone-100 last:border-0"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="group w-full flex items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-stone-600 group-hover:text-stone-900 transition-colors leading-snug">
          {faq.q}
        </span>
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-stone-300">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-stone-500 leading-relaxed pb-4">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function ContactClient() {
  const [selectedType, setSelectedType] = useState<string>("collaboration");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    extra: {} as Record<string, string>,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const activeType = CONTACT_TYPES.find((t) => t.id === selectedType)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res  = await fetch("/api/contact/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    formData.name.trim(),
          email:   formData.email.trim(),
          type:    selectedType,
          message: formData.message.trim(),
          // extra carries type-specific fields: company, budget, project, event, url…
          // the API extracts each into its own DB column
          extra:   formData.extra,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please check your connection and try again.");
      console.log("Error message:", errorMsg) // just to fix the type error - will use it properly later
    }
  };

  const update = (key: string, val: string) =>
    setFormData((d) => ({ ...d, [key]: val }));

  const updateExtra = (key: string, val: string) =>
    setFormData((d) => ({ ...d, extra: { ...d.extra, [key]: val } }));

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#fefdf9",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E\")",
      }}
    >
      {/* Amber top rule */}
      <div className="h-[3px] bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />

      <div className="max-w-6xl mx-auto px-5 pt-24 pb-28">

        {/* ── MASTHEAD ────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
            {/* Left */}
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <motion.div
                  className="w-2 h-2 rounded-full bg-amber-500"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 2.4 }}
                />
                <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-600">
                  Contact
                </span>
              </div>

              <h1 className="leading-[0.88] tracking-tight mb-5">
                <span
                  className="block font-black text-stone-900"
                  style={{ fontSize: "clamp(52px, 7vw, 96px)" }}
                >
                  Let&apos;s
                </span>
                <span
                  className="block font-black italic"
                  style={{
                    fontSize: "clamp(52px, 7vw, 96px)",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    color: "#f59e0b",
                  }}
                >
                  talk.
                </span>
              </h1>

              <p className="text-base text-stone-400 leading-relaxed max-w-md font-serif">
                I&apos;m a person, not a support ticket system. Tell me what&apos;s on
                your mind and I&apos;ll give it a genuine read and response.
              </p>
            </div>

            {/* Right — status + time */}
            <div className="space-y-4">
              {/* Availability */}
              <div className="bg-white border border-stone-100 rounded-sm p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                    style={{
                      boxShadow: "0 0 0 3px rgba(52,211,153,0.2)",
                    }}
                  />
                  <span className="text-sm font-bold text-stone-800">
                    {AVAILABILITY.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mb-4">
                  {AVAILABILITY.statusDescription}
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-stone-400">
                    <MapPin className="w-3 h-3 text-stone-300" />
                    <span>{AVAILABILITY.timezoneLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-400">
                    <Clock className="w-3 h-3 text-stone-300" />
                    <span>{AVAILABILITY.workingHours}</span>
                  </div>
                </div>
              </div>

              {/* Live time */}
              <div className="bg-white border border-stone-100 rounded-sm px-5 py-4 shadow-sm">
                <p className="text-[10px] font-black tracking-widest uppercase text-stone-300 mb-2">
                  Isaac&apos;s local time
                </p>
                <LocalTime />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Rule */}
        <div
          className="h-px mb-14"
          style={{
            background: "linear-gradient(90deg, #1c1917, #d4c9b0, transparent)",
          }}
        />

        {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 xl:gap-16">

          {/* ── LEFT: FORM ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-stone-100 rounded-sm p-10 text-center shadow-sm"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    backgroundColor: "#f59e0b18",
                    border: "1px solid #f59e0b40",
                  }}
                >
                  <Check className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-stone-900 mb-3">
                  Message sent.
                </h3>
                <p className="text-stone-500 leading-relaxed text-sm max-w-sm mx-auto mb-6">
                  I&apos;ve received your message and will get back to you within{" "}
                  <strong className="text-stone-700">{activeType.responseTime}</strong>.
                  Check your inbox — and spam just in case.
                </p>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setFormData({ name: "", email: "", message: "", extra: {} });
                  }}
                  className="text-sm text-amber-600 hover:text-amber-800 font-semibold underline underline-offset-2 transition-colors"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <div>
                {/* Step 1: Contact type */}
                <div className="mb-8">
                  <h2 className="text-[11px] font-black tracking-[0.25em] uppercase text-stone-400 mb-4">
                    1 — What kind of conversation?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CONTACT_TYPES.map((type) => (
                      <TypeCard
                        key={type.id}
                        type={type}
                        selected={selectedType === type.id}
                        onClick={() => setSelectedType(type.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Step 2: Form fields */}
                <form onSubmit={handleSubmit}>
                  <h2 className="text-[11px] font-black tracking-[0.25em] uppercase text-stone-400 mb-6">
                    2 — Tell me about it
                  </h2>

                  <div className="space-y-5">
                    {/* Name + Email row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Your name" required>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => update("name", e.target.value)}
                          placeholder="How should I address you?"
                          required
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Email" required>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => update("email", e.target.value)}
                          placeholder="Where should I reply?"
                          required
                          className={inputCls}
                        />
                      </Field>
                    </div>

                    {/* Dynamic extra fields */}
                    <AnimatePresence mode="popLayout">
                      {activeType.extraFields.map((field) => (
                        <motion.div
                          key={`${selectedType}-${field.id}`}
                          initial={{ opacity: 0, height: 0, y: -8 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <Field label={field.label}>
                            <input
                              type={field.type === "url" ? "url" : "text"}
                              value={formData.extra[field.id] ?? ""}
                              onChange={(e) => updateExtra(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className={inputCls}
                            />
                          </Field>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Message */}
                    <Field label="Message" required>
                      <motion.div
                        key={selectedType + "-msg"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <textarea
                          value={formData.message}
                          onChange={(e) => update("message", e.target.value)}
                          placeholder={activeType.placeholder}
                          required
                          rows={6}
                          className={`${inputCls} resize-none leading-relaxed`}
                        />
                      </motion.div>
                    </Field>

                    {/* Submit */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="group flex items-center gap-2.5 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white text-sm font-bold px-8 py-4 rounded-sm transition-all disabled:opacity-60"
                      >
                        {status === "loading" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send message
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                      <p className="text-xs text-stone-300 mt-3">
                        Expected response:{" "}
                        <strong className="text-stone-500" style={{ color: activeType.color }}>
                          {activeType.responseTime}
                        </strong>
                        {" · "}Your email is never shared or sold.
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </motion.div>

          {/* ── RIGHT: SIDEBAR ────────────────────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Direct channels */}
            <div className="bg-white border border-stone-100 rounded-sm overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="text-[11px] font-black tracking-[0.25em] uppercase text-stone-400">
                  Or reach me directly
                </h3>
              </div>
              <div className="divide-y divide-stone-50">
                {CONTACT_CHANNELS.map((ch) => (
                  <a
                    key={ch.id}
                    href={ch.href}
                    target={ch.id !== "email" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center text-base flex-shrink-0 border"
                      style={{
                        backgroundColor: `${ch.color}12`,
                        borderColor: `${ch.color}22`,
                      }}
                    >
                      {ch.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-800">
                          {ch.label}
                        </span>
                        {ch.preferred && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-600 border border-amber-100">
                            Preferred
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 truncate">{ch.handle}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-200 group-hover:text-stone-500 flex-shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* What I won't respond to */}
            <div className="bg-stone-900 rounded-sm overflow-hidden">
              {/* Dot grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative px-5 py-5">
                <h3 className="text-[11px] font-black tracking-[0.25em] uppercase text-stone-400 mb-4">
                  What I won&apos;t respond to
                </h3>
                <div className="space-y-2.5">
                  {NO_GO_LIST.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0 mt-0.5" />
                      <span className="text-[12px] text-stone-400 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white border border-stone-100 rounded-sm overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="text-[11px] font-black tracking-[0.25em] uppercase text-stone-400">
                  You might also want
                </h3>
              </div>
              <div className="divide-y divide-stone-50">
                {[
                  { href: "/ask-isaac", label: "Ask me anything", sub: "AI-powered Q&A with my voice" },
                  { href: "/newsletter", label: "Subscribe to The Signal", sub: "Fortnightly ideas & thinking" },
                  { href: "/apps",       label: "See what I've built",      sub: "Products across 3 companies" },
                  { href: "/now",        label: "What I'm doing now",        sub: "Current snapshot" },
                ].map(({ href, label, sub }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-700 group-hover:text-stone-900 transition-colors leading-none mb-0.5">
                        {label}
                      </p>
                      <p className="text-[11px] text-stone-400">{sub}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-200 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="mt-20 max-w-2xl"
        >
          <div className="flex items-center gap-3 mb-7">
            <h2 className="text-[11px] font-black tracking-[0.25em] uppercase text-stone-400">
              Frequently asked
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-400/40 to-transparent" />
          </div>
          <div className="bg-white border border-stone-100 rounded-sm px-5 shadow-sm">
            {CONTACT_FAQS.map((faq, i) => (
              <FaqItem key={i} faq={faq} i={i} />
            ))}
          </div>
        </motion.section>

        {/* ── FOOTER NAV ──────────────────────────────────────────────────── */}
        <div className="mt-16 pt-10 border-t border-stone-100 flex flex-wrap gap-5">
          {[
            { href: "/blog",       label: "Read my writing" },
            { href: "/apps",       label: "See my apps" },
            { href: "/ideas",      label: "Ideas Lab" },
            { href: "/tools",      label: "Tools" },
            { href: "/ask-isaac",  label: "Ask me anything" },
            { href: "/newsletter", label: "Newsletter" },
            { href: "/now",        label: "Now" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-900 transition-colors duration-200"
            >
              {label}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}