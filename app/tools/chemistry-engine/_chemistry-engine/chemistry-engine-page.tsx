"use client";

// =============================================================================
// isaacpaha.com — Chemistry Understanding Engine — Page Shell
// app/tools/chemistry-engine/_components/chemistry-engine-page.tsx
// =============================================================================

import React, { useState }    from "react";
import Link                   from "next/link";
import { motion }             from "framer-motion";
import {
  ArrowLeft, Star, Clock, Share2, Check, ChevronRight, TrendingUp,
  MessageSquare, BookOpen, ArrowRight, FlaskConical, Atom,
  Globe, History, Lightbulb, BarChart2, Brain, Telescope,
  TestTube, AlertTriangle, Layers, Microscope, Info,
  Users,
} from "lucide-react";
import { ChemistryEngineTool }       from "./chemistry-engine-tool";
import { ChemistryDashboard }        from "./chemistry-dashboard";
import type { ChemistryReopenData, TokenGateInfo }  from "./chemistry-engine-tool";
import { ToolCard } from "../../_tools/tools-card";
import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter } from "next/navigation";
import type { NormalisedTool } from "../../_tools/tools-lab-client";
import { ToolViewTracker } from "../../_tools/tool-view-tracker";
import { ToolReviews } from "../../_tools/tool-reviews";

// ─── How it works steps ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Enter any chemistry topic or question",       desc: "From 'explain ionic bonding' to 'how does the mole work?' to just 'Thermochemistry'. Use Question Mode for specific questions or Theory Explorer for broad topics." },
  { step: "02", title: "Select your level",                           desc: "GCSE, A-Level, or University. The entire breakdown — language, mathematical depth, particle detail, and exam tips — adapts completely." },
  { step: "03", title: "Get your 10-layer breakdown",                 desc: "In ~7 seconds: plain definition, particle-level explanation, core law, why it was needed, history, theory, real world, intuition builders, misconceptions corrected, and experiments." },
  { step: "04", title: "Go simpler or deeper",                        desc: "'Explain simpler' gives you an analogy and stripped-back explanation including a simplified particle picture. 'Go deeper' shows quantum-level treatment, derivations, and Nobel Prize connections." },
  { step: "05", title: "Practice, experiment, and ask the tutor",     desc: "Generate calculation or theory questions with mark schemes. Try safe at-home experiments. The Chemistry Tutor answers follow-up questions with particle-level hints." },
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

function StarRow({ rating }: { rating: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />)}</div>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChemistryEnginePageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;         // ← from DB via server page
  relatedTools: NormalisedTool[];       // ← same category, from DB
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChemistryEnginePage({ isSignedIn, tool, relatedTools }: ChemistryEnginePageProps) {
  const [activeTab,  setActiveTab]  = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
  const [copied,     setCopied]     = useState(false);
  const [reopenData, setReopenData] = useState<ChemistryReopenData | null>(null);
  const router = useRouter();
  const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);

  // Derive category display from the tool's category string
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
  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "🧪", color: "#10b981" };
  const ACCENT = tool.accentColor;

  const TABS = [
    { id: "tool",      label: "Understand Chemistry", icon: FlaskConical },
    ...(isSignedIn ? [{ id: "workspace" as const, label: "My Workspace", icon: TrendingUp }] : []),
    { id: "guide",     label: "How It Works",          icon: BookOpen     },
    { id: "reviews",   label: "Reviews",               icon: MessageSquare },
  ] as const satisfies readonly { id: "tool" | "workspace" | "guide" | "reviews"; label: string; icon: any }[];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <ReadingProgress accentColor={ACCENT} />

      {/* ── View tracker — fires once on mount, increments DB viewCount ── */}
      <ToolViewTracker toolId={tool.id} />

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none"
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
                style={{ backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}30` }}>
                {tool.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: catCfg.color }}>
                    {catCfg.icon} {tool.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border"
                    style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
                  </span>
                  {tool.isNew && (
                    <span className="text-[9px] font-black tracking-widest uppercase text-white px-2 py-0.5 rounded-xs"
                      style={{ backgroundColor: ACCENT }}>
                      NEW
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{tool.name}</h1>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{tool.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              {tool.usageCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" style={{ color: ACCENT }} />
                  {tool.usageCount.toLocaleString()} learners
                </span>
              )}
              {tool.ratingCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {tool.ratingAvg.toFixed(1)} ({tool.ratingCount} reviews)
                </span>
              )}
              {tool.buildTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-300" />{tool.buildTime}
                </span>
              )}
              {tool.tokenCost ? (
                <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                  🪙 {tool.tokenCost} tokens per run
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: ACCENT }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Free
                </span>
              )}
              <span className="font-semibold" style={{ color: ACCENT }}>🇬🇧 GCSE · A-Level · University</span>
            </div>

            {/* Features from DB */}
            {tool.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tool.features.map((f) => (
                  <span key={f}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                    <Check className="w-3 h-3" style={{ color: ACCENT }} />{f}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: ACCENT }}>
                <FlaskConical className="w-4 h-4" />Understand Any Topic
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs transition-colors border"
                  style={{ color: ACCENT, borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}08` }}>
                  <TrendingUp className="w-4 h-4" />My Workspace
                </button>
              )}
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right: 10 layers */}
          <div className="hidden lg:block">
            <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>10-Layer Concept Breakdown</p>
              <div className="space-y-2.5">
                {[
                  { num: "1",  label: "Plain English definition",       color: "#10b981" },
                  { num: "2",  label: "Particle level — atoms & bonds", color: "#6366f1" },
                  { num: "3",  label: "Core law or equation",           color: "#f59e0b" },
                  { num: "4",  label: "Why this concept was needed",     color: "#ef4444" },
                  { num: "5",  label: "History & key chemists",         color: "#8b5cf6" },
                  { num: "6",  label: "Theory deep dive",               color: "#3b82f6" },
                  { num: "7",  label: "Real-world applications",        color: "#10b981" },
                  { num: "8",  label: "Intuition & mental models",      color: "#f97316" },
                  { num: "9",  label: "Misconceptions corrected",       color: "#ec4899" },
                  { num: "10", label: "Try It Yourself experiments",    color: "#14b8a6" },
                ].map((s) => (
                  <div key={s.num} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style={{ backgroundColor: s.color }}>
                      {s.num}
                    </div>
                    <p className="text-xs font-semibold text-stone-700">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "text-gray-900 border-current"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
              style={activeTab === t.id ? { borderColor: ACCENT, color: ACCENT } : {}}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {/* TOOL tab */}
            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: `${ACCENT}06` }}>
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
                    <ChemistryEngineTool
                      isSignedIn={isSignedIn}
                      reopenData={reopenData}
                      onReopened={() => setReopenData(null)}
                      onInsufficientTokens={(info) => setTokenModal(info)}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-blue-50 border border-blue-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Educational tool for deep understanding. Use it to learn concepts at the particle level, then practise independently.
                  </p>
                </div>
              </motion.div>
            )}

            {/* WORKSPACE tab */}
            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? (
                    <ChemistryDashboard
                      onReopenQuery={(resultJson, question, level) => {
                        setReopenData({ resultJson, question, level });
                        setActiveTab("tool");
                      }}
                    />
                  )
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <div className="text-4xl mb-4">{tool.icon}</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to access your workspace</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">Save explanations, track practice progress, and build your personal chemistry knowledge base.</p>
                      <Link href="/sign-in?redirect_url=/tools/chemistry-engine"
                        className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors"
                        style={{ backgroundColor: ACCENT }}>Sign in — it's free</Link>
                    </div>
                  )
                }
              </motion.div>
            )}

            {/* GUIDE tab */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the {tool.name}</h2>
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={s.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10 text-white"
                      style={{ backgroundColor: ACCENT }}>{s.step}</div>
                    <div><h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3><p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p></div>
                  </div>
                ))}
                <div className="mt-4 border rounded-xs p-6" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: "#064e3b" }}>💡 Getting the most out of it</h3>
                  <ul className="space-y-2">
                    {[
                      "The Particles tab is the most important one — if you can explain what atoms and electrons are doing, you can answer any exam question on that topic.",
                      "The Misconceptions tab first — correct your wrong model before building on it.",
                      "After reading, try to draw the particle model from memory. If you can draw it, you understand it.",
                      "Use Theory Explorer for revision: explore a whole branch like 'Thermochemistry' in one session.",
                      "The Tutor works best with specific questions: 'Why does a higher temperature increase reaction rate at the particle level?'",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm" style={{ color: "#064e3b" }}>
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* REVIEWS tab */}
            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ToolReviews
                  toolId={tool.id}
                  toolName={tool.name}
                  accentColor={tool.accentColor}
                  isSignedIn={isSignedIn}
                />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}05`, borderColor: `${ACCENT}20` }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>Why chemistry is hard</p>
                {[
                  { text: "Students memorise without understanding the particle level",      color: "#ef4444" },
                  { text: "Formulas are taught without explaining why they work",            color: "#f59e0b" },
                  { text: "Misconceptions are never directly named and corrected",            color: "#8b5cf6" },
                  { text: "No connection is made between atoms, equations, and real life",   color: "#10b981" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#064e3b" }}>{s.text}</p>
                  </div>
                ))}
              </div>

              {relatedTools.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More {tool.category} Tools</p>
                  <div className="space-y-3">
                    {relatedTools.map((t) => (
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
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedTools.map((t) => <ToolCard key={t.id} tool={t} />)}
            </div>
          </div>
        )}
      </div>

      {/* Insufficient Tokens Modal */}
      <InsufficientTokensModal
        open={!!tokenModal}
        onClose={() => setTokenModal(null)}
        required={tokenModal?.required ?? 0}
        balance={tokenModal?.balance   ?? 0}
        toolName={tokenModal?.toolName ?? undefined}
        onPlayGame={() => {
          setTokenModal(null);
          router.push("/games");
        }}
      />
    </div>
  );
}






// "use client";

// // =============================================================================
// // isaacpaha.com — Chemistry Understanding Engine — Page Shell
// // app/tools/chemistry-engine/_components/chemistry-engine-page.tsx
// // =============================================================================

// import React, { useState }    from "react";
// import Link                   from "next/link";
// import { motion }             from "framer-motion";
// import {
//   ArrowLeft, Star, Clock, Share2, Check, ChevronRight, TrendingUp,
//   MessageSquare, BookOpen, ArrowRight, FlaskConical, Atom,
//   Globe, History, Lightbulb, BarChart2, Brain, Telescope,
//   TestTube, AlertTriangle, Layers, Microscope, Info,
// } from "lucide-react";
// import { TOOLS, TOOL_CATEGORIES }    from "@/lib/data/tools-data";
// import { ChemistryEngineTool }       from "./chemistry-engine-tool";
// import { ChemistryDashboard }        from "./chemistry-dashboard";
// import type { ChemistryReopenData, TokenGateInfo }  from "./chemistry-engine-tool";
// import { ToolCard } from "../../_tools/tools-card";
// import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
// import { useRouter } from "next/navigation";

// const TOOL   = TOOLS.find((t) => t.slug === "chemistry-engine")!;
// const ACCENT = "#10b981";

// const HOW_IT_WORKS = [
//   { step: "01", title: "Enter any chemistry topic or question",       desc: "From 'explain ionic bonding' to 'how does the mole work?' to just 'Thermochemistry'. Use Question Mode for specific questions or Theory Explorer for broad topics." },
//   { step: "02", title: "Select your level",                           desc: "GCSE, A-Level, or University. The entire breakdown — language, mathematical depth, particle detail, and exam tips — adapts completely." },
//   { step: "03", title: "Get your 10-layer breakdown",                 desc: "In ~7 seconds: plain definition, particle-level explanation, core law, why it was needed, history, theory, real world, intuition builders, misconceptions corrected, and experiments." },
//   { step: "04", title: "Go simpler or deeper",                        desc: "'Explain simpler' gives you an analogy and stripped-back explanation including a simplified particle picture. 'Go deeper' shows quantum-level treatment, derivations, and Nobel Prize connections." },
//   { step: "05", title: "Practice, experiment, and ask the tutor",     desc: "Generate calculation or theory questions with mark schemes. Try safe at-home experiments. The Chemistry Tutor answers follow-up questions with particle-level hints." },
// ];

// const REVIEWS = [
//   { name: "Blessing O.",  role: "GCSE Chemistry Student",  avatar: "BO", rating: 5, date: "1 week ago",   body: "The Particles tab changed everything for me. I've been memorising 'electrons are transferred in ionic bonding' for two years without actually knowing what that means. Seeing it explained visually at atom level — it finally clicked." },
//   { name: "Mrs. Ahmed",   role: "A-Level Chemistry Teacher",avatar: "MA", rating: 5, date: "2 weeks ago",  body: "The Misconceptions tab alone is worth it. I use it at the start of each new topic — my students come in believing things that are wrong, and having the specific misconception named and corrected changes the lesson completely." },
//   { name: "Daniel F.",    role: "University Chemistry",     avatar: "DF", rating: 5, date: "3 weeks ago",  body: "The 'Go Deeper' mode for thermochemistry showed Gibbs free energy derivations and pointed me to relevant Nobel Prize-winning work. Genuinely bridges the gap from A-Level to degree-level thinking." },
//   { name: "Priya H.",     role: "GCSE Parent",              avatar: "PH", rating: 4, date: "1 month ago",  body: "My daughter struggled with mole calculations. The everyday analogy about dozens of eggs making sense of Avogadro's number was so good she explained it back to me at dinner. The Try It experiments are brilliant." },
// ];

// function ReadingProgress() {
//   const [w, setW] = React.useState(0);
//   React.useEffect(() => {
//     const h = () => { const e = document.documentElement; setW(Math.min(100, (e.scrollTop / (e.scrollHeight - e.clientHeight)) * 100)); };
//     window.addEventListener("scroll", h, { passive: true });
//     return () => window.removeEventListener("scroll", h);
//   }, []);
//   return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full transition-[width] duration-100" style={{ backgroundColor: ACCENT, width: `${w}%` }} /></div>;
// }

// function StarRow({ rating }: { rating: number }) {
//   return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />)}</div>;
// }

// export function ChemistryEnginePage({ isSignedIn }: { isSignedIn: boolean }) {
//   const [activeTab,  setActiveTab]  = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
//   const [copied,     setCopied]     = useState(false);
//   const [reopenData, setReopenData] = useState<ChemistryReopenData | null>(null);
//   const router = useRouter();
  
//   // ── NEW: token modal state ────────────────────────────────────────────────
//     const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);

//   const category = TOOL_CATEGORIES.find((c) => c.name === TOOL?.category);
//   const related  = TOOLS.filter((t) => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);
//   if (!TOOL) return null;

//   const TABS = [
//     { id: "tool",      label: "Understand Chemistry", icon: FlaskConical },
//     ...(isSignedIn ? [{ id: "workspace" as const, label: "My Workspace", icon: TrendingUp }] : []),
//     { id: "guide",     label: "How It Works",          icon: BookOpen     },
//     { id: "reviews",   label: "Reviews",               icon: MessageSquare },
//   ] as const satisfies readonly { id: "tool" | "workspace" | "guide" | "reviews"; label: string; icon: any }[];

//   return (
//     <div className="min-h-screen bg-white">
//       <ReadingProgress />
//       <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
//         style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
//       <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none" style={{ backgroundColor: ACCENT }} />

//       <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

//         {/* Breadcrumbs */}
//         <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
//           {[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: TOOL.name, href: "#" }].map((bc, i) => (
//             <React.Fragment key={bc.label}>
//               {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
//               {bc.href === "#" ? <span className="text-gray-600 font-medium">{bc.label}</span>
//                 : <Link href={bc.href} className="hover:text-gray-700 transition-colors">{bc.label}</Link>}
//             </React.Fragment>
//           ))}
//         </nav>

//         {/* Hero */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
//           <div className="lg:col-span-2">
//             <div className="flex items-center gap-3 mb-5">
//               <div className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
//                 style={{ backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}30` }}>🧪</div>
//               <div>
//                 <div className="flex flex-wrap items-center gap-2 mb-1">
//                   <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
//                   <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border"
//                     style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
//                     <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
//                   </span>
//                   <span className="text-[9px] font-black tracking-widest uppercase text-white px-2 py-0.5 rounded-xs" style={{ backgroundColor: ACCENT }}>NEW</span>
//                 </div>
//                 <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
//               </div>
//             </div>

//             <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

//             <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
//               <span className="flex items-center gap-1.5 font-semibold" style={{ color: ACCENT }}>
//                 <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Free
//               </span>
//               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
//               <span className="font-semibold" style={{ color: ACCENT }}>🇬🇧 GCSE · A-Level · University</span>
//             </div>

//             <div className="flex flex-wrap gap-2 mb-6">
//               {TOOL.features.map((f) => (
//                 <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
//                   <Check className="w-3 h-3" style={{ color: ACCENT }} />{f}
//                 </span>
//               ))}
//             </div>

//             <div className="flex items-center gap-3 flex-wrap">
//               <button onClick={() => setActiveTab("tool")}
//                 className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
//                 style={{ backgroundColor: ACCENT }}>
//                 <FlaskConical className="w-4 h-4" />Understand Any Topic
//               </button>
//               {isSignedIn && (
//                 <button onClick={() => setActiveTab("workspace")}
//                   className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs transition-colors border"
//                   style={{ color: ACCENT, borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}08` }}>
//                   <TrendingUp className="w-4 h-4" />My Workspace
//                 </button>
//               )}
//               <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
//                 className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
//                 {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
//                 {copied ? "Copied!" : "Share"}
//               </button>
//             </div>
//           </div>

//           {/* Right: 10 layers */}
//           <div className="hidden lg:block">
//             <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
//               <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>10-Layer Concept Breakdown</p>
//               <div className="space-y-2.5">
//                 {[
//                   { num: "1",  label: "Plain English definition",       color: "#10b981" },
//                   { num: "2",  label: "Particle level — atoms & bonds", color: "#6366f1" },
//                   { num: "3",  label: "Core law or equation",           color: "#f59e0b" },
//                   { num: "4",  label: "Why this concept was needed",     color: "#ef4444" },
//                   { num: "5",  label: "History & key chemists",         color: "#8b5cf6" },
//                   { num: "6",  label: "Theory deep dive",               color: "#3b82f6" },
//                   { num: "7",  label: "Real-world applications",        color: "#10b981" },
//                   { num: "8",  label: "Intuition & mental models",      color: "#f97316" },
//                   { num: "9",  label: "Misconceptions corrected",       color: "#ec4899" },
//                   { num: "10", label: "Try It Yourself experiments",    color: "#14b8a6" },
//                 ].map((s) => (
//                   <div key={s.num} className="flex items-center gap-3">
//                     <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style={{ backgroundColor: s.color }}>
//                       {s.num}
//                     </div>
//                     <p className="text-xs font-semibold text-stone-700">{s.label}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
//           {TABS.map((t) => (
//             <button key={t.id} onClick={() => setActiveTab(t.id)}
//               className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
//                 activeTab === t.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-400 hover:text-gray-700"
//               }`}>
//               <t.icon className="w-4 h-4" />{t.label}
//             </button>
//           ))}
//         </div>

//         {/* Content grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">

//             {/* TOOL tab */}
//             {activeTab === "tool" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
//                   <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: `${ACCENT}06` }}>
//                     <div className="flex items-center gap-3">
//                       <span className="text-xl">🧪</span>
//                       <div>
//                         <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
//                         <p className="text-xs text-gray-400">{TOOL.tagline}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-xs"
//                       style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
//                       <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
//                     </div>
//                   </div>
//                   <div className="p-6 md:p-8">
//                     <ChemistryEngineTool
//                       isSignedIn={isSignedIn}
//                       reopenData={reopenData}
//                       onReopened={() => setReopenData(null)}
//                       onInsufficientTokens={(info) => setTokenModal(info)}
//                     />
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 mt-5 bg-blue-50 border border-blue-100 rounded-xs px-4 py-3.5">
//                   <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
//                   <p className="text-xs text-blue-800 leading-relaxed">
//                     Educational tool for deep understanding. Use it to learn concepts at the particle level, then practise independently.
//                   </p>
//                 </div>
//               </motion.div>
//             )}

//             {/* WORKSPACE tab */}
//             {activeTab === "workspace" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 {isSignedIn
//                   ? (
//                     <ChemistryDashboard
//                       onReopenQuery={(resultJson, question, level) => {
//                         setReopenData({ resultJson, question, level });
//                         setActiveTab("tool");
//                       }}
//                     />
//                   )
//                   : (
//                     <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
//                       <div className="text-4xl mb-4">🧪</div>
//                       <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to access your workspace</h3>
//                       <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">Save explanations, track practice progress, and build your personal chemistry knowledge base.</p>
//                       <Link href="/sign-in?redirect_url=/tools/chemistry-engine"
//                         className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors"
//                         style={{ backgroundColor: ACCENT }}>Sign in — it's free</Link>
//                     </div>
//                   )
//                 }
//               </motion.div>
//             )}

//             {/* GUIDE tab */}
//             {activeTab === "guide" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
//                 <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the Chemistry Understanding Engine</h2>
//                 {HOW_IT_WORKS.map((s, i) => (
//                   <div key={s.step} className="flex gap-6 pb-10 relative">
//                     {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
//                     <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10 text-white" style={{ backgroundColor: ACCENT }}>{s.step}</div>
//                     <div><h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3><p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p></div>
//                   </div>
//                 ))}
//                 <div className="mt-4 border rounded-xs p-6" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
//                   <h3 className="text-base font-bold mb-3" style={{ color: "#064e3b" }}>💡 Getting the most out of it</h3>
//                   <ul className="space-y-2">
//                     {[
//                       "The Particles tab is the most important one — if you can explain what atoms and electrons are doing, you can answer any exam question on that topic.",
//                       "The Misconceptions tab first — correct your wrong model before building on it.",
//                       "After reading, try to draw the particle model from memory. If you can draw it, you understand it.",
//                       "Use Theory Explorer for revision: explore a whole branch like 'Thermochemistry' in one session.",
//                       "The Tutor works best with specific questions: 'Why does a higher temperature increase reaction rate at the particle level?'",
//                     ].map((tip) => (
//                       <li key={tip} className="flex items-start gap-2 text-sm" style={{ color: "#064e3b" }}>
//                         <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />{tip}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </motion.div>
//             )}

//             {/* REVIEWS tab */}
//             {activeTab === "reviews" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
//                 <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
//                 {REVIEWS.map((r) => (
//                   <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ACCENT }}>{r.avatar}</div>
//                         <div><p className="text-sm font-bold text-gray-900">{r.name}</p><p className="text-xs text-gray-400">{r.role}</p></div>
//                       </div>
//                       <div className="text-right"><StarRow rating={r.rating} /><p className="text-xs text-gray-400 mt-1">{r.date}</p></div>
//                     </div>
//                     <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
//                   </div>
//                 ))}
//               </motion.div>
//             )}
//           </div>

//           {/* Sidebar */}
//           <aside className="lg:col-span-1">
//             <div className="lg:sticky lg:top-36 space-y-5">
//               <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
//                 {TABS.map((t) => (
//                   <button key={t.id} onClick={() => setActiveTab(t.id)}
//                     className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
//                     <t.icon className="w-4 h-4" />{t.label}
//                   </button>
//                 ))}
//               </div>

//               <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}05`, borderColor: `${ACCENT}20` }}>
//                 <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>Why chemistry is hard</p>
//                 {[
//                   { text: "Students memorise without understanding the particle level",      color: "#ef4444" },
//                   { text: "Formulas are taught without explaining why they work",            color: "#f59e0b" },
//                   { text: "Misconceptions are never directly named and corrected",            color: "#8b5cf6" },
//                   { text: "No connection is made between atoms, equations, and real life",   color: "#10b981" },
//                 ].map((s, i) => (
//                   <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
//                     <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: s.color }} />
//                     <p className="text-xs leading-relaxed" style={{ color: "#064e3b" }}>{s.text}</p>
//                   </div>
//                 ))}
//               </div>

//               {related.length > 0 && (
//                 <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Education Tools</p>
//                   <div className="space-y-3">
//                     {related.map((t) => (
//                       <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
//                         <span className="text-xl shrink-0">{t.icon}</span>
//                         <div className="min-w-0">
//                           <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p>
//                           <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
//                         </div>
//                         <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 transition-all shrink-0" />
//                       </Link>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               <Link href="/tools" className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xs transition-all">
//                 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />All Tools
//               </Link>
//             </div>
//           </aside>
//         </div>

//         {related.length > 0 && (
//           <div className="mt-20 pt-12 border-t border-gray-100">
//             <div className="flex items-center justify-between mb-8">
//               <h2 className="text-2xl font-black text-gray-900">More Education Tools</h2>
//               <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">See all <ArrowRight className="w-4 h-4" /></Link>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//               {related.map((t) => <ToolCard key={t.id} tool={t} />)}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* ── NEW: Insufficient Tokens Modal ─────────────────────────────────── */}
//         <InsufficientTokensModal
//           open={!!tokenModal}
//           onClose={() => setTokenModal(null)}
//           required={tokenModal?.required ?? 0}
//           balance={tokenModal?.balance   ?? 0}
//           toolName={tokenModal?.toolName ?? undefined}
//           onPlayGame={() => {
//             setTokenModal(null);
//             router.push("/games"); // or open game overlay via context
//           }}
//         />
//     </div>
//   );
// }