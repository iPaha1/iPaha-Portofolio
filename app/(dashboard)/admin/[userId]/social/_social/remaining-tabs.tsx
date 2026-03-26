"use client";
// =============================================================================
// isaacpaha.com — Social Brainstorm Tab
// components/admin/social/brainstorm-tab.tsx
// =============================================================================

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Brain, Loader2, X, Copy, Check, RefreshCw,
  Lightbulb, Hash, TrendingUp, Zap, Target, Layers, Pencil,
  AlertCircle,
  Globe,
} from "lucide-react";
import { PLATFORMS } from "./platform-connect";

const BRAINSTORM_MODES = [
  { id: "ideas",    label: "Post Ideas",        icon: Lightbulb, color: "#f59e0b", desc: "7 specific post ideas from a theme or current context" },
  { id: "hooks",    label: "Viral Hooks",        icon: Zap,       color: "#8b5cf6", desc: "10 scroll-stopping opening lines" },
  { id: "series",   label: "Content Series",    icon: Layers,    color: "#3b82f6", desc: "Plan a 5-7 post content series" },
  { id: "repurpose",label: "Repurpose Blog",    icon: RefreshCw, color: "#10b981", desc: "Turn a blog post into social content" },
  { id: "viral",    label: "Viral Analysis",    icon: TrendingUp,color: "#ec4899", desc: "Analyse why certain posts go viral in your niche" },
  { id: "hashtags", label: "Hashtag Strategy",  icon: Hash,      color: "#f97316", desc: "Platform-specific hashtag strategies" },
  { id: "critique", label: "Content Critique",  icon: Target,    color: "#ef4444", desc: "Brutally honest feedback on your content strategy" },
] as const;

const EXAMPLE_PROMPTS: Record<string, string[]> = {
  ideas:     ["African fintech insights this week", "Solo founder lessons from okSumame build", "AI tools that actually work for founders"],
  hooks:     ["Why Africa's tech moment is now", "What 5 years of solo founding taught me"],
  series:    ["Building okSumame in public — logistics tech", "The African founder's playbook"],
  repurpose: ["Copy your recent blog post excerpt here to adapt for social…"],
  viral:     ["What type of content performs best for African tech founders on LinkedIn?"],
  hashtags:  ["LINKEDIN", "TWITTER"],
  critique:  ["My current social strategy: I post 2x/week on LinkedIn, occasional Twitter threads…"],
};

interface BrainstormTabProps {
  onUsePost: (data: { content: string; platform?: string }) => void;
}

export function BrainstormTab({ onUsePost }: BrainstormTabProps) {
  const [mode,     setMode]     = useState<string>("ideas");
  const [platform, setPlatform] = useState("TWITTER");
  const [prompt,   setPrompt]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState("");
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState(false);
  const [history,  setHistory]  = useState<{ mode: string; prompt: string; result: string }[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const currentMode = BRAINSTORM_MODES.find((m) => m.id === mode)!;

  const run = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setResult(""); setError("");
    try {
      const res  = await fetch("/api/admin/social/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode:     mode === "repurpose" ? "repurpose" : mode === "hooks" ? "hook" : mode === "viral" ? "viral" : mode === "hashtags" ? "hashtags" : mode === "critique" ? "critique" : "write",
          prompt:   prompt.trim(),
          platform: mode === "hooks" || mode === "ideas" ? platform : undefined,
          content:  mode === "repurpose" ? prompt : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Generation failed"); }
      else {
        setResult(data.content ?? "");
        setHistory((h) => [{ mode, prompt: prompt.trim(), result: data.content }, ...h.slice(0, 7)]);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: mode selector */}
      <div className="w-64 flex-shrink-0 border-r border-stone-100 overflow-y-auto p-4 space-y-5">
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Mode</p>
          <div className="space-y-1.5">
            {BRAINSTORM_MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-sm text-left border transition-colors ${mode === m.id ? "bg-amber-50 border-amber-200" : "bg-white border-stone-100 hover:bg-stone-50"}`}>
                <m.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: mode === m.id ? m.color : "#9ca3af" }} />
                <div>
                  <p className={`text-xs font-bold ${mode === m.id ? "text-amber-700" : "text-stone-700"}`}>{m.label}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        {history.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">History</p>
            {history.slice(0, 5).map((h, i) => (
              <button key={i} onClick={() => { setPrompt(h.prompt); setMode(h.mode); setResult(h.result); }}
                className="w-full text-left px-2.5 py-2 rounded-sm text-[11px] text-stone-500 hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-colors mb-1">
                <span className="font-semibold text-stone-400">{BRAINSTORM_MODES.find((m) => m.id === h.mode)?.label}: </span>
                {h.prompt.slice(0, 40)}…
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: prompt + result */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-stone-100 bg-stone-50/30 flex-shrink-0 space-y-3">
          <div className="flex items-center gap-3">
            <currentMode.icon className="w-4 h-4" style={{ color: currentMode.color }} />
            <p className="text-sm font-black text-stone-700">{currentMode.label}</p>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}
              className="ml-auto text-xs border border-stone-200 rounded-sm px-2.5 py-1.5 bg-white focus:outline-none focus:border-amber-400">
              {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
            </select>
          </div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }}
            rows={4} placeholder={EXAMPLE_PROMPTS[mode]?.[0] ?? "Enter your prompt…"}
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none bg-white"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-stone-400">Try:</span>
            {(EXAMPLE_PROMPTS[mode] ?? []).map((ex) => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="text-[10px] text-stone-500 border border-stone-200 px-2 py-0.5 rounded-sm hover:border-amber-400 hover:text-amber-600 transition-colors truncate max-w-[200px]">
                {ex}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-400">⌘↵ to run</span>
            <button onClick={run} disabled={!prompt.trim() || loading}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-5 py-2.5 rounded-sm transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {loading ? "Generating…" : "Brainstorm"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-stone-500">Ready to brainstorm</p>
              <p className="text-xs text-stone-300 mt-1 max-w-xs leading-relaxed">
                Choose a mode, write your prompt, and generate social content in Isaac's voice.
              </p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm text-stone-500 animate-pulse">Generating in Isaac's voice…</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {result && !loading && (
            <div ref={resultRef}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-600">{currentMode.label}</span>
                <div className="flex gap-2">
                  <button onClick={() => run()} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
                    <RefreshCw className="w-3 h-3" />Regenerate
                  </button>
                  <button onClick={copy} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={() => setResult("")} className="text-stone-300 hover:text-stone-600"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="bg-white border border-stone-100 rounded-sm p-5">
                <pre className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider w-full">Use in composer:</p>
                <button onClick={() => onUsePost({ content: result, platform })}
                  className="flex items-center gap-2 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-2 rounded-sm transition-colors">
                  <Pencil className="w-3.5 h-3.5" />Use in {PLATFORMS.find((p) => p.id === platform)?.label}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// =============================================================================
// Social Cron Tab
// components/admin/social/cron-tab.tsx (exported from same file for brevity)
// =============================================================================

import {
  Play, Settings, Clock, CheckCircle2, XCircle, Save, ChevronRight,
  Info, Activity, Calendar, Database, BookOpen,
} from "lucide-react";

type CronSettings = {
  enabled:       boolean;
  intervalHours: number;
  platforms:     string[];
  autoPublish:   boolean;
  topics:        string[];
  lastRun:       string | null;
};

type RunRecord = {
  id:          string;
  startedAt:   string;
  completedAt: string;
  topic:       string;
  platforms:   string[];
  status:      "success" | "error";
  created?:    { platform: string; postId: string; preview: string }[];
  error?:      string;
};

interface CronTabProps {
  connections: { platform: string; isActive: boolean }[];
  onViewPost:  (postId: string) => void;
}

export function SocialCronTab({ connections, onViewPost }: CronTabProps) {
  const [settings,     setSettings]     = useState<CronSettings>({
    enabled: false, intervalHours: 24, platforms: ["TWITTER", "LINKEDIN"],
    autoPublish: false, topics: ["AI for founders", "Building in Africa", "Solo founder insights"],
    lastRun: null,
  });
  const [history,      setHistory]      = useState<RunRecord[]>([]);
  const [loadingInit,  setLoadingInit]  = useState(true);
  const [running,      setRunning]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savedOk,      setSavedOk]      = useState(false);
  const [runError,     setRunError]     = useState("");
  const [runSuccess,   setRunSuccess]   = useState<{ topic: string; count: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [topicInput,   setTopicInput]   = useState("");

  React.useEffect(() => {
    fetch("/api/admin/social/cron")
      .then((r) => r.json())
      .then((d) => { if (d.settings) setSettings(d.settings); if (d.history) setHistory(d.history); })
      .finally(() => setLoadingInit(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/social/cron", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "configure", settings }),
    });
    setSavedOk(true); setTimeout(() => setSavedOk(false), 2000);
    setSaving(false);
  };

  const run = async () => {
    setRunning(true); setRunError(""); setRunSuccess(null);
    const res  = await fetch("/api/admin/social/cron", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run" }),
    });
    const data = await res.json();
    if (!res.ok || data.error) { setRunError(data.error ?? "Failed"); }
    else { setRunSuccess({ topic: data.topic, count: data.created?.length ?? 0 }); fetch("/api/admin/social/cron").then((r) => r.json()).then((d) => { if (d.history) setHistory(d.history); }); }
    setRunning(false);
  };

  const activePlatforms = PLATFORMS.filter((p) => connections.some((c) => c.platform === p.id && c.isActive));

  if (loadingInit) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-stone-900 flex items-center gap-2"><Brain className="w-5 h-5 text-amber-500" />AI Auto-Post</h2>
          <p className="text-sm text-stone-500 mt-1">Generates social posts in Isaac's voice using your Now page, knowledge base, and timeline. Saves as draft for review.</p>
        </div>
        <button onClick={run} disabled={running || !activePlatforms.length}
          className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60 shadow-sm">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Generating…" : "Run Now"}
        </button>
      </div>

      <AnimatePresence>
        {runSuccess && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-700">{runSuccess.count} draft{runSuccess.count !== 1 ? "s" : ""} created about "{runSuccess.topic}"</p>
          <button onClick={() => setRunSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-700">✕</button>
        </motion.div>}
        {runError && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-sm px-4 py-3.5">
          <XCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700 flex-1">{runError}</p>
          <button onClick={() => setRunError("")} className="text-red-400 hover:text-red-700">✕</button>
        </motion.div>}
      </AnimatePresence>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Status",        value: settings.enabled ? "Enabled" : "Off", color: settings.enabled ? "#10b981" : "#9ca3af", icon: Activity },
          { label: "Interval",      value: `Every ${settings.intervalHours}h`,   color: "#3b82f6", icon: Clock    },
          { label: "Platforms",     value: `${settings.platforms.length} active`, color: "#f59e0b", icon: Sparkles },
          { label: "Auto-publish",  value: settings.autoPublish ? "On ⚠️" : "Off (draft)", color: settings.autoPublish ? "#ef4444" : "#6b7280", icon: Globe },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
            <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
        <button onClick={() => setShowSettings((p) => !p)} className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-stone-700 hover:bg-stone-50">
          <span className="flex items-center gap-2"><Settings className="w-4 h-4 text-stone-400" />Configuration</span>
          <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${showSettings ? "rotate-90" : ""}`} />
        </button>
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-stone-100">
              <div className="p-5 space-y-5">
                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-bold text-stone-700">Auto-generate on schedule</p><p className="text-xs text-stone-400">Creates drafts on your set interval</p></div>
                  <button onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.enabled ? "bg-amber-400" : "bg-stone-200"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {/* Auto-publish */}
                <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                  <div><p className="text-sm font-bold text-stone-700">Auto-publish <span className="text-amber-600">⚠️</span></p><p className="text-xs text-stone-400">Skip review — publishes immediately. Not recommended.</p></div>
                  <button onClick={() => setSettings((s) => ({ ...s, autoPublish: !s.autoPublish }))}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.autoPublish ? "bg-red-400" : "bg-stone-200"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoPublish ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {/* Interval */}
                <div className="border-t border-stone-100 pt-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">Generate every N hours</label>
                  <div className="flex gap-2 flex-wrap">
                    {[6, 12, 24, 48, 72].map((n) => (
                      <button key={n} onClick={() => setSettings((s) => ({ ...s, intervalHours: n }))}
                        className={`w-14 h-10 rounded-sm border text-sm font-bold transition-colors ${settings.intervalHours === n ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"}`}>{n}h</button>
                    ))}
                  </div>
                </div>
                {/* Platform selection */}
                <div className="border-t border-stone-100 pt-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">Platforms to post to</label>
                  <div className="flex flex-wrap gap-2">
                    {activePlatforms.map((p) => {
                      const selected = settings.platforms.includes(p.id);
                      return (
                        <button key={p.id}
                          onClick={() => setSettings((s) => ({ ...s, platforms: selected ? s.platforms.filter((x) => x !== p.id) : [...s.platforms, p.id] }))}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-sm border transition-colors ${selected ? "border-opacity-50 text-white" : "bg-white text-stone-500 border-stone-200"}`}
                          style={selected ? { backgroundColor: p.color, borderColor: p.color } : {}}>
                          <span>{p.icon}</span>{p.label}
                          {selected && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                    {!activePlatforms.length && <p className="text-xs text-stone-400">No platforms connected. Go to Connections tab.</p>}
                  </div>
                </div>
                {/* Topics */}
                <div className="border-t border-stone-100 pt-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">Topic rotation ({settings.topics.length} topics)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {settings.topics.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 text-[11px] bg-stone-100 text-stone-600 px-2.5 py-1 rounded-sm font-semibold">
                        {t}<button onClick={() => setSettings((s) => ({ ...s, topics: s.topics.filter((x) => x !== t) }))}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={topicInput} onChange={(e) => setTopicInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && topicInput.trim()) { setSettings((s) => ({ ...s, topics: [...s.topics, topicInput.trim()] })); setTopicInput(""); } }}
                      placeholder="Add topic…" className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                    />
                    <button onClick={() => { if (topicInput.trim()) { setSettings((s) => ({ ...s, topics: [...s.topics, topicInput.trim()] })); setTopicInput(""); } }}
                      className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50">Add</button>
                  </div>
                </div>
                <div className="border-t border-stone-100 pt-4">
                  <button onClick={save} disabled={saving}
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

      {/* Run history */}
      <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Run History</p>
          <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-sm font-semibold">Last 50 runs</span>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-10 text-center"><Clock className="w-8 h-8 text-stone-200 mx-auto mb-2" /><p className="text-xs text-stone-400">No runs yet — click Run Now to generate first drafts</p></div>
        ) : (
          <div className="divide-y divide-stone-50">
            {history.map((run) => (
              <div key={run.id} className="flex items-start gap-4 px-5 py-3 hover:bg-stone-50/40 transition-colors">
                {run.status === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  {run.status === "success" ? (
                    <>
                      <p className="text-sm font-semibold text-stone-700">Topic: "{run.topic}"</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {run.platforms.join(", ")} · {run.created?.length ?? 0} post{(run.created?.length ?? 0) !== 1 ? "s" : ""} created ·{" "}
                        {new Date(run.startedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-red-600">Failed</p>
                      <p className="text-[11px] text-stone-400">{run.error}</p>
                    </>
                  )}
                </div>
                {run.status === "success" && run.created?.[0] && (
                  <button onClick={() => onViewPost(run.created![0].postId)}
                    className="text-[11px] font-bold text-stone-500 border border-stone-200 hover:border-amber-400 hover:text-amber-700 px-2.5 py-1.5 rounded-sm flex-shrink-0 transition-colors">
                    Review
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


// =============================================================================
// Analytics Tab
// =============================================================================

export function AnalyticsTab({ stats }: { stats: any }) {
  const topPosts = stats?.recentPosts?.filter((p: any) => p.status === "published")
    .sort((a: any, b: any) => (b.impressions ?? 0) - (a.impressions ?? 0))
    .slice(0, 8) ?? [];

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Posts",    value: stats?.totalPosts ?? 0,       color: "#f59e0b", icon: "📱" },
          { label: "Total Views",    value: stats?.totalImpressions ?? 0, color: "#3b82f6", icon: "👁️" },
          { label: "Total Likes",    value: stats?.totalLikes ?? 0,       color: "#ec4899", icon: "❤️" },
          { label: "Total Shares",   value: stats?.totalShares ?? 0,      color: "#10b981", icon: "🔁" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-xl font-black mt-2" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
            <p className="text-[11px] text-stone-400 mt-0.5 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <div className="bg-white border border-stone-100 rounded-sm p-5">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Connected Platforms</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(stats?.connections ?? []).map((conn: any) => {
            const platform = PLATFORMS.find((p) => p.id === conn.platform);
            return (
              <div key={conn.id} className={`border rounded-sm p-3.5 ${conn.isActive ? "border-emerald-200 bg-emerald-50/20" : "border-stone-100 opacity-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{platform?.icon ?? "?"}</span>
                  <p className="text-xs font-bold text-stone-700">{platform?.label ?? conn.platform}</p>
                </div>
                {conn.handle && <p className="text-[11px] text-stone-500">@{conn.handle}</p>}
                {conn.followerCount !== null && <p className="text-[11px] text-stone-400 mt-0.5">{conn.followerCount.toLocaleString()} followers</p>}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-2 px-1.5 py-0.5 rounded-sm ${conn.isActive ? "text-emerald-700 bg-emerald-100" : "text-stone-500 bg-stone-100"}`}>
                  {conn.isActive ? "● Connected" : "○ Disconnected"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top performing posts */}
      {topPosts.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Top Performing Posts</p>
          </div>
          <div className="divide-y divide-stone-50">
            {topPosts.map((post: any, i: number) => {
              const platform = PLATFORMS.find((p) => p.id === post.platform);
              return (
                <div key={post.id} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50/40 transition-colors">
                  <span className="text-[11px] font-black text-stone-300 w-4">#{i + 1}</span>
                  <span className="text-lg flex-shrink-0">{platform?.icon ?? "📱"}</span>
                  <p className="flex-1 text-sm text-stone-700 line-clamp-1 min-w-0">{post.content}</p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400 flex-shrink-0">
                    <span>👁️ {(post.impressions ?? 0).toLocaleString()}</span>
                    <span>❤️ {post.likes ?? 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}