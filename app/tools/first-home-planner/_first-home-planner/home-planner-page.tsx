"use client";

// =============================================================================
// isaacpaha.com — First Home Planner — Page Shell
// app/tools/first-home-planner/_components/home-planner-page.tsx
// =============================================================================

import React, { useState }   from "react";
import Link                   from "next/link";
import { motion }             from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, ArrowRight, Home, TrendingUp,
  Sparkles, Shield, Target, PiggyBank, Info,
} from "lucide-react";
import { HomePlannerTool, TokenGateInfo }        from "./home-planner-tool";
import { HomeDashboard }          from "./home-dashboard";
import { ToolCard } from "../../_tools/tools-card";
import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter } from "next/navigation";
import type { NormalisedTool } from "../../_tools/tools-lab-client";
import { ToolViewTracker } from "../../_tools/tool-view-tracker";
import { ToolReviews } from "../../_tools/tool-reviews";

// ─── How it works steps ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Enter your finances",       desc: "Your monthly income, current savings, expenses, and any existing debt. Takes 2 minutes. The more accurate, the better the plan." },
  { step: "02", title: "Set your property goal",    desc: "Enter your target property price, preferred deposit size (5%, 10%, or 20%), and the timeframe you're aiming for." },
  { step: "03", title: "Click 'Plan My Journey'",   desc: "In ~8 seconds, the AI builds your complete plan — deposit targets, mortgage readiness roadmap, credit strategy, and a month-by-month action plan." },
  { step: "04", title: "Work through your roadmap", desc: "You get 4 phases: Stabilise finances → Build savings → Improve credit → Prepare for application. Each has specific tasks and milestones." },
  { step: "05", title: "Ask your AI Home Coach",    desc: "Not sure how a mortgage works? What's a Lifetime ISA? Should you do shared ownership? Ask anything — the coach knows your situation." },
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
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div className="h-full transition-[width] duration-100" style={{ width: `${w}%`, backgroundColor: accentColor }} />
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=n?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}</div>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomePlannerPageProps {
  isSignedIn:   boolean;
  initialPlan?: any;
  tool:         NormalisedTool;         // ← from DB via server page
  relatedTools: NormalisedTool[];       // ← same category, from DB
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomePlannerPage({ isSignedIn, initialPlan, tool, relatedTools }: HomePlannerPageProps) {
  const [activeTab, setActiveTab] = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
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
  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "🏡", color: "#6366f1" };
  const ACCENT = tool.accentColor;

  const TABS = [
    { id: "tool",      label: "Plan My Home",    icon: Home        },
    ...(isSignedIn ? [{ id: "workspace", label: "My Progress", icon: TrendingUp }] : []),
    { id: "guide",     label: "How It Works",    icon: BookOpen    },
    { id: "reviews",   label: "Reviews",         icon: MessageSquare },
  ] as const;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress accentColor={ACCENT} />

      {/* ── View tracker — fires once on mount, increments DB viewCount ── */}
      <ToolViewTracker toolId={tool.id} />

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.06] pointer-events-none"
        style={{ backgroundColor: ACCENT }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[{ label:"Home", href:"/" }, { label:"Tools", href:"/tools" }, { label:tool.name, href:"#" }].map((bc, i) => (
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
                  {tool.ratingAvg.toFixed(1)} ({tool.ratingCount})
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
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
                  Free · No account required
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

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: ACCENT }}>
                <Home className="w-4 h-4" />Plan My First Home
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs transition-colors border"
                  style={{ color: ACCENT, borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}08` }}>
                  <TrendingUp className="w-4 h-4" />My Progress
                </button>
              )}
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right: feature card */}
          <div className="hidden lg:block">
            <div className="rounded-xs p-5 border" style={{ backgroundColor: `${ACCENT}08`, borderColor: `${ACCENT}25` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>What you get</p>
              <div className="space-y-3">
                {[
                  { icon: Target,     label: "Readiness Score",    desc: "How mortgage-ready you are right now", color: "#6366f1" },
                  { icon: PiggyBank,  label: "Deposit Plan",       desc: "Monthly savings target + milestones",  color: "#f59e0b" },
                  { icon: TrendingUp, label: "4-Phase Roadmap",    desc: "Step-by-step to mortgage application", color: "#10b981" },
                  { icon: Shield,     label: "Credit Strategy",    desc: "Build a stronger credit profile",       color: "#3b82f6" },
                  { icon: Star,       label: "UK Buyer Schemes",   desc: "LISA, shared ownership & more",        color: "#ec4899" },
                  { icon: MessageSquare,label:"AI Home Coach",     desc: "Ask anything, anytime",                color: "#f97316" },
                ].map(s => (
                  <div key={s.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-800">{s.label}</p>
                      <p className="text-[11px] text-stone-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-white/60 border rounded-sm px-3 py-2.5" style={{ borderColor: `${ACCENT}20` }}>
                <p className="text-[10px] font-semibold" style={{ color: ACCENT }}>⚠️ Educational guidance only — not regulated financial advice. For mortgage advice, speak to an FCA-regulated IMA.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as "tool" | "workspace" | "guide" | "reviews")}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

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
                    <HomePlannerTool 
                      isSignedIn={isSignedIn} 
                      onInsufficientTokens={(info) => setTokenModal(info)} 
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This tool provides educational planning guidance only — not regulated financial or mortgage advice. Numbers are estimates based on your inputs. For personalised mortgage advice, consult an FCA-regulated independent mortgage adviser.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? <HomeDashboard initialPlan={initialPlan} />
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <div className="text-4xl mb-4">{tool.icon}</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to track your progress</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                        Save your plan, log savings milestones, and watch your readiness score improve over time.
                      </p>
                      <Link href="/sign-in?redirect_url=/tools/first-home-planner"
                        className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors"
                        style={{ backgroundColor: ACCENT }}>
                        Sign in — it's free
                      </Link>
                    </div>
                  )
                }
              </motion.div>
            )}

            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How the {tool.name} works</h2>
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={s.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ backgroundColor: `${ACCENT}10`, color: ACCENT }}>{s.step}</div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 rounded-xs p-6 border" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: ACCENT }}>💡 To get the most out of it</h3>
                  <ul className="space-y-2">
                    {[
                      "Be honest about your expenses — realistic inputs = realistic plan.",
                      "If you don't know your credit score, check for free on ClearScore or Experian.",
                      "Look at the Lifetime ISA first if you're under 40 — it's the most impactful government scheme.",
                      "The readiness score will feel low at first — that's fine. It's a starting point, not a verdict.",
                      "Re-run the planner every 6 months. Your situation will improve faster than you think.",
                    ].map(tip => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-stone-700">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

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
                    <button key={t.id} onClick={() => setActiveTab(t.id as "tool" | "workspace" | "guide" | "reviews")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                      <t.icon className="w-4 h-4" />{t.label}
                    </button>
                  ))}
              </div>

              <div className="rounded-xs p-5 border" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>The first-home journey</p>
                {[
                  { emoji: "💰", label: "Year 1–2",  text: "Build savings habit + fix credit"      },
                  { emoji: "🏦", label: "Year 2–3",  text: "Hit deposit target + mortgage-in-principle" },
                  { emoji: "🔍", label: "Year 3",    text: "Search, offer, conveyancing"            },
                  { emoji: "🏡", label: "Completion",text: "Keys in hand"                           },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-start gap-3 mb-3 last:mb-0">
                    <span className="text-base">{s.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-stone-800">{s.label}</p>
                      <p className="text-[11px] text-stone-500">{s.text}</p>
                    </div>
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
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <Link href="/tools" className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xs transition-all">
                <ArrowLeft className="w-4 h-4" />All Tools
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
// // isaacpaha.com — First Home Planner — Page Shell
// // app/tools/first-home-planner/_components/home-planner-page.tsx
// // =============================================================================

// import React, { useState }   from "react";
// import Link                   from "next/link";
// import { motion }             from "framer-motion";
// import {
//   ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
//   MessageSquare, BookOpen, Zap, ArrowRight, Home, TrendingUp,
//   Sparkles, Shield, Target, PiggyBank, Info,
// } from "lucide-react";
// import { TOOLS, TOOL_CATEGORIES } from "@/lib/data/tools-data";
// import { HomePlannerTool, TokenGateInfo }        from "./home-planner-tool";
// import { HomeDashboard }          from "./home-dashboard";
// import { ToolCard } from "../../_tools/tools-card";
// import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
// import { useRouter } from "next/navigation";

// const TOOL = TOOLS.find((t) => t.slug === "first-home-planner")!;

// const HOW_IT_WORKS = [
//   { step: "01", title: "Enter your finances",       desc: "Your monthly income, current savings, expenses, and any existing debt. Takes 2 minutes. The more accurate, the better the plan." },
//   { step: "02", title: "Set your property goal",    desc: "Enter your target property price, preferred deposit size (5%, 10%, or 20%), and the timeframe you're aiming for." },
//   { step: "03", title: "Click 'Plan My Journey'",   desc: "In ~8 seconds, the AI builds your complete plan — deposit targets, mortgage readiness roadmap, credit strategy, and a month-by-month action plan." },
//   { step: "04", title: "Work through your roadmap", desc: "You get 4 phases: Stabilise finances → Build savings → Improve credit → Prepare for application. Each has specific tasks and milestones." },
//   { step: "05", title: "Ask your AI Home Coach",    desc: "Not sure how a mortgage works? What's a Lifetime ISA? Should you do shared ownership? Ask anything — the coach knows your situation." },
// ];

// const REVIEWS = [
//   { name: "Leah C.", role: "Nurse, 26", avatar: "LC", rating: 5, date: "1 week ago",
//     body: "I always thought a house was 'someday'. This tool gave me a plan that says I can buy a flat in Manchester in 2.5 years if I save £420/month. That number felt real. I set up a standing order the same day." },
//   { name: "Jordan A.", role: "Software Engineer, 24", avatar: "JA", rating: 5, date: "2 weeks ago",
//     body: "The Lifetime ISA tip alone was worth it. I had no idea the government gives you £1,000 free per year. That's £4,000 in 4 years just for saving what I was already saving. Genuinely life-changing." },
//   { name: "Priya M.", role: "Teacher, 29", avatar: "PM", rating: 5, date: "3 weeks ago",
//     body: "The credit building roadmap was exactly what I needed. I didn't realise not being on the electoral roll was hurting my credit score. Small things with big impact. The AI Coach is actually useful too." },
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
//   return (
//     <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
//       <div className="h-full bg-indigo-500 transition-[width] duration-100" style={{ width: `${w}%` }} />
//     </div>
//   );
// }

// function Stars({ n }: { n: number }) {
//   return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=n?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}</div>;
// }

// interface Props { isSignedIn: boolean; initialPlan?: any }

// export function HomePlannerPage({ isSignedIn, initialPlan }: Props) {
//   const [activeTab, setActiveTab] = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
//   const [copied,    setCopied]    = useState(false);
//   const router = useRouter();
  
//   // ── NEW: token modal state ────────────────────────────────────────────────
//       const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);

//   const category = TOOL_CATEGORIES.find((c) => c.name === TOOL?.category);
//   const related  = TOOLS.filter(t => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);

//   if (!TOOL) return null;

//   const TABS = [
//     { id: "tool",      label: "Plan My Home",    icon: Home        },
//     ...(isSignedIn ? [{ id: "workspace", label: "My Progress", icon: TrendingUp }] : []),
//     { id: "guide",     label: "How It Works",    icon: BookOpen    },
//     { id: "reviews",   label: "Reviews",         icon: MessageSquare },
//   ] as const;

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       <ReadingProgress />

//       <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
//         style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
//       <div className="fixed top-24 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.06] pointer-events-none bg-indigo-400" />

//       <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

//         {/* Breadcrumbs */}
//         <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
//           {[{ label:"Home", href:"/" }, { label:"Tools", href:"/tools" }, { label:TOOL.name, href:"#" }].map((bc, i) => (
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
//                 style={{ backgroundColor: "#6366f110", borderColor: "#6366f130" }}>🏡</div>
//               <div>
//                 <div className="flex flex-wrap items-center gap-2 mb-1">
//                   <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
//                   <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-green-50 border-green-200 text-green-700">
//                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
//                   </span>
//                   <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-xs">NEW</span>
//                 </div>
//                 <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
//               </div>
//             </div>

//             <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

//             <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
//               <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-400" />{TOOL.usageCount.toLocaleString()} plans created</span>
//               <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{TOOL.ratingAvg.toFixed(1)} ({TOOL.ratingCount})</span>
//               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
//               <span className="flex items-center gap-1.5 text-green-600 font-semibold"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Free · No account required</span>
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
//                 <Home className="w-4 h-4" />Plan My First Home
//               </button>
//               {isSignedIn && (
//                 <button onClick={() => setActiveTab("workspace")}
//                   className="flex items-center gap-2 text-sm font-semibold text-indigo-700 border border-indigo-300 hover:bg-indigo-50 px-5 py-3 rounded-xs transition-colors">
//                   <TrendingUp className="w-4 h-4" />My Progress
//                 </button>
//               )}
//               <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
//                 className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
//                 {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
//                 {copied ? "Copied!" : "Share"}
//               </button>
//             </div>
//           </div>

//           {/* Right: feature card */}
//           <div className="hidden lg:block">
//             <div className="bg-indigo-50 border border-indigo-200 rounded-xs p-5">
//               <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-4">What you get</p>
//               <div className="space-y-3">
//                 {[
//                   { icon: Target,     label: "Readiness Score",    desc: "How mortgage-ready you are right now", color: "#6366f1" },
//                   { icon: PiggyBank,  label: "Deposit Plan",       desc: "Monthly savings target + milestones",  color: "#f59e0b" },
//                   { icon: TrendingUp, label: "4-Phase Roadmap",    desc: "Step-by-step to mortgage application", color: "#10b981" },
//                   { icon: Shield,     label: "Credit Strategy",    desc: "Build a stronger credit profile",       color: "#3b82f6" },
//                   { icon: Star,       label: "UK Buyer Schemes",   desc: "LISA, shared ownership & more",        color: "#ec4899" },
//                   { icon: MessageSquare,label:"AI Home Coach",     desc: "Ask anything, anytime",                color: "#f97316" },
//                 ].map(s => (
//                   <div key={s.label} className="flex items-start gap-3">
//                     <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
//                       <s.icon className="w-4 h-4" style={{ color: s.color }} />
//                     </div>
//                     <div>
//                       <p className="text-xs font-bold text-stone-800">{s.label}</p>
//                       <p className="text-[11px] text-stone-500">{s.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <div className="mt-4 bg-white/60 border border-indigo-100 rounded-sm px-3 py-2.5">
//                 <p className="text-[10px] text-indigo-600 font-semibold">⚠️ Educational guidance only — not regulated financial advice. For mortgage advice, speak to an FCA-regulated IMA.</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
//           {TABS.map(t => (
//             <button key={t.id} onClick={() => setActiveTab(t.id as "tool" | "workspace" | "guide" | "reviews")}
//               className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
//                 activeTab === t.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-700"
//               }`}>
//               <t.icon className="w-4 h-4" />{t.label}
//             </button>
//           ))}
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">

//             {activeTab === "tool" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
//                   <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#6366f106" }}>
//                     <div className="flex items-center gap-3">
//                       <span className="text-xl">🏡</span>
//                       <div>
//                         <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
//                         <p className="text-xs text-gray-400">{TOOL.tagline}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xs">
//                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
//                     </div>
//                   </div>
//                   <div className="p-6 md:p-8">
//                     <HomePlannerTool isSignedIn={isSignedIn} onInsufficientTokens={(info) => setTokenModal(info)} />
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
//                   <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
//                   <p className="text-xs text-amber-800 leading-relaxed">
//                     This tool provides educational planning guidance only — not regulated financial or mortgage advice. Numbers are estimates based on your inputs. For personalised mortgage advice, consult an FCA-regulated independent mortgage adviser.
//                   </p>
//                 </div>
//               </motion.div>
//             )}

//             {activeTab === "workspace" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 {isSignedIn
//                   ? <HomeDashboard initialPlan={initialPlan} />
//                   : (
//                     <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
//                       <div className="text-4xl mb-4">🏡</div>
//                       <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to track your progress</h3>
//                       <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
//                         Save your plan, log savings milestones, and watch your readiness score improve over time.
//                       </p>
//                       <Link href="/sign-in?redirect_url=/tools/first-home-planner"
//                         className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xs transition-colors">
//                         Sign in — it's free
//                       </Link>
//                     </div>
//                   )
//                 }
//               </motion.div>
//             )}

//             {activeTab === "guide" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
//                 <h2 className="text-2xl font-black text-gray-900 mb-8">How the First Home Planner works</h2>
//                 {HOW_IT_WORKS.map((s, i) => (
//                   <div key={s.step} className="flex gap-6 pb-10 relative">
//                     {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
//                     <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
//                       style={{ backgroundColor: "#6366f110", color: "#6366f1" }}>{s.step}</div>
//                     <div>
//                       <h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3>
//                       <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//                 <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xs p-6">
//                   <h3 className="text-base font-bold text-indigo-900 mb-3">💡 To get the most out of it</h3>
//                   <ul className="space-y-2">
//                     {[
//                       "Be honest about your expenses — realistic inputs = realistic plan.",
//                       "If you don't know your credit score, check for free on ClearScore or Experian.",
//                       "Look at the Lifetime ISA first if you're under 40 — it's the most impactful government scheme.",
//                       "The readiness score will feel low at first — that's fine. It's a starting point, not a verdict.",
//                       "Re-run the planner every 6 months. Your situation will improve faster than you think.",
//                     ].map(tip => (
//                       <li key={tip} className="flex items-start gap-2 text-sm text-indigo-800">
//                         <Check className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />{tip}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </motion.div>
//             )}

//             {activeTab === "reviews" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
//                 <div className="flex items-center justify-between">
//                   <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
//                   <div className="flex items-center gap-2"><Stars n={5} /><span className="text-sm font-bold">{TOOL.ratingAvg.toFixed(1)}</span><span className="text-sm text-gray-400">({TOOL.ratingCount})</span></div>
//                 </div>
//                 {REVIEWS.map(r => (
//                   <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{r.avatar}</div>
//                         <div><p className="text-sm font-bold text-gray-900">{r.name}</p><p className="text-xs text-gray-400">{r.role}</p></div>
//                       </div>
//                       <div className="text-right"><Stars n={r.rating} /><p className="text-xs text-gray-400 mt-1">{r.date}</p></div>
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
//                     <button key={t.id} onClick={() => setActiveTab(t.id as "tool" | "workspace" | "guide" | "reviews")}
//                       className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
//                       <t.icon className="w-4 h-4" />{t.label}
//                     </button>
//                   ))}
//               </div>

//               <div className="bg-indigo-50 border border-indigo-100 rounded-xs p-5">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-4">The first-home journey</p>
//                 {[
//                   { emoji: "💰", label: "Year 1–2",  text: "Build savings habit + fix credit"      },
//                   { emoji: "🏦", label: "Year 2–3",  text: "Hit deposit target + mortgage-in-principle" },
//                   { emoji: "🔍", label: "Year 3",    text: "Search, offer, conveyancing"            },
//                   { emoji: "🏡", label: "Completion",text: "Keys in hand"                           },
//                 ].map((s, i) => (
//                   <div key={s.label} className="flex items-start gap-3 mb-3 last:mb-0">
//                     <span className="text-base">{s.emoji}</span>
//                     <div>
//                       <p className="text-xs font-bold text-stone-800">{s.label}</p>
//                       <p className="text-[11px] text-stone-500">{s.text}</p>
//                     </div>
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
//                         <div className="min-w-0">
//                           <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p>
//                           <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
//                         </div>
//                         <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 shrink-0" />
//                       </Link>
//                     ))}
//                   </div>
//                 </div>
//               )}
//               <Link href="/tools" className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xs transition-all">
//                 <ArrowLeft className="w-4 h-4" />All Tools
//               </Link>
//             </div>
//           </aside>
//         </div>

//         {related.length > 0 && (
//           <div className="mt-20 pt-12 border-t border-gray-100">
//             <div className="flex items-center justify-between mb-8">
//               <h2 className="text-2xl font-black text-gray-900">More Finance Tools</h2>
//               <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">See all <ArrowRight className="w-4 h-4" /></Link>
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