"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink, Github, ChevronRight, TrendingUp,
  Layers, Users, Target, Zap, GitBranch, Check,
  Share2, BookOpen, BarChart3, Heart,
  ChevronUp,
} from "lucide-react";
import { AppCard } from "./app-card";
import { type App, COMPANIES, STATUS_CONFIG } from "@/lib/data/apps-data";

// ── Reading progress ───────────────────────────────────────────────────────────
function ReadingProgress({ color }: { color: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const s = el.scrollHeight - el.clientHeight;
      setP(s > 0 ? (el.scrollTop / s) * 100 : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div className="fixed top-16 left-0 right-0 z-40 h-[2px] bg-white/5">
      <div className="h-full transition-none" style={{ width: `${p}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Screen mockup ─────────────────────────────────────────────────────────────
function ScreenMockup({ screen, primaryColor }: { screen: App["screens"][0]; primaryColor: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-white/[0.08] bg-[#0e0e1a]">
      {/* "Browser bar" */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex gap-1.5">
          {["#ff5f57","#ffbd2e","#28c840"].map(c => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c + "80" }} />
          ))}
        </div>
        <div className="flex-1 bg-white/[0.04] rounded text-[10px] text-white/20 px-2 py-0.5 mx-2 truncate">
          {screen.label}
        </div>
      </div>
      {/* Content */}
      <div
        className="relative flex items-center justify-center min-h-[180px] p-6"
        style={{ background: `radial-gradient(circle at center, ${primaryColor}10, transparent 70%)` }}
      >
        <div className="text-center">
          <div
            className="text-[64px] mb-4 filter drop-shadow-lg"
            style={{ filter: `drop-shadow(0 0 20px ${primaryColor}40)` }}
          >
            {screen.emoji}
          </div>
          <p className="text-sm font-bold text-white/70 mb-1">{screen.label}</p>
          <p className="text-xs text-white/30 max-w-[220px] leading-relaxed">{screen.description}</p>
        </div>
      </div>
    </div>
  );
}

// ── Changelog entry ───────────────────────────────────────────────────────────
const CHANGELOG_COLORS = {
  launch: "#f59e0b",
  feature: "#10b981",
  improvement: "#3b82f6",
  fix: "#f97316",
  milestone: "#8b5cf6",
};

function ChangelogEntry({ entry }: { entry: App["changelog"][0] }) {
  const color = CHANGELOG_COLORS[entry.type];
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded border flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}
        >
          {entry.type === "launch" ? "🚀" : entry.type === "feature" ? "✨" : entry.type === "improvement" ? "⚡" : entry.type === "milestone" ? "🏆" : "🔧"}
        </div>
        <div className="w-px flex-1 mt-2 bg-white/[0.05]" />
      </div>
      <div className="pb-8 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-sm font-black text-white">{entry.title}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded border"
            style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}
          >
            v{entry.version}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide"
            style={{ color, borderColor: `${color}20`, backgroundColor: `${color}08` }}
          >
            {entry.type}
          </span>
        </div>
        <p className="text-xs text-white/30 mb-3">
          {new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <ul className="space-y-1.5">
          {entry.notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/50">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "overview" | "features" | "stack" | "changelog";

interface Props { app: App; related: App[] }

export function AppDetailClient({ app, related }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(0);

  const company = COMPANIES[app.company];
  const status = STATUS_CONFIG[app.status];

  useEffect(() => {
    const fn = () => setScrolled(document.documentElement.scrollTop || 0);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",  label: "Overview",  icon: BookOpen },
    { id: "features",  label: "Features",  icon: Zap },
    { id: "stack",     label: "Stack",     icon: Layers },
    { id: "changelog", label: "Changelog", icon: GitBranch },
  ];

  return (
    <div className="min-h-screen bg-[#080810]">
      <ReadingProgress color={app.primaryColor} />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Glow */}
      <div
        className="fixed top-0 left-0 right-0 h-[40vh] pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 40% -10%, ${app.primaryColor}08, transparent 60%)` }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-white/25 mb-10" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/apps" className="hover:text-white/60 transition-colors">Apps</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/50 truncate max-w-[180px]">{app.name}</span>
        </nav>

        {/* ── App header ───────────────────────────────────────────────────── */}
        <header className="mb-14">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded border"
              style={{ color: company.primaryColor, borderColor: `${company.primaryColor}30`, backgroundColor: `${company.primaryColor}10` }}
            >
              {company.flag} {company.name}
            </span>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border"
              style={{ color: status.textColor, borderColor: status.borderColor, backgroundColor: status.bgColor }}
            >
              <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: status.textColor }} />
              {status.label}
            </span>
            <span className="text-xs text-white/20 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded">
              {app.category}
            </span>
            {app.isNew && (
              <span className="text-[9px] font-black tracking-[0.2em] uppercase bg-amber-500 text-white px-2.5 py-1 rounded">
                NEW
              </span>
            )}
            {app.launchedYear && (
              <span className="text-xs text-white/20">Since {app.launchedYear}</span>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
            {/* Left: title + description */}
            <div className="xl:col-span-2">
              <div className="flex items-center gap-5 mb-6">
                <div
                  className="w-20 h-20 rounded-xl border flex items-center justify-center text-5xl flex-shrink-0"
                  style={{ backgroundColor: `${app.primaryColor}12`, borderColor: `${app.primaryColor}25` }}
                >
                  {app.icon}
                </div>
                <div>
                  <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">{app.name}</h1>
                  <p className="text-base mt-1.5 font-medium" style={{ color: `${app.primaryColor}bb` }}>
                    {app.tagline}
                  </p>
                </div>
              </div>

              <p className="text-lg text-white/50 leading-relaxed mb-4 border-l-2 pl-4 max-w-2xl"
                style={{ borderColor: app.primaryColor }}>
                {app.description}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-6">
                {app.liveUrl && (
                  <a
                    href={app.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded transition-all hover:brightness-110"
                    style={{ backgroundColor: app.primaryColor }}
                  >
                    <ExternalLink className="w-4 h-4" /> Visit App
                  </a>
                )}
                {app.githubUrl && (
                  <a href={app.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white border border-white/12 hover:border-white/25 px-5 py-3 rounded transition-all">
                    <Github className="w-4 h-4" /> Source
                  </a>
                )}
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white border border-white/[0.08] hover:border-white/20 px-5 py-3 rounded transition-all"
                >
                  {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied</> : <><Share2 className="w-4 h-4" /> Share</>}
                </button>
                <button
                  onClick={() => setLiked(l => !l)}
                  className={`flex items-center gap-2 text-sm font-semibold border px-5 py-3 rounded transition-all ${
                    liked
                      ? "text-red-400 border-red-400/30 bg-red-400/8"
                      : "text-white/40 border-white/[0.08] hover:text-red-400 hover:border-red-400/25"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-red-400" : ""}`} />
                  {liked ? "Liked" : "Like this"}
                </button>
              </div>
            </div>

            {/* Right: metrics */}
            <div className="xl:col-span-1">
              <div className="grid grid-cols-2 gap-3">
                {app.metrics.map(m => (
                  <div
                    key={m.label}
                    className="bg-white/[0.03] border border-white/[0.07] rounded p-4"
                  >
                    {m.trend === "up" && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        {m.trendValue && <span className="text-[10px] text-emerald-400 font-semibold">{m.trendValue}</span>}
                      </div>
                    )}
                    <p className="text-xl font-black text-white mb-0.5">{m.value}</p>
                    <p className="text-[11px] text-white/30 leading-tight">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ── Sticky tab bar ─────────────────────────────────────────────────── */}
        <div className="sticky top-[calc(4rem+52px)] z-20 bg-[#080810]/95 backdrop-blur-xl border-b border-white/[0.06] -mx-4 px-4 mb-10">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded transition-all whitespace-nowrap ${
                  tab === id
                    ? "text-white bg-white/8"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-10"
            >
              <div className="xl:col-span-2 space-y-8">
                {/* Full description */}
                <div>
                  <h2 className="text-2xl font-black text-white mb-5">About {app.name}</h2>
                  <div className="space-y-4">
                    {app.fullDescription.split("\n\n").map((para, i) => (
                      para.trim() && (
                        <p key={i} className="text-base text-white/50 leading-relaxed">
                          {para.trim()}
                        </p>
                      )
                    ))}
                  </div>
                </div>

                {/* Screens */}
                <div>
                  <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2">
                    <span className="w-5 h-5 text-center">🖥️</span> App Screens
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {app.screens.map(s => (
                      <ScreenMockup key={s.id} screen={s} primaryColor={app.primaryColor} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-1 space-y-5">
                {/* Problem */}
                <div
                  className="rounded border p-5"
                  style={{ backgroundColor: `${app.primaryColor}08`, borderColor: `${app.primaryColor}20` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4" style={{ color: app.primaryColor }} />
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: `${app.primaryColor}90` }}>Problem Solved</p>
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed">{app.problemStatement}</p>
                </div>

                {/* Target users */}
                <div className="bg-white/[0.03] border border-white/[0.07] rounded p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-white/30" />
                    <p className="text-xs font-bold uppercase tracking-widest text-white/25">Target Users</p>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">{app.targetUsers}</p>
                </div>

                {/* Business model */}
                <div className="bg-white/[0.03] border border-white/[0.07] rounded p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-white/30" />
                    <p className="text-xs font-bold uppercase tracking-widest text-white/25">Business Model</p>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">{app.businessModel}</p>
                </div>

                {/* Next milestone */}
                {app.nextMilestone && (
                  <div
                    className="rounded border p-5"
                    style={{ backgroundColor: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70">Next Milestone</p>
                    </div>
                    <p className="text-sm text-amber-100/60 leading-relaxed">{app.nextMilestone}</p>
                  </div>
                )}

                {/* Company info */}
                <div className="bg-white/[0.03] border border-white/[0.07] rounded p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/25 mb-3">Built under</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{company.flag}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{company.name}</p>
                      <p className="text-xs text-white/35">{company.country} · Est. {company.founded}</p>
                    </div>
                  </div>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-white/30 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {company.website.replace("https://","")}
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* FEATURES */}
          {tab === "features" && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {app.features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="group bg-[#0d0d1a] border border-white/[0.07] rounded p-6 hover:border-white/[0.15] transition-all duration-200"
                    style={{ background: `linear-gradient(135deg, ${app.primaryColor}05, transparent)` }}
                  >
                    <div
                      className="w-12 h-12 rounded-lg border flex items-center justify-center text-2xl mb-5"
                      style={{ backgroundColor: `${app.primaryColor}10`, borderColor: `${app.primaryColor}20` }}
                    >
                      {f.icon}
                    </div>
                    <h3 className="text-base font-black text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{f.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STACK */}
          {tab === "stack" && (
            <motion.div
              key="stack"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl"
            >
              {(["frontend","backend","database","infra","api","auth"] as const).map(cat => {
                const items = app.techStack.filter(t => t.category === cat);
                if (items.length === 0) return null;
                const catLabels = {
                  frontend: "Frontend", backend: "Backend", database: "Database & Storage",
                  infra: "Infrastructure", api: "APIs & Integrations", auth: "Auth & Identity"
                };
                return (
                  <div key={cat} className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25 mb-3">{catLabels[cat]}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map(t => (
                        <span
                          key={t.name}
                          className="flex items-center gap-2 text-sm font-semibold text-white/60 bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* CHANGELOG */}
          {tab === "changelog" && (
            <motion.div
              key="changelog"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl"
            >
              <div className="space-y-0">
                {app.changelog.map((entry) => (
                  <ChangelogEntry key={entry.version} entry={entry} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Related apps ──────────────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">More apps</h2>
                <p className="text-sm text-white/25">Other things I&apos;ve built</p>
              </div>
              <Link
                href="/apps"
                className="group flex items-center gap-1.5 text-sm font-semibold text-white/30 hover:text-white transition-colors"
              >
                All apps <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((a, i) => (
                <AppCard key={a.id} app={a} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Scroll to top */}
        <AnimatePresence>
          {scrolled > 600 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="fixed bottom-8 right-8 w-10 h-10 bg-white/[0.07] border border-white/[0.1] text-white/50 hover:text-white hover:bg-white/[0.12] rounded flex items-center justify-center transition-all z-50"
            >
              <ChevronUp className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}