"use client";

// =============================================================================
// app/tools/random-toolkit/_components/random-toolkit-page.tsx
// =============================================================================

import React, { useState }    from "react";
import Link                    from "next/link";
import { motion }              from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, Info, ArrowRight, Lock,
  Hash, Key, Shuffle, Database, Dices, Palette, Calendar, Type, Shield,
} from "lucide-react";
import { RandomToolkit } from "./random-toolkit";
import { ToolCard } from "../../_tools/tools-card";
import type { NormalisedTool } from "../../_tools/tools-lab-client";
import { ToolViewTracker } from "../../_tools/tool-view-tracker";
import { ToolReviews } from "../../_tools/tool-reviews";

// ─── How it works steps ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Pick a generator",      desc: "Use the left sidebar to choose from 10 generators: passwords, strings, UUIDs, numbers, fake data, colour codes, dates, words, hashes, and random pickers." },
  { step: "02", title: "Configure your options", desc: "Each generator has its own controls: sliders for length and count, toggles for character sets, selectors for format — all live-updating as you adjust." },
  { step: "03", title: "Generate and copy",      desc: "Click Generate to instantly produce cryptographically secure output. Every result has a one-click copy button. Bulk results can be exported as CSV or JSON." },
  { step: "04", title: "Check the code snippet", desc: "Every generator includes JavaScript, Python, and Bash code snippets so you can implement the same logic in your own code." },
];

function ReadingProgress({ accentColor }: { accentColor: string }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => { const el = document.documentElement; setW(Math.min(100, Math.max(0, el.scrollTop / (el.scrollHeight - el.clientHeight) * 100))); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full transition-[width] duration-100" style={{ width: `${w}%`, backgroundColor: accentColor }} /></div>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RandomToolkitPageProps {
  isSignedIn:   boolean;
  tool:         NormalisedTool;         // ← from DB via server page
  relatedTools: NormalisedTool[];       // ← same category, from DB
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RandomToolkitPage({ isSignedIn, tool, relatedTools }: RandomToolkitPageProps) {
  const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
  const [copied,    setCopied]    = useState(false);

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
  const catCfg = CATEGORY_CFG[tool.category] ?? { icon: "🎲", color: "#8b5cf6" };

  const TABS = [
    { id: "tool",    label: "Open Toolkit",  icon: Zap         },
    { id: "guide",   label: "How It Works",  icon: BookOpen    },
    { id: "reviews", label: "Reviews",       icon: MessageSquare },
  ] as const;

  const FEATURE_ICONS = [
    { icon: Lock,     label: "Password",    color: "#10b981" },
    { icon: Key,      label: "String",      color: "#6366f1" },
    { icon: Hash,     label: "UUID",        color: "#8b5cf6" },
    { icon: Shuffle,  label: "Number",      color: "#3b82f6" },
    { icon: Database, label: "Fake Data",   color: "#f59e0b" },
    { icon: Dices,    label: "Picker",      color: "#ec4899" },
    { icon: Palette,  label: "Colour",      color: "#f97316" },
    { icon: Calendar, label: "Date",        color: "#14b8a6" },
    { icon: Type,     label: "Words",       color: "#84cc16" },
    { icon: Shield,   label: "Hash",        color: "#ef4444" },
  ];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress accentColor={tool.accentColor} />

      {/* ── View tracker — fires once on mount, increments DB viewCount ── */}
      <ToolViewTracker toolId={tool.id} />

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.04] pointer-events-none"
        style={{ backgroundColor: tool.accentColor }} />

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
              <span className="flex items-center gap-1.5 font-semibold"
                style={{ color: tool.accentColor }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tool.accentColor }} />
                10 generators
              </span>
              <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                No signup needed
              </span>
            </div>

            {/* Generator grid preview */}
            <div className="flex flex-wrap gap-2 mb-6">
              {FEATURE_ICONS.map(f => (
                <span key={f.label} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                  <f.icon className="w-3 h-3" style={{ color: f.color }} />{f.label}
                </span>
              ))}
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
                <Zap className="w-4 h-4" />Open Toolkit
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-xs p-5 border"
              style={{ backgroundColor: `${tool.accentColor}08`, borderColor: `${tool.accentColor}25` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4"
                style={{ color: tool.accentColor }}>
                Why developers love it
              </p>
              {[
                { icon: Lock,   text: "crypto.getRandomValues() — truly secure",  color: "#10b981" },
                { icon: Zap,    text: "Zero latency — all runs in your browser",   color: "#6366f1" },
                { icon: Shield, text: "Privacy-first — nothing sent to any server",color: "#8b5cf6" },
              ].map(s => (
                <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
                  <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                  <p className="text-xs leading-relaxed" style={{ color: tool.accentColor === "#8b5cf6" ? "#5b21b6" : tool.accentColor }}>
                    {s.text}
                  </p>
                </div>
              ))}
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

            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <RandomToolkit />
                <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    All generation uses the browser's <span className="font-mono font-bold">crypto.getRandomValues()</span> and <span className="font-mono font-bold">SubtleCrypto</span> APIs. Nothing is sent to any server. Nothing is stored. Zero data leaves your device.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How the {tool.name} works</h2>
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ backgroundColor: `${tool.accentColor}10`, color: tool.accentColor }}>{step.step}</div>
                    <div><h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3><p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p></div>
                  </div>
                ))}
                <div className="rounded-xs p-6 border"
                  style={{ backgroundColor: `${tool.accentColor}06`, borderColor: `${tool.accentColor}20` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: tool.accentColor }}>
                    🔐 Security & Privacy
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "All generation uses Web Crypto API — the same standard used by browsers for TLS.",
                      "No data is sent to any server at any point.",
                      "Passwords and secrets are never stored, logged, or cached.",
                      "The source code is open to inspection in your browser's DevTools.",
                      "For maximum security, use generated passwords in a password manager, not in plaintext.",
                    ].map(tip => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-stone-700">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tool.accentColor }} />{tip}
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

          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${
                      activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"
                    }`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              <div className="rounded-xs p-5 border"
                style={{ backgroundColor: `${tool.accentColor}06`, borderColor: `${tool.accentColor}20` }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: tool.accentColor }}>
                  10 generators
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {FEATURE_ICONS.map(f => (
                    <div key={f.label} className="flex items-center gap-1.5">
                      <f.icon className="w-3 h-3 flex-shrink-0" style={{ color: f.color }} />
                      <span className="text-[11px] font-medium" style={{ color: tool.accentColor === "#8b5cf6" ? "#5b21b6" : tool.accentColor }}>
                        {f.label}
                      </span>
                    </div>
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

        {relatedTools.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">More {tool.category} Tools</h2>
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
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
// // app/tools/random-toolkit/_components/random-toolkit-page.tsx
// // =============================================================================

// import React, { useState }    from "react";
// import Link                    from "next/link";
// import { motion }              from "framer-motion";
// import {
//   ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
//   MessageSquare, BookOpen, Zap, Info, ArrowRight, Lock,
//   Hash, Key, Shuffle, Database, Dices, Palette, Calendar, Type, Shield,
// } from "lucide-react";
// import { TOOL_CATEGORIES, TOOLS } from "@/lib/data/tools-data";
// import { RandomToolkit } from "./random-toolkit";
// import { ToolCard } from "../../_tools/tools-card";



// const TOOL = TOOLS.find(t => t.slug === "random-toolkit")!;

// const HOW_IT_WORKS = [
//   { step: "01", title: "Pick a generator",      desc: "Use the left sidebar to choose from 10 generators: passwords, strings, UUIDs, numbers, fake data, colour codes, dates, words, hashes, and random pickers." },
//   { step: "02", title: "Configure your options", desc: "Each generator has its own controls: sliders for length and count, toggles for character sets, selectors for format — all live-updating as you adjust." },
//   { step: "03", title: "Generate and copy",      desc: "Click Generate to instantly produce cryptographically secure output. Every result has a one-click copy button. Bulk results can be exported as CSV or JSON." },
//   { step: "04", title: "Check the code snippet", desc: "Every generator includes JavaScript, Python, and Bash code snippets so you can implement the same logic in your own code." },
// ];

// const REVIEWS = [
//   { name: "Alex M.", role: "Backend Engineer",    avatar: "AM", rating: 5, date: "1 week ago",  body: "This is now permanently open in my browser. UUID generator, password generator, and fake data — I use all three every day. No ads, no account, just works." },
//   { name: "Priya K.", role: "QA Engineer",         avatar: "PK", rating: 5, date: "3 days ago",  body: "The fake data generator saved me hours of manual test data creation. Name, email, phone, address — all realistic and UK-formatted. Exactly what I needed." },
//   { name: "Tom H.",   role: "Cybersecurity Student",avatar: "TH", rating: 5, date: "2 weeks ago", body: "Hash generator with SHA-256/512 for my coursework assignments. The code snippets actually teach you how to implement it properly. Brilliant." },
//   { name: "Maria L.", role: "Frontend Developer",  avatar: "ML", rating: 4, date: "1 month ago", body: "Colour generator with CSS variable export is a hidden gem. Pastel mode gives gorgeous palette suggestions in seconds. Dark mode for the whole tool is a bonus." },
// ];

// function ReadingProgress() {
//   const [w, setW] = React.useState(0);
//   React.useEffect(() => {
//     const h = () => { const el = document.documentElement; setW(Math.min(100, Math.max(0, el.scrollTop / (el.scrollHeight - el.clientHeight) * 100))); };
//     window.addEventListener("scroll", h, { passive: true });
//     return () => window.removeEventListener("scroll", h);
//   }, []);
//   return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full bg-violet-500 transition-[width] duration-100" style={{ width: `${w}%` }} /></div>;
// }

// export function RandomToolkitPage() {
//   const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
//   const [copied,    setCopied]    = useState(false);
//   const category = TOOL_CATEGORIES.find(c => c.name === TOOL?.category);
//   const related  = TOOLS.filter(t => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);

//   if (!TOOL) return null;

//   const TABS = [
//     { id: "tool",    label: "Open Toolkit",  icon: Zap         },
//     { id: "guide",   label: "How It Works",  icon: BookOpen    },
//     { id: "reviews", label: "Reviews",       icon: MessageSquare },
//   ] as const;

//   const FEATURE_ICONS = [
//     { icon: Lock,     label: "Password",    color: "#10b981" },
//     { icon: Key,      label: "String",      color: "#6366f1" },
//     { icon: Hash,     label: "UUID",        color: "#8b5cf6" },
//     { icon: Shuffle,  label: "Number",      color: "#3b82f6" },
//     { icon: Database, label: "Fake Data",   color: "#f59e0b" },
//     { icon: Dices,    label: "Picker",      color: "#ec4899" },
//     { icon: Palette,  label: "Colour",      color: "#f97316" },
//     { icon: Calendar, label: "Date",        color: "#14b8a6" },
//     { icon: Type,     label: "Words",       color: "#84cc16" },
//     { icon: Shield,   label: "Hash",        color: "#ef4444" },
//   ];

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       <ReadingProgress />
//       <div className="fixed inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
//       <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.04] pointer-events-none bg-violet-400" />

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
//               <div className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0" style={{ backgroundColor: "#8b5cf610", borderColor: "#8b5cf630" }}>🎲</div>
//               <div>
//                 <div className="flex flex-wrap items-center gap-2 mb-1">
//                   <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
//                   <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-violet-50 border-violet-200 text-violet-700">
//                     <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />Live
//                   </span>
//                   <span className="text-[9px] font-black tracking-widest uppercase bg-violet-500 text-white px-2 py-0.5 rounded-xs">NEW</span>
//                 </div>
//                 <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
//               </div>
//             </div>

//             <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

//             <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
//               <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-violet-400" />10 generators</span>
//               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
//               <span className="flex items-center gap-1.5 text-green-600 font-semibold"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />No signup needed</span>
//             </div>

//             {/* Generator grid preview */}
//             <div className="flex flex-wrap gap-2 mb-6">
//               {FEATURE_ICONS.map(f => (
//                 <span key={f.label} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
//                   <f.icon className="w-3 h-3" style={{ color: f.color }} />{f.label}
//                 </span>
//               ))}
//             </div>

//             <div className="flex items-center gap-3 flex-wrap">
//               <button onClick={() => setActiveTab("tool")}
//                 className="flex items-center gap-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 px-5 py-3 rounded-xs transition-colors shadow-sm">
//                 <Zap className="w-4 h-4" />Open Toolkit
//               </button>
//               <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
//                 className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
//                 {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
//                 {copied ? "Copied!" : "Share"}
//               </button>
//             </div>
//           </div>

//           <div className="hidden lg:block">
//             <div className="bg-violet-50 border border-violet-100 rounded-xs p-5">
//               <p className="text-xs font-black text-violet-600 uppercase tracking-wider mb-4">Why developers love it</p>
//               {[
//                 { icon: Lock,   text: "crypto.getRandomValues() — truly secure",  color: "#10b981" },
//                 { icon: Zap,    text: "Zero latency — all runs in your browser",   color: "#6366f1" },
//                 { icon: Shield, text: "Privacy-first — nothing sent to any server",color: "#8b5cf6" },
//               ].map(s => (
//                 <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
//                   <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
//                   <p className="text-xs text-violet-800 leading-relaxed">{s.text}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
//           {TABS.map(t => (
//             <button key={t.id} onClick={() => setActiveTab(t.id)}
//               className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? "border-violet-500 text-violet-600" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
//               <t.icon className="w-4 h-4" />{t.label}
//             </button>
//           ))}
//         </div>

//         {/* Content */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">

//             {activeTab === "tool" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                 <RandomToolkit />
//                 <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
//                   <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
//                   <p className="text-xs text-amber-800 leading-relaxed">
//                     All generation uses the browser's <span className="font-mono font-bold">crypto.getRandomValues()</span> and <span className="font-mono font-bold">SubtleCrypto</span> APIs. Nothing is sent to any server. Nothing is stored. Zero data leaves your device.
//                   </p>
//                 </div>
//               </motion.div>
//             )}

//             {activeTab === "guide" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
//                 <h2 className="text-2xl font-black text-gray-900 mb-8">How the Random Toolkit works</h2>
//                 {HOW_IT_WORKS.map((step, i) => (
//                   <div key={step.step} className="flex gap-6 pb-10 relative">
//                     {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
//                     <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10" style={{ backgroundColor: "#8b5cf610", color: "#8b5cf6" }}>{step.step}</div>
//                     <div><h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3><p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p></div>
//                   </div>
//                 ))}
//                 <div className="bg-violet-50 border border-violet-100 rounded-xs p-6">
//                   <h3 className="text-base font-bold text-violet-900 mb-3">🔐 Security & Privacy</h3>
//                   <ul className="space-y-2">
//                     {["All generation uses Web Crypto API — the same standard used by browsers for TLS.", "No data is sent to any server at any point.", "Passwords and secrets are never stored, logged, or cached.", "The source code is open to inspection in your browser's DevTools.", "For maximum security, use generated passwords in a password manager, not in plaintext."].map(tip => (
//                       <li key={tip} className="flex items-start gap-2 text-sm text-violet-800">
//                         <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />{tip}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </motion.div>
//             )}

//             {activeTab === "reviews" && (
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
//                 <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
//                 {REVIEWS.map(r => (
//                   <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">{r.avatar}</div>
//                         <div><p className="text-sm font-bold text-gray-900">{r.name}</p><p className="text-xs text-gray-400">{r.role}</p></div>
//                       </div>
//                       <div className="text-right">
//                         <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=r.rating?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}</div>
//                         <p className="text-xs text-gray-400 mt-1">{r.date}</p>
//                       </div>
//                     </div>
//                     <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
//                   </div>
//                 ))}
//               </motion.div>
//             )}
//           </div>

//           <aside className="lg:col-span-1">
//             <div className="lg:sticky lg:top-36 space-y-5">
//               <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
//                 {TABS.map(t => (
//                   <button key={t.id} onClick={() => setActiveTab(t.id)}
//                     className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
//                     <t.icon className="w-4 h-4" />{t.label}
//                   </button>
//                 ))}
//               </div>

//               <div className="bg-violet-50 border border-violet-100 rounded-xs p-5">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-violet-400 mb-3">10 generators</p>
//                 <div className="grid grid-cols-2 gap-1.5">
//                   {FEATURE_ICONS.map(f => (
//                     <div key={f.label} className="flex items-center gap-1.5">
//                       <f.icon className="w-3 h-3 flex-shrink-0" style={{ color: f.color }} />
//                       <span className="text-[11px] text-violet-800 font-medium">{f.label}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {related.length > 0 && (
//                 <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Tools</p>
//                   <div className="space-y-3">
//                     {related.map(t => (
//                       <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
//                         <span className="text-xl shrink-0">{t.icon}</span>
//                         <div className="min-w-0"><p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p><p className="text-xs text-gray-400 truncate">{t.tagline}</p></div>
//                         <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 transition-all shrink-0" />
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

//         {related.length > 0 && (
//           <div className="mt-20 pt-12 border-t border-gray-100">
//             <div className="flex items-center justify-between mb-8">
//               <h2 className="text-2xl font-black text-gray-900">More Tools</h2>
//               <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">See all <ArrowRight className="w-4 h-4" /></Link>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//               {related.map(t => <ToolCard key={t.id} tool={t} />)}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }