"use client";

// =============================================================================
// isaacpaha.com — Idea Comments Tab
// components/admin/ideas/idea-comments-tab.tsx
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Check, AlertTriangle, Trash2, MoreHorizontal,
  Search, ExternalLink, Calendar, CheckCircle2,
  XCircle, Flag, Clock, RefreshCw, Loader2, Mail,
} from "lucide-react";

type IdeaCommentStatus = "PENDING" | "APPROVED" | "SPAM" | "REJECTED";

type IdeaComment = {
  id:          string;
  ideaId:      string;           // ← ideaId, not postId
  authorName:  string;
  authorEmail: string;
  authorUrl:   string | null;
  content:     string;
  status:      IdeaCommentStatus;
  isFlagged:   boolean;
  likeCount:   number;
  parentId:    string | null;
  createdAt:   string | Date;
  idea:        { title: string; slug: string };  // ← idea relation, not post
};

type CommentStats = {
  pending:  number;
  approved: number;
  spam:     number;
  rejected: number;
};

const STATUS_CFG: Record<
  IdeaCommentStatus,
  { label: string; color: string; bg: string; dot: string; icon: React.ElementType }
> = {
  PENDING:  { label: "Pending",  color: "#d97706", bg: "#fef3c7", dot: "#f59e0b", icon: Clock        },
  APPROVED: { label: "Approved", color: "#059669", bg: "#d1fae5", dot: "#10b981", icon: CheckCircle2  },
  SPAM:     { label: "Spam",     color: "#dc2626", bg: "#fee2e2", dot: "#ef4444", icon: AlertTriangle },
  REJECTED: { label: "Rejected", color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af", icon: XCircle      },
};

function fmtDate(d: Date | string): string {
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1)  return "today";
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Comment row ──────────────────────────────────────────────────────────────

function IdeaCommentRow({
  comment, selected, onSelect, onModerate, onDelete,
}: {
  comment:    IdeaComment;
  selected:   boolean;
  onSelect:   (id: string) => void;
  onModerate: (id: string, status: IdeaCommentStatus) => Promise<void>;
  onDelete:   (id: string) => void;
}) {
  const [acting,   setActing]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sc = STATUS_CFG[comment.status];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const moderate = async (status: IdeaCommentStatus) => {
    setActing(true);
    await onModerate(comment.id, status);
    setActing(false);
    setMenuOpen(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`group flex items-start gap-3 px-4 py-4 border-b border-stone-100 hover:bg-stone-50/60 transition-colors
        ${selected ? "bg-amber-50/30" : ""}
        ${comment.status === "PENDING" ? "border-l-2 border-l-amber-400" : ""}`}
    >
      {/* Checkbox */}
      <button onClick={() => onSelect(comment.id)} className="flex-shrink-0 mt-1">
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          selected ? "bg-amber-500 border-amber-500" : "border-stone-200 group-hover:border-stone-400"
        }`}>
          {selected && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
      </button>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm font-black text-stone-500 flex-shrink-0">
        {comment.authorName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-sm font-bold text-stone-800">{comment.authorName}</span>
          {comment.parentId && (
            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">Reply</span>
          )}
          {comment.isFlagged && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
              <Flag className="w-2.5 h-2.5" />Flagged
            </span>
          )}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"
            style={{ color: sc.color, backgroundColor: sc.bg }}
          >
            {sc.label}
          </span>
        </div>

        <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{comment.authorEmail}</span>
          <span className="text-stone-300">·</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(comment.createdAt)}</span>
        </p>

        <p className="text-sm text-stone-700 mt-2 leading-relaxed">{comment.content}</p>

        <div className="flex items-center gap-2 mt-2">
          <a
            href={`/ideas/${comment.idea.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-amber-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            On: &ldquo;{comment.idea.title.slice(0, 50)}{comment.idea.title.length > 50 ? "…" : ""}&rdquo;
          </a>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {acting ? (
          <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
        ) : (
          <>
            {comment.status !== "APPROVED" && (
              <button
                onClick={() => moderate("APPROVED")}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-2 py-1.5 rounded-sm transition-colors"
              >
                <Check className="w-3 h-3" />Approve
              </button>
            )}
            {comment.status !== "SPAM" && (
              <button
                onClick={() => moderate("SPAM")}
                className="flex items-center gap-1 text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2 py-1.5 rounded-sm transition-colors"
              >
                <AlertTriangle className="w-3 h-3" />Spam
              </button>
            )}
          </>
        )}

        {/* More menu */}
        <div className="relative" ref={menuRef}>
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
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-8 z-20 w-44 bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden"
              >
                {comment.status !== "APPROVED" && (
                  <button onClick={() => moderate("APPROVED")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" />Approve
                  </button>
                )}
                {comment.status !== "REJECTED" && (
                  <button onClick={() => moderate("REJECTED")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                    <XCircle className="w-3.5 h-3.5 text-stone-400" />Reject
                  </button>
                )}
                {comment.status !== "PENDING" && (
                  <button onClick={() => moderate("PENDING")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />Move to Pending
                  </button>
                )}
                {comment.status !== "SPAM" && (
                  <button onClick={() => moderate("SPAM")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                    <AlertTriangle className="w-3.5 h-3.5" />Mark as spam
                  </button>
                )}
                <div className="border-t border-stone-100" />
                <button onClick={() => { onDelete(comment.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function IdeaCommentsTab() {
  const [comments,     setComments]     = useState<IdeaComment[]>([]);
  const [total,        setTotal]        = useState(0);
  const [pages,        setPages]        = useState(1);
  const [page,         setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState<IdeaCommentStatus | "ALL">("PENDING");
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState<CommentStats>({ pending: 0, approved: 0, spam: 0, rejected: 0 });

  const fetchComments = useCallback(async (opts?: {
    status?: string; search?: string; pg?: number;
  }) => {
    setLoading(true);
    const s  = opts?.status ?? statusFilter;
    const q  = opts?.search ?? search;
    const pg = opts?.pg     ?? page;

    const params = new URLSearchParams({ page: String(pg), pageSize: "30" });
    if (s !== "ALL") params.set("status", s);
    if (q)           params.set("search", q);

    // ← uses /api/admin/ideas/comments — not blog comments
    const res  = await fetch(`/api/admin/ideas/comments?${params}`);
    const data = await res.json();

    setComments(data.comments ?? []);
    setTotal(data.total        ?? 0);
    setPages(data.pages        ?? 1);
    setStats(data.stats        ?? { pending: 0, approved: 0, spam: 0, rejected: 0 });
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => { fetchComments(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModerate = async (id: string, status: IdeaCommentStatus) => {
    await fetch(`/api/admin/ideas/comments/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    // Update stat counters
    const old = comments.find((c) => c.id === id)?.status;
    if (old && old !== status) {
      setStats((s) => ({
        ...s,
        [old.toLowerCase()]:    Math.max(0, s[old.toLowerCase() as keyof CommentStats] - 1),
        [status.toLowerCase()]: s[status.toLowerCase() as keyof CommentStats] + 1,
      }));
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/ideas/comments/${id}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== id));
    setTotal((t) => t - 1);
    setSelected((p) => { const n = new Set(p); n.delete(id); return n; });
  };

  const bulkModerate = async (status: IdeaCommentStatus) => {
    const ids = [...selected];
    await Promise.all(ids.map((id) =>
      fetch(`/api/admin/ideas/comments/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      })
    ));
    setComments((prev) => prev.map((c) => ids.includes(c.id) ? { ...c, status } : c));
    setSelected(new Set());
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-0 border-b border-stone-100 flex-shrink-0">
        {(Object.entries(STATUS_CFG) as [IdeaCommentStatus, typeof STATUS_CFG[IdeaCommentStatus]][]).map(([key, cfg]) => {
          const count = stats[key.toLowerCase() as keyof CommentStats] ?? 0;
          const Icon  = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); fetchComments({ status: key }); }}
              className={`flex items-center gap-2.5 px-4 py-3 border-r border-stone-100 last:border-r-0 transition-colors ${
                statusFilter === key ? "bg-stone-50" : "hover:bg-stone-50/40"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
              <div className="text-left min-w-0">
                <p className="text-sm font-black" style={{ color: cfg.color }}>{count}</p>
                <p className="text-[10px] text-stone-400 font-semibold">{cfg.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); fetchComments({ search: e.target.value }); }}
            placeholder="Search comments…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
          />
        </div>

        {/* Status pills */}
        <div className="flex gap-1">
          {(["ALL", "PENDING", "APPROVED", "SPAM", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s as IdeaCommentStatus | "ALL"); fetchComments({ status: s }); }}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border transition-colors ${
                statusFilter === s
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_CFG[s].label}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchComments()}
          className="text-stone-400 hover:text-stone-700 transition-colors ml-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
            <span className="text-xs font-semibold text-stone-600">{selected.size} selected</span>
            <button
              onClick={() => bulkModerate("APPROVED")}
              className="text-[11px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-2 py-1.5 rounded-sm flex items-center gap-1 transition-colors"
            >
              <Check className="w-3 h-3" />Approve all
            </button>
            <button
              onClick={() => bulkModerate("SPAM")}
              className="text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2 py-1.5 rounded-sm flex items-center gap-1 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />Spam all
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-stone-400 hover:text-stone-700">
              Clear
            </button>
          </div>
        )}

        <span className="text-xs text-stone-400">{total} comment{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare className="w-10 h-10 text-stone-200 mb-3" />
            <p className="text-sm text-stone-400">
              {statusFilter === "PENDING"
                ? "No pending comments — all moderated!"
                : "No comments match your filter"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <IdeaCommentRow
                key={comment.id}
                comment={comment}
                selected={selected.has(comment.id)}
                onSelect={(id) => setSelected((p) => {
                  const n = new Set(p);
                  if (p.has(id)) n.delete(id); else n.add(id);
                  return n;
                })}
                onModerate={handleModerate}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 py-6">
            <button
              disabled={page <= 1}
              onClick={() => { setPage(page - 1); fetchComments({ pg: page - 1 }); }}
              className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-stone-400">Page {page} of {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => { setPage(page + 1); fetchComments({ pg: page + 1 }); }}
              className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}