"use client";

// =============================================================================
// isaacpaha.com — Physics Understanding Engine — Page Shell
// app/tools/physics-engine/_components/physics-engine-page.tsx
// =============================================================================

import React, { useState }    from "react";
import Link                   from "next/link";
import { motion }             from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, Info, ArrowRight, Atom,
  Globe, History, Lightbulb, BarChart2, Brain, Telescope,
  FlaskConical, AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/data/tools-data";
import { PhysicsEngineTool, PhysicsReopenData, TokenGateInfo }      from "./physics-engine-tool";
import { ToolCard } from "../../_tools/tools-card";
import { PhysicsDashboard } from "./physics-dashboard";
import { InsufficientTokensModal } from "@/components/(tokens)/insufficient-tokens-model";
import { useRouter } from "next/navigation";

const TOOL   = TOOLS.find((t) => t.slug === "physics-engine")!;
const ACCENT = "#0ea5e9";
 
const HOW_IT_WORKS = [
  { step: "01", title: "Enter any physics topic or question", desc: "Anything from 'explain Newton's Second Law' to 'quantum entanglement' to just 'Thermodynamics'. Use Question Mode for specific questions or Theory Explorer for broad topics." },
  { step: "02", title: "Select your level",                   desc: "GCSE, A-Level, or University. The entire explanation — language, mathematical depth, examples, and exam tips — adapts completely to your level." },
  { step: "03", title: "Get your 8-layer breakdown",          desc: "In ~7 seconds: plain definition, governing law, why it exists, history & discovery, real-world applications, mental models, misconceptions corrected, and experiments to try." },
  { step: "04", title: "Go simpler or deeper on demand",      desc: "'Explain simpler' gives you a powerful analogy and stripped-back explanation. 'Go deeper' shows derivations, advanced theory, Nobel Prize connections, and cutting-edge research." },
  { step: "05", title: "Practice and ask the tutor",          desc: "Generate calculation or theory questions with worked solutions and mark schemes. The AI Tutor answers any follow-up question using Socratic teaching — guiding you to understand, not just telling you." },
];
 
const REVIEWS = [
  { name: "Amara T.",    role: "GCSE Physics Student",    avatar: "AT", rating: 5, date: "1 week ago",    body: "I've been failing electromagnetism for months. The 'Misconceptions' tab showed me exactly what I was getting wrong — that electric current doesn't 'flow from positive to negative electrons'. It finally clicked." },
  { name: "Dr. James R.", role: "A-Level Physics Teacher", avatar: "JR", rating: 5, date: "2 weeks ago",  body: "I use the Theory Explorer with my students for class introductions. The 'Why It Exists' section generates discussions about the history of science that no textbook provides. It's changed how I teach." },
  { name: "Kwame B.",    role: "University Physics Year 1",avatar: "KB", rating: 5, date: "3 weeks ago",   body: "The 'Go Deeper' feature on quantum mechanics showed me the actual wave function derivation and pointed me to Nobel Prize-winning work. This bridges the gap between A-Level and degree in a way nothing else does." },
  { name: "Sarah M.",    role: "Self-learner (parent)",    avatar: "SM", rating: 4, date: "1 month ago",   body: "My daughter is doing GCSE and I wanted to help but hadn't done physics in 20 years. The GCSE mode explained everything clearly enough for me to understand AND help her. The mental model analogies are brilliant." },
];
 
function ReadingProgress() {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const e = document.documentElement; setW(Math.min(100, (e.scrollTop / (e.scrollHeight - e.clientHeight)) * 100)); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full transition-[width] duration-100" style={{ backgroundColor: ACCENT, width: `${w}%` }} /></div>;
}
 
function StarRow({ rating }: { rating: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />)}</div>;
}
 
export function PhysicsEnginePage({ isSignedIn }: { isSignedIn: boolean }) {
  const [activeTab, setActiveTab] = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
  const [copied,    setCopied]    = useState(false);
  const [reopenData, setReopenData] = useState<PhysicsReopenData | null>(null);
  const router = useRouter();
  
    // ── NEW: token modal state ────────────────────────────────────────────────
      const [tokenModal, setTokenModal] = useState<TokenGateInfo | null>(null);
 
  const category = TOOL_CATEGORIES.find((c) => c.name === TOOL?.category);
  const related  = TOOLS.filter((t) => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);
  if (!TOOL) return null;
 
  const TABS = [
    { id: "tool",      label: "Understand Physics",  icon: Atom          },
    ...(isSignedIn ? [{ id: "workspace", label: "My Workspace",    icon: TrendingUp }] as const : []),
    { id: "guide",     label: "How It Works",         icon: BookOpen      },
    { id: "reviews",   label: "Reviews",              icon: MessageSquare },
  ] as const;
 
  return (
    <div className="min-h-screen bg-white">
      <ReadingProgress />
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.05] pointer-events-none" style={{ backgroundColor: ACCENT }} />
 
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
                style={{ backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}30` }}>
                ⚛️
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border"
                    style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
                  </span>
                  <span className="text-[9px] font-black tracking-widest uppercase text-white px-2 py-0.5 rounded-xs" style={{ backgroundColor: ACCENT }}>NEW</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
              </div>
            </div>
 
            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>
 
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: ACCENT }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Free
              </span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
              <span className="font-semibold" style={{ color: ACCENT }}>🇬🇧 GCSE · A-Level · University</span>
            </div>
 
            <div className="flex flex-wrap gap-2 mb-6">
              {TOOL.features.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                  <Check className="w-3 h-3" style={{ color: ACCENT }} />{f}
                </span>
              ))}
            </div>
 
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: ACCENT }}>
                <Atom className="w-4 h-4" />Understand Any Topic
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
 
          {/* Right: 8 layers breakdown */}
          <div className="hidden lg:block">
            <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>8-Layer Concept Breakdown</p>
              <div className="space-y-2.5">
                {[
                  { num: "1", label: "Plain English definition",  color: "#0ea5e9" },
                  { num: "2", label: "Governing law & equation",  color: "#6366f1" },
                  { num: "3", label: "Why this concept exists",   color: "#f59e0b" },
                  { num: "4", label: "History & key scientists",  color: "#8b5cf6" },
                  { num: "5", label: "Real-world applications",   color: "#10b981" },
                  { num: "6", label: "Mental model analogies",    color: "#f97316" },
                  { num: "7", label: "Misconceptions corrected",  color: "#ef4444" },
                  { num: "8", label: "Try it yourself experiments",color: "#ec4899"},
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
                activeTab === t.id ? "border-sky-500 text-sky-600" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
 
        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
 
            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: `${ACCENT}06` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚛️</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
                        <p className="text-xs text-gray-400">{TOOL.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-xs"
                      style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <PhysicsEngineTool 
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
                    This is an educational tool designed to build genuine understanding. Use it to learn concepts deeply, then practice independently. Not for submitting as coursework.
                  </p>
                </div>
              </motion.div>
            )}
 
            {/* WORKSPACE tab */}
            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? (
                    <PhysicsDashboard
                      onReopenQuery={(resultJson, question, level) => {
                        setReopenData({ resultJson, question, level });
                        setActiveTab("tool");
                      }}
                    />
                  )
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <div className="text-4xl mb-4">⚛️</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to access your workspace</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                        Save explanations, track practice progress across topics, and build your personal physics knowledge base.
                      </p>
                      <a href="/sign-in?redirect_url=/tools/physics-engine"
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
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the Physics Understanding Engine</h2>
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
                <div className="mt-4 border rounded-xs p-6" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: "#0c4a6e" }}>💡 Getting the most out of it</h3>
                  <ul className="space-y-2">
                    {[
                      "Always read the 'Why It Exists' tab — it transforms a formula into a story you'll never forget.",
                      "The 'Misconceptions' tab is often more valuable than the main explanation — it corrects your wrong model.",
                      "After reading, close the tool and try to explain the concept aloud. If you can explain it simply, you understand it.",
                      "Use the AI Tutor to push back: 'But why can't something just go faster than light?' — it handles it.",
                      "The Theory Explorer is excellent for revision — explore a whole topic area in one session.",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm" style={{ color: "#0c4a6e" }}>
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />{tip}
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
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: ACCENT }}>{r.avatar}</div>
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
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>
 
              <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}05`, borderColor: `${ACCENT}20` }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>Why students struggle with physics</p>
                {[
                  { text: "They memorise formulas without knowing why they exist",          color: "#ef4444" },
                  { text: "They're never shown the human story behind each discovery",       color: "#f59e0b" },
                  { text: "Misconceptions are never directly addressed and corrected",       color: "#8b5cf6" },
                  { text: "Real-world connections make concepts stick — and they're missing",color: "#10b981" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#0c4a6e" }}>{s.text}</p>
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

      {/* ── NEW: Insufficient Tokens Modal ─────────────────────────────────── */}
          <InsufficientTokensModal
            open={!!tokenModal}
            onClose={() => setTokenModal(null)}
            required={tokenModal?.required ?? 0}
            balance={tokenModal?.balance   ?? 0}
            toolName={tokenModal?.toolName ?? undefined}
            onPlayGame={() => {
              setTokenModal(null);
              router.push("/games"); // or open game overlay via context
            }}
          />
    </div>
  );
}