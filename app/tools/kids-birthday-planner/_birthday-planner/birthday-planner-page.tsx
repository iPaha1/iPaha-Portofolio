"use client";

// =============================================================================
// isaacpaha.com — AI Kids Birthday Planner — Page Shell
// app/tools/kids-birthday-planner/_components/birthday-planner-page.tsx
//
// Tabs:
//   Plan a Party  → BirthdayPlannerTool (3-step form + AI + plan display)
//   My Parties    → PartyListDashboard  (saved parties + reopen)
//   How It Works  → guide
//   Reviews       → social proof
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link                                          from "next/link";
import { motion, AnimatePresence }                   from "framer-motion";
import {
  ArrowLeft, Star, Clock, Share2, Check, ChevronRight,
  PartyPopper, Users, Music, Gift, Calendar, Wand2,
  Zap, Shield, MessageSquare, BookOpen, Info,
  TrendingUp, Loader2, ExternalLink, Trash2, Send,
  RefreshCw, Package,
} from "lucide-react";
import { TOOL_CATEGORIES, TOOLS } from "@/lib/data/tools-data";
import { ToolCard } from "../../_tools/tools-card";
import { BirthdayPlannerTool }     from "./birthday-planner-tool";

const TOOL   = TOOLS.find((t) => t.slug === "kids-birthday-planner")!;
const ACCENT = "#f43f5e";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedParty {
  id:           string;
  childName:    string;
  childAge:     number;
  partyDate:    string;
  theme:        string;
  customTheme?: string;
  numKids:      number;
  budgetRange:  string;
  indoor:       boolean;
  status:       "DRAFT" | "ACTIVE" | "DAY_OF" | "COMPLETED";
  inviteToken:  string;
  planJson?:    string | null;
  guests:       { id: string; status: string }[];
  checklist:    { id: string; isDone: boolean }[];
}

// ─── Party List Dashboard ─────────────────────────────────────────────────────

function PartyListDashboard({ onReopenParty }: {
  onReopenParty: (planJson: string, formData: any) => void;
}) {
  const [parties,  setParties]  = useState<SavedParty[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied,   setCopied]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/birthday-planner/parties");
      const data = await res.json();
      setParties(data.parties ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/tools/birthday-planner/parties/${id}`, { method: "DELETE" }).catch(() => {});
    setParties(p => p.filter(x => x.id !== id));
    setDeleting(null);
  };

  const copyInviteLink = async (token: string, id: string) => {
    const url = `${window.location.origin}/tools/kids-birthday-planner/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT:     { label: "Draft",     color: "#6b7280", bg: "#f3f4f6" },
    ACTIVE:    { label: "Live 🎈",   color: "#059669", bg: "#d1fae5" },
    DAY_OF:    { label: "Party Day!",color: "#f43f5e", bg: "#ffe4e6" },
    COMPLETED: { label: "Done ✅",   color: "#6b7280", bg: "#f3f4f6" },
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  if (parties.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-sm bg-stone-50">
      <div className="text-4xl mb-4">🎂</div>
      <h3 className="text-base font-black text-stone-900 mb-2">No saved parties yet</h3>
      <p className="text-sm text-stone-500 max-w-xs leading-relaxed">Generate a party plan and click <strong>Save Party</strong> to access it here anytime.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider">{parties.length} saved part{parties.length !== 1 ? "ies" : "y"}</p>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>
      {parties.map(p => {
        const cfg          = STATUS_CFG[p.status] ?? STATUS_CFG.DRAFT;
        const accepted     = p.guests.filter(g => ["ACCEPTED","CHECKED_IN","CHECKED_OUT"].includes(g.status)).length;
        const checklistPct = p.checklist.length ? Math.round((p.checklist.filter(c => c.isDone).length / p.checklist.length) * 100) : 0;
        const themeName    = p.customTheme || p.theme;
        const partyDate    = new Date(p.partyDate);
        const isPast       = partyDate < new Date();

        return (
          <motion.div key={p.id} layout initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: `${ACCENT}12` }}>🎂</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-sm" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm" style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}>{themeName}</span>
                  </div>
                  <p className="text-sm font-bold text-stone-900">{p.childName}'s Birthday Party</p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{partyDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{accepted} RSVPs</span>
                    {p.checklist.length > 0 && <span>✅ {checklistPct}%</span>}
                    {isPast && <span className="text-stone-300">Past</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {p.planJson && (
                  <button
                    onClick={() => {
                      try {
                        const plan = JSON.parse(p.planJson!);
                        onReopenParty(p.planJson!, {
                          childName: p.childName, childAge: String(p.childAge),
                          partyDate: p.partyDate?.split("T")[0] ?? "",
                          numKids: String(p.numKids), theme: p.theme,
                          customTheme: p.customTheme ?? "", budgetRange: p.budgetRange,
                          indoor: p.indoor,
                        });
                      } catch {}
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm transition-colors"
                    style={{ backgroundColor: ACCENT }}>
                    <PartyPopper className="w-3.5 h-3.5" />View Plan
                  </button>
                )}
                <a href={`/tools/kids-birthday-planner/${p.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />Dashboard
                </a>
                {p.status === "ACTIVE" || p.status === "DAY_OF" ? (
                  <button onClick={() => copyInviteLink(p.inviteToken, p.id)}
                    className="flex items-center gap-1.5 text-xs font-bold border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors text-stone-500 hover:text-stone-900">
                    {copied === p.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copied === p.id ? "Copied!" : "Invite Link"}
                  </button>
                ) : (
                  <button onClick={() => copyInviteLink(p.inviteToken, p.id)}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 border border-stone-100 hover:border-stone-300 px-3 py-2 rounded-sm transition-colors">
                    {copied === p.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copied === p.id ? "Copied!" : "Get Link"}
                  </button>
                )}
                <button onClick={() => del(p.id)} disabled={deleting === p.id}
                  className="text-xs text-stone-300 hover:text-red-500 ml-auto transition-colors flex items-center gap-1 disabled:opacity-60">
                  {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Wand2,        color: "#f43f5e", title: "AI Party Plan in Seconds",    desc: "Complete theme, schedule, food, activities, and more — generated in ~8 seconds." },
  { icon: MessageSquare,color: "#6366f1", title: "Smart Invite Links",          desc: "One link evolves: invitation → guest dashboard → live check-in on party day." },
  { icon: Users,        color: "#10b981", title: "Live RSVP Tracking",          desc: "Guests RSVP and you see who's coming in real time, with allergy alerts." },
  { icon: Calendar,     color: "#f59e0b", title: "Party Day Mode",              desc: "Activity timers, live check-in, real-time headcount. Every child accounted for." },
  { icon: Shield,       color: "#8b5cf6", title: "Safe Check-In / Check-Out",   desc: "Parents tap 'I've picked up my child'. Organiser sees who has left." },
  { icon: Music,        color: "#ec4899", title: "Song Request System",         desc: "Guests suggest songs from the invite page. Kids love seeing their name on the list." },
  { icon: Gift,         color: "#f97316", title: "Budget Tracker & Party Bags", desc: "Real-time estimates with saving tips. Party bag ideas per budget tier." },
  { icon: Check,        color: "#14b8a6", title: "Auto-Generated Checklist",    desc: "AI creates a timed task list covering invites, decorations, food, and party day." },
];

const REVIEWS = [
  { name: "Sarah M.",  role: "Mum of 2",         avatar: "SM", rating: 5, date: "2 days ago",    body: "Planned Ella's whole party in 2 minutes. The invite link is GENIUS — guests RSVPed, I could see exactly who was coming, and on the day everyone checked in from their phone. I got so many 'what app is this?' messages." },
  { name: "Marcus T.", role: "Dad",               avatar: "MT", rating: 5, date: "1 week ago",    body: "The AI suggested activities perfectly matched to 6-8 year olds. The food plan was allergy-aware (3 nut allergies). The check-in system on the day was so smooth." },
  { name: "Amira K.",  role: "Mum",               avatar: "AK", rating: 5, date: "2 weeks ago",   body: "The song request feature had the kids SO excited. They could see their name on the list from the invite page before the party even started!" },
  { name: "Rebecca P.",role: "Party organiser",   avatar: "RP", rating: 4, date: "3 weeks ago",   body: "Organised a space-themed party for 20 kids. The AI plan was incredibly detailed. The budget breakdown helped me make smart swaps." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "3 quick steps",               desc: "Enter the child's name, age, and date. Tap-select theme, budget, and preferences — no typing essays." },
  { step: "02", title: "AI generates the full plan",  desc: "In ~8 seconds: schedule, activities, food, music, party bags, checklist, and budget breakdown." },
  { step: "03", title: "Share your smart invite link",desc: "One link. Guests sign in, RSVP, see who's coming, request songs. On party day it becomes a live check-in system." },
  { step: "04", title: "Party day mode",              desc: "Activity timers, live check-in, safe check-out. Every child tracked." },
];

function StarRow({ n }: { n: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}</div>;
}

// ─── Reopen state interface ───────────────────────────────────────────────────

export interface BirthdayReopenData {
  planJson: string;
  formData: any;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export function BirthdayPlannerPage({ isSignedIn }: { isSignedIn: boolean }) {
  const [activeTab,  setActiveTab]  = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
  const [copied,     setCopied]     = useState(false);
  const [reopenData, setReopenData] = useState<BirthdayReopenData | null>(null);

  const category = TOOL_CATEGORIES.find(c => c.name === TOOL?.category);
  const related  = TOOLS.filter(t => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);
  if (!TOOL) return null;

  const TABS = [
    { id: "tool",      label: "Plan a Party",  icon: Wand2         },
    ...(isSignedIn ? [{ id: "workspace", label: "My Parties", icon: TrendingUp }] : []),
    { id: "guide",     label: "How It Works",  icon: BookOpen      },
    { id: "reviews",   label: "Reviews",       icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Sora, sans-serif" }}>
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5" style={{ backgroundColor: ACCENT }} />
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.06] pointer-events-none" style={{ backgroundColor: ACCENT }} />

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
                style={{ backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}30` }}>🎂</div>
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
            <p className="text-lg text-gray-600 mb-5 leading-relaxed">
              Plan your child's perfect birthday party in minutes. AI generates a complete party plan — then share a smart invite link that transforms into a live RSVP tracker, guest dashboard, and check-in system on party day. All from one link.
            </p>
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: ACCENT }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Free
              </span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
              <span className="font-semibold" style={{ color: ACCENT }}>👶 Ages 3–12</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {TOOL.features.map(f => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                  <Check className="w-3 h-3" style={{ color: ACCENT }} />{f}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors shadow-sm"
                style={{ backgroundColor: ACCENT }}>
                <Wand2 className="w-4 h-4" />Plan a Party 🎉
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace" as any)}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xs transition-colors border"
                  style={{ color: ACCENT, borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}08` }}>
                  <TrendingUp className="w-4 h-4" />My Parties
                </button>
              )}
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block">
            <div className="border rounded-xs p-5" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: ACCENT }}>The Smart Link</p>
              <div className="space-y-3 mb-5">
                {[
                  { state: "Before RSVP",  icon: "📨", desc: "Beautiful invitation" },
                  { state: "After RSVP",   icon: "🎉", desc: "Live guest dashboard" },
                  { state: "Party day",    icon: "✅", desc: "Check-in system" },
                ].map(s => (
                  <div key={s.state} className="flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-stone-800">{s.state}</p>
                      <p className="text-[11px] text-stone-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-stone-400 italic">Same link. Different experience. 🔥</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
          {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as "tool" | "workspace" | "guide" | "reviews")}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? "border-rose-500 text-rose-600" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {/* TOOL */}
            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: `${ACCENT}06` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎂</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
                        <p className="text-xs text-gray-400">Plan a birthday party in minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-xs"
                      style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />Free
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <BirthdayPlannerTool
                      isSignedIn={isSignedIn}
                      reopenData={reopenData}
                      onReopened={() => setReopenData(null)}
                    />
                  </div>
                </div>
                {!isSignedIn && (
                  <div className="flex items-start gap-3 mt-5 bg-rose-50 border border-rose-100 rounded-xs px-4 py-3.5">
                    <Info className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-700 leading-relaxed">
                      <strong>Sign in free</strong> to save your party plan and access smart invite links.{" "}
                      <a href="/sign-in?redirect_url=/tools/kids-birthday-planner" className="underline">Sign in →</a>
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* WORKSPACE */}
            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn ? (
                  <PartyListDashboard
                    onReopenParty={(planJson, formData) => {
                      setReopenData({ planJson, formData });
                      setActiveTab("tool");
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                    <div className="text-4xl mb-4">🎂</div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to see your parties</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">Save party plans and access them here with one click.</p>
                    <a href="/sign-in?redirect_url=/tools/kids-birthday-planner"
                      className="flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xs transition-colors"
                      style={{ backgroundColor: ACCENT }}>Sign in — it's free</a>
                  </div>
                )}
              </motion.div>
            )}

            {/* GUIDE */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How it works</h2>
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={s.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10 text-white" style={{ backgroundColor: ACCENT }}>{s.step}</div>
                    <div><h3 className="text-base font-bold text-gray-900 mb-1">{s.title}</h3><p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p></div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {FEATURES.map(f => (
                    <div key={f.title} className="bg-white border border-stone-100 rounded-xs p-4">
                      <div className="w-8 h-8 rounded-sm flex items-center justify-center mb-3" style={{ backgroundColor: `${f.color}15` }}>
                        <f.icon className="w-4 h-4" style={{ color: f.color }} />
                      </div>
                      <p className="text-sm font-bold text-stone-800 mb-1">{f.title}</p>
                      <p className="text-xs text-stone-500 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* REVIEWS */}
            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
                {REVIEWS.map(r => (
                  <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ACCENT }}>{r.avatar}</div>
                        <div><p className="text-sm font-bold text-gray-900">{r.name}</p><p className="text-xs text-gray-400">{r.role}</p></div>
                      </div>
                      <div className="text-right"><StarRow n={r.rating} /><p className="text-xs text-gray-400 mt-1">{r.date}</p></div>
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
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Navigate</p>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as "tool" | "workspace" | "guide" | "reviews")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                      <t.icon className="w-4 h-4" />{t.label}
                    </button>
                  ))}
              </div>
              {related.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Tools</p>
                  <div className="space-y-3">
                    {related.map(t => (
                      <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 shrink-0" />
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

        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-8">More Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map(t => <ToolCard key={t.id} tool={t} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}