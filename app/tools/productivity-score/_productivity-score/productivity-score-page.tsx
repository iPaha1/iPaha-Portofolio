"use client";

// =============================================================================
// isaacpaha.com — Productivity Score — Page Shell
// app/tools/productivity-score/_components/productivity-score-page.tsx
// =============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, ArrowRight, TrendingUp, Target,
  Sparkles, Info, BarChart2, Brain, Repeat, Award, Flag,
} from "lucide-react";
import { ProductivityScoreTool } from "./productivity-score-tool";
import { ToolCard } from "../../_tools/tools-card";
import type { NormalisedTool } from "../../_tools/tools-lab-client";
import { ToolViewTracker } from "../../_tools/tool-view-tracker";
import { ToolReviews } from "../../_tools/tool-reviews";

// ─── How it works steps ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Answer 20 questions", desc: "About your focus, habits, systems, energy, and mindset. Be honest — the audit only works if you are." },
  { step: "02", title: "Get your score", desc: "0–100 productivity score with a clear breakdown across 5 categories. See exactly where you're strong and where you're struggling." },
  { step: "03", title: "Identify your bottleneck", desc: "The single biggest thing slowing you down. Most people have one dominant bottleneck — fix it and everything improves." },
  { step: "04", title: "Follow your 3-step plan", desc: "Personalised, actionable steps. One for today, one for this week, one for this month. No generic advice." },
  { step: "05", title: "Retake weekly", desc: "Track your progress. Most people improve 10–20 points in the first month just by following the plan." },
];

function ReadingProgress({ accentColor }: { accentColor: string }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const el = document.documentElement; setW(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100))); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full transition-[width] duration-100" style={{ width: `${w}%`, backgroundColor: accentColor }} /></div>;
}

function StarRow({ rating }: { rating: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=rating?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}</div>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductivityScorePageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;         // ← from DB via server page
  relatedTools: NormalisedTool[];       // ← same category, from DB
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductivityScorePage({ isSignedIn, tool, relatedTools }: ProductivityScorePageProps) {
  const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
  const [copied, setCopied] = useState(false);

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
  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "📊", color: "#14b8a6" };

  const handleShare = () => { 
    navigator.clipboard.writeText(window.location.href); 
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000); 
  };

  const TABS = [
    { id: "tool",    label: "Take the Audit", icon: Sparkles },
    { id: "guide",   label: "How It Works",   icon: BookOpen },
    { id: "reviews", label: "Reviews",        icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress accentColor={tool.accentColor} />

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
                  {tool.usageCount.toLocaleString()} people audited
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

            {/* Features from DB */}
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
                <Sparkles className="w-4 h-4" />Take the Audit
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
                What your score reveals
              </p>
              <div className="space-y-3 mb-5">
                {[
                  { score: "80–100", label: "Exceptional", desc: "You've built systems that work. Your challenge is sustainability." },
                  { score: "60–79", label: "Strong", desc: "Fix one bottleneck and you'll be elite." },
                  { score: "40–59", label: "Solid", desc: "Good foundations. Small changes = big gains." },
                  { score: "0–39", label: "Starting point", desc: "You're not broken — just missing systems." },
                ].map((range) => (
                  <div key={range.score} className="flex items-center gap-2 text-sm">
                    <span className="w-16 font-bold" style={{ color: tool.accentColor }}>{range.score}</span>
                    <span className="font-semibold text-stone-800">{range.label}</span>
                    <span className="text-xs text-stone-500">— {range.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: tool.accentColor }}>
                Most people improve 10–20 points in the first month.
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
                    <ProductivityScoreTool isSignedIn={isSignedIn} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* HOW IT WORKS */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How the {tool.name} works</h2>
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
                    💡 Why this works
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "Most productivity advice is generic. This audit is personal — it tells you YOUR bottleneck.",
                      "People fix the wrong thing. You might think you have a focus problem when it's actually a systems problem.",
                      "The 3-step plan is intentionally small. Big changes come from consistent small actions.",
                      "Tracking progress weekly builds momentum. You'll see your score improve.",
                    ].map(tip => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-stone-700">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tool.accentColor }} />{tip}
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
                  What people fix
                </p>
                {[
                  { icon: Target,   text: "Context switching → 2+ hours back per day", color: "#14b8a6" },
                  { icon: Brain,    text: "Shame cycles → actually starting tasks", color: "#8b5cf6" },
                  { icon: Repeat,   text: "No systems → clear priority every day", color: "#f59e0b" },
                  { icon: Zap,      text: "Bad timing → working when energy is highest", color: "#ec4899" },
                ].map(s => (
                  <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                    <p className="text-xs text-stone-700 leading-relaxed">{s.text}</p>
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
              {relatedTools.map(t => <ToolCard key={t.id} tool={t} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



// "use client";

// // =============================================================================
// // isaacpaha.com — Productivity Score — Page Shell
// // app/tools/productivity-score/_components/productivity-score-page.tsx
// // =============================================================================

// import React, { useState } from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import {
//   ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
//   MessageSquare, BookOpen, Zap, ArrowRight, TrendingUp, Target,
//   Sparkles, Info, BarChart2, Brain, Repeat, Award, Flag,
// } from "lucide-react";
// import { TOOLS, TOOL_CATEGORIES } from "@/lib/data/tools-data";
// import { ProductivityScoreTool } from "./productivity-score-tool";
// import { ToolCard } from "../../_tools/tools-card";

// const TOOL = TOOLS.find((t) => t.slug === "productivity-score")!;

// const HOW_IT_WORKS = [
//   { step: "01", title: "Answer 20 questions", desc: "About your focus, habits, systems, energy, and mindset. Be honest — the audit only works if you are." },
//   { step: "02", title: "Get your score", desc: "0–100 productivity score with a clear breakdown across 5 categories. See exactly where you're strong and where you're struggling." },
//   { step: "03", title: "Identify your bottleneck", desc: "The single biggest thing slowing you down. Most people have one dominant bottleneck — fix it and everything improves." },
//   { step: "04", title: "Follow your 3-step plan", desc: "Personalised, actionable steps. One for today, one for this week, one for this month. No generic advice." },
//   { step: "05", title: "Retake weekly", desc: "Track your progress. Most people improve 10–20 points in the first month just by following the plan." },
// ];

// const REVIEWS = [
//   { name: "Sarah C.", role: "Product Manager", avatar: "SC", rating: 5, date: "3 days ago",
//     body: "I've taken a dozen productivity quizzes. This one actually told me something I didn't know. My bottleneck was 'systems' — I had no reliable way to track priorities. Fixed it in a week. Score went from 58 to 74." },
//   { name: "David K.", role: "Freelance Developer", avatar: "DK", rating: 5, date: "1 week ago",
//     body: "The 3-step plan is perfect. Not overwhelming. I did step 1 (put phone in another room) and got more done in one morning than I usually do in two days. Shared my score on LinkedIn — got 5 DMs asking about the tool." },
//   { name: "Emma T.", role: "Marketing Director", avatar: "ET", rating: 5, date: "2 weeks ago",
//     body: "I thought I was 'bad at productivity' turns out my energy management was just off. Started working during my actual peak hours (10am-12pm) instead of fighting through 2pm slumps. Game changer." },
// ];

// function ReadingProgress() {
//   const [w, setW] = React.useState(0);
//   React.useEffect(() => {
//     const h = () => { const el = document.documentElement; setW(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100))); };
//     window.addEventListener("scroll", h, { passive: true });
//     return () => window.removeEventListener("scroll", h);
//   }, []);
//   return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full bg-teal-500 transition-[width] duration-100" style={{ width: `${w}%` }} /></div>;
// }

// function StarRow({ rating }: { rating: number }) {
//   return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=rating?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}</div>;
// }

// interface Props { isSignedIn: boolean; }

// export function ProductivityScorePage({ isSignedIn }: Props) {
//   const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
//   const [copied, setCopied] = useState(false);

//   const category = TOOL_CATEGORIES.find(c => c.name === TOOL?.category);
//   const related = TOOLS.filter(t => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);

//   if (!TOOL) return null;

//   const handleShare = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };

//   const TABS = [
//     { id: "tool",    label: "Take the Audit", icon: Sparkles },
//     { id: "guide",   label: "How It Works",   icon: BookOpen },
//     { id: "reviews", label: "Reviews",        icon: MessageSquare },
//   ] as const;

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       <ReadingProgress />
//       <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
//         style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
//       <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none bg-teal-400" />

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
//                 style={{ backgroundColor: "#14b8a610", borderColor: "#14b8a630" }}>📊</div>
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
//               <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-teal-400" />{TOOL.usageCount.toLocaleString()} people audited</span>
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

//             <div className="flex items-center gap-3 flex-wrap">
//               <button onClick={() => setActiveTab("tool")}
//                 className="flex items-center gap-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 px-5 py-3 rounded-xs transition-colors shadow-sm">
//                 <Sparkles className="w-4 h-4" />Take the Audit
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
//             <div className="bg-teal-50 border border-teal-200 rounded-xs p-5">
//               <p className="text-xs font-black text-teal-600 uppercase tracking-wider mb-4">What your score reveals</p>
//               <div className="space-y-3 mb-5">
//                 {[
//                   { score: "80–100", label: "Exceptional", desc: "You've built systems that work. Your challenge is sustainability." },
//                   { score: "60–79", label: "Strong", desc: "Fix one bottleneck and you'll be elite." },
//                   { score: "40–59", label: "Solid", desc: "Good foundations. Small changes = big gains." },
//                   { score: "0–39", label: "Starting point", desc: "You're not broken — just missing systems." },
//                 ].map((range) => (
//                   <div key={range.score} className="flex items-center gap-2 text-sm">
//                     <span className="w-16 font-bold text-teal-700">{range.score}</span>
//                     <span className="font-semibold text-stone-800">{range.label}</span>
//                     <span className="text-xs text-stone-500">— {range.desc}</span>
//                   </div>
//                 ))}
//               </div>
//               <p className="text-[11px] text-teal-600 leading-relaxed">
//                 Most people improve 10–20 points in the first month.
//               </p>
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

//         {/* Content */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">

//             {/* TOOL */}
//             {activeTab === "tool" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
//                   <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#14b8a606" }}>
//                     <div className="flex items-center gap-3">
//                       <span className="text-xl">📊</span>
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
//                     <ProductivityScoreTool isSignedIn={isSignedIn} />
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* HOW IT WORKS */}
//             {activeTab === "guide" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
//                 <h2 className="text-2xl font-black text-gray-900 mb-8">How the Productivity Score works</h2>
//                 {HOW_IT_WORKS.map((step, i) => (
//                   <div key={step.step} className="flex gap-6 pb-10 relative">
//                     {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
//                     <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
//                       style={{ backgroundColor: "#14b8a610", color: "#14b8a6" }}>{step.step}</div>
//                     <div>
//                       <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
//                       <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//                 <div className="mt-4 bg-teal-50 border border-teal-100 rounded-xs p-6">
//                   <h3 className="text-base font-bold text-teal-900 mb-3">💡 Why this works</h3>
//                   <ul className="space-y-2">
//                     {[
//                       "Most productivity advice is generic. This audit is personal — it tells you YOUR bottleneck.",
//                       "People fix the wrong thing. You might think you have a focus problem when it's actually a systems problem.",
//                       "The 3-step plan is intentionally small. Big changes come from consistent small actions.",
//                       "Tracking progress weekly builds momentum. You'll see your score improve.",
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
//                   <div className="flex items-center gap-2"><StarRow rating={5} /><span className="text-sm font-bold text-gray-700">{TOOL.ratingAvg.toFixed(1)}</span><span className="text-sm text-gray-400">({TOOL.ratingCount})</span></div>
//                 </div>
//                 {REVIEWS.map(r => (
//                   <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">{r.avatar}</div>
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

//               <div className="bg-teal-50 border border-teal-100 rounded-xs p-5">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-teal-400 mb-4">What people fix</p>
//                 {[
//                   { icon: Target,   text: "Context switching → 2+ hours back per day", color: "#14b8a6" },
//                   { icon: Brain,    text: "Shame cycles → actually starting tasks", color: "#8b5cf6" },
//                   { icon: Repeat,   text: "No systems → clear priority every day", color: "#f59e0b" },
//                   { icon: Zap,      text: "Bad timing → working when energy is highest", color: "#ec4899" },
//                 ].map(s => (
//                   <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
//                     <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
//                     <p className="text-xs text-teal-800 leading-relaxed">{s.text}</p>
//                   </div>
//                 ))}
//               </div>

//               {related.length > 0 && (
//                 <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Productivity Tools</p>
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
//               <h2 className="text-2xl font-black text-gray-900">More Productivity Tools</h2>
//               <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">See all <ArrowRight className="w-4 h-4" /></Link>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{related.map(t => <ToolCard key={t.id} tool={t} />)}</div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }