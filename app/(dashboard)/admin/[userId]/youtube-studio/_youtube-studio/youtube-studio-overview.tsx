"use client";

import {
  TrendingUp, Eye, Users, Clock, Wand2, Film,
  Lightbulb, ArrowRight, Target, Calendar, ChevronRight, Loader2,
} from "lucide-react";
import { YoutubeTab } from "./types";
// import { useDashboardStats, useVideos, useGoals, useNarrativeArc } from "./use-youtube";
import { useEffect } from "react";
import { useDashboardStats, useVideos, useGoals, useNarrativeArc } from  "@/hooks/youtube-studio/use-youtube";
// import { useDashboardStats, useVideos, useGoals, useNarrativeArc } from "./use-youtube";

interface Props {
  userId: string;
  onNavigate: (tab: YoutubeTab) => void;
}

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  READY:     "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  SCHEDULED: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  DRAFT:     "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  EDITING:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  FILMING:   "bg-orange-500/10 text-orange-400 border border-orange-500/20",
};

const QUICK_ACTIONS: { label: string; desc: string; icon: React.ElementType; tab: YoutubeTab }[] = [
  { label: "Generate this week",  desc: "AI writes full video scripts",  icon: Wand2,     tab: "generator" },
  { label: "Browse ideas bank",   desc: "Expand your content pipeline",  icon: Lightbulb, tab: "ideas"     },
  { label: "Content calendar",    desc: "Plan and schedule uploads",     icon: Calendar,  tab: "calendar"  },
];

export default function YoutubeStudioOverview({ userId, onNavigate }: Props) {
  const { stats, loading: statsLoading }                  = useDashboardStats(userId);
  const { videos: recentVideos, loading: videosLoading }  = useVideos(userId, { pageSize: 5, sortBy: "date" });
  const { goals }                                         = useGoals(userId);
  const { arc, loading: arcLoading }                      = useNarrativeArc(userId);

  const topGoal    = goals.find(g => !g.isCompleted) ?? goals[0];
  const topGoalPct = topGoal ? Math.min((topGoal.currentValue / topGoal.targetValue) * 100, 100) : 0;

  const KPI_ITEMS = [
    { label: "Total videos",  value: stats?.totalVideos  ?? 0, suffix: "",  icon: Film  },
    { label: "Total views",   value: stats?.totalViews   ?? 0, suffix: "",  icon: Eye   },
    { label: "Subscribers",   value: stats?.subscribers  ?? 0, suffix: "",  icon: Users },
    { label: "Watch hours",   value: stats?.watchHours   ?? 0, suffix: "h", icon: Clock },
  ];

  // Add this effect to debug
useEffect(() => {
  const testFetch = async () => {
    const response = await fetch(`/api/admin/${userId}/youtube/videos?pageSize=5`);
    const data = await response.json();
    console.log("[Overview] Direct API fetch:", data);
  };
  testFetch();
}, [userId]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-white">Overview</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Your channel at a glance</p>
        </div>
        <button
          onClick={() => onNavigate("generator")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-white text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <Wand2 className="w-3 h-3" />
          Generate content
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPI_ITEMS.map(({ label, value, suffix, icon: Icon }) => (
          <div key={label} className="rounded bg-zinc-900 border border-zinc-800 px-3.5 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">{label}</span>
              <Icon className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            {statsLoading ? (
              <div className="h-5 w-14 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-semibold text-white tabular-nums">
                {value.toLocaleString()}{suffix}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Recent videos */}
        <div className="lg:col-span-2 rounded border border-zinc-800 overflow-hidden bg-zinc-900">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
            <span className="text-xs font-medium text-zinc-300">Recent videos</span>
            <button
              onClick={() => onNavigate("library")}
              className="flex items-center gap-0.5 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {videosLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-4 h-4 text-zinc-700 animate-spin" />
            </div>
          ) : recentVideos.length === 0 ? (
            <div className="py-10 text-center">
              <Film className="w-5 h-5 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No videos yet</p>
              <button
                onClick={() => onNavigate("generator")}
                className="mt-2 text-xs text-zinc-500 hover:text-white transition-colors underline underline-offset-2"
              >
                Generate your first batch
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {recentVideos.map(video => (
                <div key={video.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors">
                  <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                    <Film className="w-3 h-3 text-zinc-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-200 truncate font-medium">{video.title}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      {video.createdAt
                        ? new Date(video.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {video.viewCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <Eye className="w-3 h-3" />{video.viewCount.toLocaleString()}
                      </span>
                    )}
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_STYLE[video.status] ?? STATUS_STYLE.DRAFT}`}>
                      {video.status.charAt(0) + video.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-2.5">

          {/* Quick actions */}
          <div className="rounded border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-300">Quick actions</span>
            </div>
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.tab)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/40 transition-colors text-left group"
                >
                  <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                    <Icon className="w-3 h-3 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200">{action.label}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Top goal */}
          {topGoal ? (
            <div className="rounded border border-zinc-800 bg-zinc-900 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-xs font-medium text-zinc-300 truncate flex-1">{topGoal.title}</span>
                <span className="text-[11px] font-medium text-zinc-400 shrink-0 tabular-nums">{Math.round(topGoalPct)}%</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-400 rounded-full transition-all duration-500"
                  style={{ width: `${topGoalPct}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-600 mt-1.5 tabular-nums">
                {topGoal.currentValue.toLocaleString()} / {topGoal.targetValue.toLocaleString()} {topGoal.targetMetric}
              </p>
            </div>
          ) : (
            <button
              onClick={() => onNavigate("settings")}
              className="w-full rounded border border-zinc-800 border-dashed bg-zinc-900 px-4 py-3 text-xs text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-colors text-left"
            >
              + Set a channel goal
            </button>
          )}

          {/* Publishing streak */}
          <div className="rounded border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-zinc-500 mb-0.5">Publishing streak</p>
              <p className="text-base font-semibold text-white tabular-nums">
                {stats?.publishingStreak ?? 0}
                <span className="text-xs text-zinc-600 font-normal ml-1">weeks</span>
              </p>
            </div>
            <span className="text-lg">{(stats?.publishingStreak ?? 0) >= 4 ? "🔥" : "📅"}</span>
          </div>
        </div>
      </div>

      {/* Narrative arc */}
      <div className="rounded border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-xs font-medium text-zinc-300">Narrative arc</span>
          </div>
          <span className="text-[11px] text-zinc-600">AI tracks your story progression</span>
        </div>

        {arcLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 text-zinc-700 animate-spin" />
          </div>
        ) : arc && arc.arcSummary ? (
          <div className="px-4 py-3 space-y-2.5">
            <p className="text-xs text-zinc-400 leading-relaxed">{arc.arcSummary}</p>
            {arc.suggestedTitle && (
              <div className="flex items-center gap-3 pt-2.5 border-t border-zinc-800">
                <span className="text-[11px] text-zinc-600 shrink-0">Suggested next</span>
                <p className="text-xs text-zinc-200 font-medium flex-1">{arc.suggestedTitle}</p>
                <button
                  onClick={() => onNavigate("generator")}
                  className="shrink-0 text-[11px] text-zinc-500 hover:text-white transition-colors underline underline-offset-2"
                >
                  Generate
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-zinc-600">Publish at least 2 videos to unlock narrative analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}