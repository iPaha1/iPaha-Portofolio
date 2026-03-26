"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: Tag Manager
// components/admin/hub/tags/hub-tags.tsx
//
// Displays all tags across the KB with entry counts.
// Allows: browse by tag, rename tag across all entries, merge tags, delete tag.
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag, Loader2, Search, Edit2, Trash2,
  Check, X, RefreshCw, ChevronDown,
  ArrowRight, Hash,
} from "lucide-react";
import { TAB_CFG, type HubType } from "../_shared/hub-types";
import { ConfirmDialog } from "../_shared/ui-atoms";

// ─── Types ────────────────────────────────────────────────────────────────────

type TagEntry = {
  tag:     string;
  count:   number;
  types:   HubType[];
  entries: { id: string; title: string; type: HubType }[];
};

// ─── Tag row ─────────────────────────────────────────────────────────────────

function TagRow({
  tag: tagData, onRename, onDelete, onMerge,
}: {
  tag:      TagEntry;
  onRename: (oldTag: string, newTag: string) => Promise<void>;
  onDelete: (tag: string) => void;
  onMerge:  (fromTag: string) => void;
}) {
  const [editing,   setEditing]   = useState(false);
  const [newName,   setNewName]   = useState(tagData.tag);
  const [expanded,  setExpanded]  = useState(false);
  const [saving,    setSaving]    = useState(false);

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === tagData.tag) { setEditing(false); return; }
    setSaving(true);
    await onRename(tagData.tag, newName.trim());
    setSaving(false);
    setEditing(false);
  };

  // Colors cycle based on tag hash
  const COLORS = ["#f59e0b", "#8b5cf6", "#10b981", "#3b82f6", "#ef4444", "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1"];
  const colorIdx = tagData.tag.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length;
  const color = COLORS[colorIdx];

  return (
    <div className="border border-stone-100 rounded-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50/60 transition-colors">
        {/* Tag badge */}
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <Hash className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
              autoFocus
              className="flex-1 text-sm font-semibold border border-amber-300 rounded-sm px-2 py-1 focus:outline-none bg-white"
            />
            <button onClick={handleRename} disabled={saving}
              className="text-emerald-500 hover:text-emerald-700 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => { setEditing(false); setNewName(tagData.tag); }}
              className="text-stone-400 hover:text-stone-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-sm flex-shrink-0"
              style={{ color, backgroundColor: `${color}15` }}
            >
              #{tagData.tag}
            </span>
            {/* Type icons */}
            <div className="flex gap-1 flex-wrap">
              {tagData.types.slice(0, 5).map((t) => {
                const cfg = Object.values(TAB_CFG).find((c) => c.type === t) as { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string } | undefined;
                return cfg ? (
                  <cfg.icon key={t} className="w-3 h-3" style={{ color: cfg.color }} />
                ) : null;
              })}
            </div>
          </div>
        )}

        <span className="text-[11px] font-bold text-stone-500 flex-shrink-0 w-8 text-right">
          {tagData.count}
        </span>

        {!editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setExpanded((p) => !p)}
              className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-stone-600 rounded-sm hover:bg-stone-100 transition-colors">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            <button onClick={() => setEditing(true)}
              className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-amber-500 rounded-sm hover:bg-amber-50 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onMerge(tagData.tag)}
              className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-blue-500 rounded-sm hover:bg-blue-50 transition-colors"
              title="Merge into another tag">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(tagData.tag)}
              className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-red-500 rounded-sm hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded: show linked entries */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-100 px-4 py-2 space-y-0.5 bg-stone-50/40">
              {tagData.entries.slice(0, 10).map((e) => {
                const cfg = Object.values(TAB_CFG).find((c) => c.type === e.type);
                return (
                  <div key={e.id} className="flex items-center gap-2 py-1">
                    {cfg && <cfg.icon className="w-3 h-3 flex-shrink-0" style={{ color: cfg.color }} />}
                    <span className="text-xs text-stone-600 truncate">{e.title}</span>
                  </div>
                );
              })}
              {tagData.count > 10 && (
                <p className="text-[10px] text-stone-400 py-1">+ {tagData.count - 10} more</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Merge dialog ─────────────────────────────────────────────────────────────

function MergeDialog({
  fromTag, allTags, onConfirm, onCancel, loading,
}: {
  fromTag:  string;
  allTags:  string[];
  onConfirm:(into: string) => void;
  onCancel: () => void;
  loading:  boolean;
}) {
  const [into, setInto] = useState("");
  const options = allTags.filter((t) => t !== fromTag);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-sm border border-stone-100 shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-black text-stone-900 mb-1">Merge tag</p>
        <p className="text-xs text-stone-500 mb-4">
          All entries tagged <strong className="text-stone-700">#{fromTag}</strong> will be re-tagged with the selected tag.
        </p>
        <div className="mb-4">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Merge into</label>
          <select value={into} onChange={(e) => setInto(e.target.value)}
            className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white">
            <option value="">— select target tag —</option>
            {options.map((t) => <option key={t} value={t}>#{t}</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-sm hover:border-stone-400 transition-colors">Cancel</button>
          <button onClick={() => onConfirm(into)} disabled={!into || loading}
            className="text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Merge
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function HubTags() {
  const [tags,    setTags]    = useState<TagEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [mergeFrom, setMergeFrom] = useState<string | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; tag: string; action?: () => Promise<void> }>({ open: false, tag: "" });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/hub/tags");
      const data = await res.json();
      setTags(data.tags ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRename = async (oldTag: string, newTag: string) => {
    await fetch("/api/admin/hub/tags", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "rename", oldTag, newTag }),
    });
    setTags((prev) => prev.map((t) => t.tag === oldTag ? { ...t, tag: newTag } : t));
  };

  const handleDelete = (tag: string) => {
    setConfirm({
      open: true, tag,
      action: async () => {
        await fetch("/api/admin/hub/tags", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ action: "delete", tag }),
        });
        setTags((prev) => prev.filter((t) => t.tag !== tag));
      },
    });
  };

  const handleMerge = async (intoTag: string) => {
    if (!mergeFrom) return;
    setMergeLoading(true);
    await fetch("/api/admin/hub/tags", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "merge", fromTag: mergeFrom, intoTag }),
    });
    setMergeFrom(null);
    setMergeLoading(false);
    await load();
  };

  const filtered = tags.filter((t) => t.tag.toLowerCase().includes(search.toLowerCase()));
  const totalTags = tags.length;
  const totalTagUses = tags.reduce((a, t) => a + t.count, 0);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <ConfirmDialog
        open={confirm.open}
        title={`Delete tag "#${confirm.tag}"?`}
        message="This tag will be removed from all entries. The entries themselves will not be deleted."
        danger
        confirmLabel="Delete tag"
        onConfirm={async () => { if (confirm.action) { setConfirmLoading(true); await confirm.action(); setConfirmLoading(false); } setConfirm({ open: false, tag: "" }); }}
        onCancel={() => setConfirm({ open: false, tag: "" })}
        loading={confirmLoading}
      />

      {mergeFrom && (
        <MergeDialog
          fromTag={mergeFrom}
          allTags={tags.map((t) => t.tag)}
          onConfirm={handleMerge}
          onCancel={() => setMergeFrom(null)}
          loading={mergeLoading}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-black text-stone-800">Tag Manager</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {totalTags} unique tags · {totalTagUses} total uses
            </p>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2.5 py-1.5 rounded-sm transition-colors">
            <RefreshCw className="w-3 h-3" />Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tags…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Tags */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-10 h-10 text-stone-200 mx-auto mb-3" />
            <p className="text-sm text-stone-400">{search ? `No tags matching "${search}"` : "No tags yet"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.sort((a, b) => b.count - a.count).map((t) => (
              <TagRow
                key={t.tag}
                tag={t}
                onRename={handleRename}
                onDelete={handleDelete}
                onMerge={setMergeFrom}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}