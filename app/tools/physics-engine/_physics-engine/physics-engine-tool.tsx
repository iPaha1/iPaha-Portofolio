"use client";

// =============================================================================
// isaacpaha.com — Physics Understanding Engine
// app/tools/physics-engine/_components/physics-engine-tool.tsx
//
// 8-layer concept breakdown system:
//   TAB 1: Concept       — plain definition + analogy + governing law
//   TAB 2: Why It Exists — problem, before discovery, breakthrough
//   TAB 3: History       — discovery, scientists, evolution, fun fact
//   TAB 4: Real World    — applications across multiple fields
//   TAB 5: Intuition     — mental models, analogies, "think about it like..."
//   TAB 6: Misconceptions— wrong beliefs corrected with evidence
//   TAB 7: Try It        — experiments + practice questions
//   TAB 8: Tutor         — AI follow-up assistant
//
// Special modes:
//   - Theory Explorer: broad topic mode ("Relativity", "Quantum Mechanics")
//   - Explain Simpler / Go Deeper buttons
//   - Depth slider: GCSE → A-Level → University
//   - Level selector: GCSE / A-Level / University
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence }               from "framer-motion";
import {
  Atom, Sparkles, Loader2, AlertCircle, Check, Copy,
  ChevronDown, ChevronUp, ArrowRight, RefreshCw, X, Send,
  BookOpen, Lightbulb, History, Globe, Brain, Zap, Target,
  FlaskConical, MessageSquare, Info, Star, ArrowLeft,
  AlertTriangle, ChevronRight, Layers, Users, Telescope,
  XCircle, CheckCircle2, Beaker,
} from "lucide-react";
import { PhysicsVisualiser, VisualisationData } from "./physics-visualiser";


// ─── Types ────────────────────────────────────────────────────────────────────
 
interface PhysicsExplanation {
  topic:           string;
  conceptName:     string;
  keyScientists:   string[];
  plainDefinition: {
    oneLineSummary:      string;
    expandedDefinition:  string;
    analogy:             string;
  };
  governingLaw: {
    name:      string;
    equation:  string;
    terms:     { symbol: string; meaning: string; unit: string }[];
    inWords:   string;
    levelNote: string;
  };
  whyItExists: {
    problem:        string;
    beforeDiscovery: string;
    breakthrough:   string;
    significance:   string;
  };
  history: {
    discovered:  string;
    keyMoment:   string;
    evolution:   string;
    funFact:     string;
    scientists:  { name: string; contribution: string; era: string }[];
  };
  realWorld: {
    field:       string;
    application: string;
    example:     string;
    impact:      string;
  }[];
  intuition: {
    primaryModel:    string;
    alternativeModel: string;
    thinkAboutItLike: string;
    whatChangesWhen: string[];
  };
  misconceptions: {
    wrongBelief:    string;
    whyItSeemsTrue: string;
    truth:          string;
    evidence:       string;
  }[];
  experiments: {
    title:        string;
    materials:    string[];
    instructions: string;
    whatYoullSee: string;
    safetyNote:   string;
  }[];
  conceptLinks: { concept: string; relationship: string; direction: "prerequisite" | "builds-on" | "parallel" }[];
  whyItMatters:   string;
  levelSummary:   string;
  examTips:       string[];
  visualisation: {
    type:        string;
    description: string;
    keyPoints:   string[];
    data?:       any;
  };
  difficulty:             string;
  estimatedReadMinutes:   number;
}

export interface TokenGateInfo {
  required: number;
  balance:  number;
  toolName: string | null;
}

export interface PhysicsEngineToolProps {
  /** Called when the API returns 402 — parent page shows the modal */
     onInsufficientTokens?: (info: TokenGateInfo) => void;
    }
 
// ─── Config ───────────────────────────────────────────────────────────────────
 
const LEVELS = [
  { id: "gcse",       label: "GCSE",         flag: "🇬🇧", sublabel: "Year 10-11"   },
  { id: "alevel",     label: "A-Level",       flag: "🇬🇧", sublabel: "Year 12-13"   },
  { id: "university", label: "University",    flag: "🎓",  sublabel: "Degree level" },
];
 
const ACCENT = "#0ea5e9";
 
const EXAMPLE_QUESTIONS = [
  "Explain Newton's Second Law of Motion",
  "What is electromagnetic induction?",
  "How does nuclear fission work?",
  "Explain the photoelectric effect",
  "What causes gravity?",
  "How do waves transfer energy?",
  "Explain thermodynamics — why can't we build a perfect engine?",
  "What is quantum entanglement?",
  "How does a transformer work?",
  "Explain special relativity",
];
 
const EXPLORER_TOPICS = [
  "Quantum Mechanics", "General Relativity", "Thermodynamics",
  "Electromagnetism", "Particle Physics", "Astrophysics",
  "Wave Mechanics", "Nuclear Physics", "Classical Mechanics",
  "Optics & Light",
];
 
const DIRECTION_CFG = {
  prerequisite: { color: "#6b7280", bg: "#f3f4f6", label: "Prerequisite" },
  "builds-on":  { color: "#0ea5e9", bg: "#e0f2fe", label: "Builds on"   },
  parallel:     { color: "#8b5cf6", bg: "#ede9fe", label: "Related"      },
};
 
// ─── Utilities ────────────────────────────────────────────────────────────────
 
function buildVisualisationData(vizData: any): VisualisationData | null {
  if (!vizData || vizData.type === "none" || !vizData.type) return null;
  const type = vizData.type as VisualisationData["type"];
  const out: VisualisationData = {
    type,
    description: vizData.description,
    keyPoints:   vizData.keyPoints ?? [],
  };
  if (vizData.data) {
    const d = typeof vizData.data === "string" ? (() => { try { return JSON.parse(vizData.data); } catch { return vizData.data; } })() : vizData.data;
    // Physics-specific
    if (d?.amplitude     !== undefined) out.amplitude      = d.amplitude;
    if (d?.frequency     !== undefined) out.frequency      = d.frequency;
    if (d?.waveType)                    out.waveType        = d.waveType;
    if (d?.motionType)                  out.motionType      = d.motionType;
    if (d?.initialValue  !== undefined) out.initialValue   = d.initialValue;
    if (d?.finalValue    !== undefined) out.finalValue     = d.finalValue;
    if (d?.timeRange     !== undefined) out.timeRange      = d.timeRange;
    if (d?.circuitType)                 out.circuitType     = d.circuitType;
    if (d?.components)                  out.components      = d.components;
    if (d?.vectors)                     out.vectors         = d.vectors;
    // Math-inherited
    if (d?.functionExpression) out.functionExpression = d.functionExpression;
    if (d?.xRange)             out.xRange             = d.xRange;
    if (d?.keyValues)          out.keyValues           = d.keyValues;
    if (d?.annotations)        out.annotations         = d.annotations;
  }
  return out;
}
 
// ─── Governing Law Card ───────────────────────────────────────────────────────
 
function GoverningLawCard({ law }: { law: PhysicsExplanation["governingLaw"] }) {
  return (
    <div className="bg-stone-900 text-white rounded-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-white/50">{law.name}</p>
      </div>
      <div className="px-5 py-5">
        {/* The equation — large and prominent */}
        <div className="text-center mb-5">
          <p className="text-4xl font-black font-mono text-sky-300 tracking-wider">{law.equation}</p>
          <p className="text-sm text-white/50 mt-2 italic">"{law.inWords}"</p>
        </div>
        {/* Term breakdown */}
        {law.terms.length > 0 && (
          <div className="space-y-2">
            {law.terms.map((t, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-sm px-3 py-2">
                <span className="w-10 text-sky-300 font-black font-mono text-base flex-shrink-0">{t.symbol}</span>
                <span className="text-sm text-white/80 flex-1">{t.meaning}</span>
                <span className="text-[11px] text-white/40 font-mono flex-shrink-0">{t.unit}</span>
              </div>
            ))}
          </div>
        )}
        {law.levelNote && (
          <p className="text-xs text-sky-200/60 mt-3 leading-relaxed border-t border-white/10 pt-3">{law.levelNote}</p>
        )}
      </div>
    </div>
  );
}
 
// ─── Misconception Card ───────────────────────────────────────────────────────
 
function MisconceptionCard({ m, index }: { m: PhysicsExplanation["misconceptions"][0]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-stone-100 rounded-sm overflow-hidden">
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-stone-50 transition-colors">
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <XCircle className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-red-600 line-through leading-snug">{m.wrongBelief}</p>
          {!open && <p className="text-xs text-stone-400 mt-0.5">Click to see why this is wrong…</p>}
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
              {m.evidence && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-2">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Proof / Evidence</p>
                  <p className="text-xs text-emerald-800 leading-relaxed">{m.evidence}</p>
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
 
function ExperimentCard({ exp }: { exp: PhysicsExplanation["experiments"][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-sky-100 rounded-sm overflow-hidden bg-sky-50/30">
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-sky-50 transition-colors">
        <div className="w-8 h-8 rounded-sm bg-sky-100 flex items-center justify-center flex-shrink-0">
          <Beaker className="w-4 h-4 text-sky-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-sky-800">{exp.title}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {exp.materials.slice(0, 3).map((m, i) => (
              <span key={i} className="text-[10px] text-sky-600 bg-white border border-sky-200 px-1.5 py-0.5 rounded-sm">{m}</span>
            ))}
            {exp.materials.length > 3 && (
              <span className="text-[10px] text-sky-400">+{exp.materials.length - 3} more</span>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4 text-sky-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-sky-100 px-4 py-4 space-y-3">
              {/* All materials */}
              <div>
                <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider mb-1.5">You'll need</p>
                <div className="flex flex-wrap gap-1.5">
                  {exp.materials.map((m, i) => (
                    <span key={i} className="text-xs text-sky-700 bg-white border border-sky-200 px-2 py-1 rounded-sm">{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider mb-1.5">Instructions</p>
                <p className="text-sm text-stone-700 leading-relaxed">{exp.instructions}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-3">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">What you'll see & why</p>
                <p className="text-xs text-emerald-800 leading-relaxed">{exp.whatYoullSee}</p>
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
 
function PracticePanel({ result, level, question, onInsufficientTokens }: {
  result:   PhysicsExplanation;
  level:    string;
  question: string;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
}) {
  const [qType,     setQType]     = useState<"practice" | "theory_questions">("practice");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [openHints, setOpenHints] = useState<Set<number>>(new Set());
  const [openSols,  setOpenSols]  = useState<Set<number>>(new Set());
  const [answers,   setAnswers]   = useState<Record<number, string>>({});
 
  const toggle = (set: Set<number>, fn: any, i: number) => {
    fn((p: Set<number>) => { const n = new Set(p); p.has(i) ? n.delete(i) : n.add(i); return n; });
  };
 
  const generate = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/physics-engine/experiments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: result.topic, conceptName: result.conceptName, level, type: qType, originalQuestion: question }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Physics Practice Questions",
        });
        setLoading(false);
        return;
      }

      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch {}
    setLoading(false);
  };
 
  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {([
            { id: "practice",         label: "📐 Calculation Questions" },
            { id: "theory_questions", label: "📝 Theory Questions"      },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setQType(t.id)}
              className={`flex-1 text-xs font-bold py-2.5 px-4 rounded-sm border transition-colors ${qType === t.id ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-sm p-5">
          <p className="text-sm font-black text-sky-800 mb-1">Practice makes permanent</p>
          <p className="text-xs text-sky-600 leading-relaxed mb-3">
            Generate {qType === "practice" ? "5 calculation questions" : "6 theory questions"} on <strong>{result.conceptName}</strong> at <strong>{level.toUpperCase()}</strong> level.
            {qType === "practice" ? " Includes worked solutions and mark schemes." : " Includes model answers and key terms."}
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
  }
 
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
          {questions.length} {qType === "practice" ? "calculation" : "theory"} questions
        </p>
        <button onClick={() => { setQuestions([]); setOpenHints(new Set()); setOpenSols(new Set()); }}
          className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />New set
        </button>
      </div>
 
      {questions.map((q: any, i: number) => (
        <div key={q.id} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {q.difficulty && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                      style={{ color: q.difficulty === "Analysis" ? "#ef4444" : q.difficulty === "Application" ? "#f59e0b" : "#10b981", backgroundColor: q.difficulty === "Analysis" ? "#fee2e2" : q.difficulty === "Application" ? "#fef3c7" : "#d1fae5" }}>
                      {q.difficulty}
                    </span>
                  )}
                  {q.marks && <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-sm">[{q.marks} mark{q.marks > 1 ? "s" : ""}]</span>}
                  {q.examStyle && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-sm">📝 Exam style</span>}
                </div>
                <p className="text-sm font-semibold text-stone-900 leading-snug">{q.question}</p>
                {qType === "practice" && (
                  <input value={answers[q.id] ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                    placeholder="Write your answer here…"
                    className="w-full mt-3 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-sky-400"
                  />
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {q.hint && (
                <button onClick={() => toggle(openHints, setOpenHints, i)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors ${openHints.has(i) ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-300"}`}>
                  <Lightbulb className="w-3 h-3" />{openHints.has(i) ? "Hide hint" : "Hint"}
                </button>
              )}
              <button onClick={() => toggle(openSols, setOpenSols, i)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors ${openSols.has(i) ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-emerald-300"}`}>
                <Check className="w-3 h-3" />{openSols.has(i) ? "Hide answer" : "Reveal answer"}
              </button>
            </div>
          </div>
 
          <AnimatePresence>
            {openHints.has(i) && q.hint && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="border-t border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-bold text-amber-600 mb-1">💡 Hint</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{q.hint}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
 
          <AnimatePresence>
            {openSols.has(i) && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-4 space-y-2">
                  {qType === "practice" && q.solution && (
                    <>
                      {q.solution.workingOut?.map((s: string, si: number) => (
                        <p key={si} className="text-xs text-emerald-700 flex items-start gap-1.5">
                          <span className="font-bold flex-shrink-0">{si + 1}.</span>{s}
                        </p>
                      ))}
                      <p className="text-sm font-black text-emerald-800">→ {q.solution.finalAnswer}</p>
                      {q.solution.markScheme && (
                        <div className="bg-white/60 border border-emerald-200 rounded-sm px-3 py-2 mt-2">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Mark scheme</p>
                          <p className="text-xs text-emerald-700 leading-relaxed">{q.solution.markScheme}</p>
                        </div>
                      )}
                    </>
                  )}
                  {qType === "theory_questions" && q.modelAnswer && (
                    <>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Model answer</p>
                      <p className="text-sm text-emerald-800 leading-relaxed">{q.modelAnswer}</p>
                      {q.keyTerms?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {q.keyTerms.map((t: string) => (
                            <span key={t} className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.5 rounded-sm">{t}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {q.commonError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-sm px-3 py-2 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700"><span className="font-bold">Common error: </span>{q.commonError}</p>
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
    setMessages((p) => [...p, { role: "user", text: msg }]);
    setInput(""); setLoading(true);
    try {
      const res  = await fetch("/api/tools/physics-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, level, mode: "tutor", followUpContext: `Original topic: "${question}". Student asks: "${msg}"` }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) {
          onInsufficientTokens({
            required: data.required ?? 0,
            balance:  data.balance  ?? 0,
            toolName: data.toolName ?? "Physics Tutor",
          });
        }
        setMessages((p) => [...p, { role: "ai", text: "You've run out of tokens to use the Physics Tutor. Please play some games to earn more tokens, then try again." }]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      const r    = data.result;
      if (r?.response) setMessages((p) => [...p, { role: "ai", text: r.response }]);
      if (r?.guidingQuestion) setTimeout(() => setMessages((p) => [...p, { role: "ai", text: `🤔 ${r.guidingQuestion}` }]), 700);
    } catch {
      setMessages((p) => [...p, { role: "ai", text: "Connection error — please try again." }]);
    }
    setLoading(false);
  };
 
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-sm px-4 py-3.5">
        <Brain className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-sky-800">Physics Tutor</p>
          <p className="text-xs text-sky-600 mt-0.5 leading-relaxed">
            Ask any follow-up. "Why can't anything travel faster than light?" — "What would happen if gravity reversed?" — I'll guide you to understanding, not just give you the answer.
          </p>
        </div>
      </div>
 
      {messages.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${m.role === "user" ? "bg-stone-200 text-stone-700" : "text-white"}`}
                style={m.role === "ai" ? { backgroundColor: ACCENT } : {}}>
                {m.role === "user" ? "You" : "⚛️"}
              </div>
              <div className={`flex-1 max-w-[85%] rounded-sm px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-stone-100 text-stone-700" : "bg-sky-50 border border-sky-200 text-sky-900"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: ACCENT }}>⚛️</div>
              <div className="bg-sky-50 border border-sky-200 rounded-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                <span className="text-xs text-sky-500">Thinking…</span>
              </div>
            </div>
          )}
        </div>
      )}
 
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && ask()}
          placeholder="Ask anything about this topic…"
          className="flex-1 text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-sky-400"
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
 
// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
 
export interface PhysicsReopenData {
  resultJson: string;
  question:   string;
  level:      string;
}
 
export function PhysicsEngineTool({
  isSignedIn  = false,
  reopenData,
  onReopened,
  onInsufficientTokens,
}: {
  isSignedIn?:  boolean;
  reopenData?:  PhysicsReopenData | null;
  onReopened?:  () => void;
  onInsufficientTokens?: (info: TokenGateInfo) => void;

}) {
  const [question,      setQuestion]      = useState("");
  const [level,         setLevel]         = useState("gcse");
  const [stage,         setStage]         = useState<"input" | "loading" | "results">("input");
  const [result,        setResult]        = useState<PhysicsExplanation | null>(null);
  const [error,         setError]         = useState("");
  const [activeTab,     setActiveTab]     = useState<"concept" | "why" | "history" | "realworld" | "intuition" | "misconceptions" | "tryit" | "tutor">("concept");
  const [loadStep,      setLoadStep]      = useState(0);
  const [explorerMode,  setExplorerMode]  = useState(false);
  const [simplifying,   setSimplifying]   = useState(false);
  const [deepening,     setDeepening]     = useState(false);
  const [simpleResult,  setSimpleResult]  = useState<any>(null);
  const [deepResult,    setDeepResult]    = useState<any>(null);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [saveError,     setSaveError]     = useState("");
 
  // ── Reopen from workspace ──────────────────────────────────────────────────
  useEffect(() => {
    if (!reopenData?.resultJson) return;
    try {
      const parsed = JSON.parse(reopenData.resultJson) as PhysicsExplanation;
      setQuestion(reopenData.question);
      setLevel(reopenData.level.toLowerCase());
      setResult(parsed);
      setStage("results");
      setActiveTab("concept");
      setSimpleResult(null);
      setDeepResult(null);
      setSaved(false);
      onReopened?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error("[PhysicsEngineTool] Failed to reopen saved result:", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reopenData]);
 
  const LOAD_STEPS = [
    "Reading your question…",
    "Understanding the concept…",
    "Researching the history…",
    "Finding real-world applications…",
    "Building mental models…",
    "Identifying misconceptions…",
    "Preparing everything…",
  ];
 
  const handleExplain = async (q: string, lvl: string, explorer = false) => {
    if (!q.trim()) return;
    setQuestion(q); setLevel(lvl);
    setStage("loading"); setError(""); setLoadStep(0);
    setResult(null); setSimpleResult(null); setDeepResult(null);
 
    const interval = setInterval(() => setLoadStep((p) => Math.min(p + 1, LOAD_STEPS.length - 1)), 1100);
 
    try {
      const res  = await fetch("/api/tools/physics-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, level: lvl, mode: "full", explorerMode: explorer }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Physics Engine",
        });
        clearInterval(interval);
        setStage("input");
        setError("You've run out of tokens to explore physics concepts. Please play some games to earn more tokens, then try again.");
        return;
      }

      const data = await res.json();
      clearInterval(interval);
      if (!res.ok || !data.result) {
        setError(data.error ?? "Explanation failed — please try again.");
        setStage("input"); return;
      }
      setResult(data.result);
      setActiveTab("concept");
      setStage("results");
    } catch {
      clearInterval(interval);
      setError("Network error — please check your connection and try again.");
      setStage("input");
    }
  };
 
  const handleSimpler = async () => {
    if (!question || !result) return;
    setSimplifying(true);
    try {
      const res  = await fetch("/api/tools/physics-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, level, mode: "simpler" }),
      });

      // ── NEW: handle 402 insufficient tokens for simpler mode ─────────────
      if (res.status === 402) {
        const data = await res.json();
        onInsufficientTokens?.({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Physics Engine (Simpler)",
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
    if (!question || !result) return;
    setDeepening(true);
    try {
      const res  = await fetch("/api/tools/physics-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, level, mode: "deeper" }),
      });

      // ── NEW: handle 402 insufficient tokens for deeper mode ──────────────
      if (res.status === 402) {
        const data = await res.json();
        onInsufficientTokens?.({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Physics Engine (Deeper)",
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
  if (stage === "input") {
    return (
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
            <Atom className="w-4 h-4" />Question Mode
          </button>
          <button onClick={() => setExplorerMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-sm border transition-colors ${explorerMode ? "text-white border-transparent" : "bg-white text-stone-500 border-stone-200"}`}
            style={explorerMode ? { backgroundColor: ACCENT } : {}}>
            <Telescope className="w-4 h-4" />Theory Explorer
          </button>
        </div>
 
        {/* Level selector */}
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Your Level</label>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button key={l.id} onClick={() => setLevel(l.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-sm border text-center transition-colors ${level === l.id ? "border-sky-300 bg-sky-50" : "bg-white border-stone-200 hover:border-stone-400"}`}>
                <span className="text-lg">{l.flag}</span>
                <span className={`text-xs font-bold ${level === l.id ? "text-sky-700" : "text-stone-500"}`}>{l.label}</span>
                <span className="text-[10px] text-stone-400">{l.sublabel}</span>
              </button>
            ))}
          </div>
        </div>
 
        {/* Input */}
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
            {explorerMode ? "Physics Topic to Explore" : "Your Physics Question or Topic"}
          </label>
          {explorerMode ? (
            <>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Quantum Mechanics, Special Relativity, Electromagnetism…"
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-sky-400 focus:bg-white transition-all resize-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {EXPLORER_TOPICS.map((t) => (
                  <button key={t} onClick={() => setQuestion(t)}
                    className="text-xs text-sky-600 bg-sky-50 border border-sky-200 hover:bg-sky-100 px-2.5 py-1 rounded-sm transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleExplain(question, level, explorerMode)}
                placeholder={`Paste any physics question or concept…\n\nExamples:\n• Explain Newton's Second Law\n• How does electromagnetic induction work?\n• What is the photoelectric effect?\n• Why does time slow down near a black hole?`}
                rows={6}
                className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-sky-400 focus:bg-white transition-all resize-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {EXAMPLE_QUESTIONS.slice(0, 6).map((ex) => (
                  <button key={ex} onClick={() => setQuestion(ex)}
                    className="text-xs text-stone-500 bg-stone-50 border border-stone-200 hover:border-sky-400 hover:text-sky-600 px-2.5 py-1.5 rounded-sm transition-colors">
                    {ex}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
 
        <button onClick={() => handleExplain(question, level, explorerMode)} disabled={!question.trim()}
          className="w-full flex items-center justify-center gap-2 text-base font-bold text-white disabled:opacity-40 py-4 rounded-sm transition-colors shadow-sm"
          style={{ backgroundColor: ACCENT }}>
          <Atom className="w-5 h-5" />
          {explorerMode ? "Explore This Topic" : "Understand This"}
        </button>
      </div>
    );
  }
 
  // ── LOADING ────────────────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-sky-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⚛️</div>
        </div>
        <div>
          <AnimatePresence mode="wait">
            <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} className="text-sm font-semibold text-stone-600">
              {LOAD_STEPS[loadStep]}
            </motion.p>
          </AnimatePresence>
          <p className="text-xs text-stone-400 mt-1">Building your complete understanding…</p>
        </div>
        <div className="flex gap-1.5">
          {LOAD_STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-sky-400" : "bg-stone-200"}`} />
          ))}
        </div>
      </div>
    );
  }
 
  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (!result) return null;
 
  const TABS = [
    { id: "concept",       label: "Concept",        icon: Atom         },
    { id: "why",           label: "Why It Exists",  icon: Zap          },
    { id: "history",       label: "History",         icon: History      },
    { id: "realworld",     label: "Real World",      icon: Globe        },
    { id: "intuition",     label: "Intuition",       icon: Brain        },
    { id: "misconceptions",label: "Misconceptions",  icon: AlertTriangle },
    { id: "tryit",         label: "Try It",          icon: FlaskConical },
    { id: "tutor",         label: "Ask Tutor",       icon: MessageSquare },
  ] as const;
 
  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>
 
      {/* Header banner */}
      <div className="text-white rounded-sm p-5" style={{ backgroundColor: "#0c1a2e" }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{result.topic}</span>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-sm">{result.difficulty}</span>
              {result.estimatedReadMinutes > 0 && <span className="text-[10px] text-white/30">~{result.estimatedReadMinutes} min read</span>}
            </div>
            <p className="text-xl font-black">{result.conceptName}</p>
            {result.keyScientists?.length > 0 && (
              <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {result.keyScientists.join(" · ")}
              </p>
            )}
          </div>
        </div>
 
        {/* One-line summary — the instant answer */}
        <div className="bg-white/8 border border-white/15 rounded-sm px-4 py-3 mb-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">In one sentence</p>
          <p className="text-base font-bold text-white leading-snug">{result.plainDefinition.oneLineSummary}</p>
        </div>
 
        {/* Why it matters */}
        {result.whyItMatters && (
          <p className="text-xs text-white/60 leading-relaxed mb-4">{result.whyItMatters}</p>
        )}
 
        {/* Mode buttons + Save */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleSimpler} disabled={simplifying}
            className="flex items-center gap-1.5 text-xs font-bold text-white border border-white/20 hover:bg-white/10 px-3 py-2 rounded-sm transition-colors disabled:opacity-60">
            {simplifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            Simpler
          </button>
          <button onClick={handleDeeper} disabled={deepening}
            className="flex items-center gap-1.5 text-xs font-bold text-white border border-white/20 hover:bg-white/10 px-3 py-2 rounded-sm transition-colors disabled:opacity-60">
            {deepening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Deeper
          </button>
          {isSignedIn && (
            <button
              onClick={async () => {
                setSaving(true); setSaveError(""); setSaved(false);
                try {
                  const res = await fetch("/api/tools/physics-engine/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question, level, explorerMode, result }),
                  });
                  const data = await res.json();
                  if (!res.ok) setSaveError(data.error ?? "Save failed");
                  else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
                } catch { setSaveError("Network error"); }
                setSaving(false);
              }}
              disabled={saving}
              className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                saved
                  ? "text-emerald-300 border-emerald-400/40 bg-emerald-400/10"
                  : "text-white/70 hover:text-white border-white/20 hover:border-white/40 hover:bg-white/5"
              }`}
            >
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
 
      {/* Simpler / Deeper overlays */}
      <AnimatePresence>
        {simpleResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-amber-700 uppercase tracking-wider">✨ Simplified</p>
              <button onClick={() => setSimpleResult(null)} className="text-amber-400 hover:text-amber-700"><X className="w-4 h-4" /></button>
            </div>
            {simpleResult.analogy && <p className="text-sm text-amber-900 mb-3 leading-relaxed"><strong>Analogy:</strong> {simpleResult.analogy}</p>}
            <p className="text-sm text-amber-800 leading-relaxed mb-3">{simpleResult.simplifiedExplanation}</p>
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
            {deepResult.derivation && <><p className="text-[10px] font-black text-purple-500 uppercase tracking-wider mb-1">Derivation</p><div className="bg-stone-900 text-purple-300 rounded-sm px-4 py-3 font-mono text-xs mb-3 whitespace-pre-wrap">{deepResult.derivation}</div></>}
            {deepResult.advancedTheory && <p className="text-sm text-purple-800 leading-relaxed mb-3">{deepResult.advancedTheory}</p>}
            {deepResult.limitationsOfSimpleModel && (
              <div className="bg-purple-100 border border-purple-200 rounded-sm px-3 py-2 mb-3">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider mb-1">Where the simple model breaks down</p>
                <p className="text-xs text-purple-800 leading-relaxed">{deepResult.limitationsOfSimpleModel}</p>
              </div>
            )}
            {deepResult.nobelConnections && <p className="text-xs text-purple-700 mb-2">🏆 {deepResult.nobelConnections}</p>}
            {deepResult.cuttingEdge && <p className="text-xs text-purple-600 italic">🔭 {deepResult.cuttingEdge}</p>}
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Visualisation — inline, always before tabs */}
      {vizData && <PhysicsVisualiser data={vizData} />}
 
      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? "border-sky-500 text-sky-600" : "border-transparent text-stone-400 hover:text-stone-700"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>
 
      {/* ── CONCEPT tab ───────────────────────────────────────────────── */}
      {activeTab === "concept" && (
        <div className="space-y-5">
          {/* Plain definition */}
          <div className="space-y-3">
            <div className="bg-sky-50 border border-sky-200 rounded-sm p-5">
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider mb-2">Plain English Definition</p>
              <p className="text-sm text-sky-900 leading-relaxed">{result.plainDefinition.expandedDefinition}</p>
            </div>
 
            {/* Analogy */}
            {result.plainDefinition.analogy && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-4">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Think of it like this…</p>
                  <p className="text-sm text-amber-800 leading-relaxed">{result.plainDefinition.analogy}</p>
                </div>
              </div>
            )}
          </div>
 
          {/* Governing law */}
          {result.governingLaw.equation && (
            <GoverningLawCard law={result.governingLaw} />
          )}
 
          {/* Exam tips */}
          {result.examTips?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <p className="text-[10px] font-black text-yellow-700 uppercase tracking-wider">Exam tips</p>
              </div>
              <ul className="space-y-1.5">
                {result.examTips.map((tip, i) => (
                  <li key={i} className="text-xs text-yellow-800 flex items-start gap-2">
                    <span className="font-bold flex-shrink-0">{i + 1}.</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
 
          {/* Concept links */}
          {result.conceptLinks?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Connects To</p>
              <div className="space-y-2">
                {result.conceptLinks.map((cl, i) => {
                  const cfg = DIRECTION_CFG[cl.direction] ?? DIRECTION_CFG.parallel;
                  return (
                    <div key={i} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm flex-shrink-0"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
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
 
      {/* ── WHY IT EXISTS tab ─────────────────────────────────────────── */}
      {activeTab === "why" && (
        <div className="space-y-4">
          <div className="bg-stone-900 text-white rounded-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-3">The Problem That Started It All</p>
            <p className="text-sm leading-relaxed text-white/90">{result.whyItExists.problem}</p>
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
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider mb-1">Why This Was Revolutionary</p>
              <p className="text-sm text-sky-800 leading-relaxed">{result.whyItExists.significance}</p>
            </div>
          </div>
        </div>
      )}
 
      {/* ── HISTORY tab ───────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="bg-stone-900 text-white rounded-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-2">Discovery</p>
            <p className="text-sm leading-relaxed">{result.history.discovered}</p>
          </div>
 
          {result.history.scientists?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Key Scientists</p>
              <div className="space-y-2">
                {result.history.scientists.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sm font-black text-sky-700 flex-shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-stone-900">{s.name}</p>
                        <span className="text-[10px] text-stone-400">{s.era}</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{s.contribution}</p>
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
 
      {/* ── REAL WORLD tab ────────────────────────────────────────────── */}
      {activeTab === "realworld" && (
        <div className="space-y-3">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
            Where {result.conceptName} shapes the world today
          </p>
          {result.realWorld.map((rw, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-sm" style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}>
                  {rw.field}
                </span>
              </div>
              <p className="text-sm font-semibold text-stone-800 mb-1">{rw.application}</p>
              <p className="text-sm text-stone-600 leading-relaxed mb-1">{rw.example}</p>
              {rw.impact && <p className="text-xs text-stone-400 italic">{rw.impact}</p>}
            </div>
          ))}
        </div>
      )}
 
      {/* ── INTUITION tab ─────────────────────────────────────────────── */}
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
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Alternative way of thinking about it</p>
              <p className="text-sm text-stone-700 leading-relaxed">{result.intuition.alternativeModel}</p>
            </div>
          )}
 
          {result.intuition.whatChangesWhen?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Build your intuition — what changes when…</p>
              <div className="space-y-2">
                {result.intuition.whatChangesWhen.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <ArrowRight className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    {w}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* ── MISCONCEPTIONS tab ────────────────────────────────────────── */}
      {activeTab === "misconceptions" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-sm px-4 py-3.5">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">
              These are things that students — and sometimes teachers — commonly believe that are <strong>actually wrong</strong>. Click each one to see the truth.
            </p>
          </div>
          {result.misconceptions?.map((m, i) => (
            <MisconceptionCard key={i} m={m} index={i} />
          ))}
        </div>
      )}
 
      {/* ── TRY IT tab ────────────────────────────────────────────────── */}
      {activeTab === "tryit" && (
        <div className="space-y-5">
          {/* Experiments */}
          {result.experiments?.length > 0 && (
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Experiments You Can Try</p>
              <div className="space-y-2">
                {result.experiments.map((exp, i) => (
                  <ExperimentCard key={i} exp={exp} />
                ))}
              </div>
            </div>
          )}
 
          {/* Practice questions */}
          <div className="border-t border-stone-100 pt-5">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Practice Questions</p>
            <PracticePanel 
              result={result} 
              level={level} 
              question={question}
              onInsufficientTokens={onInsufficientTokens || (() => {})}
               />
          </div>
        </div>
      )}
 
      {/* ── TUTOR tab ─────────────────────────────────────────────────── */}
      {activeTab === "tutor" && (
        <AITutor 
          question={question} 
          level={level} 
          onInsufficientTokens={onInsufficientTokens || (() => {})}
        />
      )}
 
    </div>
  );
}