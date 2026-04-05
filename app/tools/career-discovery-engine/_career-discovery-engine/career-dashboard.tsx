"use client";

// =============================================================================
// isaacpaha.com — Career Discovery Engine — User Workspace Dashboard
// app/tools/career-discovery-engine/_career-discovery/career-dashboard.tsx
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  Briefcase, Star, Loader2, ChevronDown, ChevronUp, Trash2,
  RefreshCw, Target, TrendingUp, Zap, Flame, Edit2, Save,
  CheckCircle2, ExternalLink, MapPin, Clock, DollarSign,
  BarChart2, Layers, Award, ArrowRight, Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedCareer {
  id:               string;
  careerTitle:      string;
  industry:         string;
  competitionLevel: string;
  entryTimeframe:   string;
  salaryEntryGbp?:  number | null;
  salarySeniorGbp?: number | null;
  skillMatchPct:    number;
  careerJson?:      string | null;
  isApplying:       boolean;
  isStarred:        boolean;
  progressNotes?:   string | null;
  roadmapStep:      number;
  createdAt:        string;
}

interface QueryRecord {
  id:             string;
  skillsJson:     string;
  education:      string;
  goals:          string;
  experienceLevel:string;
  careerCount:    number;
  resultJson?:    string | null;
  isStarred:      boolean;
  notes?:         string | null;
  createdAt:      string;
}

interface Progress {
  totalQueries:    number;
  careersExplored: number;
  streakDays:      number;
  xpPoints:        number;
  industriesJson:  string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#ec4899";

const COMP_CFG: Record<string, { label: string; color: string; dot: string }> = {
  VERY_LOW: { label: "Very Low",  color: "#10b981", dot: "🟢" },
  LOW:      { label: "Low",       color: "#34d399", dot: "🟢" },
  MEDIUM:   { label: "Medium",    color: "#f59e0b", dot: "🟡" },
  HIGH:     { label: "High",      color: "#f97316", dot: "🔴" },
  VERY_HIGH:{ label: "Very High", color: "#ef4444", dot: "🔴" },
};

const ENTRY_LABEL: Record<string, string> = {
  UNDER_3_MONTHS:    "< 3 months",
  THREE_TO_6_MONTHS: "3–6 months",
  SIX_TO_12_MONTHS:  "6–12 months",
  ONE_TO_2_YEARS:    "1–2 years",
  TWO_PLUS_YEARS:    "2+ years",
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtRel = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return fmtDate(d);
};

// ─── Career Card ──────────────────────────────────────────────────────────────

function SavedCareerCard({
  career, onDelete, onReopen,
}: {
  career:   SavedCareer;
  onDelete: (id: string) => void;
  onReopen: (career: SavedCareer) => void;
}) {
  const [expanded,     setExpanded]     = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes,        setNotes]        = useState(career.progressNotes ?? "");
  const [savingNotes,  setSavingNotes]  = useState(false);
  const [isApplying,   setIsApplying]   = useState(career.isApplying);
  const [isStarred,    setIsStarred]    = useState(career.isStarred);
  const [roadmapStep,  setRoadmapStep]  = useState(career.roadmapStep);
  const [deleting,     setDeleting]     = useState(false);

  const comp     = COMP_CFG[career.competitionLevel] ?? COMP_CFG.MEDIUM;
  const parsed   = React.useMemo(() => { try { return career.careerJson ? JSON.parse(career.careerJson) : null; } catch { return null; } }, [career.careerJson]);
  const roadmap  = parsed?.entryRoadmap ?? [];
  const totalSteps = roadmap.length;

  const patch = async (action: string, data: any) => {
    await fetch(`/api/tools/career-discovery/save?careerId=${career.id}&action=${action}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).catch(() => {});
  };

  const toggleStar    = async () => { const n = !isStarred; setIsStarred(n); await patch("starCareer", { isStarred: n }); };
  const toggleApply   = async () => { const n = !isApplying; setIsApplying(n); await patch("applyCareer", { isApplying: n }); };
  const advanceStep   = async () => { const n = Math.min(roadmapStep + 1, totalSteps); setRoadmapStep(n); await patch("roadmapStep", { step: n }); };
  const saveNotes     = async () => { setSavingNotes(true); await patch("progressNotes", { notes }); setSavingNotes(false); setEditingNotes(false); };
  const handleDelete  = async () => { setDeleting(true); await fetch(`/api/tools/career-discovery/save?careerId=${career.id}`, { method: "DELETE" }); onDelete(career.id); };

  const progressPct = totalSteps > 0 ? Math.round((roadmapStep / totalSteps) * 100) : 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}10` }}>💎</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                style={{ color: ACCENT, backgroundColor: `${ACCENT}12` }}>{career.industry}</span>
              <span className="text-[10px] font-bold" style={{ color: comp.color }}>{comp.dot} {comp.label} competition</span>
              {isApplying && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm">
                  🚀 Pursuing
                </span>
              )}
            </div>
            <p className="text-sm font-black text-stone-900 leading-snug">{career.careerTitle}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-stone-400 flex-wrap">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ENTRY_LABEL[career.entryTimeframe] ?? career.entryTimeframe}</span>
              {career.salaryEntryGbp && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />From £{career.salaryEntryGbp.toLocaleString()}</span>}
              <span className="flex items-center gap-1"><Target className="w-3 h-3" />{career.skillMatchPct}% skill match</span>
              <span>{fmtRel(career.createdAt)}</span>
            </div>
          </div>
          <button onClick={toggleStar}
            className={`w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0 transition-colors ${isStarred ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}>
            <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {/* Roadmap progress */}
        {totalSteps > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Entry Roadmap</p>
              <span className="text-[10px] font-bold" style={{ color: ACCENT }}>{roadmapStep}/{totalSteps} steps</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: ACCENT }}
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onReopen(career)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm"
            style={{ backgroundColor: ACCENT }}>
            <ExternalLink className="w-3.5 h-3.5" />View Career
          </button>
          {roadmapStep < totalSteps && (
            <button onClick={advanceStep}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-2 rounded-sm transition-colors">
              <Check className="w-3.5 h-3.5" />Step Done
            </button>
          )}
          <button onClick={toggleApply}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
              isApplying ? "bg-stone-100 text-stone-500 border-stone-200" : "text-stone-500 border-stone-200 hover:border-stone-400"
            }`}>
            {isApplying ? "Pursuing ✓" : "Mark as Pursuing"}
          </button>
          <button onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="ml-auto text-stone-300 hover:text-red-400 transition-colors">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-5 py-4 space-y-4 bg-stone-50/30">
              {/* Why overlooked */}
              {parsed?.whyOverlooked && (
                <div className="rounded-sm px-4 py-3" style={{ backgroundColor: `${ACCENT}06`, borderLeft: `3px solid ${ACCENT}` }}>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Why No One Talks About This</p>
                  <p className="text-xs text-stone-700 leading-relaxed">{parsed.whyOverlooked}</p>
                </div>
              )}
              {/* Salary strip */}
              {(career.salaryEntryGbp || career.salarySeniorGbp) && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Entry", value: career.salaryEntryGbp ? `£${career.salaryEntryGbp.toLocaleString()}` : "—" },
                    { label: "Mid", value: parsed?.salaryMid ?? "—" },
                    { label: "Senior", value: career.salarySeniorGbp ? `£${career.salarySeniorGbp.toLocaleString()}` : "—" },
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-stone-100 rounded-sm px-3 py-2 text-center">
                      <p className="text-sm font-black text-stone-900">{s.value}</p>
                      <p className="text-[10px] text-stone-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Roadmap steps */}
              {roadmap.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Roadmap Steps</p>
                  <div className="space-y-1.5">
                    {roadmap.map((step: any, i: number) => (
                      <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-sm border text-xs transition-colors ${
                        i < roadmapStep ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                        i === roadmapStep ? "border-pink-200 bg-pink-50/50 text-stone-800 font-semibold" :
                        "border-stone-100 bg-white text-stone-500"
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                          i < roadmapStep ? "bg-emerald-500 text-white" :
                          i === roadmapStep ? "text-white" : "bg-stone-200 text-stone-500"
                        }`} style={i === roadmapStep ? { backgroundColor: ACCENT } : {}}>
                          {i < roadmapStep ? "✓" : i + 1}
                        </div>
                        <div>
                          <p className="font-bold">{step.action}</p>
                          <p className="text-[10px] opacity-70 mt-0.5">{step.timeframe}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Progress Notes</p>
                  <button onClick={() => setEditingNotes(p => !p)} className="text-[10px] text-stone-400 hover:text-stone-700 flex items-center gap-1">
                    <Edit2 className="w-3 h-3" />{editingNotes ? "Cancel" : "Edit"}
                  </button>
                </div>
                {editingNotes ? (
                  <div className="flex gap-2">
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                      placeholder="Notes on your progress, contacts made, applications sent…"
                      className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-pink-400 resize-none" />
                    <button onClick={saveNotes} disabled={savingNotes}
                      className="flex flex-col items-center gap-1 text-[10px] font-bold px-2 py-2 rounded-sm text-white disabled:opacity-60"
                      style={{ backgroundColor: ACCENT }}>
                      {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic leading-relaxed">{notes || "No notes yet."}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Industry Coverage ────────────────────────────────────────────────────────

function IndustryCoverage({ industriesJson }: { industriesJson: string }) {
  const industries: { industry: string; count: number }[] = React.useMemo(() => {
    try { return JSON.parse(industriesJson ?? "[]"); } catch { return []; }
  }, [industriesJson]);
  if (!industries.length) return null;
  const max = Math.max(...industries.map(i => i.count), 1);
  const COLORS = ["#ec4899", "#8b5cf6", "#14b8a6", "#f59e0b", "#10b981", "#3b82f6"];
  return (
    <div className="bg-white border border-stone-100 rounded-sm p-5">
      <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Industries Explored</p>
      <div className="space-y-3">
        {[...industries].sort((a, b) => b.count - a.count).slice(0, 6).map((ind, i) => (
          <div key={ind.industry}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-700">{ind.industry}</span>
              <span className="text-xs font-bold" style={{ color: COLORS[i % COLORS.length] }}>{ind.count}×</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}
                initial={{ width: 0 }} animate={{ width: `${(ind.count / max) * 100}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

interface CareerDashboardProps {
  onReopenCareer: (careerJson: string) => void;
}

export function CareerDashboard({ onReopenCareer }: CareerDashboardProps) {
  const [savedCareers, setSavedCareers] = useState<SavedCareer[]>([]);
  const [progress,     setProgress]     = useState<Progress | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<"all" | "pursuing" | "starred">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/career-discovery/save");
      const data = await res.json();
      setSavedCareers(data.savedCareers ?? []);
      setProgress(data.progress ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete  = (id: string) => setSavedCareers(p => p.filter(c => c.id !== id));
  const handleReopen  = (career: SavedCareer) => {
    if (career.careerJson) onReopenCareer(career.careerJson);
  };

  const filtered = savedCareers.filter(c => {
    if (filter === "pursuing") return c.isApplying;
    if (filter === "starred")  return c.isStarred;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {(progress || savedCareers.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Careers Saved",     value: savedCareers.length,             icon: Briefcase, color: ACCENT    },
            { label: "Pursuing",          value: savedCareers.filter(c => c.isApplying).length, icon: TrendingUp, color: "#10b981" },
            { label: "XP Points",         value: progress?.xpPoints  ?? 0,        icon: Zap,       color: "#f59e0b" },
            { label: "Day Streak",        value: progress?.streakDays ?? 0,        icon: Flame,     color: "#f97316" },
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

      {/* Industry coverage */}
      {progress && <IndustryCoverage industriesJson={progress.industriesJson} />}

      {/* Filter + refresh */}
      {savedCareers.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1">
            {(["all", "pursuing", "starred"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs font-bold px-3 py-2 rounded-sm border transition-colors capitalize ${
                  filter === f ? "text-white border-transparent" : "bg-white text-stone-400 border-stone-200"
                }`}
                style={filter === f ? { backgroundColor: ACCENT } : {}}>
                {f === "all" ? `All (${savedCareers.length})` : f === "pursuing" ? `🚀 Pursuing` : "⭐ Starred"}
              </button>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      )}

      {/* Empty state */}
      {savedCareers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-sm bg-stone-50">
          <div className="w-16 h-16 rounded-sm flex items-center justify-center mb-5 text-3xl"
            style={{ backgroundColor: `${ACCENT}10` }}>💎</div>
          <h3 className="text-base font-black text-stone-900 mb-2">No saved careers yet</h3>
          <p className="text-sm text-stone-500 max-w-xs leading-relaxed">
            Run the career finder, then click <span className="font-bold">Save Career</span> on any match to track your progress here.
          </p>
        </div>
      )}

      {/* Career cards */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(c => (
              <SavedCareerCard key={c.id} career={c} onDelete={handleDelete} onReopen={handleReopen} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {savedCareers.length > 0 && savedCareers.length < 3 && (
        <div className="flex items-start gap-3 border rounded-sm px-4 py-3.5"
          style={{ backgroundColor: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
          <Award className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
          <p className="text-xs leading-relaxed" style={{ color: "#831843" }}>
            <span className="font-bold">Pro tip:</span> Save 3–5 target careers and mark the one you're actively pursuing. The roadmap tracker will help you move through each entry step systematically.
          </p>
        </div>
      )}
    </div>
  );
}