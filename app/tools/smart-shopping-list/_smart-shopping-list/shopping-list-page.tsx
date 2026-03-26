"use client";

// =============================================================================
// isaacpaha.com — Smart Shared Shopping List — Page Shell
// app/tools/smart-shopping-list/_components/shopping-list-page.tsx
// =============================================================================

import React, { useState } from "react";
import Link                  from "next/link";
import { motion }            from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, Info, ArrowRight, ShoppingCart,
  Sparkles, RefreshCw, Globe, Smartphone, Heart, TrendingUp,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/data/tools-data";
import { ShoppingListTool }       from "./shopping-list-tool";

const TOOL = TOOLS.find((t) => t.slug === "smart-shopping-list")!;

const HOW_IT_WORKS = [
  { step: "01", title: "Create a list",         desc: "Give your list a name — Weekly Shop, Party Prep, Monthly Bulk. Pick an emoji. Optionally set a budget." },
  { step: "02", title: "Add items",              desc: "Type item names and press Enter. Add quantities, categories, and estimated prices for smarter shopping. Or use the AI assistant to generate a full list from a meal description." },
  { step: "03", title: "Share with one link",    desc: "Each list has a unique shareable URL. Send it to your partner or family — they get a beautiful live shopping page. No account required for them." },
  { step: "04", title: "Shop in real-time",      desc: "Tick items off as you add them to your trolley. Your partner sees it update instantly on their phone. No more \"did you get the milk?\" messages." },
  { step: "05", title: "Track your budget",      desc: "Add estimated prices to see your total before checkout. Use receipt mode after shopping to compare estimated vs actual spend." },
  { step: "06", title: "Reuse & duplicate",      desc: "Save any list as a template. Next week's shop starts as a copy of this week's — just remove what you already have." },
];

const REVIEWS = [
  { name: "Clara M.",    role: "Mum of 3",                  avatar: "CM", rating: 5, date: "1 week ago",  body: "We've been using this for months. My husband and I share a list before the weekly shop — when he's at the supermarket and I'm at work, I can add things and he gets them. It's solved the 'I forgot your text' problem forever." },
  { name: "Theo R.",     role: "University Housemates",      avatar: "TR", rating: 5, date: "2 weeks ago", body: "Four of us share a flat. We've been using this for our communal shopping — everyone adds what they need, one person buys it. Split the cost at the end. Simple." },
  { name: "Amara K.",    role: "Freelancer",                  avatar: "AK", rating: 5, date: "3 weeks ago", body: "The AI meal planner is genuinely useful. I told it '5-day high-protein plan for one person, £50 budget' and it gave me a complete list with estimated prices. Saved me 20 minutes of thinking." },
  { name: "Daniel S.",   role: "Budget-conscious household",  avatar: "DS", rating: 4, date: "1 month ago", body: "The budget tracker helps a lot. Seeing £72 estimated before I even leave the house means I know which items are luxuries I can skip if I'm over. Receipt mode is clever too." },
];

function ReadingProgress() {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const el = document.documentElement; setW(Math.min(100, Math.max(0, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100))); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full bg-emerald-500 transition-[width] duration-100" style={{ width: `${w}%` }} /></div>;
}

function StarRow({ rating }: { rating: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=rating?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}</div>;
}

interface Props { isSignedIn: boolean; }

export function ShoppingListPage({ isSignedIn }: Props) {
  const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
  const [copied,    setCopied]    = useState(false);

  const category = TOOL_CATEGORIES.find(c => c.name === TOOL?.category);
  const related  = TOOLS.filter(t => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);

  if (!TOOL) return null;

  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const TABS = [
    { id: "tool",    label: "My Lists",      icon: ShoppingCart  },
    { id: "guide",   label: "How It Works",  icon: BookOpen      },
    { id: "reviews", label: "Reviews",       icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress />
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.06] pointer-events-none bg-emerald-400" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[{ label:"Home",href:"/" },{ label:"Tools",href:"/tools" },{ label:TOOL.name,href:"#" }].map((bc,i) => (
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
                style={{ backgroundColor: "#10b98115", borderColor: "#10b98130" }}>
                🛒
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-emerald-50 border-emerald-200 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
                  </span>
                  <span className="text-[9px] font-black tracking-widest uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-xs">NEW</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400" />{TOOL.usageCount.toLocaleString()} lists created</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{TOOL.ratingAvg.toFixed(1)} ({TOOL.ratingCount})</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Free · No account needed</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {TOOL.features.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                  <Check className="w-3 h-3 text-emerald-400" />{f}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-xs transition-colors shadow-sm">
                <ShoppingCart className="w-4 h-4" />Create a List
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share Tool"}
              </button>
            </div>
          </div>

          {/* Right: viral hook card */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xs p-5">
              <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-4">Why families love this</p>
              <div className="space-y-3">
                {[
                  { icon: Globe,       text: "One link, works on any device — no app to download", color: "#059669" },
                  { icon: RefreshCw,   text: "Real-time updates — your partner sees it the moment you add it", color: "#0284c7" },
                  { icon: Sparkles,    text: "AI generates a full shopping list from your meal plan", color: "#7c3aed" },
                  { icon: Smartphone,  text: "Mobile-first — built for use inside a supermarket aisle", color: "#d97706" },
                  { icon: Heart,       text: "No more duplicate purchases or forgotten items", color: "#dc2626" },
                ].map((s) => (
                  <div key={s.text} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                      <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">{s.text}</p>
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
                activeTab === t.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}>
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
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#10b98108" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🛒</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
                        <p className="text-xs text-gray-400">{TOOL.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
                    </div>
                  </div>
                  <div className="p-0">
                    <ShoppingListTool isSignedIn={isSignedIn} />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Lists created without an account are saved to your browser. <a href="/sign-in?redirect_url=/tools/smart-shopping-list" className="font-bold underline">Sign in</a> to save lists to your account, access them from any device, and keep them permanently.
                  </p>
                </div>
              </motion.div>
            )}

            {/* HOW IT WORKS tab */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How the Smart Shopping List works</h2>
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ backgroundColor: "#10b98115", color: "#10b981" }}>
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* REVIEWS tab */}
            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
                  <div className="flex items-center gap-2">
                    <StarRow rating={5} />
                    <span className="text-sm font-bold text-gray-700">{TOOL.ratingAvg.toFixed(1)}</span>
                    <span className="text-sm text-gray-400">({TOOL.ratingCount})</span>
                  </div>
                </div>
                {REVIEWS.map((r) => (
                  <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{r.avatar}</div>
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

              {related.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Related Tools</p>
                  <div className="space-y-3">
                    {related.map((t) => (
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
      </div>
    </div>
  );
}