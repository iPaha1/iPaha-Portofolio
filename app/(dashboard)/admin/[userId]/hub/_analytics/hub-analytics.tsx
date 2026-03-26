"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: Analytics Panel
// components/admin/hub/analytics/hub-analytics.tsx
//
// Displays:
//   - Total counts by type (bar chart via CSS)
//   - Top 10 most-copied entries
//   - Top 10 most-viewed entries
//   - Activity timeline (copies per day, last 30d)
//   - Tag frequency cloud
//   - Category breakdown
//   - Growth over time (entries created per week)
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart2, Copy, Eye, TrendingUp, Tag, Layers,
  Loader2, RefreshCw, Calendar, Award, Hash,
  Clock,
} from "lucide-react";
import { TAB_CFG,  type HubStats, type HubType } from "../_shared/hub-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalyticsData = {
  topCopied:   { id: string; title: string; type: HubType; copyCount: number; category: string | null }[];
  topViewed:   { id: string; title: string; type: HubType; viewCount: number; category: string | null }[];
  byType:      { type: HubType; count: number; copies: number; views: number }[];
  byCategory:  { category: string; count: number; copies: number }[];
  tagCloud:    { tag: string; count: number }[];
  dailyCopies: { date: string; count: number }[];
  weeklyCreated:{ week: string; count: number }[];
  recentActivity:{ id: string; title: string; type: HubType; action: string; at: string }[];
};

// ─── Mini bar (CSS-only, no charting lib needed) ──────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold text-stone-500 w-8 text-right">{value}</span>
    </div>
  );
}

// ─── Sparkline (30-day bar chart) ─────────────────────────────────────────────

function Sparkline({ data, color = "#f59e0b" }: { data: { date: string; count: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.map((d, i) => {
        const h = Math.max((d.count / max) * 40, d.count > 0 ? 2 : 1);
        return (
          <div key={i} className="flex-1 flex flex-col justify-end group relative">
            <div
              className="w-full rounded-sm transition-all"
              style={{ height: `${h}px`, backgroundColor: d.count > 0 ? color : "#f1f5f9" }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <div className="bg-stone-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                {d.date.slice(5)}: {d.count}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tag cloud ────────────────────────────────────────────────────────────────

function TagCloud({ tags }: { tags: { tag: string; count: number }[] }) {
  const max = Math.max(...tags.map((t) => t.count), 1);
  const COLORS = ["#f59e0b", "#8b5cf6", "#10b981", "#3b82f6", "#ef4444", "#ec4899", "#06b6d4", "#f97316"];

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t, i) => {
        const scale = 0.7 + (t.count / max) * 0.6;
        const color = COLORS[i % COLORS.length];
        return (
          <span
            key={t.tag}
            className="font-semibold px-2 py-0.5 rounded-sm border transition-transform cursor-default"
            style={{
              fontSize:        `${Math.max(10, Math.min(15, 10 * scale))}px`,
              color,
              backgroundColor: `${color}15`,
              borderColor:     `${color}30`,
            }}
            title={`${t.count} entr${t.count === 1 ? "y" : "ies"}`}
          >
            {t.tag} <span className="text-[9px] opacity-60">{t.count}</span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Type row ─────────────────────────────────────────────────────────────────

function TypeRow({
  type, count, copies, views, maxCount,
}: { type: HubType; count: number; copies: number; views: number; maxCount: number }) {
  const cfg = Object.values(TAB_CFG).find((c) => c.type === type);
  if (!cfg) return null;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <div className="w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${cfg.color}18` }}>
          <cfg.icon className="w-3 h-3" style={{ color: cfg.color }} />
        </div>
        <span className="text-xs font-semibold text-stone-600 truncate">{cfg.label}</span>
      </div>
      <div className="flex-1">
        <MiniBar value={count} max={maxCount} color={cfg.color} />
      </div>
      <div className="flex items-center gap-3 text-[10px] text-stone-400 flex-shrink-0">
        <span className="flex items-center gap-1"><Copy className="w-2.5 h-2.5" />{copies}</span>
        <span className="flex items-center gap-1"><Eye  className="w-2.5 h-2.5" />{views}</span>
      </div>
    </div>
  );
}

// ─── Entry leaderboard row ────────────────────────────────────────────────────

function LeaderRow({
  rank, id, title, type, value, icon: Icon, onEdit,
}: {
  rank: number; id: string; title: string; type: HubType;
  value: number; icon: React.ElementType; onEdit: (id: string) => void;
}) {
  const cfg = Object.values(TAB_CFG).find((c) => c.type === type);
  const rankColor = rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : rank === 3 ? "#b45309" : "#e5e7eb";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0 group">
      <span
        className="text-[11px] font-black w-5 text-center flex-shrink-0"
        style={{ color: rank <= 3 ? rankColor : "#d1d5db" }}
      >
        {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : `#${rank}`}
      </span>
      {cfg && (
        <div className="w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${cfg.color}18` }}>
          <cfg.icon className="w-3 h-3" style={{ color: cfg.color }} />
        </div>
      )}
      <button onClick={() => onEdit(id)}
        className="flex-1 text-xs font-semibold text-stone-700 truncate text-left hover:text-amber-600 transition-colors">
        {title}
      </button>
      <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500 flex-shrink-0">
        <Icon className="w-3 h-3" />
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, iconColor, children, className }: {
  title: string; icon: React.ElementType; iconColor: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white border border-stone-100 rounded-sm overflow-hidden ${className ?? ""}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <p className="text-xs font-black text-stone-700">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface HubAnalyticsProps {
  stats:   HubStats;
  onEdit:  (id: string) => void;
}

export function HubAnalytics({ stats, onEdit }: HubAnalyticsProps) {
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/admin/hub/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm text-stone-400">Loading analytics…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <BarChart2 className="w-10 h-10 text-stone-200" />
        <p className="text-sm text-stone-400">{error || "No data yet"}</p>
        <button onClick={load} className="text-xs text-amber-600 hover:text-amber-800 underline">Retry</button>
      </div>
    );
  }

  const maxTypeCount = Math.max(...data.byType.map((b) => b.count), 1);
  const maxCatCopies = Math.max(...data.byCategory.map((b) => b.copies), 1);
  const totalCopies  = data.byType.reduce((a, b) => a + b.copies, 0);
  const totalViews   = data.byType.reduce((a, b) => a + b.views, 0);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Refresh button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-400">Knowledge base analytics snapshot</p>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2.5 py-1.5 rounded-sm transition-colors">
          <RefreshCw className="w-3 h-3" />Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Entries",   value: stats.total,          color: "#f59e0b", icon: Layers     },
          { label: "Total Copies",    value: totalCopies,          color: "#10b981", icon: Copy       },
          { label: "Total Views",     value: totalViews,           color: "#3b82f6", icon: Eye        },
          { label: "Favourites",      value: stats.favourites,     color: "#ec4899", icon: Award      },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-stone-100 rounded-sm p-4">
            <k.icon className="w-4 h-4 mb-2" style={{ color: k.color }} />
            <p className="text-2xl font-black text-stone-900">{k.value.toLocaleString()}</p>
            <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Copies over time */}
      <SectionCard title="Copies — last 30 days" icon={TrendingUp} iconColor="#f59e0b">
        {data.dailyCopies.length > 0 && data.dailyCopies.some((d) => d.count > 0) ? (
          <Sparkline data={data.dailyCopies} color="#f59e0b" />
        ) : (
          <p className="text-xs text-stone-300 text-center py-4">No copies recorded yet</p>
        )}
      </SectionCard>

      {/* Two column: by type + weekly growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Entries by type" icon={Layers} iconColor="#8b5cf6">
          <div className="space-y-0.5">
            {data.byType
              .filter((b) => b.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((b) => (
                <TypeRow key={b.type} {...b} maxCount={maxTypeCount} />
              ))}
            {data.byType.every((b) => b.count === 0) && (
              <p className="text-xs text-stone-300 text-center py-4">No entries yet</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Entries created — weekly" icon={Calendar} iconColor="#0ea5e9">
          {data.weeklyCreated.some((w) => w.count > 0) ? (
            <div className="space-y-1.5">
              {data.weeklyCreated.slice(-8).map((w) => (
                <div key={w.week} className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 w-20 flex-shrink-0">{w.week}</span>
                  <MiniBar value={w.count} max={Math.max(...data.weeklyCreated.map((x) => x.count), 1)} color="#0ea5e9" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-300 text-center py-4">No data yet</p>
          )}
        </SectionCard>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Most copied" icon={Copy} iconColor="#10b981">
          {data.topCopied.length > 0 ? (
            data.topCopied.map((e, i) => (
              <LeaderRow key={e.id} rank={i + 1} {...e} value={e.copyCount} icon={Copy} onEdit={onEdit} />
            ))
          ) : (
            <p className="text-xs text-stone-300 text-center py-4">No copies yet</p>
          )}
        </SectionCard>

        <SectionCard title="Most viewed" icon={Eye} iconColor="#3b82f6">
          {data.topViewed.length > 0 ? (
            data.topViewed.map((e, i) => (
              <LeaderRow key={e.id} rank={i + 1} {...e} value={e.viewCount} icon={Eye} onEdit={onEdit} />
            ))
          ) : (
            <p className="text-xs text-stone-300 text-center py-4">No views yet</p>
          )}
        </SectionCard>
      </div>

      {/* Category copies */}
      {data.byCategory.length > 0 && (
        <SectionCard title="Copies by category" icon={Hash} iconColor="#f97316">
          <div className="space-y-2">
            {data.byCategory.sort((a, b) => b.copies - a.copies).slice(0, 12).map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="text-xs text-stone-600 font-semibold w-28 truncate flex-shrink-0">{c.category}</span>
                <MiniBar value={c.copies} max={maxCatCopies} color="#f97316" />
                <span className="text-[10px] text-stone-400 w-8 flex-shrink-0">{c.count} entries</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Tag cloud */}
      {data.tagCloud.length > 0 && (
        <SectionCard title="Tag frequency" icon={Tag} iconColor="#8b5cf6">
          <TagCloud tags={data.tagCloud.slice(0, 40)} />
        </SectionCard>
      )}

      {/* Recent activity */}
      {data.recentActivity.length > 0 && (
        <SectionCard title="Recent activity" icon={Clock} iconColor="#6b7280">
          <div className="space-y-0">
            {data.recentActivity.slice(0, 10).map((a) => {
              const cfg = Object.values(TAB_CFG).find((c) => c.type === a.type);
              return (
                <div key={a.id + a.at} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                  {cfg && <cfg.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />}
                  <button onClick={() => onEdit(a.id)}
                    className="flex-1 text-xs text-stone-600 hover:text-amber-600 transition-colors truncate text-left">
                    {a.title}
                  </button>
                  <span className="text-[10px] text-stone-400 flex-shrink-0">{a.action}</span>
                  <span className="text-[10px] text-stone-300 flex-shrink-0">{a.at}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}