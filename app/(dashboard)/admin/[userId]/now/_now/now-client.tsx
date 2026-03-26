"use client";

// =============================================================================
// isaacpaha.com — Now Page Admin Client
// components/admin/now/now-admin-client.tsx
//
// Four tabs:
//   1. Now Entries  — monthly /now page entries list + full editor with AI draft
//   2. Timeline     — personal journey events (create, edit, reorder)
//   3. Knowledge    — books, papers, courses, etc.
//   4. Overview     — stats + quick actions + preview of live /now page
//
// AI integration (assessed as HIGHLY VALUABLE for this page):
//   - Draft full monthly entry from bullet notes in Isaac's voice
//   - Refine / polish existing drafts
//   - Write individual sections (building, reading, thoughts, next)
//   - Generate timeline event descriptions from sparse notes
//   - Monthly reflection prompts to help Isaac think before writing
//
// Reasoning: The /now page requires consistent, voice-authentic monthly writing.
// AI lowers friction significantly without replacing Isaac's thinking — he provides
// the raw notes and facts, Claude drafts in his established voice.
// =============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Plus as GoPlus, Edit2, Trash2, Check, X, AlertCircle, Loader2,
  ArrowLeft, Globe, Lock, Save, Sparkles, 
  BookOpen, Layers, Wand2, Copy, 
  ExternalLink, Star, GraduationCap,
  Briefcase, Award, Rocket, Heart,  BarChart2,
  MessageSquare, Eye, 
  Brain,  FileText, Activity,
   Link2, 
  
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type NowEntry = {
  id:          string;
  month:       number;
  year:        number;
  title:       string;
  content:     string;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt:   Date;
  updatedAt:   Date;
};

type TimelineEvent = {
  id:          string;
  year:        number;
  month:       number | null;
  title:       string;
  description: string;
  type:        TimelineType;
  icon:        string | null;
  imageUrl:    string | null;
  link:        string | null;
  isHighlight: boolean;
  sortOrder:   number;
  createdAt:   Date;
};

type KnowledgeItem = {
  id:            string;
  title:         string;
  author:        string | null;
  type:          KnowledgeType;
  url:           string | null;
  imageUrl:      string | null;
  description:   string | null;
  notes:         string | null;
  rating:        number | null;
  isRecommended: boolean;
  isFeatured:    boolean;
  finishedAt:    Date | null;
  startedAt:     Date | null;
  tags:          string | null;
  createdAt:     Date;
  updatedAt:     Date;
};

type RecentQuestion = {
  id:        string;
  askerName: string;
  question:  string;
  status:    string;
  isPublic:  boolean;
  createdAt: Date;
};

type Stats = {
  totalEntries: number;
  published:    number;
  drafts:       number;
  totalTimeline: number;
  totalKnowledge: number;
  totalQuestions: number;
};

type TimelineType  = "EDUCATION" | "CAREER" | "PROJECT" | "PERSONAL" | "MILESTONE" | "AWARD";
type KnowledgeType = "BOOK" | "PAPER" | "COURSE" | "VIDEO" | "PODCAST" | "ARTICLE" | "TOOL" | "OTHER";

interface Props {
  userId:           string;
  stats:            Stats;
  initialEntries:   NowEntry[];
  initialTimeline:  TimelineEvent[];
  initialKnowledge: KnowledgeItem[];
  recentQuestions:  RecentQuestion[];
  initialTab:       "now" | "timeline" | "knowledge" | "overview";
  initialEditId?:   string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TIMELINE_TYPE_CFG: Record<TimelineType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  EDUCATION: { label: "Education", color: "#8b5cf6", bg: "#ede9fe", icon: GraduationCap },
  CAREER:    { label: "Career",    color: "#3b82f6", bg: "#dbeafe", icon: Briefcase     },
  PROJECT:   { label: "Project",   color: "#10b981", bg: "#d1fae5", icon: Rocket        },
  PERSONAL:  { label: "Personal",  color: "#ec4899", bg: "#fce7f3", icon: Heart         },
  MILESTONE: { label: "Milestone", color: "#f59e0b", bg: "#fef3c7", icon: Star          },
  AWARD:     { label: "Award",     color: "#f97316", bg: "#ffedd5", icon: Award         },
};

const KNOWLEDGE_TYPE_CFG: Record<KnowledgeType, { label: string; emoji: string; color: string; bg: string }> = {
  BOOK:    { label: "Book",    emoji: "📚", color: "#8b5cf6", bg: "#ede9fe" },
  PAPER:   { label: "Paper",   emoji: "📄", color: "#3b82f6", bg: "#dbeafe" },
  COURSE:  { label: "Course",  emoji: "🎓", color: "#10b981", bg: "#d1fae5" },
  VIDEO:   { label: "Video",   emoji: "🎬", color: "#ef4444", bg: "#fee2e2" },
  PODCAST: { label: "Podcast", emoji: "🎙️", color: "#f97316", bg: "#ffedd5" },
  ARTICLE: { label: "Article", emoji: "📰", color: "#14b8a6", bg: "#ccfbf1" },
  TOOL:    { label: "Tool",    emoji: "🔧", color: "#64748b", bg: "#f1f5f9" },
  OTHER:   { label: "Other",   emoji: "✨", color: "#6366f1", bg: "#e0e7ff" },
};

const AI_MODES = [
  { id: "draft",    label: "Draft Full Entry",      icon: FileText, desc: "Write complete /now entry from your bullet notes", color: "#f59e0b" },
  { id: "refine",   label: "Refine Draft",          icon: Wand2,    desc: "Polish and sharpen an existing draft",              color: "#8b5cf6" },
  { id: "section",  label: "Write One Section",     icon: Layers,   desc: "Draft a single section (building, reading, etc.)",  color: "#3b82f6" },
  { id: "timeline", label: "Timeline Description",  icon: Clock,    desc: "Write a timeline event description from notes",     color: "#10b981" },
  { id: "reflect",  label: "Reflection Prompts",    icon: Brain,    desc: "Get 5 monthly prompts to help you think first",     color: "#ec4899" },
] as const;

type AIDraftMode = typeof AI_MODES[number]["id"];

const SECTION_OPTIONS = [
  { value: "building",  label: "What I'm Building"      },
  { value: "reading",   label: "What I'm Reading"       },
  { value: "thinking",  label: "What I'm Thinking About" },
  { value: "learning",  label: "What I'm Learning"      },
  { value: "listening", label: "What I'm Listening To"  },
  { value: "next",      label: "What's Coming Next"     },
];

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

function wordCount(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length;
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onCancel}>
          <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-sm border border-stone-100 shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}>
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
              <button onClick={onCancel} className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-sm hover:border-stone-400 transition-colors">Cancel</button>
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

// ─────────────────────────────────────────────────────────────────────────────
// AI DRAFT PANEL
// ─────────────────────────────────────────────────────────────────────────────

function AIDraftPanel({
  month, year, existingContent,
  onApply,
}: {
  month:           number;
  year:            number;
  existingContent: string;
  onApply:         (text: string, mode: AIDraftMode) => void;
}) {
  const [mode,    setMode]    = useState<AIDraftMode>("draft");
  const [notes,   setNotes]   = useState("");
  const [section, setSection] = useState("building");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState("");
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  const run = async () => {
    setLoading(true); setResult(""); setError("");
    try {
      const res  = await fetch("/api/admin/now/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode, notes: notes.trim(), month, year, section,
          existingContent: mode === "refine" ? existingContent : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed"); }
      else { setResult(data.content ?? ""); }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-amber-200 bg-amber-50/40 rounded-sm overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200/60 bg-amber-50">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-black text-amber-700">AI Writing Assistant</span>
        <span className="ml-auto text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-sm font-semibold">Claude · Isaac&apos;s voice</span>
      </div>

      {/* Why AI here? — brief rationale shown inline */}
      <div className="px-4 py-2.5 border-b border-amber-100 bg-white/60">
        <p className="text-[11px] text-stone-500 leading-relaxed">
          <span className="font-bold text-stone-600">Why AI here:</span> The /now page needs consistent monthly writing.
          You provide the raw notes and facts — Claude drafts in your established voice. Your thinking, his prose speed.
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Mode selector */}
        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Mode</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {AI_MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-start gap-2 p-2.5 rounded-sm border text-left transition-colors ${
                  mode === m.id ? "bg-amber-50 border-amber-300" : "bg-white border-stone-200 hover:border-stone-300"
                }`}>
                <m.icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: mode === m.id ? m.color : "#9ca3af" }} />
                <div>
                  <p className={`text-[11px] font-bold leading-tight ${mode === m.id ? "text-amber-700" : "text-stone-600"}`}>{m.label}</p>
                  <p className="text-[10px] text-stone-400 leading-snug mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section picker (only for "section" mode) */}
        {mode === "section" && (
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Which section?</label>
            <select value={section} onChange={(e) => setSection(e.target.value)}
              className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
              {SECTION_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}

        {/* Notes input */}
        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
            {mode === "reflect"   ? "Context (optional — describe your month roughly)" :
             mode === "refine"    ? "What to change / improve (optional)" :
             mode === "timeline"  ? "Event notes (what happened, when, why it mattered)" :
             "Your bullet notes — what you're doing, building, reading, thinking…"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={mode === "draft" ? 6 : 3}
            placeholder={
              mode === "draft"    ? "- Building okSumame courier API layer, 14 integrations done\n- Reading Anatomy of Fascism — on the 'practice not ideology' chapter\n- Thinking about trust dynamics in African e-commerce\n- Learning WebSockets + Redis pub/sub for real-time tracking\n- Next: Accra trip in April, okSumame alpha with 5 merchants" :
              mode === "refine"   ? "Focus on the 'building' section — make it more specific and less vague…" :
              mode === "timeline" ? "Launched oKadwuma v1 in March 2021. First product live. 50 users in the first week. Felt impossible to get there." :
              mode === "reflect"  ? "Roughly: building 3 products, London base, focusing on courier integrations, thinking about education tech…" :
              "Notes for this section…"
            }
            className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-y bg-white leading-relaxed"
          />
        </div>

        <button onClick={run} disabled={loading || (mode !== "reflect" && !notes.trim())}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating…" : `Generate ${AI_MODES.find((m) => m.id === mode)?.label}`}
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white border border-stone-200 rounded-sm">
                <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
                  <span className="text-[11px] font-bold text-stone-600">{wordCount(result)} words</span>
                  <div className="flex gap-2">
                    <button onClick={copy}
                      className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={() => setResult("")}
                      className="text-stone-300 hover:text-stone-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3 max-h-64 overflow-y-auto">
                  <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
                </div>
                <div className="flex gap-2 px-3 py-2 border-t border-stone-100 bg-stone-50/40">
                  <button onClick={() => onApply(result, mode)}
                    className="flex-1 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-sm transition-colors flex items-center justify-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {mode === "refine" ? "Replace draft" : "Use in editor"}
                  </button>
                  <button onClick={() => onApply(result + "\n\n", mode)}
                    className="text-xs font-semibold text-stone-500 border border-stone-200 hover:bg-stone-100 px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1.5">
                    <Plus className="w-3 h-3" />Append
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOW ENTRY EDITOR
// ─────────────────────────────────────────────────────────────────────────────

function NowEntryEditor({
  entry, onSaved, onCancel,
}: {
  entry:    NowEntry | null;
  onSaved:  (saved: NowEntry) => void;
  onCancel: () => void;
}) {
  const isEdit = !!entry;
  const now    = new Date();

  const [month,       setMonth]       = useState(entry?.month       ?? now.getMonth() + 1);
  const [year,        setYear]        = useState(entry?.year        ?? now.getFullYear());
  const [title,       setTitle]       = useState(entry?.title       ?? "");
  const [content,     setContent]     = useState(entry?.content     ?? "");
  const [isPublished, setIsPublished] = useState(entry?.isPublished ?? false);
  const [showAI,      setShowAI]      = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveErr,     setSaveErr]     = useState("");
  const [savedOk,     setSavedOk]     = useState(false);

  const wc = wordCount(content);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { setSaveErr("Title and content are required."); return; }
    setSaving(true); setSaveErr("");
    try {
      const body = { month, year, title: title.trim(), content: content.trim(), isPublished };
      let saved: NowEntry;
      if (isEdit && entry) {
        const res  = await fetch(`/api/admin/now/${entry.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        saved = await res.json();
      } else {
        const res  = await fetch("/api/admin/now", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json();
        saved = data.entry;
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      onSaved(saved);
    } catch (e: any) { setSaveErr(e.message ?? "Save failed"); }
    setSaving(false);
  };

  const handleAIApply = (text: string, mode: AIDraftMode) => {
    if (mode === "refine") { setContent(text); }
    else { setContent((c) => c ? `${c}\n\n${text}` : text); }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-stone-100 flex-shrink-0">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Now entries
        </button>
        <div className="flex items-center gap-2">
          {isEdit && (
            <a href="/now" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
              <ExternalLink className="w-3 h-3" />View Live
            </a>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : savedOk ? "Saved!" : isEdit ? "Save Changes" : "Publish Now Entry"}
          </button>
        </div>
      </div>

      {saveErr && (
        <div className="mx-6 mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-5">

          {/* Month / Year / Publish */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
                {MONTH_NAMES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Year</label>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Visibility</label>
              <button onClick={() => setIsPublished((p) => !p)}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
                  isPublished ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-50 text-stone-500 border-stone-200"
                }`}>
                {isPublished ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isPublished ? "Published" : "Draft"}
              </button>
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">AI Assistant</label>
              <button onClick={() => setShowAI((p) => !p)}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
                  showAI ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-stone-50 text-stone-500 border-stone-200"
                }`}>
                <Sparkles className="w-3.5 h-3.5" />
                {showAI ? "Hide AI" : "Use AI"}
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
              Entry Title <span className="text-red-400">*</span>
              <span className="ml-2 text-stone-300 font-normal normal-case">e.g. "March 2026 — Building in the Rain"</span>
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={`${MONTH_NAMES[month]} ${year} — …`}
              className="w-full text-xl font-bold border-0 border-b-2 border-stone-200 focus:border-amber-400 focus:outline-none pb-2 bg-transparent placeholder:text-stone-300 placeholder:font-normal text-stone-900"
            />
          </div>

          {/* AI Panel */}
          <AnimatePresence>
            {showAI && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <AIDraftPanel
                  month={month} year={year}
                  existingContent={content}
                  onApply={handleAIApply}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Content <span className="text-red-400">*</span>
                {wc > 0 && <span className="ml-2 text-stone-300 font-normal normal-case">{wc} words</span>}
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAI(true)}
                  className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 transition-colors">
                  <Sparkles className="w-3 h-3" />AI draft
                </button>
              </div>
            </div>
            <div className="text-[10px] text-stone-400 mb-2 leading-relaxed bg-stone-50 border border-stone-100 rounded-sm px-3 py-2">
              <span className="font-bold text-stone-500">Format tip:</span> Use ### headings for sections — ### Building, ### Reading, ### Thinking About, ### Learning, ### What's Next. Write in plain prose. Markdown is rendered on the public page.
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={24}
              placeholder="### Building&#10;&#10;Working on the real-time tracking layer for okSumame...&#10;&#10;### Reading&#10;&#10;Still deep in The Anatomy of Fascism...&#10;&#10;### Thinking About&#10;&#10;The trust problem in African e-commerce isn't payments...&#10;&#10;### Learning&#10;&#10;Going deep on WebSockets and Redis pub/sub...&#10;&#10;### What's Next&#10;&#10;Accra in April for merchant research..."
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-3 focus:outline-none focus:border-amber-400 resize-y bg-white leading-relaxed font-mono"
            />
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE TAB
// ─────────────────────────────────────────────────────────────────────────────

function TimelineTab({
  events: initialEvents,
}: { events: TimelineEvent[] }) {
  const [events,    setEvents]    = useState<TimelineEvent[]>(initialEvents);
  const [editEvent, setEditEvent] = useState<TimelineEvent | null>(null);
  const [isNew,     setIsNew]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [aiNotes,   setAiNotes]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState("");

  // Form state for editing
  const [form, setForm] = useState({
    year: new Date().getFullYear(), month: null as number | null,
    title: "", description: "", type: "MILESTONE" as TimelineType,
    icon: "", imageUrl: "", link: "", isHighlight: false, sortOrder: 0,
  });

  const openNew = () => {
    setForm({ year: new Date().getFullYear(), month: null, title: "", description: "", type: "MILESTONE", icon: "", imageUrl: "", link: "", isHighlight: false, sortOrder: 0 });
    setEditEvent(null);
    setIsNew(true);
  };

  const openEdit = (ev: TimelineEvent) => {
    setForm({
      year: ev.year, month: ev.month, title: ev.title,
      description: ev.description, type: ev.type,
      icon: ev.icon ?? "", imageUrl: ev.imageUrl ?? "", link: ev.link ?? "",
      isHighlight: ev.isHighlight, sortOrder: ev.sortOrder,
    });
    setEditEvent(ev);
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      if (editEvent) {
        const res  = await fetch(`/api/admin/now/timeline/${editEvent.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        const updated = await res.json();
        setEvents((prev) => prev.map((e) => e.id === editEvent.id ? updated : e).sort((a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0)));
      } else {
        const res  = await fetch("/api/admin/now/timeline", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        const data = await res.json();
        setEvents((prev) => [data.event, ...prev].sort((a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0)));
      }
      setIsNew(false); setEditEvent(null);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/admin/now/timeline/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  };

  const generateDescription = async () => {
    if (!aiNotes.trim()) return;
    setAiLoading(true); setAiResult("");
    try {
      const res  = await fetch("/api/admin/now/draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "timeline", notes: aiNotes }),
      });
      const data = await res.json();
      setAiResult(data.content ?? "");
    } catch {}
    setAiLoading(false);
  };

  const grouped = events.reduce<Record<number, TimelineEvent[]>>((acc, e) => {
    (acc[e.year] = acc[e.year] ?? []).push(e);
    return acc;
  }, {});
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: form */}
      <div className="w-80 flex-shrink-0 border-r border-stone-100 overflow-y-auto bg-stone-50/40 p-4">
        {!isNew ? (
          <button onClick={openNew}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-3 rounded-sm transition-colors mb-4">
            <Plus className="w-4 h-4" />Add Timeline Event
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-stone-700">{editEvent ? "Edit Event" : "New Event"}</p>
              <button onClick={() => { setIsNew(false); setEditEvent(null); }} className="text-stone-400 hover:text-stone-700 transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {/* Year / Month */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Year</label>
                <input type="number" value={form.year} onChange={(e) => setForm((s) => ({ ...s, year: Number(e.target.value) }))}
                  className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Month</label>
                <select value={form.month ?? ""} onChange={(e) => setForm((s) => ({ ...s, month: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400 bg-white">
                  <option value="">—</option>
                  {MONTH_NAMES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m.slice(0, 3)}</option>)}
                </select>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as TimelineType }))}
                className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400 bg-white">
                {Object.entries(TIMELINE_TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Launched oKadwuma v1"
                className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Description + AI */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Description</label>
              </div>
              <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                rows={3} placeholder="What happened and why it mattered…"
                className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400 resize-none"
              />
              {/* AI description helper */}
              <div className="mt-2 border border-amber-200/60 rounded-sm overflow-hidden">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border-b border-amber-100">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-700">AI: Write description from notes</span>
                </div>
                <div className="p-2">
                  <textarea value={aiNotes} onChange={(e) => setAiNotes(e.target.value)}
                    rows={2} placeholder="Raw notes about this event…"
                    className="w-full text-[11px] border border-stone-200 rounded-sm px-2 py-1 focus:outline-none focus:border-amber-400 resize-none mb-1.5"
                  />
                  <button onClick={generateDescription} disabled={!aiNotes.trim() || aiLoading}
                    className="w-full text-[11px] font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 py-1.5 rounded-sm transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {aiLoading ? "Generating…" : "Generate"}
                  </button>
                  {aiResult && (
                    <div className="mt-2 border border-stone-100 rounded-sm p-2 bg-stone-50">
                      <p className="text-[11px] text-stone-600 leading-relaxed">{aiResult}</p>
                      <button onClick={() => { setForm((s) => ({ ...s, description: aiResult })); setAiResult(""); }}
                        className="mt-1.5 text-[10px] font-bold text-amber-600 hover:text-amber-800">
                        ← Use this
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Optional fields */}
            {[
              { label: "Icon", key: "icon",     placeholder: "🚀" },
              { label: "Link", key: "link",     placeholder: "https://…" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400"
                />
              </div>
            ))}

            {/* Highlight toggle */}
            <button onClick={() => setForm((s) => ({ ...s, isHighlight: !s.isHighlight }))}
              className={`w-full flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
                form.isHighlight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-stone-50 text-stone-500 border-stone-200"
              }`}>
              <Star className={`w-3.5 h-3.5 ${form.isHighlight ? "fill-amber-400 text-amber-400" : ""}`} />
              {form.isHighlight ? "Highlighted" : "Mark as highlight"}
            </button>

            <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.description.trim()}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editEvent ? "Save Changes" : "Add Event"}
            </button>
          </div>
        )}
      </div>

      {/* Right: timeline */}
      <div className="flex-1 overflow-y-auto p-5">
        {years.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="w-10 h-10 text-stone-200 mb-3" />
            <p className="text-sm text-stone-400">No timeline events yet</p>
            <button onClick={openNew} className="mt-3 text-xs text-amber-600 font-semibold hover:text-amber-800 underline underline-offset-2">Add first event</button>
          </div>
        ) : (
          <div className="space-y-8">
            {years.map((yr) => (
              <div key={yr}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-sm font-black text-stone-700 bg-stone-100 px-3 py-1 rounded-sm">{yr}</div>
                  <div className="flex-1 h-px bg-stone-100" />
                </div>
                <div className="space-y-3 pl-4 border-l-2 border-stone-100">
                  {grouped[yr].map((ev) => {
                    const cfg = TIMELINE_TYPE_CFG[ev.type];
                    const Icon = cfg.icon;
                    return (
                      <div key={ev.id} className="group relative flex items-start gap-3 bg-white border border-stone-100 rounded-sm p-4 hover:border-stone-200 transition-colors">
                        <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                          {ev.icon ? <span className="text-base">{ev.icon}</span> : <Icon className="w-4 h-4" style={{ color: cfg.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <p className="text-sm font-bold text-stone-800">{ev.title}</p>
                            {ev.isHighlight && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0 mt-0.5" />}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                              {cfg.label}
                            </span>
                            {ev.month && <span className="text-[10px] text-stone-400">{MONTH_NAMES[ev.month]}</span>}
                          </div>
                          <p className="text-xs text-stone-500 mt-1 leading-relaxed">{ev.description}</p>
                          {ev.link && (
                            <a href={ev.link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-amber-600 hover:underline mt-1">
                              <Link2 className="w-3 h-3" />View
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(ev)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id}
                            className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-sm">
                            {deleting === ev.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE TAB
// ─────────────────────────────────────────────────────────────────────────────

function KnowledgeTab({ items: initialItems }: { items: KnowledgeItem[] }) {
  const [items,     setItems]     = useState<KnowledgeItem[]>(initialItems);
  const [isNew,     setIsNew]     = useState(false);
  const [editItem,  setEditItem]  = useState<KnowledgeItem | null>(null);
  const [filterType, setFilterType] = useState<KnowledgeType | "ALL">("ALL");
  const [search,    setSearch]    = useState("");
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [tagInput,  setTagInput]  = useState("");

  const [form, setForm] = useState({
    title: "", author: "", type: "BOOK" as KnowledgeType,
    url: "", imageUrl: "", description: "", notes: "",
    rating: null as number | null,
    isRecommended: false, isFeatured: false,
    tags: [] as string[],
    finishedAt: "", startedAt: "",
  });

  const openNew = () => {
    setForm({ title: "", author: "", type: "BOOK", url: "", imageUrl: "", description: "", notes: "", rating: null, isRecommended: false, isFeatured: false, tags: [], finishedAt: "", startedAt: "" });
    setEditItem(null);
    setTagInput("");
    setIsNew(true);
  };

  const openEdit = (item: KnowledgeItem) => {
    setForm({
      title: item.title, author: item.author ?? "", type: item.type,
      url: item.url ?? "", imageUrl: item.imageUrl ?? "",
      description: item.description ?? "", notes: item.notes ?? "",
      rating: item.rating, isRecommended: item.isRecommended,
      isFeatured: item.isFeatured, tags: parseTags(item.tags),
      finishedAt: item.finishedAt ? new Date(item.finishedAt).toISOString().slice(0, 10) : "",
      startedAt:  item.startedAt  ? new Date(item.startedAt).toISOString().slice(0, 10)  : "",
    });
    setEditItem(item);
    setTagInput("");
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const body = {
      ...form,
      finishedAt: form.finishedAt ? new Date(form.finishedAt) : null,
      startedAt:  form.startedAt  ? new Date(form.startedAt)  : null,
    };
    try {
      if (editItem) {
        const res  = await fetch(`/api/admin/now/knowledge/${editItem.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const updated = await res.json();
        setItems((prev) => prev.map((i) => i.id === editItem.id ? updated : i));
      } else {
        const res  = await fetch("/api/admin/now/knowledge", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json();
        setItems((prev) => [data.item, ...prev]);
      }
      setIsNew(false); setEditItem(null);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/admin/now/knowledge/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm((s) => ({ ...s, tags: [...s.tags, t] }));
    setTagInput("");
  };

  const filtered = items.filter((item) => {
    const matchType   = filterType === "ALL" || item.type === filterType;
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || (item.author ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: form */}
      <div className="w-80 flex-shrink-0 border-r border-stone-100 overflow-y-auto bg-stone-50/40 p-4">
        {!isNew ? (
          <button onClick={openNew}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-3 rounded-sm transition-colors mb-4">
            <Plus className="w-4 h-4" />Add Knowledge Item
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-stone-700">{editItem ? "Edit Item" : "New Item"}</p>
              <button onClick={() => { setIsNew(false); setEditItem(null); }} className="text-stone-400 hover:text-stone-700"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as KnowledgeType }))}
                className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400 bg-white">
                {Object.entries(KNOWLEDGE_TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Book / course / article title"
                className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Author</label>
              <input value={form.author} onChange={(e) => setForm((s) => ({ ...s, author: e.target.value }))}
                placeholder="Author / creator"
                className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                rows={2} placeholder="Brief description"
                className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">My Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                rows={4} placeholder="Your personal notes, highlights, takeaways…"
                className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Rating (1-5)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setForm((s) => ({ ...s, rating: s.rating === n ? null : n }))}
                    className={`flex-1 py-1.5 rounded-sm text-sm border transition-colors ${
                      (form.rating ?? 0) >= n ? "bg-amber-50 border-amber-300 text-amber-500" : "border-stone-200 text-stone-300"
                    }`}>★</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[{ label: "Started", key: "startedAt" }, { label: "Finished", key: "finishedAt" }].map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">{f.label}</label>
                  <input type="date" value={(form as any)[f.key]}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    className="w-full text-[11px] border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">URL</label>
              <input value={form.url} onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
                placeholder="https://…"
                className="w-full text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Tags</label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {form.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-sm">
                    {t}<button onClick={() => setForm((s) => ({ ...s, tags: s.tags.filter((x) => x !== t) }))}><X className="w-2 h-2" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag…" className="flex-1 text-xs border border-stone-200 rounded-sm px-2 py-1 focus:outline-none focus:border-amber-400"
                />
                <button onClick={addTag} className="text-xs font-bold text-amber-600 border border-amber-200 px-2 py-1 rounded-sm hover:bg-amber-50 transition-colors">+</button>
              </div>
            </div>

            {/* Flags */}
            <div className="flex gap-2">
              {[
                { label: "Recommended", key: "isRecommended" },
                { label: "Featured",    key: "isFeatured" },
              ].map((f) => (
                <button key={f.key} onClick={() => setForm((s) => ({ ...s, [f.key]: !(s as any)[f.key] }))}
                  className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-sm border transition-colors ${
                    (form as any)[f.key] ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-stone-50 text-stone-400 border-stone-200"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <button onClick={handleSave} disabled={saving || !form.title.trim()}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editItem ? "Save Changes" : "Add Item"}
            </button>
          </div>
        )}
      </div>

      {/* Right: items list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…" className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(["ALL", ...Object.keys(KNOWLEDGE_TYPE_CFG)] as (KnowledgeType | "ALL")[]).map((t) => {
              const cfg = t !== "ALL" ? KNOWLEDGE_TYPE_CFG[t as KnowledgeType] : null;
              return (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border transition-colors ${
                    filterType === t ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
                  }`}>
                  {cfg ? `${cfg.emoji} ${cfg.label}` : "All"}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-stone-400 ml-auto">{filtered.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <BookOpen className="w-10 h-10 text-stone-200 mb-3" />
              <p className="text-sm text-stone-400">No knowledge items yet</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {filtered.map((item) => {
                const cfg = KNOWLEDGE_TYPE_CFG[item.type];
                return (
                  <div key={item.id} className="group flex items-start gap-3 px-4 py-3.5 hover:bg-stone-50/60 transition-colors">
                    <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0 border border-stone-100" style={{ backgroundColor: cfg.bg }}>
                      {cfg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-stone-800">{item.title}</p>
                        {item.isFeatured    && <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm uppercase">Featured</span>}
                        {item.isRecommended && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm uppercase">Recommended</span>}
                      </div>
                      {item.author && <p className="text-xs text-stone-400 mt-0.5">{item.author}</p>}
                      {item.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{item.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.emoji} {cfg.label}</span>
                        {item.rating && <span className="text-[10px] text-amber-500">{"★".repeat(item.rating)}</span>}
                        {item.finishedAt && <span className="text-[10px] text-stone-400">Finished {fmtDate(item.finishedAt)}</span>}
                        {parseTags(item.tags).slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-sm">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => openEdit(item)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                        className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-sm">
                        {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────────────────────────

function OverviewTab({
  stats, entries, questions, userId,
}: {
  stats: Stats; entries: NowEntry[]; questions: RecentQuestion[]; userId: string;
}) {
  const latest = entries.find((e) => e.isPublished) ?? entries[0];
  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Now Entries",       value: stats.totalEntries,  color: "#f59e0b", icon: Clock       },
          { label: "Published",         value: stats.published,     color: "#10b981", icon: Globe       },
          { label: "Timeline Events",   value: stats.totalTimeline, color: "#8b5cf6", icon: Activity    },
          { label: "Knowledge Items",   value: stats.totalKnowledge,color: "#3b82f6", icon: BookOpen    },
          { label: "Ask Isaac Q's",     value: stats.totalQuestions,color: "#ec4899", icon: MessageSquare },
          { label: "Drafts",            value: stats.drafts,        color: "#9ca3af", icon: Lock        },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
            <p className="text-xl font-black text-stone-900">{s.value}</p>
            <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Latest entry */}
      {latest && (
        <div className="bg-white border border-stone-100 rounded-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Latest Entry</p>
            <a href="/now" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
              <ExternalLink className="w-3 h-3" />View live
            </a>
          </div>
          <p className="text-base font-black text-stone-800">{latest.title}</p>
          <p className="text-xs text-stone-400 mt-1">{MONTH_NAMES[latest.month]} {latest.year} · {latest.isPublished ? "Published" : "Draft"} · {wordCount(latest.content)} words · Updated {fmtDate(latest.updatedAt)}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => {}}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-sm transition-colors">
              <Edit2 className="w-3.5 h-3.5" />Edit entry
            </button>
            <Link href={`/admin/${userId}/now?tab=now`}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 border border-stone-200 hover:border-stone-400 px-3 py-1.5 rounded-sm transition-colors">
              View all entries
            </Link>
          </div>
        </div>
      )}

      {/* Recent Ask Isaac questions */}
      {questions.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-sm">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Recent Ask Isaac Questions</p>
            <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-sm font-semibold">via /ask-isaac</span>
          </div>
          <div className="divide-y divide-stone-50">
            {questions.map((q) => (
              <div key={q.id} className="px-5 py-3">
                <p className="text-xs text-stone-700 font-semibold line-clamp-1">{q.question}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-stone-400">{q.askerName}</span>
                  <span className="text-[10px] text-stone-300">·</span>
                  <span className="text-[10px] text-stone-400">{fmtDate(q.createdAt)}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    q.status === "ANSWERED_PUBLICLY" ? "text-emerald-700 bg-emerald-100" :
                    q.status === "SUBMITTED"         ? "text-amber-700 bg-amber-100" :
                    "text-stone-500 bg-stone-100"
                  }`}>{q.status.replace(/_/g, " ").toLowerCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "View /now page",    href: "/now",         icon: ExternalLink, external: true },
          { label: "Add Now Entry",     href: `?tab=now`,     icon: Plus          },
          { label: "Add Timeline Event",href: `?tab=timeline`,icon: Clock         },
        ].map((link) => (
          link.external ? (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-semibold text-stone-600 border border-stone-200 hover:border-amber-400 hover:text-amber-700 px-4 py-3 rounded-sm transition-colors">
              <link.icon className="w-4 h-4" />{link.label}
            </a>
          ) : (
            <Link key={link.label} href={link.href}
              className="flex items-center gap-2 text-xs font-semibold text-stone-600 border border-stone-200 hover:border-amber-400 hover:text-amber-700 px-4 py-3 rounded-sm transition-colors">
              <link.icon className="w-4 h-4" />{link.label}
            </Link>
          )
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

const Search = ({ className, ...props }: React.ComponentProps<typeof Eye>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
  </svg>
);

const Plus = ({ className, ...props }: React.ComponentProps<typeof Eye>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M5 12h14M12 5v14" />
  </svg>
);

export function NowAdminClient({
  userId, stats, initialEntries, initialTimeline, initialKnowledge,
  recentQuestions, initialTab, initialEditId,
}: Props) {
  const [tab,     setTab]     = useState<"now" | "timeline" | "knowledge" | "overview">(initialTab);
  const [entries, setEntries] = useState<NowEntry[]>(initialEntries);
  const [editEntry, setEditEntry] = useState<NowEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statsData, setStatsData] = useState(stats);

  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; action?: () => Promise<void>;
  }>({ open: false, title: "", message: "" });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const openNewEntry = () => { setEditEntry(null); setIsEditing(true); setTab("now"); };
  const openEditEntry = (entry: NowEntry) => { setEditEntry(entry); setIsEditing(true); setTab("now"); };

  const handleEntrySaved = (saved: NowEntry) => {
    setEntries((prev) => {
      const exists = prev.find((e) => e.id === saved.id);
      if (exists) return prev.map((e) => e.id === saved.id ? saved : e).sort((a, b) => b.year - a.year || b.month - a.month);
      return [saved, ...prev].sort((a, b) => b.year - a.year || b.month - a.month);
    });
    if (!initialEntries.find((e) => e.id === saved.id)) {
      setStatsData((s) => ({ ...s, totalEntries: s.totalEntries + 1, drafts: s.drafts + 1 }));
    }
  };

  const handleDeleteEntry = (id: string, title: string) => {
    setConfirm({
      open: true, title: `Delete "${title}"?`,
      message: "This now entry will be permanently deleted.",
      action: async () => {
        await fetch(`/api/admin/now/${id}`, { method: "DELETE" });
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setStatsData((s) => ({ ...s, totalEntries: s.totalEntries - 1 }));
      },
    });
  };

  const handleTogglePublish = async (entry: NowEntry) => {
    const res  = await fetch(`/api/admin/now/${entry.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !entry.isPublished }),
    });
    const updated = await res.json();
    setEntries((prev) => prev.map((e) => e.id === entry.id ? updated : e));
    setStatsData((s) => ({
      ...s,
      published: s.published + (updated.isPublished ? 1 : -1),
      drafts:    s.drafts    + (updated.isPublished ? -1 : 1),
    }));
  };

  const runConfirm = async () => {
    if (!confirm.action) return;
    setConfirmLoading(true);
    await confirm.action();
    setConfirm((s) => ({ ...s, open: false }));
    setConfirmLoading(false);
  };

  const TABS = [
    { id: "overview",  label: "Overview",   icon: BarChart2 },
    { id: "now",       label: "Now Entries", icon: Clock     },
    { id: "timeline",  label: "Timeline",   icon: Activity  },
    { id: "knowledge", label: "Knowledge",  icon: BookOpen  },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <ConfirmDialog
        open={confirm.open} title={confirm.title} message={confirm.message}
        danger={true} confirmLabel="Delete"
        onConfirm={runConfirm} onCancel={() => setConfirm((s) => ({ ...s, open: false }))}
        loading={confirmLoading}
      />

      {/* Page header */}
      <div className="px-6 pt-6 pb-0 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Now Page</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {statsData.totalEntries} entries · {statsData.published} published · {statsData.totalTimeline} timeline events · {statsData.totalKnowledge} knowledge items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/now" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-semibold text-stone-500 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />View Live /now
            </a>
            <button onClick={openNewEntry}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors shadow-sm">
              <Plus className="w-4 h-4" />New Entry
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5">
          {TABS.map((t) => (
            <button key={t.id}
              onClick={() => { setTab(t.id); setIsEditing(false); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id && !isEditing ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-700"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
          {isEditing && (
            <button className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-amber-500 text-amber-600">
              <Edit2 className="w-4 h-4" />
              {editEntry ? `Editing: ${MONTH_NAMES[editEntry.month]} ${editEntry.year}` : "New Entry"}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {tab === "overview" && !isEditing && (
        <div className="flex-1 overflow-y-auto">
          <OverviewTab stats={statsData} entries={entries} questions={recentQuestions} userId={userId} />
        </div>
      )}

      {tab === "now" && !isEditing && (
        <div className="flex-1 overflow-y-auto">
          {/* Now entries list */}
          <div className="max-w-3xl mx-auto p-6">
            <div className="space-y-3">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Clock className="w-10 h-10 text-stone-200 mb-3" />
                  <p className="text-sm text-stone-400">No now entries yet</p>
                  <button onClick={openNewEntry} className="mt-3 text-xs text-amber-600 font-semibold hover:text-amber-800 underline underline-offset-2">
                    Create your first entry
                  </button>
                </div>
              ) : (
                entries.map((entry) => (
                  <motion.div key={entry.id} layout
                    className="group flex items-center gap-4 bg-white border border-stone-100 rounded-sm p-4 hover:border-stone-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-stone-800">{entry.title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                          entry.isPublished ? "text-emerald-700 bg-emerald-100" : "text-stone-500 bg-stone-100"
                        }`}>{entry.isPublished ? "Published" : "Draft"}</span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {MONTH_NAMES[entry.month]} {entry.year} · {wordCount(entry.content)} words · Updated {fmtDate(entry.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleTogglePublish(entry)}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-sm border transition-colors ${
                          entry.isPublished
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                            : "text-stone-500 bg-stone-50 border-stone-200 hover:bg-stone-100"
                        }`}>
                        {entry.isPublished ? <Globe className="w-3.5 h-3.5 inline mr-1" /> : <Lock className="w-3.5 h-3.5 inline mr-1" />}
                        {entry.isPublished ? "Live" : "Draft"}
                      </button>
                      <button onClick={() => openEditEntry(entry)}
                        className="w-8 h-8 flex items-center justify-center text-stone-300 hover:text-stone-700 hover:bg-stone-100 rounded-sm transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteEntry(entry.id, entry.title)}
                        className="w-8 h-8 flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "now" && isEditing && (
        <div className="flex-1 overflow-hidden">
          <NowEntryEditor
            entry={editEntry}
            onSaved={(saved) => { handleEntrySaved(saved); setIsEditing(false); }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}

      {tab === "timeline" && (
        <div className="flex flex-1 overflow-hidden">
          <TimelineTab events={initialTimeline} />
        </div>
      )}

      {tab === "knowledge" && (
        <div className="flex flex-1 overflow-hidden">
          <KnowledgeTab items={initialKnowledge} />
        </div>
      )}
    </div>
  );
}