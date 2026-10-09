"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Eye, Users, Clock, Zap, Star, ExternalLink } from "lucide-react";
import { useAnalytics, useDashboardStats } from "./use-youtube";


export default function YoutubeAnalyticsDashboard({ userId }: { userId: string }) {
  const { snapshots, topVideos, loading } = useAnalytics(userId);
  const { stats } = useDashboardStats(userId);
  const [metricView, setMetricView] = useState<"views" | "subscribers" | "ctr">("views");

  // Build chart data from snapshots
  const chartData = snapshots.slice(0, 8).reverse();
  const maxValue = Math.max(...chartData.map(s =>
    metricView === "views" ? s.totalViews
    : metricView === "subscribers" ? s.subscriberCount
    : Math.round(s.avgCtr * 10)
  ), 1);

  const metricLabel = (s: typeof snapshots[0]) =>
    metricView === "views" ? s.totalViews.toLocaleString()
    : metricView === "subscribers" ? s.subscriberCount.toLocaleString()
    : `${s.avgCtr.toFixed(1)}%`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { month: "short", day: "numeric" });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-base font-bold text-white">Analytics Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Views",      value: stats?.totalViews.toLocaleString() ?? "—",    delta: `+${stats?.monthlyViewsGrowthPct ?? 0}% this month`,  positive: true,  icon: Eye    },
          { label: "Subscribers",      value: stats?.subscribers.toLocaleString() ?? "—",    delta: `+${stats?.weeklyGrowthPct ?? 0} this week`,           positive: true,  icon: Users  },
          { label: "Watch Hours",      value: `${stats?.watchHours ?? 0}h`,                  delta: "total",                                                positive: true,  icon: Clock  },
          { label: "Avg CTR",          value: `${stats?.avgCtr?.toFixed(1) ?? "0"}%`,        delta: "across all videos",                                    positive: true,  icon: Zap    },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl bg-white/3 border border-white/5 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-white/40">{kpi.label}</p>
                <Icon className="w-3.5 h-3.5 text-white/20" />
              </div>
              <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
              <p className={`text-xs mt-1 ${kpi.positive ? "text-green-400" : "text-red-400"}`}>
                {kpi.delta}
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-white/3 border border-white/5 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Performance Over Time</h3>
          <div className="flex items-center gap-1">
            {(["views","subscribers","ctr"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMetricView(m)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-all
                  ${metricView === m ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {loading || chartData.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-white/30">
            {loading ? "Loading analytics..." : "No data yet — publish some videos to start tracking"}
          </div>
        ) : (
          <div className="flex items-end gap-3 h-32">
            {chartData.map((s, i) => {
              const value = metricView === "views" ? s.totalViews
                : metricView === "subscribers" ? s.subscriberCount
                : Math.round(s.avgCtr * 10);
              const heightPct = (value / maxValue) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[9px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    {metricLabel(s)}
                  </span>
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-red-500/60 to-orange-500/30 transition-all duration-300 min-h-[4px]"
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                  />
                  <span className="text-[9px] text-white/25 text-center">{formatDate(s.snapshotDate)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Videos Table */}
      <div className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Top Performing Videos</h3>
          <TrendingUp className="w-4 h-4 text-white/20" />
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-xs text-white/30">Loading...</div>
        ) : topVideos.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-white/30">
            No published videos yet
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[30px_2fr_80px_80px_70px_70px] gap-4 px-5 py-2.5 border-b border-white/3 text-[10px] font-semibold text-white/25 uppercase tracking-wider">
              <span>#</span>
              <span>Video</span>
              <span>Views</span>
              <span>Likes</span>
              <span>CTR</span>
              <span>Watch%</span>
            </div>
            {topVideos.map((v, i) => (
              <div key={v.id} className="grid md:grid-cols-[30px_2fr_80px_80px_70px_70px] gap-4 items-center px-5 py-3.5 border-b border-white/3 hover:bg-white/2 transition-colors">
                <span className="text-base font-black text-white/10">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{v.seoTitle || v.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/50">
                  <Eye className="w-3 h-3" />{v.viewCount.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  {v.likeCount.toLocaleString()}
                </div>
                <span className="text-xs text-blue-400">{v.ctr?.toFixed(1) ?? "—"}%</span>
                <span className="text-xs text-orange-400">{v.avgWatchPercent?.toFixed(0) ?? "—"}%</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Publishing Streak + Goal */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-yellow-500/12 to-orange-500/5 border border-yellow-500/20 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-400/70 font-medium mb-1">Publishing Streak</p>
              <p className="text-3xl font-bold text-white">
                {stats?.publishingStreak ?? 0}
                <span className="text-sm text-white/40 font-normal ml-1">weeks</span>
              </p>
              <p className="text-xs text-white/30 mt-1">Keep going — consistency compounds</p>
            </div>
            <span className="text-4xl">🔥</span>
          </div>
        </div>

        <div className="rounded-xl bg-white/3 border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-3.5 h-3.5 text-white/30" />
            <span className="text-xs font-semibold text-white">Content Quality</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Videos Generated",  value: stats?.totalVideos ?? 0,     max: 50,   color: "from-red-500 to-orange-500" },
              { label: "Published",         value: stats?.publishedVideos ?? 0, max: stats?.totalVideos || 1, color: "from-green-500 to-teal-500" },
              { label: "Ideas in Bank",     value: stats?.ideasBankCount ?? 0,  max: 100,  color: "from-blue-500 to-cyan-500" },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-white/40">{row.label}</span>
                  <span className="text-[10px] text-white/60 font-semibold">{row.value}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${row.color} rounded-full transition-all`}
                    style={{ width: `${Math.min((row.value / row.max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}