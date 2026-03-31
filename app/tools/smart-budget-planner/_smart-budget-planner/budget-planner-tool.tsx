"use client";

// =============================================================================
// isaacpaha.com — Smart Budget Survival Planner
// app/tools/smart-budget-planner/_components/budget-planner-tool.tsx
//
// Flow: Input → Loading → Results
// Results tabs: Overview | Week-by-Week | Cut Suggestions | Scenarios | Coach
// =============================================================================

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence }             from "framer-motion";
import {
  Plus, Trash2, Sparkles, Loader2, AlertCircle, Check, Copy,
  ChevronDown, ChevronUp, RefreshCw, Download, TrendingUp,
  Target, Calendar, AlertTriangle, MessageSquare, Send, X,
  Info, DollarSign, ArrowRight, BarChart2, Lightbulb, Shield,
  Zap, PiggyBank, Scissors, ShoppingCart, Car, Wifi,
  Home, Coffee, Utensils, Music, CreditCard, Lock,
  Award,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpenseItem {
  id:       string;
  label:    string;
  amount:   number | "";
  category: string;
}

// ─── NEW: token gate prop ─────────────────────────────────────────────────────
 
export interface TokenGateInfo {
  required: number;
  balance:  number;
  toolName: string | null;
}

export interface BudgetPlannerToolProps {
  /** Called when the API returns 402 — parent page shows the modal */
     onInsufficientTokens?: (info: TokenGateInfo) => void;
    }
interface Snapshot {
  totalBudget:          number;
  timeframeDays:        number;
  totalFixed:           number;
  totalFlexible:        number;
  remaining:            number;
  dailyBudgetTotal:     number;
  dailyBudgetFlexible:  number;
  weeklyBudget:         number;
  riskLevel:            "COMFORTABLE" | "MANAGEABLE" | "TIGHT" | "CRITICAL";
  riskLabel:            string;
  riskColour:           string;
  daysViable:           number;
  headline:             string;
  summary:              string;
  survivalVerdict:      string;
}

interface CategoryPlanItem {
  category:        string;
  dailyAllocation: number;
  weeklyAllocation: number;
  totalAllocation: number;
  type:            "fixed" | "flexible";
  tips:            string;
  priority:        "Essential" | "Important" | "Discretionary";
}

interface WeeklyPlanItem {
  week:           number;
  label:          string;
  startDay:       number;
  endDay:         number;
  totalBudget:    number;
  fixedCosts:     number;
  flexibleBudget: number;
  dailyLimit:     number;
  focus:          string;
  milestone?:     string | null;
}

interface CutSuggestion {
  category:       string;
  currentAmount:  number;
  suggestedAmount: number;
  saving:         number;
  dailyImpact:    number;
  suggestion:     string;
  difficulty:     "Easy" | "Medium" | "Requires planning";
}

interface SurvivalTip {
  tip:              string;
  category:         string;
  potentialSaving:  string;
  effort:           "Low" | "Medium" | "One-time";
}

interface Scenario {
  name:             string;
  change:           number;
  changeType:       "spending_reduction" | "income_increase" | "emergency";
  newDailyFlexible: number;
  newDaysViable:    number;
  impact:           string;
  howTo:            string;
}

interface BudgetPlan {
  snapshot:       Snapshot;
  categoryPlan:   CategoryPlanItem[];
  weeklyPlan:     WeeklyPlanItem[];
  cutSuggestions: CutSuggestion[];
  survivalTips:   SurvivalTip[];
  scenarios:      Scenario[];
  emergencyPlan:  { dailyLimit: number; description: string; essentials: string[]; cutEntirely: string[] };
  motivation:     string;
  shareCard:      { headline: string; stats: string };
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DIFFICULTY_CFG = {
  "Easy":              { color: "#10b981", bg: "#d1fae5" },
  "Medium":            { color: "#f59e0b", bg: "#fef3c7" },
  "Requires planning": { color: "#ef4444", bg: "#fee2e2" },
};

const EFFORT_CFG = {
  "Low":      { color: "#10b981" },
  "Medium":   { color: "#f59e0b" },
  "One-time": { color: "#6366f1" },
};

const PRIORITY_CFG = {
  "Essential":     { color: "#ef4444", bg: "#fee2e2" },
  "Important":     { color: "#f59e0b", bg: "#fef3c7" },
  "Discretionary": { color: "#6b7280", bg: "#f3f4f6" },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Utensils, Transport: Car, Rent: Home, Bills: Wifi,
  Entertainment: Music, Subscriptions: CreditCard, Coffee: Coffee,
  Shopping: ShoppingCart, Miscellaneous: DollarSign,
};

const FIXED_SUGGESTIONS   = ["Rent", "Bills", "Transport", "Phone", "Insurance", "Subscriptions"];
const FLEXIBLE_SUGGESTIONS = ["Food", "Eating out", "Entertainment", "Coffee", "Clothing", "Miscellaneous"];
const CURRENCIES = [
  { code: "GBP", sym: "£", label: "GBP (£)" },
  { code: "USD", sym: "$", label: "USD ($)" },
  { code: "EUR", sym: "€", label: "EUR (€)" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function fmt(n: number, sym: string): string {
  return `${sym}${n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)}`;
}

function fmtDay(n: number, sym: string): string {
  return `${sym}${n.toFixed(2)}/day`;
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────

function RiskBadge({ level, label, colour }: { level: string; label: string; colour: string }) {
  const emoji = level === "COMFORTABLE" ? "🟢" : level === "MANAGEABLE" ? "🟡" : level === "TIGHT" ? "🟠" : "🔴";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-sm border"
      style={{ color: colour, backgroundColor: `${colour}12`, borderColor: `${colour}40` }}>
      {emoji} {label}
    </span>
  );
}

// ─── Daily Budget Ring ────────────────────────────────────────────────────────

function DailyRing({ daily, sym, colour }: { daily: number; sym: string; colour: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 128 128" width={128} height={128} className="rotate-[-90deg]">
          <circle cx={64} cy={64} r={54} fill="none" stroke="#f3f4f6" strokeWidth={10} />
          <circle cx={64} cy={64} r={54} fill="none" stroke={colour} strokeWidth={10}
            strokeDasharray="339.3" strokeDashoffset="0" strokeLinecap="round"
            style={{ opacity: 0.25 }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black leading-none" style={{ color: colour }}>
            {sym}{daily.toFixed(2)}
          </span>
          <span className="text-[11px] font-bold text-stone-400 mt-1">per day</span>
        </div>
      </div>
      <p className="text-xs text-stone-500 mt-2 text-center font-medium">Your daily survival budget</p>
    </div>
  );
}

// ─── Input Stage ──────────────────────────────────────────────────────────────

function InputStage({ onGenerate }: { onGenerate: (data: any) => void }) {
  const [budget,   setBudget]   = useState<number | "">("");
  const [days,     setDays]     = useState<number | "">(30);
  const [currency, setCurrency] = useState("GBP");
  const [fixed,    setFixed]    = useState<ExpenseItem[]>([
    { id: uid(), label: "Rent / Housing",   amount: "", category: "Rent"      },
    { id: uid(), label: "Bills",             amount: "", category: "Bills"     },
    { id: uid(), label: "Transport",         amount: "", category: "Transport" },
  ]);
  const [flexible, setFlexible] = useState<ExpenseItem[]>([
    { id: uid(), label: "Food & Groceries", amount: "", category: "Food"           },
    { id: uid(), label: "Entertainment",     amount: "", category: "Entertainment" },
    { id: uid(), label: "Miscellaneous",     amount: "", category: "Miscellaneous" },
  ]);
  const [quickPreset, setQuickPreset] = useState<string | null>(null);

  const sym = CURRENCIES.find(c => c.code === currency)?.sym ?? "£";

  const totalFixed    = fixed.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalFlexible = flexible.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalExpenses = totalFixed + totalFlexible;
  const remaining     = (Number(budget) || 0) - totalExpenses;
  const daily         = days ? (Number(budget) || 0) / Number(days) : 0;
  const canGenerate   = Number(budget) > 0 && Number(days) > 0;

  const addExpense = (type: "fixed" | "flexible") => {
    const item: ExpenseItem = { id: uid(), label: "", amount: "", category: "Miscellaneous" };
    type === "fixed" ? setFixed(p => [...p, item]) : setFlexible(p => [...p, item]);
  };

  const removeExpense = (type: "fixed" | "flexible", id: string) => {
    type === "fixed" ? setFixed(p => p.filter(e => e.id !== id)) : setFlexible(p => p.filter(e => e.id !== id));
  };

  const updateExpense = (type: "fixed" | "flexible", id: string, field: keyof ExpenseItem, val: any) => {
    const setter = type === "fixed" ? setFixed : setFlexible;
    setter(p => p.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  // Quick presets
  const applyPreset = (preset: string) => {
    setQuickPreset(preset);
    const presets: Record<string, { budget: number; days: number; fixed: any[]; flexible: any[] }> = {
      "student": {
        budget: 500, days: 30,
        fixed:    [{ id: uid(), label: "Bills & utilities", amount: 120, category: "Bills" }, { id: uid(), label: "Transport", amount: 60, category: "Transport" }],
        flexible: [{ id: uid(), label: "Food & groceries",  amount: 120, category: "Food" }, { id: uid(), label: "Entertainment", amount: 40, category: "Entertainment" }, { id: uid(), label: "Miscellaneous", amount: 30, category: "Miscellaneous" }],
      },
      "tight": {
        budget: 300, days: 30,
        fixed:    [{ id: uid(), label: "Transport", amount: 50, category: "Transport" }],
        flexible: [{ id: uid(), label: "Food & groceries", amount: 100, category: "Food" }, { id: uid(), label: "Essentials only", amount: 30, category: "Miscellaneous" }],
      },
      "paycheck": {
        budget: 800, days: 28,
        fixed:    [{ id: uid(), label: "Rent / share", amount: 300, category: "Rent" }, { id: uid(), label: "Bills", amount: 80, category: "Bills" }, { id: uid(), label: "Transport", amount: 70, category: "Transport" }],
        flexible: [{ id: uid(), label: "Food & groceries", amount: 150, category: "Food" }, { id: uid(), label: "Entertainment", amount: 60, category: "Entertainment" }, { id: uid(), label: "Miscellaneous", amount: 50, category: "Miscellaneous" }],
      },
    };
    const p = presets[preset];
    if (p) { setBudget(p.budget); setDays(p.days); setFixed(p.fixed); setFlexible(p.flexible); }
  };

  const ExpenseRow = ({ item, type }: { item: ExpenseItem; type: "fixed" | "flexible" }) => (
    <div className="flex items-center gap-2">
      <input value={item.label} onChange={e => updateExpense(type, item.id, "label", e.target.value)}
        placeholder={type === "fixed" ? "Expense name…" : "Spending category…"}
        className="flex-1 text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-indigo-400"
      />
      <div className="relative flex-shrink-0">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">{sym}</span>
        <input type="number" min="0" value={item.amount} onChange={e => updateExpense(type, item.id, "amount", e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="0"
          className="w-28 pl-6 pr-2 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-indigo-400"
        />
      </div>
      <button onClick={() => removeExpense(type, item.id)} className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Quick presets */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Quick start — or fill in your own</label>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "student",   label: "🎓 Student budget",      desc: "£500/mo, typical student" },
            { id: "tight",     label: "💸 Super tight",          desc: "£300/mo, bare minimum"   },
            { id: "paycheck",  label: "📅 Between paychecks",    desc: "£800/28 days"            },
          ].map(p => (
            <button key={p.id} onClick={() => applyPreset(p.id)} title={p.desc}
              className={`text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
                quickPreset === p.id ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Budget & timeframe */}
      <div className="border border-stone-200 rounded-sm overflow-hidden">
        <div className="px-5 py-4 bg-stone-50/40 border-b border-stone-100">
          <p className="text-xs font-black text-stone-500 uppercase tracking-wider">Budget & Timeframe</p>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 bg-white focus:outline-none focus:border-indigo-400">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
              Total money available <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">{sym}</span>
              <input type="number" min="0" value={budget} onChange={e => setBudget(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="500"
                className="w-full pl-8 pr-3 py-2.5 text-sm font-bold border border-stone-200 rounded-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
              Timeframe (days) <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input type="number" min="1" max="365" value={days} onChange={e => setDays(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="30"
                className="flex-1 px-3 py-2.5 text-sm font-bold border border-stone-200 rounded-sm focus:outline-none focus:border-indigo-400"
              />
              <div className="flex gap-1">
                {[[7,"7d"],[14,"14d"],[30,"30d"],[60,"60d"]].map(([n,l]) => (
                  <button key={n} onClick={() => setDays(Number(n))}
                    className={`text-[11px] font-bold px-2 py-1 rounded-sm border transition-colors ${days === n ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-stone-200 text-stone-400 hover:border-stone-400"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live preview */}
        {canGenerate && (
          <div className="mx-5 mb-4 grid grid-cols-3 gap-3">
            {[
              { label: "Daily budget",  value: fmt(daily, sym),              color: daily > 15 ? "#10b981" : daily > 8 ? "#f59e0b" : "#ef4444" },
              { label: "After fixed",  value: fmt(remaining, sym),            color: remaining > 0 ? "#10b981" : "#ef4444" },
              { label: "Total expenses", value: fmt(totalExpenses, sym),      color: "#6366f1" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-100 rounded-sm px-3 py-2.5 text-center">
                <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-stone-400 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed expenses */}
      <div className="border border-stone-200 rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-stone-50/40 border-b border-stone-100">
          <div>
            <p className="text-xs font-black text-stone-500 uppercase tracking-wider">Fixed Costs</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Unavoidable — rent, bills, transport, subscriptions</p>
          </div>
          <span className="text-sm font-black text-stone-700">{sym}{totalFixed.toLocaleString()}</span>
        </div>
        <div className="p-5 space-y-2.5">
          {fixed.map(item => <ExpenseRow key={item.id} item={item} type="fixed" />)}
          <button onClick={() => addExpense("fixed")}
            className="flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-indigo-600 transition-colors mt-2">
            <Plus className="w-3.5 h-3.5" />Add fixed expense
          </button>
        </div>
      </div>

      {/* Flexible expenses */}
      <div className="border border-stone-200 rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-stone-50/40 border-b border-stone-100">
          <div>
            <p className="text-xs font-black text-stone-500 uppercase tracking-wider">Flexible Spending</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Things you control — food, entertainment, misc</p>
          </div>
          <span className="text-sm font-black text-stone-700">{sym}{totalFlexible.toLocaleString()}</span>
        </div>
        <div className="p-5 space-y-2.5">
          {flexible.map(item => <ExpenseRow key={item.id} item={item} type="flexible" />)}
          <button onClick={() => addExpense("flexible")}
            className="flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-indigo-600 transition-colors mt-2">
            <Plus className="w-3.5 h-3.5" />Add flexible expense
          </button>
        </div>
      </div>

      {/* Warning if over budget */}
      {canGenerate && remaining < 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-sm px-4 py-3.5">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Your expenses exceed your budget by {sym}{Math.abs(remaining).toFixed(2)}</p>
            <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
              The plan will still generate — and will include specific suggestions for closing this gap. Don't panic; this is exactly what the tool is for.
            </p>
          </div>
        </div>
      )}

      {/* Generate button */}
      <button onClick={() => onGenerate({ totalBudget: Number(budget), currency, timeframeDays: Number(days), fixedExpenses: fixed.filter(e => Number(e.amount) > 0 || e.label.trim()), flexibleExpenses: flexible.filter(e => Number(e.amount) > 0 || e.label.trim()) })}
        disabled={!canGenerate}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-sm transition-colors shadow-sm">
        <Sparkles className="w-5 h-5" />Plan My Survival Budget
      </button>

      {/* What you get */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          { icon: Target,      label: "Daily survival limit",   color: "#6366f1" },
          { icon: Shield,      label: "Risk indicator",         color: "#f59e0b" },
          { icon: BarChart2,   label: "Week-by-week plan",      color: "#10b981" },
          { icon: Scissors,    label: "Cut suggestions",        color: "#ef4444" },
          { icon: Zap,         label: "Scenario testing",       color: "#f97316" },
          { icon: MessageSquare,label:"AI Budget Coach",        color: "#8b5cf6" },
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

// ─── AI Coach Panel ───────────────────────────────────────────────────────────

function CoachPanel({ context, sym, onInsufficientTokens }: { context: any; sym: string; onInsufficientTokens?: (info: TokenGateInfo) => void }) {
  // const currencyCode = context?.snapshot ? (context.snapshot.totalBudget > 1000 ? "USD" : "GBP") : "GBP";
  // const sym = CURRENCIES.find(c => c.code === currencyCode)?.sym ?? "£";
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: `I know your budget inside out. Daily limit: ${sym}${context?.snapshot?.dailyBudgetTotal?.toFixed(2) ?? "?"} — and I can see where every penny is going. Ask me anything: "Can I afford this?", "What should I cut first?", or "How do I make food budget stretch further?"` },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(p => [...p, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/budget-planner/coach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, context, history: messages.slice(-6) }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) {
          onInsufficientTokens({
            required: data.required ?? 0,
            balance:  data.balance  ?? 0,
            toolName: data.toolName ?? "Budget Planner AI Coach",
          });
        }
        setMessages(p => [...p, { role: "assistant", content: "You've run out of tokens to use the AI Coach. Please play some games to earn more tokens, then try again." }]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMessages(p => [...p, { role: "assistant", content: data.reply ?? "Sorry, I couldn't process that. Try again?" }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Network error — please try again." }]);
    }
    setLoading(false);
  };

  const STARTERS = [
    "Can I afford a £30 night out?",
    "What should I cut first?",
    "How do I make food budget last?",
    "What's my emergency daily minimum?",
  ];

  return (
    <div className="flex flex-col h-[480px] border border-stone-100 rounded-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-900">AI Budget Coach</p>
          <p className="text-[11px] text-indigo-600">Knows your full financial picture</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-indigo-500">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />Online
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-sm text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-stone-100 text-stone-800"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-100 rounded-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="text-xs text-stone-400">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starters */}
      {messages.length === 1 && (
        <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-stone-50">
          {STARTERS.map(s => (
            <button key={s} onClick={() => { setInput(s); }}
              className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-2.5 py-1.5 rounded-sm transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-stone-100">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask your budget coach…"
          className="flex-1 text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-indigo-400"
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="w-9 h-9 flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-sm transition-colors disabled:opacity-60 flex-shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Results Stage ────────────────────────────────────────────────────────────

function ResultsStage({ plan, inputData, onReset, onInsufficientTokens }: { plan: BudgetPlan; inputData: any; onReset: () => void; onInsufficientTokens?: (info: TokenGateInfo) => void }) {
  const [tab, setTab] = useState<"overview" | "weekly" | "cuts" | "scenarios" | "coach">("overview");
  const [copied, setCopied] = useState(false);

  const sym          = CURRENCIES.find(c => c.code === inputData.currency)?.sym ?? "£";
  const snap         = plan.snapshot;
  const riskColour   = snap.riskColour ?? "#6366f1";

  const copyShareText = () => {
    const text = `${plan.shareCard.headline}\n\n${plan.shareCard.stats}\n\nCreated with isaacpaha.com/tools/smart-budget-planner`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPlan = () => {
    const lines = [
      `SMART BUDGET SURVIVAL PLAN`,
      `Generated: ${new Date().toLocaleDateString("en-GB")}`,
      ``,
      `BUDGET: ${sym}${snap.totalBudget} over ${snap.timeframeDays} days`,
      `Daily limit: ${sym}${snap.dailyBudgetTotal.toFixed(2)}`,
      `Risk level: ${snap.riskLabel}`,
      ``,
      `HEADLINE: ${snap.headline}`,
      ``,
      `CATEGORY PLAN:`,
      ...plan.categoryPlan.map(c => `  ${c.category}: ${sym}${c.dailyAllocation.toFixed(2)}/day — ${c.tips}`),
      ``,
      `TOP CUT SUGGESTIONS:`,
      ...plan.cutSuggestions.slice(0, 3).map(c => `  ${c.category}: ${c.suggestion} (saves ${sym}${c.saving})`),
      ``,
      `WEEKLY TARGETS:`,
      ...plan.weeklyPlan.map(w => `  ${w.label} (Day ${w.startDay}-${w.endDay}): ${sym}${w.flexibleBudget.toFixed(2)} flexible — ${w.focus}`),
      ``,
      `SURVIVAL TIPS:`,
      ...plan.survivalTips.slice(0, 5).map(t => `  ${t.category}: ${t.tip} (saves ${t.potentialSaving})`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "budget-survival-plan.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: "overview",   label: "Overview",    icon: BarChart2    },
    { id: "weekly",     label: "Week-by-Week",icon: Calendar     },
    { id: "cuts",       label: "Cut + Tips",   icon: Scissors     },
    { id: "scenarios",  label: "Scenarios",   icon: Zap          },
    { id: "coach",      label: "AI Coach",    icon: MessageSquare },
  ] as const;

  return (
    <div className="space-y-5">

      {/* Score header */}
      <div className="bg-stone-900 text-white rounded-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Your Survival Plan</p>
            <h2 className="text-lg font-black text-white leading-snug max-w-sm">{snap.headline}</h2>
            <div className="mt-3">
              <RiskBadge level={snap.riskLevel} label={snap.riskLabel} colour={riskColour} />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={copyShareText}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Share</>}
            </button>
            <button onClick={downloadPlan}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              <Download className="w-3.5 h-3.5" />Download
            </button>
            <button onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              <RefreshCw className="w-3.5 h-3.5" />New plan
            </button>
          </div>
        </div>

        {/* Key numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Daily budget",     value: `${sym}${snap.dailyBudgetTotal.toFixed(2)}`,    sub: "total per day",  color: riskColour },
            { label: "Flexible/day",     value: `${sym}${snap.dailyBudgetFlexible.toFixed(2)}`, sub: "after fixed costs", color: "#6366f1" },
            { label: "Weekly budget",    value: `${sym}${snap.weeklyBudget.toFixed(0)}`,         sub: "per week",        color: "#8b5cf6" },
            { label: "Days viable",      value: snap.daysViable >= snap.timeframeDays ? "✓ Full" : `${snap.daysViable}d`, sub: `of ${snap.timeframeDays} days`, color: snap.daysViable >= snap.timeframeDays ? "#10b981" : "#ef4444" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-sm px-3 py-3 text-center">
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] font-semibold text-white/40 mt-0.5 leading-tight">{s.label}</p>
              <p className="text-[9px] text-white/25 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className={`border rounded-sm p-5 ${snap.riskLevel === "COMFORTABLE" || snap.riskLevel === "MANAGEABLE" ? "bg-green-50 border-green-200" : snap.riskLevel === "TIGHT" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
        <p className="text-sm leading-relaxed" style={{ color: snap.riskLevel === "COMFORTABLE" || snap.riskLevel === "MANAGEABLE" ? "#065f46" : snap.riskLevel === "TIGHT" ? "#92400e" : "#991b1b" }}>
          {snap.summary}
        </p>
      </div>

      {/* Motivation */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-sm px-4 py-4">
        <Lightbulb className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 leading-relaxed italic">{plan.motivation}</p>
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

      {/* ── OVERVIEW ────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Daily ring + category breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ring */}
            <div className="bg-white border border-stone-100 rounded-sm p-6 flex items-center justify-center">
              <DailyRing daily={snap.dailyBudgetFlexible} sym={sym} colour={riskColour} />
            </div>

            {/* Category bars */}
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Daily allocation</p>
              <div className="space-y-2.5">
                {plan.categoryPlan.slice(0, 7).map(c => {
                  const pct    = snap.dailyBudgetTotal > 0 ? (c.dailyAllocation / snap.dailyBudgetTotal) * 100 : 0;
                  const colour = c.type === "fixed" ? "#ef4444" : "#6366f1";
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-stone-600">{c.category}</span>
                        <span className="text-xs font-black" style={{ color: colour }}>{sym}{c.dailyAllocation.toFixed(2)}/d</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: colour }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Survival tips preview */}
          <div>
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Survival Mode Tips</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.survivalTips.slice(0, 4).map((tip, i) => (
                <div key={i} className="bg-white border border-stone-100 rounded-sm p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">{tip.category}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 ml-auto">{tip.potentialSaving}</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">{tip.tip}</p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: EFFORT_CFG[tip.effort]?.color, backgroundColor: `${EFFORT_CFG[tip.effort]?.color}15` }}>
                    {tip.effort} effort
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency mode */}
          {plan.emergencyPlan && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-red-500" />
                <p className="text-xs font-black text-red-700 uppercase tracking-wider">Emergency Mode — Bare Minimum</p>
                <span className="ml-auto text-sm font-black text-red-700">{sym}{plan.emergencyPlan.dailyLimit.toFixed(2)}/day</span>
              </div>
              <p className="text-xs text-red-700 mb-3 leading-relaxed">{plan.emergencyPlan.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1.5">Keep (essentials)</p>
                  <ul className="space-y-1">
                    {plan.emergencyPlan.essentials?.map((e, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-red-800">
                        <Check className="w-3 h-3 text-red-500" />{e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1.5">Cut entirely</p>
                  <ul className="space-y-1">
                    {plan.emergencyPlan.cutEntirely?.map((e, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-red-800">
                        <X className="w-3 h-3 text-red-500" />{e}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WEEK-BY-WEEK ────────────────────────────────────────────────── */}
      {tab === "weekly" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-sm px-4 py-3">
            <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Your {snap.timeframeDays}-day plan broken down week by week. Each week has its own flexible budget — stick to the daily limit and check in at each milestone.
            </p>
          </div>
          {plan.weeklyPlan?.map((week, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600">
                    W{week.week}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">{week.label}</p>
                    <p className="text-xs text-stone-400">Days {week.startDay}–{week.endDay}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black" style={{ color: riskColour }}>{sym}{week.flexibleBudget.toFixed(0)}</p>
                  <p className="text-[10px] text-stone-400">flexible budget</p>
                </div>
              </div>
              <div className="px-5 py-3">
                <div className="flex items-center gap-4 flex-wrap text-xs text-stone-500 mb-2">
                  <span>Daily limit: <span className="font-black text-stone-700">{sym}{week.dailyLimit.toFixed(2)}</span></span>
                  <span>Fixed: <span className="font-semibold text-stone-600">{sym}{week.fixedCosts.toFixed(0)}</span></span>
                  <span>Total: <span className="font-semibold text-stone-600">{sym}{week.totalBudget.toFixed(0)}</span></span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">🎯 {week.focus}</p>
                {week.milestone && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-indigo-600">
                    <Award className="w-3.5 h-3.5" />{week.milestone}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CUTS + TIPS ─────────────────────────────────────────────────── */}
      {tab === "cuts" && (
        <div className="space-y-5">
          {/* Cut suggestions */}
          {plan.cutSuggestions?.length > 0 && (
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">
                Where to cut — {plan.cutSuggestions.length} suggestions
              </p>
              <div className="space-y-3">
                {plan.cutSuggestions.map((c, i) => (
                  <div key={i} className="bg-white border border-stone-100 rounded-sm p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-bold text-stone-800">{c.category}</p>
                        <p className="text-xs text-stone-500">{sym}{c.currentAmount} → {sym}{c.suggestedAmount} per period</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-black text-emerald-600">saves {sym}{c.saving}</p>
                        <p className="text-[10px] text-stone-400">+{sym}{c.dailyImpact.toFixed(2)}/day</p>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed mb-2">{c.suggestion}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm"
                      style={{ color: DIFFICULTY_CFG[c.difficulty]?.color, backgroundColor: DIFFICULTY_CFG[c.difficulty]?.bg }}>
                      {c.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All survival tips */}
          {plan.survivalTips?.length > 0 && (
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">All survival tips</p>
              <div className="space-y-2">
                {plan.survivalTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{tip.category}</span>
                        <span className="text-[10px] font-semibold text-emerald-600 ml-auto">{tip.potentialSaving}</span>
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed">{tip.tip}</p>
                    </div>
                    <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-sm mt-1" style={{ color: EFFORT_CFG[tip.effort]?.color, backgroundColor: `${EFFORT_CFG[tip.effort]?.color}15` }}>
                      {tip.effort}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SCENARIOS ───────────────────────────────────────────────────── */}
      {tab === "scenarios" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-sm px-4 py-3">
            <Zap className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              "What if" simulations based on your numbers. See exactly how different choices affect your daily budget and runway.
            </p>
          </div>
          {plan.scenarios?.map((s, i) => (
            <div key={i} className={`border rounded-sm p-5 ${s.changeType === "emergency" ? "bg-red-50 border-red-200" : s.change > 0 ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-sm font-black" style={{ color: s.changeType === "emergency" ? "#991b1b" : s.change > 0 ? "#065f46" : "#1e3a8a" }}>
                  {s.name}
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-black" style={{ color: s.changeType === "emergency" ? "#ef4444" : s.change > 0 ? "#10b981" : "#3b82f6" }}>
                      {sym}{s.newDailyFlexible.toFixed(2)}/day
                    </p>
                    <p className="text-[10px] text-stone-400">new daily flexible</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-stone-700">{s.newDaysViable >= snap.timeframeDays ? "✓ Full period" : `${s.newDaysViable}d`}</p>
                    <p className="text-[10px] text-stone-400">viable</p>
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: s.changeType === "emergency" ? "#7f1d1d" : s.change > 0 ? "#14532d" : "#1e3a8a" }}>
                {s.impact}
              </p>
              <div className="flex items-start gap-1.5 text-xs text-stone-600">
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-stone-400" />
                <span>{s.howTo}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AI COACH ────────────────────────────────────────────────────── */}
      {tab === "coach" && (
        <CoachPanel 
          context={{ ...plan, ...inputData, currency: inputData.currency }} 
          sym={sym} 
          onInsufficientTokens={onInsufficientTokens}
        />
      )}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function BudgetPlannerTool({ isSignedIn = false, onInsufficientTokens }: { isSignedIn?: boolean; onInsufficientTokens?: (info: TokenGateInfo) => void }) {
  const [stage,    setStage]    = useState<"input" | "loading" | "results">("input");
  const [plan,     setPlan]     = useState<BudgetPlan | null>(null);
  const [inputData, setInputData] = useState<any>(null);
  const [error,    setError]    = useState("");
  const [loadStep, setLoadStep] = useState(0);

  const LOAD_STEPS = [
    "Crunching your numbers…",
    "Calculating daily survival limit…",
    "Building your week-by-week plan…",
    "Finding where to cut…",
    "Running scenario simulations…",
    "Briefing your AI coach…",
  ];

  const handleGenerate = async (data: any) => {
    setInputData(data);
    setStage("loading");
    setError("");
    setLoadStep(0);

    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 1200);

    try {
      const res  = await fetch("/api/tools/budget-planner/plan", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        onInsufficientTokens?.({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Budget Planner",
        });
        clearInterval(interval);
        setStage("input");
        setError("You've run out of tokens to generate a budget plan. Please play some games to earn more tokens, then try again.");
        return;
      }
      
      const body = await res.json();
      clearInterval(interval);
      if (!res.ok || !body.plan) {
        setError(body.error ?? "Plan generation failed — please try again.");
        setStage("input");
        return;
      }
      setPlan(body.plan);
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
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">💸</div>
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-sm font-semibold text-stone-600">
                {LOAD_STEPS[loadStep]}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-stone-400 mt-1">Building your personalised survival plan…</p>
          </div>
          <div className="flex gap-1.5">
            {LOAD_STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-indigo-400" : "bg-stone-200"}`} />
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

      {stage === "input"   && <InputStage onGenerate={handleGenerate} />}
      {stage === "results" && plan && (
        <ResultsStage
          plan={plan} inputData={inputData}
          onReset={() => { setStage("input"); setPlan(null); }}
        />
      )}
    </div>
  );
}