"use client";
// =============================================================================
// isaacpaha.com — Social Post List
// components/admin/social/post-list.tsx
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Trash2, Copy, Edit2, MoreHorizontal, Eye,
  Heart, MessageSquare, TrendingUp, CheckSquare, Square,
  Globe, Clock, XCircle, ExternalLink, Send, Loader2,
  RefreshCw, Filter,
} from "lucide-react";
import { PLATFORMS } from "./platform-connect";

type PostStatus = "draft" | "scheduled" | "published" | "failed";

type SocialPost = {
  id:           string;
  platform:     string;
  content:      string;
  mediaUrls:    string | null;
  status:       PostStatus;
  scheduledFor: Date | null;
  publishedAt:  Date | null;
  likes:        number;
  shares:       number;
  comments:     number;
  impressions:  number;
  createdAt:    Date;
  connection:   { handle: string | null; profileUrl: string | null } | null;
};

const STATUS_CFG: Record<PostStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: "Draft",     color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
  scheduled: { label: "Scheduled", color: "#2563eb", bg: "#dbeafe", dot: "#3b82f6" },
  published: { label: "Published", color: "#059669", bg: "#d1fae5", dot: "#10b981" },
  failed:    { label: "Failed",    color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
};

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function PostRow({ post, selected, onSelect, onEdit, onDelete, onPublish, onDuplicate }: {
  post: SocialPost; selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (post: SocialPost) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const platform = PLATFORMS.find((p) => p.id === post.platform);
  const sc = STATUS_CFG[post.status] ?? STATUS_CFG.draft;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    await onPublish(post.id);
    setPublishing(false);
    setMenuOpen(false);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`group flex items-start gap-3 px-4 py-3.5 border-b border-stone-100 hover:bg-stone-50/60 transition-colors ${selected ? "bg-amber-50/30" : ""}`}>
      <button onClick={() => onSelect(post.id)} className="flex-shrink-0 mt-0.5">
        {selected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4 text-stone-200 group-hover:text-stone-400" />}
      </button>

      {/* Platform icon */}
      <div className="w-9 h-9 rounded-sm flex items-center justify-center text-base flex-shrink-0 font-black border border-stone-100"
        style={{ backgroundColor: platform ? `${platform.color}15` : "#f3f4f6", color: platform?.color ?? "#6b7280" }}>
        {platform?.icon ?? "?"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold" style={{ color: platform?.color }}>{platform?.label ?? post.platform}</span>
          {post.connection?.handle && <span className="text-[10px] text-stone-400">@{post.connection.handle}</span>}
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm" style={{ color: sc.color, backgroundColor: sc.bg }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />{sc.label}
          </span>
          {post.scheduledFor && post.status === "scheduled" && (
            <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />{fmtDate(post.scheduledFor)}
            </span>
          )}
        </div>
        <p className="text-sm text-stone-700 mt-1 line-clamp-2 leading-snug">{post.content}</p>
        <p className="text-[10px] text-stone-400 mt-1">{fmtDate(post.createdAt)}</p>
      </div>

      {/* Stats */}
      {post.status === "published" && (
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-stone-400 flex-shrink-0">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.impressions.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comments}</span>
        </div>
      )}

      {/* Publish btn for drafts */}
      {post.status === "draft" && (
        <button onClick={handlePublish} disabled={publishing}
          className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 px-2.5 py-1.5 rounded-sm transition-colors flex-shrink-0 disabled:opacity-50">
          {publishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Publish
        </button>
      )}

      {/* Actions menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button onClick={() => setMenuOpen((p) => !p)}
          className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-sm opacity-0 group-hover:opacity-100 transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
              className="absolute right-0 top-8 z-20 w-44 bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden">
              {[
                { label: "Edit", icon: Edit2, action: () => { onEdit(post); setMenuOpen(false); } },
                { label: "Duplicate", icon: Copy, action: () => { onDuplicate(post.id); setMenuOpen(false); } },
                ...(post.status === "draft" ? [{ label: "Publish now", icon: Send, action: handlePublish }] : []),
              ].map((m) => (
                <button key={m.label} onClick={m.action}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                  <m.icon className="w-3.5 h-3.5 text-stone-400" />{m.label}
                </button>
              ))}
              <div className="border-t border-stone-100" />
              <button onClick={() => { onDelete(post.id); setMenuOpen(false); }}
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

export function PostList({ posts, total, pages, page, onEdit, onDelete, onPublish, onDuplicate, onFilter, onPageChange }: {
  posts: SocialPost[]; total: number; pages: number; page: number;
  onEdit: (p: SocialPost) => void; onDelete: (id: string) => void;
  onPublish: (id: string) => void; onDuplicate: (id: string) => void;
  onFilter: (p: { search?: string; status?: string; platform?: string }) => void;
  onPageChange: (p: number) => void;
}) {
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("ALL");
  const [platform, setPlatform] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); onFilter({ search: e.target.value, status: status !== "ALL" ? status : undefined, platform: platform !== "ALL" ? platform : undefined }); }}
            placeholder="Search posts…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
          />
        </div>
        <div className="flex gap-1">
          {["ALL", "draft", "scheduled", "published", "failed"].map((s) => (
            <button key={s} onClick={() => { setStatus(s); onFilter({ search, status: s !== "ALL" ? s : undefined, platform: platform !== "ALL" ? platform : undefined }); }}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border transition-colors capitalize ${status === s ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"}`}>
              {s === "ALL" ? "All" : STATUS_CFG[s as PostStatus]?.label ?? s}
            </button>
          ))}
        </div>
        <select value={platform} onChange={(e) => { setPlatform(e.target.value); onFilter({ search, status: status !== "ALL" ? status : undefined, platform: e.target.value !== "ALL" ? e.target.value : undefined }); }}
          className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-amber-400">
          <option value="ALL">All platforms</option>
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
        </select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto pl-2 border-l border-stone-200">
            <span className="text-xs font-semibold text-stone-600">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-xs text-stone-400 hover:text-stone-700">Clear</button>
          </div>
        )}
        <span className="text-xs text-stone-400 ml-auto">{total} post{total !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-4xl mb-3">📱</span>
            <p className="text-sm text-stone-400">No posts yet — compose your first social post</p>
          </div>
        ) : (
          <AnimatePresence>
            {posts.map((post) => (
              <PostRow key={post.id} post={post} selected={selected.has(post.id)}
                onSelect={(id) => setSelected((p) => { const n = new Set(p); p.has(id) ? n.delete(id) : n.add(id); return n; })}
                onEdit={onEdit} onDelete={onDelete} onPublish={onPublish} onDuplicate={onDuplicate}
              />
            ))}
          </AnimatePresence>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 py-6">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
              className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">← Prev</button>
            <span className="text-xs text-stone-400">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}
              className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}