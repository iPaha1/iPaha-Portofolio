"use client";

// =============================================================================
// isaacpaha.com — Job Tracker User Dashboard
// app/tools/job-application-tracker/_components/user-dashboard.tsx
//
// Personal dashboard for signed-in users:
//   - Application list with full edit/update controls
//   - Quick status-change inline
//   - Ladder opt-in/opt-out toggle
//   - Profile settings (target role, sectors, privacy)
//   - Interview reflection journal entries
//   - Badges earned
// =============================================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Edit2, Trash2, MoreHorizontal,  Check,
  X, Loader2, Trophy, Eye, ChevronDown,
  Calendar, MapPin, Briefcase, Flame, Award, 
  Lightbulb, ExternalLink, Save,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus =
  | "WISHLIST" | "APPLIED" | "PHONE_SCREEN" | "INTERVIEW"
  | "ASSESSMENT" | "FINAL_ROUND" | "OFFER" | "ACCEPTED"
  | "REJECTED" | "WITHDRAWN" | "GHOSTED";

interface JobApplication {
  id:              string;
  jobTitle:        string;
  company?:        string | null;
  hideCompany:     boolean;
  sector?:         string | null;
  location?:       string | null;
  workType:        string;
  workMode:        string;
  status:          ApplicationStatus;
  appliedAt:       string;
  notes?:          string | null;
  interviewNotes?: string | null;
  whatWentWell?:   string | null;
  whatToImprove?:  string | null;
  followUpDate?:   string | null;
  followedUp:      boolean;
  coverLetterUsed: boolean;
  jobUrl?:         string | null;
  createdAt:       string;
}

interface InitialProfile {
  id:               string;
  displayName:      string;
  avatarUrl?:       string | null;
  headline?:        string | null;
  xpPoints:         number;
  level:            number;
  streakDays:       number;
  totalApplications: number;
  isEmployed:       boolean;
  showOnLadder:     boolean;
  showCompanyNames: boolean;
  badges:           { type: string; awardedAt: string }[];
  ladderEntry?:     { totalApplications: number; interviews: number; offers: number; rank: number | null } | null;
  applicationCount: number;
}

interface UserDashboardProps {
  initialProfile: InitialProfile | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ApplicationStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
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

const BADGE_CFG: Record<string, { emoji: string; label: string; desc: string; color: string }> = {
  FIRST_APPLICATION:    { emoji: "🚀", label: "First Step",      desc: "First application logged",          color: "#6366f1" },
  TEN_APPLICATIONS:     { emoji: "💪", label: "Getting Serious", desc: "10 applications submitted",         color: "#3b82f6" },
  FIFTY_APPLICATIONS:   { emoji: "⚡", label: "Relentless",      desc: "50 applications — you mean it",     color: "#f59e0b" },
  HUNDRED_APPLICATIONS: { emoji: "🏆", label: "Legend",          desc: "100 applications — absolute unit",  color: "#f97316" },
  FIRST_INTERVIEW:      { emoji: "🎯", label: "In the Door",     desc: "Reached interview stage",           color: "#10b981" },
  RESILIENCE:           { emoji: "🔥", label: "Iron Will",       desc: "30+ rejections and still going",    color: "#ef4444" },
  STREAK_7:             { emoji: "📅", label: "Week Streak",     desc: "Applied 7 days in a row",           color: "#8b5cf6" },
  STREAK_30:            { emoji: "🌟", label: "Month Streak",    desc: "Applied 30 days in a row",          color: "#ec4899" },
  EMPLOYED:             { emoji: "🥳", label: "Hired!",          desc: "You got the job!",                  color: "#059669" },
  COMMUNITY_HELPER:     { emoji: "🤝", label: "Community Helper",desc: "10+ helpful replies",               color: "#14b8a6" },
  TOP_SHARER:           { emoji: "📣", label: "Top Sharer",      desc: "Shared progress 5+ times",          color: "#f97316" },
};

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1)  return "today";
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Application Row with inline edit ────────────────────────────────────────

function AppRow({ app, onStatusChange, onDelete, onEdit }: {
  app:            JobApplication;
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>;
  onDelete:       (id: string) => void;
  onEdit:         (app: JobApplication) => void;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [updating,   setUpdating]   = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const c = STATUS_CFG[app.status];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const changeStatus = async (status: ApplicationStatus) => {
    setUpdating(true);
    await onStatusChange(app.id, status);
    setUpdating(false);
    setStatusOpen(false);
  };

  const hasReflection = app.whatWentWell || app.whatToImprove || app.interviewNotes;

  return (
    <motion.div layout initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="border border-stone-100 rounded-sm bg-white hover:border-stone-200 transition-all overflow-hidden">

      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Status button */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => { setStatusOpen((p) => !p); setMenuOpen(false); }}
            disabled={updating}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-sm border transition-colors hover:opacity-80 flex-shrink-0"
            style={{ color: c.color, backgroundColor: c.bg, borderColor: c.border }}>
            {updating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />}
            {c.label}
            <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
          </button>
          <AnimatePresence>
            {statusOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 z-30 w-44 bg-white border border-stone-200 rounded-sm shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                {(Object.keys(STATUS_CFG) as ApplicationStatus[]).map((s) => {
                  const sc = STATUS_CFG[s];
                  return (
                    <button key={s} onClick={() => changeStatus(s)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-stone-50 transition-colors ${app.status === s ? "bg-stone-50" : ""}`}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sc.dot }} />
                      <span className="font-semibold" style={{ color: sc.color }}>{sc.label}</span>
                      {app.status === s && <Check className="w-3 h-3 text-stone-400 ml-auto" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Job details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-stone-900">{app.jobTitle}</p>
            {app.company && (
              <p className={`text-xs ${app.hideCompany ? "blur-sm select-none text-stone-400" : "text-stone-500"}`}>
                {app.hideCompany ? "Company" : app.company}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-stone-400">
            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{fmtDate(app.appliedAt)}</span>
            {app.sector && <span>{app.sector}</span>}
            {app.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{app.location}</span>}
            {hasReflection && <span className="flex items-center gap-0.5 text-amber-500"><Lightbulb className="w-3 h-3" />Has reflection</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Follow-up */}
          {app.followUpDate && !app.followedUp && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-sm">
              <Calendar className="w-3 h-3" />Follow up {fmtDate(app.followUpDate)}
            </span>
          )}

          {/* Expand for reflection */}
          {hasReflection && (
            <button onClick={() => setExpanded((p) => !p)}
              className="text-xs font-semibold text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2 py-1.5 rounded-sm transition-colors">
              {expanded ? "Hide" : "Journal"}
            </button>
          )}

          {app.jobUrl && (
            <a href={app.jobUrl} target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 border border-stone-200 hover:border-stone-400 rounded-sm transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen((p) => !p)}
              className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                  className="absolute right-0 top-8 z-30 w-36 bg-white border border-stone-200 rounded-sm shadow-2xl overflow-hidden">
                  <button onClick={() => { onEdit(app); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-stone-400" />Edit
                  </button>
                  <div className="border-t border-stone-100" />
                  <button onClick={() => { onDelete(app.id); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Expanded reflection */}
      <AnimatePresence>
        {expanded && hasReflection && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 bg-amber-50/30 space-y-3">
              {app.whatWentWell && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">What went well</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{app.whatWentWell}</p>
                </div>
              )}
              {app.whatToImprove && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">What to improve</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{app.whatToImprove}</p>
                </div>
              )}
              {app.interviewNotes && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Interview notes</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{app.interviewNotes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Profile Settings Panel ───────────────────────────────────────────────────

function ProfileSettings({ profile, onSaved }: { profile: InitialProfile; onSaved: () => void }) {
  const [showOnLadder,  setShowOnLadder]  = useState(profile.showOnLadder);
  const [showCompany,   setShowCompany]   = useState(profile.showCompanyNames);
  const [displayName,   setDisplayName]   = useState(profile.displayName);
  const [headline,      setHeadline]      = useState(profile.headline ?? "");
  const [saving,        setSaving]        = useState(false);
  const [savedOk,       setSavedOk]       = useState(false);
  const [markEmployed,  setMarkEmployed]  = useState(false);
  const [employedRole,  setEmployedRole]  = useState("");

  const save = async () => {
    setSaving(true);
    await fetch("/api/tools/job-tracker/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName:      displayName.trim() || profile.displayName,
        headline:         headline.trim() || null,
        showOnLadder,
        showCompanyNames: showCompany,
      }),
    });
    setSavedOk(true);
    setTimeout(() => { setSavedOk(false); onSaved(); }, 1500);
    setSaving(false);
  };

  const markAsEmployed = async () => {
    if (!employedRole.trim()) return;
    setSaving(true);
    await fetch("/api/tools/job-tracker/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEmployed: true, employedRole: employedRole.trim() }),
    });
    await fetch(`/api/tools/job-tracker/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-5">
      {/* Profile basics */}
      <div className="bg-white border border-stone-100 rounded-sm p-5">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Profile</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Display Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Headline</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)}
              placeholder="Software Engineer | Open to work"
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Privacy + Ladder */}
      <div className="bg-white border border-stone-100 rounded-sm p-5">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Privacy & Ladder</p>
        <div className="space-y-3">
          {[
            {
              label: "Show on Job Application Ladder",
              desc:  "Your application count and rank are visible to others on the public leaderboard",
              value: showOnLadder,
              set:   setShowOnLadder,
              icon:  Trophy,
            },
            {
              label: "Show company names on my profile",
              desc:  "Company names visible in public views. Turn off to blur all company names.",
              value: showCompany,
              set:   setShowCompany,
              icon:  Eye,
            },
          ].map((setting) => (
            <div key={setting.label} className="flex items-start justify-between gap-4 py-3 border-b border-stone-50 last:border-0">
              <div className="flex items-start gap-3">
                <setting.icon className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-stone-700">{setting.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5 leading-snug">{setting.desc}</p>
                </div>
              </div>
              <button onClick={() => setting.set((p: boolean) => !p)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${setting.value ? "bg-orange-400" : "bg-stone-200"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${setting.value ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Got the job! */}
      {!profile.isEmployed && (
        <div className="bg-green-50 border border-green-200 rounded-sm p-5">
          <p className="text-sm font-black text-green-900 mb-1">🎉 Got the job?</p>
          <p className="text-xs text-green-700 mb-3 leading-relaxed">
            Congratulations! Mark yourself as employed to unlock the &#34;Hired!&#34; badge, be removed from the active Ladder, and log your success story for the community.
          </p>
          {!markEmployed ? (
            <button onClick={() => setMarkEmployed(true)}
              className="text-sm font-bold text-green-700 border border-green-300 hover:bg-green-100 px-4 py-2 rounded-sm transition-colors">
              I got the job! 🥳
            </button>
          ) : (
            <div className="flex gap-2">
              <input value={employedRole} onChange={(e) => setEmployedRole(e.target.value)}
                placeholder="e.g. Software Engineer at Google"
                className="flex-1 text-xs border border-green-300 rounded-sm px-3 py-2 focus:outline-none focus:border-green-500"
              />
              <button onClick={markAsEmployed} disabled={saving || !employedRole.trim()}
                className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-1.5">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirm
              </button>
              <button onClick={() => setMarkEmployed(false)} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 py-3 rounded-sm transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : savedOk ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export function UserDashboard({ initialProfile }: UserDashboardProps) {
  const [section,   setSection]   = useState<"applications" | "settings" | "badges">("applications");
  const [apps,      setApps]      = useState<JobApplication[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [profile,   setProfile]   = useState<InitialProfile | null>(initialProfile);
  const [editApp,   setEditApp]   = useState<JobApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "ALL">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    const [appsData, profileData] = await Promise.all([
      fetch("/api/tools/job-tracker/applications?pageSize=100").then((r) => r.json()),
      fetch("/api/tools/job-tracker/profile").then((r) => r.json()),
    ]);
    setApps(appsData.applications ?? []);
    if (profileData) setProfile(profileData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    await fetch(`/api/tools/job-tracker/applications/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tools/job-tracker/applications/${id}`, { method: "DELETE" });
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const filtered = apps.filter((a) => filterStatus === "ALL" || a.status === filterStatus);

  // Quick stats
  const total      = apps.length;
  const active     = apps.filter((a) => !["REJECTED","WITHDRAWN","GHOSTED","ACCEPTED"].includes(a.status)).length;
  const interviews = apps.filter((a) => ["PHONE_SCREEN","INTERVIEW","ASSESSMENT","FINAL_ROUND"].includes(a.status)).length;
  const offers     = apps.filter((a) => ["OFFER","ACCEPTED"].includes(a.status)).length;

  const ladder = profile?.ladderEntry;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Profile header */}
      {profile && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-sm p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-xl font-black text-orange-700 flex-shrink-0">
              {profile.displayName?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-stone-900">{profile.displayName}</p>
              {profile.headline && <p className="text-sm text-stone-500 mt-0.5">{profile.headline}</p>}
              <div className="flex items-center gap-2 mt-1">
                {profile.streakDays >= 2 && (
                  <span className="flex items-center gap-1 text-[11px] font-black text-orange-600 bg-white border border-orange-200 px-2 py-0.5 rounded-sm">
                    <Flame className="w-3 h-3" />{profile.streakDays}d streak
                  </span>
                )}
                {profile.isEmployed && (
                  <span className="text-[11px] font-black text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-sm">
                    🥳 Employed
                  </span>
                )}
                {ladder && ladder.rank && (
                  <span className="text-[11px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-sm">
                    #{ladder.rank} on Ladder
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Total Apps",    value:total,           color:"#f97316" },
              { label:"Active",        value:active,          color:"#3b82f6" },
              { label:"Interviews",    value:interviews,       color:"#f59e0b" },
              { label:"Offers",        value:offers,           color:"#10b981" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-sm px-3 py-2.5 border border-orange-100 text-center">
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-stone-400 font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-stone-100 pb-0">
        {([
          { id: "applications", label: "Applications",  icon: Briefcase },
          { id: "settings",     label: "Settings",      icon: Settings  },
          { id: "badges",       label: "Badges",        icon: Award     },
        ] as const).map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              section === s.id ? "border-orange-500 text-orange-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <s.icon className="w-4 h-4" />{s.label}
          </button>
        ))}
      </div>

      {/* ── Applications section ────────────────────────────────────────── */}
      {section === "applications" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-orange-400">
              <option value="ALL">All statuses ({total})</option>
              {(Object.keys(STATUS_CFG) as ApplicationStatus[]).map((s) => {
                const count = apps.filter((a) => a.status === s).length;
                return count > 0 ? (
                  <option key={s} value={s}>{STATUS_CFG[s].label} ({count})</option>
                ) : null;
              })}
            </select>
            <span className="text-xs text-stone-400 ml-auto">{filtered.length} application{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Applications list */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-stone-50 border border-stone-100 rounded-sm">
              <Briefcase className="w-8 h-8 text-stone-200 mb-3" />
              <p className="text-sm text-stone-400">
                {total === 0 ? "No applications yet — log your first one using the tool above" : "No applications with this status"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filtered.map((app) => (
                  <AppRow key={app.id} app={app}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onEdit={setEditApp}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Edit inline note */}
          {editApp && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 flex-1">
                To edit <strong>&#34;{editApp.jobTitle}&#34;</strong> fully, use the main tracker tab — click &#34;Use the Tool&#34; above and find the application there.
              </p>
              <button onClick={() => setEditApp(null)} className="text-amber-400 hover:text-amber-700"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* ── Settings section ────────────────────────────────────────────── */}
      {section === "settings" && profile && (
        <ProfileSettings profile={profile} onSaved={load} />
      )}

      {/* ── Badges section ──────────────────────────────────────────────── */}
      {section === "badges" && (
        <div>
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">
            {profile?.badges.length ?? 0} of {Object.keys(BADGE_CFG).length} badges earned
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(BADGE_CFG).map(([type, cfg]) => {
              const earned = (profile?.badges ?? []).some((b) => b.type === type);
              const badge  = (profile?.badges ?? []).find((b) => b.type === type);
              return (
                <div key={type}
                  className={`border rounded-sm p-4 transition-all ${earned ? "bg-white border-stone-200 shadow-sm" : "bg-stone-50 border-stone-100 opacity-50"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-3xl ${earned ? "" : "grayscale"}`}>{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${earned ? "text-stone-900" : "text-stone-400"}`}>{cfg.label}</p>
                      <p className="text-xs text-stone-400 mt-0.5 leading-snug">{cfg.desc}</p>
                      {earned && badge && (
                        <p className="text-[10px] text-stone-300 mt-1">
                          Earned {new Date(badge.awardedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                    {earned && <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}