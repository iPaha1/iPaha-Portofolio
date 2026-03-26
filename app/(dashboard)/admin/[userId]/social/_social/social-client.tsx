"use client";

// =============================================================================
// isaacpaha.com — Social Media Admin Client (Main Shell)
// components/admin/social/social-admin-client.tsx
//
// Tabs:
//   1. Feed       — post list + composer
//   2. Connections — platform OAuth setup
//   3. Brainstorm — AI content ideation
//   4. AI Cron    — auto-draft scheduler
//   5. Analytics  — engagement overview
// =============================================================================

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Plus, Brain, Sparkles, BarChart2, Link2, Loader2,
  AlertCircle, Check, X, Globe, Lock, Activity, MessageSquare,
  TrendingUp, Eye, Grid3x3,
} from "lucide-react";
import { PlatformConnect, PLATFORMS } from "./platform-connect";
import { PostComposer }    from "./post-composer";
import { PostList }        from "./post-list";
import { BrainstormTab, SocialCronTab, AnalyticsTab } from "./remaining-tabs";

// ─── Types ────────────────────────────────────────────────────────────────────

type Connection = {
  id:           string;
  platform:     string;
  handle:       string | null;
  displayName:  string | null;
  avatarUrl:    string | null;
  profileUrl:   string | null;
  followerCount: number | null;
  isActive:     boolean;
  lastPostedAt: Date | null;
  connectedAt:  Date;
  _count?:      { posts: number };
};

type SocialPost = {
  id:           string;
  platform:     string;
  content:      string;
  mediaUrls:    string | null;
  status:       "draft" | "scheduled" | "published" | "failed";
  scheduledFor: Date | null;
  publishedAt:  Date | null;
  likes:        number;
  shares:       number;
  comments:     number;
  impressions:  number;
  createdAt:    Date;
  connection:   { handle: string | null; profileUrl: string | null } | null;
};

type Stats = {
  connections:      Connection[];
  connectedCount:   number;
  totalPosts:       number;
  published:        number;
  drafts:           number;
  scheduled:        number;
  failed:           number;
  totalLikes:       number;
  totalShares:      number;
  totalImpressions: number;
  recentPosts:      any[];
};

interface Props {
  userId:      string;
  stats:       Stats;
  initialPosts: SocialPost[];
  postTotal:   number;
  postPages:   number;
  initialTab:  "feed" | "connections" | "brainstorm" | "cron" | "analytics";
  currentPage: number;
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-sm border border-stone-100 shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
              <button onClick={onCancel} className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-sm hover:border-stone-400">Cancel</button>
              <button onClick={onConfirm} disabled={loading}
                className={`text-xs font-bold text-white px-4 py-2 rounded-sm flex items-center gap-2 disabled:opacity-60 ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}>
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}{confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function SocialAdminClient({
  userId, stats, initialPosts, postTotal, postPages, initialTab, currentPage,
}: Props) {
  const [tab,          setTab]          = useState<"feed" | "connections" | "brainstorm" | "cron" | "analytics">(initialTab);
  const [connections,  setConnections]  = useState<Connection[]>(stats.connections);
  const [posts,        setPosts]        = useState<SocialPost[]>(initialPosts);
  const [total,        setTotal]        = useState(postTotal);
  const [pages,        setPages]        = useState(postPages);
  const [page,         setPage]         = useState(currentPage);
  const [statsData,    setStatsData]    = useState(stats);
  const [showComposer, setShowComposer] = useState(false);
  const [editPost,     setEditPost]     = useState<SocialPost | null>(null);
  const [composerPrefill, setComposerPrefill] = useState<any>(null);

  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; action?: () => Promise<void> }>({ open: false, title: "", message: "" });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Fetch posts ────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (params: { search?: string; status?: string; platform?: string; pg?: number } = {}) => {
    const sp = new URLSearchParams({ page: String(params.pg ?? page), pageSize: "20" });
    if (params.search)   sp.set("search", params.search);
    if (params.status)   sp.set("status", params.status);
    if (params.platform) sp.set("platform", params.platform);
    const res  = await fetch(`/api/admin/social/posts?${sp}`);
    const data = await res.json();
    setPosts(data.posts ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
  }, [page]);

  // ── Post actions ──────────────────────────────────────────────────────────
  const handleSaved = useCallback((results: any[]) => {
    setShowComposer(false);
    setComposerPrefill(null);
    setEditPost(null);
    fetchPosts();
    setStatsData((s) => ({ ...s, totalPosts: s.totalPosts + results.length, drafts: s.drafts + results.length }));
  }, [fetchPosts]);

  const handlePublish = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/social/posts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "publish" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, ...updated } : p));
      setStatsData((s) => ({ ...s, published: s.published + 1, drafts: Math.max(0, s.drafts - 1) }));
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    setConfirm({
      open: true, title: "Delete post?", message: "This social post will be permanently deleted.",
      action: async () => {
        await fetch(`/api/admin/social/posts/${id}`, { method: "DELETE" });
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setTotal((t) => t - 1);
        setStatsData((s) => ({ ...s, totalPosts: s.totalPosts - 1 }));
      },
    });
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/social/posts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "duplicate" }),
    });
    if (res.ok) {
      const copy = await res.json();
      setPosts((prev) => [copy, ...prev]);
      setTotal((t) => t + 1);
    }
  }, []);

  const handleBrainstormUse = useCallback((data: { content: string; platform?: string }) => {
    setComposerPrefill({ content: data.content, platforms: data.platform ? [data.platform] : undefined });
    setShowComposer(true);
    setTab("feed");
  }, []);

  const handleCronViewPost = useCallback(async (postId: string) => {
    const res  = await fetch(`/api/admin/social/posts/${postId}`);
    const post = await res.json();
    setEditPost(post);
    setShowComposer(true);
    setTab("feed");
  }, []);

  // ── Platform connected/disconnected ───────────────────────────────────────
  const handleConnected = useCallback((platform: string, data: any) => {
    setConnections((prev) => {
      const exists = prev.find((c) => c.platform === platform);
      if (exists) return prev.map((c) => c.platform === platform ? { ...c, ...data, isActive: true } : c);
      return [...prev, data];
    });
    setStatsData((s) => ({ ...s, connectedCount: s.connectedCount + 1 }));
  }, []);

  const handleDisconnected = useCallback((platform: string) => {
    setConnections((prev) => prev.map((c) => c.platform === platform ? { ...c, isActive: false } : c));
    setStatsData((s) => ({ ...s, connectedCount: Math.max(0, s.connectedCount - 1) }));
  }, []);

  const runConfirm = async () => {
    if (!confirm.action) return;
    setConfirmLoading(true);
    await confirm.action();
    setConfirm((s) => ({ ...s, open: false }));
    setConfirmLoading(false);
  };

  const TABS = [
    { id: "feed",        label: "Feed",        icon: Grid3x3,   badge: statsData.drafts > 0 ? String(statsData.drafts) : undefined },
    { id: "connections", label: "Connections", icon: Link2,     badge: statsData.connectedCount > 0 ? String(statsData.connectedCount) : undefined },
    { id: "brainstorm",  label: "Brainstorm",  icon: Brain },
    { id: "cron",        label: "AI Auto-Post",icon: Sparkles },
    { id: "analytics",   label: "Analytics",   icon: BarChart2 },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <ConfirmDialog
        open={confirm.open} title={confirm.title} message={confirm.message}
        danger confirmLabel="Delete"
        onConfirm={runConfirm} onCancel={() => setConfirm((s) => ({ ...s, open: false }))}
        loading={confirmLoading}
      />

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-0 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Social Media</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {statsData.connectedCount} platform{statsData.connectedCount !== 1 ? "s" : ""} connected ·{" "}
              {statsData.totalPosts} posts · {statsData.published} published · {statsData.drafts} drafts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setTab("brainstorm"); }}
              className="flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-4 py-2.5 rounded-sm transition-colors">
              <Brain className="w-4 h-4" />Brainstorm
            </button>
            <button onClick={() => { setEditPost(null); setComposerPrefill(null); setShowComposer(true); setTab("feed"); }}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors shadow-sm">
              <Plus className="w-4 h-4" />Compose
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-4">
          {[
            { label: "Connected",    value: statsData.connectedCount,   color: "#10b981", icon: Link2       },
            { label: "Posts",        value: statsData.totalPosts,        color: "#f59e0b", icon: Share2      },
            { label: "Published",    value: statsData.published,         color: "#10b981", icon: Globe       },
            { label: "Drafts",       value: statsData.drafts,            color: "#9ca3af", icon: Lock        },
            { label: "Impressions",  value: statsData.totalImpressions,  color: "#3b82f6", icon: Eye         },
            { label: "Likes",        value: statsData.totalLikes,        color: "#ec4899", icon: Activity    },
            { label: "Shares",       value: statsData.totalShares,       color: "#8b5cf6", icon: TrendingUp  },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-3.5">
              <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
              <p className="text-xl font-black text-stone-900">{s.value.toLocaleString()}</p>
              <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setShowComposer(false); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                tab === t.id && !showComposer ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-700"
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              {(t as any).badge && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-amber-200 text-amber-800" : "bg-stone-200 text-stone-600"}`}>{(t as any).badge}</span>
              )}
            </button>
          ))}
          {showComposer && (
            <button className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-amber-500 text-amber-600 whitespace-nowrap">
              ✍️ {editPost ? "Edit Post" : "New Post"}
            </button>
          )}
        </div>
      </div>

      {/* ════════════ CONTENT ════════════ */}

      {/* COMPOSER (overlays feed tab) */}
      {showComposer && tab === "feed" && (
        <div className="flex-1 overflow-hidden">
          <PostComposer
            connections={connections}
            onSaved={handleSaved}
            onCancel={() => { setShowComposer(false); setEditPost(null); setComposerPrefill(null); }}
            prefill={composerPrefill ?? (editPost ? { content: editPost.content } : undefined)}
          />
        </div>
      )}

      {/* FEED TAB */}
      {tab === "feed" && !showComposer && (
        <div className="flex-1 overflow-hidden">
          <PostList
            posts={posts} total={total} pages={pages} page={page}
            onEdit={(post) => { setEditPost(post); setComposerPrefill({ content: post.content, platforms: [post.platform] }); setShowComposer(true); }}
            onDelete={handleDelete}
            onPublish={handlePublish}
            onDuplicate={handleDuplicate}
            onFilter={(params) => { setPage(1); fetchPosts({ ...params, pg: 1 }); }}
            onPageChange={(p) => { setPage(p); fetchPosts({ pg: p }); }}
          />
        </div>
      )}

      {/* CONNECTIONS TAB */}
      {tab === "connections" && (
        <div className="flex-1 overflow-y-auto p-6">
          <PlatformConnect
            connections={connections}
            onConnected={handleConnected}
            onDisconnected={handleDisconnected}
          />
        </div>
      )}

      {/* BRAINSTORM TAB */}
      {tab === "brainstorm" && (
        <div className="flex-1 overflow-hidden">
          <BrainstormTab onUsePost={handleBrainstormUse} />
        </div>
      )}

      {/* CRON TAB */}
      {tab === "cron" && (
        <div className="flex-1 overflow-y-auto">
          <SocialCronTab
            connections={connections}
            onViewPost={handleCronViewPost}
          />
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === "analytics" && (
        <div className="flex-1 overflow-y-auto">
          <AnalyticsTab stats={{ ...statsData, connections }} />
        </div>
      )}
    </div>
  );
}