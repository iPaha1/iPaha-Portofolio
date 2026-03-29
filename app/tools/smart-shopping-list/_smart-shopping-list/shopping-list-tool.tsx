"use client";

// =============================================================================
// isaacpaha.com — Smart Shared Shopping List Tool
// app/tools/smart-shopping-list/_components/shopping-list-tool.tsx
//
// Full-featured shopping list manager:
//   - Create multiple lists (weekly, monthly, event, template)
//   - Add items with category, quantity, price
//   - Tick off items
//   - Share via unique link (generates public shared page)
//   - AI: meal planner → list, smart suggestions, store mode ordering
//   - Budget tracker with estimated vs actual
//   - Duplicate lists, use templates
//   - View by category or flat list
// =============================================================================

import React, {
  useState, useCallback, useEffect, useMemo, useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Check, Share2, Copy, Loader2, Edit2, X,
  Sparkles, ChevronDown, ChevronUp, ShoppingCart, BarChart2,
  RefreshCw, Download, Archive, Star, Zap, List,
  Grid3x3, Search, Target, BookOpen, AlertCircle, Info,
  Send, MessageSquare, ExternalLink, DollarSign, Lock,
  FileText, Wand2, Package,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemStatus   = "PENDING" | "BOUGHT" | "SKIPPED";
type ItemCategory =
  | "PRODUCE" | "DAIRY" | "MEAT_FISH" | "BAKERY" | "FROZEN"
  | "PANTRY" | "DRINKS" | "SNACKS" | "HOUSEHOLD" | "PERSONAL_CARE"
  | "BABY" | "PET" | "PHARMACY" | "ELECTRONICS" | "OTHER";
  

interface ShoppingItem {
  id:              string;
  name:            string;
  quantity?:       string | null;
  unit?:           string | null;
  category:        ItemCategory;
  brand?:          string | null;
  notes?:          string | null;
  estimatedPrice?: string | null;
  actualPrice?:    string | null;
  status:          ItemStatus;
  sortOrder:       number;
  boughtBy?:       string | null;
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
  isArchived:   boolean;
  isTemplate:   boolean;
  lastActivityAt: string;
  createdAt:    string;
  items:        ShoppingItem[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<ItemCategory, { label: string; emoji: string; color: string; bg: string }> = {
  PRODUCE:       { label: "Fruit & Veg",   emoji: "🥦", color: "#16a34a", bg: "#dcfce7" },
  DAIRY:         { label: "Dairy",         emoji: "🥛", color: "#0284c7", bg: "#e0f2fe" },
  MEAT_FISH:     { label: "Meat & Fish",   emoji: "🥩", color: "#dc2626", bg: "#fee2e2" },
  BAKERY:        { label: "Bakery",        emoji: "🍞", color: "#d97706", bg: "#fef3c7" },
  FROZEN:        { label: "Frozen",        emoji: "🧊", color: "#7c3aed", bg: "#ede9fe" },
  PANTRY:        { label: "Pantry",        emoji: "🥫", color: "#92400e", bg: "#fef3c7" },
  DRINKS:        { label: "Drinks",        emoji: "🥤", color: "#0891b2", bg: "#cffafe" },
  SNACKS:        { label: "Snacks",        emoji: "🍪", color: "#ea580c", bg: "#ffedd5" },
  HOUSEHOLD:     { label: "Household",     emoji: "🧽", color: "#0d9488", bg: "#ccfbf1" },
  PERSONAL_CARE: { label: "Personal Care", emoji: "🧴", color: "#be185d", bg: "#fce7f3" },
  BABY:          { label: "Baby",          emoji: "👶", color: "#7c3aed", bg: "#ede9fe" },
  PET:           { label: "Pet",           emoji: "🐾", color: "#92400e", bg: "#fef3c7" },
  PHARMACY:      { label: "Pharmacy",      emoji: "💊", color: "#b91c1c", bg: "#fee2e2" },
  ELECTRONICS:   { label: "Electronics",   emoji: "🔋", color: "#1d4ed8", bg: "#dbeafe" },
  OTHER:         { label: "Other",         emoji: "📦", color: "#6b7280", bg: "#f3f4f6" },
};

const LIST_EMOJIS = ["🛒", "🥗", "🎉", "🏠", "🧹", "🍕", "🥩", "🌮", "🍜", "🎂", "🍱", "🥘", "🛍️", "📦", "🍺"];

const QUICK_TEMPLATES = [
  { name: "Weekly Essentials", emoji: "🛒", items: [
    { name: "Bread", category: "BAKERY", unit: "loaf", quantity: "1" },
    { name: "Milk", category: "DAIRY", unit: "l", quantity: "2" },
    { name: "Eggs", category: "DAIRY", unit: "pack", quantity: "1" },
    { name: "Butter", category: "DAIRY", unit: "pack", quantity: "1" },
    { name: "Bananas", category: "PRODUCE", unit: "pack", quantity: "1" },
    { name: "Chicken breast", category: "MEAT_FISH", unit: "kg", quantity: "1" },
    { name: "Rice", category: "PANTRY", unit: "kg", quantity: "1" },
    { name: "Pasta", category: "PANTRY", unit: "pack", quantity: "1" },
    { name: "Tomatoes", category: "PRODUCE", unit: "", quantity: "6" },
    { name: "Onions", category: "PRODUCE", unit: "kg", quantity: "1" },
  ]},
  { name: "Student Budget Shop", emoji: "🎓", items: [
    { name: "Baked beans", category: "PANTRY", unit: "can", quantity: "4" },
    { name: "Instant noodles", category: "PANTRY", unit: "pack", quantity: "6" },
    { name: "Bread", category: "BAKERY", unit: "loaf", quantity: "1" },
    { name: "Peanut butter", category: "PANTRY", unit: "jar", quantity: "1" },
    { name: "Milk", category: "DAIRY", unit: "l", quantity: "2" },
    { name: "Eggs", category: "DAIRY", unit: "pack", quantity: "1" },
    { name: "Frozen veg", category: "FROZEN", unit: "bag", quantity: "1" },
    { name: "Porridge oats", category: "PANTRY", unit: "kg", quantity: "1" },
    { name: "Tinned tuna", category: "PANTRY", unit: "can", quantity: "3" },
    { name: "Rice", category: "PANTRY", unit: "kg", quantity: "1" },
  ]},
  { name: "BBQ & Party", emoji: "🎉", items: [
    { name: "Burgers", category: "MEAT_FISH", unit: "pack", quantity: "2" },
    { name: "Sausages", category: "MEAT_FISH", unit: "pack", quantity: "2" },
    { name: "Burger buns", category: "BAKERY", unit: "pack", quantity: "2" },
    { name: "Coleslaw", category: "PRODUCE", unit: "tub", quantity: "1" },
    { name: "Salad leaves", category: "PRODUCE", unit: "bag", quantity: "2" },
    { name: "Crisps", category: "SNACKS", unit: "bag", quantity: "4" },
    { name: "Ketchup", category: "PANTRY", unit: "bottle", quantity: "1" },
    { name: "Mustard", category: "PANTRY", unit: "jar", quantity: "1" },
    { name: "Beer / lager", category: "DRINKS", unit: "pack", quantity: "2" },
    { name: "Soft drinks", category: "DRINKS", unit: "bottle", quantity: "4" },
  ]},
];

const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// ─── New List Form ────────────────────────────────────────────────────────────

function NewListForm({ onCreate, onCancel }: {
  onCreate: (data: { name: string; emoji: string; storeName?: string; budgetAmount?: string; isTemplate: boolean }) => void;
  onCancel: () => void;
}) {
  const [name,     setName]     = useState("");
  const [emoji,    setEmoji]    = useState("🛒");
  const [store,    setStore]    = useState("");
  const [budget,   setBudget]   = useState("");
  const [isTmpl,   setIsTmpl]   = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="bg-white border border-stone-200 rounded-sm p-5 space-y-4">
      <p className="text-sm font-black text-stone-800">New Shopping List</p>

      {/* Emoji picker */}
      <div className="flex flex-wrap gap-1.5">
        {LIST_EMOJIS.map((e) => (
          <button key={e} onClick={() => setEmoji(e)}
            className={`text-xl w-9 h-9 rounded-sm border-2 transition-all hover:scale-110 ${emoji === e ? "border-emerald-400 bg-emerald-50" : "border-stone-100"}`}>
            {e}
          </button>
        ))}
      </div>

      {/* Name */}
      <input value={name} onChange={(e) => setName(e.target.value)}
        placeholder="List name (e.g. Weekly Shop, Party Prep…)"
        className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onCreate({ name, emoji, storeName: store || undefined, budgetAmount: budget || undefined, isTemplate: isTmpl })}
      />

      <button onClick={() => setShowMore(p => !p)} className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1">
        {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showMore ? "Less options" : "More options (store, budget, template)"}
      </button>

      <AnimatePresence>
        {showMore && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
            <input value={store} onChange={(e) => setStore(e.target.value)}
              placeholder="Store name (e.g. Tesco, ASDA, Aldi…)"
              className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">£</span>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                placeholder="Budget (optional)"
                className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isTmpl} onChange={(e) => setIsTmpl(e.target.checked)} className="w-3.5 h-3.5 accent-emerald-500" />
              <span className="text-xs text-stone-600">Save as reusable template</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <button onClick={onCancel} className="text-xs font-semibold text-stone-400 border border-stone-200 px-4 py-2 rounded-sm hover:border-stone-400 transition-colors">Cancel</button>
        <button onClick={() => name.trim() && onCreate({ name, emoji, storeName: store || undefined, budgetAmount: budget || undefined, isTemplate: isTmpl })}
          disabled={!name.trim()}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 py-2 rounded-sm transition-colors disabled:opacity-60">
          <ShoppingCart className="w-4 h-4" />Create List
        </button>
      </div>
    </div>
  );
}

// ─── AI Assistant Panel ───────────────────────────────────────────────────────

function AIAssistant({ list, onItemsAdded }: { list: ShoppingList; onItemsAdded: (items: any[]) => void }) {
  const [mode,    setMode]    = useState<"meal" | "suggest" | "budget">("meal");
  const [input,   setInput]   = useState("");
  const [people,  setPeople]  = useState("2");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<any>(null);

  const run = async () => {
    setLoading(true); setResult(null);
    try {
      const res  = await fetch("/api/tools/shopping/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode === "meal" ? "meal_suggestions" : mode === "suggest" ? "smart_add" : "budget_tips",
          meals:     mode === "meal" ? (input || undefined) : undefined,
          items:     list.items,
          storeName: list.storeName ?? undefined,
          budget:    list.budgetAmount ?? undefined,
          people:    parseInt(people) || 2,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="bg-white border border-stone-100 rounded-sm p-5 space-y-4">
      <p className="text-xs font-black text-stone-400 uppercase tracking-wider">🤖 AI Shopping Assistant</p>

      {/* Mode tabs */}
      <div className="flex gap-1">
        {([
          { id: "meal",    label: "Meal Planner"     },
          { id: "suggest", label: "Smart Suggestions" },
          { id: "budget",  label: "Budget Tips"       },
        ] as const).map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`flex-1 text-xs font-bold py-2 rounded-sm border transition-colors ${
              mode === m.id ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-stone-200 text-stone-500"
            }`}>{m.label}</button>
        ))}
      </div>

      {mode === "meal" && (
        <div className="space-y-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
            placeholder='Describe your meal plan, e.g. "5-day healthy plan, high protein, no red meat"'
            className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400 resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500">People:</label>
            <input type="number" value={people} onChange={(e) => setPeople(e.target.value)} min={1} max={20}
              className="w-16 text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      )}

      {mode === "suggest" && (
        <p className="text-xs text-stone-500">AI will analyse your current list and suggest commonly forgotten items.</p>
      )}

      {mode === "budget" && list.budgetAmount && (
        <p className="text-xs text-stone-500">AI will suggest ways to reduce your spend on this list.</p>
      )}
      {mode === "budget" && !list.budgetAmount && (
        <p className="text-xs text-amber-600">Set a budget on this list first to get personalised tips.</p>
      )}

      <button onClick={run} disabled={loading}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 py-2.5 rounded-sm transition-colors disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "Thinking…" : mode === "meal" ? "Generate Shopping List" : mode === "suggest" ? "Get Suggestions" : "Get Budget Tips"}
      </button>

      {/* Results */}
      {result && !loading && (
        <div className="space-y-3">
          {/* Meal plan items */}
          {result.items?.length > 0 && (
            <div>
              {result.title && <p className="text-xs font-bold text-stone-600 mb-2">📋 {result.title}</p>}
              {result.estimatedTotal && <p className="text-xs text-emerald-600 mb-2 font-semibold">Est. total: £{result.estimatedTotal.toFixed(2)}</p>}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.items.map((item: any, i: number) => {
                  const cfg = CATEGORY_CFG[item.category as ItemCategory] ?? CATEGORY_CFG.OTHER;
                  return (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-stone-50 rounded-sm">
                      <div className="flex items-center gap-2">
                        <span>{cfg.emoji}</span>
                        <span className="text-xs text-stone-700">{item.name}</span>
                        {item.quantity && <span className="text-[10px] text-stone-400">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>}
                      </div>
                      {item.estimatedPrice && <span className="text-[10px] text-stone-400">£{item.estimatedPrice.toFixed(2)}</span>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => onItemsAdded(result.items)}
                className="w-full mt-2 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 py-2 rounded-sm transition-colors">
                Add all {result.items.length} items to list
              </button>
            </div>
          )}

          {/* Smart suggestions */}
          {result.suggestions?.length > 0 && (
            <div className="space-y-2">
              {result.suggestions.map((s: any, i: number) => {
                const cfg = CATEGORY_CFG[s.category as ItemCategory] ?? CATEGORY_CFG.OTHER;
                return (
                  <div key={i} className="flex items-center justify-between bg-stone-50 rounded-sm px-3 py-2">
                    <div>
                      <span className="text-xs font-semibold text-stone-700">{cfg.emoji} {s.name}</span>
                      <p className="text-[10px] text-stone-400 mt-0.5">{s.reason}</p>
                    </div>
                    <button onClick={() => onItemsAdded([s])}
                      className="text-xs text-emerald-600 font-bold border border-emerald-200 hover:bg-emerald-50 px-2 py-1 rounded-sm ml-2 flex-shrink-0">
                      + Add
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Budget tips */}
          {result.tips?.length > 0 && (
            <div className="space-y-2">
              {result.estimatedSavingsTotal && (
                <p className="text-xs font-bold text-emerald-700">💰 Potential savings: {result.estimatedSavingsTotal}</p>
              )}
              {result.tips.map((t: any, i: number) => (
                <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-2.5">
                  <p className="text-xs font-semibold text-emerald-900">{t.tip}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-emerald-600 font-bold">{t.estimatedSaving}</span>
                    <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{t.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN TOOL EXPORT ─────────────────────────────────────────────────────────

export function ShoppingListTool({ isSignedIn }: { isSignedIn: boolean }) {
  const { user }  = useUser();
  const [lists,   setLists]   = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId,setActiveId]= useState<string | null>(null);
  const [view,    setView]    = useState<"lists" | "list" | "new">("new");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCat,  setNewItemCat]  = useState<ItemCategory>("OTHER");
  const [newItemQty,  setNewItemQty]  = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [addExpanded, setAddExpanded] = useState(false);
  const [addingItem,  setAddingItem]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [copied,      setCopied]      = useState(false);
  const [showAI,      setShowAI]      = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const [showBudget,  setShowBudget]  = useState(false);
  const [actualSpend, setActualSpend] = useState("");
  const [creatingList,setCreatingList]= useState(false);

  // Local-only lists for anonymous users
  const [localLists,  setLocalLists]  = useState<ShoppingList[]>([]);

  const loadLists = useCallback(async () => {
    setLoading(true);
    if (isSignedIn) {
      try {
        const res  = await fetch("/api/tools/shopping/lists");
        const data = await res.json();
        setLists(data.lists ?? []);
      } catch {}
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem("shopping_lists_local") ?? "[]");
        setLocalLists(saved);
      } catch {}
    }
    setLoading(false);
  }, [isSignedIn]);

  useEffect(() => { loadLists(); }, [loadLists]);

  const allLists   = isSignedIn ? lists : localLists;
  const saveLists  = (updated: ShoppingList[]) => {
    if (isSignedIn) setLists(updated);
    else {
      setLocalLists(updated);
      try { localStorage.setItem("shopping_lists_local", JSON.stringify(updated)); } catch {}
    }
  };

  const activeList = useMemo(() => allLists.find(l => l.id === activeId) ?? null, [allLists, activeId]);

  // ── Create list ───────────────────────────────────────────────────────────

  const handleCreateList = async (data: { name: string; emoji: string; storeName?: string; budgetAmount?: string; isTemplate: boolean }) => {
    setCreatingList(true);
    if (isSignedIn) {
      try {
        const res   = await fetch("/api/tools/shopping/lists", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(data),
        });
        const resp  = await res.json();
        if (res.ok) {
          setLists(p => [resp.list, ...p]);
          setActiveId(resp.list.id);
          setView("list");
        }
      } catch {}
    } else {
      const newList: ShoppingList = {
        id: uid(), name: data.name, emoji: data.emoji,
        shareId: uid(), visibility: "SHARED",
        storeName: data.storeName ?? null,
        budgetEnabled: !!data.budgetAmount,
        budgetAmount: data.budgetAmount ?? null,
        currency: "GBP", actualSpend: null,
        itemCount: 0, boughtCount: 0,
        isArchived: false, isTemplate: data.isTemplate,
        lastActivityAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        items: [],
      };
      const updated = [newList, ...localLists];
      saveLists(updated);
      setActiveId(newList.id);
      setView("list");
    }
    setCreatingList(false);
  };

  // ── Use template ──────────────────────────────────────────────────────────

  const handleUseTemplate = async (template: typeof QUICK_TEMPLATES[0]) => {
    setCreatingList(true);
    const listData = { name: template.name, emoji: template.emoji, isTemplate: false };
    if (isSignedIn) {
      const res  = await fetch("/api/tools/shopping/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(listData) });
      const data = await res.json();
      if (res.ok) {
        await fetch(`/api/tools/shopping/lists/${data.list.id}/items`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template.items),
        });
        await loadLists();
        setActiveId(data.list.id);
        setView("list");
      }
    } else {
      const newList: ShoppingList = {
        id: uid(), name: template.name, emoji: template.emoji,
        shareId: uid(), visibility: "SHARED",
        storeName: null, budgetEnabled: false, budgetAmount: null,
        currency: "GBP", actualSpend: null, itemCount: template.items.length,
        boughtCount: 0, isArchived: false, isTemplate: false,
        lastActivityAt: new Date().toISOString(), createdAt: new Date().toISOString(),
        items: template.items.map((item, i) => ({
          id: uid(), ...item, status: "PENDING", sortOrder: i,
          quantity: item.quantity || null, unit: item.unit || null,
          brand: null, notes: null, estimatedPrice: null, actualPrice: null, boughtBy: null,
          category: item.category as ItemCategory,
        })),
      };
      const updated = [newList, ...localLists];
      saveLists(updated);
      setActiveId(newList.id);
      setView("list");
    }
    setCreatingList(false);
  };

  // ── Add item ──────────────────────────────────────────────────────────────

  const addItem = async () => {
    if (!newItemName.trim() || !activeList) return;
    setAddingItem(true);
    const itemData = {
      name: newItemName.trim(), quantity: newItemQty || undefined,
      unit: newItemUnit || undefined, category: newItemCat,
      estimatedPrice: newItemPrice || undefined,
    };
    if (isSignedIn) {
      try {
        const res  = await fetch(`/api/tools/shopping/lists/${activeList.id}/items`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(itemData),
        });
        const data = await res.json();
        if (res.ok) {
          updateList(activeList.id, l => ({
            ...l, itemCount: l.itemCount + 1,
            items: [...l.items, ...(data.items ?? [])],
          }));
        }
      } catch {}
    } else {
      const newItem: ShoppingItem = {
        id: uid(), ...itemData, status: "PENDING",
        sortOrder: activeList.items.length,
        quantity: itemData.quantity ?? null, unit: itemData.unit ?? null,
        brand: null, notes: null, estimatedPrice: itemData.estimatedPrice ?? null,
        actualPrice: null, boughtBy: null,
      };
      updateList(activeList.id, l => ({ ...l, itemCount: l.itemCount + 1, items: [...l.items, newItem] }));
    }
    setNewItemName(""); setNewItemQty(""); setNewItemUnit(""); setNewItemPrice(""); setNewItemCat("OTHER");
    setAddingItem(false);
  };

  // ── Tick item ─────────────────────────────────────────────────────────────

  const tickItem = async (item: ShoppingItem) => {
    const newStatus: ItemStatus = item.status === "BOUGHT" ? "PENDING" : "BOUGHT";
    if (isSignedIn && activeList) {
      await fetch(`/api/tools/shopping/lists/${activeList.id}/items/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, boughtBy: user?.firstName ?? "Me" }),
      });
    }
    updateList(activeList!.id, l => ({
      ...l,
      boughtCount: newStatus === "BOUGHT" ? l.boughtCount + 1 : Math.max(0, l.boughtCount - 1),
      items: l.items.map(i => i.id === item.id ? {
        ...i, status: newStatus,
        boughtBy: newStatus === "BOUGHT" ? (user?.firstName ?? "Me") : null,
      } : i),
    }));
  };

  // ── Delete item ───────────────────────────────────────────────────────────

  const deleteItem = async (item: ShoppingItem) => {
    if (isSignedIn && activeList) {
      await fetch(`/api/tools/shopping/lists/${activeList.id}/items/${item.id}`, { method: "DELETE" });
    }
    updateList(activeList!.id, l => ({
      ...l, itemCount: Math.max(0, l.itemCount - 1),
      boughtCount: item.status === "BOUGHT" ? Math.max(0, l.boughtCount - 1) : l.boughtCount,
      items: l.items.filter(i => i.id !== item.id),
    }));
  };

  // ── Delete list ───────────────────────────────────────────────────────────

  const deleteList = async (id: string) => {
    if (isSignedIn) await fetch(`/api/tools/shopping/lists/${id}`, { method: "DELETE" });
    const updated = allLists.filter(l => l.id !== id);
    saveLists(updated);
    if (activeId === id) { setActiveId(null); setView("lists"); }
  };

  // ── Use saved template: creates a fresh list with the same items ──────────

  const handleUseSavedTemplate = async (template: ShoppingList) => {
    setCreatingList(true);
    const listData = { name: template.name, emoji: template.emoji, isTemplate: false,
      storeName: template.storeName ?? undefined,
      budgetAmount: template.budgetAmount ?? undefined };
    if (isSignedIn) {
      try {
        const res  = await fetch("/api/tools/shopping/lists", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listData),
        });
        const data = await res.json();
        if (res.ok && template.items.length > 0) {
          await fetch(`/api/tools/shopping/lists/${data.list.id}/items`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(template.items.map(i => ({
              name: i.name, quantity: i.quantity, unit: i.unit,
              category: i.category, brand: i.brand, notes: i.notes,
              estimatedPrice: i.estimatedPrice,
            }))),
          });
          await loadLists();
          setActiveId(data.list.id);
          setView("list");
        }
      } catch {}
    } else {
      const newList: ShoppingList = {
        id: uid(), name: template.name, emoji: template.emoji,
        shareId: uid(), visibility: "SHARED",
        storeName: template.storeName ?? null,
        budgetEnabled: template.budgetEnabled,
        budgetAmount: template.budgetAmount ?? null,
        currency: template.currency ?? "GBP", actualSpend: null,
        itemCount: template.items.length, boughtCount: 0,
        isArchived: false, isTemplate: false,
        lastActivityAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        items: template.items.map((item, i) => ({
          ...item, id: uid(), status: "PENDING" as ItemStatus,
          sortOrder: i, boughtAt: null, boughtBy: null, actualPrice: null,
        })),
      };
      const updated = [newList, ...localLists];
      saveLists(updated);
      setActiveId(newList.id);
      setView("list");
    }
    setCreatingList(false);
  };

  // ── Update list helper ────────────────────────────────────────────────────

  const updateList = (id: string, fn: (l: ShoppingList) => ShoppingList) => {
    const updated = allLists.map(l => l.id === id ? fn(l) : l);
    saveLists(updated);
  };

  // ── Add AI items ──────────────────────────────────────────────────────────

  const handleAIItemsAdded = async (items: any[]) => {
    if (!activeList) return;
    if (isSignedIn) {
      const res  = await fetch(`/api/tools/shopping/lists/${activeList.id}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(items),
      });
      const data = await res.json();
      if (res.ok) {
        updateList(activeList.id, l => ({
          ...l, itemCount: l.itemCount + items.length,
          items: [...l.items, ...(data.items ?? [])],
        }));
      }
    } else {
      const newItems = items.map((item, i) => ({
        id: uid(), name: item.name, quantity: item.quantity ?? null, unit: item.unit ?? null,
        category: (item.category ?? "OTHER") as ItemCategory,
        brand: null, notes: item.notes ?? null, estimatedPrice: item.estimatedPrice ? String(item.estimatedPrice) : null,
        actualPrice: null, status: "PENDING" as ItemStatus, sortOrder: activeList.items.length + i, boughtBy: null,
      }));
      updateList(activeList.id, l => ({
        ...l, itemCount: l.itemCount + newItems.length, items: [...l.items, ...newItems],
      }));
    }
    setShowAI(false);
  };

  const shareUrl = activeList ? `${typeof window !== "undefined" ? window.location.origin : "https://isaacpaha.com"}/tools/smart-shopping-list/share/${activeList.shareId}` : "";

  // ── Filtered items ────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!activeList) return [];
    const s = search.toLowerCase();
    return activeList.items.filter(i => !s || i.name.toLowerCase().includes(s));
  }, [activeList, search]);

  const pendingItems = filteredItems.filter(i => i.status === "PENDING");
  const boughtItems  = filteredItems.filter(i => i.status === "BOUGHT");

  // Group pending by category
  const grouped = useMemo(() => {
    const g: Record<string, ShoppingItem[]> = {};
    pendingItems.forEach(i => { (g[i.category] = g[i.category] ?? []).push(i); });
    return Object.entries(g);
  }, [pendingItems]);

  const pct = activeList ? (activeList.itemCount > 0 ? Math.round((activeList.boughtCount / activeList.itemCount) * 100) : 0) : 0;
  const estimated = activeList ? activeList.items.reduce((s, i) => s + (i.estimatedPrice ? parseFloat(i.estimatedPrice) : 0), 0) : 0;

  return (
    <div className="font-[Sora,sans-serif] bg-white">

      {/* ── LISTS VIEW ──────────────────────────────────────────────────── */}
      {view === "lists" && (
        <div className="space-y-5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-stone-800">
              My Lists ({allLists.filter(l => !l.isArchived && !l.isTemplate).length})
            </p>
            <button onClick={() => setView("new")}
              className="flex items-center gap-1.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-sm transition-colors">
              <Plus className="w-4 h-4" />New List
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>
          ) : (
            <>
              {/* ── Regular lists ─────────────────────────────────────────── */}
              {allLists.filter(l => !l.isArchived && !l.isTemplate).length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">🛒</div>
                  <p className="text-base font-black text-stone-700 mb-1">No active lists yet</p>
                  <p className="text-sm text-stone-400 mb-5">Create a new list or use one of your templates below</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_TEMPLATES.map(t => (
                      <button key={t.name} onClick={() => handleUseTemplate(t)} disabled={creatingList}
                        className="flex items-center gap-2 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-3 py-2 rounded-sm transition-colors">
                        {creatingList ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>{t.emoji}</span>}
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {allLists.filter(l => !l.isArchived && !l.isTemplate).map(list => {
                    const p = list.itemCount > 0 ? Math.round((list.boughtCount / list.itemCount) * 100) : 0;
                    return (
                      <div key={list.id}
                        className="group flex items-center gap-3 bg-white border border-stone-100 rounded-sm p-4 hover:border-stone-200 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => { setActiveId(list.id); setView("list"); }}>
                        <span className="text-2xl flex-shrink-0">{list.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-stone-900">{list.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${p}%` }} />
                            </div>
                            <span className="text-[10px] text-stone-400 flex-shrink-0">{list.boughtCount}/{list.itemCount} items</span>
                          </div>
                          <p className="text-[10px] text-stone-400 mt-0.5">{fmtDate(list.lastActivityAt)}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                          className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 flex-shrink-0 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── User-saved templates ───────────────────────────────────── */}
              {allLists.filter(l => !l.isArchived && l.isTemplate).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 mt-2">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
                      My Templates ({allLists.filter(l => !l.isArchived && l.isTemplate).length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {allLists.filter(l => !l.isArchived && l.isTemplate).map(tmpl => (
                      <div key={tmpl.id}
                        className="group flex items-center gap-3 bg-stone-50 border border-dashed border-stone-200 rounded-sm px-4 py-3 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                        <span className="text-xl flex-shrink-0">{tmpl.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-stone-700">{tmpl.name}</p>
                            <span className="text-[10px] font-bold text-stone-400 bg-stone-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Template</span>
                          </div>
                          <p className="text-[10px] text-stone-400 mt-0.5">{tmpl.itemCount} item{tmpl.itemCount !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Open/edit the template itself */}
                          <button
                            onClick={() => { setActiveId(tmpl.id); setView("list"); }}
                            className="text-[11px] font-semibold text-stone-500 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors"
                          >
                            Edit
                          </button>
                          {/* Create a new list from this template */}
                          <button
                            onClick={() => handleUseSavedTemplate(tmpl)}
                            disabled={creatingList}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1.5 rounded-sm transition-colors disabled:opacity-60"
                          >
                            {creatingList ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Use
                          </button>
                          <button
                            onClick={() => deleteList(tmpl.id)}
                            className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── NEW LIST VIEW ─────────────────────────────────────────────── */}
      {view === "new" && (
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            {allLists.length > 0 && (
              <button onClick={() => setView("lists")} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            )}
            <p className="text-sm font-black text-stone-800">Create a new list</p>
          </div>

          <NewListForm onCreate={handleCreateList} onCancel={() => setView(allLists.length > 0 ? "lists" : "new")} />

          {/* Quick templates */}
          <div>
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Or start from a template</p>
            <div className="space-y-2">
              {QUICK_TEMPLATES.map((t) => (
                <button key={t.name} onClick={() => handleUseTemplate(t)} disabled={creatingList}
                  className="w-full flex items-center gap-3 bg-stone-50 border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-sm p-3.5 transition-all text-left">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-stone-800">{t.name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{t.items.length} items pre-loaded</p>
                  </div>
                  {creatingList ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500 ml-auto" /> : <ChevronDown className="w-4 h-4 text-stone-300 ml-auto rotate-[-90deg]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE LIST VIEW ──────────────────────────────────────────── */}
      {view === "list" && activeList && (
        <div>
          {/* List header */}
          <div className="bg-stone-50 border-b border-stone-100 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <button onClick={() => setView("lists")} className="text-stone-400 hover:text-stone-700 mr-1">
                  <ChevronDown className="w-5 h-5 rotate-90" />
                </button>
                <span className="text-2xl">{activeList.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-stone-900">{activeList.name}</p>
                    {activeList.isTemplate && (
                      <span className="text-[10px] font-black text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                        Template
                      </span>
                    )}
                  </div>
                  {activeList.storeName && <p className="text-xs text-stone-400">{activeList.storeName}</p>}
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAI(p => !p)} title="AI Assistant"
                  className={`w-8 h-8 flex items-center justify-center rounded-sm border transition-colors ${showAI ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "border-stone-200 text-stone-400 hover:border-emerald-400"}`}>
                  <Sparkles className="w-4 h-4" />
                </button>
                <button onClick={() => setShowShare(p => !p)} title="Share"
                  className={`w-8 h-8 flex items-center justify-center rounded-sm border transition-colors ${showShare ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "border-stone-200 text-stone-400 hover:border-emerald-400"}`}>
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-bold text-stone-500 flex-shrink-0">{activeList.boughtCount}/{activeList.itemCount}</span>
              <span className="text-xs font-black flex-shrink-0" style={{ color: pct === 100 ? "#059669" : pct >= 50 ? "#d97706" : "#6b7280" }}>
                {pct}%
              </span>
            </div>

            {/* Budget */}
            {activeList.budgetEnabled && activeList.budgetAmount && (
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-stone-400">Est. spend: <span className={`font-bold ${estimated > parseFloat(activeList.budgetAmount) ? "text-red-500" : "text-emerald-600"}`}>
                  £{estimated.toFixed(2)}
                </span> / £{parseFloat(activeList.budgetAmount).toFixed(2)}</span>
                <button onClick={() => setShowBudget(p => !p)} className="text-stone-400 underline">Receipt mode</button>
              </div>
            )}

            {/* Share panel */}
            <AnimatePresence>
              {showShare && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 bg-white border border-emerald-200 rounded-sm p-4">
                    <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2">🔗 Share this list</p>
                    <p className="text-xs text-stone-500 mb-3 leading-relaxed">Anyone with this link can view, add items, and tick things off in real-time.</p>
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-sm px-3 py-2 mb-2">
                      <span className="text-xs text-stone-500 flex-1 truncate">{shareUrl}</span>
                      <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-600 flex-shrink-0">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 py-2 px-4 rounded-sm transition-colors w-full justify-center">
                      <ExternalLink className="w-3.5 h-3.5" />Open Shared List View
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Receipt mode */}
            <AnimatePresence>
              {showBudget && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 bg-white border border-stone-200 rounded-sm p-4">
                    <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">Receipt Mode</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center"><p className="text-lg font-black text-stone-600">£{estimated.toFixed(2)}</p><p className="text-xs text-stone-400">Estimated</p></div>
                      <div className="text-center">
                        <input type="number" value={actualSpend} onChange={e => setActualSpend(e.target.value)}
                          placeholder="0.00" className="w-full text-center text-lg font-black text-emerald-600 border-b border-stone-200 bg-transparent outline-none focus:border-emerald-400"
                        />
                        <p className="text-xs text-stone-400">Actual</p>
                      </div>
                    </div>
                    {actualSpend && estimated > 0 && (
                      <p className={`text-xs font-bold text-center ${parseFloat(actualSpend) <= estimated ? "text-emerald-600" : "text-red-500"}`}>
                        {parseFloat(actualSpend) <= estimated ? `✓ Under budget by £${(estimated - parseFloat(actualSpend)).toFixed(2)}` : `Over estimate by £${(parseFloat(actualSpend) - estimated).toFixed(2)}`}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI assistant */}
          <AnimatePresence>
            {showAI && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-stone-100">
                <div className="p-5">
                  <AIAssistant list={activeList} onItemsAdded={handleAIItemsAdded} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add item */}
          <div className="px-5 py-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="Add an item…"
                className="flex-1 text-sm font-semibold placeholder:text-stone-300 bg-transparent outline-none"
              />
              <button onClick={() => setAddExpanded(p => !p)} className="text-stone-300 hover:text-stone-600">
                <ChevronDown className={`w-4 h-4 transition-transform ${addExpanded ? "rotate-180" : ""}`} />
              </button>
              <button onClick={addItem} disabled={!newItemName.trim() || addingItem}
                className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
                {addingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>

            <AnimatePresence>
              {addExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <input value={newItemQty} onChange={e => setNewItemQty(e.target.value)} placeholder="Qty" className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-emerald-400" />
                    <input value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} placeholder="Unit (kg, l, pack…)" className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-emerald-400" />
                    <select value={newItemCat} onChange={e => setNewItemCat(e.target.value as ItemCategory)}
                      className="col-span-2 text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white focus:outline-none focus:border-emerald-400">
                      {Object.entries(CATEGORY_CFG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                    </select>
                    <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="Est. price (£)" className="col-span-2 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-emerald-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search */}
          {activeList.items.length > 5 && (
            <div className="px-5 py-2 border-b border-stone-50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-100 rounded-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          {/* Items */}
          <div className="px-5 py-4 space-y-5">
            {activeList.items.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-sm font-bold text-stone-600 mb-1">List is empty</p>
                <p className="text-xs text-stone-400">Type an item above and press Enter, or use the AI assistant to generate a list from a meal plan</p>
              </div>
            )}

            {/* Pending by category */}
            {grouped.map(([cat, items]) => {
              const cfg = CATEGORY_CFG[cat as ItemCategory] ?? CATEGORY_CFG.OTHER;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>{cfg.emoji}</span>
                    <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}>{items.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    <AnimatePresence>
                      {items.map(item => (
                        <motion.div key={item.id} layout initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 4 }}
                          className="group flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-3 py-2.5 hover:border-stone-200 transition-all">
                          <button onClick={() => tickItem(item)}
                            className="w-6 h-6 rounded-full border-2 border-stone-300 hover:border-emerald-400 flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-800">{item.name}</p>
                            {(item.quantity || item.brand) && (
                              <p className="text-[11px] text-stone-400">{item.quantity}{item.unit ? ` ${item.unit}` : ""}{item.brand ? ` · ${item.brand}` : ""}</p>
                            )}
                          </div>
                          {item.estimatedPrice && <span className="text-xs text-stone-400 flex-shrink-0">£{parseFloat(item.estimatedPrice).toFixed(2)}</span>}
                          <button onClick={() => deleteItem(item)}
                            className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 flex-shrink-0 transition-all">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}

            {/* Bought items */}
            {boughtItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Done ({boughtItems.length})</p>
                </div>
                <div className="space-y-1.5 opacity-60">
                  {boughtItems.map(item => (
                    <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-sm px-3 py-2.5">
                      <button onClick={() => tickItem(item)}
                        className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all">
                        <Check className="w-3 h-3 text-white" />
                      </button>
                      <span className="text-sm text-stone-400 line-through flex-1">{item.name}</span>
                      {item.boughtBy && <span className="text-[10px] text-emerald-500 font-semibold flex-shrink-0">✓ {item.boughtBy}</span>}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// // =============================================================================
// // isaacpaha.com — Smart Shared Shopping List Tool
// // app/tools/smart-shopping-list/_components/shopping-list-tool.tsx
// //
// // Full-featured shopping list manager:
// //   - Create multiple lists (weekly, monthly, event, template)
// //   - Add items with category, quantity, price
// //   - Tick off items
// //   - Share via unique link (generates public shared page)
// //   - AI: meal planner → list, smart suggestions, store mode ordering
// //   - Budget tracker with estimated vs actual
// //   - Duplicate lists, use templates
// //   - View by category or flat list
// // =============================================================================

// import React, {
//   useState, useCallback, useEffect, useMemo, useRef,
// } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Plus, Trash2, Check, Share2, Copy, Loader2, Edit2, X,
//   Sparkles, ChevronDown, ChevronUp, ShoppingCart, BarChart2,
//   RefreshCw, Download, Archive, Star, Zap, List,
//   Grid3x3, Search, Target, BookOpen, AlertCircle, Info,
//   Send, MessageSquare, ExternalLink, DollarSign, Lock,
//   FileText, Wand2, Package,
// } from "lucide-react";
// import { useUser } from "@clerk/nextjs";

// // ─── Types ────────────────────────────────────────────────────────────────────

// type ItemStatus   = "PENDING" | "BOUGHT" | "SKIPPED";
// type ItemCategory =
//   | "PRODUCE" | "DAIRY" | "MEAT_FISH" | "BAKERY" | "FROZEN"
//   | "PANTRY" | "DRINKS" | "SNACKS" | "HOUSEHOLD" | "PERSONAL_CARE"
//   | "BABY" | "PET" | "PHARMACY" | "ELECTRONICS" | "OTHER";

// interface ShoppingItem {
//   id:              string;
//   name:            string;
//   quantity?:       string | null;
//   unit?:           string | null;
//   category:        ItemCategory;
//   brand?:          string | null;
//   notes?:          string | null;
//   estimatedPrice?: string | null;
//   actualPrice?:    string | null;
//   status:          ItemStatus;
//   sortOrder:       number;
//   boughtBy?:       string | null;
// }

// interface ShoppingList {
//   id:           string;
//   name:         string;
//   emoji:        string;
//   description?: string | null;
//   shareId:      string;
//   visibility:   string;
//   storeName?:   string | null;
//   budgetEnabled: boolean;
//   budgetAmount?: string | null;
//   currency:     string;
//   actualSpend?: string | null;
//   itemCount:    number;
//   boughtCount:  number;
//   isArchived:   boolean;
//   isTemplate:   boolean;
//   lastActivityAt: string;
//   createdAt:    string;
//   items:        ShoppingItem[];
// }

// // ─── Config ───────────────────────────────────────────────────────────────────

// const CATEGORY_CFG: Record<ItemCategory, { label: string; emoji: string; color: string; bg: string }> = {
//   PRODUCE:       { label: "Fruit & Veg",   emoji: "🥦", color: "#16a34a", bg: "#dcfce7" },
//   DAIRY:         { label: "Dairy",         emoji: "🥛", color: "#0284c7", bg: "#e0f2fe" },
//   MEAT_FISH:     { label: "Meat & Fish",   emoji: "🥩", color: "#dc2626", bg: "#fee2e2" },
//   BAKERY:        { label: "Bakery",        emoji: "🍞", color: "#d97706", bg: "#fef3c7" },
//   FROZEN:        { label: "Frozen",        emoji: "🧊", color: "#7c3aed", bg: "#ede9fe" },
//   PANTRY:        { label: "Pantry",        emoji: "🥫", color: "#92400e", bg: "#fef3c7" },
//   DRINKS:        { label: "Drinks",        emoji: "🥤", color: "#0891b2", bg: "#cffafe" },
//   SNACKS:        { label: "Snacks",        emoji: "🍪", color: "#ea580c", bg: "#ffedd5" },
//   HOUSEHOLD:     { label: "Household",     emoji: "🧽", color: "#0d9488", bg: "#ccfbf1" },
//   PERSONAL_CARE: { label: "Personal Care", emoji: "🧴", color: "#be185d", bg: "#fce7f3" },
//   BABY:          { label: "Baby",          emoji: "👶", color: "#7c3aed", bg: "#ede9fe" },
//   PET:           { label: "Pet",           emoji: "🐾", color: "#92400e", bg: "#fef3c7" },
//   PHARMACY:      { label: "Pharmacy",      emoji: "💊", color: "#b91c1c", bg: "#fee2e2" },
//   ELECTRONICS:   { label: "Electronics",   emoji: "🔋", color: "#1d4ed8", bg: "#dbeafe" },
//   OTHER:         { label: "Other",         emoji: "📦", color: "#6b7280", bg: "#f3f4f6" },
// };

// const LIST_EMOJIS = ["🛒", "🥗", "🎉", "🏠", "🧹", "🍕", "🥩", "🌮", "🍜", "🎂", "🍱", "🥘", "🛍️", "📦", "🍺"];

// const QUICK_TEMPLATES = [
//   { name: "Weekly Essentials", emoji: "🛒", items: [
//     { name: "Bread", category: "BAKERY", unit: "loaf", quantity: "1" },
//     { name: "Milk", category: "DAIRY", unit: "l", quantity: "2" },
//     { name: "Eggs", category: "DAIRY", unit: "pack", quantity: "1" },
//     { name: "Butter", category: "DAIRY", unit: "pack", quantity: "1" },
//     { name: "Bananas", category: "PRODUCE", unit: "pack", quantity: "1" },
//     { name: "Chicken breast", category: "MEAT_FISH", unit: "kg", quantity: "1" },
//     { name: "Rice", category: "PANTRY", unit: "kg", quantity: "1" },
//     { name: "Pasta", category: "PANTRY", unit: "pack", quantity: "1" },
//     { name: "Tomatoes", category: "PRODUCE", unit: "", quantity: "6" },
//     { name: "Onions", category: "PRODUCE", unit: "kg", quantity: "1" },
//   ]},
//   { name: "Student Budget Shop", emoji: "🎓", items: [
//     { name: "Baked beans", category: "PANTRY", unit: "can", quantity: "4" },
//     { name: "Instant noodles", category: "PANTRY", unit: "pack", quantity: "6" },
//     { name: "Bread", category: "BAKERY", unit: "loaf", quantity: "1" },
//     { name: "Peanut butter", category: "PANTRY", unit: "jar", quantity: "1" },
//     { name: "Milk", category: "DAIRY", unit: "l", quantity: "2" },
//     { name: "Eggs", category: "DAIRY", unit: "pack", quantity: "1" },
//     { name: "Frozen veg", category: "FROZEN", unit: "bag", quantity: "1" },
//     { name: "Porridge oats", category: "PANTRY", unit: "kg", quantity: "1" },
//     { name: "Tinned tuna", category: "PANTRY", unit: "can", quantity: "3" },
//     { name: "Rice", category: "PANTRY", unit: "kg", quantity: "1" },
//   ]},
//   { name: "BBQ & Party", emoji: "🎉", items: [
//     { name: "Burgers", category: "MEAT_FISH", unit: "pack", quantity: "2" },
//     { name: "Sausages", category: "MEAT_FISH", unit: "pack", quantity: "2" },
//     { name: "Burger buns", category: "BAKERY", unit: "pack", quantity: "2" },
//     { name: "Coleslaw", category: "PRODUCE", unit: "tub", quantity: "1" },
//     { name: "Salad leaves", category: "PRODUCE", unit: "bag", quantity: "2" },
//     { name: "Crisps", category: "SNACKS", unit: "bag", quantity: "4" },
//     { name: "Ketchup", category: "PANTRY", unit: "bottle", quantity: "1" },
//     { name: "Mustard", category: "PANTRY", unit: "jar", quantity: "1" },
//     { name: "Beer / lager", category: "DRINKS", unit: "pack", quantity: "2" },
//     { name: "Soft drinks", category: "DRINKS", unit: "bottle", quantity: "4" },
//   ]},
// ];

// const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
// const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// // ─── New List Form ────────────────────────────────────────────────────────────

// function NewListForm({ onCreate, onCancel }: {
//   onCreate: (data: { name: string; emoji: string; storeName?: string; budgetAmount?: string; isTemplate: boolean }) => void;
//   onCancel: () => void;
// }) {
//   const [name,     setName]     = useState("");
//   const [emoji,    setEmoji]    = useState("🛒");
//   const [store,    setStore]    = useState("");
//   const [budget,   setBudget]   = useState("");
//   const [isTmpl,   setIsTmpl]   = useState(false);
//   const [showMore, setShowMore] = useState(false);

//   return (
//     <div className="bg-white border border-stone-200 rounded-sm p-5 space-y-4">
//       <p className="text-sm font-black text-stone-800">New Shopping List</p>

//       {/* Emoji picker */}
//       <div className="flex flex-wrap gap-1.5">
//         {LIST_EMOJIS.map((e) => (
//           <button key={e} onClick={() => setEmoji(e)}
//             className={`text-xl w-9 h-9 rounded-sm border-2 transition-all hover:scale-110 ${emoji === e ? "border-emerald-400 bg-emerald-50" : "border-stone-100"}`}>
//             {e}
//           </button>
//         ))}
//       </div>

//       {/* Name */}
//       <input value={name} onChange={(e) => setName(e.target.value)}
//         placeholder="List name (e.g. Weekly Shop, Party Prep…)"
//         className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400"
//         autoFocus
//         onKeyDown={(e) => e.key === "Enter" && name.trim() && onCreate({ name, emoji, storeName: store || undefined, budgetAmount: budget || undefined, isTemplate: isTmpl })}
//       />

//       <button onClick={() => setShowMore(p => !p)} className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1">
//         {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
//         {showMore ? "Less options" : "More options (store, budget, template)"}
//       </button>

//       <AnimatePresence>
//         {showMore && (
//           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
//             <input value={store} onChange={(e) => setStore(e.target.value)}
//               placeholder="Store name (e.g. Tesco, ASDA, Aldi…)"
//               className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400"
//             />
//             <div className="flex items-center gap-2">
//               <span className="text-xs text-stone-500">£</span>
//               <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
//                 placeholder="Budget (optional)"
//                 className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400"
//               />
//             </div>
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input type="checkbox" checked={isTmpl} onChange={(e) => setIsTmpl(e.target.checked)} className="w-3.5 h-3.5 accent-emerald-500" />
//               <span className="text-xs text-stone-600">Save as reusable template</span>
//             </label>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="flex gap-2">
//         <button onClick={onCancel} className="text-xs font-semibold text-stone-400 border border-stone-200 px-4 py-2 rounded-sm hover:border-stone-400 transition-colors">Cancel</button>
//         <button onClick={() => name.trim() && onCreate({ name, emoji, storeName: store || undefined, budgetAmount: budget || undefined, isTemplate: isTmpl })}
//           disabled={!name.trim()}
//           className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 py-2 rounded-sm transition-colors disabled:opacity-60">
//           <ShoppingCart className="w-4 h-4" />Create List
//         </button>
//       </div>
//     </div>
//   );
// }

// // ─── AI Assistant Panel ───────────────────────────────────────────────────────

// function AIAssistant({ list, onItemsAdded }: { list: ShoppingList; onItemsAdded: (items: any[]) => void }) {
//   const [mode,    setMode]    = useState<"meal" | "suggest" | "budget">("meal");
//   const [input,   setInput]   = useState("");
//   const [people,  setPeople]  = useState("2");
//   const [loading, setLoading] = useState(false);
//   const [result,  setResult]  = useState<any>(null);

//   const run = async () => {
//     setLoading(true); setResult(null);
//     try {
//       const res  = await fetch("/api/tools/shopping/ai", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           mode: mode === "meal" ? "meal_suggestions" : mode === "suggest" ? "smart_add" : "budget_tips",
//           meals:     mode === "meal" ? (input || undefined) : undefined,
//           items:     list.items,
//           storeName: list.storeName ?? undefined,
//           budget:    list.budgetAmount ?? undefined,
//           people:    parseInt(people) || 2,
//         }),
//       });
//       const data = await res.json();
//       setResult(data);
//     } catch {}
//     setLoading(false);
//   };

//   return (
//     <div className="bg-white border border-stone-100 rounded-sm p-5 space-y-4">
//       <p className="text-xs font-black text-stone-400 uppercase tracking-wider">🤖 AI Shopping Assistant</p>

//       {/* Mode tabs */}
//       <div className="flex gap-1">
//         {([
//           { id: "meal",    label: "Meal Planner"     },
//           { id: "suggest", label: "Smart Suggestions" },
//           { id: "budget",  label: "Budget Tips"       },
//         ] as const).map((m) => (
//           <button key={m.id} onClick={() => setMode(m.id)}
//             className={`flex-1 text-xs font-bold py-2 rounded-sm border transition-colors ${
//               mode === m.id ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-stone-200 text-stone-500"
//             }`}>{m.label}</button>
//         ))}
//       </div>

//       {mode === "meal" && (
//         <div className="space-y-2">
//           <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
//             placeholder='Describe your meal plan, e.g. "5-day healthy plan, high protein, no red meat"'
//             className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-400 resize-none"
//           />
//           <div className="flex items-center gap-2">
//             <label className="text-xs text-stone-500">People:</label>
//             <input type="number" value={people} onChange={(e) => setPeople(e.target.value)} min={1} max={20}
//               className="w-16 text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-emerald-400"
//             />
//           </div>
//         </div>
//       )}

//       {mode === "suggest" && (
//         <p className="text-xs text-stone-500">AI will analyse your current list and suggest commonly forgotten items.</p>
//       )}

//       {mode === "budget" && list.budgetAmount && (
//         <p className="text-xs text-stone-500">AI will suggest ways to reduce your spend on this list.</p>
//       )}
//       {mode === "budget" && !list.budgetAmount && (
//         <p className="text-xs text-amber-600">Set a budget on this list first to get personalised tips.</p>
//       )}

//       <button onClick={run} disabled={loading}
//         className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 py-2.5 rounded-sm transition-colors disabled:opacity-60">
//         {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
//         {loading ? "Thinking…" : mode === "meal" ? "Generate Shopping List" : mode === "suggest" ? "Get Suggestions" : "Get Budget Tips"}
//       </button>

//       {/* Results */}
//       {result && !loading && (
//         <div className="space-y-3">
//           {/* Meal plan items */}
//           {result.items?.length > 0 && (
//             <div>
//               {result.title && <p className="text-xs font-bold text-stone-600 mb-2">📋 {result.title}</p>}
//               {result.estimatedTotal && <p className="text-xs text-emerald-600 mb-2 font-semibold">Est. total: £{result.estimatedTotal.toFixed(2)}</p>}
//               <div className="space-y-1 max-h-48 overflow-y-auto">
//                 {result.items.map((item: any, i: number) => {
//                   const cfg = CATEGORY_CFG[item.category as ItemCategory] ?? CATEGORY_CFG.OTHER;
//                   return (
//                     <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-stone-50 rounded-sm">
//                       <div className="flex items-center gap-2">
//                         <span>{cfg.emoji}</span>
//                         <span className="text-xs text-stone-700">{item.name}</span>
//                         {item.quantity && <span className="text-[10px] text-stone-400">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>}
//                       </div>
//                       {item.estimatedPrice && <span className="text-[10px] text-stone-400">£{item.estimatedPrice.toFixed(2)}</span>}
//                     </div>
//                   );
//                 })}
//               </div>
//               <button onClick={() => onItemsAdded(result.items)}
//                 className="w-full mt-2 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 py-2 rounded-sm transition-colors">
//                 Add all {result.items.length} items to list
//               </button>
//             </div>
//           )}

//           {/* Smart suggestions */}
//           {result.suggestions?.length > 0 && (
//             <div className="space-y-2">
//               {result.suggestions.map((s: any, i: number) => {
//                 const cfg = CATEGORY_CFG[s.category as ItemCategory] ?? CATEGORY_CFG.OTHER;
//                 return (
//                   <div key={i} className="flex items-center justify-between bg-stone-50 rounded-sm px-3 py-2">
//                     <div>
//                       <span className="text-xs font-semibold text-stone-700">{cfg.emoji} {s.name}</span>
//                       <p className="text-[10px] text-stone-400 mt-0.5">{s.reason}</p>
//                     </div>
//                     <button onClick={() => onItemsAdded([s])}
//                       className="text-xs text-emerald-600 font-bold border border-emerald-200 hover:bg-emerald-50 px-2 py-1 rounded-sm ml-2 flex-shrink-0">
//                       + Add
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {/* Budget tips */}
//           {result.tips?.length > 0 && (
//             <div className="space-y-2">
//               {result.estimatedSavingsTotal && (
//                 <p className="text-xs font-bold text-emerald-700">💰 Potential savings: {result.estimatedSavingsTotal}</p>
//               )}
//               {result.tips.map((t: any, i: number) => (
//                 <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-2.5">
//                   <p className="text-xs font-semibold text-emerald-900">{t.tip}</p>
//                   <div className="flex items-center gap-2 mt-1">
//                     <span className="text-[10px] text-emerald-600 font-bold">{t.estimatedSaving}</span>
//                     <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{t.category}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── MAIN TOOL EXPORT ─────────────────────────────────────────────────────────

// export function ShoppingListTool({ isSignedIn }: { isSignedIn: boolean }) {
//   const { user }  = useUser();
//   const [lists,   setLists]   = useState<ShoppingList[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [activeId,setActiveId]= useState<string | null>(null);
//   const [view,    setView]    = useState<"lists" | "list" | "new">("new");
//   const [newItemName, setNewItemName] = useState("");
//   const [newItemCat,  setNewItemCat]  = useState<ItemCategory>("OTHER");
//   const [newItemQty,  setNewItemQty]  = useState("");
//   const [newItemUnit, setNewItemUnit] = useState("");
//   const [newItemPrice, setNewItemPrice] = useState("");
//   const [addExpanded, setAddExpanded] = useState(false);
//   const [addingItem,  setAddingItem]  = useState(false);
//   const [search,      setSearch]      = useState("");
//   const [copied,      setCopied]      = useState(false);
//   const [showAI,      setShowAI]      = useState(false);
//   const [showShare,   setShowShare]   = useState(false);
//   const [showBudget,  setShowBudget]  = useState(false);
//   const [actualSpend, setActualSpend] = useState("");
//   const [creatingList,setCreatingList]= useState(false);

//   // Local-only lists for anonymous users
//   const [localLists,  setLocalLists]  = useState<ShoppingList[]>([]);

//   const loadLists = useCallback(async () => {
//     setLoading(true);
//     if (isSignedIn) {
//       try {
//         const res  = await fetch("/api/tools/shopping/lists");
//         const data = await res.json();
//         setLists(data.lists ?? []);
//       } catch {}
//     } else {
//       try {
//         const saved = JSON.parse(localStorage.getItem("shopping_lists_local") ?? "[]");
//         setLocalLists(saved);
//       } catch {}
//     }
//     setLoading(false);
//   }, [isSignedIn]);

//   useEffect(() => { loadLists(); }, [loadLists]);

//   const allLists   = isSignedIn ? lists : localLists;
//   const saveLists  = (updated: ShoppingList[]) => {
//     if (isSignedIn) setLists(updated);
//     else {
//       setLocalLists(updated);
//       try { localStorage.setItem("shopping_lists_local", JSON.stringify(updated)); } catch {}
//     }
//   };

//   const activeList = useMemo(() => allLists.find(l => l.id === activeId) ?? null, [allLists, activeId]);

//   // ── Create list ───────────────────────────────────────────────────────────

//   const handleCreateList = async (data: { name: string; emoji: string; storeName?: string; budgetAmount?: string; isTemplate: boolean }) => {
//     setCreatingList(true);
//     if (isSignedIn) {
//       try {
//         const res   = await fetch("/api/tools/shopping/lists", {
//           method:  "POST",
//           headers: { "Content-Type": "application/json" },
//           body:    JSON.stringify(data),
//         });
//         const resp  = await res.json();
//         if (res.ok) {
//           setLists(p => [resp.list, ...p]);
//           setActiveId(resp.list.id);
//           setView("list");
//         }
//       } catch {}
//     } else {
//       const newList: ShoppingList = {
//         id: uid(), name: data.name, emoji: data.emoji,
//         shareId: uid(), visibility: "SHARED",
//         storeName: data.storeName ?? null,
//         budgetEnabled: !!data.budgetAmount,
//         budgetAmount: data.budgetAmount ?? null,
//         currency: "GBP", actualSpend: null,
//         itemCount: 0, boughtCount: 0,
//         isArchived: false, isTemplate: data.isTemplate,
//         lastActivityAt: new Date().toISOString(),
//         createdAt: new Date().toISOString(),
//         items: [],
//       };
//       const updated = [newList, ...localLists];
//       saveLists(updated);
//       setActiveId(newList.id);
//       setView("list");
//     }
//     setCreatingList(false);
//   };

//   // ── Use template ──────────────────────────────────────────────────────────

//   const handleUseTemplate = async (template: typeof QUICK_TEMPLATES[0]) => {
//     setCreatingList(true);
//     const listData = { name: template.name, emoji: template.emoji, isTemplate: false };
//     if (isSignedIn) {
//       const res  = await fetch("/api/tools/shopping/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(listData) });
//       const data = await res.json();
//       if (res.ok) {
//         await fetch(`/api/tools/shopping/lists/${data.list.id}/items`, {
//           method: "POST", headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(template.items),
//         });
//         await loadLists();
//         setActiveId(data.list.id);
//         setView("list");
//       }
//     } else {
//       const newList: ShoppingList = {
//         id: uid(), name: template.name, emoji: template.emoji,
//         shareId: uid(), visibility: "SHARED",
//         storeName: null, budgetEnabled: false, budgetAmount: null,
//         currency: "GBP", actualSpend: null, itemCount: template.items.length,
//         boughtCount: 0, isArchived: false, isTemplate: false,
//         lastActivityAt: new Date().toISOString(), createdAt: new Date().toISOString(),
//         items: template.items.map((item, i) => ({
//           id: uid(), ...item, status: "PENDING", sortOrder: i,
//           quantity: item.quantity || null, unit: item.unit || null,
//           brand: null, notes: null, estimatedPrice: null, actualPrice: null, boughtBy: null,
//           category: item.category as ItemCategory,
//         })),
//       };
//       const updated = [newList, ...localLists];
//       saveLists(updated);
//       setActiveId(newList.id);
//       setView("list");
//     }
//     setCreatingList(false);
//   };

//   // ── Add item ──────────────────────────────────────────────────────────────

//   const addItem = async () => {
//     if (!newItemName.trim() || !activeList) return;
//     setAddingItem(true);
//     const itemData = {
//       name: newItemName.trim(), quantity: newItemQty || undefined,
//       unit: newItemUnit || undefined, category: newItemCat,
//       estimatedPrice: newItemPrice || undefined,
//     };
//     if (isSignedIn) {
//       try {
//         const res  = await fetch(`/api/tools/shopping/lists/${activeList.id}/items`, {
//           method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(itemData),
//         });
//         const data = await res.json();
//         if (res.ok) {
//           updateList(activeList.id, l => ({
//             ...l, itemCount: l.itemCount + 1,
//             items: [...l.items, ...(data.items ?? [])],
//           }));
//         }
//       } catch {}
//     } else {
//       const newItem: ShoppingItem = {
//         id: uid(), ...itemData, status: "PENDING",
//         sortOrder: activeList.items.length,
//         quantity: itemData.quantity ?? null, unit: itemData.unit ?? null,
//         brand: null, notes: null, estimatedPrice: itemData.estimatedPrice ?? null,
//         actualPrice: null, boughtBy: null,
//       };
//       updateList(activeList.id, l => ({ ...l, itemCount: l.itemCount + 1, items: [...l.items, newItem] }));
//     }
//     setNewItemName(""); setNewItemQty(""); setNewItemUnit(""); setNewItemPrice(""); setNewItemCat("OTHER");
//     setAddingItem(false);
//   };

//   // ── Tick item ─────────────────────────────────────────────────────────────

//   const tickItem = async (item: ShoppingItem) => {
//     const newStatus: ItemStatus = item.status === "BOUGHT" ? "PENDING" : "BOUGHT";
//     if (isSignedIn && activeList) {
//       await fetch(`/api/tools/shopping/lists/${activeList.id}/items/${item.id}`, {
//         method: "PATCH", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status: newStatus, boughtBy: user?.firstName ?? "Me" }),
//       });
//     }
//     updateList(activeList!.id, l => ({
//       ...l,
//       boughtCount: newStatus === "BOUGHT" ? l.boughtCount + 1 : Math.max(0, l.boughtCount - 1),
//       items: l.items.map(i => i.id === item.id ? {
//         ...i, status: newStatus,
//         boughtBy: newStatus === "BOUGHT" ? (user?.firstName ?? "Me") : null,
//       } : i),
//     }));
//   };

//   // ── Delete item ───────────────────────────────────────────────────────────

//   const deleteItem = async (item: ShoppingItem) => {
//     if (isSignedIn && activeList) {
//       await fetch(`/api/tools/shopping/lists/${activeList.id}/items/${item.id}`, { method: "DELETE" });
//     }
//     updateList(activeList!.id, l => ({
//       ...l, itemCount: Math.max(0, l.itemCount - 1),
//       boughtCount: item.status === "BOUGHT" ? Math.max(0, l.boughtCount - 1) : l.boughtCount,
//       items: l.items.filter(i => i.id !== item.id),
//     }));
//   };

//   // ── Delete list ───────────────────────────────────────────────────────────

//   const deleteList = async (id: string) => {
//     if (isSignedIn) await fetch(`/api/tools/shopping/lists/${id}`, { method: "DELETE" });
//     const updated = allLists.filter(l => l.id !== id);
//     saveLists(updated);
//     if (activeId === id) { setActiveId(null); setView("lists"); }
//   };

//   // ── Update list helper ────────────────────────────────────────────────────

//   const updateList = (id: string, fn: (l: ShoppingList) => ShoppingList) => {
//     const updated = allLists.map(l => l.id === id ? fn(l) : l);
//     saveLists(updated);
//   };

//   // ── Add AI items ──────────────────────────────────────────────────────────

//   const handleAIItemsAdded = async (items: any[]) => {
//     if (!activeList) return;
//     if (isSignedIn) {
//       const res  = await fetch(`/api/tools/shopping/lists/${activeList.id}/items`, {
//         method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(items),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         updateList(activeList.id, l => ({
//           ...l, itemCount: l.itemCount + items.length,
//           items: [...l.items, ...(data.items ?? [])],
//         }));
//       }
//     } else {
//       const newItems = items.map((item, i) => ({
//         id: uid(), name: item.name, quantity: item.quantity ?? null, unit: item.unit ?? null,
//         category: (item.category ?? "OTHER") as ItemCategory,
//         brand: null, notes: item.notes ?? null, estimatedPrice: item.estimatedPrice ? String(item.estimatedPrice) : null,
//         actualPrice: null, status: "PENDING" as ItemStatus, sortOrder: activeList.items.length + i, boughtBy: null,
//       }));
//       updateList(activeList.id, l => ({
//         ...l, itemCount: l.itemCount + newItems.length, items: [...l.items, ...newItems],
//       }));
//     }
//     setShowAI(false);
//   };

//   const shareUrl = activeList ? `${typeof window !== "undefined" ? window.location.origin : "https://isaacpaha.com"}/tools/smart-shopping-list/share/${activeList.shareId}` : "";

//   // ── Filtered items ────────────────────────────────────────────────────────

//   const filteredItems = useMemo(() => {
//     if (!activeList) return [];
//     const s = search.toLowerCase();
//     return activeList.items.filter(i => !s || i.name.toLowerCase().includes(s));
//   }, [activeList, search]);

//   const pendingItems = filteredItems.filter(i => i.status === "PENDING");
//   const boughtItems  = filteredItems.filter(i => i.status === "BOUGHT");

//   // Group pending by category
//   const grouped = useMemo(() => {
//     const g: Record<string, ShoppingItem[]> = {};
//     pendingItems.forEach(i => { (g[i.category] = g[i.category] ?? []).push(i); });
//     return Object.entries(g);
//   }, [pendingItems]);

//   const pct = activeList ? (activeList.itemCount > 0 ? Math.round((activeList.boughtCount / activeList.itemCount) * 100) : 0) : 0;
//   const estimated = activeList ? activeList.items.reduce((s, i) => s + (i.estimatedPrice ? parseFloat(i.estimatedPrice) : 0), 0) : 0;

//   return (
//     <div className="font-[Sora,sans-serif] bg-white">

//       {/* ── LISTS VIEW ──────────────────────────────────────────────────── */}
//       {view === "lists" && (
//         <div className="space-y-5 p-5">
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-black text-stone-800">My Lists ({allLists.filter(l => !l.isArchived && !l.isTemplate).length})</p>
//             <button onClick={() => setView("new")}
//               className="flex items-center gap-1.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-sm transition-colors">
//               <Plus className="w-4 h-4" />New List
//             </button>
//           </div>

//           {loading ? (
//             <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>
//           ) : allLists.filter(l => !l.isArchived && !l.isTemplate).length === 0 ? (
//             <div className="text-center py-12">
//               <div className="text-5xl mb-4">🛒</div>
//               <p className="text-base font-black text-stone-700 mb-1">No lists yet</p>
//               <p className="text-sm text-stone-400 mb-5">Create your first shopping list or use a template</p>
//               <div className="flex flex-wrap justify-center gap-2">
//                 {QUICK_TEMPLATES.map(t => (
//                   <button key={t.name} onClick={() => handleUseTemplate(t)} disabled={creatingList}
//                     className="flex items-center gap-2 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-3 py-2 rounded-sm transition-colors">
//                     {creatingList ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>{t.emoji}</span>}
//                     {t.name}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-2">
//               {allLists.filter(l => !l.isArchived && !l.isTemplate).map(list => {
//                 const p = list.itemCount > 0 ? Math.round((list.boughtCount / list.itemCount) * 100) : 0;
//                 return (
//                   <div key={list.id}
//                     className="group flex items-center gap-3 bg-white border border-stone-100 rounded-sm p-4 hover:border-stone-200 hover:shadow-sm transition-all cursor-pointer"
//                     onClick={() => { setActiveId(list.id); setView("list"); }}>
//                     <span className="text-2xl flex-shrink-0">{list.emoji}</span>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-bold text-stone-900">{list.name}</p>
//                       <div className="flex items-center gap-3 mt-0.5">
//                         <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
//                           <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${p}%` }} />
//                         </div>
//                         <span className="text-[10px] text-stone-400 flex-shrink-0">{list.boughtCount}/{list.itemCount} items</span>
//                       </div>
//                       <p className="text-[10px] text-stone-400 mt-0.5">{fmtDate(list.lastActivityAt)}</p>
//                     </div>
//                     <button onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
//                       className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 flex-shrink-0 transition-all">
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── NEW LIST VIEW ─────────────────────────────────────────────── */}
//       {view === "new" && (
//         <div className="p-5 space-y-5">
//           <div className="flex items-center gap-3 mb-2">
//             {allLists.length > 0 && (
//               <button onClick={() => setView("lists")} className="text-stone-400 hover:text-stone-700">
//                 <X className="w-5 h-5" />
//               </button>
//             )}
//             <p className="text-sm font-black text-stone-800">Create a new list</p>
//           </div>

//           <NewListForm onCreate={handleCreateList} onCancel={() => setView(allLists.length > 0 ? "lists" : "new")} />

//           {/* Quick templates */}
//           <div>
//             <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Or start from a template</p>
//             <div className="space-y-2">
//               {QUICK_TEMPLATES.map((t) => (
//                 <button key={t.name} onClick={() => handleUseTemplate(t)} disabled={creatingList}
//                   className="w-full flex items-center gap-3 bg-stone-50 border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-sm p-3.5 transition-all text-left">
//                   <span className="text-2xl">{t.emoji}</span>
//                   <div>
//                     <p className="text-sm font-bold text-stone-800">{t.name}</p>
//                     <p className="text-xs text-stone-400 mt-0.5">{t.items.length} items pre-loaded</p>
//                   </div>
//                   {creatingList ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500 ml-auto" /> : <ChevronDown className="w-4 h-4 text-stone-300 ml-auto rotate-[-90deg]" />}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── ACTIVE LIST VIEW ──────────────────────────────────────────── */}
//       {view === "list" && activeList && (
//         <div>
//           {/* List header */}
//           <div className="bg-stone-50 border-b border-stone-100 px-5 py-4">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-2.5">
//                 <button onClick={() => setView("lists")} className="text-stone-400 hover:text-stone-700 mr-1">
//                   <ChevronDown className="w-5 h-5 rotate-90" />
//                 </button>
//                 <span className="text-2xl">{activeList.emoji}</span>
//                 <div>
//                   <p className="text-sm font-black text-stone-900">{activeList.name}</p>
//                   {activeList.storeName && <p className="text-xs text-stone-400">{activeList.storeName}</p>}
//                 </div>
//               </div>
//               {/* Action buttons */}
//               <div className="flex items-center gap-2">
//                 <button onClick={() => setShowAI(p => !p)} title="AI Assistant"
//                   className={`w-8 h-8 flex items-center justify-center rounded-sm border transition-colors ${showAI ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "border-stone-200 text-stone-400 hover:border-emerald-400"}`}>
//                   <Sparkles className="w-4 h-4" />
//                 </button>
//                 <button onClick={() => setShowShare(p => !p)} title="Share"
//                   className={`w-8 h-8 flex items-center justify-center rounded-sm border transition-colors ${showShare ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "border-stone-200 text-stone-400 hover:border-emerald-400"}`}>
//                   <Share2 className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>

//             {/* Progress */}
//             <div className="flex items-center gap-3">
//               <div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden">
//                 <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
//               </div>
//               <span className="text-xs font-bold text-stone-500 flex-shrink-0">{activeList.boughtCount}/{activeList.itemCount}</span>
//               <span className="text-xs font-black flex-shrink-0" style={{ color: pct === 100 ? "#059669" : pct >= 50 ? "#d97706" : "#6b7280" }}>
//                 {pct}%
//               </span>
//             </div>

//             {/* Budget */}
//             {activeList.budgetEnabled && activeList.budgetAmount && (
//               <div className="flex items-center justify-between mt-2 text-xs">
//                 <span className="text-stone-400">Est. spend: <span className={`font-bold ${estimated > parseFloat(activeList.budgetAmount) ? "text-red-500" : "text-emerald-600"}`}>
//                   £{estimated.toFixed(2)}
//                 </span> / £{parseFloat(activeList.budgetAmount).toFixed(2)}</span>
//                 <button onClick={() => setShowBudget(p => !p)} className="text-stone-400 underline">Receipt mode</button>
//               </div>
//             )}

//             {/* Share panel */}
//             <AnimatePresence>
//               {showShare && (
//                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
//                   exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
//                   <div className="mt-3 bg-white border border-emerald-200 rounded-sm p-4">
//                     <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2">🔗 Share this list</p>
//                     <p className="text-xs text-stone-500 mb-3 leading-relaxed">Anyone with this link can view, add items, and tick things off in real-time.</p>
//                     <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-sm px-3 py-2 mb-2">
//                       <span className="text-xs text-stone-500 flex-1 truncate">{shareUrl}</span>
//                       <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
//                         className="flex items-center gap-1 text-xs font-bold text-emerald-600 flex-shrink-0">
//                         {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
//                         {copied ? "Copied!" : "Copy"}
//                       </button>
//                     </div>
//                     <a href={shareUrl} target="_blank" rel="noopener noreferrer"
//                       className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 py-2 px-4 rounded-sm transition-colors w-full justify-center">
//                       <ExternalLink className="w-3.5 h-3.5" />Open Shared List View
//                     </a>
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Receipt mode */}
//             <AnimatePresence>
//               {showBudget && (
//                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
//                   exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
//                   <div className="mt-3 bg-white border border-stone-200 rounded-sm p-4">
//                     <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">Receipt Mode</p>
//                     <div className="grid grid-cols-2 gap-3 mb-3">
//                       <div className="text-center"><p className="text-lg font-black text-stone-600">£{estimated.toFixed(2)}</p><p className="text-xs text-stone-400">Estimated</p></div>
//                       <div className="text-center">
//                         <input type="number" value={actualSpend} onChange={e => setActualSpend(e.target.value)}
//                           placeholder="0.00" className="w-full text-center text-lg font-black text-emerald-600 border-b border-stone-200 bg-transparent outline-none focus:border-emerald-400"
//                         />
//                         <p className="text-xs text-stone-400">Actual</p>
//                       </div>
//                     </div>
//                     {actualSpend && estimated > 0 && (
//                       <p className={`text-xs font-bold text-center ${parseFloat(actualSpend) <= estimated ? "text-emerald-600" : "text-red-500"}`}>
//                         {parseFloat(actualSpend) <= estimated ? `✓ Under budget by £${(estimated - parseFloat(actualSpend)).toFixed(2)}` : `Over estimate by £${(parseFloat(actualSpend) - estimated).toFixed(2)}`}
//                       </p>
//                     )}
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>

//           {/* AI assistant */}
//           <AnimatePresence>
//             {showAI && (
//               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
//                 exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-stone-100">
//                 <div className="p-5">
//                   <AIAssistant list={activeList} onItemsAdded={handleAIItemsAdded} />
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Add item */}
//           <div className="px-5 py-4 border-b border-stone-100">
//             <div className="flex items-center gap-2">
//               <input
//                 value={newItemName}
//                 onChange={(e) => setNewItemName(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && addItem()}
//                 placeholder="Add an item…"
//                 className="flex-1 text-sm font-semibold placeholder:text-stone-300 bg-transparent outline-none"
//               />
//               <button onClick={() => setAddExpanded(p => !p)} className="text-stone-300 hover:text-stone-600">
//                 <ChevronDown className={`w-4 h-4 transition-transform ${addExpanded ? "rotate-180" : ""}`} />
//               </button>
//               <button onClick={addItem} disabled={!newItemName.trim() || addingItem}
//                 className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
//                 {addingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
//               </button>
//             </div>

//             <AnimatePresence>
//               {addExpanded && (
//                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
//                   exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
//                   <div className="grid grid-cols-2 gap-2 mt-3">
//                     <input value={newItemQty} onChange={e => setNewItemQty(e.target.value)} placeholder="Qty" className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-emerald-400" />
//                     <input value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} placeholder="Unit (kg, l, pack…)" className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-emerald-400" />
//                     <select value={newItemCat} onChange={e => setNewItemCat(e.target.value as ItemCategory)}
//                       className="col-span-2 text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white focus:outline-none focus:border-emerald-400">
//                       {Object.entries(CATEGORY_CFG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
//                     </select>
//                     <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="Est. price (£)" className="col-span-2 text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-emerald-400" />
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>

//           {/* Search */}
//           {activeList.items.length > 5 && (
//             <div className="px-5 py-2 border-b border-stone-50">
//               <div className="relative">
//                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300" />
//                 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
//                   className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-100 rounded-sm focus:outline-none focus:border-emerald-400"
//                 />
//               </div>
//             </div>
//           )}

//           {/* Items */}
//           <div className="px-5 py-4 space-y-5">
//             {activeList.items.length === 0 && (
//               <div className="text-center py-10">
//                 <div className="text-4xl mb-3">📝</div>
//                 <p className="text-sm font-bold text-stone-600 mb-1">List is empty</p>
//                 <p className="text-xs text-stone-400">Type an item above and press Enter, or use the AI assistant to generate a list from a meal plan</p>
//               </div>
//             )}

//             {/* Pending by category */}
//             {grouped.map(([cat, items]) => {
//               const cfg = CATEGORY_CFG[cat as ItemCategory] ?? CATEGORY_CFG.OTHER;
//               return (
//                 <div key={cat}>
//                   <div className="flex items-center gap-2 mb-2">
//                     <span>{cfg.emoji}</span>
//                     <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</p>
//                     <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
//                       style={{ color: cfg.color, backgroundColor: cfg.bg }}>{items.length}</span>
//                   </div>
//                   <div className="space-y-1.5">
//                     <AnimatePresence>
//                       {items.map(item => (
//                         <motion.div key={item.id} layout initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 4 }}
//                           className="group flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-3 py-2.5 hover:border-stone-200 transition-all">
//                           <button onClick={() => tickItem(item)}
//                             className="w-6 h-6 rounded-full border-2 border-stone-300 hover:border-emerald-400 flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
//                           </button>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-semibold text-stone-800">{item.name}</p>
//                             {(item.quantity || item.brand) && (
//                               <p className="text-[11px] text-stone-400">{item.quantity}{item.unit ? ` ${item.unit}` : ""}{item.brand ? ` · ${item.brand}` : ""}</p>
//                             )}
//                           </div>
//                           {item.estimatedPrice && <span className="text-xs text-stone-400 flex-shrink-0">£{parseFloat(item.estimatedPrice).toFixed(2)}</span>}
//                           <button onClick={() => deleteItem(item)}
//                             className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 flex-shrink-0 transition-all">
//                             <X className="w-3.5 h-3.5" />
//                           </button>
//                         </motion.div>
//                       ))}
//                     </AnimatePresence>
//                   </div>
//                 </div>
//               );
//             })}

//             {/* Bought items */}
//             {boughtItems.length > 0 && (
//               <div>
//                 <div className="flex items-center gap-2 mb-2">
//                   <Check className="w-3.5 h-3.5 text-emerald-400" />
//                   <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Done ({boughtItems.length})</p>
//                 </div>
//                 <div className="space-y-1.5 opacity-60">
//                   {boughtItems.map(item => (
//                     <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//                       className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-sm px-3 py-2.5">
//                       <button onClick={() => tickItem(item)}
//                         className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all">
//                         <Check className="w-3 h-3 text-white" />
//                       </button>
//                       <span className="text-sm text-stone-400 line-through flex-1">{item.name}</span>
//                       {item.boughtBy && <span className="text-[10px] text-emerald-500 font-semibold flex-shrink-0">✓ {item.boughtBy}</span>}
//                     </motion.div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }