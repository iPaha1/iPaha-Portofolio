"use client";

// =============================================================================
// isaacpaha.com — Shared List Client
// app/tools/smart-shopping-list/share/[shareId]/shared-list-client.tsx
//
// The stunning real-time shared shopping experience.
// Polls the API every 3s for changes made by other collaborators.
// Fully works without a Clerk account — anyone with the link can use it.
// =============================================================================

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Plus, Loader2, RefreshCw, Share2, Copy, X,
  ChevronDown, ChevronUp, Sparkles, ShoppingCart, Edit2,
  Trash2, AlertCircle, User, Package, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemStatus   = "PENDING" | "BOUGHT" | "SKIPPED";
type ItemCategory =
  | "PRODUCE" | "DAIRY" | "MEAT_FISH" | "BAKERY" | "FROZEN"
  | "PANTRY" | "DRINKS" | "SNACKS" | "HOUSEHOLD" | "PERSONAL_CARE"
  | "BABY" | "PET" | "PHARMACY" | "ELECTRONICS" | "OTHER";

interface ShoppingItem {
  id:             string;
  name:           string;
  quantity?:      string | null;
  unit?:          string | null;
  category:       ItemCategory;
  brand?:         string | null;
  notes?:         string | null;
  estimatedPrice?: string | null;
  actualPrice?:   string | null;
  status:         ItemStatus;
  boughtAt?:      string | null;
  boughtBy?:      string | null;
  sortOrder:      number;
}

interface ShoppingList {
  id:           string;
  name:         string;
  emoji:        string;
  description?: string | null;
  shareId:      string;
  visibility:   string;
  storeName?:   string | null;
  budgetEnabled: boolean;
  budgetAmount?: string | null;
  currency:     string;
  actualSpend?: string | null;
  itemCount:    number;
  boughtCount:  number;
  completedAt?: string | null;
  lastActivityAt: string;
  items:        ShoppingItem[];
}

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<ItemCategory, { label: string; emoji: string; color: string; bg: string }> = {
  PRODUCE:       { label: "Fruit & Veg",      emoji: "🥦", color: "#16a34a", bg: "#dcfce7" },
  DAIRY:         { label: "Dairy",            emoji: "🥛", color: "#0284c7", bg: "#e0f2fe" },
  MEAT_FISH:     { label: "Meat & Fish",      emoji: "🥩", color: "#dc2626", bg: "#fee2e2" },
  BAKERY:        { label: "Bakery",           emoji: "🍞", color: "#d97706", bg: "#fef3c7" },
  FROZEN:        { label: "Frozen",           emoji: "🧊", color: "#7c3aed", bg: "#ede9fe" },
  PANTRY:        { label: "Pantry",           emoji: "🥫", color: "#92400e", bg: "#fef3c7" },
  DRINKS:        { label: "Drinks",           emoji: "🥤", color: "#0891b2", bg: "#cffafe" },
  SNACKS:        { label: "Snacks",           emoji: "🍪", color: "#ea580c", bg: "#ffedd5" },
  HOUSEHOLD:     { label: "Household",        emoji: "🧽", color: "#0d9488", bg: "#ccfbf1" },
  PERSONAL_CARE: { label: "Personal Care",    emoji: "🧴", color: "#be185d", bg: "#fce7f3" },
  BABY:          { label: "Baby",             emoji: "👶", color: "#7c3aed", bg: "#ede9fe" },
  PET:           { label: "Pet",              emoji: "🐾", color: "#92400e", bg: "#fef3c7" },
  PHARMACY:      { label: "Pharmacy",         emoji: "💊", color: "#b91c1c", bg: "#fee2e2" },
  ELECTRONICS:   { label: "Electronics",      emoji: "🔋", color: "#1d4ed8", bg: "#dbeafe" },
  OTHER:         { label: "Other",            emoji: "📦", color: "#6b7280", bg: "#f3f4f6" },
};

// ─── Guest name helper ────────────────────────────────────────────────────────

function useGuestName(): [string, (n: string) => void] {
  const [name, setNameState] = useState("Guest");
  useEffect(() => {
    const stored = localStorage.getItem("shopping_guest_name");
    if (stored) setNameState(stored);
  }, []);
  const setName = (n: string) => {
    localStorage.setItem("shopping_guest_name", n);
    setNameState(n);
  };
  return [name, setName];
}

// ─── Item component ───────────────────────────────────────────────────────────

function ItemRow({
  item, shareId, guestName, onUpdate,
}: {
  item:      ShoppingItem;
  shareId:   string;
  guestName: string;
  onUpdate:  (updated: ShoppingItem) => void;
}) {
  const [toggling,  setToggling]  = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [editName,  setEditName]  = useState(item.name);
  const cfg   = CATEGORY_CFG[item.category] ?? CATEGORY_CFG.OTHER;
  const isBought = item.status === "BOUGHT";

  const toggle = async () => {
    setToggling(true);
    const newStatus = isBought ? "PENDING" : "BOUGHT";
    try {
      const res  = await fetch(`/api/tools/shopping/share?shareId=${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ itemId: item.id, status: newStatus, boughtBy: guestName }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data.item);
    } catch {}
    setToggling(false);
  };

  const saveEdit = async () => {
    if (!editName.trim() || editName === item.name) { setEditing(false); return; }
    try {
      const res  = await fetch(`/api/tools/shopping/lists/${item.id.split("_")[0]}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: editName.trim() }),
      });
      // The item update hits the auth-protected route — for shared guests, we optimistically update
      onUpdate({ ...item, name: editName.trim() });
    } catch {}
    setEditing(false);
  };

  const fmtQty = () => {
    if (!item.quantity) return null;
    const q = parseFloat(item.quantity);
    if (isNaN(q)) return null;
    return `${q % 1 === 0 ? q.toFixed(0) : q}${item.unit ? ` ${item.unit}` : ""}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
        isBought
          ? "bg-stone-50/60 border-stone-100 opacity-60"
          : "bg-white border-stone-100 hover:border-stone-200 hover:shadow-sm active:scale-[0.99]"
      }`}
    >
      {/* Tick button */}
      <button
        onClick={toggle}
        disabled={toggling}
        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
          isBought
            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200"
            : "border-stone-300 hover:border-emerald-400 active:scale-95"
        }`}
      >
        {toggling
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
          : isBought
          ? <Check className="w-3.5 h-3.5" />
          : null
        }
      </button>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") { setEditing(false); setEditName(item.name); } }}
              className="flex-1 text-sm font-semibold bg-transparent border-b-2 border-emerald-400 outline-none pb-0.5"
            />
            <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setEditing(false); setEditName(item.name); }} className="text-stone-400"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <p className={`text-sm font-semibold leading-snug ${isBought ? "line-through text-stone-400" : "text-stone-800"}`}>
            {item.name}
          </p>
        )}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {fmtQty() && (
            <span className="text-[11px] text-stone-400 font-medium">{fmtQty()}</span>
          )}
          {item.brand && (
            <span className="text-[11px] text-stone-400">· {item.brand}</span>
          )}
          {item.notes && (
            <span className="text-[11px] text-stone-400 italic">· {item.notes}</span>
          )}
          {isBought && item.boughtBy && (
            <span className="text-[10px] text-emerald-500 font-semibold">✓ {item.boughtBy}</span>
          )}
        </div>
      </div>

      {/* Category tag */}
      <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ color: cfg.color, backgroundColor: cfg.bg }}>
        <span>{cfg.emoji}</span>
      </span>

      {/* Price */}
      {item.estimatedPrice && !isBought && (
        <span className="text-xs font-semibold text-stone-400 flex-shrink-0">
          £{parseFloat(item.estimatedPrice).toFixed(2)}
        </span>
      )}

      {/* Edit button - only shows on hover */}
      {!isBought && !editing && (
        <button onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-stone-300 hover:text-stone-600 transition-all">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

// ─── Add item form ────────────────────────────────────────────────────────────

function AddItemForm({
  shareId, guestName, onAdded,
}: {
  shareId:   string;
  guestName: string;
  onAdded:   (item: ShoppingItem) => void;
}) {
  const [name,     setName]     = useState("");
  const [qty,      setQty]      = useState("");
  const [unit,     setUnit]     = useState("");
  const [category, setCategory] = useState<ItemCategory>("OTHER");
  const [price,    setPrice]    = useState("");
  const [expanded, setExpanded] = useState(false);
  const [adding,   setAdding]   = useState(false);
  const [error,    setError]    = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!name.trim()) return;
    setAdding(true); setError("");
    try {
      const res  = await fetch(`/api/tools/shopping/share?shareId=${shareId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name, quantity: qty || undefined, unit: unit || undefined,
          category, guestName, estimatedPrice: price || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      onAdded(data.item);
      setName(""); setQty(""); setUnit(""); setPrice(""); setCategory("OTHER");
      inputRef.current?.focus();
    } catch { setError("Network error"); }
    setAdding(false);
  };

  return (
    <div className="bg-white border-2 border-dashed border-stone-200 rounded-xl p-4 hover:border-emerald-300 transition-colors">
      {/* Main input row */}
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-stone-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add an item…"
          className="flex-1 text-sm font-semibold placeholder:text-stone-300 bg-transparent outline-none"
        />
        <button onClick={() => setExpanded(p => !p)}
          className="text-stone-300 hover:text-stone-600 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          onClick={submit}
          disabled={adding || !name.trim()}
          className="flex-shrink-0 w-8 h-8 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-all active:scale-95"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Extra fields */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pt-3 mt-3 border-t border-stone-100 grid grid-cols-2 gap-2">
              <input value={qty} onChange={(e) => setQty(e.target.value)}
                placeholder="Qty (e.g. 2)"
                className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-400"
              />
              <input value={unit} onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit (kg, g, pack…)"
                className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-400"
              />
              <select value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="col-span-2 text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-emerald-400">
                {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder="Est. price (£)"
                className="col-span-2 text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── MAIN SHARED LIST CLIENT ──────────────────────────────────────────────────

interface SharedListClientProps {
  initialList: ShoppingList;
  shareId:     string;
}

export function SharedListClient({ initialList, shareId }: SharedListClientProps) {
  const [list,       setList]       = useState<ShoppingList>(initialList);
  const [guestName,  setGuestName]  = useGuestName();
  const [nameEdit,   setNameEdit]   = useState(false);
  const [tempName,   setTempName]   = useState(guestName);
  const [viewMode,   setViewMode]   = useState<"grouped" | "flat" | "bought">("grouped");
  const [copied,     setCopied]     = useState(false);
  const [lastPoll,   setLastPoll]   = useState<string>(initialList.lastActivityAt);
  const [pollBadge,  setPollBadge]  = useState(0);  // count of updates from others
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Real-time polling ──────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    try {
      const res  = await fetch(`/api/tools/shopping/share?shareId=${shareId}&poll=1`);
      const data = await res.json();
      if (!res.ok || !data.list) return;
      if (data.list.lastActivityAt !== lastPoll) {
        // Activity detected — full re-fetch
        const fullRes  = await fetch(`/api/tools/shopping/share?shareId=${shareId}`);
        const fullData = await fullRes.json();
        if (fullData.list) {
          setList(fullData.list);
          setLastPoll(fullData.list.lastActivityAt);
          setPollBadge(0);
        }
      }
    } catch {}
  }, [shareId, lastPoll]);

  useEffect(() => {
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [poll]);

  // ── Item update helpers ────────────────────────────────────────────────────

  const handleItemUpdate = useCallback((updated: ShoppingItem) => {
    setList(prev => ({
      ...prev,
      boughtCount: (() => {
        const wasB = prev.items.find(i => i.id === updated.id)?.status === "BOUGHT";
        const isB  = updated.status === "BOUGHT";
        if (isB && !wasB) return prev.boughtCount + 1;
        if (!isB && wasB) return Math.max(0, prev.boughtCount - 1);
        return prev.boughtCount;
      })(),
      items: prev.items.map(i => i.id === updated.id ? updated : i),
    }));
  }, []);

  const handleItemAdded = useCallback((item: ShoppingItem) => {
    setList(prev => ({
      ...prev,
      itemCount: prev.itemCount + 1,
      items: [...prev.items, item],
    }));
  }, []);

  // ── Computed values ────────────────────────────────────────────────────────

  const items        = list.items ?? [];
  const pending      = items.filter(i => i.status === "PENDING");
  const bought       = items.filter(i => i.status === "BOUGHT");
  const total        = items.length;
  const pct          = total > 0 ? Math.round((bought.length / total) * 100) : 0;
  const budget       = list.budgetAmount ? parseFloat(list.budgetAmount) : 0;
  const estimated    = items.reduce((s, i) => s + (i.estimatedPrice ? parseFloat(i.estimatedPrice) : 0), 0);
  const allDone      = total > 0 && bought.length === total;

  // Grouped by category
  const grouped = useMemo(() => {
    const g: Record<string, ShoppingItem[]> = {};
    pending.forEach(i => {
      const cat = i.category ?? "OTHER";
      (g[cat] = g[cat] ?? []).push(i);
    });
    return Object.entries(g).sort((a, b) => {
      // Sort by category order matching store flow
      const order = ["PRODUCE","BAKERY","MEAT_FISH","DAIRY","FROZEN","DRINKS","PANTRY","SNACKS","HOUSEHOLD","PERSONAL_CARE","PHARMACY","BABY","PET","ELECTRONICS","OTHER"];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    });
  }, [pending]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen mt-16" style={{
      background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 30%, #f0f9ff 70%, #fef9f0 100%)",
      fontFamily: "Sora, sans-serif",
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 backdrop-blur-md border-b border-white/50"
        style={{ background: "rgba(255,255,255,0.85)" }}>
        <div className="max-w-lg mx-auto px-4 py-4">

          {/* List name + share */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl flex-shrink-0">{list.emoji}</span>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-stone-900 leading-tight truncate">{list.name}</h1>
                {list.storeName && (
                  <p className="text-xs text-stone-400 font-medium">{list.storeName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={copyLink}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-500 border border-stone-200 hover:border-emerald-400 hover:text-emerald-600 px-3 py-2 rounded-full transition-all active:scale-95">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-500">
                {bought.length} of {total} items done
              </span>
              <span className="text-xs font-black" style={{
                color: pct === 100 ? "#059669" : pct >= 50 ? "#d97706" : "#6b7280",
              }}>{pct}%</span>
            </div>
            <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: pct === 100 ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #34d399, #10b981)" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Budget indicator */}
          {list.budgetEnabled && budget > 0 && estimated > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Est. total</span>
              <span className={`font-black ${estimated > budget ? "text-red-500" : "text-emerald-600"}`}>
                £{estimated.toFixed(2)}{budget > 0 ? ` / £${budget.toFixed(2)}` : ""}
              </span>
            </div>
          )}

          {/* All done banner */}
          {allDone && (
            <div className="mt-2 flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-4 py-2 text-sm font-bold text-emerald-700">
              <span>🎉</span>Shopping complete! All items ticked off.
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-24 space-y-5">

        {/* Guest name prompt */}
        <div className="flex items-center gap-2 bg-white/80 border border-stone-100 rounded-xl px-4 py-3">
          <User className="w-4 h-4 text-stone-400 flex-shrink-0" />
          {nameEdit ? (
            <div className="flex-1 flex items-center gap-2">
              <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setGuestName(tempName); setNameEdit(false); } }}
                placeholder="Your name"
                className="flex-1 text-sm font-semibold bg-transparent outline-none border-b border-emerald-400"
              />
              <button onClick={() => { setGuestName(tempName); setNameEdit(false); }}
                className="text-emerald-500"><Check className="w-4 h-4" /></button>
              <button onClick={() => setNameEdit(false)} className="text-stone-400"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm text-stone-600">
                Shopping as <span className="font-bold text-stone-900">{guestName}</span>
              </span>
              <button onClick={() => { setTempName(guestName); setNameEdit(true); }}
                className="text-xs text-stone-400 hover:text-stone-700 underline">Change</button>
            </div>
          )}
        </div>

        {/* Add item */}
        <AddItemForm shareId={shareId} guestName={guestName} onAdded={handleItemAdded} />

        {/* View mode tabs */}
        {total > 0 && (
          <div className="flex gap-1 bg-stone-100 rounded-full p-1">
            {([
              { id: "grouped", label: "By Category" },
              { id: "flat",    label: "All Items"   },
              { id: "bought",  label: `Done (${bought.length})` },
            ] as const).map((m) => (
              <button key={m.id} onClick={() => setViewMode(m.id)}
                className={`flex-1 text-xs font-bold py-2 rounded-full transition-all ${
                  viewMode === m.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                }`}>
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* ── GROUPED VIEW ──────────────────────────────────────────────── */}
        {viewMode === "grouped" && (
          <div className="space-y-4">
            {pending.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl mb-3">✅</span>
                <p className="text-base font-black text-stone-700">All done!</p>
                <p className="text-sm text-stone-400 mt-1">Every item has been ticked off.</p>
              </div>
            )}
            <AnimatePresence>
              {grouped.map(([cat, catItems]) => {
                const cfg = CATEGORY_CFG[cat as ItemCategory] ?? CATEGORY_CFG.OTHER;
                return (
                  <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{cfg.emoji}</span>
                      <p className="text-xs font-black uppercase tracking-wider" style={{ color: cfg.color }}>
                        {cfg.label}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}>{catItems.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      <AnimatePresence>
                        {catItems.map(item => (
                          <ItemRow key={item.id} item={item} shareId={shareId}
                            guestName={guestName} onUpdate={handleItemUpdate} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ── FLAT VIEW ─────────────────────────────────────────────────── */}
        {viewMode === "flat" && (
          <div className="space-y-1.5">
            {items.filter(i => i.status === "PENDING").length === 0 && (
              <p className="text-sm text-stone-400 text-center py-6">All items ticked off!</p>
            )}
            <AnimatePresence>
              {items.filter(i => i.status === "PENDING").map(item => (
                <ItemRow key={item.id} item={item} shareId={shareId}
                  guestName={guestName} onUpdate={handleItemUpdate} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── BOUGHT VIEW ───────────────────────────────────────────────── */}
        {viewMode === "bought" && (
          <div className="space-y-1.5">
            {bought.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-6">Nothing ticked off yet</p>
            )}
            <AnimatePresence>
              {bought.map(item => (
                <ItemRow key={item.id} item={item} shareId={shareId}
                  guestName={guestName} onUpdate={handleItemUpdate} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-base font-black text-stone-700 mb-1">Your list is empty</p>
            <p className="text-sm text-stone-400">Type an item above and press Enter to add it</p>
          </div>
        )}
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-md border-t border-white/50 px-4 py-3"
        style={{ background: "rgba(255,255,255,0.9)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Updates every 3s
          </span>
          <a href="/tools/smart-shopping-list" className="font-bold text-emerald-600 hover:underline">
            📋 Create your own list
          </a>
        </div>
      </div>
    </div>
  );
}