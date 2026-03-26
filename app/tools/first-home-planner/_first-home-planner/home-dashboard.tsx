"use client";

// =============================================================================
// isaacpaha.com — First Home Planner: User Progress Dashboard
// app/tools/first-home-planner/_components/home-dashboard.tsx
//
// Signed-in user's workspace:
//   - Plan overview with readiness ring + key scores
//   - Deposit milestones tracker (mark as achieved)
//   - Savings log (add deposits toward house fund)
//   - Roadmap phases progress
//   - UK schemes reminder
//   - Plan regeneration shortcut
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  Home, PiggyBank, Check, Loader2, Calendar, Award,
  Trash2, RefreshCw, ChevronDown, ChevronUp, Target,
  TrendingUp, Plus, X, Star, AlertTriangle, Info,
  CreditCard, Flame, BookOpen, CheckCircle2, Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Milestone {
  id:           string;
  label:        string;
  targetAmount: number;
  targetMonth:  number;
  isAchieved:   boolean;
  achievedAt?:  string | null;
}

interface SavingsLog {
  id:       string;
  amount:   number;
  note?:    string | null;
  savedAt:  string;
}

interface SavedPlan {
  id:                     string;
  label:                  string;
  monthlyIncome:          number;
  currentSavings:         number;
  targetPrice:            number;
  depositPercent:         number;
  timeframeMonths:        number;
  propertyType:           string;
  location?:              string | null;
  currency:               string;
  overallReadinessScore:  number;
  depositReadinessScore:  number;
  incomeReadinessScore:   number;
  creditReadinessScore:   number;
  realisticTimelineMonths: number;
  realisticTargetDate?:   string | null;
  planJson:               string;
  createdAt:              string;
  updatedAt:              string;
  milestones:             Milestone[];
  savingsLogs:            SavingsLog[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmtDate   = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtRel    = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "today"; if (days === 1) return "yesterday"; if (days < 7) return `${days}d ago`;
  return fmtDate(d);
};
const fmtK = (n: number, sym = "£") => n >= 1000 ? `${sym}${(n/1000).toFixed(0)}k` : `${sym}${n.toLocaleString()}`;

// ─── Readiness Ring ───────────────────────────────────────────────────────────

function ReadinessRing({ score, color = "#6366f1", size = 96 }: { score: number; color?: string; size?: number }) {
  const r    = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, score) / 100) * circ;
  const label = score >= 75 ? "Nearly Ready" : score >= 50 ? "Getting There" : score >= 25 ? "Building" : "Starting Out";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] text-stone-400 font-semibold leading-tight px-1">{label}</span>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

interface Props { initialPlan?: any }

export function HomeDashboard({ initialPlan }: Props) {
  const [plan,          setPlan]          = useState<SavedPlan | null>(initialPlan ?? null);
  const [loading,       setLoading]       = useState(!initialPlan);
  const [logAmount,     setLogAmount]     = useState("");
  const [logNote,       setLogNote]       = useState("");
  const [logging,       setLogging]       = useState(false);
  const [logOk,         setLogOk]         = useState(false);
  const [deletingPlan,  setDeletingPlan]  = useState(false);
  const [showRoadmap,   setShowRoadmap]   = useState(false);
  const [showSavings,   setShowSavings]   = useState(false);
  const [milestonesSaving, setMilestonesSaving] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/home-planner/save");
      const data = await res.json();
      setPlan(data ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (!initialPlan) load(); }, [load, initialPlan]);

  const logSavings = async () => {
    const amount = parseFloat(logAmount);
    if (!plan || !amount || amount <= 0) return;
    setLogging(true);
    try {
      await fetch("/api/tools/home-planner/save?action=savings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSavings: (plan.currentSavings ?? 0) + amount }),
      });
      setLogOk(true); setLogAmount(""); setLogNote("");
      setTimeout(() => { setLogOk(false); load(); }, 2000);
    } catch {}
    setLogging(false);
  };

  const toggleMilestone = async (milestone: Milestone) => {
    setMilestonesSaving(p => new Set([...p, milestone.id]));
    try {
      await fetch("/api/tools/home-planner/save?action=milestone", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: milestone.id, isAchieved: !milestone.isAchieved }),
      });
      setPlan(p => p ? ({
        ...p,
        milestones: p.milestones.map(m => m.id === milestone.id
          ? { ...m, isAchieved: !m.isAchieved, achievedAt: !m.isAchieved ? new Date().toISOString() : null }
          : m),
      }) : p);
    } catch {}
    setMilestonesSaving(p => { const n = new Set(p); n.delete(milestone.id); return n; });
  };

  const deletePlan = async () => {
    setDeletingPlan(true);
    await fetch("/api/tools/home-planner/save", { method: "DELETE" });
    setPlan(null);
    setDeletingPlan(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
    </div>
  );

  if (!plan) return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-stone-50 border border-dashed border-stone-200 rounded-sm">
      <div className="w-16 h-16 rounded-sm bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center mb-5 text-3xl">🏡</div>
      <h3 className="text-base font-black text-stone-900 mb-2">No saved plan yet</h3>
      <p className="text-sm text-stone-500 max-w-xs leading-relaxed mb-1">
        Fill in the planner on the <span className="font-bold">Plan My Home</span> tab, then click <span className="font-bold">Save Plan</span> to track your progress here.
      </p>
      <p className="text-xs text-stone-400 mt-1">Your plan saves your deposit milestones and lets you log every savings deposit.</p>
    </div>
  );

  const sym           = plan.currency === "GBP" ? "£" : plan.currency === "USD" ? "$" : "€";
  const depositTarget = Math.round(plan.targetPrice * (plan.depositPercent / 100));
  const totalLogged   = plan.savingsLogs?.reduce((s, l) => s + l.amount, 0) ?? 0;
  const currentSaved  = plan.currentSavings + totalLogged;
  const gap           = Math.max(0, depositTarget - currentSaved);
  const depositPct    = depositTarget > 0 ? Math.min(100, Math.round((currentSaved / depositTarget) * 100)) : 0;
  const achieved      = plan.milestones?.filter(m => m.isAchieved).length ?? 0;
  const daysSincePlan = Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / 86400000);

  // Parse plan JSON for roadmap phases
  const parsedPlan = (() => { try { return JSON.parse(plan.planJson); } catch { return null; } })();
  const phases: any[] = parsedPlan?.mortgageReadinessRoadmap?.phases ?? [];
  const schemes: any[] = parsedPlan?.ukSchemes?.filter((s: any) => s.relevanceScore >= 60) ?? [];

  return (
    <div className="space-y-5">

      {/* Header: plan info + stats */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Your Plan</p>
            <p className="text-lg font-black text-white">{plan.label}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Started {fmtRel(plan.createdAt)}</span>
              {plan.realisticTargetDate && <span className="flex items-center gap-1"><Target className="w-3 h-3" />Ready by {plan.realisticTargetDate}</span>}
            </div>
          </div>
          <ReadinessRing score={plan.overallReadinessScore} />
        </div>

        {/* Score row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Deposit",  score: plan.depositReadinessScore,  color: "#818cf8" },
            { label: "Income",   score: plan.incomeReadinessScore,   color: "#fbbf24" },
            { label: "Credit",   score: plan.creditReadinessScore,   color: "#34d399" },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-sm p-3 text-center">
              <p className="text-lg font-black" style={{ color: s.color }}>{s.score}</p>
              <p className="text-[10px] text-white/50 font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit progress */}
      <div className="bg-white border border-stone-100 rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Deposit Progress</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{sym}{currentSaved.toLocaleString()} <span className="text-sm font-semibold text-stone-400">of {sym}{depositTarget.toLocaleString()}</span></p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-indigo-600">{depositPct}%</p>
            <p className="text-xs text-stone-400">{gap > 0 ? `${sym}${gap.toLocaleString()} to go` : "🎉 Target reached!"}</p>
          </div>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-indigo-500"
            initial={{ width: 0 }} animate={{ width: `${depositPct}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400">
          <span>{sym}0</span>
          <span>{sym}{depositTarget.toLocaleString()} ({plan.depositPercent}% deposit)</span>
        </div>
      </div>

      {/* Log savings */}
      <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
        <button onClick={() => setShowSavings(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors">
          <div className="flex items-center gap-2.5">
            <PiggyBank className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-stone-800">Log a Savings Deposit</span>
            {totalLogged > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">{sym}{totalLogged.toLocaleString()} logged</span>}
          </div>
          {showSavings ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>
        <AnimatePresence>
          {showSavings && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
              transition={{ duration: 0.2 }} className="overflow-hidden border-t border-stone-100">
              <div className="px-5 py-4 space-y-3">
                <p className="text-xs text-stone-500 leading-relaxed">
                  Each time you move money into your house fund, log it here. Your deposit progress ring updates automatically.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">{sym}</span>
                    <input type="number" value={logAmount} onChange={e => setLogAmount(e.target.value)}
                      placeholder="Amount saved"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <input value={logNote} onChange={e => setLogNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-indigo-400"
                  />
                  <button onClick={logSavings} disabled={logging || !logAmount}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2.5 rounded-sm transition-colors disabled:opacity-60">
                    {logging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : logOk ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {logOk ? "Saved!" : "Log"}
                  </button>
                </div>

                {/* Savings history */}
                {plan.savingsLogs?.length > 0 && (
                  <div className="border-t border-stone-100 pt-3">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">History</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {[...plan.savingsLogs].reverse().map(log => (
                        <div key={log.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500 font-bold">+{sym}{log.amount.toLocaleString()}</span>
                            {log.note && <span className="text-stone-400">{log.note}</span>}
                          </div>
                          <span className="text-stone-300">{fmtRel(log.savedAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Milestones */}
      {plan.milestones?.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Deposit Milestones</p>
            <span className="text-xs font-bold text-indigo-600">{achieved}/{plan.milestones.length} achieved</span>
          </div>
          <div className="space-y-3">
            {plan.milestones.map((m) => (
              <div key={m.id} className={`flex items-center gap-3 p-3 rounded-sm border transition-all ${
                m.isAchieved ? "border-emerald-200 bg-emerald-50" : "border-stone-100 bg-stone-50/30"
              }`}>
                <button onClick={() => toggleMilestone(m)}
                  disabled={milestonesSaving.has(m.id)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    m.isAchieved ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-300 text-transparent hover:border-indigo-400"
                  }`}>
                  {milestonesSaving.has(m.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${m.isAchieved ? "text-emerald-800 line-through opacity-70" : "text-stone-700"}`}>
                    {m.label}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-bold text-indigo-600">{sym}{m.targetAmount.toLocaleString()}</span>
                    <span className="text-[10px] text-stone-400">~{m.targetMonth} month{m.targetMonth !== 1 ? "s" : ""} from start</span>
                    {m.isAchieved && m.achievedAt && (
                      <span className="text-[10px] text-emerald-600 font-semibold">✓ {fmtRel(m.achievedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roadmap phases accordion */}
      {phases.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
          <button onClick={() => setShowRoadmap(p => !p)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-stone-800">Your Mortgage Readiness Roadmap</span>
              <span className="text-[10px] text-stone-400">{phases.length} phases</span>
            </div>
            {showRoadmap ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>
          <AnimatePresence>
            {showRoadmap && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                transition={{ duration: 0.25 }} className="overflow-hidden border-t border-stone-100">
                <div className="px-5 py-4 space-y-4">
                  {phases.map((phase: any) => (
                    <div key={phase.phase} className="border border-stone-100 rounded-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 bg-stone-50 border-b border-stone-100">
                        <div className="w-8 h-8 rounded-sm bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-black text-indigo-700">P{phase.phase}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-stone-800">{phase.title}</p>
                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm">{phase.duration}</span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">{phase.focus}</p>
                        </div>
                      </div>
                      <div className="px-4 py-3 space-y-1.5">
                        {phase.tasks?.map((t: any, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-stone-600">{t.task}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2.5 bg-indigo-50 border-t border-indigo-100 flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <p className="text-xs font-semibold text-indigo-700">{phase.milestone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* UK schemes reminder */}
      {schemes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-black text-amber-700 uppercase tracking-wider">Don't miss these UK schemes</p>
          </div>
          <div className="space-y-2">
            {schemes.slice(0, 3).map((s: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-stone-800">{s.scheme}</p>
                  <p className="text-[11px] text-stone-500">{s.potentialValue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats footer */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock,    label: "Days on plan",      value: daysSincePlan,               color: "#6366f1" },
          { icon: PiggyBank,label: "Total saved",        value: `${sym}${currentSaved.toLocaleString()}`, color: "#10b981" },
          { icon: Award,    label: "Milestones hit",     value: `${achieved}/${plan.milestones?.length ?? 0}`, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }} />
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-stone-400 font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="border border-red-100 rounded-sm p-4">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">Danger Zone</p>
        <p className="text-xs text-stone-500 mb-3 leading-relaxed">
          Delete your plan to start fresh. Your milestones and savings log will be permanently removed.
        </p>
        <button onClick={deletePlan} disabled={deletingPlan}
          className="flex items-center gap-2 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-sm transition-colors disabled:opacity-60">
          {deletingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {deletingPlan ? "Deleting…" : "Delete my plan"}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-stone-50 border border-stone-200 rounded-sm px-4 py-3">
        <Info className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-stone-500 leading-relaxed">
          This plan is educational guidance, not regulated financial or mortgage advice. Figures are estimates based on your inputs. For personalised mortgage advice, speak to an FCA-regulated independent mortgage adviser (IMA).
        </p>
      </div>
    </div>
  );
}