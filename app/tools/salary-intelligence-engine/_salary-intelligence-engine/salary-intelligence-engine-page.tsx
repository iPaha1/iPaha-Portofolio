"use client";

// =============================================================================
// isaacpaha.com — Salary Intelligence Engine — Dashboard + Page Shell
// Combined file: dashboard + page exports
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// app/tools/salary-intelligence-engine/_salary-intelligence/salary-dashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import Link                    from "next/link";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  DollarSign, Star, Trash2, Loader2, ChevronDown, ChevronUp,
  RefreshCw, Check, TrendingUp, Target, Flame, Edit2, Save,
  ArrowRight, ArrowLeft, Share2, BookOpen, MessageSquare,
  Users, Clock, CheckCircle2, AlertTriangle, Zap, BarChart2,
  Scale, Sparkles, Info, Award, ExternalLink, ChevronRight,
} from "lucide-react";
import { ToolCard }            from "../../_tools/tools-card";
import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter }           from "next/navigation";
import type { NormalisedTool } from "../../_tools/tools-lab-client";
import { ToolViewTracker }     from "../../_tools/tool-view-tracker";
import { ToolReviews }         from "../../_tools/tool-reviews";
import { SalaryIntelligenceTool, TokenGateInfo } from "./salary-intelligence-engine-tool";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalaryCheck {
  id:               string;
  jobTitle:         string;
  industry:         string;
  location:         string;
  currentSalary:    number;
  currency:         string;
  verdict?:         string | null;
  marketMedian?:    number | null;
  gapAmount?:       number | null;
  gapPercent?:      number | null;
  status:           string;
  isStarred:        boolean;
  notes?:           string | null;
  createdAt:        string;
  negotiations:     any[];
}

interface Progress {
  totalChecks:       number;
  totalNegotiations: number;
  successfulRaises:  number;
  totalRaiseAmount:  number;
  streakDays:        number;
  xpPoints:          number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#14b8a6";

const VERDICT_CFG: Record<string, { label: string; color: string; emoji: string }> = {
  SIGNIFICANTLY_UNDERPAID: { label: "Significantly Underpaid", color: "#dc2626", emoji: "🚨" },
  UNDERPAID:               { label: "Underpaid",               color: "#f97316", emoji: "⚠️"  },
  FAIRLY_PAID:             { label: "Fairly Paid",             color: "#14b8a6", emoji: "✅"  },
  WELL_PAID:               { label: "Well Paid",               color: "#10b981", emoji: "💪"  },
  EXCEPTIONALLY_PAID:      { label: "Exceptionally Paid",      color: "#8b5cf6", emoji: "🏆"  },
};

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  DRAFT:            { label: "Draft",             color: "#6b7280" },
  SAVED:            { label: "Saved",             color: "#3b82f6" },
  ACTING_ON_IT:     { label: "Acting on it",      color: "#f59e0b" },
  NEGOTIATED:       { label: "Negotiated",        color: "#8b5cf6" },
  OUTCOME_RECORDED: { label: "Outcome recorded",  color: "#10b981" },
};

const fmtRel = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// ─── Salary Check Card ────────────────────────────────────────────────────────

function SalaryCheckCard({ check, onDelete, onReopen }: { check: SalaryCheck; onDelete: (id: string) => void; onReopen?: (check: SalaryCheck) => void }) {
  const [expanded,    setExpanded]    = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note,        setNote]        = useState(check.notes ?? "");
  const [savingNote,  setSavingNote]  = useState(false);
  const [status,      setStatus]      = useState(check.status);
  const [isStarred,   setIsStarred]   = useState(check.isStarred);
  const [outcome,     setOutcome]     = useState("");
  const [showOutcome, setShowOutcome] = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  

  const sym     = check.currency === "USD" ? "$" : check.currency === "EUR" ? "€" : "£";
  const verdict = VERDICT_CFG[check.verdict ?? "FAIRLY_PAID"] ?? VERDICT_CFG.FAIRLY_PAID;

  const patch = async (action: string, data: any) => {
    await fetch(`/api/tools/salary-intelligence/save?id=${check.id}&action=${action}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).catch(() => {});
  };

  const toggleStar = async () => { const n = !isStarred; setIsStarred(n); await patch("star", { isStarred: n }); };
  const updateStatus = async (s: string) => { setStatus(s); await patch("status", { status: s }); };
  const saveNote = async () => { setSavingNote(true); await patch("notes", { notes: note }); setSavingNote(false); setEditingNote(false); };
  const saveOutcome = async () => { await patch("outcome", { outcome }); setShowOutcome(false); setStatus("OUTCOME_RECORDED"); };
  const handleDelete = async () => { setDeleting(true); await fetch(`/api/tools/salary-intelligence/save?id=${check.id}`, { method: "DELETE" }); onDelete(check.id); };

  const STATUSES = ["SAVED", "ACTING_ON_IT", "NEGOTIATED", "OUTCOME_RECORDED"] as const;

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${verdict.color}12` }}>
            {verdict.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black" style={{ color: verdict.color }}>{verdict.label}</span>
              {check.gapAmount != null && (
                <span className={`text-[10px] font-black ${check.gapAmount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {check.gapAmount >= 0 ? "+" : ""}{sym}{Math.abs(check.gapAmount).toLocaleString()} vs market
                </span>
              )}
            </div>
            <p className="text-sm font-black text-stone-900 leading-snug">{check.jobTitle}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              {sym}{check.currentSalary.toLocaleString()} · {check.location || check.industry || "—"} · {fmtRel(check.createdAt)}
            </p>
          </div>
          <button onClick={toggleStar}
            className={`w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0 ${isStarred ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}>
            <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {/* Status pipeline */}
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {STATUSES.map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} onClick={() => updateStatus(s)}
                className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-sm border transition-all ${
                  status === s ? "text-white border-transparent" : "bg-white text-stone-400 border-stone-200 hover:border-stone-400"
                }`}
                style={status === s ? { backgroundColor: cfg.color } : {}}>
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Less" : "Notes & Outcome"}
          </button>
          <button onClick={() => setShowOutcome(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-3 py-2 rounded-sm transition-colors">
            <Award className="w-3.5 h-3.5" />Record Outcome
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="ml-auto text-stone-300 hover:text-red-400 transition-colors">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showOutcome && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-teal-100 bg-teal-50 px-4 py-4">
              <p className="text-[10px] font-black text-teal-700 uppercase tracking-wider mb-2">What happened?</p>
              <textarea value={outcome} onChange={e => setOutcome(e.target.value)} rows={2}
                placeholder="e.g. Got £4,000 raise, starting March. Manager agreed immediately."
                className="w-full text-xs border border-teal-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-teal-400 bg-white resize-none mb-2" />
              <button onClick={saveOutcome}
                className="text-xs font-bold text-white px-3 py-1.5 rounded-sm" style={{ backgroundColor: ACCENT }}>
                Save Outcome
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 bg-stone-50/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Notes</p>
                <button onClick={() => setEditingNote(p => !p)} className="text-[10px] text-stone-400 hover:text-stone-700 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" />{editingNote ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingNote ? (
                <div className="flex gap-2">
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                    placeholder="Notes about this check…"
                    className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-teal-400 resize-none" />
                  <button onClick={saveNote} disabled={savingNote}
                    className="flex flex-col items-center gap-1 text-[10px] font-bold px-2 py-2 rounded-sm text-white disabled:opacity-60"
                    style={{ backgroundColor: ACCENT }}>
                    {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                  </button>
                </div>
              ) : <p className="text-xs text-stone-500 italic">{note || "No notes yet."}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── SALARY DASHBOARD ─────────────────────────────────────────────────────────

interface SalaryDashboardProps {
  onReopenCheck?: (check: SalaryCheck) => void;
}

export function SalaryDashboard({ onReopenCheck }: SalaryDashboardProps) {
  const [checks,   setChecks]   = useState<SalaryCheck[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all" | "starred" | "acting">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/salary-intelligence/save");
      const data = await res.json();
      setChecks(data.checks ?? []);
      setProgress(data.progress ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string) => setChecks(p => p.filter(c => c.id !== id));

  const filtered = checks.filter(c => {
    if (filter === "starred") return c.isStarred;
    if (filter === "acting")  return c.status === "ACTING_ON_IT";
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {(progress || checks.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Salary Checks",    value: checks.length,                                    icon: BarChart2, color: ACCENT    },
            { label: "Raises Won",       value: progress?.successfulRaises ?? 0,                  icon: TrendingUp,color: "#10b981" },
            { label: "Extra Earned",     value: progress?.totalRaiseAmount ? `£${Math.round(progress.totalRaiseAmount / 1000)}k` : "£0", icon: DollarSign, color: "#f59e0b" },
            { label: "Day Streak",       value: progress?.streakDays ?? 0,                        icon: Flame,     color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-stone-400 font-semibold mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {checks.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1">
            {([
              { id: "all",     label: `All (${checks.length})`                            },
              { id: "acting",  label: `Acting On (${checks.filter(c => c.status === "ACTING_ON_IT").length})` },
              { id: "starred", label: "⭐ Starred"                                         },
            ] as const).map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
                  filter === f.id ? "text-white border-transparent" : "bg-white text-stone-400 border-stone-200"
                }`}
                style={filter === f.id ? { backgroundColor: ACCENT } : {}}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      )}

      {/* Empty state */}
      {checks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-sm bg-stone-50">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-base font-black text-stone-900 mb-2">No salary checks yet</h3>
          <p className="text-sm text-stone-500 max-w-xs">Run a salary check and save it to track your negotiation progress here.</p>
        </div>
      )}

      <AnimatePresence>
        {filtered.map(c => <SalaryCheckCard 
                                key={c.id} check={c} 
                                onDelete={handleDelete}
                                onReopen={onReopenCheck}
                             />
                             )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SHELL
// app/tools/salary-intelligence-engine/_salary-intelligence/salary-intelligence-page.tsx
// ─────────────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Enter your job and salary", desc: "Your job title, location, industry, years of experience, and current salary. Add benefits and skills for a more precise analysis." },
  { step: "02", title: "Get your honest verdict", desc: "You'll see whether you're underpaid, fairly paid, or well paid — with a precise salary bar showing where you sit vs the 10th, 50th, and 90th percentiles." },
  { step: "03", title: "Explore market data", desc: "See salary breakdowns by experience level, company type, and location. Understand exactly what skills would boost your pay and by how much." },
  { step: "04", title: "Build your negotiation script", desc: "The Negotiation Script Builder writes you a word-for-word opening, value statement, the ask, objection handlers, email version, and a psychology guide — tailored to your manager and situation." },
  { step: "05", title: "Act and track the outcome", desc: "Follow the action plan, save your check, update the status as you act on it, and record the outcome when you get your raise." },
];

function ReadingProgress({ accentColor }: { accentColor: string }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const e = document.documentElement; setW(Math.min(100, (e.scrollTop / (e.scrollHeight - e.clientHeight)) * 100)); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full transition-[width] duration-100" style={{ width: `${w}%`, backgroundColor: accentColor }} /></div>;
}

interface SalaryIntelligencePageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;
  relatedTools: NormalisedTool[];
}

export function SalaryIntelligencePage({ isSignedIn, tool, relatedTools }: SalaryIntelligencePageProps) {
  const [activeTab,  setActiveTab]  = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
  const [copied,     setCopied]     = useState(false);
  const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);
  const router = useRouter();
  const [reopenCheck, setReopenCheck] = useState<any | null>(null);


  const CATEGORY_CFG: Record<string, { icon: string; color: string }> = {
    AI:           { icon: "🤖", color: "#f59e0b" },
    CAREER:       { icon: "💼", color: "#ec4899" },
    FINANCE:      { icon: "💰", color: "#14b8a6" },
    STARTUP:      { icon: "🚀", color: "#10b981" },
    EDUCATION:    { icon: "📚", color: "#8b5cf6" },
    PRODUCTIVITY: { icon: "⚡", color: "#14b8a6" },
    WRITING:      { icon: "✍️", color: "#3b82f6" },
    OTHER:        { icon: "🔧", color: "#6b7280" },
  };

  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "💰", color: "#14b8a6" };
  const ACCENT  = tool.accentColor;

  const TABS = [
    { id: "tool",      label: "Check My Salary",  icon: Sparkles    },
    ...(isSignedIn ? [{ id: "workspace" as const, label: "My Checks", icon: TrendingUp }] : []),
    { id: "guide",     label: "How It Works",     icon: BookOpen    },
    { id: "reviews",   label: "Reviews",          icon: MessageSquare },
  ] as const satisfies readonly { id: "tool" | "workspace" | "guide" | "reviews"; label: string; icon: any }[];

  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress accentColor={ACCENT} />
      <ToolViewTracker toolId={tool.id} />

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.04] pointer-events-none"
        style={{ backgroundColor: ACCENT }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: tool.name, href: "#" }].map((bc, i) => (
            <React.Fragment key={bc.label}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              {bc.href === "#" ? <span className="text-gray-600 font-medium">{bc.label}</span>
                : <Link href={bc.href} className="hover:text-gray-700 transition-colors">{bc.label}</Link>}
            </React.Fragment>
          ))}
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
                style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
                {tool.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: catCfg.color }}>{catCfg.icon} {tool.category}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border"
                    style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
                  </span>
                  {tool.isNew && <span className="text-[9px] font-black tracking-widest uppercase text-white px-2 py-0.5 rounded-xs" style={{ backgroundColor: ACCENT }}>NEW</span>}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{tool.name}</h1>
              </div>
            </div>

            <div className="bg-stone-900 text-white rounded-xs px-5 py-4 mb-5">
              <p className="text-base font-black leading-tight mb-1">Are you being underpaid?</p>
              <p className="text-sm text-white/65 leading-relaxed">
                Most people have no idea what they're worth. They accept whatever they're given, avoid the conversation, and lose <span className="text-teal-400 font-semibold">thousands of pounds every year</span> as a result. This tool tells you the truth — and gives you everything you need to do something about it.
              </p>
            </div>

            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{tool.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              {tool.usageCount > 0 && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" style={{ color: ACCENT }} />{tool.usageCount.toLocaleString()} checks run</span>}
              {tool.ratingCount > 0 && <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{tool.ratingAvg.toFixed(1)} ({tool.ratingCount} reviews)</span>}
              {tool.buildTime && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{tool.buildTime}</span>}
              {tool.tokenCost ? (
                <span className="flex items-center gap-1.5 font-semibold text-amber-600">🪙 {tool.tokenCost} tokens per check</span>
              ) : (
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: ACCENT }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Free
                </span>
              )}
            </div>

            {tool.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tool.features.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                    <Check className="w-3 h-3" style={{ color: ACCENT }} />{f}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: ACCENT }}>
                <Sparkles className="w-4 h-4" />Check My Salary
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs transition-colors border"
                  style={{ color: ACCENT, borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}08` }}>
                  <TrendingUp className="w-4 h-4" />My Checks
                </button>
              )}
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block">
            <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>What You Get</p>
              <div className="space-y-3">
                {[
                  { emoji: "📊", label: "Underpaid verdict",     desc: "Precisely where you sit vs market"         },
                  { emoji: "📈", label: "Salary bar visualiser", desc: "10th / 50th / 90th percentile mapped"      },
                  { emoji: "🏢", label: "Salary by company type",desc: "Startup vs corporate vs Big Tech"          },
                  { emoji: "📍", label: "Location premiums",      desc: "What your salary would be elsewhere"      },
                  { emoji: "🎯", label: "Total compensation",     desc: "Benefits valued in real money"            },
                  { emoji: "⚡", label: "Skill premiums",         desc: "Which skills add the most salary"         },
                  { emoji: "📅", label: "10-year earnings map",   desc: "What you'll earn if you act vs don't"     },
                  { emoji: "💬", label: "Negotiation script",     desc: "Word-for-word, email + objection handlers"},
                  { emoji: "📋", label: "Job offer analyser",     desc: "Should I accept? Counter how much?"       },
                  { emoji: "✅", label: "Action plan",            desc: "This week / 1-3 months / 3-12 months"     },
                ].map(s => (
                  <div key={s.label} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{s.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-stone-800">{s.label}</p>
                      <p className="text-[11px] text-stone-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id ? "text-gray-900 border-current" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
              style={activeTab === t.id ? { borderColor: ACCENT, color: ACCENT } : {}}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
                    style={{ backgroundColor: `${ACCENT}06` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tool.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{tool.name}</p>
                        <p className="text-xs text-gray-400">{tool.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs border"
                      style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <SalaryIntelligenceTool 
                        isSignedIn={isSignedIn} 
                        onInsufficientTokens={(info) => setTokenModal(info)}
                        reopenCheck={reopenCheck}
                        onReopened={() => setReopenCheck(null)}
                        />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-blue-50 border border-blue-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Salary data is based on AI analysis of current market trends. Always verify with platforms like LinkedIn Salary, Glassdoor, and ITJobsWatch before making career decisions.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn ? <SalaryDashboard 
                                onReopenCheck={(check) => {
                                setReopenCheck(check);
                                setActiveTab("tool");
                                }}
                        /> : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                    <div className="text-4xl mb-4">{tool.icon}</div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to track your checks</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-5">Save salary checks, track negotiations, and record outcomes.</p>
                    <Link href="/sign-in?redirect_url=/tools/salary-intelligence-engine"
                      className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs"
                      style={{ backgroundColor: ACCENT }}>Sign in — it's free</Link>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the {tool.name}</h2>
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={s.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10 text-white"
                      style={{ backgroundColor: ACCENT }}>{s.step}</div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="border rounded-xs p-6" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: "#134e4a" }}>💡 Getting the most out of it</h3>
                  <ul className="space-y-2">
                    {[
                      "Include your benefits — pension, health insurance, and remote work have real monetary value that changes your picture significantly.",
                      "The 'Analyse Offer' mode is the most underrated — use it any time you get a new offer, even if you're not actively job searching.",
                      "Add your specific fears to the Negotiation Script Builder. The objection handlers it writes are tailored to your exact worries.",
                      "Record the outcome even if you didn't get what you asked for. Patterns emerge and the data helps with the next negotiation.",
                      "Run the career path mode every year. Your 10-year earnings are directly shaped by the decisions you make this year.",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm" style={{ color: "#134e4a" }}>
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ToolReviews toolId={tool.id} toolName={tool.name} accentColor={ACCENT} isSignedIn={isSignedIn} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${
                      activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"
                    }`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              {/* The cost of not negotiating */}
              <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}05`, borderColor: `${ACCENT}20` }}>
                <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>The cost of staying silent</p>
                {[
                  { text: "The average underpaid professional loses £8,000–£15,000 per year vs market rate", color: "#ef4444" },
                  { text: "Over 5 years, that's £40,000–£75,000 in forgone earnings",                        color: "#f97316" },
                  { text: "70% of people who ask for a raise receive one — most people just never ask",       color: "#f59e0b" },
                  { text: "The best time to negotiate is always when you have leverage — this tool helps you find it", color: ACCENT },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#134e4a" }}>{s.text}</p>
                  </div>
                ))}
              </div>

              {relatedTools.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More {tool.category} Tools</p>
                  <div className="space-y-3">
                    {relatedTools.map(t => (
                      <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/tools" className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xs transition-all">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />All Tools
              </Link>
            </div>
          </aside>
        </div>

        {relatedTools.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">More {tool.category} Tools</h2>
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedTools.map(t => <ToolCard key={t.id} tool={t} />)}
            </div>
          </div>
        )}
      </div>

      <InsufficientTokensModal
        open={!!tokenModal} onClose={() => setTokenModal(null)}
        required={tokenModal?.required ?? 0} balance={tokenModal?.balance ?? 0}
        toolName={tokenModal?.toolName ?? undefined}
        onPlayGame={() => { setTokenModal(null); router.push("/games"); }}
      />
    </div>
  );
}