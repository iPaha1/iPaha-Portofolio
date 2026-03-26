"use client";

// =============================================================================
// isaacpaha.com — Developer Hub Admin Client (Phase 3)
// components/admin/hub/hub-admin-client.tsx
//
// Extends Phase 2 with four new top-level views:
//   ai        — AI Knowledge Assistant (conversational KB search)
//   analytics — Usage analytics dashboard
//   import    — Import/Export panel
//   tags      — Tag management
//
// All Phase 1+2 functionality (10 entry types, editor, global search) intact.
// =============================================================================

import React, { useState, useCallback, useTransition } from "react";
import { motion, AnimatePresence }                      from "framer-motion";
import {
  Plus, Search, CheckSquare, Square, Trash2,
  Bot, BarChart2, Upload, Tag as TagIcon,
} from "lucide-react";

// ── Shared components (Phase 1+2)
import { ConfirmDialog }     from "../_shared/ui-atoms";
import { EntryCard }         from "../_shared/entry-card";
import { HubSidebar, GlobalSearchPanel, HubStatsBar, SearchOpenEntry } from "../_shared/hub-layout";
import {
  TAB_CFG, typeToTabKey, getTypeCountKey,
  type HubEntry, type HubStats, type HubType, type TabKey,
} from "../_shared/hub-types";
import { EditorShell }  from "../_editors/editor-shell";
import { TypeEditor }   from "../_editors/type-editors";

// ── Phase 3 feature panels
import { HubAssistant }    from "../_ai/hub-assistant";
import { HubAnalytics }    from "../_analytics/hub-analytics";
import { HubImportExport } from "../_import-export/hub-import-export";
import { HubTags }         from "../_tags/hub-tags";

// ─── Extended tab system ──────────────────────────────────────────────────────

type Phase3Tab = "ai" | "analytics" | "import" | "tags";
export type AnyTab    = TabKey | Phase3Tab;

const PHASE3_TABS: { id: Phase3Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: "ai",        label: "AI Assistant",  icon: Bot,      color: "#8b5cf6" },
  { id: "analytics", label: "Analytics",     icon: BarChart2,color: "#3b82f6" },
  { id: "import",    label: "Import/Export", icon: Upload,   color: "#10b981" },
  { id: "tags",      label: "Tags",          icon: TagIcon,  color: "#f97316" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userId:          string;
  stats:           HubStats;
  initialEntries:  HubEntry[];
  entryTotal:      number;
  entryPages:      number;
  initialTab:      AnyTab;
  initialSearch:   string;
  initialCategory: string;
  currentPage:     number;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function HubAdminClient({
  stats, initialEntries, entryTotal, entryPages,
  initialTab, initialSearch, initialCategory, currentPage,
}: Props) {

  // ── Core state
  const [tab,        setTab]        = useState<AnyTab>(initialTab);
  const [entries,    setEntries]    = useState<HubEntry[]>(initialEntries);
  const [total,      setTotal]      = useState(entryTotal);
  const [pages,      setPages]      = useState(entryPages);
  const [page,       setPage]       = useState(currentPage);
  const [search,     setSearch]     = useState(initialSearch);
  const [category,   setCategory]   = useState(initialCategory);
  const [sortBy,     setSortBy]     = useState("createdAt_desc");
  const [favOnly,    setFavOnly]    = useState(false);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [statsData,  setStatsData]  = useState<HubStats>(stats);
  const [isPending,  startTransition] = useTransition();

  // ── Editor state
  const [editorOpen,   setEditorOpen]   = useState(false);
  const [editingEntry, setEditingEntry] = useState<HubEntry | null>(null);

  // ── Confirm
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; danger?: boolean;
    confirmLabel?: string; action?: () => Promise<void>;
  }>({ open: false, title: "", message: "" });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ─── Derived
  const isPhase3Tab  = PHASE3_TABS.some((t) => t.id === tab);
  const isSearchTab  = tab === "search";
  const isEntryTab   = !isPhase3Tab && !isSearchTab;
  const currentType: HubType | null = isEntryTab && tab in TAB_CFG
    ? (TAB_CFG[tab as TabKey]?.type ?? null)
    : null;
  const tabCfg = isEntryTab ? TAB_CFG[tab as TabKey] : null;

  // ─── Fetch entries ───────────────────────────────────────────────────────
  const fetchEntries = useCallback(async (opts?: {
    type?: HubType | null; q?: string; cat?: string;
    fav?: boolean; sort?: string; pg?: number;
  }) => {
    const type = opts?.type !== undefined ? opts.type : currentType;
    const q    = opts?.q    ?? search;
    const cat  = opts?.cat  ?? category;
    const fav  = opts?.fav  ?? favOnly;
    const sort = opts?.sort ?? sortBy;
    const pg   = opts?.pg   ?? page;

    const params = new URLSearchParams({ page: String(pg), pageSize: "30" });
    if (type)              params.set("type",     type);
    if (q && q !== "")     params.set("search",   q);
    if (cat && cat !== "") params.set("category", cat);
    if (fav)               params.set("fav",      "true");
    const [sf, sd] = sort.split("_");
    params.set("sortBy", sf); params.set("sortOrder", sd);

    const res  = await fetch(`/api/admin/hub?${params}`);
    const data = await res.json();
    setEntries(data.entries ?? []);
    setTotal(data.total    ?? 0);
    setPages(data.pages    ?? 1);
  }, [currentType, search, category, favOnly, sortBy, page]);

  // ─── Tab change ──────────────────────────────────────────────────────────
  const changeTab = useCallback((newTab: AnyTab) => {
    setTab(newTab);
    setSelected(new Set());

    const isNewEntryTab = !PHASE3_TABS.some((t) => t.id === newTab) && newTab !== "search";
    if (isNewEntryTab) {
      setSearch(""); setCategory(""); setFavOnly(false); setPage(1);
      const newType = TAB_CFG[newTab as TabKey]?.type ?? null;
      startTransition(() => {
        fetchEntries({ type: newType, q: "", cat: "", fav: false, pg: 1 });
      });
    }
  }, [fetchEntries]);

  // ─── Editor
  const openEditor = useCallback(async (entry: HubEntry) => {
    const res  = await fetch(`/api/admin/hub/${entry.id}`);
    const full = await res.json();
    setEditingEntry(full);
    setEditorOpen(true);
  }, []);

  // Open entry from assistant or analytics
  const openEntryById = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/hub/${id}`);
    const full = await res.json();
    setEditingEntry(full);
    setEditorOpen(true);
  }, []);

  const handleSaved = useCallback((saved: HubEntry) => {
    setEntries((prev) => {
      const exists = prev.find((e) => e.id === saved.id);
      if (exists) return prev.map((e) => e.id === saved.id ? saved : e);
      return [saved, ...prev];
    });
    const isNew = !entries.find((e) => e.id === saved.id);
    if (isNew) {
      setTotal((t) => t + 1);
      const countKey = getTypeCountKey(saved.type);
      setStatsData((s) => ({ ...s, total: s.total + 1, [countKey]: ((s[countKey] as number) ?? 0) + 1 }));
    }
    setEditorOpen(false);
    setEditingEntry(null);
  }, [entries]);

  // ─── Optimistic ops
  const handleToggleFav = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/hub/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "toggleFavourite" }),
    });
    const upd = await res.json();
    setEntries((p) => p.map((e) => e.id === id ? { ...e, isFavourite: upd.isFavourite } : e));
    setStatsData((s) => ({ ...s, favourites: s.favourites + (upd.isFavourite ? 1 : -1) }));
  }, []);

  const handleTogglePin = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/hub/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "togglePin" }),
    });
    const upd = await res.json();
    setEntries((p) => p.map((e) => e.id === id ? { ...e, isPinned: upd.isPinned } : e));
    setStatsData((s) => ({ ...s, pinned: s.pinned + (upd.isPinned ? 1 : -1) }));
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/hub/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "duplicate" }),
    });
    const copy = await res.json();
    setEntries((p) => [copy, ...p]);
    setTotal((t) => t + 1);
    const countKey = getTypeCountKey(copy.type);
    setStatsData((s) => ({ ...s, total: s.total + 1, [countKey]: ((s[countKey] as number) ?? 0) + 1 }));
  }, []);

  const handleDelete = useCallback((id: string, title: string) => {
    setConfirm({
      open: true, danger: true,
      title: `Delete "${title}"?`,
      message: "This entry will be permanently deleted from your knowledge base.",
      confirmLabel: "Delete",
      action: async () => {
        const entry = entries.find((e) => e.id === id);
        await fetch(`/api/admin/hub/${id}`, { method: "DELETE" });
        setEntries((p) => p.filter((e) => e.id !== id));
        setTotal((t) => t - 1);
        if (entry) {
          const k = getTypeCountKey(entry.type);
          setStatsData((s) => ({ ...s, total: s.total - 1, [k]: Math.max(0, ((s[k] as number) ?? 1) - 1) }));
        }
        setSelected((p) => { const n = new Set(p); n.delete(id); return n; });
      },
    });
  }, [entries]);

  const handleBulkDelete = () => {
    const ids = [...selected];
    setConfirm({
      open: true, danger: true,
      title: `Delete ${ids.length} entr${ids.length === 1 ? "y" : "ies"}?`,
      message: "Selected entries will be permanently deleted.",
      confirmLabel: "Delete All",
      action: async () => {
        await fetch("/api/admin/hub", {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        setEntries((p) => p.filter((e) => !ids.includes(e.id)));
        setTotal((t) => t - ids.length);
        setSelected(new Set());
        setStatsData((s) => ({ ...s, total: s.total - ids.length }));
      },
    });
  };



  const handleOpenFromSearch = useCallback((item: SearchOpenEntry) => {
    const newTab = typeToTabKey(item.type);
    changeTab(newTab);
    setTimeout(() => {
      fetch(`/api/admin/hub/${item.id}`)
        .then((r) => r.json())
        .then((full) => { setEditingEntry(full); setEditorOpen(true); });
    }, 150);
  }, [changeTab]);

  const runConfirm = async () => {
    if (!confirm.action) return;
    setConfirmLoading(true);
    await confirm.action();
    setConfirm((s) => ({ ...s, open: false }));
    setConfirmLoading(false);
  };

  const toggleSelect = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      if (p.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });

  const toggleSelectAll = () =>
    setSelected(selected.size === entries.length && entries.length > 0
      ? new Set()
      : new Set(entries.map((e) => e.id))
    );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <ConfirmDialog
        open={confirm.open} title={confirm.title} message={confirm.message}
        danger={confirm.danger} confirmLabel={confirm.confirmLabel}
        onConfirm={runConfirm} onCancel={() => setConfirm((s) => ({ ...s, open: false }))}
        loading={confirmLoading}
      />

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-3 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Developer Hub</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {statsData.total} entries · {statsData.totalCopies} copies · {statsData.favourites} favourites
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Phase 3 quick-access buttons */}
            {PHASE3_TABS.map((pt) => (
              <button key={pt.id} onClick={() => changeTab(pt.id)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
                  tab === pt.id
                    ? "text-white border-transparent shadow-sm"
                    : "text-stone-500 border-stone-200 hover:border-stone-400 bg-white"
                }`}
                style={tab === pt.id ? { backgroundColor: pt.color } : {}}>
                <pt.icon className="w-3.5 h-3.5" />
                {pt.label}
              </button>
            ))}
            {isEntryTab && (
              <button
                onClick={() => { setEditingEntry(null); setEditorOpen(true); }}
                className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New {tabCfg?.label?.replace(/s$/, "") ?? "Entry"}
              </button>
            )}
          </div>
        </div>

        {/* Stats bar — only show on entry + search tabs */}
        {!isPhase3Tab && (
          <HubStatsBar stats={statsData} activeTab={tab as TabKey} onTabClick={(t) => changeTab(t)} />
        )}

        {/* Phase 3 tab header (when on a phase 3 view) */}
        {isPhase3Tab && (
          <div className="flex items-center gap-1 mb-1">
            {PHASE3_TABS.map((pt) => (
              <button key={pt.id} onClick={() => changeTab(pt.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-sm transition-all ${
                  tab === pt.id ? "text-white shadow-sm" : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                }`}
                style={tab === pt.id ? { backgroundColor: pt.color } : {}}>
                <pt.icon className="w-4 h-4" />
                {pt.label}
              </button>
            ))}
            <div className="ml-2 pl-2 border-l border-stone-200">
              <button onClick={() => changeTab("snippets")}
                className="text-xs text-stone-400 hover:text-stone-700 px-3 py-2 rounded-sm hover:bg-stone-100 transition-colors">
                ← Back to entries
              </button>
            </div>
          </div>
        )}

        {/* Entry tab pills (when on entry or search tab) */}
        {!isPhase3Tab && (
          <div className="flex items-center gap-0.5 overflow-x-auto -mx-1 px-1 mt-1">
            {(Object.entries(TAB_CFG) as [TabKey, typeof TAB_CFG[TabKey]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => changeTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-sm transition-all whitespace-nowrap flex-shrink-0 ${
                  tab === key ? "text-white shadow-sm" : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                }`}
                style={tab === key ? { backgroundColor: cfg.color } : {}}>
                <cfg.icon className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — only for entry tabs */}
        {isEntryTab && (
          <HubSidebar
            stats={statsData}
            activeCategory={category}
            favOnly={favOnly}
            activeTab={tab as TabKey}
            onTabChange={(t) => changeTab(t)}
            onCategoryChange={(cat) => { setCategory(cat); setPage(1); fetchEntries({ cat, pg: 1 }); }}
            onFavToggle={() => { const next = !favOnly; setFavOnly(next); setPage(1); fetchEntries({ fav: next, pg: 1 }); }}
          />
        )}

        {/* Main panel */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── PHASE 3: AI ASSISTANT ─────────────────────────────── */}
          {tab === "ai" && (
            <HubAssistant onOpenEntry={openEntryById} />
          )}

          {/* ── PHASE 3: ANALYTICS ────────────────────────────────── */}
          {tab === "analytics" && (
            <HubAnalytics stats={statsData} onEdit={openEntryById} />
          )}

          {/* ── PHASE 3: IMPORT / EXPORT ──────────────────────────── */}
          {tab === "import" && (
            <HubImportExport />
          )}

          {/* ── PHASE 3: TAGS ─────────────────────────────────────── */}
          {tab === "tags" && (
            <HubTags />
          )}

          {/* ── GLOBAL SEARCH ─────────────────────────────────────── */}
          {isSearchTab && (
            <div className="flex-1 overflow-y-auto">
              <GlobalSearchPanel onOpenEntry={handleOpenFromSearch} />
            </div>
          )}

          {/* ── ENTRY LIST (all entry tabs) ───────────────────────── */}
          {isEntryTab && (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 flex-shrink-0 flex-wrap">
                <div className="relative flex-1 min-w-[160px] max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                  <input value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); fetchEntries({ q: e.target.value, pg: 1 }); }}
                    placeholder={`Search ${tabCfg?.label?.toLowerCase() ?? "entries"}…`}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
                  />
                </div>
                <select value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); fetchEntries({ sort: e.target.value, pg: 1 }); }}
                  className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-amber-400">
                  <option value="createdAt_desc">Newest</option>
                  <option value="createdAt_asc">Oldest</option>
                  <option value="updatedAt_desc">Recently edited</option>
                  <option value="copyCount_desc">Most copied</option>
                  <option value="title_asc">Title A–Z</option>
                </select>
                {isPending && <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />}
                {selected.size > 0 && (
                  <div className="flex items-center gap-2 ml-auto pl-2 border-l border-stone-200">
                    <span className="text-xs font-semibold text-stone-600">{selected.size} selected</span>
                    <button onClick={handleBulkDelete}
                      className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                    <button onClick={() => setSelected(new Set())} className="text-xs text-stone-400 hover:text-stone-700 transition-colors">Clear</button>
                  </div>
                )}
                <span className="text-xs text-stone-400 ml-auto">{total} entr{total !== 1 ? "ies" : "y"}</span>
              </div>

              {/* Select-all bar */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-stone-50 bg-stone-50/40 flex-shrink-0">
                <button onClick={toggleSelectAll} className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center gap-1.5 transition-colors">
                  {selected.size === entries.length && entries.length > 0
                    ? <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                    : <Square      className="w-3.5 h-3.5" />}
                  Select all
                </button>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {entries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    {tabCfg && (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${tabCfg.color}15` }}>
                        <tabCfg.icon className="w-6 h-6" style={{ color: tabCfg.color }} />
                      </div>
                    )}
                    <p className="text-sm text-stone-400 font-medium">
                      {search ? `No ${tabCfg?.label?.toLowerCase() ?? "entries"} matching "${search}"` : `No ${tabCfg?.label?.toLowerCase() ?? "entries"} yet`}
                    </p>
                    <button onClick={() => { setEditingEntry(null); setEditorOpen(true); }}
                      className="mt-3 text-xs text-amber-600 font-semibold hover:text-amber-800 underline underline-offset-2 transition-colors">
                      Add your first {tabCfg?.label?.replace(/s$/, "")?.toLowerCase() ?? "entry"}
                    </button>
                  </div>
                ) : (
                  <AnimatePresence>
                    {entries.map((entry) => (
                      <EntryCard key={entry.id} entry={entry}
                        selected={selected.has(entry.id)}
                        onSelect={toggleSelect} onEdit={openEditor}
                        onDelete={handleDelete} onToggleFav={handleToggleFav}
                        onTogglePin={handleTogglePin} onDuplicate={handleDuplicate}
                      />
                    ))}
                  </AnimatePresence>
                )}

                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <button disabled={page <= 1}
                      onClick={() => { setPage(page - 1); fetchEntries({ pg: page - 1 }); }}
                      className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                      ← Prev
                    </button>
                    <span className="text-xs text-stone-400">Page {page} of {pages}</span>
                    <button disabled={page >= pages}
                      onClick={() => { setPage(page + 1); fetchEntries({ pg: page + 1 }); }}
                      className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── EDITOR SLIDE-IN ──────────────────────────────────────── */}
        <AnimatePresence>
          {editorOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 560, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex-shrink-0 overflow-hidden border-l border-stone-200"
              style={{ minWidth: 0 }}
            >
              <div className="w-[560px] h-full">
                <EditorShell
                  entry={editingEntry}
                  defaultType={currentType ?? "SNIPPET"}
                  onSaved={handleSaved}
                  onCancel={() => { setEditorOpen(false); setEditingEntry(null); }}
                >
                  {({ payload, setPayload }) => (
                    <TypeEditor payload={payload} setPayload={setPayload} />
                  )}
                </EditorShell>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}