"use client";

// =============================================================================
// isaacpaha.com — Blog Admin Client (Main Shell)
// components/admin/blog/blog-admin-client.tsx
//
// Tabs:
//   1. Posts     — PostList (searchable/filterable post table)
//   2. Editor    — PostEditor (rich text + AI + SEO + preview)
//   3. Brainstorm — BrainstormTab (AI topic ideation)
//   4. AI Cron   — CronTab (auto-draft scheduler)
//   5. Comments  — CommentsTab (moderation queue)
// =============================================================================

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Brain, Clock, MessageSquare,
  Globe, Lock, Loader2, AlertCircle, Sparkles,
  Eye, Pencil, Grid3x3, Zap,
} from "lucide-react";
import { CommentsTab } from "./comments-tab";
import { PostList } from "./post-list";
import { PostEditor } from "./post-editor";
import { BrainstormTab } from "./brainstorm-tab";
import { CronTab } from "./cron-tab";


// ─── Types ────────────────────────────────────────────────────────────────────

type BlogStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

type PostSummary = {
  id:               string;
  title:            string;
  slug:             string;
  excerpt:          string;
  status:           BlogStatus;
  coverImage:       string | null;
  categoryId:       string | null;
  isFeatured:       boolean;
  isToolsShowcase:  boolean;
  isLatest:        boolean;
  isPinned:         boolean;
  isPremium:        boolean;
  isIdeasLab:       boolean;
  isBuildInPublic:  boolean;
  tags:             string | null;
  publishedAt:      Date | null;
  scheduledAt:      Date | null;
  readingTimeMinutes: number;
  wordCount:        number;
  viewCount:        number;
  likeCount:        number;
  commentCount:     number;
  trendingScore:    number;
  createdAt:        Date;
  updatedAt:        Date;
  category?:        { name: string; color: string | null } | null;
};

type PostFull = PostSummary & {
  content:          string;
  coverImageAlt:    string | null;
  coverImageCaption: string | null;
  ogImage:          string | null;
  metaTitle:        string | null;
  metaDescription:  string | null;
  canonicalUrl:     string | null;
  keywords:         string | null;
  seriesId:         string | null;
  seriesOrder:      number | null;
  authorName:       string;
};

type Stats = {
  total:         number;
  published:     number;
  drafts:        number;
  scheduled:     number;
  archived:      number;
  featured:      number;
  totalViews:    number;
  totalLikes:    number;
  totalComments: number;
  aiGenerated:   number;
  pendingComments: number;
  recentPosts:   PostSummary[];
};

type Category = { id: string; name: string; color: string | null; icon: string | null };
type Series   = { id: string; title: string };

interface Props {
  userId:        string;
  stats:         Stats;
  initialPosts:  PostSummary[];
  postTotal:     number;
  postPages:     number;
  categories:    Category[];
  series:        Series[];
  initialTab:    "posts" | "editor" | "brainstorm" | "cron" | "comments";
  initialEditId?: string;
  currentPage:   number;
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

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function BlogAdminClient({
  userId, stats, initialPosts, postTotal, postPages,
  categories, series, initialTab, currentPage,
}: Props) {
  const [tab,       setTab]      = useState<"posts" | "editor" | "brainstorm" | "cron" | "comments">(initialTab);
  const [posts,     setPosts]    = useState<PostSummary[]>(initialPosts);
  const [total,     setTotal]    = useState(postTotal);
  const [pages,     setPages]    = useState(postPages);
  const [page,      setPage]     = useState(currentPage);
  const [editPost,  setEditPost] = useState<PostFull | null>(null);
  const [statsData, setStats]    = useState(stats);

  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; danger?: boolean;
    confirmLabel?: string; action?: () => Promise<void>;
  }>({ open: false, title: "", message: "" });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Fetch posts with filters ───────────────────────────────────────────────
  const fetchPosts = useCallback(async (params: { search?: string; status?: string; sort?: string; pg?: number } = {}) => {
    const sp = new URLSearchParams({ page: String(params.pg ?? page), pageSize: "20" });
    if (params.search) sp.set("search", params.search);
    if (params.status && params.status !== "ALL") sp.set("status", params.status);
    if (params.sort) { const [sf, sd] = params.sort.split("_"); sp.set("sortBy", sf); sp.set("sortOrder", sd); }
    const res  = await fetch(`/api/admin/blog?${sp}`);
    const data = await res.json();
    setPosts(data.posts ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
  }, [page]);

  // ── Open editor with full post ─────────────────────────────────────────────
  const openEditor = useCallback(async (post: PostSummary) => {
    const res  = await fetch(`/api/admin/blog/${post.id}`);
    const full = await res.json();
    setEditPost(full);
    setTab("editor");
  }, []);

  // ── Handle post saved from editor ─────────────────────────────────────────
  const handleSaved = useCallback((saved: PostFull) => {
    setPosts((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      if (exists) return prev.map((p) => p.id === saved.id ? { ...p, ...saved } : p);
      return [saved, ...prev];
    });
    if (!initialPosts.find((p) => p.id === saved.id)) {
      setTotal((t) => t + 1);
      setStats((s) => ({
        ...s, total: s.total + 1,
        drafts: saved.status === "DRAFT" ? s.drafts + 1 : s.drafts,
        published: saved.status === "PUBLISHED" ? s.published + 1 : s.published,
      }));
    }
  }, [initialPosts]);

  // ── Toggle publish ─────────────────────────────────────────────────────────
  const handleTogglePublish = useCallback(async (post: PostSummary) => {
    const action = post.status === "PUBLISHED" ? "unpublish" : "publish";
    const res  = await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: action }),
    });
    const updated = await res.json();
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, ...updated } : p));
    setStats((s) => ({
      ...s,
      published: s.published + (updated.status === "PUBLISHED" ? 1 : -1),
      drafts:    s.drafts    + (updated.status === "DRAFT"     ? 1 : -1),
    }));
  }, []);

  // ── Duplicate ──────────────────────────────────────────────────────────────
  const handleDuplicate = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/blog/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "duplicate" }),
    });
    const copy = await res.json();
    setPosts((prev) => [copy, ...prev]);
    setTotal((t) => t + 1);
    setStats((s) => ({ ...s, total: s.total + 1, drafts: s.drafts + 1 }));
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((id: string, title: string) => {
    setConfirm({
      open: true, danger: true,
      title: `Delete "${title}"?`,
      message: "This post will be moved to the deleted archive. You can restore it later.",
      confirmLabel: "Delete",
      action: async () => {
        await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setTotal((t) => t - 1);
        setStats((s) => ({ ...s, total: s.total - 1 }));
      },
    });
  }, []);

  // ── Use brainstorm result ──────────────────────────────────────────────────
  const handleUseBrainstorm = useCallback((data: { title: string; content?: string; tags?: string[] }) => {
    const newPost: Partial<PostFull> = {
      title: data.title,
      content: data.content ?? "",
      status: "DRAFT",
      tags: data.tags ? JSON.stringify(data.tags) : null,
    };
    setEditPost(newPost as PostFull);
    setTab("editor");
  }, []);

  // ── View post from cron ────────────────────────────────────────────────────
  const handleViewCronPost = useCallback(async (postId: string) => {
    const res  = await fetch(`/api/admin/blog/${postId}`);
    const full = await res.json();
    setEditPost(full);
    setTab("editor");
  }, []);

  const runConfirm = async () => {
    if (!confirm.action) return;
    setConfirmLoading(true);
    await confirm.action();
    setConfirm((s) => ({ ...s, open: false }));
    setConfirmLoading(false);
  };

  const TABS = [
    { id: "posts",      label: "All Posts",   icon: Grid3x3,       badge: total > 0 ? String(total) : undefined },
    { id: "editor",     label: editPost?.id ? `Editing` : "New Post", icon: Pencil,  badge: undefined },
    { id: "brainstorm", label: "Brainstorm",  icon: Brain,         badge: undefined },
    { id: "cron",       label: "AI Cron",     icon: Sparkles,      badge: undefined },
    { id: "comments",   label: "Comments",    icon: MessageSquare, badge: statsData.pendingComments > 0 ? String(statsData.pendingComments) : undefined },
  ] as const;

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
            <h1 className="text-2xl font-black text-stone-900">Blog</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {statsData.total} posts · {statsData.published} published · {statsData.drafts} drafts
              {statsData.aiGenerated > 0 && ` · ${statsData.aiGenerated} AI drafts awaiting review`}
              {statsData.pendingComments > 0 && ` · ${statsData.pendingComments} comment${statsData.pendingComments !== 1 ? "s" : ""} to moderate`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setTab("brainstorm"); }}
              className="flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-4 py-2.5 rounded-sm transition-colors">
              <Brain className="w-4 h-4" />Brainstorm
            </button>
            <button
              onClick={() => { setEditPost(null); setTab("editor"); }}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors shadow-sm">
              <Plus className="w-4 h-4" />New Post
            </button>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-4">
          {[
            { label: "Total",      value: statsData.total,           color: "#f59e0b", icon: FileText    },
            { label: "Published",  value: statsData.published,       color: "#10b981", icon: Globe       },
            { label: "Drafts",     value: statsData.drafts,          color: "#9ca3af", icon: Lock        },
            { label: "Scheduled",  value: statsData.scheduled,       color: "#3b82f6", icon: Clock       },
            { label: "Views",      value: statsData.totalViews,      color: "#8b5cf6", icon: Eye         },
            { label: "Likes",      value: statsData.totalLikes,      color: "#ec4899", icon: Zap         },
            { label: "AI Drafts",  value: statsData.aiGenerated,     color: "#f59e0b", icon: Sparkles    },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-3.5">
              <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
              <p className="text-xl font-black text-stone-900">{s.value.toLocaleString()}</p>
              <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                tab === t.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-700"
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.badge && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? "bg-amber-200 text-amber-800" : "bg-stone-200 text-stone-600"
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CONTENT AREA
      ════════════════════════════════════════════════════════════════════ */}

      {tab === "posts" && (
        <div className="flex-1 overflow-hidden">
          <PostList
            posts={posts}
            total={total}
            pages={pages}
            page={page}
            userId={userId}
            onEdit={openEditor}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onTogglePublish={handleTogglePublish}
            onPageChange={(p) => { setPage(p); fetchPosts({ pg: p }); }}
            onFilter={(params) => { setPage(1); fetchPosts({ ...params, pg: 1 }); }}
          />
        </div>
      )}

      {tab === "editor" && editPost && (
        <div className="flex-1 overflow-hidden">
          <PostEditor
            post={editPost}
            userId={userId}
            categories={categories}
            series={series}
            onSaved={(saved) => {
              handleSaved(saved as PostFull);
              // Stay in editor after save so Isaac can keep working
            }}
            onCancel={() => { setTab("posts"); setEditPost(null); }}
          />
        </div>
      )}

      {tab === "brainstorm" && (
        <div className="flex-1 overflow-hidden">
          <BrainstormTab onUsePost={handleUseBrainstorm} />
        </div>
      )}

      {tab === "cron" && (
        <div className="flex-1 overflow-y-auto">
          <CronTab userId={userId} onViewPost={handleViewCronPost} />
        </div>
      )}

      {tab === "comments" && (
        <div className="flex-1 overflow-hidden">
          <CommentsTab />
        </div>
      )}
    </div>
  );
}