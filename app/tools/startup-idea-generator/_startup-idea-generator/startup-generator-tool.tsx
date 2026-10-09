"use client";
// =============================================================================
// isaacpaha.com — Startup Idea Generator — Core Tool
// app/tools/startup-idea-generator/_startup-generator/startup-generator-tool.tsx
// =============================================================================

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence }      from "framer-motion";
import {
  Sparkles, Loader2, AlertCircle, X, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, Save, Star, ArrowRight, Zap, Target,
  TrendingUp, AlertTriangle, CheckCircle2, BarChart2, DollarSign,
  Shield, Lightbulb, Map, Clock, Plus, Flame, Brain, Globe,
  Rocket, Award, Layers, Users, Lock,
} from "lucide-react";
import { SavedIdea } from "./startup-generator-page";

export interface TokenGateInfo { required: number; balance: number; toolName: string | null; }
export interface StartupGeneratorToolProps {
  isSignedIn?:           boolean;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
  reopenBatch?:          SavedIdea | null;
  onReopened?:           () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#8b5cf6";

const GENERATION_MODES = [
  {
    id:    "founder_matched",
    label: "Match My DNA",
    emoji: "🧬",
    desc:  "Ideas built around YOUR exact skills and background",
    color: "#8b5cf6",
  },
  {
    id:    "sector_focused",
    label: "Deep Sector Dive",
    emoji: "🔭",
    desc:  "Non-obvious ideas in your chosen sector",
    color: "#3b82f6",
  },
  {
    id:    "contrarian",
    label: "Contrarian",
    emoji: "🔄",
    desc:  "Ideas that seem wrong — until they're obviously right",
    color: "#f97316",
  },
  {
    id:    "timing_arbitrage",
    label: "Perfect Timing",
    emoji: "⏰",
    desc:  "Ideas whose exact moment has arrived NOW",
    color: "#10b981",
  },
  {
    id:    "white_space",
    label: "White Space",
    emoji: "🕳️",
    desc:  "Gaps nobody else has spotted yet",
    color: "#ec4899",
  },
  {
    id:    "free_form",
    label: "Unleashed",
    emoji: "🌋",
    desc:  "No constraints — wildest possible ideas",
    color: "#ef4444",
  },
];

const AMBITIOUSNESS_LEVELS = [
  { id: "MOONSHOT",     label: "Moonshot",      emoji: "🌙", desc: "$10B+, change civilisation",     color: "#6366f1" },
  { id: "UNICORN",      label: "Unicorn",        emoji: "🦄", desc: "$1B+ within 7 years",           color: "#8b5cf6" },
  { id: "ROCKETSHIP",   label: "Rocketship",     emoji: "🚀", desc: "$100M-$500M, Series B territory",color: "#ec4899" },
  { id: "SOLID_STARTUP",label: "Solid Startup",  emoji: "💪", desc: "$10M-$100M, profitable gem",    color: "#10b981" },
];

const SECTORS = [
  { id: "DEEPTECH",       label: "Deep Tech",        emoji: "🔬" },
  { id: "B2B_SAAS",       label: "B2B SaaS",          emoji: "💻" },
  { id: "CONSUMER",       label: "Consumer",          emoji: "📱" },
  { id: "FINTECH",        label: "Fintech",           emoji: "💰" },
  { id: "HEALTHTECH",     label: "HealthTech",        emoji: "🏥" },
  { id: "CLIMATETECH",    label: "ClimateTech",       emoji: "🌍" },
  { id: "EDTECH",         label: "EdTech",            emoji: "🎓" },
  { id: "CREATOR_ECONOMY",label: "Creator Economy",  emoji: "🎨" },
  { id: "INFRASTRUCTURE", label: "Infrastructure",   emoji: "⚙️" },
  { id: "FUTURE_OF_WORK", label: "Future of Work",   emoji: "🏠" },
  { id: "BIOTECH",        label: "Biotech",           emoji: "🧬" },
  { id: "OTHER",          label: "Surprise Me",       emoji: "✨" },
];

const SKILL_SUGGESTIONS = [
  "Python", "Machine Learning", "React", "Product Management", "Sales",
  "Data Science", "Healthcare", "Finance", "Legal", "Marketing",
  "Hardware", "Blockchain", "iOS / Android", "Design", "Operations",
  "Supply Chain", "Education", "Real Estate", "Agriculture", "Gaming",
];

const BRUTALITY_COLORS = [
  "#10b981","#10b981","#10b981","#f59e0b","#f59e0b","#f59e0b",
  "#f97316","#f97316","#ef4444","#ef4444",
];

// ─── Idea Card ────────────────────────────────────────────────────────────────

function IdeaCard({
  idea, index, onSave, onStar, isSaved, isStarred,
  jobTitle, companyName,
}: {
  idea: any; index: number;
  onSave: (idea: any) => void;
  onStar: (idea: any) => void;
  isSaved: boolean; isStarred: boolean;
  jobTitle?: string; companyName?: string;
}) {
  const [expanded, setExpanded]     = useState(index === 0);
  const [activeTab, setActiveTab]   = useState<"overview"|"market"|"validation"|"first_steps">("overview");
  const [copied,   setCopied]       = useState(false);

  const brutalityScore  = idea.riskReality?.brutalityScore ?? 5;
  const brutalityColor  = BRUTALITY_COLORS[Math.min(9, brutalityScore - 1)];

  const modeCfg = GENERATION_MODES.find(m => m.id === "founder_matched");

  const IDEA_TABS = [
    { id: "overview",    label: "Overview",     icon: Lightbulb  },
    { id: "market",      label: "Market",       icon: BarChart2  },
    { id: "validation",  label: "Validate",     icon: Target     },
    { id: "first_steps", label: "First Steps",  icon: Map        },
  ] as const;

  const copyIdea = () => {
    const text = [
      `🦄 ${idea.name}`,
      idea.tagline,
      "",
      "THE IDEA:",
      idea.theIdea?.coreConcept,
      "",
      "THE INSIGHT:",
      idea.theIdea?.theInsight,
      "",
      "MARKET:",
      `TAM: ${idea.marketOpportunity?.marketSize?.tam}`,
      `Entry wedge: ${idea.marketOpportunity?.marketSize?.entryWedge}`,
      "",
      "CORE ASSUMPTION:",
      idea.validation?.coreAssumption,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${ACCENT}25`, background: "white" }}>

      {/* ── Card header ── */}
      <div className="px-6 pt-5 pb-4"
        style={{ background: `linear-gradient(135deg, ${ACCENT}08 0%, white 60%)` }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}25` }}>
            {SECTORS.find(s => s.id === idea.category)?.emoji ?? "🚀"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: `${ACCENT}12`, color: ACCENT }}>
                {idea.category?.replace(/_/g, " ") ?? "STARTUP"}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: `${brutalityColor}18`, color: brutalityColor }}>
                Brutality {brutalityScore}/10
              </span>
            </div>
            <h3 className="text-xl font-black text-stone-900 leading-tight">{idea.name}</h3>
            <p className="text-sm text-stone-500 mt-1 leading-relaxed">{idea.tagline}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => onStar(idea)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isStarred ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}>
              <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`} />
            </button>
            <button onClick={() => onSave(idea)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                isSaved ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "border-stone-200 text-stone-500 hover:border-violet-400 hover:text-violet-600"
              }`}>
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {isSaved ? "Saved" : "Save"}
            </button>
            <button onClick={copyIdea}
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                copied ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "border-stone-200 text-stone-400"
              }`}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Core concept — always visible */}
        <div className="mt-4 p-4 rounded-xl" style={{ background: `${ACCENT}06`, border: `1px solid ${ACCENT}15` }}>
          <p className="text-sm text-stone-700 leading-relaxed">{idea.theIdea?.coreConcept}</p>
        </div>

        {/* The Insight — the money sentence */}
        {idea.theIdea?.theInsight && (
          <div className="mt-3 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <p className="text-xs font-semibold italic text-stone-600 leading-relaxed">
              "{idea.theIdea.theInsight}"
            </p>
          </div>
        )}

        {/* Expand/collapse */}
        <button onClick={() => setExpanded(p => !p)}
          className="mt-3 flex items-center gap-1.5 text-xs font-bold transition-colors"
          style={{ color: expanded ? ACCENT : "#9ca3af" }}>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Show less" : "Explore this idea"}
        </button>
      </div>

      {/* ── Expanded detail ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-stone-100 overflow-x-auto">
              {IDEA_TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === t.id ? "border-violet-500 text-violet-600" : "border-transparent text-stone-400 hover:text-stone-700"
                  }`}>
                  <t.icon className="w-3.5 h-3.5" />{t.label}
                </button>
              ))}
            </div>

            <div className="px-6 py-5">

              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Why doesn't it exist + analogy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-stone-50">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Why doesn't it exist yet?</p>
                      <p className="text-xs text-stone-700 leading-relaxed">{idea.theIdea?.whyItDoesntExistYet}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: `${ACCENT}06` }}>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: ACCENT }}>The Framing</p>
                      {idea.theIdea?.analogies?.map((a: string, i: number) => (
                        <p key={i} className="text-xs font-semibold" style={{ color: ACCENT }}>{a}</p>
                      ))}
                    </div>
                  </div>

                  {/* Founder fit */}
                  {idea.unfairAdvantage && (
                    <div className="p-4 rounded-xl" style={{ background: "#fef3c7", border: "1px solid #fcd34d" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-3.5 h-3.5" style={{ color: "#b45309" }} />
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Your Unfair Advantage</p>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed mb-2">{idea.unfairAdvantage.founderFit}</p>
                      {idea.unfairAdvantage.unfairEdge && (
                        <p className="text-xs font-bold text-amber-900">
                          🔑 First-mover edge: {idea.unfairAdvantage.unfairEdge}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Business model */}
                  {idea.businessModel && (
                    <div className="p-4 rounded-xl bg-stone-50">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Business Model</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: "Revenue model",    value: idea.businessModel.revenueModel         },
                          { label: "Unit economics",   value: idea.businessModel.unitEconomics         },
                          { label: "Pricing",          value: idea.businessModel.pricingIntuition       },
                          { label: "To profitability", value: idea.businessModel.pathToProfitability   },
                        ].filter(s => s.value).map(s => (
                          <div key={s.label}>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                            <p className="text-stone-700 leading-relaxed">{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Moat */}
                  {idea.unfairAdvantage?.moatStrategy && (
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${ACCENT}06`, borderLeft: `3px solid ${ACCENT}` }}>
                      <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: ACCENT }}>Moat Strategy</p>
                        <p className="text-xs text-stone-700 leading-relaxed">{idea.unfairAdvantage.moatStrategy}</p>
                      </div>
                    </div>
                  )}

                  {/* Inspired by */}
                  {idea.inspiredBy && (
                    <div className="flex items-start gap-2 text-xs text-stone-500 italic">
                      <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                      <span>Inspired by: {idea.inspiredBy}</span>
                    </div>
                  )}

                  {/* Contrary view */}
                  {idea.contraryView && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1">The Case Against</p>
                      <p className="text-xs text-red-700 leading-relaxed">{idea.contraryView}</p>
                    </div>
                  )}

                  {/* The 10x question */}
                  {idea.the10xQuestion && (
                    <div className="p-4 rounded-xl" style={{ background: "#1a0a2e", border: "1px solid #4c1d95" }}>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#c4b5fd" }}>The $1B Question</p>
                      <p className="text-sm font-semibold italic" style={{ color: "#e9d5ff" }}>
                        "{idea.the10xQuestion}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MARKET */}
              {activeTab === "market" && idea.marketOpportunity && (
                <div className="space-y-4">
                  {/* Market sizing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: "TAM", value: idea.marketOpportunity.marketSize?.tam, color: ACCENT },
                      { label: "SAM", value: idea.marketOpportunity.marketSize?.sam, color: "#3b82f6" },
                      { label: "Entry Wedge", value: idea.marketOpportunity.marketSize?.entryWedge, color: "#10b981" },
                    ].map(s => (
                      <div key={s.label} className="p-3.5 rounded-xl bg-stone-50">
                        <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</p>
                        <p className="text-xs font-semibold text-stone-800 leading-relaxed">{s.value ?? "—"}</p>
                      </div>
                    ))}
                  </div>

                  {/* Problem + customer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-1.5">The Pain</p>
                      <p className="text-xs text-red-800 font-semibold leading-relaxed">{idea.marketOpportunity.problemStatement}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1.5">Who Feels It Most</p>
                      <p className="text-xs text-emerald-800 leading-relaxed">{idea.marketOpportunity.whoFeelsItMost}</p>
                    </div>
                  </div>

                  {/* Timing factors */}
                  {idea.marketOpportunity.timingFactors?.length > 0 && (
                    <div className="p-4 rounded-xl" style={{ background: "#fffbeb", border: "1px solid #fcd34d" }}>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2">⏰ Why NOW Is the Moment</p>
                      {idea.marketOpportunity.timingFactors.map((t: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-amber-800 mb-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{t}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tailwinds */}
                  {idea.marketOpportunity.tailwinds?.length > 0 && (
                    <div className="p-4 rounded-xl bg-stone-50">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Market Tailwinds</p>
                      {idea.marketOpportunity.tailwinds.map((t: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-stone-600 mb-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{t}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VALIDATION */}
              {activeTab === "validation" && idea.validation && (
                <div className="space-y-4">
                  {/* Core assumption */}
                  <div className="p-4 rounded-xl" style={{ background: "#1a0a2e", border: "1px solid #4c1d95" }}>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#c4b5fd" }}>Core Assumption to Test</p>
                    <p className="text-sm font-bold" style={{ color: "#e9d5ff" }}>{idea.validation.coreAssumption}</p>
                    <p className="text-[11px] mt-2" style={{ color: "#a78bfa" }}>If this is false, the idea dies. Test it first.</p>
                  </div>

                  {/* Validation questions */}
                  {idea.validation.validationQuestions?.length > 0 && (
                    <div className="p-4 rounded-xl bg-stone-50">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Ask Your First Customer</p>
                      {idea.validation.validationQuestions.map((q: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                          <div className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: ACCENT }}>{i + 1}</div>
                          <p className="text-xs text-stone-700 font-semibold leading-relaxed italic">"{q}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MVP concept */}
                  {idea.validation.mvpConcept && (
                    <div className="p-4 rounded-xl" style={{ background: `${ACCENT}06`, border: `1px solid ${ACCENT}20` }}>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: ACCENT }}>4-6 Week MVP</p>
                      <p className="text-xs text-stone-700 leading-relaxed">{idea.validation.mvpConcept}</p>
                    </div>
                  )}

                  {/* First £1k */}
                  {idea.validation.firstRevenueStrategy && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1.5">How to Earn the First £1,000</p>
                      <p className="text-xs text-emerald-800 leading-relaxed">{idea.validation.firstRevenueStrategy}</p>
                    </div>
                  )}

                  {/* Kill signals */}
                  {idea.validation.killSignals?.length > 0 && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">Kill Signals — Stop If You See These</p>
                      {idea.validation.killSignals.map((k: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-700 mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{k}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Competitive + regulatory risk */}
                  {idea.riskReality && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-stone-50">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Hardest Thing</p>
                        <p className="text-xs text-stone-700">{idea.riskReality.hardestThing}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-stone-50">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Competitive Risk</p>
                        <p className="text-xs text-stone-700">{idea.riskReality.competitiveRisk}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FIRST STEPS */}
              {activeTab === "first_steps" && idea.founderFirstSteps && (
                <div className="space-y-3">
                  {[
                    { label: "This week", value: idea.founderFirstSteps.week1, color: "#ef4444", icon: Flame },
                    { label: "End of month 1", value: idea.founderFirstSteps.month1, color: "#f97316", icon: Target },
                    { label: "Day 90", value: idea.founderFirstSteps.days90, color: ACCENT, icon: Rocket },
                    { label: "First hire", value: idea.founderFirstSteps.firstHire, color: "#3b82f6", icon: Users },
                  ].filter(s => s.value).map((s, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-xl bg-stone-50">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${s.color}15` }}>
                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</p>
                        <p className="text-xs text-stone-700 leading-relaxed">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function StartupGeneratorTool({ isSignedIn = false, onInsufficientTokens, reopenBatch, onReopened }: StartupGeneratorToolProps) {
  const [stage,     setStage]     = useState<"input"|"loading"|"results">("input");
  const [result,    setResult]    = useState<any>(null);
  const [error,     setError]     = useState("");
  const [loadStep,  setLoadStep]  = useState(0);

  // Input state
  const [founderBackground, setFounderBackground] = useState("");
  const [skills,            setSkills]            = useState<string[]>([]);
  const [skillInput,        setSkillInput]        = useState("");
  const [interests,         setInterests]         = useState<string[]>([]);
  const [interestInput,     setInterestInput]     = useState("");
  const [sector,            setSector]            = useState("OTHER");
  const [ambitiousness,     setAmbitiousness]     = useState("UNICORN");
  const [generationMode,    setGenerationMode]    = useState("founder_matched");
  const [locationContext,   setLocationContext]   = useState("");
  const [budgetContext,     setBudgetContext]      = useState("");
  const [timeCommitment,    setTimeCommitment]    = useState("");
  const [ideaCount,         setIdeaCount]         = useState(3);
  const [showAdvanced,      setShowAdvanced]      = useState(false);

  // Results state
  const [savedIdeas,  setSavedIdeas]  = useState<Set<number>>(new Set());
  const [starredIdeas,setStarredIdeas]= useState<Set<number>>(new Set());
  const [saving,      setSaving]      = useState(false);
  const [batchSaved,  setBatchSaved]  = useState(false);
  const [batchId,     setBatchId]     = useState<string | null>(null);

  // ── Reopen a saved batch from dashboard ──────────────────────────────
  useEffect(() => {
    if (!reopenBatch) return;
    
    try {
      // The saved idea should have a resultJson field with the full generation result
      const savedPayload =
        (reopenBatch as SavedIdea & { resultJson?: string; result_json?: string }).resultJson ??
        (reopenBatch as SavedIdea & { resultJson?: string; result_json?: string }).result_json;

      if (savedPayload) {
        const savedResult = JSON.parse(savedPayload);
        setResult(savedResult);
        
        // Populate the input fields from the saved batch
        if (savedResult.generationContext) {
          const gc = savedResult.generationContext;
          setGenerationMode(reopenBatch.generationMode ?? "founder_matched");
          setAmbitiousness(reopenBatch.ambitiousness ?? "UNICORN");
          setFounderBackground(gc?.founderDNA ?? "");
          // Skills and interests might need to be parsed
          if (gc?.skills) setSkills(gc.skills);
          if (gc?.interests) setInterests(gc.interests);
          setSector(gc?.sector ?? "OTHER");
          setLocationContext(gc?.locationContext ?? "");
          setBudgetContext(gc?.budgetContext ?? "");
          setTimeCommitment(gc?.timeCommitment ?? "");
          setIdeaCount(savedResult.ideas?.length ?? 3);
        }
        
        setStage("results");
      }
      
      onReopened?.();
    } catch (err) {
      console.error("Failed to parse saved batch:", err);
    }
  }, [reopenBatch]);

  const LOAD_STEPS = [
    "Reading your founder DNA…",
    "Scanning market white spaces…",
    "Identifying timing arbitrage opportunities…",
    "Calculating your unfair advantages…",
    "Generating world-changing ideas…",
    "Pressure-testing each concept…",
    "Writing your startup briefings…",
  ];

  const addSkill    = () => { const s = skillInput.trim();    if (s && !skills.includes(s))    setSkills(p => [...p, s]);    setSkillInput("");    };
  const addInterest = () => { const i = interestInput.trim(); if (i && !interests.includes(i)) setInterests(p => [...p, i]); setInterestInput(""); };

  const handleGenerate = async () => {
    setStage("loading"); setError(""); setLoadStep(0); setResult(null);
    setBatchSaved(false); setBatchId(null); setSavedIdeas(new Set()); setStarredIdeas(new Set());
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 1100);
    try {
      const res = await fetch("/api/tools/startup-generator/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founderBackground, skills, interests, sector, ambitiousness,
          generationMode, locationContext, budgetContext, timeCommitment, count: ideaCount,
        }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Startup Idea Generator" });
        clearInterval(interval); setStage("input");
        setError("You're out of tokens. Play some games to earn more."); return;
      }
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.result) { setError(data.error ?? "Generation failed."); setStage("input"); return; }
      setResult(data.result);
      setStage("results");
    } catch { clearInterval(interval); setError("Network error."); setStage("input"); }
  };

  const handleSaveBatch = async () => {
    if (!isSignedIn || !result) return;
    setSaving(true);
    const res = await fetch("/api/tools/startup-generator/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        founderBackground, skills, interests, sector, ambitiousness,
        generationMode, locationContext, budgetContext, timeCommitment, result,
      }),
    });
    const data = await res.json();
    if (data.ok) { setBatchSaved(true); setBatchId(data.ideaId ?? null); }
    setSaving(false);
  };

  const handleSaveIdea = useCallback((idea: any, index: number) => {
    setSavedIdeas(p => new Set([...p, index]));
    // If we already have a batch ID, patch it to save this specific idea
    if (batchId) {
      fetch(`/api/tools/startup-generator/save?id=${batchId}&action=saveIdea`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      }).catch(() => {});
    }
  }, [batchId]);

  const handleStarIdea = useCallback((idea: any, index: number) => {
    setStarredIdeas(p => {
      const next = new Set(p);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }, []);

  // ── INPUT ──────────────────────────────────────────────────────────────────
  if (stage === "input") return (
    <div className="space-y-7" style={{ fontFamily: "Sora, sans-serif" }}>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Generation mode */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Generation Mode</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {GENERATION_MODES.map(m => (
            <button key={m.id} onClick={() => setGenerationMode(m.id)}
              className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${
                generationMode === m.id ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
              }`}
              style={generationMode === m.id ? { backgroundColor: m.color } : {}}>
              <span className="text-2xl">{m.emoji}</span>
              <span className={`text-xs font-black leading-tight ${generationMode === m.id ? "text-white" : "text-stone-800"}`}>{m.label}</span>
              <span className={`text-[10px] leading-tight ${generationMode === m.id ? "text-white/70" : "text-stone-400"}`}>{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ambitiousness */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">How ambitious?</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {AMBITIOUSNESS_LEVELS.map(a => (
            <button key={a.id} onClick={() => setAmbitiousness(a.id)}
              className={`flex flex-col items-center gap-1 py-3.5 rounded-xl border text-center transition-all ${
                ambitiousness === a.id ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
              }`}
              style={ambitiousness === a.id ? { backgroundColor: a.color } : {}}>
              <span className="text-2xl">{a.emoji}</span>
              <span className={`text-xs font-black ${ambitiousness === a.id ? "text-white" : "text-stone-800"}`}>{a.label}</span>
              <span className={`text-[10px] ${ambitiousness === a.id ? "text-white/70" : "text-stone-400"}`}>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Founder background */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
          Your Background <span className="text-stone-300 font-normal">(the more you share, the more tailored your ideas)</span>
        </label>
        <textarea value={founderBackground} onChange={e => setFounderBackground(e.target.value)} rows={3}
          placeholder="e.g. 8 years as a backend engineer at fintech companies. Built 2 side projects. Deep knowledge of payment systems and compliance. Now looking for my first venture. Strong Python, weak on sales."
          className="w-full text-sm border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-400 resize-none"
        />
      </div>

      {/* Skills */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Key Skills</label>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {skills.map(s => (
              <span key={s} className="flex items-center gap-1 text-xs font-bold text-white px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: ACCENT }}>
                {s}<button onClick={() => setSkills(p => p.filter(x => x !== s))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2 mb-2">
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSkill()}
            placeholder="Add a skill…"
            className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
          <button onClick={addSkill} className="text-white text-xs font-bold px-3 py-2 rounded-lg" style={{ backgroundColor: ACCENT }}>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 10).map(s => (
            <button key={s} onClick={() => setSkills(p => [...p, s])}
              className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200 hover:border-violet-400 hover:text-violet-600 px-2.5 py-1 rounded-lg transition-colors">
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sector */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Preferred Sector</label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
          {SECTORS.map(s => (
            <button key={s.id} onClick={() => setSector(s.id)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs transition-all ${
                sector === s.id ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
              }`}
              style={sector === s.id ? { backgroundColor: ACCENT } : {}}>
              <span className="text-lg">{s.emoji}</span>
              <span className={`font-bold text-center text-[10px] leading-tight ${sector === s.id ? "text-white" : "text-stone-700"}`}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Idea count */}
      <div className="flex items-center gap-4">
        <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Number of ideas</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setIdeaCount(n)}
              className={`w-10 h-10 rounded-xl text-sm font-black border transition-all ${
                ideaCount === n ? "text-white border-transparent" : "bg-white border-stone-200 text-stone-600"
              }`}
              style={ideaCount === n ? { backgroundColor: ACCENT } : {}}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced */}
      <div>
        <button onClick={() => setShowAdvanced(p => !p)}
          className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-700">
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          More context (interests, location, budget, time commitment)
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Interests / Passions</label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {interests.map(i => (
                      <span key={i} className="flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg">
                        {i}<button onClick={() => setInterests(p => p.filter(x => x !== i))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={interestInput} onChange={e => setInterestInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addInterest()}
                      placeholder="e.g. cooking, gaming, travel…"
                      className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
                    <button onClick={addInterest} className="text-white text-xs font-bold px-3 py-2 rounded-lg" style={{ backgroundColor: ACCENT }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Location / Target Market</label>
                  <input value={locationContext} onChange={e => setLocationContext(e.target.value)}
                    placeholder="e.g. UK, US market, Southeast Asia"
                    className="w-full text-xs border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Available Capital</label>
                  <input value={budgetContext} onChange={e => setBudgetContext(e.target.value)}
                    placeholder="e.g. £0 bootstrapped, £50k savings"
                    className="w-full text-xs border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Time Commitment</label>
                  <input value={timeCommitment} onChange={e => setTimeCommitment(e.target.value)}
                    placeholder="e.g. full-time, evenings / weekends only"
                    className="w-full text-xs border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button onClick={handleGenerate}
        className="w-full flex items-center justify-center gap-2 text-base font-black text-white py-4 rounded-xl transition-all shadow-sm"
        style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #7c3aed 100%)` }}>
        <Sparkles className="w-5 h-5" />
        Generate {ideaCount} World-Changing Startup Idea{ideaCount > 1 ? "s" : ""}
      </button>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (stage === "loading") return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-violet-300 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🦄</div>
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.p key={loadStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="text-sm font-semibold text-stone-600">{LOAD_STEPS[loadStep]}</motion.p>
        </AnimatePresence>
        <p className="text-xs text-stone-400 mt-1.5">Hunting for genuinely novel opportunities…</p>
      </div>
      <div className="flex gap-2">
        {LOAD_STEPS.map((_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i <= loadStep ? "bg-violet-500 scale-110" : "bg-stone-200"}`} />
        ))}
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (!result) return null;
  const ideas = result.ideas ?? [];
  const gc    = result.generationContext;
  const notes = result.generatorNotes;

  return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Results header */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #0d0d0d 100%)", border: "1px solid #4c1d95" }}>
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#a78bfa" }}>
                {ideas.length} Idea{ideas.length > 1 ? "s" : ""} Generated
              </p>
              <p className="text-xl font-black text-white leading-tight">
                {GENERATION_MODES.find(m => m.id === generationMode)?.emoji}{" "}
                {GENERATION_MODES.find(m => m.id === generationMode)?.label} Mode
              </p>
              {gc?.founderDNA && gc.founderDNA !== "No context provided" && (
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#c4b5fd" }}>
                  Your edge: {gc.founderDNA}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isSignedIn && (
                <button onClick={handleSaveBatch} disabled={saving || batchSaved}
                  className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-lg transition-all ${
                    batchSaved ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" : "text-white/50 border-white/15 hover:text-white hover:border-white/30"
                  }`}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : batchSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {batchSaved ? "Saved!" : "Save All"}
                </button>
              )}
              <button onClick={() => { setStage("input"); setResult(null); }}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-lg">
                <RefreshCw className="w-3 h-3" />New Batch
              </button>
            </div>
          </div>

          {gc?.timingInsight && (
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(167,139,250,.08)", border: "1px solid rgba(167,139,250,.2)" }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: "#a78bfa" }}>Timing Intelligence</p>
              <p className="text-xs leading-relaxed" style={{ color: "#ddd6fe" }}>{gc.timingInsight}</p>
            </div>
          )}
        </div>
      </div>

      {/* Idea cards */}
      <div className="space-y-5">
        {ideas.map((idea: any, i: number) => (
          <IdeaCard
            key={i}
            idea={idea}
            index={i}
            onSave={(idea) => handleSaveIdea(idea, i)}
            onStar={(idea) => handleStarIdea(idea, i)}
            isSaved={savedIdeas.has(i)}
            isStarred={starredIdeas.has(i)}
          />
        ))}
      </div>

      {/* Generator notes */}
      {notes && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ACCENT}25` }}>
          <div className="px-5 py-4" style={{ background: `${ACCENT}08` }}>
            <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: ACCENT }}>From the Generator</p>
            {notes.patternObserved && (
              <p className="text-xs text-stone-700 leading-relaxed mb-3">
                <span className="font-bold" style={{ color: ACCENT }}>Pattern: </span>{notes.patternObserved}
              </p>
            )}
            {notes.advice && (
              <div className="rounded-lg px-4 py-3" style={{ background: `${ACCENT}12`, borderLeft: `3px solid ${ACCENT}` }}>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>For This Founder</p>
                <p className="text-xs font-semibold text-stone-800 leading-relaxed">{notes.advice}</p>
              </div>
            )}
            {notes.wildCard && (
              <div className="mt-3 flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                <p className="text-xs text-stone-600 italic">
                  <span className="font-bold not-italic" style={{ color: ACCENT }}>Wild card idea: </span>{notes.wildCard}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}