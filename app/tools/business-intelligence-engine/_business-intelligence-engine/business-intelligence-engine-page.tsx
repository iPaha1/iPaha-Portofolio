"use client";

// =============================================================================
// isaacpaha.com — Business Intelligence Engine — Page Shell + Dashboard
// app/tools/business-intelligence-engine/_business-intelligence/business-intelligence-page.tsx
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link                     from "next/link";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  Rocket, Star, Trash2, Loader2, ChevronDown, ChevronUp,
  RefreshCw, Check, TrendingUp, Zap, Flame, Edit2, Save,
  ArrowRight, ArrowLeft, Share2, BookOpen, MessageSquare,
  Users, Clock, BarChart2, Sparkles, Info, FileText,
  ChevronRight, Building2, DollarSign, Scale, Target,
} from "lucide-react";
import { ToolCard }             from "../../_tools/tools-card";
import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter }            from "next/navigation";
import type { NormalisedTool }  from "../../_tools/tools-lab-client";
import { ToolViewTracker }      from "../../_tools/tool-view-tracker";
import { ToolReviews }          from "../../_tools/tool-reviews";
import { BusinessIntelligenceTool, TokenGateInfo } from "../business-intelligence-engine-tool";

const ACCENT = "#10b981";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusinessIdea {
  id:               string;
  ideaName:         string;
  industry?:        string | null;
  businessModel:    string;
  stage:            string;
  validationScore?: number | null;
  validationVerdict?:string | null;
  planGenerated:    boolean;
  status:           string;
  isStarred:        boolean;
  notes?:           string | null;
  createdAt:        string;
  updatedAt:        string;
}

interface Workspace {
  totalIdeas:     number;
  validatedIdeas: number;
  completePlans:  number;
  launchedIdeas:  number;
  streakDays:     number;
  xpPoints:       number;
}

const VERDICT_COLORS: Record<string, string> = {
  STRONG_BUY: "#059669", BUY: "#10b981", HOLD: "#f59e0b", NEEDS_WORK: "#f97316", PIVOT_REQUIRED: "#ef4444",
};
const VERDICT_LABELS: Record<string, string> = {
  STRONG_BUY: "Strong Opportunity", BUY: "Good Opportunity", HOLD: "Proceed With Caution",
  NEEDS_WORK: "Significant Gaps", PIVOT_REQUIRED: "Pivot Required",
};
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  DRAFT:         { label: "Draft",          color: "#6b7280" },
  VALIDATED:     { label: "Validated",      color: "#3b82f6" },
  IN_PROGRESS:   { label: "In Progress",    color: "#f59e0b" },
  PLAN_COMPLETE: { label: "Plan Complete",  color: "#8b5cf6" },
  PITCHING:      { label: "Pitching",       color: "#ec4899" },
  LAUNCHED:      { label: "Launched!",      color: "#10b981" },
  ARCHIVED:      { label: "Archived",       color: "#6b7280" },
};

const fmtRel = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "today"; if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// ─── Idea Card ────────────────────────────────────────────────────────────────

function IdeaCard({ idea, onDelete, onReopen }: { idea: BusinessIdea; onDelete: (id: string) => void; onReopen?: (idea: BusinessIdea) => void }) {
  const [isStarred, setIsStarred] = useState(idea.isStarred);
  const [status,    setStatus]    = useState(idea.status);
  const [deleting,  setDeleting]  = useState(false);
  const vc  = VERDICT_COLORS[idea.validationVerdict ?? ""] ?? "#6b7280";
  const sc  = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;

  const patch = async (action: string, data: any) =>
    fetch(`/api/tools/business-intelligence/save?id=${idea.id}&action=${action}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).catch(() => {});

  const toggleStar    = async () => { const n = !isStarred; setIsStarred(n); await patch("star", { isStarred: n }); };
  const updateStatus  = async (s: string) => { setStatus(s); await patch("status", { status: s }); };
  const handleDelete  = async () => { setDeleting(true); await fetch(`/api/tools/business-intelligence/save?id=${idea.id}`, { method: "DELETE" }); onDelete(idea.id); };

  const PIPELINE = ["VALIDATED", "IN_PROGRESS", "PLAN_COMPLETE", "PITCHING", "LAUNCHED"] as const;

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${ACCENT}10` }}>🚀</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              {idea.validationVerdict && (
                <span className="text-[10px] font-black" style={{ color: vc }}>
                  {VERDICT_LABELS[idea.validationVerdict] ?? idea.validationVerdict}
                </span>
              )}
              {idea.validationScore != null && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm text-white"
                  style={{ backgroundColor: vc }}>{idea.validationScore}/100</span>
              )}
              {idea.planGenerated && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                  style={{ background: "#ede9fe", color: "#7c3aed" }}>Plan Ready</span>
              )}
            </div>
            <p className="text-sm font-black text-stone-900 leading-snug line-clamp-1">{idea.ideaName}</p>
            <p className="text-[10px] text-stone-300 mt-0.5">
              {idea.industry && `${idea.industry} · `}{idea.businessModel.replace(/_/g, " ")} · {fmtRel(idea.updatedAt)}
            </p>
          </div>
          <button onClick={toggleStar}
            className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${isStarred ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}>
            <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {/* Pipeline strip */}
        <div className="flex gap-0.5 mb-3 overflow-x-auto">
          {PIPELINE.map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} onClick={() => updateStatus(s)}
                className={`flex-shrink-0 text-[9px] font-black px-2.5 py-1 rounded-sm transition-all ${
                  status === s ? "text-white" : "bg-stone-50 text-stone-400 hover:bg-stone-100"
                }`}
                style={status === s ? { backgroundColor: cfg.color } : {}}>
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Add Reopen button */}
          {onReopen && (
            <button onClick={() => onReopen(idea)}
              className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm"
              style={{ backgroundColor: ACCENT }}>
              <Sparkles className="w-3.5 h-3.5" />Reopen
            </button>
          )}
          <span className="text-xs px-2 py-1 rounded-sm font-semibold"
            style={{ background: `${sc.color}12`, color: sc.color }}>{sc.label}</span>
          <button onClick={handleDelete} disabled={deleting} className="ml-auto text-stone-300 hover:text-red-400">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

interface BusinessDashboardProps {
  onReopenIdea?: (idea: BusinessIdea) => void;
}

function BusinessDashboard({ onReopenIdea }: BusinessDashboardProps) {
  const [ideas,     setIdeas]     = useState<BusinessIdea[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<"all" | "starred">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/business-intelligence/save");
      const data = await res.json();
      setIdeas(data.ideas ?? []); setWorkspace(data.workspace ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const handleDelete = (id: string) => setIdeas(p => p.filter(x => x.id !== id));
  const filtered = ideas.filter(i => filter === "starred" ? i.isStarred : true);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="space-y-6">
      {(workspace || ideas.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Ideas Explored",   value: ideas.length,                        icon: Rocket,      color: ACCENT    },
            { label: "Validated",        value: workspace?.validatedIdeas ?? 0,      icon: Scale,       color: "#3b82f6" },
            { label: "Plans Complete",   value: workspace?.completePlans ?? 0,       icon: FileText,    color: "#8b5cf6" },
            { label: "Launched",         value: workspace?.launchedIdeas ?? 0,       icon: TrendingUp,  color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-stone-400 font-semibold">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {ideas.length > 0 && (
        <div className="flex items-center gap-2">
          {([{ id: "all", label: `All (${ideas.length})` }, { id: "starred", label: "⭐ Starred" }] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`text-xs font-bold px-3 py-2 rounded-sm border ${filter === f.id ? "text-white border-transparent" : "bg-white text-stone-400 border-stone-200"}`}
              style={filter === f.id ? { backgroundColor: ACCENT } : {}}>
              {f.label}
            </button>
          ))}
          <button onClick={load} className="ml-auto flex items-center gap-1.5 text-xs text-stone-400"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
        </div>
      )}
      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-sm bg-stone-50">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-base font-black text-stone-900 mb-2">No ideas saved yet</h3>
          <p className="text-sm text-stone-500 max-w-xs">Validate a business idea and save it to track your pipeline here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>{filtered.map(i => <IdeaCard key={i.id} idea={i} onDelete={handleDelete} onReopen={onReopenIdea} />)}</AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Describe your idea", desc: "Give it a name, describe what it does, who it's for, and what problem it solves. Add your stage, business model, budget, and founder background for a sharper analysis." },
  { step: "02", title: "Choose your analysis mode", desc: "Full Validation scores your idea across 5 dimensions. Market Analysis gives you TAM/SAM/SOM with customer personas. Competitive Intel names real competitors and their weaknesses. Revenue Model builds your unit economics and 3-year projections." },
  { step: "03", title: "Get your honest verdict", desc: "You'll get a 0-100 score across Problem Strength, Market Opportunity, Competitive Landscape, Founder Fit, and Execution Difficulty. Plus the brutal honest talk — what a seasoned investor would actually think." },
  { step: "04", title: "Generate your business plan", desc: "Click 'Generate Full Business Plan' to get the complete investor-ready document: executive summary, market analysis, competitive landscape, GTM strategy, financial projections, risk analysis, and appendix. Or generate a pitch deck brief, financial model, operations plan, or go-to-market strategy individually." },
  { step: "05", title: "Track your idea to launch", desc: "Save ideas to your workspace. Move them through the pipeline: Validated → In Progress → Plan Complete → Pitching → Launched. Track your validation score, plan status, and idea history across sessions." },
];

function ReadingProgress({ accentColor }: { accentColor: string }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const e = document.documentElement; setW(Math.min(100, (e.scrollTop / Math.max(1, e.scrollHeight - e.clientHeight)) * 100)); };
    window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full" style={{ width: `${w}%`, backgroundColor: accentColor }} /></div>;
}

// ─── PAGE SHELL ───────────────────────────────────────────────────────────────

interface BusinessIntelligencePageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;
  relatedTools: NormalisedTool[];
}

export function BusinessIntelligencePage({ isSignedIn, tool, relatedTools }: BusinessIntelligencePageProps) {
  const [activeTab,  setActiveTab]  = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
  const [copied,     setCopied]     = useState(false);
  const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);
  const router = useRouter();
  const [reopenIdea, setReopenIdea] = useState<BusinessIdea | null>(null); 

  const ACCENT_L = tool.accentColor;

  const TABS = [
    { id: "tool",      label: "Analyse My Idea",  icon: Sparkles     },
    ...(isSignedIn ? [{ id: "workspace" as const, label: "My Ideas", icon: TrendingUp }] : []),
    { id: "guide",     label: "How It Works",     icon: BookOpen     },
    { id: "reviews",   label: "Reviews",          icon: MessageSquare },
  ] as const satisfies readonly { id: "tool" | "workspace" | "guide" | "reviews"; label: string; icon: any }[];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress accentColor={ACCENT_L} />
      <ToolViewTracker toolId={tool.id} />

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right,#000 1px,transparent 1px),linear-gradient(to bottom,#000 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.03] pointer-events-none" style={{ backgroundColor: ACCENT_L }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: tool.name, href: "#" }].map((bc, i) => (
            <React.Fragment key={bc.label}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              {bc.href === "#" ? <span className="text-gray-600 font-medium">{bc.label}</span>
                : <Link href={bc.href} className="hover:text-gray-700">{bc.label}</Link>}
            </React.Fragment>
          ))}
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
                style={{ backgroundColor: `${ACCENT_L}10`, borderColor: `${ACCENT_L}30` }}>
                {tool.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border"
                    style={{ color: ACCENT_L, backgroundColor: `${ACCENT_L}10`, borderColor: `${ACCENT_L}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT_L }} />Live
                  </span>
                  {tool.isNew && <span className="text-[9px] font-black tracking-widest uppercase text-white px-2 py-0.5 rounded-xs" style={{ backgroundColor: ACCENT_L }}>NEW</span>}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{tool.name}</h1>
              </div>
            </div>

            <div className="bg-stone-900 text-white rounded-xs px-5 py-4 mb-5">
              <p className="text-base font-black mb-1">From raw idea to investor-ready — in one session.</p>
              <p className="text-sm text-white/65 leading-relaxed">
                Stop spending weeks on a business plan only to realise the idea has fatal flaws. Get the honest validation first, then generate the complete plan — <span className="text-emerald-400 font-semibold">with real market data, named competitors, and actual financial projections.</span>
              </p>
            </div>

            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{tool.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              {tool.usageCount > 0 && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" style={{ color: ACCENT_L }} />{tool.usageCount.toLocaleString()} ideas validated</span>}
              {tool.ratingCount > 0 && <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{tool.ratingAvg.toFixed(1)} ({tool.ratingCount} reviews)</span>}
              {tool.tokenCost && <span className="font-semibold text-amber-600">🪙 {tool.tokenCost} tokens per analysis</span>}
            </div>

            {tool.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tool.features.map(f => (
                  <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                    <Check className="w-3 h-3" style={{ color: ACCENT_L }} />{f}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs shadow-sm"
                style={{ backgroundColor: ACCENT_L }}>
                <Sparkles className="w-4 h-4" />Validate My Idea
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs border"
                  style={{ color: ACCENT_L, borderColor: `${ACCENT_L}50`, backgroundColor: `${ACCENT_L}08` }}>
                  <TrendingUp className="w-4 h-4" />My Ideas
                </button>
              )}
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Sidebar: What you get */}
          <div className="hidden lg:block">
            <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT_L}06`, borderColor: `${ACCENT_L}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT_L }}>What You Get</p>
              <div className="space-y-3">
                {[
                  { emoji: "🎯", label: "5-dimension validation",  desc: "Problem, market, competition, founder, execution"  },
                  { emoji: "📊", label: "Real market sizing",       desc: "TAM/SAM/SOM with methodology"                     },
                  { emoji: "🔍", label: "Named competitors",        desc: "Who they are, their weaknesses, how to win"        },
                  { emoji: "💰", label: "Unit economics",           desc: "CAC, LTV, payback period, gross margin"            },
                  { emoji: "📋", label: "Full business plan",       desc: "Investor-ready document, all sections"             },
                  { emoji: "🎭", label: "Pitch deck brief",         desc: "12 slides with speaker notes + Q&A prep"           },
                  { emoji: "📈", label: "Financial model",          desc: "3-year projections, break-even, scenarios"         },
                  { emoji: "🗺️", label: "Go-to-market strategy",   desc: "Channels, first customers, launch sequence"        },
                  { emoji: "⚙️", label: "Operations plan",         desc: "First 90 days, team, systems, legal"               },
                  { emoji: "💬", label: "The honest talk",          desc: "What an investor would actually think"             },
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
                activeTab === t.id ? "border-current text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
              style={activeTab === t.id ? { borderColor: ACCENT_L, color: ACCENT_L } : {}}>
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
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: `${ACCENT_L}06` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tool.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{tool.name}</p>
                        <p className="text-xs text-gray-400">{tool.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs border"
                      style={{ color: ACCENT_L, backgroundColor: `${ACCENT_L}10`, borderColor: `${ACCENT_L}30` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT_L }} />Live
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <BusinessIntelligenceTool 
                      isSignedIn={isSignedIn} 
                      onInsufficientTokens={info => setTokenModal(info)}
                      reopenIdea={reopenIdea}
                      onReopened={() => setReopenIdea(null)}
                       />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-blue-50 border border-blue-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Market sizing, competitor data, and financial projections are AI-estimated based on industry patterns. Always verify with primary research before making significant investment decisions.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn ? (
                <BusinessDashboard 
                  onReopenIdea={(idea) => {
                    setReopenIdea(idea);
                    setActiveTab("tool");
                  }}
                />
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                    <div className="text-4xl mb-4">{tool.icon}</div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to track your ideas</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-5">Save ideas, track validation scores, and build your idea pipeline from concept to launch.</p>
                    <Link href="/sign-in?redirect_url=/tools/business-intelligence-engine"
                      className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs"
                      style={{ backgroundColor: ACCENT_L }}>Sign in — it's free</Link>
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
                      style={{ backgroundColor: ACCENT_L }}>{s.step}</div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="border rounded-xs p-6" style={{ backgroundColor: `${ACCENT_L}06`, borderColor: `${ACCENT_L}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: "#064e3b" }}>💡 Getting the most out of it</h3>
                  <ul className="space-y-2">
                    {[
                      "Add your founder background — the AI will tell you honestly whether your skills are right for this specific idea, not just generic encouragement.",
                      "Run validation before generating the plan. If the idea scores below 50, the honest talk will tell you exactly what to fix first.",
                      "The Competitive Intel mode is underrated. Paste your idea and get real named competitors — their Achilles heel, and exactly how to win their customers.",
                      "Export the financial model as JSON and rebuild it in a spreadsheet for investor meetings. The structure and assumptions are solid starting points.",
                      "Save every idea — even ones you shelve. Patterns emerge over time about what kind of opportunities you're best suited for.",
                    ].map(tip => (
                      <li key={tip} className="flex items-start gap-2 text-sm" style={{ color: "#064e3b" }}>
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT_L }} />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ToolReviews toolId={tool.id} toolName={tool.name} accentColor={ACCENT_L} isSignedIn={isSignedIn} />
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

              {/* Why most startups fail */}
              <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT_L}05`, borderColor: `${ACCENT_L}20` }}>
                <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT_L }}>Why most ideas fail</p>
                {[
                  { text: "90% of startups fail — most because of no market need", color: "#ef4444" },
                  { text: "Founders spend months building before validating demand", color: "#f97316" },
                  { text: "The competitive landscape is almost always misunderstood", color: "#f59e0b" },
                  { text: "Unit economics are rarely modelled until it's too late",  color: ACCENT_L   },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#064e3b" }}>{s.text}</p>
                  </div>
                ))}
              </div>

              {relatedTools.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Tools</p>
                  <div className="space-y-3">
                    {relatedTools.map(t => (
                      <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 shrink-0" />
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
              <h2 className="text-2xl font-black text-gray-900">More Tools</h2>
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">See all <ArrowRight className="w-4 h-4" /></Link>
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