// ─── IDEAS BANK ───────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import { Lightbulb, Plus, Wand2, Loader2, Star, CheckCircle2, ArrowRight, Trash2, Zap } from "lucide-react";

const MOCK_IDEAS = [
  { id: "1", title: "The Discipline Myth: Why Motivation Is Enough",   angle: "Reframes the 'discipline over motivation' narrative", emotion: "empowering",     difficulty: "medium",  saved: true  },
  { id: "2", title: "You're Not Confused — You're Avoiding",           angle: "Identifies clarity-avoidance as the real problem",   emotion: "confronting",    difficulty: "deep",    saved: false },
  { id: "3", title: "What Confidence Actually Looks Like in Practice", angle: "Concrete daily behaviours vs feelings",               emotion: "grounding",      difficulty: "easy",    saved: true  },
  { id: "4", title: "The Version of You That Already Made It",         angle: "Future-self perspective exercise",                   emotion: "inspiring",      difficulty: "medium",  saved: false },
  { id: "5", title: "Why You Keep Giving Up Before It Gets Hard",      angle: "The discomfort threshold and why most quit there",   emotion: "challenging",    difficulty: "deep",    saved: true  },
  { id: "6", title: "Talking Yourself Out of Your Own Dreams",         angle: "Internal sabotage patterns in self-talk",            emotion: "vulnerable",     difficulty: "medium",  saved: false },
];

export function YoutubeIdeasBank({ userId }: { userId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState(MOCK_IDEAS);
  const [generatingNew, setGeneratingNew] = useState(false);

  const generateMoreIdeas = async () => {
    setGeneratingNew(true);
    // Placeholder — integrate with real AI call
    await new Promise(r => setTimeout(r, 1500));
    setGeneratingNew(false);
  };

  const toggleSaved = (id: string) => setIdeas(prev => prev.map(i => i.id === id ? { ...i, saved: !i.saved } : i));

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Ideas Bank</h2>
          <p className="text-xs text-white/40 mt-0.5">AI-generated concepts ready to develop into scripts</p>
        </div>
        <button
          onClick={generateMoreIdeas}
          disabled={generatingNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {generatingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          Generate 10 New Ideas
        </button>
      </div>

      <div className="space-y-3">
        {ideas.map(idea => (
          <div key={idea.id} className="rounded-xl bg-white/3 border border-white/5 p-4 hover:border-white/10 transition-all group">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{idea.title}</p>
                <p className="text-xs text-white/40 mt-1">{idea.angle}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/30 capitalize">{idea.emotion}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize
                    ${idea.difficulty === "deep" ? "bg-purple-500/15 text-purple-400" :
                      idea.difficulty === "medium" ? "bg-blue-500/15 text-blue-400" :
                                                     "bg-green-500/15 text-green-400"}`}>
                    {idea.difficulty}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleSaved(idea.id)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                    ${idea.saved ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-white/30 hover:text-yellow-400"}`}
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center hover:bg-green-500/20 transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-white/30">
          <Zap className="w-3 h-3 inline mr-1 text-yellow-400" />
          Anti-repetition engine ensures all ideas are unique and build on past content
        </p>
      </div>
    </div>
  );
}

// ─── CONTENT CALENDAR ─────────────────────────────────────────────────────────
export function YoutubeContentCalendar({ userId }: { userId: string }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const weeks = [
    [null, null, { title: "Nobody Is Coming...", status: "Published" }, null, null, null, null],
    [null, { title: "Identity Trap", status: "Published" }, null, null, null, null, null],
    [null, null, null, { title: "Confidence...", status: "Published" }, null, null, null],
    [{ title: "What Most People...", status: "Scheduled" }, null, null, null, null, null, null],
  ];
  const weekLabels = ["Apr 7–13","Apr 14–20","Apr 21–27","Apr 28 – May 4"];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Content Calendar</h2>
          <p className="text-xs text-white/40 mt-0.5">Plan and track your publishing schedule</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-all">
          <Plus className="w-3.5 h-3.5" /> Schedule Video
        </button>
      </div>

      <div className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-white/5">
          <div className="px-4 py-3 text-xs font-semibold text-white/30">Week</div>
          {days.map(d => (
            <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-white/30 uppercase">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-8 border-b border-white/3 min-h-[72px]">
            <div className="px-4 py-3 flex items-center">
              <span className="text-xs text-white/30 font-medium">{weekLabels[wi]}</span>
            </div>
            {week.map((slot, di) => (
              <div key={di} className="px-2 py-2 border-l border-white/3">
                {slot ? (
                  <div className={`rounded-lg p-2 text-[10px] leading-tight font-medium cursor-pointer hover:opacity-80 transition-opacity
                    ${slot.status === "Published" ? "bg-green-500/20 text-green-300" : "bg-blue-500/20 text-blue-300"}`}>
                    {slot.title}
                    <div className="text-[9px] opacity-60 mt-0.5">{slot.status}</div>
                  </div>
                ) : (
                  <div className="h-full w-full rounded-lg border border-dashed border-white/5 hover:border-white/15 cursor-pointer transition-colors flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white/10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="text-xs text-white/30 text-center">Click any empty slot to schedule a video · Drag to reschedule</p>
    </div>
  );
}

// ─── ANALYTICS DASHBOARD ──────────────────────────────────────────────────────
export function YoutubeAnalyticsDashboard({ userId }: { userId: string }) {
  const barData = [
    { week: "Wk 9",  views: 312 }, { week: "Wk 10", views: 480 }, { week: "Wk 11", views: 890 },
    { week: "Wk 12", views: 720 }, { week: "Wk 13", views: 634 }, { week: "Wk 14", views: 0 },
  ];
  const maxViews = Math.max(...barData.map(d => d.views));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-base font-bold text-white">Analytics Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Views",    value: "12,400", delta: "+18%", positive: true  },
          { label: "Subscribers",    value: "847",    delta: "+62",   positive: true  },
          { label: "Avg Watch Time", value: "5m 42s", delta: "+0:34", positive: true  },
          { label: "Avg CTR",        value: "4.2%",   delta: "+0.6%", positive: true  },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl bg-white/3 border border-white/5 p-4">
            <p className="text-xs text-white/40">{kpi.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
            <p className={`text-xs mt-1 ${kpi.positive ? "text-green-400" : "text-red-400"}`}>{kpi.delta} this month</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl bg-white/3 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-5">Weekly Views</h3>
        <div className="flex items-end gap-3 h-32">
          {barData.map(d => (
            <div key={d.week} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] text-white/40">{d.views > 0 ? d.views : "—"}</span>
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-red-500/60 to-orange-500/30 transition-all"
                style={{ height: d.views > 0 ? `${(d.views / maxViews) * 100}%` : "4px", minHeight: "4px", opacity: d.views > 0 ? 1 : 0.2 }}
              />
              <span className="text-[10px] text-white/30">{d.week}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Videos */}
      <div className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Top Performing Videos</h3>
        </div>
        {[
          { title: "Nobody Is Coming To Save You", views: 1420, ctr: "5.1%", watch: "6m 12s", rank: 1 },
          { title: "The Identity Trap",             views: 892,  ctr: "4.3%", watch: "5m 44s", rank: 2 },
          { title: "Confidence Without Arrogance",  views: 634,  ctr: "3.8%", watch: "5m 01s", rank: 3 },
        ].map(v => (
          <div key={v.rank} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/3 hover:bg-white/2 transition-colors">
            <span className="text-lg font-black text-white/10 w-6 text-center">{v.rank}</span>
            <p className="flex-1 text-sm font-medium text-white">{v.title}</p>
            <span className="text-xs text-white/40">{v.views.toLocaleString()} views</span>
            <span className="text-xs text-blue-400">{v.ctr} CTR</span>
            <span className="text-xs text-green-400">{v.watch} avg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CHANNEL SETTINGS ─────────────────────────────────────────────────────────
export function YoutubeChannelSettings({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    channelName: "Isaac Paha",
    channelHandle: "@isaacpaha",
    videosPerWeek: "3",
    defaultTone: "calm",
    targetAudience: "young adults, graduates",
    creatorBio: "I help young people build the belief and clarity to live on their own terms.",
    uniqueVoice: "Speak like you're talking to one person. Slow. Direct. No filler.",
    channelMission: "To help 1 million people understand themselves and act accordingly.",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-bold text-white">Channel Settings</h2>
        <p className="text-xs text-white/40 mt-0.5">Configure your channel identity and AI generation preferences</p>
      </div>

      <div className="space-y-4">
        {[
          { label: "Channel Name",     key: "channelName",     placeholder: "Your channel name" },
          { label: "Channel Handle",   key: "channelHandle",   placeholder: "@handle" },
          { label: "Videos Per Week",  key: "videosPerWeek",   placeholder: "3",         type: "number" },
          { label: "Target Audience",  key: "targetAudience",  placeholder: "e.g. young adults, graduates" },
        ].map(field => (
          <div key={field.key}>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">{field.label}</label>
            <input
              type={field.type || "text"}
              value={(form as Record<string, string>)[field.key]}
              onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
        ))}
        {[
          { label: "Creator Bio (AI Context)",   key: "creatorBio",      rows: 2 },
          { label: "Unique Voice Instructions",  key: "uniqueVoice",     rows: 2 },
          { label: "Channel Mission",            key: "channelMission",  rows: 2 },
        ].map(field => (
          <div key={field.key}>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">{field.label}</label>
            <textarea
              rows={field.rows}
              value={(form as Record<string, string>)[field.key]}
              onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all
          ${saved
            ? "bg-green-500/20 text-green-400 border border-green-500/20"
            : "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:opacity-90"}`}
      >
        {saved ? "✓ Settings Saved" : "Save Settings"}
      </button>
    </div>
  );
}