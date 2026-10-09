"use client";

// =============================================================================
// isaacpaha.com — Prompt Architect — Page Shell + Dashboard (combined)
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link                     from "next/link";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  Wand2, Star, Trash2, Loader2, ChevronDown, ChevronUp,
  RefreshCw, Copy, Check, TrendingUp, Zap, Flame, Edit2,
  Save, ArrowRight, ArrowLeft, Share2, BookOpen, MessageSquare,
  Users, Clock, BarChart2, Sparkles, Info, Terminal,
  ChevronRight, Hash, Globe, Code,
  ExternalLink,
} from "lucide-react";
import { ToolCard }             from "../../_tools/tools-card";
import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter }            from "next/navigation";
import type { NormalisedTool }  from "../../_tools/tools-lab-client";
import { ToolViewTracker }      from "../../_tools/tool-view-tracker";
import { ToolReviews }          from "../../_tools/tool-reviews";
import { PromptArchitectTool, TokenGateInfo } from "./prompt-architect-tool";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromptProject {
  id:             string;
  rawIdea:        string;
  category:       string;
  targetModel:    string;
  title?:         string | null;
  generatedPrompt?:string | null;
  qualityScore?:  number | null;
  qualityLabel?:  string | null;
  isSaved:        boolean;
  isStarred:      boolean;
  useCount:       number;
  notes?:         string | null;
  tags?:          string | null;
  createdAt:      string;
  updatedAt:      string;
}

interface Workspace {
  totalGenerated:  number;
  totalScored:     number;
  totalCopied:     number;
  streakDays:      number;
  xpPoints:        number;
  categoriesJson:  string;
  modelsJson:      string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#f59e0b";

const CAT_EMOJI: Record<string, string> = {
  CODING_APP: "💻", WRITING_CONTENT: "✍️", IMAGE_GENERATION: "🎨", BUSINESS_STRATEGY: "📊",
  DATA_ANALYSIS: "📈", CREATIVE_FICTION: "📖", RESEARCH: "🔬", VIDEO_SCRIPT: "🎬",
  EDUCATION_TEACHING: "🎓", PRODUCTIVITY: "⚡", ROLEPLAY_PERSONA: "🎭", GENERAL: "✨",
};

const MODEL_EMOJI: Record<string, string> = {
  CLAUDE: "🔮", CHATGPT_GPT4: "🤖", GEMINI: "♊", MIDJOURNEY: "🎨",
  DALL_E: "🖼️", STABLE_DIFFUSION: "🌊", PERPLEXITY: "🔍", LLAMA: "🦙", ANY: "🌐",
};

const QUALITY_COLOR: Record<string, string> = {
  POOR: "#ef4444", BASIC: "#f97316", DECENT: "#f59e0b", STRONG: "#10b981", EXPERT: "#8b5cf6",
};

const fmtRel = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// ─── Prompt Card ──────────────────────────────────────────────────────────────

function PromptCard({ project, onDelete, onReopen }: { project: PromptProject; onDelete: (id: string) => void; onReopen?: (project: PromptProject) => void }) { 
  const [expanded,  setExpanded]  = useState(false);
  const [isStarred, setIsStarred] = useState(project.isStarred);
  const [copied,    setCopied]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal,  setTitleVal]  = useState(project.title ?? project.rawIdea.slice(0, 60));

  const patch = async (action: string, data: any) => {
    await fetch(`/api/tools/prompt-architect/save?id=${project.id}&action=${action}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).catch(() => {});
  };

  const toggleStar  = async () => { const n = !isStarred; setIsStarred(n); await patch("star", { isStarred: n }); };
  const copyPrompt  = async () => {
    navigator.clipboard.writeText(project.generatedPrompt ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    await patch("incrementCopy", {});
  };
  const saveTitle   = async () => { await patch("title", { title: titleVal }); setEditTitle(false); };
  const handleDelete= async () => { setDeleting(true); await fetch(`/api/tools/prompt-architect/save?id=${project.id}`, { method: "DELETE" }); onDelete(project.id); };

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}10` }}>
            {CAT_EMOJI[project.category] ?? "✨"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-[10px]">{MODEL_EMOJI[project.targetModel] ?? "🌐"}</span>
              <span className="text-[10px] text-stone-400 font-semibold">{project.targetModel.replace(/_/g, " ")}</span>
              {project.qualityScore != null && project.qualityLabel && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm text-white"
                  style={{ backgroundColor: QUALITY_COLOR[project.qualityLabel] ?? "#6b7280" }}>
                  {project.qualityScore}/100
                </span>
              )}
              <span className="text-[10px] text-stone-300">{fmtRel(project.updatedAt)}</span>
              {project.useCount > 0 && <span className="text-[10px] text-stone-300">copied {project.useCount}×</span>}
            </div>
            {editTitle ? (
              <div className="flex gap-1.5">
                <input value={titleVal} onChange={e => setTitleVal(e.target.value)}
                  className="flex-1 text-xs border border-stone-200 rounded-sm px-2 py-1 focus:outline-none focus:border-amber-400"
                  onKeyDown={e => e.key === "Enter" && saveTitle()} autoFocus />
                <button onClick={saveTitle} className="text-xs font-bold text-white px-2 py-1 rounded-sm" style={{ backgroundColor: ACCENT }}>Save</button>
                <button onClick={() => setEditTitle(false)} className="text-xs text-stone-400">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-stone-900 leading-snug line-clamp-1">
                  {project.title ?? project.rawIdea.slice(0, 80)}
                </p>
                <button onClick={() => setEditTitle(true)} className="text-stone-300 hover:text-stone-600 flex-shrink-0">
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <button onClick={toggleStar}
            className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${isStarred ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}>
            <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {project.generatedPrompt && (
          <div className="bg-stone-950 rounded-sm px-3 py-2.5 mb-3">
            <p className="text-xs text-amber-300 font-mono leading-relaxed line-clamp-2">{project.generatedPrompt}</p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
            {/* Add Reopen button */}
          {onReopen && (
            <button onClick={() => onReopen(project)}
              className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm"
              style={{ backgroundColor: ACCENT }}>
              <ExternalLink className="w-3.5 h-3.5" />Reopen
            </button>
          )}
          <button onClick={copyPrompt} disabled={!project.generatedPrompt}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm border transition-all ${
              copied ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-500 border-stone-200 hover:border-stone-400"
            }`}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Prompt"}
          </button>
          <button onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDelete} disabled={deleting} className="ml-auto text-stone-300 hover:text-red-400 transition-colors">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 space-y-3 bg-stone-50/30">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Original Idea</p>
                <p className="text-xs text-stone-600 italic">"{project.rawIdea}"</p>
              </div>
              {project.generatedPrompt && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Full Prompt</p>
                  <div className="bg-stone-950 rounded-sm px-3 py-3 font-mono text-xs text-amber-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {project.generatedPrompt}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Usage stats chart ────────────────────────────────────────────────────────

function UsageChart({ json, label, emojiMap }: { json: string; label: string; emojiMap: Record<string, string> }) {
  const items: any[] = React.useMemo(() => { try { return JSON.parse(json ?? "[]"); } catch { return []; } }, [json]);
  if (!items.length) return null;
  const key = Object.keys(items[0]).find(k => k !== "count") ?? "";
  const max = Math.max(...items.map((i: any) => i.count), 1);
  const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ec4899", "#8b5cf6", "#f97316"];
  return (
    <div className="bg-white border border-stone-100 rounded-sm p-5">
      <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">{label}</p>
      <div className="space-y-2.5">
        {[...items].sort((a: any, b: any) => b.count - a.count).slice(0, 5).map((item: any, i: number) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-700">
                {emojiMap[item[key]] ?? "📄"} {String(item[key]).replace(/_/g, " ")}
              </span>
              <span className="text-xs font-bold" style={{ color: COLORS[i % COLORS.length] }}>{item.count}×</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}
                initial={{ width: 0 }} animate={{ width: `${(item.count / max) * 100}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

interface PromptDashboardProps {
  onReopenProject?: (project: PromptProject) => void;
}

export function PromptDashboard({ onReopenProject }: PromptDashboardProps) {
  const [projects,  setProjects]  = useState<PromptProject[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<"all" | "starred">("all");
  const [search,    setSearch]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/prompt-architect/save");
      const data = await res.json();
      setProjects(data.projects ?? []);
      setWorkspace(data.workspace ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string) => setProjects(p => p.filter(x => x.id !== id));

  const filtered = projects.filter(p => {
    if (filter === "starred" && !p.isStarred) return false;
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) && !p.rawIdea.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {(workspace || projects.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Prompts Built",  value: workspace?.totalGenerated ?? projects.length, icon: Wand2,    color: ACCENT    },
            { label: "Times Copied",   value: workspace?.totalCopied ?? 0,                 icon: Copy,     color: "#3b82f6" },
            { label: "XP Points",      value: workspace?.xpPoints ?? 0,                    icon: Zap,      color: "#8b5cf6" },
            { label: "Day Streak",     value: workspace?.streakDays ?? 0,                  icon: Flame,    color: "#ef4444" },
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

      {/* Usage charts */}
      {workspace && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageChart json={workspace.categoriesJson} label="Top Categories" emojiMap={CAT_EMOJI} />
          <UsageChart json={workspace.modelsJson}     label="Models Used"    emojiMap={MODEL_EMOJI} />
        </div>
      )}

      {/* Filter + search */}
      {projects.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {([
              { id: "all",     label: `All (${projects.length})` },
              { id: "starred", label: "⭐ Starred"               },
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
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className="text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 flex-1 max-w-xs" />
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 ml-auto">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-sm bg-stone-50">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-base font-black text-stone-900 mb-2">No saved prompts yet</h3>
          <p className="text-sm text-stone-500 max-w-xs">Build a prompt and save it to build your personal prompt library here.</p>
        </div>
      )}

      <AnimatePresence>
        {filtered.map(p => <PromptCard key={p.id} project={p} onDelete={handleDelete} onReopen={onReopenProject} />)}
      </AnimatePresence>
    </div>
  );
}

// ─── PAGE SHELL ───────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Choose your mode", desc: "Full Package for a complete prompt + variants + techniques guide. Quick for the best prompt fast. Image for Midjourney/DALL-E. Code for building apps. Chain for multi-step workflows. Variants to see 6 different techniques applied. Explain to analyse and fix any existing prompt." },
  { step: "02", title: "Describe what you want", desc: "Be as rough as you like — a one-sentence idea, a detailed spec, or paste an existing weak prompt. The rougher your input, the more dramatically the output improves it." },
  { step: "03", title: "Select your target model and techniques", desc: "Different AI models respond to different prompt structures. Claude prefers XML tags and explicit instructions. Midjourney needs visual descriptors and technical params. Selecting techniques like Chain-of-Thought or Few-Shot injects them automatically." },
  { step: "04", title: "Get your engineered prompt", desc: "The Full Package includes: a main engineered prompt (with optional system prompt), 3 variants for different situations, an advanced version using additional techniques, a technique breakdown explaining what was applied and why, and an iteration guide for when results aren't perfect." },
  { step: "05", title: "Score your existing prompts", desc: "Switch to Score mode and paste any prompt. You'll get a 0-100 score across 6 dimensions (clarity, context, specificity, format, constraints, techniques), a blunt verdict on what fails, and a fully improved version ready to use." },
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

interface PromptArchitectPageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;
  relatedTools: NormalisedTool[];
}

export function PromptArchitectPage({ isSignedIn, tool, relatedTools }: PromptArchitectPageProps) {
  const [activeTab,  setActiveTab]  = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
  const [copied,     setCopied]     = useState(false);
  const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);
  const router = useRouter();
  const [reopenProject, setReopenProject] = useState<PromptProject | null>(null); 

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
  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "⚡", color: "#f59e0b" };
  const ACCENT = tool.accentColor;

  const TABS = [
    { id: "tool",      label: "Build Prompts",    icon: Wand2       },
    ...(isSignedIn ? [{ id: "workspace" as const, label: "My Library", icon: TrendingUp }] : []),
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
              <p className="text-base font-black leading-tight mb-1">
                The problem isn't the AI. It's your prompt.
              </p>
              <p className="text-sm text-white/65 leading-relaxed">
                Most people type one vague sentence and get a mediocre response. Professional prompt engineers get <span className="text-amber-400 font-semibold">dramatically better results</span> — not because they're smarter, but because they know how to structure the request. This tool gives you that skill instantly.
              </p>
            </div>

            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{tool.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              {tool.usageCount > 0 && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" style={{ color: ACCENT }} />{tool.usageCount.toLocaleString()} prompts built</span>}
              {tool.ratingCount > 0 && <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{tool.ratingAvg.toFixed(1)} ({tool.ratingCount} reviews)</span>}
              {tool.buildTime && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{tool.buildTime}</span>}
              {tool.tokenCost ? (
                <span className="flex items-center gap-1.5 font-semibold text-amber-600">🪙 {tool.tokenCost} tokens per prompt</span>
              ) : (
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: ACCENT }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Free
                </span>
              )}
              <span className="font-semibold" style={{ color: ACCENT }}>🔮 Claude · 🤖 GPT-4 · ♊ Gemini · 🎨 Midjourney · +5</span>
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
                <Wand2 className="w-4 h-4" />Build My Prompt
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs transition-colors border"
                  style={{ color: ACCENT, borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}08` }}>
                  <TrendingUp className="w-4 h-4" />My Library
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
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>Everything Included</p>
              <div className="space-y-3">
                {[
                  { emoji: "⚡", label: "7 Generation Modes",   desc: "Full, Quick, Image, Code, Chain, Variants, Explain" },
                  { emoji: "📊", label: "Prompt Scorer",        desc: "0-100 score across 6 dimensions"                    },
                  { emoji: "🔮", label: "9 AI Models",          desc: "Claude, GPT-4, Gemini, Midjourney, SD & more"       },
                  { emoji: "🎯", label: "8 Techniques",         desc: "Chain-of-thought, few-shot, role prompting & more"  },
                  { emoji: "🔄", label: "3 Variants",           desc: "Different approaches to the same task"              },
                  { emoji: "🧬", label: "Advanced Version",     desc: "Sophisticated multi-technique prompt"               },
                  { emoji: "🔬", label: "Prompt Anatomy",       desc: "Explain any existing prompt element by element"     },
                  { emoji: "📚", label: "Techniques Library",   desc: "8 engineering techniques with copy-ready examples"  },
                  { emoji: "🔧", label: "Iteration Guide",      desc: "What to change when output isn't right"             },
                  { emoji: "💾", label: "Prompt Library",       desc: "Save, organise, and reuse your best prompts"        },
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
                    <PromptArchitectTool 
                        isSignedIn={isSignedIn} 
                        onInsufficientTokens={(info) => setTokenModal(info)} 
                        reopenProject={reopenProject}
                        onReopened={() => setReopenProject(null)}
                     />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-blue-50 border border-blue-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Generated prompts are starting points — the best results come from testing and iterating. Use the Iteration Guide tab to fine-tune when the AI output isn't quite right.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn ? (
                <PromptDashboard 
                  onReopenProject={(project) => {
                    setReopenProject(project);
                    setActiveTab("tool");
                  }}
                />
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                    <div className="text-4xl mb-4">{tool.icon}</div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to build your prompt library</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-5">Save, organise, and reuse your best prompts. Build a personal library of prompts that actually work.</p>
                    <Link href="/sign-in?redirect_url=/tools/prompt-architect"
                      className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs"
                      style={{ backgroundColor: ACCENT }}>Sign in — it's free</Link>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use {tool.name}</h2>
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
                  <h3 className="text-base font-bold mb-3" style={{ color: "#78350f" }}>⚡ Getting the best results</h3>
                  <ul className="space-y-2">
                    {[
                      "The 'Explain' mode is underrated — paste any prompt you're already using and find out exactly why it's weak. The fix is usually simpler than you think.",
                      "Chain-of-thought adds about 30% reliability on any reasoning task. Use it for analysis, planning, and any multi-step problem.",
                      "For code prompts, always use the iterative approach. 'Write the whole app' in one prompt produces garbage. 'Write the architecture, then the core feature, then the edge cases' produces working code.",
                      "Image prompts need technical params — aspect ratio, quality, version number. A prompt without them is like a photography brief without mentioning the camera.",
                      "Save your best-performing prompts. You'll reuse good structures more often than you think. The library builds up fast.",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm" style={{ color: "#78350f" }}>
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

              {/* Why prompts fail */}
              <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}05`, borderColor: `${ACCENT}20` }}>
                <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>Why most prompts fail</p>
                {[
                  { text: "No role: AI defaults to a generic assistant personality",    color: "#ef4444" },
                  { text: "No context: AI fills in gaps with assumptions",             color: "#f97316" },
                  { text: "No format spec: output is inconsistent length and style",   color: "#f59e0b" },
                  { text: "No constraints: AI meanders without boundaries",            color: ACCENT    },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#78350f" }}>{s.text}</p>
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