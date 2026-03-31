"use client";

// =============================================================================
// isaacpaha.com — AI CV Analyser Pro
// app/tools/ai-cv-analyser/_components/cv-analyser-tool.tsx
//
// Full-featured AI CV analysis tool:
//   - CV + Job Description input
//   - Role mode selector (Tech / Finance / Graduate / Business / Healthcare)
//   - Comprehensive score dashboard (5 scores + overall)
//   - Keyword gap analysis (present / missing / suggested)
//   - Section-by-section feedback
//   - Bullet point rewriter
//   - Language issue detector
//   - ATS issue checker
//   - Success prediction
//   - Top 5 improvements (prioritised)
//   - Interview question generator
//   - Full CV rewrite + tailor to JD
//   - Copy / export results
// =============================================================================

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence }               from "framer-motion";
import {
  FileText, Sparkles, Loader2, AlertCircle, Check, Copy,
  ChevronDown, ChevronUp, ArrowRight, RefreshCw, Download,
  Target, TrendingUp, Zap, BookOpen, Award, CheckCircle2,
  XCircle, AlertTriangle, Info, Wand2, MessageSquare,
  BarChart2, Search, Shield, Lightbulb, ChevronRight,
  X, Plus, Minus, Eye, EyeOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionFeedback {
  section:   string;
  score:     number;
  status:    "Strong" | "Good" | "Needs Work" | "Missing";
  feedback:  string;
  quickWin:  string;
}

interface BulletRewrite {
  original: string;
  improved: string;
  why:      string;
}

interface LanguageIssue {
  weak:     string;
  stronger: string;
  category: string;
}

interface TopImprovement {
  priority:    number;
  improvement: string;
  impact:      "Low" | "Medium" | "High";
  effort:      "Quick Fix" | "1 Hour" | "Half Day";
}

interface InterviewQuestion {
  question:    string;
  type:        string;
  difficulty:  "Easy" | "Medium" | "Hard";
  tip:         string;
  starHint:    string;
  modelAnswer?: string;  // AI-generated model answer — revealed via dropdown
}

interface CVAnalysis {
  jobMatchScore:     number;
  atsScore:          number;
  keywordScore:      number;
  languageScore:     number;
  structureScore:    number;
  overallScore:      number;
  executiveSummary:  string;
  successPrediction: {
    shortlistLikelihood: "Low" | "Medium" | "High";
    confidencePercent:   number;
    reason:              string;
    topAction:           string;
  };
  keywordGap: {
    present:   string[];
    missing:   string[];
    suggested: string[];
  };
  sectionFeedback:  SectionFeedback[];
  bulletRewrites:   BulletRewrite[];
  languageIssues:   LanguageIssue[];
  atsIssues:        string[];
  topImprovements:  TopImprovement[];
  interviewQuestions: InterviewQuestion[];
}

// ─── NEW: token gate prop ─────────────────────────────────────────────────────
 
export interface TokenGateInfo {
  required: number;
  balance:  number;
  toolName: string | null;
}

export interface CVAnalyserToolProps {
  isSignedIn?: boolean;
  /** Called when the API returns 402 — parent page shows the modal */
  onInsufficientTokens?: (info: TokenGateInfo) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_MODES = [
  { id: "general",    label: "General",    emoji: "💼", desc: "Any professional role"         },
  { id: "tech",       label: "Tech",        emoji: "💻", desc: "Software, data, product, cyber" },
  { id: "finance",    label: "Finance",     emoji: "📈", desc: "Finance, banking, accounting"  },
  { id: "graduate",   label: "Graduate",    emoji: "🎓", desc: "Entry-level & graduate roles"  },
  { id: "business",   label: "Business",    emoji: "🏢", desc: "Strategy, ops, management"     },
  { id: "healthcare", label: "Healthcare",  emoji: "🏥", desc: "Medical, nursing, life sciences"},
  { id: "creative",   label: "Creative",    emoji: "🎨", desc: "Design, marketing, media"      },
];

const STATUS_CFG = {
  Strong:      { color: "#059669", bg: "#d1fae5", dot: "#10b981", icon: CheckCircle2 },
  Good:        { color: "#2563eb", bg: "#dbeafe", dot: "#3b82f6", icon: Check       },
  "Needs Work":{ color: "#d97706", bg: "#fef3c7", dot: "#f59e0b", icon: AlertTriangle },
  Missing:     { color: "#dc2626", bg: "#fee2e2", dot: "#ef4444", icon: XCircle     },
};

const IMPACT_COLOR = { High: "#10b981", Medium: "#f59e0b", Low: "#6b7280" };
const EFFORT_COLOR = { "Quick Fix": "#10b981", "1 Hour": "#f59e0b", "Half Day": "#ef4444" };
const LIKELIHOOD_COLOR = { High: "#10b981", Medium: "#f59e0b", Low: "#ef4444" };
const DIFFICULTY_COLOR = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };

// ─── Utilities ────────────────────────────────────────────────────────────────

function ScoreRing({ score, label, color, size = "md" }: { score: number; label: string; color: string; size?: "sm" | "md" | "lg" }) {
  const r    = size === "lg" ? 40 : size === "md" ? 28 : 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const dim  = size === "lg" ? 96 : size === "md" ? 72 : 52;
  const fs   = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-sm";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg viewBox={`0 0 ${dim} ${dim}`} className="rotate-[-90deg]" width={dim} height={dim}>
          <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={size === "lg" ? 6 : 5} />
          <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke={color} strokeWidth={size === "lg" ? 6 : 5}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-black ${fs}`} style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold text-stone-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function AnimatedBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
        initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

function Section({ title, icon: Icon, iconColor, children, defaultOpen = false }: {
  title: string; icon: React.ElementType; iconColor: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-stone-100 rounded-sm overflow-hidden">
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-stone-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />
          <span className="text-sm font-bold text-stone-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}
            exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-stone-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Input Stage ──────────────────────────────────────────────────────────────

function InputStage({ onAnalyse }: { onAnalyse: (cv: string, jd: string, mode: string) => void }) {
  const [cvText, setCvText]   = useState("");
  const [jdText, setJdText]   = useState("");
  const [mode,   setMode]     = useState("general");
  const [tab,    setTab]      = useState<"cv" | "jd">("cv");

  const cvValid = cvText.trim().length >= 100;
  const jdHas   = jdText.trim().length > 50;

  return (
    <div className="space-y-5">
      {/* Role mode selector */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
          Optimise for role type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ROLE_MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              title={m.desc}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
                mode === m.id ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
              }`}>
              <span>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input tabs */}
      <div className="border border-stone-200 rounded-sm overflow-hidden">
        <div className="flex border-b border-stone-200">
          {[
            { id: "cv", label: "CV / Résumé", required: true },
            { id: "jd", label: "Job Description", required: false, badge: jdHas ? "Added ✓" : "Optional — boosts accuracy" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === t.id ? "bg-stone-50 text-stone-900 border-b-2 border-emerald-500" : "bg-white text-stone-400 hover:text-stone-700"
              }`}>
              {t.label}
              {t.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold ${jdHas ? "text-emerald-600 bg-emerald-50 border border-emerald-200" : "text-stone-400 bg-stone-100"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "cv" && (
          <div className="p-4">
            <textarea value={cvText} onChange={(e) => setCvText(e.target.value)}
              placeholder={`Paste your full CV here…\n\nInclude all sections:\n• Professional summary\n• Work experience\n• Education\n• Skills\n• Projects (if applicable)`}
              rows={12}
              className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none font-mono leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs font-semibold ${cvValid ? "text-emerald-600" : cvText.length > 0 ? "text-amber-500" : "text-stone-400"}`}>
                {cvText.length} chars {cvValid ? "✓ Ready" : cvText.length > 0 ? `— need ${100 - cvText.length} more` : ""}
              </span>
              {cvText.length > 0 && (
                <button onClick={() => setCvText("")} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Clear</button>
              )}
            </div>
          </div>
        )}

        {tab === "jd" && (
          <div className="p-4">
            <textarea value={jdText} onChange={(e) => setJdText(e.target.value)}
              placeholder={`Paste the job description here (optional but highly recommended)…\n\nThe AI will:\n• Extract required keywords\n• Calculate your job match score\n• Identify critical skill gaps\n• Generate role-specific interview questions`}
              rows={12}
              className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none font-mono leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-stone-400">{jdText.length} chars {jdHas ? "✓ Added" : ""}</span>
              {jdText.length > 0 && (
                <button onClick={() => setJdText("")} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Clear</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analyse button */}
      <button onClick={() => onAnalyse(cvText, jdText, mode)}
        disabled={!cvValid}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-sm transition-colors shadow-sm">
        <Sparkles className="w-5 h-5" />
        Analyse My CV{jdHas ? " Against This Job" : ""}
      </button>

      {!cvValid && cvText.length > 0 && (
        <p className="text-xs text-amber-600 text-center">Paste more of your CV to enable analysis (need at least 100 characters)</p>
      )}

      {/* What you get */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          { icon: Target,      label: "ATS Score",          color: "#f59e0b" },
          { icon: Search,      label: "Keyword Gap",         color: "#3b82f6" },
          { icon: BarChart2,   label: "5 Score Breakdown",   color: "#8b5cf6" },
          { icon: Wand2,       label: "Bullet Rewrites",     color: "#ec4899" },
          { icon: Lightbulb,   label: "Top 5 Improvements",  color: "#10b981" },
          { icon: MessageSquare,label: "Interview Questions", color: "#f97316" },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-sm">
            <f.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: f.color }} />
            <span className="text-[11px] font-semibold text-stone-600">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Interview Tab Component ─────────────────────────────────────────────────

function InterviewTab({ questions, hasJD }: { questions: InterviewQuestion[]; hasJD: boolean }) {
  const [openAnswers, setOpenAnswers] = React.useState<Set<number>>(new Set());
  const [studyMode,   setStudyMode]   = React.useState(false);
  const [marked,      setMarked]      = React.useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setOpenAnswers((prev) => {
      const next = new Set(prev);
      prev.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleMark = (i: number) => {
    setMarked((prev) => {
      const next = new Set(prev);
      prev.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const byType = questions.reduce<Record<string, InterviewQuestion[]>>((acc, q) => {
    (acc[q.type] = acc[q.type] ?? []).push(q);
    return acc;
  }, {});

  const TYPE_CFG: Record<string, { color: string; bg: string; emoji: string }> = {
    Behavioural:  { color: "#7c3aed", bg: "#ede9fe", emoji: "🧠" },
    Technical:    { color: "#1d4ed8", bg: "#dbeafe", emoji: "⚙️" },
    Situational:  { color: "#b45309", bg: "#fef3c7", emoji: "🎯" },
    Motivational: { color: "#065f46", bg: "#d1fae5", emoji: "💡" },
    Competency:   { color: "#be185d", bg: "#fce7f3", emoji: "⭐" },
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3 flex-1 bg-blue-50 border border-blue-200 rounded-sm px-4 py-3">
          <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            {questions.length} questions generated{hasJD ? " from your CV and the job description" : " from your CV"}.{" "}
            <span className="font-semibold">Click "Reveal Answer" on each question to see a model answer to study.</span>
          </p>
        </div>
        <button
          onClick={() => setStudyMode((p) => !p)}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-sm border transition-colors flex-shrink-0 ${
            studyMode ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-stone-600 border-stone-200 hover:border-emerald-400 hover:text-emerald-600"
          }`}
        >
          {studyMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {studyMode ? "Exit Study Mode" : "Study Mode"}
        </button>
      </div>

      {/* Progress in study mode */}
      {studyMode && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-800">Study Progress</p>
            <p className="text-xs text-emerald-600 mt-0.5">{marked.size} of {questions.length} questions marked as ready</p>
          </div>
          <div className="w-32 h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${questions.length > 0 ? (marked.size / questions.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Questions grouped by type */}
      {Object.entries(byType).map(([type, qs]) => {
        const cfg = TYPE_CFG[type] ?? { color: "#6b7280", bg: "#f3f4f6", emoji: "❓" };
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{cfg.emoji}</span>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: cfg.color }}>{type}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{qs.length}</span>
            </div>
            <div className="space-y-2">
              {qs.map((q) => {
                const globalIdx = questions.indexOf(q);
                const isOpen    = openAnswers.has(globalIdx);
                const isMarked  = marked.has(globalIdx);
                return (
                  <div key={globalIdx}
                    className={`border rounded-sm overflow-hidden transition-all ${isMarked ? "border-emerald-300 bg-emerald-50/30" : "border-stone-100 bg-white"}`}>
                    {/* Question header */}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{type}</span>
                            {q.difficulty && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                                style={{ color: DIFFICULTY_COLOR[q.difficulty] ?? "#6b7280", backgroundColor: `${DIFFICULTY_COLOR[q.difficulty] ?? "#6b7280"}15` }}>
                                {q.difficulty}
                              </span>
                            )}
                            {isMarked && <span className="text-[10px] font-bold text-emerald-600">✓ Ready</span>}
                          </div>
                          <p className="text-sm font-semibold text-stone-900 leading-snug">{q.question}</p>
                          {q.tip && <p className="text-xs text-stone-400 mt-2 leading-relaxed">💡 {q.tip}</p>}
                        </div>
                        {studyMode && (
                          <button onClick={() => toggleMark(globalIdx)}
                            className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              isMarked ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-200 text-stone-200 hover:border-emerald-400"
                            }`}>
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* STAR hint */}
                      {q.starHint && (
                        <div className="flex items-start gap-2 mt-3 bg-blue-50 border border-blue-100 rounded-sm px-3 py-2">
                          <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-700 font-medium">{q.starHint}</p>
                        </div>
                      )}

                      {/* Reveal answer button */}
                      {q.modelAnswer && (
                        <button
                          onClick={() => toggle(globalIdx)}
                          className={`mt-3 flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-sm border transition-all w-full justify-center ${
                            isOpen
                              ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                              : "bg-stone-50 border-stone-200 text-stone-600 hover:border-purple-400 hover:text-purple-600"
                          }`}
                        >
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {isOpen ? "Hide Answer" : "Reveal Model Answer"}
                          {!isOpen && <span className="ml-auto text-[10px] text-stone-400 font-normal">Click to study →</span>}
                        </button>
                      )}
                    </div>

                    {/* Expandable model answer */}
                    <AnimatePresence>
                      {isOpen && q.modelAnswer && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-purple-100 bg-purple-50 px-4 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider">
                                📖 Model Answer — Adapt This to Your Own Words
                              </p>
                              <button onClick={() => navigator.clipboard.writeText(q.modelAnswer!)}
                                className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-700 transition-colors">
                                <Copy className="w-3 h-3" />Copy
                              </button>
                            </div>
                            <p className="text-sm text-purple-900 leading-relaxed">{q.modelAnswer}</p>
                            <div className="mt-3 flex items-start gap-2 bg-white/70 border border-purple-100 rounded-sm px-3 py-2">
                              <Info className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                              <p className="text-[11px] text-purple-600 leading-relaxed">
                                <span className="font-bold">How to use this:</span> Don't memorise it word-for-word. Understand the structure, then practice saying it in your own voice. The best interview answers feel natural, not rehearsed.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Results Stage (UPDATED with token gate) ──────────────────────────────────

function ResultsStage({
  analysis, cvText, jdText, onReset, onRewrite, isSignedIn, onInsufficientTokens,
}: {
  analysis:   CVAnalysis;
  cvText:     string;
  jdText:     string;
  onReset:    () => void;
  onRewrite:  (mode: string) => void;
  isSignedIn: boolean;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
}) {
  const [activeTab,      setActiveTab]      = useState<"overview" | "keywords" | "sections" | "rewrites" | "interview" | "cover-letter">("overview");
  const [copied,         setCopied]         = useState(false);
  const [rewriting,      setRewriting]      = useState(false);
  const [rewriteResult,  setRewriteResult]  = useState("");
  const [rewriteMode,    setRewriteMode]    = useState<"improve" | "full_rewrite" | "tailor" | null>(null);
  const [clLoading,      setClLoading]      = useState(false);
  const [clResult,       setClResult]       = useState("");
  const [clStyle,        setClStyle]        = useState<"professional" | "creative" | "concise">("professional");
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [saveError,      setSaveError]      = useState("");

  const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";

  const hasJD = jdText.trim().length > 50;

  const copyAll = () => {
    const text = [
      `AI CV Analysis Results`,
      `Overall Score: ${analysis.overallScore}/100`,
      ``,
      analysis.executiveSummary,
      ``,
      `SCORES:`,
      `ATS: ${analysis.atsScore}/100`,
      `Language: ${analysis.languageScore}/100`,
      `Structure: ${analysis.structureScore}/100`,
      hasJD ? `Job Match: ${analysis.jobMatchScore}/100` : null,
      hasJD ? `Keyword Match: ${analysis.keywordScore}/100` : null,
      ``,
      `TOP IMPROVEMENTS:`,
      ...analysis.topImprovements.map((i) => `${i.priority}. [${i.impact}] ${i.improvement}`),
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRewrite = async (mode: "improve" | "full_rewrite" | "tailor") => {
    setRewriting(true); setRewriteMode(mode); setRewriteResult("");
    try {
      const res  = await fetch("/api/tools/cv-analyser/rewrite", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "Full CV", content: cvText, jobDescription: jdText, mode }),
      });

      // ── NEW: handle 402 insufficient tokens for rewrite ─────────────────
      if (res.status === 402) {
        const data = await res.json();
        onInsufficientTokens?.({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "CV Rewriter",
        });
        setRewriteResult("You've run out of tokens to rewrite your CV. Please play some games to earn more tokens, then try again.");
        setRewriting(false);
        return;
      }

      const data = await res.json();
      setRewriteResult(data.result ?? "Rewrite failed");
    } catch { setRewriteResult("Rewrite failed — please try again."); }
    setRewriting(false);
  };

  const handleGenerateCoverLetter = async () => {
    setClLoading(true); setClResult("");
    try {
      const res  = await fetch("/api/tools/cv-analyser/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, jobDescription: jdText, style: clStyle }),
      });

      // ── NEW: handle 402 insufficient tokens for cover letter ────────────
      if (res.status === 402) {
        const data = await res.json();
        onInsufficientTokens?.({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Cover Letter Generator",
        });
        setClResult("You've run out of tokens to generate a cover letter. Please play some games to earn more tokens, then try again.");
        setClLoading(false);
        return;
      }

      const data = await res.json();
      setClResult(data.coverLetter ?? data.error ?? "Generation failed");
    } catch { setClResult("Network error — please try again."); }
    setClLoading(false);
  };

  const TABS = [
    { id: "overview",       label: "Overview",       icon: BarChart2      },
    { id: "keywords",       label: "Keywords",       icon: Search         },
    { id: "sections",       label: "Sections",       icon: BookOpen       },
    { id: "rewrites",       label: "Improvements",   icon: Wand2          },
    { id: "interview",      label: "Interview Prep", icon: MessageSquare  },
    { id: "cover-letter",   label: "Cover Letter",   icon: FileText       },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Score dashboard */}
      <div className="bg-stone-900 text-white rounded-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Overall Score</p>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-black" style={{ color: scoreColor(analysis.overallScore) }}>
                {analysis.overallScore}
              </span>
              <span className="text-2xl text-white/30 mb-2">/100</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={copyAll}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
            {isSignedIn && (
              <button
                onClick={async () => {
                  setSaving(true); setSaveError(""); setSaved(false);
                  try {
                    const res = await fetch("/api/tools/cv-analyser/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        cvText, jobDescription: jdText,
                        analysis,
                        coverLetter:      clResult || undefined,
                        coverLetterStyle: clResult ? clStyle : undefined,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) { setSaveError(data.error ?? "Save failed"); }
                    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
                  } catch { setSaveError("Network error"); }
                  setSaving(false);
                }}
                disabled={saving}
                className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                  saved
                    ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
                    : "text-white/70 hover:text-white border-white/20 hover:border-white/40 hover:bg-white/5"
                }`}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save to Workspace"}
              </button>
            )}
            <button onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              <RefreshCw className="w-3.5 h-3.5" />New
            </button>
          </div>
          {saveError && (
            <p className="text-xs text-red-400 mt-1">{saveError}</p>
          )}
        </div>

        {/* Score rings */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <ScoreRing score={analysis.atsScore}       label="ATS"        color="#f59e0b" />
          <ScoreRing score={analysis.languageScore}  label="Language"   color="#10b981" />
          <ScoreRing score={analysis.structureScore} label="Structure"  color="#8b5cf6" />
          {hasJD && <>
            <ScoreRing score={analysis.jobMatchScore}  label="Job Match"  color="#3b82f6" />
            <ScoreRing score={analysis.keywordScore}   label="Keywords"   color="#ec4899" />
          </>}
        </div>
      </div>

      {/* Executive summary */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-1.5">AI Assessment</p>
            <p className="text-sm text-emerald-900 leading-relaxed">{analysis.executiveSummary}</p>
          </div>
        </div>
      </div>

      {/* Success prediction */}
      {analysis.successPrediction && (
        <div className={`border rounded-sm p-4 ${
          analysis.successPrediction.shortlistLikelihood === "High" ? "bg-green-50 border-green-200" :
          analysis.successPrediction.shortlistLikelihood === "Medium" ? "bg-amber-50 border-amber-200" :
          "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: LIKELIHOOD_COLOR[analysis.successPrediction.shortlistLikelihood] }}>
              Shortlist Likelihood: {analysis.successPrediction.shortlistLikelihood}
            </p>
            <span className="text-sm font-black" style={{ color: LIKELIHOOD_COLOR[analysis.successPrediction.shortlistLikelihood] }}>
              {analysis.successPrediction.confidencePercent}%
            </span>
          </div>
          <p className="text-xs text-stone-600 mb-2">{analysis.successPrediction.reason}</p>
          <div className="flex items-start gap-2 bg-white/60 rounded-sm px-3 py-2">
            <Target className="w-3.5 h-3.5 text-stone-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-stone-700"><span className="text-stone-500">Top action: </span>{analysis.successPrediction.topAction}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-stone-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW tab ──────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Top improvements */}
          <div>
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Top {analysis.topImprovements.length} Priority Improvements</p>
            <div className="space-y-2">
              {analysis.topImprovements
                .sort((a, b) => a.priority - b.priority)
                .map((imp) => (
                  <div key={imp.priority} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {imp.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700">{imp.improvement}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: IMPACT_COLOR[imp.impact], backgroundColor: `${IMPACT_COLOR[imp.impact]}15` }}>
                          {imp.impact} impact
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: EFFORT_COLOR[imp.effort], backgroundColor: `${EFFORT_COLOR[imp.effort]}15` }}>
                          {imp.effort}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Score bars */}
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Score Breakdown</p>
            <div className="space-y-3">
              {[
                { label: "ATS Compatibility", score: analysis.atsScore,       color: "#f59e0b" },
                { label: "Language & Impact", score: analysis.languageScore,  color: "#10b981" },
                { label: "Structure & Format",score: analysis.structureScore, color: "#8b5cf6" },
                ...(hasJD ? [
                  { label: "Job Match",       score: analysis.jobMatchScore,  color: "#3b82f6" },
                  { label: "Keyword Alignment",score: analysis.keywordScore,  color: "#ec4899" },
                ] : []),
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-stone-600">{s.label}</span>
                    <span className="text-xs font-black" style={{ color: s.color }}>{s.score}/100</span>
                  </div>
                  <AnimatedBar score={s.score} color={s.color} />
                </div>
              ))}
            </div>
          </div>

          {/* ATS issues */}
          {analysis.atsIssues?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-black text-amber-700 uppercase tracking-wider">ATS Issues Found</p>
              </div>
              <ul className="space-y-1.5">
                {analysis.atsIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />{issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rewrite actions */}
          <div className="bg-stone-50 border border-stone-200 rounded-sm p-5">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">AI Rewrite Tools</p>
            <div className="flex flex-wrap gap-2">
              {[
                { mode: "improve",       label: "Improve Language",   color: "#10b981", icon: Zap      },
                { mode: "full_rewrite",  label: "Full CV Rewrite",    color: "#3b82f6", icon: RefreshCw },
                ...(hasJD ? [{ mode: "tailor", label: "Tailor to This Job", color: "#8b5cf6", icon: Target }] : []),
              ].map((action) => (
                <button key={action.mode} onClick={() => handleRewrite(action.mode as any)}
                  disabled={rewriting}
                  className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-sm border transition-colors disabled:opacity-50"
                  style={{ color: action.color, borderColor: `${action.color}40`, backgroundColor: `${action.color}08` }}>
                  {rewriting && rewriteMode === action.mode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <action.icon className="w-3.5 h-3.5" />}
                  {action.label}
                </button>
              ))}
            </div>

            {rewriting && (
              <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />Generating your improved CV…
              </div>
            )}

            {rewriteResult && !rewriting && (
              <div className="mt-4 border border-stone-200 rounded-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-100">
                  <span className="text-xs font-bold text-stone-600">Rewritten CV</span>
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(rewriteResult); }}
                      className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors">
                      <Copy className="w-3 h-3" />Copy
                    </button>
                    <button onClick={() => setRewriteResult("")} className="text-stone-300 hover:text-stone-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{rewriteResult}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KEYWORDS tab ──────────────────────────────────────────────── */}
      {activeTab === "keywords" && (
        <div className="space-y-4">
          {hasJD ? (
            <>
              {/* Missing keywords — most important */}
              {analysis.keywordGap?.missing?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs font-black text-red-700 uppercase tracking-wider">
                      Missing Keywords ({analysis.keywordGap.missing.length})
                    </p>
                  </div>
                  <p className="text-xs text-red-600 mb-3">These keywords from the JD are absent from your CV — add them naturally to improve your score.</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywordGap.missing.map((kw) => (
                      <span key={kw} className="text-xs font-bold text-red-700 bg-white border border-red-300 px-3 py-1.5 rounded-sm flex items-center gap-1">
                        <Plus className="w-3 h-3" />{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Present keywords */}
              {analysis.keywordGap?.present?.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-xs font-black text-green-700 uppercase tracking-wider">
                      Matching Keywords ({analysis.keywordGap.present.length})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywordGap.present.map((kw) => (
                      <span key={kw} className="text-xs font-semibold text-green-700 bg-white border border-green-300 px-3 py-1.5 rounded-sm flex items-center gap-1">
                        <Check className="w-3 h-3" />{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Paste a job description for keyword analysis</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    The keyword gap feature compares your CV against a specific job description. Go back and add the JD to unlock this.
                  </p>
                  <button onClick={onReset}
                    className="mt-3 text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-sm transition-colors">
                    Add Job Description
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Suggested keywords (always show) */}
          {analysis.keywordGap?.suggested?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-black text-blue-700 uppercase tracking-wider">
                  Suggested Keywords ({analysis.keywordGap.suggested.length})
                </p>
              </div>
              <p className="text-xs text-blue-600 mb-3">These keywords would strengthen your CV for this type of role.</p>
              <div className="flex flex-wrap gap-2">
                {analysis.keywordGap.suggested.map((kw) => (
                  <span key={kw} className="text-xs font-semibold text-blue-700 bg-white border border-blue-300 px-3 py-1.5 rounded-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTIONS tab ──────────────────────────────────────────────── */}
      {activeTab === "sections" && (
        <div className="space-y-3">
          {analysis.sectionFeedback?.map((sf) => {
            const cfg  = STATUS_CFG[sf.status] ?? STATUS_CFG["Needs Work"];
            const Icon = cfg.icon;
            return (
              <div key={sf.section} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-bold text-stone-800">{sf.section}</p>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                        {sf.status}
                      </span>
                      <span className="text-xs font-black ml-auto" style={{ color: scoreColor(sf.score) }}>{sf.score}/100</span>
                    </div>
                    <AnimatedBar score={sf.score} color={cfg.color} />
                  </div>
                </div>
                <div className="px-5 pb-4 border-t border-stone-50">
                  <p className="text-sm text-stone-600 leading-relaxed mt-3">{sf.feedback}</p>
                  {sf.quickWin && (
                    <div className="flex items-start gap-2 mt-3 bg-stone-50 border border-stone-100 rounded-sm px-3 py-2.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-stone-600">
                        <span className="text-emerald-600">Quick win: </span>{sf.quickWin}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── REWRITES tab ──────────────────────────────────────────────── */}
      {activeTab === "rewrites" && (
        <div className="space-y-5">
          {/* Bullet rewrites */}
          {analysis.bulletRewrites?.length > 0 && (
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">
                Bullet Point Rewrites ({analysis.bulletRewrites.length})
              </p>
              <div className="space-y-4">
                {analysis.bulletRewrites.map((br, i) => (
                  <div key={i} className="border border-stone-100 rounded-sm overflow-hidden">
                    <div className="grid grid-cols-2 gap-0">
                      <div className="bg-red-50 border-r border-stone-100 px-4 py-3">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1.5">Before</p>
                        <p className="text-xs text-red-700 leading-relaxed line-through">{br.original}</p>
                      </div>
                      <div className="bg-green-50 px-4 py-3 relative">
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-wider mb-1.5">After</p>
                        <p className="text-xs text-green-800 leading-relaxed font-medium">{br.improved}</p>
                        <button onClick={() => navigator.clipboard.writeText(br.improved)}
                          className="absolute top-2 right-2 text-green-400 hover:text-green-700 transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {br.why && (
                      <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100">
                        <p className="text-[11px] text-stone-500"><span className="font-semibold">Why: </span>{br.why}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Language issues */}
          {analysis.languageIssues?.length > 0 && (
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">
                Language Issues ({analysis.languageIssues.length})
              </p>
              <div className="space-y-2">
                {analysis.languageIssues.map((li, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-red-600 line-through">{li.weak}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-emerald-700">{li.stronger}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{li.category}</span>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(li.stronger)}
                      className="text-stone-300 hover:text-stone-600 flex-shrink-0 transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INTERVIEW tab ─────────────────────────────────────────────── */}
      {activeTab === "interview" && (
        <InterviewTab questions={analysis.interviewQuestions ?? []} hasJD={hasJD} />
      )}

      {/* ── COVER LETTER tab (UPDATED with token gate) ─────────────────── */}
      {activeTab === "cover-letter" && (
        <div className="space-y-5">
          {!hasJD && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3.5">
              <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Job description recommended</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  A cover letter without a JD will be generic. Go back and add the job description for a tailored letter.
                </p>
                <button onClick={onReset} className="mt-2 text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-sm transition-colors">
                  Add Job Description
                </button>
              </div>
            </div>
          )}

          {/* Style selector */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Cover Letter Style</label>
            <div className="flex gap-2">
              {([
                { id: "professional", label: "Professional",  desc: "Formal, structured, traditional"     },
                { id: "creative",     label: "Creative",       desc: "Engaging, personality-led, modern"   },
                { id: "concise",      label: "Concise",        desc: "Short, punchy, 3 paragraphs max"     },
              ] as const).map((s) => (
                <button key={s.id} onClick={() => setClStyle(s.id)}
                  title={s.desc}
                  className={`flex-1 text-xs font-bold py-2.5 px-3 rounded-sm border transition-colors text-center ${
                    clStyle === s.id ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateCoverLetter}
            disabled={clLoading}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 py-3 rounded-sm transition-colors disabled:opacity-60 shadow-sm"
          >
            {clLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {clLoading ? "Generating your cover letter…" : `Generate ${clStyle.charAt(0).toUpperCase() + clStyle.slice(1)} Cover Letter`}
          </button>

          {/* Loading indicator */}
          {clLoading && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin flex-shrink-0" />
              <p className="text-xs text-emerald-700">Writing your personalised cover letter… (~10 seconds)</p>
            </div>
          )}

          {/* Result */}
          {clResult && !clLoading && (
            <div className="border border-stone-200 rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
                <p className="text-xs font-bold text-stone-600">Your Cover Letter</p>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(clResult)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
                    <Copy className="w-3 h-3" />Copy
                  </button>
                  <button onClick={() => {
                    const blob = new Blob([clResult], { type: "text/plain" });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement("a"); a.href = url; a.download = "cover-letter.txt"; a.click();
                    URL.revokeObjectURL(url);
                  }} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1.5 rounded-sm transition-colors">
                    <Download className="w-3 h-3" />Download
                  </button>
                  <button onClick={() => setClResult("")} className="text-stone-300 hover:text-stone-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <pre className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed font-sans">{clResult}</pre>
              </div>
              <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  <span className="font-bold">Important:</span> This is a starting point. Always personalise it — add specific company research, adjust the tone to match the company culture, and make it unmistakably you.
                </p>
              </div>
            </div>
          )}

          {/* What makes a great cover letter */}
          <div className="bg-stone-50 border border-stone-100 rounded-sm p-5">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">What makes a great cover letter</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Opening hook",   desc: "Start with a specific, compelling reason why you want this role — not 'I am writing to apply for...'" },
                { label: "Relevant wins",  desc: "Pick 2-3 achievements that directly match what the JD asks for. Quantify them." },
                { label: "Company knowledge", desc: "Show you've researched them. Reference something specific — a product, initiative, or value." },
                { label: "Clear close",    desc: "End with confidence: request an interview, don't beg for one." },
              ].map((tip) => (
                <div key={tip.label} className="bg-white border border-stone-100 rounded-sm p-3">
                  <p className="text-xs font-bold text-stone-700 mb-1">{tip.label}</p>
                  <p className="text-[11px] text-stone-500 leading-snug">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN EXPORT (UPDATED with token gate) ────────────────────────────────────

export function CVAnalyserTool({ isSignedIn = false, onInsufficientTokens }: CVAnalyserToolProps) {
  const [stage,    setStage]    = useState<"input" | "loading" | "results">("input");
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [cvText,   setCvText]   = useState("");
  const [jdText,   setJdText]   = useState("");
  const [error,    setError]    = useState("");
  const [loadStep, setLoadStep] = useState(0);

  const LOAD_STEPS = [
    "Reading your CV…",
    "Checking ATS compatibility…",
    "Analysing keyword gaps…",
    "Reviewing each section…",
    "Generating improvement suggestions…",
    "Preparing interview questions…",
  ];

  const handleAnalyse = async (cv: string, jd: string, mode: string) => {
    setCvText(cv); setJdText(jd);
    setStage("loading"); setError(""); setLoadStep(0);

    // Cycle through loading steps
    const interval = setInterval(() => setLoadStep((p) => Math.min(p + 1, LOAD_STEPS.length - 1)), 1400);

    try {
      const res  = await fetch("/api/tools/cv-analyser/analyse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: cv, jobDescription: jd, roleMode: mode }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        onInsufficientTokens?.({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "CV Analyser",
        });
        clearInterval(interval);
        setStage("input");
        setError("You've run out of tokens to analyse your CV. Please play some games to earn more tokens, then try again.");
        return;
      }

      const data = await res.json();
      clearInterval(interval);
      if (!res.ok || !data.analysis) {
        setError(data.error ?? "Analysis failed — please try again.");
        setStage("input");
        return;
      }
      setAnalysis(data.analysis);
      setStage("results");
    } catch {
      clearInterval(interval);
      setError("Network error — please check your connection and try again.");
      setStage("input");
    }
  };

  return (
    <div className="space-y-0" style={{ fontFamily: "Sora, sans-serif" }}>
      {/* Loading state */}
      {stage === "loading" && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">📄</div>
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-sm font-semibold text-stone-600">
                {LOAD_STEPS[loadStep]}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-stone-400 mt-1">Comprehensive analysis in progress…</p>
          </div>
          <div className="flex gap-1.5">
            {LOAD_STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-emerald-400" : "bg-stone-200"}`} />
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

      {stage === "input"   && <InputStage onAnalyse={handleAnalyse} />}
      {stage === "results" && analysis && (
        <ResultsStage
          analysis={analysis} cvText={cvText} jdText={jdText}
          onReset={() => { setStage("input"); setAnalysis(null); }}
          onRewrite={() => {}}
          isSignedIn={isSignedIn}
          onInsufficientTokens={onInsufficientTokens}
        />
      )}
    </div>
  );
}






// "use client";

// // =============================================================================
// // isaacpaha.com — AI CV Analyser Pro
// // app/tools/ai-cv-analyser/_components/cv-analyser-tool.tsx
// //
// // Full-featured AI CV analysis tool:
// //   - CV + Job Description input
// //   - Role mode selector (Tech / Finance / Graduate / Business / Healthcare)
// //   - Comprehensive score dashboard (5 scores + overall)
// //   - Keyword gap analysis (present / missing / suggested)
// //   - Section-by-section feedback
// //   - Bullet point rewriter
// //   - Language issue detector
// //   - ATS issue checker
// //   - Success prediction
// //   - Top 5 improvements (prioritised)
// //   - Interview question generator
// //   - Full CV rewrite + tailor to JD
// //   - Copy / export results
// // =============================================================================

// import React, { useState, useRef, useCallback } from "react";
// import { motion, AnimatePresence }               from "framer-motion";
// import {
//   FileText, Sparkles, Loader2, AlertCircle, Check, Copy,
//   ChevronDown, ChevronUp, ArrowRight, RefreshCw, Download,
//   Target, TrendingUp, Zap, BookOpen, Award, CheckCircle2,
//   XCircle, AlertTriangle, Info, Wand2, MessageSquare,
//   BarChart2, Search, Shield, Lightbulb, ChevronRight,
//   X, Plus, Minus, Eye, EyeOff,
// } from "lucide-react";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface SectionFeedback {
//   section:   string;
//   score:     number;
//   status:    "Strong" | "Good" | "Needs Work" | "Missing";
//   feedback:  string;
//   quickWin:  string;
// }

// interface BulletRewrite {
//   original: string;
//   improved: string;
//   why:      string;
// }

// interface LanguageIssue {
//   weak:     string;
//   stronger: string;
//   category: string;
// }

// interface TopImprovement {
//   priority:    number;
//   improvement: string;
//   impact:      "Low" | "Medium" | "High";
//   effort:      "Quick Fix" | "1 Hour" | "Half Day";
// }

// interface InterviewQuestion {
//   question:    string;
//   type:        string;
//   difficulty:  "Easy" | "Medium" | "Hard";
//   tip:         string;
//   starHint:    string;
//   modelAnswer?: string;  // AI-generated model answer — revealed via dropdown
// }

// interface CVAnalysis {
//   jobMatchScore:     number;
//   atsScore:          number;
//   keywordScore:      number;
//   languageScore:     number;
//   structureScore:    number;
//   overallScore:      number;
//   executiveSummary:  string;
//   successPrediction: {
//     shortlistLikelihood: "Low" | "Medium" | "High";
//     confidencePercent:   number;
//     reason:              string;
//     topAction:           string;
//   };
//   keywordGap: {
//     present:   string[];
//     missing:   string[];
//     suggested: string[];
//   };
//   sectionFeedback:  SectionFeedback[];
//   bulletRewrites:   BulletRewrite[];
//   languageIssues:   LanguageIssue[];
//   atsIssues:        string[];
//   topImprovements:  TopImprovement[];
//   interviewQuestions: InterviewQuestion[];
// }


// // ─── Config ───────────────────────────────────────────────────────────────────

// const ROLE_MODES = [
//   { id: "general",    label: "General",    emoji: "💼", desc: "Any professional role"         },
//   { id: "tech",       label: "Tech",        emoji: "💻", desc: "Software, data, product, cyber" },
//   { id: "finance",    label: "Finance",     emoji: "📈", desc: "Finance, banking, accounting"  },
//   { id: "graduate",   label: "Graduate",    emoji: "🎓", desc: "Entry-level & graduate roles"  },
//   { id: "business",   label: "Business",    emoji: "🏢", desc: "Strategy, ops, management"     },
//   { id: "healthcare", label: "Healthcare",  emoji: "🏥", desc: "Medical, nursing, life sciences"},
//   { id: "creative",   label: "Creative",    emoji: "🎨", desc: "Design, marketing, media"      },
// ];

// const STATUS_CFG = {
//   Strong:      { color: "#059669", bg: "#d1fae5", dot: "#10b981", icon: CheckCircle2 },
//   Good:        { color: "#2563eb", bg: "#dbeafe", dot: "#3b82f6", icon: Check       },
//   "Needs Work":{ color: "#d97706", bg: "#fef3c7", dot: "#f59e0b", icon: AlertTriangle },
//   Missing:     { color: "#dc2626", bg: "#fee2e2", dot: "#ef4444", icon: XCircle     },
// };

// const IMPACT_COLOR = { High: "#10b981", Medium: "#f59e0b", Low: "#6b7280" };
// const EFFORT_COLOR = { "Quick Fix": "#10b981", "1 Hour": "#f59e0b", "Half Day": "#ef4444" };
// const LIKELIHOOD_COLOR = { High: "#10b981", Medium: "#f59e0b", Low: "#ef4444" };
// const DIFFICULTY_COLOR = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };

// // ─── Utilities ────────────────────────────────────────────────────────────────

// function ScoreRing({ score, label, color, size = "md" }: { score: number; label: string; color: string; size?: "sm" | "md" | "lg" }) {
//   const r    = size === "lg" ? 40 : size === "md" ? 28 : 20;
//   const circ = 2 * Math.PI * r;
//   const dash = (score / 100) * circ;
//   const dim  = size === "lg" ? 96 : size === "md" ? 72 : 52;
//   const fs   = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-sm";

//   return (
//     <div className="flex flex-col items-center gap-1">
//       <div className="relative" style={{ width: dim, height: dim }}>
//         <svg viewBox={`0 0 ${dim} ${dim}`} className="rotate-[-90deg]" width={dim} height={dim}>
//           <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={size === "lg" ? 6 : 5} />
//           <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke={color} strokeWidth={size === "lg" ? 6 : 5}
//             strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
//             style={{ transition: "stroke-dasharray 1s ease" }} />
//         </svg>
//         <div className="absolute inset-0 flex items-center justify-center">
//           <span className={`font-black ${fs}`} style={{ color }}>{score}</span>
//         </div>
//       </div>
//       <span className="text-[11px] font-semibold text-stone-500 text-center leading-tight">{label}</span>
//     </div>
//   );
// }

// function AnimatedBar({ score, color }: { score: number; color: string }) {
//   return (
//     <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
//       <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
//         initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
//     </div>
//   );
// }

// function Section({ title, icon: Icon, iconColor, children, defaultOpen = false }: {
//   title: string; icon: React.ElementType; iconColor: string;
//   children: React.ReactNode; defaultOpen?: boolean;
// }) {
//   const [open, setOpen] = useState(defaultOpen);
//   return (
//     <div className="border border-stone-100 rounded-sm overflow-hidden">
//       <button onClick={() => setOpen((p) => !p)}
//         className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-stone-50 transition-colors">
//         <div className="flex items-center gap-2.5">
//           <Icon className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />
//           <span className="text-sm font-bold text-stone-800">{title}</span>
//         </div>
//         {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
//       </button>
//       <AnimatePresence>
//         {open && (
//           <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}
//             exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
//             <div className="border-t border-stone-100">
//               {children}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // ─── Input Stage ──────────────────────────────────────────────────────────────

// function InputStage({ onAnalyse }: { onAnalyse: (cv: string, jd: string, mode: string) => void }) {
//   const [cvText, setCvText]   = useState("");
//   const [jdText, setJdText]   = useState("");
//   const [mode,   setMode]     = useState("general");
//   const [tab,    setTab]      = useState<"cv" | "jd">("cv");

//   const cvValid = cvText.trim().length >= 100;
//   const jdHas   = jdText.trim().length > 50;

//   return (
//     <div className="space-y-5">
//       {/* Role mode selector */}
//       <div>
//         <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
//           Optimise for role type
//         </label>
//         <div className="flex flex-wrap gap-1.5">
//           {ROLE_MODES.map((m) => (
//             <button key={m.id} onClick={() => setMode(m.id)}
//               title={m.desc}
//               className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
//                 mode === m.id ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
//               }`}>
//               <span>{m.emoji}</span>{m.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Input tabs */}
//       <div className="border border-stone-200 rounded-sm overflow-hidden">
//         <div className="flex border-b border-stone-200">
//           {[
//             { id: "cv", label: "CV / Résumé", required: true },
//             { id: "jd", label: "Job Description", required: false, badge: jdHas ? "Added ✓" : "Optional — boosts accuracy" },
//           ].map((t) => (
//             <button key={t.id} onClick={() => setTab(t.id as any)}
//               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
//                 tab === t.id ? "bg-stone-50 text-stone-900 border-b-2 border-emerald-500" : "bg-white text-stone-400 hover:text-stone-700"
//               }`}>
//               {t.label}
//               {t.badge && (
//                 <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold ${jdHas ? "text-emerald-600 bg-emerald-50 border border-emerald-200" : "text-stone-400 bg-stone-100"}`}>
//                   {t.badge}
//                 </span>
//               )}
//             </button>
//           ))}
//         </div>

//         {tab === "cv" && (
//           <div className="p-4">
//             <textarea value={cvText} onChange={(e) => setCvText(e.target.value)}
//               placeholder={`Paste your full CV here…\n\nInclude all sections:\n• Professional summary\n• Work experience\n• Education\n• Skills\n• Projects (if applicable)`}
//               rows={12}
//               className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none font-mono leading-relaxed"
//             />
//             <div className="flex items-center justify-between mt-2">
//               <span className={`text-xs font-semibold ${cvValid ? "text-emerald-600" : cvText.length > 0 ? "text-amber-500" : "text-stone-400"}`}>
//                 {cvText.length} chars {cvValid ? "✓ Ready" : cvText.length > 0 ? `— need ${100 - cvText.length} more` : ""}
//               </span>
//               {cvText.length > 0 && (
//                 <button onClick={() => setCvText("")} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Clear</button>
//               )}
//             </div>
//           </div>
//         )}

//         {tab === "jd" && (
//           <div className="p-4">
//             <textarea value={jdText} onChange={(e) => setJdText(e.target.value)}
//               placeholder={`Paste the job description here (optional but highly recommended)…\n\nThe AI will:\n• Extract required keywords\n• Calculate your job match score\n• Identify critical skill gaps\n• Generate role-specific interview questions`}
//               rows={12}
//               className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none font-mono leading-relaxed"
//             />
//             <div className="flex items-center justify-between mt-2">
//               <span className="text-xs text-stone-400">{jdText.length} chars {jdHas ? "✓ Added" : ""}</span>
//               {jdText.length > 0 && (
//                 <button onClick={() => setJdText("")} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Clear</button>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Analyse button */}
//       <button onClick={() => onAnalyse(cvText, jdText, mode)}
//         disabled={!cvValid}
//         className="w-full flex items-center justify-center gap-2 text-base font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-sm transition-colors shadow-sm">
//         <Sparkles className="w-5 h-5" />
//         Analyse My CV{jdHas ? " Against This Job" : ""}
//       </button>

//       {!cvValid && cvText.length > 0 && (
//         <p className="text-xs text-amber-600 text-center">Paste more of your CV to enable analysis (need at least 100 characters)</p>
//       )}

//       {/* What you get */}
//       <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
//         {[
//           { icon: Target,      label: "ATS Score",          color: "#f59e0b" },
//           { icon: Search,      label: "Keyword Gap",         color: "#3b82f6" },
//           { icon: BarChart2,   label: "5 Score Breakdown",   color: "#8b5cf6" },
//           { icon: Wand2,       label: "Bullet Rewrites",     color: "#ec4899" },
//           { icon: Lightbulb,   label: "Top 5 Improvements",  color: "#10b981" },
//           { icon: MessageSquare,label: "Interview Questions", color: "#f97316" },
//         ].map((f) => (
//           <div key={f.label} className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-sm">
//             <f.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: f.color }} />
//             <span className="text-[11px] font-semibold text-stone-600">{f.label}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── Interview Tab Component ─────────────────────────────────────────────────
// // Standalone component so it can hold its own open/close state per question

// function InterviewTab({ questions, hasJD }: { questions: InterviewQuestion[]; hasJD: boolean }) {
//   const [openAnswers, setOpenAnswers] = React.useState<Set<number>>(new Set());
//   const [studyMode,   setStudyMode]   = React.useState(false);
//   const [marked,      setMarked]      = React.useState<Set<number>>(new Set());

//   const toggle = (i: number) => {
//     setOpenAnswers((prev) => {
//       const next = new Set(prev);
//       prev.has(i) ? next.delete(i) : next.add(i);
//       return next;
//     });
//   };

//   const toggleMark = (i: number) => {
//     setMarked((prev) => {
//       const next = new Set(prev);
//       prev.has(i) ? next.delete(i) : next.add(i);
//       return next;
//     });
//   };

//   const byType = questions.reduce<Record<string, InterviewQuestion[]>>((acc, q) => {
//     (acc[q.type] = acc[q.type] ?? []).push(q);
//     return acc;
//   }, {});

//   const TYPE_CFG: Record<string, { color: string; bg: string; emoji: string }> = {
//     Behavioural:  { color: "#7c3aed", bg: "#ede9fe", emoji: "🧠" },
//     Technical:    { color: "#1d4ed8", bg: "#dbeafe", emoji: "⚙️" },
//     Situational:  { color: "#b45309", bg: "#fef3c7", emoji: "🎯" },
//     Motivational: { color: "#065f46", bg: "#d1fae5", emoji: "💡" },
//     Competency:   { color: "#be185d", bg: "#fce7f3", emoji: "⭐" },
//   };

//   return (
//     <div className="space-y-5">
//       {/* Header bar */}
//       <div className="flex items-center justify-between flex-wrap gap-3">
//         <div className="flex items-start gap-3 flex-1 bg-blue-50 border border-blue-200 rounded-sm px-4 py-3">
//           <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
//           <p className="text-xs text-blue-700 leading-relaxed">
//             {questions.length} questions generated{hasJD ? " from your CV and the job description" : " from your CV"}.{" "}
//             <span className="font-semibold">Click "Reveal Answer" on each question to see a model answer to study.</span>
//           </p>
//         </div>
//         <button
//           onClick={() => setStudyMode((p) => !p)}
//           className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-sm border transition-colors flex-shrink-0 ${
//             studyMode ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-stone-600 border-stone-200 hover:border-emerald-400 hover:text-emerald-600"
//           }`}
//         >
//           {studyMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
//           {studyMode ? "Exit Study Mode" : "Study Mode"}
//         </button>
//       </div>

//       {/* Progress in study mode */}
//       {studyMode && (
//         <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3 flex items-center justify-between">
//           <div>
//             <p className="text-sm font-bold text-emerald-800">Study Progress</p>
//             <p className="text-xs text-emerald-600 mt-0.5">{marked.size} of {questions.length} questions marked as ready</p>
//           </div>
//           <div className="w-32 h-2 bg-emerald-100 rounded-full overflow-hidden">
//             <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${questions.length > 0 ? (marked.size / questions.length) * 100 : 0}%` }} />
//           </div>
//         </div>
//       )}

//       {/* Questions grouped by type */}
//       {Object.entries(byType).map(([type, qs]) => {
//         const cfg = TYPE_CFG[type] ?? { color: "#6b7280", bg: "#f3f4f6", emoji: "❓" };
//         return (
//           <div key={type}>
//             <div className="flex items-center gap-2 mb-2">
//               <span className="text-base">{cfg.emoji}</span>
//               <p className="text-xs font-black uppercase tracking-wider" style={{ color: cfg.color }}>{type}</p>
//               <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{qs.length}</span>
//             </div>
//             <div className="space-y-2">
//               {qs.map((q) => {
//                 const globalIdx = questions.indexOf(q);
//                 const isOpen    = openAnswers.has(globalIdx);
//                 const isMarked  = marked.has(globalIdx);
//                 return (
//                   <div key={globalIdx}
//                     className={`border rounded-sm overflow-hidden transition-all ${isMarked ? "border-emerald-300 bg-emerald-50/30" : "border-stone-100 bg-white"}`}>
//                     {/* Question header */}
//                     <div className="p-4">
//                       <div className="flex items-start gap-3">
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 flex-wrap mb-2">
//                             <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{type}</span>
//                             {q.difficulty && (
//                               <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
//                                 style={{ color: DIFFICULTY_COLOR[q.difficulty] ?? "#6b7280", backgroundColor: `${DIFFICULTY_COLOR[q.difficulty] ?? "#6b7280"}15` }}>
//                                 {q.difficulty}
//                               </span>
//                             )}
//                             {isMarked && <span className="text-[10px] font-bold text-emerald-600">✓ Ready</span>}
//                           </div>
//                           <p className="text-sm font-semibold text-stone-900 leading-snug">{q.question}</p>
//                           {q.tip && <p className="text-xs text-stone-400 mt-2 leading-relaxed">💡 {q.tip}</p>}
//                         </div>
//                         {studyMode && (
//                           <button onClick={() => toggleMark(globalIdx)}
//                             className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
//                               isMarked ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-200 text-stone-200 hover:border-emerald-400"
//                             }`}>
//                             <Check className="w-4 h-4" />
//                           </button>
//                         )}
//                       </div>

//                       {/* STAR hint */}
//                       {q.starHint && (
//                         <div className="flex items-start gap-2 mt-3 bg-blue-50 border border-blue-100 rounded-sm px-3 py-2">
//                           <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
//                           <p className="text-xs text-blue-700 font-medium">{q.starHint}</p>
//                         </div>
//                       )}

//                       {/* Reveal answer button */}
//                       {q.modelAnswer && (
//                         <button
//                           onClick={() => toggle(globalIdx)}
//                           className={`mt-3 flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-sm border transition-all w-full justify-center ${
//                             isOpen
//                               ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
//                               : "bg-stone-50 border-stone-200 text-stone-600 hover:border-purple-400 hover:text-purple-600"
//                           }`}
//                         >
//                           {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
//                           {isOpen ? "Hide Answer" : "Reveal Model Answer"}
//                           {!isOpen && <span className="ml-auto text-[10px] text-stone-400 font-normal">Click to study →</span>}
//                         </button>
//                       )}
//                     </div>

//                     {/* Expandable model answer */}
//                     <AnimatePresence>
//                       {isOpen && q.modelAnswer && (
//                         <motion.div
//                           initial={{ height: 0, opacity: 0 }}
//                           animate={{ height: "auto", opacity: 1 }}
//                           exit={{ height: 0, opacity: 0 }}
//                           transition={{ duration: 0.25 }}
//                           className="overflow-hidden"
//                         >
//                           <div className="border-t border-purple-100 bg-purple-50 px-4 py-4">
//                             <div className="flex items-center justify-between mb-2">
//                               <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider">
//                                 📖 Model Answer — Adapt This to Your Own Words
//                               </p>
//                               <button onClick={() => navigator.clipboard.writeText(q.modelAnswer!)}
//                                 className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-700 transition-colors">
//                                 <Copy className="w-3 h-3" />Copy
//                               </button>
//                             </div>
//                             <p className="text-sm text-purple-900 leading-relaxed">{q.modelAnswer}</p>
//                             <div className="mt-3 flex items-start gap-2 bg-white/70 border border-purple-100 rounded-sm px-3 py-2">
//                               <Info className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
//                               <p className="text-[11px] text-purple-600 leading-relaxed">
//                                 <span className="font-bold">How to use this:</span> Don't memorise it word-for-word. Understand the structure, then practice saying it in your own voice. The best interview answers feel natural, not rehearsed.
//                               </p>
//                             </div>
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ─── Results Stage ────────────────────────────────────────────────────────────

// function ResultsStage({
//   analysis, cvText, jdText, onReset, onRewrite, isSignedIn,
// }: {
//   analysis:   CVAnalysis;
//   cvText:     string;
//   jdText:     string;
//   onReset:    () => void;
//   onRewrite:  (mode: string) => void;
//   isSignedIn: boolean;
// }) {
//   const [activeTab,      setActiveTab]      = useState<"overview" | "keywords" | "sections" | "rewrites" | "interview" | "cover-letter">("overview");
//   const [copied,         setCopied]         = useState(false);
//   const [rewriting,      setRewriting]      = useState(false);
//   const [rewriteResult,  setRewriteResult]  = useState("");
//   const [rewriteMode,    setRewriteMode]    = useState<"improve" | "full_rewrite" | "tailor" | null>(null);
//   const [clLoading,      setClLoading]      = useState(false);
//   const [clResult,       setClResult]       = useState("");
//   const [clStyle,        setClStyle]        = useState<"professional" | "creative" | "concise">("professional");
//   const [saving,         setSaving]         = useState(false);
//   const [saved,          setSaved]          = useState(false);
//   const [saveError,      setSaveError]      = useState("");

//   const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";

//   const hasJD = jdText.trim().length > 50;

//   const copyAll = () => {
//     const text = [
//       `AI CV Analysis Results`,
//       `Overall Score: ${analysis.overallScore}/100`,
//       ``,
//       analysis.executiveSummary,
//       ``,
//       `SCORES:`,
//       `ATS: ${analysis.atsScore}/100`,
//       `Language: ${analysis.languageScore}/100`,
//       `Structure: ${analysis.structureScore}/100`,
//       hasJD ? `Job Match: ${analysis.jobMatchScore}/100` : null,
//       hasJD ? `Keyword Match: ${analysis.keywordScore}/100` : null,
//       ``,
//       `TOP IMPROVEMENTS:`,
//       ...analysis.topImprovements.map((i) => `${i.priority}. [${i.impact}] ${i.improvement}`),
//     ].filter(Boolean).join("\n");
//     navigator.clipboard.writeText(text);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleRewrite = async (mode: "improve" | "full_rewrite" | "tailor") => {
//     setRewriting(true); setRewriteMode(mode); setRewriteResult("");
//     try {
//       const res  = await fetch("/api/tools/cv-analyser/rewrite", {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ section: "Full CV", content: cvText, jobDescription: jdText, mode }),
//       });
//       const data = await res.json();
//       setRewriteResult(data.result ?? "Rewrite failed");
//     } catch { setRewriteResult("Rewrite failed — please try again."); }
//     setRewriting(false);
//   };

//   const TABS = [
//     { id: "overview",       label: "Overview",       icon: BarChart2      },
//     { id: "keywords",       label: "Keywords",       icon: Search         },
//     { id: "sections",       label: "Sections",       icon: BookOpen       },
//     { id: "rewrites",       label: "Improvements",   icon: Wand2          },
//     { id: "interview",      label: "Interview Prep", icon: MessageSquare  },
//     { id: "cover-letter",   label: "Cover Letter",   icon: FileText       },
//   ] as const;

//   return (
//     <div className="space-y-5">
//       {/* Score dashboard */}
//       <div className="bg-stone-900 text-white rounded-sm p-6">
//         <div className="flex items-start justify-between mb-6">
//           <div>
//             <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Overall Score</p>
//             <div className="flex items-end gap-2">
//               <span className="text-6xl font-black" style={{ color: scoreColor(analysis.overallScore) }}>
//                 {analysis.overallScore}
//               </span>
//               <span className="text-2xl text-white/30 mb-2">/100</span>
//             </div>
//           </div>
//           <div className="flex gap-2 flex-wrap">
//             <button onClick={copyAll}
//               className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
//               {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
//             </button>
//             {isSignedIn && (
//               <button
//                 onClick={async () => {
//                   setSaving(true); setSaveError(""); setSaved(false);
//                   try {
//                     const res = await fetch("/api/tools/cv-analyser/save", {
//                       method: "POST",
//                       headers: { "Content-Type": "application/json" },
//                       body: JSON.stringify({
//                         cvText, jobDescription: jdText,
//                         analysis,
//                         coverLetter:      clResult || undefined,
//                         coverLetterStyle: clResult ? clStyle : undefined,
//                       }),
//                     });
//                     const data = await res.json();
//                     if (!res.ok) { setSaveError(data.error ?? "Save failed"); }
//                     else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
//                   } catch { setSaveError("Network error"); }
//                   setSaving(false);
//                 }}
//                 disabled={saving}
//                 className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
//                   saved
//                     ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
//                     : "text-white/70 hover:text-white border-white/20 hover:border-white/40 hover:bg-white/5"
//                 }`}
//               >
//                 {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
//                 {saving ? "Saving…" : saved ? "Saved!" : "Save to Workspace"}
//               </button>
//             )}
//             <button onClick={onReset}
//               className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
//               <RefreshCw className="w-3.5 h-3.5" />New
//             </button>
//           </div>
//           {saveError && (
//             <p className="text-xs text-red-400 mt-1">{saveError}</p>
//           )}
//         </div>

//         {/* Score rings */}
//         <div className="flex items-center justify-between flex-wrap gap-4">
//           <ScoreRing score={analysis.atsScore}       label="ATS"        color="#f59e0b" />
//           <ScoreRing score={analysis.languageScore}  label="Language"   color="#10b981" />
//           <ScoreRing score={analysis.structureScore} label="Structure"  color="#8b5cf6" />
//           {hasJD && <>
//             <ScoreRing score={analysis.jobMatchScore}  label="Job Match"  color="#3b82f6" />
//             <ScoreRing score={analysis.keywordScore}   label="Keywords"   color="#ec4899" />
//           </>}
//         </div>
//       </div>

//       {/* Executive summary */}
//       <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-5">
//         <div className="flex items-start gap-3">
//           <Lightbulb className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
//           <div>
//             <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-1.5">AI Assessment</p>
//             <p className="text-sm text-emerald-900 leading-relaxed">{analysis.executiveSummary}</p>
//           </div>
//         </div>
//       </div>

//       {/* Success prediction */}
//       {analysis.successPrediction && (
//         <div className={`border rounded-sm p-4 ${
//           analysis.successPrediction.shortlistLikelihood === "High" ? "bg-green-50 border-green-200" :
//           analysis.successPrediction.shortlistLikelihood === "Medium" ? "bg-amber-50 border-amber-200" :
//           "bg-red-50 border-red-200"
//         }`}>
//           <div className="flex items-center justify-between mb-2">
//             <p className="text-xs font-black uppercase tracking-wider" style={{ color: LIKELIHOOD_COLOR[analysis.successPrediction.shortlistLikelihood] }}>
//               Shortlist Likelihood: {analysis.successPrediction.shortlistLikelihood}
//             </p>
//             <span className="text-sm font-black" style={{ color: LIKELIHOOD_COLOR[analysis.successPrediction.shortlistLikelihood] }}>
//               {analysis.successPrediction.confidencePercent}%
//             </span>
//           </div>
//           <p className="text-xs text-stone-600 mb-2">{analysis.successPrediction.reason}</p>
//           <div className="flex items-start gap-2 bg-white/60 rounded-sm px-3 py-2">
//             <Target className="w-3.5 h-3.5 text-stone-500 flex-shrink-0 mt-0.5" />
//             <p className="text-xs font-semibold text-stone-700"><span className="text-stone-500">Top action: </span>{analysis.successPrediction.topAction}</p>
//           </div>
//         </div>
//       )}

//       {/* Tabs */}
//       <div className="flex gap-0.5 border-b border-stone-100 overflow-x-auto">
//         {TABS.map((t) => (
//           <button key={t.id} onClick={() => setActiveTab(t.id)}
//             className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
//               activeTab === t.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-stone-400 hover:text-stone-700"
//             }`}>
//             <t.icon className="w-3.5 h-3.5" />{t.label}
//           </button>
//         ))}
//       </div>

//       {/* ── OVERVIEW tab ──────────────────────────────────────────────── */}
//       {activeTab === "overview" && (
//         <div className="space-y-4">
//           {/* Top improvements */}
//           <div>
//             <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Top {analysis.topImprovements.length} Priority Improvements</p>
//             <div className="space-y-2">
//               {analysis.topImprovements
//                 .sort((a, b) => a.priority - b.priority)
//                 .map((imp) => (
//                   <div key={imp.priority} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
//                     <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
//                       {imp.priority}
//                     </span>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm text-stone-700">{imp.improvement}</p>
//                       <div className="flex items-center gap-2 mt-1.5">
//                         <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: IMPACT_COLOR[imp.impact], backgroundColor: `${IMPACT_COLOR[imp.impact]}15` }}>
//                           {imp.impact} impact
//                         </span>
//                         <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: EFFORT_COLOR[imp.effort], backgroundColor: `${EFFORT_COLOR[imp.effort]}15` }}>
//                           {imp.effort}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </div>

//           {/* Score bars */}
//           <div className="bg-white border border-stone-100 rounded-sm p-5">
//             <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Score Breakdown</p>
//             <div className="space-y-3">
//               {[
//                 { label: "ATS Compatibility", score: analysis.atsScore,       color: "#f59e0b" },
//                 { label: "Language & Impact", score: analysis.languageScore,  color: "#10b981" },
//                 { label: "Structure & Format",score: analysis.structureScore, color: "#8b5cf6" },
//                 ...(hasJD ? [
//                   { label: "Job Match",       score: analysis.jobMatchScore,  color: "#3b82f6" },
//                   { label: "Keyword Alignment",score: analysis.keywordScore,  color: "#ec4899" },
//                 ] : []),
//               ].map((s) => (
//                 <div key={s.label}>
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="text-xs font-semibold text-stone-600">{s.label}</span>
//                     <span className="text-xs font-black" style={{ color: s.color }}>{s.score}/100</span>
//                   </div>
//                   <AnimatedBar score={s.score} color={s.color} />
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* ATS issues */}
//           {analysis.atsIssues?.length > 0 && (
//             <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
//               <div className="flex items-center gap-2 mb-3">
//                 <Shield className="w-4 h-4 text-amber-500" />
//                 <p className="text-xs font-black text-amber-700 uppercase tracking-wider">ATS Issues Found</p>
//               </div>
//               <ul className="space-y-1.5">
//                 {analysis.atsIssues.map((issue, i) => (
//                   <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
//                     <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />{issue}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Rewrite actions */}
//           <div className="bg-stone-50 border border-stone-200 rounded-sm p-5">
//             <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">AI Rewrite Tools</p>
//             <div className="flex flex-wrap gap-2">
//               {[
//                 { mode: "improve",       label: "Improve Language",   color: "#10b981", icon: Zap      },
//                 { mode: "full_rewrite",  label: "Full CV Rewrite",    color: "#3b82f6", icon: RefreshCw },
//                 ...(hasJD ? [{ mode: "tailor", label: "Tailor to This Job", color: "#8b5cf6", icon: Target }] : []),
//               ].map((action) => (
//                 <button key={action.mode} onClick={() => handleRewrite(action.mode as any)}
//                   disabled={rewriting}
//                   className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-sm border transition-colors disabled:opacity-50"
//                   style={{ color: action.color, borderColor: `${action.color}40`, backgroundColor: `${action.color}08` }}>
//                   {rewriting && rewriteMode === action.mode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <action.icon className="w-3.5 h-3.5" />}
//                   {action.label}
//                 </button>
//               ))}
//             </div>

//             {rewriting && (
//               <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
//                 <Loader2 className="w-3.5 h-3.5 animate-spin" />Generating your improved CV…
//               </div>
//             )}

//             {rewriteResult && !rewriting && (
//               <div className="mt-4 border border-stone-200 rounded-sm overflow-hidden">
//                 <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-100">
//                   <span className="text-xs font-bold text-stone-600">Rewritten CV</span>
//                   <div className="flex gap-2">
//                     <button onClick={() => { navigator.clipboard.writeText(rewriteResult); }}
//                       className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors">
//                       <Copy className="w-3 h-3" />Copy
//                     </button>
//                     <button onClick={() => setRewriteResult("")} className="text-stone-300 hover:text-stone-600">
//                       <X className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//                 <div className="p-4 max-h-96 overflow-y-auto">
//                   <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{rewriteResult}</pre>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* ── KEYWORDS tab ──────────────────────────────────────────────── */}
//       {activeTab === "keywords" && (
//         <div className="space-y-4">
//           {hasJD ? (
//             <>
//               {/* Missing keywords — most important */}
//               {analysis.keywordGap?.missing?.length > 0 && (
//                 <div className="bg-red-50 border border-red-200 rounded-sm p-5">
//                   <div className="flex items-center gap-2 mb-3">
//                     <XCircle className="w-4 h-4 text-red-500" />
//                     <p className="text-xs font-black text-red-700 uppercase tracking-wider">
//                       Missing Keywords ({analysis.keywordGap.missing.length})
//                     </p>
//                   </div>
//                   <p className="text-xs text-red-600 mb-3">These keywords from the JD are absent from your CV — add them naturally to improve your score.</p>
//                   <div className="flex flex-wrap gap-2">
//                     {analysis.keywordGap.missing.map((kw) => (
//                       <span key={kw} className="text-xs font-bold text-red-700 bg-white border border-red-300 px-3 py-1.5 rounded-sm flex items-center gap-1">
//                         <Plus className="w-3 h-3" />{kw}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Present keywords */}
//               {analysis.keywordGap?.present?.length > 0 && (
//                 <div className="bg-green-50 border border-green-200 rounded-sm p-5">
//                   <div className="flex items-center gap-2 mb-3">
//                     <CheckCircle2 className="w-4 h-4 text-green-500" />
//                     <p className="text-xs font-black text-green-700 uppercase tracking-wider">
//                       Matching Keywords ({analysis.keywordGap.present.length})
//                     </p>
//                   </div>
//                   <div className="flex flex-wrap gap-2">
//                     {analysis.keywordGap.present.map((kw) => (
//                       <span key={kw} className="text-xs font-semibold text-green-700 bg-white border border-green-300 px-3 py-1.5 rounded-sm flex items-center gap-1">
//                         <Check className="w-3 h-3" />{kw}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="bg-amber-50 border border-amber-200 rounded-sm p-5">
//               <div className="flex items-start gap-3">
//                 <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm font-bold text-amber-800">Paste a job description for keyword analysis</p>
//                   <p className="text-xs text-amber-700 mt-1 leading-relaxed">
//                     The keyword gap feature compares your CV against a specific job description. Go back and add the JD to unlock this.
//                   </p>
//                   <button onClick={onReset}
//                     className="mt-3 text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-sm transition-colors">
//                     Add Job Description
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Suggested keywords (always show) */}
//           {analysis.keywordGap?.suggested?.length > 0 && (
//             <div className="bg-blue-50 border border-blue-200 rounded-sm p-5">
//               <div className="flex items-center gap-2 mb-3">
//                 <Lightbulb className="w-4 h-4 text-blue-500" />
//                 <p className="text-xs font-black text-blue-700 uppercase tracking-wider">
//                   Suggested Keywords ({analysis.keywordGap.suggested.length})
//                 </p>
//               </div>
//               <p className="text-xs text-blue-600 mb-3">These keywords would strengthen your CV for this type of role.</p>
//               <div className="flex flex-wrap gap-2">
//                 {analysis.keywordGap.suggested.map((kw) => (
//                   <span key={kw} className="text-xs font-semibold text-blue-700 bg-white border border-blue-300 px-3 py-1.5 rounded-sm">
//                     {kw}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── SECTIONS tab ──────────────────────────────────────────────── */}
//       {activeTab === "sections" && (
//         <div className="space-y-3">
//           {analysis.sectionFeedback?.map((sf) => {
//             const cfg  = STATUS_CFG[sf.status] ?? STATUS_CFG["Needs Work"];
//             const Icon = cfg.icon;
//             return (
//               <div key={sf.section} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
//                 <div className="flex items-center gap-3 px-5 py-4">
//                   <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-3 flex-wrap">
//                       <p className="text-sm font-bold text-stone-800">{sf.section}</p>
//                       <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm"
//                         style={{ color: cfg.color, backgroundColor: cfg.bg }}>
//                         {sf.status}
//                       </span>
//                       <span className="text-xs font-black ml-auto" style={{ color: scoreColor(sf.score) }}>{sf.score}/100</span>
//                     </div>
//                     <AnimatedBar score={sf.score} color={cfg.color} />
//                   </div>
//                 </div>
//                 <div className="px-5 pb-4 border-t border-stone-50">
//                   <p className="text-sm text-stone-600 leading-relaxed mt-3">{sf.feedback}</p>
//                   {sf.quickWin && (
//                     <div className="flex items-start gap-2 mt-3 bg-stone-50 border border-stone-100 rounded-sm px-3 py-2.5">
//                       <Zap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
//                       <p className="text-xs font-semibold text-stone-600">
//                         <span className="text-emerald-600">Quick win: </span>{sf.quickWin}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* ── REWRITES tab ──────────────────────────────────────────────── */}
//       {activeTab === "rewrites" && (
//         <div className="space-y-5">
//           {/* Bullet rewrites */}
//           {analysis.bulletRewrites?.length > 0 && (
//             <div>
//               <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">
//                 Bullet Point Rewrites ({analysis.bulletRewrites.length})
//               </p>
//               <div className="space-y-4">
//                 {analysis.bulletRewrites.map((br, i) => (
//                   <div key={i} className="border border-stone-100 rounded-sm overflow-hidden">
//                     <div className="grid grid-cols-2 gap-0">
//                       <div className="bg-red-50 border-r border-stone-100 px-4 py-3">
//                         <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1.5">Before</p>
//                         <p className="text-xs text-red-700 leading-relaxed line-through">{br.original}</p>
//                       </div>
//                       <div className="bg-green-50 px-4 py-3 relative">
//                         <p className="text-[10px] font-black text-green-500 uppercase tracking-wider mb-1.5">After</p>
//                         <p className="text-xs text-green-800 leading-relaxed font-medium">{br.improved}</p>
//                         <button onClick={() => navigator.clipboard.writeText(br.improved)}
//                           className="absolute top-2 right-2 text-green-400 hover:text-green-700 transition-colors">
//                           <Copy className="w-3 h-3" />
//                         </button>
//                       </div>
//                     </div>
//                     {br.why && (
//                       <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100">
//                         <p className="text-[11px] text-stone-500"><span className="font-semibold">Why: </span>{br.why}</p>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Language issues */}
//           {analysis.languageIssues?.length > 0 && (
//             <div>
//               <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">
//                 Language Issues ({analysis.languageIssues.length})
//               </p>
//               <div className="space-y-2">
//                 {analysis.languageIssues.map((li, i) => (
//                   <div key={i} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2 flex-wrap mb-1">
//                         <span className="text-xs font-semibold text-red-600 line-through">{li.weak}</span>
//                         <ArrowRight className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
//                         <span className="text-xs font-bold text-emerald-700">{li.stronger}</span>
//                       </div>
//                       <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{li.category}</span>
//                     </div>
//                     <button onClick={() => navigator.clipboard.writeText(li.stronger)}
//                       className="text-stone-300 hover:text-stone-600 flex-shrink-0 transition-colors">
//                       <Copy className="w-3.5 h-3.5" />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── INTERVIEW tab ─────────────────────────────────────────────── */}
//       {activeTab === "interview" && (
//         <InterviewTab questions={analysis.interviewQuestions ?? []} hasJD={hasJD} />
//       )}

//       {/* ── COVER LETTER tab ──────────────────────────────────────────── */}
//       {activeTab === "cover-letter" && (
//         <div className="space-y-5">
//           {!hasJD && (
//             <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3.5">
//               <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
//               <div>
//                 <p className="text-sm font-bold text-amber-800">Job description recommended</p>
//                 <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
//                   A cover letter without a JD will be generic. Go back and add the job description for a tailored letter.
//                 </p>
//                 <button onClick={onReset} className="mt-2 text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-sm transition-colors">
//                   Add Job Description
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Style selector */}
//           <div>
//             <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Cover Letter Style</label>
//             <div className="flex gap-2">
//               {([
//                 { id: "professional", label: "Professional",  desc: "Formal, structured, traditional"     },
//                 { id: "creative",     label: "Creative",       desc: "Engaging, personality-led, modern"   },
//                 { id: "concise",      label: "Concise",        desc: "Short, punchy, 3 paragraphs max"     },
//               ] as const).map((s) => (
//                 <button key={s.id} onClick={() => setClStyle(s.id)}
//                   title={s.desc}
//                   className={`flex-1 text-xs font-bold py-2.5 px-3 rounded-sm border transition-colors text-center ${
//                     clStyle === s.id ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
//                   }`}>
//                   {s.label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Generate button */}
//           <button
//             onClick={async () => {
//               setClLoading(true); setClResult("");
//               try {
//                 const res  = await fetch("/api/tools/cv-analyser/cover-letter", {
//                   method: "POST",
//                   headers: { "Content-Type": "application/json" },
//                   body: JSON.stringify({ cvText, jobDescription: jdText, style: clStyle }),
//                 });
//                 const data = await res.json();
//                 setClResult(data.coverLetter ?? data.error ?? "Generation failed");
//               } catch { setClResult("Network error — please try again."); }
//               setClLoading(false);
//             }}
//             disabled={clLoading}
//             className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 py-3 rounded-sm transition-colors disabled:opacity-60 shadow-sm"
//           >
//             {clLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
//             {clLoading ? "Generating your cover letter…" : `Generate ${clStyle.charAt(0).toUpperCase() + clStyle.slice(1)} Cover Letter`}
//           </button>

//           {/* Loading indicator */}
//           {clLoading && (
//             <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3">
//               <Loader2 className="w-4 h-4 text-emerald-500 animate-spin flex-shrink-0" />
//               <p className="text-xs text-emerald-700">Writing your personalised cover letter… (~10 seconds)</p>
//             </div>
//           )}

//           {/* Result */}
//           {clResult && !clLoading && (
//             <div className="border border-stone-200 rounded-sm overflow-hidden">
//               <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
//                 <p className="text-xs font-bold text-stone-600">Your Cover Letter</p>
//                 <div className="flex gap-2">
//                   <button onClick={() => navigator.clipboard.writeText(clResult)}
//                     className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
//                     <Copy className="w-3 h-3" />Copy
//                   </button>
//                   <button onClick={() => {
//                     const blob = new Blob([clResult], { type: "text/plain" });
//                     const url  = URL.createObjectURL(blob);
//                     const a    = document.createElement("a"); a.href = url; a.download = "cover-letter.txt"; a.click();
//                     URL.revokeObjectURL(url);
//                   }} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1.5 rounded-sm transition-colors">
//                     <Download className="w-3 h-3" />Download
//                   </button>
//                   <button onClick={() => setClResult("")} className="text-stone-300 hover:text-stone-600">
//                     <X className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//               <div className="p-5">
//                 <pre className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed font-sans">{clResult}</pre>
//               </div>
//               <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
//                 <p className="text-[11px] text-amber-700 leading-relaxed">
//                   <span className="font-bold">Important:</span> This is a starting point. Always personalise it — add specific company research, adjust the tone to match the company culture, and make it unmistakably you.
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* What makes a great cover letter */}
//           <div className="bg-stone-50 border border-stone-100 rounded-sm p-5">
//             <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">What makes a great cover letter</p>
//             <div className="grid grid-cols-2 gap-3">
//               {[
//                 { label: "Opening hook",   desc: "Start with a specific, compelling reason why you want this role — not 'I am writing to apply for...'" },
//                 { label: "Relevant wins",  desc: "Pick 2-3 achievements that directly match what the JD asks for. Quantify them." },
//                 { label: "Company knowledge", desc: "Show you've researched them. Reference something specific — a product, initiative, or value." },
//                 { label: "Clear close",    desc: "End with confidence: request an interview, don't beg for one." },
//               ].map((tip) => (
//                 <div key={tip.label} className="bg-white border border-stone-100 rounded-sm p-3">
//                   <p className="text-xs font-bold text-stone-700 mb-1">{tip.label}</p>
//                   <p className="text-[11px] text-stone-500 leading-snug">{tip.desc}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

// export function CVAnalyserTool({ isSignedIn = false }: { isSignedIn?: boolean }) {
//   const [stage,    setStage]    = useState<"input" | "loading" | "results">("input");
//   const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
//   const [cvText,   setCvText]   = useState("");
//   const [jdText,   setJdText]   = useState("");
//   const [error,    setError]    = useState("");
//   const [loadStep, setLoadStep] = useState(0);

//   const LOAD_STEPS = [
//     "Reading your CV…",
//     "Checking ATS compatibility…",
//     "Analysing keyword gaps…",
//     "Reviewing each section…",
//     "Generating improvement suggestions…",
//     "Preparing interview questions…",
//   ];

//   const handleAnalyse = async (cv: string, jd: string, mode: string) => {
//     setCvText(cv); setJdText(jd);
//     setStage("loading"); setError(""); setLoadStep(0);

//     // Cycle through loading steps
//     const interval = setInterval(() => setLoadStep((p) => Math.min(p + 1, LOAD_STEPS.length - 1)), 1400);

//     try {
//       const res  = await fetch("/api/tools/cv-analyser/analyse", {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ cvText: cv, jobDescription: jd, roleMode: mode }),
//       });
//       const data = await res.json();
//       clearInterval(interval);
//       if (!res.ok || !data.analysis) {
//         setError(data.error ?? "Analysis failed — please try again.");
//         setStage("input");
//         return;
//       }
//       setAnalysis(data.analysis);
//       setStage("results");
//     } catch {
//       clearInterval(interval);
//       setError("Network error — please check your connection and try again.");
//       setStage("input");
//     }
//   };

//   return (
//     <div className="space-y-0" style={{ fontFamily: "Sora, sans-serif" }}>
//       {/* Loading state */}
//       {stage === "loading" && (
//         <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
//           <div className="relative w-20 h-20">
//             <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
//             <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
//             <div className="absolute inset-0 flex items-center justify-center text-2xl">📄</div>
//           </div>
//           <div>
//             <AnimatePresence mode="wait">
//               <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
//                 className="text-sm font-semibold text-stone-600">
//                 {LOAD_STEPS[loadStep]}
//               </motion.p>
//             </AnimatePresence>
//             <p className="text-xs text-stone-400 mt-1">Comprehensive analysis in progress…</p>
//           </div>
//           <div className="flex gap-1.5">
//             {LOAD_STEPS.map((_, i) => (
//               <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-emerald-400" : "bg-stone-200"}`} />
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Error */}
//       {error && stage === "input" && (
//         <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm mb-4">
//           <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
//           <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
//         </div>
//       )}

//       {stage === "input"   && <InputStage onAnalyse={handleAnalyse} />}
//       {stage === "results" && analysis && (
//         <ResultsStage
//           analysis={analysis} cvText={cvText} jdText={jdText}
//           onReset={() => { setStage("input"); setAnalysis(null); }}
//           onRewrite={() => {}}
//           isSignedIn={isSignedIn}
//         />
//       )}
//     </div>
//   );
// }


