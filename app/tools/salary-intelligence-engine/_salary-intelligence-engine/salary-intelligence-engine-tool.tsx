"use client";

// =============================================================================
// isaacpaha.com — Salary Intelligence Engine — Core Tool
// app/tools/salary-intelligence-engine/_salary-intelligence/salary-intelligence-tool.tsx
// =============================================================================

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence }      from "framer-motion";
import {
  Sparkles, Loader2, AlertCircle, X, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign,
  Target, AlertTriangle, CheckCircle2, ArrowRight, Zap, Clock,
  BarChart2, MapPin, Briefcase, Star, Save, Send, MessageSquare,
  Award, Shield, Scale, Eye, EyeOff, Info, Plus, Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenGateInfo { required: number; balance: number; toolName: string | null; }
export interface SalaryIntelligenceToolProps {
  isSignedIn?:           boolean;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
  reopenCheck?:          any | null;
  onReopened?:           () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#14b8a6";

const VERDICT_CFG: Record<string, {
  label: string; color: string; bg: string; border: string;
  emoji: string; barColor: string;
}> = {
  SIGNIFICANTLY_UNDERPAID: { label: "Significantly Underpaid", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", emoji: "🚨", barColor: "#dc2626" },
  UNDERPAID:               { label: "Underpaid",               color: "#f97316", bg: "#ffedd5", border: "#fdba74", emoji: "⚠️",  barColor: "#f97316" },
  FAIRLY_PAID:             { label: "Fairly Paid",             color: "#14b8a6", bg: "#ccfbf1", border: "#5eead4", emoji: "✅",  barColor: "#14b8a6" },
  WELL_PAID:               { label: "Well Paid",               color: "#10b981", bg: "#d1fae5", border: "#6ee7b7", emoji: "💪",  barColor: "#10b981" },
  EXCEPTIONALLY_PAID:      { label: "Exceptionally Paid",      color: "#8b5cf6", bg: "#ede9fe", border: "#c4b5fd", emoji: "🏆",  barColor: "#8b5cf6" },
};

const MOMENTUM_CFG: Record<string, { label: string; color: string }> = {
  ACCELERATING: { label: "Accelerating",  color: "#10b981" },
  ON_TRACK:     { label: "On Track",      color: "#14b8a6" },
  STALLING:     { label: "Stalling",      color: "#f59e0b" },
  AT_RISK:      { label: "At Risk",       color: "#ef4444" },
};

const CURRENCIES = [
  { code: "GBP", sym: "£", label: "GBP (£)" },
  { code: "USD", sym: "$", label: "USD ($)" },
  { code: "EUR", sym: "€", label: "EUR (€)" },
];

const COMPANY_SIZES = [
  "Startup (<50)", "SME (50–250)", "Mid-size (250–1000)", "Large (1000–5000)", "Enterprise (5000+)",
];
const REMOTE_OPTIONS = [
  "Fully remote", "Hybrid (3 days office)", "Hybrid (2 days remote)", "Mostly office", "Fully in-office",
];
const EDUCATION_OPTIONS = [
  "GCSE / No formal degree", "A-Levels / Diploma", "Bachelor's degree", "Master's degree", "PhD / Doctorate",
  "Professional qualification (ACCA, CFA, etc.)", "Bootcamp / self-taught",
];

const COMMON_BENEFITS = [
  "Pension (5%+)", "Health insurance", "Life insurance", "Stock options / equity",
  "Annual bonus", "Flexible hours", "Remote work", "25+ days holiday",
  "Learning budget", "Gym membership", "Car allowance", "Laptop provided",
];

const SKILL_SUGGESTIONS = [
  "Python", "SQL", "Excel", "Project Management", "Team Leadership",
  "Stakeholder Management", "Machine Learning", "React", "AWS", "Figma",
  "Financial Modelling", "Agile / Scrum", "Salesforce", "Power BI", "Java",
];

// ─── Salary Bar Visualiser ────────────────────────────────────────────────────

function SalaryBar({
  current, floor, median, top, currency,
}: {
  current: number; floor: number; median: number; top: number; currency: string;
}) {
  const sym   = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  const range = top - floor;
  const pct   = (v: number) => Math.max(0, Math.min(100, ((v - floor) / range) * 100));
  const currPct = pct(current);
  const medPct  = pct(median);

  const isUnderpaid = current < median;
  const barColor    = isUnderpaid ? "#ef4444" : ACCENT;

  return (
    <div className="space-y-3">
      <div className="relative h-10 mt-6">
        {/* Track */}
        <div className="absolute inset-y-3 inset-x-0 bg-stone-100 rounded-full" />
        {/* Median marker */}
        <div className="absolute inset-y-0 flex items-center" style={{ left: `${medPct}%` }}>
          <div className="relative">
            <div className="w-0.5 h-10 bg-stone-400" />
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-stone-500 whitespace-nowrap">Market</span>
          </div>
        </div>
        {/* Current salary marker */}
        <motion.div className="absolute inset-y-0 flex items-center" style={{ left: `${currPct}%` }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="relative">
            <div className="w-1 h-10 rounded-full" style={{ backgroundColor: barColor }} />
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-black whitespace-nowrap" style={{ color: barColor }}>You</span>
          </div>
        </motion.div>
        {/* Fill from floor to current */}
        <motion.div className="absolute inset-y-3 rounded-full" style={{ backgroundColor: `${barColor}30`, left: 0, width: `${currPct}%` }}
          initial={{ width: 0 }} animate={{ width: `${currPct}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      {/* Labels */}
      <div className="flex justify-between text-[10px] text-stone-400 font-mono">
        <span>{sym}{(floor / 1000).toFixed(0)}k</span>
        <span className="font-black text-stone-600">{sym}{(median / 1000).toFixed(0)}k median</span>
        <span>{sym}{(top / 1000).toFixed(0)}k</span>
      </div>
    </div>
  );
}

// ─── Action Item ──────────────────────────────────────────────────────────────

function ActionItem({ action, timeframe, impact, detail }: {
  action: string; timeframe: string; impact: string; detail: string;
}) {
  const [open, setOpen] = useState(false);
  const impactColor = impact === "HIGH" ? "#ef4444" : impact === "MEDIUM" ? "#f59e0b" : "#6b7280";
  return (
    <div className="border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: impactColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-stone-800">{action}</p>
          <span className="text-[10px] text-stone-400">{timeframe}</span>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-sm flex-shrink-0"
          style={{ color: impactColor, backgroundColor: `${impactColor}15` }}>{impact}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/50">
              <p className="text-xs text-stone-700 leading-relaxed">{detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 text-xs font-bold border transition-all rounded-sm px-2.5 py-1.5 ${
        copied ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-400 border-stone-200 hover:border-stone-400"
      }`}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Negotiation Script Builder ────────────────────────────────────────────────

function NegotiationBuilder({
  currentSalary, currency, checkId, onInsufficientTokens,
}: {
  currentSalary: number; currency: string; checkId: string | null;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
}) {
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  const [step,          setStep]          = useState<"form" | "loading" | "result">("form");
  const [askingFor,     setAskingFor]     = useState("");
  const [targetSalary,  setTargetSalary]  = useState<number | "">("");
  const [context,       setContext]       = useState("annual_review");
  const [situation,     setSituation]     = useState("");
  const [managerStyle,  setManagerStyle]  = useState("");
  const [companyCtx,    setCompanyCtx]    = useState("");
  const [fears,         setFears]         = useState<string[]>([]);
  const [fearInput,     setFearInput]     = useState("");
  const [result,        setResult]        = useState<any>(null);
  const [activeTab,     setActiveTab]     = useState<"script" | "email" | "objections" | "psychology">("script");
  const [saved,         setSaved]         = useState(false);

  const CONTEXTS = [
    { id: "annual_review",   label: "Annual Review"         },
    { id: "promotion",       label: "Promotion Ask"         },
    { id: "job_offer",       label: "Job Offer Counter"     },
    { id: "market_rate",     label: "Market Rate Adjustment"},
    { id: "new_role",        label: "New Responsibilities"  },
    { id: "competing_offer", label: "Competing Offer"       },
  ];

  const FEAR_SUGGESTIONS = [
    "They'll say no", "They'll think I'm greedy", "I'll damage the relationship",
    "I don't have enough leverage", "They could fire me", "It's not the right time",
  ];

  const addFear = (f: string) => { if (f.trim() && !fears.includes(f)) setFears(p => [...p, f]); setFearInput(""); };

  const generate = async () => {
    if (!askingFor.trim() && !targetSalary) return;
    setStep("loading");
    try {
      const res = await fetch("/api/tools/salary-intelligence/negotiate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ askingFor, currentSalary, targetSalary: Number(targetSalary) || 0, context, situation, managerStyle, companyContext: companyCtx, fears, currency }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Negotiation Script Builder" });
        setStep("form"); return;
      }
      const data = await res.json();
      setResult(data.result);
      setActiveTab("script");
      setStep("result");
    } catch { setStep("form"); }
  };

  const saveScript = async () => {
    const res = await fetch("/api/tools/salary-intelligence/save?type=negotiation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ askingFor, currentSalary, targetSalary: Number(targetSalary) || 0, context, result, salaryCheckId: checkId }),
    });
    const data = await res.json();
    if (data.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  if (step === "form") return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">What are you negotiating?</label>
          <input value={askingFor} onChange={e => setAskingFor(e.target.value)}
            placeholder={`e.g. ${sym}8,000 salary increase`}
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Target salary</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">{sym}</span>
            <input type="number" value={targetSalary} onChange={e => setTargetSalary(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 65000"
              className="w-full text-sm border border-stone-200 rounded-sm pl-7 pr-3 py-2.5 focus:outline-none focus:border-teal-400" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Context</label>
        <div className="grid grid-cols-3 gap-1.5">
          {CONTEXTS.map(c => (
            <button key={c.id} onClick={() => setContext(c.id)}
              className={`text-xs font-bold py-2 px-2 rounded-sm border transition-all text-center ${
                context === c.id ? "text-white border-transparent" : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
              }`}
              style={context === c.id ? { backgroundColor: ACCENT } : {}}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Your situation</label>
        <textarea value={situation} onChange={e => setSituation(e.target.value)} rows={2}
          placeholder="e.g. I've been here 2 years, took on extra projects, performance rating was 'exceeds expectations'…"
          className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400 resize-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Manager style <span className="text-stone-300 font-normal">optional</span></label>
          <input value={managerStyle} onChange={e => setManagerStyle(e.target.value)}
            placeholder="e.g. data-driven, direct, avoids conflict"
            className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Company context <span className="text-stone-300 font-normal">optional</span></label>
          <input value={companyCtx} onChange={e => setCompanyCtx(e.target.value)}
            placeholder="e.g. company is growing, recent funding round"
            className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400" />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Your fears about negotiating</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {fears.map(f => (
            <span key={f} className="flex items-center gap-1.5 text-xs font-bold text-white px-2.5 py-1 rounded-sm"
              style={{ backgroundColor: ACCENT }}>
              {f}<button onClick={() => setFears(p => p.filter(x => x !== f))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mb-1.5">
          <input value={fearInput} onChange={e => setFearInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addFear(fearInput)}
            placeholder="Type a fear and press Enter…"
            className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-teal-400" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FEAR_SUGGESTIONS.filter(f => !fears.includes(f)).map(f => (
            <button key={f} onClick={() => addFear(f)}
              className="text-xs text-stone-500 bg-stone-50 border border-stone-200 hover:border-teal-400 hover:text-teal-600 px-2.5 py-1 rounded-sm transition-colors">
              + {f}
            </button>
          ))}
        </div>
      </div>

      <button onClick={generate} disabled={!askingFor.trim() && !targetSalary}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-sm transition-colors disabled:opacity-40"
        style={{ backgroundColor: ACCENT }}>
        <MessageSquare className="w-4 h-4" />Write My Negotiation Script
      </button>
    </div>
  );

  if (step === "loading") return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-xl">💬</div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-stone-600">Writing your negotiation script…</p>
        <p className="text-xs text-stone-400 mt-1">Including objection handlers and psychology notes</p>
      </div>
    </div>
  );

  if (!result) return null;

  const assess = result.situationAssessment;
  const TABS   = [
    { id: "script",     label: "Scripts",      icon: MessageSquare },
    { id: "email",      label: "Email",        icon: Send          },
    { id: "objections", label: "Objections",   icon: Shield        },
    { id: "psychology", label: "Psychology",   icon: Target        },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Assessment header */}
      <div className="bg-stone-900 text-white rounded-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Negotiation Assessment</p>
            <p className="text-xl font-black">{assess?.confidenceScore ?? 70}/100 Confidence</p>
          </div>
          <div className="flex gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <button onClick={saveScript}
              className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-sm transition-all ${
                saved ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" : "text-white/50 border-white/15 hover:text-white hover:border-white/30"
              }`}>
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Saved" : "Save"}
            </button>
            <button onClick={() => { setStep("form"); setResult(null); }}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-sm">
              <RefreshCw className="w-3 h-3" />Redo
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Strength",  value: assess?.strength ?? "MODERATE" },
            { label: "Risk",      value: assess?.riskLevel ?? "MEDIUM"  },
            { label: "Key lever", value: assess?.keyLeverage?.slice(0, 30) ?? "Experience" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-sm px-3 py-2">
              <p className="text-[10px] text-white/40">{s.label}</p>
              <p className="text-xs font-bold text-white mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
        {result.preparation?.bestTiming && (
          <p className="text-xs text-white/60 mt-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />Best timing: {result.preparation.bestTiming}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-teal-500 text-teal-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Script tab */}
      {activeTab === "script" && (
        <div className="space-y-3">
          {[
            { key: "openingLine",   label: "Opening Line",        bg: "bg-stone-900 text-white" },
            { key: "openingScript", label: "Full Opening",         bg: "bg-white border border-stone-100" },
            { key: "valueStatement",label: "Value Statement",      bg: "bg-white border border-stone-100" },
            { key: "theAsk",        label: "The Ask (say this exactly)", bg: `border-l-4` },
          ].map(s => {
            const text = result.scripts?.[s.key];
            if (!text) return null;
            return (
              <div key={s.key} className={`rounded-sm overflow-hidden ${
                s.key === "theAsk" ? "" : s.key === "openingLine" ? "" : "border border-stone-100"
              }`}
                style={s.key === "theAsk" ? { borderLeft: `4px solid ${ACCENT}`, backgroundColor: `${ACCENT}08` } : {}}>
                <div className={`${s.key === "openingLine" ? "bg-stone-900" : "bg-transparent"} px-4 py-3`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${s.key === "openingLine" ? "text-white/40" : "text-stone-400"}`}>{s.label}</p>
                    <CopyBtn text={text} />
                  </div>
                  <p className={`text-sm font-semibold leading-relaxed whitespace-pre-line ${
                    s.key === "openingLine" ? "text-teal-300 text-base font-black" :
                    s.key === "theAsk" ? "font-black text-stone-900" : "text-stone-800"
                  }`}>
                    {text}
                  </p>
                </div>
              </div>
            );
          })}
          {result.preparation?.doBeforehand?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2">📋 Do Before the Conversation</p>
              {result.preparation.doBeforehand.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-800 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{item}
                </div>
              ))}
            </div>
          )}
          {result.closingMoves && (
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">How to Close</p>
              {[
                { label: "If they say YES", text: result.closingMoves.ifTheyYes, color: "#10b981" },
                { label: "If they say NO",  text: result.closingMoves.ifTheyNo,  color: "#ef4444" },
                { label: "If they say maybe", text: result.closingMoves.ifTheyMaybe, color: "#f59e0b" },
              ].map(s => s.text && (
                <div key={s.label} className="mb-3 last:mb-0">
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-xs text-stone-700 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email tab */}
      {activeTab === "email" && result.scripts?.emailVersion && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Email Version</p>
            <CopyBtn text={result.scripts.emailVersion} />
          </div>
          <div className="bg-stone-950 text-stone-100 rounded-sm p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {result.scripts.emailVersion}
          </div>
          {result.scripts.followUpEmail && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Follow-Up Email</p>
                <CopyBtn text={result.scripts.followUpEmail} />
              </div>
              <div className="bg-stone-950 text-stone-100 rounded-sm p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {result.scripts.followUpEmail}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Objections tab */}
      {activeTab === "objections" && (
        <div className="space-y-3">
          {result.objectionHandlers?.map((o: any, i: number) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50/50 border-b border-red-100/50">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <p className="text-xs font-bold text-red-700">"{o.objection}"</p>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm text-stone-800 leading-relaxed flex-1">{o.response}</p>
                  <CopyBtn text={o.response} />
                </div>
                {o.bodyLanguage && (
                  <p className="text-[10px] text-stone-400 italic mt-2 flex items-center gap-1">
                    <Eye className="w-3 h-3" />{o.bodyLanguage}
                  </p>
                )}
              </div>
            </div>
          ))}
          {result.alternativeAsks?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">If Salary Isn't Possible, Ask For…</p>
              {result.alternativeAsks.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-stone-50 last:border-0">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-stone-800">{a.ask}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">~{a.value} value</p>
                  </div>
                  <CopyBtn text={a.script} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Psychology tab */}
      {activeTab === "psychology" && result.psychologyNotes && (
        <div className="space-y-3">
          {[
            { label: "🤫 The Silence Rule",      value: result.psychologyNotes.silenceRule,       bg: "bg-stone-900 text-white" },
            { label: "⚓ Anchoring Tip",          value: result.psychologyNotes.anchoringTip,      bg: "" },
            { label: "🧘 Stay Calm Under Pressure",value: result.psychologyNotes.emotionManagement, bg: "" },
          ].map(s => s.value && (
            <div key={s.label} className={`rounded-sm px-4 py-4 ${s.label.includes("Silence") ? "bg-stone-900" : "bg-white border border-stone-100"}`}>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-2 ${s.label.includes("Silence") ? "text-white/40" : "text-stone-400"}`}>{s.label}</p>
              <p className={`text-sm leading-relaxed ${s.label.includes("Silence") ? "text-teal-300 font-semibold" : "text-stone-700"}`}>{s.value}</p>
            </div>
          ))}
          {result.psychologyNotes.whatNOTToSay?.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">🚫 Never Say These</p>
              {result.psychologyNotes.whatNOTToSay.map((phrase: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-red-700 mb-1.5">
                  <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="line-through">{phrase}</span>
                </div>
              ))}
            </div>
          )}
          {result.afterTheConversation && (
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">After the Conversation</p>
              {[
                { label: "If you WIN",    value: result.afterTheConversation.winScenario,        color: "#10b981" },
                { label: "Partial win",   value: result.afterTheConversation.partialWinScenario, color: "#f59e0b" },
                { label: "If they say no",value: result.afterTheConversation.lossScenario,       color: "#ef4444" },
              ].map(s => s.value && (
                <div key={s.label} className="mb-3 last:mb-0">
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-xs text-stone-700 leading-relaxed">{s.value}</p>
                </div>
              ))}
              {result.afterTheConversation.documentationAdvice && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">📄 Documentation</p>
                  <p className="text-xs text-stone-600">{result.afterTheConversation.documentationAdvice}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function SalaryIntelligenceTool({ isSignedIn = false, onInsufficientTokens, reopenCheck, onReopened}: SalaryIntelligenceToolProps) {
  const [stage,     setStage]     = useState<"input" | "loading" | "results">("input");
  const [result,    setResult]    = useState<any>(null);
  const [error,     setError]     = useState("");
  const [loadStep,  setLoadStep]  = useState(0);
  const [activeMode,setActiveMode]= useState("full");
  const [checkId,   setCheckId]   = useState<string | null>(null);

  // Input fields
  const [jobTitle,         setJobTitle]         = useState("");
  const [industry,         setIndustry]         = useState("");
  const [location,         setLocation]         = useState("");
  const [yearsExp,         setYearsExp]         = useState<number | "">("");
  const [currentSalary,    setCurrentSalary]    = useState<number | "">("");
  const [currency,         setCurrency]         = useState("GBP");
  const [educationLevel,   setEducationLevel]   = useState("");
  const [companySize,      setCompanySize]      = useState("");
  const [skills,           setSkills]           = useState<string[]>([]);
  const [skillInput,       setSkillInput]       = useState("");
  const [remoteSetup,      setRemoteSetup]      = useState("");
  const [benefits,         setBenefits]         = useState<string[]>([]);
  const [lastRaiseMonths,  setLastRaiseMonths]  = useState<number | "">("");
  const [showSalary,       setShowSalary]       = useState(false);
  const [showAdvanced,     setShowAdvanced]     = useState(false);

  // Results UI
  const [activeTab, setActiveTab] = useState<"verdict" | "market" | "career" | "negotiate" | "actions">("verdict");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  

   // ── Reopen a saved check from dashboard ──────────────────────────────
  useEffect(() => {
    if (!reopenCheck) return;
    
    try {
      // Parse the result JSON from the saved check
      const savedResult = reopenCheck.resultJson ? JSON.parse(reopenCheck.resultJson) : reopenCheck;
      
      setResult(savedResult);
      
      // Populate the input fields from the saved check
      setJobTitle(reopenCheck.jobTitle ?? "");
      setIndustry(reopenCheck.industry ?? "");
      setLocation(reopenCheck.location ?? "");
      setYearsExp(reopenCheck.yearsExperience ?? "");
      setCurrentSalary(reopenCheck.currentSalary ?? "");
      setCurrency(reopenCheck.currency ?? "GBP");
      setEducationLevel(reopenCheck.educationLevel ?? "");
      setCompanySize(reopenCheck.companySize ?? "");
      setSkills(reopenCheck.skills ?? []);
      setRemoteSetup(reopenCheck.remoteSetup ?? "");
      setBenefits(reopenCheck.benefits ?? []);
      setLastRaiseMonths(reopenCheck.lastRaiseMonths ?? "");
      
      // Set the appropriate mode based on the saved data
      if (savedResult.offerVerdict) {
        setActiveMode("job_offer");
      } else if (savedResult.primaryPath) {
        setActiveMode("career_path");
      } else if (savedResult.adjacentRoles) {
        setActiveMode("benchmark");
      } else {
        setActiveMode("full");
      }
      
      // Set the active tab based on mode
      if (activeMode === "career_path") {
        setActiveTab("career");
      } else if (activeMode === "benchmark") {
        setActiveTab("market");
      } else if (activeMode === "job_offer") {
        setActiveTab("negotiate");
      } else {
        setActiveTab("verdict");
      }
      
      setStage("results");
      onReopened?.();
    } catch (err) {
      console.error("Failed to parse saved check:", err);
    }
  }, [reopenCheck]);


  const LOAD_STEPS = [
    "Checking your salary against the market…",
    "Analysing your total compensation…",
    "Calculating your negotiation position…",
    "Building your action plan…",
    "Writing your honest assessment…",
  ];

  const MODES = [
    { id: "full",        label: "Full Report",      emoji: "📊", desc: "Complete salary intelligence" },
    { id: "quick",       label: "Quick Check",      emoji: "⚡", desc: "Instant verdict in seconds"   },
    { id: "benchmark",   label: "Role Benchmark",   emoji: "🔍", desc: "Compare similar roles"        },
    { id: "career_path", label: "Earnings Map",     emoji: "📈", desc: "10-year earnings projection"  },
    { id: "job_offer",   label: "Analyse Offer",    emoji: "📋", desc: "Should I accept this offer?"  },
  ];

  const addSkill = () => { const s = skillInput.trim(); if (s && !skills.includes(s)) setSkills(p => [...p, s]); setSkillInput(""); };
  const removeSkill = (s: string) => setSkills(p => p.filter(x => x !== s));
  const toggleBenefit = (b: string) => setBenefits(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);

  const handleAnalyse = async () => {
    if (!jobTitle.trim() || !currentSalary) return;
    setStage("loading"); setError(""); setLoadStep(0); setResult(null); setCheckId(null);
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 1300);

    try {
      const res = await fetch("/api/tools/salary-intelligence/analyse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle, industry, location, yearsExperience: Number(yearsExp) || 0,
          currentSalary: Number(currentSalary), currency, educationLevel, companySize,
          skills, remoteSetup, benefits, lastRaiseMonths: lastRaiseMonths !== "" ? Number(lastRaiseMonths) : null,
          mode: activeMode,
        }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Salary Intelligence Engine" });
        clearInterval(interval); setStage("input");
        setError("You're out of tokens. Play some games to earn more, then try again."); return;
      }
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.result) { setError(data.error ?? "Analysis failed."); setStage("input"); return; }
      setResult(data.result);
      setActiveTab(activeMode === "career_path" ? "career" : activeMode === "benchmark" ? "market" : "verdict");
      setStage("results");
    } catch { clearInterval(interval); setError("Network error — please try again."); setStage("input"); }
  };

  const handleSave = async () => {
    if (!isSignedIn || !result) return;
    setSaving(true);
    const res  = await fetch("/api/tools/salary-intelligence/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle, industry, location, yearsExperience: Number(yearsExp) || 0,
        currentSalary: Number(currentSalary), currency, educationLevel, companySize,
        skills, remoteSetup, benefits, lastRaiseMonths: lastRaiseMonths !== "" ? Number(lastRaiseMonths) : null,
        result,
      }),
    });
    const data = await res.json();
    if (data.ok) { setSaved(true); setCheckId(data.checkId ?? null); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  // ── INPUT ──────────────────────────────────────────────────────────────────
  if (stage === "input") return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Mode selector */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">What do you want to know?</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setActiveMode(m.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-sm border text-center transition-all ${
                activeMode === m.id ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
              }`}
              style={activeMode === m.id ? { backgroundColor: ACCENT } : {}}>
              <span className="text-xl">{m.emoji}</span>
              <span className={`text-[10px] font-black leading-tight ${activeMode === m.id ? "text-white" : "text-stone-700"}`}>{m.label}</span>
              <span className={`text-[9px] leading-tight ${activeMode === m.id ? "text-white/70" : "text-stone-400"}`}>{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Job Title *</label>
          <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Product Manager"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Industry</label>
          <input value={industry} onChange={e => setIndustry(e.target.value)}
            placeholder="e.g. FinTech, Healthcare, SaaS"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Location</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="e.g. London, Manchester, Remote UK"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Years of Experience *</label>
          <input type="number" value={yearsExp} onChange={e => setYearsExp(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 4"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400"
          />
        </div>
      </div>

      {/* Salary input with privacy toggle */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
          Current Annual Salary * <span className="text-stone-300 font-normal">(never stored without your permission)</span>
        </label>
        <div className="flex gap-2">
          {/* Currency */}
          <div className="flex gap-1">
            {CURRENCIES.map(c => (
              <button key={c.code} onClick={() => setCurrency(c.code)}
                className={`text-xs font-bold px-3 py-2.5 rounded-sm border transition-all ${
                  currency === c.code ? "text-white border-transparent" : "bg-white border-stone-200 text-stone-500"
                }`}
                style={currency === c.code ? { backgroundColor: ACCENT } : {}}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">{sym}</span>
            <input
              type={showSalary ? "number" : "password"}
              value={currentSalary}
              onChange={e => setCurrentSalary(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 52000"
              className="w-full text-sm border border-stone-200 rounded-sm pl-7 pr-10 py-2.5 focus:outline-none focus:border-teal-400"
            />
            <button onClick={() => setShowSalary(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
              {showSalary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Benefits You Receive</label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_BENEFITS.map(b => (
            <button key={b} onClick={() => toggleBenefit(b)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-sm border transition-all ${
                benefits.includes(b) ? "text-white border-transparent" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
              }`}
              style={benefits.includes(b) ? { backgroundColor: ACCENT } : {}}>
              {benefits.includes(b) ? "✓ " : ""}{b}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced */}
      <div>
        <button onClick={() => setShowAdvanced(p => !p)}
          className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-700 transition-colors">
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          More details (education, company size, skills, last raise)
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Education</label>
                  <select value={educationLevel} onChange={e => setEducationLevel(e.target.value)}
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-teal-400 bg-white">
                    <option value="">Select…</option>
                    {EDUCATION_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Company Size</label>
                  <select value={companySize} onChange={e => setCompanySize(e.target.value)}
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-teal-400 bg-white">
                    <option value="">Select…</option>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Remote Setup</label>
                  <select value={remoteSetup} onChange={e => setRemoteSetup(e.target.value)}
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-teal-400 bg-white">
                    <option value="">Select…</option>
                    {REMOTE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Last raise (months ago)</label>
                  <input type="number" value={lastRaiseMonths} onChange={e => setLastRaiseMonths(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 18"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-teal-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Key Skills</label>
                  <div className="flex gap-2 mb-2">
                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addSkill()}
                      placeholder="Add a skill…"
                      className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-teal-400" />
                    <button onClick={addSkill} className="text-white text-xs font-bold px-3 py-2 rounded-sm" style={{ backgroundColor: ACCENT }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {skills.map(s => (
                        <span key={s} className="flex items-center gap-1 text-xs font-bold text-white px-2.5 py-1 rounded-sm" style={{ backgroundColor: ACCENT }}>
                          {s}<button onClick={() => removeSkill(s)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                      <button key={s} onClick={() => setSkills(p => [...p, s])}
                        className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200 hover:border-teal-400 hover:text-teal-600 px-2 py-1 rounded-sm">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button onClick={handleAnalyse} disabled={!jobTitle.trim() || !currentSalary}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white py-4 rounded-sm transition-colors shadow-sm disabled:opacity-40"
        style={{ backgroundColor: ACCENT }}>
        <Sparkles className="w-5 h-5" />Check My Salary
      </button>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (stage === "loading") return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">💰</div>
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="text-sm font-semibold text-stone-600">{LOAD_STEPS[loadStep]}</motion.p>
        </AnimatePresence>
        <p className="text-xs text-stone-400 mt-1">Building your full salary intelligence report…</p>
      </div>
      <div className="flex gap-1.5">
        {LOAD_STEPS.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-teal-400" : "bg-stone-200"}`} />)}
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (!result) return null;

  const verdict = VERDICT_CFG[result.verdict] ?? VERDICT_CFG.FAIRLY_PAID;
  const sd      = result.salaryData;
  const neg     = result.negotiationReadiness;

  const RESULT_TABS = [
    { id: "verdict",   label: "Your Verdict",   icon: Scale       },
    { id: "market",    label: "Market Data",    icon: BarChart2   },
    { id: "career",    label: "Career Path",    icon: TrendingUp  },
    { id: "negotiate", label: "Negotiate",      icon: MessageSquare},
    { id: "actions",   label: "Action Plan",    icon: Target      },
  ] as const;

  // Filter tabs for quick mode
  const visibleTabs = activeMode === "quick"
    ? RESULT_TABS.filter(t => ["verdict", "negotiate"].includes(t.id))
    : activeMode === "benchmark"
    ? RESULT_TABS.filter(t => ["verdict", "market", "career"].includes(t.id))
    : activeMode === "career_path"
    ? RESULT_TABS.filter(t => ["career", "actions"].includes(t.id))
    : activeMode === "job_offer"
    ? RESULT_TABS.filter(t => ["verdict", "negotiate", "actions"].includes(t.id))
    : RESULT_TABS;

  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Verdict header */}
      <div className="rounded-sm overflow-hidden" style={{ borderLeft: `4px solid ${verdict.color}`, backgroundColor: verdict.bg, border: `1px solid ${verdict.border}` }}>
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{verdict.emoji}</span>
                <span className="text-xl font-black" style={{ color: verdict.color }}>{verdict.label}</span>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed max-w-lg">{result.verdictExplained}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isSignedIn && (
                <button onClick={handleSave} disabled={saving || saved}
                  className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                    saved ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-500 border-stone-300 hover:border-stone-500"
                  }`}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saved ? "Saved!" : "Save"}
                </button>
              )}
              <button onClick={() => { setStage("input"); setResult(null); }}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-3 py-2 rounded-sm">
                <RefreshCw className="w-3 h-3" />New
              </button>
            </div>
          </div>

          {/* Salary bar */}
          {sd && <SalaryBar current={sd.currentSalary} floor={sd.marketFloor} median={sd.marketMedian} top={sd.marketTop} currency={result.salaryData?.currency ?? "GBP"} />}

          {/* Key numbers strip */}
          {sd && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              {[
                { label: "Your salary",   value: `${sym}${sd.currentSalary?.toLocaleString()}`,  color: verdict.color },
                { label: "Market median", value: `${sym}${sd.marketMedian?.toLocaleString()}`,   color: "#6b7280"     },
                { label: "Gap",           value: sd.gapAmount >= 0 ? `+${sym}${Math.abs(sd.gapAmount).toLocaleString()}` : `-${sym}${Math.abs(sd.gapAmount).toLocaleString()}`, color: sd.gapAmount >= 0 ? "#10b981" : "#ef4444" },
                { label: "Percentile",   value: `${sd.marketPercentile}th`,                       color: ACCENT        },
              ].map(s => (
                <div key={s.label} className="bg-white/60 rounded-sm px-3 py-2.5">
                  <p className="text-base font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* The honest talk */}
        {result.theHonestTalk && (
          <div className="border-t px-6 py-4" style={{ borderColor: verdict.border, backgroundColor: `${verdict.color}08` }}>
            <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: verdict.color }}>💬 The Honest Assessment</p>
            <p className="text-sm font-semibold text-stone-800 leading-relaxed">{result.theHonestTalk}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-teal-500 text-teal-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── VERDICT tab ─────────────────────────────────────────────────── */}
      {activeTab === "verdict" && (
        <div className="space-y-4">
          {/* Career momentum */}
          {result.careerMomentum && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Career Momentum</p>
                <span className="text-xs font-black px-2 py-1 rounded-sm text-white"
                  style={{ backgroundColor: MOMENTUM_CFG[result.careerMomentum.status]?.color ?? ACCENT }}>
                  {MOMENTUM_CFG[result.careerMomentum.status]?.label ?? result.careerMomentum.status}
                </span>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed mb-3">{result.careerMomentum.explanation}</p>
              {result.careerMomentum.redFlags?.length > 0 && (
                <div className="space-y-1.5">
                  {result.careerMomentum.redFlags.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />{f}
                    </div>
                  ))}
                </div>
              )}
              {result.careerMomentum.greenFlags?.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {result.careerMomentum.greenFlags.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Benefits valuation */}
          {result.benefitsValuation && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Total Compensation</p>
                <span className="text-lg font-black" style={{ color: ACCENT }}>
                  {sym}{result.benefitsValuation.totalCompensation?.toLocaleString()}
                </span>
              </div>
              {result.benefitsValuation.breakdown?.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {result.benefitsValuation.breakdown.slice(0, 5).map((b: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">{b.benefit}</span>
                      <span className="font-bold text-stone-800">+{sym}{b.annualValue?.toLocaleString()}/yr</span>
                    </div>
                  ))}
                </div>
              )}
              {result.benefitsValuation.missingBenefits?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1.5">Missing Market-Standard Benefits</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.benefitsValuation.missingBenefits.map((b: string, i: number) => (
                      <span key={i} className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm">{b}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skill premiums */}
          {result.skillPremiums?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Skills That Would Boost Your Salary</p>
              <div className="space-y-2">
                {result.skillPremiums.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-bold text-stone-800">{s.skill}</p>
                        <span className="text-xs font-black text-emerald-600">+{sym}{s.premiumAmount?.toLocaleString()}/yr</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-400">{s.timeToAcquire}</span>
                        <span className="text-[10px] font-bold" style={{ color: ACCENT }}>{s.premiumPercent}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job search insights */}
          {result.jobSearchInsights && (
            <div className={`rounded-sm p-5 border ${result.jobSearchInsights.shouldJobSearch ? "bg-amber-50 border-amber-200" : "bg-white border-stone-100"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: result.jobSearchInsights.shouldJobSearch ? "#b45309" : "#6b7280" }}>
                  {result.jobSearchInsights.shouldJobSearch ? "⚡ You Should Be Job Searching" : "✅ No Urgent Need to Job Search"}
                </p>
              </div>
              <p className="text-xs text-stone-700 mb-3 leading-relaxed">{result.jobSearchInsights.reason}</p>
              {result.jobSearchInsights.shouldJobSearch && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-700">
                    Quote <span className="text-teal-600">{result.jobSearchInsights.salaryToAskInInterviews}</span> in interviews
                  </p>
                  {result.jobSearchInsights.bestPlatforms?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.jobSearchInsights.bestPlatforms.map((p: string, i: number) => (
                        <span key={i} className="text-xs text-stone-600 bg-white border border-stone-200 px-2.5 py-1 rounded-sm">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MARKET tab ────────────────────────────────────────────────────── */}
      {activeTab === "market" && (
        <div className="space-y-4">
          {/* Salary by experience */}
          {result.salaryByExperience?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-4">Salary by Experience Level</p>
              <div className="space-y-3">
                {result.salaryByExperience.map((s: any, i: number) => {
                  const yearsExpNumber = typeof yearsExp === "number" ? yearsExp : Number(yearsExp) || 0;
                  const isCurrentLevel = s.stage.toLowerCase().includes(yearsExpNumber <= 2 ? "entry" : yearsExpNumber <= 5 ? "mid" : yearsExpNumber <= 9 ? "senior" : "lead");
                  return (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm ${isCurrentLevel ? "border-2 border-teal-300 bg-teal-50/50" : ""}`}>
                      <p className="text-xs font-bold text-stone-700 w-32 flex-shrink-0">{s.stage}</p>
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: ACCENT, width: `${Math.min(100, (s.midpoint / (result.salaryByExperience.slice(-1)[0]?.midpoint || s.midpoint)) * 100)}%` }}
                          initial={{ width: 0 }} animate={{ width: `${Math.min(100, (s.midpoint / (result.salaryByExperience.slice(-1)[0]?.midpoint || s.midpoint)) * 100)}%` }} transition={{ duration: 0.6 }} />
                      </div>
                      <p className="text-xs font-black text-stone-800 w-32 text-right flex-shrink-0">{s.range}</p>
                      {isCurrentLevel && <span className="text-[10px] font-black text-teal-600 flex-shrink-0">← You</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Salary by company type */}
          {result.salaryByCompanyType?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Salary by Company Type</p>
              <div className="space-y-2">
                {result.salaryByCompanyType.map((c: any, i: number) => (
                  <div key={i} className="border border-stone-100 rounded-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-stone-800">{c.type}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">{c.tradeOff}</p>
                      </div>
                      <span className="text-xs font-black text-stone-700 flex-shrink-0 ml-3">{c.range}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location premiums */}
          {result.locationPremiums?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />Location Salary Comparison
              </p>
              <div className="space-y-2">
                {result.locationPremiums.map((l: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-stone-700">{l.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-stone-800">{sym}{l.absoluteMedian?.toLocaleString()}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm ${l.multiplier?.startsWith("+") ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
                        {l.multiplier}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adjacent roles (benchmark mode) */}
          {result.adjacentRoles?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Adjacent Roles Worth Considering</p>
              <div className="space-y-3">
                {result.adjacentRoles.map((r: any, i: number) => (
                  <div key={i} className="border border-stone-100 rounded-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-stone-900">{r.title}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">Transition: {r.transitionDifficulty}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-black" style={{ color: ACCENT }}>{r.range}</p>
                        <p className="text-[10px] text-emerald-600 font-bold">{r.salaryDelta}</p>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 mb-2">{r.whyConsider}</p>
                    {r.skillsNeeded?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {r.skillsNeeded.map((s: string, si: number) => (
                          <span key={si} className="text-[10px] text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-sm">+ {s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CAREER tab ────────────────────────────────────────────────────── */}
      {activeTab === "career" && (
        <div className="space-y-4">
          {/* Career path mode */}
          {result.primaryPath && (
            <div>
              <div className="bg-stone-900 text-white rounded-sm p-5 mb-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Primary Path</p>
                <p className="text-lg font-black text-teal-300">{result.primaryPath.name}</p>
                <p className="text-xs text-white/60 mt-1">{result.primaryPath.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <p className="text-[10px] text-white/40">10-Year Potential</p>
                    <p className="text-xl font-black text-emerald-400">{sym}{result.primaryPath.tenYearPotential?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              {result.primaryPath.milestones?.length > 0 && (
                <div className="space-y-2">
                  {result.primaryPath.milestones.map((m: any, i: number) => (
                    <div key={i} className="flex gap-4 relative">
                      {i < result.primaryPath.milestones.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-px bg-stone-100" />
                      )}
                      <div className="w-8 h-8 rounded-sm font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10 text-white"
                        style={{ backgroundColor: ACCENT }}>Y{m.year}</div>
                      <div className="flex-1 pb-4 bg-white border border-stone-100 rounded-sm px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-stone-900">{m.title}</p>
                          <span className="text-sm font-black" style={{ color: ACCENT }}>{sym}{m.expectedSalary?.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mb-2">{m.salaryRange}</p>
                        {m.criticalSkill && (
                          <p className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-sm px-2 py-1 inline-block">
                            🔑 {m.criticalSkill}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alternative path */}
          {result.alternativePath && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" style={{ color: ACCENT }} />
                <p className="text-sm font-black text-stone-900">{result.alternativePath.name}</p>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">Alternative</span>
              </div>
              <p className="text-xs text-stone-600 mb-3">{result.alternativePath.description}</p>
              {result.alternativePath.requiredBoldMove && (
                <div className="rounded-sm px-4 py-3 mb-3" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Required Bold Move</p>
                  <p className="text-xs text-stone-800 font-semibold">{result.alternativePath.requiredBoldMove}</p>
                </div>
              )}
            </div>
          )}

          {/* 10 year earnings comparison */}
          {result.tenYearEarningsComparison && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-4">10-Year Earnings Comparison</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-stone-50 rounded-sm p-3 text-center">
                  <p className="text-[10px] text-stone-400 mb-1">If you do nothing</p>
                  <p className="text-xl font-black text-stone-700">{sym}{(result.tenYearEarningsComparison.currentTrajectory / 1000).toFixed(0)}k</p>
                </div>
                <div className="rounded-sm p-3 text-center" style={{ backgroundColor: `${ACCENT}10` }}>
                  <p className="text-[10px] mb-1" style={{ color: ACCENT }}>If you take action</p>
                  <p className="text-xl font-black" style={{ color: ACCENT }}>{sym}{(result.tenYearEarningsComparison.optimisedTrajectory / 1000).toFixed(0)}k</p>
                </div>
              </div>
              <div className="rounded-sm px-4 py-3" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                <p className="text-sm font-black" style={{ color: ACCENT }}>
                  Potential additional earnings: {sym}{result.tenYearEarningsComparison.difference?.toLocaleString()}
                </p>
                <p className="text-xs text-stone-600 mt-1">{result.tenYearEarningsComparison.insight}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NEGOTIATE tab ────────────────────────────────────────────────── */}
      {activeTab === "negotiate" && (
        <div className="space-y-4">
          {/* Quick negotiation readiness (full mode) */}
          {neg && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Negotiation Readiness</p>
                  <p className="text-xl font-black" style={{ color: neg.confidenceScore >= 70 ? "#10b981" : neg.confidenceScore >= 50 ? ACCENT : "#f97316" }}>
                    {neg.confidenceScore}/100 Confidence
                  </p>
                </div>
                <div className="text-right">
                  {neg.shouldNegotiate ? (
                    <span className="text-xs font-black text-white bg-emerald-500 px-3 py-1.5 rounded-sm">Negotiate Now</span>
                  ) : (
                    <span className="text-xs font-black text-white bg-amber-500 px-3 py-1.5 rounded-sm">Build Leverage First</span>
                  )}
                </div>
              </div>
              {neg.askAmount && (
                <div className="rounded-sm px-4 py-3 mb-3" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: ACCENT }}>Ask For</p>
                  <p className="text-2xl font-black" style={{ color: ACCENT }}>{sym}{neg.askAmount?.toLocaleString()}</p>
                  <p className="text-xs text-stone-500">Range: {neg.askRange}</p>
                </div>
              )}
              {neg.leveragePoints?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Your Leverage Points</p>
                  {neg.leveragePoints.map((l: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-stone-700 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{l}
                    </div>
                  ))}
                </div>
              )}
              {neg.weaknesses?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Weaknesses to Address</p>
                  {neg.weaknesses.map((w: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-stone-600 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />{w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Job offer analysis */}
          {result.offerVerdict && (
            <div>
              <div className={`rounded-sm p-5 mb-3 border ${
                result.offerVerdict === "EXCEPTIONAL" || result.offerVerdict === "STRONG" ? "bg-emerald-50 border-emerald-200" :
                result.offerVerdict === "WALK_AWAY" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
              }`}>
                <p className="text-xl font-black mb-1">{result.offerVerdictLabel}</p>
                <p className="text-sm text-stone-700">{result.offerVsMarket}</p>
                <p className="text-sm text-stone-600 mt-0.5">{result.vsCurrentSalary}</p>
              </div>
              {result.counterOffer?.shouldCounter && (
                <div className="bg-white border border-stone-100 rounded-sm p-5">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Counter-Offer Script</p>
                  <div className="rounded-sm px-4 py-3 mb-3" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Ask For</p>
                    <p className="text-xl font-black" style={{ color: ACCENT }}>{sym}{result.counterOffer.counterAmount?.toLocaleString()}</p>
                    <p className="text-xs text-stone-500">Range: {result.counterOffer.counterRange}</p>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-stone-800 leading-relaxed flex-1">{result.counterOffer.script}</p>
                    <CopyBtn text={result.counterOffer.script} />
                  </div>
                </div>
              )}
              {result.decisionFramework && (
                <div className="rounded-sm px-4 py-4" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: ACCENT }}>Decision Framework</p>
                  <p className="text-sm font-semibold text-stone-800 leading-relaxed">{result.decisionFramework}</p>
                </div>
              )}
            </div>
          )}

          {/* Script builder */}
          <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100" style={{ backgroundColor: `${ACCENT}06` }}>
              <p className="text-sm font-black text-stone-900">Write My Negotiation Script</p>
              <p className="text-xs text-stone-500 mt-0.5">Get a word-for-word script, email template, and objection handlers</p>
            </div>
            <div className="p-5">
              <NegotiationBuilder
                currentSalary={Number(currentSalary) || 0}
                currency={currency}
                checkId={checkId}
                onInsufficientTokens={onInsufficientTokens}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIONS tab ─────────────────────────────────────────────────── */}
      {activeTab === "actions" && result.actionPlan && (
        <div className="space-y-4">
          {result.actionPlan.immediateActions?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">This Week</p>
              <div className="space-y-2">
                {result.actionPlan.immediateActions.map((a: any, i: number) => (
                  <ActionItem key={i} action={a.action} timeframe={a.timeframe} impact={a.impact} detail={a.detail} />
                ))}
              </div>
            </div>
          )}
          {result.actionPlan.shortTermActions?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Next 1–3 Months</p>
              <div className="space-y-2">
                {result.actionPlan.shortTermActions.map((a: any, i: number) => (
                  <ActionItem key={i} action={a.action} timeframe={a.timeframe} impact={a.impact} detail={a.detail} />
                ))}
              </div>
            </div>
          )}
          {result.actionPlan.longTermActions?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">3–12 Months</p>
              <div className="space-y-2">
                {result.actionPlan.longTermActions.map((a: any, i: number) => (
                  <ActionItem key={i} action={a.action} timeframe={a.timeframe} impact={a.impact} detail={a.detail} />
                ))}
              </div>
            </div>
          )}
          {result.salaryAccelerators?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Salary Accelerators</p>
              <div className="space-y-2">
                {result.salaryAccelerators.map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-800">{a.action}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{a.howTo}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-emerald-600">{a.potentialUpside}</p>
                      <p className="text-[10px] text-stone-400">{a.timeframe}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}