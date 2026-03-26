"use client";

// =============================================================================
// isaacpaha.com — Comparative Scripture Explorer — Page Shell
// app/tools/scripture-explorer/_components/scripture-explorer-page.tsx
// =============================================================================

import React, { useState }   from "react";
import Link                   from "next/link";
import { motion }             from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, ArrowRight, Scale, Globe,
  Sparkles, History, TrendingUp, Info, Layers,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES }    from "@/lib/data/tools-data";
import { ScriptureExplorerTool }     from "./scripture-explorer-tool";
import { ScriptureDashboard } from "./scripture-dashboard";
import { ToolCard } from "../../_tools/tools-card";


const TOOL = TOOLS.find((t) => t.slug === "scripture-explorer")!;

const HOW_IT_WORKS = [
  { step: "01", title: "Enter a topic, question, or figure", desc: "Type anything: a theme ('forgiveness'), a person ('Moses'), a concept ('Day of Judgement'), or a verse reference ('Genesis 1'). The tool understands natural language." },
  { step: "02", title: "Choose your exploration mode", desc: "Compare Traditions (side-by-side), Explore a Figure (in-depth look at a prophet or key person), or Deep Dive (detailed scholarly analysis)." },
  { step: "03", title: "Receive a structured comparison", desc: "In ~6 seconds, you get: each tradition's perspective, relevant passages with references, historical context, shared connections, and key differences — all presented neutrally." },
  { step: "04", title: "Ask follow-up questions", desc: "Use the AI Study Companion to go deeper. Ask for clarification, explore related topics, or request a simpler explanation. The AI maintains strict educational neutrality." },
  { step: "05", title: "Save to your library", desc: "Sign in to save explorations, add personal notes, star your favourites, and build a personal scripture study library you can return to." },
];

const REVIEWS = [
  { name: "Dr. A. Williams", role: "Religious Studies Lecturer", avatar: "AW", rating: 5, date: "1 week ago",
    body: "I've recommended this to my students. The balance and neutrality are genuinely impressive. It presents differences without hierarchy — which is harder to achieve than it sounds. The historical context layer is excellent." },
  { name: "Fatima H.",       role: "Islamic Studies Student",    avatar: "FH", rating: 5, date: "2 weeks ago",
    body: "As a Muslim student taking an interfaith course, this tool helped me understand Christian and Jewish perspectives in a way that felt respectful and fair. The passage references made it easy to verify everything." },
  { name: "Samuel B.",       role: "Pastor & Theologian",        avatar: "SB", rating: 5, date: "3 weeks ago",
    body: "What I appreciate most is that it doesn't flatten differences. It shows where traditions genuinely diverge without suggesting either is wrong. That's the right approach for interfaith education." },
  { name: "Yael R.",         role: "Jewish Education Coordinator",avatar: "YR", rating: 5, date: "1 month ago",
    body: "The Jewish perspective is given equal weight to the others, which isn't always the case in comparative tools. The internalDiversity notes acknowledging different denominations are a thoughtful touch." },
];

function ReadingProgress() {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => {
      const el = document.documentElement;
      setW(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)));
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full bg-indigo-500 transition-[width] duration-100" style={{ width: `${w}%` }} /></div>;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />)}
    </div>
  );
}

interface ScriptureExplorerPageProps { isSignedIn: boolean; }

export function ScriptureExplorerPage({ isSignedIn }: ScriptureExplorerPageProps) {
  const [activeTab, setActiveTab] = useState<"tool" | "library" | "guide" | "reviews">("tool");
  const [copied,    setCopied]    = useState(false);

  const category = TOOL_CATEGORIES.find(c => c.name === TOOL?.category);
  const related  = TOOLS.filter(t => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);
  if (!TOOL) return null;

  const TABS = [
    { id: "tool",    label: "Explore",        icon: Sparkles      },
    ...(isSignedIn ? [{ id: "library", label: "My Library", icon: BookOpen }] : []),
    { id: "guide",   label: "How It Works",   icon: Zap           },
    { id: "reviews", label: "Reviews",        icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-gray-900">
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
              {bc.href === "#" ? <span className="text-gray-600 font-medium truncate max-w-[200px]">{bc.label}</span>
                : <Link href={bc.href} className="hover:text-gray-700 transition-colors">{bc.label}</Link>}
            </React.Fragment>
          ))}
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
                style={{ backgroundColor: "#6366f110", borderColor: "#6366f130" }}>📖</div>
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
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-400" />{TOOL.usageCount.toLocaleString()} explorers</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{TOOL.ratingAvg.toFixed(1)} ({TOOL.ratingCount} reviews)</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
              <span className="flex items-center gap-1.5 text-indigo-600 font-semibold"><span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />Free</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {TOOL.features.map(f => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                  <Check className="w-3 h-3 text-indigo-400" />{f}
                </span>
              ))}
            </div>

            {/* Principle callout */}
            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xs px-4 py-4 mb-5">
              <Scale className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-indigo-900 mb-1">Built on a principle of equal respect</p>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Every tradition is presented with the same depth, care, and neutrality. No tradition is ranked as more correct, more complete, or more valid than another. Differences are treated as distinct perspectives, not errors.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xs transition-colors shadow-sm">
                <Sparkles className="w-4 h-4" />Start Exploring
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("library")}
                  className="flex items-center gap-2 text-sm font-semibold text-indigo-700 border border-indigo-300 hover:bg-indigo-50 px-5 py-3 rounded-xs transition-colors">
                  <BookOpen className="w-4 h-4" />My Library
                </button>
              )}
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right card */}
          <div className="hidden lg:block">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xs p-5">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-4">The three traditions</p>
              <div className="space-y-3">
                {[
                  { emoji: "✝️", name: "Christianity", text: "The Bible (Old & New Testament)", color: "#3b82f6", notes: "Protestant, Catholic, Orthodox traditions" },
                  { emoji: "☪️", name: "Islam",         text: "The Qur'an",                     color: "#10b981", notes: "Sunni and Shia perspectives" },
                  { emoji: "✡️", name: "Judaism",       text: "Hebrew Bible / Tanakh",           color: "#f59e0b", notes: "Orthodox, Conservative, Reform traditions" },
                ].map(t => (
                  <div key={t.name} className="flex items-start gap-3 bg-white border rounded-xs px-3 py-3" style={{ borderColor: `${t.color}30` }}>
                    <span className="text-2xl">{t.emoji}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: t.color }}>{t.name}</p>
                      <p className="text-xs text-stone-600 font-medium">{t.text}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{t.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-indigo-500 mt-3 leading-snug italic">
                Future: Hinduism, Buddhism, and other major world traditions
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#6366f106" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📖</span>
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
                    <ScriptureExplorerTool isSignedIn={isSignedIn} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "library" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? <ScriptureDashboard onReopenExploration={() => setActiveTab("tool")} />
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <div className="text-4xl mb-4">📖</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to build your library</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                        Save explorations, add personal notes, and build a personal scripture study library you can return to.
                      </p>
                      <a href="/sign-in?redirect_url=/tools/scripture-explorer"
                        className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xs transition-colors">
                        Sign in — it's free
                      </a>
                    </div>
                  )
                }
              </motion.div>
            )}

            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the Comparative Scripture Explorer</h2>
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ backgroundColor: "#6366f110", color: "#6366f1" }}>{step.step}</div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xs p-6">
                  <h3 className="text-base font-bold text-indigo-900 mb-3">💡 Using this tool responsibly</h3>
                  <ul className="space-y-2">
                    {[
                      "This tool is for education and understanding — not for debate or to prove one religion right or wrong.",
                      "Always consult scholars, religious leaders, and primary texts for deeper theological study.",
                      "AI-generated comparisons are educational summaries — they do not represent all interpretations.",
                      "When sharing results, include the disclaimer that this is a general educational summary.",
                      "Internal diversity within each tradition is acknowledged but not fully captured — real traditions are complex.",
                    ].map(tip => (
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
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
                  <div className="flex items-center gap-2"><StarRow rating={5} /><span className="text-sm font-bold text-gray-700">{TOOL.ratingAvg.toFixed(1)}</span><span className="text-sm text-gray-400">({TOOL.ratingCount})</span></div>
                </div>
                {REVIEWS.map(r => (
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

          {/* Right sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xs p-5">
                <p className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-4">Why this matters</p>
                {[
                  { icon: Globe,   text: "Abrahamic traditions share 55% of the world's population. Understanding them matters.", color: "#6366f1" },
                  { icon: Scale,   text: "Most people know their own tradition but have little accurate knowledge of others.", color: "#f59e0b" },
                  { icon: History, text: "These texts shaped law, ethics, art, and culture across 3,000+ years of history.", color: "#10b981" },
                ].map(s => (
                  <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                    <p className="text-xs text-indigo-800 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>

              {related.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Education Tools</p>
                  <div className="space-y-3">
                    {related.map(t => (
                      <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <div className="min-w-0"><p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p><p className="text-xs text-gray-400 truncate">{t.tagline}</p></div>
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
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">More Education Tools</h2>
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">See all <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map(t => <ToolCard key={t.id} tool={t} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}