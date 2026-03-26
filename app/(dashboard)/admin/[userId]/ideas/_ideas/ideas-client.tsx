"use client";

// =============================================================================
// isaacpaha.com — Ideas Lab Admin Client
// components/admin/ideas/ideas-admin-client.tsx
//
// Three tabs:
//   1. Ideas  — searchable, filterable list with inline actions
//   2. Editor — rich form to create or edit an idea + AI assist buttons
//   3. Brainstorm — full AI session: generate / expand / critique / titles / tags
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, Plus, Search, Sparkles, Edit2, Trash2,
  Eye, EyeOff, Star,  Copy, Check, X,
  AlertCircle, Loader2, ArrowLeft, Globe, Lock, Tag,
   Heart, MessageSquare, Save, Wand2, CheckSquare, Square, FileText, Layers,
  Zap, Brain, Target, MoreHorizontal, ExternalLink,
   ChevronDown, Pencil, Grid3x3,
} from "lucide-react";


// ─── Types ────────────────────────────────────────────────────────────────────

type IdeaStatus   = "CONCEPT" | "EXPLORING" | "DEVELOPING" | "SHELVED" | "LAUNCHED";
type IdeaCategory = "TECH" | "AI" | "BUSINESS" | "SOCIETY" | "AFRICA" | "FINTECH" | "EDUCATION" | "PHILOSOPHY" | "OTHER";

type IdeaSummary = {
  id:           string;
  title:        string;
  slug:         string;
  summary:      string;
  category:     IdeaCategory;
  status:       IdeaStatus;
  tags:         string | null;
  isPublished:  boolean;
  isFeatured:   boolean;
  viewCount:    number;
  likeCount:    number;
  commentCount: number;
  coverImage:   string | null;
  createdAt:    Date;
  updatedAt:    Date;
  publishedAt:  Date | null;
};

type IdeaFull = IdeaSummary & {
  content:         string;
  metaTitle:       string | null;
  metaDescription: string | null;
};

type Stats = {
  total:      number;
  published:  number;
  drafts:     number;
  featured:   number;
  totalViews: number;
  totalLikes: number;
  byStatus:   { status: IdeaStatus;   count: number }[];
  byCategory: { category: IdeaCategory; count: number }[];
  topViewed:  { id: string; title: string; viewCount: number; likeCount: number; category: IdeaCategory; status: IdeaStatus }[];
};

interface Props {
  userId:          string;
  stats:           Stats;
  initialIdeas:    IdeaSummary[];
  ideaTotal:       number;
  ideaPages:       number;
  initialTab:      "ideas" | "editor" | "brainstorm";
  initialSearch:   string;
  initialCategory: string;
  initialStatus:   string;
  initialEditId?:  string;
  currentPage:     number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<IdeaCategory, { label: string; emoji: string; color: string; bg: string }> = {
  TECH:       { label: "Technology", emoji: "💻", color: "#14b8a6", bg: "#ccfbf1" },
  AI:         { label: "AI",         emoji: "🤖", color: "#f59e0b", bg: "#fef3c7" },
  BUSINESS:   { label: "Business",   emoji: "🚀", color: "#10b981", bg: "#d1fae5" },
  SOCIETY:    { label: "Society",    emoji: "🌍", color: "#3b82f6", bg: "#dbeafe" },
  AFRICA:     { label: "Africa",     emoji: "🌅", color: "#f97316", bg: "#ffedd5" },
  FINTECH:    { label: "Fintech",    emoji: "💳", color: "#8b5cf6", bg: "#ede9fe" },
  EDUCATION:  { label: "Education",  emoji: "📚", color: "#ec4899", bg: "#fce7f3" },
  PHILOSOPHY: { label: "Philosophy", emoji: "💭", color: "#6366f1", bg: "#e0e7ff" },
  OTHER:      { label: "Other",      emoji: "✨", color: "#64748b", bg: "#f1f5f9" },
};

const STATUS_CFG: Record<IdeaStatus, { label: string; color: string; bg: string; dot: string }> = {
  CONCEPT:    { label: "Concept",    color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
  EXPLORING:  { label: "Exploring",  color: "#d97706", bg: "#fef3c7", dot: "#f59e0b" },
  DEVELOPING: { label: "Developing", color: "#2563eb", bg: "#dbeafe", dot: "#3b82f6" },
  LAUNCHED:   { label: "Launched",   color: "#059669", bg: "#d1fae5", dot: "#10b981" },
  SHELVED:    { label: "Shelved",    color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
};

const AI_MODES = [
  { id: "generate", label: "Generate Ideas",     icon: Sparkles,  desc: "Brainstorm 3 new ideas from a theme",      color: "#f59e0b" },
  { id: "expand",   label: "Write Full Content", icon: Layers,    desc: "Turn a title into a full 650-900w article", color: "#8b5cf6" },
  { id: "titles",   label: "Alternative Titles", icon: FileText,  desc: "6 different title options to choose from",  color: "#3b82f6" },
  { id: "summary",  label: "Write Summary",      icon: Zap,       desc: "Crisp 40-word teaser copy for the card",    color: "#10b981" },
  { id: "tags",     label: "Suggest Tags",       icon: Tag,       desc: "Auto-generate 6-8 relevant tags",           color: "#ec4899" },
  { id: "critique", label: "Critical Review",    icon: Target,    desc: "Honest analysis and sharpening feedback",   color: "#ef4444" },
] as const;

type AIMode = typeof AI_MODES[number]["id"];

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
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

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function CategoryBadge({ cat, sm }: { cat: IdeaCategory; sm?: boolean }) {
  const c = CATEGORY_CFG[cat];
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-sm ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.emoji} {c.label}
    </span>
  );
}

function StatusBadge({ status, sm }: { status: IdeaStatus; sm?: boolean }) {
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

// ─── Idea row card ────────────────────────────────────────────────────────────

function IdeaRow({
  idea, selected, onSelect, onEdit, onDelete, onTogglePublish, onToggleFeatured, onDuplicate,
}: {
  idea: IdeaSummary;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (idea: IdeaSummary) => void;
  onDelete: (id: string, title: string) => void;
  onTogglePublish: (id: string) => void;
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex items-start gap-3 px-4 py-3.5 border-b border-stone-100 hover:bg-stone-50/60 transition-colors ${selected ? "bg-amber-50/40" : ""}`}
    >
      {/* Checkbox */}
      <button onClick={() => onSelect(idea.id)} className="flex-shrink-0 mt-0.5">
        {selected
          ? <CheckSquare className="w-4 h-4 text-amber-500" />
          : <Square className="w-4 h-4 text-stone-200 group-hover:text-stone-400 transition-colors" />
        }
      </button>

      {/* Featured star */}
      <button
        onClick={() => onToggleFeatured(idea.id)}
        className="flex-shrink-0 mt-0.5"
        title={idea.isFeatured ? "Unfeature" : "Set as featured"}
      >
        {idea.isFeatured
          ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          : <Star className="w-4 h-4 text-stone-200 group-hover:text-stone-300 transition-colors" />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <button
            onClick={() => onEdit(idea)}
            className="text-sm font-bold text-stone-800 hover:text-amber-600 transition-colors text-left leading-snug"
          >
            {idea.title}
          </button>
          {idea.isFeatured && (
            <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex-shrink-0">
              Featured
            </span>
          )}
        </div>
        <p className="text-xs text-stone-400 mt-0.5 line-clamp-1 pr-4">{idea.summary}</p>
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          <CategoryBadge cat={idea.category} sm />
          <StatusBadge status={idea.status} sm />
          {parseTags(idea.tags).slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{t}</span>
          ))}
          <span className="text-[10px] text-stone-300">·</span>
          <span className="text-[10px] text-stone-400">{fmtDate(idea.updatedAt)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden lg:flex items-center gap-3 flex-shrink-0 text-[11px] text-stone-400">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{idea.viewCount.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{idea.likeCount}</span>
        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{idea.commentCount}</span>
      </div>

      {/* Publish toggle */}
      <button
        onClick={() => onTogglePublish(idea.id)}
        className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-sm border transition-colors flex-shrink-0 ${
          idea.isPublished
            ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
            : "text-stone-500 bg-stone-50 border-stone-200 hover:bg-stone-100"
        }`}
        title={idea.isPublished ? "Unpublish" : "Publish"}
      >
        {idea.isPublished ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        {idea.isPublished ? "Live" : "Draft"}
      </button>

      {/* Actions menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-20 w-44 bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden"
            >
              {[
                { label: "Edit",      icon: Edit2,      action: () => { onEdit(idea); setMenuOpen(false); } },
                { label: "Duplicate", icon: Copy,       action: () => { onDuplicate(idea.id); setMenuOpen(false); } },
                { label: idea.isPublished ? "Unpublish" : "Publish", icon: idea.isPublished ? EyeOff : Eye, action: () => { onTogglePublish(idea.id); setMenuOpen(false); } },
                { label: idea.isFeatured ? "Unfeature" : "Set Featured", icon: Star, action: () => { onToggleFeatured(idea.id); setMenuOpen(false); } },
              ].map((m) => (
                <button key={m.label} onClick={m.action}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                  <m.icon className="w-3.5 h-3.5 text-stone-400" />
                  {m.label}
                </button>
              ))}
              <div className="border-t border-stone-100" />
              <button onClick={() => { onDelete(idea.id, idea.title); setMenuOpen(false); }}
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

// ─── Editor form ──────────────────────────────────────────────────────────────

function IdeaEditor({
  idea, onSaved, onCancel,
}: {
  idea:     IdeaFull | null;   // null = new idea
  userId:   string;
  onSaved:  (saved: IdeaFull) => void;
  onCancel: () => void;
}) {
  const isEdit = !!idea;

  // Form state
  const [title,       setTitle]       = useState(idea?.title       ?? "");
  const [slug,        setSlug]        = useState(idea?.slug        ?? "");
  const [summary,     setSummary]     = useState(idea?.summary     ?? "");
  const [content,     setContent]     = useState(idea?.content     ?? "");
  const [category,    setCategory]    = useState<IdeaCategory>(idea?.category ?? "TECH");
  const [status,      setStatus]      = useState<IdeaStatus>(idea?.status     ?? "CONCEPT");
  const [tagInput,    setTagInput]    = useState("");
  const [tags,        setTags]        = useState<string[]>(parseTags(idea?.tags ?? null));
  const [isPublished, setIsPublished] = useState(idea?.isPublished ?? false);
  const [isFeatured,  setIsFeatured]  = useState(idea?.isFeatured  ?? false);
  const [metaTitle,   setMetaTitle]   = useState(idea?.metaTitle   ?? "");
  const [metaDesc,    setMetaDesc]    = useState(idea?.metaDescription ?? "");
  const [coverImage,  setCoverImage]  = useState(idea?.coverImage  ?? "");
  const [showMeta,    setShowMeta]    = useState(false);

  // AI assist state
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiMode,      setAiMode]      = useState<AIMode | null>(null);
  const [aiResult,    setAiResult]    = useState("");
  const [aiError,     setAiError]     = useState("");

  // Save state
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  // Auto-generate slug from title
  const slugTouched = useRef(!!idea);
  useEffect(() => {
    if (!slugTouched.current) {
      setSlug(toSlug(title));
    }
  }, [title]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const callAI = async (mode: AIMode, promptOverride?: string) => {
    const prompt = promptOverride ?? (mode === "expand" ? title : mode === "critique" ? `${title}\n\n${summary}` : title);
    if (!prompt.trim()) return;
    setAiLoading(true); setAiMode(mode); setAiResult(""); setAiError("");
    try {
      const res  = await fetch("/api/admin/ideas/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, prompt, category, context: content }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error ?? "AI failed"); }
      else { setAiResult(data.content ?? ""); }
    } catch { setAiError("Network error"); }
    setAiLoading(false);
  };

  // Apply AI result to a specific field
  const applyAIResult = (target: "content" | "summary" | "title") => {
    if (!aiResult) return;
    if (target === "content") { setContent(aiResult); }
    else if (target === "summary") { setSummary(aiResult.slice(0, 300)); }
    else if (target === "title") { setTitle(aiResult); setSlug(toSlug(aiResult)); }
    setAiResult(""); setAiMode(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !summary.trim()) {
      setSaveErr("Title and summary are required."); return;
    }
    setSaving(true); setSaveErr("");

    try {
      const body = {
        title: title.trim(), slug: slug.trim() || toSlug(title),
        summary: summary.trim(), content: content.trim(),
        category, status, tags, isPublished, isFeatured,
        coverImage: coverImage || null,
        metaTitle: metaTitle || null, metaDescription: metaDesc || null,
      };

      let saved: IdeaFull;
      if (isEdit && idea) {
        const res  = await fetch(`/api/admin/ideas/${idea.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        saved = await res.json();
      } else {
        const res  = await fetch("/api/admin/ideas", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json();
        saved = data.idea;
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      onSaved(saved);
    } catch (error: unknown) {
      setSaveErr(typeof error === "object" && error !== null && "message" in error ? (error as { message?: string }).message ?? "Save failed" : "Save failed");
    }
    setSaving(false);
  };

  const wc = wordCount(content);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Editor header */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-stone-100 flex-shrink-0">
        <button onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Ideas
        </button>
        <div className="flex items-center gap-2">
          {idea && (
            <a
              href={`/ideas/${idea.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors"
            >
              <ExternalLink className="w-3 h-3" />Preview
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : savedOk ? "Saved!" : isEdit ? "Save Changes" : "Create Idea"}
          </button>
        </div>
      </div>

      {saveErr && (
        <div className="mx-6 mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {saveErr}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-5">

          {/* ── Title + Slug ─────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A bold, provocative idea title…"
                  className="w-full text-xl font-bold border-0 border-b-2 border-stone-200 focus:border-amber-400 focus:outline-none pb-2 bg-transparent placeholder:text-stone-300 placeholder:font-normal text-stone-900 transition-colors"
                />
              </div>
              {/* AI: title helper */}
              <button
                onClick={() => callAI("titles")}
                disabled={!title.trim() || aiLoading}
                title="Generate alternative titles"
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-stone-300 hover:text-amber-500 hover:bg-amber-50 rounded-sm transition-colors disabled:opacity-40"
              >
                <Wand2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-400">Slug:</span>
              <input
                value={slug}
                onChange={(e) => { slugTouched.current = true; setSlug(e.target.value); }}
                className="flex-1 text-[11px] font-mono text-stone-500 border-0 border-b border-stone-100 focus:border-amber-300 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* ── Category / Status / Publish / Featured ─────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white"
              >
                {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IdeaStatus)}
                className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white"
              >
                {Object.entries(STATUS_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Visibility</label>
              <button
                onClick={() => setIsPublished((p) => !p)}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
                  isPublished
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                }`}
              >
                {isPublished ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isPublished ? "Published" : "Draft"}
              </button>
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Featured</label>
              <button
                onClick={() => setIsFeatured((p) => !p)}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
                  isFeatured
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                }`}
              >
                {isFeatured ? <Star className="w-3.5 h-3.5 fill-amber-400" /> : <Star className="w-3.5 h-3.5" />}
                {isFeatured ? "Featured" : "Not Featured"}
              </button>
            </div>
          </div>

          {/* ── Summary ─────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Summary <span className="text-red-400">*</span>
                <span className="ml-2 text-stone-300 font-normal normal-case">(teaser copy on the card)</span>
              </label>
              <button
                onClick={() => callAI("summary")}
                disabled={!title.trim() || aiLoading}
                className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-40"
              >
                <Sparkles className="w-3 h-3" />AI write
              </button>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="One or two sentences that hook the reader and state the central question…"
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none bg-white"
            />
            <p className="text-[10px] text-stone-300 text-right mt-0.5">{summary.length}/300</p>
          </div>

          {/* ── Content ─────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Content
                {wc > 0 && <span className="ml-2 text-stone-300 font-normal normal-case">{wc} words</span>}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => callAI("expand")}
                  disabled={!title.trim() || aiLoading}
                  className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-40"
                >
                  <Layers className="w-3 h-3" />AI expand
                </button>
                <button
                  onClick={() => callAI("critique")}
                  disabled={!title.trim() || aiLoading}
                  className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
                >
                  <Target className="w-3 h-3" />Critique
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              placeholder="Write the full idea here. Be bold. Be direct. Make the reader think.&#10;&#10;Start with your thesis — don't warm up. Then develop the argument with concrete examples, analogies, or thought experiments. End with implications."
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-3 focus:outline-none focus:border-amber-400 resize-y bg-white leading-relaxed font-mono"
            />
          </div>

          {/* ── AI Result Panel ─────────────────────────────────────── */}
          <AnimatePresence>
            {(aiLoading || aiResult || aiError) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="border border-amber-200 bg-amber-50/60 rounded-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-200/50 bg-amber-50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-700">
                      {aiLoading ? "Claude is thinking…" : `AI Result — ${AI_MODES.find((m) => m.id === aiMode)?.label}`}
                    </span>
                  </div>
                  {!aiLoading && (
                    <button onClick={() => { setAiResult(""); setAiMode(null); setAiError(""); }}
                      className="text-stone-400 hover:text-stone-700 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {aiLoading && (
                  <div className="px-4 py-8 flex items-center justify-center gap-2 text-sm text-stone-400">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    Generating groundbreaking ideas…
                  </div>
                )}
                {aiError && (
                  <div className="px-4 py-4 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{aiError}
                  </div>
                )}
                {aiResult && !aiLoading && (
                  <div>
                    <div className="px-4 py-3 max-h-80 overflow-y-auto">
                      <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{aiResult}</pre>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 border-t border-amber-200/50 bg-amber-50 flex-wrap">
                      <span className="text-[10px] text-amber-700 font-semibold mr-1">Apply to:</span>
                      {(["content", "summary"] as const).map((t) => (
                        <button key={t} onClick={() => applyAIResult(t)}
                          className="text-[11px] font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 px-2.5 py-1 rounded-sm transition-colors capitalize">
                          {t}
                        </button>
                      ))}
                      <button
                        onClick={() => navigator.clipboard.writeText(aiResult)}
                        className="ml-auto text-[11px] text-stone-400 hover:text-stone-700 border border-stone-200 px-2.5 py-1 rounded-sm flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" />Copy
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Tags ────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Tags</label>
              <button
                onClick={() => callAI("tags")}
                disabled={!title.trim() || aiLoading}
                className="flex items-center gap-1 text-[10px] text-pink-500 hover:text-pink-700 transition-colors disabled:opacity-40"
              >
                <Tag className="w-3 h-3" />AI suggest
              </button>
            </div>
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
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter…"
                className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
              />
              <button onClick={addTag} className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors">
                Add
              </button>
            </div>
          </div>

          {/* ── Cover image ─────────────────────────────────────────── */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Cover Image URL</label>
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://… (Cloudinary URL from Media Library)"
              className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* ── SEO Meta (collapsible) ───────────────────────────────── */}
          <div className="border border-stone-100 rounded-sm overflow-hidden">
            <button
              onClick={() => setShowMeta((p) => !p)}
              className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <span className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 text-stone-400" />SEO Meta</span>
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showMeta ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showMeta && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2 space-y-3 border-t border-stone-100">
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Meta Title</label>
                      <input
                        value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="SEO title (defaults to idea title)"
                        className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Meta Description</label>
                      <textarea
                        value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)}
                        rows={3} maxLength={160}
                        placeholder="SEO description (defaults to summary)"
                        className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 resize-none"
                      />
                      <p className="text-[10px] text-stone-300 text-right">{metaDesc.length}/160</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Brainstorm tab ───────────────────────────────────────────────────────────

function BrainstormTab({ onUseIdea }: { onUseIdea: (data: { title: string; summary: string; content: string; tags: string[] }) => void }) {
  const [selectedMode,  setSelectedMode]  = useState<AIMode>("generate");
  const [prompt,        setPrompt]        = useState("");
  const [category,      setCategory]      = useState<IdeaCategory | "ALL">("ALL");
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState("");
  const [error,         setError]         = useState("");
  const [history,       setHistory]       = useState<{ mode: AIMode; prompt: string; result: string }[]>([]);
  const [copied,        setCopied]        = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const run = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setResult(""); setError("");
    try {
      const res  = await fetch("/api/admin/ideas/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode, prompt: prompt.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "AI failed"); }
      else {
        setResult(data.content ?? "");
        setHistory((h) => [{ mode: selectedMode, prompt: prompt.trim(), result: data.content }, ...h.slice(0, 9)]);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  // Parse a single idea block from "generate" mode result to prefill editor
  const extractIdea = (raw: string, num: number) => {
    const marker = `IDEA ${num}:`;
    const next   = `IDEA ${num + 1}:`;
    const start  = raw.indexOf(marker);
    if (start === -1) return null;
    const end  = raw.indexOf(next, start);
    const block = end === -1 ? raw.slice(start) : raw.slice(start, end);

    const getField = (label: string) => {
      const re = new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, "s");
      return block.match(re)?.[1]?.trim() ?? "";
    };

    const title   = getField("TITLE");
    const summary = getField("SUMMARY");
    const content = block.match(/CONTENT:\n([\s\S]+?)(?=\nSTATUS:|$)/)?.[1]?.trim() ?? "";
    const tagsRaw = getField("TAGS");
    const tags    = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

    return { title, summary, content, tags };
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const EXAMPLE_PROMPTS: Record<AIMode, string[]> = {
    generate:  ["The future of African fintech infrastructure", "AI tools that democratise access to expertise", "What open-source governance could look like"],
    expand:    ["Why Every Developer Should Learn Economics", "The Case for Slower Technology"],
    titles:    ["AI is making education obsolete", "Why Africa will lead the next tech revolution"],
    summary:   ["An AI agent that manages your entire job search autonomously", "Open-source government software as a democratic right"],
    tags:      ["How blockchain could fix broken supply chains in developing nations"],
    critique:  ["Universal Basic Income enabled by AI productivity gains", "Social media platforms should be nationalised"],
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: mode selector + input */}
      <div className="w-80 flex-shrink-0 border-r border-stone-100 overflow-y-auto">
        <div className="p-4 space-y-5">

          {/* Mode selector */}
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">AI Mode</p>
            <div className="space-y-1">
              {AI_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-sm text-left transition-colors border ${
                    selectedMode === m.id
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-white border-stone-100 hover:bg-stone-50 text-stone-600"
                  }`}
                >
                  <m.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: selectedMode === m.id ? m.color : undefined }} />
                  <div>
                    <p className="text-xs font-bold leading-tight">{m.label}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Category context</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IdeaCategory | "ALL")}
              className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white"
            >
              <option value="ALL">All categories</option>
              {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Recent sessions</p>
              <div className="space-y-1">
                {history.slice(0, 5).map((h, i) => (
                  <button key={i} onClick={() => { setPrompt(h.prompt); setSelectedMode(h.mode); setResult(h.result); }}
                    className="w-full text-left px-2.5 py-2 rounded-sm text-[11px] text-stone-500 hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-colors truncate">
                    <span className="font-semibold text-stone-400 mr-1">{AI_MODES.find((m) => m.id === h.mode)?.label}:</span>
                    {h.prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: prompt + result */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Prompt area */}
        <div className="p-5 border-b border-stone-100 bg-stone-50/40 flex-shrink-0">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider mt-0.5">
              {AI_MODES.find((m) => m.id === selectedMode)?.label}
            </span>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }}
            rows={4}
            placeholder={
              selectedMode === "generate"  ? "Enter a theme, problem space, or question to brainstorm ideas around…" :
              selectedMode === "expand"    ? "Enter a title to expand into full article content…" :
              selectedMode === "titles"    ? "Enter an idea title to generate alternatives for…" :
              selectedMode === "summary"   ? "Enter a title or brief description to write a summary for…" :
              selectedMode === "tags"      ? "Enter an idea title or description to generate tags for…" :
              "Enter an idea title and summary to get critical feedback on…"
            }
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none bg-white"
          />

          {/* Example prompts */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-stone-400">Try:</span>
            {(EXAMPLE_PROMPTS[selectedMode] ?? []).map((ex) => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="text-[10px] text-stone-500 border border-stone-200 px-2 py-0.5 rounded-sm hover:border-amber-400 hover:text-amber-600 transition-colors truncate max-w-xs">
                {ex}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-stone-400">⌘ Enter to run</span>
            <button
              onClick={run}
              disabled={!prompt.trim() || loading}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-5 py-2.5 rounded-sm transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>

        {/* Result area */}
        <div className="flex-1 overflow-y-auto p-5">
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-stone-500">Ready to brainstorm</p>
              <p className="text-xs text-stone-300 mt-1 max-w-xs">
                Choose a mode on the left, enter your prompt, and hit Generate.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm text-stone-500 animate-pulse">Claude is thinking…</p>
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
                <span className="text-xs font-bold text-stone-600">
                  {AI_MODES.find((m) => m.id === selectedMode)?.label} result
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={copyResult}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy all"}
                  </button>
                  <button onClick={() => { setResult(""); }}
                    className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2.5 py-1.5 rounded-sm transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Render result */}
              <div className="bg-stone-50 border border-stone-100 rounded-sm p-4">
                <pre className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
              </div>

              {/* If generate mode — show "Use this idea" buttons per idea */}
              {selectedMode === "generate" && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Use in editor:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3].map((n) => {
                      const parsed = extractIdea(result, n);
                      if (!parsed?.title) return null;
                      return (
                        <button
                          key={n}
                          onClick={() => onUseIdea(parsed)}
                          className="flex items-center gap-2 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-2 rounded-sm transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />Use Idea {n}: {parsed.title.slice(0, 40)}{parsed.title.length > 40 ? "…" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function IdeasAdminClient({
  userId, stats, initialIdeas, ideaTotal, ideaPages,
  initialTab, initialSearch, initialCategory, initialStatus,
  currentPage,
}: Props) {
//   const [isPending, startTransition] = useTransition();

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"ideas" | "editor" | "brainstorm">(initialTab);

  // ── Ideas list state ──────────────────────────────────────────────────────
  const [ideas,      setIdeas]      = useState<IdeaSummary[]>(initialIdeas);
  const [total,      setTotal]      = useState(ideaTotal);
  const [pages,      setPages]      = useState(ideaPages);
  const [page,       setPage]       = useState(currentPage);
  const [search,     setSearch]     = useState(initialSearch);
  const [category,   setCategory]   = useState(initialCategory);
  const [status,     setStatus]     = useState(initialStatus);
  const [sortBy,     setSortBy]     = useState("createdAt_desc");
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [statsData,  setStatsData]  = useState(stats);

  // ── Editor state ──────────────────────────────────────────────────────────
  const [editIdea,   setEditIdea]   = useState<IdeaFull | null>(null);
  const [editorPrefill, setEditorPrefill] = useState<Partial<IdeaFull> | null>(null);

  // ── Confirm dialog ────────────────────────────────────────────────────────
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; danger?: boolean;
    confirmLabel?: string; action?: () => Promise<void>;
  }>({ open: false, title: "", message: "" });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchIdeas = useCallback(async (opts?: {
    q?: string; cat?: string; st?: string; sort?: string; pg?: number;
  }) => {
    const q    = opts?.q    ?? search;
    const cat  = opts?.cat  ?? category;
    const st   = opts?.st   ?? status;
    const sort = opts?.sort ?? sortBy;
    const pg   = opts?.pg   ?? page;

    const params = new URLSearchParams({ page: String(pg), pageSize: "20" });
    if (q && q !== "")     params.set("search", q);
    if (cat && cat !== "ALL") params.set("category", cat);
    if (st  && st  !== "ALL") params.set("status",   st);
    const [sf, sd] = sort.split("_");
    params.set("sortBy", sf); params.set("sortOrder", sd);

    const res  = await fetch(`/api/admin/ideas?${params}`);
    const data = await res.json();
    setIdeas(data.ideas ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
  }, [search, category, status, sortBy, page]);

  // ── Open editor (load full content) ───────────────────────────────────────
  const openEditor = useCallback(async (idea: IdeaSummary) => {
    const res  = await fetch(`/api/admin/ideas/${idea.id}`);
    const full = await res.json();
    setEditIdea(full);
    setEditorPrefill(null);
    setTab("editor");
  }, []);

  // ── Handle "Use this idea" from brainstorm ────────────────────────────────
  const handleUseIdea = useCallback((data: { title: string; summary: string; content: string; tags: string[] }) => {
    setEditIdea(null);
    setEditorPrefill({
      ...data,
      tags: JSON.stringify(data.tags),
    } as Partial<IdeaFull>);
    setTab("editor");
  }, []);

  // ── Toggle publish / featured (optimistic) ────────────────────────────────
  const handleTogglePublish = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "togglePublish" }),
    });
    const updated = await res.json();
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, isPublished: updated.isPublished } : i));
    setStatsData((s) => ({
      ...s,
      published: s.published + (updated.isPublished ? 1 : -1),
      drafts:    s.drafts    + (updated.isPublished ? -1 : 1),
    }));
  }, []);

  const handleToggleFeatured = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "toggleFeatured" }),
    });
    const updated = await res.json();
    // Only one featured at a time — update all
    setIdeas((prev) => prev.map((i) => ({
      ...i, isFeatured: i.id === id ? updated.isFeatured : (updated.isFeatured ? false : i.isFeatured),
    })));
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "duplicate" }),
    });
    const copy = await res.json();
    setIdeas((prev) => [copy, ...prev]);
    setTotal((t) => t + 1);
    setStatsData((s) => ({ ...s, total: s.total + 1, drafts: s.drafts + 1 }));
  }, []);

  const handleDelete = useCallback((id: string, title: string) => {
    setConfirm({
      open: true, danger: true,
      title: `Delete "${title}"?`,
      message: "This idea will be permanently deleted from the database. This cannot be undone.",
      confirmLabel: "Delete",
      action: async () => {
        await fetch(`/api/admin/ideas/${id}`, { method: "DELETE" });
        setIdeas((prev) => prev.filter((i) => i.id !== id));
        setTotal((t) => t - 1);
        setStatsData((s) => ({ ...s, total: s.total - 1 }));
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      },
    });
  }, []);

  const handleBulkDelete = () => {
    const ids = [...selected];
    setConfirm({
      open: true, danger: true,
      title: `Delete ${ids.length} idea(s)?`,
      message: "Selected ideas will be permanently deleted. This cannot be undone.",
      confirmLabel: "Delete All",
      action: async () => {
        await fetch("/api/admin/ideas", {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        setIdeas((prev) => prev.filter((i) => !ids.includes(i.id)));
        setTotal((t) => t - ids.length);
        setStatsData((s) => ({ ...s, total: s.total - ids.length }));
        setSelected(new Set());
      },
    });
  };

  const handleSaved = useCallback((saved: IdeaFull) => {
    setIdeas((prev) => {
      const exists = prev.find((i) => i.id === saved.id);
      if (exists) return prev.map((i) => i.id === saved.id ? { ...i, ...saved } : i);
      return [saved, ...prev];
    });
    if (!ideas.find((i) => i.id === saved.id)) {
      setTotal((t) => t + 1);
      setStatsData((s) => ({ ...s, total: s.total + 1, drafts: s.drafts + 1 }));
    }
  }, [ideas]);

  const runConfirm = async () => {
    if (!confirm.action) return;
    setConfirmLoading(true);
    await confirm.action();
    setConfirm((s) => ({ ...s, open: false }));
    setConfirmLoading(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <ConfirmDialog
        open={confirm.open} title={confirm.title} message={confirm.message}
        danger={confirm.danger} confirmLabel={confirm.confirmLabel}
        onConfirm={runConfirm} onCancel={() => setConfirm((s) => ({ ...s, open: false }))}
        loading={confirmLoading}
      />

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-0 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Ideas Lab</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {statsData.total} ideas · {statsData.published} published · {statsData.drafts} drafts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setTab("brainstorm"); setEditIdea(null); }}
              className="flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-4 py-2.5 rounded-sm transition-colors"
            >
              <Brain className="w-4 h-4" />AI Brainstorm
            </button>
            <button
              onClick={() => { setEditIdea(null); setEditorPrefill(null); setTab("editor"); }}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />New Idea
            </button>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
          {[
            { label: "Total",     value: statsData.total,      color: "#f59e0b", icon: Lightbulb },
            { label: "Published", value: statsData.published,  color: "#10b981", icon: Globe    },
            { label: "Drafts",    value: statsData.drafts,     color: "#6b7280", icon: Lock     },
            { label: "Featured",  value: statsData.featured,   color: "#f59e0b", icon: Star     },
            { label: "Total Views",value: statsData.totalViews, color: "#3b82f6", icon: Eye     },
            { label: "Total Likes",value: statsData.totalLikes, color: "#ec4899", icon: Heart   },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-3.5">
              <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
              <p className="text-xl font-black text-stone-900">{s.value.toLocaleString()}</p>
              <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5">
          {[
            { id: "ideas",      label: "All Ideas",  icon: Grid3x3  },
            { id: "editor",     label: editIdea ? `Editing: ${editIdea.title.slice(0, 28)}…` : "New Idea", icon: Pencil },
            { id: "brainstorm", label: "AI Brainstorm", icon: Brain },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as "ideas" | "editor" | "brainstorm")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-stone-400 hover:text-stone-700"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: ALL IDEAS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "ideas" && (
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: category sidebar ────────────────────────────────────── */}
          <div className="w-48 flex-shrink-0 border-r border-stone-100 overflow-y-auto bg-stone-50/40 p-3">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2 mt-1">Category</p>
            {[{ label: "All", count: statsData.total, value: "ALL" },
              ...Object.entries(CATEGORY_CFG).map(([k, v]) => ({
                label: `${v.emoji} ${v.label}`,
                count: statsData.byCategory.find((b) => b.category === k)?.count ?? 0,
                value: k,
              }))
            ].map((item) => (
              <button key={item.value}
                onClick={() => { setCategory(item.value); setPage(1); fetchIdeas({ cat: item.value, pg: 1 }); }}
                className={`w-full flex items-center justify-between gap-1 px-2.5 py-2 rounded-sm text-left transition-colors ${
                  category === item.value
                    ? "bg-amber-50 text-amber-700"
                    : "text-stone-500 hover:bg-white hover:text-stone-800"
                }`}
              >
                <span className="text-xs font-semibold truncate">{item.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                  category === item.value ? "bg-amber-200/60 text-amber-700" : "bg-stone-200 text-stone-400"
                }`}>{item.count}</span>
              </button>
            ))}

            <div className="mt-4 pt-3 border-t border-stone-200">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2">Status</p>
              {[
                { label: "All", value: "ALL" } as { label: string; value: string; dot?: string },
                ...Object.entries(STATUS_CFG).map(([k, v]) => ({ label: v.label, value: k, dot: v.dot }))
              ].map((item) => (
                <button key={item.value}
                  onClick={() => { setStatus(item.value); setPage(1); fetchIdeas({ st: item.value, pg: 1 }); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-sm text-left transition-colors text-xs font-semibold ${
                    status === item.value ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-white hover:text-stone-800"
                  }`}
                >
                  {item.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.dot }} />}
                  {item.label}
                </button>
              ))}
            </div>

            {/* Top viewed */}
            {statsData.topViewed.length > 0 && (
              <div className="mt-4 pt-3 border-t border-stone-200">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2">Top Viewed</p>
                {statsData.topViewed.slice(0, 5).map((i) => (
                  <div key={i.id} className="px-2 py-1.5">
                    <p className="text-[11px] text-stone-600 font-semibold line-clamp-2 leading-tight">{i.title}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{i.viewCount.toLocaleString()} views</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: list ──────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                    fetchIdeas({ q: e.target.value, pg: 1 });
                  }}
                  placeholder="Search ideas…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); fetchIdeas({ sort: e.target.value, pg: 1 }); }}
                className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-amber-400"
              >
                <option value="createdAt_desc">Newest</option>
                <option value="createdAt_asc">Oldest</option>
                <option value="updatedAt_desc">Recently updated</option>
                <option value="viewCount_desc">Most viewed</option>
                <option value="likeCount_desc">Most liked</option>
                <option value="title_asc">Title A–Z</option>
              </select>

              {/* Bulk actions */}
              {selected.size > 0 && (
                <div className="flex items-center gap-2 ml-auto pl-2 border-l border-stone-200">
                  <span className="text-xs font-semibold text-stone-600">{selected.size} selected</span>
                  <button onClick={handleBulkDelete}
                    className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                  <button onClick={() => setSelected(new Set())}
                    className="text-xs text-stone-400 hover:text-stone-700 transition-colors">Clear</button>
                </div>
              )}

              <span className="text-xs text-stone-400 ml-auto">{total} idea{total !== 1 ? "s" : ""}</span>
            </div>

            {/* Select-all row */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-stone-50 bg-stone-50/40">
              <button
                onClick={() => setSelected(selected.size === ideas.length && ideas.length > 0 ? new Set() : new Set(ideas.map((i) => i.id)))}
                className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center gap-1.5"
              >
                {selected.size === ideas.length && ideas.length > 0
                  ? <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                  : <Square className="w-3.5 h-3.5" />
                }
                Select all
              </button>
              <span className="text-[11px] text-stone-300">
                {search && <>Showing results for &#34;<strong className="text-stone-500">{search}</strong>&#34;</>}
              </span>
            </div>

            {/* Ideas list */}
            <div className="flex-1 overflow-y-auto">
              {ideas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Lightbulb className="w-10 h-10 text-stone-200 mb-3" />
                  <p className="text-sm text-stone-400 font-medium">
                    {search ? `No ideas match "${search}"` : "No ideas yet"}
                  </p>
                  <button onClick={() => setTab("editor")}
                    className="mt-3 text-xs text-amber-600 font-semibold hover:text-amber-800 underline underline-offset-2">
                    Create your first idea
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {ideas.map((idea) => (
                    <IdeaRow
                      key={idea.id}
                      idea={idea}
                      selected={selected.has(idea.id)}
                      onSelect={(id) => setSelected((prev) => {
                        const n = new Set(prev);
                        if (prev.has(id)) {
                          n.delete(id);
                        } else {
                          n.add(id);
                        }
                        return n;
                      })}
                      onEdit={openEditor}
                      onDelete={handleDelete}
                      onTogglePublish={handleTogglePublish}
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
                    onClick={() => { setPage(page - 1); fetchIdeas({ pg: page - 1 }); }}
                    className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                    ← Prev
                  </button>
                  <span className="text-xs text-stone-400">Page {page} of {pages}</span>
                  <button disabled={page >= pages}
                    onClick={() => { setPage(page + 1); fetchIdeas({ pg: page + 1 }); }}
                    className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: EDITOR
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "editor" && (
        <div className="flex-1 overflow-hidden">
          <IdeaEditor
            idea={editIdea}
            userId={userId}
            onSaved={(saved) => { handleSaved(saved); }}
            onCancel={() => { setTab("ideas"); setEditIdea(null); setEditorPrefill(null); }}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: BRAINSTORM
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "brainstorm" && (
        <div className="flex-1 overflow-hidden">
          <BrainstormTab onUseIdea={handleUseIdea} />
        </div>
      )}
    </div>
  );
}