"use client";

// =============================================================================
// isaacpaha.com — First Home Planner
// app/tools/first-home-planner/_components/home-planner-tool.tsx
//
// Full flow:
//   Stage 1 — Input (finances, property goal, timeframe, preferences)
//   Stage 2 — Loading (animated steps)
//   Stage 3 — Results (5 tabs: Snapshot | Deposit Plan | Roadmap | Credit | Coach)
//
// Standalone tool — no DB required. Signed-in users get a Save button.
// =============================================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence }                         from "framer-motion";
import {
  Home, Sparkles, Loader2, AlertCircle, Check, Copy, ChevronDown,
  ChevronUp, RefreshCw, Download, TrendingUp, Target, Calendar,
  Flame, AlertTriangle, MessageSquare, Send, X, Info,
  DollarSign, ArrowRight, BarChart2, Lightbulb, Shield, Award,
  CheckCircle2, Lock, Zap, BookOpen, PiggyBank, CreditCard,
  MapPin, Clock, Star, ChevronRight, Plus, Minus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PropertyType   = "flat" | "house" | "shared_ownership" | "new_build" | "bungalow";
type CreditScore    = "excellent" | "good" | "fair" | "poor" | "unknown";

interface PlanInput {
  monthlyIncome:    number | "";
  currentSavings:   number | "";
  monthlyExpenses:  number | "";
  existingDebt:     number | "";
  targetPrice:      number | "";
  depositPercent:   5 | 10 | 20;
  timeframeMonths:  number;
  propertyType:     PropertyType;
  location:         string;
  currency:         "GBP" | "USD" | "EUR";
  creditScore:      CreditScore;
  isFirstTimeBuyer: boolean;
}

interface ReadinessSnapshot {
  overallReadinessScore:     number;
  depositReadinessScore:     number;
  incomeReadinessScore:      number;
  creditReadinessScore:      number;
  affordabilityReadinessScore: number;
  readinessLevel:            "Not Ready Yet" | "Getting There" | "Nearly Ready" | "Ready";
  realisticTimelineMonths:   number;
  realisticTargetDate:       string;
  isGoalTimelineRealistic:   boolean;
  timelineGapMonths:         number;
  keyBlocker:                string;
  biggestStrength:           string;
  estimatedMortgagePayment:  number;
  estimatedMortgageSize:     number;
  affordabilityVerdict:      string;
}

interface DepositMilestone { milestone: string; amount: number; estimatedMonth: number }

interface DepositPlan {
  depositRequired:        number;
  alreadySaved:           number;
  savingsGap:             number;
  requiredMonthlySaving:  number;
  realisticMonthlySaving: number;
  surplusAfterSaving:     number;
  projectedDepositDate:   string;
  depositMilestones:      DepositMilestone[];
  savingsTips:            string[];
}

interface RoadmapTask   { task: string; why: string; effort: string }
interface RoadmapPhase  { phase: number; title: string; duration: string; focus: string; tasks: RoadmapTask[]; milestone: string }
interface CreditAction  { action: string; impact: "High" | "Medium" | "Low"; timeToSeeEffect: string; howTo: string }
interface MonthlyAction { action: string; category: string; effort: string }
interface UKScheme      { scheme: string; benefit: string; eligibility: string; potentialValue: string; relevanceScore: number; url?: string }
interface Scenario      { scenario: string; change: string; impact: string; newTimelineMonths: number; type: "Positive" | "Tradeoff" }
interface AIInsight     { insight: string; type: "Encouragement" | "Warning" | "Opportunity" | "Reality Check"; actionable: string }

interface HomePlan {
  readinessSnapshot:      ReadinessSnapshot;
  depositPlan:            DepositPlan;
  mortgageReadinessRoadmap: { phases: RoadmapPhase[] };
  creditBuildingPlan:     { currentAssessment: string; targetCreditScore: string; actions: CreditAction[]; thingsToAvoid: string[] };
  monthlyActionPlan:      { thisMonth: MonthlyAction[]; habitStack: string[] };
  ukSchemes:              UKScheme[];
  scenarioSimulations:    Scenario[];
  aiInsights:             AIInsight[];
  disclaimerNote:         string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const READINESS_CFG = {
  "Not Ready Yet": { color: "#ef4444", bg: "#fee2e2", border: "#fca5a5", emoji: "🔴" },
  "Getting There":  { color: "#f97316", bg: "#ffedd5", border: "#fdba74", emoji: "🟠" },
  "Nearly Ready":   { color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d", emoji: "🟡" },
  "Ready":          { color: "#10b981", bg: "#d1fae5", border: "#6ee7b7", emoji: "🟢" },
};

const IMPACT_COLOR = { High: "#10b981", Medium: "#f59e0b", Low: "#9ca3af" };
const INSIGHT_CFG = {
  Encouragement: { color: "#10b981", bg: "#d1fae5", emoji: "💪" },
  Warning:        { color: "#ef4444", bg: "#fee2e2", emoji: "⚠️" },
  Opportunity:    { color: "#6366f1", bg: "#ede9fe", emoji: "💡" },
  "Reality Check":{ color: "#f59e0b", bg: "#fef3c7", emoji: "🎯" },
};
const CATEGORY_COLOR: Record<string, string> = {
  Savings: "#10b981", Credit: "#6366f1", Expenses: "#f97316",
  Research: "#3b82f6", Legal: "#8b5cf6",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const uid  = () => Math.random().toString(36).slice(2);
const fmtK = (n: number, sym = "£") => n >= 1000 ? `${sym}${(n/1000).toFixed(0)}k` : `${sym}${n.toLocaleString()}`;
const fmtMo = (n: number) => n < 12 ? `${n}mo` : `${Math.floor(n/12)}yr ${n%12 > 0 ? `${n%12}mo` : ""}`.trim();

function ScoreRing({ score, label, color, size = "md" }: { score: number; label: string; color: string; size?: "sm" | "md" | "lg" }) {
  const r    = size === "lg" ? 40 : size === "md" ? 28 : 20;
  const circ = 2 * Math.PI * r;
  const dim  = size === "lg" ? 96 : size === "md" ? 72 : 52;
  const fs   = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-sm";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg viewBox={`0 0 ${dim} ${dim}`} className="rotate-[-90deg]" width={dim} height={dim}>
          <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size==="lg"?6:5} />
          <motion.circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke={color} strokeWidth={size==="lg"?6:5}
            strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${(score/100)*circ} ${circ}` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-black ${fs}`} style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold text-stone-500 text-center leading-tight max-w-[72px]">{label}</span>
    </div>
  );
}

function AnimBar({ pct, color, h = "h-2" }: { pct: number; color: string; h?: string }) {
  return (
    <div className={`${h} bg-stone-100 rounded-full overflow-hidden`}>
      <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
        initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }}
        transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }} />
    </div>
  );
}

function Collapsible({ title, icon: Icon, iconColor, defaultOpen = false, children }: {
  title: string; icon: React.ElementType; iconColor: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-stone-100 rounded-sm overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-stone-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />
          <span className="text-sm font-bold text-stone-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden border-t border-stone-100">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Input Stage ──────────────────────────────────────────────────────────────

function InputStage({ onPlan }: { onPlan: (d: PlanInput) => void }) {
  const [form, setForm] = useState<PlanInput>({
    monthlyIncome: "", currentSavings: "", monthlyExpenses: "", existingDebt: 0,
    targetPrice: "", depositPercent: 10, timeframeMonths: 36,
    propertyType: "flat", location: "", currency: "GBP",
    creditScore: "unknown", isFirstTimeBuyer: true,
  });
  const [tab, setTab] = useState<"finances" | "goal" | "preferences">("finances");
  const set = (k: keyof PlanInput, v: any) => setForm(p => ({ ...p, [k]: v }));

  const sym  = form.currency === "GBP" ? "£" : form.currency === "USD" ? "$" : "€";
  const ok   = form.monthlyIncome !== "" && form.targetPrice !== "";
  const dep  = form.targetPrice !== "" ? Math.round((form.targetPrice as number) * (form.depositPercent / 100)) : 0;
  const gap  = form.currentSavings !== "" ? Math.max(0, dep - (form.currentSavings as number)) : dep;
  const surplus = form.monthlyIncome !== "" && form.monthlyExpenses !== ""
    ? (form.monthlyIncome as number) - (form.monthlyExpenses as number) - ((form.existingDebt as number) || 0)
    : null;

  return (
    <div className="space-y-5">
      {/* Quick preview bar */}
      {ok && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Deposit needed", value: fmtK(dep, sym), color: "#6366f1" },
            { label: "Savings gap",    value: fmtK(gap, sym), color: gap === 0 ? "#10b981" : "#f59e0b" },
            { label: "Monthly surplus",value: surplus !== null ? (surplus > 0 ? fmtK(surplus, sym) : "⚠️ None") : "—", color: surplus && surplus > 0 ? "#10b981" : "#ef4444" },
          ].map(s => (
            <div key={s.label} className="border border-stone-100 rounded-sm p-3 text-center">
              <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border border-stone-200 rounded-sm overflow-hidden">
        <div className="flex border-b border-stone-200">
          {([
            { id: "finances",    label: "💰 My Finances",   required: true  },
            { id: "goal",        label: "🏡 Property Goal", required: true  },
            { id: "preferences", label: "⚙️ Preferences",  required: false },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 px-3 py-3 text-xs font-bold transition-colors text-center ${
                tab === t.id ? "bg-stone-50 text-stone-900 border-b-2 border-indigo-500" : "bg-white text-stone-400 hover:text-stone-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === "finances" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
                    Monthly take-home income <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">{sym}</span>
                    <input type="number" value={form.monthlyIncome} onChange={e => set("monthlyIncome", e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="3000"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Current savings</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">{sym}</span>
                    <input type="number" value={form.currentSavings} onChange={e => set("currentSavings", e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="5000"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Monthly expenses</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">{sym}</span>
                    <input type="number" value={form.monthlyExpenses} onChange={e => set("monthlyExpenses", e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="1800"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">Bills, food, transport, subscriptions — everything</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Monthly debt repayments</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">{sym}</span>
                    <input type="number" value={form.existingDebt || ""} onChange={e => set("existingDebt", e.target.value === "" ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">Loans, credit cards, car finance, student loan</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Credit score (rough estimate)</label>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { v: "excellent", l: "Excellent", c: "#10b981" },
                    { v: "good",      l: "Good",      c: "#3b82f6" },
                    { v: "fair",      l: "Fair",      c: "#f59e0b" },
                    { v: "poor",      l: "Poor",      c: "#ef4444" },
                    { v: "unknown",   l: "Not sure",  c: "#9ca3af" },
                  ] as const).map(c => (
                    <button key={c.v} onClick={() => set("creditScore", c.v)}
                      className={`text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
                        form.creditScore === c.v
                          ? "text-white border-transparent"
                          : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                      }`}
                      style={form.creditScore === c.v ? { backgroundColor: c.c, borderColor: c.c } : {}}>
                      {c.l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "goal" && (
            <>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
                  Target property price <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">{sym}</span>
                  <input type="number" value={form.targetPrice} onChange={e => set("targetPrice", e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="250000"
                    className="w-full pl-7 pr-3 py-2.5 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Deposit target</label>
                <div className="flex gap-2">
                  {([5, 10, 20] as const).map(p => (
                    <button key={p} onClick={() => set("depositPercent", p)}
                      className={`flex-1 py-3 text-sm font-bold rounded-sm border transition-colors ${
                        form.depositPercent === p
                          ? "bg-indigo-500 text-white border-indigo-500"
                          : "bg-white text-stone-500 border-stone-200 hover:border-indigo-300"
                      }`}>
                      {p}%
                      {form.targetPrice !== "" && (
                        <div className={`text-[10px] font-semibold mt-0.5 ${form.depositPercent === p ? "text-indigo-200" : "text-stone-400"}`}>
                          {fmtK(Math.round((form.targetPrice as number) * p / 100), sym)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-stone-400 mt-1.5">5% is the minimum for most mortgages. 10-20% gives better rates.</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">I want to buy in</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { m: 12,  l: "1 year"    },
                    { m: 24,  l: "2 years"   },
                    { m: 36,  l: "3 years"   },
                    { m: 60,  l: "5 years"   },
                    { m: 84,  l: "7 years"   },
                    { m: 120, l: "10 years"  },
                  ].map(t => (
                    <button key={t.m} onClick={() => set("timeframeMonths", t.m)}
                      className={`text-xs font-bold px-4 py-2 rounded-sm border transition-colors ${
                        form.timeframeMonths === t.m
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                      }`}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Property type</label>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { v: "flat",             l: "🏢 Flat"           },
                    { v: "house",            l: "🏡 House"          },
                    { v: "shared_ownership", l: "🤝 Shared Ownership"},
                    { v: "new_build",        l: "🏗️ New Build"     },
                  ] as const).map(p => (
                    <button key={p.v} onClick={() => set("propertyType", p.v)}
                      className={`text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
                        form.propertyType === p.v
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                      }`}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Location (optional)</label>
                <input value={form.location} onChange={e => set("location", e.target.value)}
                  placeholder="e.g. Manchester, London, Leeds…"
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </>
          )}

          {tab === "preferences" && (
            <>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Currency</label>
                <div className="flex gap-2">
                  {(["GBP", "USD", "EUR"] as const).map(c => (
                    <button key={c} onClick={() => set("currency", c)}
                      className={`flex-1 py-2 text-xs font-bold rounded-sm border transition-colors ${
                        form.currency === c ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-stone-200 text-stone-500"
                      }`}>
                      {c === "GBP" ? "£ GBP" : c === "USD" ? "$ USD" : "€ EUR"}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => set("isFirstTimeBuyer", !form.isFirstTimeBuyer)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-sm border text-sm font-semibold transition-colors ${
                  form.isFirstTimeBuyer ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-stone-200 text-stone-500"
                }`}>
                <span>I am a first-time buyer</span>
                <div className={`relative w-10 h-5 rounded-full transition-colors ${form.isFirstTimeBuyer ? "bg-indigo-500" : "bg-stone-200"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFirstTimeBuyer ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </button>
              <p className="text-[11px] text-stone-400 -mt-2">First-time buyers have access to additional schemes and stamp duty relief.</p>
            </>
          )}
        </div>
      </div>

      {/* Plan button */}
      <button onClick={() => ok && onPlan(form)} disabled={!ok}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-sm transition-colors shadow-sm">
        <Home className="w-5 h-5" />Plan My First Home Journey
      </button>

      {!ok && <p className="text-xs text-center text-stone-400">Enter your income and target property price to get started</p>}

      {/* Preview features */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          { icon: PiggyBank, label: "Deposit Plan",       color: "#6366f1" },
          { icon: Target,    label: "Readiness Score",    color: "#f59e0b" },
          { icon: Calendar,  label: "Timeline to Ready",  color: "#10b981" },
          { icon: Shield,    label: "Credit Roadmap",     color: "#3b82f6" },
          { icon: Star,      label: "UK Buyer Schemes",   color: "#ec4899" },
          { icon: MessageSquare,label: "AI Home Coach",  color: "#f97316" },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-sm">
            <f.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: f.color }} />
            <span className="text-[11px] font-semibold text-stone-600">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Home Coach ────────────────────────────────────────────────────────────

function HomeCoach({ planContext }: { planContext: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "👋 Hi! I'm your AI Home Coach. I know your plan, so ask me anything — whether it's 'How does stamp duty work?', 'Should I get a Lifetime ISA?', or 'Can I afford this house?'. I'm here to help." },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const QUICK_QUESTIONS = [
    "What is a mortgage in principle?",
    "How does a Lifetime ISA work?",
    "What's shared ownership?",
    "How long does buying take?",
    "What is stamp duty?",
  ];

  const send = async (msg: string) => {
    if (!msg.trim() || loading) return;
    const newMessages = [...messages, { role: "user" as const, content: msg }];
    setMessages(newMessages); setInput(""); setLoading(true);
    try {
      const res  = await fetch("/api/tools/home-planner/coach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, planContext, conversationHistory: newMessages.slice(-8) }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: "assistant", content: data.reply ?? data.error ?? "Sorry, I couldn't respond. Please try again." }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Network error — please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Quick questions */}
      <div>
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Common questions</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => send(q)}
              className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-2.5 py-1.5 rounded-sm transition-colors">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="border border-stone-100 rounded-sm overflow-hidden">
        <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-100">
          <p className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />AI Home Coach
          </p>
        </div>
        <div className="h-72 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                m.role === "assistant" ? "bg-indigo-100 text-indigo-700" : "bg-stone-100 text-stone-600"
              }`}>
                {m.role === "assistant" ? "🏡" : "Me"}
              </div>
              <div className={`max-w-[80%] rounded-sm px-3 py-2.5 text-sm leading-relaxed ${
                m.role === "assistant" ? "bg-stone-50 border border-stone-100 text-stone-700" : "bg-indigo-600 text-white"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs">🏡</div>
              <div className="bg-stone-50 border border-stone-100 rounded-sm px-3 py-2.5 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs text-stone-500">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-stone-100 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
            placeholder="Ask anything about buying your first home…"
            className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-indigo-400"
          />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-sm flex items-center justify-center transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-sm px-3 py-2.5">
        <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-relaxed">
          Home Coach provides educational guidance only — not regulated financial advice. For mortgage recommendations, speak to an independent mortgage adviser (IMA) regulated by the FCA.
        </p>
      </div>
    </div>
  );
}

// ─── Results Stage ────────────────────────────────────────────────────────────

function ResultsStage({
  plan, input, onReset, isSignedIn,
}: {
  plan:        HomePlan;
  input:       PlanInput;
  onReset:     () => void;
  isSignedIn:  boolean;
}) {
  const [tab,     setTab]     = useState<"snapshot" | "deposit" | "roadmap" | "credit" | "coach">("snapshot");
  const [copied,  setCopied]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const sym  = input.currency === "GBP" ? "£" : input.currency === "USD" ? "$" : "€";
  const snap = plan.readinessSnapshot;
  const dep  = plan.depositPlan;
  const rdy  = READINESS_CFG[snap.readinessLevel] ?? READINESS_CFG["Getting There"];

  const planContext = JSON.stringify({
    income: input.monthlyIncome, savings: input.currentSavings, targetPrice: input.targetPrice,
    depositPercent: input.depositPercent, timeframeMonths: input.timeframeMonths,
    readinessScore: snap.overallReadinessScore, readinessLevel: snap.readinessLevel,
    realisticTargetDate: snap.realisticTargetDate, keyBlocker: snap.keyBlocker,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/tools/home-planner/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, plan }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch {}
    setSaving(false);
  };

  const copySnapshot = () => {
    const t = [
      "First Home Planner Results",
      `Readiness: ${snap.readinessLevel} (${snap.overallReadinessScore}/100)`,
      `Target: ${sym}${(input.targetPrice as number).toLocaleString()} | Deposit: ${sym}${dep.depositRequired.toLocaleString()}`,
      `Save: ${sym}${dep.realisticMonthlySaving}/month`,
      `Ready by: ${snap.realisticTargetDate}`,
      `Key action: ${snap.keyBlocker}`,
    ].join("\n");
    navigator.clipboard.writeText(t);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const TABS = [
    { id: "snapshot", label: "Snapshot",    icon: BarChart2   },
    { id: "deposit",  label: "Deposit Plan", icon: PiggyBank  },
    { id: "roadmap",  label: "Roadmap",      icon: Target      },
    { id: "credit",   label: "Credit",       icon: CreditCard  },
    { id: "coach",    label: "Home Coach",   icon: MessageSquare },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Hero result card */}
      <div className="bg-stone-900 text-white rounded-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Readiness Score</p>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-black" style={{ color: rdy.color }}>{snap.overallReadinessScore}</span>
              <div className="mb-2">
                <span className="text-white/30 text-xl">/100</span>
                <p className="text-sm font-black mt-0.5" style={{ color: rdy.color }}>
                  {rdy.emoji} {snap.readinessLevel}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={copySnapshot}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
            {isSignedIn && (
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                  saved ? "text-emerald-400 border-emerald-400/40" : "text-white/70 hover:text-white border-white/20 hover:border-white/40"
                }`}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <PiggyBank className="w-3.5 h-3.5" />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save Plan"}
              </button>
            )}
            <button onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              <RefreshCw className="w-3.5 h-3.5" />New Plan
            </button>
          </div>
        </div>

        {/* 5 score rings */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <ScoreRing score={snap.depositReadinessScore}      label="Deposit"       color="#6366f1" />
          <ScoreRing score={snap.incomeReadinessScore}       label="Income"        color="#f59e0b" />
          <ScoreRing score={snap.creditReadinessScore}       label="Credit"        color="#10b981" />
          <ScoreRing score={snap.affordabilityReadinessScore}label="Affordability" color="#3b82f6" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-[72px] h-[72px] rounded-sm flex items-center justify-center" style={{ backgroundColor: `${rdy.color}15`, border: `2px solid ${rdy.color}30` }}>
              <div className="text-center">
                <p className="text-sm font-black" style={{ color: rdy.color }}>{snap.realisticTargetDate.split(" ")[1] || ""}</p>
                <p className="text-xs text-white/60">{snap.realisticTargetDate.split(" ")[0] || snap.realisticTargetDate}</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-white/50 text-center">Target Date</span>
          </div>
        </div>
      </div>

      {/* Key summary bar */}
      <div className={`border rounded-sm p-4 ${snap.isGoalTimelineRealistic ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{snap.isGoalTimelineRealistic ? "✅" : "⏰"}</span>
          <div className="flex-1">
            <p className="text-sm font-black text-stone-900">
              {snap.isGoalTimelineRealistic
                ? `On track! Your ${fmtMo(input.timeframeMonths)} goal looks achievable.`
                : `Your goal is ${Math.abs(snap.timelineGapMonths)} months ${snap.timelineGapMonths > 0 ? "behind" : "ahead of"} the realistic timeline.`
              }
            </p>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              <span className="font-semibold">Biggest strength:</span> {snap.biggestStrength}
            </p>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              <span className="font-semibold">Key blocker:</span> {snap.keyBlocker}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-stone-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              tab === t.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── SNAPSHOT tab ──────────────────────────────────────────────── */}
      {tab === "snapshot" && (
        <div className="space-y-4">
          {/* Key numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Monthly save target", value: `${sym}${dep.realisticMonthlySaving.toLocaleString()}`,   color: "#6366f1" },
              { label: "Mortgage estimate",   value: `${sym}${snap.estimatedMortgagePayment.toLocaleString()}/mo`, color: "#f59e0b" },
              { label: "Ready by",            value: snap.realisticTargetDate,                                  color: "#10b981" },
              { label: "Affordability",       value: snap.affordabilityVerdict,                                 color: snap.affordabilityVerdict === "Comfortably affordable" ? "#10b981" : snap.affordabilityVerdict === "Very difficult" ? "#ef4444" : "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
                <p className="text-lg font-black leading-tight" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-stone-400 font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Score breakdown */}
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Readiness Breakdown</p>
            <div className="space-y-3">
              {[
                { label: "Deposit readiness",      score: snap.depositReadinessScore,      color: "#6366f1" },
                { label: "Income readiness",       score: snap.incomeReadinessScore,       color: "#f59e0b" },
                { label: "Credit readiness",       score: snap.creditReadinessScore,       color: "#10b981" },
                { label: "Affordability readiness",score: snap.affordabilityReadinessScore,color: "#3b82f6" },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-stone-600">{s.label}</span>
                    <span className="text-xs font-black" style={{ color: s.color }}>{s.score}/100</span>
                  </div>
                  <AnimBar pct={s.score} color={s.color} />
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          {plan.aiInsights?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider">AI Insights</p>
              {plan.aiInsights.map((ins, i) => {
                const cfg = INSIGHT_CFG[ins.type] ?? INSIGHT_CFG["Reality Check"];
                return (
                  <div key={i} className="border rounded-sm p-4" style={{ borderColor: `${cfg.color}40`, backgroundColor: cfg.bg }}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: cfg.color }}>{ins.type}</p>
                        <p className="text-sm text-stone-700 leading-relaxed">{ins.insight}</p>
                        <p className="text-xs text-stone-500 mt-2 flex items-start gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                          {ins.actionable}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* UK Schemes */}
          {plan.ukSchemes?.filter(s => s.relevanceScore >= 50).length > 0 && (
            <Collapsible title="UK First-Time Buyer Schemes" icon={Star} iconColor="#f59e0b" defaultOpen>
              <div className="px-5 py-4 space-y-3">
                {plan.ukSchemes.filter(s => s.relevanceScore >= 50).map((s, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-100 rounded-sm p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-bold text-stone-800">{s.scheme}</p>
                      <span className="text-xs font-black text-emerald-600 flex-shrink-0">{s.potentialValue}</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed mb-1.5">{s.benefit}</p>
                    <p className="text-[11px] text-stone-400"><span className="font-semibold">Eligibility:</span> {s.eligibility}</p>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 mt-2 hover:underline">
                        Learn more <ChevronRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* Scenarios */}
          {plan.scenarioSimulations?.length > 0 && (
            <Collapsible title="Scenario Simulations" icon={TrendingUp} iconColor="#6366f1">
              <div className="px-5 py-4 space-y-3">
                {plan.scenarioSimulations.map((sc, i) => (
                  <div key={i} className={`border rounded-sm p-4 ${sc.type === "Positive" ? "border-emerald-200 bg-emerald-50" : "border-stone-200 bg-stone-50"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">{sc.type === "Positive" ? "📈" : "⚖️"}</span>
                      <p className="text-sm font-bold text-stone-800">{sc.scenario}</p>
                    </div>
                    <p className="text-xs text-stone-600 mb-1">{sc.change}</p>
                    <p className="text-xs font-bold" style={{ color: sc.type === "Positive" ? "#10b981" : "#f59e0b" }}>
                      → {sc.impact}
                    </p>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* Disclaimer */}
          {plan.disclaimerNote && (
            <div className="flex items-start gap-2 bg-stone-50 border border-stone-200 rounded-sm px-4 py-3">
              <Info className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-stone-500 leading-relaxed">{plan.disclaimerNote}</p>
            </div>
          )}
        </div>
      )}

      {/* ── DEPOSIT PLAN tab ──────────────────────────────────────────── */}
      {tab === "deposit" && (
        <div className="space-y-4">
          {/* Big numbers */}
          <div className="bg-indigo-900 text-white rounded-sm p-6">
            <div className="grid grid-cols-3 gap-6 mb-5">
              {[
                { label: "Deposit needed",   value: `${sym}${dep.depositRequired.toLocaleString()}` },
                { label: "Already saved",    value: `${sym}${dep.alreadySaved.toLocaleString()}` },
                { label: "Remaining gap",    value: `${sym}${dep.savingsGap.toLocaleString()}` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-indigo-300 text-xs font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-300">Progress to deposit</span>
                <span className="text-white font-bold">
                  {dep.depositRequired > 0 ? Math.round((dep.alreadySaved / dep.depositRequired) * 100) : 0}%
                </span>
              </div>
              <AnimBar pct={dep.depositRequired > 0 ? (dep.alreadySaved / dep.depositRequired) * 100 : 0} color="#818cf8" h="h-3" />
            </div>
          </div>

          {/* Monthly target */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">Save this month</p>
              <p className="text-3xl font-black text-indigo-600">{sym}{dep.realisticMonthlySaving.toLocaleString()}</p>
              <p className="text-xs text-stone-500 mt-1">Realistic at your current surplus</p>
            </div>
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">Deposit ready by</p>
              <p className="text-xl font-black text-emerald-600">{dep.projectedDepositDate}</p>
              <p className="text-xs text-stone-500 mt-1">At {sym}{dep.realisticMonthlySaving.toLocaleString()}/month</p>
            </div>
          </div>

          {/* Milestones */}
          {dep.depositMilestones?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Deposit Milestones</p>
              <div className="space-y-3">
                {dep.depositMilestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-black text-indigo-700">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-stone-700">{m.milestone}</p>
                        <p className="text-xs font-bold text-indigo-600 flex-shrink-0 ml-2">{sym}{m.amount.toLocaleString()}</p>
                      </div>
                      <AnimBar pct={dep.depositRequired > 0 ? (m.amount / dep.depositRequired) * 100 : 0} color="#6366f1" h="h-1.5" />
                      <p className="text-[10px] text-stone-400 mt-0.5">~{fmtMo(m.estimatedMonth)} from now</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Savings tips */}
          {dep.savingsTips?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Savings Tips for You</p>
              <div className="space-y-2">
                {dep.savingsTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5 flex-shrink-0">💡</span>
                    <p className="text-xs text-stone-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ROADMAP tab ────────────────────────────────────────────────── */}
      {tab === "roadmap" && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-sm px-4 py-3.5 flex items-start gap-3">
            <Target className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Your mortgage readiness roadmap — broken into 4 phases. Complete each phase in order to build a strong application. Estimated total: <span className="font-bold">{fmtMo(snap.realisticTimelineMonths)}</span> to being ready to buy.
            </p>
          </div>

          {/* Monthly actions first */}
          {plan.monthlyActionPlan?.thisMonth?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">🗓️ This Month's Actions</p>
              <div className="space-y-2">
                {plan.monthlyActionPlan.thisMonth.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 bg-stone-50 border border-stone-100 rounded-sm px-3 py-2.5">
                    <div className="w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${CATEGORY_COLOR[a.category] ?? "#6366f1"}15` }}>
                      <span className="text-[10px] font-black" style={{ color: CATEGORY_COLOR[a.category] ?? "#6366f1" }}>
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-700">{a.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"
                          style={{ color: CATEGORY_COLOR[a.category] ?? "#6366f1", backgroundColor: `${CATEGORY_COLOR[a.category] ?? "#6366f1"}15` }}>
                          {a.category}
                        </span>
                        <span className="text-[10px] text-stone-400">{a.effort}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phases */}
          {plan.mortgageReadinessRoadmap?.phases?.map((phase) => (
            <div key={phase.phase} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
              <div className="flex items-start gap-4 p-5 border-b border-stone-50">
                <div className="w-10 h-10 rounded-sm bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-black text-indigo-700">P{phase.phase}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-black text-stone-900">{phase.title}</p>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm">{phase.duration}</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{phase.focus}</p>
                </div>
              </div>
              <div className="px-5 py-4 space-y-2">
                {phase.tasks.map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-stone-700">{t.task}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">{t.why}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-indigo-700">{phase.milestone}</p>
              </div>
            </div>
          ))}

          {/* Habits */}
          {plan.monthlyActionPlan?.habitStack?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Daily & Weekly Habits</p>
              <div className="space-y-2">
                {plan.monthlyActionPlan.habitStack.map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Flame className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-stone-600 leading-relaxed">{h}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREDIT tab ─────────────────────────────────────────────────── */}
      {tab === "credit" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">Credit Assessment</p>
            <p className="text-sm text-stone-700 leading-relaxed">{plan.creditBuildingPlan.currentAssessment}</p>
            <div className="mt-3 flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-sm px-3 py-2.5">
              <Target className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 leading-relaxed">{plan.creditBuildingPlan.targetCreditScore}</p>
            </div>
          </div>

          {/* Credit actions */}
          <div className="space-y-2">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Credit Building Actions</p>
            {plan.creditBuildingPlan.actions?.map((a, i) => (
              <div key={i} className="bg-white border border-stone-100 rounded-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-stone-800">{a.action}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                      style={{ color: IMPACT_COLOR[a.impact], backgroundColor: `${IMPACT_COLOR[a.impact]}15` }}>
                      {a.impact}
                    </span>
                    <span className="text-[10px] text-stone-400">{a.timeToSeeEffect}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-stone-50 border border-stone-100 rounded-sm px-3 py-2">
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-stone-500 leading-snug">{a.howTo}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Things to avoid */}
          {plan.creditBuildingPlan.thingsToAvoid?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-5">
              <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-3">⚠️ Things to Avoid</p>
              <div className="space-y-2">
                {plan.creditBuildingPlan.thingsToAvoid.map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 bg-stone-50 border border-stone-200 rounded-sm px-4 py-3">
            <Info className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Credit score information is educational guidance. Check your actual score on services like Experian, Equifax, or ClearScore (all free). For specific mortgage advice, speak to an FCA-regulated independent mortgage adviser.
            </p>
          </div>
        </div>
      )}

      {/* ── COACH tab ──────────────────────────────────────────────────── */}
      {tab === "coach" && <HomeCoach planContext={planContext} />}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function HomePlannerTool({ isSignedIn = false }: { isSignedIn?: boolean }) {
  const [stage,  setStage]  = useState<"input" | "loading" | "results">("input");
  const [plan,   setPlan]   = useState<HomePlan | null>(null);
  const [input,  setInput]  = useState<PlanInput | null>(null);
  const [error,  setError]  = useState("");
  const [step,   setStep]   = useState(0);

  const STEPS = [
    "Reviewing your finances…",
    "Calculating deposit timeline…",
    "Building your mortgage roadmap…",
    "Checking UK buyer schemes…",
    "Generating your personalised insights…",
    "Preparing your Home Coach…",
  ];

  const handlePlan = async (d: PlanInput) => {
    setInput(d); setStage("loading"); setError(""); setStep(0);
    const interval = setInterval(() => setStep(p => Math.min(p + 1, STEPS.length - 1)), 1500);
    try {
      const res  = await fetch("/api/tools/home-planner/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome:    d.monthlyIncome    || 0,
          currentSavings:   d.currentSavings   || 0,
          monthlyExpenses:  d.monthlyExpenses  || 0,
          existingDebt:     d.existingDebt     || 0,
          targetPrice:      d.targetPrice      || 0,
          depositPercent:   d.depositPercent,
          timeframeMonths:  d.timeframeMonths,
          propertyType:     d.propertyType,
          location:         d.location,
          currency:         d.currency,
          creditScore:      d.creditScore,
          isFirstTimeBuyer: d.isFirstTimeBuyer,
        }),
      });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok || !data.plan) { setError(data.error ?? "Plan generation failed"); setStage("input"); return; }
      setPlan(data.plan);
      setStage("results");
    } catch {
      clearInterval(interval);
      setError("Network error — please try again.");
      setStage("input");
    }
  };

  return (
    <div className="space-y-0" style={{ fontFamily: "Sora, sans-serif" }}>
      {/* Loading */}
      {stage === "loading" && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🏡</div>
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.p key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-sm font-semibold text-stone-600">
                {STEPS[step]}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-stone-400 mt-1">Building your personalised plan…</p>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= step ? "bg-indigo-400" : "bg-stone-200"}`} />
            ))}
          </div>
        </div>
      )}

      {error && stage === "input" && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto text-red-300 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {stage === "input"   && <InputStage onPlan={handlePlan} />}
      {stage === "results" && plan && input && (
        <ResultsStage plan={plan} input={input} isSignedIn={isSignedIn}
          onReset={() => { setStage("input"); setPlan(null); }} />
      )}
    </div>
  );
}