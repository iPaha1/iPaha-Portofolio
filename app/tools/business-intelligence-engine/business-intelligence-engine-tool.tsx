"use client";

// =============================================================================
// isaacpaha.com — Business Intelligence Engine — Core Tool
// app/tools/business-intelligence-engine/_business-intelligence/business-intelligence-tool.tsx
// =============================================================================

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence }      from "framer-motion";
import {
  Sparkles, Loader2, AlertCircle, X, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, Save, Star, ArrowRight, Zap, Target,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  BarChart2, DollarSign, Users, Globe, Shield, Lightbulb,
  FileText, Presentation, Map, Calculator, Building2,
  Scale, Flame, Award, Clock, Plus, ChevronRight,
} from "lucide-react";
import { BusinessIdea } from "./_business-intelligence-engine/business-intelligence-engine-page";

export interface TokenGateInfo { required: number; balance: number; toolName: string | null; }
export interface BusinessIntelligenceToolProps {
  isSignedIn?:           boolean;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
  reopenIdea?:           BusinessIdea | null;  // Add this
  onReopened?:           () => void;            // Add this
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#10b981";

const VERDICT_CFG: Record<string, { label: string; color: string; bg: string; border: string; emoji: string; advice: string }> = {
  STRONG_BUY:     { label: "Strong Opportunity",   color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", emoji: "🚀", advice: "Pursue this aggressively. The fundamentals are strong." },
  BUY:            { label: "Good Opportunity",      color: "#10b981", bg: "#d1fae5", border: "#a7f3d0", emoji: "✅", advice: "Real potential here. Address the risks and move fast." },
  HOLD:           { label: "Proceed With Caution",  color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d", emoji: "⚠️",  advice: "Merit exists but gaps need addressing before committing fully." },
  NEEDS_WORK:     { label: "Significant Gaps",      color: "#f97316", bg: "#ffedd5", border: "#fdba74", emoji: "🔧", advice: "Core assumptions need stress-testing. Validate before investing further." },
  PIVOT_REQUIRED: { label: "Pivot Required",        color: "#ef4444", bg: "#fee2e2", border: "#fca5a5", emoji: "🔄", advice: "Fundamental issues identified. See pivot suggestions below." },
};

const BUSINESS_STAGES = [
  { id: "IDEA",           label: "Just an idea",        emoji: "💡" },
  { id: "VALIDATION",     label: "Testing assumptions",  emoji: "🧪" },
  { id: "MVP",            label: "MVP exists",           emoji: "🛠️" },
  { id: "EARLY_TRACTION", label: "Early traction",       emoji: "📈" },
  { id: "GROWTH",         label: "Scaling",              emoji: "🚀" },
  { id: "ESTABLISHED",    label: "Operating business",   emoji: "🏢" },
];

const BUSINESS_MODELS = [
  { id: "SAAS",         label: "SaaS",               emoji: "💻" },
  { id: "MARKETPLACE",  label: "Marketplace",         emoji: "🏪" },
  { id: "E_COMMERCE",   label: "E-Commerce",          emoji: "🛒" },
  { id: "SUBSCRIPTION", label: "Subscription",        emoji: "🔄" },
  { id: "AGENCY",       label: "Agency / Services",   emoji: "🤝" },
  { id: "CONTENT",      label: "Content / Media",     emoji: "📱" },
  { id: "HARDWARE",     label: "Hardware / Product",  emoji: "📦" },
  { id: "FREEMIUM",     label: "Freemium",            emoji: "🆓" },
  { id: "FRANCHISE",    label: "Franchise",           emoji: "🏬" },
  { id: "OTHER",        label: "Other",               emoji: "✨" },
];

const ANALYSE_MODES = [
  { id: "validate",    label: "Full Validation",     emoji: "🎯", desc: "Complete 5-dimension idea assessment" },
  { id: "quick",       label: "Quick Check",         emoji: "⚡", desc: "Instant verdict in 30 seconds"         },
  { id: "market",      label: "Market Analysis",     emoji: "📊", desc: "TAM/SAM/SOM + customer personas"       },
  { id: "competition", label: "Competitive Intel",   emoji: "🔍", desc: "Competitors decoded + moat strategy"   },
  { id: "revenue",     label: "Revenue Model",       emoji: "💰", desc: "Unit economics + 3-year projections"   },
];

const PLAN_MODES = [
  { id: "full_plan",         label: "Full Business Plan",  emoji: "📋", desc: "Complete investor-ready document"      },
  { id: "executive_summary", label: "Executive Summary",   emoji: "⭐", desc: "Killer one-pager for investors"        },
  { id: "go_to_market",      label: "Go-To-Market",        emoji: "🗺️", desc: "Channel strategy + first customers"    },
  { id: "pitch_deck",        label: "Pitch Deck Brief",    emoji: "🎭", desc: "12-slide deck with speaker notes"      },
  { id: "financial_model",   label: "Financial Model",     emoji: "📈", desc: "3-year projections + unit economics"   },
  { id: "operations",        label: "Operational Plan",    emoji: "⚙️", desc: "First 90 days + team + systems"        },
];

// ─── Helper components ────────────────────────────────────────────────────────

function CopyBtn({ text, className = "", label }: { text: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 text-xs font-bold border transition-all rounded-sm px-3 py-1.5 ${
        copied ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-400 border-stone-200 hover:border-stone-400"
      } ${className}`}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ScoreBar({ score, max = 20, color }: { score: number; max?: number; color: string }) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-stone-50 transition-colors">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
        <span className="text-sm font-black text-stone-900 flex-1">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-5 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Results Renderers ────────────────────────────────────────────────────────

function ValidationResults({ result, onGeneratePlan, onSave, isSignedIn, ideaId, saving, saved }: {
  result: any; onGeneratePlan: () => void; onSave: () => void;
  isSignedIn: boolean; ideaId: string | null; saving: boolean; saved: boolean;
}) {
  const verdict = VERDICT_CFG[result.verdict] ?? VERDICT_CFG.HOLD;
  const scorecards = result.scorecards ?? {};
  const [activeTab, setActiveTab] = useState<"verdict" | "market" | "competition" | "model" | "plan" | "risks">("verdict");

  const TABS = [
    { id: "verdict",     label: "Verdict",     icon: Scale       },
    { id: "market",      label: "Market",      icon: BarChart2   },
    { id: "competition", label: "Competition", icon: Shield      },
    { id: "model",       label: "Model",       icon: DollarSign  },
    { id: "plan",        label: "90-Day Plan", icon: Map         },
    { id: "risks",       label: "Risks",       icon: AlertTriangle},
  ] as const;

  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Verdict header */}
      <div className="rounded-sm overflow-hidden border"
        style={{ backgroundColor: verdict.bg, borderColor: verdict.border }}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{verdict.emoji}</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: verdict.color }}>Validation Verdict</p>
                  <p className="text-2xl font-black" style={{ color: verdict.color }}>{verdict.label}</p>
                </div>
              </div>
              <p className="text-sm font-semibold leading-relaxed" style={{ color: verdict.color }}>{verdict.advice}</p>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="text-5xl font-black" style={{ color: verdict.color }}>{result.overallScore}</div>
              <div className="text-xs font-bold" style={{ color: verdict.color }}>/ 100</div>
            </div>
          </div>

          {/* Scorecards */}
          {Object.keys(scorecards).length > 0 && (
            <div className="grid grid-cols-1 gap-2.5">
              {Object.entries(scorecards).map(([key, val]: [string, any]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold capitalize" style={{ color: verdict.color }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-xs font-black" style={{ color: verdict.color }}>{val.score}/20</span>
                  </div>
                  <ScoreBar score={val.score} max={20} color={verdict.color} />
                  <p className="text-[11px] mt-1" style={{ color: verdict.color }}>{val.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Executive summary + honest talk */}
        <div className="border-t px-6 py-4" style={{ borderColor: verdict.border }}>
          <p className="text-sm font-semibold leading-relaxed mb-3" style={{ color: verdict.color }}>
            {result.executiveSummary}
          </p>
          {result.theBigQuestion && (
            <div className="rounded-sm px-4 py-3" style={{ background: "rgba(0,0,0,.04)" }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: verdict.color }}>The Big Question</p>
              <p className="text-sm font-black italic" style={{ color: verdict.color }}>"{result.theBigQuestion}"</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="border-t px-6 py-4 flex items-center gap-3 flex-wrap" style={{ borderColor: verdict.border }}>
          <button onClick={onGeneratePlan}
            className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-sm transition-colors"
            style={{ backgroundColor: ACCENT }}>
            <FileText className="w-4 h-4" />Generate Full Business Plan
          </button>
          {isSignedIn && (
            <button onClick={onSave} disabled={saving || saved}
              className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2.5 rounded-sm transition-all ${
                saved ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "border-stone-300 text-stone-600 hover:border-stone-500"
              }`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Saved!" : "Save Idea"}
            </button>
          )}
        </div>
      </div>

      {/* Detail tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── VERDICT tab ── */}
      {activeTab === "verdict" && (
        <div className="space-y-4">
          {result.strengthsAndRisks && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-stone-100 rounded-sm p-5">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-3">✅ Genuine Strengths</p>
                {result.strengthsAndRisks.genuineStrengths?.map((s: any, i: number) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <p className="text-xs font-bold text-stone-800 mb-0.5">{s.strength}</p>
                    <p className="text-[11px] text-stone-500 leading-relaxed">{s.why}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-stone-100 rounded-sm p-5">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-3">⚠️ Critical Risks</p>
                {result.strengthsAndRisks.criticalRisks?.map((r: any, i: number) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm text-white"
                        style={{ background: r.severity === "HIGH" ? "#ef4444" : r.severity === "MEDIUM" ? "#f59e0b" : "#6b7280" }}>
                        {r.severity}
                      </span>
                      <p className="text-xs font-bold text-stone-800">{r.risk}</p>
                    </div>
                    <p className="text-[11px] text-stone-500">{r.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.strengthsAndRisks?.killerRisks?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-4">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">🚨 Could Kill This Entirely</p>
              {result.strengthsAndRisks.killerRisks.map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{r}
                </div>
              ))}
            </div>
          )}
          {result.strengthsAndRisks?.hiddenOpportunities?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">💡 Hidden Opportunities</p>
              {result.strengthsAndRisks.hiddenOpportunities.map((o: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-700 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />{o}
                </div>
              ))}
            </div>
          )}
          {result.theHonestTalk && (
            <div className="rounded-sm px-4 py-4" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `4px solid ${ACCENT}` }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: ACCENT }}>💬 The Honest Talk</p>
              <p className="text-sm font-semibold text-stone-800 leading-relaxed">{result.theHonestTalk}</p>
            </div>
          )}
          {result.pivotSuggestions?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">🔄 Pivot Suggestions</p>
              {result.pivotSuggestions.map((p: any, i: number) => (
                <div key={i} className="mb-3 last:mb-0 border-b border-stone-50 pb-3 last:border-0">
                  <p className="text-xs font-bold text-stone-800 mb-0.5">{p.pivot}</p>
                  <p className="text-[11px] text-stone-500">{p.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MARKET tab ── */}
      {activeTab === "market" && result.marketAnalysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "TAM", value: result.marketAnalysis.tam, color: ACCENT },
              { label: "SAM", value: result.marketAnalysis.sam, color: "#3b82f6" },
              { label: "SOM", value: result.marketAnalysis.som, color: "#8b5cf6" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</p>
                <p className="text-sm font-black text-stone-900">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Market Timing</p>
              <p className="text-xs text-stone-700 leading-relaxed">{result.marketAnalysis.marketTiming}</p>
            </div>
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Growth Trend: <span style={{ color: ACCENT }}>{result.marketAnalysis.growthTrend}</span></p>
              <p className="text-xs text-stone-700 leading-relaxed">{result.marketAnalysis.growthExplained}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.marketAnalysis.tailwinds?.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-4">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">Tailwinds</p>
                {result.marketAnalysis.tailwinds.map((t: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-emerald-800 mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{t}
                  </div>
                ))}
              </div>
            )}
            {result.marketAnalysis.headwinds?.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-sm p-4">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">Headwinds</p>
                {result.marketAnalysis.headwinds.map((h: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-800 mb-1.5">
                    <TrendingDown className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{h}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMPETITION tab ── */}
      {activeTab === "competition" && result.competitiveAnalysis && (
        <div className="space-y-4">
          {result.competitiveAnalysis.whitespace && (
            <div className="rounded-sm px-4 py-4" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `4px solid ${ACCENT}` }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Your Whitespace</p>
              <p className="text-sm font-semibold text-stone-800">{result.competitiveAnalysis.whitespace}</p>
            </div>
          )}
          {result.competitiveAnalysis.directCompetitors?.map((c: any, i: number) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
                <div>
                  <p className="text-sm font-black text-stone-900">{c.name}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{c.strength}</p>
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-sm text-white flex-shrink-0"
                  style={{ background: c.threat === "HIGH" ? "#ef4444" : c.threat === "MEDIUM" ? "#f59e0b" : "#10b981" }}>
                  {c.threat} threat
                </span>
              </div>
              <div className="px-5 py-3">
                <p className="text-xs text-stone-500 mb-1"><span className="font-bold text-stone-700">Weakness: </span>{c.weakness}</p>
              </div>
            </div>
          ))}
          {result.competitiveAnalysis.moatPotential && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Moat Potential</p>
              <p className="text-xs text-stone-700 leading-relaxed">{result.competitiveAnalysis.moatPotential}</p>
            </div>
          )}
        </div>
      )}

      {/* ── MODEL tab ── */}
      {activeTab === "model" && result.businessModelAnalysis && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Model Fit</p>
            <p className="text-xs text-stone-700 leading-relaxed">{result.businessModelAnalysis.modelFit}</p>
          </div>
          {result.businessModelAnalysis.unitEconomics && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Unit Economics</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Est. CAC",        value: result.businessModelAnalysis.unitEconomics.estimatedCAC   },
                  { label: "Est. LTV",        value: result.businessModelAnalysis.unitEconomics.estimatedLTV   },
                  { label: "LTV:CAC",         value: result.businessModelAnalysis.unitEconomics.ltvCacRatio    },
                  { label: "Payback Period",  value: result.businessModelAnalysis.unitEconomics.paybackPeriod  },
                  { label: "Gross Margin",    value: result.businessModelAnalysis.grossMarginExpectation       },
                ].filter(s => s.value).map(s => (
                  <div key={s.label} className="bg-stone-50 rounded-sm p-3">
                    <p className="text-[10px] text-stone-400">{s.label}</p>
                    <p className="text-sm font-black text-stone-900 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.businessModelAnalysis.pricingStrategy && (
            <div className="rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}06`, borderLeft: `3px solid ${ACCENT}` }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Pricing Strategy</p>
              <p className="text-sm text-stone-700 leading-relaxed">{result.businessModelAnalysis.pricingStrategy}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 90-DAY PLAN tab ── */}
      {activeTab === "plan" && result.validationPlan && (
        <div className="space-y-4">
          {result.validationPlan.mvpConcept && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">MVP Concept</p>
              <p className="text-sm text-stone-700 leading-relaxed">{result.validationPlan.mvpConcept}</p>
            </div>
          )}
          {result.validationPlan.firstCustomerStrategy && (
            <div className="rounded-sm px-4 py-4" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `4px solid ${ACCENT}` }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>First 10 Customers</p>
              <p className="text-sm font-semibold text-stone-800 leading-relaxed">{result.validationPlan.firstCustomerStrategy}</p>
            </div>
          )}
          {result.validationPlan.assumptions?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Key Assumptions to Test</p>
              {result.validationPlan.assumptions.map((a: any, i: number) => (
                <div key={i} className="border-b border-stone-50 pb-3 mb-3 last:border-0 last:mb-0">
                  <p className="text-xs font-bold text-stone-800 mb-1">{a.assumption}</p>
                  <p className="text-[11px] text-stone-500"><span className="font-bold">Test: </span>{a.testMethod}</p>
                  <p className="text-[11px] text-stone-500"><span className="font-bold">Success when: </span>{a.successCriteria}</p>
                </div>
              ))}
            </div>
          )}
          {result.validationPlan.timeline90Days && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">90-Day Plan</p>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{result.validationPlan.timeline90Days}</p>
            </div>
          )}
        </div>
      )}

      {/* ── RISKS tab ── */}
      {activeTab === "risks" && (
        <div className="space-y-3">
          {result.strengthsAndRisks?.criticalRisks?.map((r: any, i: number) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-xs font-bold text-stone-800">{r.risk}</p>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-sm text-white flex-shrink-0"
                  style={{ background: r.severity === "HIGH" ? "#ef4444" : r.severity === "MEDIUM" ? "#f59e0b" : "#6b7280" }}>
                  {r.severity}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">{r.mitigation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanResults({ result, mode, saving, saved, onSave }: {
  result: any; mode: string; saving: boolean; saved: boolean; onSave: () => void;
}) {
  const [activeSection, setActiveSection] = useState(0);

  const getCopyText = () => JSON.stringify(result, null, 2);

  // Pitch deck sections
  if (mode === "pitch_deck" && result.slides) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-stone-900">Pitch Deck — {result.slides.length} Slides</p>
          <CopyBtn text={getCopyText()} label="Export JSON" />
        </div>
        {result.slides.map((slide: any, i: number) => (
          <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
            <button onClick={() => setActiveSection(activeSection === i ? -1 : i)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-stone-50 transition-colors">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ backgroundColor: ACCENT }}>
                {slide.slideNumber}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-stone-800">{slide.title}</p>
                <p className="text-[10px] text-stone-400">{slide.headline}</p>
              </div>
              {activeSection === i ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>
            <AnimatePresence>
              {activeSection === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                  <div className="border-t border-stone-100 px-5 py-4 space-y-3">
                    {slide.keyPoints?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Key Points</p>
                        {slide.keyPoints.map((p: string, pi: number) => (
                          <div key={pi} className="flex items-start gap-2 text-xs text-stone-700 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: ACCENT }} />{p}
                          </div>
                        ))}
                      </div>
                    )}
                    {slide.design && (
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Design</p>
                        <p className="text-xs text-stone-600 italic">{slide.design}</p>
                      </div>
                    )}
                    {slide.speakerNotes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-sm px-3 py-2.5">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">Speaker Notes</p>
                        <p className="text-xs text-amber-800 leading-relaxed">{slide.speakerNotes}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {result.commonInvestorQuestions?.length > 0 && (
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Likely Investor Questions</p>
            {result.commonInvestorQuestions.map((q: any, i: number) => (
              <div key={i} className="mb-3 last:mb-0 pb-3 border-b border-stone-50 last:border-0">
                <p className="text-xs font-bold text-stone-800 mb-1">"{q.question}"</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">{q.bestAnswer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Financial model
  if (mode === "financial_model" && result.annualSummary) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-stone-900">Financial Model</p>
          <CopyBtn text={getCopyText()} label="Export" />
        </div>
        <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider px-5 py-3 border-b border-stone-100">Annual Projections</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ background: "#f5f5f5" }}>
                {["Year", "Customers", "ARR", "Revenue", "Gross Profit", "EBITDA", "Headcount"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-stone-500 font-black text-[10px] uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {result.annualSummary.map((y: any, i: number) => (
                  <tr key={i} className="border-t border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-black" style={{ color: ACCENT }}>Year {y.year}</td>
                    <td className="px-4 py-3 text-stone-700">{y.customers?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-stone-700">{y.arr}</td>
                    <td className="px-4 py-3 text-stone-700">{y.revenue}</td>
                    <td className="px-4 py-3 text-stone-700">{y.grossProfit}</td>
                    <td className="px-4 py-3" style={{ color: y.ebitda?.startsWith("-") ? "#ef4444" : "#10b981" }}>{y.ebitda}</td>
                    <td className="px-4 py-3 text-stone-700">{y.headcount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {result.breakEvenAnalysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Break-even Month", value: result.breakEvenAnalysis.breakEvenMonth, suffix: "" },
              { label: "Break-even Revenue", value: result.breakEvenAnalysis.breakEvenRevenue, suffix: "" },
              { label: "Break-even Customers", value: result.breakEvenAnalysis.breakEvenCustomers, suffix: "" },
              { label: "Cash to Break-even", value: result.breakEvenAnalysis.cashNeededToBreakEven, suffix: "" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-3">
                <p className="text-[10px] text-stone-400">{s.label}</p>
                <p className="text-sm font-black mt-0.5" style={{ color: ACCENT }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
        {result.scenarioAnalysis && (
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Scenario Analysis</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Bear Case", data: result.scenarioAnalysis.bear, color: "#ef4444" },
                { label: "Base Case", data: result.scenarioAnalysis.base, color: ACCENT    },
                { label: "Bull Case", data: result.scenarioAnalysis.bull, color: "#8b5cf6" },
              ].map(s => (
                <div key={s.label} className="rounded-sm p-3 text-center"
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}25` }}>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-xs text-stone-500 mb-2">{s.data?.assumption}</p>
                  <p className="text-xs font-bold text-stone-700">Y1: {s.data?.year1Revenue}</p>
                  <p className="text-xs font-bold text-stone-700">Y3: {s.data?.year3Revenue}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full plan / exec summary / GTM / operations — generic rich display
  const allKeys = Object.keys(result).filter(k => k !== "error");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-stone-900">{result.planTitle ?? result.headline ?? "Business Plan"}</p>
          {result.version && <p className="text-[10px] text-stone-400">v{result.version} · {result.dateCreated}</p>}
        </div>
        <div className="flex gap-2">
          <CopyBtn text={getCopyText()} label="Export JSON" />
          {onSave && (
            <button onClick={onSave} disabled={saving || saved}
              className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-sm transition-all ${
                saved ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-500 border-stone-200 hover:border-stone-400"
              }`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Saved!" : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* Dynamic section renderer for complex plans */}
      {allKeys.map(key => {
        const val = result[key];
        if (!val || (typeof val === "object" && Object.keys(val).length === 0)) return null;
        const humanKey = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());

        if (typeof val === "string" && val.length > 10) {
          return (
            <div key={key} className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">{humanKey}</p>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{val}</p>
            </div>
          );
        }
        if (Array.isArray(val) && val.length > 0) {
          return (
            <div key={key} className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">{humanKey}</p>
              {val.map((item: any, i: number) => {
                if (typeof item === "string") {
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs text-stone-700 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: ACCENT }} />{item}
                    </div>
                  );
                }
                if (typeof item === "object") {
                  const firstStr = Object.values(item).find(v => typeof v === "string") as string;
                  const entries = Object.entries(item);
                  return (
                    <div key={i} className="border-b border-stone-50 pb-3 mb-3 last:border-0 last:mb-0">
                      {entries.map(([k, v]) => typeof v === "string" && (
                        <p key={k} className="text-xs text-stone-700 mb-0.5">
                          <span className="font-bold capitalize">{k.replace(/([A-Z])/g, " $1").trim()}: </span>{v}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          );
        }
        if (typeof val === "object" && !Array.isArray(val)) {
          return (
            <div key={key} className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">{humanKey}</p>
              <div className="space-y-2">
                {Object.entries(val).map(([k, v]) => typeof v === "string" && (
                  <div key={k} className="flex items-start gap-2 text-xs">
                    <span className="font-bold text-stone-500 capitalize flex-shrink-0" style={{ minWidth: 120 }}>
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-stone-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function BusinessIntelligenceTool({ isSignedIn = false, onInsufficientTokens, reopenIdea, onReopened }: BusinessIntelligenceToolProps) {
  const [appStage,    setAppStage]    = useState<"input" | "loading" | "results">("input");
  const [result,      setResult]      = useState<any>(null);
  const [activeMode,  setActiveMode]  = useState("validate");
  const [planMode,    setPlanMode]    = useState("full_plan");
  const [activePanel, setActivePanel] = useState<"validate" | "plan">("validate");
  const [error,       setError]       = useState("");
  const [loadStep,    setLoadStep]    = useState(0);
  const [currentMode, setCurrentMode] = useState("validate"); // mode used for current result

  // Input state
  const [ideaName,          setIdeaName]          = useState("");
  const [description,       setDescription]       = useState("");
  const [industry,          setIndustry]          = useState("");
  const [targetMarket,      setTargetMarket]      = useState("");
  const [problemSolved,     setProblemSolved]     = useState("");
  const [uniqueAdvantage,   setUniqueAdvantage]   = useState("");
  const [stage,             setStage]             = useState("IDEA");
  const [businessModel,     setBusinessModel]     = useState("OTHER");
  const [location,          setLocation]          = useState("");
  const [budget,            setBudget]            = useState("");
  const [founderBackground, setFounderBackground] = useState("");
  const [showAdvanced,      setShowAdvanced]      = useState(false);

  // Save state
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [ideaId,    setIdeaId]    = useState<string | null>(null);

  // ── Reopen a saved idea from dashboard ──────────────────────────────
  useEffect(() => {
    if (!reopenIdea) return;
    
    try {
      const reopenedIdeaData = reopenIdea as BusinessIdea & {
        resultJson?: string | null;
        planType?: string | null;
      };
      
      // Populate the input fields from the saved idea
      setIdeaName(reopenIdea.ideaName ?? "");
      setIndustry(reopenIdea.industry ?? "");
      setBusinessModel(reopenIdea.businessModel ?? "OTHER");
      setStage(reopenIdea.stage ?? "IDEA");
      
      // If there's a resultJson field with the full analysis result
      if (reopenedIdeaData.resultJson) {
        const savedResult = JSON.parse(reopenedIdeaData.resultJson);
        setResult(savedResult);
        
        // Determine if this was a validation or plan result
        if (savedResult.verdict || savedResult.overallScore) {
          setCurrentMode("validate");
          setActivePanel("validate");
        } else if (savedResult.annualSummary || savedResult.slides) {
          setCurrentMode(reopenedIdeaData.planType ?? "full_plan");
          setActivePanel("plan");
        }
        
        setAppStage("results");
      } else {
        // If no saved result, just go to input with pre-filled fields
        setAppStage("input");
      }
      
      onReopened?.();
    } catch (err) {
      console.error("Failed to parse saved idea:", err);
      setAppStage("input");
    }
  }, [reopenIdea]);

  const VALIDATE_LOAD = [
    "Reading your business idea…", "Analysing the market opportunity…",
    "Scanning the competitive landscape…", "Modelling the business economics…",
    "Writing your honest assessment…",
  ];
  const PLAN_LOAD = [
    "Synthesising your validation data…", "Building your market strategy…",
    "Modelling your financials…", "Writing your business plan…",
    "Finalising investor-ready document…",
  ];

  const getIdeaPayload = () => ({
    ideaName, description, industry, targetMarket, problemSolved,
    uniqueAdvantage, stage, businessModel, location, budget, founderBackground,
  });

  const handleAnalyse = async () => {
    if (!ideaName.trim() || !description.trim()) return;
    setAppStage("loading"); setError(""); setLoadStep(0); setResult(null);
    const steps = VALIDATE_LOAD;
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, steps.length - 1)), 1300);
    try {
      const res = await fetch("/api/tools/business-intelligence/analyse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...getIdeaPayload(), mode: activeMode }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Business Intelligence Engine" });
        clearInterval(interval); setAppStage("input");
        setError("You're out of tokens. Play some games to earn more."); return;
      }
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.result) { setError(data.error ?? "Analysis failed."); setAppStage("input"); return; }
      setResult(data.result);
      setCurrentMode(activeMode);
      setActivePanel("validate");
      setAppStage("results");
    } catch { clearInterval(interval); setError("Network error — please try again."); setAppStage("input"); }
  };

  const handleGeneratePlan = async () => {
    setAppStage("loading"); setError(""); setLoadStep(0); setResult(null);
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, PLAN_LOAD.length - 1)), 1400);
    try {
      const res = await fetch("/api/tools/business-intelligence/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...getIdeaPayload(), mode: planMode }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Business Plan Generator" });
        clearInterval(interval); setAppStage("results"); return;
      }
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.result) { setError(data.error ?? "Plan generation failed."); setAppStage("results"); return; }
      setResult(data.result);
      setCurrentMode(planMode);
      setActivePanel("plan");
      setAppStage("results");
    } catch { clearInterval(interval); setError("Network error."); setAppStage("results"); }
  };

  const handleSave = async () => {
    if (!isSignedIn) return;
    setSaving(true);
    const payload = { ...getIdeaPayload() };
    const type = ["validate", "quick", "market", "competition", "revenue"].includes(currentMode) ? "validation" : "plan";
    const res = await fetch(ideaId ? `/api/tools/business-intelligence/save?type=${type}` : "/api/tools/business-intelligence/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload, id: ideaId,
        validationResult: type === "validation" ? result : null,
        planResult:       type === "plan" ? result : null,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setSaved(true); if (data.ideaId) setIdeaId(data.ideaId);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  // ── INPUT ──────────────────────────────────────────────────────────────────
  if (appStage === "input") return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Analysis type */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">What do you want to know?</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
          {ANALYSE_MODES.map(m => (
            <button key={m.id} onClick={() => { setActiveMode(m.id); setActivePanel("validate"); }}
              className={`flex flex-col items-start gap-1 p-3 rounded-sm border text-left transition-all ${
                activeMode === m.id && activePanel === "validate" ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
              }`}
              style={activeMode === m.id && activePanel === "validate" ? { backgroundColor: ACCENT } : {}}>
              <span className="text-xl">{m.emoji}</span>
              <span className={`text-[10px] font-black leading-tight ${activeMode === m.id && activePanel === "validate" ? "text-white" : "text-stone-800"}`}>{m.label}</span>
              <span className={`text-[9px] leading-tight ${activeMode === m.id && activePanel === "validate" ? "text-white/70" : "text-stone-400"}`}>{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Plan generation options */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Or jump straight to:</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {PLAN_MODES.map(m => (
            <button key={m.id} onClick={() => { setPlanMode(m.id); setActivePanel("plan"); }}
              className={`flex items-center gap-2 p-3 rounded-sm border text-left transition-all ${
                planMode === m.id && activePanel === "plan" ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
              }`}
              style={planMode === m.id && activePanel === "plan" ? { backgroundColor: "#6366f1" } : {}}>
              <span className="text-lg flex-shrink-0">{m.emoji}</span>
              <div>
                <p className={`text-[10px] font-black ${planMode === m.id && activePanel === "plan" ? "text-white" : "text-stone-800"}`}>{m.label}</p>
                <p className={`text-[9px] ${planMode === m.id && activePanel === "plan" ? "text-white/70" : "text-stone-400"}`}>{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Core inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Business / Idea Name *</label>
          <input value={ideaName} onChange={e => setIdeaName(e.target.value)}
            placeholder="e.g. AI-powered inventory management for small retailers"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Describe Your Idea *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder="What does it do, who is it for, and how does it work? The more detail, the better the analysis…"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400 resize-none" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Industry</label>
          <input value={industry} onChange={e => setIndustry(e.target.value)}
            placeholder="e.g. Retail Tech, HealthTech, SaaS"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Location / Target Market</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="e.g. UK, US, Europe, Global"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400" />
        </div>
      </div>

      {/* Stage + Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Current Stage</label>
          <div className="space-y-1">
            {BUSINESS_STAGES.map(s => (
              <button key={s.id} onClick={() => setStage(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm border text-xs transition-all ${
                  stage === s.id ? "text-white border-transparent" : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                }`}
                style={stage === s.id ? { backgroundColor: ACCENT } : {}}>
                <span>{s.emoji}</span><span className="font-bold">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Business Model</label>
          <div className="grid grid-cols-2 gap-1">
            {BUSINESS_MODELS.map(m => (
              <button key={m.id} onClick={() => setBusinessModel(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-sm border text-xs transition-all ${
                  businessModel === m.id ? "text-white border-transparent" : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                }`}
                style={businessModel === m.id ? { backgroundColor: ACCENT } : {}}>
                <span>{m.emoji}</span><span className="font-bold truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced */}
      <div>
        <button onClick={() => setShowAdvanced(p => !p)}
          className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-700">
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          More details (problem, advantage, budget, founder background)
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Problem Being Solved</label>
                  <textarea value={problemSolved} onChange={e => setProblemSolved(e.target.value)} rows={2}
                    placeholder="What specific problem does this solve?"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400 resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Unique Advantage</label>
                  <textarea value={uniqueAdvantage} onChange={e => setUniqueAdvantage(e.target.value)} rows={2}
                    placeholder="Why is this different from what exists?"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400 resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Target Customer</label>
                  <input value={targetMarket} onChange={e => setTargetMarket(e.target.value)}
                    placeholder="Who specifically buys this?"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Available Budget</label>
                  <input value={budget} onChange={e => setBudget(e.target.value)}
                    placeholder="e.g. £5,000–£20,000, bootstrapped"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Founder Background</label>
                  <textarea value={founderBackground} onChange={e => setFounderBackground(e.target.value)} rows={2}
                    placeholder="Your relevant experience, skills, network — what makes you the right person to build this?"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400 resize-none" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button onClick={activePanel === "validate" ? handleAnalyse : handleGeneratePlan}
        disabled={!ideaName.trim() || !description.trim()}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white py-4 rounded-sm transition-colors shadow-sm disabled:opacity-40"
        style={{ backgroundColor: activePanel === "validate" ? ACCENT : "#6366f1" }}>
        <Sparkles className="w-5 h-5" />
        {activePanel === "validate"
          ? `${ANALYSE_MODES.find(m => m.id === activeMode)?.label ?? "Validate My Idea"}`
          : `${PLAN_MODES.find(m => m.id === planMode)?.label ?? "Generate Plan"}`}
      </button>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (appStage === "loading") {
    const steps = activePanel === "validate" ? VALIDATE_LOAD : PLAN_LOAD;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🚀</div>
        </div>
        <div>
          <AnimatePresence mode="wait">
            <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="text-sm font-semibold text-stone-600">{steps[loadStep]}</motion.p>
          </AnimatePresence>
          <p className="text-xs text-stone-400 mt-1">Building your comprehensive business intelligence…</p>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-emerald-400" : "bg-stone-200"}`} />)}
        </div>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (!result) return null;

  const isValidation = ["validate", "quick", "market", "competition", "revenue"].includes(currentMode);

  return (
    <div className="space-y-4" style={{ fontFamily: "Sora, sans-serif" }}>
      {/* Results nav */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{ideaName}</p>
          <p className="text-sm font-black text-stone-900">{isValidation ? "Validation Results" : "Business Plan"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setAppStage("input"); setResult(null); }}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-3 py-2 rounded-sm">
            <RefreshCw className="w-3 h-3" />New
          </button>
          {isValidation && (
            <button onClick={() => { setActivePanel("plan"); setAppStage("input"); }}
              className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm" style={{ backgroundColor: "#6366f1" }}>
              <FileText className="w-3.5 h-3.5" />Generate Plan
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {isValidation ? (
        <ValidationResults
          result={result}
          onGeneratePlan={() => { setActivePanel("plan"); setAppStage("input"); }}
          onSave={handleSave}
          isSignedIn={isSignedIn}
          ideaId={ideaId}
          saving={saving}
          saved={saved}
        />
      ) : (
        <PlanResults
          result={result}
          mode={currentMode}
          saving={saving}
          saved={saved}
          onSave={handleSave}
        />
      )}
    </div>
  );
}