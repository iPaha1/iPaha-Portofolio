"use client";

// =============================================================================
// isaacpaha.com — Job Tracker Page Shell
// app/tools/job-application-tracker/_components/job-tracker-page.tsx
//
// Replaces tool-detail-client.tsx for this specific tool.
// Owns the full-page layout: hero header, tabs (Use Tool / Guide / Reviews),
// right sidebar (quick jump, related tools), and renders the tracker itself.
// =============================================================================

import React, { useState }  from "react";
import Link                  from "next/link";
import { motion }            from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, ArrowRight, Share2, Check,
  ChevronRight, MessageSquare, BookOpen, Zap, Lock, Info,
  Trophy, Sparkles, TrendingUp, Target,
} from "lucide-react";
import { useUser }               from "@clerk/nextjs";
import { TOOL_CATEGORIES, TOOLS } from "@/lib/data/tools-data";
import { JobApplicationTracker } from "./job-application-tracker";
import { UserDashboard } from "./userdashboard";
import { ToolCard } from "../../_tools/tools-card";


// ─── Types ────────────────────────────────────────────────────────────────────

export interface InitialProfile {
  id:               string;
  displayName:      string;
  avatarUrl?:       string | null;
  headline?:        string | null;
  xpPoints:         number;
  level:            number;
  streakDays:       number;
  totalApplications: number;
  isEmployed:       boolean;
  showOnLadder:     boolean;
  showCompanyNames: boolean;
  badges:           { type: string; awardedAt: string }[];
  ladderEntry?:     { totalApplications: number; interviews: number; offers: number; rank: number | null } | null;
  applicationCount: number;
}

interface JobTrackerPageProps {
  initialProfile: InitialProfile | null;
}

// ─── Tool data ────────────────────────────────────────────────────────────────

const TOOL = TOOLS.find((t) => t.slug === "job-application-tracker")!;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Log your first application",
    desc:  "Add the job title, company, sector, and status. Takes 30 seconds. Do it immediately after you apply — not later.",
  },
  {
    step: "02",
    title: "Update status as things move",
    desc:  "As applications progress — phone screen, interview, offer — update the status with one click. The Kanban board shows everything at a glance.",
  },
  {
    step: "03",
    title: "Reflect after every interview",
    desc:  "Use the Reflection Journal to log what went well and what to improve. Over time, this builds a powerful feedback loop that compounds.",
  },
  {
    step: "04",
    title: "Track your analytics",
    desc:  "See your interview rate, offer rate, and top sectors. AI Coach analyses your data and gives you specific, actionable coaching.",
  },
  {
    step: "05",
    title: "Join the Ladder",
    desc:  "Sign in to join the Job Application Ladder — a real-time leaderboard showing how many applications it takes different job seekers to land a role.",
  },
];

const REVIEWS = [
  {
    name: "Aisha T.", role: "Graduate Job Seeker",      avatar: "AT", rating: 5, date: "2 weeks ago",
    body: "Finally found something that doesn't feel like a spreadsheet nightmare. The Kanban board and reflection journal are exactly what I needed to stay on top of 40+ applications.",
  },
  {
    name: "Marcus O.", role: "Career Changer",           avatar: "MO", rating: 5, date: "1 month ago",
    body: "The AI Coach feature is surprisingly useful. It looked at my stats and told me I was applying to too many roles in one sector at the wrong level. Changed my approach, got interviews.",
  },
  {
    name: "Priya M.", role: "Software Engineering Grad", avatar: "PM", rating: 4, date: "3 weeks ago",
    body: "Love the privacy controls — I can blur company names when I want. The analytics showing my interview conversion rate over time is genuinely motivating to improve.",
  },
];

// ─── Reading progress bar ─────────────────────────────────────────────────────

function ReadingProgress() {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const handler = () => {
      const el  = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setWidth(Math.min(100, Math.max(0, pct)));
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent">
      <div className="h-full bg-orange-500 transition-[width] duration-100" style={{ width: `${width}%` }} />
    </div>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function JobTrackerPage({ initialProfile }: JobTrackerPageProps) {
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab]   = useState<"tool" | "dashboard" | "guide" | "reviews">("tool");
  const [copied,    setCopied]      = useState(false);

  const category = TOOL_CATEGORIES.find((c) => c.name === TOOL.category);
  const related  = TOOLS.filter((t) => t.category === TOOL.category && t.slug !== TOOL.slug && t.status !== "COMING_SOON").slice(0, 3);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const breadcrumbs = [
    { label: "Home",     href: "/" },
    { label: "Tools",    href: "/tools" },
    { label: TOOL.name,  href: "#" },
  ];

  const TABS = [
    { id: "tool",      label: "Use the Tool",     icon: Zap           },
    ...(isSignedIn ? [{ id: "dashboard", label: "My Dashboard", icon: TrendingUp }] : []),
    { id: "guide",     label: "How It Works",     icon: BookOpen      },
    { id: "reviews",   label: "Reviews",          icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress />

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      />

      {/* Accent orb */}
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.04] pointer-events-none"
        style={{ backgroundColor: "#f97316" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* ── Breadcrumbs ────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={bc.label}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              {bc.href === "#"
                ? <span className="text-gray-600 font-medium">{bc.label}</span>
                : <Link href={bc.href} className="hover:text-gray-700 transition-colors">{bc.label}</Link>
              }
            </React.Fragment>
          ))}
        </nav>

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
                style={{ backgroundColor: "#f9731610", borderColor: "#f9731630" }}>
                📋
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: category?.color }}>
                    {category?.icon} {TOOL.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-amber-50 border-amber-200 text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Beta
                  </span>
                  <span className="text-[9px] font-black tracking-widest uppercase bg-amber-500 text-white px-2 py-0.5 rounded-xs">NEW</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                  {TOOL.name}
                </h1>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-orange-400" />{TOOL.usageCount.toLocaleString()} users</span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {TOOL.ratingAvg.toFixed(1)} ({TOOL.ratingCount} reviews)
              </span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
              <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Free
              </span>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-6">
              {TOOL.features.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                  <Check className="w-3 h-3 text-orange-400" />{f}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xs transition-colors shadow-sm">
                <Zap className="w-4 h-4" />Start Tracking
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("dashboard")}
                  className="flex items-center gap-2 text-sm font-semibold text-orange-600 border border-orange-200 hover:bg-orange-50 px-5 py-3 rounded-xs transition-colors">
                  <TrendingUp className="w-4 h-4" />My Dashboard
                </button>
              )}
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right: sign-in prompt or profile card */}
          <div className="hidden lg:block">
            {isSignedIn && initialProfile ? (
              <div className="bg-orange-50 border border-orange-200 rounded-xs p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-sm font-black text-orange-700">
                    {initialProfile.displayName?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{initialProfile.displayName}</p>
                    <p className="text-xs text-stone-500">{initialProfile.headline ?? "Job Seeker"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Apps",      value: initialProfile.ladderEntry?.totalApplications ?? initialProfile.applicationCount ?? 0 },
                    { label: "Interviews",value: initialProfile.ladderEntry?.interviews ?? 0 },
                    { label: "Rank",      value: initialProfile.ladderEntry?.rank ? `#${initialProfile.ladderEntry.rank}` : "—" },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-white rounded-xs px-2 py-2 border border-orange-100">
                      <p className="text-lg font-black text-orange-600">{s.value}</p>
                      <p className="text-[10px] text-stone-400 font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab("dashboard")}
                  className="w-full text-sm font-bold text-orange-700 border border-orange-300 hover:bg-orange-100 py-2.5 rounded-xs transition-colors">
                  Open My Dashboard →
                </button>
              </div>
            ) : !isSignedIn ? (
              <div className="bg-gray-50 border border-gray-100 rounded-xs p-5">
                <Lock className="w-6 h-6 text-gray-400 mb-3" />
                <p className="text-sm font-bold text-gray-800 mb-1">Sign in to unlock more</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Save applications to your account, access the Ladder, AI coaching, and your personal dashboard.
                </p>
                <a href="/sign-in?redirect_url=/tools/job-application-tracker"
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 py-2.5 rounded-xs transition-colors">
                  Sign in — it's free
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {/* ── USE TOOL ──────────────────────────────────────────────── */}
            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Tool header bar */}
                <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
                    style={{ backgroundColor: "#f9731606" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📋</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
                        <p className="text-xs text-gray-400">{TOOL.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
                    </div>
                  </div>
                  <div className="p-0">
                    <JobApplicationTracker />
                  </div>
                </div>

                <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Sign in to save applications to your account, join the Job Application Ladder, and unlock AI coaching personalised to your data. The tool works without an account in demo mode.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── USER DASHBOARD ────────────────────────────────────────── */}
            {activeTab === "dashboard" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? <UserDashboard initialProfile={initialProfile} />
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <Lock className="w-10 h-10 text-gray-300 mb-4" />
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to access your dashboard</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                        Your personal dashboard shows all your applications, analytics, settings, and ladder position in one place.
                      </p>
                      <a href="/sign-in?redirect_url=/tools/job-application-tracker"
                        className="flex items-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xs transition-colors">
                        Sign in — it's free
                      </a>
                    </div>
                  )
                }
              </motion.div>
            )}

            {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to use the Job Application Tracker</h2>
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ backgroundColor: "#f9731610", color: "#f97316" }}>
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}

                {/* Tips block */}
                <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xs p-6">
                  <h3 className="text-base font-bold text-orange-900 mb-3">💡 Tips for getting the most out of it</h3>
                  <ul className="space-y-2">
                    {[
                      "Log applications immediately — the habit compounds. Don't batch them later.",
                      "Be honest in your reflection journal. The patterns only emerge if the data is real.",
                      "Use the analytics tab weekly. Your interview rate is the most important metric to move.",
                      "Turn on the Ladder when you're ready — seeing others' progress is motivating, not demoralising.",
                      "Use the AI Coach after 10+ applications. Generic advice before that isn't useful.",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-orange-800">
                        <Check className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* ── REVIEWS ───────────────────────────────────────────────── */}
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
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">
                          {r.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StarRow rating={r.rating} />
                        <p className="text-xs text-gray-400 mt-1">{r.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* ── Right sidebar ──────────────────────────────────────────── */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              {/* Quick Jump */}
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${
                      activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              {/* Key stats */}
              <div className="bg-orange-50 border border-orange-100 rounded-xs p-5">
                <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-4">Why it works</p>
                {[
                  { icon: Target,     text: "Interview rate improves when you track patterns" },
                  { icon: Trophy,     text: "Ladder keeps you accountable through the hard weeks" },
                  { icon: Sparkles,   text: "AI Coach gives real data-driven insight, not generic tips" },
                ].map((s) => (
                  <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <s.icon className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-orange-800 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>

              {/* Related tools */}
              {related.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    More Career Tools
                  </p>
                  <div className="space-y-3">
                    {related.map((t) => (
                      <Link key={t.id} href={`/tools/${t.slug}`}
                        className="group flex items-center gap-3 py-1.5">
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

              {/* Back to all tools */}
              <Link href="/tools"
                className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xs transition-all">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                All Tools
              </Link>
            </div>
          </aside>
        </div>

        {/* ── Related tools grid ──────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">More Career Tools</h2>
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
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