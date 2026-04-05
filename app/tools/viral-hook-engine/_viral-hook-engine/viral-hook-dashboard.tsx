"use client";

// =============================================================================
// isaacpaha.com — Viral Hook Engine — Creator Workspace Dashboard
// app/tools/viral-hook-engine/_viral-hook/viral-hook-dashboard.tsx
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  Flame, Star, Trash2, Loader2, ChevronDown, ChevronUp,
  RefreshCw, Copy, Check, Zap, BarChart2, Calendar,
  TrendingUp, Target, Edit2, Save, X, ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedQuery {
  id:            string;
  originalIdea:  string;
  platform:      string;
  niche?:        string | null;
  viralityScore?: number | null;
  viralityTier?: string | null;
  hooksGenerated:number;
  isStarred:     boolean;
  notes?:        string | null;
  createdAt:     string;
  resultJson?:   string | null;
}

interface SavedHook {
  hook:            string;
  type:            string;
  typeName:        string;
  score:           number;
  savedAt:         string;
  psychologicalTrigger?: string;
}

interface CalendarItem {
  title:    string;
  platform: string;
  status:   "idea" | "in-progress" | "published";
  addedAt:  string;
}

interface Workspace {
  savedHooksJson:  string;
  contentCalendar: string;
  totalQueries:    number;
  hooksGenerated:  number;
  streakDays:      number;
  xpPoints:        number;
  platformsJson:   string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#f97316";

const TIER_CFG: Record<string, { color: string; emoji: string }> = {
  SLEEPER:   { color: "#6b7280", emoji: "😴" },
  DECENT:    { color: "#3b82f6", emoji: "👍" },
  STRONG:    { color: "#f59e0b", emoji: "🔥" },
  HOT:       { color: "#f97316", emoji: "🚀" },
  EXPLOSIVE: { color: "#ef4444", emoji: "💥" },
};

const PLATFORM_EMOJI: Record<string, string> = {
  YOUTUBE: "▶️", TIKTOK: "🎵", INSTAGRAM_REELS: "📸",
  TWITTER_X: "𝕏", LINKEDIN: "💼", PODCAST: "🎙️", NEWSLETTER: "📧", BLOG: "📝",
};

const fmtRel = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// ─── Saved Analysis Card ──────────────────────────────────────────────────────

function AnalysisCard({
  query, onDelete, onReopen,
}: {
  query:    SavedQuery;
  onDelete: (id: string) => void;
  onReopen: (q: SavedQuery) => void;
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note,        setNote]        = useState(query.notes ?? "");
  const [savingNote,  setSavingNote]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [isStarred,   setIsStarred]   = useState(query.isStarred);

  const tier = TIER_CFG[query.viralityTier ?? "DECENT"] ?? TIER_CFG.DECENT;

  const toggleStar = async () => {
    const n = !isStarred; setIsStarred(n);
    await fetch(`/api/tools/viral-hook-engine/save?id=${query.id}&action=star`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isStarred: n }),
    }).catch(() => {});
  };

  const saveNote = async () => {
    setSavingNote(true);
    await fetch(`/api/tools/viral-hook-engine/save?id=${query.id}&action=notes`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: note }),
    }).catch(() => {});
    setSavingNote(false); setEditingNote(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/tools/viral-hook-engine/save?id=${query.id}`, { method: "DELETE" });
    onDelete(query.id);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}10` }}>
            {PLATFORM_EMOJI[query.platform] ?? "🔥"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              {query.viralityTier && (
                <span className="text-[10px] font-black" style={{ color: tier.color }}>
                  {tier.emoji} {query.viralityTier}
                </span>
              )}
              {query.viralityScore != null && (
                <span className="text-[10px] font-black text-stone-400">Score: {query.viralityScore}/100</span>
              )}
              {query.niche && (
                <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{query.niche}</span>
              )}
            </div>
            <p className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">{query.originalIdea}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-stone-400">
              <span>{fmtRel(query.createdAt)}</span>
              <span>{query.hooksGenerated} hooks generated</span>
            </div>
          </div>
          <button onClick={toggleStar}
            className={`w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0 transition-colors ${isStarred ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}>
            <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onReopen(query)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm"
            style={{ backgroundColor: ACCENT }}>
            <ExternalLink className="w-3.5 h-3.5" />Reopen
          </button>
          <button onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Less" : "Notes"}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="ml-auto text-stone-300 hover:text-red-400 transition-colors">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 bg-stone-50/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Notes</p>
                <button onClick={() => setEditingNote(p => !p)} className="text-[10px] text-stone-400 hover:text-stone-700 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" />{editingNote ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingNote ? (
                <div className="flex gap-2">
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                    placeholder="Add notes…"
                    className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-orange-400 resize-none" />
                  <button onClick={saveNote} disabled={savingNote}
                    className="flex flex-col items-center gap-1 text-[10px] font-bold px-2 py-2 rounded-sm text-white disabled:opacity-60"
                    style={{ backgroundColor: ACCENT }}>
                    {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                  </button>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic">{note || "No notes yet."}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Saved Hooks Library ──────────────────────────────────────────────────────

function HooksLibrary({ hooks, onRemove }: { hooks: SavedHook[]; onRemove: (hook: string) => void }) {
  const [copied, setCopied] = useState("");

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!hooks.length) return (
    <div className="text-center py-8 bg-stone-50 border border-dashed border-stone-200 rounded-sm">
      <p className="text-sm text-stone-400">No saved hooks yet.</p>
      <p className="text-xs text-stone-300 mt-1">Star hooks in your analyses to save them here.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {hooks.map((hook, i) => (
        <div key={i} className="bg-white border border-stone-100 rounded-sm px-4 py-3 flex items-start gap-3 hover:border-stone-200 transition-all">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800 leading-snug">{hook.hook}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-stone-400">{hook.typeName}</span>
              <span className="text-[10px] font-black" style={{ color: hook.score >= 80 ? "#10b981" : hook.score >= 60 ? "#f59e0b" : "#6b7280" }}>
                {hook.score}/100
              </span>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => copy(hook.hook)}
              className={`w-7 h-7 flex items-center justify-center rounded-sm border transition-all ${copied === hook.hook ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "border-stone-200 text-stone-400 hover:border-stone-400"}`}>
              {copied === hook.hook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onRemove(hook.hook)}
              className="w-7 h-7 flex items-center justify-center rounded-sm border border-stone-200 text-stone-300 hover:border-red-300 hover:text-red-400 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Platform Usage ───────────────────────────────────────────────────────────

function PlatformUsage({ platformsJson }: { platformsJson: string }) {
  const platforms: { platform: string; count: number }[] = React.useMemo(() => {
    try { return JSON.parse(platformsJson ?? "[]"); } catch { return []; }
  }, [platformsJson]);
  if (!platforms.length) return null;
  const max = Math.max(...platforms.map(p => p.count), 1);
  const COLORS = ["#f97316", "#ef4444", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#14b8a6"];
  return (
    <div className="bg-white border border-stone-100 rounded-sm p-5">
      <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Platform Usage</p>
      <div className="space-y-3">
        {[...platforms].sort((a, b) => b.count - a.count).map((p, i) => (
          <div key={p.platform}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-700">
                {PLATFORM_EMOJI[p.platform] ?? "📱"} {p.platform.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-bold" style={{ color: COLORS[i % COLORS.length] }}>{p.count}×</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}
                initial={{ width: 0 }} animate={{ width: `${(p.count / max) * 100}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

interface ViralHookDashboardProps {
  onReopenQuery: (resultJson: string, idea: string, platform: string) => void;
}

export function ViralHookDashboard({ onReopenQuery }: ViralHookDashboardProps) {
  const [queries,   setQueries]   = useState<SavedQuery[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"analyses" | "hooks" | "platforms">("analyses");
  const [filter,    setFilter]    = useState<"all" | "starred">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/viral-hook-engine/save");
      const data = await res.json();
      setQueries(data.queries ?? []);
      setWorkspace(data.workspace ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete    = (id: string) => setQueries(p => p.filter(q => q.id !== id));

  const savedHooks: SavedHook[] = React.useMemo(() => {
    try { return JSON.parse(workspace?.savedHooksJson ?? "[]"); } catch { return []; }
  }, [workspace?.savedHooksJson]);

  const removeHook = async (hookText: string) => {
    await fetch("/api/tools/viral-hook-engine/save?action=removeHook", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hook: hookText }),
    }).catch(() => {});
    load();
  };

  const filtered = queries.filter(q => filter === "all" || q.isStarred);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {(workspace || queries.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Analyses Saved",   value: queries.length,                icon: Flame,     color: ACCENT    },
            { label: "Hooks Generated",  value: workspace?.hooksGenerated ?? 0, icon: Zap,       color: "#8b5cf6" },
            { label: "XP Points",        value: workspace?.xpPoints ?? 0,       icon: TrendingUp, color: "#f59e0b" },
            { label: "Day Streak",       value: workspace?.streakDays ?? 0,      icon: Target,    color: "#10b981" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-stone-400 font-semibold mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1">
        {([
          { id: "analyses", label: `Analyses (${queries.length})` },
          { id: "hooks",    label: `Saved Hooks (${savedHooks.length})` },
          { id: "platforms",label: "Platforms" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
              activeTab === t.id ? "text-white border-transparent" : "bg-white text-stone-400 border-stone-200"
            }`}
            style={activeTab === t.id ? { backgroundColor: ACCENT } : {}}>
            {t.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Analyses tab */}
      {activeTab === "analyses" && (
        <div className="space-y-3">
          {queries.length > 0 && (
            <div className="flex gap-1">
              {(["all", "starred"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors capitalize ${
                    filter === f ? "text-white border-transparent" : "bg-white text-stone-400 border-stone-200"
                  }`}
                  style={filter === f ? { backgroundColor: ACCENT } : {}}>
                  {f === "all" ? `All (${queries.length})` : "⭐ Starred"}
                </button>
              ))}
            </div>
          )}
          {queries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-sm bg-stone-50">
              <div className="text-4xl mb-4">🔥</div>
              <h3 className="text-base font-black text-stone-900 mb-2">No saved analyses yet</h3>
              <p className="text-sm text-stone-500 max-w-xs">Run the Hook Engine and click Save Analysis to track your results here.</p>
            </div>
          )}
          <AnimatePresence>
            {filtered.map(q => (
              <AnalysisCard key={q.id} query={q} onDelete={handleDelete}
                onReopen={(sq) => { if (sq.resultJson) onReopenQuery(sq.resultJson, sq.originalIdea, sq.platform); }} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Hooks library tab */}
      {activeTab === "hooks" && (
        <HooksLibrary hooks={savedHooks} onRemove={removeHook} />
      )}

      {/* Platforms tab */}
      {activeTab === "platforms" && workspace && (
        <PlatformUsage platformsJson={workspace.platformsJson} />
      )}
    </div>
  );
}