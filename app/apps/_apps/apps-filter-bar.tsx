"use client";

import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { APPS, STATUS_CONFIG, COMPANIES, type AppStatus, type AppCategory, type CompanyId } from "@/lib/data/apps-data";
import { cn } from "@/lib/utils";

export type FilterState = {
  search: string;
  status: AppStatus | "ALL";
  category: AppCategory | "ALL";
  company: CompanyId | "ALL";
};

interface AppsFilterBarProps {
  filters: FilterState;
  onFilters: (f: FilterState) => void;
  resultCount: number;
}

const ALL_CATEGORIES = Array.from(new Set(APPS.map(a => a.category))) as AppCategory[];

export function AppsFilterBar({ filters, onFilters, resultCount }: AppsFilterBarProps) {
  const set = (patch: Partial<FilterState>) => onFilters({ ...filters, ...patch });
  const hasActive = filters.search || filters.status !== "ALL" || filters.category !== "ALL" || filters.company !== "ALL";

  return (
    <div className="sticky top-16 z-30 bg-[#080810]/95 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">

        {/* Row 1: search + count + clear */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input
              value={filters.search}
              onChange={e => set({ search: e.target.value })}
              placeholder="Search apps…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded px-9 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => set({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-white/30 ml-auto">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              <span className="text-white/70 font-bold">{resultCount}</span>{" "}
              {resultCount === 1 ? "app" : "apps"}
            </span>
          </div>

          {hasActive && (
            <button
              onClick={() => onFilters({ search: "", status: "ALL", category: "ALL", company: "ALL" })}
              className="flex items-center gap-1.5 text-xs text-amber-400 border border-amber-400/25 bg-amber-400/8 px-3 py-2 rounded hover:bg-amber-400/15 transition-all"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Row 2: status + company + category pills */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Status pills */}
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded p-1">
            <button
              onClick={() => set({ status: "ALL" })}
              className={cn(
                "text-[11px] font-semibold px-3 py-1.5 rounded transition-all",
                filters.status === "ALL" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              All Status
            </button>
            {(["LIVE","BETA","IN_DEVELOPMENT","COMING_SOON"] as AppStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => set({ status: s })}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded transition-all",
                    filters.status === s
                      ? "text-white"
                      : "text-white/35 hover:text-white/60"
                  )}
                  style={filters.status === s ? { backgroundColor: cfg.bgColor, color: cfg.textColor } : {}}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: cfg.textColor }}
                  />
                  {cfg.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Company filter */}
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded p-1">
            <button
              onClick={() => set({ company: "ALL" })}
              className={cn(
                "text-[11px] font-semibold px-3 py-1.5 rounded transition-all",
                filters.company === "ALL" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              All Companies
            </button>
            {(Object.keys(COMPANIES) as CompanyId[]).map(id => {
              const co = COMPANIES[id];
              return (
                <button
                  key={id}
                  onClick={() => set({ company: id })}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded transition-all",
                    filters.company === id ? "text-white" : "text-white/35 hover:text-white/60"
                  )}
                  style={
                    filters.company === id
                      ? { backgroundColor: `${co.primaryColor}18`, color: co.primaryColor }
                      : {}
                  }
                >
                  {co.flag} {co.shortName}
                </button>
              );
            })}
          </div>

          {/* Category pills (scroll overflow) */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => set({ category: "ALL" })}
              className={cn(
                "shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded border transition-all",
                filters.category === "ALL"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-white/[0.06] bg-white/[0.03] text-white/30 hover:text-white/60"
              )}
            >
              All Categories
            </button>
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => set({ category: cat })}
                className={cn(
                  "shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded border transition-all",
                  filters.category === cat
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    : "border-white/[0.06] bg-white/[0.03] text-white/30 hover:text-white/60"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}