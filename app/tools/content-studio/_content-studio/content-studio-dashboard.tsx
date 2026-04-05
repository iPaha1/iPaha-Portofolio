"use client";

// =============================================================================
// isaacpaha.com — Content Studio AI — Creator Workspace Dashboard
// app/tools/content-studio/_content-studio/content-studio-dashboard.tsx
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  Film, Star, Trash2, Loader2, ChevronDown, ChevronUp, RefreshCw,
  Check, Zap, TrendingUp, Target, Flame, Edit2, Save, ExternalLink,
  Globe, Clock, Type, BarChart2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id:               string;
  topic:            string;
  platform:         string;
  tone:             string;
  title?:           string | null;
  hookText?:        string | null;
  status:           string;
  isSaved:          boolean;
  isStarred:        boolean;
  wordCount:        number;
  estimatedRuntime?:string | null;
  publishedUrl?:    string | null;
  notes?:           string | null;
  createdAt:        string;
  updatedAt:        string;
}

interface Workspace {
  totalProjects:  number;
  totalWords:     number;
  publishedCount: number;
  streakDays:     number;
  xpPoints:       number;
  platformsJson:  string;
  tonesJson:      string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#8b5cf6";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:         { label: "Draft",         color: "#6b7280", bg: "#f3f4f6" },
  IN_PRODUCTION: { label: "In Production", color: "#f59e0b", bg: "#fef3c7" },
  FILMED:        { label: "Filmed",        color: "#3b82f6", bg: "#dbeafe" },
  EDITED:        { label: "Edited",        color: "#8b5cf6", bg: "#ede9fe" },
  PUBLISHED:     { label: "Published",     color: "#10b981", bg: "#d1fae5" },
};

const PLATFORM_EMOJI: Record<string, string> = {
  YOUTUBE_LONG:    "▶️", YOUTUBE_SHORT: "📱", TIKTOK: "🎵",
  INSTAGRAM_REELS: "📸", LINKEDIN_VIDEO: "💼", LINKEDIN_POST: "📝",
  TWITTER_THREAD:  "𝕏",  PODCAST_EPISODE: "🎙️", BLOG_POST: "📰", NEWSLETTER: "📧",
};

const fmtRel = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project, onDelete, onReopen,
}: {
  project:  Project;
  onDelete: (id: string) => void;
  onReopen: (p: Project) => void;
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note,        setNote]        = useState(project.notes ?? "");
  const [savingNote,  setSavingNote]  = useState(false);
  const [status,      setStatus]      = useState(project.status);
  const [isStarred,   setIsStarred]   = useState(project.isStarred);
  const [deleting,    setDeleting]    = useState(false);

  const statusCfg = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;

  const patch = async (action: string, data: any) => {
    await fetch(`/api/tools/content-studio/save?id=${project.id}&action=${action}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).catch(() => {});
  };

  const toggleStar = async () => { const n = !isStarred; setIsStarred(n); await patch("star", { isStarred: n }); };
  const updateStatus = async (s: string) => { setStatus(s); await patch("status", { status: s }); };
  const saveNote = async () => { setSavingNote(true); await patch("notes", { notes: note }); setSavingNote(false); setEditingNote(false); };
  const handleDelete = async () => { setDeleting(true); await fetch(`/api/tools/content-studio/save?id=${project.id}`, { method: "DELETE" }); onDelete(project.id); };

  const STATUSES = ["DRAFT", "IN_PRODUCTION", "FILMED", "EDITED", "PUBLISHED"] as const;

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}10` }}>
            {PLATFORM_EMOJI[project.platform] ?? "🎬"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm"
                style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}>
                {statusCfg.label}
              </span>
              {project.estimatedRuntime && (
                <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />{project.estimatedRuntime}
                </span>
              )}
              {project.wordCount > 0 && (
                <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                  <Type className="w-3 h-3" />{project.wordCount.toLocaleString()}w
                </span>
              )}
            </div>
            <p className="text-sm font-black text-stone-900 leading-snug line-clamp-1">
              {project.title ?? project.topic.slice(0, 80)}
            </p>
            {project.hookText && (
              <p className="text-xs text-stone-400 mt-0.5 italic line-clamp-1">"{project.hookText}"</p>
            )}
            <p className="text-[10px] text-stone-300 mt-1">{fmtRel(project.updatedAt)}</p>
          </div>
          <button onClick={toggleStar}
            className={`w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0 transition-colors ${isStarred ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}>
            <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {/* Status pipeline */}
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {STATUSES.map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} onClick={() => updateStatus(s)}
                className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-sm border transition-all ${
                  status === s ? "text-white border-transparent" : "bg-white text-stone-400 border-stone-200 hover:border-stone-400"
                }`}
                style={status === s ? { backgroundColor: cfg.color } : {}}>
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onReopen(project)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm"
            style={{ backgroundColor: ACCENT }}>
            <ExternalLink className="w-3.5 h-3.5" />Reopen
          </button>
          <button onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Notes
          </button>
          {status === "PUBLISHED" && project.publishedUrl && (
            <a href={project.publishedUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-2 rounded-sm transition-colors">
              <Globe className="w-3.5 h-3.5" />View
            </a>
          )}
          <button onClick={handleDelete} disabled={deleting} className="ml-auto text-stone-300 hover:text-red-400 transition-colors">
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
                    placeholder="Production notes, publish date, links…"
                    className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-violet-400 resize-none" />
                  <button onClick={saveNote} disabled={savingNote}
                    className="flex flex-col items-center gap-1 text-[10px] font-bold px-2 py-2 rounded-sm text-white disabled:opacity-60"
                    style={{ backgroundColor: ACCENT }}>
                    {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                  </button>
                </div>
              ) : <p className="text-xs text-stone-500 italic">{note || "No notes yet."}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Platform / Tone Stats ────────────────────────────────────────────────────

function StatsChart({ json, label, emojiMap }: { json: string; label: string; emojiMap: Record<string, string> }) {
  const items: { [key: string]: string | number }[] = React.useMemo(() => {
    try { return JSON.parse(json ?? "[]"); } catch { return []; }
  }, [json]);
  if (!items.length) return null;
  const key  = Object.keys(items[0]).find(k => k !== "count") ?? "";
  const max  = Math.max(...items.map((i: any) => i.count), 1);
  const COLORS = ["#8b5cf6", "#f97316", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#14b8a6", "#ef4444"];
  return (
    <div className="bg-white border border-stone-100 rounded-sm p-5">
      <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">{label}</p>
      <div className="space-y-2.5">
        {[...items].sort((a: any, b: any) => b.count - a.count).slice(0, 6).map((item: any, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-700">
                {emojiMap[item[key]] ?? "📄"} {String(item[key]).replace(/_/g, " ")}
              </span>
              <span className="text-xs font-bold" style={{ color: COLORS[i % COLORS.length] }}>{item.count}×</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}
                initial={{ width: 0 }} animate={{ width: `${(item.count / max) * 100}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

interface ContentStudioDashboardProps {
  onReopenProject: (project: Project) => void;
}

export function ContentStudioDashboard({ onReopenProject }: ContentStudioDashboardProps) {
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<"all" | "drafts" | "published" | "starred">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/content-studio/save");
      const data = await res.json();
      setProjects(data.projects ?? []);
      setWorkspace(data.workspace ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string) => setProjects(p => p.filter(proj => proj.id !== id));

  const filtered = projects.filter(p => {
    if (filter === "drafts")    return p.status === "DRAFT";
    if (filter === "published") return p.status === "PUBLISHED";
    if (filter === "starred")   return p.isStarred;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  const PLATFORM_EMOJI: Record<string, string> = {
    YOUTUBE_LONG: "▶️", YOUTUBE_SHORT: "📱", TIKTOK: "🎵",
    INSTAGRAM_REELS: "📸", LINKEDIN_VIDEO: "💼", LINKEDIN_POST: "📝",
    TWITTER_THREAD: "𝕏", PODCAST_EPISODE: "🎙️", BLOG_POST: "📰", NEWSLETTER: "📧",
  };
  const TONE_EMOJI: Record<string, string> = {
    EDUCATIONAL: "🎓", ENTERTAINING: "🎭", INSPIRATIONAL: "✨", CONTROVERSIAL: "🔥",
    STORYTELLING: "📖", NEWS_COMMENTARY: "📡", TUTORIAL: "🪜", VLOG: "🎥",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {(workspace || projects.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Projects",       value: projects.length,             icon: Film,      color: ACCENT    },
            { label: "Words Written",  value: workspace?.totalWords?.toLocaleString() ?? "0", icon: Type, color: "#f97316" },
            { label: "Published",      value: workspace?.publishedCount ?? 0, icon: Globe,  color: "#10b981" },
            { label: "Day Streak",     value: workspace?.streakDays ?? 0,   icon: Flame,     color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
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

      {/* Stats charts */}
      {workspace && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatsChart json={workspace.platformsJson} label="Platforms Used" emojiMap={PLATFORM_EMOJI} />
          <StatsChart json={workspace.tonesJson}     label="Tones Used"     emojiMap={TONE_EMOJI}     />
        </div>
      )}

      {/* Filter tabs */}
      {projects.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {([
              { id: "all",       label: `All (${projects.length})`                           },
              { id: "drafts",    label: `Drafts (${projects.filter(p => p.status === "DRAFT").length})`         },
              { id: "published", label: `Published (${projects.filter(p => p.status === "PUBLISHED").length})`  },
              { id: "starred",   label: "⭐ Starred"                                          },
            ] as const).map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
                  filter === f.id ? "text-white border-transparent" : "bg-white text-stone-400 border-stone-200"
                }`}
                style={filter === f.id ? { backgroundColor: ACCENT } : {}}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-sm bg-stone-50">
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="text-base font-black text-stone-900 mb-2">No projects yet</h3>
          <p className="text-sm text-stone-500 max-w-xs">Create your first piece of content and click Save to track it here.</p>
        </div>
      )}

      {/* Project cards */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} onDelete={handleDelete} onReopen={onReopenProject} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}