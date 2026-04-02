"use client";

// =============================================================================
// isaacpaha.com — Blog Post List
// components/admin/blog/post-list.tsx
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Globe, Lock, Eye, Heart, MessageSquare,
  Trash2, Copy, Edit2, MoreHorizontal, CheckSquare, Square,
   ExternalLink, 
} from "lucide-react";
import Image from "next/image";

type BlogStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

type PostSummary = {
  id:             string;
  title:          string;
  slug:           string;
  excerpt:        string;
  status:         BlogStatus;
  coverImage:     string | null;
  categoryId:     string | null;
  isFeatured:     boolean;
  isToolsShowcase:  boolean;
  isLatest:        boolean;
  isPinned:       boolean;
  isPremium:      boolean;
  isIdeasLab:     boolean;
  isBuildInPublic: boolean;
  tags:           string | null;
  publishedAt:    Date | null;
  scheduledAt:    Date | null;
  readingTimeMinutes: number;
  wordCount:      number;
  viewCount:      number;
  likeCount:      number;
  commentCount:   number;
  trendingScore:  number;
  createdAt:      Date;
  updatedAt:      Date;
  category?:      { name: string; color: string | null } | null;
};

interface PostListProps {
  posts:        PostSummary[];
  total:        number;
  pages:        number;
  page:         number;
  userId:       string;
  onEdit:       (post: PostSummary) => void;
  onDelete:     (id: string, title: string) => void;
  onDuplicate:  (id: string) => void;
  onTogglePublish: (post: PostSummary) => void;
  onPageChange: (page: number) => void;
  onFilter:     (params: { search?: string; status?: string; sort?: string }) => void;
}

const STATUS_CFG: Record<BlogStatus, { label: string; color: string; bg: string; dot: string }> = {
  PUBLISHED: { label: "Published", color: "#059669", bg: "#d1fae5", dot: "#10b981" },
  DRAFT:     { label: "Draft",     color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
  SCHEDULED: { label: "Scheduled", color: "#2563eb", bg: "#dbeafe", dot: "#3b82f6" },
  ARCHIVED:  { label: "Archived",  color: "#7c3aed", bg: "#ede9fe", dot: "#8b5cf6" },
};

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
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function PostRow({
  post, selected, onSelect, onEdit, onDelete, onDuplicate, onTogglePublish,
}: {
  post: PostSummary; userId: string; selected: boolean;
  onSelect: (id: string) => void; onEdit: (post: PostSummary) => void;
  onDelete: (id: string, title: string) => void; onDuplicate: (id: string) => void;
  onTogglePublish: (post: PostSummary) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const sc = STATUS_CFG[post.status];

  return (
    <motion.div layout initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
      className={`group flex items-start gap-3 px-4 py-3.5 border-b border-stone-100 hover:bg-stone-50/60 transition-colors ${selected ? "bg-amber-50/30" : ""}`}>

      <button onClick={() => onSelect(post.id)} className="flex-shrink-0 mt-0.5">
        {selected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4 text-stone-200 group-hover:text-stone-400 transition-colors" />}
      </button>

      <button onClick={() => onTogglePublish(post)} className="flex-shrink-0 mt-0.5" title={post.status === "PUBLISHED" ? "Unpublish" : "Publish"}>
        {post.status === "PUBLISHED" ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-stone-200 group-hover:text-stone-400 transition-colors" />}
      </button>

      {/* Cover thumbnail */}
      {post.coverImage ? (
        <div className="w-10 h-10 rounded-sm overflow-hidden flex-shrink-0 border border-stone-100">
          <Image 
            src={post.coverImage} 
            width={100}
            height={100}
            alt="" 
            className="w-full h-full object-cover" 
        />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-amber-50 to-stone-100 border border-stone-100 flex-shrink-0 flex items-center justify-center text-lg">
          📄
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <button onClick={() => onEdit(post)}
            className="text-sm font-bold text-stone-800 hover:text-amber-600 transition-colors text-left leading-snug">
            {post.title}
          </button>
          {post.isFeatured && <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm uppercase flex-shrink-0">Featured</span>}
          {post.isToolsShowcase && <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm uppercase flex-shrink-0">Tools Showcase</span>}
          {post.isLatest && <span className="text-[9px] font-black bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-sm uppercase flex-shrink-0">Latest</span>}
          {post.isPinned   && <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm uppercase flex-shrink-0">Pinned</span>}
          {post.isPremium  && <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm uppercase flex-shrink-0">Premium</span>}
          {post.isIdeasLab && <span className="text-[9px] font-black bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-sm uppercase flex-shrink-0">Ideas Lab</span>}
          {post.isBuildInPublic && <span className="text-[9px] font-black bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-sm uppercase flex-shrink-0">Build Public</span>}
        </div>
        <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">{post.excerpt}</p>
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm" style={{ color: sc.color, backgroundColor: sc.bg }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
            {sc.label}
          </span>
          {post.category && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm text-stone-600 bg-stone-100">{post.category.name}</span>
          )}
          {parseTags(post.tags).slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-sm">{t}</span>
          ))}
          <span className="text-[10px] text-stone-300">·</span>
          <span className="text-[10px] text-stone-400">{fmtDate(post.updatedAt)}</span>
          <span className="text-[10px] text-stone-400">{post.wordCount.toLocaleString()} words</span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden lg:flex items-center gap-3 flex-shrink-0 text-[11px] text-stone-400">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likeCount}</span>
        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.commentCount}</span>
      </div>

      {/* Dashboard link */}
      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
        className="hidden sm:flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2 py-1.5 rounded-sm transition-colors flex-shrink-0">
        <ExternalLink className="w-3 h-3" />View
      </a>

      {/* Actions menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button onClick={() => setMenuOpen((p) => !p)}
          className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-20 w-44 bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden">
              {[
                { label: "Edit", icon: Edit2, action: () => { onEdit(post); setMenuOpen(false); } },
                { label: post.status === "PUBLISHED" ? "Unpublish" : "Publish", icon: post.status === "PUBLISHED" ? Lock : Globe, action: () => { onTogglePublish(post); setMenuOpen(false); } },
                { label: "Duplicate", icon: Copy, action: () => { onDuplicate(post.id); setMenuOpen(false); } },
              ].map((m) => (
                <button key={m.label} onClick={m.action}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                  <m.icon className="w-3.5 h-3.5 text-stone-400" />{m.label}
                </button>
              ))}
              <div className="border-t border-stone-100" />
              <button onClick={() => { onDelete(post.id, post.title); setMenuOpen(false); }}
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

export function PostList({
  posts, total, pages, page, userId,
  onEdit, onDelete, onDuplicate, onTogglePublish, onPageChange, onFilter,
}: PostListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("ALL");
  const [sort,     setSort]     = useState("updatedAt_desc");

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    onFilter({ search: q, status: status !== "ALL" ? status : undefined, sort });
  }, [status, sort, onFilter]);

  const handleStatusFilter = useCallback((s: string) => {
    setStatus(s);
    onFilter({ search, status: s !== "ALL" ? s : undefined, sort });
  }, [search, sort, onFilter]);

  const handleSort = useCallback((s: string) => {
    setSort(s);
    onFilter({ search, status: status !== "ALL" ? status : undefined, sort: s });
  }, [search, status, onFilter]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 flex-wrap bg-white">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1">
          {["ALL", "DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"].map((s) => {
            const sc = s !== "ALL" ? STATUS_CFG[s as BlogStatus] : null;
            return (
              <button key={s} onClick={() => handleStatusFilter(s)}
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border transition-colors ${
                  status === s ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
                }`}>
                {s === "ALL" ? "All" : sc?.label}
              </button>
            );
          })}
        </div>

        <select value={sort} onChange={(e) => handleSort(e.target.value)}
          className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-amber-400">
          <option value="updatedAt_desc">Recently updated</option>
          <option value="publishedAt_desc">Recently published</option>
          <option value="createdAt_desc">Newest</option>
          <option value="viewCount_desc">Most viewed</option>
          <option value="likeCount_desc">Most liked</option>
          <option value="trendingScore_desc">Trending</option>
          <option value="title_asc">Title A–Z</option>
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto pl-2 border-l border-stone-200">
            <span className="text-xs font-semibold text-stone-600">{selected.size} selected</span>
            <button onClick={() => {}} className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />Delete
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-stone-400 hover:text-stone-700">Clear</button>
          </div>
        )}

        <span className="text-xs text-stone-400 ml-auto">{total} post{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Select all */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-stone-50 bg-stone-50/40 flex-shrink-0">
        <button onClick={() => setSelected(selected.size === posts.length && posts.length > 0 ? new Set() : new Set(posts.map((p) => p.id)))}
          className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center gap-1.5">
          {selected.size === posts.length && posts.length > 0 ? <CheckSquare className="w-3.5 h-3.5 text-amber-500" /> : <Square className="w-3.5 h-3.5" />}
          Select all
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">📝</span>
            <p className="text-sm text-stone-400">No posts match your filters</p>
          </div>
        ) : (
          <AnimatePresence>
            {posts.map((post) => (
              <PostRow key={post.id} post={post} userId={userId} selected={selected.has(post.id)}
                onSelect={(id) =>
                    setSelected((p) => {
                    const n = new Set(p);
                    if (n.has(id)) {
                        n.delete(id);
                    } else {
                        n.add(id);
                    }
                    return n;
                    })
                }
                onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onTogglePublish={onTogglePublish}
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