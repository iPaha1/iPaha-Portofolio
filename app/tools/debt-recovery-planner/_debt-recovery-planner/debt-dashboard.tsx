"use client";

// =============================================================================
// isaacpaha.com — Debt Recovery Planner: User Progress Dashboard
// app/tools/debt-recovery-planner/_components/debt-dashboard.tsx
//
// Signed-in user's workspace:
//   - Active plan overview with progress ring
//   - Payment logger (log what you paid today)
//   - Payment history
//   - Plan details (debt order, monthly breakdown preview)
//   - Motivation: % debt cleared, days on plan, next milestone
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  TrendingDown, Plus, Check, Loader2, Calendar, Award,
  Trash2, RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  Flame, Target, BarChart2, X, CreditCard, DollarSign,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentLog {
  id:        string;
  amount:    number;
  debtLabel?: string | null;
  note?:     string | null;
  paidAt:    string;
}

interface ActivePlan {
  id:                  string;
  label:               string;
  strategy:            string;
  totalDebtAtStart:    number;
  estimatedMonths:     number;
  estimatedPayoffDate: string | null;
  monthlyPayment:      number;
  paidToDate:          number;
  remainingDebt:       number;
  isCompleted:         boolean;
  completedAt:         string | null;
  weeklyActions:       string;
  insights:            string;
  createdAt:           string;
  payments:            PaymentLog[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtRel  = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "today"; if (days === 1) return "yesterday"; if (days < 7) return `${days}d ago`;
  return fmtDate(d);
};

function ProgressRing({ pct, size = 80, color = "#14b8a6" }: { pct: number; size?: number; color?: string }) {
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black" style={{ color }}>{Math.round(pct)}%</span>
        <span className="text-[9px] text-stone-400 font-semibold">cleared</span>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export function DebtDashboard() {
  const [plan,        setPlan]        = useState<ActivePlan | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [logAmount,   setLogAmount]   = useState("");
  const [logDebt,     setLogDebt]     = useState("");
  const [logNote,     setLogNote]     = useState("");
  const [logging,     setLogging]     = useState(false);
  const [logSuccess,  setLogSuccess]  = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/debt-planner/save");
      const data = await res.json();
      setPlan(data.activePlan ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const logPayment = async () => {
    const amount = parseFloat(logAmount);
    if (!plan || !amount || amount <= 0) return;
    setLogging(true);
    try {
      await fetch("/api/tools/debt-planner/save?type=payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, amount, debtLabel: logDebt || null, note: logNote || null }),
      });
      setLogSuccess(true);
      setLogAmount(""); setLogDebt(""); setLogNote("");
      setTimeout(() => { setLogSuccess(false); load(); }, 2000);
    } catch {}
    setLogging(false);
  };

  const actions: string[] = React.useMemo(() => {
    try { return JSON.parse(plan?.weeklyActions ?? "[]"); } catch { return []; }
  }, [plan?.weeklyActions]);

  const insights: string[] = React.useMemo(() => {
    try { return JSON.parse(plan?.insights ?? "[]"); } catch { return []; }
  }, [plan?.insights]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
    </div>
  );

  if (!plan) return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-stone-50 border border-dashed border-stone-200 rounded-xs">
      <div className="w-16 h-16 rounded-xs bg-teal-50 border-2 border-dashed border-teal-200 flex items-center justify-center mb-5 text-3xl">💰</div>
      <h3 className="text-base font-black text-stone-900 mb-2">No active plan yet</h3>
      <p className="text-sm text-stone-500 max-w-xs leading-relaxed mb-1">
        Use the <span className="font-bold">Get My Plan</span> tab to generate your repayment roadmap, then click <span className="font-bold">Save Plan</span> to track it here.
      </p>
    </div>
  );

  const paidPct = plan.totalDebtAtStart > 0 ? (plan.paidToDate / plan.totalDebtAtStart) * 100 : 0;
  const daysOnPlan = Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / 86400000);
  const payoffDate = plan.estimatedPayoffDate ? fmtDate(plan.estimatedPayoffDate) : null;

  return (
    <div className="space-y-5">
      {/* Completed celebration */}
      {plan.isCompleted && (
        <div className="bg-gradient-to-r from-teal-500 to-emerald-400 rounded-xs p-6 text-white text-center">
          <p className="text-4xl mb-2">🥳</p>
          <h2 className="text-xl font-black mb-1">Debt-Free! Congratulations!</h2>
          <p className="text-sm text-white/80">You cleared {plan.totalDebtAtStart.toLocaleString("en-GB", {style:"currency",currency:"GBP"})} of debt. That takes real commitment.</p>
        </div>
      )}

      {/* Plan header */}
      <div className="bg-stone-900 text-white rounded-xs p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Active Plan</p>
            <p className="text-sm font-bold text-white/90">{plan.label}</p>
            <p className="text-xs text-white/40 mt-0.5">Started {fmtDate(plan.createdAt)} · {daysOnPlan} days in</p>
          </div>
          <ProgressRing pct={paidPct} size={80} color="#14b8a6" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Remaining",     value: `£${Math.round(plan.remainingDebt).toLocaleString()}`,         color: "#f87171" },
            { label: "Paid so far",   value: `£${Math.round(plan.paidToDate).toLocaleString()}`,            color: "#34d399" },
            { label: "Monthly target",value: `£${Math.round(plan.monthlyPayment).toLocaleString()}`,        color: "#fbbf24" },
            { label: "Payoff date",   value: payoffDate ?? `${plan.estimatedMonths}mo`,                     color: "#818cf8" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-sm px-3 py-2.5">
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-stone-100 rounded-xs p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Debt cleared</p>
          <span className="text-sm font-black text-teal-600">{paidPct.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-teal-500" initial={{ width: 0 }} animate={{ width: `${paidPct}%` }} transition={{ duration: 1, ease: [0.22,1,0.36,1] }} />
        </div>
        <div className="flex justify-between text-[10px] text-stone-400 mt-1.5">
          <span>£0</span>
          <span>£{Math.round(plan.totalDebtAtStart).toLocaleString()}</span>
        </div>
      </div>

      {/* Log a payment */}
      <div className="bg-white border border-stone-100 rounded-xs p-5">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Log a Payment</p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-[140px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">£</span>
              <input type="number" value={logAmount} onChange={e => setLogAmount(e.target.value)}
                placeholder="Amount"
                className="w-full pl-6 pr-3 py-2.5 text-sm font-bold border border-stone-200 rounded-sm focus:outline-none focus:border-teal-400"
              />
            </div>
            <input value={logDebt} onChange={e => setLogDebt(e.target.value)}
              placeholder="Which debt? (optional)"
              className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400"
            />
          </div>
          <input value={logNote} onChange={e => setLogNote(e.target.value)}
            placeholder="Note (optional) — e.g. 'Extra payment from freelance work'"
            className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400"
          />
          <button onClick={logPayment} disabled={!logAmount || logging || parseFloat(logAmount) <= 0}
            className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-sm transition-colors ${
              logSuccess ? "bg-emerald-500 text-white" : "text-white bg-teal-500 hover:bg-teal-600"
            } disabled:opacity-50`}>
            {logging    ? <Loader2 className="w-4 h-4 animate-spin" />
              : logSuccess ? <><Check className="w-4 h-4" />Payment logged!</>
              : <><Plus className="w-4 h-4" />Log Payment</>
            }
          </button>
        </div>
      </div>

      {/* Weekly actions */}
      {actions.length > 0 && (
        <div className="border border-stone-100 rounded-xs overflow-hidden">
          <button onClick={() => setShowActions(p => !p)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-bold text-stone-800">This Week's Actions</span>
            </div>
            {showActions ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>
          <AnimatePresence>
            {showActions && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="border-t border-stone-100 px-5 py-4 space-y-2">
                  {actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 text-[10px] font-black text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</div>
                      <p className="text-sm text-stone-700 leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Payment history */}
      {plan.payments?.length > 0 && (
        <div className="border border-stone-100 rounded-xs overflow-hidden">
          <button onClick={() => setShowHistory(p => !p)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-stone-400" />
              <span className="text-sm font-bold text-stone-800">Payment History ({plan.payments.length})</span>
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="border-t border-stone-100 divide-y divide-stone-50">
                  {plan.payments.slice(0, 20).map(payment => (
                    <div key={payment.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-emerald-600">+£{payment.amount.toFixed(2)}</p>
                          {payment.debtLabel && <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{payment.debtLabel}</span>}
                        </div>
                        {payment.note && <p className="text-xs text-stone-400 mt-0.5">{payment.note}</p>}
                      </div>
                      <span className="text-[11px] text-stone-400 flex-shrink-0">{fmtRel(payment.paidAt)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">From Your Plan</p>
          <div className="space-y-2">
            {insights.slice(0, 2).map((insight, i) => (
              <div key={i} className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-xs px-4 py-3">
                <span className="text-base flex-shrink-0">{["💡","📊"][i]}</span>
                <p className="text-xs text-teal-800 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors mx-auto">
        <RefreshCw className="w-3.5 h-3.5" />Refresh
      </button>
    </div>
  );
}