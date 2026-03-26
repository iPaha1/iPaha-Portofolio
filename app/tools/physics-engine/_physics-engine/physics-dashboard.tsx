"use client";

// =============================================================================
// isaacpaha.com — Physics Understanding Engine — User Workspace Dashboard
// app/tools/physics-engine/_components/physics-dashboard.tsx
//
// Personal workspace for signed-in users:
//   - Stats overview (topics studied, streak, XP, total explanations)
//   - Saved explanations list — reopenable, star, notes, delete
//   - Practice sessions with study progress (mark questions correct/attempted)
//   - Topic coverage map (which areas of physics studied most)
//   - Learning path suggestions based on studied topics
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                   from "framer-motion";
import {
  Atom, Trash2, Star, StarOff, Loader2, ChevronDown, ChevronUp,
  Check, X, RefreshCw, BookOpen, Sparkles, Flame, Zap, TrendingUp,
  BarChart2, Award, Target, Brain, AlertTriangle, CheckCircle2,
  FlaskConical, Lightbulb, Calendar, ChevronRight, Edit2, Save,
  ExternalLink, Layers, MessageSquare, History,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedQuery {
  id:                string;
  question:          string;
  level:             string;
  isExplorerMode:    boolean;
  topic?:            string | null;
  conceptName?:      string | null;
  difficulty?:       string | null;
  resultJson?:       string | null;
  hasVisualisation:  boolean;
  visualisationType?: string | null;
  isStarred:         boolean;
  notes?:            string | null;
  viewCount:         number;
  createdAt:         string;
  practiceSessions:  PracticeSession[];
}

interface PracticeSession {
  id:            string;
  sessionType:   string;
  questionsJson: string;
  attemptedIds?: string | null;
  correctIds?:   string | null;
  score?:        number | null;
  completedAt?:  string | null;
  createdAt:     string;
}

interface LearningProgress {
  topicsJson:       string;
  totalQueries:     number;
  totalPractice:    number;
  avgPracticeScore?: number | null;
  streakDays:       number;
  lastActivityDate?: string | null;
  xpPoints:         number;
}

const ACCENT = "#0ea5e9";

// ─── Utilities ────────────────────────────────────────────────────────────────

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

const LEVEL_LABEL: Record<string, string> = {
  GCSE:       "🇬🇧 GCSE",
  ALEVEL:     "🇬🇧 A-Level",
  UNIVERSITY: "🎓 University",
};

const VIZ_EMOJI: Record<string, string> = {
  WAVE:          "〰️",
  MOTION_GRAPH:  "📈",
  CIRCUIT:       "⚡",
  VECTOR:        "➡️",
  FUNCTION_GRAPH:"📊",
  GEOMETRIC:     "🔺",
  NONE:          "",
};

const TOPIC_COLORS: Record<string, string> = {
  "Mechanics":         "#0ea5e9",
  "Electromagnetism":  "#f59e0b",
  "Thermodynamics":    "#ef4444",
  "Waves":             "#10b981",
  "Nuclear Physics":   "#8b5cf6",
  "Quantum Physics":   "#ec4899",
  "Astrophysics":      "#6366f1",
  "Optics":            "#f97316",
};

// ─── Practice Study Card ──────────────────────────────────────────────────────

function PracticeStudyCard({ session, queryId }: { session: PracticeSession; queryId: string }) {
  const [open,       setOpen]       = useState(false);
  const [questions,  setQuestions]  = useState<any[]>([]);
  const [attempted,  setAttempted]  = useState<Set<number>>(new Set());
  const [correct,    setCorrect]    = useState<Set<number>>(new Set());
  const [openSols,   setOpenSols]   = useState<Set<number>>(new Set());
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    try { setQuestions(JSON.parse(session.questionsJson)); } catch {}
    try { setAttempted(new Set(JSON.parse(session.attemptedIds ?? "[]"))); } catch {}
    try { setCorrect(new Set(JSON.parse(session.correctIds ?? "[]"))); } catch {}
  }, [session]);

  const toggleSol = (i: number) =>
    setOpenSols(p => { const n = new Set(p); p.has(i) ? n.delete(i) : n.add(i); return n; });
  const markAttempted = (i: number) =>
    setAttempted(p => { const n = new Set(p); p.has(i) ? n.delete(i) : n.add(i); return n; });
  const markCorrect = (i: number) => {
    setCorrect(p => { const n = new Set(p); p.has(i) ? n.delete(i) : n.add(i); return n; });
    setAttempted(p => new Set([...p, i]));
  };

  const saveProgress = async () => {
    setSaving(true);
    const score = questions.length > 0 ? Math.round((correct.size / questions.length) * 100) : 0;
    await fetch(`/api/tools/physics-engine/save?id=${queryId}&action=study&sessionId=${session.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptedIds: JSON.stringify([...attempted]),
        correctIds:   JSON.stringify([...correct]),
        score,
      }),
    }).catch(() => {});
    setSaving(false);
  };

  const score       = questions.length > 0 ? Math.round((correct.size / questions.length) * 100) : 0;
  const isTheory    = session.sessionType === "theory_questions";
  const DIFF_COLOR: Record<string, string> = { Recall: "#10b981", Application: "#f59e0b", Analysis: "#ef4444", Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };

  return (
    <div className="border border-stone-100 rounded-sm overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors">
        <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${ACCENT}15` }}>
          {isTheory ? <BookOpen className="w-4 h-4" style={{ color: ACCENT }} /> : <FlaskConical className="w-4 h-4" style={{ color: ACCENT }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-stone-700">
            {isTheory ? "Theory Questions" : "Calculation Questions"} — {questions.length} questions
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden max-w-[80px]">
              <div className="h-full rounded-full transition-all" style={{ backgroundColor: ACCENT, width: `${score}%` }} />
            </div>
            <span className="text-[10px] text-stone-400 font-semibold">{correct.size}/{questions.length} correct</span>
            <span className="text-[10px] text-stone-300">{fmtRelative(session.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); saveProgress(); }} disabled={saving}
            className="flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2 py-1 rounded-sm transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 space-y-3">
              {questions.map((q: any, i: number) => (
                <div key={i}
                  className={`border rounded-sm overflow-hidden transition-colors ${correct.has(i) ? "border-emerald-200 bg-emerald-50/30" : attempted.has(i) ? "border-amber-200 bg-amber-50/20" : "border-stone-100 bg-white"}`}>
                  <div className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {(q.difficulty || q.type) && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                              style={{ color: DIFF_COLOR[q.difficulty ?? q.type] ?? "#6b7280", backgroundColor: `${DIFF_COLOR[q.difficulty ?? q.type] ?? "#6b7280"}15` }}>
                              {q.difficulty ?? q.type}
                            </span>
                          )}
                          {q.marks && <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">[{q.marks} mark{q.marks>1?"s":""}]</span>}
                        </div>
                        <p className="text-xs font-semibold text-stone-800 leading-snug">{q.question}</p>
                      </div>

                      {/* Mark buttons */}
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => markAttempted(i)} title="Mark as attempted"
                          className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-colors ${attempted.has(i) && !correct.has(i) ? "bg-amber-100 border-amber-300 text-amber-600" : "border-stone-200 text-stone-300 hover:border-amber-300"}`}>
                          <Target className="w-3 h-3" />
                        </button>
                        <button onClick={() => markCorrect(i)} title="Mark as correct"
                          className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-colors ${correct.has(i) ? "bg-emerald-100 border-emerald-300 text-emerald-600" : "border-stone-200 text-stone-300 hover:border-emerald-300"}`}>
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button onClick={() => toggleSol(i)}
                      className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-sm border transition-colors ${openSols.has(i) ? "bg-sky-50 border-sky-200 text-sky-700" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-sky-300"}`}>
                      {openSols.has(i) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {openSols.has(i) ? "Hide answer" : "See answer"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {openSols.has(i) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                        <div className="border-t border-sky-100 bg-sky-50 px-3 py-3 space-y-1.5">
                          {/* Calculation question */}
                          {q.solution && (
                            <>
                              {q.solution.workingOut?.map((s: string, si: number) => (
                                <p key={si} className="text-xs text-sky-700 flex items-start gap-1.5">
                                  <span className="font-bold flex-shrink-0">{si+1}.</span>{s}
                                </p>
                              ))}
                              <p className="text-sm font-black text-sky-800">→ {q.solution.finalAnswer}</p>
                              {q.solution.markScheme && (
                                <div className="bg-white/70 border border-sky-100 rounded-sm px-2 py-2 mt-1">
                                  <p className="text-[10px] font-black text-sky-500 uppercase tracking-wider mb-1">Mark scheme</p>
                                  <p className="text-xs text-sky-700 leading-relaxed">{q.solution.markScheme}</p>
                                </div>
                              )}
                            </>
                          )}
                          {/* Theory question */}
                          {q.modelAnswer && (
                            <>
                              <p className="text-[10px] font-black text-sky-500 uppercase tracking-wider">Model answer</p>
                              <p className="text-sm text-sky-800 leading-relaxed">{q.modelAnswer}</p>
                              {q.keyTerms?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {q.keyTerms.map((t: string) => <span key={t} className="text-[10px] font-bold text-sky-600 bg-white border border-sky-200 px-1.5 py-0.5 rounded-sm">{t}</span>)}
                                </div>
                              )}
                            </>
                          )}
                          {q.commonError && (
                            <div className="flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-sm px-2 py-1.5 mt-1">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Saved Query Card ─────────────────────────────────────────────────────────

function QueryCard({ query, onDelete, onReopen, onStar }: {
  query:    SavedQuery;
  onDelete: (id: string) => void;
  onReopen: (q: SavedQuery) => void;
  onStar:   (id: string, starred: boolean) => void;
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText,    setNoteText]    = useState(query.notes ?? "");
  const [savingNote,  setSavingNote]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const saveNote = async () => {
    setSavingNote(true);
    await fetch(`/api/tools/physics-engine/save?id=${query.id}&action=notes`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: noteText }),
    }).catch(() => {});
    setSavingNote(false);
    setEditingNote(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/tools/physics-engine/save?id=${query.id}`, { method: "DELETE" });
    onDelete(query.id);
  };

  const parsed = React.useMemo(() => {
    if (!query.resultJson) return null;
    try { return JSON.parse(query.resultJson); } catch { return null; }
  }, [query.resultJson]);

  const topMisconception = parsed?.misconceptions?.[0];
  const primaryAnalogy   = parsed?.intuition?.primaryModel;

  return (
    <motion.div layout initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">

      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Topic icon */}
          <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 text-xl"
            style={{ backgroundColor: `${ACCENT}10` }}>
            ⚛️
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {query.topic && (
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                  style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}>{query.topic}</span>
              )}
              {query.isExplorerMode && (
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-sm">Theory Explorer</span>
              )}
              {query.level && (
                <span className="text-[10px] text-stone-400 font-semibold">{LEVEL_LABEL[query.level] ?? query.level}</span>
              )}
              {query.hasVisualisation && query.visualisationType && VIZ_EMOJI[query.visualisationType] && (
                <span title={`${query.visualisationType} visualisation`} className="text-sm">
                  {VIZ_EMOJI[query.visualisationType]}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">{query.conceptName ?? query.question}</p>
            {query.conceptName && query.conceptName !== query.question && (
              <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{query.question}</p>
            )}
          </div>

          {/* Star */}
          <button onClick={() => onStar(query.id, !query.isStarred)}
            className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors flex-shrink-0 ${query.isStarred ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}>
            {query.isStarred ? <Star className="w-4 h-4 fill-amber-400" /> : <Star className="w-4 h-4" />}
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[10px] text-stone-400 mb-3 flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtRelative(query.createdAt)}</span>
          {query.practiceSessions.length > 0 && (
            <span className="flex items-center gap-1 text-sky-500 font-semibold">
              <FlaskConical className="w-3 h-3" />{query.practiceSessions.length} practice session{query.practiceSessions.length > 1 ? "s" : ""}
            </span>
          )}
          {query.difficulty && (
            <span className="text-stone-400">{query.difficulty}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onReopen(query)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm transition-colors"
            style={{ backgroundColor: ACCENT }}>
            <ExternalLink className="w-3.5 h-3.5" />Reopen
          </button>
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
            <div className="border-t border-stone-100 px-4 py-4 space-y-4 bg-stone-50/30">

              {/* Quick preview from result */}
              {primaryAnalogy && (
                <div className="bg-amber-50 border border-amber-100 rounded-sm px-3 py-3">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Mental model</p>
                  <p className="text-xs text-amber-800 leading-relaxed line-clamp-3">{primaryAnalogy}</p>
                </div>
              )}

              {topMisconception && (
                <div className="bg-red-50 border border-red-100 rounded-sm px-3 py-3">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1">Key misconception</p>
                  <p className="text-xs text-red-700 line-through leading-relaxed">{topMisconception.wrongBelief}</p>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">{topMisconception.truth?.slice(0, 120)}{topMisconception.truth?.length > 120 ? "…" : ""}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">My Notes</p>
                  <button onClick={() => setEditingNote(p => !p)}
                    className="text-[10px] text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
                    <Edit2 className="w-3 h-3" />{editingNote ? "Cancel" : "Edit"}
                  </button>
                </div>
                {editingNote ? (
                  <div className="flex gap-2">
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
                      placeholder="Add your own notes, exam reminders, or connections…"
                      className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-sky-400 resize-none"
                    />
                    <button onClick={saveNote} disabled={savingNote}
                      className="flex flex-col items-center gap-1 text-[10px] font-bold px-2 py-2 rounded-sm transition-colors disabled:opacity-60 text-white"
                      style={{ backgroundColor: ACCENT }}>
                      {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 leading-relaxed italic">
                    {noteText || "No notes yet. Click Edit to add your own insights."}
                  </p>
                )}
              </div>

              {/* Practice sessions */}
              {query.practiceSessions.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Practice Sessions</p>
                  <div className="space-y-2">
                    {query.practiceSessions.map(sess => (
                      <PracticeStudyCard key={sess.id} session={sess} queryId={query.id} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Topic Coverage Map ───────────────────────────────────────────────────────

function TopicMap({ topicsJson }: { topicsJson: string }) {
  const topics: { topic: string; count: number; lastStudied: string; level?: string }[] = React.useMemo(() => {
    try { return JSON.parse(topicsJson ?? "[]"); } catch { return []; }
  }, [topicsJson]);

  if (!topics.length) return null;

  const maxCount = Math.max(...topics.map(t => t.count), 1);

  return (
    <div className="bg-white border border-stone-100 rounded-sm p-5">
      <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Topic Coverage</p>
      <div className="space-y-2.5">
        {[...topics].sort((a, b) => b.count - a.count).slice(0, 8).map((t) => {
          const color = TOPIC_COLORS[t.topic] ?? ACCENT;
          return (
            <div key={t.topic}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-stone-700">{t.topic}</span>
                  {t.level && <span className="text-[10px] text-stone-400">{LEVEL_LABEL[t.level] ?? t.level}</span>}
                </div>
                <span className="text-xs font-bold" style={{ color }}>{t.count}×</span>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                  initial={{ width: 0 }} animate={{ width: `${(t.count / maxCount) * 100}%` }} transition={{ duration: 0.6 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Learning Path Suggestion ─────────────────────────────────────────────────

function LearningPathSuggestion({ topicsJson, totalQueries }: { topicsJson: string; totalQueries: number }) {
  const topics: { topic: string }[] = React.useMemo(() => {
    try { return JSON.parse(topicsJson ?? "[]"); } catch { return []; }
  }, [topicsJson]);

  const studied   = new Set(topics.map(t => t.topic));
  const all_topics = ["Mechanics", "Waves", "Electromagnetism", "Thermodynamics", "Nuclear Physics", "Quantum Physics", "Astrophysics", "Optics"];
  const missing    = all_topics.filter(t => !studied.has(t));

  if (missing.length === 0 || totalQueries < 3) return null;

  const suggestions = missing.slice(0, 3);

  return (
    <div className="border rounded-sm p-5" style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4" style={{ color: ACCENT }} />
        <p className="text-xs font-black uppercase tracking-wider" style={{ color: ACCENT }}>Explore Next</p>
      </div>
      <p className="text-xs text-stone-600 mb-3 leading-relaxed">
        Based on what you've studied, these topics would round out your physics understanding:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map(t => (
          <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-sm border cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
            ⚛️ {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

interface PhysicsDashboardProps {
  onReopenQuery: (resultJson: string, question: string, level: string) => void;
}

export function PhysicsDashboard({ onReopenQuery }: PhysicsDashboardProps) {
  const [queries,   setQueries]   = useState<SavedQuery[]>([]);
  const [progress,  setProgress]  = useState<LearningProgress | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<"all" | "starred">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/physics-engine/save");
      const data = await res.json();
      setQueries(data.queries ?? []);
      setProgress(data.progress ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string) => setQueries(p => p.filter(q => q.id !== id));
  const handleStar   = async (id: string, starred: boolean) => {
    setQueries(p => p.map(q => q.id === id ? { ...q, isStarred: starred } : q));
    await fetch(`/api/tools/physics-engine/save?id=${id}&action=star`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isStarred: starred }),
    }).catch(() => {});
  };

  const filtered = queries.filter(q => filter === "all" || q.isStarred);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Stats header */}
      {(progress || queries.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Saved",         value: queries.length,                                icon: Atom,       color: ACCENT    },
            { label: "Topics studied",value: (() => { try { return JSON.parse(progress?.topicsJson ?? "[]").length; } catch { return 0; } })(), icon: Layers,     color: "#8b5cf6" },
            { label: "XP Points",     value: progress?.xpPoints ?? 0,                       icon: Zap,        color: "#f59e0b" },
            { label: "Day streak",    value: progress?.streakDays ?? 0,                      icon: Flame,      color: "#f97316" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${s.color}15` }}>
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

      {/* Learning progress */}
      {progress && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TopicMap topicsJson={progress.topicsJson} />
          <LearningPathSuggestion topicsJson={progress.topicsJson} totalQueries={progress.totalQueries} />
        </div>
      )}

      {/* Filter controls */}
      {queries.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1">
            {(["all", "starred"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs font-bold px-3 py-2 rounded-sm border transition-colors capitalize ${filter === f ? "text-white border-transparent" : "bg-white text-stone-400 border-stone-200"}`}
                style={filter === f ? { backgroundColor: ACCENT } : {}}>
                {f === "starred" ? "⭐ Starred" : `All (${queries.length})`}
              </button>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      )}

      {/* Empty state */}
      {queries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-sm bg-stone-50">
          <div className="w-16 h-16 rounded-sm flex items-center justify-center mb-5 text-3xl"
            style={{ backgroundColor: `${ACCENT}10` }}>⚛️</div>
          <h3 className="text-base font-black text-stone-900 mb-2">No saved explanations yet</h3>
          <p className="text-sm text-stone-500 max-w-xs leading-relaxed mb-1">
            Run any explanation and click <span className="font-bold">Save to Workspace</span> to keep it here.
          </p>
          <p className="text-xs text-stone-400">Your notes, practice sessions, and progress are stored alongside each explanation.</p>
        </div>
      )}

      {/* Query list */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(q => (
              <QueryCard
                key={q.id}
                query={q}
                onDelete={handleDelete}
                onStar={handleStar}
                onReopen={(sq) => {
                  if (sq.resultJson) onReopenQuery(sq.resultJson, sq.question, sq.level);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Tip */}
      {queries.length > 0 && queries.length < 5 && (
        <div className="flex items-start gap-3 border rounded-sm px-4 py-3.5"
          style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
          <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
          <p className="text-xs leading-relaxed" style={{ color: "#0c4a6e" }}>
            <span className="font-bold">Pro tip:</span> Save an explanation for every topic in your syllabus. Come back to the practice sessions before exams — the study tracking shows you exactly which questions you got wrong.
          </p>
        </div>
      )}
    </div>
  );
}