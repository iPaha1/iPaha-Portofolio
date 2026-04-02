"use client";

// =============================================================================
// isaacpaha.com — Blog Post Editor
// components/admin/blog/post-editor.tsx
// Full-featured post creation and editing with rich text, AI, SEO, preview
// =============================================================================

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,  Eye, Globe, AlertCircle, Loader2, Check,
  Sparkles, Search, Settings, ExternalLink, History,
  Star, Pin, Crown, X,
  Wrench,
  Clock, 
} from "lucide-react";
import { RichTextToolbar, useEditorShortcuts } from "./rich-text-toolbar";
import { AIPanel } from "./ai-panel";
import { PostPreview } from "./post-preview";
import { SeoPanel } from "./seo-panel";


// ─── Types ────────────────────────────────────────────────────────────────────

type BlogStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

type PostFull = {
  id:               string;
  title:            string;
  slug:             string;
  excerpt:          string;
  content:          string;
  status:           BlogStatus;
  coverImage:       string | null;
  coverImageAlt:    string | null;
  coverImageCaption: string | null;
  ogImage:          string | null;
  metaTitle:        string | null;
  metaDescription:  string | null;
  canonicalUrl:     string | null;
  keywords:         string | null;
  tags:             string | null;
  categoryId:       string | null;
  seriesId:         string | null;
  seriesOrder:      number | null;
  isFeatured:       boolean;
  isPinned:         boolean;
  isPremium:        boolean;
  isIdeasLab:       boolean;
  isToolsShowcase:   boolean;
  isLatest:           boolean;
  isBuildInPublic:  boolean;
  scheduledAt:      Date | null;
  publishedAt:      Date | null;
  readingTimeMinutes: number;
  wordCount:        number;
  authorName:       string;
  category?:        { name: string; color: string | null } | null;
};

type Category  = { id: string; name: string; color: string | null; icon: string | null };
type Series    = { id: string; title: string };

interface PostEditorProps {
  post?:       PostFull | null;
  userId:      string;
  categories:  Category[];
  series:      Series[];
  onSaved:     (post: PostFull) => void;
  onCancel:    () => void;
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(s: string): number {
  return Math.max(1, Math.round(wordCount(s) / 200));
}

// ─── EDITOR ───────────────────────────────────────────────────────────────────

export function PostEditor({ post, categories, series, onSaved, onCancel }: PostEditorProps) {
  // const isEdit = !!post;

  const isEdit = !!(post?.id);

  // Core fields
  const [title,       setTitle]       = useState(post?.title    ?? "");
  const [slug,        setSlug]        = useState(post?.slug     ?? "");
  const [excerpt,     setExcerpt]     = useState(post?.excerpt  ?? "");
  const [content,     setContent]     = useState(post?.content  ?? "");
  const [status,      setStatus]      = useState<BlogStatus>(post?.status  ?? "DRAFT");
  const [categoryId,  setCategoryId]  = useState(post?.categoryId ?? "");
  const [seriesId,    setSeriesId]    = useState(post?.seriesId ?? "");
  const [seriesOrder, setSeriesOrder] = useState(post?.seriesOrder ?? 1);
  const [tagInput,    setTagInput]    = useState("");
  const [tags,        setTags]        = useState<string[]>(parseTags(post?.tags ?? null));

  // Flags
  const [isFeatured,    setIsFeatured]    = useState(post?.isFeatured    ?? false);
  const [isToolsShowcase, setIsToolsShowcase] = useState(post?.isToolsShowcase ?? false);
  const [isLatest,           setIsLatest]           = useState(post?.isLatest ?? false);
  const [isPinned,      setIsPinned]      = useState(post?.isPinned      ?? false);
  const [isPremium,     setIsPremium]     = useState(post?.isPremium     ?? false);
  const [isIdeasLab,    setIsIdeasLab]    = useState(post?.isIdeasLab    ?? false);
  const [isBuildPublic, setIsBuildPublic] = useState(post?.isBuildInPublic ?? false);

  // Media
  const [coverImage,    setCoverImage]    = useState(post?.coverImage       ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt   ?? "");
  const [ogImage,       setOgImage]       = useState(post?.ogImage         ?? "");

  // SEO
  const [metaTitle,     setMetaTitle]     = useState(post?.metaTitle       ?? "");
  const [metaDesc,      setMetaDesc]      = useState(post?.metaDescription ?? "");
  const [canonicalUrl,  setCanonicalUrl]  = useState(post?.canonicalUrl    ?? "");
  const [keywords,      setKeywords]      = useState(post?.keywords        ?? "");

  // Scheduling
  const [scheduledAt,   setScheduledAt]   = useState(
    post?.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ""
  );

  // UI state
  const [rightPanel,   setRightPanel]   = useState<"none" | "ai" | "seo" | "settings" | "preview">("none");
  const [saving,       setSaving]       = useState(false);
  const [saveErr,      setSaveErr]      = useState("");
  const [savedOk,      setSavedOk]      = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [slugTouched,  setSlugTouched]  = useState(!!post);
  const [showHistory,  setShowHistory]  = useState(false);
  const [revisions,    setRevisions]    = useState<Revision[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { insertAtCursor, wrapSelection, handleKeyDown } = useEditorShortcuts(textareaRef as React.RefObject<HTMLTextAreaElement>, setContent);

  // Auto-generate slug
  useEffect(() => {
    if (!slugTouched) setSlug(toSlug(title));
  }, [title, slugTouched]);

  // Capture selected text
  const handleTextareaSelect = () => {
    const el = textareaRef.current;
    if (!el) return;
    const sel = el.value.slice(el.selectionStart, el.selectionEnd);
    setSelectedText(sel);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  };

  const handleSave = async (overrideStatus?: BlogStatus) => {
    if (!title.trim()) { setSaveErr("Title is required."); return; }
    setSaving(true); setSaveErr("");
    const body = {
      title: title.trim(), slug: slug.trim() || toSlug(title),
      excerpt: excerpt.trim(), content: content.trim(),
      status: overrideStatus ?? status,
      categoryId: categoryId || null, seriesId: seriesId || null,
      seriesOrder: seriesId ? seriesOrder : null,
      coverImage: coverImage || null, coverImageAlt: coverImageAlt || null,
      ogImage: ogImage || null, metaTitle: metaTitle || null,
      metaDescription: metaDesc || null, canonicalUrl: canonicalUrl || null,
      keywords: keywords || null, tags,
      isFeatured, isPinned, isPremium, isIdeasLab, isToolsShowcase, isLatest, isBuildInPublic: isBuildPublic,
      scheduledAt: overrideStatus === "SCHEDULED" && scheduledAt ? new Date(scheduledAt) : null,
    };
    try {
      let saved: PostFull;
      if (isEdit && post) {
        const res  = await fetch(`/api/admin/blog/${post.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        saved = await res.json();
      } else {
        const res  = await fetch("/api/admin/blog", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json();
        saved = data.post;
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      onSaved(saved);
    } catch (e: unknown) { setSaveErr((e as Error).message ?? "Save failed"); }
    setSaving(false);
  };

  type Revision = {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    revisionNote?: string;
  };

  const loadRevisions = async () => {
    if (!post) return;
    const res  = await fetch(`/api/admin/blog/${post.id}?revisions=true`);
    const data = await res.json();
    setRevisions(data ?? []);
    setShowHistory(true);
  };

  const restoreRevision = (rev: Revision) => {
    setContent(rev.content);
    setTitle(rev.title);
    setShowHistory(false);
  };

  const wc = wordCount(content);
  const rt = readingTime(content);

  const PANEL_BUTTONS = [
    { id: "ai",       icon: Sparkles,  label: "AI",      color: "#f59e0b" },
    { id: "seo",      icon: Search,    label: "SEO",     color: "#3b82f6" },
    { id: "preview",  icon: Eye,       label: "Preview", color: "#8b5cf6" },
    { id: "settings", icon: Settings,  label: "Settings",color: "#6b7280" },
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Editor topbar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-100 flex-shrink-0 bg-white">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />Blog
        </button>

        {/* Status + word count */}
        <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider ${
            status === "PUBLISHED" ? "text-emerald-700 bg-emerald-100" :
            status === "SCHEDULED" ? "text-blue-700 bg-blue-100" :
            status === "ARCHIVED"  ? "text-stone-500 bg-stone-100" :
            "text-stone-500 bg-stone-100"
          }`}>{status}</span>
          <span className="text-[10px] text-stone-400">{wc.toLocaleString()} words · {rt} min read</span>
          {isEdit && (
            <button onClick={loadRevisions} className="text-[10px] text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
              <History className="w-3 h-3" />History
            </button>
          )}
        </div>

        {/* Save buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Panel toggles */}
          <div className="flex items-center gap-1 border border-stone-200 rounded-sm p-0.5">
            {PANEL_BUTTONS.map((p) => (
              <button key={p.id} onClick={() => setRightPanel(rightPanel === p.id ? "none" : p.id)}
                title={p.label}
                className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors ${
                  rightPanel === p.id ? "bg-stone-100 text-stone-700" : "text-stone-400 hover:text-stone-700"
                }`}>
                <p.icon className="w-3.5 h-3.5" style={{ color: rightPanel === p.id ? p.color : undefined }} />
              </button>
            ))}
          </div>

          {isEdit && (
            <a href={`/blog/${post?.slug}`} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
              <ExternalLink className="w-3 h-3" />View
            </a>
          )}

          {/* Draft save */}
          <button onClick={() => handleSave("DRAFT")} disabled={saving}
            className="text-xs font-semibold text-stone-500 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors disabled:opacity-60">
            Save draft
          </button>

          {/* Publish */}
          <button onClick={() => handleSave("PUBLISHED")} disabled={saving}
            className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
            {saving ? "Saving…" : savedOk ? "Saved!" : status === "PUBLISHED" ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {saveErr && (
        <div className="mx-4 mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
        </div>
      )}

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Formatting toolbar */}
          <RichTextToolbar
            onInsert={insertAtCursor}
            onWrap={wrapSelection}
          />

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

              {/* Category row */}
              <div className="flex items-center gap-3 flex-wrap">
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="text-xs border border-stone-200 rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-amber-400 bg-white text-stone-600">
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={seriesId} onChange={(e) => setSeriesId(e.target.value)}
                  className="text-xs border border-stone-200 rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-amber-400 bg-white text-stone-600">
                  <option value="">No series</option>
                  {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                {seriesId && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-stone-400">Part</span>
                    <input type="number" value={seriesOrder} onChange={(e) => setSeriesOrder(Number(e.target.value))}
                      className="w-14 text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber-400"
                      min={1}
                    />
                  </div>
                )}
                {/* Flags row */}
                {[
                  { label: "Featured", val: isFeatured,    set: setIsFeatured,    icon: Star  },
                  { label: "Tools Showcase", val: isToolsShowcase, set: setIsToolsShowcase, icon: Wrench },
                  { label: "Latest", val: isLatest, set: setIsLatest, icon: Clock },
                  { label: "Pinned",   val: isPinned,      set: setIsPinned,      icon: Pin   },
                  { label: "Premium",  val: isPremium,     set: setIsPremium,     icon: Crown },
                ].map((f) => (
                  <button key={f.label} onClick={() => f.set((p) => !p)}
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-sm border transition-colors ${
                      f.val ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-stone-400 border-stone-200 hover:border-stone-400"
                    }`}>
                    <f.icon className="w-3 h-3" />{f.label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={2}
                  placeholder="Post title…"
                  className="w-full text-3xl font-black text-stone-900 border-0 resize-none bg-transparent focus:outline-none placeholder:text-stone-200 placeholder:font-black leading-tight"
                />
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-stone-400">isaacpaha.com/blog/</span>
                  <input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
                    className="flex-1 text-[11px] font-mono text-stone-500 border-0 border-b border-stone-100 focus:border-amber-300 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                    Excerpt <span className="text-stone-300 font-normal normal-case ml-1">(card + meta description fallback)</span>
                  </label>
                  <span className="text-[10px] text-stone-300">{excerpt.length}/300</span>
                </div>
                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
                  rows={3} maxLength={300}
                  placeholder="A compelling one or two sentences that make the reader want to read more…"
                  className="w-full text-sm text-stone-600 border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Cover image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Cover Image URL</label>
                  <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://… (from Media Library)"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Cover Image Alt Text</label>
                  <input value={coverImageAlt} onChange={(e) => setCoverImageAlt(e.target.value)}
                    placeholder="Descriptive alt text for accessibility + SEO"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                  />
                </div>
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
                    placeholder="Type tag and press Enter…"
                    className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                  />
                  <button onClick={addTag} className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors">Add</button>
                </div>
              </div>

              {/* Main content editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                    Content
                    <span className="ml-2 text-stone-300 font-normal normal-case">{wc.toLocaleString()} words · {rt} min read</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRightPanel(rightPanel === "ai" ? "none" : "ai")}
                      className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 transition-colors">
                      <Sparkles className="w-3 h-3" />AI assist
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-stone-400 mb-2 bg-stone-50 border border-stone-100 rounded-sm px-3 py-2 leading-relaxed">
                  <span className="font-bold text-stone-500">Markdown:</span>{" "}
                  ## H2 · ### H3 · **bold** · *italic* · ==highlight== · `code` · {"> quote"} · - list · 1. numbered · --- divider · ```lang code block```
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onMouseUp={handleTextareaSelect}
                  onKeyUp={handleTextareaSelect}
                  rows={28}
                  placeholder="Start writing…&#10;&#10;## Your First Section&#10;&#10;Open with a strong claim. No warm-up.&#10;&#10;## Second Section&#10;&#10;> A key insight as a blockquote&#10;&#10;Build your argument with specific examples, data, and lived experience."
                  className="w-full text-[13px] border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-amber-400 resize-y bg-white leading-[1.75] font-mono"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Right: panel */}
        <AnimatePresence>
          {rightPanel !== "none" && (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-l border-stone-100 bg-white overflow-hidden"
            >
              <div className="w-[340px] h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0">
                  <p className="text-xs font-black text-stone-700 capitalize">{rightPanel}</p>
                  <button onClick={() => setRightPanel("none")} className="text-stone-400 hover:text-stone-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {rightPanel === "ai" && (
                    <AIPanel
                      title={title} content={content} excerpt={excerpt}
                      category={categories.find((c) => c.id === categoryId)?.name ?? ""}
                      tags={tags} selectedText={selectedText}
                      onApplyToContent={(text, replace) => {
                        if (replace) { setContent(text); }
                        else { setContent((c) => c ? `${c}\n\n${text}` : text); }
                        setRightPanel("none");
                      }}
                      onApplyToTitle={(t) => { setTitle(t); setSlugTouched(false); }}
                      onApplyToExcerpt={setExcerpt}
                      onApplyToTags={(newTags) => setTags((prev) => [...new Set([...prev, ...newTags])])}
                      onApplyToMeta={(field, value) => {
                        if (field === "metaTitle")       setMetaTitle(value);
                        if (field === "metaDescription") setMetaDesc(value);
                        if (field === "keywords")        setKeywords(value);
                      }}
                    />
                  )}
                  {rightPanel === "seo" && (
                    <div className="overflow-y-auto h-full">
                      <SeoPanel
                        title={title} excerpt={excerpt} content={content} slug={slug}
                        tags={tags} metaTitle={metaTitle} metaDescription={metaDesc}
                        keywords={keywords} canonicalUrl={canonicalUrl} coverImageAlt={coverImageAlt}
                        onMetaChange={(field, value) => {
                          if (field === "metaTitle")       setMetaTitle(value);
                          if (field === "metaDescription") setMetaDesc(value);
                          if (field === "keywords")        setKeywords(value);
                          if (field === "canonicalUrl")    setCanonicalUrl(value);
                        }}
                      />
                    </div>
                  )}
                  {rightPanel === "preview" && (
                    <PostPreview
                      title={title} excerpt={excerpt} content={content}
                      coverImage={coverImage || undefined} tags={tags}
                      category={categories.find((c) => c.id === categoryId)?.name}
                      readingTime={rt} authorName={post?.authorName ?? "Isaac Paha"}
                      publishedAt={post?.publishedAt}
                    />
                  )}
                  {rightPanel === "settings" && (
                    <div className="overflow-y-auto h-full p-4 space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">Post Type Flags</label>
                        {[
                          { label: "Ideas Lab post",      val: isIdeasLab,    set: setIsIdeasLab    },
                          { label: "Build in Public",     val: isBuildPublic, set: setIsBuildPublic },
                        ].map((f) => (
                          <button key={f.label} onClick={() => f.set((p) => !p)}
                            className={`flex items-center justify-between w-full px-3 py-2 rounded-sm border mb-2 text-xs font-semibold transition-colors ${
                              f.val ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-stone-500 border-stone-200"
                            }`}>
                            {f.label}
                            {f.val && <Check className="w-3.5 h-3.5 text-amber-500" />}
                          </button>
                        ))}
                      </div>

                      {/* Schedule */}
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Schedule for</label>
                        <input type="datetime-local" value={scheduledAt}
                          onChange={(e) => { setScheduledAt(e.target.value); if (e.target.value) setStatus("SCHEDULED"); }}
                          className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                        />
                        {scheduledAt && (
                          <button onClick={() => { setScheduledAt(""); setStatus("DRAFT"); }}
                            className="mt-1 text-[11px] text-red-500 hover:text-red-700 transition-colors">Clear schedule</button>
                        )}
                      </div>

                      {/* OG Image */}
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">OG / Social Image URL</label>
                        <input value={ogImage} onChange={(e) => setOgImage(e.target.value)}
                          placeholder="https://… (defaults to cover image)"
                          className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Archive/Delete */}
                      {isEdit && (
                        <div className="pt-4 border-t border-stone-100">
                          <button onClick={() => handleSave("ARCHIVED")} disabled={saving}
                            className="w-full text-xs font-semibold text-stone-500 border border-stone-200 hover:border-red-300 hover:text-red-500 px-3 py-2 rounded-sm transition-colors">
                            Archive post
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Revision history modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-sm border border-stone-100 shadow-2xl p-5 w-full max-w-lg mx-4 max-h-[70vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black text-stone-900">Revision History</p>
                <button onClick={() => setShowHistory(false)} className="text-stone-400 hover:text-stone-700"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {revisions.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-6">No revisions saved yet</p>
                ) : (
                  revisions.map((rev) => (
                    <div key={rev.id} className="flex items-center justify-between border border-stone-100 rounded-sm px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-stone-700 line-clamp-1">{rev.title}</p>
                        <p className="text-[10px] text-stone-400">
                          {new Date(rev.createdAt).toLocaleString("en-GB")} — {rev.revisionNote ?? "Auto-saved"}
                        </p>
                      </div>
                      <button onClick={() => restoreRevision(rev)}
                        className="text-[11px] font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 px-2.5 py-1.5 rounded-sm transition-colors flex-shrink-0 ml-3">
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}