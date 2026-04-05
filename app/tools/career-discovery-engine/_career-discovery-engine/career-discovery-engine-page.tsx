"use client";

// =============================================================================
// isaacpaha.com — Career Discovery Engine — Page Shell
// app/tools/career-discovery-engine/_career-discovery/career-discovery-page.tsx
// =============================================================================

import React, { useState }     from "react";
import Link                    from "next/link";
import { motion }              from "framer-motion";
import {
  ArrowLeft, Star, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, ArrowRight, Briefcase, TrendingUp,
  Sparkles, Users, Info, Target, DollarSign, Zap, Award,
  Shield, BarChart2, Scale, MapPin,
} from "lucide-react";

import { ToolCard }                                 from "../../_tools/tools-card";
import { InsufficientTokensModal }                  from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter }                                from "next/navigation";
import type { NormalisedTool }                      from "../../_tools/tools-lab-client";
import { ToolViewTracker }                          from "../../_tools/tool-view-tracker";
import { ToolReviews }                              from "../../_tools/tool-reviews";
import { CareerDiscoveryTool, TokenGateInfo } from "./career-discovery-tool";
import { CareerDashboard } from "./career-dashboard";

// ─── How it works ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enter your skills, education and goals",
    desc:  "Add any skills you have — technical, soft, or domain-specific. Include your education background and what you actually want: high salary, remote work, fast entry, or job security.",
  },
  {
    step: "02",
    title: "The AI scans overlooked career markets",
    desc:  "Instead of showing you the same roles everyone knows, the engine specifically targets niche, specialised, and emerging careers — roles with high pay and low competition that most graduates have never heard of.",
  },
  {
    step: "03",
    title: "Receive 5–7 personalised career matches",
    desc:  "Each match includes salary data (entry to senior), competition level, time to break in, a full step-by-step entry roadmap, required certifications, and an honest verdict on whether it suits you.",
  },
  {
    step: "04",
    title: "Compare and go deeper",
    desc:  "Select up to 3 careers to compare side-by-side across 8 dimensions. Click any career for a deep dive: employer names, day-in-the-life, AI disruption risk, remote potential, and adjacent pivots.",
  },
  {
    step: "05",
    title: "Track your progress",
    desc:  "Save careers to your workspace. Mark the one you're actively pursuing, track which roadmap steps you've completed, and add personal notes — all stored in your dashboard.",
  },
];

// ─── Reading progress ─────────────────────────────────────────────────────────

function ReadingProgress({ accentColor }: { accentColor: string }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const e = document.documentElement; setW(Math.min(100, (e.scrollTop / (e.scrollHeight - e.clientHeight)) * 100)); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div className="h-full transition-[width] duration-100" style={{ width: `${w}%`, backgroundColor: accentColor }} />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CareerDiscoveryPageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;
  relatedTools: NormalisedTool[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CareerDiscoveryPage({ isSignedIn, tool, relatedTools }: CareerDiscoveryPageProps) {
  const [activeTab,   setActiveTab]   = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
  const [copied,      setCopied]      = useState(false);
  const [reopenCareer,setReopenCareer]= useState<any | null>(null);
  const [tokenModal,  setTokenModal]  = useState<TokenGateInfo | null>(null);
  const router = useRouter();

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

  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "💼", color: "#ec4899" };
  const ACCENT = tool.accentColor;

  const TABS = [
    { id: "tool",      label: "Find Hidden Careers", icon: Sparkles    },
    ...(isSignedIn ? [{ id: "workspace" as const, label: "My Careers", icon: TrendingUp }] : []),
    { id: "guide",     label: "How It Works",        icon: BookOpen    },
    { id: "reviews",   label: "Reviews",             icon: MessageSquare },
  ] as const satisfies readonly { id: "tool" | "workspace" | "guide" | "reviews"; label: string; icon: any }[];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress accentColor={ACCENT} />
      <ToolViewTracker toolId={tool.id} />

      {/* Background texture */}
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
              {bc.href === "#"
                ? <span className="text-gray-600 font-medium">{bc.label}</span>
                : <Link href={bc.href} className="hover:text-gray-700 transition-colors">{bc.label}</Link>}
            </React.Fragment>
          ))}
        </nav>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
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
                    style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
                  </span>
                  {tool.isNew && (
                    <span className="text-[9px] font-black tracking-widest uppercase text-white px-2 py-0.5 rounded-xs"
                      style={{ backgroundColor: ACCENT }}>NEW</span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{tool.name}</h1>
              </div>
            </div>

            {/* Viral hook */}
            <div className="bg-stone-900 text-white rounded-xs px-5 py-4 mb-5">
              <p className="text-base font-black leading-tight mb-1">
                Stop following crowded career paths.
              </p>
              <p className="text-sm text-white/65 leading-relaxed">
                Most graduates compete for the same 10 roles. There are hundreds of high-paying, low-competition careers they've never heard of. <span className="text-pink-400 font-semibold">This tool shows you exactly what they're missing.</span>
              </p>
            </div>

            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{tool.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              {tool.usageCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" style={{ color: ACCENT }} />
                  {tool.usageCount.toLocaleString()} careers discovered
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
                  🪙 {tool.tokenCost} tokens per search
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

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: ACCENT }}>
                <Sparkles className="w-4 h-4" />Find My Hidden Careers
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs transition-colors border"
                  style={{ color: ACCENT, borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}08` }}>
                  <TrendingUp className="w-4 h-4" />My Careers
                </button>
              )}
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right sidebar — what you get */}
          <div className="hidden lg:block">
            <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>What You Get</p>
              <div className="space-y-3">
                {[
                  { emoji: "💎", label: "Hidden Careers",         desc: "SAP, GRC, RevOps, ISO auditing & more" },
                  { emoji: "💰", label: "Salary Insights",        desc: "Entry → mid → senior salary ranges"    },
                  { emoji: "🧠", label: "Why It's Overlooked",    desc: "The viral hook for each career"        },
                  { emoji: "🪜", label: "Entry Roadmap",          desc: "Step-by-step with real resources"      },
                  { emoji: "📜", label: "Certification Paths",    desc: "What to study, where, and how much"    },
                  { emoji: "📊", label: "Competition Indicator",  desc: "🟢 Low  🟡 Medium  🔴 High"           },
                  { emoji: "⏱",  label: "Time-to-Entry",         desc: "Realistic timelines, not guesses"      },
                  { emoji: "🔄", label: "Career Comparison",      desc: "Compare up to 3 careers side-by-side" },
                  { emoji: "⚡", label: "Fastest to Income",      desc: "Quickest route to your first paycheck" },
                  { emoji: "🤖", label: "Career Coach",           desc: "Ask anything, get strategic advice"    },
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

        {/* ── TABS ────────────────────────────────────────────────────────── */}
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

        {/* ── CONTENT ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {/* TOOL tab */}
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
                    <CareerDiscoveryTool
                      isSignedIn={isSignedIn}
                      onInsufficientTokens={(info) => setTokenModal(info)}
                      reopenCareer={reopenCareer}
                      onReopened={() => setReopenCareer(null)}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-blue-50 border border-blue-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Career data is based on current market trends and AI analysis. Always verify salary ranges on platforms like LinkedIn, Glassdoor, or ITJobsWatch before making career decisions.
                  </p>
                </div>
              </motion.div>
            )}

            {/* WORKSPACE tab */}
            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? (
                    <CareerDashboard
                      onReopenCareer={(careerJson) => {
                        try {
                          setReopenCareer(JSON.parse(careerJson));
                          setActiveTab("tool");
                        } catch {}
                      }}
                    />
                  )
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <div className="text-4xl mb-4">{tool.icon}</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to track your careers</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                        Save careers, track your roadmap progress, and build your personal career strategy.
                      </p>
                      <Link href="/sign-in?redirect_url=/tools/career-discovery-engine"
                        className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs"
                        style={{ backgroundColor: ACCENT }}>
                        Sign in — it's free
                      </Link>
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
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}

                {/* Strategy section */}
                <div className="border rounded-xs p-6 mt-4" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: "#831843" }}>💡 How to get the most out of it</h3>
                  <ul className="space-y-2">
                    {[
                      "Be honest about your skills — including soft skills like communication, analysis, and attention to detail. These match more careers than you'd expect.",
                      "Don't filter by salary target too aggressively. The best career for you might pay less now but grow faster.",
                      "Read the 'Why No One Talks About This' section for every career — that's where the real insight is.",
                      "Use the comparison tool after you've identified 2–3 interesting careers. It makes the right choice obvious.",
                      "The career coach can answer very specific questions: 'How do I get my first SAP role with no experience?' — ask it.",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm" style={{ color: "#831843" }}>
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
                  accentColor={ACCENT}
                  isSignedIn={isSignedIn}
                />
              </motion.div>
            )}
          </div>

          {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">

              {/* Quick jump */}
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

              {/* Why most grads struggle */}
              <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}05`, borderColor: `${ACCENT}20` }}>
                <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>
                  Why graduates struggle
                </p>
                {[
                  { text: "They only know the 10 most common roles",            color: "#ef4444" },
                  { text: "They compete in saturated markets with thousands",   color: "#f59e0b" },
                  { text: "No one teaches them about niche, high-demand roles", color: "#8b5cf6" },
                  { text: "They don't know SAP, GRC, RevOps, ISO even exist",   color: ACCENT    },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#831843" }}>{s.text}</p>
                  </div>
                ))}
              </div>

              {/* Example hidden careers */}
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Example Hidden Careers</p>
                {[
                  { title: "SAP Functional Consultant",  salary: "£60k–£100k", comp: "🟢" },
                  { title: "GRC Analyst",                salary: "£45k–£80k",  comp: "🟢" },
                  { title: "RevOps Manager",             salary: "£55k–£90k",  comp: "🟡" },
                  { title: "ISO 27001 Lead Auditor",     salary: "£50k–£85k",  comp: "🟢" },
                  { title: "Power Platform Developer",   salary: "£45k–£75k",  comp: "🟡" },
                ].map((c) => (
                  <div key={c.title} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-stone-800">{c.title}</p>
                      <p className="text-[10px] text-stone-400">{c.salary}</p>
                    </div>
                    <span className="text-sm">{c.comp}</span>
                  </div>
                ))}
              </div>

              {/* Related tools */}
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
        onPlayGame={() => { setTokenModal(null); router.push("/games"); }}
      />
    </div>
  );
}