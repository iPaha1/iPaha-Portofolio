"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: Layout Components
// components/admin/hub/shared/hub-layout.tsx
//
// HubStatsBar    — top 11 stat cards
// HubSidebar     — left filter panel (filters, categories, most copied)
// GlobalSearch   — full-page search with debounce, grouped results
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, Copy, Star, ChevronDown, Database } from "lucide-react";
import {
  TAB_CFG, LANG_LABELS, LANG_COLOR, HTTP_METHOD_COLOR,
  type HubStats, type HubType, type TabKey,
  type HubLanguage,
} from"./hub-types";


// ═══════════════════════════════════════════════════════════════════════════════
// STATS BAR
// ═══════════════════════════════════════════════════════════════════════════════

interface HubStatsBarProps {
  stats:      HubStats;
  activeTab:  TabKey;
  onTabClick: (tab: TabKey) => void;
}

export function HubStatsBar({ stats, activeTab, onTabClick }: HubStatsBarProps) {
  const phase1 = ["snippets", "prompts", "commands", "errors"] as TabKey[];
  const phase2 = ["notes", "apis", "patterns", "templates", "playbooks", "resources"] as TabKey[];

  const getCount = (key: TabKey): number => {
    const map: Partial<Record<TabKey, number>> = {
      snippets: stats.snippets, prompts: stats.prompts,
      commands: stats.commands, errors:  stats.errors,
      notes:    stats.notes,   apis:    stats.apis,
      patterns: stats.patterns,templates:stats.templates,
      playbooks:stats.playbooks,resources:stats.resources,
    };
    return map[key] ?? 0;
  };

  return (
    <div className="space-y-2 mb-4">
      {/* Total */}
      <div className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3">
        <Database className="w-4 h-4 text-amber-500" />
        <div>
          <p className="text-xl font-black text-stone-900">{stats.total.toLocaleString()}</p>
          <p className="text-[10px] font-semibold text-stone-400">Total entries</p>
        </div>
        <div className="ml-auto flex items-center gap-4 text-[11px] text-stone-400">
          <span>⭐ {stats.favourites} fav</span>
          <span>📌 {stats.pinned} pinned</span>
          <span>📋 {stats.totalCopies} copies</span>
        </div>
      </div>

      {/* Phase 1 type cards */}
      <div className="grid grid-cols-4 gap-2">
        {phase1.map((key) => {
          const cfg   = TAB_CFG[key];
          const count = getCount(key);
          const active = activeTab === key;
          if (!cfg || !cfg.type) return null;
          return (
            <button key={key} onClick={() => onTabClick(key)}
              className={`border rounded-sm p-3 text-left transition-all ${
                active
                  ? "border-current shadow-sm"
                  : "bg-white border-stone-100 hover:border-stone-200"
              }`}
              style={active ? { borderColor: cfg.color, backgroundColor: `${cfg.color}10` } : {}}>
              <cfg.icon className="w-4 h-4 mb-1.5" style={{ color: cfg.color }} />
              <p className="text-lg font-black text-stone-900">{count}</p>
              <p className="text-[10px] font-semibold text-stone-400">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Phase 2 type cards */}
      <div className="grid grid-cols-6 gap-2">
        {phase2.map((key) => {
          const cfg   = TAB_CFG[key];
          const count = getCount(key);
          const active = activeTab === key;
          if (!cfg || !cfg.type) return null;
          return (
            <button key={key} onClick={() => onTabClick(key)}
              className={`border rounded-sm p-3 text-left transition-all ${
                active
                  ? "border-current shadow-sm"
                  : "bg-white border-stone-100 hover:border-stone-200"
              }`}
              style={active ? { borderColor: cfg.color, backgroundColor: `${cfg.color}10` } : {}}>
              <cfg.icon className="w-3.5 h-3.5 mb-1" style={{ color: cfg.color }} />
              <p className="text-base font-black text-stone-900">{count}</p>
              <p className="text-[9px] font-semibold text-stone-400 leading-tight">{cfg.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HUB SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

interface HubSidebarProps {
  stats:          HubStats;
  activeCategory: string;
  favOnly:        boolean;
  activeTab:      TabKey;
  onTabChange:    (tab: TabKey) => void;
  onCategoryChange:(cat: string) => void;
  onFavToggle:    () => void;
}

export function HubSidebar({
  stats, activeCategory, favOnly, activeTab,
  onTabChange, onCategoryChange, onFavToggle,
}: HubSidebarProps) {
  const allTabs = Object.entries(TAB_CFG).filter(([k]) => k !== "search") as [TabKey, typeof TAB_CFG[TabKey]][];

  return (
    <div className="w-48 flex-shrink-0 border-r border-stone-100 bg-stone-50/40 overflow-y-auto flex flex-col">
      <div className="p-3 space-y-1 flex-1">

        {/* Quick filters */}
        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2 mt-1">View</p>

        {/* All entries */}
        <button
          onClick={() => { onCategoryChange(""); if (favOnly) onFavToggle(); }}
          className={`w-full flex items-center justify-between gap-1 px-2.5 py-2 rounded-sm text-left transition-colors text-xs font-semibold ${
            !favOnly && !activeCategory ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-white hover:text-stone-800"
          }`}
        >
          All Entries
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
            !favOnly && !activeCategory ? "bg-amber-200/60 text-amber-700" : "bg-stone-200 text-stone-400"
          }`}>{stats.total}</span>
        </button>

        {/* Favourites */}
        <button
          onClick={onFavToggle}
          className={`w-full flex items-center justify-between gap-1 px-2.5 py-2 rounded-sm text-left transition-colors text-xs font-semibold ${
            favOnly ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-white hover:text-stone-800"
          }`}
        >
          <span className="flex items-center gap-1.5"><Star className="w-3 h-3" />Favourites</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
            favOnly ? "bg-amber-200/60 text-amber-700" : "bg-stone-200 text-stone-400"
          }`}>{stats.favourites}</span>
        </button>

        {/* Type tabs */}
        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2 mt-4">Type</p>
        {allTabs.map(([key, cfg]) => {
          if (!cfg.type) return null;
          const count = getCount(stats, key);
          return (
            <button key={key}
              onClick={() => onTabChange(key)}
              className={`w-full flex items-center justify-between gap-1 px-2.5 py-2 rounded-sm text-left transition-colors ${
                activeTab === key ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-white hover:text-stone-800"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <cfg.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: activeTab === key ? cfg.color : undefined }} />
                {cfg.label}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                activeTab === key ? "bg-amber-200/60 text-amber-700" : "bg-stone-200 text-stone-400"
              }`}>{count}</span>
            </button>
          );
        })}

        {/* Categories */}
        {stats.byCategory.length > 0 && (
          <>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2 mt-4">Category</p>
            {stats.byCategory.slice(0, 14).map((c) => (
              <button key={c.category}
                onClick={() => onCategoryChange(activeCategory === c.category ? "" : c.category)}
                className={`w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-sm text-left transition-colors ${
                  activeCategory === c.category ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-white hover:text-stone-800"
                }`}
              >
                <span className="text-[11px] font-semibold truncate">{c.category}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                  activeCategory === c.category ? "bg-amber-200/60 text-amber-700" : "bg-stone-200 text-stone-400"
                }`}>{c.count}</span>
              </button>
            ))}
          </>
        )}

        {/* Most copied */}
        {stats.mostCopied.length > 0 && (
          <>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-2 mt-4">Most Copied</p>
            {stats.mostCopied.slice(0, 5).map((e) => {
              const cfg = Object.values(TAB_CFG).find((c) => c.type === e.type);
              return (
                <div key={e.id} className="px-2 py-1.5 group">
                  <div className="flex items-center gap-1 mb-0.5">
                    {cfg && <cfg.icon className="w-2.5 h-2.5 flex-shrink-0" style={{ color: cfg.color }} />}
                    <p className="text-[11px] text-stone-600 font-semibold line-clamp-1">{e.title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Copy className="w-2.5 h-2.5 text-stone-300" />
                    <p className="text-[10px] text-stone-400">{e.copyCount} copies</p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function getCount(stats: HubStats, key: TabKey): number {
  const map: Partial<Record<TabKey, keyof HubStats>> = {
    snippets: "snippets", prompts: "prompts", commands: "commands", errors: "errors",
    notes: "notes", apis: "apis", patterns: "patterns",
    templates: "templates", playbooks: "playbooks", resources: "resources",
  };
  const k = map[key];
  return k ? (stats[k] as number) ?? 0 : 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL SEARCH PANEL
// ═══════════════════════════════════════════════════════════════════════════════

type SearchResult = { id: string; title: string; category: string | null; copyCount: number };
type SearchResults = {
  snippets:  (SearchResult & { language: HubLanguage | null })[];
  prompts:   (SearchResult & { aiModel: string | null })[];
  commands:  SearchResult[];
  errors:    (SearchResult & { technology: string | null })[];
  notes:     (SearchResult & { difficulty: string | null })[];
  apis:      (SearchResult & { httpMethod: string | null })[];
  patterns:  SearchResult[];
  templates: SearchResult[];
  playbooks: SearchResult[];
  resources: (SearchResult & { resourceType: string | null; rating: number | null })[];
};

type SearchSectionKey = keyof SearchResults;
type SearchSectionItem = SearchResults[SearchSectionKey][number];
export type SearchOpenEntry = SearchSectionItem & { type: HubType };

interface GlobalSearchProps {
  onOpenEntry: (item: SearchOpenEntry) => void;
}

export function GlobalSearchPanel({ onOpenEntry }: GlobalSearchProps) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef   = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/hub/search?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const SECTION_CFG = ([
    "snippets",
    "prompts",
    "commands",
    "errors",
    "notes",
    "apis",
    "patterns",
    "templates",
    "playbooks",
    "resources",
  ] as const).map((key) => {
    const cfg = TAB_CFG[key];
    return {
      key,
      label: cfg.label,
      type: cfg.type as HubType,
      icon: cfg.icon,
      color: cfg.color,
    };
  });

  const totalResults = results
    ? Object.values(results).reduce((acc, arr) => acc + arr.length, 0)
    : 0;

  const EXAMPLES = ["prisma", "git rebase", "useEffect", "vercel build", "openai api", "typescript", "docker"];

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search snippets, prompts, commands, notes, APIs, errors…"
          className="w-full pl-12 pr-12 py-4 text-base border-2 border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white shadow-sm"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />}
        {query && !loading && (
          <button onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600 transition-colors">
            ✕
          </button>
        )}
      </div>

      {/* Empty state */}
      {!query && !results && (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-stone-300" />
          </div>
          <p className="text-sm font-semibold text-stone-400">Search your entire knowledge base</p>
          <p className="text-xs text-stone-300 mt-1">Finds across all 10 entry types simultaneously</p>
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setQuery(ex)}
                className="text-xs text-stone-400 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-amber-400 hover:text-amber-600 transition-colors font-mono">
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-5">
          {totalResults === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-stone-400">
                No results for &#34;<strong className="text-stone-600">{query}</strong>&#34;
              </p>
              <p className="text-xs text-stone-300 mt-1">Try a broader keyword or check your spelling</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-400">
                <strong className="text-stone-600">{totalResults}</strong> result{totalResults !== 1 ? "s" : ""} for{" "}
                &#34;<strong className="text-stone-600">{query}</strong>&#34;
              </p>
              {SECTION_CFG.map(({ key, label, type, icon: Icon, color }) => {
                const items = results[key];
                if (items.length === 0) return null;
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <p className="text-[11px] font-black uppercase tracking-wider" style={{ color }}>{label}</p>
                      <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm font-semibold">{items.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const language = "language" in item ? item.language : null;
                        const httpMethod = "httpMethod" in item ? item.httpMethod : null;
                        const httpMethodColor = httpMethod
                          ? HTTP_METHOD_COLOR[httpMethod as keyof typeof HTTP_METHOD_COLOR] ?? "#6b7280"
                          : "#6b7280";

                        return (
                          <button key={item.id} onClick={() => onOpenEntry({ ...item, type } as SearchOpenEntry)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2.5 border border-stone-100 rounded-sm hover:border-stone-300 hover:bg-stone-50/60 transition-colors group">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-stone-700 group-hover:text-stone-900 truncate">{item.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {item.category && (
                                  <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{item.category}</span>
                                )}
                                {language && language !== "PLAINTEXT" && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                                    style={{ color: LANG_COLOR[language] ?? "#9ca3af", backgroundColor: `${LANG_COLOR[language] ?? "#9ca3af"}20` }}>
                                    {LANG_LABELS[language]}
                                  </span>
                                )}
                                {httpMethod && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm"
                                    style={{ color: httpMethodColor, backgroundColor: `${httpMethodColor}20` }}>
                                    {httpMethod}
                                  </span>
                                )}
                                {item.copyCount > 0 && (
                                  <span className="text-[10px] text-stone-300 flex items-center gap-0.5">
                                    <Copy className="w-2.5 h-2.5" />{item.copyCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronDown className="-rotate-90 w-4 h-4 text-stone-300 group-hover:text-stone-500 flex-shrink-0 transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}