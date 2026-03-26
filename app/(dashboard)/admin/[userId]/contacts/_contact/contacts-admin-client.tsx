"use client";

// =============================================================================
// isaacpaha.com — Contacts Admin Client
// components/admin/contacts/contacts-admin-client.tsx
// =============================================================================

import React, { useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence }  from "framer-motion";
import {
  Mail, MailOpen, MessageSquare, Clock,
  Search, Trash2, Check, X, 
  AlertCircle, Loader2,  Reply,
  BarChart2, Inbox, Download, CheckCheck,
  Building2, DollarSign, Calendar,
  ArrowLeft, ExternalLink, 
} from "lucide-react";
import {
  markAsRead, markAsReplied, markAsUnreplied,
  markAllRead, deleteSubmission, bulkDelete,
} from "@/lib/actions/contacts-actions";

;

// ─── Types ────────────────────────────────────────────────────────────────────

type Submission = {
  id:         string;
  name:       string;
  email:      string;
  type:       string;
  subject:    string | null;
  message:    string;
  company:    string | null;
  budget:     string | null;
  isRead:     boolean;
  isReplied:  boolean;
  repliedAt:  Date | null;
  ipAddress:  string | null;
  createdAt:  Date;
  updatedAt:  Date;
};

type Stats = {
  total:     number;
  unread:    number;
  unreplied: number;
  last7d:    number;
  last30d:   number;
  byType:    { type: string; count: number }[];
};

type VolumePoint = { date: string; count: number };

interface Props {
  userId:               string;
  stats:                Stats;
  initialSubmissions:   Submission[];
  submissionTotal:      number;
  submissionPages:      number;
  volume:               VolumePoint[];
  avgReplyTime:         string | null;
  activeTab:            "inbox" | "analytics";
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  collaboration: { label: "Collaboration", emoji: "🤝", color: "#f59e0b", bg: "#fef3c7" },
  consulting:    { label: "Consulting",    emoji: "💼", color: "#10b981", bg: "#d1fae5" },
  speaking:      { label: "Speaking",      emoji: "🎙️", color: "#8b5cf6", bg: "#ede9fe" },
  general:       { label: "General",       emoji: "💬", color: "#64748b", bg: "#f1f5f9" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string) {
  const date = new Date(d);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtFull(d: Date | string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type, size = "sm" }: { type: string; size?: "sm" | "xs" }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;
  return (
    <span
      className={`font-bold rounded-sm inline-flex items-center gap-1 ${
        size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
      }`}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, message, onConfirm, onCancel, loading,
}: {
  open: boolean; message: string;
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
            className="bg-white rounded-sm border border-stone-100 shadow-xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-sm text-stone-700 leading-relaxed pt-1">{message}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onCancel}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-sm hover:text-stone-800 transition-colors">
                Cancel
              </button>
              <button onClick={onConfirm} disabled={loading}
                className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-2">
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Submission detail panel ──────────────────────────────────────────────────

function SubmissionDetail({
  sub,
  onClose,
  onReply,
  onToggleReplied,
  onDelete,
  isPending,
}: {
  sub:             Submission;
  onClose:         () => void;
  onReply:         (sub: Submission) => void;
  onToggleReplied: (sub: Submission) => void;
  onDelete:        (sub: Submission) => void;
  isPending:       boolean;
}) {
  const cfg = TYPE_CONFIG[sub.type] ?? TYPE_CONFIG.general;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full bg-white border-l border-stone-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />Back
        </button>
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${sub.email}?subject=Re: Your ${sub.type} enquiry`}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-700 px-3 py-1.5 rounded-sm transition-colors"
            onClick={() => onReply(sub)}
          >
            <Reply className="w-3.5 h-3.5" />Reply in email
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          <button
            onClick={() => onDelete(sub)}
            className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-sm transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Sender + type */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-black text-stone-500 text-sm flex-shrink-0">
              {sub.name[0].toUpperCase()}
            </div>
            <div>
              <p className="font-black text-stone-900 text-sm">{sub.name}</p>
              <a href={`mailto:${sub.email}`} className="text-xs text-amber-600 hover:underline">
                {sub.email}
              </a>
            </div>
          </div>
          <TypeBadge type={sub.type} />
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-sm p-3">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Received</p>
            <p className="text-xs text-stone-700 font-medium">{fmtFull(sub.createdAt)}</p>
          </div>
          <div className="bg-stone-50 rounded-sm p-3">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center gap-2">
              {sub.isReplied ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />Replied
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />Awaiting reply
                </span>
              )}
            </div>
          </div>
          {sub.company && (
            <div className="bg-stone-50 rounded-sm p-3">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Company</p>
              <p className="text-xs text-stone-700 font-medium flex items-center gap-1">
                <Building2 className="w-3 h-3 text-stone-400" />{sub.company}
              </p>
            </div>
          )}
          {sub.budget && (
            <div className="bg-stone-50 rounded-sm p-3">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Budget</p>
              <p className="text-xs text-stone-700 font-medium flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-stone-400" />{sub.budget}
              </p>
            </div>
          )}
          {sub.subject && (
            <div className="bg-stone-50 rounded-sm p-3 col-span-2">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Subject / Project</p>
              <p className="text-xs text-stone-700 font-medium">{sub.subject}</p>
            </div>
          )}
        </div>

        {/* Message */}
        <div>
          <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider mb-2">Message</p>
          <div className="bg-stone-50 border border-stone-100 rounded-sm p-4">
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{sub.message}</p>
          </div>
        </div>

        {/* Reply timeline */}
        {sub.isReplied && sub.repliedAt && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-2">
            <CheckCheck className="w-3.5 h-3.5" />
            Marked as replied on {fmtFull(sub.repliedAt)}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-stone-100 flex-shrink-0 space-y-2">
        <button
          onClick={() => onToggleReplied(sub)}
          disabled={isPending}
          className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-sm transition-colors disabled:opacity-60 ${
            sub.isReplied
              ? "bg-stone-100 text-stone-600 hover:bg-stone-200"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : sub.isReplied
              ? <><X className="w-4 h-4" />Mark as unreplied</>
              : <><Check className="w-4 h-4" />Mark as replied</>
          }
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT
// ─────────────────────────────────────────────────────────────────────────────

export function ContactsAdminClient({
  userId, stats, initialSubmissions, submissionTotal,
  submissionPages, volume, avgReplyTime, activeTab: initialTab,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // ── State ────────────────────────────────────────────────────────────────
  const [tab,          setTab]         = useState(initialTab);
  const [submissions,  setSubmissions] = useState(initialSubmissions);
  const [selected,     setSelected]    = useState<Set<string>>(new Set());
  const [active,       setActive]      = useState<Submission | null>(null);
  const [search,       setSearch]      = useState("");
  const [typeFilter,   setTypeFilter]  = useState<string>("all");
  const [statusFilter, setStatusFilter]= useState<"all" | "unread" | "unreplied">("all");
//   const [loading,      setLoading]     = useState(false);

  // ── Confirm dialog ───────────────────────────────────────────────────────
  const [confirmOpen,    setConfirmOpen]    = useState(false);
  const [confirmMsg,     setConfirmMsg]     = useState("");
  const [confirmAction,  setConfirmAction]  = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const localUnread = submissions.filter((s) => !s.isRead).length;

  const filtered = submissions.filter((s) => {
    const matchType   = typeFilter === "all"   || s.type === typeFilter;
    const matchStatus =
      statusFilter === "all"       ||
      (statusFilter === "unread"    && !s.isRead) ||
      (statusFilter === "unreplied" && !s.isReplied);
    const matchSearch = !search || [s.name, s.email, s.message, s.company ?? "", s.subject ?? ""]
      .some((f) => f.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchStatus && matchSearch;
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleOpen = useCallback((sub: Submission) => {
    setActive(sub);
    if (!sub.isRead) {
      startTransition(async () => {
        await markAsRead(sub.id);
        setSubmissions((prev) => prev.map((s) => s.id === sub.id ? { ...s, isRead: true } : s));
      });
    }
  }, []);

  const handleToggleReplied = useCallback((sub: Submission) => {
    startTransition(async () => {
      if (sub.isReplied) {
        await markAsUnreplied(sub.id);
        const updated = { ...sub, isReplied: false, repliedAt: null };
        setSubmissions((prev) => prev.map((s) => s.id === sub.id ? updated : s));
        setActive(updated);
      } else {
        await markAsReplied(sub.id);
        const updated = { ...sub, isReplied: true, isRead: true, repliedAt: new Date() };
        setSubmissions((prev) => prev.map((s) => s.id === sub.id ? updated : s));
        setActive(updated);
      }
    });
  }, []);

  const handleReply = useCallback((sub: Submission) => {
    // Opening mailto marks as replied
    startTransition(async () => {
      await markAsReplied(sub.id);
      const updated = { ...sub, isReplied: true, isRead: true, repliedAt: new Date() };
      setSubmissions((prev) => prev.map((s) => s.id === sub.id ? updated : s));
      if (active?.id === sub.id) setActive(updated);
    });
  }, [active]);

  const handleDelete = useCallback((sub: Submission) => {
    setConfirmMsg(`Delete message from ${sub.name}? This cannot be undone.`);
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      await deleteSubmission(sub.id);
      setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
      if (active?.id === sub.id) setActive(null);
      setSelected((prev) => { const n = new Set(prev); n.delete(sub.id); return n; });
      setConfirmOpen(false);
      setConfirmLoading(false);
    });
    setConfirmOpen(true);
  }, [active]);

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    setConfirmMsg(`Delete ${selected.size} selected message(s)? This cannot be undone.`);
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      await bulkDelete([...selected]);
      setSubmissions((prev) => prev.filter((s) => !selected.has(s.id)));
      if (active && selected.has(active.id)) setActive(null);
      setSelected(new Set());
      setConfirmOpen(false);
      setConfirmLoading(false);
    });
    setConfirmOpen(true);
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllRead();
      setSubmissions((prev) => prev.map((s) => ({ ...s, isRead: true })));
    });
  };

  const handleExportCSV = () => {
    const rows = [
      ["Name", "Email", "Type", "Company", "Budget", "Subject", "Message", "Read", "Replied", "Date"],
      ...filtered.map((s) => [
        s.name, s.email, s.type, s.company ?? "", s.budget ?? "",
        s.subject ?? "", s.message.replace(/\n/g, " "), String(s.isRead),
        String(s.isReplied), new Date(s.createdAt).toISOString(),
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `contacts-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: "inbox",     label: "Inbox",     icon: Inbox,    badge: localUnread || undefined },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
  ] as const;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-[1400px] space-y-6">

      <ConfirmDialog
        open={confirmOpen} message={confirmMsg}
        onConfirm={() => confirmAction?.()}
        onCancel={() => setConfirmOpen(false)}
        loading={confirmLoading}
      />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Contacts</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Enquiries from isaacpaha.com/contact — all saved to your database.
          </p>
        </div>
        {localUnread > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-sm px-4 py-2.5">
            <MailOpen className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">{localUnread} unread</span>
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-amber-500 hover:text-amber-800 underline ml-1"
            >
              Mark all read
            </button>
          </div>
        )}
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          { label: "Total",         value: stats.total,                               icon: MessageSquare, color: "#f59e0b" },
          { label: "Unread",        value: stats.unread,                              icon: Mail,          color: "#ef4444" },
          { label: "Awaiting reply",value: stats.unreplied,                           icon: Clock,         color: "#8b5cf6" },
          { label: "Last 7 days",   value: `+${stats.last7d}`,                        icon: Calendar,      color: "#10b981" },
          { label: "Avg reply time",value: avgReplyTime ?? "—",                       icon: Reply,         color: "#3b82f6" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-stone-100 rounded-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-black text-stone-900">{s.value}</p>
            <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-stone-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === t.id
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {"badge" in t && t.badge !== undefined && (
              <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: INBOX
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "inbox" && (
        <div className={`flex gap-0 border border-stone-100 rounded-sm overflow-hidden bg-white ${
          active ? "h-[calc(100vh-340px)]" : ""
        }`} style={{ minHeight: active ? 500 : undefined }}>

          {/* ── LEFT: list ──────────────────────────────────────────────── */}
          <div className={`flex flex-col ${active ? "w-[380px] flex-shrink-0 border-r border-stone-100" : "flex-1"}`}>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-stone-100 bg-stone-50/50">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs border border-stone-200 rounded-sm px-2 py-2 focus:outline-none bg-white text-stone-600"
              >
                <option value="all">All types</option>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs border border-stone-200 rounded-sm px-2 py-2 focus:outline-none bg-white text-stone-600"
              >
                <option value="all">All messages</option>
                <option value="unread">Unread only</option>
                <option value="unreplied">Unreplied only</option>
              </select>

              {selected.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-2 rounded-sm flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />Delete {selected.size}
                </button>
              )}

              <button
                onClick={handleExportCSV}
                className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2.5 py-2 rounded-sm flex items-center gap-1.5 transition-colors ml-auto"
              >
                <Download className="w-3.5 h-3.5" />CSV
              </button>
            </div>

            {/* Count */}
            <div className="px-3 py-2 border-b border-stone-50 flex items-center justify-between">
              <p className="text-[11px] text-stone-400">
                <strong className="text-stone-600">{filtered.length}</strong> of {submissionTotal} messages
              </p>
              {selected.size > 0 && (
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-[11px] text-stone-400 hover:text-stone-700"
                >
                  Clear selection
                </button>
              )}
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Inbox className="w-8 h-8 text-stone-200 mb-3" />
                  <p className="text-sm text-stone-400 font-medium">No messages found</p>
                  <p className="text-xs text-stone-300 mt-1">
                    {search ? `No results for "${search}"` : "Adjust your filters to see messages"}
                  </p>
                </div>
              ) : (
                filtered.map((sub) => {
                  const cfg = TYPE_CONFIG[sub.type] ?? TYPE_CONFIG.general;
                  const isActive = active?.id === sub.id;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => handleOpen(sub)}
                      className={`group flex items-start gap-3 px-3 py-3.5 cursor-pointer transition-colors ${
                        isActive
                          ? "bg-amber-50 border-l-2 border-amber-500"
                          : "hover:bg-stone-50/80 border-l-2 border-transparent"
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selected.has(sub.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const n = new Set(selected);
                        //   e.target.checked ? n.add(sub.id) : n.delete(sub.id);
                            if (n.has(sub.id)) n.delete(sub.id);

                          setSelected(n);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 flex-shrink-0 rounded"
                      />

                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {sub.name[0].toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!sub.isRead && (
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            )}
                            <p className={`text-sm truncate ${sub.isRead ? "text-stone-600" : "font-bold text-stone-900"}`}>
                              {sub.name}
                            </p>
                          </div>
                          <span className="text-[10px] text-stone-300 flex-shrink-0">{fmtDate(sub.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <TypeBadge type={sub.type} size="xs" />
                          {sub.isReplied && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />replied
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-400 truncate leading-snug">
                          {sub.subject ? <span className="font-medium text-stone-500">{sub.subject} — </span> : null}
                          {sub.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: detail ────────────────────────────────────────────── */}
          <AnimatePresence>
            {active && (
              <div className="flex-1 overflow-hidden">
                <SubmissionDetail
                  sub={active}
                  onClose={() => setActive(null)}
                  onReply={handleReply}
                  onToggleReplied={handleToggleReplied}
                  onDelete={handleDelete}
                  isPending={isPending}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Empty detail state */}
          {!active && filtered.length > 0 && (
            <div className="hidden xl:flex flex-1 items-center justify-center border-l border-stone-100 bg-stone-50/30">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                <p className="text-sm text-stone-400">Select a message to read it</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: ANALYTICS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Volume chart */}
          <div className="xl:col-span-2 bg-white border border-stone-100 rounded-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-stone-700">Enquiry Volume — Last 30 Days</h2>
              <span className="text-xs text-stone-400">+{stats.last30d} this month</span>
            </div>
            <div className="flex items-end gap-[3px] h-32">
              {volume.map((d, i) => {
                const max = Math.max(...volume.map((v) => v.count), 1);
                const h   = Math.max(2, (d.count / max) * 120);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] bg-stone-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {d.date}: {d.count}
                    </span>
                    <div
                      className="w-full rounded-sm bg-amber-400 hover:bg-amber-500 transition-colors cursor-default"
                      style={{ height: h }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-stone-300">
              <span>{volume[0]?.date}</span>
              <span>{volume[volume.length - 1]?.date}</span>
            </div>
          </div>

          {/* Type breakdown + reply rate */}
          <div className="space-y-4">

            {/* By type */}
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <h2 className="text-sm font-black text-stone-700 mb-4">By Type</h2>
              <div className="space-y-3">
                {stats.byType.length === 0 ? (
                  <p className="text-xs text-stone-400">No submissions yet.</p>
                ) : (
                  stats.byType.map((b) => {
                    const cfg = TYPE_CONFIG[b.type] ?? TYPE_CONFIG.general;
                    const pct = stats.total > 0 ? Math.round((b.count / stats.total) * 100) : 0;
                    return (
                      <div key={b.type}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-stone-600 flex items-center gap-1.5">
                            <span>{cfg.emoji}</span>{cfg.label}
                          </span>
                          <span className="text-stone-400">{b.count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reply rate */}
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <h2 className="text-sm font-black text-stone-700 mb-4">Response Health</h2>
              <div className="space-y-3">
                {[
                  {
                    label: "Reply rate",
                    value: stats.total > 0
                      ? `${Math.round(((stats.total - stats.unreplied) / stats.total) * 100)}%`
                      : "—",
                    color: "#10b981",
                  },
                  {
                    label: "Read rate",
                    value: stats.total > 0
                      ? `${Math.round(((stats.total - stats.unread) / stats.total) * 100)}%`
                      : "—",
                    color: "#3b82f6",
                  },
                  {
                    label: "Avg reply time",
                    value: avgReplyTime ?? "No replies yet",
                    color: "#f59e0b",
                  },
                  {
                    label: "Awaiting reply",
                    value: String(stats.unreplied),
                    color: "#ef4444",
                  },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">{m.label}</span>
                    <span className="text-sm font-black" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}