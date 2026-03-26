"use client";

// =============================================================================
// isaacpaha.com — Newsletter Admin Client
// components/admin/newsletter/newsletter-admin-client.tsx
// =============================================================================

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Users, Send, BarChart2, Plus, Search,
  Trash2, RefreshCw, Download, Check,
  X, Edit2, Eye, AlertCircle,
   UserCheck, UserX, Loader2,
  FileText, CheckCircle2, 
} from "lucide-react";
import {
  addSubscriber,
  updateSubscriberStatus,
  deleteSubscriber,
  createEdition,
  deleteEdition,
} from  "@/lib/actions/newsletter-actions";


// ─── Types ────────────────────────────────────────────────────────────────────

type Subscriber = {
  id:           string;
  email:        string;
  firstName:    string | null;
  status:       "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED";
  source:       string | null;
  subscribedAt: Date;
  user:         { displayName: string; avatarUrl: string | null; role: string } | null;
};

type Edition = {
  id:             string;
  issueNumber:    number;
  title:          string;
  slug:           string;
  preview:        string;
  sentAt:         Date | null;
  recipientCount: number;
  openCount:      number;
  clickCount:     number;
  createdAt:      Date;
  updatedAt:      Date;
};

type Stats = {
  total: number; active: number; unsubscribed: number;
  bounced: number; last30d: number; last7d: number;
};

type GrowthPoint = { date: string; count: number };
type SourceItem  = { source: string; count: number };

interface Props {
  userId:              string;
  stats:               Stats;
  initialSubscribers:  Subscriber[];
  subscriberTotal:     number;
  subscriberPages:     number;
  initialEditions:     Edition[];
  editionTotal:        number;
  sources:             SourceItem[];
  growth:              GrowthPoint[];
  nextIssueNumber:     number;
  activeTab:           "overview" | "subscribers" | "editions" | "compose";
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    ACTIVE:       { label: "Active",       color: "#10b981", bg: "#d1fae5" },
    UNSUBSCRIBED: { label: "Unsubscribed", color: "#94a3b8", bg: "#f1f5f9" },
    BOUNCED:      { label: "Bounced",      color: "#ef4444", bg: "#fee2e2" },
  }[status] ?? { label: status, color: "#666", bg: "#f5f5f5" };

  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-sm"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

// function GrowthChart({ data }: { data: GrowthPoint[] }) {
//   const max = Math.max(...data.map((d) => d.count), 1);
//   const last7 = data.slice(-7);

//   return (
//     <div className="flex items-end gap-[3px] h-12">
//       {last7.map((d, i) => (
//         <div key={i} className="flex-1 flex flex-col items-center gap-1">
//           <div
//             className="w-full rounded-sm bg-amber-400 transition-all"
//             style={{ height: `${Math.max(4, (d.count / max) * 44)}px` }}
//             title={`${d.date}: ${d.count}`}
//           />
//         </div>
//       ))}
//     </div>
//   );
// }

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
              <button onClick={onCancel} className="text-xs font-semibold text-stone-500 hover:text-stone-800 border border-stone-200 px-4 py-2 rounded-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={onConfirm} disabled={loading}
                className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT
// ─────────────────────────────────────────────────────────────────────────────

export function NewsletterAdminClient({
  stats, initialSubscribers, subscriberTotal,
  initialEditions, editionTotal,
  sources, growth, nextIssueNumber, activeTab: initialTab,
}: Props) {
//   const router      = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Tab state ────────────────────────────────────────────────────────────
  const [tab, setTab] = useState(initialTab);

  // ── Subscriber state ─────────────────────────────────────────────────────
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [subSearch,   setSubSearch]   = useState("");
  const [subFilter,   setSubFilter]   = useState<"ALL" | "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED">("ALL");
//   const [subPage,     setSubPage]     = useState(1);
  const [subLoading,  setSubLoading]  = useState(false);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());

  // ── Add subscriber form ───────────────────────────────────────────────────
  const [addEmail,    setAddEmail]    = useState("");
  const [addName,     setAddName]     = useState("");
  const [addOpen,     setAddOpen]     = useState(false);
  const [addLoading,  setAddLoading]  = useState(false);
  const [addMsg,      setAddMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  // ── Confirm delete ────────────────────────────────────────────────────────
  const [confirmOpen,     setConfirmOpen]     = useState(false);
  const [confirmMsg,      setConfirmMsg]      = useState("");
  const [confirmAction,   setConfirmAction]   = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading,  setConfirmLoading]  = useState(false);

  // ── Edition state ─────────────────────────────────────────────────────────
  const [editions,      setEditions]      = useState(initialEditions);
  const [sendingId,     setSendingId]     = useState<string | null>(null);
  const [sendResult,    setSendResult]    = useState<{ sent: number; failed: number } | null>(null);

  // ── Compose state ─────────────────────────────────────────────────────────
  const [compTitle,    setCompTitle]    = useState("");
  const [compSlug,     setCompSlug]     = useState("");
  const [compPreview,  setCompPreview]  = useState("");
  const [compContent,  setCompContent]  = useState("");
  const [compSaving,   setCompSaving]   = useState(false);
  const [compSaved,    setCompSaved]    = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const openRate = (ed: Edition) =>
    ed.recipientCount > 0 ? ((ed.openCount / ed.recipientCount) * 100).toFixed(1) : "—";

  const clickRate = (ed: Edition) =>
    ed.recipientCount > 0 ? ((ed.clickCount / ed.recipientCount) * 100).toFixed(1) : "—";

  const filteredSubs = subscribers.filter((s) => {
    const matchStatus = subFilter === "ALL" || s.status === subFilter;
    const matchSearch =
      !subSearch ||
      s.email.toLowerCase().includes(subSearch.toLowerCase()) ||
      (s.firstName ?? "").toLowerCase().includes(subSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleRefreshSubscribers = async () => {
    setSubLoading(true);
    try {
      const res = await fetch(
        `/api/admin/newsletter/subscribers?pageSize=200&status=${subFilter === "ALL" ? "" : subFilter}`
      );
      const data = await res.json();
      setSubscribers(data.subscribers);
    } finally {
      setSubLoading(false);
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.includes("@")) return;
    setAddLoading(true);
    setAddMsg(null);
    try {
      const sub = await addSubscriber({ email: addEmail, firstName: addName || undefined, source: "admin" });
      setSubscribers((prev) => [sub as unknown as Subscriber, ...prev.filter((s) => s.email !== sub.email)]);
      setAddMsg({ ok: true, text: `${addEmail} added successfully.` });
      setAddEmail("");
      setAddName("");
    } catch (err: unknown) {
      setAddMsg({ ok: false, text: (err as Error).message ?? "Failed to add subscriber." });
    } finally {
      setAddLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED") => {
    startTransition(async () => {
      await updateSubscriberStatus(id, status);
      setSubscribers((prev) =>
        prev.map((s) => s.id === id ? { ...s, status } : s)
      );
    });
  };

  const handleDeleteSubscriber = (id: string, email: string) => {
    setConfirmMsg(`Permanently delete ${email}? This cannot be undone.`);
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      await deleteSubscriber(id);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      setConfirmOpen(false);
      setConfirmLoading(false);
    });
    setConfirmOpen(true);
  };

  const handleBulkUnsubscribe = () => {
    if (selected.size === 0) return;
    setConfirmMsg(`Unsubscribe ${selected.size} selected subscriber(s)?`);
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      await Promise.all(
        [...selected].map((id) => updateSubscriberStatus(id, "UNSUBSCRIBED"))
      );
      setSubscribers((prev) =>
        prev.map((s) => selected.has(s.id) ? { ...s, status: "UNSUBSCRIBED" as const } : s)
      );
      setSelected(new Set());
      setConfirmOpen(false);
      setConfirmLoading(false);
    });
    setConfirmOpen(true);
  };

  const handleSendEdition = async (id: string) => {
    setSendingId(id);
    setSendResult(null);
    try {
      const res = await fetch(`/api/admin/newsletter/editions/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ sent: data.sent, failed: data.failed });
        setEditions((prev) =>
          prev.map((e) => e.id === id ? { ...e, sentAt: new Date(), recipientCount: data.sent } : e)
        );
      }
    } finally {
      setSendingId(null);
    }
  };

  const handleDeleteEdition = (id: string, title: string) => {
    setConfirmMsg(`Delete edition "${title}"? This cannot be undone.`);
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      await deleteEdition(id);
      setEditions((prev) => prev.filter((e) => e.id !== id));
      setConfirmOpen(false);
      setConfirmLoading(false);
    });
    setConfirmOpen(true);
  };

  const handleSaveDraft = async () => {
    if (!compTitle || !compPreview || !compContent) return;
    setCompSaving(true);
    try {
      const slug = compSlug || compTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const edition = await createEdition({
        title: compTitle, slug, preview: compPreview, content: compContent,
      });
      setEditions((prev) => [edition as unknown as Edition, ...prev]);
      setCompSaved(true);
      setTimeout(() => setCompSaved(false), 3000);
      setCompTitle(""); setCompSlug(""); setCompPreview(""); setCompContent("");
      setTab("editions");
    } finally {
      setCompSaving(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["Email", "Name", "Status", "Source", "Subscribed At"],
      ...filteredSubs.map((s) => [
        s.email, s.firstName ?? "", s.status, s.source ?? "",
        fmtDate(s.subscribedAt),
      ]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Tabs config ───────────────────────────────────────────────────────────

  const TABS = [
    { id: "overview",     label: "Overview",     icon: BarChart2 },
    { id: "subscribers",  label: "Subscribers",  icon: Users,    badge: stats.active },
    { id: "editions",     label: "Editions",     icon: Mail,     badge: editionTotal },
    { id: "compose",      label: "Compose",      icon: Edit2 },
  ] as const;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-[1400px] space-y-6">

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        message={confirmMsg}
        onConfirm={() => confirmAction?.()}
        onCancel={() => setConfirmOpen(false)}
        loading={confirmLoading}
      />

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Newsletter</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Manage The Signal — subscribers, editions, and send history.
          </p>
        </div>
        <button
          onClick={() => setTab("compose")}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-sm transition-colors"
        >
          <Plus className="w-4 h-4" />New Edition
        </button>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Total",         value: stats.total,        color: "#f59e0b", bg: "#fef3c7" },
          { label: "Active",        value: stats.active,       color: "#10b981", bg: "#d1fae5" },
          { label: "Unsubscribed",  value: stats.unsubscribed, color: "#94a3b8", bg: "#f1f5f9" },
          { label: "Bounced",       value: stats.bounced,      color: "#ef4444", bg: "#fee2e2" },
          { label: "Last 30 days",  value: `+${stats.last30d}`, color: "#8b5cf6", bg: "#ede9fe" },
          { label: "Last 7 days",   value: `+${stats.last7d}`,  color: "#3b82f6", bg: "#dbeafe" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-stone-100 rounded-sm p-4"
          >
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
              <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-sm">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Growth chart */}
          <div className="xl:col-span-2 bg-white border border-stone-100 rounded-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-stone-700">Subscriber Growth — Last 30 Days</h2>
              <span className="text-xs text-stone-400">
                +{stats.last30d} this month
              </span>
            </div>
            <div className="flex items-end gap-[3px] h-32">
              {growth.map((d, i) => {
                const max = Math.max(...growth.map((g) => g.count), 1);
                const h   = Math.max(2, (d.count / max) * 120);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-sm bg-amber-400 hover:bg-amber-500 transition-colors cursor-default"
                      style={{ height: h }}
                      title={`${d.date}: +${d.count}`}
                    />
                    {/* tooltip */}
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] bg-stone-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      +{d.count}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-stone-300">
              <span>{growth[0]?.date}</span>
              <span>{growth[growth.length - 1]?.date}</span>
            </div>
          </div>

          {/* Sources + recent editions */}
          <div className="space-y-4">
            {/* Sources */}
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <h2 className="text-sm font-black text-stone-700 mb-4">Subscriber Sources</h2>
              <div className="space-y-2.5">
                {sources.length === 0 && (
                  <p className="text-xs text-stone-400">No data yet.</p>
                )}
                {sources.map((s) => {
                  const pct = stats.active > 0 ? Math.round((s.count / stats.active) * 100) : 0;
                  return (
                    <div key={s.source}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-stone-600 capitalize font-medium">{s.source}</span>
                        <span className="text-stone-400">{s.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Latest edition stats */}
            {editions[0] && (
              <div className="bg-white border border-stone-100 rounded-sm p-5">
                <h2 className="text-sm font-black text-stone-700 mb-1">Latest Edition</h2>
                <p className="text-xs text-stone-400 mb-3">#{editions[0].issueNumber} — {editions[0].title}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Recipients", value: editions[0].recipientCount || "—" },
                    { label: "Open rate",  value: editions[0].sentAt ? `${openRate(editions[0])}%` : "—" },
                    { label: "Click rate", value: editions[0].sentAt ? `${clickRate(editions[0])}%` : "—" },
                  ].map((m) => (
                    <div key={m.label} className="bg-stone-50 rounded-sm p-2.5">
                      <p className="text-base font-black text-stone-900">{m.value}</p>
                      <p className="text-[10px] text-stone-400">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: SUBSCRIBERS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "subscribers" && (
        <div className="space-y-4">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
              <input
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                placeholder="Search email or name..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
              />
            </div>

            {/* Status filter */}
            <select
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value as "ALL" | "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED")}
              className="text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 bg-white text-stone-700"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
              <option value="BOUNCED">Bounced</option>
            </select>

            {/* Bulk actions (when selected) */}
            {selected.size > 0 && (
              <button
                onClick={handleBulkUnsubscribe}
                className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2.5 rounded-sm transition-colors flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                Unsubscribe {selected.size} selected
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-300 px-3 py-2.5 rounded-sm transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />Export CSV
              </button>
              <button
                onClick={handleRefreshSubscribers}
                disabled={subLoading}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 border border-stone-200 px-3 py-2.5 rounded-sm transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${subLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={() => setAddOpen(true)}
                className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-2.5 rounded-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />Add
              </button>
            </div>
          </div>

          {/* Add subscriber form */}
          <AnimatePresence>
            {addOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleAddSubscriber}
                  className="bg-amber-50 border border-amber-100 rounded-sm p-4 flex flex-wrap items-end gap-3"
                >
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-[11px] font-black text-stone-500 uppercase tracking-wider block mb-1">Email *</label>
                    <input
                      type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                      required placeholder="subscriber@email.com"
                      className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[11px] font-black text-stone-500 uppercase tracking-wider block mb-1">First name</label>
                    <input
                      value={addName} onChange={(e) => setAddName(e.target.value)}
                      placeholder="Optional"
                      className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit" disabled={addLoading}
                      className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {addLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add subscriber
                    </button>
                    <button
                      type="button" onClick={() => { setAddOpen(false); setAddMsg(null); }}
                      className="text-xs font-semibold text-stone-500 hover:text-stone-800 border border-stone-200 px-3 py-2 rounded-sm"
                    >
                      Cancel
                    </button>
                  </div>
                  {addMsg && (
                    <div className={`w-full flex items-center gap-2 text-xs font-medium ${addMsg.ok ? "text-emerald-700" : "text-red-600"}`}>
                      {addMsg.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {addMsg.text}
                    </div>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subscriber count */}
          <p className="text-xs text-stone-400">
            Showing <strong className="text-stone-700">{filteredSubs.length}</strong> of{" "}
            <strong className="text-stone-700">{subscriberTotal}</strong> subscribers
          </p>

          {/* Table */}
          <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="text-left px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selected.size === filteredSubs.length && filteredSubs.length > 0}
                        onChange={(e) =>
                          setSelected(e.target.checked ? new Set(filteredSubs.map((s) => s.id)) : new Set())
                        }
                        className="rounded"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Source</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Subscribed</th>
                    <th className="text-right px-4 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-sm text-stone-400">
                        {subSearch ? `No subscribers matching "${subSearch}"` : "No subscribers yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(sub.id)}
                            onChange={(e) => {
                              const n = new Set(selected);
                              if (e.target.checked) {
                                n.add(sub.id);
                              } else {
                                n.delete(sub.id);
                              }
                              setSelected(n);
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-[11px] font-bold text-stone-500 flex-shrink-0">
                              {sub.email[0].toUpperCase()}
                            </div>
                            <span className="text-stone-800 font-medium">{sub.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-stone-500">{sub.firstName ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-stone-400 capitalize">{sub.source ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-stone-400 text-xs">{fmtDate(sub.subscribedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {sub.status !== "ACTIVE" && (
                              <button
                                onClick={() => handleStatusChange(sub.id, "ACTIVE")}
                                title="Re-activate"
                                className="w-7 h-7 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-sm transition-colors"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {sub.status === "ACTIVE" && (
                              <button
                                onClick={() => handleStatusChange(sub.id, "UNSUBSCRIBED")}
                                title="Unsubscribe"
                                className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-100 rounded-sm transition-colors"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                              title="Delete"
                              className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-sm transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: EDITIONS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "editions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">
              <strong className="text-stone-800">{editionTotal}</strong> editions total
            </p>
            <button
              onClick={() => setTab("compose")}
              className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-2 rounded-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />New edition
            </button>
          </div>

          {/* Send result toast */}
          <AnimatePresence>
            {sendResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    Sent to {sendResult.sent} subscribers
                    {sendResult.failed > 0 && ` (${sendResult.failed} failed)`}
                  </span>
                </div>
                <button onClick={() => setSendResult(null)} className="text-emerald-500 hover:text-emerald-800">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="text-left px-5 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Recipients</th>
                  <th className="text-left px-5 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Open rate</th>
                  <th className="text-left px-5 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Click rate</th>
                  <th className="text-left px-5 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Sent</th>
                  <th className="text-right px-5 py-3 text-[11px] font-black text-stone-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {editions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-sm text-stone-400">
                      No editions yet.{" "}
                      <button onClick={() => setTab("compose")} className="text-amber-600 font-semibold hover:underline">
                        Compose your first one.
                      </button>
                    </td>
                  </tr>
                ) : (
                  editions.map((ed) => (
                    <tr key={ed.id} className="hover:bg-stone-50/40 transition-colors group">
                      <td className="px-5 py-4 font-mono text-stone-400 text-xs">#{ed.issueNumber}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-stone-800 leading-tight">{ed.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5 truncate max-w-xs">{ed.preview}</p>
                      </td>
                      <td className="px-5 py-4">
                        {ed.sentAt ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">Sent</span>
                        ) : (
                          <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-sm">Draft</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-stone-600">{ed.recipientCount || "—"}</td>
                      <td className="px-5 py-4 text-stone-600">{ed.sentAt ? `${openRate(ed)}%` : "—"}</td>
                      <td className="px-5 py-4 text-stone-600">{ed.sentAt ? `${clickRate(ed)}%` : "—"}</td>
                      <td className="px-5 py-4 text-xs text-stone-400">
                        {ed.sentAt ? fmtDate(ed.sentAt) : fmtDate(ed.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!ed.sentAt && (
                            <button
                              onClick={() => handleSendEdition(ed.id)}
                              disabled={sendingId === ed.id}
                              title="Send to all subscribers"
                              className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-stone-900 hover:bg-stone-700 px-2.5 py-1.5 rounded-sm transition-colors disabled:opacity-60"
                            >
                              {sendingId === ed.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Send className="w-3 h-3" />}
                              Send
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEdition(ed.id, ed.title)}
                            title="Delete"
                            className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-sm transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: COMPOSE
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "compose" && (
        <div className="max-w-3xl space-y-5">
          <div className="bg-white border border-stone-100 rounded-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-stone-700">
                New Edition — Issue #{nextIssueNumber}
              </h2>
              {compSaved && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"
                >
                  <Check className="w-3.5 h-3.5" />Saved as draft
                </motion.span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black text-stone-500 uppercase tracking-wider block mb-1.5">
                  Subject / Title *
                </label>
                <input
                  value={compTitle}
                  onChange={(e) => {
                    setCompTitle(e.target.value);
                    if (!compSlug) {
                      setCompSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                    }
                  }}
                  placeholder="e.g. The Leapfrog Pattern — Issue #49"
                  className="w-full text-sm border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-stone-500 uppercase tracking-wider block mb-1.5">
                  Slug (URL)
                </label>
                <input
                  value={compSlug}
                  onChange={(e) => setCompSlug(e.target.value)}
                  placeholder="the-leapfrog-pattern-issue-49"
                  className="w-full text-sm border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-stone-500 uppercase tracking-wider block mb-1.5">
                  Preview text * <span className="font-normal text-stone-300 normal-case">(shown in email client before opening)</span>
                </label>
                <input
                  value={compPreview}
                  onChange={(e) => setCompPreview(e.target.value)}
                  placeholder="One line that makes people want to open the email..."
                  maxLength={150}
                  className="w-full text-sm border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-stone-300 mt-1">{compPreview.length}/150</p>
              </div>

              <div>
                <label className="text-[11px] font-black text-stone-500 uppercase tracking-wider block mb-1.5">
                  Content * <span className="font-normal text-stone-300 normal-case">(Markdown or plain text — Tiptap editor coming next)</span>
                </label>
                <textarea
                  value={compContent}
                  onChange={(e) => setCompContent(e.target.value)}
                  placeholder="Write your newsletter content here..."
                  rows={16}
                  className="w-full text-sm border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-amber-400 font-mono resize-y"
                />
              </div>
            </div>

            {/* Preview panel */}
            {(compTitle || compContent) && (
              <div className="border border-stone-100 rounded-sm overflow-hidden">
                <div className="bg-stone-50 border-b border-stone-100 px-4 py-2.5 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs font-bold text-stone-500">Email preview</span>
                </div>
                <div className="p-5 bg-white">
                  <div className="border-b-2 border-amber-400 pb-3 mb-4">
                    <p className="text-lg font-black text-stone-900">The Signal</p>
                    <p className="text-xs text-stone-400">Issue #{nextIssueNumber}</p>
                  </div>
                  {compTitle && <h2 className="text-base font-black text-stone-900 mb-2">{compTitle}</h2>}
                  {compPreview && <p className="text-sm text-stone-500 mb-3 italic">{compPreview}</p>}
                  {compContent && (
                    <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed line-clamp-6">
                      {compContent}
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-[10px] text-stone-300">
                      Sent to {stats.active.toLocaleString()} active subscribers ·{" "}
                      <span className="underline">Unsubscribe</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
              <button
                onClick={handleSaveDraft}
                disabled={!compTitle || !compPreview || !compContent || compSaving}
                className="flex items-center gap-2 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 px-5 py-2.5 rounded-sm transition-colors disabled:opacity-50"
              >
                {compSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Save as draft
              </button>
              <p className="text-xs text-stone-400">
                Saved editions appear in the Editions tab where you can send them.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}