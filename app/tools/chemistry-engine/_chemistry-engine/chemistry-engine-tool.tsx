"use client";

// =============================================================================
// isaacpaha.com — Chemistry Understanding Engine
// app/tools/chemistry-engine/_components/chemistry-engine-tool.tsx
//
// 10-layer concept breakdown:
//   TAB 1: Concept       — plain definition + everyday analogy + governing law
//   TAB 2: Particles     — what atoms/electrons/bonds are doing (THE differentiator)
//   TAB 3: Why It Exists — the problem + before/after the discovery
//   TAB 4: History       — chemists, key moment, evolution, fun fact
//   TAB 5: Theory        — the underpinning theoretical framework
//   TAB 6: Real World    — 4-6 diverse applications
//   TAB 7: Intuition     — mental models and "what changes when" builders
//   TAB 8: Misconceptions— wrong beliefs corrected with evidence
//   TAB 9: Try It        — experiments + practice questions
//   TAB 10: Tutor        — AI chemistry tutor
//
// Modes: Theory Explorer | Question Mode | Explain Simpler | Go Deeper
// Full workspace integration: save to DB, reopen from dashboard
// =============================================================================

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  FlaskConical, Sparkles, Loader2, AlertCircle, Check, Copy,
  ChevronDown, ChevronUp, ArrowRight, RefreshCw, X, Send,
  BookOpen, Lightbulb, History, Globe, Brain, Zap, Target,
  MessageSquare, Info, Star, ArrowLeft, AlertTriangle,
  CheckCircle2, Beaker, Microscope, Atom, TestTube, Layers,
  Telescope,
} from "lucide-react";
import { ChemistryVisualiser, VisualisationData } from "./chemistry-visualiser";



// ─── Types ────────────────────────────────────────────────────────────────────

interface ChemistryExplanation {
  topic:        string;
  conceptName:  string;
  keyChemists:  string[];
  simpleDefinition: {
    oneLineSummary:   string;
    expandedDefinition: string;
    everydayAnalogy:  string;
  };
  particleLevel: {
    whatAtomsDo:           string;
    whatElectronsDo:       string;
    whatBondsDoBreakForm:  string;
    particleModel:         string;
    whyCannotSeeIt:        string;
  };
  corePrinciple: {
    name:             string;
    equation:         string;
    terms:            { symbol: string; meaning: string; unit: string }[];
    inWords:          string;
    conservationLaw:  string;
    levelNote:        string;
  };
  whyItExists: {
    problemItSolved:    string;
    beforeDiscovery:    string;
    breakthrough:       string;
    impactOnChemistry:  string;
  };
  history: {
    discovered: string;
    keyMoment:  string;
    evolution:  string;
    funFact:    string;
    chemists:   { name: string; contribution: string; era: string }[];
  };
  theoryExplainer: {
    theoryName:      string;
    whatItSays:      string;
    whyItMakesSense: string;
    predictions:     string[];
    limitations:     string;
  };
  realWorld: { field: string; application: string; example: string; impact: string }[];
  intuition: {
    primaryModel:     string;
    alternativeModel: string;
    thinkAboutItLike: string;
    whatChangesWhen:  string[];
  };
  misconceptions: {
    wrongBelief:          string;
    whyItSeemsTrue:       string;
    truth:                string;
    correctingExperiment: string;
  }[];
  experiments: {
    title:              string;
    materials:          string[];
    instructions:       string;
    whatToObserve:      string;
    chemistryExplained: string;
    safetyNote:         string;
  }[];
  conceptLinks: { concept: string; relationship: string; direction: "prerequisite" | "builds-on" | "parallel" }[];
  whyItMatters:          string;
  levelSummary:          string;
  examTips:              string[];
  visualisation:         { type: string; description: string; keyPoints: string[]; data?: any };
  difficulty:            string;
  estimatedReadMinutes:  number;
}

export interface TokenGateInfo {
  required: number;
  balance:  number;
  toolName: string | null;
}

export interface ChemistryEngineToolProps {
  /** Called when the API returns 402 — parent page shows the modal */
     onInsufficientTokens?: (info: TokenGateInfo) => void;
    }

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#10b981";

const LEVELS = [
  { id: "gcse",       label: "GCSE",      flag: "🇬🇧", sublabel: "Year 10-11"   },
  { id: "alevel",     label: "A-Level",   flag: "🇬🇧", sublabel: "Year 12-13"   },
  { id: "university", label: "University",flag: "🎓",  sublabel: "Degree level" },
];

const EXAMPLE_QUESTIONS = [
  "Explain ionic bonding",
  "How does the mole concept work?",
  "What is Le Chatelier's Principle?",
  "Explain oxidation and reduction (redox)",
  "How do exothermic and endothermic reactions differ?",
  "What is collision theory?",
  "Explain the periodic table trends",
  "How does electrolysis work?",
];

const EXPLORER_TOPICS = [
  "Atomic Theory", "Chemical Bonding", "Thermochemistry",
  "Reaction Kinetics", "Equilibrium", "Acid-Base Chemistry",
  "Electrochemistry", "Organic Chemistry", "Periodic Trends",
  "Quantum Chemistry",
];

const DIRECTION_CFG = {
  prerequisite: { color: "#6b7280", bg: "#f3f4f6", label: "Prerequisite" },
  "builds-on":  { color: "#10b981", bg: "#d1fae5", label: "Builds on"   },
  parallel:     { color: "#3b82f6", bg: "#dbeafe", label: "Related"      },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function buildVisualisationData(vizData: any): VisualisationData | null {
  if (!vizData || vizData.type === "none" || !vizData.type) return null;
  const type = vizData.type as VisualisationData["type"];
  const out: VisualisationData = { type, description: vizData.description, keyPoints: vizData.keyPoints ?? [] };
  if (vizData.data) {
    const d = typeof vizData.data === "string" ? (() => { try { return JSON.parse(vizData.data); } catch { return vizData.data; } })() : vizData.data;
    if (d?.reactionType)      out.reactionType      = d.reactionType;
    if (d?.reactantEnergy     !== undefined) out.reactantEnergy   = d.reactantEnergy;
    if (d?.productEnergy      !== undefined) out.productEnergy    = d.productEnergy;
    if (d?.activationEnergy   !== undefined) out.activationEnergy = d.activationEnergy;
    if (d?.reactionLabel)     out.reactionLabel     = d.reactionLabel;
    if (d?.elementSymbol)     out.elementSymbol     = d.elementSymbol;
    if (d?.elementName)       out.elementName       = d.elementName;
    if (d?.atomicNumber       !== undefined) out.atomicNumber     = d.atomicNumber;
    if (d?.atomicMass         !== undefined) out.atomicMass       = d.atomicMass;
    if (d?.elementGroup)      out.elementGroup      = d.elementGroup;
    if (d?.electronConfig)    out.electronConfig    = d.electronConfig;
    if (d?.formula)           out.formula           = d.formula;
    if (d?.bondDescription)   out.bondDescription   = d.bondDescription;
    if (d?.functionExpression) out.functionExpression = d.functionExpression;
    if (d?.xRange)            out.xRange            = d.xRange;
  }
  return out;
}

// ─── Particle Level Card ──────────────────────────────────────────────────────

function ParticleCard({ title, content, icon: Icon, color }: {
  title: string; content: string; icon: any; color: string;
}) {
  return (
    <div className="border rounded-sm p-4" style={{ borderColor: `${color}30`, backgroundColor: `${color}06` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color }}>{title}</p>
      </div>
      <p className="text-sm text-stone-700 leading-relaxed">{content}</p>
    </div>
  );
}

// ─── Governing Law Card ───────────────────────────────────────────────────────

function GoverningLawCard({ law }: { law: ChemistryExplanation["corePrinciple"] }) {
  if (!law.equation && !law.name) return null;
  return (
    <div className="bg-stone-900 text-white rounded-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10">
        <p className="text-xs font-black uppercase tracking-wider text-white/40">{law.name}</p>
      </div>
      <div className="px-5 py-5">
        {law.equation && (
          <div className="text-center mb-5">
            <p className="text-4xl font-black font-mono text-emerald-300 tracking-wider">{law.equation}</p>
            {law.inWords && <p className="text-sm text-white/50 mt-2 italic">"{law.inWords}"</p>}
          </div>
        )}
        {law.terms?.length > 0 && (
          <div className="space-y-2">
            {law.terms.map((t, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-sm px-3 py-2">
                <span className="w-10 text-emerald-300 font-black font-mono text-base flex-shrink-0">{t.symbol}</span>
                <span className="text-sm text-white/80 flex-1">{t.meaning}</span>
                <span className="text-[11px] text-white/40 font-mono flex-shrink-0">{t.unit}</span>
              </div>
            ))}
          </div>
        )}
        {law.conservationLaw && law.conservationLaw !== "N/A" && (
          <p className="text-xs text-emerald-200/60 mt-3 pt-3 border-t border-white/10">
            Underlying law: <span className="font-bold">{law.conservationLaw}</span>
          </p>
        )}
        {law.levelNote && (
          <p className="text-xs text-white/40 mt-2 leading-relaxed">{law.levelNote}</p>
        )}
      </div>
    </div>
  );
}

// ─── Misconception Card ───────────────────────────────────────────────────────

function MisconceptionCard({ m }: { m: ChemistryExplanation["misconceptions"][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-stone-100 rounded-sm overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-stone-50 transition-colors">
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <X className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-600 line-through leading-snug">{m.wrongBelief}</p>
          {!open && <p className="text-xs text-stone-400 mt-0.5">Click to see the truth…</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 space-y-3 bg-stone-50/40">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Why it seems true</p>
                <p className="text-xs text-stone-600 leading-relaxed">{m.whyItSeemsTrue}</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">The truth</p>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">{m.truth}</p>
                </div>
              </div>
              {m.correctingExperiment && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-2">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Proof / Demonstration</p>
                  <p className="text-xs text-emerald-800 leading-relaxed">{m.correctingExperiment}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Experiment Card ──────────────────────────────────────────────────────────

function ExperimentCard({ exp }: { exp: ChemistryExplanation["experiments"][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-emerald-100 rounded-sm overflow-hidden bg-emerald-50/30">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-emerald-50 transition-colors">
        <div className="w-8 h-8 rounded-sm bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <TestTube className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-800">{exp.title}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {exp.materials.slice(0, 3).map((m, i) => (
              <span key={i} className="text-[10px] text-emerald-600 bg-white border border-emerald-200 px-1.5 py-0.5 rounded-sm">{m}</span>
            ))}
            {exp.materials.length > 3 && <span className="text-[10px] text-emerald-400">+{exp.materials.length - 3}</span>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-emerald-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-emerald-100 px-4 py-4 space-y-3">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1.5">You'll need</p>
                <div className="flex flex-wrap gap-1.5">
                  {exp.materials.map((m, i) => <span key={i} className="text-xs text-emerald-700 bg-white border border-emerald-200 px-2 py-1 rounded-sm">{m}</span>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1.5">Instructions</p>
                <p className="text-sm text-stone-700 leading-relaxed">{exp.instructions}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1.5">What to observe</p>
                <p className="text-sm text-stone-700 leading-relaxed">{exp.whatToObserve}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-3">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">The chemistry</p>
                <p className="text-xs text-emerald-800 leading-relaxed">{exp.chemistryExplained}</p>
              </div>
              {exp.safetyNote && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-sm px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{exp.safetyNote}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Practice Panel ───────────────────────────────────────────────────────────

function PracticePanel({ result, level, question, onInsufficientTokens }: { result: ChemistryExplanation; level: string; question: string; onInsufficientTokens?: (info: TokenGateInfo) => void }) {
  const [qType,    setQType]    = useState<"practice" | "theory_questions">("practice");
  const [questions,setQuestions]= useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [openSols, setOpenSols] = useState<Set<number>>(new Set());
  const [openHints,setOpenHints]= useState<Set<number>>(new Set());
  const [answers,  setAnswers]  = useState<Record<number, string>>({});

  const toggle = (set: Set<number>, fn: any, i: number) =>
    fn((p: Set<number>) => { const n = new Set(p); p.has(i) ? n.delete(i) : n.add(i); return n; });

  const generate = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/chemistry-engine/experiments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: result.topic, conceptName: result.conceptName, level, type: qType, originalQuestion: question }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Chemistry Practice Questions",
        });
        setLoading(false);
        return;
      }

      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch {}
    setLoading(false);
  };

  const DIFF_COLOR: Record<string, string> = { Recall: "#10b981", Application: "#f59e0b", Analysis: "#ef4444", "Particle-Level": "#8b5cf6" };

  if (!questions.length) return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([{ id: "practice", label: "⚗️ Calculations" }, { id: "theory_questions", label: "📝 Theory" }] as const).map(t => (
          <button key={t.id} onClick={() => setQType(t.id)}
            className={`flex-1 text-xs font-bold py-2.5 px-4 rounded-sm border transition-colors ${qType === t.id ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-5">
        <p className="text-sm font-black text-emerald-800 mb-1">Practice builds real understanding</p>
        <p className="text-xs text-emerald-600 leading-relaxed mb-3">
          Generate {qType === "practice" ? "5 calculation questions with worked solutions and mark schemes" : "6 theory questions including particle-level questions"} on <strong>{result.conceptName}</strong>.
        </p>
        <button onClick={generate} disabled={loading}
          className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60"
          style={{ backgroundColor: ACCENT }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating…" : "Generate Questions"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider">{questions.length} {qType === "practice" ? "calculation" : "theory"} questions</p>
        <button onClick={() => { setQuestions([]); setOpenSols(new Set()); setOpenHints(new Set()); }}
          className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />New set
        </button>
      </div>
      {questions.map((q: any, i: number) => (
        <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center flex-shrink-0">{i+1}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {(q.difficulty || q.type) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                      style={{ color: DIFF_COLOR[q.difficulty ?? q.type] ?? "#6b7280", backgroundColor: `${DIFF_COLOR[q.difficulty ?? q.type] ?? "#6b7280"}15` }}>
                      {q.difficulty ?? q.type}
                    </span>
                  )}
                  {q.marks && <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">[{q.marks} mark{q.marks>1?"s":""}]</span>}
                  {q.examStyle && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-sm">📝 Exam</span>}
                </div>
                <p className="text-sm font-semibold text-stone-900 leading-snug">{q.question}</p>
                {qType === "practice" && (
                  <input value={answers[q.id] ?? ""} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                    placeholder="Write your answer here…"
                    className="w-full mt-3 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400"
                  />
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {q.hint && (
                <button onClick={() => toggle(openHints, setOpenHints, i)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors ${openHints.has(i) ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-300"}`}>
                  <Lightbulb className="w-3 h-3" />Hint
                </button>
              )}
              <button onClick={() => toggle(openSols, setOpenSols, i)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors ${openSols.has(i) ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-emerald-300"}`}>
                <Check className="w-3 h-3" />{openSols.has(i) ? "Hide" : "Answer"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {openHints.has(i) && q.hint && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="border-t border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-bold text-amber-600 mb-1">💡 Hint</p>
                  <p className="text-xs text-amber-800">{q.hint}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {openSols.has(i) && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-4 space-y-2">
                  {q.solution?.workingOut?.map((s: string, si: number) => (
                    <p key={si} className="text-xs text-emerald-700 flex items-start gap-1.5">
                      <span className="font-bold flex-shrink-0">{si+1}.</span>{s}
                    </p>
                  ))}
                  {q.solution?.finalAnswer && <p className="text-sm font-black text-emerald-800">→ {q.solution.finalAnswer}</p>}
                  {q.modelAnswer && <p className="text-sm text-emerald-800 leading-relaxed">{q.modelAnswer}</p>}
                  {q.solution?.markScheme && (
                    <div className="bg-white/70 border border-emerald-100 rounded-sm px-3 py-2">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-1">Mark scheme</p>
                      <p className="text-xs text-emerald-700">{q.solution.markScheme}</p>
                    </div>
                  )}
                  {q.particleAnswer && (
                    <div className="bg-purple-50 border border-purple-100 rounded-sm px-3 py-2">
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider mb-1">⚛️ Particle-level answer</p>
                      <p className="text-xs text-purple-800 leading-relaxed">{q.particleAnswer}</p>
                    </div>
                  )}
                  {q.keyTerms?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {q.keyTerms.map((t: string) => <span key={t} className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.5 rounded-sm">{t}</span>)}
                    </div>
                  )}
                  {q.commonError && (
                    <div className="flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-sm px-3 py-2 mt-1">
                      <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-700"><span className="font-bold">Common error: </span>{q.commonError}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ─── AI Tutor ─────────────────────────────────────────────────────────────────

function AITutor({ question, level, onInsufficientTokens }: { question: string; level: string; onInsufficientTokens?: (info: TokenGateInfo) => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const ask = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setMessages(p => [...p, { role: "user", text: msg }]);
    setInput(""); setLoading(true);
    try {
      const res  = await fetch("/api/tools/chemistry-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, level, mode: "tutor", followUpContext: `Topic: "${question}". Student: "${msg}"` }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Chemistry AI Tutor",
        });
        setMessages(p => [...p, { role: "ai", text: "You've run out of tokens to use the Chemistry Tutor. Please play some games to earn more tokens, then try again." }]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const r    = data.result;
      if (r?.response) setMessages(p => [...p, { role: "ai", text: r.response }]);
      if (r?.guidingQuestion) setTimeout(() => setMessages(p => [...p, { role: "ai", text: `🤔 ${r.guidingQuestion}` }]), 700);
    } catch { setMessages(p => [...p, { role: "ai", text: "Connection error — please try again." }]); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3.5">
        <Microscope className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-800">Chemistry Tutor</p>
          <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
            Ask any follow-up. "What's happening to the electrons in step 2?" — "Why does adding a catalyst lower activation energy?" — I'll guide you to understand, not just give the answer.
          </p>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${m.role === "user" ? "bg-stone-200 text-stone-700" : "text-white"}`}
                style={m.role === "ai" ? { backgroundColor: ACCENT } : {}}>
                {m.role === "user" ? "You" : "🧪"}
              </div>
              <div className={`flex-1 max-w-[85%] rounded-sm px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-stone-100 text-stone-700" : "bg-emerald-50 border border-emerald-200 text-emerald-900"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: ACCENT }}>🧪</div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span className="text-xs text-emerald-500">Thinking…</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && ask()}
          placeholder="Ask anything about this chemistry topic…"
          className="flex-1 text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400"
        />
        <button onClick={ask} disabled={loading || !input.trim()}
          className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60"
          style={{ backgroundColor: ACCENT }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── REOPEN INTERFACE (for workspace) ────────────────────────────────────────

export interface ChemistryReopenData {
  resultJson: string;
  question:   string;
  level:      string;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function ChemistryEngineTool({
  isSignedIn  = false,
  reopenData,
  onReopened,
  onInsufficientTokens,
}: {
  isSignedIn?:  boolean;
  reopenData?:  ChemistryReopenData | null;
  onReopened?:  () => void;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
}) {
  const [question,     setQuestion]     = useState("");
  const [level,        setLevel]        = useState("gcse");
  const [stage,        setStage]        = useState<"input" | "loading" | "results">("input");
  const [result,       setResult]       = useState<ChemistryExplanation | null>(null);
  const [error,        setError]        = useState("");
  const [activeTab,    setActiveTab]    = useState<"concept" | "particles" | "why" | "history" | "theory" | "realworld" | "intuition" | "misconceptions" | "tryit" | "tutor">("concept");
  const [loadStep,     setLoadStep]     = useState(0);
  const [explorerMode, setExplorerMode] = useState(false);
  const [simplifying,  setSimplifying]  = useState(false);
  const [deepening,    setDeepening]    = useState(false);
  const [simpleResult, setSimpleResult] = useState<any>(null);
  const [deepResult,   setDeepResult]   = useState<any>(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [saveError,    setSaveError]    = useState("");

  // ── Reopen from workspace ──────────────────────────────────────────────────
  useEffect(() => {
    if (!reopenData?.resultJson) return;
    try {
      const parsed = JSON.parse(reopenData.resultJson) as ChemistryExplanation;
      setQuestion(reopenData.question);
      setLevel(reopenData.level.toLowerCase());
      setResult(parsed);
      setStage("results");
      setActiveTab("concept");
      setSimpleResult(null); setDeepResult(null); setSaved(false);
      onReopened?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { console.error("[ChemistryEngineTool] reopen failed:", e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reopenData]);

  const LOAD_STEPS = [
    "Reading your question…",
    "Breaking it down to particle level…",
    "Researching the history…",
    "Finding real-world applications…",
    "Identifying misconceptions…",
    "Building your complete breakdown…",
  ];

  const handleExplain = async (q: string, lvl: string, explorer = false) => {
    if (!q.trim()) return;
    setQuestion(q); setLevel(lvl);
    setStage("loading"); setError(""); setLoadStep(0);
    setResult(null); setSimpleResult(null); setDeepResult(null);
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 1100);
    try {
      const res  = await fetch("/api/tools/chemistry-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, level: lvl, mode: "full", explorerMode: explorer }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Chemistry Engine",
        });
        clearInterval(interval);
        setStage("input");
        setError("You've run out of tokens to explore chemistry concepts. Please play some games to earn more tokens, then try again.");
        return;
      }

      const data = await res.json();
      clearInterval(interval);
      if (!res.ok || !data.result) { setError(data.error ?? "Explanation failed — please try again."); setStage("input"); return; }
      setResult(data.result); setActiveTab("concept"); setStage("results");
    } catch { clearInterval(interval); setError("Network error — please try again."); setStage("input"); }
  };

  const handleSimpler = async () => {
    if (!question || !result) return; setSimplifying(true);
    try {
      const res  = await fetch("/api/tools/chemistry-engine/explain", { 
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ question, level, mode: "simpler" }) 
      });

      // ── NEW: handle 402 insufficient tokens for simpler mode ─────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Chemistry Engine (Simpler)",
        });
        setSimplifying(false);
        return;
      }

      const data = await res.json(); 
      setSimpleResult(data.result);
    } catch {} 
    setSimplifying(false);
  };

  const handleDeeper = async () => {
    if (!question || !result) return; setDeepening(true);
    try {
      const res  = await fetch("/api/tools/chemistry-engine/explain", { 
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ question, level, mode: "deeper" }) 
      });

      // ── NEW: handle 402 insufficient tokens for deeper mode ──────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Chemistry Engine (Deeper)",
        });
        setDeepening(false);
        return;
      }

      const data = await res.json(); 
      setDeepResult(data.result);
    } catch {} 
    setDeepening(false);
  };

  const vizData = result ? buildVisualisationData(result.visualisation) : null;

  // ── INPUT ──────────────────────────────────────────────────────────────────
  if (stage === "input") return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button onClick={() => setExplorerMode(false)}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-sm border transition-colors ${!explorerMode ? "text-white border-transparent" : "bg-white text-stone-500 border-stone-200"}`}
          style={!explorerMode ? { backgroundColor: ACCENT } : {}}>
          <FlaskConical className="w-4 h-4" />Question Mode
        </button>
        <button onClick={() => setExplorerMode(true)}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-sm border transition-colors ${explorerMode ? "text-white border-transparent" : "bg-white text-stone-500 border-stone-200"}`}
          style={explorerMode ? { backgroundColor: ACCENT } : {}}>
          <Telescope className="w-4 h-4" />Theory Explorer
        </button>
      </div>
      {/* Level */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Your Level</label>
        <div className="flex gap-2">
          {LEVELS.map(l => (
            <button key={l.id} onClick={() => setLevel(l.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-sm border text-center transition-colors ${level === l.id ? "border-emerald-300 bg-emerald-50" : "bg-white border-stone-200 hover:border-stone-400"}`}>
              <span className="text-lg">{l.flag}</span>
              <span className={`text-xs font-bold ${level === l.id ? "text-emerald-700" : "text-stone-500"}`}>{l.label}</span>
              <span className="text-[10px] text-stone-400">{l.sublabel}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Input */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
          {explorerMode ? "Chemistry Topic to Explore" : "Your Chemistry Question or Topic"}
        </label>
        {explorerMode ? (
          <>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3}
              placeholder="e.g. Chemical Bonding, Thermochemistry, Acid-Base Reactions…"
              className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EXPLORER_TOPICS.map(t => (
                <button key={t} onClick={() => setQuestion(t)}
                  className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-sm transition-colors">{t}</button>
              ))}
            </div>
          </>
        ) : (
          <>
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleExplain(question, level, explorerMode)}
              placeholder={`Paste any chemistry question or concept…\n\nExamples:\n• Explain ionic bonding\n• How does the mole work?\n• What is Le Chatelier's Principle?\n• Why do exothermic reactions release heat?`}
              rows={6}
              className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EXAMPLE_QUESTIONS.slice(0, 6).map(ex => (
                <button key={ex} onClick={() => setQuestion(ex)}
                  className="text-xs text-stone-500 bg-stone-50 border border-stone-200 hover:border-emerald-400 hover:text-emerald-600 px-2.5 py-1.5 rounded-sm transition-colors">{ex}</button>
              ))}
            </div>
          </>
        )}
      </div>
      <button onClick={() => handleExplain(question, level, explorerMode)} disabled={!question.trim()}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white disabled:opacity-40 py-4 rounded-sm transition-colors shadow-sm"
        style={{ backgroundColor: ACCENT }}>
        <FlaskConical className="w-5 h-5" />
        {explorerMode ? "Explore This Topic" : "Understand This"}
      </button>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (stage === "loading") return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🧪</div>
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-sm font-semibold text-stone-600">
            {LOAD_STEPS[loadStep]}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-stone-400 mt-1">Building your 10-layer breakdown…</p>
      </div>
      <div className="flex gap-1.5">
        {LOAD_STEPS.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-emerald-400" : "bg-stone-200"}`} />)}
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (!result) return null;

  const TABS = [
    { id: "concept",       label: "Concept",        icon: FlaskConical   },
    { id: "particles",     label: "Particles ⚛️",   icon: Atom           },
    { id: "why",           label: "Why It Exists",  icon: Zap            },
    { id: "history",       label: "History",         icon: History        },
    { id: "theory",        label: "Theory",          icon: Microscope     },
    { id: "realworld",     label: "Real World",      icon: Globe          },
    { id: "intuition",     label: "Intuition",       icon: Brain          },
    { id: "misconceptions",label: "Misconceptions",  icon: AlertTriangle  },
    { id: "tryit",         label: "Try It",          icon: TestTube       },
    { id: "tutor",         label: "Ask Tutor",       icon: MessageSquare  },
  ] as const;

  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Dark results header */}
      <div className="text-white rounded-sm p-5" style={{ backgroundColor: "#0a1f14" }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{result.topic}</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-sm">{result.difficulty}</span>
              {result.estimatedReadMinutes > 0 && <span className="text-[10px] text-white/30">~{result.estimatedReadMinutes} min</span>}
            </div>
            <p className="text-xl font-black">{result.conceptName}</p>
            {result.keyChemists?.length > 0 && (
              <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                <Beaker className="w-3 h-3" />{result.keyChemists.join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* One-line summary */}
        <div className="bg-white/8 border border-white/15 rounded-sm px-4 py-3 mb-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">In one sentence</p>
          <p className="text-base font-bold text-white leading-snug">{result.simpleDefinition.oneLineSummary}</p>
        </div>

        {result.whyItMatters && (
          <p className="text-xs text-white/60 leading-relaxed mb-4">{result.whyItMatters}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleSimpler} disabled={simplifying}
            className="flex items-center gap-1.5 text-xs font-bold text-white border border-white/20 hover:bg-white/10 px-3 py-2 rounded-sm transition-colors disabled:opacity-60">
            {simplifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeft className="w-3.5 h-3.5" />}Simpler
          </button>
          <button onClick={handleDeeper} disabled={deepening}
            className="flex items-center gap-1.5 text-xs font-bold text-white border border-white/20 hover:bg-white/10 px-3 py-2 rounded-sm transition-colors disabled:opacity-60">
            {deepening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}Deeper
          </button>
          {isSignedIn && (
            <button
              onClick={async () => {
                setSaving(true); setSaveError(""); setSaved(false);
                try {
                  const res = await fetch("/api/tools/chemistry-engine/save", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question, level, explorerMode, result }),
                  });
                  const data = await res.json();
                  if (!res.ok) setSaveError(data.error ?? "Save failed");
                  else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
                } catch { setSaveError("Network error"); }
                setSaving(false);
              }}
              disabled={saving}
              className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${saved ? "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" : "text-white/70 hover:text-white border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <span className="text-sm">💾</span>}
              {saving ? "Saving…" : saved ? "Saved!" : "Save"}
            </button>
          )}
          <button onClick={() => { setStage("input"); setResult(null); }}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white ml-auto transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />New
          </button>
        </div>
        {saveError && <p className="text-xs text-red-300 mt-2">{saveError}</p>}
      </div>

      {/* Simpler / Deeper panels */}
      <AnimatePresence>
        {simpleResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-amber-700 uppercase tracking-wider">✨ Simplified</p>
              <button onClick={() => setSimpleResult(null)} className="text-amber-400 hover:text-amber-700"><X className="w-4 h-4" /></button>
            </div>
            {simpleResult.analogy && <p className="text-sm text-amber-900 mb-3"><strong>Analogy:</strong> {simpleResult.analogy}</p>}
            <p className="text-sm text-amber-800 leading-relaxed mb-2">{simpleResult.simplifiedExplanation}</p>
            {simpleResult.particleSimplified && (
              <div className="bg-amber-100/70 border border-amber-200 rounded-sm px-3 py-2 mb-2">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-0.5">⚛️ At the particle level</p>
                <p className="text-xs text-amber-800">{simpleResult.particleSimplified}</p>
              </div>
            )}
            {simpleResult.rememberThis && (
              <div className="bg-amber-100 border border-amber-300 rounded-sm px-3 py-2">
                <p className="text-xs font-black text-amber-700">Remember: {simpleResult.rememberThis}</p>
              </div>
            )}
          </motion.div>
        )}
        {deepResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-purple-50 border border-purple-200 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-purple-700 uppercase tracking-wider">🔬 Deep Dive</p>
              <button onClick={() => setDeepResult(null)} className="text-purple-400 hover:text-purple-700"><X className="w-4 h-4" /></button>
            </div>
            {deepResult.quantumLevel && <p className="text-sm text-purple-800 leading-relaxed mb-3">{deepResult.quantumLevel}</p>}
            {deepResult.derivation && <div className="bg-stone-900 text-purple-300 rounded-sm px-4 py-3 font-mono text-xs mb-3 whitespace-pre-wrap">{deepResult.derivation}</div>}
            {deepResult.advancedTheory && <p className="text-sm text-purple-700 leading-relaxed mb-2">{deepResult.advancedTheory}</p>}
            {deepResult.limitationsOfSimpleModel && (
              <div className="bg-purple-100 border border-purple-200 rounded-sm px-3 py-2 mb-2">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider mb-1">Where the simple model breaks down</p>
                <p className="text-xs text-purple-800 leading-relaxed">{deepResult.limitationsOfSimpleModel}</p>
              </div>
            )}
            {deepResult.nobelConnections && <p className="text-xs text-purple-600 mb-1">🏆 {deepResult.nobelConnections}</p>}
            {deepResult.currentResearch && <p className="text-xs text-purple-500 italic">🔭 {deepResult.currentResearch}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualisation — inline before tabs */}
      {vizData && <ChemistryVisualiser data={vizData} />}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-stone-400 hover:text-stone-700"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── CONCEPT tab ───────────────────────────────────────────── */}
      {activeTab === "concept" && (
        <div className="space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-5">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">Plain English Definition</p>
            <p className="text-sm text-emerald-900 leading-relaxed">{result.simpleDefinition.expandedDefinition}</p>
          </div>
          {result.simpleDefinition.everydayAnalogy && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-4">
              <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Everyday Analogy</p>
                <p className="text-sm text-amber-800 leading-relaxed">{result.simpleDefinition.everydayAnalogy}</p>
              </div>
            </div>
          )}
          <GoverningLawCard law={result.corePrinciple} />
          {result.examTips?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-yellow-500" /><p className="text-[10px] font-black text-yellow-700 uppercase tracking-wider">Exam tips</p></div>
              <ul className="space-y-1.5">
                {result.examTips.map((tip, i) => <li key={i} className="text-xs text-yellow-800 flex items-start gap-2"><span className="font-bold flex-shrink-0">{i+1}.</span>{tip}</li>)}
              </ul>
            </div>
          )}
          {result.conceptLinks?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Connects To</p>
              <div className="space-y-2">
                {result.conceptLinks.map((cl, i) => {
                  const cfg = DIRECTION_CFG[cl.direction] ?? DIRECTION_CFG.parallel;
                  return (
                    <div key={i} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm flex-shrink-0" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
                      <p className="text-sm font-semibold text-stone-800 flex-shrink-0">{cl.concept}</p>
                      <p className="text-xs text-stone-500 ml-auto text-right">{cl.relationship}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PARTICLES tab ─────────────────────────────────────────── */}
      {activeTab === "particles" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3.5">
            <Atom className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed">
              <span className="font-bold">This is the key to chemistry.</span> Understanding what atoms and electrons are actually doing is what separates students who guess from students who can explain anything.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ParticleCard title="What Atoms Do"        content={result.particleLevel.whatAtomsDo}           icon={Atom}       color="#10b981" />
            <ParticleCard title="What Electrons Do"    content={result.particleLevel.whatElectronsDo}       icon={Zap}        color="#6366f1" />
            <ParticleCard title="Bonds Breaking/Forming" content={result.particleLevel.whatBondsDoBreakForm} icon={Layers}     color="#f59e0b" />
            <ParticleCard title="Why We Can't See This" content={result.particleLevel.whyCannotSeeIt}       icon={Microscope  } color="#8b5cf6" />
          </div>
          <div className="bg-stone-900 text-white rounded-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-2">🧠 The Particle Picture</p>
            <p className="text-sm leading-relaxed text-white/90">{result.particleLevel.particleModel}</p>
          </div>
        </div>
      )}

      {/* ── WHY IT EXISTS tab ─────────────────────────────────────── */}
      {activeTab === "why" && (
        <div className="space-y-4">
          <div className="bg-stone-900 text-white rounded-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-3">The Problem That Started It All</p>
            <p className="text-sm leading-relaxed">{result.whyItExists.problemItSolved}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-sm p-5">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">Before the Discovery</p>
              <p className="text-sm text-red-800 leading-relaxed">{result.whyItExists.beforeDiscovery}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-5">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">The Breakthrough</p>
              <p className="text-sm text-emerald-800 leading-relaxed">{result.whyItExists.breakthrough}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-sm px-4 py-4">
            <Sparkles className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider mb-1">Impact on Chemistry</p>
              <p className="text-sm text-sky-800 leading-relaxed">{result.whyItExists.impactOnChemistry}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY tab ───────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="bg-stone-900 text-white rounded-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-2">Discovery</p>
            <p className="text-sm leading-relaxed">{result.history.discovered}</p>
          </div>
          {result.history.chemists?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Key Chemists</p>
              <div className="space-y-2">
                {result.history.chemists.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 text-white" style={{ backgroundColor: ACCENT }}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2"><p className="text-sm font-bold text-stone-900">{c.name}</p><span className="text-[10px] text-stone-400">{c.era}</span></div>
                      <p className="text-xs text-stone-600 leading-relaxed">{c.contribution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.history.keyMoment && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">The Key Moment</p>
              <p className="text-sm text-stone-700 leading-relaxed">{result.history.keyMoment}</p>
            </div>
          )}
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">How It Evolved</p>
            <p className="text-sm text-stone-700 leading-relaxed">{result.history.evolution}</p>
          </div>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-4">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div>
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">Fun Fact</p>
              <p className="text-sm text-amber-800 leading-relaxed">{result.history.funFact}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── THEORY tab ────────────────────────────────────────────── */}
      {activeTab === "theory" && (
        <div className="space-y-4">
          {result.theoryExplainer.theoryName && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-5">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">{result.theoryExplainer.theoryName}</p>
              <p className="text-sm text-indigo-900 leading-relaxed">{result.theoryExplainer.whatItSays}</p>
            </div>
          )}
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Why This Theory Makes Sense</p>
            <p className="text-sm text-stone-700 leading-relaxed">{result.theoryExplainer.whyItMakesSense}</p>
          </div>
          {result.theoryExplainer.predictions?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">What This Theory Predicts</p>
              <div className="space-y-2">
                {result.theoryExplainer.predictions.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{p}
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.theoryExplainer.limitations && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Where This Theory Breaks Down</p>
                <p className="text-xs text-amber-800 leading-relaxed">{result.theoryExplainer.limitations}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REAL WORLD tab ────────────────────────────────────────── */}
      {activeTab === "realworld" && (
        <div className="space-y-3">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Where {result.conceptName} shapes the world today</p>
          {result.realWorld.map((rw, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-sm" style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}>{rw.field}</span>
              </div>
              <p className="text-sm font-semibold text-stone-800 mb-1">{rw.application}</p>
              <p className="text-sm text-stone-600 leading-relaxed mb-1">{rw.example}</p>
              {rw.impact && <p className="text-xs text-stone-400 italic">{rw.impact}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── INTUITION tab ─────────────────────────────────────────── */}
      {activeTab === "intuition" && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-5">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-2">Primary Mental Model</p>
            <p className="text-sm text-indigo-900 leading-relaxed">{result.intuition.primaryModel}</p>
          </div>
          {result.intuition.thinkAboutItLike && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-4">
              <Brain className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Think about it like…</p>
                <p className="text-sm text-amber-800 leading-relaxed">{result.intuition.thinkAboutItLike}</p>
              </div>
            </div>
          )}
          {result.intuition.alternativeModel && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Alternative mental model</p>
              <p className="text-sm text-stone-700 leading-relaxed">{result.intuition.alternativeModel}</p>
            </div>
          )}
          {result.intuition.whatChangesWhen?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Build your intuition — what changes when…</p>
              <div className="space-y-2">
                {result.intuition.whatChangesWhen.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />{w}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MISCONCEPTIONS tab ────────────────────────────────────── */}
      {activeTab === "misconceptions" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-sm px-4 py-3.5">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">
              These are things that students — and sometimes teachers — commonly believe that are <strong>actually wrong</strong>. Click each one to see the truth.
            </p>
          </div>
          {result.misconceptions?.map((m, i) => <MisconceptionCard key={i} m={m} />)}
        </div>
      )}

      {/* ── TRY IT tab ────────────────────────────────────────────── */}
      {activeTab === "tryit" && (
        <div className="space-y-5">
          {result.experiments?.length > 0 && (
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Experiments You Can Try</p>
              <div className="space-y-2">
                {result.experiments.map((exp, i) => <ExperimentCard key={i} exp={exp} />)}
              </div>
            </div>
          )}
          <div className="border-t border-stone-100 pt-5">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Practice Questions</p>
            <PracticePanel 
              result={result} 
              level={level} 
              question={question} 
              onInsufficientTokens={onInsufficientTokens}
              />
          </div>
        </div>
      )}

      {/* ── TUTOR tab ─────────────────────────────────────────────── */}
      {activeTab === "tutor" && <AITutor 
          question={question} 
          level={level} 
          onInsufficientTokens={onInsufficientTokens}
        />
        }
    </div>
  );
}