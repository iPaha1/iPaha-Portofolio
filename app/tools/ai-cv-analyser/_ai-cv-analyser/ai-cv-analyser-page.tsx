"use client";
// =============================================================================
// isaacpaha.com — AI CV Analyser Pro — Page Shell
// app/tools/ai-cv-analyser/_components/cv-analyser-page.tsx
//
// Changes from original:
//  - No longer imports from @/lib/data/tools-data (hardcoded data removed)
//  - Receives `tool` and `relatedTools` as props from the server page
//  - Uses <ToolViewTracker> to auto-increment view count in DB
//  - Uses <ToolReviews> for live DB reviews + submit form
//  - ToolCard now receives NormalisedTool shape
// =============================================================================
import React, { useState }   from "react";
import Link                   from "next/link";
import { motion }             from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, Info, ArrowRight, Target,
  Shield, TrendingUp, Sparkles, Award,
} from "lucide-react";
import { CVAnalyserTool, TokenGateInfo } from "./cv-analyser-tool";
import { CVDashboard }                   from "./cv-dashboard";
import { ToolCard }                      from "../../_tools/tools-card";
import { InsufficientTokensModal }       from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter }                     from "next/navigation";
import type { NormalisedTool }           from "../../_tools/tools-lab-client";
import { ToolViewTracker } from "../../_tools/tool-view-tracker";
import { ToolReviews } from "../../_tools/tool-reviews";

// ─── How it works steps ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste your CV",
    desc:  "Copy and paste the full text of your CV — include your summary, experience, education, and skills sections. The more complete it is, the more specific the feedback.",
  },
  {
    step: "02",
    title: "Add the job description (recommended)",
    desc:  "Paste in the job description you're targeting. This unlocks keyword gap analysis, job match scoring, and role-specific interview questions. Without it, you get general feedback.",
  },
  {
    step: "03",
    title: "Select your role type",
    desc:  "Choose a role mode (Tech, Finance, Graduate, Business, etc.) to calibrate the analysis to your sector's standards and vocabulary.",
  },
  {
    step: "04",
    title: "Get your analysis",
    desc:  "In ~8 seconds, you receive: 5 scores, keyword gap analysis, section-by-section feedback, bullet rewrites, language improvements, and interview questions.",
  },
  {
    step: "05",
    title: "Apply improvements",
    desc:  "Use the AI rewrite tools to improve sections, generate a full rewrite, or tailor your CV to a specific job. Copy the improved text back into your CV.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ReadingProgress() {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const h = () => {
      const el = document.documentElement;
      setWidth(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)));
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div className="h-full bg-emerald-500 transition-[width] duration-100" style={{ width: `${width}%` }} />
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CVAnalyserPageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;         // ← from DB via server page
  relatedTools: NormalisedTool[];       // ← same category, from DB
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CVAnalyserPage({ isSignedIn, tool, relatedTools }: CVAnalyserPageProps) {
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
  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "🔧", color: "#6b7280" };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS = [
    { id: "tool",      label: "Analyse CV",    icon: Sparkles       },
    ...(isSignedIn ? [{ id: "workspace", label: "My Workspace", icon: TrendingUp } as const] : []),
    { id: "guide",     label: "How It Works",  icon: BookOpen       },
    { id: "reviews",   label: "Reviews",       icon: MessageSquare  },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress />

      {/* ── View tracker — fires once on mount, increments DB viewCount ── */}
      <ToolViewTracker toolId={tool.id} />

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none"
        style={{ backgroundColor: tool.accentColor }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: tool.name, href: "#" }].map((bc, i) => (
            <React.Fragment key={bc.label}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              {bc.href === "#"
                ? <span className="text-gray-600 font-medium">{bc.label}</span>
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
                  {tool.usageCount.toLocaleString()} uses
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

            {/* CTAs */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: tool.accentColor }}
              >
                <Sparkles className="w-4 h-4" />Analyse My CV
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold border px-5 py-3 rounded-xs transition-colors"
                  style={{ color: tool.accentColor, borderColor: `${tool.accentColor}50` }}>
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

          {/* Right: what you get panel */}
          {tool.features.length > 0 && (
            <div className="hidden lg:block">
              <div className="rounded-xs p-5 border"
                style={{ backgroundColor: `${tool.accentColor}08`, borderColor: `${tool.accentColor}25` }}>
                <p className="text-xs font-black uppercase tracking-wider mb-4"
                  style={{ color: tool.accentColor }}>
                  What you get
                </p>
                <div className="space-y-3">
                  {tool.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-xs text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tool.accentColor }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
              style={activeTab === t.id ? { borderColor: tool.accentColor, color: tool.accentColor } : {}}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {/* TOOL tab */}
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
                    <CVAnalyserTool
                      isSignedIn={isSignedIn}
                      onInsufficientTokens={(info) => setTokenModal(info)}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Your CV is analysed locally and not stored permanently. Analyses are powered by AI. Results reflect AI assessment — always apply your own judgment.
                  </p>
                </div>
              </motion.div>
            )}

            {/* WORKSPACE tab */}
            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? <CVDashboard onReopenAnalysis={() => setActiveTab("tool")} />
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <div className="text-4xl mb-4">🔒</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to access your workspace</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                        Save analyses, cover letters, and interview questions — then come back to study and improve.
                      </p>
                      <Link href="/sign-in?redirect_url=/tools/ai-cv-analyser"
                        className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors"
                        style={{ backgroundColor: tool.accentColor }}>
                        Sign in — it's free
                      </Link>
                    </div>
                  )
                }
              </motion.div>
            )}

            {/* HOW IT WORKS tab */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the {tool.name}</h2>
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />
                    )}
                    <div
                      className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ backgroundColor: `${tool.accentColor}10`, color: tool.accentColor }}
                    >
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 rounded-xs p-6 border"
                  style={{ backgroundColor: `${tool.accentColor}06`, borderColor: `${tool.accentColor}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: tool.accentColor }}>
                    💡 Pro tips for best results
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "Always include the job description — the analysis is 3× more useful with it.",
                      "Paste the plain text of your CV, not a formatted PDF copy.",
                      "Apply the keyword suggestions naturally — don't keyword stuff.",
                      "The 'Tailor to This Job' rewrite is for a specific application; keep a master CV.",
                      "Treat the ATS score as a floor, not a ceiling — a good CV for a human still matters more.",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-stone-700">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tool.accentColor }} />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* REVIEWS tab — now using the reusable DB-connected component */}
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
                {TABS.map((t) => (
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
                  Why CV analysis matters
                </p>
                {[
                  { icon: Shield,     text: "75% of CVs never reach a human — they're filtered by ATS first",                color: "#ef4444" },
                  { icon: TrendingUp, text: "CVs with quantified achievements are 40% more likely to get interviews",       color: "#10b981" },
                  { icon: Target,     text: "Keyword matching is the #1 factor in ATS scoring",                              color: "#3b82f6" },
                ].map((s) => (
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
// // isaacpaha.com — AI CV Analyser Pro — Page Shell
// // app/tools/ai-cv-analyser/_components/cv-analyser-page.tsx
// // =============================================================================

// import React, { useState }   from "react";
// import Link                   from "next/link";
// import { motion }             from "framer-motion";
// import {
//   ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
//   MessageSquare, BookOpen, Zap, Info, ArrowRight, Target,
//   Shield, TrendingUp, Sparkles, Award,
// } from "lucide-react";
// import { CVAnalyserTool, TokenGateInfo }         from "./cv-analyser-tool";
// import { CVDashboard }           from "./cv-dashboard";
// import { TOOL_CATEGORIES, TOOLS } from "@/lib/data/tools-data";
// import { ToolCard } from "../../_tools/tools-card";
// import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
// import { useRouter } from "next/navigation";

// // ─── Tool data ────────────────────────────────────────────────────────────────

// const TOOL = TOOLS.find((t) => t.slug === "ai-cv-analyser")!;

// const HOW_IT_WORKS = [
//   {
//     step: "01",
//     title: "Paste your CV",
//     desc:  "Copy and paste the full text of your CV — include your summary, experience, education, and skills sections. The more complete it is, the more specific the feedback.",
//   },
//   {
//     step: "02",
//     title: "Add the job description (recommended)",
//     desc:  "Paste in the job description you're targeting. This unlocks keyword gap analysis, job match scoring, and role-specific interview questions. Without it, you get general feedback.",
//   },
//   {
//     step: "03",
//     title: "Select your role type",
//     desc:  "Choose a role mode (Tech, Finance, Graduate, Business, etc.) to calibrate the analysis to your sector's standards and vocabulary.",
//   },
//   {
//     step: "04",
//     title: "Get your analysis",
//     desc:  "In ~8 seconds, you receive: 5 scores, keyword gap analysis, section-by-section feedback, bullet rewrites, language improvements, and interview questions.",
//   },
//   {
//     step: "05",
//     title: "Apply improvements",
//     desc:  "Use the AI rewrite tools to improve sections, generate a full rewrite, or tailor your CV to a specific job. Copy the improved text back into your CV.",
//   },
// ];


// // WE NEED TO GET THIS FROM THE DATABASE AND LOGGED IN USER CAN SUBMIT A REVIEW
// const REVIEWS = [
//   {
//     name: "Sarah J.", role: "Software Engineer",     avatar: "SJ", rating: 5, date: "1 week ago",
//     body: "The keyword gap analysis was the game-changer for me. I had no idea how many critical terms were missing from my CV. Applied the changes and got 4 interview calls in 2 weeks.",
//   },
//   {
//     name: "Daniel O.", role: "Finance Graduate",     avatar: "DO", rating: 5, date: "2 weeks ago",
//     body: "The bullet point rewrites transformed my vague descriptions into strong, quantified achievements. The 'before and after' format made it really easy to see exactly what to change.",
//   },
//   {
//     name: "Amara B.", role: "Career Changer",        avatar: "AB", rating: 5, date: "3 weeks ago",
//     body: "I'm transitioning from teaching to product management. The tailor-to-JD feature helped me reframe my teaching experience in business language. Genuinely useful, not just generic AI waffle.",
//   },
//   {
//     name: "Marcus T.", role: "Senior Data Analyst",  avatar: "MT", rating: 4, date: "1 month ago",
//     body: "ATS score went from 61 to 88 after applying the suggestions. The section-by-section feedback was honest — it told me my professional summary was weak and why. Fixed it in 20 minutes.",
//   },
// ];

// function ReadingProgress() {
//   const [width, setWidth] = React.useState(0);
//   React.useEffect(() => {
//     const h = () => {
//       const el = document.documentElement;
//       setWidth(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)));
//     };
//     window.addEventListener("scroll", h, { passive: true });
//     return () => window.removeEventListener("scroll", h);
//   }, []);
//   return (
//     <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
//       <div className="h-full bg-emerald-500 transition-[width] duration-100" style={{ width: `${width}%` }} />
//     </div>
//   );
// }

// function StarRow({ rating }: { rating: number }) {
//   return (
//     <div className="flex gap-0.5">
//       {[1,2,3,4,5].map((s) => (
//         <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
//       ))}
//     </div>
//   );
// }

// interface CVAnalyserPageProps {
//   isSignedIn: boolean;
// }

// export function CVAnalyserPage({ isSignedIn }: CVAnalyserPageProps) {
//   const [activeTab, setActiveTab] = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
//   const [copied,    setCopied]    = useState(false);
//   const router = useRouter();
  
//   // ── NEW: token modal state ────────────────────────────────────────────────
//     const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);

//   const category = TOOL_CATEGORIES.find((c) => c.name === TOOL?.category);
//   const related  = TOOLS.filter((t) => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);

//   if (!TOOL) return null;

//   const handleShare = () => {
//     navigator.clipboard.writeText(window.location.href);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const TABS = [
//     { id: "tool",      label: "Analyse CV",    icon: Sparkles       },
//     ...(isSignedIn ? [{ id: "workspace", label: "My Workspace", icon: TrendingUp } as const] : []),
//     { id: "guide",     label: "How It Works",  icon: BookOpen       },
//     { id: "reviews",   label: "Reviews",       icon: MessageSquare  },
//   ] as const;

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       <ReadingProgress />

//       <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
//         style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }}
//       />
//       <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none bg-emerald-400" />

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
//                 style={{ backgroundColor: "#10b98110", borderColor: "#10b98130" }}>
//                 🎯
//               </div>
//               <div>
//                 <div className="flex flex-wrap items-center gap-2 mb-1">
//                   <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
//                   <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-emerald-50 border-emerald-200 text-emerald-700">
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
//                   </span>
//                   <span className="text-[9px] font-black tracking-widest uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-xs">NEW</span>
//                 </div>
//                 <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
//               </div>
//             </div>

//             <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

//             <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
//               <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400" />{TOOL.usageCount.toLocaleString()} CVs analysed</span>
//               <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{TOOL.ratingAvg.toFixed(1)} ({TOOL.ratingCount} reviews)</span>
//               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
//               <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Free</span>
//             </div>

//             <div className="flex flex-wrap gap-2 mb-6">
//               {TOOL.features.map((f) => (
//                 <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
//                   <Check className="w-3 h-3 text-emerald-400" />{f}
//                 </span>
//               ))}
//             </div>

//             <div className="flex items-center gap-3 flex-wrap">
//               <button onClick={() => setActiveTab("tool")}
//                 className="flex items-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-xs transition-colors shadow-sm">
//                 <Sparkles className="w-4 h-4" />Analyse My CV
//               </button>
//               {isSignedIn && (
//                 <button onClick={() => setActiveTab("workspace")}
//                   className="flex items-center gap-2 text-sm font-semibold text-emerald-700 border border-emerald-300 hover:bg-emerald-50 px-5 py-3 rounded-xs transition-colors">
//                   <TrendingUp className="w-4 h-4" />My Workspace
//                 </button>
//               )}
//               <button onClick={handleShare}
//                 className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
//                 {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
//                 {copied ? "Copied!" : "Share"}
//               </button>
//             </div>
//           </div>

//           {/* Right: stat card */}
//           <div className="hidden lg:block">
//             <div className="bg-emerald-50 border border-emerald-200 rounded-xs p-5">
//               <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-4">What you get</p>
//               <div className="space-y-3">
//                 {[
//                   { icon: Target,      label: "5-Score Analysis",          desc: "ATS, Language, Structure, Match, Keywords", color: "#f59e0b" },
//                   { icon: Shield,      label: "ATS Compatibility",          desc: "Know if your CV survives the filter",        color: "#ef4444" },
//                   { icon: TrendingUp,  label: "Job Match Score",            desc: "How well you fit the specific role",         color: "#3b82f6" },
//                   { icon: Sparkles,    label: "AI Rewrites",                desc: "Bullet points rewritten with impact",        color: "#8b5cf6" },
//                   { icon: MessageSquare,label:"Interview Questions",        desc: "Tailored to your CV + JD",                   color: "#f97316" },
//                 ].map((s) => (
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

//         {/* Tab content */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">

//             {/* TOOL tab */}
//             {activeTab === "tool" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
//                   <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#10b98106" }}>
//                     <div className="flex items-center gap-3">
//                       <span className="text-xl">🎯</span>
//                       <div>
//                         <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
//                         <p className="text-xs text-gray-400">{TOOL.tagline}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xs">
//                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
//                     </div>
//                   </div>
//                   <div className="p-6 md:p-8">
//                     <CVAnalyserTool 
//                       isSignedIn={isSignedIn}
//                       onInsufficientTokens={(info) => setTokenModal(info)}  
//                     />
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
//                   <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
//                   <p className="text-xs text-amber-800 leading-relaxed">
//                     Your CV is analysed locally and not stored permanently. Analyses are powered by AI. Results reflect AI assessment — always apply your own judgment.
//                   </p>
//                 </div>
//               </motion.div>
//             )}

//             {/* WORKSPACE tab */}
//             {activeTab === "workspace" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 {isSignedIn
//                   ? <CVDashboard onReopenAnalysis={() => setActiveTab("tool")} />
//                   : (
//                     <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
//                       <div className="text-4xl mb-4">🔒</div>
//                       <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to access your workspace</h3>
//                       <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
//                         Save analyses, cover letters, and interview questions — then come back to study and improve.
//                       </p>
//                       <Link href="/sign-in?redirect_url=/tools/ai-cv-analyser"
//                         className="flex items-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-xs transition-colors">
//                         Sign in — it's free
//                       </Link>
//                     </div>
//                   )
//                 }
//               </motion.div>
//             )}

//             {/* HOW IT WORKS tab */}
//             {activeTab === "guide" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
//                 <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the AI CV Analyser Pro</h2>
//                 {HOW_IT_WORKS.map((step, i) => (
//                   <div key={step.step} className="flex gap-6 pb-10 relative">
//                     {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
//                     <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
//                       style={{ backgroundColor: "#10b98110", color: "#10b981" }}>
//                       {step.step}
//                     </div>
//                     <div>
//                       <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
//                       <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//                 <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xs p-6">
//                   <h3 className="text-base font-bold text-emerald-900 mb-3">💡 Pro tips for best results</h3>
//                   <ul className="space-y-2">
//                     {[
//                       "Always include the job description — the analysis is 3× more useful with it.",
//                       "Paste the plain text of your CV, not a formatted PDF copy. Formatting characters can confuse the analysis.",
//                       "Apply the keyword suggestions naturally — don't keyword stuff.",
//                       "The 'Tailor to This Job' rewrite is for a specific application; keep a master CV and tailor copies.",
//                       "Treat the ATS score as a floor, not a ceiling — a good CV for a human still matters more.",
//                     ].map((tip) => (
//                       <li key={tip} className="flex items-start gap-2 text-sm text-emerald-800">
//                         <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />{tip}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </motion.div>
//             )}

//             {/* REVIEWS tab */}
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
//                 {REVIEWS.map((r) => (
//                   <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{r.avatar}</div>
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
//                 {TABS.map((t) => (
//                   <button key={t.id} onClick={() => setActiveTab(t.id)}
//                     className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${
//                       activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
//                     }`}>
//                     <t.icon className="w-4 h-4" />{t.label}
//                   </button>
//                 ))}
//               </div>

//               <div className="bg-emerald-50 border border-emerald-100 rounded-xs p-5">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">Why CV analysis matters</p>
//                 {[
//                   { icon: Shield,     text: "75% of CVs never reach a human — they're filtered by ATS first", color: "#ef4444" },
//                   { icon: TrendingUp, text: "CVs with quantified achievements are 40% more likely to get interviews", color: "#10b981" },
//                   { icon: Target,     text: "Keyword matching is the #1 factor in ATS scoring", color: "#3b82f6" },
//                 ].map((s) => (
//                   <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
//                     <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
//                     <p className="text-xs text-emerald-800 leading-relaxed">{s.text}</p>
//                   </div>
//                 ))}
//               </div>

//               {related.length > 0 && (
//                 <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Career Tools</p>
//                   <div className="space-y-3">
//                     {related.map((t) => (
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

//         {/* Related tools */}
//         {related.length > 0 && (
//           <div className="mt-20 pt-12 border-t border-gray-100">
//             <div className="flex items-center justify-between mb-8">
//               <h2 className="text-2xl font-black text-gray-900">More Career Tools</h2>
//               <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
//                 See all <ArrowRight className="w-4 h-4" />
//               </Link>
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




// "use client";

// // =============================================================================
// // isaacpaha.com — AI CV Analyser Pro — Page Shell
// // app/tools/ai-cv-analyser/_components/cv-analyser-page.tsx
// // =============================================================================

// import React, { useState }   from "react";
// import Link                   from "next/link";
// import { motion }             from "framer-motion";
// import {
//   ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
//   MessageSquare, BookOpen, Zap, Info, ArrowRight, Target,
//   Shield, TrendingUp, Sparkles, Award,
// } from "lucide-react";
// import { CVAnalyserTool }         from "./cv-analyser-tool";
// import { TOOL_CATEGORIES, TOOLS } from "@/lib/data/tools-data";
// import { ToolCard } from "../../_tools/tools-card";

// // ─── Tool data ────────────────────────────────────────────────────────────────

// const TOOL = TOOLS.find((t) => t.slug === "ai-cv-analyser")!;

// const HOW_IT_WORKS = [
//   {
//     step: "01",
//     title: "Paste your CV",
//     desc:  "Copy and paste the full text of your CV — include your summary, experience, education, and skills sections. The more complete it is, the more specific the feedback.",
//   },
//   {
//     step: "02",
//     title: "Add the job description (recommended)",
//     desc:  "Paste in the job description you're targeting. This unlocks keyword gap analysis, job match scoring, and role-specific interview questions. Without it, you get general feedback.",
//   },
//   {
//     step: "03",
//     title: "Select your role type",
//     desc:  "Choose a role mode (Tech, Finance, Graduate, Business, etc.) to calibrate the analysis to your sector's standards and vocabulary.",
//   },
//   {
//     step: "04",
//     title: "Get your analysis",
//     desc:  "In ~8 seconds, you receive: 5 scores, keyword gap analysis, section-by-section feedback, bullet rewrites, language improvements, and interview questions.",
//   },
//   {
//     step: "05",
//     title: "Apply improvements",
//     desc:  "Use the AI rewrite tools to improve sections, generate a full rewrite, or tailor your CV to a specific job. Copy the improved text back into your CV.",
//   },
// ];

// const REVIEWS = [
//   {
//     name: "Sarah J.", role: "Software Engineer",     avatar: "SJ", rating: 5, date: "1 week ago",
//     body: "The keyword gap analysis was the game-changer for me. I had no idea how many critical terms were missing from my CV. Applied the changes and got 4 interview calls in 2 weeks.",
//   },
//   {
//     name: "Daniel O.", role: "Finance Graduate",     avatar: "DO", rating: 5, date: "2 weeks ago",
//     body: "The bullet point rewrites transformed my vague descriptions into strong, quantified achievements. The 'before and after' format made it really easy to see exactly what to change.",
//   },
//   {
//     name: "Amara B.", role: "Career Changer",        avatar: "AB", rating: 5, date: "3 weeks ago",
//     body: "I'm transitioning from teaching to product management. The tailor-to-JD feature helped me reframe my teaching experience in business language. Genuinely useful, not just generic AI waffle.",
//   },
//   {
//     name: "Marcus T.", role: "Senior Data Analyst",  avatar: "MT", rating: 4, date: "1 month ago",
//     body: "ATS score went from 61 to 88 after applying the suggestions. The section-by-section feedback was honest — it told me my professional summary was weak and why. Fixed it in 20 minutes.",
//   },
// ];

// function ReadingProgress() {
//   const [width, setWidth] = React.useState(0);
//   React.useEffect(() => {
//     const h = () => {
//       const el = document.documentElement;
//       setWidth(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)));
//     };
//     window.addEventListener("scroll", h, { passive: true });
//     return () => window.removeEventListener("scroll", h);
//   }, []);
//   return (
//     <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
//       <div className="h-full bg-emerald-500 transition-[width] duration-100" style={{ width: `${width}%` }} />
//     </div>
//   );
// }

// function StarRow({ rating }: { rating: number }) {
//   return (
//     <div className="flex gap-0.5">
//       {[1,2,3,4,5].map((s) => (
//         <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
//       ))}
//     </div>
//   );
// }

// interface CVAnalyserPageProps {
//   isSignedIn: boolean;
// }

// export function CVAnalyserPage({ isSignedIn }: CVAnalyserPageProps) {
//   const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
//   const [copied,    setCopied]    = useState(false);

//   const category = TOOL_CATEGORIES.find((c) => c.name === TOOL?.category);
//   const related  = TOOLS.filter((t) => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);

//   if (!TOOL) return null;

//   const handleShare = () => {
//     navigator.clipboard.writeText(window.location.href);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const TABS = [
//     { id: "tool",    label: "Use the Tool",  icon: Zap         },
//     { id: "guide",   label: "How It Works",  icon: BookOpen    },
//     { id: "reviews", label: "Reviews",       icon: MessageSquare },
//   ] as const;

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       <ReadingProgress />

//       <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
//         style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }}
//       />
//       <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none bg-emerald-400" />

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
//                 style={{ backgroundColor: "#10b98110", borderColor: "#10b98130" }}>
//                 🎯
//               </div>
//               <div>
//                 <div className="flex flex-wrap items-center gap-2 mb-1">
//                   <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
//                   <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-emerald-50 border-emerald-200 text-emerald-700">
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
//                   </span>
//                   <span className="text-[9px] font-black tracking-widest uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-xs">NEW</span>
//                 </div>
//                 <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
//               </div>
//             </div>

//             <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

//             <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
//               <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400" />{TOOL.usageCount.toLocaleString()} CVs analysed</span>
//               <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{TOOL.ratingAvg.toFixed(1)} ({TOOL.ratingCount} reviews)</span>
//               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
//               <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Free</span>
//             </div>

//             <div className="flex flex-wrap gap-2 mb-6">
//               {TOOL.features.map((f) => (
//                 <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
//                   <Check className="w-3 h-3 text-emerald-400" />{f}
//                 </span>
//               ))}
//             </div>

//             <div className="flex items-center gap-3 flex-wrap">
//               <button onClick={() => setActiveTab("tool")}
//                 className="flex items-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-xs transition-colors shadow-sm">
//                 <Sparkles className="w-4 h-4" />Analyse My CV
//               </button>
//               <button onClick={handleShare}
//                 className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
//                 {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
//                 {copied ? "Copied!" : "Share"}
//               </button>
//             </div>
//           </div>

//           {/* Right: stat card */}
//           <div className="hidden lg:block">
//             <div className="bg-emerald-50 border border-emerald-200 rounded-xs p-5">
//               <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-4">What you get</p>
//               <div className="space-y-3">
//                 {[
//                   { icon: Target,      label: "5-Score Analysis",          desc: "ATS, Language, Structure, Match, Keywords", color: "#f59e0b" },
//                   { icon: Shield,      label: "ATS Compatibility",          desc: "Know if your CV survives the filter",        color: "#ef4444" },
//                   { icon: TrendingUp,  label: "Job Match Score",            desc: "How well you fit the specific role",         color: "#3b82f6" },
//                   { icon: Sparkles,    label: "AI Rewrites",                desc: "Bullet points rewritten with impact",        color: "#8b5cf6" },
//                   { icon: MessageSquare,label:"Interview Questions",        desc: "Tailored to your CV + JD",                   color: "#f97316" },
//                 ].map((s) => (
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

//         {/* Tab content */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">

//             {/* TOOL tab */}
//             {activeTab === "tool" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
//                   <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#10b98106" }}>
//                     <div className="flex items-center gap-3">
//                       <span className="text-xl">🎯</span>
//                       <div>
//                         <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
//                         <p className="text-xs text-gray-400">{TOOL.tagline}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xs">
//                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
//                     </div>
//                   </div>
//                   <div className="p-6 md:p-8">
//                     <CVAnalyserTool />
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
//                   <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
//                   <p className="text-xs text-amber-800 leading-relaxed">
//                     Your CV is analysed locally and not stored permanently. Analyses are powered by AI. Results reflect AI assessment — always apply your own judgment.
//                   </p>
//                 </div>
//               </motion.div>
//             )}

//             {/* HOW IT WORKS tab */}
//             {activeTab === "guide" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
//                 <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the AI CV Analyser Pro</h2>
//                 {HOW_IT_WORKS.map((step, i) => (
//                   <div key={step.step} className="flex gap-6 pb-10 relative">
//                     {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
//                     <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
//                       style={{ backgroundColor: "#10b98110", color: "#10b981" }}>
//                       {step.step}
//                     </div>
//                     <div>
//                       <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
//                       <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//                 <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xs p-6">
//                   <h3 className="text-base font-bold text-emerald-900 mb-3">💡 Pro tips for best results</h3>
//                   <ul className="space-y-2">
//                     {[
//                       "Always include the job description — the analysis is 3× more useful with it.",
//                       "Paste the plain text of your CV, not a formatted PDF copy. Formatting characters can confuse the analysis.",
//                       "Apply the keyword suggestions naturally — don't keyword stuff.",
//                       "The 'Tailor to This Job' rewrite is for a specific application; keep a master CV and tailor copies.",
//                       "Treat the ATS score as a floor, not a ceiling — a good CV for a human still matters more.",
//                     ].map((tip) => (
//                       <li key={tip} className="flex items-start gap-2 text-sm text-emerald-800">
//                         <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />{tip}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </motion.div>
//             )}

//             {/* REVIEWS tab */}
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
//                 {REVIEWS.map((r) => (
//                   <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{r.avatar}</div>
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
//                 {TABS.map((t) => (
//                   <button key={t.id} onClick={() => setActiveTab(t.id)}
//                     className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${
//                       activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
//                     }`}>
//                     <t.icon className="w-4 h-4" />{t.label}
//                   </button>
//                 ))}
//               </div>

//               <div className="bg-emerald-50 border border-emerald-100 rounded-xs p-5">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">Why CV analysis matters</p>
//                 {[
//                   { icon: Shield,     text: "75% of CVs never reach a human — they're filtered by ATS first", color: "#ef4444" },
//                   { icon: TrendingUp, text: "CVs with quantified achievements are 40% more likely to get interviews", color: "#10b981" },
//                   { icon: Target,     text: "Keyword matching is the #1 factor in ATS scoring", color: "#3b82f6" },
//                 ].map((s) => (
//                   <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
//                     <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
//                     <p className="text-xs text-emerald-800 leading-relaxed">{s.text}</p>
//                   </div>
//                 ))}
//               </div>

//               {related.length > 0 && (
//                 <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Career Tools</p>
//                   <div className="space-y-3">
//                     {related.map((t) => (
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

//         {/* Related tools */}
//         {related.length > 0 && (
//           <div className="mt-20 pt-12 border-t border-gray-100">
//             <div className="flex items-center justify-between mb-8">
//               <h2 className="text-2xl font-black text-gray-900">More Career Tools</h2>
//               <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
//                 See all <ArrowRight className="w-4 h-4" />
//               </Link>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//               {related.map((t) => <ToolCard key={t.id} tool={t} />)}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }