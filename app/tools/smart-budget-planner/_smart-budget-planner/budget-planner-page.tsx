"use client";

// =============================================================================
// isaacpaha.com — Smart Budget Survival Planner — Page Shell
// app/tools/smart-budget-planner/_components/budget-planner-page.tsx
// =============================================================================

import React, { useState }     from "react";
import Link                    from "next/link";
import { motion }              from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, ArrowRight, Shield, TrendingUp,
  Sparkles, Info, DollarSign, Target, Calendar, Scissors,
} from "lucide-react";
import { BudgetPlannerTool, TokenGateInfo } from "./budget-planner-tool";
import { ToolCard } from "../../_tools/tools-card";
import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter } from "next/navigation";
import type { NormalisedTool } from "../../_tools/tools-lab-client";
import { ToolViewTracker } from "../../_tools/tool-view-tracker";
import { ToolReviews } from "../../_tools/tool-reviews";

// ─── How it works steps ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Set your budget & timeframe", desc: "Enter how much money you have and how many days it needs to last. That's the most important number — everything else flows from it." },
  { step: "02", title: "Add your fixed costs", desc: "List unavoidable expenses: rent, bills, transport, subscriptions. These come off the top automatically so you can see exactly what's left to work with." },
  { step: "03", title: "Add your flexible spending", desc: "List variable expenses — food, entertainment, miscellaneous. Be honest. The plan only works if the numbers are real." },
  { step: "04", title: "Get your survival plan", desc: "Instantly receive: your daily limit, risk assessment, week-by-week breakdown, category allocations, specific cut suggestions, and scenario simulations." },
  { step: "05", title: "Ask your AI Budget Coach", desc: "The coach knows your full financial picture. Ask \"Can I afford a £30 night out?\" or \"What should I cut first?\" — and get a specific, honest answer." },
];

function ReadingProgress() {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const el = document.documentElement; setW(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100))); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full bg-indigo-500 transition-[width] duration-100" style={{ width: `${w}%` }} /></div>;
}

function StarRow({ rating }: { rating: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=rating?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}</div>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BudgetPlannerPageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;         // ← from DB via server page
  relatedTools: NormalisedTool[];       // ← same category, from DB
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BudgetPlannerPage({ isSignedIn, tool, relatedTools }: BudgetPlannerPageProps) {
  const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
  const [copied,    setCopied]    = useState(false);
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
  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "💰", color: "#6366f1" };

  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const TABS = [
    { id: "tool",    label: "Plan My Budget", icon: Sparkles      },
    { id: "guide",   label: "How It Works",   icon: BookOpen      },
    { id: "reviews", label: "Reviews",        icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress />

      {/* ── View tracker — fires once on mount, increments DB viewCount ── */}
      <ToolViewTracker toolId={tool.id} />

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none"
        style={{ backgroundColor: tool.accentColor }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: tool.name, href: "#" }].map((bc, i) => (
            <React.Fragment key={bc.label}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              {bc.href === "#" ? <span className="text-gray-600 font-medium truncate max-w-[200px]">{bc.label}</span>
                : <Link href={bc.href} className="hover:text-gray-700 transition-colors">{bc.label}</Link>}
            </React.Fragment>
          ))}
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
                style={{ backgroundColor: `${tool.accentColor}10`, borderColor: `${tool.accentColor}30` }}
              >
                {tool.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: catCfg.color }}>
                    {catCfg.icon} {tool.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border"
                    style={{ backgroundColor: `${tool.accentColor}10`, borderColor: `${tool.accentColor}30`, color: tool.accentColor }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: tool.accentColor }} />
                    Live
                  </span>
                  {tool.isNew && (
                    <span className="text-[9px] font-black tracking-widest uppercase text-white px-2 py-0.5 rounded-xs"
                      style={{ backgroundColor: tool.accentColor }}>
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
                  <Users className="w-4 h-4" style={{ color: tool.accentColor }} />
                  {tool.usageCount.toLocaleString()} plans created
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
                <span className="flex items-center gap-1.5 font-semibold"
                  style={{ color: tool.accentColor }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tool.accentColor }} />
                  Free
                </span>
              )}
            </div>

            {/* Features */}
            {tool.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tool.features.map((f) => (
                  <span key={f}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                    <Check className="w-3 h-3" style={{ color: tool.accentColor }} />{f}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: tool.accentColor }}>
                <Sparkles className="w-4 h-4" />Plan My Budget
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right card */}
          <div className="hidden lg:block">
            <div className="rounded-xs p-5 border"
              style={{ backgroundColor: `${tool.accentColor}08`, borderColor: `${tool.accentColor}25` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4"
                style={{ color: tool.accentColor }}>
                The question this tool answers
              </p>
              <div className="space-y-3 mb-5">
                {[
                  { q: '"Can I survive on £500 for 30 days?"',    ans: "Yes — here's your daily limit"      },
                  { q: '"What if I earn £200 extra next week?"',  ans: "Extends your runway"              },
                  { q: '"Can I afford a £40 night out Saturday?"',ans: "Not this week — but in 2 weeks, yes"        },
                ].map((qa, i) => (
                  <div key={i} className="bg-white rounded-xs border p-3"
                    style={{ borderColor: `${tool.accentColor}20` }}>
                    <p className="text-xs font-semibold text-stone-700 italic mb-1">{qa.q}</p>
                    <p className="text-xs font-black" style={{ color: tool.accentColor }}>→ {qa.ans}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px]" style={{ color: tool.accentColor }}>
                Real answers to real questions — based on your actual numbers, not generic advice.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "text-gray-900 border-current"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
              style={activeTab === t.id ? { borderColor: tool.accentColor, color: tool.accentColor } : {}}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {/* TOOL */}
            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
                    style={{ backgroundColor: `${tool.accentColor}06` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tool.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{tool.name}</p>
                        <p className="text-xs text-gray-400">{tool.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs border"
                      style={{ color: tool.accentColor, backgroundColor: `${tool.accentColor}10`, borderColor: `${tool.accentColor}20` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: tool.accentColor }} />
                      Live
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <BudgetPlannerTool 
                      isSignedIn={isSignedIn}
                      onInsufficientTokens={(info) => setTokenModal(info)}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This tool provides planning and guidance support, not regulated financial advice. Calculations are based on the figures you enter. For serious financial difficulty, contact <a href="https://www.stepchange.org" target="_blank" rel="noopener noreferrer" className="underline">StepChange</a> (UK) or a qualified financial advisor.
                  </p>
                </div>
              </motion.div>
            )}

            {/* HOW IT WORKS */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the {tool.name}</h2>
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ backgroundColor: `${tool.accentColor}10`, color: tool.accentColor }}>{step.step}</div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 rounded-xs p-6 border"
                  style={{ backgroundColor: `${tool.accentColor}06`, borderColor: `${tool.accentColor}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: tool.accentColor }}>
                    💡 Get the most out of your plan
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "Use real numbers — if your actual food spend is £200/mo, put £200, not what you wish it was.",
                      "The risk indicator is honest, not alarming. 'Tight' means workable, not hopeless.",
                      "Run the Emergency Mode scenario — knowing your absolute minimum is powerful even if you never use it.",
                      "Screenshot the sharecard. Telling people about your budget keeps you accountable.",
                      "Use the AI Coach daily during tight periods — ask small, specific questions.",
                    ].map(tip => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-stone-700">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tool.accentColor }} />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* REVIEWS — now using the reusable DB-connected component */}
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
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${
                      activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              <div className="rounded-xs p-5 border"
                style={{ backgroundColor: `${tool.accentColor}06`, borderColor: `${tool.accentColor}20` }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4"
                  style={{ color: tool.accentColor }}>
                  Why this hits different
                </p>
                {[
                  { icon: Target,   text: "Specific daily numbers — not vague advice",            color: "#6366f1" },
                  { icon: Shield,   text: "Honest risk assessment without judgment",               color: "#f59e0b" },
                  { icon: Scissors, text: "Tells you exactly where to cut and by how much",       color: "#ef4444" },
                  { icon: Zap,      text: "Scenario testing shows impact of each choice in real time", color: "#10b981" },
                ].map(s => (
                  <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                    <p className="text-xs text-stone-700 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>

              {relatedTools.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    More {tool.category} Tools
                  </p>
                  <div className="space-y-3">
                    {relatedTools.map((t) => (
                      <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all shrink-0" />
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

        {/* Related */}
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
// // isaacpaha.com — Smart Budget Survival Planner — Page Shell
// // app/tools/smart-budget-planner/_components/budget-planner-page.tsx
// // =============================================================================

// import React, { useState }     from "react";
// import Link                    from "next/link";
// import { motion }              from "framer-motion";
// import {
//   ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
//   MessageSquare, BookOpen, Zap, ArrowRight, Shield, TrendingUp,
//   Sparkles, Info, DollarSign, Target, Calendar, Scissors,
// } from "lucide-react";
// import { TOOLS, TOOL_CATEGORIES } from "@/lib/data/tools-data";
// import { BudgetPlannerTool, TokenGateInfo } from "./budget-planner-tool";
// import { ToolCard } from "../../_tools/tools-card";
// import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
// import { useRouter } from "next/navigation";


// const TOOL = TOOLS.find((t) => t.slug === "smart-budget-planner")!;

// const HOW_IT_WORKS = [
//   { step: "01", title: "Set your budget & timeframe", desc: "Enter how much money you have and how many days it needs to last. That's the most important number — everything else flows from it." },
//   { step: "02", title: "Add your fixed costs", desc: "List unavoidable expenses: rent, bills, transport, subscriptions. These come off the top automatically so you can see exactly what's left to work with." },
//   { step: "03", title: "Add your flexible spending", desc: "List variable expenses — food, entertainment, miscellaneous. Be honest. The plan only works if the numbers are real." },
//   { step: "04", title: "Get your survival plan", desc: "Instantly receive: your daily limit, risk assessment, week-by-week breakdown, category allocations, specific cut suggestions, and scenario simulations." },
//   { step: "05", title: "Ask your AI Budget Coach", desc: "The coach knows your full financial picture. Ask \"Can I afford a £30 night out?\" or \"What should I cut first?\" — and get a specific, honest answer." },
// ];

// const REVIEWS = [
//   { name: "Alicia T.", role: "University student",        avatar: "AT", rating: 5, date: "1 week ago",  body: "I had £350 left until my loan came in and no idea how to make it last 5 weeks. This told me I had £10/day and which categories to cut. I made it — with £22 to spare." },
//   { name: "Marcus J.", role: "Freelancer between projects", avatar: "MJ", rating: 5, date: "2 weeks ago", body: "The scenario testing is the feature I didn't know I needed. I found out that cutting £60 of takeaways extends my runway by 8 days. That kind of specific information changes your behaviour." },
//   { name: "Priya K.", role: "NHS Worker",                   avatar: "PK", rating: 5, date: "3 weeks ago", body: "What I love most is that it doesn't make you feel judged. It just gives you a plan. The survival tips are actually useful — not obvious things like 'make coffee at home'." },
//   { name: "Danny O.", role: "Graduate job seeker",          avatar: "DO", rating: 4, date: "1 month ago", body: "Used this while waiting to start my first job. Having a written plan stopped the panic. The AI coach answered 'can I afford a train home for Christmas?' with actual numbers. Really helpful." },
// ];

// function ReadingProgress() {
//   const [w, setW] = React.useState(0);
//   React.useEffect(() => {
//     const h = () => { const el = document.documentElement; setW(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100))); };
//     window.addEventListener("scroll", h, { passive: true });
//     return () => window.removeEventListener("scroll", h);
//   }, []);
//   return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full bg-indigo-500 transition-[width] duration-100" style={{ width: `${w}%` }} /></div>;
// }

// function StarRow({ rating }: { rating: number }) {
//   return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=rating?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}</div>;
// }

// interface Props { isSignedIn: boolean; }

// export function BudgetPlannerPage({ isSignedIn }: Props) {
//   const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
//   const [copied,    setCopied]    = useState(false);
//   const router = useRouter();

//   // ── NEW: token modal state ────────────────────────────────────────────────
//       const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);

//   const category = TOOL_CATEGORIES.find(c => c.name === TOOL?.category);
//   const related  = TOOLS.filter(t => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);

//   if (!TOOL) return null;

//   const handleShare = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };

//   const TABS = [
//     { id: "tool",    label: "Plan My Budget", icon: Sparkles      },
//     { id: "guide",   label: "How It Works",   icon: BookOpen      },
//     { id: "reviews", label: "Reviews",        icon: MessageSquare },
//   ] as const;

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       <ReadingProgress />
//       <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
//         style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
//       <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none bg-indigo-400" />

//       <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

//         {/* Breadcrumbs */}
//         <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
//           {[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: TOOL.name, href: "#" }].map((bc, i) => (
//             <React.Fragment key={bc.label}>
//               {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
//               {bc.href === "#" ? <span className="text-gray-600 font-medium truncate max-w-[200px]">{bc.label}</span>
//                 : <Link href={bc.href} className="hover:text-gray-700 transition-colors">{bc.label}</Link>}
//             </React.Fragment>
//           ))}
//         </nav>

//         {/* Hero */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
//           <div className="lg:col-span-2">
//             <div className="flex items-center gap-3 mb-5">
//               <div className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
//                 style={{ backgroundColor: "#6366f110", borderColor: "#6366f130" }}>💸</div>
//               <div>
//                 <div className="flex flex-wrap items-center gap-2 mb-1">
//                   <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
//                   <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-indigo-50 border-indigo-200 text-indigo-700">
//                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />Live
//                   </span>
//                   <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-500 text-white px-2 py-0.5 rounded-xs">NEW</span>
//                 </div>
//                 <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
//               </div>
//             </div>

//             <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

//             <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
//               <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-400" />{TOOL.usageCount.toLocaleString()} plans created</span>
//               <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{TOOL.ratingAvg.toFixed(1)} ({TOOL.ratingCount} reviews)</span>
//               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
//               <span className="flex items-center gap-1.5 text-indigo-600 font-semibold"><span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />Free</span>
//             </div>

//             <div className="flex flex-wrap gap-2 mb-6">
//               {TOOL.features.map(f => (
//                 <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
//                   <Check className="w-3 h-3 text-indigo-400" />{f}
//                 </span>
//               ))}
//             </div>

//             <div className="flex items-center gap-3 flex-wrap">
//               <button onClick={() => setActiveTab("tool")}
//                 className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xs transition-colors shadow-sm">
//                 <Sparkles className="w-4 h-4" />Plan My Budget
//               </button>
//               <button onClick={handleShare}
//                 className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
//                 {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
//                 {copied ? "Copied!" : "Share"}
//               </button>
//             </div>
//           </div>

//           {/* Right card */}
//           <div className="hidden lg:block">
//             <div className="bg-indigo-50 border border-indigo-200 rounded-xs p-5">
//               <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-4">The question this tool answers</p>
//               <div className="space-y-3 mb-5">
//                 {[
//                   { q: '"Can I survive on £500 for 30 days?"',    ans: "Yes — here's your daily limit: £8.20"      },
//                   { q: '"What if I earn £200 extra next week?"',  ans: "Extends your runway by 9 days"              },
//                   { q: '"Can I afford a £40 night out Saturday?"',ans: "Not this week — but in 2 weeks, yes"        },
//                 ].map((qa, i) => (
//                   <div key={i} className="bg-white rounded-xs border border-indigo-100 p-3">
//                     <p className="text-xs font-semibold text-stone-700 italic mb-1">{qa.q}</p>
//                     <p className="text-xs font-black text-indigo-700">→ {qa.ans}</p>
//                   </div>
//                 ))}
//               </div>
//               <p className="text-[11px] text-indigo-600 leading-relaxed">
//                 Real answers to real questions — based on your actual numbers, not generic advice.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
//           {TABS.map(t => (
//             <button key={t.id} onClick={() => setActiveTab(t.id)}
//               className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
//                 activeTab === t.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-700"
//               }`}>
//               <t.icon className="w-4 h-4" />{t.label}
//             </button>
//           ))}
//         </div>

//         {/* Content */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">

//             {/* TOOL */}
//             {activeTab === "tool" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
//                   <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#6366f106" }}>
//                     <div className="flex items-center gap-3">
//                       <span className="text-xl">💸</span>
//                       <div>
//                         <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
//                         <p className="text-xs text-gray-400">{TOOL.tagline}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xs">
//                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />Live
//                     </div>
//                   </div>
//                   <div className="p-6 md:p-8">
//                     <BudgetPlannerTool 
//                       isSignedIn={isSignedIn}
//                       onInsufficientTokens={(info) => setTokenModal(info)}
//                     />
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
//                   <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
//                   <p className="text-xs text-amber-800 leading-relaxed">
//                     This tool provides planning and guidance support, not regulated financial advice. Calculations are based on the figures you enter. For serious financial difficulty, contact <a href="https://www.stepchange.org" target="_blank" rel="noopener noreferrer" className="underline">StepChange</a> (UK) or a qualified financial advisor.
//                   </p>
//                 </div>
//               </motion.div>
//             )}

//             {/* HOW IT WORKS */}
//             {activeTab === "guide" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
//                 <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the Budget Survival Planner</h2>
//                 {HOW_IT_WORKS.map((step, i) => (
//                   <div key={step.step} className="flex gap-6 pb-10 relative">
//                     {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
//                     <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
//                       style={{ backgroundColor: "#6366f110", color: "#6366f1" }}>{step.step}</div>
//                     <div>
//                       <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
//                       <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//                 <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xs p-6">
//                   <h3 className="text-base font-bold text-indigo-900 mb-3">💡 Get the most out of your plan</h3>
//                   <ul className="space-y-2">
//                     {[
//                       "Use real numbers — if your actual food spend is £200/mo, put £200, not what you wish it was.",
//                       "The risk indicator is honest, not alarming. 'Tight' means workable, not hopeless.",
//                       "Run the Emergency Mode scenario — knowing your absolute minimum is powerful even if you never use it.",
//                       "Screenshot the sharecard. Telling people about your budget keeps you accountable.",
//                       "Use the AI Coach daily during tight periods — ask small, specific questions.",
//                     ].map(tip => (
//                       <li key={tip} className="flex items-start gap-2 text-sm text-indigo-800">
//                         <Check className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />{tip}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </motion.div>
//             )}

//             {/* REVIEWS */}
//             {activeTab === "reviews" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
//                 <div className="flex items-center justify-between">
//                   <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
//                   <div className="flex items-center gap-2"><StarRow rating={5} /><span className="text-sm font-bold text-gray-700">{TOOL.ratingAvg.toFixed(1)}</span><span className="text-sm text-gray-400">({TOOL.ratingCount})</span></div>
//                 </div>
//                 {REVIEWS.map(r => (
//                   <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{r.avatar}</div>
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
//                 {TABS.map(t => (
//                   <button key={t.id} onClick={() => setActiveTab(t.id)}
//                     className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
//                     <t.icon className="w-4 h-4" />{t.label}
//                   </button>
//                 ))}
//               </div>

//               <div className="bg-indigo-50 border border-indigo-100 rounded-xs p-5">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-4">Why this hits different</p>
//                 {[
//                   { icon: Target,   text: "Specific daily numbers — not vague advice",            color: "#6366f1" },
//                   { icon: Shield,   text: "Honest risk assessment without judgment",               color: "#f59e0b" },
//                   { icon: Scissors, text: "Tells you exactly where to cut and by how much",       color: "#ef4444" },
//                   { icon: Zap,      text: "Scenario testing shows impact of each choice in real time", color: "#10b981" },
//                 ].map(s => (
//                   <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
//                     <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
//                     <p className="text-xs text-indigo-800 leading-relaxed">{s.text}</p>
//                   </div>
//                 ))}
//               </div>

//               {related.length > 0 && (
//                 <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Finance Tools</p>
//                   <div className="space-y-3">
//                     {related.map(t => (
//                       <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
//                         <span className="text-xl shrink-0">{t.icon}</span>
//                         <div className="min-w-0"><p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p><p className="text-xs text-gray-400 truncate">{t.tagline}</p></div>
//                         <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all shrink-0" />
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

//         {/* Related */}
//         {related.length > 0 && (
//           <div className="mt-20 pt-12 border-t border-gray-100">
//             <div className="flex items-center justify-between mb-8">
//               <h2 className="text-2xl font-black text-gray-900">More Finance Tools</h2>
//               <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">See all <ArrowRight className="w-4 h-4" /></Link>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{related.map(t => <ToolCard key={t.id} tool={t} />)}</div>
//           </div>
//         )}
//       </div>

//       {/* ── NEW: Insufficient Tokens Modal ─────────────────────────────────── */}
//           <InsufficientTokensModal
//             open={!!tokenModal}
//             onClose={() => setTokenModal(null)}
//             required={tokenModal?.required ?? 0}
//             balance={tokenModal?.balance   ?? 0}
//             toolName={tokenModal?.toolName ?? undefined}
//             onPlayGame={() => {
//               setTokenModal(null);
//               router.push("/games"); // or open game overlay via context
//             }}
//           />
//     </div>
//   );
// }