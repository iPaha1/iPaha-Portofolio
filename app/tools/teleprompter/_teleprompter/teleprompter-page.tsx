"use client";

// =============================================================================
// isaacpaha.com — Teleprompter — Full Page Shell
// app/tools/teleprompter/_teleprompter/teleprompter-page.tsx
//
// Uses the same page shell pattern as all other tools BUT with a different
// design — the tool takes full visual priority (immersive dark editor),
// the info sidebar remains standard (breadcrumbs, features, related tools).
// FREE TOOL — no token cost badge shown.
// =============================================================================

import React, { useState } from "react";
import Link                from "next/link";
import { motion }          from "framer-motion";
import {
  ArrowLeft, ArrowRight, Share2, Check, Clock, Users,
  Star, BookOpen, MessageSquare, ChevronRight, Sparkles,
  Info, Zap, Monitor, Mic, RotateCcw, FlipHorizontal,
  AlignLeft, Keyboard, Globe,
} from "lucide-react";
import { ToolCard }          from "../../_tools/tools-card";
import { ToolViewTracker }   from "../../_tools/tool-view-tracker";
import { ToolReviews }       from "../../_tools/tool-reviews";
import type { NormalisedTool } from "../../_tools/tools-lab-client";
import { TeleprompterSettings } from "./teleprompter-types";
import { TeleprompterTool } from "./teleprompter-tool";


const ACCENT = "#14b8a6";

const HOW_IT_WORKS = [
  { step: "01", title: "Write or paste your script", desc: "Type directly in the editor or paste from any source. Import .txt or .md files from your computer. Your script auto-saves to your account if you're signed in — so it's always there when you come back." },
  { step: "02", title: "Insert cue markers", desc: "Click the cue buttons to insert [PAUSE], [BREATHE], [EMPHASIS], and Section Break markers inline. These appear as coloured badges in the teleprompter — a visual reminder to pause, breathe, or emphasise a word without breaking flow." },
  { step: "03", title: "Set your speed and font", desc: "Adjust scroll speed (1–20), font size (18–88px), typeface, line height, and text width from the control strip. Use Mirror mode if you're using a physical beam-splitter teleprompter glass, or Flip V for overhead rigs." },
  { step: "04", title: "Customise your display", desc: "Open Settings to choose text and background colours from preset themes (Studio, Warm, Matrix, Navy, Paper) or custom swatches. Set the focus line position, edge fade, and reading mode. All settings save to your account." },
  { step: "05", title: "Launch and read", desc: "Click Launch Teleprompter — your script fills the screen in full cinematic mode. Use Space or K to play/pause, arrow keys to adjust speed or scroll manually, F to toggle the focus guide, R to restart, and Esc to exit." },
];

const FEATURES = [
  { icon: Monitor,        label: "Fullscreen mode",      desc: "True browser fullscreen API — no distractions"     },
  { icon: FlipHorizontal, label: "Mirror + Flip V",       desc: "For physical teleprompter glass and overhead rigs" },
  { icon: Zap,            label: "Smooth scroll engine",  desc: "RequestAnimationFrame — buttery 60fps scroll"      },
  { icon: AlignLeft,      label: "Cue markers",           desc: "[PAUSE] [BREATHE] [EMPHASIS] + section breaks"     },
  { icon: Globe,          label: "9 colour themes",       desc: "Studio, warm, matrix, navy, paper, and custom"     },
  { icon: Keyboard,       label: "Keyboard remote",       desc: "Space, arrows, F, R, Esc — works like hardware"    },
  { icon: Mic,            label: "Touch support",         desc: "Drag to scroll on mobile, tap to play/pause"       },
  { icon: RotateCcw,      label: "3-sec countdown",       desc: "Get ready before the scroll starts"                },
];

interface TeleprompterPageProps {
  isSignedIn:    boolean;
  tool:          NormalisedTool;
  relatedTools:  NormalisedTool[];
  savedSettings: (Partial<TeleprompterSettings> & {
    lastScript?:     string | null;
    lastScriptName?: string | null;
  }) | null;
}

function ReadingProgress() {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const h = () => {
      const e = document.documentElement;
      setW(Math.min(100, (e.scrollTop / Math.max(1, e.scrollHeight - e.clientHeight)) * 100));
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div className="h-full transition-[width] duration-100" style={{ width: `${w}%`, backgroundColor: ACCENT }} />
    </div>
  );
}

export function TeleprompterPage({ isSignedIn, tool, relatedTools, savedSettings }: TeleprompterPageProps) {
  const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
  const [copied,    setCopied]    = useState(false);

  const TABS = [
    { id: "tool",    label: "Teleprompter",  icon: Sparkles     },
    { id: "guide",   label: "How It Works",  icon: BookOpen     },
    { id: "reviews", label: "Reviews",       icon: MessageSquare },
  ] as const;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress />
      <ToolViewTracker toolId={tool.id} />

      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right,#000 1px,transparent 1px),linear-gradient(to bottom,#000 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.03] pointer-events-none"
        style={{ backgroundColor: ACCENT }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-20">

        {/* ── Breadcrumbs ── */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[
            { label: "Home",  href: "/" },
            { label: "Tools", href: "/tools" },
            { label: tool.name, href: "#" },
          ].map((bc, i) => (
            <React.Fragment key={bc.label}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              {bc.href === "#"
                ? <span className="text-gray-600 font-medium">{bc.label}</span>
                : <Link href={bc.href} className="hover:text-gray-700 transition-colors">{bc.label}</Link>}
            </React.Fragment>
          ))}
        </nav>

        {/* ── Hero (compact — tool is the star) ── */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
              {tool.icon}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{ background: `${ACCENT}15`, color: ACCENT }}>FREE TOOL</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md border"
                  style={{ color: ACCENT, backgroundColor: `${ACCENT}08`, borderColor: `${ACCENT}25` }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Live
                </span>
                {tool.isNew && (
                  <span className="text-[9px] font-black tracking-widest uppercase text-white px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: ACCENT }}>NEW</span>
                )}
              </div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">{tool.name}</h1>
              <p className="text-base text-gray-500 mt-1 leading-relaxed max-w-2xl">{tool.tagline ?? tool.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
            {tool.usageCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" style={{ color: ACCENT }} />
                {tool.usageCount.toLocaleString()} sessions
              </span>
            )}
            {tool.ratingCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {tool.ratingAvg.toFixed(1)} ({tool.ratingCount} reviews)
              </span>
            )}
            <span className="flex items-center gap-1.5 font-bold" style={{ color: ACCENT }}>
              <Zap className="w-4 h-4" />Free — no tokens, no account needed
            </span>
            {isSignedIn && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                <Check className="w-3.5 h-3.5" />Settings auto-saved to your account
              </span>
            )}
          </div>

          {/* Features quick-scan */}
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(f => (
              <span key={f.label} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md"
                style={{ background: "#f5f5f4", color: "#57534e", border: "1px solid #e7e5e4" }}>
                <f.icon size={11} style={{ color: ACCENT }} />{f.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 border-b border-gray-100 mb-8 overflow-x-auto">
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
          <div className="ml-auto flex items-center pb-2">
            <button onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>

        {/* ── Content grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* ── Main content (3 cols) ── */}
          <div className="xl:col-span-3">

            {/* ── TOOL TAB ── */}
            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* The teleprompter tool — dark, cinematic, full-width */}
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1f1f1f", background: "#0a0a0a" }}>

                  {/* Tool header strip */}
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ background: "#0d0d0d", borderBottom: "1px solid #1f1f1f" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{tool.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{tool.name}</p>
                        <p className="text-xs" style={{ color: "#555" }}>Professional scrolling script for content creators</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md"
                      style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                      Free · No tokens
                    </div>
                  </div>

                  {/* The actual tool — min-height to feel substantial */}
                  <div style={{ minHeight: 560, height: 700 }}>
                    <TeleprompterTool isSignedIn={isSignedIn} savedSettings={savedSettings} />
                  </div>
                </div>

                {/* Tip bar */}
                <div className="flex items-start gap-3 mt-4 px-4 py-3.5 rounded-xl"
                  style={{ background: `${ACCENT}06`, border: `1px solid ${ACCENT}18` }}>
                  <Info size={15} style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }} />
                  <div className="text-xs leading-relaxed" style={{ color: "#78716c" }}>
                    <span className="font-bold" style={{ color: "#57534e" }}>Tip: </span>
                    Use <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#e7e5e4", color: "#57534e", fontFamily: "monospace" }}>Space</kbd> or{" "}
                    <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#e7e5e4", color: "#57534e", fontFamily: "monospace" }}>K</kbd> to play/pause.
                    Arrow keys adjust speed or scroll manually.{" "}
                    <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#e7e5e4", color: "#57534e", fontFamily: "monospace" }}>Esc</kbd> exits.
                    {isSignedIn
                      ? " Your script and settings save automatically."
                      : " Sign in to save your settings and last script between sessions."}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── GUIDE TAB ── */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use {tool.name}</h2>
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={s.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className="w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10 text-white"
                      style={{ backgroundColor: ACCENT }}>
                      {s.step}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}

                {/* Features grid */}
                <div className="pt-4">
                  <h3 className="text-lg font-black text-gray-900 mb-5">All features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {FEATURES.map(f => (
                      <div key={f.label} className="flex items-start gap-3 px-4 py-4 rounded-xl"
                        style={{ background: `${ACCENT}05`, border: `1px solid ${ACCENT}15` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${ACCENT}15` }}>
                          <f.icon size={16} style={{ color: ACCENT }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{f.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keyboard reference */}
                <div className="mt-8 rounded-xl overflow-hidden" style={{ border: "1px solid #1f1f1f", background: "#0a0a0a" }}>
                  <div className="px-5 py-4" style={{ borderBottom: "1px solid #1f1f1f" }}>
                    <p className="text-sm font-black" style={{ color: "#ccc" }}>
                      <Keyboard size={14} className="inline mr-2" style={{ color: ACCENT }} />
                      Keyboard shortcuts
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-0 p-2">
                    {[
                      { keys: "Space / K",   action: "Play / Pause"          },
                      { keys: "↑ / ↓",       action: "Speed faster / slower"  },
                      { keys: "← / →",       action: "Manual scroll step"     },
                      { keys: "F",           action: "Toggle focus guide"     },
                      { keys: "R",           action: "Restart from top"       },
                      { keys: "Esc",         action: "Exit teleprompter"      },
                    ].map(k => (
                      <div key={k.keys} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                        <kbd className="text-[11px] font-mono px-2 py-1 rounded-md whitespace-nowrap"
                          style={{ background: "#1f1f1f", border: "1px solid #2a2a2a", color: ACCENT }}>
                          {k.keys}
                        </kbd>
                        <span className="text-xs" style={{ color: "#666" }}>{k.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── REVIEWS TAB ── */}
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

          {/* ── Sidebar (1 col) ── */}
          <aside className="xl:col-span-1">
            <div className="xl:sticky xl:top-36 space-y-5">

              {/* Quick jump */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all mb-1 ${
                      activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"
                    }`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              {/* Free badge */}
              <div className="rounded-xl p-5" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}25` }}>
                <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: ACCENT }}>100% Free</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  The teleprompter is completely free — no tokens, no account required. It runs entirely in your browser with no data sent to any server during use.
                </p>
                {isSignedIn ? (
                  <p className="text-xs font-semibold" style={{ color: ACCENT }}>
                    ✓ You're signed in — your script and settings save automatically.
                  </p>
                ) : (
                  <Link href="/sign-in?redirect_url=/tools/teleprompter"
                    className="text-xs font-bold"
                    style={{ color: ACCENT }}>
                    Sign in → save settings between sessions
                  </Link>
                )}
              </div>

              {/* Who it's for */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Built for</p>
                {[
                  "YouTubers and video creators",
                  "Podcasters and audio hosts",
                  "Presenters and speakers",
                  "Teachers and educators",
                  "News anchors and journalists",
                  "Social media content creators",
                  "Corporate trainers",
                  "Anyone who records themselves",
                ].map(w => (
                  <div key={w} className="flex items-center gap-2 mb-2 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                    <p className="text-xs text-gray-600">{w}</p>
                  </div>
                ))}
              </div>

              {/* Related tools */}
              {relatedTools.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Tools</p>
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

              <Link href="/tools"
                className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xl transition-all">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                All Tools
              </Link>
            </div>
          </aside>
        </div>

        {/* ── Related tools grid ── */}
        {relatedTools.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">More Tools</h2>
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