"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Lightbulb, Wrench, AppWindow, Mail,
  Mic, Eye, Heart, MessageSquare, Users, TrendingUp,
  TrendingDown, CheckCircle2, 
   Clock, Calendar, FilePlus, Share2, 
  Activity, Zap, Globe, RefreshCw, BarChart2,
  Twitter, Linkedin, Facebook, Upload, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
}

// ─── Mock data (replace with Prisma queries when DB is wired) ─────────────────

const STATS = [
  {
    id: "total-views",
    label: "Total Views",
    value: "48,291",
    delta: 12.4,
    period: "vs last 30d",
    icon: Eye,
    color: "#f59e0b",
    bg: "#fef3c7",
    href: "analytics",
  },
  {
    id: "total-likes",
    label: "Total Likes",
    value: "1,847",
    delta: 8.1,
    period: "vs last 30d",
    icon: Heart,
    color: "#ec4899",
    bg: "#fce7f3",
    href: "blog",
  },
  {
    id: "comments",
    label: "Comments",
    value: "392",
    delta: -2.3,
    period: "vs last 30d",
    icon: MessageSquare,
    color: "#8b5cf6",
    bg: "#ede9fe",
    href: "blog",
  },
  {
    id: "subscribers",
    label: "Newsletter Subs",
    value: "4,847",
    delta: 5.7,
    period: "vs last 30d",
    icon: Mail,
    color: "#10b981",
    bg: "#d1fae5",
    href: "newsletter",
  },
];

const CONTENT_HEALTH = [
  { label: "Blog Posts",  icon: FileText,  published: 18, draft: 4,  color: "#f59e0b", href: "blog" },
  { label: "Ideas Lab",   icon: Lightbulb, published: 12, draft: 3,  color: "#8b5cf6", href: "ideas" },
  { label: "Tools Lab",   icon: Wrench,    published: 8,  draft: 1,  color: "#f97316", href: "tools" },
  { label: "Apps",        icon: AppWindow, published: 7,  draft: 0,  color: "#10b981", href: "apps" },
  { label: "Podcast Eps", icon: Mic,       published: 0,  draft: 5,  color: "#ec4899", href: "podcast" },
];

const ACTIVITY = [
  { id: "a1", type: "comment",    text: "New comment on 'The Trust Problem'", meta: "Kwame A.",  time: "2m",   color: "#8b5cf6" },
  { id: "a2", type: "like",       text: "12 new likes across blog posts",     meta: "Various",   time: "18m",  color: "#ec4899" },
  { id: "a3", type: "subscriber", text: "3 new newsletter subscribers",       meta: "+3",        time: "1h",   color: "#10b981" },
  { id: "a4", type: "contact",    text: "New contact: Consulting enquiry",    meta: "James O.",  time: "2h",   color: "#f59e0b" },
  { id: "a5", type: "view",       text: "Blog post trending: 843 views/h",    meta: "Leapfrog",  time: "3h",   color: "#3b82f6" },
  { id: "a6", type: "comment",    text: "New comment on 'Craft Over Grind'",  meta: "Abena M.",  time: "5h",   color: "#8b5cf6" },
  { id: "a7", type: "like",       text: "24 new likes on Ideas Lab",         meta: "Various",   time: "6h",   color: "#ec4899" },
];

const TOP_CONTENT = [
  { id: "p1", title: "The Leapfrog Pattern",           type: "post",  views: 4821, likes: 147, comments: 31, delta: 24 },
  { id: "p2", title: "The Wrong Variable",             type: "post",  views: 3204, likes: 98,  comments: 19, delta: 8 },
  { id: "p3", title: "AI CV Analyzer",                 type: "tool",  views: 2891, likes: 76,  comments: 0,  delta: 15 },
  { id: "p4", title: "Craft Over Grind",               type: "post",  views: 2447, likes: 112, comments: 28, delta: -3 },
  { id: "p5", title: "oKadwuma — Jobs Platform",       type: "app",   views: 1893, likes: 54,  comments: 8,  delta: 5 },
];

const SOCIAL_STATUS = [
  { id: "x",        name: "X / Twitter", icon: Twitter,  color: "#000",     connected: true,  handle: "@iPaha3",         lastPost: "2d ago", followers: 1240 },
  { id: "linkedin", name: "LinkedIn",    icon: Linkedin, color: "#0077b5",  connected: true,  handle: "isaac-paha",      lastPost: "5d ago", followers: 890 },
  { id: "facebook", name: "Facebook",    icon: Facebook, color: "#1877f2",  connected: false, handle: null,              lastPost: null,     followers: null },
];

const UPCOMING = [
  { id: "u1", type: "post",      title: "The Education Bottleneck",           scheduledFor: "Mar 14, 2026", status: "draft",      icon: FileText },
  { id: "u2", type: "newsletter",title: "The Signal — Issue #49",              scheduledFor: "Mar 17, 2026", status: "draft",      icon: Mail },
  { id: "u3", type: "podcast",   title: "EP001: The Africa Premium (recording)", scheduledFor: "Jul 8, 2026",  status: "scheduled",  icon: Mic },
  { id: "u4", type: "post",      title: "Building in Public: Real Costs",      scheduledFor: "Mar 28, 2026", status: "scheduled",  icon: FileText },
];

const SYSTEM = [
  { id: "db",      label: "Database",           status: "ok",      detail: "MySQL · Connected" },
  { id: "clerk",   label: "Auth (Clerk)",        status: "ok",      detail: "Active" },
  { id: "resend",  label: "Email (Resend)",      status: "ok",      detail: "API key set" },
  { id: "openai",  label: "OpenAI API",          status: "ok",      detail: "GPT-4 active" },
  { id: "vercel",  label: "Vercel Analytics",    status: "ok",      detail: "Tracking" },
  { id: "twitter", label: "X/Twitter API",       status: "warning", detail: "Token expiring soon" },
  { id: "linkedin",label: "LinkedIn API",        status: "ok",      detail: "Connected" },
  { id: "facebook",label: "Facebook API",        status: "error",   detail: "Not connected" },
];

const QUICK_ACTIONS = [
  { label: "New Post",      icon: FilePlus,  href: "blog/new",         color: "#f59e0b",  desc: "Write & publish" },
  { label: "New Idea",      icon: Lightbulb, href: "ideas/new",        color: "#8b5cf6",  desc: "Ideas Lab" },
  { label: "New App",       icon: AppWindow, href: "apps/new",         color: "#10b981",  desc: "Add product" },
  { label: "Post Social",   icon: Share2,    href: "social/compose",   color: "#3b82f6",  desc: "Compose post" },
  { label: "New Tool",      icon: Wrench,    href: "tools/new",        color: "#f97316",  desc: "Tools Lab" },
  { label: "Upload Media",  icon: Upload,    href: "media",            color: "#ec4899",  desc: "Media library" },
];

// ─── Helper components ────────────────────────────────────────────────────────

function SectionHeader({
  title,
  href,
  userId,
  action,
}: {
  title: string;
  href?: string;
  userId: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">{title}</h2>
      {href && (
        <Link
          href={`/admin/${userId}/${href}`}
          className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1 transition-colors"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const cfg = {
    ok:      { color: "#10b981", label: "OK" },
    warning: { color: "#f59e0b", label: "Warning" },
    error:   { color: "#ef4444", label: "Error" },
    unknown: { color: "#94a3b8", label: "Unknown" },
  }[status] ?? { color: "#94a3b8", label: "Unknown" };

  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0 inline-block"
      style={{ backgroundColor: cfg.color }}
      title={cfg.label}
    />
  );
}

function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    comment: MessageSquare, like: Heart, subscriber: Users,
    contact: Mail, view: Eye, social: Share2, publish: FileText,
  };
  const Icon = icons[type] ?? Activity;
  return <Icon className="w-3.5 h-3.5" />;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ stat, userId }: { stat: typeof STATS[0]; userId: string }) {
  const positive = stat.delta >= 0;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/admin/${userId}/${stat.href}`} className="block">
        <div className="bg-white border border-stone-100 rounded-sm p-5 hover:border-stone-200 hover:shadow-sm transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-9 h-9 rounded flex items-center justify-center"
              style={{ backgroundColor: stat.bg }}
            >
              <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
            </div>
            <span
              className={`flex items-center gap-1 text-xs font-bold ${
                positive ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {positive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(stat.delta)}%
            </span>
          </div>
          <p className="text-2xl font-black text-stone-900 mb-0.5">{stat.value}</p>
          <p className="text-xs text-stone-400 font-medium">{stat.label}</p>
          <p className="text-[10px] text-stone-300 mt-0.5">{stat.period}</p>
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardClient({ userId }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRefreshing(false);
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">
            {greeting}, Isaac. 👋
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            {now.toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-300 px-3 py-2 rounded-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <StatCard stat={stat} userId={userId} />
          </motion.div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SectionHeader title="Quick Actions" userId={userId} />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={`/admin/${userId}/${action.href}`}
              className="group flex flex-col items-center gap-2 bg-white border border-stone-100 rounded-sm p-4 hover:border-stone-200 hover:shadow-sm transition-all text-center"
            >
              <div
                className="w-9 h-9 rounded flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <action.icon className="w-4 h-4" style={{ color: action.color }} />
              </div>
              <div>
                <p className="text-[11px] font-black text-stone-700 leading-tight">
                  {action.label}
                </p>
                <p className="text-[10px] text-stone-300">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT column: Activity + Top Content */}
        <div className="xl:col-span-2 space-y-6">

          {/* Top performing content */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white border border-stone-100 rounded-sm"
          >
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-stone-400" />
                <h2 className="text-sm font-black text-stone-700">Top Content — Last 30 Days</h2>
              </div>
              <Link
                href={`/admin/${userId}/analytics`}
                className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1"
              >
                Full analytics <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {TOP_CONTENT.map((item, i) => (
                <div key={item.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-stone-50/50 transition-colors group">
                  {/* Rank */}
                  <span className="text-lg font-black text-stone-200 w-7 text-right flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Type badge */}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 capitalize"
                    style={{
                      color: item.type === "post" ? "#f59e0b" : item.type === "tool" ? "#f97316" : "#10b981",
                      backgroundColor: item.type === "post" ? "#fef3c7" : item.type === "tool" ? "#ffedd5" : "#d1fae5",
                    }}
                  >
                    {item.type}
                  </span>

                  {/* Title */}
                  <span className="text-sm font-semibold text-stone-700 group-hover:text-stone-900 flex-1 min-w-0 truncate transition-colors">
                    {item.title}
                  </span>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-xs text-stone-400 flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />{item.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />{item.likes}
                    </span>
                    {item.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />{item.comments}
                      </span>
                    )}
                    {/* Delta */}
                    <span className={`flex items-center gap-0.5 font-bold ${item.delta >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                      {item.delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(item.delta)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Content health */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-stone-100 rounded-sm"
          >
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-stone-400" />
              <h2 className="text-sm font-black text-stone-700">Content Health</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {CONTENT_HEALTH.map((section) => {
                const total = section.published + section.draft;
                const pct = total > 0 ? (section.published / total) * 100 : 0;
                return (
                  <Link
                    key={section.label}
                    href={`/admin/${userId}/${section.href}`}
                    className="group border border-stone-100 rounded-sm p-4 hover:border-stone-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <section.icon className="w-4 h-4" style={{ color: section.color }} />
                      <span className="text-[11px] font-black text-stone-600">{section.label}</span>
                    </div>
                    {/* Bar */}
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: section.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span>
                        <strong className="text-stone-700">{section.published}</strong> pub
                      </span>
                      <span>
                        <strong className="text-stone-500">{section.draft}</strong> draft
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* RIGHT column: Activity + Social + Upcoming + System */}
        <div className="space-y-6">

          {/* Live activity feed */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="bg-white border border-stone-100 rounded-sm"
          >
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black text-stone-700">Live Activity</h2>
            </div>
            <div className="divide-y divide-stone-50 max-h-64 overflow-y-auto">
              {ACTIVITY.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-start gap-3 hover:bg-stone-50/60 transition-colors">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${item.color}18`, color: item.color }}
                  >
                    <TypeIcon type={item.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-700 leading-snug">{item.text}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{item.time} ago</p>
                  </div>
                  <span className="text-[10px] font-semibold text-stone-300 flex-shrink-0 mt-0.5">
                    {item.meta}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-stone-100">
              <Link
                href={`/admin/${userId}/analytics`}
                className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1"
              >
                View all activity <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>

          {/* Social media status */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43 }}
            className="bg-white border border-stone-100 rounded-sm"
          >
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-stone-400" />
                <h2 className="text-sm font-black text-stone-700">Social Media</h2>
              </div>
              <Link
                href={`/admin/${userId}/social`}
                className="text-xs text-amber-600 hover:text-amber-800 font-semibold"
              >
                Manage
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {SOCIAL_STATUS.map((platform) => (
                <div key={platform.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${platform.color}12`, border: `1px solid ${platform.color}22` }}
                  >
                    <platform.icon className="w-4 h-4" style={{ color: platform.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-700">{platform.name}</p>
                    {platform.connected ? (
                      <p className="text-[10px] text-stone-400 truncate">
                        {platform.handle} · {platform.followers?.toLocaleString()} followers
                      </p>
                    ) : (
                      <p className="text-[10px] text-red-400">Not connected</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {platform.connected ? (
                      <>
                        <span className="text-[10px] text-stone-300">{platform.lastPost}</span>
                        <Link
                          href={`/admin/${userId}/social/compose?platform=${platform.id}`}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-800 border border-amber-200 hover:border-amber-300 px-2 py-0.5 rounded-sm transition-colors"
                        >
                          Post
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/admin/${userId}/social`}
                        className="text-[10px] font-bold text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 px-2 py-0.5 rounded-sm transition-colors"
                      >
                        Connect
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-stone-100">
              <Link
                href={`/admin/${userId}/social/compose`}
                className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-sm py-2.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Compose new post
              </Link>
            </div>
          </motion.div>

          {/* Upcoming */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.47 }}
            className="bg-white border border-stone-100 rounded-sm"
          >
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              <h2 className="text-sm font-black text-stone-700">Upcoming</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {UPCOMING.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-start gap-3 hover:bg-stone-50/50 transition-colors">
                  <div className="w-7 h-7 rounded bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-3.5 h-3.5 text-stone-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-700 leading-snug truncate">{item.title}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {item.scheduledFor}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 capitalize"
                    style={{
                      color: item.status === "scheduled" ? "#f59e0b" : "#94a3b8",
                      backgroundColor: item.status === "scheduled" ? "#fef3c7" : "#f1f5f9",
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* System status */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white border border-stone-100 rounded-sm"
          >
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-stone-400" />
              <h2 className="text-sm font-black text-stone-700">System Status</h2>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {SYSTEM.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <StatusDot status={item.status} />
                  <span className="text-xs text-stone-600 flex-1 font-medium">{item.label}</span>
                  <span className="text-[10px] text-stone-400">{item.detail}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-stone-100">
              <Link
                href={`/admin/${userId}/settings`}
                className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1"
              >
                Manage integrations <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}