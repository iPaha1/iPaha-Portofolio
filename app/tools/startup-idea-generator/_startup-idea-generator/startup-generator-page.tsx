"use client";
// =============================================================================
// isaacpaha.com — Startup Idea Generator — Page Shell + Dashboard
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link                     from "next/link";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  Rocket, Star, Trash2, Loader2, RefreshCw, Check, TrendingUp,
  Flame, ArrowRight, ArrowLeft, Share2, BookOpen, MessageSquare,
  Users, Clock, Sparkles, Info, ChevronRight, Zap, Brain,
  Globe, Target, Shield, Lightbulb,
} from "lucide-react";
import { ToolCard }             from "../../_tools/tools-card";
import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter }            from "next/navigation";
import type { NormalisedTool }  from "../../_tools/tools-lab-client";
import { ToolViewTracker }      from "../../_tools/tool-view-tracker";
import { ToolReviews }          from "../../_tools/tool-reviews";
import { StartupGeneratorTool, TokenGateInfo } from "./startup-generator-tool";

const ACCENT = "#8b5cf6";

// ─── Saved idea types ─────────────────────────────────────────────────────────

export interface SavedIdea {
  id:                string;
  generationMode:    string;
  ambitiousness:     string;
  savedIdeaTitle?:   string | null;
  savedIdeaCategory?:string | null;
  ideaCount:         number;
  status:            string;
  isStarred:         boolean;
  createdAt:         string;
}

interface Workspace {
  totalGenerated: number;
  totalSaved:     number;
  ideasBuilding:  number;
  streakDays:     number;
  xpPoints:       number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  DEEPTECH:"🔬",CONSUMER:"📱",B2B_SAAS:"💻",FINTECH:"💰",HEALTHTECH:"🏥",
  CLIMATETECH:"🌍",EDTECH:"🎓",CREATOR_ECONOMY:"🎨",INFRASTRUCTURE:"⚙️",
  FUTURE_OF_WORK:"🏠",WEB3:"🔗",BIOTECH:"🧬",OTHER:"✨",
};
const MODE_LABEL: Record<string, string> = {
  FOUNDER_MATCHED:"Match My DNA",SECTOR_FOCUSED:"Sector Dive",CONTRARIAN:"Contrarian",
  TIMING_ARBITRAGE:"Perfect Timing",WHITE_SPACE:"White Space",FREE_FORM:"Unleashed",
};
const AMB_EMOJI: Record<string, string> = {
  MOONSHOT:"🌙",UNICORN:"🦄",ROCKETSHIP:"🚀",SOLID_STARTUP:"💪",
};
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  EXPLORING:   { label: "Exploring",  color: "#6b7280" },
  RESEARCHING: { label: "Researching",color: "#3b82f6" },
  BUILDING:    { label: "Building",   color: "#10b981" },
  LAUNCHED:    { label: "Launched!",  color: "#f59e0b" },
  SHELVED:     { label: "Shelved",    color: "#9ca3af" },
};

const fmtRel = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "today"; if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// ─── Saved Idea Card ──────────────────────────────────────────────────────────

function SavedIdeaCard({ idea, onDelete, onReopen }: { idea: SavedIdea; onDelete: (id: string) => void; onReopen?: (idea: SavedIdea) => void }) {
  const [status,   setStatus]   = useState(idea.status);
  const [isStarred,setIsStarred]= useState(idea.isStarred);
  const [deleting, setDeleting] = useState(false);
  const sc  = STATUS_CFG[status] ?? STATUS_CFG.EXPLORING;

  const patch = (action: string, data: any) =>
    fetch(`/api/tools/startup-generator/save?id=${idea.id}&action=${action}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).catch(() => {});

  const toggleStar   = async () => { const n = !isStarred; setIsStarred(n); await patch("star", { isStarred: n }); };
  const handleDelete = async () => { setDeleting(true); await fetch(`/api/tools/startup-generator/save?id=${idea.id}`, { method: "DELETE" }); onDelete(idea.id); };

  const PIPELINE = ["EXPLORING", "RESEARCHING", "BUILDING", "LAUNCHED"] as const;

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-xl overflow-hidden hover:border-stone-200 transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${ACCENT}10` }}>
            {CATEGORY_EMOJI[idea.savedIdeaCategory ?? ""] ?? AMB_EMOJI[idea.ambitiousness] ?? "🚀"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md"
                style={{ background: `${ACCENT}12`, color: ACCENT }}>
                {MODE_LABEL[idea.generationMode] ?? idea.generationMode}
              </span>
              <span className="text-[10px]">{AMB_EMOJI[idea.ambitiousness]}</span>
              <span className="text-[10px] text-stone-300">{fmtRel(idea.createdAt)}</span>
            </div>
            <p className="text-sm font-black text-stone-900 leading-snug line-clamp-1">
              {idea.savedIdeaTitle ?? `${idea.ideaCount} idea${idea.ideaCount > 1 ? "s" : ""} generated`}
            </p>
          </div>
          <button onClick={toggleStar}
            className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${isStarred ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}>
            <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {/* Pipeline */}
        <div className="flex gap-0.5 mb-3 overflow-x-auto">
          {PIPELINE.map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} onClick={() => { setStatus(s); patch("status", { status: s }); }}
                className={`flex-shrink-0 text-[9px] font-black px-2.5 py-1 rounded-md transition-all ${
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
              className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #7c3aed 100%)` }}>
              <Rocket className="w-3.5 h-3.5" />Reopen
            </button>
          )}
          <span className="text-xs px-2 py-1 rounded-md font-semibold"
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

interface SavedIdeasDashboardProps {
  onReopenBatch?: (idea: SavedIdea) => void;
}

function SavedIdeasDashboard({ onReopenBatch }: SavedIdeasDashboardProps) {
  const [ideas,     setIdeas]     = useState<SavedIdea[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tools/startup-generator/save");
      const data = await res.json();
      setIdeas(data.ideas ?? []); setWorkspace(data.workspace ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const handleDelete = (id: string) => setIdeas(p => p.filter(x => x.id !== id));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="space-y-6">
      {(workspace || ideas.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Batches Generated", value: workspace?.totalGenerated ?? ideas.length, icon: Sparkles, color: ACCENT    },
            { label: "Ideas Saved",       value: workspace?.totalSaved ?? 0,                icon: Star,     color: "#f59e0b" },
            { label: "Currently Building",value: workspace?.ideasBuilding ?? 0,             icon: Rocket,   color: "#10b981" },
            { label: "Day Streak",        value: workspace?.streakDays ?? 0,                icon: Flame,    color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
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
      <div className="flex justify-end">
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700">
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>
      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50">
          <div className="text-4xl mb-4">🦄</div>
          <h3 className="text-base font-black text-stone-900 mb-2">No saved ideas yet</h3>
          <p className="text-sm text-stone-500 max-w-xs">Generate your first batch of startup ideas and save them here to track your journey.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence>{ideas.map(i => <SavedIdeaCard key={i.id} idea={i} onDelete={handleDelete} onReopen={onReopenBatch} />)}</AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Choose your generation mode", desc: "Match My DNA tailors ideas to your exact skills and background. Contrarian generates ideas that seem wrong until they're obviously right. Perfect Timing finds opportunities whose exact moment has arrived in 2024-2025. Unleashed has no constraints — just pure ambition." },
  { step: "02", title: "Describe your founder DNA", desc: "The more context you give, the more unfairly targeted your ideas. Your years of fintech experience, your background in healthcare, your knowledge of supply chains — these are not constraints, they're your moat. Ideas calibrated to who you are will be defensible in ways generic ideas can't be." },
  { step: "03", title: "Set your ambitiousness level", desc: "Moonshot ideas can change civilisation but need a decade and serious capital. Unicorn ideas have a realistic $1B+ path. Rocketship ideas are $100M-$500M territory — highly achievable for the right founder. Honest about your constraints? Pick the level that matches your reality." },
  { step: "04", title: "Get genuinely novel startup ideas", desc: "Each idea comes with: the core insight (the non-obvious thing that makes this work), market sizing (TAM/SAM/SOM with methodology), the exact customer profile, your unfair advantage as this specific founder, the core assumption to test, 3 validation questions for your first customer conversation, and the first steps to take this week." },
  { step: "05", title: "Validate and build", desc: "Save ideas to track them through the pipeline: Exploring → Researching → Building → Launched. The Kill Signals section tells you what would make you stop. The 10x Question tells you if this becomes a unicorn or a lifestyle business. The Brutality Score tells you how hard it really is." },
];

function ReadingProgress({ accentColor }: { accentColor: string }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const e = document.documentElement; setW(Math.min(100,(e.scrollTop/Math.max(1,e.scrollHeight-e.clientHeight))*100)); };
    window.addEventListener("scroll",h,{passive:true}); return ()=>window.removeEventListener("scroll",h);
  },[]);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full" style={{width:`${w}%`,backgroundColor:accentColor}}/></div>;
}

// ─── PAGE SHELL ───────────────────────────────────────────────────────────────

interface StartupGeneratorPageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;
  relatedTools: NormalisedTool[];
}

export function StartupGeneratorPage({ isSignedIn, tool, relatedTools }: StartupGeneratorPageProps) {
  const [activeTab,  setActiveTab]  = useState<"tool"|"workspace"|"guide"|"reviews">("tool");
  const [copied,     setCopied]     = useState(false);
  const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);
  const router = useRouter();
  const [reopenBatch, setReopenBatch] = useState<SavedIdea | null>(null);
  const A = tool.accentColor;

  const TABS = [
    { id: "tool",      label: "Generate Ideas",  icon: Sparkles    },
    ...(isSignedIn ? [{ id: "workspace" as const, label: "Saved Ideas", icon: Star }] : []),
    { id: "guide",     label: "How It Works",    icon: BookOpen    },
    { id: "reviews",   label: "Reviews",         icon: MessageSquare },
  ] as const satisfies readonly { id: "tool"|"workspace"|"guide"|"reviews"; label: string; icon: any }[];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress accentColor={A} />
      <ToolViewTracker toolId={tool.id} />

      {/* <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage:"linear-gradient(to right,#000 1px,transparent 1px),linear-gradient(to bottom,#000 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[700px] h-[700px] rounded-full blur-3xl opacity-[0.04] pointer-events-none" style={{ backgroundColor: A }} /> */}

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[{label:"Home",href:"/"},{label:"Tools",href:"/tools"},{label:tool.name,href:"#"}].map((bc,i)=>(
            <React.Fragment key={bc.label}>
              {i>0&&<ChevronRight className="w-3 h-3 text-gray-300"/>}
              {bc.href==="#"?<span className="text-gray-600 font-medium">{bc.label}</span>:<Link href={bc.href} className="hover:text-gray-700">{bc.label}</Link>}
            </React.Fragment>
          ))}
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-16 h-16 rounded-xl border-2 flex items-center justify-center text-4xl shrink-0"
                style={{ backgroundColor:`${A}10`, borderColor:`${A}30` }}>
                {tool.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border"
                    style={{ color:A, backgroundColor:`${A}10`, borderColor:`${A}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor:A }}/>Live
                  </span>
                  {tool.isNew&&<span className="text-[9px] font-black tracking-widest uppercase text-white px-2 py-0.5 rounded-xl" style={{ backgroundColor:A }}>NEW</span>}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{tool.name}</h1>
              </div>
            </div>

            <div className="rounded-xl px-5 py-4 mb-5" style={{ background:"linear-gradient(135deg,#1a0a2e 0%,#0d0d0d 100%)", border:"1px solid #4c1d95" }}>
              <p className="text-base font-black text-white mb-1">Not another generic startup generator.</p>
              <p className="text-sm leading-relaxed" style={{ color:"#c4b5fd" }}>
                Describe your background, skills, and interests — get <span className="text-white font-bold">unicorn-potential startup ideas</span> with market sizing, unfair advantage analysis, validation questions, and the exact first steps to take. Built for builders who want to find their next big thing.
              </p>
            </div>

            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{tool.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              {tool.usageCount>0&&<span className="flex items-center gap-1.5"><Users className="w-4 h-4" style={{color:A}}/>{tool.usageCount.toLocaleString()} ideas generated</span>}
              {tool.ratingCount>0&&<span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400"/>{tool.ratingAvg.toFixed(1)} ({tool.ratingCount} reviews)</span>}
              {tool.tokenCost&&<span className="font-semibold text-amber-600">🪙 {tool.tokenCost} tokens per generation</span>}
              <span className="font-semibold" style={{color:A}}>🦄 Unicorn · 🌙 Moonshot · 🚀 Rocketship</span>
            </div>

            {tool.features.length>0&&(
              <div className="flex flex-wrap gap-2 mb-6">
                {tool.features.map(f=>(
                  <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                    <Check className="w-3 h-3" style={{color:A}}/>{f}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={()=>setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xl shadow-sm"
                style={{ background:`linear-gradient(135deg,${A} 0%,#7c3aed 100%)` }}>
                <Sparkles className="w-4 h-4"/>Generate My Ideas
              </button>
              {isSignedIn&&(
                <button onClick={()=>setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl border"
                  style={{ color:A, borderColor:`${A}50`, backgroundColor:`${A}08` }}>
                  <Star className="w-4 h-4"/>Saved Ideas
                </button>
              )}
              <button onClick={()=>{navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xl">
                {copied?<Check className="w-4 h-4 text-green-500"/>:<Share2 className="w-4 h-4"/>}
                {copied?"Copied!":"Share"}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="border rounded-xl p-5" style={{ backgroundColor:`${A}06`, borderColor:`${A}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color:A }}>Each Idea Includes</p>
              <div className="space-y-3">
                {[
                  {emoji:"🧬",label:"Founder DNA match",    desc:"Why YOU specifically should build this"},
                  {emoji:"💡",label:"The core insight",     desc:"The non-obvious thing that makes it work"},
                  {emoji:"📊",label:"Market sizing",        desc:"TAM/SAM/SOM with methodology"},
                  {emoji:"👤",label:"Exact customer profile",desc:"Not a category — a specific person"},
                  {emoji:"🔒",label:"Your unfair advantage",desc:"What you can do that others can't replicate"},
                  {emoji:"⏰",label:"Why NOW is the moment",desc:"Timing factors that make this possible today"},
                  {emoji:"🎯",label:"Validation questions", desc:"What to ask first customer conversation"},
                  {emoji:"🏗️",label:"4-6 week MVP concept", desc:"Leanest thing to prove the core assumption"},
                  {emoji:"💀",label:"Kill signals",         desc:"What would make you stop — fast"},
                  {emoji:"💰",label:"First £1,000 strategy",desc:"Exactly how to make first revenue"},
                  {emoji:"🎲",label:"Brutality score 1-10",  desc:"How hard this really is — no sugarcoating"},
                  {emoji:"⭐",label:"The $1B question",     desc:"What would make this a unicorn vs niche"},
                ].map(s=>(
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
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab===t.id?"border-current text-gray-900":"border-transparent text-gray-400 hover:text-gray-700"}`}
              style={activeTab===t.id?{borderColor:A,color:A}:{}}>
              <t.icon className="w-4 h-4"/>{t.label}
            </button>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {activeTab==="tool"&&(
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{backgroundColor:`${A}06`}}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tool.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{tool.name}</p>
                        <p className="text-xs text-gray-400">{tool.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border"
                      style={{color:A,backgroundColor:`${A}10`,borderColor:`${A}30`}}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor:A}}/>Live
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <StartupGeneratorTool 
                        isSignedIn={isSignedIn} 
                        onInsufficientTokens={info=>setTokenModal(info)}
                        reopenBatch={reopenBatch}
                        onReopened={() => setReopenBatch(null)}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"/>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Ideas are AI-generated starting points. Market sizing is estimated. Always validate assumptions with real customer conversations before investing significant time or money.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab==="workspace"&&(
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                {isSignedIn ? (
                <SavedIdeasDashboard 
                  onReopenBatch={(idea) => {
                    setReopenBatch(idea);
                    setActiveTab("tool");
                  }}
                />
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="text-4xl mb-4">{tool.icon}</div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to save your ideas</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-5">Track ideas from exploration to launch. Never lose a great concept.</p>
                    <Link href="/sign-in?redirect_url=/tools/startup-idea-generator"
                      className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xl"
                      style={{backgroundColor:A}}>Sign in — it's free</Link>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab==="guide"&&(
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the {tool.name}</h2>
                {HOW_IT_WORKS.map((s,i)=>(
                  <div key={s.step} className="flex gap-6 pb-10 relative">
                    {i<HOW_IT_WORKS.length-1&&<div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100"/>}
                    <div className="w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10 text-white"
                      style={{background:`linear-gradient(135deg,${A},#7c3aed)`}}>{s.step}</div>
                    <div><h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3><p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p></div>
                  </div>
                ))}
                <div className="border rounded-xl p-6" style={{backgroundColor:`${A}06`,borderColor:`${A}20`}}>
                  <h3 className="text-base font-bold mb-3" style={{color:"#3b0764"}}>🦄 Getting the best ideas</h3>
                  <ul className="space-y-2">
                    {[
                      "The Contrarian mode generates the highest-quality ideas. Ideas that seem wrong at first are the ones that become unicorns — that's literally how Airbnb and Uber started.",
                      "Be specific about your background. '8 years in NHS radiology' produces far better ideas than 'healthcare professional'.",
                      "Try all 6 modes on the same background. The same founder gets completely different ideas from Timing Arbitrage vs White Space — both are worth exploring.",
                      "The Brutality Score is your friend. A 9/10 doesn't mean don't do it — it means you need co-founders, funding, and 10 years. Know what you're signing up for.",
                      "The validation questions are the most actionable part. Book 5 customer interviews before doing anything else. The idea will change after the first conversation.",
                    ].map(tip=>(
                      <li key={tip} className="flex items-start gap-2 text-sm" style={{color:"#3b0764"}}>
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{color:A}}/>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTab==="reviews"&&(
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <ToolReviews toolId={tool.id} toolName={tool.name} accentColor={A} isSignedIn={isSignedIn}/>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map(t=>(
                  <button key={t.id} onClick={()=>setActiveTab(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 ${activeTab===t.id?"bg-gray-900 text-white font-semibold":"text-gray-600 hover:bg-gray-50"}`}>
                    <t.icon className="w-4 h-4"/>{t.label}
                  </button>
                ))}
              </div>

              <div className="border rounded-xl p-5" style={{backgroundColor:`${A}05`,borderColor:`${A}20`}}>
                <p className="text-xs font-black uppercase tracking-wider mb-4" style={{color:A}}>What makes an idea great?</p>
                {[
                  {text:"A founder with an unfair advantage nobody can replicate quickly", color:"#6366f1"},
                  {text:"A problem so painful people will pay immediately without being sold to", color:"#8b5cf6"},
                  {text:"Technology or regulation that just changed and made this suddenly possible", color:"#a855f7"},
                  {text:"A market that looks small but expands dramatically once you've won it", color:A},
                ].map((s,i)=>(
                  <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor:s.color}}/>
                    <p className="text-xs leading-relaxed" style={{color:"#3b0764"}}>{s.text}</p>
                  </div>
                ))}
              </div>

              {relatedTools.length>0&&(
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Build on These Ideas</p>
                  <div className="space-y-3">
                    {relatedTools.map(t=>(
                      <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 shrink-0"/>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/tools" className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xl transition-all">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"/>All Tools
              </Link>
            </div>
          </aside>
        </div>

        {relatedTools.length>0&&(
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">Validate & Build Your Idea</h2>
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">See all<ArrowRight className="w-4 h-4"/></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedTools.map(t=><ToolCard key={t.id} tool={t}/>)}
            </div>
          </div>
        )}
      </div>

      <InsufficientTokensModal
        open={!!tokenModal} onClose={()=>setTokenModal(null)}
        required={tokenModal?.required??0} balance={tokenModal?.balance??0}
        toolName={tokenModal?.toolName??undefined}
        onPlayGame={()=>{setTokenModal(null);router.push("/games");}}
      />
    </div>
  );
}