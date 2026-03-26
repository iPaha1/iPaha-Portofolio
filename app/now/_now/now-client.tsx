"use client";

// =============================================================================
// /now — Transformed: Dark Editorial Luxury + AI Chat + Live Status
// app/now/_now/now-client.tsx
// =============================================================================

import React, { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue, useInView } from "framer-motion";
import {
  MapPin, BookOpen, Lightbulb, Headphones, Tv2,
  Rocket, GraduationCap, Clock, ChevronRight, ExternalLink,
  ArrowRight, Share2, Check, Info, Heart,
  RefreshCw, ChevronDown, MessageCircle, Send, X,
  Zap, Sparkles, Activity, Brain, Eye, Flame,
  TrendingUp, Star, Circle,
} from "lucide-react";
import {
  NOW_META, NOW_BUILDING, NOW_READING, NOW_FINISHED,
  NOW_THOUGHTS, NOW_LEARNING, NOW_LISTENING, NOW_WATCHING,
  NOW_NEXT, NOW_ARCHIVE,
} from "@/lib/data/now-data";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  bg:      "#08080f",
  surface: "rgba(255,255,255,0.04)",
  border:  "rgba(255,255,255,0.07)",
  amber:   "#f59e0b",
  amber2:  "#fbbf24",
  text:    "rgba(255,255,255,0.88)",
  muted:   "rgba(255,255,255,0.4)",
  faint:   "rgba(255,255,255,0.15)",
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff} days ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE FIELD
// ─────────────────────────────────────────────────────────────────────────────

function ParticleField() {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x:  Math.random() * 100,
    y:  Math.random() * 100,
    size: 0.5 + Math.random() * 1.5,
    dur: 4 + Math.random() * 8,
    delay: Math.random() * 6,
    opacity: 0.08 + Math.random() * 0.18,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top:  `${p.y}%`,
            width:  p.size,
            height: p.size,
            background: T.amber,
            opacity: p.opacity,
          }}
          animate={{ opacity: [p.opacity, p.opacity * 3, p.opacity], y: [0, -12, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE STATUS TICKER
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MESSAGES = [
  "Writing code somewhere in London",
  "Thinking about Africa's next chapter",
  "Building products that actually matter",
  "Reading something that's changing my mind",
  "Connecting dots between ideas",
  "Working on iPaha Ltd projects",
  "Probably deep in a flow state right now",
  "Questioning everything, building anyway",
];

function LiveStatusTicker() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % STATUS_MESSAGES.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="relative flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-400"
          style={{ boxShadow: "0 0 8px #10b981" }} />
        <motion.div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400"
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] font-medium"
          style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Sora', system-ui" }}>
          {STATUS_MESSAGES[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.floor(eased * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GLASSMORPHISM CARD
// ─────────────────────────────────────────────────────────────────────────────

const GlassCard = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode; className?: string; accent?: string;
    onClick?: () => void; hover?: boolean;
  }
>(
  ({ children, className = "", accent, onClick, hover = true }, ref) => {
    const [hovered, setHovered] = useState(false);

    return (
      <motion.div
        ref={ref}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={hover ? { y: -2 } : {}}
        onClick={onClick}
        className={`relative rounded-xs overflow-hidden ${onClick ? "cursor-pointer" : ""} ${className}`}
        style={{
          background: hovered && hover ? `rgba(255,255,255,0.06)` : T.surface,
          border: `1px solid ${hovered && hover && accent ? `${accent}40` : T.border}`,
          boxShadow: hovered && hover && accent ? `0 0 30px ${accent}12` : "none",
          transition: "all 0.25s",
        }}>
        {accent && (
          <div className="absolute top-0 left-0 right-0 h-[1.5px]"
            style={{ background: `linear-gradient(90deg, ${accent}, ${accent}40, transparent)`, opacity: hovered ? 1 : 0.5, transition: "opacity 0.25s" }} />
        )}
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";

// ─────────────────────────────────────────────────────────────────────────────
// MAGNETIC HOVER EFFECT WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function Magnetic({ children, strength = 0.15 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };

  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} style={{ x, y }} onMouseMove={handleMouse} onMouseLeave={reset}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}>
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS ARC
// ─────────────────────────────────────────────────────────────────────────────

function ProgressArc({ value, color, size = 56, stroke = 4 }: { value: number; color: string; size?: number; stroke?: number }) {
  const r   = (size - stroke * 2) / 2;
  const c   = 2 * Math.PI * r;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={inView ? { strokeDashoffset: c * (1 - value / 100) } : {}}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION REVEAL
// ─────────────────────────────────────────────────────────────────────────────

function Section({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}>
      {children}
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADING
// ─────────────────────────────────────────────────────────────────────────────

function SectionHead({ icon: Icon, label, accent = T.amber }: { icon: React.ElementType; label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="w-8 h-8 rounded-xs flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <h2 className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
      </h2>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accent}30, transparent)` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CHAT WIDGET
// ─────────────────────────────────────────────────────────────────────────────

interface ChatMsg { role: "user" | "assistant"; content: string }

const NOW_CONTEXT = `
You are Isaac Paha's /now page AI assistant. Answer questions about what Isaac is doing RIGHT NOW.
Isaac Paha is a British-Ghanaian technologist, entrepreneur, and computing graduate from The Open University.
He is founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd — building technology for the UK and Africa.

Current building projects: ${NOW_BUILDING.map(b => `${b.name} (${b.statusLabel}, ${b.completionPct}% complete) — ${b.detail}`).join("; ")}
Currently reading: ${NOW_READING.map(b => `${b.title} by ${b.author}`).join(", ")}
Current thoughts: ${NOW_THOUGHTS.map(t => t.text).join(" | ")}
Current learning: ${NOW_LEARNING.map(l => l.topic).join(", ")}
Location: ${NOW_META.location}
Mode: ${NOW_META.mode}

Be concise, warm, and genuine. Speak as if you know Isaac personally. Keep answers under 120 words.
If asked something not covered here, say you'll let Isaac know they asked.
`.trim();

function AiChat() {
  const [open,     setOpen]     = useState(false);
  const [msgs,     setMsgs]     = useState<ChatMsg[]>([
    { role: "assistant", content: "Hey! I'm Isaac's /now assistant. Ask me anything about what he's building, reading, thinking about — or just what he's up to right now. 👋" }
  ]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMsgs(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const history: ChatMsg[] = [...msgs, { role: "user", content: q }];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: NOW_CONTEXT,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't get that — try again?";
      setMsgs(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Hmm, something went wrong. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = ["What is Isaac building?", "What's he reading?", "Where is Isaac now?", "What's on his mind?"];

  return (
    <>
      {/* Trigger button */}
      <Magnetic>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xs font-black text-sm"
          style={{
            background: `linear-gradient(135deg, ${T.amber}22, ${T.amber}12)`,
            border: `1px solid ${T.amber}40`,
            color: T.amber,
            boxShadow: `0 0 24px ${T.amber}15`,
            fontFamily: "'Sora', system-ui",
          }}>
          <Sparkles className="w-4 h-4" />
          Ask Isaac's AI
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </motion.button>
      </Magnetic>

      {/* Chat drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[500]"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="fixed bottom-6 right-6 z-[501] w-full max-w-sm rounded-xs overflow-hidden flex flex-col"
              style={{
                background: "rgba(10,10,16,0.98)",
                border: `1px solid ${T.border}`,
                boxShadow: `0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)`,
                height: 520,
                fontFamily: "'Sora', system-ui",
              }}>

              {/* Header */}
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${T.amber}, ${T.amber}40, transparent)` }} />
              <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xs flex items-center justify-center"
                    style={{ background: `${T.amber}18`, border: `1px solid ${T.amber}30` }}>
                    <Brain className="w-3.5 h-3.5" style={{ color: T.amber }} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white" style={{ letterSpacing: "-0.01em" }}>Isaac's Now AI</p>
                    <p className="text-[10px]" style={{ color: T.muted }}>Powered by Claude · Knows everything on this page</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-xs transition-colors"
                  style={{ color: T.muted, background: "rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "white")}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {msgs.map((m, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xs text-xs leading-relaxed`}
                      style={{
                        background: m.role === "user" ? `${T.amber}20` : "rgba(255,255,255,0.06)",
                        border: m.role === "user" ? `1px solid ${T.amber}35` : `1px solid ${T.border}`,
                        color: m.role === "user" ? T.amber2 : T.text,
                      }}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-xs" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}` }}>
                      <div className="flex gap-1 items-center">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: T.amber }}
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts */}
              {msgs.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {QUICK.map(q => (
                    <button key={q} onClick={() => { setInput(q); }}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-xs transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.muted }}
                      onMouseEnter={e => (e.currentTarget.style.color = "white")}
                      onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 pb-3 flex-shrink-0">
                <div className="flex gap-2" style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send()}
                    placeholder="Ask anything about Isaac's now…"
                    className="flex-1 px-3 py-2 rounded-xs text-xs outline-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${T.border}`,
                      color: "white",
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={send}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 rounded-xs flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                    style={{ background: T.amber, color: "black" }}>
                    <Send className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "ISAAC IS PROBABLY…" INFERENCE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

const INFERENCES = [
  { icon: "💻", text: "Deep in a coding session", prob: 38 },
  { icon: "📚", text: "Reading something mind-bending", prob: 22 },
  { icon: "🤔", text: "Thinking about Africa's future", prob: 18 },
  { icon: "✍️", text: "Writing or planning something", prob: 12 },
  { icon: "☕", text: "On a coffee break, recharging", prob: 10 },
];

function ProbabilityEngine() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % INFERENCES.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <GlassCard accent={T.amber} className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4" style={{ color: T.amber }} />
        <span className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: T.muted }}>
          Isaac is probably…
        </span>
      </div>

      <div className="space-y-2.5">
        {INFERENCES.map((inf, i) => (
          <motion.div key={i} className="flex items-center gap-3"
            animate={{ opacity: active === i ? 1 : 0.4 }}
            transition={{ duration: 0.4 }}>
            <span className="text-base w-6 flex-shrink-0">{inf.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium" style={{ color: active === i ? "white" : T.muted }}>
                  {inf.text}
                </span>
                <span className="text-[10px] font-black tabular-nums" style={{ color: T.amber }}>
                  {inf.prob}%
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: active === i ? T.amber : "rgba(255,255,255,0.12)" }}
                  animate={{ width: `${inf.prob}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL RADAR (SVG)
// ─────────────────────────────────────────────────────────────────────────────

const SKILLS = [
  { label: "Building", value: 92 },
  { label: "Writing",  value: 78 },
  { label: "Thinking", value: 88 },
  { label: "Leading",  value: 82 },
  { label: "Learning", value: 96 },
  { label: "Shipping", value: 85 },
];

function SkillRadar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const N = SKILLS.length;
  const CX = 100, CY = 100, R = 76;

  const pt = (i: number, v: number) => {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
    const r = (v / 100) * R;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  };

  const outerPt = (i: number) => {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
    return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
  };

  const labelPt = (i: number) => {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
    const r = R + 18;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  };

  const polyPoints = SKILLS.map((s, i) => {
    const p = pt(i, s.value);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <GlassCard accent="#6366f1" className="p-5" ref={ref}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-indigo-400" />
        <span className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: T.muted }}>
          Current Energy Map
        </span>
      </div>

      <svg viewBox="20 15 160 170" className="w-full max-w-[220px] mx-auto">
        {/* Grid rings */}
        {[25, 50, 75, 100].map(pct => (
          <polygon key={pct}
            points={SKILLS.map((_, i) => {
              const p = pt(i, pct);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1" />
        ))}

        {/* Spokes */}
        {SKILLS.map((_, i) => {
          const o = outerPt(i);
          return <line key={i} x1={CX} y1={CY} x2={o.x} y2={o.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
        })}

        {/* Data polygon */}
        <motion.polygon
          points={polyPoints}
          fill="rgba(99,102,241,0.18)"
          stroke="#6366f1"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }} />

        {/* Data points */}
        {SKILLS.map((s, i) => {
          const p = pt(i, s.value);
          return (
            <motion.circle key={i} cx={p.x} cy={p.y} r="3"
              fill="#6366f1" stroke="white" strokeWidth="1"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.08 }} />
          );
        })}

        {/* Labels */}
        {SKILLS.map((s, i) => {
          const lp = labelPt(i);
          return (
            <text key={i} x={lp.x} y={lp.y + 4}
              textAnchor="middle"
              fontSize="8"
              fill="rgba(255,255,255,0.45)"
              fontFamily="Sora, system-ui"
              fontWeight="700">
              {s.label}
            </text>
          );
        })}
      </svg>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THOUGHT WORD CLOUD
// ─────────────────────────────────────────────────────────────────────────────

const WORDS = [
  { w: "Africa", size: 22, col: T.amber },
  { w: "AI",     size: 28, col: "#10b981" },
  { w: "Build",  size: 18, col: "#6366f1" },
  { w: "Scale",  size: 16, col: "#ec4899" },
  { w: "Future", size: 20, col: T.amber },
  { w: "Code",   size: 15, col: "#06b6d4" },
  { w: "Impact", size: 24, col: "#f97316" },
  { w: "Solve",  size: 14, col: "#10b981" },
  { w: "Ship",   size: 18, col: "#8b5cf6" },
  { w: "Think",  size: 16, col: "rgba(255,255,255,0.5)" },
];

function ThoughtCloud() {
  return (
    <GlassCard accent="#ec4899" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-pink-400" />
        <span className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: T.muted }}>
          Mind right now
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5 items-center justify-center py-2">
        {WORDS.map((w, i) => (
          <motion.span key={w.w}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, type: "spring", damping: 16 }}
            whileHover={{ scale: 1.15, y: -2 }}
            className="font-black cursor-default select-none"
            style={{ fontSize: w.size, color: w.col, letterSpacing: "-0.02em" }}>
            {w.w}
          </motion.span>
        ))}
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOW VS THEN TOGGLE
// ─────────────────────────────────────────────────────────────────────────────

function NowVsThen() {
  const [view, setView] = useState<"now" | "then">("now");
  const prev = NOW_ARCHIVE[0];

  const nowData  = { label: "Now",  date: NOW_META.lastUpdated,  building: NOW_BUILDING[0]?.name ?? "—", location: NOW_META.location, mode: NOW_META.mode, energy: NOW_META.energyPct };
  const thenData = { label: "Then", date: prev?.date ?? "",      building: "Earlier projects",           location: prev?.location ?? "—", mode: "Different phase", energy: 72 };

  const data = view === "now" ? nowData : thenData;

  return (
    <GlassCard accent={T.amber} className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: T.amber }} />
          <span className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: T.muted }}>
            Now vs Then
          </span>
        </div>
        <div className="flex gap-1 p-1 rounded-xs" style={{ background: "rgba(255,255,255,0.05)" }}>
          {(["now","then"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-1 rounded-xs text-[10px] font-black capitalize transition-all"
              style={{
                background: view === v ? T.amber : "transparent",
                color: view === v ? "black" : T.muted,
              }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={view}
          initial={{ opacity: 0, x: view === "now" ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: view === "now" ? 12 : -12 }}
          transition={{ duration: 0.3 }}
          className="space-y-3">
          {[
            { label: "Date",     val: formatDate(data.date) },
            { label: "Building", val: data.building },
            { label: "Location", val: data.location },
            { label: "Mode",     val: data.mode },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-2"
              style={{ borderBottom: `1px solid ${T.border}` }}>
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: T.muted }}>{r.label}</span>
              <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>{r.val}</span>
            </div>
          ))}
          <div>
            <div className="flex justify-between text-[10px] mb-1.5">
              <span style={{ color: T.muted }}>Energy</span>
              <span className="font-black" style={{ color: T.amber }}>{data.energy}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div className="h-full rounded-full"
                animate={{ width: `${data.energy}%` }}
                style={{ background: T.amber }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILDING PROJECT CARD (dark)
// ─────────────────────────────────────────────────────────────────────────────

function BuildCard({ b, index }: { b: typeof NOW_BUILDING[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <GlassCard accent={b.statusColor} className="p-5 group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.span className="text-3xl" whileHover={{ scale: 1.2, rotate: 8 }}>{b.icon}</motion.span>
            <div>
              <h3 className="font-black text-white text-sm" style={{ letterSpacing: "-0.02em" }}>{b.name}</h3>
              <p className="text-[10px]" style={{ color: T.muted }}>{b.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <ProgressArc value={b.completionPct} color={b.statusColor} size={44} stroke={3.5} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black"
                style={{ color: b.statusColor }}>
                {b.completionPct}%
              </span>
            </div>
            <Link href={`/apps/${b.appSlug}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-xs"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <ExternalLink className="w-3 h-3" style={{ color: T.muted }} />
            </Link>
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: b.statusColor }}>{b.focus}</p>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>{b.detail}</p>

        <span className="inline-flex text-[9px] font-black px-2.5 py-1 rounded-xs uppercase tracking-wider"
          style={{ background: `${b.statusColor}18`, color: b.statusColor, border: `1px solid ${b.statusColor}30` }}>
          {b.statusLabel}
        </span>
      </GlassCard>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOK CARD (dark)
// ─────────────────────────────────────────────────────────────────────────────

function DarkBookCard({ book }: { book: typeof NOW_READING[0] }) {
  return (
    <GlassCard accent="#3b82f6" className="overflow-hidden">
      <div className="flex">
        <div className="w-1.5 flex-shrink-0" style={{ background: book.coverColor }} />
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-black text-white leading-snug" style={{ letterSpacing: "-0.01em" }}>{book.title}</h3>
            <div className="flex gap-px flex-shrink-0">
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ color: i <= book.rating ? "#f59e0b" : "rgba(255,255,255,0.1)", fontSize: 11 }}>★</span>
              ))}
            </div>
          </div>
          <p className="text-[10px] mb-4" style={{ color: T.muted }}>{book.author} · <em>{book.genre}</em></p>

          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ color: T.faint }}>
              <span>Progress</span>
              <span className="font-black" style={{ color: "#3b82f6" }}>{book.progress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: `${book.progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: "#3b82f6" }} />
            </div>
          </div>

          <p className="text-xs leading-relaxed italic"
            style={{ color: "rgba(255,255,255,0.4)", borderLeft: "2px solid rgba(59,130,246,0.3)", paddingLeft: 10 }}>
            "{book.thought}"
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THOUGHT CARD (dark)
// ─────────────────────────────────────────────────────────────────────────────

function DarkThoughtCard({ thought, index }: { thought: typeof NOW_THOUGHTS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.5 }}>
      <GlassCard accent={thought.tagColor} className="p-5 relative">
        <div className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full"
          style={{ background: thought.tagColor }} />
        <div className="pl-4">
          <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "Georgia, serif" }}>
            {thought.text}
          </p>
          <span className="inline-flex text-[9px] font-black px-2.5 py-1 rounded-xs uppercase tracking-wider"
            style={{ color: thought.tagColor, background: `${thought.tagColor}15`, border: `1px solid ${thought.tagColor}25` }}>
            {thought.tag}
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function NowClient() {
  const [copied,      setCopied]      = useState(false);
  const [subscribed,  setSubscribed]  = useState(false);
  const [email,       setEmail]       = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Hero parallax
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY  = useTransform(heroScroll, [0, 1], [0, 120]);
  const heroOp = useTransform(heroScroll, [0, 0.6], [1, 0]);

  const share = () => {
    navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "https://isaacpaha.com/now");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) setSubscribed(true);
  };

  return (
    <>
      {/* Reading progress bar */}
      <motion.div className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
        style={{ scaleX, background: `linear-gradient(90deg, ${T.amber}, #fbbf24)` }} />

      <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Sora', system-ui, sans-serif" }}>

        {/* Top amber hairline */}
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${T.amber} 30%, ${T.amber}60 100%)` }} />

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <div ref={heroRef} className="relative min-h-[90vh] flex flex-col overflow-hidden">
          <ParticleField />

          {/* Background orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
              style={{ background: `radial-gradient(circle, ${T.amber}08 0%, transparent 65%)`, filter: "blur(40px)" }} />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)", filter: "blur(50px)" }} />
          </div>

          {/* Grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

          <motion.div style={{ y: heroY, opacity: heroOp }} className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto px-6 pt-28 pb-16 w-full">

            {/* Live ticker */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12 flex items-center gap-4">
              <LiveStatusTicker />
              <div className="ml-auto">
                <AiChat />
              </div>
            </motion.div>

            {/* Headline */}
            <div className="mb-8">
              <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[10px] font-black tracking-[0.35em] uppercase mb-5"
                style={{ color: T.amber }}>
                {NOW_META.version} · {formatDate(NOW_META.lastUpdated)}
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="font-black leading-[0.86] tracking-tight mb-4"
                  style={{ fontSize: "clamp(52px,9vw,118px)", letterSpacing: "-0.04em" }}>
                  <span className="text-white block">What I&apos;m</span>
                  <span className="block" style={{ color: T.amber, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}>
                    doing now.
                  </span>
                </h1>
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }}
                className="text-base leading-relaxed max-w-xl"
                style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Georgia, serif" }}>
                A living snapshot of what&apos;s on my mind, what I&apos;m building, reading, and thinking
                about — right now. Updated whenever things shift meaningfully.
              </motion.p>
            </div>

            {/* Status chips */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: MapPin,  label: NOW_META.location.split(",")[0],  val: NOW_META.locationFlag, col: "#10b981" },
                { icon: Zap,     label: NOW_META.mode,                    val: NOW_META.modeEmoji,    col: T.amber   },
                { icon: Heart,   label: NOW_META.moodLabel,               val: NOW_META.moodEmoji,    col: "#ec4899" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xs"
                  style={{ background: `${s.col}10`, border: `1px solid ${s.col}25` }}>
                  <span className="text-sm">{s.val}</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                      <s.icon className="w-2.5 h-2.5 inline mr-1" style={{ color: s.col }} />
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Energy + Meta */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
              className="flex items-center gap-6 flex-wrap">
              {/* Energy */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ProgressArc value={NOW_META.energyPct} color={T.amber} size={52} stroke={4} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Flame className="w-4 h-4" style={{ color: T.amber }} />
                  </div>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: T.muted }}>Energy</p>
                  <p className="text-xl font-black" style={{ color: T.amber, letterSpacing: "-0.03em" }}>
                    <AnimatedNumber value={NOW_META.energyPct} suffix="%" />
                  </p>
                </div>
              </div>

              <div className="h-8 w-px" style={{ background: T.border }} />

              {/* Updated */}
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" style={{ color: T.muted }} />
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: T.muted }}>Updated</p>
                  <p className="text-sm font-bold text-white">{daysAgo(NOW_META.lastUpdated)}</p>
                </div>
              </div>

              <div className="ml-auto flex gap-2">
                <button onClick={share}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xs transition-all"
                  style={{ border: `1px solid ${T.border}`, color: T.muted, background: T.surface }}
                  onMouseEnter={e => (e.currentTarget.style.color = "white")}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                  {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</> : <><Share2 className="w-3 h-3" /> Share</>}
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
            className="relative z-10 flex justify-center pb-8">
            <ChevronDown className="w-5 h-5" style={{ color: T.faint }} />
          </motion.div>
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">

          {/* ── INTERACTIVE WIDGETS ROW ─── */}
          <Section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProbabilityEngine />
              <ThoughtCloud />
              <NowVsThen />
            </div>
          </Section>

          {/* Divider */}
          <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${T.border}, transparent)` }} />

          {/* ── BUILDING ─── */}
          <Section>
            <SectionHead icon={Rocket} label="What I'm Building" accent={T.amber} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NOW_BUILDING.map((b, i) => <BuildCard key={b.id} b={b} index={i} />)}
            </div>
          </Section>

          {/* ── SKILL RADAR + READING ─── */}
          <Section>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2">
                <SectionHead icon={TrendingUp} label="Energy Map" accent="#6366f1" />
                <SkillRadar />
              </div>
              <div className="md:col-span-3">
                <SectionHead icon={BookOpen} label="What I'm Reading" accent="#3b82f6" />
                <div className="space-y-4">
                  {NOW_READING.map(book => <DarkBookCard key={book.id} book={book} />)}
                </div>
              </div>
            </div>
          </Section>

          {/* Recently finished */}
          <Section>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-4" style={{ color: T.muted }}>
              Recently Finished
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {NOW_FINISHED.map(book => (
                <GlassCard key={book.id} accent="#3b82f6" className="p-4">
                  <span className="text-2xl block mb-2">{book.emoji}</span>
                  <div className="flex gap-px mb-2">
                    {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= book.rating ? "#f59e0b" : "rgba(255,255,255,0.1)", fontSize: 10 }}>★</span>)}
                  </div>
                  <p className="text-xs font-black text-white mb-0.5 leading-tight">{book.title}</p>
                  <p className="text-[10px] mb-2" style={{ color: T.muted }}>{book.author}</p>
                  <p className="text-[10px] italic leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{book.thought}</p>
                </GlassCard>
              ))}
            </div>
          </Section>

          <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${T.border}, transparent)` }} />

          {/* ── THOUGHTS ─── */}
          <Section>
            <SectionHead icon={Lightbulb} label="What I'm Thinking About" accent="#f97316" />
            <div className="space-y-3">
              {NOW_THOUGHTS.map((t, i) => <DarkThoughtCard key={t.id} thought={t} index={i} />)}
            </div>
          </Section>

          {/* ── LEARNING ─── */}
          <Section>
            <SectionHead icon={GraduationCap} label="What I'm Learning" accent="#6366f1" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {NOW_LEARNING.map(item => (
                <GlassCard key={item.topic} accent="#6366f1" className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="text-sm font-black text-white">{item.topic}</h3>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider"
                          style={{ color: item.depthColor, background: `${item.depthColor}15`, border: `1px solid ${item.depthColor}25` }}>
                          {item.depth}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{item.why}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </Section>

          {/* ── LISTENING + WATCHING ─── */}
          <Section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <SectionHead icon={Headphones} label="Listening To" accent="#ec4899" />
                <div className="space-y-2">
                  {NOW_LISTENING.map((track, i) => (
                    <GlassCard key={i} accent="#ec4899" className="px-4 py-3 flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{track.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{track.title}</p>
                        <p className="text-[10px]" style={{ color: T.muted }}>{track.artist}</p>
                        <p className="text-[10px] italic" style={{ color: T.faint }}>{track.context}</p>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
              <div>
                <SectionHead icon={Tv2} label="Watching" accent="#14b8a6" />
                <div className="space-y-3">
                  {NOW_WATCHING.map(item => (
                    <GlassCard key={item.title} accent={item.accentColor} className="p-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-xl">{item.emoji}</span>
                        <div>
                          <p className="text-sm font-bold text-white">{item.title}</p>
                          <span className="text-[10px] font-bold capitalize" style={{ color: item.accentColor }}>{item.format}</span>
                        </div>
                      </div>
                      <p className="text-xs italic leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{item.thought}</p>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${T.border}, transparent)` }} />

          {/* ── WHAT'S NEXT ─── */}
          <Section>
            <SectionHead icon={ChevronRight} label="What's Next" accent="#10b981" />
            <div className="relative pl-6" style={{ borderLeft: `1px solid ${T.border}` }}>
              {NOW_NEXT.map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.09 }}
                  className="relative mb-5 last:mb-0">
                  <div className="absolute -left-[calc(1.5rem+4px)] top-3 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: item.horizonColor, borderColor: T.bg }} />
                  <GlassCard accent={item.horizonColor} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-[9px] font-black px-2.5 py-0.5 rounded-xs uppercase tracking-wider"
                        style={{ color: item.horizonColor, background: `${item.horizonColor}15`, border: `1px solid ${item.horizonColor}25` }}>
                        {item.horizon}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{item.text}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* ── SUBSCRIBE ─── */}
          <Section>
            <div className="relative rounded-xs overflow-hidden p-8"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(99,102,241,0.06) 100%)", border: `1px solid ${T.amber}25` }}>
              <div className="h-[2px] absolute top-0 left-0 right-0" style={{ background: `linear-gradient(90deg, ${T.amber}, ${T.amber}40, transparent)` }} />
              <ParticleField />

              <div className="relative z-10 max-w-md">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4" style={{ color: T.amber }} />
                  <span className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: T.amber }}>Get notified</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-1" style={{ letterSpacing: "-0.03em" }}>When this page updates</h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Georgia, serif" }}>
                  I update this snapshot every few weeks. No newsletter — just a single email when something meaningful changes.
                </p>

                {subscribed ? (
                  <div className="flex items-center gap-2" style={{ color: "#10b981" }}>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-bold">You&apos;re on the list.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-2.5 rounded-xs text-sm outline-none min-w-0"
                      style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`, color: "white" }} required />
                    <button type="submit"
                      className="px-5 py-2.5 rounded-xs text-sm font-black text-black flex-shrink-0"
                      style={{ background: T.amber }}>
                      Notify me
                    </button>
                  </form>
                )}
              </div>
            </div>
          </Section>

          {/* ── PAST SNAPSHOTS ─── */}
          <Section>
            <div className="h-px mb-8" style={{ background: `linear-gradient(90deg, transparent, ${T.border}, transparent)` }} />

            <button onClick={() => setArchiveOpen(a => !a)}
              className="flex items-center gap-2.5 text-sm font-bold mb-5 transition-colors"
              style={{ color: T.muted }}
              onMouseEnter={e => (e.currentTarget.style.color = "white")}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
              <Clock className="w-4 h-4" />
              Past snapshots ({NOW_ARCHIVE.length})
              <motion.div animate={{ rotate: archiveOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {archiveOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden">
                  <div className="relative pl-6 space-y-0" style={{ borderLeft: `1px solid ${T.border}` }}>
                    {NOW_ARCHIVE.map(entry => (
                      <div key={entry.version} className="relative pb-5 last:pb-0">
                        <div className="absolute -left-[calc(1.5rem+4px)] top-1 w-2 h-2 rounded-full"
                          style={{ background: "rgba(255,255,255,0.2)", border: `1px solid ${T.bg}` }} />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{entry.label}</span>
                          <span className="font-mono text-[10px]" style={{ color: T.muted }}>{entry.version}</span>
                          <span className="text-[10px]" style={{ color: T.faint }}>· 📍 {entry.location}</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{entry.summary}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          {/* ── /NOW INFO ─── */}
          {/* <Section>
            <GlassCard accent={T.amber} className="p-4 flex items-start gap-3">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: T.amber }} />
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                This is a{" "}
                <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer"
                  className="underline underline-offset-2" style={{ color: T.amber }}>
                  /now page
                </a>{" "}
                — a concept by{" "}
                <a href="https://sive.rs/now" target="_blank" rel="noopener noreferrer"
                  className="underline underline-offset-2" style={{ color: T.amber }}>
                  Derek Sivers
                </a>
                . An honest snapshot of what&apos;s happening in my life right now — not a PR exercise.
              </p>
            </GlassCard>
          </Section> */}

          {/* ── FOOTER NAV ─── */}
          <Section>
            <div className="flex flex-wrap gap-5 pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
              {[
                { href: "/blog",       label: "Read my writing"   },
                { href: "/apps",       label: "See my apps"       },
                { href: "/ask-isaac",  label: "Ask me anything"   },
                { href: "/ideas",      label: "Ideas Lab"         },
                { href: "/about",      label: "About me"          },
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="group flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color: T.muted }}
                  onMouseEnter={e => (e.currentTarget.style.color = "white")}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                  {label}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </>
  );
}




// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
// import {
//   MapPin,  BookOpen, Lightbulb, Headphones, Tv2,
//   Rocket, GraduationCap, Clock, ChevronRight, ExternalLink,
//   ArrowRight, Share2, Check, Info, Heart, 
//   RefreshCw, ChevronDown, 
// } from "lucide-react";
// import {
//   NOW_META, NOW_BUILDING, NOW_READING, NOW_FINISHED,
//   NOW_THOUGHTS, NOW_LEARNING, NOW_LISTENING, NOW_WATCHING,
//   NOW_NEXT, NOW_ARCHIVE,
// } from "@/lib/data/now-data";

// // ── Utilities ─────────────────────────────────────────────────────────────────

// function daysAgo(dateStr: string): string {
//   const diff = Math.floor(
//     (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
//   );
//   if (diff === 0) return "today";
//   if (diff === 1) return "yesterday";
//   return `${diff} days ago`;
// }

// function formatDate(dateStr: string) {
//   return new Date(dateStr).toLocaleDateString("en-GB", {
//     day: "numeric", month: "long", year: "numeric",
//   });
// }

// // ── Animated progress bar ─────────────────────────────────────────────────────
// function InkBar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
//   return (
//     <div
//       className="w-full rounded-full overflow-hidden bg-stone-100"
//       style={{ height }}
//     >
//       <motion.div
//         className="h-full rounded-full"
//         style={{ backgroundColor: color }}
//         initial={{ width: 0 }}
//         whileInView={{ width: `${value}%` }}
//         viewport={{ once: true, margin: "-20px" }}
//         transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
//       />
//     </div>
//   );
// }

// // ── Star rating ───────────────────────────────────────────────────────────────
// function Stars({ n }: { n: number }) {
//   return (
//     <span className="flex gap-px">
//       {[1,2,3,4,5].map(i => (
//         <span key={i} style={{ color: i <= n ? "#f59e0b" : "#e5e0d8", fontSize: 11 }}>★</span>
//       ))}
//     </span>
//   );
// }

// // ── Section wrapper (scroll-in) ───────────────────────────────────────────────
// function FadeIn({ children, className = "", delay = 0 }: {
//   children: React.ReactNode; className?: string; delay?: number;
// }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 26 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true, margin: "-50px" }}
//       transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
//       className={className}
//     >
//       {children}
//     </motion.div>
//   );
// }

// // ── Section heading ───────────────────────────────────────────────────────────
// function Heading({
//   icon: Icon, label, color = "#f59e0b",
// }: { icon: React.ElementType; label: string; color?: string }) {
//   return (
//     <div className="flex items-center gap-3 mb-8">
//       <div
//         className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
//         style={{ backgroundColor: `${color}18` }}
//       >
//         <Icon className="w-[15px] h-[15px]" style={{ color }} />
//       </div>
//       <h2 className="text-[11px] font-black tracking-[0.25em] uppercase text-stone-400">
//         {label}
//       </h2>
//       <div
//         className="flex-1 h-px"
//         style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }}
//       />
//     </div>
//   );
// }

// // ── Book spine card ───────────────────────────────────────────────────────────
// function BookCard({ book }: { book: (typeof NOW_READING)[0] }) {
//   return (
//     <div className="group bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 hover:shadow-sm transition-all duration-300">
//       <div className="flex gap-0">
//         {/* Spine */}
//         <div
//           className="w-2 flex-shrink-0"
//           style={{ backgroundColor: book.coverColor }}
//         />
//         {/* Content */}
//         <div className="flex-1 p-5">
//           <div className="flex items-start justify-between gap-3 mb-1">
//             <h3 className="text-sm font-black text-stone-900 leading-snug">{book.title}</h3>
//             <Stars n={book.rating} />
//           </div>
//           <p className="text-xs text-stone-400 mb-4">
//             {book.author}
//             <span className="mx-1.5 text-stone-200">·</span>
//             <span className="italic">{book.genre}</span>
//           </p>

//           {/* Progress */}
//           <div className="mb-4">
//             <div className="flex justify-between text-[10px] text-stone-400 mb-1.5">
//               <span>Reading progress</span>
//               <span className="font-bold text-stone-600">{book.progress}%</span>
//             </div>
//             <InkBar value={book.progress} color="#3b82f6" height={4} />
//           </div>

//           {/* Thought */}
//           <p className="text-xs text-stone-500 leading-relaxed italic border-l-2 border-stone-100 pl-3">
//             &#34;{book.thought}&#34;
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Thought card ──────────────────────────────────────────────────────────────
// function ThoughtCard({ thought, index }: { thought: (typeof NOW_THOUGHTS)[0]; index: number }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, x: -16 }}
//       whileInView={{ opacity: 1, x: 0 }}
//       viewport={{ once: true, margin: "-30px" }}
//       transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
//       className="relative group bg-white border border-stone-100 rounded-sm p-5 hover:border-stone-200 hover:shadow-sm transition-all duration-200"
//     >
//       {/* Left accent bar */}
//       <div
//         className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full"
//         style={{ backgroundColor: thought.tagColor }}
//       />
//       <div className="pl-4">
//         <p className="text-sm text-stone-700 leading-relaxed mb-3 font-serif">
//           {thought.text}
//         </p>
//         <span
//           className="inline-flex text-[10px] font-bold px-2.5 py-1 rounded-sm"
//           style={{
//             color: thought.tagColor,
//             backgroundColor: `${thought.tagColor}10`,
//             border: `1px solid ${thought.tagColor}20`,
//           }}
//         >
//           {thought.tag}
//         </span>
//       </div>
//     </motion.div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────

// export function NowClient() {
//   const [copied, setCopied] = useState(false);
//   const [subscribed, setSubscribed] = useState(false);
//   const [email, setEmail] = useState("");
//   const [archiveOpen, setArchiveOpen] = useState(false);

//   // Page scroll progress bar
//   const { scrollYProgress } = useScroll();
//   const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

//   const share = () => {
//     navigator.clipboard.writeText(
//       typeof window !== "undefined" ? window.location.href : "https://isaacpaha.com/now"
//     );
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleSubscribe = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (email.includes("@")) setSubscribed(true);
//   };

//   return (
//     <>
//       {/* Reading progress bar */}
//       <motion.div
//         className="fixed top-0 left-0 right-0 z-50 h-[3px] origin-left"
//         style={{ scaleX, backgroundColor: "#f59e0b" }}
//       />

//       <div
//         className="min-h-screen"
//         style={{
//           backgroundColor: "#faf8f4",
//           // Subtle paper grain via inline SVG pattern
//           backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E")`,
//         }}
//       >
//         {/* Top amber rule */}
//         <div className="h-[3px] bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />

//         <div className="max-w-2xl mx-auto px-5 pt-28 pb-28">

//           {/* ── MASTHEAD ──────────────────────────────────────────────────── */}
//           <motion.header
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
//             className="mb-16"
//           >
//             {/* Eyebrow */}
//             <div className="flex items-center gap-2.5 mb-5">
//               <motion.div
//                 className="w-2 h-2 rounded-full bg-amber-500"
//                 animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
//                 transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
//               />
//               <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-600">
//                 Now
//               </span>
//               <span className="text-[11px] text-stone-300 font-mono">{NOW_META.version}</span>
//             </div>

//             {/* Title */}
//             <h1 className="mb-5 leading-[0.88]">
//               <span className="block text-6xl md:text-8xl font-black text-stone-900 tracking-tight">
//                 What I&apos;m
//               </span>
//               <span
//                 className="block text-6xl md:text-8xl font-black tracking-tight italic"
//                 style={{
//                   fontFamily: "Georgia, 'Times New Roman', serif",
//                   color: "#f59e0b",
//                 }}
//               >
//                 doing now.
//               </span>
//             </h1>

//             {/* Description */}
//             <p className="text-base text-stone-400 leading-relaxed max-w-lg mb-10 font-serif">
//               A living snapshot of what&apos;s on my mind, what I&apos;m building,
//               reading, and thinking about — right now. Updated whenever
//               things shift meaningfully.
//             </p>

//             {/* Status strip */}
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
//               {/* Location */}
//               <div className="flex items-center gap-2.5 bg-white border border-stone-100 rounded-sm px-4 py-3">
//                 <MapPin className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
//                 <div className="min-w-0">
//                   <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Location</p>
//                   <p className="text-xs font-bold text-stone-700 truncate">
//                     {NOW_META.locationFlag} {NOW_META.location.split(",")[0]}
//                   </p>
//                 </div>
//               </div>

//               {/* Mode */}
//               <div className="flex items-center gap-2.5 bg-white border border-stone-100 rounded-sm px-4 py-3">
//                 <span className="text-base flex-shrink-0">{NOW_META.modeEmoji}</span>
//                 <div>
//                   <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Mode</p>
//                   <p
//                     className="text-xs font-bold"
//                     style={{ color: NOW_META.modeColor }}
//                   >
//                     {NOW_META.mode}
//                   </p>
//                 </div>
//               </div>

//               {/* Mood */}
//               <div className="flex items-center gap-2.5 bg-white border border-stone-100 rounded-sm px-4 py-3">
//                 <span className="text-base flex-shrink-0">{NOW_META.moodEmoji}</span>
//                 <div>
//                   <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Feeling</p>
//                   <p className="text-xs font-bold text-stone-700">{NOW_META.moodLabel}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Energy bar */}
//             <div className="bg-white border border-stone-100 rounded-sm p-4 mb-6">
//               <div className="flex items-center justify-between text-[11px] mb-2">
//                 <span className="text-stone-400 font-semibold uppercase tracking-wider">Energy level</span>
//                 <span className="font-black text-stone-700">{NOW_META.energyPct}%</span>
//               </div>
//               <InkBar value={NOW_META.energyPct} color="#f59e0b" height={6} />
//             </div>

//             {/* Meta row */}
//             <div className="flex items-center justify-between flex-wrap gap-3">
//               <div className="flex items-center gap-1.5 text-xs text-stone-400">
//                 <RefreshCw className="w-3 h-3" />
//                 <span>
//                   Updated{" "}
//                   <strong className="text-stone-600 font-semibold">
//                     {daysAgo(NOW_META.lastUpdated)}
//                   </strong>
//                   {" · "}
//                   {formatDate(NOW_META.lastUpdated)}
//                 </span>
//               </div>
//               <button
//                 onClick={share}
//                 className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-3 py-1.5 rounded-sm transition-all duration-200"
//               >
//                 {copied ? (
//                   <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600">Copied!</span></>
//                 ) : (
//                   <><Share2 className="w-3 h-3" /> Share snapshot</>
//                 )}
//               </button>
//             </div>
//           </motion.header>

//           {/* Rule */}
//           <div className="h-px mb-14" style={{ background: "linear-gradient(90deg, #1c1917, #d4c9b0, transparent)" }} />

//           {/* ── BUILDING ────────────────────────────────────────────────── */}
//           <FadeIn className="mb-16">
//             <Heading icon={Rocket} label="What I'm Building" color="#f59e0b" />
//             <div className="space-y-4">
//               {NOW_BUILDING.map((b) => (
//                 <div
//                   key={b.id}
//                   className="group bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 hover:shadow-sm transition-all duration-300"
//                 >
//                   {/* Top accent */}
//                   <div className="h-[2px]" style={{ backgroundColor: b.statusColor }} />

//                   <div className="p-5">
//                     <div className="flex items-start justify-between gap-3 mb-3">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{b.icon}</span>
//                         <div>
//                           <h3 className="text-base font-black text-stone-900">{b.name}</h3>
//                           <p className="text-[11px] text-stone-400">{b.company}</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2 flex-shrink-0">
//                         <span
//                           className="text-[10px] font-bold px-2.5 py-1 rounded-sm border"
//                           style={{
//                             color: b.statusColor,
//                             backgroundColor: `${b.statusColor}10`,
//                             borderColor: `${b.statusColor}25`,
//                           }}
//                         >
//                           {b.statusLabel}
//                         </span>
//                         <Link
//                           href={`/apps/${b.appSlug}`}
//                           className="opacity-0 group-hover:opacity-100 transition-opacity"
//                           aria-label={`View ${b.name}`}
//                         >
//                           <ExternalLink className="w-3.5 h-3.5 text-stone-300 hover:text-stone-600 transition-colors" />
//                         </Link>
//                       </div>
//                     </div>

//                     {/* Focus line */}
//                     <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
//                       {b.focus}
//                     </p>
//                     <p className="text-sm text-stone-600 leading-relaxed mb-4">{b.detail}</p>

//                     {/* Progress */}
//                     <div>
//                       <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1.5">
//                         <span>Build completion</span>
//                         <span className="font-bold text-stone-600">{b.completionPct}%</span>
//                       </div>
//                       <InkBar value={b.completionPct} color={b.statusColor} height={5} />
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </FadeIn>

//           {/* ── READING ─────────────────────────────────────────────────── */}
//           <FadeIn className="mb-16">
//             <Heading icon={BookOpen} label="What I'm Reading" color="#3b82f6" />
//             <div className="space-y-4 mb-8">
//               {NOW_READING.map((book) => (
//                 <BookCard key={book.id} book={book} />
//               ))}
//             </div>

//             {/* Recently finished */}
//             <div>
//               <p className="text-[10px] font-black tracking-[0.2em] uppercase text-stone-300 mb-3 ml-1">
//                 Recently finished
//               </p>
//               <div className="grid grid-cols-2 gap-3">
//                 {NOW_FINISHED.map((book) => (
//                   <div
//                     key={book.id}
//                     className="bg-white border border-stone-100 rounded-sm p-4 hover:border-stone-200 transition-all"
//                   >
//                     <div className="flex items-center gap-2 mb-2.5">
//                       <span className="text-xl">{book.emoji}</span>
//                       <Stars n={book.rating} />
//                     </div>
//                     <p className="text-sm font-black text-stone-800 leading-tight mb-0.5">{book.title}</p>
//                     <p className="text-[11px] text-stone-400 mb-2">{book.author}</p>
//                     <p className="text-[11px] text-stone-500 italic leading-relaxed">{book.thought}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </FadeIn>

//           {/* ── THOUGHTS ────────────────────────────────────────────────── */}
//           <FadeIn className="mb-16">
//             <Heading icon={Lightbulb} label="What I'm Thinking About" color="#f97316" />
//             <div className="space-y-3">
//               {NOW_THOUGHTS.map((thought, i) => (
//                 <ThoughtCard key={thought.id} thought={thought} index={i} />
//               ))}
//             </div>
//           </FadeIn>

//           {/* ── LEARNING ────────────────────────────────────────────────── */}
//           <FadeIn className="mb-16">
//             <Heading icon={GraduationCap} label="What I'm Learning" color="#6366f1" />
//             <div className="space-y-4">
//               {NOW_LEARNING.map((item) => (
//                 <div
//                   key={item.topic}
//                   className="bg-white border border-stone-100 rounded-sm p-5 hover:border-stone-200 transition-all"
//                 >
//                   <div className="flex items-start gap-4">
//                     <span className="text-2xl flex-shrink-0 mt-0.5">{item.emoji}</span>
//                     <div className="flex-1">
//                       <div className="flex items-center gap-2.5 mb-2">
//                         <h3 className="text-sm font-black text-stone-900">{item.topic}</h3>
//                         <span
//                           className="text-[10px] font-bold px-2 py-0.5 rounded-sm border"
//                           style={{
//                             color: item.depthColor,
//                             backgroundColor: `${item.depthColor}10`,
//                             borderColor: `${item.depthColor}25`,
//                           }}
//                         >
//                           {item.depth}
//                         </span>
//                       </div>
//                       <p className="text-sm text-stone-500 leading-relaxed">{item.why}</p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </FadeIn>

//           {/* ── LISTENING + WATCHING ─────────────────────────────────────── */}
//           <FadeIn className="mb-16">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

//               {/* Listening */}
//               <div>
//                 <Heading icon={Headphones} label="Listening To" color="#ec4899" />
//                 <div className="space-y-2">
//                   {NOW_LISTENING.map((track, i) => (
//                     <div
//                       key={i}
//                       className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3 hover:border-stone-200 transition-all"
//                     >
//                       <span className="text-lg flex-shrink-0">{track.emoji}</span>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm font-bold text-stone-800 truncate">{track.title}</p>
//                         <p className="text-[11px] text-stone-400">{track.artist}</p>
//                         <p className="text-[10px] text-stone-300 italic mt-0.5">{track.context}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Watching */}
//               <div>
//                 <Heading icon={Tv2} label="Watching" color="#14b8a6" />
//                 <div className="space-y-3">
//                   {NOW_WATCHING.map((item) => (
//                     <div
//                       key={item.title}
//                       className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all"
//                     >
//                       <div
//                         className="h-[2px]"
//                         style={{ backgroundColor: item.accentColor }}
//                       />
//                       <div className="p-4">
//                         <div className="flex items-center gap-2.5 mb-2">
//                           <span className="text-xl">{item.emoji}</span>
//                           <div>
//                             <p className="text-sm font-bold text-stone-800 leading-none">{item.title}</p>
//                             <span
//                               className="text-[10px] font-semibold capitalize"
//                               style={{ color: item.accentColor }}
//                             >
//                               {item.format}
//                             </span>
//                           </div>
//                         </div>
//                         <p className="text-xs text-stone-500 italic leading-relaxed">{item.thought}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </FadeIn>

//           {/* ── WHAT'S NEXT ──────────────────────────────────────────────── */}
//           <FadeIn className="mb-16">
//             <Heading icon={ChevronRight} label="What's Next" color="#10b981" />
//             <div className="relative pl-6 border-l border-stone-100">
//               {NOW_NEXT.map((item, i) => (
//                 <motion.div
//                   key={i}
//                   initial={{ opacity: 0, x: 12 }}
//                   whileInView={{ opacity: 1, x: 0 }}
//                   viewport={{ once: true, margin: "-20px" }}
//                   transition={{ duration: 0.45, delay: i * 0.09 }}
//                   className="relative mb-6 last:mb-0"
//                 >
//                   {/* Timeline dot */}
//                   <div
//                     className="absolute -left-[calc(1.5rem+5px)] top-1 w-2.5 h-2.5 rounded-full border-2 border-white"
//                     style={{ backgroundColor: item.horizonColor }}
//                   />
//                   <div className="bg-white border border-stone-100 rounded-sm p-4 hover:border-stone-200 transition-all">
//                     <div className="flex items-center gap-2 mb-2">
//                       <span className="text-lg">{item.icon}</span>
//                       <span
//                         className="text-[11px] font-bold px-2.5 py-0.5 rounded-sm"
//                         style={{
//                           color: item.horizonColor,
//                           backgroundColor: `${item.horizonColor}12`,
//                           border: `1px solid ${item.horizonColor}25`,
//                         }}
//                       >
//                         {item.horizon}
//                       </span>
//                     </div>
//                     <p className="text-sm text-stone-600 leading-relaxed">{item.text}</p>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </FadeIn>

//           {/* ── SUBSCRIBE ────────────────────────────────────────────────── */}
//           <FadeIn className="mb-16">
//             <div className="relative bg-stone-900 rounded-sm overflow-hidden p-7">
//               {/* Subtle dot grid */}
//               <div
//                 className="absolute inset-0 opacity-[0.04]"
//                 style={{
//                   backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
//                   backgroundSize: "18px 18px",
//                 }}
//               />
//               {/* Glow */}
//               <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/15 blur-3xl" />

//               <div className="relative z-10">
//                 <div className="flex items-center gap-2 mb-2">
//                   <Heart className="w-4 h-4 text-amber-400" />
//                   <span className="text-[11px] font-black tracking-[0.2em] uppercase text-amber-400">
//                     Get notified
//                   </span>
//                 </div>
//                 <p className="text-xl font-black text-white mb-1">
//                   When this page updates
//                 </p>
//                 <p className="text-sm text-white/40 mb-6 leading-relaxed max-w-sm">
//                   I update this snapshot every few weeks. No newsletter — just
//                   a single email when something meaningful changes.
//                 </p>

//                 {subscribed ? (
//                   <div className="flex items-center gap-2 text-green-400">
//                     <Check className="w-4 h-4" />
//                     <span className="text-sm font-semibold">You&apos;re on the list.</span>
//                   </div>
//                 ) : (
//                   <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
//                     <input
//                       type="email"
//                       value={email}
//                       onChange={e => setEmail(e.target.value)}
//                       placeholder="your@email.com"
//                       className="flex-1 bg-white/8 border border-white/12 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all min-w-0"
//                       required
//                     />
//                     <button
//                       type="submit"
//                       className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-5 py-2.5 rounded-sm transition-all flex-shrink-0"
//                     >
//                       Notify me
//                     </button>
//                   </form>
//                 )}
//               </div>
//             </div>
//           </FadeIn>

//           {/* ── Rule ────────────────────────────────────────────────────── */}
//           <div className="h-px bg-stone-200 mb-10" />

//           {/* ── PAST SNAPSHOTS ───────────────────────────────────────────── */}
//           <FadeIn className="mb-12">
//             <button
//               onClick={() => setArchiveOpen(a => !a)}
//               className="group flex items-center gap-2.5 text-sm font-semibold text-stone-400 hover:text-stone-700 transition-colors mb-4"
//             >
//               <Clock className="w-4 h-4" />
//               Past snapshots ({NOW_ARCHIVE.length})
//               <ChevronDown
//                 className={`w-4 h-4 transition-transform duration-300 ${archiveOpen ? "rotate-180" : ""}`}
//               />
//             </button>

//             <AnimatePresence>
//               {archiveOpen && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: "auto" }}
//                   exit={{ opacity: 0, height: 0 }}
//                   transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
//                   className="overflow-hidden"
//                 >
//                   <div className="relative pl-6 border-l border-stone-200 space-y-0">
//                     {NOW_ARCHIVE.map((entry) => (
//                       <div key={entry.version} className="relative pb-6 last:pb-0">
//                         {/* Dot */}
//                         <div className="absolute -left-[calc(1.5rem+4px)] top-1 w-2 h-2 rounded-full bg-stone-200 border border-white" />
//                         <div className="flex items-center gap-2 mb-1">
//                           <span className="text-xs font-bold text-stone-600">{entry.label}</span>
//                           <span className="font-mono text-[10px] text-stone-300">{entry.version}</span>
//                           <span className="text-[10px] text-stone-300">·</span>
//                           <span className="text-[10px] text-stone-400">📍 {entry.location}</span>
//                         </div>
//                         <p className="text-xs text-stone-500 leading-relaxed">{entry.summary}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </FadeIn>

//           {/* ── /NOW ATTRIBUTION ─────────────────────────────────────────── */}
//           <FadeIn className="mb-12">
//             <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-sm">
//               <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
//               <p className="text-xs text-stone-500 leading-relaxed">
//                 This is a{" "}
//                 <a
//                   href="https://nownownow.com/about"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-amber-600 underline underline-offset-2 hover:text-amber-800 font-medium"
//                 >
//                   /now page
//                 </a>{" "}
//                 — a concept pioneered by{" "}
//                 <a
//                   href="https://sive.rs/now"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-amber-600 underline underline-offset-2 hover:text-amber-800 font-medium"
//                 >
//                   Derek Sivers
//                 </a>
//                 . It&apos;s an honest snapshot of what&apos;s happening in my life right
//                 now — not a curated PR exercise. If you have one,{" "}
//                 <a
//                   href="https://nownownow.com"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-amber-600 underline underline-offset-2 hover:text-amber-800 font-medium"
//                 >
//                   add it to nownownow.com
//                 </a>
//                 .
//               </p>
//             </div>
//           </FadeIn>

//           {/* ── NAV FOOTER ────────────────────────────────────────────────── */}
//           <FadeIn>
//             <div className="flex flex-wrap gap-5 pt-8 border-t border-stone-100">
//               {[
//                 { href: "/blog",       label: "Read my writing" },
//                 { href: "/apps",       label: "See my apps" },
//                 { href: "/ask-isaac",  label: "Ask me anything" },
//                 { href: "/ideas",      label: "Ideas Lab" },
//                 { href: "/about",      label: "About me" },
//               ].map(({ href, label }) => (
//                 <Link
//                   key={href}
//                   href={href}
//                   className="group flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-900 transition-colors duration-200"
//                 >
//                   {label}
//                   <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
//                 </Link>
//               ))}
//             </div>
//           </FadeIn>
//         </div>
//       </div>
//     </>
//   );
// }