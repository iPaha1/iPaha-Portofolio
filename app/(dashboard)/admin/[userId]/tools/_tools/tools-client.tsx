"use client";

// =============================================================================
// isaacpaha.com — Tools Lab Admin Client
// components/admin/tools/tools-admin-client.tsx
//
// Three tabs:
//   1. Tools    — searchable, filterable list with inline actions + dashboard links
//   2. Editor   — create / edit tool form
//   3. Analytics — engagement overview (phase 1: static; phase 2: live charts)
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Plus, Search, Sparkles, Edit2, Trash2,
  Eye, Star, Copy, Check, X, AlertCircle, Loader2,
  ArrowLeft, Globe, Lock, Save,
  CheckSquare, Square, ExternalLink, 
  MoreHorizontal, BarChart2, Zap, 
  Cpu, Construction, Grid3x3, Pencil, Activity, 
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolStatus = "LIVE" | "BETA" | "COMING_SOON";

export type ToolSummary = {
  id:            string;
  title:         string;
  slug:          string;
  tagline:       string;
  category:      string;
  status:        ToolStatus;
  emoji:         string;
  tags:          string;
  coverImage:    string | null;
  isFeatured:    boolean;
  isPremium:     boolean;
  isInteractive: boolean;
  componentKey:  string | null;
  viewCount:     number;
  useCount:      number;
  rating:        number;
  ratingCount:   number;
  createdAt:     Date;
  updatedAt:     Date;
  _count?:       { usage: number };
};

type ToolFull = ToolSummary & {
  description: string;
};

type Stats = {
  total:          number;
  live:           number;
  beta:           number;
  comingSoon:     number;
  featured:       number;
  interactive:    number;
  premium:        number;
  totalViews:     number;
  totalUses:      number;
  recentUseCount: number;
  byStatus:       { status: ToolStatus; count: number }[];
  byCategory:     { category: string;   count: number }[];
  topUsed:        { id: string; title: string; slug: string; useCount: number; viewCount: number; category: string; emoji: string; status: ToolStatus }[];
};

interface Props {
  userId:          string;
  stats:           Stats;
  initialTools:    ToolSummary[];
  toolTotal:       number;
  toolPages:       number;
  initialTab:      "tools" | "editor" | "analytics";
  initialSearch:   string;
  initialCategory: string;
  initialStatus:   string;
  initialEditId?:  string;
  currentPage:     number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ToolStatus, { label: string; color: string; bg: string; dot: string }> = {
  LIVE:        { label: "Live",        color: "#059669", bg: "#d1fae5", dot: "#10b981" },
  BETA:        { label: "Beta",        color: "#d97706", bg: "#fef3c7", dot: "#f59e0b" },
  COMING_SOON: { label: "Coming Soon", color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

const CATEGORY_CFG: Record<string, { emoji: string; color: string; bg: string }> = {
  AI:           { emoji: "🤖", color: "#f59e0b", bg: "#fef3c7" },
  Career:       { emoji: "💼", color: "#ec4899", bg: "#fce7f3" },
  Startup:      { emoji: "🚀", color: "#10b981", bg: "#d1fae5" },
  Education:    { emoji: "📚", color: "#8b5cf6", bg: "#ede9fe" },
  Productivity: { emoji: "⚡", color: "#14b8a6", bg: "#ccfbf1" },
  Writing:      { emoji: "✍️", color: "#3b82f6", bg: "#dbeafe" },
};

const CATEGORIES = ["AI", "Career", "Startup", "Education", "Productivity", "Writing"];

const COMPONENT_KEYS = [
  { value: "cv-analyzer",             label: "AI CV Analyzer" },
  { value: "startup-idea-generator",  label: "Startup Idea Generator" },
  { value: "learning-roadmap",        label: "Learning Roadmap Generator" },
  { value: "reading-time-calculator", label: "Reading Time Calculator" },
  { value: "ai-cover-letter",         label: "AI Cover Letter Writer" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function fmtDate(d: Date | string): string {
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function CategoryBadge({ cat, sm }: { cat: string; sm?: boolean }) {
  const c = CATEGORY_CFG[cat] ?? { emoji: "🔧", color: "#f59e0b", bg: "#fef3c7" };
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-sm ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.emoji} {cat}
    </span>
  );
}

function StatusBadge({ status, sm }: { status: ToolStatus; sm?: boolean }) {
  const c = STATUS_CFG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-sm ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, message, danger = false, confirmLabel = "Confirm",
  onConfirm, onCancel, loading,
}: {
  open: boolean; title: string; message: string;
  danger?: boolean; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-sm border border-stone-100 shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
                <AlertCircle className={`w-4 h-4 ${danger ? "text-red-500" : "text-amber-500"}`} />
              </div>
              <div>
                <p className="text-sm font-black text-stone-900">{title}</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onCancel}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-sm hover:border-stone-400 transition-colors">
                Cancel
              </button>
              <button onClick={onConfirm} disabled={loading}
                className={`text-xs font-bold text-white px-4 py-2 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-2 ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}>
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Tool row ────────────────────────────────────────────────────────────────

function ToolRow({
  tool, userId, selected, onSelect, onEdit, onDelete, onToggleFeatured, onDuplicate,
}: {
  tool: ToolSummary;
  userId: string;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (tool: ToolSummary) => void;
  onDelete: (id: string, title: string) => void;
  onToggleFeatured: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dashboardHref = `/admin/${userId}/tools/${tool.id}`;
  const publicHref    = `/tools/${tool.slug}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex items-center gap-3 px-4 py-3.5 border-b border-stone-100 hover:bg-stone-50/60 transition-colors ${selected ? "bg-amber-50/40" : ""}`}
    >
      {/* Checkbox */}
      <button onClick={() => onSelect(tool.id)} className="flex-shrink-0">
        {selected
          ? <CheckSquare className="w-4 h-4 text-amber-500" />
          : <Square className="w-4 h-4 text-stone-200 group-hover:text-stone-400 transition-colors" />}
      </button>

      {/* Featured star */}
      <button onClick={() => onToggleFeatured(tool.id)} className="flex-shrink-0" title={tool.isFeatured ? "Unfeature" : "Feature"}>
        {tool.isFeatured
          ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          : <Star className="w-4 h-4 text-stone-200 group-hover:text-stone-300 transition-colors" />}
      </button>

      {/* Emoji */}
      <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0 border border-stone-100"
        style={{ backgroundColor: `${(CATEGORY_CFG[tool.category] ?? CATEGORY_CFG.AI).color}12` }}>
        {tool.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onEdit(tool)}
            className="text-sm font-bold text-stone-800 hover:text-amber-600 transition-colors text-left leading-snug">
            {tool.title}
          </button>
          {tool.isFeatured && (
            <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Featured</span>
          )}
          {tool.isPremium && (
            <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-0.5">
              <Lock className="w-2 h-2" />Premium
            </span>
          )}
          {tool.isInteractive && (
            <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-0.5">
              <Zap className="w-2 h-2" />Interactive
            </span>
          )}
        </div>
        <p className="text-xs text-stone-400 mt-0.5 line-clamp-1 pr-4">{tool.tagline}</p>
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          <CategoryBadge cat={tool.category} sm />
          <StatusBadge status={tool.status} sm />
          {parseTags(tool.tags).slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{t}</span>
          ))}
          <span className="text-[10px] text-stone-300">·</span>
          <span className="text-[10px] text-stone-400">{fmtDate(tool.updatedAt)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden lg:flex items-center gap-3 flex-shrink-0 text-[11px] text-stone-400">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{tool.viewCount.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{tool.useCount?.toLocaleString()}</span>
        {tool.ratingCount > 0 && (
          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{tool.rating.toFixed(1)}</span>
        )}
      </div>

      {/* Dashboard link — the key feature */}
      <Link
        href={dashboardHref}
        className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-stone-500 border border-stone-200 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 px-2.5 py-1.5 rounded-sm transition-colors flex-shrink-0"
        title="Open tool dashboard"
      >
        <BarChart2 className="w-3 h-3" />Dashboard
      </Link>

      {/* Actions menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button onClick={() => setMenuOpen((p) => !p)}
          className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-20 w-48 bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden"
            >
              {[
                { label: "Edit Tool",          icon: Edit2,          action: () => { onEdit(tool); setMenuOpen(false); } },
                { label: "Open Dashboard",     icon: BarChart2,      action: () => { window.location.href = dashboardHref; } },
                { label: "View Live",          icon: ExternalLink,   action: () => { window.open(publicHref, "_blank"); setMenuOpen(false); } },
                { label: "Duplicate",          icon: Copy,           action: () => { onDuplicate(tool.id); setMenuOpen(false); } },
                { label: tool.isFeatured ? "Unfeature" : "Feature", icon: Star, action: () => { onToggleFeatured(tool.id); setMenuOpen(false); } },
              ].map((m) => (
                <button key={m.label} onClick={m.action}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                  <m.icon className="w-3.5 h-3.5 text-stone-400" />
                  {m.label}
                </button>
              ))}
              <div className="border-t border-stone-100" />
              <button onClick={() => { onDelete(tool.id, tool.title); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Tool Editor ─────────────────────────────────────────────────────────────

function ToolEditor({
  tool, userId, onSaved, onCancel,
}: {
  tool:     ToolFull | null;
  userId:   string;
  onSaved:  (saved: ToolFull) => void;
  onCancel: () => void;
}) {
  const isEdit = !!tool;

  const [title,         setTitle]         = useState(tool?.title        ?? "");
  const [slug,          setSlug]          = useState(tool?.slug         ?? "");
  const [tagline,       setTagline]       = useState(tool?.tagline      ?? "");
  const [description,   setDescription]   = useState(tool?.description  ?? "");
  const [category,      setCategory]      = useState(tool?.category     ?? "AI");
  const [status,        setStatus]        = useState<ToolStatus>(tool?.status ?? "COMING_SOON");
  const [emoji,         setEmoji]         = useState(tool?.emoji        ?? "🔧");
  const [tagInput,      setTagInput]      = useState("");
  const [tags,          setTags]          = useState<string[]>(parseTags(tool?.tags ?? "[]"));
  const [coverImage,    setCoverImage]    = useState(tool?.coverImage   ?? "");
  const [isFeatured,    setIsFeatured]    = useState(tool?.isFeatured   ?? false);
  const [isPremium,     setIsPremium]     = useState(tool?.isPremium    ?? false);
  const [isInteractive, setIsInteractive] = useState(tool?.isInteractive ?? false);
  const [componentKey,  setComponentKey]  = useState(tool?.componentKey ?? "");

  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const slugTouched = useRef(!!tool);
  useEffect(() => {
    if (!slugTouched.current) setSlug(toSlug(title));
  }, [title]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  };

  const handleSave = async () => {
    if (!title.trim() || !tagline.trim()) { setSaveErr("Title and tagline are required."); return; }
    setSaving(true); setSaveErr("");
    try {
      const body = {
        title: title.trim(), slug: slug.trim() || toSlug(title),
        tagline: tagline.trim(), description: description.trim(),
        category, status, emoji, tags, isFeatured, isPremium, isInteractive,
        componentKey: componentKey.trim() || null,
        coverImage: coverImage.trim() || null,
      };
      let saved: ToolFull;
      if (isEdit && tool) {
        const res  = await fetch(`/api/admin/tools/${tool.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        saved = await res.json();
      } else {
        const res  = await fetch("/api/admin/tools", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json();
        saved = data.tool;
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      onSaved(saved);
    } catch (e: unknown) { 
      if (e instanceof Error) {
        setSaveErr(e.message ?? "Save failed");
      } else {
        setSaveErr("Save failed");
      }
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Editor header */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-stone-100 flex-shrink-0">
        <button onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Tools
        </button>
        <div className="flex items-center gap-2">
          {tool && (
            <>
              <Link href={`/admin/${userId}/tools/${tool.id}`}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
                <BarChart2 className="w-3 h-3" />Dashboard
              </Link>
              <a href={`/tools/${tool.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
                <ExternalLink className="w-3 h-3" />Preview
              </a>
            </>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : savedOk ? "Saved!" : isEdit ? "Save Changes" : "Create Tool"}
          </button>
        </div>
      </div>

      {saveErr && (
        <div className="mx-6 mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-5">

          {/* Title + emoji */}
          <div className="flex items-start gap-3">
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Emoji</label>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)}
                className="w-14 text-2xl text-center border border-stone-200 rounded-sm px-2 py-2 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="AI CV Analyzer"
                className="w-full text-xl font-bold border-0 border-b-2 border-stone-200 focus:border-amber-400 focus:outline-none pb-2 bg-transparent placeholder:text-stone-300 placeholder:font-normal text-stone-900 transition-colors"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-stone-400">Slug:</span>
                <input value={slug} onChange={(e) => { slugTouched.current = true; setSlug(e.target.value); }}
                  className="flex-1 text-[11px] font-mono text-stone-500 border-0 border-b border-stone-100 focus:border-amber-300 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
              Tagline <span className="text-red-400">*</span>
              <span className="ml-2 text-stone-300 font-normal normal-case">(one-liner shown on the card)</span>
            </label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)}
              placeholder=""
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Category / Status / Flags */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{(CATEGORY_CFG[c] ?? {}).emoji ?? ""} {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ToolStatus)}
                className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
                {Object.entries(STATUS_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Flags</label>
              {[
                { label: "Featured",     value: isFeatured,    set: setIsFeatured,    icon: Star   },
                { label: "Premium",      value: isPremium,     set: setIsPremium,     icon: Lock   },
                { label: "Interactive",  value: isInteractive, set: setIsInteractive, icon: Zap    },
              ].map((f) => (
                <button key={f.label} onClick={() => f.set((p) => !p)}
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-sm border w-full transition-colors ${
                    f.value
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-stone-50 text-stone-400 border-stone-200 hover:border-stone-400"
                  }`}>
                  <f.icon className="w-3.5 h-3.5" />
                  {f.label}
                  {f.value && <Check className="w-3 h-3 ml-auto text-amber-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive / component key */}
          {isInteractive && (
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
                Component Key
                <span className="ml-2 text-stone-300 font-normal normal-case">(maps to React component in tool-detail-client)</span>
              </label>
              <div className="flex gap-2">
                <select value={componentKey} onChange={(e) => setComponentKey(e.target.value)}
                  className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
                  <option value="">— select or type below —</option>
                  {COMPONENT_KEYS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label} ({c.value})</option>
                  ))}
                </select>
                <input value={componentKey} onChange={(e) => setComponentKey(e.target.value)}
                  placeholder="e.g. cv-analyzer"
                  className="flex-1 text-xs font-mono border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Full description shown on the tool's page. Explain what it does, who it's for, and what makes it useful."
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-y"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-stone-100 text-stone-600 px-2.5 py-1 rounded-sm">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-500 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter…"
                className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
              />
              <button onClick={addTag} className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors">Add</button>
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Cover Image URL</label>
            <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://… (Cloudinary URL from Media Library)"
              className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Dashboard note */}
          <div className="bg-stone-50 border border-stone-200 rounded-sm p-4 flex items-start gap-3">
            <Construction className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-stone-600">Per-tool dashboard</p>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                {isEdit
                  ? <>Each tool has its own management hub at <code className="font-mono">/admin/{userId}/tools/{tool?.id}</code>. Advanced settings (prompt editor, AI config, rate limits, analytics) will be built per tool type in Phase 2 & 3.</>
                  : "Once created, this tool will have its own dashboard page for advanced management — analytics, AI config, usage logs, and more. These will be built per tool type in Phase 2 & 3."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Analytics tab (Phase 1: static overview) ─────────────────────────────────

function AnalyticsTab({ stats, userId }: { stats: Stats; userId: string }) {
  return (
    <div className="p-6 space-y-6">
      {/* Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-sm px-4 py-3.5">
        <BarChart2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-black text-blue-800">Analytics — Phase 1</p>
          <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
            Live charts, tool-level funnels, and usage heatmaps are coming in Phase 2. Currently showing aggregated DB counts.
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Views",     value: stats.totalViews.toLocaleString(),     color: "#3b82f6", icon: Eye      },
          { label: "Total Uses",      value: stats.totalUses.toLocaleString(),      color: "#10b981", icon: Zap      },
          { label: "Uses (30d)",      value: stats.recentUseCount.toLocaleString(), color: "#f59e0b", icon: Activity },
          { label: "Interactive Tools", value: stats.interactive,                  color: "#8b5cf6", icon: Cpu      },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
            <p className="text-xl font-black text-stone-900">{s.value}</p>
            <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top used tools */}
      <div className="bg-white border border-stone-100 rounded-sm">
        <div className="px-5 py-4 border-b border-stone-100">
          <p className="text-sm font-black text-stone-800">Top Used Tools</p>
        </div>
        <div className="divide-y divide-stone-50">
          {stats.topUsed.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-stone-300">No usage data yet</p>
            </div>
          )}
          {stats.topUsed.map((t, i) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50/40 transition-colors">
              <span className="text-[11px] font-black text-stone-300 w-4 flex-shrink-0">#{i + 1}</span>
              <span className="text-lg flex-shrink-0">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-700 truncate">{t.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <CategoryBadge cat={t.category} sm />
                  <StatusBadge status={t.status} sm />
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-stone-400 flex-shrink-0">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{t.useCount.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{t.viewCount.toLocaleString()}</span>
              </div>
              <Link href={`/admin/${userId}/tools/${t.id}`}
                className="text-[11px] font-semibold text-stone-400 hover:text-amber-600 border border-stone-200 hover:border-amber-400 px-2.5 py-1.5 rounded-sm transition-colors flex items-center gap-1 flex-shrink-0">
                <BarChart2 className="w-3 h-3" />Manage
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* By category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-100 rounded-sm p-5">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">By Category</p>
          <div className="space-y-2">
            {stats.byCategory.sort((a, b) => b.count - a.count).map((item) => {
              const cat = CATEGORY_CFG[item.category] ?? { color: "#f59e0b", bg: "#fef3c7", emoji: "🔧" };
              const pct = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-stone-600">{cat.emoji} {item.category}</span>
                    <span className="text-xs font-bold text-stone-500">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-stone-100 rounded-sm p-5">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">By Status</p>
          <div className="space-y-3">
            {[
              { label: "Live",        value: stats.live,        color: "#10b981", bg: "#d1fae5" },
              { label: "Beta",        value: stats.beta,        color: "#f59e0b", bg: "#fef3c7" },
              { label: "Coming Soon", value: stats.comingSoon,  color: "#9ca3af", bg: "#f3f4f6" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-semibold text-stone-600">{s.label}</span>
                </div>
                <span className="text-sm font-black" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 space-y-2">
            {[
              { label: "Interactive", value: stats.interactive, icon: Zap    },
              { label: "Premium",     value: stats.premium,     icon: Lock   },
              { label: "Featured",    value: stats.featured,    icon: Star   },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <s.icon className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs text-stone-500">{s.label}</span>
                </div>
                <span className="text-xs font-bold text-stone-600">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function ToolsAdminClient({
  userId, stats, initialTools, toolTotal, toolPages,
  initialTab, initialSearch, initialCategory, initialStatus,
   currentPage,
}: Props) {
  const [tab,      setTab]      = useState<"tools" | "editor" | "analytics">(initialTab);
  const [tools,    setTools]    = useState<ToolSummary[]>(initialTools);
  const [total,    setTotal]    = useState(toolTotal);
  const [pages,    setPages]    = useState(toolPages);
  const [page,     setPage]     = useState(currentPage);
  const [search,   setSearch]   = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [status,   setStatus]   = useState(initialStatus);
  const [sortBy,   setSortBy]   = useState("createdAt_desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editTool, setEditTool] = useState<ToolFull | null>(null);
  const [statsData, setStatsData] = useState(stats);

  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; danger?: boolean;
    confirmLabel?: string; action?: () => Promise<void>;
  }>({ open: false, title: "", message: "" });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchTools = useCallback(async (opts?: {
    q?: string; cat?: string; st?: string; sort?: string; pg?: number;
  }) => {
    const q    = opts?.q    ?? search;
    const cat  = opts?.cat  ?? category;
    const st   = opts?.st   ?? status;
    const sort = opts?.sort ?? sortBy;
    const pg   = opts?.pg   ?? page;

    const params = new URLSearchParams({ page: String(pg), pageSize: "20" });
    if (q && q !== "")    params.set("search",   q);
    if (cat && cat !== "ALL") params.set("category", cat);
    if (st  && st  !== "ALL") params.set("status",   st);
    const [sf, sd] = sort.split("_");
    params.set("sortBy", sf); params.set("sortOrder", sd);

    const res  = await fetch(`/api/admin/tools?${params}`);
    const data = await res.json();
    setTools(data.tools ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
  }, [search, category, status, sortBy, page]);

  const openEditor = useCallback(async (tool: ToolSummary) => {
    const res  = await fetch(`/api/admin/tools/${tool.id}`);
    const full = await res.json();
    setEditTool(full);
    setTab("editor");
  }, []);

  const handleToggleFeatured = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/tools/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "toggleFeatured" }),
    });
    const updated = await res.json();
    setTools((prev) => prev.map((t) => t.id === id ? { ...t, isFeatured: updated.isFeatured } : t));
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/tools/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "duplicate" }),
    });
    const copy = await res.json();
    setTools((prev) => [copy, ...prev]);
    setTotal((t) => t + 1);
    setStatsData((s) => ({ ...s, total: s.total + 1, comingSoon: s.comingSoon + 1 }));
  }, []);

  const handleDelete = useCallback((id: string, title: string) => {
    setConfirm({
      open: true, danger: true,
      title: `Delete "${title}"?`,
      message: "This tool and all its usage logs will be permanently deleted.",
      confirmLabel: "Delete",
      action: async () => {
        await fetch(`/api/admin/tools/${id}`, { method: "DELETE" });
        setTools((prev) => prev.filter((t) => t.id !== id));
        setTotal((t) => t - 1);
        setStatsData((s) => ({ ...s, total: s.total - 1 }));
        setSelected((p) => { const n = new Set(p); n.delete(id); return n; });
      },
    });
  }, []);

  const handleBulkDelete = () => {
    const ids = [...selected];
    setConfirm({
      open: true, danger: true,
      title: `Delete ${ids.length} tool(s)?`,
      message: "Selected tools and their usage logs will be permanently deleted.",
      confirmLabel: "Delete All",
      action: async () => {
        await fetch("/api/admin/tools", {
          method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }),
        });
        setTools((prev) => prev.filter((t) => !ids.includes(t.id)));
        setTotal((t) => t - ids.length);
        setStatsData((s) => ({ ...s, total: s.total - ids.length }));
        setSelected(new Set());
      },
    });
  };

  const handleSaved = useCallback((saved: ToolFull) => {
    setTools((prev) => {
      const exists = prev.find((t) => t.id === saved.id);
      if (exists) return prev.map((t) => t.id === saved.id ? { ...t, ...saved } : t);
      return [saved, ...prev];
    });
    if (!tools.find((t) => t.id === saved.id)) {
      setTotal((t) => t + 1);
      setStatsData((s) => ({ ...s, total: s.total + 1 }));
    }
  }, [tools]);

  const runConfirm = async () => {
    if (!confirm.action) return;
    setConfirmLoading(true);
    await confirm.action();
    setConfirm((s) => ({ ...s, open: false }));
    setConfirmLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <ConfirmDialog
        open={confirm.open} title={confirm.title} message={confirm.message}
        danger={confirm.danger} confirmLabel={confirm.confirmLabel}
        onConfirm={runConfirm} onCancel={() => setConfirm((s) => ({ ...s, open: false }))}
        loading={confirmLoading}
      />

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-0 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Tools Lab</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {statsData.total} tools · {statsData.live} live · {statsData.beta} beta · {statsData.comingSoon} coming soon
            </p>
          </div>
          <button
            onClick={() => { setEditTool(null); setTab("editor"); }}
            className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />New Tool
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-4">
          {[
            { label: "Total",       value: statsData.total,          color: "#f59e0b", icon: Wrench   },
            { label: "Live",        value: statsData.live,           color: "#10b981", icon: Globe    },
            { label: "Beta",        value: statsData.beta,           color: "#f97316", icon: Sparkles },
            { label: "Coming Soon", value: statsData.comingSoon,     color: "#9ca3af", icon: Construction },
            { label: "Interactive", value: statsData.interactive,    color: "#3b82f6", icon: Zap      },
            { label: "Total Views", value: statsData.totalViews,     color: "#8b5cf6", icon: Eye      },
            { label: "Total Uses",  value: statsData.totalUses,      color: "#ec4899", icon: Activity },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-3.5">
              <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
              <p className="text-xl font-black text-stone-900">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5">
          {[
            { id: "tools",     label: "All Tools",  icon: Grid3x3  },
            { id: "editor",    label: editTool ? `Editing: ${editTool.title.slice(0, 28)}…` : "New Tool", icon: Pencil },
            { id: "analytics", label: "Analytics",  icon: BarChart2 },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as "tools" | "editor" | "analytics")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-700"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════ TAB: ALL TOOLS ═══════════════════════════════ */}
      {tab === "tools" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <div className="w-48 flex-shrink-0 border-r border-stone-100 overflow-y-auto bg-stone-50/40 p-3">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2 mt-1">Category</p>
            {[{ label: "All Tools", count: statsData.total, value: "ALL" },
              ...CATEGORIES.map((k) => ({
                label: `${(CATEGORY_CFG[k] ?? {}).emoji ?? ""} ${k}`,
                count: statsData.byCategory.find((b) => b.category === k)?.count ?? 0,
                value: k,
              }))
            ].map((item) => (
              <button key={item.value}
                onClick={() => { setCategory(item.value); setPage(1); fetchTools({ cat: item.value, pg: 1 }); }}
                className={`w-full flex items-center justify-between gap-1 px-2.5 py-2 rounded-sm text-left transition-colors ${
                  category === item.value ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-white hover:text-stone-800"
                }`}>
                <span className="text-xs font-semibold truncate">{item.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                  category === item.value ? "bg-amber-200/60 text-amber-700" : "bg-stone-200 text-stone-400"
                }`}>{item.count}</span>
              </button>
            ))}

            <div className="mt-4 pt-3 border-t border-stone-200">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2">Status</p>
              {[
                { label: "All",         value: "ALL",         dot: "" },
                { label: "Live",        value: "LIVE",        dot: "#10b981" },
                { label: "Beta",        value: "BETA",        dot: "#f59e0b" },
                { label: "Coming Soon", value: "COMING_SOON", dot: "#9ca3af" },
              ].map((item) => (
                <button key={item.value}
                  onClick={() => { setStatus(item.value); setPage(1); fetchTools({ st: item.value, pg: 1 }); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-sm text-left transition-colors text-xs font-semibold ${
                    status === item.value ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-white hover:text-stone-800"
                  }`}>
                  {item.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.dot }} />}
                  {item.label}
                </button>
              ))}
            </div>

            {/* Top used (sidebar) */}
            {statsData.topUsed.length > 0 && (
              <div className="mt-4 pt-3 border-t border-stone-200">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2">Most Used</p>
                {statsData.topUsed.slice(0, 5).map((t) => (
                  <Link key={t.id} href={`/admin/${userId}/tools/${t.id}`}
                    className="block px-2 py-1.5 rounded-sm hover:bg-white transition-colors group">
                    <p className="text-[11px] text-stone-600 font-semibold line-clamp-1 group-hover:text-amber-600 transition-colors">{t.emoji} {t.title}</p>
                    <p className="text-[10px] text-stone-400">{t.useCount.toLocaleString()} uses</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Main list */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 flex-wrap">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                <input value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); fetchTools({ q: e.target.value, pg: 1 }); }}
                  placeholder="Search tools…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
                />
              </div>
              <select value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); fetchTools({ sort: e.target.value, pg: 1 }); }}
                className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-amber-400">
                <option value="createdAt_desc">Newest</option>
                <option value="createdAt_asc">Oldest</option>
                <option value="updatedAt_desc">Recently updated</option>
                <option value="useCount_desc">Most used</option>
                <option value="viewCount_desc">Most viewed</option>
                <option value="title_asc">Title A–Z</option>
              </select>
              {selected.size > 0 && (
                <div className="flex items-center gap-2 ml-auto pl-2 border-l border-stone-200">
                  <span className="text-xs font-semibold text-stone-600">{selected.size} selected</span>
                  <button onClick={handleBulkDelete}
                    className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                  <button onClick={() => setSelected(new Set())} className="text-xs text-stone-400 hover:text-stone-700 transition-colors">Clear</button>
                </div>
              )}
              <span className="text-xs text-stone-400 ml-auto">{total} tool{total !== 1 ? "s" : ""}</span>
            </div>

            {/* Select all */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-stone-50 bg-stone-50/40">
              <button onClick={() => setSelected(selected.size === tools.length && tools.length > 0 ? new Set() : new Set(tools.map((t) => t.id)))}
                className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center gap-1.5">
                {selected.size === tools.length && tools.length > 0
                  ? <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                  : <Square className="w-3.5 h-3.5" />}
                Select all
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {tools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Wrench className="w-10 h-10 text-stone-200 mb-3" />
                  <p className="text-sm text-stone-400 font-medium">
                    {search ? `No tools match "${search}"` : "No tools yet"}
                  </p>
                  <button onClick={() => setTab("editor")}
                    className="mt-3 text-xs text-amber-600 font-semibold hover:text-amber-800 underline underline-offset-2">
                    Add your first tool
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {tools.map((tool) => (
                    <ToolRow
                      key={tool.id}
                      tool={tool}
                      userId={userId}
                      selected={selected.has(tool.id)}
                      onSelect={(id) => setSelected((p) => { 
                        const n = new Set(p); 
                        if (p.has(id)) {
                          n.delete(id);
                        } else {
                          n.add(id);
                        }
                        return n;
                      })}
                      onEdit={openEditor}
                      onDelete={handleDelete}
                      onToggleFeatured={handleToggleFeatured}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </AnimatePresence>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <button disabled={page <= 1}
                    onClick={() => { setPage(page - 1); fetchTools({ pg: page - 1 }); }}
                    className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                    ← Prev
                  </button>
                  <span className="text-xs text-stone-400">Page {page} of {pages}</span>
                  <button disabled={page >= pages}
                    onClick={() => { setPage(page + 1); fetchTools({ pg: page + 1 }); }}
                    className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB: EDITOR ══════════════════════════════════ */}
      {tab === "editor" && (
        <div className="flex-1 overflow-hidden">
          <ToolEditor
            tool={editTool}
            userId={userId}
            onSaved={(saved) => { handleSaved(saved); }}
            onCancel={() => { setTab("tools"); setEditTool(null); }}
          />
        </div>
      )}

      {/* ═══════════════════ TAB: ANALYTICS ═══════════════════════════════ */}
      {tab === "analytics" && (
        <div className="flex-1 overflow-y-auto">
          <AnalyticsTab stats={statsData} userId={userId} />
        </div>
      )}
    </div>
  );
}