"use client";

// =============================================================================
// isaacpaha.com — AI Debt Recovery Planner — Page Shell
// app/tools/debt-recovery-planner/_components/debt-planner-page.tsx
// =============================================================================

import React, { useState }    from "react";
import Link                    from "next/link";
import { motion }              from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, ArrowRight, Shield, TrendingDown,
  TrendingUp, Sparkles, Heart, AlertTriangle, Info,
  Link2Icon,
} from "lucide-react";
import { DebtPlannerTool, TokenGateInfo } from "./debt-planner-tool";
import { DebtDashboard } from "./debt-dashboard";
import { ToolCard } from "../../_tools/tools-card";
import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter } from "next/navigation";
import type { NormalisedTool } from "../../_tools/tools-lab-client";
import { ToolViewTracker } from "../../_tools/tool-view-tracker";
import { ToolReviews } from "../../_tools/tool-reviews";

// ─── How it works steps ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enter your debts",
    desc:  "List each debt with its balance and type. Adding the interest rate (APR) and minimum payment unlocks more accurate calculations — but they're optional.",
  },
  {
    step: "02",
    title: "Add income & expenses",
    desc:  "Enter your monthly take-home income and what you spend on essentials and variable costs. The tool calculates your monthly surplus automatically.",
  },
  {
    step: "03",
    title: "Choose your strategy",
    desc:  "Snowball (smallest debt first for quick wins), Avalanche (highest interest first to save money), or let the AI suggest the best approach for your specific situation.",
  },
  {
    step: "04",
    title: "Receive your personalised plan",
    desc:  "In ~10 seconds: your full roadmap, estimated payoff date, month-by-month breakdown, weekly action steps, and scenario simulations.",
  },
  {
    step: "05",
    title: "Talk to your AI coach",
    desc:  "Ask questions, run scenarios, get budgeting advice — the AI coach knows your financial situation and gives specific, relevant guidance.",
  },
];

function ReadingProgress({ accentColor }: { accentColor: string }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => {
      const el = document.documentElement;
      setW(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)));
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent"><div className="h-full transition-[width] duration-100" style={{ width: `${w}%`, backgroundColor: accentColor }} /></div>;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=rating?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DebtPlannerPageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;         // ← from DB via server page
  relatedTools: NormalisedTool[];       // ← same category, from DB
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DebtPlannerPage({ isSignedIn, tool, relatedTools }: DebtPlannerPageProps) {
  const [activeTab, setActiveTab] = useState<"tool" | "dashboard" | "guide" | "reviews">("tool");
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
  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "💰", color: "#14b8a6" };
  const ACCENT = tool.accentColor;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS = [
    { id: "tool",      label: "Get My Plan",    icon: Sparkles      },
    ...(isSignedIn ? [{ id: "dashboard", label: "My Progress", icon: TrendingDown }] as const : []),
    { id: "guide",     label: "How It Works",   icon: BookOpen      },
    { id: "reviews",   label: "Reviews",        icon: MessageSquare },
  ] as const satisfies readonly { id: "tool" | "dashboard" | "guide" | "reviews"; label: string; icon: any }[];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress accentColor={ACCENT} />

      {/* ── View tracker — fires once on mount, increments DB viewCount ── */}
      <ToolViewTracker toolId={tool.id} />

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      />
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
                style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
                {tool.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: catCfg.color }}>
                    {catCfg.icon} {tool.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border"
                    style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: ACCENT }}>
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
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: ACCENT }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Free
                </span>
              )}
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

            {/* Important disclaimer CTA */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xs px-4 py-3 mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-bold">Planning tool, not financial advice.</span> For serious debt difficulties, please contact{" "}
                <a href="https://www.stepchange.org" target="_blank" rel="noopener noreferrer" className="underline font-bold">StepChange</a>,{" "}
                <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer" className="underline font-bold">Citizens Advice</a>, or a qualified financial adviser.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: ACCENT }}>
                <Sparkles className="w-4 h-4" />Get My Recovery Plan
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("dashboard")}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs transition-colors border"
                  style={{ color: ACCENT, borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}08` }}>
                  <TrendingDown className="w-4 h-4" />My Progress
                </button>
              )}
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right sidebar card */}
          <div className="hidden lg:block">
            <div className="rounded-xs p-5 border" style={{ backgroundColor: `${ACCENT}08`, borderColor: `${ACCENT}25` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>What you get</p>
              <div className="space-y-3">
                {[
                  { emoji:"📅", label:"Full Roadmap",         desc:"Month-by-month until debt-free"       },
                  { emoji:"💸", label:"Payment Strategy",     desc:"Snowball or Avalanche explained"      },
                  { emoji:"🎯", label:"Weekly Actions",       desc:"5 specific things to do this week"    },
                  { emoji:"📊", label:"Scenario Simulator",   desc:"What if I pay £100 more per month?"   },
                  { emoji:"🤖", label:"AI Financial Coach",   desc:"Conversational guidance anytime"      },
                  { emoji:"🏆", label:"Micro Goals",          desc:"Celebrate progress milestones"        },
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
                activeTab === t.id
                  ? "text-gray-900 border-current"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
              style={activeTab === t.id ? { borderColor: ACCENT, color: ACCENT } : {}}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {/* TOOL */}
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
                      style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}20` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <DebtPlannerTool 
                      isSignedIn={isSignedIn} 
                      onInsufficientTokens={(info) => setTokenModal(info)} 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? <DebtDashboard />
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <div className="text-4xl mb-4">🔒</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to track your progress</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                        Save your plan, log payments, and watch your debt decrease month by month.
                      </p>
                      <Link href="/sign-in?redirect_url=/tools/debt-recovery-planner"
                        className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors"
                        style={{ backgroundColor: ACCENT }}>
                        Sign in — it's free
                      </Link>
                    </div>
                  )
                }
              </motion.div>
            )}

            {/* GUIDE */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the {tool.name}</h2>
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ backgroundColor: `${ACCENT}10`, color: ACCENT }}>
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
                {/* Key principle */}
                <div className="rounded-xs p-6 border" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: ACCENT }}>💡 The most important thing to understand</h3>
                  <p className="text-sm text-stone-700 leading-relaxed mb-3">
                    Debt repayment isn't about being perfect — it's about being consistent. A realistic plan you actually follow beats an aggressive plan you abandon in month 2.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Enter real numbers — an honest picture leads to a realistic plan",
                      "The plan is a guide, not a contract — life happens, adjust and keep going",
                      "Every extra £10 you put toward debt compounds significantly over time",
                      "The date you'll be debt-free is a real number — hold onto it on hard days",
                    ].map(tip => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-stone-700">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* REVIEWS */}
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

          {/* Right sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab===t.id?"bg-gray-900 text-white font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xs p-5">
                <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-3">In serious difficulty?</p>
                <p className="text-xs text-red-700 mb-3 leading-relaxed">If you're struggling to meet minimum payments or feeling overwhelmed, please reach out to a free debt charity. They're non-judgmental and genuinely helpful.</p>
                <div className="space-y-2">
                  {[
                    { name: "StepChange", url: "https://www.stepchange.org",         desc: "Free debt advice (UK)"     },
                    { name: "Citizens Advice", url: "https://www.citizensadvice.org.uk", desc: "Free advice (UK)"         },
                    { name: "National Debtline", url: "https://www.nationaldebtline.org", desc: "Free helpline (UK)"       },
                  ].map(r => (
                    <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between text-xs text-red-700 hover:text-red-900 transition-colors">
                      <span className="font-semibold">{r.name}</span>
                      <span className="text-red-400 text-[10px]">{r.desc} →</span>
                    </a>
                  ))}
                </div>
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

        {/* Related tools grid */}
        {relatedTools.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">More {tool.category} Tools</h2>
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedTools.map(t => <ToolCard key={t.id} tool={t} />)}
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
// // isaacpaha.com — AI Debt Recovery Planner — Page Shell
// // app/tools/debt-recovery-planner/_components/debt-planner-page.tsx
// // =============================================================================

// import React, { useState }    from "react";
// import Link                    from "next/link";
// import { motion }              from "framer-motion";
// import {
//   ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
//   MessageSquare, BookOpen, Zap, ArrowRight, Shield, TrendingDown,
//   TrendingUp, Sparkles, Heart, AlertTriangle, Info,
//   Link2Icon,
// } from "lucide-react";
// import { TOOLS, TOOL_CATEGORIES } from "@/lib/data/tools-data";
// import { DebtPlannerTool, TokenGateInfo } from "./debt-planner-tool";
// import { DebtDashboard } from "./debt-dashboard";
// import { ToolCard } from "../../_tools/tools-card";
// import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
// import { useRouter } from "next/navigation";


// const TOOL = TOOLS.find((t) => t.slug === "debt-recovery-planner")!;

// const HOW_IT_WORKS = [
//   {
//     step: "01",
//     title: "Enter your debts",
//     desc:  "List each debt with its balance and type. Adding the interest rate (APR) and minimum payment unlocks more accurate calculations — but they're optional.",
//   },
//   {
//     step: "02",
//     title: "Add income & expenses",
//     desc:  "Enter your monthly take-home income and what you spend on essentials and variable costs. The tool calculates your monthly surplus automatically.",
//   },
//   {
//     step: "03",
//     title: "Choose your strategy",
//     desc:  "Snowball (smallest debt first for quick wins), Avalanche (highest interest first to save money), or let the AI suggest the best approach for your specific situation.",
//   },
//   {
//     step: "04",
//     title: "Receive your personalised plan",
//     desc:  "In ~10 seconds: your full roadmap, estimated payoff date, month-by-month breakdown, weekly action steps, and scenario simulations.",
//   },
//   {
//     step: "05",
//     title: "Talk to your AI coach",
//     desc:  "Ask questions, run scenarios, get budgeting advice — the AI coach knows your financial situation and gives specific, relevant guidance.",
//   },
// ];

// const REVIEWS = [
//   {
//     name: "Rachel T.", role: "NHS Worker",    avatar: "RT", rating: 5, date: "2 weeks ago",
//     body: "I had £14,000 of debt and felt completely paralysed. This tool broke it down into monthly steps with a realistic 28-month plan. Seeing the actual date I'd be debt-free changed everything for me.",
//   },
//   {
//     name: "Jordan M.", role: "Freelancer",    avatar: "JM", rating: 5, date: "3 weeks ago",
//     body: "The scenario simulations are brilliant. I discovered that if I put just £150 extra per month toward debt, I'd be free 11 months earlier. That clarity motivated me to find the extra income.",
//   },
//   {
//     name: "Priya S.",  role: "Teacher",       avatar: "PS", rating: 5, date: "1 month ago",
//     body: "The AI coach is surprisingly helpful. I asked 'can I afford a new phone?' and it ran through my numbers and gave me a specific answer. It doesn't lecture you — it just helps you think clearly.",
//   },
//   {
//     name: "Owen C.",   role: "Graduate",      avatar: "OC", rating: 4, date: "1 month ago",
//     body: "Used to dread looking at my bank account. The roadmap made me realise I wasn't as far from debt-free as I thought. The weekly action steps are practical, not preachy.",
//   },
// ];

// function ReadingProgress() {
//   const [w, setW] = React.useState(0);
//   React.useEffect(() => {
//     const h = () => {
//       const el = document.documentElement;
//       setW(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)));
//     };
//     window.addEventListener("scroll", h, { passive: true });
//     return () => window.removeEventListener("scroll", h);
//   }, []);
//   return <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent"><div className="h-full bg-teal-500 transition-[width] duration-100" style={{ width: `${w}%` }} /></div>;
// }

// function StarRow({ rating }: { rating: number }) {
//   return (
//     <div className="flex gap-0.5">
//       {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=rating?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}
//     </div>
//   );
// }

// interface Props { isSignedIn: boolean; }

// export function DebtPlannerPage({ isSignedIn }: Props) {
//   const [activeTab, setActiveTab] = useState<"tool" | "dashboard" | "guide" | "reviews">("tool");
//   const [copied,    setCopied]    = useState(false);
//   const router = useRouter();
  
//   // ── NEW: token modal state ────────────────────────────────────────────────
//     const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);

//   const category = TOOL_CATEGORIES.find(c => c.name === TOOL?.category);
//   const related  = TOOLS.filter(t => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);

//   if (!TOOL) return null;

//   const handleShare = () => {
//     navigator.clipboard.writeText(window.location.href);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const TABS = [
//     { id: "tool",      label: "Get My Plan",    icon: Sparkles      },
//     ...(isSignedIn ? [{ id: "dashboard", label: "My Progress", icon: TrendingDown }] as const : []),
//     { id: "guide",     label: "How It Works",   icon: BookOpen      },
//     { id: "reviews",   label: "Reviews",        icon: MessageSquare },
//   ] as const satisfies readonly { id: "tool" | "dashboard" | "guide" | "reviews"; label: string; icon: any }[];

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       <ReadingProgress />

//       <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
//         style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }}
//       />
//       <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none bg-teal-400" />

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
//                 style={{ backgroundColor: "#14b8a610", borderColor: "#14b8a630" }}>
//                 💰
//               </div>
//               <div>
//                 <div className="flex flex-wrap items-center gap-2 mb-1">
//                   <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
//                   <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-teal-50 border-teal-200 text-teal-700">
//                     <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />Live
//                   </span>
//                   <span className="text-[9px] font-black tracking-widest uppercase bg-teal-500 text-white px-2 py-0.5 rounded-xs">NEW</span>
//                 </div>
//                 <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
//               </div>
//             </div>

//             <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

//             <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
//               <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-teal-400" />{TOOL.usageCount.toLocaleString()} plans created</span>
//               <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{TOOL.ratingAvg.toFixed(1)} ({TOOL.ratingCount} reviews)</span>
//               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
//               <span className="flex items-center gap-1.5 text-teal-600 font-semibold"><span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />Free</span>
//             </div>

//             <div className="flex flex-wrap gap-2 mb-6">
//               {TOOL.features.map(f => (
//                 <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
//                   <Check className="w-3 h-3 text-teal-400" />{f}
//                 </span>
//               ))}
//             </div>

//             {/* Important disclaimer CTA */}
//             <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xs px-4 py-3 mb-5">
//               <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
//               <p className="text-xs text-amber-800 leading-relaxed">
//                 <span className="font-bold">Planning tool, not financial advice.</span> For serious debt difficulties, please contact{" "}
//                 <a href="https://www.stepchange.org" target="_blank" rel="noopener noreferrer" className="underline font-bold">StepChange</a>,{" "}
//                 <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer" className="underline font-bold">Citizens Advice</a>, or a qualified financial adviser.
//               </p>
//             </div>

//             <div className="flex items-center gap-3 flex-wrap">
//               <button onClick={() => setActiveTab("tool")}
//                 className="flex items-center gap-2 text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 px-5 py-3 rounded-xs transition-colors shadow-sm">
//                 <Sparkles className="w-4 h-4" />Get My Recovery Plan
//               </button>
//               {isSignedIn && (
//                 <button onClick={() => setActiveTab("dashboard")}
//                   className="flex items-center gap-2 text-sm font-semibold text-teal-700 border border-teal-300 hover:bg-teal-50 px-5 py-3 rounded-xs transition-colors">
//                   <TrendingDown className="w-4 h-4" />My Progress
//                 </button>
//               )}
//               <button onClick={handleShare}
//                 className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
//                 {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
//                 {copied ? "Copied!" : "Share"}
//               </button>
//             </div>
//           </div>

//           {/* Right sidebar card */}
//           <div className="hidden lg:block">
//             <div className="bg-teal-50 border border-teal-200 rounded-xs p-5">
//               <p className="text-xs font-black text-teal-600 uppercase tracking-wider mb-4">What you get</p>
//               <div className="space-y-3">
//                 {[
//                   { emoji:"📅", label:"Full Roadmap",         desc:"Month-by-month until debt-free"       },
//                   { emoji:"💸", label:"Payment Strategy",     desc:"Snowball or Avalanche explained"      },
//                   { emoji:"🎯", label:"Weekly Actions",       desc:"5 specific things to do this week"    },
//                   { emoji:"📊", label:"Scenario Simulator",   desc:"What if I pay £100 more per month?"   },
//                   { emoji:"🤖", label:"AI Financial Coach",   desc:"Conversational guidance anytime"      },
//                   { emoji:"🏆", label:"Micro Goals",          desc:"Celebrate progress milestones"        },
//                 ].map(s => (
//                   <div key={s.label} className="flex items-start gap-3">
//                     <span className="text-lg flex-shrink-0">{s.emoji}</span>
//                     <div>
//                       <p className="text-xs font-bold text-stone-800">{s.label}</p>
//                       <p className="text-[11px] text-stone-500">{s.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
//           {TABS.map(t => (
//             <button key={t.id} onClick={() => setActiveTab(t.id)}
//               className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
//                 activeTab === t.id ? "border-teal-500 text-teal-600" : "border-transparent text-gray-400 hover:text-gray-700"
//               }`}>
//               <t.icon className="w-4 h-4" />{t.label}
//             </button>
//           ))}
//         </div>

//         {/* Tab content */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">

//             {/* TOOL */}
//             {activeTab === "tool" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
//                   <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#14b8a606" }}>
//                     <div className="flex items-center gap-3">
//                       <span className="text-xl">💰</span>
//                       <div>
//                         <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
//                         <p className="text-xs text-gray-400">{TOOL.tagline}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-1.5 text-xs text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-xs">
//                       <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />Live
//                     </div>
//                   </div>
//                   <div className="p-6 md:p-8">
//                     <DebtPlannerTool 
//                       isSignedIn={isSignedIn} 
//                       onInsufficientTokens={(info) => setTokenModal(info)} 
//                     />
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* DASHBOARD */}
//             {activeTab === "dashboard" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 {isSignedIn
//                   ? <DebtDashboard />
//                   : (
//                     <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
//                       <div className="text-4xl mb-4">🔒</div>
//                       <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to track your progress</h3>
//                       <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
//                         Save your plan, log payments, and watch your debt decrease month by month.
//                       </p>
//                       <Link href="/sign-in?redirect_url=/tools/debt-recovery-planner"
//                         className="flex items-center gap-2 text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 px-5 py-3 rounded-xs transition-colors">
//                         Sign in — it's free
//                       </Link>
//                     </div>
//                   )
//                 }
//               </motion.div>
//             )}

//             {/* GUIDE */}
//             {activeTab === "guide" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
//                 <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the AI Debt Recovery Planner</h2>
//                 {HOW_IT_WORKS.map((step, i) => (
//                   <div key={step.step} className="flex gap-6 pb-10 relative">
//                     {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
//                     <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10" style={{ backgroundColor: "#14b8a610", color: "#14b8a6" }}>
//                       {step.step}
//                     </div>
//                     <div>
//                       <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
//                       <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//                 {/* Key principle */}
//                 <div className="bg-teal-50 border border-teal-100 rounded-xs p-6">
//                   <h3 className="text-base font-bold text-teal-900 mb-3">💡 The most important thing to understand</h3>
//                   <p className="text-sm text-teal-800 leading-relaxed mb-3">
//                     Debt repayment isn't about being perfect — it's about being consistent. A realistic plan you actually follow beats an aggressive plan you abandon in month 2.
//                   </p>
//                   <ul className="space-y-2">
//                     {[
//                       "Enter real numbers — an honest picture leads to a realistic plan",
//                       "The plan is a guide, not a contract — life happens, adjust and keep going",
//                       "Every extra £10 you put toward debt compounds significantly over time",
//                       "The date you'll be debt-free is a real number — hold onto it on hard days",
//                     ].map(tip => (
//                       <li key={tip} className="flex items-start gap-2 text-sm text-teal-800">
//                         <Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />{tip}
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
//                   <div className="flex items-center gap-2">
//                     <StarRow rating={5} />
//                     <span className="text-sm font-bold text-gray-700">{TOOL.ratingAvg.toFixed(1)}</span>
//                     <span className="text-sm text-gray-400">({TOOL.ratingCount})</span>
//                   </div>
//                 </div>
//                 {REVIEWS.map(r => (
//                   <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">{r.avatar}</div>
//                         <div>
//                           <p className="text-sm font-bold text-gray-900">{r.name}</p>
//                           <p className="text-xs text-gray-400">{r.role}</p>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <StarRow rating={r.rating} />
//                         <p className="text-xs text-gray-400 mt-1">{r.date}</p>
//                       </div>
//                     </div>
//                     <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
//                   </div>
//                 ))}
//               </motion.div>
//             )}
//           </div>

//           {/* Right sidebar */}
//           <aside className="lg:col-span-1">
//             <div className="lg:sticky lg:top-36 space-y-5">
//               <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
//                 {TABS.map(t => (
//                   <button key={t.id} onClick={() => setActiveTab(t.id)}
//                     className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab===t.id?"bg-gray-900 text-white font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
//                     <t.icon className="w-4 h-4" />{t.label}
//                   </button>
//                 ))}
//               </div>

//               <div className="bg-red-50 border border-red-100 rounded-xs p-5">
//                 <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-3">In serious difficulty?</p>
//                 <p className="text-xs text-red-700 mb-3 leading-relaxed">If you're struggling to meet minimum payments or feeling overwhelmed, please reach out to a free debt charity. They're non-judgmental and genuinely helpful.</p>
//                 <div className="space-y-2">
//                   {[
//                     { name: "StepChange", url: "https://www.stepchange.org",         desc: "Free debt advice (UK)"     },
//                     { name: "Citizens Advice", url: "https://www.citizensadvice.org.uk", desc: "Free advice (UK)"         },
//                     { name: "National Debtline", url: "https://www.nationaldebtline.org", desc: "Free helpline (UK)"       },
//                   ].map(r => (
//                     <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
//                       className="flex items-center justify-between text-xs text-red-700 hover:text-red-900 transition-colors">
//                       <span className="font-semibold">{r.name}</span>
//                       <span className="text-red-400 text-[10px]">{r.desc} →</span>
//                     </a>
//                   ))}
//                 </div>
//               </div>

//               {related.length > 0 && (
//                 <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Related Tools</p>
//                   <div className="space-y-3">
//                     {related.map(t => (
//                       <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
//                         <span className="text-xl shrink-0">{t.icon}</span>
//                         <div className="min-w-0">
//                           <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p>
//                           <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
//                         </div>
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

//         {/* Related tools grid */}
//         {related.length > 0 && (
//           <div className="mt-20 pt-12 border-t border-gray-100">
//             <div className="flex items-center justify-between mb-8">
//               <h2 className="text-2xl font-black text-gray-900">Related Tools</h2>
//               <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
//                 See all <ArrowRight className="w-4 h-4" />
//               </Link>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//               {related.map(t => <ToolCard key={t.id} tool={t} />)}
//             </div>
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