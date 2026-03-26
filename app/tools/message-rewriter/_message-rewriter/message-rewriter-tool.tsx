"use client";

// =============================================================================
// isaacpaha.com — Message Rewriter Tool
// app/tools/message-rewriter/_components/message-rewriter-tool.tsx
//
// "Say it better, instantly."
// Features:
//   - Smart context detection
//   - 11 tones with instant preview
//   - 2-3 variations per rewrite
//   - Platform presets (Email, Slack, LinkedIn, Text, WhatsApp)
//   - Intent modes (Shorten, Expand, Less Aggressive, Clearer, Soften)
//   - Before/After shareable card
//   - One-click copy
//   - Keyboard shortcut (Cmd+Enter)
// =============================================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence }                          from "framer-motion";
import {
  Copy, Check, RefreshCw, ArrowRight, Sparkles, Loader2,
  MessageSquare, Mail, Linkedin, Smartphone, Zap, ChevronDown,
  ChevronUp, Info, Share2, X, CornerDownLeft, Scissors,
  Expand, TrendingUp, Wind, Lightbulb, AlertCircle,
  Volume2, Briefcase, Heart, Shield, Target, Star,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rewrite {
  label: string;
  text:  string;
}

interface DetectedContext {
  type:                string;
  recommendedTone:     string;
  recommendedToneLabel:string;
  reason:              string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TONES = [
  { id: "professional", label: "Professional",  emoji: "💼", desc: "Polished & business-ready"    },
  { id: "polite",       label: "Polite",         emoji: "🤝", desc: "Considerate & tactful"        },
  { id: "confident",    label: "Confident",      emoji: "⚡", desc: "Bold & self-assured"          },
  { id: "direct",       label: "Direct",         emoji: "🎯", desc: "Straight to the point"        },
  { id: "friendly",     label: "Friendly",       emoji: "😊", desc: "Warm & approachable"          },
  { id: "persuasive",   label: "Persuasive",     emoji: "🔥", desc: "Compelling & convincing"      },
  { id: "empathetic",   label: "Empathetic",     emoji: "❤️", desc: "Understanding & caring"       },
  { id: "assertive",    label: "Assertive",      emoji: "✊", desc: "Firm & boundary-setting"      },
  { id: "formal",       label: "Formal",         emoji: "📋", desc: "Official & proper"            },
  { id: "casual",       label: "Casual",         emoji: "💬", desc: "Relaxed & conversational"     },
  { id: "diplomatic",   label: "Diplomatic",     emoji: "🕊️", desc: "Tactful & friction-free"     },
  { id: "soften",       label: "Softer",         emoji: "🌸", desc: "Gentler without losing meaning"},
] as const;

type ToneId = typeof TONES[number]["id"];

const PLATFORMS = [
  { id: "general",  label: "General",   icon: MessageSquare },
  { id: "email",    label: "Email",     icon: Mail          },
  { id: "slack",    label: "Slack",     icon: MessageSquare },
  { id: "linkedin", label: "LinkedIn",  icon: Linkedin      },
  { id: "text",     label: "Text",      icon: Smartphone    },
  { id: "whatsapp", label: "WhatsApp",  icon: MessageSquare },
] as const;

const INTENT_MODES = [
  { id: "",               label: "Standard",       icon: Sparkles,  desc: "Best rewrite for the tone"        },
  { id: "shorten",        label: "Shorten",        icon: Scissors,  desc: "Say it in fewer words"             },
  { id: "expand",         label: "Expand",         icon: Expand,    desc: "Add more context and depth"        },
  { id: "persuasive",     label: "Persuasive",     icon: TrendingUp,desc: "Make it more convincing"           },
  { id: "aggressive_less",label: "Less Aggressive",icon: Wind,      desc: "Soften the tone, not the message"  },
  { id: "clearer",        label: "Clearer",        icon: Target,    desc: "Remove any ambiguity"              },
  { id: "soften",         label: "Soften",         icon: Heart,     desc: "Deliver hard news gently"          },
] as const;

const CONTEXT_COLORS: Record<string, string> = {
  Work:        "#3b82f6",
  Casual:      "#10b981",
  Complaint:   "#ef4444",
  Request:     "#f59e0b",
  Apology:     "#8b5cf6",
  Feedback:    "#0ea5e9",
  Negotiation: "#f97316",
  Other:       "#6b7280",
};

const PLACEHOLDERS = [
  "Hey, just wanted to follow up on the email I sent last week...",
  "I don't think the feedback you gave was fair and honestly...",
  "Can we maybe possibly push the deadline if that's not too much...",
  "Sorry to bother you again but I was wondering if you could...",
  "I'm not sure if this is the right place to say this but...",
  "Just checking in again — haven't heard back so thought I'd...",
];

// ─── Rewrite Card ─────────────────────────────────────────────────────────────

function RewriteCard({
  rewrite, index, original, onCopy, isSelected, onSelect,
}: {
  rewrite:    Rewrite;
  index:      number;
  original:   string;
  onCopy:     (text: string) => void;
  isSelected: boolean;
  onSelect:   () => void;
}) {
  const [copied,       setCopied]       = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleCopy = () => {
    onCopy(rewrite.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onSelect}
      className={`relative rounded-xs border transition-all cursor-pointer group ${
        isSelected
          ? "border-rose-300 bg-rose-50/30 shadow-sm"
          : "border-stone-100 bg-white hover:border-rose-200 hover:bg-rose-50/10"
      }`}
    >
      {/* Variation badge */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-wider uppercase text-stone-400">
            Option {index + 1}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
            isSelected ? "bg-rose-100 text-rose-700" : "bg-stone-100 text-stone-500"
          }`}>
            {rewrite.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Before/after toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowOriginal(p => !p); }}
            className="text-[10px] text-stone-300 hover:text-stone-600 border border-stone-100 hover:border-stone-300 px-2 py-1 rounded-sm transition-colors"
          >
            {showOriginal ? "After" : "Before/After"}
          </button>
          {/* Copy */}
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm transition-all ${
              copied
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-stone-50 text-stone-500 border border-stone-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Message text */}
      <div className="px-5 pb-5">
        <AnimatePresence mode="wait">
          {showOriginal ? (
            <motion.div key="before-after"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-3">
              <div className="bg-stone-100 rounded-xs p-3">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Before</p>
                <p className="text-xs text-stone-500 leading-relaxed line-through decoration-stone-300">{original}</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xs p-3">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mb-1.5">After</p>
                <p className="text-xs text-stone-800 leading-relaxed">{rewrite.text}</p>
              </div>
            </motion.div>
          ) : (
            <motion.p key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
              {rewrite.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-1 h-full bg-rose-400 rounded-l-xs" />
      )}
    </motion.div>
  );
}

// ─── MAIN TOOL ────────────────────────────────────────────────────────────────

export function MessageRewriterTool() {
  const [message,         setMessage]         = useState("");
  const [activeTone,      setActiveTone]       = useState<ToneId>("professional");
  const [activePlatform,  setActivePlatform]   = useState<string>("general");
  const [activeMode,      setActiveMode]       = useState<string>("");
  const [variations,      setVariations]       = useState<number>(2);
  const [loading,         setLoading]          = useState(false);
  const [rewrites,        setRewrites]         = useState<Rewrite[]>([]);
  const [detectedCtx,     setDetectedCtx]      = useState<DetectedContext | null>(null);
  const [error,           setError]            = useState("");
  const [selectedIdx,     setSelectedIdx]      = useState<number>(0);
  const [copiedMain,      setCopiedMain]       = useState(false);
  const [placeholderIdx,  setPlaceholderIdx]   = useState(0);
  const [charCount,       setCharCount]        = useState(0);
  const [tonesExpanded,   setTonesExpanded]    = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef  = useRef<HTMLDivElement>(null);

  // Rotate placeholder
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(p => (p + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setCharCount(message.length); }, [message]);

  // Cmd/Ctrl+Enter shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && message.trim()) {
        e.preventDefault();
        handleRewrite();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [message, activeTone, activePlatform, activeMode, variations]);

  const handleRewrite = useCallback(async () => {
    if (!message.trim()) return;
    setLoading(true); setError(""); setRewrites([]); setDetectedCtx(null);
    try {
      const res  = await fetch("/api/tools/message-rewriter/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:  message.trim(),
          tone:     activeTone,
          platform: activePlatform,
          mode:     activeMode,
          count:    variations,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Rewrite failed"); setLoading(false); return; }
      setRewrites(data.rewrites ?? []);
      setDetectedCtx(data.detectedContext ?? null);
      setSelectedIdx(0);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch { setError("Network error — please check your connection and try again."); }
    setLoading(false);
  }, [message, activeTone, activePlatform, activeMode, variations]);

  const handleCopySelected = () => {
    if (rewrites[selectedIdx]) {
      navigator.clipboard.writeText(rewrites[selectedIdx].text);
      setCopiedMain(true);
      setTimeout(() => setCopiedMain(false), 2000);
    }
  };

  const VISIBLE_TONES = tonesExpanded ? TONES : TONES.slice(0, 6);

  return (
    <div className="space-y-0" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* ── Input panel ─────────────────────────────────────────────────── */}
      <div className="space-y-5">

        {/* Message textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
              Your message
            </label>
            <span className={`text-[10px] font-semibold transition-colors ${charCount > 2500 ? "text-red-500" : charCount > 1500 ? "text-amber-500" : "text-stone-300"}`}>
              {charCount}/3000
            </span>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              rows={5}
              maxLength={3000}
              className="w-full px-4 py-3.5 text-sm text-stone-800 placeholder-stone-300 bg-white border border-stone-200 rounded-xs resize-none focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all leading-relaxed"
            />
            {message && (
              <button onClick={() => setMessage("")}
                className="absolute top-3 right-3 text-stone-300 hover:text-stone-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-stone-300">
              <kbd className="font-mono bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded text-[10px]">⌘</kbd> + <kbd className="font-mono bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded text-[10px]">↵</kbd> to rewrite
            </p>
            {/* Quick paste examples */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-300">Try:</span>
              {["Work email", "Apology text", "Rejection"].map((label) => (
                <button key={label} onClick={() => {
                  const examples: Record<string, string> = {
                    "Work email":   "Just wanted to follow up on my previous email from last week, I know you're probably busy but I was just wondering if you had a chance to look at my proposal yet?",
                    "Apology text": "Hey I'm sorry about what happened, I didn't mean to make you feel that way, I guess I just wasn't thinking clearly at the time.",
                    "Rejection":    "I don't think this is going to work out between us, it's not really what I'm looking for right now and I hope you understand.",
                  };
                  setMessage(examples[label]);
                }}
                  className="text-[10px] font-semibold text-stone-400 hover:text-rose-500 transition-colors border border-stone-100 hover:border-rose-200 px-2 py-0.5 rounded-sm">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Platform row */}
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Platform</label>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActivePlatform(id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xs border transition-all ${
                  activePlatform === id
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Tone</label>
            <button onClick={() => setTonesExpanded(p => !p)}
              className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-700 transition-colors">
              {tonesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {tonesExpanded ? "Less" : `All ${TONES.length} tones`}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <AnimatePresence>
              {VISIBLE_TONES.map(({ id, label, emoji, desc }) => (
                <motion.button key={id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setActiveTone(id as ToneId)}
                  className={`flex items-start gap-2.5 text-left px-3 py-2.5 rounded-xs border transition-all ${
                    activeTone === id
                      ? "border-rose-400 bg-rose-50 shadow-sm"
                      : "border-stone-100 bg-white hover:border-rose-200 hover:bg-rose-50/40"
                  }`}>
                  <span className="text-base flex-shrink-0 mt-0.5">{emoji}</span>
                  <div>
                    <p className={`text-xs font-bold leading-none ${activeTone === id ? "text-rose-700" : "text-stone-700"}`}>
                      {label}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">{desc}</p>
                  </div>
                  {activeTone === id && (
                    <div className="ml-auto flex-shrink-0 w-3 h-3 rounded-full bg-rose-400 mt-0.5" />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Intent mode row */}
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
            Special mode <span className="font-normal normal-case text-stone-300">(optional — adds an extra instruction on top of the tone)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {INTENT_MODES.map(({ id, label, icon: Icon, desc }) => (
              <button key={id} onClick={() => setActiveMode(id)}
                title={desc}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xs border transition-all ${
                  activeMode === id
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Variations + Rewrite button */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Variation count */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Variations:</span>
            {[2, 3].map((n) => (
              <button key={n} onClick={() => setVariations(n)}
                className={`w-8 h-8 text-xs font-bold rounded-xs border transition-all ${
                  variations === n
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-400 border-stone-200 hover:border-stone-400"
                }`}>
                {n}
              </button>
            ))}
          </div>

          <button
            onClick={handleRewrite}
            disabled={!message.trim() || loading}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-bold px-8 py-3 rounded-xs transition-all shadow-sm ${
              message.trim() && !loading
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-stone-100 text-stone-300 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Rewriting…</>
            ) : (
              <><Sparkles className="w-4 h-4" />Rewrite Message</>
            )}
          </button>

          {rewrites.length > 0 && (
            <button onClick={() => { setRewrites([]); setDetectedCtx(null); setError(""); }}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-4 py-3 rounded-xs transition-all">
              <RefreshCw className="w-3.5 h-3.5" />Reset
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xs px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError("")} className="ml-auto text-red-300 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Results panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(rewrites.length > 0 || loading) && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 space-y-5"
          >
            {/* Context detection banner */}
            {detectedCtx && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 bg-stone-50 border border-stone-100 rounded-xs px-4 py-3.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${CONTEXT_COLORS[detectedCtx.type] ?? "#6b7280"}15` }}>
                  <span className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CONTEXT_COLORS[detectedCtx.type] ?? "#6b7280", display: "block" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                      Detected context
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                      style={{ color: CONTEXT_COLORS[detectedCtx.type] ?? "#6b7280", backgroundColor: `${CONTEXT_COLORS[detectedCtx.type] ?? "#6b7280"}15` }}>
                      {detectedCtx.type}
                    </span>
                    {detectedCtx.recommendedTone !== activeTone && (
                      <>
                        <span className="text-[10px] text-stone-300">·</span>
                        <span className="text-[10px] text-stone-400">Suggested tone:</span>
                        <button onClick={() => setActiveTone(detectedCtx.recommendedTone as ToneId)}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline-offset-2 hover:underline transition-colors">
                          {detectedCtx.recommendedToneLabel} →
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{detectedCtx.reason}</p>
                </div>
              </motion.div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-stone-100 rounded-xs p-5 space-y-2 animate-pulse">
                    <div className="flex gap-2">
                      <div className="h-3 w-16 bg-stone-100 rounded" />
                      <div className="h-3 w-24 bg-stone-100 rounded" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-stone-50 rounded" />
                      <div className="h-3 w-4/5 bg-stone-50 rounded" />
                      <div className="h-3 w-3/5 bg-stone-50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rewrite cards */}
            {!loading && rewrites.length > 0 && (
              <>
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-stone-900">
                      {rewrites.length} rewritten versions
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-rose-50 text-rose-600">
                      {TONES.find(t => t.id === activeTone)?.emoji} {TONES.find(t => t.id === activeTone)?.label}
                    </span>
                    {activePlatform !== "general" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-stone-100 text-stone-500 capitalize">
                        {activePlatform}
                      </span>
                    )}
                  </div>
                  {/* Copy selected */}
                  <button onClick={handleCopySelected}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xs border transition-all ${
                      copiedMain
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                    }`}>
                    {copiedMain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedMain ? "Copied!" : "Copy selected"}
                  </button>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {rewrites.map((r, i) => (
                    <RewriteCard
                      key={i}
                      rewrite={r}
                      index={i}
                      original={message}
                      onCopy={(text) => navigator.clipboard.writeText(text)}
                      isSelected={selectedIdx === i}
                      onSelect={() => setSelectedIdx(i)}
                    />
                  ))}
                </div>

                {/* Try another tone prompt */}
                <div className="flex items-center justify-between bg-stone-50 border border-stone-100 rounded-xs px-5 py-4">
                  <div>
                    <p className="text-xs font-bold text-stone-700">Not quite right?</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Try a different tone or mode — each gives a very different result.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {TONES.filter(t => t.id !== activeTone).slice(0, 3).map(t => (
                      <button key={t.id}
                        onClick={() => { setActiveTone(t.id as ToneId); handleRewrite(); }}
                        className="text-xs font-semibold text-stone-500 border border-stone-200 hover:border-rose-300 hover:text-rose-600 px-3 py-1.5 rounded-xs transition-colors">
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}