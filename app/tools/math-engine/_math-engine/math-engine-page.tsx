"use client";

// =============================================================================
// isaacpaha.com — Math Understanding Engine — Page Shell
// app/tools/math-engine/_components/math-engine-page.tsx
// =============================================================================

import React, { useState }    from "react";
import Link                   from "next/link";
import { motion }             from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, Info, ArrowRight, Brain,
  Globe, History, Lightbulb, BarChart2, Target, Sparkles,
  TrendingUp,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/data/tools-data";
import { MathEngineTool, MathReopenData } from "./math-engine-tool";
import { ToolCard } from "../../_tools/tools-card";
import { MathDashboard }          from "./math-dashboard";
 
const TOOL     = TOOLS.find((t) => t.slug === "math-engine")!;
const ACCENT   = "#6366f1";
 
const HOW_IT_WORKS = [
  { step: "01", title: "Paste any question or topic",    desc: "Type or paste a maths question, concept, or topic — from 'solve x² - 5x + 6' to 'explain differentiation from scratch'." },
  { step: "02", title: "Select your level",              desc: "Choose GCSE, A-Level, University (UK) or Middle School, High School, College (US). The language, depth, and examples adapt completely." },
  { step: "03", title: "Get your full breakdown",        desc: "In ~6 seconds: step-by-step solution, why the method works, the history behind the concept, real-world applications, and an interactive graph if applicable." },
  { step: "04", title: "Go simpler or deeper",           desc: "Click 'Explain simpler' for a fresh analogy-based explanation, or 'Go deeper' to see proofs and advanced theory beyond your level." },
  { step: "05", title: "Practice & ask the tutor",       desc: "Generate 5 practice questions that start similar and increase in difficulty. Use the AI Tutor to ask any follow-up — like having a private tutor on demand." },
];
 
const REVIEWS = [
  { name: "Kezia A.", role: "GCSE Student",          avatar: "KA", rating: 5, date: "1 week ago",    body: "I finally understand why the quadratic formula works. Every teacher just made us memorise it — this actually explained the logic. The real-world examples with physics blew my mind." },
  { name: "Thomas R.", role: "A-Level Maths Teacher", avatar: "TR", rating: 5, date: "2 weeks ago",   body: "I use this to generate explanations for topics I'm teaching. The 'History' section gives students amazing context — they suddenly see why calculus was invented, not just how to use it." },
  { name: "Priya S.", role: "University Student",     avatar: "PS", rating: 5, date: "3 weeks ago",   body: "The 'Why it works' section is unlike anything I've seen. It explains the actual mathematical intuition, not just the procedure. And the AI Tutor for follow-up questions is genuinely useful." },
  { name: "David O.", role: "Parent / Home Educator", avatar: "DO", rating: 4, date: "1 month ago",   body: "My son was struggling with fractions. The 'Explain like I'm 10' mode used an analogy with pizza slices that finally made it click. The practice questions with hints sealed it." },
];
 
function ReadingProgress() {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const e = document.documentElement; setW(Math.min(100, (e.scrollTop / (e.scrollHeight - e.clientHeight)) * 100)); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full bg-indigo-600 transition-[width] duration-100" style={{ width: `${w}%` }} /></div>;
}
 
function StarRow({ rating }: { rating: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />)}</div>;
}
 
export function MathEnginePage({ isSignedIn }: { isSignedIn: boolean }) {
  const [activeTab, setActiveTab] = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
  const [copied,    setCopied]    = useState(false);
  const [reopenData, setReopenData] = useState<MathReopenData | null>(null);
 
  const category = TOOL_CATEGORIES.find((c) => c.name === TOOL?.category);
  const related  = TOOLS.filter((t) => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);
  if (!TOOL) return null;
 
  const TABS = [
    { id: "tool",      label: "Understand Maths",  icon: Brain          },
    ...(isSignedIn ? [{ id: "workspace", label: "My Workspace",  icon: TrendingUp }] : []),
    { id: "guide",     label: "How It Works",       icon: BookOpen       },
    { id: "reviews",   label: "Reviews",            icon: MessageSquare  },
  ] as const;
 
  return (
    <div className="min-h-screen bg-white">
      <ReadingProgress />
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none bg-indigo-400" />
 
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: TOOL.name, href: "#" }].map((bc, i) => (
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
                🧠
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-indigo-50 border-indigo-200 text-indigo-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />Live
                  </span>
                  <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-xs">NEW</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
              </div>
            </div>
 
            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>
 
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5 font-semibold text-indigo-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />Free
              </span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
              <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">🇬🇧 GCSE · A-Level · University</span>
              <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">🇺🇸 Middle · High School · College</span>
            </div>
 
            <div className="flex flex-wrap gap-2 mb-6">
              {TOOL.features.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                  <Check className="w-3 h-3 text-indigo-400" />{f}
                </span>
              ))}
            </div>
 
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: ACCENT }}>
                <Brain className="w-4 h-4" />Understand Any Question
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs transition-colors border"
                  style={{ color: ACCENT, borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}08` }}>
                  <TrendingUp className="w-4 h-4" />My Workspace
                </button>
              )}
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>
 
          {/* Right: what you get */}
          <div className="hidden lg:block">
            <div className="border border-indigo-100 rounded-xs p-5" style={{ backgroundColor: `${ACCENT}06` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>Not just the answer</p>
              <div className="space-y-3">
                {[
                  { icon: Target,    label: "Step-by-step solution",     desc: "Every step explained — no skipped logic",              color: "#6366f1" },
                  { icon: Lightbulb, label: "Why the method works",      desc: "The intuition behind every formula",                   color: "#f59e0b" },
                  { icon: History,   label: "History & origin",          desc: "Who discovered it, why it was needed",                 color: "#8b5cf6" },
                  { icon: Globe,     label: "Real-world applications",   desc: "Engineering, finance, physics, everyday life",         color: "#10b981" },
                  { icon: BarChart2, label: "Interactive visualisation", desc: "Graphs, diagrams, and charts where it helps",          color: "#3b82f6" },
                  { icon: BookOpen,  label: "Practice questions",        desc: "5 questions starting similar, getting harder",         color: "#f97316" },
                ].map((s) => (
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
            </div>
          </div>
        </div>
 
        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as "tool" | "workspace" | "guide" | "reviews")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id ? "text-indigo-600 border-indigo-600" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}>
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
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: `${ACCENT}06` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🧠</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
                        <p className="text-xs text-gray-400">{TOOL.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />Live
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <MathEngineTool isSignedIn={isSignedIn} reopenData={reopenData} onReopened={() => setReopenData(null)} />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-blue-50 border border-blue-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    This tool is designed for learning and understanding — not for submitting as your own work in exams. Use it to understand concepts, then practise on your own.
                  </p>
                </div>
              </motion.div>
            )}
 
            {/* WORKSPACE tab */}
            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? (
                    <MathDashboard
                      onReopenQuery={(resultJson, question, level) => {
                        setReopenData({ resultJson, question, level });
                        setActiveTab("tool");
                      }}
                    />
                  )
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <div className="text-4xl mb-4">🧠</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to access your workspace</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                        Save explanations, track practice progress across maths topics, and build your personal knowledge base.
                      </p>
                      <a href="/sign-in?redirect_url=/tools/math-engine"
                        className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors"
                        style={{ backgroundColor: ACCENT }}>
                        Sign in — it's free
                      </a>
                    </div>
                  )
                }
              </motion.div>
            )}
 
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the Math Understanding Engine</h2>
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={s.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10 text-indigo-700"
                      style={{ backgroundColor: `${ACCENT}12` }}>{s.step}</div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 border border-indigo-100 rounded-xs p-6" style={{ backgroundColor: `${ACCENT}06` }}>
                  <h3 className="text-base font-bold text-indigo-900 mb-3">💡 How to get the most out of it</h3>
                  <ul className="space-y-2">
                    {[
                      "Don't just read the answer — click 'Why this step?' on each step to understand the reasoning.",
                      "After reading, close the tool and try to explain the concept back to yourself in your own words.",
                      "Use the Practice tab after understanding — understanding first, then practice, not the other way round.",
                      "The AI Tutor works best for specific questions: 'Why does the sign change here?' not 'Help me with maths'.",
                      "For exam prep, use the 'Go deeper' mode to see what's expected at a higher level.",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-indigo-800">
                        <Check className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
 
            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
                {REVIEWS.map((r) => (
                  <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{r.avatar}</div>
                        <div><p className="text-sm font-bold text-gray-900">{r.name}</p><p className="text-xs text-gray-400">{r.role}</p></div>
                      </div>
                      <div className="text-right"><StarRow rating={r.rating} /><p className="text-xs text-gray-400 mt-1">{r.date}</p></div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
 
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map((t) => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as "tool" | "workspace" | "guide" | "reviews")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                      <t.icon className="w-4 h-4" />{t.label}
                    </button>
                  ))}
              </div>
 
              <div className="border border-indigo-100 rounded-xs p-5" style={{ backgroundColor: `${ACCENT}05` }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>Why this matters</p>
                {[
                  { text: "Most students can solve problems but don't understand why they work",     color: "#ef4444" },
                  { text: "Context and history make abstract concepts memorable and meaningful",     color: "#10b981" },
                  { text: "Real-world connections show students why maths is worth learning",        color: "#3b82f6" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <p className="text-xs text-indigo-800 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
 
              {related.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Education Tools</p>
                  <div className="space-y-3">
                    {related.map((t) => (
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
 
        {/* Related tools */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">More Education Tools</h2>
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">See all <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((t) => <ToolCard key={t.id} tool={t} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
