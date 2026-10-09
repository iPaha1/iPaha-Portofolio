"use client";

import { useState, useEffect } from "react";
import {
  Settings, Save, CheckCircle2, Youtube, Target, Plus, Trash2,
  Loader2, RefreshCw, Zap, ChevronRight, ExternalLink
} from "lucide-react";
import { ContentTone } from "./youtube-studio-types";
import { useGoals, useYoutubeProfile } from "./use-youtube";



const TONES: ContentTone[] = [
  "calm","reflective","direct","energetic",
  "storytelling","philosophical","motivational","conversational"
];
const THEMES = [
  "Life Understanding","Self-Belief","Confidence","Values",
  "Mindset","Relationships","Career","Money","Purpose"
];
const SPEAKING_PACES = ["slow","medium","fast"];
const CAMERA_STYLES  = ["close-up","medium","wide"];
const BG_STYLES      = ["minimal","bookshelf","outdoor","studio","home-office"];

export default function YoutubeChannelSettings({ userId }: { userId: string }) {
  const { profile, loading, update } = useYoutubeProfile(userId);
  const { goals, createGoal } = useGoals(userId);

  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [activeSection, setActiveSection] = useState<"channel"|"ai"|"delivery"|"goals">("channel");

  // Form state
  const [form, setForm] = useState({
    channelName:      "",
    channelHandle:    "",
    channelDescription: "",
    videosPerWeek:    3,
    defaultTone:      "calm" as ContentTone,
    targetAudience:   "",
    creatorBio:       "",
    uniqueVoiceNotes: "",
    channelMission:   "",
    coreThemes:       [] as string[],
    speakingPace:     "medium",
    cameraStyle:      "medium",
    backgroundStyle:  "minimal",
  });

  // Goal form state
  const [goalForm, setGoalForm] = useState({
    title: "", targetMetric: "subscribers", targetValue: 1000, targetDate: ""
  });
  const [addingGoal, setAddingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  // Sync form when profile loads
  useEffect(() => {
    if (!profile) return;
    setForm({
      channelName:      profile.channelName      ?? "",
      channelHandle:    profile.channelHandle    ?? "",
      channelDescription: profile.channelDescription ?? "",
      videosPerWeek:    profile.videosPerWeek    ?? 3,
      defaultTone:      profile.defaultTone      ?? "calm",
      targetAudience:   profile.targetAudience   ?? "",
      creatorBio:       profile.creatorBio       ?? "",
      uniqueVoiceNotes: profile.uniqueVoiceNotes ?? "",
      channelMission:   profile.channelMission   ?? "",
      coreThemes:       profile.coreThemes       ?? [],
      speakingPace:     profile.speakingPace     ?? "medium",
      cameraStyle:      profile.cameraStyle      ?? "medium",
      backgroundStyle:  profile.backgroundStyle  ?? "minimal",
    });
  }, [profile]);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleTheme = (theme: string) =>
    set("coreThemes",
      form.coreThemes.includes(theme)
        ? form.coreThemes.filter(t => t !== theme)
        : [...form.coreThemes, theme]
    );

  const handleSave = async () => {
    setSaving(true);
    await update(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveGoal = async () => {
    if (!goalForm.title || !goalForm.targetValue) return;
    setSavingGoal(true);
    await createGoal({
      title: goalForm.title,
      targetMetric: goalForm.targetMetric,
      targetValue: goalForm.targetValue,
      targetDate: goalForm.targetDate || undefined,
    });
    setGoalForm({ title: "", targetMetric: "subscribers", targetValue: 1000, targetDate: "" });
    setAddingGoal(false);
    setSavingGoal(false);
  };

  const SECTIONS = [
    { id: "channel",  label: "Channel Identity",   icon: Youtube },
    { id: "ai",       label: "AI Generation",       icon: Zap },
    { id: "delivery", label: "Delivery Style",      icon: Settings },
    { id: "goals",    label: "Channel Goals",       icon: Target },
  ] as const;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Section nav */}
      <div className="flex gap-1 p-1 bg-white/3 rounded-xl border border-white/5">
        {SECTIONS.map(sec => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all
                ${activeSection === sec.id
                  ? "bg-white/8 text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"}`}
            >
              <Icon className="w-3.5 h-3.5 hidden sm:block" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* ── Channel Identity ────────────────────────────────────────────── */}
      {activeSection === "channel" && (
        <div className="rounded-xl bg-white/3 border border-white/5 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Youtube className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-white">Channel Identity</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Channel Name">
              <input value={form.channelName} onChange={e => set("channelName", e.target.value)}
                placeholder="e.g. Isaac Paha" className={INPUT} />
            </Field>
            <Field label="Channel Handle">
              <input value={form.channelHandle} onChange={e => set("channelHandle", e.target.value)}
                placeholder="@handle" className={INPUT} />
            </Field>
          </div>

          <Field label="Channel Description">
            <textarea value={form.channelDescription} onChange={e => set("channelDescription", e.target.value)}
              rows={3} placeholder="What your channel is about..."
              className={`${INPUT} resize-none`} />
          </Field>

          <Field label="Channel Mission">
            <input value={form.channelMission} onChange={e => set("channelMission", e.target.value)}
              placeholder="e.g. Help 1 million people understand themselves and act accordingly"
              className={INPUT} />
          </Field>

          {profile?.channelId && (
            <a
              href={`https://youtube.com/channel/${profile.channelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View YouTube Channel
            </a>
          )}
        </div>
      )}

      {/* ── AI Generation ────────────────────────────────────────────────── */}
      {activeSection === "ai" && (
        <div className="rounded-xl bg-white/3 border border-white/5 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">AI Generation Preferences</h3>
            <span className="ml-auto text-xs text-white/30">Used every time you generate content</span>
          </div>

          {/* Videos per week */}
          <Field label="Videos Per Week">
            <div className="flex items-center gap-3">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => set("videosPerWeek", n)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all
                    ${form.videosPerWeek === n
                      ? "bg-gradient-to-br from-red-500 to-orange-500 text-white"
                      : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}>
                  {n}
                </button>
              ))}
            </div>
          </Field>

          {/* Default tone */}
          <Field label="Default Tone">
            <div className="flex flex-wrap gap-2">
              {TONES.map(tone => (
                <button key={tone} onClick={() => set("defaultTone", tone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                    ${form.defaultTone === tone
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                      : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}>
                  {tone}
                </button>
              ))}
            </div>
          </Field>

          {/* Core themes */}
          <Field label="Core Themes" hint="Select all themes AI should write about">
            <div className="flex flex-wrap gap-2">
              {THEMES.map(theme => (
                <button key={theme} onClick={() => toggleTheme(theme)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                    ${form.coreThemes.includes(theme)
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : "bg-white/5 text-white/40 border-transparent hover:text-white hover:bg-white/10"}`}>
                  {theme}
                </button>
              ))}
            </div>
          </Field>

          {/* Target audience */}
          <Field label="Target Audience" hint="Described to the AI for every generation">
            <input value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)}
              placeholder="e.g. young adults 18–35, graduates, people seeking clarity"
              className={INPUT} />
          </Field>

          {/* Creator bio */}
          <Field label="Creator Context" hint="Personal context the AI uses to personalise scripts">
            <textarea value={form.creatorBio} onChange={e => set("creatorBio", e.target.value)}
              rows={3}
              placeholder="e.g. I grew up in Ghana, struggled with self-doubt, moved to the UK at 22..."
              className={`${INPUT} resize-none`} />
          </Field>

          {/* Unique voice */}
          <Field label="Voice Instructions" hint="How the AI should write your specific style">
            <textarea value={form.uniqueVoiceNotes} onChange={e => set("uniqueVoiceNotes", e.target.value)}
              rows={3}
              placeholder="e.g. Short punchy sentences. Speak directly. No motivational fluff. Pause after big points."
              className={`${INPUT} resize-none`} />
          </Field>
        </div>
      )}

      {/* ── Delivery Style ────────────────────────────────────────────────── */}
      {activeSection === "delivery" && (
        <div className="rounded-xl bg-white/3 border border-white/5 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Settings className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Default Delivery Preferences</h3>
            <span className="ml-auto text-xs text-white/30">Informs filming & delivery guides</span>
          </div>

          <Field label="Speaking Pace">
            <div className="flex gap-2">
              {SPEAKING_PACES.map(p => (
                <button key={p} onClick={() => set("speakingPace", p)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium capitalize transition-all
                    ${form.speakingPace === p
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}>
                  {p}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Camera Style" hint="Default framing for talking-head shots">
            <div className="flex gap-2">
              {CAMERA_STYLES.map(s => (
                <button key={s} onClick={() => set("cameraStyle", s)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium capitalize transition-all
                    ${form.cameraStyle === s
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Default Background Style">
            <div className="flex flex-wrap gap-2">
              {BG_STYLES.map(s => (
                <button key={s} onClick={() => set("backgroundStyle", s)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all
                    ${form.backgroundStyle === s
                      ? "bg-white/15 text-white border border-white/20"
                      : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-transparent"}`}>
                  {s.replace("-"," ")}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* ── Channel Goals ──────────────────────────────────────────────────── */}
      {activeSection === "goals" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Channel Goals</h3>
              <button
                onClick={() => setAddingGoal(!addingGoal)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Goal
              </button>
            </div>

            {/* Add Goal Form */}
            {addingGoal && (
              <div className="px-5 py-4 bg-white/2 border-b border-white/5 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Goal Title</label>
                    <input value={goalForm.title} onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Reach 1,000 subscribers" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Metric</label>
                    <select value={goalForm.targetMetric} onChange={e => setGoalForm(p => ({ ...p, targetMetric: e.target.value }))}
                      className={INPUT}>
                      <option value="subscribers">Subscribers</option>
                      <option value="views">Total Views</option>
                      <option value="videos">Videos Published</option>
                      <option value="watchHours">Watch Hours</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Target Value</label>
                    <input type="number" value={goalForm.targetValue}
                      onChange={e => setGoalForm(p => ({ ...p, targetValue: parseInt(e.target.value) || 0 }))}
                      className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Target Date (optional)</label>
                    <input type="date" value={goalForm.targetDate}
                      onChange={e => setGoalForm(p => ({ ...p, targetDate: e.target.value }))}
                      className={INPUT} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAddingGoal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleSaveGoal} disabled={savingGoal}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                    {savingGoal ? "Saving..." : "Save Goal"}
                  </button>
                </div>
              </div>
            )}

            {/* Goals List */}
            {goals.length === 0 && !addingGoal ? (
              <div className="px-5 py-8 text-center">
                <Target className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No goals yet</p>
                <p className="text-xs text-white/20 mt-1">Add a goal to track your channel growth</p>
              </div>
            ) : (
              <div className="divide-y divide-white/3">
                {goals.map(goal => {
                  const pct = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
                  return (
                    <div key={goal.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">{goal.title}</p>
                          <p className="text-xs text-white/30 mt-0.5 capitalize">
                            {goal.targetMetric} · Target: {goal.targetValue.toLocaleString()}
                            {goal.targetDate && ` · Due ${new Date(goal.targetDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`}
                          </p>
                        </div>
                        {goal.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                        ) : (
                          <span className="text-xs font-semibold text-orange-400">{pct.toFixed(0)}%</span>
                        )}
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500
                            ${goal.isCompleted
                              ? "bg-gradient-to-r from-green-400 to-teal-400"
                              : "bg-gradient-to-r from-orange-500 to-red-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-white/25">
                          {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
                        </span>
                        {goal.isCompleted && (
                          <span className="text-[10px] text-green-400 font-semibold">✓ Completed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button (not shown on goals section) */}
      {activeSection !== "goals" && (
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
            ${saved
              ? "bg-green-500/15 text-green-400 border border-green-500/20"
              : "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:opacity-90"
            } disabled:opacity-50`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Settings Saved</>
          ) : (
            <><Save className="w-4 h-4" /> Save Settings</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Shared mini components ────────────────────────────────────────────────────

const INPUT = "w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors";
const LABEL = "text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5";

function Field({
  label, hint, children
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}
        {hint && <span className="normal-case text-white/25 font-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}