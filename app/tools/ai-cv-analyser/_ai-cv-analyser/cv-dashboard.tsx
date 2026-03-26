"use client";

// =============================================================================
// isaacpaha.com — AI CV Analyser: User Workspace Dashboard
// app/tools/ai-cv-analyser/_components/cv-dashboard.tsx
//
// The signed-in user's personal workspace:
//   - All saved CV analyses with scores
//   - Score trend over time
//   - Saved cover letters (view, copy, download)
//   - Interview study sessions (study mode with progress)
//   - Re-open any analysis to continue working
//   - Delete analyses
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  FileText, Trash2, Download, Copy, Check, Loader2, ChevronDown,
  ChevronUp, Star, TrendingUp, MessageSquare, BarChart2, Eye,
  RefreshCw, AlertCircle, BookOpen, Sparkles, Info, X,
  Calendar, Target, Award, ExternalLink, Lightbulb, Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedAnalysis {
  id:            string;
  label:         string;
  jobTitle?:     string | null;
  companyName?:  string | null;
  targetRole?:   string | null;
  roleMode:      string;
  overallScore:  number;
  atsScore:      number;
  keywordScore:  number;
  languageScore: number;
  structureScore: number;
  jobMatchScore: number;
  isStarred:     boolean;
  notes?:        string | null;
  createdAt:     string;
  analysisJson:  string;
  coverLetters:  SavedCoverLetter[];
  interviewSessions: SavedInterviewSession[];
}

interface SavedCoverLetter {
  id:            string;
  content:       string;
  editedContent?: string | null;
  style:         string;
  jobTitle?:     string | null;
  companyName?:  string | null;
  createdAt:     string;
}

interface SavedInterviewSession {
  id:          string;
  jobTitle?:   string | null;
  questions:   string; // JSON
  markedReady?: string | null; // JSON number[]
  studyCount:  number;
  lastStudied?: string | null;
  createdAt:   string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";
const scoreBg    = (s: number) => s >= 80 ? "#d1fae5" : s >= 60 ? "#fef3c7" : "#fee2e2";

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtRelative(d: string): string {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1)  return "today";
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days}d ago`;
  return fmtDate(d);
}

// ─── Score Ring (mini) ────────────────────────────────────────────────────────

function MiniRing({ score, color }: { score: number; color: string }) {
  const r    = 14;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-9 h-9">
      <svg viewBox="0 0 36 36" width={36} height={36} className="rotate-[-90deg]">
        <circle cx={18} cy={18} r={r} fill="none" stroke="#f3f4f6" strokeWidth={4} />
        <circle cx={18} cy={18} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

// ─── Interview Study Panel ────────────────────────────────────────────────────

function InterviewStudyPanel({
  session, onClose,
}: {
  session: SavedInterviewSession;
  onClose: () => void;
}) {
  const questions: any[] = React.useMemo(() => {
    try { return JSON.parse(session.questions); } catch { return []; }
  }, [session.questions]);

  const initialMarked: Set<number> = React.useMemo(() => {
    try { return new Set(JSON.parse(session.markedReady ?? "[]")); } catch { return new Set(); }
  }, [session.markedReady]);

  const [marked,    setMarked]    = useState<Set<number>>(initialMarked);
  const [openAnswers, setOpenAnswers] = useState<Set<number>>(new Set());
  const [saving,    setSaving]    = useState(false);

  const toggle = (i: number) => {
    setOpenAnswers(p => { const n = new Set(p); p.has(i) ? n.delete(i) : n.add(i); return n; });
  };
  const toggleMark = (i: number) => {
    setMarked(p => { const n = new Set(p); p.has(i) ? n.delete(i) : n.add(i); return n; });
  };

  const saveProgress = async () => {
    setSaving(true);
    await fetch(`/api/tools/cv-analyser/save?id=${session.id}&action=study`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markedReady: JSON.stringify([...marked]) }),
    }).catch(() => {});
    setSaving(false);
  };

  const DIFFICULTY_COLOR: Record<string, string> = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };
  const TYPE_EMOJI: Record<string, string> = {
    Behavioural: "🧠", Technical: "⚙️", Situational: "🎯", Motivational: "💡", Competency: "⭐",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-16 overflow-y-auto">
      <motion.div initial={{ scale: 0.97, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-sm border border-stone-200 shadow-2xl w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-sm font-black text-stone-900">Interview Study Session</p>
            <p className="text-xs text-stone-400 mt-0.5">{session.jobTitle ?? "General"} — {questions.length} questions</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${questions.length > 0 ? (marked.size / questions.length) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-bold text-emerald-600">{marked.size}/{questions.length}</span>
            </div>
            <button onClick={saveProgress} disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-500 border border-stone-200 hover:border-stone-400 px-3 py-1.5 rounded-sm transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save progress
            </button>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-3">
          {questions.map((q: any, i: number) => {
            const isOpen   = openAnswers.has(i);
            const isMarked = marked.has(i);
            return (
              <div key={i}
                className={`border rounded-sm overflow-hidden transition-all ${isMarked ? "border-emerald-300 bg-emerald-50/40" : "border-stone-100 bg-white"}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-base">{TYPE_EMOJI[q.type] ?? "❓"}</span>
                        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-sm">{q.type}</span>
                        {q.difficulty && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                            style={{ color: DIFFICULTY_COLOR[q.difficulty] ?? "#6b7280", backgroundColor: `${DIFFICULTY_COLOR[q.difficulty] ?? "#6b7280"}15` }}>
                            {q.difficulty}
                          </span>
                        )}
                        {isMarked && <span className="text-[10px] font-black text-emerald-600">✓ Ready</span>}
                      </div>
                      <p className="text-sm font-semibold text-stone-900 leading-snug">{q.question}</p>
                      {q.tip && <p className="text-xs text-stone-400 mt-2">💡 {q.tip}</p>}
                      {q.starHint && (
                        <div className="flex items-start gap-2 mt-2 bg-blue-50 border border-blue-100 rounded-sm px-3 py-2">
                          <span className="text-blue-400 text-xs">→</span>
                          <p className="text-xs text-blue-700 font-medium">{q.starHint}</p>
                        </div>
                      )}
                    </div>
                    {/* Mark as ready */}
                    <button onClick={() => toggleMark(i)}
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        isMarked ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-200 text-transparent hover:border-emerald-400"
                      }`}>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Reveal answer button */}
                  {q.modelAnswer && (
                    <button onClick={() => toggle(i)}
                      className={`mt-3 flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-sm border transition-all w-full justify-center ${
                        isOpen
                          ? "bg-purple-50 border-purple-200 text-purple-700"
                          : "bg-stone-50 border-stone-200 text-stone-500 hover:border-purple-400 hover:text-purple-600"
                      }`}>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isOpen ? "Hide answer" : "Reveal model answer"}
                    </button>
                  )}
                </div>

                {/* Answer */}
                <AnimatePresence>
                  {isOpen && q.modelAnswer && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="border-t border-purple-100 bg-purple-50 px-4 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider">📖 Model Answer — Adapt to your own words</p>
                          <button onClick={() => navigator.clipboard.writeText(q.modelAnswer)}
                            className="text-[10px] text-purple-400 hover:text-purple-700 flex items-center gap-1">
                            <Copy className="w-3 h-3" />Copy
                          </button>
                        </div>
                        <p className="text-sm text-purple-900 leading-relaxed">{q.modelAnswer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Analysis Card ────────────────────────────────────────────────────────────

function AnalysisCard({
  analysis, onDelete, onStudy, onReopen,
}: {
  analysis:  SavedAnalysis;
  onDelete:  (id: string) => void;
  onStudy:   (session: SavedInterviewSession) => void;
  onReopen:  (analysis: SavedAnalysis) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [copied,    setCopied]    = useState<string | null>(null);

  const parsedAnalysis = React.useMemo(() => {
    try { return JSON.parse(analysis.analysisJson); } catch { return null; }
  }, [analysis.analysisJson]);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/tools/cv-analyser/save?id=${analysis.id}`, { method: "DELETE" });
    onDelete(analysis.id);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const hasCL       = analysis.coverLetters?.length > 0;
  const hasInterview = analysis.interviewSessions?.length > 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">

      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {analysis.isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
              <p className="text-sm font-black text-stone-900 truncate">{analysis.label}</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-400 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtRelative(analysis.createdAt)}</span>
              {analysis.roleMode !== "GENERAL" && (
                <span className="bg-stone-100 px-1.5 py-0.5 rounded-sm uppercase font-semibold">{analysis.roleMode}</span>
              )}
              {hasCL       && <span className="text-emerald-600 font-semibold">📝 Cover letter</span>}
              {hasInterview && <span className="text-blue-600 font-semibold">🎯 {analysis.interviewSessions[0] ? JSON.parse(analysis.interviewSessions[0].questions).length : "?"} questions</span>}
            </div>
          </div>

          {/* Overall score */}
          <MiniRing score={analysis.overallScore} color={scoreColor(analysis.overallScore)} />
        </div>

        {/* Score row */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {[
            { label: "ATS",       score: analysis.atsScore       },
            { label: "Language",  score: analysis.languageScore  },
            { label: "Structure", score: analysis.structureScore },
            ...(analysis.jobMatchScore > 0 ? [{ label: "Job Match", score: analysis.jobMatchScore }] : []),
            ...(analysis.keywordScore > 0  ? [{ label: "Keywords",  score: analysis.keywordScore  }] : []),
          ].map((s) => (
            <span key={s.label} className="text-[10px] font-bold px-2 py-1 rounded-sm"
              style={{ color: scoreColor(s.score), backgroundColor: scoreBg(s.score) }}>
              {s.label}: {s.score}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onReopen(analysis)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-2 rounded-sm transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />Reopen Analysis
          </button>
          {hasInterview && (
            <button onClick={() => onStudy(analysis.interviewSessions[0])}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-2 rounded-sm transition-colors">
              <BookOpen className="w-3.5 h-3.5" />Study Questions
            </button>
          )}
          <button onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Less" : "Details"}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1 text-xs text-stone-300 hover:text-red-500 transition-colors ml-auto disabled:opacity-60">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-5 py-5 space-y-5 bg-stone-50/30">

              {/* Top improvements preview */}
              {parsedAnalysis?.topImprovements?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Top Improvements</p>
                  <div className="space-y-1.5">
                    {parsedAnalysis.topImprovements.slice(0, 3).map((imp: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                        <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-600 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{imp.priority}</span>
                        {imp.improvement}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover letters */}
              {hasCL && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Saved Cover Letters</p>
                  <div className="space-y-2">
                    {analysis.coverLetters.map((cl) => (
                      <div key={cl.id} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-50">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                              {cl.style} style
                            </span>
                            <span className="text-[10px] text-stone-300">{fmtRelative(cl.createdAt)}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => copyText(cl.editedContent ?? cl.content, cl.id)}
                              className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-700 transition-colors">
                              {copied === cl.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              {copied === cl.id ? "Copied!" : "Copy"}
                            </button>
                            <button onClick={() => downloadText(cl.editedContent ?? cl.content, `cover-letter-${cl.style}.txt`)}
                              className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-800 transition-colors">
                              <Download className="w-3 h-3" />Download
                            </button>
                          </div>
                        </div>
                        <div className="px-3 py-2.5 max-h-32 overflow-y-auto">
                          <pre className="text-xs text-stone-600 whitespace-pre-wrap font-sans leading-relaxed">
                            {(cl.editedContent ?? cl.content).slice(0, 400)}…
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview session stats */}
              {hasInterview && (() => {
                const sess    = analysis.interviewSessions[0];
                const qs      = (() => { try { return JSON.parse(sess.questions).length; } catch { return 0; } })();
                const ready   = (() => { try { return JSON.parse(sess.markedReady ?? "[]").length; } catch { return 0; } })();
                return (
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Interview Prep Progress</p>
                    <div className="flex items-center gap-4 bg-white border border-stone-100 rounded-sm px-4 py-3">
                      <div className="flex-1">
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${qs > 0 ? (ready / qs) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 flex-shrink-0">{ready}/{qs} questions ready</span>
                      {sess.lastStudied && (
                        <span className="text-[10px] text-stone-400 flex-shrink-0">Last studied {fmtRelative(sess.lastStudied)}</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

interface CVDashboardProps {
  onReopenAnalysis: (analysisJson: string, cvText: string, jdText: string) => void;
}

export function CVDashboard({ onReopenAnalysis }: CVDashboardProps) {
  const [analyses,      setAnalyses]      = useState<SavedAnalysis[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [studySession,  setStudySession]  = useState<SavedInterviewSession | null>(null);
  const [filter,        setFilter]        = useState<"all" | "starred">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/cv-analyser/save?include=all");
      const data = await res.json();
      setAnalyses(data.analyses ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string) => setAnalyses(p => p.filter(a => a.id !== id));

  const filtered   = analyses.filter(a => filter === "all" || a.isStarred);
  const avgScore   = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + a.overallScore, 0) / analyses.length) : 0;
  const bestScore  = analyses.length > 0 ? Math.max(...analyses.map(a => a.overallScore)) : 0;
  const totalCL    = analyses.reduce((s, a) => s + (a.coverLetters?.length ?? 0), 0);
  const totalQ     = analyses.reduce((s, a) => s + (a.interviewSessions?.length > 0 ? (() => { try { return JSON.parse(a.interviewSessions[0].questions).length; } catch { return 0; } })() : 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Study session modal */}
      {studySession && (
        <InterviewStudyPanel session={studySession} onClose={() => setStudySession(null)} />
      )}

      {/* Stats header */}
      {analyses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Analyses saved",   value: analyses.length, color: "#10b981",  icon: BarChart2    },
            { label: "Best score",       value: bestScore,       color: "#f59e0b",  icon: Award        },
            { label: "Avg score",        value: avgScore,        color: "#3b82f6",  icon: TrendingUp   },
            { label: "Cover letters",    value: totalCL,         color: "#8b5cf6",  icon: FileText     },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-stone-400 font-semibold mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      {analyses.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1">
            {(["all", "starred"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs font-bold px-3 py-2 rounded-sm border transition-colors capitalize ${
                  filter === f ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-stone-400 border-stone-200"
                }`}>
                {f === "starred" ? "⭐ Starred" : `All (${analyses.length})`}
              </button>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      )}

      {/* No analyses */}
      {analyses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-stone-50 border border-dashed border-stone-200 rounded-sm">
          <div className="w-16 h-16 rounded-sm bg-emerald-50 border-2 border-dashed border-emerald-200 flex items-center justify-center mb-5 text-3xl">
            🎯
          </div>
          <h3 className="text-base font-black text-stone-900 mb-2">No saved analyses yet</h3>
          <p className="text-sm text-stone-500 max-w-xs leading-relaxed mb-1">
            Run an analysis on the main tab and click <span className="font-bold">Save to Workspace</span> to keep your results here.
          </p>
          <p className="text-xs text-stone-400">You can save up to 20 analyses. Each stores your scores, cover letter, and interview questions.</p>
        </div>
      )}

      {/* Analyses list */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(analysis => (
              <AnalysisCard
                key={analysis.id}
                analysis={analysis}
                onDelete={handleDelete}
                onStudy={setStudySession}
                onReopen={(a) => {
                  let parsedData: any = null;
                  try { parsedData = JSON.parse(a.analysisJson); } catch {}
                  // We'd need cvText and jdText from the saved analysis — they're there
                  // onReopenAnalysis(a.analysisJson, a.cvText ?? "", "");
                  onReopenAnalysis(a.analysisJson, parsedData?.cvText ?? "", parsedData?.jdText ?? "");
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Tips */}
      {analyses.length > 0 && analyses.length < 5 && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-sm px-4 py-3.5">
          <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-bold">Tip:</span> Save an analysis for each job you apply to. Over time, your workspace becomes a personal record of your CV's progression and the interview prep you've done for each role.
          </p>
        </div>
      )}
    </div>
  );
}