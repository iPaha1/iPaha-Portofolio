"use client";

// =============================================================================
// isaacpaha.com — Content Studio AI — Core Tool
// app/tools/content-studio/_content-studio/content-studio-tool.tsx
// =============================================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence }               from "framer-motion";
import {
  Sparkles, Loader2, AlertCircle, X, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, Save, Download, FileText, Video,
  Image, Hash, Twitter, Linkedin, Mail, BookOpen, Zap,
  ArrowRight, Play, Mic, Clock, Type, Layers, RotateCcw,
  Star, AlertTriangle, Camera, Share2, PenTool, Film,
  MessageSquare, BarChart2, Globe, Edit3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenGateInfo { required: number; balance: number; toolName: string | null; }
export interface ContentStudioToolProps {
  isSignedIn?:           boolean;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
  reopenProject?:        any | null;
  onReopened?:           () => void;
}

interface ScriptSection {
  id:            number;
  type:          string;
  title:         string;
  timestamp:     string | null;
  script:        string;
  bRollNotes:    string | null;
  directorNotes: string | null;
  hookDevice:    string | null;
}

interface FullResult {
  title:          string;
  altTitles?:     string[];
  hook: {
    openingLine:  string;
    hookType:     string;
    hookScript:   string;
    whyThisHook:  string;
  };
  contentBrief: {
    corePremise:       string;
    uniqueAngle:       string;
    keyTakeaway:       string;
    estimatedRuntime:  string;
    wordCount:         number;
  };
  script?: {
    sections:       ScriptSection[];
    fullScriptText:  string;
  } | string;
  promotionPackage: {
    youtubeDescription?: string;
    shortDescription?:   string;
    chapters?:           { timestamp: string; title: string }[];
    tags:                string[];
    promotionTweets:     string[];
    linkedinCaption?:    string;
    thumbnailBrief:      string;
  };
  repurposeIdeas: {
    format:    string;
    angle:     string;
    hookLine:  string;
  }[];
  engagementStrategy: {
    commentHook:     string;
    pollIdea:        string;
    communityPost:   string;
    bestTimeToPost:  string;
  };
  // Short-form / thread / blog / newsletter fields
  tweets?:           { number: number; text: string; note?: string }[];
  hookTweet?:        string;
  ctaTweet?:         string;
  article?:          string;
  emailBody?:        string;
  subjectLine?:      string;
  previewText?:      string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#8b5cf6";

const PLATFORMS = [
  { id: "YOUTUBE_LONG",    label: "YouTube",       sub: "Long-form",     emoji: "▶️",  group: "video"   },
  { id: "YOUTUBE_SHORT",   label: "YouTube",       sub: "Shorts",        emoji: "📱",  group: "video"   },
  { id: "TIKTOK",          label: "TikTok",        sub: "Video",         emoji: "🎵",  group: "video"   },
  { id: "INSTAGRAM_REELS", label: "Reels",         sub: "Instagram",     emoji: "📸",  group: "video"   },
  { id: "LINKEDIN_VIDEO",  label: "LinkedIn",      sub: "Video",         emoji: "💼",  group: "video"   },
  { id: "LINKEDIN_POST",   label: "LinkedIn",      sub: "Post",          emoji: "📝",  group: "written" },
  { id: "TWITTER_THREAD",  label: "Twitter/X",     sub: "Thread",        emoji: "𝕏",   group: "written" },
  { id: "PODCAST_EPISODE", label: "Podcast",       sub: "Episode",       emoji: "🎙️", group: "audio"   },
  { id: "BLOG_POST",       label: "Blog",          sub: "Article",       emoji: "📰",  group: "written" },
  { id: "NEWSLETTER",      label: "Newsletter",    sub: "Email",         emoji: "📧",  group: "written" },
];

const TONES = [
  { id: "EDUCATIONAL",    label: "Educational",    emoji: "🎓" },
  { id: "ENTERTAINING",   label: "Entertaining",   emoji: "🎭" },
  { id: "INSPIRATIONAL",  label: "Inspirational",  emoji: "✨" },
  { id: "CONTROVERSIAL",  label: "Controversial",  emoji: "🔥" },
  { id: "STORYTELLING",   label: "Storytelling",   emoji: "📖" },
  { id: "NEWS_COMMENTARY",label: "Commentary",     emoji: "📡" },
  { id: "TUTORIAL",       label: "Tutorial",       emoji: "🪜" },
  { id: "VLOG",           label: "Vlog / Personal",emoji: "🎥" },
];

const SECTION_TYPE_CFG: Record<string, { color: string; label: string }> = {
  HOOK:           { color: "#ef4444", label: "Hook"            },
  INTRO:          { color: "#f97316", label: "Intro"           },
  MAIN:           { color: "#8b5cf6", label: "Main Content"    },
  TRANSITION:     { color: "#6b7280", label: "Transition"      },
  RETENTION_HOOK: { color: "#f59e0b", label: "Retention Hook"  },
  OUTRO:          { color: "#3b82f6", label: "Outro"           },
  CTA:            { color: "#10b981", label: "Call to Action"  },
};

const EXAMPLE_TOPICS = [
  "I built a £0 budget and paid off £8k debt in 6 months",
  "Why I quit my 9-5 after 3 weeks — the honest story",
  "5 Python tricks every developer should know but doesn't",
  "The morning routine that actually works (backed by science)",
  "How I grew from 0 to 10k subscribers with no paid ads",
];

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className={`flex items-center gap-1.5 text-xs font-bold border transition-all rounded-sm px-3 py-1.5 ${
        copied ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-400 border-stone-200 hover:border-stone-400 hover:text-stone-700"
      } ${className}`}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Script Section Card ──────────────────────────────────────────────────────

function ScriptSectionCard({ section, index }: { section: ScriptSection; index: number }) {
  const [expanded, setExpanded] = useState(index < 2);
  const cfg = SECTION_TYPE_CFG[section.type] ?? { color: "#6b7280", label: section.type };

  return (
    <div className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
      <button onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-stone-50 transition-colors">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
            {section.timestamp && <span className="text-[10px] text-stone-400 font-mono">{section.timestamp}</span>}
            <span className="text-xs font-bold text-stone-700 truncate">{section.title}</span>
          </div>
          {!expanded && <p className="text-xs text-stone-400 mt-0.5 truncate">{section.script?.slice(0, 80)}…</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {expanded && <CopyButton text={section.script} />}
          {expanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 divide-y divide-stone-50">
              {/* Script */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">📝 Script</p>
                <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line font-medium">{section.script}</p>
              </div>
              {/* B-Roll */}
              {section.bRollNotes && (
                <div className="px-5 py-3 bg-indigo-50/50">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1.5">🎬 B-Roll / On-Screen</p>
                  <p className="text-xs text-indigo-800 leading-relaxed">{section.bRollNotes}</p>
                </div>
              )}
              {/* Director notes */}
              {section.directorNotes && (
                <div className="px-5 py-3 bg-amber-50/50">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1.5">🎥 Director Notes</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{section.directorNotes}</p>
                </div>
              )}
              {/* Retention hook */}
              {section.hookDevice && (
                <div className="px-5 py-3" style={{ backgroundColor: `${ACCENT}06` }}>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: ACCENT }}>⚡ Retention Device</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#4c1d95" }}>{section.hookDevice}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Full Script View ─────────────────────────────────────────────────────────

function FullScriptView({ text, title }: { text: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const downloadScript = () => {
    const blob = new Blob([`${title}\n${"=".repeat(title.length)}\n\n${text}`], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Complete Script</p>
        <div className="flex gap-2">
          <button onClick={copyAll}
            className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-sm transition-all ${
              copied ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-500 border-stone-200 hover:border-stone-400"
            }`}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy All"}
          </button>
          <button onClick={downloadScript}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-sm transition-colors"
            style={{ backgroundColor: ACCENT }}>
            <Download className="w-3.5 h-3.5" />Download .txt
          </button>
        </div>
      </div>
      <div className="bg-stone-950 text-stone-100 rounded-sm p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
        {text}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function ContentStudioTool({ isSignedIn = false, onInsufficientTokens, reopenProject, onReopened }: ContentStudioToolProps) {
  const [stage,      setStage]      = useState<"input" | "loading" | "results">("input");
  const [result,     setResult]     = useState<any>(null);
  const [error,      setError]      = useState("");
  const [loadStep,   setLoadStep]   = useState(0);
  const [activeMode, setActiveMode] = useState("full");

  // Input state
  const [topic,         setTopic]         = useState("");
  const [platform,      setPlatform]      = useState("YOUTUBE_LONG");
  const [tone,          setTone]          = useState("EDUCATIONAL");
  const [targetLength,  setTargetLength]  = useState("");
  const [targetAudience,setTargetAudience]= useState("");
  const [creatorStyle,  setCreatorStyle]  = useState("");
  const [niche,         setNiche]         = useState("");
  const [keyPoints,     setKeyPoints]     = useState("");
  const [showAdvanced,  setShowAdvanced]  = useState(false);

  // Results UI
  const [activeTab,  setActiveTab]  = useState<"script" | "full_script" | "hook" | "promotion" | "repurpose">("hook");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [projectId,  setProjectId]  = useState<string | null>(null);

  // ── Reopen a saved project from dashboard ──────────────────────────────
  useEffect(() => {
    if (!reopenProject) return;
    
    // Parse the result JSON from the saved project
    try {
      // The project object should have a resultJson field
      const savedResult = reopenProject.resultJson ? JSON.parse(reopenProject.resultJson) : reopenProject;
      
      setResult(savedResult);
      setTopic(reopenProject.topic ?? "");
      setPlatform(reopenProject.platform ?? "YOUTUBE_LONG");
      setTone(reopenProject.tone ?? "EDUCATIONAL");
      
      // Set the appropriate mode based on the saved data
      if (savedResult.tweets) {
        setActiveMode("thread");
      } else if (savedResult.article) {
        setActiveMode("blog");
      } else if (savedResult.emailBody) {
        setActiveMode("newsletter");
      } else if (savedResult.repurposedVersions) {
        setActiveMode("repurpose");
      } else if (savedResult.refinedScript) {
        setActiveMode("refine");
      } else if (savedResult.script?.sections) {
        setActiveMode("full");
      } else if (savedResult.script && typeof savedResult.script === "string") {
        setActiveMode("short_form");
      }
      
      setStage("results");
      
      // Set smart default tab
      if (savedResult.tweets || savedResult.article || savedResult.emailBody || savedResult.repurposedVersions) {
        setActiveTab("full_script");
      } else {
        setActiveTab("hook");
      }
      
      onReopened?.();
    } catch (err) {
      console.error("Failed to parse saved project:", err);
    }
  }, [reopenProject]);

  const LOAD_STEPS = [
    "Reading your content brief…",
    "Crafting your hook…",
    "Writing the full script…",
    "Adding B-roll and director notes…",
    "Building your promotion package…",
    "Writing repurpose ideas…",
    "Finalising your production package…",
  ];

  const MODES = [
    { id: "full",        label: "Full Package",   emoji: "🎬", desc: "Complete script + hook + promo + repurpose" },
    { id: "script_only", label: "Script Only",    emoji: "📝", desc: "Clean production script, no extras"         },
    { id: "short_form",  label: "Short Form",     emoji: "📱", desc: "60–90 second punchy script"                 },
    { id: "thread",      label: "Thread",         emoji: "𝕏",  desc: "Twitter/X thread, 8–15 tweets"              },
    { id: "blog",        label: "Blog Post",      emoji: "📰", desc: "Full SEO article, 1200–1800 words"           },
    { id: "newsletter",  label: "Newsletter",     emoji: "📧", desc: "Email newsletter with subject line"          },
    { id: "repurpose",   label: "Repurpose",      emoji: "🔄", desc: "Turn existing content into 5 formats"       },
    { id: "refine",      label: "Refine / Fix",   emoji: "✏️", desc: "Improve and rewrite existing content"        },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStage("loading"); setError(""); setLoadStep(0); setResult(null); setProjectId(null);
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 1400);

    try {
      const res = await fetch("/api/tools/content-studio/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, tone, targetLength, targetAudience, creatorStyle, niche, keyPoints, mode: activeMode }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Content Studio AI" });
        clearInterval(interval); setStage("input");
        setError("You're out of tokens. Play some games to earn more, then try again.");
        return;
      }
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.result) { setError(data.error ?? "Generation failed — please try again."); setStage("input"); return; }
      setResult(data.result);
      // Set smart default tab
      if (["thread", "blog", "newsletter", "repurpose"].includes(activeMode)) setActiveTab("full_script");
      else setActiveTab("hook");
      setStage("results");
    } catch { clearInterval(interval); setError("Network error — please try again."); setStage("input"); }
  };

  const handleSave = async () => {
    if (!isSignedIn || !result) return;
    setSaving(true);
    const res  = await fetch("/api/tools/content-studio/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, platform, tone, targetLength, targetAudience, creatorStyle, niche, keyPoints, result }),
    });
    const data = await res.json();
    if (data.ok) { setSaved(true); setProjectId(data.projectId ?? null); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
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

      {/* Mode selector */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">What do you want to create?</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setActiveMode(m.id)}
              className={`flex flex-col items-start gap-1 p-3 rounded-sm border text-left transition-all ${
                activeMode === m.id ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
              }`}
              style={activeMode === m.id ? { backgroundColor: ACCENT } : {}}>
              <span className="text-xl">{m.emoji}</span>
              <span className={`text-xs font-black leading-tight ${activeMode === m.id ? "text-white" : "text-stone-800"}`}>{m.label}</span>
              <span className={`text-[10px] leading-tight ${activeMode === m.id ? "text-white/70" : "text-stone-400"}`}>{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Platform + Tone (only for video/full modes) */}
      {["full", "script_only", "short_form"].includes(activeMode) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Platform</label>
            <div className="grid grid-cols-2 gap-1">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-left text-xs transition-all ${
                    platform === p.id ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
                  }`}
                  style={platform === p.id ? { backgroundColor: ACCENT } : {}}>
                  <span>{p.emoji}</span>
                  <div>
                    <span className={`font-bold ${platform === p.id ? "text-white" : "text-stone-700"}`}>{p.label}</span>
                    <span className={`text-[10px] block ${platform === p.id ? "text-white/70" : "text-stone-400"}`}>{p.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Tone</label>
            <div className="grid grid-cols-2 gap-1">
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-left text-xs transition-all ${
                    tone === t.id ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
                  }`}
                  style={tone === t.id ? { backgroundColor: ACCENT } : {}}>
                  <span>{t.emoji}</span>
                  <span className={`font-bold ${tone === t.id ? "text-white" : "text-stone-700"}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main topic input */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
          {activeMode === "repurpose" ? "Paste Your Existing Content" :
           activeMode === "refine"    ? "Paste the Content You Want to Improve" :
           "Your Content Topic or Idea"}
        </label>
        <textarea value={topic} onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleGenerate()}
          rows={activeMode === "repurpose" || activeMode === "refine" ? 8 : 4}
          placeholder={
            activeMode === "repurpose" ? "Paste your existing script, article, or content here…" :
            activeMode === "refine"    ? "Paste the script or content you want to improve…" :
            `What's your video/post about?\n\nExamples:\n• I built a £0 budget and paid off £8k debt in 6 months\n• Why I quit my 9-5 after 3 weeks — the honest story\n• 5 Python tricks every developer should know`
          }
          className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-violet-400 focus:bg-white transition-all resize-none"
        />
        {!["repurpose", "refine"].includes(activeMode) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {EXAMPLE_TOPICS.slice(0, 3).map(ex => (
              <button key={ex} onClick={() => setTopic(ex)}
                className="text-xs text-stone-500 bg-stone-50 border border-stone-200 hover:border-violet-400 hover:text-violet-600 px-2.5 py-1 rounded-sm transition-colors truncate max-w-[220px]">
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced options */}
      <div>
        <button onClick={() => setShowAdvanced(p => !p)}
          className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-700 transition-colors">
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Advanced Options (target length, audience, style)
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Target Length</label>
                  <input value={targetLength} onChange={e => setTargetLength(e.target.value)}
                    placeholder="e.g. 10 minutes, 800 words, 60 seconds"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Target Audience</label>
                  <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                    placeholder="e.g. 25-35 yr old career changers"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Your Niche</label>
                  <input value={niche} onChange={e => setNiche(e.target.value)}
                    placeholder="e.g. Personal Finance, Tech, Fitness"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Creator Style</label>
                  <input value={creatorStyle} onChange={e => setCreatorStyle(e.target.value)}
                    placeholder="e.g. casual, no swearing, uses humour"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-violet-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Key Points to Include</label>
                  <textarea value={keyPoints} onChange={e => setKeyPoints(e.target.value)} rows={2}
                    placeholder="Specific points, stats, or examples you want included…"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-violet-400 resize-none" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button onClick={handleGenerate} disabled={!topic.trim()}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white py-4 rounded-sm transition-colors shadow-sm disabled:opacity-40"
        style={{ backgroundColor: ACCENT }}>
        <Sparkles className="w-5 h-5" />
        {activeMode === "full"        ? "Create Full Production Package" :
         activeMode === "script_only" ? "Write My Script"                :
         activeMode === "short_form"  ? "Write Short-Form Script"        :
         activeMode === "thread"      ? "Write Twitter Thread"           :
         activeMode === "blog"        ? "Write Blog Post"                :
         activeMode === "newsletter"  ? "Write Newsletter"               :
         activeMode === "repurpose"   ? "Repurpose My Content"           :
         "Refine My Content"}
      </button>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (stage === "loading") return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🎬</div>
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="text-sm font-semibold text-stone-600">{LOAD_STEPS[loadStep]}</motion.p>
        </AnimatePresence>
        <p className="text-xs text-stone-400 mt-1">Writing your production-ready content…</p>
      </div>
      <div className="flex gap-1.5">
        {LOAD_STEPS.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-violet-400" : "bg-stone-200"}`} />
        ))}
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (!result) return null;

  // Detect what kind of result we have
  const isFullMode      = !!result.script?.sections;
  const isThreadMode    = !!result.tweets;
  const isBlogMode      = !!result.article;
  const isNewsletterMode= !!result.emailBody;
  const isRepurposeMode = !!result.repurposedVersions;
  const isRefineMode    = !!result.refinedScript;
  const isShortMode     = !isFullMode && !!result.script && typeof result.script === "string";

  const RESULT_TABS = [
    ...(isFullMode ? [
      { id: "hook",       label: "Hook",            icon: Zap       },
      { id: "script",     label: "Script Sections", icon: Film      },
      { id: "full_script",label: "Full Script",     icon: FileText  },
      { id: "promotion",  label: "Promotion",       icon: Share2    },
      { id: "repurpose",  label: "Repurpose",       icon: RotateCcw },
    ] : [
      { id: "full_script",label: "Content",         icon: FileText  },
      ...(isRepurposeMode ? [{ id: "repurpose" as const, label: "All Formats", icon: RotateCcw }] : []),
    ]),
  ] as const;

  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>
      {/* Results header */}
      <div className="bg-stone-900 text-white rounded-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
              {isFullMode ? "Production Package" : isThreadMode ? "Twitter Thread" : isBlogMode ? "Blog Post" : isNewsletterMode ? "Email Newsletter" : isRepurposeMode ? "Repurposed Content" : "Script"}
            </p>
            <p className="text-xl font-black text-violet-300 leading-tight">
              {result.title ?? result.seoTitle ?? result.hookTweet?.slice(0, 60) ?? "Your Content"}
            </p>
            {result.contentBrief && (
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-white/50 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />{result.contentBrief.estimatedRuntime}
                </span>
                <span className="text-xs text-white/50 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />~{result.contentBrief.wordCount?.toLocaleString()} words
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {isSignedIn && (
              <button onClick={handleSave} disabled={saving || saved}
                className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                  saved ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
                  : "text-white/50 hover:text-white border-white/15 hover:border-white/30"
                }`}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save"}
              </button>
            )}
            <button onClick={() => { setStage("input"); setResult(null); }}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              <RefreshCw className="w-3 h-3" />New
            </button>
          </div>
        </div>

        {result.contentBrief && (
          <div className="bg-white/5 border border-white/10 rounded-sm px-4 py-3 mt-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Core Premise</p>
            <p className="text-sm text-white/80 leading-relaxed">{result.contentBrief.corePremise}</p>
            {result.contentBrief.uniqueAngle && (
              <p className="text-xs text-violet-300/70 mt-2 leading-relaxed">
                <span className="font-bold text-violet-300">Your angle: </span>{result.contentBrief.uniqueAngle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {RESULT_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-violet-500 text-violet-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── HOOK tab ────────────────────────────────────────────────────── */}
      {activeTab === "hook" && result.hook && (
        <div className="space-y-4">
          {/* Opening line */}
          <div className="bg-stone-900 text-white rounded-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-2">🎯 Opening Line</p>
            <p className="text-2xl font-black text-violet-300 leading-snug">"{result.hook.openingLine}"</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-white/40">{result.hook.hookType}</span>
              <CopyButton text={result.hook.openingLine} />
            </div>
          </div>
          {/* Hook script */}
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Full Hook Section</p>
              <CopyButton text={result.hook.hookScript} />
            </div>
            <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line font-medium">{result.hook.hookScript}</p>
          </div>
          {/* Why this hook */}
          <div className="rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
            <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Why This Hook Works</p>
            <p className="text-sm text-stone-700 leading-relaxed">{result.hook.whyThisHook}</p>
          </div>
          {/* Alt titles */}
          {result.altTitles?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Alternative Titles</p>
              <div className="space-y-2">
                {result.altTitles.map((t: string, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-stone-50 last:border-0">
                    <p className="text-sm text-stone-700 flex-1">{t}</p>
                    <CopyButton text={t} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Engagement strategy */}
          {result.engagementStrategy && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">📊 Engagement Strategy</p>
              <div className="space-y-3">
                {[
                  { label: "Comment Hook",   value: result.engagementStrategy.commentHook,    icon: MessageSquare },
                  { label: "Poll Idea",      value: result.engagementStrategy.pollIdea,        icon: BarChart2    },
                  { label: "Best Post Time", value: result.engagementStrategy.bestTimeToPost,  icon: Clock        },
                ].map(s => s.value && (
                  <div key={s.label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
                      <s.icon className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{s.label}</p>
                      <p className="text-xs text-stone-700 leading-relaxed mt-0.5">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SCRIPT SECTIONS tab ─────────────────────────────────────────── */}
      {activeTab === "script" && isFullMode && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
              {result.script.sections?.length} Sections
            </p>
            <p className="text-[10px] text-stone-400">Click any section to expand. Each section is individually copyable.</p>
          </div>
          {result.script.sections?.map((section: ScriptSection, i: number) => (
            <ScriptSectionCard key={section.id ?? i} section={section} index={i} />
          ))}
        </div>
      )}

      {/* ── FULL SCRIPT / CONTENT tab ────────────────────────────────────── */}
      {activeTab === "full_script" && (
        <div className="space-y-4">
          {/* Full mode */}
          {isFullMode && result.script?.fullScriptText && (
            <FullScriptView text={result.script.fullScriptText} title={result.title ?? "Script"} />
          )}
          {/* Short-form */}
          {isShortMode && (
            <div className="space-y-3">
              <FullScriptView text={result.script} title={result.title ?? "Script"} />
              {result.textOverlays?.length > 0 && (
                <div className="bg-white border border-stone-100 rounded-sm p-4">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Text Overlays</p>
                  {result.textOverlays.map((t: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-stone-50 last:border-0">
                      <span className="text-[10px] font-black text-stone-400 w-5">{i + 1}</span>
                      <p className="text-xs font-bold text-stone-700 flex-1">{t}</p>
                    </div>
                  ))}
                </div>
              )}
              {result.loopTrigger && (
                <div className="flex items-start gap-3 rounded-sm px-4 py-3" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                  <p className="text-xs font-bold text-stone-700">🔄 Loop Trigger: {result.loopTrigger}</p>
                </div>
              )}
            </div>
          )}
          {/* Thread */}
          {isThreadMode && (
            <div className="space-y-3">
              <div className="bg-stone-900 text-white rounded-sm p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">🎯 Hook Tweet</p>
                <p className="text-base font-bold leading-snug">{result.hookTweet}</p>
                <CopyButton text={result.hookTweet ?? ""} className="mt-2" />
              </div>
              <div className="space-y-2">
                {result.tweets?.map((t: any, i: number) => (
                  <div key={i} className="bg-white border border-stone-100 rounded-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 flex-1">
                        <span className="text-[10px] font-black text-stone-400 w-5 flex-shrink-0 mt-0.5">{t.number}</span>
                        <p className="text-sm text-stone-800 leading-relaxed flex-1">{t.text}</p>
                      </div>
                      <CopyButton text={t.text} />
                    </div>
                    {t.note && <p className="text-[10px] text-stone-400 mt-2 ml-8">{t.note}</p>}
                  </div>
                ))}
              </div>
              {result.ctaTweet && (
                <div className="bg-violet-50 border border-violet-200 rounded-sm p-4">
                  <p className="text-[10px] font-black text-violet-600 uppercase tracking-wider mb-1">CTA Tweet</p>
                  <p className="text-sm text-violet-800 font-semibold">{result.ctaTweet}</p>
                  <CopyButton text={result.ctaTweet} className="mt-2" />
                </div>
              )}
            </div>
          )}
          {/* Blog */}
          {isBlogMode && (
            <div className="space-y-4">
              <div className="bg-white border border-stone-100 rounded-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">SEO Package</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Title", value: result.seoTitle ?? result.title },
                    { label: "Meta Description", value: result.metaDescription },
                    { label: "Slug", value: result.slug },
                  ].map(s => s.value && (
                    <div key={s.label} className="flex items-start justify-between gap-3 py-2 border-b border-stone-50 last:border-0">
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{s.label}</p>
                        <p className="text-xs text-stone-700 mt-0.5">{s.value}</p>
                      </div>
                      <CopyButton text={s.value} />
                    </div>
                  ))}
                </div>
              </div>
              <FullScriptView text={result.article ?? ""} title={result.seoTitle ?? result.title ?? "Article"} />
            </div>
          )}
          {/* Newsletter */}
          {isNewsletterMode && (
            <div className="space-y-4">
              <div className="bg-stone-900 text-white rounded-sm p-5">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Subject Line</p>
                    <p className="text-lg font-black text-violet-300">{result.subjectLine}</p>
                    <CopyButton text={result.subjectLine ?? ""} className="mt-1.5" />
                  </div>
                  {result.previewText && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Preview Text</p>
                      <p className="text-sm text-white/70">{result.previewText}</p>
                    </div>
                  )}
                  {result.altSubjectLines?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Alt Subject Lines</p>
                      {result.altSubjectLines.map((s: string, i: number) => (
                        <p key={i} className="text-xs text-white/60 py-1 border-b border-white/10 last:border-0">{s}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <FullScriptView text={result.emailBody ?? ""} title={result.subjectLine ?? "Newsletter"} />
              {result.psLine && (
                <div className="rounded-sm px-4 py-3" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>P.S. Line</p>
                  <p className="text-sm text-stone-700 italic">{result.psLine}</p>
                  <CopyButton text={result.psLine} className="mt-2" />
                </div>
              )}
            </div>
          )}
          {/* Refine */}
          {isRefineMode && (
            <div className="space-y-4">
              {result.diagnosis && (
                <div className="bg-white border border-stone-100 rounded-sm p-5">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Diagnosis</p>
                  <div className="space-y-2">
                    <div className="bg-emerald-50 rounded-sm px-3 py-2">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">What Worked</p>
                      <p className="text-xs text-emerald-800">{result.diagnosis.whatWorked}</p>
                    </div>
                    {result.diagnosis.mainWeaknesses?.map((w: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />{w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.improvedHook && (
                <div className="bg-stone-900 text-white rounded-sm p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Improved Hook</p>
                  <p className="text-base font-bold text-violet-300">"{result.improvedHook}"</p>
                  <CopyButton text={result.improvedHook} className="mt-2" />
                </div>
              )}
              <FullScriptView text={result.refinedScript ?? ""} title={result.improvedTitle ?? "Refined Script"} />
            </div>
          )}
        </div>
      )}

      {/* ── PROMOTION tab ────────────────────────────────────────────────── */}
      {activeTab === "promotion" && result.promotionPackage && (
        <div className="space-y-4">
          {/* Thumbnail brief */}
          {result.promotionPackage.thumbnailBrief && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">🖼️ Thumbnail Brief</p>
                <CopyButton text={result.promotionPackage.thumbnailBrief} />
              </div>
              <p className="text-sm text-stone-700 leading-relaxed">{result.promotionPackage.thumbnailBrief}</p>
            </div>
          )}
          {/* Description */}
          {(result.promotionPackage.youtubeDescription || result.promotionPackage.shortDescription) && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">📝 Description</p>
                <CopyButton text={result.promotionPackage.youtubeDescription ?? result.promotionPackage.shortDescription ?? ""} />
              </div>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {result.promotionPackage.youtubeDescription ?? result.promotionPackage.shortDescription}
              </p>
            </div>
          )}
          {/* Chapters */}
          {result.promotionPackage.chapters?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">⏱ Chapters</p>
                <CopyButton text={result.promotionPackage.chapters.map((c: any) => `${c.timestamp} ${c.title}`).join("\n")} />
              </div>
              <div className="space-y-1.5">
                {result.promotionPackage.chapters.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-stone-400 text-xs w-12 flex-shrink-0">{c.timestamp}</span>
                    <span className="text-stone-700">{c.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Tags */}
          {result.promotionPackage.tags?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                  <Hash className="w-3.5 h-3.5 inline mr-1" />Tags
                </p>
                <CopyButton text={result.promotionPackage.tags.join(", ")} />
              </div>
              <div className="flex flex-wrap gap-2">
                {result.promotionPackage.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Promotion tweets */}
          {result.promotionPackage.promotionTweets?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">🐦 Promotion Tweets</p>
              <div className="space-y-2">
                {result.promotionPackage.promotionTweets.map((tweet: string, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-3 bg-stone-50 rounded-sm">
                    <p className="text-sm text-stone-700 flex-1 leading-relaxed">{tweet}</p>
                    <CopyButton text={tweet} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* LinkedIn */}
          {result.promotionPackage.linkedinCaption && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">💼 LinkedIn Caption</p>
                <CopyButton text={result.promotionPackage.linkedinCaption} />
              </div>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{result.promotionPackage.linkedinCaption}</p>
            </div>
          )}
        </div>
      )}

      {/* ── REPURPOSE tab ────────────────────────────────────────────────── */}
      {activeTab === "repurpose" && (
        <div className="space-y-3">
          {/* Full repurpose mode */}
          {isRepurposeMode && result.repurposedVersions?.map((v: any, i: number) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-100" style={{ backgroundColor: `${ACCENT}05` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-stone-900">{v.format}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{v.nativeAdaptation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400">{v.estimatedLength}</span>
                    <button onClick={() => { setTopic(v.content); setActiveMode("refine"); setStage("input"); setResult(null); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-violet-600 border border-stone-200 hover:border-violet-300 px-2 py-1 rounded-sm transition-colors">
                      <Edit3 className="w-3 h-3" />Refine
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Hook</p>
                <p className="text-sm font-bold text-stone-800 mb-3 italic">"{v.hookLine}"</p>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Content</p>
                  <CopyButton text={v.content} />
                </div>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{v.content}</p>
              </div>
            </div>
          ))}

          {/* Repurpose ideas from full mode */}
          {!isRepurposeMode && result.repurposeIdeas?.map((idea: any, i: number) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm p-4 flex items-start gap-4">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: `${ACCENT}12` }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-stone-900">{idea.format}</p>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{idea.angle}</p>
                <p className="text-xs font-semibold italic mt-2" style={{ color: ACCENT }}>Hook: "{idea.hookLine}"</p>
              </div>
              <button onClick={() => { setTopic(`${idea.format}: ${idea.hookLine}`); setActiveMode("full"); setStage("input"); setResult(null); }}
                className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm flex-shrink-0 transition-colors"
                style={{ backgroundColor: ACCENT }}>
                Create <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}