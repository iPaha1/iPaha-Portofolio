"use client";

// =============================================================================
// isaacpaha.com — AI Kids Birthday Planner — Main Tool Component
// app/tools/kids-birthday-planner/_components/birthday-planner-tool.tsx
//
// Flow:
//   STEP 1: Basic Info (child name, age, date, guests)
//   STEP 2: Party Preferences (theme, age group, location, budget, restrictions)
//   STEP 3: Customisation (gender optional, special notes)
//   GENERATE → AI Plan → STEP 4: Full Plan Display
//
// Features: Step progress bar, quick-select chips, AI generation with loading,
//           plan tabs (overview/schedule/food/activities/music/partyBags/budget),
//           save to DB (signed in), copy invite message, share link
// =============================================================================

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence }       from "framer-motion";
import {
  Cake, Users, Calendar, MapPin, Sparkles, Loader2, Check,
  ChevronRight, ChevronLeft, RefreshCw, Copy, Share2,
  Music, UtensilsCrossed, Package, Gift, Clock, Zap,
  Star, DollarSign, ShoppingBag, AlertTriangle, PartyPopper,
  Wand2, Heart, Globe, Home, X, Info, ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartyPlan {
  overview:    { theme: string; tagline: string; duration: string; vibe: string; colourScheme: string[]; decorationIdeas: string[] };
  schedule:    { time: string; duration: string; title: string; description: string; type: string }[];
  activities:  { name: string; duration: string; description: string; materials: string[]; ageNote: string; budgetTip: string; energyLevel: string }[];
  food:        { mainFood: any[]; snacks: any[]; cake: any; drinks: string[]; allergySwaps: string[] };
  partyBags:   { budgetPerBag: string; items: any[]; theme: string; eco: string };
  music:       { vibe: string; suggestedSongs: any[]; playlist: string; tip: string };
  checklist:   { category: string; text: string; weeksBefore: number }[];
  budget:      { total: number; breakdown: any[]; savingTips: string[] };
  inviteMessage: string;
  hostTips:      string[];
  emergencyKit:  string[];
  viralMoment:   string;
}

interface FormData {
  childName:    string;
  childAge:     string;
  partyDate:    string;
  partyTime:    string;
  numKids:      string;
  theme:        string;
  customTheme:  string;
  ageGroup:     string;
  country:      string;
  city:         string;
  locationName?: string;
  indoor:       boolean;
  budgetRange:  string;
  restrictions: string[];
  gender:       string;
  specialNotes: string;
}

const ACCENT  = "#f43f5e";
const INITIAL: FormData = {
  childName: "", childAge: "", partyDate: "", partyTime: "14:00",
  numKids: "10", theme: "", customTheme: "", ageGroup: "6-8",
  country: "UK", city: "", locationName: "", indoor: true, budgetRange: "medium",
  restrictions: [], gender: "", specialNotes: "",
};

// ─── Config ───────────────────────────────────────────────────────────────────

const THEMES = [
  { label: "Princess", emoji: "👑" }, { label: "Superhero", emoji: "🦸" },
  { label: "Football", emoji: "⚽" }, { label: "Dinosaur", emoji: "🦕" },
  { label: "Unicorn", emoji: "🦄" },  { label: "Space", emoji: "🚀" },
  { label: "Animals", emoji: "🐾" },  { label: "Gaming", emoji: "🎮" },
  { label: "Minecraft", emoji: "⛏" }, { label: "Mermaid", emoji: "🧜" },
  { label: "Disney", emoji: "🏰" },   { label: "Custom", emoji: "✨" },
];

const AGE_GROUPS = [
  { id: "3-5",  label: "3–5",  sublabel: "Little ones",   emoji: "🐣" },
  { id: "6-8",  label: "6–8",  sublabel: "School age",    emoji: "🎈" },
  { id: "9-12", label: "9–12", sublabel: "Older kids",    emoji: "🎯" },
];

const BUDGETS = [
  { id: "low",    label: "Low",    sub: "£50–£100",  emoji: "💚" },
  { id: "medium", label: "Medium", sub: "£100–£300", emoji: "💛" },
  { id: "high",   label: "High",   sub: "£300+",     emoji: "🔥" },
];

const RESTRICTIONS_OPTIONS = [
  "No nuts", "No dairy", "Vegetarian", "Vegan", "Halal",
  "Indoor only", "Quiet activities", "No messy games",
  "Educational theme", "Cultural preferences",
];

const ACTIVITY_ICON: Record<string, string> = {
  arrival: "🚪", icebreaker: "👋", game: "🎮", food: "🍕",
  cake: "🎂", craft: "🎨", "free-play": "🎉", goodbye: "👋",
};

const ENERGY_COLOR: Record<string, string> = {
  low: "#10b981", medium: "#f59e0b", high: "#ef4444",
};

const CHECKLIST_CAT_COLOR: Record<string, string> = {
  invites: "#6366f1", food: "#f97316", decorations: "#ec4899",
  activities: "#3b82f6", "on-the-day": "#f43f5e", general: "#6b7280",
};

const CHECKLIST_CAT_ICON: Record<string, string> = {
  invites: "📨", food: "🍕", decorations: "🎨", activities: "🎮",
  "on-the-day": "🎉", general: "✅",
};

// ─── Step Progress Bar ────────────────────────────────────────────────────────

function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all ${
            i + 1 < step ? "text-white" : i + 1 === step ? "text-white ring-2 ring-offset-2" : "bg-stone-100 text-stone-400"
          }`} style={i + 1 <= step ? { backgroundColor: ACCENT, ...(i + 1 === step ? { ringColor: ACCENT } : {}) } : {}}>
            {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: i + 1 < step ? ACCENT : "#e5e7eb" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Field Components ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">{children}</label>;
}

function Input({ ...props }) {
  return (
    <input {...props}
      className={`w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-rose-400 focus:bg-white transition-all ${props.className ?? ""}`}
    />
  );
}

function ChipSelect({ options, selected, onToggle, multi = false }: {
  options: { id: string; label: string; emoji?: string; sub?: string }[];
  selected: string | string[];
  onToggle: (id: string) => void;
  multi?: boolean;
}) {
  const isSelected = (id: string) => Array.isArray(selected) ? selected.includes(id) : selected === id;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.id} type="button" onClick={() => onToggle(o.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-sm border text-sm font-semibold transition-all ${
            isSelected(o.id) ? "text-white border-transparent" : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
          }`}
          style={isSelected(o.id) ? { backgroundColor: ACCENT } : {}}>
          {o.emoji && <span>{o.emoji}</span>}
          <span>{o.label}</span>
          {o.sub && <span className={`text-[11px] ${isSelected(o.id) ? "text-white/70" : "text-stone-400"}`}>{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Plan Section Components ──────────────────────────────────────────────────

function ScheduleCard({ item }: { item: PartyPlan["schedule"][0] }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 text-center w-16">
        <p className="text-xs font-black text-rose-500">{item.time}</p>
        <p className="text-[10px] text-stone-400">{item.duration}</p>
      </div>
      <div className="flex-1 bg-white border border-stone-100 rounded-sm px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span>{ACTIVITY_ICON[item.type] ?? "🎉"}</span>
          <p className="text-sm font-bold text-stone-900">{item.title}</p>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">{item.description}</p>
      </div>
    </div>
  );
}

function ActivityCard({ act }: { act: PartyPlan["activities"][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
      <button onClick={() => setOpen(p => !p)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-stone-50 transition-colors">
        <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>🎯</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-bold text-stone-900">{act.name}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm text-white" style={{ backgroundColor: ENERGY_COLOR[act.energyLevel] ?? "#6b7280" }}>{act.energyLevel}</span>
            <span className="text-[10px] text-stone-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{act.duration}</span>
          </div>
          <p className="text-xs text-stone-500 line-clamp-1">{act.description}</p>
        </div>
        {open ? <ChevronLeft className="w-4 h-4 text-stone-400 rotate-90" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-100 px-4 py-4 space-y-3 bg-stone-50/30">
              <p className="text-sm text-stone-700 leading-relaxed">{act.description}</p>
              {act.materials?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">You'll need</p>
                  <div className="flex flex-wrap gap-1.5">
                    {act.materials.map((m, i) => <span key={i} className="text-xs text-stone-600 bg-white border border-stone-200 px-2 py-1 rounded-sm">{m}</span>)}
                  </div>
                </div>
              )}
              {act.ageNote && <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-sm px-3 py-2">👶 {act.ageNote}</p>}
              {act.budgetTip && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-2">💡 Budget tip: {act.budgetTip}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

// ─── Reopen interface ─────────────────────────────────────────────────────────
// Used by the My Parties dashboard to re-display a saved party plan.

export interface BirthdayReopenData {
  planJson: string;
  formData: {
    childName:   string;
    childAge:    string;
    partyDate:   string;
    numKids:     string;
    theme:       string;
    customTheme: string;
    budgetRange: string;
    indoor:      boolean;
  };
}

export function BirthdayPlannerTool({
  isSignedIn = false,
  reopenData,
  onReopened,
}: {
  isSignedIn?:  boolean;
  reopenData?:  BirthdayReopenData | null;
  onReopened?:  () => void;
}) {
  const [step,     setStep]     = useState<1 | 2 | 3 | "generating" | "plan">(1);
  const [form,     setForm]     = useState<FormData>(INITIAL);
  const [plan,     setPlan]     = useState<PartyPlan | null>(null);
  const [error,    setError]    = useState("");
  const [planTab,  setPlanTab]  = useState<"overview" | "schedule" | "activities" | "food" | "music" | "bags" | "budget" | "checklist">("overview");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [partyId,  setPartyId]  = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [checklist,setChecklist]= useState<{ id?: string; text: string; category: string; isDone: boolean }[]>([]);
  const [loadMsg,  setLoadMsg]  = useState(0);

  // ── Reopen from workspace ────────────────────────────────────────────────────
  useEffect(() => {
    if (!reopenData?.planJson) return;
    try {
      const parsed = JSON.parse(reopenData.planJson) as PartyPlan;
      const fd     = reopenData.formData;
      setForm(p => ({
        ...p,
        childName:    fd.childName    ?? p.childName,
        childAge:     fd.childAge     ?? p.childAge,
        partyDate:    fd.partyDate    ?? p.partyDate,
        numKids:      fd.numKids      ?? p.numKids,
        theme:        fd.theme        ?? p.theme,
        customTheme:  fd.customTheme  ?? p.customTheme,
        budgetRange:  fd.budgetRange  ?? p.budgetRange,
        indoor:       fd.indoor       !== undefined ? fd.indoor : p.indoor,
      }));
      setPlan(parsed);
      setStep("plan");
      setSaved(true);
      setPlanTab("overview");
      onReopened?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { console.error("[BirthdayPlannerTool] reopen failed:", e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reopenData]);

    const LOAD_MSGS = [
    "Choosing the perfect theme colours…",
    "Planning activities for little legends…",
    "Building the party timeline…",
    "Creating the food plan…",
    "Writing your invite message…",
    "Putting the finishing touches…",
  ];

  const set = (field: keyof FormData, val: any) =>
    setForm(p => ({ ...p, [field]: val }));

  const toggleRestriction = (r: string) =>
    setForm(p => ({
      ...p,
      restrictions: p.restrictions.includes(r)
        ? p.restrictions.filter(x => x !== r)
        : [...p.restrictions, r],
    }));

  const generate = async () => {
    setStep("generating"); setError(""); setLoadMsg(0);
    const interval = setInterval(() => setLoadMsg(p => Math.min(p + 1, LOAD_MSGS.length - 1)), 1000);
    try {
      const res  = await fetch("/api/tools/birthday-planner/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName:    form.childName,
          childAge:     Number(form.childAge),
          ageGroup:     form.ageGroup,
          theme:        form.theme,
          customTheme:  form.customTheme,
          numKids:      Number(form.numKids),
          budgetRange:  form.budgetRange,
          country:      form.country,
          city:         form.city,
          indoor:       form.indoor,
          restrictions: form.restrictions,
          specialNotes: form.specialNotes,
        }),
      });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok || !data.plan) { setError(data.error ?? "Generation failed"); setStep(3); return; }
      setPlan(data.plan);
      setChecklist((data.plan.checklist ?? []).map((c: any, i: number) => ({ text: c.text, category: c.category, isDone: false, sortOrder: i })));
      setStep("plan");
    } catch { clearInterval(interval); setError("Network error — please try again."); setStep(3); }
  };

  const savePlan = async () => {
    if (!plan || !isSignedIn) return;
    setSaving(true);
    try {
      const partyDate = form.partyDate
        ? new Date(`${form.partyDate}T${form.partyTime || "14:00"}`)
        : new Date();

      const res  = await fetch("/api/tools/birthday-planner/parties", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, childAge: Number(form.childAge), numKids: Number(form.numKids),
          partyDate: partyDate.toISOString(), plan,
        }),
      });
      const data = await res.json();
      if (res.ok && data.party) { setSaved(true); setPartyId(data.party.id); }
    } catch {}
    setSaving(false);
  };

  const copyInvite = () => {
    if (!plan?.inviteMessage) return;
    const msg = plan.inviteMessage
      .replace("[DATE]", form.partyDate || "TBC")
      .replace("[TIME]", form.partyTime || "2:00 PM")
      .replace("[VENUE]", form.locationName || form.city || "our home")
      .replace("[NAME]", form.childName);
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── STEP 1: Basic Info ────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>
      <StepProgress step={1} total={3} />
      <div>
        <h2 className="text-xl font-black text-stone-900 mb-1">Basic Info</h2>
        <p className="text-sm text-stone-400">Tell us about the birthday star 🌟</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Child's Name *</Label>
          <Input value={form.childName} onChange={(e: any) => set("childName", e.target.value)} placeholder="e.g. Mia" />
        </div>
        <div>
          <Label>Turning Age *</Label>
          <Input type="number" min="1" max="18" value={form.childAge} onChange={(e: any) => set("childAge", e.target.value)} placeholder="e.g. 7" />
        </div>
        <div>
          <Label>Number of Kids</Label>
          <Input type="number" min="1" max="100" value={form.numKids} onChange={(e: any) => set("numKids", e.target.value)} placeholder="10" />
        </div>
        <div>
          <Label>Party Date</Label>
          <Input type="date" value={form.partyDate} onChange={(e: any) => set("partyDate", e.target.value)} />
        </div>
        <div>
          <Label>Start Time</Label>
          <Input type="time" value={form.partyTime} onChange={(e: any) => set("partyTime", e.target.value)} />
        </div>
        <div>
          <Label>Country</Label>
          <Input value={form.country} onChange={(e: any) => set("country", e.target.value)} placeholder="UK" />
        </div>
        <div>
          <Label>City (optional)</Label>
          <Input value={form.city} onChange={(e: any) => set("city", e.target.value)} placeholder="e.g. London" />
        </div>
      </div>
      <div>
        <Label>Location</Label>
        <div className="flex gap-2">
          {[{ id: "indoor", label: "🏠 Indoor", v: true }, { id: "outdoor", label: "🌳 Outdoor", v: false }].map(o => (
            <button key={o.id} type="button" onClick={() => set("indoor", o.v)}
              className={`flex-1 py-3 text-sm font-bold rounded-sm border transition-all ${form.indoor === o.v ? "text-white border-transparent" : "bg-white text-stone-600 border-stone-200"}`}
              style={form.indoor === o.v ? { backgroundColor: ACCENT } : {}}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => { if (!form.childName.trim() || !form.childAge) return; setStep(2); }}
        disabled={!form.childName.trim() || !form.childAge}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white py-4 rounded-sm transition-colors disabled:opacity-40"
        style={{ backgroundColor: ACCENT }}>
        Next: Party Preferences <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  // ── STEP 2: Party Preferences ─────────────────────────────────────────────
  if (step === 2) return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>
      <StepProgress step={2} total={3} />
      <div>
        <h2 className="text-xl font-black text-stone-900 mb-1">Party Preferences</h2>
        <p className="text-sm text-stone-400">Tap to select — fast and easy 🎨</p>
      </div>

      {/* Theme */}
      <div>
        <Label>Theme *</Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {THEMES.map(t => (
            <button key={t.label} type="button"
              onClick={() => set("theme", t.label === "Custom" ? "" : t.label)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-sm border text-sm font-semibold transition-all ${
                (t.label === "Custom" ? form.theme === "" : form.theme === t.label)
                  ? "text-white border-transparent" : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
              style={(t.label === "Custom" ? form.theme === "" : form.theme === t.label) ? { backgroundColor: ACCENT } : {}}>
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>
        {(form.theme === "" || !THEMES.find(t => t.label === form.theme && t.label !== "Custom")) && (
          <Input value={form.customTheme} onChange={(e: any) => set("customTheme", e.target.value)}
            placeholder="e.g. Unicorn Space, Harry Potter, Paw Patrol…" />
        )}
      </div>

      {/* Age group */}
      <div>
        <Label>Guest Age Group</Label>
        <ChipSelect
          options={AGE_GROUPS.map(a => ({ id: a.id, label: a.label, emoji: a.emoji, sub: a.sublabel }))}
          selected={form.ageGroup} onToggle={id => set("ageGroup", id)} />
      </div>

      {/* Budget */}
      <div>
        <Label>Budget Range</Label>
        <ChipSelect
          options={BUDGETS.map(b => ({ id: b.id, label: b.label, emoji: b.emoji, sub: b.sub }))}
          selected={form.budgetRange} onToggle={id => set("budgetRange", id)} />
      </div>

      {/* Restrictions */}
      <div>
        <Label>Restrictions / Preferences (select all that apply)</Label>
        <ChipSelect
          options={RESTRICTIONS_OPTIONS.map(r => ({ id: r, label: r }))}
          selected={form.restrictions} onToggle={toggleRestriction} multi />
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 px-5 py-3 rounded-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />Back
        </button>
        <button onClick={() => setStep(3)}
          disabled={!form.theme && !form.customTheme}
          className="flex-1 flex items-center justify-center gap-2 text-base font-bold text-white py-3 rounded-sm transition-colors disabled:opacity-40"
          style={{ backgroundColor: ACCENT }}>
          Next: Final Details <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ── STEP 3: Customisation ─────────────────────────────────────────────────
  if (step === 3) return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>
      <StepProgress step={3} total={3} />
      <div>
        <h2 className="text-xl font-black text-stone-900 mb-1">Final Details</h2>
        <p className="text-sm text-stone-400">Almost there — these are all optional 🎉</p>
      </div>

      <div>
        <Label>Gender (optional — helps personalise activities)</Label>
        <ChipSelect
          options={[{ id: "Girl", label: "👧 Girl" }, { id: "Boy", label: "👦 Boy" }, { id: "Mixed", label: "👫 Mixed group" }]}
          selected={form.gender} onToggle={id => set("gender", id === form.gender ? "" : id)} />
      </div>

      <div>
        <Label>Special Requests / Notes</Label>
        <textarea value={form.specialNotes} onChange={(e: any) => set("specialNotes", e.target.value)} rows={4}
          placeholder={"\"No messy games\" · \"Educational theme\" · \"Child is shy, gentle icebreakers\" · \"We have a dog, not all kids like dogs\""}
          className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-rose-400 focus:bg-white transition-all resize-none" />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-rose-50 border border-rose-200 rounded-sm p-4">
        <p className="text-sm font-black text-rose-800 mb-1">✨ Ready to generate your party plan!</p>
        <ul className="text-xs text-rose-600 space-y-0.5">
          <li>🎂 <strong>{form.childName}</strong>, turning {form.childAge} · {form.numKids} kids · {form.theme || form.customTheme} theme</li>
          <li>🎯 Age group {form.ageGroup} · {form.budgetRange} budget · {form.indoor ? "Indoor" : "Outdoor"}</li>
          {form.restrictions.length > 0 && <li>🚫 {form.restrictions.join(", ")}</li>}
        </ul>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 px-5 py-3 rounded-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />Back
        </button>
        <button onClick={generate}
          className="flex-1 flex items-center justify-center gap-2 text-base font-bold text-white py-4 rounded-sm transition-colors shadow-sm"
          style={{ backgroundColor: ACCENT }}>
          <Wand2 className="w-5 h-5" />Plan My Party! 🎉
        </button>
      </div>
    </div>
  );

  // ── GENERATING ────────────────────────────────────────────────────────────
  if (step === "generating") return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-rose-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🎂</div>
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.p key={loadMsg} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="text-sm font-semibold text-stone-600">{LOAD_MSGS[loadMsg]}</motion.p>
        </AnimatePresence>
        <p className="text-xs text-stone-400 mt-1">Planning {form.childName}'s perfect party…</p>
      </div>
      <div className="flex gap-1.5">
        {LOAD_MSGS.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadMsg ? "bg-rose-400" : "bg-stone-200"}`} />)}
      </div>
    </div>
  );

  // ── PLAN DISPLAY ──────────────────────────────────────────────────────────
  if (!plan) return null;

  const PLAN_TABS = [
    { id: "overview",    label: "Overview",    icon: PartyPopper },
    { id: "schedule",    label: "Schedule",    icon: Clock       },
    { id: "activities",  label: "Activities",  icon: Zap         },
    { id: "food",        label: "Food",        icon: UtensilsCrossed },
    { id: "music",       label: "Music",       icon: Music       },
    { id: "bags",        label: "Party Bags",  icon: Gift        },
    { id: "budget",      label: "Budget",      icon: DollarSign  },
    { id: "checklist",   label: "Checklist",   icon: Check       },
  ] as const;

  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Header banner */}
      <div className="text-white rounded-sm p-5" style={{ backgroundColor: "#1c0a0e" }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{plan.overview.vibe}</span>
            </div>
            <p className="text-2xl font-black">🎂 {form.childName}'s {form.theme || form.customTheme} Party</p>
            <p className="text-sm text-white/60 mt-1 italic">"{plan.overview.tagline}"</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-white/40">Duration</p>
            <p className="text-sm font-bold text-white">{plan.overview.duration}</p>
          </div>
        </div>

        {/* Colour scheme */}
        <div className="flex items-center gap-2 mb-4">
          <p className="text-[10px] text-white/40">Theme colours:</p>
          {plan.overview.colourScheme?.map((c, i) => (
            <span key={i} className="text-xs text-white/80 bg-white/10 px-2 py-0.5 rounded-sm border border-white/15">{c}</span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isSignedIn ? (
            <button onClick={savePlan} disabled={saving || saved}
              className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                saved ? "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" : "text-white/70 hover:text-white border-white/20 hover:bg-white/5"
              }`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <span>💾</span>}
              {saving ? "Saving…" : saved ? "Saved!" : "Save Party"}
            </button>
          ) : null}
          {saved && partyId && (
            <a href={`/tools/kids-birthday-planner/${partyId}`}
              className="flex items-center gap-1.5 text-xs font-bold border border-rose-400/40 bg-rose-400/10 text-rose-300 hover:text-white px-3 py-2 rounded-sm transition-all">
              <ExternalLink className="w-3.5 h-3.5" />Open Dashboard
            </a>
          )}
          <button onClick={copyInvite}
            className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white border border-white/20 hover:bg-white/5 px-3 py-2 rounded-sm transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Invite"}
          </button>
          <button onClick={() => { setStep(1); setPlan(null); setForm(INITIAL); setSaved(false); setPartyId(null); }}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white ml-auto transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />New Plan
          </button>
        </div>
      </div>

      {/* Plan tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {PLAN_TABS.map(t => (
          <button key={t.id} onClick={() => setPlanTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              planTab === t.id ? "border-rose-500 text-rose-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ───────────────────────────────── */}
      {planTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Decoration Ideas</p>
              <ul className="space-y-1.5">
                {plan.overview.decorationIdeas?.map((d, i) => <li key={i} className="text-sm text-stone-700 flex items-start gap-2"><span className="text-rose-400 flex-shrink-0">•</span>{d}</li>)}
              </ul>
            </div>
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Host Tips</p>
              <ul className="space-y-1.5">
                {plan.hostTips?.slice(0, 4).map((t, i) => <li key={i} className="text-xs text-stone-600 flex items-start gap-2"><span className="text-emerald-400 flex-shrink-0">✓</span>{t}</li>)}
              </ul>
            </div>
          </div>
          {plan.viralMoment && (
            <div className="bg-rose-50 border border-rose-200 rounded-sm p-4">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-1">🔥 Viral Moment Idea</p>
              <p className="text-sm text-rose-800 font-semibold">{plan.viralMoment}</p>
            </div>
          )}
          {plan.emergencyKit?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2">🎒 Emergency Kit</p>
              <div className="flex flex-wrap gap-2">
                {plan.emergencyKit.map((e, i) => <span key={i} className="text-xs text-amber-800 bg-white border border-amber-200 px-2 py-1 rounded-sm">{e}</span>)}
              </div>
            </div>
          )}
          {plan.inviteMessage && (
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Invite Message</p>
                <button onClick={copyInvite} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors">
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}Copy
                </button>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed italic whitespace-pre-wrap">{plan.inviteMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* ── SCHEDULE ───────────────────────────────── */}
      {planTab === "schedule" && (
        <div className="space-y-2">
          {plan.schedule.map((s, i) => <ScheduleCard key={i} item={s} />)}
        </div>
      )}

      {/* ── ACTIVITIES ─────────────────────────────── */}
      {planTab === "activities" && (
        <div className="space-y-2">
          {plan.activities.map((a, i) => <ActivityCard key={i} act={a} />)}
        </div>
      )}

      {/* ── FOOD ───────────────────────────────────── */}
      {planTab === "food" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">🎂 Cake</p>
            <p className="text-base font-bold text-stone-900 mb-1">{plan.food.cake?.suggestion}</p>
            <p className="text-xs text-stone-500 mb-2">Serves {plan.food.cake?.serves}</p>
            {plan.food.cake?.diyTip && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-2 mb-2">💡 {plan.food.cake.diyTip}</p>}
            {plan.food.cake?.alternatives?.length > 0 && <div className="flex gap-2">{plan.food.cake.alternatives.map((a: string, i: number) => <span key={i} className="text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2 py-1 rounded-sm">{a}</span>)}</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Main Food</p>
              <ul className="space-y-2">
                {plan.food.mainFood?.map((f: any, i: number) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold text-stone-800">{f.item}</span>
                    {f.servings && <span className="text-xs text-stone-400 ml-1">({f.servings})</span>}
                    {f.allergyNote && <p className="text-[11px] text-amber-600">{f.allergyNote}</p>}
                    {f.tip && <p className="text-[11px] text-stone-400 italic">{f.tip}</p>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Snacks & Drinks</p>
              <ul className="space-y-1.5">
                {plan.food.snacks?.map((s: any, i: number) => <li key={i} className="text-sm text-stone-700">{s.item ?? s}{s.allergyNote ? <span className="text-[11px] text-amber-600 ml-1">({s.allergyNote})</span> : null}</li>)}
              </ul>
              <div className="mt-2 pt-2 border-t border-stone-100 flex flex-wrap gap-1.5">
                {plan.food.drinks?.map((d: string, i: number) => <span key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">🥤 {d}</span>)}
              </div>
            </div>
          </div>
          {plan.food.allergySwaps?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2">Allergy-safe swaps</p>
              <ul className="space-y-1">{plan.food.allergySwaps.map((s: string, i: number) => <li key={i} className="text-xs text-amber-800 flex items-start gap-2"><span>↔️</span>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* ── MUSIC ───────────────────────────────────── */}
      {planTab === "music" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Vibe</p>
            <p className="text-base font-bold text-stone-900">{plan.music.vibe}</p>
            {plan.music.tip && <p className="text-xs text-stone-500 mt-1 italic">{plan.music.tip}</p>}
            <div className="mt-3 bg-stone-50 border border-stone-200 rounded-sm px-3 py-2 flex items-center gap-2">
              <Music className="w-4 h-4 text-rose-400" />
              <span className="text-xs text-stone-600">Search on Spotify: <strong>"{plan.music.playlist}"</strong></span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">🎵 Suggested Playlist</p>
            <div className="space-y-2">
              {plan.music.suggestedSongs?.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-xs font-black text-rose-500 flex-shrink-0">{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{s.title}</p>
                    <p className="text-xs text-stone-400 truncate">{s.artist}</p>
                  </div>
                  <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-sm flex-shrink-0">{s.moment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PARTY BAGS ──────────────────────────────── */}
      {planTab === "bags" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Budget per bag</p>
            <p className="text-2xl font-black" style={{ color: ACCENT }}>{plan.partyBags.budgetPerBag}</p>
            {plan.partyBags.theme && <p className="text-xs text-stone-500 mt-1">Bag theme: {plan.partyBags.theme}</p>}
            {plan.partyBags.eco && <p className="text-xs text-emerald-600 mt-1">🌱 Eco option: {plan.partyBags.eco}</p>}
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">What to put inside</p>
            <div className="space-y-2">
              {plan.partyBags.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                  <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
                    {item.diy ? "🔨" : "🛍"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-800">{item.item}</p>
                    {item.tip && <p className="text-xs text-stone-400">{item.tip}</p>}
                  </div>
                  {item.diy && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-sm flex-shrink-0">DIY</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BUDGET ──────────────────────────────────── */}
      {planTab === "budget" && (
        <div className="space-y-4">
          <div className="text-white rounded-sm p-5" style={{ backgroundColor: "#1c0a0e" }}>
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Estimated Total</p>
            <p className="text-4xl font-black text-rose-300">£{plan.budget.total}</p>
          </div>
          <div className="space-y-2">
            {plan.budget.breakdown?.map((b: any, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-800">{b.category}</p>
                  {b.tips && <p className="text-xs text-stone-400">{b.tips}</p>}
                </div>
                <p className="text-base font-black" style={{ color: ACCENT }}>£{b.amount}</p>
              </div>
            ))}
          </div>
          {plan.budget.savingTips?.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">💡 Saving Tips</p>
              <ul className="space-y-1.5">
                {plan.budget.savingTips.map((t: string, i: number) => <li key={i} className="text-xs text-emerald-800 flex items-start gap-2"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-emerald-500" />{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── CHECKLIST ───────────────────────────────── */}
      {planTab === "checklist" && (
        <div className="space-y-3">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
            {checklist.filter(c => c.isDone).length}/{checklist.length} complete
          </p>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-4">
            <div className="h-full rounded-full transition-all" style={{ backgroundColor: ACCENT, width: `${checklist.length ? (checklist.filter(c => c.isDone).length / checklist.length) * 100 : 0}%` }} />
          </div>
          {Object.entries(
            checklist.reduce((acc, item) => {
              const cat = item.category || "general";
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(item);
              return acc;
            }, {} as Record<string, typeof checklist>)
          ).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{CHECKLIST_CAT_ICON[cat] ?? "✅"}</span>
                <span style={{ color: CHECKLIST_CAT_COLOR[cat] ?? "#6b7280" }}>{cat}</span>
              </p>
              <div className="space-y-1.5">
                {items.map((item, i) => {
                  const idx = checklist.findIndex(c => c === item);
                  return (
                    <button key={i} onClick={() => setChecklist(p => p.map((c, ci) => ci === idx ? { ...c, isDone: !c.isDone } : c))}
                      className={`w-full flex items-start gap-3 text-left px-4 py-3 rounded-sm border transition-all ${item.isDone ? "bg-stone-50 border-stone-100" : "bg-white border-stone-100 hover:border-stone-300"}`}>
                      <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${item.isDone ? "border-transparent" : "border-stone-300"}`}
                        style={item.isDone ? { backgroundColor: ACCENT } : {}}>
                        {item.isDone && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm leading-snug ${item.isDone ? "line-through text-stone-400" : "text-stone-700"}`}>{item.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}