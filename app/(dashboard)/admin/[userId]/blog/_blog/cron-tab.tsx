"use client";

// =============================================================================
// isaacpaha.com — Blog AI Cron Tab
// components/admin/blog/cron-tab.tsx
//
// Manages the AI auto-draft scheduler:
//   - Configure interval, categories, auto-publish toggle
//   - Manual "Run Now" trigger
//   - Run history with links to generated drafts
//   - How it works explanation
// =============================================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Play, Settings, Clock, CheckCircle2, XCircle,
  Loader2, AlertCircle, Brain,
  Database, BookOpen, Calendar, Zap, ChevronDown, ChevronRight,
  Info, Save, Check, Activity,
} from "lucide-react";

type RunRecord = {
  id:          string;
  startedAt:   string;
  completedAt: string;
  category:    string;
  status:      "success" | "error";
  postId?:     string;
  postTitle?:  string;
  postSlug?:   string;
  error?:      string;
};

type CronSettings = {
  enabled:      boolean;
  intervalDays: number;
  lastRun:      string | null;
  categories:   string[];
  autoPublish:  boolean;
};

interface CronTabProps {
  userId:     string;
  onViewPost: (postId: string) => void;
}

const ALL_CATEGORIES = ["AI", "Africa", "Technology", "Business", "Society", "Education", "Fintech", "Philosophy"];

const HOW_IT_WORKS = [
  {
    icon: Database,
    title: "Taps your knowledge base",
    desc: "Reads your Now page (what you're building & thinking), Knowledge Library (books/courses), and Timeline milestones to understand your current context.",
    color: "#f59e0b",
  },
  {
    icon: Brain,
    title: "Writes in your voice",
    desc: "Uses Isaac's full persona — your companies, products, strong opinions, writing style, and domain expertise — to generate posts that sound like you, not generic AI.",
    color: "#8b5cf6",
  },
  {
    icon: BookOpen,
    title: "Saves as draft",
    desc: "Every generated post lands as DRAFT — never published automatically (unless you enable it). You review, edit, critique with AI, then publish yourself.",
    color: "#10b981",
  },
  {
    icon: Zap,
    title: "Rotates categories",
    desc: "Each run picks the next category in your list so your blog stays varied — AI, Africa, Technology, Business — without repeating the same topic consecutively.",
    color: "#3b82f6",
  },
];

export function CronTab({ onViewPost }: CronTabProps) {
  const [settings,    setSettings]    = useState<CronSettings>({
    enabled: false, intervalDays: 7, lastRun: null,
    categories: ["AI", "Africa", "Technology", "Business"],
    autoPublish: false,
  });
  const [history,     setHistory]     = useState<RunRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [running,     setRunning]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [savedOk,     setSavedOk]     = useState(false);
  const [runError,    setRunError]    = useState("");
  const [runSuccess,  setRunSuccess]  = useState<{ title: string; slug: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetch("/api/admin/blog/cron")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
        if (data.history)  setHistory(data.history);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/blog/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "configure", settings }),
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } catch {}
    setSaving(false);
  };

  const runNow = async () => {
    setRunning(true); setRunError(""); setRunSuccess(null);
    try {
      const res  = await fetch("/api/admin/blog/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setRunError(data.error ?? "Generation failed");
      } else {
        setRunSuccess({ title: data.post.title, slug: data.post.slug });
        // Refresh history
        fetch("/api/admin/blog/cron")
          .then((r) => r.json())
          .then((d) => { if (d.history) setHistory(d.history); });
      }
    } catch { setRunError("Network error"); }
    setRunning(false);
  };

  const toggleCategory = (cat: string) => {
    setSettings((s) => ({
      ...s,
      categories: s.categories.includes(cat)
        ? s.categories.filter((c) => c !== cat)
        : [...s.categories, cat],
    }));
  };

  const nextRunDate = settings.lastRun
    ? new Date(new Date(settings.lastRun).getTime() + settings.intervalDays * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Not scheduled";

  const nextCategory = history.length > 0 && settings.categories.length > 0
    ? settings.categories[history.length % settings.categories.length]
    : settings.categories[0] ?? "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-500" />
            AI Auto-Draft
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Automatically generates blog post drafts in Isaac&apos;s voice using your Now page, knowledge base, and timeline as context.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={runNow}
            disabled={running}
            className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60 shadow-sm"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "Generating…" : "Run Now"}
          </button>
        </div>
      </div>

      {/* Run result banners */}
      <AnimatePresence>
        {runSuccess && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-800">Draft generated successfully</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                &#34;{runSuccess.title}&#34; has been saved as a draft. Review, edit, and publish when ready.
              </p>
            </div>
            <button onClick={() => setRunSuccess(null)} className="text-emerald-400 hover:text-emerald-700 transition-colors flex-shrink-0">
              ✕
            </button>
          </motion.div>
        )}
        {runError && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-sm px-4 py-3.5">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{runError}</p>
            <button onClick={() => setRunError("")} className="text-red-400 hover:text-red-700 transition-colors">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Status",       value: settings.enabled ? "Enabled" : "Off", color: settings.enabled ? "#10b981" : "#9ca3af", icon: Activity },
          { label: "Interval",     value: `Every ${settings.intervalDays}d`,    color: "#3b82f6",  icon: Clock    },
          { label: "Next run",     value: settings.enabled ? nextRunDate : "—", color: "#f59e0b",  icon: Calendar },
          { label: "Next topic",   value: nextCategory,                          color: "#8b5cf6",  icon: Sparkles },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
            <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Settings panel */}
      <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
        <button
          onClick={() => setShowSettings((p) => !p)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <span className="flex items-center gap-2"><Settings className="w-4 h-4 text-stone-400" />Configuration</span>
          {showSettings ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-stone-100">
              <div className="p-5 space-y-5">

                {/* Enable/disable */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-stone-700">Auto-generate on schedule</p>
                    <p className="text-xs text-stone-400 mt-0.5">When enabled, posts generate automatically based on your interval</p>
                  </div>
                  <button
                    onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.enabled ? "bg-amber-400" : "bg-stone-200"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* Auto-publish */}
                <div className="flex items-center justify-between py-3 border-t border-stone-100">
                  <div>
                    <p className="text-sm font-bold text-stone-700">Auto-publish drafts</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      <span className="text-amber-600 font-semibold">Not recommended.</span> Posts will be published without review. Safer to keep off.
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings((s) => ({ ...s, autoPublish: !s.autoPublish }))}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.autoPublish ? "bg-red-400" : "bg-stone-200"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoPublish ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* Interval */}
                <div className="border-t border-stone-100 pt-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">Generate every N days</label>
                  <div className="flex items-center gap-3">
                    {[3, 5, 7, 14, 21, 30].map((n) => (
                      <button key={n} onClick={() => setSettings((s) => ({ ...s, intervalDays: n }))}
                        className={`w-10 h-10 rounded-sm border text-sm font-bold transition-colors ${
                          settings.intervalDays === n ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="border-t border-stone-100 pt-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">
                    Topic categories to rotate through ({settings.categories.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CATEGORIES.map((cat) => (
                      <button key={cat} onClick={() => toggleCategory(cat)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-sm border transition-colors ${
                          settings.categories.includes(cat)
                            ? "bg-amber-50 border-amber-300 text-amber-700"
                            : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                        }`}>
                        {cat}
                        {settings.categories.includes(cat) && <Check className="w-3 h-3 inline ml-1 text-amber-500" />}
                      </button>
                    ))}
                  </div>
                  {settings.categories.length > 1 && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-stone-400 leading-snug">
                        Categories rotate in order: {settings.categories.join(" → ")} → {settings.categories[0]} → …
                      </p>
                    </div>
                  )}
                </div>

                {/* Save */}
                <div className="border-t border-stone-100 pt-4">
                  <button onClick={saveSettings} disabled={saving}
                    className="flex items-center gap-2 text-sm font-bold text-white bg-stone-800 hover:bg-stone-900 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving…" : savedOk ? "Saved!" : "Save settings"}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* How it works */}
      <div className="bg-stone-50 border border-stone-100 rounded-sm p-5">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${step.color}18` }}>
                <step.icon className="w-4 h-4" style={{ color: step.color }} />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-700">{step.title}</p>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-stone-200 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-stone-500 leading-relaxed">
            <span className="font-bold text-stone-600">Important:</span> AI drafts are a starting point — they need your review and editing. The AI writes in your established voice, but your lived experience, specific opinions, and editorial judgment are what make the posts worth reading. Always read, revise, and approve before publishing.
          </p>
        </div>
      </div>

      {/* Run history */}
      <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Run History</p>
          <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-sm font-semibold">Last 30 runs</span>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Clock className="w-8 h-8 text-stone-200 mx-auto mb-2" />
            <p className="text-xs text-stone-400">No runs yet — click &#34;Run Now&#34; to generate your first AI draft</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {history.map((run) => (
              <div key={run.id} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50/40 transition-colors">
                {run.status === "success"
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  {run.status === "success" ? (
                    <>
                      <p className="text-sm font-semibold text-stone-700 truncate">{run.postTitle}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-stone-400 font-semibold">{run.category}</span>
                        <span className="text-[10px] text-stone-300">·</span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(run.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-red-600">Generation failed</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">{run.error}</p>
                    </>
                  )}
                </div>
                {run.status === "success" && run.postId && (
                  <button onClick={() => onViewPost(run.postId!)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500 border border-stone-200 hover:border-amber-400 hover:text-amber-700 px-2.5 py-1.5 rounded-sm transition-colors flex-shrink-0">
                    Review draft
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}