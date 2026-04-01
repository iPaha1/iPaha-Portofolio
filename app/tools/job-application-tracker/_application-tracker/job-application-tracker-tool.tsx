// app/tools/application-tracker/_application-tracker/job-application-tracker.tsx
"use client";

// =============================================================================
// isaacpaha.com — Job Application Tracker
// components/tools/interactive/job-application-tracker.tsx
//
// TABS: My Applications | Analytics | AI Coach | Ladder | Community | Share
// Features: Logging, Kanban, List, Gamification, Community, AI, Share Cards
// Auth: Clerk (DB persistence) — localStorage demo mode when signed out
// =============================================================================

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, BarChart2, Trophy, Users, Share2, MessageSquare,
  Sparkles, Flame, Target, CheckCircle2, XCircle, Clock, Loader2,
  Edit2, Trash2, X, Check, Copy, ExternalLink, Briefcase, MapPin,
  DollarSign, Calendar, Eye, EyeOff, Download, RefreshCw, Grid3x3,
  List, Heart, Award, Zap, BookOpen, Lightbulb, Send, Lock,
  MoreHorizontal, FileText, TrendingUp, Star, ChevronDown,
  AlertCircle, Globe, Filter, Badge,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus =
  | "WISHLIST" | "APPLIED" | "PHONE_SCREEN" | "INTERVIEW"
  | "ASSESSMENT" | "FINAL_ROUND" | "OFFER" | "ACCEPTED"
  | "REJECTED" | "WITHDRAWN" | "GHOSTED";

type WorkType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE" | "INTERNSHIP" | "APPRENTICESHIP";
type WorkMode = "ON_SITE" | "HYBRID" | "REMOTE";

interface JobApplication {
  id:              string;
  jobTitle:        string;
  company?:        string | null;
  hideCompany:     boolean;
  sector?:         string | null;
  location?:       string | null;
  workType:        WorkType;
  workMode:        WorkMode;
  salaryMin?:      number | null;
  salaryMax?:      number | null;
  salaryCurrency:  string;
  jobUrl?:         string | null;
  status:          ApplicationStatus;
  appliedAt:       string;
  notes?:          string | null;
  interviewNotes?: string | null;
  whatWentWell?:   string | null;
  whatToImprove?:  string | null;
  followUpDate?:   string | null;
  followedUp:      boolean;
  outcome?:        string | null;
  coverLetterUsed: boolean;
  createdAt:       string;
}

interface Discussion {
  id:          string;
  category:    string;
  title:       string;
  content:     string;
  isAnonymous: boolean;
  likeCount:   number;
  replyCount:  number;
  createdAt:   string;
  profile:     { displayName: string; avatarUrl?: string | null } | null;
  _count?:     { replies: number; likes: number };
}

export interface TokenGateInfo {
  required: number;
  balance:  number;
  toolName: string | null;
}

export interface JobApplicationTrackerToolProps {
  /** Called when the API returns 402 — parent page shows the modal */
  onInsufficientTokens?: (info: TokenGateInfo) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ApplicationStatus, {
  label: string; color: string; bg: string; dot: string; border: string;
}> = {
  WISHLIST:     { label: "Wishlist",     color: "#6366f1", bg: "#ede9fe", dot: "#818cf8",  border: "#c4b5fd" },
  APPLIED:      { label: "Applied",      color: "#3b82f6", bg: "#dbeafe", dot: "#60a5fa",  border: "#93c5fd" },
  PHONE_SCREEN: { label: "Phone Screen", color: "#8b5cf6", bg: "#ede9fe", dot: "#a78bfa",  border: "#c4b5fd" },
  INTERVIEW:    { label: "Interview",    color: "#f59e0b", bg: "#fef3c7", dot: "#fbbf24",  border: "#fcd34d" },
  ASSESSMENT:   { label: "Assessment",  color: "#f97316", bg: "#ffedd5", dot: "#fb923c",  border: "#fdba74" },
  FINAL_ROUND:  { label: "Final Round", color: "#ec4899", bg: "#fce7f3", dot: "#f472b6",  border: "#f9a8d4" },
  OFFER:        { label: "Offer! 🎉",   color: "#10b981", bg: "#d1fae5", dot: "#34d399",  border: "#6ee7b7" },
  ACCEPTED:     { label: "Accepted ✅", color: "#059669", bg: "#d1fae5", dot: "#10b981",  border: "#34d399" },
  REJECTED:     { label: "Rejected",    color: "#ef4444", bg: "#fee2e2", dot: "#f87171",  border: "#fca5a5" },
  WITHDRAWN:    { label: "Withdrawn",   color: "#9ca3af", bg: "#f3f4f6", dot: "#9ca3af",  border: "#d1d5db" },
  GHOSTED:      { label: "Ghosted 👻",  color: "#6b7280", bg: "#f3f4f6", dot: "#6b7280",  border: "#d1d5db" },
};

const KANBAN_COLS: { statuses: ApplicationStatus[]; label: string; color: string }[] = [
  { statuses: ["WISHLIST", "APPLIED"],                            label: "Applied",     color: "#3b82f6" },
  { statuses: ["PHONE_SCREEN", "INTERVIEW", "ASSESSMENT"],        label: "In Progress", color: "#f59e0b" },
  { statuses: ["FINAL_ROUND", "OFFER"],                           label: "Decision",    color: "#10b981" },
  { statuses: ["ACCEPTED", "REJECTED", "WITHDRAWN", "GHOSTED"],   label: "Closed",      color: "#9ca3af" },
];

const SECTORS = [
  "Technology", "Finance", "Healthcare", "Education", "Marketing",
  "Design", "Product", "Data & Analytics", "Engineering", "Legal",
  "HR & Recruitment", "Sales", "Consulting", "Media & Entertainment",
  "Operations", "Government", "Non-profit", "Retail", "Other",
];

const DISC_CATEGORIES = [
  { id: "GENERAL",      label: "General",         emoji: "💬" },
  { id: "ADVICE",       label: "Advice",          emoji: "💡" },
  { id: "SUCCESS_STORY",label: "Success Story",   emoji: "🎉" },
  { id: "VENT",         label: "Vent / Support",  emoji: "🫂" },
  { id: "QUESTION",     label: "Question",        emoji: "❓" },
  { id: "INTERVIEW_PREP",label: "Interview Prep", emoji: "🎯" },
  { id: "SALARY",       label: "Salary Talk",     emoji: "💰" },
  { id: "RESOURCE",     label: "Resource",        emoji: "📚" },
];

const BADGE_CFG: Record<string, { emoji: string; label: string; desc: string }> = {
  FIRST_APPLICATION:    { emoji: "🚀", label: "First Step",      desc: "Logged your first application"     },
  TEN_APPLICATIONS:     { emoji: "💪", label: "Getting Serious", desc: "10 applications submitted"         },
  FIFTY_APPLICATIONS:   { emoji: "⚡", label: "Relentless",      desc: "50 applications. You mean it."    },
  HUNDRED_APPLICATIONS: { emoji: "🏆", label: "Legend",          desc: "100 applications. Absolute unit." },
  FIRST_INTERVIEW:      { emoji: "🎯", label: "In the Door",     desc: "Reached interview stage"           },
  RESILIENCE:           { emoji: "🔥", label: "Iron Will",       desc: "30+ rejections and still going"   },
  EMPLOYED:             { emoji: "🥳", label: "Hired!",          desc: "You got the job!"                 },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1)  return "today";
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtLong(d: string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ─── localStorage demo ────────────────────────────────────────────────────────

const LS_KEY = "job_tracker_v2";
const loadLS  = (): JobApplication[] => { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; } };
const saveLS  = (apps: JobApplication[]) => { try { localStorage.setItem(LS_KEY, JSON.stringify(apps)); } catch {} };

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-sm"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
}

// ─── Application Form ─────────────────────────────────────────────────────────

interface FormData {
  jobTitle: string; company: string; hideCompany: boolean;
  sector: string; location: string; workType: WorkType; workMode: WorkMode;
  salaryMin: string; salaryMax: string; jobUrl: string;
  status: ApplicationStatus; appliedAt: string;
  notes: string; interviewNotes: string; whatWentWell: string;
  whatToImprove: string; coverLetterUsed: boolean; followUpDate: string;
}

const emptyForm = (): FormData => ({
  jobTitle: "", company: "", hideCompany: false,
  sector: "", location: "", workType: "FULL_TIME", workMode: "HYBRID",
  salaryMin: "", salaryMax: "", jobUrl: "",
  status: "APPLIED", appliedAt: new Date().toISOString().slice(0, 10),
  notes: "", interviewNotes: "", whatWentWell: "", whatToImprove: "",
  coverLetterUsed: false, followUpDate: "",
});

function AppForm({ initial, onSave, onCancel, saving }: {
  initial?: Partial<FormData>; onSave: (d: FormData) => void;
  onCancel: () => void; saving: boolean;
}) {
  const [f, setF] = useState<FormData>({ ...emptyForm(), ...initial });
  const [tab, setTab] = useState<"basic" | "details" | "reflection">("basic");
  const set = (k: keyof FormData, v: any) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Tab bar */}
      <div className="flex gap-0.5 px-5 py-3 border-b border-stone-100 flex-shrink-0 bg-stone-50/40">
        {([
          { id: "basic",      label: "📋 Basics"    },
          { id: "details",    label: "📍 Details"   },
          { id: "reflection", label: "💭 Reflection" },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-bold rounded-sm transition-colors ${tab === t.id ? "bg-orange-100 text-orange-700" : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "basic" && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
                Job Title <span className="text-red-400">*</span>
              </label>
              <input value={f.jobTitle} onChange={(e) => set("jobTitle", e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Company</label>
                <button onClick={() => set("hideCompany", !f.hideCompany)}
                  className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-sm border transition-colors ${f.hideCompany ? "text-orange-600 bg-orange-50 border-orange-200" : "text-stone-400 border-stone-200"}`}>
                  {f.hideCompany ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {f.hideCompany ? "Hidden" : "Show name"}
                </button>
              </div>
              <input value={f.company} onChange={(e) => set("company", e.target.value)}
                placeholder="Company name (optional)"
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
              />
              {f.hideCompany && <p className="text-[10px] text-stone-400 mt-1">Company name will be blurred in public views for privacy.</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Application Status</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(STATUS_CFG) as ApplicationStatus[]).map((s) => {
                  const c = STATUS_CFG[s];
                  return (
                    <button key={s} onClick={() => set("status", s)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-sm border transition-colors"
                      style={f.status === s
                        ? { color: c.color, backgroundColor: c.bg, borderColor: c.dot }
                        : { color: "#6b7280", backgroundColor: "white", borderColor: "#e5e7eb" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.status === s ? c.dot : "#d1d5db" }} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Date Applied</label>
                <input type="date" value={f.appliedAt} onChange={(e) => set("appliedAt", e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Sector</label>
                <select value={f.sector} onChange={(e) => set("sector", e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400 bg-white">
                  <option value="">Select…</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Notes</label>
              <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
                placeholder="How you found the role, why you applied, key things to remember…"
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>
          </div>
        )}

        {tab === "details" && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Location</label>
              <input value={f.location} onChange={(e) => set("location", e.target.value)}
                placeholder="London, UK / Remote"
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Work Type</label>
                <select value={f.workType} onChange={(e) => set("workType", e.target.value as WorkType)}
                  className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2.5 focus:outline-none focus:border-orange-400 bg-white">
                  {[
                    ["FULL_TIME","Full-time"], ["PART_TIME","Part-time"], ["CONTRACT","Contract"],
                    ["FREELANCE","Freelance"], ["INTERNSHIP","Internship"], ["APPRENTICESHIP","Apprenticeship"],
                  ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Work Mode</label>
                <select value={f.workMode} onChange={(e) => set("workMode", e.target.value as WorkMode)}
                  className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2.5 focus:outline-none focus:border-orange-400 bg-white">
                  <option value="HYBRID">🏠🏢 Hybrid</option>
                  <option value="REMOTE">🏠 Remote</option>
                  <option value="ON_SITE">🏢 On-site</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Salary Range (optional)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={f.salaryMin} onChange={(e) => set("salaryMin", e.target.value)}
                  placeholder="Min" className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2.5 focus:outline-none focus:border-orange-400"
                />
                <span className="text-stone-300">–</span>
                <input type="number" value={f.salaryMax} onChange={(e) => set("salaryMax", e.target.value)}
                  placeholder="Max" className="flex-1 text-xs border border-stone-200 rounded-sm px-2.5 py-2.5 focus:outline-none focus:border-orange-400"
                />
                <span className="text-xs text-stone-500 font-semibold flex-shrink-0">GBP</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Job Posting URL</label>
              <input value={f.jobUrl} onChange={(e) => set("jobUrl", e.target.value)}
                placeholder="https://…"
                className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Follow-up Date</label>
              <input type="date" value={f.followUpDate} onChange={(e) => set("followUpDate", e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
              />
            </div>

            <button onClick={() => set("coverLetterUsed", !f.coverLetterUsed)}
              className={`flex items-center gap-2.5 w-full text-sm font-semibold px-4 py-3 rounded-sm border transition-colors ${
                f.coverLetterUsed ? "bg-green-50 text-green-700 border-green-200" : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300"
              }`}>
              <FileText className="w-4 h-4" />
              {f.coverLetterUsed ? "✓ Cover letter submitted with this application" : "Mark cover letter as submitted"}
            </button>
          </div>
        )}

        {tab === "reflection" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-sm px-4 py-3">
              <p className="text-xs font-bold text-amber-700 mb-1">Interview & Application Reflection Journal</p>
              <p className="text-[11px] text-amber-600 leading-relaxed">
                After interviews or applications, log your reflections here. Over time, this builds a personal improvement record.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">What went well?</label>
              <textarea value={f.whatWentWell} onChange={(e) => set("whatWentWell", e.target.value)} rows={3}
                placeholder="What did you do better than expected? What clicked?"
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">What to improve?</label>
              <textarea value={f.whatToImprove} onChange={(e) => set("whatToImprove", e.target.value)} rows={3}
                placeholder="What would you do differently? What caught you off guard?"
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Interview Notes</label>
              <textarea value={f.interviewNotes} onChange={(e) => set("interviewNotes", e.target.value)} rows={4}
                placeholder="Questions asked, topics discussed, your impressions of the role and interviewers…"
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-stone-100 flex-shrink-0">
        <button onClick={onCancel} className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2.5 rounded-sm hover:border-stone-400 transition-colors">
          Cancel
        </button>
        <button onClick={() => f.jobTitle.trim() && onSave(f)} disabled={!f.jobTitle.trim() || saving}
          className="flex items-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-5 py-2.5 rounded-sm transition-colors disabled:opacity-60 shadow-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Application"}
        </button>
      </div>
    </div>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────

function AppCard({ app, onEdit, onDelete, onStatusChange }: {
  app: JobApplication;
  onEdit:         (a: JobApplication) => void;
  onDelete:       (id: string) => void;
  onStatusChange: (id: string, s: ApplicationStatus) => void;
}) {
  const [open, setOpen]   = useState(false);
  const [sOpen, setSOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSOpen(false); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <motion.div layout initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
      className="group bg-white border border-stone-100 rounded-sm p-4 hover:border-stone-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-900 leading-snug">{app.jobTitle}</p>
          {app.company && (
            <p className={`text-xs mt-0.5 ${app.hideCompany ? "blur-sm select-none text-stone-400" : "text-stone-500 font-medium"}`}>
              {app.hideCompany ? "Company (hidden)" : app.company}
            </p>
          )}
        </div>
        <div className="relative flex-shrink-0" ref={ref}>
          <button onClick={() => setOpen((p) => !p)}
            className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-sm opacity-0 group-hover:opacity-100 transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                className="absolute right-0 top-8 z-30 w-40 bg-white border border-stone-200 rounded-sm shadow-2xl overflow-hidden">
                {[
                  { l: "Edit",          icon: Edit2,      action: () => { onEdit(app); setOpen(false); } },
                  { l: "Update status", icon: RefreshCw,  action: () => { setSOpen(true); setOpen(false); } },
                ].map((m) => (
                  <button key={m.l} onClick={m.action} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                    <m.icon className="w-3.5 h-3.5 text-stone-400" />{m.l}
                  </button>
                ))}
                {app.jobUrl && (
                  <a href={app.jobUrl} target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />View job
                  </a>
                )}
                <div className="border-t border-stone-100" />
                <button onClick={() => { onDelete(app.id); setOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
              </motion.div>
            )}
            {sOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                className="absolute right-0 top-8 z-30 w-48 bg-white border border-stone-200 rounded-sm shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                {(Object.keys(STATUS_CFG) as ApplicationStatus[]).map((s) => {
                  const c = STATUS_CFG[s];
                  return (
                    <button key={s} onClick={() => { onStatusChange(app.id, s); setSOpen(false); }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-stone-50 transition-colors ${app.status === s ? "bg-stone-50" : ""}`}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
                      <span className="font-semibold" style={{ color: c.color }}>{c.label}</span>
                      {app.status === s && <Check className="w-3 h-3 text-stone-400 ml-auto" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <StatusBadge status={app.status} />
        {app.sector && <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-sm font-medium">{app.sector}</span>}
        {app.workMode === "REMOTE" && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-sm">🏠 Remote</span>}
        {app.workMode === "HYBRID" && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-sm">🏠🏢 Hybrid</span>}
        {app.coverLetterUsed && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-sm">📝 CL</span>}
      </div>

      <div className="flex items-center justify-between text-[10px] text-stone-400">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(app.appliedAt)}</span>
        <div className="flex items-center gap-2">
          {app.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{app.location}</span>}
          {app.notes && <span title="Has notes"><BookOpen className="w-3 h-3 text-stone-300" /></span>}
          {(app.whatWentWell || app.interviewNotes) && <span title="Has reflection"><Lightbulb className="w-3 h-3 text-amber-400" /></span>}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stats Dashboard ──────────────────────────────────────────────────────────

function StatsDashboard({ apps }: { apps: JobApplication[] }) {
  const total      = apps.length;
  const byStatus   = apps.reduce<Record<string,number>>((a,x) => { a[x.status]=(a[x.status]??0)+1; return a; }, {});
  const bySector   = apps.reduce<Record<string,number>>((a,x) => { if(x.sector) { a[x.sector]=(a[x.sector]??0)+1; } return a; }, {});
  const interviews = ["PHONE_SCREEN","INTERVIEW","ASSESSMENT","FINAL_ROUND"].reduce((s,k) => s+(byStatus[k]??0), 0);
  const offers     = (byStatus.OFFER??0)+(byStatus.ACCEPTED??0);
  const active     = apps.filter(a => !["REJECTED","WITHDRAWN","GHOSTED","ACCEPTED"].includes(a.status)).length;

  const byMonth = apps.reduce<Record<string,number>>((a,x) => {
    const m = new Date(x.appliedAt).toLocaleDateString("en-GB",{month:"short",year:"2-digit"});
    a[m]=(a[m]??0)+1; return a;
  }, {});
  const months = Object.entries(byMonth).slice(-6);
  const mMax   = Math.max(...months.map(([,v])=>v), 1);
  const topSectors = Object.entries(bySector).sort((a,b)=>b[1]-a[1]).slice(0,6);

  if (!total) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BarChart2 className="w-10 h-10 text-stone-200 mb-3" />
      <p className="text-sm text-stone-400">Your analytics will appear here once you start logging applications</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Total Applied",  value:total,             sub:`${active} active`,                            color:"#f97316" },
          { label:"Interview Rate", value:`${total>0?Math.round(interviews/total*100):0}%`, sub:`${interviews} interviews`, color:"#f59e0b" },
          { label:"Offer Rate",     value:`${total>0?Math.round(offers/total*100):0}%`,     sub:`${offers} offer${offers!==1?"s":""}`, color:"#10b981" },
          { label:"Rejections",     value:byStatus.REJECTED??0, sub:`${total>0?Math.round((byStatus.REJECTED??0)/total*100):0}% of total`, color:"#ef4444" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
            <p className="text-2xl font-black" style={{color:s.color}}>{s.value}</p>
            <p className="text-[11px] font-bold text-stone-600 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="bg-white border border-stone-100 rounded-sm p-5">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">By Status</p>
          <div className="space-y-2.5">
            {(Object.keys(STATUS_CFG) as ApplicationStatus[])
              .filter(s => (byStatus[s]??0) > 0)
              .sort((a,b) => (byStatus[b]??0)-(byStatus[a]??0))
              .map(s => {
                const c = STATUS_CFG[s];
                const n = byStatus[s]??0;
                const p = Math.round(n/total*100);
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor:c.dot}} />
                        <span className="text-xs font-semibold text-stone-600">{c.label}</span>
                      </div>
                      <span className="text-xs font-bold" style={{color:c.color}}>{n} ({p}%)</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{backgroundColor:c.color}}
                        initial={{width:0}} animate={{width:`${p}%`}} transition={{duration:0.6}} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Monthly chart */}
        {months.length > 0 && (
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Monthly Activity</p>
            <div className="flex items-end gap-2 h-28">
              {months.map(([m, count]) => (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-stone-500 font-bold">{count}</span>
                  <div className="w-full bg-stone-100 rounded-sm overflow-hidden" style={{height:"80px",display:"flex",alignItems:"flex-end"}}>
                    <motion.div className="w-full rounded-sm" style={{backgroundColor:"#f97316"}}
                      initial={{height:0}} animate={{height:`${(count/mMax)*100}%`}} transition={{duration:0.5}} />
                  </div>
                  <span className="text-[9px] text-stone-400">{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top sectors */}
      {topSectors.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-sm p-5">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Top Sectors Applied To</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {topSectors.map(([sector, count]) => (
              <div key={sector} className="flex items-center justify-between border border-stone-100 rounded-sm px-3 py-2.5">
                <span className="text-xs font-semibold text-stone-700 truncate">{sector}</span>
                <span className="text-sm font-black text-orange-600 ml-2 flex-shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Coach (UPDATED with token gate) ───────────────────────────────────────

function AICoach({ apps, isSignedIn, onInsufficientTokens }: { 
  apps: JobApplication[]; 
  isSignedIn: boolean; 
  onInsufficientTokens: (info: TokenGateInfo) => void;
}) {
  const [mode,    setMode]    = useState<"insights"|"interview"|"motivation"|"next-steps">("insights");
  const [role,    setRole]    = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState("");
  const [error,   setError]   = useState("");

  const run = async () => {
    if (!isSignedIn) { setError("Sign in to use AI coaching"); return; }
    setLoading(true); setResult(""); setError("");
    try {
      const res = await fetch("/api/tools/job-tracker/ai", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ mode, targetRole: role }),
      });

      // ── NEW: handle 402 insufficient tokens ──────────────────────────────
      if (res.status === 402) {
        const data = await res.json();
        onInsufficientTokens({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? "Job Tracker AI Coach",
        });
        setLoading(false);
        return; // stop here — modal is shown by parent
      }

      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "AI failed"); }
      else setResult(data.content ?? "");
    } catch { setError("Network error"); }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {([
          { id:"insights",    label:"Search Insights",    icon:TrendingUp, color:"#f59e0b" },
          { id:"interview",   label:"Interview Prep",     icon:Briefcase,  color:"#3b82f6" },
          { id:"motivation",  label:"Motivation Boost",   icon:Flame,      color:"#f97316" },
          { id:"next-steps",  label:"Next Steps",         icon:Target,     color:"#10b981" },
        ] as const).map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`flex flex-col items-center gap-1.5 p-4 rounded-sm border text-center transition-colors ${
              mode === m.id ? "bg-orange-50 border-orange-200" : "bg-white border-stone-100 hover:border-stone-200"
            }`}>
            <m.icon className="w-5 h-5" style={{color: mode===m.id ? m.color : "#9ca3af"}} />
            <span className={`text-[11px] font-bold ${mode===m.id ? "text-orange-700" : "text-stone-500"}`}>{m.label}</span>
          </button>
        ))}
      </div>

      {mode === "interview" && (
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Target Role</label>
          <input value={role} onChange={e => setRole(e.target.value)}
            placeholder="e.g. Product Manager, Data Analyst, UX Designer…"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
          />
        </div>
      )}

      {!isSignedIn ? (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3.5">
          <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Sign in to unlock AI coaching</p>
            <p className="text-xs text-amber-600 mt-0.5">Personalised insights based on your actual application data</p>
          </div>
          <a href="/sign-in" className="ml-auto flex-shrink-0 text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-sm transition-colors">
            Sign in
          </a>
        </div>
      ) : apps.length === 0 && mode !== "interview" ? (
        <div className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-sm px-4 py-3.5">
          <Lightbulb className="w-5 h-5 text-stone-400 flex-shrink-0" />
          <p className="text-sm text-stone-500">Log at least one application to get personalised AI insights</p>
        </div>
      ) : (
        <button onClick={run} disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 py-3 rounded-sm transition-colors disabled:opacity-50 shadow-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating…" : `Get ${mode==="insights"?"Insights":mode==="interview"?"Interview Questions":mode==="motivation"?"Motivation":"Next Steps"}`}
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="bg-stone-50 border border-stone-100 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">AI Response</span>
              <button onClick={() => {navigator.clipboard.writeText(result);}}
                className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
                <Copy className="w-3 h-3" />Copy
              </button>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{result}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Ladder View ──────────────────────────────────────────────────────────────

function LadderView({ isSignedIn }: { isSignedIn: boolean }) {
  const [entries,  setEntries]  = useState<any[]>([]);
  const [myEntry,  setMyEntry]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);

  useEffect(() => {
    if (!isSignedIn) { setLoading(false); return; }
    Promise.all([
      fetch("/api/tools/job-tracker/ladder").then(r=>r.json()),
      fetch("/api/tools/job-tracker/ladder?mine=true").then(r=>r.json()),
    ]).then(([ladder, mine]) => {
      setEntries(ladder.entries ?? []);
      setTotal(ladder.total ?? 0);
      setMyEntry(mine);
    }).catch(console.error).finally(() => setLoading(false));
  }, [isSignedIn]);

  if (!isSignedIn) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Trophy className="w-14 h-14 text-stone-200 mb-4" />
      <h3 className="text-lg font-black text-stone-900 mb-2">Job Application Ladder</h3>
      <p className="text-sm text-stone-500 max-w-sm leading-relaxed mb-6">
        A real-time leaderboard of job seekers tracking their applications. See how many it takes to land a role — and where you stand.
      </p>
      <a href="/sign-in" className="flex items-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-sm transition-colors shadow-sm">
        Sign in to join the ladder
      </a>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="space-y-4">
      {/* My position */}
      {myEntry && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-sm p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-sm bg-orange-100 border border-orange-200 flex items-center justify-center">
            <p className="text-xl font-black text-orange-600">#{myEntry.rank ?? "—"}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-stone-900">Your position on the ladder</p>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-stone-500">
              <span><span className="font-black text-orange-600">{myEntry.totalApplications}</span> apps</span>
              <span><span className="font-black text-amber-600">{myEntry.interviews}</span> interviews</span>
              <span><span className="font-black text-green-600">{myEntry.offers}</span> offers</span>
            </div>
          </div>
          <p className="text-[10px] text-stone-400 flex-shrink-0">{total} people on ladder</p>
        </div>
      )}

      {/* Ladder table */}
      <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
        <div className="grid grid-cols-[36px_1fr_64px_64px_60px] gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-100">
          {["#","Name","Apps","Intv","Offers"].map(h => (
            <p key={h} className="text-[10px] font-black text-stone-400 uppercase tracking-wider text-center first:text-left">{h}</p>
          ))}
        </div>
        {entries.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-stone-400">No one on the ladder yet — be first!</p>
            <p className="text-xs text-stone-300 mt-1">Log applications and make sure "Show on ladder" is enabled in your profile</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {entries.map((e) => {
              const name    = e.profile?.ladderDisplayName || e.profile?.displayName || "Anonymous";
              const medal   = e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : null;
              const isMe    = myEntry && e.profileId === myEntry.profileId;
              return (
                <div key={e.id} className={`grid grid-cols-[36px_1fr_64px_64px_60px] gap-2 items-center px-4 py-3 hover:bg-stone-50/60 transition-colors ${isMe ? "bg-orange-50/50" : ""}`}>
                  <span className={`text-sm font-black text-center ${e.rank <= 3 ? "text-amber-500" : "text-stone-400"}`}>
                    {medal ?? e.rank}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-stone-800 truncate">{name}</p>
                    <p className="text-[10px] text-stone-400 truncate">{e.profile?.targetRole ?? e.profile?.headline ?? "Job seeker"}</p>
                  </div>
                  <p className="text-sm font-black text-orange-600 text-center">{e.totalApplications}</p>
                  <p className="text-sm font-semibold text-amber-600 text-center">{e.interviews}</p>
                  <p className="text-sm font-semibold text-green-600 text-center">{e.offers}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Community ────────────────────────────────────────────────────────────────

function Community({ isSignedIn }: { isSignedIn: boolean }) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [category,    setCategory]    = useState("ALL");
  const [sortBy,      setSortBy]      = useState<"createdAt"|"likeCount">("createdAt");
  const [showNew,     setShowNew]     = useState(false);
  const [newTitle,    setNewTitle]    = useState("");
  const [newContent,  setNewContent]  = useState("");
  const [newCat,      setNewCat]      = useState("GENERAL");
  const [isAnon,      setIsAnon]      = useState(false);
  const [posting,     setPosting]     = useState(false);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [replyText,   setReplyText]   = useState("");
  const [replying,    setReplying]    = useState(false);
  const [liked,       setLiked]       = useState<Set<string>>(new Set());

  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ sortBy, pageSize: "20", ...(category !== "ALL" ? { category } : {}) });
      const res = await fetch(`/api/tools/job-tracker/discussions?${sp}`);
      const data = await res.json();
      setDiscussions(data.discussions ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [category, sortBy]);

  useEffect(() => { fetchDiscussions(); }, [fetchDiscussions]);

  const post = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/tools/job-tracker/discussions", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ category: newCat, title: newTitle.trim(), content: newContent.trim(), isAnonymous: isAnon }),
      });
      if (res.ok) {
        setNewTitle(""); setNewContent(""); setShowNew(false);
        fetchDiscussions();
      }
    } catch {}
    setPosting(false);
  };

  const reply = async (discussionId: string) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/tools/job-tracker/discussions/${discussionId}/replies`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText(""); setExpanded(null);
        fetchDiscussions();
      }
    } catch {}
    setReplying(false);
  };

  const like = async (id: string) => {
    if (!isSignedIn || liked.has(id)) return;
    setLiked(p => new Set([...p, id]));
    setDiscussions(p => p.map(d => d.id === id ? {...d, likeCount: d.likeCount + 1} : d));
    await fetch(`/api/tools/job-tracker/discussions/${id}/replies`, {
      method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"like"}),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header + new post */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-stone-800">Community</p>
          <p className="text-xs text-stone-400 mt-0.5">Share experiences, ask questions, support each other</p>
        </div>
        {isSignedIn && (
          <button onClick={() => setShowNew(p => !p)}
            className="flex items-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-sm transition-colors">
            <Plus className="w-4 h-4" />New Post
          </button>
        )}
      </div>

      {/* New post form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="bg-stone-50 border border-stone-200 rounded-sm p-5 space-y-3">
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {DISC_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setNewCat(c.id)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-sm border transition-colors ${newCat === c.id ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-stone-200 text-stone-500"}`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="Post title…"
                className="w-full text-sm font-bold border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={4}
                placeholder="Share your experience, question, or advice…"
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setIsAnon(p => !p)}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-sm border transition-colors ${isAnon ? "bg-stone-100 border-stone-300 text-stone-700" : "bg-white border-stone-200 text-stone-400"}`}>
                {isAnon ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {isAnon ? "Posting anonymously" : "Post with my name"}
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowNew(false)} className="text-xs font-semibold text-stone-400 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-stone-400 transition-colors">Cancel</button>
                <button onClick={post} disabled={posting || !newTitle.trim() || !newContent.trim()}
                  className="flex items-center gap-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-1.5 rounded-sm transition-colors disabled:opacity-60">
                  {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setCategory("ALL")}
            className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border transition-colors ${category === "ALL" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-stone-500 border-stone-200"}`}>
            All
          </button>
          {DISC_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border transition-colors ${category === c.id ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-stone-500 border-stone-200"}`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="ml-auto text-xs border border-stone-200 rounded-sm px-2.5 py-1.5 bg-white text-stone-600 focus:outline-none focus:border-orange-400">
          <option value="createdAt">Latest</option>
          <option value="likeCount">Most liked</option>
        </select>
      </div>

      {/* Auth nudge */}
      {!isSignedIn && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
          <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <a href="/sign-in" className="font-bold underline">Sign in</a> to post, reply, and participate in the community
          </p>
        </div>
      )}

      {/* Post list */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>
      ) : discussions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <MessageSquare className="w-10 h-10 text-stone-200 mb-3" />
          <p className="text-sm text-stone-400">No discussions yet — start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discussions.map(d => {
            const catCfg = DISC_CATEGORIES.find(c => c.id === d.category);
            const isOpen = expanded === d.id;
            return (
              <div key={d.id} className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-colors">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm font-black text-stone-600 flex-shrink-0">
                      {d.isAnonymous ? "?" : (d.profile?.displayName?.[0]?.toUpperCase() ?? "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-stone-500">
                          {d.isAnonymous ? "Anonymous" : (d.profile?.displayName ?? "User")}
                        </p>
                        {catCfg && (
                          <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-sm">
                            {catCfg.emoji} {catCfg.label}
                          </span>
                        )}
                        <span className="text-[10px] text-stone-300">{fmtDate(d.createdAt)}</span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 mt-0.5 leading-snug">{d.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-stone-600 leading-relaxed line-clamp-3 ml-11">{d.content}</p>

                  <div className="flex items-center gap-3 mt-3 ml-11">
                    <button onClick={() => like(d.id)} disabled={!isSignedIn || liked.has(d.id)}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${liked.has(d.id) ? "text-red-500" : "text-stone-400 hover:text-red-500"}`}>
                      <Heart className={`w-3.5 h-3.5 ${liked.has(d.id) ? "fill-red-500" : ""}`} />
                      {d.likeCount}
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : d.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {d.replyCount ?? d._count?.replies ?? 0} {isOpen ? "Hide" : "Reply"}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                      exit={{height:0,opacity:0}} transition={{duration:0.2}} className="overflow-hidden">
                      <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/40">
                        {isSignedIn ? (
                          <div className="flex gap-2">
                            <input value={replyText} onChange={e => setReplyText(e.target.value)}
                              placeholder="Write a reply…"
                              className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-orange-400"
                            />
                            <button onClick={() => reply(d.id)} disabled={replying || !replyText.trim()}
                              className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-sm transition-colors disabled:opacity-60">
                              {replying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-stone-400 text-center py-1">
                            <a href="/sign-in" className="font-bold text-orange-600 hover:underline">Sign in</a> to reply
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Share Card ───────────────────────────────────────────────────────────────

function ShareSection({ apps }: { apps: JobApplication[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const total = apps.length;
  const interviews = apps.filter((a) =>
    ["PHONE_SCREEN", "INTERVIEW", "ASSESSMENT", "FINAL_ROUND"].includes(a.status)
  ).length;
  const offers = apps.filter((a) =>
    ["OFFER", "ACCEPTED"].includes(a.status)
  ).length;
  const days =
    apps.length > 0
      ? Math.floor(
          (Date.now() - Math.min(...apps.map((a) => new Date(a.appliedAt).getTime()))) /
            86400000
        )
      : 0;

  const copyAndMark = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const xText = `📋 My job search update:\n🔢 ${total} applications submitted\n🎯 ${interviews} interview${
    interviews !== 1 ? "s" : ""
  } reached${offers > 0 ? `\n✅ ${offers} offer${offers !== 1 ? "s" : ""} received` : ""}${
    days > 0 ? `\n⏱ ${days} days in` : ""
  }\n\nTracking everything at isaacpaha.com/tools/job-application-tracker`;

  const linkedInText = `I've submitted ${total} job application${total !== 1 ? "s" : ""}${
    interviews > 0 ? `, reached ${interviews} interview stage${interviews !== 1 ? "s" : ""}` : ""
  }, and I'm still going.\n\nTracking every step of my job search journey — the rejections, the interviews, the progress.\n\n${
    offers > 0 ? "I've got offers to consider. " : ""
  }${days > 0 ? `${days} days in. ` : ""}Staying consistent is the strategy.\n\n👉 Free job application tracker: https://isaacpaha.com/tools/job-application-tracker`;

  return (
    <div className="space-y-5">
      {/* Visual card */}
      <div className="relative rounded-sm overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 p-8">
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-white blur-2xl" />
            <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-amber-200 blur-3xl" />
          </div>
          <div className="relative">
            <p className="text-white/80 text-[11px] font-black uppercase tracking-widest mb-4">
              My Job Search Journey 📋
            </p>
            <div className="grid grid-cols-3 gap-6 mb-5">
              {[
                { value: total, label: "Applications" },
                { value: interviews, label: "Interviews" },
                { value: offers, label: "Offers" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-4xl font-black text-white">{s.value}</p>
                  <p className="text-white/70 text-xs font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {days > 0 && (
              <p className="text-white/70 text-xs">
                {days} days into my job search · isaacpaha.com/tools
              </p>
            )}
          </div>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-stone-400 text-center py-6">
          Log applications to unlock sharing
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
            Share your progress
          </p>

          {/* Twitter/X */}
          <div className="border border-stone-100 rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-600">𝕏 Twitter / X</span>
              <div className="flex gap-2">
                <button
                  onClick={() => copyAndMark(xText, "x")}
                  className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
                >
                  {copied === "x" ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied === "x" ? "Copied!" : "Copy"}
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-white bg-black hover:bg-stone-800 px-2.5 py-1 rounded-sm transition-colors"
                >
                  <Send className="w-3 h-3" />Post
                </a>
              </div>
            </div>
            <pre className="px-4 py-3 text-xs text-stone-600 whitespace-pre-wrap font-sans leading-relaxed">
              {xText}
            </pre>
          </div>

          {/* LinkedIn */}
          <div className="border border-stone-100 rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-600">LinkedIn</span>
              <button
                onClick={() => copyAndMark(linkedInText, "li")}
                className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#0A66C2] hover:bg-blue-800 px-2.5 py-1 rounded-sm transition-colors"
              >
                {copied === "li" ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied === "li" ? "Copied!" : "Copy text"}
              </button>
            </div>
            <pre className="px-4 py-3 text-xs text-stone-600 whitespace-pre-wrap font-sans leading-relaxed">
              {linkedInText}
            </pre>
          </div>

          <p className="text-[11px] text-stone-400 leading-relaxed">
            <span className="font-semibold">Why share?</span> It keeps you accountable, builds your
            network, and inspires others who are in the same situation. Every update you share shows
            consistency — recruiters notice.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT (UPDATED with token gate) ─────────────────────────────────

export function JobApplicationTrackerTool({ onInsufficientTokens }: JobApplicationTrackerToolProps) {
  const { isSignedIn, user } = useUser();
  const [tab,          setTab]          = useState<"tracker"|"stats"|"ai"|"ladder"|"community"|"share">("tracker");
  const [view,         setView]         = useState<"list"|"kanban">("list");
  const [apps,         setApps]         = useState<JobApplication[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editApp,      setEditApp]      = useState<JobApplication|null>(null);
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus|"ALL">("ALL");
  const [filterSector, setFilterSector] = useState("ALL");
  const [xp,           setXp]           = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [badges,       setBadges]       = useState<string[]>([]);
  const [newBadge,     setNewBadge]     = useState<string|null>(null);

  // Load apps
  useEffect(() => {
    if (isSignedIn) {
      Promise.all([
        fetch("/api/tools/job-tracker/applications").then(r=>r.json()),
        fetch("/api/tools/job-tracker/profile").then(r=>r.json()),
      ]).then(([appData, profile]) => {
        setApps(appData.applications ?? []);
        if (profile) {
          setXp(profile.xpPoints ?? 0);
          setStreak(profile.streakDays ?? 0);
          setBadges((profile.badges ?? []).map((b:any) => b.type));
        }
      }).finally(() => setLoading(false));
    } else {
      setApps(loadLS());
      setLoading(false);
    }
  }, [isSignedIn]);

  const filteredApps = useMemo(() => apps.filter(a => {
    const q  = search.toLowerCase();
    const ok = !q || a.jobTitle.toLowerCase().includes(q) || (a.company??"").toLowerCase().includes(q) || (a.sector??"").toLowerCase().includes(q);
    return ok && (filterStatus==="ALL" || a.status===filterStatus) && (filterSector==="ALL" || a.sector===filterSector);
  }), [apps, search, filterStatus, filterSector]);

  // ── Handle insufficient tokens ────────────────────────────────────────────
  const handleInsufficientTokens = (info: TokenGateInfo) => {
    onInsufficientTokens?.(info);
  };

  const handleSave = async (f: FormData) => {
    setSaving(true);
    const now = new Date().toISOString();
    const appData: JobApplication = {
      id:             editApp?.id ?? uid(),
      jobTitle:       f.jobTitle.trim(),
      company:        f.company.trim() || null,
      hideCompany:    f.hideCompany,
      sector:         f.sector || null,
      location:       f.location.trim() || null,
      workType:       f.workType,
      workMode:       f.workMode,
      salaryMin:      f.salaryMin ? parseInt(f.salaryMin) : null,
      salaryMax:      f.salaryMax ? parseInt(f.salaryMax) : null,
      salaryCurrency: "GBP",
      jobUrl:         f.jobUrl.trim() || null,
      status:         f.status,
      appliedAt:      f.appliedAt || now,
      notes:          f.notes.trim() || null,
      interviewNotes: f.interviewNotes.trim() || null,
      whatWentWell:   f.whatWentWell.trim() || null,
      whatToImprove:  f.whatToImprove.trim() || null,
      followUpDate:   f.followUpDate || null,
      followedUp:     false,
      outcome:        null,
      coverLetterUsed: f.coverLetterUsed,
      createdAt:      editApp?.createdAt ?? now,
    };

    if (isSignedIn) {
      try {
        const url    = editApp ? `/api/tools/job-tracker/applications/${editApp.id}` : "/api/tools/job-tracker/applications";
        const method = editApp ? "PATCH" : "POST";
        const res    = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(appData) });
        const data   = await res.json();
        const saved  = editApp ? data : (data.application ?? appData);
        setApps(prev => editApp ? prev.map(a => a.id===saved.id ? {...a,...saved} : a) : [saved,...prev]);
        // Award badge toast if returned
        if (data.newBadge) { setNewBadge(data.newBadge); setTimeout(() => setNewBadge(null), 5000); }
      } catch {}
    } else {
      const updated = editApp ? apps.map(a => a.id===appData.id ? appData : a) : [appData,...apps];
      setApps(updated); saveLS(updated);
    }

    setSaving(false);
    setShowForm(false);
    setEditApp(null);
  };

  const handleDelete = async (id: string) => {
    if (isSignedIn) await fetch(`/api/tools/job-tracker/applications/${id}`, { method:"DELETE" });
    const updated = apps.filter(a => a.id !== id);
    setApps(updated);
    if (!isSignedIn) saveLS(updated);
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    if (isSignedIn) {
      await fetch(`/api/tools/job-tracker/applications/${id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({status}),
      });
    }
    const updated = apps.map(a => a.id===id ? {...a, status} : a);
    setApps(updated);
    if (!isSignedIn) saveLS(updated);
  };

  const exportCSV = () => {
    const h   = ["Job Title","Company","Sector","Status","Location","Work Mode","Work Type","Applied","Notes"];
    const rows = apps.map(a => [
      `"${a.jobTitle}"`, `"${a.hideCompany?"(hidden)":(a.company??"")}"`  ,`"${a.sector??""}"`,
      a.status, `"${a.location??""}"`, a.workMode, a.workType,
      a.appliedAt.slice(0,10), `"${(a.notes??"").replace(/"/g,"'")}"`,
    ]);
    const csv  = [h,...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const el   = document.createElement("a"); el.href=url; el.download="job-applications.csv"; el.click();
    URL.revokeObjectURL(url);
  };

  const sectors    = [...new Set(apps.map(a=>a.sector).filter(Boolean) as string[])];
  const active     = apps.filter(a=>!["REJECTED","WITHDRAWN","GHOSTED","ACCEPTED"].includes(a.status)).length;

  const TABS = [
    { id:"tracker",   label:"Applications",  icon:Briefcase   },
    { id:"stats",     label:"Analytics",     icon:BarChart2   },
    { id:"ai",        label:"AI Coach",      icon:Sparkles    },
    { id:"ladder",    label:"Ladder",        icon:Trophy      },
    { id:"community", label:"Community",     icon:MessageSquare },
    { id:"share",     label:"Share",         icon:Share2      },
  ] as const;

  return (
    <div className="bg-white min-h-[600px]" style={{fontFamily:"Sora,sans-serif"}}>

      {/* Badge toast */}
      <AnimatePresence>
        {newBadge && BADGE_CFG[newBadge] && (
          <motion.div initial={{opacity:0,y:-60}} animate={{opacity:1,y:16}} exit={{opacity:0,y:-60}}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-500 text-white px-5 py-3.5 rounded-sm shadow-2xl">
            <span className="text-2xl">{BADGE_CFG[newBadge].emoji}</span>
            <div>
              <p className="text-sm font-black">Badge unlocked: {BADGE_CFG[newBadge].label}</p>
              <p className="text-xs text-amber-100">{BADGE_CFG[newBadge].desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 py-5 border-b border-stone-100 bg-stone-50/40">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2 flex-wrap">
              📋 Job Application Tracker
              <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-sm uppercase tracking-wider">Beta</span>
            </h2>
            <p className="text-sm text-stone-400 mt-0.5">
              {apps.length > 0
                ? `${apps.length} application${apps.length!==1?"s":""} · ${active} active · ${apps.filter(a=>a.status==="INTERVIEW").length} at interview`
                : "Track every application. Stay consistent. Land the job."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {apps.length > 0 && (
              <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
                <Download className="w-3.5 h-3.5" />CSV
              </button>
            )}
            <button onClick={() => { setEditApp(null); setShowForm(true); }}
              className="flex items-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-sm transition-colors shadow-sm">
              <Plus className="w-4 h-4" />Log Application
            </button>
          </div>
        </div>

        {/* XP + streak bar */}
        {isSignedIn && apps.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-[10px] font-black text-stone-500 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-sm">Lv.{Math.floor(xp/100)+1}</span>
              <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full transition-all" style={{width:`${xp%100}%`}} />
              </div>
              <span className="text-[10px] text-stone-400">{xp} XP</span>
            </div>
            {streak >= 2 && (
              <span className="flex items-center gap-1 text-[11px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-sm">
                <Flame className="w-3 h-3" />{streak}d streak
              </span>
            )}
            {badges.slice(0,6).map(b => BADGE_CFG[b] && (
              <span key={b} className="text-base" title={`${BADGE_CFG[b].label}: ${BADGE_CFG[b].desc}`}>{BADGE_CFG[b].emoji}</span>
            ))}
          </div>
        )}

        {/* Demo mode notice */}
        {!isSignedIn && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2.5 mt-3">
            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              <span className="font-bold">Demo mode</span> — data saved locally.{" "}
              <a href="/sign-in" className="underline font-bold">Sign in</a> for cloud sync, ladder, AI coaching &amp; community.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-100 px-5 overflow-x-auto">
        <div className="flex gap-0.5 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                tab===t.id ? "border-orange-500 text-orange-600" : "border-transparent text-stone-400 hover:text-stone-700"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">

        {/* ── Application Form Modal ───────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={e => e.target===e.currentTarget && (setShowForm(false), setEditApp(null))}>
              <motion.div initial={{scale:0.95,y:10}} animate={{scale:1,y:0}} exit={{scale:0.95}}
                className="bg-white rounded-sm border border-stone-100 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
                  <p className="text-sm font-black text-stone-900">{editApp?"Edit Application":"Log New Application"}</p>
                  <button onClick={() => { setShowForm(false); setEditApp(null); }} className="text-stone-400 hover:text-stone-700 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AppForm
                    initial={editApp ? {
                      jobTitle: editApp.jobTitle, company: editApp.company ?? "", hideCompany: editApp.hideCompany,
                      sector: editApp.sector ?? "", location: editApp.location ?? "",
                      workType: editApp.workType, workMode: editApp.workMode,
                      jobUrl: editApp.jobUrl ?? "", status: editApp.status,
                      appliedAt: editApp.appliedAt.slice(0,10), notes: editApp.notes ?? "",
                      interviewNotes: editApp.interviewNotes ?? "", whatWentWell: editApp.whatWentWell ?? "",
                      whatToImprove: editApp.whatToImprove ?? "", coverLetterUsed: editApp.coverLetterUsed,
                      followUpDate: editApp.followUpDate ?? "",
                    } : undefined}
                    onSave={handleSave} onCancel={() => { setShowForm(false); setEditApp(null); }} saving={saving}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TRACKER TAB ──────────────────────────────────────────────── */}
        {tab === "tracker" && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[160px] max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, company, sector…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-orange-400"
                />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-orange-400">
                <option value="ALL">All statuses</option>
                {(Object.keys(STATUS_CFG) as ApplicationStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
              </select>
              {sectors.length > 0 && (
                <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
                  className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-orange-400">
                  <option value="ALL">All sectors</option>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <div className="flex items-center gap-1 border border-stone-200 rounded-sm p-0.5 ml-auto">
                <button onClick={() => setView("list")}
                  className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors ${view==="list"?"bg-stone-100 text-stone-700":"text-stone-400 hover:text-stone-700"}`}>
                  <List className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setView("kanban")}
                  className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors ${view==="kanban"?"bg-stone-100 text-stone-700":"text-stone-400 hover:text-stone-700"}`}>
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-stone-400">{filteredApps.length}/{apps.length}</span>
            </div>

            {/* Loading / empty */}
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>}

            {!loading && apps.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-sm bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center mb-5 text-4xl">📋</div>
                <h3 className="text-lg font-black text-stone-900 mb-2">Start your job search journey</h3>
                <p className="text-sm text-stone-500 max-w-sm leading-relaxed mb-6">
                  Log every application you submit. Track status, add notes, spot patterns, and stay motivated until you land the job.
                </p>
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-sm transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />Log your first application
                </button>
              </div>
            )}

            {/* List view */}
            {!loading && filteredApps.length > 0 && view === "list" && (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredApps.map(app => (
                    <AppCard key={app.id} app={app}
                      onEdit={a => { setEditApp(a); setShowForm(true); }}
                      onDelete={handleDelete} onStatusChange={handleStatusChange}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Kanban view */}
            {!loading && filteredApps.length > 0 && view === "kanban" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {KANBAN_COLS.map((col) => {
                  const colApps = filteredApps.filter(a => col.statuses.includes(a.status));
                  return (
                    <div key={col.label}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:col.color}} />
                        <p className="text-xs font-black text-stone-600">{col.label}</p>
                        <span className="text-[10px] text-stone-400 font-bold ml-auto">{colApps.length}</span>
                      </div>
                      <div className="space-y-2 min-h-[60px]">
                        <AnimatePresence>
                          {colApps.map(app => {
                            const c = STATUS_CFG[app.status];
                            return (
                              <motion.div key={app.id} layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                onClick={() => { setEditApp(app); setShowForm(true); }}
                                className="bg-white border border-stone-100 rounded-sm p-3 cursor-pointer hover:border-stone-200 hover:shadow-sm transition-all">
                                <p className="text-xs font-bold text-stone-900 line-clamp-2 mb-1">{app.jobTitle}</p>
                                {app.company && !app.hideCompany && <p className="text-[10px] text-stone-400 mb-1 truncate">{app.company}</p>}
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
                                  style={{color:c.color, backgroundColor:c.bg}}>
                                  <span className="w-1 h-1 rounded-full" style={{backgroundColor:c.dot}} />{c.label}
                                </span>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && filteredApps.length === 0 && apps.length > 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="w-8 h-8 text-stone-200 mb-2" />
                <p className="text-sm text-stone-400">No applications match your filters</p>
                <button onClick={() => { setSearch(""); setFilterStatus("ALL"); setFilterSector("ALL"); }}
                  className="mt-3 text-xs text-orange-600 hover:underline">Clear filters</button>
              </div>
            )}
          </div>
        )}

        {/* ── STATS TAB ────────────────────────────────────────────────── */}
        {tab === "stats" && <StatsDashboard apps={apps} />}

        {/* ── AI COACH TAB (UPDATED with token gate) ─────────────────────── */}
        {tab === "ai" && <AICoach apps={apps} isSignedIn={!!isSignedIn} onInsufficientTokens={handleInsufficientTokens} />}

        {/* ── LADDER TAB ───────────────────────────────────────────────── */}
        {tab === "ladder" && <LadderView isSignedIn={!!isSignedIn} />}

        {/* ── COMMUNITY TAB ────────────────────────────────────────────── */}
        {tab === "community" && <Community isSignedIn={!!isSignedIn} />}

        {/* ── SHARE TAB ────────────────────────────────────────────────── */}
        {tab === "share" && <ShareSection apps={apps} />}

      </div>
    </div>
  );
}

// Named export used by tool-detail-client.tsx
export { JobApplicationTrackerTool as JobApplicationTrackerToolTool };

