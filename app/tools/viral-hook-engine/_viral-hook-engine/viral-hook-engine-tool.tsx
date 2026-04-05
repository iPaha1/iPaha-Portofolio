"use client";

// =============================================================================
// isaacpaha.com — Viral Hook Engine — Core Tool
// app/tools/viral-hook-engine/_viral-hook/viral-hook-tool.tsx
// =============================================================================

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence }      from "framer-motion";
import {
  Sparkles, Loader2, AlertCircle, X, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, TrendingUp, Zap, Target, Image,
  FileText, Lightbulb, BarChart2, Clock, Star, Save,
  AlertTriangle, BookOpen, Send, ArrowRight, Plus, Flame,
  MessageSquare, Eye, MousePointer, Share2, Hash,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenGateInfo { required: number; balance: number; toolName: string | null; }

export interface ViralHookToolProps {
  isSignedIn?:           boolean;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
  reopenQuery?:          { resultJson: string; idea: string; platform: string } | null;
  onReopened?:           () => void;
}

interface Hook {
  id:                    number;
  hook:                  string;
  type:                  string;
  typeName:              string;
  psychologicalTrigger:  string;
  score:                 number;
  platformFit:           string;
  whyItWorks:            string;
  warning?:              string;
}

interface ViralResult {
  originalIdea:      string;
  conceptStrength:   string;
  viralityScore:     number;
  viralityTier:      string;
  viralityBreakdown: {
    hookStrength:    number;
    emotionalPull:   number;
    shareability:    number;
    platformFit:     number;
    reasoning:       string;
  };
  hooks:             Hook[];
  thumbnailConcepts: {
    id:             number;
    concept:        string;
    textOverlay:    string;
    whyItWorks:     string;
    emotionToConvey:string;
    colourStrategy: string;
  }[];
  openingScript: {
    firstLine:      string;
    first30Seconds: string;
    retentionHook:  string;
    paceNotes:      string;
  };
  algorithmPackage: {
    bestTitle:          string;
    altTitles:          string[];
    descriptionHook:    string;
    tags:               string[];
    bestTimeToPost:     string;
    contentLength:      string;
  };
  competitorGap: {
    whatEveryoneElseIsDoing: string;
    yourAngle:               string;
    untappedKeywords:        string[];
  };
  contentSeries: {
    seriesPotential:  string;
    seriesIdea:       string;
    followUpVideos:   string[];
  };
  viralAmplifiers:  string[];
  creatorWarnings:  string[];
  verdict:          string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#f97316";

const PLATFORMS = [
  { id: "YOUTUBE",          label: "YouTube",     emoji: "▶️" },
  { id: "TIKTOK",           label: "TikTok",      emoji: "🎵" },
  { id: "INSTAGRAM_REELS",  label: "Reels",       emoji: "📸" },
  { id: "TWITTER_X",        label: "Twitter/X",   emoji: "𝕏"  },
  { id: "LINKEDIN",         label: "LinkedIn",    emoji: "💼" },
  { id: "PODCAST",          label: "Podcast",     emoji: "🎙️" },
  { id: "NEWSLETTER",       label: "Newsletter",  emoji: "📧" },
  { id: "BLOG",             label: "Blog",        emoji: "📝" },
];

const TIER_CFG: Record<string, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  SLEEPER:   { label: "Sleeper",   color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db", emoji: "😴" },
  DECENT:    { label: "Decent",    color: "#3b82f6", bg: "#dbeafe", border: "#93c5fd", emoji: "👍" },
  STRONG:    { label: "Strong",    color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d", emoji: "🔥" },
  HOT:       { label: "Hot",       color: "#f97316", bg: "#ffedd5", border: "#fdba74", emoji: "🚀" },
  EXPLOSIVE: { label: "Explosive", color: "#ef4444", bg: "#fee2e2", border: "#fca5a5", emoji: "💥" },
};

const HOOK_TYPE_COLORS: Record<string, string> = {
  CURIOSITY_GAP:  "#8b5cf6",
  CONTROVERSIAL:  "#ef4444",
  NUMBERS_DATA:   "#3b82f6",
  PERSONAL_STORY: "#f97316",
  FEAR_FOMO:      "#dc2626",
  SHOCK_SURPRISE: "#f59e0b",
  HOW_TO:         "#10b981",
  LISTICLE:       "#6366f1",
  CHALLENGE:      "#ec4899",
  TRANSFORMATION: "#14b8a6",
};

const EXAMPLE_IDEAS = [
  "I tried waking up at 4am for 30 days",
  "Why most people fail at saving money (and how I fixed it)",
  "I quit my £80k job to do this",
  "The Excel trick my boss didn't want me to know",
  "Stop doing this when networking — it's killing your chances",
  "I ate only £5 a day for a week — here's what happened",
];

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, color = ACCENT, size = "md" }: { score: number; color?: string; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div className={`w-full bg-stone-100 rounded-full overflow-hidden ${h}`}>
      <motion.div className={`h-full rounded-full`} style={{ backgroundColor: color }}
        initial={{ width: 0 }} animate={{ width: `${Math.min(100, score)}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

// ─── Virality Score Ring ──────────────────────────────────────────────────────

function ViralityRing({ score, tier }: { score: number; tier: string }) {
  const cfg  = TIER_CFG[tier] ?? TIER_CFG.DECENT;
  const size = 120;
  const r    = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cfg.color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black leading-none" style={{ color: cfg.color }}>{score}</span>
        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">/ 100</span>
        <span className="text-lg mt-0.5">{cfg.emoji}</span>
      </div>
    </div>
  );
}

// ─── Hook Card ────────────────────────────────────────────────────────────────

function HookCard({
  hook, rank, onCopy, onSave, isSaved,
}: {
  hook:    Hook;
  rank:    number;
  onCopy:  (text: string) => void;
  onSave:  (hook: Hook) => void;
  isSaved: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const typeColor = HOOK_TYPE_COLORS[hook.type] ?? "#6b7280";

  const copy = () => {
    onCopy(hook.hook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = hook.score >= 80 ? "#10b981" : hook.score >= 60 ? "#f59e0b" : "#6b7280";

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ backgroundColor: typeColor }}>
            {rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-sm"
                style={{ color: typeColor, backgroundColor: `${typeColor}15` }}>
                {hook.typeName}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black" style={{ color: scoreColor }}>{hook.score}</span>
                <div className="w-16">
                  <ScoreBar score={hook.score} color={scoreColor} size="sm" />
                </div>
              </div>
            </div>
            <p className="text-sm font-bold text-stone-900 leading-snug">{hook.hook}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={copy}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-all ${
              copied ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-500 border-stone-200 hover:border-stone-400"
            }`}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={() => onSave(hook)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-all ${
              isSaved ? "text-amber-600 border-amber-300 bg-amber-50" : "text-stone-400 border-stone-200 hover:border-amber-300"
            }`}>
            <Star className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </button>
          <button onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 ml-auto transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? "Less" : "Why it works"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 space-y-3 bg-stone-50/40">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">🧠 Psychological Trigger</p>
                <p className="text-xs text-stone-700 leading-relaxed">{hook.psychologicalTrigger}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Why It Makes People Click</p>
                <p className="text-xs text-stone-700 leading-relaxed">{hook.whyItWorks}</p>
              </div>
              {hook.platformFit && (
                <div className="bg-orange-50 border border-orange-100 rounded-sm px-3 py-2">
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider mb-0.5">Platform Fit</p>
                  <p className="text-xs text-orange-800 leading-relaxed">{hook.platformFit}</p>
                </div>
              )}
              {hook.warning && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-sm px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{hook.warning}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function ViralHookTool({ isSignedIn = false, onInsufficientTokens, reopenQuery, onReopened }: ViralHookToolProps) {
  const [stage,        setStage]        = useState<"input" | "loading" | "results">("input");
  const [result,       setResult]       = useState<ViralResult | null>(null);
  const [error,        setError]        = useState("");
  const [loadStep,     setLoadStep]     = useState(0);

  // Input
  const [idea,         setIdea]         = useState("");
  const [platform,     setPlatform]     = useState("YOUTUBE");
  const [niche,        setNiche]        = useState("");
  const [audience,     setAudience]     = useState("");
  const [format,       setFormat]       = useState("");

  // Results UI
  const [activeTab,    setActiveTab]    = useState<"hooks" | "thumbnail" | "script" | "algorithm" | "ideas">("hooks");
  const [savedHooks,   setSavedHooks]   = useState<Set<number>>(new Set());
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [queryId,      setQueryId]      = useState<string | null>(null);
  const [copiedGlobal, setCopiedGlobal] = useState("");

  // ── Reopen a saved query from dashboard ──────────────────────────────
  useEffect(() => {
    if (!reopenQuery) return;
    
    // Parse the result JSON
    try {
      const parsedResult = JSON.parse(reopenQuery.resultJson) as ViralResult;
      setResult(parsedResult);
      setIdea(reopenQuery.idea);
      setPlatform(reopenQuery.platform);
      setStage("results");
      setActiveTab("hooks");
      onReopened?.();
    } catch (err) {
      console.error("Failed to parse saved result:", err);
    }
  }, [reopenQuery]);

  const LOAD_STEPS = [
    "Reading your content idea…",
    "Analysing psychological triggers…",
    "Scoring virality potential…",
    "Rewriting 10 hook variations…",
    "Building thumbnail concepts…",
    "Crafting your retention script…",
    "Packaging algorithm metadata…",
  ];

  const handleAnalyse = async () => {
    if (!idea.trim()) return;
    setStage("loading"); setError(""); setLoadStep(0); setResult(null); setQueryId(null);
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 1200);

    try {
      const res = await fetch("/api/tools/viral-hook-engine/analyse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, platform, niche, targetAudience: audience, contentFormat: format, mode: "full" }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Viral Hook Engine" });
        clearInterval(interval); setStage("input");
        setError("You're out of tokens. Play some games to earn more, then try again.");
        return;
      }
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.result) { setError(data.error ?? "Analysis failed — please try again."); setStage("input"); return; }
      setResult(data.result);
      setActiveTab("hooks");
      setStage("results");
    } catch { clearInterval(interval); setError("Network error — please try again."); setStage("input"); }
  };

  const handleSaveResult = async () => {
    if (!isSignedIn || !result) return;
    setSaving(true);
    const res  = await fetch("/api/tools/viral-hook-engine/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, platform, niche, targetAudience: audience, contentFormat: format, result }),
    });
    const data = await res.json();
    if (data.ok) { setSaved(true); setQueryId(data.queryId ?? null); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  const saveHook = async (hook: Hook) => {
    setSavedHooks(p => new Set([...p, hook.id]));
    if (!isSignedIn) return;
    await fetch("/api/tools/viral-hook-engine/save?type=hook", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hook }),
    }).catch(() => {});
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGlobal(text);
    setTimeout(() => setCopiedGlobal(""), 2000);
  };

  // ── INPUT ──────────────────────────────────────────────────────────────────
  if (stage === "input") return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Platform selector */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Platform</label>
        <div className="grid grid-cols-4 gap-1.5">
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatform(p.id)}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-sm border text-center transition-all ${
                platform === p.id ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
              }`}
              style={platform === p.id ? { backgroundColor: ACCENT } : {}}>
              <span className="text-base">{p.emoji}</span>
              <span className={`text-[10px] font-bold ${platform === p.id ? "text-white" : "text-stone-600"}`}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main idea input */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
          Your Content Idea *
        </label>
        <textarea value={idea} onChange={e => setIdea(e.target.value)}
          onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleAnalyse()}
          rows={4}
          placeholder={`What's your video/post idea?\n\nExamples:\n• I tried waking up at 4am for 30 days\n• Why most people fail at saving money\n• The Excel trick my boss didn't want me to know`}
          className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-orange-400 focus:bg-white transition-all resize-none"
        />
        {/* Quick examples */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {EXAMPLE_IDEAS.slice(0, 4).map(ex => (
            <button key={ex} onClick={() => setIdea(ex)}
              className="text-xs text-stone-500 bg-stone-50 border border-stone-200 hover:border-orange-400 hover:text-orange-600 px-2.5 py-1 rounded-sm transition-colors line-clamp-1 max-w-[180px] truncate">
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Optional context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
            Your Niche <span className="text-stone-300 font-normal">optional</span>
          </label>
          <input value={niche} onChange={e => setNiche(e.target.value)}
            placeholder="e.g. Personal Finance, Tech, Fitness"
            className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
            Target Audience <span className="text-stone-300 font-normal">optional</span>
          </label>
          <input value={audience} onChange={e => setAudience(e.target.value)}
            placeholder="e.g. 25-35 yr old professionals"
            className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
            Format <span className="text-stone-300 font-normal">optional</span>
          </label>
          <input value={format} onChange={e => setFormat(e.target.value)}
            placeholder="e.g. 10-min tutorial, vlog, talking head"
            className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-orange-400"
          />
        </div>
      </div>

      <button onClick={handleAnalyse} disabled={!idea.trim()}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white py-4 rounded-sm transition-colors shadow-sm disabled:opacity-40"
        style={{ backgroundColor: ACCENT }}>
        <Flame className="w-5 h-5" />Analyse My Content
      </button>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (stage === "loading") return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🔥</div>
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="text-sm font-semibold text-stone-600">{LOAD_STEPS[loadStep]}</motion.p>
        </AnimatePresence>
        <p className="text-xs text-stone-400 mt-1">Running a full viral analysis…</p>
      </div>
      <div className="flex gap-1.5">
        {LOAD_STEPS.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-orange-400" : "bg-stone-200"}`} />
        ))}
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (!result) return null;

  const tier = TIER_CFG[result.viralityTier] ?? TIER_CFG.DECENT;
  const bd   = result.viralityBreakdown;

  const TABS = [
    { id: "hooks",     label: `Hooks (${result.hooks?.length ?? 0})`, icon: Zap          },
    { id: "thumbnail", label: "Thumbnail",                             icon: Image        },
    { id: "script",    label: "Opening Script",                        icon: FileText     },
    { id: "algorithm", label: "Algorithm",                             icon: BarChart2    },
    { id: "ideas",     label: "Series & Ideas",                        icon: Lightbulb    },
  ] as const;

  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* ── Results header ──────────────────────────────────────────────── */}
      <div className="bg-stone-900 text-white rounded-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-5">
            <ViralityRing score={result.viralityScore} tier={result.viralityTier} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-black px-3 py-1 rounded-sm"
                  style={{ color: tier.color, backgroundColor: `${tier.color}20`, border: `1px solid ${tier.color}40` }}>
                  {tier.emoji} {tier.label}
                </span>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-wider">Viral Potential</span>
              </div>
              <p className="text-sm text-white/75 leading-relaxed mb-3">{result.conceptStrength}</p>
              {/* Score breakdown */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  { label: "Hook Strength",   value: bd?.hookStrength   ?? 0 },
                  { label: "Emotional Pull",  value: bd?.emotionalPull  ?? 0 },
                  { label: "Shareability",    value: bd?.shareability   ?? 0 },
                  { label: "Platform Fit",    value: bd?.platformFit    ?? 0 },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-white/50">{s.label}</span>
                      <span className="text-[10px] font-bold text-white/70">{s.value}/25</span>
                    </div>
                    <ScoreBar score={(s.value / 25) * 100} color={ACCENT} size="sm" />
                  </div>
                ))}
              </div>
              {bd?.reasoning && <p className="text-xs text-white/50 mt-3 leading-relaxed">{bd.reasoning}</p>}
            </div>
          </div>
        </div>

        {/* Action strip */}
        <div className="flex items-center gap-2 px-6 pb-4 flex-wrap">
          {isSignedIn && (
            <button onClick={handleSaveResult} disabled={saving || saved}
              className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                saved ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
                : "text-white/50 hover:text-white border-white/15 hover:border-white/30"
              }`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : saved ? "Saved!" : "Save Analysis"}
            </button>
          )}
          <button onClick={() => { setStage("input"); setResult(null); setSavedHooks(new Set()); }}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
            <RefreshCw className="w-3 h-3" />New Analysis
          </button>
        </div>
      </div>

      {/* Verdict banner */}
      <div className="rounded-sm px-5 py-4" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
        <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>🔥 Verdict</p>
        <p className="text-sm font-semibold text-stone-800 leading-relaxed">{result.verdict}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-orange-500 text-orange-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── HOOKS tab ───────────────────────────────────────────────────── */}
      {activeTab === "hooks" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
              {result.hooks?.length} Hook Variations — Ranked by Viral Potential
            </p>
            <p className="text-[10px] text-stone-400">Click any hook to see the psychology behind it</p>
          </div>
          {result.hooks?.map((hook, i) => (
            <HookCard
              key={hook.id}
              hook={hook}
              rank={i + 1}
              onCopy={copyToClipboard}
              onSave={saveHook}
              isSaved={savedHooks.has(hook.id)}
            />
          ))}
        </div>
      )}

      {/* ── THUMBNAIL tab ───────────────────────────────────────────────── */}
      {activeTab === "thumbnail" && (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">3 Thumbnail Concepts</p>
          {result.thumbnailConcepts?.map((t, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-sm text-white text-xs font-black flex items-center justify-center"
                        style={{ backgroundColor: ACCENT }}>{i + 1}</div>
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Concept {i + 1}</span>
                    </div>
                    <div className="inline-block bg-stone-900 text-white text-sm font-black px-4 py-2 rounded-sm">
                      {t.textOverlay}
                    </div>
                  </div>
                  <span className="text-xs font-semibold capitalize text-stone-500 bg-stone-50 border border-stone-200 px-2 py-1 rounded-sm flex-shrink-0">
                    {t.emotionToConvey}
                  </span>
                </div>
                <p className="text-sm text-stone-700 leading-relaxed mb-3">{t.concept}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-stone-50 rounded-sm px-3 py-2.5">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Colour Strategy</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{t.colourStrategy}</p>
                  </div>
                  <div className="rounded-sm px-3 py-2.5" style={{ backgroundColor: `${ACCENT}06` }}>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Why It Gets Clicked</p>
                    <p className="text-xs text-stone-700 leading-relaxed">{t.whyItWorks}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SCRIPT tab ──────────────────────────────────────────────────── */}
      {activeTab === "script" && result.openingScript && (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Opening Retention Script</p>
          {/* First line */}
          <div className="bg-stone-900 text-white rounded-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-2">🎯 Your First Line</p>
            <p className="text-xl font-black leading-snug text-orange-300">"{result.openingScript.firstLine}"</p>
            <button onClick={() => copyToClipboard(result.openingScript.firstLine)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white mt-3 transition-colors">
              <Copy className="w-3.5 h-3.5" />Copy
            </button>
          </div>
          {/* First 30 seconds */}
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">⏱ First 30 Seconds</p>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{result.openingScript.first30Seconds}</p>
          </div>
          {/* Retention hook */}
          <div className="flex items-start gap-3 rounded-sm px-4 py-4"
            style={{ backgroundColor: `${ACCENT}06`, border: `1px solid ${ACCENT}25` }}>
            <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Retention Hook to Plant</p>
              <p className="text-sm text-stone-700 leading-relaxed">{result.openingScript.retentionHook}</p>
            </div>
          </div>
          {/* Pace notes */}
          <div className="bg-stone-50 border border-stone-100 rounded-sm p-4">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Delivery Notes</p>
            <p className="text-xs text-stone-600 leading-relaxed">{result.openingScript.paceNotes}</p>
          </div>
        </div>
      )}

      {/* ── ALGORITHM tab ───────────────────────────────────────────────── */}
      {activeTab === "algorithm" && result.algorithmPackage && (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Algorithm Optimisation Package</p>
          {/* Best title */}
          <div className="bg-stone-900 text-white rounded-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-2">🏆 Best Title</p>
            <p className="text-lg font-black text-orange-300 leading-snug mb-3">{result.algorithmPackage.bestTitle}</p>
            {result.algorithmPackage.altTitles?.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Alt Titles</p>
                {result.algorithmPackage.altTitles.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                    <p className="text-sm text-white/70">{t}</p>
                    <button onClick={() => copyToClipboard(t)} className="text-white/30 hover:text-white transition-colors ml-3">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Description hook */}
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">📝 Description Opening</p>
            <p className="text-sm text-stone-700 leading-relaxed italic">"{result.algorithmPackage.descriptionHook}"</p>
          </div>
          {/* Tags */}
          {result.algorithmPackage.tags?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
                <Hash className="w-3.5 h-3.5 inline mr-1" />Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {result.algorithmPackage.tags.map((tag, i) => (
                  <span key={i} className="text-xs font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1.5 rounded-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Timing + length */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 inline mr-1" />Best Time to Post
              </p>
              <p className="text-sm font-semibold text-stone-800">{result.algorithmPackage.bestTimeToPost}</p>
            </div>
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">
                <BarChart2 className="w-3.5 h-3.5 inline mr-1" />Optimal Length
              </p>
              <p className="text-sm font-semibold text-stone-800">{result.algorithmPackage.contentLength}</p>
            </div>
          </div>
          {/* Competitor gap */}
          {result.competitorGap && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">🔍 Competitor Gap Analysis</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-sm p-4">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1">Everyone Else Is Doing</p>
                  <p className="text-xs text-red-800 leading-relaxed">{result.competitorGap.whatEveryoneElseIsDoing}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-4">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Your Differentiated Angle</p>
                  <p className="text-xs text-emerald-800 leading-relaxed font-semibold">{result.competitorGap.yourAngle}</p>
                </div>
              </div>
              {result.competitorGap.untappedKeywords?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.competitorGap.untappedKeywords.map((kw, i) => (
                    <span key={i} className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-sm">
                      💡 {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Viral amplifiers */}
          {result.viralAmplifiers?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">⚡ Viral Amplifiers</p>
              {result.viralAmplifiers.map((amp, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-700 mb-2">
                  <Zap className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />{amp}
                </div>
              ))}
            </div>
          )}
          {/* Creator warnings */}
          {result.creatorWarnings?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">⚠️ Watch Out For</p>
              {result.creatorWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-600">{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SERIES & IDEAS tab ──────────────────────────────────────────── */}
      {activeTab === "ideas" && result.contentSeries && (
        <div className="space-y-4">
          {/* Series potential */}
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Series Potential</p>
              <span className={`text-xs font-black px-2 py-1 rounded-sm ${
                result.contentSeries.seriesPotential === "HIGH" ? "bg-emerald-100 text-emerald-700" :
                result.contentSeries.seriesPotential === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"
              }`}>
                {result.contentSeries.seriesPotential}
              </span>
            </div>
            {result.contentSeries.seriesIdea && (
              <div className="rounded-sm px-4 py-3 mb-3" style={{ backgroundColor: `${ACCENT}06`, borderLeft: `3px solid ${ACCENT}` }}>
                <p className="text-sm text-stone-800 font-semibold leading-relaxed">{result.contentSeries.seriesIdea}</p>
              </div>
            )}
          </div>
          {/* Follow-up videos */}
          {result.contentSeries.followUpVideos?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Follow-Up Content Ideas</p>
              <div className="space-y-2">
                {result.contentSeries.followUpVideos.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3 hover:border-stone-200 transition-colors">
                    <div className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>{i + 1}</div>
                    <p className="text-sm text-stone-700 flex-1">{v}</p>
                    <button onClick={() => { setStage("input"); setIdea(v); setResult(null); setSavedHooks(new Set()); }}
                      className="text-xs font-bold text-stone-400 hover:text-orange-600 flex items-center gap-1 transition-colors flex-shrink-0">
                      Analyse <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}