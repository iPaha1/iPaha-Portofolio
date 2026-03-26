"use client";

// =============================================================================
// isaacpaha.com — Kids Birthday Planner — Party Organiser Dashboard
// app/tools/kids-birthday-planner/_components/party-dashboard.tsx
//
// Sections:
//   Overview  — party summary, invite link copy, QR-style share
//   Guests    — RSVP list with status badges, add guest, live counts
//   Checklist — tickable items with progress bar
//   Songs     — AI-suggested + guest requested songs
//   Plan View — the generated party plan (read-only)
//   Day Mode  — live check-in tracker with timers
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                   from "framer-motion";
import {
  Users, Check, Copy, Share2, Loader2, Trash2, ChevronDown,
  ChevronUp, Plus, Music, PartyPopper, Clock, Zap, Star,
  AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, X,
  Heart, UserCheck, UserX, MapPin, Calendar, Send, Gift,
  DollarSign, UtensilsCrossed, Timer,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Party {
  id:           string;
  childName:    string;
  childAge:     number;
  partyDate:    string;
  theme:        string;
  customTheme?: string;
  numKids:      number;
  budgetRange:  string;
  indoor:       boolean;
  status:       "DRAFT" | "ACTIVE" | "DAY_OF" | "COMPLETED";
  inviteToken:  string;
  planJson?:    string;
  city?:        string;
  country:      string;
  locationName?: string;
  guests:       Guest[];
  checklist:    ChecklistItem[];
  songs:        Song[];
}

interface Guest {
  id:          string;
  childName:   string;
  parentName?: string;
  parentEmail?: string;
  allergies?:  string;
  rsvpNote?:   string;
  arrivalNote?: string;
  status:      "PENDING" | "ACCEPTED" | "DECLINED" | "CHECKED_IN" | "CHECKED_OUT";
  rsvpAt?:     string;
  checkedInAt?: string;
  photoConsent: boolean;
  digitalTag?: string;
}

interface ChecklistItem {
  id:       string;
  text:     string;
  category: string;
  isDone:   boolean;
  sortOrder: number;
}

interface Song {
  id:          string;
  title:       string;
  artist?:     string;
  suggestedBy: string;
  isApproved:  boolean;
  upvotes:     number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#f43f5e";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:     { label: "Invited",      color: "#6b7280", bg: "#f3f4f6", icon: Clock },
  ACCEPTED:    { label: "Coming! 🎉",   color: "#059669", bg: "#d1fae5", icon: CheckCircle2 },
  DECLINED:    { label: "Can't make it",color: "#dc2626", bg: "#fee2e2", icon: UserX },
  CHECKED_IN:  { label: "Here! 🎈",    color: "#7c3aed", bg: "#ede9fe", icon: UserCheck },
  CHECKED_OUT: { label: "Left",         color: "#6b7280", bg: "#f3f4f6", icon: UserX },
};

const CHECKLIST_CAT_COLOR: Record<string, string> = {
  invites: "#6366f1", food: "#f97316", decorations: "#ec4899",
  activities: "#3b82f6", "on-the-day": "#f43f5e", general: "#6b7280",
};

const CHECKLIST_CAT_ICON: Record<string, string> = {
  invites: "📨", food: "🍕", decorations: "🎨", activities: "🎮",
  "on-the-day": "🎉", general: "✅",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function isPartyDay(dateStr: string) {
  const d = new Date(dateStr); const now = new Date();
  return d.toDateString() === now.toDateString();
}

// ─── Guest Card ───────────────────────────────────────────────────────────────

function GuestCard({ guest, onUpdate, onDelete, partyStatus }: {
  guest:      Guest;
  onUpdate:   (id: string, data: Partial<Guest>) => void;
  onDelete:   (id: string) => void;
  partyStatus: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const cfg = STATUS_CFG[guest.status] ?? STATUS_CFG.PENDING;

  const update = async (action: string, extra?: any) => {
    setLoading(true);
    const res = await fetch(`/api/tools/birthday-planner/guests/${guest.id}?action=${action}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(extra ?? {}),
    });
    const data = await res.json();
    if (data.guest) onUpdate(guest.id, data.guest);
    setLoading(false);
  };

  const del = async () => {
    setLoading(true);
    await fetch(`/api/tools/birthday-planner/guests/${guest.id}`, { method: "DELETE" });
    onDelete(guest.id);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden">
      <button onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ backgroundColor: ACCENT }}>
          {guest.childName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-stone-900">{guest.childName}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
            {guest.allergies && <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">⚠️ Allergies</span>}
            {guest.photoConsent && <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-sm">📸</span>}
          </div>
          {guest.parentName && <p className="text-xs text-stone-400 mt-0.5">Parent: {guest.parentName}</p>}
        </div>
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-stone-300 flex-shrink-0" />
          : expanded ? <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 space-y-3 bg-stone-50/30">
              {guest.allergies && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-sm px-3 py-2">⚠️ <strong>Allergies:</strong> {guest.allergies}</p>}
              {guest.rsvpNote  && <p className="text-xs text-stone-600 bg-white border border-stone-100 rounded-sm px-3 py-2">💬 {guest.rsvpNote}</p>}
              {guest.arrivalNote && <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-sm px-3 py-2">⏰ {guest.arrivalNote}</p>}
              {guest.digitalTag && <p className="text-xs text-stone-500 italic">{guest.digitalTag}</p>}
              {guest.checkedInAt && <p className="text-xs text-purple-600">✅ Checked in: {fmtTime(guest.checkedInAt)}</p>}
              <div className="flex gap-2 flex-wrap">
                {guest.status === "ACCEPTED" && partyStatus === "DAY_OF" && (
                  <button onClick={() => update("checkin")} disabled={loading}
                    className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm transition-colors" style={{ backgroundColor: "#7c3aed" }}>
                    <UserCheck className="w-3.5 h-3.5" />Check In
                  </button>
                )}
                {guest.status === "CHECKED_IN" && (
                  <button onClick={() => update("checkin")} disabled={loading}
                    className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm transition-colors bg-stone-600">
                    <UserX className="w-3.5 h-3.5" />Check Out
                  </button>
                )}
                {guest.status === "PENDING" && (
                  <>
                    <button onClick={() => update("update", { status: "ACCEPTED" })} disabled={loading}
                      className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm transition-colors bg-emerald-500">
                      <Check className="w-3.5 h-3.5" />Mark Accepted
                    </button>
                    <button onClick={() => update("decline")} disabled={loading}
                      className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm transition-colors bg-red-400">
                      <X className="w-3.5 h-3.5" />Mark Declined
                    </button>
                  </>
                )}
                <button onClick={del} disabled={loading}
                  className="text-xs text-stone-300 hover:text-red-500 ml-auto transition-colors flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Add Guest Form ────────────────────────────────────────────────────────────

function AddGuestForm({ partyId, onAdd }: { partyId: string; onAdd: (g: Guest) => void }) {
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState("");
  const [parent,  setParent]  = useState("");
  const [allergy, setAllergy] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const res  = await fetch("/api/tools/birthday-planner/guests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId, childName: name, parentName: parent, allergies: allergy, status: "PENDING" }),
    });
    const data = await res.json();
    if (data.guest) { onAdd(data.guest); setName(""); setParent(""); setAllergy(""); setOpen(false); }
    setLoading(false);
  };

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-bold text-rose-600 border border-dashed border-rose-300 hover:border-rose-400 hover:bg-rose-50 w-full py-3 rounded-sm transition-colors justify-center">
          <Plus className="w-4 h-4" />Add Guest
        </button>
      ) : (
        <div className="bg-white border border-stone-200 rounded-sm p-4 space-y-3">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Add a guest manually</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Child's name *"
            className="w-full bg-stone-50 border border-stone-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-400" />
          <input value={parent} onChange={e => setParent(e.target.value)} placeholder="Parent's name (optional)"
            className="w-full bg-stone-50 border border-stone-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-400" />
          <input value={allergy} onChange={e => setAllergy(e.target.value)} placeholder="Allergies (optional)"
            className="w-full bg-stone-50 border border-stone-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-400" />
          <div className="flex gap-2">
            <button onClick={submit} disabled={loading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white py-2 rounded-sm disabled:opacity-60 transition-colors"
              style={{ backgroundColor: ACCENT }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add
            </button>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-stone-400 hover:text-stone-700 border border-stone-200 rounded-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Day Mode Timer ────────────────────────────────────────────────────────────

function DayModeTimer({ schedule }: { schedule: any[] }) {
  const [active,  setActive]  = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <div className="bg-stone-900 text-white rounded-sm p-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-2">
          {active !== null && schedule[active] ? schedule[active].title : "Select an activity"}
        </p>
        <p className="text-5xl font-black font-mono text-rose-300">{fmt(seconds)}</p>
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={() => setRunning(p => !p)}
            className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2 rounded-sm border border-white/20 hover:bg-white/10 transition-colors">
            {running ? "Pause ⏸" : "Start ▶"}
          </button>
          <button onClick={() => { setSeconds(0); setRunning(false); }}
            className="text-sm text-white/40 hover:text-white transition-colors">Reset</button>
        </div>
      </div>
      <div className="space-y-1.5">
        {schedule.map((s: any, i: number) => (
          <button key={i} onClick={() => { setActive(i); setSeconds(0); setRunning(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm border text-left transition-all ${active === i ? "border-rose-300 bg-rose-50" : "bg-white border-stone-100 hover:border-stone-300"}`}>
            <span className="text-lg">{s.type === "cake" ? "🎂" : s.type === "game" ? "🎮" : s.type === "food" ? "🍕" : "🎉"}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-stone-800">{s.title}</p>
              <p className="text-xs text-stone-400">{s.time} · {s.duration}</p>
            </div>
            {active === i && running && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export function PartyDashboard({ initialParty }: { initialParty: Party }) {
  const [party,    setParty]    = useState<Party>(initialParty);
  const [guests,   setGuests]   = useState<Guest[]>(initialParty.guests ?? []);
  const [checklist,setChecklist]= useState<ChecklistItem[]>(initialParty.checklist ?? []);
  const [songs,    setSongs]    = useState<Song[]>(initialParty.songs ?? []);
  const [tab,      setTab]      = useState<"overview" | "guests" | "checklist" | "songs" | "plan" | "daymode">("overview");
  const [copying,  setCopying]  = useState(false);
  const [newSong,  setNewSong]  = useState("");
  const [addingSong,setAddingSong]= useState(false);
  const [loading,  setLoading]  = useState(false);

  const plan = React.useMemo(() => {
    if (!party.planJson) return null;
    try { return JSON.parse(party.planJson); } catch { return null; }
  }, [party.planJson]);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tools/kids-birthday-planner/invite/${party.inviteToken}`
    : `/tools/kids-birthday-planner/invite/${party.inviteToken}`;

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopying(true); setTimeout(() => setCopying(false), 2000);
  };

  const updateStatus = async (status: string) => {
    setLoading(true);
    await fetch(`/api/tools/birthday-planner/parties/${party.id}?action=status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    setParty(p => ({ ...p, status: status as any }));
    setLoading(false);
  };

  const toggleChecklist = async (id: string, isDone: boolean) => {
    setChecklist(p => p.map(c => c.id === id ? { ...c, isDone } : c));
    await fetch(`/api/tools/birthday-planner/checklist?id=${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDone }),
    }).catch(() => {});
  };

  const addSong = async () => {
    if (!newSong.trim()) return;
    setAddingSong(true);
    const res  = await fetch("/api/tools/birthday-planner/songs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId: party.id, title: newSong, suggestedBy: "Organiser", isApproved: true }),
    });
    const data = await res.json();
    if (data.song) { setSongs(p => [...p, data.song]); setNewSong(""); }
    setAddingSong(false);
  };

  const toggleSongApproval = async (id: string) => {
    await fetch(`/api/tools/birthday-planner/songs?id=${id}&action=approve`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
    });
    setSongs(p => p.map(s => s.id === id ? { ...s, isApproved: !s.isApproved } : s));
  };

  const guestStats = {
    total:      guests.length,
    accepted:   guests.filter(g => ["ACCEPTED", "CHECKED_IN", "CHECKED_OUT"].includes(g.status)).length,
    declined:   guests.filter(g => g.status === "DECLINED").length,
    checkedIn:  guests.filter(g => g.status === "CHECKED_IN").length,
    allergies:  guests.filter(g => g.allergies),
  };

  const checklistPct = checklist.length ? Math.round((checklist.filter(c => c.isDone).length / checklist.length) * 100) : 0;
  const partyDay     = isPartyDay(party.partyDate);
  const themeName    = party.customTheme || party.theme;

  const TABS = [
    { id: "overview",  label: "Overview",  icon: PartyPopper },
    { id: "guests",    label: `Guests (${guestStats.accepted})`, icon: Users },
    { id: "checklist", label: `Checklist (${checklistPct}%)`, icon: Check },
    { id: "songs",     label: `Songs (${songs.filter(s=>s.isApproved).length})`, icon: Music },
    ...(plan ? [{ id: "plan", label: "Full Plan", icon: Zap }] : []),
    ...(partyDay ? [{ id: "daymode", label: "🎉 Day Mode", icon: Timer }] : []),
  ] as const;

  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Party header */}
      <div className="text-white rounded-sm p-5" style={{ backgroundColor: "#1c0a0e" }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{themeName} Party</p>
            <p className="text-2xl font-black">🎂 {party.childName}'s Birthday</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/50 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(party.partyDate)}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{party.city || party.country}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{party.numKids} kids</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm ${
              party.status === "DAY_OF" ? "bg-rose-500 text-white" :
              party.status === "ACTIVE" ? "bg-emerald-500 text-white" :
              "bg-white/10 text-white/60"
            }`}>{party.status}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Coming",    value: guestStats.accepted, color: "#10b981" },
            { label: "Declined",  value: guestStats.declined, color: "#ef4444" },
            { label: "Checked in",value: guestStats.checkedIn,color: "#7c3aed" },
            { label: "Tasks done",value: `${checklistPct}%`,  color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-center">
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Invite link */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-xs text-white/50 truncate font-mono">
            {inviteUrl}
          </div>
          <button onClick={copyInvite}
            className="flex items-center gap-1.5 text-xs font-bold text-white border border-white/20 hover:bg-white/10 px-3 py-2 rounded-sm transition-colors whitespace-nowrap">
            {copying ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copying ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Status controls */}
      {party.status === "DRAFT" && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Ready to send invites?</p>
            <p className="text-xs text-amber-600">Share the invite link above — once guests RSVP, switch to Active.</p>
          </div>
          <button onClick={() => updateStatus("ACTIVE")} disabled={loading}
            className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2 rounded-sm transition-colors" style={{ backgroundColor: ACCENT }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Go Live
          </button>
        </div>
      )}
      {party.status === "ACTIVE" && partyDay && (
        <div className="border rounded-sm p-4 flex items-center gap-4 flex-wrap" style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
          <div className="flex-1">
            <p className="text-sm font-black" style={{ color: ACCENT }}>🎉 It's party day!</p>
            <p className="text-xs text-stone-600">Switch to Day Mode to enable guest check-in and activity timers.</p>
          </div>
          <button onClick={() => updateStatus("DAY_OF")} disabled={loading}
            className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2 rounded-sm transition-colors" style={{ backgroundColor: ACCENT }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Start Day Mode
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              tab === t.id ? "border-rose-500 text-rose-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {guestStats.allergies.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
              <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">⚠️ Allergy Alerts</p>
              <div className="space-y-1">
                {guestStats.allergies.map(g => (
                  <p key={g.id} className="text-xs text-amber-800"><strong>{g.childName}:</strong> {g.allergies}</p>
                ))}
              </div>
            </div>
          )}
          {plan?.hostTips?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Host Tips</p>
              <ul className="space-y-2">
                {plan.hostTips.map((t: string, i: number) => <li key={i} className="text-sm text-stone-700 flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />{t}</li>)}
              </ul>
            </div>
          )}
          {plan?.emergencyKit?.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-2">🎒 Emergency Kit</p>
              <div className="flex flex-wrap gap-2">
                {plan.emergencyKit.map((e: string, i: number) => <span key={i} className="text-xs text-amber-800 bg-white border border-amber-200 px-2 py-1 rounded-sm">{e}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GUESTS ────────────────────────────────── */}
      {tab === "guests" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-3 text-sm flex-wrap">
              <span className="text-emerald-600 font-bold">{guestStats.accepted} coming</span>
              <span className="text-red-400">{guestStats.declined} declined</span>
              <span className="text-stone-400">{guests.filter(g => g.status === "PENDING").length} pending</span>
            </div>
          </div>
          <AnimatePresence>
            {guests.map(g => (
              <GuestCard key={g.id} guest={g} partyStatus={party.status}
                onUpdate={(id, data) => setGuests(p => p.map(x => x.id === id ? { ...x, ...data } : x))}
                onDelete={id => setGuests(p => p.filter(x => x.id !== id))} />
            ))}
          </AnimatePresence>
          <AddGuestForm partyId={party.id} onAdd={g => setGuests(p => [...p, g])} />
        </div>
      )}

      {/* ── CHECKLIST ─────────────────────────────── */}
      {tab === "checklist" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ backgroundColor: ACCENT, width: `${checklistPct}%` }} />
            </div>
            <span className="text-sm font-bold" style={{ color: ACCENT }}>{checklistPct}%</span>
          </div>
          {Object.entries(
            checklist.reduce((acc, item) => {
              const cat = item.category || "general";
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(item);
              return acc;
            }, {} as Record<string, ChecklistItem[]>)
          ).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{CHECKLIST_CAT_ICON[cat] ?? "✅"}</span>
                <span style={{ color: CHECKLIST_CAT_COLOR[cat] ?? "#6b7280" }}>{cat}</span>
              </p>
              <div className="space-y-1.5">
                {items.map(item => (
                  <button key={item.id} onClick={() => toggleChecklist(item.id, !item.isDone)}
                    className={`w-full flex items-start gap-3 text-left px-4 py-3 rounded-sm border transition-all ${item.isDone ? "bg-stone-50 border-stone-100" : "bg-white border-stone-100 hover:border-stone-300"}`}>
                    <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${item.isDone ? "border-transparent" : "border-stone-300"}`}
                      style={item.isDone ? { backgroundColor: ACCENT } : {}}>
                      {item.isDone && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm leading-snug ${item.isDone ? "line-through text-stone-400" : "text-stone-700"}`}>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SONGS ─────────────────────────────────── */}
      {tab === "songs" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={newSong} onChange={e => setNewSong(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSong()}
              placeholder="Add a song… e.g. Happy by Pharrell"
              className="flex-1 bg-stone-50 border border-stone-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-400" />
            <button onClick={addSong} disabled={addingSong || !newSong.trim()}
              className="flex items-center gap-1 text-sm font-bold text-white px-4 py-2 rounded-sm transition-colors disabled:opacity-60" style={{ backgroundColor: ACCENT }}>
              {addingSong ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add
            </button>
          </div>
          <p className="text-[10px] text-stone-400 uppercase tracking-wider">
            {songs.filter(s => s.isApproved).length} approved · {songs.filter(s => !s.isApproved).length} pending
          </p>
          <div className="space-y-2">
            {songs.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-3 bg-white border rounded-sm px-4 py-3 transition-all ${s.isApproved ? "border-stone-100" : "border-amber-200"}`}>
                <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-xs font-black text-rose-500 flex-shrink-0">{i+1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{s.title}</p>
                  <p className="text-xs text-stone-400">by {s.suggestedBy} {s.upvotes > 0 ? `· 👍 ${s.upvotes}` : ""}</p>
                </div>
                <button onClick={() => toggleSongApproval(s.id)}
                  className={`text-xs font-bold px-2 py-1 rounded-sm border transition-colors ${s.isApproved ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-stone-400 bg-stone-50 border-stone-200 hover:border-emerald-300"}`}>
                  {s.isApproved ? "✓ Approved" : "Approve"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PLAN ──────────────────────────────────── */}
      {tab === "plan" && plan && (
        <div className="space-y-4">
          {plan.schedule?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Party Schedule</p>
              <div className="space-y-2">
                {plan.schedule.map((s: any, i: number) => (
                  <div key={i} className="flex gap-3 items-start bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <div className="w-14 flex-shrink-0 text-center">
                      <p className="text-xs font-black text-rose-500">{s.time}</p>
                      <p className="text-[10px] text-stone-400">{s.duration}</p>
                    </div>
                    <div><p className="text-sm font-bold text-stone-900">{s.title}</p><p className="text-xs text-stone-500">{s.description}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DAY MODE ──────────────────────────────── */}
      {tab === "daymode" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Checked in", value: guestStats.checkedIn, color: "#7c3aed" },
              { label: "Expected",   value: guestStats.accepted,   color: "#10b981" },
              { label: "Not yet",    value: guestStats.accepted - guestStats.checkedIn, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4 text-center">
                <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-stone-400 font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {guests.filter(g => g.status === "ACCEPTED").length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Quick check-in</p>
              <div className="space-y-2">
                {guests.filter(g => g.status === "ACCEPTED").map(g => (
                  <div key={g.id} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ backgroundColor: ACCENT }}>
                      {g.childName.charAt(0)}
                    </div>
                    <p className="flex-1 text-sm font-semibold text-stone-800">{g.childName}</p>
                    <button onClick={async () => {
                      const res = await fetch(`/api/tools/birthday-planner/guests/${g.id}?action=checkin`, {
                        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
                      });
                      const data = await res.json();
                      if (data.guest) setGuests(p => p.map(x => x.id === g.id ? { ...x, ...data.guest } : x));
                    }}
                      className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm transition-colors"
                      style={{ backgroundColor: "#7c3aed" }}>
                      <UserCheck className="w-3.5 h-3.5" />Check In
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {plan?.schedule && <DayModeTimer schedule={plan.schedule} />}
        </div>
      )}
    </div>
  );
}