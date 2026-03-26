"use client";

// =============================================================================
// isaacpaha.com — Scripture Explorer: My Library Dashboard
// app/tools/scripture-explorer/_components/scripture-dashboard.tsx
//
// Personal library for signed-in users:
//   - All saved explorations with topic, traditions, and summary
//   - Notes per exploration
//   - Star favourites
//   - Re-open any saved exploration
//   - Delete
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  BookOpen, Star, Trash2, Loader2, ChevronDown, ChevronUp,
  RefreshCw, BookmarkCheck, MessageSquare, Edit2, Check, X,
  Lightbulb, Calendar, Layers, Link2, History, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedNote {
  id:        string;
  content:   string;
  updatedAt: string;
}

interface SavedExploration {
  id:         string;
  topic:      string;
  query:      string;
  mode:       string;
  traditions: string;
  isStarred:  boolean;
  resultJson: string;
  createdAt:  string;
  notes:      SavedNote[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1)  return "today";
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const MODE_LABEL: Record<string, { label: string; color: string }> = {
  compare:    { label: "Comparison",  color: "#6366f1" },
  figure:     { label: "Figure",      color: "#f59e0b" },
  "deep-dive":{ label: "Deep Dive",   color: "#10b981" },
};

// ─── Exploration Card ─────────────────────────────────────────────────────────

function ExplorationCard({
  exploration,
  onDelete,
  onReopen,
  onToggleStar,
}: {
  exploration:   SavedExploration;
  onDelete:      (id: string) => void;
  onReopen:      (exploration: SavedExploration) => void;
  onToggleStar:  (id: string, current: boolean) => void;
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [editNote,   setEditNote]   = useState(false);
  const [noteText,   setNoteText]   = useState(exploration.notes[0]?.content ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const result   = React.useMemo(() => { try { return JSON.parse(exploration.resultJson); } catch { return null; } }, [exploration.resultJson]);
  const modeCfg  = MODE_LABEL[exploration.mode] ?? MODE_LABEL.compare;
  const traditions = exploration.traditions?.split(", ") ?? [];

  const TRAD_EMOJI: Record<string, string> = { Christianity: "✝️", Islam: "☪️", Judaism: "✡️" };
  const TRAD_COLOR: Record<string, string> = { Christianity: "#3b82f6", Islam: "#10b981", Judaism: "#f59e0b" };

  const saveNote = async () => {
    setSavingNote(true);
    await fetch(`/api/tools/scripture-explorer/save?id=${exploration.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteText }),
    }).catch(() => {});
    setSavingNote(false);
    setEditNote(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/tools/scripture-explorer/save?id=${exploration.id}`, { method: "DELETE" });
    onDelete(exploration.id);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`bg-white border rounded-sm overflow-hidden transition-all ${exploration.isStarred ? "border-amber-200" : "border-stone-100 hover:border-stone-200"}`}>

      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                style={{ color: modeCfg.color, backgroundColor: `${modeCfg.color}15` }}>
                {modeCfg.label}
              </span>
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />{fmtDate(exploration.createdAt)}
              </span>
            </div>
            <p className="text-sm font-black text-stone-900 leading-snug">{exploration.topic}</p>
          </div>
          <button onClick={() => onToggleStar(exploration.id, exploration.isStarred)}
            className={`flex-shrink-0 transition-colors ${exploration.isStarred ? "text-amber-400" : "text-stone-200 hover:text-amber-400"}`}>
            <Star className={`w-5 h-5 ${exploration.isStarred ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {/* Traditions */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {traditions.map(t => (
            <span key={t} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm border"
              style={{ color: TRAD_COLOR[t] ?? "#6366f1", backgroundColor: `${TRAD_COLOR[t] ?? "#6366f1"}10`, borderColor: `${TRAD_COLOR[t] ?? "#6366f1"}30` }}>
              {TRAD_EMOJI[t] ?? "📖"} {t}
            </span>
          ))}
        </div>

        {/* Brief summary */}
        {result?.introduction && (
          <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-3">{result.introduction}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onReopen(exploration)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-sm transition-colors">
            <BookOpen className="w-3.5 h-3.5" />Reopen
          </button>
          <button onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Less" : "Notes & Details"}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1 text-xs text-stone-200 hover:text-red-500 transition-colors ml-auto disabled:opacity-60">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded details + notes */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 bg-stone-50/30 space-y-4">

              {/* Shared connections preview */}
              {result?.sharedConnections?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Shared Connections Found</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.sharedConnections.map((c: any) => (
                      <span key={c.title} className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-sm font-semibold">
                        {c.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key differences preview */}
              {result?.keyDifferences?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Key Differences Covered</p>
                  <div className="space-y-1">
                    {result.keyDifferences.slice(0, 2).map((d: any) => (
                      <p key={d.aspect} className="text-xs text-stone-500">• {d.aspect}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">My Notes</p>
                  {!editNote && (
                    <button onClick={() => setEditNote(true)}
                      className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-700 transition-colors">
                      <Edit2 className="w-3 h-3" />Edit
                    </button>
                  )}
                </div>
                {editNote ? (
                  <div className="space-y-2">
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
                      placeholder="Add your study notes, reflections, or insights here…"
                      className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveNote} disabled={savingNote}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-sm transition-colors disabled:opacity-60">
                        {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Save note
                      </button>
                      <button onClick={() => { setEditNote(false); setNoteText(exploration.notes[0]?.content ?? ""); }}
                        className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-3 py-1.5 rounded-sm transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : noteText ? (
                  <p className="text-xs text-stone-600 bg-white border border-stone-100 rounded-sm px-3 py-2 leading-relaxed">{noteText}</p>
                ) : (
                  <button onClick={() => setEditNote(true)}
                    className="text-xs text-stone-300 hover:text-stone-500 italic transition-colors">
                    No notes yet — click to add
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

interface ScriptureDashboardProps {
  onReopenExploration: (resultJson: string, query: string, mode: string) => void;
}

export function ScriptureDashboard({ onReopenExploration }: ScriptureDashboardProps) {
  const [explorations, setExplorations] = useState<SavedExploration[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<"all" | "starred">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/scripture-explorer/save");
      const data = await res.json();
      setExplorations(data.explorations ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete      = (id: string)                   => setExplorations(p => p.filter(e => e.id !== id));
  const handleToggleStar  = async (id: string, current: boolean) => {
    setExplorations(p => p.map(e => e.id === id ? { ...e, isStarred: !current } : e));
    await fetch(`/api/tools/scripture-explorer/save?id=${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isStarred: !current }),
    }).catch(() => {});
  };

  const filtered = explorations.filter(e => filter === "all" || e.isStarred);
  const byMode   = explorations.reduce<Record<string, number>>((a, e) => { a[e.mode] = (a[e.mode] ?? 0) + 1; return a; }, {});

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      {explorations.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Saved",    value: explorations.length,  color: "#6366f1",  icon: BookOpen    },
            { label: "Comparisons",    value: byMode.compare ?? 0,  color: "#3b82f6",  icon: Layers      },
            { label: "Deep Dives",     value: (byMode["deep-dive"] ?? 0) + (byMode.figure ?? 0), color: "#10b981", icon: History },
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

      {/* Controls */}
      {explorations.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {(["all", "starred"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs font-bold px-3 py-2 rounded-sm border transition-colors capitalize ${
                  filter === f ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-stone-400 border-stone-200"
                }`}>
                {f === "starred" ? "⭐ Starred" : `All (${explorations.length})`}
              </button>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      )}

      {/* Empty state */}
      {explorations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-stone-50 border border-dashed border-stone-200 rounded-sm">
          <div className="w-16 h-16 rounded-sm bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center mb-5 text-3xl">📖</div>
          <h3 className="text-base font-black text-stone-900 mb-2">Your library is empty</h3>
          <p className="text-sm text-stone-500 max-w-xs leading-relaxed mb-1">
            Explore a topic and click <span className="font-bold">Save</span> to build your personal library of scripture explorations.
          </p>
          <p className="text-xs text-stone-400">You can save up to 50 explorations, add personal notes, and star your favourites.</p>
        </div>
      )}

      {/* Explorations list */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(e => (
              <ExplorationCard key={e.id} exploration={e}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
                onReopen={(ex) => {
                  let parsed: any = null;
                  try { parsed = JSON.parse(ex.resultJson); } catch {}
                  onReopenExploration(ex.resultJson, ex.query, ex.mode);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Tip */}
      {explorations.length > 0 && explorations.length < 5 && (
        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-sm px-4 py-3.5">
          <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-700 leading-relaxed">
            <span className="font-bold">Tip:</span> Add notes to each exploration to record your reflections and insights. Your library becomes a personal study record over time.
          </p>
        </div>
      )}
    </div>
  );
}