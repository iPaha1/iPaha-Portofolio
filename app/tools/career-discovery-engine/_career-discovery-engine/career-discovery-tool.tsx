"use client";

// =============================================================================
// isaacpaha.com — Career Discovery Engine — Core Tool
// app/tools/career-discovery-engine/_career-discovery/career-discovery-tool.tsx
//
// Stage 1 — Input (skills, education, goals, experience)
// Stage 2 — Loading (animated)
// Stage 3 — Results (career cards with full detail, comparison, coach)
// =============================================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence }                         from "framer-motion";
import {
  Plus, Trash2, Sparkles, Loader2, AlertCircle, Check,
  ChevronDown, ChevronUp, RefreshCw, X, Send, ArrowRight,
  TrendingUp, Target, Clock, DollarSign, Zap, Shield,
  MessageSquare, BarChart2, MapPin, Award, BookOpen,
  Briefcase, Users, Globe, AlertTriangle, CheckCircle2,
  Lightbulb, Star, Save, Scale,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenGateInfo { required: number; balance: number; toolName: string | null; }

export interface CareerDiscoveryToolProps {
  isSignedIn?:           boolean;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
  reopenCareer?:         any | null;
  onReopened?:           () => void;
}

interface Career {
  id:                    number;
  title:                 string;
  industry:              string;
  tagline:               string;
  whyOverlooked:         string;
  competitionLevel:      string;
  competitionExplained:  string;
  salaryEntry:           string;
  salaryMid:             string;
  salarySenior:          string;
  entryTimeframe:        string;
  entryTimeframeEnum:    string;
  skillMatchPct:         number;
  skillsTheyAlreadyHave: string[];
  skillsTheyNeed:        string[];
  demandTrend:           string;
  demandExplained:       string;
  certifications:        { name: string; provider: string; cost: string; timeToComplete: string; priority: string }[];
  entryRoadmap:          { step: number; action: string; timeframe: string; detail: string; resources: string[] }[];
  whereToFindJobs:       string[];
  fastestPathToIncome:   string;
  realWorldExample:      string;
  whyItPaysWell:         string;
  redFlags:              string[];
  verdict:               string;
}

interface DiscoveryResult {
  summary:             string;
  profileStrengths:    string[];
  fastestIncomeCareer: string;
  skillGapOverview:    string;
  careers:             Career[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#ec4899";

const COMP_CFG: Record<string, { label: string; color: string; bg: string }> = {
  VERY_LOW: { label: "Very Low Competition",   color: "#10b981", bg: "#d1fae5" },
  LOW:      { label: "Low Competition",        color: "#34d399", bg: "#ecfdf5" },
  MEDIUM:   { label: "Medium Competition",     color: "#f59e0b", bg: "#fef3c7" },
  HIGH:     { label: "High Competition",       color: "#f97316", bg: "#ffedd5" },
  VERY_HIGH:{ label: "Very High Competition",  color: "#ef4444", bg: "#fee2e2" },
};

const DEMAND_CFG: Record<string, { label: string; color: string }> = {
  RISING:   { label: "📈 Rising demand",   color: "#10b981" },
  STABLE:   { label: "📊 Stable demand",   color: "#6b7280" },
  EMERGING: { label: "🚀 Emerging field",  color: "#8b5cf6" },
};

const CERT_PRIORITY: Record<string, { color: string; bg: string }> = {
  ESSENTIAL:    { color: "#ef4444", bg: "#fee2e2" },
  RECOMMENDED:  { color: "#f59e0b", bg: "#fef3c7" },
  OPTIONAL:     { color: "#6b7280", bg: "#f3f4f6" },
};

const EXP_LEVELS = [
  { id: "entry",     label: "Graduate / Entry",  sub: "0–2 years" },
  { id: "mid",       label: "Mid-Level",          sub: "2–5 years" },
  { id: "senior",    label: "Senior / Expert",    sub: "5+ years"  },
  { id: "switching", label: "Career Switcher",    sub: "Any level" },
];

const SKILL_SUGGESTIONS = [
  "Excel", "Python", "SQL", "Project Management", "Communication",
  "Data Analysis", "Microsoft Office", "Leadership", "Research",
  "Customer Service", "Writing", "Problem Solving", "JavaScript",
  "Marketing", "Finance", "Sales", "Design", "Operations",
];

// ─── Skill Match Ring ─────────────────────────────────────────────────────────

function MatchRing({ pct }: { pct: number }) {
  const size = 52;
  const r    = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * circ;
  const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#f87171";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-black" style={{ color }}>{pct}%</span>
        <span className="text-[8px] text-stone-400">match</span>
      </div>
    </div>
  );
}

// ─── Career Card ──────────────────────────────────────────────────────────────

function CareerCard({
  career, index, isSignedIn, userSkills, queryId, onSave, onSelectCompare, isInCompare,
  onInsufficientTokens,
}: {
  career:               Career;
  index:                number;
  isSignedIn:           boolean;
  userSkills:           string[];
  queryId:              string | null;
  onSave:               (career: Career) => void;
  onSelectCompare:      (title: string) => void;
  isInCompare:          boolean;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "roadmap" | "certs" | "coach">("overview");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [deepData,  setDeepData]  = useState<any>(null);
  const [deepLoading,setDeepLoading] = useState(false);

  // Coach
  const [coachMessages, setCoachMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [coachInput,    setCoachInput]    = useState("");
  const [coachLoading,  setCoachLoading]  = useState(false);
  const coachRef = useRef<HTMLDivElement>(null);

  const comp   = COMP_CFG[career.competitionLevel] ?? COMP_CFG.MEDIUM;
  const demand = DEMAND_CFG[career.demandTrend]    ?? DEMAND_CFG.STABLE;

  const handleSave = async () => {
    if (!isSignedIn) return;
    setSaving(true);
    await onSave(career);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const loadDeep = async () => {
    if (deepData) return;
    setDeepLoading(true);
    try {
      const res  = await fetch("/api/tools/career-discovery/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: userSkills, careerTitle: career.title, mode: "deep" }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Career Deep Dive" });
        setDeepLoading(false); return;
      }
      const data = await res.json();
      setDeepData(data.result);
    } catch {}
    setDeepLoading(false);
  };

  const sendCoach = async () => {
    if (!coachInput.trim() || coachLoading) return;
    const msg = coachInput.trim();
    setCoachMessages(p => [...p, { role: "user", text: msg }]);
    setCoachInput("");
    setCoachLoading(true);
    try {
      const res  = await fetch("/api/tools/career-discovery/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills:        userSkills,
          mode:          "coach",
          coachContext:  `Career being discussed: ${career.title}. User question: "${msg}"`,
          careerTitle:   career.title,
        }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Career Coach" });
        setCoachMessages(p => [...p, { role: "ai", text: "You've run out of tokens. Play some games to earn more!" }]);
        setCoachLoading(false); return;
      }
      const data = await res.json();
      setCoachMessages(p => [...p, { role: "ai", text: data.result?.reply ?? "I couldn't respond. Try again." }]);
    } catch { setCoachMessages(p => [...p, { role: "ai", text: "Network error — please try again." }]); }
    setCoachLoading(false);
    setTimeout(() => coachRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const CARD_TABS = [
    { id: "overview", label: "Overview",   icon: BarChart2    },
    { id: "roadmap",  label: "Roadmap",    icon: Target       },
    { id: "certs",    label: "Certs",      icon: Award        },
    { id: "coach",    label: "Ask Coach",  icon: MessageSquare},
  ] as const;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all shadow-sm">

      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <MatchRing pct={career.skillMatchPct} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                style={{ color: ACCENT, backgroundColor: `${ACCENT}12` }}>{career.industry}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                style={{ color: comp.color, backgroundColor: comp.bg }}>
                {comp.label}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: demand.color }}>{demand.label}</span>
            </div>
            <h3 className="text-lg font-black text-stone-900 leading-tight">{career.title}</h3>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{career.tagline}</p>
          </div>
        </div>

        {/* Salary + time strip */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: DollarSign, label: "Entry",   value: career.salaryEntry, color: "#6b7280"  },
            { icon: TrendingUp, label: "Senior",  value: career.salarySenior,color: "#10b981"  },
            { icon: Clock,      label: "To break in", value: career.entryTimeframe, color: "#8b5cf6" },
          ].map(s => (
            <div key={s.label} className="bg-stone-50 rounded-sm px-3 py-2.5 text-center">
              <s.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-xs font-black text-stone-800 leading-tight">{s.value}</p>
              <p className="text-[9px] text-stone-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Skill match */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {career.skillsTheyAlreadyHave.slice(0, 4).map(s => (
            <span key={s} className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
              <Check className="w-2.5 h-2.5" />{s}
            </span>
          ))}
          {career.skillsTheyNeed.slice(0, 2).map(s => (
            <span key={s} className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-sm">+ {s}</span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <button onClick={() => { setExpanded(p => !p); if (!expanded) loadDeep(); }}
            className="flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2.5 rounded-sm transition-colors"
            style={{ backgroundColor: ACCENT }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {expanded ? "Less" : "Full Breakdown"}
          </button>
          {isSignedIn && (
            <button onClick={handleSave} disabled={saving || saved}
              className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2.5 rounded-sm transition-all ${
                saved ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-500 border-stone-200 hover:border-stone-400"
              }`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Saved!" : "Save"}
            </button>
          )}
          <button onClick={() => onSelectCompare(career.title)}
            className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2.5 rounded-sm transition-all ${
              isInCompare ? "text-purple-700 border-purple-300 bg-purple-50" : "text-stone-400 border-stone-200 hover:border-purple-300"
            }`}>
            <Scale className="w-3.5 h-3.5" />{isInCompare ? "In Compare ✓" : "Compare"}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-stone-100">
              {/* Why Overlooked — always visible in expand */}
              <div className="px-5 py-4" style={{ backgroundColor: `${ACCENT}05` }}>
                <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: ACCENT }}>
                  💎 Why No One Talks About This
                </p>
                <p className="text-sm text-stone-700 leading-relaxed">{career.whyOverlooked}</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 border-b border-stone-100 overflow-x-auto px-5">
                {CARD_TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === t.id ? "border-pink-500 text-pink-600" : "border-transparent text-stone-400 hover:text-stone-700"
                    }`}>
                    <t.icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                ))}
              </div>

              <div className="px-5 py-5 space-y-4">
                {/* ── OVERVIEW ── */}
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    {/* Why it pays well */}
                    <div className="bg-stone-50 border border-stone-100 rounded-sm p-4">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">💰 Why It Pays Well</p>
                      <p className="text-sm text-stone-700 leading-relaxed">{career.whyItPaysWell}</p>
                    </div>

                    {/* Real world example */}
                    {career.realWorldExample && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-sm p-4">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1.5">👤 Real World Day</p>
                        <p className="text-sm text-indigo-800 leading-relaxed">{career.realWorldExample}</p>
                      </div>
                    )}

                    {/* Fastest income */}
                    {career.fastestPathToIncome && (
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3.5">
                        <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">⚡ Fastest Path to Income</p>
                          <p className="text-xs text-amber-800 leading-relaxed">{career.fastestPathToIncome}</p>
                        </div>
                      </div>
                    )}

                    {/* Where to find jobs */}
                    {career.whereToFindJobs?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">🌍 Where to Find Jobs</p>
                        <div className="flex flex-wrap gap-2">
                          {career.whereToFindJobs.map((place, i) => (
                            <span key={i} className="text-xs font-semibold text-stone-700 bg-stone-100 border border-stone-200 px-2.5 py-1.5 rounded-sm">
                              {place}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Red flags */}
                    {career.redFlags?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">⚠️ Be Aware</p>
                        {career.redFlags.map((flag, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-stone-600 mb-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />{flag}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Deep dive (if loaded) */}
                    {deepLoading && (
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />Loading deep analysis…
                      </div>
                    )}
                    {deepData && (
                      <div className="space-y-3">
                        <div className="bg-stone-900 text-white rounded-sm p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-2">🔬 Deep Dive</p>
                          <p className="text-xs leading-relaxed text-white/85">{deepData.deepDive}</p>
                        </div>
                        {deepData.topEmployers?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Top Employers</p>
                            <div className="space-y-1.5">
                              {deepData.topEmployers.slice(0, 4).map((e: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-3 py-2">
                                  <p className="text-xs font-bold text-stone-800 flex-1">{e.company}</p>
                                  <span className="text-[10px] text-stone-400">{e.type}</span>
                                  <p className="text-[10px] text-stone-400 text-right max-w-[40%] leading-tight">{e.tipToGetIn}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Verdict */}
                    <div className="rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>💎 Isaac's Take</p>
                      <p className="text-sm font-semibold text-stone-800 leading-relaxed">{career.verdict}</p>
                    </div>
                  </div>
                )}

                {/* ── ROADMAP ── */}
                {activeTab === "roadmap" && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Step-by-Step Entry Plan</p>
                    {career.entryRoadmap?.map((step, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i < career.entryRoadmap.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-px bg-stone-100" />
                        )}
                        <div className="w-8 h-8 rounded-sm font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10 text-white"
                          style={{ backgroundColor: ACCENT }}>
                          {step.step}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-stone-900">{step.action}</p>
                            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{step.timeframe}</span>
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed mb-2">{step.detail}</p>
                          {step.resources?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {step.resources.map((r, ri) => (
                                <span key={ri} className="text-[10px] text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-sm">
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── CERTS ── */}
                {activeTab === "certs" && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Certification Roadmap</p>
                    {career.certifications?.map((cert, i) => {
                      const pri = CERT_PRIORITY[cert.priority] ?? CERT_PRIORITY.OPTIONAL;
                      return (
                        <div key={i} className="bg-white border border-stone-100 rounded-sm p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-bold text-stone-900">{cert.name}</p>
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm"
                                  style={{ color: pri.color, backgroundColor: pri.bg }}>{cert.priority}</span>
                              </div>
                              <p className="text-xs text-stone-500">{cert.provider}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold text-stone-700">{cert.cost}</p>
                              <p className="text-[10px] text-stone-400">{cert.timeToComplete}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── COACH ── */}
                {activeTab === "coach" && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-sm px-4 py-3.5"
                      style={{ backgroundColor: `${ACCENT}06`, border: `1px solid ${ACCENT}30` }}>
                      <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                      <p className="text-xs leading-relaxed" style={{ color: "#831843" }}>
                        <span className="font-bold">Career Coach</span> — ask anything about breaking into {career.title}. How to network, what to study, how to stand out.
                      </p>
                    </div>
                    {coachMessages.length > 0 && (
                      <div className="space-y-3 max-h-72 overflow-y-auto">
                        {coachMessages.map((m, i) => (
                          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                              m.role === "user" ? "bg-stone-200 text-stone-700" : "text-white"
                            }`} style={m.role === "ai" ? { backgroundColor: ACCENT } : {}}>
                              {m.role === "user" ? "You" : "💎"}
                            </div>
                            <div className={`flex-1 max-w-[85%] rounded-sm px-4 py-3 text-sm leading-relaxed ${
                              m.role === "user" ? "bg-stone-100 text-stone-700" : "text-stone-800"
                            }`} style={m.role === "ai" ? { backgroundColor: `${ACCENT}08`, border: `1px solid ${ACCENT}25` } : {}}>
                              {m.text}
                            </div>
                          </div>
                        ))}
                        {coachLoading && (
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: ACCENT }}>💎</div>
                            <div className="rounded-sm px-4 py-3 flex items-center gap-2" style={{ backgroundColor: `${ACCENT}08` }}>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: ACCENT }} />
                              <span className="text-xs" style={{ color: ACCENT }}>Thinking…</span>
                            </div>
                          </div>
                        )}
                        <div ref={coachRef} />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={coachInput} onChange={e => setCoachInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendCoach()}
                        placeholder={`Ask about ${career.title}…`}
                        className="flex-1 text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-pink-400" />
                      <button onClick={sendCoach} disabled={coachLoading || !coachInput.trim()}
                        className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60"
                        style={{ backgroundColor: ACCENT }}>
                        {coachLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Comparison Panel ─────────────────────────────────────────────────────────

function ComparisonPanel({
  careers, userSkills, onClose, onInsufficientTokens,
}: {
  careers:              string[];
  userSkills:           string[];
  onClose:              () => void;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
}) {
  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (careers.length < 2) return;
    const run = async () => {
      setLoading(true);
      try {
        const res  = await fetch("/api/tools/career-discovery/compare", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ careers, skills: userSkills }),
        });
        if (res.status === 402) {
          const data = await res.json();
          if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Career Comparison" });
          setLoading(false); return;
        }
        const data = await res.json();
        setResult(data.result);
      } catch {}
      setLoading(false);
    };
    run();
  }, [careers, userSkills]);

  return (
    <div className="bg-white border border-stone-100 rounded-sm overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100" style={{ backgroundColor: `${ACCENT}06` }}>
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4" style={{ color: ACCENT }} />
          <p className="text-sm font-bold text-stone-900">Career Comparison</p>
          <span className="text-xs text-stone-400">{careers.join(" vs ")}</span>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5">
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: ACCENT }} />
            <span className="text-sm text-stone-500">Comparing careers…</span>
          </div>
        )}
        {result && !loading && (
          <div className="space-y-4">
            <div className="rounded-sm px-4 py-3" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
              <p className="text-xs font-bold text-stone-700 leading-relaxed">{result.overallVerdict}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left text-[10px] font-black text-stone-400 uppercase tracking-wider py-2 pr-4">Dimension</th>
                    {careers.map(c => (
                      <th key={c} className="text-left text-[10px] font-black text-stone-700 py-2 px-2">{c}</th>
                    ))}
                    <th className="text-left text-[10px] font-black text-stone-400 uppercase tracking-wider py-2 pl-2">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {result.matrix?.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                      <td className="py-2.5 pr-4 font-semibold text-stone-700">{row.dimension}</td>
                      {careers.map(c => (
                        <td key={c} className="py-2.5 px-2 text-stone-600">{row.values?.[c] ?? "—"}</td>
                      ))}
                      <td className="py-2.5 pl-2 font-bold" style={{ color: ACCENT }}>
                        {row.winner === row.winner ? "✓" : ""} {row.winner?.split(" ").slice(0, 2).join(" ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-stone-900 text-white rounded-sm p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Recommendation</p>
              <p className="text-sm leading-relaxed">{result.myVerdict}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function CareerDiscoveryTool({
  isSignedIn = false,
  onInsufficientTokens,
  reopenCareer,
  onReopened,
}: CareerDiscoveryToolProps) {
  const [stage,        setStage]        = useState<"input" | "loading" | "results">("input");
  const [result,       setResult]       = useState<DiscoveryResult | null>(null);
  const [error,        setError]        = useState("");
  const [loadStep,     setLoadStep]     = useState(0);
  const [queryId,      setQueryId]      = useState<string | null>(null);

  // Input fields
  const [skills,       setSkills]       = useState<string[]>([]);
  const [skillInput,   setSkillInput]   = useState("");
  const [education,    setEducation]    = useState("");
  const [goals,        setGoals]        = useState("");
  const [expLevel,     setExpLevel]     = useState("entry");
  const [currentRole,  setCurrentRole]  = useState("");
  const [salaryTarget, setSalaryTarget] = useState<number | "">("");

  // Compare
  const [compareList,  setCompareList]  = useState<string[]>([]);
  const [showCompare,  setShowCompare]  = useState(false);

  // User skills (from input, kept for coach context)
  const userSkills = skills;

  const LOAD_STEPS = [
    "Analysing your skills and experience…",
    "Scanning niche career markets…",
    "Finding overlooked opportunities…",
    "Calculating competition levels…",
    "Building your entry roadmaps…",
    "Writing your personalised career report…",
  ];

  // ── Reopen a specific career from dashboard ──────────────────────────────
  useEffect(() => {
    if (!reopenCareer) return;
    setResult({ summary: "", profileStrengths: [], fastestIncomeCareer: "", skillGapOverview: "", careers: [reopenCareer] });
    setStage("results");
    onReopened?.();
  }, [reopenCareer]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 15) {
      setSkills(p => [...p, s]);
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) => setSkills(p => p.filter(x => x !== s));

  const handleGenerate = async () => {
    if (!skills.length && !education.trim() && !goals.trim()) return;
    setStage("loading"); setError(""); setLoadStep(0); setResult(null);
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 1300);

    try {
      const res = await fetch("/api/tools/career-discovery/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills, education, goals, experienceLevel: expLevel, currentRole, salaryTarget: Number(salaryTarget) || 0, mode: "full" }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: TOOL_NAME });
        clearInterval(interval); setStage("input"); setError("You've run out of tokens. Play some games to earn more, then try again.");
        return;
      }
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.result) { setError(data.error ?? "Discovery failed — please try again."); setStage("input"); return; }
      setResult(data.result);
      setStage("results");
    } catch { clearInterval(interval); setError("Network error — please try again."); setStage("input"); }
  };

  const handleSaveCareer = async (career: Career) => {
    const res  = await fetch("/api/tools/career-discovery/save?type=career", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ career, queryId }),
    });
    const data = await res.json();
    return data;
  };

  const toggleCompare = (title: string) => {
    setCompareList(p => p.includes(title)
      ? p.filter(t => t !== title)
      : p.length < 3 ? [...p, title] : p
    );
  };

  const TOOL_NAME = "Career Discovery Engine";

  // ── INPUT ──────────────────────────────────────────────────────────────────
  if (stage === "input") return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Hero hook */}
      <div className="bg-stone-900 text-white rounded-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Your Unfair Advantage</p>
        <p className="text-lg font-black leading-tight mb-1">Find the careers others don't see.</p>
        <p className="text-xs text-white/60 leading-relaxed">
          Tell us your skills and goals — we'll show you high-paying, low-competition careers that match your profile. Not the obvious ones. The <span className="text-pink-400 font-bold">real opportunities</span>.
        </p>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
          Your Skills <span className="text-stone-300 font-normal">(add as many as you have)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            placeholder="e.g. Excel, Python, Project Management…"
            className="flex-1 text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-pink-400"
          />
          <button onClick={addSkill} className="flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2.5 rounded-sm"
            style={{ backgroundColor: ACCENT }}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {skills.map(s => (
              <span key={s} className="flex items-center gap-1.5 text-xs font-bold text-white px-2.5 py-1.5 rounded-sm"
                style={{ backgroundColor: ACCENT }}>
                {s}
                <button onClick={() => removeSkill(s)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 9).map(s => (
            <button key={s} onClick={() => { if (!skills.includes(s)) setSkills(p => [...p, s]); }}
              className="text-xs text-stone-500 bg-stone-50 border border-stone-200 hover:border-pink-400 hover:text-pink-600 px-2.5 py-1 rounded-sm transition-colors">
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Education */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Education</label>
        <input value={education} onChange={e => setEducation(e.target.value)}
          placeholder="e.g. BSc Computer Science, HND Business, A-Levels, Self-taught…"
          className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-pink-400"
        />
      </div>

      {/* Experience level */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Experience Level</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {EXP_LEVELS.map(l => (
            <button key={l.id} onClick={() => setExpLevel(l.id)}
              className={`flex flex-col items-center py-3 px-2 rounded-sm border text-center transition-all ${
                expLevel === l.id ? "border-transparent text-white" : "bg-white border-stone-200 hover:border-stone-400"
              }`}
              style={expLevel === l.id ? { backgroundColor: ACCENT } : {}}>
              <span className={`text-xs font-bold ${expLevel === l.id ? "text-white" : "text-stone-700"}`}>{l.label}</span>
              <span className={`text-[10px] mt-0.5 ${expLevel === l.id ? "text-white/70" : "text-stone-400"}`}>{l.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Career Goals</label>
        <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3}
          placeholder="What matters most? High salary? Remote work? Fast entry? Career switching? Job security? Tell us honestly…"
          className="w-full text-sm border border-stone-200 rounded-sm px-3 py-3 focus:outline-none focus:border-pink-400 resize-none"
        />
      </div>

      {/* Optional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
            Current Role <span className="text-stone-300 font-normal">optional</span>
          </label>
          <input value={currentRole} onChange={e => setCurrentRole(e.target.value)}
            placeholder="e.g. Marketing Assistant, Student, Admin…"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-pink-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
            Salary Target <span className="text-stone-300 font-normal">optional</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">£</span>
            <input type="number" value={salaryTarget} onChange={e => setSalaryTarget(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 50000"
              className="w-full text-sm border border-stone-200 rounded-sm pl-7 pr-3 py-2.5 focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>
      </div>

      <button onClick={handleGenerate}
        disabled={!skills.length && !education.trim() && !goals.trim()}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white py-4 rounded-sm transition-colors shadow-sm disabled:opacity-40"
        style={{ backgroundColor: ACCENT }}>
        <Sparkles className="w-5 h-5" />Find My Hidden Careers
      </button>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (stage === "loading") return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">💎</div>
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="text-sm font-semibold text-stone-600">{LOAD_STEPS[loadStep]}</motion.p>
        </AnimatePresence>
        <p className="text-xs text-stone-400 mt-1">Finding the careers others miss…</p>
      </div>
      <div className="flex gap-1.5">
        {LOAD_STEPS.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-pink-400" : "bg-stone-200"}`} />
        ))}
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (!result) return null;

  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>
      {/* Results header */}
      <div className="bg-stone-900 text-white rounded-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Your Career Advantage</p>
            <p className="text-2xl font-black">{result.careers?.length ?? 0} Hidden Careers Found</p>
            {result.fastestIncomeCareer && (
              <p className="text-xs text-pink-300 mt-1">
                ⚡ Fastest to income: <span className="font-bold">{result.fastestIncomeCareer}</span>
              </p>
            )}
          </div>
          <button onClick={() => { setStage("input"); setResult(null); setCompareList([]); }}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
            <RefreshCw className="w-3 h-3" />New Search
          </button>
        </div>
        <p className="text-sm text-white/75 leading-relaxed mb-4">{result.summary}</p>
        {result.profileStrengths?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {result.profileStrengths.map(s => (
              <span key={s} className="text-[10px] font-bold text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-1 rounded-sm">✓ {s}</span>
            ))}
          </div>
        )}
        {result.skillGapOverview && (
          <div className="mt-3 bg-white/5 border border-white/10 rounded-sm px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-0.5">Skill Gap Overview</p>
            <p className="text-xs text-white/65 leading-relaxed">{result.skillGapOverview}</p>
          </div>
        )}
      </div>

      {/* Compare bar */}
      {compareList.length >= 2 && (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-sm px-4 py-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-purple-800">Compare: {compareList.join(" vs ")}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCompare(true)}
              className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-sm transition-colors">
              Compare Now
            </button>
            <button onClick={() => setCompareList([])} className="text-xs text-purple-400 hover:text-purple-700"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {compareList.length === 1 && (
        <div className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-sm px-4 py-3">
          <Scale className="w-3.5 h-3.5 inline mr-1.5" />Select 1–2 more careers to compare them side-by-side.
        </div>
      )}

      {/* Comparison panel */}
      {showCompare && compareList.length >= 2 && (
        <ComparisonPanel
          careers={compareList}
          userSkills={userSkills}
          onClose={() => setShowCompare(false)}
          onInsufficientTokens={onInsufficientTokens}
        />
      )}

      {/* Career cards */}
      <div className="space-y-4">
        {result.careers?.map((career, i) => (
          <CareerCard
            key={career.id ?? i}
            career={career}
            index={i}
            isSignedIn={isSignedIn}
            userSkills={userSkills}
            queryId={queryId}
            onSave={handleSaveCareer}
            onSelectCompare={toggleCompare}
            isInCompare={compareList.includes(career.title)}
            onInsufficientTokens={onInsufficientTokens}
          />
        ))}
      </div>

      {result.careers?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-stone-50 border border-dashed border-stone-200 rounded-sm">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm font-bold text-stone-700 mb-1">No careers found</p>
          <p className="text-xs text-stone-400">Try adding more skills or broadening your goals.</p>
          <button onClick={() => { setStage("input"); setResult(null); }}
            className="mt-4 text-xs font-bold text-white px-4 py-2.5 rounded-sm" style={{ backgroundColor: ACCENT }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}