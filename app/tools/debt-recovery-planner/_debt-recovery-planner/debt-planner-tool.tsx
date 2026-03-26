"use client";

// =============================================================================
// isaacpaha.com — AI Debt Recovery Planner
// app/tools/debt-recovery-planner/_components/debt-planner-tool.tsx
//
// Full flow:
//   Stage 1 — Input (debts, income, expenses, strategy)
//   Stage 2 — Loading (animated steps)
//   Stage 3 — Results (snapshot, plan, weekly actions, scenarios, micro goals)
//   + AI Coach panel (conversational assistant)
// =============================================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence }                         from "framer-motion";
import {
  Plus, Trash2, Sparkles, Loader2, AlertCircle, Check, Copy,
  ChevronDown, ChevronUp, RefreshCw, Download, TrendingDown,
  TrendingUp, Target, Calendar, Flame, Heart, AlertTriangle,
  MessageSquare, Send, X, Info, DollarSign, ArrowRight,
  BarChart2, Lightbulb, Shield, Award, CheckCircle2, Lock,
  Zap, BookOpen, CreditCard, PiggyBank,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DebtType = "CREDIT_CARD" | "PERSONAL_LOAN" | "STUDENT_LOAN" | "CAR_LOAN"
  | "MORTGAGE" | "OVERDRAFT" | "BUY_NOW_PAY_LATER" | "MEDICAL" | "FAMILY_OR_FRIEND" | "OTHER";

type Strategy = "SNOWBALL" | "AVALANCHE" | "HYBRID";

interface DebtItem {
  id:         string;
  label:      string;
  balance:    number | "";
  type:       DebtType;
  apr?:       number | "";
  minPayment?: number | "";
  deadline?:  string;
}

interface ExpenseItem {
  id:     string;
  label:  string;
  amount: number | "";
}

interface FinancialSnapshot {
  totalDebt:                   number;
  monthlyIncome:               number;
  totalExpenses:               number;
  monthlySurplus:              number;
  totalMinimums:               number;
  availableForDebt:            number;
  riskLevel:                   "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskExplanation:             string;
  estimatedMonthsToDebtFree:  number;
  estimatedPayoffDate:         string;
  totalInterestEstimate:       number;
  monthlySurplusAfterMinimums: number;
  recommendedMonthlyPayment:   number;
}

interface MonthlyPlanItem {
  month:         number;
  label:         string;
  totalPayment:  number;
  essentials:    number;
  discretionary: number;
  remainingDebt: number;
  milestone?:    string | null;
  debtBreakdown: { label: string; payment: number; balance: number }[];
}

interface MicroGoal {
  goal:            string;
  targetMonth:     number;
  celebrationNote: string;
}

interface ScenarioResult {
  label:               string;
  newEstimatedMonths:  number;
  monthsSaved:         number;
  interestSaved?:      number;
  freeingUp?:          string;
}

interface DebtPlan {
  financialSnapshot:   FinancialSnapshot;
  strategyExplained:   string;
  debtOrder:           { label: string; balance: number; priority: number; reason: string }[];
  monthlyPlan:         MonthlyPlanItem[];
  weeklyActions:       string[];
  insights:            string[];
  scenarioSimulations: { plus100: ScenarioResult; minus100spending: ScenarioResult; plus200: ScenarioResult };
  microGoals:          MicroGoal[];
  lifestyleSuggestions:{ category: string; suggestion: string; estimatedSaving: string }[];
  disclaimer:          string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: "GBP", sym: "£", label: "GBP (£)" },
  { code: "USD", sym: "$", label: "USD ($)" },
  { code: "EUR", sym: "€", label: "EUR (€)" },
];

const DEBT_TYPES: { value: DebtType; label: string; emoji: string }[] = [
  { value: "CREDIT_CARD",       label: "Credit Card",         emoji: "💳" },
  { value: "PERSONAL_LOAN",     label: "Personal Loan",       emoji: "🏦" },
  { value: "STUDENT_LOAN",      label: "Student Loan",        emoji: "🎓" },
  { value: "CAR_LOAN",          label: "Car Loan",            emoji: "🚗" },
  { value: "OVERDRAFT",         label: "Overdraft",           emoji: "📉" },
  { value: "BUY_NOW_PAY_LATER", label: "Buy Now Pay Later",   emoji: "🛒" },
  { value: "MEDICAL",           label: "Medical",             emoji: "🏥" },
  { value: "FAMILY_OR_FRIEND",  label: "Family / Friend",     emoji: "👥" },
  { value: "MORTGAGE",          label: "Mortgage",            emoji: "🏠" },
  { value: "OTHER",             label: "Other",               emoji: "📋" },
];

const STRATEGIES: { id: Strategy; label: string; emoji: string; desc: string }[] = [
  { id: "AVALANCHE", label: "Avalanche",    emoji: "🏔️", desc: "Highest interest first — saves the most money" },
  { id: "SNOWBALL",  label: "Snowball",     emoji: "⛄",  desc: "Smallest balance first — builds psychological momentum" },
  { id: "HYBRID",    label: "AI Suggests",  emoji: "🤖",  desc: "Let the AI recommend the best approach for your situation" },
];

const RISK_CFG = {
  LOW:      { color: "#10b981", bg: "#d1fae5", border: "#6ee7b7", icon: CheckCircle2, label: "Manageable"    },
  MEDIUM:   { color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d", icon: AlertTriangle,label: "Some pressure" },
  HIGH:     { color: "#f97316", bg: "#ffedd5", border: "#fdba74", icon: AlertTriangle,label: "Under pressure" },
  CRITICAL: { color: "#ef4444", bg: "#fee2e2", border: "#fca5a5", icon: AlertCircle,  label: "Urgent"        },
};

const uid = () => Math.random().toString(36).slice(2, 9);
const sym = (currency: string) => currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
const fmtMoney = (n: number, currency: string) => `${sym(currency)}${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct = (part: number, total: number) => total > 0 ? Math.round((part / total) * 100) : 0;

// ─── Input Stage ──────────────────────────────────────────────────────────────

function InputStage({
  onGenerate,
}: {
  onGenerate: (debts: DebtItem[], income: number, currency: string, fixed: ExpenseItem[], variable: ExpenseItem[], strategy: Strategy, targetMonths?: number) => void;
}) {
  const [step,     setStep]     = useState<1 | 2 | 3>(1);
  const [currency, setCurrency] = useState("GBP");
  const [income,   setIncome]   = useState<number | "">("");
  const [strategy, setStrategy] = useState<Strategy>("HYBRID");
  const [targetMonths, setTargetMonths] = useState<number | "">(""); 

  const [debts, setDebts]    = useState<DebtItem[]>([
    { id: uid(), label: "", balance: "", type: "CREDIT_CARD", apr: "", minPayment: "" },
  ]);
  const [fixed, setFixed]    = useState<ExpenseItem[]>([
    { id: uid(), label: "Rent / Mortgage", amount: "" },
    { id: uid(), label: "Utilities",       amount: "" },
    { id: uid(), label: "Transport",       amount: "" },
  ]);
  const [variable, setVariable] = useState<ExpenseItem[]>([
    { id: uid(), label: "Groceries",        amount: "" },
    { id: uid(), label: "Eating out",       amount: "" },
    { id: uid(), label: "Entertainment",    amount: "" },
  ]);

  const S = sym(currency);
  const totalDebts    = debts.reduce((s, d) => s + (Number(d.balance) || 0), 0);
  const totalFixed_   = fixed.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalVariable_= variable.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const surplus       = (Number(income) || 0) - totalFixed_ - totalVariable_;
  const debtsValid    = debts.every((d) => d.label.trim() && (Number(d.balance) || 0) > 0);
  const incomeValid   = (Number(income) || 0) > 0;

  const addDebt     = () => setDebts(p => [...p, { id: uid(), label: "", balance: "", type: "CREDIT_CARD", apr: "", minPayment: "" }]);
  const removeDebt  = (id: string) => setDebts(p => p.filter(d => d.id !== id));
  const updateDebt  = (id: string, k: keyof DebtItem, v: any) => setDebts(p => p.map(d => d.id === id ? { ...d, [k]: v } : d));

  const addExpense    = (type: "fixed" | "variable") => {
    const row: ExpenseItem = { id: uid(), label: "", amount: "" };
    type === "fixed" ? setFixed(p => [...p, row]) : setVariable(p => [...p, row]);
  };
  const removeExpense = (id: string, type: "fixed" | "variable") => {
    type === "fixed" ? setFixed(p => p.filter(e => e.id !== id)) : setVariable(p => p.filter(e => e.id !== id));
  };
  const updateExpense = (id: string, k: keyof ExpenseItem, v: any, type: "fixed" | "variable") => {
    type === "fixed"
      ? setFixed(p => p.map(e => e.id === id ? { ...e, [k]: v } : e))
      : setVariable(p => p.map(e => e.id === id ? { ...e, [k]: v } : e));
  };

  const handleGenerate = () => {
    if (!debtsValid || !incomeValid) return;
    onGenerate(debts, Number(income), currency, fixed, variable, strategy, targetMonths ? Number(targetMonths) : undefined);
  };

  const STEPS = [
    { n: 1, label: "Your Debts" },
    { n: 2, label: "Income & Expenses" },
    { n: 3, label: "Strategy" },
  ];

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-sm px-4 py-3.5">
        <Shield className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-teal-700 leading-relaxed">
          <span className="font-bold">Planning tool, not financial advice.</span> This tool helps you create a structured repayment plan. For personalised regulated advice, speak to a financial adviser or a free debt charity like{" "}
          <a href="https://www.stepchange.org" target="_blank" rel="noopener noreferrer" className="underline font-semibold">StepChange</a> (UK) or{" "}
          <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Citizens Advice</a>.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            <button onClick={() => setStep(s.n as 1|2|3)}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-sm border transition-colors ${
                step === s.n ? "bg-teal-50 border-teal-300 text-teal-700" :
                step > s.n  ? "bg-white border-stone-200 text-stone-400" :
                "bg-white border-stone-100 text-stone-300"
              }`}>
              <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                step > s.n ? "bg-teal-500 text-white" : step === s.n ? "bg-teal-100 text-teal-700" : "bg-stone-100 text-stone-400"
              }`}>{step > s.n ? "✓" : s.n}</span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-stone-100 mx-1" />}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 1: Debts ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Currency */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Currency</label>
            <div className="flex gap-1">
              {CURRENCIES.map((c) => (
                <button key={c.code} onClick={() => setCurrency(c.code)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors ${
                    currency === c.code ? "bg-teal-50 border-teal-300 text-teal-700" : "bg-white border-stone-200 text-stone-500"
                  }`}>{c.label}</button>
              ))}
            </div>
          </div>

          {/* Debt rows */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">
              Your Debts
            </label>
            <div className="space-y-3">
              {debts.map((debt, i) => (
                <div key={debt.id} className="bg-stone-50 border border-stone-100 rounded-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black text-stone-400">#{i + 1}</span>
                    <select value={debt.type} onChange={(e) => updateDebt(debt.id, "type", e.target.value)}
                      className="text-xs border border-stone-200 rounded-sm px-2 py-1.5 bg-white text-stone-600 focus:outline-none focus:border-teal-400">
                      {DEBT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                    </select>
                    {debts.length > 1 && (
                      <button onClick={() => removeDebt(debt.id)} className="ml-auto text-stone-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-400 mb-1">Name / Label *</label>
                      <input value={debt.label} onChange={(e) => updateDebt(debt.id, "label", e.target.value)}
                        placeholder="e.g. Barclays Visa"
                        className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-400 mb-1">Balance owed *</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-semibold">{S}</span>
                        <input type="number" value={debt.balance} onChange={(e) => updateDebt(debt.id, "balance", e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="0"
                          className="w-full text-xs border border-stone-200 rounded-sm pl-6 pr-2.5 py-2 focus:outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-400 mb-1">
                        Interest rate (APR %) <span className="text-stone-300">optional</span>
                      </label>
                      <input type="number" value={debt.apr} onChange={(e) => updateDebt(debt.id, "apr", e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 19.9"
                        className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-400 mb-1">
                        Min. monthly payment <span className="text-stone-300">optional</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-semibold">{S}</span>
                        <input type="number" value={debt.minPayment} onChange={(e) => updateDebt(debt.id, "minPayment", e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="0"
                          className="w-full text-xs border border-stone-200 rounded-sm pl-6 pr-2.5 py-2 focus:outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addDebt} className="mt-2 flex items-center gap-2 text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors">
              <Plus className="w-3.5 h-3.5" />Add another debt
            </button>
          </div>

          {/* Total summary */}
          {totalDebts > 0 && (
            <div className="flex items-center justify-between bg-stone-900 text-white rounded-sm px-4 py-3">
              <span className="text-xs text-white/60">Total debt entered</span>
              <span className="text-lg font-black text-teal-400">{S}{totalDebts.toLocaleString()}</span>
            </div>
          )}

          <button onClick={() => setStep(2)} disabled={!debtsValid}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 py-3 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Next: Income & Expenses <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: Income & Expenses ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Monthly income */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Monthly Take-Home Income *</label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">{S}</span>
              <input type="number" value={income} onChange={(e) => setIncome(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 2500"
                className="w-full text-base font-bold border border-stone-200 rounded-sm pl-7 pr-3 py-3 focus:outline-none focus:border-teal-400"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1.5">After-tax income — salary, benefits, freelance, any regular income.</p>
          </div>

          {/* Fixed expenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Fixed Monthly Expenses</label>
              <span className="text-xs font-bold text-stone-500">{S}{totalFixed_.toLocaleString()}/mo</span>
            </div>
            <div className="space-y-2">
              {fixed.map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <input value={e.label} onChange={(ev) => updateExpense(e.id, "label", ev.target.value, "fixed")}
                    placeholder="Expense name"
                    className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-teal-400"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-semibold">{S}</span>
                    <input type="number" value={e.amount} onChange={(ev) => updateExpense(e.id, "amount", ev.target.value === "" ? "" : Number(ev.target.value), "fixed")}
                      placeholder="0"
                      className="w-full text-xs border border-stone-200 rounded-sm pl-5 pr-2 py-2 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <button onClick={() => removeExpense(e.id, "fixed")} className="text-stone-300 hover:text-red-400 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button onClick={() => addExpense("fixed")} className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-teal-600 transition-colors">
                <Plus className="w-3 h-3" />Add fixed expense
              </button>
            </div>
          </div>

          {/* Variable expenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Variable Monthly Spending</label>
              <span className="text-xs font-bold text-stone-500">{S}{totalVariable_.toLocaleString()}/mo</span>
            </div>
            <div className="space-y-2">
              {variable.map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <input value={e.label} onChange={(ev) => updateExpense(e.id, "label", ev.target.value, "variable")}
                    placeholder="Spending category"
                    className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-teal-400"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-semibold">{S}</span>
                    <input type="number" value={e.amount} onChange={(ev) => updateExpense(e.id, "amount", ev.target.value === "" ? "" : Number(ev.target.value), "variable")}
                      placeholder="0"
                      className="w-full text-xs border border-stone-200 rounded-sm pl-5 pr-2 py-2 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <button onClick={() => removeExpense(e.id, "variable")} className="text-stone-300 hover:text-red-400 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button onClick={() => addExpense("variable")} className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-teal-600 transition-colors">
                <Plus className="w-3 h-3" />Add variable expense
              </button>
            </div>
          </div>

          {/* Surplus preview */}
          {income !== "" && (
            <div className={`rounded-sm px-4 py-3.5 border ${surplus >= 0 ? "bg-teal-50 border-teal-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider" style={{ color: surplus >= 0 ? "#0f766e" : "#dc2626" }}>
                    Monthly Surplus
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: surplus >= 0 ? "#0f766e" : "#dc2626" }}>
                    {surplus >= 0
                      ? "After all expenses — available for debt repayment"
                      : "You're currently spending more than you earn"}
                  </p>
                </div>
                <span className="text-2xl font-black" style={{ color: surplus >= 0 ? "#0f766e" : "#dc2626" }}>
                  {surplus >= 0 ? "+" : ""}{S}{Math.abs(surplus).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(1)}
              className="text-xs font-semibold text-stone-400 border border-stone-200 hover:border-stone-400 px-4 py-2.5 rounded-sm transition-colors">
              ← Back
            </button>
            <button onClick={() => setStep(3)} disabled={!incomeValid}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 py-2.5 rounded-sm transition-colors disabled:opacity-40">
              Next: Choose Strategy <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Strategy ──────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Repayment Strategy</label>
            <div className="space-y-2">
              {STRATEGIES.map((s) => (
                <button key={s.id} onClick={() => setStrategy(s.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-sm border text-left transition-all ${
                    strategy === s.id ? "bg-teal-50 border-teal-300" : "bg-white border-stone-100 hover:border-stone-300"
                  }`}>
                  <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${strategy === s.id ? "text-teal-800" : "text-stone-700"}`}>{s.label}</p>
                      {strategy === s.id && <Check className="w-4 h-4 text-teal-500" />}
                    </div>
                    <p className={`text-xs mt-0.5 leading-relaxed ${strategy === s.id ? "text-teal-600" : "text-stone-400"}`}>{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Target Timeline <span className="text-stone-300 font-normal">optional</span></label>
            <div className="flex items-center gap-2 max-w-xs">
              <input type="number" value={targetMonths} onChange={(e) => setTargetMonths(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 24"
                className="w-24 text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400"
              />
              <span className="text-sm text-stone-500">months</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Leave blank and the AI will suggest a realistic timeline.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)}
              className="text-xs font-semibold text-stone-400 border border-stone-200 hover:border-stone-400 px-4 py-2.5 rounded-sm transition-colors">
              ← Back
            </button>
            <button onClick={handleGenerate}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 py-3 rounded-sm transition-colors shadow-sm">
              <Sparkles className="w-4 h-4" />Generate My Recovery Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function ResultsStage({
  plan, currency, onReset, isSignedIn,
}: {
  plan: DebtPlan; currency: string; onReset: () => void; isSignedIn: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"snapshot" | "roadmap" | "actions" | "scenarios" | "coach">("snapshot");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [showFull,  setShowFull]  = useState(false);

  const S      = sym(currency);
  const snap   = plan.financialSnapshot;
  const risk   = RISK_CFG[snap.riskLevel] ?? RISK_CFG.MEDIUM;
  const RIcon  = risk.icon;
  const months = plan.monthlyPlan ?? [];
  const displayMonths = showFull ? months : months.slice(0, 12);

  const TABS = [
    { id: "snapshot",  label: "Your Snapshot",  icon: BarChart2    },
    { id: "roadmap",   label: "Roadmap",         icon: Calendar     },
    { id: "actions",   label: "Action Plan",     icon: Target       },
    { id: "scenarios", label: "Scenarios",       icon: TrendingUp   },
    { id: "coach",     label: "AI Coach",        icon: MessageSquare},
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-stone-900 text-white rounded-sm p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Your Recovery Plan</p>
            <p className="text-3xl font-black text-teal-400">{snap.estimatedPayoffDate}</p>
            <p className="text-sm text-white/60 mt-0.5">Estimated debt-free date</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isSignedIn && (
              <button onClick={async () => {
                setSaving(true);
                await fetch("/api/tools/debt-planner/save?type=plan", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ plan, strategy: plan.debtOrder ? "AVALANCHE" : "HYBRID" }),
                }).catch(() => {});
                setSaved(true); setTimeout(() => setSaved(false), 3000); setSaving(false);
              }}
                disabled={saving}
                className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                  saved ? "text-teal-400 border-teal-400/40" : "text-white/50 hover:text-white border-white/15 hover:border-white/30"
                }`}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save Plan"}
              </button>
            )}
            <button onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              <RefreshCw className="w-3 h-3" />New Plan
            </button>
          </div>
        </div>

        {/* Key numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Debt",         value: fmtMoney(snap.totalDebt, currency),                  color: "#f87171"  },
            { label: "Monthly Surplus",    value: `${snap.monthlySurplus >= 0 ? "+" : ""}${fmtMoney(snap.monthlySurplus, currency)}`, color: snap.monthlySurplus >= 0 ? "#34d399" : "#f87171" },
            { label: "Recommended Payment",value: fmtMoney(snap.recommendedMonthlyPayment, currency),  color: "#fbbf24"  },
            { label: "Months to Freedom",  value: `${snap.estimatedMonthsToDebtFree} months`,          color: "#818cf8"  },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-sm px-3 py-2.5">
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk level */}
      <div className="rounded-sm px-4 py-3.5 border flex items-center justify-between gap-4"
        style={{ backgroundColor: risk.bg, borderColor: risk.border }}>
        <div className="flex items-center gap-3">
          <RIcon className="w-5 h-5 flex-shrink-0" style={{ color: risk.color }} />
          <div>
            <p className="text-sm font-black" style={{ color: risk.color }}>Risk Level: {risk.label}</p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: risk.color }}>{snap.riskExplanation}</p>
          </div>
        </div>
        {(snap.riskLevel === "HIGH" || snap.riskLevel === "CRITICAL") && (
          <a href="https://www.stepchange.org" target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 text-xs font-bold border px-3 py-1.5 rounded-sm transition-colors"
            style={{ color: risk.color, borderColor: risk.border }}>
            Get free help →
          </a>
        )}
      </div>

      {/* Strategy explained */}
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-sm px-4 py-3.5">
        <Lightbulb className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-teal-800 leading-relaxed">{plan.strategyExplained}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-stone-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-teal-500 text-teal-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── SNAPSHOT ──────────────────────────────────────────────────────── */}
      {activeTab === "snapshot" && (
        <div className="space-y-4">
          {/* Insights */}
          {plan.insights?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">AI Observations</p>
              {plan.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                  <span className="text-base flex-shrink-0">{["💡","📊","🔍","🌅"][i] ?? "✨"}</span>
                  <p className="text-sm text-stone-700 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          )}

          {/* Debt payoff order */}
          {plan.debtOrder?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Payoff Order</p>
              <div className="space-y-1.5">
                {plan.debtOrder.sort((a, b) => a.priority - b.priority).map((d) => (
                  <div key={d.label} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-2.5">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-[11px] font-black flex items-center justify-center flex-shrink-0">{d.priority}</span>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-stone-800">{d.label}</span>
                      <span className="text-xs text-stone-400 ml-2">{fmtMoney(d.balance, currency)}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 text-right max-w-[40%] leading-tight">{d.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Micro goals */}
          {plan.microGoals?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Milestone Goals</p>
              <div className="grid grid-cols-2 gap-2">
                {plan.microGoals.map((goal, i) => (
                  <div key={i} className="bg-white border border-stone-100 rounded-sm p-4">
                    <p className="text-2xl mb-2">{["🚀","⚡","🏆","🥳"][i] ?? "🎯"}</p>
                    <p className="text-xs font-bold text-stone-800 mb-1">{goal.goal}</p>
                    <p className="text-[10px] text-stone-400">Month {goal.targetMonth}</p>
                    <p className="text-[10px] text-teal-600 font-semibold mt-1">{goal.celebrationNote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle suggestions */}
          {plan.lifestyleSuggestions?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Practical Adjustments</p>
              <div className="space-y-2">
                {plan.lifestyleSuggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5">{s.category}</span>
                    <div className="flex-1">
                      <p className="text-xs text-stone-700 leading-relaxed">{s.suggestion}</p>
                    </div>
                    <span className="text-xs font-black text-emerald-600 flex-shrink-0">{s.estimatedSaving}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ROADMAP ───────────────────────────────────────────────────────── */}
      {activeTab === "roadmap" && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Month-by-Month Breakdown</p>
          <div className="space-y-2">
            {displayMonths.map((m) => {
              const progressPct = snap.totalDebt > 0 ? pct(snap.totalDebt - m.remainingDebt, snap.totalDebt) : 0;
              return (
                <div key={m.month} className={`border rounded-sm overflow-hidden ${m.milestone ? "border-teal-300 bg-teal-50/30" : "border-stone-100 bg-white"}`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-12 text-center flex-shrink-0">
                      <p className="text-xs font-black text-stone-400">M{m.month}</p>
                      <p className="text-[10px] text-stone-300">{m.label}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs font-bold text-teal-600">{fmtMoney(m.totalPayment, currency)} paid</span>
                        <span className="text-xs text-stone-400">{fmtMoney(m.remainingDebt, currency)} remaining</span>
                        {m.milestone && <span className="text-xs font-black text-teal-600 bg-teal-100 px-2 py-0.5 rounded-sm">{m.milestone}</span>}
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-stone-400 flex-shrink-0">{progressPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          {months.length > 12 && (
            <button onClick={() => setShowFull(p => !p)}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-stone-500 border border-stone-200 hover:border-stone-400 py-2.5 rounded-sm transition-colors">
              {showFull ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showFull ? "Show less" : `Show all ${months.length} months`}
            </button>
          )}
        </div>
      )}

      {/* ── ACTION PLAN ───────────────────────────────────────────────────── */}
      {activeTab === "actions" && (
        <div className="space-y-4">
          {plan.weeklyActions?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">This Week's Actions</p>
              <div className="space-y-2">
                {plan.weeklyActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <div className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[11px] font-black text-teal-600">{i + 1}</span>
                    </div>
                    <p className="text-sm text-stone-700 leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-stone-50 border border-stone-100 rounded-sm p-4">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">Daily Money Habit</p>
            <p className="text-sm text-stone-700 leading-relaxed">
              Every evening, spend 2 minutes checking: Did I stick to today's budget? If not, why? Don't judge — just observe. Awareness is the foundation of change.
            </p>
          </div>
        </div>
      )}

      {/* ── SCENARIOS ─────────────────────────────────────────────────────── */}
      {activeTab === "scenarios" && (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">What-If Simulations</p>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.values(plan.scenarioSimulations ?? {}).map((scenario: any, i) => (
              <div key={i} className="bg-white border border-stone-100 rounded-sm p-5">
                <p className="text-xs font-bold text-stone-800 mb-3 leading-snug">{scenario.label}</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-black text-teal-600">{scenario.monthsSaved}</p>
                    <p className="text-[11px] text-stone-400">months saved</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-stone-700">{scenario.newEstimatedMonths}mo</p>
                    <p className="text-[11px] text-stone-400">new timeline</p>
                  </div>
                  {scenario.interestSaved > 0 && (
                    <div className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-sm">
                      ~{fmtMoney(scenario.interestSaved, currency)} interest saved
                    </div>
                  )}
                  {scenario.freeingUp && (
                    <p className="text-[11px] text-stone-500 leading-snug">{scenario.freeingUp}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-sm px-4 py-3">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Even {S}50 extra per month makes a significant difference over time. The scenarios above show just how much.
            </p>
          </div>
        </div>
      )}

      {/* ── AI COACH ─────────────────────────────────────────────────────── */}
      {activeTab === "coach" && (
        <CoachPanel
          financialContext={{
            totalDebt:     snap.totalDebt,
            monthlySurplus: snap.monthlySurplus,
            estimatedMonths: snap.estimatedMonthsToDebtFree,
            currency,
          }}
          currency={currency}
          isSignedIn={isSignedIn}
        />
      )}

      {/* Disclaimer */}
      <div className="border border-stone-100 rounded-sm px-4 py-3">
        <p className="text-[10px] text-stone-400 leading-relaxed">{plan.disclaimer}</p>
      </div>
    </div>
  );
}

// ─── AI Coach Panel ───────────────────────────────────────────────────────────

function CoachPanel({
  financialContext, currency, isSignedIn,
}: {
  financialContext: any; currency: string; isSignedIn: boolean;
}) {
  const [messages,  setMessages]  = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [initiated, setInitiated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const QUICK_QUESTIONS = [
    "Can I afford a £200 emergency this month?",
    "What's the best way to build a £500 emergency fund?",
    "Should I cancel my subscriptions?",
    "How do I stay motivated when progress is slow?",
    "What side income ideas suit my situation?",
  ];

  const send = useCallback(async (msg: string) => {
    if (!msg.trim() || loading) return;
    const userMsg: { role: "user" | "assistant"; content: string } = { role: "user", content: msg };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    setInitiated(true);

    try {
      const res  = await fetch("/api/tools/debt-planner/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:          msg,
          history:          messages,
          financialContext: !initiated ? financialContext : undefined,
        }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", content: data.reply ?? "Sorry, I couldn't respond — please try again." }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Network error — please try again." }]);
    }
    setLoading(false);
  }, [messages, loading, financialContext, initiated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-sm px-4 py-3">
        <MessageSquare className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-teal-700 leading-relaxed">
          Your AI financial coach can answer questions about your plan, budgeting decisions, and staying motivated.
          <span className="font-bold"> Not regulated financial advice</span> — for serious debt issues, contact{" "}
          <a href="https://www.stepchange.org" target="_blank" rel="noopener noreferrer" className="underline">StepChange</a>.
        </p>
      </div>

      {/* Quick questions */}
      {messages.length === 0 && (
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Quick questions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q} onClick={() => send(q)}
                className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-3 py-1.5 rounded-sm transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="border border-stone-100 rounded-sm overflow-hidden max-h-80 overflow-y-auto">
          <div className="p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  m.role === "assistant" ? "bg-teal-100 text-teal-700" : "bg-stone-100 text-stone-600"
                }`}>
                  {m.role === "assistant" ? "AI" : "You"}
                </div>
                <div className={`max-w-[80%] rounded-sm px-3 py-2.5 text-xs leading-relaxed ${
                  m.role === "assistant" ? "bg-teal-50 border border-teal-100 text-teal-900" : "bg-stone-100 text-stone-700"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-black text-teal-700 flex-shrink-0">AI</div>
                <div className="bg-teal-50 border border-teal-100 rounded-sm px-3 py-2.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask your financial coach…"
          className="flex-1 text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-teal-400"
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function DebtPlannerTool({ isSignedIn = false }: { isSignedIn?: boolean }) {
  const [stage,    setStage]    = useState<"input" | "loading" | "results">("input");
  const [plan,     setPlan]     = useState<DebtPlan | null>(null);
  const [currency, setCurrency] = useState("GBP");
  const [error,    setError]    = useState("");
  const [loadStep, setLoadStep] = useState(0);

  const LOAD_STEPS = [
    "Calculating your monthly surplus…",
    "Applying repayment strategy…",
    "Building month-by-month roadmap…",
    "Generating weekly action plan…",
    "Running scenario simulations…",
    "Writing your personalised insights…",
  ];

  const handleGenerate = async (
    debts: DebtItem[], income: number, curr: string,
    fixed: ExpenseItem[], variable: ExpenseItem[],
    strategy: Strategy, targetMonths?: number
  ) => {
    setCurrency(curr);
    setStage("loading"); setError(""); setLoadStep(0);

    const interval = setInterval(() => setLoadStep((p) => Math.min(p + 1, LOAD_STEPS.length - 1)), 1600);

    try {
      const res  = await fetch("/api/tools/debt-planner/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debts: debts.map((d) => ({
            label:      d.label,
            balance:    Number(d.balance) || 0,
            type:       d.type,
            apr:        d.apr !== "" ? Number(d.apr) : undefined,
            minPayment: d.minPayment !== "" ? Number(d.minPayment) : undefined,
          })),
          monthlyIncome:    income,
          currency:         curr,
          fixedExpenses:    fixed.map((e) => ({ label: e.label, amount: Number(e.amount) || 0 })).filter((e) => e.amount > 0),
          variableExpenses: variable.map((e) => ({ label: e.label, amount: Number(e.amount) || 0 })).filter((e) => e.amount > 0),
          strategy,
          targetMonths,
        }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok || !data.plan) {
        setError(data.error ?? "Plan generation failed — please try again.");
        setStage("input");
        return;
      }

      setPlan(data.plan);
      setStage("results");
    } catch {
      clearInterval(interval);
      setError("Network error — please check your connection and try again.");
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
            <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">💰</div>
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-sm font-semibold text-stone-600">
                {LOAD_STEPS[loadStep]}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-stone-400 mt-1">Building your personalised recovery plan…</p>
          </div>
          <div className="flex gap-1.5">
            {LOAD_STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-teal-400" : "bg-stone-200"}`} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && stage === "input" && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {stage === "input" && <InputStage onGenerate={handleGenerate} />}
      {stage === "results" && plan && (
        <ResultsStage plan={plan} currency={currency} onReset={() => { setStage("input"); setPlan(null); }} isSignedIn={isSignedIn} />
      )}
    </div>
  );
}