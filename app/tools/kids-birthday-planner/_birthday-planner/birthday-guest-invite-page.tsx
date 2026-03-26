"use client";

// =============================================================================
// isaacpaha.com — Birthday Planner — Smart Guest Invite Page (Authenticated)
// app/tools/kids-birthday-planner/_components/guest-invite-page.tsx
//
// Requires Clerk sign-in for RSVP. This means:
//   • Each guest row is linked to a unique Clerk ID (guestClerkId field)
//   • State persists across refreshes — server pre-loads existing RSVP
//   • Secure: guests only see their own data
//
// 4 smart stages (same URL, driven by party.status + existingGuest state):
//   INVITE     → Sign-in gate → themed invite card → RSVP form
//   DASHBOARD  → Accepted: who's coming, countdown, song requests, edit RSVP
//   DECLINED   → "Thanks for letting us know" + change-mind button
//   CHECKIN    → Party day: "I'm Here!" + checkout
// =============================================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence }     from "framer-motion";
import {
  Check, X, Music, Plus, Clock, MapPin, Calendar,
  Loader2, UserCheck, PartyPopper, ChevronDown, ChevronUp,
  AlertTriangle, RefreshCw, LogIn, Edit2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicParty {
  id:             string;
  childName:      string;
  childAge:       number;
  partyDate:      string;
  partyEndTime?:  string | null;
  locationName?:  string | null;
  city?:          string | null;
  country:        string;
  theme:          string;
  customTheme?:   string | null;
  indoor:         boolean;
  status:         "DRAFT" | "ACTIVE" | "DAY_OF" | "COMPLETED";
  inviteToken:    string;
  inviteMessage?: string | null;
}

interface PublicGuest {
  id:               string;
  childName:        string;
  parentName?:      string | null;
  allergies?:       string | null;
  rsvpNote?:        string | null;
  status:           "PENDING" | "ACCEPTED" | "DECLINED" | "CHECKED_IN" | "CHECKED_OUT";
  checkedInAt?:     string | null;
  photoConsent:     boolean;
  photoShareConsent:boolean;
  digitalTag?:      string | null;
}

interface Song {
  id:          string;
  title:       string;
  artist?:     string;
  suggestedBy: string;
  upvotes:     number;
  isApproved:  boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#f43f5e";
const THEME_EMOJIS: Record<string, string> = {
  Princess: "👑", Superhero: "🦸", Football: "⚽", Dinosaur: "🦕",
  Unicorn: "🦄", Space: "🚀", Animals: "🐾", Gaming: "🎮",
  Minecraft: "⛏", Mermaid: "🧜", Disney: "🏰",
};

function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function fmtTime(d: string) { return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
function getCountdown(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days} day${days !== 1 ? "s" : ""} to go! 🎉`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} to go! 🎈`;
  return "Starting soon! 🚀";
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function ConfettiBurst() {
  const pieces = Array.from({ length: 22 }, (_, i) => ({
    color: ["#f43f5e","#f59e0b","#10b981","#6366f1","#ec4899","#fbbf24"][i % 6],
    x: (Math.random() - 0.5) * 320, y: (Math.random() - 1.2) * 280,
    rotate: Math.random() * 720, scale: 0.4 + Math.random() * 1,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.div key={i} initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotate }}
          transition={{ duration: 1.2 + Math.random() * 0.6, ease: "easeOut" }}
          className="absolute w-3 h-3 rounded-sm" style={{ backgroundColor: p.color }} />
      ))}
    </div>
  );
}

// ─── Sign-In Gate ─────────────────────────────────────────────────────────────

function SignInGate({ party, token }: { party: PublicParty; token: string }) {
  const emoji     = THEME_EMOJIS[party.theme] ?? "🎉";
  const themeName = party.customTheme || party.theme;
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(`/tools/kids-birthday-planner/invite/${token}`)}`;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="border-2 rounded-sm p-5 text-center" style={{ borderColor: ACCENT, backgroundColor: `${ACCENT}06` }}>
        <p className="text-4xl mb-3">{emoji}</p>
        <h2 className="text-2xl font-black text-stone-900 mb-1">{party.childName}'s {themeName} Party</h2>
        <p className="text-lg font-bold mb-4" style={{ color: ACCENT }}>Turning {party.childAge}! 🎂</p>
        <div className="space-y-2 text-sm text-stone-600">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
            {fmtDate(party.partyDate)} at {fmtTime(party.partyDate)}
          </div>
          {(party.locationName || party.city) && (
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
              {party.locationName || party.city}
            </div>
          )}
        </div>
      </div>
      <div className="text-center space-y-4">
        <p className="text-base font-black text-stone-900">Sign in to RSVP</p>
        <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
          Your RSVP is saved securely to your account — even if you close the page and come back, we'll remember your answer.
        </p>
        <a href={signInUrl}
          className="flex items-center justify-center gap-2 text-base font-bold text-white py-4 px-8 rounded-sm mx-auto transition-colors shadow-sm"
          style={{ backgroundColor: ACCENT }}>
          <LogIn className="w-5 h-5" />Sign in to accept
        </a>
        <p className="text-xs text-stone-400">Free · 30 seconds · No spam</p>
      </div>
      {party.inviteMessage && (
        <div className="bg-stone-50 border border-stone-100 rounded-sm px-5 py-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider font-black mb-2">From the host</p>
          <p className="text-sm text-stone-600 leading-relaxed italic whitespace-pre-wrap">{party.inviteMessage}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── RSVP Form ────────────────────────────────────────────────────────────────

function RSVPForm({ token, party, existingGuest, onComplete }: {
  token:         string;
  party:         PublicParty;
  existingGuest: PublicGuest | null;
  onComplete:    (guest: PublicGuest, accepted: boolean) => void;
}) {
  const [childName,         setChildName]         = useState(existingGuest?.childName ?? "");
  const [parentName,        setParentName]         = useState(existingGuest?.parentName ?? "");
  const [allergies,         setAllergies]          = useState(existingGuest?.allergies ?? "");
  const [rsvpNote,          setRsvpNote]           = useState(existingGuest?.rsvpNote ?? "");
  const [photoConsent,      setPhotoConsent]       = useState(existingGuest?.photoConsent ?? false);
  const [photoShareConsent, setPhotoShareConsent]  = useState(existingGuest?.photoShareConsent ?? false);
  const [decision,          setDecision]           = useState<"accept" | "decline" | null>(
    existingGuest?.status === "ACCEPTED" ? "accept" :
    existingGuest?.status === "DECLINED" ? "decline" : null
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const isUpdate  = !!existingGuest;
  const emoji     = THEME_EMOJIS[party.theme] ?? "🎉";
  const themeName = party.customTheme || party.theme;

  const submit = async () => {
    if (!childName.trim() || !decision) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/tools/birthday-planner/my-rsvp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token, childName, parentName, allergies, rsvpNote,
          status: decision === "accept" ? "ACCEPTED" : "DECLINED",
          photoConsent, photoShareConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setLoading(false); return; }
      onComplete(data.guest, decision === "accept");
    } catch { setError("Connection error — please try again."); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="text-center">
        <p className="text-4xl mb-2">{emoji}</p>
        <h2 className="text-2xl font-black text-stone-900">{isUpdate ? "Update your RSVP" : "You're invited! 🎉"}</h2>
        {isUpdate && <p className="text-sm text-stone-400 mt-1">Your previous RSVP is pre-filled — change anything below</p>}
      </div>
      {/* Party card */}
      <div className="border-2 rounded-sm p-5" style={{ borderColor: ACCENT, backgroundColor: `${ACCENT}06` }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="text-base font-black text-stone-900">{party.childName}'s {themeName} Party</p>
            <p className="text-xs text-stone-400">Turning {party.childAge}!</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-stone-700">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />{fmtDate(party.partyDate)}</div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />{fmtTime(party.partyDate)}</div>
          {(party.locationName || party.city) && (
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />{party.locationName || party.city} {party.indoor ? "🏠" : "🌳"}</div>
          )}
        </div>
        {party.inviteMessage && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: `${ACCENT}30` }}>
            <p className="text-xs text-stone-500 leading-relaxed italic">{party.inviteMessage}</p>
          </div>
        )}
      </div>
      {/* Decision */}
      <div>
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Can you come? *</p>
        <div className="flex gap-3">
          <button onClick={() => setDecision("accept")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-sm border-2 transition-all ${decision === "accept" ? "border-transparent text-white" : "bg-white border-stone-200 text-stone-600 hover:border-emerald-300"}`}
            style={decision === "accept" ? { backgroundColor: "#10b981" } : {}}>
            <Check className="w-4 h-4" />Yes, we'll be there! 🎉
          </button>
          <button onClick={() => setDecision("decline")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-sm border-2 transition-all ${decision === "decline" ? "border-transparent text-white bg-stone-400" : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"}`}>
            <X className="w-4 h-4" />Can't make it
          </button>
        </div>
      </div>
      {/* Child name */}
      <div>
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Child's Name *</p>
        <input value={childName} onChange={e => setChildName(e.target.value)} placeholder="e.g. Jake"
          className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
      </div>
      {decision === "accept" && (
        <>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Parent's Name (optional)</p>
            <input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Your name"
              className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Allergies / Dietary needs</p>
            <input value={allergies} onChange={e => setAllergies(e.target.value)}
              placeholder="e.g. nut allergy — or leave blank"
              className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Note for the host</p>
            <textarea value={rsvpNote} onChange={e => setRsvpNote(e.target.value)} rows={2}
              placeholder={"\"Will arrive a bit late\" · \"My child is shy at first\""}
              className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-rose-400 resize-none" />
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-sm p-4 space-y-3">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">📸 Photo Consent (optional)</p>
            {[
              { state: photoConsent,      set: setPhotoConsent,      label: "I'm happy for photos/videos of my child at the party" },
              { state: photoShareConsent, set: setPhotoShareConsent, label: "Photos can be shared with other parents" },
            ].map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <div onClick={() => item.set((p: boolean) => !p)}
                  className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all ${item.state ? "border-transparent" : "border-stone-300"}`}
                  style={item.state ? { backgroundColor: ACCENT } : {}}>
                  {item.state && <Check className="w-3 h-3 text-white" />}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{item.label}</p>
              </label>
            ))}
          </div>
        </>
      )}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}
      <button onClick={submit} disabled={loading || !childName.trim() || !decision}
        className={`w-full flex items-center justify-center gap-2 text-base font-bold text-white py-4 rounded-sm transition-colors disabled:opacity-40 ${decision === "decline" ? "bg-stone-400" : ""}`}
        style={!decision || decision === "accept" ? { backgroundColor: ACCENT } : {}}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : decision === "accept" ? <PartyPopper className="w-5 h-5" /> : <X className="w-5 h-5" />}
        {loading ? "Saving…" : isUpdate ? "Update my RSVP" : decision === "accept" ? "Confirm — I'm coming! 🎉" : "Send my response"}
      </button>
    </motion.div>
  );
}

// ─── Accepted Dashboard ───────────────────────────────────────────────────────

function AcceptedDashboard({ token, party, myGuest, onEdit }: {
  token:   string;
  party:   PublicParty;
  myGuest: PublicGuest;
  onEdit:  () => void;
}) {
  const [guests,  setGuests]  = useState<PublicGuest[]>([]);
  const [songs,   setSongs]   = useState<Song[]>([]);
  const [newSong, setNewSong] = useState("");
  const [adding,  setAdding]  = useState(false);
  const [songOpen,setSongOpen]= useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tools/birthday-planner/guests?partyId=${party.id}`).then(r => r.json()),
      fetch(`/api/tools/birthday-planner/songs?token=${token}`).then(r => r.json()),
    ]).then(([g, s]) => {
      setGuests((g.guests ?? []).filter((x: any) => ["ACCEPTED","CHECKED_IN","CHECKED_OUT"].includes(x.status)));
      setSongs((s.songs ?? []).filter((x: Song) => x.isApproved));
    }).catch(() => {});
  }, [party.id, token]);

  const submitSong = async () => {
    if (!newSong.trim()) return;
    setAdding(true);
    const res  = await fetch("/api/tools/birthday-planner/songs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteToken: token, title: newSong, suggestedBy: myGuest.childName }),
    });
    const data = await res.json();
    if (data.song) { setSongs(p => [...p, data.song]); setNewSong(""); }
    setAdding(false);
  };

  const cntdown   = getCountdown(party.partyDate);
  const emoji     = THEME_EMOJIS[party.theme] ?? "🎉";
  const themeName = party.customTheme || party.theme;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="text-center bg-emerald-50 border-2 border-emerald-200 rounded-sm p-5">
        <p className="text-3xl mb-2">🎉</p>
        <p className="text-xl font-black text-emerald-800">{myGuest.childName} is coming!</p>
        {cntdown && <p className="text-2xl font-black mt-2" style={{ color: ACCENT }}>{cntdown}</p>}
        <p className="text-sm text-emerald-600 mt-1">{party.childName}'s {themeName} Party</p>
      </div>
      <div className="bg-white border border-stone-100 rounded-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="text-base font-black text-stone-900">{party.childName}'s {themeName} Party</p>
            <p className="text-xs text-stone-400">Turning {party.childAge}!</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-stone-700">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />{fmtDate(party.partyDate)} at {fmtTime(party.partyDate)}</div>
          {(party.locationName || party.city) && (
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />{party.locationName || party.city}</div>
          )}
        </div>
        {myGuest.allergies && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-sm px-3 py-2">⚠️ Allergy noted: <strong>{myGuest.allergies}</strong></p>
          </div>
        )}
      </div>
      {guests.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-sm p-5">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">{guests.length} friend{guests.length !== 1 ? "s" : ""} coming 🎈</p>
          <div className="flex flex-wrap gap-2">
            {guests.map(g => (
              <span key={g.id}
                className={`text-sm font-semibold px-3 py-1.5 rounded-sm border ${g.id === myGuest.id ? "text-white border-transparent" : "border-rose-100 bg-rose-50 text-rose-700"}`}
                style={g.id === myGuest.id ? { backgroundColor: ACCENT } : {}}>
                {g.childName}{g.id === myGuest.id ? " (you! 🎉)" : ""}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Song request */}
      <div className="bg-white border border-stone-100 rounded-sm p-5">
        <button onClick={() => setSongOpen(p => !p)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4" style={{ color: ACCENT }} />
            <p className="text-sm font-black text-stone-900">Request a song 🎵</p>
          </div>
          {songOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>
        <AnimatePresence>
          {songOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="pt-4 space-y-3">
                {songs.length > 0 && (
                  <div className="space-y-1.5">
                    {songs.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center text-[10px] font-black text-rose-500 flex-shrink-0">{i+1}</span>
                        <span className="font-medium text-stone-700">{s.title}</span>
                        {s.artist && <span className="text-xs text-stone-400">— {s.artist}</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={newSong} onChange={e => setNewSong(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submitSong()}
                    placeholder="Song title…"
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-400" />
                  <button onClick={submitSong} disabled={adding || !newSong.trim()}
                    className="flex items-center gap-1 text-sm font-bold text-white px-4 py-2 rounded-sm disabled:opacity-60"
                    style={{ backgroundColor: ACCENT }}>
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onEdit}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors">
          <Edit2 className="w-3.5 h-3.5" />Change my RSVP
        </button>
        <p className="text-xs text-stone-300">See you there! 🎂</p>
      </div>
    </motion.div>
  );
}

// ─── Declined View ────────────────────────────────────────────────────────────

function DeclinedView({ onChangeRSVP }: { onChangeRSVP: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-5">
      <p className="text-5xl">💙</p>
      <div>
        <p className="text-xl font-black text-stone-900">Thanks for letting us know</p>
        <p className="text-sm text-stone-500 mt-2">Sorry you can't make it — hopefully next time!</p>
      </div>
      <button onClick={onChangeRSVP}
        className="flex items-center gap-2 text-sm font-semibold text-stone-500 border border-stone-200 hover:border-stone-400 hover:text-stone-700 px-5 py-3 rounded-sm mx-auto transition-colors">
        <RefreshCw className="w-4 h-4" />Changed your mind? Update RSVP
      </button>
    </motion.div>
  );
}

// ─── Check-In Page ────────────────────────────────────────────────────────────

function CheckInPage({ token, party, myGuest, onCheckin }: {
  token:     string;
  party:     PublicParty;
  myGuest:   PublicGuest | null;
  onCheckin: (g: PublicGuest) => void;
}) {
  const [note,       setNote]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [checkedIn,  setCheckedIn]  = useState(myGuest?.status === "CHECKED_IN");
  const [checkedOut, setCheckedOut] = useState(myGuest?.status === "CHECKED_OUT");

  const doCheckIn = async () => {
    if (!myGuest) return;
    setLoading(true);
    const res  = await fetch(`/api/tools/birthday-planner/guests/${myGuest.id}?action=checkin`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteToken: token, arrivalNote: note }),
    });
    const data = await res.json();
    if (data.guest) { onCheckin(data.guest); setCheckedIn(true); }
    setLoading(false);
  };

  const doCheckOut = async () => {
    if (!myGuest) return;
    setLoading(true);
    await fetch(`/api/tools/birthday-planner/guests/${myGuest.id}?action=checkout`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteToken: token }),
    });
    setCheckedOut(true);
    setLoading(false);
  };

  const emoji     = THEME_EMOJIS[party.theme] ?? "🎉";
  const themeName = party.customTheme || party.theme;

  if (checkedOut) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 space-y-4">
      <p className="text-5xl">👋</p>
      <p className="text-xl font-black text-stone-900">Thanks for coming!</p>
      <p className="text-sm text-stone-500">Hope {myGuest?.childName ?? "you"} had an amazing time! 🎂</p>
    </motion.div>
  );

  if (checkedIn) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-5">
      <p className="text-5xl">🎈</p>
      <div>
        <p className="text-2xl font-black text-stone-900">Welcome, {myGuest?.childName}!</p>
        <p className="text-sm text-stone-500 mt-1">You're checked in — enjoy the party! 🎉</p>
      </div>
      {myGuest && (
        <button onClick={doCheckOut} disabled={loading}
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-5 py-3 rounded-sm mx-auto transition-colors">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Tap when leaving 👋
        </button>
      )}
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="text-center">
        <p className="text-4xl mb-3">{emoji}</p>
        <h2 className="text-2xl font-black text-stone-900">You're here! 🎈</h2>
        <p className="text-sm text-stone-500 mt-1">{party.childName}'s {themeName} Party has started!</p>
      </div>
      <div>
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Any note? (optional)</p>
        <input value={note} onChange={e => setNote(e.target.value)}
          placeholder={"\"Running 5 mins late\" · \"Already inside\""}
          className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
      </div>
      {myGuest ? (
        <button onClick={doCheckIn} disabled={loading}
          className="w-full flex items-center justify-center gap-3 text-lg font-black text-white py-5 rounded-sm transition-colors shadow-sm"
          style={{ backgroundColor: ACCENT }}>
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserCheck className="w-6 h-6" />}
          I'm Here! ✅
        </button>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 text-center">
          <p className="text-sm text-amber-700">Please RSVP first before checking in.</p>
        </div>
      )}
      <p className="text-xs text-stone-400 text-center">This lets {party.childName}'s family know you've arrived 🎉</p>
    </motion.div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export interface GuestInvitePageProps {
  token:         string;
  party:         PublicParty;
  isSignedIn:    boolean;
  clerkUserId:   string | null;
  existingGuest: PublicGuest | null;
}

export function GuestInvitePage({ token, party, isSignedIn, existingGuest }: GuestInvitePageProps) {
  const getInitialStage = (): "invite" | "dashboard" | "declined" | "checkin" => {
    if (party.status === "DAY_OF") return "checkin";
    if (!existingGuest) return "invite";
    if (existingGuest.status === "ACCEPTED" || existingGuest.status === "CHECKED_IN" || existingGuest.status === "CHECKED_OUT") return "dashboard";
    if (existingGuest.status === "DECLINED") return "declined";
    return "invite";
  };

  const [stage,    setStage]    = useState(getInitialStage);
  const [myGuest,  setMyGuest]  = useState<PublicGuest | null>(existingGuest);
  const [confetti, setConfetti] = useState(false);

  const handleRSVP = (guest: PublicGuest, accepted: boolean) => {
    setMyGuest(guest);
    if (accepted) { setConfetti(true); setTimeout(() => setConfetti(false), 2000); setStage("dashboard"); }
    else { setStage("declined"); }
  };

  const emoji     = THEME_EMOJIS[party.theme] ?? "🎉";
  const themeName = party.customTheme || party.theme;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white" style={{ fontFamily: "Sora, sans-serif" }}>
      {confetti && <ConfettiBurst />}
      <div className="h-2 w-full" style={{ backgroundColor: ACCENT }} />
      <div className="max-w-md mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-5xl mb-2">{emoji}</p>
          <h1 className="text-3xl font-black text-stone-900">{party.childName}</h1>
          <p className="text-lg font-bold" style={{ color: ACCENT }}>is turning {party.childAge}! 🎂</p>
          <p className="text-sm text-stone-500 mt-1">{themeName} Party</p>
        </div>

        <AnimatePresence mode="wait">
          {!isSignedIn && (
            <motion.div key="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SignInGate party={party} token={token} />
            </motion.div>
          )}
          {isSignedIn && stage === "checkin" && (
            <motion.div key="checkin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CheckInPage token={token} party={party} myGuest={myGuest} onCheckin={g => setMyGuest(g)} />
            </motion.div>
          )}
          {isSignedIn && stage === "invite" && party.status !== "DAY_OF" && (
            <motion.div key="rsvp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RSVPForm token={token} party={party} existingGuest={myGuest} onComplete={handleRSVP} />
            </motion.div>
          )}
          {isSignedIn && stage === "dashboard" && myGuest && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AcceptedDashboard token={token} party={party} myGuest={myGuest} onEdit={() => setStage("invite")} />
            </motion.div>
          )}
          {isSignedIn && stage === "declined" && (
            <motion.div key="declined" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DeclinedView onChangeRSVP={() => setStage("invite")} />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-stone-300 mt-16">Party planned with isaacpaha.com 🎂</p>
      </div>
    </div>
  );
}