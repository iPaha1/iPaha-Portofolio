"use client";

// =============================================================================
// isaacpaha.com — Math Understanding Engine
// app/tools/math-engine/_components/math-engine-tool.tsx
//
// TABS: Solution | Why It Works | History | Real World | Practice
// Features:
//   - Level selector (GCSE / A-Level / University / Middle School / High School / College)
//   - Step-by-step solution with "why this step" expansions
//   - "Explain Simpler" and "Go Deeper" modes
//   - AI Tutor follow-up questions
//   - Concept links (prerequisite / extension / parallel)
//   - Inline visualisation via MathVisualiser
//   - Practice question generator with reveal/hide answers
//   - Copy, share, export
// =============================================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence }               from "framer-motion";
import {
  BookOpen, Sparkles, Loader2, AlertCircle, Check, Copy,
  ChevronDown, ChevronUp, ArrowRight, RefreshCw, Download,
  Target, TrendingUp, Zap, Lightbulb, History, Globe,
  MessageSquare, ArrowLeft, Star, Award, Brain, Link2,
  ChevronRight, X, Send, Info, Layers,
} from "lucide-react";
import { MathVisualiser } from "./math-visualiser";
import type { VisualisationData } from "./math-visualiser";

// ─── Types ────────────────────────────────────────────────────────────────────
 
interface MathStep {
  step:        number;
  title:       string;
  explanation: string;
  notation:    string;
  whyThisStep: string;
}
 
interface ConceptLink {
  concept:      string;
  relationship: string;
  direction:    "prerequisite" | "builds-on" | "parallel";
}
 
interface RealWorldApp {
  field:       string;
  application: string;
  example:     string;
}
 
interface MathExplanation {
  topic:        string;
  conceptName:  string;
  answer: {
    finalAnswer: string;
    notation:    string;
  };
  steps:         MathStep[];
  whyItWorks: {
    coreIdea:      string;
    deeperReason:  string;
    commonMistake: string;
  };
  history: {
    origin:    string;
    motivation: string;
    evolution:  string;
    funFact:    string;
  };
  realWorld:     RealWorldApp[];
  conceptLinks:  ConceptLink[];
  levelSummary:  string;
  examTip:       string;
  visualisation: {
    type:        string;
    description: string;
    keyPoints:   string[];
    data?:       any;
  };
  difficulty:    string;
  estimatedTimeMinutes: number;
}
 
interface PracticeQuestion {
  id:         number;
  question:   string;
  difficulty: "Easy" | "Medium" | "Hard";
  hint:       string;
  solution: {
    finalAnswer: string;
    steps:       string[];
  };
  explanation: string;
  examStyle:   boolean;
}

export interface TokenGateInfo {
  required: number;
  balance:  number;
  toolName: string | null;
}

export interface MathEngineToolProps {
  /** Called when the API returns 402 — parent page shows the modal */
    onInsufficientTokens?: (info: TokenGateInfo) => void;
  }
 
// ─── Config ───────────────────────────────────────────────────────────────────
 
const LEVELS = [
  { id: "gcse",         label: "GCSE",         flag: "🇬🇧", sublabel: "Year 10-11"      },
  { id: "alevel",       label: "A-Level",       flag: "🇬🇧", sublabel: "Year 12-13"      },
  { id: "university",   label: "University",    flag: "🎓",  sublabel: "Degree level"    },
  { id: "middle_school",label: "Middle School", flag: "🇺🇸", sublabel: "US 6th-8th grade" },
  { id: "high_school",  label: "High School",   flag: "🇺🇸", sublabel: "US 9th-12th"     },
  { id: "college",      label: "College",       flag: "🎓",  sublabel: "US undergraduate" },
];
 
const DIFFICULTY_COLOR: Record<string, string> = {
  Easy:      "#10b981",
  Medium:    "#f59e0b",
  Hard:      "#f97316",
  "Very Hard":"#ef4444",
};
 
const DIRECTION_CFG = {
  prerequisite: { color: "#6b7280", bg: "#f3f4f6", label: "Prerequisite", icon: ArrowLeft  },
  "builds-on":  { color: "#6366f1", bg: "#ede9fe", label: "Builds on",    icon: ArrowRight },
  parallel:     { color: "#3b82f6", bg: "#dbeafe", label: "Related",      icon: Layers     },
};
 
const EXAMPLE_QUESTIONS = [
  "Solve x² - 5x + 6 = 0",
  "Differentiate f(x) = 3x⁴ - 2x² + 7",
  "Find the area of a circle with radius 8cm",
  "Expand and simplify (2x + 3)(x - 4)",
  "Solve the simultaneous equations: 2x + y = 7, x - y = 2",
  "What is the Pythagorean theorem and prove it",
  "Find the nth term of the sequence: 3, 7, 11, 15...",
  "Calculate the compound interest on £1000 at 5% for 3 years",
];
 
// ─── Utilities ────────────────────────────────────────────────────────────────
 
function buildVisualisationData(vizData: any): VisualisationData | null {
  if (!vizData || vizData.type === "none") return null;
  const type = vizData.type as VisualisationData["type"];
  if (!type) return null;
 
  const vizInput: VisualisationData = {
    type,
    description: vizData.description,
    keyPoints:   vizData.keyPoints ?? [],
  };
 
  if (vizData.data) {
    const d = typeof vizData.data === "string" ? (() => { try { return JSON.parse(vizData.data); } catch { return vizData.data; } })() : vizData.data;
    if (d?.functionExpression) vizInput.functionExpression = d.functionExpression;
    if (d?.xRange)             vizInput.xRange             = d.xRange;
    if (d?.keyValues)          vizInput.keyValues           = d.keyValues;
    if (d?.annotations)        vizInput.annotations         = d.annotations;
  }
 
  return vizInput;
}
 
// ─── Step component ───────────────────────────────────────────────────────────
 
function StepCard({ step, index }: { step: MathStep; index: number }) {
  const [showWhy, setShowWhy] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex gap-4">
      {/* Step number */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
          {step.step}
        </div>
        <div className="w-0.5 flex-1 bg-indigo-100 min-h-[16px]" />
      </div>
 
      <div className="flex-1 pb-6">
        <p className="text-sm font-black text-stone-900 mb-1">{step.title}</p>
        <p className="text-sm text-stone-600 leading-relaxed mb-2">{step.explanation}</p>
 
        {/* Mathematical notation */}
        {step.notation && (
          <div className="bg-stone-900 text-white rounded-sm px-4 py-3 mb-2 font-mono text-sm">
            {step.notation}
          </div>
        )}
 
        {/* Why this step */}
        {step.whyThisStep && (
          <button onClick={() => setShowWhy((p) => !p)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors ${
              showWhy ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-600"
            }`}>
            <Lightbulb className="w-3 h-3" />
            {showWhy ? "Hide" : "Why this step?"}
          </button>
        )}
        <AnimatePresence>
          {showWhy && step.whyThisStep && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
                <p className="text-xs text-amber-800 leading-relaxed">{step.whyThisStep}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
 
// ─── Practice Panel ───────────────────────────────────────────────────────────
 
function PracticePanel({ explanation, level, originalQuestion, onInsufficientTokens }: {
  explanation: MathExplanation;
  level:       string;
  originalQuestion: string;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
}) {
  const [questions, setQuestions]  = useState<PracticeQuestion[]>([]);
  const [loading,   setLoading]    = useState(false);
  const [openHints, setOpenHints]  = useState<Set<number>>(new Set());
  const [openSols,  setOpenSols]   = useState<Set<number>>(new Set());
  const [attempts,  setAttempts]   = useState<Record<number, string>>({});
 
  const generate = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/math-engine/practice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic:            explanation.topic,
          conceptName:      explanation.conceptName,
          level,
          count:            5,
          originalQuestion,
        }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Math Practice Questions",
        });
        setLoading(false);
        return;
      }

      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch {}
    setLoading(false);
  };
 
  const toggle = (set: Set<number>, setFn: any, i: number) => {
    setFn((p: Set<number>) => { const n = new Set(p); p.has(i) ? n.delete(i) : n.add(i); return n; });
  };
 
  if (questions.length === 0) {
    return (
      <div className="space-y-5">
        <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-5">
          <p className="text-sm font-black text-indigo-800 mb-1">Practice makes permanent</p>
          <p className="text-xs text-indigo-600 leading-relaxed mb-3">
            Generate 5 practice questions based on <strong>{explanation.conceptName}</strong>. They start similar to your question and gradually increase in difficulty — including an exam-style question.
          </p>
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generating questions…" : "Generate Practice Questions"}
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
          {questions.length} practice questions — {explanation.conceptName}
        </p>
        <button onClick={() => { setQuestions([]); setOpenHints(new Set()); setOpenSols(new Set()); }}
          className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />New set
        </button>
      </div>
 
      {questions.map((q, i) => (
        <div key={q.id} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                    style={{ color: DIFFICULTY_COLOR[q.difficulty] ?? "#6b7280", backgroundColor: `${DIFFICULTY_COLOR[q.difficulty] ?? "#6b7280"}15` }}>
                    {q.difficulty}
                  </span>
                  {q.examStyle && (
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-sm">
                      📝 Exam style
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-stone-900 leading-snug">{q.question}</p>
 
                {/* User attempt */}
                <div className="mt-3">
                  <input
                    value={attempts[q.id] ?? ""}
                    onChange={(e) => setAttempts((p) => ({ ...p, [q.id]: e.target.value }))}
                    placeholder="Write your answer here…"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>
 
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => toggle(openHints, setOpenHints, i)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors ${
                  openHints.has(i) ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-300"
                }`}>
                <Lightbulb className="w-3 h-3" />{openHints.has(i) ? "Hide hint" : "Show hint"}
              </button>
              <button onClick={() => toggle(openSols, setOpenSols, i)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors ${
                  openSols.has(i) ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-emerald-300"
                }`}>
                <Check className="w-3 h-3" />{openSols.has(i) ? "Hide solution" : "Reveal solution"}
              </button>
            </div>
          </div>
 
          <AnimatePresence>
            {openHints.has(i) && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
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
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Solution</p>
                    <span className="text-sm font-black text-emerald-800">→ {q.solution.finalAnswer}</span>
                  </div>
                  {q.solution.steps.length > 0 && (
                    <div className="space-y-1">
                      {q.solution.steps.map((step, si) => (
                        <p key={si} className="text-xs text-emerald-700 flex items-start gap-1.5">
                          <span className="font-bold flex-shrink-0">{si + 1}.</span>{step}
                        </p>
                      ))}
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
 
// ─── AI Tutor Panel ───────────────────────────────────────────────────────────
 
function AITutorPanel({ question, level, onInsufficientTokens }: { question: string; level: string; onInsufficientTokens?: (info: TokenGateInfo) => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
 
  const ask = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/math-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question, level, mode: "tutor",
          followUpContext: `Original question: "${question}". Student asks: "${userMsg}"`,
        }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({  
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Math AI Tutor",
        });
        setMessages((p) => [...p, { role: "ai", text: "You've run out of tokens to use the Math Tutor. Please play some games to earn more tokens, then try again." }]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const r    = data.result;
      const text = r?.response ?? r?.hint ?? "I'd be happy to help. Can you be more specific about what confused you?";
      setMessages((p) => [...p, { role: "ai", text }]);
      if (r?.nextQuestion) {
        setTimeout(() => {
          setMessages((p) => [...p, { role: "ai", text: `🤔 ${r.nextQuestion}` }]);
        }, 800);
      }
    } catch {
      setMessages((p) => [...p, { role: "ai", text: "Connection error — please try again." }]);
    }
    setLoading(false);
  };
 
  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-sm px-4 py-3.5 flex items-start gap-3">
        <Brain className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-indigo-800">AI Tutor Mode</p>
          <p className="text-xs text-indigo-600 mt-0.5 leading-relaxed">
            Ask any follow-up question about this topic. "Why did you do that step?" — "Explain step 3 again" — "What if x was negative?" — I'm here to help you understand, not just answer.
          </p>
        </div>
      </div>
 
      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${m.role === "user" ? "bg-stone-200 text-stone-700" : "bg-indigo-600 text-white"}`}>
                {m.role === "user" ? "You" : "AI"}
              </div>
              <div className={`flex-1 max-w-[85%] rounded-sm px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-stone-100 text-stone-700" : "bg-indigo-50 border border-indigo-200 text-indigo-900"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">AI</div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span className="text-xs text-indigo-500">Thinking…</span>
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* Input */}
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && ask()}
          placeholder='Ask anything — "Why does this work?" or "Explain step 2 again"'
          className="flex-1 text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-indigo-400"
        />
        <button onClick={ask} disabled={loading || !input.trim()}
          className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
 
// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
 
export interface MathReopenData {
  resultJson: string;
  question:   string;
  level:      string;
}
 
export function MathEngineTool({
  isSignedIn  = false,
  reopenData,
  onReopened,
  onInsufficientTokens,
}: {
  isSignedIn?:  boolean;
  reopenData?:  MathReopenData | null;
  onReopened?:  () => void;        // called after reopen so parent can clear the prop
  onInsufficientTokens?: (info: TokenGateInfo) => void; // called when API returns 402, parent shows modal
}) {
  const [question,     setQuestion]     = useState("");
  const [level,        setLevel]        = useState("gcse");
  const [stage,        setStage]        = useState<"input" | "loading" | "results">("input");
  const [result,       setResult]       = useState<MathExplanation | null>(null);
  const [error,        setError]        = useState("");
  const [activeTab,    setActiveTab]    = useState<"solution" | "why" | "history" | "realworld" | "practice" | "tutor">("solution");
  const [loadStep,     setLoadStep]     = useState(0);
  const [simplifying,  setSimplifying]  = useState(false);
  const [deepening,    setDeepening]    = useState(false);
  const [simpleResult, setSimpleResult] = useState<any>(null);
  const [deepResult,   setDeepResult]   = useState<any>(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [saveError,    setSaveError]    = useState("");
 
  // ── Reopen from workspace ──────────────────────────────────────────────────
  // When the parent passes reopenData (user clicked "Reopen" in the dashboard),
  // parse the saved resultJson and jump straight to the results stage.
  useEffect(() => {
    if (!reopenData?.resultJson) return;
    try {
      const parsed = JSON.parse(reopenData.resultJson) as MathExplanation;
      setQuestion(reopenData.question);
      setLevel(reopenData.level.toLowerCase().replace("_", "_")); // keep as-is, LEVEL_CFG handles it
      setResult(parsed);
      setStage("results");
      setActiveTab("solution");
      setSimpleResult(null);
      setDeepResult(null);
      setSaved(false);
      // Tell parent to clear reopenData so next mount starts fresh
      onReopened?.();
      // Scroll to top of tool smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error("[MathEngineTool] Failed to reopen saved result:", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reopenData]);
 
  const LOAD_STEPS = [
    "Reading your question…",
    "Working through the solution…",
    "Explaining why it works…",
    "Researching the history…",
    "Finding real-world connections…",
    "Preparing everything…",
  ];
 
  const handleExplain = async (q: string, lvl: string) => {
    if (!q.trim()) return;
    setQuestion(q); setLevel(lvl);
    setStage("loading"); setError(""); setLoadStep(0);
    setResult(null); setSimpleResult(null); setDeepResult(null);
 
    const interval = setInterval(() => setLoadStep((p) => Math.min(p + 1, LOAD_STEPS.length - 1)), 1200);
 
    try {
      const res  = await fetch("/api/tools/math-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, level: lvl, mode: "full" }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Math Engine",
        });
        clearInterval(interval);
        setStage("input");
        setError("You've run out of tokens to explore math concepts. Please play some games to earn more tokens, then try again.");
        return;
      }

      const data = await res.json();
      clearInterval(interval);
      if (!res.ok || !data.result) {
        setError(data.error ?? "Explanation failed — please try again.");
        setStage("input"); return;
      }
      setResult(data.result);
      setActiveTab("solution");
      setStage("results");
    } catch {
      clearInterval(interval);
      setError("Network error — please try again.");
      setStage("input");
    }
  };
 
  const handleSimpler = async () => {
    if (!question || !result) return;
    setSimplifying(true);
    try {
      const res  = await fetch("/api/tools/math-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, level, mode: "simpler" }),
      });

      // ── NEW: handle 402 insufficient tokens for simpler mode ─────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({  
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Math Engine (Simpler)",
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
      const res  = await fetch("/api/tools/math-engine/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, level, mode: "deeper" }),
      });

      // ── NEW: handle 402 insufficient tokens for deeper mode ──────────────
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Math Engine (Deeper)",
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
 
  // ── Input Stage ────────────────────────────────────────────────────────────
  if (stage === "input") {
    return (
      <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
 
        {/* Level selector */}
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Your Level</label>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button key={l.id} onClick={() => setLevel(l.id)}
                title={l.sublabel}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
                  level === l.id ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                }`}>
                <span>{l.flag}</span>{l.label}
              </button>
            ))}
          </div>
        </div>
 
        {/* Question input */}
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
            Your Question or Topic
          </label>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleExplain(question, level)}
            placeholder={`Paste any maths question or topic…\n\nExamples:\n• Solve x² - 5x + 6 = 0\n• How does differentiation work?\n• What is the Pythagorean theorem?\n• Explain quadratic equations from scratch`}
            rows={6}
            className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none"
          />
          <p className="text-[10px] text-stone-400 mt-1">Press Ctrl+Enter or click the button below</p>
        </div>
 
        <button onClick={() => handleExplain(question, level)} disabled={!question.trim()}
          className="w-full flex items-center justify-center gap-2 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 py-4 rounded-sm transition-colors shadow-sm">
          <Brain className="w-5 h-5" />Understand This
        </button>
 
        {/* Example questions */}
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Try an example</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUESTIONS.map((ex) => (
              <button key={ex} onClick={() => setQuestion(ex)}
                className="text-xs text-stone-500 bg-stone-50 border border-stone-200 hover:border-indigo-400 hover:text-indigo-600 px-2.5 py-1.5 rounded-sm transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
 
  // ── Loading Stage ──────────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🧠</div>
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
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-indigo-400" : "bg-stone-200"}`} />
          ))}
        </div>
      </div>
    );
  }
 
  // ── Results Stage ──────────────────────────────────────────────────────────
  if (!result) return null;
 
  const TABS = [
    { id: "solution",  label: "Solution",      icon: Target     },
    { id: "why",       label: "Why It Works",  icon: Lightbulb  },
    { id: "history",   label: "History",        icon: History    },
    { id: "realworld", label: "Real World",     icon: Globe      },
    { id: "practice",  label: "Practice",       icon: BookOpen   },
    { id: "tutor",     label: "Ask the Tutor",  icon: MessageSquare },
  ] as const;
 
  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>
      {/* Header */}
      <div className="bg-indigo-600 text-white rounded-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">{result.topic}</p>
            <p className="text-xl font-black">{result.conceptName}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black px-2 py-1 rounded-sm"
              style={{ color: DIFFICULTY_COLOR[result.difficulty] ?? "#fff", backgroundColor: "rgba(255,255,255,0.1)" }}>
              {result.difficulty}
            </span>
            <span className="text-[10px] text-white/50">~{result.estimatedTimeMinutes} min</span>
          </div>
        </div>
 
        {/* Answer */}
        <div className="bg-white/10 border border-white/20 rounded-sm px-4 py-3 mb-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Answer</p>
          <p className="text-base font-black text-white">{result.answer.finalAnswer}</p>
          {result.answer.notation && (
            <p className="text-sm font-mono text-indigo-200 mt-1">{result.answer.notation}</p>
          )}
        </div>
 
        {/* Level summary */}
        <p className="text-sm text-white/80 leading-relaxed mb-4">{result.levelSummary}</p>
 
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
                  const res = await fetch("/api/tools/math-engine/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question, level, result }),
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
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white ml-auto transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />New
          </button>
        </div>
        {saveError && <p className="text-xs text-red-300 mt-2">{saveError}</p>}
      </div>
 
      {/* Simpler / Deeper results */}
      <AnimatePresence>
        {simpleResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-amber-700 uppercase tracking-wider">Simplified Explanation</p>
              <button onClick={() => setSimpleResult(null)} className="text-amber-400 hover:text-amber-700"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-amber-900 leading-relaxed mb-3">{simpleResult.analogy}</p>
            {simpleResult.steps?.map((s: any, i: number) => (
              <p key={i} className="text-sm text-amber-800 mb-1.5"><span className="font-bold">{i + 1}.</span> {s.explanation}</p>
            ))}
            {simpleResult.keyInsight && (
              <div className="mt-3 bg-amber-100 border border-amber-300 rounded-sm px-3 py-2">
                <p className="text-xs font-bold text-amber-700">💡 Key insight</p>
                <p className="text-xs text-amber-800 mt-0.5">{simpleResult.keyInsight}</p>
              </div>
            )}
          </motion.div>
        )}
        {deepResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-purple-50 border border-purple-200 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-purple-700 uppercase tracking-wider">Deep Dive</p>
              <button onClick={() => setDeepResult(null)} className="text-purple-400 hover:text-purple-700"><X className="w-4 h-4" /></button>
            </div>
            {deepResult.deepDive && <p className="text-sm text-purple-900 leading-relaxed mb-3">{deepResult.deepDive}</p>}
            {deepResult.proof && (
              <div className="bg-stone-900 text-indigo-300 rounded-sm px-4 py-3 font-mono text-xs mb-3 whitespace-pre-wrap">
                {deepResult.proof}
              </div>
            )}
            {deepResult.advancedConnections?.map((c: string, i: number) => (
              <p key={i} className="text-xs text-purple-700 mb-1 flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />{c}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Visualisation — shown inline whenever applicable */}
      {vizData && (
        <MathVisualiser data={vizData} />
      )}
 
      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-stone-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>
 
      {/* ── SOLUTION tab ──────────────────────────────────────────────── */}
      {activeTab === "solution" && (
        <div className="space-y-2">
          {result.steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
          {result.examTip && (
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-sm px-4 py-3.5 mt-4">
              <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-yellow-700 uppercase tracking-wider mb-1">Exam tip</p>
                <p className="text-xs text-yellow-800 leading-relaxed">{result.examTip}</p>
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* ── WHY IT WORKS tab ──────────────────────────────────────────── */}
      {activeTab === "why" && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-5">
            <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-2">The Core Idea</p>
            <p className="text-sm text-indigo-900 leading-relaxed">{result.whyItWorks.coreIdea}</p>
          </div>
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">The Mathematical Truth</p>
            <p className="text-sm text-stone-700 leading-relaxed">{result.whyItWorks.deeperReason}</p>
          </div>
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-sm px-4 py-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-1">Common mistake</p>
              <p className="text-sm text-red-800 leading-relaxed">{result.whyItWorks.commonMistake}</p>
            </div>
          </div>
 
          {/* Concept links */}
          {result.conceptLinks.length > 0 && (
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Connects To</p>
              <div className="space-y-2">
                {result.conceptLinks.map((cl, i) => {
                  const cfg  = DIRECTION_CFG[cl.direction] ?? DIRECTION_CFG.parallel;
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm flex-shrink-0"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                        {cfg.label}
                      </span>
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
 
      {/* ── HISTORY tab ───────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-stone-900 text-white rounded-sm p-5">
              <p className="text-xs font-black uppercase tracking-wider text-white/40 mb-2">Origin</p>
              <p className="text-sm leading-relaxed">{result.history.origin}</p>
            </div>
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">Why It Was Needed</p>
              <p className="text-sm text-stone-700 leading-relaxed">{result.history.motivation}</p>
            </div>
          </div>
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">How It Evolved</p>
            <p className="text-sm text-stone-700 leading-relaxed">{result.history.evolution}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div>
              <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-1">Fun Fact</p>
              <p className="text-sm text-amber-800 leading-relaxed">{result.history.funFact}</p>
            </div>
          </div>
        </div>
      )}
 
      {/* ── REAL WORLD tab ────────────────────────────────────────────── */}
      {activeTab === "realworld" && (
        <div className="space-y-3">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
            Where {result.conceptName} is used in the real world
          </p>
          {result.realWorld.map((rw, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-sm uppercase tracking-wider">
                  {rw.field}
                </span>
              </div>
              <p className="text-sm font-semibold text-stone-800 mb-1">{rw.application}</p>
              <p className="text-sm text-stone-600 leading-relaxed">{rw.example}</p>
            </div>
          ))}
        </div>
      )}
 
      {/* ── PRACTICE tab ──────────────────────────────────────────────── */}
      {activeTab === "practice" && (
        <PracticePanel 
          explanation={result} 
          level={level} 
          originalQuestion={question}
          onInsufficientTokens={onInsufficientTokens || (() => {})}
         />
      )}
 
      {/* ── TUTOR tab ─────────────────────────────────────────────────── */}
      {activeTab === "tutor" && (
        <AITutorPanel 
          question={question} 
          level={level}
          onInsufficientTokens={onInsufficientTokens || (() => {})}
        />
      )}
    </div>
  );
 
  function buildVisualisationData(vizData: any): VisualisationData | null {
    if (!vizData || vizData.type === "none") return null;
    const type = vizData.type as VisualisationData["type"];
    if (!type) return null;
    const vizInput: VisualisationData = {
      type,
      description: vizData.description,
      keyPoints:   vizData.keyPoints ?? [],
    };
    if (vizData.data) {
      const d = typeof vizData.data === "string" ? (() => { try { return JSON.parse(vizData.data); } catch { return vizData.data; } })() : vizData.data;
      if (d?.functionExpression) vizInput.functionExpression = d.functionExpression;
      if (d?.xRange)             vizInput.xRange             = d.xRange;
      if (d?.keyValues)          vizInput.keyValues           = d.keyValues;
      if (d?.annotations)        vizInput.annotations         = d.annotations;
    }
    return vizInput;
  }
}